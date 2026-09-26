import urllib.request
import json

endpoints = [
    ("/health", "GET", None),
    ("/api/staff", "GET", None),
    ("/api/rooms", "GET", None),
    ("/api/complaints", "GET", None),
    ("/api/tasks", "GET", None),
    ("/api/audit", "GET", None),
    ("/api/stats", "GET", None),
    ("/api/pricing/competitive-analysis?room_type=AC%20Deluxe", "GET", None),
    ("/api/intelligence/next-action", "GET", None),
    ("/api/complaints", "POST", {"guest_id": 2, "room_number": 101, "text": "Test complaint", "language": "en"})
]

for endpoint, method, body in endpoints:
    url = f"http://127.0.0.1:8000{endpoint}"
    req = urllib.request.Request(url, method=method)
    if body:
        req.add_header('Content-Type', 'application/json')
        req.data = json.dumps(body).encode('utf-8')
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            data = json.loads(response.read().decode())
            print(f"{method} {endpoint} -> {status}, count: {len(data) if isinstance(data, list) else 1}")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode()
        print(f"{method} {endpoint} -> {e.code}, Error: {err_msg}")
    except Exception as e:
        print(f"{method} {endpoint} -> Failed: {e}")
