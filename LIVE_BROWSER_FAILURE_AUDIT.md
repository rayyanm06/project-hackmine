# Smart Resort 360 — Live Browser Failure Audit

## 1. Runtime Environment
- Backend Server: Uvicorn running on `http://localhost:8000` (PID 41072)
- Frontend Server: Vite running on `http://localhost:5173` (PID 24160)
- Database: SQLite `backend/app.db` (Clean seed generated on startup)
- No stale or duplicate instances running on these ports.

## 2. Database State
The database was successfully seeded. Both `scratch/query_db.py` output and API `/api/stats` match the following core entities:
- Users: 12
- Staff: 10
- Rooms: 20
- Complaints: 8
- Tasks: 4
- Assignments: 4
- Audit Logs: 11
- Competitors: 5

## 3. Frontend API Configuration
- Exact Base URL in use: `http://localhost:8000`
- `frontend/src/lib/api.ts` correctly defaults to `http://localhost:8000` when `VITE_API_BASE_URL` is undefined.

## 4. Complaint Submission
- **Request URL**: `POST http://localhost:8000/api/complaints`
- **Payload**: `{"guest_id":1,"room_number":101,"text":"The AC is not cooling properly","language":"english"}`
- **HTTP Status**: `400 Bad Request`
- **Response**: `{"detail": "Invalid language. Allowed: ['en', 'hi', 'hinglish', 'mr', 'ta']"}`
- **Observation**: The frontend dropdown (`_layout.complaints.tsx`) uses the full string "english" as the value, whereas the backend strictly expects the short code "en". Because of this, the API rejects the POST request, and no task is ever generated for new complaints.

## 5. Complaint Persistence
- If the submission API call is manually bypassed with `"language": "en"`, the persistence layer properly creates the Complaint, Task, and Assignment, and AuditLogs are written correctly.
- Currently blocked by the frontend language mapping issue.

## 6. Image / Proof Flow
- The system **only supports completion-proof images attached to a Task**. It does not support images attached to Complaints upon submission.
- The backend fully supports the `POST /api/tasks/{task_id}/completion-proof` endpoint, saving it to `uploads/proofs/` and serving statically from `/uploads`.
- In the frontend task interface, tasks can be moved to "In Progress". However, to move a task to "Completed", a completion proof is required. 

## 7. Verification Flow
- **Workflow**: `Assigned` -> `In Progress` works normally via the frontend.
- **Failure point**: Moving a task from `Completed` to `Verified` (Verification Queue -> Verify).
- When clicking "Verify" on a task in the Verification Queue that lacks a photo evidence, the backend validation triggers: `400 Bad Request - Cannot verify task without completion proof`.
- The seeded tasks (e.g., TSK-3) were seeded as "completed" without attaching completion proof images, causing the Manager Verification click to fail.

## 8. Download Report
- **Status**: UI-only.
- **Handler**: The "Download Report" button on the Dashboard (`_layout.index.tsx` line 27) is a generic `<Button variant="outline">Download Report</Button>` with no `onClick` handler.
- **Network Request**: None.
- **Backend API**: No export/reporting endpoint exists.
- **Download Report is currently UI-only and has no implemented download flow.**

## 9. Staff
- **API Request**: `GET /api/staff`
- **Status**: 200 OK
- **Rendered Result**: Properly fetches and renders the seeded staff members.

## 10. Pricing
- **API Request**: `GET /api/pricing/competitive-analysis?room_type=AC%20Deluxe`
- **Status**: 200 OK
- **Rendered Result**: Displays 5 competitors and calculates proper market averages and pricing strategy logic.

## 11. Audit
- **API Request**: `GET /api/audit?limit=50`
- **Status**: 200 OK
- **Rendered Result**: Displays all real backend audit log events sequentially.

## 12. Recommendations
- **API Request**: `POST /api/recommendations/room-match`
- **Status**: 200 OK
- **Rendered Result**: When submitting "I need a family room", properly responds with family rooms, checking availability logic against the seeded data.

## 13. DB vs API vs Browser Consistency

| Data | DB count | API count | Browser rendered | Match? |
|---|---:|---:|---:|---|
| Staff | 10 | 10 | 10 | ✅ Yes |
| Rooms | 20 | 20 | 20 (Resort 360) | ✅ Yes |
| Complaints | 8 | 8 | 8 | ✅ Yes |
| Tasks | 4 | 4 | 4 | ✅ Yes |
| Competitors | 5 | 5 | 5 | ✅ Yes |
| AuditLogs | 11 | 11 | 11 | ✅ Yes |

## 14. Browser Console Errors
No uncaught exceptions logged in the browser console for rendering valid data. The main errors are HTTP 400 rejection responses generated when submitting the complaint form or validating tasks without proofs.

## 15. Network Errors
- `POST /api/complaints` → 400 Bad Request (Language validation mismatch).
- `PATCH /api/tasks/{id}/status` (to verified) → 400 Bad Request (Missing photo proof).

## 16. Root Causes

1. **Complaint Submission Mismatch**
   - **Severity**: CRITICAL
   - **Evidence**: `POST /api/complaints` 400 error in Network tab.
   - **Exact File**: `frontend/src/routes/_layout.complaints.tsx`
   - **Failure**: Frontend form submits full language string (e.g. "english") while `backend/routes/complaints.py` only allows shortcodes (e.g. "en").
   - **Dependency**: Blocks all new data ingestion.

2. **Verification State Blocked by Missing Proofs**
   - **Severity**: HIGH
   - **Evidence**: `PATCH /api/tasks/3/status` 400 error.
   - **Exact File**: `backend/routes/tasks.py` validation requires proofs, but seed data completes tasks without them.
   - **Failure**: Cannot verify seeded tasks because they lack the required completion proofs.
   - **Dependency**: Blocks Manager workflow demo.

3. **Download Report Placeholder**
   - **Severity**: LOW
   - **Evidence**: Static HTML `<Button variant="outline">Download Report</Button>`.
   - **Exact File**: `frontend/src/routes/_layout.index.tsx`
   - **Failure**: UI-only button, no frontend handler or backend API route.
   - **Dependency**: Non-blocking feature request.

## 17. Repair Order
1. **Complaint POST**: Fix `_layout.complaints.tsx` language select values to use backend-compliant short codes. (Unblocks core data ingestion flow).
2. **Task generation & Verification**: Address the verification pipeline failure. Either allow verifying legacy tasks without proofs, or inject mock photo proofs into the seeded demo data.
3. **Report download**: Only after the core flows work should this be implemented as a new API/UI feature.

## 18. Data Science Status
ML/DS work is paused until the operational demo spine is confirmed functional. Do NOT implement Data Science yet.

## Final Status
`DIAGNOSIS COMPLETE — WAITING FOR REPAIR`
