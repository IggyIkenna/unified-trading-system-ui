#!/usr/bin/env bash
# Build and deploy unified-trading-system-ui to Cloud Run (europe-west4).
#
# Default target: **staging** → service `odum-portal-staging` (Firebase Hosting /
# odum-research.co.uk rewrites — see `firebase.json`). Production **odum-portal**
# is unchanged unless you pass `--production`. Staging and production images use
# different tags (`:staging` / `:production`) and different `config/docker-build.env.*` SSOT files.
#
# Artifact image tags: odum-portal:staging (demo + mock baked in) and odum-portal:production (Firebase).
#
# Usage:
#   bash scripts/deploy-cloud-run.sh                    # local Docker build → staging
#   bash scripts/deploy-cloud-run.sh --cloud             # Cloud Build → staging
#   bash scripts/deploy-cloud-run.sh --cloud --production  # Cloud Build → production odum-portal
#   bash scripts/deploy-cloud-run.sh --build-env-file=config/docker-build.env.staging.firebase.local
#       # optional: override BUILD_ENV_FILE (repo-relative path). Works with --cloud / --production.
set -euo pipefail

PROJECT_ID="central-element-323112"
REGION="europe-west4"
SERVICE_PRODUCTION="odum-portal"
SERVICE_STAGING="odum-portal-staging"
# Registry repository name (image); not necessarily the same as Cloud Run service id.
IMAGE_REPO="odum-portal"
IMAGE="europe-west4-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${IMAGE_REPO}"

USE_CLOUD_BUILD=false
DEPLOY_TARGET="staging"
BUILD_ENV_FILE_OVERRIDE=""
for arg in "$@"; do
  case "$arg" in
    --cloud) USE_CLOUD_BUILD=true ;;
    --production) DEPLOY_TARGET="production" ;;
    --build-env-file=*)
      BUILD_ENV_FILE_OVERRIDE="${arg#*=}"
      ;;
  esac
done

if [[ "${DEPLOY_TARGET}" == "production" ]]; then
  SERVICE="${SERVICE_PRODUCTION}"
  IMAGE_TAG="production"
  BUILD_ENV_FILE="config/docker-build.env.production"
  echo "=== Deploy target: PRODUCTION (${SERVICE}) — odum-research.com (if mapped) ==="
else
  SERVICE="${SERVICE_STAGING}"
  IMAGE_TAG="staging"
  BUILD_ENV_FILE="config/docker-build.env.staging"
  echo "=== Deploy target: STAGING (${SERVICE}) — verify https://odum-research.co.uk/ ==="
fi

IMAGE_REF="${IMAGE}:${IMAGE_TAG}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -n "${BUILD_ENV_FILE_OVERRIDE}" ]]; then
  case "${BUILD_ENV_FILE_OVERRIDE}" in
    /*)
      echo "ERROR: --build-env-file must be repo-relative (e.g. config/docker-build.env.staging.firebase.local)." >&2
      exit 1
      ;;
  esac
  ENV_PATH="${REPO_ROOT}/${BUILD_ENV_FILE_OVERRIDE}"
  if [[ ! -f "${ENV_PATH}" ]]; then
    echo "ERROR: build env file not found: ${ENV_PATH}" >&2
    exit 1
  fi
  BUILD_ENV_FILE="${BUILD_ENV_FILE_OVERRIDE}"
  echo "=== Using BUILD_ENV_FILE override: ${BUILD_ENV_FILE} ==="
fi

if [[ "${USE_CLOUD_BUILD}" == true ]]; then
  echo "=== Cloud Build (${BUILD_ENV_FILE} → ${IMAGE_REF}) ==="
  gcloud builds submit "${REPO_ROOT}" \
    --config="${SCRIPT_DIR}/cloudbuild-odum-portal.yaml" \
    --substitutions=_IMAGE="${IMAGE_REF}",_BUILD_ENV_FILE="${BUILD_ENV_FILE}" \
    --timeout=1200 \
    --project="${PROJECT_ID}"
else
  echo "=== Local Docker Build (linux/amd64, ${BUILD_ENV_FILE} → ${IMAGE_REF}) ==="
  gcloud auth configure-docker europe-west4-docker.pkg.dev --quiet 2>/dev/null || true
  docker buildx build \
    --platform linux/amd64 \
    --build-arg "BUILD_ENV_FILE=${BUILD_ENV_FILE}" \
    -t "${IMAGE_REF}" \
    --load \
    "${REPO_ROOT}"
  echo "=== Pushing image ==="
  docker push "${IMAGE_REF}"
fi

echo "=== Deploying to Cloud Run (${SERVICE}) ==="
if [[ "${DEPLOY_TARGET}" == "production" ]]; then
  # Preserve existing prod env / scaling — only roll the image. Client auth is baked at build time.
  gcloud run deploy "${SERVICE}" \
    --image "${IMAGE_REF}" \
    --region "${REGION}" \
    --platform managed \
    --allow-unauthenticated \
    --port=3000
else
  # Staging: demo + mock are baked at build time (docker-build.env.staging). Do not rely on
  # Cloud Run NEXT_PUBLIC_* overrides — they cannot change already-inlined client bundles.
  gcloud run deploy "${SERVICE}" \
    --image "${IMAGE_REF}" \
    --region "${REGION}" \
    --platform managed \
    --allow-unauthenticated \
    --port=3000
fi

echo "=== Routing 100% traffic to latest ==="
gcloud run services update-traffic "${SERVICE}" \
  --region "${REGION}" \
  --to-latest

echo "=== Cleaning up old revisions ==="
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

echo "=== Done — Cloud Run ${SERVICE} updated (${REGION}) ==="
if [[ "${DEPLOY_TARGET}" == "production" ]]; then
  echo "  Production service updated (image only). Confirm traffic: odum-research.com → ${SERVICE_PRODUCTION}"
else
  echo "  Staging service updated. Confirm: https://odum-research.co.uk/ (Firebase → ${SERVICE_STAGING})"
  echo "  If you changed firebase.json, run: firebase deploy --only hosting --project=${PROJECT_ID}"
fi
echo "  Active revision: ${LATEST}"
