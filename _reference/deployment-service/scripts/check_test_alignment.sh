#!/usr/bin/env bash
# check_test_alignment.sh — Verify test infrastructure alignment across all workspace repos.
#
# Checks (per active repo with testing_level != none):
#   [1] scripts/quality-gates.sh exists (canonical stub)
#   [2] quality-gates.sh sources base-service.sh or base-library.sh (not a custom reimplementation)
#   [3] .github/workflows/quality-gates.yml exists
#   [4] GH Actions workflow calls "bash scripts/quality-gates.sh" (not inlined pytest)
#   [5] cloudbuild.yaml (if present) calls "scripts/quality-gates.sh" OR has --cov-fail-under (lib inline)
#   [6] No orphaned scripts/run_quality_gates.py (parallel reimplementation — delete these)
#   [7] GH Actions workflow clones unified-trading-pm (required for quality-gates.sh to source base scripts)
#
# Repos with testing_level=none are skipped entirely.
# Reads workspace-manifest.json — no hardcoded repo list.
#
# Usage:
#   bash deployment-service/scripts/check_test_alignment.sh          # all repos
#   bash deployment-service/scripts/check_test_alignment.sh <repo>   # single repo
#   bash deployment-service/scripts/check_test_alignment.sh --fix    # print fix hints

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MANIFEST="${WORKSPACE_ROOT}/unified-trading-pm/workspace-manifest.json"

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

FIX_MODE=false
REPO_FILTER=""
for arg in "$@"; do
    case "$arg" in
        --fix) FIX_MODE=true ;;
        --*) ;;  # ignore unknown flags
        *) REPO_FILTER="$arg" ;;
    esac
done

if [[ ! -f "$MANIFEST" ]]; then
    echo -e "${RED}❌ Manifest not found: ${MANIFEST}${NC}"
    echo "   Run from workspace root or any repo inside the workspace."
    exit 2
fi

# ── Parse manifest with python3 ───────────────────────────────────────────────
# Outputs: <name> <type> <status> <testing_level>  (tab-separated, one repo per line)
REPO_LIST=$(python3 - "${MANIFEST}" "${REPO_FILTER}" <<'PYEOF'
import json, sys
manifest_path = sys.argv[1]
repo_filter   = sys.argv[2] if len(sys.argv) > 2 else ""

with open(manifest_path) as f:
    data = json.load(f)

repos = data.get("repositories", {})
skip_statuses = {"deprecated", "archived", "deleted", "future", "scaffolded"}

for name, info in sorted(repos.items()):
    if repo_filter and name != repo_filter:
        continue
    status        = info.get("status", "active")
    testing_level = info.get("testing_level", "unit")
    repo_type     = info.get("type", "service")
    if status in skip_statuses:
        continue
    print(f"{name}\t{repo_type}\t{status}\t{testing_level}")
PYEOF
)

if [[ -z "$REPO_LIST" ]]; then
    if [[ -n "$REPO_FILTER" ]]; then
        echo -e "${RED}❌ Repo not found or skipped in manifest: ${REPO_FILTER}${NC}"
        exit 2
    fi
    echo "No active repos found in manifest."
    exit 0
fi

# ── Counters ──────────────────────────────────────────────────────────────────
total=0; skipped=0; passed=0; warned=0; failed=0

declare -a fail_repos=()
declare -a warn_repos=()

# ── Per-repo check ────────────────────────────────────────────────────────────
check_repo() {
    local name="$1" repo_type="$2" testing_level="$3"
    local repo_path="${WORKSPACE_ROOT}/${name}"
    local issues=0 warnings=0

    if [[ ! -d "$repo_path" ]]; then
        echo -e "  ${YELLOW}[SKIP]${NC}  ${name} — directory not found at ${repo_path}"
        ((skipped++)) || true
        return
    fi

    if [[ "$testing_level" == "none" ]]; then
        echo -e "  ${CYAN}[SKIP]${NC}  ${name} — testing_level=none"
        ((skipped++)) || true
        return
    fi

    local qg_sh="${repo_path}/scripts/quality-gates.sh"
    local gh_yml="${repo_path}/.github/workflows/quality-gates.yml"
    local cloudbuild="${repo_path}/cloudbuild.yaml"
    local orphan_py="${repo_path}/scripts/run_quality_gates.py"

    local repo_issues=()
    local repo_warns=()

    # [1] scripts/quality-gates.sh exists
    if [[ ! -f "$qg_sh" ]]; then
        repo_issues+=("MISSING scripts/quality-gates.sh (canonical stub)")
    else
        # [2] sources canonical base (not a custom reimplementation)
        if ! grep -qE "base-service\.sh|base-library\.sh|base-ui\.sh" "$qg_sh" 2>/dev/null; then
            repo_issues+=("quality-gates.sh does NOT source canonical base-service/library.sh")
        fi
    fi

    # [3] .github/workflows/quality-gates.yml exists
    if [[ ! -f "$gh_yml" ]]; then
        repo_issues+=("MISSING .github/workflows/quality-gates.yml")
    else
        # [4] GH Actions calls canonical bash scripts/quality-gates.sh
        if ! grep -q "bash scripts/quality-gates.sh" "$gh_yml" 2>/dev/null; then
            repo_issues+=("GH Actions does not call 'bash scripts/quality-gates.sh' — inlines pytest directly")
        fi
    fi

    # [5] cloudbuild.yaml — warn only if present but non-canonical
    #     Acceptable patterns:
    #       - calls "scripts/quality-gates.sh"        (service/Python pattern)
    #       - has "--cov-fail-under"                   (library inline pytest pattern)
    #       - has "npm test" or "npm run test"         (UI vitest pattern — QG runs before docker build)
    if [[ -f "$cloudbuild" ]]; then
        if ! grep -q "scripts/quality-gates.sh" "$cloudbuild" 2>/dev/null && \
           ! grep -q "\-\-cov-fail-under" "$cloudbuild" 2>/dev/null && \
           ! grep -qE "npm (run )?test" "$cloudbuild" 2>/dev/null; then
            repo_warns+=("cloudbuild.yaml: no recognized QG pattern (quality-gates.sh / --cov-fail-under / npm test)")
        fi
    else
        repo_warns+=("no cloudbuild.yaml (warn only — not all repos need it)")
    fi

    # [6] Orphaned run_quality_gates.py
    if [[ -f "$orphan_py" ]]; then
        repo_warns+=("ORPHANED scripts/run_quality_gates.py — superseded by quality-gates.sh; delete it")
    fi

    # [7] GH Actions must clone unified-trading-pm (quality-gates.sh sources base-*.sh from it)
    if [[ -f "$gh_yml" ]]; then
        if ! grep -q "unified-trading-pm" "$gh_yml" 2>/dev/null; then
            repo_issues+=("GH Actions does not clone unified-trading-pm — 'bash scripts/quality-gates.sh' will fail (cannot source base-service/library.sh)")
        fi
    fi

    issues=${#repo_issues[@]}
    warnings=${#repo_warns[@]}

    if [[ $issues -gt 0 ]]; then
        echo -e "\n  ${RED}[FAIL]${NC}  ${BOLD}${name}${NC}  (type=${repo_type}, testing=${testing_level})"
        for msg in "${repo_issues[@]}"; do
            echo -e "          ${RED}✗${NC} ${msg}"
        done
        for msg in "${repo_warns[@]}"; do
            echo -e "          ${YELLOW}⚠${NC} ${msg}"
        done
        if $FIX_MODE; then
            echo -e "          ${CYAN}→ Fix: python3 unified-trading-pm/scripts/propagation/rollout-quality-gates-unified.py --repo ${name}${NC}"
        fi
        ((failed++)) || true
        fail_repos+=("$name")
    elif [[ $warnings -gt 0 ]]; then
        echo -e "\n  ${YELLOW}[WARN]${NC}  ${BOLD}${name}${NC}  (type=${repo_type}, testing=${testing_level})"
        for msg in "${repo_warns[@]}"; do
            echo -e "          ${YELLOW}⚠${NC} ${msg}"
        done
        ((warned++)) || true
        warn_repos+=("$name")
    else
        echo -e "  ${GREEN}[PASS]${NC}  ${name}"
        ((passed++)) || true
    fi
    ((total++)) || true
}

# ── Main loop ─────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}━━━ Test Alignment Check ━━━${NC}"
echo -e "${CYAN}Workspace:${NC} ${WORKSPACE_ROOT}"
echo -e "${CYAN}Manifest:${NC}  ${MANIFEST}"
if [[ -n "$REPO_FILTER" ]]; then
    echo -e "${CYAN}Filter:${NC}    ${REPO_FILTER}"
fi
echo ""

while IFS=$'\t' read -r name repo_type _status testing_level; do
    check_repo "$name" "$repo_type" "$testing_level"
done <<< "$REPO_LIST"

# ── Summary ───────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}━━━ Summary ━━━${NC}"
echo -e "  Repos checked : $((total + skipped))"
echo -e "  Skipped       : ${skipped}  (testing_level=none or not found)"
echo -e "  ${GREEN}Passed${NC}        : ${passed}"
echo -e "  ${YELLOW}Warned${NC}        : ${warned}"
echo -e "  ${RED}Failed${NC}        : ${failed}"

if [[ ${#fail_repos[@]} -gt 0 ]]; then
    echo -e "\n${RED}FAILs:${NC}"
    for r in "${fail_repos[@]}"; do echo "  - $r"; done
fi
if [[ ${#warn_repos[@]} -gt 0 ]]; then
    echo -e "\n${YELLOW}WARNs:${NC}"
    for r in "${warn_repos[@]}"; do echo "  - $r"; done
fi

echo ""
if [[ $failed -gt 0 ]]; then
    echo -e "${RED}❌ ${failed} repo(s) have alignment failures.${NC}"
    if ! $FIX_MODE; then
        echo -e "   Re-run with --fix for remediation hints."
    fi
    echo -e "   Fix script: python3 unified-trading-pm/scripts/propagation/rollout-quality-gates-unified.py"
    exit 1
else
    echo -e "${GREEN}✅ All repos are aligned.${NC}"
    exit 0
fi
