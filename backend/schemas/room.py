from pydantic import BaseModel
from typing import Optional


class RoomResponse(BaseModel):
    id: int
    room_number: int
    room_type: str
    floor: Optional[int] = None
    status: str

    class Config:
        from_attributes = True
