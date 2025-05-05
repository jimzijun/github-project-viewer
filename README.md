# GitHub Project Viewer

A modern web application for browsing GitHub projects, built with React (frontend) and FastAPI + PostgreSQL (backend).

## Project Structure

- `/frontend` - React frontend application
- `/backend` - FastAPI backend application

## Features

- View GitHub projects with details (stars, forks, etc.)
- Navigate between projects with a modern UI
- Like and bookmark your favorite projects
- Read project README files
- PostgreSQL database for persistent storage
- FastAPI backend for data management

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Python (v3.8+)
- Conda (Miniconda or Anaconda)
- Docker (for PostgreSQL database) or PostgreSQL (v12+)

### Quick Start

1. Start the PostgreSQL database using Docker:
   ```bash
   ./start-postgres.sh
   ```

2. Start the backend:
   ```bash
   cd backend
   conda activate github-backend  # After creating the environment
   python run.py
   ```

3. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

For detailed setup instructions, see the [Setup Guide](SETUP.md).

## Development

### Backend

The backend is built with FastAPI and uses SQLAlchemy for database operations. The main components are:

- `main.py` - The main FastAPI application
- `models.py` - SQLAlchemy models
- `schemas.py` - Pydantic schemas for API validation
- `repository.py` - Database operations
- `github_api.py` - GitHub API client

### Frontend

The frontend is built with React and TypeScript. The main components are:

- `src/components/` - React components
- `src/services/` - API services
- `src/types/` - TypeScript type definitions

## Technologies Used

### Backend
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PostgreSQL (Database)
- Pydantic (Data validation)
- HTTPX (Async HTTP client)

### Frontend
- React
- TypeScript
- Emotion (styled components)
- Marked (for Markdown rendering)

## Future Improvements

- Add user authentication
- Implement more GitHub API features
- Add more filters and sorting options
- Add tests for both frontend and backend
