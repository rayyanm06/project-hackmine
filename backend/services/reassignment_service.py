"""
Reassignment Service -- Smart Resort 360
=========================================

Reuses existing assignment_service scoring (same weights, same hard filters)
for manager-initiated reassignment candidates.

Architecture findings (from code inspection):
- Task.assignments is a 1:N list; current assignee = assignments[-1]
- Reassignment creates a NEW Assignment row (preserving history)
- The SLA clock resets to the new Assignment.assigned_at
- last_recorded_sla_status is cleared so SLA audit dedup restarts cleanly
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from backend.models.assignment import Assignment
from backend.models.staff import Staff
from backend.models.task import Task
from backend.models.status_history import TaskStatusHistory
from backend.models.audit_log import AuditLog
from backend.services.assignment_service import (
    _is_on_shift,
    _active_assignment_count,
    _hours_since_last_assignment,
    _compute_score,
)


@dataclass
class ReassignmentCandidate:
    staff_id: int
    staff_name: str
    department: str
    skills: list
    score: float
    score_breakdown: dict
    reasoning: str


def get_reassignment_candidates(
    task: Task,
    db: Session,
    now_override: Optional[datetime.time] = None,
):
    now = now_override if now_override is not None else datetime.datetime.utcnow().time()

    current_staff_id = None
    if task.assignments:
        current_staff_id = task.assignments[-1].staff_id

    required_skill_name = None
    if task.required_skill:
        required_skill_name = task.required_skill.name

    priority = (task.priority or "Medium").capitalize()

    candidates = (
        db.query(Staff)
        .filter(Staff.department == task.department)
        .all()
    )

    eligible = []
    checked = 0

    for staff in candidates:
        if staff.id == current_staff_id:
            continue
        if not staff.available:
            checked += 1
            continue
        if not _is_on_shift(staff, now):
            checked += 1
            continue
        if required_skill_name:
            skill_names = [s.name for s in staff.skills]
            if required_skill_name not in skill_names:
                checked += 1
                continue

        active_count = _active_assignment_count(staff, db)
        hours_since = _hours_since_last_assignment(staff, db)
        score, breakdown = _compute_score(staff, active_count, hours_since, priority)

        name = staff.user.name if staff.user else f"Staff #{staff.id}"
        skill_names = [s.name for s in staff.skills]
        checked += 1

        reasoning = (
            f"{name} scored {score:.4f} — "
            f"Active tasks: {active_count}, "
            f"Hours since last assignment: {hours_since:.1f}h, "
            f"Skills: {', '.join(skill_names)}"
        )

        eligible.append(ReassignmentCandidate(
            staff_id=staff.id,
            staff_name=name,
            department=staff.department,
            skills=skill_names,
            score=score,
            score_breakdown=breakdown,
            reasoning=reasoning,
        ))

    eligible.sort(key=lambda c: (-c.score, c.score_breakdown.get("active_tasks", 0), c.staff_id))

    if not eligible:
        reason = (
            "No other eligible staff currently available for this task's "
            "department/skill/shift requirements."
        )
        if checked:
            reason += f" Checked {checked} candidate(s), all excluded."
        return [], reason

    return eligible, ""


def perform_reassignment(
    task: Task,
    new_staff_id: int,
    db: Session,
    manager_reason: str = "Manager-initiated reassignment",
    now_override: Optional[datetime.time] = None,
):
    now_time = now_override if now_override is not None else datetime.datetime.utcnow().time()

    old_staff_name = None
    old_sla_status = task.last_recorded_sla_status
    if task.assignments:
        old_assignment = task.assignments[-1]
        if old_assignment.staff and old_assignment.staff.user:
            old_staff_name = old_assignment.staff.user.name

    new_staff = db.query(Staff).filter(Staff.id == new_staff_id).first()
    if not new_staff:
        raise ValueError(f"Staff member with id={new_staff_id} not found.")

    if new_staff.department != task.department:
        raise ValueError(
            f"Staff member '{new_staff.user.name if new_staff.user else new_staff_id}' "
            f"is in department '{new_staff.department}', but task requires '{task.department}'."
        )

    if not new_staff.available:
        raise ValueError(
            f"Staff member '{new_staff.user.name if new_staff.user else new_staff_id}' "
            f"is not currently available."
        )

    if not _is_on_shift(new_staff, now_time):
        raise ValueError(
            f"Staff member '{new_staff.user.name if new_staff.user else new_staff_id}' "
            f"is not currently on shift."
        )

    required_skill_name = task.required_skill.name if task.required_skill else None
    if required_skill_name:
        skill_names = [s.name for s in new_staff.skills]
        if required_skill_name not in skill_names:
            raise ValueError(
                f"Staff member '{new_staff.user.name if new_staff.user else new_staff_id}' "
                f"does not have the required skill '{required_skill_name}'."
            )

    priority = (task.priority or "Medium").capitalize()
    active_count = _active_assignment_count(new_staff, db)
    hours_since = _hours_since_last_assignment(new_staff, db)
    new_score, new_breakdown = _compute_score(new_staff, active_count, hours_since, priority)

    new_staff_name = new_staff.user.name if new_staff.user else f"Staff #{new_staff_id}"

    now_dt = datetime.datetime.utcnow()
    new_assignment = Assignment(
        task_id=task.id,
        staff_id=new_staff_id,
        score=new_score,
        score_breakdown=new_breakdown,
        assigned_at=now_dt,
    )
    db.add(new_assignment)

    task.updated_at = now_dt
    task.last_recorded_sla_status = None

    history = TaskStatusHistory(
        task_id=task.id,
        old_status=f"assigned:{old_staff_name or 'unknown'}",
        new_status=f"assigned:{new_staff_name}",
        changed_by_id=None,
    )
    db.add(history)

    audit = AuditLog(
        action="TASK_REASSIGNED",
        resource_type="Task",
        resource_id=task.id,
        details_json={
            "task_id": task.id,
            "old_staff": old_staff_name,
            "new_staff": new_staff_name,
            "old_sla_status": old_sla_status,
            "reason": manager_reason,
            "new_assignment_score": new_score,
            "new_score_breakdown": new_breakdown,
            "source": "manager_action",
        },
    )
    db.add(audit)

    db.flush()
    return new_assignment
