# GitHub Project Viewer - Setup Guide

This guide will walk you through the steps to set up and run both the backend and frontend of the GitHub Project Viewer application.

## Step 1: Setup PostgreSQL Database

### Option A: Using Docker (Recommended)

1. Pull the PostgreSQL Docker image:
   ```bash
   docker pull postgres:14
   ```

2. Start a PostgreSQL container:
   ```bash
   docker run --name github-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=github_projects -p 5432:5432 -d postgres:14
   ```

3. Verify the container is running:
   ```bash
   docker ps
   ```

### Option B: Using Homebrew

1. Ensure PostgreSQL is installed and running:
   ```bash
   brew services list | grep postgresql
   ```

2. If not running, start PostgreSQL:
   ```bash
   brew services start postgresql@14
   ```

3. Create the database:
   ```bash
   # Connect to PostgreSQL
   psql postgres
   
   # In the PostgreSQL prompt, create the database and exit
   CREATE DATABASE github_projects;
   \q
   ```

## Step 2: Setup and Run the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate the conda environment:
   ```bash
   # Create the environment from the environment.yml file
   conda env create -f environment.yml
   
   # Activate the environment
   conda activate github-backend
   ```

3. Run the backend server:
   ```bash
   python run.py
   ```

   The backend server will start on http://localhost:8000. You can access the API documentation at http://localhost:8000/docs.

## Step 3: Run the Frontend

1. Open a new terminal window (keep the backend running in the first one)

2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

3. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

   The frontend will be available at http://localhost:3000.

## Testing the Connection

1. Access the frontend at http://localhost:3000
2. The frontend should connect to the backend and display GitHub projects
3. If you encounter a connection error, ensure both servers are running

## Troubleshooting

### Database Issues:

- **Using Docker**: If you can't connect to the database, check if the container is running with `docker ps`
- **Connection refused**: Make sure the PostgreSQL port (5432) is not being used by another application
- **Authentication failed**: When using Docker, the default username is "postgres" and password is "postgres"

### Backend Issues:

- **Database connection error**: Check if PostgreSQL is running and the database exists
- **Module not found errors**: Ensure you've activated the conda environment with `conda activate github-backend`
- **Port already in use**: If port 8000 is already used, modify `run.py` to use a different port

### Frontend Issues:

- **Cannot connect to backend**: Ensure the backend is running and check for any CORS issues
- **Missing dependencies**: Run `npm install` in the frontend directory

## API Endpoints

The backend provides the following endpoints:

- `GET /api/trending/` - Get trending GitHub repositories
- `GET /api/projects/` - Get all projects from the database
- `GET /api/projects/{id}` - Get a specific project by ID
- `GET /api/search/?query=text` - Search for projects

You can explore all endpoints in the interactive API documentation at http://localhost:8000/docs. 