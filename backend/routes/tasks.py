from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List
import shutil
import os
import datetime

from backend.database import get_db
from backend.models import Task, Assignment, Staff, User, TaskStatusHistory, AuditLog, CompletionProof
from backend.schemas.task import TaskResponse, TaskStatusUpdate

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).options(
        joinedload(Task.assignments).joinedload(Assignment.staff).joinedload(Staff.user),
        joinedload(Task.completion_proofs),
        joinedload(Task.status_history)
    ).all()

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).options(
        joinedload(Task.assignments).joinedload(Assignment.staff).joinedload(Staff.user),
        joinedload(Task.completion_proofs),
        joinedload(Task.status_history)
    ).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
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
