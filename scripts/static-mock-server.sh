#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# static-mock-server.sh — Serves a pre-built Next.js static export on port 3100.
#
# Zero API dependency. Uses `next export` (next build with output: "export")
# for offline demos, screenshots, and visual regression.
#
# Usage:
#   bash scripts/static-mock-server.sh             # build + serve
#   bash scripts/static-mock-server.sh --serve-only  # skip build, serve existing out/
#   bash scripts/static-mock-server.sh --build-only  # build only, no serve
#   bash scripts/static-mock-server.sh --port 3200   # custom port (default 3100)
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UI_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PORT=3100
SERVE_ONLY=false
BUILD_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --serve-only)  SERVE_ONLY=true; shift ;;
    --build-only)  BUILD_ONLY=true; shift ;;
    --port)        PORT="$2"; shift 2 ;;
    *)             echo "Unknown arg: $1"; exit 1 ;;
  esac
done

cd "$UI_ROOT"

# ─── Step 1: Build static export ──────────────────────────────────────────────

if ! $SERVE_ONLY; then
  echo ""
  echo "═══ Building static export (VITE_MOCK_API=true) ═══"
  echo ""

  # next.config.ts must have output: 'export' for static export.
  # We pass env vars to enable pure mock mode (no API calls, demo auth).
  NEXT_PUBLIC_MOCK_API=true \
  NEXT_PUBLIC_AUTH_PROVIDER=demo \
  NEXT_TELEMETRY_DISABLED=1 \
  npx next build

  echo ""
  echo "  Static export written to: $UI_ROOT/out/"
fi

if $BUILD_ONLY; then
  echo "  Build complete. Run with --serve-only to serve."
  exit 0
fi

# ─── Step 2: Serve ────────────────────────────────────────────────────────────

if [ ! -d "$UI_ROOT/out" ]; then
  echo "  Error: $UI_ROOT/out/ not found. Run without --serve-only first."
  exit 1
fi

# Prefer npx serve (zero-install static file server).
# Falls back to python3 http.server if serve is not available.
if command -v npx &>/dev/null && npx --yes serve --version &>/dev/null 2>&1; then
  echo ""
  echo "═══ Serving static export on :$PORT (npx serve) ═══"
  echo ""
  echo "  URL: http://localhost:$PORT"
  echo "  Dir: $UI_ROOT/out"
  echo ""
  npx serve "$UI_ROOT/out" -l "$PORT"
else
  echo ""
  echo "═══ Serving static export on :$PORT (python3 http.server) ═══"
  echo ""
  echo "  URL: http://localhost:$PORT"
  echo "  Dir: $UI_ROOT/out"
  echo ""
  cd "$UI_ROOT/out"
  python3 -m http.server "$PORT"
fi
