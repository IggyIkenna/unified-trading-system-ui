#!/usr/bin/env bash
# Poll Cloud Build for the latest deployment-dashboard build until it completes,
# then print status and any failure details.
# Usage: ./scripts/poll_deployment_dashboard_build.sh [--project PROJECT] [--region REGION]

set -e
PROJECT="${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"
REGION="${CLOUD_BUILD_REGION:-asia-northeast1}"
TRIGGER_NAME="deployment-dashboard-build"

# Resolve trigger ID from name
resolve_trigger_id() {
  gcloud builds triggers list --region="$REGION" --project="$PROJECT" --format='value(name,id)' 2>/dev/null | while read -r name id; do
    if [[ "$name" == "$TRIGGER_NAME" ]]; then
      echo "$id"
      return
    fi
  done
}

TRIGGER_ID=$(resolve_trigger_id)
if [[ -z "$TRIGGER_ID" ]]; then
  echo "Trigger not found: $TRIGGER_NAME" >&2
  exit 1
fi

echo "Project: $PROJECT Region: $REGION Trigger: $TRIGGER_NAME ($TRIGGER_ID)"
echo "Polling for latest build (list -> sleep 10s -> repeat until WORKING/SUCCESS/FAILURE)..."
echo ""

while true; do
  BUILD_ROW=$(gcloud builds list --region="$REGION" --project="$PROJECT" --limit=1 \
    --filter="buildTriggerId=$TRIGGER_ID" \
    --format="value(id,status,createTime)" 2>/dev/null | head -1)
  BUILD_ID=$(echo "$BUILD_ROW" | awk '{print $1}')
  STATUS=$(echo "$BUILD_ROW" | awk '{print $2}')
  CREATE_TIME=$(echo "$BUILD_ROW" | awk '{print $3}')

  if [[ -z "$BUILD_ID" ]]; then
    echo "No build found for trigger $TRIGGER_ID"
    sleep 10
    continue
  fi

  echo "$(date -u +%H:%M:%S) Build $BUILD_ID status=$STATUS (created $CREATE_TIME)"

  case "$STATUS" in
    SUCCESS)
      echo "Build succeeded."
      exit 0
      ;;
    FAILURE)
      echo "Build failed. Fetching failure details..."
      gcloud builds describe "$BUILD_ID" --region="$REGION" --project="$PROJECT" \
        --format="yaml(failureInfo,steps)" 2>/dev/null | head -80
      exit 1
      ;;
    CANCELLED)
      echo "Build was cancelled."
      exit 1
      ;;
    WORKING|QUEUED|PENDING)
      sleep 10
      ;;
    *)
      echo "Unknown status: $STATUS"
      sleep 10
      ;;
  esac
done
