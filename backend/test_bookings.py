import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.room import Room
from backend.models.booking import Booking
from backend.models.audit_log import AuditLog

client = TestClient(app)

def seed_booking_scenario(db):
    room1 = Room(
        room_number=501, room_type="Normal", floor=5, status="available", 
        base_rate=2500, base_price_per_night=2500, 
        max_adults=2, max_children=1, has_extra_bed_option=False, extra_bed_price=0
    )
    room2 = Room(
        room_number=502, room_type="Family", floor=5, status="available", 
        base_rate=5500, base_price_per_night=5500, 
        max_adults=4, max_children=2, has_extra_bed_option=True, extra_bed_price=500
    )
    db.add_all([room1, room2])
    db.commit()
    db.refresh(room1)
    db.refresh(room2)
    
    today = date.today()
    # room1 is booked for today to today+3
    b1 = Booking(
        room_id=room1.id, guest_id=1, 
        check_in_date=today, check_out_date=today + timedelta(days=3), 
        adults=2, children=0, status="confirmed", total_price=7500
    )
    db.add(b1)
    db.commit()
    return room1, room2, b1

def test_get_available_rooms_excludes_overlap(test_db):
    room1, room2, b1 = seed_booking_scenario(test_db)
    today = date.today()
    # request overlaps the exact dates of b1
    res = client.get(f"/api/rooms/available?check_in={today.isoformat()}&check_out={(today + timedelta(days=2)).isoformat()}")
    assert res.status_code == 200
    data = res.json()
    room_ids = [r["id"] for r in data]
    assert room1.id not in room_ids
    assert room2.id in room_ids

def test_get_available_rooms_includes_no_overlap(test_db):
    room1, room2, b1 = seed_booking_scenario(test_db)
    today = date.today()
    # request is after b1 check_out
    res = client.get(f"/api/rooms/available?check_in={(today + timedelta(days=4)).isoformat()}&check_out={(today + timedelta(days=6)).isoformat()}")
    assert res.status_code == 200
    data = res.json()
    room_ids = [r["id"] for r in data]
    assert room1.id in room_ids
    assert room2.id in room_ids

def test_create_booking_success(test_db):
    room1, room2, b1 = seed_booking_scenario(test_db)
    today = date.today()
    check_in = today + timedelta(days=5)
    check_out = today + timedelta(days=7)
    
    # 2 nights * 5500 = 11000 + (1 * 500 * 2) = 12000 total price
    res = client.post("/api/bookings", json={
        "room_id": room2.id,
        "guest_id": 2,
        "check_in_date": check_in.isoformat(),
        "check_out_date": check_out.isoformat(),
        "adults": 2,
        "children": 1,
        "extra_beds_requested": 1
    })
    
    assert res.status_code == 200
    data = res.json()
    assert data["total_price"] == 12000
    assert data["status"] == "confirmed"

def test_create_booking_rejects_overlap(test_db):
    room1, room2, b1 = seed_booking_scenario(test_db)
    today = date.today()
    
    res = client.post("/api/bookings", json={
        "room_id": room1.id,
        "guest_id": 2,
        "check_in_date": (today + timedelta(days=1)).isoformat(),
        "check_out_date": (today + timedelta(days=5)).isoformat(),
        "adults": 1,
        "children": 0,
        "extra_beds_requested": 0
    })
    assert res.status_code == 400
    assert "not available" in res.json()["detail"].lower()

def test_create_booking_rejects_capacity(test_db):
    room1, room2, b1 = seed_booking_scenario(test_db)
    today = date.today()
    
    res = client.post("/api/bookings", json={
        "room_id": room1.id,
        "guest_id": 2,
        "check_in_date": (today + timedelta(days=5)).isoformat(),
        "check_out_date": (today + timedelta(days=7)).isoformat(),
        "adults": 3,
        "children": 0,
        "extra_beds_requested": 0
    })
    assert res.status_code == 400
    assert "exceeds" in res.json()["detail"].lower()

def test_create_booking_rejects_invalid_dates(test_db):
    room1, room2, b1 = seed_booking_scenario(test_db)
    today = date.today()
    
    res = client.post("/api/bookings", json={
        "room_id": room1.id,
        "guest_id": 2,
        "check_in_date": (today + timedelta(days=2)).isoformat(),
        "check_out_date": (today + timedelta(days=1)).isoformat(),
        "adults": 1,
        "children": 0,
        "extra_beds_requested": 0
    })
    assert res.status_code == 400
    assert "after check-in" in res.json()["detail"].lower()

def test_create_booking_rejects_past_date(test_db):
    room1, room2, b1 = seed_booking_scenario(test_db)
    past = date.today() - timedelta(days=5)
    
    res = client.post("/api/bookings", json={
        "room_id": room1.id,
        "guest_id": 2,
        "check_in_date": past.isoformat(),
        "check_out_date": (past + timedelta(days=2)).isoformat(),
        "adults": 1,
        "children": 0,
        "extra_beds_requested": 0
    })
    assert res.status_code == 400
    assert "past" in res.json()["detail"].lower()

def test_cancel_booking_frees_room(test_db):
    room1, room2, b1 = seed_booking_scenario(test_db)
    
    res = client.post(f"/api/bookings/{b1.id}/cancel")
    assert res.status_code == 200
    
    # Check if available now
    today = date.today()
    res2 = client.get(f"/api/rooms/available?check_in={today.isoformat()}&check_out={(today + timedelta(days=2)).isoformat()}")
    assert res2.status_code == 200
    room_ids = [r["id"] for r in res2.json()]
    assert room1.id in room_ids

def test_booking_creates_audit_event(test_db):
    room1, room2, b1 = seed_booking_scenario(test_db)
    today = date.today()
    
    # Count current audits
    initial_audits = len(test_db.query(AuditLog).all())
    
    res = client.post("/api/bookings", json={
        "room_id": room2.id,
        "guest_id": 2,
        "check_in_date": (today + timedelta(days=5)).isoformat(),
        "check_out_date": (today + timedelta(days=7)).isoformat(),
        "adults": 2,
        "children": 1,
        "extra_beds_requested": 1
    })
    assert res.status_code == 200
    
    audits = test_db.query(AuditLog).all()
    assert len(audits) == initial_audits + 2
    assert audits[-2].action == "ROOM_BOOKING_CREATED"
    assert audits[-2].resource_type == "Booking"
    assert audits[-1].action == "ML_CANCELLATION_PREDICTION"
    assert audits[-1].resource_type == "Booking"
