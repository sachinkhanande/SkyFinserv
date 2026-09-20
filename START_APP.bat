@echo off
title SkyFinserv Loan Portal Launcher
cd /d "%~dp0"
echo ========================================================
echo          SkyFinserv Loan Application Portal
echo ========================================================
echo.
echo [1/3] Checking and clearing port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    if not "%%a"=="" (
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo [2/3] Starting SkyFinserv Local Server...
start "" cmd /k "node server.js"

echo [3/3] Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo ========================================================
echo  SkyFinserv is now running!
echo  URL: http://localhost:3000
echo  Admin: username=admin  password=admin123
echo ========================================================
echo.
pause
