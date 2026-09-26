import os
import json
import httpx
from sqlalchemy.orm import Session
from backend.models.room import Room
from backend.models.competitor import Competitor
from backend.schemas.pricing import PricingAnalysisResponse, CompetitorResponse
from typing import Optional

def _llm_synthesize_pricing(context: dict) -> dict:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return {}

    prompt = f"""You are a resort pricing AI.
Given the following deterministic pricing context, provide a concise advisory recommendation (1 sentence) and a brief reason (1 sentence) for the resort manager.
Do NOT invent rates. Do NOT recommend a price outside the provided 'allowed_min' and 'allowed_max' bounds.
Keep the recommendation advisory (e.g. "Consider...").

CONTEXT:
{json.dumps(context, indent=2)}

Respond ONLY with valid JSON using this exact schema:
{{
  "recommendation": "<advisory sentence>",
  "reason": "<reasoning sentence>",
  "recommended_rate_min": <integer>,
  "recommended_rate_max": <integer>
}}
"""
    try:
        response = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.0,
                "max_tokens": 150,
            },
            timeout=10,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()
        
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
            
        return json.loads(content.strip())
    except Exception as exc:
        print(f"[pricing_service] LLM synthesis failed: {exc}")
        return {}

def get_competitive_analysis(db: Session, room_type: str = "AC Deluxe") -> PricingAnalysisResponse:
    # 1. Fetch live occupancy for this room type (map UI string "AC Deluxe" to db "Deluxe")
    db_room_type = "Deluxe" if room_type == "AC Deluxe" else room_type.split()[0]
    
    rooms = db.query(Room).filter(Room.room_type == db_room_type).all()
    total_rooms = len(rooms)
    occupied_rooms = sum(1 for r in rooms if r.status == "occupied")
    occupancy_pct = int((occupied_rooms / total_rooms * 100)) if total_rooms > 0 else 0
    
    # 2. Resort rate
    your_rate = 3500 # Default if none found
    if rooms and rooms[0].base_rate:
        your_rate = rooms[0].base_rate

    # 3. Fetch competitors
    comps = db.query(Competitor).filter(Competitor.room_type == room_type).all()
    if not comps:
        raise ValueError("No competitor data found.")
        
    comp_responses = [CompetitorResponse(name=c.name, rate=c.rate) for c in comps]
    comp_rates = [c.rate for c in comps]
    market_average = int(sum(comp_rates) / len(comp_rates))
    market_min = min(comp_rates)
    market_max = max(comp_rates)
    
    # 4. Deterministic Bounds & Fallback Logic
    diff = your_rate - market_average
    
    allowed_min = your_rate
    allowed_max = your_rate
    
    if diff < -200: # We are materially below market
        fallback_rec = f"Consider increasing the {room_type} rate toward the current market average."
        fallback_reason = "The resort's current rate is below comparable competitor rates."
        # Cap adjustment to 20% or market max
        allowed_max = min(int(your_rate * 1.2), market_max)
        allowed_min = your_rate
    elif diff > 200: # We are materially above market
        fallback_rec = f"Consider reviewing if the premium on {room_type} is justified."
        fallback_reason = "The resort's current rate is higher than comparable competitor rates."
        allowed_min = max(int(your_rate * 0.8), market_min)
        allowed_max = your_rate
    else: # Close to market
        fallback_rec = f"Hold current {room_type} rate."
        fallback_reason = "The resort's rate is aligned with the competitor average."
        allowed_min = your_rate
        allowed_max = your_rate

    # Ensure bounds are somewhat sane
    if allowed_min > allowed_max:
        allowed_min, allowed_max = allowed_max, allowed_min

    fallback_min = allowed_min
    fallback_max = allowed_max

    # 5. Optional AI Synthesis
    context = {
        "room_type": room_type,
        "your_rate": your_rate,
        "competitor_rates": [c.model_dump() for c in comp_responses],
        "market_average": market_average,
        "market_min": market_min,
        "market_max": market_max,
        "current_occupancy_pct": occupancy_pct,
        "allowed_min": allowed_min,
        "allowed_max": allowed_max
    }
    
    ai_result = _llm_synthesize_pricing(context)
    
    final_rec = fallback_rec
    final_reason = fallback_reason
    final_min = fallback_min
    final_max = fallback_max
    source = "rule_based"

    if ai_result:
        try:
            # Validate bounds
            ai_min = int(ai_result.get("recommended_rate_min", fallback_min))
            ai_max = int(ai_result.get("recommended_rate_max", fallback_max))
            
            if allowed_min <= ai_min <= allowed_max and allowed_min <= ai_max <= allowed_max:
                final_rec = ai_result.get("recommendation", fallback_rec)
                final_reason = ai_result.get("reason", fallback_reason)
                final_min = ai_min
                final_max = ai_max
                source = "hybrid"
            else:
                print(f"[pricing_service] AI suggested rates {ai_min}-{ai_max} outside bounds {allowed_min}-{allowed_max}. Using fallback.")
        except Exception as e:
            print(f"[pricing_service] Failed to parse AI bounds: {e}")

    evidence = [
        f"Current rate: ₹{your_rate:,}",
        f"Market average: ₹{market_average:,}",
        f"Competitor range: ₹{market_min:,}–₹{market_max:,}",
        f"Current occupancy: {occupancy_pct}%"
    ]

    return PricingAnalysisResponse(
        property_name="Smart Resort 360",
        room_type=room_type,
        your_rate=your_rate,
        competitors=comp_responses,
        market_average=market_average,
        market_min=market_min,
        market_max=market_max,
        recommendation=final_rec,
        recommended_rate_min=final_min,
        recommended_rate_max=final_max,
        reason=final_reason,
        evidence=evidence,
        source=source,
        data_status="demo_seeded"
    )
