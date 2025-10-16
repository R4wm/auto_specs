import os
import psycopg2
from psycopg2 import sql

# Get database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://auto_specs_user:auto_specs_pass@localhost:5432/auto_specs_db')

# Parse database URL
# Format: postgresql://user:password@host:port/database
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Create tables with PostgreSQL syntax
schema_sql = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone_number VARCHAR(50) UNIQUE,
    phone_verified BOOLEAN DEFAULT FALSE,
    oauth_provider VARCHAR(50),
    oauth_provider_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sms_verification_codes (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(50) NOT NULL,
    verification_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE
);

CREATE TABLE IF NOT EXISTS parts (
    id SERIAL PRIMARY KEY,
    part_number VARCHAR(255) UNIQUE,
    brand VARCHAR(255),
    name VARCHAR(255),
    category VARCHAR(255),
    product_link TEXT,
    specs_json TEXT
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(255),
    order_date DATE,
    vendor_id INTEGER REFERENCES vendors(id),
    ship_to TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    part_id INTEGER REFERENCES parts(id),
    qty INTEGER,
    price_each DECIMAL(10,2),
    ext_price DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS builds (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255),

    -- Build Purpose
    use_type VARCHAR(255),
    fuel_type VARCHAR(255),
    target_hp DECIMAL(10,2),
    target_torque DECIMAL(10,2),
    rev_limit_rpm INTEGER,

    -- Engine Specs
    displacement_ci DECIMAL(10,2),
    bore_in DECIMAL(10,4),
    stroke_in DECIMAL(10,4),
    rod_len_in DECIMAL(10,4),
    deck_clear_in DECIMAL(10,4),

    -- Compression
    piston_cc DECIMAL(10,2),
    chamber_cc DECIMAL(10,2),
    gasket_bore_in DECIMAL(10,4),
    gasket_thickness_in DECIMAL(10,4),
    quench_in DECIMAL(10,4),
    static_cr DECIMAL(10,2),
    dynamic_cr DECIMAL(10,2),

    -- Balance & Rotating Assembly
    balance_oz DECIMAL(10,2),
    flywheel_teeth INTEGER,
    firing_order VARCHAR(50),

    -- Camshaft
    camshaft_model VARCHAR(255),
    camshaft_duration_int VARCHAR(50),
    camshaft_duration_exh VARCHAR(50),
    camshaft_lift_int DECIMAL(10,4),
    camshaft_lift_exh DECIMAL(10,4),
    camshaft_lsa DECIMAL(10,2),

    notes TEXT
);

CREATE TABLE IF NOT EXISTS build_parts (
    id SERIAL PRIMARY KEY,
    build_id INTEGER REFERENCES builds(id),
    part_id INTEGER REFERENCES parts(id),
    role VARCHAR(255),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS vehicle_info (
    id SERIAL PRIMARY KEY,
    build_id INTEGER NOT NULL REFERENCES builds(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Vehicle Details
    year INTEGER,
    make VARCHAR(255),
    model VARCHAR(255),
    trim VARCHAR(255),

    -- Chassis & Weight
    vin VARCHAR(50),
    weight_with_fuel_lbs DECIMAL(10,2),
    weight_no_fuel_lbs DECIMAL(10,2),
    front_weight_dist_pct DECIMAL(5,2),
    rear_weight_dist_pct DECIMAL(5,2),

    -- Frame & Suspension
    frame_type VARCHAR(255),
    suspension_front VARCHAR(255),
    suspension_rear VARCHAR(255),

    notes TEXT
);

CREATE TABLE IF NOT EXISTS vehicle_parts (
    id SERIAL PRIMARY KEY,
    vehicle_info_id INTEGER NOT NULL REFERENCES vehicle_info(id),
    part_id INTEGER NOT NULL REFERENCES parts(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    install_date DATE,
    role VARCHAR(255),
    location VARCHAR(255),

    notes TEXT
);

CREATE TABLE IF NOT EXISTS drivetrain_specs (
    id SERIAL PRIMARY KEY,
    build_id INTEGER NOT NULL REFERENCES builds(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Rear Differential
    rear_gear_ratio VARCHAR(50),
    rear_diff_type VARCHAR(255),
    rear_diff_fluid_brand VARCHAR(255),
    rear_diff_fluid_type VARCHAR(255),
    rear_diff_friction_modifier VARCHAR(255),

    -- Transmission
    transmission_type VARCHAR(255),
    transmission_fluid_brand VARCHAR(255),
    transmission_fluid_type VARCHAR(255),

    -- Transfer Case
    transfer_case_type VARCHAR(255),
    transfer_case_ratio VARCHAR(50),

    notes TEXT
);

CREATE TABLE IF NOT EXISTS build_tuning_settings (
    id SERIAL PRIMARY KEY,
    build_id INTEGER NOT NULL REFERENCES builds(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Carburetor Jetting
    primary_jet_size VARCHAR(50),
    secondary_jet_size VARCHAR(50),
    power_valve_size VARCHAR(50),

    -- Metering Rods
    metering_rod_primary VARCHAR(50),
    metering_rod_secondary VARCHAR(50),

    -- Air/Fuel Mixture Screws
    idle_mixture_turns DECIMAL(5,2),

    -- Accelerator Pump
    accelerator_pump_cam VARCHAR(50),
    accelerator_pump_nozzle VARCHAR(50),
    accelerator_pump_spring VARCHAR(50),

    -- Ignition Timing
    initial_timing_deg DECIMAL(5,2),
    total_timing_deg DECIMAL(5,2),
    vacuum_advance_deg DECIMAL(5,2),
    mechanical_advance_springs VARCHAR(255),
    spark_plugs VARCHAR(255),
    spark_plug_condition VARCHAR(255),

    -- Vacuum Readings
    idle_vacuum_inhg DECIMAL(5,2),
    cruise_vacuum_inhg DECIMAL(5,2),
    wot_vacuum_inhg DECIMAL(5,2),

    notes TEXT
);

CREATE TABLE IF NOT EXISTS build_maintenance (
    id SERIAL PRIMARY KEY,
    build_id INTEGER NOT NULL REFERENCES builds(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    maintenance_type VARCHAR(255),
    item_description VARCHAR(255),

    quantity DECIMAL(10,2),
    unit VARCHAR(50),

    engine_hours DECIMAL(10,2),
    odometer_miles DECIMAL(10,2),

    brand VARCHAR(255),
    part_number VARCHAR(255),
    viscosity VARCHAR(50),
    synthetic VARCHAR(50),

    old_condition TEXT,

    oil_pressure_idle_psi DECIMAL(5,2),
    oil_pressure_running_psi DECIMAL(5,2),
    oil_pressure_rpm INTEGER,

    notes TEXT
);

CREATE TABLE IF NOT EXISTS performance_tests (
    id SERIAL PRIMARY KEY,
    build_id INTEGER NOT NULL REFERENCES builds(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Test Conditions
    test_location VARCHAR(255),
    weather_temp_f DECIMAL(5,2),
    weather_humidity_pct DECIMAL(5,2),
    elevation_ft DECIMAL(10,2),
    track_condition VARCHAR(255),

    -- Acceleration Tests
    zero_to_60_sec DECIMAL(5,2),
    zero_to_100_sec DECIMAL(5,2),
    quarter_mile_et DECIMAL(5,2),
    quarter_mile_mph DECIMAL(5,2),
    eighth_mile_et DECIMAL(5,2),
    eighth_mile_mph DECIMAL(5,2),

    -- Braking Tests
    sixty_to_zero_ft DECIMAL(10,2),

    -- Track Times
    lap_time_sec DECIMAL(10,2),
    track_name VARCHAR(255),

    -- Dyno Results
    dyno_hp DECIMAL(10,2),
    dyno_torque DECIMAL(10,2),
    dyno_type VARCHAR(50),

    notes TEXT
);
"""

cur.execute(schema_sql)
conn.commit()

print("✅ PostgreSQL database schema created successfully!")

cur.close()
conn.close()
