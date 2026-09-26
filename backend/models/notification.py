from sqlalchemy import Column, Integer, String, DateTime, Boolean
import datetime
from backend.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(Integer, index=True)
    message = Column(String)
    related_request_id = Column(Integer, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
