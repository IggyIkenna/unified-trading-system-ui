#!/usr/bin/env bash
# Start odum-research-website in mock mode (no credentials needed).
# Usage: npm run dev:mock
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKSPACE_ROOT="${WORKSPACE_ROOT:-$(cd "$REPO_ROOT/.." && pwd)}"
PM_DIR="${WORKSPACE_ROOT}/unified-trading-pm"

echo "🔧 Setting up mock mode..."

# 1. Copy .env.mock → .env.local (Next.js reads this automatically)
cp "$REPO_ROOT/.env.mock" "$REPO_ROOT/.env.local"
echo "  ✓ .env.local created from .env.mock"

# 2. Copy presentations from PM
DEST="$REPO_ROOT/public/presentations"
mkdir -p "$DEST/assets"
if [ -d "$PM_DIR/presentations" ]; then
  cp "$PM_DIR/presentations/"*.html "$DEST/" 2>/dev/null || true
  cp "$PM_DIR/presentations/assets/"* "$DEST/assets/" 2>/dev/null || true
  COUNT=$(ls "$DEST/"*.html 2>/dev/null | wc -l | tr -d ' ')
  echo "  ✓ Copied ${COUNT} presentations from unified-trading-pm"
else
  echo "  ⚠ unified-trading-pm/presentations/ not found — using existing local files"
fi

echo ""
echo "🚀 Starting Next.js dev server in mock mode..."
echo "   → http://localhost:3000"
echo "   → Login: click 'Log in' (auto-authenticates as admin)"
echo "   → Portal: /portal (all 10 presentations visible)"
echo "   → Admin: /admin (discover + manage presentations)"
echo ""

cd "$REPO_ROOT"
exec npx next dev --port 3000
