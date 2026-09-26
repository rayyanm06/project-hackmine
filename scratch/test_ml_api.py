import requests
import traceback

payload = {
    "lead_time": 45,
    "country": "PRT",
    "market_segment": "Online TA",
    "deposit_type": "No Deposit",
    "customer_type": "Transient",
    "total_of_special_requests": 0,
    "previous_cancellations": 0,
    "is_repeated_guest": 0,
    "adults": 2,
    "adr": 105.0,
    "arrival_date_week_number": 27,
    "arrival_date_day_of_month": 4,
    "stays_in_weekend_nights": 0,
    "stays_in_week_nights": 2,
    "children": 0,
    "babies": 0,
    "previous_bookings_not_canceled": 0,
    "booking_changes": 0,
    "agent": 9.0,
    "days_in_waiting_list": 0,
    "required_car_parking_spaces": 0,
    "hotel": "Resort Hotel",
    "arrival_date_year": 2017,
    "arrival_date_month": "July",
    "meal": "BB",
    "distribution_channel": "TA/TO",
    "reserved_room_type": "A"
}

try:
    resp = requests.post("http://127.0.0.1:8000/api/ml/cancellation-risk", json=payload)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    traceback.print_exc()
