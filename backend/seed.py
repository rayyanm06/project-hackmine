from datetime import datetime, timezone, timedelta
from database import SessionLocal, engine, Base
from models import Complaint, Staff, Task, AuditLog

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Seed Staff if empty
    if db.query(Staff).count() == 0:
        staff_data = [
            Staff(
                id="STF-001",
                name="Rahul Sharma",
                role="Maintenance",
                skills=["AC Repair", "Electrical", "General"],
                availability="busy",
                current_workload=75,
                active_tasks=1,
                completed_tasks=4,
            ),
            Staff(
                id="STF-002",
                name="Priya Nair",
                role="Housekeeping",
                skills=["Cleaning", "Room Service", "Inventory"],
                availability="available",
                current_workload=20,
                active_tasks=0,
                completed_tasks=6,
            ),
            Staff(
                id="STF-003",
                name="Arjun Patil",
                role="Maintenance",
                skills=["Plumbing", "Carpentry", "General"],
                availability="available",
                current_workload=40,
                active_tasks=1,
                completed_tasks=3,
            ),
            Staff(
                id="STF-004",
                name="Sneha Menon",
                role="Front Desk",
                skills=["Concierge", "Check-in", "Guest Relations"],
                availability="on_leave",
                current_workload=0,
                active_tasks=0,
                completed_tasks=12,
            ),
            Staff(
                id="STF-005",
                name="Vikram Singh",
                role="Security",
                skills=["Patrol", "First Aid"],
                availability="available",
                current_workload=10,
                active_tasks=0,
                completed_tasks=1,
            ),
        ]
        db.add_all(staff_data)
        db.commit()

    # Seed Complaints if empty
    if db.query(Complaint).count() == 0:
        now = datetime.now(timezone.utc)
        complaints_data = [
            Complaint(
                id="CMP-2023-001",
                guest_name="Arjun Kapoor",
                room_number="204",
                text="The AC in my room is not cooling properly and making a weird noise.",
                language="English",
                category="Maintenance",
                subcategory="AC",
                priority="high",
                status="in_progress",
                assigned_to="Rahul Sharma",
                sentiment="negative",
                confidence=0.98,
                explanation='Mentions "AC not cooling" and "weird noise", clear maintenance issue.',
                created_at=now - timedelta(minutes=30),
            ),
            Complaint(
                id="CMP-2023-002",
                guest_name="Priya Patel",
                room_number="112",
                text="pani tapak raha hai bathroom me",
                language="Hinglish",
                category="Maintenance",
                subcategory="Plumbing",
                priority="medium",
                status="open",
                assigned_to=None,
                sentiment="negative",
                confidence=0.95,
                explanation='Translates to "water is leaking in the bathroom".',
                created_at=now - timedelta(minutes=60),
            ),
            Complaint(
                id="CMP-2023-003",
                guest_name="Sneha Reddy",
                room_number="305",
                text="Need 2 extra towels please.",
                language="English",
                category="Housekeeping",
                subcategory="Amenities",
                priority="low",
                status="resolved",
                assigned_to="Priya Nair",
                sentiment="neutral",
                confidence=0.99,
                explanation="Standard housekeeping amenity request.",
                created_at=now - timedelta(hours=2),
            ),
        ]
        db.add_all(complaints_data)
        db.commit()

    # Seed Tasks if empty
    if db.query(Task).count() == 0:
        now = datetime.now(timezone.utc)
        tasks_data = [
            Task(
                id="TSK-1021",
                complaint_id="CMP-2023-001",
                title="Fix AC in Room 204",
                assigned_to="Rahul Sharma",
                skill="AC Repair",
                priority="high",
                status="In Progress",
                created_at=now - timedelta(minutes=25),
                due_at=now + timedelta(minutes=35),
                sla_status="on_track",
                assignment_score=92,
            ),
            Task(
                id="TSK-1022",
                complaint_id="CMP-2023-002",
                title="Fix plumbing leak in Room 112",
                assigned_to="Arjun Patil",
                skill="Plumbing",
                priority="medium",
                status="Assigned",
                created_at=now - timedelta(minutes=55),
                due_at=now + timedelta(minutes=65),
                sla_status="at_risk",
                assignment_score=85,
            ),
            Task(
                id="TSK-1023",
                complaint_id="CMP-2023-003",
                title="Deliver extra towels to Room 305",
                assigned_to="Priya Nair",
                skill="Housekeeping",
                priority="low",
                status="Completed",
                created_at=now - timedelta(minutes=115),
                due_at=now - timedelta(minutes=15),
                sla_status="on_track",
                completion_notes="Delivered 2 bath towels as requested.",
                assignment_score=98,
            ),
        ]
        db.add_all(tasks_data)
        db.commit()

    # Seed Audit Log if empty
    if db.query(AuditLog).count() == 0:
        audit_data = [
            AuditLog(
                action="System Initialized",
                user="System",
                details="Smart Resort 360 database tables initialized and seeded with baseline operations data."
            ),
            AuditLog(
                action="Task Auto-Assigned",
                user="AI Engine",
                details="Task TSK-1021 assigned to Rahul Sharma with confidence score 92%."
            )
        ]
        db.add_all(audit_data)
        db.commit()

    db.close()

if __name__ == "__main__":
    seed_database()
    print("Database seeded successfully.")
