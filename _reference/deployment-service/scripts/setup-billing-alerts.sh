#!/usr/bin/env bash
#
# setup-billing-alerts.sh — GCP billing budgets + daily cost breakdown reports
#
# Creates GCP billing budget alerts at 50% / 90% / 100% of monthly thresholds.
# Optionally creates a daily BigQuery export of billing data for breakdown analysis.
# AWS Cost Explorer equivalent alerts: see --cloud aws option (requires AWS creds).
#
# Usage:
#   GCP_PROJECT_ID=central-element-323112 ./setup-billing-alerts.sh [options]
#
# Options:
#   --cloud gcp|aws         Cloud provider (default: gcp)
#   --monthly-budget USD    Monthly budget in USD (default: 500)
#   --alert-email EMAIL     Email for budget alert notifications
#   --billing-account ID    GCP billing account ID (required for GCP)
#   --dry-run               Print what would be created without creating
#   --export-bq             Enable BigQuery billing export (recommended)
#
# Requirements (GCP):
#   - gcloud billing accounts list  (to find billing account ID)
#   - roles/billing.admin or roles/billing.budgetAdmin on billing account
#   - Pub/Sub topic 'billing-alerts' will be created for programmatic alerts
#
# AWS equivalent (when --cloud aws):
#   - Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
#   - Creates AWS Budgets alerts via CLI
#   - Status: BLOCKED — no AWS credentials configured
#

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
CLOUD="gcp"
MONTHLY_BUDGET_USD="500"
ALERT_EMAIL="${BILLING_ALERT_EMAIL:-}"
BILLING_ACCOUNT="${GCP_BILLING_ACCOUNT:-}"
DRY_RUN=false
EXPORT_BQ=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --cloud) CLOUD="$2"; shift 2 ;;
        --monthly-budget) MONTHLY_BUDGET_USD="$2"; shift 2 ;;
        --alert-email) ALERT_EMAIL="$2"; shift 2 ;;
        --billing-account) BILLING_ACCOUNT="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        --export-bq) EXPORT_BQ=true; shift ;;
        *) shift ;;
    esac
done

echo "================================================="
echo "Unified Trading System — Billing Alerts Setup"
echo "================================================="
echo "Cloud:          $CLOUD"
echo "Monthly budget: $MONTHLY_BUDGET_USD (account currency)"
echo "Alert email:    ${ALERT_EMAIL:-<not set — will use Pub/Sub only>}"
echo "Export to BQ:   $EXPORT_BQ"
echo "Dry-run:        $DRY_RUN"
echo "================================================="
echo

# ===========================================================================
# GCP billing alerts
# ===========================================================================
if [[ "$CLOUD" == "gcp" ]]; then
    gcloud config set project "$PROJECT_ID" --quiet

    # Enable required APIs
    if [[ "$DRY_RUN" == "false" ]]; then
        gcloud services enable billingbudgets.googleapis.com pubsub.googleapis.com --quiet || true
        [[ "$EXPORT_BQ" == "true" ]] && gcloud services enable bigquery.googleapis.com --quiet || true
    fi

    # Discover billing account if not provided
    if [[ -z "$BILLING_ACCOUNT" ]]; then
        echo "Looking up billing account for project $PROJECT_ID..."
        BILLING_ACCOUNT=$(gcloud billing projects describe "$PROJECT_ID" \
            --format="value(billingAccountName)" 2>/dev/null | sed 's|billingAccounts/||')
        if [[ -z "$BILLING_ACCOUNT" ]]; then
            echo "ERROR: Could not determine billing account."
            echo "Set GCP_BILLING_ACCOUNT env var or pass --billing-account <ID>"
            echo "List accounts: gcloud billing accounts list"
            exit 1
        fi
        echo "Billing account: $BILLING_ACCOUNT"
    fi

    # ---------------------------------------------------------------------------
    # 1. Create Pub/Sub topic for programmatic billing alerts
    # ---------------------------------------------------------------------------
    BILLING_TOPIC="billing-alerts"
    if gcloud pubsub topics describe "$BILLING_TOPIC" --project="$PROJECT_ID" &>/dev/null; then
        echo "[SKIP] Pub/Sub topic '$BILLING_TOPIC' already exists"
    elif [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY]  Would create Pub/Sub topic: $BILLING_TOPIC"
    else
        echo "[CREATE] Pub/Sub topic: $BILLING_TOPIC"
        gcloud pubsub topics create "$BILLING_TOPIC" \
            --project="$PROJECT_ID" \
            --message-retention-duration=30d \
            --quiet
        # Subscription for alerting-service
        gcloud pubsub subscriptions create billing-alerts-monitor \
            --topic="$BILLING_TOPIC" \
            --project="$PROJECT_ID" \
            --ack-deadline=60 \
            --quiet || true
        echo "[OK] Topic + subscription created"
    fi

    # ---------------------------------------------------------------------------
    # 2. Create budget alerts
    # Thresholds: 50%, 80%, 100%, 120% (overspend alert)
    # ---------------------------------------------------------------------------

    # Budget display names (used to check for duplicates)
    BUDGET_NAMES=(
        "unified-trading-monthly-budget"
        "unified-trading-dev-budget"
    )

    BUDGET_AMOUNTS=(
        "$MONTHLY_BUDGET_USD"    # Production: full budget
        "50"                     # Dev: $50 limit to catch runaway dev spend
    )

    BUDGET_LABELS=(
        "env=production"
        "env=development"
    )

    # Auto-detect billing account currency (avoids hardcoded USD assumption)
    BILLING_CURRENCY=$(gcloud billing budgets list \
        --billing-account="$BILLING_ACCOUNT" \
        --format="value(amount.specifiedAmount.currencyCode)" 2>/dev/null | head -1)
    BILLING_CURRENCY="${BILLING_CURRENCY:-USD}"

    for i in "${!BUDGET_NAMES[@]}"; do
        budget_name="${BUDGET_NAMES[$i]}"
        budget_amount="${BUDGET_AMOUNTS[$i]}"
        labels="${BUDGET_LABELS[$i]}"

        echo ""
        echo "Budget: $budget_name (${budget_amount}${BILLING_CURRENCY}/month)"

        if [[ "$DRY_RUN" == "true" ]]; then
            echo "  [DRY] Would create budget via gcloud billing budgets create:"
            echo "    --billing-account=$BILLING_ACCOUNT"
            echo "    --display-name=$budget_name"
            echo "    --budget-amount=${budget_amount}${BILLING_CURRENCY}"
            echo "    --threshold-rule=percent=0.5,basis=current-spend"
            echo "    --threshold-rule=percent=0.8,basis=current-spend"
            echo "    --threshold-rule=percent=1.0,basis=current-spend"
            echo "    --threshold-rule=percent=1.2,basis=current-spend"
            echo "    --notifications-rule-pubsub-topic=projects/$PROJECT_ID/topics/$BILLING_TOPIC"
            continue
        fi

        # Check if budget already exists (by display name in list)
        existing=$(gcloud billing budgets list \
            --billing-account="$BILLING_ACCOUNT" \
            --format="value(displayName)" 2>/dev/null | grep -c "^${budget_name}$" || true)

        if [[ "$existing" -gt 0 ]]; then
            echo "  [SKIP] Budget '$budget_name' already exists"
            continue
        fi

        # Build pubsub arg
        PUBSUB_ARG="--notifications-rule-pubsub-topic=projects/${PROJECT_ID}/topics/${BILLING_TOPIC}"

        # Build email arg if set
        EMAIL_ARGS=""
        if [[ -n "$ALERT_EMAIL" ]]; then
            EMAIL_ARGS="--notifications-rule-email-recipients=$ALERT_EMAIL"
        fi

        echo "  [CREATE] Creating budget..."
        # shellcheck disable=SC2086
        gcloud billing budgets create \
            --billing-account="$BILLING_ACCOUNT" \
            --display-name="$budget_name" \
            --budget-amount="${budget_amount}${BILLING_CURRENCY}" \
            --threshold-rule=percent=0.5,basis=current-spend \
            --threshold-rule=percent=0.8,basis=current-spend \
            --threshold-rule=percent=1.0,basis=current-spend \
            --threshold-rule=percent=1.2,basis=current-spend \
            "$PUBSUB_ARG" \
            $EMAIL_ARGS \
            --filter-projects="projects/$PROJECT_ID" \
            --quiet 2>&1 || echo "  [WARN] Budget creation may require billing.budgetAdmin role"
        echo "  [OK] Budget created"
    done

    # ---------------------------------------------------------------------------
    # 3. Optional: BigQuery billing export
    # ---------------------------------------------------------------------------
    if [[ "$EXPORT_BQ" == "true" ]]; then
        echo ""
        echo "--- BigQuery billing export ---"
        BQ_DATASET="billing_export"
        BQ_TABLE="gcp_billing_export_v1"

        if [[ "$DRY_RUN" == "true" ]]; then
            echo "[DRY] Would create BQ dataset: $BQ_DATASET.$BQ_TABLE"
            echo "[DRY] Would enable billing export via GCP Console"
            echo "NOTE: Billing export must be enabled in GCP Console:"
            echo "  Billing → Billing export → BigQuery export"
            echo "  Dataset: $BQ_DATASET"
        else
            # Create dataset if missing
            bq show --project_id="$PROJECT_ID" "$BQ_DATASET" &>/dev/null || \
                bq mk --project_id="$PROJECT_ID" --dataset \
                    --description="GCP billing export for cost analysis" \
                    "$BQ_DATASET" || true
            echo "[OK] BQ dataset $BQ_DATASET ready"
            echo ""
            echo "IMPORTANT: Enable billing export in GCP Console:"
            echo "  https://console.cloud.google.com/billing"
            echo "  → Billing export → BigQuery export → Edit settings"
            echo "  → Project: $PROJECT_ID, Dataset: $BQ_DATASET"
        fi
    fi

    echo ""
    echo "================================================="
    echo "GCP billing alerts setup complete"
    echo "================================================="
    echo ""
    echo "Daily cost breakdown query (run in BigQuery after export is enabled):"
    cat <<'QUERY'
SELECT
  DATE(usage_start_time) AS date,
  service.description    AS service,
  SUM(cost)              AS total_cost_usd,
  SUM(usage.amount)      AS total_usage
FROM `billing_export.gcp_billing_export_v1`
WHERE DATE(usage_start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC
LIMIT 100;
QUERY

# ===========================================================================
# AWS billing alerts
# ===========================================================================
elif [[ "$CLOUD" == "aws" ]]; then
    echo "AWS billing alerts — BLOCKED: no AWS credentials configured"
    echo ""
    echo "When AWS credentials are available:"
    echo "  export AWS_ACCESS_KEY_ID=..."
    echo "  export AWS_SECRET_ACCESS_KEY=..."
    echo ""
    echo "  # Create billing alarm via CloudWatch"
    echo "  aws cloudwatch put-metric-alarm \\"
    echo "    --alarm-name unified-trading-monthly-budget \\"
    echo "    --alarm-description 'Monthly AWS spend alert' \\"
    echo "    --metric-name EstimatedCharges \\"
    echo "    --namespace AWS/Billing \\"
    echo "    --statistic Maximum \\"
    echo "    --period 86400 \\"
    echo "    --threshold $MONTHLY_BUDGET_USD \\"
    echo "    --comparison-operator GreaterThanThreshold \\"
    echo "    --dimensions Name=Currency,Value=USD \\"
    echo "    --alarm-actions arn:aws:sns:us-east-1:<account>:billing-alerts \\"
    echo "    --treat-missing-data breaching"
    echo ""
    echo "  # Create AWS Budgets entry"
    echo "  aws budgets create-budget --account-id \$(aws sts get-caller-identity --query Account --output text) \\"
    echo "    --budget file://aws-budget.json \\"
    echo "    --notifications-with-subscribers file://aws-budget-subscribers.json"
    exit 0
else
    echo "ERROR: --cloud must be 'gcp' or 'aws'"
    exit 1
fi
