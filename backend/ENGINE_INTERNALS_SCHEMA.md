# Engine Internals JSON Schema

This document defines the standardized JSON schema for the `engine_internals_json` JSONB column in the `builds` table.

## Schema Structure

```json
{
  "crankshaft": {
    "model": "Series 9000 Cast",
    "stroke_in": 3.400,
    "material": "cast",
    "manufacturer": "Eagle",
    "part_number": "EAGXXX123",
    "journals": {
      "main_diameter_in": 2.300,
      "rod_diameter_in": 2.100
    },
    "weight_lbs": 52.5,
    "notes": "Internally balanced"
  },

  "connecting_rods": {
    "type": "Pro-Stock I-Beam",
    "material": "forged steel",
    "manufacturer": "Scat",
    "part_number": "SCAT123",
    "length_in": 5.400,
    "beam_style": "I-beam",
    "weight_grams": 650,
    "big_end_width_in": 0.927,
    "small_end_width_in": 0.927,
    "bolts": {
      "type": "ARP 8740",
      "manufacturer": "ARP",
      "part_number": "ARP-123",
      "size": "3/8\"",
      "torque_ft_lbs": 45,
      "material": "chromoly"
    },
    "notes": "Balanced set"
  },

  "pistons": {
    "manufacturer": "Wiseco",
    "part_number": "K0085X30",
    "design": "flat-top",
    "material": "forged aluminum",
    "oversize_in": 0.030,
    "compression_height_in": 1.560,
    "dome_dish_cc": 10.5,
    "coating": "skirt coating",
    "pin": {
      "type": "floating",
      "diameter_in": 0.927,
      "length_in": 2.500
    },
    "ring_grooves": {
      "top_width_in": 0.043,
      "second_width_in": 0.043,
      "oil_width_in": 0.188
    },
    "notes": "Coated skirts for reduced friction"
  },

  "piston_rings": {
    "manufacturer": "Total Seal",
    "top_ring": {
      "type": "gapless",
      "material": "chrome moly",
      "thickness_in": 0.043,
      "gap_in": 0.018,
      "part_number": "TS123"
    },
    "second_ring": {
      "type": "napier",
      "material": "ductile iron",
      "thickness_in": 0.043,
      "gap_in": 0.020,
      "part_number": "TS124"
    },
    "oil_ring": {
      "type": "3-piece",
      "material": "chrome",
      "thickness_in": 0.188,
      "gap_in": 0.015,
      "part_number": "TS125"
    },
    "notes": "Pre-gapped for bore size"
  },

  "camshaft": {
    "manufacturer": "Comp Cams",
    "model": "XE274H",
    "part_number": "12-600-4",
    "type": "hydraulic roller",
    "material": "billet steel",
    "duration_int_deg": 274,
    "duration_exh_deg": 280,
    "lift_int_in": 0.480,
    "lift_exh_in": 0.488,
    "lsa_deg": 110,
    "advance_deg": 4,
    "base_circle_in": 1.467,
    "bearings": {
      "type": "roller",
      "material": "steel",
      "clearance_in": 0.002
    },
    "notes": "Degreed in at 106 ICL"
  },

  "valvetrain": {
    "lifters": {
      "type": "hydraulic roller",
      "manufacturer": "Comp Cams",
      "part_number": "CC-123",
      "material": "steel",
      "diameter_in": 0.875
    },
    "pushrods": {
      "material": "chromoly",
      "manufacturer": "Comp Cams",
      "length_in": 7.850,
      "diameter_in": 0.375,
      "wall_thickness_in": 0.080,
      "end_type": "ball/ball"
    },
    "rocker_arms": {
      "type": "roller tip",
      "manufacturer": "Comp Cams",
      "ratio": 1.5,
      "material": "aluminum",
      "stud_size": "7/16\""
    },
    "valve_springs": {
      "type": "dual spring",
      "manufacturer": "Comp Cams",
      "installed_height_in": 1.700,
      "seat_pressure_lbs": 130,
      "open_pressure_lbs": 330,
      "coil_bind_in": 1.100
    },
    "retainers": {
      "material": "steel",
      "weight_grams": 12,
      "lock_type": "7° taper"
    },
    "notes": "Check installed height with mic"
  },

  "cylinder_head": {
    "manufacturer": "Edelbrock",
    "model": "Performer RPM",
    "part_number": "60779",
    "material": "aluminum",
    "combustion_chamber_cc": 64,
    "intake_valve_diameter_in": 2.020,
    "exhaust_valve_diameter_in": 1.600,
    "intake_port": {
      "type": "rectangular",
      "height_in": 2.080,
      "width_in": 1.280,
      "volume_cc": 170
    },
    "exhaust_port": {
      "volume_cc": 70
    },
    "valve_guides": {
      "material": "bronze",
      "intake_clearance_in": 0.001,
      "exhaust_clearance_in": 0.002
    },
    "valve_seats": {
      "material": "hardened steel",
      "intake_angle_deg": 45,
      "exhaust_angle_deg": 45
    },
    "work_performed": [
      "3-angle valve job",
      "Bowl blend",
      "Port match intake"
    ],
    "notes": "As-cast port finish"
  },

  "timing_components": {
    "timing_chain_type": "double roller",
    "manufacturer": "Cloyes",
    "part_number": "9-3100",
    "gear_material": "steel",
    "true_roller": true,
    "notes": "0.005\" backlash"
  },

  "oil_pump": {
    "type": "high volume",
    "manufacturer": "Melling",
    "model": "M-55HV",
    "part_number": "M-55HV",
    "pressure_relief_psi": 75,
    "gears": "standard clearance"
  },

  "balancer": {
    "type": "external balance",
    "manufacturer": "Professional Products",
    "diameter_in": 8.0,
    "material": "steel",
    "weight_oz": 50.0
  },

  "fasteners": {
    "main_cap_bolts": {
      "manufacturer": "ARP",
      "part_number": "134-5401",
      "size": "3/8\"",
      "material": "8740 chromoly",
      "torque_ft_lbs": 70,
      "lube": "ARP moly lube"
    },
    "head_bolts": {
      "manufacturer": "ARP",
      "part_number": "134-3601",
      "size": "7/16\"",
      "material": "8740 chromoly",
      "torque_ft_lbs": 75,
      "lube": "ARP moly lube"
    },
    "intake_bolts": {
      "size": "3/8\"",
      "material": "stainless steel",
      "torque_ft_lbs": 30
    },
    "notes": "All fasteners torqued in 3 stages"
  },

  "bearings": {
    "main_bearings": {
      "manufacturer": "King",
      "part_number": "MB123",
      "material": "tri-metal",
      "clearance_in": 0.002,
      "undersize_in": 0.000
    },
    "rod_bearings": {
      "manufacturer": "King",
      "part_number": "CB123",
      "material": "tri-metal",
      "clearance_in": 0.0025,
      "undersize_in": 0.000
    },
    "cam_bearings": {
      "manufacturer": "Clevite",
      "material": "aluminum",
      "clearance_in": 0.002
    }
  },

  "gaskets": {
    "head_gasket": {
      "manufacturer": "Fel-Pro",
      "part_number": "1003",
      "material": "multi-layer steel",
      "thickness_in": 0.041,
      "bore_in": 4.165,
      "compressed_thickness_in": 0.039
    },
    "intake_gasket": {
      "manufacturer": "Fel-Pro",
      "type": "composite",
      "notes": "Port matched"
    },
    "notes": "Use OEM torque sequence"
  },

  "assembly_specs": {
    "deck_clearance_in": 0.015,
    "piston_to_valve_clearance": {
      "intake_in": 0.100,
      "exhaust_in": 0.120
    },
    "bearing_clearances": {
      "main_bearing_in": 0.002,
      "rod_bearing_in": 0.0025,
      "cam_bearing_in": 0.002
    },
    "endplay": {
      "crankshaft_in": 0.004,
      "camshaft_in": 0.005
    },
    "ring_gaps": {
      "top_ring_in": 0.018,
      "second_ring_in": 0.020,
      "oil_ring_in": 0.015
    },
    "torque_specs": {
      "main_caps_ft_lbs": 70,
      "rod_bolts_ft_lbs": 45,
      "head_bolts_ft_lbs": 75
    }
  },

  "measurements": {
    "bore_in": 4.030,
    "deck_height_in": 9.025,
    "cylinder_taper_in": 0.001,
    "cylinder_out_of_round_in": 0.0005,
    "crankshaft_runout_in": 0.001,
    "cam_lobe_lift": {
      "intake_in": 0.320,
      "exhaust_in": 0.325
    }
  },

  "machine_work": [
    {
      "operation": "Align hone block",
      "specification": "2.300\" main bore",
      "performed_by": "Joe's Machine Shop",
      "date": "2024-01-15",
      "cost": 250.00
    },
    {
      "operation": "Deck block",
      "specification": "9.025\" deck height, 0.010\" removed",
      "performed_by": "Joe's Machine Shop",
      "date": "2024-01-15",
      "cost": 150.00
    },
    {
      "operation": "Resize rods",
      "specification": "2.100\" big end",
      "performed_by": "Joe's Machine Shop",
      "date": "2024-01-16",
      "cost": 200.00
    }
  ],

  "notes": "Built for street/strip use. Target 450HP @ 6000 RPM"
}
```

## Field Descriptions

### Top-Level Sections

- **crankshaft**: Crankshaft specifications and details
- **connecting_rods**: Connecting rod specifications including bolt details
- **pistons**: Piston specifications including ring groove dimensions
- **piston_rings**: Ring specifications with gap measurements
- **camshaft**: Camshaft specs with lift/duration details
- **valvetrain**: Complete valvetrain component specifications
- **cylinder_head**: Head specifications and porting work
- **timing_components**: Timing chain/belt specifications
- **oil_pump**: Oil pump type and specifications
- **balancer**: Harmonic balancer details
- **fasteners**: All engine fastener specifications and torque values
- **bearings**: Main, rod, and cam bearing specifications
- **gaskets**: Gasket specifications and materials
- **assembly_specs**: Critical clearances and measurements
- **measurements**: As-built measurements and tolerances
- **machine_work**: Array of machine shop operations performed
- **notes**: General build notes

## Usage Examples

### Example 1: Basic Small Block Chevy Build

```json
{
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
    "material": "forged aluminum",
    "oversize_in": 0.030
  }
}
```

### Example 2: Race Engine with Detailed Specs

```json
{
  "connecting_rods": {
    "type": "Pro-Stock I-Beam",
    "manufacturer": "Scat",
    "length_in": 5.400,
    "material": "4340 forged steel",
    "bolts": {
      "type": "ARP 8740",
      "manufacturer": "ARP",
      "size": "3/8\"",
      "torque_ft_lbs": 45
    }
  },
  "fasteners": {
    "main_cap_bolts": {
      "size": "3/8\"",
      "manufacturer": "ARP",
      "material": "8740 chromoly",
      "torque_ft_lbs": 70
    }
  }
}
```

## Queryable Fields

With JSONB, you can query specific nested fields efficiently:

```sql
-- Find all builds with ARP 8740 rod bolts
SELECT * FROM builds
WHERE engine_internals_json->'connecting_rods'->'bolts'->>'type' = 'ARP 8740';

-- Find all builds with forged pistons
SELECT * FROM builds
WHERE engine_internals_json->'pistons'->>'material' LIKE '%forged%';

-- Find all builds with 5.4" rod length
SELECT * FROM builds
WHERE (engine_internals_json->'connecting_rods'->>'length_in')::numeric = 5.400;

-- Find all builds with flat-top pistons
SELECT * FROM builds
WHERE engine_internals_json->'pistons'->>'design' = 'flat-top';
```

## Indexing Recommendations

For frequently queried fields, create GIN indexes:

```sql
-- Create GIN index on engine_internals_json for fast queries
CREATE INDEX idx_engine_internals_gin ON builds USING GIN (engine_internals_json);

-- Create specific path indexes for common queries
CREATE INDEX idx_rod_bolts ON builds ((engine_internals_json->'connecting_rods'->'bolts'->>'type'));
CREATE INDEX idx_piston_design ON builds ((engine_internals_json->'pistons'->>'design'));
```

## Validation

Consider adding a JSON Schema validator in your application code to ensure data consistency. Example Python validation:

```python
from jsonschema import validate, ValidationError

engine_internals_schema = {
    "type": "object",
    "properties": {
        "crankshaft": {"type": "object"},
        "connecting_rods": {
            "type": "object",
            "properties": {
                "length_in": {"type": "number"},
                "bolts": {"type": "object"}
            }
        },
        "pistons": {"type": "object"}
    }
}

def validate_engine_internals(data):
    try:
        validate(instance=data, schema=engine_internals_schema)
        return True
    except ValidationError as e:
        print(f"Validation error: {e.message}")
        return False
```

## Benefits of This Schema

1. **Flexible**: Can store any level of detail from basic to comprehensive
2. **Queryable**: JSONB supports efficient queries on nested fields
3. **Versioned**: Automatic snapshot history tracks changes over time
4. **Extensible**: Easy to add new fields without schema migrations
5. **Typed**: Numeric fields stored as numbers for accurate comparisons
6. **Standardized**: Consistent field names across all builds enable reporting

## Migration Path

For existing builds with data in structured columns, you can migrate to JSON:

```sql
UPDATE builds SET engine_internals_json = jsonb_build_object(
  'connecting_rods', jsonb_build_object(
    'length_in', rod_len_in
  ),
  'crankshaft', jsonb_build_object(
    'stroke_in', stroke_in
  ),
  'assembly_specs', jsonb_build_object(
    'deck_clearance_in', deck_clear_in
  )
)
WHERE engine_internals_json IS NULL;
```
