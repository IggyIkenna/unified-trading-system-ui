# Sharding and Data Alignment Spec

**Purpose:** Ensure data status, missing-shards, startup dependency validation, and service upload behavior align with GCS bucketing and sharding methodology.

**Principle:** "Any data means all data" — a shard either succeeds fully or fails fully. No partial uploads.

---

## 1. Alignment Matrix

| Layer              | Source                                                | Granularity                                                            |
| ------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| **GCS paths**      | `dependencies.yaml`, `catalog.py`, schema-change docs | Per service output path templates                                      |
| **Sharding**       | `configs/sharding.*.yaml`                             | Dimensions: category, venue, date, feature_group, etc.                 |
| **Data status**    | `data_status.py`, `catalog.py`                        | Same as shard dimensions; checks down to final directory               |
| **Missing shards** | `POST /missing-shards`                                | Compares calculated shards vs existing data at (category, venue, date) |
| **Service upload** | Each service's main/orchestrator                      | Must fail entire shard if ANY upload fails                             |

---

## 2. GCS Path Alignment

All path templates must match across:

- `deployment-service-v2/configs/dependencies.yaml` (outputs.path_template)
- `deployment-service-v2/deployment_service/catalog.py` (SERVICE_GCS_CONFIGS)
- Schema-change docs: `docs/schema-change/02_*.md` through `08_*.md`
- Actual service implementations (e.g., `gcs_path_utils.py`, feature writers)

### Key Paths (Current Implementation)

| Service                  | Path Template                                                                                                             | Notes                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| market-tick-data-handler | `raw_tick_data/by_date/day={date}/data_type={data_type}/instrument_type={asset_class}/venue={venue}/{instrument}.parquet` | No `symbol=` in path; filename = `{instrument}.parquet`   |
| market-data-processing   | `processed_candles/by_date/day={date}/timeframe={tf}/data_type={type}/{asset_class}/{venue}/{instrument}.parquet`         | Chain: `options_chain/{venue}/`, `futures_chain/{venue}/` |
| features-delta-one       | `by_date/day={date}/feature_group={group}/timeframe={tf}/{instrument}.parquet`                                            |                                                           |
| features-calendar        | `calendar/category={category}/by_date/day={date}/features.parquet` or `events.parquet`                                    | Shared bucket, no category                                |
| features-volatility      | `by_date/day={date}/feature_group={group}/timeframe={tf}/{underlying}.parquet`                                            |                                                           |

---

## 3. Sharding Dimensions vs Data Status

Data status checks completion at the same granularity as shard dimensions:

| Service                  | Shard Dimensions               | Data Status Check                                        |
| ------------------------ | ------------------------------ | -------------------------------------------------------- |
| market-tick-data-handler | category, venue, date          | category × venue × date; `--check-data-types` for TRADFI |
| market-data-processing   | category, venue, date          | category × venue × date × timeframe × data_type          |
| features-delta-one       | category, feature_group, date  | category × feature_group × date                          |
| features-calendar        | feature_group (category), date | category × date (no domain)                              |

---

## 4. Shard-Level Failure Behavior

**Required:** If any upload within a shard fails, the service MUST:

1. Log `FAILED` via `log_event("FAILED", details={"reason": "..."})` (UCS) or `log_event("FAILED", severity="ERROR", details={...})` (unified-events-interface)
2. Exit with code 1 (`sys.exit(1)`)
3. NOT report success when some uploads succeeded and others failed

### Implementation Patterns

**market-tick-data-handler (download_handler.py):**

- `ErrorWarningCounter` attached to root logger during processing
- `shard_success = len(failed_dates) == 0 and error_counter.error_count == 0`
- Returns `success: shard_success`; main exits 1 on failure

**market-tick-data-handler (options_orchestrator.py):**

- Options chain: multiple underlyings per shard
- **Fixed:** `all_succeeded = total_underlyings > 0 and successful == total_underlyings` (was `successful > 0`)
- Returns `success: all_succeeded` so partial success fails the shard

**features-delta-one-service:**

- Returns 0/1 from main; `log_event("FAILED", str(e))` on exception
- Handler must fail whole shard on any upload failure (verify per-handler)

---

## 5. Unified Events Interface for Failures

**Standard lifecycle events:** `FAILED` is in `STANDARD_LIFECYCLE_EVENTS`.

**Usage:**

- **UCS (unified_trading_library):** `log_event("FAILED", details=str)` — second arg is details string
- **unified-events-interface:** `log_event("FAILED", severity="ERROR", details={"reason": "...", "shard": "..."})` — details is dict

Services using unified-events-interface must pass `details` as dict. For shard-level failures, include:

```python
log_event("FAILED", severity="ERROR", details={
    "reason": "partial_upload",
    "failed_count": 3,
    "total_count": 10,
    "shard_dimensions": {"category": "CEFI", "venue": "BINANCE", "date": "2026-01-01"},
})
```

---

## 6. Startup Dependency Validation

**Current:** `check_upstream_availability` in data_status uses upstream service data to derive expected dates (e.g., market-data-processing expects dates where market-tick has data).

**Missing-shards:** Compares all calculated shards (from ShardCalculator) against existing data. A shard is "missing" if no data exists at (category, venue, date) for that shard.

**Deployment:** Per COMPLETE_AUDIT_RESULTS.md, upstream dependency checking is NOT used before shard creation. Deployments launch without validating upstream data exists. This is a known gap.

---

## 7. Schema-Change Docs vs Implementation

Schema-change docs (`02_MARKET_TICK_DATA_HANDLER.md`, etc.) describe migration options (key=value for BigQuery). Current implementation uses key=value format. Docs may still reference `symbol=` — implementation uses `{instrument}.parquet` (no symbol= in path). See `GCS_AND_SCHEMA.md` for current canonical paths.

---

## 8. Per-Service Audit: "Any Data Means All Data"

| Service                            | Status             | Location                                         | Notes                                                                                                                                                                              |
| ---------------------------------- | ------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **instruments-service**            | ✅ Aligned         | `cloud_instrument_storage.py`                    | Returns `all_successful`; sets False on any venue upload failure. `generate_instruments_for_date` uses this (test: `store_instruments = Mock(return_value=False)` → status=error). |
| **market-tick-data-handler**       | ✅ Aligned         | `download_handler.py`, `options_orchestrator.py` | download: `shard_success = len(failed_dates)==0 and error_count==0`. options: `all_succeeded = successful == total_underlyings` (fixed).                                           |
| **market-data-processing-service** | ✅ Aligned         | `orchestration_service.py`                       | `success = len(errors) == 0 and len(processed_timeframes) == len(timeframes)`. Holidays (TRADFI): early-return writes closed-market candles for all timeframes.                    |
| **features-delta-one-service**     | ✅ Aligned         | `orchestration_service.py`, `feature_writer.py`  | orchestration: `success_count == len(instruments)` (CLI-filtered). feature_writer: `success_count == days_attempted` (holidays skipped).                                           |
| **features-calendar-service**      | ✅ Aligned         | `batch_handler.py` L197-210                      | `if total_failed > 0: log_event("FAILED", ...); sys.exit(1)` — fails when any category/day fails.                                                                                  |
| **features-volatility-service**    | ✅ Aligned         | `batch_handler.py` L199                          | Returns `success_count == len(groups)` — all feature groups must succeed.                                                                                                          |
| **features-onchain-service**       | ✅ Aligned         | `batch_handler.py` L187                          | Returns `success_count == len(groups)` — all groups must succeed.                                                                                                                  |
| **ml-training-service**            | ⚠️ Different model | Handlers return `HandlerResult(success=...)`     | Shards by instrument/timeframe/target; each shard trains one model. Partial success (N-1 of N models) may be acceptable for training. Verify per-handler.                          |
| **ml-inference-service**           | ✅ Aligned         | `cli/main.py` L168-173                           | `if error_count > 0: log_event("FAILED", ...); sys.exit(1)` — fails on any error.                                                                                                  |
| **strategy-service**               | ✅ Aligned         | `batch_handler.py` L294                          | `aggregated["success"] = len(errors) == 0` — no errors means success.                                                                                                              |
| **execution-service**              | N/A                | Live/backtest                                    | Different model; writes results per run. Not sharded by date/venue in same way.                                                                                                    |

### Gaps Fixed

1. **market-data-processing-service**: Changed to `success = len(errors) == 0 and len(processed_timeframes) == len(timeframes)`. Holidays (TRADFI): early-return path writes closed-market candles for all timeframes before the loop.
2. **features-delta-one-service**: orchestration: `success_count == len(instruments)` (instruments = CLI-filtered list). feature_writer: `success_count == days_attempted` (holidays with no data are not attempted).
3. **features-calendar-service**: Confirmed — batch handler exits 1 when `total_failed > 0`.
