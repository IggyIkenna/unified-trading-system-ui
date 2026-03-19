#!/usr/bin/env bash
#
# Run uv lock in all Python repos.
# Use for initial setup or when you want to refresh all lock files at once.
# Quality gates run uv lock automatically per-repo; this script is for batch updates.
#
# Usage:
#   ./scripts/run-uv-lock-all.sh
#
# Requires: uv installed (pip install uv), same REPOS layout as run-all-quality-gates.sh
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_ROOT="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOYMENT_ROOT")"

REPOS=(
    "deployment-service"
    "unified-trading-library"
    "instruments-service"
    "market-tick-data-handler"
    "market-data-processing-service"
    "features-calendar-service"
    "features-delta-one-service"
    "features-volatility-service"
    "features-onchain-service"
    "ml-training-service"
    "ml-inference-service"
    "strategy-service"
    "execution-services"
)

for repo in "${REPOS[@]}"; do
    repo_path="$REPO_ROOT/$repo"
    if [ -f "$repo_path/pyproject.toml" ]; then
        echo "=== $repo ==="
        (cd "$repo_path" && uv lock 2>&1) || echo "  (skipped or failed)"
    fi
done

echo ""
echo "Done. Commit any modified uv.lock files."
