@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Can cai Node.js 20 tro len de chay du an.
  pause
  exit /b 1
)
echo Mo trinh duyet tai http://localhost:3000
node --watch server.mjs --dev
pause
