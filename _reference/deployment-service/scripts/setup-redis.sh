#!/usr/bin/env bash
#
# setup-redis.sh — Redis cache setup
#
# GCP: Cloud Memorystore (Redis 7.0) — stores connection in GCP Secret Manager
# AWS: ElastiCache (Redis 7.x) — stores connection in AWS Secrets Manager
#
# Idempotent — safe to run multiple times.
#
# Usage:
#   GCP_PROJECT_ID=central-element-323112 ./setup-redis.sh [--cloud gcp|aws] [--dry-run]
#   AWS_REGION=ap-northeast-1 ./setup-redis.sh --cloud aws [--dry-run]
#

set -euo pipefail

# Parse arguments — cloud flag first, then positional
CLOUD="gcp"
DRY_RUN_REDIS=false
_REDIS_POS=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        --cloud) CLOUD="$2"; shift 2 ;;
        --dry-run) DRY_RUN_REDIS=true; shift ;;
        *) _REDIS_POS+=("$1"); shift ;;
    esac
done

# ---------------------------------------------------------------------------
# AWS ElastiCache implementation
# ---------------------------------------------------------------------------
if [[ "$CLOUD" == "aws" ]]; then
    AWS_REGION="${AWS_REGION:-ap-northeast-1}"
    ELASTICACHE_ID="${REDIS_INSTANCE_NAME:-trading-cache}"
    ELASTICACHE_NODE="${ELASTICACHE_NODE_TYPE:-cache.t3.micro}"

    echo "=============================================="
    echo "Unified Trading System — ElastiCache Setup (AWS)"
    echo "=============================================="
    echo "Region:        $AWS_REGION"
    echo "Cluster ID:    $ELASTICACHE_ID"
    echo "Node type:     $ELASTICACHE_NODE"
    echo "Dry-run:       $DRY_RUN_REDIS"
    echo "=============================================="

    if ! command -v aws &>/dev/null; then
        echo "[BLOCKED] AWS CLI not installed."
        exit 1
    fi
    if ! aws sts get-caller-identity &>/dev/null; then
        echo "[BLOCKED] No AWS credentials. Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY."
        exit 1
    fi

    if [[ "$DRY_RUN_REDIS" == "true" ]]; then
        echo "[DRY-RUN] Would create:"
        echo "  aws elasticache create-replication-group \\"
        echo "    --replication-group-id $ELASTICACHE_ID \\"
        echo "    --replication-group-description 'Unified Trading Redis Cache' \\"
        echo "    --engine redis --engine-version 7.0 \\"
        echo "    --cache-node-type $ELASTICACHE_NODE \\"
        echo "    --num-cache-clusters 1 --region $AWS_REGION"
        echo "  aws secretsmanager create-secret --name elasticache-url ..."
        exit 0
    fi

    if aws elasticache describe-replication-groups \
            --replication-group-id "$ELASTICACHE_ID" \
            --region "$AWS_REGION" &>/dev/null; then
        echo "[SKIP] ElastiCache cluster '$ELASTICACHE_ID' already exists"
        CACHE_ENDPOINT=$(aws elasticache describe-replication-groups \
            --replication-group-id "$ELASTICACHE_ID" \
            --region "$AWS_REGION" \
            --output text --query 'ReplicationGroups[0].NodeGroups[0].PrimaryEndpoint.Address')
    else
        echo "[CREATE] ElastiCache cluster '$ELASTICACHE_ID' (takes ~5 min)..."
        aws elasticache create-replication-group \
            --replication-group-id "$ELASTICACHE_ID" \
            --replication-group-description "Unified Trading Redis Cache" \
            --engine redis \
            --engine-version 7.0 \
            --cache-node-type "$ELASTICACHE_NODE" \
            --num-cache-clusters 1 \
            --at-rest-encryption-enabled \
            --transit-encryption-enabled \
            --region "$AWS_REGION" \
            --output text --query 'ReplicationGroup.ReplicationGroupId' 2>&1
        echo "[WAIT] Waiting for cluster to become available..."
        aws elasticache wait replication-group-available \
            --replication-group-id "$ELASTICACHE_ID" \
            --region "$AWS_REGION" || echo "[WARN] wait timed out — check console"
        CACHE_ENDPOINT=$(aws elasticache describe-replication-groups \
            --replication-group-id "$ELASTICACHE_ID" \
            --region "$AWS_REGION" \
            --output text --query 'ReplicationGroups[0].NodeGroups[0].PrimaryEndpoint.Address')
        echo "[OK] ElastiCache cluster created at $CACHE_ENDPOINT"
    fi

    REDIS_URL="redis://${CACHE_ENDPOINT}:6379"
    aws secretsmanager create-secret \
        --name "elasticache-url" \
        --secret-string "$REDIS_URL" \
        --region "$AWS_REGION" &>/dev/null || \
    aws secretsmanager update-secret \
        --secret-id "elasticache-url" \
        --secret-string "$REDIS_URL" \
        --region "$AWS_REGION" &>/dev/null
    echo "[OK] elasticache-url stored in AWS Secrets Manager"
    echo ""
    echo "Set in execution env: ELASTICACHE_URL=$REDIS_URL"
    exit 0
fi

# GCP path — original args
PROJECT_ID="${_REDIS_POS[0]:-${GCP_PROJECT_ID:-$(gcloud config get-value project)}}"
# Align with deployment region (GCS_REGION=asia-northeast1). If primary has no capacity,
# set REDIS_REGION=us-central1 (or europe-west1) before running.
REGION="${REDIS_REGION:-${GCS_REGION:-asia-northeast1}}"
REDIS_INSTANCE_NAME="${REDIS_INSTANCE_NAME:-trading-cache}"
REDIS_SIZE_GB="${REDIS_SIZE_GB:-1}"
REDIS_VERSION="${REDIS_VERSION:-redis_7_0}"

echo "=============================================="
echo "Unified Trading System — Redis Setup"
echo "=============================================="
echo "Project:        $PROJECT_ID"
echo "Region:         $REGION"
echo "Instance Name:  $REDIS_INSTANCE_NAME"
echo "Size (GB):      $REDIS_SIZE_GB"
echo "Redis Version:  $REDIS_VERSION"
echo "=============================================="
echo

# Set the project
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo "[1/5] Enabling required APIs..."
gcloud services enable redis.googleapis.com --project="$PROJECT_ID"
echo "✅ APIs enabled"

# Check if Redis instance already exists
echo
echo "[2/5] Checking for existing Redis instance..."
if gcloud redis instances describe "$REDIS_INSTANCE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" &>/dev/null; then
    echo "✅ Redis instance '$REDIS_INSTANCE_NAME' already exists"
    INSTANCE_EXISTS=true
else
    echo "Redis instance not found. Will create new instance."
    INSTANCE_EXISTS=false
fi

# Create or update Redis instance
echo
echo "[3/5] Creating/updating Redis instance..."
if [ "$INSTANCE_EXISTS" = false ]; then
    echo "Creating new Redis instance in $REGION (this may take 5-10 minutes)..."
    echo "  (If 'no capacity' error: REDIS_REGION=us-central1 $0 $PROJECT_ID)"
    gcloud redis instances create "$REDIS_INSTANCE_NAME" \
        --size="$REDIS_SIZE_GB" \
        --region="$REGION" \
        --redis-version="$REDIS_VERSION" \
        --enable-auth \
        --project="$PROJECT_ID" \
        --quiet \
        --async

    echo "⏳ Waiting for Redis instance to be ready..."
    while true; do
        STATE=$(gcloud redis instances describe "$REDIS_INSTANCE_NAME" \
            --region="$REGION" \
            --project="$PROJECT_ID" \
            --format="value(state)" 2>/dev/null || echo "CREATING")

        if [ "$STATE" = "READY" ]; then
            echo "✅ Redis instance is ready!"
            break
        elif [ "$STATE" = "CREATING" ]; then
            echo "⏳ Still creating... (usually 5-10 minutes)"
            sleep 30
        else
            echo "❌ Unexpected state: $STATE"
            exit 1
        fi
    done
else
    echo "✅ Using existing Redis instance"
fi

# Get Redis instance details
echo
echo "[4/5] Getting Redis instance details..."
REDIS_HOST=$(gcloud redis instances describe "$REDIS_INSTANCE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(host)")

REDIS_PORT=$(gcloud redis instances describe "$REDIS_INSTANCE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(port)")

REDIS_AUTH_STRING=$(gcloud redis instances get-auth-string "$REDIS_INSTANCE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" 2>/dev/null || echo "")

echo "Redis Host: $REDIS_HOST"
echo "Redis Port: $REDIS_PORT"
echo "Auth Enabled: $([ -n "$REDIS_AUTH_STRING" ] && echo "Yes" || echo "No")"

# Create Redis URL
if [ -n "$REDIS_AUTH_STRING" ]; then
    REDIS_URL="redis://default:${REDIS_AUTH_STRING}@${REDIS_HOST}:${REDIS_PORT}"
else
    REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"
fi

# Store in Secret Manager
echo
echo "[5/5] Storing Redis connection details in Secret Manager..."

# Enable Secret Manager API if needed
gcloud services enable secretmanager.googleapis.com --project="$PROJECT_ID" 2>/dev/null || true

# Function to create or update a secret
create_or_update_secret() {
    local secret_name="$1"
    local secret_value="$2"

    # Check if secret exists
    if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" &>/dev/null; then
        echo "  Updating secret: $secret_name"
        echo -n "$secret_value" | gcloud secrets versions add "$secret_name" \
            --project="$PROJECT_ID" \
            --data-file=-
    else
        echo "  Creating secret: $secret_name"
        echo -n "$secret_value" | gcloud secrets create "$secret_name" \
            --project="$PROJECT_ID" \
            --replication-policy="automatic" \
            --data-file=-
    fi
}

# Store Redis URL
create_or_update_secret "redis-url" "$REDIS_URL"

# Store individual components (optional, for flexibility)
create_or_update_secret "redis-host" "$REDIS_HOST"
create_or_update_secret "redis-port" "$REDIS_PORT"
if [ -n "$REDIS_AUTH_STRING" ]; then
    create_or_update_secret "redis-password" "$REDIS_AUTH_STRING"
fi

echo
echo "=============================================="
echo "✅ Redis Setup Complete!"
echo "=============================================="
echo
echo "Connection Details:"
echo "  Host: $REDIS_HOST"
echo "  Port: $REDIS_PORT"
echo "  Auth: $([ -n "$REDIS_AUTH_STRING" ] && echo "Enabled" || echo "Disabled")"
echo
echo "Secrets Created:"
echo "  - redis-url (full connection string)"
echo "  - redis-host"
echo "  - redis-port"
[ -n "$REDIS_AUTH_STRING" ] && echo "  - redis-password"
echo
echo "To connect from your application:"
echo "  1. Grant service account access to secrets:"
echo "     gcloud secrets add-iam-policy-binding redis-url \\"
echo "         --member='serviceAccount:YOUR_SERVICE_ACCOUNT@${PROJECT_ID}.iam.gserviceaccount.com' \\"
echo "         --role='roles/secretmanager.secretAccessor'"
echo
echo "  2. Use the redis-url secret in your application:"
echo "     from unified_trading_library.core.secret_manager import get_secrets_with_fallback"
echo "     secrets = get_secrets_with_fallback({'redis-url': 'REDIS_URL'}, project_id='$PROJECT_ID')"
echo "     redis_url = secrets['redis-url']"
echo
echo "Note: If using from Compute Engine or Cloud Run in the same region,"
echo "      use the private IP for better performance and security."
echo "=============================================="
