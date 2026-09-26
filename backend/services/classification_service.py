"""
Classification Service — Smart Resort 360
==========================================

Classifies a complaint text into a structured result containing:
  issue_type, department, priority, location, required_skill, confidence

Design:
  - Primary path: external LLM via OPENAI_API_KEY env var (if configured).
  - Fallback: deterministic rule-based classifier using keyword matching.
  - The route calls `classify_complaint(text)` — it never needs to know
    which path was taken; the result is always a ClassificationResult.

The rule-based fallback is clearly documented as such via `source` field.
Confidence values for rules are NOT statistically derived; they follow a
simple documented convention:
  0.90  — unambiguous single-keyword match
  0.75  — multi-keyword match with moderate confidence
  0.55  — partial / catch-all match

Issue types map to the departments and skills that exist in the seeded DB:
  Maintenance  → skills: AC Repair, Plumbing, General
  Housekeeping → skills: Cleaning, General
  Kitchen      → skills: Cooking, General
  FrontDesk    → skills: General
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Optional


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class ClassificationResult:
    issue_type: str          # AC | Plumbing | Electrical | Housekeeping | Food | WiFi | Noise | Other
    department: str          # Maintenance | Housekeeping | Kitchen | FrontDesk
    priority: str            # Low | Medium | High | Critical
    location: Optional[str]  # extracted location hint, or None
    required_skill: str      # must match a Skill.name in the DB
    confidence: float        # 0.0 – 1.0 (see module docstring for convention)
    source: str              # "rule_based" | "llm"
    reasoning: str           # human-readable explanation of why this classification


# ---------------------------------------------------------------------------
# Keyword rules (deterministic fallback)
# ---------------------------------------------------------------------------
# Each rule is (pattern, issue_type, department, priority, required_skill, confidence, reasoning)
# Rules are evaluated in order; first match wins.

_RULES: list[tuple[re.Pattern, str, str, str, str, float, str]] = []


def _r(pattern: str, issue_type: str, department: str, priority: str,
       required_skill: str, confidence: float, reasoning: str):
    _RULES.append((
        re.compile(pattern, re.IGNORECASE),
        issue_type, department, priority, required_skill, confidence, reasoning
    ))


# AC / HVAC
_r(r"ac|air.?condition|hvac|cool(ing)?|heat(ing)?|ventilat",
   "AC", "Maintenance", "High", "AC Repair", 0.90,
   "Keyword match: AC/air-conditioning/HVAC/cooling/heating — routed to Maintenance › AC Repair")

# Plumbing / water
_r(r"plumb|leak|tap|pipe|drain|flood|water.*(not|issue|problem)|bathroom.*water|toilet",
   "Plumbing", "Maintenance", "High", "Plumbing", 0.90,
   "Keyword match: plumbing/leak/tap/pipe/drain/flood — routed to Maintenance › Plumbing")

# Electrical
_r(r"electric|power|light|switch|socket|bulb|fuse|shock",
   "Electrical", "Maintenance", "High", "General", 0.90,
   "Keyword match: electrical/power/light/socket — routed to Maintenance › General (no Electrical skill seeded)")

# WiFi / Internet
_r(r"wifi|wi-fi|internet|network|connect(ion)?|router",
   "WiFi", "FrontDesk", "Medium", "General", 0.90,
   "Keyword match: WiFi/internet/network — routed to FrontDesk › General")

# Housekeeping / cleaning
_r(r"clean|dirty|dust|mop|sweep|linen|towel|bed.*make|housekeep",
   "Housekeeping", "Housekeeping", "Medium", "Cleaning", 0.90,
   "Keyword match: clean/dirty/dust/linen/towel — routed to Housekeeping › Cleaning")

# Food / Kitchen
_r(r"food|meal|lunch|dinner|breakfast|cook|kitchen|cold.*food|warm.*food|spicy|taste|chef",
   "Food", "Kitchen", "Medium", "Cooking", 0.90,
   "Keyword match: food/meal/cook/chef — routed to Kitchen › Cooking")

# Noise
_r(r"noise|loud|disturb|sound|music|party",
   "Noise", "FrontDesk", "Medium", "General", 0.75,
   "Keyword match: noise/loud/disturb — routed to FrontDesk › General")

# Maintenance (generic fallback)
_r(r"broken|not work(ing)?|repair|fix|damage|broken|malfunct",
   "Maintenance", "Maintenance", "Medium", "General", 0.75,
   "Keyword match: broken/not working/repair — generic Maintenance › General fallback")


def _rule_based_classify(text: str) -> ClassificationResult:
    """Apply ordered keyword rules. Returns the first match or a catch-all."""
    for pattern, issue_type, department, priority, required_skill, confidence, reasoning in _RULES:
        if pattern.search(text):
            # Try to extract a location hint (e.g. "room 205", "floor 3")
            location = _extract_location(text)
            return ClassificationResult(
                issue_type=issue_type,
                department=department,
                priority=priority,
                location=location,
                required_skill=required_skill,
                confidence=confidence,
                source="rule_based",
                reasoning=reasoning,
            )

    # Catch-all — cannot classify confidently
    return ClassificationResult(
        issue_type="Other",
        department="FrontDesk",
        priority="Low",
        location=_extract_location(text),
        required_skill="General",
        confidence=0.40,
        source="rule_based",
        reasoning="No keyword rules matched — defaulted to FrontDesk › General with low confidence.",
    )


def _extract_location(text: str) -> Optional[str]:
    """Best-effort extraction of a room/floor/area from complaint text."""
    m = re.search(r"room\s*(\d+)", text, re.IGNORECASE)
    if m:
        return f"Room {m.group(1)}"
    m = re.search(r"floor\s*(\d+)", text, re.IGNORECASE)
    if m:
        return f"Floor {m.group(1)}"
    return None


# ---------------------------------------------------------------------------
# LLM path (optional — requires OPENAI_API_KEY in environment)
# ---------------------------------------------------------------------------

def _llm_classify(text: str) -> Optional[ClassificationResult]:
    """
    Attempt LLM classification via OpenAI if OPENAI_API_KEY is set.
    Returns None if the key is absent or if the call fails, allowing the
    caller to fall back to rule-based classification.

    The prompt asks for a structured JSON response matching ClassificationResult.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        import json
        import httpx  # already installed as transitive dep of FastAPI test client

        prompt = f"""You are a hotel operations classifier. Classify the following guest complaint.

Complaint: "{text}"

Respond ONLY with valid JSON — no markdown, no explanation outside the JSON.
Use exactly these keys:
{{
  "issue_type": "<AC|Plumbing|Electrical|Housekeeping|Food|WiFi|Noise|Maintenance|Other>",
  "department": "<Maintenance|Housekeeping|Kitchen|FrontDesk>",
  "priority": "<Low|Medium|High|Critical>",
  "location": "<room/floor string or null>",
  "required_skill": "<AC Repair|Plumbing|Cleaning|Cooking|General>",
  "confidence": <0.0-1.0>,
  "reasoning": "<one sentence explanation>"
}}"""

        response = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0,
                "max_tokens": 300,
            },
            timeout=10,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()
        data = json.loads(content)

        # Validate required fields and values
        issue_type = data.get("issue_type")
        department = data.get("department")
        priority = data.get("priority")
        required_skill = data.get("required_skill")
        confidence = data.get("confidence")

        # Basic type and presence checks
        if not all([issue_type, department, priority, required_skill]):
            print("[classification_service] Missing required fields in LLM response")
            return None

        # Validate constrained values
        valid_departments = {"Maintenance", "Housekeeping", "Kitchen", "FrontDesk"}
        if department not in valid_departments:
            print(f"[classification_service] Invalid department: {department}")
            return None

        valid_priorities = {"Low", "Medium", "High", "Critical"}
        if priority not in valid_priorities:
            print(f"[classification_service] Invalid priority: {priority}")
            return None

        # Validate confidence
        try:
            confidence = float(confidence)
            if not (0.0 <= confidence <= 1.0):
                print(f"[classification_service] Confidence out of range: {confidence}")
                return None
        except (ValueError, TypeError):
            print(f"[classification_service] Invalid confidence value: {confidence}")
            return None

        return ClassificationResult(
            issue_type=issue_type,
            department=department,
            priority=priority,
            location=data.get("location"),
            required_skill=required_skill,
            confidence=confidence,
            source="llm",
            reasoning=data.get("reasoning", "LLM classification."),
        )

    except Exception as exc:
        # Log but do not crash — fallback will handle it
        print(f"[classification_service] LLM call failed ({type(exc).__name__}: {exc}), using rule-based fallback.")
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def classify_complaint(text: str) -> ClassificationResult:
    """
    Classify a complaint. Tries LLM first if OPENAI_API_KEY is set.
    Always falls back to the deterministic rule-based classifier.

    Returns a fully populated ClassificationResult.
    """
    result = _llm_classify(text)
    if result is None:
        result = _rule_based_classify(text)
    return result
