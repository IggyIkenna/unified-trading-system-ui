# Audit Remediation Plan — 2026-03-07

**Source:** Institutional-grade audit run 2026-03-07 (10 parallel agents, 140 criteria, Sections 1–10) **Overall audit
verdict:** FAIL — 24 blocking FAILs across 8 sections **This doc:** Remediation tracking only. Does NOT repeat passing
items.

Split into:

- **PART A — Approved:** User approved the fix. Action defined, agents queued.
- **PART B — Clarifications:** User had a question or thought. Analysis + recommendation included.

---

## PART A — APPROVED FIXES

### A1. Workspace Manifest Corrections

#### A1.1 — 1.3 WARN: Two repos with non-spec `type` values

**What:** `deployment-service` and `deployment-api` are typed `infrastructure` and `api-service` respectively. The
criterion does not include `infrastructure` in its allowed set, but `infrastructure` is a valid real type used by PM.
The `documentation` type is never used. **Fix:** Update manifest spec in `00-SSOT-INDEX.md` and audit criteria to
include `infrastructure` and `devops` as valid types. No repo changes needed — the manifest is correct.

#### A1.2 — 1.5 WARN: `doc_standard` mismatches

**What:** 3 API repos use `service-canonical` instead of `api-canonical`; `system-integration-tests` uses undefined
`test-canonical`; `unified-trading-ui-auth` uses `ui-canonical` while typed `library`. **Rule:** Manifest is correct
unless code disagrees. These are intentional choices. **Fix:** Update the audit criterion to accept `service-canonical`
for `api-service` repos (api repos follow service doc structure). Add `test-canonical` as a valid `doc_standard` value
in the manifest schema. `unified-trading-ui-auth` is a UI auth library — `ui-canonical` is intentional. **Files:**
`workspace-manifest.json` (add `test-canonical` to valid values), update audit prompt.

#### A1.3 — 1.6 WARN: Topological inversion (merge_level chain must reflect dependency order)

**SUPERSEDED (2026-03):** `merge_level` removed. `topologicalOrder.levels` is now the sole SSOT for tier ordering. DAG
and stagger-dispatches derive level from topo.

**What (historical):** The full dependency chain is UAC → UIC → URDI (and other T1 repos). merge_level must reflect
this: UAC must be lowest, then UIC, then T1 repos. Currently UIC is at merge_level=3 (higher than URDI at
merge_level=2), which is inverted. **Correct merge_level ordering:**

- `unified-api-contracts` → merge_level=1 (T0-base, no deps)
- `unified-internal-contracts` → merge_level=2 (T0-consumer, depends on UAC)
- T1 repos (`unified-config-interface`, `unified-trading-library`, `unified-reference-data-interface`) → merge_level=3+
- T2, T3, services → higher merge_levels accordingly **Fix:** Update `workspace-manifest.json` merge_level values. All
  tooling that reads merge_level (including SVG generation) must use manifest as SSOT — regenerate SVG after fix.

#### A1.4 — 1.13 WARN: `completion_path` uses plan file paths instead of vertical scope tokens

**What:** 43/59 repos have `completion_path` pointing to plan file paths (e.g.
`plans/active/phase2_library_tier_hardening.plan.md`) rather than vertical scope tokens (cefi / defi / sports / tradfi /
all). **Fix:** Update the 43 repos to use vertical scope tokens. Libraries and infra → `"all"`. CeFi services →
`"cefi"`. DeFi services → `"defi"`. Sports services → `"sports"`. Cross-vertical → `"all"`. Keep plan file paths as a
separate field `completion_plan` if needed.

#### A1.5 — 1.14: ibkr-gateway-infra status

**What:** Audit flagged this as archived and not in `removedEntries`. User confirmed the repo is still active and should
stay. **Fix:** Change `ibkr-gateway-infra.status` from `"archived"` to `"active"` in `workspace-manifest.json`.
Criterion 1.14 is N/A for this repo.

#### A1.6 — 1.8: `manifest.versions` section only covers 29/59 repos — CONFIRMED BUG

**What:** `update-repo-version.yml:81` defaults to `"0.0.0"` for repos absent from `manifest.versions` when computing
bump_type. Any repo missing from `versions` will have its version **reset to `0.0.1` on the next GHA bump**, permanently
losing version history. **30 repos are currently at risk.** **Fix (two-part):**

1. **Immediate:** Seed all 30 missing repos into `manifest.versions` from their current `pyproject.toml` version. This
   prevents the reset on next bump.
2. **Structural:** Add a `sync-manifest-versions` step to `run-version-alignment.sh` that:
   - Reads each repo's `pyproject.toml` version
   - Checks it against `manifest.versions.<repo>`
   - On `--fix`: writes any missing or drifted entries into `manifest.versions`
   - Reports drift without fixing on dry-run This gives local early warning before pushing to main where GHA would
     compute the wrong base. **Note:** The GHA uses `manifest.versions` as the bump base — so even if `pyproject.toml`
     says `0.1.22`, if `manifest.versions` says `"0.0.0"`, the bump result will be `0.0.1`. Keeping them in sync locally
     is essential.

---

### A2. SSOT & Architecture Fixes

#### A2.1 — 2.1/2.2: Tier classification — audit criteria wrong, manifest is correct

**What:** The audit spec listed `unified-config-interface` as T0. The manifest assigns it T1. The audit spec is
outdated. `unified-internal-contracts` (T0) depending on `unified-api-contracts` (T0) is an intentional T0 sub-tier
dependency (AC is T0-base, UIC is T0-consumer of AC's external schemas). **Fix:** Update the canonical audit prompt
Section 2 criteria:

- 2.1: T0 has two sub-tiers. `unified-api-contracts` is T0-base (zero deps). `unified-internal-contracts` is T0-consumer
  (may depend on AC only). This is a valid intra-tier dep.
- 2.2: T1 repos are: `unified-config-interface`, `unified-trading-library`, `unified-reference-data-interface`. T1
  lateral deps (T1→T1) are acceptable within the tier if the sub-ordering is consistent (`unified-config-interface` is
  T1a; `unified-trading-library` is T1b and may depend on T1a). Document the sub-tier ordering. **Files:** Canonical
  audit prompt, `TIER-ARCHITECTURE.md` in codex.

#### A2.2 — 3.1 FAIL: 13+ stale entries in `00-SSOT-INDEX.md`

**Stale entries to fix:**

- UIC file paths wrong level: `unified-internal-contracts/events.py` →
  `unified-internal-contracts/unified_internal_contracts/events.py` (and `schemas/audit.py`, `schemas/errors.py`)
- `instruments-service/docs/INSTRUMENT_SPECIFICATION.md` — file does not exist; remove entry or create the file
- `03-observability/slos.md` — missing from codex; create stub or remove
- `06-coding-standards/formatting-standards.md` — missing; create stub or remove
- `12-agent-workflow/CURSOR_AGENT_MODE_USAGE.md` and all sub-entries — directory exists but empty; populate or remove
  entries
- `04-architecture/archive/SERVICE_DEPENDENCY_DIAGRAM.md` and 4 other archive entries — remove stale entries
- `11-project-management/archive/PR_TRACKING_MATRIX.md`, `UNIFIED_WORKFLOW_FINAL.md` — remove stale entries
- `deployment-service/configs/checklist.{service}.yaml` — update to reflect actual per-service file naming pattern

#### A2.3 — 3.2 FAIL: `ModelVariantConfig` defined in 3 locations

**What:** Defined in `unified-ml-interface/models.py:153`, `unified-trading-library/ml/models.py:79`,
`unified-internal-contracts/ml.py:37`. UMI has a DEPRECATION NOTICE referencing migration to UIC but it was not
executed. **Canonical location:** `unified-internal-contracts/ml.py` (already there). **Fix:**

1. Delete `ModelVariantConfig` from `unified-ml-interface/models.py` (and `ModelMetadata`, `HyperparameterConfig` if
   also duplicated). Update all UMI imports to use `from unified_internal_contracts.ml import ModelVariantConfig`.
2. Delete `ModelVariantConfig` from `unified-trading-library/ml/models.py`. Update UTL imports. UTL imports UIC
   indirectly via UCI — check if UTL can add UIC as direct dep or re-export from UMI.
3. Update any service imports that used `from unified_ml_interface.models import ModelVariantConfig` or
   `from unified_trading_library.ml.models import ModelVariantConfig`.

#### A2.4 — 3.7 FAIL: Two `runtime-topology.yaml` files

**What:** PM has canonical (v6) at `unified-trading-pm/configs/runtime-topology.yaml`. Deployment-service has a local
view (v1) at `deployment-service/configs/runtime-topology.yaml`. **Fix:** Replace
`deployment-service/configs/runtime-topology.yaml` with a symlink to the PM canonical:

```bash
cd deployment-service/configs
rm runtime-topology.yaml
ln -s ../../unified-trading-pm/configs/runtime-topology.yaml runtime-topology.yaml
```

Any deployment-service-specific topology entries currently in the v1 file must be migrated into the PM canonical before
the symlink is created.

#### A2.5 — 3.8 FAIL: Dangling symlink in features-delta-one-service

**What:** `features-delta-one-service/deps/unified-trading-deployment-v2/configs/venues.yaml` is a dangling symlink.
`unified-trading-deployment-v2` does not exist. **Fix:** Delete the dangling symlink and the entire
`deps/unified-trading-deployment-v2/` directory from `features-delta-one-service`.

#### A2.6 — Remove all references to `unified-trading-deployment-v2` and `unified-trading-deployment-v3`

**Scope:** These repos have been decommissioned. Neither should have symlinks, references, or imports anywhere. **Known
locations:**

- `features-delta-one-service/docs/GCS_PATHS.md` — references `unified-trading-deployment-v2`
- `unified-trading-library/scripts/README.md` — references `unified-trading-deployment-v2`
- Any remaining symlinks under `features-delta-one-service/deps/` **Fix:** Grep workspace for
  `unified-trading-deployment-v2` and `unified-trading-deployment-v3`; update all references to point to
  `deployment-service` (the canonical replacement). Delete all symlinks.

#### A2.7 — 3.9 FAIL: Silent `except ImportError: pass` in execution-service

**Files:**

- `execution-service/execution_service/utils/execution_cloud_service.py:222,243` — `except ImportError: pass` (silent
  swallow)
- `execution-service/execution_service/data/checker.py:365` — `except ImportError as e:` in production **Fix:** Replace
  silent `except ImportError: pass` with loud fail per `no-empty-fallbacks.mdc`:

```python
# Instead of:
try:
    import pandas
except ImportError:
    pass

# Use:
import pandas  # fail loud if not installed
```

If the import is genuinely optional, use a `TYPE_CHECKING` guard and raise `ImportError` with a clear message.

#### A2.8 — 3.11 WARN: `FillEvent` partially duplicates UIC's `FillEventMessage`

**What:** `position-balance-monitor-service/models.py:FillEvent` has overlapping fields with
`unified-internal-contracts/pubsub.py:FillEventMessage`. **Fix:** Remove `FillEvent` from
`position-balance-monitor-service/models.py`. Update the service to import and use `FillEventMessage` from
`unified_internal_contracts.pubsub`. Adjust field mappings as needed.

#### A2.9 — 7.9: `corporate-actions` references in codex docs

**Clarification from user:** `corporate-actions` is NOT a standalone repo — it is a feature/domain within
`instruments-service`. **Files to fix (9 codex docs contain stale reference):**

- `04-architecture/pipeline-service-layers.md`
- `04-architecture/deployment-topology-diagrams.md`
- `04-architecture/README.md`
- `02-data/partitioning.md`
- `02-data/subscription-model.md`
- `10-audit/VALIDATOR_COVERAGE_MATRIX.md`
- `10-audit/PARSER_FIXES_AND_BOOK_SNAPSHOT_CLARIFICATION.md` **Fix:** Replace `corporate-actions` (standalone) with
  `instruments-service (corporate-actions domain)` or just `instruments-service` depending on context.

---

### A3. Documentation Fixes

#### A3.1 — 5.1 FAIL: 7 service repos missing required docs

Required: `README.md`, `docs/ARCHITECTURE.md`, `docs/CONFIGURATION.md`, `docs/GCS_PATHS.md`, `docs/DEPLOYMENT_GUIDE.md`,
`docs/TESTING.md`, `docs/SCHEMA_VALIDATION.md`, `QUALITY_GATE_BYPASS_AUDIT.md`

| Repo                              | Missing                                                         |
| --------------------------------- | --------------------------------------------------------------- |
| execution-results-api             | All 7 docs                                                      |
| market-data-api                   | All 7 docs                                                      |
| client-reporting-api              | All 7 docs                                                      |
| features-commodity-service        | README, GCS_PATHS, DEPLOYMENT_GUIDE, TESTING, SCHEMA_VALIDATION |
| features-cross-instrument-service | DEPLOYMENT_GUIDE, TESTING, SCHEMA_VALIDATION                    |
| features-delta-one-service        | TESTING                                                         |
| trading-agent-service             | SCHEMA_VALIDATION                                               |

**Fix:** Create the missing files. API repos need a complete doc set. Where docs exist as stubs, replace with real
content based on the service's pyproject.toml, source code structure, and existing README.

#### A3.2 — 5.2 FAIL: 6 library repos missing required docs

Required: `README.md`, `docs/ARCHITECTURE.md`, `docs/CONFIGURATION.md`, `docs/TESTING.md`,
`QUALITY_GATE_BYPASS_AUDIT.md`

| Repo                               | Missing                                                |
| ---------------------------------- | ------------------------------------------------------ |
| unified-reference-data-interface   | ARCHITECTURE, CONFIGURATION, TESTING                   |
| unified-market-interface           | ARCHITECTURE, CONFIGURATION, TESTING                   |
| unified-sports-execution-interface | ARCHITECTURE, CONFIGURATION, TESTING                   |
| unified-position-interface         | ARCHITECTURE, CONFIGURATION, TESTING                   |
| unified-trading-ui-auth            | ARCHITECTURE, CONFIGURATION, TESTING, DEPLOYMENT_GUIDE |
| matching-engine-library            | 3-line stubs → real content needed                     |
| unified-feature-calculator-library | 3-line stubs → real content needed                     |
| unified-ml-interface               | 3-line stubs → real content needed                     |
| unified-trade-execution-interface  | 3-line stubs → real content needed                     |

#### A3.3 — 5.6 FAIL: Hardcoded project ID `{project_id}` in 50 files

**What:** 170 occurrences including 15+ required canonical docs (`GCS_PATHS.md`, `CONFIGURATION.md`, `README.md`).
**Fix:** Replace all occurrences in `.md` files with `{project_id}` placeholder. Replace in Python source/config files
with `{GCP_PROJECT_ID}` env var reference or `settings.gcp_project_id`. Do NOT replace in `.env`, `.act-secrets`, or
terraform state files (those are gitignored/local). **Priority files:**

- `features-onchain-service/docs/GCS_PATHS.md`, `CONFIGURATION.md`
- `features-delta-one-service/docs/GCS_PATHS.md`, `CONFIGURATION.md`, `DEPLOYMENT_GUIDE.md`, `ARCHITECTURE.md`
- `features-volatility-service/docs/GCS_PATHS.md`, `CONFIGURATION.md`
- `ml-inference-service/docs/GCS_PATHS.md`, `CONFIGURATION.md`, `README.md`
- `ml-training-service/README.md`
- `unified-events-interface/README.md`
- `unified-trading-library/docs/CONFIGURATION.md`
- `execution-analytics-ui/src/pages/RunBacktest.tsx:565` — `useState("{project_id}")` →
  `useState(import.meta.env.VITE_GCP_PROJECT_ID ?? "")`
- `deployment-service/terraform/` — `.tfvars.bak` files containing real project ID should be gitignored or removed

#### A3.4 — AGENTS.md for all 59 repos

**What:** Only 1/59 repos has `AGENTS.md`. All repos should have one so background agents can work on them without setup
guesswork. **Standard AGENTS.md content per repo:**

```markdown
# AGENTS.md — <repo-name>

## Setup

uv sync --extra dev source .venv/bin/activate

## Quality Gates

bash scripts/quality-gates.sh

## Key Entry Points

- <main module or CLI>

## Notes

- <any non-obvious setup quirks>
```

**For UI repos:** Replace uv with `npm install && npm run build`.

---

### A4. Quality Gates & Pre-commit Fixes

#### A4.1 — 8.3 FAIL: Line-length enforcement broken system-wide

**Root cause:** `unified-trading-codex/06-coding-standards/quality-gates-service-template.sh` passes `--line-length 120`
as a CLI override at lines 116-117 and 124. This overrides any `line-length = 100` in `pyproject.toml`. Additionally
E501 is globally ignored in 30+ repos. **Fix (three steps):**

1. Remove `--line-length 120` from the canonical QG template (lines 116-117, 124). Let ruff use `pyproject.toml`
   setting.
2. Set `line-length = 100` in `[tool.ruff]` in all 30+ repos that currently have 120 or no setting.
3. Remove `E501` from `ignore` lists in all repos where it appears globally.
4. Re-run `run-all-setup.sh --rollout-first` to propagate the updated template. **Note:** This will surface real
   line-length violations. They must be fixed with `ruff format` + manual wrapping.

#### A4.2 — 8.14 FAIL: Pre-commit config versions inconsistent

**Canonical versions (from workspace-constraints.toml):** `ruff==v0.15.0`, `prettier v3.6.2`, `pre-commit-hooks v6.0.0`
**Issues:**

- `features-delta-one-service` has ruff at `v0.9.6`
- 18+ repos on `pre-commit-hooks v5.0.0` (not v6.0.0)
- 4 Python repos missing ruff hook entirely: `client-reporting-api`, `execution-results-api`, `market-data-api`,
  `unified-sports-execution-interface` **Fix:** Update `.pre-commit-config.yaml` template in PM, then run
  `run-all-setup.sh --rollout-first` to propagate.

#### A4.3 — 8.15 FAIL: 17 repos without `.git/hooks/pre-commit` installed

**What:** Pre-commit hooks not installed despite `.pre-commit-config.yaml` existing. **Affected repos:**
`client-reporting-api`, `execution-results-api`, `features-commodity-service`, `features-cross-instrument-service`,
`features-multi-timeframe-service`, `features-sports-service`, `ibkr-gateway-infra`, `market-data-api`, `strategy-ui`,
`strategy-validation-service`, `system-integration-tests`, `trading-agent-service`, `unified-cloud-interface`,
`unified-internal-contracts`, `unified-position-interface`, `unified-sports-execution-interface`,
`unified-trading-ui-auth` **Fix:** `setup.sh` should call `pre-commit install` after `uv sync`. Add this step to
`unified-trading-pm/scripts/setup.sh` if not already present. Then run `run-all-setup.sh` to install in all 17.

#### A4.4 — 8.17 FAIL: `bump-library-version` hook missing in `unified-cloud-interface` and `unified-ml-interface`

**Fix:** Add `bump-library-version` hook to `.pre-commit-config.yaml` in both repos, matching the pattern used in
`unified-events-interface`, `unified-config-interface`, `unified-trading-library`.

---

### A5. Code Quality Fixes

#### A5.1 — 7.3 FAIL: 10+ non-canonical lifecycle event names

**Canonical `LifecycleEventType` enum** (in `unified-internal-contracts/unified_internal_contracts/events.py`):
`STARTED`, `VALIDATION_STARTED`, `VALIDATION_COMPLETED`, `DATA_INGESTION_STARTED`, `DATA_INGESTION_COMPLETED`,
`PROCESSING_STARTED`, `PROCESSING_COMPLETED`, `STOPPED`, `FAILED`, `DATA_BROADCAST`, `PERSISTENCE_STARTED`,
`PERSISTENCE_COMPLETED`, `AUTH_FAILURE`, `CONFIG_CHANGED`, `SECRET_ACCESSED`

**Replacements:**

| Custom (wrong)                    | Canonical replacement                                       | Notes           |
| --------------------------------- | ----------------------------------------------------------- | --------------- |
| `VALIDATION_FAILED` (13 files)    | `FAILED` with `error_category="validation"` in details dict | Most widespread |
| `DATE_PROCESSING_STARTED`         | `PROCESSING_STARTED` with `scope="date"`                    |                 |
| `DATE_PROCESSING_COMPLETED`       | `PROCESSING_COMPLETED` with `scope="date"`                  |                 |
| `UNDERLYING_PROCESSING_STARTED`   | `PROCESSING_STARTED` with `scope="underlying"`              |                 |
| `UNDERLYING_PROCESSING_COMPLETED` | `PROCESSING_COMPLETED` with `scope="underlying"`            |                 |
| `REGIME_DETECTION_STARTED`        | `PROCESSING_STARTED` with `scope="regime_detection"`        |                 |
| `REGIME_DETECTION_COMPLETED`      | `PROCESSING_COMPLETED` with `scope="regime_detection"`      |                 |
| `BATCH_STARTED`                   | `STARTED` with `mode="batch"`                               |                 |
| `LIVE_STARTED`                    | `STARTED` with `mode="live"`                                |                 |
| `DEPENDENCY_CHECK_STARTED`        | `VALIDATION_STARTED` with `scope="dependency_check"`        |                 |
| `CONFIG_HOT_RELOADED`             | `CONFIG_CHANGED`                                            | Direct alias    |
| `AUTH_SUCCESS`                    | Remove — not a lifecycle event; use structured logging      |                 |
| `L8_COMMENTARY_ERROR`             | `FAILED` with `error_category="l8_commentary"`              |                 |

#### A5.2 — 7.6 WARN: `market-tick-data-service/Dockerfile` old AR base image

**Fix:** Replace
`FROM --platform=linux/amd64 asia-northeast1-docker.pkg.dev/${PROJECT_ID}/unified-trading-services/unified-trading-services:latest`
with
`FROM --platform=linux/amd64 asia-northeast1-docker.pkg.dev/${PROJECT_ID}/unified-trading-library/unified-trading-library:latest`

#### A5.3 — 4.7 WARN: `unified-trading-library/Dockerfile` references non-existent `requirements.txt`

**Fix:** Replace `COPY requirements.txt .` and `RUN uv pip install --system --no-cache-dir -r requirements.txt` with
`COPY pyproject.toml uv.lock ./` and `RUN uv pip install --system --no-cache-dir .`. Docker can read `pyproject.toml`
directly with `uv pip install .`.

#### A5.4 — AC: Rename `test_uic_ac_alignment.py`

**Fix:** Rename `unified-internal-contracts/tests/test_uic_ac_alignment.py` to `test_uic_internal_consistency.py`.
Update any CI references.

---

### A6. Type Safety Fixes

#### A6.1 — 9.7 FAIL: Missing `typeCheckingMode: "strict"` in 4 repos

**Fix per repo:**

- `strategy-service/pyrightconfig.json` — add `"typeCheckingMode": "strict"` and `"reportAny": "error"`
- `unified-trading-pm/pyrightconfig.json` — change `"standard"` to `"strict"`
- `features-commodity-service/` — create `pyrightconfig.json` matching template from another service
- `trading-agent-service/` — create `pyrightconfig.json` matching template

#### A6.2 — 9.9 FAIL: `unified-trading-library` has 41/64 production files excluded

**What:** `unified-trading-library/pyrightconfig.json` lists 41 production source files in `exclude`. This defeats type
checking for 64% of the T0 foundational library. **Fix:** Remove all production source files from `exclude`. Only test
dirs, `__pycache__`, `.venv*`, `build`, `dist` should be excluded. Resolve the type errors that surface — they are real
issues that need fixing, not suppressing. **Also:** `execution-service/pyrightconfig.json` — remove
`executionEnvironments` entries that suppress `reportUnknownMemberType`, `reportUnknownVariableType`,
`reportUnknownArgumentType`, `reportUnknownParameterType` across 17 subdirectories. Fix or document the underlying type
errors.

#### A6.3 — 9.11 WARN: ~450+ bare `dict`/`list` annotations without type parameters

**Top offenders (fix priority order):**

1. `execution-service` (136 occurrences) — replace bare `dict` with `dict[str, X]` where X is the specific value type
2. `deployment-api` (111 occurrences)
3. `features-delta-one-service` (52)
4. `market-data-processing-service` (37)
5. `ml-training-service` (30) **Tool:** `ruff` with rule `UP006` (deprecated typing forms) + `ANN` rules catches most of
   these.

---

### A7. Cursor Rules

#### A7.1 — 6.4 WARN: 10 rules missing `CODEX:` references

**Files missing `CODEX:` ref:**

- `ci-cd/act-secrets-setup.mdc`
- `config/dynamic-config-injection.mdc`
- `config/workspace-venv-fallback.mdc`
- `core/anti-patterns-quick-reference.mdc`
- `core/schema-service-owned.mdc`
- `dependencies/dependency-alignment-and-setup-flow.mdc`
- `imports/no-schema-outside-contracts.mdc` (priority 90 — most critical to fix)
- `misc/audit-reflog-scheduled-job.mdc`
- `workflow/full-cicd-flow.mdc`
- `workflow/single-repo-vs-workspace-setup.mdc` **Fix:** Add `CODEX: <path-to-codex-doc>` reference to each. For
  `no-schema-outside-contracts.mdc`, the reference is `unified-trading-codex/04-architecture/TIER-ARCHITECTURE.md`.

---

### A8. Security Fixes (Sections 9–10, user agreed)

#### A8.1 — 10.11 FAIL: `risk-and-exposure-service` unauthenticated endpoints

**Files:** `risk-and-exposure-service/risk_and_exposure_service/api/main.py:76,189` `POST /pre-trade-check` and
`POST /risk-limits` have no authentication. **Fix:** Add `Depends(verify_api_key)` or IAM-based Cloud Run
authentication. Match pattern from `execution-service` or `alerting-service`.

#### A8.2 — 10.12 FAIL: Mock authentication in production

**File:** `position-balance-monitor-service/position_balance_monitor_service/api/main.py:150-153` `verify_api_key()`
accepts any `client-*-key` string. **Fix:** Replace with real Secret Manager key validation. Use `get_secret_client()`
from UCI to fetch the expected API key, then compare with `secrets.compare_digest()`.

#### A8.3 — 10.4 FAIL: Hardcoded project ID in UI source + terraform files

**Files:**

- `execution-analytics-ui/src/pages/RunBacktest.tsx:565` — `useState("{project_id}")` →
  `useState(import.meta.env.VITE_GCP_PROJECT_ID ?? "")`
- `deployment-service/terraform/` — `.tfvars.bak` files with real project ID. Add `*.tfvars.bak` to `.gitignore`. Remove
  from git history if committed.

---

## PART B — CLARIFICATIONS & RECOMMENDATIONS

### B1. Why didn't `run-version-alignment.sh --fix` catch 1.8 version drift?

**Analysis:** The alignment script only validates and fixes `repositories.<repo>.dependencies` (internal dep version
ranges and external dep alignment vs `workspace-constraints.toml`). It does NOT touch the top-level `versions` section.
That section is exclusively updated by the `version-bump.yml` GHA on merge to main.

**Recommendation:** Add a step to `check-dependency-alignment.py` that:

1. Checks every repo in `repositories` has an entry in `versions`
2. Checks `versions.<repo>` matches the `version` in `repositories.<repo>` (currently these can drift)
3. On `--fix`, seeds missing `versions` entries from pyproject.toml

### B2. Pre-commit/QG template issues should be caught by alignment script

**User direction:** Pre-commit and quality-gate template issues should be detectable and fixable via
`run-version-alignment.sh`, not only via `run-all-setup.sh --rollout-first`. The setup rollout is primarily about
running `setup.sh` per-repo given `.toml` updates.

**Analysis of each issue:**

- **8.3 (line-length):** Canonical QG template has `--line-length 120` hardcoded. Fix requires: (1) editing the
  canonical template, (2) re-rolling it out. The alignment script should detect template drift by hashing
  `scripts/quality-gates.sh` against the canonical template and flagging divergence.
- **8.14 (pre-commit versions):** `.pre-commit-config.yaml` versions drift. The alignment script should include a step
  that validates pre-commit hook versions against `workspace-constraints.toml` (which has `ruff==0.15.0`).
- **8.15 (hooks not installed):** Alignment script should check for `.git/hooks/pre-commit` existence and run
  `pre-commit install` if missing as part of its fix pass.
- **8.17 (bump-library-version missing):** Alignment script should verify library repos have the bump hook.

**Recommendation:** Add a Phase 1.5 to `run-version-alignment.sh` between dependency alignment and setup:

- Check QG template hash vs canonical — flag drift
- Check `.pre-commit-config.yaml` hook versions vs canonical — flag/fix
- Check `.git/hooks/pre-commit` exists — run `pre-commit install` if missing on `--fix`
- Check library repos have `bump-library-version` hook — fix on `--fix`

### B3. Should `run-version-alignment.sh` catch 4.3 (eth-abi/gunicorn conflicts) and 4.11 (psutil below floor)?

**Analysis:**

- **4.3:** The conflicts are between `[tool.uv] override-dependencies` in `unified-api-contracts` and the canonical
  manifest. The current `validate-dependency-conflicts.py` uses `uv pip compile` which may not surface override
  conflicts because overrides bypass resolution. This is a real gap.
- **4.11:** `psutil>=5.9.6` is in `market-tick-data-service`'s optional `monitoring` group. The
  `fix_external_dependency_alignment.py` may skip optional groups.

**Recommendation:** Update `check-dependency-alignment.py` to:

1. Parse `[tool.uv] override-dependencies` and validate them against canonical ranges
2. Include optional dependency groups in external alignment checks (not just `[project.dependencies]`)

### B4. Can Docker use `pyproject.toml` instead of `requirements.txt`?

**Answer: Yes.** Replace:

```dockerfile
COPY requirements.txt .
RUN uv pip install --system --no-cache-dir -r requirements.txt
```

With:

```dockerfile
COPY pyproject.toml uv.lock ./
RUN uv pip install --system --no-cache-dir .
```

`uv pip install .` reads `pyproject.toml` directly. This eliminates the parallel source entirely.

### B5. Build backend split (4.10) — standardise on setuptools (approved)

**The `[build-system]` section** in `pyproject.toml` controls how `pip install .` or `uv build` assembles the wheel:

- `setuptools.build_meta` — traditional standard; all 39 repos use this
- `hatchling.build` — newer, zero-config, used by 4 repos (`risk-and-exposure-service` and 3 others)

**User approved:** Standardise on `setuptools.build_meta` across all repos.

**Action:** For the 4 hatchling repos, update `[build-system]` to:

```toml
[build-system]
requires = ["setuptools>=75", "wheel"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["."]
include = ["<source_dir>*"]
exclude = ["tests*"]
```

Add the `[tool.setuptools.packages.find]` section to avoid multi-package discovery error.

Also standardise `setuptools` minimum version: use `>=75` across all repos (currently varies from `>=61` to `>=80.9.0`).

### B6. Should DAG SVG regeneration be in quality gates or pre-commit?

**It already is.** `quickmerge.sh:324` calls `generate_workspace_dag.py` on every push. So audit criterion 2.11 should
be PASS — the SVG is regenerated automatically. The audit agent could not confirm this statically; it's confirmed
dynamically by the quickmerge script. **Action:** Update audit criterion 2.11 to note that regeneration is handled by
`quickmerge.sh:324`.

### B7. Should test template divergence (3.12) be enforced in codex GHA?

**Recommendation: Yes.** Add a step to `unified-trading-codex/.github/workflows/` (or the PM codex-sync workflow) that:

1. Hashes `06-coding-standards/test-templates/test_event_logging.py`
2. Hashes the corresponding file in each repo's tests
3. Fails if a repo's test template file diverges from codex by more than a defined threshold

This is the only automated way to enforce template consistency across 59 repos.

### B8. Optional dep upper bounds (4.4) — what to do

**13 unbounded specs in optional groups.** The highest-risk ones:

- `gcsfs>=2024.2.0` (UTL gcp group) — add `<2025.0.0`
- `databento>=0.32.0`, `tardis-client>=1.3.7`, `ib_insync>=0.9.86` (AC schema-validation group) — add `<1.0.0`,
  `<2.0.0`, `<1.0.0` respectively
- `openbb>=4.0.0` — add `<5.0.0`

Security override entries (`eth-abi>=5.0.1`, `gunicorn>=22.0.0`) should be updated in canonical manifest then
propagated. These CVE remediations need upper bounds too: `eth-abi>=5.0.1,<6.0.0`, `gunicorn>=22.0.0,<23.0.0`.

---

## Remediation Priority Order

| Priority | Item                                                         | Effort | Risk if deferred     |
| -------- | ------------------------------------------------------------ | ------ | -------------------- |
| P0       | A8.1 — Unauthenticated risk endpoints                        | Low    | Critical security    |
| P0       | A8.2 — Mock auth in production                               | Low    | Critical security    |
| P0       | A8.3 — Hardcoded project ID in UI + terraform                | Low    | Data exposure        |
| P1       | A4.1 — Fix line-length enforcement (template + 30 repos)     | Medium | QG unreliable        |
| P1       | A6.2 — Remove UTL pyrightconfig exclusions                   | High   | Type bugs in T0 lib  |
| P1       | A2.4 — Symlink runtime-topology.yaml                         | Low    | Dual-authority risk  |
| P1       | A2.5/A2.6 — Remove deployment-v2/v3 references               | Low    | Dangling dead refs   |
| P1       | A5.1 — Fix lifecycle event names (15 files)                  | Medium | Parser breakage      |
| P2       | A3.1/A3.2 — Missing required docs (13 repos)                 | High   | Doc debt             |
| P2       | A3.3 — Hardcoded project IDs in docs (50 files)              | Medium | Config drift         |
| P2       | A2.3 — Consolidate ModelVariantConfig                        | Medium | Schema confusion     |
| P2       | A2.7 — Fix silent except ImportError                         | Low    | Violation of rules   |
| P2       | A4.2/A4.3/A4.4 — Pre-commit version alignment                | Low    | Hook unreliability   |
| P2       | A6.1 — Add pyrightconfig strict to 4 repos                   | Low    | Type blind spots     |
| P3       | A3.4 — AGENTS.md for 59 repos                                | High   | Agent setup friction |
| P3       | A6.3 — Bare dict/list annotations (450+)                     | High   | Type coverage        |
| P3       | A2.2 — Fix SSOT index stale entries                          | Medium | Index unreliable     |
| P3       | A7.1 — CODEX refs in 10 cursor rules                         | Low    | Rule traceability    |
| P3       | B1 — Add versions section audit to alignment script          | Medium | Drift detection      |
| P3       | B3 — Update alignment script for optional groups + overrides | Medium | Gap in validation    |

---

## Completion Status — 2026-03-07 (17 agents)

All approved PART A items are DONE. Tracked below with agent attribution.

| Item                                                            | Status | Agent               | Notes                                           |
| --------------------------------------------------------------- | ------ | ------------------- | ----------------------------------------------- |
| A1.1 — manifest type spec update                                | DONE   | S1-A1               | 00-SSOT-INDEX updated                           |
| A1.2 — doc_standard mismatches                                  | DONE   | S1-A1               | No changes needed; manifest correct             |
| A1.3 — merge_level chain (UAC=1, UIC=2, T1=3+)                  | DONE   | S1-A1, S1-A13       | All 59 repos at correct levels                  |
| A1.4 — completion_path vertical scope tokens                    | DONE   | S1-A1               | All 59 repos use cefi/defi/sports/tradfi/all    |
| A1.5 — ibkr-gateway-infra status→active                         | DONE   | S1-A1               |                                                 |
| A1.6 — manifest.versions seeded 59/59 + alignment script sync   | DONE   | S1-A1, S1-A12       | sync-manifest-versions.py created + integrated  |
| A2.1 — tier classification audit criteria corrected             | DONE   | S1-A8               | TIER-ARCHITECTURE.md T0 sub-tier documented     |
| A2.2 — 00-SSOT-INDEX stale entries                              | DONE   | S1-A2               | 10+ stale entries removed/corrected             |
| A2.3 — ModelVariantConfig consolidated to UIC                   | DONE   | S1-A11              | UMI + UTL now import from UIC                   |
| A2.4 — runtime-topology.yaml symlink                            | DONE   | S1-A2               | deployment-service → PM canonical               |
| A2.5 — dangling symlink (features-delta-one-service/deps/)      | DONE   | S1-A2               | Deleted entirely                                |
| A2.6 — deployment-v2/v3 refs removed                            | DONE   | S1-A2, S2-codex     | All refs replaced with deployment-service       |
| A2.7 — silent except ImportError fixed                          | DONE   | S1-A6               | Loud fail with message                          |
| A2.8 — FillEvent → FillEventMessage                             | DONE   | S1-A6               | position-balance-monitor-service migrated       |
| A2.9 — corporate-actions standalone refs in codex               | DONE   | S1-A2, S2-codex     | All 18 files updated                            |
| A3.1 — 7 service repos missing docs                             | DONE   | S1-A3               | All 7 repos fully documented                    |
| A3.2 — library repos stub docs → real content                   | DONE   | S1-A3, S2-lib       | 9 library repos documented                      |
| A3.3 — hardcoded project IDs (50→0 files)                       | DONE   | S1-A4, S2-projid    | Zero occurrences remain                         |
| A3.4 — AGENTS.md for 59 repos                                   | DONE   | S1-A9               | All 59 repos                                    |
| A4.1 — QG template --line-length 120 removed                    | DONE   | S1-A5               | Both service + library templates                |
| A4.1b — E501 removed + line-length=100 in 30 repos              | DONE   | S1-A5               | All 30 repos                                    |
| A4.2 — pre-commit versions (ruff v0.15.0, hooks v6.0.0)         | DONE   | S1-A5, S2-precommit | All repos canonical                             |
| A4.3 — pre-commit install in setup.sh                           | DONE   | S1-A5               | Step 8.5 added                                  |
| A4.4 — bump-library-version hook in UCI + UMI                   | DONE   | S1-A5               | Both repos updated                              |
| A5.1 — lifecycle event names (21 production files)              | DONE   | S1-A6               | VALIDATION_FAILED→FAILED+error_category etc.    |
| A5.2 — Dockerfile base image (market-tick-data)                 | DONE   | S1-A6               | UTL path corrected                              |
| A5.3 — UTL Dockerfile requirements.txt → pyproject.toml         | DONE   | S1-A6               |                                                 |
| A5.4 — test_uic_ac_alignment.py renamed                         | DONE   | S1-A6               | →test_uic_internal_consistency.py               |
| A6.1 — pyrightconfig strict (4 repos)                           | DONE   | S1-A7               | features-commodity, trading-agent, strategy, PM |
| A6.2 — UTL pyrightconfig 41 exclusions removed                  | DONE   | S1-A7               | T0 library now fully type-checked               |
| A6.2b — execution-service executionEnvironments removed         | DONE   | S1-A7               |                                                 |
| A6.3 — bare dict/list in execution-service + deployment-api     | DONE   | S1-A7               | ~50 annotations fixed                           |
| A7.1 — CODEX refs in 10 cursor rules                            | DONE   | S1-A8, S2-projid    | All 10 rules updated                            |
| A7.2 — TIER-ARCHITECTURE.md T0 sub-tier documented              | DONE   | S1-A8               |                                                 |
| A7.3 — redundant alwaysApply+globs cleaned (10 rules)           | DONE   | S1-A8               |                                                 |
| A7.4 — priority fields added to 6 rules                         | DONE   | S1-A8               |                                                 |
| A8.1 — risk-and-exposure-service auth                           | DONE   | S1-A10              | hmac.compare_digest vs SM key                   |
| A8.2 — position-balance-monitor mock auth replaced              | DONE   | S1-A10              | Real SM-backed auth                             |
| A8.3 — \*.tfvars.bak gitignored                                 | DONE   | S1-A10              | deployment-service/.gitignore                   |
| A8.4 — Swagger/OpenAPI gated in production                      | DONE   | S1-A10              | execution-service + risk-service                |
| B2 — check-precommit-versions.py + check-qg-template-drift.py   | DONE   | S1-A12              | Phases 3.6+3.7 in alignment script              |
| B3 — eth-abi/gunicorn CVE bounds                                | DONE   | S1-A11              | workspace-constraints.toml updated              |
| B4 — Docker pyproject.toml pattern                              | DONE   | S1-A6               | UTL Dockerfile                                  |
| B5 — hatchling→setuptools (4 repos) + setuptools>=75 (35 repos) | DONE   | S1-A13              |                                                 |

### Known remaining (follow-up items, not blocking)

- 6 library repos still use `black`/`isort` + local ruff wrapper instead of `astral-sh/ruff-pre-commit`
  (unified-feature-calculator-library, unified-defi-execution-interface, unified-trade-execution-interface,
  unified-reference-data-interface, matching-engine-library, unified-ml-interface)
- bare `dict`/`list` in features-delta-one-service (52), market-data-processing-service (37), ml-training-service (30) —
  not fixed (execution-service and deployment-api were priority)
- B7 — test template divergence GHA enforcement not yet automated
