"""
Phase 2 Step 4 — Backend Test Script
=====================================
Tests the full operational flow:
  Test A: AC complaint        → Maintenance / AC Repair / assignment
  Test B: Housekeeping        → Housekeeping / Cleaning / assignment
  Test C: Plumbing            → Maintenance / Plumbing / assignment
  Test D: No eligible staff   → complaint stored, task created, assignment=null

Run from project root:
  .\\backend\\venv\\Scripts\\python backend\\test_step4.py
"""

import json
import sys
from backend.database import SessionLocal, engine, Base
from backend.models import Complaint, Task, Assignment, TaskStatusHistory, AuditLog, User, Staff, Skill
from backend.services.classification_service import classify_complaint
from backend.services.assignment_service import find_best_staff


def section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def dump(label: str, data):
    print(f"\n  [{label}]")
    if isinstance(data, dict):
        for k, v in data.items():
            print(f"    {k}: {v}")
    else:
        print(f"    {data}")


def test_classification_only():
    """Verify classifier outputs for known inputs without touching DB."""
    section("CLASSIFICATION UNIT TESTS (no DB)")
    tests = [
        ("The AC in my room is not working",      "Maintenance", "AC Repair"),
        ("My room is dirty and needs cleaning",   "Housekeeping", "Cleaning"),
        ("There is water leakage in the bathroom","Maintenance",  "Plumbing"),
        ("WiFi not working in room 305",          "FrontDesk",    "General"),
        ("Food was cold and tasteless",           "Kitchen",      "Cooking"),
    ]
    all_pass = True
    for text, expected_dept, expected_skill in tests:
        result = classify_complaint(text)
        dept_ok  = result.department    == expected_dept
        skill_ok = result.required_skill == expected_skill
        status   = "PASS" if (dept_ok and skill_ok) else "FAIL"
        if status == "FAIL":
            all_pass = False
        print(f"\n  {status} | \"{text[:55]}...\"" if len(text) > 55 else f"\n  {status} | \"{text}\"")
        print(f"       dept:  got={result.department:<15} expected={expected_dept}")
        print(f"       skill: got={result.required_skill:<15} expected={expected_skill}")
        print(f"       confidence={result.confidence}  source={result.source}")
    return all_pass


def run_complaint_flow(db, text: str, room: int, department_override=None, skill_override=None):
    """
    Run the full operational flow for a single complaint directly (no HTTP).
    Returns (complaint, classification, task, assignment_result).
    """
    from backend.models import Complaint, Task, Assignment, TaskStatusHistory, AuditLog, Skill
    from backend.services.classification_service import classify_complaint, ClassificationResult
    from backend.services.assignment_service import find_best_staff

    # 1. Create complaint
    c = Complaint(guest_id=2, room_number=room, text=text, language="en", status="submitted")
    db.add(c)
    db.commit()
    db.refresh(c)

    # 2. Classify
    clf = classify_complaint(text)
    if department_override:
        clf.department = department_override
    if skill_override:
        clf.required_skill = skill_override

    c.status = "classified"
    db.commit()

    # 3. Resolve skill
    skill_rec = db.query(Skill).filter(Skill.name == clf.required_skill).first()
    required_skill_id = skill_rec.id if skill_rec else None

    # 4. Create task
    task = Task(
        complaint_id=c.id,
        issue_type=clf.issue_type,
        department=clf.department,
        priority=clf.priority,
        location=clf.location or f"Room {room}",
        required_skill_id=required_skill_id,
        status="created",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    db.add(TaskStatusHistory(task_id=task.id, old_status=None, new_status="created"))
    db.commit()

    import datetime
    # 5. Assign
    # Force time to 10:00 AM to ensure staff in the 06:00-14:00 shift are selected
    now_override = datetime.time(10, 0)
    assignment_result = find_best_staff(clf, db, now_override=now_override)
    db_assignment = None

    if assignment_result:
        db_assignment = Assignment(
            task_id=task.id,
            staff_id=assignment_result.staff_id,
            score=assignment_result.score,
            score_breakdown=assignment_result.score_breakdown,
        )
        db.add(db_assignment)
        task.status = "assigned"
        db.commit()
        db.refresh(db_assignment)
        db.refresh(task)
        db.add(TaskStatusHistory(task_id=task.id, old_status="created", new_status="assigned"))

    # 6. Audit
    db.add(AuditLog(
        action="complaint_processed",
        user_id=2,
        resource_type="complaint",
        resource_id=c.id,
        details_json={
            "test": True,
            "task_id": task.id,
            "classification": {"issue_type": clf.issue_type, "dept": clf.department, "skill": clf.required_skill},
            "assigned_staff": assignment_result.staff_id if assignment_result else None,
        }
    ))
    db.commit()

    return c, clf, task, assignment_result, db_assignment


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # ── Unit test classification ────────────────────────────────────────────
    clf_pass = test_classification_only()

    # ── Test A: AC complaint ────────────────────────────────────────────────
    section("TEST A — AC Complaint")
    c, clf, task, ar, dba = run_complaint_flow(
        db,
        "The AC in my room is not working",
        room=999,
    )
    dump("Classification", {
        "issue_type": clf.issue_type,
        "department": clf.department,
        "priority": clf.priority,
        "required_skill": clf.required_skill,
        "confidence": clf.confidence,
        "source": clf.source,
    })
    dump("Task", {"id": task.id, "status": task.status, "department": task.department})
    if ar:
        dump("Assignment", {
            "staff_id": ar.staff_id,
            "staff_name": ar.staff_name,
            "score": ar.score,
            "breakdown": ar.score_breakdown,
        })
        print(f"  [RESULT] PASS — assigned to staff #{ar.staff_id} ({ar.staff_name})")
    else:
        print("  [RESULT] FAIL — no assignment made (unexpected)")

    # ── Test B: Housekeeping ────────────────────────────────────────────────
    section("TEST B — Housekeeping Complaint")
    c, clf, task, ar, dba = run_complaint_flow(
        db,
        "My room is dirty and needs cleaning",
        room=302,
    )
    dump("Classification", {"dept": clf.department, "skill": clf.required_skill, "source": clf.source})
    dump("Task", {"id": task.id, "status": task.status})
    if ar:
        dump("Assignment", {"staff_id": ar.staff_id, "staff_name": ar.staff_name, "score": ar.score})
        print(f"  [RESULT] PASS — assigned to staff #{ar.staff_id} ({ar.staff_name})")
    else:
        print("  [RESULT] FAIL — no assignment")

    # ── Test C: Plumbing ────────────────────────────────────────────────────
    section("TEST C — Plumbing Complaint")
    c, clf, task, ar, dba = run_complaint_flow(
        db,
        "There is water leakage in the bathroom",
        room=205,
    )
    dump("Classification", {"dept": clf.department, "skill": clf.required_skill, "source": clf.source})
    dump("Task", {"id": task.id, "status": task.status})
    if ar:
        dump("Assignment", {"staff_id": ar.staff_id, "staff_name": ar.staff_name, "score": ar.score})
        print(f"  [RESULT] PASS — assigned to staff #{ar.staff_id} ({ar.staff_name})")
    else:
        print("  [RESULT] FAIL — no assignment")

    # ── Test D: No eligible staff ────────────────────────────────────────────
    section("TEST D — No Eligible Staff")
    # Force department to "Surgery" (doesn't exist) — no staff will match
    c, clf, task, ar, dba = run_complaint_flow(
        db,
        "There is a rare issue that nobody can handle",
        room=101,
        department_override="NonExistentDept",
        skill_override="General",
    )
    dump("Complaint", {"id": c.id, "status": c.status})
    dump("Task", {"id": task.id, "status": task.status})
    if ar is None:
        print("  [RESULT] PASS — no assignment made (correctly unassigned)")
        print("  Task remains in 'created' state — safe for manual assignment.")
    else:
        print("  [RESULT] FAIL — unexpected assignment to ineligible staff!")

    # ── Database verification ────────────────────────────────────────────────
    section("DATABASE VERIFICATION")
    n_complaints    = db.query(Complaint).count()
    n_tasks         = db.query(Task).count()
    n_assignments   = db.query(Assignment).count()
    n_status_hist   = db.query(TaskStatusHistory).count()
    n_audit         = db.query(AuditLog).count()
    n_users         = db.query(User).count()
    n_staff         = db.query(Staff).count()
    n_skills        = db.query(Skill).count()

    print(f"""
  Users:               {n_users}
  Staff:               {n_staff}
  Skills:              {n_skills}
  Complaints:          {n_complaints}
  Tasks:               {n_tasks}
  Assignments:         {n_assignments}
  Status history rows: {n_status_hist}
  Audit log rows:      {n_audit}
    """)

    # Verify score_breakdown is persisted
    sample = db.query(Assignment).filter(Assignment.score != None).first()
    if sample:
        print(f"  Sample assignment score: {sample.score}")
        print(f"  Sample score_breakdown:  {json.dumps(sample.score_breakdown, indent=4)}")

    db.close()

    section("SUMMARY")
    print(f"  Classification unit tests: {'PASS' if clf_pass else 'FAIL'}")
    print("  Test A (AC):          see above")
    print("  Test B (Housekeeping): see above")
    print("  Test C (Plumbing):    see above")
    print("  Test D (No staff):    see above")


if __name__ == "__main__":
    main()
