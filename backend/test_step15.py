import pytest
from datetime import date, timedelta, datetime, timezone
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.room import Room
from backend.models.booking import Booking
from backend.models.audit_log import AuditLog

client = TestClient(app)

def test_automated_cancellation_prediction(test_db):
    room1 = Room(
        room_number=101, room_type="Deluxe", floor=1, status="available", 
        base_rate=3500, base_price_per_night=3500, 
        max_adults=2, max_children=2, has_extra_bed_option=True, extra_bed_price=1000
    )
    test_db.add(room1)
    test_db.commit()
    
    today = date.today()
    check_in = today + timedelta(days=5)
    check_out = today + timedelta(days=8)
    
    initial_audits = len(test_db.query(AuditLog).filter(AuditLog.action == "ML_CANCELLATION_PREDICTION").all())

    # 1. Create valid booking
    res = client.post("/api/bookings", json={
        "room_id": room1.id,
        "guest_id": 999,
        "check_in_date": check_in.isoformat(),
        "check_out_date": check_out.isoformat(),
        "adults": 2,
        "children": 1,
        "extra_beds_requested": 0,
        "guest_country": "USA",
        "booking_channel": "Website",
        "customer_type": "Transient",
        "deposit_type": "No Deposit",
        "meal_plan": "Breakfast",
        "special_requests": ["Extra pillow", "Late check-in"]
    })
    
    assert res.status_code == 200, res.text
    data = res.json()
    
    # 2 & 3 & 4 & 5. Check prediction returned
    assert "cancellation_risk" in data
    assert data["cancellation_risk"] is not None
    risk = data["cancellation_risk"]
    assert 0 <= risk["probability"] <= 1
    assert risk["risk_level"] in ["Low", "Medium", "High"]
    assert risk["model"] == "v1.0"
    
    booking_id = data["id"]
    
    # 6. Check Booking stores metadata
    booking = test_db.query(Booking).filter(Booking.id == booking_id).first()
    assert booking.cancellation_probability == risk["probability"]
    assert booking.cancellation_risk_level == risk["risk_level"]
    assert booking.cancellation_model_version == risk["model"]
    assert booking.cancellation_predicted_at is not None
    
    # 15. Audit event
    ml_audits = test_db.query(AuditLog).filter(AuditLog.action == "ML_CANCELLATION_PREDICTION").all()
    assert len(ml_audits) == initial_audits + 1
    new_audit = ml_audits[-1]
    
    # 8 & 9. Guest history handled
    details = new_audit.details_json
    assert details["guest_history_available"] is False
    assert "is_repeated_guest" in details["unavailable_history_fields"]
    
    # 10, 11, 12, 13, 14. ML features mapping
    signals = details["relevant_input_signals"]
    assert signals["lead_time"] == 5
    assert signals["adr"] == 3500.0
    assert signals["total_of_special_requests"] == 2
    assert signals["country"] == "USA"
    assert signals["meal"] == "BB"
    assert signals["market_segment"] == "Online TA"
    
    # 7. Check INR formatting in UI (We can only check that ADR value is correct internally, frontend handles ₹)
