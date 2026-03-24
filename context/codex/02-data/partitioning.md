# Data Partitioning Conventions

## TL;DR

- **Universal partition key**: `by_date/day={date}/` -- every service partitions by date.
- **Bucket naming**: `{domain}-{category_lower}-{project_id}` for category-scoped; `{domain}-{project_id}` for shared.
- **Three categories**: CEFI, TRADFI, DEFI -- each gets its own bucket for category-scoped data.
- **Additional dimensions** vary by service: timeframe, data_type, instrument_type, feature_group, etc.
- **Hive-style partitioning**: `key=value/` directory structure for partition pushdown in queries.
- Path templates are defined in `dependencies.yaml` and are the single source of truth.
- Instrument files are named by instrument ID; feature files are named by feature group.

---

## GCS Path Conventions

### Universal Structure

Every GCS path follows this pattern:

```
gs://{bucket}/{prefix}/by_date/day={date}/{additional_dimensions}/{filename}.parquet
```

### Path Templates by Service

| Service                                        | Bucket Template                    | Path Template                                                                                                             |
| ---------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| instruments-service                            | `instruments-store-{cat}-{proj}`   | `instrument_availability/by_date/day={date}/instruments.parquet`                                                          |
| instruments-service (corporate-actions domain) | `instruments-store-{cat}-{proj}`   | `corporate_actions/by_date/day={date}/`                                                                                   |
| market-tick-data-service                       | `market-data-tick-{cat}-{proj}`    | `raw_tick_data/by_date/day={date}/data_type={data_type}/instrument_type={asset_class}/venue={venue}/{instrument}.parquet` |
| market-data-processing                         | `market-data-tick-{cat}-{proj}`    | `processed_candles/by_date/day={date}/timeframe={timeframe}/data_type={data_type}/{asset_class}/{instrument}.parquet`     |
| features-delta-one                             | `features-delta-one-{cat}-{proj}`  | `by_date/day={date}/feature_group={feature_group}/timeframe={timeframe}/{instrument}.parquet`                             |
| features-volatility                            | `features-volatility-{cat}-{proj}` | `by_date/day={date}/feature_group={feature_group}/timeframe={timeframe}/{underlying}.parquet`                             |
| features-onchain                               | `features-onchain-{proj}`          | `by_date/day={date}/feature_group={feature_group}/features.parquet`                                                       |
| features-calendar                              | `features-calendar-{proj}`         | `calendar/category={type}/by_date/day={date}/features.parquet`                                                            |
| features-sports                                | `features-sports-{proj}`           | `by_date/day={date}/feature_group={feature_group}/horizon={horizon}/{fixture}.parquet`                                    |
| ml-training (stage 1)                          | `ml-training-artifacts-{proj}`     | `stage1-preselection/model-{model_id}/training-period-{period}/selected_features.json`                                    |
| ml-training (stage 2)                          | `ml-training-artifacts-{proj}`     | `stage2-hyperparams/model-{model_id}/training-period-{period}/best_hyperparams.json`                                      |
| ml-training (final)                            | `ml-models-store-{proj}`           | `models/{model_id}/training-period-{period}/model.joblib`                                                                 |
| ml-inference                                   | `ml-predictions-store-{proj}`      | `predictions/{mode}/{date}/`                                                                                              |
| strategy-service                               | `strategy-store-{proj}`            | `strategy_instructions/strategy_id={strategy_id}/day={date}/instructions.parquet`                                         |
| execution-service                              | `execution-store-{proj}`           | `results/date={date}/strategy_id={strategy_id}/instruction_type={type}/run_id={run_id}/`                                  |

---

## Bucket Naming Convention

### Category-Scoped Buckets

For data that is inherently tied to a market category:

```
{domain}-{category_lower}-{project_id}

Examples:
  instruments-store-cefi-test-project
  instruments-store-tradfi-test-project
  instruments-store-defi-test-project
  market-data-tick-cefi-test-project
  features-delta-one-tradfi-test-project
```

### Shared Buckets (No Category)

For data that applies across categories:

```
{domain}-{project_id}

Examples:
  features-calendar-test-project       # Calendar features are domain-independent
  features-onchain-test-project         # On-chain metrics apply across CeFi/DeFi
  ml-models-store-test-project          # Models are not category-scoped
  ml-predictions-store-test-project
  strategy-store-test-project
  execution-store-test-project
```

### Why Some Buckets Are Shared

| Domain            | Shared? | Reason                                                          |
| ----------------- | ------- | --------------------------------------------------------------- |
| features-calendar | Yes     | Calendar/temporal features are identical regardless of category |
| features-onchain  | Yes     | On-chain metrics (TVL, sentiment) apply to both CeFi and DeFi   |
| ml-models-store   | Yes     | Models can train on cross-category features                     |
| ml-predictions    | Yes     | Predictions reference specific instruments, not categories      |
| strategy-store    | Yes     | Strategies may span categories                                  |
| execution-store   | Yes     | Execution results reference specific strategy runs              |

---

## Category Dimension

Four categories partition the asset class universe:

| Category | Value               | Description                                                      |
| -------- | ------------------- | ---------------------------------------------------------------- |
| CEFI     | `cefi` (in paths)   | Centralized crypto exchanges + on-chain CLOBs                    |
| TRADFI   | `tradfi` (in paths) | Traditional finance (equities, futures, FX)                      |
| DEFI     | `defi` (in paths)   | Decentralized protocols (AMM, lending, LST)                      |
| SPORTS   | `sports` (in paths) | Betting exchanges and bookmakers (Betfair, Pinnacle, Polymarket) |

Category mapping is defined in `dependencies.yaml`:

```yaml
category_domain_mapping:
  CEFI: cefi
  TRADFI: tradfi
  DEFI: defi
  SPORTS: sports
```

---

## Venue Dimension

Venues are defined in `venues.yaml` and are the canonical list:

### CEFI Venues

`BINANCE-SPOT`, `BINANCE-FUTURES`, `DERIBIT`, `BYBIT`, `OKX`, `UPBIT`, `COINBASE`, `HYPERLIQUID`, `ASTER`

### TRADFI Venues

`CME`, `CBOE`, `NASDAQ`, `NYSE`, `ICE`, `FX`

### DEFI Venues

`UNISWAPV2-ETHEREUM`, `UNISWAPV3-ETHEREUM`, `UNISWAPV4-ETHEREUM`, `CURVE-ETHEREUM`, `AAVEV3_ETHEREUM`, `MORPHO-ETHEREUM`, `LIDO`, `ETHERFI`,
`ETHENA`

---

## Date Dimension

- **Granularity**: daily (`day=YYYY-MM-DD`)
- **Format**: ISO 8601 date string
- **Timezone**: all dates are UTC
- **Non-trading days**: no data files created for weekends/holidays (TradFi); CeFi/DeFi have data every day

---

## Service-Specific Extra Dimensions

### data_type

Used by market-tick-data-service and market-data-processing-service:

| Category | Data Types                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------- |
| CEFI     | `trades`, `book_snapshot_5`, `derivative_ticker`, `liquidations`, `options_chain`                                         |
| TRADFI   | `trades`, `ohlcv_1m`, `ohlcv_15m`, `ohlcv_24h`, `tbbo`                                                                    |
| DEFI     | `swaps`, `rate_indices`, `oracle_prices`, `utilization`, `liquidity`, `risk_params`, `flash_loan_availability`, `rewards` |

### instrument_type

Determined by venue (from `venues.yaml`):

| Venue              | Instrument Types          |
| ------------------ | ------------------------- |
| BINANCE-SPOT       | SPOT_PAIR                 |
| BINANCE-FUTURES    | PERPETUAL, FUTURE         |
| DERIBIT            | PERPETUAL, FUTURE, OPTION |
| CME                | FUTURE, OPTION            |
| NASDAQ, NYSE       | EQUITY, ETF               |
| UNISWAPV3-ETHEREUM | POOL                      |
| AAVEV3_ETHEREUM    | POOL                      |
| LIDO, ETHERFI      | LST                       |

### timeframe

Used by market-data-processing-service and features-delta-one-service:

```
15s, 1m, 5m, 15m, 1h, 4h, 24h
```

### feature_group

Used by features-delta-one-service (~20 groups):

```
technical_indicators, moving_averages, oscillators, volatility_realized,
momentum, volume_analysis, vwap, candlestick_patterns, market_structure,
returns, round_numbers, streaks, microstructure, funding_oi, liquidations,
futures_basis, volume_flow, temporal, economic_events, targets,
swing_outcome_targets
```

---

## Path Construction Example

To construct the full GCS path for a specific data file:

```python
# Features delta-one for BTC on Binance Futures, momentum group, 5m timeframe, Jan 15 2024
bucket = f"features-delta-one-cefi-{project_id}"
path = (
    f"by_date/day=2024-01-15/"
    f"feature_group=momentum/"
    f"timeframe=5m/"
    f"BINANCE-FUTURES_PERPETUAL_BTC-USDT@LIN.parquet"
)
full_path = f"gs://{bucket}/{path}"

# Result:
# gs://features-delta-one-cefi-test-project/
#   by_date/day=2024-01-15/feature_group=momentum/timeframe=5m/
#   BINANCE-FUTURES_PERPETUAL_BTC-USDT@LIN.parquet
```

In practice, domain clients handle path construction automatically. Services never need to build paths manually.

---

## BigQuery External Tables: Why Hive Partitioning Matters

### The Cost Optimization

All GCS paths use `key=value` folder naming (Hive-style partitioning) to enable **BigQuery external tables**. External
tables query GCS Parquet files in-place without loading them into BigQuery storage, eliminating data duplication and
storage costs.

```sql
-- Create external table pointing to GCS
CREATE EXTERNAL TABLE `project.features_delta_one.features_5m`
OPTIONS (
  format = 'PARQUET',
  uris = ['gs://features-delta-one-cefi-{project_id}/by_date/day=*/feature_group=*/timeframe=5m/*.parquet'],
  hive_partition_uri_prefix = 'gs://features-delta-one-cefi-{project_id}/by_date',
  require_hive_partition_filter = true
);

-- Query partitions directly (BigQuery scans only matching folders)
SELECT * FROM `project.features_delta_one.features_5m`
WHERE day = '2024-01-15'
  AND feature_group = 'momentum';
```

**Cost comparison**:

| Approach           | Storage Cost                     | Query Cost       | Total (1 year, 100 TB) |
| ------------------ | -------------------------------- | ---------------- | ---------------------- |
| Load into BigQuery | $20/TB active + $10/TB long-term | $6.25/TB scanned | $3,000 + $625/query    |
| External tables    | $20/TB (GCS only)                | $6.25/TB scanned | $2,000 + $625/query    |

Savings: $1,000/year by avoiding BigQuery storage duplication. External tables are the primary cost optimization for
analytics.

### Primary vs Optional Query Path

**Primary (production ML training):**

- GCS Parallel Reader -- reads Parquet directly via `pandas.read_parquet()`
- Speed: 20-30 seconds for typical queries
- Cost: $0 (GCS storage only, no query cost)
- Use case: batch ML training, feature generation

**Optional (development/analysis):**

- BigQuery external tables -- SQL queries over GCS data
- Speed: 2 seconds for typical queries (10-20x faster)
- Cost: $6.25/TB scanned
- Use case: ad-hoc exploration, debugging, quality checks, dashboard queries

### Schema Compatibility Requirements

For BigQuery external tables to work, GCS paths MUST use `key=value` format:

| Valid (Hive)              | Invalid           | BigQuery Result                     |
| ------------------------- | ----------------- | ----------------------------------- |
| `day=2024-01-15/`         | `day-2024-01-15/` | Partition not recognized, full scan |
| `feature_group=momentum/` | `group-momentum/` | Partition not recognized            |
| `timeframe=5m/`           | `5m/`             | Partition not recognized            |

All 12 services already use the `key=value` format [IMPLEMENTED]. Legacy data with `prefix-value` format is
automatically ignored by external tables (no data corruption risk).

### When External Tables Auto-Refresh

External tables do NOT cache data. Every query reads directly from GCS. This means:

- **Automatic freshness**: as soon as a service writes a new Parquet file to GCS, it is immediately queryable via the
  external table (no refresh command needed)
- **No ETL lag**: traditional BigQuery tables require ETL pipelines with delays; external tables are real-time with
  respect to GCS writes
- **Partition discovery**: BigQuery scans the URI pattern on every query; new partitions are discovered automatically

This is why Hive partitioning is critical for live operations -- monitoring dashboards can query the latest data without
any refresh or ETL step.

---

## Live vs Batch Data Routing

### Convention

Same bucket, different top-level prefix:

```
gs://{bucket}/
  live/                                         ← streaming micro-batches
    venue={venue}/instrument={instrument}/
      window=2026-03-18T01:00Z.parquet          ← 1-5 minute windows
      window=2026-03-18T01:05Z.parquet
      ...
  by_date/                                      ← daily accumulated batch
    day=2026-03-18/
      data_type={data_type}/
        venue={venue}/
          {instrument}.parquet
```

- **Batch** (default): daily Hive-partitioned files under `by_date/`. Written once per day by batch jobs.
- **Live**: micro-batch window files under `live/`. Written every 1-5 minutes by streaming subscribers.

Both use Hive `key=value/` partitioning. Both are queryable by BigQuery external tables.

### Micro-Batch Strategy (Live Mode)

Services in live mode (`SERVICE_MODE=live`) buffer data in-memory and flush to GCS on a window interval:

1. PubSub subscriber receives events
2. Accumulates in a buffer (1-5 minutes, configurable per service)
3. Writes a single Parquet file per window per instrument to `live/venue=X/instrument=Y/window={ISO_timestamp}.parquet`
4. At end-of-day, a compaction job composes window files into the daily `by_date/` partition via GCS object compose

**Why micro-batch, not per-event:**

- GCS charges per write operation ($0.005 per 1,000 ops)
- Tiny objects (<1 KB) waste storage overhead and slow list operations
- 1-minute windows at 100 instruments = 144,000 files/day — manageable
- Per-event at 1000 events/sec = 86M files/day — unmanageable

### End-of-Day Compaction

```python
# GCS compose merges up to 32 source objects into one destination
# For >32 windows, chain compose calls (compose first 32, then compose result with next batch)
storage_client.compose(
    bucket="market-data-tick-defi-{project_id}",
    sources=["live/venue=HYPERLIQUID/instrument=BTC-USD/window=2026-03-18T00:00Z.parquet", ...],
    destination="by_date/day=2026-03-18/data_type=trades/venue=HYPERLIQUID/BTC-USD.parquet",
)
# After successful compose, delete the live window files
```

### UCI Integration

`get_data_source()` accepts `mode="live"` or `mode="batch"` (default):

```python
from unified_cloud_interface import get_data_source

# Batch (default) — reads from by_date/ prefix
source = get_data_source(routing_key="defi", prefix="by_date")

# Live — reads from live/ prefix (auto-prepended)
source = get_data_source(routing_key="defi", prefix="venue=HYPERLIQUID", mode="live")
```

`StorageDataSource` prepends `live/` to the prefix when `mode="live"`.

### AWS S3 Compatibility

The `live/` and `by_date/` prefixes work identically on S3. S3 uses the same `key=value/` convention for
Hive-compatible partitioning (Athena, Glue, Redshift Spectrum all support it).
