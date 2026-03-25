#!/usr/bin/env bash
# Fast deploy to Cloud Run (odum-research.com)
# Uses --cache-from to reuse layers from the previous image
#
# Usage: bash scripts/deploy-cloud-run.sh
set -euo pipefail

PROJECT_ID="central-element-323112"
REGION="europe-west4"
SERVICE="odum-portal"
IMAGE="europe-west4-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${SERVICE}"

echo "=== Building ${SERVICE} ==="

# Pull previous image for layer cache (ignore failure on first build)
docker pull "${IMAGE}:latest" 2>/dev/null || true

# Build with cache-from previous image
docker build \
  --cache-from "${IMAGE}:latest" \
  -t "${IMAGE}:latest" \
  .

echo "=== Pushing image ==="
docker push "${IMAGE}:latest"

echo "=== Deploying to Cloud Run ==="
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}:latest" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_MOCK_API=true,NEXT_PUBLIC_AUTH_PROVIDER=demo"

echo "=== Done — live at https://odum-research.com ==="
