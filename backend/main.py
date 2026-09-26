import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import Complaint, Staff, Task, AuditLog
from schemas import (
    ComplaintCreate, ComplaintResponse,
    StaffResponse, StaffAvailabilityUpdate,
    TaskCreate, TaskStatusUpdate, TaskResponse,
    AuditLogResponse
)
from services.classifier import classify_complaint_text
from services.assignment import calculate_assignment
from seed import seed_database

# Create DB tables and seed initial data
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title="Smart Resort 360 API",
    description="AI-Powered Resort Operations, Guest Experience & Revenue Intelligence Platform",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "app": "Smart Resort 360 Backend",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

# --- Complaints Endpoints ---
@app.get("/api/complaints", response_model=List[ComplaintResponse])
def get_complaints(db: Session = Depends(get_db)):
    return db.query(Complaint).order_by(Complaint.created_at.desc()).all()

@app.post("/api/complaints", response_model=ComplaintResponse)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    complaint_id = f"CMP-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"
    
    # Run classification
    classification = classify_complaint_text(payload.text, payload.language or "English")

    complaint = Complaint(
        id=complaint_id,
        guest_name=payload.guest_name or "Guest",
        room_number=payload.room_number or "N/A",
        text=payload.text,
        language=payload.language or "English",
        category=classification["category"],
        subcategory=classification["subcategory"],
        priority=classification["priority"],
        status="open",
        sentiment=classification["sentiment"],
        confidence=classification["confidence"],
        explanation=classification["explanation"],
        created_at=datetime.now(timezone.utc)
    )
    db.add(complaint)

    # Auto-generate task and assign staff
    all_staff = db.query(Staff).all()
    assigned_staff, score = calculate_assignment(classification["required_skill"], classification["priority"], all_staff)

    task_id = f"TSK-{uuid.uuid4().hex[:4].upper()}"
    task = Task(
        id=task_id,
        complaint_id=complaint_id,
        title=f"{classification['subcategory']} in Room {payload.room_number or 'N/A'}",
        assigned_to=assigned_staff.name if assigned_staff else None,
        skill=classification["required_skill"],
        priority=classification["priority"],
        status="Assigned" if assigned_staff else "Created",
        sla_status="on_track",
        created_at=datetime.now(timezone.utc),
        due_at=datetime.now(timezone.utc) + timedelta(minutes=60),
        assignment_score=score if assigned_staff else None
    )
    if assigned_staff:
        complaint.assigned_to = assigned_staff.name
        complaint.status = "in_progress"
        assigned_staff.active_tasks = (assigned_staff.active_tasks or 0) + 1
        assigned_staff.current_workload = min(100, (assigned_staff.current_workload or 0) + 15)

    db.add(task)

    # Audit log
    audit = AuditLog(
        action="Complaint Intake & Auto-Assignment",
        user=payload.guest_name or "Guest",
        details=f"Complaint {complaint_id} logged. Classified as {classification['category']}/{classification['subcategory']} ({classification['priority']}). Auto-assigned to {assigned_staff.name if assigned_staff else 'Unassigned'} with score {score}."
    )
    db.add(audit)
    db.commit()
    db.refresh(complaint)
    return complaint

# --- Staff Endpoints ---
@app.get("/api/staff", response_model=List[StaffResponse])
def get_staff(db: Session = Depends(get_db)):
    return db.query(Staff).all()

@app.patch("/api/staff/{staff_id}/availability", response_model=StaffResponse)
def update_staff_availability(staff_id: str, payload: StaffAvailabilityUpdate, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    staff.availability = payload.availability
    db.commit()
    db.refresh(staff)
    return staff

# --- Tasks Endpoints ---
@app.get("/api/tasks", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).order_by(Task.created_at.desc()).all()

@app.patch("/api/tasks/{task_id}/status", response_model=TaskResponse)
def update_task_status(task_id: str, payload: TaskStatusUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = payload.status
    if payload.completion_notes:
        task.completion_notes = payload.completion_notes

    if payload.status == "Completed":
        # Free up staff workload
        if task.assigned_to:
            staff = db.query(Staff).filter(Staff.name == task.assigned_to).first()
            if staff:
                staff.active_tasks = max(0, (staff.active_tasks or 1) - 1)
                staff.completed_tasks = (staff.completed_tasks or 0) + 1
                staff.current_workload = max(0, (staff.current_workload or 15) - 15)

    audit = AuditLog(
        action=f"Task Status Changed to {payload.status}",
        user=task.assigned_to or "Staff",
        details=f"Task {task.id} updated to status '{payload.status}'. Notes: {payload.completion_notes or 'None'}"
    )
    db.add(audit)
    db.commit()
    db.refresh(task)
    return task

@app.post("/api/tasks/{task_id}/proof", response_model=TaskResponse)
def upload_proof(task_id: str, photo: UploadFile = File(...), notes: Optional[str] = Form(None), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.proof_photo = photo.filename
    task.status = "Completed"
    if notes:
        task.completion_notes = notes

    audit = AuditLog(
        action="Completion Proof Uploaded",
        user=task.assigned_to or "Staff",
        details=f"Photo proof '{photo.filename}' submitted for Task {task.id}. Status set to Completed."
    )
    db.add(audit)
    db.commit()
    db.refresh(task)
    return task

# --- Audit Logs Endpoint ---
@app.get("/api/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()

# --- Intelligence & Pricing Endpoint ---
@app.get("/api/pricing")
def get_pricing_intelligence():
    return {
        "current_revpar": 4200,
        "market_revpar": 3950,
        "occupancy_rate": 84.5,
        "recommendation": "Increase weekend Deluxe Suite pricing by 12% due to high festival demand.",
        "competitors": [
            {"name": "Seaside Haven Resort", "rate": 5400, "occupancy": 88},
            {"name": "Palm Grove Heritage", "rate": 4100, "occupancy": 76},
            {"name": "Whispering Pines Retreat", "rate": 6200, "occupancy": 91}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
