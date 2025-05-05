#!/bin/bash

# Check if the container exists and is running
if [ "$(docker ps -q -f name=github-postgres)" ]; then
    echo "PostgreSQL container is already running"
else
    # Check if the container exists but is not running
    if [ "$(docker ps -aq -f name=github-postgres)" ]; then
        echo "Starting existing PostgreSQL container..."
        docker start github-postgres
    else
        echo "Creating new PostgreSQL container..."
        docker run --name github-postgres \
            -e POSTGRES_PASSWORD=postgres \
            -e POSTGRES_DB=github_projects \
            -p 5432:5432 \
            -d postgres:14
    fi
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Print container status
echo "PostgreSQL container status:"
docker ps -f name=github-postgres

echo "Database is ready at: postgresql://postgres:postgres@localhost:5432/github_projects"
echo "You can now start the backend server." 