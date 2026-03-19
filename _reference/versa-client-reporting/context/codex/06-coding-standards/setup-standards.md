# Setup Standards (setup.sh)

## TL;DR

Every service has `scripts/setup.sh` that bootstraps the local development environment in one idempotent command. It
validates Python, creates the venv, installs deps via `uv`, and runs smoke tests -- all in 12 deterministic steps.
**Never create venvs or install packages manually; always use setup.sh.** In CI (GitHub Actions, Cloud Build), steps 1-8
are skipped because CI manages its own Python and dependencies. If setup fails, fix the root cause -- never bypass.

**Status:** [IMPLEMENTING] -- Phase 1 rollout.

**Canonical Template:** `unified-trading-pm/scripts/setup.sh`

---

## What setup.sh Does (12 Steps)

| Step | Name                 | What It Does                                                                                      | Blocking? |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------- | --------- |
| 1    | Python version       | Finds Python matching `REQUIRED_PYTHON` (default 3.13). Exits 1 if not found.                     | Yes       |
| 2    | Architecture check   | On Apple Silicon (ARM64), rejects x86_64 (Rosetta) Python. Native ARM64 required.                 | Yes       |
| 3    | Venv creation        | Creates `.venv` via `uv venv` (or `python -m venv` fallback). Recreates if Python version drifts. | Yes       |
| 4    | Activate venv        | Sources `.venv/bin/activate` (macOS/Linux) or `.venv/Scripts/activate` (Windows).                 | Yes       |
| 5    | Bootstrap uv         | `pip install uv` -- the **only** pip install permitted in the entire workspace.                   | Yes       |
| 6    | uv lock              | Runs `uv lock` if `pyproject.toml` is newer than `uv.lock`. Ensures lockfile is current.          | No (warn) |
| 7    | Path dependencies    | Reads `workspace-manifest.json` (SSOT) and installs local workspace deps via `uv pip install -e`. | No (warn) |
| 8    | Project dependencies | `uv pip install -e ".[dev]"` -- installs the project and all dev dependencies.                    | No (warn) |
| 9    | ripgrep check        | Verifies `rg` is available. Required by quality-gates.sh codex compliance checks.                 | Yes       |
| 10   | ruff version         | Verifies installed ruff matches `REQUIRED_RUFF` (workspace standard: 0.15.0).                     | No (warn) |
| 11   | Import smoke test    | `python -c "import <PACKAGE_NAME>"` -- verifies the package is importable after install.          | Yes       |
| 12   | GCP credentials      | Checks for `GOOGLE_APPLICATION_CREDENTIALS` or service account JSON. Informational only.          | No (info) |

### Step Details

**Step 1 -- Python version:** Searches for `python3.13`, `python3`, then `python`, and validates the version string
matches `REQUIRED_PYTHON`. If no matching Python is found, prints install instructions (pyenv or Homebrew) and exits.

**Step 2 -- Architecture check:** On macOS ARM64 (`uname -m` = `arm64`), calls
`python -c "import platform; print(platform.machine())"`. If Python reports `x86_64`, the user has a Rosetta Python and
must install a native ARM64 build. This prevents subtle NumPy/pandas performance issues and binary compatibility
problems.

**Step 3 -- Venv creation:** If `.venv/` exists and its Python version matches, the step is skipped. If the version does
not match (e.g., user upgraded from 3.12 to 3.13), the old venv is deleted and recreated. Uses `uv venv` when uv is
available (faster), falls back to `python -m venv`.

**Step 5 -- Bootstrap uv:** This is the only place in the entire workspace where bare `pip install` is permitted. Every
subsequent package operation uses `uv pip install`. If uv is already on PATH, this step is skipped.

**Step 7 -- Path dependencies:** Reads `unified-trading-pm/workspace-manifest.json` (SSOT). For the current repo,
extracts `repositories[REPO_NAME].dependencies[].name` and installs each in editable mode from the workspace root.
Requires `jq` on the system.

**Step 11 -- Import smoke test:** Runs a minimal Python import of the detected `PACKAGE_NAME`. This catches broken
installs, missing native extensions, and import-time errors. If the package cannot be imported, setup fails.

**Step 12 -- GCP credentials:** Non-blocking check. Looks for `GOOGLE_APPLICATION_CREDENTIALS` env var pointing to a
valid file, or a `central-element-*.json` file in the repo root. Prints a warning if neither is found -- some services
work without GCP credentials (tests, local-only pipelines).

---

## Idempotency Guarantees

setup.sh is safe to run repeatedly. It uses three mechanisms to avoid redundant work:

### .setup-stamp

A zero-byte file (`$PROJECT_ROOT/.setup-stamp`) touched after successful dependency installation (step 8). On subsequent
runs, if `.setup-stamp` is newer than both `pyproject.toml` and `uv.lock`, step 8 is skipped entirely.

```
# Skip logic (step 8):
if [ -f "$SETUP_STAMP" ] && [ "$SETUP_STAMP" -nt "pyproject.toml" ]; then
    if [ ! -f "uv.lock" ] || [ "$SETUP_STAMP" -nt "uv.lock" ]; then
        # Dependencies are current — skip install
    fi
fi
```

### File Timestamp Comparisons

- **uv.lock vs pyproject.toml:** Step 6 (`uv lock`) is skipped if `uv.lock` is newer than `pyproject.toml`.
- **.setup-stamp vs pyproject.toml + uv.lock:** Step 8 is skipped if the stamp is newer than both files.
- **.venv Python version:** Step 3 checks the venv's Python version against `REQUIRED_PYTHON`. If they match, the venv
  is reused.

### Skip Logic Output

Every step prints one of four outcomes:

| Output   | Meaning                                 |
| -------- | --------------------------------------- |
| `[OK]`   | Step ran successfully                   |
| `[SKIP]` | Step was not needed (already satisfied) |
| `[WARN]` | Non-blocking issue (step continued)     |
| `[FAIL]` | Blocking issue (setup exits non-zero)   |

This makes it trivial to see what setup.sh actually did on each run. In a fully cached run, most steps print `[SKIP]`.

---

## CI Detection

setup.sh checks three environment variables to detect CI:

```bash
if [ -n "${GITHUB_ACTIONS:-}" ] || [ -n "${CI:-}" ] || [ -n "${CLOUD_BUILD:-}" ]; then
    IN_CI=true
fi
```

| Variable         | Set By                                  |
| ---------------- | --------------------------------------- |
| `GITHUB_ACTIONS` | GitHub Actions runners                  |
| `CI`             | Most CI systems (Jenkins, GitLab, etc.) |
| `CLOUD_BUILD`    | Google Cloud Build (custom, set in env) |

**When `IN_CI=true`:** Steps 1-8 are skipped. CI environments install their own Python (via `setup-python` action or
Docker image), create their own venvs, and install deps in their workflows. Re-doing this in setup.sh would be
redundant, slow, and fragile.

**Steps 9-12 always run**, even in CI. These are verification-only steps that do not modify the environment:

- Step 9 (ripgrep) ensures the CI image has `rg` installed.
- Step 10 (ruff version) warns if the CI ruff version drifts from the workspace standard.
- Step 11 (import smoke test) catches broken installs early.
- Step 12 (GCP credentials) is informational.

---

## Repo-Specific Settings

Three variables at the top of setup.sh can be overridden per repo:

```bash
PACKAGE_NAME="${PACKAGE_NAME:-}"           # Auto-detected from pyproject.toml [project] name
REQUIRED_PYTHON="${REQUIRED_PYTHON:-3.13}" # Read from requires-python in pyproject.toml
REQUIRED_RUFF="${REQUIRED_RUFF:-0.15.0}"   # Workspace standard ruff version
```

### PACKAGE_NAME

The Python package name used for the import smoke test (step 11). If left empty, setup.sh auto-detects it from the
`[project] name` field in `pyproject.toml`, converting dashes to underscores:

```
# pyproject.toml: name = "instruments-service"
# Auto-detected: PACKAGE_NAME = "instruments_service"
```

If auto-detection fails (no pyproject.toml or non-standard layout), set `PACKAGE_NAME` explicitly in the repo's copy.

### REQUIRED_PYTHON

The major.minor Python version required. Defaults to `3.13` but is overridden by `requires-python` in pyproject.toml if
present. For example, `requires-python = ">=3.13,<3.14"` sets `REQUIRED_PYTHON=3.13`.

### REQUIRED_RUFF

The exact ruff version that must match the workspace standard. Currently `0.15.0` across all repos. This value must stay
in sync with the versions in `pyproject.toml` dev deps, `.pre-commit-config.yaml`, and GitHub Actions workflows. See
quality-gates.md, Ruff Version Consistency section.

---

## Relationship to quality-gates.sh

setup.sh and quality-gates.sh have complementary, non-overlapping responsibilities:

| Concern          | setup.sh                                      | quality-gates.sh                          |
| ---------------- | --------------------------------------------- | ----------------------------------------- |
| Python version   | Validates and selects correct Python          | Inherits from activated venv              |
| Venv             | Creates, activates, manages lifecycle         | Expects venv already active               |
| Dependencies     | Installs all deps (project + dev + path deps) | Assumes deps are installed                |
| uv lock          | Runs `uv lock` when pyproject.toml changes    | Checks uv.lock exists                     |
| Linting          | --                                            | Runs ruff format + ruff check (two-phase) |
| Type checking    | --                                            | Runs basedpyright                         |
| Tests            | --                                            | Runs pytest (unit/integration/e2e/smoke)  |
| Codex compliance | --                                            | Runs rg-based pattern checks              |
| ripgrep          | Verifies `rg` is installed                    | Uses `rg` for codex compliance checks     |
| ruff version     | Verifies version matches workspace standard   | Uses ruff for formatting/linting          |

**Rule of thumb:** setup.sh prepares the environment; quality-gates.sh verifies the code.

quality-gates.sh may call setup.sh internally for bootstrap (creating venv and installing deps if they are missing), but
this is a convenience fallback -- the canonical flow is to run setup.sh first, then quality-gates.sh.

---

## Relationship to quickmerge.sh

quickmerge.sh is the developer-facing merge workflow script. It activates the venv, installs deps, runs quality gates,
and creates a merge branch -- all in one command. Its venv activation and dep installation logic mirrors setup.sh.

| Concern          | setup.sh                 | quickmerge.sh                             |
| ---------------- | ------------------------ | ----------------------------------------- |
| Venv activation  | Creates and activates    | Activates (expects venv to exist)         |
| Dep installation | Canonical implementation | Calls `uv pip install -e ".[dev]"`        |
| Quality gates    | --                       | Calls quality-gates.sh (two-phase)        |
| Git workflow     | --                       | Creates branch, pushes, optionally merges |

setup.sh is the **canonical implementation** for environment setup. quickmerge.sh duplicates some setup logic for
convenience (so developers can run `bash scripts/quickmerge.sh "message"` without a separate setup step), but setup.sh
is the authoritative reference for how the environment should be configured.

---

## When to Run setup.sh

Run setup.sh in these situations:

1. **First clone.** After cloning a repo for the first time, run `bash scripts/setup.sh` to create the venv, install
   deps, and verify the environment.

2. **After pyproject.toml changes.** When dependencies change (new package added, version bumped, dev dep added),
   setup.sh detects the change via timestamp comparison and reinstalls.

3. **After switching Python versions.** If you upgrade from Python 3.12 to 3.13, setup.sh detects the version mismatch
   in the existing venv and recreates it.

4. **When `--check` fails.** If `bash scripts/setup.sh --check` reports issues, run `bash scripts/setup.sh` (without
   `--check`) to fix them.

5. **After pulling changes that modify dependencies.** If a teammate added a new dependency and you pulled their
   changes, setup.sh picks up the pyproject.toml change and reinstalls.

6. **When the import smoke test fails.** If `python -c "import <package>"` fails for any reason, setup.sh reinstalls the
   package cleanly.

You do **not** need to run setup.sh:

- Before every quickmerge (quickmerge handles its own venv activation and dep install).
- In CI (CI manages its own environment; setup.sh detects this and skips setup steps).
- After code-only changes (no dependency or Python version changes).

---

## The --check Flag

```bash
bash scripts/setup.sh --check
```

Verify-only mode. Checks the environment without making any changes:

- Does **not** create or modify the venv.
- Does **not** install or upgrade packages.
- Does **not** activate the venv.
- Does **not** run `uv lock`.

**What it checks:**

- Python version is correct.
- Architecture is native (not Rosetta).
- `.venv` directory exists.
- uv is available on PATH.
- `uv.lock` file is present.
- ripgrep is available.
- ruff version matches workspace standard.
- Package is importable.
- GCP credentials are configured.

**Exit codes:**

- `0` -- All checks pass.
- `2` -- One or more checks failed (issues count printed).

**Use case:** CI agents and automated scripts that need to verify the environment is correct before proceeding, without
risking side effects. Also useful for debugging: "is my environment set up correctly?"

---

## The --force Flag

```bash
bash scripts/setup.sh --force
```

Force reinstall mode. Ignores all caching and skip logic:

- Recreates `.venv` even if it exists and has the correct Python version.
- Runs `uv lock` even if `uv.lock` is newer than `pyproject.toml`.
- Reinstalls all dependencies even if `.setup-stamp` is current.

**When to use:**

- After a corrupted venv (segfaults, broken symlinks, wrong site-packages).
- After a major uv upgrade that changes resolution behavior.
- When timestamp-based skip logic produces incorrect results (rare edge case with copied/restored files).

**When NOT to use:**

- Routine development. The default idempotent mode handles normal dependency changes.
- CI. CI builds from scratch every time; `--force` adds no value.

---

## Anti-Patterns

```bash
# WRONG: pip install in any context other than bootstrapping uv
pip install pandas
pip install -e ".[dev]"

# CORRECT: always use uv
uv pip install pandas
uv pip install -e ".[dev]"

# ──────────────────────────────────────────────

# WRONG: manual venv creation outside setup.sh
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# CORRECT: let setup.sh handle it
bash scripts/setup.sh

# ──────────────────────────────────────────────

# WRONG: interactive prompts in setup scripts
read -p "Install dev dependencies? (y/n) " REPLY

# CORRECT: setup.sh is non-interactive, always installs dev deps
uv pip install -e ".[dev]"

# ──────────────────────────────────────────────

# WRONG: requirements.txt as dep source
pip install -r requirements.txt
pip freeze > requirements.txt

# CORRECT: pyproject.toml is the SSOT for dependencies
uv pip install -e ".[dev]"

# ──────────────────────────────────────────────

# WRONG: skipping setup.sh and running quality gates directly
# (quality-gates.sh may bootstrap as a fallback, but this is not canonical)
bash scripts/quality-gates.sh  # on a fresh clone with no venv

# CORRECT: setup first, then quality gates
bash scripts/setup.sh
bash scripts/quality-gates.sh

# ──────────────────────────────────────────────

# WRONG: hardcoding Python version in setup script
PYTHON_CMD=python3.12

# CORRECT: read from pyproject.toml requires-python
REQUIRED_PYTHON=$(grep 'requires-python' pyproject.toml | grep -oE '[0-9]+\.[0-9]+' | head -1)
```

---

## SSOT Reference

The canonical setup.sh template lives at:

```
unified-trading-pm/scripts/setup.sh
```

This file is the single source of truth. All repos must use a copy of this template (with repo-specific `PACKAGE_NAME`
overrides if auto-detection fails). Changes to the setup flow are made in the canonical template first, then rolled out
to all repos.

The template is referenced by this document and by the repo-level `scripts/setup.sh` header comment:

```bash
# SSOT: unified-trading-pm/scripts/setup.sh
# Codex: unified-trading-codex/06-coding-standards/setup-standards.md
```

---

## Migration Note

As of Phase 1 rollout, 15 repos have ad-hoc `scripts/setup.sh` files that predate the canonical template. These files
vary in quality -- some only create a venv, some install deps via pip, some skip version checks entirely.

**Migration plan:**

1. Diff each repo's existing `setup.sh` against the canonical template.
2. Replace with the canonical template, preserving any repo-specific `PACKAGE_NAME` overrides.
3. Verify with `bash scripts/setup.sh --check` after replacement.
4. Run `bash scripts/quality-gates.sh` to confirm nothing broke.
5. Commit via quickmerge: `bash scripts/quickmerge.sh "chore: adopt canonical setup.sh template"`.

**What to watch for during migration:**

- Repos that set custom `REQUIRED_PYTHON` (rare -- most use 3.13).
- Repos with non-standard directory layouts where `PACKAGE_NAME` auto-detection fails.
- Repos that had extra setup steps (e.g., compiling native extensions, downloading models). These should be moved to a
  separate `scripts/setup-extras.sh` and called from the canonical template via a hook point if needed.

**Do NOT:**

- Merge the ad-hoc logic into the canonical template. The template must stay generic.
- Keep two setup scripts side-by-side. Replace, do not supplement.
- Skip the `--check` verification after migration. A broken setup.sh blocks all development.

---

## The --isolated Flag

```bash
bash scripts/setup.sh --isolated
```

Standalone repo mode. For when a repo is cloned without the full workspace (e.g., on a fresh VM, in a CI container, or
during a code review where you only need one repo).

**What changes in isolated mode:**

- **Step 7 (path deps):** Skipped entirely. Instead of installing workspace siblings, setup.sh prints which deps are
  expected and advises installing from Artifact Registry (`uv pip install <dep>`).
- **Step 11 (import smoke test):** If the import fails, it is logged as a warning (not a fatal error). Missing workspace
  deps are the most common cause of import failure in isolated mode.
- **Summary:** Prints an explicit "ISOLATED MODE" notice with guidance about expected test failures.

**When to use:**

- Cloning a single repo for code review, not the full workspace.
- CI containers that install deps from Artifact Registry (not local paths).
- AI agents working on a single repo in an isolated environment.
- New VMs where the full workspace hasn't been cloned yet.

**Combining flags:**

```bash
bash scripts/setup.sh --check --isolated   # Verify isolated environment
bash scripts/setup.sh --force --isolated   # Force reinstall, isolated
```

---

## Fresh Environment Setup (Full Workspace)

For setting up a completely new machine or VM with the full workspace:

```bash
# 1. Clone the PM repo first (it has the bootstrap script):
git clone git@github.com:IggyIkenna/unified-trading-pm.git

# 2. Run workspace bootstrap (clones all repos, installs system deps, runs setup.sh per repo):
bash unified-trading-pm/scripts/workspace-bootstrap.sh

# 3. Verify everything:
bash unified-trading-pm/scripts/workspace-bootstrap.sh --check
```

The workspace bootstrap script (`unified-trading-pm/scripts/workspace-bootstrap.sh`) handles:

1. **System dependencies** -- Python 3.13, uv, ripgrep, jq (via Homebrew on macOS, apt on Linux)
2. **Clone all repos** -- Reads `workspace-manifest.json` for the complete repo list
3. **Workspace venv** -- Creates `.venv-workspace` with ruff + basedpyright
4. **Per-repo setup** -- Runs `setup.sh` in topological order (T0 first, then T1, etc.)
5. **Import smoke test** -- Verifies all packages are importable

The script is idempotent -- it skips repos already cloned and deps already installed. Safe to re-run after pulling
changes or adding new repos.

### Prerequisites for Fresh Environments

| Requirement      | macOS                        | Linux (Ubuntu/Debian)   |
| ---------------- | ---------------------------- | ----------------------- |
| git              | `brew install git`           | `sudo apt install git`  |
| Python 3.13      | `brew install python@3.13`   | `pyenv install 3.13.0`  |
| SSH key (GitHub) | `ssh-keygen -t ed25519`      | `ssh-keygen -t ed25519` |
| Homebrew (macOS) | `/bin/bash -c "$(curl ...)"` | N/A                     |

---

**Workspace AGENTS.md (ephemeral):** The shared agent instructions live at `unified-trading-pm/AGENTS.md` (SSOT).
`setup-workspace-from-manifest.sh` copies this file to `$WORKSPACE_ROOT/AGENTS.md` during setup. The cleanup script
removes it before quickmerge/PR. This is separate from the optional per-repo AGENTS.md below.

## AGENTS.md (Per-Repo Caveats)

Each repo may optionally include an `AGENTS.md` file at its root. This file documents non-obvious caveats for AI agents
and developers working in the repo, especially in isolated or fresh environments.

**Template:** `unified-trading-pm/templates/AGENTS.md`

**What AGENTS.md documents:**

- **Known test failures** -- Pre-existing failures agents should expect (with issue links)
- **Isolation notes** -- What works standalone vs. what requires the full workspace
- **Dependency quirks** -- Non-obvious dep requirements (e.g., VCR cassettes needing httpx)
- **Type checking caveats** -- Pre-existing basedpyright errors agents should not try to fix
- **Troubleshooting** -- Common symptoms and their fixes

**Integration with setup.sh:** When `AGENTS.md` exists, setup.sh (step 13) reads the "## Known Caveats" section and
prints it during setup. This ensures agents and developers see important warnings without having to read the full file.

**When to create AGENTS.md:**

- The repo has known test failures that are tracked but not yet fixed
- The import smoke test has caveats in isolated mode
- There are non-obvious dependency requirements
- basedpyright or ruff have pre-existing issues

**When NOT to create AGENTS.md:**

- The repo has no caveats -- setup.sh handles everything
- The information belongs in README.md (user-facing) rather than AGENTS.md (agent-facing)

---

## Usage Summary

```bash
# Full setup (idempotent, safe to re-run)
bash scripts/setup.sh

# Verify environment without changes (CI/agent mode)
bash scripts/setup.sh --check

# Force full reinstall (corrupted venv, major tooling upgrade)
bash scripts/setup.sh --force

# Standalone repo setup (no workspace deps)
bash scripts/setup.sh --isolated

# Setup + activate venv in current shell
source scripts/setup.sh

# Show help
bash scripts/setup.sh --help

# Full workspace bootstrap (fresh VM)
bash unified-trading-pm/scripts/workspace-bootstrap.sh

# Verify full workspace
bash unified-trading-pm/scripts/workspace-bootstrap.sh --check
```

**Exit codes:**

| Code | Meaning                                  |
| ---- | ---------------------------------------- |
| 0    | Success                                  |
| 1    | Fatal error (wrong Python, missing deps) |
| 2    | Check mode found issues (`--check`)      |
