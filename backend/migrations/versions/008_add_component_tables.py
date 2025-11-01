"""Add component tables for modular build system

Revision ID: 008
Revises: 007
Create Date: 2025-01-30

This migration creates 11 separate component tables to replace JSONB columns
in the builds table. Each component table has flexible JSONB storage with
size limits, template support, and import/export capabilities.
"""

def upgrade(conn):
    """Create component tables"""
    cursor = conn.cursor()

    print("Creating component tables...")

    # 1. Engine Internals
    cursor.execute("""
        CREATE TABLE engine_internals (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_template BOOLEAN DEFAULT FALSE,
            component_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            data_size_bytes INTEGER DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    cursor.execute("CREATE INDEX idx_engine_internals_user ON engine_internals(user_id)")
    cursor.execute("CREATE INDEX idx_engine_internals_template ON engine_internals(is_template) WHERE is_template = TRUE")

    # 2. Transmissions
    cursor.execute("""
        CREATE TABLE transmissions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_template BOOLEAN DEFAULT FALSE,
            component_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            data_size_bytes INTEGER DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    cursor.execute("CREATE INDEX idx_transmissions_user ON transmissions(user_id)")
    cursor.execute("CREATE INDEX idx_transmissions_template ON transmissions(is_template) WHERE is_template = TRUE")

    # 3. Differentials
    cursor.execute("""
        CREATE TABLE differentials (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_template BOOLEAN DEFAULT FALSE,
            component_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            data_size_bytes INTEGER DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    cursor.execute("CREATE INDEX idx_differentials_user ON differentials(user_id)")
    cursor.execute("CREATE INDEX idx_differentials_template ON differentials(is_template) WHERE is_template = TRUE")

    # 4. Suspensions
    cursor.execute("""
        CREATE TABLE suspensions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_template BOOLEAN DEFAULT FALSE,
            component_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            data_size_bytes INTEGER DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    cursor.execute("CREATE INDEX idx_suspensions_user ON suspensions(user_id)")
    cursor.execute("CREATE INDEX idx_suspensions_template ON suspensions(is_template) WHERE is_template = TRUE")

    # 5. Tires & Wheels
    cursor.execute("""
        CREATE TABLE tires_wheels (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_template BOOLEAN DEFAULT FALSE,
            component_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            data_size_bytes INTEGER DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    cursor.execute("CREATE INDEX idx_tires_wheels_user ON tires_wheels(user_id)")
    cursor.execute("CREATE INDEX idx_tires_wheels_template ON tires_wheels(is_template) WHERE is_template = TRUE")

    # 6. Frames
    cursor.execute("""
        CREATE TABLE frames (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_template BOOLEAN DEFAULT FALSE,
            component_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            data_size_bytes INTEGER DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    cursor.execute("CREATE INDEX idx_frames_user ON frames(user_id)")
    cursor.execute("CREATE INDEX idx_frames_template ON frames(is_template) WHERE is_template = TRUE")

    # 7. Cab & Interior
    cursor.execute("""
        CREATE TABLE cab_interiors (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_template BOOLEAN DEFAULT FALSE,
            component_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            data_size_bytes INTEGER DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    cursor.execute("CREATE INDEX idx_cab_interiors_user ON cab_interiors(user_id)")
    cursor.execute("CREATE INDEX idx_cab_interiors_template ON cab_interiors(is_template) WHERE is_template = TRUE")

    # 8. Brakes
    cursor.execute("""
        CREATE TABLE brakes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_template BOOLEAN DEFAULT FALSE,
            component_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            data_size_bytes INTEGER DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    cursor.execute("CREATE INDEX idx_brakes_user ON brakes(user_id)")
    cursor.execute("CREATE INDEX idx_brakes_template ON brakes(is_template) WHERE is_template = TRUE")

    # 9. Fuel Systems
    cursor.execute("""
        CREATE TABLE fuel_systems (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_template BOOLEAN DEFAULT FALSE,
            component_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            data_size_bytes INTEGER DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    cursor.execute("CREATE INDEX idx_fuel_systems_user ON fuel_systems(user_id)")
    cursor.execute("CREATE INDEX idx_fuel_systems_template ON fuel_systems(is_template) WHERE is_template = TRUE")

    # 10. Induction Systems (Carbs/Fuel Injection)
    cursor.execute("""
        CREATE TABLE induction_systems (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_template BOOLEAN DEFAULT FALSE,
            component_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            data_size_bytes INTEGER DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    cursor.execute("CREATE INDEX idx_induction_systems_user ON induction_systems(user_id)")
    cursor.execute("CREATE INDEX idx_induction_systems_template ON induction_systems(is_template) WHERE is_template = TRUE")

    # 11. Additional Components
    cursor.execute("""
        CREATE TABLE additional_components (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_template BOOLEAN DEFAULT FALSE,
            component_data JSONB NOT NULL DEFAULT '{}'::jsonb,
            data_size_bytes INTEGER DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    cursor.execute("CREATE INDEX idx_additional_components_user ON additional_components(user_id)")
    cursor.execute("CREATE INDEX idx_additional_components_template ON additional_components(is_template) WHERE is_template = TRUE")

    print("✅ Created 11 component tables with indexes")

    # Add foreign key columns to builds table
    print("Adding component foreign keys to builds table...")
    cursor.execute("""
        ALTER TABLE builds
        ADD COLUMN engine_internals_id INTEGER REFERENCES engine_internals(id) ON DELETE SET NULL,
        ADD COLUMN transmission_id INTEGER REFERENCES transmissions(id) ON DELETE SET NULL,
        ADD COLUMN differential_id INTEGER REFERENCES differentials(id) ON DELETE SET NULL,
        ADD COLUMN suspension_id INTEGER REFERENCES suspensions(id) ON DELETE SET NULL,
        ADD COLUMN tires_wheels_id INTEGER REFERENCES tires_wheels(id) ON DELETE SET NULL,
        ADD COLUMN frame_id INTEGER REFERENCES frames(id) ON DELETE SET NULL,
        ADD COLUMN cab_interior_id INTEGER REFERENCES cab_interiors(id) ON DELETE SET NULL,
        ADD COLUMN brakes_id INTEGER REFERENCES brakes(id) ON DELETE SET NULL,
        ADD COLUMN fuel_system_id INTEGER REFERENCES fuel_systems(id) ON DELETE SET NULL,
        ADD COLUMN induction_system_id INTEGER REFERENCES induction_systems(id) ON DELETE SET NULL,
        ADD COLUMN additional_components_id INTEGER REFERENCES additional_components(id) ON DELETE SET NULL
    """)

    print("Creating indexes on builds foreign keys...")
    cursor.execute("CREATE INDEX idx_builds_engine_internals ON builds(engine_internals_id)")
    cursor.execute("CREATE INDEX idx_builds_transmission ON builds(transmission_id)")
    cursor.execute("CREATE INDEX idx_builds_differential ON builds(differential_id)")
    cursor.execute("CREATE INDEX idx_builds_suspension ON builds(suspension_id)")
    cursor.execute("CREATE INDEX idx_builds_tires_wheels ON builds(tires_wheels_id)")
    cursor.execute("CREATE INDEX idx_builds_frame ON builds(frame_id)")
    cursor.execute("CREATE INDEX idx_builds_cab_interior ON builds(cab_interior_id)")
    cursor.execute("CREATE INDEX idx_builds_brakes ON builds(brakes_id)")
    cursor.execute("CREATE INDEX idx_builds_fuel_system ON builds(fuel_system_id)")
    cursor.execute("CREATE INDEX idx_builds_induction_system ON builds(induction_system_id)")
    cursor.execute("CREATE INDEX idx_builds_additional_components ON builds(additional_components_id)")

    conn.commit()
    print("✅ Migration 008 complete: Component tables created")


def downgrade(conn):
    """Remove component tables and foreign keys"""
    cursor = conn.cursor()

    print("Removing foreign keys from builds table...")
    cursor.execute("""
        ALTER TABLE builds
        DROP COLUMN IF EXISTS engine_internals_id,
        DROP COLUMN IF EXISTS transmission_id,
        DROP COLUMN IF EXISTS differential_id,
        DROP COLUMN IF EXISTS suspension_id,
        DROP COLUMN IF EXISTS tires_wheels_id,
        DROP COLUMN IF EXISTS frame_id,
        DROP COLUMN IF EXISTS cab_interior_id,
        DROP COLUMN IF EXISTS brakes_id,
        DROP COLUMN IF EXISTS fuel_system_id,
        DROP COLUMN IF EXISTS induction_system_id,
        DROP COLUMN IF EXISTS additional_components_id
    """)

    print("Dropping component tables...")
    cursor.execute("DROP TABLE IF EXISTS additional_components CASCADE")
    cursor.execute("DROP TABLE IF EXISTS induction_systems CASCADE")
    cursor.execute("DROP TABLE IF EXISTS fuel_systems CASCADE")
    cursor.execute("DROP TABLE IF EXISTS brakes CASCADE")
    cursor.execute("DROP TABLE IF EXISTS cab_interiors CASCADE")
    cursor.execute("DROP TABLE IF EXISTS frames CASCADE")
    cursor.execute("DROP TABLE IF EXISTS tires_wheels CASCADE")
    cursor.execute("DROP TABLE IF EXISTS suspensions CASCADE")
    cursor.execute("DROP TABLE IF EXISTS differentials CASCADE")
    cursor.execute("DROP TABLE IF EXISTS transmissions CASCADE")
    cursor.execute("DROP TABLE IF EXISTS engine_internals CASCADE")

    conn.commit()
    print("✅ Migration 008 downgrade complete")


if __name__ == '__main__':
    # For testing
    import psycopg2
    import os

    conn = psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'postgres'),
        database=os.getenv('POSTGRES_DB', 'auto_specs_db'),
        user=os.getenv('POSTGRES_USER', 'auto_specs_user'),
        password=os.getenv('POSTGRES_PASSWORD', 'auto_specs_pass')
    )

    upgrade(conn)
    conn.close()
