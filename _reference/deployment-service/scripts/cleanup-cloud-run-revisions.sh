#!/bin/bash
# Cleanup old Cloud Run revisions to free up memory quota
#
# IMPORTANT: This cleans Cloud Run SERVICE revisions (deployed versions), NOT Cloud Build builds.
# Each Cloud Run service deployment creates a new revision, and ALL revisions count toward memory quota.
#
# Logic: Keeps the latest N revisions per service, deletes older ones.
# This ensures we always have a few historical deployments for rollback while freeing quota.
#
# Usage:
#   # Clean all Cloud Run services (default: keep 3 revisions)
#   ./scripts/cleanup-cloud-run-revisions.sh
#
#   # Keep only 2 revisions per service
#   KEEP_REVISIONS=2 ./scripts/cleanup-cloud-run-revisions.sh
#
#   # Clean specific services only
#   SERVICES="deployment-dashboard visualizer-api" ./scripts/cleanup-cloud-run-revisions.sh

set -e

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"
REGION="asia-northeast1"
KEEP_REVISIONS=${KEEP_REVISIONS:-3}  # Keep latest 3 revisions by default (configurable via env var)

# If SERVICES env var is set, use it; otherwise discover all Cloud Run services
if [ -z "$SERVICES" ]; then
  echo "🔍 Discovering all Cloud Run services..."
  SERVICES=$(gcloud run services list \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(metadata.name)" \
    2>/dev/null || echo "")

  if [ -z "$SERVICES" ]; then
    echo "⚠️  No Cloud Run services found in region $REGION"
    exit 0
  fi
fi

echo "🧹 Cleaning up old Cloud Run SERVICE revisions (not Cloud Build builds)"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Keeping latest $KEEP_REVISIONS revisions per service"
echo ""

# Process each service (handles both newline and space-separated)
echo "$SERVICES" | while IFS= read -r SERVICE || [ -n "$SERVICE" ]; do
  # Skip empty lines
  [ -z "$SERVICE" ] && continue
  echo "=== Processing $SERVICE ==="

  # Get all revisions sorted by creation time (newest first)
  REVISIONS=$(gcloud run revisions list \
    --service="$SERVICE" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(metadata.name)" \
    --sort-by=~metadata.creationTimestamp \
    2>/dev/null || echo "")

  if [ -z "$REVISIONS" ]; then
    echo "  ⚠️  No revisions found (or service doesn't exist)"
    continue
  fi

  # Count total revisions
  TOTAL=$(echo "$REVISIONS" | wc -l | tr -d ' ')
  echo "  Found $TOTAL revisions"

  if [ "$TOTAL" -le "$KEEP_REVISIONS" ]; then
    echo "  ✅ Only $TOTAL revisions (keeping all)"
    continue
  fi

  # Get revisions to delete (skip first KEEP_REVISIONS)
  TO_DELETE=$(echo "$REVISIONS" | tail -n +$((KEEP_REVISIONS + 1)))
  DELETE_COUNT=$(echo "$TO_DELETE" | grep -c . || echo "0")

  if [ "$DELETE_COUNT" -eq 0 ]; then
    echo "  ✅ Nothing to delete"
    continue
  fi

  echo "  🗑️  Deleting $DELETE_COUNT old revisions..."

  for REVISION in $TO_DELETE; do
    echo "    Deleting $REVISION..."
    gcloud run revisions delete "$REVISION" \
      --region="$REGION" \
      --project="$PROJECT_ID" \
      --quiet \
      2>&1 | grep -v "WARNING" || true
  done

  echo "  ✅ Deleted $DELETE_COUNT revisions"
done

echo ""
echo "✅ Cleanup complete!"
