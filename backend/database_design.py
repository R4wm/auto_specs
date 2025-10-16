import sqlite3

conn = sqlite3.connect("engine_build_normalized.db")

# Example: create the tables
conn.executescript("""
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT UNIQUE,
    phone_verified INTEGER DEFAULT 0,
    oauth_provider TEXT,
    oauth_provider_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sms_verification_codes (
    id INTEGER PRIMARY KEY,
    phone_number TEXT NOT NULL,
    verification_code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendors (id INTEGER PRIMARY KEY, name TEXT UNIQUE);
CREATE TABLE parts (
    id INTEGER PRIMARY KEY,
    part_number TEXT UNIQUE,
    brand TEXT,
    name TEXT,
    category TEXT,
    product_link TEXT,
    specs_json TEXT
);
CREATE TABLE orders (id INTEGER PRIMARY KEY, order_number TEXT, order_date TEXT, vendor_id INTEGER, ship_to TEXT, notes TEXT);
CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER, part_id INTEGER, qty INTEGER, price_each REAL, ext_price REAL);
CREATE TABLE builds (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT,

    -- Build Purpose
    use_type TEXT,                    -- e.g., "Street/Strip", "Daily Driver", "Race Only"
    fuel_type TEXT,                   -- e.g., "93 Octane", "E85", "Race Gas"
    target_hp REAL,                   -- target horsepower
    target_torque REAL,               -- target torque
    rev_limit_rpm INTEGER,            -- rev limit in RPM

    -- Engine Specs
    displacement_ci REAL,
    bore_in REAL,
    stroke_in REAL,
    rod_len_in REAL,
    deck_clear_in REAL,

    -- Compression
    piston_cc REAL,
    chamber_cc REAL,
    gasket_bore_in REAL,
    gasket_thickness_in REAL,
    quench_in REAL,                   -- quench distance
    static_cr REAL,
    dynamic_cr REAL,

    -- Balance & Rotating Assembly
    balance_oz REAL,
    flywheel_teeth INTEGER,
    firing_order TEXT,

    -- Camshaft
    camshaft_model TEXT,              -- e.g., "COMP XR282HR"
    camshaft_duration_int TEXT,       -- intake duration @ .050
    camshaft_duration_exh TEXT,       -- exhaust duration @ .050
    camshaft_lift_int REAL,           -- intake lift
    camshaft_lift_exh REAL,           -- exhaust lift
    camshaft_lsa REAL,                -- lobe separation angle

    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE build_parts (id INTEGER PRIMARY KEY, build_id INTEGER, part_id INTEGER, role TEXT, notes TEXT);

CREATE TABLE vehicle_info (
    id INTEGER PRIMARY KEY,
    build_id INTEGER NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,

    -- Vehicle Details
    year INTEGER,                     -- e.g., 1969, 1987
    make TEXT,                        -- e.g., "Ford", "Chevrolet", "Dodge"
    model TEXT,                       -- e.g., "Mustang", "Camaro", "Charger"
    trim TEXT,                        -- e.g., "Fastback", "GT", "SS"

    -- Chassis & Weight
    vin TEXT,                         -- VIN number
    weight_with_fuel_lbs REAL,        -- curb weight with full tank
    weight_no_fuel_lbs REAL,          -- dry weight
    front_weight_dist_pct REAL,       -- front weight distribution %
    rear_weight_dist_pct REAL,        -- rear weight distribution %

    -- Frame & Suspension
    frame_type TEXT,                  -- e.g., "Unibody", "Full Frame", "Subframe"
    suspension_front TEXT,            -- e.g., "MacPherson Strut", "SLA", "Solid Axle"
    suspension_rear TEXT,             -- e.g., "Leaf Spring", "4-Link", "IRS"

    -- General
    notes TEXT,

    FOREIGN KEY (build_id) REFERENCES builds(id)
);

CREATE TABLE vehicle_parts (
    id INTEGER PRIMARY KEY,
    vehicle_info_id INTEGER NOT NULL,
    part_id INTEGER NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,

    -- Installation Details
    install_date TEXT,                -- when the part was installed
    role TEXT,                        -- e.g., "Front Suspension", "Chassis Reinforcement"
    location TEXT,                    -- e.g., "Front", "Rear", "Left Front", "Right Rear"

    -- General
    notes TEXT,

    FOREIGN KEY (vehicle_info_id) REFERENCES vehicle_info(id),
    FOREIGN KEY (part_id) REFERENCES parts(id)
);

CREATE TABLE drivetrain_specs (
    id INTEGER PRIMARY KEY,
    build_id INTEGER NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,

    -- Rear Differential
    rear_gear_ratio TEXT,             -- e.g., "3.73", "4.10"
    rear_diff_type TEXT,              -- e.g., "Posi", "Open", "Locker", "Limited Slip"
    rear_diff_fluid_brand TEXT,       -- e.g., "Royal Purple"
    rear_diff_fluid_type TEXT,        -- e.g., "75W-90 Synthetic"
    rear_diff_friction_modifier TEXT, -- e.g., "Yes - GM Part 1052358", "Royal Purple Synchromax"

    -- Transmission
    transmission_type TEXT,           -- e.g., "TH350", "4L60E", "Tremec T56"
    transmission_fluid_brand TEXT,
    transmission_fluid_type TEXT,

    -- Transfer Case (if applicable)
    transfer_case_type TEXT,
    transfer_case_ratio TEXT,

    -- General
    notes TEXT,

    FOREIGN KEY (build_id) REFERENCES builds(id)
);

CREATE TABLE build_tuning_settings (
    id INTEGER PRIMARY KEY,
    build_id INTEGER NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,

    -- Carburetor Jetting
    primary_jet_size TEXT,
    secondary_jet_size TEXT,
    power_valve_size TEXT,

    -- Metering Rods
    metering_rod_primary TEXT,
    metering_rod_secondary TEXT,

    -- Air/Fuel Mixture Screws
    idle_mixture_turns REAL,

    -- Accelerator Pump
    accelerator_pump_cam TEXT,
    accelerator_pump_nozzle TEXT,
    accelerator_pump_spring TEXT,

    -- Ignition Timing
    initial_timing_deg REAL,
    total_timing_deg REAL,
    vacuum_advance_deg REAL,
    mechanical_advance_springs TEXT,
    spark_plugs TEXT,
    spark_plug_condition TEXT,

    -- Vacuum Readings
    idle_vacuum_inhg REAL,
    cruise_vacuum_inhg REAL,
    wot_vacuum_inhg REAL,

    -- General
    notes TEXT,

    FOREIGN KEY (build_id) REFERENCES builds(id)
);

CREATE TABLE build_maintenance (
    id INTEGER PRIMARY KEY,
    build_id INTEGER NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,

    -- Maintenance Details
    maintenance_type TEXT,           -- e.g., "Fluid Change", "Filter Change", "Inspection"
    item_description TEXT,            -- e.g., "Transmission Fluid", "Engine Oil", "Coolant"

    -- Quantity Tracking
    quantity REAL,                    -- amount of fluid/parts
    unit TEXT,                        -- "quarts", "gallons", "liters", "pcs"

    -- Runtime Tracking
    engine_hours REAL,                -- engine runtime hours when performed
    odometer_miles REAL,              -- odometer reading if applicable

    -- Parts/Products Used
    brand TEXT,                       -- fluid/filter brand
    part_number TEXT,                 -- part number if applicable
    viscosity TEXT,                   -- e.g., "10W-30", "5W-20", "75W-90"
    synthetic TEXT,                   -- "Full Synthetic", "Synthetic Blend", "Conventional"

    -- Condition Notes
    old_condition TEXT,               -- condition of old fluid/part

    -- Oil Pressure Tracking
    oil_pressure_idle_psi REAL,       -- oil pressure at idle (psi)
    oil_pressure_running_psi REAL,    -- oil pressure at running temp/RPM (psi)
    oil_pressure_rpm INTEGER,         -- RPM at which running pressure was measured

    -- General
    notes TEXT,

    FOREIGN KEY (build_id) REFERENCES builds(id)
);

CREATE TABLE performance_tests (
    id INTEGER PRIMARY KEY,
    build_id INTEGER NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,

    -- Test Conditions
    test_location TEXT,               -- e.g., "Track Name", "Street", "Dyno Shop"
    weather_temp_f REAL,              -- ambient temperature
    weather_humidity_pct REAL,        -- humidity percentage
    elevation_ft REAL,                -- elevation above sea level
    track_condition TEXT,             -- e.g., "Dry", "Damp", "Prepped"

    -- Acceleration Tests
    zero_to_60_sec REAL,              -- 0-60 mph time
    zero_to_100_sec REAL,             -- 0-100 mph time
    quarter_mile_et REAL,             -- 1/4 mile elapsed time
    quarter_mile_mph REAL,            -- 1/4 mile trap speed
    eighth_mile_et REAL,              -- 1/8 mile elapsed time
    eighth_mile_mph REAL,             -- 1/8 mile trap speed

    -- Braking Tests
    sixty_to_zero_ft REAL,            -- 60-0 braking distance

    -- Track Times
    lap_time_sec REAL,                -- lap time in seconds
    track_name TEXT,                  -- specific track/course

    -- Dyno Results
    dyno_hp REAL,                     -- horsepower at wheels or crank
    dyno_torque REAL,                 -- torque at wheels or crank
    dyno_type TEXT,                   -- "Wheel HP", "Crank HP"

    -- General
    notes TEXT,

    FOREIGN KEY (build_id) REFERENCES builds(id)
);
""")
conn.commit()
conn.close()
