# Smart Resort 360 — Product Requirements Document (4-Day Hackathon Scope)

**AI-Powered Resort Operations, Guest Experience & Revenue Intelligence Platform**

Version 2.0 · Hackathon MVP · September 2026

---

## 1. Executive Summary

Smart Resort 360 is a focused, single-screen platform that demonstrates how AI can close three critical operational gaps in resort management:

1. **Operations**: turning fragmented guest complaints into explainable, fair staff assignments with a complete audit trail.
2. **Guest Experience**: providing personalized room recommendations with transparent reasoning, plus an immersive 360° room preview.
3. **Revenue Intelligence**: surfacing competitive pricing insights via AI analysis of local market data.

This 4-day hackathon MVP proves the core complaint→assign→verify loop end-to-end, adds a guest-facing recommendation flow, and demonstrates AI-driven pricing analysis — all explainable, all auditable, all running in a single unified app. Simulated and seeded-data features are labeled honestly. Post-MVP features (full RBAC, multi-property, predictive maintenance, inventory optimization) are documented but deferred.

---

## 2. Problem Statement (Refined)

Indian resorts and hotels operate with fragmented, manual processes that miss critical opportunities:

- **Guest complaints are routed inefficiently**: a guest's AC breaks or food allergy issue is logged informally, routed via phone/email, assigned by manager guesswork rather than staff skill/availability, and there's no proof it was actually fixed.
- **Staff assignment is unfair and unplanned**: work is assigned reactively based on who's standing nearby, not on availability, skill, workload, or shift time — leading to burnout and guest dissatisfaction.
- **Room pricing is guesswork**: managers don't see what nearby competitors are charging in real time, so they leave money on the table during peak season or overbuild inventory during low demand.
- **Personalization is generic**: guests browsing rooms get the same list and descriptions, not curated suggestions based on their budget, dates, interests, and dietary needs.
- **There's no visibility across departments**: a manager can't see current task status, staffing gaps, or complaint backlogs without manually checking multiple systems or asking people.

The result: slower issue resolution, inefficient staffing, missed revenue, and a guest experience that doesn't feel personal.

---

## 3. Target Users (Hackathon Focus)

| Role | Description | What They See |
|---|---|---|
| **Manager** | Resort operations owner, makes tactical decisions. | Live task dashboard, AI recommendations (assignment, pricing), complaint status, staffing snapshot. |
| **Staff** | Housekeeping, kitchen, maintenance, front desk — executes tasks. | Task queue, ability to update status and upload proof (photo). |
| **Team Head** | Department supervisor, verifies completed work. | Team task status, ability to mark tasks verified. |
| **Guest** | Traveler browsing or staying at resort. | Personalized property recommendations with 360° room preview; ability to submit complaints/requests in natural language. |

**Note:** Full RBAC and multi-role portals are deferred; this MVP uses a **role-selector dropdown** so judges/reviewers can switch perspectives in a single app without re-login.

---

## 4. Product Goals

### 4.1 Core Objectives
- **Prove explainable AI in operations**: a complaint is classified by an LLM, a staff member is auto-assigned via hard-filtered scoring, the decision is auditable (anyone can see why they were chosen).
- **Demonstrate guest personalization at scale**: a guest describes their trip in natural language; the system returns curated, explained recommendations.
- **Show AI-powered revenue opportunity spotting**: analyze local competitor rates and suggest pricing adjustments with reasoning.
- **Prove fairness and transparency**: every automated decision (assignment, recommendation, pricing suggestion) includes its logic and evidence, not a black-box number.

### 4.2 Hackathon-Specific Principles
- **One feature depth > five features breadth**: the complaint→assign→verify loop is bulletproof; everything else is a secondary, independent flow.
- **Honest about what's simulated**: clearly label seeded occupancy data, competitor datasets, and any non-production AI limitations.
- **Demo-ready in 4 days**: no auth boilerplate, no infra complexity (no Kubernetes, Celery, Redis, S3). Single SQLite or in-memory database, single React app with a role switcher.
- **India-relevant**: multilingual complaint support (Hindi/Marathi/Tamil/Hinglish), regional food preferences (veg/Jain/regional), real Indian seasonal patterns.

---

## 5. Core Feature Set (MVP)

### 5.1 Operations: Complaint → Assignment → Verification

**Guest Complaint Intake**
- Guest (or staff on their behalf) submits a complaint in text (English, Hindi, Marathi, Tamil, or Hinglish supported).
- System stores complaint with room/guest context.

**AI Complaint Classification**
- LLM extracts: issue type (AC, plumbing, food, cleanliness, etc.), required department, priority (low/medium/high), location (room number, common area), required skill.
- Schema-validated; rejection of malformed output before any action taken.

**Automatic Staff Assignment**
- Hard filters applied first: staff must be available (not on leave, on shift), in the correct department, and holding the required skill.
- Weighted score computed for eligible staff:
  - **Skill match** (35%) — does their skill list include the required skill?
  - **Current workload** (25%) — how many open tasks do they have?
  - **Availability** (20%) — are they currently "Available" or "Busy"?
  - **Priority boost** (15%) — high-priority tasks get higher weight.
  - **Recency** (5%) — balance across staff by giving a tiny boost to those who haven't been assigned recently.
- Top-scored eligible staff member is auto-assigned; decision and score breakdown are persisted.

**Role-Based Notifications**
- Assigned staff: "New task: AC repair, Room 204, high priority. [View] [Update Status]"
- Team Head: "Your team has a high-priority task assigned to [Staff Name]. [View Team]"
- Manager (high priority only): "[Task summary]. Assigned to [Name]. [View Dashboard]"

**Task Lifecycle Tracking**
- Status states: **Created** → **Assigned** → **In Progress** → **Completed** → **Verified** → **Closed**.
- Every transition is timestamped and logged.

**Completion Proof**
- Staff uploads a photo (file input, stored locally for demo purposes).
- Photo URL/metadata stored with the task.
- Team Head or Manager can view photo and mark task **Verified**.

**Manager Dashboard — Operations View**
- **KPI tiles**: total open tasks, high-priority backlog, avg time-to-assign, avg time-to-complete.
- **Live task table**: all open and recent tasks with status, assigned staff, priority, created time.
- **AI recommendation card**: 1-2 suggested actions (e.g., "Staff member X is overloaded; consider reassignment").
- **Staffing snapshot**: which staff are available, busy, or on leave.

---

### 5.2 Guest Experience: Recommendation + 360° Preview

**Personalized Property Recommendation**
- Guest enters a natural-language prompt: *"I'm visiting with my family for 3 days in December, budget ₹3,000–5,000 per night, we're vegetarian, kids would love a pool"* (or simplified via a form: dates, budget, dietary, amenities).
- LLM converts NL to structured constraints (check-in, check-out, budget min/max, dietary tags, amenity list).
- System filters properties:
  - Available for those dates (no overlapping bookings).
  - Room types within budget.
  - Kitchen capable of guest's dietary needs.
  - Property has all requested amenities.
- Remaining properties are ranked by relevance (exact match > partial match > good-enough).
- Each recommendation includes: property name, room type, price, matched amenities, dietary capability, and **a human-readable explanation** ("This property matches your budget and has a vegetarian-certified kitchen; 4/5 of your requested amenities are available").

**360° Room Preview**
- When a guest clicks "View Room," they see an interactive **panoramic (equirectangular) image** of a sample room in that property.
- User can drag/look around the room (via Pannellum library or similar — no custom 3D modeling needed).
- Below the viewer: room details (size, bedding, amenities), a price breakdown, and a "Book Now" button (can be a mock/redirect for hackathon).

---

### 5.3 Revenue Intelligence: Competitive Pricing Analysis

**Competitor Rate Intelligence (AI-Powered)**
- System has seeded data of 5–8 nearby competitor properties with their current rates for the same room types.
- Manager views a pricing card: "Your Deluxe AC Room is ₹2,200/night; 3 comparable properties in your area are ₹2,800–3,100. **AI Recommendation:** consider a ₹600–900 increase during high-occupancy weeks (Dec–Jan, Diwali, weddings)."
- Recommendation includes:
  - Current rate and competitor average.
  - Suggested rate range.
  - Rationale (occupancy level, seasonality, market positioning).
  - **No automatic price change** — recommendation is advisory, needs human approval to implement.

**Occupancy + Seasonality Context**
- Displays current occupancy (%) and forecasted occupancy for upcoming weeks, based on seeded historical data.
- Labels clearly as "**Simulated forecast based on historical patterns**."
- Used to contextualize pricing recommendation ("High occupancy predicted Dec 15–22; consider raising rates").

---

### 5.4 Platform Foundations (Simplified for Hackathon)

**Explainability & Audit Trail**
- Every AI-touched decision (assignment, recommendation, pricing suggestion) is logged with:
  - What was decided (assigned staff, recommended property, suggested price).
  - Why (score breakdown, constraint matches, competitor data used).
  - Evidence (structured data inputs, LLM prompt version).
- An "Audit View" allows managers to inspect any past decision and understand its logic.

**Multilingual Support**
- Complaints can be submitted in English, Hindi, Marathi, Tamil, or Hinglish.
- LLM classification works across all languages transparently.
- UI labels are in English for MVP (can add language-switching later).

**India-Relevant Defaults**
- **Dietary categories**: Pure Vegetarian, Jain (no onion/garlic), No Beef, Regional Cuisine (South Indian, North Indian, Coastal).
- **Room types**: common in Indian resorts (AC Deluxe, Non-AC Standard, Family Suite, etc.).
- **Seasonality**: Diwali season, wedding season (Nov–Jan peak), monsoon lull, summer holidays, Kerala backwater season.
- **Guest names & property names**: realistic Indian resort examples (Goa beachfront, Munnar hill resort, Manali valley lodge, etc.).

---

## 6. MVP Scope (4-Day Build)

### In Scope

| Feature | MVP Behavior |
|---|---|
| Complaint submission + multilingual intake | Guest or staff submits text (supports EN, HI, MR, TA, Hinglish). Stored with room/guest context. |
| AI complaint classification | LLM extracts issue type, department, priority, location, required skill. Schema-validated JSON. |
| Staff assignment via hard-filtered weighted scoring | Only available, on-shift, skill-matched staff eligible. Weighted score persists with breakdown. |
| Task lifecycle tracking | Status transitions (Created → Assigned → In Progress → Completed → Verified → Closed) timestamped and logged. |
| Completion proof upload | Staff uploads photo; Team Head/Manager can verify visually. |
| Role-based notifications (mock) | Console/alert messages simulating notifications to staff, Team Head, Manager. |
| Staff availability toggle | Simple UI to mark self as Available/Busy/On Leave. |
| Manager 360 dashboard | KPI tiles, live task table, AI recommendation card, staffing snapshot. |
| Guest preference capture (form + NL) | Guest enters dates, budget, dietary, amenities via form or natural-language prompt. |
| Property filtering + ranking | Hard filters applied (availability, budget, dietary, amenities). Ranked by match quality. |
| Explained recommendations | Each property recommendation includes human-readable reasoning grounded in structured data. |
| 360° room panorama viewer | Interactive equirectangular room image; guest can drag/look around. |
| Competitor pricing intelligence | Seeded competitor rates. AI suggests pricing adjustments with reasoning. |
| Occupancy forecast (simulated) | Seeded historical data. Moving-average projection displayed with "Simulated" label. |
| Audit trail | Every AI decision logged with its reasoning and evidence. Queryable "Why was this assigned?" view. |

### Deferred Beyond MVP

- Full RBAC and multi-portal separation (separate frontends for each role).
- Real authentication (JWT, login flow) — using role-selector dropdown instead.
- Real-time WebSockets (polling is fine for demo scale).
- S3/object storage (files stored locally or in-memory).
- Background job queue (Celery/Redis) — synchronous LLM calls in request handler.
- Owner dashboard and strategic reporting.
- SLA timers, automatic escalation, manual reassignment.
- Predictive maintenance.
- Kitchen/meal demand forecasting and inventory optimization.
- Guest segmentation and sentiment analysis.
- Dynamic pricing algorithm (rule-based suggestions only).
- 3D facility preview (360° room preview is included; resort-wide 3D is deferred).
- Multi-property support.
- External PMS/POS/HR system integrations.

---

## 7. User Stories (Hackathon Focus)

### Manager
- *As a manager, I want to see all open tasks and which staff member is assigned to each, so I have visibility into operations without asking people.*
- *As a manager, I want to understand why a staff member was assigned (their score vs. others), so I can trust or override the AI's choice.*
- *As a manager, I want AI to suggest pricing adjustments based on local competition and occupancy, so I can act on revenue opportunities without guessing.*

### Staff
- *As a staff member, I want to see my task queue and update status as I work through tasks, so my manager knows where I am in the day.*
- *As a staff member, I want to upload a photo when I complete a task, so my work is verified fairly rather than assumed.*

### Team Head
- *As a team head, I want to see my team's open tasks and their current status, so I can help unblock them or verify completed work.*

### Guest
- *As a guest, I want to describe my trip in plain language (budget, dates, interests, dietary needs) and get curated property suggestions, so I get relevant recommendations, not a generic list.*
- *As a guest, I want to see why a property was recommended and preview the room in 360°, so I trust the suggestion and know what I'm booking.*
- *As a guest, I want to submit a complaint or service request in my language or dialect, so I can communicate my issue without friction.*

---

## 8. Success Metrics (Hackathon Judging Focus)

| Area | What Judges Look For |
|---|---|
| **AI Quality** | Complaint classification works across multiple languages and edge cases; reasoning for assignment and recommendations is transparent and defensible. |
| **Fairness & Transparency** | Assignment scores, recommendation reasoning, and pricing logic are all auditable and human-interpretable (no black-box outputs). |
| **End-to-End Demo** | Entire complaint→assign→verify flow works in live demo without breaking; data is persisted and queryable. |
| **India-Relevance** | Multilingual support, regional dietary categories, seasonal patterns, and realistic property/staff data make it feel grounded. |
| **Scope Discipline** | Team chose depth over breadth — one thing works perfectly rather than five things half-working. |

---

## 9. Assumptions

- A general-purpose LLM (Claude via API) is sufficient for complaint classification, NL→structured parsing, and explanation generation — no custom model training needed.
- Historical occupancy and competitor pricing data can be seeded/simulated for this MVP with clear labeling.
- A single in-memory or SQLite database is sufficient for 4-day demo scale (no need for production Postgres initially).
- Users access via a single web app with a role-selector dropdown; separate portals per role are not needed for this MVP.
- LLM output is schema-validated and human-checked before any critical decision (price change, staff reassignment) is applied.
- Judges care more about a demo that works flawlessly than about comprehensive documentation; 4-day focus is on live flow, not backend perfection.

---

## 10. Risks & Mitigations (Hackathon-Specific)

| Risk | Mitigation |
|---|---|
| LLM misclassifies complaint or invents false constraints (e.g., room has "pool" when it doesn't). | Schema-validate LLM output strictly; hard constraints (availability, budget, dietary capability) must match seeded data exactly before any action. |
| Live demo breaks due to integration issue between LLM classification and assignment. | Test the full loop (complaint input → classification → assignment) repeatedly on Day 2; do not move to UI polish until the spine is rock-solid. |
| Five features half-working is worse than two features fully working. | Prioritize complaint→verify loop ruthlessly; 360 viewer and pricing intelligence are secondary (can be disabled if time runs out and won't break core demo). |
| Judges assume seeded/simulated data is production-ready. | Explicitly label every simulated/demo-only feature in the UI ("Forecast: Simulated Based on Historical Patterns"). |
| Time runs out and no demo is demo-ready. | By end of Day 3, core loop must be fully working and rehearsed; Day 4 is hardening only, not new features. |

---

## 11. Acceptance Criteria (MVP)

### 11.1 Complaint → Assignment → Verification Flow
- [ ] Guest submits a complaint in English, Hindi, or Hinglish.
- [ ] System classifies it (issue type, department, priority, location, skill) with schema-valid output.
- [ ] Only staff who are available, on-shift, in correct department, and skill-matched are eligible for assignment.
- [ ] Assignment decision (staff name, score breakdown) is persisted and visible in an audit view.
- [ ] Assigned staff receives a notification and can update task status.
- [ ] Staff uploads a completion photo; Team Head can verify and mark task closed.
- [ ] Entire flow is queryable end-to-end (audit view shows all transitions and decisions).

### 11.2 Guest Recommendation Flow
- [ ] Guest enters preferences (natural language or form).
- [ ] System converts to structured constraints without inventing unsupported data.
- [ ] Properties are hard-filtered (budget, dates, dietary, amenities).
- [ ] Remaining properties are ranked and displayed with human-readable explanations.
- [ ] Explanations are grounded in structured data ("Your budget ₹4,500 fits this room at ₹4,200; we have veg-certified kitchen for your dietary needs").

### 11.3 360° Room Viewer
- [ ] Clicking "View Room" displays an interactive panoramic image.
- [ ] User can drag/look around the room without breaking or freezing.

### 11.4 Competitive Pricing Intelligence
- [ ] Manager dashboard shows current room rate, competitor rates, and AI-suggested adjustment.
- [ ] Suggestion includes reasoning (market data, occupancy, seasonality).

### 11.5 Manager Dashboard
- [ ] Reflects current task/staffing state within a few seconds (polling is acceptable).
- [ ] Every AI recommendation shown includes explanation and evidence.
- [ ] Dashboard doesn't crash or hang under normal clicking.

### 11.6 Platform Guardrails
- [ ] LLM output that doesn't match schema is rejected before persisting.
- [ ] Role-selector dropdown works (switching views doesn't corrupt data).
- [ ] All simulated/seeded features are labeled in the UI.

---

## 12. Out of Scope for This Hackathon

The following are documented as post-MVP features but will **not** be built:

- Separate role-based portals (using dropdown instead).
- Full authentication and RBAC middleware.
- Real-time WebSockets (polling acceptable).
- Background job queue (Celery/Redis).
- S3 / external object storage.
- Owner dashboard and strategic analytics.
- SLA timers and automatic escalation.
- Predictive maintenance.
- Inventory optimization.
- Guest segmentation and clustering.
- 3D facility preview (360° room viewer is included).
- Multi-property support.
- External system integrations (PMS, POS, HR, Accounting).

These are valuable features and will be included in the post-hackathon roadmap, but they are explicitly deferred to keep the 4-day scope tight.

---

## 13. Roadmap (Post-Hackathon)

**Phase 2 (1-2 weeks):** Real authentication, full RBAC, separate portals for each role, WebSocket real-time updates.

**Phase 3 (2-3 weeks):** SLA timers, automatic escalation, manual reassignment, guest resolution confirmation.

**Phase 4 (4+ weeks):** Owner dashboard, predictive maintenance, inventory optimization, multi-property support, PMS integrations.

---

**Document Owner:** Hackathon Team  
**Last Updated:** September 2026  
**Status:** Approved for 4-day MVP Build
