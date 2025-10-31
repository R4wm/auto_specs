"""
Additional API endpoints for snapshots, subscriptions, and enhanced build management.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
import json
import shutil
from pathlib import Path

from auth import get_current_user, get_current_user_optional
from db import get_db_cursor, row_to_dict
from snapshot_utils import (
    create_snapshot,
    get_snapshot_diff,
    restore_snapshot,
    get_build_snapshot_history,
    get_snapshot_by_id
)
from subscription import (
    get_subscription_status,
    create_subscription,
    cancel_subscription,
    update_subscription_from_stripe,
    check_build_limit,
    check_storage_limit,
    update_storage_usage
)

router = APIRouter()

# ============= Pydantic Models =============

class MaintenanceRecordCreate(BaseModel):
    maintenance_type: str
    event_date: str
    notes: Optional[str] = None
    odometer_miles: Optional[float] = None
    engine_hours: Optional[float] = None
    cost: Optional[float] = None
    brand: Optional[str] = None
    part_number: Optional[str] = None
    quantity: Optional[float] = None


# ============= Snapshot Endpoints =============

@router.get("/api/builds/{build_id}/snapshots")
async def get_build_snapshots(build_id: int, current_user: dict = Depends(get_current_user)):
    """Get all snapshots for a build (version history timeline)"""
    try:
        snapshots = get_build_snapshot_history(build_id)
        return snapshots
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/snapshots/{snapshot_id}")
async def get_snapshot(snapshot_id: int, current_user: dict = Depends(get_current_user)):
    """Get a specific snapshot by ID"""
    snapshot = get_snapshot_by_id(snapshot_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return snapshot


@router.get("/api/snapshots/{snapshot_id}/diff/{compare_to_id}")
async def get_snapshot_comparison(
    snapshot_id: int,
    compare_to_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Compare two snapshots and show what changed"""
    try:
        changes = get_snapshot_diff(compare_to_id, snapshot_id)
        return changes
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/builds/{build_id}/restore/{snapshot_id}")
async def restore_to_snapshot(
    build_id: int,
    snapshot_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Restore build to a previous snapshot"""
    try:
        success = restore_snapshot(build_id, snapshot_id, current_user['id'])
        return {'success': success, 'message': 'Build restored successfully'}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= Subscription Endpoints =============

@router.get("/api/subscription")
async def get_subscription(current_user: dict = Depends(get_current_user)):
    """Get user's subscription status and usage"""
    try:
        status = get_subscription_status(current_user['id'])
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/subscription/checkout")
async def create_checkout_session(current_user: dict = Depends(get_current_user)):
    """Create Stripe checkout session"""
    try:
        import stripe
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

        checkout_session = stripe.checkout.Session.create(
            customer_email=current_user['email'],
            payment_method_types=['card'],
            line_items=[{
                'price': os.getenv('STRIPE_PREMIER_PRICE_ID'),
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/subscription/success",
            cancel_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/pricing",
            metadata={'user_id': str(current_user['id'])}
        )

        return {'checkout_url': checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.post("/api/subscription/portal")
async def create_portal_session(current_user: dict = Depends(get_current_user)):
    """Create Stripe customer portal session"""
    try:
        import stripe
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

        # Get user's stripe customer ID
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT stripe_customer_id FROM subscriptions
                WHERE user_id = %s AND status = 'active'
                ORDER BY created_at DESC LIMIT 1
            """, (current_user['id'],))
            sub = cursor.fetchone()

        if not sub or not sub['stripe_customer_id']:
            raise HTTPException(status_code=404, detail="No active subscription found")

        portal_session = stripe.billing_portal.Session.create(
            customer=sub['stripe_customer_id'],
            return_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/builds"
        )

        return {'portal_url': portal_session.url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create portal session: {str(e)}")


@router.post("/api/webhooks/stripe")
async def stripe_webhook(request):
    """Handle Stripe webhooks"""
    try:
        import stripe
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET')
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")

        # Handle checkout.session.completed
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            user_id = int(session['metadata']['user_id'])

            create_subscription(
                user_id=user_id,
                tier='premier',
                stripe_customer_id=session['customer'],
                stripe_subscription_id=session['subscription']
            )

        # Handle subscription deleted
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            update_subscription_from_stripe(
                stripe_subscription_id=subscription['id'],
                status='cancelled',
                end_date=datetime.utcnow()
            )

        # Handle subscription updated
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            status = 'active' if subscription['status'] == 'active' else 'cancelled'
            update_subscription_from_stripe(
                stripe_subscription_id=subscription['id'],
                status=status
            )

        return {'status': 'success'}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Stripe webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============= Build JSON Update Endpoints =============

@router.put("/api/builds/{build_id}/engine-internals")
async def update_engine_internals(
    build_id: int,
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Update engine_internals_json with automatic snapshot"""
    try:
        # Create "before" snapshot
        create_snapshot(build_id, current_user['id'], 'before_change', 'Before engine internals update')

        with get_db_cursor() as cursor:
            cursor.execute("""
                UPDATE builds SET engine_internals_json = %s
                WHERE id = %s AND user_id = %s
            """, (json.dumps(data), build_id, current_user['id']))

        # Create "after" snapshot
        create_snapshot(build_id, current_user['id'], 'manual_edit', 'Updated engine internals')

        return {'success': True, 'message': 'Engine internals updated'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/builds/{build_id}/suspension")
async def update_suspension(
    build_id: int,
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Update suspension_json with automatic snapshot"""
    try:
        create_snapshot(build_id, current_user['id'], 'before_change', 'Before suspension update')

        with get_db_cursor() as cursor:
            cursor.execute("""
                UPDATE builds SET suspension_json = %s
                WHERE id = %s AND user_id = %s
            """, (json.dumps(data), build_id, current_user['id']))

        create_snapshot(build_id, current_user['id'], 'manual_edit', 'Updated suspension')
        return {'success': True, 'message': 'Suspension updated'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/builds/{build_id}/rear-differential")
async def update_rear_differential(
    build_id: int,
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Update rear_differential_json with automatic snapshot"""
    try:
        create_snapshot(build_id, current_user['id'], 'before_change', 'Before differential update')

        with get_db_cursor() as cursor:
            cursor.execute("""
                UPDATE builds SET rear_differential_json = %s
                WHERE id = %s AND user_id = %s
            """, (json.dumps(data), build_id, current_user['id']))

        create_snapshot(build_id, current_user['id'], 'manual_edit', 'Updated rear differential')
        return {'success': True, 'message': 'Rear differential updated'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/builds/{build_id}/transmission")
async def update_transmission(
    build_id: int,
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Update transmission_json with automatic snapshot"""
    try:
        create_snapshot(build_id, current_user['id'], 'before_change', 'Before transmission update')

        with get_db_cursor() as cursor:
            cursor.execute("""
                UPDATE builds SET transmission_json = %s
                WHERE id = %s AND user_id = %s
            """, (json.dumps(data), build_id, current_user['id']))

        create_snapshot(build_id, current_user['id'], 'manual_edit', 'Updated transmission')
        return {'success': True, 'message': 'Transmission updated'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/builds/{build_id}/frame")
async def update_frame(
    build_id: int,
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Update frame_json with automatic snapshot"""
    try:
        create_snapshot(build_id, current_user['id'], 'before_change', 'Before frame update')

        with get_db_cursor() as cursor:
            cursor.execute("""
                UPDATE builds SET frame_json = %s
                WHERE id = %s AND user_id = %s
            """, (json.dumps(data), build_id, current_user['id']))

        create_snapshot(build_id, current_user['id'], 'manual_edit', 'Updated frame')
        return {'success': True, 'message': 'Frame updated'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/builds/{build_id}/cab-interior")
async def update_cab_interior(
    build_id: int,
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Update cab_interior_json with automatic snapshot"""
    try:
        create_snapshot(build_id, current_user['id'], 'before_change', 'Before cab/interior update')

        with get_db_cursor() as cursor:
            cursor.execute("""
                UPDATE builds SET cab_interior_json = %s
                WHERE id = %s AND user_id = %s
            """, (json.dumps(data), build_id, current_user['id']))

        create_snapshot(build_id, current_user['id'], 'manual_edit', 'Updated cab/interior')
        return {'success': True, 'message': 'Cab/interior updated'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/builds/{build_id}/tires-wheels")
async def update_tires_wheels(
    build_id: int,
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Update tires_wheels_json with automatic snapshot"""
    try:
        create_snapshot(build_id, current_user['id'], 'before_change', 'Before tires/wheels update')

        with get_db_cursor() as cursor:
            cursor.execute("""
                UPDATE builds SET tires_wheels_json = %s
                WHERE id = %s AND user_id = %s
            """, (json.dumps(data), build_id, current_user['id']))

        create_snapshot(build_id, current_user['id'], 'manual_edit', 'Updated tires/wheels')
        return {'success': True, 'message': 'Tires/wheels updated'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= File Upload Endpoint =============

@router.post("/api/builds/{build_id}/upload-component-photo")
async def upload_component_photo(
    build_id: int,
    component_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload component photo with storage limit checking"""
    try:
        # Get file size
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)

        # Check storage limit
        if not check_storage_limit(current_user['id'], file_size):
            raise HTTPException(
                status_code=400,
                detail="Storage limit exceeded. Upgrade to Premier for more storage."
            )

        # Validate file extension
        allowed_extensions = os.getenv('ALLOWED_EXTENSIONS', 'jpg,jpeg,png,gif,pdf,heic').split(',')
        file_ext = file.filename.split('.')[-1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"File type .{file_ext} not allowed")

        # Check file size limit (10MB)
        max_size = int(os.getenv('MAX_UPLOAD_SIZE', '10485760'))
        if file_size > max_size:
            raise HTTPException(status_code=400, detail=f"File size exceeds {max_size/1024/1024}MB limit")

        # Save file
        storage_path = Path(os.getenv('STORAGE_PATH', '/tmp/auto_spec/storage'))
        save_dir = storage_path / f"build_{build_id}" / component_type
        save_dir.mkdir(parents=True, exist_ok=True)

        file_path = save_dir / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Update storage usage
        update_storage_usage(current_user['id'], file_size)

        # Return relative path for storing in JSON
        relative_path = f"build_{build_id}/{component_type}/{file.filename}"

        return {
            'success': True,
            'file_path': relative_path,
            'file_size': file_size,
            'message': 'File uploaded successfully'
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# ============= Maintenance Endpoints =============

@router.post("/api/builds/{build_id}/maintenance")
async def create_maintenance_record(
    build_id: int,
    maintenance: MaintenanceRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create maintenance record with before/after snapshots"""
    try:
        # Create "before maintenance" snapshot
        snapshot_before = create_snapshot(
            build_id,
            current_user['id'],
            'before_maintenance',
            f'Before {maintenance.maintenance_type}'
        )

        with get_db_cursor() as cursor:
            # Create maintenance record
            cursor.execute("""
                INSERT INTO build_maintenance
                (build_id, maintenance_type, timestamp, notes, odometer_miles,
                 engine_hours, brand, part_number, quantity)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                build_id, maintenance.maintenance_type, maintenance.event_date,
                maintenance.notes, maintenance.odometer_miles, maintenance.engine_hours,
                maintenance.brand, maintenance.part_number, maintenance.quantity
            ))

            maintenance_id = cursor.fetchone()['id']

        # Create "after maintenance" snapshot
        snapshot_after = create_snapshot(
            build_id,
            current_user['id'],
            'maintenance',
            f'{maintenance.maintenance_type} completed',
            maintenance_id
        )

        return {
            'success': True,
            'id': maintenance_id,
            'snapshot_before': snapshot_before,
            'snapshot_after': snapshot_after,
            'message': 'Maintenance record created'
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create maintenance record: {str(e)}")


@router.put("/api/builds/{build_id}/maintenance/{maintenance_id}")
async def update_maintenance_record(
    build_id: int,
    maintenance_id: int,
    maintenance: MaintenanceRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update maintenance record and create revision snapshot"""
    try:
        # Create "before edit" snapshot
        snapshot_before = create_snapshot(
            build_id,
            current_user['id'],
            'before_maintenance_edit',
            f'Before editing {maintenance.maintenance_type}'
        )

        with get_db_cursor() as cursor:
            # Update maintenance record
            cursor.execute("""
                UPDATE build_maintenance
                SET maintenance_type = %s,
                    timestamp = %s,
                    notes = %s,
                    odometer_miles = %s,
                    engine_hours = %s,
                    brand = %s,
                    part_number = %s,
                    quantity = %s
                WHERE id = %s AND build_id = %s
            """, (
                maintenance.maintenance_type,
                maintenance.event_date,
                maintenance.notes,
                maintenance.odometer_miles,
                maintenance.engine_hours,
                maintenance.brand,
                maintenance.part_number,
                maintenance.quantity,
                maintenance_id,
                build_id
            ))

            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Maintenance record not found")

        # Create "after edit" snapshot
        snapshot_after = create_snapshot(
            build_id,
            current_user['id'],
            'maintenance_edit',
            f'{maintenance.maintenance_type} updated',
            maintenance_id
        )

        return {
            'success': True,
            'id': maintenance_id,
            'snapshot_before': snapshot_before,
            'snapshot_after': snapshot_after,
            'message': 'Maintenance record updated'
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update maintenance record: {str(e)}")


@router.post("/api/maintenance/{maintenance_id}/attachments")
async def upload_maintenance_attachment(
    maintenance_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload attachment for maintenance record"""
    try:
        # Get file size
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)

        # Check storage limit
        if not check_storage_limit(current_user['id'], file_size):
            raise HTTPException(status_code=400, detail="Storage limit exceeded")

        # Get build_id from maintenance record
        with get_db_cursor() as cursor:
            cursor.execute("SELECT build_id FROM build_maintenance WHERE id = %s", (maintenance_id,))
            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Maintenance record not found")
            build_id = result['build_id']

        # Save file
        storage_path = Path(os.getenv('STORAGE_PATH', '/tmp/auto_spec/storage'))
        save_dir = storage_path / f"build_{build_id}" / "maintenance" / str(maintenance_id)
        save_dir.mkdir(parents=True, exist_ok=True)

        file_path = save_dir / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Store attachment record
        relative_path = f"build_{build_id}/maintenance/{maintenance_id}/{file.filename}"

        with get_db_cursor() as cursor:
            cursor.execute("""
                INSERT INTO maintenance_attachments
                (maintenance_id, file_path, file_name, file_size_bytes, file_type, description)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                maintenance_id, relative_path, file.filename, file_size,
                file.content_type, description
            ))
            attachment_id = cursor.fetchone()['id']

        # Update storage usage
        update_storage_usage(current_user['id'], file_size)

        return {
            'success': True,
            'id': attachment_id,
            'file_path': relative_path,
            'file_size': file_size
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/api/maintenance/{maintenance_id}/attachments")
async def get_maintenance_attachments(
    maintenance_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get all attachments for a maintenance record"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT * FROM maintenance_attachments
                WHERE maintenance_id = %s
                ORDER BY uploaded_at DESC
            """, (maintenance_id,))
            attachments = cursor.fetchall()

        return [row_to_dict(att) for att in attachments]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= Component Notes Endpoints =============

class ComponentNoteCreate(BaseModel):
    content: str

class ComponentNoteUpdate(BaseModel):
    content: str


# Map component names to database columns
COMPONENT_COLUMN_MAP = {
    'engine-internals': 'engine_internals_json',
    'suspension': 'suspension_json',
    'tires-wheels': 'tires_wheels_json',
    'rear-differential': 'rear_differential_json',
    'transmission': 'transmission_json',
    'frame': 'frame_json',
    'cab-interior': 'cab_interior_json',
    'brakes': 'brakes_json',
    'additional-components': 'additional_components_json'
}


def get_component_data(build_id: int, component: str, user_id: int) -> dict:
    """Helper to fetch component JSON data from database"""
    column = COMPONENT_COLUMN_MAP.get(component)
    if not column:
        raise ValueError(f"Invalid component: {component}")

    with get_db_cursor() as cursor:
        cursor.execute(f"""
            SELECT {column}, user_id
            FROM builds
            WHERE id = %s
        """, (build_id,))
        result = cursor.fetchone()

        if not result:
            raise ValueError("Build not found")

        # Check ownership
        if result['user_id'] != user_id:
            raise ValueError("Not authorized")

        data = result[column] or {}
        return data


def update_component_data(build_id: int, component: str, user_id: int, data: dict):
    """Helper to update component JSON data in database"""
    column = COMPONENT_COLUMN_MAP.get(component)
    if not column:
        raise ValueError(f"Invalid component: {component}")

    with get_db_cursor() as cursor:
        cursor.execute(f"""
            UPDATE builds
            SET {column} = %s
            WHERE id = %s AND user_id = %s
        """, (json.dumps(data), build_id, user_id))


@router.post("/api/builds/{build_id}/{component}/notes")
async def add_component_note(
    build_id: int,
    component: str,
    note_data: ComponentNoteCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add a note to a component with audit trail"""
    try:
        # Validate component name
        if component not in COMPONENT_COLUMN_MAP:
            raise HTTPException(status_code=400, detail=f"Invalid component: {component}")

        # Create "before" snapshot
        create_snapshot(build_id, current_user['id'], 'before_change', f'Before adding note to {component}')

        # Get current component data
        data = get_component_data(build_id, component, current_user['id'])

        # Initialize notes_array if it doesn't exist
        if 'notes_array' not in data:
            data['notes_array'] = []

        # Create new note
        timestamp = datetime.utcnow().isoformat() + 'Z'
        note_id = f"note_{int(datetime.utcnow().timestamp() * 1000)}"

        new_note = {
            'id': note_id,
            'timestamp': timestamp,
            'user_id': current_user['id'],
            'user_name': f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or current_user.get('email', 'Unknown'),
            'content': note_data.content,
            'action_type': 'add'
        }

        # Add note to array
        data['notes_array'].append(new_note)

        # Update database
        update_component_data(build_id, component, current_user['id'], data)

        # Create "after" snapshot
        create_snapshot(build_id, current_user['id'], 'note_add', f'Added note to {component}')

        return {
            'success': True,
            'note': new_note,
            'message': 'Note added successfully'
        }

    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/builds/{build_id}/{component}/notes/{note_id}")
async def update_component_note(
    build_id: int,
    component: str,
    note_id: str,
    note_data: ComponentNoteUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Edit a note in a component with audit trail"""
    try:
        # Validate component name
        if component not in COMPONENT_COLUMN_MAP:
            raise HTTPException(status_code=400, detail=f"Invalid component: {component}")

        # Create "before" snapshot
        create_snapshot(build_id, current_user['id'], 'before_change', f'Before editing note in {component}')

        # Get current component data
        data = get_component_data(build_id, component, current_user['id'])

        # Find and update the note
        if 'notes_array' not in data:
            raise HTTPException(status_code=404, detail="No notes found")

        note_found = False
        for note in data['notes_array']:
            if note['id'] == note_id:
                # Check if user owns the note
                if note['user_id'] != current_user['id']:
                    raise HTTPException(status_code=403, detail="Not authorized to edit this note")

                # Update note content and metadata
                note['content'] = note_data.content
                note['last_edited'] = datetime.utcnow().isoformat() + 'Z'
                note['action_type'] = 'edit'
                note_found = True
                updated_note = note
                break

        if not note_found:
            raise HTTPException(status_code=404, detail="Note not found")

        # Update database
        update_component_data(build_id, component, current_user['id'], data)

        # Create "after" snapshot
        create_snapshot(build_id, current_user['id'], 'note_edit', f'Edited note in {component}')

        return {
            'success': True,
            'note': updated_note,
            'message': 'Note updated successfully'
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/builds/{build_id}/{component}/notes/{note_id}")
async def delete_component_note(
    build_id: int,
    component: str,
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a note from a component with audit trail"""
    try:
        # Validate component name
        if component not in COMPONENT_COLUMN_MAP:
            raise HTTPException(status_code=400, detail=f"Invalid component: {component}")

        # Create "before" snapshot
        create_snapshot(build_id, current_user['id'], 'before_change', f'Before deleting note from {component}')

        # Get current component data
        data = get_component_data(build_id, component, current_user['id'])

        # Find and remove the note
        if 'notes_array' not in data:
            raise HTTPException(status_code=404, detail="No notes found")

        original_length = len(data['notes_array'])
        data['notes_array'] = [
            note for note in data['notes_array']
            if not (note['id'] == note_id and note['user_id'] == current_user['id'])
        ]

        if len(data['notes_array']) == original_length:
            raise HTTPException(status_code=404, detail="Note not found or not authorized")

        # Update database
        update_component_data(build_id, component, current_user['id'], data)

        # Create "after" snapshot
        create_snapshot(build_id, current_user['id'], 'note_delete', f'Deleted note from {component}')

        return {
            'success': True,
            'message': 'Note deleted successfully'
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/builds/{build_id}/{component}/notes")
async def get_component_notes(
    build_id: int,
    component: str,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Get all notes for a component (public read access)"""
    try:
        # Validate component name
        if component not in COMPONENT_COLUMN_MAP:
            raise HTTPException(status_code=400, detail=f"Invalid component: {component}")

        column = COMPONENT_COLUMN_MAP[component]

        with get_db_cursor() as cursor:
            cursor.execute(f"""
                SELECT {column}
                FROM builds
                WHERE id = %s
            """, (build_id,))
            result = cursor.fetchone()

            if not result:
                raise HTTPException(status_code=404, detail="Build not found")

            data = result[column] or {}
            notes = data.get('notes_array', [])

            return {
                'success': True,
                'notes': notes
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
