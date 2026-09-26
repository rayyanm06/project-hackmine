from pydantic import BaseModel, Field
from typing import Dict, Any, List

class CancellationPredictionRequest(BaseModel):
    lead_time: int = 0
    arrival_date_week_number: int = 1
    arrival_date_day_of_month: int = 1
    stays_in_weekend_nights: int = 0
    stays_in_week_nights: int = 1
    adults: int = 1
    children: float = 0.0
    babies: int = 0
    is_repeated_guest: int = 0
    previous_cancellations: int = 0
    previous_bookings_not_canceled: int = 0
    booking_changes: int = 0
    agent: float = 0.0
    days_in_waiting_list: int = 0
    adr: float = 0.0
    required_car_parking_spaces: int = 0
    total_of_special_requests: int = 0
    hotel: str = "Resort Hotel"
    arrival_date_year: int = 2017
    arrival_date_month: str = "July"
    meal: str = "BB"
    country: str = "PRT"
    market_segment: str = "Online TA"
    distribution_channel: str = "TA/TO"
    reserved_room_type: str = "A"
    deposit_type: str = "No Deposit"
    customer_type: str = "Transient"

class CancellationPredictionResponse(BaseModel):
    prediction: int
    cancellation_probability: float
    risk_level: str
    model_name: str
    model_version: str
    algorithm: str
    dataset_source: str
    evaluation_metrics: Dict[str, Any]
    key_input_features: Dict[str, Any]
