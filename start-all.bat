@echo off
setlocal enabledelayedexpansion

echo 🚀 Nexus ERP - Tizimni boshlash...
echo ════════════════════════════════

REM 1. Database konteynerini boshlash
echo 📦 Database konteynerini boshlayabman...
docker compose -f docker-compose.yml up -d db

REM 2. Database tayyor bo'lishini kutish
echo ⏳ Database tayyor bo'lishini kutayabman...
timeout /t 3 /nobreak

REM 3. Migrations va seed-ni o'tkazish
echo 🔄 Migratsiyalar va seed-ni o'tkazayabman...
cd backend
call npm run db:migrate
call npm run db:seed

REM 4. Backend va Frontend-ni ishga tushirish
echo.
echo ✅ Database tayyor!
echo ════════════════════════════════
echo 🎯 Backend va Frontend-ni boshlayabman...
echo ════════════════════════════════
echo.
cd ..
call npm run dev

endlocal
