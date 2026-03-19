# unified-api-contracts Chain

## TL;DR

- **unified-api-contracts** is the SSOT for external API schemas (Binance, Tardis, Databento, CCXT, The Graph, Alchemy,
  GCP/AWS SDKs).
- **unified-api-contracts version** = mappings + schemas + endpoints; bumping version versions the entire contract
  surface.
- **SCHEMA_VERSIONS.md** tracks schema–version alignment, SDK pins, and endpoint→schema mappings.
- **Interfaces** (UMI, UTEI, URDI) that depend on unified-api-contracts must run `check_sdk_version_alignment` in
  quality gates.
- **Chain:** config → SDK → raw schema validation → UAC normalizer → canonical schema → adapter returns canonical only.
- **Normalization is mandatory** — adapters must not return raw venue responses to services.

---

## unified-api-contracts Version = Mappings + Schemas + Endpoints

The unified-api-contracts package version (pyproject.toml) is the single source of truth for:

- **Endpoint-to-schema mappings** — `unified_api_contracts/endpoints.py` ENDPOINT_SCHEMA_MAP
- **Base URLs** — `unified_api_contracts/endpoints.py` BASE_URLS
- **All Pydantic schemas** — `unified_api_contracts/*/schemas.py`
- **Venue manifest** — `unified_api_contracts/venue_manifest.py`

When you bump `version` in pyproject.toml, you are versioning the entire contract surface. Consumers (UMI, UOI,
services) depend on a specific unified-api-contracts version for type safety and validation.

---

## SCHEMA_VERSIONS.md

**Location:** `unified-api-contracts/SCHEMA_VERSIONS.md`

Tracks:

- Per-venue schema–version alignment (Binance, OKX, Bybit, Databento, Tardis, CCXT, IBKR, Alchemy, The Graph, Flashbots,
  GCP/AWS)
- Pinned [schema-validation] dependencies (databento, tardis-client, ccxt, ib_insync)
- Endpoint → schema mapping tables
- Version pins for consumer repos (UMI, market-tick-data-service, UTEI, URDI)
- Schema gaps and recommended pins

---

## check_sdk_version_alignment

**Location:** `unified-api-contracts/scripts/check_sdk_version_alignment.py`

**Purpose:** Ensure interface SDK versions overlap with unified-api-contracts [schema-validation] pins; fail if
misaligned.

**Behavior:**

1. Parses unified-api-contracts `pyproject.toml` [schema-validation] for pinned SDK versions.
2. For each consumer (UMI, UTEI, URDI, market-tick-data-service, etc.), reads their pyproject.toml.
3. FAILs (exit 1) if:
   - Interface uses unified-api-contracts but version range does not include unified-api-contracts version
   - Interface uses SDK version X and unified-api-contracts has no schemas for that SDK
   - Version ranges don't overlap (databento, ccxt, ib_insync, tardis-client)

**Usage:**

```bash
# From unified-api-contracts root (default: check all INTERFACES)
python scripts/check_sdk_version_alignment.py

# From interface repo (self-check)
python ../unified-api-contracts/scripts/check_sdk_version_alignment.py --interface-path .
```

**Quality gates integration:** Interfaces that depend on unified-api-contracts must run this script when
[schema-validation] deps are installed. See `unified-api-contracts/scripts/quality-gates.sh` for the pattern.

---

## schema-validation Optional Dependencies

Install with: `uv pip install -e ".[schema-validation]"`

| Package       | Version         | Purpose                                     |
| ------------- | --------------- | ------------------------------------------- |
| pydantic      | >=2.0,<3.0      | Schema validation (core dep)                |
| requests      | >=2.31.0        | collect_responses.py HTTP calls             |
| databento     | >=0.32.0        | Schema validation vs Databento API          |
| tardis-client | >=1.3.7         | Schema validation vs Tardis HTTP API v1     |
| ccxt          | >=4.5.24,<5.0.0 | Schema validation vs CCXT unified responses |
| ib_insync     | >=0.9.86        | Schema validation vs IBKR TWS (UTEI)        |

**SDK pins are for schema-validation only.** Interfaces may use different SDK versions but must produce data that
validates against unified-api-contracts schemas.

---

## unified-api-contracts Chain: config → SDK → validation → normalizer → adapter

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Config (UnifiedCloudConfig)                                              │
│    - API keys, base URLs, venue configs                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. SDK / HTTP Client (databento, tardis-client, ccxt, requests, etc.)        │
│    - Fetches raw responses from external APIs                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Validation (unified-api-contracts raw schemas)                            │
│    - Parses response → Pydantic model; validates schema                      │
│    - Fail fast if response shape does not match schema                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. UAC Normalizer (unified_api_contracts.canonical.normalize)                   │
│    - Converts validated raw schema → canonical type (CanonicalTrade, etc.)   │
│    - Mandatory: never pass raw through to adapter output                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. Adapter (UMI / UTEI / URDI venue adapter)                                │
│    - Returns canonical schema only; never raw venue responses                 │
│    - Output: canonical schema used by services                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Rules:** Never skip validation. Never return raw venue responses. Adapters must use UAC normalizers and return
canonical types only.

---

## Interface Integration Test Pattern

Interfaces that use unified-api-contracts should:

1. **Unit tests:** Mock unified-api-contracts schemas; validate adapter output shape.
2. **Integration tests:** Use VCR fixtures (recorded responses) or `collected_responses/`; validate against
   unified-api-contracts schemas.
3. **Schema validation tests:** When [schema-validation] installed, run `check_sdk_version_alignment` in quality gates.

**Example (market-tick-data-service):**

```python
# tests/integration/test_tardis_adapter.py
from unified_api_contracts.tardis.schemas import TardisTrade

def test_tardis_trade_validates():
    raw = load_fixture("tardis_trade.json")
    parsed = TardisTrade.model_validate(raw)
    assert parsed.exchange == "binance"
```

---

## Consumer Version Requirements

| Consumer                          | unified-api-contracts Dep | SDK Deps (if any)              | check_sdk_version_alignment |
| --------------------------------- | ------------------------- | ------------------------------ | --------------------------- |
| unified-market-interface          | >=1.1.0                   | databento, tardis-client, ccxt | Required                    |
| unified-trade-execution-interface | >=1.0.0,<2.0.0            | ccxt, ib_insync                | Required                    |
| unified-reference-data-interface  | >=0.1.0                   | ccxt                           | Required                    |
| unified-cloud-interface           | >=1.0.0,<2.0.0            | —                              | Optional                    |
| unified-trading-services          | >=1.1.0                   | —                              | Optional                    |
| market-tick-data-service          | >=1.0.0,<2.0.0            | databento, tardis-client       | Required                    |
| instruments-service               | >=1.0.0,<2.0.0            | ccxt                           | Required                    |
| execution-service                 | (path)                    | —                              | Optional                    |
| pnl-attribution-service           | >=1.0.0,<2.0.0            | —                              | Optional                    |
| ml-inference-service              | >=1.0.0,<2.0.0            | —                              | Optional                    |
| ml-training-service               | >=1.0.0,<2.0.0            | —                              | Optional                    |
| features-volatility-service       | >=1.0.0,<2.0.0            | —                              | Optional                    |
| features-onchain-service          | >=1.0.0,<2.0.0            | —                              | Optional                    |
| position-balance-monitor-service  | >=1.0.0,<2.0.0            | —                              | Optional                    |
| features-calendar-service         | >=1.0.0,<2.0.0            | —                              | Optional                    |
| features-delta-one-service        | >=1.0.0,<2.0.0            | —                              | Optional                    |
| risk-and-exposure-service         | >=1.0.0,<2.0.0            | —                              | Optional                    |
| strategy-service                  | (path)                    | —                              | Optional                    |
| alerting-service                  | >=1.0.0,<2.0.0            | —                              | Optional                    |
| market-data-processing-service    | >=1.0.0,<2.0.0            | —                              | Optional                    |

---

## unified-api-contracts Consumers

See `05-infrastructure/unified-libraries/archive/LIBRARY-DEPENDENCY-MATRIX.md` for the archived full list. Key
consumers:

- **unified-market-interface** — market data adapters (Tardis, Databento, Binance, CCXT)
- **unified-trade-execution-interface** — order execution (Binance, OKX, Bybit, IBKR)
- **unified-reference-data-interface** — instruments, CCXT
- **unified-cloud-interface** — GCP/AWS SDK schemas
- **unified-trading-services** — re-exports, cloud primitives
- **market-tick-data-service** — tick ingestion
- **instruments-service** — instrument metadata
- **execution-service** — order execution
- **pnl-attribution-service**, **ml-\*-service**, **features-\*-service**, **position-balance-monitor-service**,
  **risk-and-exposure-service**, **strategy-service**, **alerting-service**, **market-data-processing-service**

---

## References

- **Schema governance:** `02-data/schema-governance.md`
- **Dependency matrix:** `05-infrastructure/unified-libraries/LIBRARY-DEPENDENCY-MATRIX.md`
- **Coding standards:** `06-coding-standards/README.md` (unified-api-contracts chain, no dict[str, Any])
- **SCHEMA_VERSIONS.md:** `unified-api-contracts/SCHEMA_VERSIONS.md`
