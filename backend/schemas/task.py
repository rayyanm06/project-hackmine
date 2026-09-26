from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class TaskAssignmentResponse(BaseModel):
    id: int
    staff_id: int
    staff_name: Optional[str] = None
    score: Optional[float] = None
    score_breakdown: Optional[Any] = None
    assigned_at: datetime

    class Config:
        from_attributes = True

class TaskStatusUpdate(BaseModel):
    status: str

class CompletionProofResponse(BaseModel):
    id: int
    photo_path: str
    verified: bool
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TaskStatusHistoryResponse(BaseModel):
    id: int
    old_status: Optional[str] = None
    new_status: str
    timestamp: datetime

    class Config:
        from_attributes = True

class TaskResponse(BaseModel):
    id: int
    complaint_id: int
    issue_type: Optional[str]
    department: Optional[str]
    priority: Optional[str]
    location: Optional[str]
    required_skill_id: Optional[int]
    status: str
    created_at: datetime
    updated_at: datetime
    assignments: List[TaskAssignmentResponse] = []
    completion_proofs: List[CompletionProofResponse] = []
    status_history: List[TaskStatusHistoryResponse] = []

    class Config:
        from_attributes = True
