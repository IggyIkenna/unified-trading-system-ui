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
# Coverage floor — migrated from Jest to Vitest; raise as tests are added
export MIN_UI_COVERAGE=${MIN_UI_COVERAGE:-15}
WORKSPACE_ROOT="${WORKSPACE_ROOT:-$(cd "$(git rev-parse --show-toplevel)/.." && pwd)}"
BASE_UI="${WORKSPACE_ROOT}/unified-trading-pm/scripts/quality-gates-base/base-ui.sh"

if [[ ! -f "$BASE_UI" ]]; then
  echo "❌ Cannot find base-ui.sh at: $BASE_UI" >&2
  echo "   Ensure unified-trading-pm is cloned at the workspace root." >&2
  exit 1
fi

# G1.8 — archetype-capability UAC <-> UI coverage.ts parity.
# Reads the UAC manifest, re-renders coverage.ts in-memory, fails on drift.
# Regenerate with: bash unified-trading-pm/scripts/propagation/sync-archetype-capability-to-ui.sh --write
SYNC_ARCHETYPE_CAPABILITY="${WORKSPACE_ROOT}/unified-trading-pm/scripts/propagation/sync-archetype-capability-to-ui.sh"
if [[ -f "$SYNC_ARCHETYPE_CAPABILITY" ]]; then
  bash "$SYNC_ARCHETYPE_CAPABILITY" --check || exit 1
fi

# G1.7 — restriction-profile PM YAML <-> UI restriction-profiles.ts parity.
# Reads the 6 YAMLs at codex/14-playbooks/demo-ops/profiles/, re-renders the
# TS mirror in-memory, fails on drift.
# Regenerate with: bash unified-trading-pm/scripts/propagation/sync-restriction-profiles-to-ui.sh --write
SYNC_RESTRICTION_PROFILES="${WORKSPACE_ROOT}/unified-trading-pm/scripts/propagation/sync-restriction-profiles-to-ui.sh"
if [[ -f "$SYNC_RESTRICTION_PROFILES" ]]; then
  bash "$SYNC_RESTRICTION_PROFILES" --check || exit 1
fi

source "$BASE_UI" "$@"
