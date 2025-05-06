import { Project } from '../types/project';

// API base URL
const API_BASE_URL = 'https://api.github.com';
const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN || '';

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

// Increase cache duration for READMEs to improve performance
const README_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Interface for cache entries
interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

// GitHub API response types
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  homepage: string | null;
  topics: string[];
  open_issues_count: number;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

interface GitHubReadmeResponse {
  name: string;
  path: string;
  sha: string;
  download_url: string;
  content?: string;
  encoding?: string;
}

// Helper function for making API requests
async function fetchAPI<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github.v3+json',
    ...options.headers
  };
  
  // Add authorization if token exists
  const finalHeaders = GITHUB_TOKEN 
    ? { ...headers, Authorization: `token ${GITHUB_TOKEN}` }
    : headers;

  const response = await fetch(url, {
    headers: finalHeaders,
    ...options
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${await response.text()}`);
  }

  return await response.json();
}

// Get item from cache
function getCacheItem<T>(key: string): T | null {
  const item = localStorage.getItem(`github_cache_${key}`);
  if (!item) return null;

  try {
    const cacheEntry: CacheEntry<T> = JSON.parse(item);
    const now = Date.now();
    
    // Check if cache is expired, using README-specific duration for README items
    const cacheDuration = key.startsWith('readme_') ? README_CACHE_DURATION : CACHE_DURATION;
    
    if (now - cacheEntry.timestamp > cacheDuration) {
      localStorage.removeItem(`github_cache_${key}`);
      return null;
    }
    
    return cacheEntry.data;
  } catch (e) {
    console.error('Cache parse error:', e);
    return null;
  }
}

// Set item in cache
function setCacheItem<T>(key: string, data: T): void {
  const cacheEntry: CacheEntry<T> = {
    timestamp: Date.now(),
    data
  };
  
  try {
    localStorage.setItem(`github_cache_${key}`, JSON.stringify(cacheEntry));
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

// Helper function to map GitHub repository object to our Project interface
function mapGitHubRepoToProject(repo: GitHubRepo): Project {
  return {
    id: repo.id.toString(),
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description || '',
    html_url: repo.html_url,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    language: repo.language || '',
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    homepage: repo.homepage,
    topics: repo.topics || [],
    owner_avatar_url: repo.owner?.avatar_url || '',
    owner_login: repo.owner?.login || '',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    issues: repo.open_issues_count || 0,
    readme: ''
  };
}

// Create a map to track currently loading README promises to avoid duplicate requests
const pendingReadmeRequests = new Map<string, Promise<{readme: string}>>();

// Projects API
export const projectsApi = {
  // Get all projects
  getProjects: async (skip = 0, limit = 100): Promise<Project[]> => {
    const cacheKey = `projects_${skip}_${limit}`;
    const cachedData = getCacheItem<Project[]>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    const response = await fetchAPI<GitHubSearchResponse>(
      `/search/repositories?q=stars:>1000&sort=stars&order=desc&page=${Math.floor(skip/limit) + 1}&per_page=${limit}`
    );
    const projects = response.items.map(mapGitHubRepoToProject);
    
    setCacheItem(cacheKey, projects);
    return projects;
  },

  // Get a project by ID (owner/repo format)
  getProject: async (projectId: string): Promise<Project> => {
    const cacheKey = `project_${projectId}`;
    const cachedData = getCacheItem<Project>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    const [owner, repo] = projectId.split('/');
    const response = await fetchAPI<GitHubRepo>(`/repos/${owner}/${repo}`);
    const project = mapGitHubRepoToProject(response);
    
    setCacheItem(cacheKey, project);
    return project;
  },

  // Search projects
  searchProjects: async (query: string, limit = 20): Promise<Project[]> => {
    const cacheKey = `search_${query}_${limit}`;
    const cachedData = getCacheItem<Project[]>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    const response = await fetchAPI<GitHubSearchResponse>(
      `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`
    );
    const projects = response.items.map(mapGitHubRepoToProject);
    
    setCacheItem(cacheKey, projects);
    return projects;
  },

  // Get trending repositories
  getTrendingRepositories: async (
    language: string = '',
    since: Date | string = 'monthly',
    count: number = 10
  ): Promise<Project[]> => {
    // Convert date to string for caching
    const sinceStr = since instanceof Date ? since.toISOString().split('T')[0] : since;
    const cacheKey = `trending_${language}_${sinceStr}_${count}`;
    const cachedData = getCacheItem<Project[]>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // Get query date
    let dateQuery: string;
    
    if (since instanceof Date) {
      // If it's a Date object, use the date directly
      dateQuery = `created:>${since.toISOString().split('T')[0]}`;
    } else {
      // For backward compatibility, handle string values
      const date = new Date();
      
      switch (since) {
        case 'daily':
          date.setDate(date.getDate() - 1);
          dateQuery = `created:>${date.toISOString().split('T')[0]}`;
          break;
        case 'weekly':
          date.setDate(date.getDate() - 7);
          dateQuery = `created:>${date.toISOString().split('T')[0]}`;
          break;
        case 'monthly':
        default:
          date.setMonth(date.getMonth() - 1);
          dateQuery = `created:>${date.toISOString().split('T')[0]}`;
          break;
      }
    }
    
    // Build language filter if specified
    const languageQuery = language ? `language:${language}` : '';
    
    // Combine queries
    const query = [
      'stars:>10',
      dateQuery,
      languageQuery
    ].filter(Boolean).join(' ');
    
    const response = await fetchAPI<GitHubSearchResponse>(
      `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${count}`
    );
    
    const projects = response.items.map(mapGitHubRepoToProject);
    setCacheItem(cacheKey, projects);
    return projects;
  },
  
  // Get README content for a specific repository
  getReadme: async (owner: string, repo: string): Promise<{readme: string}> => {
    // Check cache first
    const cacheKey = `readme_${owner}_${repo}`;
    const cachedData = getCacheItem<{readme: string}>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    // Check if this README is already being fetched
    const requestKey = `${owner}/${repo}`;
    if (pendingReadmeRequests.has(requestKey)) {
      return pendingReadmeRequests.get(requestKey)!;
    }
    
    // Create a new request promise
    const fetchPromise = (async () => {
      try {
        // Try to fetch readme
        const readmeResponse = await fetchAPI<GitHubReadmeResponse>(
          `/repos/${owner}/${repo}/readme`
        );
        
        let readme = '';
        
        // Only decode if content is available
        if (readmeResponse.content && readmeResponse.encoding === 'base64') {
          // Decode base64 content in chunks to prevent memory issues with large READMEs
          const chunkedContent = readmeResponse.content.match(/.{1,5000}/g) || [];
          readme = chunkedContent.map(chunk => atob(chunk)).join('');
        }
        
        const result = { readme };
        
        // Cache the result with a longer duration for READMEs
        const cacheEntry: CacheEntry<{readme: string}> = {
          timestamp: Date.now(),
          data: result
        };
        
        try {
          localStorage.setItem(`github_cache_${cacheKey}`, JSON.stringify(cacheEntry));
        } catch (e) {
          console.error('Cache write error for README:', e);
        }
        
        return result;
      } catch (error) {
        console.error(`Error fetching README for ${owner}/${repo}:`, error);
        return { readme: '' };
      } finally {
        // Remove this request from pending map once completed
        pendingReadmeRequests.delete(requestKey);
      }
    })();
    
    // Store the promise in the pending requests map
    pendingReadmeRequests.set(requestKey, fetchPromise);
    
    return fetchPromise;
  },
  
  // Clear cache
  clearCache: () => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('github_cache_'))
      .forEach(key => localStorage.removeItem(key));
  }
}; 