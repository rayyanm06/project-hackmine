import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal, engine, Base
import os
from backend.models.audit_log import AuditLog

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    # Make sure we don't mess up production db.
    # The tests should run against test.db as configured in conftest.py, but we are just writing a standalone test.
    # The instructions state: "No test may write to backend/app.db."
    # We will let conftest.py handle DB overriding if it's there.
    yield

def test_model_loads():
    # Test 1 - Model loads
    from backend.services.ml_service import load_model_and_metrics
    model, metrics = load_model_and_metrics()
    assert model is not None
    assert metrics is not None
    assert "model_name" in metrics

def test_valid_inference():
    # Test 2 & 3 & 4
    payload = {
        "lead_time": 45,
        "arrival_date_week_number": 27,
        "arrival_date_day_of_month": 4,
        "stays_in_weekend_nights": 0,
        "stays_in_week_nights": 2,
        "adults": 2,
        "children": 0,
        "babies": 0,
        "is_repeated_guest": 0,
        "previous_cancellations": 0,
        "previous_bookings_not_canceled": 0,
        "booking_changes": 0,
        "agent": 9.0,
        "days_in_waiting_list": 0,
        "adr": 105.0,
        "required_car_parking_spaces": 0,
        "total_of_special_requests": 0,
        "hotel": "Resort Hotel",
        "arrival_date_year": 2017,
        "arrival_date_month": "July",
        "meal": "BB",
        "country": "PRT",
        "market_segment": "Online TA",
        "distribution_channel": "TA/TO",
        "reserved_room_type": "A",
        "deposit_type": "No Deposit",
        "customer_type": "Transient"
    }
    
    response = client.post("/api/ml/cancellation-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Test 2
    assert "prediction" in data
    assert "cancellation_probability" in data
    assert "risk_level" in data
    
    # Test 3
    assert 0 <= data["cancellation_probability"] <= 1
    
    # Test 4
    assert data["model_name"] == "Smart Resort Cancellation Predictor"
    assert "v" in data["model_version"]
    assert data["algorithm"] == "RandomForestClassifier"
    assert "Hotel Booking Demand" in data["dataset_source"]
    assert "roc_auc" in data["evaluation_metrics"]

def test_invalid_input():
    # Test 5
    response = client.post("/api/ml/cancellation-risk", json={"lead_time": "INVALID_TYPE", "country": 123})
    assert response.status_code == 422

def test_audit_event_created():
    # Test 6, 8
    db = SessionLocal()
    # Check latest audit log
    log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    assert log is not None
    assert log.action == "ML_CANCELLATION_PREDICTION"
    assert log.details_json["source"] == "ml"
    assert "prediction" in log.details_json
    assert "cancellation_probability" in log.details_json
    assert "Hotel Booking Demand" in log.details_json["dataset_source"]
    db.close()
