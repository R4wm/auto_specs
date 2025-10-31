# JSONB Quick Start Guide

## Overview

Your database schema uses JSONB columns to store flexible, detailed component specifications. This guide shows you how to work with these columns.

## ✅ Schema Verification

**Your schema CAN accommodate all requested specifications:**

| Specification | Storage Location | Status |
|---------------|------------------|--------|
| 3/8" Cap Screws | `engine_internals_json.fasteners.main_cap_screws.size` | ✅ Ready |
| 5.4" Rod Length | `engine_internals_json.connecting_rods.length_in` | ✅ Ready |
| ARP 8740 Rod Bolts | `engine_internals_json.connecting_rods.bolts.type` | ✅ Ready |
| Forged .030 Pistons | `engine_internals_json.pistons.material` + `.oversize_in` | ✅ Ready |
| Flat-Top Piston Design | `engine_internals_json.pistons.design` | ✅ Ready |
| Pro-Stock I-Beam Rods | `engine_internals_json.connecting_rods.type` | ✅ Ready |
| 3.400" Stroke Series 9000 Cast Crank | `engine_internals_json.crankshaft.stroke_in` + `.model` | ✅ Ready |

## Quick Example

### Storing Engine Specs

```python
# Python API example
engine_internals = {
    "crankshaft": {
        "model": "Series 9000 Cast",
        "stroke_in": 3.400,
        "material": "cast"
    },
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
    }
}

# Update via API
import requests
response = requests.put(
    f'/api/builds/{build_id}/engine-internals',
    json=engine_internals,
    headers={'Authorization': f'Bearer {token}'}
)
```

### Querying Engine Specs

```sql
-- Find all builds with ARP 8740 rod bolts
SELECT id, name
FROM builds
WHERE engine_internals_json->'connecting_rods'->'bolts'->>'type' = 'ARP 8740';

-- Find all builds with 5.4" rod length
SELECT id, name
FROM builds
WHERE (engine_internals_json->'connecting_rods'->>'length_in')::numeric = 5.400;

-- Find all builds with forged pistons
SELECT id, name
FROM builds
WHERE engine_internals_json->'pistons'->>'material' LIKE '%forged%';

-- Complex query: Forged pistons AND ARP bolts
SELECT id, name
FROM builds
WHERE engine_internals_json->'pistons'->>'material' LIKE '%forged%'
  AND engine_internals_json->'connecting_rods'->'bolts'->>'type' LIKE '%ARP%';
```

## Available JSONB Columns

| Column | Purpose |
|--------|---------|
| `engine_internals_json` | Pistons, rods, crank, cam, valvetrain, bearings |
| `suspension_json` | Springs, shocks, sway bars for each corner |
| `tires_wheels_json` | Tire/wheel specs for each corner |
| `rear_differential_json` | Diff internals, gears, axles |
| `transmission_json` | Trans internals, clutch, torque converter |
| `frame_json` | Chassis modifications and reinforcements |
| `cab_interior_json` | Seats, roll cage, gauges, safety equipment |
| `brakes_json` | Calipers, rotors, master cylinder, lines |
| `additional_components_json` | Miscellaneous components |

## API Endpoints

### Update JSONB Data

```bash
# Update engine internals
PUT /api/builds/{build_id}/engine-internals
Content-Type: application/json
{
  "crankshaft": {...},
  "connecting_rods": {...}
}

# Update suspension
PUT /api/builds/{build_id}/suspension
{
  "front_left": {...},
  "front_right": {...}
}

# Update rear differential
PUT /api/builds/{build_id}/rear-differential
{
  "gear_ratio": "4.10",
  "type": "Dana 60"
}

# Update transmission
PUT /api/builds/{build_id}/transmission
{
  "type": "4L80E",
  "torque_converter": {...}
}
```

### Automatic Snapshots

Every update automatically creates before/after snapshots for version history:

```bash
# Get snapshot history for a build
GET /api/builds/{build_id}/snapshots

# Restore to a previous snapshot
POST /api/builds/{build_id}/restore/{snapshot_id}

# Compare two snapshots
GET /api/snapshots/{snapshot_id}/diff/{compare_to_id}
```

## Best Practices

### 1. Store Numbers as Numbers (Not Strings)

```json
✅ Good:
{
  "length_in": 5.400,
  "torque_ft_lbs": 45
}

❌ Bad:
{
  "length_in": "5.4",
  "torque_ft_lbs": "45"
}
```

### 2. Use Consistent Units

- **Length**: inches (in)
- **Weight**: pounds (lbs) or grams (g)
- **Torque**: foot-pounds (ft_lbs)
- **Pressure**: PSI (psi)
- **Temperature**: Fahrenheit (f)
- **Volume**: cubic centimeters (cc), quarts (quarts)

### 3. Include Manufacturer & Part Numbers

```json
{
  "manufacturer": "ARP",
  "part_number": "134-5401",
  "type": "ARP 8740"
}
```

### 4. Add Notes for Context

```json
{
  "connecting_rods": {
    "type": "Pro-Stock I-Beam",
    "length_in": 5.400,
    "notes": "Balanced to +/- 1 gram, resize big end to 2.100\""
  }
}
```

### 5. Use Nested Objects for Related Data

```json
{
  "connecting_rods": {
    "type": "I-beam",
    "bolts": {
      "type": "ARP 8740",
      "size": "3/8\""
    }
  }
}
```

## TypeScript Interface (Frontend)

```typescript
interface EngineInternals {
  crankshaft?: {
    model?: string;
    stroke_in?: number;
    material?: string;
  };
  connecting_rods?: {
    type?: string;
    length_in?: number;
    bolts?: {
      type?: string;
      size?: string;
      torque_ft_lbs?: number;
    };
  };
  pistons?: {
    design?: string;
    oversize_in?: number;
    material?: string;
  };
  notes?: string;
}
```

## Python Models (Backend)

```python
from typing import Optional, Dict, Any
from pydantic import BaseModel

class Bolts(BaseModel):
    type: Optional[str] = None
    size: Optional[str] = None
    manufacturer: Optional[str] = None
    torque_ft_lbs: Optional[float] = None

class ConnectingRods(BaseModel):
    type: Optional[str] = None
    length_in: Optional[float] = None
    bolts: Optional[Bolts] = None
    notes: Optional[str] = None

class EngineInternals(BaseModel):
    crankshaft: Optional[Dict[str, Any]] = None
    connecting_rods: Optional[ConnectingRods] = None
    pistons: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
```

## Database Indexing

For faster queries, create indexes on frequently searched fields:

```sql
-- General JSONB index (supports all queries)
CREATE INDEX idx_engine_internals_gin
ON builds USING GIN (engine_internals_json);

-- Specific field indexes (faster for common queries)
CREATE INDEX idx_rod_bolt_type
ON builds ((engine_internals_json->'connecting_rods'->'bolts'->>'type'));

CREATE INDEX idx_piston_design
ON builds ((engine_internals_json->'pistons'->>'design'));

CREATE INDEX idx_rod_length
ON builds (((engine_internals_json->'connecting_rods'->>'length_in')::numeric));
```

## Migration from Structured Columns

If you have data in the old structured columns, migrate it:

```sql
-- Migrate rod length from structured column to JSON
UPDATE builds
SET engine_internals_json = jsonb_set(
  COALESCE(engine_internals_json, '{}'::jsonb),
  '{connecting_rods,length_in}',
  to_jsonb(rod_len_in)
)
WHERE rod_len_in IS NOT NULL
  AND engine_internals_json->'connecting_rods'->'length_in' IS NULL;

-- Migrate stroke from structured column to JSON
UPDATE builds
SET engine_internals_json = jsonb_set(
  COALESCE(engine_internals_json, '{}'::jsonb),
  '{crankshaft,stroke_in}',
  to_jsonb(stroke_in)
)
WHERE stroke_in IS NOT NULL
  AND engine_internals_json->'crankshaft'->'stroke_in' IS NULL;
```

## Common Queries

```sql
-- Find builds by rod bolt type
SELECT * FROM builds
WHERE engine_internals_json->'connecting_rods'->'bolts'->>'type' = 'ARP 8740';

-- Find builds by piston material
SELECT * FROM builds
WHERE engine_internals_json->'pistons'->>'material' LIKE '%forged%';

-- Find builds with specific rod length
SELECT * FROM builds
WHERE (engine_internals_json->'connecting_rods'->>'length_in')::numeric = 5.400;

-- Count builds by piston design
SELECT
  engine_internals_json->'pistons'->>'design' as design,
  COUNT(*) as count
FROM builds
WHERE engine_internals_json->'pistons'->'design' IS NOT NULL
GROUP BY design;

-- Average rod length across all builds
SELECT AVG((engine_internals_json->'connecting_rods'->>'length_in')::numeric)
FROM builds
WHERE engine_internals_json->'connecting_rods'->'length_in' IS NOT NULL;

-- Find builds missing certain specs
SELECT id, name FROM builds
WHERE engine_internals_json IS NULL
   OR engine_internals_json->'connecting_rods' IS NULL;
```

## Validation Example

```python
def validate_engine_internals(data: dict) -> tuple[bool, str]:
    """Validate engine_internals_json before saving"""

    # Check rod length is numeric if provided
    if 'connecting_rods' in data:
        rods = data['connecting_rods']
        if 'length_in' in rods and not isinstance(rods['length_in'], (int, float)):
            return False, "Rod length must be numeric"

    # Check stroke is numeric if provided
    if 'crankshaft' in data:
        crank = data['crankshaft']
        if 'stroke_in' in crank and not isinstance(crank['stroke_in'], (int, float)):
            return False, "Stroke must be numeric"

    # Check piston oversize is numeric if provided
    if 'pistons' in data:
        pistons = data['pistons']
        if 'oversize_in' in pistons and not isinstance(pistons['oversize_in'], (int, float)):
            return False, "Piston oversize must be numeric"

    return True, "Valid"
```

## Resources

- **Full Schema Documentation**: [ENGINE_INTERNALS_SCHEMA.md](./ENGINE_INTERNALS_SCHEMA.md)
- **All JSONB Schemas**: [JSONB_SCHEMAS.md](./JSONB_SCHEMAS.md)
- **Example Data**: [EXAMPLE_ENGINE_SPECS.json](./EXAMPLE_ENGINE_SPECS.json)
- **PostgreSQL JSONB Docs**: https://www.postgresql.org/docs/current/datatype-json.html

## Summary

✅ **Your database schema is ready** to handle all the engine specifications you mentioned:
- 3/8" Cap Screws
- 5.4" Rod Length
- ARP 8740 Rod Bolts
- Forged .030 Pistons
- Flat-Top Piston Design
- Pro-Stock I-Beam Rods
- 3.400" Stroke Series 9000 Cast Crankshaft

The JSONB columns provide:
- ✅ Flexible storage for any level of detail
- ✅ Efficient querying with GIN indexes
- ✅ Automatic version history via snapshots
- ✅ No schema migrations needed for new fields
- ✅ Type-safe numeric comparisons
- ✅ Easy to extend and maintain
