from pydantic import BaseModel
from typing import List, Optional


class StaffResponse(BaseModel):
    id: int
    name: str
    department: str
    available: bool
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None
    active_task_count: int
    skills: List[str] = []

    class Config:
        from_attributes = True
