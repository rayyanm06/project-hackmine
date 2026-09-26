from sqlalchemy import Column, Integer, String
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
