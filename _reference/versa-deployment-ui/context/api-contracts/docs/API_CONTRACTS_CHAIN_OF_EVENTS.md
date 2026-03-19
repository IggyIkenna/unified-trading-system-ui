# API Contracts Chain of Events

Single reference for the end-to-end flow from configuration through schema validation to adapter output. Interfaces (UMI, UOI) and services consume unified-api-contracts for type safety and validation.
**Note:** Live API response collection, schema validation against live responses, and contract-vs-reality verification are done in the **six interfaces** that depend on AC (they hold API keys): unified-trade-execution-interface, unified-sports-execution-interface, unified-reference-data-interface, unified-position-interface, unified-market-interface, unified-cloud-interface. AC holds only schemas and static examples; scripts in AC do not require API keys for those flows.

## 1. Chain Overview

```
Config (UnifiedCloudConfig) → SDK/API call → unified-api-contracts schema validation → adapter output
```

1. **Config**: `UnifiedCloudConfig` (unified-config-interface) provides project ID, secret names, and environment. API keys resolved via `get_secret_client` (unified-trading-services).
2. **SDK/API call**: Adapters (UMI, UOI, market-tick-data-service) or scripts use SDKs (CCXT, databento, tardis-client, ib_insync) or direct HTTP to fetch data.
3. **Schema validation**: Raw responses are validated against Pydantic schemas in `unified_api_contracts/{venue}/schemas.py`.
4. **Adapter output**: Validated data is mapped to canonical types (UMI/UOI) or consumed directly by services.

## 2. Schema Validation Pipeline

Live response collection and schema validation against live APIs are performed in the **six interfaces** (unified-trade-execution-interface, unified-sports-execution-interface, unified-reference-data-interface, unified-position-interface, unified-market-interface, unified-cloud-interface). AC holds only canonical schemas and static examples.

**In AC:**

- `unified_api_contracts/` — Canonical schemas; single source of truth for UMI, UOI, and services.
- `collected_responses/` and `generated_schemas/` are gitignored; any local use is legacy; interfaces own live capture and validation.

## 3. VCR Flow

**Recording** and **replay** are both performed by the **six interfaces** (they hold API keys for recording; they run replay in their CI). **unified-api-contracts does not run VCR tests** in its own CI.

| Step | Where          | Purpose                                                                                                                                                                                                                         |
| ---- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Six interfaces | Record live HTTP requests → write cassettes; contribute to AC `mocks/` via PR; filter secrets.                                                                                                                                  |
| 2    | Six interfaces | **Replay** cassettes in interface CI: load AC schemas, read cassettes (from AC path or own repo), validate response body against schema. No API calls during replay (VCR returns the recorded response from the cassette file). |

**Why no API calls during replay:** VCR intercepts HTTP. On replay it does not call the real URL; it reads the cassette and returns the saved response. So replay is deterministic and needs no keys.

**In AC:** AC holds schemas and `mocks/` (cassettes). Replay test code lives in AC (`tests/test_vcr_replay.py`, `tests/vcr/`) for **use by interfaces** (e.g. interface runs pytest against AC tree or imports the test). AC quality gates run only unit tests (e.g. `tests/unit/`); they do **not** run VCR replay. Interfaces invoke VCR replay in their integration/CI.

**Config:** `unified_api_contracts/vcr_endpoints.py` defines `VCR_ENDPOINTS`. See [MOCKS_AND_VCR.md](MOCKS_AND_VCR.md) and [VCR_SCHEMA_ALIGNMENT.md](VCR_SCHEMA_ALIGNMENT.md).

## 4. Live Verification

Live verification and contract-vs-reality checks are run in the **six interfaces** (they hold API keys and run integration tests). In AC, `tests/test_contracts_vs_reality.py` runs example-based validation only; live checks are in the interfaces.

## 5. Version Alignment

### SCHEMA_VERSIONS.md

Tracks per-venue API/SDK versions, endpoint→schema mappings, and recommended pins. See [SCHEMA_VERSIONS.md](../SCHEMA_VERSIONS.md).

### [schema-validation] Dependencies

Install: `uv pip install -e ".[schema-validation]"`

| Package       | Version         | Purpose                                      |
| ------------- | --------------- | -------------------------------------------- |
| pydantic      | >=2.0,<3.0      | Schema validation                            |
| requests      | >=2.31.0        | Optional; interfaces use for live validation |
| databento     | >=0.32.0        | Databento API validation                     |
| tardis-client | >=1.3.7         | Tardis HTTP API validation                   |
| ccxt          | >=4.5.24,<5.0.0 | CCXT unified response validation             |
| ib_insync     | >=0.9.86        | IBKR TWS schema validation                   |

### check_sdk_version_alignment.py

Verifies interface repos (UMI, UTEI, URDI) use SDK versions that overlap with unified-api-contracts `[schema-validation]` pins.

```bash
uv run python scripts/check_sdk_version_alignment.py
```

## 6. Key Data Structures

### ENDPOINT_SCHEMA_MAP

`unified_api_contracts/endpoints.py` — `(venue, endpoint) → schema_class_name`. Used by VCR recording (scripts) and schema validation in the six interfaces.

Example: `("binance", "ticker")` → `"BinanceTicker"`.

### BASE_URLS

`unified_api_contracts/endpoints.py` — Per-venue REST base URLs (e.g. `binance` → `https://api.binance.com/api/v3`).

### venue_manifest

`unified_api_contracts/venue_manifest.py` — `VENUE_MANIFEST`: per-venue `has_rest`, `has_websocket`, `has_fix`, `config_secret_field`, `response_schema_classes`, `error_schema_classes`, `example_schema_map`. Align with [INDEX.md](INDEX.md).

## 7. Consumer Model

| Consumer                     | Uses                                                                 |
| ---------------------------- | -------------------------------------------------------------------- |
| **Interfaces** (UMI, UOI)    | unified-api-contracts schemas for validation; map to canonical types |
| **Services**                 | unified-api-contracts directly or via interfaces                     |
| **market-tick-data-service** | unified-api-contracts (Tardis, Databento schemas)                    |
| **instruments-service**      | unified-api-contracts (Databento, Tardis)                            |

Path dependency: `../unified-api-contracts` in pyproject.toml. See [README](../README.md) and [CONTRIBUTING](../CONTRIBUTING.md).
