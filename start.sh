#!/usr/bin/env bash
set -euo pipefail

# ── XN Quick Start ─────────────────────────────────────
# Usage: bash start.sh [--dev]
#   --dev   前端用 Vite dev server (热重载)，否则用构建产物
#   (default)  后端 + 前端构建 + Electron

ROOT="$(cd "$(dirname "$0")" && pwd)"
DEV_MODE=false
[[ "${1:-}" == "--dev" ]] && DEV_MODE=true

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
info() { echo -e "${YELLOW}[start]${NC} $1"; }

# ── 0. Prerequisites ──────────────────────────────────
if [ ! -f "$ROOT/.env" ]; then
    cp "$ROOT/.env.example" "$ROOT/.env"
    info "created .env from .env.example"
fi

# Pick working frontend dir
FRONTEND_DIR="$ROOT/frontend"
if [ ! -d "$FRONTEND_DIR/node_modules/.bin" ]; then
    FRONTEND_DIR="$ROOT/frontend-electron"
fi

# ── 1. Backend ────────────────────────────────────────
info "Starting backend (uvicorn port 8000)..."

# Kill existing uvicorn on port 8000 if any
EXISTING=$(cat /proc/net/tcp 2>/dev/null | awk '{print $2}' | grep -x "$(printf '%04X' 8000)" || true)
if [ -n "$EXISTING" ]; then
    info "Port 8000 in use, reusing existing server"
else
    cd "$ROOT"
    PYTHONIOENCODING=utf-8 python -m uvicorn backend.src.api.app:app \
        --host 127.0.0.1 --port 8000 --log-level warning &
    sleep 3
fi

# Quick health check
if curl -s http://127.0.0.1:8000/docs >/dev/null 2>&1; then
    echo -e "  ${GREEN}[OK]${NC} Backend running at http://127.0.0.1:8000"
else
    echo "  [WARN] Backend may still be starting..."
fi

# ── 2. Frontend ───────────────────────────────────────
info "Building frontend..."

cd "$FRONTEND_DIR"
./node_modules/.bin/tsc 2>/dev/null
echo -e "  ${GREEN}[OK]${NC} tsc compiled"

./node_modules/.bin/vite build --logLevel error 2>/dev/null
echo -e "  ${GREEN}[OK]${NC} vite built"

# ── 3. Electron ───────────────────────────────────────
if [ "$DEV_MODE" = true ]; then
    info "Starting Vite dev server (port 5173)..."
    ./node_modules/.bin/vite --host 127.0.0.1 &
    sleep 2
    echo -e "  ${GREEN}[OK]${NC} Vite dev server at http://127.0.0.1:5173"

    info "Launching Electron (dev mode)..."
    cd "$FRONTEND_DIR"
    NODE_ENV=development npx electron . &
else
    info "Launching Electron..."
    cd "$FRONTEND_DIR"
    npx electron . &
fi

sleep 5

# ── 4. Done ──────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  XN Agent is running${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
echo "  Backend : http://127.0.0.1:8000/docs"
if [ "$DEV_MODE" = true ]; then
    echo "  Frontend: http://127.0.0.1:5173 (hot reload)"
else
    echo "  Frontend: Electron window"
fi
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

# Keep script alive; kill children on Ctrl+C
trap 'info "Stopping..."; kill 0; exit 0' INT TERM
wait
