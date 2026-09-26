from pydantic import BaseModel
from typing import Optional


class RoomResponse(BaseModel):
    id: int
    room_number: int
    room_type: str
    floor: Optional[int] = None
    status: str
    base_price_per_night: int = 0
    max_adults: int = 2
    max_children: int = 0
    has_extra_bed_option: bool = False
    extra_bed_price: int = 0
    booking_status: str = "available"
    booking_check_in: Optional[str] = None
    booking_check_out: Optional[str] = None
    
    # Cleaning timing
    cleaning_started_at: Optional[str] = None
    cleaning_duration_minutes: Optional[int] = None
    cleaning_minutes_remaining: Optional[int] = None

    class Config:
        from_attributes = True
