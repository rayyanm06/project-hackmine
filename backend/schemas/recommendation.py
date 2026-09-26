from pydantic import BaseModel
from typing import Optional, List


class RoomMatchRequest(BaseModel):
    query: str


class ParsedRequirements(BaseModel):
    room_type: Optional[str] = None       # Deluxe | Suite | Standard | Family
    max_price: Optional[int] = None
    min_price: Optional[int] = None
    unsupported_requirements: List[str] = []  # Pool, capacity, bed type, etc. (NOT in DB)


class MatchedRoom(BaseModel):
    room_number: int
    room_type: str
    base_rate: int
    status: str
    floor: Optional[int] = None
    match_score: int
    match_reason: str
    explanation: str


class RoomMatchResponse(BaseModel):
    query: str
    parsed_requirements: ParsedRequirements
    matches: List[MatchedRoom]
    source: str          # "hybrid" | "rule_based"
    data_status: str     # "live_seeded"
    warning: Optional[str] = None
