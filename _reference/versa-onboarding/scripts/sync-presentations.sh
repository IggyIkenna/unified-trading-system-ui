#!/usr/bin/env bash
# Sync presentations from unified-trading-pm to public/presentations/
# Usage: bash scripts/sync-presentations.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKSPACE_ROOT="${WORKSPACE_ROOT:-$(cd "$REPO_ROOT/.." && pwd)}"
PM_DIR="${WORKSPACE_ROOT}/unified-trading-pm"
DEST="$REPO_ROOT/public/presentations"

if [ ! -d "$PM_DIR/presentations" ]; then
  echo "ERROR: $PM_DIR/presentations/ not found" >&2
  echo "Ensure unified-trading-pm is cloned at the workspace root." >&2
  exit 1
fi

mkdir -p "$DEST/assets"

# Sync HTML files
cp "$PM_DIR/presentations/"*.html "$DEST/" 2>/dev/null || true

# Sync assets (images, CSS, fonts)
if [ -d "$PM_DIR/presentations/assets" ]; then
  cp -R "$PM_DIR/presentations/assets/"* "$DEST/assets/" 2>/dev/null || true
fi

COUNT=$(ls "$DEST/"*.html 2>/dev/null | wc -l | tr -d ' ')
echo "Synced ${COUNT} presentations from unified-trading-pm to public/presentations/"
