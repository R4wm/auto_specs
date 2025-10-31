"""Add slug column to builds table for secure public URLs

Revision ID: 006
Revises: 005
Create Date: 2025-01-30

This migration adds a unique slug field to builds for URL-safe, non-enumerable public sharing.
Uses format: {random_hash}-{sanitized_name} for SEO and security.
"""

def upgrade(conn):
    """Add slug column and generate slugs for existing builds"""
    import secrets
    import re

    cursor = conn.cursor()

    # Add slug column
    print("Adding slug column to builds table...")
    cursor.execute("""
        ALTER TABLE builds
        ADD COLUMN slug VARCHAR(255) UNIQUE
    """)

    # Create index for fast slug lookups
    cursor.execute("""
        CREATE INDEX idx_builds_slug ON builds(slug)
    """)

    # Generate slugs for existing builds
    print("Generating slugs for existing builds...")
    cursor.execute("SELECT id, name FROM builds")
    builds = cursor.fetchall()

    for build in builds:
        build_id = build[0]
        build_name = build[1] or "build"

        # Generate URL-safe slug: random_hash-sanitized-name
        random_hash = secrets.token_urlsafe(12)  # 12 bytes = ~16 URL-safe chars

        # Sanitize name for URL (keep alphanumeric and hyphens)
        sanitized_name = re.sub(r'[^a-zA-Z0-9\s-]', '', build_name)
        sanitized_name = re.sub(r'\s+', '-', sanitized_name).lower()
        sanitized_name = sanitized_name[:50]  # Limit length

        slug = f"{random_hash}-{sanitized_name}" if sanitized_name else random_hash

        cursor.execute(
            "UPDATE builds SET slug = %s WHERE id = %s",
            (slug, build_id)
        )
        print(f"  Build {build_id}: {slug}")

    # Make slug NOT NULL after populating
    cursor.execute("""
        ALTER TABLE builds
        ALTER COLUMN slug SET NOT NULL
    """)

    conn.commit()
    print("✅ Migration 006 complete: Build slugs added")


def downgrade(conn):
    """Remove slug column"""
    cursor = conn.cursor()

    print("Removing slug column from builds table...")
    cursor.execute("DROP INDEX IF EXISTS idx_builds_slug")
    cursor.execute("ALTER TABLE builds DROP COLUMN IF EXISTS slug")

    conn.commit()
    print("✅ Migration 006 downgrade complete")


if __name__ == '__main__':
    # For testing
    import psycopg2
    import os

    conn = psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        database=os.getenv('POSTGRES_DB', 'auto_specs'),
        user=os.getenv('POSTGRES_USER', 'auto_specs_user'),
        password=os.getenv('POSTGRES_PASSWORD', 'auto_specs_pass')
    )

    upgrade(conn)
    conn.close()
