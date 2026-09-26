import sys
sys.stdout.reconfigure(encoding='utf-8')
import traceback
from backend.database import SessionLocal
from backend.services.pricing_service import get_competitive_analysis
db = SessionLocal()
try:
    analysis = get_competitive_analysis(db, "AC Deluxe")
    print(analysis.model_dump_json(indent=2))
except Exception as e:
    traceback.print_exc()
