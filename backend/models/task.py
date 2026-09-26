from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from backend.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    issue_type = Column(String, nullable=True)
    department = Column(String, nullable=True)
    priority = Column(String, nullable=True)
    location = Column(String, nullable=True)
    required_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)
    status = Column(String, default="created")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    complaint = relationship("Complaint", back_populates="tasks")
    required_skill = relationship("Skill")
    assignments = relationship("Assignment", back_populates="task")
    status_history = relationship("TaskStatusHistory", back_populates="task")
    completion_proofs = relationship("CompletionProof", back_populates="task")
