import os
import json
import httpx
from typing import List, Dict, Any
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from backend.models.complaint import Complaint
from backend.models.task import Task
from backend.schemas.intelligence import SystemicIssue, SystemicIssueResponse

def _llm_synthesize_pattern(cluster: dict) -> str:
    """Uses LLM to summarize the pattern, if available."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return ""

    prompt = f"""You are a resort operations AI. 
Summarize the following cluster of recent complaints into a single concise sentence.
Use ONLY the supplied data. Do not invent rooms, counts, or statistical significance.
Do not claim a root cause unless directly supported.

COMPLAINTS DATA:
{json.dumps(cluster, indent=2)}

Respond ONLY with valid JSON using this exact schema:
{{
  "summary": "<Single sentence summary>"
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
            
        data = json.loads(content.strip())
        return data.get("summary", "")
    except Exception as exc:
        print(f"[anomaly_service] LLM synthesis failed: {exc}")
        return ""

def detect_systemic_issues(db: Session) -> SystemicIssueResponse:
    # Look at the last 24 hours of complaints
    time_window = datetime.utcnow() - timedelta(hours=24)
    
    # We join with Task to get issue_type if available
    records = db.query(Complaint, Task).outerjoin(
        Task, Complaint.id == Task.complaint_id
    ).filter(
        Complaint.created_at >= time_window
    ).all()

    # Group by issue_type (or derived from text if task not yet created)
    clusters: Dict[str, List[Dict[str, Any]]] = {}

    for comp, task in records:
        issue_type = "unknown"
        if task and task.issue_type:
            issue_type = task.issue_type.lower()
        else:
            # Deterministic fallback for unclassified seed data
            text_lower = comp.text.lower()
            if "ac" in text_lower or "cooling" in text_lower or "hot" in text_lower:
                issue_type = "hvac"
            elif "plumb" in text_lower or "leak" in text_lower or "water" in text_lower:
                issue_type = "plumbing"
            elif "clean" in text_lower:
                issue_type = "housekeeping"
            elif "noise" in text_lower:
                issue_type = "noise"
            elif "food" in text_lower or "spicy" in text_lower:
                issue_type = "dining"
        
        if issue_type not in clusters:
            clusters[issue_type] = []
            
        floor = "Unknown"
        if comp.room_number:
            floor = f"Floor {str(comp.room_number)[0]}"
            
        clusters[issue_type].append({
            "id": comp.id,
            "text": comp.text,
            "room_number": comp.room_number,
            "floor": floor,
            "priority": task.priority if task and task.priority else "Medium"
        })

    issues = []
    
    for issue_type, items in clusters.items():
        # THRESHOLD: 3 or more related complaints
        if len(items) >= 3:
            
            # Check for high priority
            high_priority_count = sum(1 for i in items if i["priority"].lower() in ["high", "critical"])
            if len(items) >= 4 or high_priority_count >= 2:
                severity = "high"
            else:
                severity = "medium"
                
            rooms_affected = sorted(list(set(str(i["room_number"]) for i in items if i["room_number"])))
            floors_affected = sorted(list(set(i["floor"] for i in items if i["floor"] != "Unknown")))
            
            # Deterministic summary fallback
            deterministic_summary = f"{len(items)} recent complaints share the issue type {issue_type.upper()}."
            
            # Attempt AI synthesis
            ai_summary = _llm_synthesize_pattern({
                "issue_type": issue_type,
                "complaints": items
            })
            
            final_summary = ai_summary if ai_summary else deterministic_summary
            source = "hybrid" if ai_summary else "rule_based"
            
            evidence = [
                f"{len(items)} {issue_type.upper()}-related complaints recorded",
            ]
            if rooms_affected:
                evidence.append(f"Rooms affected: {', '.join(rooms_affected)}")
            if floors_affected:
                evidence.append(f"Locations affected: {', '.join(floors_affected)}")

            issues.append(
                SystemicIssue(
                    type="recurring_issue",
                    title=f"Emerging {issue_type.upper()} Pattern",
                    severity=severity,
                    summary=final_summary,
                    evidence=evidence,
                    source=source
                )
            )

    return SystemicIssueResponse(issues=issues)
