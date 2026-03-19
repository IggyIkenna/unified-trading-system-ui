# Testing

How to run tests and quality gates for `unified-internal-contracts`.

## Setup

Install the dev extras into a local venv with `uv`:

```bash
uv venv .venv
source .venv/bin/activate
uv pip install -e ".[dev]"
```

The workspace venv (`.venv-workspace`) at the repo root may also be used — it already
contains all dev dependencies. Verify with `which python` before running tests.

## Running Tests

**All tests (unit only — no integration tests in UIC):**

```bash
uv run pytest tests/unit/ -v
```

**With coverage (must meet the 70% minimum gate):**

```bash
uv run pytest tests/unit/ \
    --cov=unified_internal_contracts \
    --cov-report=term-missing \
    --cov-report=xml:coverage.xml \
    --cov-fail-under=70
```

**Parallel execution (faster on multi-core machines):**

```bash
uv run pytest tests/unit/ -n 2 --timeout=60 -v --tb=short
```

## Full Quality Gates

Run all lint, type-check, and test gates in one command:

```bash
bash scripts/quality-gates.sh
```

CI mode (no auto-fix, exit non-zero on any failure):

```bash
bash scripts/quality-gates.sh --no-fix
```

Lint only (no tests):

```bash
bash scripts/quality-gates.sh --lint
```

Type check is run with `basedpyright` against `unified_internal_contracts/`. It must
pass with `reportAny = "error"` and all `reportUnknown*` settings enabled.

## What the Tests Cover

- `tests/unit/test_schemas.py` — round-trip construction and field assertions for:
  - `MessagingScope` and `MessagingTopic` enum values
  - `InferenceRequest` field defaults and round-trip
  - `PreTradeCheckRequest` / `PreTradeCheckResponse` construction
  - `EnhancedError` with `ErrorContext`, `ErrorCategory`, `ErrorSeverity`
- `tests/test_uic_internal_consistency.py` — verifies that UIC public API exports are
  all importable and internally consistent.

## No Integration Tests

UIC is a pure schema library with no cloud or network calls. All tests are unit tests
(no `@pytest.mark.integration` markers). The `tests/` directory does not require any
credentials, environment variables, or running services.

## Schema Registry Validation

The `schema_registry.json` at the repo root is validated separately:

```bash
python scripts/validate_schema_registry.py
```

This checks that every model listed in the registry is importable and carries a matching
`schema_version` field. Run this whenever a new schema is added or an existing version
is bumped.
