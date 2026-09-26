from backend.database import SessionLocal, engine, Base
from backend.models import User, Staff, Skill, Complaint, Competitor

def seed():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Avoid duplicating seeds if already present
    if not db.query(User).first():
        print("Seeding database (Users, Staff, Skills, Complaints)...")
        # Create Skills
        skill_names = ["AC Repair", "Plumbing", "Cleaning", "Cooking", "General"]
        skills = []
        for name in skill_names:
            s = Skill(name=name)
            db.add(s)
            skills.append(s)
        db.commit()
        # Refresh so skills have IDs
        for s in skills:
            db.refresh(s)

        # Basic non-staff users
        db.add(User(name="Admin Owner", role="Owner", email="owner@smartresort.com"))
        db.add(User(name="Demo Guest", role="Guest", email="guest@smartresort.com"))
        db.commit()

        # Staff Users — at least 4 Maintenance for scoring variety
        staff_profiles = [
            ("Alice Maint",   "Maintenance",  ["AC Repair", "General"]),
            ("Bob Maint",     "Maintenance",  ["Plumbing", "General"]),
            ("Charlie Maint", "Maintenance",  ["AC Repair", "Plumbing"]),
            ("Judy Maint",    "Maintenance",  ["AC Repair", "Plumbing", "General"]),
            ("Dave House",    "Housekeeping", ["Cleaning", "General"]),
            ("Eve House",     "Housekeeping", ["Cleaning"]),
            ("Frank Kitch",   "Kitchen",      ["Cooking"]),
            ("Grace Kitch",   "Kitchen",      ["Cooking", "General"]),
            ("Heidi Front",   "FrontDesk",    ["General"]),
            ("Ivan Front",    "FrontDesk",    ["General"]),
        ]

        skill_map = {s.name: s for s in skills}

        for i, (name, dept, s_names) in enumerate(staff_profiles):
            first = name.split()[0].lower()
            u = User(
                name=name,
                role="Staff",
                department=dept,
                email=f"{first}@smartresort.com",
            )
            db.add(u)
            db.commit()
            db.refresh(u)

            st = Staff(
                user_id=u.id,
                department=dept,
                shift_start="06:00" if i % 2 == 0 else "14:00",
                shift_end="14:00" if i % 2 == 0 else "22:00",
                available=True,
            )
            for sn in s_names:
                if sn in skill_map:
                    st.skills.append(skill_map[sn])
            db.add(st)
        db.commit()

        # 5 realistic sample complaints + 3 clustered AC complaints for anomaly detection
        complaints_data = [
            # Demo cluster for emerging operational pattern
            (101, "The AC is not cooling the room at all",   "en"),
            (102, "AC stopped cooling, room is very hot",    "en"),
            (105, "AC unit is blowing warm air",             "en"),
            
            # Other random complaints
            (205, "Bathroom plumbing issue, tap is leaking", "en"),
            (302, "Room needs cleaning immediately",          "en"),
            (401, "Food was cold and too spicy",              "en"),
            (505, "Loud noise from the adjacent room",        "en"),
        ]
        complaint_objs = []
        for room, text, lang in complaints_data:
            c = Complaint(guest_id=2, room_number=room, text=text, language=lang, status="submitted")
            db.add(c)
            complaint_objs.append(c)
        db.commit()
        for c in complaint_objs:
            db.refresh(c)

        import datetime
        from backend.models import Task, Assignment, AuditLog, TaskStatusHistory, CompletionProof
        # Seed 3 active tasks to populate the demo dashboard immediately
        tasks_data = [
            (complaint_objs[0], "AC Repair", "Maintenance", "high", "Room 101", "AC Repair", "Alice Maint", "in_progress"),
            (complaint_objs[3], "Plumbing", "Maintenance", "medium", "Room 205", "Plumbing", "Bob Maint", "assigned"),
            (complaint_objs[4], "Cleaning", "Housekeeping", "medium", "Room 302", "Cleaning", "Dave House", "completed")
        ]
        
        for c, issue, dept, prio, loc, req_skill, staff_name, status in tasks_data:
            skill = skill_map.get(req_skill)
            t = Task(
                complaint_id=c.id,
                issue_type=issue,
                department=dept,
                priority=prio,
                location=loc,
                required_skill_id=skill.id if skill else None,
                status=status
            )
            db.add(t)
            db.commit()
            db.refresh(t)

            # Mark complaint as classified
            c.status = "classified"
            db.commit()

            # Find staff
            staff_user = db.query(User).filter(User.name == staff_name).first()
            if staff_user and staff_user.staff_profile:
                st = staff_user.staff_profile
                a = Assignment(
                    task_id=t.id,
                    staff_id=st.id,
                    score=85.0,
                    score_breakdown={"skill": 35, "availability": 20, "workload": 30}
                )
                db.add(a)
                db.commit()

            # Audit Log for Classification
            db.add(AuditLog(
                resource_type="complaint",
                resource_id=c.id,
                action="classification",
                details_json={"issue_type": issue, "department": dept, "priority": prio}
            ))

            # Audit Log for Assignment
            db.add(AuditLog(
                resource_type="task",
                resource_id=t.id,
                action="assignment",
                details_json={"assigned_to": staff_name, "score": 85.0}
            ))
            
            # Status History
            db.add(TaskStatusHistory(task_id=t.id, old_status="created", new_status="assigned"))
            if status in ["in_progress", "completed"]:
                db.add(TaskStatusHistory(task_id=t.id, old_status="assigned", new_status="in_progress"))
            if status == "completed":
                db.add(TaskStatusHistory(task_id=t.id, old_status="in_progress", new_status="completed"))
                db.add(CompletionProof(task_id=t.id, photo_path="uploads/proofs/seeded_proof.png", verified=False))
                
        db.commit()

    # Seed Competitors if not present
    if not db.query(Competitor).first():
        print("Seeding competitor demo data...")
        competitors = [
            ("Goa Sands Resort", "AC Deluxe", 4500),
            ("Beach Paradise", "AC Deluxe", 5200),
            ("Oceanview Lodge", "AC Deluxe", 3800),
            ("Coastal Retreat", "AC Deluxe", 4200),
            ("Palm Oasis", "AC Deluxe", 4800),
        ]
        for name, room_type, rate in competitors:
            db.add(Competitor(name=name, room_type=room_type, rate=rate))
        db.commit()

    db.close()
    print("Seed complete.")

if __name__ == "__main__":
    seed()
