# Local Service Development Run Guide

Run each core service locally in batch mode with `CLOUD_PROVIDER=local`.
Purpose: surface missing env vars, import errors, and config gaps before deploying to GCP sandbox.

---

## Startup Order (DAG)

Services must be started in this order — each depends on its predecessor:

```
1. instruments-service          (gates all others)
2. market-data-processing-service
3. features-delta-one-service
4. strategy-service
5. execution-service
```

---

## Common Prerequisites

```bash
# Activate workspace venv
source /Users/ikennaigboaka/Documents/repos/unified-trading-system-repos/.venv-workspace/bin/activate

# Verify
which python   # must be .venv-workspace/bin/python
python --version  # must be 3.13.x

# GCP Application Default Credentials (used when CLOUD_PROVIDER=gcp in tests)
gcloud auth application-default login
```

---

## Service 1: instruments-service

### Entry point

```bash
python -m instruments_service.cli.main
```

### Minimum env vars for local batch run

```bash
export CLOUD_PROVIDER=local
export SERVICE_MODE=batch
export ENVIRONMENT=development
export GCP_PROJECT_ID=local-dev

# Category flags (at least one required)
export ENABLE_CEFI=true

# CSV sampling — avoids GCS downloads
export ENABLE_CSV_SAMPLING=true
export CSV_SAMPLE_SIZE=100
export CSV_SAMPLE_DIR=./data/samples

# Caching
export enable_metadata_caching=true
export cache_ttl_hours=24
export max_batch_size=100
```

### Run command

```bash
cd instruments-service
SERVICE_MODE=batch CLOUD_PROVIDER=local \
  python -m instruments_service.cli.main \
  --CEFI --start-date 2024-01-02 --end-date 2024-01-02 \
  --log-level DEBUG
```

### Known blockers

- `CLOUD_PROVIDER=local` is not a first-class provider in `UnifiedCloudConfig` — the config module
  resolves `gcp` or `aws`; running with `CLOUD_PROVIDER=local` will cause `get_storage_client()` to
  fail unless `USE_MOCK_DATA=true` or a local stub is patched in.
- GCS bucket env vars (`INSTRUMENTS_GCS_BUCKET_CEFI` etc.) are validated at startup — set them to
  any non-empty string when using mock data.
- Secret Manager calls (`TARDIS_SECRET_NAME`, `DATABENTO_SECRET_NAME`) will fail without ADC or
  `USE_SECRET_MANAGER=false` override.

### Workaround for local-only run

```bash
export INSTRUMENTS_GCS_BUCKET_CEFI=local-mock-bucket
export INSTRUMENTS_GCS_BUCKET_TRADFI=local-mock-bucket
export INSTRUMENTS_GCS_BUCKET_DEFI=local-mock-bucket
export USE_MOCK_DATA=true
export USE_SECRET_MANAGER=false
```

---

## Service 2: market-data-processing-service

### Entry point

```bash
python -m market_data_processing_service.cli.main
```

### Minimum env vars for local batch run

```bash
export CLOUD_PROVIDER=local
export SERVICE_MODE=batch
export ENVIRONMENT=development
export GCP_PROJECT_ID=local-dev
export LOCAL_MEMORY_LIMIT_MB=4096
export ENABLE_CSV_SAMPLING=true
export CSV_SAMPLE_SIZE=1000
export CSV_SAMPLE_DIR=./data/samples
export USE_MOCK_DATA=true
export TEST_MODE=true
```

### Run command

```bash
cd market-data-processing-service
SERVICE_MODE=batch CLOUD_PROVIDER=local ENVIRONMENT=development \
  python -m market_data_processing_service.cli.main \
  --log-level DEBUG
```

### Known blockers

- `validate_startup()` in `cli/main.py` calls `get_storage_client()` which requires live GCS.
  Set `USE_MOCK_DATA=true` and `TEST_MODE=true` to bypass.
- `MarketDataProcessingServiceConfig` extends `BaseServiceConfig` — Pydantic model validates all
  required fields at import time. Missing `GCP_PROJECT_ID` raises `ValidationError`.
- BigQuery access is required for candle upload; not available locally without mock.

---

## Service 3: features-delta-one-service

### Entry point

```bash
python -m features_delta_one_service.cli.main
```

### Minimum env vars for local batch run

```bash
export CLOUD_PROVIDER=local
export SERVICE_MODE=batch
export ENVIRONMENT=development
export GCP_PROJECT_ID=local-dev
export GCS_BUCKET=local-mock-bucket
export USE_SECRET_MANAGER=false
export USE_NUMBA=false          # skip JIT warmup for local dev
export ENABLE_PROFILING=false
export LOG_LEVEL=DEBUG
```

### Run command

```bash
cd features-delta-one-service
SERVICE_MODE=batch CLOUD_PROVIDER=local USE_SECRET_MANAGER=false USE_NUMBA=false \
  python -m features_delta_one_service.cli.main \
  --mode batch --category CEFI --feature-group technical_indicators \
  --start-date 2024-01-02 --end-date 2024-01-02 \
  --log-level DEBUG
```

### Known blockers

- Tardis API key is required for market data download. Use `USE_SECRET_MANAGER=false` and provide
  a mock key or use cached CSV samples from market-data-processing-service output.
- Numba JIT compilation adds ~30 s warmup time even locally; set `USE_NUMBA=false` for dev.
- `LocalFsEventSink` is already used in features-delta-one (no PubSub dependency for local mode).

---

## Service 4: strategy-service

### Entry point

```bash
python -m strategy_service.cli.main
```

### Minimum env vars for local batch run

```bash
export CLOUD_PROVIDER=local
export SERVICE_MODE=batch
export ENVIRONMENT=development
export GCP_PROJECT_ID=local-dev
export STRATEGY_GCS_BUCKET=local-mock-bucket
export EXECUTION_GCS_BUCKET=local-mock-bucket
export USE_SECRET_MANAGER=false
export LOG_LEVEL=DEBUG
```

### Run command

```bash
cd strategy-service
SERVICE_MODE=batch CLOUD_PROVIDER=local USE_SECRET_MANAGER=false \
  python -m strategy_service.cli.main \
  --mode batch \
  --log-level DEBUG
```

### Known blockers

- `_validate_startup()` in `cli/main.py` calls `get_storage_client()` — will fail without GCS.
  Pass `--skip-validation` if that flag exists, or mock the storage client.
- `MockEventSink` is already imported and used at module level (`setup_events(mode="local", ...)`),
  so event dispatch works without PubSub.
- Strategy config requires at minimum one strategy definition file (GCS path or local path).

---

## Service 5: execution-service

### Entry point

```bash
python -m execution_service backtest --config <path> --start 2024-01-02 --end 2024-01-02
```

### Minimum env vars for local batch run

```bash
export CLOUD_PROVIDER=local
export SERVICE_MODE=batch
export ENVIRONMENT=development
export GCP_PROJECT_ID=local-dev
export UNIFIED_CLOUD_SERVICES_GCS_BUCKET=local-mock-bucket
export EXECUTION_STORE_GCS_BUCKET=local-mock-bucket
export INSTRUMENTS_STORE_GCS_BUCKET=local-mock-bucket
export STRATEGY_STORE_BUCKET=local-mock-bucket
export USE_DATABASE=false
export BACKTEST_LOG_LEVEL=DEBUG
export DATA_CATALOG_PATH=.cache/nautilus/
export USE_SECRET_MANAGER=false
```

### Run command

```bash
cd execution-service
CLOUD_PROVIDER=local USE_SECRET_MANAGER=false \
  python -m execution_service backtest \
  --config tests/fixtures/sample_backtest_config.yaml \
  --start 2024-01-02 --end 2024-01-02
```

### Known blockers

- NautilusTrader data catalog (`DATA_CATALOG_PATH`) must contain pre-converted data files.
  Use `FORCE_CATALOG_RELOAD=false` with pre-populated `.cache/nautilus/` from fixtures.
- Venue API credentials (`BINANCE_API_KEY`, `DERIBIT_API_KEY`) are optional for batch backtest
  but required for live mode.
- `GCSEventSink` is initialised in `cli/main.py` — requires GCS or `USE_MOCK_DATA=true`.

---

## Setup Steps (All Services)

### 1. Seed data (instruments)

```bash
cd instruments-service
mkdir -p data/samples
# Copy CSV sample files from data/samples/ or generate synthetic test data
```

### 2. Mock PubSub

Each service uses `unified_events_interface` with a configurable sink:

- `MockEventSink` — fully in-memory, no PubSub required (strategy-service uses this already)
- `LocalFsEventSink` — writes events to local JSON files (features-delta-one uses this)
- Set `SERVICE_MODE=batch` or `ENVIRONMENT=development` to auto-select local sink

### 3. Local GCS bucket substitute

For services that require GCS, use the `local` provider once it is implemented in UCI, or mock
`get_storage_client()` in tests. Current workaround:

```bash
export UNIFIED_CLOUD_SERVICES_USE_DIRECT_GCS=false
export USE_MOCK_DATA=true
```

---

## Gate Criteria

Each service must:

1. Start without crashing (`exit 0` or running process)
2. Process one synthetic batch record without uncaught exception
3. Log at least one `INFO`-level lifecycle event

---

## Quick Reference: Env Var Summary

| Variable              | instruments | mktdata     | features-d1 | strategy    | execution   |
| --------------------- | ----------- | ----------- | ----------- | ----------- | ----------- |
| `CLOUD_PROVIDER`      | local       | local       | local       | local       | local       |
| `SERVICE_MODE`        | batch       | batch       | batch       | batch       | batch       |
| `ENVIRONMENT`         | development | development | development | development | development |
| `GCP_PROJECT_ID`      | local-dev   | local-dev   | local-dev   | local-dev   | local-dev   |
| `USE_SECRET_MANAGER`  | false       | N/A         | false       | false       | false       |
| `USE_MOCK_DATA`       | true        | true        | N/A         | N/A         | N/A         |
| `USE_NUMBA`           | N/A         | N/A         | false       | N/A         | N/A         |
| `USE_DATABASE`        | N/A         | N/A         | N/A         | N/A         | false       |
| `ENABLE_CSV_SAMPLING` | true        | true        | N/A         | N/A         | N/A         |

---

## References

- `instruments-service/.env.example`
- `market-data-processing-service/.env.example`
- `features-delta-one-service/.env.example`
- `strategy-service/.env.example`
- `execution-service/.env.example`
- `unified-trading-codex/06-coding-standards/README.md`
