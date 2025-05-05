from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProjectBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    full_name: Optional[str] = None
    stars: int
    forks: int
    issues: int
    open_issues_count: Optional[int] = None
    owner_login: Optional[str] = None
    owner_avatar_url: Optional[str] = None
    language: Optional[str] = None
    license: Optional[str] = None
    tags_url: Optional[str] = None
    release_url: Optional[str] = None
    collaborators_url: Optional[str] = None
    pushed_at: Optional[datetime] = None
    homepage: Optional[str] = None
    size: Optional[int] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    cache_date: Optional[datetime] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

class ReadmeCacheBase(BaseModel):
    project_id: str
    readme: Optional[str] = None

class ReadmeCacheCreate(ReadmeCacheBase):
    pass

class ReadmeCache(ReadmeCacheBase):
    id: int
    cache_date: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True 