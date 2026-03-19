# Market-Data-Processing-Service - GCS Schema Change

## Current Structure (prefix-value)

```
gs://market-data-candles-{category}-{project}/
  processed_candles/
    by_date/
      day-2023-05-23/
        timeframe-1m/
          BINANCE-FUTURES:PERPETUAL:BTC-USDT.parquet
        timeframe-5m/
          BINANCE-FUTURES:PERPETUAL:BTC-USDT.parquet
        [... 7 timeframes]
```

**Path Format:** `processed_candles/by_date/day-{date}/timeframe-{tf}/{inst}.parquet`

**Levels:** 3 (day, timeframe, file)

---

## Required for BigQuery Hive Partitioning (key=value)

```
gs://market-data-candles-{category}-{project}/
  processed_candles/
    by_date/
      day=2023-05-23/
        timeframe=1m/
          BINANCE-FUTURES:PERPETUAL:BTC-USDT.parquet
```

**Path Format:** `processed_candles/by_date/day={date}/timeframe={tf}/{inst}.parquet`

**Changes:**

- `day-` → `day=`
- `timeframe-` → `timeframe=`

**Structure:** UNCHANGED (still 3 levels)
**Nesting order:** UNCHANGED (day → timeframe → file)
**Change type:** FORMATTING ONLY (character replacement)

---

## Code Changes Required

**File:** Output path builder (estimated location)

**Current:**

```python
def build_candle_output_path(date, timeframe, instrument_id):
    return f"processed_candles/by_date/day-{date}/timeframe-{timeframe}/{instrument_id}.parquet"
```

**New:**

```python
def build_candle_output_path(date, timeframe, instrument_id):
    return f"processed_candles/by_date/day={date}/timeframe={timeframe}/{instrument_id}.parquet"
```

**Lines changed:** ~3 lines (find/replace)

---

## Downstream Impact

**Services that read candles:**

- features-delta-one-service (main consumer)
- deployment-service (missing data checker)

**Locations to update:** ~10-15

---

## BigQuery External Table (After Migration)

```sql
CREATE EXTERNAL TABLE candles.all_candles
HIVE PARTITIONING:
  mode: AUTO
  sourceUriPrefix: gs://market-data-candles-cefi-{project}/processed_candles/by_date/

PARTITION BY day
CLUSTER BY instrument_id, timeframe

-- Query
SELECT * FROM all_candles
WHERE day = '2023-05-23'
  AND timeframe = '1m'
  AND instrument_id = 'BTC';
```

**Performance:** 7x faster (partition filter + cluster)

---

## Breaking Changes

**Severity:** MEDIUM

**Locations affected:** ~15

- market-data-processing output (~3)
- features-delta-one input (~10)
- deployment-service (~2)

**Mitigation:** Find/replace `day-` → `day=`, `timeframe-` → `timeframe=`
