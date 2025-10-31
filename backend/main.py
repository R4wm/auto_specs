from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_optional,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from sms import send_verification_code, verify_code
from db import get_db_cursor, row_to_dict

# Import extended API routes
from api_extensions import router as extensions_router
from todo_api import router as todo_router

# Load environment variables
load_dotenv()

app = FastAPI(title="Auto Specs Manager API", version="1.0.0")

# CORS Configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        if os.getenv('ENVIRONMENT') == 'production':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        return response

app.add_middleware(SecurityHeadersMiddleware)

# Include additional API routes
app.include_router(extensions_router)
app.include_router(todo_router)

# Pydantic Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token

class SMSSendRequest(BaseModel):
    phone_number: str

class SMSVerifyRequest(BaseModel):
    phone_number: str
    verification_code: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class BuildCreate(BaseModel):
    # Basic Info
    name: str
    use_type: Optional[str] = None
    fuel_type: Optional[str] = None
    notes: Optional[str] = None

    # Performance Targets
    target_hp: Optional[float] = None
    target_torque: Optional[float] = None
    rev_limit_rpm: Optional[int] = None

    # Engine Specs
    displacement_ci: Optional[float] = None
    bore_in: Optional[float] = None
    stroke_in: Optional[float] = None
    rod_len_in: Optional[float] = None
    deck_clear_in: Optional[float] = None
    piston_cc: Optional[float] = None
    chamber_cc: Optional[float] = None
    gasket_bore_in: Optional[float] = None
    gasket_thickness_in: Optional[float] = None
    quench_in: Optional[float] = None
    static_cr: Optional[float] = None
    dynamic_cr: Optional[float] = None
    balance_oz: Optional[float] = None
    flywheel_teeth: Optional[int] = None
    firing_order: Optional[str] = None

    # Camshaft Specs
    camshaft_model: Optional[str] = None
    camshaft_duration_int: Optional[str] = None
    camshaft_duration_exh: Optional[str] = None
    camshaft_lift_int: Optional[float] = None
    camshaft_lift_exh: Optional[float] = None
    camshaft_lsa: Optional[float] = None

    # Ring Gap Measurements
    ring_gap_top_in: Optional[float] = None
    ring_gap_second_in: Optional[float] = None
    ring_gap_oil_in: Optional[float] = None

    # Bearing Clearances
    cam_bearing_clearance_in: Optional[float] = None

    # Vehicle Information
    vehicle_year: Optional[int] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_trim: Optional[str] = None
    vin: Optional[str] = None
    vehicle_weight_lbs: Optional[float] = None

    # Transmission
    transmission_type: Optional[str] = None
    transmission_model: Optional[str] = None
    transmission_gears: Optional[int] = None
    final_drive_ratio: Optional[str] = None

    # Suspension & Handling
    suspension_front: Optional[str] = None
    suspension_rear: Optional[str] = None
    spring_rate_front: Optional[str] = None
    spring_rate_rear: Optional[str] = None
    sway_bar_front: Optional[str] = None
    sway_bar_rear: Optional[str] = None

    # Tires & Wheels
    tire_size_front: Optional[str] = None
    tire_size_rear: Optional[str] = None
    tire_brand: Optional[str] = None
    tire_model: Optional[str] = None
    wheel_size_front: Optional[str] = None
    wheel_size_rear: Optional[str] = None

    # Fluids & Lubricants
    engine_oil_type: Optional[str] = None
    engine_oil_weight: Optional[str] = None
    engine_oil_capacity: Optional[str] = None
    transmission_fluid_type: Optional[str] = None
    differential_fluid_type: Optional[str] = None
    coolant_type: Optional[str] = None

# ============= Authentication Endpoints =============

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(req: RegisterRequest):
    """Register a new user with email/password"""
    with get_db_cursor() as cursor:
        # Check if user already exists
        cursor.execute('SELECT id FROM users WHERE email = %s', (req.email,))
        existing_user = cursor.fetchone()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create user
        password_hash = get_password_hash(req.password)
        cursor.execute(
            'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (%s, %s, %s, %s) RETURNING id',
            (req.email, password_hash, req.first_name, req.last_name)
        )
        user_id = cursor.fetchone()['id']

        # Fetch created user
        cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
        user_row = cursor.fetchone()

    user = row_to_dict(user_row)

    # Create access token with user metadata
    access_token = create_access_token(data={
        "sub": str(user_id),
        "email": user['email'],
        "first_name": user.get('first_name', ''),
        "last_name": user.get('last_name', ''),
        "phone_verified": user.get('phone_verified', False)
    })

    # Remove sensitive data
    user.pop('password_hash', None)

    return TokenResponse(
        access_token=access_token,
        user=user
    )

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    """Login with email/password"""
    with get_db_cursor() as cursor:
        cursor.execute('SELECT * FROM users WHERE email = %s', (req.email,))
        user_row = cursor.fetchone()

    if not user_row:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = row_to_dict(user_row)

    # Verify password
    if not user.get('password_hash') or not verify_password(req.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create access token with user metadata
    access_token = create_access_token(data={
        "sub": str(user['id']),
        "email": user['email'],
        "first_name": user.get('first_name', ''),
        "last_name": user.get('last_name', ''),
        "phone_verified": user.get('phone_verified', False)
    })

    # Remove sensitive data
    user.pop('password_hash', None)

    return TokenResponse(
        access_token=access_token,
        user=user
    )

@app.post("/api/auth/google", response_model=TokenResponse)
async def google_auth(req: GoogleAuthRequest):
    """Authenticate with Google ID token"""
    try:
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(
            req.credential,
            google_requests.Request(),
            os.getenv('GOOGLE_CLIENT_ID')
        )

        email = idinfo.get('email')
        given_name = idinfo.get('given_name', '')
        family_name = idinfo.get('family_name', '')
        google_id = idinfo.get('sub')

        if not email:
            raise HTTPException(status_code=400, detail="Email not found in Google token")

        with get_db_cursor() as cursor:
            # Check if user exists
            cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
            user_row = cursor.fetchone()

            if user_row:
                user_id = user_row['id']
                # Update OAuth info if not set
                if not user_row['oauth_provider']:
                    cursor.execute(
                        'UPDATE users SET oauth_provider = %s, oauth_provider_id = %s WHERE id = %s',
                        ('google', google_id, user_id)
                    )
            else:
                # Create new user
                cursor.execute(
                    '''INSERT INTO users (email, first_name, last_name, oauth_provider, oauth_provider_id)
                       VALUES (%s, %s, %s, %s, %s) RETURNING id''',
                    (email, given_name, family_name, 'google', google_id)
                )
                user_id = cursor.fetchone()['id']

            # Fetch user
            cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
            user_row = cursor.fetchone()

        user = row_to_dict(user_row)
        user.pop('password_hash', None)

        # Create access token with user metadata
        access_token = create_access_token(data={
            "sub": str(user_id),
            "email": user['email'],
            "first_name": user.get('first_name', ''),
            "last_name": user.get('last_name', ''),
            "phone_verified": user.get('phone_verified', False)
        })

        return TokenResponse(
            access_token=access_token,
            user=user
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

@app.post("/api/auth/sms/send")
async def send_sms(req: SMSSendRequest):
    """Send SMS verification code"""
    if not req.phone_number.startswith('+'):
        raise HTTPException(status_code=400, detail="Phone number must be in E.164 format (e.g., +14155552671)")

    success = send_verification_code(req.phone_number)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send verification code")

    return {"message": "Verification code sent successfully"}

@app.post("/api/auth/sms/verify", response_model=TokenResponse)
async def verify_sms(req: SMSVerifyRequest):
    """Verify SMS code and login/register"""
    is_valid = verify_code(req.phone_number, req.verification_code)

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    with get_db_cursor() as cursor:
        # Check if user exists with this phone number
        cursor.execute('SELECT * FROM users WHERE phone_number = %s', (req.phone_number,))
        user_row = cursor.fetchone()

        if user_row:
            user_id = user_row['id']

            # Mark phone as verified if not already
            if not user_row['phone_verified']:
                cursor.execute('UPDATE users SET phone_verified = TRUE WHERE id = %s', (user_id,))
        else:
            # New user - create account
            email = f"{req.phone_number.replace('+', '')}@sms.placeholder"

            cursor.execute(
                '''INSERT INTO users (email, phone_number, phone_verified, first_name, last_name)
                   VALUES (%s, %s, TRUE, %s, %s) RETURNING id''',
                (email, req.phone_number, req.first_name or '', req.last_name or '')
            )
            user_id = cursor.fetchone()['id']

        # Fetch user
        cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
        user_row = cursor.fetchone()

    user = row_to_dict(user_row)
    user.pop('password_hash', None)

    # Create access token with user metadata
    access_token = create_access_token(data={
        "sub": str(user_id),
        "email": user['email'],
        "first_name": user.get('first_name', ''),
        "last_name": user.get('last_name', ''),
        "phone_verified": user.get('phone_verified', False)
    })

    return TokenResponse(
        access_token=access_token,
        user=user
    )

@app.get("/api/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user"""
    user = dict(current_user)
    user.pop('password_hash', None)
    return user

# ============= Build Endpoints =============

@app.get("/api/builds")
async def get_builds(current_user: dict = Depends(get_current_user)):
    """Get all builds (public + user's own)"""
    with get_db_cursor() as cursor:
        cursor.execute('''
            SELECT b.*, u.first_name, u.last_name, u.email
            FROM builds b
            JOIN users u ON b.user_id = u.id
            ORDER BY b.name
        ''')
        builds = cursor.fetchall()

    return [row_to_dict(build) for build in builds]

@app.get("/api/builds/{build_identifier}")
async def get_build(build_identifier: str, request: Request, current_user: Optional[dict] = Depends(get_current_user_optional)):
    """Get a specific build with all related data (public read access)

    Args:
        build_identifier: Can be either a slug (e.g., 'abc123-my-build') or numeric ID (for backwards compatibility)
    """
    with get_db_cursor() as cursor:
        # Determine if identifier is a slug or ID
        if build_identifier.isdigit():
            # Backwards compatibility: numeric ID
            cursor.execute('''
                SELECT b.*, u.first_name, u.last_name, u.email
                FROM builds b
                JOIN users u ON b.user_id = u.id
                WHERE b.id = %s
            ''', (int(build_identifier),))
        else:
            # Modern approach: slug lookup
            cursor.execute('''
                SELECT b.*, u.first_name, u.last_name, u.email
                FROM builds b
                JOIN users u ON b.user_id = u.id
                WHERE b.slug = %s
            ''', (build_identifier,))
        build = cursor.fetchone()

        if not build:
            raise HTTPException(status_code=404, detail="Build not found")

        build_dict = row_to_dict(build)
        build_id = build_dict['id']  # Get the actual build ID for related queries

        # Get related data
        cursor.execute('''
            SELECT * FROM vehicle_info
            WHERE build_id = %s
            ORDER BY timestamp DESC
            LIMIT 1
        ''', (build_id,))
        vehicle = cursor.fetchone()

        cursor.execute('''
            SELECT * FROM drivetrain_specs
            WHERE build_id = %s
            ORDER BY timestamp DESC
            LIMIT 1
        ''', (build_id,))
        drivetrain = cursor.fetchone()

        cursor.execute('''
            SELECT p.*, bp.role, bp.notes as bp_notes
            FROM build_parts bp
            JOIN parts p ON bp.part_id = p.id
            WHERE bp.build_id = %s
            ORDER BY p.category, p.name
        ''', (build_id,))
        engine_parts = cursor.fetchall()

        vehicle_parts = []
        if vehicle:
            cursor.execute('''
                SELECT p.*, vp.role, vp.location, vp.timestamp, vp.notes as vp_notes
                FROM vehicle_parts vp
                JOIN parts p ON vp.part_id = p.id
                WHERE vp.vehicle_info_id = %s
                ORDER BY vp.timestamp DESC, p.category
            ''', (vehicle['id'],))
            vehicle_parts = cursor.fetchall()

        cursor.execute('''
            SELECT * FROM build_tuning_settings
            WHERE build_id = %s
            ORDER BY timestamp DESC
            LIMIT 1
        ''', (build_id,))
        tuning = cursor.fetchone()

        cursor.execute('''
            SELECT * FROM build_maintenance
            WHERE build_id = %s
            ORDER BY timestamp DESC
            LIMIT 10
        ''', (build_id,))
        maintenance = cursor.fetchall()

        cursor.execute('''
            SELECT * FROM performance_tests
            WHERE build_id = %s
            ORDER BY timestamp DESC
        ''', (build_id,))
        performance = cursor.fetchall()

    # Check if current user is the owner
    is_owner = current_user is not None and current_user.get('id') == build_dict.get('user_id')

    return {
        **build_dict,
        "is_owner": is_owner,
        "vehicle": row_to_dict(vehicle),
        "drivetrain": row_to_dict(drivetrain),
        "engine_parts": [row_to_dict(part) for part in engine_parts],
        "vehicle_parts": [row_to_dict(part) for part in vehicle_parts],
        "tuning": row_to_dict(tuning),
        "maintenance": [row_to_dict(m) for m in maintenance],
        "performance": [row_to_dict(p) for p in performance]
    }

@app.post("/api/builds")
async def create_build(build: BuildCreate, current_user: dict = Depends(get_current_user)):
    """Create a new build"""
    import secrets
    import re

    # Generate unique slug
    random_hash = secrets.token_urlsafe(12)  # 12 bytes = ~16 URL-safe chars
    build_name = build.name or "build"

    # Sanitize name for URL (keep alphanumeric and hyphens)
    sanitized_name = re.sub(r'[^a-zA-Z0-9\s-]', '', build_name)
    sanitized_name = re.sub(r'\s+', '-', sanitized_name).lower()
    sanitized_name = sanitized_name[:50]  # Limit length

    slug = f"{random_hash}-{sanitized_name}" if sanitized_name else random_hash

    with get_db_cursor() as cursor:
        cursor.execute('''
            INSERT INTO builds (
                user_id, name, slug, use_type, fuel_type, target_hp, target_torque, rev_limit_rpm,
                displacement_ci, bore_in, stroke_in, rod_len_in, deck_clear_in,
                piston_cc, chamber_cc, gasket_bore_in, gasket_thickness_in, quench_in,
                static_cr, dynamic_cr, balance_oz, flywheel_teeth, firing_order,
                camshaft_model, camshaft_duration_int, camshaft_duration_exh,
                camshaft_lift_int, camshaft_lift_exh, camshaft_lsa,
                notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            current_user['id'], build.name, slug, build.use_type, build.fuel_type,
            build.target_hp, build.target_torque, build.rev_limit_rpm,
            build.displacement_ci, build.bore_in, build.stroke_in, build.rod_len_in, build.deck_clear_in,
            build.piston_cc, build.chamber_cc, build.gasket_bore_in, build.gasket_thickness_in, build.quench_in,
            build.static_cr, build.dynamic_cr, build.balance_oz, build.flywheel_teeth, build.firing_order,
            build.camshaft_model, build.camshaft_duration_int, build.camshaft_duration_exh,
            build.camshaft_lift_int, build.camshaft_lift_exh, build.camshaft_lsa,
            build.notes
        ))

        build_id = cursor.fetchone()['id']

        # Fetch created build
        cursor.execute('SELECT * FROM builds WHERE id = %s', (build_id,))
        created_build = cursor.fetchone()

    return row_to_dict(created_build)

@app.patch("/api/builds/{build_identifier}")
async def update_build_partial(
    build_identifier: str,
    changes: Dict[str, Any],
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Partially update a build with field-level change tracking.

    Accepts only the fields being changed (not the entire build object).
    Logs each field change to the event log for revision history.

    Example request:
    {
        "name": "New Build Name",
        "use_type": "Street/Strip",
        "engine_internals_json": {"block": {"bore_size": 4.030}}
    }
    """
    import uuid
    from event_logger import log_changes_batch

    # Get build ID from identifier
    with get_db_cursor() as cursor:
        if build_identifier.isdigit():
            cursor.execute("SELECT id, user_id FROM builds WHERE id = %s", (int(build_identifier),))
        else:
            cursor.execute("SELECT id, user_id FROM builds WHERE slug = %s", (build_identifier,))

        build = cursor.fetchone()
        if not build:
            raise HTTPException(status_code=404, detail="Build not found")

        build_id = build['id']

        # Check ownership
        if build['user_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Not authorized to edit this build")

        # Get current build state for comparison
        cursor.execute("SELECT * FROM builds WHERE id = %s", (build_id,))
        current_build = row_to_dict(cursor.fetchone())

    # Separate table columns from JSONB columns
    table_updates = {}
    json_updates = {}
    change_log = {}  # For event logging

    for field, new_value in changes.items():
        if field.endswith('_json'):
            # JSONB column - need to deep merge
            old_value = current_build.get(field) or {}
            # For now, simple replacement (TODO: deep merge in future)
            json_updates[field] = new_value
            change_log[field] = (old_value, new_value)
        else:
            # Regular table column
            old_value = current_build.get(field)
            if old_value != new_value:
                table_updates[field] = new_value
                change_log[field] = (old_value, new_value)

    if not table_updates and not json_updates:
        return {"message": "No changes detected", "build": current_build}

    # Apply updates to database
    with get_db_cursor() as cursor:
        # Update table columns
        if table_updates:
            set_clauses = [f"{field} = %s" for field in table_updates.keys()]
            values = list(table_updates.values()) + [build_id, current_user['id']]

            cursor.execute(f"""
                UPDATE builds
                SET {', '.join(set_clauses)}
                WHERE id = %s AND user_id = %s
            """, values)

        # Update JSONB columns
        for json_field, json_value in json_updates.items():
            cursor.execute(f"""
                UPDATE builds
                SET {json_field} = %s
                WHERE id = %s AND user_id = %s
            """, (json.dumps(json_value), build_id, current_user['id']))

    # Log changes to event log
    change_description = f"Updated {len(change_log)} field(s)"
    if 'name' in change_log:
        change_description = f"Updated build: {changes['name']}"

    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get('user-agent')

    batch_id = log_changes_batch(
        build_id=build_id,
        user_id=current_user['id'],
        changes=change_log,
        change_description=change_description,
        ip_address=ip_address,
        user_agent=user_agent
    )

    # Fetch updated build
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM builds WHERE id = %s", (build_id,))
        updated_build = cursor.fetchone()

    return {
        "success": True,
        "message": f"Successfully updated {len(change_log)} field(s)",
        "batch_id": batch_id,
        "build": row_to_dict(updated_build)
    }

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """API health check"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
