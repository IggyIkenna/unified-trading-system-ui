# Data Catalogue Schema Standard

This document defines the canonical schema for all `data-catalogue-*.yaml` files across the unified trading system.
Every dataset entry in every service catalogue file must conform to this schema. The schema is enforced by the
instruments-service `catalogue_updater` module.

---

## Required Fields

Every top-level dataset entry must include all of the following fields.

| Field                  | Type         | Description                                                                                                                                           |
| ---------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dataset_id`           | string       | Unique identifier — dot-separated, e.g. `uac.ohlcv.binance.spot` or `instruments_cefi_binance`                                                        |
| `category`             | enum         | One of: `cefi`, `tradfi`, `defi`, `sports`, `altdata`, `prediction`                                                                                   |
| `service_owner`        | string       | Repo name that owns this dataset, e.g. `instruments-service`                                                                                          |
| `schema_ref`           | string       | Fully qualified UAC/UIC class name, e.g. `unified_api_contracts.market.OHLCVBar` or `unified_internal_contracts.domain.instruments.InstrumentsSchema` |
| `gcp_path`             | string       | GCS path template, e.g. `gs://trading-data-prod/ohlcv/binance/spot/`                                                                                  |
| `aws_path`             | string       | S3 path template, e.g. `s3://trading-data-prod/ohlcv/binance/spot/`                                                                                   |
| `partition_keys`       | list[string] | Partition field names in order, e.g. `[date, symbol]` or `[year, month, day]`                                                                         |
| `format`               | enum         | One of: `parquet`, `json`, `csv`, `avro`                                                                                                              |
| `retention_days`       | integer      | Number of days to retain data. Use `0` for indefinite.                                                                                                |
| `last_updated`         | string       | ISO 8601 datetime, auto-updated by instruments-service on each batch write, e.g. `"2026-03-08T00:00:00Z"`                                             |
| `row_count_last_batch` | integer      | Row count from the most recent batch write. `0` if not yet written.                                                                                   |
| `status`               | enum         | One of: `active`, `deprecated`, `mvp_required`, `mvp_optional`, `post_mvp`                                                                            |

---

## Optional Fields

| Field                 | Type         | Description                                                 |
| --------------------- | ------------ | ----------------------------------------------------------- |
| `description`         | string       | Human-readable description of the dataset                   |
| `tags`                | list[string] | Free-form tags for discovery, e.g. `[ohlcv, candles, cefi]` |
| `sla_freshness_hours` | integer      | Maximum acceptable staleness in hours before alerting       |
| `depends_on`          | list[string] | Upstream `dataset_id` values this dataset depends on        |

---

## Status Enum Reference

| Value          | Meaning                                                     |
| -------------- | ----------------------------------------------------------- |
| `active`       | Data is available and actively being written                |
| `deprecated`   | Dataset is no longer written; retained for historical reads |
| `mvp_required` | Must be available before first live batch trading run       |
| `mvp_optional` | Enhances live trading but not strictly required for MVP     |
| `post_mvp`     | Explicitly deferred until after MVP launch                  |

---

## Category Enum Reference

| Value        | Meaning                                                  |
| ------------ | -------------------------------------------------------- |
| `cefi`       | Centralised exchange (Binance, Deribit, Coinbase, etc.)  |
| `tradfi`     | Traditional finance (equities, futures, FX, indices)     |
| `defi`       | Decentralised finance (Uniswap, Curve, AAVE, etc.)       |
| `sports`     | Sports fixtures, odds, results                           |
| `altdata`    | Alternative data (news sentiment, on-chain flows, macro) |
| `prediction` | Prediction market data (Polymarket, etc.)                |

---

## Partitioning Convention

Partition keys must correspond to real subdirectory levels in the GCS/S3 path. The standard convention for
time-partitioned datasets:

```
year=YYYY/month=MM/day=DD/
```

For venue-partitioned datasets:

```
venue=<VENUE>/year=YYYY/month=MM/day=DD/
```

The `partition_keys` field lists the key names in path order:

```yaml
partition_keys: [year, month, day]
# or
partition_keys: [venue, year, month, day]
# or (for instruments)
partition_keys: [date]
```

---

## Auto-Update Contract

The `last_updated` and `row_count_last_batch` fields are maintained automatically by the instruments-service
`catalogue_updater` module. Services must **not** manually edit these fields.

After each successful batch write, instruments-service calls:

```python
from instruments_service.catalogue_updater import update_catalogue_entry
update_catalogue_entry(dataset_id, row_count=N, last_updated=datetime.now(UTC))
```

The updater reads the existing YAML from the deployment-service configs path, patches the two fields, and writes back
via `get_storage_client()`. It also emits a `CONFIG_CHANGED` event so downstream caches can refresh.

---

## Example Dataset Entry

```yaml
dataset_id: uac.ohlcv.binance.spot
category: cefi
service_owner: market-tick-data-service
schema_ref: unified_api_contracts.market.OHLCVBar
gcp_path: gs://trading-data-prod/ohlcv/binance/spot/
aws_path: s3://trading-data-prod/ohlcv/binance/spot/
partition_keys: [date, symbol]
format: parquet
retention_days: 365
last_updated: "2026-03-08T00:00:00Z"
row_count_last_batch: 48000
status: mvp_required
description: "1-minute OHLCV bars for all Binance SPOT pairs."
tags: [ohlcv, candles, cefi, binance]
sla_freshness_hours: 2
depends_on: []
```

```yaml
dataset_id: instruments_cefi_binance
category: cefi
service_owner: instruments-service
schema_ref: unified_internal_contracts.domain.instruments.InstrumentsSchema
gcp_path: gs://instruments-cefi-batch/instrument_availability/
aws_path: s3://instruments-cefi-batch/instrument_availability/
partition_keys: [year, month, day]
format: parquet
retention_days: 90
last_updated: "2026-03-08T00:00:00Z"
row_count_last_batch: 3200
status: active
description: "Instrument definitions for Binance SPOT and FUTURES."
tags: [instruments, cefi, binance]
sla_freshness_hours: 26
depends_on: []
```

---

## Enforcement

- All new `data-catalogue-*.yaml` files must be validated against this schema before merge.
- The quality-gate `dc-schema-check` step (in service QG scripts) runs a YAML schema lint using the field list above.
  Any missing required field fails the gate.
- Existing files are being migrated to conform to this schema as part of `dc-catalogue-format-standard`.
- Owner: instruments-service team.
- SSOT: `unified-trading-codex/06-coding-standards/data-catalogue-schema.md` (this file).
