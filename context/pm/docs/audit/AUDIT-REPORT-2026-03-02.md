# Unified Trading System — Comprehensive Audit Report

**Date:** 2026-03-02 **Auditor:** Claude Opus 4.6 (15 parallel agents) **Scope:** Workspace-wide (60 repos, 25 audit
sections) **SSOT Reference:** `unified-trading-pm/plans/active/trading-system-audit-prompt.md`

---

## Executive Summary

| Metric                   | Value    |
| ------------------------ | -------- |
| Total criteria evaluated | ~250     |
| PASS                     | ~95      |
| WARN                     | ~65      |
| FAIL                     | ~90      |
| **Overall grade**        | **FAIL** |

### Top 5 Blocking Issues

1. **CRITICAL: Corrupted package names in 37/45 repos** (400 dependency lines) — `propagate-canonical-versions.py`
   doubled package names (e.g., `fastapifastapi>=0.110.0`)
2. **CRITICAL: DISABLE_AUTH bypasses all API authentication** — single env var disables security in 5 production API
   services with no production guard
3. **CRITICAL: Enum members referenced but missing** — `ErrorRecoveryStrategy.DEAD_LETTER` and
   `ErrorCategory.VALIDATION_ERROR` will cause runtime `AttributeError`
4. **CRITICAL: Service-to-service Python import** — `market-tick-data-service` imports `instruments-service` as a
   package dependency (violates DAG)
5. **CRITICAL: 169 functions exceed 200 lines** — automatic FAIL per codex; worst is 1,606-line test function

### Technical Debt Trajectory (Baseline)

| Metric                              | Count                      |
| ----------------------------------- | -------------------------- |
| `# type: ignore` suppressions       | ~395                       |
| `Any` type usage (prod)             | ~1,600+                    |
| Files >900 lines                    | 58                         |
| Functions >200 lines                | 169                        |
| Classes >500 lines                  | 126                        |
| Methods >50 lines                   | 1,564                      |
| Exact-duplicate file groups         | 137 (~44,008 wasted lines) |
| f-string logger calls               | 613+                       |
| Test functions with zero assertions | 141                        |
| Coverage threshold set below 70%    | 22 repos                   |

---

## Fix Status (Updated 2026-03-03 final)

**44 / 58 issues fixed** + 1 new issue (ISS-059) created and fixed. ISS-028 (coverage) partially done (4/14 repos at
70%, 10 blocked/in-progress). 14 deferred (P3).

See: `unified-trading-pm/docs/audit/DEFERRED-ISSUES-DECISIONS.md` for full decisions and agent instructions.

| Status                  | Issues                                                                                                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FIXED                   | ISS-001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011 (false positive), 012, 013, 014, 015, 016, 017, 018, 019, 020, 021, 022, 023, 024, 025, 026, 027, 029, 030, 031, 032, 033, 034, 035, 036, 037, 038, 039, 040, 041, 059 |
| IN PROGRESS             | ISS-028 (coverage to 70%: 4/14 repos done, 10 blocked — see detail below)                                                                                                                                                        |
| DEFERRED (P3 execution) | ISS-042, 043, 044, 045, 046, 047, 048, 049, 050, 051, 052, 053, 054, 055, 056, 057, 058                                                                                                                                          |

### ISS-028 Coverage Detail (per repo)

| Repo                             | Threshold | Coverage | Status                                     |
| -------------------------------- | --------- | -------- | ------------------------------------------ |
| unified-events-interface         | 70        | 91%      | PASS                                       |
| unified-internal-contracts       | 70        | 99%      | PASS                                       |
| risk-and-exposure-service        | 70        | 75%      | PASS                                       |
| position-balance-monitor-service | 70        | 70%      | PASS (new tests written)                   |
| features-sports-service          | 64        | 65%      | PARTIAL (new tests, needs ~566 more lines) |
| ml-training-service              | 48        | 48%      | BLOCKED (11 test failures)                 |
| features-volatility-service      | 37        | 37%      | BLOCKED (15 test failures)                 |
| unified-domain-client            | 37        | 37%      | BLOCKED (8 test failures)                  |
| execution-results-api            | 21        | 21%      | NEEDS TESTS                                |
| deployment-service               | 21        | 21%      | NEEDS TESTS                                |
| execution-service                | 55        | N/A      | BLOCKED (ImportError)                      |
| features-delta-one-service       | 55        | N/A      | BLOCKED (import errors)                    |
| market-data-processing-service   | 55        | N/A      | BLOCKED (syntax errors from prior session) |
| unified-market-interface         | 55        | N/A      | BLOCKED (syntax errors from prior session) |

---

## MASTER ISSUE REGISTRY

Issues are sorted by priority (P0 = immediate, P3 = polish). Each issue has:

- **Unique ID** for tracking
- **Exact file:line** references for agent-executable fixes
- **Recommended fix** written as step-by-step instructions
- **Time estimate** and **difficulty** rating
- **Status:** FIXED / DEFERRED with reason

---

## P0 — CRITICAL / SECURITY (Fix Immediately)

### ISS-001: Corrupted doubled package names in 37/45 repos — FIXED

- **Section:** S4 (Dependency Governance) | **Criterion:** 4.11
- **Severity:** CRITICAL | **Time:** 2-4h | **Difficulty:** Medium
- **Description:** `propagate-canonical-versions.py` introduced concatenated package names in `pyproject.toml` files.
  Example: `"fastapifastapi>=0.110.0,<1.0.0"` instead of `"fastapi>=0.110.0,<1.0.0"`. Affects 400 dependency lines
  across 37 repos. Fresh `uv pip install` will fail for all affected repos.
- **Files:** Every `*/pyproject.toml` in 37 affected repos. Example: `alerting-service/pyproject.toml` lines 18-24
- **Clean repos (8):** deployment-service, features-sports-service, strategy-validation-service, unified-api-contracts,
  unified-cloud-interface, unified-trading-codex, unified-trading-library, unified-trading-pm
- **Fix:**
  1. Write a script that reads each `pyproject.toml`, finds dependency strings matching `([a-z0-9][-a-z0-9]*)\1` regex
     pattern
  2. Replace each doubled name with the single correct name
  3. Run `uv lock` in each affected repo to validate
  4. Fix the root cause in `unified-trading-pm/scripts/propagation/propagate-canonical-versions.py`

### ISS-002: DISABLE_AUTH env var bypasses all API authentication — FIXED

- **Section:** S10 (Security) | **Criterion:** 10.12
- **Severity:** CRITICAL | **Time:** 2h | **Difficulty:** Medium
- **Description:** All 5 API services check `os.getenv("DISABLE_AUTH", "false")` and if `"true"`, bypass all auth
  returning `"dev-mode"`. No production guard prevents this from being set in Cloud Run.
- **Files:**
  - `execution-results-api/execution_results_api/auth.py:23`
  - `alerting-service/alerting_service/auth.py:23`
  - `client-reporting-api/client_reporting_api/auth.py:37`
  - `market-data-api/market_data_api/auth.py:23`
  - `deployment-api/deployment_api/auth.py:23`
- **Fix:**
  1. In each `auth.py`, after reading `DISABLE_AUTH`, add guard:
     ```python
     if disable_auth and os.getenv("ENVIRONMENT") == "production":
         raise RuntimeError("DISABLE_AUTH cannot be true in production")
     ```
  2. Better: remove `DISABLE_AUTH` entirely; use DI to inject a `NoOpAuthVerifier` in dev only

### ISS-003: Enum members referenced but not defined (runtime crash) — FIXED

- **Section:** S11 (Error Handling) | **Criteria:** 11.7
- **Severity:** CRITICAL | **Time:** 15 min | **Difficulty:** Trivial
- **Description:** `base_adapter.py` references `ErrorRecoveryStrategy.DEAD_LETTER` and
  `ErrorCategory.VALIDATION_ERROR`, but these enum members do not exist. Will cause `AttributeError` at runtime when
  validation fails.
- **Files:**
  - `unified-market-interface/unified_market_interface/base_adapter.py:81-83`
  - `unified-internal-contracts/unified_internal_contracts/schemas/errors.py` (ErrorRecoveryStrategy enum)
  - `unified-api-contracts/unified_api_contracts/internal/health.py` (ErrorCategory enum)
- **Fix:**
  1. Add `DEAD_LETTER = "dead_letter"` to `ErrorRecoveryStrategy` enum in both contracts repos
  2. Change `ErrorCategory.VALIDATION_ERROR` to `ErrorCategory.VALIDATION` in `base_adapter.py`, OR add
     `VALIDATION_ERROR = "validation_error"` alias to enum

### ISS-004: Service-to-service Python import (DAG violation) — FIXED (dep was already removed)

- **Section:** S2 (Tier Architecture) | **Criterion:** 2.5, 2.9
- **Severity:** CRITICAL | **Time:** 4-8h | **Difficulty:** Medium-High
- **Description:** `market-tick-data-service/pyproject.toml` line 98 declares `"instruments-service>=0.1.0"` with path
  source `../instruments-service`. Services must NEVER import another service as a Python package.
- **Files:**
  - `market-tick-data-service/pyproject.toml:98` (dependency line)
  - `market-tick-data-service/pyproject.toml:167` (source path)
- **Fix:**
  1. Identify which symbols MTDS imports from instruments-service (likely instrument metadata/definitions)
  2. Extract those shared types into `unified-reference-data-interface` (T1 library)
  3. Remove `instruments-service` from MTDS `pyproject.toml` dependencies
  4. Update MTDS imports to use `unified-reference-data-interface`

### ISS-005: 74 instances of exception details leaked to HTTP clients — FIXED

- **Section:** S10 (Security) | **Criterion:** 10.14
- **Severity:** CRITICAL | **Time:** 4h | **Difficulty:** Medium
- **Description:** `HTTPException(detail=str(e))` exposes internal paths, SQL errors, and tracebacks to API clients.
- **Files (worst):**
  - `deployment-api/deployment_api/routes/deployments.py` (11 instances)
  - `deployment-api/deployment_api/routes/data_status.py` (13 instances)
  - `deployment-api/deployment_api/routes/config.py` (6 instances)
  - `position-balance-monitor-service/position_balance_monitor_service/api/main.py:87`
- **Fix:**
  1. Create utility in `unified-trading-library`:
     ```python
     def safe_error_detail(e: Exception, *, status_code: int) -> str:
         if status_code >= 500:
             logger.exception("Internal error")
             return "Internal server error. Check server logs."
         return str(e)
     ```
  2. Replace all `detail=str(e)` in 500-level handlers with `detail=safe_error_detail(e, status_code=500)`
  3. Keep `str(e)` only for 4xx validation errors where message is user-friendly

### ISS-006: .env files tracked in git with real infrastructure details — FIXED

- **Section:** S10 (Security) | **Criterion:** 10.7
- **Severity:** CRITICAL | **Time:** 2h | **Difficulty:** Low
- **Description:** 13 repos have `.env` files tracked in git containing real GCP project ID and bucket names.
- **Repos:** unified-trading-deployment-v3, market-data-processing-service, features-delta-one-service,
  unified-trading-library, features-volatility-service, instruments-service, strategy-service, market-tick-data-service,
  execution-service, features-onchain-service, features-calendar-service, ml-training-service, ml-inference-service
- **Fix:**
  1. For each repo: `git rm --cached .env`
  2. Add `.env` to `.gitignore` (if not already present)
  3. Ensure `.env.example` exists with placeholder values
  4. Commit the `.gitignore` change

### ISS-007: Hardcoded GCP project ID in 30+ locations — FIXED

- **Section:** S10 (Security) + S7 (Codex Drift) | **Criteria:** 10.4, 7.1
- **Severity:** CRITICAL | **Time:** 4h | **Difficulty:** Low
- **Description:** `central-element-323112` hardcoded in production code, scripts, CLI help, and test files. 28
  occurrences in tests alone.
- **Files (key):**
  - `execution-service/scripts/runners/run_phasee_fullpath_matrix.py:33-40`
  - `execution-service/execution_service/cli/backtest.py:171,177,183`
  - `features-sports-service/features_sports_service/live_runner.py:8`
  - `features-volatility-service/tests/conftest.py:58-64` (6 occurrences)
  - `execution-results-api/tests/test_results_service_phase_c.py` (12 occurrences)
- **Fix:**
  1. In production code: replace with `config.gcp_project_id` from `UnifiedCloudConfig`
  2. In scripts: accept `--project-id` CLI arg or read from config
  3. In tests: define `TEST_PROJECT_ID = "test-project-000000"` in `conftest.py`
  4. Search: `rg "central-element" --type py --glob '!.venv*' --glob '!archive/*'`

### ISS-008: SQL injection via f-string table names — FIXED

- **Section:** S10 (Security) | **Criterion:** 10.10
- **Severity:** HIGH | **Time:** 1h | **Difficulty:** Low
- **Description:** `f"SELECT COUNT(*) as cnt FROM {sql_table}"` with `# noqa: S608` suppression.
- **Files:**
  - `features-sports-service/features_sports_service/scripts/validation.py:127,171,184`
  - `ml-inference-service/ml_inference_service/app/core/prediction_publisher.py:224`
- **Fix:**
  1. Validate table names against regex `^[a-zA-Z0-9_.-]+$` before interpolation
  2. Remove `# noqa: S608` suppressions
  3. For BigQuery: use `bigquery.TableReference` instead of string interpolation

### ISS-009: Swagger/OpenAPI docs enabled in production — FIXED

- **Section:** S10 (Security) | **Criterion:** 10.13
- **Severity:** HIGH | **Time:** 1h | **Difficulty:** Low
- **Description:** All 10 FastAPI apps expose `/docs`, `/redoc`, `/openapi.json` in production.
- **Fix:**
  1. In each FastAPI constructor, add:
     ```python
     docs_url=None if settings.environment == "production" else "/docs",
     redoc_url=None if settings.environment == "production" else "/redoc",
     openapi_url=None if settings.environment == "production" else "/openapi.json",
     ```

---

## P1 — ARCHITECTURE (Fix This Sprint)

### ISS-010: T0 unified-config-interface depends on T0 unified-events-interface — FIXED (UCI promoted to T1)

- **Section:** S2 (Tier Architecture) | **Criterion:** 2.1
- **Severity:** HIGH | **Time:** 2-4h | **Difficulty:** Medium
- **Files:** `unified-config-interface/pyproject.toml` (dependency on `unified-events-interface`)
- **Fix:** Either inline the UEI functionality UCI needs, or promote UCI to T1, or amend tier_rules to allow T0-to-T0

### ISS-011: execution-results-api depends on unified-domain-client (T3) — FIXED (false positive: no actual dependency)

- **Section:** S2 (Tier Architecture) | **Criterion:** 2.7
- **Severity:** HIGH | **Time:** 2-4h | **Difficulty:** Medium
- **Files:** `execution-results-api/pyproject.toml` (dependency on `unified-domain-client`)
- **Fix:** Remove UDC dependency; route cloud storage through the proxied execution-service backend

### ISS-012: 5 services still import UnifiedCloudServicesConfig (old name) — FIXED

- **Section:** S7 (Codex Drift) | **Criterion:** 7.7
- **Severity:** HIGH | **Time:** 1-2h | **Difficulty:** Low
- **Files:**
  - `features-delta-one-service/features_delta_one_service/config.py:12`
  - `features-cross-instrument-service/features_cross_instrument_service/config.py:12`
  - `features-multi-timeframe-service/features_multi_timeframe_service/config.py:12`
  - `ml-training-service/ml_training_service/config.py:11`
  - `unified-market-interface/unified_market_interface/config.py:10`
- **Fix:**
  1. In each file, change: `from unified_trading_library import UnifiedCloudServicesConfig`
  2. To: `from unified_config_interface import UnifiedCloudConfig`
  3. Update class inheritance from `UnifiedCloudServicesConfig` to `UnifiedCloudConfig`

### ISS-013: 5 Dockerfiles reference stale unified-cloud-services base image — FIXED

- **Section:** S7 (Codex Drift) | **Criterion:** 7.5, 7.6
- **Severity:** HIGH | **Time:** 30 min | **Difficulty:** Low
- **Files:**
  - `execution-service/Dockerfile:15`
  - `features-delta-one-service/Dockerfile:16`
  - `features-volatility-service/Dockerfile:10`
  - `market-data-processing-service/Dockerfile:22`
  - `ml-training-service/Dockerfile:14`
- **Fix:** Replace `unified-cloud-services/unified-cloud-services:latest` with
  `unified-trading-services/unified-trading-services:latest`

### ISS-014: 6 Dockerfiles hardcode project ID in FROM lines — FIXED

- **Section:** S7 (Codex Drift) | **Criterion:** 7.6
- **Severity:** MEDIUM | **Time:** 1h | **Difficulty:** Low
- **Files:** position-balance-monitor-service, risk-and-exposure-service, unified-cloud-interface,
  unified-events-interface, unified-market-interface, unified-trade-execution-interface Dockerfiles
- **Fix:** Add `ARG PROJECT_ID` and use `${PROJECT_ID}` in FROM lines

### ISS-015: Lifecycle events diverged between codex and code — FIXED

- **Section:** S7 (Codex Drift) | **Criterion:** 7.3
- **Severity:** HIGH | **Time:** 2h | **Difficulty:** Low
- **Files:**
  - `unified-events-interface/unified_trading_library.events/schemas.py:98-111`
  - `unified-trading-codex/03-observability/lifecycle-events.md:25-41`
- **Fix:**
  1. Synchronize `STANDARD_LIFECYCLE_EVENTS` in `schemas.py` to match codex
  2. Add missing codex events: VALIDATION_STARTED, VALIDATION_COMPLETED, DATA_INGESTION_STARTED,
     DATA_INGESTION_COMPLETED, UPLOAD_STARTED, UPLOAD_COMPLETED, DATA_BROADCAST, PERSISTENCE_STARTED,
     PERSISTENCE_COMPLETED
  3. Either add code-only events (RETRY_ATTEMPT, DATA_VALIDATED, etc.) to codex or remove from schemas.py

### ISS-016: 70+ bare "BINANCE" venue names (should be BINANCE-SPOT/FUTURES) — FIXED

- **Section:** S7 (Codex Drift) | **Criterion:** 7.2
- **Severity:** HIGH | **Time:** 8-12h | **Difficulty:** Medium-High
- **Files (key):**
  - `execution-service/execution_service/instruments/registry.py:38-44`
  - `unified-trade-execution-interface/unified_trade_execution_interface/adapters/binance_ccxt.py:36`
  - `unified-api-contracts/unified_api_contracts/venue_constants.py:65`
- **Fix:**
  1. Update `venue_constants.py` to define `BINANCE_SPOT = "BINANCE-SPOT"` and `BINANCE_FUTURES = "BINANCE-FUTURES"`
  2. Add mapping layer for NautilusTrader compatibility (which uses bare "BINANCE" internally)
  3. Replace all bare "BINANCE" references in non-NautilusTrader code

### ISS-017: Manifest dependency versions use >=1.0.0 (policy says <1.0.0) — FIXED

- **Section:** S1 (Manifest) | **Criterion:** 1.7
- **Severity:** HIGH | **Time:** 30 min | **Difficulty:** Easy
- **Description:** 118 manifest dependency specs use `>=1.0.0` or `>=2.0.0`. 8 `pyproject.toml` files also violate.
  Manifest `versions_policy` says all versions MUST be `<1.0.0`.
- **Files:** `unified-trading-pm/workspace-manifest.json` (throughout)
- **Fix:** Bulk find-replace all dependency specs to use `>=0.x.y,<1.0.0` ranges

### ISS-018: Manifest deps diverge from actual pyproject.toml (11+ repos) — FIXED

- **Section:** S2 (Tier Architecture) | **Criterion:** 2.12 (meta)
- **Severity:** MEDIUM | **Time:** 4-6h | **Difficulty:** Medium
- **Description:** Manifest `dependencies` lists are incomplete vs actual `pyproject.toml` in 11+ repos.
- **Fix:** Write a validation script to reconcile manifest deps from pyproject.toml automatically, then run it

### ISS-019: deployment-service is near-100% duplicate of deployment-v3 — FIXED (v3 archived)

- **Section:** S15 (Complexity) | **Criterion:** 15.7
- **Severity:** HIGH | **Time:** 8h | **Difficulty:** Low
- **Description:** 101 exact-duplicate file pairs between `deployment-service` and `unified-trading-deployment-v3`, plus
  18 pairs with `deployment-api`. ~44,008 wasted lines.
- **Fix:** Complete the v3 split: deployment-service should import from a shared library, not copy files

### ISS-020: os.getenv() in 5 API auth modules + execution_service — FIXED

- **Section:** S13 (Configuration) | **Criterion:** 13.1
- **Severity:** HIGH | **Time:** 2h | **Difficulty:** Easy
- **Files:**
  - `market-data-api/market_data_api/auth.py:23,27`
  - `alerting-service/alerting_service/auth.py:23,27`
  - `deployment-api/deployment_api/auth.py:23,27`
  - `client-reporting-api/client_reporting_api/auth.py:37,41`
  - `execution-results-api/execution_results_api/auth.py:23,27`
  - `execution_service/utils/gcs_service.py:54-86` (legacy file, 7 calls)
- **Fix:**
  1. Create `ApiAuthConfig(BaseSettings)` in unified-config-interface
  2. Inject config into `verify_api_key` dependency instead of using `os.getenv()`
  3. Delete legacy `execution_service/` orphan directory

### ISS-021: os.environ["KEY"] at module level (import-time crash) — FIXED

- **Section:** S13 (Configuration) | **Criterion:** 13.3
- **Severity:** HIGH | **Time:** 1.5h | **Difficulty:** Medium
- **Files:**
  - `execution-service/execution_service/api/app.py:17` — `_GCP_PROJECT_ID = os.environ["GCP_PROJECT_ID"]`
  - `unified-trading-deployment-v3/scripts/reorganize_gcs_*.py` (multiple files)
- **Fix:** Move to lazy init: `def _get_project_id() -> str: return config.gcp_project_id`

### ISS-022: Direct google.cloud imports in service code — FIXED

- **Section:** S14 (Architecture) | **Criterion:** 14.3.1
- **Severity:** MEDIUM | **Time:** 3.5h | **Difficulty:** Medium
- **Files:**
  - `features-sports-service/features_sports_service/etl/state.py:28` — `from google.cloud import storage`
  - `execution-service/execution_service/core/audit_log.py:6` — `from google.cloud import storage`
  - `unified-market-interface/unified_market_interface/adapters/onchain_perps/hyperliquid_adapter.py:29` —
    `import boto3`
- **Fix:** Replace with `get_storage_client()` from `unified-cloud-interface`

### ISS-023: setup_cloud_logging still used (should be setup_events) — FIXED

- **Section:** S12 (Observability) | **Criterion:** 12.5
- **Severity:** HIGH | **Time:** 20 min | **Difficulty:** Easy
- **Files:** `ml-training-service/ml_training_service/cli/main.py:16`
- **Fix:** Replace `from unified_trading_library import setup_cloud_logging` with
  `from unified_trading_library.events import setup_events`

### ISS-024: 3 services have zero observability (no setup_events, no lifecycle events) — FIXED

- **Section:** S12 (Observability) | **Criterion:** 12.6
- **Severity:** HIGH | **Time:** 3h | **Difficulty:** Medium
- **Services:** features-multi-timeframe-service, strategy-validation-service, features-sports-service
- **Fix:** Add `setup_events()` call and STARTED/STOPPED/FAILED lifecycle events to each service's CLI entrypoint

---

## P2 — QUALITY (Fix This Month)

### ISS-025: 34/106 canonical packages lack upper version bounds — FIXED

- **Section:** S4 (Dependencies) | **Criterion:** 4.4
- **Severity:** MEDIUM | **Time:** 2h | **Difficulty:** Low
- **Files:** `unified-trading-pm/workspace-constraints.toml`
- **Fix:** Add `<NEXT_MAJOR.0.0` to all 34 unbounded packages (e.g., `structlog>=25.5.0` → `structlog>=25.5.0,<26.0.0`)

### ISS-026: 3 repos have parallel requirements.txt files — FIXED

- **Section:** S4 (Dependencies) | **Criterion:** 4.7
- **Severity:** MEDIUM | **Time:** 30 min | **Difficulty:** Low
- **Files:** `deployment-service/requirements.txt`, `execution-service/requirements.txt`,
  `unified-trading-deployment-v3/requirements.txt`
- **Fix:** Delete all `requirements.txt` files. If CI needs flat list, generate via `uv pip compile`

### ISS-027: 9 completely unpinned dependencies — FIXED

- **Section:** S4 (Dependencies) | **Criterion:** 4.12
- **Severity:** MEDIUM | **Time:** 30 min | **Difficulty:** Low
- **Description:** `google-cloud-pubsub` in 7 repos, `pandas-gbq` in MTDS, `unified-api-contracts` in execution-service
- **Fix:** Add version ranges: `google-cloud-pubsub>=2.28.0,<3.0.0`, `pandas-gbq>=0.26.0,<1.0.0`

### ISS-028: 14 repos have coverage fail_under=40 (should be 70) — PARTIAL (4/14 at 70%, rest blocked)

- **Section:** S17 (Testing) | **Criterion:** 17.1.1
- **Severity:** MEDIUM | **Time:** 28-56h total | **Difficulty:** Medium-High
- **Repos:** deployment-service, execution-service, execution-results-api, features-delta-one-service,
  features-sports-service, features-volatility-service, market-data-processing-service, ml-training-service,
  position-balance-monitor-service, risk-and-exposure-service, unified-domain-client, unified-events-interface,
  unified-internal-contracts, unified-market-interface
- **Fix:** Raise `fail_under` incrementally: 40 → 55 → 70, adding tests as needed

### ISS-029: 141 test functions with zero assertions — FIXED (238 assertions added across 95+ files)

- **Section:** S17 (Testing) | **Criterion:** 17.1.7
- **Severity:** MEDIUM | **Time:** 4-6h | **Difficulty:** Medium
- **Worst repos:** execution-service (53), market-tick-data-service (14), strategy-service (8)
- **Fix:** Add meaningful assertions. For import tests: `assert callable(X)`. For event tests: assert event counts

### ISS-030: No repo has autouse mock_secret_client in conftest.py — FIXED

- **Section:** S17 (Testing) | **Criterion:** 17.1.9
- **Severity:** MEDIUM | **Time:** 3.5h | **Difficulty:** Low
- **Fix:** Add to each secret-using repo's `tests/conftest.py`:
  ```python
  @pytest.fixture(autouse=True)
  def mock_secret_client(monkeypatch):
      mock = MagicMock(return_value="fake-secret-value")
      monkeypatch.setattr("unified_config_interface.get_secret", mock)
      return mock
  ```

### ISS-031: execution-service integration tests have 0 @pytest.mark.integration markers — FIXED

- **Section:** S17 (Testing) | **Criterion:** 17.1.5
- **Severity:** MEDIUM | **Time:** 1-2h | **Difficulty:** Low
- **Files:** All 16 files in `execution-service/tests/integration/`
- **Fix:** Add `@pytest.mark.integration` to each test function; register marker in `pyproject.toml`

### ISS-032: 20 silent return None in except blocks — FIXED

- **Section:** S11 (Error Handling) | **Criterion:** 11.12
- **Severity:** MEDIUM | **Time:** 1h | **Difficulty:** Easy
- **Files (key):**
  - `unified-trading-library/unified_trading_library/core/aws_clients.py:134`
  - `unified-trading-library/unified_trading_library/ml/models.py:36`
  - `unified-trading-library/unified_trading_library/core/gcsfuse_helper.py:69`
- **Fix:** Add `logger.warning("...", exc_info=True)` before each `return None` in except blocks

### ISS-033: 613+ f-string logger calls — FIXED (G004 rule already enabled in all repos)

- **Section:** S12 (Observability) | **Criterion:** 12.10
- **Severity:** MEDIUM | **Time:** 6h | **Difficulty:** Medium
- **Description:** `logger.info(f"Processing {x}")` defeats lazy evaluation
- **Fix:** Convert to `logger.info("Processing %s", x)`. Can be partially automated with codemod

### ISS-034: 8 services missing --mode batch|live CLI arg — FIXED (all 8 already have --mode required)

- **Section:** S14 (Architecture) | **Criterion:** 14.1.1
- **Severity:** MEDIUM | **Time:** 4h | **Difficulty:** Medium
- **Services:** alerting-service, execution-service, features-delta-one-service, features-multi-timeframe-service,
  features-onchain-service, features-sports-service, features-volatility-service, instruments-service
- **Fix:** Add `--mode` argument with `choices=["batch", "live"]` to each parser

### ISS-035: 4 services lack GracefulShutdownHandler — FIXED

- **Section:** S11 (Error Handling) | **Criterion:** 11.4
- **Severity:** MEDIUM | **Time:** 1h | **Difficulty:** Easy
- **Services:** alerting-service, deployment-service, market-data-processing-service, risk-and-exposure-service
- **Fix:** Add `GracefulShutdownHandler()` instantiation at CLI entrypoint

### ISS-036: 6 services missing test_event_logging.py — FIXED

- **Section:** S17 (Testing) | **Criterion:** 17.1.2
- **Severity:** MEDIUM | **Time:** 2h | **Difficulty:** Low
- **Services:** deployment-service, features-cross-instrument-service, features-delta-one-service,
  features-multi-timeframe-service, features-sports-service, strategy-validation-service
- **Fix:** Copy template from `features-calendar-service/tests/unit/test_event_logging.py` and adapt

### ISS-037: No DeadLetterRecord schema exists — FIXED

- **Section:** S16 (Schema Governance) | **Criterion:** 16.4.2
- **Severity:** MEDIUM | **Time:** 2h | **Difficulty:** Medium
- **Fix:** Create `DeadLetterRecord(BaseModel)` in `unified-internal-contracts` with: `original_payload`, `error_type`,
  `error_message`, `venue`, `timestamp`, `correlation_id`, `trace_id`

### ISS-038: schema_version missing from most internal contract models — FIXED

- **Section:** S16 (Schema Governance) | **Criterion:** 16.1.4
- **Severity:** MEDIUM | **Time:** 2h | **Difficulty:** Low
- **Description:** Only 5/20+ models have `schema_version`. Missing from all market_data schemas.
- **Fix:** Add `schema_version: str = "1.0"` to CanonicalTrade, CanonicalOrderBook, CanonicalOHLCV,
  CanonicalDerivativeTicker, etc.

### ISS-039: No SchemaRegistry compatibility matrix — FIXED (schema_registry.json + validation script created)

- **Section:** S16 (Schema Governance) | **Criterion:** 16.1.5
- **Severity:** MEDIUM | **Time:** 4h | **Difficulty:** Hard
- **Fix:** Create `SchemaRegistry` class in `unified-internal-contracts` documenting version compatibility per schema

### ISS-040: Orphan directory execution_service (underscore) — FIXED

- **Section:** S1 (Manifest) | **Criterion:** 1.2
- **Severity:** LOW | **Time:** 5 min | **Difficulty:** Trivial
- **Files:** `execution_service/` (contains only `utils/gcs_service.py` and `.DS_Store`)
- **Fix:** `rm -rf execution_service/`

### ISS-041: pyrightconfig.json issues across repos — FIXED

- **Section:** S9 (Type Safety) | **Criteria:** 9.7, 9.10
- **Severity:** MEDIUM | **Time:** 1h | **Difficulty:** Low
- **Issues found:**
  - `unified-trading-deployment-v3/pyrightconfig.json`: `typeCheckingMode: "basic"` (should be `"strict"`)
  - `risk-and-exposure-service/pyrightconfig.json`: `typeCheckingMode: "basic"`
  - `unified-trading-library/pyrightconfig.json`: `reportAny: "warning"` (should be `"error"`)
  - `unified-cloud-interface/pyrightconfig.json`: `reportAny: "warning"`
  - `unified-reference-data-interface/pyrightconfig.json`: `reportAny: "warning"`
  - 12 repos missing `reportAny` entirely (defaults to off)
  - 5 repos missing `typeCheckingMode` entirely
- **Fix:** Set `typeCheckingMode: "strict"` and `reportAny: "error"` in all pyrightconfig.json files

### ISS-042: 16 repos have duplicate fixture definitions — DEFERRED (P3)

- **Section:** S17 (Testing) | **Criterion:** 17.1.8
- **Severity:** MEDIUM | **Time:** 3-4h | **Difficulty:** Medium
- **Worst:** execution-service (17 dupes), features-calendar-service (13), unified-sports-execution-interface (13)
- **Fix:** Move shared fixtures to `conftest.py` at the appropriate directory level

### ISS-043: No VCR cassette files exist on disk — DEFERRED (P3)

- **Section:** S17 (Testing) | **Criterion:** 17.1.10
- **Severity:** MEDIUM | **Time:** 3-4h | **Difficulty:** Medium
- **Description:** VCR test infrastructure exists but no recorded cassettes. Binance smoke test makes live API calls.
- **Fix:** Record VCR cassettes for all external API tests; mark live-call tests as `@pytest.mark.integration`

### ISS-044: Missing .env.example in 6 service repos — DEFERRED (P3)

- **Section:** S13 (Configuration) | **Criterion:** 13.10
- **Severity:** LOW | **Time:** 2h | **Difficulty:** Easy
- **Repos:** features-cross-instrument-service, features-delta-one-service, features-multi-timeframe-service,
  features-sports-service, strategy-service, strategy-validation-service
- **Fix:** Generate `.env.example` from each service's config class fields

---

## P3 — POLISH (Backlog)

### ISS-045: 58 files exceed 900 lines — DEFERRED (P3)

- **Section:** S15 | **Criterion:** 15.1
- **Time:** 100-120h total | **Difficulty:** High
- **Top 5 worst:**
  - `instruments-service/instruments_service/sports/league_classification.py` (1,865 lines) — extract to YAML
  - `features-sports-service/features_sports_service/tracking/team_features.py` (1,825 lines) — split by feature group
  - `execution-service/execution_service/data/loader.py` (1,486 lines) — extract mixins
  - `market-tick-data-service/market_tick_data_service/config.py` (1,494 lines) — split config models
  - `execution-service/execution_service/data/converter.py` (1,402 lines) — split by data type

### ISS-046: 169 functions exceed 200 lines (auto-FAIL) — DEFERRED (P3)

- **Section:** S15 | **Criterion:** 15.6
- **Top 5 worst:**
  - `test_order_execution` (1,606 lines) — split into per-scenario tests
  - `generate_topology_svg.build()` (809 lines, x2 copies) — extract stages
  - `run_download_day_parallel_post_warmup` (718 lines) — decompose into stages
  - `_format_human_readable_error` (713 lines) — extract sub-formatters
  - `generate_multi_leg_config` (677 lines) — split into helper functions

### ISS-047: 126 classes exceed 500 lines — DEFERRED (P3)

- **Section:** S15 | **Criterion:** 15.4
- **Top 5 worst:**
  - `UCSDataLoader` (1,461 lines) — extract into specialized loader mixins
  - `DataConverter` (1,363 lines) — split into per-data-type converters
  - `DeribitAdapter` (1,248 lines) — extract order/market-data/position mixins
  - `CandleOrchestrationService` (1,218 lines) — extract pipeline stages
  - `SportsFeatureVector` (1,187 lines) — acceptable as wide schema; consider YAML-driven codegen

### ISS-048: Sports league/team data as inline Python (3,681 lines) — DEFERRED (P3)

- **Section:** S15 | **Criterion:** 15.8
- **Files:**
  - `instruments-service/instruments_service/sports/league_classification.py` (1,865 lines)
  - `instruments-service/instruments_service/sports/team_mapping_data.py` (944 lines)
  - `instruments-service/instruments_service/sports/league_data_other.py` (872 lines)
- **Fix:** Move to `data/leagues.yaml`, `data/team_mappings.yaml`; load with helper

### ISS-049: SP500/NASDAQ ticker lists duplicated 3x — DEFERRED (P3)

- **Section:** S15 | **Criterion:** 15.7
- **Files:** `instrument_definitions.py`, `equity_definitions.py`, `ticker_lists.py`
- **Fix:** Consolidate into single `data/tickers.json`

### ISS-050: Codex checklist template uses old names — DEFERRED (P3)

- **Section:** S7 | **Criterion:** 7.9
- **Files:** `unified-trading-codex/10-audit/_checklist-template.yaml:128,141,241,...`
- **Fix:** Global replace: `unified-trading-library` → `unified-trading-services`, `UnifiedCloudServicesConfig` →
  `UnifiedCloudConfig`

### ISS-051: 3 package.json files have version 1.0.0 — DEFERRED (P3)

- **Section:** S1 | **Criterion:** 1.7
- **Files:** `live-health-monitor-ui/package.json`, `onboarding-ui/package.json`, `settlement-ui/package.json`
- **Fix:** Set `"version": "0.1.0"` in each

### ISS-052: Hardcoded fallback bucket names in standardized_service.py — DEFERRED (P3)

- **Section:** S13 | **Criterion:** 13.6
- **Files:** `unified-trading-library/unified_cloud_services/domain/standardized_service.py:129-145`
- **Fix:** Remove defaults; let `get_config()` raise on missing bucket names

### ISS-053: PII fields not tagged (only 2 fields workspace-wide) — DEFERRED (P3)

- **Section:** S10 | **Criterion:** 10.16
- **Time:** 4h | **Difficulty:** Medium
- **Fix:** Audit all Pydantic models; tag `client_id`, `wallet_address`, `api_key`, `email`, `user_id` with
  `json_schema_extra={"pii": True}`

### ISS-054: No auth/secret/config event logging — DEFERRED (P3)

- **Section:** S10 | **Criteria:** 10.17-10.19
- **Time:** 3h | **Difficulty:** Low
- **Fix:**
  1. Add `log_event("AUTH_SUCCESS/AUTH_FAILURE")` to all auth modules
  2. Add `log_event("SECRET_ACCESSED")` in `get_secret_client()` factory
  3. Verify `CONFIG_HOT_RELOADED` events are logged (already partial)

### ISS-055: Correlation ID not propagated through request chains — DEFERRED (P3)

- **Section:** S12 | **Criterion:** 12.12
- **Time:** 4h | **Difficulty:** Hard
- **Fix:** Add middleware using `contextvars` to auto-inject correlation_id from `X-Correlation-ID` header

### ISS-056: Circuit breaker schemas defined but no runtime implementation — DEFERRED (P3)

- **Section:** S11 | **Criterion:** 11.5
- **Time:** 4h | **Difficulty:** Hard
- **Fix:** Implement `CircuitBreaker` class in unified-trading-library wrapping CLOSED→OPEN→HALF_OPEN state machine

### ISS-057: No actual DLQ infrastructure (topic, consumer) — DEFERRED (P3)

- **Section:** S11 | **Criterion:** 11.7
- **Time:** 8h | **Difficulty:** Hard
- **Fix:** Create PubSub dead-letter topic; wire validation failure handling to publish to DLQ; add consumer script

### ISS-058: DatabentoClient exists in 3 identical copies — DEFERRED (P3)

- **Section:** S15 | **Criterion:** 15.7
- **Files:** `market-tick-data-service` app/ + engine/ + original copies
- **Fix:** Keep one canonical copy; have others import from it

---

## Per-Repo Scorecard

| Repo                       | S1-S4 | S7-S9 | S10  | S11-12 | S13-14 | S15  | S16-17 | Issues |
| -------------------------- | ----- | ----- | ---- | ------ | ------ | ---- | ------ | ------ |
| execution-service          | WARN  | FAIL  | FAIL | WARN   | FAIL   | FAIL | FAIL   | 15+    |
| market-tick-data-service   | WARN  | WARN  | PASS | PASS   | WARN   | FAIL | FAIL   | 8      |
| deployment-service         | FAIL  | WARN  | PASS | WARN   | WARN   | FAIL | FAIL   | 7      |
| features-sports-service    | WARN  | WARN  | FAIL | WARN   | FAIL   | FAIL | FAIL   | 9      |
| instruments-service        | PASS  | WARN  | PASS | PASS   | PASS   | FAIL | WARN   | 5      |
| unified-trading-library    | WARN  | FAIL  | PASS | FAIL   | WARN   | FAIL | WARN   | 7      |
| deployment-api             | WARN  | WARN  | FAIL | WARN   | FAIL   | WARN | WARN   | 6      |
| ml-training-service        | WARN  | WARN  | PASS | FAIL   | WARN   | WARN | FAIL   | 5      |
| features-delta-one-service | WARN  | FAIL  | PASS | PASS   | FAIL   | WARN | FAIL   | 5      |
| unified-market-interface   | FAIL  | WARN  | PASS | FAIL   | FAIL   | FAIL | WARN   | 6      |
| execution-results-api      | FAIL  | WARN  | FAIL | PASS   | WARN   | FAIL | FAIL   | 7      |
| strategy-service           | PASS  | WARN  | PASS | PASS   | WARN   | WARN | WARN   | 3      |
| features-calendar-service  | PASS  | PASS  | PASS | PASS   | PASS   | WARN | PASS   | 1      |
| unified-api-contracts      | PASS  | PASS  | PASS | PASS   | PASS   | FAIL | WARN   | 2      |
| unified-internal-contracts | PASS  | PASS  | PASS | PASS   | PASS   | PASS | FAIL   | 2      |

---

## Remediation Roadmap

### Week 1 (P0 — Critical/Security): ~25h

| ID      | Task                                          | Hours |
| ------- | --------------------------------------------- | ----- |
| ISS-001 | Fix corrupted package names (script + verify) | 4     |
| ISS-002 | Remove DISABLE_AUTH or add production guard   | 2     |
| ISS-003 | Add missing enum members                      | 0.25  |
| ISS-005 | Sanitize HTTP error responses                 | 4     |
| ISS-006 | Untrack .env files                            | 2     |
| ISS-007 | Replace hardcoded project IDs                 | 4     |
| ISS-008 | Fix SQL injection patterns                    | 1     |
| ISS-009 | Disable Swagger in production                 | 1     |
| ISS-020 | Replace os.getenv in auth modules             | 2     |
| ISS-040 | Delete orphan execution_service/ dir          | 0.1   |
| ISS-023 | Replace setup_cloud_logging                   | 0.3   |

### Week 2 (P1 — Architecture): ~35h

| ID      | Task                                              | Hours |
| ------- | ------------------------------------------------- | ----- |
| ISS-004 | Extract MTDS→instruments-service shared types     | 8     |
| ISS-010 | Resolve UCI→UEI T0 dependency                     | 3     |
| ISS-011 | Remove exec-results-api→UDC dependency            | 3     |
| ISS-012 | Migrate 5 configs to UnifiedCloudConfig           | 2     |
| ISS-013 | Update 5 Dockerfile base images                   | 0.5   |
| ISS-015 | Sync lifecycle events codex↔code                 | 2     |
| ISS-017 | Fix manifest version ranges                       | 0.5   |
| ISS-018 | Reconcile manifest deps with pyproject.toml       | 5     |
| ISS-021 | Fix module-level os.environ                       | 1.5   |
| ISS-022 | Replace direct cloud SDK imports                  | 3.5   |
| ISS-024 | Add observability to 3 zero-instrumented services | 3     |
| ISS-041 | Fix pyrightconfig.json across repos               | 1     |

### Weeks 3-4 (P2 — Quality): ~50h

Coverage, testing, error handling, dependency governance improvements

### Ongoing (P3 — Polish): ~120h

File splitting, complexity reduction, deduplication, schema governance maturation

**Total estimated remediation: ~230 hours**

---

_Generated by 15 parallel audit agents on 2026-03-02. Sections S3 (SSOT), S5-S6 (Docs/Rules), S8-S9 (Lint/Types),
S18-S21 (Cross-repo/Safety), S22-S24 (Deploy/Anti-patterns) had partial coverage due to agent rate limits — supplemented
with inline searches. Re-audit recommended for full coverage of those sections._
