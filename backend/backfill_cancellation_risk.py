import os
import sys
from datetime import timedelta, date, datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from backend.database import SessionLocal
from backend.models.booking import Booking
from backend.models.audit_log import AuditLog
from backend.models.room import Room
from backend.schemas.ml import CancellationPredictionRequest
from backend.services.ml_service import predict_cancellation_risk
import json

def backfill():
    db = SessionLocal()
    
    all_bookings = db.query(Booking).all()
    total_bookings = len(all_bookings)
    
    # Check predictions
    with_pred = [b for b in all_bookings if b.cancellation_probability is not None]
    without_pred = [b for b in all_bookings if b.cancellation_probability is None]
    
    print(f"Total bookings: {total_bookings}")
    print(f"Bookings with prediction: {len(with_pred)}")
    print(f"Bookings without prediction: {len(without_pred)}")
    
    print("\n--- Starting Backfill ---")
    
    processed = 0
    generated = 0
    skipped = 0
    failed = 0
    
    for booking in without_pred:
        processed += 1
        try:
            # Need room to get room type and price
            room = booking.room
            if not room:
                skipped += 1
                continue
                
            nights = (booking.check_out_date - booking.check_in_date).days
            if nights <= 0:
                skipped += 1
                continue
                
            # Compute lead time (default 45 if we can't derive it or it's negative)
            created_date = booking.created_at.date() if booking.created_at else date.today()
            lead_time = (booking.check_in_date - created_date).days
            if lead_time < 0:
                lead_time = 0
                
            # ADR inference from total price
            # total_price = (nights * ADR) + (extra_beds * extra_bed_price * nights)
            extra_bed_cost = (booking.extra_beds_requested or 0) * room.extra_bed_price * nights
            room_revenue = booking.total_price - extra_bed_cost
            inferred_adr = room_revenue / nights if nights > 0 else room.base_price_per_night
            
            ml_req = CancellationPredictionRequest(
                lead_time=lead_time,
                arrival_date_week_number=booking.check_in_date.isocalendar()[1],
                arrival_date_day_of_month=booking.check_in_date.day,
                arrival_date_year=booking.check_in_date.year,
                arrival_date_month=booking.check_in_date.strftime('%B'),
                stays_in_weekend_nights=sum(1 for i in range(nights) if (booking.check_in_date + timedelta(days=i)).weekday() >= 5),
                stays_in_week_nights=sum(1 for i in range(nights) if (booking.check_in_date + timedelta(days=i)).weekday() < 5),
                adults=booking.adults,
                children=float(booking.children or 0),
                babies=0,
                is_repeated_guest=0,
                previous_cancellations=0,
                previous_bookings_not_canceled=0,
                booking_changes=0,
                agent=9.0,
                days_in_waiting_list=0,
                adr=float(inferred_adr),
                required_car_parking_spaces=0,
                total_of_special_requests=0,
                hotel="Resort Hotel",
                meal="SC",
                country="PRT",
                market_segment="Online TA",
                distribution_channel="TA/TO",
                reserved_room_type=room.room_type[0] if room.room_type else "A",
                deposit_type="No Deposit",
                customer_type="Transient"
            )
            
            pred_res = predict_cancellation_risk(ml_req)
            
            # Save to booking
            booking.cancellation_probability = pred_res.cancellation_probability
            booking.cancellation_risk_level = pred_res.risk_level
            booking.cancellation_model_version = pred_res.model_version
            booking.cancellation_predicted_at = datetime.now(timezone.utc)
            booking.cancellation_prediction_source = "ML_BACKFILL"
            
            # Create Audit Log
            audit_event = AuditLog(
                action="ML_CANCELLATION_PREDICTION",
                resource_type="Booking",
                resource_id=booking.id,
                details_json={
                    "probability": pred_res.cancellation_probability,
                    "risk_level": pred_res.risk_level,
                    "model": "CancellationPredictor",
                    "model_version": pred_res.model_version,
                    "prediction_source": "ML_BACKFILL",
                    "guest_history_available": False,
                    "unavailable_history_fields": [
                        "previous_cancellations",
                        "previous_bookings_not_canceled",
                        "is_repeated_guest"
                    ]
                }
            )
            db.add(audit_event)
            db.commit()
            generated += 1
            
        except Exception as e:
            print(f"Failed to backfill booking {booking.id}: {e}")
            db.rollback()
            failed += 1
            
    print("\n--- Backfill Complete ---")
    print(f"Processed: {processed}")
    print(f"Predictions generated: {generated}")
    print(f"Skipped: {skipped}")
    print(f"Failed: {failed}")
    
    # Verify after
    all_bookings_after = db.query(Booking).all()
    with_pred_after = [b for b in all_bookings_after if b.cancellation_probability is not None]
    
    print(f"\nTotal bookings: {total_bookings}")
    print(f"Predictions before: {len(with_pred)}")
    print(f"Predictions after: {len(with_pred_after)}")
    print(f"New predictions generated: {generated}")
    
    db.close()

if __name__ == "__main__":
    backfill()
