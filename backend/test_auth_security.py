import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_unauthenticated_request_rejected():
    """Protected endpoints reject requests without Authorization token with 401."""
    response = client.get("/api/pricing/competitive-analysis", headers={"Authorization": ""})
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"] or "Invalid" in response.json()["detail"]

def test_invalid_token_rejected():
    """Requests with malformed / invalid tokens receive 401."""
    response = client.get(
        "/api/pricing/competitive-analysis",
        headers={"Authorization": "Bearer completely-invalid-fake-token-xyz"}
    )
    assert response.status_code == 401

def test_guest_access_allowed_and_restricted():
    """
    Guest role:
    - Allowed: /api/complaints, /api/rooms, /api/recommendations
    - Rejected (403): /api/tasks, /api/staff, /api/pricing, /api/audit
    """
    guest_headers = {"Authorization": "Bearer test-guest-token"}

    # 1. Allowed endpoints for Guest
    res_complaints = client.get("/api/complaints", headers=guest_headers)
    assert res_complaints.status_code == 200

    res_rooms = client.get("/api/rooms", headers=guest_headers)
    assert res_rooms.status_code == 200

    # 2. Blocked endpoints for Guest (must return 403)
    res_tasks = client.get("/api/tasks", headers=guest_headers)
    assert res_tasks.status_code == 403
    assert "Access denied" in res_tasks.json()["detail"]

    res_staff = client.get("/api/staff", headers=guest_headers)
    assert res_staff.status_code == 403

    res_pricing = client.get("/api/pricing/competitive-analysis", headers=guest_headers)
    assert res_pricing.status_code == 403

    res_audit = client.get("/api/audit", headers=guest_headers)
    assert res_audit.status_code == 403

def test_staff_access_allowed_and_restricted():
    """
    Staff role:
    - Allowed: /api/tasks, /api/staff
    - Rejected (403): /api/complaints, /api/pricing, /api/audit, /api/rooms
    """
    staff_headers = {"Authorization": "Bearer test-staff-token"}

    # 1. Allowed endpoints for Staff
    res_tasks = client.get("/api/tasks", headers=staff_headers)
    assert res_tasks.status_code == 200

    res_staff = client.get("/api/staff", headers=staff_headers)
    assert res_staff.status_code == 200

    # 2. Blocked endpoints for Staff (must return 403)
    res_complaints = client.get("/api/complaints", headers=staff_headers)
    assert res_complaints.status_code == 403

    res_pricing = client.get("/api/pricing/competitive-analysis", headers=staff_headers)
    assert res_pricing.status_code == 403

    res_audit = client.get("/api/audit", headers=staff_headers)
    assert res_audit.status_code == 403

    res_rooms = client.get("/api/rooms", headers=staff_headers)
    assert res_rooms.status_code == 403

def test_staff_cannot_reassign_tasks():
    """Task reassignment requires Management; Staff gets 403."""
    staff_headers = {"Authorization": "Bearer test-staff-token"}
    res = client.get("/api/tasks/1/reassignment-candidates", headers=staff_headers)
    assert res.status_code == 403

def test_manager_access_allowed():
    """
    Manager role:
    - Allowed across all operations: tasks, staff, pricing, audit, reports, complaints
    """
    manager_headers = {"Authorization": "Bearer test-manager-token"}

    res_tasks = client.get("/api/tasks", headers=manager_headers)
    assert res_tasks.status_code == 200

    res_staff = client.get("/api/staff", headers=manager_headers)
    assert res_staff.status_code == 200

    res_complaints = client.get("/api/complaints", headers=manager_headers)
    assert res_complaints.status_code == 200

    res_rooms = client.get("/api/rooms", headers=manager_headers)
    assert res_rooms.status_code == 200

    res_pricing = client.get("/api/pricing/competitive-analysis", headers=manager_headers)
    assert res_pricing.status_code == 200

    res_audit = client.get("/api/audit", headers=manager_headers)
    assert res_audit.status_code == 200

def test_tampering_attempt_fails():
    """
    Passing a client-supplied role claim in query or body does NOT grant permissions.
    The backend only trusts the verified token.
    """
    guest_headers = {"Authorization": "Bearer test-guest-token"}

    # Attempting to call manager pricing with ?role=Manager in query
    res = client.get("/api/pricing/competitive-analysis?role=Manager", headers=guest_headers)
    assert res.status_code == 403

    # Attempting to call task endpoint with ?isAdmin=true in query
    res2 = client.get("/api/tasks?isAdmin=true&role=Manager", headers=guest_headers)
    assert res2.status_code == 403
