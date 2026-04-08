#!/bin/bash

set -e

echo "🚀 Nexus ERP - Tizimni boshlash..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Database konteynerini boshlash
echo "📦 Database konteynerini boshlayabman..."
docker compose -f docker-compose.yml up -d db

# 2. Database tayyor bo'lishini kutish
echo "⏳ Database tayyor bo'lishini kutayabman..."
sleep 3

# 3. Migrations va seed-ni o'tkazish
echo "🔄 Migratsiyalar va seed-ni o'tkazayabman..."
cd backend
npm run db:migrate
npm run db:seed

# 4. Backend va Frontend-ni ishga tushirish
echo ""
echo "✅ Database tayyor!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Backend va Frontend-ni boshlayabman..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cd ..
npm run dev
