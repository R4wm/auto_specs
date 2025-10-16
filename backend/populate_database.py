import sqlite3
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

conn = sqlite3.connect("engine_build_normalized.db")
cursor = conn.cursor()

# Create user with password
password_hash = pwd_context.hash("password123")  # Default password for testing
cursor.execute("""
INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)
""", ('raymondmintz11@gmail.com', password_hash, 'Raymond', 'Mintz'))
user_id = cursor.lastrowid

# Create build from PDF specs
cursor.execute("""
INSERT INTO builds (
    user_id, name, use_type, fuel_type, target_hp, target_torque, rev_limit_rpm,
    displacement_ci, bore_in, stroke_in, rod_len_in, deck_clear_in,
    piston_cc, chamber_cc, gasket_bore_in, gasket_thickness_in, quench_in,
    static_cr, dynamic_cr, balance_oz, flywheel_teeth, firing_order,
    camshaft_model, camshaft_duration_int, camshaft_duration_exh,
    camshaft_lift_int, camshaft_lift_exh, camshaft_lsa,
    notes
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    user_id,
    '347 SCAT 194165 / TFS 11R / XR282HR / TKX',
    'Street/Strip Naturally Aspirated',
    '93 Octane',
    435.0,  # average of 420-450
    415.0,  # average of 400-430
    6200,
    347.0,
    4.03,
    3.4,
    5.4,
    0.005,
    5.0,
    53.0,
    4.155,
    0.042,
    0.047,
    11.5,
    8.8,
    28.0,
    157,
    '1-3-7-2-6-5-4-8',
    'COMP XR282HR (35-425-8)',
    '230',
    '236',
    0.513,
    0.529,
    110.0,
    'Street/strip NA build. MSD 6-series box; rev limit ~6200 rpm; Melling M-68 pump.'
))
build_id = cursor.lastrowid

# Create vehicle info
cursor.execute("""
INSERT INTO vehicle_info (
    build_id, year, make, model, trim,
    weight_with_fuel_lbs, frame_type, suspension_front, suspension_rear
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    build_id,
    1987,
    'Ford',
    'Mustang',
    'GT',
    3200,  # estimated
    'Unibody',
    'MacPherson Strut with Coilovers',
    'Leaf Spring with Pan Hard Bar'
))
vehicle_info_id = cursor.lastrowid

# Add parts from PDF
parts_data = [
    # Engine parts
    ('Trick Flow', '11R 170 CNC', 'Cylinder Heads 53cc chambers 170cc runners', 'Cylinder Heads'),
    ('Cometic', 'C5515-042', 'MLS Head Gasket 4.155 x 0.042', 'Gaskets'),
    ('Melling', 'M-68', 'High Volume Oil Pump', 'Oil System'),
    ('ARP', '154-7901', 'Oil Pump Drive Shaft', 'Oil System'),
    ('COMP Cams', 'XR282HR', 'Camshaft 230/236 @.050', 'Valvetrain'),
    ('COMP Cams', '435M', 'Melonized Distributor Gear .531" MSD', 'Ignition'),
    ('MSD', '857931', 'Pro-Billet Distributor Small Cap', 'Ignition'),
    ('MSD', '89889', 'Timing Pointer 10-11 oclock', 'Ignition'),
    ('NGK', 'R5671A-9', 'Racing Spark Plugs', 'Ignition'),
    ('Edelbrock', '1307', 'VRS-4150 750 CFM Carburetor', 'Fuel System'),

    # Transmission & Clutch
    ('Tremec', 'TKX', '5-Speed Transmission .68 OD', 'Transmission'),
    ('Lakewood', 'LRS-6392A', 'TKO/TKX Bellhousing SBF', 'Transmission'),
    ('McLeod', '563100', 'Aluminum Flywheel 157T 28oz', 'Transmission'),
    ('Scott Drake', 'C8OZ-7515-A', 'Clutch Fork', 'Transmission'),
    ('McLeod', '16505', 'Self-aligning Throwout Bearing', 'Transmission'),
    ('Dorman', '14367', 'Fixed Pivot Stud Zinc Plated', 'Transmission'),

    # Differential/Drivetrain
    ('Royal Purple', 'Max Gear 75W-90', 'Synthetic Gear Oil', 'Fluids'),
    ('GM', 'Part-1052358', 'Limited Slip Additive', 'Fluids'),

    # Suspension & Chassis
    ('Maximum Motorsports', 'MM-COIL-F', 'Front Coilover Kit', 'Suspension'),
    ('Maximum Motorsports', 'MM-PHB', 'Pan Hard Bar', 'Suspension'),
    ('Maximum Motorsports', 'MM-SFC', 'Subframe Connectors', 'Chassis'),

    # Tires
    ('BFGoodrich', 'g-Force', 'g-Force 295/35ZR17', 'Tires'),
]

part_ids = {}
for brand, part_number, name, category in parts_data:
    cursor.execute("""
    INSERT INTO parts (brand, part_number, name, category)
    VALUES (?, ?, ?, ?)
    """, (brand, part_number, name, category))
    part_ids[part_number] = cursor.lastrowid

# Link engine parts to build
engine_parts = [
    ('11R 170 CNC', 'Cylinder Heads', 'Trick Flow 170cc CNC ported'),
    ('C5515-042', 'Head Gasket', 'MLS .042 thickness'),
    ('M-68', 'Oil Pump', 'High volume pump'),
    ('154-7901', 'Oil Pump Shaft', 'ARP heavy duty'),
    ('XR282HR', 'Camshaft', '230/236 duration .513/.529 lift'),
    ('435M', 'Distributor Gear', 'Melonized for MSD shaft'),
    ('857931', 'Distributor', 'MSD Pro-Billet small cap'),
    ('89889', 'Timing Pointer', '10-11 oclock style'),
    ('R5671A-9', 'Spark Plugs', 'NGK Racing plugs'),
    ('1307', 'Carburetor', 'Edelbrock 750 CFM'),
    ('TKX', 'Transmission', 'Tremec 5-speed .68 overdrive'),
    ('LRS-6392A', 'Bellhousing', 'Lakewood SBF'),
    ('563100', 'Flywheel', 'McLeod aluminum 28oz'),
    ('C8OZ-7515-A', 'Clutch Fork', 'Scott Drake OEM style'),
    ('16505', 'Throwout Bearing', 'McLeod self-aligning'),
    ('14367', 'Pivot Stud', 'Dorman fixed zinc'),
]

for part_num, role, notes in engine_parts:
    cursor.execute("""
    INSERT INTO build_parts (build_id, part_id, role, notes)
    VALUES (?, ?, ?, ?)
    """, (build_id, part_ids[part_num], role, notes))

# Link vehicle parts
vehicle_parts = [
    ('MM-COIL-F', 'Front Suspension', 'Front', 'Coilover conversion from stock'),
    ('MM-PHB', 'Rear Suspension', 'Rear', 'Pan hard bar for lateral location'),
    ('MM-SFC', 'Chassis Reinforcement', 'Undercarriage', 'Welded subframe connectors'),
    ('g-Force', 'Tires', 'Rear', '295/35ZR17 pair'),
]

for part_num, role, location, notes in vehicle_parts:
    cursor.execute("""
    INSERT INTO vehicle_parts (vehicle_info_id, part_id, role, location, notes)
    VALUES (?, ?, ?, ?, ?)
    """, (vehicle_info_id, part_ids[part_num], role, location, notes))

# Add drivetrain specs
cursor.execute("""
INSERT INTO drivetrain_specs (
    build_id, rear_gear_ratio, rear_diff_type,
    rear_diff_fluid_brand, rear_diff_fluid_type, rear_diff_friction_modifier,
    transmission_type, transmission_fluid_brand
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", (
    build_id,
    '3.73',
    'Limited Slip',
    'Royal Purple',
    'Max Gear 75W-90 Synthetic',
    'GM Part 1052358',
    'Tremec TKX 5-Speed',
    'Royal Purple'
))

# Add initial tuning settings
cursor.execute("""
INSERT INTO build_tuning_settings (
    build_id, spark_plugs, initial_timing_deg,
    idle_vacuum_inhg, notes
) VALUES (?, ?, ?, ?, ?)
""", (
    build_id,
    'NGK R5671A-9',
    12.0,
    18.0,
    'Initial baseline tune'
))

# Add initial oil change
cursor.execute("""
INSERT INTO build_maintenance (
    build_id, maintenance_type, item_description,
    quantity, unit, engine_hours, brand, viscosity, synthetic,
    oil_pressure_idle_psi, oil_pressure_running_psi, oil_pressure_rpm,
    notes
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    build_id,
    'Fluid Change',
    'Engine Oil',
    5.0,
    'quarts',
    0.0,
    'Royal Purple',
    '10W-30',
    'Full Synthetic',
    20.0,
    55.0,
    2000,
    'Break-in oil change'
))

# Add a performance test
cursor.execute("""
INSERT INTO performance_tests (
    build_id, test_location, weather_temp_f,
    zero_to_60_sec, quarter_mile_et, quarter_mile_mph,
    notes
) VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    build_id,
    'Local Street',
    75.0,
    5.2,
    13.8,
    102.5,
    'Initial shakedown run'
))

conn.commit()
conn.close()

print("Database populated successfully!")
print(f"User ID: {user_id}")
print(f"Build ID: {build_id}")
print(f"Vehicle Info ID: {vehicle_info_id}")
