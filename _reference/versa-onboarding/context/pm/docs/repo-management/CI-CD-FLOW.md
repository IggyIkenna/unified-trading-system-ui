# Full CI/CD Flow — SSOT

**SSOT:** This document. Single entry point for dependency alignment, setup, sync-to-main, and conflict resolution.
**Related:** `docs/ci-cd-ssot.md` §7 — Cloud Build/CodeBuild templates, rollout scripts, SIT build source.

**Run from workspace root:** All scripts assume you run from the workspace root (parent of unified-trading-pm). cd there
first, then run any script.

Run scripts in this order. Do not skip steps when dependencies or code have changed.

---

## Workspace Lifecycle Overview

Two distinct entry points — do not conflate them:

### Linux prerequisites (before running bootstrap)

On Linux with pyenv, add these to `~/.bashrc` (or `~/.profile`) **before** running the bootstrap. Without them, `uv`
auto-downloads its own CPython into `~/.local/share/uv/python/`, all 50+ venvs point to that cache, and when the cache
is cleaned every venv breaks simultaneously. The pyenv-virtualenv hook also silently wipes `VIRTUAL_ENV` on every prompt
if the global pyenv version does not exist on disk.

```bash
# ~/.bashrc additions (Linux + pyenv)

# pyenv init
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PYENV_ROOT/shims:$PATH"
eval "$(pyenv init -)"
# eval "$(pyenv virtualenv-init -)"   # only if you use pyenv-virtualenv

# Force uv to use pyenv Python — never auto-download its own CPython
export UV_PYTHON="$PYENV_ROOT/versions/3.13.9/bin/python3.13"
export UV_PYTHON_PREFERENCE=system    # resolve version specs via PATH/pyenv shims
export UV_PYTHON_DOWNLOADS=never      # hard-block uv from downloading CPython

# Prevent pyenv-virtualenv hook from double-prefixing PS1 or clobbering VIRTUAL_ENV
export PYENV_VIRTUALENV_DISABLE_PROMPT=1
```

After editing `~/.bashrc`: `source ~/.bashrc && pyenv install 3.13.9 && pyenv global 3.13.9 && pyenv rehash`

These settings are not needed on macOS — Homebrew Python is on PATH and uv respects it.

---

### New Machine (run once)

```bash
mkdir -p ~/repos/unified-trading-system-repos
cd ~/repos/unified-trading-system-repos

# Self-contained — no prior clone required. Bootstrap clones PM first (Phase 0),
# then reads its manifest to clone everything else and set up the full workspace.
bash <(curl -fsSL https://raw.githubusercontent.com/IggyIkenna/unified-trading-pm/main/scripts/workspace/workspace-bootstrap.sh)

# Or if you already have PM cloned:
bash unified-trading-pm/scripts/workspace/workspace-bootstrap.sh

# Preserve existing repos (skip delete + re-clone — faster for incremental runs):
bash unified-trading-pm/scripts/workspace/workspace-bootstrap.sh --skip-fresh
```

```
Phase 0: Self-seed unified-trading-pm — clones it if missing; pulls origin/main if present.
Phase 1: System deps (Python 3.13, uv, rg, jq)
Phase 2: Fresh clone all repos from workspace-manifest.json
         Default: delete existing dirs + re-clone (clean state guaranteed)
         --skip-fresh: preserve existing dirs (incremental runs)
Phase 3: .venv-workspace via setup-workspace-venv.sh (ruff==0.15.0, basedpyright==1.38.2)
Phase 4: Per-repo setup.sh in topological order (T0 → T1 → T2 → T3)
Phase 5: Import smoke test across all Python repos
```

**No chicken-and-egg:** Phase 0 clones PM automatically. `workspace-manifest.json` in PM is the single source of truth
for repo list, tiers, and versions.

### Day-to-Day (after every version alignment)

```
run-version-alignment.sh --fix      # align pyproject.toml versions + manifest
  └── auto-calls sync-workspace-venv.sh   # refresh .venv-workspace editable installs

run-all-setup.sh --rollout-first    # propagate setup.sh + QG stubs + build infra (Dockerfile, cloudbuild, buildspec) + rebuild per-repo .venv

run-all-quality-gates.sh            # local e2e smoke test (all tiers, parallel within tier)
  └── --repo X / --repos "X Y"      # subset mode — skip alignment + setup checks
  └── --skip-typecheck               # skip basedpyright (fast iteration)
  └── --lint                         # lint only, skip tests (fastest)
  └── --test                         # tests + typecheck only, skip lint

→ if all pass → system-integration-tests → deployment
```

**Two venvs, two responsibilities:**

| venv               | Purpose                                       | PYTHON_CMD / BASEDPYRIGHT_CMD                                   | Rebuilt by                      |
| ------------------ | --------------------------------------------- | --------------------------------------------------------------- | ------------------------------- |
| `.venv-workspace`  | IDE IntelliSense; `RUFF_CMD` in QG only       | **Never** — workspace has extra packages that mask missing deps | `sync-workspace-venv.sh`        |
| `.venv` (per-repo) | QG Python, basedpyright, pytest — CI-faithful | **Always** used for type-checking and test execution            | `run-all-setup.sh` / `setup.sh` |

See `unified-trading-codex/06-coding-standards/quality-gates.md § Tool Version Pinning` for the full rationale.

---

## How Setup and Quality Gates Work for Every Repo

**setup.sh** — One canonical file from PM. It auto-detects repo type (Python vs UI) and branches internally: Python
repos get `uv lock`, venv, path deps; UI repos get `npm install`. No repo-specific customization needed; each repo has
its own `pyproject.toml` or `package.json`.

**quality-gates.sh** — A ~10-line config stub per repo (sets `SERVICE_NAME`/`PACKAGE_NAME`, `SOURCE_DIR`,
`MIN_COVERAGE`, `RUN_INTEGRATION`, `LOCAL_DEPS`) that sources the appropriate base script from PM:
`unified-trading-pm/scripts/quality-gates-base/base-{service,library,codex}.sh`. Gate logic lives only in those base
scripts — never in per-repo files. UI repos have a minimal TypeScript stub (npm typecheck, lint, smoketest).

To add or change a gate check: edit the PM base script. It applies instantly to all repos — no rollout needed. To change
the stub interface (new required variable): edit the codex scaffold template, run rollout, commit stubs.

**Rollout** — `run-all-setup.sh --rollout-first` runs three propagation scripts:

1. `rollout-quality-gates-unified.py` — copies `setup.sh`, `quality-gates.sh`, writes QG config stubs
2. `rollout-quickmerge.py` — copies `quickmerge.sh`
3. `rollout-ui-build-infra.py` — generates `Dockerfile`, `cloudbuild.yaml`, `buildspec.aws.yaml` for UI/batch/API repos

Run when `setup.sh` changes in PM, when the stub interface changes, when build infra templates change, or use
`--rollout-first` for first-time bootstrap.

---

## Phase 1: Dependency Alignment (manifest ↔ pyproject.toml)

Align workspace manifest with pyproject.toml in each repo. Fix any fixable misalignments; flag unresolvable ones.

```bash
cd /path/to/unified-trading-system-repos

# 1. Check alignment
bash unified-trading-pm/scripts/repo-management/run-version-alignment.sh

# 2. If misaligned, fix (tier-aware; tier violations are flagged, not auto-fixed)
bash unified-trading-pm/scripts/repo-management/run-version-alignment.sh --fix

# 3. Re-check until clean (or until only unresolvable remain)
bash unified-trading-pm/scripts/repo-management/run-version-alignment.sh
```

**Unresolvable:** Tier violations and constraint conflicts are reported and exit 1. Resolve manually (e.g. update
manifest, relax constraints) before proceeding.

**Test-harness repos (e.g. `system-integration-tests`):** These repos use plain-string dep format in
`workspace-manifest.json` (e.g. `"unified-trading-library"` not `{"name": "unified-trading-library", "version": "..."}`)
and have no `pyproject.toml` editable deps pointing to internal services. This is intentional — SIT has zero Python
imports from services (codex SSOT constraint: `unified-trading-codex/05-infrastructure/sit-standards.md`). The alignment
scanner (`check-dependency-alignment.py`) silently skips plain-string manifest deps, so these repos will always report
`"aligned": true` regardless of changes to their `pyproject.toml`. No alignment action is needed or expected for them.

**Ref:** `scripts/repo-management/README-ALIGNMENT-AND-SETUP.md`, `scripts/manifest/README-DEPENDENCY-ALIGNMENT.md`

---

## Phase 2: Run Setup (venvs + uv.lock ↔ tomls)

Update VM venvs and uv.lock in every repo so they match pyproject.toml.

```bash
# Standard: run setup.sh in each repo
bash unified-trading-pm/scripts/repo-management/run-all-setup.sh

# First-time bootstrap or after setup.sh / stub interface changes: rollout first, then setup. --force for hard reinstall and wipe of existing dependencies
bash unified-trading-pm/scripts/repo-management/run-all-setup.sh --rollout-first --force
```

Runs `scripts/setup.sh` per repo in topological order. `setup.sh` **always** runs `uv lock` (timestamp skip was removed
— sibling version bumps don't touch `pyproject.toml`, so timestamps are unreliable). With `--rollout-first`, propagates
`setup.sh` + QG config stubs from PM to all repos before running setup.

**After:** Commit and push any changed `pyproject.toml`, `uv.lock`, `workspace-manifest.json` so agents and CI get
identical deps.

**Ref:** `scripts/repo-management/README-ALIGNMENT-AND-SETUP.md`

---

## Phase 2b: Workspace Venv Sync

After Phase 2, refresh `.venv-workspace` so editable installs reflect updated dep versions. This is automatic when using
`--fix` — `run-version-alignment.sh --fix` calls `sync-workspace-venv.sh` at the end. For manual refresh:

```bash
bash unified-trading-pm/scripts/workspace/sync-workspace-venv.sh          # refresh (idempotent)
bash unified-trading-pm/scripts/workspace/sync-workspace-venv.sh --check  # verify only
bash unified-trading-pm/scripts/workspace/sync-workspace-venv.sh --force  # full recreate
```

**What it does:** Creates `.venv-workspace` if missing, installs pinned tools (`ruff==0.15.0`, `basedpyright==1.38.2`),
then reinstalls all repos from `workspace-manifest.json` as editable in topological order.

**What it does NOT do:** It does not rebuild per-repo `.venv`. That is Phase 2 (`run-all-setup.sh`).

**Ref:** `scripts/workspace/setup-workspace-venv.sh` (underlying implementation, also called by
`workspace-bootstrap.sh`)

---

## Phase 3: Sync to Main (quickmerge)

Push local changes to main via quickmerge (PR + auto-merge). Only run if there are changes to push.

```bash
# Standard sync
bash unified-trading-pm/scripts/repo-management/sync-all-to-main.sh

# When path deps (unified-*-interface, etc.) have local changes — avoids DEPENDENCY CONFLICT
bash unified-trading-pm/scripts/repo-management/sync-all-to-main.sh --dep-branch "chore/sync-all"

# Sync only repos matching a glob
bash unified-trading-pm/scripts/repo-management/sync-all-to-main.sh --filter "unified-*" --dep-branch "chore/sync-all"
```

**`--filter PATTERN`** — Sync only repos matching glob (e.g. `unified-*`, `*-service`). Use with `--dep-branch` when
path deps have local changes.

**When to use `--dep-branch`:** If quickmerge fails with `DEPENDENCY CONFLICT DETECTED` (path deps differ from
origin/main), re-run with `--dep-branch NAME`. Quickmerge will cascade changes to that branch in dependency order.

**Per-repo flow:**

1. Fetch origin/main
2. Merge origin/main into local
3. **If merge conflict** → abort, FAIL, exit. Do **not** continue.
4. If no conflict and local has changes → run quickmerge (quality gates + PR + auto-merge)

**Unresolvable conflict:** When sync reports `merge conflict with origin/main` for a repo:

- Sync **exits** (does not continue to other repos)
- You must resolve manually before re-running

**Ref:** `docs/repo-management/sync-to-main-flow.md`

---

## Phase 4: After Merge Conflicts — Verify Our Version, Then Fix

When sync fails with merge conflicts:

1. **Run quality gates on the conflicted repo(s)** — verify our local version passes before merging:

   ```bash
   bash unified-trading-pm/scripts/repo-management/run-all-quality-gates.sh --repo <repo-name>
   ```

   Or run quality gates only on failed repos from the sync output.

2. **If our version passes** — manually resolve merge conflicts in Cursor:
   - `cd <repo>`
   - Fix conflicts (preserve good work from main where appropriate)
   - Commit, then re-run sync for that repo:
     ```bash
     bash unified-trading-pm/scripts/repo-management/sync-all-to-main.sh --repo <repo-name>
     ```

3. **If our version fails quality gates** — fix quality gate issues first, then resolve conflicts.

**Why:** Running quality gates on conflicted repos confirms our branch is valid before we merge. Avoids losing good work
from main by resolving conflicts with a broken local state.

---

## Build Order Assumptions

Cloud Build and the deployment pipeline assume the following:

- **Dependencies built first:** Library and interface dependencies must be built and pushed to Artifact Registry before
  any service that depends on them. The manifest defines the build order.
- **Manifest up to date:** `workspace-manifest.json` must reflect the current versions of all internal dependencies. Run
  `run-version-alignment.sh --fix` before building.
- **Validation before build:** Quality gates and validation run before the build step. A failed validation blocks the
  build.

## Mock Infrastructure & Emulator Setup

All CI tests run credential-free with `CLOUD_PROVIDER=local CLOUD_MOCK_MODE=true`. Protocol-faithful emulators replace
live GCP/AWS services. This section documents how to activate each layer.

### Environment Variables

| Variable                 | Default | Purpose                                                  |
| ------------------------ | ------- | -------------------------------------------------------- |
| `CLOUD_PROVIDER`         | `gcp`   | Set to `local` for credential-free CI                    |
| `CLOUD_MOCK_MODE`        | `false` | Set to `true` for in-memory mock providers               |
| `PUBSUB_EMULATOR_HOST`   | —       | `localhost:8085` — GCP Pub/Sub emulator                  |
| `STORAGE_EMULATOR_HOST`  | —       | `http://localhost:4443` — GCS emulator (fake-gcs-server) |
| `BIGQUERY_EMULATOR_HOST` | —       | `localhost:9050` — BigQuery emulator                     |

### GCP Emulators (Docker)

```bash
# Pub/Sub (google-cloud-pubsub SDK auto-detects PUBSUB_EMULATOR_HOST)
docker run -d -p 8085:8085 gcr.io/google.com/cloudsdktool/google-cloud-cli \
  gcloud beta emulators pubsub start --host-port=0.0.0.0:8085 --project=mock-project

# GCS — fake-gcs-server (supports bucket lifecycle, ACLs, signed URLs)
docker run -d -p 4443:4443 fsouza/fake-gcs-server:latest -scheme http -port 4443

# BigQuery emulator (known gap: window functions not fully supported)
docker run -d -p 9050:9050 ghcr.io/goccy/bigquery-emulator:latest \
  --project=mock-project --dataset=trading_analytics
```

Or start all at once via:

```bash
docker compose -f unified-trading-pm/docker/docker-compose.mock.yml --profile gcp-emulators up
```

### AWS Moto (No Docker Required)

AWS services are mocked at the SDK level using `moto`. No emulator process or credentials needed:

- Tests in `unified-cloud-interface/tests/integration/test_aws_mode.py` use `@mock_aws` decorator
- S3, Secrets Manager, SQS all covered (26 tests)

### Credential-Free CI Gate

The `network_block_plugin.py` pytest plugin blocks all socket connections at the OS level:

```bash
# Activate in CI to prove zero live network calls
CLOUD_PROVIDER=local CLOUD_MOCK_MODE=true pytest --block-network -m "not sandbox"
```

Tests that legitimately connect to local emulators use `@pytest.mark.allow_network`. Each opt-out emits a WARNING in CI
logs — the count should stay minimal and stable.

Plugin location: `unified-trading-pm/scripts/dev/network_block_plugin.py`

### Cassette Parity & Drift Detection

- **Parity test** (every commit): `cd unified-api-contracts && pytest tests/test_cassette_schema_parity.py` — validates
  all 74+ cassette YAMLs against UAC Pydantic models. 256 tests, zero network calls.
- **Drift detection** (nightly 02:00 UTC): `.github/workflows/cassette-drift-check.yml` re-records cassettes against
  real APIs and diffs against committed YAMLs. Schema-level diff only — creates GitHub issue + Telegram alert on drift.
  Alerting-only, not CI-blocking.

### Local Demo Mode

Start the full system locally (no credentials required):

```bash
bash unified-trading-pm/scripts/demo-mode.sh --seed --open-browser
# With GCP emulators:
bash unified-trading-pm/scripts/demo-mode.sh --seed --gcp-emulators --open-browser
```

This starts all T2/T3 services with `CLOUD_MOCK_MODE=true`, seeds fixture data, and opens the UI.

See `unified-trading-pm/docker/docker-compose.mock.yml` for the full service definition.

### Implementation Reference

Full hardening details: `unified-trading-pm/plans/archive/cicd_mock_hardening_2026_03_11.plan.md` (Plan #60)

## Quick Reference: Full Flow

### New machine (once)

| Step | Command                                                            | When                                                  |
| ---- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| 0    | `git clone git@github.com:IggyIkenna/unified-trading-pm.git`       | Manual — PM is the seed; bootstrap reads its manifest |
| 1    | `bash unified-trading-pm/scripts/workspace/workspace-bootstrap.sh` | Fresh machine only                                    |

### Day-to-day (after any dep or code change)

| Step | Command                                                                      | When                                                                                                 |
| ---- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1    | `run-version-alignment.sh`                                                   | Always first when deps may have changed                                                              |
| 2    | `run-version-alignment.sh --fix`                                             | If step 1 reports misalignment (auto-calls `sync-workspace-venv.sh`)                                 |
| 3    | `run-all-setup.sh` (`--rollout-first` if setup.sh or stub interface changed) | After alignment OK — rebuilds per-repo `.venv`                                                       |
| 4    | Commit + push pyproject.toml, uv.lock, manifest                              | After run-all-setup                                                                                  |
| 5    | `run-all-quality-gates.sh`                                                   | Local e2e smoke test; use `--repo X` for subset; `--lint` / `--skip-typecheck` to speed up iteration |
| 6    | `sync-all-to-main.sh` (`--dep-branch NAME` if DEPENDENCY CONFLICT)           | When pushing to main                                                                                 |
| 7a   | If sync fails: merge conflict → resolve manually, re-run sync                | Per conflicted repo                                                                                  |
| 7b   | If sync fails: `run-all-quality-gates.sh --repo X` on conflicted repos       | Verify our version passes before fixing                                                              |

**If all pass → system-integration-tests → deployment**

---

## Deviation from Main

- **No deviation:** Repo is clean or matches origin/main → sync skips (OK, no changes).
- **Deviation:** Local has uncommitted or unpushed changes → sync runs quickmerge.
- **Unresolvable:** Merge conflict → sync FAILs, exits. Resolve manually, then re-run.

---

## Workspace Scripts (scripts/workspace/)

| Script                                | Purpose                                                                                                                                                                                                                                                                                                                                               | When it runs                                                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **workspace-bootstrap.sh**            | New machine setup: system deps, clone all repos from manifest, workspace venv (via setup-workspace-venv.sh), per-repo setup, smoke test.                                                                                                                                                                                                              | Once, on fresh machine.                                                                                               |
| **sync-workspace-venv.sh**            | Day-to-day `.venv-workspace` refresh: pinned tools + editable installs from manifest. Thin wrapper over `setup-workspace-venv.sh`.                                                                                                                                                                                                                    | Auto-called by `run-version-alignment.sh --fix`. Run manually after `git pull` on PM.                                 |
| **setup-workspace-venv.sh**           | Underlying venv setup logic: creates venv, installs `ruff==0.15.0` + `basedpyright==1.38.2`, installs all repos as editable in topo order.                                                                                                                                                                                                            | Called by both `workspace-bootstrap.sh` (Phase 3) and `sync-workspace-venv.sh`. Single source of truth.               |
| **validate-workspace-constraints.py** | Validates `workspace-constraints.toml` resolves without dependency conflicts (runs `uv pip compile`). Caches result by file hash.                                                                                                                                                                                                                     | Called by `validate-dependency-conflicts.py` during Phase 1 (step 4 of run-version-alignment.sh).                     |
| **resolve-canonical-versions.py**     | Derives `workspace-constraints.toml` from all repo `pyproject.toml` files (topological order). Picks tightest constraint per package.                                                                                                                                                                                                                 | **Not** called by `--fix`. Called only by `validate-dependency-conflicts.py --regenerate` when constraints conflict.  |
| **aggregate-workspace-deps.py**       | Legacy: installs all repo deps into `.venv-workspace` using `workspace-constraints.toml`. Superseded by `setup-workspace-venv.sh` for standard use.                                                                                                                                                                                                   | Only if explicitly needed for constraint-based resolution outside the standard flow.                                  |
| **sync-gitignore-cursorignore.py**    | Writes `.gitignore` + `.cursorignore` to every repo from PM central templates (`scripts/templates/.gitignore.central`, `.cursorignore.central`). Preserves per-repo exception blocks (under `# --- Repo-specific exceptions ---` header). After writing, calls `untrack-ignored-files.py --untrack` to remove newly-ignored files from the git index. | Run after editing central templates in PM.                                                                            |
| **untrack-ignored-files.py**          | Finds files tracked in the git index that now match `.gitignore` rules and removes them with `git rm --cached`. `--dry-run`: report only, no removal. `--untrack`: explicit apply mode (used by `sync-gitignore-cursorignore.py`). Default (no flags): also applies.                                                                                  | Called automatically by `sync-gitignore-cursorignore.py --untrack`. Run manually to audit/clean any repo at any time. |

**Location:** `unified-trading-pm/scripts/workspace/`

---

---

## Gitignore Sync & Untrack

Central `.gitignore` and `.cursorignore` templates live in `unified-trading-pm/scripts/templates/`. A single script
syncs them to all repos **and** removes newly-ignored files from every git index in one step.

```bash
# Sync .gitignore + .cursorignore to all repos, then untrack newly-ignored files
python3 unified-trading-pm/scripts/workspace/sync-gitignore-cursorignore.py
```

**What it does:**

1. Reads `scripts/templates/.gitignore.central` and `.cursorignore.central` from PM.
2. Writes `.gitignore` and `.cursorignore` into every workspace repo. Per-repo exception blocks (lines under
   `# --- Repo-specific exceptions ---`) are preserved across re-syncs.
3. After all writes complete, calls `untrack-ignored-files.py --untrack` — runs `git ls-files -i -c --exclude-standard`
   in each repo and issues `git rm --cached` for every match.

**Why step 3 is required:** Writing `.gitignore` does not affect files already in the git index. Without the untrack
step, previously-tracked files stay tracked and continue to appear in `git status` and remotes despite being ignored.
The `--untrack` flag makes the call explicit and machine-readable; `--dry-run` still works for inspection.

**Per-repo exception block** — to add patterns that only apply to one repo, edit that repo's `.gitignore` and place
additions under the header line:

```
# --- Repo-specific exceptions (add below; sync preserves this section) ---
!tests/fixtures/*.csv
```

Re-running the sync script will preserve everything under that header.

**Hardcoded per-repo additions** (applied programmatically, not via the exception block) live in
`REPO_GITIGNORE_ADDITIONS` in `sync-gitignore-cursorignore.py`. Edit that dict to add permanent per-repo patterns that
should survive from a fresh sync without manual edits to the target repo.

**Dry-run / audit only (no writes):**

```bash
python3 unified-trading-pm/scripts/workspace/untrack-ignored-files.py --dry-run
```

**Single repo:**

```bash
python3 unified-trading-pm/scripts/workspace/untrack-ignored-files.py --repo alerting-service --dry-run
python3 unified-trading-pm/scripts/workspace/untrack-ignored-files.py --repo alerting-service --untrack
```

**After running:** Commit the changed `.gitignore` files and any `git rm --cached` removals in each affected repo, then
push via quickmerge. Old clones automatically stop seeing the files on their next `git pull` — the removal is permanent
in git history from that commit forward.

---

## Admin Operations (Special Circumstances Only)

> **WARNING:** These operations bypass normal CI/CD flow and branch protections. Use only when the standard sync-to-main
> flow cannot be used (e.g. remote main has diverged from local after a bad merge, workspace recovery after destructive
> remote changes, or emergency local-state promotion).

### Force-Push All Repos to Main (Admin Only)

**Script:** `scripts/repo-management/admin-force-sync-all-to-main.sh` **Access:** IggyIkenna only (identity gate via
`gh api user`). All other users are rejected.

Overwrites `origin/main` with the current local state for all (or selected) repos. Works from **any local branch** — no
checkout to `main` required. Auto-stages and commits all local changes (including untracked files and deletions) before
pushing, so the push reflects true local state.

**Default (preserve-local):** After push, you **stay on your current branch** — local state unchanged. Use
`--switch-to-main` for the old behavior (switch to main after push).

#### sync-main (convenience command)

Add to `~/.zshrc` for a short command:

```bash
sync-main() {
  cd "${UNIFIED_TRADING_WORKSPACE_ROOT:-$HOME/Code/unified-trading-system-repos}" && bash unified-trading-pm/scripts/sync-main.sh "$@"
}
```

Then run from anywhere:

```bash
sync-main                    # sync with default message, stay on current branch
sync-main --dry-run          # dry run
sync-main --message "custom" # custom commit message
sync-main --switch-to-main   # old behavior: switch to main after push
```

**Script:** `scripts/sync-main.sh` — wrapper that runs admin-force-sync with `--admin-confirm` and default message.

#### Full admin-force-sync usage

```bash
# All repos — dry run first to inspect what would be committed + pushed
bash unified-trading-pm/scripts/repo-management/admin-force-sync-all-to-main.sh --admin-confirm --dry-run

# All repos — force push (preserve-local default: stay on current branch)
bash unified-trading-pm/scripts/repo-management/admin-force-sync-all-to-main.sh --admin-confirm

# Single repo
bash unified-trading-pm/scripts/repo-management/admin-force-sync-all-to-main.sh --admin-confirm --repo unified-trading-pm

# Multiple specific repos (comma-separated)
bash unified-trading-pm/scripts/repo-management/admin-force-sync-all-to-main.sh --admin-confirm --repos "unified-trading-pm,unified-events-interface"

# Switch to main after push (old behavior)
bash unified-trading-pm/scripts/repo-management/admin-force-sync-all-to-main.sh --admin-confirm --switch-to-main

# Skip staging/committing (push current committed HEAD as-is)
bash unified-trading-pm/scripts/repo-management/admin-force-sync-all-to-main.sh --admin-confirm --no-commit

# Skip branch protection disable/restore (if already disabled or not configured)
bash unified-trading-pm/scripts/repo-management/admin-force-sync-all-to-main.sh --admin-confirm --skip-protection
```

**What it does per repo:**

1. `git add -A` — stages all modifications, deletions, and untracked files (from any local branch)
2. ruff + prettier format, then `git commit -m "<message>"` — commits staged changes
3. Disables branch protection + rulesets
4. `git push --force origin HEAD:main` — pushes current HEAD to remote main (works from any branch)
5. Restores branch protection immediately after push
6. **Default:** Stay on current branch (preserve-local). **With `--switch-to-main`:** `git checkout -B main` — resets
   local `main` pointer to current HEAD and switches to it

**When to use:**

| Situation                                                | Use                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| Remote main diverged (bad merge, external push)          | Default — all repos                                          |
| Working on a feature branch with committed local changes | Works automatically — push from any branch                   |
| Untracked/unstaged local files not on remote             | Runs automatically — no extra flags needed                   |
| PM plans archive/active out of sync on remote            | Delete from disk first, then run — deletions are auto-staged |
| Emergency workspace recovery                             | Default — all repos                                          |

**When NOT to use:** Do not use as a substitute for `sync-all-to-main.sh` in normal workflow. Force-push skips quality
gates, PR review, and semver-agent. Always prefer Phase 3 (quickmerge) for standard changes.

---

## Troubleshooting

| Failure                     | Fix                                                                                                                                                                                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prettier (pre-commit)**   | Quickmerge auto-runs Prettier before commit. If it still fails, run `npx prettier --write .` in the repo, then re-run quickmerge.                                                                                                                               |
| **Act simulation (GH_PAT)** | Quickmerge **fails** (does not skip) when act fails. SSOT: unified-trading-pm/docs/repo-management/act-secrets-setup.md. Run generate-act-secrets.sh, edit .act-secrets, add GH_PAT.                                                                            |
| **Type check fails**        | Each repo owns `[tool.basedpyright]` in its `pyproject.toml` — that is the CI type-check config. The workspace-root `pyrightconfig.json` is an IDE-only helper (not used by CI or QG scripts). Ensure `bash scripts/setup.sh` ran so the repo's `.venv` exists. |

## Feature Branch Flow

Use a feature branch when you have local changes in dependency repos that haven't been pushed to main yet.

```bash
# Standard: direct to main (no local dep changes)
bash unified-trading-pm/scripts/quickmerge.sh "feat: my change"

# Feature branch: local dep changes present
bash unified-trading-pm/scripts/quickmerge.sh "feat: my change" --dep-branch feat/my-feature

# Agent / Claude Code sessions — always pass --agent (skips act simulation + tests; lint+format+typecheck+codex only)
bash unified-trading-pm/scripts/quickmerge.sh "feat: my change" --agent
```

**Two-pass model (REQUIRED for all code changes):**

- **Pass 1** — `bash scripts/quality-gates.sh` — full run (lint, tests, typecheck, codex, security). Cannot be skipped.
- **Pass 2** — `bash scripts/quickmerge.sh "msg" --agent` — lightweight (lint+format+typecheck+codex, no tests, no act).
  Only run after Pass 1 is green.

`--agent` is **required** in all Claude Code / GHA agent sessions. `--quick` skips act only (tests still run) and is the
human shorthand for interactive use. Never use quickmerge as a substitute for Pass 1 — it does not run the full test
suite. SSOT: `unified-trading-codex/06-coding-standards/quality-gates.md § Two-Pass Workflow Model`.

**What `--dep-branch feat/my-feature` does (STAGE 0 — Cascade):**

1. Reads `workspace-manifest.json` to find all transitive ancestors of the current repo (full DAG walk upward)
2. For each ancestor that exists locally: stashes local changes, creates/switches to `feat/my-feature` branch, pops
   stash
3. Only ancestors are touched — siblings and unrelated repos are left alone
4. Then proceeds with normal quickmerge stages (Stage 1: dependency validation now passes because deps are on the same
   branch)

**Version bump rules on feature branches:**

- `semver-agent.yml` and the disabled `version-bump.yml` only fire on `staging` — never on `feat/*` or `main`
- `pyproject.toml` versions are **never** bumped on feature branches or at main merge
- Version bumping happens exactly once: when the PR from `feat/*` merges to `staging`

**Flow:**

```
feat/my-feature branch
  → quickmerge --to-staging (--dep-branch feat/my-feature)
    → STAGE 0: dep alignment check (check-dep-alignment.py — staging or main reference)
    → STAGE 1-5: QG + PR to staging (GitHub auto-merge queue holds if staging locked)
  → PR auto-merges to staging
  → semver-agent.yml fires on staging push
    → Claude-Haiku reads commit + API diff → decides patch/minor/major
    → bumps pyproject.toml on staging
    → dispatches version-bump to PM → PM updates staging_versions + staging_commits
    → cascade dispatches to dependents
  → SIT runs (10-min quiet debounce) → staging-to-main.yml on pass
    → promotes staging_versions → versions (no re-bump on main)
    → main merge commit uses [skip ci] — semver-agent does NOT re-run
```

---

## Version Bump Rules (Semver-Agent Only)

`semver-agent.yml` is the **sole owner** of version bumping. `version-bump.yml` is disabled (`if: false`).

**When it fires:** push to `staging` only (never on `feat/*` or `main`). Version is decided once at staging merge. Main
merge uses `[skip ci]` — no re-bump.

**What it does:**

1. Reads current version from `pyproject.toml`
2. Reads merge commit message + `git diff HEAD~1 -- <source_dir>/__init__.py`
3. Decides bump magnitude:
   - `feat!:` or `BREAKING CHANGE:` → minor (pre-1.0.0) or major (post-1.0.0)
   - `feat:` or new public export → minor
   - `fix:` or no API change → patch
4. Updates `pyproject.toml` + prepends to `CHANGELOG.md`
5. Commits `chore: bump version to X.Y.Z [skip ci]` → pushes to staging
6. Dispatches `version-bump` to PM with `{ repo, version, branch: "staging", commit_sha }` → PM updates
   `staging_versions[repo]` and `staging_commits[repo]`

**Pre-1.0.0 rule:** breaking changes bump MINOR (never auto-cross to 1.0.0). 1.0.0 is set manually.

**Manifest fields:**

| Field                    | When set                                        | What it means                                             |
| ------------------------ | ----------------------------------------------- | --------------------------------------------------------- |
| `staging_versions[repo]` | After semver-agent fires on staging push        | In-flight version, not yet SIT-validated                  |
| `versions[repo]`         | After SIT passes + staging-to-main.yml promotes | Stable version on main                                    |
| `staging_commits[repo]`  | Written alongside staging_versions              | Exact commit SHA under test in current SIT run            |
| `main_commits.history`   | After each SIT pass                             | Rolling last 5 promoted staging sets (rollback reference) |

---

## PM Manifest as Remote SSOT

`workspace-manifest.json` on `origin/main` is the source of truth for all service versions.

**Before quickmerging to staging or main:**

1. Pull latest PM: `cd unified-trading-pm && git pull --ff-only`
2. Run alignment: `bash unified-trading-pm/scripts/repo-management/run-version-alignment.sh --fix`
3. If constraints are unsatisfiable (e.g. `>=1.1.5,<1.0.0`): fix-internal-dependency-alignment.py now uses
   `<{next_major}.0.0` as upper bound — re-run alignment after updating PM.

**Exception:** PM repo itself — when quickmerging PM, the manifest on the current branch is the SSOT. No external
manifest check is needed.

---

## Autonomous Agent GHA Flow

After a PR merges to `staging` in any service repo:

```
push to staging
  → quality-gates.yml (required status check) → dispatches qg-passed to PM
  → plan-alignment-agent.yml (advisory PR comment — never blocks)
  → semver-agent.yml (fires on staging push only)
      claude-haiku reads commit message + API diff
      → bumps pyproject.toml + CHANGELOG on staging
      → pushes chore: bump version [skip ci] to staging
      → dispatches version-bump to PM (payload: repo, version, branch=staging, commit_sha)
  → PM: update-repo-version.yml receives dispatch
      → updates staging_versions[repo] = version
      → updates staging_commits[repo] = commit_sha
      → dispatches dependency-update to downstream repos
  → each dependent: receives dep-update, creates PR updating its own pyproject.toml constraint
  → PM: cloud-build-router.yml receives qg-passed dispatch
      → routes to uts-staging-ikenna Cloud Build
      → builds Docker image tagged {semver}-staging
      → updates deployed_versions.staging in manifest

After SIT passes → staging-to-main.yml:
  → promotes staging_versions → versions (no re-bump)
  → appends staging_commits to main_commits.history (keep last 5)
  → clears staging_commits + staging_status.locked
  → merges staging → main with [skip ci] commit message (semver-agent does NOT re-run)
```

**Overnight orchestrator** (`overnight-agent-orchestrator.yml`, cron `0 1 * * *`):

- Dispatches `agent-audit.yml` per repo in T0→T1→T2→T3 tier order
- Each tier waits for the previous tier to complete before starting
- Retries up to 3x on failure with prior failure context

---

## Circular Reference Resolution

PM plans and manifest versions are updated incrementally — not all at once at staging-to-main time.

**How it works:**

1. Service repo merges to `main` → semver-agent bumps version → dispatches to PM
2. PM receives `version-updated` dispatch → updates `workspace-manifest.json` → pushes to main
3. By the time `staging-to-main.yml` fires, PM manifest already reflects current versions from each service
4. PM does NOT need to batch-update all versions at promotion time — it's been receiving incremental updates

**Repo updates PM plans (future todo `repos-update-pm-plans-in-gha`):** Service `agent-audit.yml` will also update the
relevant PM plan todos (cloning PM sibling → updating plan status → pushing to current PM branch). This will eliminate
any remaining ordering dependency at staging time.

---

## Per-Repo Staging Version Gate

Individual repos are blocked from auto-merging to staging until their version reaches **1.0.0**. This is a per-repo gate
— a repo at 1.0.0 merges freely even if other repos are still on 0.x.x.

**Enforcement:** `staging-version-gate.yml` (required status check on staging branch protection). Triggered on every PR
to staging. Reads version from `pyproject.toml` (Python repos) or `package.json` (UI/TS repos). Fails with an actionable
message if version < 1.0.0.

**Exemptions:** `unified-trading-pm` is exempt — it manages the workspace manifest and has no semver gate.

**Version 1.0.0 decision:** Always a manual human choice, made via the production checklist plan. `semver-agent.yml`
never auto-crosses to 1.0.0 (pre-1.0.0 breaking changes downgrade to MINOR).

**SIT version scope:** `smoke-test-gate.yml` only tests repos with `staging_versions[repo] >= 1.0.0`. If no such repos
exist on staging, SIT exits immediately (no lock dispatched).

```
Repo at 0.x.x → PR to staging → staging-version-gate FAILS → PR cannot merge
Repo bumped to 1.0.0 → PR to staging → staging-version-gate PASSES → enters auto-merge queue
```

---

## Staging Lock Lifecycle

SIT owns the staging lock. The lock is set when SIT **starts** (not when a major bump happens). Unlock on either pass or
fail so engineers can push fixes without waiting.

```
feat/* passes QG → quickmerge --to-staging → PR to staging (GitHub auto-merge queue)

GitHub auto-merge queue: two required checks
  staging-version-gate: PASS if repo version >= 1.0.0 (else FAIL — PR cannot merge)
  staging-lock-gate:    PASS if staging_status.locked == false (else PENDING — PR queues during SIT)

SIT debounce (GHA concurrency group, 10-min quiet):
  staging push → triggers smoke-test-gate.yml
  concurrency group (cancel-in-progress: true) cancels prior run if new push arrives within 10 min
  after 10-min quiet → job proceeds (batch covers all repos pushed in that window)

SIT START:
  → reads staging_commits from PM manifest (exact SHA set)
  → dispatches sit-lock to PM (payload: { commit_shas: {...} })
  → PM's sit-gate.yml: sets locked=true, locked_since=utcnow(), locked_reason="SIT running"
  → deployment-tests: clones v1 service repos (market-data-service, execution-service, trading-analytics-api)
    from **staging** branch before docker compose up — build-from-source (Option A). See § SIT Deployment-Tests Build Source.

SIT PASS:
  → dispatches staging-validated to PM
  → staging-to-main.yml:
      appends staging_commits to main_commits.history (keep last 5)
      promotes staging_versions → versions
      clears staging_commits, staging_status.locked=false

SIT FAIL:
  → dispatches sit-failed to PM
  → sit-unlock.yml: sets locked=false, reason="SIT failed — open for fixes"
  → Queued PRs to staging can now merge (gate passes again)
  → Engineers push fix to feat/* → quickmerge --to-staging → new SIT run
```

**Workflows involved:**

| Workflow                              | Trigger                      | Action                                                                        |
| ------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| `sit-gate.yml` (PM)                   | `sit-lock` dispatch          | Sets lock + records staging_commits SHAs                                      |
| `sit-unlock.yml` (PM)                 | `sit-failed` dispatch        | Clears lock, reason = "SIT failed"                                            |
| `staging-to-main.yml` (PM)            | `staging-validated` dispatch | Promotes versions + clears lock on pass                                       |
| `smoke-test-gate.yml` (SIT)           | push to staging              | Debounce → skip guard → lock → code-tests → deployment-tests → unlock/promote |
| `staging-version-gate.yml` (per-repo) | PR to staging                | Fails if repo version < 1.0.0                                                 |

**quickmerge --to-staging behavior when locked:** Informs the user that staging is locked and PR creation will proceed.
GitHub's auto-merge queue holds the PR until the lock clears. Does not abort.

---

## SIT Batching

Multiple `feat/*` PRs merging to staging within 10 minutes form a **batch** — a single SIT run covers the full batch.

**How it works:**

- `smoke-test-gate.yml` has a GHA concurrency group:
  ```yaml
  concurrency:
    group: sit-staging
    cancel-in-progress: true
  ```
- The job sleeps 600s at start. If a new staging push arrives within 10 min, the prior run is cancelled and a new run
  starts (resetting the clock).
- After 10-min quiet, the job proceeds and tests ALL repos currently on staging — not just the last-pushed one.
- SIT reads `staging_commits` from the PM manifest to get the exact SHA set to test.

**Result:** Two repos pushed to staging 3 min apart → one SIT run covering both. No partial-set testing.

---

## SIT Deployment-Tests Build Source

**SSOT:** `docs/ci-cd-ssot.md` §7. This section summarizes the design.

**Option A (current):** Build-from-source in GHA. Before `docker compose up`, `smoke-test-gate.yml` clones the v1
service repos (market-data-service, execution-service, trading-analytics-api) from the **staging** branch as siblings of
PM. Compose uses `build.context: ../../<repo>`. We validate the staged stack — cloning staging ensures we test exactly
what will be promoted.

**Race-condition protection:** Debounce (5–10 min quiet) + `concurrency: sit-staging` with `cancel-in-progress: true`
prevents testing a mixed state. A new push cancels the current run; only one run proceeds. Cloning after debounce yields
a stable snapshot of staging.

**build-smoke vs SIT deployment-tests:**

| Workflow                         | Purpose                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `build-smoke-all-repos.yml` (PM) | Per-repo build verification — each repo builds (Docker or wheel) in isolation. No integration.        |
| SIT deployment-tests             | Integration tests against the **staged stack** — services talk to each other via docker-compose mock. |

---

## Dependency Reference Rules

When checking if a repo's direct deps are aligned before a push or quickmerge, the reference branch depends on context:

```
for each direct dep:
    if dep is in manifest.staging_versions AND (push target is staging OR --to-staging flag):
        compare to origin/staging
    else:
        compare to origin/main
```

**Why:** When a library is promoted to staging but not yet merged to main, its `pyproject.toml` on `origin/main` still
shows the old version. Checking against `origin/staging` avoids a chicken-and-egg block where valid staging work is
refused because its dep hasn't been promoted to main yet.

**Enforcement points:**

1. **quickmerge Stage 0** — `check-dep-alignment.py` runs before cascade; exits 1 if misaligned
2. **git pre-push hook** — same check, fires on `git push origin staging` only; no-op for `feat/*`
3. **Script:**
   `scripts/repo-management/check-dep-alignment.py --repo <name> --to-staging <true|false> --manifest <path>`
4. **Hook source:** `scripts/hooks/pre-push` (installed to all repos by `scripts/workspace/install-hooks.sh`)

---

## Multi-Project Cloud Build

Three isolated GCP projects — one per environment. Build triggered by QG pass (not raw push).

### Routing Table

| Branch    | GCP Project          | Image Tag Format         |
| --------- | -------------------- | ------------------------ |
| `feat/*`  | `uts-dev-ikenna`     | `{semver}-{branch-slug}` |
| `staging` | `uts-staging-ikenna` | `{semver}-staging`       |
| `main`    | `uts-prod-ikenna`    | `{semver}`               |

### Trigger Flow

```
QG passes in any repo
  → quality-gates.yml dispatches qg-passed to PM
      payload: { repo, branch, commit_sha, version, repo_type }
  → PM: cloud-build-router.yml receives dispatch
      → determines GCP project + image tag from branch
      → authenticates with env-specific SA key (GCP_SA_KEY_DEV / _STAGING / _PROD)
      → triggers Cloud Build in the correct project
```

### Artifact Types

- **Library repos** (`repo_type == "library"`) → Python wheel build (not Docker). Wheel pushed to Artifact Registry.
- **Service/API/UI repos** → Docker image build. Image pushed to AR with immutable tag.

### Image Tag Immutability

**Tags are never overwritten.** To fix a bad image at the same semver, bump the version first (creates a new tag).

### uv.lock Frozen

All service Dockerfiles use `uv sync --frozen --no-dev`. `uv.lock` is the reproducibility SSOT. `pyproject.toml`
`>=X.Y.Z` ranges are API compatibility contracts — never pinned in pyproject.toml (let uv.lock handle it).

```dockerfile
RUN uv sync --frozen --no-dev
```

### Terraform

GCP project provisioning: `unified-trading-pm/terraform/environments/{dev,staging,prod}/main.tf`

Each environment creates: `google_project_service` (cloudbuild, artifactregistry, run, secretmanager), AR repository
`unified-trading`, Cloud Build SA with AR Writer + Cloud Run Developer + Secret Manager Accessor IAM roles.

GitHub secrets required: `GCP_SA_KEY_DEV`, `GCP_SA_KEY_STAGING`, `GCP_SA_KEY_PROD`.

---

## Rollback

Images are kept indefinitely in staging and prod Artifact Registry. Dev AR has a 90-day lifecycle cleanup policy.

**Rollback procedure:**

```bash
# Via deployment-api
POST /deployments/{service}/rollback
Body: { "image_tag": "0.3.165", "environment": "prod" }
```

This triggers `gcloud run deploy --image {ar_host}/{project}/{repo}/{service}:{tag}` and updates
`deployed_versions.prod.{repo}` in the PM manifest.

**Finding known-good tags:** `main_commits.history` in `workspace-manifest.json` contains the last 5 staging sets
promoted to main — each entry has the exact `commit_shas` and the tag formula produces the known-good image tag.

**Deployment UI (Phase 7 — future):** Will expose a version dropdown per service per environment, reading
`deployed_versions` + AR tag list, with a "Last known good" shortcut from `main_commits.history[0]`.

---

---

## Pipeline Diagram

The canonical visual diagram (YAML-driven, regeneratable) lives alongside this doc:

- **SVG** (embed in docs/GitHub): `docs/repo-management/CI-CD-PIPELINE.svg`
- **HTML** (standalone interactive, hover for tooltips): `docs/repo-management/CI-CD-PIPELINE.html`
- **Data source** (edit this to change the diagram): `docs/repo-management/cicd-pipeline-definition.yaml`
- **Regenerate**: `python3 scripts/generate-cicd-diagram.py`

The diagram shows all 6 swimlanes, 45 nodes, 44 connections, decision diamonds, branch color coding, version tag
annotations, and Telegram alert nodes.

---

## Conflict Resolution Agent

When a merge conflict is detected during `staging-to-main.yml` (or during a feature-branch-to-staging PR), an autonomous
agent is dispatched to propose a resolution.

**Status:** Implementation pending — `conflict-resolution-agent.yml` is designed but not yet created. **Plan:**
`plans/active/conflict_resolution_agent_2026_03_13.plan.md`

### Detection Points

1. **staging → main**: `staging-to-main.yml` polls `gh api repos/{repo}/pulls/{pr}/mergeable_state`. If `dirty` →
   dispatch.
2. **feat/\* → staging**: `feature-branch-to-staging.yml` template polls `gh pr view --json mergeable` (3× with 5s
   sleep). If `CONFLICTING` → dispatch.

### Agent Flow

```
merge-conflict-detected dispatch received by conflict-resolution-agent.yml
  → Step 1: Telegram "🔧 Working on conflict in $REPO $SOURCE_BRANCH→$TARGET_BRANCH..."
  → Step 2: clone repo (depth=50) + PM sibling + codex sibling
             run scripts/setup-workspace-from-manifest.sh <repo_name>
  → Step 3: read AGENTS.md + SUB_AGENT_MANDATORY_RULES.md + all active PM plans
  → Step 4: surface conflicts:
             git checkout target_branch
             git merge --no-commit --no-ff origin/source_branch || true
             git diff --name-only --diff-filter=U  (list conflicted files)
             capture full conflict markers per file
             git merge --abort
  → Step 5: claude --print --dangerously-skip-permissions
             prompt preamble: AGENTS.md + rules + plans + conflict dump
             output: === filename === blocks with resolved content
  → Step 6: parse output (awk split on === markers)
             write resolved files to branch auto-resolve/<source>-to-<target>-<sha>
             git push
  → Step 7: bash scripts/quality-gates.sh (advisory — non-zero = warn, PR still created)
  → Step 8: gh pr create resolution-branch → target-branch
             body: QG result + original PR URL + files resolved count
  → Step 9: Telegram "✅ Resolution PR ready: <url>
             Files resolved: N | QG: pass/warn | Original PR: <url>"
```

**Key constraint:** The agent **never self-merges**. Human review and approval required before merge.

### Wiring Required (Pending)

- `staging-to-main.yml`: add conflict check + dispatch in per-repo loop after PR creation fails
- `feature-branch-to-staging.yml` template: add conflict detection step after auto-merge attempt

---

## YAML Syntax Validation & GHA Workflow Version Control

### Pre-Push Validation (runs in quality-gates.sh)

All YAML files are validated before any commit reaches remote. This catches build/workflow errors before they hit CI.

| Tool                     | What it checks                                                  | Location                                    |
| ------------------------ | --------------------------------------------------------------- | ------------------------------------------- |
| `actionlint`             | `.github/workflows/*.yml` syntax, action refs, expression types | Cached binary in quality-gates.yml          |
| `yamllint`               | Generic YAML structure in all `.yml` files                      | `base-service.sh`                           |
| `validate-cloudbuild.py` | `cloudbuild.yaml` Cloud Build syntax + substitution vars        | `scripts/validation/validate-cloudbuild.py` |
| `validate-buildspec.py`  | `buildspec.aws.yaml` CodeBuild syntax + phases/artifacts        | `scripts/validation/validate-buildspec.py`  |

The validation scripts run before `git push` (via pre-push hook) **and** inside `quality-gates.sh --no-fix` in CI. Any
YAML syntax error blocks the PR from passing the required `quality-gates` status check.

### GHA Workflow Version Control

GHA workflow templates live in PM and are propagated to all service repos — workflow changes follow the same three-tier
model as code changes.

**Template location:** `scripts/propagation/templates/`

Key templates:

- `semver-agent.yml` — per-repo version bumper (staging-trigger fix pending)
- `staging-version-gate.yml` — blocks PRs to staging if version < 1.0.0
- `feature-branch-to-staging.yml` — feat/\* → staging PR creation + conflict dispatch
- `agent-audit.yml` — nightly audit with retry dispatch
- `plan-alignment-agent.yml` — advisory PR comment on out-of-scope diffs

**Propagation flow:**

```
Edit template in PM (feat/* branch)
  → quickmerge → PR to staging (PM's own 3-tier flow)
  → PM staging → PM main
  → run rollout script: python3 scripts/propagation/rollout-<name>.py
      reads workspace-manifest.json, generates per-repo workflow from template
      commits + quickmerges each repo (idempotent — skip if already up-to-date)
```

**Composite Action Inheritance (WIP — `composite_action_qg_inheritance_2026_03_12.plan.md`):** Service repos reference
PM composite actions — changes in PM actions take effect for all repos on next CI run without re-rollout:

```yaml
# Target shape for per-repo quality-gates.yml (~20 lines):
- name: Setup Python CI tools
  uses: IggyIkenna/unified-trading-pm/.github/actions/setup-python-tools@main
  with:
    python-version: "3.13.9"
- name: Run quality gates
  uses: IggyIkenna/unified-trading-pm/.github/actions/run-quality-gates@main
```

**P0 blocker:** `setup-python-tools/action.yml` is referenced by service repos but the action file doesn't exist yet.
Fix tracked in `composite_action_qg_inheritance_2026_03_12.plan.md`.

**Risk:** Composite actions load from `@main` of PM. A broken PM push breaks all repo CI simultaneously. Mitigation: use
`@v1` SHA-pinned tag on PM for stability once the action is created.

---

## Telegram Notification Inventory

All alerts use `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` secrets. **Critical:** these must be in the step `env:` block —
NOT in `if:` expressions (secrets are unavailable in `if:` context, always evaluate to empty string).

```yaml
# Correct pattern:
- name: Notify Telegram
  if: always()
  env:
    TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
  run: |
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="${TELEGRAM_CHAT_ID}" \
      -d text="..."
```

### Complete Alert Inventory

| Event                    | Workflow                            | Message                                                                   |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------------- | -------------------------------- |
| Overnight agent complete | `overnight-agent-orchestrator.yml`  | `🌙 Overnight CI complete: T0-T3 ✅/❌\nPassed: N                         | Failed: N\nBlocked: [repo list]` |
| Conflict detected        | `staging-to-main.yml`               | `⚠️ Merge Conflict: $REPO staging→main\nAgent dispatched`                 |
| Conflict agent started   | `conflict-resolution-agent.yml`     | `🔧 Working on conflict in $REPO $SRC→$TGT...`                            |
| Conflict PR ready        | `conflict-resolution-agent.yml`     | `✅ Resolution PR ready: <url>\nFiles: N resolved\nQG: pass/warn`         |
| Codex sync complete      | `codex-sync-agent.yml` (codex repo) | `📚 Codex synced: manifest update reflected in docs`                      |
| Rules alignment          | `rules-alignment-agent.yml`         | `📐 Rules updated: N new cursor rules created`                            |
| MAJOR bump pending       | `request-major-bump.yml`            | `🚨 MAJOR bump request: $REPO\nIssue: <url>\nComment /approve or /reject` |
| SIT locked               | `sit-gate.yml`                      | `⏳ SIT started — staging locked\nRepos under test: [list]`               |
| SIT passed → promoting   | `staging-to-main.yml`               | `✅ SIT passed — promoting staging→main\nRepos: [list]`                   |
| SIT failed → unlocked    | `sit-unlock.yml`                    | `❌ SIT failed — staging unlocked for fixes\nFailed: [test names]`        |
| Cassette drift           | `cassette-drift-check.yml`          | `⚠️ Cassette drift: $REPO\nChanged schemas: [list]\nIssue: <url>`         |
| Plan health issue        | `plan-health-agent.yml`             | `📋 Plan health: N todos blocked\nPlans: [list]`                          |
| Repo readiness change    | `readiness-verifier.yml`            | `📊 Readiness update: $REPO now at CR$N/DR$N/BR$N`                        |

### Adding a New Alert

1. Add Telegram notify step to the workflow (copy pattern above).
2. Register in this table.
3. Test: set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` in repo secrets (`gh secret set`). Use
   `propagate-github-secrets.sh` for bulk rollout across all repos.

---

## Background Agent Cursor Rules Inheritance

Every autonomous agent (GHA, Claude Code, Cursor) that runs in any repo needs access to workspace standards. This is
solved through a layered persistence model.

### Persistent (committed to all 62 repos)

These files are committed as relative symlinks and always available without setup:

| File                | Symlink target                                      | Purpose                                                                                                                             |
| ------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/CLAUDE.md` | `../../unified-trading-pm/cursor-configs/CLAUDE.md` | Claude Code workspace instructions                                                                                                  |
| `AGENTS.md`         | `../unified-trading-pm/AGENTS.md`                   | Workspace-generic agent instructions (token optimization, multi-repo structure, QG two-pass model, coding rules, Telegram template) |

**Rollout:** `scripts/rollout-agent-symlinks.sh` — commits symlinks to all 62 repos, removes any previously committed
`.cursor/rules` symlinks.

### Ephemeral (setup at GHA runtime, never committed)

Cursor rules are **not** committed to repos (they clutter Cursor IDE which reads all repos simultaneously). Instead:

```bash
# setup-workspace-from-manifest.sh copies rules at GHA runtime:
cp unified-trading-pm/cursor-rules/*.mdc $WORKSPACE_ROOT/.cursor/rules/
# Generates cleanup script:
cat > .cleanup-cursor-rules.sh << 'EOF'
rm -rf $WORKSPACE_ROOT/.cursor/rules/*.mdc
EOF
```

**MANDATORY:** `.cleanup-cursor-rules.sh` must run **before quickmerge** to prevent cursor rules from being committed.

### Sub-Agent Rule Inheritance

Sub-agents start with **fresh context** and cannot inherit rules from the parent session.

**Every sub-agent invocation must include one of:**

1. Full paste of `unified-trading-pm/cursor-configs/SUB_AGENT_MANDATORY_RULES.md` at the top of the prompt
2. Or:
   `"Before any action, read unified-trading-pm/cursor-configs/SUB_AGENT_MANDATORY_RULES.md and follow ALL rules strictly."`

**Always pass:**

- `WORKSPACE_ROOT` path explicitly
- For tests: `cd <repo> && bash scripts/quality-gates.sh` (per-repo `.venv`, not `.venv-workspace`)

### Why Cursor Rules Are Ephemeral (Not Committed)

Cursor IDE reads all repos in the workspace simultaneously via `.cursor/rules/` directories. If rules were committed to
each repo, Cursor would aggregate ~62 × N rule files, causing severe context bloat and rule conflicts. The workspace
root `.cursor/rules/` symlink (→ `unified-trading-pm/cursor-rules/`) covers all rules in one place for IDE use;
ephemeral copies in GHA cover the runtime agent use case.

---

## Version Alignment Gate (3 Layers of Drift Protection)

Version alignment prevents force-pushing or quickmerging with stale versions that could revert remote bumps or create
integration conflicts. Three layers catch drift at different pipeline stages:

**Layer 1 — Pre-commit (`check-branch-drift.sh`):** Blocks commit if local branch is behind origin. Instant, no network
call for version check. Override: `SKIP_BRANCH_DRIFT=1` (human-only, agents banned).

**Layer 2 — Quality gates (`version-alignment-gate.sh`):** Checks self version + dependency versions vs remote PM
manifest on staging/main. One `git fetch` call, ~3s overhead. Blocks QG if drift detected. Override:
`--skip-version-alignment` (human-only, agents banned).

**Layer 3 — Admin force-sync (safety gate 3 in `admin-force-sync-all-to-main.sh`):** Reads all repos' versions from
remote PM manifest. Blocks if remote has bumps your local manifest doesn't have (would revert them). Override:
`--force-version-override` (human-only, agents banned).

**Quickmerge stage 1.6 — Dependency version canary:** Warning only (does not block). Reads manifest, checks if any of
your dependencies have been bumped on staging/main since your last pull. Alerts before PR creation so you can pull
first.

---

## Workflow Template System

Per-repo GHA workflows are managed as canonical templates in PM. Never edit per-repo copies directly.

**Templates SSOT:** `unified-trading-pm/scripts/workflow-templates/`

**Rollout scripts:**

- Generic workflows: `bash unified-trading-pm/scripts/propagation/rollout-workflow-templates.sh`
- Semver agent (has repo-specific substitutions): `bash unified-trading-pm/scripts/propagation/rollout-semver-agent.sh`
- Pre-commit configs: `bash unified-trading-pm/scripts/propagation/rollout-pre-commit-configs.sh`

**Pattern:** Webhook-triggered workflows (`issue_comment`, `pull_request`, `repository_dispatch`) cannot use
`workflow_call` across repos in private repos. These are distributed as flat template copies. Only `workflow_dispatch`
supports reusable forwarding (used by `request-major-bump.yml`).

**Semver agent** uses `__REPO_NAME__` and `__SOURCE_DIR__` placeholders — the rollout script substitutes per-repo values
from `workspace-manifest.json`.

---

## Pre-Commit Standardization

4 canonical pre-commit templates in PM, rolled out to all 71 repos:

| Template         | Repos             | Hooks                                               |
| ---------------- | ----------------- | --------------------------------------------------- |
| `python-service` | T4+ services/APIs | branch-drift, ruff check, ruff format, basedpyright |
| `python-library` | T0-T3 libraries   | branch-drift, ruff check, ruff format, basedpyright |
| `ui`             | UI repos          | branch-drift, eslint, prettier                      |
| `docs`           | PM, codex         | branch-drift, prettier                              |

All templates include `check-branch-drift.sh` which blocks commits if local branch is behind origin.

Rollout: `bash unified-trading-pm/scripts/propagation/rollout-pre-commit-configs.sh`

---

## qg-common.sh Shared Foundation

74-line shared foundation file (`unified-trading-pm/scripts/quality-gates-base/qg-common.sh`) sourced by all 4 base QG
scripts (base-service.sh, base-library.sh, base-ui.sh, base-codex.sh). Provides:

- Color constants for terminal output
- `log_info`, `log_warn`, `log_error`, `log_pass`, `log_fail` functions
- `run_timeout` function (wraps `timeout` with logging)
- ci-status update function (writes to manifest with fcntl.flock)
- Version alignment gate sourcing

No per-repo setup needed — base scripts source it automatically.

---

## PM/Codex Doc-Only Fast-Path

PM and codex have a routing split in quickmerge:

- **Doc-only changes** (plans/, docs/, cursor-configs/, cursor-rules/, \*.md, \*.mdc) → PR targets **main** directly.
  Agent workflows (plan-health, rules-alignment, codex-sync, conflict-resolution) fire immediately.
- **Infrastructure changes** (scripts/, .github/workflows/) → PR targets **staging**. SIT validates before main
  promotion.

This means plan and rule updates are available to all agents within minutes, not hours.

---

## Force-Sync Safety Gates

`admin-force-sync-all-to-main.sh` overwrites remote main with local HEAD. Three safety gates prevent accidental reverts:

1. **Manifest-based drift check** (~3s, one PM fetch): Reads remote manifest versions. Blocks if remote has bumps your
   local doesn't have.
2. **Per-repo pyproject.toml check:** Compares local vs remote `version` field. Blocks if remote is ahead.
3. **Staging branch check:** Warns if staging has unmerged changes that would be lost.

Override: `--force-version-override` (human-only, agents banned). After any force-sync, re-run
`run-version-alignment.sh` to confirm no remote bumps were reverted.

---

## Downstream Cascade Design

When a breaking change (`is_breaking=true`) cascades via `dependency-update`:

1. **Topological QG ordering** (fail-fast): Run QG on direct dependents first (1st degree) in manifest topological
   order. If a 1st-degree dependent fails, invalidate all repos downstream of that failure without running their QG.
2. **ci_status invalidation**: When repo X fails after a breaking dependency update, set `ci_status=STAGING_PENDING` for
   all repos that transitively depend on X. Prevents stale FEATURE_GREEN on untested repos.
3. **Autonomous fix agent** (planned): `downstream-fix-agent.yml` in PM fires on QG failure after breaking update. Uses
   Claude to fix code, creates PR for human approval. Agent NEVER self-merges.
4. **Approval timeout**: 4hr Telegram escalation, 24hr CRITICAL alert for unreviewed fix PRs.

See: `plans/active/cicd_code_rollout_master_2026_03_13.plan.md` cascade todos for implementation status.

---

## Reverse Dependency Sync (Schema Changes to Docs/Rules)

When schema changes land in T0 libraries (UAC, UIC, UEI, UCI):

1. `semver-agent.yml` detects changes to `__init__.py` exports or Pydantic model fields
2. Dispatches `schema-changed` event to PM (payload: repo, changed_symbols, diff_url)
3. PM's `rules-alignment-agent` clones the changed repo (shallow), reads the diff
4. Updates cursor-rules and codex docs that reference the changed symbols
5. Forwards to codex via `manifest-sync` dispatch for codex-sync-agent processing

This ensures documentation stays in sync with code without requiring PM/codex to be listed as formal dependents of T0
libraries.

See: `plans/active/cicd_code_rollout_master_2026_03_13.plan.md` reverse-dep todos for implementation status.

---

## References

| Doc                                                                         | Purpose                                                                          |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **This doc**                                                                | Full CI/CD flow SSOT                                                             |
| `docs/repo-management/CI-CD-PIPELINE.svg`                                   | Visual pipeline diagram (regenerate: `python3 scripts/generate-cicd-diagram.py`) |
| `docs/repo-management/cicd-pipeline-definition.yaml`                        | YAML data source for diagram — edit this to change the diagram                   |
| `docs/repo-management/version-cascade-flow.md`                              | Deep-dive: selective cascade mechanics, version bump chain                       |
| `scripts/repo-management/README-ALIGNMENT-AND-SETUP.md`                     | Phase 1–2 detail                                                                 |
| `docs/repo-management/sync-to-main-flow.md`                                 | Phase 3 detail                                                                   |
| `scripts/manifest/README-DEPENDENCY-ALIGNMENT.md`                           | Internal alignment                                                               |
| `scripts/repo-management/check-dep-alignment.py`                            | Dep reconciliation gate (Phase 4)                                                |
| `scripts/hooks/pre-push`                                                    | Git pre-push hook for dep check on staging pushes                                |
| `.github/workflows/sit-gate.yml`                                            | Sets staging lock at SIT start                                                   |
| `.github/workflows/sit-unlock.yml`                                          | Clears staging lock on SIT failure                                               |
| `.github/workflows/cloud-build-router.yml`                                  | Routes qg-passed to correct GCP Cloud Build project                              |
| `.github/workflows/conflict-resolution-agent.yml`                           | Autonomous conflict resolution (implementation pending)                          |
| `.github/workflows/overnight-agent-orchestrator.yml`                        | Nightly T0→T1→T2→T3 agent audits                                                 |
| `scripts/validation/validate-cloudbuild.py`                                 | Cloud Build YAML syntax validator                                                |
| `scripts/validation/validate-buildspec.py`                                  | CodeBuild YAML syntax validator                                                  |
| `scripts/propagation/templates/`                                            | GHA workflow templates propagated to all repos                                   |
| `cursor-configs/SUB_AGENT_MANDATORY_RULES.md`                               | Sub-agent rule file — paste at top of every agent prompt                         |
| `scripts/rollout-agent-symlinks.sh`                                         | Rolls out .claude/CLAUDE.md + AGENTS.md symlinks to all 62 repos                 |
| `scripts/setup-workspace-from-manifest.sh`                                  | Manifest-driven dep checkout + ephemeral cursor rules setup                      |
| `scripts/generate-cicd-diagram.py`                                          | Diagram generator (YAML → SVG + HTML)                                            |
| `plans/active/conflict_resolution_agent_2026_03_13.plan.md`                 | Conflict resolution agent implementation plan                                    |
| `plans/active/work/cicd/composite_action_qg_inheritance_2026_03_12.plan.md` | Composite GHA action inheritance plan                                            |
| `scripts/propagation/templates/staging-version-gate.yml`                    | Per-repo staging version gate template (propagated to all repos)                 |
| `terraform/environments/`                                                   | GCP project provisioning (dev/staging/prod)                                      |
| **Codex**                                                                   | `06-coding-standards/setup-standards.md`, `dependency-management.md`             |
| **Cursor rules**                                                            | `dependency-alignment-and-setup-flow.mdc`, `always-use-quickmerge.mdc`           |
