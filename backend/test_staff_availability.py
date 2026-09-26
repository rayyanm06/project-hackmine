import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid

from backend.main import app
from backend.database import Base, get_db
from backend.models import Task, Staff, User, Assignment, AuditLog
from backend.models.skill import Skill

@pytest.fixture(autouse=True)
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(bind=engine)
    session = TestSession()

    def get_test_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = get_test_db
    yield session
    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db):
    return TestClient(app)

def test_patch_availability_true_to_false(client, db):
    user = User(name="User1", email="u1@test.com", role="staff")
    db.add(user)
    db.commit()
    
    staff = Staff(user_id=user.id, department="Maintenance", available=True, shift_start="00:00", shift_end="23:59")
    db.add(staff)
    db.commit()
    
    response = client.patch(f"/api/staff/{staff.id}/availability", json={"available": False})
    assert response.status_code == 200
    assert response.json()["available"] == False
    
    db.refresh(staff)
    assert staff.available == False

def test_patch_availability_false_to_true(client, db):
    user = User(name="User2", email="u2@test.com", role="staff")
    db.add(user)
    db.commit()
    
    staff = Staff(user_id=user.id, department="Maintenance", available=False, shift_start="00:00", shift_end="23:59")
    db.add(staff)
    db.commit()
    
    response = client.patch(f"/api/staff/{staff.id}/availability", json={"available": True})
    assert response.status_code == 200
    assert response.json()["available"] == True
    
    db.refresh(staff)
    assert staff.available == True

def test_patch_availability_not_found(client, db):
    response = client.patch("/api/staff/99999/availability", json={"available": True})
    assert response.status_code == 404

def test_patch_availability_creates_audit_entry(client, db):
    user = User(name="User3", email="u3@test.com", role="staff")
    db.add(user)
    db.commit()
    
    staff = Staff(user_id=user.id, department="Maintenance", available=True, shift_start="00:00", shift_end="23:59")
    db.add(staff)
    db.commit()
    
    audit_count_before = db.query(AuditLog).filter_by(action="STAFF_AVAILABILITY_CHANGED", resource_id=staff.id).count()
    
    response = client.patch(f"/api/staff/{staff.id}/availability", json={"available": False})
    assert response.status_code == 200
    
    audit_count_after = db.query(AuditLog).filter_by(action="STAFF_AVAILABILITY_CHANGED", resource_id=staff.id).count()
    assert audit_count_after == audit_count_before + 1
    
    log = db.query(AuditLog).filter_by(action="STAFF_AVAILABILITY_CHANGED", resource_id=staff.id).first()
    assert log.details_json["old_value"] == True
    assert log.details_json["new_value"] == False
    assert log.details_json["source"] == "manager_action"

def test_excluded_from_reassignment_candidates(client, db):
    user = User(name="User4", email="u4@test.com", role="staff")
    db.add(user)
    db.commit()
    
    skill = Skill(name="Plumbing2")
    db.add(skill)
    db.commit()
    
    staff = Staff(user_id=user.id, department="Maintenance", available=True, shift_start="00:00", shift_end="23:59")
    staff.skills.append(skill)
    db.add(staff)
    
    task = Task(location="Room 101", issue_type="Leak", priority="High", status="assigned", department="Maintenance", required_skill_id=skill.id)
    db.add(task)
    db.commit()
    
    # Verify they are in candidates when available
    response = client.get(f"/api/tasks/{task.id}/reassignment-candidates")
    assert response.status_code == 200
    candidates = response.json()["candidates"]
    assert any(c["staff_id"] == staff.id for c in candidates)
    
    # Set to unavailable
    client.patch(f"/api/staff/{staff.id}/availability", json={"available": False})
    
    # Verify excluded
    response = client.get(f"/api/tasks/{task.id}/reassignment-candidates")
    assert response.status_code == 200
    candidates = response.json()["candidates"]
    assert not any(c["staff_id"] == staff.id for c in candidates)
