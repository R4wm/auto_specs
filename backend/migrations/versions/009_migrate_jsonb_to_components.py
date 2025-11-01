"""Migrate existing JSONB data to component tables

Revision ID: 009
Revises: 008
Create Date: 2025-01-30

This migration extracts JSONB data from builds table and creates
corresponding component records, then links builds to these components.
"""

import json

def upgrade(conn):
    """Migrate JSONB data to component tables"""
    cursor = conn.cursor()

    print("Fetching all builds with JSONB data...")
    cursor.execute("""
        SELECT
            id,
            user_id,
            name,
            engine_internals_json,
            transmission_json,
            rear_differential_json,
            suspension_json,
            tires_wheels_json,
            frame_json,
            cab_interior_json,
            brakes_json,
            additional_components_json
        FROM builds
    """)

    builds = cursor.fetchall()
    print(f"Found {len(builds)} builds to migrate")

    for build in builds:
        build_id = build[0]
        user_id = build[1]
        build_name = build[2]

        print(f"\nMigrating build {build_id}: {build_name}")

        # 1. Engine Internals
        engine_internals_json = build[3]
        if engine_internals_json:
            component_name = f"{build_name} - Engine Internals"
            data_size = len(json.dumps(engine_internals_json).encode('utf-8'))
            cursor.execute("""
                INSERT INTO engine_internals (user_id, name, description, component_data, data_size_bytes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, component_name, f"Migrated from build: {build_name}", json.dumps(engine_internals_json), data_size))
            component_id = cursor.fetchone()[0]
            cursor.execute("UPDATE builds SET engine_internals_id = %s WHERE id = %s", (component_id, build_id))
            print(f"  ✅ Engine internals → component {component_id}")

        # 2. Transmission
        transmission_json = build[4]
        if transmission_json:
            component_name = f"{build_name} - Transmission"
            data_size = len(json.dumps(transmission_json).encode('utf-8'))
            cursor.execute("""
                INSERT INTO transmissions (user_id, name, description, component_data, data_size_bytes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, component_name, f"Migrated from build: {build_name}", json.dumps(transmission_json), data_size))
            component_id = cursor.fetchone()[0]
            cursor.execute("UPDATE builds SET transmission_id = %s WHERE id = %s", (component_id, build_id))
            print(f"  ✅ Transmission → component {component_id}")

        # 3. Differential
        differential_json = build[5]
        if differential_json:
            component_name = f"{build_name} - Differential"
            data_size = len(json.dumps(differential_json).encode('utf-8'))
            cursor.execute("""
                INSERT INTO differentials (user_id, name, description, component_data, data_size_bytes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, component_name, f"Migrated from build: {build_name}", json.dumps(differential_json), data_size))
            component_id = cursor.fetchone()[0]
            cursor.execute("UPDATE builds SET differential_id = %s WHERE id = %s", (component_id, build_id))
            print(f"  ✅ Differential → component {component_id}")

        # 4. Suspension
        suspension_json = build[6]
        if suspension_json:
            component_name = f"{build_name} - Suspension"
            data_size = len(json.dumps(suspension_json).encode('utf-8'))
            cursor.execute("""
                INSERT INTO suspensions (user_id, name, description, component_data, data_size_bytes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, component_name, f"Migrated from build: {build_name}", json.dumps(suspension_json), data_size))
            component_id = cursor.fetchone()[0]
            cursor.execute("UPDATE builds SET suspension_id = %s WHERE id = %s", (component_id, build_id))
            print(f"  ✅ Suspension → component {component_id}")

        # 5. Tires & Wheels
        tires_wheels_json = build[7]
        if tires_wheels_json:
            component_name = f"{build_name} - Tires & Wheels"
            data_size = len(json.dumps(tires_wheels_json).encode('utf-8'))
            cursor.execute("""
                INSERT INTO tires_wheels (user_id, name, description, component_data, data_size_bytes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, component_name, f"Migrated from build: {build_name}", json.dumps(tires_wheels_json), data_size))
            component_id = cursor.fetchone()[0]
            cursor.execute("UPDATE builds SET tires_wheels_id = %s WHERE id = %s", (component_id, build_id))
            print(f"  ✅ Tires & Wheels → component {component_id}")

        # 6. Frame
        frame_json = build[8]
        if frame_json:
            component_name = f"{build_name} - Frame"
            data_size = len(json.dumps(frame_json).encode('utf-8'))
            cursor.execute("""
                INSERT INTO frames (user_id, name, description, component_data, data_size_bytes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, component_name, f"Migrated from build: {build_name}", json.dumps(frame_json), data_size))
            component_id = cursor.fetchone()[0]
            cursor.execute("UPDATE builds SET frame_id = %s WHERE id = %s", (component_id, build_id))
            print(f"  ✅ Frame → component {component_id}")

        # 7. Cab & Interior
        cab_interior_json = build[9]
        if cab_interior_json:
            component_name = f"{build_name} - Cab & Interior"
            data_size = len(json.dumps(cab_interior_json).encode('utf-8'))
            cursor.execute("""
                INSERT INTO cab_interiors (user_id, name, description, component_data, data_size_bytes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, component_name, f"Migrated from build: {build_name}", json.dumps(cab_interior_json), data_size))
            component_id = cursor.fetchone()[0]
            cursor.execute("UPDATE builds SET cab_interior_id = %s WHERE id = %s", (component_id, build_id))
            print(f"  ✅ Cab & Interior → component {component_id}")

        # 8. Brakes
        brakes_json = build[10]
        if brakes_json:
            component_name = f"{build_name} - Brakes"
            data_size = len(json.dumps(brakes_json).encode('utf-8'))
            cursor.execute("""
                INSERT INTO brakes (user_id, name, description, component_data, data_size_bytes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, component_name, f"Migrated from build: {build_name}", json.dumps(brakes_json), data_size))
            component_id = cursor.fetchone()[0]
            cursor.execute("UPDATE builds SET brakes_id = %s WHERE id = %s", (component_id, build_id))
            print(f"  ✅ Brakes → component {component_id}")

        # 9. Additional Components
        additional_json = build[11]
        if additional_json:
            component_name = f"{build_name} - Additional Components"
            data_size = len(json.dumps(additional_json).encode('utf-8'))
            cursor.execute("""
                INSERT INTO additional_components (user_id, name, description, component_data, data_size_bytes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, component_name, f"Migrated from build: {build_name}", json.dumps(additional_json), data_size))
            component_id = cursor.fetchone()[0]
            cursor.execute("UPDATE builds SET additional_components_id = %s WHERE id = %s", (component_id, build_id))
            print(f"  ✅ Additional components → component {component_id}")

        # Note: fuel_system and induction_system didn't exist before, so they remain NULL

    # Drop old JSONB columns
    print("\n\nDropping old JSONB columns from builds table...")
    cursor.execute("""
        ALTER TABLE builds
        DROP COLUMN IF EXISTS engine_internals_json,
        DROP COLUMN IF EXISTS transmission_json,
        DROP COLUMN IF EXISTS rear_differential_json,
        DROP COLUMN IF EXISTS suspension_json,
        DROP COLUMN IF EXISTS tires_wheels_json,
        DROP COLUMN IF EXISTS frame_json,
        DROP COLUMN IF EXISTS cab_interior_json,
        DROP COLUMN IF EXISTS brakes_json,
        DROP COLUMN IF EXISTS additional_components_json
    """)

    conn.commit()
    print("\n✅ Migration 009 complete: JSONB data migrated to component tables")


def downgrade(conn):
    """Restore JSONB columns and migrate data back"""
    cursor = conn.cursor()

    print("Re-adding JSONB columns to builds table...")
    cursor.execute("""
        ALTER TABLE builds
        ADD COLUMN engine_internals_json JSONB,
        ADD COLUMN transmission_json JSONB,
        ADD COLUMN rear_differential_json JSONB,
        ADD COLUMN suspension_json JSONB,
        ADD COLUMN tires_wheels_json JSONB,
        ADD COLUMN frame_json JSONB,
        ADD COLUMN cab_interior_json JSONB,
        ADD COLUMN brakes_json JSONB,
        ADD COLUMN additional_components_json JSONB
    """)

    print("Migrating component data back to JSONB columns...")
    cursor.execute("SELECT id, engine_internals_id, transmission_id, differential_id, suspension_id, tires_wheels_id, frame_id, cab_interior_id, brakes_id, additional_components_id FROM builds")
    builds = cursor.fetchall()

    for build in builds:
        build_id = build[0]

        # Restore each component's data
        if build[1]:  # engine_internals_id
            cursor.execute("SELECT component_data FROM engine_internals WHERE id = %s", (build[1],))
            data = cursor.fetchone()
            if data:
                cursor.execute("UPDATE builds SET engine_internals_json = %s WHERE id = %s", (data[0], build_id))

        if build[2]:  # transmission_id
            cursor.execute("SELECT component_data FROM transmissions WHERE id = %s", (build[2],))
            data = cursor.fetchone()
            if data:
                cursor.execute("UPDATE builds SET transmission_json = %s WHERE id = %s", (data[0], build_id))

        if build[3]:  # differential_id
            cursor.execute("SELECT component_data FROM differentials WHERE id = %s", (build[3],))
            data = cursor.fetchone()
            if data:
                cursor.execute("UPDATE builds SET rear_differential_json = %s WHERE id = %s", (data[0], build_id))

        if build[4]:  # suspension_id
            cursor.execute("SELECT component_data FROM suspensions WHERE id = %s", (build[4],))
            data = cursor.fetchone()
            if data:
                cursor.execute("UPDATE builds SET suspension_json = %s WHERE id = %s", (data[0], build_id))

        if build[5]:  # tires_wheels_id
            cursor.execute("SELECT component_data FROM tires_wheels WHERE id = %s", (build[5],))
            data = cursor.fetchone()
            if data:
                cursor.execute("UPDATE builds SET tires_wheels_json = %s WHERE id = %s", (data[0], build_id))

        if build[6]:  # frame_id
            cursor.execute("SELECT component_data FROM frames WHERE id = %s", (build[6],))
            data = cursor.fetchone()
            if data:
                cursor.execute("UPDATE builds SET frame_json = %s WHERE id = %s", (data[0], build_id))

        if build[7]:  # cab_interior_id
            cursor.execute("SELECT component_data FROM cab_interiors WHERE id = %s", (build[7],))
            data = cursor.fetchone()
            if data:
                cursor.execute("UPDATE builds SET cab_interior_json = %s WHERE id = %s", (data[0], build_id))

        if build[8]:  # brakes_id
            cursor.execute("SELECT component_data FROM brakes WHERE id = %s", (build[8],))
            data = cursor.fetchone()
            if data:
                cursor.execute("UPDATE builds SET brakes_json = %s WHERE id = %s", (data[0], build_id))

        if build[9]:  # additional_components_id
            cursor.execute("SELECT component_data FROM additional_components WHERE id = %s", (build[9],))
            data = cursor.fetchone()
            if data:
                cursor.execute("UPDATE builds SET additional_components_json = %s WHERE id = %s", (data[0], build_id))

    conn.commit()
    print("✅ Migration 009 downgrade complete")


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
