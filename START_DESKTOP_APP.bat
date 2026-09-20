@echo off
title SkyFinserv Desktop App Launcher
cd /d "%~dp0"
echo ========================================================
echo       SkyFinserv Native Desktop App Launcher
echo ========================================================
echo.
echo [1/2] Clearing any previous instances on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    if not "%%a"=="" (
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo [2/2] Launching SkyFinserv Native Desktop Window...
npm run electron
pause
