from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class AssignmentResponse(BaseModel):
    id: int
    task_id: int
    staff_id: int
    score: Optional[float]
    score_breakdown: Optional[Any]
    assigned_at: datetime

    class Config:
        from_attributes = True
