"""
Phase 2 Step 6 — Backend Lifecycle Test Script
"""

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import Task, Assignment, TaskStatusHistory, AuditLog, CompletionProof
import io
import json

client = TestClient(app)

def section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def main():
    db = SessionLocal()
    
    # Let's find an assigned task
    task = db.query(Task).filter(Task.status == "assigned").first()
    
    if not task:
        print("No assigned task found to run tests. Exiting.")
        return

    task_id = task.id
    print(f"Using Task ID {task_id} (assigned to {task.assignments[0].staff.user.name})")
    
    # 10. Test invalid transition: Created -> Closed (Wait, our task is assigned. Let's find a created one)
    created_task = db.query(Task).filter(Task.status == "created").first()
    if created_task:
        res = client.patch(f"/api/tasks/{created_task.id}/status", json={"status": "closed"})
        assert res.status_code == 400
        print("PASS — invalid transition Created -> Closed correctly rejected.")
        
        # 11. Test unassigned task attempting to go to In Progress
        # Force a created task (no assignment) to be assigned manually (bypassing logic) just to test it
        created_task.status = "assigned"
        db.commit()
        res = client.patch(f"/api/tasks/{created_task.id}/status", json={"status": "in_progress"})
        assert res.status_code == 400
        print("PASS — Unassigned task attempting In Progress correctly rejected.")
        
        created_task.status = "created"
        db.commit()

    # 2. Move Assigned -> In Progress
    res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "in_progress"})
    assert res.status_code == 200
    assert res.json()["status"] == "in_progress"
    print("PASS — Assigned -> In Progress")

    # 3. Attempt In Progress -> Closed
    res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "closed"})
    assert res.status_code == 400
    print("PASS — In Progress -> Closed correctly rejected.")

    # 4. Complete task with completion proof
    file_content = b"fake photo data"
    files = {"file": ("proof.jpg", file_content, "image/jpeg")}
    res = client.post(f"/api/tasks/{task_id}/completion-proof", files=files)
    assert res.status_code == 200
    proofs = res.json()["completion_proofs"]
    assert len(proofs) > 0
    print("PASS — Completion proof uploaded successfully.")

    # Complete task
    res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "completed"})
    assert res.status_code == 200
    assert res.json()["status"] == "completed"
    print("PASS — In Progress -> Completed")

    # 5. Move Completed -> Verified
    res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "verified"})
    assert res.status_code == 200
    assert res.json()["status"] == "verified"
    print("PASS — Completed -> Verified")

    # 6. Move Verified -> Closed
    res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "closed"})
    assert res.status_code == 200
    assert res.json()["status"] == "closed"
    print("PASS — Verified -> Closed")

    # 7 & 8 Verify histories
    histories = db.query(TaskStatusHistory).filter(TaskStatusHistory.task_id == task_id).all()
    # It started as created, went to assigned, in_progress, completed, verified, closed
    # Should have at least the ones we just did
    transitions = [(h.old_status, h.new_status) for h in histories]
    print(f"Transitions recorded: {transitions}")
    assert ("assigned", "in_progress") in transitions
    assert ("in_progress", "completed") in transitions
    assert ("completed", "verified") in transitions
    assert ("verified", "closed") in transitions
    print("PASS — Status history verified.")

    logs = db.query(AuditLog).filter(
        AuditLog.resource_id == task_id,
        AuditLog.action == "TASK_STATUS_CHANGED"
    ).all()
    assert len(logs) >= 4
    print("PASS — Audit log verified.")
    
    proof = db.query(CompletionProof).filter(CompletionProof.task_id == task_id).first()
    assert proof is not None
    assert proof.photo_path.startswith("uploads/proofs/")
    print("PASS — Completion proof is associated with correct task.")
    
    print("\nALL LIFECYCLE TESTS PASSED.")

if __name__ == "__main__":
    main()
