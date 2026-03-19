# Features-Delta-One - GCS Schema Change

## Current Structure (prefix-value, nested)

```
gs://features-delta-one-{category}-{project}/
  by_date/
    day-2023-01-01/
      feature_group-technical_indicators/
        timeframe-1m/
          BINANCE-FUTURES:PERPETUAL:BTC-USDT.parquet (50 columns)
        timeframe-5m/
          BINANCE-FUTURES:PERPETUAL:BTC-USDT.parquet
        [... 7 timeframes]
      feature_group-market_structure/
        timeframe-1m/
          BINANCE-FUTURES:PERPETUAL:BTC-USDT.parquet (12 columns)
        [... 7 timeframes]
      [... 20 feature groups]
```

**Files per instrument per day:** 20 groups × 7 timeframes = **140 files**

**Path Format:** `by_date/day-{date}/feature_group-{group}/timeframe-{tf}/{inst}.parquet`

**Query Pattern (Current):**

- Read 140 files per instrument per day
- Horizontal merge on timestamp
- Filter to needed groups/timeframes

---

## Option 1: Migrate to key=value (BigQuery Hive Compatible)

```
gs://features-delta-one-{category}-{project}/
  by_date/
    day=2023-01-01/
      feature_group=technical_indicators/
        timeframe=1m/
          BINANCE-FUTURES:PERPETUAL:BTC-USDT.parquet
```

**Path Format:** `by_date/day={date}/feature_group={group}/timeframe={tf}/{inst}.parquet`

**Change:** Replace `-` with `=` in folder names (3 levels)

**BigQuery External Table:**

```sql
CREATE EXTERNAL TABLE features_all
HIVE PARTITIONING:
  mode: AUTO
  sourceUriPrefix: gs://bucket/by_date/

PARTITION BY day
CLUSTER BY instrument_id, feature_group, timeframe

-- Query
SELECT * FROM features_all
WHERE day = '2023-01-01'
  AND instrument_id = 'BTC'
  AND feature_group = 'technical_indicators'
  AND timeframe = '1m'
```

**Benefits:**

- ✅ External tables work ($0 extra storage)
- ✅ Can query with SQL
- ✅ Still 140 files (same read pattern)

**Drawbacks:**

- ❌ Code changes in features-delta-one
- ❌ ML must update path construction
- ❌ All existing data incompatible

---

## Option 2: Flatten to 1 file per instrument per day

```
gs://features-delta-one-{category}-{project}/
  by_date/
    day=2023-01-01/
      BINANCE-FUTURES:PERPETUAL:BTC-USDT.parquet (ALL groups + timeframes merged)

Parquet Schema:
  timestamp, instrument_id, feature_group, timeframe,
  rsi_14, macd, swing_high, [... 200+ features from all groups]
```

**Path Format:** `by_date/day={date}/{inst}.parquet`

**Change:** 140 files → 1 file per instrument per day

**BigQuery:**

```sql
PARTITION BY day
CLUSTER BY instrument_id

-- Query (simpler!)
SELECT * FROM features_all
WHERE day = '2023-01-01'
  AND instrument_id = 'BTC'
  AND timeframe = '1m'  -- Filter in data
```

**Benefits:**

- ✅ Simplest BigQuery setup
- ✅ 1 read per instrument per day (140x fewer operations)
- ✅ No horizontal merge needed
- ✅ Faster GCS reads

**Drawbacks:**

- ❌ Larger files (~50 MB vs ~500 KB each)
- ❌ Major code changes in features-delta-one
- ❌ All existing data incompatible

---

## Option 3: Keep Current + GCS Parallel Reader (NO MIGRATION)

**No structure changes!**

**Use:**

- GCS parallel reader (works NOW, tested)
- Manual ETL to BigQuery when needed
- Centralized in unified-trading-library

**Benefits:**

- ✅ Zero code changes
- ✅ Works immediately
- ✅ No breaking changes

**Drawbacks:**

- ⚠️ No external tables (must use manual ETL)

---

## Recommendation

**For MVP:** Option 3 (no migration)
**For Production (if BigQuery critical):** Option 2 (flatten)

**Why:** Option 1 still requires regenerating all data and code changes, but keeps 140 files. Option 2 gives better benefits if we're changing anyway.

---

## Code Impact Estimate

### Option 1 (key=value format)

**features-delta-one-service:**

- feature_writer.py: 1 line change
- Tests: Update path expectations (~5 files)

**ml-training-service:**

- gcs_feature_reader.py: Update path construction (~3 lines)
- Tests: Update paths (~3 files)

**deployment-service:**

- catalog.py: Update path templates (~1 line)

**Total:** ~20 lines of code, ~10 test files

### Option 2 (flatten)

**features-delta-one-service:**

- feature_writer.py: Major rewrite (merge logic)
- orchestrator.py: Change output strategy
- Tests: Complete rewrite

**ml-training-service:**

- gcs_feature_reader.py: Simplified (1 file read vs 140)
- Tests: Simpler

**deployment-service:**

- catalog.py: Update path template

**Total:** ~200 lines of code changes, simpler end result

---

## Decision Factors

**Choose Option 1 (key=value) if:**

- Want BigQuery external tables ASAP
- Don't mind regenerating data
- Want minimal code changes

**Choose Option 2 (flatten) if:**

- Want simplest possible queries
- Want 140x fewer GCS operations
- OK with larger code changes upfront

**Choose Option 3 (no change) if:**

- Need system working NOW
- Can live without BigQuery external tables
- GCS reader + manual ETL is acceptable
