from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List

from backend.database import get_db
from backend.models import Staff, Task, Assignment
from backend.schemas.staff import StaffResponse

router = APIRouter(prefix="/api/staff", tags=["staff"])


@router.get("", response_model=List[StaffResponse])
def get_staff(db: Session = Depends(get_db)):
    """Return all staff with live availability and active task count."""
    staff_list = db.query(Staff).options(
        joinedload(Staff.user),
        joinedload(Staff.skills),
    ).all()

    results = []
    for s in staff_list:
        # Active tasks: assigned to this staff member and not yet closed/verified
        active_task_count = (
            db.query(Task)
            .join(Assignment, Assignment.task_id == Task.id)
            .filter(
                Assignment.staff_id == s.id,
                Task.status.in_(["assigned", "in_progress", "completed"])
            )
            .count()
        )

        results.append(StaffResponse(
            id=s.id,
            name=s.user.name if s.user else "Unknown",
            department=s.department or "N/A",
            available=s.available,
            shift_start=s.shift_start,
            shift_end=s.shift_end,
            active_task_count=active_task_count,
            skills=[skill.name for skill in s.skills],
        ))

    return results
