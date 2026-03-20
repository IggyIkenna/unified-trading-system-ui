#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Build and deploy unified-trading-system-ui to odum-research.co.uk
#
# Usage:
#   bash scripts/deploy.sh              # Full deploy (build + push + deploy + hosting)
#   bash scripts/deploy.sh --skip-build # Redeploy existing image (just Cloud Run + hosting)
#   bash scripts/deploy.sh --local      # Build locally, skip Cloud Build
# ─────────────────────────────────────────────────────────────────────────────

PROJECT_ID="central-element-323112"
REGION="europe-west4"
SERVICE_NAME="odum-portal"
REGISTRY="asia-northeast1-docker.pkg.dev/${PROJECT_ID}/unified-trading-system"
IMAGE_NAME="unified-trading-system-ui"
TAG="${1:-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

# ── Pre-flight checks ────────────────────────────────────────────────────────
log "Pre-flight checks..."
command -v gcloud >/dev/null || fail "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
command -v docker >/dev/null || fail "docker not found"

gcloud auth print-access-token >/dev/null 2>&1 || fail "Not authenticated. Run: gcloud auth login"
gcloud config set project "${PROJECT_ID}" --quiet

SKIP_BUILD=false
LOCAL_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --local)      LOCAL_BUILD=true ;;
  esac
done

IMAGE="${REGISTRY}/${IMAGE_NAME}"

# ── Step 1: Build ─────────────────────────────────────────────────────────────
if [ "$SKIP_BUILD" = false ]; then
  if [ "$LOCAL_BUILD" = true ]; then
    log "Building Docker image locally..."
    docker build -t "${IMAGE}:${TAG}" -t "${IMAGE}:latest" .

    log "Configuring Docker for Artifact Registry..."
    gcloud auth configure-docker asia-northeast1-docker.pkg.dev --quiet

    log "Pushing image to Artifact Registry..."
    docker push "${IMAGE}:${TAG}"
    docker push "${IMAGE}:latest"
  else
    log "Triggering Cloud Build..."
    gcloud builds submit . \
      --config=cloudbuild.yaml \
      --substitutions=SHORT_SHA="${TAG}" \
      --timeout=600s \
      --quiet
  fi
  log "Build complete: ${IMAGE}:${TAG}"
else
  log "Skipping build (--skip-build). Using existing image."
  TAG="latest"
fi

# ── Step 2: Deploy to Cloud Run ───────────────────────────────────────────────
log "Deploying to Cloud Run (${SERVICE_NAME} in ${REGION})..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE}:${TAG}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-env-vars="NODE_ENV=production,STAGING_AUTH_ENABLED=true,NEXT_PUBLIC_MOCK_API=true" \
  --quiet

CLOUD_RUN_URL=$(gcloud run services describe "${SERVICE_NAME}" --region="${REGION}" --format="value(status.url)" 2>/dev/null)
log "Cloud Run deployed: ${CLOUD_RUN_URL}"

# ── Step 3: Update Firebase Hosting ──────────────────────────────────────────
log "Deploying Firebase Hosting (routes traffic to Cloud Run)..."
if command -v firebase >/dev/null 2>&1; then
  firebase deploy --only hosting --project="${PROJECT_ID}"
  log "Firebase Hosting deployed"
else
  warn "firebase CLI not found — skipping hosting deploy."
  warn "Install: npm install -g firebase-tools"
  warn "Then run: firebase deploy --only hosting --project=${PROJECT_ID}"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
log "═══════════════════════════════════════════════════"
log "  Deployment complete!"
log "  Cloud Run:  ${CLOUD_RUN_URL}"
log "  Website:    https://odum-research.co.uk"
log "  Staging:    username=odum"
log "═══════════════════════════════════════════════════"
