# Complete Implementation Plan: Auto Specs with Full JSON Version History

## Overview
- JSON-based flexible component tracking (engine, suspension, tires, differential, transmission, frame, cab/interior)
- **Full JSON snapshot history** - complete state saved before/after every change
- Every component supports individual specs and photo attachments
- Maintenance record tracking with complete before/after snapshots
- 2-tier subscription system (Default: 1 build/100MB, Premier: 10 builds/1GB)
- Stripe payment integration
- ClickSend SMS verification
- Deploy on specs.prsmusa.com subdomain

---

## 1. Database Schema Changes

### Add JSON columns to builds table
```sql
ALTER TABLE builds ADD COLUMN engine_internals_json JSONB;
ALTER TABLE builds ADD COLUMN suspension_json JSONB;
ALTER TABLE builds ADD COLUMN tires_wheels_json JSONB;
ALTER TABLE builds ADD COLUMN rear_differential_json JSONB;
ALTER TABLE builds ADD COLUMN transmission_json JSONB;
ALTER TABLE builds ADD COLUMN frame_json JSONB;
ALTER TABLE builds ADD COLUMN cab_interior_json JSONB;
ALTER TABLE builds ADD COLUMN brakes_json JSONB;
ALTER TABLE builds ADD COLUMN additional_components_json JSONB;
```

### Create build_json_snapshots table (VERSION HISTORY)
```sql
CREATE TABLE build_json_snapshots (
    id SERIAL PRIMARY KEY,
    build_id INTEGER NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
    maintenance_id INTEGER REFERENCES build_maintenance(id) ON DELETE SET NULL,

    -- Full JSON snapshots (complete state at this point in time)
    engine_internals_json JSONB,
    suspension_json JSONB,
    tires_wheels_json JSONB,
    rear_differential_json JSONB,
    transmission_json JSONB,
    frame_json JSONB,
    cab_interior_json JSONB,
    brakes_json JSONB,
    additional_components_json JSONB,

    -- Metadata
    snapshot_type TEXT NOT NULL,  -- 'maintenance', 'manual_edit', 'initial', 'before_change', 'after_change'
    change_description TEXT,      -- Summary of what changed
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_snapshots_build ON build_json_snapshots(build_id);
CREATE INDEX idx_snapshots_maintenance ON build_json_snapshots(maintenance_id);
CREATE INDEX idx_snapshots_created ON build_json_snapshots(created_at DESC);
```

### JSON Structure Examples

**engine_internals_json:**
```json
{
  "pistons": [
    {
      "cylinder_number": 1,
      "ring_gap_top_in": 0.016,
      "ring_gap_second_in": 0.018,
      "ring_gap_oil_in": 0.015,
      "piston_weight_oz": 450,
      "photo_path": "build_4/pistons/piston_1.jpg",
      "notes": "New forged piston"
    }
    // ... cylinders 2-8
  ],
  "bearings": [
    {
      "position": "Main 1",
      "clearance_in": 0.0025,
      "photo_path": "build_4/bearings/main_1.jpg"
    }
  ],
  "valvetrain": {
    "valve_springs": "Comp Cams dual springs",
    "pushrods": "Manton 7.850in",
    "rocker_ratio": "1.5:1"
  }
}
```

**rear_differential_json:**
```json
{
  "gear_ratio": "3.73:1",
  "type": "Limited Slip",
  "manufacturer": "Eaton",
  "model": "Truetrac",
  "fluid_type": "75W-90 Synthetic",
  "fluid_brand": "Royal Purple",
  "friction_modifier": "Yes",
  "photo_path": "build_4/differential/diff_installed.jpg",
  "components": [
    {
      "item": "Ring Gear",
      "part_number": "GM-12345",
      "teeth_count": 41,
      "photo_path": "build_4/differential/ring_gear.jpg"
    }
  ],
  "rebuild_info": {
    "date": "2024-11-01",
    "odometer": 75000,
    "notes": "Complete rebuild"
  }
}
```

**transmission_json:**
```json
{
  "type": "Manual",
  "model": "Tremec TKO-600",
  "gears": 5,
  "gear_ratios": {
    "1st": "2.87:1",
    "2nd": "1.89:1",
    "3rd": "1.28:1",
    "4th": "1.00:1",
    "5th": "0.64:1"
  },
  "fluid_type": "Dexron VI",
  "fluid_brand": "ACDelco",
  "capacity_quarts": 3.5,
  "photo_path": "build_4/transmission/trans_installed.jpg",
  "components": [
    {
      "item": "Clutch",
      "brand": "Centerforce",
      "model": "Dual Friction",
      "photo_path": "build_4/transmission/clutch.jpg"
    }
  ]
}
```

**frame_json:**
```json
{
  "type": "Body-on-frame",
  "material": "Steel ladder frame",
  "modifications": [
    {
      "description": "C-notch for rear suspension clearance",
      "location": "Rear rails",
      "date": "2024-06-15",
      "photo_path": "build_4/frame/cnotch.jpg"
    }
  ],
  "rust_repairs": [
    {
      "location": "Rear crossmember",
      "method": "Cut and weld new section",
      "date": "2024-05-20",
      "photo_path": "build_4/frame/repair.jpg"
    }
  ],
  "coating": {
    "type": "POR-15",
    "date_applied": "2024-07-01",
    "photo_path": "build_4/frame/coated.jpg"
  }
}
```

**cab_interior_json:**
```json
{
  "seats": {
    "front_left": {
      "brand": "Recaro",
      "model": "SPG",
      "color": "Black",
      "photo_path": "build_4/interior/driver_seat.jpg"
    },
    "front_right": {
      "brand": "Recaro",
      "model": "SPG",
      "photo_path": "build_4/interior/passenger_seat.jpg"
    }
  },
  "gauges": [
    {
      "type": "Oil Pressure",
      "brand": "AutoMeter",
      "model": "Sport-Comp",
      "size": "2-1/16 inch",
      "photo_path": "build_4/interior/oil_gauge.jpg"
    }
  ],
  "dashboard": {
    "type": "Aftermarket",
    "material": "Carbon fiber overlay",
    "photo_path": "build_4/interior/dash.jpg"
  },
  "steering_wheel": {
    "brand": "Grant",
    "diameter_in": 15,
    "photo_path": "build_4/interior/wheel.jpg"
  }
}
```

**suspension_json:**
```json
{
  "corners": [
    {
      "position": "front_left",
      "spring_rate": "600 lb/in",
      "spring_brand": "Eibach",
      "shock_brand": "Bilstein",
      "shock_model": "B8",
      "ride_height_in": 14.5,
      "photo_path": "build_4/suspension/fl.jpg"
    }
    // ... front_right, rear_left, rear_right
  ],
  "sway_bars": {
    "front": {
      "diameter_in": 1.25,
      "brand": "Addco",
      "photo_path": "build_4/suspension/front_sway.jpg"
    }
  }
}
```

**tires_wheels_json:**
```json
{
  "wheels": [
    {
      "position": "front_left",
      "size": "17x8",
      "brand": "Enkei",
      "model": "RPF1",
      "offset_mm": 35,
      "photo_path": "build_4/wheels/fl.jpg"
    }
  ],
  "tires": [
    {
      "position": "front_left",
      "size": "245/45R17",
      "brand": "Michelin",
      "model": "Pilot Sport 4S",
      "tread_depth_32nds": 10,
      "date_code": "0824",
      "photo_path": "build_4/tires/fl.jpg"
    }
  ]
}
```

### Create subscriptions table
```sql
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'default',
    status TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### Add to users table
```sql
ALTER TABLE users ADD COLUMN storage_used_bytes BIGINT DEFAULT 0;
```

### Maintenance attachments table
```sql
CREATE TABLE maintenance_attachments (
    id SERIAL PRIMARY KEY,
    maintenance_id INTEGER NOT NULL REFERENCES build_maintenance(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_type TEXT,
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_attachments ON maintenance_attachments(maintenance_id);
```

---

## 2. Backend Configuration (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/auto_specs

# Storage
STORAGE_PATH=/var/www/auto_specs/storage
MAX_UPLOAD_SIZE=10485760  # 10MB per file
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,pdf,heic

# Subscription limits
DEFAULT_BUILD_LIMIT=1
DEFAULT_STORAGE_LIMIT=104857600  # 100MB
PREMIER_BUILD_LIMIT=10
PREMIER_STORAGE_LIMIT=1073741824  # 1GB

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIER_PRICE_ID=price_...

# ClickSend SMS
CLICKSEND_USERNAME=your_username
CLICKSEND_API_KEY=your_api_key
CLICKSEND_FROM_NUMBER=+1234567890

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com

# JWT
SECRET_KEY=your_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# App
FRONTEND_URL=https://specs.prsmusa.com
ENVIRONMENT=production
```

---

## 3. Backend Changes (FastAPI)

### Update sms.py for ClickSend
```python
import requests
import os
from datetime import datetime, timedelta
import random
from db import get_db_cursor

def send_verification_code(phone_number: str) -> bool:
    """Send SMS verification code via ClickSend"""
    code = str(random.randint(100000, 999999))

    url = "https://rest.clicksend.com/v3/sms/send"
    auth = (os.getenv('CLICKSEND_USERNAME'), os.getenv('CLICKSEND_API_KEY'))

    payload = {
        "messages": [{
            "to": phone_number,
            "body": f"Your Auto Specs verification code is: {code}",
            "from": os.getenv('CLICKSEND_FROM_NUMBER')
        }]
    }

    response = requests.post(url, json=payload, auth=auth)

    if response.status_code == 200:
        with get_db_cursor() as cursor:
            expires_at = datetime.utcnow() + timedelta(minutes=10)
            cursor.execute(
                "INSERT INTO sms_verification_codes (phone_number, verification_code, expires_at) VALUES (%s, %s, %s)",
                (phone_number, code, expires_at)
            )
        return True
    return False
```

### Create snapshot_utils.py - JSON Snapshot Management
```python
from db import get_db_cursor
import json
from typing import Optional

def create_snapshot(
    build_id: int,
    user_id: int,
    snapshot_type: str,
    change_description: str = None,
    maintenance_id: int = None
) -> int:
    """
    Create a complete JSON snapshot of the build's current state
    Returns: snapshot_id
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
            current_state['engine_internals_json'],
            current_state['suspension_json'],
            current_state['tires_wheels_json'],
            current_state['rear_differential_json'],
            current_state['transmission_json'],
            current_state['frame_json'],
            current_state['cab_interior_json'],
            current_state['brakes_json'],
            current_state['additional_components_json']
        ))

        snapshot_id = cursor.fetchone()['id']
        return snapshot_id

def get_snapshot_diff(snapshot_before_id: int, snapshot_after_id: int) -> dict:
    """
    Compare two snapshots and return what changed
    """
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT * FROM build_json_snapshots WHERE id IN (%s, %s)
        """, (snapshot_before_id, snapshot_after_id))

        snapshots = cursor.fetchall()
        before = next(s for s in snapshots if s['id'] == snapshot_before_id)
        after = next(s for s in snapshots if s['id'] == snapshot_after_id)

    changes = {}
    json_fields = [
        'engine_internals_json', 'suspension_json', 'tires_wheels_json',
        'rear_differential_json', 'transmission_json', 'frame_json',
        'cab_interior_json', 'brakes_json', 'additional_components_json'
    ]

    for field in json_fields:
        if before[field] != after[field]:
            changes[field] = {
                'before': before[field],
                'after': after[field]
            }

    return changes

def restore_snapshot(build_id: int, snapshot_id: int, user_id: int) -> bool:
    """
    Restore build to a previous snapshot state
    Creates a new snapshot for the restoration
    """
    with get_db_cursor() as cursor:
        # Get snapshot to restore
        cursor.execute("SELECT * FROM build_json_snapshots WHERE id = %s", (snapshot_id,))
        snapshot = cursor.fetchone()

        # Create "before restore" snapshot
        create_snapshot(build_id, user_id, 'before_restore', f'Before restoring to snapshot {snapshot_id}')

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
            snapshot['engine_internals_json'],
            snapshot['suspension_json'],
            snapshot['tires_wheels_json'],
            snapshot['rear_differential_json'],
            snapshot['transmission_json'],
            snapshot['frame_json'],
            snapshot['cab_interior_json'],
            snapshot['brakes_json'],
            snapshot['additional_components_json'],
            build_id
        ))

        # Create "after restore" snapshot
        create_snapshot(build_id, user_id, 'restored', f'Restored to snapshot from {snapshot["created_at"]}')

        return True
```

### Create subscription.py utility module
```python
from db import get_db_cursor
from datetime import datetime
import os

def get_user_subscription(user_id: int) -> dict:
    """Get user's current subscription tier and limits"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT tier, status, end_date
            FROM subscriptions
            WHERE user_id = %s AND status = 'active'
            ORDER BY created_at DESC LIMIT 1
        """, (user_id,))
        sub = cursor.fetchone()

    tier = sub['tier'] if sub and sub['status'] == 'active' else 'default'

    if tier == 'premier':
        return {
            'tier': 'premier',
            'build_limit': int(os.getenv('PREMIER_BUILD_LIMIT')),
            'storage_limit': int(os.getenv('PREMIER_STORAGE_LIMIT'))
        }
    else:
        return {
            'tier': 'default',
            'build_limit': int(os.getenv('DEFAULT_BUILD_LIMIT')),
            'storage_limit': int(os.getenv('DEFAULT_STORAGE_LIMIT'))
        }

def check_build_limit(user_id: int) -> bool:
    """Check if user can create another build"""
    sub_info = get_user_subscription(user_id)

    with get_db_cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as count FROM builds WHERE user_id = %s", (user_id,))
        build_count = cursor.fetchone()['count']

    return build_count < sub_info['build_limit']

def check_storage_limit(user_id: int, file_size_bytes: int) -> bool:
    """Check if user has storage space for file"""
    sub_info = get_user_subscription(user_id)

    with get_db_cursor() as cursor:
        cursor.execute("SELECT storage_used_bytes FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

    current_usage = user['storage_used_bytes'] or 0
    return (current_usage + file_size_bytes) <= sub_info['storage_limit']

def update_storage_usage(user_id: int, bytes_delta: int):
    """Update user's storage usage"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            UPDATE users
            SET storage_used_bytes = COALESCE(storage_used_bytes, 0) + %s
            WHERE id = %s
        """, (bytes_delta, user_id))
```

### New API endpoints in main.py

**Snapshot endpoints:**
```python
@app.get("/api/builds/{build_id}/snapshots")
async def get_build_snapshots(build_id: int, current_user: dict = Depends(get_current_user)):
    """Get all snapshots for a build (version history timeline)"""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT s.*, u.first_name, u.last_name, m.maintenance_type
            FROM build_json_snapshots s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN build_maintenance m ON s.maintenance_id = m.id
            WHERE s.build_id = %s
            ORDER BY s.created_at DESC
        """, (build_id,))
        snapshots = cursor.fetchall()

    return [row_to_dict(s) for s in snapshots]

@app.get("/api/snapshots/{snapshot_id}/diff/{compare_to_id}")
async def get_snapshot_comparison(
    snapshot_id: int,
    compare_to_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Compare two snapshots and show what changed"""
    changes = get_snapshot_diff(compare_to_id, snapshot_id)
    return changes

@app.post("/api/builds/{build_id}/restore/{snapshot_id}")
async def restore_to_snapshot(
    build_id: int,
    snapshot_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Restore build to a previous snapshot"""
    success = restore_snapshot(build_id, snapshot_id, current_user['id'])
    return {'success': success}
```

**Subscription endpoints:**
```python
@app.get("/api/subscription")
async def get_subscription(current_user: dict = Depends(get_current_user)):
    """Get user's subscription status and usage"""
    sub_info = get_user_subscription(current_user['id'])

    with get_db_cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as count FROM builds WHERE user_id = %s", (current_user['id'],))
        builds_used = cursor.fetchone()['count']

        cursor.execute("SELECT storage_used_bytes FROM users WHERE id = %s", (current_user['id'],))
        storage_used = cursor.fetchone()['storage_used_bytes'] or 0

        cursor.execute("""
            SELECT * FROM subscriptions
            WHERE user_id = %s AND status = 'active'
            ORDER BY created_at DESC LIMIT 1
        """, (current_user['id'],))
        sub = cursor.fetchone()

    return {
        'tier': sub_info['tier'],
        'status': sub['status'] if sub else 'none',
        'builds_used': builds_used,
        'builds_limit': sub_info['build_limit'],
        'storage_used_bytes': storage_used,
        'storage_used_mb': round(storage_used / 1024 / 1024, 2),
        'storage_limit_bytes': sub_info['storage_limit'],
        'storage_limit_mb': round(sub_info['storage_limit'] / 1024 / 1024, 2),
        'end_date': sub['end_date'].isoformat() if sub and sub['end_date'] else None
    }

@app.post("/api/subscription/checkout")
async def create_checkout_session(current_user: dict = Depends(get_current_user)):
    """Create Stripe checkout session"""
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
        success_url=f"{os.getenv('FRONTEND_URL')}/subscription/success",
        cancel_url=f"{os.getenv('FRONTEND_URL')}/pricing",
        metadata={'user_id': current_user['id']}
    )

    return {'checkout_url': checkout_session.url}

@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    import stripe
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET')
        )
    except ValueError:
        raise HTTPException(status_code=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = int(session['metadata']['user_id'])

        with get_db_cursor() as cursor:
            cursor.execute("""
                INSERT INTO subscriptions
                (user_id, tier, status, stripe_customer_id, stripe_subscription_id, start_date)
                VALUES (%s, 'premier', 'active', %s, %s, NOW())
            """, (user_id, session['customer'], session['subscription']))

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']

        with get_db_cursor() as cursor:
            cursor.execute("""
                UPDATE subscriptions
                SET status = 'cancelled', cancelled_at = NOW(), end_date = NOW()
                WHERE stripe_subscription_id = %s
            """, (subscription['id'],))

    return {'status': 'success'}
```

**Build JSON update endpoints (with automatic snapshots):**
```python
@app.put("/api/builds/{build_id}/engine-internals")
async def update_engine_internals(
    build_id: int,
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update engine_internals_json with automatic snapshot"""
    create_snapshot(build_id, current_user['id'], 'before_change', 'Before engine internals update')

    with get_db_cursor() as cursor:
        cursor.execute("""
            UPDATE builds SET engine_internals_json = %s
            WHERE id = %s AND user_id = %s
        """, (json.dumps(data), build_id, current_user['id']))

    create_snapshot(build_id, current_user['id'], 'manual_edit', 'Updated engine internals')
    return {'success': True}

# Similar endpoints for:
# PUT /api/builds/{id}/suspension
# PUT /api/builds/{id}/tires-wheels
# PUT /api/builds/{id}/rear-differential
# PUT /api/builds/{id}/transmission
# PUT /api/builds/{id}/frame
# PUT /api/builds/{id}/cab-interior
```

**File upload endpoint:**
```python
from fastapi import UploadFile, File
import shutil
from pathlib import Path

@app.post("/api/builds/{build_id}/upload-component-photo")
async def upload_component_photo(
    build_id: int,
    component_type: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload component photo, returns file path"""

    # Check storage limit
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if not check_storage_limit(current_user['id'], file_size):
        raise HTTPException(status_code=400, detail="Storage limit exceeded")

    # Save file
    storage_path = Path(os.getenv('STORAGE_PATH'))
    save_dir = storage_path / f"build_{build_id}" / component_type
    save_dir.mkdir(parents=True, exist_ok=True)

    file_path = save_dir / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update storage usage
    update_storage_usage(current_user['id'], file_size)

    # Return relative path
    relative_path = f"build_{build_id}/{component_type}/{file.filename}"
    return {'file_path': relative_path}
```

**Maintenance endpoints (with snapshots):**
```python
@app.post("/api/builds/{build_id}/maintenance")
async def create_maintenance_record(
    build_id: int,
    maintenance: MaintenanceRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create maintenance record with before/after snapshots"""

    # Create "before maintenance" snapshot
    snapshot_before = create_snapshot(
        build_id,
        current_user['id'],
        'before_maintenance',
        f'Before {maintenance.maintenance_type}'
    )

    with get_db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO build_maintenance
            (build_id, maintenance_type, timestamp, notes, odometer_miles,
             engine_hours, brand, part_number, quantity, cost)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            build_id, maintenance.maintenance_type, maintenance.event_date,
            maintenance.notes, maintenance.odometer_miles, maintenance.engine_hours,
            maintenance.brand, maintenance.part_number, maintenance.quantity,
            maintenance.cost
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
        'id': maintenance_id,
        'snapshot_before': snapshot_before,
        'snapshot_after': snapshot_after
    }
```

---

## 4. Frontend Changes (React/TypeScript)

### Update api.ts
```typescript
export const snapshotsAPI = {
  getHistory: (buildId: number) =>
    axios.get(`/api/builds/${buildId}/snapshots`),

  compareDiff: (snapshotId: number, compareToId: number) =>
    axios.get(`/api/snapshots/${snapshotId}/diff/${compareToId}`),

  restore: (buildId: number, snapshotId: number) =>
    axios.post(`/api/builds/${buildId}/restore/${snapshotId}`)
};

export const subscriptionAPI = {
  getStatus: () => axios.get('/api/subscription'),
  createCheckoutSession: () => axios.post('/api/subscription/checkout'),
};

export const buildsAPI = {
  // ... existing methods
  updateEngineInternals: (id: number, data: any) =>
    axios.put(`/api/builds/${id}/engine-internals`, data),
  updateSuspension: (id: number, data: any) =>
    axios.put(`/api/builds/${id}/suspension`, data),
  updateRearDifferential: (id: number, data: any) =>
    axios.put(`/api/builds/${id}/rear-differential`, data),
  updateTransmission: (id: number, data: any) =>
    axios.put(`/api/builds/${id}/transmission`, data),
  updateFrame: (id: number, data: any) =>
    axios.put(`/api/builds/${id}/frame`, data),
  updateCabInterior: (id: number, data: any) =>
    axios.put(`/api/builds/${id}/cab-interior`, data),
  uploadComponentPhoto: (id: number, componentType: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('component_type', componentType);
    return axios.post(`/api/builds/${id}/upload-component-photo`, formData);
  }
};

export const maintenanceAPI = {
  create: (buildId: number, data: MaintenanceRecordCreate) =>
    axios.post(`/api/builds/${buildId}/maintenance`, data),
  uploadAttachment: (maintenanceId: number, file: File, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    return axios.post(`/api/maintenance/${maintenanceId}/attachments`, formData);
  }
};
```

### New Components to Create

1. **VersionHistoryTimeline.tsx** - Shows chronological timeline of all snapshots
2. **SnapshotComparison.tsx** - Side-by-side diff viewer
3. **SubscriptionBanner.tsx** - Shows tier and usage stats
4. **PricingPage.tsx** - Subscription comparison and checkout
5. **ComponentPhotoUpload.tsx** - Reusable photo upload component
6. **EngineInternalsEditor.tsx** - Grid showing 8 cylinders with specs
7. **RearDifferentialEditor.tsx** - Diff specs and components
8. **TransmissionEditor.tsx** - Trans specs and components
9. **FrameEditor.tsx** - Frame mods and rust repairs
10. **CabInteriorEditor.tsx** - Seats, gauges, dashboard
11. **SuspensionEditor.tsx** - 4 corners diagram
12. **TiresWheelsEditor.tsx** - 4 wheels + 4 tires
13. **MaintenanceRecordModal.tsx** - Create maintenance records

### Update BuildDetail.tsx
Add new sections:
- Engine Internals
- Rear Differential
- Transmission
- Frame
- Cab & Interior
- Suspension
- Tires & Wheels
- Version History
- Maintenance History

---

## 5. Nginx Configuration

### /etc/nginx/sites-available/specs.prsmusa.com
```nginx
server {
    listen 80;
    server_name specs.prsmusa.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name specs.prsmusa.com;

    ssl_certificate /etc/letsencrypt/live/specs.prsmusa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/specs.prsmusa.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /var/www/auto_specs/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    location /uploads/ {
        alias /var/www/auto_specs/storage/;
        expires 30d;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

---

## 6. Implementation Steps (Priority Order)

1. **Database migrations** - JSON columns, snapshots table, subscriptions
2. **Update sms.py** - ClickSend integration
3. **Backend: snapshot_utils.py** - Snapshot creation/comparison/restore
4. **Backend: subscription.py** - Tier checking utilities
5. **Backend: Stripe integration** - Checkout, webhooks
6. **Backend: File upload** - Component photo endpoint with storage limits
7. **Backend: Build JSON endpoints** - Update endpoints with automatic snapshots
8. **Backend: Maintenance API** - Create with before/after snapshots
9. **Frontend: Subscription UI** - Banner, pricing page
10. **Frontend: Version history UI** - Timeline, comparison, restore
11. **Frontend: Component editors** - All 8 component sections
12. **Frontend: Photo upload** - Reusable component
13. **Frontend: Maintenance modal** - With spec changes
14. **Enforce limits** - Build creation, file uploads
15. **Nginx configuration** - Set up subdomain
16. **SSL certificate** - Let's Encrypt
17. **Frontend build** - Production build
18. **Deploy & test** - End-to-end testing

---

## 7. Storage Organization

```
/var/www/auto_specs/storage/
├── build_1/
│   ├── pistons/
│   │   ├── piston_1.jpg
│   │   ├── piston_2.jpg
│   │   └── ...
│   ├── bearings/
│   ├── differential/
│   │   ├── diff_tag.jpg
│   │   └── ring_gear.jpg
│   ├── transmission/
│   ├── frame/
│   ├── interior/
│   ├── suspension/
│   ├── tires/
│   ├── wheels/
│   └── maintenance/
│       ├── 1/
│       │   ├── receipt.jpg
│       │   └── alignment_printout.pdf
```

---

## 8. Subscription Tier Summary

| Feature | Default (Free) | Premier ($9.99/mo) |
|---------|----------------|-------------------|
| Builds | 1 | 10 |
| Storage | 100MB | 1GB |
| Component Photos | ✓ | ✓ |
| Maintenance Tracking | ✓ | ✓ |
| Version History | ✓ | ✓ |
| Per-component specs | ✓ | ✓ |

---

## 9. Example User Flows

**Maintenance with automatic version tracking:**
1. User adds maintenance: "Installed new springs"
2. Backend creates "before" snapshot
3. User updates front_left spring_rate: "Stock" → "600 lb/in"
4. Backend creates "after" snapshot linked to maintenance
5. Timeline shows: "Jan 15, 2025 - Installed new springs" with before/after comparison

**Viewing version history:**
1. Click "Version History" tab
2. See timeline of all changes
3. Click maintenance record from 3 months ago
4. Click "Compare to current"
5. See side-by-side diff showing all changes
6. Option to "Restore to this version"

**Adding piston specs with photos:**
1. Navigate to build page
2. Click "Engine Internals" → "Edit"
3. See 8 cylinder grid
4. Click "Cylinder 1"
5. Enter ring gaps, piston weight
6. Upload photo of piston 1 rings
7. Save → Updates JSON + creates snapshot
8. Repeat for cylinders 2-8
