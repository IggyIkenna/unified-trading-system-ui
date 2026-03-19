# Market-Tick-Data-Handler - GCS Schema Change

## Current Structure (prefix-value, 7 levels deep)

```
gs://market-data-tick-{category}-{project}/
  raw_tick_data/
    by_date/
      day-2023-05-23/
        data_type-trades/
          futures_chain/
            BINANCE-FUTURES/
              BTC-USDT/
                BINANCE-FUTURES:FUTURE:BTC-USDT-230630@LIN.parquet
```

**Path Format:**

```
raw_tick_data/by_date/day-{date}/data_type-{type}/{instrument_type}/{venue}/{symbol}/{file}.parquet
```

**Example Real Path:**

```
raw_tick_data/by_date/day-2023-05-23/data_type-book_snapshot_5/futures_chain/BINANCE-FUTURES/BTC-USDT/BINANCE-FUTURES:FUTURE:BTC-USDT-230630@LIN.parquet
```

---

## Required for BigQuery Hive Partitioning (key=value)

```
gs://market-data-tick-{category}-{project}/
  raw_tick_data/
    by_date/
      day=2023-05-23/
        data_type=trades/
          instrument_type=futures_chain/
            venue=BINANCE-FUTURES/
              symbol=BTC-USDT/
                BINANCE-FUTURES:FUTURE:BTC-USDT-230630@LIN.parquet
```

**Path Format:**

```
raw_tick_data/by_date/day={date}/data_type={type}/instrument_type={asset_class}/venue={venue}/{identifier}.parquet
```

**Changes:**

- `day-` → `day=`
- `data_type-` → `data_type=`
- Add `instrument_type=` prefix to folder
- Add `venue=` prefix
- Filename: `{identifier}.parquet` (no key=value in filename; Hive uses path segments only)

---

## Code Changes Required

### File: Output path construction

**Current:**

```python
def _build_output_path(self, date, data_type, instrument_type, venue, symbol):
    return (
        f"raw_tick_data/by_date/day-{date}/"
        f"data_type-{data_type}/{instrument_type}/{venue}/{symbol}/"
    )
```

**New (matches gcs_path_utils.build_raw_tick_data_path):**

```python
def build_raw_tick_data_path(date_str, data_type, asset_class, venue, identifier):
    base = f"raw_tick_data/by_date/day={date_str}/data_type={data_type}/"
    if asset_class:
        return f"{base}instrument_type={asset_class}/venue={venue}/{identifier}.parquet"
    return f"{base}venue={venue}/{identifier}.parquet"
```

**Lines changed:** ~10 lines

---

## Downstream Impact

**HIGH IMPACT - Major consumer services:**

**market-data-processing-service:**

- Reads market-tick to generate candles
- Path construction in ~15 locations
- Must update all GCS read paths

**features-delta-one-service:**

- May read tick data directly in some calculators
- Less common but needs checking

**deployment-service:**

- Missing data checker
- Path templates
- Data status display

**Total locations to update:** ~30-40

---

## BigQuery External Table (After Migration)

```sql
CREATE EXTERNAL TABLE market_tick.all_ticks
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://market-data-tick-cefi-*/raw_tick_data/by_date/**/*.parquet'],
  hive_partitioning_options = '{
    "mode": "AUTO",
    "sourceUriPrefix": "gs://market-data-tick-cefi-test-project/raw_tick_data/by_date/",
    "requirePartitionFilter": true
  }'
);

-- Hive partitioning automatically extracts from path segments:
-- day, data_type, instrument_type, venue as queryable columns.
-- Instrument identifier is in filename ({identifier}.parquet), not a path partition.

-- Query
SELECT * FROM all_ticks
WHERE day = '2023-05-23'  -- Partition filter (required)
  AND data_type = 'trades'  -- Hive column
  AND venue = 'BINANCE-FUTURES';  -- Hive column
```

**Query Performance:**

- Without hive: Scan all files (~2 TB)
- With hive: Scan only relevant partition (~10 GB)
- **Speedup:** 200x faster, 200x cheaper!

---

## Breaking Changes

**Severity:** HIGH (complex structure, many consumers)

**Affected Services:**

- market-tick-data-handler output (~10 locations)
- market-data-processing input (~15 locations)
- features services (~5 locations)
- deployment-service (~10 locations)

**Total:** ~40 locations need path updates

**Risk:** High - main data pipeline dependency

**Mitigation:**

- Dual-path support during transition
- Extensive testing required
- Phased rollout recommended
