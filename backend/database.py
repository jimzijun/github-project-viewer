import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment or use a default
def get_database_url():
    # Prioritize environment variable if set
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")
    
    # For Docker PostgreSQL setup
    docker_url = "postgresql://postgres:postgres@localhost:5432/github_projects"
    
    # For local PostgreSQL setup
    local_url = f"postgresql://{os.getenv('USER')}@localhost:5432/github_projects"
    
    # Try to determine if we're using Docker or local PostgreSQL
    # Default to Docker setup as it's more likely to work with the defaults
    return docker_url

DATABASE_URL = get_database_url()

print(f"Connecting to database: {DATABASE_URL}")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 