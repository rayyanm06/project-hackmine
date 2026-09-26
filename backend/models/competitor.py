from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from backend.database import Base

class Competitor(Base):
    __tablename__ = "competitors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    room_type = Column(String)
    rate = Column(Integer)
    last_updated = Column(DateTime, default=datetime.utcnow)
