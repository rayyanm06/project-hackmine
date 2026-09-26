# Day 3 Step 4: Revenue Intelligence Audit

## 1. Executive Summary
An audit of the current Revenue/Pricing Intelligence feature reveals that the entire implementation is currently a **Static UI**. The `_layout.pricing.tsx` frontend contains hardcoded components simulating AI recommendations, competitor rates, and occupancy. There is currently no backend data model, no API endpoint, and no intelligence logic connecting real or seeded data to the pricing page. The path forward is to replace this static mockup with a dynamic, hybrid intelligence layer that combines live occupancy data with simulated competitor data to produce advisory recommendations.

## 2. Documentation Requirements
Based on the hackathon documentation:
- Manager must see current room rate and competitor rates.
- System must provide an AI-assisted pricing recommendation.
- Recommendation must consider available occupancy/seasonality context.
- Recommendation must include reasoning.
- Price changes must remain **advisory** (no automatic changes).
- Simulated/seeded data must be clearly labeled.

## 3. Current Pricing Implementation
| Component | Current State | Source | Live? | Simulated? |
|---|---|---|---|---|
| Current resort rate | Static UI | Frontend hardcoded | No | Yes |
| Competitor rates | Static UI | Frontend hardcoded | No | Yes |
| Competitor average | Static UI | Frontend hardcoded | No | Yes |
| Occupancy | Static UI | Frontend hardcoded | No | Yes |
| Occupancy forecast | Static UI | Frontend hardcoded | No | Yes |
| Seasonality | Static UI | Frontend hardcoded | No | Yes |
| Recommendation | Static UI | Frontend hardcoded | No | Yes |
| Reasoning | Static UI | Frontend hardcoded | No | Yes |
| Suggested price/range | Static UI | Frontend hardcoded | No | Yes |

## 4. Current Data Inventory
| Data | Exists? | Location | API? | Reliable for recommendation? |
|---|---|---|---|---|
| Resort rates | No | N/A | No | No |
| Competitors | No | N/A | No | No |
| Occupancy | Yes | `backend/models/room.py` | `GET /api/rooms` | Yes (seeded live state) |
| Seasonality | No | N/A | No | No |

## 5. Live vs Seeded vs Simulated
Currently, everything on the Pricing page is simulated in the frontend. Going forward:
- **Live Data**: Room Occupancy (calculated from actual seeded database records).
- **Simulated Data**: Competitor rates, Seasonality, base rates (injected dynamically by the backend for the demo).

## 6. Existing Intelligence Overlap
- **Next Best Action**: Focuses entirely on immediate operational/staffing directives.
- **Emerging Operational Patterns**: Focuses on systemic physical/maintenance issues.
- **Pricing Intelligence**: Fully isolated. It does not overlap with operational intelligence and should remain on its dedicated `/pricing` page to avoid cluttering the primary Resort 360 dashboard.

## 7. Feature Gaps
- No `GET /api/intelligence/pricing` endpoint exists.
- No backend logic connects the live room occupancy to the pricing context.
- No hybrid AI/rule-based service exists for pricing recommendations.

## 8. Proposed Architecture
Implement a **Hybrid** intelligence architecture in a new `backend/services/pricing_service.py` module:
1. **Deterministic Aggregation**: Python queries live room occupancy from the database and marries it with simulated market data (competitor rates, base prices).
2. **Deterministic Calculation**: Python calculates the competitor average, the price gap, and a safe suggested rate range.
3. **AI Synthesis**: If available, the LLM receives this structured context and generates a concise, human-readable recommendation and reasoning.
4. **Fallback**: If the LLM fails, Python generates a deterministic text recommendation.

## 9. AI vs Deterministic Responsibilities
- **Deterministic**: Calculates competitor average, determines if the current rate is below/above market, calculates exact live occupancy %, and calculates the suggested price bounds.
- **AI**: Strictly limited to generating readable text (`recommendation` and `reason`) synthesizing the deterministic facts. The AI **will not** invent competitor prices or calculate percentages.

## 10. Explainability
Recommendations will be accompanied by an `evidence` array containing factual, deterministic data points (e.g., "Current occupancy: 82%", "Competitor average: ₹4,400"). No chain-of-thought logic will be exposed or stored.

## 11. Data Guardrails
To prevent arbitrary recommendations, the deterministic layer will enforce a guardrail: the recommended price bounds cannot exceed ±20% of the simulated base rate. The LLM will not dictate the price bounds; it will only read them.

## 12. UI Integration
The existing `frontend/src/routes/_layout.pricing.tsx` page will be updated to fetch from the new API endpoint rather than relying on hardcoded components. It will include loading, error, and empty states. A clear badge will remain to indicate that competitor data is simulated while occupancy is live.

## 13. Demo Scenario
1. Manager clicks on the **Pricing Intelligence** sidebar link.
2. The page fetches `GET /api/intelligence/pricing`.
3. The UI displays the Deluxe Room card.
4. The manager sees the **live occupancy** of Deluxe rooms (based on seeded `rooms` table) and **simulated competitor rates**.
5. An AI-assisted recommendation advises a rate increase, supported by evidence of high occupancy and higher competitor averages.
6. The manager observes the "Apply Suggested Rate" button is disabled/advisory, fulfilling the safety requirement.

## 14. Risks and Fallbacks
- **LLM Hallucination**: Mitigated by providing strict numerical bounds via Python and rejecting non-compliant JSON.
- **AI Unavailable**: Mitigated by a robust deterministic fallback that yields standard rule-based explanations.
- **Missing Database Occupancy**: The service will gracefully handle a 0-denominator by defaulting occupancy to 0% and rendering a safe recommendation.

## 15. Proposed Next Implementation
- **Feature name**: Advisory Pricing Intelligence
- **Purpose**: Deliver dynamic, hybrid pricing recommendations using real occupancy context and simulated market conditions.
- **Existing data used**: Live `Room` occupancy status.
- **Data that must be seeded**: In-memory simulated competitor rates and base prices within the service layer (avoids database bloat).
- **API**: `GET /api/intelligence/pricing`
- **Backend services**: `backend/services/pricing_service.py`, `backend/routes/intelligence.py`
- **Frontend files**: `frontend/src/routes/_layout.pricing.tsx`, `frontend/src/lib/api.ts`
- **AI role**: Natural language synthesis of deterministic pricing gaps and occupancy metrics.
- **Deterministic fallback**: Hardcoded string construction based on calculated gaps.
- **Explainability**: Factual evidence arrays displayed natively in the UI.
- **Demo flow**: Manager navigates to the Pricing page, sees live occupancy influencing simulated market rates, and reads an advisory recommendation.
- **Complexity**: Medium.
- **Risk**: Low (entirely read-path).
- **Core-spine impact**: Zero.

## 16. Core Spine Safety Check
**PASS.** The proposed pricing intelligence feature will strictly read the `rooms` table. It does not interact with the Complaints, Tasks, Staff, or Assignment systems in any capacity. Day 2 functionality is fully insulated.
