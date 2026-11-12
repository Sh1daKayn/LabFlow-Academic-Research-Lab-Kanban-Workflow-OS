@echo off
chcp 65001 >nul
title LabFlow Academic Research OS Launcher
color 0B

echo ===============================================================================
echo                LabFlow: Academic Research Kanban & Workflow OS
echo                      Paper-Driven & Blocker-Aware System
echo ===============================================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please download and install Node.js (LTS version recommended) from:
    echo   https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Display Node version
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [*] Detected Node.js: %NODE_VER%

:: 3. Check if dependencies are installed
if not exist "node_modules\" (
    echo [*] First run detected. Installing dependencies (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
)

:: 4. Launch browser after a brief delay in the background
echo [*] Starting LabFlow Local Server on http://localhost:3000 ...
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: 5. Start dev server
call npm run dev
pause
