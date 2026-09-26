from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import AuditLog
import json

client = TestClient(app)

print("=== TEST 1: Basic endpoint ===")
r = client.get("/api/ml/demand-forecast")
print("Status:", r.status_code)
data = r.json()
print("horizon_days:", data["horizon_days"])
print("forecast count:", len(data["forecast"]))
print("Forecast dates:", [d["date"] for d in data["forecast"]])
print("Predictions:", [d["predicted_demand"] for d in data["forecast"]])
print("source:", data["source"])
print("inference_data_source:", data["metrics"]["inference_data_source"])
print("disclaimer (first 80 chars):", data["disclaimer"][:80])

print("\n=== TEST 2: Audit flood test (5 GETs) ===")
db = SessionLocal()
before = db.query(AuditLog).filter(AuditLog.action == "DEMAND_FORECAST_GENERATED").count()
for _ in range(5):
    client.get("/api/ml/demand-forecast")
after = db.query(AuditLog).filter(AuditLog.action == "DEMAND_FORECAST_GENERATED").count()
print(f"Before: {before}, After 5 GETs: {after}")
print("PASS" if after == before else "FAIL - audit flooded")

print("\n=== TEST 3: Event calendar ===")
r = client.get("/api/ml/demand-forecast")
for day in r.json()["forecast"]:
    evt = day.get("event")
    sig = day.get("planning_signal")
    if evt or sig:
        date_val = day["date"]
        print(f"  {date_val}: event={evt}, signal={sig}")
has_events = any(d.get("event") for d in r.json()["forecast"])
print("Events present in this 7-day window:", has_events)
