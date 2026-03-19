#!/bin/bash
# check-ruff-versions.sh
# Verifies that ruff versions are consistent across:
#   - .pre-commit-config.yaml (pre-commit hooks)
#   - pyproject.toml (dev dependencies)
#   - .github/workflows/quality-gates.yml (CI)
#
# Usage: ./scripts/check-ruff-versions.sh
#
# Exit codes:
#   0 = All versions match
#   1 = Version mismatch detected

set -e

WORKSPACE_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$WORKSPACE_ROOT"

echo "============================================"
echo "Checking Ruff Version Consistency"
echo "============================================"
echo ""

MISMATCH_FOUND=0

# Check each repo with a .pre-commit-config.yaml
for repo in */; do
    repo_name="${repo%/}"

    # Skip non-repo directories
    if [ ! -f "$repo_name/.pre-commit-config.yaml" ]; then
        continue
    fi

    echo "Checking: $repo_name"

    # Extract versions
    precommit_version=$(grep -A2 "ruff-pre-commit" "$repo_name/.pre-commit-config.yaml" | grep "rev:" | sed 's/.*v//' || echo "NOT_FOUND")
    pyproject_version=$(grep "ruff==" "$repo_name/pyproject.toml" | sed 's/.*ruff==//' | sed 's/".*//' || echo "NOT_FOUND")
    ci_version=$(grep "ruff==" "$repo_name/.github/workflows/quality-gates.yml" | head -1 | sed 's/.*ruff==//' | sed 's/ .*//' || echo "NOT_FOUND")

    # Remove any trailing quotes/commas
    pyproject_version=$(echo "$pyproject_version" | sed 's/[",]//g')
    ci_version=$(echo "$ci_version" | sed 's/[",]//g')

    # Display versions
    echo "  .pre-commit-config.yaml: $precommit_version"
    if [ "$pyproject_version" != "NOT_FOUND" ]; then
        echo "  pyproject.toml:          $pyproject_version"
    fi
    if [ "$ci_version" != "NOT_FOUND" ]; then
        echo "  quality-gates.yml:       $ci_version"
    fi

    # Check for mismatches
    if [ "$precommit_version" != "NOT_FOUND" ] && [ "$pyproject_version" != "NOT_FOUND" ]; then
        if [ "$precommit_version" != "$pyproject_version" ]; then
            echo "  ❌ MISMATCH: pre-commit ($precommit_version) != pyproject.toml ($pyproject_version)"
            MISMATCH_FOUND=1
        fi
    fi

    if [ "$precommit_version" != "NOT_FOUND" ] && [ "$ci_version" != "NOT_FOUND" ]; then
        if [ "$precommit_version" != "$ci_version" ]; then
            echo "  ❌ MISMATCH: pre-commit ($precommit_version) != CI ($ci_version)"
            MISMATCH_FOUND=1
        fi
    fi

    if [ "$MISMATCH_FOUND" -eq 0 ]; then
        echo "  ✅ All versions match"
    fi

    echo ""
done

echo "============================================"
if [ "$MISMATCH_FOUND" -eq 0 ]; then
    echo "✅ All ruff versions are consistent"
    exit 0
else
    echo "❌ Version mismatches detected"
    echo ""
    echo "To fix:"
    echo "1. Update .pre-commit-config.yaml to match pyproject.toml version"
    echo "2. Run: pre-commit autoupdate"
    echo "3. Run: pre-commit install"
    exit 1
fi
