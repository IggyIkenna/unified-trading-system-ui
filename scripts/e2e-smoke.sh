#!/usr/bin/env bash
# E2E smoke test — starts API + UI in mock mode, runs Playwright tests, cleans up.
#
# Usage:
#   bash scripts/e2e-smoke.sh                  # Run all E2E tests
#   bash scripts/e2e-smoke.sh --tier1          # Navigation-only tests (fast)
#   bash scripts/e2e-smoke.sh --headed         # Run with browser visible
#
# Requirements:
#   - unified-trading-api repo at ../unified-trading-api with .venv set up
#   - Node.js + pnpm installed
#   - Playwright browsers installed: npx playwright install chromium

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
API_DIR="$(cd "$UI_DIR/../unified-trading-api" && pwd)"

TIER=""
HEADED=""
for arg in "$@"; do
    case $arg in
        --tier1) TIER="--grep @tier1" ;;
        --tier2) TIER="--grep @tier2" ;;
        --headed) HEADED="--headed" ;;
    esac
done

cleanup() {
    echo "Cleaning up..."
    [[ -n "${API_PID:-}" ]] && kill "$API_PID" 2>/dev/null || true
    [[ -n "${UI_PID:-}" ]] && kill "$UI_PID" 2>/dev/null || true
    # Reset demo state
    curl -s -X POST http://localhost:8030/admin/reset >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "=== E2E Smoke Test ==="

# 1. Start API in mock mode
echo "[1/5] Starting unified-trading-api (port 8030, mock mode)..."
if [[ ! -d "$API_DIR" ]]; then
    echo "ERROR: unified-trading-api not found at $API_DIR"
    exit 1
fi
cd "$API_DIR"
CLOUD_MOCK_MODE=true DISABLE_AUTH=true \
    .venv/bin/python -m unified_trading_api.main &
API_PID=$!
cd "$UI_DIR"

# Wait for API health
echo "[2/5] Waiting for API health..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:8030/health >/dev/null 2>&1; then
        echo "  API ready (${i}s)"
        break
    fi
    sleep 1
done
if ! curl -sf http://localhost:8030/health >/dev/null 2>&1; then
    echo "ERROR: API failed to start within 30s"
    exit 1
fi

# 2. Reset demo state
echo "[3/5] Resetting demo state..."
curl -sf -X POST http://localhost:8030/admin/reset >/dev/null

# 3. Start Next.js dev server
echo "[4/5] Starting Next.js dev server (port 3000)..."
NEXT_PUBLIC_MOCK_API=false npm run dev &
UI_PID=$!

# Wait for UI
for i in $(seq 1 60); do
    if curl -sf http://localhost:3000 >/dev/null 2>&1; then
        echo "  UI ready (${i}s)"
        break
    fi
    sleep 1
done
if ! curl -sf http://localhost:3000 >/dev/null 2>&1; then
    echo "ERROR: UI failed to start within 60s"
    exit 1
fi

# 4. Run Playwright tests
echo "[5/5] Running Playwright E2E tests..."
npx playwright test $TIER $HEADED --reporter=list

echo ""
echo "=== E2E Smoke Test PASSED ==="
