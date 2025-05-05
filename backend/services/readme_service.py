from sqlalchemy.orm import Session
from typing import Optional
import models
from services.cache_service import cache_service, README_CACHE_DURATION
from github_api import github_api
from services.project_repository import project_repository

class ReadmeService:
    def get_readme_cache(self, db: Session, project_id: str) -> Optional[models.ReadmeCache]:
        """Get readme cache for a project"""
        return db.query(models.ReadmeCache).filter(models.ReadmeCache.project_id == project_id).first()
    
    def upsert_readme_cache(self, db: Session, project_id: str, readme: str) -> models.ReadmeCache:
        """Create or update readme cache entry"""
        db_cache = self.get_readme_cache(db, project_id)
        if db_cache:
            db_cache.readme = readme
            db_cache.cache_date = cache_service.get_current_time()
            db.commit()
            db.refresh(db_cache)
            return db_cache
        
        # Create new entry if not found
        db_cache = models.ReadmeCache(
            project_id=project_id, 
            readme=readme,
            cache_date=cache_service.get_current_time()
        )
        db.add(db_cache)
        db.commit()
        db.refresh(db_cache)
        return db_cache
    
    def is_readme_cache_valid(self, db: Session, project_id: str) -> bool:
        """Check if readme cache is valid (less than 1 week old)"""
        db_cache = self.get_readme_cache(db, project_id)
        if not db_cache:
            return False
        
        return cache_service.is_cache_valid(db_cache.cache_date, README_CACHE_DURATION)
    
    async def get_readme_with_cache(self, db: Session, owner: str, repo: str) -> str:
        """
        Get README content with caching
        
        First checks if a cached version exists and is valid (less than 1 week old)
        If not, fetches from GitHub API and updates cache
        """
        # First find the project in our database
        project = project_repository.get_project_by_owner_and_name(db, owner, repo)
        
        # If project exists in our database
        if project:
            # Check if README cache is valid
            if self.is_readme_cache_valid(db, project.id):
                readme_cache = self.get_readme_cache(db, project.id)
                if readme_cache and readme_cache.readme:
                    return readme_cache.readme
        
        # If no project found or invalid/missing README cache, fetch from GitHub API
        readme_content = await github_api.get_readme(owner, repo)
        
        # If project exists, update cache
        if project:
            self.upsert_readme_cache(db, project.id, readme_content)
        
        return readme_content

# Create a singleton instance
readme_service = ReadmeService() 