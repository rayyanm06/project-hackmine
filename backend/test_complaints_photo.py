import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import Base, engine
import os
import io

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    # No teardown here so we don't drop existing tables for other tests if not needed, 
    # but in-memory DB is used by pytest usually.

def test_complaint_without_room_number_rejected():
    res = client.post("/api/complaints", data={
        "guest_id": 1,
        "text": "AC broken",
        "language": "en"
        # missing room_number
    })
    assert res.status_code == 422
    assert "Field required" in res.text or "field required" in res.text.lower()

def test_complaint_with_room_number_succeeds():
    res = client.post("/api/complaints", data={
        "guest_id": 1,
        "room_number": 101,
        "text": "AC broken",
        "language": "en"
    })
    assert res.status_code == 200
    assert res.json()["room_number"] == 101

def test_complaint_with_valid_photo_succeeds():
    photo_content = b"fake image content"
    photo = io.BytesIO(photo_content)
    photo.name = "test.png"
    
    res = client.post("/api/complaints", 
        data={
            "guest_id": 1,
            "room_number": 101,
            "text": "AC broken",
            "language": "en"
        },
        files={"photo": ("test.png", photo, "image/png")}
    )
    assert res.status_code == 200
    data = res.json()
    photo_path = data["photo_path"]
    assert photo_path is not None
    assert photo_path.startswith("uploads/complaints/")
    
    # Verify photo retrievable (assuming the file was actually written to disk during test)
    assert os.path.exists(photo_path)

def test_complaint_without_photo_succeeds():
    res = client.post("/api/complaints", data={
        "guest_id": 1,
        "room_number": 101,
        "text": "AC broken",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.json()
    assert data.get("photo_path") is None

def test_complaint_with_invalid_file_type_rejected():
    text_content = b"fake text content"
    txt_file = io.BytesIO(text_content)
    txt_file.name = "test.txt"
    
    res = client.post("/api/complaints", 
        data={
            "guest_id": 1,
            "room_number": 101,
            "text": "AC broken",
            "language": "en"
        },
        files={"photo": ("test.txt", txt_file, "text/plain")}
    )
    assert res.status_code == 400
    assert "Photo must be an image file" in res.text

