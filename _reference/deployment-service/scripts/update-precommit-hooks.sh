#!/bin/bash
# update-precommit-hooks.sh
# Updates pre-commit hooks in all repos to use the latest versions
# and reinstalls hooks to ensure changes take effect
#
# Usage: ./scripts/update-precommit-hooks.sh
#
# What it does:
#   1. Runs `pre-commit autoupdate` in each repo (updates hook versions)
#   2. Runs `pre-commit install` in each repo (reinstalls hooks)
#   3. Optionally runs `pre-commit run --all-files` to format all code

set -e

WORKSPACE_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$WORKSPACE_ROOT"

echo "============================================"
echo "Updating Pre-commit Hooks"
echo "============================================"
echo ""

# Check if pre-commit is installed
if ! command -v pre-commit &> /dev/null; then
    echo "❌ pre-commit not found. Install it first:"
    echo "   uv pip install pre-commit"
    exit 1
fi

# Process each repo
for repo in */; do
    repo_name="${repo%/}"

    # Skip if no .pre-commit-config.yaml
    if [ ! -f "$repo_name/.pre-commit-config.yaml" ]; then
        continue
    fi

    echo "Processing: $repo_name"
    cd "$repo_name"

    # Install hooks (ensures they're up to date)
    echo "  Installing hooks..."
    pre-commit install --install-hooks 2>&1 | sed 's/^/    /'

    echo "  ✅ Done"
    echo ""

    cd "$WORKSPACE_ROOT"
done

echo "============================================"
echo "✅ Pre-commit hooks updated in all repos"
echo ""
echo "To format all code, run:"
echo "  cd <repo> && pre-commit run --all-files"
echo ""
echo "Or to update hook versions:"
echo "  cd <repo> && pre-commit autoupdate"
