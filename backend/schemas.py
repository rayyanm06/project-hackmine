from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ComplaintBase(BaseModel):
    guest_name: Optional[str] = None
    room_number: Optional[str] = None
    text: str
    language: Optional[str] = "English"

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    guest_name: Optional[str] = None
    room_number: Optional[str] = None
    text: str
    language: str
    category: str
    subcategory: Optional[str] = None
    priority: str
    status: str
    assigned_to: Optional[str] = None
    sentiment: str
    confidence: float
    explanation: str
    created_at: datetime

class StaffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    role: str
    skills: List[str]
    availability: str
    current_workload: int
    active_tasks: int
    completed_tasks: int

class StaffAvailabilityUpdate(BaseModel):
    availability: str

class TaskCreate(BaseModel):
    complaint_id: Optional[str] = None
    title: str
    skill: str
    priority: str = "medium"
    assigned_to: Optional[str] = None

class TaskStatusUpdate(BaseModel):
    status: str
    completion_notes: Optional[str] = None

class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    complaint_id: Optional[str] = None
    title: str
    assigned_to: Optional[str] = None
    skill: str
    priority: str
    status: str
    sla_status: str
    created_at: datetime
    due_at: Optional[datetime] = None
    completion_notes: Optional[str] = None
    assignment_score: Optional[int] = None
    proof_photo: Optional[str] = None

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    action: str
    user: str
    details: str
    created_at: datetime
