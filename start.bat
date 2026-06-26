@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

:: Force UTF-8 before any output
chcp 65001 >nul 2>&1

title XN Agent Launcher

echo.
echo ==========================================
echo         XN Agent - Launching...
echo ==========================================
echo.

:: --- 0. Check .env ---
if not exist ".env" (
    echo [*] Creating .env from .env.example ...
    copy ".env.example" ".env" >nul
    echo [OK] .env created
) else (
    echo [OK] .env exists
)

:: --- 1. Frontend dir ---
set "FRONTEND=frontend"

:: --- 2. Backend ---
echo.
echo [*] Releasing port 8000 if occupied ...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
    echo     Killed old process PID=%%a on port 8000
)

echo [*] Starting backend server ...
echo     A new CMD window will open for the backend.
echo     Close that window to stop the server.

start "XN Backend :8000" cmd /c "cd /d %CD% && chcp 65001 >nul && python -m uvicorn backend.src.api.app:app --host 127.0.0.1 --port 8000"

echo [*] Waiting for backend (up to 30s) ...
set RETRIES=0
:wait_backend
timeout /t 2 /nobreak >nul
set /a RETRIES+=1
curl.exe -s http://127.0.0.1:8000/docs >nul 2>&1
if errorlevel 1 (
    if !RETRIES! lss 15 goto wait_backend
    echo [WARN] Backend did not respond in time, continuing...
    goto skip_backend_check
)
:skip_backend_check
echo [OK] Backend ready: http://127.0.0.1:8000

:: --- 3. Frontend build ---
echo.
echo [*] Building frontend ...
cd /d "%FRONTEND%"

if exist "node_modules\.bin\tsc.cmd" (
    call node_modules\.bin\tsc.cmd >nul 2>&1
    echo [OK] tsc compiled
) else (
    call npx tsc >nul 2>&1
    echo [OK] tsc compiled (via npx)
)

if exist "node_modules\.bin\vite.cmd" (
    call node_modules\.bin\vite.cmd build --logLevel error >nul 2>&1
) else (
    call npx vite build --logLevel error >nul 2>&1
)
echo [OK] vite built

:: --- 4. Electron ---
echo.
echo [*] Launching Electron ...
start "" /b npx electron . >nul 2>&1

:: --- 5. Done ---
cd /d "%~dp0"
echo.
echo ==========================================
echo   Backend  : http://127.0.0.1:8000
echo   Electron : window should now be open
echo.
echo   Close the "XN Backend" CMD window
echo   to stop the server.
echo ==========================================
echo.
pause
