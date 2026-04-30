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

# ─── ADC pre-flight (--real only) ────────────────────────────────────────────
# The backend reads GCS in --real mode via Application Default Credentials.
# Without ADC the API boots, binds :8030, then fails on first GCS call —
# which combined with the port-bind health check looks like "everything's
# fine" until the UI hits an empty chart. Catch it here instead.
if $REAL_MODE && ! $DO_STOP && ! $DO_STATUS; then
  if ! command -v gcloud >/dev/null 2>&1; then
    echo "ERROR: --real requires the gcloud CLI but it's not on PATH."
    echo "       Install: https://cloud.google.com/sdk/docs/install"
    exit 1
  fi
  if ! gcloud auth application-default print-access-token >/dev/null 2>&1; then
    echo "ERROR: --real requires Application Default Credentials, but none are configured."
    echo "       Run: gcloud auth application-default login"
    echo "       (or set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON)"
    exit 1
  fi
fi

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
if $FIREBASE_LOCAL && [ "$TIER" = "0" ]; then
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

# When tier is 1 or 2 AND firebase emulator is requested, start the emulator
# + seeder as background processes managed by start_process so the tier
# dispatch below can still launch the API + UI. UI must be configured to
# point at the emulator for auth (NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true)
# while still calling the real backend for data.
EMULATOR_ON=false
if $FIREBASE_LOCAL && ([ "$TIER" = "1" ] || [ "$TIER" = "2" ]); then
  EMULATOR_ON=true
fi

MOCK_MODE="true"
if $REAL_MODE; then MOCK_MODE="false"; fi

mkdir -p "$PID_DIR" "$LOG_DIR"

# ─── Process-group launcher (cross-platform) ─────────────────────────────────
# `setsid` ships with Linux's util-linux but is NOT on macOS by default.
# We need it so that killing the recorded PGID also reaps the child's
# descendants (e.g. firebase emulators:start spawning java workers).
#
# Resolution order:
#   1. real setsid binary (Linux, or macOS with `brew install util-linux`)
#   2. Python `os.setpgrp` polyfill — exec'd into the target so `$!` lines
#      up with the new session leader. Python 3 is on every dev machine.
#
# Sets PGROUP_LAUNCHER to a command-line prefix that, when followed by a
# command and its args, runs that command as a new process-group leader.
if command -v setsid >/dev/null 2>&1; then
  PGROUP_LAUNCHER=(setsid)
elif command -v python3 >/dev/null 2>&1; then
  # Python -c convention: with `python3 -c '<src>' tag a b c`, sys.argv is
  # ['-c', 'tag', 'a', 'b', 'c']. We use 'setsid-poly' as the tag (sys.argv[1])
  # and the real command starts at sys.argv[2]. os.setpgrp() detaches from
  # the parent's group BEFORE exec so the new process becomes its own group
  # leader — `$!` in bash is then a valid PGID for `kill -- -$pgid`.
  PGROUP_LAUNCHER=(python3 -c 'import os,sys; os.setpgrp(); os.execvp(sys.argv[2], sys.argv[2:])' setsid-poly)
else
  echo "ERROR: neither setsid nor python3 available — cannot launch process groups."
  echo "       On macOS: brew install util-linux  (provides setsid)"
  exit 1
fi

# ─── Helpers ──────────────────────────────────────────────────────────────────

# Ports we own across all tiers. Used by stop_all and show_status.
#   3000/3100  Next.js dev/static
#   8030       unified-trading-api
#   8014       client-reporting-api
#   8018-8025  T2 service mesh
#   9099       firebase auth emulator
#   8080       firebase firestore emulator
#   9199       firebase storage emulator
#   4000       firebase emulator UI
#   4400 4500  firebase hub + reserved
#   8085       pubsub emulator
#   4443       gcs storage emulator
DEV_TIER_PORTS=(3000 3100 8030 8014 8018 8019 8020 8021 8022 8023 8024 8025 \
                9099 8080 9199 4000 4400 4500 8085 4443)

stop_all() {
  echo "Stopping all dev-tier processes..."
  for pidfile in "$PID_DIR"/*.pid; do
    [ -f "$pidfile" ] || continue
    local pid
    pid=$(cat "$pidfile")
    local name
    name=$(basename "$pidfile" .pid)
    # Stored value is a process-group ID (start_process uses setsid). Killing
    # the negative PGID reaps the leader and all descendants (e.g. firebase
    # emulators:start spawning java children). Fall back to plain pid kill if
    # the stored value isn't a valid pgid (older runs / manual edits).
    if kill -0 "$pid" 2>/dev/null; then
      echo "  Stopping $name (PGID $pid)"
      # List every process in the group: PID, parent PID, ports it's bound to,
      # truncated command. `pgrep -g $pgid` finds members; for each we pull a
      # one-line summary. Printed before kill so the user can see exactly what
      # disappears. `|| true` everywhere — never block stop on a probe error.
      local member
      while IFS= read -r member; do
        [ -n "$member" ] || continue
        local pinfo cmd ports
        # NOTE: trailing `|| true` on each command-substitution. Without it,
        # `lsof` returns non-zero when a process has no listening sockets
        # (true for firebase-seeder, the java firestore child, any non-port
        # process). Combined with `set -o pipefail` from the top of this
        # script, the substitution fails, `set -e` aborts the whole stop_all
        # mid-loop, and we leave dangling pidfiles + half-killed PGIDs.
        # Symptom: --stop printed the first member's line then exited rc=1.
        pinfo=$(ps -o pid=,ppid= -p "$member" 2>/dev/null | awk '{print "PID="$1" PPID="$2}' || true)
        cmd=$(ps -o args= -p "$member" 2>/dev/null | cut -c1-120 || true)
        ports=$(lsof -Pan -p "$member" -i -sTCP:LISTEN 2>/dev/null \
                | awk 'NR>1 {sub(".*:", "", $9); print $9}' \
                | sort -u | paste -sd, - || true)
        if [ -n "$ports" ]; then
          echo "    └─ $pinfo ports=$ports  $cmd"
        else
          echo "    └─ $pinfo  $cmd"
        fi
      done < <(pgrep -g "$pid" 2>/dev/null || true)
      kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
      sleep 1
      kill -KILL "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    fi
    rm -f "$pidfile"
  done
  # Safety net — also kill anything holding our known ports. Catches orphans
  # from prior crashes and any process that escaped the group kill above.
  for port in "${DEV_TIER_PORTS[@]}"; do
    local holders
    holders=$(lsof -ti ":$port" 2>/dev/null || true)
    if [ -n "$holders" ]; then
      echo "  Killing port :$port holders:"
      local h
      for h in $holders; do
        local pinfo cmd
        pinfo=$(ps -o pid=,ppid= -p "$h" 2>/dev/null | awk '{print "PID="$1" PPID="$2}')
        cmd=$(ps -o args= -p "$h" 2>/dev/null | cut -c1-120)
        echo "    └─ $pinfo  $cmd"
      done
      echo "$holders" | xargs kill -9 2>/dev/null || true
    fi
  done

  # Archive panic-export dirs left behind by ungraceful emulator shutdowns.
  # Firebase drops `firebase-export-<ms-ts><6 alnum>/` in its cwd when it's
  # killed before --export-on-exit can fire. The clean state lives in
  # .local-dev-cache/emulator-state/; these timestamped siblings are crash
  # snapshots — useful for post-mortems, but shouldn't clutter the repo
  # root. Move them to .local-dev-cache/emulator-state-archive/ and keep
  # the 10 most recent. Glob matches the exact suffix shape (digits first)
  # so anything a human hand-created (e.g. firebase-export-keepme-...) is
  # left alone.
  local archive_dir="$UI_ROOT/.local-dev-cache/emulator-state-archive"
  local export_dir moved=0
  for export_dir in "$UI_ROOT"/firebase-export-[0-9]*; do
    [ -d "$export_dir" ] || continue
    if [ "$moved" -eq 0 ]; then
      mkdir -p "$archive_dir"
    fi
    echo "  Archiving emulator export: $(basename "$export_dir") → emulator-state-archive/"
    mv "$export_dir" "$archive_dir/" 2>/dev/null || rm -rf "$export_dir"
    moved=$((moved + 1))
  done

  # Prune archive to the 10 most recent. ls -t sorts by mtime newest-first;
  # tail -n +11 yields entries from the 11th onward. `|| true` because the
  # dir may not exist yet on first run.
  if [ -d "$archive_dir" ]; then
    (cd "$archive_dir" && ls -1t 2>/dev/null | tail -n +11 | while read -r old; do
      [ -n "$old" ] && rm -rf "$old"
    done) || true
  fi

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
  for port in "${DEV_TIER_PORTS[@]}"; do
    local result=""
    # `|| true` so set -e doesn't abort when nothing's listening (common case).
    # `pipefail` means lsof's non-zero would otherwise kill the whole pipeline.
    result=$(lsof -i ":$port" -sTCP:LISTEN 2>/dev/null | tail -1 || true)
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

  # Refuse to overwrite a live PID file. Normal flow calls stop_all first, so
  # a leftover here means a previous launch survived stop — surface it loudly
  # rather than silently orphaning the old process.
  local pidfile="$PID_DIR/$name.pid"
  if [ -f "$pidfile" ]; then
    local prev
    prev=$(cat "$pidfile" 2>/dev/null)
    if [ -n "$prev" ] && kill -0 "$prev" 2>/dev/null; then
      echo "  ERROR: $name — already running (PGID $prev). Run --stop first."
      exit 1
    fi
    rm -f "$pidfile"
  fi

  echo "  Starting $name..."
  cd "$dir"
  # PGROUP_LAUNCHER puts the child in its own process group with itself as
  # leader (setsid on Linux, python3 polyfill on macOS without util-linux).
  # We record the PGID so stop_all can reap descendants (e.g. firebase
  # emulators spawning java workers) via `kill -- -$PGID`.
  "${PGROUP_LAUNCHER[@]}" "${cmd[@]}" > "$LOG_DIR/$name.log" 2>&1 < /dev/null &
  local pid=$!
  echo "$pid" > "$pidfile"
  echo "    PGID $pid — log: $LOG_DIR/$name.log"
  cd "$WORKSPACE"
}

# Track service:port pairs we actually started, so the wait loop only polls
# ports for processes that were launched. Skipped venvs don't get waited on.
STARTED_SERVICE_PORTS=()

# Wrapper around start_process that skips with a warning when the repo's
# .venv is missing instead of stalling on a uvicorn import error. Use this
# for any Python service launched via `.venv/bin/python -m uvicorn …`.
#
# Usage: start_if_venv <name> <repo-dir> <port> <cmd…>
#   — <port> is recorded in STARTED_SERVICE_PORTS on success so the caller
#     can pass it through wait_for_port without needing a separate flag.
start_if_venv() {
  local name="$1"
  local dir="$2"
  local port="$3"
  shift 3
  local cmd=("$@")

  if [ ! -x "$dir/.venv/bin/python" ]; then
    echo "  ⚠️  Skipping $name — .venv not built at $dir/.venv (run \`cd $dir && uv sync --frozen\`)"
    return 0
  fi

  start_process "$name" "$dir" "${cmd[@]}"
  STARTED_SERVICE_PORTS+=("$port:$name")
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

# Wait until a service answers HTTP 2xx/3xx on its health endpoint. uvicorn
# binds the port before its app finishes startup, so a port-bind alone can
# report "ready" while the service is still importing modules. Falls back
# to wait_for_port when curl is missing or the service has no /health.
wait_for_health() {
  local port="$1"
  local name="$2"
  local path="${3:-/health}"
  local max_wait=60
  local i=0

  if ! command -v curl >/dev/null 2>&1; then
    wait_for_port "$port" "$name"
    return $?
  fi

  # Bind first — if the port never opens, no point hammering /health.
  wait_for_port "$port" "$name" || return 1

  while [ $i -lt $max_wait ]; do
    if curl -fsS -o /dev/null --max-time 2 "http://localhost:$port$path" 2>/dev/null; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  echo "    ⚠️  $name bound :$port but $path didn't return 2xx within ${max_wait}s"
  echo "    Check log: $LOG_DIR/$name.log"
  # Tail the last few lines so the user gets the actual error without
  # having to open another terminal. Most uvicorn / next.js failures show
  # the import error or stack trace right at the tail.
  if [ -f "$LOG_DIR/$name.log" ]; then
    echo "    ─── last 10 lines of $name.log ───"
    tail -n 10 "$LOG_DIR/$name.log" 2>/dev/null | sed 's/^/      /'
    echo "    ──────────────────────────────────"
  fi
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
echo "  Starting Tier $TIER ($(if $REAL_MODE; then echo 'REAL'; else echo 'MOCK'; fi) mode)$(if $EMULATOR_ON; then echo ' + Firebase emulator'; fi)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─── Firebase emulators (when tier 1/2 + --firebase-local) ───────────────────

if $EMULATOR_ON; then
  echo "[FIREBASE] Starting emulator suite (auth/firestore/storage)…"
  start_process "firebase-emulators" "$UI_ROOT" \
    firebase emulators:start --only auth,firestore,storage \
    --project=odum-local-dev \
    --import=.local-dev-cache/emulator-state \
    --export-on-exit=.local-dev-cache/emulator-state
  echo "  Waiting for auth emulator…"
  wait_for_port 9099 "firebase-auth" || true

  echo "[FIREBASE] Seeding demo personas (idempotent)…"
  start_process "firebase-seeder" "$UI_ROOT" \
    env FIRESTORE_EMULATOR_HOST=localhost:8080 \
        FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
        FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199 \
        FIREBASE_STAGING_PROJECT=odum-local-dev \
    node scripts/admin/wait-and-seed-emulator.mjs
  # Seeder runs and exits; not a blocker for downstream services.
  echo ""
fi

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
  # In --real mode the backend reads GCS — needs GCP_PROJECT_ID + cloud
  # provider gcp. In mock mode CLOUD_PROVIDER=local + no project_id.
  # GCP_PROJECT_ID can be overridden at the shell level; default is the
  # central-element-323112 dev project where TRADFI candles live.
  if $REAL_MODE; then
    UTAPI_CLOUD_PROVIDER="gcp"
    UTAPI_PROJECT_ID="${GCP_PROJECT_ID:-central-element-323112}"
  else
    UTAPI_CLOUD_PROVIDER="local"
    UTAPI_PROJECT_ID="mock-project"
  fi
  # Prefer the workspace venv when the repo-local one is missing — the
  # workspace venv is what setup-workspace.sh builds for cross-repo dev.
  # If neither exists, warn and skip; T1 is degraded but UI still boots.
  UTAPI_PY="$WORKSPACE/unified-trading-api/.venv/bin/python"
  if [ ! -x "$UTAPI_PY" ]; then
    UTAPI_PY="$WORKSPACE/.venv-workspace/bin/python"
  fi
  if [ ! -x "$UTAPI_PY" ]; then
    echo "  ⚠️  Skipping unified-trading-api — no .venv at $WORKSPACE/unified-trading-api/.venv or $WORKSPACE/.venv-workspace"
    echo "     Run: cd $WORKSPACE/unified-trading-api && uv sync --frozen"
    UTAPI_STARTED=false
  else
    start_process "unified-trading-api" "$WORKSPACE/unified-trading-api" \
      env CLOUD_MOCK_MODE="$MOCK_MODE" \
          CLOUD_PROVIDER="$UTAPI_CLOUD_PROVIDER" \
          GCP_PROJECT_ID="$UTAPI_PROJECT_ID" \
          GOOGLE_CLOUD_PROJECT="$UTAPI_PROJECT_ID" \
          DISABLE_AUTH=true \
          ENVIRONMENT=development \
          MARKET_DATA_BUCKET_VARIANT="${MARKET_DATA_BUCKET_VARIANT:-prod}" \
      "$UTAPI_PY" -m uvicorn "unified_trading_api.main:create_app" \
      --factory --host 0.0.0.0 --port 8030
    UTAPI_STARTED=true
  fi

  # Auth is Firebase-based (VITE_SKIP_AUTH=true in mock mode) — no auth-api process.

  # client-reporting-api (port 8014) — optional, skip if its venv isn't built
  start_if_venv "client-reporting-api" "$WORKSPACE/client-reporting-api" 8014 \
    env CLOUD_MOCK_MODE="$MOCK_MODE" CLOUD_PROVIDER=local DISABLE_AUTH=true \
    .venv/bin/python -m uvicorn client_reporting_api.api.main:app --host 0.0.0.0 --port 8014

  echo ""
  echo "  Waiting for APIs..."
  if [ "${UTAPI_STARTED:-false}" = "true" ]; then
    wait_for_health 8030 "unified-trading-api" /health || true
  fi
  # client-reporting-api gets a port-only check — its /health path varies
  # by version and isn't load-bearing for the chart flow.
  for entry in "${STARTED_SERVICE_PORTS[@]}"; do
    if [ "${entry##*:}" = "client-reporting-api" ]; then
      wait_for_port "${entry%%:*}" "client-reporting-api" || \
        echo "    ⚠️  client-reporting-api didn't come up — reports tab may be unavailable"
    fi
  done
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

  # Strategy mock data — skip cleanly if strategy-service venv is missing
  SEED_DIR="$UI_ROOT/.local-dev-cache/mock-seed/strategy-service"
  if [ ! -f "$SEED_DIR/.seed-complete" ]; then
    if [ -x "$WORKSPACE/strategy-service/.venv/bin/python" ]; then
      "$WORKSPACE/strategy-service/.venv/bin/python" \
        "$WORKSPACE/strategy-service/scripts/seed_mock_data.py" \
        --scenario normal --seed 42 --env local 2>/dev/null \
        && echo "    strategy seed: done" || echo "    strategy seed: failed (non-fatal)"
    else
      echo "    ⚠️  strategy seed: skipped — strategy-service/.venv not built"
    fi
  else
    echo "    strategy seed: cached"
  fi

  echo ""

  # --- Resident services (stay alive with health API) ---
  # Each uses start_if_venv so a missing repo .venv warns and skips instead
  # of failing the whole tier. wait_for_port below only polls started ones.

  start_if_venv "risk-and-exposure-service" "$WORKSPACE/risk-and-exposure-service" 8019 \
    .venv/bin/python -m uvicorn risk_and_exposure_service.api.main:app \
    --host 0.0.0.0 --port 8019

  start_if_venv "position-balance-monitor-service" "$WORKSPACE/position-balance-monitor-service" 8020 \
    .venv/bin/python -m uvicorn position_balance_monitor_service.api.main:app \
    --host 0.0.0.0 --port 8020

  start_if_venv "alerting-service" "$WORKSPACE/alerting-service" 8021 \
    .venv/bin/python -m uvicorn alerting_service.api.main:app \
    --host 0.0.0.0 --port 8021

  start_if_venv "pnl-attribution-service" "$WORKSPACE/pnl-attribution-service" 8022 \
    .venv/bin/python -m uvicorn pnl_attribution_service.api.main:app \
    --host 0.0.0.0 --port 8022

  start_if_venv "execution-service" "$WORKSPACE/execution-service" 8018 \
    .venv/bin/python -m uvicorn execution_service.api.app:app \
    --host 0.0.0.0 --port 8018

  start_if_venv "strategy-service" "$WORKSPACE/strategy-service" 8025 \
    .venv/bin/python -m uvicorn strategy_service.api.main:app \
    --host 0.0.0.0 --port 8025

  start_if_venv "instruments-service" "$WORKSPACE/instruments-service" 8024 \
    .venv/bin/python -m uvicorn instruments_service.api.main:app \
    --host 0.0.0.0 --port 8024

  start_if_venv "market-tick-data-service" "$WORKSPACE/market-tick-data-service" 8023 \
    .venv/bin/python -m uvicorn market_tick_data_service.api.main:app \
    --host 0.0.0.0 --port 8023

  echo ""
  if [ ${#STARTED_SERVICE_PORTS[@]} -eq 0 ]; then
    echo "  ⚠️  No T2 services started — all venvs missing. UI will boot but full_mesh is degraded."
  else
    echo "  Waiting for service health endpoints (${#STARTED_SERVICE_PORTS[@]} started)..."
    for entry in "${STARTED_SERVICE_PORTS[@]}"; do
      svc_port="${entry%%:*}"
      svc_name="${entry##*:}"
      # Skip the T1 APIs already waited on in the T1 block above.
      [ "$svc_name" = "client-reporting-api" ] && continue
      wait_for_health "$svc_port" "$svc_name" /health || true
    done
  fi
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
# UI mock mode follows --real: in --real the UI calls the backend
# (NEXT_PUBLIC_MOCK_API=false), in mock the UI uses in-browser fixtures.
UI_MOCK="true"
if $REAL_MODE; then UI_MOCK="false"; fi

# When the Firebase emulator is up, route auth/firestore/storage SDK calls
# at it. Otherwise the UI falls through to whatever NEXT_PUBLIC_FIREBASE_*
# is configured (real Firebase project from .env.local).
if $EMULATOR_ON; then
  start_process "ui" "$UI_ROOT" \
    env NEXT_PUBLIC_MOCK_API="$UI_MOCK" \
        NEXT_PUBLIC_UNIFIED_API_URL="${NEXT_PUBLIC_UNIFIED_API_URL:-http://localhost:8030}" \
        NEXT_PUBLIC_UI_INTEGRATION="$INTEGRATION" \
        NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true \
        NEXT_PUBLIC_AUTH_PROVIDER=firebase \
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=odum-local-dev \
        FIRESTORE_EMULATOR_HOST=localhost:8080 \
        FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
        FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199 \
    npx next dev
else
  start_process "ui" "$UI_ROOT" \
    env NEXT_PUBLIC_MOCK_API="$UI_MOCK" \
        NEXT_PUBLIC_UNIFIED_API_URL="${NEXT_PUBLIC_UNIFIED_API_URL:-http://localhost:8030}" \
        NEXT_PUBLIC_UI_INTEGRATION="$INTEGRATION" \
    npx next dev
fi

echo ""
echo "  Waiting for UI..."
# Next.js binds :3000 immediately but takes another second or two to compile
# the first route. Hitting / waits for the actual response, so the user
# doesn't see "ready" then a compile spinner. Path "/" returns 200 (HTML)
# in both T0 (mock) and T1/T2 (real) modes.
wait_for_health 3000 "ui" /

# Run --reset BEFORE the final banner so a failed reset doesn't print after
# "Tier N running" — keeps the success line truthful.
if $DO_RESET; then
  echo ""
  echo "[RESET] Re-seeding mock data..."
  curl -s -X POST http://localhost:8030/admin/reset > /dev/null 2>&1 && echo "  Done." || echo "  ⚠️  Reset failed."
fi

# ─── Post-startup ────────────────────────────────────────────────────────────

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
