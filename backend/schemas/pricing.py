from pydantic import BaseModel
from typing import List

class CompetitorResponse(BaseModel):
    name: str
    rate: int

class PricingAnalysisResponse(BaseModel):
    property_name: str
    room_type: str
    your_rate: int
    competitors: List[CompetitorResponse]
    market_average: int
    market_min: int
    market_max: int
    recommendation: str
    recommended_rate_min: int
    recommended_rate_max: int
    reason: str
    evidence: List[str]
    source: str
    data_status: str
