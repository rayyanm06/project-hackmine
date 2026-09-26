from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import datetime
from backend.database import Base
from backend.models.skill import staff_skills

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    department = Column(String)
    shift_start = Column(String)
    shift_end = Column(String)
    available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="staff_profile")
    skills = relationship("Skill", secondary=staff_skills, back_populates="staff_members")
    assignments = relationship("Assignment", back_populates="staff")
