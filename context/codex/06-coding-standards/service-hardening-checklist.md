# Service Hardening Checklist — D1→D5 Validation

**Owner:** Phase 3 — Service Hardening & Integration **SSOT:**
`unified-trading-pm/plans/active/phase3_service_hardening_integration.md` **Invariant:** Never advance a tier until
all items for the previous tier are green.

---

## Per-Service Progression: D1→D5

Each service follows this strict progression. Do NOT skip or reorder steps.

| Gate | Command                                  | What It Catches                                               |
| ---- | ---------------------------------------- | ------------------------------------------------------------- |
| D1   | `bash scripts/quickmerge.sh --lint-only` | ruff formatting, import ordering, syntax errors               |
| D2   | `bash scripts/quickmerge.sh --unit-only` | import errors, type errors (basedpyright), unit test failures |
| D3   | `bash scripts/quickmerge.sh --qg-only`   | integration test failures, coverage gaps, QG violations       |
| D4   | `bash scripts/quickmerge.sh --quick`     | full QG + git ops; skips act simulation                       |
| D5   | `bash scripts/quickmerge.sh`             | full pipeline with act simulation — **TIER GREEN GATE**       |

D5 is the only gate that counts for tier promotion. `--quick` alone is not sufficient.

---

## D1 — Ruff Clean, No Bare Except, No print()

Run per service: `ruff check <src_dir>/`

### Checklist

- [ ] `ruff check <src_dir>/` exits 0 with no violations
- [ ] No `except:` (bare except) in production code — replace with `except <SpecificError> as e:` + log + reraise
- [ ] No `except Exception:` without reraise or typed error raise (silent swallows forbidden)
- [ ] No `print(...)` in production source files — replace with `logger.debug(...)` or `logger.info(...)`
- [ ] No `os.getenv()` or `os.environ[KEY]` — replace with `UnifiedCloudConfig().<attr>` or `ConfigurationError`
- [ ] No legacy typing imports: `Dict`, `List`, `Optional`, `Tuple` from `typing` — use built-in `dict`, `list`,
      `X | None`, `tuple`
- [ ] No `except ImportError` fallback imports — fail loud; no silent `pass` or `= None` fallbacks
- [ ] No `datetime.now()` or `datetime.utcnow()` without `tz=` — use `datetime.now(tz=timezone.utc)`

### Automated Scan Commands

```bash
# A: os.getenv violations
rg "os\.getenv|os\.environ\[" src/ --type py --glob '!tests/**'

# B: bare except
rg "except:\s*$|except Exception:\s*$" src/ --type py --glob '!tests/**'

# C: print() in production code
rg "^\s*print\(" src/ --type py --glob '!tests/**'

# D: naive datetime
rg "datetime\.now\(\)|datetime\.utcnow\(\)" src/ --type py | grep -v "timezone\|tzinfo\|tz="

# E: legacy typing imports
rg "from typing import (Dict|List|Optional|Tuple)" src/ --type py

# F: except ImportError fallbacks
rg -A3 "except ImportError" src/ --type py | grep -B1 "pass|= None|= False"
```

---

## D2 — basedpyright Strict (or Baseline Frozen)

Run per service: `run_timeout 120 basedpyright <src_dir>/`

### Checklist

- [ ] `basedpyright <src_dir>/` exits 0, OR `.basedpyright-baseline.json` is present and suppresses only pre-existing
      errors
- [ ] `pyrightconfig.json` sets `typeCheckingMode: "strict"`
- [ ] `pyproject.toml` has `[tool.basedpyright]` section with `reportAny = "error"` and `reportUnknown* = "error"`
- [ ] No new `# type: ignore` added to hide architectural violations — fix root cause instead
- [ ] No `Any` types in public API signatures — use specific types or `TypeVar`

### Baseline Procedure (if type errors exist)

```bash
# Generate baseline to suppress existing errors without hiding new ones
basedpyright <src_dir>/ --outputjson | python3 - <<'EOF'
import json, sys
data = json.load(sys.stdin)
baseline = {"version": "1.1", "files": {}}
for diag in data.get("generalDiagnostics", []):
    path = diag["file"]
    baseline["files"].setdefault(path, []).append({
        "code": diag["rule"],
        "message": diag["message"][:80]
    })
print(json.dumps(baseline, indent=2))
EOF > .basedpyright-baseline.json
```

---

## D3 — Unit Tests Passing, Coverage >= Threshold

Run per service: `pytest tests/unit/ -v --timeout=30`

### Checklist

- [ ] All unit tests pass (`pytest tests/unit/ -v`)
- [ ] Coverage meets or exceeds the threshold set in `pyproject.toml` `[tool.coverage.report]`
- [ ] `tests/unit/test_schema_robustness.py` exists (Layer 1 — Schema Robustness):
  - Required field missing → `ValidationError`
  - Optional field absent → passes
  - Wrong type → fails
- [ ] No `pytest.skip()` without documented reason in `skipif` condition
- [ ] Integration tests (Layer 1.5) in `tests/integration/` pass: `pytest tests/integration/ -v --timeout=30`
  - Test naming: `test_<component>_integration.py`
  - No live external calls — all external deps mocked
  - No live cloud resources

### Coverage Threshold

Coverage thresholds are set per-repo in `pyproject.toml`:

```toml
[tool.coverage.report]
fail_under = 80  # minimum, adjust per-repo
```

---

## D4 — /health + /readiness Endpoints Present

Applies to all service repos with a running HTTP server (T4 services, T5 APIs).

### Checklist

- [ ] `GET /health` endpoint returns `{"status": "healthy"}` with HTTP 200
- [ ] `GET /readiness` endpoint checks downstream deps (DB, PubSub, GCS) and returns HTTP 200 or 503
- [ ] Both endpoints present in the service's main FastAPI app
- [ ] Health probes wired in `deployment-service/configs/checklist.<service>.yaml`
- [ ] Cloud Run liveness/readiness probes configured in Terraform or `cloudbuild.yaml`

### Standard Implementation

```python
@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}

@app.get("/readiness")
async def readiness() -> dict[str, str]:
    # Check critical downstream deps
    try:
        await check_pubsub_connection()
        return {"status": "ready"}
    except Exception as e:
        logger.error("Readiness check failed: %s", e)
        raise HTTPException(status_code=503, detail="not ready") from e
```

---

## D5 — Integration Tests Passing, QG Green (TIER GATE)

D5 is the final gate. Full quickmerge with act simulation must pass.

### Checklist

- [ ] `bash scripts/quickmerge.sh` (no flags) exits 0
- [ ] `bash scripts/quality-gates.sh` exits 0:
  - ruff clean
  - basedpyright clean (or baseline frozen)
  - all tests pass
  - coverage above threshold
  - import smoke test passes: `python -c 'import <package_name>'` exits 0
  - no QG bypass audit violations
  - file size check: no source files > 900 lines (excluding venv/archive)
- [ ] act simulation passes (Cloud Build simulation)
- [ ] No `ARCHITECTURAL_VIOLATION` suppressions remaining
- [ ] No `# type: ignore` to hide arch violations
- [ ] Repo is committed to staging branch, not just local

---

## QG Structure Verification (per repo)

Every repo must have:

| File                                              | Required             | Notes                                   |
| ------------------------------------------------- | -------------------- | --------------------------------------- |
| `scripts/quality-gates.sh`                        | Yes                  | Copy from canonical template if missing |
| `.github/workflows/version-bump.yml`              | Yes                  | Triggers version cascade                |
| `.github/workflows/update-dependency-version.yml` | Yes                  | Receives dep update dispatches          |
| `.github/workflows/quality-gates.yml`             | Yes                  | CI QG on PR                             |
| `pyproject.toml` with `[tool.ruff]`               | Yes                  | Line length 100-120, target py313       |
| `pyproject.toml` with `[tool.basedpyright]`       | Yes                  | reportAny + reportUnknown\* = error     |
| `.basedpyright-baseline.json`                     | If type errors exist | Suppresses pre-existing only            |
| `pyrightconfig.json`                              | Yes                  | strict mode, py313                      |

---

## Tier Promotion Criteria

| Tier | Repos                                                                                                                                                                                                                   | Gate                      |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| T0   | unified-api-contracts, unified-internal-contracts, unified-events-interface, execution-algo-library, matching-engine-library                                                                                            | All D5 before any T1      |
| T1   | unified-trading-library (UTS), unified-config-interface (UCI)                                                                                                                                                           | All D5 before any T2      |
| T2   | unified-market-interface, unified-trade-execution-interface, unified-ml-interface, unified-feature-calculator-library, unified-position-interface, unified-defi-execution-interface, unified-sports-execution-interface | All D5 before any T3      |
| T3   | unified-domain-client (UDC)                                                                                                                                                                                             | D5 before any T4          |
| T4   | 19 services (instruments-service → monitoring pipeline)                                                                                                                                                                 | All D5 before T5          |
| T5   | execution-results-api, market-data-api, client-reporting-api                                                                                                                                                            | All D5 before T6          |
| T6   | 11 UIs                                                                                                                                                                                                                  | All D5 = Phase 3 complete |

---

## Cross-references

- Phase 2 plan: `unified-trading-pm/plans/active/phase2_library_tier_hardening.md`
- Phase 3 plan: `unified-trading-pm/plans/active/phase3_service_hardening_integration.md`
- Quality gates template: `unified-trading-codex/06-coding-standards/quality-gates-service-template.sh`
- Integration testing layers: `unified-trading-codex/06-coding-standards/integration-testing-layers.md`
- Error handling standards: `unified-trading-codex/06-coding-standards/error-handling.md`
