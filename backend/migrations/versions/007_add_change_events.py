"""Add build_change_events table for granular revision tracking

Revision ID: 007
Revises: 006
Create Date: 2025-01-30

This migration adds an event log table for tracking field-level changes to builds.
Uses event sourcing pattern for simple, append-only change history.
"""

def upgrade(conn):
    """Add build_change_events table"""
    cursor = conn.cursor()

    print("Creating build_change_events table...")
    cursor.execute("""
        CREATE TABLE build_change_events (
            id SERIAL PRIMARY KEY,
            build_id INTEGER NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id),
            timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

            -- What changed
            field_path VARCHAR(255) NOT NULL,  -- e.g., "name", "engine_internals_json.block.bore_size"
            old_value TEXT,                     -- JSON string of old value
            new_value TEXT,                     -- JSON string of new value

            -- Grouping edits from same save
            change_batch_id UUID NOT NULL,      -- Same UUID for all fields changed in one save
            change_description TEXT,            -- e.g., "Updated engine specs"

            -- Metadata
            ip_address INET,
            user_agent TEXT,

            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)

    print("Creating indexes for fast queries...")
    cursor.execute("""
        CREATE INDEX idx_build_changes
        ON build_change_events(build_id, timestamp DESC)
    """)

    cursor.execute("""
        CREATE INDEX idx_change_batch
        ON build_change_events(change_batch_id)
    """)

    cursor.execute("""
        CREATE INDEX idx_field_path
        ON build_change_events(field_path)
    """)

    conn.commit()
    print("✅ Migration 007 complete: Event log system added")


def downgrade(conn):
    """Remove build_change_events table"""
    cursor = conn.cursor()

    print("Dropping build_change_events table...")
    cursor.execute("DROP TABLE IF EXISTS build_change_events CASCADE")

    conn.commit()
    print("✅ Migration 007 downgrade complete")


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
