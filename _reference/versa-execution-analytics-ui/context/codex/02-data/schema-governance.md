# Schema Governance

## TL;DR

- **Two distinct schema types — treat differently:**
  - `SchemaDefinition` / `ColumnSchema` (parquet enforcement infrastructure, from `unified-trading-library`) → stays in
    the **service** at `schemas/output_schemas.py`. These are write-time enforcement descriptors, not data contracts.
  - **Pydantic `BaseModel` / `TypedDict` / `@dataclass` domain contracts** (the actual field names + types for a
    service's primary output) → belong in **`unified-internal-contracts`** under `domain/<service-name>/`. Services
    import them from UIC via `unified-trading-library` or `unified-domain-client`.
- **Pre-upload validation** is mandatory: `validate_timestamp_date_alignment()` runs on every Parquet file before GCS
  upload.
- **NaN handling**: non-nullable columns are checked; rows/files with NaN in required columns are rejected (fail-soft:
  log and skip).
- **Schema evolution**: adding columns is safe (backward compatible); removing/renaming columns requires coordinated
  migration.
- **Parquet** is the canonical storage format for all batch data. BigQuery is for analytics and live streaming only.
- Dimension-aware nullability: some columns are required for certain categories/instrument types but optional for
  others.
- Schema version is tracked in the `SchemaDefinition` metadata.

---

## Schema Definition Pattern

> **Scope:** `SchemaDefinition` / `ColumnSchema` are **parquet write enforcement descriptors** — infrastructure, not
> data contracts. They tell `unified-trading-library` how to validate a GCS/Parquet write. They stay in the service at
> `schemas/output_schemas.py` and are **not shared cross-service**.
>
> **Domain data contracts** (Pydantic `BaseModel`, `TypedDict`, `@dataclass`) are the actual data shapes. They must live
> in `unified-internal-contracts/unified_internal_contracts/domain/<service-name>/` and be imported from there.

`SchemaDefinition` / `ColumnSchema` for a service's GCS writes live in `schemas/output_schemas.py`:

```python
from unified_trading_services.domain import SchemaDefinition, ColumnSchema

INSTRUCTIONS_SCHEMA = SchemaDefinition(
    name="instructions",
    version="1.0",
    description="Trading instructions/signals from strategy",
    dimension_keys=["output_type", "category"],
    columns=[
        ColumnSchema(
            name="timestamp",
            dtype="datetime64[ns]",
            nullable=False,
            description="Signal timestamp"
        ),
        ColumnSchema(
            name="strategy_id",
            dtype="string",
            nullable=False,
            description="Strategy identifier"
        ),
        ColumnSchema(
            name="limit_price",
            dtype="float64",
            nullable=True,
            description="Limit price if applicable"
        ),
    ]
)
```

### SchemaDefinition Fields

| Field            | Type               | Description                                          |
| ---------------- | ------------------ | ---------------------------------------------------- |
| `name`           | string             | Schema identifier (e.g., "instructions", "features") |
| `version`        | string             | Semantic version (e.g., "1.0")                       |
| `description`    | string             | Human-readable description                           |
| `dimension_keys` | list[str]          | Dimensions that affect nullability rules             |
| `columns`        | list[ColumnSchema] | Column definitions                                   |

### ColumnSchema Fields

| Field         | Type   | Description                                                        |
| ------------- | ------ | ------------------------------------------------------------------ |
| `name`        | string | Column name                                                        |
| `dtype`       | string | Pandas dtype (e.g., "datetime64[ns]", "float64", "string", "bool") |
| `nullable`    | bool   | Whether NaN/None is allowed                                        |
| `description` | string | Human-readable description                                         |

---

## Pre-Upload Validation

### validate_timestamp_date_alignment()

This is the primary validation function, called before every GCS upload:

```python
from unified_trading_services.domain import validate_timestamp_date_alignment

result = validate_timestamp_date_alignment(
    df,                         # DataFrame to validate
    expected_date=date,         # Expected date for this partition
    timestamp_col="auto",       # Auto-detect timestamp column
    alignment_threshold=100.0,  # % of rows that must match date
)

if not result.valid:
    logger.error(f"TIMESTAMP_DATE_MISMATCH: {result}")
    # Skip upload -- do NOT upload invalid data
```

### What It Checks

| Check                       | Description                                   | Failure Action |
| --------------------------- | --------------------------------------------- | -------------- |
| **Timestamp column exists** | At least one datetime column found            | Raise error    |
| **Date alignment**          | Timestamps match expected partition date      | Skip upload    |
| **Threshold**               | % of aligned rows >= threshold (default 100%) | Skip upload    |
| **Timezone**                | Timestamps are UTC (or naive treated as UTC)  | Warning        |

### Integration Point

Validation is integrated into the GCS write path of `StandardizedDomainCloudService`:

```python
# Inside StandardizedDomainCloudService.upload_dataframe()
1. Validate schema (column names and types)
2. Validate nullability (non-nullable columns have no NaN)
3. Validate timestamp-date alignment
4. Upload to GCS (only if all validations pass)
```

---

## NaN Handling

### Rules

1. **Non-nullable columns**: any NaN/None value triggers validation failure. The file is skipped (not uploaded).
2. **Nullable columns**: NaN is allowed and expected (e.g., `limit_price` is null for market orders).
3. **Feature columns**: validated separately by `validate_feature_columns_not_null()` for per-column reporting.

### Per-Column NaN Reporting

```python
from features_delta_one_service.schemas.output_schemas import validate_feature_columns_not_null

is_valid, nan_columns = validate_feature_columns_not_null(
    df,
    feature_columns=["sma_20", "rsi_14", "macd_signal"],
    context="momentum features for BTC 2024-01-15"
)

if not is_valid:
    logger.error(f"NaN in feature columns: {nan_columns}")
```

### Dimension-Aware Nullability

Some columns are conditionally required based on category or instrument type:

```python
# funding_rate is required for CEFI perpetuals, nullable for TRADFI
ColumnSchema(
    name="funding_rate",
    dtype="float64",
    nullable=True,  # Base nullability
    description="Funding rate (CEFI perpetuals only)",
    # Dimension override: required when category=CEFI and instrument_type=PERPETUAL
)
```

---

## Schema Evolution

### Safe Changes (Backward Compatible)

| Change                          | Impact            | Migration                             |
| ------------------------------- | ----------------- | ------------------------------------- |
| **Add nullable column**         | None              | Downstream ignores unknown columns    |
| **Add non-nullable column**     | None for new data | Backfill required for historical data |
| **Widen type** (int32 -> int64) | None              | Parquet handles silently              |
| **Add description**             | None              | Metadata only                         |

### Breaking Changes (Require Migration)

| Change                                        | Impact                       | Migration Required                               |
| --------------------------------------------- | ---------------------------- | ------------------------------------------------ |
| **Remove column**                             | Downstream reads fail        | Update all downstream consumers first            |
| **Rename column**                             | Downstream reads fail        | Add alias period, then remove old name           |
| **Change type** (float -> string)             | Type mismatch                | Version bump, parallel schemas during transition |
| **Change nullability** (nullable -> required) | Historical data may have NaN | Backfill and validate all historical data        |

### Migration Process

1. **Announce**: document the change in the service's schema changelog
2. **Add**: if renaming, add new column while keeping old
3. **Migrate**: update all downstream consumers to use new column
4. **Validate**: verify all consumers work with new schema
5. **Remove**: drop old column (in a separate release)
6. **Version bump**: increment schema version

---

## Parquet as Canonical Format

### Why Parquet?

| Feature           | Benefit                                           |
| ----------------- | ------------------------------------------------- |
| **Columnar**      | Fast aggregation, filter pushdown                 |
| **Compressed**    | Snappy compression, ~5-10x smaller than CSV       |
| **Typed**         | Schema embedded in file, no parsing ambiguity     |
| **Partitionable** | Hive-style partitioning (`day=2024-01-15/`)       |
| **Ecosystem**     | Native support in Pandas, Spark, BigQuery, Athena |

### Parquet Write Settings

```python
df.to_parquet(
    path,
    engine="pyarrow",
    compression="snappy",
    index=False,
    coerce_timestamps="ms",  # Millisecond precision
)
```

### When BigQuery Instead of Parquet?

| Use Case            | Storage     | Reason                               |
| ------------------- | ----------- | ------------------------------------ |
| Batch pipeline data | GCS Parquet | Immutable, versioned, partitioned    |
| Analytics queries   | BigQuery    | SQL interface, joins across services |
| Live streaming data | BigQuery    | Real-time inserts, TTL management    |
| ML training data    | GCS Parquet | Reproducible, version-controlled     |
| Dashboard data      | BigQuery    | Fast queries for visualization tools |

---

## Service Schema Registry

| Service                        | Schema File                     | Output Types                          |
| ------------------------------ | ------------------------------- | ------------------------------------- |
| instruments-service            | `schemas/output_schemas.py`     | instrument_definitions                |
| market-tick-data-service       | `schemas/tick_data_schemas.py`  | raw tick data (trades, book, etc.)    |
| market-data-processing-service | `schemas/output_schemas.py`     | processed candles                     |
| features-delta-one-service     | `schemas/output_schemas.py`     | feature matrices                      |
| features-volatility-service    | `schemas/output_schemas.py`     | volatility features                   |
| strategy-service               | `schemas/output_schemas.py`     | instructions, positions, equity curve |
| execution-service              | internal NautilusTrader schemas | fills, trades, execution results      |

---

## Canonical Field Standards

All canonical schemas in `unified_api_contracts/canonical/` MUST follow these type standards:

| Field Category                           | Canonical Type                                 | Rationale                                              | Never Use                                                              |
| ---------------------------------------- | ---------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `timestamp`, `*_timestamp`               | `datetime` (timezone-aware) or `int` (Unix ms) | Consistent across all canonical schemas                | `str`, naive `datetime`, Unix ns (use ns only for HFT/latency schemas) |
| `price`, `*_price`, `rate`, `*_rate`     | `Decimal`                                      | Preserves venue precision; no floating-point drift     | `float`, `str` (in canonical layer)                                    |
| `quantity`, `size`, `volume`, `*_volume` | `Decimal`                                      | Same precision guarantee                               | `float`                                                                |
| `venue`                                  | `str` (lowercase slug)                         | e.g. `"binance"`, `"deribit"`                          | Mixed case, enum                                                       |
| `instrument_key`                         | `str` in `VENUE:TYPE:SYMBOL` format            | Market-data canonical identifier                       | `symbol` (venue-specific), `instrument_id` (execution only)            |
| `instrument_id`                          | `str` (venue-opaque)                           | Execution schemas only (CanonicalOrder, CanonicalFill) | In market-data schemas                                                 |

**Field naming suffixes:**

| Suffix       | Meaning                                                            |
| ------------ | ------------------------------------------------------------------ |
| `_timestamp` | datetime or int ms — timestamp fields use this suffix consistently |
| `_rate`      | Decimal rate (e.g. `funding_rate`, `predicted_rate`)               |
| `_key`       | Canonical cross-venue identifier (`instrument_key`)                |
| `_id`        | Venue-opaque identifier (`instrument_id`, execution layer only)    |

---

## P0 Canonical Field Issues (Data Loss)

These are confirmed data-loss issues in `unified_api_contracts/canonical/domain.py`. Fixed as of 2026-03-06 unless
noted.

| Schema                                               | Issue                                                                       | Status              | Fix                                                          |
| ---------------------------------------------------- | --------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------ |
| `CanonicalFundingRate`                               | `predicted_rate` field was missing — silently dropped during normalization  | ✅ Fixed 2026-03-06 | Added `predicted_rate: Decimal \| None = None`               |
| `CanonicalOhlcvBar`                                  | `open/high/low/close/volume` were `float` — precision loss vs venue data    | ✅ Fixed 2026-03-06 | Changed all price/volume fields to `Decimal`                 |
| `CanonicalDerivativeTicker`                          | `adl_rank` (Auto-Deleveraging rank, Binance/OKX/Deribit) was missing        | ✅ Fixed 2026-03-06 | Added `adl_rank: int \| None = None`                         |
| `CanonicalFundingRate` + `CanonicalDerivativeTicker` | `next_funding_time` — inconsistent suffix vs all other `*_timestamp` fields | ✅ Fixed 2026-03-06 | Renamed to `next_funding_timestamp`; updated all normalizers |

---

## UIC Adoption Matrix

The UIC Adoption Matrix tracks which terminal consumer services import each UIC schema class.

- **SSOT:** `unified-internal-contracts/docs/ADOPTION_MATRIX.md` (generated by `scripts/check_uic_adoption.py`)
- **Orphan threshold:** Any UIC schema with 0 terminal consumer imports is an orphan and should be classified for
  adoption, removal, or deferral.
- **Known orphan categories (2026-03-06 audit):**
  - All 7 `WebSocket*Event` types (connectivity/) — not yet consumed by alerting-service
  - ML training schemas (`TrainingPeriod`, `MLConfigDict`, `TargetType`, `ModelType`) — ml-training-service still uses
    local copies
  - Several event detail types (`DataBroadcastDetails`, `PersistenceStartedDetails`, etc.) — observability not yet wired
  - `CrossTimeframeFeatures`, `FeatureSnapshotRequest` — features services pending adoption

See plan `plans/active/schema_governance_full_audit.plan.md` todos `p2-uic-adoption-matrix` and
`p2-orphaned-uic-schemas` for remediation tracking.

---

## Schema Ownership Model

Where different types of schemas live and who owns them.

### unified-api-contracts: SSOT for External API Schemas

**unified-api-contracts** is the single source of truth for all external API request/response schemas. Services and
interfaces must NOT define their own schemas for external APIs (Binance, Tardis, Databento, CCXT, The Graph, Alchemy,
GCP/AWS SDKs, etc.).

- **Location:** `unified_api_contracts/*/schemas.py` (venue-specific: binance, tardis, databento, ccxt, thegraph,
  alchemy, cloud_sdks, etc.)
- **Validation:** `validate_timestamp_date_alignment()` applies to service output (GCS Parquet); unified-api-contracts
  schemas validate external API responses before transformation.
- **Version:** unified-api-contracts version = mappings + schemas + endpoints. See
  `02-data/unified-unified-api-contracts-chain.md` for the full chain, SCHEMA_VERSIONS.md, and
  check_sdk_version_alignment.

**Schema type ownership matrix:**

| Type                                                          | Owner   | Location                                            | Use Case                                                                   |
| ------------------------------------------------------------- | ------- | --------------------------------------------------- | -------------------------------------------------------------------------- |
| **SchemaDefinition / ColumnSchema** (parquet infra)           | Service | `schemas/output_schemas.py`                         | GCS write enforcement; `validate_timestamp_date_alignment()` before upload |
| **Domain data contract** (BaseModel / TypedDict / @dataclass) | UIC     | `unified_internal_contracts/domain/<service-name>/` | Cross-repo data shape; imported via UTL or UDC                             |
| **External API schema**                                       | UAC     | `unified_api_contracts/external/<venue>/schemas.py` | Validate HTTP/SDK responses before normalization                           |
| **Canonical normalization output**                            | UAC     | `unified_api_contracts/canonical/`                  | Output type of UAC normalizers                                             |
| **Messaging / pub-sub canonical**                             | UIC     | `unified_internal_contracts/<domain>/`              | Internal event and pub-sub contracts                                       |

Services call `validate_timestamp_date_alignment()` before every GCS write. Adapters use unified-api-contracts schemas
to validate external API responses before mapping to canonical formats (CanonicalTrade, CanonicalOrderBook, etc.).

### Service domain data schemas → unified-internal-contracts

**Domain data contracts** (the Pydantic `BaseModel` / `TypedDict` / `@dataclass` that describe a service's primary
output shape) belong in `unified-internal-contracts` under `domain/<service-name>/`. Services import these from UIC via
`unified-trading-library` or `unified-domain-client`. Services must **not** define domain contracts locally.

**Why:** any service needing another service's data shape must be able to find it in UIC without importing that service
directly — importing a peer service violates the tier DAG.

Examples (after migration):

- **Instrument definition contract** → `unified_internal_contracts/domain/instruments_service/output.py`
- **Candle contract** → `unified_internal_contracts/domain/market_data_processing_service/output.py`
- **Feature matrix contract** → `unified_internal_contracts/domain/features_delta_one_service/output.py`
- **Strategy instruction contract** → `unified_internal_contracts/domain/strategy_service/output.py`

What **stays** in the service `schemas/output_schemas.py`: `SchemaDefinition` / `ColumnSchema` objects (parquet write
infrastructure). These are not shared; they stay local to the service.

### unified-trading-services-owned schemas (cross-cutting)

Schemas that apply to all services or define shared infrastructure contracts live in `unified-trading-services`:

- **Event logging schema** -- `log_event()` format: `SERVICE_EVENT: {event_name} (details)` → **MIGRATING to
  `unified-events-interface`**
- **Error response format** -- standardized error classification and retry semantics
- **Config base class** -- `UnifiedCloudServicesConfig` (all services extend this) → **MIGRATING to
  `unified-config-interface`**
- **Domain client interfaces** -- what fields domain clients expose (query dimensions, return types)
- **Validation utilities** -- `SchemaDefinition`, `ColumnSchema`, `validate_timestamp_date_alignment`

### Interface-layer schemas (SUPERSEDED — canonical types now in UAC/UIC)

**SUPERSEDED**: Canonical types (CanonicalTrade, CanonicalOrderBook, CanonicalTicker, CanonicalOrder, CanonicalFill,
etc.) no longer live in interfaces. They live in UAC `unified_api_contracts/canonical/` (normalization outputs) or UIC
(messaging canonicals). See: 02-data/contracts-scope-and-layout.md § Canonical type ownership.

**Current correct locations:**

| Schema                                              | Authoritative Location                             | Import from                  |
| --------------------------------------------------- | -------------------------------------------------- | ---------------------------- |
| CanonicalTrade, CanonicalOrderBook, CanonicalTicker | UAC `unified_api_contracts/canonical/domain.py`    | `unified_api_contracts`      |
| CanonicalOrder, CanonicalFill                       | UAC `unified_api_contracts/canonical/execution.py` | `unified_api_contracts`      |
| CanonicalOHLCV, CanonicalBookUpdate                 | UIC `market_data/`                                 | `unified_internal_contracts` |
| CeFiPosition, DeFiLendingPosition                   | UIC `positions/`                                   | `unified_internal_contracts` |
| CanonicalOdds, CanonicalFixture                     | UAC `unified_api_contracts/external/sports/`       | `unified_api_contracts`      |

Interfaces (UMI, UTEI, USEI) import canonical types FROM UAC — they do not define them locally. Interface-local types
used only within the interface (internal helpers, venue-specific intermediaries) are CORRECT-LOCAL and may stay.

**Infrastructure-only schemas that stay in libraries:**

- **execution-algo-library**: AlgoConfig, AlgoExecution, ParentChildOrder — pure compute, no external API, no
  cross-service contract.
- **unified-events-interface**: LifecycleEventType, EventSeverity — event sink protocol types, T0 leaf.
- **unified-config-interface**: UnifiedCloudConfig, BaseConfig — config protocol types, T1.

### Contract schemas (inter-service agreements)

Cross-repo contracts always belong in `unified-internal-contracts`. There is no threshold of "2+ services" before a
schema must be shared — even a single-producer schema belongs in UIC `domain/<service-name>/` so that any downstream
consumer can discover it from UIC without importing the service.

- **Today**: many contracts are defined implicitly via Parquet column expectations or locally in service repos. These
  are in violation of the placement rules and will be migrated to UIC in the remediation plan (see
  `plans/active/schema_contracts_full_audit.plan.md`).
- **Target**: upstream service domain contract lives in UIC `domain/<service-name>/`; downstream reads the schema from
  UIC via UTL/UDC.

### Messaging schemas

- **PubSub message formats / event envelopes** → `unified-internal-contracts` (`events.py` / `pubsub.py` or relevant
  domain module)
- **gRPC proto definitions** → `unified-internal-contracts` when introduced [PLANNED]
- **BigQuery table schemas** → derived from Parquet schemas + external table definitions
- **The rule**: ALL cross-repo contracts go to UIC regardless of how many services use them
