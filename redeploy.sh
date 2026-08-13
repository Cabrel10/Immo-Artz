#!/bin/bash
# IMMO — redéploiement reproductible (backend Laravel :8000, frontend :8092)
# Usage: git clone <repo> && cd Immo-Artz && ./redeploy.sh
set -e
cd "$(dirname "$0")"

git fetch origin
git checkout genspark_ai_developer
git pull origin genspark_ai_developer

echo "=== Backend Laravel ==="
cd backend
composer install --no-interaction --prefer-dist
[ -f .env ] || cp .env.example .env
php artisan key:generate --force 2>/dev/null || true
php artisan migrate --force || true
php artisan config:cache || true
# redémarre le serveur (port 8000)
PID=$(ss -tlnp 2>/dev/null | grep ':8000' | grep -oP 'pid=\K[0-9]+' | head -1 || true)
[ -n "$PID" ] && kill "$PID" 2>/dev/null || true
nohup php artisan serve --host 0.0.0.0 --port 8000 > /tmp/immo_backend.log 2>&1 &
cd ..

echo "=== Frontend Vite build ==="
cd frontend
npm ci
npm run build
# redémarre le serveur statique (port 8092)
PID=$(ss -tlnp 2>/dev/null | grep ':8092' | grep -oP 'pid=\K[0-9]+' | head -1 || true)
[ -n "$PID" ] && kill "$PID" 2>/dev/null || true
nohup npx vite preview --host 0.0.0.0 --port 8092 > /tmp/immo_frontend.log 2>&1 &

sleep 4
curl -sf http://127.0.0.1:8000/api/health >/dev/null && echo "backend :8000 OK" || echo "backend :8000 à vérifier"
curl -sf http://127.0.0.1:8092 >/dev/null && echo "frontend :8092 OK" || echo "frontend :8092 à vérifier"
