# JSONB Column Schemas Reference

This document provides an overview of all JSONB columns in the `builds` table and their standardized schemas.

## Available JSONB Columns

1. **engine_internals_json** - Internal engine components (pistons, rods, crank, cam, etc.)
2. **suspension_json** - Suspension components and settings
3. **tires_wheels_json** - Tire and wheel specifications
4. **rear_differential_json** - Rear differential specifications
5. **transmission_json** - Transmission details and settings
6. **frame_json** - Frame and chassis modifications
7. **cab_interior_json** - Cab and interior components
8. **brakes_json** - Brake system specifications
9. **additional_components_json** - Miscellaneous components

## Quick Reference

| Column | Use Case | Key Fields |
|--------|----------|------------|
| `engine_internals_json` | Pistons, rods, crank, cam, valvetrain, bearings | crankshaft, connecting_rods, pistons, camshaft, bearings |
| `suspension_json` | Springs, shocks, sway bars | front_left, front_right, rear_left, rear_right |
| `tires_wheels_json` | Tire/wheel specs for each corner | front_left, front_right, rear_left, rear_right |
| `rear_differential_json` | Differential internals | gears, carrier, axles, limited_slip |
| `transmission_json` | Trans internals and clutch | clutch, torque_converter, gearset, valve_body |
| `frame_json` | Chassis modifications | material, reinforcements, modifications |
| `cab_interior_json` | Interior components | seats, roll_cage, gauges, safety_equipment |
| `brakes_json` | Brake system | calipers, rotors, master_cylinder, lines |
| `additional_components_json` | Everything else | Flexible structure for misc parts |

## Detailed Schema Examples

### 1. engine_internals_json

See [ENGINE_INTERNALS_SCHEMA.md](./ENGINE_INTERNALS_SCHEMA.md) for complete details.

**Summary Structure:**
```json
{
  "crankshaft": {...},
  "connecting_rods": {
    "type": "Pro-Stock I-Beam",
    "length_in": 5.400,
    "bolts": {
      "type": "ARP 8740",
      "size": "3/8\""
    }
  },
  "pistons": {
    "design": "flat-top",
    "oversize_in": 0.030,
    "material": "forged aluminum"
  },
  "camshaft": {...},
  "valvetrain": {...},
  "bearings": {...}
}
```

### 2. suspension_json

**Structure:**
```json
{
  "front_type": "Independent A-arm",
  "rear_type": "4-Link",
  "front_left": {
    "spring_rate": "500 lb/in",
    "spring_manufacturer": "Eibach",
    "spring_part_number": "EIB-500",
    "shock_model": "Fox 2.5 Coilover",
    "shock_manufacturer": "Fox Racing",
    "shock_part_number": "FOX-985-02-098",
    "adjustments": "Compression: 12 clicks, Rebound: 8 clicks",
    "ride_height_in": 14.5
  },
  "front_right": {
    "spring_rate": "500 lb/in",
    "shock_model": "Fox 2.5 Coilover",
    "adjustments": "Compression: 12 clicks, Rebound: 8 clicks",
    "ride_height_in": 14.5
  },
  "rear_left": {
    "spring_rate": "300 lb/in",
    "shock_model": "Fox 2.0 Smooth Body",
    "adjustments": "Rebound: 10 clicks",
    "ride_height_in": 16.0
  },
  "rear_right": {
    "spring_rate": "300 lb/in",
    "shock_model": "Fox 2.0 Smooth Body",
    "adjustments": "Rebound: 10 clicks",
    "ride_height_in": 16.0
  },
  "sway_bar_front": "1.25\" Hellwig",
  "sway_bar_rear": "None",
  "alignment": {
    "front_camber_deg": -1.5,
    "front_caster_deg": 4.0,
    "front_toe_in": "1/16\"",
    "rear_camber_deg": -0.5,
    "rear_toe_in": "1/8\""
  },
  "notes": "Corner balanced at 50% cross weight"
}
```

### 3. tires_wheels_json

**Structure:**
```json
{
  "front_left": {
    "wheel": {
      "manufacturer": "Method Race Wheels",
      "model": "MR305 NV",
      "diameter_in": 17,
      "width_in": 9.0,
      "offset_mm": 0,
      "backspace_in": 5.0,
      "material": "aluminum",
      "finish": "bronze",
      "bolt_pattern": "6x5.5",
      "weight_lbs": 28.5
    },
    "tire": {
      "manufacturer": "BFGoodrich",
      "model": "KM3",
      "size": "35x12.50R17",
      "load_range": "E",
      "ply": 10,
      "pressure_psi": 28,
      "weight_lbs": 72.0,
      "tread_depth_32nds": 18
    }
  },
  "front_right": {
    "wheel": {...},
    "tire": {...}
  },
  "rear_left": {
    "wheel": {...},
    "tire": {...}
  },
  "rear_right": {
    "wheel": {...},
    "tire": {...}
  },
  "spare": {
    "wheel": {...},
    "tire": {...},
    "location": "bed mounted"
  },
  "notes": "Rotated every 5000 miles"
}
```

### 4. rear_differential_json

**Structure:**
```json
{
  "type": "Dana 60",
  "manufacturer": "AAM",
  "gear_ratio": "4.10",
  "ring_gear": {
    "manufacturer": "Yukon Gear",
    "part_number": "YG D60-410",
    "tooth_count": 41
  },
  "pinion_gear": {
    "tooth_count": 10
  },
  "carrier": {
    "type": "full float",
    "manufacturer": "Yukon Gear",
    "part_number": "YC D123456"
  },
  "limited_slip": {
    "type": "Detroit Locker",
    "manufacturer": "Eaton",
    "model": "Detroit Locker",
    "part_number": "DET-187SL-1A"
  },
  "axle_shafts": {
    "manufacturer": "RCV Performance",
    "material": "chromoly",
    "diameter_in": 1.5,
    "spline_count": 35,
    "length_left_in": 37.0,
    "length_right_in": 37.0
  },
  "bearings": {
    "carrier_bearings": "Timken SET45",
    "pinion_bearings": "Timken SET47"
  },
  "setup_specs": {
    "backlash_in": 0.006,
    "pinion_depth_in": 3.125,
    "pattern": "centered on tooth",
    "preload_in_lbs": 18
  },
  "fluid": {
    "type": "75W-90 synthetic",
    "brand": "Royal Purple",
    "capacity_quarts": 5.5,
    "friction_modifier": "Royal Purple Max-Gear additive"
  },
  "cover": {
    "type": "nodular iron",
    "manufacturer": "Mag-Hytec",
    "capacity_quarts": 7.0
  },
  "notes": "Built by Drivetrain Specialists, setup date 2024-01-20"
}
```

### 5. transmission_json

**Structure:**
```json
{
  "type": "4L80E",
  "manufacturer": "General Motors",
  "case_material": "aluminum",
  "bellhousing_pattern": "Chevy V8",

  "torque_converter": {
    "manufacturer": "Circle D",
    "stall_rpm": 3200,
    "diameter_in": 11.5,
    "part_number": "CD-245",
    "lockup_type": "multi-disc",
    "notes": "Billet front cover"
  },

  "clutch": null,

  "gearset": {
    "first_gear": 2.48,
    "second_gear": 1.48,
    "third_gear": 1.00,
    "fourth_gear": 0.75,
    "reverse_gear": 2.08
  },

  "internals": {
    "valve_body": {
      "type": "full manual",
      "manufacturer": "TransGo",
      "part_number": "TG-SK-4L80E-HD2"
    },
    "clutch_packs": {
      "3-4_clutch": "Raybestos GPZ friction plates",
      "forward_clutch": "Alto Red Eagle"
    },
    "bands": "Kevlar intermediate band",
    "servo": "Sonnax boost valve",
    "pump": "stock with polished gears",
    "sprag": "Sonnax heavy duty"
  },

  "cooler": {
    "type": "external plate and fin",
    "manufacturer": "B&M",
    "capacity_quarts": 1.5,
    "fan_cooled": true
  },

  "pan": {
    "type": "deep sump",
    "manufacturer": "B&M",
    "additional_capacity_quarts": 2.0,
    "filter": "external spin-on"
  },

  "fluid": {
    "type": "Dexron VI",
    "brand": "Valvoline",
    "capacity_quarts": 16.0
  },

  "shifter": {
    "type": "manual valve body",
    "manufacturer": "Hurst",
    "model": "QuarterStick"
  },

  "output": {
    "shaft_type": "4WD",
    "yoke": "1350 series"
  },

  "builder": {
    "name": "Monster Transmission",
    "date": "2024-02-15",
    "warranty_miles": 50000
  },

  "notes": "Built for 1000HP, tested to 1200HP"
}
```

### 6. frame_json

**Structure:**
```json
{
  "type": "C-channel",
  "material": "mild steel",
  "modifications": [
    {
      "type": "boxing plates",
      "location": "rear frame rails",
      "material": "3/16\" steel plate",
      "performed_by": "Custom Chassis Works",
      "date": "2023-11-10"
    },
    {
      "type": "weld-in crossmember",
      "location": "behind transmission",
      "material": "2x4\" rectangular tube",
      "performed_by": "Custom Chassis Works",
      "date": "2023-11-10"
    }
  ],
  "crossmembers": [
    {
      "location": "transmission",
      "type": "bolt-in",
      "material": "steel"
    },
    {
      "location": "transfer case",
      "type": "weld-in",
      "material": "DOM tube"
    }
  ],
  "body_mounts": {
    "type": "polyurethane",
    "manufacturer": "Energy Suspension",
    "durometer": 80
  },
  "skid_plates": [
    {
      "location": "oil pan",
      "material": "1/4\" aluminum",
      "manufacturer": "Ricochet"
    },
    {
      "location": "transfer case",
      "material": "3/16\" steel",
      "manufacturer": "Ricochet"
    }
  ],
  "lift_brackets": {
    "front": "3\" lift shackles",
    "rear": "2\" blocks removed, springs relocated"
  },
  "notes": "Frame inspected for cracks annually"
}
```

### 7. cab_interior_json

**Structure:**
```json
{
  "seats": {
    "front_left": {
      "manufacturer": "Corbeau",
      "model": "Baja XP",
      "material": "vinyl",
      "harness_compatible": true
    },
    "front_right": {
      "manufacturer": "Corbeau",
      "model": "Baja XP",
      "material": "vinyl"
    },
    "rear": "stock bench"
  },

  "safety_equipment": {
    "harnesses": {
      "type": "5-point",
      "manufacturer": "Crow",
      "expiration_date": "2028-01-01"
    },
    "roll_cage": {
      "type": "4-point sport cage",
      "material": "1.75\" DOM tubing",
      "builder": "Custom Chassis Works",
      "date_installed": "2023-12-01"
    },
    "fire_extinguisher": {
      "type": "Halon",
      "manufacturer": "Safecraft",
      "mount_location": "driver side foot well",
      "expiration_date": "2026-06-01"
    },
    "window_net": {
      "manufacturer": "RCI",
      "color": "black",
      "sfi_rating": "27.1"
    }
  },

  "gauges": [
    {
      "type": "boost",
      "manufacturer": "Auto Meter",
      "series": "Sport-Comp",
      "size_in": 2.625,
      "range": "30 psi",
      "location": "A-pillar pod"
    },
    {
      "type": "oil pressure",
      "manufacturer": "Auto Meter",
      "series": "Sport-Comp",
      "size_in": 2.625,
      "range": "100 psi",
      "location": "A-pillar pod"
    },
    {
      "type": "water temp",
      "manufacturer": "Auto Meter",
      "series": "Sport-Comp",
      "size_in": 2.625,
      "range": "100-250°F",
      "location": "A-pillar pod"
    }
  ],

  "stereo": {
    "head_unit": "Pioneer AVH-3500NEX",
    "speakers_front": "JBL 6.5\" components",
    "speakers_rear": "JBL 6x9\" coaxials",
    "subwoofer": "JL Audio 12\" W3",
    "amplifier": "JL Audio JX500/1D"
  },

  "switches": {
    "location": "overhead console",
    "count": 6,
    "controls": [
      "auxiliary lights",
      "light bar",
      "air compressor",
      "fuel pump",
      "cooling fans",
      "trans brake"
    ]
  },

  "upholstery": {
    "material": "vinyl",
    "color": "black",
    "condition": "excellent"
  },

  "notes": "Custom aluminum dash panel by Racepak"
}
```

### 8. brakes_json

**Structure:**
```json
{
  "type": "4-wheel disc",

  "front": {
    "calipers": {
      "type": "6-piston fixed",
      "manufacturer": "Wilwood",
      "model": "FNSL6R",
      "part_number": "120-13245",
      "piston_sizes_in": [1.75, 1.75, 1.75, 1.75, 1.75, 1.75],
      "pad_material": "BP-10"
    },
    "rotors": {
      "type": "2-piece slotted",
      "manufacturer": "Wilwood",
      "diameter_in": 14.0,
      "thickness_in": 1.25,
      "vane_type": "directional vanes",
      "material": "GT48 iron",
      "hat_material": "aluminum"
    },
    "brake_lines": {
      "type": "braided stainless steel",
      "manufacturer": "Russell",
      "fitting_type": "-3 AN"
    }
  },

  "rear": {
    "calipers": {
      "type": "4-piston fixed",
      "manufacturer": "Wilwood",
      "model": "FNSL4R",
      "pad_material": "BP-10"
    },
    "rotors": {
      "type": "1-piece slotted",
      "manufacturer": "Wilwood",
      "diameter_in": 13.0,
      "thickness_in": 1.00
    },
    "brake_lines": {
      "type": "braided stainless steel",
      "manufacturer": "Russell"
    },
    "parking_brake": {
      "type": "integrated drum-in-hat",
      "actuator": "cable operated"
    }
  },

  "master_cylinder": {
    "type": "tandem",
    "manufacturer": "Wilwood",
    "bore_in": 1.125,
    "reservoir_capacity_oz": 16,
    "pushrod_ratio": 6.0
  },

  "booster": {
    "type": "vacuum",
    "manufacturer": "Wilwood",
    "diameter_in": 8.0,
    "assist_ratio": 3.5
  },

  "proportioning_valve": {
    "type": "adjustable",
    "manufacturer": "Wilwood",
    "rear_bias_pct": 40
  },

  "fluid": {
    "type": "DOT 4",
    "brand": "Motul RBF600",
    "dry_boiling_point_f": 594,
    "wet_boiling_point_f": 420
  },

  "abs": false,

  "pedal_assembly": {
    "type": "hanging pedal",
    "manufacturer": "Wilwood",
    "pedal_ratio": 6.5
  },

  "notes": "Bias valve set at 40% rear for autocross use"
}
```

### 9. additional_components_json

**Flexible structure for miscellaneous components:**
```json
{
  "cooling_system": {
    "radiator": {
      "manufacturer": "Griffin",
      "rows": 3,
      "material": "aluminum",
      "capacity_quarts": 4.5
    },
    "fans": [
      {
        "type": "electric",
        "manufacturer": "Spal",
        "diameter_in": 16,
        "cfm": 2400
      }
    ]
  },

  "fuel_system": {
    "fuel_cell": {
      "manufacturer": "Fuel Safe",
      "capacity_gallons": 22,
      "foam_filled": true,
      "fia_certified": true
    },
    "fuel_pump": {
      "type": "in-tank",
      "manufacturer": "Aeromotive",
      "model": "A1000",
      "flow_gph": 120
    }
  },

  "electrical": {
    "battery": {
      "type": "AGM",
      "manufacturer": "Odyssey",
      "model": "PC680",
      "cca": 170,
      "location": "trunk"
    },
    "alternator": {
      "manufacturer": "Powermaster",
      "amperage": 200,
      "one_wire": true
    }
  },

  "accessories": [
    {
      "category": "lighting",
      "item": "LED light bar",
      "manufacturer": "Rigid Industries",
      "model": "E-Series 20\"",
      "location": "roof mounted"
    }
  ]
}
```

## Notes Array System

### Overview
Every JSONB component supports a `notes_array` field for tracking user notes with full audit trail. Each note includes metadata for timestamp, user attribution, and action tracking.

### Notes Array Structure
```json
{
  "notes_array": [
    {
      "id": "note_1706634000000",
      "timestamp": "2025-01-30T10:30:00Z",
      "user_id": 5,
      "user_name": "John Doe",
      "content": "Adjusted suspension camber after alignment",
      "action_type": "add"
    },
    {
      "id": "note_1706547600000",
      "timestamp": "2025-01-29T14:15:00Z",
      "user_id": 5,
      "user_name": "John Doe",
      "content": "Front coilovers making noise, needs investigation",
      "action_type": "add"
    }
  ]
}
```

### Note Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (timestamp-based) |
| `timestamp` | string | Yes | ISO 8601 format timestamp |
| `user_id` | integer | Yes | ID of user who created/modified note |
| `user_name` | string | Yes | Display name of user |
| `content` | string | Yes | The note text content |
| `action_type` | string | Yes | Action: "add", "edit", "delete" |

### Usage Example

Complete suspension_json with notes_array:
```json
{
  "front_type": "Independent A-arm",
  "rear_type": "4-Link",
  "front_left": {
    "spring_rate": "500 lb/in",
    "shock_model": "Fox 2.5 Coilover"
  },
  "notes": "Corner balanced at 50% cross weight",
  "notes_array": [
    {
      "id": "note_1706634000000",
      "timestamp": "2025-01-30T10:30:00Z",
      "user_id": 5,
      "user_name": "John Doe",
      "content": "Revalved shocks for better compression damping",
      "action_type": "add"
    },
    {
      "id": "note_1706547600000",
      "timestamp": "2025-01-29T14:15:00Z",
      "user_id": 5,
      "user_name": "John Doe",
      "content": "Initial corner balance completed. Cross weight at 50.2%",
      "action_type": "add"
    }
  ]
}
```

### Audit Trail
All note operations (add/edit/delete) are captured in the existing `build_json_snapshots` table:
- Before adding a note: snapshot with `snapshot_type='before_change'`
- After adding a note: snapshot with `snapshot_type='note_add'`
- Use `get_snapshot_diff()` to see what changed

### API Endpoints
- `POST /api/builds/{build_id}/{component}/notes` - Add note
- `PUT /api/builds/{build_id}/{component}/notes/{note_id}` - Edit note
- `DELETE /api/builds/{build_id}/{component}/notes/{note_id}` - Delete note

### Query Examples
```sql
-- Find all builds with notes containing specific keyword
SELECT b.id, b.name
FROM builds b
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(b.suspension_json->'notes_array') AS note
  WHERE note->>'content' ILIKE '%camber%'
);

-- Count notes per build
SELECT
  b.id,
  b.name,
  jsonb_array_length(COALESCE(b.suspension_json->'notes_array', '[]'::jsonb)) as note_count
FROM builds b;

-- Get all notes by user across all components
SELECT
  b.id,
  b.name,
  note->>'timestamp' as timestamp,
  note->>'content' as content
FROM builds b,
  jsonb_array_elements(b.suspension_json->'notes_array') AS note
WHERE note->>'user_id' = '5'
ORDER BY note->>'timestamp' DESC;
```

## Best Practices

### 1. Use Consistent Units
- Inches for dimensional measurements
- Pounds/ounces for weight
- Degrees for angles
- PSI for pressure
- GPH for flow rates

### 2. Include Part Numbers
Always include manufacturer and part numbers for traceability:
```json
{
  "manufacturer": "ARP",
  "part_number": "134-5401"
}
```

### 3. Store Numbers as Numbers
Use numeric types for measurements to enable queries:
```json
{
  "length_in": 5.400,  // Good - stored as number
  "length_in": "5.4"   // Bad - stored as string
}
```

### 4. Use Arrays for Lists
```json
{
  "machine_work": [
    {"operation": "...", "date": "..."},
    {"operation": "...", "date": "..."}
  ]
}
```

### 5. Add Notes Fields
Include a notes field at each level for additional context:
```json
{
  "connecting_rods": {
    "type": "I-beam",
    "notes": "Balanced to +/- 1 gram"
  }
}
```

## Database Queries

### Query Examples

```sql
-- Find builds with specific rod bolts
SELECT b.id, b.name
FROM builds b
WHERE b.engine_internals_json->'connecting_rods'->'bolts'->>'type' = 'ARP 8740';

-- Find builds with Wilwood brakes
SELECT b.id, b.name
FROM builds b
WHERE b.brakes_json->'front'->'calipers'->>'manufacturer' = 'Wilwood';

-- Find builds with 4L80E transmissions
SELECT b.id, b.name
FROM builds b
WHERE b.transmission_json->>'type' = '4L80E';

-- Find builds with aluminum cylinder heads
SELECT b.id, b.name
FROM builds b
WHERE b.engine_internals_json->'cylinder_head'->>'material' = 'aluminum';

-- Complex query: Find all HP builds with forged pistons
SELECT b.id, b.name, b.target_hp
FROM builds b
WHERE b.target_hp > 500
  AND b.engine_internals_json->'pistons'->>'material' LIKE '%forged%';
```

### Aggregate Queries

```sql
-- Count builds by piston design
SELECT
  engine_internals_json->'pistons'->>'design' as piston_design,
  COUNT(*) as count
FROM builds
WHERE engine_internals_json->'pistons' IS NOT NULL
GROUP BY engine_internals_json->'pistons'->>'design';

-- Average rod length by build type
SELECT
  use_type,
  AVG((engine_internals_json->'connecting_rods'->>'length_in')::numeric) as avg_rod_length
FROM builds
WHERE engine_internals_json->'connecting_rods'->'length_in' IS NOT NULL
GROUP BY use_type;
```

## Schema Validation

Consider implementing validation in your API layer:

```python
def validate_engine_internals(data: dict) -> bool:
    """Validate engine_internals_json structure"""
    required_keys = ['crankshaft', 'connecting_rods', 'pistons']

    # Check if all required top-level keys exist
    for key in required_keys:
        if key not in data:
            raise ValueError(f"Missing required key: {key}")

    # Validate rod length is numeric
    if 'length_in' in data.get('connecting_rods', {}):
        if not isinstance(data['connecting_rods']['length_in'], (int, float)):
            raise ValueError("Rod length must be numeric")

    return True
```

## TypeScript Interfaces

For frontend type safety, define TypeScript interfaces:

```typescript
interface ConnectingRods {
  type: string;
  manufacturer?: string;
  length_in?: number;
  bolts?: {
    type: string;
    size: string;
    manufacturer?: string;
    torque_ft_lbs?: number;
  };
}

interface EngineInternals {
  crankshaft?: object;
  connecting_rods?: ConnectingRods;
  pistons?: object;
  camshaft?: object;
  notes?: string;
}
```
