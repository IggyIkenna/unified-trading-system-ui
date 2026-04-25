#!/usr/bin/env bash
# Build and deploy unified-trading-system-ui to Cloud Run (europe-west4).
#
# SSOT for the build+deploy contract: docs/core/DEPLOYMENT.md.
#
# TWO INDEPENDENT ENVIRONMENTS — NO SILENT DEFAULT.
# You must pass `--env=prod` or `--env=uat`. The script exits 2 otherwise.
#
#   | env  | Cloud Run service      | Image tag    | BUILD_ENV_FILE                        | Domain                        |
#   |------|------------------------|--------------|---------------------------------------|-------------------------------|
#   | prod | odum-portal            | :production  | config/docker-build.env.production    | www.odum-research.com         |
#   | uat  | odum-portal-staging *  | :uat         | config/docker-build.env.uat           | uat.odum-research.com         |
#
#   * Cloud Run service name still carries the historical "staging" suffix;
#     rename to odum-portal-uat is a separate follow-up (see DEPLOYMENT.md).
#
# NEXT_PUBLIC_* are inlined at Docker build time; Cloud Run runtime env vars do
# not retro-rewrite the client bundle. Change env → rebuild → redeploy.
#
# Usage:
#   bash scripts/deploy-cloud-run.sh --env=uat                  # local Docker build → UAT
#   bash scripts/deploy-cloud-run.sh --env=prod                 # local Docker build → PROD
#   bash scripts/deploy-cloud-run.sh --env=uat --cloud          # Cloud Build       → UAT
#   bash scripts/deploy-cloud-run.sh --env=prod --cloud         # Cloud Build       → PROD
#   bash scripts/deploy-cloud-run.sh --env=uat --build-env-file=config/docker-build.env.staging.firebase.local
#       # optional: override BUILD_ENV_FILE (repo-relative path). Works with any --env.
#
# Build speed: cloudbuild-odum-portal.yaml pulls the previous image tag and
# passes --cache-from. Code-only changes reuse the deps stage layer; dep changes
# trigger a cold deps-install.
set -euo pipefail

PROJECT_ID="central-element-323112"
REGION="europe-west4"
SERVICE_PROD="odum-portal"
SERVICE_UAT="odum-portal-staging"
# Registry repository name (image); not necessarily the same as Cloud Run service id.
IMAGE_REPO="odum-portal"
IMAGE="europe-west4-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${IMAGE_REPO}"

USE_CLOUD_BUILD=false
DEPLOY_ENV=""
BUILD_ENV_FILE_OVERRIDE=""
for arg in "$@"; do
  case "$arg" in
    --cloud) USE_CLOUD_BUILD=true ;;
    --env=*) DEPLOY_ENV="${arg#*=}" ;;
    --build-env-file=*)
      BUILD_ENV_FILE_OVERRIDE="${arg#*=}"
      ;;
    # Back-compat / fail-loud: reject the old flag instead of silently mis-targeting.
    --production)
      echo "ERROR: --production is gone. Use --env=prod explicitly." >&2
      exit 2
      ;;
    *)
      echo "ERROR: unrecognised argument: $arg" >&2
      echo "       Usage: bash scripts/deploy-cloud-run.sh --env=prod|uat [--cloud] [--build-env-file=...]" >&2
      exit 2
      ;;
  esac
done

case "${DEPLOY_ENV}" in
  prod)
    SERVICE="${SERVICE_PROD}"
    IMAGE_TAG="production"
    BUILD_ENV_FILE="config/docker-build.env.production"
    PUBLIC_URL="https://www.odum-research.com"
    ;;
  uat)
    SERVICE="${SERVICE_UAT}"
    IMAGE_TAG="uat"
    BUILD_ENV_FILE="config/docker-build.env.uat"
    PUBLIC_URL="https://uat.odum-research.com"
    ;;
  "")
    echo "ERROR: --env=prod|uat is required. Staging and prod are independent deploys; there is no default." >&2
    echo "       Usage: bash scripts/deploy-cloud-run.sh --env=prod|uat [--cloud] [--build-env-file=...]" >&2
    exit 2
    ;;
  *)
    echo "ERROR: unknown --env value: ${DEPLOY_ENV}. Must be one of: prod, uat." >&2
    exit 2
    ;;
esac

echo "=== Deploy target: $(echo "${DEPLOY_ENV}" | tr '[:lower:]' '[:upper:]') (${SERVICE}) — ${PUBLIC_URL} ==="

IMAGE_REF="${IMAGE}:${IMAGE_TAG}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -n "${BUILD_ENV_FILE_OVERRIDE}" ]]; then
  case "${BUILD_ENV_FILE_OVERRIDE}" in
    /*)
      echo "ERROR: --build-env-file must be repo-relative (e.g. config/docker-build.env.uat.firebase.local)." >&2
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

# Prod is multi-region (LB-fronted at www.odum-research.com). UAT is single-region.
# Without fan-out, prod deploys would update only europe-west4 and silently leave
# us-central1 + asia-northeast1 stale — easy to ship a europe-only fix and have
# US / Asia customers seeing old code.
if [[ "${DEPLOY_ENV}" == "prod" ]]; then
  DEPLOY_REGIONS=("europe-west4" "us-central1" "asia-northeast1")
else
  DEPLOY_REGIONS=("${REGION}")
fi

for region in "${DEPLOY_REGIONS[@]}"; do
  echo "=== Deploying to Cloud Run (${SERVICE} @ ${region}) ==="
  gcloud run deploy "${SERVICE}" \
    --image "${IMAGE_REF}" \
    --region "${region}" \
    --platform managed \
    --allow-unauthenticated \
    --port=3000

  echo "=== Routing 100% traffic to latest (${region}) ==="
  gcloud run services update-traffic "${SERVICE}" \
    --region "${region}" \
    --to-latest

  echo "=== Cleaning up old revisions (${region}) ==="
  LATEST=$(gcloud run revisions list \
    --service="${SERVICE}" \
    --region="${region}" \
    --format="value(name)" \
    --sort-by="~metadata.creationTimestamp" \
    --limit=1)

  gcloud run revisions list \
    --service="${SERVICE}" \
    --region="${region}" \
    --format="value(name)" \
    --sort-by="~metadata.creationTimestamp" | tail -n +2 | while read -r rev; do
      if [ -n "$rev" ]; then
        echo "  Deleting old revision: $rev"
        gcloud run revisions delete "$rev" --region="${region}" --quiet 2>/dev/null || true
      fi
    done

  echo "=== Done — Cloud Run ${SERVICE} updated (${region}) — active: ${LATEST} ==="
done

echo
echo "=== ALL REGIONS DEPLOYED (${DEPLOY_ENV}) — ${#DEPLOY_REGIONS[@]} region(s): ${DEPLOY_REGIONS[*]} ==="
echo "  Confirm traffic: ${PUBLIC_URL} → ${SERVICE}"
