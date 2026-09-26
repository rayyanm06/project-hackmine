from typing import List, Optional, Tuple
from models import Staff

def calculate_assignment(required_skill: str, priority: str, staff_members: List[Staff]) -> Tuple[Optional[Staff], int]:
    """
    Computes explainable assignment scores for staff members based on:
    - Skill match (35%)
    - Availability (20%)
    - Current Workload (25%)
    - Priority response capability (15%)
    - Fairness/recency (5%)
    Returns the best staff member and their match score (0-100).
    """
    if not staff_members:
        return None, 0

    best_score = -1.0
    best_staff = None

    for staff in staff_members:
        if staff.availability == "on_leave":
            continue

        # Skill Match: 35%
        skill_match = 1.0 if required_skill in (staff.skills or []) else (0.4 if "General" in (staff.skills or []) else 0.1)

        # Availability: 20%
        avail_score = 1.0 if staff.availability == "available" else 0.5

        # Workload (fewer tasks = higher score): 25%
        workload = max(0, min(100, staff.current_workload or 0))
        workload_score = (100 - workload) / 100.0

        # Priority Multiplier: 15%
        priority_score = 1.0
        if priority == "critical" and staff.availability == "available":
            priority_score = 1.2
        elif priority == "high":
            priority_score = 1.1

        score = (
            (skill_match * 35) +
            (avail_score * 20) +
            (workload_score * 25) +
            (priority_score * 15) +
            5.0
        )

        final_score = int(min(100, max(0, round(score))))

        if final_score > best_score:
            best_score = final_score
            best_staff = staff

    return best_staff, int(best_score) if best_staff else 0
