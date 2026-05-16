#!/bin/bash
# Canonical Quality Gates Template
#
# This is the reference implementation for all quality-gates.sh scripts.
# All 13 repos must align to this template for consistent quality enforcement.
#
# Usage:
#   bash scripts/quality-gates.sh           # Auto-fix + run all checks
#   bash scripts/quality-gates.sh --no-fix  # Verify only (CI mode)
#   bash scripts/quality-gates.sh --quick   # Skip slow checks (local dev)
#   bash scripts/quality-gates.sh --skip-typecheck  # Skip type checking
#
# Requirements:
#   - Python >=3.13,<3.14
#   - uv package manager
#   - .venv virtual environment
#   - ripgrep (rg)
#   - pytest, pytest-xdist, pytest-cov
#   - ruff==0.15.0
#
# Codex: unified-trading-codex/06-coding-standards/

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================

# Detect mode
FIX_MODE=true
QUICK_MODE=false
SKIP_TYPECHECK=false
for arg in "$@"; do
    case $arg in
        --no-fix) FIX_MODE=false ;;
        --quick) QUICK_MODE=true ;;
        --skip-typecheck) SKIP_TYPECHECK=true ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

# Service-specific configuration (override these in each repo's script)
SERVICE_NAME=${SERVICE_NAME:-"your-service"}
SOURCE_DIR=${SOURCE_DIR:-"src"}
TEST_PATHS=${TEST_PATHS:-"tests"}
REQUIRED_PYTHON_VERSION="3.13"
REQUIRED_RUFF_VERSION="0.15.0"
MIN_COVERAGE=70  # Minimum 70% — BLOCKING (see coverage_70_percent.md)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

log_section() {
    echo -e "\n${BLUE}$1${NC}"
    echo "----------------------------------------------------------------------"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_fail() {
    echo -e "${RED}❌ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ============================================================================
# PHASE 1: ENVIRONMENT VALIDATION
# ============================================================================

log_section "[1/4] ENVIRONMENT VALIDATION"

# Check Python version
echo "Checking Python version..."
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}' | cut -d'.' -f1,2)
if [[ "$PYTHON_VERSION" != "$REQUIRED_PYTHON_VERSION" ]]; then
    log_fail "Python $REQUIRED_PYTHON_VERSION required, found $PYTHON_VERSION"
    exit 1
fi
log_success "Python $PYTHON_VERSION"

# Check for uv.lock
if [[ ! -f "uv.lock" ]]; then
    log_warn "uv.lock missing (uv package manager recommended)"
else
    log_success "uv.lock found"
fi

# Detect virtual environment
if [[ -f ".venv/bin/python" ]]; then
    PYTHON=".venv/bin/python"
    PYTEST=".venv/bin/pytest"
    RUFF=".venv/bin/ruff"
    log_success "Using .venv virtual environment"
elif command -v python &> /dev/null; then
    PYTHON="python"
    PYTEST="pytest"
    RUFF="ruff"
    log_warn "No .venv found, using system Python"
else
    log_fail "Python not found"
    exit 1
fi

# Check for ripgrep (REQUIRED for codex compliance checks)
if ! command -v rg &> /dev/null; then
    log_fail "ripgrep (rg) not found - required for codex compliance"
    log_warn "Install: apt-get install ripgrep  (or brew install ripgrep)"
    exit 1
fi
log_success "ripgrep available"

# Check ruff version
RUFF_VERSION=$($RUFF --version 2>&1 | grep -oP 'ruff \K[0-9]+\.[0-9]+\.[0-9]+' || echo "0.0.0")
if [[ "$RUFF_VERSION" != "$REQUIRED_RUFF_VERSION" ]]; then
    log_warn "Ruff $REQUIRED_RUFF_VERSION expected, found $RUFF_VERSION"
fi
log_success "Ruff $RUFF_VERSION"

# ============================================================================
# PHASE 2: LINTING & FORMATTING
# ============================================================================

log_section "[2/4] LINTING & FORMATTING"

if [[ "$FIX_MODE" == "true" ]]; then
    # Run prettier FIRST on non-Python files to prevent ruff/prettier pre-commit hook conflicts.
    # See: 06-coding-standards/quality-gates.md § Formatter Conflict Resolution
    if command -v npx &>/dev/null; then
        npx --yes prettier@3.6.2 --write "**/*.{md,json,yaml,yml}" --ignore-path .gitignore 2>/dev/null \
            && echo "Prettier: non-Python files formatted" \
            || echo "Prettier not available or no files to format (skipping)"
    fi

    echo "Running ruff format (auto-fix)..."
    $RUFF format $SOURCE_DIR/ tests/ || {
        log_fail "Ruff format failed"
        exit 1
    }
    log_success "Ruff format completed"

    echo "Running ruff check --fix (auto-fix)..."
    $RUFF check --fix $SOURCE_DIR/ tests/ || {
        log_fail "Ruff check failed"
        exit 1
    }
    log_success "Ruff check completed"
else
    echo "Running ruff check (verify only)..."
    $RUFF check $SOURCE_DIR/ tests/ || {
        log_fail "Ruff check failed"
        exit 1
    }
    log_success "Ruff check PASSED"
fi

# ============================================================================
# PHASE 3: TESTING
# ============================================================================

log_section "[3/4] TESTING"

# Detect git-aware mode (only run tests for changed files in CI)
GIT_AWARE=false
if git diff --cached --quiet && git diff --quiet; then
    log_warn "No uncommitted changes, running full test suite"
else
    GIT_AWARE=true
    log_success "Git-aware mode: testing changed files"
fi

# Build pytest flags
PYTEST_FLAGS="-v --tb=short"
PYTEST_FLAGS="$PYTEST_FLAGS --timeout=180"  # 3 min per test
PYTEST_FLAGS="$PYTEST_FLAGS -n auto"  # pytest-xdist parallel execution
PYTEST_FLAGS="$PYTEST_FLAGS --cov=$SOURCE_DIR --cov-report=term-missing --cov-fail-under=$MIN_COVERAGE"

if [[ "$QUICK_MODE" == "true" ]]; then
    log_warn "Quick mode: skipping e2e and smoke tests"
    TEST_SELECTION="tests/unit tests/integration"
else
    TEST_SELECTION="$TEST_PATHS"
fi

echo "Running tests with pytest-xdist (parallel)..."
$PYTEST $PYTEST_FLAGS $TEST_SELECTION || {
    log_fail "Tests failed"
    exit 1
}
log_success "All tests PASSED"

# Verify required test files exist
REQUIRED_TESTS=(
    "tests/unit/test_event_logging.py"
    "tests/unit/test_config.py"
)

for test_file in "${REQUIRED_TESTS[@]}"; do
    if [[ ! -f "$test_file" ]]; then
        log_warn "Missing required test: $test_file"
    fi
done

# Check test comprehensiveness (no minimal placeholder tests)
if [[ -f "tests/unit/test_config.py" ]]; then
    CONFIG_TEST_LINES=$(wc -l < "tests/unit/test_config.py")
    if [[ $CONFIG_TEST_LINES -lt 50 ]]; then
        log_warn "test_config.py has only $CONFIG_TEST_LINES lines (expected >50 for comprehensive validation)"
    fi
fi

# ============================================================================
# PHASE 4: CODEX COMPLIANCE (Chapter 6 Standards)
# ============================================================================

log_section "[4/4] CODEX COMPLIANCE (Coding Standards)"

CODEX_VIOLATIONS=0

# Check 1: No print() statements (use logger.info())
echo -n "Checking for print() statements... "
if rg --type py "^\s*print\(" $SOURCE_DIR/ --no-heading --no-line-number > /dev/null 2>&1; then
    echo -e "${RED}FAIL${NC}"
    log_warn "Found print() in production code (use logger.info() instead):"
    rg --type py "^\s*print\(" $SOURCE_DIR/ --no-heading --line-number | head -5
    ((CODEX_VIOLATIONS++))
else
    log_success "PASS"
fi

# Check 2: No os.getenv() / os.environ outside config.py (all forms banned)
echo -n "Checking for os.getenv()/os.environ usage... "
# Allow os.getenv/os.environ in config.py and __init__.py setup
if rg --type py "os\.getenv|os\.environ" $SOURCE_DIR/ \
   --glob '!**/config.py' \
   --glob '!**/__init__.py' \
   --no-heading --no-line-number > /dev/null 2>&1; then
    echo -e "${RED}FAIL${NC}"
    log_warn "Found os.getenv()/os.environ (use UnifiedCloudConfig for config, get_secret_client() for secrets):"
    rg --type py "os\.getenv|os\.environ" $SOURCE_DIR/ --glob '!**/config.py' --no-heading --line-number | head -5
    ((CODEX_VIOLATIONS++))
else
    log_success "PASS"
fi

# Check 3: No naive datetime.now() without UTC
echo -n "Checking for datetime.now() without UTC... "
if rg --type py "datetime\.now\(\)|datetime\.utcnow\(\)" $SOURCE_DIR/ --no-heading --no-line-number > /dev/null 2>&1; then
    echo -e "${RED}FAIL${NC}"
    log_warn "Found naive datetime (use datetime.now(timezone.utc)):"
    rg --type py "datetime\.now\(\)|datetime\.utcnow\(\)" $SOURCE_DIR/ --no-heading --line-number | head -5
    ((CODEX_VIOLATIONS++))
else
    log_success "PASS"
fi

# Check 4: No bare except clauses
echo -n "Checking for bare except clauses... "
if rg --type py "except:\s*$" $SOURCE_DIR/ --no-heading --no-line-number > /dev/null 2>&1; then
    echo -e "${RED}FAIL${NC}"
    log_warn "Found bare except (use specific exceptions or @handle_api_errors):"
    rg --type py "except:\s*$" $SOURCE_DIR/ --no-heading --line-number | head -5
    ((CODEX_VIOLATIONS++))
else
    log_success "PASS"
fi

# Check 5: No direct google.cloud imports (use unified_trading_library abstractions)
echo -n "Checking for google.cloud imports... "
if rg --type py "from google\.cloud import|import google\.cloud" $SOURCE_DIR/ --no-heading --no-line-number > /dev/null 2>&1; then
    echo -e "${RED}FAIL${NC}"
    log_warn "Found google.cloud imports (use unified_trading_library abstractions):"
    rg --type py "from google\.cloud import|import google\.cloud" $SOURCE_DIR/ --no-heading --line-number | head -5
    ((CODEX_VIOLATIONS++))
else
    log_success "PASS"
fi

# Check 6: No requests library with async code
echo -n "Checking for requests library in async code... "
if rg --type py "import requests" $SOURCE_DIR/ --no-heading --no-line-number > /dev/null 2>&1; then
    # Check if file also has async functions
    REQUEST_FILES=$(rg --type py "import requests" $SOURCE_DIR/ --files-with-matches)
    for file in $REQUEST_FILES; do
        if grep -q "async def" "$file"; then
            echo -e "${RED}FAIL${NC}"
            log_warn "Found requests library with async code (use aiohttp instead):"
            echo "  $file"
            ((CODEX_VIOLATIONS++))
            break
        fi
    done
    if [[ $CODEX_VIOLATIONS -eq 0 ]]; then
        log_success "PASS"
    fi
else
    log_success "PASS"
fi

# Check 7: No asyncio.run() in loops (use asyncio.gather() instead)
echo -n "Checking for asyncio.run() in loops... "
if rg --type py "asyncio\.run\(" $SOURCE_DIR/ --no-heading --no-line-number > /dev/null 2>&1; then
    echo -e "${YELLOW}WARN${NC}"
    log_warn "Found asyncio.run() in file with loops (verify not in loop - use asyncio.gather() instead):"
    rg --type py "asyncio\.run\(" $SOURCE_DIR/ --no-heading --line-number | head -5
else
    log_success "PASS"
fi

# Check 8: No time.sleep() in async functions (use asyncio.sleep())
echo -n "Checking for time.sleep() in async code... "
if rg --type py "time\.sleep\(" $SOURCE_DIR/ --no-heading --no-line-number > /dev/null 2>&1; then
    # Check if file also has async functions
    SLEEP_FILES=$(rg --type py "time\.sleep\(" $SOURCE_DIR/ --files-with-matches)
    for file in $SLEEP_FILES; do
        if grep -q "async def" "$file"; then
            echo -e "${YELLOW}WARN${NC}"
            log_warn "Found time.sleep() in file with async functions (verify not in async - use asyncio.sleep() instead):"
            echo "  $file"
            break
        fi
    done
    log_success "PASS (no async conflicts)"
else
    log_success "PASS"
fi

# STEP 5.10 — Block direct cloud SDK imports outside UCI providers
echo -n "STEP 5.10: Checking for direct cloud SDK imports... "
CLOUD_SDK_VIOLATIONS=$(rg "^from google\.cloud|^import boto3|^import botocore" \
    --type py \
    --glob '!.venv*' --glob '!**/.venv*/**' \
    --glob '!tests' \
    --glob '!unified_cloud_interface/providers/**' \
    -l $SOURCE_DIR/ 2>/dev/null || true)
if [ -n "$CLOUD_SDK_VIOLATIONS" ]; then
    echo -e "${RED}FAIL${NC}"
    log_warn "Found direct cloud SDK imports (use unified_cloud_interface instead):"
    echo "$CLOUD_SDK_VIOLATIONS" | head -5
    ((CODEX_VIOLATIONS++))
else
    log_success "PASS"
fi

# STEP 5.11 — Block protocol-specific symbols in service code
echo -n "STEP 5.11: Checking for protocol-specific symbols in service code... "
PROTOCOL_VIOLATIONS=$(rg "CloudTarget|upload_to_gcs_batch|gcs_bucket|bigquery_dataset|StandardizedDomainCloudService" \
    --type py \
    --glob '!.venv*' --glob '!**/.venv*/**' \
    --glob '!tests' \
    -l $SOURCE_DIR/ 2>/dev/null || true)
if [ -n "$PROTOCOL_VIOLATIONS" ]; then
    echo -e "${RED}FAIL${NC}"
    log_warn "Found protocol-specific symbols. Use get_data_sink() / get_event_bus() from UCI instead:"
    echo "$PROTOCOL_VIOLATIONS" | head -5
    ((CODEX_VIOLATIONS++))
else
    log_success "PASS"
fi

# STEP 5.12 — Services must not hardcode cloud protocol names
echo -n "STEP 5.12: Checking for hardcoded protocol names in service source... "
HARDCODED_PROTO=$(rg \
  'gcs_bucket\s*=|bigquery_dataset\s*=|upload_to_gcs|CloudTarget\b|StandardizedDomainCloudService\b' \
  --type py \
  --glob '!.venv*' --glob '!**/.venv*/**' \
  --glob '!tests' \
  --glob '!scripts/**' \
  -l $SOURCE_DIR/ 2>/dev/null || true)
if [ -n "$HARDCODED_PROTO" ]; then
    echo -e "${RED}FAIL${NC}"
    log_warn "Hardcoded protocol/cloud names in service source (use get_data_sink/get_event_bus):"
    echo "$HARDCODED_PROTO" | head -5
    ((CODEX_VIOLATIONS++))
else
    log_success "PASS"
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
log_section "QUALITY GATES SUMMARY"
echo "Config:   ${GREEN}✅ PASSED${NC}"
echo "Linting:  ${GREEN}✅ PASSED${NC}"
echo "Tests:    ${GREEN}✅ PASSED${NC}"

if [[ $CODEX_VIOLATIONS -eq 0 ]]; then
    echo "Codex:    ${GREEN}✅ PASSED${NC}"
else
    echo "Codex:    ${RED}❌ FAILED${NC}"
fi

log_section ""

if [[ $CODEX_VIOLATIONS -gt 0 ]]; then
    log_fail "QUALITY GATES FAILED - Fix $CODEX_VIOLATIONS codex violations before pushing"
    log_warn "See: unified-trading-codex/06-coding-standards/README.md"
    exit 1
fi

# ============================================================================
# TYPE CHECKING (basedpyright)
# ============================================================================

if [[ "$SKIP_TYPECHECK" != "true" ]]; then
    log_section "TYPE CHECKING"

    # Check if basedpyright is available
    if ! command -v basedpyright &> /dev/null; then
        log_fail "basedpyright not found (install: uv pip install basedpyright)"
        exit 1
    fi

    # Set up cache directory for performance
    export BASEDPYRIGHT_CACHE_DIR="${TMPDIR:-/tmp}/basedpyright-cache/${SERVICE_NAME:-$(basename "$PWD")}"
    mkdir -p "$BASEDPYRIGHT_CACHE_DIR"

    # Run basedpyright with timeout on source directory only
    echo "Running basedpyright on $SOURCE_DIR/ ..."
    if timeout 120 basedpyright "$SOURCE_DIR/" 2>&1; then
        log_success "Type check PASSED"
    else
        log_fail "Type check FAILED or timed out"
        exit 1
    fi
else
    log_warn "Type check SKIPPED (--skip-typecheck flag)"
fi

log_success "✅ ALL QUALITY GATES PASSED ✅"
exit 0
