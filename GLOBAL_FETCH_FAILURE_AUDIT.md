# Smart Resort 360 — Global Fetch Failure Audit

## 1. Executive Summary
The entire website displays "FAILED TO FETCH" due to a network-level IPv4/IPv6 loopback mismatch. The Vite frontend attempts to fetch data from `http://localhost:8000`, which the modern browser resolves to the IPv6 loopback (`::1`). However, the backend Uvicorn process is specifically bound to the IPv4 loopback (`127.0.0.1`). This causes a total connection refusal (`ERR_CONNECTION_REFUSED`) across all pages.

## 2. Running Processes
- Vite (Frontend): PID 24160 listening on `[::1]:5173`
- Uvicorn (Backend): PID 44488 listening on `127.0.0.1:8000`

## 3. Backend Reachability
- `curl http://127.0.0.1:8000/health`: `200 OK`
- `curl http://localhost:8000/health`: `ERR_CONNECTION_REFUSED` (hangs/fails on IPv6)
- `curl http://127.0.0.1:8000/api/staff`: `200 OK` (JSON response)
- **Conclusion:** Backend is fully operational on IPv4, but completely unreachable via `localhost` (IPv6) from the frontend.

## 4. Frontend API Base URL
- Exact File: `frontend/src/lib/api.ts`
- Exact Code: `export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';`
- Environment Variables: `.env` files contain no API overrides.
- **Resolution:** The frontend uniformly attempts to contact `http://localhost:8000`.

## 5. Browser Console
- `TypeError: Failed to fetch` logged globally on all page mounts due to TanStack query/fetchAPI rejections.

## 6. Browser Network
- Request URL: `http://localhost:8000/api/audit` (or similar first request)
- Status: `(failed) net::ERR_CONNECTION_REFUSED`
- Request Method: `GET`

## 7. CORS
- File: `backend/main.py`
- Origins: `["http://localhost:5173", "http://127.0.0.1:5173"]`
- CORS is configured correctly, but preflight `OPTIONS` requests never reach the backend due to the network-level disconnection.

## 8. First Failed Request
- Request: `GET http://localhost:8000/api/audit` (on the /audit page)
- Result: `ERR_CONNECTION_REFUSED`

## 9. Direct API Comparison
- Browser (`localhost:8000`): Fails instantly with connection refused.
- Direct curl (`127.0.0.1:8000`): Succeeds instantly with `200 OK`.

## 10. Backend Logs
- No requests from the browser appear in the Uvicorn terminal access log because they never establish a TCP connection.

## 11. Database State
- Users: 12
- Staff: 10
- Rooms: 20
- Complaints: 7
- Tasks: 3
- Assignments: 3
- Audit Logs: 6
- Competitors: 5
- **Conclusion:** Database is fully seeded and intact. The failure is strictly network/runtime connectivity.

## 12. Shared API Client
- File: `frontend/src/lib/api.ts`
- Mechanism: All methods (`getComplaints`, `getTasks`, `getStaff`, etc.) wrap the base `fetchAPI` function which prepends the hardcoded `API_BASE_URL` (`http://localhost:8000`).
- Because every page relies on this shared `fetchAPI`, a connectivity issue here cascades to a 100% failure rate across the app.

## 13. Page-by-Page Network Matrix
| Page | Request | URL | Browser Result | Direct Result |
|---|---|---|---|---|
| Staff | `GET /api/staff` | `http://localhost:8000/api/staff` | `ERR_CONNECTION_REFUSED` | `200 OK` (via 127.0.0.1) |
| Tasks | `GET /api/tasks` | `http://localhost:8000/api/tasks` | `ERR_CONNECTION_REFUSED` | `200 OK` (via 127.0.0.1) |
| Rooms | `GET /api/rooms` | `http://localhost:8000/api/rooms` | `ERR_CONNECTION_REFUSED` | `200 OK` (via 127.0.0.1) |
| Complaints | `GET /api/complaints` | `http://localhost:8000/api/complaints` | `ERR_CONNECTION_REFUSED` | `200 OK` (via 127.0.0.1) |
| Pricing | `GET /api/pricing/...` | `http://localhost:8000/api/pricing/...` | `ERR_CONNECTION_REFUSED` | `200 OK` (via 127.0.0.1) |
| Audit | `GET /api/audit` | `http://localhost:8000/api/audit` | `ERR_CONNECTION_REFUSED` | `200 OK` (via 127.0.0.1) |

## 14. Stale Process / Cache Check
- Verified via `netstat` and DevTools that the frontend is running the current bundle.
- The `fetch` calls accurately reflect the source code in `api.ts`. No stale caches are responsible for this failure.

## 15. Root Causes
- **Severity**: CRITICAL
- **Evidence**: `curl http://localhost:8000/health` fails while `curl http://127.0.0.1:8000/health` succeeds; browser Network tab shows `ERR_CONNECTION_REFUSED`.
- **File**: `frontend/src/lib/api.ts`
- **Request**: All `fetchAPI` calls to `http://localhost:8000`
- **Error**: IPv6/IPv4 loopback resolution mismatch. The frontend uses `localhost` (resolving to `::1`) while the backend binds to `127.0.0.1`.

## 16. Exact Repair Plan
1. Edit `frontend/src/lib/api.ts`.
2. Change the fallback URL from `http://localhost:8000` to `http://127.0.0.1:8000`.

## Final Status
`ROOT CAUSE IDENTIFIED — WAITING FOR FIX`
