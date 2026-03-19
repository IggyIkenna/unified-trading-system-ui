#!/bin/bash
# Deploy the Deployment Dashboard to GCP Cloud Run
#
# This script sets up the infrastructure and triggers the first deployment.
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - Terraform installed (for full setup, not needed for --manual)
#   - Repository connected to Cloud Build (iggyikenna-github connection)
#
# Usage:
#   ./scripts/deploy-dashboard.sh [--manual] [--small|--medium|--large]
#
#   --manual: Skip Terraform and do a manual Cloud Build submit
#   --small:  2 CPU, 4Gi RAM, 1-5 instances (dev/testing)
#   --medium: 4 CPU, 8Gi RAM, 1-20 instances (default, production)
#   --large:  8 CPU, 16Gi RAM, 2-50 instances (high traffic)

set -e

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID required}"
REGION="${GCS_REGION:-asia-northeast1}"
SERVICE_NAME="deployment-dashboard"

# Default to medium sizing
MEMORY="8Gi"
CPU="4"
MIN_INSTANCES="1"
MAX_INSTANCES="20"
CONCURRENCY="200"
WORKERS="4"

# Parse size argument
for arg in "$@"; do
    case $arg in
        --small)
            MEMORY="4Gi"
            CPU="2"
            MIN_INSTANCES="0"
            MAX_INSTANCES="5"
            CONCURRENCY="100"
            WORKERS="2"
            echo "📦 Using SMALL configuration (dev/testing)"
            ;;
        --medium)
            MEMORY="8Gi"
            CPU="4"
            MIN_INSTANCES="1"
            MAX_INSTANCES="20"
            CONCURRENCY="200"
            WORKERS="4"
            echo "📦 Using MEDIUM configuration (production)"
            ;;
        --large)
            MEMORY="16Gi"
            CPU="8"
            MIN_INSTANCES="2"
            MAX_INSTANCES="50"
            CONCURRENCY="500"
            WORKERS="8"
            echo "📦 Using LARGE configuration (high traffic)"
            ;;
    esac
done

echo "============================================"
echo "Deploying Deployment Dashboard to GCP"
echo "============================================"
echo "Project:       $PROJECT_ID"
echo "Region:        $REGION"
echo ""
echo "Resources:"
echo "  Memory:      $MEMORY"
echo "  CPU:         $CPU vCPUs"
echo "  Workers:     $WORKERS (gunicorn/uvicorn)"
echo "  Min inst:    $MIN_INSTANCES"
echo "  Max inst:    $MAX_INSTANCES"
echo "  Concurrency: $CONCURRENCY requests/instance"
echo ""

# Check gcloud auth
if ! gcloud auth print-access-token &>/dev/null; then
    echo "❌ Not authenticated. Run: gcloud auth login"
    exit 1
fi
echo "✅ gcloud authenticated"

# Set project
gcloud config set project "$PROJECT_ID"

# Option 1: Manual build (skip Terraform)
if [[ "$1" == "--manual" ]] || [[ "$2" == "--manual" ]]; then
    echo ""
    echo "📦 Creating Artifact Registry repository (if not exists)..."
    gcloud artifacts repositories create "$SERVICE_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Deployment dashboard images" \
        2>/dev/null || echo "   (already exists)"

    # Get commit SHA for image tagging (use short hash for manual builds)
    COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "manual-$(date +%Y%m%d-%H%M%S)")
    echo ""
    echo "🔖 Image tag: $COMMIT_SHA"
    echo ""
    echo "🔨 Submitting Cloud Build with custom resources..."
    gcloud builds submit \
        --config=cloudbuild.yaml \
        --region="$REGION" \
        --substitutions="COMMIT_SHA=$COMMIT_SHA,_SERVICE_NAME=$SERVICE_NAME,_REGION=$REGION,_ARTIFACT_REPO=$SERVICE_NAME,_MEMORY=$MEMORY,_CPU=$CPU,_MIN_INSTANCES=$MIN_INSTANCES,_MAX_INSTANCES=$MAX_INSTANCES,_CONCURRENCY=$CONCURRENCY"

    echo ""
    echo "✅ Build submitted!"
    echo ""
    echo "📊 Resource summary:"
    echo "   Memory: $MEMORY | CPU: $CPU | Instances: $MIN_INSTANCES-$MAX_INSTANCES"
    echo ""
    echo "🌐 Dashboard URL:"
    gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format='value(status.url)' 2>/dev/null || echo "   (will be available after deploy completes)"
    exit 0
fi

# Option 2: Full Terraform setup
echo ""
echo "📋 Setting up Terraform..."

cd "$(dirname "$0")/../terraform/dashboard/gcp"

# Get project number
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

# Check for existing repository connection
echo ""
echo "🔗 Checking Cloud Build repository connection..."
CONNECTIONS=$(gcloud builds connections list --region="$REGION" --format='value(name)' 2>/dev/null | head -1)

if [[ -z "$CONNECTIONS" ]]; then
    echo "❌ No Cloud Build connections found in $REGION"
    echo "   Set up a GitHub connection first:"
    echo "   https://console.cloud.google.com/cloud-build/repositories/2nd-gen?project=$PROJECT_ID"
    exit 1
fi

# Get repo connection (assumes repo is connected as deployment-service)
REPO_CONNECTION=$(gcloud builds repositories list --connection="$CONNECTIONS" --region="$REGION" \
    --filter="name~unified-trading-deployment" --format='value(name)' 2>/dev/null | head -1)

if [[ -z "$REPO_CONNECTION" ]]; then
    echo "❌ Repository 'deployment-service' not connected to Cloud Build"
    echo "   Connect it at: https://console.cloud.google.com/cloud-build/repositories/2nd-gen?project=$PROJECT_ID"
    exit 1
fi
echo "   Found: $REPO_CONNECTION"

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
project_id            = "$PROJECT_ID"
project_number        = "$PROJECT_NUMBER"
region                = "$REGION"
repository_connection = "$REPO_CONNECTION"
cloud_build_sa        = "${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
EOF

echo "✅ Created terraform.tfvars"

# Initialize and apply Terraform
echo ""
echo "🏗️  Running Terraform..."
terraform init -input=false
terraform apply -auto-approve

echo ""
echo "============================================"
echo "✅ Infrastructure created!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Push to main to trigger first build:"
echo "   cd <repo> && bash scripts/quickmerge.sh 'deploy: update dashboard'"
echo ""
echo "2. Monitor build:"
echo "   gcloud builds list --region=$REGION --limit=3"
echo ""
echo "3. After build completes, get the URL:"
echo "   gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)'"
