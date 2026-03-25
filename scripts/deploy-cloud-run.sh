#!/usr/bin/env bash
# Deploy to Cloud Run (odum-research.com)
#
# Usage:
#   bash scripts/deploy-cloud-run.sh          # local Docker build + deploy
#   bash scripts/deploy-cloud-run.sh --cloud  # Cloud Build + deploy
set -euo pipefail

PROJECT_ID="central-element-323112"
REGION="europe-west4"
SERVICE="odum-portal"
IMAGE="europe-west4-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${SERVICE}"

if [[ "${1:-}" == "--cloud" ]]; then
  echo "=== Cloud Build ==="
  gcloud builds submit \
    --tag "${IMAGE}:latest" \
    --timeout=1200 \
    --project="${PROJECT_ID}"
else
  echo "=== Local Docker Build ==="
  gcloud auth configure-docker europe-west4-docker.pkg.dev --quiet 2>/dev/null || true
  docker pull "${IMAGE}:latest" 2>/dev/null || true
  docker build --cache-from "${IMAGE}:latest" -t "${IMAGE}:latest" .
  echo "=== Pushing image ==="
  docker push "${IMAGE}:latest"
fi

echo "=== Deploying to Cloud Run ==="
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}:latest" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_MOCK_API=true,NEXT_PUBLIC_AUTH_PROVIDER=demo"

echo "=== Routing 100% traffic to latest ==="
gcloud run services update-traffic "${SERVICE}" \
  --region "${REGION}" \
  --to-latest

echo "=== Cleaning up old revisions ==="
# Keep only the latest revision, delete all others
LATEST=$(gcloud run revisions list \
  --service="${SERVICE}" \
  --region="${REGION}" \
  --format="value(name)" \
  --sort-by="~metadata.creationTimestamp" \
  --limit=1)

gcloud run revisions list \
  --service="${SERVICE}" \
  --region="${REGION}" \
  --format="value(name)" \
  --sort-by="~metadata.creationTimestamp" | tail -n +2 | while read -r rev; do
    if [ -n "$rev" ]; then
      echo "  Deleting old revision: $rev"
      gcloud run revisions delete "$rev" --region="${REGION}" --quiet 2>/dev/null || true
    fi
  done

echo "=== Done — live at https://odum-research.com ==="
echo "  Active revision: ${LATEST}"
