import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import Base, engine, get_db
from backend.models.notification import Notification

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    # No teardown here, we reuse db or memory sqlite usually clears on restart.

def test_post_guest_service_request():
    res = client.post("/api/guest/1/requests", data={
        "room_number": 101,
        "text": "Please bring extra towels",
        "request_category": "service_request"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["request_category"] == "service_request"
    assert data["task_id"] is not None

def test_post_guest_complaint():
    res = client.post("/api/guest/1/requests", data={
        "room_number": 101,
        "text": "The AC is broken",
        "request_category": "complaint"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["request_category"] == "complaint"
    assert data["task_id"] is not None

import random

def test_get_guest_requests():
    g_id = random.randint(10000, 99999)
    # Make a request for unique guest
    client.post(f"/api/guest/{g_id}/requests", data={
        "room_number": 200,
        "text": "Need water",
        "request_category": "service_request"
    })
    
    # Guest 200 should have 1 request
    res2 = client.get(f"/api/guest/{g_id}/requests")
    assert res2.status_code == 200
    assert len(res2.json()) == 1

def test_status_transition_creates_notification():
    g_id = random.randint(10000, 99999)
    # Create a request
    res = client.post(f"/api/guest/{g_id}/requests", data={
        "room_number": 103,
        "text": "Fix the TV",
        "request_category": "complaint"
    })
    data = res.json()
    task_id = data["task_id"]
    
    # Get unread notifications before transition (should be 1 because assignment happens immediately)
    notifs_before = client.get(f"/api/guest/{g_id}/notifications").json()
    assert len(notifs_before) == 1
    assert notifs_before[0]["message"] == "Your request has been accepted and assigned to our team."
    
    # Change task status to in_progress
    res_status = client.patch(f"/api/tasks/{task_id}/status", json={"status": "in_progress"})
    assert res_status.status_code == 200
    
    # Check notifications
    notifs_after = client.get(f"/api/guest/{g_id}/notifications").json()
    assert len(notifs_after) == 2
    assert notifs_after[0]["message"] == "Your request is currently being worked on." # newest first
    
    # Verify unread count
    unread = [n for n in notifs_after if not n["read"]]
    assert len(unread) == 2

def test_get_notifications_and_mark_read():
    g_id = random.randint(10000, 99999)
    client.post(f"/api/guest/{g_id}/requests", data={"room_number": 1, "text": "Hi", "request_category": "complaint"})
    res = client.get(f"/api/guest/{g_id}/notifications")
    notifs = res.json()
    assert len(notifs) > 0
    notif_id = notifs[0]["id"]
    
    # Mark as read
    res_read = client.post(f"/api/guest/{g_id}/notifications/{notif_id}/read")
    assert res_read.status_code == 200
    assert res_read.json()["read"] is True
    
    # Verify updated
    res2 = client.get(f"/api/guest/{g_id}/notifications")
    notifs2 = res2.json()
    assert notifs2[0]["read"] is True
    unread_now = [n for n in notifs2 if not n["read"]]
    assert len(unread_now) == len(notifs) - 1
