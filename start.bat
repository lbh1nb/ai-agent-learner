@echo off
title AI Coding Learner

cd /d "%~dp0"

rem Add Node.js to PATH (fixes npm not found when double-clicking from desktop)
set "NODE_PATH=%USERPROFILE%\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\vm\tools\node"
set "PATH=%NODE_PATH%;%NODE_PATH%\..\bin;%PATH%"

set ELECTRON_CACHE=%~dp0.electron-cache
set electron_config_cache=%~dp0.electron-cache

echo ======================================
echo   AI Coding Learner - Starting...
echo ======================================
echo.

if not exist "node_modules\" (
    echo [ERROR] node_modules not found. Please run: npm install
    pause
    exit /b 1
)

if not exist "node_modules\electron\dist\electron.exe" (
    echo [WARN] Electron binary missing, downloading...
    node node_modules\electron\install.js
    if errorlevel 1 (
        echo [ERROR] Electron download failed.
        pause
        exit /b 1
    )
)

echo [OK] Starting application...
echo.
call npm run dev
pause