"""
Component API endpoints for modular build system

Provides CRUD operations for all 11 component types with:
- JSON size validation (1MB limit)
- Template support
- Import/Export functionality
"""

import json
from typing import Optional, Dict, Any
from fastapi import HTTPException
from db import get_db_cursor


# Component table mapping
COMPONENT_TABLES = {
    'engine-internals': 'engine_internals',
    'transmission': 'transmissions',
    'differential': 'differentials',
    'suspension': 'suspensions',
    'tires-wheels': 'tires_wheels',
    'frame': 'frames',
    'cab-interior': 'cab_interiors',
    'brakes': 'brakes',
    'fuel-system': 'fuel_systems',
    'induction-system': 'induction_systems',
    'additional-components': 'additional_components'
}

# JSON size limit: 1MB
MAX_COMPONENT_SIZE_BYTES = 1024 * 1024  # 1MB


def validate_component_size(component_data: Dict[str, Any]) -> int:
    """
    Validate that component data doesn't exceed size limit.

    Returns:
        Size in bytes

    Raises:
        HTTPException if size exceeds limit
    """
    json_str = json.dumps(component_data)
    size_bytes = len(json_str.encode('utf-8'))

    if size_bytes > MAX_COMPONENT_SIZE_BYTES:
        size_mb = size_bytes / (1024 * 1024)
        limit_mb = MAX_COMPONENT_SIZE_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"Component data too large: {size_mb:.2f}MB exceeds {limit_mb}MB limit"
        )

    return size_bytes


def get_component_table(component_type: str) -> str:
    """
    Get database table name for component type.

    Raises:
        HTTPException if component type is invalid
    """
    table_name = COMPONENT_TABLES.get(component_type)
    if not table_name:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid component type: {component_type}. Valid types: {list(COMPONENT_TABLES.keys())}"
        )
    return table_name


def create_component(
    component_type: str,
    user_id: int,
    name: str,
    component_data: Dict[str, Any],
    description: Optional[str] = None,
    is_template: bool = False
) -> Dict[str, Any]:
    """
    Create a new component.

    Args:
        component_type: Type of component (e.g., 'engine-internals')
        user_id: User ID creating the component
        name: Component name
        component_data: JSON data for the component
        description: Optional description
        is_template: Whether this is a template

    Returns:
        Created component dict
    """
    table_name = get_component_table(component_type)
    data_size = validate_component_size(component_data)

    with get_db_cursor() as cursor:
        cursor.execute(f"""
            INSERT INTO {table_name} (user_id, name, description, is_template, component_data, data_size_bytes)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (user_id, name, description, is_template, json.dumps(component_data), data_size))

        component = cursor.fetchone()
        return dict(component)


def get_component(component_type: str, component_id: int) -> Dict[str, Any]:
    """
    Get a component by ID.

    Raises:
        HTTPException if component not found
    """
    table_name = get_component_table(component_type)

    with get_db_cursor() as cursor:
        cursor.execute(f"SELECT * FROM {table_name} WHERE id = %s", (component_id,))
        component = cursor.fetchone()

        if not component:
            raise HTTPException(status_code=404, detail=f"{component_type} component not found")

        return dict(component)


def update_component(
    component_type: str,
    component_id: int,
    user_id: int,
    updates: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update a component (must be owner).

    Args:
        component_type: Type of component
        component_id: Component ID
        user_id: User ID (must be owner)
        updates: Dict of fields to update (name, description, component_data, is_template)

    Returns:
        Updated component dict

    Raises:
        HTTPException if not found or not owner
    """
    table_name = get_component_table(component_type)

    with get_db_cursor() as cursor:
        # Verify ownership
        cursor.execute(f"SELECT user_id FROM {table_name} WHERE id = %s", (component_id,))
        component = cursor.fetchone()

        if not component:
            raise HTTPException(status_code=404, detail=f"{component_type} component not found")

        if component['user_id'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this component")

        # Build update query
        set_clauses = []
        params = []

        if 'name' in updates:
            set_clauses.append("name = %s")
            params.append(updates['name'])

        if 'description' in updates:
            set_clauses.append("description = %s")
            params.append(updates['description'])

        if 'is_template' in updates:
            set_clauses.append("is_template = %s")
            params.append(updates['is_template'])

        if 'component_data' in updates:
            data_size = validate_component_size(updates['component_data'])
            set_clauses.append("component_data = %s")
            set_clauses.append("data_size_bytes = %s")
            params.append(json.dumps(updates['component_data']))
            params.append(data_size)

        set_clauses.append("updated_at = NOW()")

        if not set_clauses:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        params.append(component_id)

        query = f"""
            UPDATE {table_name}
            SET {', '.join(set_clauses)}
            WHERE id = %s
            RETURNING *
        """

        cursor.execute(query, params)
        updated = cursor.fetchone()

        return dict(updated)


def delete_component(component_type: str, component_id: int, user_id: int) -> Dict[str, str]:
    """
    Delete a component (only if not in use by any builds).

    Raises:
        HTTPException if in use, not found, or not owner
    """
    table_name = get_component_table(component_type)

    with get_db_cursor() as cursor:
        # Verify ownership
        cursor.execute(f"SELECT user_id FROM {table_name} WHERE id = %s", (component_id,))
        component = cursor.fetchone()

        if not component:
            raise HTTPException(status_code=404, detail=f"{component_type} component not found")

        if component['user_id'] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this component")

        # Check if in use
        column_name = f"{table_name.rstrip('s')}_id" if not table_name.endswith('ies') else f"{table_name[:-3]}y_id"
        cursor.execute(f"SELECT COUNT(*) as count FROM builds WHERE {column_name} = %s", (component_id,))
        usage = cursor.fetchone()

        if usage['count'] > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete: component is used by {usage['count']} build(s)"
            )

        # Delete
        cursor.execute(f"DELETE FROM {table_name} WHERE id = %s", (component_id,))

        return {"message": "Component deleted successfully"}


def list_templates(component_type: str) -> list:
    """
    List all templates for a component type.
    """
    table_name = get_component_table(component_type)

    with get_db_cursor() as cursor:
        cursor.execute(f"""
            SELECT
                id, user_id, name, description, is_template, data_size_bytes, created_at, updated_at
            FROM {table_name}
            WHERE is_template = TRUE
            ORDER BY name
        """)

        templates = cursor.fetchall()
        return [dict(t) for t in templates]


def clone_component(
    component_type: str,
    component_id: int,
    user_id: int,
    new_name: str
) -> Dict[str, Any]:
    """
    Clone a component (useful for templates).

    Args:
        component_type: Type of component
        component_id: Source component ID
        user_id: User ID for new component
        new_name: Name for cloned component

    Returns:
        New component dict
    """
    table_name = get_component_table(component_type)

    with get_db_cursor() as cursor:
        # Get source component
        cursor.execute(f"SELECT * FROM {table_name} WHERE id = %s", (component_id,))
        source = cursor.fetchone()

        if not source:
            raise HTTPException(status_code=404, detail=f"{component_type} component not found")

        # Create clone (not a template by default)
        cursor.execute(f"""
            INSERT INTO {table_name} (user_id, name, description, is_template, component_data, data_size_bytes)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            user_id,
            new_name,
            f"Cloned from: {source['name']}",
            False,  # Clone is not a template
            json.dumps(source['component_data']),
            source['data_size_bytes']
        ))

        new_component = cursor.fetchone()
        return dict(new_component)


def export_component(component_type: str, component_id: int) -> Dict[str, Any]:
    """
    Export component data for download/sharing.

    Returns:
        Complete component data including metadata
    """
    component = get_component(component_type, component_id)

    return {
        "export_version": "1.0",
        "component_type": component_type,
        "name": component['name'],
        "description": component['description'],
        "data": component['component_data'],
        "exported_at": component['updated_at'].isoformat() if component.get('updated_at') else None
    }


def import_component(
    component_type: str,
    user_id: int,
    import_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Import component from exported JSON.

    Args:
        component_type: Type of component
        user_id: User ID importing
        import_data: Exported component data

    Returns:
        Created component dict

    Raises:
        HTTPException if import data is invalid
    """
    if import_data.get('component_type') != component_type:
        raise HTTPException(
            status_code=400,
            detail=f"Import type mismatch: expected {component_type}, got {import_data.get('component_type')}"
        )

    if 'data' not in import_data:
        raise HTTPException(status_code=400, detail="Import data missing 'data' field")

    name = import_data.get('name', f"Imported {component_type}")
    description = import_data.get('description', f"Imported from external source")

    return create_component(
        component_type=component_type,
        user_id=user_id,
        name=name,
        component_data=import_data['data'],
        description=description,
        is_template=False
    )
