from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.models.room import Room
from backend.models.booking import Booking
from backend.models.audit_log import AuditLog
from backend.schemas.booking import BookingCreate
from backend.schemas.ml import CancellationPredictionRequest
from backend.services.ml_service import predict_cancellation_risk
import json

def check_room_availability(room_id: int, check_in_date: date, check_out_date: date, db: Session) -> bool:
    """Returns True if the room is available for the given date range (no overlapping confirmed bookings)."""
    overlapping_booking = db.query(Booking).filter(
        Booking.room_id == room_id,
        Booking.status == "confirmed",
        Booking.check_in_date < check_out_date,
        Booking.check_out_date > check_in_date
    ).first()
    
    return overlapping_booking is None

def get_available_rooms(
    check_in_date: date, 
    check_out_date: date, 
    db: Session,
    category: Optional[str] = None,
    min_adults: Optional[int] = None
) -> List[Room]:
    """Returns all rooms matching the optional filters that are available for the date range."""
    # First filter by basic room attributes
    query = db.query(Room)
    
    if category:
        query = query.filter(Room.room_type == category)
        
    if min_adults is not None:
        query = query.filter(Room.max_adults >= min_adults)
        
    candidate_rooms = query.all()
    
    # Then check availability for each
    available_rooms = []
    for room in candidate_rooms:
        if check_room_availability(room.id, check_in_date, check_out_date, db):
            available_rooms.append(room)
            
    return available_rooms

def create_booking(
    booking_req: BookingCreate,
    db: Session,
    source: str = "guest_action"
) -> Booking:
    """Creates a new booking after validating availability and rules."""
    # Validate dates
    if booking_req.check_out_date <= booking_req.check_in_date:
        raise ValueError("Check-out date must be after check-in date.")
    if booking_req.check_in_date < date.today():
        raise ValueError("Check-in date cannot be in the past.")
        
    # Get room
    room = db.query(Room).filter(Room.id == booking_req.room_id).first()
    if not room:
        raise ValueError("Room not found.")
        
    # Re-validate availability
    if not check_room_availability(booking_req.room_id, booking_req.check_in_date, booking_req.check_out_date, db):
        raise ValueError("Room not available for these dates.")
        
    # Validate capacity
    if booking_req.adults + booking_req.children + (booking_req.babies or 0) > room.max_adults + room.max_children:
        raise ValueError(f"Exceeds maximum occupancy for this room type. Max adults: {room.max_adults}, max children: {room.max_children}.")
        
    if booking_req.adults > room.max_adults:
        raise ValueError(f"Exceeds maximum adults for this room type. Max adults: {room.max_adults}.")
        
    if (booking_req.extra_beds_requested or 0) > 0 and not room.has_extra_bed_option:
        raise ValueError("This room type does not support extra beds.")
        
    # Compute total price deterministically
    nights = (booking_req.check_out_date - booking_req.check_in_date).days
    total_price = (nights * room.base_price_per_night) + ((booking_req.extra_beds_requested or 0) * room.extra_bed_price * nights)
    
    # Create booking
    booking = Booking(
        room_id=booking_req.room_id,
        guest_id=booking_req.guest_id,
        check_in_date=booking_req.check_in_date,
        check_out_date=booking_req.check_out_date,
        adults=booking_req.adults,
        children=booking_req.children,
        extra_beds_requested=booking_req.extra_beds_requested or 0,
        status="confirmed",
        total_price=total_price
    )
    db.add(booking)
    db.flush() # flush to get the booking ID
    
    # Run Cancellation Prediction
    from datetime import datetime, timezone
    
    # Build ML Features
    market_segment_map = {
        "Direct": "Direct",
        "Website": "Online TA",
        "Travel Agent": "Offline TA/TO",
        "Corporate": "Corporate",
        "Other": "Complementary"
    }
    distribution_channel_map = {
        "Direct": "Direct",
        "Website": "TA/TO",
        "Travel Agent": "TA/TO",
        "Corporate": "Corporate",
        "Other": "Direct"
    }
    meal_map = {
        "No Meal": "SC",
        "Breakfast": "BB",
        "Half Board": "HB",
        "Full Board": "FB"
    }
    
    ml_req = CancellationPredictionRequest(
        lead_time=(booking_req.check_in_date - date.today()).days,
        arrival_date_week_number=booking_req.check_in_date.isocalendar()[1],
        arrival_date_day_of_month=booking_req.check_in_date.day,
        arrival_date_year=booking_req.check_in_date.year,
        arrival_date_month=booking_req.check_in_date.strftime('%B'),
        stays_in_weekend_nights=sum(1 for i in range(nights) if (booking_req.check_in_date + timedelta(days=i)).weekday() >= 5),
        stays_in_week_nights=sum(1 for i in range(nights) if (booking_req.check_in_date + timedelta(days=i)).weekday() < 5),
        adults=booking_req.adults,
        children=float(booking_req.children),
        babies=booking_req.babies or 0,
        is_repeated_guest=0,
        previous_cancellations=0,
        previous_bookings_not_canceled=0,
        booking_changes=0,
        agent=9.0, # default safe value
        days_in_waiting_list=0,
        adr=float(room.base_price_per_night),
        required_car_parking_spaces=0,
        total_of_special_requests=len(booking_req.special_requests or []),
        hotel="Resort Hotel",
        meal=meal_map.get(booking_req.meal_plan, "SC"),
        country=booking_req.guest_country or "PRT",
        market_segment=market_segment_map.get(booking_req.booking_channel, "Online TA"),
        distribution_channel=distribution_channel_map.get(booking_req.booking_channel, "TA/TO"),
        reserved_room_type=room.room_type[0] if room.room_type else "A", # Simple mapping
        deposit_type=booking_req.deposit_type or "No Deposit",
        customer_type=booking_req.customer_type or "Transient"
    )
    
    pred_res = predict_cancellation_risk(ml_req)
    
    # Save Prediction to Booking
    booking.cancellation_probability = pred_res.cancellation_probability
    booking.cancellation_risk_level = pred_res.risk_level
    booking.cancellation_model_version = pred_res.model_version
    booking.cancellation_predicted_at = datetime.now(timezone.utc)
    booking.cancellation_prediction_source = "ML_LIVE"
    
    # Write audit event for booking creation
    audit_event = AuditLog(
        action="ROOM_BOOKING_CREATED",
        resource_type="Booking",
        resource_id=booking.id,
        details_json={
            "room_id": booking_req.room_id,
            "guest_id": booking_req.guest_id,
            "category": room.room_type,
            "check_in_date": booking_req.check_in_date.isoformat(),
            "check_out_date": booking_req.check_out_date.isoformat(),
            "total_price": total_price,
            "source": source
        }
    )
    db.add(audit_event)
    
    # Write audit event for ML prediction
    ml_audit_event = AuditLog(
        action="ML_CANCELLATION_PREDICTION",
        resource_type="Booking",
        resource_id=booking.id,
        details_json={
            "source": "ml",
            "prediction_source": "ML_LIVE",
            "model_name": pred_res.model_name,
            "model_version": pred_res.model_version,
            "dataset": pred_res.dataset_source,
            "cancellation_probability": pred_res.cancellation_probability,
            "risk_level": pred_res.risk_level,
            "guest_history_available": False,
            "unavailable_history_fields": ["is_repeated_guest", "previous_cancellations", "previous_bookings_not_canceled"],
            "relevant_input_signals": ml_req.model_dump(),
            "predicted_at": booking.cancellation_predicted_at.isoformat()
        }
    )
    db.add(ml_audit_event)
    
    db.commit()
    db.refresh(booking)
    
    return booking

def cancel_booking(booking_id: int, db: Session, cancelled_by: str = "guest") -> Booking:
    """Cancels a booking and frees up the room."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise ValueError("Booking not found.")
        
    if booking.status == "cancelled":
        raise ValueError("Booking is already cancelled.")
        
    booking.status = "cancelled"
    
    audit_event = AuditLog(
        action="ROOM_BOOKING_CANCELLED",
        resource_type="Booking",
        resource_id=booking.id,
        details_json={
            "cancelled_by": cancelled_by,
            "room_id": booking.room_id
        }
    )
    db.add(audit_event)
    db.commit()
    db.refresh(booking)
    
    return booking
