from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import models
import schemas
from services.cache_service import cache_service

class ProjectRepository:
    def get_projects(self, db: Session, skip: int = 0, limit: int = 100) -> List[models.Project]:
        """Get a list of projects, ordered by stars"""
        return db.query(models.Project).order_by(models.Project.stars.desc()).offset(skip).limit(limit).all()
    
    def get_project(self, db: Session, project_id: str) -> Optional[models.Project]:
        """Get a project by its ID"""
        return db.query(models.Project).filter(models.Project.id == project_id).first()
    
    def get_project_by_owner_and_name(self, db: Session, owner: str, name: str) -> Optional[models.Project]:
        """Get a project by owner login and repository name"""
        return db.query(models.Project).filter(
            models.Project.owner_login == owner,
            models.Project.name == name
        ).first()
    
    def create_project(self, db: Session, project: schemas.ProjectCreate) -> models.Project:
        """Create a new project in the database"""
        db_project = models.Project(
            id=project.id,
            name=project.name,
            full_name=project.full_name,
            description=project.description,
            stars=project.stars,
            forks=project.forks,
            issues=project.issues,
            open_issues_count=project.open_issues_count,
            owner_login=project.owner_login,
            owner_avatar_url=project.owner_avatar_url,
            language=project.language,
            license=project.license,
            tags_url=project.tags_url,
            release_url=project.release_url,
            collaborators_url=project.collaborators_url,
            pushed_at=project.pushed_at,
            homepage=project.homepage,
            size=project.size,
            cache_date=cache_service.get_current_time()  # Set initial cache date
        )
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project
    
    def update_project(self, db: Session, project_id: str, project: schemas.ProjectCreate) -> Optional[models.Project]:
        """Update an existing project"""
        db_project = self.get_project(db, project_id)
        if db_project:
            for key, value in project.dict().items():
                if key != "readme":  # Skip readme as it's now in a separate table
                    setattr(db_project, key, value)
            db_project.updated_at = cache_service.get_current_time()
            db_project.cache_date = cache_service.get_current_time()  # Update cache date
            db.commit()
            db.refresh(db_project)
        return db_project
    
    def delete_project(self, db: Session, project_id: str) -> bool:
        """Delete a project by its ID"""
        db_project = self.get_project(db, project_id)
        if db_project:
            db.delete(db_project)
            db.commit()
            return True
        return False
    
    def search_projects(self, db: Session, query: str, limit: int = 20) -> List[models.Project]:
        """Search for projects by name or description"""
        search_pattern = f"%{query}%"
        return db.query(models.Project)\
            .filter(
                (models.Project.name.ilike(search_pattern)) | 
                (models.Project.description.ilike(search_pattern))
            )\
            .order_by(models.Project.stars.desc())\
            .limit(limit)\
            .all()
    
    def update_project_cache_date(self, db: Session, project_id: str) -> None:
        """Update project cache date"""
        project = self.get_project(db, project_id)
        if project:
            project.cache_date = cache_service.get_current_time()
            db.commit()
    
    def get_filtered_projects_query(self, db: Session, language: str, date_value: datetime):
        """Create a filtered query for projects based on language and date"""
        query = db.query(models.Project)
        if language:
            query = query.filter(models.Project.language == language)
        query = query.filter(models.Project.created_at > date_value)
        return query

# Create a singleton instance
project_repository = ProjectRepository() 