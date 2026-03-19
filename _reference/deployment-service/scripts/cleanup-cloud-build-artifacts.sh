#!/bin/bash
# Cleanup old Cloud Build artifacts and logs to free up storage quota
#
# Cloud Build stores logs and artifacts in two buckets:
#   - gs://artifacts.${GCP_PROJECT_ID}.appspot.com (build artifacts)
#   - gs://${GCP_PROJECT_ID}_cloudbuild (build logs)
#
# This script deletes builds older than N days (default: 90 days).
# Builds older than 90 days are unlikely to be needed for debugging.
#
# Usage:
#   # Clean builds older than 90 days (default)
#   ./scripts/cleanup-cloud-build-artifacts.sh
#
#   # Clean builds older than 30 days
#   DAYS_TO_KEEP=30 ./scripts/cleanup-cloud-build-artifacts.sh
#
#   # Dry run (show what would be deleted)
#   DRY_RUN=true ./scripts/cleanup-cloud-build-artifacts.sh

set -e

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"
DAYS_TO_KEEP=${DAYS_TO_KEEP:-90}
DRY_RUN=${DRY_RUN:-false}

echo "🧹 Cleaning up old Cloud Build artifacts and logs"
echo "Project: $PROJECT_ID"
echo "Keeping builds from last $DAYS_TO_KEEP days"
echo "Dry run: $DRY_RUN"
echo ""

# Calculate cutoff date
CUTOFF_DATE=$(date -u -v-${DAYS_TO_KEEP}d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "${DAYS_TO_KEEP} days ago" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || python3 -c "from datetime import datetime, timedelta, timezone; print((datetime.now(timezone.utc) - timedelta(days=$DAYS_TO_KEEP)).isoformat() + 'Z')")

echo "Cutoff date: $CUTOFF_DATE"
echo ""

# List all builds older than cutoff
OLD_BUILDS=$(gcloud builds list \
  --project="$PROJECT_ID" \
  --format="value(id)" \
  --filter="createTime<$CUTOFF_DATE" \
  --limit=1000 \
  2>/dev/null || echo "")

if [ -z "$OLD_BUILDS" ]; then
  echo "✅ No builds older than $DAYS_TO_KEEP days found"
  exit 0
fi

BUILD_COUNT=$(echo "$OLD_BUILDS" | wc -l | tr -d ' ')
echo "Found $BUILD_COUNT builds older than $DAYS_TO_KEEP days"

if [ "$DRY_RUN" = "true" ]; then
  echo ""
  echo "🔍 DRY RUN - Would delete these builds:"
  echo "$OLD_BUILDS" | head -20
  if [ "$BUILD_COUNT" -gt 20 ]; then
    echo "... and $((BUILD_COUNT - 20)) more"
  fi
  exit 0
fi

echo ""
echo "🗑️  Deleting $BUILD_COUNT old builds..."

DELETED=0
FAILED=0

for BUILD_ID in $OLD_BUILDS; do
  if gcloud builds delete "$BUILD_ID" \
    --project="$PROJECT_ID" \
    --quiet \
    2>&1 | grep -v "WARNING" > /dev/null; then
    DELETED=$((DELETED + 1))
    if [ $((DELETED % 10)) -eq 0 ]; then
      echo "  Deleted $DELETED/$BUILD_COUNT builds..."
    fi
  else
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "✅ Cleanup complete!"
echo "  Deleted: $DELETED builds"
if [ $FAILED -gt 0 ]; then
  echo "  Failed: $FAILED builds"
fi

# Check storage after cleanup
echo ""
echo "📊 Storage usage after cleanup:"
gcloud storage du -s "gs://artifacts.${PROJECT_ID}.appspot.com" "gs://${PROJECT_ID}_cloudbuild" 2>&1 | awk '{printf "  %s: %.2f GB\n", $2, $1/1024/1024/1024}'
