#!/bin/bash

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until pg_isready -h postgres -p 5432 -U auto_specs_user > /dev/null 2>&1; do
  echo "  PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is ready!"

# Initialize database schema
echo "Initializing database schema..."
python database_design_pg.py

# Start uvicorn
echo "Starting FastAPI application..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
