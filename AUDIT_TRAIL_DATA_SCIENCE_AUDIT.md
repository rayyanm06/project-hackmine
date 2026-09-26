# Audit Trail Data Science Audit

## 1. Which events are currently written to AuditLog
- `complaint_processed` (When a complaint is submitted, logged in `backend/routes/complaints.py`).
- `next_best_action_generated` (When Next Best Action is requested, deduplicated, logged in `backend/routes/intelligence.py`).
- `TASK_STATUS_CHANGED` (When task transitions state, logged in `backend/routes/tasks.py`).

## 2. Which AI decisions are currently logged
- Complaint Classification (issue_type, department, priority, required_skill, confidence) inside `complaint_processed`.

## 3. Which rule-based decisions are logged
- Next Best Action is logged with its `source` (e.g. `rule_based` or `llm`) and `action`.

## 4. Which assignment decisions are logged
- Staff assignment logic is logged under `complaint_processed`. It includes `staff_id`, `staff_name`, `score`, `score_breakdown`, and `reasoning`.

## 5. Which complaint classification decisions are logged
- Logged under `complaint_processed` including AI confidence and metadata.

## 6. Which Next Best Action decisions are logged
- Logged on the read path with deduplication in `backend/routes/intelligence.py` as `next_best_action_generated`.

## 7. Which pricing decisions are logged
- Currently, NO pricing decisions are logged.

## 8. Which recommendation decisions are logged
- Currently, NO room recommendation decisions are logged.

## 9. What information is stored inside the audit details JSON
- **complaint_processed**: 
  ```json
  {
      "complaint_id": 1,
      "task_id": 1,
      "classification": {
          "issue_type": "...",
          "department": "...",
          "priority": "...",
          "required_skill": "...",
          "confidence": 0.95,
          "reasoning": "...",
          "source": "..." // Not fully standardized yet
      },
      "assignment": {
          "staff_id": 1,
          "staff_name": "...",
          "score": 0.96,
          "score_breakdown": {...},
          "reasoning": "..."
      }
  }
  ```
- **next_best_action_generated**:
  ```json
  {
      "source": "rule_based",
      "action": "..."
  }
  ```
- **TASK_STATUS_CHANGED**:
  ```json
  {
      "old_status": "assigned",
      "new_status": "in_progress"
  }
  ```

## 10. Whether the current AuditLog schema can support richer explainability without a database migration
- YES. The `AuditLog` table has a `details_json` field which is a standard SQLAlchemy `JSON` column. Because JSON is flexible, we can embed rich explainability details (like `model`, `confidence`, `features`, `algorithm`) into this column without executing any Alembic migration or schema change. 

## Limitations & Needed Improvements
- We need to standardize the JSON structure to separate the event type and standard fields (`model`, `source`, `confidence`, `evidence`, `reasoning`).
- The `action` strings should be standardized to `COMPLAINT_CLASSIFICATION`, `STAFF_ASSIGNMENT`, `NEXT_BEST_ACTION`, `EMERGING_PATTERN`, `PRICING_INTELLIGENCE`, `ROOM_RECOMMENDATION`, `TASK_STATUS_CHANGED`, `SYSTEM_EVENT`.
- `backend/routes/complaints.py` currently logs both classification and assignment in a single `complaint_processed` event. We should decouple them into `COMPLAINT_CLASSIFICATION` and `STAFF_ASSIGNMENT` events.
- Need to add logging for Pricing (`PRICING_INTELLIGENCE`), Emerging Pattern (`EMERGING_PATTERN`), and Room Recommendation (`ROOM_RECOMMENDATION`).
- The frontend `_layout.audit.tsx` must be overhauled to render this structured data beautifully, preserving existing Shadcn styling.
