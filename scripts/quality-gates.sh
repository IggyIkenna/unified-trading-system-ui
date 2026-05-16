#!/usr/bin/env bash
# Quality Gates Stub — TypeScript/React UI
# SSOT: unified-trading-pm/codex/06-coding-standards/quality-gates-ui-template.sh
#
# Rolled out via: python3 unified-trading-pm/scripts/propagation/rollout-quality-gates-unified.py
# Do NOT edit per-repo — edit base-ui.sh in PM and re-run rollout to propagate.
# Gate logic lives in: unified-trading-pm/scripts/quality-gates-base/base-ui.sh
#
# Usage:
#   bash scripts/quality-gates.sh           # Full: typecheck + lint + tests + build
#   bash scripts/quality-gates.sh --test    # Typecheck + tests only (skip lint + build)
#   bash scripts/quality-gates.sh --lint    # Typecheck + lint only (skip tests + build)
#   bash scripts/quality-gates.sh --quick   # Typecheck + lint only (skip tests + build)
#   bash scripts/quality-gates.sh --no-fix  # Same as full (no-op flag; kept for compatibility)
#
EXPECTED_BASE_VERSION="1.0"
# UI coverage floor: actual is ~45% (many feature tabs are visual/stateful + deferred testing).
# Track uplift via unified-trading-pm/plans/active/coverage_uplift_*.md; raise as test suite matures.
MIN_UI_COVERAGE=${MIN_UI_COVERAGE:-40}
STEP_TIMEOUT_TYPECHECK=${STEP_TIMEOUT_TYPECHECK:-120}  # bumped: tsc on this codebase takes ~20s; 60s default too tight under load
STEP_TIMEOUT_LINT=${STEP_TIMEOUT_LINT:-180}            # bumped: ESLint on ~302 routes + React 19 hook rules takes ~60-90s; default 60s flakes
MAX_DURATION=${MAX_DURATION:-360}                      # bumped: full QG (typecheck + lint + 220 tests + build + orphan-audit + invariants) lands ~190-220s; 180s default too tight
WORKSPACE_ROOT="${WORKSPACE_ROOT:-$(cd "$(git rev-parse --show-toplevel)/.." && pwd)}"
BASE_UI="${WORKSPACE_ROOT}/unified-trading-pm/scripts/quality-gates-base/base-ui.sh"

if [[ ! -f "$BASE_UI" ]]; then
  echo "❌ Cannot find base-ui.sh at: $BASE_UI" >&2
  echo "   Ensure unified-trading-pm is cloned at the workspace root." >&2
  exit 1
fi

source "$BASE_UI" "$@"
