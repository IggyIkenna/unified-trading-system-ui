# Quality Gates

## TL;DR

Every service has `scripts/quality-gates.sh` that runs the exact same checks as GitHub Actions and Cloud Build. It
operates in three phases inside quickmerge: Phase 1 (lint auto-fix only — fast), Phase 2 (lint verify — abort early if
unfixable), Phase 3 (tests + typecheck + codex — run exactly once). **For pre-push workflow always use quickmerge** (it
runs quality gates); run `quality-gates.sh` directly only for local iteration or CI. If quality gates fail, fix the root
cause — never bypass.

## Two-Pass Workflow Model

The recommended workflow separates a **full validation pass** from a **lightweight pre-PR pass**:

| Pass                    | Command                                    | What runs                                         | When                           |
| ----------------------- | ------------------------------------------ | ------------------------------------------------- | ------------------------------ |
| **Pass 1 — full**       | `bash scripts/quality-gates.sh`            | lint, format, tests, typecheck, codex, security   | Before you consider work done  |
| **Pass 2 — quickmerge** | `bash scripts/quickmerge.sh "msg" --agent` | lint, format, typecheck, codex (no tests, no act) | Immediately before PR creation |

**Why two passes?** Tests are the slowest gate (5-60s). Running them again in quickmerge when they already passed in
Pass 1 wastes time. Quickmerge's internal QG pass with `--agent` is a fast final check that nothing was broken by the
auto-format step.

**`--agent` flag** (for agents and CI): implies `--skip-tests` + skip act. Quickmerge becomes
lint/format/typecheck/codex only — the same things that could silently break during commit staging.

**`--quick` flag** (human shortcut): skip act only; tests still run. Use when you want act simulation skipped but want
test re-validation.

```bash
# Agent/CI workflow (two-pass)
bash scripts/quality-gates.sh                           # Pass 1: full validation
bash scripts/quickmerge.sh "feat: ..." --agent          # Pass 2: lint+format+typecheck+codex only, no act

# Agent/CI — also skip typecheck in quickmerge (ran in pass 1)
bash scripts/quickmerge.sh "feat: ..." --agent --skip-typecheck

# Human — skip act only (tests re-run in quickmerge)
bash scripts/quickmerge.sh "feat: ..." --quick

# Human — full quickmerge including act simulation
bash scripts/quickmerge.sh "feat: ..."
```

### Three-Phase Internal Model (inside quickmerge Stage 3)

Quickmerge's Stage 3 runs quality gates in three phases to eliminate redundant test/typecheck runs:

| Phase                   | Flags                  | What runs                                     | Purpose                               |
| ----------------------- | ---------------------- | --------------------------------------------- | ------------------------------------- |
| **1 — lint auto-fix**   | `--lint --fix`         | ruff format + ruff check --fix / eslint --fix | Auto-repair fixable issues            |
| **2 — lint verify**     | `--no-fix --lint`      | ruff check / eslint (no fix)                  | Abort early if unfixable lint remains |
| **3 — full minus lint** | `--no-fix --skip-lint` | tests + typecheck + codex / tests + build     | Run slow gates exactly once           |

**Why three phases?** Tests and typecheck are unaffected by linter auto-fixes. The old two-phase model (full+fix →
full+no-fix) ran tests twice. The three-phase model runs lint cheaply first, aborts fast on unfixable lint, then runs
tests/typecheck exactly once.

**New flags added to base scripts:**

- `--skip-lint` — skip ruff/eslint entirely (Python + UI)
- `--fix` — enable ESLint auto-fix (UI; Python already defaults to auto-fix)

**Status:** [IMPLEMENTED] in all service and library repos.

**Canonical Base Scripts:** `unified-trading-pm/scripts/quality-gates-base/` (base-service.sh, base-library.sh,
base-codex.sh, base-ui.sh). Per-repo `scripts/quality-gates.sh` files are **config stubs only** — never full
implementations. **All repo types** (Python services, libraries, codex, and TypeScript UI repos) use this stub
architecture. See
[Coding Standards README § Quality Gates Structure](./README.md#quality-gates-structure-centralized-base-scripts).

---

## Tool Version Pinning and Environment Isolation

### Three Environments, Three Purposes

| Environment            | What it owns                                                              | Used by                                                                       | Rule                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `.venv-workspace`      | Union of all ~62 repo deps; pinned `ruff==0.15.0`, `basedpyright==1.38.2` | IDE cross-repo IntelliSense; `RUFF_CMD` in QG templates                       | **Never** used as `PYTHON_CMD` or `BASEDPYRIGHT_CMD` in QG — it has extra packages that mask missing dep declarations |
| `.venv` (per-repo)     | Exact deps from `pyproject.toml` + `[dev]`                                | QG `PYTHON_CMD`, `BASEDPYRIGHT_CMD`, pytest, bandit; CI/GHA `agent-audit.yml` | **Always** the source of truth for type-checking and test execution                                                   |
| GHA runner (container) | Fresh install from `pyproject.toml` on every run                          | `overnight-agent-orchestrator` → `agent-audit.yml`; CI quality gates          | No `.venv-workspace` — QG template falls through to `.venv` (correct)                                                 |

### Tool Resolution Rules (Enforced in QG Templates)

```
RUFF_CMD:         .venv-workspace/bin/ruff  →  .venv/bin/ruff  →  ruff
                  (consistent pinned version; ruff is a pure binary, never loads packages)

BASEDPYRIGHT_CMD: .venv/bin/basedpyright  →  basedpyright
                  (NEVER workspace venv — basedpyright resolves types via site-packages;
                   workspace has extra packages that mask missing pyproject.toml declarations)

PYTHON_CMD:       .venv/bin/python  →  python3
                  (NEVER workspace venv — test isolation requires exact per-repo deps)
```

**Why this split matters:** A repo that imports `X` but doesn't declare `X` in `pyproject.toml` will typecheck clean
locally (workspace has `X`) but fail in CI (fresh install doesn't). The per-repo rule closes this "works on my machine"
hole.

### Pinned Versions (Canonical)

| Tool           | Pinned version | Enforced by                                  |
| -------------- | -------------- | -------------------------------------------- |
| `ruff`         | `0.15.0`       | QG template version check (warn if mismatch) |
| `basedpyright` | `1.38.2`       | QG template version check (warn if mismatch) |

Both checks warn (not fail) on mismatch so a stale venv doesn't block CI — but they are visible in QG output and must be
resolved before merging.

Per-repo `pyproject.toml` dev deps must declare `basedpyright==1.38.2` and `ruff==0.15.0`.

### Workspace Venv Sync (Day-to-Day)

After any version alignment run or `git pull` on `unified-trading-pm`:

```bash
bash unified-trading-pm/scripts/workspace/sync-workspace-venv.sh          # refresh (idempotent)
bash unified-trading-pm/scripts/workspace/sync-workspace-venv.sh --check  # verify only
bash unified-trading-pm/scripts/workspace/sync-workspace-venv.sh --force  # full recreate
```

This is distinct from `workspace-bootstrap.sh`, which is the **new machine** entry point (clone repos + system deps +
venv + per-repo setup). `sync-workspace-venv.sh` is for day-to-day refresh only.

### Version Alignment Pipeline — Step 5 (Workspace Venv)

The version alignment pipeline in `run-version-alignment.sh` has a Step 5 (pending implementation):

```
Step 1: bump versions
Step 2: update workspace-manifest.json
Step 3: dispatch version-cascade to downstream repos
Step 4: validate all repos aligned
Step 5: generate workspace-requirements.txt → commit to PM  ← planned
```

Step 5 generates `unified-trading-pm/configs/workspace-requirements.txt` (union of all 62 repos' deps via
`uv pip compile`). Developers then run `sync-workspace-venv.sh` to pull the refreshed union. Conflicts in
`uv pip compile` signal a version cascade violation and fail the alignment job.

---

## Canonical Code Limits (BLOCKING — all enforced in quality-gates.sh)

| Limit                           | Value                         | Variable in template                      |
| ------------------------------- | ----------------------------- | ----------------------------------------- |
| Min test coverage               | **70% service / 80% library** | `MIN_COVERAGE=max(floor, actual-1)`       |
| Max file lines                  | **900** (warn at 700)         | `MAX_FILE_LINES=900; FILE_WARN_LINES=700` |
| Max function lines              | **200**                       | `MAX_FUNCTION_LINES=200`                  |
| Max method lines (inside class) | **50**                        | `MAX_METHOD_LINES=50`                     |
| Max class lines                 | **900**                       | `MAX_CLASS_LINES=900`                     |
| McCabe complexity               | **10**                        | `max-complexity = 10` in ruff             |

### Coverage by repo type

| Repo type      | Floor (minimum) | Formula                        |
| -------------- | --------------- | ------------------------------ |
| library        | **80%**         | `max(80, actual_coverage - 1)` |
| service        | **70%**         | `max(70, actual_coverage - 1)` |
| api-service    | **70%**         | `max(70, actual_coverage - 1)` |
| infrastructure | **70%**         | `max(70, actual_coverage - 1)` |
| docs-only      | N/A             | —                              |

**Rule:** `MIN_COVERAGE = max(floor, actual_coverage - 1)`. The `-1` allows one percentage point of natural churn; the
floor is an absolute minimum that cannot be undercut.

To recalibrate all repos: `python3 scripts/propagation/rollout-quality-gates-unified.py --recalibrate`

Any repo below its floor must either raise coverage or document the exception in `QUALITY_GATE_BYPASS_AUDIT.md`.

### Coverage floor exceptions (approved repos only)

Only the following four repos are approved permanent exceptions to the standard coverage floors. All other repos **must
meet or exceed their floor** — lowering MIN_COVERAGE below the type floor is not permitted without explicit approval and
a corresponding entry in `MIN_COVERAGE_OVERRIDES` in `rollout-quality-gates-unified.py`.

| Repo                       | Approved floor           | Reason                                                                               |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| `unified-trading-pm`       | N/A — skipped by rollout | PM repo has its own quality-gates; not overwritten                                   |
| `unified-trading-codex`    | N/A — skipped by rollout | Codex repo has its own quality-gates; not overwritten                                |
| `system-integration-tests` | 0%                       | Pure test-harness repo — no production source package to measure                     |
| `ibkr-gateway-infra`       | 51%                      | Gateway client wraps proprietary IBKR API; most paths require live broker connection |

**Prohibited workarounds** (must not be used to bypass the floor):

- Lowering `MIN_COVERAGE` below the type floor in `quality-gates.sh`
- Adding entry-point or service-runner files to `MIN_COVERAGE_OVERRIDES` in the rollout script
- Adding `# pragma: no cover` to non-entry-point code to inflate coverage numbers

**Approved** (does not require exception):

- `# pragma: no cover` on CLI `if __name__ == "__main__":` guards and `__main__.py` launch blocks only

Size checks run via Python AST (function/class/method) and `wc -l` (file) in Step 5 of every quality-gates.sh. Coverage
is enforced by `--cov-fail-under=$MIN_COVERAGE` in pytest (Step 3).

**Sports vertical (Phase 3):** Per-service Step A naming checks — run before D1. Zero hits required:
`rg 'BaseSportsAdapter' .` (deleted in Phase 1); `rg 'from footballbets' .`;
`rg 'postgresql|psycopg2|sqlalchemy' . --type py` in pipeline services; `rg 'dict\[str, str\]' .` in USEI (old untyped
protocol). See `.cursor/rules/sports-migration-standards.mdc` and `04-architecture/sports-integration-plan.md` §
Phase 3.

**Alignment Validation:** Pre-commit hook in `unified-trading-codex` blocks commits that violate SSOT alignment
(non-canonical bucket names, outdated event names, non-MVP venues).

---

## Audit Alignment (Independent Audit 2026-03-01)

Quality gates and codex checks are aligned with the findings of the independent strict audit. Use this table to ensure
every audit finding has a corresponding gate or codex rule; add missing checks to the canonical template and roll out to
all 57+ repos via parallel agents if needed.

| Audit finding                              | Codex / QG check                                            | Template / location                                                                             | Notes                                                  |
| ------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Service-as-package import (violation)      | No service repo may depend on another service as path dep   | Step 5: `check-no-service-deps.py` (see below) or rg on pyproject.toml vs manifest service list | Add to template; script in unified-trading-pm/scripts/ |
| Bare except                                | `rg "except:"` in production                                | quality-gates-service-template.sh [5] CODEX COMPLIANCE                                          | ✓ In template                                          |
| except Exception with pass/return (silent) | Log or re-raise required                                    | Cursor rule + code review; optional rg `except Exception:` then next line `pass`/`return`       | Document in codex; strict repos can add rg             |
| Fallback config (os.getenv with "")        | `rg 'os\.getenv\s*\([^)]+,\s*""\s*\)'`                      | quality-gates-service-template.sh [5]                                                           | ✓ In template                                          |
| print() in production                      | `rg "print\("` excluding tests/scripts                      | quality-gates-service-template.sh [5]                                                           | ✓ In template                                          |
| Imports inside functions                   | `rg "^[[:space:]]+import \|^[[:space:]]+from"` in source    | quality-gates-service-template.sh [5]                                                           | ✓ In template; E402 in ruff                            |
| Files >900 (warn 700) / >1500 block        | MAX_FILE_LINES=900, Step 5 size check                       | quality-gates-service-template.sh [5] size step                                                 | ✓ In template; audit used 1500 for “oversized”         |
| GCP_PROJECT_ID                             | Use GCP_PROJECT_ID only                                     | quality-gates-service-template.sh [5] rg GCP_PROJECT_ID                                         | ✓ In template                                          |
| Hardcoded central-element-\*               | `rg "central-element-323112"`                               | quality-gates-service-template.sh [5]                                                           | ✓ In template                                          |
| Coverage min 40% / 70%                     | --cov-fail-under=$MIN_COVERAGE; MIN_COVERAGE=70 in template | quality-gates-service-template.sh [3]                                                           | ✓ In template; all repos must set fail_under           |
| No dict[str, Any] in public API            | rg ": Any\|-> Any\|\[Any\]"                                 | quality-gates-service-template.sh [5]                                                           | ✓ In template                                          |
| Raw response.json()                        | rg response.json() without model_validate                   | quality-gates-service-template.sh [5]                                                           | ✓ In template                                          |
| Domain clients from UDC not UTS            | rg unified_trading_services.\*DomainClient                  | quality-gates-service-template.sh [5]                                                           | ✓ In template                                          |

**Service-import check (add to template):** For repos with `type: service` in workspace-manifest.json, quality-gates.sh
MUST fail if pyproject.toml (or [tool.uv.sources]) lists any other **service** repo as a path dependency. Canonical
script: `unified-trading-pm/scripts/check-no-service-deps.py` — reads manifest, detects current repo type, and exits 1
if a service has path dep on another service. Template step: run this script when present (same pattern as
check-import-patterns.py).

**Rollout:** Align all 57+ repos with the canonical template (quality-gates-service-template.sh for services,
quality-gates-library-template.sh for libraries). Use parallel agents to: (1) copy or diff each repo’s
scripts/quality-gates.sh against template, (2) add missing CODEX COMPLIANCE steps and MIN_COVERAGE, (3) add
check-no-service-deps.py invocation for service repos, (4) document exceptions in QUALITY_GATE_BYPASS_AUDIT.md only. See
INDEPENDENT_CODE_AUDIT_2026-03-01.md § 8.5 Codex and quality gates alignment.

---

## Quality Gate Bypass Audit Methodology

### Two-Level Audit System

Quality gate bypass tracking operates at two levels:

1. **Per-repo** (`{repo}/QUALITY_GATE_BYPASS_AUDIT.md`): Documents every individual suppression (`# type: ignore`,
   `# noqa`, file size exception) with file, line, and justification. **Every repo must have this file** — it is a
   required artifact per the service and library setup checklists.

2. **Codex aggregate** (`10-audit/QUALITY_GATE_BYPASS_AUDIT.md`): Cross-repo summary with category breakdown, hotspot
   analysis, and priority actions. Updated quarterly via workspace-wide scan.

### Per-Repo Audit File (Required)

Every repo must have `QUALITY_GATE_BYPASS_AUDIT.md` at its root with at minimum:

```markdown
# Quality Gate Bypass Audit — {repo-name}

## 2.1 File Size Exceptions

None.

## 2.2 Ruff Exceptions

None.

## 2.3 Basedpyright Exceptions

None.
```

Repos with active suppressions must expand each section with a table documenting: File, Line, Suppression, Category, and
Justification. See `10-audit/QUALITY_GATE_BYPASS_AUDIT.md` for the full category taxonomy and acceptable vs must-fix
classifications.

### Suppression Categories

| Category                | Acceptable?              | Action                        |
| ----------------------- | ------------------------ | ----------------------------- |
| LIBRARY_STUB_MISSING    | Yes (with documentation) | Document library + reasoning  |
| OVERLOAD_PATTERN        | Yes (with documentation) | Document intentional overload |
| ARCHITECTURAL_VIOLATION | **No**                   | Must fix — hiding real errors |
| OPTIONAL_CHAINING       | Fix                      | Add None checks               |
| UNION_NARROWING         | Fix                      | Narrow types explicitly       |

### Enforcement

- `scripts/quality-gates.sh` Step 5 references `QUALITY_GATE_BYPASS_AUDIT.md` sections 2.1/2.2/2.3 for whitelists
- Cursor rules (`strict-quality-gates.mdc`, `quality-gates-audit-factors.mdc`) enforce documentation
- Setup checklists require creating this file as part of repo scaffolding
- Quarterly workspace-wide scans update the codex aggregate

---

## SSOT Alignment Validation (Documentation Quality Gates)

**Purpose:** Prevent documentation drift **before commit** by validating alignment across Codex docs, UTD configs, and
Epics.

### What It Catches

The `validate-alignment.py` script runs as a pre-commit hook in `unified-trading-codex` and checks:

1. **Banned Terms**
   - ❌ Non-canonical bucket patterns (e.g., `gs://market-data-raw/` instead of
     `gs://market-data-tick-{category}-{project_id}/`)
   - ❌ `os.getenv()` in service code (use `UnifiedCloudServicesConfig`)

2. **Lifecycle Event Names**
   - ❌ Non-canonical event names in observability docs (e.g., `INGESTING_DATA` instead of `DATA_INGESTION_STARTED`)
   - ✅ Only canonical events from `03-observability/lifecycle-events.md`

3. **MVP Scope**
   - ❌ Non-MVP venues referenced in active epics (e.g., DYDX, OKX)
   - ✅ Only MVP venues from `11-project-management/mvp-universe.yaml`

4. **Bucket Naming Patterns**
   - ❌ Hardcoded bucket names (e.g., `gs://features-sports/`)
   - ✅ Parameterized patterns (e.g., `gs://features-{category}-{project_id}/`)

5. **Venue Name Canonicalization**
   - ❌ Generic names (e.g., `BINANCE` instead of `BINANCE-SPOT`/`BINANCE-FUTURES`)
   - ✅ Canonical names from `configs/venues.yaml`

6. **Sharding Dimensions**
   - ❌ Drift between `configs/sharding.{service}.yaml` and service `.cursorrules`
   - ✅ Dimensions match across both sources

7. **Start Dates**
   - ❌ Mismatches between `configs/expected_start_dates.yaml` and Codex docs
   - ✅ All references align

### Pre-Commit Hook (Blocks Bad Commits)

The validation runs **automatically** via pre-commit hook in `unified-trading-codex`:

```yaml
# .pre-commit-config.yaml
- repo: local
  hooks:
    - id: alignment-validation
      name: Validate SSOT Alignment
      entry: python scripts/validate-alignment.py --check-drift
      language: python
      pass_filenames: false
      always_run: true
      additional_dependencies: [pyyaml]
```

**Behavior:**

- Exit 0 → Commit allowed
- Exit 1 → Commit **BLOCKED** with detailed drift report

**Example blocked commit:**

```bash
$ git commit -m "Update market-data epic"

Validate SSOT Alignment..........................................................Failed
- hook id: alignment-validation
- exit code: 1

================================================================================
SSOT Alignment Validation (Drift Detection)
================================================================================

⚠️  Drift detected: 2 issues found

Banned Term (example):
  - some-epic.md:42 - Non-canonical bucket pattern
```

### GitHub Actions (PR Checks)

Validation also runs in CI for every PR:

```yaml
# .github/workflows/alignment-validation.yml
name: Alignment Validation
on:
  pull_request:
    branches: [main]
```

**On failure:**

- PR check marked as failed
- Bot posts comment with instructions
- Blocks auto-merge until fixed

### Manual Validation

Run the validation script manually:

```bash
cd unified-trading-codex
python scripts/validate-alignment.py --check-drift
```

**Exit codes:**

- `0` - All sources aligned ✅
- `1` - Drift detected ⚠️

### Troubleshooting

**Problem:** Pre-commit hook blocks my commit

**Solution:**

1. Read the drift report carefully - it shows exact file:line violations
2. Fix the issues (use suggested replacements if provided)
3. Try committing again

**Problem:** I need to commit historical documentation with non-canonical patterns

**Solution:** Historical docs may be exempt. Only active epics/docs are checked. Update validation script's allowed
paths if needed.

**Problem:** False positive on a legitimate use case

**Solution:** Update the validation script's allowed paths or patterns. All checks have configurable exceptions.

**Problem:** `MM` git status on a file after `git add`, or
`[WARNING] Stashed changes conflicted with hook auto-fixes... Rolling back fixes.`

**Root cause:** `ruff` and `prettier` reformat the same file differently in sequence. The `prek` stash system stashes
other unstaged files, hooks modify the staged file, then prek tries to restore and conflicts arise.

**Solution — Formatter Conflict Resolution Protocol:**

1. **Pre-format ALL formatters before `git add`:**
   ```bash
   npx prettier --write <file>          # JSON, YAML, MD, etc.
   .venv/bin/ruff format <file>         # Python only
   .venv/bin/ruff check <file> --fix    # Python only
   ```
2. **Isolate the commit** — stage ONLY the target file; do NOT `git add -A` when other unstaged files exist.
3. **If `MM` persists after a commit attempt** — hooks modified the file; re-stage and retry:
   ```bash
   git add <file>
   git commit -m "..."
   ```
4. **For `.basedpyright-baseline.json`** — always run `npx prettier --write` AFTER `--writebaseline`, BEFORE `git add`:
   ```bash
   .venv/bin/basedpyright <src>/ --baselinefile .basedpyright-baseline.json --writebaseline
   npx prettier --write .basedpyright-baseline.json
   git add .basedpyright-baseline.json
   git commit -m "..."
   ```

**Prevention:** The QG template `quality-gates-service-template.sh` step [1] AUTO-FIX now runs prettier before ruff so
local QG runs pre-format all file types before any commit. The canonical rule is in
`unified-trading-pm/cursor-rules/documentation/prettier-docs-formatting.mdc`.

---

## Canonical Template (NEW)

All `scripts/quality-gates.sh` files MUST align to the canonical template at:

```
unified-trading-codex/06-coding-standards/quality-gates-template.sh
```

**Required Features:**

1. **Environment Validation**
   - Python 3.13 version check (fail if not `>=3.13,<3.14`)
   - `uv.lock` existence check
   - `.venv` virtual environment detection
   - `ripgrep` availability check (REQUIRED - exit 1 if missing)
   - Ruff 0.15.0 version verification

2. **Test Execution**
   - Git-aware mode (test only changed files when uncommitted changes detected)
   - `pytest-xdist` for parallel test execution (`-n auto`)
   - `pytest-cov` for coverage reporting (`--cov-fail-under=70`)
   - All 4 test tiers: unit, integration, e2e, smoke
   - Quick mode support (`--quick` skips e2e/smoke)

3. **Lifecycle Event Validation**
   - MUST verify `tests/unit/test_event_logging.py` exists
   - Test validates all 11 mandatory lifecycle events in source code:
     - STARTED, VALIDATION_STARTED, VALIDATION_COMPLETED, VALIDATION_FAILED
     - DATA_INGESTION_STARTED, DATA_INGESTION_COMPLETED
     - PROCESSING_STARTED, PROCESSING_COMPLETED
     - UPLOAD_STARTED, UPLOAD_COMPLETED
     - STOPPED, FAILED

4. **Coding Standards Enforcement (Chapter 6)**
   - No `print()` statements (use `logger.info()`)
   - No `os.getenv()` outside `config.py` (use config classes)
   - No naive `datetime.now()` (use `datetime.now(timezone.utc)`)
   - No bare `except:` (use specific exceptions or decorators)
   - No `google.cloud` imports (use `unified_trading_services` abstractions)
   - No `requests` in async code (use `aiohttp`)
   - No `asyncio.run()` in loops (use `asyncio.gather()`)
   - No `time.sleep()` in async functions (use `asyncio.sleep()`)

5. **Test Comprehensiveness Checks**
   - `test_config.py` must exist and be >50 lines (not just import checks)
   - `test_startup_validation.py` recommended
   - No placeholder tests (`assert True`, `pass`, empty functions)

**Migration Guide:**

When aligning existing `quality-gates.sh` to template:

1. Copy template structure (environment, linting, testing, codex compliance phases)
2. Update `SOURCE_DIR` and `TEST_PATHS` variables for your service
3. Add missing checks (ripgrep, Python version, test comprehensiveness)
4. Remove legacy patterns (manual `.venv` creation, old pytest flags)
5. Test locally: `bash scripts/quality-gates.sh`
6. Verify CI parity: Check GitHub Actions and Cloud Build use same checks

## Repo-Type-Specific Base Scripts

All per-repo `scripts/quality-gates.sh` are thin config stubs sourcing a shared base from PM. The base scripts are the
SSOT — never copy gate logic into a per-repo file.

| Repo type                  | Base script (in unified-trading-pm)          | Notes                                                                      |
| -------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| Service                    | `scripts/quality-gates-base/base-service.sh` | Full Python checks: ruff, pytest, basedpyright, codex compliance           |
| API service                | `scripts/quality-gates-base/base-service.sh` | Same as service — API services use the service base                        |
| Library                    | `scripts/quality-gates-base/base-library.sh` | Same checks as service; unit-only tests by default                         |
| Docs-only / infrastructure | `scripts/quality-gates-base/base-codex.sh`   | Markdown lint, prettier check, link validation; no pytest, no basedpyright |

**Stub templates** for each repo type are documented in `unified-trading-pm/scripts/quality-gates-base/README.md`. For a
new repo: copy the appropriate stub template, set the required variables, and commit. Do not copy any gate logic from
another repo.

---

## Quality Gate Performance

Quality gates must complete within 120 seconds to maintain developer productivity. Several performance optimizations are
available for environments where type checking is slow or when doing rapid iterations.

### --skip-typecheck Flag

Skip the type checking phase when you need faster iterations:

```bash
bash scripts/quality-gates.sh --skip-typecheck
```

**When to Use:**

- Rapid development iterations where type errors are not the focus
- CI environments where type checking is done separately
- Emergency hotfixes where speed is critical

**When NOT to Use:**

- Before creating PRs (type checking is required)
- In production deployments
- When making significant refactoring changes

### Three-Phase Pattern (current)

Quickmerge runs quality gates in three phases internally — no manual invocation needed:

```bash
# Phase 1: lint auto-fix (fast — ruff/eslint --fix, no tests/typecheck/build)
bash scripts/quality-gates.sh --lint --fix

# Phase 2: lint verify — abort if unfixable lint remains
bash scripts/quality-gates.sh --no-fix --lint

# Phase 3: full gates minus lint — tests + typecheck + codex run exactly once
bash scripts/quality-gates.sh --no-fix --skip-lint
```

**Benefits:**

- Lint failures caught fast in Phase 2 before slow tests start
- Tests and typecheck run exactly once (not twice as in the old two-phase model)
- ~2-3 minutes saved per quickmerge run on a typical service repo

### BASEDPYRIGHT_CACHE_DIR

All quality gate templates automatically set up caching for basedpyright to improve performance:

```bash
export BASEDPYRIGHT_CACHE_DIR="${TMPDIR:-/tmp}/basedpyright-cache/${SERVICE_NAME:-$(basename "$PWD")}"
mkdir -p "$BASEDPYRIGHT_CACHE_DIR"
```

**Cache Benefits:**

- Significantly faster subsequent runs on the same codebase
- Reduces type checking time from 60-120s to 10-30s on repeat runs
- Automatically cleans up via TMPDIR on system restart

### run_timeout Helper

`run_timeout` is available in two forms — both use identical logic:

**1. Shell function (inside quality-gates.sh):** Each repo's `quality-gates.sh` sources
`unified-trading-pm/scripts/quality-gates-base/base-service.sh`, which defines:

```bash
run_timeout() {
    local secs=$1; shift
    if command -v timeout &>/dev/null; then timeout "$secs" "$@"
    elif command -v gtimeout &>/dev/null; then gtimeout "$secs" "$@"
    elif command -v perl &>/dev/null; then perl -e 'alarm shift; exec @ARGV' -- "$secs" "$@"
    else "$@"; fi
}
```

**2. Standalone binary (`.venv-workspace/bin/run_timeout`):** Installed by `workspace-bootstrap.sh` from
`unified-trading-pm/scripts/shared/run_timeout`. Available in any shell context — background subshells, CI steps, agent
tasks — without sourcing `quality-gates.sh`. Use this when calling `basedpyright` outside of the quality-gates pipeline.

**Cross-Platform Support:**

- Linux: Uses `timeout` command
- macOS: Uses `gtimeout` (via `brew install coreutils`) or `perl` fallback
- Prevents infinite hangs in type checking
- 120-second timeout prevents zombie processes

**Usage:**

```bash
run_timeout 120 basedpyright unified_trading_services/
```

**Note:** The `perl` fallback is essential for macOS environments where GNU coreutils may not be installed. If
`run_timeout` is not found (exit 127), run `workspace-bootstrap.sh` to install the standalone binary — do not source
`quality-gates.sh` as a workaround.

---

## Python Version Consistency

**CRITICAL:** All environments (local, GitHub Actions, Cloud Build) MUST use the same Python version.

| Environment            | Configuration                                                       | Python Version       |
| ---------------------- | ------------------------------------------------------------------- | -------------------- |
| **pyproject.toml**     | `requires-python = ">=3.13,<3.14"`                                  | Source of truth      |
| **GitHub Actions**     | `python-version-file: 'pyproject.toml'`                             | Reads from pyproject |
| **Quickmerge (local)** | Activates `.venv` before quality gates; else derives from pyproject | Matches pyproject    |
| **Quality-gates.sh**   | Inherits from quickmerge (venv already activated) or user-managed   | -                    |

### Run Quality Gates = Single Command (No Setup First)

`./scripts/quality-gates.sh` is self-contained. It automatically:

- Runs `uv lock` when `pyproject.toml` changes (creates/updates `uv.lock`; cross-platform; fast when unchanged)
- Creates `.venv` if missing (uv venv, respects `pyproject.toml` requires-python)
- Activates venv
- Bootstraps uv (`pip install uv` — the only pip install)
- Installs unified-trading-services from workspace if present
- Installs project deps via `uv pip install -e ".[dev]"`
- Runs ruff + pytest

No need to run setup, `uv sync`, or `source .venv/bin/activate` beforehand. Skips venv creation in CI (GitHub Actions,
Cloud Build use their own setup).

### Quickmerge Activates Venv

Quickmerge sources `.venv/bin/activate` (macOS/Linux) or `.venv/Scripts/activate` (Windows) before running quality
gates. If no venv exists, quality-gates.sh creates it.

### CI Reads Python from pyproject.toml

All `quality-gates.yml` workflows use `python-version-file: 'pyproject.toml'` so CI stays in sync with the project.

### Local Python Detection (when running quality-gates directly)

Quality-gates.sh creates and activates venv when run locally. No manual setup needed.

**Install Python 3.13+**:

```bash
# Option 1: pyenv (recommended)
pyenv install 3.13.0
pyenv local 3.13.0

# Option 2: Homebrew
brew install python@3.13
```

**See also**: `.cursor/rules/python-version-consistency.mdc`

---

## What quality-gates.sh Does

### Step 0: Config Validation

- Checks `cloudbuild.yaml` for unescaped shell variables (`$VAR` instead of `$$VAR`)
- Verifies `pyproject.toml` Python version matches expected (`>=3.13,<3.14` for all services)

### Step 1: Auto-Fix (Phase 1)

Only runs when `--no-fix` is NOT passed (default behavior):

```bash
# Format all source files
ruff format {source_dir}/ tests/

# Fix auto-fixable lint issues
ruff check --fix {source_dir}/ tests/
```

This handles import sorting, trailing whitespace, unused imports, and formatting. Most issues are resolved here.

### Step 2: Linting (Phase 2)

Always runs. Verifies no remaining issues:

```bash
ruff check {source_dir}/ tests/
```

If this fails after auto-fix, the issue requires manual intervention (e.g., undefined variable, bare except).

### Step 3: Tests

Runs all test categories in sequence:

```bash
# Unit tests
pytest tests/unit/ -v --tb=short --timeout=60

# Integration tests (excluding performance, API, live, download tests)
pytest tests/integration/ -v --tb=short --timeout=120 \
    --ignore=tests/integration/test_performance.py \
    -k "not api and not live and not download"

# E2E tests
pytest tests/e2e/ -v --tb=short --timeout=180

# Smoke tests (shard combinatorics)
pytest tests/smoke/ -v --tb=short --timeout=180
```

Missing test directories are silently skipped.

---

## Usage

```bash
cd {service-directory}

# Full run (auto-fix + verify + tests) -- default
bash scripts/quality-gates.sh

# Verify only (no auto-fix) -- CI mode
bash scripts/quality-gates.sh --no-fix

# Linting only (no tests)
bash scripts/quality-gates.sh --lint

# Tests only (no linting)
bash scripts/quality-gates.sh --test

# Quick mode (unit tests only)
bash scripts/quality-gates.sh --quick
```

---

## Two-Phase Workflow

The standard workflow runs quality gates twice:

```bash
# Phase 1: Auto-fix
bash scripts/quality-gates.sh

# Phase 2: Verify
bash scripts/quality-gates.sh --no-fix
```

Quickmerge runs both phases internally before creating branches or PRs. If Phase 2 fails, the script exits immediately
and does NOT proceed with the merge.

---

## Ruff Version Consistency [CRITICAL]

**All three stages MUST use the exact same ruff version** to prevent formatting conflicts and CI failures:

| Stage              | Environment      | Version Source                             | Current        |
| ------------------ | ---------------- | ------------------------------------------ | -------------- |
| **Local**          | Development      | `pyproject.toml` dev deps                  | `ruff==0.15.0` |
| **Local**          | Pre-commit hooks | `.pre-commit-config.yaml`                  | `v0.15.0`      |
| **GitHub Actions** | PR validation    | `quality-gates.yml`                        | `ruff==0.15.0` |
| **Cloud Build**    | Image validation | Docker image includes ruff in `[dev]` deps | `ruff==0.15.0` |

### Three-Stage Consistency Model

1. **Local Stage**: Developer runs `quality-gates.sh` which uses ruff from venv (installed via `pyproject.toml` dev
   deps). Pre-commit hooks use version from `.pre-commit-config.yaml`.

2. **GitHub Actions Stage**: PR validation runs `quality-gates.yml` which installs `ruff==0.15.0` explicitly.

3. **Cloud Build Stage**: Tests run INSIDE the Docker image, which includes ruff from
   `uv pip install --system -e ".[dev]"` (pulls from `pyproject.toml`).

### Verifying Consistency

```bash
cd deployment-service
./scripts/check-ruff-versions.sh
```

This script verifies:

- `pyproject.toml` dev deps have `ruff==0.15.0`
- `.pre-commit-config.yaml` has `rev: v0.15.0`
- GitHub Actions workflows install `ruff==0.15.0`

### Updating Ruff Version

When updating ruff, change it in ALL locations:

1. `pyproject.toml` in every service: `"ruff==X.Y.Z"` in dev deps
2. `.pre-commit-config.yaml` in every service: `rev: vX.Y.Z`
3. Reinstall hooks: `pre-commit install --install-hooks`
4. Rebuild Docker images (Cloud Build will pick up new version from `[dev]` deps)

Convenience script:

```bash
cd deployment-service
./scripts/update-precommit-hooks.sh
```

**Why this matters**: Different ruff versions format code differently. If local uses 0.14.0 but CI uses 0.15.0, code
that passes locally will fail in CI.

---

## Ruff Configuration

Standard `pyproject.toml` ruff config:

```toml
[tool.ruff]
line-length = 120
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "W", "I"]
ignore = [
    "E501",  # Line too long - handled by ruff format
    "E722",  # Bare except - allowed in scripts only
]

[tool.ruff.lint.per-file-ignores]
"scripts/*" = ["E722"]
```

Rule categories:

- **E**: pycodestyle errors
- **F**: pyflakes (undefined names, unused imports)
- **W**: pycodestyle warnings
- **I**: isort (import sorting)

---

## Type Checking Standards (pyrightconfig.json)

All repos MUST use `typeCheckingMode: "strict"` in `pyrightconfig.json`. **All diagnostic rules must be `"error"`** —
including `reportAny`, `reportUnknownMemberType`, `reportUnknownVariableType`, `reportUnknownParameterType`,
`reportUnknownArgumentType`, and `reportMissingParameterType`. No cloud SDK exceptions: use
`# pyright: ignore[reportXxx]` inline for unavoidable third-party stub gaps rather than relaxing the global config.

**Standard pyrightconfig.json for all repos:**

```json
{
  "typeCheckingMode": "strict",
  "reportMissingTypeStubs": false,
  "reportAny": "error",
  "reportUnknownMemberType": "error",
  "reportUnknownVariableType": "error",
  "reportUnknownParameterType": "error",
  "reportUnknownArgumentType": "error",
  "reportMissingParameterType": "error"
}
```

**NEVER use `--level warning`** in quality-gates.sh basedpyright invocations. The correct invocation is:

```bash
run_timeout 120 basedpyright "$SOURCE_DIR/"
```

`--level warning` suppresses `information`-level output but also masks warnings configured as blocking in
pyrightconfig.json. Always let pyrightconfig.json control the severity.

## Library pyproject.toml: basedpyright Config

**Python libraries** MUST include `[tool.basedpyright]` with `typeCheckingMode = "strict"` and all diagnostic rules set
to `"error"`. Quality gates verify this config exists and basedpyright enforces it.

Add to `pyproject.toml`:

```toml
[tool.basedpyright]
include = ["<package_name>"]   # e.g. "unified_trading_services"
exclude = ["tests", "**/__pycache__", ".venv*", "build", "dist"]
pythonVersion = "3.13"
typeCheckingMode = "strict"
reportMissingTypeStubs = false
reportAny = "error"
reportUnknownVariableType = "error"
reportUnknownParameterType = "error"
reportUnknownMemberType = "error"
reportUnknownArgumentType = "error"
reportMissingParameterType = "error"
```

**Template:** `quality-gates-library-template.sh` runs a config check; see `instruments-service/pyproject.toml` for
reference.

---

## STEP 5.22: basedpyright Baseline Suppression [ERROR policy — escalated 2026-03-10]

`.basedpyright-baseline.json` silently hides type errors from CI by telling basedpyright to ignore previously-known
violations. The baseline mechanism is intended for one-time migration only — never for ongoing suppression.

### Policy (effective 2026-03-10)

| Baseline state                        | STEP 5.22 result |
| ------------------------------------- | ---------------- |
| File absent                           | PASS (clean)     |
| Present + 0 suppressed errors         | PASS (harmless)  |
| Present + N suppressed errors (N > 0) | **ERROR (FAIL)** |

Documentation in `QUALITY_GATE_BYPASS_AUDIT.md` does **not** exempt baseline suppression. The previous
WARN-if-documented policy has been removed. Any non-zero suppression is a hard block.

### How the gate counts suppressions

The gate uses the `files` key of the baseline JSON (the format written by `basedpyright --writebaseline`):

```json
{ "files": { "./path/to/file.py": [{ "code": "reportXxx", ... }] } }
```

Total suppressed = sum of error-entry lists across all files. If the baseline exists but `files` is empty (or the file
contains only an empty object), count = 0 and the gate passes.

### Remediation steps

1. Run basedpyright without the baseline flag to see all suppressed errors:
   ```bash
   .venv-workspace/bin/basedpyright <source_dir>/
   ```
2. Fix each type error. Common patterns: add explicit return types, replace `Any` with specific types, remove
   `# type: ignore` comments that paper over real issues.
3. Once basedpyright reports 0 errors, delete the baseline file:
   ```bash
   rm .basedpyright-baseline.json
   git rm .basedpyright-baseline.json
   ```
4. If the baseline currently has 0 suppressed errors, it is safe to delete without fixing anything.

### Pre-commit formatter note

When writing a new baseline (during initial migration only), always run prettier immediately after:

```bash
.venv-workspace/bin/basedpyright <src>/ --baselinefile .basedpyright-baseline.json --writebaseline
npx prettier --write .basedpyright-baseline.json
git add .basedpyright-baseline.json
```

The `prettier` step prevents `MM` git conflicts from the pre-commit hook reformatting the JSON.

### SSOT

The gate logic lives in:

- `unified-trading-pm/scripts/quality-gates-base/base-service.sh` — STEP 5.22 block
- `unified-trading-pm/scripts/quality-gates-base/base-library.sh` — STEP 5.22 block

---

## CI Parity [IMPLEMENTED]

Quality gates are identical across all three stages:

```
Local (scripts/quality-gates.sh)
  = GitHub Actions (.github/workflows/quality-gates.yml)
  = Cloud Build (cloudbuild.yaml - tests run inside Docker image)
```

### Key Parity Rules

- **Same Python version** (3.13) across all services
- **Same ruff version** (`0.15.0`) - see Ruff Version Consistency section
- **Same test commands** (pytest with identical flags)
- **Same timeout values** (60s unit, 120s integration, 180s e2e)
- **No bypasses**: No `|| true` or `continue-on-error: true` in CI
- **Pytest exit code 5**: (no tests collected) treated as success, not failure

### Package Manager Standard: UV

**All environments use `uv` for faster, deterministic installs:**

```bash
# Dockerfiles
RUN uv pip install --system -e ".[dev]"

# Local (if not in venv)
uv pip install -e ".[dev]"

# CI (GitHub Actions)
uv pip install -e ".[dev]"
```

**Why UV over pip:**

- 10-100x faster than pip
- Deterministic resolution
- Better error messages
- Handles `pyproject.toml` native build systems

### Cloud Build Architecture: Test-in-Image

**Cloud Build tests the artifact you deploy** - no git clones:

```yaml
steps:
  # Step 1: Configure Docker auth
  - name: "gcr.io/cloud-builders/gcloud"
    id: "configure-docker"
    args: ["auth", "configure-docker", "asia-northeast1-docker.pkg.dev", "--quiet"]

  # Step 2: Ensure artifact repo exists
  - name: "gcr.io/cloud-builders/gcloud"
    id: "ensure-repo"
    entrypoint: "bash"
    args:
      [
        "-c",
        "gcloud artifacts repositories describe {repo} --location=asia-northeast1 || gcloud artifacts repositories
        create {repo} ...",
      ]

  # Step 3: Pull base image (auth required for FROM directive)
  - name: "gcr.io/cloud-builders/docker"
    id: "pull-base-image"
    args:
      ["pull", "asia-northeast1-docker.pkg.dev/$PROJECT_ID/unified-trading-services/unified-trading-services:latest"]
    waitFor: ["configure-docker"]

  # Step 4: Build image (includes code + tests + dev deps)
  - name: "gcr.io/cloud-builders/docker"
    id: "build"
    args: ["build", "-t", "{image}:$SHORT_SHA", "."]
    waitFor: ["pull-base-image", "ensure-repo"]

  # Step 5: Run quality gates INSIDE image
  # CRITICAL: Use --entrypoint "" to clear the image's default ENTRYPOINT (python -m service).
  # Then run /bin/bash -c "..." explicitly. --entrypoint bash does NOT work reliably in Cloud Build.
  - name: "gcr.io/cloud-builders/docker"
    id: "quality-gates"
    entrypoint: "bash"
    args:
      - "-c"
      - |
        docker run --rm --entrypoint "" \
          -e CLOUD_BUILD=true -e CLOUD_MOCK_MODE=true -e GCP_PROJECT_ID=$PROJECT_ID \
          {image}:$SHORT_SHA \
          /bin/bash -c "scripts/quality-gates.sh --no-fix --quick"
    waitFor: ["build"]

  # Step 6: Push ONLY if tests pass
  - name: "gcr.io/cloud-builders/docker"
    id: "push"
    args: ["push", "{image}"]
    waitFor: ["quality-gates"]
```

**Benefits:**

- Tests the exact artifact that deploys to production
- No GitHub token needed (no private repo clones)
- Faster builds (~2-3 min saved)
- Guaranteed prod parity

**Image Requirements:**

- `Dockerfile` must include: `RUN uv pip install --system -e ".[dev]"`
- Dev deps include: `pytest`, `pytest-xdist`, `ruff==0.15.0`
- Image must copy: source code, tests, `scripts/quality-gates.sh`

### Shared Libraries: Idempotent Package Publishing

**For shared libraries** (`unified-trading-services`, `unified-events-interface`, etc.), Cloud Build must publish Python
packages to Artifact Registry **idempotently** and **enforce version uniqueness**.

**Problem:** Artifact Registry rejects duplicate package versions (400 Bad Request). Without proper handling:

- Re-running builds on same commit → fails
- Changing code without version bump → stale package published
- No feedback loop for version management

**Solution:** Two-step validation in `cloudbuild.yaml`:

```yaml
# Step 7: Store build metadata (version -> commit mapping)
- name: "gcr.io/google.com/cloudsdktool/cloud-sdk:alpine"
  id: "store-metadata"
  entrypoint: "bash"
  args:
    - "-c"
    - |
      set -e
      apk add --no-cache python3

      # Extract version from wheel
      WHEEL_FILE=$(ls dist/*.whl)
      VERSION=$(echo $WHEEL_FILE | sed -n 's/.*-\([0-9.]*\)-.*/\1/p')

      # Store version->commit mapping in GCS
      echo "{\"version\":\"$VERSION\",\"commit\":\"$COMMIT_SHA\",\"short_sha\":\"$SHORT_SHA\",\"build_id\":\"$BUILD_ID\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > /tmp/build-metadata.json

      gsutil cp /tmp/build-metadata.json \
        gs://$PROJECT_ID-build-metadata/unified-trading-services/versions/$VERSION.json || true

      echo "✓ Stored build metadata for version $VERSION"
  waitFor: ["build-wheel"]

# Step 8: Publish with version validation
- name: "gcr.io/google.com/cloudsdktool/cloud-sdk:alpine"
  id: "publish-python"
  entrypoint: "bash"
  args:
    - "-c"
    - |
      set -e
      apk add --no-cache python3 py3-pip jq
      pip3 install --break-system-packages twine keyrings.google-artifactregistry-auth

      # Extract version from wheel
      WHEEL_FILE=$(ls dist/*.whl)
      VERSION=$(echo $WHEEL_FILE | sed -n 's/.*-\([0-9.]*\)-.*/\1/p')

      # Check if version exists in Artifact Registry
      if gcloud artifacts versions list \
        --package=unified-trading-services \
        --repository=unified-libraries \
        --location=asia-northeast1 \
        --format="value(name)" 2>/dev/null | grep -q "/$VERSION\$"; then

        # Version exists - validate it's from same commit
        if gsutil cp gs://$PROJECT_ID-build-metadata/unified-trading-services/versions/$VERSION.json /tmp/existing-metadata.json 2>/dev/null; then
          EXISTING_COMMIT=$(jq -r '.commit' /tmp/existing-metadata.json)

          if [ "$EXISTING_COMMIT" = "$COMMIT_SHA" ]; then
            echo "✓ Version $VERSION already published from commit $COMMIT_SHA (idempotent rebuild)"
            exit 0
          else
            echo "❌ ERROR: Version $VERSION already exists with DIFFERENT code!"
            echo ""
            echo "You changed code but forgot to bump the version in pyproject.toml"
            echo "Current commit:   $COMMIT_SHA (short: $SHORT_SHA)"
            echo "Published commit: $EXISTING_COMMIT"
            echo ""
            echo "Action required: Bump version in pyproject.toml (e.g., 1.5.0 -> 1.5.1)"
            exit 1
          fi
        else
          # Metadata not found (old version) - fail safe
          echo "⚠️  Version $VERSION exists but no metadata found (old build?)"
          echo "Action required: Bump version in pyproject.toml to be safe"
          exit 1
        fi
      fi

      # Version doesn't exist - upload
      echo "Version $VERSION not found. Uploading to Artifact Registry..."
      python3 -m twine upload \
        --repository-url https://asia-northeast1-python.pkg.dev/$PROJECT_ID/unified-libraries/ \
        --non-interactive \
        dist/*.whl

      echo "✓ Successfully uploaded version $VERSION from commit $COMMIT_SHA"
  waitFor: ["store-metadata"]
```

**Behavior:**

| Scenario                         | Version Exists? | Same Commit? | Result                      |
| -------------------------------- | --------------- | ------------ | --------------------------- |
| New version                      | No              | -            | ✅ Upload                   |
| Rebuild same commit              | Yes             | Yes          | ✅ Skip (idempotent)        |
| Code changed, version NOT bumped | Yes             | No           | ❌ **FAIL** with error      |
| Old version (no metadata)        | Yes             | -            | ❌ Fail safe (require bump) |

**Benefits:**

- **Idempotent rebuilds**: Same commit can be built multiple times (CI retries, local testing)
- **Version enforcement**: Forces developer to bump version when code changes
- **Stale package prevention**: Catches "forgot to bump version" mistakes before merge
- **Clear feedback**: Actionable error messages guide developers

**Requirements:**

- GCS bucket: `gs://{PROJECT_ID}-build-metadata/` (create once per project)
- Cloud Build service account needs: `roles/storage.objectAdmin` on metadata bucket
- Version metadata stored indefinitely (negligible cost; enables audit trail)

**Related Cursor Rule:** `.cursor/rules/library-versioning.mdc`

---

## When Quality Gates Fail

The correct response is: **diagnose -> fix root cause -> re-run**.

### Linting Failures

1. Run Phase 1 first (auto-fix): `bash scripts/quality-gates.sh`
2. If Phase 2 still fails: read the ruff error messages
3. Common issues:
   - Undefined variable -> fix the typo or add the import
   - Bare `except:` -> catch specific exception
   - Unused import -> remove it (or ruff auto-fixed it)

### Test Failures

1. Read the pytest output for the specific failure
2. Fix the implementation or the test
3. NEVER skip the test, add `pytest.skip()`, or exclude the file
4. NEVER add `|| true` to bypass
5. If a dependency is missing (e.g., `pytest-xdist`), add it to dev deps

### Config Validation Failures

1. Fix `cloudbuild.yaml` shell variable escaping (`$` -> `$$`)
2. Fix `pyproject.toml` Python version to match expected

---

## Running All Quality Gates

To verify all 13 services pass:

```bash
cd deployment-service
bash scripts/run-all-quality-gates.sh --sequential
```

Timeout: 8-15 minutes for full sequential run. Use timeout >= 30 minutes for CI/agent runs.

---

## Security Gates [IMPLEMENTED — BLOCKING in all repos]

Two security checks run in every `scripts/quality-gates.sh`, both increment `CODEX_VIOLATIONS` on failure.

### 1. pip-audit — OSS vulnerability scan (BLOCKING)

Checks all installed Python packages against the OSV database.

```bash
pip-audit --format json -o /tmp/pip-audit-output.json
```

Required in `pyproject.toml` dev deps: `pip-audit>=2.7.0`

### 2. Internal advisory check (BLOCKING)

Checks installed package versions against known internal vulnerabilities.

**Source of truth:** `unified-trading-pm/security/internal-advisories.yaml` **Checker script:**
`unified-trading-pm/scripts/check-internal-advisories.sh`

To flag a vulnerability: append an entry to `internal-advisories.yaml` — append-only, never remove. To resolve: add
`fixed_in: "<version>"` to the existing entry.

```yaml
advisories:
  - id: INTERNAL-YYYY-NNN
    package: unified-trading-services
    affected_versions: "<2.0.0"
    fixed_in: "2.0.0"
    severity: HIGH # CRITICAL | HIGH | MEDIUM | LOW
    description: "..."
    reported_at: "2026-02-27"
    reported_by: "github-username"
```

### 3. SBOM audit trail (non-blocking)

pip-audit JSON output is stored to GCS after each run via `unified-trading-pm/scripts/sbom-store.py`. Upload failure
does not fail the build.

**Env vars:** `GCP_PROJECT_ID`, `SBOM_BUCKET` (default: `uts-sbom-audit`), `SERVICE_NAME`

**Full security docs:** `07-security/dependency-scanning.md`

---

## AWS CodeBuild Parity

Every service repo contains both `cloudbuild.yaml` (GCP Cloud Build) and `buildspec.aws.yaml` (AWS CodeBuild). Both
files execute the **identical gate logic** via `scripts/quality-gates.sh --no-fix --quick`. This section documents the
structural differences and the shared contract that keeps both platforms in sync.

### Identical Gate Logic

Both CI platforms run the same script inside the Docker image:

```bash
scripts/quality-gates.sh --no-fix --quick
```

This guarantees that a build passing on GCP will also pass on AWS and vice versa. The script itself is the single SSOT
for all gate logic — neither `cloudbuild.yaml` nor `buildspec.aws.yaml` add extra checks; they only differ in platform
mechanics.

### Structural Differences

| Aspect                  | GCP Cloud Build (`cloudbuild.yaml`)                                           | AWS CodeBuild (`buildspec.aws.yaml`)                                                               |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **File**                | `cloudbuild.yaml`                                                             | `buildspec.aws.yaml`                                                                               |
| **Registry**            | GCP Artifact Registry (`asia-northeast1-docker.pkg.dev/$PROJECT_ID/...`)      | AWS ECR (`$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$REPO_NAME`)                   |
| **Auth**                | `gcloud auth configure-docker` (ADC / service account)                        | `aws ecr get-login-password` piped to `docker login`                                               |
| **Build steps**         | Explicit named steps with `waitFor` DAG                                       | Ordered `phases`: `install` → `pre_build` → `build` → `post_build`                                 |
| **Gate execution**      | `docker run --rm --entrypoint "" -e CLOUD_BUILD=true ... /bin/bash -c "..."`  | `docker run --rm --entrypoint "" -e CLOUD_BUILD=true -e CLOUD_PROVIDER=aws ... /bin/bash -c "..."` |
| **Scan**                | GCP Container Analysis (async CVE scan, blocks on CRITICAL)                   | Not included by default — add ECR image scanning in account settings                               |
| **Post-build dispatch** | Not included                                                                  | Optional: GitHub dispatch via `GH_PAT` secret (non-blocking `\|\| true`)                           |
| **Package publish**     | Artifact Registry Python repo (twine + keyrings.google-artifactregistry-auth) | AWS CodeArtifact (twine with `aws codeartifact login`; skipped if `$CODEARTIFACT_DOMAIN` unset)    |
| **Timeout**             | `timeout: "1800s"` at root                                                    | No global timeout in spec; set on CodeBuild project console                                        |
| **Build cache**         | Implicit layer cache in Cloud Build workers                                   | `cache: paths: ["/root/.cache/uv/**/*"]` — uv cache persisted across builds                        |

### Environment Variables

Both platforms inject environment variables used by `quality-gates.sh` when running inside Docker:

| Variable             | GCP (`-e` in `docker run`)               | AWS (`-e` in `docker run`)                | Purpose                                       |
| -------------------- | ---------------------------------------- | ----------------------------------------- | --------------------------------------------- |
| `CLOUD_BUILD`        | `true`                                   | `true`                                    | Signals CI context; skips venv creation in QG |
| `CLOUD_MOCK_MODE`    | `true`                                   | `true`                                    | Disables live cloud calls; uses mock sinks    |
| `GCP_PROJECT_ID`     | `$PROJECT_ID` (Cloud Build substitution) | Not set (AWS has no project concept)      | GCP config; irrelevant on AWS path            |
| `CLOUD_PROVIDER`     | Not set (defaults to `gcp`)              | `aws`                                     | Selects cloud provider branch in cloud config |
| `AWS_DEFAULT_REGION` | Not set                                  | `ap-northeast-1` (env var in buildspec)   | AWS region for ECR and SDK calls              |
| `AWS_ACCOUNT_ID`     | Not set                                  | Must be set in CodeBuild project env vars | Required for ECR image URI construction       |

### Service-Specific Mock Variables (GCP only)

GCP `cloudbuild.yaml` files inject additional mock bucket/topic variables needed to satisfy config validation at image
startup. AWS buildspec files rely on `CLOUD_MOCK_MODE=true` alone, since the UCI mock layer intercepts all cloud SDK
calls before any env var is read:

```bash
# GCP cloudbuild.yaml quality-gates step (execution-service example)
-e EXECUTION_STORE_GCS_BUCKET=mock-execution-bucket \
-e INSTRUMENTS_STORE_GCS_BUCKET=mock-instruments-bucket \
-e STRATEGY_STORE_BUCKET=mock-strategy-bucket
```

AWS services that require bucket/topic names during config validation should add the same `-e` flags to the `docker run`
command in the `build` phase.

### GCP Emulator Configuration

For Layer 1.5 integration tests requiring protocol-faithful GCP services, set these env vars before running tests. The
GCP SDKs auto-detect and redirect to the emulator.

| Service  | Env Var                                       | Docker Image                                      | Port |
| -------- | --------------------------------------------- | ------------------------------------------------- | ---- |
| Pub/Sub  | `PUBSUB_EMULATOR_HOST=localhost:8085`         | `gcr.io/google.com/cloudsdktool/google-cloud-cli` | 8085 |
| GCS      | `STORAGE_EMULATOR_HOST=http://localhost:4443` | `fsouza/fake-gcs-server:latest`                   | 4443 |
| BigQuery | `BIGQUERY_EMULATOR_HOST=localhost:9050`       | `ghcr.io/goccy/bigquery-emulator:latest`          | 9050 |

**Known BigQuery emulator gap**: Window functions (ROW_NUMBER, RANK, etc.) are not fully supported in the community
emulator. Test only the subset of BQ features used in production paths.

Start all emulators at once:

```bash
docker compose -f unified-trading-pm/docker/docker-compose.mock.yml --profile gcp-emulators up
```

Fixtures auto-skip when the emulator is not reachable — no test failures in environments without Docker.

### AWS Moto Integration Tests

AWS services are intercepted at the SDK level using `moto` — no credentials, no network, no emulator process:

```python
from moto import mock_aws

@mock_aws
def test_s3_upload():
    # Creates real S3 bucket structure in memory
    import boto3
    client = boto3.client("s3", region_name="us-east-1")
    client.create_bucket(Bucket="test-bucket")
    ...
```

Coverage: `unified-cloud-interface/tests/integration/test_aws_mode.py` — 26 tests covering S3StorageClient,
AWSSecretClient, SQSQueueClient.

Add to test deps in `pyproject.toml`:

```toml
[project.optional-dependencies]
dev = [
  "moto[s3,secretsmanager,sqs]>=5.0.0,<6.0.0",
  ...
]
```

### Credential-Free CI Gate (network_block_plugin)

The `network_block_plugin.py` pytest plugin intercepts `socket.socket.connect` at the OS level, blocking all network
connections regardless of HTTP library:

```bash
# Activate in CI — proves zero live API calls
CLOUD_PROVIDER=local CLOUD_MOCK_MODE=true pytest --block-network -m "not sandbox"
```

**Opt-out pattern** for tests that legitimately connect to local emulators:

```python
@pytest.mark.allow_network  # emulator connection only — not a live API
def test_pubsub_emulator_roundtrip(pubsub_emulator_host):
    ...
```

Each `@pytest.mark.allow_network` opt-out emits a WARNING in CI logs. Monitor the count — it should be stable and
explained.

Plugin location: `unified-trading-pm/scripts/dev/network_block_plugin.py`

### Cassette Parity Testing (H5.2)

Every committed cassette YAML is validated against its corresponding UAC Pydantic model on every commit:

```bash
cd unified-api-contracts && pytest tests/test_cassette_schema_parity.py
# 256 tests, zero network calls, ~2s runtime
```

Failures mean a cassette records a response shape that violates the current UAC contract — fix the cassette or the
model.

### Cassette Drift Detection (H5.1)

Nightly at 02:00 UTC, `cassette-drift-check.yml` re-records cassettes against real exchange APIs and diffs them against
committed YAMLs. On schema-level drift:

- Creates GitHub issue in `unified-api-contracts`
- Sends Telegram alert

This is **alerting-only** — not CI-blocking. Human review required to update stale cassettes.

### Parity Rules

1. **Same script, same flags**: Both platforms MUST call `scripts/quality-gates.sh --no-fix --quick`. Any deviation
   requires a documented exception in `QUALITY_GATE_BYPASS_AUDIT.md`.
2. **Same Docker image**: Both platforms build from the same `Dockerfile`. The image under test is identical.
3. **Same Python version**: `buildspec.aws.yaml` sets `runtime-versions: python: "3.13"` to match `pyproject.toml`.
4. **No AWS-specific bypasses**: `|| true` in CodeBuild post-build steps MUST carry a comment explaining that the step
   is non-blocking by design (e.g., optional GitHub dispatch, optional CodeArtifact publish).
5. **ECR repo auto-creation**: `aws ecr describe-repositories ... || aws ecr create-repository ...` in `pre_build`
   mirrors GCP's `gcloud artifacts repositories describe ... || gcloud artifacts repositories create ...` in the
   `ensure-repo` step.

### Library Repos: Simpler Buildspec

Library repos (T0–T3) use a leaner `buildspec.aws.yaml` that does not build a Docker image. Quality gates run directly
in the CodeBuild environment:

```yaml
version: 0.2
env:
  variables:
    CLOUD_PROVIDER: aws
phases:
  install:
    runtime-versions:
      python: "3.13"
    commands:
      - pip install uv
      - uv pip install -e ".[dev]" --system
  pre_build:
    commands:
      - bash scripts/quickmerge.sh --quality-gates-only
  build:
    commands:
      - bash scripts/quality-gates.sh
artifacts:
  files:
    - "**/*"
```

This is equivalent to the GitHub Actions `quality-gates.yml` workflow for libraries — no Docker build, no image push.

### Adding AWS CodeBuild to a New Repo

1. Copy `unified-trading-codex/06-coding-standards/quality-gates-service-template.sh` as the repo's
   `scripts/quality-gates.sh`.
2. Copy an existing service `buildspec.aws.yaml` (e.g., `execution-service/buildspec.aws.yaml`) and update:
   - `REPO_NAME` will be derived automatically via `basename $(pwd)`.
   - Add any service-specific mock `-e` flags to the `docker run` command.
3. Set in the CodeBuild project console (not in `buildspec.aws.yaml`): `AWS_ACCOUNT_ID`, and optionally `GH_PAT`,
   `CODEARTIFACT_DOMAIN`.
4. Verify `CLOUD_PROVIDER=aws` is in `env.variables` so `UnifiedCloudConfig` selects the AWS code path.

---

## Anti-Patterns

```bash
# WRONG: bypass failures
ruff check . || true

# WRONG: skip tests
pytest tests/ -k "not test_that_fails"

# WRONG: disable in CI
continue-on-error: true

# WRONG: comment out failing tests
# def test_event_logging():
#     ...

# CORRECT: fix the issue
ruff check .  # Fix what ruff reports
pytest tests/ -v  # Fix what fails
```
