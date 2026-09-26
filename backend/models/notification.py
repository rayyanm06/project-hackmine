from sqlalchemy import Column, Integer, String, DateTime, Boolean
import datetime
from backend.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    message = Column(String)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
