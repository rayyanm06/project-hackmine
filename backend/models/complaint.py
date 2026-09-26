from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
import datetime
from backend.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(Integer)
    room_number = Column(Integer)
    text = Column(String)
    language = Column(String)
    status = Column(String, default="submitted")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    tasks = relationship("Task", back_populates="complaint")
