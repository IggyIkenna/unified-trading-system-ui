#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# dev-tiers.sh — Start the Unified Trading System at a specific runtime tier.
#
# Usage:
#   bash scripts/dev-tiers.sh --tier 0        # UI-only (no Python) + Firebase emulators
#   bash scripts/dev-tiers.sh --tier 1        # UI + API gateways (mock) + Firebase emulators
#   bash scripts/dev-tiers.sh --tier 2        # UI + APIs + all services + Firebase emulators
#   bash scripts/dev-tiers.sh --tier 1 --real # Tier 1 with real adapters (still local Firebase)
#   bash scripts/dev-tiers.sh --tier static   # Serve pre-built static export (port 3100)
#   bash scripts/dev-tiers.sh --tier 0 --no-firebase-local  # opt out of emulators (rare)
#   bash scripts/dev-tiers.sh --stop          # Stop all processes
#   bash scripts/dev-tiers.sh --status        # Show what's running
#
# Firebase Emulator Suite is ON by default for every local tier (Auth :9099,
# Firestore :8080, Storage :9199, UI :4000). The UI bundle reads
# NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true so all SDK calls (auth signin,
# Firestore writes, Storage uploads) route to localhost — no GCP traffic,
# no charges, no possibility of writing drafts/claims/files to real
# odum-staging or prod projects from a dev machine.
#
# To populate the 23 demo personas into the local Auth pool the first time:
#   npm run emulators:seed   (in another shell after emulators are up)
#
# Pass --no-firebase-local only if you genuinely want the dev server to
# talk to a real Firebase project (set NEXT_PUBLIC_FIREBASE_* in .env.local).
#
# Tiers:
#   T-static = Pre-built Next.js static export on port 3100. No dev server, no APIs.
#              Zero dependencies. For offline demos and screenshots.
#              Run `bash scripts/static-mock-server.sh --build-only` first if out/ is stale.
#   T0 = UI-only. In-browser mock. No Python processes.
#   T1 = UI + unified-trading-api + client-reporting-api.
#        API uses MockStateStore. Auth is Firebase (VITE_SKIP_AUTH in mock).
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

# Firebase emulators (Firestore + Storage) are JVM apps — they need a real
# JRE on PATH or they crash with "Process `java -version` has exited with
# code 1". macOS ships a shim at /usr/bin/java that only prompts the install
# dialog, so we can't trust `command -v java`. Prefer the brew openjdk
# whenever it's installed (keg-only by default → not auto-symlinked); fall
# back to existing PATH otherwise.
if ! /usr/bin/env java -version >/dev/null 2>&1; then
  for jdk_dir in /opt/homebrew/opt/openjdk@21 /opt/homebrew/opt/openjdk \
                 /usr/local/opt/openjdk@21 /usr/local/opt/openjdk; do
    if [[ -x "$jdk_dir/bin/java" ]]; then
      export PATH="$jdk_dir/bin:$PATH"
      export JAVA_HOME="${JAVA_HOME:-$jdk_dir/libexec/openjdk.jdk/Contents/Home}"
      break
    fi
  done
fi

TIER=""
REAL_MODE=false
# Firebase Emulator Suite is ON by default for every local tier — keeps
# auth + Firestore + Storage on localhost so we don't accidentally write
# drafts / claims / files to the real odum-staging or prod projects from
# a developer machine. Override with --no-firebase-local for the rare
# case where you actually want to point at a real Firebase project.
FIREBASE_LOCAL=true
DO_STOP=false
DO_STATUS=false
DO_RESET=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tier)               TIER="$2"; shift 2 ;;
    --real)               REAL_MODE=true; shift ;;
    --firebase-local)     FIREBASE_LOCAL=true; shift ;;     # kept as no-op for explicitness
    --no-firebase-local)  FIREBASE_LOCAL=false; shift ;;
    --stop)               DO_STOP=true; shift ;;
    --status)             DO_STATUS=true; shift ;;
    --reset)              DO_RESET=true; shift ;;
    *)                    echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# ─── Pull local-dev secrets from GCS Secret Manager ──────────────────────────
# Sourced before any tier-specific dispatch so every code path (firebase-local
# handoff, T0/T1/T2, --stop, --status) sees the same env. Secrets in the
# DEV_SECRETS manifest land as exported env vars; Cloud Run prod mounts the
# same GSM names via secretKeyRef so app code reads `process.env.<NAME>`
# identically in both environments. Skip with DEV_SECRETS_SKIP=1.
# shellcheck source=load-dev-secrets.sh
source "$SCRIPT_DIR/load-dev-secrets.sh" || true

# When --firebase-local is set, boot the Firebase Emulator Suite (Auth +
# Firestore + Storage) alongside the Next.js dev server, plus a one-shot
# seeder that waits for the auth emulator and idempotently upserts the
# demo personas. Bypasses the rest of dev-tiers.sh — emulator mode is
# mutually exclusive with the API/services fleet for now.
#
# Three concurrent tasks (--kill-others-on-fail so the seeder exiting
# cleanly doesn't tear the group down):
#   emu  — firebase emulators:start (--export-on-exit best-effort; the
#          seeder makes us independent of whether export succeeded)
#   seed — wait-and-seed-emulator.mjs: poll auth emu, run staging seed
#          if pool is empty, otherwise no-op
#   next — next dev with NEXT_PUBLIC_MOCK_API=true so client-side fetches
#          go through lib/api/mock-handler.ts instead of trying to proxy
#          to localhost:8030 (which doesn't exist in T0)
if $FIREBASE_LOCAL; then
  cd "$UI_ROOT"
  echo "Starting Firebase Emulator Suite + Next.js dev server (T0 + emulators)…"
  echo "  Auth      → http://localhost:9099"
  echo "  Firestore → http://localhost:8080"
  echo "  Storage   → http://localhost:9199"
  echo "  Emu UI    → http://localhost:4000"
  echo "  Next.js   → http://localhost:3000"
  echo
  echo "Demo personas auto-seed on startup (idempotent). Login with admin@odum.internal / demo123."
  echo

  EMU_CMD="firebase emulators:start --only auth,firestore,storage --project=odum-local-dev --import=.local-dev-cache/emulator-state --export-on-exit=.local-dev-cache/emulator-state"

  SEED_CMD="FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199 \
FIREBASE_STAGING_PROJECT=odum-local-dev \
node scripts/admin/wait-and-seed-emulator.mjs"

  NEXT_CMD="NEXT_PUBLIC_MOCK_API=true \
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true \
NEXT_PUBLIC_AUTH_PROVIDER=firebase \
NEXT_PUBLIC_FIREBASE_PROJECT_ID=odum-local-dev \
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199 \
next dev --webpack"

  exec npx --yes concurrently --kill-others-on-fail \
    -n emu,seed,next -c green,yellow,cyan \
    "$EMU_CMD" "$SEED_CMD" "$NEXT_CMD"
fi

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
  # Also kill anything holding our ports (Tier 1 + Tier 2)
  for port in 3000 3100 8030 8014 8018 8019 8020 8021 8022 8023 8024 8025; do
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
  for port in 3000 3100 8030 8014 8018 8019 8020 8021 8022 8023 8024 8025; do
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

  if [ ! -d "$dir" ]; then
    echo "  ERROR: $name — repo not found: $dir"
    echo "  Required repos must exist at the workspace root."
    exit 1
  fi

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
  local max_wait=60
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
  echo "Usage: bash scripts/dev-tiers.sh --tier <static|0|1|2> [--real] [--reset]"
  echo "       bash scripts/dev-tiers.sh --stop"
  echo "       bash scripts/dev-tiers.sh --status"
  exit 1
fi

# ─── Tier static: serve pre-built export ─────────────────────────────────────

if [ "$TIER" = "static" ]; then
  if [ ! -d "$UI_ROOT/out" ]; then
    echo ""
    echo "[static] Building static export first (out/ not found)..."
    bash "$SCRIPT_DIR/static-mock-server.sh" --build-only
  fi
  echo ""
  echo "[static] Serving pre-built export on :3100 (zero-dependency, no dev server)"
  echo "         To rebuild: bash scripts/static-mock-server.sh --build-only"
  echo ""
  bash "$SCRIPT_DIR/static-mock-server.sh" --serve-only --port 3100
  exit 0
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
    npx next dev --webpack --port 3100
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

  # Auth is Firebase-based (VITE_SKIP_AUTH=true in mock mode) — no auth-api process.

  # client-reporting-api (port 8014)
  start_process "client-reporting-api" "$WORKSPACE/client-reporting-api" \
    env CLOUD_MOCK_MODE="$MOCK_MODE" CLOUD_PROVIDER=local DISABLE_AUTH=true \
    .venv/bin/python -m uvicorn client_reporting_api.api.main:app --host 0.0.0.0 --port 8014

  echo ""
  echo "  Waiting for APIs..."
  wait_for_port 8030 "unified-trading-api"
  wait_for_port 8014 "client-reporting-api"
fi

# ─── Tier 2: + downstream services ───────────────────────────────────────────

if [ "$TIER" = "2" ]; then
  echo ""
  echo "[T2] Starting downstream services (mock mode)..."
  echo "  Port registry: unified-trading-pm/scripts/dev/ui-api-mapping.json"
  echo ""

  # Common env for all services — exported so child processes inherit
  export CLOUD_MOCK_MODE="$MOCK_MODE"
  export CLOUD_PROVIDER=local
  export DISABLE_AUTH=true
  export ENVIRONMENT=development
  export OBSERVABILITY_MODE=local
  export GCP_PROJECT_ID=mock-project
  export PUBSUB_EMULATOR_HOST=localhost:8085
  export STORAGE_EMULATOR_HOST=http://localhost:4443

  # --- Batch seed tasks (run once, produce mock data, exit) ---

  echo "  [SEED] Running batch seed tasks..."

  # Strategy mock data
  SEED_DIR="$UI_ROOT/.local-dev-cache/mock-seed/strategy-service"
  if [ ! -f "$SEED_DIR/.seed-complete" ]; then
 "$WORKSPACE/strategy-service/.venv/bin/python" \
      "$WORKSPACE/strategy-service/scripts/seed_mock_data.py" \
      --scenario normal --seed 42 --env local 2>/dev/null \
      && echo "    strategy seed: done" || echo "    strategy seed: failed (non-fatal)"
  else
    echo "    strategy seed: cached"
  fi

  echo ""

  # --- Resident services (stay alive with health API) ---

  # risk-and-exposure-service — live mode starts uvicorn on port 8019
  start_process "risk-and-exposure-service" "$WORKSPACE/risk-and-exposure-service" \
    .venv/bin/python -m uvicorn risk_and_exposure_service.api.main:app \
    --host 0.0.0.0 --port 8019

  # position-balance-monitor-service — health API on port 8020
  start_process "position-balance-monitor-service" "$WORKSPACE/position-balance-monitor-service" \
    .venv/bin/python -m uvicorn position_balance_monitor_service.api.main:app \
    --host 0.0.0.0 --port 8020

  # alerting-service — health API on port 8021
  start_process "alerting-service" "$WORKSPACE/alerting-service" \
    .venv/bin/python -m uvicorn alerting_service.api.main:app \
    --host 0.0.0.0 --port 8021

  # pnl-attribution-service — health API on port 8022
  start_process "pnl-attribution-service" "$WORKSPACE/pnl-attribution-service" \
    .venv/bin/python -m uvicorn pnl_attribution_service.api.main:app \
    --host 0.0.0.0 --port 8022

  # execution-service — health API on port 8018
  start_process "execution-service" "$WORKSPACE/execution-service" \
    .venv/bin/python -m uvicorn execution_service.api.app:app \
    --host 0.0.0.0 --port 8018

  # strategy-service — health API on port 8025
  start_process "strategy-service" "$WORKSPACE/strategy-service" \
    .venv/bin/python -m uvicorn strategy_service.api.main:app \
    --host 0.0.0.0 --port 8025

  # instruments-service — health API on port 8024
  start_process "instruments-service" "$WORKSPACE/instruments-service" \
    .venv/bin/python -m uvicorn instruments_service.api.main:app \
    --host 0.0.0.0 --port 8024

  # market-tick-data-service — health API on port 8023
  start_process "market-tick-data-service" "$WORKSPACE/market-tick-data-service" \
    .venv/bin/python -m uvicorn market_tick_data_service.api.main:app \
    --host 0.0.0.0 --port 8023

  # ── deployment-api (8004) + legacy deployment-ui (5183) ────────────────
  # Pair the deployment-stack with the rest of tier 2 so the data-status
  # flow at http://localhost:5183 has its backend + the new shared
  # rollup-aware code in one go. Reads the same Cloud Run rollup bucket
  # as the shared Cloud Run instance (CLOUD_PROVIDER=gcp + project id
  # resolved via UnifiedCloudConfig in --real mode), so the slicer
  # fast-path lights up locally.
  start_process "deployment-api" "$WORKSPACE/deployment-api" \
    env CLOUD_MOCK_MODE="$MOCK_MODE" CLOUD_PROVIDER=gcp DISABLE_AUTH=true \
    .venv/bin/python -m uvicorn deployment_api.main:app \
    --host 0.0.0.0 --port 8004

  start_process "deployment-ui" "$WORKSPACE/deployment-ui" \
    npm run dev

  echo ""
  echo "  Waiting for service health endpoints..."
  for svc_port in 8018 8019 8020 8021 8022 8023 8024 8025 8004; do
    wait_for_port "$svc_port" "service:$svc_port" || true
  done
  wait_for_port 5183 "deployment-ui"
fi

# ─── Start UI ────────────────────────────────────────────────────────────────

echo ""
echo "[UI] Starting Next.js dev server..."

INTEGRATION="slim"
if [ "$TIER" = "2" ]; then INTEGRATION="full_mesh"; fi

# Note: admin catalogue truthiness vars (NEXT_PUBLIC_ADMIN_API_TOKEN,
# NEXT_PUBLIC_STRATEGY_SERVICE_URL, NEXT_PUBLIC_FEATURES_SERVICE_URLS) are
# intentionally unset here so the admin catalogue falls back to mock seed
# data — dev-tiers is mock-only. Set these in `.env.local` to exercise the
# live-mode adapter against a real strategy-service + features-* mesh.
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
  echo "  Reporting: http://localhost:8014"
  echo "  Auth:      Firebase (VITE_SKIP_AUTH=$MOCK_MODE)"
fi
if [ "$TIER" = "2" ]; then
  echo ""
  echo "  ── Service Fleet ──"
  echo "  Strategy:  http://localhost:8025/health"
  echo "  Execution: http://localhost:8018/health"
  echo "  Risk:      http://localhost:8019/health"
  echo "  Position:  http://localhost:8020/health"
  echo "  Alerting:  http://localhost:8021/health"
  echo "  PnL:       http://localhost:8022/health"
  echo "  MTDS:      http://localhost:8023/health"
  echo "  Instrmts:  http://localhost:8024/health"
fi
echo ""
echo "  Stop:      bash scripts/dev-tiers.sh --stop"
echo "  Status:    bash scripts/dev-tiers.sh --status"
echo ""
