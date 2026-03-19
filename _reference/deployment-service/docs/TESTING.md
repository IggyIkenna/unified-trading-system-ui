# Testing Walkthrough

**Last consolidated:** 2026-02-09

This guide walks you through testing all 11 services in dependency order, from `instruments-service` to `execution-service`.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Service 1: instruments-service](#service-1-instruments-service)
3. [Service 2: market-tick-data-handler](#service-2-market-tick-data-handler)
4. [Service 3: market-data-processing-service](#service-3-market-data-processing-service)
5. [Service 4: features-delta-one-service](#service-4-features-delta-one-service)
6. [Service 5: features-volatility-service](#service-5-features-volatility-service)
7. [Service 6: features-onchain-service](#service-6-features-onchain-service)
8. [Service 7: ml-training-service](#service-7-ml-training-service)
9. [Service 8: ml-inference-service](#service-8-ml-inference-service)
10. [Service 9: strategy-service](#service-9-strategy-service)
11. [Service 10: execution-service](#service-10-execution-service)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Environment Setup

```bash
# Clone the deployment repo
cd /path/to/unified-trading-system-repos
cd deployment-service

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install the deployment CLI
pip install -e .
```

### 2. GCP Authentication

```bash
# Login to GCP
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project test-project
gcloud config set run/region asia-northeast1
```

### 3. Verify CLI Works

```bash
# List available services
python deploy.py list-services

# Check a service info
python deploy.py info -s instruments-service

# List venues
python deploy.py venues
```

### 4. Verify GCP Resources

Run these commands to verify all resources exist:

```bash
# Check Cloud Run Jobs
gcloud run jobs list --region=asia-northeast1

# Check Workflows
gcloud workflows list --location=asia-northeast1

# Check Schedulers
gcloud scheduler jobs list --location=asia-northeast1

# Check Secrets
gcloud secrets list
```

### 5. Recommended Test Date Range

Per the deployment spec, use this reduced scope for initial testing:

```
Start Date: 2023-05-01
End Date:   2024-07-31
Duration:   ~15 months
```

For quick validation, use a single day: `2024-01-15`

---

## Service 1: instruments-service

**Purpose:** Generate instrument definitions from exchange APIs

**Dependencies:** None (root service)

**Categories:** CEFI, TRADFI, DEFI

**Modes:**

- `instruments` - Generate instrument definitions
- `corporate_actions` - Fetch dividends/splits (TradFi only)

### Step 1.1: Dry Run

```bash
# Preview what shards will be created
python deploy.py deploy -s instruments-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 --dry-run
```

Expected output shows 3 shards (one per category: CEFI, TRADFI, DEFI).

### Step 1.2: Single Day Test

```bash
# Deploy for one day (all categories)
python deploy.py deploy -s instruments-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15

# Check status
python deploy.py status <deployment-id>
```

### Step 1.3: Category-Specific Test

```bash
# Test CEFI only
python deploy.py deploy -s instruments-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 --category CEFI
```

### Step 1.4: Week Test (Backfill)

```bash
# Deploy for a week (fire-and-forget)
python deploy.py deploy -s instruments-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-21 --no-wait

# Check status later
python deploy.py status <deployment-id>
```

### Step 1.5: Verify Success

```bash
# Check GCS for output
gsutil ls gs://instruments-store-cefi-test-project/instrument_availability/by_date/day-2024-01-15/

# Expected: instruments.parquet file exists
```

### Nuances

- **Two modes:** The Terraform workflow runs `instruments` mode then `corporate_actions` mode sequentially
- **Fast execution:** ~5 minutes per shard (just API calls)
- **Idempotent:** Use `--force` to re-run for existing dates

---

## Service 2: market-tick-data-handler

**Purpose:** Download raw tick data from exchanges

**Dependencies:** instruments-service (must complete first)

**Categories:** CEFI, TRADFI, DEFI

**Sharding:** category × venue × date (high parallelism)

### Step 2.1: Verify Dependencies

```bash
# Ensure instruments exist for the date
gsutil ls gs://instruments-store-cefi-test-project/instrument_availability/by_date/day-2024-01-15/
```

### Step 2.2: Dry Run

```bash
# Preview shards (will be many - one per venue per day)
python deploy.py deploy -s market-tick-data-handler -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 --category CEFI --dry-run
```

### Step 2.3: Single Venue Test

```bash
# Test one venue only
python deploy.py deploy -s market-tick-data-handler -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 \
  --category CEFI --venue BINANCE-SPOT
```

### Step 2.4: Full Category Test

```bash
# Deploy all CEFI venues for one day
python deploy.py deploy -s market-tick-data-handler -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 --category CEFI --no-wait
```

### Step 2.5: Verify Success

```bash
# Check GCS for tick data
gsutil ls gs://market-data-tick-cefi-test-project/raw_tick_data/by_date/day-2024-01-15/

# Expected: data_type-trades/, data_type-book_snapshot_5/, etc.
```

### Nuances

- **Heavy workload:** 30-60 minutes per venue (large downloads)
- **Venue filtering:** Use `--venue` to target specific exchanges
- **Force re-download:** Use `--force` to overwrite existing data
- **Data types:** trades, book_snapshot_5, derivative_ticker, liquidations, options_chain

---

## Service 3: market-data-processing-service

**Purpose:** Process tick data into OHLCV candles

**Dependencies:** market-tick-data-handler (must complete first)

**Categories:** CEFI, TRADFI, DEFI

**Timeframes:** 15s, 1m, 5m, 15m, 1h, 4h, 24h

### Step 3.1: Verify Dependencies

```bash
# Ensure tick data exists
gsutil ls gs://market-data-tick-cefi-test-project/raw_tick_data/by_date/day-2024-01-15/data_type-trades/
```

### Step 3.2: Dry Run

```bash
python deploy.py deploy -s market-data-processing-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 --category CEFI --dry-run
```

### Step 3.3: Single Day Test

```bash
python deploy.py deploy -s market-data-processing-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 --category CEFI
```

### Step 3.4: Verify Success

```bash
# Check GCS for candles
gsutil ls gs://market-data-tick-cefi-test-project/processed_candles/by_date/day-2024-01-15/

# Expected: timeframe-1m/, timeframe-5m/, timeframe-1h/, etc.
```

### Nuances

- **CPU-intensive:** Aggregates across all instruments for a day
- **Multiple timeframes:** Creates candles for 7 timeframes per run
- **~30 minutes** per shard

---

## Service 4: features-delta-one-service

**Purpose:** Generate delta-one features (technical indicators, momentum, etc.)

**Dependencies:** market-data-processing-service (needs candles)

**Categories:** CEFI, TRADFI, DEFI

**Feature Groups:** technical_indicators, moving_averages, price_momentum, volume_profile, funding_oi, liquidation_intensity, premium_basis, orderbook_imbalance, volatility_regime, correlation_features, regime_labels, rolling_returns, price_levels, swing_outcome_targets, target_labels, time_features, vwap_features

**Granularity:** Weekly (7-day chunks)

### Step 4.1: Verify Dependencies

```bash
# Ensure candles exist
gsutil ls gs://market-data-tick-cefi-test-project/processed_candles/by_date/day-2024-01-15/timeframe-1h/
```

### Step 4.2: Dry Run

```bash
python deploy.py deploy -s features-delta-one-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-21 --category CEFI --dry-run
```

### Step 4.3: Single Feature Group Test

```bash
# Test one feature group
python deploy.py deploy -s features-delta-one-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-21 --category CEFI \
  --extra-args "--feature-group technical_indicators"
```

### Step 4.4: Full Test

```bash
python deploy.py deploy -s features-delta-one-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-21 --category CEFI --no-wait
```

### Step 4.5: Verify Success

```bash
# Check GCS for features
gsutil ls gs://features-delta-one-cefi-test-project/by_date/day-2024-01-15/

# Expected: feature_group-technical_indicators/, feature_group-moving_averages/, etc.
```

### Nuances

- **17 feature groups:** Each generates independent features
- **Weekly sharding:** Processes 7 days per shard
- **~45 minutes** per shard

---

## Service 5: features-volatility-service

**Purpose:** Generate volatility features (IV surfaces, term structure)

**Dependencies:** market-tick-data-handler (reads raw options/futures data)

**Categories:** CEFI, TRADFI only (no DeFi - no options data)

**Feature Groups:** options_iv, options_term_structure, futures_basis, futures_term_structure

### Step 5.1: Verify Dependencies

```bash
# Ensure options chain data exists
gsutil ls gs://market-data-tick-cefi-test-project/raw_tick_data/by_date/day-2024-01-15/data_type-options_chain/
```

### Step 5.2: Dry Run

```bash
python deploy.py deploy -s features-volatility-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 --category CEFI --dry-run
```

### Step 5.3: Single Day Test

```bash
python deploy.py deploy -s features-volatility-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 --category CEFI
```

### Step 5.4: Verify Success

```bash
gsutil ls gs://features-volatility-cefi-test-project/by_date/day-2024-01-15/

# Expected: feature_group-options_iv/, feature_group-futures_basis/, etc.
```

### Nuances

- **No DEFI support:** Only CEFI and TRADFI have options data
- **Heavy math:** IV surface fitting is computationally expensive
- **~20 minutes** per shard

---

## Service 6: features-onchain-service

**Purpose:** Generate on-chain features (lending rates, yields, sentiment)

**Dependencies:** market-data-processing-service

**Categories:** CEFI, DEFI only (no TradFi - no on-chain data)

**Feature Groups:** macro_sentiment, lending_rates, lst_yields, onchain_perps

### Step 6.1: Dry Run

```bash
python deploy.py deploy -s features-onchain-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 --category DEFI --dry-run
```

### Step 6.2: Single Day Test

```bash
python deploy.py deploy -s features-onchain-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 --category DEFI
```

### Step 6.3: Verify Success

```bash
gsutil ls gs://features-onchain-defi-test-project/by_date/day-2024-01-15/

# Expected: feature_group-lending_rates/, feature_group-lst_yields/, etc.
```

### Nuances

- **No TRADFI support:** Only CEFI and DEFI have on-chain data
- **Fast execution:** ~10 minutes (aggregates pre-computed metrics)

---

## Service 7: ml-training-service

**Purpose:** Train ML models for swing high/low prediction

**Dependencies:** features-delta-one-service (requires features)

**Sharding:** instrument × timeframe × target_type × config

**Instruments:** BTC, ETH, SOL, SPY

**Timeframes:** 1h, 4h

**Targets:** swing_high, swing_low

### Step 7.1: Verify Dependencies

```bash
# Ensure features exist
gsutil ls gs://features-delta-one-cefi-test-project/by_date/day-2024-01-15/
```

### Step 7.2: Dry Run

```bash
python deploy.py deploy -s ml-training-service -c cloud_run \
  --start-date 2024-01-01 --end-date 2024-06-30 --dry-run
```

### Step 7.3: Single Instrument Test

```bash
# Train BTC model only
python deploy.py deploy -s ml-training-service -c cloud_run \
  --start-date 2024-01-01 --end-date 2024-06-30 \
  --extra-args "--instruments BTC --timeframes 1h --target-types swing_high"
```

### Step 7.4: Verify Success

```bash
# Check for trained models
gsutil ls gs://ml-models-store-test-project/models/

# Expected: model directories with model.joblib files
```

### Nuances

- **No date-based sharding:** Training uses all available historical data
- **GCS config files:** Can use `--grid-config gs://...` for hyperparameter configs
- **Long running:** ~2 hours per model
- **Use VMs for heavy training:** Consider `--compute vm` for better reliability

---

## Service 8: ml-inference-service

**Purpose:** Generate predictions using trained models

**Dependencies:** ml-training-service (requires models), features-delta-one-service (requires features)

**Sharding:** instrument × timeframe × target_type × date

### Step 8.1: Verify Dependencies

```bash
# Ensure models exist
gsutil ls gs://ml-models-store-test-project/model_registry/

# Ensure features exist for inference date
gsutil ls gs://features-delta-one-cefi-test-project/by_date/day-2024-01-15/
```

### Step 8.2: Dry Run

```bash
python deploy.py deploy -s ml-inference-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 --dry-run
```

### Step 8.3: Single Day Test

```bash
python deploy.py deploy -s ml-inference-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 \
  --extra-args "--instrument-ids BTC --timeframes 1h"
```

### Step 8.4: Verify Success

```bash
gsutil ls gs://ml-predictions-store-test-project/predictions/batch/2024-01-15/
```

### Nuances

- **Fast inference:** ~15 minutes once models are loaded
- **Requires trained models:** Run ml-training-service first

---

## Service 9: strategy-service

**Purpose:** Test trading signals via strategy backtesting

**Dependencies:** features-delta-one-service, ml-inference-service (optional)

**Sharding:** category × config × date (weekly)

### Step 9.1: Ensure Strategy Configs Exist

```bash
# Strategy configs are stored in GCS
gsutil ls gs://strategy-store-cefi-test-project/configs_grid/

# If empty, create a config first
```

### Step 9.2: Dry Run

```bash
python deploy.py deploy -s strategy-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-21 --category CEFI --dry-run
```

### Step 9.3: Test with Config

```bash
python deploy.py deploy -s strategy-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-21 --category CEFI \
  --extra-args "--config-gcs gs://strategy-store-cefi-test-project/configs_grid/my_strategy.json"
```

### Step 9.4: Verify Success

```bash
gsutil ls gs://strategy-store-cefi-test-project/signals/
gsutil ls gs://strategy-store-cefi-test-project/backtest_results/
```

### Nuances

- **GCS config required:** Strategy configs must exist in GCS
- **Weekly sharding:** Groups dates into 7-day chunks
- **~30 minutes** per shard

---

## Service 10: execution-service

**Purpose:** Backtest execution on tick-level data

**Dependencies:** strategy-service (needs signals), market-tick-data-handler (needs tick data)

**Sharding:** domain × config × date (daily)

**Domains:** cefi, tradfi, defi (lowercase)

### Step 10.1: Ensure Execution Configs Exist

```bash
# Execution configs are stored in GCS
gsutil ls gs://execution-store-cefi-test-project/grid_configs/

# If empty, create configs first
```

### Step 10.2: Dry Run

```bash
python deploy.py deploy -s execution-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 \
  --extra-args "--domain cefi" --dry-run
```

### Step 10.3: Test with Config

```bash
python deploy.py deploy -s execution-service -c cloud_run \
  --start-date 2024-01-15 --end-date 2024-01-15 \
  --extra-args "--domain cefi --config-gcs gs://execution-store-cefi-test-project/grid_configs/btc_momentum.json"
```

### Step 10.4: Verify Success

```bash
gsutil ls gs://execution-store-cefi-test-project/backtest_results/
```

### Nuances

- **Very heavy workload:** Tick-by-tick execution simulation (~90 minutes)
- **GCS config required:** Execution configs must exist in GCS
- **Use VMs for reliability:** Consider `--compute vm` for long runs
- **Domains are lowercase:** cefi, tradfi, defi (not CEFI)

---

## Troubleshooting

### Common Issues

#### 1. Rate Limit Exceeded (429)

```
Error: Resource exhausted
```

**Solution:** Reduce parallel jobs or use `--max-threads 10`

```bash
python deploy.py deploy ... --max-threads 10
```

#### 2. Cloud Run Job Not Found

```
Error: Job 'instruments-service' not found
```

**Solution:** Apply Terraform first

```bash
cd terraform/services/instruments-service/gcp
terraform init
terraform apply
```

#### 3. Docker Image Not Found

```
Error: Unable to fetch image
```

**Solution:** Build and push the Docker image via Cloud Build

```bash
# Check if image exists
gcloud artifacts docker images list \
  asia-northeast1-docker.pkg.dev/test-project/instruments/instruments-service
```

#### 4. Permission Denied on GCS

```
Error: 403 Forbidden
```

**Solution:** Grant the service account storage access

```bash
gcloud projects add-iam-policy-binding test-project \
  --member="serviceAccount:instruments-service-cloud-run@test-project.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

#### 5. Secret Not Found

```
Error: Secret 'tardis-api-key' not found
```

**Solution:** Create the secret in Secret Manager

```bash
echo -n "your-api-key" | gcloud secrets create tardis-api-key --data-file=-
```

### Monitoring Commands

```bash
# List recent deployments
python deploy.py list --limit 10

# Check specific deployment
python deploy.py status <deployment-id>

# Resume failed deployment
python deploy.py resume <deployment-id>

# Cancel running deployment
python deploy.py cancel <deployment-id>

# View Cloud Run job executions
gcloud run jobs executions list --job=instruments-service --region=asia-northeast1
```

### Useful GCS Commands

```bash
# Check data completeness for a date
gsutil ls gs://instruments-store-cefi-test-project/instrument_availability/by_date/day-2024-01-15/

# Download and inspect a file
gsutil cp gs://instruments-store-cefi-test-project/instrument_availability/by_date/day-2024-01-15/instruments.parquet /tmp/
python -c "import pandas as pd; print(pd.read_parquet('/tmp/instruments.parquet'))"
```

---

## Quick Reference: Deployment Order

| Order | Service                        | Depends On          | Est. Time/Shard |
| ----- | ------------------------------ | ------------------- | --------------- |
| 1     | instruments-service            | (none)              | ~5 min          |
| 2     | market-tick-data-handler       | instruments         | ~60 min         |
| 3     | market-data-processing-service | tick-data           | ~30 min         |
| 4     | features-delta-one-service     | candles             | ~45 min         |
| 5     | features-volatility-service    | tick-data           | ~20 min         |
| 6     | features-onchain-service       | candles             | ~10 min         |
| 7     | ml-training-service            | features            | ~120 min        |
| 8     | ml-inference-service           | models + features   | ~15 min         |
| 9     | strategy-service               | features            | ~30 min         |
| 10    | execution-service              | signals + tick-data | ~90 min         |

---

## Category Support Matrix

| Service                        | CEFI                  | TRADFI | DEFI |
| ------------------------------ | --------------------- | ------ | ---- |
| instruments-service            | Yes                   | Yes    | Yes  |
| market-tick-data-handler       | Yes                   | Yes    | Yes  |
| market-data-processing-service | Yes                   | Yes    | Yes  |
| features-delta-one-service     | Yes                   | Yes    | Yes  |
| features-volatility-service    | Yes                   | Yes    | No   |
| features-onchain-service       | Yes                   | No     | Yes  |
| ml-training-service            | All (via instruments) |        |      |
| ml-inference-service           | All (via instruments) |        |      |
| strategy-service               | Yes                   | Yes    | Yes  |
| execution-service              | Yes                   | Yes    | Yes  |
