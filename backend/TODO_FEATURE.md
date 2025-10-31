# Build TODO Feature Documentation

## Overview

The Build TODO feature allows users to track tasks, maintenance items, upgrades, and action items for their builds. Each TODO can be created, tracked, completed with notes, and optionally converted into a formal maintenance record.

## Database Schema

### Table: `build_todos`

```sql
CREATE TABLE build_todos (
    id SERIAL PRIMARY KEY,
    build_id INTEGER NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),

    -- Task details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),  -- 'Maintenance', 'Upgrade', 'Repair', 'Inspection', etc.

    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'cancelled'
    priority VARCHAR(50) DEFAULT 'medium',  -- 'low', 'medium', 'high', 'urgent'

    -- Dates
    due_date DATE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Completion details
    completion_notes TEXT,
    odometer_at_completion NUMERIC(10,2),
    engine_hours_at_completion NUMERIC(10,2),

    -- Cost tracking
    estimated_cost NUMERIC(10,2),
    actual_cost NUMERIC(10,2),

    -- Related records
    maintenance_record_id INTEGER REFERENCES build_maintenance(id) ON DELETE SET NULL,

    -- Custom fields (JSON for flexibility)
    custom_fields JSONB,

    -- Sort order
    sort_order INTEGER DEFAULT 0
);
```

### Indexes

- `idx_todos_build` - Fast lookup by build_id
- `idx_todos_user` - Fast lookup by user_id
- `idx_todos_status` - Filter by status
- `idx_todos_category` - Filter by category
- `idx_todos_due_date` - Sort/filter by due date
- `idx_todos_priority` - Filter by priority
- `idx_todos_build_status` - Composite index for build + status queries
- `idx_todos_build_sort` - Support user-defined ordering

## API Endpoints

### 1. Get All TODOs for a Build

```http
GET /api/builds/{build_id}/todos?status=pending&category=Maintenance
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, in_progress, completed, cancelled)
- `category` (optional): Filter by category

**Response:**
```json
[
  {
    "id": 1,
    "build_id": 10,
    "user_id": 5,
    "title": "Rotate tires",
    "description": "Rotate all four tires, check pressure",
    "category": "Tire Rotation",
    "status": "pending",
    "priority": "medium",
    "due_date": "2025-02-15",
    "estimated_cost": 50.00,
    "created_at": "2025-01-30T10:00:00Z",
    "updated_at": "2025-01-30T10:00:00Z"
  }
]
```

### 2. Create a TODO

```http
POST /api/builds/{build_id}/todos
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Wheel alignment",
  "description": "4-wheel alignment after lowering suspension",
  "category": "Alignment",
  "priority": "high",
  "due_date": "2025-02-10",
  "estimated_cost": 150.00
}
```

**Response:**
```json
{
  "success": true,
  "id": 123,
  "created_at": "2025-01-30T10:00:00Z",
  "message": "Todo created successfully"
}
```

### 3. Update a TODO

```http
PUT /api/todos/{todo_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_progress",
  "priority": "urgent",
  "due_date": "2025-02-08"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Todo updated successfully"
}
```

### 4. Complete a TODO

```http
POST /api/todos/{todo_id}/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "completion_notes": "Rotated all tires, checked pressure. Set all to 32 PSI. Front left had slight wear on inside edge.",
  "odometer_at_completion": 45000.5,
  "engine_hours_at_completion": 250.5,
  "actual_cost": 50.00,
  "create_maintenance_record": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Todo marked as completed",
  "maintenance_record_id": 456
}
```

**Note:** If `create_maintenance_record` is true, a formal maintenance record will be created and linked to the TODO.

### 5. Reopen a TODO

```http
POST /api/todos/{todo_id}/reopen
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Todo reopened"
}
```

### 6. Delete a TODO

```http
DELETE /api/todos/{todo_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Todo deleted"
}
```

### 7. Reorder TODOs

```http
POST /api/builds/{build_id}/todos/reorder
Authorization: Bearer {token}
Content-Type: application/json

{
  "todo_ids": [5, 3, 1, 7, 2]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Todos reordered"
}
```

### 8. Get TODO Statistics

```http
GET /api/builds/{build_id}/todos/stats
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status_counts": {
    "pending": 5,
    "in_progress": 2,
    "completed": 12
  },
  "category_counts": {
    "Maintenance": 8,
    "Upgrade": 5,
    "Repair": 4,
    "Alignment": 2
  },
  "overdue_count": 1,
  "total_estimated_cost": 1500.00,
  "total_actual_cost": 1350.50
}
```

## Common Use Cases

### 1. Track Regular Maintenance

```json
{
  "title": "Oil change",
  "category": "Oil Change",
  "priority": "high",
  "due_date": "2025-03-01",
  "description": "5W-30 synthetic, replace oil filter",
  "estimated_cost": 75.00
}
```

### 2. Schedule Alignment After Modifications

```json
{
  "title": "4-wheel alignment",
  "category": "Alignment",
  "priority": "urgent",
  "description": "Check alignment after installing new coilovers",
  "due_date": "2025-02-05",
  "estimated_cost": 150.00
}
```

### 3. Track Tire Rotation

```json
{
  "title": "Rotate tires",
  "category": "Tire Rotation",
  "priority": "medium",
  "due_date": "2025-04-01",
  "description": "Rotate at 5000 mile intervals",
  "estimated_cost": 50.00
}
```

### 4. Plan Major Upgrades

```json
{
  "title": "Install turbo kit",
  "category": "Upgrade",
  "priority": "low",
  "description": "Garrett GTX3076R kit with supporting mods",
  "estimated_cost": 8500.00
}
```

### 5. Track Repairs

```json
{
  "title": "Fix exhaust leak",
  "category": "Repair",
  "priority": "high",
  "description": "Leak at header collector, replace gasket",
  "due_date": "2025-02-01",
  "estimated_cost": 120.00
}
```

## Frontend Components

### BuildTodoList Component

Main component that displays the TODO list with filtering, statistics, and action buttons.

**Location:** `/home/rmintz/github/auto_specs/frontend/src/components/BuildTodoList.tsx`

**Features:**
- Display todos grouped by status (Active vs Completed)
- Statistics dashboard showing pending, in progress, completed, and overdue counts
- Filter by status and category
- Add new TODO button
- Complete/delete/status change actions

**Usage:**
```tsx
import { BuildTodoList } from './components/BuildTodoList';

<BuildTodoList buildId={123} />
```

### TodoItem Component

Individual TODO item display with inline actions.

**Location:** `/home/rmintz/github/auto_specs/frontend/src/components/TodoItem.tsx`

**Features:**
- Color-coded priority badges
- Status badges
- Overdue warnings
- Completion details display
- Quick action buttons (Complete, Start, Pause, Delete)

### TodoCreateModal Component

Modal for creating new TODOs.

**Location:** `/home/rmintz/github/auto_specs/frontend/src/components/TodoCreateModal.tsx`

**Features:**
- Title, description, category selection
- Priority selection (low, medium, high, urgent)
- Due date picker
- Estimated cost input
- Pre-defined categories for common maintenance tasks

### TodoCompleteModal Component

Modal for marking TODOs as complete with detailed notes.

**Location:** `/home/rmintz/github/auto_specs/frontend/src/components/TodoCompleteModal.tsx`

**Features:**
- Completion notes text area
- Odometer reading input
- Engine hours input
- Actual cost tracking
- Option to create linked maintenance record

## Integration with Maintenance System

When a TODO is completed with `create_maintenance_record: true`, the system:

1. Creates a new entry in `build_maintenance` table
2. Links the maintenance record to the TODO via `maintenance_record_id`
3. Triggers a build snapshot (via existing snapshot system)
4. Records odometer/engine hours for tracking
5. Stores actual cost for budget tracking

This allows TODOs to seamlessly convert into formal maintenance history entries.

## Categories

Pre-defined categories include:
- **Maintenance** - General maintenance tasks
- **Upgrade** - Performance or cosmetic upgrades
- **Repair** - Fixing broken/worn components
- **Inspection** - Visual or mechanical inspections
- **Alignment** - Wheel alignment services
- **Tire Rotation** - Tire rotation services
- **Oil Change** - Oil and filter changes
- **Transmission Service** - Transmission fluid/filter
- **Differential Service** - Differential fluid service
- **Coolant Flush** - Coolant system service
- **Brake Service** - Brake pad/rotor service
- **Spark Plugs** - Spark plug replacement
- **Air Filter** - Air filter replacement
- **Fuel Filter** - Fuel filter replacement
- **Tuning** - ECU tuning or carburetor tuning
- **Dyno** - Dyno testing sessions
- **Track Day Prep** - Pre-track day preparation
- **Other** - Miscellaneous tasks

## Status Workflow

```
pending → in_progress → completed
   ↑           ↑            ↓
   └───────────┴────────reopen
```

- **pending**: Task not yet started
- **in_progress**: Currently working on task
- **completed**: Task finished with completion details
- **cancelled**: Task cancelled (optional, can be deleted instead)

## Priority Levels

- **low**: Non-urgent, can wait
- **medium**: Normal priority (default)
- **high**: Important, should be done soon
- **urgent**: Critical, needs immediate attention

## Cost Tracking

TODOs support both estimated and actual cost tracking:
- **Estimated Cost**: Budget/planning figure
- **Actual Cost**: Real cost after completion
- **Statistics endpoint** provides totals for both

## Custom Fields

The `custom_fields` JSONB column allows storing additional structured data:

```json
{
  "custom_fields": {
    "supplier": "AutoZone",
    "part_numbers": ["ABC123", "XYZ789"],
    "warranty_months": 12,
    "installation_time_hours": 2.5
  }
}
```

## Best Practices

### 1. Use Due Dates for Time-Sensitive Tasks
```json
{
  "title": "Replace brake pads before track day",
  "due_date": "2025-03-15",
  "priority": "urgent"
}
```

### 2. Document Everything in Completion Notes
```json
{
  "completion_notes": "Replaced all 4 brake pads and rotors. Used EBC Yellowstuff pads (DP41517R front, DP41518R rear) and OEM rotors. Bedded pads with 10 stops from 60mph. Brake feel is firm, pedal travel reduced by 20%."
}
```

### 3. Track Costs for Budgeting
```json
{
  "estimated_cost": 500.00,
  "actual_cost": 475.50
}
```

### 4. Create Maintenance Records for Important Tasks
Set `create_maintenance_record: true` for tasks that should appear in formal build history.

### 5. Use Categories Consistently
Stick to predefined categories for better reporting and filtering.

## Database Queries

### Find Overdue TODOs
```sql
SELECT * FROM build_todos
WHERE status NOT IN ('completed', 'cancelled')
  AND due_date < CURRENT_DATE
ORDER BY due_date ASC;
```

### Get TODO Summary by Category
```sql
SELECT category, COUNT(*) as count, SUM(actual_cost) as total_cost
FROM build_todos
WHERE build_id = 123 AND status = 'completed'
GROUP BY category;
```

### Find High Priority Pending TODOs
```sql
SELECT * FROM build_todos
WHERE build_id = 123
  AND status = 'pending'
  AND priority IN ('high', 'urgent')
ORDER BY due_date ASC NULLS LAST, priority DESC;
```

## Migration Instructions

To add the TODO feature to your database:

1. Run the migration:
```bash
cd /home/rmintz/github/auto_specs/backend
alembic upgrade head
```

2. Verify the table was created:
```bash
psql $DATABASE_URL -c "\d build_todos"
```

3. Restart the backend server to load the new API routes.

## Testing

### Create a Test TODO
```bash
curl -X POST http://localhost:8000/api/builds/1/todos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test TODO",
    "category": "Maintenance",
    "priority": "medium"
  }'
```

### Complete a TODO
```bash
curl -X POST http://localhost:8000/api/todos/1/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completion_notes": "Task completed successfully",
    "actual_cost": 50.00
  }'
```

## Future Enhancements

Potential additions to the TODO system:
- [ ] Recurring TODOs (e.g., oil change every 3000 miles)
- [ ] TODO templates for common maintenance schedules
- [ ] Email/SMS reminders for due dates
- [ ] Attach photos to completed TODOs
- [ ] Share TODO lists with mechanics/shops
- [ ] Integration with calendar apps
- [ ] Mobile app support
- [ ] TODO dependencies (Task B depends on Task A)
- [ ] Time tracking for labor hours
- [ ] Parts shopping list generation

## Summary

The Build TODO feature provides a comprehensive task management system for tracking all build-related activities from routine maintenance to major upgrades. It seamlessly integrates with the existing maintenance tracking and snapshot systems while providing flexibility for custom workflows.
