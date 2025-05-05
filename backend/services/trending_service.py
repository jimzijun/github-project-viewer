from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
import schemas
import models
from github_api import github_api
from services.project_repository import project_repository
from services.readme_service import readme_service
from services.cache_service import cache_service, PROJECT_CACHE_DURATION

class TrendingService:
    async def enhance_projects_with_readme(self, db: Session, projects: List) -> List[Dict[str, Any]]:
        """
        Add README content to a list of projects
        
        For each project, fetches README with caching and adds it to the project data
        """
        projects_with_readme = []
        
        for project in projects:
            # Get README with caching
            readme = await readme_service.get_readme_with_cache(db, project.owner_login, project.name)
            
            # Create complete project with readme
            project_dict = {**project.__dict__}
            if "_sa_instance_state" in project_dict:
                del project_dict["_sa_instance_state"]
            project_dict["readme"] = readme
            projects_with_readme.append(project_dict)
        
        return projects_with_readme
    
    def is_project_cache_valid(self, db: Session, project_id: str) -> bool:
        """Check if project data cache is valid (less than 24 hours old)"""
        project = project_repository.get_project(db, project_id)
        if not project or not project.cache_date:
            return False
        
        return cache_service.is_cache_valid(project.cache_date, PROJECT_CACHE_DURATION)
    
    async def _refresh_stale_projects(self, db: Session, stale_projects: List[str], language: str, since: str) -> None:
        """Refresh stale projects from GitHub API"""
        if not stale_projects:
            return
            
        try:
            # Fetch fresh data for stale projects
            fresh_data = await github_api.get_trending_repositories(
                language=language,
                since=since,
                count=50
            )
            
            # Update stale projects
            for repo in fresh_data["repos"]:
                project_id = repo.get("id")
                if project_id in stale_projects:
                    project = schemas.ProjectCreate(**repo)
                    project_repository.update_project(db, project_id, project)
                    project_repository.update_project_cache_date(db, project_id)
        except Exception as e:
            # Continue with existing data if refresh fails
            pass
    
    async def _fetch_and_save_new_projects(self, db: Session, language: str, since: str, count: int) -> None:
        """Fetch new projects from GitHub API and save them to database"""
        try:
            result = await github_api.get_trending_repositories(
                language=language,
                since=since,
                count=count
            )
            
            # Save new projects to database
            for repo in result["repos"]:
                project_id = repo.get("id")
                existing_project = project_repository.get_project(db, project_id)
                
                if existing_project:
                    # Update existing project
                    project = schemas.ProjectCreate(**repo)
                    project_repository.update_project(db, project_id, project)
                else:
                    # Create new project
                    project = schemas.ProjectCreate(**repo)
                    project_repository.create_project(db, project)
        except Exception as e:
            # Let the caller handle the exception
            raise e
    
    async def get_trending_repositories_with_cache(
        self,
        db: Session,
        language: str = '',
        since: str = 'monthly',
        count: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get trending repositories with caching
        
        First tries to find repositories in database
        Refreshes stale data from GitHub API
        Returns top repositories with READMEs
        """
        # Get date for filtering based on timeframe
        date_param = github_api._get_date_query_param(since)
        date_value = datetime.strptime(date_param.split(">")[1], "%Y-%m-%d")
        
        # Query database for matching projects
        query = project_repository.get_filtered_projects_query(db, language, date_value)
        top_projects = query.order_by(models.Project.stars.desc()).limit(50).all()
        
        # Identify stale projects that need refresh
        stale_projects = []
        for project in top_projects:
            if not self.is_project_cache_valid(db, project.id):
                stale_projects.append(project.id)
        
        # Refresh stale projects from GitHub API
        await self._refresh_stale_projects(db, stale_projects, language, since)
        
        # Re-query to get fresh data after updates
        top_projects = query.order_by(models.Project.stars.desc()).limit(count).all()
        
        # If we have enough projects, add READMEs and return
        if len(top_projects) >= count:
            return await self.enhance_projects_with_readme(db, top_projects)
        
        # If not enough projects, fetch from GitHub API
        try:
            await self._fetch_and_save_new_projects(db, language, since, count)
            
            # Query again after adding new projects
            top_projects = query.order_by(models.Project.stars.desc()).limit(count).all()
            return await self.enhance_projects_with_readme(db, top_projects)
            
        except Exception as e:
            # If API fails, return what we have
            if top_projects:
                return await self.enhance_projects_with_readme(db, top_projects)
            raise e

# Create a singleton instance
trending_service = TrendingService() 