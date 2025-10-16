import sqlite3

conn = sqlite3.connect("engine_build_normalized.db")

# Add maintenance tracking tables
conn.executescript("""
-- Track maintenance events (oil changes, repairs, etc.)
CREATE TABLE IF NOT EXISTS maintenance_events (
    id INTEGER PRIMARY KEY,
    build_id INTEGER NOT NULL,
    event_date TEXT NOT NULL,
    event_type TEXT NOT NULL,  -- 'oil_change', 'repair', 'inspection', etc.
    engine_hours REAL,
    odometer INTEGER,
    description TEXT,
    notes TEXT,
    FOREIGN KEY (build_id) REFERENCES builds(id)
);

-- Track parts used in each maintenance event
CREATE TABLE IF NOT EXISTS maintenance_parts (
    id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL,
    part_id INTEGER,
    part_description TEXT,  -- For parts not in parts table
    part_number TEXT,
    qty INTEGER DEFAULT 1,
    notes TEXT,
    FOREIGN KEY (event_id) REFERENCES maintenance_events(id),
    FOREIGN KEY (part_id) REFERENCES parts(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_maintenance_build ON maintenance_events(build_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_events(event_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_parts_event ON maintenance_parts(event_id);
""")

conn.commit()
print("Maintenance tracking tables created successfully!")

# Show the new schema
cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
tables = cursor.fetchall()
print("\nCurrent tables:")
for table in tables:
    print(f"  - {table[0]}")

conn.close()
