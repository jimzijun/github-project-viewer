from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import time
import logging
from sqlalchemy import text
from datetime import datetime, timedelta

import models
import schemas
import repository
from database import engine, get_db
from github_api import github_api

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title="GitHub Projects API", description="API for GitHub projects with PostgreSQL backend")

# Configure CORS
origins = [
    "http://localhost:3000",  # React dev server
    "http://localhost:5000",  # Potential production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to GitHub Projects API"}

@app.get("/health", response_model=Dict[str, Any])
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint that verifies the database connection
    """
    health_data = {
        "status": "healthy",
        "timestamp": time.time(),
        "database": {
            "status": "connected",
            "details": "Successfully connected to PostgreSQL"
        }
    }
    
    try:
        # Test database connection with a simple query
        db.execute(text("SELECT 1"))
    except Exception as e:
        health_data["status"] = "unhealthy"
        health_data["database"]["status"] = "disconnected"
        health_data["database"]["details"] = f"Database connection error: {str(e)}"
        return health_data, status.HTTP_503_SERVICE_UNAVAILABLE
    
    return health_data

@app.get("/api/projects/", response_model=List[schemas.Project])
def get_projects(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    projects = repository.get_projects(db, skip=skip, limit=limit)
    return projects

@app.get("/api/projects/{project_id}", response_model=schemas.Project)
def get_project(project_id: str, db: Session = Depends(get_db)):
    db_project = repository.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.post("/api/projects/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return repository.create_project(db=db, project=project)

@app.put("/api/projects/{project_id}", response_model=schemas.Project)
def update_project(project_id: str, project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = repository.update_project(db=db, project_id=project_id, project=project)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    success = repository.delete_project(db=db, project_id=project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

@app.get("/api/search/", response_model=List[schemas.Project])
def search_projects(
    query: str = Query(..., min_length=1),
    limit: int = 20,
    db: Session = Depends(get_db)
):
    projects = repository.search_projects(db=db, query=query, limit=limit)
    return projects

@app.get("/api/trending/", response_model=List[schemas.Project])
async def get_trending_repositories(
    language: Optional[str] = "",
    since: Optional[str] = "monthly",
    count: Optional[int] = 10,
    db: Session = Depends(get_db)
):
    """
    Get trending repositories
    
    Now uses repository layer to handle caching and GitHub API interactions
    """
    logger.info(f"Trending request: language={language}, since={since}, count={count}")
    
    try:
        # Use the new repository function to handle everything
        projects = await repository.get_trending_repositories_with_cache(
            db=db,
            language=language,
            since=since,
            count=count
        )
        
        logger.info(f"Found {len(projects)} matching trending repositories")
        return projects
        
    except Exception as e:
        logger.error(f"Error fetching trending repositories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching trending repositories: {str(e)}")

# New endpoint to get README for a specific repository with caching
@app.get("/api/readme/{owner}/{repo}")
async def get_readme(
    owner: str,
    repo: str,
    db: Session = Depends(get_db)
):
    """
    Get README content for a repository with caching
    """
    try:
        readme = await repository.get_readme_with_cache(db, owner, repo)
        return {"owner": owner, "repo": repo, "readme": readme}
    except Exception as e:
        logger.error(f"Error fetching README for {owner}/{repo}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching README: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 