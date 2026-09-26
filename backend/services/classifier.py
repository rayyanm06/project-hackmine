import re
from typing import Dict, Any

def classify_complaint_text(text: str, language: str = "English") -> Dict[str, Any]:
    text_lower = text.lower()
    
    # Defaults
    category = "General"
    subcategory = "Other"
    priority = "medium"
    required_skill = "General"
    sentiment = "negative"
    confidence = 0.92
    explanation = "General resort service inquiry or request."

    # AC / HVAC
    if any(k in text_lower for k in ["ac", "air condition", "cooling", "hot in room", "heat", "fan", "blower"]):
        category = "Maintenance"
        subcategory = "AC"
        required_skill = "AC Repair"
        priority = "high"
        confidence = 0.98
        explanation = "Detected HVAC/cooling issue requiring technical inspection."
    
    # Plumbing
    elif any(k in text_lower for k in ["plumb", "leak", "towel", "water", "drain", "toilet", "flush", "sink", "tap", "pani"]):
        if any(k in text_lower for k in ["towel", "linen", "bedsheet", "pillow", "soap", "shampoo"]):
            category = "Housekeeping"
            subcategory = "Amenities"
            required_skill = "Cleaning"
            priority = "low"
            confidence = 0.95
            explanation = "Guest requested extra room amenities / housekeeping replenishment."
        else:
            category = "Maintenance"
            subcategory = "Plumbing"
            required_skill = "Plumbing"
            priority = "high" if "leak" in text_lower or "flood" in text_lower else "medium"
            confidence = 0.96
            explanation = "Plumbing or water system malfunction detected."

    # Food / Kitchen
    elif any(k in text_lower for k in ["food", "breakfast", "dinner", "lunch", "meal", "coffee", "tea", "kitchen", "khana"]):
        category = "Kitchen"
        subcategory = "Food & Beverage"
        required_skill = "Cooking"
        priority = "high" if "cold" in text_lower or "bad" in text_lower or "spoil" in text_lower else "medium"
        confidence = 0.94
        explanation = "Dining or room service culinary request."

    # Electrical
    elif any(k in text_lower for k in ["light", "power", "switch", "socket", "tv", "remote", "bulb", "fuse"]):
        category = "Maintenance"
        subcategory = "Electrical"
        required_skill = "Electrical"
        priority = "medium"
        confidence = 0.93
        explanation = "In-room electrical or appliance fault detected."

    # Cleanliness
    elif any(k in text_lower for k in ["clean", "dirty", "trash", "dust", "smell", "odor", "stain", "sweep"]):
        category = "Housekeeping"
        subcategory = "Cleaning"
        required_skill = "Cleaning"
        priority = "medium"
        confidence = 0.97
        explanation = "Housekeeping deep cleaning or room turnover required."

    # Emergency / Critical
    if any(k in text_lower for k in ["fire", "smoke", "medical", "injury", "emergency", "blood", "theft", "danger"]):
        priority = "critical"
        confidence = 0.99
        explanation = "URGENT: Emergency safety or security situation flagged."

    return {
        "category": category,
        "subcategory": subcategory,
        "priority": priority,
        "required_skill": required_skill,
        "sentiment": sentiment,
        "confidence": confidence,
        "explanation": explanation
    }
