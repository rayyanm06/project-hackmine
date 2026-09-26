from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, Boolean
from datetime import datetime, timezone
from database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, index=True)
    guest_name = Column(String, nullable=True)
    room_number = Column(String, nullable=True)
    text = Column(Text, nullable=False)
    language = Column(String, default="English")
    category = Column(String, default="General")
    subcategory = Column(String, nullable=True)
    priority = Column(String, default="medium")
    status = Column(String, default="open")  # open, in_progress, resolved, closed
    assigned_to = Column(String, nullable=True)
    sentiment = Column(String, default="neutral")
    confidence = Column(Float, default=0.9)
    explanation = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Staff(Base):
    __tablename__ = "staff"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    skills = Column(JSON, default=list)  # list of skill strings
    availability = Column(String, default="available")  # available, busy, on_leave
    current_workload = Column(Integer, default=0)
    active_tasks = Column(Integer, default=0)
    completed_tasks = Column(Integer, default=0)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True)
    complaint_id = Column(String, nullable=True)
    title = Column(String, nullable=False)
    assigned_to = Column(String, nullable=True)
    skill = Column(String, nullable=False)
    priority = Column(String, default="medium")  # low, medium, high, critical
    status = Column(String, default="Created")  # Created, Assigned, In Progress, Completed, Verified, Closed
    sla_status = Column(String, default="on_track")  # on_track, at_risk, breached
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    due_at = Column(DateTime, nullable=True)
    completion_notes = Column(Text, nullable=True)
    assignment_score = Column(Integer, nullable=True)
    proof_photo = Column(String, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String, nullable=False)
    user = Column(String, default="System")
    details = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
