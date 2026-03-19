# GCS Schema Change Overview - All Services

**Purpose:** Document exact GCS path changes required for BigQuery hive partitioning
**Impact:** Breaking changes across all services
**Decision Required:** Migrate to key=value format OR keep current + use manual ETL

---

## Key Finding: BigQuery Hive Partitioning Constraint

**BigQuery Requires:** `key=value` format for partition folders

- Example: `year=2023/month=01/day=15/`

**We Currently Use:** `prefix-value` format

- Example: `day-2023-01-15/feature_group-technical/timeframe-1m/`

**Result:** External tables with hive partitioning **WILL NOT WORK** with current naming

---

## Impact Summary

| Service                | Files Changed | Breaking Change   | Downstream Impact                             |
| ---------------------- | ------------- | ----------------- | --------------------------------------------- |
| instruments            | Minimal       | Path format only  | deployment-service, all readers               |
| market-tick            | Moderate      | 3-level structure | market-data-processing, features, all readers |
| market-data-processing | Moderate      | 2-level structure | features, ML, all readers                     |
| features-delta-one     | Major         | 3-level structure | ML, strategy, all readers                     |
| features-calendar      | Minor         | 2-level structure | ML                                            |
| ml-training            | None          | Consumers only    | N/A                                           |
| ml-inference           | None          | Consumers only    | N/A                                           |
| strategy               | None          | Consumers only    | N/A                                           |
| execution              | None          | Consumers only    | N/A                                           |

**Total Services Requiring Changes:** 5 (instruments, market-tick, market-data-processing, features-delta-one, features-calendar)

**Downstream Impact:** ALL consuming services must update GCS read paths

---

## Migration Decision Matrix

### Option A: Keep Current + Manual ETL (RECOMMENDED)

**Pros:**

- ✅ Zero code changes
- ✅ Works immediately
- ✅ GCS parallel reader tested
- ✅ Manual ETL when needed

**Cons:**

- ⚠️ No BigQuery external tables
- ⚠️ Materialized views cost $900/month (optional)
- ⚠️ Manual ETL needed for BigQuery queries

**Cost:** Same as today

### Option B: Migrate All Services to key=value

**Pros:**

- ✅ BigQuery external tables work ($0 storage)
- ✅ Can skip materialized views (save $900/month)
- ✅ SQL queries on GCS directly

**Cons:**

- ❌ 5 services need code changes
- ❌ ALL consuming services need updates
- ❌ All existing data incompatible (must regenerate)
- ❌ 2-3 weeks of work
- ❌ Breaking change for all pipelines

**Savings:** $900/month (if skipping MVs)
**Cost:** 2-3 weeks development time

---

## Per-Service Details

See individual service docs in this directory:

- [01_INSTRUMENTS_SERVICE.md](01_INSTRUMENTS_SERVICE.md)
- [02_MARKET_TICK_DATA_HANDLER.md](02_MARKET_TICK_DATA_HANDLER.md)
- [03_MARKET_DATA_PROCESSING.md](03_MARKET_DATA_PROCESSING.md)
- [04_FEATURES_DELTA_ONE.md](04_FEATURES_DELTA_ONE.md)
- [05_FEATURES_CALENDAR.md](05_FEATURES_CALENDAR.md)
- [06_ML_SERVICES.md](06_ML_SERVICES.md) (consumers - no changes to output)

---

## Recommendation

**For MVP:** Use GCS primary + manual ETL

**For Production (if BigQuery becomes critical):** Plan migration to key=value format

**This is a strategic architectural decision that affects the entire system.**
