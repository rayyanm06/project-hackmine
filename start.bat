@echo off
echo ===================================================
echo Starting Smart Resort 360 (Frontend + Backend)
echo ===================================================

echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Smart Resort 360 Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Vite Frontend on http://127.0.0.1:5173 ...
start "Smart Resort 360 Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Services launched!
echo Frontend: http://127.0.0.1:5173
echo Backend:  http://127.0.0.1:8000
echo API Docs: http://127.0.0.1:8000/docs
echo ===================================================
