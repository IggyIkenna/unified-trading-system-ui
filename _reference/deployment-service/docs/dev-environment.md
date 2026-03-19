# Dev Environment Provisioning

**SSOT for how dev infrastructure is created in the `central-element-323112` GCP project.**

Dev and prod resources live in the **same GCP project**, isolated by an environment suffix in every resource name:

- Prod: `execution-store-defi-prod-central-element-323112`
- Dev: `execution-store-defi-dev-central-element-323112`

This avoids a separate dev project, billing account, and IAM setup. GCP on-demand quotas (BigQuery, Pub/Sub, GCS) are not meaningfully competed between dev and prod at current scale.

---

## Provision Dev Resources

```bash
cd deployment-service/terraform/gcp

# Init if not already done
terraform init

# Provision all dev-environment resources alongside existing prod resources
terraform apply \
  -var="environment=dev" \
  -var="project_id=central-element-323112"
```

This creates:

- **GCS Group B buckets** (`{domain}-{category}-dev-central-element-323112`) — execution, strategy, ML, features
- **Pub/Sub topics** with `-dev` suffix — e.g. `defi-onchain-features-ready-dev`
- **Cloud Scheduler jobs** with `dev` prefix
- **Memorystore (Redis)** dev instance if configured

**Group A buckets** (raw data: `instruments-store-*`, `market-data-tick-*`) have no env suffix and are shared read-only across dev and prod.

---

## Dev Service Configuration

Services running in dev receive literal resource names injected via environment variables at deploy time. No runtime name construction from `ENVIRONMENT`. Example Cloud Run env vars for a dev deployment:

```bash
ENVIRONMENT=dev
GCP_PROJECT_ID=central-element-323112
EXECUTION_GCS_BUCKET=execution-store-defi-dev-central-element-323112
BIGQUERY_DATASET=execution_dev
PUBSUB_TOPIC=alerting-service-events-dev
FORK_MODE=tenderly           # DeFi: use Tenderly Virtual TestNet for order simulation
```

---

## DeFi Dev Order Simulation

DeFi orders in dev are routed to a **mainnet fork** (Anvil locally, Tenderly for Cloud Run). Market data is always from real mainnet (read-only). See `unified-api-contracts/docs/DEFI_DATA_ORDER_STRATEGY_MATRIX.md` for the per-venue decision matrix.

### Local dev (Anvil)

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Fork mainnet (requires ALCHEMY_API_KEY)
anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY} \
      --fork-block-number latest \
      --port 8545

# Run services with:
FORK_MODE=anvil DEFI_RPC_URL=http://localhost:8545 <your-service>
```

### Cloud Run dev (Tenderly Virtual TestNet)

```bash
# One-time setup (done once per Tenderly project):
# 1. Create account at app.tenderly.co
# 2. Create Virtual TestNet → copy RPC URL
# 3. Add to Secret Manager:
gcloud secrets create tenderly-fork-rpc-url \
  --project central-element-323112 \
  --data-file=- <<< "https://virtual.mainnet.rpc.tenderly.co/..."

# Deploy dev Cloud Run with:
FORK_MODE=tenderly  # service reads tenderly-fork-rpc-url from SM
```

---

## Required Secrets for DeFi Dev

All in `central-element-323112` Secret Manager. Run `gcloud secrets list --project central-element-323112` to check current state.

| Secret Name                           | Purpose                               | How to obtain                              | Required?                  |
| ------------------------------------- | ------------------------------------- | ------------------------------------------ | -------------------------- |
| `alchemy-api-key`                     | Mainnet RPC (market data, always)     | Existing ✅                                | Required                   |
| `thegraph-api-key`                    | The Graph gateway (DeFi market data)  | Existing ✅                                | Required                   |
| `aavescan-api-key`                    | Aave analytics                        | Existing ✅                                | Required                   |
| `alchemy-api-key-testnet`             | Sepolia RPC (tx-mechanics tests only) | dashboard.alchemy.com → create Sepolia app | Optional                   |
| `tenderly-fork-rpc-url`               | Tenderly VirtualTestNet RPC           | app.tenderly.co                            | Required for Cloud Run dev |
| `tenderly-api-key`                    | Tenderly API access                   | app.tenderly.co                            | Optional                   |
| `hyperliquid-testnet-api-credentials` | Hyperliquid testnet orders            | testnet.hyperliquid.xyz                    | Required for HL testing    |
| `wallet-dev-private-key`              | Dev wallet for Sepolia txns           | `cast wallet new` (Foundry)                | Optional                   |

---

## Retired Scripts

The following scripts in `unified-trading-pm/scripts/dev/` are **retired** (2026-03-13). Use Terraform above instead:

| Retired script          | Was doing                                                                       |
| ----------------------- | ------------------------------------------------------------------------------- |
| `setup-dev-bigquery.sh` | Created BigQuery dev datasets in `unified-trading-dev` project (wrong project)  |
| `setup-dev-pubsub.sh`   | Created Pub/Sub topics in `unified-trading-dev` project (wrong project)         |
| `seed-dev-project.sh`   | Seeded synthetic GBM data — replaced by VCR cassette playback + real batch data |

These scripts reference `unified-trading-dev` as a separate GCP project, which was never created. The canonical provisioning path is `terraform apply -var="environment=dev"` against `central-element-323112`.

---

## Verification

```bash
# Check dev buckets exist
gcloud storage ls --project central-element-323112 | grep "\-dev\-"

# Check dev Pub/Sub topics
gcloud pubsub topics list --project central-element-323112 | grep "\-dev"

# Verify services can read from dev bucket
GOOGLE_APPLICATION_CREDENTIALS=~/dev-sa-key.json \
  python -c "from google.cloud import storage; list(storage.Client().bucket('execution-store-defi-dev-central-element-323112').list_blobs()); print('OK')"
```
