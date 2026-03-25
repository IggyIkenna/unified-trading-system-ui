#!/usr/bin/env bash
# CANONICAL SETUP — unified-trading-system
#
# Single source of truth for repo-local development environment setup.
# Copy to scripts/setup.sh in every repo. Idempotent — safe to re-run.
#
# SSOT: unified-trading-pm/scripts/setup.sh
# Codex: unified-trading-codex/06-coding-standards/setup-standards.md
#
# Usage:
#   bash scripts/setup.sh              # Full setup (idempotent)
#   bash scripts/setup.sh --check      # Verify setup without changes
#   bash scripts/setup.sh --force      # Force reinstall (ignores cache)
#   bash scripts/setup.sh --isolated   # Standalone repo setup (no workspace deps)
#   source scripts/setup.sh            # Setup + activate venv in current shell
#
# What this script does (in order):
#
#   ── REPO TYPE DETECTION (runs first) ──────────────────────────────────────
#   Detects repo type before any setup steps:
#     UI repo:     package.json present, no pyproject.toml → npm install path
#     Python repo: pyproject.toml present → Python venv path (steps 1-13)
#
#   ── UI REPO PATH (React/TypeScript) ───────────────────────────────────────
#   UI.1. Check Node.js version
#   UI.2. Run npm install (idempotent: skips if node_modules newer than package.json)
#   UI.3. Check TypeScript / tsc available
#   UI.4. Build library dist/ if missing (only for repos where "main" points to dist/)
#         Library repos (e.g. unified-trading-ui-kit) have dist/ gitignored; consumers
#         reference them via file: paths and need dist/ to exist before QG can run.
#   → exits 0 after UI setup (never falls through to Python steps)
#
#   ── PYTHON REPO PATH ──────────────────────────────────────────────────────
#    1. Validate Python version (>=3.13,<3.14 — or repo-specific override)
#    2. Architecture check (macOS only, local dev only — skipped in CI)
#       Rejects x86_64 Python on Apple Silicon (Rosetta) — ARM64 required
#    3. Bootstrap uv (the only pip install allowed; must run before venv creation)
#    4. Create .venv if missing or version mismatch (uv venv)
#    5. Activate .venv (source .venv/bin/activate)
#    6. Run uv lock (always — timestamp skip was insufficient; sibling bumps don't touch pyproject.toml)
#    7. Install local path dependencies from workspace-manifest.json (SSOT)
#       Reads unified-trading-pm/workspace-manifest.json; installs sibling repos
#       Installs jq automatically (apt/brew) if needed; exits 1 if jq unavailable
#       NOTE: step 7 runs BEFORE step 8 so siblings are resolvable during install.
#    8. Install project + dev deps (uv pip install -e .)
#    8b. Re-pin workspace sibling deps as editable (re-runs after step 8)
#        uv pip install -e . in step 8 may resolve siblings from PyPI/
#        Artifact Registry and overwrite the editable installs from step 7.
#        Step 8b forces the local editable version to win.
#    9. Verify ripgrep available (required by quality-gates.sh) — always runs
#   10. Verify ruff version matches workspace standard (0.15.0) — always runs
#   11. Import smoke test (python -c "import <package>") — always runs
#   12. GCP credentials check — informational only, never blocks; never reads
#       SA JSON files from repo root (use ADC: gcloud auth application-default login)
#   13. Print known caveats from AGENTS.md (if present)
#
# Idempotency:
#   - UI:  node_modules skipped if package-lock.json is newer than package.json (reliable:
#          lock file only updates on successful npm install; node_modules dir mtime is fragile)
#   - .venv creation: skipped if .venv/ exists with correct Python version
#   - uv lock: always runs (sibling version bumps don't update pyproject.toml timestamps)
#   - Dep install: always runs — same reason as uv lock; timestamp/stamp checks are
#     unreliable across machines and timezones; uv pip install is fast/idempotent
#   - Each step prints [SKIP] or [OK], never re-does work unnecessarily
#
# CI detection (GITHUB_ACTIONS, CI, or CLOUD_BUILD set):
#   Python repo: steps 1-8 (install/setup) are skipped — CI manages its own env.
#   Steps 9-13 (verification) always run.
#   UI repo: npm install step is skipped — CI manages node_modules.
#
# Exit codes:
#   0 = success
#   1 = fatal (wrong Python, missing deps, import failure)
#   2 = check mode found issues (--check)

set -e

# ── PATH EXTENSIONS (Homebrew, pyenv, etc. — bash doesn't source .zshrc) ────
for p in /opt/homebrew/bin /usr/local/bin "$HOME/.local/bin" "$HOME/.pyenv/shims"; do
    [ -d "$p" ] && case ":$PATH:" in *":$p:"*) ;; *) export PATH="$p:$PATH" ;; esac
done

# ── REPO-SPECIFIC SETTINGS (edit per repo) ──────────────────────────────────
# Override these in each repo's copy. Only PACKAGE_NAME is required.
PACKAGE_NAME="${PACKAGE_NAME:-}"        # e.g. "unified_api_contracts" — auto-detected from pyproject.toml if empty
REQUIRED_PYTHON="${REQUIRED_PYTHON:-3.13}"       # Major.minor — read from pyproject.toml if possible
REQUIRED_PYTHON_FULL="${REQUIRED_PYTHON_FULL:-3.13.9}"  # Exact patch — workspace standard (must match bootstrap)
REQUIRED_RUFF="${REQUIRED_RUFF:-0.15.0}"
# ── END REPO-SPECIFIC ───────────────────────────────────────────────────────

# ── COLORS + LOGGING ────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_ok()   { echo -e "${GREEN}  [OK] $1${NC}"; }
log_skip() { echo -e "${BLUE}  [SKIP] $1${NC}"; }
log_warn() { echo -e "${YELLOW}  [WARN] $1${NC}"; }
log_fail() { echo -e "${RED}  [FAIL] $1${NC}"; }
log_step() { echo -e "\n${BLUE}[$STEP_NUM] $1${NC}"; STEP_NUM=$((STEP_NUM + 1)); }
STEP_NUM=1

# ── PARSE ARGUMENTS ─────────────────────────────────────────────────────────
CHECK_ONLY=false
FORCE=false
ISOLATED=false
for arg in "$@"; do
    case $arg in
        --check) CHECK_ONLY=true ;;
        --force) FORCE=true ;;
        --isolated) ISOLATED=true ;;
        --help|-h)
            echo "Usage: bash scripts/setup.sh [--check|--force|--isolated|--help]"
            echo ""
            echo "  --check      Verify environment without making changes"
            echo "  --force      Force reinstall (ignores stamp cache)"
            echo "  --isolated   Standalone repo setup (no workspace deps)"
            echo "  --help       Show this message"
            echo ""
            echo "Idempotent. Safe to re-run. Skips steps already completed."
            echo ""
            echo "Flags can be combined: bash scripts/setup.sh --check --isolated"
            exit 0
            ;;
    esac
done

# ── RESOLVE PATHS ───────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_NAME=$(basename "$PROJECT_ROOT")
WORKSPACE_ROOT="${WORKSPACE_ROOT:-$(cd "$PROJECT_ROOT/.." && pwd)}"
cd "$PROJECT_ROOT"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  setup.sh — $REPO_NAME${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ── AUTO-DETECT PACKAGE_NAME ────────────────────────────────────────────────
if [ -z "$PACKAGE_NAME" ] && [ -f "pyproject.toml" ]; then
    # Try [project] name field first, convert dashes to underscores
    PACKAGE_NAME=$(grep -A 1 '^\[project\]' pyproject.toml | grep '^name' | sed 's/.*= *"//;s/".*//' | tr '-' '_' 2>/dev/null || echo "")
    # Verify the package directory actually exists (some repos have pyproject.toml but no Python package)
    if [ -n "$PACKAGE_NAME" ] && [ ! -d "$PACKAGE_NAME" ] && [ ! -d "src/$PACKAGE_NAME" ]; then
        PACKAGE_NAME=""
    fi
fi

# ── AUTO-DETECT REQUIRED_PYTHON from pyproject.toml ─────────────────────────
if [ -f "pyproject.toml" ]; then
    PYVER=$(grep 'requires-python' pyproject.toml | grep -oE '[0-9]+\.[0-9]+' | head -1 2>/dev/null || echo "")
    [ -n "$PYVER" ] && REQUIRED_PYTHON="$PYVER"
fi

# ── CI DETECTION ────────────────────────────────────────────────────────────
IN_CI=false
if [ -n "${GITHUB_ACTIONS:-}" ] || [ -n "${CI:-}" ] || [ -n "${CLOUD_BUILD:-}" ]; then
    IN_CI=true
    echo -e "  ${YELLOW}CI detected — skipping venv/deps setup (CI manages its own env)${NC}"
fi

ISSUES=0

# ── REPO TYPE DETECTION ─────────────────────────────────────────────────────
# UI repos (React/TypeScript): have package.json, no pyproject.toml
# Python repos: have pyproject.toml (may also have package.json for tooling)
IS_UI_REPO=false
if [ -f "package.json" ] && [ ! -f "pyproject.toml" ]; then
    IS_UI_REPO=true
fi

# ── UI REPO FLOW ─────────────────────────────────────────────────────────────
# For UI repos, skip all Python steps and run npm install instead, then exit.
if [ "$IS_UI_REPO" = true ]; then
    echo -e "  ${BLUE}UI repo detected (package.json, no pyproject.toml)${NC}"

    log_step "Node.js version"
    if command -v node &>/dev/null; then
        NODE_VER=$(node --version 2>&1)
        log_ok "Node $NODE_VER"
    else
        log_fail "Node.js not found — install: https://nodejs.org or: brew install node"
        ISSUES=$((ISSUES + 1))
        [ "$CHECK_ONLY" = true ] || exit 1
    fi

    log_step "npm / node_modules"
    if [ "$IN_CI" = true ]; then
        log_skip "CI mode — dependencies managed by CI"
    elif [ "$CHECK_ONLY" = true ]; then
        if [ -d "node_modules" ]; then
            log_ok "node_modules exists"
        else
            log_fail "node_modules missing — run: npm install"
            ISSUES=$((ISSUES + 1))
        fi
    elif [ -d "node_modules" ] && [ "$FORCE" != true ]; then
        # Re-install when package.json is newer than package-lock.json (reliable: lock file is
        # only updated by a *successful* npm install, so any edit to package.json will trigger
        # reinstall here even if node_modules dir mtime was touched by a failed prior install).
        if [ ! -f "package-lock.json" ] || [ "package.json" -nt "package-lock.json" ]; then
            log_warn "package.json changed (or no lock file) — running npm install"
            npm install --silent --legacy-peer-deps
            log_ok "npm install complete"
        else
            log_skip "node_modules up to date (package-lock.json in sync)"
        fi
    else
        npm install --silent --legacy-peer-deps
        log_ok "npm install complete"
    fi

    log_step "TypeScript / build tools"
    if [ -f "node_modules/.bin/tsc" ]; then
        TSC_VER=$(node_modules/.bin/tsc --version 2>&1 || echo "installed")
        log_ok "tsc $TSC_VER"
    else
        log_warn "tsc not found in node_modules (will be available after npm install)"
    fi

    # ── [UI.4] BUILD LIBRARY (if this repo is a library with gitignored dist/) ──
    # Detected by: package.json has "main" or "exports" pointing to dist/.
    # Libraries (e.g. unified-trading-ui-kit) have dist/ gitignored; consumers reference
    # them via file: paths and need dist/ to exist before quality-gates can run.
    # This step auto-builds dist/ when it is missing or empty — skipped for app repos.
    if [ "$IN_CI" = false ] && [ "$CHECK_ONLY" = false ]; then
        IS_LIB_REPO=false
        if [ -f "package.json" ]; then
            PKG_MAIN=$(node -e "const p=require('./package.json'); console.log(p.main||'')" 2>/dev/null || echo "")
            if [[ "$PKG_MAIN" == *"dist/"* ]]; then
                IS_LIB_REPO=true
            fi
        fi
        if [ "$IS_LIB_REPO" = true ]; then
            DIST_EMPTY=true
            if [ -d "dist" ] && [ "$(ls -A dist 2>/dev/null)" ]; then
                DIST_EMPTY=false
            fi
            if [ "$DIST_EMPTY" = true ] || [ "$FORCE" = true ]; then
                log_step "Build library dist/ (main points to dist/, dist/ missing or empty)"
                if npm run build --silent 2>&1; then
                    log_ok "npm run build complete — dist/ ready"
                else
                    log_warn "npm run build failed — consumers may fail to import; run: npm run build"
                    ISSUES=$((ISSUES + 1))
                fi
            else
                log_skip "dist/ exists and is non-empty (library already built)"
            fi
        fi
    fi

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    if [ "$ISSUES" -gt 0 ]; then
        echo -e "${RED}  $ISSUES issue(s) found${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        [ "$CHECK_ONLY" = true ] && exit 2 || exit 1
    else
        echo -e "${GREEN}  Setup complete — $REPO_NAME ready (UI repo)${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "  Next steps:"
        echo "    npm run dev                            # Start dev server"
        echo "    bash scripts/quality-gates.sh          # Run quality gates"
        echo "    bash scripts/quickmerge.sh \"message\"   # Full merge pipeline"
        echo ""
    fi
    exit 0
fi
# ── END UI REPO FLOW — Python repo continues below ──────────────────────────

# ── [1] PYTHON VERSION ─────────────────────────────────────────────────────
log_step "Python version (requires $REQUIRED_PYTHON_FULL)"

python_version_full() {
    local cmd="$1"
    "$cmd" --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 2>/dev/null || true
}

PYTHON_CMD=""
# Check pyenv exact version first (fastest on pyenv machines)
for candidate in \
    "$HOME/.pyenv/versions/${REQUIRED_PYTHON_FULL}/bin/python" \
    "$HOME/.pyenv/versions/${REQUIRED_PYTHON_FULL}/bin/python3" \
    "python${REQUIRED_PYTHON}" \
    python3 python; do
    for expanded in $candidate; do
        command -v "$expanded" &>/dev/null || [ -x "$expanded" ] || continue
        VER=$(python_version_full "$expanded")
        MM=$(echo "$VER" | grep -oE '^[0-9]+\.[0-9]+' || true)
        if [ "$VER" = "$REQUIRED_PYTHON_FULL" ]; then
            PYTHON_CMD="$expanded"
            break 2
        fi
        # Accept correct major.minor as a fallback candidate (warn on patch mismatch)
        if [ "$MM" = "$REQUIRED_PYTHON" ] && [ -z "$PYTHON_CMD" ]; then
            PYTHON_CMD="$expanded"
        fi
    done
done

if [ -n "$PYTHON_CMD" ]; then
    ACTUAL_FULL=$(python_version_full "$PYTHON_CMD")
    if [ "$ACTUAL_FULL" = "$REQUIRED_PYTHON_FULL" ]; then
        log_ok "Python $ACTUAL_FULL ($PYTHON_CMD)"
    else
        log_warn "Python $ACTUAL_FULL found (workspace standard is $REQUIRED_PYTHON_FULL)"
        echo "  Fix: pyenv install $REQUIRED_PYTHON_FULL && pyenv global $REQUIRED_PYTHON_FULL && pyenv rehash"
        echo "  Or:  uv python install $REQUIRED_PYTHON_FULL  (then set UV_PYTHON_PREFERENCE=system)"
    fi
    # Warn if Python is from uv's own cache — venvs will break if the cache is wiped
    if echo "$PYTHON_CMD" | grep -q "\.local/share/uv/python"; then
        log_warn "Python is from uv's internal cache ($PYTHON_CMD)"
        echo "  Venvs created from this Python break if ~/.local/share/uv/python/ is wiped."
        echo "  Recommended: install via pyenv and add to ~/.bashrc:"
        echo "    export UV_PYTHON=\"\$PYENV_ROOT/versions/$REQUIRED_PYTHON_FULL/bin/python3.13\""
        echo "    export UV_PYTHON_PREFERENCE=system"
        echo "    export UV_PYTHON_DOWNLOADS=never"
    fi
    # Rehash pyenv shims so this Python version is on PATH (no-op if pyenv not installed)
    command -v pyenv &>/dev/null && pyenv rehash 2>/dev/null || true
else
    log_fail "Python $REQUIRED_PYTHON_FULL not found"
    echo "  Install: pyenv install $REQUIRED_PYTHON_FULL && pyenv global $REQUIRED_PYTHON_FULL && pyenv rehash"
    echo "  Or:      uv python install $REQUIRED_PYTHON_FULL"
    echo "  Or (macOS): brew install python@${REQUIRED_PYTHON}"
    ISSUES=$((ISSUES + 1))
    [ "$CHECK_ONLY" = true ] || exit 1
fi

# ── [2] ARCHITECTURE CHECK (Apple Silicon — local dev only) ─────────────────
log_step "Architecture check"

if [ "$IN_CI" = true ]; then
    log_skip "CI mode — CI runs on Linux, arch check not applicable"
elif [[ "$OSTYPE" == "darwin"* ]] && [ -n "$PYTHON_CMD" ]; then
    ARCH=$(uname -m)
    PY_ARCH=$("$PYTHON_CMD" -c "import platform; print(platform.machine())" 2>/dev/null || echo "unknown")
    if [ "$ARCH" = "arm64" ] && [ "$PY_ARCH" = "x86_64" ]; then
        log_fail "Python is x86_64 (Rosetta) on ARM64 Mac — native ARM64 required"
        echo "  Fix: brew install python@${REQUIRED_PYTHON} (native ARM64)"
        ISSUES=$((ISSUES + 1))
        [ "$CHECK_ONLY" = true ] || exit 1
    else
        log_ok "Architecture: $ARCH / Python: $PY_ARCH"
    fi
else
    log_skip "Not macOS or no Python — skipping arch check"
fi

# ── [3] BOOTSTRAP UV (before venv creation — venv creation needs uv) ────────
log_step "Bootstrap uv"

if [ "$IN_CI" = true ]; then
    log_skip "CI mode"
elif [ "$CHECK_ONLY" = true ]; then
    command -v uv &>/dev/null && log_ok "uv available" || { log_fail "uv not found"; ISSUES=$((ISSUES + 1)); }
elif command -v uv &>/dev/null; then
    log_skip "uv already installed ($(uv --version 2>&1 | head -1))"
else
    "$PYTHON_CMD" -m pip install uv --quiet 2>/dev/null
    log_ok "Installed uv"
fi

# ── [4] VENV CREATION ──────────────────────────────────────────────────────
log_step "Virtual environment (.venv)"

if [ "$IN_CI" = true ]; then
    log_skip "CI mode — venv managed by CI"
elif [ "$CHECK_ONLY" = true ]; then
    if [ -d ".venv" ]; then
        log_ok ".venv exists"
    elif [ -d "../.venv-workspace" ] && [ -f "../.venv-workspace/bin/python" ]; then
        log_ok ".venv-workspace available (workspace venv)"
    else
        log_fail ".venv missing"
        ISSUES=$((ISSUES + 1))
    fi
elif [ -d ".venv" ] && [ "$FORCE" != true ]; then
    # Check pyvenv.cfg home= path is still valid (breaks when uv Python cache is wiped)
    PYVENV_CFG=".venv/pyvenv.cfg"
    VENV_HOME=""
    [ -f "$PYVENV_CFG" ] && VENV_HOME=$(grep '^home = ' "$PYVENV_CFG" 2>/dev/null | sed 's/home = //' || true)
    if [ -n "$VENV_HOME" ] && [ ! -d "$VENV_HOME" ]; then
        log_warn ".venv pyvenv.cfg home path no longer exists: $VENV_HOME"
        log_warn "Venv is broken (likely uv Python cache was wiped) — recreating"
        rm -rf .venv
        uv venv .venv --python "$PYTHON_CMD" 2>/dev/null || "$PYTHON_CMD" -m venv .venv
        log_ok "Recreated .venv (healed broken home path)"
    else
        VENV_FULL=$(python_version_full ".venv/bin/python" 2>/dev/null || true)
        VENV_MM=$(echo "$VENV_FULL" | grep -oE '^[0-9]+\.[0-9]+' || true)
        if [ "$VENV_MM" = "$REQUIRED_PYTHON" ]; then
            if [ "$VENV_FULL" != "$REQUIRED_PYTHON_FULL" ] && [ -n "$VENV_FULL" ]; then
                log_warn ".venv has Python $VENV_FULL (workspace standard is $REQUIRED_PYTHON_FULL) — recreating"
                rm -rf .venv
                uv venv .venv --python "$PYTHON_CMD" 2>/dev/null || "$PYTHON_CMD" -m venv .venv
                log_ok "Recreated .venv with Python $REQUIRED_PYTHON_FULL"
            else
                log_skip ".venv exists (Python $VENV_FULL)"
            fi
        else
            log_warn ".venv has Python $VENV_MM, need $REQUIRED_PYTHON — recreating"
            rm -rf .venv
            uv venv .venv --python "$PYTHON_CMD" 2>/dev/null || "$PYTHON_CMD" -m venv .venv
            log_ok "Recreated .venv with Python $REQUIRED_PYTHON"
        fi
    fi
else
    rm -rf .venv  # ensure clean slate (handles --force on stale venv and fresh creation)
    uv venv .venv --python "$PYTHON_CMD" 2>/dev/null || "$PYTHON_CMD" -m venv .venv
    log_ok "Created .venv"
fi

# ── [5] ACTIVATE VENV ──────────────────────────────────────────────────────
log_step "Activate .venv"

if [ "$IN_CI" = true ]; then
    log_skip "CI mode"
elif [ "$CHECK_ONLY" = true ]; then
    log_skip "Check mode — not activating"
elif [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    log_ok "Activated (.venv/bin/python)"
elif [ -f ".venv/Scripts/activate" ]; then
    source .venv/Scripts/activate
    log_ok "Activated (.venv/Scripts/python)"
else
    log_fail "No .venv/bin/activate found"
    ISSUES=$((ISSUES + 1))
    [ "$CHECK_ONLY" = true ] || exit 1
fi

# ── [6] UV LOCK ─────────────────────────────────────────────────────────────
log_step "uv lock sync"

if [ "$IN_CI" = true ]; then
    log_skip "CI mode"
elif [ "$CHECK_ONLY" = true ]; then
    [ -f "uv.lock" ] && log_ok "uv.lock present" || log_warn "uv.lock missing"
elif [ ! -f "pyproject.toml" ]; then
    log_skip "No pyproject.toml"
else
    # Always run uv lock — the timestamp check (uv.lock newer than pyproject.toml) is
    # insufficient: sibling workspace package version bumps don't touch THIS repo's
    # pyproject.toml, so the lock silently goes stale and uv falls back to PyPI wheels.
    #
    # Graceful fallback: repos with irreconcilable optional extras (e.g. openbb vs ruff)
    # cause uv lock to fail trying to resolve all extras simultaneously.
    # In that case we fall through to uv pip install -e . in step [8] directly.
    UV_LOCK_FAILED=false
    if ! uv lock 2>/dev/null; then
        log_warn "uv lock failed — optional dep conflict likely (e.g. incompatible extras)"
        echo "  Falling back to direct uv pip install (skipping lock step)"
        UV_LOCK_FAILED=true
    else
        log_ok "uv.lock synced"
    fi
fi

# ── [7] LOCAL PATH DEPENDENCIES ─────────────────────────────────────────────
# NOTE: Step 7 runs BEFORE step 8 (uv pip install -e .) so that sibling
# packages are already present as editables when pip resolves the dependency
# graph. Step 8b (below) re-pins them afterwards to guard against step 8
# overwriting editables with wheels pulled from PyPI/Artifact Registry.
log_step "Local path dependencies"

MANIFEST_PATH="$WORKSPACE_ROOT/unified-trading-pm/workspace-manifest.json"

if [ "$IN_CI" = true ] || [ "$CHECK_ONLY" = true ]; then
    log_skip "CI/check mode"
elif [ ! -f "$MANIFEST_PATH" ]; then
    log_skip "No workspace-manifest.json at $MANIFEST_PATH"
else
    # jq is required to parse workspace-manifest.json — install if missing
    if ! command -v jq &>/dev/null; then
        log_warn "jq not found — attempting install..."
        if command -v apt-get &>/dev/null; then
            sudo apt-get install -y jq --quiet 2>/dev/null && log_ok "Installed jq via apt" || { log_fail "jq install failed — run: sudo apt-get install jq"; ISSUES=$((ISSUES + 1)); exit 1; }
        elif command -v brew &>/dev/null; then
            brew install jq --quiet 2>/dev/null && log_ok "Installed jq via brew" || { log_fail "jq install failed — run: brew install jq"; ISSUES=$((ISSUES + 1)); exit 1; }
        else
            log_fail "jq required but not installable — install manually: https://jqlang.github.io/jq/download/"
            ISSUES=$((ISSUES + 1))
            exit 1
        fi
    fi

    DEPS=$(jq -r '.repositories["'"$REPO_NAME"'"].dependencies[]?.name // empty' "$MANIFEST_PATH" 2>/dev/null || echo "")

    if [ "$ISOLATED" = true ]; then
        log_skip "Isolated mode — skipping workspace path deps"
        if [ -n "$DEPS" ]; then
            log_warn "This repo depends on: $DEPS"
            log_warn "In isolated mode, install them from Artifact Registry (uv pip install <dep>)"
            log_warn "Some tests requiring these deps will fail — this is expected"
        fi
    elif [ -n "$DEPS" ]; then
        for dep in $DEPS; do
            DEP_PATH="$WORKSPACE_ROOT/$dep"
            if [ -d "$DEP_PATH" ] && [ -f "$DEP_PATH/pyproject.toml" ]; then
                if ! uv pip install -e "$DEP_PATH" --reinstall --quiet 2>/dev/null; then
                    log_fail "$dep editable install failed — check pyproject.toml and uv.lock in $dep"
                    ISSUES=$((ISSUES + 1))
                    [ "$CHECK_ONLY" = true ] || exit 1
                fi
                log_ok "$dep"
            else
                log_fail "$dep not found at $DEP_PATH — sibling repo must be checked out locally"
                log_fail "  Clone it, then re-run setup: bash scripts/setup.sh"
                ISSUES=$((ISSUES + 1))
                [ "$CHECK_ONLY" = true ] || exit 1
            fi
        done
    else
        log_skip "No dependencies for $REPO_NAME in workspace-manifest.json"
    fi
fi

# ── [8] PROJECT DEPS ───────────────────────────────────────────────────────
log_step "Project dependencies"

# Always run — same reasoning as uv lock (step [6]): timestamp/stamp checks are
# unreliable across machines, timezones, and sibling version bumps that don't touch
# this repo's pyproject.toml. uv pip install is fast/idempotent when nothing changed.
if [ "$IN_CI" = true ]; then
    log_skip "CI mode"
elif [ "$CHECK_ONLY" = true ]; then
    log_skip "Check mode"
elif [ ! -f "pyproject.toml" ]; then
    log_skip "No pyproject.toml"
else
    if ! uv pip install -e . --quiet 2>/dev/null; then
        log_fail "Project editable install failed — check pyproject.toml and uv.lock"
        exit 1
    fi
    log_ok "Dependencies installed"
fi

# ── [8b] RE-PIN WORKSPACE SIBLING DEPS AS EDITABLE ─────────────────────────
# NOTE: Step 8 (uv pip install -e .) resolves ALL deps from pyproject.toml
# and may pull workspace siblings as wheels from PyPI/Artifact Registry,
# overwriting the editable installs from step 7. This step re-pins every local
# sibling back to its editable source so the local checkout always wins.
if [ "$IN_CI" = true ] || [ "$CHECK_ONLY" = true ] || [ "$ISOLATED" = true ]; then
    : # skip — CI manages env; check mode is read-only; isolated has no siblings
elif [ ! -f "$MANIFEST_PATH" ]; then
    : # no manifest — nothing to re-pin
elif [ -n "${DEPS:-}" ]; then
    REPIN_FAIL=false
    for dep in $DEPS; do
        DEP_PATH="$WORKSPACE_ROOT/$dep"
        if [ -d "$DEP_PATH" ] && [ -f "$DEP_PATH/pyproject.toml" ]; then
            if ! uv pip install -e "$DEP_PATH" --reinstall --quiet 2>/dev/null; then
                log_fail "$dep re-pin failed in step 8b — step 8 may have overwritten it with a wheel"
                REPIN_FAIL=true
            fi
        fi
    done
    if [ "$REPIN_FAIL" = true ]; then
        log_fail "One or more sibling deps could not be re-pinned as editable — do not proceed"
        exit 1
    fi
    log_ok "Workspace sibling deps re-pinned as editable (step 8b)"
fi

# ── [8c] UV SYNC (transitive deps of path deps) ─────────────────────────────
# Steps 8 / 8b use uv pip install -e . and re-pin editables; that can leave
# transitive deps of path packages (e.g. google-cloud-storage from UCI) missing.
# uv sync applies the full lock file so all transitives are installed.
if [ "$IN_CI" = true ] || [ "$CHECK_ONLY" = true ]; then
    : # skip — CI manages env; check mode is read-only
elif [ -f "uv.lock" ] && [ -f "pyproject.toml" ]; then
    if uv sync --quiet 2>/dev/null; then
        log_ok "uv sync (lock applied, transitives installed)"
    else
        log_warn "uv sync failed — import smoke test may fail; run: uv sync"
    fi
fi

# ── [9] RIPGREP CHECK ──────────────────────────────────────────────────────
log_step "ripgrep (required by quality-gates.sh)"

if command -v rg &>/dev/null; then
    log_ok "ripgrep $(rg --version 2>&1 | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo 'installed')"
else
    log_fail "ripgrep not found"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  Install: brew install ripgrep"
    else
        echo "  Install: sudo apt-get install -y ripgrep  OR  cargo install ripgrep"
    fi
    ISSUES=$((ISSUES + 1))
fi

# ── [10] RUFF VERSION ──────────────────────────────────────────────────────
log_step "ruff version (workspace standard: $REQUIRED_RUFF)"

RUFF_CMD=""
[ -f ".venv/bin/ruff" ] && RUFF_CMD=".venv/bin/ruff"
[ -z "$RUFF_CMD" ] && command -v ruff &>/dev/null && RUFF_CMD="ruff"

if [ -n "$RUFF_CMD" ]; then
    RUFF_VER=$("$RUFF_CMD" --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "unknown")
    if [ "$RUFF_VER" = "$REQUIRED_RUFF" ]; then
        log_ok "ruff $RUFF_VER"
    else
        log_warn "ruff $RUFF_VER (expected $REQUIRED_RUFF)"
    fi
else
    log_warn "ruff not found — will be installed with dev deps"
fi

# ── [11] IMPORT SMOKE TEST ─────────────────────────────────────────────────
log_step "pytest deps (installed by step [8] uv pip install -e ., verifying now)"
if [ -d "tests" ]; then
  PY_CMD="${PYTHON_CMD:-python3}"
  [ -f ".venv/bin/python" ] && PY_CMD=".venv/bin/python"
  PYTEST_MISSING=()
  for mod in pytest pytest_cov pytest_timeout xdist; do
    if $PY_CMD -c "import $mod" 2>/dev/null; then
      log_ok "$mod"
    else
      PYTEST_MISSING+=("$mod")
    fi
  done
  if [ "${#PYTEST_MISSING[@]}" -gt 0 ]; then
    log_warn "pytest deps not installed (step [8] should have done this): ${PYTEST_MISSING[*]}"
    log_warn "Add missing entries to pyproject.toml [project.dependencies]:"
    log_warn "  pytest, pytest-cov, pytest-xdist, pytest-timeout"
    log_warn "Then re-run: bash scripts/setup.sh --force"
  fi
else
  log_skip "No tests/ — pytest deps optional"
fi

log_step "Import smoke test"

if [ -n "$PACKAGE_NAME" ]; then
    SMOKE_PYTHON="${PYTHON_CMD:-python3}"
    [ -f ".venv/bin/python" ] && SMOKE_PYTHON=".venv/bin/python"
    SMOKE_OUT=$($SMOKE_PYTHON -c "import $PACKAGE_NAME" 2>&1) && SMOKE_RC=0 || SMOKE_RC=$?
    if [ "$SMOKE_RC" -eq 0 ]; then
        log_ok "import $PACKAGE_NAME"
    else
        # Retry once: stale uv.lock is the most common cause of import failures
        # after adding new deps. Regenerate lock + sync, then retry import.
        echo "      [RETRY] Import failed — regenerating uv.lock and re-syncing..."
        if uv lock --quiet 2>/dev/null && uv sync --quiet 2>/dev/null; then
            SMOKE_OUT=$($SMOKE_PYTHON -c "import $PACKAGE_NAME" 2>&1) && SMOKE_RC=0 || SMOKE_RC=$?
            if [ "$SMOKE_RC" -eq 0 ]; then
                log_ok "import $PACKAGE_NAME (passed after uv lock + sync retry)"
            fi
        fi
        # If still failing after retry, report the error
        if [ "$SMOKE_RC" -ne 0 ]; then
            if [ "$ISOLATED" = true ]; then
                log_warn "import $PACKAGE_NAME FAILED (isolated mode — missing workspace deps may cause this)"
            else
                log_fail "import $PACKAGE_NAME FAILED"
                ISSUES=$((ISSUES + 1))
            fi
            if [ -n "$SMOKE_OUT" ]; then
                echo "      --- traceback ---"
                echo "$SMOKE_OUT" | sed 's/^/      /'
                echo "      ---"
            fi
        fi
    fi
else
    log_skip "PACKAGE_NAME not set and could not auto-detect"
fi

# ── [12] GCP CREDENTIALS (informational) ───────────────────────────────────
log_step "GCP credentials (informational)"

if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ] && [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    log_ok "GOOGLE_APPLICATION_CREDENTIALS set"
elif [ -f "$HOME/.config/gcloud/application_default_credentials.json" ]; then
    log_ok "ADC credentials (gcloud auth application-default login)"
else
    log_warn "No GCP credentials detected — run: gcloud auth application-default login"
    # Only warn about SA JSON if credential-like files found in repo root
    if find . -maxdepth 1 \( -name '*credentials*.json' -o -name 'central-element*.json' -o -name '*service*account*.json' \) 2>/dev/null | grep -q .; then
        log_warn "Never place SA JSON files in the repo root (use ADC or Secret Manager)"
    fi
fi

# ── [13] KNOWN CAVEATS (per-repo) ─────────────────────────────────────────
# If AGENTS.md exists, print a summary of known caveats for this repo.
# This helps AI agents and new developers understand what to expect.
if [ -f "AGENTS.md" ]; then
    log_step "Known caveats (from AGENTS.md)"
    # Extract lines between "## Known" and the next "##" heading
    CAVEATS=$(sed -n '/^## Known/,/^## /{/^## Known/d;/^## /d;/^$/d;p}' AGENTS.md 2>/dev/null | head -10)
    if [ -n "$CAVEATS" ]; then
        echo -e "  ${YELLOW}${CAVEATS}${NC}"
    else
        log_ok "AGENTS.md present (no known caveats section)"
    fi
fi

# ── SUMMARY ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$ISSUES" -gt 0 ]; then
    echo -e "${RED}  $ISSUES issue(s) found${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    [ "$CHECK_ONLY" = true ] && exit 2 || exit 1
else
    echo -e "${GREEN}  Setup complete — $REPO_NAME ready${NC}"
    if [ "$ISOLATED" = true ]; then
        echo -e "${YELLOW}  [ISOLATED MODE] Some tests may fail due to missing workspace deps${NC}"
    fi
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

# ── SOURCE/EXECUTE DETECTION ────────────────────────────────────────────────
if [[ "${BASH_SOURCE[0]:-}" != "${0}" ]] 2>/dev/null || [[ "$ZSH_EVAL_CONTEXT" == *:file:* ]] 2>/dev/null; then
    echo -e "  ${GREEN}venv active in current shell${NC}"
else
    echo -e "  ${YELLOW}Activate venv: source .venv/bin/activate${NC}"
    echo -e "  ${YELLOW}Or re-run with: source scripts/setup.sh${NC}"
fi
echo ""
echo "  Next steps:"
echo "    bash scripts/quality-gates.sh          # Run quality gates"
echo "    bash scripts/quickmerge.sh \"message\"   # Full merge pipeline"
if [ "$ISOLATED" = true ]; then
    echo ""
    echo "  Isolated mode notes:"
    echo "    - Workspace path deps were skipped; install from Artifact Registry if needed"
    echo "    - Cross-repo integration tests will fail — this is expected"
    echo "    - See AGENTS.md (if present) for repo-specific caveats"
fi
echo ""
