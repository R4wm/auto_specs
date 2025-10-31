"""
API endpoints for build TODO/task management.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import json

from auth import get_current_user
from db import get_db_cursor, row_to_dict

router = APIRouter()

# ============= Pydantic Models =============

class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = 'medium'
    due_date: Optional[date] = None
    estimated_cost: Optional[float] = None
    custom_fields: Optional[Dict[str, Any]] = None


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[date] = None
    estimated_cost: Optional[float] = None
    custom_fields: Optional[Dict[str, Any]] = None
    sort_order: Optional[int] = None


class TodoComplete(BaseModel):
    completion_notes: Optional[str] = None
    odometer_at_completion: Optional[float] = None
    engine_hours_at_completion: Optional[float] = None
    actual_cost: Optional[float] = None
    create_maintenance_record: Optional[bool] = False


class TodoReorder(BaseModel):
    todo_ids: List[int]  # Ordered list of todo IDs


# ============= TODO CRUD Endpoints =============

@router.get("/api/builds/{build_id}/todos")
async def get_build_todos(
    build_id: int,
    status: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all todos for a build, optionally filtered by status and category"""
    try:
        with get_db_cursor() as cursor:
            # Verify build access
            cursor.execute(
                "SELECT user_id FROM builds WHERE id = %s",
                (build_id,)
            )
            build = cursor.fetchone()
            if not build:
                raise HTTPException(status_code=404, detail="Build not found")
            if build['user_id'] != current_user['id']:
                raise HTTPException(status_code=403, detail="Access denied")

            # Build query with optional filters
            query = """
                SELECT t.*,
                       m.maintenance_type,
                       m.timestamp as maintenance_timestamp
                FROM build_todos t
                LEFT JOIN build_maintenance m ON t.maintenance_record_id = m.id
                WHERE t.build_id = %s
            """
            params = [build_id]

            if status:
                query += " AND t.status = %s"
                params.append(status)

            if category:
                query += " AND t.category = %s"
                params.append(category)

            query += " ORDER BY t.sort_order ASC, t.created_at DESC"

            cursor.execute(query, params)
            todos = cursor.fetchall()

            result = []
            for todo in todos:
                todo_dict = row_to_dict(todo)

                # Format dates for JSON serialization
                if isinstance(todo_dict.get('due_date'), date):
                    todo_dict['due_date'] = todo_dict['due_date'].isoformat()
                if isinstance(todo_dict.get('completed_at'), datetime):
                    todo_dict['completed_at'] = todo_dict['completed_at'].isoformat()
                if isinstance(todo_dict.get('created_at'), datetime):
                    todo_dict['created_at'] = todo_dict['created_at'].isoformat()
                if isinstance(todo_dict.get('updated_at'), datetime):
                    todo_dict['updated_at'] = todo_dict['updated_at'].isoformat()
                if isinstance(todo_dict.get('maintenance_timestamp'), datetime):
                    todo_dict['maintenance_timestamp'] = todo_dict['maintenance_timestamp'].isoformat()

                result.append(todo_dict)

            return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/builds/{build_id}/todos")
async def create_todo(
    build_id: int,
    todo: TodoCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new todo for a build"""
    try:
        with get_db_cursor() as cursor:
            # Verify build access
            cursor.execute(
                "SELECT user_id FROM builds WHERE id = %s",
                (build_id,)
            )
            build = cursor.fetchone()
            if not build:
                raise HTTPException(status_code=404, detail="Build not found")
            if build['user_id'] != current_user['id']:
                raise HTTPException(status_code=403, detail="Access denied")

            # Get max sort_order for this build
            cursor.execute(
                "SELECT COALESCE(MAX(sort_order), 0) as max_order FROM build_todos WHERE build_id = %s",
                (build_id,)
            )
            max_order = cursor.fetchone()['max_order']

            # Insert todo
            cursor.execute("""
                INSERT INTO build_todos
                (build_id, user_id, title, description, category, priority,
                 due_date, estimated_cost, custom_fields, sort_order, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                RETURNING id, created_at
            """, (
                build_id,
                current_user['id'],
                todo.title,
                todo.description,
                todo.category,
                todo.priority,
                todo.due_date,
                todo.estimated_cost,
                json.dumps(todo.custom_fields) if todo.custom_fields else None,
                max_order + 1
            ))

            result = cursor.fetchone()

            return {
                'success': True,
                'id': result['id'],
                'created_at': result['created_at'].isoformat(),
                'message': 'Todo created successfully'
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/todos/{todo_id}")
async def get_todo(
    todo_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific todo by ID"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT t.*, b.user_id as build_owner_id
                FROM build_todos t
                JOIN builds b ON t.build_id = b.id
                WHERE t.id = %s
            """, (todo_id,))

            todo = cursor.fetchone()
            if not todo:
                raise HTTPException(status_code=404, detail="Todo not found")

            if todo['build_owner_id'] != current_user['id']:
                raise HTTPException(status_code=403, detail="Access denied")

            todo_dict = row_to_dict(todo)

            # Format dates
            if isinstance(todo_dict.get('due_date'), date):
                todo_dict['due_date'] = todo_dict['due_date'].isoformat()
            if isinstance(todo_dict.get('completed_at'), datetime):
                todo_dict['completed_at'] = todo_dict['completed_at'].isoformat()
            if isinstance(todo_dict.get('created_at'), datetime):
                todo_dict['created_at'] = todo_dict['created_at'].isoformat()
            if isinstance(todo_dict.get('updated_at'), datetime):
                todo_dict['updated_at'] = todo_dict['updated_at'].isoformat()

            return todo_dict

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/todos/{todo_id}")
async def update_todo(
    todo_id: int,
    todo: TodoUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a todo"""
    try:
        with get_db_cursor() as cursor:
            # Verify access
            cursor.execute("""
                SELECT b.user_id
                FROM build_todos t
                JOIN builds b ON t.build_id = b.id
                WHERE t.id = %s
            """, (todo_id,))

            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Todo not found")
            if result['user_id'] != current_user['id']:
                raise HTTPException(status_code=403, detail="Access denied")

            # Build update query dynamically based on provided fields
            updates = []
            params = []

            if todo.title is not None:
                updates.append("title = %s")
                params.append(todo.title)

            if todo.description is not None:
                updates.append("description = %s")
                params.append(todo.description)

            if todo.category is not None:
                updates.append("category = %s")
                params.append(todo.category)

            if todo.priority is not None:
                updates.append("priority = %s")
                params.append(todo.priority)

            if todo.status is not None:
                updates.append("status = %s")
                params.append(todo.status)

            if todo.due_date is not None:
                updates.append("due_date = %s")
                params.append(todo.due_date)

            if todo.estimated_cost is not None:
                updates.append("estimated_cost = %s")
                params.append(todo.estimated_cost)

            if todo.custom_fields is not None:
                updates.append("custom_fields = %s")
                params.append(json.dumps(todo.custom_fields))

            if todo.sort_order is not None:
                updates.append("sort_order = %s")
                params.append(todo.sort_order)

            if not updates:
                return {'success': True, 'message': 'No changes to apply'}

            # Always update updated_at
            updates.append("updated_at = CURRENT_TIMESTAMP")

            params.append(todo_id)
            query = f"UPDATE build_todos SET {', '.join(updates)} WHERE id = %s"

            cursor.execute(query, params)

            return {'success': True, 'message': 'Todo updated successfully'}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/todos/{todo_id}/complete")
async def complete_todo(
    todo_id: int,
    completion: TodoComplete,
    current_user: dict = Depends(get_current_user)
):
    """Mark a todo as completed with completion details"""
    try:
        with get_db_cursor() as cursor:
            # Verify access and get todo details
            cursor.execute("""
                SELECT t.*, b.user_id, b.id as build_id
                FROM build_todos t
                JOIN builds b ON t.build_id = b.id
                WHERE t.id = %s
            """, (todo_id,))

            todo = cursor.fetchone()
            if not todo:
                raise HTTPException(status_code=404, detail="Todo not found")
            if todo['user_id'] != current_user['id']:
                raise HTTPException(status_code=403, detail="Access denied")

            maintenance_id = None

            # Optionally create a maintenance record
            if completion.create_maintenance_record:
                cursor.execute("""
                    INSERT INTO build_maintenance
                    (build_id, maintenance_type, timestamp, notes, odometer_miles,
                     engine_hours, cost)
                    VALUES (%s, %s, CURRENT_TIMESTAMP, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    todo['build_id'],
                    todo['category'] or 'General',
                    f"{todo['title']}\n\n{completion.completion_notes or ''}".strip(),
                    completion.odometer_at_completion,
                    completion.engine_hours_at_completion,
                    completion.actual_cost
                ))
                maintenance_id = cursor.fetchone()['id']

            # Update todo as completed
            cursor.execute("""
                UPDATE build_todos
                SET status = 'completed',
                    completed_at = CURRENT_TIMESTAMP,
                    completion_notes = %s,
                    odometer_at_completion = %s,
                    engine_hours_at_completion = %s,
                    actual_cost = %s,
                    maintenance_record_id = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                completion.completion_notes,
                completion.odometer_at_completion,
                completion.engine_hours_at_completion,
                completion.actual_cost,
                maintenance_id,
                todo_id
            ))

            return {
                'success': True,
                'message': 'Todo marked as completed',
                'maintenance_record_id': maintenance_id
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/todos/{todo_id}/reopen")
async def reopen_todo(
    todo_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Reopen a completed or cancelled todo"""
    try:
        with get_db_cursor() as cursor:
            # Verify access
            cursor.execute("""
                SELECT b.user_id
                FROM build_todos t
                JOIN builds b ON t.build_id = b.id
                WHERE t.id = %s
            """, (todo_id,))

            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Todo not found")
            if result['user_id'] != current_user['id']:
                raise HTTPException(status_code=403, detail="Access denied")

            # Reopen the todo
            cursor.execute("""
                UPDATE build_todos
                SET status = 'pending',
                    completed_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (todo_id,))

            return {'success': True, 'message': 'Todo reopened'}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/todos/{todo_id}")
async def delete_todo(
    todo_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a todo"""
    try:
        with get_db_cursor() as cursor:
            # Verify access
            cursor.execute("""
                SELECT b.user_id
                FROM build_todos t
                JOIN builds b ON t.build_id = b.id
                WHERE t.id = %s
            """, (todo_id,))

            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Todo not found")
            if result['user_id'] != current_user['id']:
                raise HTTPException(status_code=403, detail="Access denied")

            # Delete the todo
            cursor.execute("DELETE FROM build_todos WHERE id = %s", (todo_id,))

            return {'success': True, 'message': 'Todo deleted'}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/builds/{build_id}/todos/reorder")
async def reorder_todos(
    build_id: int,
    reorder: TodoReorder,
    current_user: dict = Depends(get_current_user)
):
    """Reorder todos by providing ordered list of IDs"""
    try:
        with get_db_cursor() as cursor:
            # Verify build access
            cursor.execute(
                "SELECT user_id FROM builds WHERE id = %s",
                (build_id,)
            )
            build = cursor.fetchone()
            if not build:
                raise HTTPException(status_code=404, detail="Build not found")
            if build['user_id'] != current_user['id']:
                raise HTTPException(status_code=403, detail="Access denied")

            # Update sort order for each todo
            for index, todo_id in enumerate(reorder.todo_ids):
                cursor.execute("""
                    UPDATE build_todos
                    SET sort_order = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND build_id = %s
                """, (index, todo_id, build_id))

            return {'success': True, 'message': 'Todos reordered'}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= Todo Statistics =============

@router.get("/api/builds/{build_id}/todos/stats")
async def get_todo_stats(
    build_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get statistics about todos for a build"""
    try:
        with get_db_cursor() as cursor:
            # Verify build access
            cursor.execute(
                "SELECT user_id FROM builds WHERE id = %s",
                (build_id,)
            )
            build = cursor.fetchone()
            if not build:
                raise HTTPException(status_code=404, detail="Build not found")
            if build['user_id'] != current_user['id']:
                raise HTTPException(status_code=403, detail="Access denied")

            # Get counts by status
            cursor.execute("""
                SELECT
                    status,
                    COUNT(*) as count
                FROM build_todos
                WHERE build_id = %s
                GROUP BY status
            """, (build_id,))

            status_counts = {row['status']: row['count'] for row in cursor.fetchall()}

            # Get counts by category
            cursor.execute("""
                SELECT
                    category,
                    COUNT(*) as count
                FROM build_todos
                WHERE build_id = %s AND category IS NOT NULL
                GROUP BY category
            """, (build_id,))

            category_counts = {row['category']: row['count'] for row in cursor.fetchall()}

            # Get overdue count
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM build_todos
                WHERE build_id = %s
                  AND status NOT IN ('completed', 'cancelled')
                  AND due_date < CURRENT_DATE
            """, (build_id,))

            overdue_count = cursor.fetchone()['count']

            # Get cost summary
            cursor.execute("""
                SELECT
                    SUM(estimated_cost) as total_estimated,
                    SUM(actual_cost) as total_actual
                FROM build_todos
                WHERE build_id = %s
            """, (build_id,))

            costs = cursor.fetchone()

            return {
                'status_counts': status_counts,
                'category_counts': category_counts,
                'overdue_count': overdue_count,
                'total_estimated_cost': float(costs['total_estimated']) if costs['total_estimated'] else 0,
                'total_actual_cost': float(costs['total_actual']) if costs['total_actual'] else 0
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
