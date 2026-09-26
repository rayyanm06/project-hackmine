from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
import datetime
from backend.database import Base

staff_skills = Table(
    'staff_skills', Base.metadata,
    Column('staff_id', Integer, ForeignKey('staff.id')),
    Column('skill_id', Integer, ForeignKey('skills.id'))
)

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    staff_members = relationship("Staff", secondary=staff_skills, back_populates="skills")
