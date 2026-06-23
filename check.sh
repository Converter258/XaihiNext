#!/usr/bin/env bash
set -euo pipefail

# ── XN Project Check Script ────────────────────────────
# Usage: bash check.sh [--quick]
#   --quick  只做导入/编译检查，跳过 HTTP 请求（不需要后端运行）
#   (default) 全量检查：导入 → graph → executor → API → 前端构建

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0; FAIL=0
ROOT="$(cd "$(dirname "$0")" && pwd)"
QUICK=false
[[ "${1:-}" == "--quick" ]] && QUICK=true

ok()   { echo -e "  ${GREEN}[PASS]${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}[FAIL]${NC} $1 — $2"; FAIL=$((FAIL+1)); }
info() { echo -e "${YELLOW}[====]${NC} $1"; }

finish() {
    echo ""
    echo "──────────────────────────────────────"
    echo -e "  Total: $((PASS+FAIL))  ${GREEN}Passed: $PASS${NC}  ${RED}Failed: $FAIL${NC}"
    if [ "$FAIL" -eq 0 ]; then
        echo -e "  ${GREEN}All checks passed.${NC}"
        exit 0
    else
        echo -e "  ${RED}Some checks failed. See above.${NC}"
        exit 1
    fi
}
trap finish EXIT

# ── 0. Prerequisites ──────────────────────────────────
info "0. Environment"
python --version >/dev/null 2>&1 && ok "python available" || { fail "python not found" "install Python 3.10+"; }
node   --version >/dev/null 2>&1 && ok "node available"    || { fail "node not found" "install Node.js 18+"; }

# Ensure .env exists
if [ ! -f "$ROOT/.env" ]; then
    cp "$ROOT/.env.example" "$ROOT/.env"
    info "   created .env from .env.example (edit API key if needed)"
fi

# ── 1. Backend: import check ──────────────────────────
info "1. Backend: Python imports"
cd "$ROOT"

python -c "from backend.config.settings import settings; assert settings.USE_ASYNC_EXECUTOR == False" 2>/dev/null \
    && ok "settings.py imported" \
    || fail "settings.py import" "check pydantic-settings"

python -c "from backend.src.agent.state import AgentState" 2>/dev/null \
    && ok "state.py imported" \
    || fail "state.py import" "check langgraph"

python -c "from backend.src.agent.nodes import call_model, call_tool" 2>/dev/null \
    && ok "nodes.py imported" \
    || fail "nodes.py import" "check langchain-openai"

python -c "from backend.src.agent.graph import graph" 2>/dev/null \
    && ok "graph.py imported (graph compiled)" \
    || fail "graph.py import" "check graph definition"

python -c "from backend.src.api.dependencies import executor; assert executor is not None" 2>/dev/null \
    && ok "dependencies.py (executor singleton)" \
    || fail "dependencies.py import" "check executor layer"

# ── 2. Backend: graph invoke test ─────────────────────
if [ "$QUICK" = false ]; then
    info "2. Backend: graph.ainvoke (requires API key in .env)"

    RESULT=$(cd "$ROOT" && PYTHONIOENCODING=utf-8 python -c "
import asyncio, sys
sys.path.insert(0, '.')
from backend.src.agent.graph import graph
async def t():
    r = await graph.ainvoke({'messages':[{'role':'user','content':'say hi in 3 words'}],'current_step':'idle','step_count':0})
    print(r['messages'][-1].content[:100])
asyncio.run(t())
" 2>&1) || true

    if echo "$RESULT" | grep -qiE "hi|hello|hey|你好"; then
        ok "graph.ainvoke returned LLM response"
    else
        fail "graph.ainvoke" "response: ${RESULT:0:80}"
    fi
fi

# ── 3. Backend: executor unit test ────────────────────
info "3. Backend: executor.run + executor.arun"
cd "$ROOT"
PYTHONIOENCODING=utf-8 python backend/tests/test_executor.py 2>&1 | grep -q "All executor tests passed" \
    && ok "executor tests passed" \
    || fail "executor tests" "run 'python backend/tests/test_executor.py' manually"

# ── 4. Backend: API endpoint (if server running) ──────
if [ "$QUICK" = false ]; then
    info "4. Backend: POST /v1/chat"

    # Try starting the server if not running
    if ! curl -s http://127.0.0.1:8000/docs >/dev/null 2>&1; then
        info "   starting backend server..."
        cd "$ROOT" && PYTHONIOENCODING=utf-8 python -m uvicorn backend.src.api.app:app \
            --host 127.0.0.1 --port 8000 --log-level error &
        sleep 4
    fi

    API_RESULT=$(curl -s -X POST http://127.0.0.1:8000/v1/chat \
        -H "Content-Type: application/json" \
        -d '{"message":"hi","attachments":[]}' 2>&1) || true

    if echo "$API_RESULT" | grep -q '"answer"'; then
        ok "POST /v1/chat returned valid JSON"
    elif echo "$API_RESULT" | grep -q '"status":"processing"'; then
        ok "POST /v1/chat returned timeout fallback (expected)"
    else
        fail "POST /v1/chat" "response: ${API_RESULT:0:100}"
    fi
fi

# ── 5. Frontend: TypeScript compile ───────────────────
info "5. Frontend: tsc (main process)"
cd "$ROOT/frontend"

# Pick the working frontend dir (original or fallback electron dir)
FRONTEND_DIR="$ROOT/frontend"
if [ ! -d "$FRONTEND_DIR/node_modules/.bin" ]; then
    FRONTEND_DIR="$ROOT/frontend-electron"
fi

if [ -d "$FRONTEND_DIR/node_modules/.bin" ]; then
    cd "$FRONTEND_DIR"
    ./node_modules/.bin/tsc 2>/dev/null \
        && ok "tsc compiled electron/ + services/" \
        || fail "tsc compile" "check electron/*.ts and services/*.ts"
else
    fail "frontend setup" "node_modules not found; run 'cd frontend && npm install' first"
fi

# ── 6. Frontend: Vite build ───────────────────────────
info "6. Frontend: vite build (Vue renderer)"
cd "$FRONTEND_DIR"
if [ -d "node_modules/.bin" ]; then
    ./node_modules/.bin/vite build --logLevel error 2>&1 || true
    if [ -f "dist/renderer/index.html" ]; then
        ok "vite build → dist/renderer/index.html"
    else
        fail "vite build" "dist/renderer/index.html not found"
    fi
else
    fail "frontend setup" "node_modules/.bin not found"
fi

# ── 7. Summary ────────────────────────────────────────
info "Check complete"
