#!/usr/bin/env bash
#
# Git-Aware Quality Gates Snippet
#
# Add this AFTER the SOURCE_DIRS definition in your quality-gates.sh
# to enable differential quality gates (check only staged files).
#
# This solves the COD-SIZE deadlock:
#   - Service has 50 files with linter errors
#   - Fix file #1 (COD issue)
#   - quickmerge --files "file1.py new_validators.py"
#   - Quality gates check ONLY those 2 files (not all 50)
#   - ✅ PASS (no deadlock!)
#
# Location: Insert after SOURCE_DIRS definition, before quality gate checks
#

# Git-aware: If files are staged (e.g., via quickmerge --files), check ONLY staged files
# This prevents deadlock when fixing COD issues with other unrelated linter errors
STAGED_PY_FILES=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null | grep '\.py$' | tr '\n' ' ' || true)

if [ -n "$STAGED_PY_FILES" ]; then
    # Staged files detected → Differential quality gates (check only staged files)
    FILE_COUNT=$(echo "$STAGED_PY_FILES" | wc -w | tr -d ' ')
    SOURCE_DIRS="$STAGED_PY_FILES"
    echo -e "${YELLOW}🔍 Git-aware mode: Checking ONLY staged files ($FILE_COUNT files)${NC}"
    echo -e "${YELLOW}   Staged: $STAGED_PY_FILES${NC}"
    echo ""
    echo -e "${YELLOW}   Note: Unstaged files with errors will NOT block this commit${NC}"
    echo -e "${YELLOW}   (Prevents COD-SIZE deadlock when fixing one file at a time)${NC}"
    echo ""
fi

# After this snippet, continue with normal quality gate checks
# ruff check $SOURCE_DIRS will now check only staged files (if any)
