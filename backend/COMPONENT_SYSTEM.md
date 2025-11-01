# Component System Documentation

## Overview

The Auto Specs build system now uses a modular component architecture. Instead of storing all component data as JSONB columns in the builds table, each major component type has its own dedicated table with flexible JSONB storage.

## Benefits

- **Reusability**: Components can be shared across multiple builds
- **Templates**: Users can save proven configurations as templates
- **Organization**: Cleaner separation of concerns
- **Import/Export**: Easy backup and sharing of component configs
- **Flexibility**: JSONB still allows custom fields
- **Size Control**: 1MB limit per component prevents database bloat
- **Version History**: Event log tracks all changes

## Component Tables (11 Total)

Each component table follows this schema:

```sql
CREATE TABLE {component_name} (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_template BOOLEAN DEFAULT FALSE,
    component_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    data_size_bytes INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
)
```

### Component Types

1. **engine_internals** - Block, rotating assembly, valvetrain, pistons, etc.
2. **transmissions** - Gearbox specs, gear ratios, clutch/converter
3. **differentials** - Rear diff specs, gear ratio, locker type
4. **suspensions** - Front/rear suspension, springs, shocks, sway bars
5. **tires_wheels** - Tire and wheel specifications
6. **frames** - Frame and chassis modifications
7. **cab_interiors** - Cab and interior components
8. **brakes** - Brake system specifications
9. **fuel_systems** - Fuel pumps, regulators, lines, filters, tanks
10. **induction_systems** - Carbs, fuel injection, intake manifolds, air filters
11. **additional_components** - Miscellaneous parts and modifications

### Builds Table References

The `builds` table contains foreign key references to component tables:

```sql
ALTER TABLE builds
    ADD COLUMN engine_internals_id INTEGER REFERENCES engine_internals(id),
    ADD COLUMN transmission_id INTEGER REFERENCES transmissions(id),
    ADD COLUMN differential_id INTEGER REFERENCES differentials(id),
    ADD COLUMN suspension_id INTEGER REFERENCES suspensions(id),
    ADD COLUMN tires_wheels_id INTEGER REFERENCES tires_wheels(id),
    ADD COLUMN frame_id INTEGER REFERENCES frames(id),
    ADD COLUMN cab_interior_id INTEGER REFERENCES cab_interiors(id),
    ADD COLUMN brakes_id INTEGER REFERENCES brakes(id),
    ADD COLUMN fuel_system_id INTEGER REFERENCES fuel_systems(id),
    ADD COLUMN induction_system_id INTEGER REFERENCES induction_systems(id),
    ADD COLUMN additional_components_id INTEGER REFERENCES additional_components(id)
```

## API Endpoints

### Component CRUD

```
POST   /api/components/{component_type}              # Create component
GET    /api/components/{component_type}/{id}          # Get component
PATCH  /api/components/{component_type}/{id}          # Update component
DELETE /api/components/{component_type}/{id}          # Delete (if unused)
```

### Templates

```
GET    /api/templates/{component_type}                # List templates
POST   /api/components/{component_type}/{id}/clone    # Clone component
```

### Import/Export

```
GET    /api/components/{component_type}/{id}/export   # Export as JSON
POST   /api/components/{component_type}/import        # Import from JSON
```

### Component Types (URL parameter)

- `engine-internals`
- `transmission`
- `differential`
- `suspension`
- `tires-wheels`
- `frame`
- `cab-interior`
- `brakes`
- `fuel-system`
- `induction-system`
- `additional-components`

## Example Component Data

### Engine Internals

```json
{
  "block": {
    "brand": "Dart",
    "model": "SHP",
    "material": "iron",
    "bore": 4.125,
    "stroke": 3.75,
    "displacement_ci": 402
  },
  "pistons": {
    "brand": "JE",
    "model": "FSR",
    "compression_height": 1.56,
    "dome_cc": -10.5
  },
  "rods": {
    "brand": "Oliver",
    "length": 6.0,
    "material": "4340 steel"
  },
  "crank": {
    "brand": "Scat",
    "stroke": 3.75,
    "material": "forged steel"
  }
}
```

### Fuel System

```json
{
  "fuel_pump": {
    "type": "electric",
    "brand": "Holley",
    "model": "255 LPH",
    "flow_rate_lph": 255,
    "pressure_psi": 58
  },
  "fuel_regulator": {
    "brand": "Aeromotive",
    "model": "13129",
    "adjustable": true,
    "base_pressure_psi": 43
  },
  "fuel_lines": {
    "feed_size": "-6 AN",
    "return_size": "-6 AN",
    "material": "braided stainless"
  }
}
```

### Induction System

```json
{
  "type": "carburetor",
  "carburetor": {
    "brand": "Holley",
    "model": "0-80508",
    "cfm": 750,
    "venturi_type": "double pumper",
    "jetting": {
      "primary_jets": 74,
      "secondary_jets": 80,
      "power_valve": "6.5"
    }
  },
  "intake_manifold": {
    "brand": "Edelbrock",
    "model": "Performer RPM",
    "type": "dual_plane"
  }
}
```

## Size Limits

Each component's `component_data` JSONB is limited to **1MB** to prevent database bloat. This is enforced by the API and returns a 400 error if exceeded:

```json
{
  "detail": "Component data too large: 1.24MB exceeds 1.00MB limit"
}
```

## Creating a Component

### Frontend (TypeScript)

```typescript
import { componentsAPI } from './services/api';

const engineInternals = await componentsAPI.create('engine-internals', {
  name: "LS3 Stroker Build",
  description: "402ci stroker with forged internals",
  component_data: {
    block: { brand: "Dart", model: "SHP", bore: 4.125 },
    pistons: { brand: "JE", model: "FSR" }
  },
  is_template: false
});
```

### Backend (Python)

```python
from component_api import create_component

component = create_component(
    component_type='engine-internals',
    user_id=current_user['id'],
    name="LS3 Stroker Build",
    component_data={
        "block": {"brand": "Dart", "model": "SHP"},
        "pistons": {"brand": "JE", "model": "FSR"}
    }
)
```

## Templates

Mark a component as a template to make it available to all users:

```python
await componentsAPI.update('engine-internals', component_id, {
  is_template: true
});
```

List all templates:

```python
templates = await componentsAPI.listTemplates('engine-internals');
```

Clone a template:

```python
myComponent = await componentsAPI.clone('engine-internals', template_id, "My LS3 Build");
```

## Import/Export

### Export

```typescript
const exported = await componentsAPI.export('suspension', component_id);
// Save to file
const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
saveAs(blob, 'suspension-config.json');
```

### Import

```typescript
const fileData = JSON.parse(await file.text());
const imported = await componentsAPI.import('suspension', fileData);
```

## Migration from Old Schema

The migration process (migrations 008 and 009) automatically:

1. Creates all 11 component tables
2. Extracts existing JSONB data from builds table
3. Creates component records for each build
4. Links builds to new components via foreign keys
5. Drops old JSONB columns

All existing data is preserved during migration.

## Event Logging

Component changes are tracked in the `build_change_events` table. When a component is updated, the event logger records:

- Field path: `component_type:component_id:field.path` (e.g., `engine_internals:5:block.bore`)
- Old and new values
- Batch ID for grouping related changes
- User, timestamp, and description

This enables:
- Full change history
- Comparison between versions
- Rollback capabilities

## Best Practices

1. **Keep components focused**: Each component should represent a logical grouping
2. **Use descriptive names**: "LS3 402ci Stroker" is better than "Engine 1"
3. **Add descriptions**: Help future you remember why you configured it this way
4. **Create templates**: Share proven configurations
5. **Export backups**: Regularly export important components
6. **Stay under 1MB**: If you hit the limit, split into multiple components

## Future Enhancements

- Component versioning (save multiple versions of same component)
- Public template marketplace
- Component comparison tool
- Automatic schema validation per component type
- Cost tracking per component
- Weight tracking per component
