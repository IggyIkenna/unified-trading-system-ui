# GCS and Schema Reference

GCS path format, key=value partitions, and per-service schema changes.

**Last consolidated:** 2026-02-09  
**Status:** ✅ All production services use `key=value` format

---

## Production Status (February 2026)

**IMPORTANT:** All production services already use BigQuery-compatible `key=value` folder format.

**Service Status:**

- ✅ instruments-service: `day=`, `venue=`
- ✅ market-tick-data-handler: `day=`, `data_type=`, `instrument_type=`, `venue=`, `symbol=`
- ✅ market-data-processing-service: `day=`, `timeframe=`, `data_type=`
- ✅ features-delta-one-service: `day=`, `feature_group=`, `timeframe=`
- ✅ features-calendar-service: `day=`, `category=`

**What This Means:**

- ✅ BigQuery external tables can be created immediately (after data exists)
- ✅ No code migration needed
- ✅ Only documentation/script cleanup needed

See [BIGQUERY_HIVE_PARTITIONING_VALIDATION.md](BIGQUERY_HIVE_PARTITIONING_VALIDATION.md) for complete audit.

---

## Design: Nested Paths (Current)

Features use **nested** structure (not flat):

```
gs://features-delta-one-{category}-{project}/
  by_date/
    day=2023-01-01/                    ← key=value format
      feature_group=technical_indicators/  ← key=value format
        timeframe=1m/                   ← key=value format
          BINANCE-FUTURES:PERPETUAL:BTC-USDT.parquet
```

**Note:** Production code writes this format. Legacy docs showed `day-2023-01-01/` format.

---

## Legacy Data Handling

### Old `prefix-value` Format

If you have legacy data with folder names like `day-2023-01-01/`, `feature_group-technical/`, etc.:

**BigQuery Behavior:**

- External tables with `day=*/feature_group=*/` patterns will **IGNORE** folders named `day-{date}/`
- Only folders matching `key=value` format are visible to BigQuery
- Safe coexistence: Both formats can exist in same bucket without conflict

**Recommendation:**

- Leave old data in place (ignored by external tables)
- Or delete if storage cost is a concern
- No migration needed for new data

### Where Old Format Still Appears

**Intentional (for legacy data):**

- Migration scripts: `market-tick-data-handler/scripts/migrate_gcs_structure.py`
- Cleanup scripts: `market-tick-data-handler/scripts/cleanup_redundant_utilization.py`

**Needs Update:**

- `features-delta-one-service/scripts/data_catalog.py` (line 33)
- Service-specific docs: `features-delta-one-service/docs/GCS_PATHS.md`

---

## Key=Value Format (Production Standard)

**All production services use this format:**

| Folder Type     | Format             | Example                              |
| --------------- | ------------------ | ------------------------------------ |
| Day             | `day=`             | `day=2023-01-01`                     |
| Data Type       | `data_type=`       | `data_type=trades`                   |
| Timeframe       | `timeframe=`       | `timeframe=1m`                       |
| Feature Group   | `feature_group=`   | `feature_group=technical_indicators` |
| Instrument Type | `instrument_type=` | `instrument_type=perpetuals`         |
| Venue           | `venue=`           | `venue=BINANCE-FUTURES`              |
| Symbol          | `symbol=`          | `symbol=BTC`                         |
| Category        | `category=`        | `category=time_features`             |

**Current Path Examples by Service:**

| Service                | Path Format                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Instruments**        | `instrument_availability/by_date/day={date}/venue={venue}/instruments.parquet`                                    |
| **Market Tick**        | `raw_tick_data/by_date/day={date}/data_type={type}/instrument_type={type}/venue={venue}/{symbol}.parquet`         |
| **Processed Candles**  | `processed_candles/by_date/day={date}/timeframe={tf}/data_type={type}/{asset_class}/{venue}/{instrument}.parquet` |
| **Features Delta-One** | `by_date/day={date}/feature_group={group}/timeframe={tf}/{instrument}.parquet`                                    |
| **Features Calendar**  | `calendar/category={category}/by_date/day={date}/features.parquet`                                                |

---

## BigQuery Integration

**Status:** Ready after data generation

**Setup:**

1. Generate features/market data using current services (already `key=value` format)
2. Run `deployment-service/scripts/create_bigquery_external_tables.sh`
3. Query using BigQuery SQL or Python client

**Documentation:**

- [BIGQUERY_INTEGRATION_GUIDE.md](BIGQUERY_INTEGRATION_GUIDE.md) - Complete setup and usage guide
- [BIGQUERY_HIVE_PARTITIONING_VALIDATION.md](BIGQUERY_HIVE_PARTITIONING_VALIDATION.md) - Service audit and validation
- [COST.md](COST.md) - BigQuery cost analysis

**External Tables:**

- Storage: $0 (pointer to GCS)
- Queries: $6/TB scanned
- Freshness: Always current (reads GCS directly)
- Refresh: Not needed (automatic)

---

## Bucket Naming

| Pattern                                   | Example                                |
| ----------------------------------------- | -------------------------------------- |
| `instruments-store-{category}-{project}`  | instruments-store-cefi-test-project    |
| `market-data-tick-{category}-{project}`   | market-data-tick-cefi-test-project     |
| `features-delta-one-{category}-{project}` | features-delta-one-cefi-test-project   |
| `deployment-orchestration-{project}`      | Deployment state (not terraform-state) |

---

## Related

- [ML_IMPLEMENTATION.md](ML_IMPLEMENTATION.md) - ML pipeline
- [HARDENING.md](HARDENING.md) - Path standards
