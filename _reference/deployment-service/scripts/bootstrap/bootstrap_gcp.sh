#!/usr/bin/env bash
# Idempotent GCP bootstrap — enables APIs, creates Terraform state bucket, applies shared infra.
#
# Usage:
#   bash scripts/bootstrap/bootstrap_gcp.sh \
#     --project-id PROJECT \
#     --region     REGION  \
#     --env        ENV     \
#     --bucket-prefix PREFIX \
#     [--redis]
#
# Flags:
#   --redis   Also provision Cloud Memorystore Redis (skips if already exists).
#             Stores connection URL in Secret Manager under secret ID: redis-url
#
# Prerequisites:
#   - gcloud CLI authenticated (gcloud auth application-default login)
#   - terraform >= 1.6 on PATH
#   - ENV must be one of: dev, staging, prod

set -euo pipefail

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
PROJECT_ID=""
REGION=""
ENV=""
PREFIX=""
ENABLE_REDIS=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-id)    PROJECT_ID="$2"; shift 2 ;;
    --region)        REGION="$2";     shift 2 ;;
    --env)           ENV="$2";        shift 2 ;;
    --bucket-prefix) PREFIX="$2";     shift 2 ;;
    --redis)         ENABLE_REDIS=true; shift ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 --project-id PROJECT --region REGION --env ENV --bucket-prefix PREFIX [--redis]" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$PROJECT_ID" || -z "$REGION" || -z "$ENV" || -z "$PREFIX" ]]; then
  echo "Error: all of --project-id, --region, --env, --bucket-prefix are required." >&2
  exit 1
fi

if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
  echo "Error: --env must be one of: dev, staging, prod (got: $ENV)" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Enable required GCP APIs (idempotent)
# ---------------------------------------------------------------------------
REQUIRED_APIS=(
  storage.googleapis.com
  bigquery.googleapis.com
  secretmanager.googleapis.com
  run.googleapis.com
  iam.googleapis.com
  cloudbuild.googleapis.com
  redis.googleapis.com
)

echo "==> Enabling GCP APIs for project: $PROJECT_ID"
for api in "${REQUIRED_APIS[@]}"; do
  echo "    enabling $api ..."
  gcloud services enable "$api" --project="$PROJECT_ID" --quiet
done
echo "    All APIs enabled."

# ---------------------------------------------------------------------------
# Create Terraform state bucket (idempotent)
# ---------------------------------------------------------------------------
STATE_BUCKET="${PREFIX}-terraform-state-${PROJECT_ID}"
echo "==> Ensuring Terraform state bucket: gs://${STATE_BUCKET}"

if ! gsutil ls -b "gs://${STATE_BUCKET}" &>/dev/null; then
  gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://${STATE_BUCKET}"
  gsutil versioning set on "gs://${STATE_BUCKET}"
  echo "    Created: gs://${STATE_BUCKET}"
else
  echo "    Already exists: gs://${STATE_BUCKET}"
fi

# ---------------------------------------------------------------------------
# Terraform init + apply
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TF_DIR="$REPO_ROOT/terraform/gcp"

if [[ ! -d "$TF_DIR" ]]; then
  echo "Error: Terraform directory not found: $TF_DIR" >&2
  exit 1
fi

echo "==> terraform init ($TF_DIR)"
terraform -chdir="$TF_DIR" init \
  -backend-config="bucket=${STATE_BUCKET}" \
  -backend-config="prefix=shared-infrastructure" \
  -reconfigure

echo "==> terraform apply"
terraform -chdir="$TF_DIR" apply -auto-approve \
  -var="project_id=${PROJECT_ID}" \
  -var="region=${REGION}" \
  -var="environment=${ENV}" \
  -var="bucket_prefix=${PREFIX}"

# ---------------------------------------------------------------------------
# Redis (Memorystore) — opt-in via --redis flag
# ---------------------------------------------------------------------------
if [[ "$ENABLE_REDIS" == "true" ]]; then
  MEMORYSTORE_INSTANCE="trading-cache-${ENV}"
  echo "==> Checking Cloud Memorystore Redis (instance=${MEMORYSTORE_INSTANCE})..."

  if gcloud redis instances describe "$MEMORYSTORE_INSTANCE" \
      --region="$REGION" \
      --project="$PROJECT_ID" &>/dev/null; then
    echo "    Memorystore already exists — skipping provision."
  else
    echo "    Provisioning Cloud Memorystore Redis (this takes ~5 min)..."
    terraform -chdir="$TF_DIR" apply -auto-approve \
      -var="project_id=${PROJECT_ID}" \
      -var="region=${REGION}" \
      -var="environment=${ENV}" \
      -var="bucket_prefix=${PREFIX}" \
      -var="enable_memorystore=true"
    echo "    Memorystore provisioned."
  fi

  # Retrieve and display the redis-url secret for reference
  REDIS_URL=$(gcloud secrets versions access latest \
    --secret="redis-url" \
    --project="$PROJECT_ID" 2>/dev/null || echo "")
  if [[ -n "$REDIS_URL" ]]; then
    echo "    REDIS_URL is stored in Secret Manager (secret ID: redis-url)."
    echo "    Inject into Cloud Run with: --set-secrets=REDIS_URL=redis-url:latest"
  fi
fi

# ---------------------------------------------------------------------------
# Service deployment helper — inject PROTOCOL_* env vars from configs/services/
# ---------------------------------------------------------------------------

# Root of configs directory (relative to repo root)
CONFIGS_DIR="$REPO_ROOT/configs/services"

# deploy_service SERVICE_NAME IMAGE_URI
# Reads configs/services/$SERVICE_NAME/{live,batch}.env and deploys to Cloud Run
# with all PROTOCOL_* and SERVICE_MODE env vars injected.
deploy_service() {
  local svc="$1"
  local image="$2"
  local mode="${3:-live}"   # live | batch

  local env_file="$CONFIGS_DIR/$svc/${mode}.env"
  if [[ ! -f "$env_file" ]]; then
    echo "    [WARN] No ${mode}.env for $svc — skipping Cloud Run deploy"
    return 0
  fi

  # Build comma-separated KEY=VALUE pairs for --set-env-vars (strip comments/blanks)
  local env_vars
  env_vars=$(grep -E '^[A-Z_]+=.*' "$env_file" \
    | sed "s|\\\${GCP_PROJECT_ID}|${PROJECT_ID}|g" \
    | tr '\n' ',' | sed 's/,$//')

  if [[ -z "$env_vars" ]]; then
    echo "    [WARN] No env vars found in $env_file — skipping"
    return 0
  fi

  echo "    Deploying $svc to Cloud Run (mode=$mode)..."
  gcloud run deploy "$svc" \
    --image="$image" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --set-env-vars="$env_vars,GCP_PROJECT_ID=${PROJECT_ID}" \
    --service-account="unified-trading-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
    --no-allow-unauthenticated \
    --quiet
  echo "    Deployed $svc."
}

# Example: uncomment and set IMAGE_REGISTRY to deploy services after bootstrap.
# IMAGE_REGISTRY="gcr.io/${PROJECT_ID}"
#
# deploy_service "market-tick-data-service"          "${IMAGE_REGISTRY}/market-tick-data-service:latest"   live
# deploy_service "features-volatility-service"       "${IMAGE_REGISTRY}/features-volatility-service:latest" batch
# deploy_service "features-delta-one-service"        "${IMAGE_REGISTRY}/features-delta-one-service:latest"  batch
# deploy_service "features-cross-instrument-service" "${IMAGE_REGISTRY}/features-cross-instrument-service:latest" batch
# deploy_service "features-onchain-service"          "${IMAGE_REGISTRY}/features-onchain-service:latest"    batch
# deploy_service "ml-training-service"               "${IMAGE_REGISTRY}/ml-training-service:latest"         batch
# deploy_service "ml-inference-service"              "${IMAGE_REGISTRY}/ml-inference-service:latest"        live
# deploy_service "strategy-service"                  "${IMAGE_REGISTRY}/strategy-service:latest"            live
# deploy_service "execution-service"                 "${IMAGE_REGISTRY}/execution-service:latest"           live
# deploy_service "risk-and-exposure-service"         "${IMAGE_REGISTRY}/risk-and-exposure-service:latest"   live

echo ""
echo "==> GCP bootstrap complete."
echo "    Project:  $PROJECT_ID"
echo "    Region:   $REGION"
echo "    Env:      $ENV"
echo "    State:    gs://${STATE_BUCKET}/shared-infrastructure"
echo ""
echo "    To deploy services with PROTOCOL_* env vars, uncomment the"
echo "    deploy_service() calls above or run them manually."
