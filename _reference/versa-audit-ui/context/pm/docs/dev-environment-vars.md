# Dev Environment Variables Reference

Complete reference for all environment variables required or accepted by the unified trading system. Used by local
development, CI, and `setup-dev-environment.sh`.

**Source file:** `.env.dev` (copied from `.env.dev.template` at workspace root)

**SSOT:** `UnifiedCloudConfig` in `unified-config-interface/unified_config_interface/cloud_config.py`

---

## Notation

| Tag        | Meaning                                                                |
| ---------- | ---------------------------------------------------------------------- |
| `REQUIRED` | Must have a real value before any service will start                   |
| `DEFAULT`  | Has a safe default; override only when needed                          |
| `VCR`      | In dev, VCR cassettes substitute for real values — placeholder is fine |
| `SECRET`   | Never hardcode; use Secret Manager in staging/prod                     |

---

## Auth — GCP

| Variable                         | Tag      | Dev Default                | Description                                                                                                                                                                                                                                    |
| -------------------------------- | -------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GCP_PROJECT_ID`                 | REQUIRED | `central-element-323112`   | GCP project ID. Read by `UnifiedCloudConfig.gcp_project_id`. Also sets `project_id` via validator. Dev resources use `-dev` suffix (e.g. `execution-store-defi-dev-central-element-323112`). See `deployment-service/docs/dev-environment.md`. |
| `GOOGLE_APPLICATION_CREDENTIALS` | REQUIRED | `/path/to/dev-sa-key.json` | Path to service-account JSON key. In dev, use ADC: `gcloud auth application-default login`. File path read by `UnifiedCloudConfig.google_application_credentials_path`.                                                                        |
| `GCS_REGION`                     | DEFAULT  | `us-central1`              | GCS region for bucket creation. Aliases: `GOOGLE_CLOUD_REGION`.                                                                                                                                                                                |
| `GCS_LOCATION`                   | DEFAULT  | `US`                       | GCS multi-region location for bucket creation.                                                                                                                                                                                                 |
| `CLOUD_PROVIDER`                 | DEFAULT  | `gcp`                      | Active cloud backend: `gcp` or `aws`.                                                                                                                                                                                                          |
| `SECRETS_CLOUD_PROVIDER`         | DEFAULT  | _(unset)_                  | Override cloud provider for secrets only (hybrid cloud).                                                                                                                                                                                       |
| `STORAGE_CLOUD_PROVIDER`         | DEFAULT  | _(unset)_                  | Override cloud provider for storage only (hybrid cloud).                                                                                                                                                                                       |

---

## Auth — AWS

| Variable         | Tag     | Dev Default           | Description                                                                                                            |
| ---------------- | ------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `AWS_PROFILE`    | DEFAULT | `unified-trading-dev` | AWS CLI named profile. Used by services when `CLOUD_PROVIDER=aws`. See `unified-trading-pm/docs/aws-testnet-setup.md`. |
| `AWS_REGION`     | DEFAULT | `us-east-1`           | AWS region. Aliases: `AWS_DEFAULT_REGION`.                                                                             |
| `AWS_ACCOUNT_ID` | DEFAULT | _(unset)_             | AWS account ID, used for ECR image URIs.                                                                               |

---

## Runtime Mode

| Variable             | Tag     | Dev Default   | Description                                                                                                         |
| -------------------- | ------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `ENVIRONMENT`        | DEFAULT | `development` | Runtime environment: `development`, `staging`, `production`. Aliases: `ENV`.                                        |
| `CLOUD_MOCK_MODE`    | DEFAULT | `true`        | When `true`, all GCS/PubSub calls go to in-memory mocks — no real credentials required for `import` or unit tests.  |
| `USE_SECRET_MANAGER` | DEFAULT | `false`       | When `false`, Secret Manager is bypassed; direct `*_API_KEY` env vars are used instead. Set `true` in staging/prod. |
| `RUNTIME_MODE`       | DEFAULT | `batch`       | Service execution mode: `batch` or `live`.                                                                          |
| `LOG_LEVEL`          | DEFAULT | `DEBUG`       | Python logging level: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`.                                              |
| `ENABLE_DEBUG`       | DEFAULT | `false`       | Enable extra debug logging paths. Aliases: `DEBUG`.                                                                 |
| `TESTING_MODE`       | DEFAULT | `false`       | Skip some validations in unit tests.                                                                                |
| `DISABLE_AUTH`       | DEFAULT | `false`       | Disable X-API-Key authentication on API services. Never `true` in prod.                                             |
| `SERVICE_AUTH_TOKEN` | DEFAULT | _(unset)_     | Service-to-service bearer token (Phase 0 static). Loaded via Secret Manager in prod.                                |

---

## DeFi Execution Mode

| Variable       | Tag     | Dev Default | Description                                                                                                                                                                                                                            |
| -------------- | ------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FORK_MODE`    | DEFAULT | _(unset)_   | DeFi order routing mode: `anvil` (local Anvil mainnet fork at `http://localhost:8545`), `tenderly` (hosted Tenderly Virtual TestNet — reads `tenderly-fork-rpc-url` from SM), `""` (empty = production, use real mainnet Alchemy RPC). |
| `TESTNET_MODE` | DEFAULT | `false`     | When `true`, Hyperliquid connector routes to `api.hyperliquid-testnet.xyz`. Does NOT affect Ethereum DeFi protocols (use `FORK_MODE` for those). Never `true` in production.                                                           |
| `DEFI_RPC_URL` | DEFAULT | _(unset)_   | Direct RPC URL override for DeFi protocol connectors. When set, takes priority over `FORK_MODE` SM lookup. Typical local dev: `FORK_MODE=anvil DEFI_RPC_URL=http://localhost:8545`. Leave empty for Tenderly/prod.                     |

See `unified-api-contracts/docs/DEFI_DATA_ORDER_STRATEGY_MATRIX.md` for per-venue routing decisions.

---

## VCR

| Variable      | Tag     | Dev Default | Description                                                                                                                                                                      |
| ------------- | ------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VCR_MODE`    | DEFAULT | `playback`  | VCR cassette mode: `playback` (use committed cassettes), `record` (make live calls and write cassettes), `disabled` (live calls, no cassettes). Always `playback` in dev and CI. |
| `SHARD_INDEX` | DEFAULT | `0`         | API key shard index for rotation (Databento has 20 keys, TheGraph has 9). Set `0` locally.                                                                                       |

---

## Databases

| Variable       | Tag     | Dev Default | Description                                                                                                                                                                                       |
| -------------- | ------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | DEFAULT | _(unset)_   | PostgreSQL connection string for live-mode order/position persistence in execution-service. Format: `postgresql://user:pass@localhost:5432/execution_db`. Only required when `USE_DATABASE=true`. |
| `USE_DATABASE` | DEFAULT | `false`     | Enable PostgreSQL adapter in execution-service. When `false`, in-memory adapters are used.                                                                                                        |

---

## Cloud Storage — GCS Buckets

| Variable                        | Tag     | Dev Default                            | Description                        |
| ------------------------------- | ------- | -------------------------------------- | ---------------------------------- |
| `GCS_BUCKET`                    | DEFAULT | _(unset)_                              | Primary/fallback GCS bucket.       |
| `MARKET_DATA_GCS_BUCKET`        | DEFAULT | `market-data-tick`                     | GCS bucket for market tick data.   |
| `MARKET_DATA_GCS_BUCKET_CEFI`   | DEFAULT | `market-data-tick-cefi-{project_id}`   | CeFi market data bucket.           |
| `MARKET_DATA_GCS_BUCKET_TRADFI` | DEFAULT | `market-data-tick-tradfi-{project_id}` | TradFi market data bucket.         |
| `MARKET_DATA_GCS_BUCKET_DEFI`   | DEFAULT | `market-data-tick-defi-{project_id}`   | DeFi market data bucket.           |
| `FEATURES_GCS_BUCKET`           | DEFAULT | `features-data`                        | Computed features bucket.          |
| `EXECUTION_GCS_BUCKET`          | DEFAULT | _(unset)_                              | Execution/backtest results bucket. |
| `INSTRUMENTS_GCS_BUCKET`        | DEFAULT | _(unset)_                              | Instruments definitions bucket.    |

---

## Cloud Storage — BigQuery

| Variable                       | Tag     | Dev Default        | Description                                  |
| ------------------------------ | ------- | ------------------ | -------------------------------------------- |
| `BIGQUERY_DATASET`             | DEFAULT | `market_data`      | Default BQ dataset. Aliases: `BQ_DATASET`.   |
| `BIGQUERY_LOCATION`            | DEFAULT | `US`               | BQ dataset location. Aliases: `BQ_LOCATION`. |
| `MARKET_DATA_BIGQUERY_DATASET` | DEFAULT | `market_tick_data` | BQ dataset for market tick data.             |
| `EXECUTION_BIGQUERY_DATASET`   | DEFAULT | `execution`        | BQ dataset for execution data.               |
| `INSTRUMENTS_BIGQUERY_DATASET` | DEFAULT | `instruments`      | BQ dataset for instruments metadata.         |

---

## Cloud Storage — AWS S3 / Athena

| Variable                       | Tag     | Dev Default | Description                       |
| ------------------------------ | ------- | ----------- | --------------------------------- |
| `INSTRUMENTS_S3_BUCKET_CEFI`   | DEFAULT | _(unset)_   | S3 bucket for CeFi instruments.   |
| `INSTRUMENTS_S3_BUCKET_TRADFI` | DEFAULT | _(unset)_   | S3 bucket for TradFi instruments. |
| `INSTRUMENTS_S3_BUCKET_DEFI`   | DEFAULT | _(unset)_   | S3 bucket for DeFi instruments.   |
| `MARKET_DATA_S3_BUCKET_CEFI`   | DEFAULT | _(unset)_   | S3 bucket for CeFi market data.   |
| `MARKET_DATA_S3_BUCKET_TRADFI` | DEFAULT | _(unset)_   | S3 bucket for TradFi market data. |
| `MARKET_DATA_S3_BUCKET_DEFI`   | DEFAULT | _(unset)_   | S3 bucket for DeFi market data.   |
| `FEATURES_S3_BUCKET`           | DEFAULT | _(unset)_   | S3 bucket for features.           |
| `EXECUTION_S3_BUCKET`          | DEFAULT | _(unset)_   | S3 bucket for execution results.  |
| `ML_MODELS_S3_BUCKET`          | DEFAULT | _(unset)_   | S3 bucket for ML models.          |
| `ATHENA_DATABASE`              | DEFAULT | `default`   | Athena database.                  |
| `ATHENA_WORKGROUP`             | DEFAULT | `primary`   | Athena workgroup.                 |
| `ATHENA_OUTPUT_LOCATION`       | DEFAULT | _(unset)_   | S3 path for Athena query results. |

---

## API Keys — Data Providers (CeFi market data)

All of these are loaded via Secret Manager in staging/prod. In dev with `USE_SECRET_MANAGER=false`, set the direct key
env vars below. With `VCR_MODE=playback`, placeholder values are sufficient.

| Variable                  | Tag     | Dev Default                      | Description                                                                  |
| ------------------------- | ------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `TARDIS_API_KEY`          | VCR     | `vcr_placeholder`                | Tardis.dev API key.                                                          |
| `TARDIS_SECRET_NAME`      | DEFAULT | `tardis-api-key`                 | Secret Manager name for Tardis key.                                          |
| `TARDIS_FULL_SECRET_NAME` | DEFAULT | `tardis-api-key-full`            | Secret Manager name for full-access Tardis key.                              |
| `TARDIS_BASE_URL`         | DEFAULT | `https://api.tardis.dev/v1`      | Tardis API base URL.                                                         |
| `TARDIS_DATASETS_URL`     | DEFAULT | `https://datasets.tardis.dev/v1` | Tardis CSV datasets URL.                                                     |
| `TARDIS_TIMEOUT`          | DEFAULT | `30`                             | Tardis request timeout (seconds).                                            |
| `TARDIS_MAX_RETRIES`      | DEFAULT | `3`                              | Tardis max retry attempts.                                                   |
| `DATABENTO_API_KEY`       | VCR     | `vcr_placeholder`                | Databento API key.                                                           |
| `DATABENTO_SECRET_NAME`   | DEFAULT | `databento-api-key`              | Secret Manager name for Databento key (base; shards use `-1` through `-20`). |
| `DATABENTO_TIMEOUT`       | DEFAULT | `60`                             | Databento request timeout (seconds).                                         |

---

## API Keys — Brokers (CeFi execution)

| Variable                       | Tag     | Dev Default                   | Description                                                                            |
| ------------------------------ | ------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| `BINANCE_API_KEY`              | VCR     | `vcr_placeholder`             | Binance API key. Testnet: https://testnet.binance.vision                               |
| `BINANCE_API_SECRET`           | VCR     | `vcr_placeholder`             | Binance API secret.                                                                    |
| `BINANCE_SECRET_NAME`          | DEFAULT | `binance-api`                 | Secret Manager name for Binance credentials.                                           |
| `DERIBIT_API_KEY`              | VCR     | `vcr_placeholder`             | Deribit API key. Testnet: https://test.deribit.com                                     |
| `DERIBIT_API_SECRET`           | VCR     | `vcr_placeholder`             | Deribit API secret.                                                                    |
| `DERIBIT_SECRET_NAME`          | DEFAULT | `deribit-api`                 | Secret Manager name for Deribit credentials.                                           |
| `HYPERLIQUID_API_URL`          | DEFAULT | `https://api.hyperliquid.xyz` | Hyperliquid API endpoint.                                                              |
| `HYPERLIQUID_SECRET_NAME`      | DEFAULT | `hyperliquid-api`             | Secret Manager name for Hyperliquid credentials.                                       |
| `IBKR_GATEWAY_HOST`            | DEFAULT | `127.0.0.1`                   | IB Gateway host.                                                                       |
| `IBKR_GATEWAY_PORT`            | DEFAULT | `4001`                        | IB Gateway port: `4001` = paper, `4002` = live, `7497` = TWS paper, `7496` = TWS live. |
| `IBKR_CLIENT_ID_BASE`          | DEFAULT | `1`                           | Base client ID for IBKR connections (incremented per adapter).                         |
| `IBKR_CREDENTIALS_SECRET_NAME` | DEFAULT | `ibkr-account-credentials`    | Secret Manager name for IBKR account credentials.                                      |

---

## API Keys — DeFi

| Variable                | Tag     | Dev Default                             | Description                                                                                               |
| ----------------------- | ------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ALCHEMY_API_KEY`       | VCR     | `vcr_placeholder`                       | Alchemy RPC API key.                                                                                      |
| `ALCHEMY_SECRET_NAME`   | DEFAULT | `alchemy-api-key`                       | Secret Manager name for Alchemy key.                                                                      |
| `ALCHEMY_DEFAULT_CHAIN` | DEFAULT | `ETHEREUM`                              | Default blockchain for Alchemy RPC.                                                                       |
| `ALCHEMY_TIMEOUT`       | DEFAULT | `30`                                    | Alchemy request timeout (seconds).                                                                        |
| `THE_GRAPH_API_KEY`     | VCR     | `vcr_placeholder`                       | The Graph gateway API key. Aliases: `GRAPH_API_KEY`.                                                      |
| `THEGRAPH_SECRET_NAME`  | DEFAULT | `thegraph-api-key`                      | Secret Manager name for The Graph key (base; shards use `-2` through `-9`). Aliases: `GRAPH_SECRET_NAME`. |
| `THEGRAPH_GATEWAY_URL`  | DEFAULT | `https://gateway.thegraph.com/api`      | The Graph Gateway URL.                                                                                    |
| `THEGRAPH_STUDIO_URL`   | DEFAULT | `https://api.studio.thegraph.com/query` | The Graph Studio URL.                                                                                     |
| `THEGRAPH_TIMEOUT`      | DEFAULT | `30`                                    | The Graph request timeout (seconds).                                                                      |
| `AAVESCAN_API_KEY`      | VCR     | `vcr_placeholder`                       | AaveScan API key.                                                                                         |
| `AAVESCAN_SECRET_NAME`  | DEFAULT | `aavescan-api-key`                      | Secret Manager name for AaveScan key.                                                                     |

### DeFi Dev / Fork Secrets (add to SM before using `FORK_MODE` or `TESTNET_MODE`)

| Variable                    | Tag    | Dev Default | Description                                                                                                          |
| --------------------------- | ------ | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `ALCHEMY_API_KEY_TESTNET`   | SECRET | _(unset)_   | Alchemy Sepolia app key (SM: `alchemy-api-key-testnet`). Required only for Sepolia tx-mechanics tests.               |
| `TENDERLY_FORK_RPC_URL`     | SECRET | _(unset)_   | Tenderly Virtual TestNet RPC URL (SM: `tenderly-fork-rpc-url`). Required when `FORK_MODE=tenderly`.                  |
| `TENDERLY_API_KEY`          | SECRET | _(unset)_   | Tenderly API key (SM: `tenderly-api-key`). Required for Tenderly Virtual TestNet management.                         |
| `HYPERLIQUID_TESTNET_CREDS` | SECRET | _(unset)_   | Hyperliquid testnet credentials JSON (SM: `hyperliquid-testnet-api-credentials`). Required when `TESTNET_MODE=true`. |
| `WALLET_DEV_PRIVATE_KEY`    | SECRET | _(unset)_   | Dev wallet private key (SM: `wallet-dev-private-key`). For Sepolia tx signing. Never fund on mainnet.                |

---

## Observability

| Variable                      | Tag     | Dev Default             | Description                                                                    |
| ----------------------------- | ------- | ----------------------- | ------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | DEFAULT | `http://localhost:4317` | OpenTelemetry OTLP gRPC endpoint. Cloud Run injects the correct value in prod. |
| `API_KEY`                     | DEFAULT | _(unset)_               | Service API key for X-API-Key header authentication on internal API calls.     |

---

## Dev Tools

| Variable              | Tag     | Dev Default    | Description                                                                                                                        |
| --------------------- | ------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `GH_PAT`              | DEFAULT | _(unset)_      | GitHub Personal Access Token (repo scope). Required for cloning private dependencies in CI. Optional locally if SSH is configured. |
| `ENABLE_CSV_SAMPLING` | DEFAULT | `false`        | Write CSV samples of processed data for debugging.                                                                                 |
| `CSV_SAMPLE_SIZE`     | DEFAULT | `20000`        | Max rows per CSV sample.                                                                                                           |
| `CSV_SAMPLE_DIR`      | DEFAULT | `data/samples` | Directory for CSV sample files.                                                                                                    |

---

## Notes

1. `UnifiedCloudConfig` reads from `.env` file at process working directory by default (via pydantic-settings). The
   workspace `.env.dev` file is not auto-loaded unless symlinked or the service is started from workspace root. Each
   service should have its own `.env` symlinked to the workspace `.env.dev`.

2. With `CLOUD_MOCK_MODE=true` and `USE_SECRET_MANAGER=false`, no real GCP credentials are required to import and
   unit-test any service. This is the required dev baseline.

3. VCR cassettes are committed to `unified-trading-pm/scripts/dev/vcr_cassettes/` (planned; see Phase 3 of
   `dev_environment_automated_onboarding_2026_03_10.plan.md`). Until cassettes exist, `VCR_MODE=disabled` and testnet
   keys are needed for integration tests.
