from sqlalchemy import Column, Integer, String, DateTime, JSON
import datetime
from backend.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    user_id = Column(Integer, nullable=True)
    resource_type = Column(String)
    resource_id = Column(Integer)
    details_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
