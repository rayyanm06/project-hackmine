from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List
import shutil
import os
import datetime

from backend.database import get_db
from backend.models import Task, Assignment, Staff, User, TaskStatusHistory, AuditLog, CompletionProof, Notification
from backend.schemas.task import TaskResponse, TaskStatusUpdate

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).options(
        joinedload(Task.assignments).joinedload(Assignment.staff).joinedload(Staff.user),
        joinedload(Task.completion_proofs),
        joinedload(Task.status_history)
    ).all()
    
    for t in tasks:
        if t.status in ["assigned", "in_progress"]:
            result = process_task_attention(db, t)
            if result:
                t.sla_status = result.get("sla_status")
                t.minutes_remaining = result.get("minutes_remaining")
                t.minutes_overdue = result.get("minutes_overdue")
                t.minutes_inactive = result.get("minutes_inactive")
                t.reason = result.get("reason")
                
    return tasks

from backend.services.sla_service import process_task_attention

@router.get("/attention")
def get_tasks_attention(db: Session = Depends(get_db)):
    tasks = db.query(Task).options(
        joinedload(Task.assignments).joinedload(Assignment.staff).joinedload(Staff.user),
        joinedload(Task.status_history)
    ).filter(Task.status.in_(["assigned", "in_progress"])).all()
    
    attention_tasks = []
    for t in tasks:
        result = process_task_attention(db, t)
        if result and result["sla_status"] in ["at_risk", "overdue", "stalled"]:
            attention_tasks.append(result)
            
    return attention_tasks

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).options(
        joinedload(Task.assignments).joinedload(Assignment.staff).joinedload(Staff.user),
        joinedload(Task.completion_proofs),
        joinedload(Task.status_history)
    ).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.status in ["assigned", "in_progress"]:
        result = process_task_attention(db, task)
        if result:
            task.sla_status = result.get("sla_status")
            task.minutes_remaining = result.get("minutes_remaining")
            task.minutes_overdue = result.get("minutes_overdue")
            task.minutes_inactive = result.get("minutes_inactive")
            task.reason = result.get("reason")
            
    return task

VALID_TRANSITIONS = {
    "created": ["assigned"],
    "assigned": ["in_progress"],
    "in_progress": ["completed"],
    "completed": ["verified"],
    "verified": ["closed"]
}

@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(task_id: int, status_update: TaskStatusUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).options(
        joinedload(Task.assignments),
        joinedload(Task.completion_proofs),
        joinedload(Task.status_history)
    ).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    old_status = task.status.lower()
    new_status = status_update.status.lower()
    
    if new_status not in VALID_TRANSITIONS.get(old_status, []):
        raise HTTPException(status_code=400, detail=f"Invalid transition from {old_status} to {new_status}")
        
    if new_status == "in_progress" and not task.assignments:
        raise HTTPException(status_code=400, detail="Cannot start task without an assignment")
        
    if new_status == "verified" and not task.completion_proofs:
        raise HTTPException(status_code=400, detail="Cannot verify task without completion proof")
        
    # Valid transition
    task.status = new_status
    task.updated_at = datetime.datetime.utcnow()
    
    # Status History
    history = TaskStatusHistory(
        task_id=task.id,
        old_status=old_status,
        new_status=new_status,
        changed_by_id=None # Anonymous/Unauth for now
    )
    db.add(history)
    
    # Audit Log
    audit = AuditLog(
        action="TASK_STATUS_CHANGED",
        resource_type="Task",
        resource_id=task.id,
        details_json={"old_status": old_status, "new_status": new_status}
    )
    db.add(audit)
    
    # Guest Notification
    if task.complaint and task.complaint.guest_id:
        msg = None
        if new_status == "assigned":
            msg = "Your request has been accepted and assigned to our team."
        elif new_status == "in_progress":
            msg = "Your request is currently being worked on."
        elif new_status in ["completed", "verified"]:
            msg = "Your request has been completed."
            
        if msg:
            notif = Notification(
                guest_id=task.complaint.guest_id,
                message=msg,
                related_request_id=task.complaint_id
            )
            db.add(notif)
    
    db.commit()
    db.refresh(task)
    
    return get_task(task_id, db)

@router.post("/{task_id}/completion-proof", response_model=TaskResponse)
def upload_completion_proof(task_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.status.lower() != "in_progress":
        raise HTTPException(status_code=400, detail="Task must be in progress to upload proof")
        
    if not task.assignments:
        raise HTTPException(status_code=400, detail="Task must be assigned")
        
    # Local save
    os.makedirs("uploads/proofs", exist_ok=True)
    file_location = f"uploads/proofs/{task_id}_{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    proof = CompletionProof(
        task_id=task.id,
        photo_path=file_location,
        verified=False
    )
    db.add(proof)
    db.commit()
    
    return get_task(task_id, db)


# ── Reassignment endpoints ─────────────────────────────────────────────────

from pydantic import BaseModel as PydanticBase
from backend.services.reassignment_service import get_reassignment_candidates, perform_reassignment

class ReassignRequest(PydanticBase):
    new_staff_id: int
    reason: str = "Manager-initiated reassignment"

@router.get("/{task_id}/reassignment-candidates")
def get_candidates(task_id: int, db: Session = Depends(get_db)):
    """
    Return ranked eligible staff for reassignment, excluding the current assignee.
    Uses identical scoring weights/filters as initial assignment.
    """
    task = db.query(Task).options(
        joinedload(Task.assignments).joinedload(Assignment.staff).joinedload(Staff.user),
        joinedload(Task.required_skill),
        joinedload(Task.status_history),
    ).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    candidates, empty_reason = get_reassignment_candidates(task, db)

    return {
        "task_id": task_id,
        "current_assignee": task.assignments[-1].staff_name if task.assignments else None,
        "candidates": [
            {
                "staff_id": c.staff_id,
                "staff_name": c.staff_name,
                "department": c.department,
                "skills": c.skills,
                "score": c.score,
                "score_breakdown": c.score_breakdown,
                "reasoning": c.reasoning,
            }
            for c in candidates
        ],
        "empty_reason": empty_reason if not candidates else None,
    }


@router.post("/{task_id}/reassign")
def reassign_task(task_id: int, body: ReassignRequest, db: Session = Depends(get_db)):
    """
    Manager-initiated reassignment. Validates eligibility, creates a new
    Assignment row, resets SLA clock, and writes a TASK_REASSIGNED audit entry.
    """
    task = db.query(Task).options(
        joinedload(Task.assignments).joinedload(Assignment.staff).joinedload(Staff.user),
        joinedload(Task.required_skill),
        joinedload(Task.status_history),
    ).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status not in ["assigned", "in_progress"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reassign a task with status '{task.status}'. "
                   f"Only 'assigned' or 'in_progress' tasks can be reassigned."
        )

    try:
        perform_reassignment(task, body.new_staff_id, db, manager_reason=body.reason)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    db.commit()
    return get_task(task_id, db)

