@echo off
title Trend Scout Pro

echo.
echo  ========================================
echo   Trend Scout Pro - Starting...
echo  ========================================
echo.

:: Navigate to project folder
cd /d "%~dp0"

:: Check if node_modules exists, install if not
if not exist "node_modules\" (
    echo  [1/2] Installing dependencies...
    npm install
    echo.
)

:: Open browser after a short delay (runs in background)
echo  [2/2] Starting dev server...
echo.
echo  App will open at: http://localhost:8080
echo.
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:8080"

:: Start the dev server
npm run dev

pause
