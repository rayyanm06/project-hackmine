from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from backend.database import Base

class TaskStatusHistory(Base):
    __tablename__ = "task_status_history"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    old_status = Column(String)
    new_status = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    changed_by_id = Column(Integer, nullable=True)

    task = relationship("Task", back_populates="status_history")
