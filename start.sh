#!/bin/bash
# RapidMart — one-command startup script
# Usage: ./start.sh

echo "🚀 Starting RapidMart..."

# ── 1. Start Docker Desktop if not running ───────────────────
if ! docker info &>/dev/null; then
  echo "🐳 Launching Docker Desktop..."
  open -a Docker
  echo "   Waiting for Docker to be ready..."
  until docker info &>/dev/null; do sleep 2; done
  echo "   ✅ Docker is ready"
else
  echo "✅ Docker already running"
fi

# ── 2. Start MongoDB container ───────────────────────────────
if ! docker ps --format '{{.Names}}' | grep -q "^freshcart_mongo$"; then
  echo "🍃 Starting MongoDB..."
  docker start freshcart_mongo 2>/dev/null || docker compose up -d mongodb
  echo "   Waiting for MongoDB to be healthy..."
  until nc -z 127.0.0.1 27017 &>/dev/null; do sleep 2; done
  echo "   ✅ MongoDB is ready"
else
  echo "✅ MongoDB already running"
fi

# ── 3. Kill any stale Next.js processes ─────────────────────
for port in 3000 3001 3002; do
  pid=$(lsof -ti :$port 2>/dev/null)
  [ -n "$pid" ] && kill -9 $pid 2>/dev/null
done
sleep 1

# ── 4. Start dev server ──────────────────────────────────────
echo "⚡ Starting Next.js dev server..."
npm run dev
