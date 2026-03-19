#!/usr/bin/env bash
# Restart batch-audit-ui dev server (clears Vite cache, kills port 5181, starts fresh)
#
# When to run:
#   - vite.config.ts changed
#   - .env or VITE_* env vars changed
#   - HMR seems stuck or shows stale code
#
# Hot reload (no restart needed):
#   - batch-audit-ui/src/** (components, pages, App.tsx, etc.)
#   - unified-trading-ui-kit/src/** (ui-kit is aliased to source in dev)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

PORT=5181

echo ">>> Stopping any process on port $PORT..."
lsof -ti:$PORT 2>/dev/null | xargs -r kill -9 2>/dev/null || true
sleep 1

echo ">>> Clearing Vite cache..."
rm -rf node_modules/.vite

echo ">>> Starting batch-audit-ui (VITE_MOCK_API=true, port $PORT)..."
VITE_MOCK_API=true npm run dev -- --port $PORT
