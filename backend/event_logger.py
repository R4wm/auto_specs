"""
Event Logger for Build Change Tracking

Implements event sourcing pattern for granular revision control.
Logs field-level changes for timeline view, comparison, and rollback.
"""

import json
import uuid
from typing import Any, Dict, List, Optional
from datetime import datetime
from db import get_db_cursor


def log_field_change(
    build_id: int,
    user_id: int,
    field_path: str,
    old_value: Any,
    new_value: Any,
    change_batch_id: str,
    change_description: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """
    Log a single field change to the event log.

    Args:
        build_id: Build being modified
        user_id: User making the change
        field_path: Dot-notation path to field (e.g., "name", "engine_internals_json.block.bore_size")
        old_value: Previous value (will be JSON serialized)
        new_value: New value (will be JSON serialized)
        change_batch_id: UUID grouping related changes from same save
        change_description: Human-readable description of the change
        ip_address: Optional IP address of user
        user_agent: Optional browser user agent
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO build_change_events
            (build_id, user_id, field_path, old_value, new_value,
             change_batch_id, change_description, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            build_id,
            user_id,
            field_path,
            json.dumps(old_value) if old_value is not None else None,
            json.dumps(new_value) if new_value is not None else None,
            change_batch_id,
            change_description,
            ip_address,
            user_agent
        ))


def log_changes_batch(
    build_id: int,
    user_id: int,
    changes: Dict[str, tuple],  # {field_path: (old_value, new_value)}
    change_description: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> str:
    """
    Log multiple field changes as a single batch.

    Args:
        build_id: Build being modified
        user_id: User making changes
        changes: Dict mapping field paths to (old_value, new_value) tuples
        change_description: Description of the batch of changes
        ip_address: Optional IP address
        user_agent: Optional user agent

    Returns:
        change_batch_id: UUID for this batch of changes
    """
    batch_id = str(uuid.uuid4())

    for field_path, (old_value, new_value) in changes.items():
        log_field_change(
            build_id=build_id,
            user_id=user_id,
            field_path=field_path,
            old_value=old_value,
            new_value=new_value,
            change_batch_id=batch_id,
            change_description=change_description,
            ip_address=ip_address,
            user_agent=user_agent
        )

    return batch_id


def get_change_timeline(build_id: int, limit: int = 50) -> List[Dict]:
    """
    Get chronological timeline of changes for a build.

    Returns list of change batches with events grouped by batch_id:
    [
        {
            "batch_id": "uuid",
            "timestamp": "2025-01-30T10:15:00",
            "user_name": "John Doe",
            "description": "Updated engine specs",
            "changes": [
                {"field": "name", "old": "old", "new": "new"},
                {"field": "bore_size", "old": 4.00, "new": 4.03}
            ]
        }
    ]
    """
    with get_db_cursor() as cursor:
        # Get distinct batches
        cursor.execute("""
            SELECT DISTINCT
                change_batch_id,
                timestamp,
                user_id,
                change_description
            FROM build_change_events
            WHERE build_id = %s
            ORDER BY timestamp DESC
            LIMIT %s
        """, (build_id, limit))

        batches = cursor.fetchall()

        timeline = []
        for batch in batches:
            # Get all events in this batch
            cursor.execute("""
                SELECT
                    e.field_path,
                    e.old_value,
                    e.new_value,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM build_change_events e
                JOIN users u ON e.user_id = u.id
                WHERE e.change_batch_id = %s
                ORDER BY e.id
            """, (batch['change_batch_id'],))

            events = cursor.fetchall()

            if events:
                user = events[0]  # All events have same user
                timeline.append({
                    'batch_id': batch['change_batch_id'],
                    'timestamp': batch['timestamp'].isoformat(),
                    'user_name': f"{user['first_name']} {user['last_name']}".strip() or user['email'],
                    'user_email': user['email'],
                    'description': batch['change_description'],
                    'changes': [
                        {
                            'field': event['field_path'],
                            'old_value': json.loads(event['old_value']) if event['old_value'] else None,
                            'new_value': json.loads(event['new_value']) if event['new_value'] else None
                        }
                        for event in events
                    ]
                })

        return timeline


def get_field_history(build_id: int, field_path: str) -> List[Dict]:
    """
    Get complete history of changes for a specific field.

    Returns chronological list of changes for this field only.
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT
                e.timestamp,
                e.old_value,
                e.new_value,
                e.change_description,
                u.first_name,
                u.last_name,
                u.email
            FROM build_change_events e
            JOIN users u ON e.user_id = u.id
            WHERE e.build_id = %s AND e.field_path = %s
            ORDER BY e.timestamp DESC
        """, (build_id, field_path))

        events = cursor.fetchall()

        return [
            {
                'timestamp': event['timestamp'].isoformat(),
                'user_name': f"{event['first_name']} {event['last_name']}".strip() or event['email'],
                'old_value': json.loads(event['old_value']) if event['old_value'] else None,
                'new_value': json.loads(event['new_value']) if event['new_value'] else None,
                'description': event['change_description']
            }
            for event in events
        ]


def compare_versions(
    build_id: int,
    timestamp1: datetime,
    timestamp2: datetime
) -> Dict[str, tuple]:
    """
    Compare build state between two timestamps.

    Returns dict of fields that changed:
    {
        "name": (old_value, new_value),
        "bore_size": (4.00, 4.03)
    }
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT
                field_path,
                old_value,
                new_value
            FROM build_change_events
            WHERE build_id = %s
              AND timestamp > %s
              AND timestamp <= %s
            ORDER BY timestamp
        """, (build_id, timestamp1, timestamp2))

        events = cursor.fetchall()

        # Build final state by applying events in order
        changes = {}
        for event in events:
            field = event['field_path']
            # If field appears multiple times, keep first old and last new
            if field not in changes:
                old_val = json.loads(event['old_value']) if event['old_value'] else None
                changes[field] = [old_val, None]

            new_val = json.loads(event['new_value']) if event['new_value'] else None
            changes[field][1] = new_val

        # Convert to tuple format
        return {field: tuple(vals) for field, vals in changes.items()}


def get_build_at_timestamp(build_id: int, timestamp: datetime) -> Dict:
    """
    Reconstruct build state as it was at a specific point in time.

    Strategy:
    1. Get current build state
    2. Get all events AFTER the target timestamp
    3. Apply events in REVERSE to undo changes
    4. Return historical state
    """
    # Get current build
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM builds WHERE id = %s", (build_id,))
        current_build = cursor.fetchone()

        if not current_build:
            raise ValueError(f"Build {build_id} not found")

        # Get events after target timestamp (to undo)
        cursor.execute("""
            SELECT field_path, old_value, new_value
            FROM build_change_events
            WHERE build_id = %s AND timestamp > %s
            ORDER BY timestamp DESC
        """, (build_id, timestamp))

        events_to_undo = cursor.fetchall()

    # Start with current state as dict
    historical_state = dict(current_build)

    # Apply events in reverse (undo them)
    for event in events_to_undo:
        field_path = event['field_path']
        old_value = json.loads(event['old_value']) if event['old_value'] else None

        # Restore old value
        if '.' in field_path:
            # Nested JSON field (e.g., "engine_internals_json.block.bore_size")
            # For simplicity, we'll handle the full JSON column restoration
            json_column = field_path.split('.')[0]
            if json_column in historical_state:
                # Would need deep path restoration here
                # For now, we'll handle this in a future enhancement
                pass
        else:
            # Simple table column
            historical_state[field_path] = old_value

    return historical_state
