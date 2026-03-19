#!/usr/bin/env bash
#
# Quality Gates Template — Docs-Only / Infrastructure Repos
# SSOT: unified-trading-codex/06-coding-standards/quality-gates-infrastructure-docs-template.sh
#
# For repos containing only markdown, YAML, JSON, or config files (no Python source).
# No pytest, no basedpyright — markdown lint only.
#
# Instructions:
#   1. Copy this to scripts/quality-gates.sh in your repo
#   2. Run: bash scripts/quality-gates.sh
#
# Requirements: Node.js (for npx markdownlint-cli) or markdownlint-cli installed
#
# Usage:
#   ./scripts/quality-gates.sh        # Lint markdown
#   ./scripts/quality-gates.sh --no-fix  # Verify only (no auto-fix)
#
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_section() { echo -e "\n${BLUE}$1${NC}"; echo "----------------------------------------------------------------------"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_fail()    { echo -e "${RED}❌ $1${NC}"; }
log_warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

FIX_MODE=true
for arg in "$@"; do
    case $arg in
        --no-fix) FIX_MODE=false ;;
    esac
done

# ── [1] MARKDOWN LINT ─────────────────────────────────────────────────────────
log_section "[1/1] MARKDOWN LINT"
MD_FILES=$(find . -name "*.md" ! -path "./.git/*" ! -path "./node_modules/*" 2>/dev/null | head -500)
if [ -z "$MD_FILES" ]; then
    log_warn "No .md files found — nothing to lint"
else
    if command -v markdownlint &>/dev/null; then
        MDL_CMD="markdownlint"
    elif command -v npx &>/dev/null; then
        MDL_CMD="npx --yes markdownlint-cli"
    else
        log_fail "markdownlint-cli required: npm install -g markdownlint-cli, or ensure npx is available"
        exit 1
    fi
    if [ "$FIX_MODE" = true ]; then
        $MDL_CMD --fix "**/*.md" 2>/dev/null && log_success "Markdown lint (fix) PASSED" || \
        $MDL_CMD "**/*.md" 2>/dev/null && log_success "Markdown lint PASSED" || { log_fail "Markdown lint FAILED"; exit 1; }
    else
        $MDL_CMD "**/*.md" 2>/dev/null && log_success "Markdown lint PASSED" || { log_fail "Markdown lint FAILED"; exit 1; }
    fi
fi

echo -e "\n${GREEN}======================================================================"
echo -e "✅ DOCS QUALITY GATES PASSED${NC}"
