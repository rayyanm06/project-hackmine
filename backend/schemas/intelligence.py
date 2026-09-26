from pydantic import BaseModel, ConfigDict
from typing import List, Literal

class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    action: str
    reason: str
    priority: str
    evidence: List[str]
    source: str

class SystemicIssue(BaseModel):
    type: str
    title: str
    severity: str
    summary: str
    evidence: List[str]
    source: str

class SystemicIssueResponse(BaseModel):
    issues: List[SystemicIssue]
