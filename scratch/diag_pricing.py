import traceback
from backend.database import SessionLocal
from backend.services.pricing_service import get_competitive_analysis

db = SessionLocal()
try:
    analysis = get_competitive_analysis(db, "AC Deluxe")
    print(analysis)
except Exception as e:
    traceback.print_exc()
