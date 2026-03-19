#!/bin/bash
# Deploy the Deployment Dashboard to a GCE VM (more resources than Cloud Run).
# Prerequisites: gcloud auth, Docker. Usage: ./scripts/deploy-dashboard-gce-vm.sh [--machine-type TYPE] [--workers N]
set -e

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"
REGION="${GCP_REGION:-asia-northeast1}"
ZONE="${REGION}-a"
SERVICE_NAME="deployment-dashboard"
ARTIFACT_REPO="deployment-dashboard"
VM_NAME="deployment-dashboard-vm"
WORKERS="8"
MACHINE_TYPE="n2-standard-8"

for arg in "$@"; do
  case $arg in
    --machine-type=*) MACHINE_TYPE="${arg#*=}" ;;
    --workers=*)      WORKERS="${arg#*=}" ;;
    --machine-type)   shift; MACHINE_TYPE="$1" ;;
    --workers)        shift; WORKERS="$1" ;;
  esac
done

COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "local-$(date +%Y%m%d-%H%M%S)")
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${SERVICE_NAME}:${COMMIT_SHA}"

echo "============================================"
echo "Deploy Dashboard to GCE VM"
echo "============================================"
echo "Project:       $PROJECT_ID" "Zone: $ZONE" "VM: $VM_NAME" "Machine: $MACHINE_TYPE"
echo ""

gcloud auth print-access-token &>/dev/null || { echo "Not authenticated. Run: gcloud auth login"; exit 1; }
gcloud config set project "$PROJECT_ID"

echo "Building Docker image..."
docker build --platform=linux/amd64 --build-arg WORKERS="$WORKERS" -t "$IMAGE_URI" -t "${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${SERVICE_NAME}:latest" .

echo "Pushing to Artifact Registry..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
docker push "$IMAGE_URI"
docker push "${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${SERVICE_NAME}:latest"

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud artifacts repositories add-iam-policy-binding "$ARTIFACT_REPO" --location="$REGION" --member="serviceAccount:${COMPUTE_SA}" --role="roles/artifactregistry.reader" --quiet 2>/dev/null || true

if ! gcloud compute firewall-rules describe deployment-dashboard-allow-8080 --project="$PROJECT_ID" 2>/dev/null; then
  gcloud compute firewall-rules create deployment-dashboard-allow-8080 --project="$PROJECT_ID" --allow=tcp:8080 --source-ranges=0.0.0.0/0 --target-tags=deployment-dashboard-vm --description="Allow 8080 to dashboard VM"
fi

if gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --project="$PROJECT_ID" 2>/dev/null; then
  gcloud compute instances delete "$VM_NAME" --zone="$ZONE" --project="$PROJECT_ID" --quiet
fi

echo "Creating GCE VM with container..."
gcloud compute instances create-with-container "$VM_NAME" --project="$PROJECT_ID" --zone="$ZONE" --machine-type="$MACHINE_TYPE" --tags=deployment-dashboard-vm --container-image="$IMAGE_URI" --container-env="GCP_PROJECT_ID=${PROJECT_ID},STATE_BUCKET=deployment-orchestration-${PROJECT_ID},WORKERS=${WORKERS},PYTHONUNBUFFERED=1" --container-restart-policy=always --scopes=cloud-platform

IP=$(gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --project="$PROJECT_ID" --format="get(networkInterfaces[0].accessConfigs[0].natIP)")
echo ""
echo "Dashboard URL: http://${IP}:8080"
echo "Waiting for health (up to ~3 min)..."
for i in $(seq 1 30); do
  if curl -sf --max-time 5 "http://${IP}:8080/api/health" >/dev/null 2>&1; then echo "Health OK"; break; fi
  echo "Attempt $i/30"; sleep 10
done
curl -sf "http://${IP}:8080/api/health" | grep -q '"status":"healthy"' && echo "Smoke test passed" || echo "Check: curl http://${IP}:8080/api/health"
echo "Dashboard: http://${IP}:8080"
