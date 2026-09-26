# Day 3 Step 5 — Conversational Room Matchmaker

## 1. Implementation Summary
The Conversational Room Matchmaker is a live, API-backed feature on the `/recommendations` page. A user enters a natural-language request; the system parses requirements, queries the actual database for available rooms, scores them deterministically, and returns up to 3 matches with explanations. AI is used only for text explanation, and all room availability/pricing facts come exclusively from the database.

## 2. Backend

**Files Created:**
- `backend/schemas/recommendation.py` — `RoomMatchRequest`, `ParsedRequirements`, `MatchedRoom`, `RoomMatchResponse`
- `backend/services/recommendation_service.py` — Full service: parsing, matching, scoring, AI explanation
- `backend/routes/recommendations.py` — `POST /api/recommendations/room-match` endpoint
- `backend/test_step10.py` — 10 test cases

**Files Modified:**
- `backend/main.py` — Registered the new `recommendations` router

## 3. Matching Logic
1. **Parse** the query (AI first, deterministic keyword fallback) to extract `room_type`, `max_price`, `min_price`
2. **Query DB** for all rooms with `status == 'available'` — the DB is the exclusive source of truth
3. **Score** each room: type match (+40), within budget (+30), near-budget (+10), availability base (+20)
4. **Rank** by score descending; break ties by price ascending
5. **Return** top 3. If no scored matches: return top-3 cheapest available as alternatives with explanation
6. Unsupported requirements (pool, WiFi, etc.) are detected and surfaced in a `warning` field; they are never fabricated as matching attributes

## 4. AI Architecture
- **Parser call**: Structured prompt extracts `room_type`, `max_price`, `min_price` from free-text
- **Explainer call**: Sends only verified DB facts (room_number, room_type, base_rate, status, floor) to LLM for 1-sentence explanation per room
- **Timeout**: 10 seconds per call
- **Fallback conditions**: No API key, timeout, HTTP error, malformed JSON, invalid room number keys in response → deterministic fallback text used
- **Guardrail**: AI explanation response is validated — returned keys must match actual room numbers sent. If not, fallback is used.

## 5. Frontend
- `_layout.recommendations.tsx` — Completely replaced static multi-property mockup with a live Room Matchmaker
- Features: natural language input, Enter key support, loading skeleton, error state, no-match state, per-room `RoomCard` component, warning banner for unsupported requirements, source badge (hybrid/rule_based), data label
- `frontend/src/lib/api.ts` — Added `MatchedRoom`, `ParsedRequirements`, `RoomMatchResponse` types and `getRoomRecommendation(query)` method

## 6. Truthfulness / Data Boundaries
The Room model has only: `room_number`, `room_type`, `status`, `base_rate`, `floor`. No amenity, pool, capacity, or bed fields exist.

**Enforced rules:**
- The service has an `UNSUPPORTED_ATTRIBUTES` set that detects such requests and surfaces them in `warning`
- The AI prompt explicitly forbids mentioning pool, WiFi, gym, breakfast, capacity, or bed type
- The `match_reason` field is built deterministically and never contains unsupported claims
- Occupied/cleaning/maintenance rooms are never returned as available results

## 7. Tests
`backend/test_step10.py` — 10 tests:
1. Supported query returns available rooms
2. Occupied/cleaning/maintenance rooms never returned
3. Budget constraint is respected in scoring
4. Unsupported requirement (pool) is not fabricated; `warning` includes "pool"
5. No available rooms returns clean empty response
6. Missing OpenAI key uses deterministic fallback
7. Malformed AI JSON uses deterministic fallback
8. AI explanation cannot inject unsupported DB claims via `match_reason`
9. At most 3 recommendations returned
10. Empty query returns HTTP 400

**Result: 10/10 PASS**

## 8. Browser Verification
- Page loaded with correct heading and input field
- Query "family room under 6000" correctly returned no Family rooms (rooms 301, 302 are occupied/cleaning in seeded state) — the system offered nearest available alternatives instead, confirming availability truthfulness
- Query "deluxe" returned available Deluxe rooms (101, 204, 303, etc.) with correct prices (₹3,500)
- Explanations shown; source badge displayed; no fabricated amenities
- No console errors

## 9. Regression Results
Full suite: Steps 4, 6, 7, 8, 9, 10 — **29/29 tests PASS**
`npm run build` — **SUCCESS** (2241 modules, 0 type errors)

## 10. Known Limitations
- The Room model has no amenity, capacity, or bed-type data. Requests mentioning these features trigger a warning but do not block the search.
- The seeded Family rooms (301, 302) are occupied/cleaning; a realistic demo may benefit from at least one available Family room (can be added to seed data separately without any schema change).

## Final Status
Step 5 is **COMPLETE and ready for audit/lock**.

All safety requirements met:
- Database is the source of truth for availability and pricing
- AI assists only with explanation text
- Unsupported attributes are surfaced, never fabricated
- No booking, payment, or guest profile system was introduced
- Day 3 Steps 1–4 are unmodified and fully regressed
