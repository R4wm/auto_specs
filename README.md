# Auto Specs Manager

A FastAPI web application for tracking engine builds, specifications, and maintenance history.

## Features

- 📋 View engine build specifications
- 🔧 Track maintenance events (oil changes, repairs, inspections)
- 📦 Record parts used in maintenance
- ⏱️ Track engine hours and odometer readings
- 🐳 Fully Dockerized

## Quick Start with Docker

### Prerequisites
- Docker
- Docker Compose

### Running the Application

1. Build and start the container:
```bash
docker-compose up --build
```

2. Access the web interface:
```
http://localhost:8000
```

3. Stop the application:
```bash
docker-compose down
```

## Running Locally (Without Docker)

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python main.py
```

4. Access the web interface:
```
http://localhost:8000
```

## Database

The application uses SQLite with the following tables:

- `builds` - Engine build specifications
- `parts` - Parts inventory
- `build_parts` - Parts used in builds
- `maintenance_events` - Maintenance history
- `maintenance_parts` - Parts used in maintenance
- `vendors`, `orders`, `order_items` - Order tracking

## Adding Maintenance Events

1. Navigate to a build's detail page
2. Click "Add Maintenance"
3. Fill in:
   - Event date
   - Event type (oil change, repair, etc.)
   - Engine hours (optional)
   - Odometer reading (optional)
   - Parts used with part numbers

## API Documentation

FastAPI provides automatic API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
