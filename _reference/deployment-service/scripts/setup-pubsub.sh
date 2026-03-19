#!/usr/bin/env bash
#
# setup-pubsub.sh — Create all required messaging topics and subscriptions
#
# GCP: Pub/Sub topics + pull subscriptions (idempotent)
# AWS: SNS topics + SQS queues + SNS→SQS subscriptions (idempotent)
#
# Topics are the system-of-record message bus for the unified trading platform.
# Each service that publishes defines a topic; each downstream consumer gets
# a pull subscription.
#
# Usage:
#   GCP_PROJECT_ID=central-element-323112 ./setup-pubsub.sh [--cloud gcp|aws] [--dry-run]
#   AWS_REGION=ap-northeast-1 ./setup-pubsub.sh --cloud aws [--dry-run]
#
# Options:
#   --cloud gcp|aws   Cloud provider (default: gcp)
#   --dry-run         Print what would be created without creating anything
#   --list-only       List existing topics in the project (GCP only)
#

set -euo pipefail

# Parse flags first; collect non-flag args for positional project_id
CLOUD="gcp"
DRY_RUN=false
LIST_ONLY=false
_POS_ARGS=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        --cloud) CLOUD="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        --list-only) LIST_ONLY=true; shift ;;
        *) _POS_ARGS+=("$1"); shift ;;
    esac
done

# Project / region
PROJECT_ID="${GCP_PROJECT_ID:-${_POS_ARGS[0]:-$(gcloud config get-value project 2>/dev/null || echo '')}}"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo 'UNKNOWN')}"

echo "================================================="
echo "Unified Trading System — Messaging Setup"
echo "================================================="
echo "Cloud:     $CLOUD"
if [[ "$CLOUD" == "gcp" ]]; then
    echo "Project:   $PROJECT_ID"
else
    echo "Region:    $AWS_REGION"
    echo "Account:   $AWS_ACCOUNT_ID"
fi
echo "Dry-run:   $DRY_RUN"
echo "================================================="
echo

# Route to cloud-specific implementation
if [[ "$CLOUD" == "aws" ]]; then
    _run_aws_messaging
    exit $?
fi

gcloud config set project "$PROJECT_ID" --quiet

# Enable Pub/Sub API
if [[ "$DRY_RUN" == "false" ]]; then
    gcloud services enable pubsub.googleapis.com --project="$PROJECT_ID" --quiet || true
fi

# List-only mode
if [[ "$LIST_ONLY" == "true" ]]; then
    echo "--- Existing Pub/Sub topics ---"
    gcloud pubsub topics list --project="$PROJECT_ID" --format="value(name)"
    echo
    echo "--- Existing Pub/Sub subscriptions ---"
    gcloud pubsub subscriptions list --project="$PROJECT_ID" --format="value(name)"
    exit 0
fi

# ---------------------------------------------------------------------------
# Topic + subscription registry
# Format: TOPIC_NAME|MESSAGE_RETENTION_DAYS|SUBSCRIPTION_NAMES(comma-sep)|SUB_RETENTION_DAYS
# ---------------------------------------------------------------------------
# Core topics — deployment-service
TOPIC_REGISTRY=(
    # Deployment pipeline events
    "deployment-events|7|deployment-events-monitor|7"
    "deployment-status|7|deployment-status-monitor,deployment-status-ui|7"
    "deployment-alerts|7|deployment-alerts-monitor|7"

    # Execution service — fill events per CeFi venue (binance/bybit/okx/deribit)
    "fill-events-binance|3|fill-events-binance-pnl,fill-events-binance-risk,fill-events-binance-strategy|3"
    "fill-events-bybit|3|fill-events-bybit-pnl,fill-events-bybit-risk,fill-events-bybit-strategy|3"
    "fill-events-okx|3|fill-events-okx-pnl,fill-events-okx-risk,fill-events-okx-strategy|3"
    "fill-events-deribit|3|fill-events-deribit-pnl,fill-events-deribit-risk,fill-events-deribit-strategy|3"
    "fill-events-hyperliquid|3|fill-events-hyperliquid-pnl,fill-events-hyperliquid-risk|3"

    # Risk / circuit breaker
    "circuit-breaker-events|7|circuit-breaker-monitor,circuit-breaker-execution|7"
    "risk-breach-alerts|7|risk-breach-alerting,risk-breach-execution|7"
    "position-updates|3|position-updates-risk,position-updates-pnl,position-updates-monitor|3"

    # ML / predictions
    "cascade-predictions|7|cascade-predictions-strategy,cascade-predictions-monitor|7"
    "ml-predictions|7|ml-predictions-strategy,ml-predictions-risk|7"

    # Strategy / signals
    "strategy-sports-signals|7|strategy-sports-signals-execution,strategy-sports-signals-monitor|7"
    "strategy-signals|7|strategy-signals-execution,strategy-signals-risk|7"

    # Config / ops
    "config-updates|14|config-updates-execution,config-updates-strategy,config-updates-risk,config-updates-features|14"
    "system-health-events|7|system-health-alerting,system-health-monitor|7"
    "audit-log-events|30|audit-log-sink|30"
)

# ---------------------------------------------------------------------------
# AWS SNS + SQS implementation
# ---------------------------------------------------------------------------
_run_aws_messaging() {
    if ! command -v aws &>/dev/null; then
        echo "[BLOCKED] AWS CLI not installed. Install: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
        return 1
    fi
    if ! aws sts get-caller-identity &>/dev/null; then
        echo "[BLOCKED] No AWS credentials. Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY."
        return 1
    fi

    local created_topics=0 skipped_topics=0 created_queues=0 skipped_queues=0 errors=0

    for entry in "${TOPIC_REGISTRY[@]}"; do
        IFS='|' read -r topic_name _retention subscriptions _sub_retention <<< "$entry"
        local sns_name="trading-${topic_name}"
        echo "Topic: $sns_name"

        # Create SNS topic (idempotent — returns existing ARN if exists)
        if [[ "$DRY_RUN" == "true" ]]; then
            echo "  [DRY]  sns topic: $sns_name"
        else
            local topic_arn
            topic_arn=$(aws sns create-topic \
                --name "$sns_name" \
                --region "$AWS_REGION" \
                --output text --query 'TopicArn' 2>&1) || { echo "  [ERROR] sns create-topic $sns_name"; ((errors++)) || true; continue; }
            echo "  [OK] sns: $topic_arn"
            ((created_topics++)) || true

            # Create SQS queue per subscriber and subscribe to SNS
            IFS=',' read -ra sub_list <<< "$subscriptions"
            for sub in "${sub_list[@]}"; do
                [[ -z "$sub" ]] && continue
                local queue_name="trading-${sub}"
                local queue_url
                queue_url=$(aws sqs create-queue \
                    --queue-name "$queue_name" \
                    --region "$AWS_REGION" \
                    --output text --query 'QueueUrl' 2>&1) || { echo "    [ERROR] sqs create-queue $queue_name"; ((errors++)) || true; continue; }
                local queue_arn
                queue_arn=$(aws sqs get-queue-attributes \
                    --queue-url "$queue_url" \
                    --attribute-names QueueArn \
                    --region "$AWS_REGION" \
                    --output text --query 'Attributes.QueueArn' 2>&1)
                aws sqs set-queue-attributes \
                    --queue-url "$queue_url" \
                    --attributes "{\"Policy\":\"{\\\"Version\\\":\\\"2012-10-17\\\",\\\"Statement\\\":[{\\\"Effect\\\":\\\"Allow\\\",\\\"Principal\\\":{\\\"Service\\\":\\\"sns.amazonaws.com\\\"},\\\"Action\\\":\\\"sqs:SendMessage\\\",\\\"Resource\\\":\\\"$queue_arn\\\",\\\"Condition\\\":{\\\"ArnEquals\\\":{\\\"aws:SourceArn\\\":\\\"$topic_arn\\\"}}}]}\"}" \
                    --region "$AWS_REGION" &>/dev/null || true
                aws sns subscribe \
                    --topic-arn "$topic_arn" \
                    --protocol sqs \
                    --notification-endpoint "$queue_arn" \
                    --region "$AWS_REGION" &>/dev/null || true
                echo "    [OK] sqs: $queue_name → $sns_name"
                ((created_queues++)) || true
            done
        fi
        echo
    done

    echo "================================================="
    echo "Summary (AWS)"
    echo "================================================="
    echo "SNS Topics: created=$created_topics"
    echo "SQS Queues: created=$created_queues"
    echo "Errors:     $errors"
    [[ "$errors" -gt 0 ]] && return 1 || return 0
}

created_topics=0
skipped_topics=0
created_subs=0
skipped_subs=0
errors=0

# ---------------------------------------------------------------------------
create_topic_if_missing() {
    local topic="$1"
    local retention_days="$2"
    local retention_str="${retention_days}d"

    # Check existence
    if gcloud pubsub topics describe "$topic" --project="$PROJECT_ID" &>/dev/null; then
        echo "  [SKIP] topic: $topic (already exists)"
        ((skipped_topics++)) || true
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  [DRY]  topic: $topic (retention=${retention_str})"
        return 0
    fi

    echo "  [CREATE] topic: $topic (retention=${retention_str})"
    if gcloud pubsub topics create "$topic" \
        --project="$PROJECT_ID" \
        --message-retention-duration="${retention_str}" \
        --quiet 2>&1; then
        ((created_topics++)) || true
    else
        echo "  [ERROR] Failed to create topic: $topic"
        ((errors++)) || true
    fi
}

create_subscription_if_missing() {
    local topic="$1"
    local sub="$2"
    local retention_days="$3"
    local retention_str="${retention_days}d"

    if gcloud pubsub subscriptions describe "$sub" --project="$PROJECT_ID" &>/dev/null; then
        echo "    [SKIP] sub: $sub (already exists)"
        ((skipped_subs++)) || true
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "    [DRY]  sub: $sub → $topic (ack_deadline=60s, retention=${retention_str})"
        return 0
    fi

    echo "    [CREATE] sub: $sub → $topic"
    if gcloud pubsub subscriptions create "$sub" \
        --topic="$topic" \
        --project="$PROJECT_ID" \
        --ack-deadline=60 \
        --message-retention-duration="${retention_str}" \
        --quiet 2>&1; then
        ((created_subs++)) || true
    else
        echo "    [ERROR] Failed to create subscription: $sub"
        ((errors++)) || true
    fi
}

# ---------------------------------------------------------------------------
echo "--- Processing ${#TOPIC_REGISTRY[@]} topic entries ---"
echo

for entry in "${TOPIC_REGISTRY[@]}"; do
    IFS='|' read -r topic_name retention_days subscriptions sub_retention <<< "$entry"

    echo "Topic: $topic_name"
    create_topic_if_missing "$topic_name" "$retention_days"

    IFS=',' read -ra sub_list <<< "$subscriptions"
    for sub in "${sub_list[@]}"; do
        [[ -z "$sub" ]] && continue
        create_subscription_if_missing "$topic_name" "$sub" "$sub_retention"
    done
    echo
done

echo "================================================="
echo "Summary"
echo "================================================="
echo "Topics:        created=$created_topics  skipped=$skipped_topics"
echo "Subscriptions: created=$created_subs  skipped=$skipped_subs"
echo "Errors:        $errors"
echo

if [[ "$errors" -gt 0 ]]; then
    echo "WARNING: $errors errors encountered. Review output above."
    exit 1
fi

echo "Done. To verify:"
echo "  gcloud pubsub topics list --project=$PROJECT_ID"
echo "  python scripts/verify_infra.py --project-id=$PROJECT_ID --topics deployment-events"
