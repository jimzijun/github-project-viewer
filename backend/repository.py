from sqlalchemy.orm import Session
import models
import schemas
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from github_api import github_api
from services.project_repository import project_repository
from services.readme_service import readme_service
from services.trending_service import trending_service
from services.cache_service import cache_service, PROJECT_CACHE_DURATION, README_CACHE_DURATION

# Basic CRUD operations

def get_projects(db: Session, skip: int = 0, limit: int = 100) -> List[models.Project]:
    return project_repository.get_projects(db, skip, limit)

def get_project(db: Session, project_id: str) -> Optional[models.Project]:
    return project_repository.get_project(db, project_id)

def get_project_by_owner_and_name(db: Session, owner: str, name: str) -> Optional[models.Project]:
    """Get a project by owner login and repository name"""
    return project_repository.get_project_by_owner_and_name(db, owner, name)

def create_project(db: Session, project: schemas.ProjectCreate) -> models.Project:
    return project_repository.create_project(db, project)

def update_project(db: Session, project_id: str, project: schemas.ProjectCreate) -> Optional[models.Project]:
    return project_repository.update_project(db, project_id, project)

def delete_project(db: Session, project_id: str) -> bool:
    return project_repository.delete_project(db, project_id)

def search_projects(db: Session, query: str, limit: int = 20) -> List[models.Project]:
    return project_repository.search_projects(db, query, limit)

# Cache validation helper function

def is_cache_valid(cache_time: datetime, cache_duration: int) -> bool:
    """Generic function to check if a cache is valid based on timestamp and duration"""
    return cache_service.is_cache_valid(cache_time, cache_duration)

def is_project_cache_valid(db: Session, project_id: str) -> bool:
    """Check if project data cache is valid (less than 24 hours old)"""
    return trending_service.is_project_cache_valid(db, project_id)

def update_project_cache_date(db: Session, project_id: str) -> None:
    """Update project cache date"""
    project_repository.update_project_cache_date(db, project_id)

# Readme cache operations

def get_readme_cache(db: Session, project_id: str) -> Optional[models.ReadmeCache]:
    """Get readme cache for a project"""
    return readme_service.get_readme_cache(db, project_id)

def upsert_readme_cache(db: Session, project_id: str, readme: str) -> models.ReadmeCache:
    """Create or update readme cache entry"""
    return readme_service.upsert_readme_cache(db, project_id, readme)

def is_readme_cache_valid(db: Session, project_id: str) -> bool:
    """Check if readme cache is valid (less than 1 week old)"""
    return readme_service.is_readme_cache_valid(db, project_id)

# Readme fetching with cache

async def get_readme_with_cache(db: Session, owner: str, repo: str) -> str:
    """
    Get README content with caching
    
    First checks if a cached version exists and is valid (less than 1 week old)
    If not, fetches from GitHub API and updates cache
    """
    return await readme_service.get_readme_with_cache(db, owner, repo)

# Project enhancement with READMEs

async def enhance_projects_with_readme(db: Session, projects: List[models.Project]) -> List[Dict[str, Any]]:
    """
    Add README content to a list of projects
    
    For each project, fetches README with caching and adds it to the project data
    """
    return await trending_service.enhance_projects_with_readme(db, projects)

# Main trending repositories function

async def get_trending_repositories_with_cache(
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
    return await trending_service.get_trending_repositories_with_cache(db, language, since, count) 