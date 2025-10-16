# Auto Specs Manager

A full-stack web application for automotive enthusiasts to track engine builds, performance specifications, parts inventory, and build costs. Built with React, FastAPI, and PostgreSQL.

## Features

### Build Management
- 📋 **Comprehensive Build Tracking** - Track all engine specifications including displacement, compression ratios, camshaft specs, ring gaps, and bearing clearances
- 🎯 **Performance Targets** - Set target horsepower, torque, and RPM goals for your builds
- 📊 **Build Summary** - Visual dashboard showing key metrics and total investment
- 🔧 **Parts Inventory** - Track engine and vehicle parts with costs, brands, and part numbers
- 💰 **Cost Tracking** - Automatic calculation of total build investment from all parts

### User Features
- 🔐 **User Authentication** - Secure login with JWT tokens
- 🌐 **Google OAuth** - Sign in with your Google account
- 👤 **User Profiles** - Manage personal information and phone verification
- 🏗️ **Multi-Build Support** - Create and manage multiple engine builds

### Technical Specifications
- ⚙️ **Engine Specs** - Bore, stroke, rod length, deck clearance, piston dome, chamber volume, and more
- 📐 **Compression Calculations** - Track static and dynamic compression ratios
- 🎚️ **Camshaft Details** - Duration, lift, and LSA specifications
- 🔩 **Precision Measurements** - Ring gap measurements and bearing clearances
- 📝 **Build Notes** - Add detailed notes and observations

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Axios** for API communication
- **Vite** for build tooling
- **CSS3** with custom design system

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Production-grade database
- **Alembic** - Database migration management
- **Pydantic** - Data validation
- **JWT** - Secure authentication
- **Google OAuth 2.0** - Third-party authentication

### Infrastructure
- **Docker** & **Docker Compose** - Containerized deployment
- **Uvicorn** - ASGI server
- **Nginx-ready** - Production deployment support

## Quick Start

### Prerequisites
- Docker Desktop
- Docker Compose
- Git

### Running the Application

1. **Clone the repository:**
```bash
git clone <repository-url>
cd auto_specs
```

2. **Set up environment variables:**

Create `backend/.env`:
```env
DATABASE_URL=postgresql://auto_specs_user:auto_specs_pass@postgres:5432/auto_specs_db
SECRET_KEY=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

3. **Build and start containers:**
```bash
docker compose up --build
```

4. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

5. **Stop the application:**
```bash
docker compose down
```

## Database Migrations

The application uses Alembic for database schema versioning.

### Running Migrations

```bash
# Access the backend container
docker compose exec backend bash

# Run pending migrations
alembic upgrade head

# Check current migration version
alembic current

# View migration history
alembic history
```

### Creating New Migrations

```bash
# Create a new migration
alembic revision -m "description_of_changes"

# Or auto-generate from model changes
alembic revision --autogenerate -m "description"
```

### Migration Files

Migrations are stored in `backend/migrations/versions/` with sequential numbering:
- `001_add_ring_gap_and_cam_bearing_clearance_fields.py`
- `002_add_cost_to_parts.py`

### Rollback Migrations

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific version
alembic downgrade 001

# Rollback all migrations
alembic downgrade base
```

## Development

### Project Structure

```
auto_specs/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── migrations/             # Alembic migrations
│   │   └── versions/           # Migration files
│   ├── database_design_pg.py   # PostgreSQL schema
│   └── .env                    # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/              # React pages
│   │   ├── components/         # React components
│   │   ├── context/            # React context providers
│   │   ├── services/           # API services
│   │   └── App.tsx             # Main app component
│   ├── package.json            # Node dependencies
│   └── .env                    # Frontend environment variables
├── docker-compose.yml          # Multi-container setup
└── README.md
```

### Running Locally (Without Docker)

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Database Schema

### Core Tables

- **users** - User accounts and authentication
- **builds** - Engine build specifications and targets
- **parts** - Parts inventory with costs
- **engine_parts** - Parts used in engine builds
- **vehicle_parts** - Parts used in vehicle builds
- **vehicle_info** - Vehicle details
- **drivetrain** - Drivetrain specifications
- **tuning** - ECU tuning information
- **performance_tests** - Dyno and track performance data
- **maintenance_events** - Maintenance history

## API Documentation

FastAPI provides interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Login with Google OAuth
- `GET /api/auth/me` - Get current user info

#### Builds
- `GET /api/builds` - List all builds for current user
- `GET /api/builds/{id}` - Get build details
- `POST /api/builds` - Create new build
- `PUT /api/builds/{id}` - Update build
- `DELETE /api/builds/{id}` - Delete build

## Features in Detail

### Build Creation

When creating a build, users can enter:

1. **Basic Information**
   - Build name (required)
   - Use type (street, race, street/strip)
   - Fuel type (pump gas, E85, race gas)

2. **Performance Targets**
   - Target horsepower
   - Target torque
   - Rev limit RPM

3. **Engine Specifications** (15+ fields)
   - Displacement
   - Bore and stroke
   - Rod length
   - Compression ratios
   - Deck clearance
   - Piston and chamber volumes
   - Gasket specifications
   - Balance and flywheel details

4. **Camshaft Specifications**
   - Model/part number
   - Intake/exhaust duration
   - Intake/exhaust lift
   - Lobe separation angle

5. **Ring Gap Measurements**
   - Top ring gap
   - Second ring gap
   - Oil ring gap

6. **Bearing Clearances**
   - Cam bearing clearance
   - (More clearances can be added)

### Cost Tracking

The application automatically tracks build costs:

- Add cost to any engine or vehicle part
- View individual part costs in build details
- See total investment in build summary
- Track budget vs. actual spending

### Build Summary Dashboard

Each build displays:

- **Displacement** - Total cubic inches
- **Target Power** - Horsepower goal
- **Compression** - Static compression ratio
- **Total Investment** - Sum of all part costs

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Google OAuth 2.0 integration
- Environment variable configuration
- CORS protection
- SQL injection prevention

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run migrations if schema changes
5. Test thoroughly
6. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions:
- Create an issue on GitHub
- Check API documentation at `/docs`
- Review migration history for schema changes

## Roadmap

- [ ] Performance comparison charts
- [ ] Goal validation (check if targets are achievable)
- [ ] Parts marketplace integration
- [ ] Build sharing and social features
- [ ] Mobile app
- [ ] Advanced analytics and reporting
- [ ] Dyno sheet uploads
- [ ] Maintenance scheduling
- [ ] Parts cost history tracking
