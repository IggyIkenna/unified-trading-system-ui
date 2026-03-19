#!/bin/bash
# Test all services with --dry-run to validate deployment configuration
# Uses reduced date range as recommended in spec: 2023-05-01 to 2024-07-31

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT"

echo "=============================================="
echo "Testing all services with --dry-run"
echo "Date range: 2023-05-01 to 2024-07-31"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

test_service() {
    local service=$1
    local extra_args="${2:-}"

    echo -e "${YELLOW}Testing: ${service}${NC}"

    if python -m deployment_service.cli deploy \
        --service "$service" \
        --compute cloud_run \
        --start-date 2023-05-01 \
        --end-date 2024-07-31 \
        $extra_args \
        --dry-run 2>&1; then
        echo -e "${GREEN}✓ ${service} - PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ ${service} - FAILED${NC}"
        ((FAILED++))
    fi
    echo ""
}

# Test each service
echo "=== Data I/O Services ==="
test_service "instruments-service"
test_service "market-tick-data-handler" "--category CEFI"

echo "=== Processing Service ==="
test_service "market-data-processing-service" "--category CEFI"

echo "=== Feature Services ==="
test_service "features-delta-one-service" "--category CEFI"
test_service "features-volatility-service" "--category CEFI"
test_service "features-onchain-service" "--category CEFI"
test_service "features-calendar-service" "--category CEFI"

echo "=== ML Services ==="
test_service "ml-training-service" "--instrument BTC"
test_service "ml-inference-service" "--instrument BTC"

echo "=== Backtesting Services ==="
test_service "strategy-service" "--category CEFI"
test_service "execution-services"

echo "=============================================="
echo "SUMMARY"
echo "=============================================="
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All services validated successfully!${NC}"
    exit 0
else
    echo -e "${RED}Some services failed validation.${NC}"
    exit 1
fi
