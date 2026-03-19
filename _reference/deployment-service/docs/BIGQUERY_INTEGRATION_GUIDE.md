# BigQuery Integration Guide

**Purpose:** Complete guide to BigQuery external tables for ML features and market data  
**Status:** Production Ready - External tables can be created after data generation  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decision](#architecture-decision)
3. [External Tables Explained](#external-tables-explained)
4. [Setup Instructions](#setup-instructions)
5. [Usage Examples](#usage-examples)
6. [Cost Analysis](#cost-analysis)
7. [Legacy Data Handling](#legacy-data-handling)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Current State ✅

**All production services already use BigQuery-compatible `key=value` folder format:**

- instruments-service: `day=`, `venue=`
- market-tick-data-handler: `day=`, `data_type=`, `instrument_type=`, `venue=`, `symbol=`
- market-data-processing-service: `day=`, `timeframe=`, `data_type=`
- features-delta-one-service: `day=`, `feature_group=`, `timeframe=`
- features-calendar-service: `day=`, `category=`

**This means:**

- ✅ BigQuery external tables can be created immediately (after data exists)
- ✅ No code migration needed
- ✅ Old `day-` data automatically ignored by external tables

### What This Guide Covers

- How to set up BigQuery external tables for features and market data
- Query patterns for ML training and analysis
- Cost optimization strategies
- Relationship with GCS parallel reader (primary data access method)

---

## Architecture Decision

### Primary Path: GCS Parallel Reader

**For Production ML Training:**

```python
from ml_training_service.app.core.gcs_feature_reader import GCSFeatureReader

reader = GCSFeatureReader(project_id="test-project")
features_df = reader.read_features(
    instrument_ids=["BINANCE-FUTURES:PERPETUAL:BTC-USDT"],
    start_date="2023-01-01",
    end_date="2023-12-31",
    timeframes=["1m"],
    feature_groups=["technical_indicators", "market_structure"]
)
```

**Why Primary:**

- Direct parquet reads from GCS (20-30 sec for typical queries)
- No BigQuery dependency or cost
- Works with any GCS structure
- Proven reliable for batch processing

### Optional Path: BigQuery External Tables

**For Development/Analysis:**

```sql
-- Fast SQL queries for exploration
SELECT
  instrument_id,
  DATE(timestamp) as day,
  AVG(rsi_14) as avg_rsi,
  COUNT(*) as records
FROM `features_data.features_1m_cefi`
WHERE day BETWEEN '2023-01-01' AND '2023-01-31'
  AND instrument_id = 'BINANCE-FUTURES:PERPETUAL:BTC-USDT'
GROUP BY instrument_id, day
ORDER BY day;
```

**Why Optional:**

- 10-20x faster queries (2 sec vs 20-30 sec) for ad-hoc analysis
- SQL interface for data exploration
- Useful for debugging and quality checks
- Cost: Only pay for queries ($6/TB scanned)

### Decision Summary

| Use Case                        | Method                   | Speed     | Cost                  |
| ------------------------------- | ------------------------ | --------- | --------------------- |
| **Production ML Training**      | GCS Parallel Reader      | 20-30 sec | $0 (GCS storage only) |
| **Development/Exploration**     | BigQuery External Tables | 2 sec     | $6/TB scanned         |
| **Specific Date Range Loading** | Manual ETL               | Varies    | $6/TB + storage       |

---

## External Tables Explained

### What Are External Tables?

External tables are **metadata pointers** to data stored in GCS. They don't copy or duplicate data.

**Key Properties:**

- **Storage Cost:** $0 (no data duplication)
- **Query Cost:** $6/TB scanned (same as regular BigQuery queries)
- **Freshness:** Always current (reads GCS directly on each query)
- **Refresh:** Not needed (automatic)
- **Setup:** One-time table definition creation

### How Hive Partitioning Works

BigQuery can extract partition keys from folder names using the `key=value` format:

**GCS Structure:**

```
gs://features-delta-one-cefi-{project}/
  by_date/
    day=2023-01-01/           ← Extracted as partition column "day"
      feature_group=technical_indicators/  ← Extracted as "feature_group"
        timeframe=1m/          ← Extracted as "timeframe"
          BINANCE-FUTURES:PERPETUAL:BTC-USDT.parquet
```

**Resulting BigQuery Table:**

```sql
CREATE EXTERNAL TABLE features_data.features_1m_cefi
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://features-delta-one-cefi-{project}/by_date/day=*/feature_group=*/timeframe=1m/*.parquet'],
  hive_partitioning_options = '{
    "mode": "AUTO",
    "sourceUriPrefix": "gs://features-delta-one-cefi-{project}/by_date/"
  }'
);

-- BigQuery automatically adds these columns:
-- day STRING (from folder name)
-- feature_group STRING (from folder name)
-- timeframe STRING (from folder name)
-- Plus all columns from parquet files
```

**Query Optimization:**

```sql
-- Efficient: Only scans day=2023-01-01 folder
SELECT * FROM features_data.features_1m_cefi
WHERE day = '2023-01-01' AND feature_group = 'technical_indicators';

-- Inefficient: Scans all days
SELECT * FROM features_data.features_1m_cefi
WHERE rsi_14 > 70;
```

### vs Materialized Views (Not Used)

**Materialized Views (MV):**

- **Storage Cost:** $131/year (duplicate data in BigQuery native storage)
- **Query Cost:** $6/TB (same as external tables)
- **Freshness:** Stale until refreshed
- **Refresh:** Requires Cloud Function or manual refresh ($3-338/year)
- **Speed:** 10-20x faster than external tables

**Our Decision:** External tables only

- **Reason:** 20-30 sec query time acceptable for batch ML training
- **Savings:** $131-469/year (storage + refresh costs)
- **Simplicity:** No refresh infrastructure needed

---

## Setup Instructions

### Prerequisites

1. ✅ GCS buckets exist with data in `key=value` format
2. ✅ Google Cloud credentials configured
3. ✅ BigQuery API enabled
4. ✅ Appropriate IAM permissions

### Step 1: Verify Data Exists

```bash
# Check features bucket
gsutil ls gs://features-delta-one-cefi-test-project/by_date/ | head -5

# Should see folders like:
# gs://features-delta-one-cefi-test-project/by_date/day=2023-01-01/
# gs://features-delta-one-cefi-test-project/by_date/day=2023-01-02/
```

### Step 2: Run Setup Script

```bash
cd deployment-service
./scripts/create_bigquery_external_tables.sh
```

**What the script does:**

1. Creates BigQuery datasets (`instruments_data`, `market_tick`, `candles_data`, `features_data`)
2. Creates external tables with hive partitioning for each service
3. Tests table creation with sample queries

### Step 3: Validate Tables

```bash
# List tables
bq ls --project_id=test-project features_data

# Check schema
bq show --project_id=test-project features_data.features_1m_cefi

# Test query
bq query --project_id=test-project \
  "SELECT day, feature_group, COUNT(*) as files
   FROM features_data.features_1m_cefi
   GROUP BY day, feature_group
   LIMIT 10"
```

### Manual Creation (If Script Fails)

```python
from google.cloud import bigquery

client = bigquery.Client(project='test-project')

# Create external table
external_config = bigquery.ExternalConfig('PARQUET')
external_config.source_uris = [
    'gs://features-delta-one-cefi-test-project/by_date/day=*/feature_group=*/timeframe=1m/*.parquet'
]
external_config.autodetect = True

# Configure hive partitioning
hive_partitioning = bigquery.HivePartitioningOptions()
hive_partitioning.mode = 'AUTO'
hive_partitioning.source_uri_prefix = 'gs://features-delta-one-cefi-test-project/by_date/'
external_config.hive_partitioning = hive_partitioning

# Create table
table = bigquery.Table('test-project.features_data.features_1m_cefi')
table.external_data_configuration = external_config
client.create_table(table, exists_ok=True)
```

---

## Usage Examples

### Query Features for ML Training

```sql
-- Get all features for BTC, 1m timeframe, Jan 2023
SELECT
  timestamp,
  instrument_id,
  feature_group,
  rsi_14,
  macd,
  swing_high,
  swing_low
FROM `test-project.features_data.features_1m_cefi`
WHERE day BETWEEN '2023-01-01' AND '2023-01-31'
  AND instrument_id = 'BINANCE-FUTURES:PERPETUAL:BTC-USDT'
  AND feature_group = 'technical_indicators'
ORDER BY timestamp;
```

### Check Data Completeness

```sql
-- Count records per day
SELECT
  day,
  feature_group,
  COUNT(*) as record_count,
  COUNT(DISTINCT instrument_id) as instrument_count
FROM `test-project.features_data.features_1m_cefi`
WHERE day BETWEEN '2023-01-01' AND '2023-01-31'
GROUP BY day, feature_group
ORDER BY day, feature_group;
```

### Validate Feature Quality

```sql
-- Check for nulls and outliers
SELECT
  feature_group,
  COUNT(*) as total_records,
  COUNTIF(rsi_14 IS NULL) as null_rsi,
  COUNTIF(rsi_14 < 0 OR rsi_14 > 100) as invalid_rsi,
  MIN(rsi_14) as min_rsi,
  MAX(rsi_14) as max_rsi,
  AVG(rsi_14) as avg_rsi
FROM `test-project.features_data.features_1m_cefi`
WHERE day = '2023-01-15'
GROUP BY feature_group;
```

### Join Features with Calendar

```sql
-- Combine delta-one and calendar features
SELECT
  d.timestamp,
  d.instrument_id,
  d.rsi_14,
  d.macd,
  c.hour_of_day,
  c.day_of_week,
  c.is_market_open
FROM `test-project.features_data.features_1m_cefi` d
JOIN `test-project.features_data.features_calendar` c
  ON DATE(d.timestamp) = c.day
WHERE d.day = '2023-01-15'
  AND d.instrument_id = 'BINANCE-FUTURES:PERPETUAL:BTC-USDT'
LIMIT 100;
```

### Python Client Usage

```python
from google.cloud import bigquery
import pandas as pd

client = bigquery.Client(project='test-project')

query = """
SELECT *
FROM `features_data.features_1m_cefi`
WHERE day BETWEEN '2023-01-01' AND '2023-01-31'
  AND instrument_id = 'BINANCE-FUTURES:PERPETUAL:BTC-USDT'
  AND feature_group = 'technical_indicators'
"""

df = client.query(query).to_dataframe()
print(f"Loaded {len(df)} rows, {df.memory_usage().sum() / 1e6:.1f} MB")
```

---

## Cost Analysis

### Storage Costs

**External Tables:** $0 (no data duplication)

- Data stays in GCS
- Only metadata stored in BigQuery

**GCS Storage:** $0.023/GB/month (asia-northeast1)

- 476 GB features = $11/month = $131/year

### Query Costs

**BigQuery Queries:** $6/TB scanned

**Example Scenarios:**

| Query Type                                  | Data Scanned | Cost    |
| ------------------------------------------- | ------------ | ------- |
| 1 day, 1 instrument, 1m                     | ~100 MB      | $0.0006 |
| 30 days, 2 instruments, 1m                  | ~6 GB        | $0.036  |
| 1 year, 2 instruments, 1m                   | ~72 GB       | $0.43   |
| Full 6 years, 2 instruments, all timeframes | ~476 GB      | $2.86   |

**Monthly Usage Estimates:**

| Use Case           | Queries/Month | Data Scanned | Cost/Month |
| ------------------ | ------------- | ------------ | ---------- |
| Light development  | 100           | 1 TB         | $6         |
| Active development | 1000          | 10 TB        | $60        |
| Heavy R&D          | 3000          | 30 TB        | $180       |

### Cost Optimization

**1. Use Partition Filters**

```sql
-- Good: Scans only 1 day (100 MB)
WHERE day = '2023-01-15'

-- Bad: Scans all days (72 GB)
WHERE timestamp > '2023-01-15 00:00:00'
```

**2. Sample Data for Experiments**

```sql
-- Query 10% sample (10x cost reduction)
WHERE day = '2023-01-15' AND MOD(ABS(FARM_FINGERPRINT(instrument_id)), 10) = 0
```

**3. Cache Results**

```python
# Save query results locally
df.to_parquet('local_cache/features_2023-01-15.parquet')

# Reuse cached data for experiments
df = pd.read_parquet('local_cache/features_2023-01-15.parquet')
```

**4. Use GCS Reader for Production**

- External tables: For exploration and debugging
- GCS parallel reader: For actual ML training (20-30 sec is acceptable)

### Total Annual Cost (MVP: BTC + SPY)

| Component                     | Annual Cost |
| ----------------------------- | ----------- |
| GCS Storage                   | $131        |
| BigQuery Queries (1000/month) | $720        |
| **Total**                     | **$851**    |

**Compare to:**

- GCS only (no BigQuery): $131/year
- With Materialized Views: $851 + $131 (storage) + $338 (refresh) = $1,320/year

---

## Legacy Data Handling

### Old `prefix-value` Format

**If you have old data with folder names like:**

```
gs://features-delta-one-cefi-{project}/
  by_date/
    day-2023-01-01/           ← OLD format (dash separator)
      feature_group-technical_indicators/
        timeframe-1m/
          ...
```

**BigQuery external tables will IGNORE these folders:**

- External tables use `sourceUriPrefix` pattern matching
- Pattern `day=*/feature_group=*/` only matches folders with `=` separator
- Folders with `-` separator are invisible to BigQuery
- No risk of mixing old/new data

**Migration Options:**

**Option 1: Do Nothing** (Recommended)

- Old data ignored by external tables
- New data immediately queryable
- No cleanup needed

**Option 2: Delete Old Data** (If Storage Cost is Concern)

```bash
# Delete old prefix-value format folders
gsutil -m rm -r gs://features-delta-one-cefi-{project}/by_date/day-*/
```

**Option 3: Migrate Old Data** (If Needed for Historical Analysis)

```python
# Use migration script in service repos
# Example: features-delta-one-service/scripts/migrate_gcs_structure.py
```

---

## Troubleshooting

### Table Creation Fails

**Error:** `Using multiple asterisks not supported`

**Solution:** Ensure `sourceUriPrefix` is set correctly:

```python
# Wrong: Multiple wildcards in uris
uris = ['gs://bucket/day=*/feature_group=*/timeframe=*/*.parquet']

# Correct: Wildcards in uris, prefix stops before first wildcard
uris = ['gs://bucket/by_date/day=*/feature_group=*/timeframe=1m/*.parquet']
source_uri_prefix = 'gs://bucket/by_date/'  # Stops before first wildcard
```

### No Data Returned

**Possible Causes:**

1. Data doesn't exist in GCS yet
2. Folder format doesn't match `key=value` (check with `gsutil ls`)
3. Partition filter too restrictive

**Debug:**

```bash
# Check actual GCS structure
gsutil ls -r gs://features-delta-one-cefi-{project}/by_date/ | head -20

# Verify table sees partitions
bq show --project_id=test-project features_data.features_1m_cefi

# Query without partition filter
bq query "SELECT day, COUNT(*) FROM features_data.features_1m_cefi GROUP BY day LIMIT 10"
```

### Query Costs Higher Than Expected

**Check:**

1. Using partition filters? (`WHERE day = '2023-01-15'`)
2. Selecting only needed columns? (Not `SELECT *`)
3. Caching results locally?

**Get Query Cost Estimate:**

```bash
bq query --dry_run "SELECT * FROM features_data.features_1m_cefi WHERE day = '2023-01-15'"
# Shows "bytes processed" before running
```

---

## Related Documentation

- [BIGQUERY_HIVE_PARTITIONING_VALIDATION.md](BIGQUERY_HIVE_PARTITIONING_VALIDATION.md) - Service audit and validation
- [GCS_AND_SCHEMA.md](GCS_AND_SCHEMA.md) - GCS path formats across all services
- [COST.md](COST.md) - Complete cost analysis
- [ML_IMPLEMENTATION.md](ML_IMPLEMENTATION.md) - ML pipeline architecture

---

## Summary

**Current State:**

- ✅ All services use BigQuery-compatible `key=value` format
- ✅ External tables can be created after data generation
- ✅ Setup script ready: `scripts/create_bigquery_external_tables.sh`

**When to Use:**

- **GCS Parallel Reader:** Production ML training (primary method)
- **BigQuery External Tables:** Development, exploration, debugging (optional)
- **Manual ETL:** Specific use cases requiring BigQuery native tables

**Costs:**

- Storage: $0 (external tables)
- Queries: $6/TB scanned
- Total: ~$851/year for active development (1000 queries/month)

**Next Steps:**

1. Generate features data with current services
2. Run `create_bigquery_external_tables.sh`
3. Test queries and validate performance
4. Use for development/exploration as needed
