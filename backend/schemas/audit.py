from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: int
    action: str
    user_id: Optional[int] = None
    resource_type: str
    resource_id: int
    details_json: Optional[Any] = None
    created_at: datetime
