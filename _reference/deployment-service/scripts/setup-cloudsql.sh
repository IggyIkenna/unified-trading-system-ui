#!/usr/bin/env bash
#
# setup-cloudsql.sh — PostgreSQL database setup for execution-service order state
#
# GCP: Cloud SQL PostgreSQL 15 (trading-order-state, db-g1-small)
# AWS: RDS PostgreSQL 15 (trading-order-state, db.t3.micro)
#
# Provisions instance + database + user + stores connection URL in Secret Manager.
# Idempotent — safe to re-run. Skips already-existing instances/databases/users.
#
# Usage:
#   GCP_PROJECT_ID=central-element-323112 ./setup-cloudsql.sh [--cloud gcp|aws] [--dry-run]
#   AWS_REGION=ap-northeast-1 ./setup-cloudsql.sh --cloud aws [--dry-run]
#
# Optional env vars:
#   CLOUDSQL_INSTANCE_NAME  — defaults to "trading-order-state"
#   CLOUDSQL_REGION         — defaults to "asia-northeast1" (GCP) / "ap-northeast-1" (AWS)
#   CLOUDSQL_TIER           — defaults to "db-g1-small" (GCP) / "db.t3.micro" (AWS)
#   CLOUDSQL_DB_NAME        — defaults to "order_state"
#   CLOUDSQL_USER           — defaults to "execution_svc"
#

set -euo pipefail

CLOUD="gcp"
DRY_RUN=false
_POS_ARGS=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        --cloud) CLOUD="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) _POS_ARGS+=("$1"); shift ;;
    esac
done

PROJECT_ID="${GCP_PROJECT_ID:-${_POS_ARGS[0]:-$(gcloud config get-value project 2>/dev/null || echo '')}}"

INSTANCE_NAME="${CLOUDSQL_INSTANCE_NAME:-trading-order-state}"
REGION="${CLOUDSQL_REGION:-${GCS_REGION:-asia-northeast1}}"
TIER="${CLOUDSQL_TIER:-db-g1-small}"
DB_NAME="${CLOUDSQL_DB_NAME:-order_state}"
DB_USER="${CLOUDSQL_USER:-execution_svc}"

echo "================================================="
echo "Unified Trading System — Database Setup"
echo "================================================="
echo "Cloud:     $CLOUD"
echo "Instance:  $INSTANCE_NAME"
echo "Region:    $REGION"
echo "Tier:      $TIER"
echo "Database:  $DB_NAME"
echo "User:      $DB_USER"
echo "Dry-run:   $DRY_RUN"
echo "================================================="
echo

# ---------------------------------------------------------------------------
# AWS RDS implementation
# ---------------------------------------------------------------------------
if [[ "$CLOUD" == "aws" ]]; then
    AWS_REGION="${AWS_REGION:-$REGION}"
    RDS_TIER="${CLOUDSQL_TIER:-db.t3.micro}"
    RDS_SECRET_URL="rds-execution-db-url"
    RDS_SECRET_PWD="rds-execution-db-password"

    if ! command -v aws &>/dev/null; then
        echo "[BLOCKED] AWS CLI not installed."
        exit 1
    fi
    if ! aws sts get-caller-identity &>/dev/null; then
        echo "[BLOCKED] No AWS credentials. Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY."
        exit 1
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] Would create:"
        echo "  aws rds create-db-instance --db-instance-identifier $INSTANCE_NAME"
        echo "    --db-instance-class $RDS_TIER --engine postgres --engine-version 15"
        echo "    --master-username $DB_USER --allocated-storage 20 --db-name $DB_NAME"
        echo "    --no-publicly-accessible --region $AWS_REGION"
        echo "  aws secretsmanager create-secret --name $RDS_SECRET_URL ..."
        echo "  aws secretsmanager create-secret --name $RDS_SECRET_PWD ..."
        echo ""
        echo "Connection string format:"
        echo "  postgresql+asyncpg://$DB_USER:<password>@<rds-endpoint>:5432/$DB_NAME"
        exit 0
    fi

    # Check if RDS instance exists
    if aws rds describe-db-instances \
            --db-instance-identifier "$INSTANCE_NAME" \
            --region "$AWS_REGION" &>/dev/null; then
        echo "[SKIP] RDS instance '$INSTANCE_NAME' already exists"
    else
        echo "[CREATE] RDS instance '$INSTANCE_NAME' (takes ~10 min)..."
        DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

        aws rds create-db-instance \
            --db-instance-identifier "$INSTANCE_NAME" \
            --db-instance-class "$RDS_TIER" \
            --engine postgres \
            --engine-version 15 \
            --master-username "$DB_USER" \
            --master-user-password "$DB_PASSWORD" \
            --allocated-storage 20 \
            --db-name "$DB_NAME" \
            --no-publicly-accessible \
            --backup-retention-period 7 \
            --region "$AWS_REGION" \
            --output text --query 'DBInstance.DBInstanceIdentifier' 2>&1
        echo "[OK] RDS instance created (status: creating — takes ~10 min)"

        # Wait for available
        echo "[WAIT] Waiting for RDS to become available..."
        aws rds wait db-instance-available \
            --db-instance-identifier "$INSTANCE_NAME" \
            --region "$AWS_REGION" || echo "[WARN] wait timed out — check console"

        # Get endpoint
        RDS_ENDPOINT=$(aws rds describe-db-instances \
            --db-instance-identifier "$INSTANCE_NAME" \
            --region "$AWS_REGION" \
            --output text --query 'DBInstances[0].Endpoint.Address')
        DB_URL="postgresql+asyncpg://$DB_USER:$DB_PASSWORD@${RDS_ENDPOINT}:5432/$DB_NAME"

        # Store in AWS Secrets Manager
        aws secretsmanager create-secret \
            --name "$RDS_SECRET_URL" \
            --secret-string "$DB_URL" \
            --region "$AWS_REGION" &>/dev/null || \
        aws secretsmanager update-secret \
            --secret-id "$RDS_SECRET_URL" \
            --secret-string "$DB_URL" \
            --region "$AWS_REGION" &>/dev/null
        aws secretsmanager create-secret \
            --name "$RDS_SECRET_PWD" \
            --secret-string "$DB_PASSWORD" \
            --region "$AWS_REGION" &>/dev/null || \
        aws secretsmanager update-secret \
            --secret-id "$RDS_SECRET_PWD" \
            --secret-string "$DB_PASSWORD" \
            --region "$AWS_REGION" &>/dev/null
        echo "[OK] Secrets stored: $RDS_SECRET_URL, $RDS_SECRET_PWD"
        echo ""
        echo "execution-service config:"
        echo "  AWS_DATABASE_URL=\$(aws secretsmanager get-secret-value --secret-id $RDS_SECRET_URL --query SecretString --output text)"
        echo "  USE_DATABASE=true"
    fi
    exit 0
fi

# GCP path below
if [[ "$DRY_RUN" == "true" ]]; then
    echo "[DRY-RUN] Would create:"
    echo "  gcloud sql instances create $INSTANCE_NAME --tier=$TIER --region=$REGION ..."
    echo "  gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME"
    echo "  gcloud sql users create $DB_USER --instance=$INSTANCE_NAME"
    echo "  Secret Manager: cloudsql-execution-db-url"
    echo "  IAM: Cloud SQL Client role for github-actions-deploy SA"
    echo ""
    echo "Connection string format:"
    echo "  postgresql+asyncpg://$DB_USER:<password>@/<db_name>?host=/cloudsql/$PROJECT_ID:$REGION:$INSTANCE_NAME"
    exit 0
fi

gcloud config set project "$PROJECT_ID" --quiet

# Enable Cloud SQL Admin API
echo "Enabling Cloud SQL API..."
gcloud services enable sqladmin.googleapis.com --project="$PROJECT_ID" --quiet || true

# ---------------------------------------------------------------------------
# 1. Create Cloud SQL instance (if not exists)
# ---------------------------------------------------------------------------
if gcloud sql instances describe "$INSTANCE_NAME" --project="$PROJECT_ID" &>/dev/null; then
    echo "[SKIP] Cloud SQL instance '$INSTANCE_NAME' already exists"
else
    echo "[CREATE] Cloud SQL instance '$INSTANCE_NAME' (this takes 3-5 minutes)..."
    gcloud sql instances create "$INSTANCE_NAME" \
        --project="$PROJECT_ID" \
        --database-version=POSTGRES_15 \
        --tier="$TIER" \
        --region="$REGION" \
        --storage-auto-increase \
        --storage-size=10GB \
        --backup-start-time=03:00 \
        --deletion-protection \
        --database-flags=max_connections=100,log_min_duration_statement=1000 \
        --insights-config-query-insights-enabled \
        --quiet
    echo "[OK] Cloud SQL instance created"
fi

# ---------------------------------------------------------------------------
# 2. Create database (if not exists)
# ---------------------------------------------------------------------------
if gcloud sql databases describe "$DB_NAME" --instance="$INSTANCE_NAME" --project="$PROJECT_ID" &>/dev/null; then
    echo "[SKIP] Database '$DB_NAME' already exists"
else
    echo "[CREATE] Database '$DB_NAME'..."
    gcloud sql databases create "$DB_NAME" \
        --instance="$INSTANCE_NAME" \
        --project="$PROJECT_ID" \
        --quiet
    echo "[OK] Database '$DB_NAME' created"
fi

# ---------------------------------------------------------------------------
# 3. Create user + store password in Secret Manager
# ---------------------------------------------------------------------------
PASSWORD_SECRET="cloudsql-execution-db-password"
DB_URL_SECRET="cloudsql-execution-db-url"

# Generate password if not already in Secret Manager
if gcloud secrets describe "$PASSWORD_SECRET" --project="$PROJECT_ID" &>/dev/null; then
    echo "[SKIP] Secret '$PASSWORD_SECRET' already exists"
    DB_PASSWORD=$(gcloud secrets versions access latest --secret="$PASSWORD_SECRET" --project="$PROJECT_ID")
else
    echo "[CREATE] Generating password and storing in Secret Manager..."
    DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    echo -n "$DB_PASSWORD" | gcloud secrets create "$PASSWORD_SECRET" \
        --project="$PROJECT_ID" \
        --data-file=- \
        --quiet
    echo "[OK] Password stored in Secret Manager as '$PASSWORD_SECRET'"
fi

# Create DB user
if gcloud sql users list --instance="$INSTANCE_NAME" --project="$PROJECT_ID" 2>/dev/null | grep -q "^$DB_USER "; then
    echo "[SKIP] DB user '$DB_USER' already exists"
else
    echo "[CREATE] DB user '$DB_USER'..."
    gcloud sql users create "$DB_USER" \
        --instance="$INSTANCE_NAME" \
        --project="$PROJECT_ID" \
        --password="$DB_PASSWORD" \
        --quiet
    echo "[OK] DB user '$DB_USER' created"
fi

# Store full connection URL in Secret Manager
INSTANCE_CONNECTION_NAME="$PROJECT_ID:$REGION:$INSTANCE_NAME"
DB_URL="postgresql+asyncpg://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$INSTANCE_CONNECTION_NAME"

if gcloud secrets describe "$DB_URL_SECRET" --project="$PROJECT_ID" &>/dev/null; then
    echo "[UPDATE] Updating '$DB_URL_SECRET' in Secret Manager..."
    echo -n "$DB_URL" | gcloud secrets versions add "$DB_URL_SECRET" \
        --project="$PROJECT_ID" \
        --data-file=- \
        --quiet
else
    echo "[CREATE] Storing connection URL in Secret Manager as '$DB_URL_SECRET'..."
    echo -n "$DB_URL" | gcloud secrets create "$DB_URL_SECRET" \
        --project="$PROJECT_ID" \
        --data-file=- \
        --quiet
fi
echo "[OK] DB URL stored in Secret Manager as '$DB_URL_SECRET'"

# ---------------------------------------------------------------------------
# 4. Grant Cloud SQL Client role to github-actions-deploy SA
# ---------------------------------------------------------------------------
SA_EMAIL="github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com"
echo "[IAM] Granting roles/cloudsql.client to $SA_EMAIL..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/cloudsql.client" \
    --quiet 2>&1 | grep -E "bindings|serviceAccount" || true
echo "[OK] IAM policy updated"

echo
echo "================================================="
echo "Cloud SQL setup complete"
echo "================================================="
echo "Instance: $INSTANCE_NAME"
echo "Connection: $INSTANCE_CONNECTION_NAME"
echo ""
echo "Secrets stored in GCP Secret Manager:"
echo "  $PASSWORD_SECRET   — DB password"
echo "  $DB_URL_SECRET     — Full asyncpg connection URL"
echo ""
echo "To connect via Cloud SQL Auth Proxy:"
echo "  cloud-sql-proxy $INSTANCE_CONNECTION_NAME &"
echo "  psql -h 127.0.0.1 -U $DB_USER -d $DB_NAME"
echo ""
echo "execution-service config:"
echo "  DATABASE_URL=\$(gcloud secrets versions access latest --secret=$DB_URL_SECRET)"
echo "  USE_DATABASE=true"
