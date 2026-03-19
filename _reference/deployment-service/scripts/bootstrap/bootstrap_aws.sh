#!/usr/bin/env bash
# Idempotent AWS bootstrap — creates S3 state bucket, applies UCI shared infra.
#
# Usage:
#   bash scripts/bootstrap/bootstrap_aws.sh \
#     --account-id  ACCOUNT \
#     --region      REGION  \
#     --env         ENV     \
#     --bucket-prefix PREFIX \
#     [--redis]
#
# Flags:
#   --redis   Also provision ElastiCache Redis (skips if already exists).
#             Stores connection URL in Secrets Manager: unified-trading/{env}/redis-url
#
# Prerequisites:
#   - AWS CLI configured (aws configure or IAM role via instance profile)
#   - terraform >= 1.6 on PATH
#   - ENV must be one of: dev, staging, prod

set -euo pipefail

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
ACCOUNT_ID=""
REGION=""
ENV=""
PREFIX=""
ENABLE_REDIS=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --account-id)    ACCOUNT_ID="$2"; shift 2 ;;
    --region)        REGION="$2";     shift 2 ;;
    --env)           ENV="$2";        shift 2 ;;
    --bucket-prefix) PREFIX="$2";     shift 2 ;;
    --redis)         ENABLE_REDIS=true; shift ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 --account-id ACCOUNT --region REGION --env ENV --bucket-prefix PREFIX [--redis]" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$ACCOUNT_ID" || -z "$REGION" || -z "$ENV" || -z "$PREFIX" ]]; then
  echo "Error: all of --account-id, --region, --env, --bucket-prefix are required." >&2
  exit 1
fi

if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
  echo "Error: --env must be one of: dev, staging, prod (got: $ENV)" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Create S3 Terraform state bucket (idempotent)
# ---------------------------------------------------------------------------
STATE_BUCKET="${PREFIX}-terraform-state-${ACCOUNT_ID}"
echo "==> Ensuring S3 Terraform state bucket: s3://${STATE_BUCKET}"

if aws s3api head-bucket --bucket "$STATE_BUCKET" --region "$REGION" 2>/dev/null; then
  echo "    Already exists: s3://${STATE_BUCKET}"
else
  echo "    Creating: s3://${STATE_BUCKET}"

  # us-east-1 requires no LocationConstraint; all other regions require it.
  if [[ "$REGION" == "us-east-1" ]]; then
    aws s3api create-bucket \
      --bucket "$STATE_BUCKET" \
      --region "$REGION"
  else
    aws s3api create-bucket \
      --bucket "$STATE_BUCKET" \
      --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION"
  fi

  # Enable versioning for state safety
  aws s3api put-bucket-versioning \
    --bucket "$STATE_BUCKET" \
    --versioning-configuration Status=Enabled

  # Block public access
  aws s3api put-public-access-block \
    --bucket "$STATE_BUCKET" \
    --public-access-block-configuration \
      BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

  # Enable server-side encryption
  aws s3api put-bucket-encryption \
    --bucket "$STATE_BUCKET" \
    --server-side-encryption-configuration '{
      "Rules": [{
        "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
      }]
    }'

  echo "    Created and secured: s3://${STATE_BUCKET}"
fi

# ---------------------------------------------------------------------------
# Terraform init + apply
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TF_DIR="$REPO_ROOT/terraform/aws"

if [[ ! -d "$TF_DIR" ]]; then
  echo "Error: Terraform directory not found: $TF_DIR" >&2
  exit 1
fi

echo "==> terraform init ($TF_DIR)"
terraform -chdir="$TF_DIR" init \
  -backend-config="bucket=${STATE_BUCKET}" \
  -backend-config="key=terraform/state/${ENV}" \
  -backend-config="region=${REGION}" \
  -reconfigure

# ---------------------------------------------------------------------------
# Idempotency: import Group A shared S3 buckets that already exist in AWS
# but may be absent from a fresh terraform state for this environment.
# Group A buckets (no env suffix) are shared across dev/staging/prod.
# Without importing them first, terraform apply would fail with
# "BucketAlreadyOwnedByYou" (E5 in the bootstrap audit log).
# ---------------------------------------------------------------------------
GROUP_A_BUCKETS=(
  "unified-trading-instruments-cefi-${ACCOUNT_ID}"
  "unified-trading-instruments-tradfi-${ACCOUNT_ID}"
  "unified-trading-instruments-defi-${ACCOUNT_ID}"
  "unified-trading-market-data-cefi-${ACCOUNT_ID}"
  "unified-trading-market-data-tradfi-${ACCOUNT_ID}"
  "unified-trading-market-data-tradfi-${ACCOUNT_ID}"
  "unified-trading-market-data-defi-${ACCOUNT_ID}"
  "unified-trading-features-calendar-${ACCOUNT_ID}"
)

echo "==> Checking Group A shared S3 buckets (idempotent import if needed)..."
for bucket in "${GROUP_A_BUCKETS[@]}"; do
  # Skip if already in state
  if terraform -chdir="$TF_DIR" state list "aws_s3_bucket.unified_trading[\"${bucket}\"]" 2>/dev/null | grep -q .; then
    echo "    [already in state] ${bucket}"
    continue
  fi
  # Skip if bucket doesn't exist in AWS (new environment, terraform will create it)
  if ! aws s3api head-bucket --bucket "$bucket" --region "$REGION" 2>/dev/null; then
    echo "    [not in AWS yet]   ${bucket} — terraform will create"
    continue
  fi
  echo "    [importing]        ${bucket}"
  terraform -chdir="$TF_DIR" import \
    -var="aws_account_id=${ACCOUNT_ID}" \
    -var="aws_region=${REGION}" \
    -var="environment=${ENV}" \
    -var="bucket_prefix=${PREFIX}" \
    "aws_s3_bucket.unified_trading[\"${bucket}\"]" \
    "$bucket" || echo "    [WARN] Import failed for ${bucket} — continuing"

  for sub_resource in \
    "aws_s3_bucket_versioning.unified_trading" \
    "aws_s3_bucket_server_side_encryption_configuration.unified_trading" \
    "aws_s3_bucket_public_access_block.unified_trading"; do
    if ! terraform -chdir="$TF_DIR" state list "${sub_resource}[\"${bucket}\"]" 2>/dev/null | grep -q .; then
      terraform -chdir="$TF_DIR" import \
        -var="aws_account_id=${ACCOUNT_ID}" \
        -var="aws_region=${REGION}" \
        -var="environment=${ENV}" \
        -var="bucket_prefix=${PREFIX}" \
        "${sub_resource}[\"${bucket}\"]" \
        "$bucket" 2>/dev/null || echo "    [WARN] Import failed for ${sub_resource}[${bucket}]"
    fi
  done
done

# ---------------------------------------------------------------------------
# Import Group A Glue databases if they already exist (same idempotency reason)
# ---------------------------------------------------------------------------
GROUP_A_GLUE_DBS=("instruments" "market_data" "features_calendar")
for db in "${GROUP_A_GLUE_DBS[@]}"; do
  glue_db_name="uts_${db}"
  tf_addr="aws_glue_catalog_database.raw[\"${db}\"]"
  if terraform -chdir="$TF_DIR" state list "$tf_addr" 2>/dev/null | grep -q .; then
    continue
  fi
  if aws glue get-database --name "$glue_db_name" --region "$REGION" &>/dev/null; then
    echo "    [importing glue db] ${glue_db_name}"
    terraform -chdir="$TF_DIR" import \
      -var="aws_account_id=${ACCOUNT_ID}" \
      -var="aws_region=${REGION}" \
      -var="environment=${ENV}" \
      -var="bucket_prefix=${PREFIX}" \
      "$tf_addr" "$glue_db_name" 2>/dev/null || echo "    [WARN] Import failed for glue db ${glue_db_name}"
  fi
done

# ---------------------------------------------------------------------------
# Set up env file path early — used by both Athena export and Redis sections
# ---------------------------------------------------------------------------
ATHENA_BUCKET="${PREFIX}-${ENV}-deployment-state"
ENV_FILE="$HOME/.aws/unified-trading-env"
mkdir -p "$(dirname "$ENV_FILE")"

echo "==> terraform apply"
terraform -chdir="$TF_DIR" apply -auto-approve \
  -var="aws_account_id=${ACCOUNT_ID}" \
  -var="aws_region=${REGION}" \
  -var="environment=${ENV}" \
  -var="bucket_prefix=${PREFIX}"

# ---------------------------------------------------------------------------
# Redis (ElastiCache) — opt-in via --redis flag
# ---------------------------------------------------------------------------
if [[ "$ENABLE_REDIS" == "true" ]]; then
  ELASTICACHE_ID="trading-cache-${ENV}"
  echo "==> Checking ElastiCache Redis (id=${ELASTICACHE_ID})..."

  if aws elasticache describe-replication-groups \
      --replication-group-id "$ELASTICACHE_ID" \
      --region "$REGION" &>/dev/null; then
    echo "    ElastiCache already exists — skipping provision."
    # Still read the secret and export it if available
    REDIS_URL=$(aws secretsmanager get-secret-value \
      --secret-id "unified-trading/${ENV}/redis-url" \
      --region "$REGION" \
      --query SecretString \
      --output text 2>/dev/null || echo "")
  else
    echo "    Provisioning ElastiCache Redis (this takes ~10 min)..."
    terraform -chdir="$TF_DIR" apply -auto-approve \
      -var="aws_account_id=${ACCOUNT_ID}" \
      -var="aws_region=${REGION}" \
      -var="environment=${ENV}" \
      -var="bucket_prefix=${PREFIX}" \
      -var="enable_elasticache=true"

    REDIS_URL=$(aws secretsmanager get-secret-value \
      --secret-id "unified-trading/${ENV}/redis-url" \
      --region "$REGION" \
      --query SecretString \
      --output text 2>/dev/null || echo "")
    echo "    ElastiCache provisioned."
  fi

  if [[ -n "$REDIS_URL" ]]; then
    echo "export REDIS_URL=${REDIS_URL}   # ${ENV} — set by bootstrap_aws.sh --redis" >> "$ENV_FILE"
    echo "    REDIS_URL exported to: $ENV_FILE"
  fi
fi

# ---------------------------------------------------------------------------
# Service deployment helper — inject PROTOCOL_* env vars from configs/services/
# ---------------------------------------------------------------------------

CONFIGS_DIR="$REPO_ROOT/configs/services"

# deploy_service SERVICE_NAME TASK_DEF_FAMILY CLUSTER MODE
# Reads configs/services/$SERVICE_NAME/{live,batch}.env and registers an ECS
# task definition revision with updated PROTOCOL_* environment variables.
deploy_service() {
  local svc="$1"
  local task_family="${2:-$svc}"
  local cluster="${3:-unified-trading}"
  local mode="${4:-live}"

  local env_file="$CONFIGS_DIR/$svc/${mode}.env"
  if [[ ! -f "$env_file" ]]; then
    echo "    [WARN] No ${mode}.env for $svc — skipping ECS update"
    return 0
  fi

  # Build JSON array of {name, value} pairs for ECS task definition environment
  local env_json="["
  local first=1
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    value="${value//\$\{AWS_ACCOUNT_ID\}/${ACCOUNT_ID}}"
    [[ $first -eq 0 ]] && env_json+=","
    env_json+="{\"name\":\"${key}\",\"value\":\"${value}\"}"
    first=0
  done < <(grep -E '^[A-Z_]+=' "$env_file")
  env_json+=",{\"name\":\"AWS_ACCOUNT_ID\",\"value\":\"${ACCOUNT_ID}\"}"
  env_json+=",{\"name\":\"DEPLOYMENT_ENV\",\"value\":\"${ENV}\"}"
  env_json+=",{\"name\":\"AWS_REGION\",\"value\":\"${REGION}\"}]"

  echo "    Registering ECS task definition for $svc (mode=$mode)..."
  current_def=$(aws ecs describe-task-definition --task-definition "$task_family" \
    --query 'taskDefinition' --output json 2>/dev/null || echo "{}")

  if [[ "$current_def" == "{}" ]]; then
    echo "    [WARN] No existing task definition for $task_family — skipping"
    return 0
  fi

  new_def=$(echo "$current_def" | python3 -c "
import json, sys
td = json.load(sys.stdin)
env = json.loads('${env_json}')
for cd in td.get('containerDefinitions', []):
    existing = {e['name']: e['value'] for e in cd.get('environment', [])}
    existing.update({e['name']: e['value'] for e in env})
    cd['environment'] = [{'name': k, 'value': v} for k, v in existing.items()]
for f in ['taskDefinitionArn','revision','status','requiresAttributes','compatibilities',
          'registeredAt','registeredBy','deregisteredAt']:
    td.pop(f, None)
print(json.dumps(td))
")

  aws ecs register-task-definition --cli-input-json "$new_def" --region "$REGION" --quiet
  echo "    Registered new task definition revision for $svc."
}

# Example: uncomment and customize CLUSTER to deploy after bootstrap.
# CLUSTER="unified-trading-${ENV}"
#
# deploy_service "market-tick-data-service"          "market-tick-data-service"          "$CLUSTER" live
# deploy_service "features-volatility-service"       "features-volatility-service"       "$CLUSTER" batch
# deploy_service "features-delta-one-service"        "features-delta-one-service"        "$CLUSTER" batch
# deploy_service "features-cross-instrument-service" "features-cross-instrument-service" "$CLUSTER" batch
# deploy_service "ml-training-service"               "ml-training-service"               "$CLUSTER" batch
# deploy_service "ml-inference-service"              "ml-inference-service"              "$CLUSTER" live
# deploy_service "strategy-service"                  "strategy-service"                  "$CLUSTER" live
# deploy_service "execution-service"                 "execution-service"                 "$CLUSTER" live
# deploy_service "risk-and-exposure-service"         "risk-and-exposure-service"         "$CLUSTER" live

# ---------------------------------------------------------------------------
# Export ATHENA_OUTPUT_BUCKET and core env vars — required by UCI
# ---------------------------------------------------------------------------
# Remove stale entries for this env, then append fresh values
if [[ -f "$ENV_FILE" ]]; then
  grep -v "ATHENA_OUTPUT_BUCKET.*${ENV}\|DEPLOYMENT_ENV.*bootstrap_aws\|AWS_REGION.*bootstrap_aws\|AWS_ACCOUNT_ID.*bootstrap_aws\|REDIS_URL.*${ENV}" \
    "$ENV_FILE" > "${ENV_FILE}.tmp" || true
  mv "${ENV_FILE}.tmp" "$ENV_FILE"
fi

echo "export ATHENA_OUTPUT_BUCKET=${ATHENA_BUCKET}   # ${ENV}" >> "$ENV_FILE"
echo "export DEPLOYMENT_ENV=${ENV}                     # set by bootstrap_aws.sh" >> "$ENV_FILE"
echo "export AWS_REGION=${REGION}                      # set by bootstrap_aws.sh" >> "$ENV_FILE"
echo "export AWS_ACCOUNT_ID=${ACCOUNT_ID}              # set by bootstrap_aws.sh" >> "$ENV_FILE"

echo ""
echo "==> AWS bootstrap complete."
echo "    Account:  $ACCOUNT_ID"
echo "    Region:   $REGION"
echo "    Env:      $ENV"
echo "    State:    s3://${STATE_BUCKET}/terraform/state"
echo ""
echo "    Environment vars written to: $ENV_FILE"
echo "    Add to your shell profile:   source $ENV_FILE"
echo ""
echo "    To deploy services with PROTOCOL_* env vars, uncomment the"
echo "    deploy_service() calls above or run them manually."
