from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import datetime
from backend.database import Base

class CompletionProof(Base):
    __tablename__ = "completion_proofs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    photo_path = Column(String)
    verified = Column(Boolean, default=False)
    verified_by_id = Column(Integer, nullable=True)
    verified_at = Column(DateTime, nullable=True)

    task = relationship("Task", back_populates="completion_proofs")
