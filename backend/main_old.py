from fastapi import FastAPI, Request, Form, HTTPException, Depends
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.base import BaseHTTPMiddleware
import sqlite3
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_user_optional,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from sms import send_verification_code, verify_code

# Load environment variables
load_dotenv()

app = FastAPI(title="Auto Specs Manager")

# HTTPS Redirect Middleware
class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only enforce HTTPS in production
        if os.getenv('ENVIRONMENT') == 'production':
            # Check if request is HTTP
            if request.url.scheme == 'http':
                # Redirect to HTTPS
                url = request.url.replace(scheme='https')
                return RedirectResponse(url=str(url), status_code=301)

        response = await call_next(request)
        return response

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Add security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Add HSTS header in production
        if os.getenv('ENVIRONMENT') == 'production':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com; "
            "frame-src https://accounts.google.com; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        response.headers['Content-Security-Policy'] = csp

        return response

# Add middleware to app
app.add_middleware(HTTPSRedirectMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Store Google Client ID in app state for templates
app.state.google_client_id = os.getenv('GOOGLE_CLIENT_ID')

templates = Jinja2Templates(directory="templates")

DATABASE = 'engine_build_normalized.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Authentication Endpoints
@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/sms-login", response_class=HTMLResponse)
async def sms_login_page(request: Request):
    return templates.TemplateResponse("sms_login.html", {"request": request})

@app.post("/login")
async def login(email: str = Form(...), password: str = Form(...)):
    user = authenticate_user(email, password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )

    response = RedirectResponse(url="/", status_code=303)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax"
    )
    return response

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@app.post("/register")
async def register(
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...)
):
    conn = get_db()

    # Check if user already exists
    existing_user = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if existing_user:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    password_hash = get_password_hash(password)
    cursor = conn.execute(
        'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
        (email, password_hash, first_name, last_name)
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )

    response = RedirectResponse(url="/", status_code=303)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax"
    )
    return response

@app.get("/logout")
async def logout():
    response = RedirectResponse(url="/login", status_code=303)
    response.delete_cookie("access_token")
    return response

# Google Sign-In Token Validation
@app.post("/auth/google/token")
async def google_token_login(credential: str = Form(...)):
    try:
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            os.getenv('GOOGLE_CLIENT_ID')
        )

        # Get user info from token
        email = idinfo.get('email')
        given_name = idinfo.get('given_name', '')
        family_name = idinfo.get('family_name', '')
        google_id = idinfo.get('sub')

        if not email:
            raise HTTPException(status_code=400, detail="Email not found in Google token")

        conn = get_db()

        # Check if user exists
        user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()

        if user:
            user_id = user['id']
            # Update OAuth info if not set
            if not user['oauth_provider']:
                conn.execute(
                    'UPDATE users SET oauth_provider = ?, oauth_provider_id = ? WHERE id = ?',
                    ('google', google_id, user_id)
                )
                conn.commit()
        else:
            # Create new user
            cursor = conn.execute(
                '''INSERT INTO users (email, first_name, last_name, oauth_provider, oauth_provider_id)
                   VALUES (?, ?, ?, ?, ?)''',
                (email, given_name, family_name, 'google', google_id)
            )
            user_id = cursor.lastrowid
            conn.commit()

        conn.close()

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_id}, expires_delta=access_token_expires
        )

        response = RedirectResponse(url="/", status_code=303)
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax"
        )
        return response

    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

# SMS Authentication Endpoints
@app.post("/auth/sms/send")
async def send_sms_verification(phone_number: str = Form(...)):
    """Send SMS verification code to phone number."""
    try:
        # Validate phone number format (should be E.164 format: +14155552671)
        if not phone_number.startswith('+'):
            raise HTTPException(status_code=400, detail="Phone number must be in E.164 format (e.g., +14155552671)")

        # Send verification code
        success = send_verification_code(phone_number)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to send verification code")

        return JSONResponse(content={"message": "Verification code sent successfully"})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending verification code: {str(e)}")

@app.post("/auth/sms/verify")
async def verify_sms_code(
    phone_number: str = Form(...),
    verification_code: str = Form(...),
    first_name: str = Form(None),
    last_name: str = Form(None)
):
    """Verify SMS code and login/register user."""
    try:
        # Verify the code
        is_valid = verify_code(phone_number, verification_code)

        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid or expired verification code")

        conn = get_db()

        # Check if user exists with this phone number
        user = conn.execute('SELECT * FROM users WHERE phone_number = ?', (phone_number,)).fetchone()

        if user:
            # Existing user - log them in
            user_id = user['id']

            # Mark phone as verified if not already
            if not user['phone_verified']:
                conn.execute('UPDATE users SET phone_verified = 1 WHERE id = ?', (user_id,))
                conn.commit()
        else:
            # New user - create account
            # Email is optional for SMS-only accounts, use phone as placeholder
            email = f"{phone_number.replace('+', '')}@sms.placeholder"

            cursor = conn.execute(
                '''INSERT INTO users (email, phone_number, phone_verified, first_name, last_name)
                   VALUES (?, ?, 1, ?, ?)''',
                (email, phone_number, first_name or '', last_name or '')
            )
            user_id = cursor.lastrowid
            conn.commit()

        conn.close()

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_id}, expires_delta=access_token_expires
        )

        response = RedirectResponse(url="/", status_code=303)
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax"
        )
        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    conn = get_db()
    # Get builds with user info
    builds = conn.execute('''
        SELECT b.*, u.first_name, u.last_name, u.email
        FROM builds b
        JOIN users u ON b.user_id = u.id
        ORDER BY b.name
    ''').fetchall()
    conn.close()
    return templates.TemplateResponse("index.html", {"request": request, "builds": builds})

# Create New Build Endpoints
@app.get("/build/new", response_class=HTMLResponse)
async def new_build_form(request: Request):
    conn = get_db()
    users = conn.execute('SELECT * FROM users ORDER BY first_name, last_name').fetchall()
    conn.close()
    return templates.TemplateResponse("add_build.html", {"request": request, "users": users})

@app.post("/build/new")
async def new_build_submit(
    user_id: int = Form(...),
    name: str = Form(...),
    use_type: Optional[str] = Form(None),
    fuel_type: Optional[str] = Form(None),
    target_hp: Optional[float] = Form(None),
    target_torque: Optional[float] = Form(None),
    rev_limit_rpm: Optional[int] = Form(None),
    displacement_ci: Optional[float] = Form(None),
    bore_in: Optional[float] = Form(None),
    stroke_in: Optional[float] = Form(None),
    rod_len_in: Optional[float] = Form(None),
    deck_clear_in: Optional[float] = Form(None),
    piston_cc: Optional[float] = Form(None),
    chamber_cc: Optional[float] = Form(None),
    gasket_bore_in: Optional[float] = Form(None),
    gasket_thickness_in: Optional[float] = Form(None),
    quench_in: Optional[float] = Form(None),
    static_cr: Optional[float] = Form(None),
    dynamic_cr: Optional[float] = Form(None),
    balance_oz: Optional[float] = Form(None),
    flywheel_teeth: Optional[int] = Form(None),
    firing_order: Optional[str] = Form(None),
    notes: Optional[str] = Form(None)
):
    conn = get_db()

    cursor = conn.execute('''
        INSERT INTO builds (
            user_id, name, use_type, fuel_type, target_hp, target_torque, rev_limit_rpm,
            displacement_ci, bore_in, stroke_in, rod_len_in, deck_clear_in,
            piston_cc, chamber_cc, gasket_bore_in, gasket_thickness_in, quench_in,
            static_cr, dynamic_cr, balance_oz, flywheel_teeth, firing_order, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id, name, use_type, fuel_type, target_hp, target_torque, rev_limit_rpm,
        displacement_ci, bore_in, stroke_in, rod_len_in, deck_clear_in,
        piston_cc, chamber_cc, gasket_bore_in, gasket_thickness_in, quench_in,
        static_cr, dynamic_cr, balance_oz, flywheel_teeth, firing_order, notes
    ))

    build_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return RedirectResponse(url=f"/build/{build_id}", status_code=303)

@app.get("/build/{build_id}", response_class=HTMLResponse)
async def view_build(request: Request, build_id: int):
    conn = get_db()

    # Get build with user info
    build = conn.execute('''
        SELECT b.*, u.first_name, u.last_name, u.email
        FROM builds b
        JOIN users u ON b.user_id = u.id
        WHERE b.id = ?
    ''', (build_id,)).fetchone()

    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    # Get vehicle info
    vehicle = conn.execute('''
        SELECT * FROM vehicle_info
        WHERE build_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    ''', (build_id,)).fetchone()

    # Get drivetrain specs
    drivetrain = conn.execute('''
        SELECT * FROM drivetrain_specs
        WHERE build_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    ''', (build_id,)).fetchone()

    # Get engine parts for this build
    engine_parts = conn.execute('''
        SELECT p.*, bp.role, bp.notes as bp_notes
        FROM build_parts bp
        JOIN parts p ON bp.part_id = p.id
        WHERE bp.build_id = ?
        ORDER BY p.category, p.name
    ''', (build_id,)).fetchall()

    # Get vehicle parts
    vehicle_parts = []
    if vehicle:
        vehicle_parts = conn.execute('''
            SELECT p.*, vp.role, vp.location, vp.timestamp, vp.notes as vp_notes
            FROM vehicle_parts vp
            JOIN parts p ON vp.part_id = p.id
            WHERE vp.vehicle_info_id = ?
            ORDER BY vp.timestamp DESC, p.category
        ''', (vehicle['id'],)).fetchall()

    # Get latest tuning settings
    tuning = conn.execute('''
        SELECT * FROM build_tuning_settings
        WHERE build_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    ''', (build_id,)).fetchone()

    # Get maintenance history
    maintenance = conn.execute('''
        SELECT * FROM build_maintenance
        WHERE build_id = ?
        ORDER BY timestamp DESC
        LIMIT 10
    ''', (build_id,)).fetchall()

    # Get performance tests
    performance = conn.execute('''
        SELECT * FROM performance_tests
        WHERE build_id = ?
        ORDER BY timestamp DESC
    ''', (build_id,)).fetchall()

    conn.close()

    return templates.TemplateResponse("build_detail.html", {
        "request": request,
        "build": build,
        "vehicle": vehicle,
        "drivetrain": drivetrain,
        "engine_parts": engine_parts,
        "vehicle_parts": vehicle_parts,
        "tuning": tuning,
        "maintenance": maintenance,
        "performance": performance
    })

# Performance Test Endpoints
@app.get("/build/{build_id}/performance/add", response_class=HTMLResponse)
async def add_performance_form(request: Request, build_id: int):
    conn = get_db()
    build = conn.execute('SELECT * FROM builds WHERE id = ?', (build_id,)).fetchone()
    conn.close()

    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    return templates.TemplateResponse("add_performance.html", {
        "request": request,
        "build": build
    })

@app.post("/build/{build_id}/performance/add")
async def add_performance_submit(
    build_id: int,
    test_location: Optional[str] = Form(None),
    weather_temp_f: Optional[float] = Form(None),
    weather_humidity_pct: Optional[float] = Form(None),
    elevation_ft: Optional[float] = Form(None),
    track_condition: Optional[str] = Form(None),
    zero_to_60_sec: Optional[float] = Form(None),
    zero_to_100_sec: Optional[float] = Form(None),
    quarter_mile_et: Optional[float] = Form(None),
    quarter_mile_mph: Optional[float] = Form(None),
    eighth_mile_et: Optional[float] = Form(None),
    eighth_mile_mph: Optional[float] = Form(None),
    sixty_to_zero_ft: Optional[float] = Form(None),
    lap_time_sec: Optional[float] = Form(None),
    track_name: Optional[str] = Form(None),
    dyno_hp: Optional[float] = Form(None),
    dyno_torque: Optional[float] = Form(None),
    dyno_type: Optional[str] = Form(None),
    notes: Optional[str] = Form(None)
):
    conn = get_db()

    conn.execute('''
        INSERT INTO performance_tests (
            build_id, test_location, weather_temp_f, weather_humidity_pct,
            elevation_ft, track_condition, zero_to_60_sec, zero_to_100_sec,
            quarter_mile_et, quarter_mile_mph, eighth_mile_et, eighth_mile_mph,
            sixty_to_zero_ft, lap_time_sec, track_name, dyno_hp, dyno_torque,
            dyno_type, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        build_id, test_location, weather_temp_f, weather_humidity_pct,
        elevation_ft, track_condition, zero_to_60_sec, zero_to_100_sec,
        quarter_mile_et, quarter_mile_mph, eighth_mile_et, eighth_mile_mph,
        sixty_to_zero_ft, lap_time_sec, track_name, dyno_hp, dyno_torque,
        dyno_type, notes
    ))

    conn.commit()
    conn.close()

    return RedirectResponse(url=f"/build/{build_id}#performance", status_code=303)

# Maintenance Endpoints
@app.get("/build/{build_id}/maintenance/add", response_class=HTMLResponse)
async def add_maintenance_form(request: Request, build_id: int):
    conn = get_db()
    build = conn.execute('SELECT * FROM builds WHERE id = ?', (build_id,)).fetchone()
    conn.close()

    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    return templates.TemplateResponse("add_maintenance.html", {
        "request": request,
        "build": build
    })

@app.post("/build/{build_id}/maintenance/add")
async def add_maintenance_submit(
    build_id: int,
    maintenance_type: str = Form(...),
    item_description: str = Form(...),
    quantity: Optional[float] = Form(None),
    unit: Optional[str] = Form(None),
    engine_hours: Optional[float] = Form(None),
    odometer_miles: Optional[float] = Form(None),
    brand: Optional[str] = Form(None),
    part_number: Optional[str] = Form(None),
    viscosity: Optional[str] = Form(None),
    synthetic: Optional[str] = Form(None),
    old_condition: Optional[str] = Form(None),
    oil_pressure_idle_psi: Optional[float] = Form(None),
    oil_pressure_running_psi: Optional[float] = Form(None),
    oil_pressure_rpm: Optional[int] = Form(None),
    notes: Optional[str] = Form(None)
):
    conn = get_db()

    conn.execute('''
        INSERT INTO build_maintenance (
            build_id, maintenance_type, item_description, quantity, unit,
            engine_hours, odometer_miles, brand, part_number, viscosity,
            synthetic, old_condition, oil_pressure_idle_psi,
            oil_pressure_running_psi, oil_pressure_rpm, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        build_id, maintenance_type, item_description, quantity, unit,
        engine_hours, odometer_miles, brand, part_number, viscosity,
        synthetic, old_condition, oil_pressure_idle_psi,
        oil_pressure_running_psi, oil_pressure_rpm, notes
    ))

    conn.commit()
    conn.close()

    return RedirectResponse(url=f"/build/{build_id}#maintenance", status_code=303)

# Tuning Settings Endpoints
@app.get("/build/{build_id}/tuning/add", response_class=HTMLResponse)
async def add_tuning_form(request: Request, build_id: int):
    conn = get_db()
    build = conn.execute('SELECT * FROM builds WHERE id = ?', (build_id,)).fetchone()

    # Get latest tuning to prefill
    latest_tuning = conn.execute('''
        SELECT * FROM build_tuning_settings
        WHERE build_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    ''', (build_id,)).fetchone()

    conn.close()

    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    return templates.TemplateResponse("add_tuning.html", {
        "request": request,
        "build": build,
        "latest_tuning": latest_tuning
    })

@app.post("/build/{build_id}/tuning/add")
async def add_tuning_submit(
    build_id: int,
    primary_jet_size: Optional[str] = Form(None),
    secondary_jet_size: Optional[str] = Form(None),
    power_valve_size: Optional[str] = Form(None),
    metering_rod_primary: Optional[str] = Form(None),
    metering_rod_secondary: Optional[str] = Form(None),
    idle_mixture_turns: Optional[float] = Form(None),
    accelerator_pump_cam: Optional[str] = Form(None),
    accelerator_pump_nozzle: Optional[str] = Form(None),
    accelerator_pump_spring: Optional[str] = Form(None),
    initial_timing_deg: Optional[float] = Form(None),
    total_timing_deg: Optional[float] = Form(None),
    vacuum_advance_deg: Optional[float] = Form(None),
    mechanical_advance_springs: Optional[str] = Form(None),
    spark_plugs: Optional[str] = Form(None),
    spark_plug_condition: Optional[str] = Form(None),
    idle_vacuum_inhg: Optional[float] = Form(None),
    cruise_vacuum_inhg: Optional[float] = Form(None),
    wot_vacuum_inhg: Optional[float] = Form(None),
    notes: Optional[str] = Form(None)
):
    conn = get_db()

    conn.execute('''
        INSERT INTO build_tuning_settings (
            build_id, primary_jet_size, secondary_jet_size, power_valve_size,
            metering_rod_primary, metering_rod_secondary, idle_mixture_turns,
            accelerator_pump_cam, accelerator_pump_nozzle, accelerator_pump_spring,
            initial_timing_deg, total_timing_deg, vacuum_advance_deg,
            mechanical_advance_springs, spark_plugs, spark_plug_condition,
            idle_vacuum_inhg, cruise_vacuum_inhg, wot_vacuum_inhg, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        build_id, primary_jet_size, secondary_jet_size, power_valve_size,
        metering_rod_primary, metering_rod_secondary, idle_mixture_turns,
        accelerator_pump_cam, accelerator_pump_nozzle, accelerator_pump_spring,
        initial_timing_deg, total_timing_deg, vacuum_advance_deg,
        mechanical_advance_springs, spark_plugs, spark_plug_condition,
        idle_vacuum_inhg, cruise_vacuum_inhg, wot_vacuum_inhg, notes
    ))

    conn.commit()
    conn.close()

    return RedirectResponse(url=f"/build/{build_id}#tuning", status_code=303)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
