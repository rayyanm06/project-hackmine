# Day 3 Step 5 — Guest Experience Intelligence Audit

## 1. Existing Guest Experience Functionality
- `frontend/src/routes/_layout.recommendations.tsx` exists but is a completely hardcoded UI mockup for a booking aggregator (showing multiple external resorts).
- `backend/models/user.py` exists but has only basic fields (`name`, `role`, `email`). It does not store guest preferences, stay history, or profiles.
- There is no existing recommendation API, no amenity database, and no guest feedback loop in the backend.

## 2. Existing Rooms 360
- `frontend/src/routes/_layout.rooms-360.tsx` is a guest-facing static mockup. 
- It uses hardcoded data (`mockRooms` from a local frontend file).
- The "360° Tour" is a UI placeholder using a mocked dialog for Pannellum. There is no real panorama library installed, and no equirectangular image assets are served by the backend for this feature.
- It should remain untouched as a pure frontend visual placeholder, as implementing a real 360 viewer is outside the scope of intelligence.

## 3. Existing Insights
- `frontend/src/routes/_layout.insights.tsx` provides a manager-facing dashboard mockup.
- It contains a "Guest Experience" section (Sentiment Score, Emerging Complaint Trends).
- The trend mockup overlaps conceptually with the actual `Emerging Operational Patterns` feature implemented in Step 3. 
- It does not contain any functional personalized guest recommendations.

## 4. Available Data

### Existing Data
- `Room`: Contains `room_number`, `room_type`, `status` (occupied, available, cleaning, maintenance), and `base_rate`.
- This is the only live operational data relevant to recommending a stay (availability and price).

### Missing Data
- Room amenities, descriptions, capacity (currently only exist in frontend mock data).
- Guest profiles, preferences, past stay history.
- Restaurant menus, activity schedules.

### Safe Demo Data
- We can define deterministic metadata (amenities, capacity, description) for the 4 existing room types (`Deluxe`, `Standard`, `Suite`, `Family`) within the service layer to avoid creating unnecessary database models.

## 5. Recommended Feature
**Conversational Room Matchmaker (AI Recommendation Engine)**

A feature where a guest (or a booking agent) inputs a natural language request (e.g., "I am traveling with my wife and two kids, we need AC and want to keep it under ₹6000 a night"), and the system recommends the best **currently available** room type at Smart Resort 360.

This avoids the complexity of building a multi-property aggregator and focuses on the resort's own live operational data.

## 6. AI Architecture
- **Deterministic Prep**: Query the DB for all `Room`s where `status == 'available'`. Group by `room_type` and attach static metadata (price, capacity, amenities) from a service-level dictionary.
- **Structured Input**: Send the user's query and the list of *actually available* room types to the LLM.
- **Strict Schema**: Require JSON output `{"recommended_room_type": "Family", "reason": "...", "confidence": 95}`.
- **Guardrails**: The LLM cannot recommend a room type that is sold out or doesn't exist. It cannot invent prices.
- **Fallback**: If the API fails or times out (10s), use a deterministic keyword matcher (e.g., if query contains "family" -> recommend Family room).

## 7. Hackathon Value
This demonstrates real-time AI utility: instead of a static booking page, the AI bridges the gap between a guest's unstructured needs and the resort's real-time inventory (only recommending rooms that are actually clean and available). It proves the platform can act as an intelligent digital concierge.

## 8. Scope

### MUST HAVE
- Backend service to match query against available room inventory.
- API endpoint `POST /api/intelligence/recommend-room`.
- Update `_layout.recommendations.tsx` to use this API and display rooms from *this* resort, removing the multi-resort aggregator mockup.

### NICE TO HAVE
- Highlighting specific matched amenities in the UI.

### DO NOT BUILD
- Real 360 image integration.
- Full guest profile database tables (User preferences, stay history).
- Multi-property aggregation.

## 9. Implementation Plan

### Backend
- Create `backend/services/recommendation_service.py` to handle inventory filtering and OpenAI synthesis.
- Create `backend/schemas/recommendation.py` for request/response models.

### Frontend
- Update `frontend/src/lib/api.ts` with `getRoomRecommendation(query: string)`.
- Refactor `frontend/src/routes/_layout.recommendations.tsx` to take a text query, call the API, and display the single best recommended room type along with the AI's reasoning.

### API
- `POST /api/intelligence/recommend-room`
  Request: `{"query": "string"}`
  Response: `{"recommended_room_type": "string", "reason": "string", "available_count": int, "base_rate": int, "source": "hybrid"}`

### Data
- No new database models. In-memory dictionary in `recommendation_service.py` mapping `room_type` to `["amenities", capacity, description]`.

### Tests
- `backend/test_step10.py` to test availability filtering, AI fallback, and boundary enforcement.

### Browser Verification
- Type a query into the Recommendations page, click "Find Matches", and verify the response aligns with live available rooms and displays the correct reasoning.

## 10. Risks
- **UI Disruption**: The current `recommendations.tsx` mockup looks like Expedia (multiple resorts). Refactoring it to a single-resort view requires care to preserve the Shadcn aesthetic while changing the domain logic.
- **Data Integrity**: The AI might hallucinate a room type if not strictly prompted. Validating the AI's `recommended_room_type` against the list of available types before returning is critical.

## 11. Final Recommendation
**PROCEED.** 
Day 3 Step 5 is highly feasible, requires zero structural database changes, and strongly demonstrates the hackathon objective of intelligent, data-driven automation by connecting unstructured guest intent with live operational availability.
