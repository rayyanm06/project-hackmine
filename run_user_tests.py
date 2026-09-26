from fastapi.testclient import TestClient
from backend.main import app
import json

client = TestClient(app)

print("--- HINDI COMPLAINT 1 ---")
res1 = client.post("/api/complaints", data={
    "guest_id": 1,
    "room_number": 101,
    "text": "pani tapak raha hai",
    "language": "hi"
})
print(json.dumps(res1.json(), indent=2))

print("--- HINDI COMPLAINT 2 ---")
res2 = client.post("/api/complaints", data={
    "guest_id": 1,
    "room_number": 102,
    "text": "bijli chali gayi",
    "language": "hi"
})
print(json.dumps(res2.json(), indent=2))

print("--- ROOM NUMBER OMITTED ---")
res3 = client.post("/api/complaints", data={
    "guest_id": 1,
    "text": "no room number provided",
    "language": "en"
})
print(res3.status_code)
print(json.dumps(res3.json(), indent=2))
