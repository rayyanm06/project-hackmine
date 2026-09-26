from sqlalchemy import Column, Integer, String, Boolean
from backend.database import Base


class Room(Base):
    """
    DEMO DATA MODEL — Room occupancy data is seeded for demonstration purposes.
    This does not reflect a live booking/PMS system.
    """
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(Integer, unique=True, index=True)
    room_type = Column(String)   # Deluxe, Suite, Standard, Family
    floor = Column(Integer, nullable=True)
    # Status: occupied | available | cleaning | maintenance
    status = Column(String, default="available")
    base_rate = Column(Integer, default=0)
    base_price_per_night = Column(Integer, default=0)
    max_adults = Column(Integer, default=2)
    max_children = Column(Integer, default=1)
    has_extra_bed_option = Column(Boolean, default=False)
    extra_bed_price = Column(Integer, default=0)
    
    # Cleaning timing
    cleaning_started_at = Column(String, nullable=True) # ISO format string for simplicity, or DateTime
    cleaning_duration_minutes = Column(Integer, nullable=True)
