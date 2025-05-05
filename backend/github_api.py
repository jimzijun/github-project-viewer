import httpx
import logging
from typing import List, Dict, Any, Optional
import base64
from datetime import datetime
import re
import json

# Configure logger for this module
logger = logging.getLogger(__name__)

class GitHubRateLimitError(Exception):
    """Exception raised when GitHub API rate limit is exceeded."""
    pass

class GitHubApiClient:
    def __init__(self, auth_token: Optional[str] = None):
        self.base_url = "https://api.github.com"
        self.auth_token = auth_token
        self.client = httpx.Client(timeout=30.0)
    
    def _create_headers(self, additional_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """
        Create headers including authentication if token is available
        """
        headers = additional_headers or {}
        
        if self.auth_token:
            headers["Authorization"] = f"token {self.auth_token}"
            
        return headers
    
    def _check_rate_limit_error(self, response: httpx.Response):
        """
        Check if the response indicates a rate limit error and raise GitHubRateLimitError
        """
        if response.status_code == 403:
            try:
                error_data = response.json()
                if "message" in error_data and "API rate limit exceeded" in error_data["message"]:
                    error_msg = error_data.get("message", "API rate limit exceeded")
                    logger.error(f"GitHub API rate limit exceeded: {error_msg}")
                    raise GitHubRateLimitError(error_msg)
            except (json.JSONDecodeError, KeyError):
                # Not a rate limit error or couldn't parse JSON
                pass
    
    async def get_trending_repositories(
        self, 
        language: str = '', 
        since: str = 'monthly', 
        count: int = 10
    ) -> Dict[str, Any]:
        """
        Fetch trending repositories from GitHub
        """
        query = f"language:{language} sort:stars" if language else "sort:stars"
        date_param = self._get_date_query_param(since)
        full_query = f"{query} {date_param}"
        
        all_repos = []
        
        async with httpx.AsyncClient() as client:
            # Request 10 pages with 100 items per page
            for page in range(1, 11):
                url = f"{self.base_url}/search/repositories?q={full_query}&per_page=100&page={page}"
                
                # Log the request
                logger.info(f"Sending GET request to: {url} (page {page})")
                
                try:
                    # Use authentication headers if available
                    headers = self._create_headers()
                    response = await client.get(url, headers=headers)
                    
                    # Check for rate limit errors
                    self._check_rate_limit_error(response)
                    
                    response.raise_for_status()
                    data = response.json()
                    
                    # If no items returned, we've reached the end of results
                    if not data["items"]:
                        break
                    
                    for repo in data["items"]:
                        # Parse license data
                        license_name = None
                        if repo.get("license") and isinstance(repo["license"], dict):
                            license_name = repo["license"].get("name")
                        
                        # Parse pushed_at datetime
                        pushed_at = None
                        if repo.get("pushed_at"):
                            try:
                                pushed_at = datetime.fromisoformat(repo["pushed_at"].replace("Z", "+00:00"))
                            except:
                                pushed_at = None
                        
                        repo_data = {
                            "id": str(repo["id"]),
                            "name": repo["name"],
                            "full_name": repo["full_name"],
                            "description": repo["description"] or "No description provided",
                            "stars": repo["stargazers_count"],
                            "forks": repo["forks_count"],
                            "issues": repo["open_issues_count"],
                            "open_issues_count": repo["open_issues_count"],
                            "owner_login": repo["owner"]["login"],
                            "owner_avatar_url": repo["owner"]["avatar_url"],
                            "language": repo.get("language"),
                            "license": license_name,
                            "tags_url": repo.get("tags_url"),
                            "release_url": repo.get("releases_url", "").replace("{/id}", ""),
                            "collaborators_url": repo.get("collaborators_url", "").replace("{/collaborator}", ""),
                            "pushed_at": pushed_at,
                            "homepage": repo.get("homepage"),
                            "size": repo.get("size"),
                            # Remove readme to let repository layer handle it
                        }
                        all_repos.append(repo_data)
                        
                        # If we've reached the requested count, stop processing more repos
                        if len(all_repos) >= count:
                            break
                    
                    # If we've reached the requested count, stop requesting more pages
                    if len(all_repos) >= count:
                        break
                        
                except GitHubRateLimitError:
                    # Stop making additional requests if rate limit is hit
                    logger.error("GitHub API rate limit exceeded. Stopping further requests.")
                    break
                except Exception as e:
                    logger.error(f"Error fetching page {page}: {str(e)}")
                    # Continue with next page even if one fails
            
            # Trim to the requested count if we have more
            if len(all_repos) > count:
                all_repos = all_repos[:count]
            
            # Check if any repositories were found
            result = {
                "repos": all_repos,
                "message": "No repositories found matching your criteria." if not all_repos else f"Found {len(all_repos)} repositories."
            }
                
            return result
    
    async def get_readme(self, owner: str, repo: str) -> str:
        """
        Get README content for a repository from GitHub API
        """
        url = f"{self.base_url}/repos/{owner}/{repo}/readme"
        
        # Log the request
        logger.info(f"Sending GET request to: {url} (fetching README for {owner}/{repo})")
        
        try:
            async with httpx.AsyncClient() as client:
                # Add explicit Accept header to get raw markdown content instead of HTML
                # and include authentication if available
                headers = self._create_headers({"Accept": "application/vnd.github.raw"})
                response = await client.get(url, headers=headers)
                
                # Check for rate limit errors
                self._check_rate_limit_error(response)
                
                if response.status_code != 200:
                    logger.error(f"Request failed with status {response.status_code}: {url}")
                    return f"# {repo}\n\nNo README available for this repository."
                
                # First try to get the content as raw text
                if response.headers.get('content-type', '').startswith('text/plain'):
                    content = response.text
                    # Transform relative URLs in the content
                    return self._transform_readme_urls(content, owner, repo)
                
                # If the response is not plain text, try to parse it as JSON
                try:
                    # Check if the response body is not empty
                    if not response.text.strip():
                        logger.error(f"Empty response body from GitHub API for {owner}/{repo}")
                        return f"# {repo}\n\nNo README content available for this repository."
                    
                    # Try parsing as JSON
                    data = response.json()
                    
                    # Check if we have content field in the response
                    if not data.get("content"):
                        logger.error(f"No content field in JSON response for {owner}/{repo}")
                        return f"# {repo}\n\nRepository exists but no README content found."
                    
                    # GitHub returns README content as base64 encoded
                    content = data.get("content", "")
                    decoded = self._decode_base64_to_string(content)
                    
                    # Transform relative URLs in the decoded content
                    return self._transform_readme_urls(decoded, owner, repo)
                except ValueError as json_err:
                    # JSON parsing error
                    logger.error(f"Error parsing JSON response for {owner}/{repo}: {str(json_err)}")
                    
                    # Try to return the raw response text if it looks like markdown
                    if '# ' in response.text or '## ' in response.text:
                        logger.info(f"Response appears to be markdown, returning as-is")
                        content = response.text
                        # Transform relative URLs in the content
                        return self._transform_readme_urls(content, owner, repo)
                    
                    # Last resort fallback
                    return f"# {repo}\n\nUnable to parse README content: {str(json_err)}"
        except GitHubRateLimitError as e:
            logger.error(f"GitHub API rate limit exceeded when fetching README: {str(e)}")
            return f"# {repo}\n\nGitHub API rate limit exceeded. Please try again later or use an authentication token."
        except Exception as e:
            logger.error(f"Exception while fetching README for {owner}/{repo}: {str(e)}")
            return f"# {repo}\n\nError loading README: {str(e)}"
    
    def _decode_base64_to_string(self, base64_string: str) -> str:
        """
        Decode base64 to handle Unicode characters correctly
        """
        # Remove line breaks, which GitHub includes in the base64 encoding
        cleaned_base64 = base64_string.replace("\n", "")
        
        try:
            # Decode base64 to bytes
            bytes_data = base64.b64decode(cleaned_base64)
            
            # Convert bytes to string
            return bytes_data.decode('utf-8')
        except Exception as e:
            logger.error(f"Error decoding base64: {e}")
            print(f"Error decoding base64: {e}")
            return "Error decoding README content"
    
    def _get_date_query_param(self, since: str) -> str:
        """
        Get date query parameter based on timeframe
        """
        from datetime import datetime, timedelta
        
        date = datetime.now()
        
        if since == "daily":
            date = date - timedelta(days=1)
        elif since == "weekly":
            date = date - timedelta(weeks=1)
        elif since == "monthly":
            date = date - timedelta(days=30)
        
        formatted_date = date.strftime("%Y-%m-%d")
        return f"created:>{formatted_date}"

    def _transform_readme_urls(self, content: str, owner: str, repo: str) -> str:
        """
        Transform relative URLs in README content to absolute GitHub URLs
        
        Handles:
        1. HTML attributes like src="docs/images/file.png" or href="docs/file.md"
        2. Markdown image references like ![alt text](docs/images/file.png)
        
        Adds the repository's full_name to create proper GitHub URLs
        """
        full_name = f"{owner}/{repo}"
        
        # Pattern to match src or href attributes with relative paths
        # Excludes URLs that already have http:// or https:// prefixes or start with /
        html_pattern = r'(src|href)=["\']((?!http://|https://|/).+?)["\']'
        
        # Pattern to match markdown image/link references: ![text](url) or [text](url)
        # Excludes URLs that already have http:// or https:// prefixes or start with /
        md_pattern = r'(!?\[.+?\])\(((?!http://|https://|/).+?)(?:\s.+?)?\)'
        
        # Function to replace HTML-style URLs
        def replace_html_url(match):
            attr = match.group(1)  # src or href
            path = match.group(2)  # The relative path
            return f'{attr}="https://github.com/{full_name}/raw/main/{path}"'
        
        # Function to replace markdown-style URLs
        def replace_md_url(match):
            text = match.group(1)  # The [text] or ![text] part
            path = match.group(2)  # The relative path
            return f'{text}(https://github.com/{full_name}/raw/main/{path})'
        
        # Replace all HTML-style matches in the content
        transformed_content = re.sub(html_pattern, replace_html_url, content)
        
        # Replace all markdown-style matches in the content
        transformed_content = re.sub(md_pattern, replace_md_url, transformed_content)
        
        return transformed_content

# Create a singleton instance
github_api = GitHubApiClient() 