from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from pydantic import BaseModel

from backend.database import get_db
from backend.models.room import Room
from backend.models.booking import Booking
from backend.schemas.booking import BookingCreate, BookingResponse, RoomCategoryResponse, BookingWithRoomResponse
from backend.schemas.room import RoomResponse
from backend.services.booking_service import get_available_rooms, create_booking, cancel_booking

router = APIRouter(prefix="/api", tags=["Bookings"])

# Static category info for demo purposes
CATEGORIES = [
    {"category": "Normal", "typical_price": 2500, "max_adults": 2, "max_children": 1, "has_extra_bed": False},
    {"category": "Deluxe", "typical_price": 3500, "max_adults": 2, "max_children": 2, "has_extra_bed": True},
    {"category": "Duplex", "typical_price": 5000, "max_adults": 4, "max_children": 2, "has_extra_bed": True},
    {"category": "Luxury", "typical_price": 6000, "max_adults": 2, "max_children": 1, "has_extra_bed": False},
    {"category": "Suite", "typical_price": 8500, "max_adults": 2, "max_children": 2, "has_extra_bed": True},
    {"category": "Family", "typical_price": 5500, "max_adults": 4, "max_children": 2, "has_extra_bed": True}
]

@router.get("/rooms/categories", response_model=List[RoomCategoryResponse])
def get_categories():
    return CATEGORIES

@router.get("/rooms/available", response_model=List[RoomResponse])
def get_available(
    check_in: date,
    check_out: date,
    category: Optional[str] = None,
    adults: Optional[int] = None,
    db: Session = Depends(get_db)
):
    try:
        if check_out <= check_in:
            raise ValueError("Check-out date must be after check-in date.")
        rooms = get_available_rooms(check_in, check_out, db, category=category, min_adults=adults)
        return rooms
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/bookings", response_model=BookingResponse)
def post_booking(booking_req: BookingCreate, db: Session = Depends(get_db)):
    try:
        booking = create_booking(
            booking_req=booking_req,
            db=db,
            source="guest_action"
        )
        return booking
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/bookings", response_model=List[BookingWithRoomResponse])
def get_all_bookings(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status)
    return query.all()

@router.get("/bookings/{booking_id}", response_model=BookingWithRoomResponse)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@router.get("/guest/{guest_id}/bookings", response_model=List[BookingWithRoomResponse])
def get_guest_bookings(guest_id: int, db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(Booking.guest_id == guest_id).all()
    return bookings

@router.post("/bookings/{booking_id}/cancel", response_model=BookingResponse)
def post_cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    try:
        booking = cancel_booking(booking_id, db, cancelled_by="guest")
        return booking
    except ValueError as e:
        if str(e) == "Booking not found.":
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
