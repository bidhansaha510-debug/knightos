@echo off
title KnightOS Launcher
cd /d "%~dp0"

echo ==========================================
echo       KnightOS Chess Platform Launcher
echo ==========================================
echo.

:: Launch the Fastify API Backend
echo [1/2] Launching Fastify API Server (Port 3001)...
start "KnightOS API Server" cmd /k "pnpm --filter api dev"

:: Launch the Vite React Frontend
echo [2/2] Launching React Frontend (Port 5173)...
start "KnightOS Frontend" cmd /k "pnpm --filter web dev"

echo.
echo ==========================================
echo Launch complete! Both servers are running.
echo Open http://localhost:5173 in your browser.
echo ==========================================
pause
