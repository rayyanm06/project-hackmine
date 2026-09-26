# Smart Resort 360 — 4-Day Hackathon Implementation Plan

**Vibe-Coding Sprint Guide with Hourly Breakdown, Priorities & Dependencies**

Version 1.0 · September 2026

---

## Executive Summary

This plan divides the 4-day build into **daily milestones** and **hourly tasks**, with ruthless prioritization: the complaint→assign→verify loop is bulletproof by end of Day 2; Days 3–4 add guest features and hardening. Each day ends with a runnable, demo-safe checkpoint.

**Ground rules for vibe-coding:**
- Use Claude to generate scaffolding, data seed scripts, and component shells.
- Skip production-grade infra: no Celery, no Redis, no S3, no real JWT. Single SQLite DB, inline LLM calls, file uploads to disk.
- No auth/login flow. Use a role-selector dropdown (Guest / Staff / Team Head / Manager).
- By end of Day 2, commit to what's been built; Days 3–4 only add features if core loop is rock-solid.

---

## Day 1: Scaffolding + Data Model + Core Complaint Flow

**Goal:** Database schema live, complaint submission works end-to-end (submit → store → display), LLM classification tested in isolation.

### 1.1 Setup & Backend Scaffold (9 AM–11 AM, ~2 hours)

**Tasks:**
- [ ] Init Python backend: FastAPI project with one `main.py`, basic folder structure (`models/`, `schemas/`, `routes/`, `services/`).
- [ ] Init React + Vite frontend: basic skeleton with Tailwind CSS, one `App.tsx`, role-selector dropdown at top.
- [ ] SQLite database: create `app.db` (local file).
- [ ] Backend `requirements.txt`: FastAPI, Pydantic, SQLAlchemy, LLM SDK (e.g., `anthropic`), Pillow (for images).
- [ ] Frontend dependencies: `npm install` (React, TypeScript, Tailwind, axios for API calls).
- [ ] Docker Compose (optional, but handy): one service for backend, serve frontend via Vite.

**Claude Vibe Task:**
```
"Generate a FastAPI scaffolding with:
- GET /health endpoint
- SQLAlchemy Base config
- Pydantic BaseModel for response serialization
- Basic folder structure
- One dummy route /api/complaints to test the plumbing
- Make it runnable with 'python main.py' on localhost:8000"
```

**Frontend:**
```
"Create a React app (Vite) with:
- Tailwind CSS configured
- A role dropdown at top (Guest, Staff, Team Head, Manager)
- A placeholder page that changes based on selected role
- A reusable Button, Card, Input component
- One main App.tsx that routes by role (for now, all point to same page)"
```

**Exit Criteria:** 
- Backend starts without errors; `GET /health` returns 200.
- Frontend builds and renders the role dropdown.
- You have a working local dev loop (edit code, see changes instantly).

---

### 1.2 Data Model: Complaints, Staff, Tasks, Assignments (11 AM–1 PM, ~2 hours)

**Tasks:**
- [ ] Create SQLAlchemy models:
  ```
  - Users (id, name, role: Enum[Guest, Staff, TeamHead, Manager, Owner], department, email)
  - Complaints (id, guest_id, room_number, text, language, status, created_at, updated_at)
  - Staff (id, user_id, department, shift_start, shift_end, available: Bool)
  - Skills (id, name — e.g., "AC Repair", "Plumbing")
  - StaffSkills (staff_id, skill_id)
  - Tasks (id, complaint_id, issue_type, department, priority, location, required_skill_id, status, created_at)
  - Assignments (id, task_id, staff_id, score: Float, score_breakdown: JSON, assigned_at)
  - TaskStatusHistory (id, task_id, old_status, new_status, timestamp, changed_by_id)
  - CompletionProofs (id, task_id, photo_path, verified: Bool, verified_by_id, verified_at)
  - Notifications (id, user_id, message, read: Bool, created_at)
  - AuditLog (id, action, user_id, resource_type, resource_id, details_json, created_at)
  ```
- [ ] Set up SQLAlchemy `Base` and session management; test that tables create on app startup.
- [ ] Create Pydantic schemas for request/response (ComplaintCreate, TaskResponse, AssignmentResponse, etc.).

**Claude Vibe Task:**
```
"Generate SQLAlchemy models for a resort ops system with:
- Complaints (complaint text, room, language, status)
- Staff (name, department, available, skills)
- Tasks (issue_type, priority, department, required_skill, status)
- Assignments (task, assigned_staff, weighted_score_breakdown as JSON)
- TaskStatusHistory (append-only log of status changes)
- CompletionProofs (task, photo_path, verified_by, verified_at)
Use created_at/updated_at on all tables. Provide the full file with imports."
```

**Seed Script:**
```python
# In a file like seed_data.py — Claude can generate this too
def seed_data(db_session):
    # 10 staff with names, departments, skills
    # 5–10 test complaints
    # 20–30 seeded properties (for recommendation feature)
    # Pre-create managers, team heads, guests
```

**Exit Criteria:**
- DB schema is live (tables created on app startup).
- Seed script runs without errors; test query like `SELECT * FROM Staff` returns 10 rows.
- Pydantic schemas validate sample data without errors.

---

### 1.3 Complaint Submission & Storage (1 PM–3 PM, ~2 hours)

**Backend:**
- [ ] Route `POST /api/complaints` — accepts JSON: `{ "guest_id", "room_number", "text", "language" }`.
- [ ] Validate input (room_number is numeric, text is non-empty, language is one of [en, hi, mr, ta, hinglish]).
- [ ] Create complaint row in DB; return complaint ID + timestamp.
- [ ] Route `GET /api/complaints` — returns all complaints (for testing dashboard).
- [ ] Route `GET /api/complaints/{id}` — returns single complaint with all details.

**Frontend:**
- [ ] When role is "Guest", show a complaint submission form:
  - Room number (input)
  - Language dropdown (EN / HI / MR / TA / Hinglish)
  - Complaint text (textarea)
  - Submit button
- [ ] On submit, call `POST /api/complaints`; show success message + complaint ID.
- [ ] Show a "Recent Complaints" list below (calling `GET /api/complaints`).

**Test:** 
- Submit a complaint via the frontend; confirm it appears in the list instantly.
- Check the database directly: `sqlite3 app.db "SELECT * FROM Complaints LIMIT 1;"`

**Exit Criteria:**
- Guest can submit a complaint in any language via the form.
- Complaint is persisted to DB and returned in the GET endpoint.
- Frontend + backend plumbing works without errors.

---

### 1.4 LLM Classification (Isolated Test, No Integration Yet) (3 PM–5 PM, ~2 hours)

**Backend:**
- [ ] Create a service `services/ai_gateway.py` with a function `classify_complaint(text: str, language: str) -> Dict`:
  ```python
  def classify_complaint(text, language):
      prompt = f"""
      Classify this resort complaint (in {language}):
      "{text}"
      
      Return ONLY valid JSON (no markdown, no extra text):
      {{
        "issue_type": "AC" | "Plumbing" | "Cleanliness" | "Food" | "Noise" | "Other",
        "department": "Housekeeping" | "Maintenance" | "Kitchen" | "FrontDesk" | "Other",
        "priority": "low" | "medium" | "high",
        "location": "room_<number>" or "common_area" (e.g., "room_205", "lobby"),
        "required_skill": "AC Repair" | "Plumbing" | "Cleaning" | "Cooking" | "General",
        "confidence": 0.0-1.0
      }}
      """
      
      response = call_llm(prompt)  # e.g., via anthropic.Anthropic().messages.create()
      
      # Validate JSON schema
      parsed = json.loads(response)
      assert parsed["issue_type"] in ["AC", "Plumbing", ...], "Invalid issue_type"
      assert 0 <= parsed["confidence"] <= 1, "Invalid confidence"
      
      return parsed
  ```
- [ ] Test function in isolation:
  ```python
  # In a test file or REPL:
  test_complaint = "The AC in room 205 is not working, it's very hot"
  result = classify_complaint(test_complaint, "en")
  print(result)
  # Expected: {"issue_type": "AC", "department": "Maintenance", "priority": "high", ...}
  ```
- [ ] Test edge cases:
  - Complaint in Hindi: "कमरे 301 में खाना खराब है" → should classify as Food/Kitchen.
  - Malformed LLM output (extra text, invalid JSON) → should raise clear error, not crash.

**Key:** do NOT integrate this into the workflow yet. Just test it returns valid JSON for various inputs.

**Exit Criteria:**
- `classify_complaint()` works for EN, HI, MR, TA inputs.
- LLM output is schema-validated (no crash on malformed JSON).
- You have 5+ test cases that pass.

---

### 1.5 End-of-Day 1 Checkpoint

**Checklist:**
- [ ] Backend running on `localhost:8000/health` → returns 200.
- [ ] Frontend renders, role dropdown works.
- [ ] SQLite schema is live, seeded with ~10 staff, ~5 test complaints.
- [ ] `POST /api/complaints` stores complaint; `GET /api/complaints` retrieves it.
- [ ] `classify_complaint()` works in isolation for multiple languages.
- [ ] Code is committed with a message like `"Day 1: Scaffold + Complaint intake + LLM classification isolated test"`.

**Commit & Push:**
```bash
git add .
git commit -m "Day 1: Core scaffolding, complaint model, LLM classification (isolated)"
git push
```

**Tonight:** Review Day 2 tasks; if anything in Day 1 is fragile, fix it early tomorrow. Do NOT move to integration yet.

---

## Day 2: Staff Assignment + Task Lifecycle + Basic Dashboard

**Goal:** Complete the complaint→assign→verify loop end-to-end. By EOD, a guest complaint is auto-assigned to the right staff member with a transparent score, staff can update status, and a manager can see the full workflow.

### 2.1 Staff Assignment Logic (9 AM–11 AM, ~2 hours)

**Backend:**
- [ ] Create `services/assignment_service.py` with `calculate_assignment_score(task: Task, staff: List[Staff]) -> Dict[Staff, float]`:
  ```python
  def calculate_assignment_score(task, eligible_staff):
      """
      For each eligible staff member, compute weighted score:
      - Skill match (35%): staff has required skill? (1.0 if yes, 0.0 if no)
      - Availability (20%): is staff "Available" right now? (1.0 if yes, 0.5 if Busy, 0.0 if Unavailable)
      - Current workload (25%): reverse-score by # of open tasks (fewer tasks = higher score)
      - Priority boost (15%): high priority gets 1.5x multiplier
      - Recency (5%): staff who haven't been assigned recently get slight boost
      
      Return: {staff_id: score, ...} sorted descending
      """
      scores = {}
      max_workload = max(len(s.open_tasks) for s in eligible_staff) or 1
      
      for staff in eligible_staff:
          skill_match = 1.0 if task.required_skill in staff.skills else 0.0
          availability = 1.0 if staff.available else 0.5
          workload_score = 1.0 - (len(staff.open_tasks) / max_workload)
          priority_mult = 1.5 if task.priority == "high" else 1.0
          recency_score = (days_since_last_assignment(staff) / 30)  # normalized to 30 days
          
          score = (
              skill_match * 0.35 +
              availability * 0.20 +
              workload_score * 0.25 +
              priority_mult * 0.15 +
              recency_score * 0.05
          )
          scores[staff.id] = score
      
      return dict(sorted(scores.items(), key=lambda x: x[1], reverse=True))
  ```
- [ ] Function `auto_assign_task(task_id: int) -> Assignment`:
  ```python
  def auto_assign_task(task_id):
      task = db.query(Task).get(task_id)
      
      # Hard filters
      eligible = [s for s in db.query(Staff).all()
                  if (s.department == task.department and
                      task.required_skill in s.skills and
                      s.available and
                      is_on_shift(s))]
      
      if not eligible:
          task.status = "unassigned"  # Log and escalate
          return None
      
      scores = calculate_assignment_score(task, eligible)
      best_staff_id, best_score = list(scores.items())[0]
      
      assignment = Assignment(
          task_id=task_id,
          staff_id=best_staff_id,
          score=best_score,
          score_breakdown={
              "skill_match": 0.35,
              "availability": 0.20,
              "workload": 0.25,
              "priority": 0.15,
              "recency": 0.05
          },
          assigned_at=datetime.now()
      )
      db.add(assignment)
      task.status = "assigned"
      db.commit()
      
      # Log to audit trail
      log_audit("task_assigned", user_id=None, resource_id=task_id, 
                details={"staff_id": best_staff_id, "score": best_score})
      
      return assignment
  ```

**Test:**
- Create a task with `required_skill="AC Repair"`, `department="Maintenance"`, `priority="high"`.
- Query Staff: 3 maintenance staff (one has AC Repair skill, is Available; two don't have the skill).
- Call `auto_assign_task(task.id)`.
- Verify: only the skilled one is eligible; they get assigned.

**Exit Criteria:**
- `calculate_assignment_score()` correctly weights all factors.
- Hard filters (skill, department, availability, shift) eliminate ineligible staff.
- Best-scored staff is selected and assigned.
- Score breakdown is stored as JSON for auditability.

---

### 2.2 Task Lifecycle + Status Transitions (11 AM–1 PM, ~2 hours)

**Backend:**
- [ ] Create routes:
  - `POST /api/tasks` — accepts complaint_id, creates task with status="created".
  - `PATCH /api/tasks/{task_id}/status` — accepts { "new_status": "in_progress" | "completed" | "verified" | "closed" }, validates transition, updates task, appends to TaskStatusHistory.
  - `GET /api/tasks` — returns all tasks (for manager dashboard).
  - `GET /api/tasks/{task_id}` — returns full task details + assignment + status history.

**Task Status Machine:**
```
Created → Assigned → In Progress → Completed → Verified → Closed

Allowed transitions:
- Created → Assigned (automatic, via auto_assign_task)
- Assigned → In Progress (staff updates)
- In Progress → Completed (staff updates)
- Completed → Verified (Team Head or Manager verifies)
- Verified → Closed (automatic or manual)
- Any → Escalated (future, deferred for now)
```

**Frontend (Manager View):**
- [ ] Show a table of all tasks:
  ```
  | Task ID | Issue | Assigned To | Priority | Status | Created | Actions |
  | T001    | AC    | John        | high     | Assigned | 2:30 PM | [View] [Reassign] |
  | T002    | Food  | Priya       | medium   | In Progress | 1:15 PM | [View] |
  ```
- [ ] Clicking [View] opens a detail panel showing:
  - Complaint text
  - Classification (issue_type, department, priority, required_skill)
  - Assignment details (assigned staff, score breakdown, reasoning)
  - Status history (Created at 2:30 PM, Assigned at 2:31 PM to John, ...)
- [ ] For Team Head/Manager role, show a "Verify" button on completed tasks.

**Frontend (Staff View):**
- [ ] Show my assigned tasks:
  ```
  | Task | Issue | Location | Status | Actions |
  | T001 | AC    | Room 205 | Assigned | [Mark In Progress] [View Details] |
  | T002 | Food  | Kitchen  | In Progress | [Mark Completed] [Upload Photo] |
  ```
- [ ] Clicking [Mark In Progress] calls `PATCH /api/tasks/{id}/status` with `{ new_status: "in_progress" }`.
- [ ] Clicking [Mark Completed] calls the same endpoint with `{ new_status: "completed" }`.

**Exit Criteria:**
- Task status transitions are enforced (can't skip from Created to Verified).
- Each transition is logged in TaskStatusHistory with timestamp and user.
- Manager can see full status history for any task.
- Staff can update their own task status.

---

### 2.3 Complaint → Classification → Assignment Flow (1 PM–3 PM, ~2 hours)

**Backend:**
- [ ] Create route `POST /api/classify-complaint` — accepts complaint_id, calls `classify_complaint()`, stores result in Task table, calls `auto_assign_task()`, returns assignment details.
  ```python
  @app.post("/api/classify-complaint")
  def classify_and_assign(complaint_id: int):
      complaint = db.query(Complaint).get(complaint_id)
      
      # Classify via LLM
      classification = classify_complaint(complaint.text, complaint.language)
      
      # Create task from classification
      task = Task(
          complaint_id=complaint_id,
          issue_type=classification["issue_type"],
          department=classification["department"],
          priority=classification["priority"],
          location=classification["location"],
          required_skill_id=get_skill_by_name(classification["required_skill"]).id,
          status="created"
      )
      db.add(task)
      db.commit()
      
      # Auto-assign
      assignment = auto_assign_task(task.id)
      
      # Notify staff (print for now, real notifications post-MVP)
      if assignment:
          print(f"[NOTIFY] Staff {assignment.staff_id}: Task {task.id} assigned to you.")
      
      return {
          "task_id": task.id,
          "status": task.status,
          "assignment": {
              "staff_id": assignment.staff_id if assignment else None,
              "score": assignment.score if assignment else None,
              "score_breakdown": assignment.score_breakdown if assignment else None
          }
      }
  ```

**Frontend Workflow (Guest submits, Manager sees full flow):**
1. Guest submits complaint via form → stored (Step 1.3).
2. Manager clicks [Classify] button on the complaint row in dashboard.
3. Backend calls `/api/classify-complaint` → LLM classifies → Task created → Staff assigned.
4. Dashboard updates: complaint now shows as "Assigned to John" with score breakdown visible.

**Test Script:**
```python
# Simulated manual test
1. Submit complaint: "AC in room 205 not working"
2. Call POST /api/classify-complaint
3. Verify: Task created with issue_type="AC", department="Maintenance"
4. Verify: Staff with "AC Repair" skill was assigned
5. Verify: Score breakdown shows in assignment JSON
```

**Exit Criteria:**
- A complaint can be classified by clicking a button.
- LLM correctly extracts issue type, department, priority, skill.
- Staff is auto-assigned based on hard filters + scoring.
- Manager can see the assignment and its reasoning.

---

### 2.4 Proof Upload + Verification (3 PM–5 PM, ~2 hours)

**Frontend (Staff View):**
- [ ] On a completed task, show an "Upload Photo" button.
- [ ] File input → stores photo locally (for now, as base64 in DB or as a local file).
- [ ] Route: `POST /api/tasks/{task_id}/proof` — multipart form with image file.

**Backend:**
- [ ] Route saves uploaded image:
  ```python
  @app.post("/api/tasks/{task_id}/proof")
  def upload_proof(task_id: int, file: UploadFile = File(...)):
      # For hackathon: save to local directory or base64-encode in DB
      content = file.file.read()
      photo_path = f"proof_photos/{task_id}_{file.filename}"
      with open(photo_path, "wb") as f:
          f.write(content)
      
      proof = CompletionProof(
          task_id=task_id,
          photo_path=photo_path
      )
      db.add(proof)
      db.commit()
      
      return { "proof_id": proof.id, "photo_path": photo_path }
  ```
- [ ] Frontend (Manager/Team Head): show task details with proof photo embedded (if it exists).
- [ ] "Verify" button on verified-ready tasks → `PATCH /api/tasks/{task_id}/status` with `{ new_status: "verified" }`.

**Exit Criteria:**
- Staff can upload a photo on completion.
- Photo is stored and retrievable.
- Manager can see the photo and verify the task.

---

### 2.5 Manager Dashboard v1 (Optional, light version for Day 2)

**Show:**
- Total open tasks.
- High-priority tasks.
- Recent assignments.
- Task status breakdown (pie chart or simple counts).

**Don't worry about:** real-time updates, complex charts, animation. Just static queries and simple rendering.

---

### 2.6 End-of-Day 2 Checkpoint

**Checklist:**
- [ ] Staff assignment logic works (hard filters + weighted scoring).
- [ ] Task lifecycle is enforced (status transitions validated).
- [ ] Complaint → Classification → Assignment flow works end-to-end.
- [ ] Staff can update task status; Team Head/Manager can verify.
- [ ] Proof photos can be uploaded and viewed.
- [ ] Manager dashboard shows open tasks and assignments.
- [ ] All data is audit-logged (TaskStatusHistory, AuditLog).
- [ ] No crashes or hanging UI.

**Commit:**
```bash
git add .
git commit -m "Day 2: Staff assignment + task lifecycle + proof upload (core loop done)"
git push
```

**Celebrate:** The spine of the app is complete. Everything else is additive.

---

## Day 3: Guest Features (Recommendation + 360 Viewer + Pricing) + Multilingual Polish

**Goal:** Add three guest-facing / revenue-facing features that don't touch the core loop. Independently demo-able. Make multilingual support shine.

### 3.1 Property Seeding + Guest Recommendation (9 AM–12 PM, ~3 hours)

**Seed Properties & Rooms:**
- [ ] Create 8–10 sample properties (Indian resort names: "Goa Beachfront Resort", "Munnar Hill Lodge", "Udaipur Palace", etc.).
- [ ] For each property:
  - Room types: AC Deluxe, Non-AC Standard, Family Suite, Budget Dorm.
  - Price range: ₹2,000–8,000 per night.
  - Amenities: WiFi, Pool, Gym, Restaurant, Spa, Parking, Kids Play Area.
  - Dietary capabilities: Pure Veg, Jain, No Beef, Regional Cuisine, International.
  - Seeded availability: pick 20 random dates as available, rest as booked.

**Claude Vibe Task:**
```
"Generate a seed script (Python) that creates:
- 10 Indian resort properties with realistic names, addresses (Goa, Manali, Kerala, etc.)
- Each has 3–5 room types with different prices
- Each has 5–8 amenities
- Each has 3–5 dietary capabilities
- Create 100 seeded booking records spanning 60 days
- Return a SQL script I can run to populate SQLite"
```

**Backend:**
- [ ] New tables: `Properties`, `RoomTypes`, `Amenities`, `PropertyAmenities`, `DietaryCapabilities`, `Bookings`, `GuestPreferences`.
- [ ] Route `POST /api/guests/preferences` — accepts guest_id, JSON with { dates: [start, end], budget_min, budget_max, dietary: [...], amenities: [...] }, stores in GuestPreferences.
- [ ] Route `POST /api/guests/recommend` — accepts guest_id (or preferences inline), returns ranked list of matching properties:
  ```python
  @app.post("/api/guests/recommend")
  def recommend_properties(preferences: PreferenceSchema):
      # 1. Hard filters: availability, budget, dietary, amenities
      matching = [p for p in db.query(Property).all()
                  if (is_available(p, preferences.dates) and
                      p.min_price <= preferences.budget <= p.max_price and
                      all(dietary in p.dietary_capabilities for dietary in preferences.dietary) and
                      all(amenity in p.amenities for amenity in preferences.amenities))]
      
      # 2. Rank by match quality (number of extra amenities, guest reviews, etc.)
      ranked = sorted(matching, key=lambda p: match_score(p, preferences), reverse=True)
      
      # 3. Explain each recommendation
      return [
          {
              "property_id": p.id,
              "name": p.name,
              "price": p.min_price,
              "dietary_match": p.dietary_capabilities,
              "amenities": p.amenities,
              "explanation": f"Matches your ₹{preferences.budget} budget, has {len([a for a in preferences.amenities if a in p.amenities])}/5 of your requested amenities, veg-certified kitchen."
          }
          for p in ranked[:5]  # Top 5
      ]
  ```

**Frontend (Guest View):**
- [ ] Preference form:
  - Check-in/check-out dates
  - Budget slider (₹1,500–10,000)
  - Dietary checkboxes (Veg, Jain, No Beef, etc.)
  - Amenity checkboxes (Pool, WiFi, Gym, Spa, etc.)
  - [Search] button
- [ ] On submit, call `POST /api/guests/recommend`.
- [ ] Display results as cards:
  ```
  ┌─────────────────────────┐
  │ Goa Beachfront Resort   │
  │ ₹4,200/night            │
  │ ★★★★☆ (4.3, 150 reviews)│
  │ Amenities: Pool ✓ WiFi ✓│
  │ Dietary: Veg ✓ Jain ✓   │
  │                         │
  │ Why recommended:        │
  │ Matches your ₹4,000–    │
  │ 5,000 budget; has all 4 │
  │ requested amenities;    │
  │ veg-certified kitchen.  │
  │                         │
  │ [View 360° Room] [Book]│
  └─────────────────────────┘
  ```

**Exit Criteria:**
- 8–10 properties are seeded with realistic data.
- Guest preferences are stored.
- Recommendation API returns top-5 ranked properties.
- Each recommendation includes human-readable explanation.
- Frontend displays results with all details and reasoning.

---

### 3.2 360° Room Viewer (12 PM–2 PM, ~2 hours)

**Asset Sourcing:**
- Find 3–5 free/royalty-free **equirectangular (360°) images** of hotel rooms or resorts (search: "free 360 hotel room image" or use stock sites like Unsplash, Pexels with 360° keyword).
- Save as `public/room_panorama_1.jpg`, etc.

**Frontend:**
- [ ] Install Pannellum.js: `npm install pannellum`
- [ ] Create a component `RoomViewer.tsx`:
  ```typescript
  import React, { useEffect } from 'react';
  import pannellum from 'pannellum';
  
  export function RoomViewer({ propertyId }: { propertyId: number }) {
      useEffect(() => {
          pannellum.viewer('panorama', {
              type: 'equirectangular',
              panorama: `/room_panorama_${propertyId}.jpg`,
              autoLoad: true,
              autoRotate: -2,
          });
      }, [propertyId]);
  
      return <div id="panorama" style={{ width: '100%', height: '500px' }} />;
  }
  ```
- [ ] On recommendation card, add a "[View 360° Room]" button that opens a modal with the viewer.

**Test:**
- Click [View 360° Room] → image loads in viewer.
- Drag mouse → room rotates / pans.
- No crashes.

**Exit Criteria:**
- Room panorama viewer loads and is interactive.
- Labeled clearly as "Room Preview (360°)".
- Doesn't break if image is missing (graceful fallback: "Photo not available").

---

### 3.3 Competitive Pricing Intelligence (2 PM–4 PM, ~2 hours)

**Seed Competitor Data:**
- [ ] Create a `CompetitorProperties` table with 5–8 fake nearby resorts and their room rates.
  ```
  | ID | Name                | Room Type    | Rate    | Last Updated |
  | 1  | Goa Sands Resort    | AC Deluxe    | ₹4,500  | Today        |
  | 2  | Beach Paradise      | AC Deluxe    | ₹5,200  | Today        |
  | 3  | Oceanview Lodge     | AC Deluxe    | ₹3,800  | Today        |
  ```

**Backend:**
- [ ] Route `GET /api/pricing/competitive-analysis` — for a given property and room type, returns:
  ```json
  {
    "property_name": "Your Resort",
    "room_type": "AC Deluxe",
    "your_rate": 3500,
    "competitors": [
      { "name": "Resort A", "rate": 4500 },
      { "name": "Resort B", "rate": 5200 },
      { "name": "Resort C", "rate": 3800 }
    ],
    "market_average": 4500,
    "recommendation": "Consider increasing your rate by ₹800–1,200 during high-occupancy weeks (Dec–Jan, Diwali). Your current rate of ₹3,500 is 20% below market average.",
    "confidence": 0.85
  }
  ```

**Frontend (Manager Dashboard):**
- [ ] Add a "Pricing Intelligence" card showing:
  ```
  ┌──────────────────────────────────┐
  │ 💰 Pricing Intelligence          │
  ├──────────────────────────────────┤
  │ AC Deluxe Room                   │
  │ Your Rate: ₹3,500/night          │
  │ Market Avg: ₹4,500/night         │
  │ Competitors: ₹3,800–₹5,200       │
  │                                  │
  │ 🤖 AI Recommendation:            │
  │ Consider a ₹800–1,200 increase   │
  │ during Dec–Jan peak season       │
  │ (occupancy forecast: 92%)        │
  │                                  │
  │ [Learn More] [Apply Suggested]  │
  └──────────────────────────────────┘
  ```

**Exit Criteria:**
- Competitor data is seeded.
- API returns competitive analysis with reasoning.
- Dashboard card displays recommendation.
- No financial data is auto-applied (recommendation only; human approval required).

---

### 3.4 Multilingual Complaint Support + UI Polish (4 PM–5 PM, ~1 hour)

**Backend:**
- [ ] Verify that `classify_complaint()` handles Hindi, Marathi, Tamil, Hinglish equally well.
- [ ] Test with real complaint examples:
  - EN: "The AC in room 205 is not working."
  - HI: "कमरे 205 का AC काम नहीं कर रहा है।"
  - MR: "खोली 205 चा AC काम करत नाही।"
  - TA: "அறை 205 இல் AC வேலை செய்யவில்லை।"
  - HG: "Room 205 ka AC kaam nahi kar raha bhai."

**Frontend:**
- [ ] Add language labels in complaint submission:
  ```
  [Guest Complaint Submission]
  Language: [EN ▼ | HI | MR | TA | HG]
  Complaint: [textarea]
  [Submit]
  ```
- [ ] Display incoming complaint with its language flag: "🇮🇳 Hindi | Room 205 AC issue"

**Test:** Submit a complaint in each language; verify classification is accurate for all.

**Exit Criteria:**
- Multilingual complaints are classified correctly.
- UI shows language of incoming complaints.
- No crashes on non-English input.

---

### 3.5 Occupancy Forecast (Seeded, Simulated) (Optional, if time)

- [ ] Seed 60 days of historical occupancy data (e.g., 60% baseline, +30% during Diwali, -20% during monsoon).
- [ ] Display as a simple line chart on Manager dashboard (using Chart.js or similar) with a large "**[SIMULATED] Forecast Based on Historical Patterns**" label.
- [ ] Do NOT try to build ML — just use moving averages (5-day rolling average) + seasonal adjustments.

**Exit Criteria:**
- Chart displays forecast with clear "Simulated" label.
- Doesn't break dashboard if clicked.

---

### 3.6 End-of-Day 3 Checkpoint

**Checklist:**
- [ ] Guest recommendation flow works end-to-end.
- [ ] 360° room viewer is interactive and working.
- [ ] Competitive pricing intelligence is displayed.
- [ ] Multilingual complaints are correctly classified.
- [ ] Manager dashboard shows all three new features.
- [ ] No crashes or hangs.
- [ ] All seeded data is realistic and India-relevant.

**Commit:**
```bash
git add .
git commit -m "Day 3: Guest recommendations + 360 viewer + pricing intelligence + multilingual (secondary features complete)"
git push
```

---

## Day 4: Testing, Demo Hardening, Rehearsal, Deployment

**Goal:** Fix the 3–5 things that break under demo conditions; rehearse the demo script; ensure judges have a smooth, memorable experience.

### 4.1 Bug Triage & Testing (9 AM–11 AM, ~2 hours)

**Tasks:**
- [ ] **Full regression test** — go through each flow as if you're a judge:
  1. Submit complaint in English, Hindi, Hinglish.
  2. Auto-classify and assign.
  3. View assignment reasoning (score breakdown).
  4. Mark task "In Progress", then "Completed".
  5. Upload a proof photo.
  6. Verify the task.
  7. As guest, search for properties (form + NL), see recommendations, view 360° room.
  8. View pricing intelligence card.
  9. Check manager dashboard — all data is current and correct.
  
- [ ] **Stress test** (light):
  - Submit 10 complaints rapidly.
  - Check that all are classified without errors.
  - Verify dashboard doesn't hang.

- [ ] **Edge cases:**
  - Submit a blank complaint (should reject).
  - Upload a 5MB photo (should handle or reject gracefully).
  - Classify a complaint in unsupported language (should fall back to English or error clearly).
  - Try to assign a task to a staff member who is on leave (should reject, try next eligible).

**Log bugs as GitHub issues:**
```
[CRITICAL] Photo upload returns 500 error with >2MB files
[HIGH] Dashboard freezes when loading >100 tasks
[MEDIUM] Spanish complaints aren't classified (not supported, should error clearly)
```

**Fix all CRITICAL and HIGH bugs** (use Claude to accelerate fixes).

---

### 4.2 Demo Script & Rehearsal (11 AM–2 PM, ~3 hours)

**Script (90 seconds):**
```
[OPENING]
"Hi, we're Smart Resort 360. We built an AI system that turns resort operations 
from fragmented chaos into explainable, fair, transparent workflow.

[OPERATIONS DEMO — 40 seconds]
1. Guest submits complaint (in Hindi): 'कमरे 205 का AC काम नहीं कर रहा है।'
   [Click Submit]
2. LLM classifies it instantly: Issue=AC, Dept=Maintenance, Priority=High, Skill=AC Repair.
   [Click "Auto-Assign"]
3. System shows: 'Assigned to Rajesh (score: 0.92)' 
   [Show score breakdown]
   - Skill match: 100% (has AC Repair skill)
   - Availability: 80% (currently Busy, but will help)
   - Workload: 85% (has 2 open tasks, less than John's 4)
   - Priority boost: 50% (high-priority case)
   [Explain: 'Judges can see exactly why Rajesh was picked. No black box.']

4. Rajesh marks task 'In Progress' → 'Completed' → uploads a photo.
   [Click through status updates]
5. Manager verifies the photo. Task closed.
   [Show audit trail: Created 2:30 PM → Assigned 2:31 PM → In Progress 2:35 PM → ...]

[GUEST EXPERIENCE DEMO — 30 seconds]
6. Guest searches: 'I'm coming with family, ₹3,000–4,500 budget, veg food, kids love pools.'
   [Click Search]
7. System returns 3 properties:
   - Munnar Hill Lodge (₹3,800/night, pool ✓, veg kitchen ✓, 4 of 5 amenities match)
   - Goa Sands Resort (₹4,200/night, pool ✓, veg kitchen ✓, all 5 amenities)
   [Explain: 'Each property shows why it was recommended, grounded in their data.']
8. Click [View 360° Room] — room viewer opens, can drag around.
   [Drag the panorama left/right/up/down]

[REVENUE DEMO — 20 seconds]
9. Manager views pricing card:
   'Your AC Deluxe is ₹3,500; competitors are ₹3,800–₹5,200. 
    Market average: ₹4,500. Occupancy forecast: 92% in Dec.
    AI Recommendation: Consider ₹800–1,200 increase.'
   [Explain: 'Data-driven, explainable suggestion. Manager approves or rejects.']

[CLOSING]
'Everything you saw — assignment, recommendations, pricing — is auditable. 
Judges can click [Audit] to see exactly why each decision was made. 
This is how you build AI trust in operations.'
```

**Rehearsal (timing is critical):**
- [ ] Time yourself: aim for 85–95 seconds. If you go over 2 minutes, cut something.
- [ ] Practice switching between roles (Guest → Staff → Manager) using the role dropdown.
- [ ] Rehearse 5+ times until you can do it without looking at notes.
- [ ] Record yourself and watch for stumbles, jargon that's unclear, or moments where the UI looks confusing.
- [ ] Have a teammate follow along and note any clicks that hang or take >2 seconds.

**Demo Backups:**
- [ ] Pre-seed a "golden" database state (one complaint already classified and assigned, one guest preference already searched, pricing card already loaded) in case live data entry breaks.
- [ ] Have a screenshot of each step ready in case the live demo crashes (judges can follow along visually).
- [ ] A written 2-page summary of the system (for judges who want to read while you demo).

---

### 4.3 UI Polish & Labeling (2 PM–3 PM, ~1 hour)

- [ ] Ensure **every** feature that's seeded/simulated has a clear label:
  - "**[SIMULATED] Occupancy Forecast Based on Historical Patterns**"
  - "**[DEMO DATA] Competitor Rates are Synthetic**"
  - "**[EXAMPLE] This is a seeded room 360° image**"
  
- [ ] Fix visual issues:
  - Alignment (buttons, text, inputs should be left-aligned or centered consistently).
  - Spacing (no overcrowded cards; use whitespace).
  - Colors (consistency across buttons, status indicators, priority colors).
  - Responsive (test on phone-sized browser window — doesn't need to work perfectly, but shouldn't be broken).

- [ ] Dark mode test (optional, but a nice-to-have):
  - Check that text is readable on both light and dark backgrounds.
  - If you don't have time, just ensure light mode works perfectly.

---

### 4.4 Final Checks & Deployment (3 PM–5 PM, ~2 hours)

**Deployment (local or cloud):**
- [ ] If building locally, ensure backend + frontend both start cleanly:
  ```bash
  # Terminal 1: Backend
  python main.py
  # Terminal 2: Frontend (from another terminal in the frontend/ folder)
  npm run dev
  ```
  Both should be reachable within 10 seconds of startup.

- [ ] If deploying to cloud (Vercel for frontend, Render/Railway for backend), test:
  - Frontend loads at `https://yourapp.vercel.app` (or similar).
  - Backend API is reachable at `https://yourapi.com/health` → returns 200.
  - All data persists (commit to DB, refresh page, data is still there).

**Demo Env Check:**
- [ ] Browser (Chrome or Firefox): fully updated, plugins disabled.
- [ ] No terminal windows visible (close before demo starts).
- [ ] No notifications, Slack pings, or calendar alerts during demo.
- [ ] WiFi is strong (test speed: `speedtest.net`, should be >10 Mbps).

**Submission Checklist (if hackathon requires):**
- [ ] GitHub repo is public and up-to-date.
- [ ] README.md explains how to run locally (clear 3–4 step instructions).
- [ ] A `DEMO.md` file with the 90-second demo script and "golden" data to use.
- [ ] A `.env.example` file (so judges can spin up locally if they want).

---

### 4.5 End-of-Day 4: Final Checkpoint

**Checklist:**
- [ ] Zero CRITICAL bugs.
- [ ] Demo script is rehearsed and timed (85–95 seconds).
- [ ] All simulated features are clearly labeled.
- [ ] Backend + frontend start cleanly.
- [ ] Full regression test passes (no crashes).
- [ ] GitHub repo is clean and documented.
- [ ] You've eaten, slept, and are not delirious.

**Commit & Final Push:**
```bash
git add .
git commit -m "Day 4: Bug fixes, demo hardening, rehearsal (ready for judging)"
git push
```

---

## Contingency: If Time Runs Out

**Priority 1 (Core Spine — must work):**
- Complaint submission + classification + auto-assignment + verification.
- Manager dashboard showing tasks + assignment reasoning.
- Staff can update task status + upload proof.

**Priority 2 (Show AI + Explainability):**
- Score breakdown visible for every assignment.
- Audit view showing why each decision was made.

**Priority 3 (Secondary Features — cut if running late):**
- 360° room viewer (can be disabled, won't break core demo).
- Pricing intelligence (can be a static mock card, won't affect workflow).
- Guest recommendation (can be deferred if you're 2 hours behind; focus on ops instead).

**If you're running 3+ hours behind by EOD Day 3:** 
Stop, commit your work, and spend Day 4 entirely on making what exists bulletproof. A flawless 60-second demo of one thing beats a broken 90-second demo of five things.

---

## Success Criteria (Day 4)

A winning hackathon demo:
1. ✅ **Works without crashing** — not a single broken click during the demo.
2. ✅ **Explainable** — judges understand exactly why each AI decision was made.
3. ✅ **India-relevant** — multilingual, regional dietary, seasonal patterns, realistic data.
4. ✅ **Honest** — simulated data is labeled; no pretense.
5. ✅ **Scope-disciplined** — one thing depth > five things breadth.
6. ✅ **Rehearsed** — the demo is smooth, confident, 90 seconds or less.
7. ✅ **Live** — no pre-recorded videos, judges watch you interact with the system in real-time.

---

## Post-Hackathon Roadmap

If you place well / get interest:

- **Week 1–2:** Gather judge feedback; refine UX based on their questions.
- **Week 3–4:** Add real auth (JWT + login), separate portals per role, WebSocket real-time.
- **Week 5–6:** Owner dashboard, SLA timers, manual reassignment.
- **Week 7+:** Predictive maintenance, inventory optimization, multi-property support.

---

**Document Owner:** Engineering Lead  
**Last Updated:** September 2026  
**Status:** Ready for Hackathon Sprint
