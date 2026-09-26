"""
Recommendation Service — Smart Resort 360
==========================================
Conversational Room Matchmaker.

Architecture:
1. Parse natural-language query -> structured requirements (AI-assisted, deterministic fallback)
2. Deterministically filter available rooms from DB (AI cannot override availability)
3. Score and rank rooms deterministically
4. AI optionally explains the match (text only — cannot invent DB facts)
5. Return top 3 matches

NOTE: The Room model has only: room_number, room_type, status, base_rate, floor.
      Amenities, pool, capacity, bed type are NOT in the database.
      Any such requirement is surfaced as unsupported, not fabricated.
"""

import os
import re
import json
import httpx
from sqlalchemy.orm import Session
from typing import List, Optional, Tuple

from backend.models.room import Room
from backend.schemas.recommendation import (
    ParsedRequirements,
    MatchedRoom,
    RoomMatchResponse,
)

# ── Static room-type metadata (demo labels — NOT database fields) ──────────────
# These describe typical characteristics for the demo. They are never claimed
# to be live database-verified attributes.
ROOM_TYPE_META = {
    "Standard": {
        "typical_guests": 2,
        "description": "Comfortable standard room for couples or solo travelers.",
    },
    "Deluxe": {
        "typical_guests": 2,
        "description": "Spacious AC deluxe room with enhanced furnishings.",
    },
    "Family": {
        "typical_guests": 4,
        "description": "Large family room designed for families up to 4 guests.",
    },
    "Suite": {
        "typical_guests": 2,
        "description": "Premium suite with separate living area and luxury amenities.",
    },
}

# Canonical valid room types in DB
VALID_ROOM_TYPES = {"Standard", "Deluxe", "Family", "Suite"}

# Requirements NOT in the Room model — must never be fabricated
UNSUPPORTED_ATTRIBUTES = {
    "pool", "swimming pool", "jacuzzi", "spa", "gym", "balcony",
    "ocean view", "sea view", "garden view", "breakfast", "wifi",
    "parking", "pet friendly", "pet-friendly", "kitchen", "bathtub",
}


# ── Step 1: AI-assisted parser ─────────────────────────────────────────────────

def _llm_parse_query(query: str) -> dict:
    """Call OpenAI to extract structured requirements. Returns {} on any failure."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return {}

    valid_types = ", ".join(sorted(VALID_ROOM_TYPES))
    prompt = f"""You are a hotel booking assistant. Extract room requirements from the guest query.

VALID_ROOM_TYPES: {valid_types}

Guest query: "{query}"

Respond ONLY with valid JSON. Use null for unknown fields.
{{
  "room_type": "<one of {valid_types} or null>",
  "max_price": <integer or null>,
  "min_price": <integer or null>
}}

Rules:
- room_type MUST be one of the valid types or null. Do not invent others.
- Extract price as integer (₹ per night).
- Do not add any other fields.
"""
    try:
        response = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.0,
                "max_tokens": 80,
            },
            timeout=10,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()
        if content.startswith("```"):
            content = re.sub(r"```[a-z]*\n?", "", content).replace("```", "").strip()
        return json.loads(content)
    except Exception as exc:
        print(f"[recommendation_service] LLM parse failed: {exc}")
        return {}


def _deterministic_parse(query: str) -> dict:
    """Keyword-based fallback parser."""
    result: dict = {"room_type": None, "max_price": None, "min_price": None}
    q = query.lower()

    # Room type keywords
    if "family" in q:
        result["room_type"] = "Family"
    elif "suite" in q:
        result["room_type"] = "Suite"
    elif "deluxe" in q:
        result["room_type"] = "Deluxe"
    elif "standard" in q:
        result["room_type"] = "Standard"

    # Budget — find numbers near price keywords
    price_patterns = [
        r"under\s*[₹rs]?\s*(\d[\d,]+)",
        r"below\s*[₹rs]?\s*(\d[\d,]+)",
        r"max\w*\s*[₹rs]?\s*(\d[\d,]+)",
        r"budget\s*[₹rs]?\s*(\d[\d,]+)",
        r"[₹rs]\s*(\d[\d,]+)\s*(?:per night|/night|a night)?",
        r"(\d[\d,]+)\s*(?:per night|/night|a night)",
    ]
    for pattern in price_patterns:
        m = re.search(pattern, q)
        if m:
            result["max_price"] = int(m.group(1).replace(",", ""))
            break

    return result


def _detect_unsupported(query: str) -> List[str]:
    """Detect requests for attributes not in the DB."""
    q = query.lower()
    found = []
    for attr in UNSUPPORTED_ATTRIBUTES:
        if attr in q:
            found.append(attr)
    return found


def parse_requirements(query: str) -> Tuple[ParsedRequirements, str]:
    """
    Returns (ParsedRequirements, parse_source).
    parse_source: "ai" | "rule_based"
    """
    unsupported = _detect_unsupported(query)
    raw = _llm_parse_query(query)
    source = "ai"

    if not raw:
        raw = _deterministic_parse(query)
        source = "rule_based"

    # Validate room_type is one we actually have
    room_type = raw.get("room_type")
    if room_type and room_type not in VALID_ROOM_TYPES:
        room_type = None

    max_price = raw.get("max_price")
    min_price = raw.get("min_price")

    # Coerce to int if needed
    try:
        max_price = int(max_price) if max_price is not None else None
    except (TypeError, ValueError):
        max_price = None
    try:
        min_price = int(min_price) if min_price is not None else None
    except (TypeError, ValueError):
        min_price = None

    return ParsedRequirements(
        room_type=room_type,
        max_price=max_price,
        min_price=min_price,
        unsupported_requirements=unsupported,
    ), source


# ── Step 2–3: Deterministic matching and scoring ───────────────────────────────

def _score_room(room: Room, req: ParsedRequirements) -> int:
    """Return a deterministic match score (higher = better)."""
    score = 0

    # Room type match: exact = 40 pts
    if req.room_type and room.room_type == req.room_type:
        score += 40

    # Within budget: 30 pts; close to budget: 10 pts
    if req.max_price is not None:
        if room.base_rate <= req.max_price:
            score += 30
        elif room.base_rate <= req.max_price * 1.15:
            score += 10  # slightly over but near-miss

    # Above min_price: 10 pts
    if req.min_price is not None and room.base_rate >= req.min_price:
        score += 10

    # Always-available bonus
    if room.status == "available":
        score += 20  # base eligibility bonus

    return score


def match_rooms(db: Session, req: ParsedRequirements) -> List[Room]:
    """
    Query ONLY available rooms from DB and rank them deterministically.
    Returns top 3.
    """
    available_rooms = db.query(Room).filter(Room.status == "available").all()
    if not available_rooms:
        return []

    # Score all
    scored = [(room, _score_room(room, req)) for room in available_rooms]
    # Only include rooms with a meaningful positive match (> base eligibility)
    scored = [(r, s) for r, s in scored if s > 20]

    if not scored:
        # If nothing matches, return top-3 cheapest available as alternatives
        available_rooms.sort(key=lambda r: r.base_rate)
        return available_rooms[:3]

    # Sort by score descending, then price ascending as tiebreaker
    scored.sort(key=lambda x: (-x[1], x[0].base_rate))
    return [r for r, _ in scored[:3]]


def _build_match_reason(room: Room, req: ParsedRequirements) -> Tuple[str, int]:
    """Build deterministic match reason text and score for a single room."""
    score = _score_room(room, req)
    reasons = []

    if req.room_type and room.room_type == req.room_type:
        reasons.append(f"room type ({room.room_type}) matches your request")
    if req.max_price is not None and room.base_rate <= req.max_price:
        reasons.append(f"rate ₹{room.base_rate:,} is within your ₹{req.max_price:,} budget")
    elif req.max_price is not None and room.base_rate <= req.max_price * 1.15:
        reasons.append(f"rate ₹{room.base_rate:,} is slightly above budget but close")

    if not reasons:
        reasons.append("available and closest match to your requirements")

    return "; ".join(reasons).capitalize() + ".", score


# ── Step 4: AI explanation ─────────────────────────────────────────────────────

def _llm_explain(query: str, rooms: List[Room], req: ParsedRequirements) -> Optional[dict]:
    """
    Ask LLM to write a short explanation for each room.
    Returns {room_number: explanation} or None on failure.
    LLM receives ONLY database facts — cannot invent amenities.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None

    rooms_data = [
        {
            "room_number": r.room_number,
            "room_type": r.room_type,
            "base_rate": r.base_rate,
            "status": r.status,
            "floor": r.floor,
        }
        for r in rooms
    ]

    prompt = f"""You are a hotel concierge. Write one concise sentence explaining why each room matches the guest's query.

Guest query: "{query}"
Parsed requirements: {json.dumps({"room_type": req.room_type, "max_price": req.max_price})}
Available matched rooms (database facts only): {json.dumps(rooms_data)}

Rules:
- Use ONLY the fields provided above.
- Do NOT mention pool, WiFi, gym, breakfast, or any amenity not in the data.
- Do NOT claim capacity/bed type — this data is not available.
- Keep each explanation to 1 sentence.

Respond ONLY with valid JSON:
{{
  "<room_number>": "<explanation>",
  ...
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
                "max_tokens": 200,
            },
            timeout=10,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()
        if content.startswith("```"):
            content = re.sub(r"```[a-z]*\n?", "", content).replace("```", "").strip()
        result = json.loads(content)
        # Validate — keys must be room numbers we sent
        valid_nums = {str(r.room_number) for r in rooms}
        if not all(k in valid_nums for k in result):
            return None
        return result
    except Exception as exc:
        print(f"[recommendation_service] LLM explain failed: {exc}")
        return None


# ── Public entry point ─────────────────────────────────────────────────────────

def get_room_recommendations(db: Session, query: str) -> RoomMatchResponse:
    # 1. Parse requirements
    req, parse_source = parse_requirements(query)

    # 2. Deterministically match rooms from DB
    matched_rooms = match_rooms(db, req)

    # 3. Build deterministic explanations first
    matched_data = []
    for room in matched_rooms:
        reason, score = _build_match_reason(room, req)
        matched_data.append({
            "room": room,
            "score": score,
            "reason": reason,
            "explanation": reason,  # fallback
        })

    # 4. Optionally augment explanations with AI (text only, no new facts)
    explanation_source = parse_source
    if matched_rooms:
        ai_explanations = _llm_explain(query, matched_rooms, req)
        if ai_explanations:
            explanation_source = "hybrid"
            for entry in matched_data:
                room_key = str(entry["room"].room_number)
                if room_key in ai_explanations:
                    entry["explanation"] = ai_explanations[room_key]

    # 5. Build response objects
    result_rooms = [
        MatchedRoom(
            room_number=e["room"].room_number,
            room_type=e["room"].room_type,
            base_rate=e["room"].base_rate,
            status=e["room"].status,
            floor=e["room"].floor,
            match_score=e["score"],
            match_reason=e["reason"],
            explanation=e["explanation"],
        )
        for e in matched_data
    ]

    # 6. Build warning for unsupported requirements
    warning = None
    if req.unsupported_requirements:
        attrs = ", ".join(req.unsupported_requirements)
        warning = (
            f"The following preferences could not be verified from room data and were not used in matching: "
            f"{attrs}. Availability and pricing are the only live-verified attributes."
        )

    no_match_warning = None
    if not result_rooms:
        no_match_warning = "No available rooms found matching your requirements."
        if warning:
            warning = warning + " " + no_match_warning
        else:
            warning = no_match_warning

    return RoomMatchResponse(
        query=query,
        parsed_requirements=req,
        matches=result_rooms,
        source=explanation_source,
        data_status="live_seeded",
        warning=warning,
    )
