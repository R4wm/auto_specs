# TODO Feature - Quick Setup Guide

## Overview

You now have a complete TODO system for tracking maintenance tasks, alignments, tire rotations, and other build-related action items. Each TODO can be marked complete with notes, odometer readings, costs, and optionally create a maintenance record.

## What Was Created

### Backend Files
1. **Migration**: `/home/rmintz/github/auto_specs/backend/migrations/versions/005_add_build_todos.py`
   - Creates `build_todos` table with all necessary fields
   - Adds indexes for performance

2. **API Endpoints**: `/home/rmintz/github/auto_specs/backend/todo_api.py`
   - Full CRUD operations for TODOs
   - Complete with notes endpoint
   - Statistics endpoint
   - Reorder functionality

3. **Documentation**: `/home/rmintz/github/auto_specs/backend/TODO_FEATURE.md`
   - Complete API documentation
   - Usage examples
   - Best practices

### Frontend Files
1. **BuildTodoList.tsx** - Main TODO list component with filtering and stats
2. **TodoItem.tsx** - Individual TODO item with actions
3. **TodoCreateModal.tsx** - Modal for creating new TODOs
4. **TodoCompleteModal.tsx** - Modal for completing TODOs with notes

### Updated Files
- **main.py** - Added todo_router registration

## Setup Steps

### 1. Run Database Migration

```bash
cd /home/rmintz/github/auto_specs/backend
alembic upgrade head
```

This will create the `build_todos` table in your database.

### 2. Restart Backend Server

```bash
# If using uvicorn
uvicorn main:app --reload --port 8000

# Or if you have a different startup command
python3 main.py
```

### 3. Add TODO Component to Build Detail Page

Edit your build detail page to include the TODO list:

```tsx
// In BuildDetailPage.tsx or similar
import { BuildTodoList } from '../components/BuildTodoList';

// Inside your component
<BuildTodoList buildId={buildId} />
```

### 4. Test the Feature

1. Navigate to a build detail page
2. Click "Add TODO"
3. Create a test TODO:
   - Title: "Rotate tires"
   - Category: "Tire Rotation"
   - Priority: "Medium"
   - Due Date: (pick a date)
   - Estimated Cost: $50

4. Test completing it:
   - Click "Complete"
   - Add notes about what was done
   - Enter odometer reading
   - Enter actual cost
   - Check "Create maintenance record" if desired
   - Click "Mark as Complete"

## Example Use Cases

### Regular Maintenance Tracking

**Alignment After Suspension Work:**
```
Title: 4-wheel alignment
Category: Alignment
Priority: High
Due Date: 2025-02-15
Description: Check alignment after installing new coilovers
Estimated Cost: $150
```

**When Complete:**
```
Completion Notes: Performed 4-wheel alignment. Front camber set to -1.5°,
caster at 4.0°, toe at 1/16" in. Rear camber -0.5°, toe 1/8" in.
Alignment shop: Joe's Alignment. Tech: Mike.

Odometer: 45250.5 mi
Actual Cost: $140
Create Maintenance Record: ✓
```

### Tire Rotation Schedule

**Quarterly Tire Rotation:**
```
Title: Rotate tires
Category: Tire Rotation
Priority: Medium
Due Date: 2025-03-01
Description: Rotate every 5000 miles
Estimated Cost: $50
```

**When Complete:**
```
Completion Notes: Rotated all 4 tires. Pattern: Front to rear, rear cross
to front. Checked pressure, set all to 32 PSI. Front left showed slight
inner edge wear - monitor alignment.

Odometer: 50125.0 mi
Actual Cost: $50
Create Maintenance Record: ✓
```

### Oil Change Tracking

```
Title: Oil change + filter
Category: Oil Change
Priority: High
Due Date: 2025-02-20
Description: Full synthetic 5W-30, K&N oil filter
Estimated Cost: $75
```

## API Examples

### Create a TODO
```bash
curl -X POST http://localhost:8000/api/builds/1/todos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wheel alignment",
    "category": "Alignment",
    "priority": "high",
    "due_date": "2025-02-15",
    "estimated_cost": 150.00,
    "description": "4-wheel alignment after lowering suspension"
  }'
```

### Complete a TODO
```bash
curl -X POST http://localhost:8000/api/todos/123/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completion_notes": "Alignment completed. All specs in range.",
    "odometer_at_completion": 45250.5,
    "actual_cost": 140.00,
    "create_maintenance_record": true
  }'
```

### Get All TODOs for a Build
```bash
curl http://localhost:8000/api/builds/1/todos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter by Status
```bash
curl "http://localhost:8000/api/builds/1/todos?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Statistics
```bash
curl http://localhost:8000/api/builds/1/todos/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Schema

```sql
CREATE TABLE build_todos (
    id SERIAL PRIMARY KEY,
    build_id INTEGER REFERENCES builds(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),

    -- Task info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),

    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',

    -- Dates
    due_date DATE,
    completed_at TIMESTAMP,

    -- Completion details
    completion_notes TEXT,
    odometer_at_completion NUMERIC(10,2),
    engine_hours_at_completion NUMERIC(10,2),

    -- Costs
    estimated_cost NUMERIC(10,2),
    actual_cost NUMERIC(10,2),

    -- Links
    maintenance_record_id INTEGER REFERENCES build_maintenance(id),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Available Categories

Pre-configured categories for common tasks:
- Maintenance
- Upgrade
- Repair
- Inspection
- **Alignment** ← Perfect for your use case
- **Tire Rotation** ← Perfect for your use case
- Oil Change
- Transmission Service
- Differential Service
- Coolant Flush
- Brake Service
- Spark Plugs
- Air Filter
- Fuel Filter
- Tuning
- Dyno
- Track Day Prep
- Other

## Priority Levels

- **Low**: Non-urgent tasks
- **Medium**: Normal priority (default)
- **High**: Important, should be done soon
- **Urgent**: Critical, needs immediate attention

## Status Workflow

```
pending → in_progress → completed
   ↑                        ↓
   └────────── reopen ──────┘
```

## Features

✅ **Create TODOs** - Track any maintenance or upgrade task
✅ **Priority Levels** - Mark urgent tasks
✅ **Due Dates** - Set deadlines and see overdue warnings
✅ **Categories** - Organize by type (Alignment, Tire Rotation, etc.)
✅ **Cost Tracking** - Estimate and actual costs
✅ **Completion Notes** - Document what was done with full details
✅ **Odometer/Hours Tracking** - Record mileage and engine hours
✅ **Maintenance Record Creation** - Link to formal build history
✅ **Statistics Dashboard** - See pending, completed, overdue counts
✅ **Filtering** - Filter by status and category
✅ **Reorder** - Drag to reorder (when implemented in UI)

## Integration with Existing Features

### Maintenance Records
When you complete a TODO with "Create maintenance record" checked:
1. A new entry is added to `build_maintenance` table
2. The maintenance record is linked to the TODO
3. A snapshot is created (via existing snapshot system)
4. All completion details are preserved

### Snapshots
TODOs that create maintenance records trigger the existing snapshot system, giving you full version history of your build.

## Troubleshooting

### Migration Fails
```bash
# Check current migration state
alembic current

# If stuck, try:
alembic stamp head
alembic upgrade head
```

### API Returns 404
- Ensure backend server restarted after adding `todo_api.py`
- Check that `main.py` includes `app.include_router(todo_router)`

### Component Not Showing
- Verify import path matches your file structure
- Check that `buildId` prop is being passed correctly

## Next Steps

1. Run the migration
2. Restart backend
3. Add component to build detail page
4. Test creating and completing TODOs
5. Customize categories if needed
6. Set up your maintenance schedule!

## Common TODO Examples to Try

1. **Tire Rotation Every 5K Miles**
   ```
   Title: Rotate tires
   Category: Tire Rotation
   Priority: Medium
   Due Date: [5000 miles from now]
   ```

2. **Post-Modification Alignment**
   ```
   Title: 4-wheel alignment
   Category: Alignment
   Priority: High
   Due Date: [ASAP after suspension work]
   ```

3. **Seasonal Tire Swap**
   ```
   Title: Install winter tires
   Category: Tire Rotation
   Priority: Medium
   Due Date: November 1
   ```

4. **Pre-Track Day Checklist**
   ```
   Title: Track day prep
   Category: Track Day Prep
   Priority: Urgent
   Due Date: [Day before track day]
   Description: Check fluids, tire pressure, brake pads, torque wheel lugs
   ```

## Documentation

Full documentation available at:
- **API Docs**: `/home/rmintz/github/auto_specs/backend/TODO_FEATURE.md`
- **Engine Specs Schema**: `/home/rmintz/github/auto_specs/backend/ENGINE_INTERNALS_SCHEMA.md`
- **All JSONB Schemas**: `/home/rmintz/github/auto_specs/backend/JSONB_SCHEMAS.md`

---

**Questions?** Check the full documentation in `TODO_FEATURE.md` for detailed API reference and examples.
