# Smart Resort 360 Backend

## Setup and Run Instructions

### 1. Create a virtual environment

```bash
cd backend
python -m venv venv
```

### 2. Activate virtual environment and install requirements

On Windows:
```bash
venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Run Seed Data

```bash
python seed_data.py
```
This will automatically create the `app.db` SQLite database and populate it with sample users, staff members, skills, and complaints.

### 4. Start FastAPI Application

```bash
uvicorn main:app --reload
```

## API Endpoints Available

- **GET /health**: Returns `{ "status": "ok" }`
- **POST /api/complaints**: Submit a new complaint.
- **GET /api/complaints**: Retrieve all complaints.
- **GET /api/complaints/{id}**: Retrieve a single complaint.
- **GET /api/tasks**: Retrieve all tasks.
- **GET /api/tasks/{id}**: Retrieve a single task.

## Database Location
The SQLite database is stored locally in `backend/app.db`.
