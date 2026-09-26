from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from backend.database import engine, Base
from backend.routes import health, complaints, tasks
from backend.routes import staff, stats, rooms, intelligence, pricing, recommendations, audit, reports, ml

# Create all tables on startup (including new rooms table)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Resort 360 API")

# Allow Vite dev server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Day 2 routes (unchanged) ─────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(complaints.router)
app.include_router(tasks.router)

# ── Day 3 routes (new) ───────────────────────────────────────────────────────
app.include_router(staff.router)
app.include_router(stats.router)
app.include_router(rooms.router)
app.include_router(intelligence.router)
app.include_router(pricing.router)
app.include_router(recommendations.router)
app.include_router(audit.router)
app.include_router(reports.router)
app.include_router(ml.router)

# ── Static file serving for completion proof images ──────────────────────────
os.makedirs("uploads/proofs", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ── Seed demo room data at startup if none exists ────────────────────────────
def seed_rooms():
    """
    Seed demonstration room data.
    NOTE: This is DEMO DATA — not a live PMS/booking system.
    Room statuses are static seeds for the Resort 360 manager view.
    """
    from backend.database import SessionLocal
    from backend.models.room import Room
    db = SessionLocal()
    try:
        if db.query(Room).first():
            return  # Already seeded
        demo_rooms = [
            Room(room_number=101, room_type="Deluxe",   floor=1, status="occupied", base_rate=3500),
            Room(room_number=102, room_type="Deluxe",   floor=1, status="available", base_rate=3500),
            Room(room_number=103, room_type="Deluxe",   floor=1, status="cleaning", base_rate=3500),
            Room(room_number=104, room_type="Standard", floor=1, status="occupied", base_rate=2500),
            Room(room_number=105, room_type="Standard", floor=1, status="available", base_rate=2500),
            Room(room_number=201, room_type="Suite",    floor=2, status="occupied", base_rate=8500),
            Room(room_number=202, room_type="Suite",    floor=2, status="occupied", base_rate=8500),
            Room(room_number=203, room_type="Deluxe",   floor=2, status="maintenance", base_rate=3500),
            Room(room_number=204, room_type="Deluxe",   floor=2, status="occupied", base_rate=3500),
            Room(room_number=205, room_type="Deluxe",   floor=2, status="available", base_rate=3500),
            Room(room_number=301, room_type="Family",   floor=3, status="available", base_rate=5500),
            Room(room_number=302, room_type="Family",   floor=3, status="cleaning", base_rate=5500),
            Room(room_number=303, room_type="Deluxe",   floor=3, status="available", base_rate=3500),
            Room(room_number=304, room_type="Standard", floor=3, status="occupied", base_rate=2500),
            Room(room_number=305, room_type="Standard", floor=3, status="maintenance", base_rate=2500),
            Room(room_number=401, room_type="Suite",    floor=4, status="occupied", base_rate=8500),
            Room(room_number=402, room_type="Suite",    floor=4, status="available", base_rate=8500),
            Room(room_number=403, room_type="Deluxe",   floor=4, status="occupied", base_rate=3500),
            Room(room_number=404, room_type="Deluxe",   floor=4, status="cleaning", base_rate=3500),
            Room(room_number=405, room_type="Standard", floor=4, status="available", base_rate=2500),
        ]
        db.add_all(demo_rooms)
        db.commit()
        print(f"[startup] Seeded {len(demo_rooms)} demo rooms.")
    finally:
        db.close()


seed_rooms()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
