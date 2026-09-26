Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting Smart Resort 360 (Frontend + Backend)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Write-Host "Frontend running at: http://127.0.0.1:5173" -ForegroundColor Green
Write-Host "Backend running at:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "API Swagger Docs at: http://127.0.0.1:8000/docs" -ForegroundColor Green
