import os
import json
import httpx
from typing import Optional, List, Dict, Any
from backend.schemas.intelligence import RecommendationResponse
from backend.models.task import Task
from backend.models.staff import Staff
from backend.models.room import Room
from backend.models.assignment import Assignment

def _deterministic_recommendation(
    unassigned_high_priority: List[Task],
    unassigned_all: List[Task],
    stalled_tasks: List[Task],
    overloaded_staff: List[Any],
    maintenance_rooms: List[Room]
) -> RecommendationResponse:
    """Fallback deterministic rule-based prioritization."""
    
    # 1. High-priority unassigned task exists
    if unassigned_high_priority:
        task = unassigned_high_priority[0]
        return RecommendationResponse(
            action=f"Assign {task.priority} priority task TSK-{task.id} ({task.issue_type})",
            reason=f"A {task.priority} priority {task.department} task is currently unassigned.",
            priority=task.priority.lower(),
            evidence=[
                f"Task TSK-{task.id} is {task.priority} priority",
                f"Task TSK-{task.id} is unassigned",
                f"Location: {task.location or 'Unknown'}"
            ],
            source="rule_based"
        )
        
    # 2. Staff member has excessive workload
    if overloaded_staff:
        staff_data = overloaded_staff[0]
        return RecommendationResponse(
            action=f"Rebalance workload for {staff_data['name']}",
            reason=f"{staff_data['name']} has {staff_data['count']} active tasks. Consider reassigning to available staff.",
            priority="medium",
            evidence=[
                f"Staff {staff_data['name']} has {staff_data['count']} active tasks"
            ],
            source="rule_based"
        )
        
    # 3. Room unavailable due to maintenance
    if maintenance_rooms:
        room = maintenance_rooms[0]
        return RecommendationResponse(
            action=f"Check maintenance status for Room {room.room_number}",
            reason=f"Room {room.room_number} is unavailable due to maintenance.",
            priority="medium",
            evidence=[
                f"Room {room.room_number} is in maintenance status",
                f"Room {room.room_number} cannot be assigned to guests"
            ],
            source="rule_based"
        )
        
    # 4. Any unassigned task
    if unassigned_all:
        task = unassigned_all[0]
        return RecommendationResponse(
            action=f"Assign task TSK-{task.id} ({task.issue_type})",
            reason="A task is awaiting staff assignment.",
            priority=task.priority.lower(),
            evidence=[
                f"Task TSK-{task.id} is {task.priority} priority",
                f"Task TSK-{task.id} is unassigned"
            ],
            source="rule_based"
        )
        
    # 5. No urgent issue
    return RecommendationResponse(
        action="Operations are stable",
        reason="No urgent unassigned tasks or overloaded staff detected.",
        priority="low",
        evidence=[
            "0 unassigned high-priority tasks",
            "0 overloaded staff members"
        ],
        source="rule_based"
    )

def _llm_recommendation(snapshot: dict) -> Optional[RecommendationResponse]:
    """Ask OpenAI for the next best action using a structured prompt."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None

    prompt = f"""You are an operational intelligence AI for a resort.
Given the current operational state below, determine the single most important "Next Best Action" for the manager to take.
Base your recommendation ONLY on the provided data. Do not invent tasks, staff, or numbers.

OPERATIONAL SNAPSHOT:
{json.dumps(snapshot, indent=2)}

Respond ONLY with valid JSON. Use exactly this schema:
{{
  "action": "<Short, actionable directive (e.g., 'Reassign TSK-14 to Alice')>",
  "reason": "<One sentence explaining why this is the highest priority>",
  "priority": "<high|medium|low>",
  "evidence": [
    "<Bullet point 1 referencing specific task IDs, staff, or room numbers from the data>",
    "<Bullet point 2...>"
  ]
}}
"""

    try:
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
        
        # sometimes LLMs wrap JSON in markdown backticks
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
            
        data = json.loads(content.strip())

        return RecommendationResponse(
            action=data["action"],
            reason=data["reason"],
            priority=data.get("priority", "medium").lower(),
            evidence=data.get("evidence", []),
            source="ai"
        )
    except Exception as exc:
        print(f"[intelligence_service] LLM call failed ({type(exc).__name__}: {exc}). Using fallback.")
        return None

def get_next_best_action(
    active_tasks: List[Task], 
    staff: List[Staff], 
    rooms: List[Room],
    staff_task_counts: dict
) -> RecommendationResponse:
    
    unassigned_tasks = [t for t in active_tasks if t.status == 'created']
    unassigned_high_priority = [t for t in unassigned_tasks if t.priority in ['High', 'high', 'Critical', 'critical']]
    stalled_tasks = [t for t in active_tasks if t.status == 'in_progress'] # Simplification
    maintenance_rooms = [r for r in rooms if r.status == 'maintenance']
    
    overloaded_staff = []
    for s in staff:
        count = staff_task_counts.get(s.id, 0)
        if count >= 3:
            overloaded_staff.append({"id": s.id, "name": s.user.name, "count": count})

    # Prepare snapshot for LLM
    snapshot = {
        "unassigned_high_priority_tasks": [{"id": t.id, "priority": t.priority, "issue": t.issue_type} for t in unassigned_high_priority],
        "unassigned_other_tasks": [{"id": t.id, "priority": t.priority, "issue": t.issue_type} for t in unassigned_tasks if t not in unassigned_high_priority],
        "overloaded_staff": overloaded_staff,
        "available_staff_count": len([s for s in staff if s.available]),
        "rooms_in_maintenance": [r.room_number for r in maintenance_rooms]
    }

    # Try LLM first
    result = _llm_recommendation(snapshot)
    if result:
        return result
        
    # Fallback to deterministic
    return _deterministic_recommendation(
        unassigned_high_priority, 
        unassigned_tasks, 
        stalled_tasks, 
        overloaded_staff, 
        maintenance_rooms
    )
