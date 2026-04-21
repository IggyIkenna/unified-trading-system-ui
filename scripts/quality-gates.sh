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
WORKSPACE_ROOT="${WORKSPACE_ROOT:-$(cd "$(git rev-parse --show-toplevel)/.." && pwd)}"
BASE_UI="${WORKSPACE_ROOT}/unified-trading-pm/scripts/quality-gates-base/base-ui.sh"

if [[ ! -f "$BASE_UI" ]]; then
  echo "❌ Cannot find base-ui.sh at: $BASE_UI" >&2
  echo "   Ensure unified-trading-pm is cloned at the workspace root." >&2
  exit 1
fi

# ── Orphan-route audit ────────────────────────────────────────────────────────
# Runs before the UI base gates so a freshly orphaned page fails QG immediately.
# Skip only if:
#   * the user passed --skip-lint / --lint-only (typecheck+tests-only paths),
#   * SKIP_ORPHAN_AUDIT=1 is set (human-only escape hatch for mid-flight rescues),
#   * the baseline file is absent (Phase-1 advisory mode — bootstrap case).
# SSOT: codex/06-coding-standards/orphan-audit.md.
REPO_DIR_FOR_AUDIT="$(cd "$(dirname "$0")/.." && pwd)"
BASELINE_FILE="${REPO_DIR_FOR_AUDIT}/scripts/.orphan-audit-baseline.json"
if [[ "${SKIP_ORPHAN_AUDIT:-0}" != "1" ]] && [[ -f "$BASELINE_FILE" ]]; then
  # Only run in phases that include lint (lint-only, quick, full) — skip for --test.
  _RUN_ORPHAN=1
  for arg in "$@"; do
    case "$arg" in
      --test) _RUN_ORPHAN=0 ;;
    esac
  done
  if [[ "$_RUN_ORPHAN" == "1" ]]; then
    echo "[quality-gates] Running orphan-route audit (blocking)…"
    if ! (cd "$REPO_DIR_FOR_AUDIT" && npx --yes tsx scripts/orphan-audit.ts --blocking); then
      echo "[quality-gates] ❌ Orphan-route audit FAILED — see output above." >&2
      echo "[quality-gates]    Fix, whitelist, or delete the orphan page before merging." >&2
      exit 1
    fi
  fi
fi

source "$BASE_UI" "$@"
