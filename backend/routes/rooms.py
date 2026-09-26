"""
Rooms route — Smart Resort 360
================================
GET /api/rooms returns seeded demo room data.

NOTE: Room occupancy data is SEEDED FOR DEMONSTRATION PURPOSES only.
      This project does not have a live booking/PMS system.
      Room statuses are seeded at startup and do not change dynamically.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.models.room import Room
from backend.schemas.room import RoomResponse

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.get("", response_model=List[RoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    """Return all rooms (seeded demo data — not a live PMS)."""
    return db.query(Room).order_by(Room.room_number).all()
