import pytest
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from backend.database import Base
from sqlalchemy.orm import sessionmaker

test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)
from backend.models.booking import Booking
from backend.models.room import Room
from backend.models.audit_log import AuditLog
from backend.backfill_cancellation_risk import backfill

# Set up the database for testing
# (Skipped here as we already called create_all above)

@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_backfill_idempotent(db: Session, monkeypatch):
    # Mock SessionLocal in the script to use our testing session
    import backend.backfill_cancellation_risk
    monkeypatch.setattr(backend.backfill_cancellation_risk, 'SessionLocal', lambda: db)
    
    # Fetch existing room or create a new one with a unique number
    room = db.query(Room).first()
    if not room:
        room = Room(
            room_number=999, room_type="Normal", floor=9, status="available", 
            base_price_per_night=2500, max_adults=2, max_children=1, 
            has_extra_bed_option=False, extra_bed_price=0
        )
        db.add(room)
        db.commit()
    
    # Create an old booking without prediction
    booking = Booking(
        room_id=room.id,
        guest_id=1,
        check_in_date=date(2027, 4, 1),
        check_out_date=date(2027, 4, 5),
        adults=2,
        children=0,
        extra_beds_requested=0,
        status="confirmed",
        total_price=10000,
        cancellation_probability=None
    )
    db.add(booking)
    db.commit()
    
    # Run backfill
    backfill()
    
    # Verify booking has prediction
    updated_booking = db.query(Booking).filter(Booking.id == booking.id).first()
    assert updated_booking.cancellation_probability is not None
    assert updated_booking.cancellation_risk_level is not None
    assert updated_booking.cancellation_model_version is not None
    
    # Verify exactly one audit log for backfill
    audit_logs = db.query(AuditLog).filter_by(resource_id=booking.id, action="ML_CANCELLATION_PREDICTION").all()
    assert len(audit_logs) == 1
    assert audit_logs[0].details_json.get("prediction_source") == "ML_BACKFILL"
    assert audit_logs[0].details_json.get("guest_history_available") is False
    
    # Run backfill again to test idempotency
    backfill()
    
    # Verify still exactly one audit log
    audit_logs_after = db.query(AuditLog).filter_by(resource_id=booking.id, action="ML_CANCELLATION_PREDICTION").all()
    assert len(audit_logs_after) == 1
