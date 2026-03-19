# Testing

How to run tests and use VCR in unified-api-contracts.

## Running tests

- **Setup**: `bash scripts/setup.sh` or `make setup` (see [README — Development Setup](../README.md#development-setup)).
- **Quality gates** (lint, typecheck, tests): `bash scripts/quality-gates.sh` (or `--no-fix` for CI).
- **Tests only**: `uv run pytest tests/` (or `make test` if defined in Makefile).
- **Schema coverage**: `tests/test_venue_contract_coverage.py`, `tests/test_contracts_vs_reality.py`; schema validation in `tests/test_schema_validation.py`.

## VCR (record and replay)

- **Record cassettes**: Done in the **six interfaces** (unified-market-interface, unified-trade-execution-interface, unified-sports-execution-interface, unified-reference-data-interface, unified-position-interface, unified-cloud-interface); they hold API keys. AC does not run recording scripts.
- **Replay**: In AC, tests use cassettes under `unified_api_contracts/<venue>/mocks/`; CI runs replay only (no live requests). See [docs/MOCKS_AND_VCR.md](MOCKS_AND_VCR.md) for cassette layout, secret filtering, and per-venue notes.
- **VCR ↔ schema alignment**: [docs/VCR_SCHEMA_ALIGNMENT.md](VCR_SCHEMA_ALIGNMENT.md).

---

## Test Structure

```
tests/
├── test_schema_validation.py        # Pydantic schema instantiation + field validation
├── test_venue_contract_coverage.py  # All venues have required schema classes
├── test_contracts_vs_reality.py     # VCR cassettes match current schema definitions
├── conftest.py                      # VCR cassette fixtures and shared helpers
├── binance/
│   └── test_binance_schemas.py      # Binance-specific schema tests
├── deribit/
│   └── test_deribit_schemas.py      # Deribit-specific schema tests
├── coinbase/
│   └── test_coinbase_schemas.py     # Coinbase-specific schema tests
└── <venue>/
    └── test_<venue>_schemas.py      # Per-venue schema tests (same pattern)
```

---

## Coverage Target

Minimum coverage is **70%**, enforced by the quality gate. The gate fails the CI run if coverage
drops below this threshold. Run coverage locally with:

```bash
uv run pytest tests/ --cov=unified_api_contracts --cov-report=term-missing
```

---

## Key Test Suites

| File                              | What it validates                                                                |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `test_schema_validation.py`       | Every schema class can be instantiated with valid data; required fields enforced |
| `test_venue_contract_coverage.py` | Every registered venue has `OrderBookSchema`, `TradeSchema`, `OHLCVSchema`, etc. |
| `test_contracts_vs_reality.py`    | VCR cassette response fields map onto the schema without `ValidationError`       |
| `<venue>/test_<venue>_schemas.py` | Venue-specific edge cases: nullable fields, optional decimals, timestamp formats |

---

## Cassette Directory

VCR cassettes live under:

```
unified_api_contracts/<venue>/mocks/
```

File naming convention: `<venue>_<endpoint>_<response_variant>.yaml`

Examples:

- `unified_api_contracts/binance/mocks/binance_orderbook_snapshot.yaml`
- `unified_api_contracts/deribit/mocks/deribit_trades_list.yaml`

Cassettes are committed to the repo. They are recorded once in the interface repos (where API keys
live) and copied here after secret-filtering. Never commit cassettes that contain raw API keys or
tokens — the recording pipeline in the interface repos strips secrets before copying.

---

## Adding Tests for a New Venue

1. **Add schema class** — create `unified_api_contracts/<venue>/schemas.py` with at minimum
   `OrderBookSchema`, `TradeSchema`, and `OHLCVSchema` as Pydantic models.
2. **Register in coverage test** — add the venue name to the venue list in
   `tests/test_venue_contract_coverage.py` so the coverage check includes it.
3. **Write VCR cassette** — record the cassette in the appropriate interface repo (where the API
   key lives), strip secrets, then copy the `.yaml` file to
   `unified_api_contracts/<venue>/mocks/`.
4. **Write schema test** — create `tests/<venue>/test_<venue>_schemas.py`; use the cassette
   fixture from `conftest.py` and assert that `<VenueSchema>(**cassette_data)` passes without
   error.
5. **Run quality gates** — `bash scripts/quality-gates.sh` must pass: ruff → basedpyright →
   pytest + coverage ≥ 70%.

---

## Quality Gate

`bash scripts/quality-gates.sh` runs the full suite in order:

1. **ruff** — lint and auto-format check
2. **basedpyright** — strict type checking (reportAny, reportUnknownMemberType = error)
3. **pytest + coverage** — all tests; fails if coverage < 70%

In CI the flag `--no-fix` is passed so ruff does not modify files; failures are reported as errors
rather than auto-corrected.

---

## References

- [README — Self-test: schemas and coverage](../README.md#self-test-schemas-and-coverage)
- [docs/API_CONTRACTS_CHAIN_OF_EVENTS.md](API_CONTRACTS_CHAIN_OF_EVENTS.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
