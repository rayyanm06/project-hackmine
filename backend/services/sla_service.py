import datetime
from sqlalchemy.orm import Session
from backend.models import Task, AuditLog
from backend.config.sla_config import SLA_THRESHOLDS, STALLED_AFTER_MINUTES

def get_sla_status(task: Task, now: datetime.datetime = None):
    if now is None:
        now = datetime.datetime.utcnow()
        
    status = task.status.lower()
    
    if status not in ["assigned", "in_progress"]:
        return None

    # Determine SLA minutes based on priority
    # SLA_THRESHOLDS has keys "High", "Medium", "Low"
    priority = (task.priority or "low").capitalize()
    sla_minutes = SLA_THRESHOLDS.get(priority, 60)
    
    if status == "assigned":
        # Find assigned_at
        assigned_at = None
        if task.assignments:
            assigned_at = task.assignments[-1].assigned_at
        else:
            # Fallback to status history
            sorted_history = sorted(task.status_history, key=lambda x: x.timestamp)
            for history in reversed(sorted_history):
                if history.new_status == "assigned":
                    assigned_at = history.timestamp
                    break
        
        if not assigned_at:
            return None # Cannot calculate
            
        elapsed_minutes = (now - assigned_at).total_seconds() / 60.0
        elapsed_pct = elapsed_minutes / sla_minutes
        
        sla_deadline = assigned_at + datetime.timedelta(minutes=sla_minutes)
        
        if elapsed_pct < 0.5:
            sla_status = "on_track"
            minutes_remaining = int(sla_minutes - elapsed_minutes)
            return {
                "sla_status": sla_status,
                "sla_deadline": sla_deadline,
                "minutes_remaining": minutes_remaining,
                "reason": "Task is on track within SLA."
            }
        elif elapsed_pct < 1.0:
            sla_status = "at_risk"
            minutes_remaining = int(sla_minutes - elapsed_minutes)
            return {
                "sla_status": sla_status,
                "sla_deadline": sla_deadline,
                "minutes_remaining": minutes_remaining,
                "reason": f"{priority}-priority task is at risk of missing the {sla_minutes}-minute SLA."
            }
        else:
            sla_status = "overdue"
            minutes_overdue = int(elapsed_minutes - sla_minutes)
            return {
                "sla_status": sla_status,
                "sla_deadline": sla_deadline,
                "minutes_overdue": minutes_overdue,
                "reason": f"{priority}-priority task has not been started within the {sla_minutes}-minute SLA."
            }
            
    elif status == "in_progress":
        last_activity_at = None
        sorted_history = sorted(task.status_history, key=lambda x: x.timestamp)
        if sorted_history:
            last_activity_at = sorted_history[-1].timestamp
            
        if not last_activity_at:
            return None
            
        elapsed_minutes = (now - last_activity_at).total_seconds() / 60.0
        
        if elapsed_minutes >= STALLED_AFTER_MINUTES:
            sla_status = "stalled"
            return {
                "sla_status": sla_status,
                "sla_deadline": None,
                "minutes_inactive": int(elapsed_minutes),
                "reason": f"Task has had no activity for {int(elapsed_minutes)} minutes (threshold: {STALLED_AFTER_MINUTES}m)."
            }
        else:
            sla_status = "on_track"
            return {
                "sla_status": sla_status,
                "sla_deadline": None,
                "minutes_inactive": int(elapsed_minutes),
                "reason": "Task is progressing normally."
            }
    
    return None

def process_task_attention(db: Session, task: Task, now: datetime.datetime = None):
    if now is None:
        now = datetime.datetime.utcnow()
        
    sla_info = get_sla_status(task, now)
    if not sla_info:
        return None
        
    new_sla_status = sla_info["sla_status"]
    
    if new_sla_status != task.last_recorded_sla_status:
        # State changed, record audit
        priority = (task.priority or "low").capitalize()
        
        audit_details = {
            "task_status": task.status,
            "staff": task.assignments[-1].staff_name if task.assignments else None,
            "priority": priority,
            "sla_deadline": sla_info.get("sla_deadline").isoformat() if sla_info.get("sla_deadline") else None,
            "current_time": now.isoformat(),
            "sla_status": new_sla_status,
            "reason": sla_info["reason"],
            "source": "rule_based"
        }
        
        if "minutes_remaining" in sla_info:
            audit_details["minutes_remaining"] = sla_info["minutes_remaining"]
        if "minutes_overdue" in sla_info:
            audit_details["overdue_minutes"] = sla_info["minutes_overdue"]
        if "minutes_inactive" in sla_info:
            audit_details["elapsed_minutes"] = sla_info["minutes_inactive"]
            
        audit_log = AuditLog(
            action="TASK_SLA_ESCALATION",
            resource_type="Task",
            resource_id=task.id,
            details_json=audit_details
        )
        db.add(audit_log)
        
        task.last_recorded_sla_status = new_sla_status
        db.commit()
        
    # Find assigned_at or started_at for API response
    activity_at = None
    if task.status.lower() == "assigned":
        if task.assignments:
            activity_at = task.assignments[-1].assigned_at
        else:
            sorted_history = sorted(task.status_history, key=lambda x: x.timestamp)
            for history in reversed(sorted_history):
                if history.new_status == "assigned":
                    activity_at = history.timestamp
                    break
    elif task.status.lower() == "in_progress":
        sorted_history = sorted(task.status_history, key=lambda x: x.timestamp)
        for history in reversed(sorted_history):
            if history.new_status == "in_progress":
                activity_at = history.timestamp
                break
                
    # Format the data for API
    return {
        "id": task.id,
        "location": task.location,
        "issue_type": task.issue_type,
        "priority": task.priority,
        "staff_name": task.assignments[-1].staff_name if task.assignments else None,
        "status": task.status,
        "assigned_at": activity_at.isoformat() if activity_at else None,
        "sla_deadline": sla_info.get("sla_deadline").isoformat() if sla_info.get("sla_deadline") else None,
        "sla_status": new_sla_status,
        "minutes_remaining": sla_info.get("minutes_remaining"),
        "minutes_overdue": sla_info.get("minutes_overdue"),
        "minutes_inactive": sla_info.get("minutes_inactive"),
        "reason": sla_info["reason"]
    }
