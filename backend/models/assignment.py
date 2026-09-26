from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
import datetime
from backend.database import Base

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    staff_id = Column(Integer, ForeignKey("staff.id"))
    score = Column(Float, nullable=True)
    score_breakdown = Column(JSON, nullable=True)
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow)

    task = relationship("Task", back_populates="assignments")
    staff = relationship("Staff", back_populates="assignments")

    @property
    def staff_name(self) -> str | None:
        if self.staff and self.staff.user:
            return self.staff.user.name
        return None
