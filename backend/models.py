from sqlalchemy import Column, Integer, String, Text, DateTime, func, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from database import Base

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    full_name = Column(String(255), nullable=True, index=True)
    description = Column(Text, nullable=True)
    stars = Column(Integer, nullable=False, default=0)
    forks = Column(Integer, nullable=False, default=0)
    issues = Column(Integer, nullable=False, default=0)
    open_issues_count = Column(Integer, nullable=True)
    owner_login = Column(String(255), nullable=True)
    owner_avatar_url = Column(String(255), nullable=True)
    language = Column(String(100), nullable=True)
    license = Column(String(255), nullable=True)
    tags_url = Column(String(255), nullable=True)
    release_url = Column(String(255), nullable=True)
    collaborators_url = Column(String(255), nullable=True)
    pushed_at = Column(DateTime(timezone=True), nullable=True)
    homepage = Column(String(255), nullable=True)
    size = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    cache_date = Column(DateTime(timezone=True), nullable=True)

class ReadmeCache(Base):
    __tablename__ = "readme_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    readme = Column(Text, nullable=True)
    cache_date = Column(DateTime(timezone=True), server_default=func.now()) 