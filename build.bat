@echo off
title vVideosdownloaderPro v2 - Compilacion de Produccion
color 0A
echo ==============================================================
echo       vVideosdownloaderPro v2 - COMPILACION DEL SISTEMA
echo ==============================================================
echo.

:: 1. Validar / Compilar Backend Python
echo [1/2] Verificando y pre-compilando Backend Python...
if not exist "%~dp0backend\venv\Scripts\python.exe" (
    echo Creando entorno virtual Python...
    python -m venv "%~dp0backend\venv"
)

echo Instalando dependencias de Python...
"%~dp0backend\venv\Scripts\python.exe" -m pip install -q -r "%~dp0backend\requirements.txt"

echo Validando sintaxis de modulos Python...
"%~dp0backend\venv\Scripts\python.exe" -m compileall -q "%~dp0backend"
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Error al compilar los archivos del backend Python.
    pause
    exit /b 1
)
echo [OK] Backend compilado y verificado con exito.
echo.

:: 2. Compilar Frontend Next.js para produccion
echo [2/2] Compilando Frontend Next.js para produccion (npm run build)...
cd /d "%~dp0frontend"
call npm.cmd run build
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Error durante la compilacion de Next.js.
    pause
    exit /b 1
)

echo.
echo ==============================================================
echo       COMPILACION FINALIZADA EXITOSAMENTE (100%% OK)
echo ==============================================================
echo.
echo Para iniciar la aplicacion:
echo   - Modo Desarrollo / Pruebas:  ejecuta  iniciar.bat
echo   - Modo Produccion Frontend:   cd frontend ^&^& npm run start
echo   - Modo Produccion Backend:    cd backend ^&^& uvicorn main:app --host 0.0.0.0 --port 8000
echo.
pause
