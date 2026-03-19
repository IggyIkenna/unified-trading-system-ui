# Testing Requirements — SSOT

**Purpose:** Canonical requirements for unit tests, integration tests, UI integration tests, coverage consolidation, and
library-dep coverage across the unified trading system.

**SSOT:** `unified-trading-pm/docs/testing/testing-requirements.md`

**Cross-refs:**

- Integration testing layers: `unified-trading-codex/06-coding-standards/integration-testing-layers.md`
- Test quality standards: `.cursor/rules/testing/test-quality-standards.mdc`
- Quality gates: `unified-trading-pm/scripts/quality-gates-base/base-service.sh`, `base-library.sh`, `base-ui.sh`
- Audit prompt: `unified-trading-pm/plans/audit/trading_system_audit_prompt.md` §10

---

## 1. Unit Tests

- All Python repos: `tests/unit/` with `pytest`, `@pytest.mark.unit`
- Coverage floor: `MIN_COVERAGE` in `scripts/quality-gates.sh` (calibrated per repo)
- No `test_*_extended.py` or `test_*_additional.py` — expand existing test files per module
- Required files: `tests/unit/test_event_logging.py`, `tests/unit/test_config.py` (services)

---

## 2. Integration Tests (Python Services/Libraries)

### 2.1 Presence

- All T3+ repos (services, APIs) must have `tests/integration/` with at least one integration test
- Integration tests use real or contract-faked library behavior — not mocks for library deps

### 2.2 Library-Dep Coverage (Enforced by Quality Gates)

**Requirement:** Every service and library must have integration tests that **import and exercise** each direct library
dependency from `workspace-manifest.json`.

- For each manifest `dependencies[]` entry with `type=library`, at least one file in `tests/integration/` must `import`
  or `from` that library and exercise it
- Check: `unified-trading-pm/scripts/validation/check-integration-dep-coverage.py`
- Bypass: document in `QUALITY_GATE_BYPASS_AUDIT.md` §1.1 for legitimate exclusions (e.g. deprecated deps)

**Pattern:**

```python
# tests/integration/test_unified_trading_library_integration.py
from unified_trading_library import GracefulShutdownHandler  # or other symbols
def test_library_import_and_usage():
    handler = GracefulShutdownHandler()
    assert handler is not None
```

### 2.3 Layer 1.5 Per Dep Boundary

- At least one integration test per private dependency boundary
- Uses emulators/mocks for cloud (PubSub, GCS, etc.) when `CLOUD_MOCK_MODE=true`

---

## 3. UI Integration Tests

### 3.1 Template and Rollout

- **Template:** `unified-trading-pm/scripts/quality-gates-base/ui-integration-test.template.ts`
- **Mapping:** `unified-trading-pm/scripts/propagation/ui-api-mapping.json` — maps each UI to API base URL and endpoints
- **Rollout:** `python3 unified-trading-pm/scripts/propagation/rollout-quality-gates-unified.py` propagates to all 12 UI
  repos

### 3.2 Requirements

- Every UI repo with a backing API must have `tests/integration/api.integration.test.ts`
- Tests perform real HTTP calls to the API (e.g. `GET /health`, `GET /services`)
- When API is unreachable, tests skip (no hard failure)
- `package.json` must have `test:integration` script
- Vitest `include` must cover `tests/integration/**/*.integration.test.{ts,tsx}`

### 3.3 Run

```bash
INTEGRATION_TEST_API_URL=http://localhost:8004 npm run test:integration
```

---

## 4. Coverage Consolidation (No Redundant Coverage-Boost Files)

### 4.1 Rule

- **No** `test_coverage_boost_*.py`, `test_*_coverage.py`, or `test_boost_*.py` as standalone files
- Merge coverage-boost test cases into the primary test file for the module they exercise
- Target: `test_<module>.py` (e.g. `test_config.py`, `test_orchestrator.py`)

### 4.2 Process

1. Run `bash scripts/quality-gates.sh` to capture baseline coverage
2. For each coverage-boost file: identify which module it exercises; move test cases into the primary test file
3. Delete the coverage-boost file
4. Re-run quality gates; assert coverage unchanged or improved

### 4.3 Repos with Known Coverage-Boost Files (to consolidate)

| Repo                             | Coverage-boost files                                                                                 | Target (merge into) |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------- |
| instruments-service              | Confirmed clean on live-defi-rollout. fix/coverage-boost-70pct has 11 files — merge when integrated. | —                   |
| market-data-processing-service   | (merged)                                                                                             | —                   |
| features-multi-timeframe-service | (merged)                                                                                             | —                   |
| features-onchain-service         | (merged)                                                                                             | —                   |
| features-calendar-service        | (merged)                                                                                             | —                   |
| unified-trading-library          | (merged)                                                                                             | —                   |

---

## 5. PM Integration Test Script

- **Script:** `unified-trading-pm/scripts/pm-integration-test.sh`
- **Purpose:** Verify setup scripts and quality gates work for all 66+ repos
- **Usage:** `bash scripts/pm-integration-test.sh [--repo NAME] [--skip-setup]`
- **Steps:** For each repo: verify `scripts/quality-gates.sh`, run `scripts/setup.sh` (optional), run
  `scripts/quality-gates.sh --lint`

---

## 6. Quality Gate Enforcement

- **base-service.sh:** Integration dep coverage check (calls `check-integration-dep-coverage.py`)
- **base-library.sh:** Same check for libraries with `tests/integration/`
- **base-ui.sh:** Integration tests run via vitest `include`; `npm test` runs them
