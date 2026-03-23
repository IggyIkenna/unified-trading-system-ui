#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# dev-tiers.sh — Start the Unified Trading System at a specific runtime tier.
#
# Usage:
#   bash scripts/dev-tiers.sh --tier 0        # UI-only (no Python)
#   bash scripts/dev-tiers.sh --tier 1        # UI + API gateways (mock)
#   bash scripts/dev-tiers.sh --tier 2        # UI + APIs + all services
#   bash scripts/dev-tiers.sh --tier 1 --real # Tier 1 with real adapters
#   bash scripts/dev-tiers.sh --stop          # Stop all processes
#   bash scripts/dev-tiers.sh --status        # Show what's running
#
# Tiers:
#   T0 = UI-only. In-browser mock. No Python processes.
#   T1 = UI + unified-trading-api + auth-api + client-reporting-api.
#        API uses MockStateStore. No downstream service processes.
#   T2 = T1 + all downstream service processes (full fleet).
#        Each service in mock mode. API gateway fans out to service URLs.
#
# Mock is always the service running in mock mode. The only variable is
# topology (colocated vs network). No feature creep between tiers.
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UI_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE="$(cd "$UI_ROOT/.." && pwd)"
PID_DIR="$UI_ROOT/.local-dev-cache/pids"
LOG_DIR="$UI_ROOT/.local-dev-cache/logs"

TIER=""
REAL_MODE=false
DO_STOP=false
DO_STATUS=false
DO_RESET=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tier)   TIER="$2"; shift 2 ;;
    --real)   REAL_MODE=true; shift ;;
    --stop)   DO_STOP=true; shift ;;
    --status) DO_STATUS=true; shift ;;
    --reset)  DO_RESET=true; shift ;;
    *)        echo "Unknown arg: $1"; exit 1 ;;
  esac
done

MOCK_MODE="true"
if $REAL_MODE; then MOCK_MODE="false"; fi

mkdir -p "$PID_DIR" "$LOG_DIR"

# ─── Helpers ──────────────────────────────────────────────────────────────────

stop_all() {
  echo "Stopping all dev-tier processes..."
  for pidfile in "$PID_DIR"/*.pid; do
    [ -f "$pidfile" ] || continue
    local pid
    pid=$(cat "$pidfile")
    local name
    name=$(basename "$pidfile" .pid)
    if kill -0 "$pid" 2>/dev/null; then
      echo "  Stopping $name (PID $pid)"
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$pidfile"
  done
  # Also kill anything holding our ports
  for port in 3000 3100 8030 8200 8014; do
    local holders
    holders=$(lsof -ti ":$port" 2>/dev/null || true)
    if [ -n "$holders" ]; then
      echo "  Killing port :$port holders: $holders"
      echo "$holders" | xargs kill -9 2>/dev/null || true
    fi
  done
  sleep 1
  echo "All stopped."
}

show_status() {
  echo "═══ Dev Tier Status ═══"
  local any_running=false
  for pidfile in "$PID_DIR"/*.pid; do
    [ -f "$pidfile" ] || continue
    local pid
    pid=$(cat "$pidfile")
    local name
    name=$(basename "$pidfile" .pid)
    if kill -0 "$pid" 2>/dev/null; then
      echo "  ✅ $name (PID $pid)"
      any_running=true
    else
      echo "  ❌ $name (PID $pid — dead)"
      rm -f "$pidfile"
    fi
  done
  if ! $any_running; then
    echo "  No processes running."
  fi

  echo ""
  echo "═══ Port Check ═══"
  for port in 3000 3100 8030 8200 8014; do
    local result
    result=$(lsof -i ":$port" -sTCP:LISTEN 2>/dev/null | tail -1)
    if [ -n "$result" ]; then
      echo "  ✅ :$port — $(echo "$result" | awk '{print $1, $2}')"
    else
      echo "  ⬚  :$port — not listening"
    fi
  done
}

start_process() {
  local name="$1"
  local dir="$2"
  shift 2
  local cmd=("$@")

  echo "  Starting $name..."
  cd "$dir"
  "${cmd[@]}" > "$LOG_DIR/$name.log" 2>&1 &
  local pid=$!
  echo "$pid" > "$PID_DIR/$name.pid"
  echo "    PID $pid — log: $LOG_DIR/$name.log"
  cd "$WORKSPACE"
}

wait_for_port() {
  local port="$1"
  local name="$2"
  local max_wait=30
  local i=0
  while [ $i -lt $max_wait ]; do
    if lsof -i ":$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  echo "    ⚠️  $name did not start on :$port within ${max_wait}s"
  echo "    Check log: $LOG_DIR/$name.log"
  return 1
}

# ─── Dispatch ─────────────────────────────────────────────────────────────────

if $DO_STOP; then stop_all; exit 0; fi
if $DO_STATUS; then show_status; exit 0; fi

if [ -z "$TIER" ]; then
  echo "Usage: bash scripts/dev-tiers.sh --tier <0|1|2> [--real] [--reset]"
  echo "       bash scripts/dev-tiers.sh --stop"
  echo "       bash scripts/dev-tiers.sh --status"
  exit 1
fi

# Stop any existing processes first
stop_all

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Starting Tier $TIER ($(if $REAL_MODE; then echo 'REAL'; else echo 'MOCK'; fi) mode)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─── Tier 0: UI only ─────────────────────────────────────────────────────────

if [ "$TIER" = "0" ]; then
  echo "[T0] UI-only — no Python processes (static visual preview)"
  start_process "ui" "$UI_ROOT" \
    env NEXT_PUBLIC_MOCK_API=true NEXT_PUBLIC_AUTH_PROVIDER=demo \
    npx next dev --port 3100
  echo ""
  echo "  UI:   http://localhost:3100"
  echo "  Tier: 0 (in-browser mock — all API calls intercepted client-side)"
  exit 0
fi

# ─── Tier 1: UI + API gateways ───────────────────────────────────────────────

if [ "$TIER" = "1" ] || [ "$TIER" = "2" ]; then
  echo "[T1] Starting API gateways..."

  # unified-trading-api (port 8030)
  start_process "unified-trading-api" "$WORKSPACE/unified-trading-api" \
    env CLOUD_MOCK_MODE="$MOCK_MODE" CLOUD_PROVIDER=local DISABLE_AUTH=true \
    .venv/bin/python -m uvicorn "unified_trading_api.main:create_app" \
    --factory --host 0.0.0.0 --port 8030

  # auth-api (port 8200)
  start_process "auth-api" "$WORKSPACE/auth-api" \
    env CLOUD_MOCK_MODE="$MOCK_MODE" CLOUD_PROVIDER=local WORKFLOW_EXECUTION_ENABLED=false \
    .venv/bin/python -m uvicorn auth_api.app:app --host 0.0.0.0 --port 8200

  # client-reporting-api (port 8014)
  start_process "client-reporting-api" "$WORKSPACE/client-reporting-api" \
    env CLOUD_MOCK_MODE="$MOCK_MODE" CLOUD_PROVIDER=local DISABLE_AUTH=true \
    .venv/bin/python -m uvicorn client_reporting_api.api.main:app --host 0.0.0.0 --port 8014

  echo ""
  echo "  Waiting for APIs..."
  wait_for_port 8030 "unified-trading-api"
  wait_for_port 8200 "auth-api"
  wait_for_port 8014 "client-reporting-api"
fi

# ─── Tier 2: + downstream services ───────────────────────────────────────────

if [ "$TIER" = "2" ]; then
  echo ""
  echo "[T2] Starting downstream services..."
  echo "  ⚠️  Tier 2 (full fleet) requires LiveDomainService wiring in the API gateway."
  echo "  ⚠️  This is Phase 9 in the plan — not yet implemented."
  echo "  ⚠️  Running at Tier 1 topology (API uses MockStateStore)."
  echo ""
  # TODO: When LiveDomainService is wired, start services here:
  # Port registry: unified-trading-pm/scripts/dev/ui-api-mapping.json
  #
  # start_process "instruments-service" "$WORKSPACE/instruments-service" \
  #   env CLOUD_MOCK_MODE="$MOCK_MODE" CLOUD_PROVIDER=local \
  #   .venv/bin/python -m instruments_service --operation serve --mode live
  #
  # ... repeat for each service
fi

# ─── Start UI ────────────────────────────────────────────────────────────────

echo ""
echo "[UI] Starting Next.js dev server..."

INTEGRATION="slim"
if [ "$TIER" = "2" ]; then INTEGRATION="full_mesh"; fi

start_process "ui" "$UI_ROOT" \
  env NEXT_PUBLIC_MOCK_API=true NEXT_PUBLIC_UI_INTEGRATION="$INTEGRATION" \
  npx next dev

echo ""
echo "  Waiting for UI..."
wait_for_port 3000 "ui"

# ─── Post-startup ────────────────────────────────────────────────────────────

if $DO_RESET; then
  echo ""
  echo "[RESET] Re-seeding mock data..."
  curl -s -X POST http://localhost:8030/admin/reset > /dev/null 2>&1 && echo "  Done." || echo "  ⚠️  Reset failed."
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Tier $TIER running ($(if $REAL_MODE; then echo 'REAL'; else echo 'MOCK'; fi) mode)"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  UI:        http://localhost:3000"
echo "  Health:    http://localhost:3000/health"
if [ "$TIER" != "0" ]; then
  echo "  API:       http://localhost:8030"
  echo "  Auth:      http://localhost:8200"
  echo "  Reporting: http://localhost:8014"
fi
echo ""
echo "  Stop:      bash scripts/dev-tiers.sh --stop"
echo "  Status:    bash scripts/dev-tiers.sh --status"
echo ""
