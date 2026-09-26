from pydantic import BaseModel, ConfigDict, computed_field
from typing import Optional, List
from datetime import date, datetime
from backend.schemas.room import RoomResponse

class BookingCreate(BaseModel):
    room_id: int
    guest_id: int
    check_in_date: date
    check_out_date: date
    adults: int
    children: int
    babies: Optional[int] = 0
    extra_beds_requested: Optional[int] = 0
    
    # ML Features for Cancellation Prediction
    guest_country: Optional[str] = "PRT"
    booking_channel: Optional[str] = "Direct"
    customer_type: Optional[str] = "Transient"
    deposit_type: Optional[str] = "No Deposit"
    meal_plan: Optional[str] = "No Meal"
    special_requests: Optional[List[str]] = []

class CancellationRiskMetadata(BaseModel):
    probability: float
    risk_level: str
    model: str
    is_backfilled: bool = False

class BookingResponse(BaseModel):
    id: int
    room_id: int
    guest_id: int
    check_in_date: date
    check_out_date: date
    adults: int
    children: int
    extra_beds_requested: int
    status: str
    total_price: int
    created_at: datetime
    
    # Cancellation Prediction Metadata
    cancellation_probability: Optional[float] = None
    cancellation_risk_level: Optional[str] = None
    cancellation_model_version: Optional[str] = None
    cancellation_predicted_at: Optional[datetime] = None
    cancellation_prediction_source: Optional[str] = None
    
    @computed_field
    @property
    def cancellation_risk(self) -> Optional[CancellationRiskMetadata]:
        if self.cancellation_probability is not None and self.cancellation_risk_level and self.cancellation_model_version:
            is_backfilled = (self.cancellation_prediction_source == "ML_BACKFILL")
                
            return CancellationRiskMetadata(
                probability=self.cancellation_probability,
                risk_level=self.cancellation_risk_level,
                model=self.cancellation_model_version,
                is_backfilled=is_backfilled
            )
        return None
    
    model_config = ConfigDict(from_attributes=True)

class RoomCategoryResponse(BaseModel):
    category: str
    typical_price: int
    max_adults: int
    max_children: int
    has_extra_bed: bool

class BookingWithRoomResponse(BookingResponse):
    room: RoomResponse
    
    model_config = ConfigDict(from_attributes=True)
