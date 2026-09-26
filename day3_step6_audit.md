# Day 3 Step 6 — Feature Audit

## 1. Current Project State

### Frontend Routes (all present)
| Route | Status |
|---|---|
| `/` — Dashboard | **Fully hardcoded**. Static KPI tiles, static task table, static AI assignment insight, static pricing/staffing widgets. No API calls. |
| `/resort-360` — Manager Resort 360 | **Fully live**. Calls `/api/stats`, `/api/staff`, `/api/rooms`, `/api/tasks`, `/api/intelligence/next-action`, `/api/intelligence/systemic-issues`. Day 3 Step 1–3. |
| `/complaints` | **Fully live**. Day 2 operational spine. |
| `/tasks` | **Fully live**. Task lifecycle with status transitions. |
| `/staff` | **Fully live**. |
| `/verification` | **Fully live**. Proof upload + manager verification. |
| `/pricing` | **Fully live** (advisory). Day 3 Step 4. |
| `/recommendations` | **Fully live**. Day 3 Step 5. |
| `/insights` | **Fully hardcoded** static mockup with simulated metrics, hardcoded percentages, hardcoded text. |
| `/audit` | **Fully hardcoded** static mockup with two fixed fake audit entries. |
| `/rooms-360` | **Static placeholder**. Pannellum placeholder, no real 360 viewer. Uses `mockRooms` data. |
| `/settings` | **Placeholder**. |

### Backend Services (live)
- `GET /api/stats` — Live task/complaint aggregates
- `GET /api/staff` — Live staff data
- `GET /api/rooms` — Live room data
- `GET /api/tasks` — Live task data with assignments
- `POST /api/complaints` — AI classification + assignment + task creation
- `GET /api/intelligence/next-action` — Live AI/rule-based recommendation + AuditLog
- `GET /api/intelligence/systemic-issues` — Live complaint pattern detection
- `GET /api/pricing/competitive-analysis` — Live hybrid pricing intelligence
- `POST /api/recommendations/room-match` — Live room matchmaker

### Backend Models with live audit logging
- `AuditLog` — written by: `complaints.py` (on classification), `tasks.py` (on status change), `intelligence.py` (on next-action generation). **Never read back to the frontend.**

---

## 2. Requirements Coverage

### Completed
- AI complaint classification (LLM → structured JSON → Pydantic validation)
- Skill/availability/workload-aware staff assignment with weighted scoring
- Task lifecycle: created → assigned → in_progress → completed → verified → closed
- Completion proof upload (photo)
- Manager verification step
- Manager Resort 360 live dashboard
- Next Best Action (AI + deterministic)
- Emerging Operational Patterns (complaint anomaly detection)
- Advisory Pricing Intelligence (competitor benchmarking + AI explanation)
- Conversational Room Matchmaker (NL → live inventory → grounded AI explanation)

### Partially Completed
- **Audit Trail** — `AuditLog` model is populated by: complaint classification, task status changes, and next-action generation. However the `/audit` frontend page is a completely hardcoded static mockup. **The live audit data is never surfaced to the manager.**
- **Dashboard** — exists but is entirely static. A `GET /api/stats` endpoint exists with live counts. The KPI tiles on the dashboard show fixed numbers.
- **Insights** — page exists but all content is simulated/hardcoded (sentiment score 4.2, SLA breach 12%, etc.). No connection to any live intelligence.

### Not Implemented
- Multilingual support
- External booking/PMS integration
- Real 360° panorama viewer
- Guest profiles / stay history
- Real-time notifications (WebSockets)
- Payment systems
- Live competitor data scraping

---

## 3. Demo Spine Review

### Operational Flow
`Complaint → AI Classification → Assignment → Task → Completion Proof → Verification → Closure`

**Status: COMPLETE and LIVE.** Every step works with real data. The only gap is the **Audit Trail page shows fake data**, even though every step in this flow writes to the `audit_logs` table.

### Manager Intelligence Flow
`Resort 360 → Next Best Action → Emerging Operational Patterns → Pricing Intelligence`

**Status: COMPLETE.** All panels pull live data. Resort 360 is the cohesive intelligence hub.

### Guest Flow
`Natural-language request → Deterministic inventory matching → Grounded AI explanation`

**Status: COMPLETE.** Room Matchmaker is live and queries the actual DB.

### The Missing Link
When a demo evaluator asks "How does the system ensure accountability for AI decisions?" — the answer exists in the database (`audit_logs`) but the Audit Trail page only shows hardcoded fake entries. This is a **credibility gap** for the hackathon: the system has real transparency infrastructure that is completely invisible.

---

## 4. Dashboard Review

The Dashboard (`/`) is **100% hardcoded**:
- "12 Open Tasks" — static
- "3 High Priority" — static
- "1.2m Avg Time to Assign" — static
- Task table — 3 hardcoded rows (TSK-1021, TSK-1022, TSK-1023)
- AI Assignment Insight — static numbers (92/100, 35/35, etc.)
- Pricing Intelligence widget — static competitor names and rates
- Staffing Snapshot — static counts

A `GET /api/stats` endpoint exists returning live task/complaint counts. Connecting KPI tiles would be mechanical and quick.

**Assessment**: Converting the dashboard to live data would be genuinely useful but would **duplicate functionality already visible in Resort 360**. The risk of confusing evaluators with two similar dashboards showing different data is real. The dashboard is better left as-is unless it can serve a clearly differentiated purpose (e.g., a compact "landing" view vs. the full operational intelligence in Resort 360).

---

## 5. Insights Review

The Insights page (`/insights`) is **100% hardcoded simulation**:
- "SLA Breach Risk 12%" — fake
- "Workload Imbalance: Moderate" — fake
- "AI Staffing Recommendation: 2 additional housekeeping staff" — fake
- "Sentiment Score: 4.2/5" — fake
- "Emerging Complaint Trend: AC Cooling Issues in North Wing" — **duplicates** the Emerging Operational Patterns panel already live in Resort 360
- "Forecasted Occupancy: 88%" — fake
- "Pricing Opportunity" — **duplicates** the Pricing Intelligence page

**Assessment**: The Insights page is largely redundant now that Resort 360, Pricing, and Emerging Patterns are live. It should not be connected to live data because it would mostly duplicate existing features. It could be relabeled or redirected, but no live connection should be built here.

---

## 6. Remaining Gaps

| Gap | Impact | Feasibility |
|---|---|---|
| **Audit Trail page shows fake data** (real data in DB) | High — breaks hackathon credibility on transparency | Very High — only needs a new backend GET endpoint + frontend update |
| Dashboard KPI tiles are static | Medium — confusing vs Resort 360 | High — /api/stats exists |
| Insights page is fully simulated | Low — largely duplicates Resort 360 | Medium — mostly redundant |
| 360° Rooms viewer placeholder | Low — decorative feature | Low — no assets, library not installed |
| Settings page placeholder | None | Out of scope |
| No notification system | Low for hackathon | Very Low — needs WebSockets |

---

## 7. Candidate Features

### Candidate 1 — Live Audit Trail

**Feature**: Connect the `/audit` page to the actual `audit_logs` database table via a new `GET /api/audit` endpoint.

**Existing support**:
- `AuditLog` model fully defined
- Populated on: complaint classification, task status changes, next-action generation
- `/audit` page already exists in sidebar with correct icon/route
- A `GET /api/audit` endpoint does not yet exist

**New backend work**:
- One new route: `GET /api/audit?limit=50` returning paginated `AuditLog` records
- One new schema: `AuditLogResponse`

**New frontend work**:
- Replace static mockup in `_layout.audit.tsx` with API-backed list
- Add type + API method in `api.ts`
- Minimal: same card structure, just data-driven

**Demo value**: Very high. When evaluators ask "how does the system ensure AI accountability?", the manager can click Audit Trail and see the exact LLM classification output, the assignment score, and the task transition log — all real events. This is a **transparency and explainability** story that hackathon judges specifically look for in AI systems.

**Risk**: Very low. Read-only endpoint, no new models, no new DB writes.

**Estimated complexity**: Small. 1–2 hours end-to-end.

**Strengthens spine**: Directly. It closes the last gap in the operational flow story.

---

### Candidate 2 — Live Dashboard KPI Tiles

**Feature**: Connect the 4 KPI tiles on the Dashboard to the existing `/api/stats` endpoint.

**Existing support**: `GET /api/stats` already exists and returns live task/complaint counts.

**New backend work**: None. Endpoint already exists.

**New frontend work**: Replace 4 hardcoded number tiles with API-fetched values. Replace the 3-row fake task table with a live filtered view from `/api/tasks`.

**Demo value**: Medium. The improvement would be noticed only if the evaluator has already created complaints/tasks. Given Resort 360 already shows the same live data in a richer format, the marginal value is low.

**Risk**: Low, but creates potential confusion — Dashboard and Resort 360 would show overlapping live data. Evaluators may wonder why two dashboards exist.

**Estimated complexity**: Small. 30–60 minutes.

**Strengthens spine**: Weakly. Doesn't add a new capability; just fixes a cosmetic inconsistency.

---

### Candidate 3 — Partial Insights Live Connection (Complaint Trend only)

**Feature**: Connect only the "Emerging Complaint Trend" section of Insights to the live `/api/intelligence/systemic-issues` endpoint, replacing the hardcoded text.

**Existing support**: The endpoint already exists and is live.

**New backend work**: None.

**New frontend work**: Replace one hardcoded card in Insights with a fetched result.

**Demo value**: Very low. This already exists and is displayed better in Resort 360. Would create duplication.

**Risk**: Medium — might confuse evaluators seeing two different complaint-trend displays with subtly different wording.

**Estimated complexity**: Trivial.

**Strengthens spine**: Doesn't strengthen it — duplicates existing Resort 360 functionality.

---

## 8. Scope Protection

The following are explicitly rejected for Day 3 Step 6:

- **WebSockets / real-time push** — overkill; polling in Resort 360 already works
- **Redis / Celery** — not needed for hackathon scale
- **Full RBAC/authentication** — `User` model exists but auth not required for demo
- **External competitor scraping** — against demo philosophy; seeded data already works
- **New 360° panorama viewer** — no assets, Pannellum not installed; high effort, low judging value
- **Payment/booking integration** — completely out of scope
- **Complex ML recommendation models** — deterministic + LLM already sufficient
- **Major database redesign** — all needed models exist
- **Connecting Insights to multiple live endpoints** — would duplicate Resort 360
- **New infrastructure / deployment setup** — not a hackathon requirement

---

## 9. Recommended Step 6 Scope

**Live Audit Trail**

Connect the existing `/audit` page to the actual `audit_logs` database table.

This is the single highest-value remaining feature because:
1. It closes a **credibility gap** — the audit infrastructure exists but is invisible
2. It directly supports the hackathon's **transparency/explainability** judging criterion
3. It requires **zero new models**, **zero new DB writes**, and **zero redesign**
4. It takes the existing Shadcn card structure in `_layout.audit.tsx` and simply drives it with real data
5. It provides a complete answer to the question: "How do you know what the AI did and why?"

---

## 10. Acceptance Criteria

1. `GET /api/audit?limit=50` returns real `AuditLog` records from the database, ordered newest-first.
2. The response includes: `id`, `action`, `resource_type`, `resource_id`, `details_json`, `created_at`.
3. The `/audit` frontend page renders only real records from the API.
4. If no audit records exist, the page shows a clean empty state.
5. Each card clearly shows: action type, resource, timestamp, and the `details_json` payload (e.g., LLM classification output, assignment scores, task status transitions).
6. The page does NOT require any new models or DB schema changes.
7. The existing Shadcn visual structure of the audit page is preserved.
8. Full regression (Steps 4–10) continues to pass.
9. `npm run build` succeeds.
10. After performing a complaint → classification → assignment → task update workflow, the resulting audit events appear in the Audit Trail page.

---

## 11. Risks

- **Data volume**: If the backend has been running for a while, `audit_logs` may be large. Mitigate with `limit=50` and newest-first ordering (already in acceptance criteria).
- **AuditLog writes on page load**: The current `GET /api/intelligence/next-action` writes an audit log entry on every call. This means Resort 360 polling creates frequent DB writes. This is a pre-existing issue not introduced by Step 6, but should be noted.
- **Empty state**: If the DB is fresh (no complaints submitted), the audit log will be empty. The frontend must handle this gracefully.

---

## Final Recommendation

**Proceed with Day 3 Step 6: Live Audit Trail.**

It is the strongest remaining feature because it transforms already-existing infrastructure from invisible to demonstrable, directly addresses AI accountability — a core hackathon judging criterion — and has the lowest possible implementation risk of any candidate.

The Live Dashboard KPI tiles (Candidate 2) are a reasonable secondary option but provide less unique value given Resort 360 already shows the same data more richly.
