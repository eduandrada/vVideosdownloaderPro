@echo off
title OmniPull Media Engine - Watermark Remover
color 0B
echo ==============================================================
echo           OMNIPULL - SUITE MULTIMEDIA ENTERPRISE
echo    Extraccion 4K, Audio 320k y Eliminador de Marcas de Agua
echo ==============================================================
echo.

:: 0. Liberar puertos 8000 y 3000 al instante con script ultra-rápido (<50ms)
echo [0/2] Verificando y liberando puertos...
"%~dp0backend\venv\Scripts\python.exe" "%~dp0backend\free_ports.py"

:: 1. Iniciar Backend FastAPI en su propia ventana
echo [1/2] Iniciando Backend FastAPI (Puerto 8000)...
start "OmniPull Backend API" cmd /k "title OmniPull Backend API && cd /d "%~dp0backend" && .\venv\Scripts\activate.bat && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

:: 2. Iniciar Frontend Next.js en su propia ventana
echo [2/2] Iniciando Frontend Next.js (Puerto 3000)...
start "OmniPull Frontend UI" cmd /k "title OmniPull Frontend UI && cd /d "%~dp0frontend" && npm.cmd run dev"

:: Breve espera de 1 segundo para sincronización
timeout /t 1 /nobreak > nul

echo.
echo ==============================================================
echo   OmniPull esta listo y ejecutandose:
echo   - Plataforma Web UI:  http://localhost:3000
echo   - Backend FastAPI:    http://127.0.0.1:8000
echo   - Documentacion API:  http://127.0.0.1:8000/docs
echo ==============================================================
echo.
echo Abriendo aplicacion en tu navegador...
start http://localhost:3000
exit
