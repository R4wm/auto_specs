from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import sqlite3
from datetime import datetime
from typing import Optional, List

app = FastAPI(title="Auto Specs Manager")

templates = Jinja2Templates(directory="templates")

DATABASE = 'engine_build_normalized.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    conn = get_db()
    builds = conn.execute('SELECT * FROM builds ORDER BY name').fetchall()
    conn.close()
    return templates.TemplateResponse("index.html", {"request": request, "builds": builds})

@app.get("/build/{build_id}", response_class=HTMLResponse)
async def view_build(request: Request, build_id: int):
    conn = get_db()
    build = conn.execute('SELECT * FROM builds WHERE id = ?', (build_id,)).fetchone()

    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    # Get parts for this build
    parts = conn.execute('''
        SELECT p.*, bp.role, bp.notes as bp_notes
        FROM build_parts bp
        JOIN parts p ON bp.part_id = p.id
        WHERE bp.build_id = ?
        ORDER BY p.category, p.name
    ''', (build_id,)).fetchall()

    # Get maintenance history
    events = conn.execute('''
        SELECT * FROM maintenance_events
        WHERE build_id = ?
        ORDER BY event_date DESC, id DESC
    ''', (build_id,)).fetchall()

    conn.close()
    return templates.TemplateResponse("build_detail.html", {
        "request": request,
        "build": build,
        "parts": parts,
        "events": events
    })

@app.get("/build/{build_id}/maintenance/add", response_class=HTMLResponse)
async def add_maintenance_form(request: Request, build_id: int):
    conn = get_db()
    build = conn.execute('SELECT * FROM builds WHERE id = ?', (build_id,)).fetchone()
    conn.close()

    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    return templates.TemplateResponse("add_maintenance.html", {
        "request": request,
        "build": build
    })

@app.post("/build/{build_id}/maintenance/add")
async def add_maintenance_submit(
    build_id: int,
    event_date: str = Form(...),
    event_type: str = Form(...),
    engine_hours: Optional[float] = Form(None),
    odometer: Optional[int] = Form(None),
    description: str = Form(...),
    notes: Optional[str] = Form(None),
    part_description: List[str] = Form([]),
    part_number: List[str] = Form([]),
    qty: List[int] = Form([]),
    part_notes: List[str] = Form([])
):
    conn = get_db()

    # Insert maintenance event
    cursor = conn.execute('''
        INSERT INTO maintenance_events
        (build_id, event_date, event_type, engine_hours, odometer, description, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        build_id,
        event_date,
        event_type,
        engine_hours,
        odometer,
        description,
        notes
    ))

    event_id = cursor.lastrowid

    # Insert parts used
    for i in range(len(part_description)):
        if part_description[i]:  # Only add if description exists
            conn.execute('''
                INSERT INTO maintenance_parts
                (event_id, part_description, part_number, qty, notes)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                event_id,
                part_description[i],
                part_number[i] if i < len(part_number) else None,
                qty[i] if i < len(qty) else 1,
                part_notes[i] if i < len(part_notes) else None
            ))

    conn.commit()
    conn.close()

    return RedirectResponse(url=f"/build/{build_id}", status_code=303)

@app.get("/maintenance/{event_id}", response_class=HTMLResponse)
async def view_maintenance(request: Request, event_id: int):
    conn = get_db()

    event = conn.execute('''
        SELECT me.*, b.name as build_name
        FROM maintenance_events me
        JOIN builds b ON me.build_id = b.id
        WHERE me.id = ?
    ''', (event_id,)).fetchone()

    if not event:
        raise HTTPException(status_code=404, detail="Maintenance event not found")

    parts = conn.execute('''
        SELECT * FROM maintenance_parts
        WHERE event_id = ?
        ORDER BY id
    ''', (event_id,)).fetchall()

    conn.close()
    return templates.TemplateResponse("maintenance_detail.html", {
        "request": request,
        "event": event,
        "parts": parts
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
