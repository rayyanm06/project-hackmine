from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Float
from datetime import datetime
from backend.database import Base
from sqlalchemy.orm import relationship

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    guest_id = Column(Integer, index=True)
    check_in_date = Column(Date, index=True)
    check_out_date = Column(Date, index=True)
    adults = Column(Integer, default=1)
    children = Column(Integer, default=0)
    extra_beds_requested = Column(Integer, default=0)
    status = Column(String, default="confirmed") # "confirmed" | "cancelled"
    total_price = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Cancellation Prediction Metadata
    cancellation_probability = Column(Float, nullable=True)
    cancellation_risk_level = Column(String, nullable=True)
    cancellation_model_version = Column(String, nullable=True)
    cancellation_predicted_at = Column(DateTime, nullable=True)
    cancellation_prediction_source = Column(String, nullable=True)

    room = relationship("Room")
