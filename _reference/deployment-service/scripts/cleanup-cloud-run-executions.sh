#!/bin/bash
# Cleanup old Cloud Run Job executions to free up memory quota
#
# IMPORTANT: Cloud Run Job executions ALSO count toward memory quota!
# Each execution consumes memory quota even after completion.
#
# This script deletes executions older than N days (default: 30 days).
# Keeping only recent executions for debugging while freeing quota.
#
# Usage:
#   # Clean executions older than 30 days (default)
#   ./scripts/cleanup-cloud-run-executions.sh
#
#   # Clean executions older than 7 days
#   DAYS_TO_KEEP=7 ./scripts/cleanup-cloud-run-executions.sh
#
#   # Dry run (show what would be deleted)
#   DRY_RUN=true ./scripts/cleanup-cloud-run-executions.sh

set -e

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"
REGION="asia-northeast1"
DAYS_TO_KEEP=${DAYS_TO_KEEP:-30}
DRY_RUN=${DRY_RUN:-false}

echo "🧹 Cleaning up old Cloud Run Job executions"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Keeping executions from last $DAYS_TO_KEEP days"
echo "Dry run: $DRY_RUN"
echo ""

# Calculate cutoff date
CUTOFF_DATE=$(date -u -v-${DAYS_TO_KEEP}d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "${DAYS_TO_KEEP} days ago" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || python3 -c "from datetime import datetime, timedelta, timezone; print((datetime.now(timezone.utc) - timedelta(days=$DAYS_TO_KEEP)).isoformat() + 'Z')")

echo "Cutoff date: $CUTOFF_DATE"
echo ""

# Get all jobs in the region
JOBS=$(gcloud run jobs list \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(metadata.name)" \
  2>/dev/null || echo "")

if [ -z "$JOBS" ]; then
  echo "⚠️  No Cloud Run Jobs found in region $REGION"
  exit 0
fi

TOTAL_DELETED=0
TOTAL_FAILED=0

# Process each job
echo "$JOBS" | while IFS= read -r JOB || [ -n "$JOB" ]; do
  [ -z "$JOB" ] && continue

  echo "=== Processing job: $JOB ==="

  # List executions older than cutoff
  OLD_EXECUTIONS=$(gcloud run jobs executions list \
    --job="$JOB" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(metadata.name)" \
    --filter="metadata.creationTimestamp<$CUTOFF_DATE" \
    --limit=1000 \
    2>/dev/null || echo "")

  if [ -z "$OLD_EXECUTIONS" ]; then
    echo "  ✅ No old executions found"
    continue
  fi

  EXEC_COUNT=$(echo "$OLD_EXECUTIONS" | wc -l | tr -d ' ')
  echo "  Found $EXEC_COUNT executions older than $DAYS_TO_KEEP days"

  if [ "$DRY_RUN" = "true" ]; then
    echo "  🔍 DRY RUN - Would delete these executions:"
    echo "$OLD_EXECUTIONS" | head -5 | sed 's/^/    /'
    if [ "$EXEC_COUNT" -gt 5 ]; then
      echo "    ... and $((EXEC_COUNT - 5)) more"
    fi
    continue
  fi

  echo "  🗑️  Deleting $EXEC_COUNT old executions..."

  DELETED=0
  FAILED=0

  for EXEC_NAME in $OLD_EXECUTIONS; do
    if gcloud run jobs executions delete "$EXEC_NAME" \
      --region="$REGION" \
      --project="$PROJECT_ID" \
      --quiet \
      2>&1 | grep -v "WARNING" > /dev/null; then
      DELETED=$((DELETED + 1))
      if [ $((DELETED % 50)) -eq 0 ]; then
        echo "    Deleted $DELETED/$EXEC_COUNT executions..."
      fi
    else
      FAILED=$((FAILED + 1))
    fi
  done

  echo "  ✅ Deleted $DELETED executions (failed: $FAILED)"
  TOTAL_DELETED=$((TOTAL_DELETED + DELETED))
  TOTAL_FAILED=$((TOTAL_FAILED + FAILED))
done

echo ""
echo "✅ Cleanup complete!"
echo "  Total deleted: $TOTAL_DELETED executions"
if [ $TOTAL_FAILED -gt 0 ]; then
  echo "  Total failed: $TOTAL_FAILED executions"
fi
