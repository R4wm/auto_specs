"""
Utility functions for managing build JSON snapshots and version history.
"""
from db import get_db_cursor, row_to_dict
import json
from typing import Optional, Dict, List
from datetime import datetime


def create_snapshot(
    build_id: int,
    user_id: int,
    snapshot_type: str,
    change_description: str = None,
    maintenance_id: int = None
) -> int:
    """
    Create a complete JSON snapshot of the build's current state.

    Args:
        build_id: ID of the build to snapshot
        user_id: ID of the user creating the snapshot
        snapshot_type: Type of snapshot ('maintenance', 'manual_edit', 'initial', 'before_change', 'after_change', 'before_restore', 'restored')
        change_description: Optional description of what changed
        maintenance_id: Optional ID of associated maintenance record

    Returns:
        snapshot_id: ID of the created snapshot
    """
    with get_db_cursor() as cursor:
        # Get current JSON state from builds table
        cursor.execute("""
            SELECT
                engine_internals_json,
                suspension_json,
                tires_wheels_json,
                rear_differential_json,
                transmission_json,
                frame_json,
                cab_interior_json,
                brakes_json,
                additional_components_json
            FROM builds WHERE id = %s
        """, (build_id,))

        current_state = cursor.fetchone()

        if not current_state:
            raise ValueError(f"Build {build_id} not found")

        # Insert snapshot
        cursor.execute("""
            INSERT INTO build_json_snapshots (
                build_id, maintenance_id, snapshot_type, change_description, user_id,
                engine_internals_json, suspension_json, tires_wheels_json,
                rear_differential_json, transmission_json, frame_json,
                cab_interior_json, brakes_json, additional_components_json
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            build_id, maintenance_id, snapshot_type, change_description, user_id,
            json.dumps(current_state['engine_internals_json']) if current_state['engine_internals_json'] else None,
            json.dumps(current_state['suspension_json']) if current_state['suspension_json'] else None,
            json.dumps(current_state['tires_wheels_json']) if current_state['tires_wheels_json'] else None,
            json.dumps(current_state['rear_differential_json']) if current_state['rear_differential_json'] else None,
            json.dumps(current_state['transmission_json']) if current_state['transmission_json'] else None,
            json.dumps(current_state['frame_json']) if current_state['frame_json'] else None,
            json.dumps(current_state['cab_interior_json']) if current_state['cab_interior_json'] else None,
            json.dumps(current_state['brakes_json']) if current_state['brakes_json'] else None,
            json.dumps(current_state['additional_components_json']) if current_state['additional_components_json'] else None
        ))

        snapshot_id = cursor.fetchone()['id']
        return snapshot_id


def get_snapshot_diff(snapshot_before_id: int, snapshot_after_id: int) -> Dict:
    """
    Compare two snapshots and return what changed.

    Args:
        snapshot_before_id: ID of the earlier snapshot
        snapshot_after_id: ID of the later snapshot

    Returns:
        Dictionary containing changes between snapshots
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT * FROM build_json_snapshots WHERE id IN (%s, %s)
        """, (snapshot_before_id, snapshot_after_id))

        snapshots = cursor.fetchall()

        if len(snapshots) != 2:
            raise ValueError("One or both snapshots not found")

        before = next((row_to_dict(s) for s in snapshots if s['id'] == snapshot_before_id), None)
        after = next((row_to_dict(s) for s in snapshots if s['id'] == snapshot_after_id), None)

        if not before or not after:
            raise ValueError("One or both snapshots not found")

    changes = {}
    json_fields = [
        'engine_internals_json', 'suspension_json', 'tires_wheels_json',
        'rear_differential_json', 'transmission_json', 'frame_json',
        'cab_interior_json', 'brakes_json', 'additional_components_json'
    ]

    for field in json_fields:
        before_value = before.get(field)
        after_value = after.get(field)

        # Compare JSON objects (convert to string for comparison if needed)
        if before_value != after_value:
            changes[field] = {
                'before': before_value,
                'after': after_value,
                'has_changes': True
            }

    return {
        'snapshot_before': {
            'id': before['id'],
            'created_at': before['created_at'].isoformat() if isinstance(before['created_at'], datetime) else before['created_at'],
            'snapshot_type': before['snapshot_type'],
            'change_description': before['change_description']
        },
        'snapshot_after': {
            'id': after['id'],
            'created_at': after['created_at'].isoformat() if isinstance(after['created_at'], datetime) else after['created_at'],
            'snapshot_type': after['snapshot_type'],
            'change_description': after['change_description']
        },
        'changes': changes
    }


def restore_snapshot(build_id: int, snapshot_id: int, user_id: int) -> bool:
    """
    Restore build to a previous snapshot state.
    Creates new snapshots for the restoration (before and after).

    Args:
        build_id: ID of the build to restore
        snapshot_id: ID of the snapshot to restore to
        user_id: ID of the user performing the restore

    Returns:
        True if restore was successful
    """
    with get_db_cursor() as cursor:
        # Get snapshot to restore
        cursor.execute("SELECT * FROM build_json_snapshots WHERE id = %s AND build_id = %s", (snapshot_id, build_id))
        snapshot = cursor.fetchone()

        if not snapshot:
            raise ValueError(f"Snapshot {snapshot_id} not found for build {build_id}")

        snapshot_dict = row_to_dict(snapshot)

        # Create "before restore" snapshot
        before_restore_id = create_snapshot(
            build_id,
            user_id,
            'before_restore',
            f'Before restoring to snapshot {snapshot_id}'
        )

        # Restore build to snapshot state
        cursor.execute("""
            UPDATE builds SET
                engine_internals_json = %s,
                suspension_json = %s,
                tires_wheels_json = %s,
                rear_differential_json = %s,
                transmission_json = %s,
                frame_json = %s,
                cab_interior_json = %s,
                brakes_json = %s,
                additional_components_json = %s
            WHERE id = %s
        """, (
            snapshot_dict['engine_internals_json'],
            snapshot_dict['suspension_json'],
            snapshot_dict['tires_wheels_json'],
            snapshot_dict['rear_differential_json'],
            snapshot_dict['transmission_json'],
            snapshot_dict['frame_json'],
            snapshot_dict['cab_interior_json'],
            snapshot_dict['brakes_json'],
            snapshot_dict['additional_components_json'],
            build_id
        ))

        # Create "after restore" snapshot
        snapshot_date = snapshot_dict['created_at'].strftime('%Y-%m-%d %H:%M') if isinstance(snapshot_dict['created_at'], datetime) else snapshot_dict['created_at']
        after_restore_id = create_snapshot(
            build_id,
            user_id,
            'restored',
            f'Restored to snapshot from {snapshot_date}'
        )

        return True


def get_build_snapshot_history(build_id: int) -> List[Dict]:
    """
    Get all snapshots for a build in chronological order.

    Args:
        build_id: ID of the build

    Returns:
        List of snapshot dictionaries with metadata
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT
                s.*,
                u.first_name,
                u.last_name,
                u.email,
                m.maintenance_type,
                m.notes as maintenance_notes
            FROM build_json_snapshots s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN build_maintenance m ON s.maintenance_id = m.id
            WHERE s.build_id = %s
            ORDER BY s.created_at DESC
        """, (build_id,))

        snapshots = cursor.fetchall()

        result = []
        for snapshot in snapshots:
            snapshot_dict = row_to_dict(snapshot)

            # Format datetime for JSON serialization
            if isinstance(snapshot_dict.get('created_at'), datetime):
                snapshot_dict['created_at'] = snapshot_dict['created_at'].isoformat()

            result.append(snapshot_dict)

        return result


def get_snapshot_by_id(snapshot_id: int) -> Optional[Dict]:
    """
    Get a specific snapshot by ID.

    Args:
        snapshot_id: ID of the snapshot

    Returns:
        Snapshot dictionary or None if not found
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT
                s.*,
                u.first_name,
                u.last_name,
                m.maintenance_type
            FROM build_json_snapshots s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN build_maintenance m ON s.maintenance_id = m.id
            WHERE s.id = %s
        """, (snapshot_id,))

        snapshot = cursor.fetchone()

        if not snapshot:
            return None

        snapshot_dict = row_to_dict(snapshot)

        # Format datetime
        if isinstance(snapshot_dict.get('created_at'), datetime):
            snapshot_dict['created_at'] = snapshot_dict['created_at'].isoformat()

        return snapshot_dict


def get_latest_snapshot(build_id: int) -> Optional[Dict]:
    """
    Get the most recent snapshot for a build.

    Args:
        build_id: ID of the build

    Returns:
        Latest snapshot dictionary or None if no snapshots exist
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT * FROM build_json_snapshots
            WHERE build_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (build_id,))

        snapshot = cursor.fetchone()

        if not snapshot:
            return None

        snapshot_dict = row_to_dict(snapshot)

        if isinstance(snapshot_dict.get('created_at'), datetime):
            snapshot_dict['created_at'] = snapshot_dict['created_at'].isoformat()

        return snapshot_dict
