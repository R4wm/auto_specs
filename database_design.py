import sqlite3, pandas as pd

conn = sqlite3.connect("engine_build_normalized.db")

# Example: create the tables
conn.executescript("""
CREATE TABLE vendors (id INTEGER PRIMARY KEY, name TEXT UNIQUE);
CREATE TABLE parts (id INTEGER PRIMARY KEY, brand TEXT, part_number TEXT UNIQUE, name TEXT, category TEXT, specs_json TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, order_number TEXT, order_date TEXT, vendor_id INTEGER, ship_to TEXT, notes TEXT);
CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER, part_id INTEGER, qty INTEGER, price_each REAL, ext_price REAL);
CREATE TABLE builds (id INTEGER PRIMARY KEY, name TEXT, displacement_ci REAL, bore_in REAL, stroke_in REAL, rod_len_in REAL,
                     piston_cc REAL, chamber_cc REAL, gasket_bore_in REAL, gasket_thickness_in REAL, deck_clear_in REAL,
                     balance_oz REAL, flywheel_teeth INTEGER, firing_order TEXT, static_cr REAL, dynamic_cr REAL, notes TEXT);
CREATE TABLE build_parts (id INTEGER PRIMARY KEY, build_id INTEGER, part_id INTEGER, role TEXT, notes TEXT);
""")
conn.commit()
conn.close()
