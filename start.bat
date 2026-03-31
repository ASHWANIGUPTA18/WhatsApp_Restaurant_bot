@echo off
title WhatsApp Food Bot Launcher
color 0A

echo ================================================
echo        WhatsApp Food Bot - Starting Up
echo ================================================
echo.

:: Step 1 — Start Docker containers (PostgreSQL + Redis)
echo [1/4] Starting Docker services (PostgreSQL + Redis)...
docker compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Docker failed to start. Is Docker Desktop running?
    pause
    exit /b 1
)

:: Wait for containers to be healthy
echo       Waiting for services to be ready...
timeout /t 5 /nobreak > nul

:: Step 2 — Prisma generate + migrate
echo [2/4] Running Prisma generate...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed.
    pause
    exit /b 1
)

echo       Running Prisma migrations...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: Prisma migrate failed. Check your DATABASE_URL in .env
    pause
    exit /b 1
)

:: Step 3 — Start dev server in new window
echo [3/4] Starting Bot Server (tsx watch)...
start "WhatsApp Bot Server" cmd /k "cd /d "%~dp0" && npm run dev"

timeout /t 3 /nobreak > nul

:: Step 4 — Start ngrok tunnel in new window
echo [4/4] Starting Ngrok Tunnel...
start "Ngrok Tunnel" cmd /k "npx ngrok http --domain=nasofrontal-ashli-acapnial.ngrok-free.dev 3000"

echo.
echo ================================================
echo  All services started successfully!
echo ================================================
echo.
echo  Server:   http://localhost:3000
echo  Tunnel:   https://nasofrontal-ashli-acapnial.ngrok-free.dev
echo.
echo  Webhook (Twilio):
echo  https://nasofrontal-ashli-acapnial.ngrok-free.dev/webhook/whatsapp/twilio
echo.
echo  Webhook (Meta):
echo  https://nasofrontal-ashli-acapnial.ngrok-free.dev/webhook/whatsapp
echo.
echo  Admin Panel:
echo  http://localhost:3000/admin
echo.
echo  Press any key to STOP all services and shut down Docker...
pause > nul

:: Cleanup on exit
echo.
echo Stopping Docker services...
docker compose down
echo Done. Goodbye!
timeout /t 2 /nobreak > nul
