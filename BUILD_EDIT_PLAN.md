# Build Edit System with Maintenance-Driven Spec Updates

## Overview
This plan implements a comprehensive build editing system with maintenance records that can update build specifications automatically.

## Phase 1: Build Edit Page (Dedicated Edit Route)

### Frontend Components to Create:

#### 1. BuildEditPage.tsx
Main edit page with tabbed interface at `/builds/:id/edit`

**Features:**
- Tab navigation: Basic Info | Engine Specs | Engine Internals | Differential | Transmission | Suspension | Cab & Body | Tires/Wheels | Fluids
- Sticky save footer with buttons:
  - "Cancel" - Return to detail view without saving
  - "Save Draft" - Save to localStorage
  - "Save & Continue" - Save and stay on edit page
  - "Save & Exit" - Save and return to detail view
- Unsaved changes warning when navigating away
- Auto-save draft to localStorage every 30 seconds

#### 2. New Editor Components

**BasicInfoEditor.tsx**
- Build name
- Use type (Street, Race, Street/Strip)
- Fuel type (Pump Gas, E85, Race Gas)
- General notes

**EngineSpecsEditor.tsx**
- Displacement (CI)
- Bore & Stroke
- Rod length
- Deck clearance
- Piston dome volume
- Chamber volume
- Gasket specs
- Quench distance
- Static/Dynamic compression ratios
- Balance
- Flywheel teeth
- Firing order
- Camshaft specs (model, duration, lift, LSA)
- Ring gap measurements
- Bearing clearances

**SuspensionEditor.tsx**
- Front/rear suspension type
- Corner-by-corner tracking (4 corners):
  - Front Left: spring rate, shock model, adjustments
  - Front Right: spring rate, shock model, adjustments
  - Rear Left: spring rate, shock model, adjustments
  - Rear Right: spring rate, shock model, adjustments
- Sway bars (front/rear)
- Photo upload per corner

**CabBodyEditor.tsx**
Single tab with two subsections:

*Interior Subsection:*
- Seats (type, brand, model)
- Gauges (aftermarket dash, gauge cluster)
- Steering wheel
- HVAC system
- Sound system
- Roll cage/bar
- Safety equipment
- Photo uploads

*Exterior Subsection:*
- Headlights (stock/aftermarket)
- Fog lights
- Taillights
- Bumpers (front/rear)
- Tow hooks
- Side steps/running boards
- Bed liner (if truck)
- Grille
- Hood
- Fenders
- Paint/wrap
- Photo uploads

**TiresWheelsEditor.tsx**
- Individual corner tracking (4 corners):
  - Front Left: tire size, brand, model, wheel size, offset
  - Front Right: tire size, brand, model, wheel size, offset
  - Rear Left: tire size, brand, model, wheel size, offset
  - Rear Right: tire size, brand, model, wheel size, offset
- Tire pressure settings
- Photo upload per corner

**FluidsEditor.tsx**
- Engine oil (type, weight, capacity)
- Transmission fluid (type, capacity)
- Differential fluid (type, capacity)
- Coolant (type, capacity)
- Brake fluid type
- Power steering fluid
- Windshield washer fluid

#### 3. Already Built Components (Integrate)
- EngineInternalsEditor.tsx (pistons, rods, crank, block, heads)
- RearDifferentialEditor.tsx (housing, gears, carrier, axles)
- TransmissionEditor.tsx (basic info, gears, clutch/converter, internals)

### Backend API Endpoints to Add:

```python
PUT /api/builds/:id
# Update basic build info (name, use_type, fuel_type, notes)
# Creates snapshot before/after

PUT /api/builds/:id/engine-specs
# Update all engine specifications
# Creates snapshot before/after

PUT /api/builds/:id/fluids
# Update all fluid specifications
# Creates snapshot before/after
```

### Existing Endpoints (Already Implemented):
- `PUT /api/builds/:id/engine-internals`
- `PUT /api/builds/:id/rear-differential`
- `PUT /api/builds/:id/transmission`
- `PUT /api/builds/:id/suspension`
- `PUT /api/builds/:id/frame`
- `PUT /api/builds/:id/cab-interior`
- `PUT /api/builds/:id/tires-wheels`

All existing endpoints already create snapshots.

## Phase 2: Maintenance-Driven Spec Updates

### Enhanced MaintenanceRecordModal

#### 1. Add "Update Build Specs?" Section

After the parts section, add a new expandable section:

```
[✓] Update Build Specs?
    When enabled, shows relevant fields that can be updated
```

#### 2. Smart Field Suggestions Based on Maintenance Type

**Oil Change:**
- Suggests: engine_oil_type, engine_oil_weight, engine_oil_capacity
- User can add/remove fields

**Transmission Service:**
- Suggests: transmission_fluid_type, transmission_fluid_capacity
- Optionally: transmission_model (if replacing transmission)

**Differential Service:**
- Suggests: differential_fluid_type, differential_fluid_capacity
- Optionally: gear_ratio (if changing gears)

**Coolant Flush:**
- Suggests: coolant_type, coolant_capacity

**Brake Service:**
- Suggests: brake components from brakes_json

**Tire Rotation/Replacement:**
- Suggests: tire sizes, brands, models per corner

**Spark Plugs:**
- Suggests: spark plug info in engine_internals_json

**Upgrades/Repairs:**
- No suggestions, user manually selects any fields to update

**All Other Types:**
- User manually selects fields to update

#### 3. Spec Update UI Flow

```
┌─────────────────────────────────────┐
│ [✓] Update Build Specs?             │
├─────────────────────────────────────┤
│ Suggested Updates:                   │
│ ┌─────────────────────────────────┐ │
│ │ [✓] Engine Oil Type             │ │
│ │     Old: 5W-30 Synthetic         │ │
│ │     New: [10W-30 Synthetic___]   │ │
│ │                                  │ │
│ │ [✓] Engine Oil Weight            │ │
│ │     Old: 5W-30                   │ │
│ │     New: [10W-30___________]     │ │
│ │                                  │ │
│ │ [ ] Add More Fields...           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

When user clicks "Add More Fields...", show a searchable dropdown with all available spec fields.

#### 4. Backend Implementation

**Update `POST /api/builds/:id/maintenance` endpoint:**

```python
# Request body now accepts:
{
  "maintenance_type": "Oil Change",
  "event_date": "2024-10-29",
  "notes": "...",
  "parts": [...],
  "cost": 118.93,
  "spec_updates": {  # NEW FIELD
    "engine_oil_type": "10W-30 Synthetic",
    "engine_oil_weight": "10W-30"
  }
}

# Backend process:
1. Create snapshot_before (captures current state)
2. Create maintenance record
3. IF spec_updates provided:
   - Update build fields with new values
4. Create snapshot_after (captures new state, linked to maintenance_id)
5. Return success
```

**Database Schema (Already Exists):**
```sql
-- build_json_snapshots table tracks all changes
CREATE TABLE build_json_snapshots (
    id SERIAL PRIMARY KEY,
    build_id INTEGER REFERENCES builds(id),
    maintenance_id INTEGER REFERENCES build_maintenance(id), -- Links to maintenance
    snapshot_type VARCHAR(50), -- 'before_maintenance', 'maintenance', etc.
    change_description TEXT,
    -- All build data as JSON for complete history
    ...
);
```

### 5. Version History Display

On BuildDetail page, the Version History Timeline will show:

```
🔧 Oct 29, 2024 - Oil Change
    Changed 2 specifications:
    • Engine Oil Type: 5W-30 → 10W-30 Synthetic
    • Engine Oil Weight: 5W-30 → 10W-30

    Parts Used:
    • Motor Oil 10W-30 (Mobil 1) - 6 qts @ $8.99
    • Oil Filter (K&N HP-1017) - 1 @ $14.99
    Total Cost: $118.93

    [View Full Diff] [Restore This Version]
```

## Implementation Order

### Sprint 1: Build Edit Infrastructure
1. ✅ Create BuildEditPage.tsx with tab structure
2. ✅ Add route `/builds/:id/edit` to React Router
3. ✅ Implement sticky save footer with all buttons
4. ✅ Add unsaved changes warning

### Sprint 2: Simple Editors
5. ✅ Create BasicInfoEditor.tsx
6. ✅ Create EngineSpecsEditor.tsx
7. ✅ Create FluidsEditor.tsx
8. ✅ Add backend endpoints for these editors
9. ✅ Test save flow

### Sprint 3: Complex Editors
10. ✅ Integrate EngineInternalsEditor
11. ✅ Integrate RearDifferentialEditor
12. ✅ Integrate TransmissionEditor
13. ✅ Create SuspensionEditor with corner tracking
14. ✅ Create CabBodyEditor with interior/exterior subsections
15. ✅ Create TiresWheelsEditor with corner tracking

### Sprint 4: Maintenance-Spec Integration
16. ✅ Enhance MaintenanceRecordModal with "Update Build Specs?" toggle
17. ✅ Implement smart field suggestions
18. ✅ Add field selector UI
19. ✅ Update backend maintenance endpoint
20. ✅ Test full flow: maintenance → spec update → version history

### Sprint 5: Polish & Testing
21. ✅ Add auto-save draft functionality
22. ✅ Improve version history display
23. ✅ Add validation
24. ✅ End-to-end testing
25. ✅ Documentation

## User Workflows

### Workflow 1: Edit Build Directly
```
1. User views build at /builds/4
2. Clicks "Edit Build" button
3. Navigates to /builds/4/edit
4. Selects "Engine Specs" tab
5. Changes compression ratio from 9.5:1 to 10.5:1
6. Clicks "Save & Exit"
7. System creates snapshot
8. Redirects to /builds/4
9. User sees updated compression ratio
10. Version history shows the change
```

### Workflow 2: Maintenance Updates Specs
```
1. User views build at /builds/4
2. Clicks "Add Maintenance Record"
3. Selects "Transmission Service"
4. Adds parts: 12 qts ATF+4 @ $12.99, filter @ $45
5. Toggles "Update Build Specs?"
6. System suggests:
   - Transmission Fluid Type (old: Dexron VI → new: ATF+4)
   - Transmission Fluid Capacity (old: blank → new: 12 qts)
7. User accepts suggestions
8. Clicks "Save Maintenance Record"
9. System:
   - Creates snapshot_before
   - Creates maintenance record
   - Updates transmission_fluid_type = "ATF+4"
   - Updates transmission_fluid_capacity = "12 qts"
   - Creates snapshot_after (linked to maintenance)
10. User sees maintenance in history with spec changes
11. Version history shows: "Transmission Service - Changed 2 specs"
```

### Workflow 3: Compare Versions
```
1. User opens Version History
2. Sees multiple snapshots:
   - Oct 29: Oil Change
   - Oct 15: Differential Service (changed gear ratio)
   - Sept 3: Initial build
3. Clicks "View Changes" between Oct 15 and Sept 3
4. Sees diff:
   - Gear Ratio: 3.42:1 → 3.73:1
   - Differential Fluid: blank → 75W-90 GL-5
   - Parts: Richmond 3.73 gear set installed
5. Can click "Restore This Version" to rollback
```

## Benefits

1. **Complete History** - Every change tracked with before/after snapshots
2. **Accurate Records** - Specs always match current configuration
3. **Easy Updates** - Maintenance records automatically update relevant specs
4. **Flexible** - Users can always manually edit any field
5. **Traceable** - Can see exactly when and why each change was made
6. **Reversible** - Can restore any previous version

## Technical Notes

- All spec updates create snapshots automatically
- Snapshots store complete build state (all JSON fields)
- Maintenance records can optionally update specs
- Version history shows linked maintenance records
- Users can compare any two snapshots
- Rollback restores complete state from snapshot

## Future Enhancements

- [ ] Bulk import from CSV
- [ ] Export build sheet to PDF
- [ ] Share build (public link)
- [ ] Build comparison (compare two different builds)
- [ ] Maintenance reminders (e.g., "Oil change due at 80k miles")
- [ ] Cost tracking dashboard
- [ ] Performance gains tracking (HP/TQ changes over time)
