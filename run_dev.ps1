# vVideosdownloaderPro v2 Dev Server Starter
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Iniciando vVideosdownloaderPro v2      " -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend on port 8000
Start-Process -FilePath "c:\Users\Usuario\vVideo\backend\venv\Scripts\python.exe" -ArgumentList "-m uvicorn main:app --host 127.0.0.1 --port 8000 --reload" -WorkingDirectory "c:\Users\Usuario\vVideo\backend"

Write-Host "[Backend] FastAPI iniciado en http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)" -ForegroundColor Green

# 2. Start Next.js Frontend on port 3000
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "c:\Users\Usuario\vVideo\frontend"

Write-Host "[Frontend] Next.js iniciado en http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "¡Listo! Abre tu navegador en http://localhost:3000" -ForegroundColor Yellow
