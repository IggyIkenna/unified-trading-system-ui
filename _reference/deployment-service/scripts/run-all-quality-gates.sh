#!/usr/bin/env bash
#
# Run quality gates for all services.
#
# Invokes each service's scripts/quality-gates.sh --no-fix.
# Default: parallel (up to 4 concurrent). Use --sequential for dependency order.
#
# Usage:
#   ./scripts/run-all-quality-gates.sh           # parallel (batches of 4)
#   ./scripts/run-all-quality-gates.sh --sequential   # one-by-one, dependency order, exit on first fail
#
# Full suite timeout: Sequential run for 13 services takes ~8-15 min (observed).
# CI/agents: use timeout >= 1800000 ms (30 min) to allow full run to complete.
#
# Requires: Same REPOS layout as check_test_alignment.sh (sibling dirs of deployment-service)
#
set +e  # Don't exit on first failure in parallel mode - we collect all results

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_ROOT="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DEPLOYMENT_ROOT")"

SEQUENTIAL=false
for arg in "$@"; do
    case $arg in
        --sequential) SEQUENTIAL=true ;;
        --help|-h)
            echo "Usage: $0 [--sequential]"
            echo "  --sequential  Run one-by-one in dependency order, exit on first failure"
            exit 0
            ;;
    esac
done

# Dependency order (from configs/dependencies.yaml execution_order)
REPOS_ORDERED=(
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
REPOS=("${REPOS_ORDERED[@]}")

MAX_PARALLEL=4
RESULTS_DIR=$(mktemp -d)
trap "rm -rf $RESULTS_DIR" EXIT

run_one() {
    local repo=$1
    local repo_path="$2"
    local result_file="$3"
    if (cd "$repo_path" && bash scripts/quality-gates.sh --no-fix > "$result_file.log" 2>&1); then
        echo 0 > "$result_file"
    else
        echo 1 > "$result_file"
    fi
}

run_one_sequential() {
    local repo=$1
    local repo_path="$2"
    if (cd "$repo_path" && bash scripts/quality-gates.sh --no-fix); then
        return 0
    else
        return 1
    fi
}

FAILED=0
PASSED=0
SKIPPED=0
REPOS_TO_RUN=()

# Phase 0a: Observability migration - only UTD v2 may use setup_cloud_logging/observability
if [ -f "$SCRIPT_DIR/check_observability_migration.py" ]; then
    echo -e "${BLUE}[Phase 0a] Checking observability migration (services must use unified_events_interface)...${NC}"
    if ! python3 "$SCRIPT_DIR/check_observability_migration.py"; then
        echo -e "${RED}❌ Services must use unified_events_interface. Only deployment-service may use setup_cloud_logging.${NC}"
        exit 1
    fi
    echo ""
fi

# Phase 0b: Cloud Build arg limit check (prevents "too many args" Cloud Build failure)
CLOUDBUILD_FILES=()
for repo in "${REPOS[@]}"; do
    cb="$REPO_ROOT/$repo/cloudbuild.yaml"
    if [ -f "$cb" ]; then
        CLOUDBUILD_FILES+=("$cb")
    fi
done
if [ ${#CLOUDBUILD_FILES[@]} -gt 0 ]; then
    echo -e "${BLUE}[Phase 0b] Checking Cloud Build limits in ${#CLOUDBUILD_FILES[@]} file(s)...${NC}"
    if ! python3 "$SCRIPT_DIR/check_cloudbuild_args_limit.py" "${CLOUDBUILD_FILES[@]}"; then
        echo -e "${RED}❌ One or more cloudbuild.yaml exceed Cloud Build limits - see cloud.google.com/build/quotas${NC}"
        exit 1
    fi
    echo ""
fi

for repo in "${REPOS[@]}"; do
    repo_path="$REPO_ROOT/$repo"
    if [ ! -d "$repo_path" ]; then
        echo -e "${YELLOW}[$repo] SKIP (not found)${NC}"
        ((SKIPPED++)) || :
    elif [ ! -f "$repo_path/scripts/quality-gates.sh" ]; then
        echo -e "${YELLOW}[$repo] SKIP (no quality-gates.sh)${NC}"
        ((SKIPPED++)) || :
    else
        REPOS_TO_RUN+=("$repo")
    fi
done

if [ "$SEQUENTIAL" = true ]; then
    echo -e "${BLUE}======================================================================${NC}"
    echo -e "${BLUE}RUN ALL QUALITY GATES (sequential, dependency order)${NC}"
    echo -e "${BLUE}======================================================================${NC}"
    echo ""
    set -e
    for repo in "${REPOS_TO_RUN[@]}"; do
        repo_path="$REPO_ROOT/$repo"
        echo -e "${BLUE}[$repo] Running...${NC}"
        if run_one_sequential "$repo" "$repo_path"; then
            echo -e "${GREEN}[$repo] PASSED${NC}"
            ((PASSED++)) || :
        else
            echo -e "${RED}[$repo] FAILED - exiting (use 'bash scripts/quality-gates.sh' in $repo to auto-fix, then re-run)${NC}"
            exit 1
        fi
    done
    echo ""
    echo -e "${GREEN}✅ All $PASSED quality gates passed${NC}"
    exit 0
fi

# Run in batches of MAX_PARALLEL
echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}RUN ALL QUALITY GATES (max $MAX_PARALLEL concurrent)${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

idx=0
total=${#REPOS_TO_RUN[@]}
while [ $idx -lt $total ]; do
    batch=0
    while [ $batch -lt $MAX_PARALLEL ] && [ $idx -lt $total ]; do
        repo="${REPOS_TO_RUN[$idx]}"
        repo_path="$REPO_ROOT/$repo"
        result_file="$RESULTS_DIR/$repo"
        echo -e "${BLUE}[$repo] Starting...${NC}"
        run_one "$repo" "$repo_path" "$result_file" &
        ((idx++)) || :
        ((batch++)) || :
    done
    wait
done

# Collect results
for repo in "${REPOS_TO_RUN[@]}"; do
    result_file="$RESULTS_DIR/$repo"
    if [ -f "$result_file" ]; then
        code=$(cat "$result_file")
        if [ "$code" -eq 0 ]; then
            echo -e "${GREEN}[$repo] PASSED${NC}"
            ((PASSED++)) || :
        else
            echo -e "${RED}[$repo] FAILED${NC}"
            ((FAILED++)) || :
            if [ -f "$result_file.log" ]; then
                echo "  Last 20 lines of log:"
                tail -20 "$result_file.log" | sed 's/^/    /'
            fi
        fi
    fi
done

echo ""
echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}SUMMARY${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo -e "Passed:  ${GREEN}$PASSED${NC}"
echo -e "Failed:  ${RED}$FAILED${NC}"
echo -e "Skipped: $SKIPPED"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ $FAILED service(s) failed quality gates${NC}"
    exit 1
fi
echo -e "${GREEN}✅ All quality gates passed${NC}"
exit 0
