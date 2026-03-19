#!/usr/bin/env bash
#
# setup-registry.sh — Container + package registry setup
#
# GCP: Artifact Registry (Docker images + Python wheels)
# AWS: ECR (Docker images) + CodeArtifact (Python wheels)
#
# Idempotent — existing repos are preserved.
#
# Usage:
#   GCP_PROJECT_ID=central-element-323112 ./setup-registry.sh [--cloud gcp|aws] [--dry-run]
#   AWS_REGION=ap-northeast-1 AWS_ACCOUNT_ID=123456789012 ./setup-registry.sh --cloud aws [--dry-run]
#
# Options:
#   --cloud gcp|aws           Cloud provider (default: gcp)
#   --location REGION         AR/ECR region (default: asia-northeast1 for GCP, ap-northeast-1 for AWS)
#   --docker-repo NAME        Docker repo name (default: trading-images)
#   --python-repo NAME        Python wheels repo name (default: trading-wheels)
#   --dry-run                 Print what would be created without creating anything
#

set -euo pipefail

CLOUD="gcp"
DRY_RUN=false
LOCATION=""
DOCKER_REPO="trading-images"
PYTHON_REPO="trading-wheels"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --cloud) CLOUD="$2"; shift 2 ;;
        --location) LOCATION="$2"; shift 2 ;;
        --docker-repo) DOCKER_REPO="$2"; shift 2 ;;
        --python-repo) PYTHON_REPO="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) shift ;;
    esac
done

# Defaults per cloud
if [[ -z "$LOCATION" ]]; then
    [[ "$CLOUD" == "aws" ]] && LOCATION="ap-northeast-1" || LOCATION="${AR_LOCATION:-asia-northeast1}"
fi

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo '')}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo 'UNKNOWN')}"
CODEARTIFACT_DOMAIN="${CODEARTIFACT_DOMAIN:-trading}"

echo "================================================="
echo "Unified Trading System — Registry Setup"
echo "================================================="
echo "Cloud:       $CLOUD"
echo "Location:    $LOCATION"
echo "Docker repo: $DOCKER_REPO"
echo "Python repo: $PYTHON_REPO"
echo "Dry-run:     $DRY_RUN"
echo "================================================="
echo

# ---------------------------------------------------------------------------
# GCP: Artifact Registry
# ---------------------------------------------------------------------------
_run_gcp_registry() {
    gcloud config set project "$PROJECT_ID" --quiet
    gcloud services enable artifactregistry.googleapis.com --project="$PROJECT_ID" --quiet || true

    # Docker repo
    echo "--- Docker repository: $DOCKER_REPO ---"
    if gcloud artifacts repositories describe "$DOCKER_REPO" \
            --location="$LOCATION" --project="$PROJECT_ID" &>/dev/null; then
        echo "  [SKIP] Docker repo '$DOCKER_REPO' already exists"
    elif [[ "$DRY_RUN" == "true" ]]; then
        echo "  [DRY]  Would create Docker repo: $LOCATION/$DOCKER_REPO"
    else
        gcloud artifacts repositories create "$DOCKER_REPO" \
            --repository-format=docker \
            --location="$LOCATION" \
            --project="$PROJECT_ID" \
            --description="Unified Trading System service images" \
            --quiet
        echo "  [OK] Created: ${LOCATION}-docker.pkg.dev/${PROJECT_ID}/${DOCKER_REPO}"
    fi

    # Python wheels repo
    echo ""
    echo "--- Python wheels repository: $PYTHON_REPO ---"
    if gcloud artifacts repositories describe "$PYTHON_REPO" \
            --location="$LOCATION" --project="$PROJECT_ID" &>/dev/null; then
        echo "  [SKIP] Python repo '$PYTHON_REPO' already exists"
    elif [[ "$DRY_RUN" == "true" ]]; then
        echo "  [DRY]  Would create Python repo: $LOCATION/$PYTHON_REPO"
    else
        gcloud artifacts repositories create "$PYTHON_REPO" \
            --repository-format=python \
            --location="$LOCATION" \
            --project="$PROJECT_ID" \
            --description="Unified Trading System Python wheels" \
            --quiet
        echo "  [OK] Created: https://${LOCATION}-python.pkg.dev/${PROJECT_ID}/${PYTHON_REPO}/"
    fi

    echo ""
    echo "--- Existing repositories ---"
    gcloud artifacts repositories list \
        --location="$LOCATION" \
        --project="$PROJECT_ID" \
        --format="table(name.basename():label=REPO,format:label=FORMAT,location:label=LOCATION)" 2>/dev/null || true

    echo ""
    echo "To push images:"
    echo "  gcloud auth configure-docker ${LOCATION}-docker.pkg.dev"
    echo "  docker tag myimage ${LOCATION}-docker.pkg.dev/${PROJECT_ID}/${DOCKER_REPO}/myservice:latest"
    echo "  docker push ${LOCATION}-docker.pkg.dev/${PROJECT_ID}/${DOCKER_REPO}/myservice:latest"
    echo ""
    echo "To publish Python wheels:"
    echo "  pip install twine keyring keyrings.google-artifactregistry-auth"
    echo "  twine upload --repository-url https://${LOCATION}-python.pkg.dev/${PROJECT_ID}/${PYTHON_REPO}/ dist/*"
}

# ---------------------------------------------------------------------------
# AWS: ECR (Docker) + CodeArtifact (Python wheels)
# ---------------------------------------------------------------------------
_run_aws_registry() {
    if ! command -v aws &>/dev/null; then
        echo "[BLOCKED] AWS CLI not installed."
        return 1
    fi
    if ! aws sts get-caller-identity &>/dev/null; then
        echo "[BLOCKED] No AWS credentials. Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY."
        return 1
    fi

    # Service images that need ECR repos
    local service_repos=(
        "execution-service"
        "strategy-service"
        "risk-and-exposure-service"
        "pnl-attribution-service"
        "instruments-service"
        "market-tick-data-service"
        "deployment-api"
        "alerting-service"
        "ml-inference-service"
        "ml-training-service"
        "features-calendar-service"
        "features-delta-one-service"
        "features-onchain-service"
        "features-volatility-service"
        "position-balance-monitor-service"
    )

    echo "--- AWS ECR Docker repositories ---"
    local created=0 skipped=0 errors=0

    for repo in "${service_repos[@]}"; do
        if aws ecr describe-repositories \
                --repository-names "$repo" \
                --region "$AWS_REGION" &>/dev/null; then
            echo "  [SKIP] ECR repo '$repo' already exists"
            ((skipped++)) || true
        elif [[ "$DRY_RUN" == "true" ]]; then
            echo "  [DRY]  Would create ECR repo: $repo"
        else
            aws ecr create-repository \
                --repository-name "$repo" \
                --region "$AWS_REGION" \
                --image-scanning-configuration scanOnPush=true \
                --encryption-configuration encryptionType=AES256 \
                --output text --query 'repository.repositoryUri' 2>&1 || {
                echo "  [ERROR] Failed to create ECR repo: $repo"
                ((errors++)) || true
                continue
            }
            echo "  [OK] Created ECR: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${repo}"
            ((created++)) || true
        fi
    done

    echo ""
    echo "--- AWS CodeArtifact Python wheels ---"

    # Create CodeArtifact domain
    if aws codeartifact describe-domain \
            --domain "$CODEARTIFACT_DOMAIN" \
            --region "$AWS_REGION" &>/dev/null; then
        echo "  [SKIP] CodeArtifact domain '$CODEARTIFACT_DOMAIN' already exists"
    elif [[ "$DRY_RUN" == "true" ]]; then
        echo "  [DRY]  Would create CodeArtifact domain: $CODEARTIFACT_DOMAIN"
    else
        aws codeartifact create-domain \
            --domain "$CODEARTIFACT_DOMAIN" \
            --region "$AWS_REGION" \
            --output text --query 'domain.name' 2>&1 || {
            echo "  [ERROR] Failed to create CodeArtifact domain"
            ((errors++)) || true
        }
        echo "  [OK] Created domain: $CODEARTIFACT_DOMAIN"
    fi

    # Create wheels repository
    if aws codeartifact describe-repository \
            --domain "$CODEARTIFACT_DOMAIN" \
            --repository "$PYTHON_REPO" \
            --region "$AWS_REGION" &>/dev/null; then
        echo "  [SKIP] CodeArtifact repo '$PYTHON_REPO' already exists"
    elif [[ "$DRY_RUN" == "true" ]]; then
        echo "  [DRY]  Would create CodeArtifact repo: $PYTHON_REPO"
    else
        aws codeartifact create-repository \
            --domain "$CODEARTIFACT_DOMAIN" \
            --repository "$PYTHON_REPO" \
            --region "$AWS_REGION" \
            --description "Unified Trading System Python wheels" \
            --output text --query 'repository.name' 2>&1 || {
            echo "  [ERROR] Failed to create CodeArtifact repo"
            ((errors++)) || true
        }
        echo "  [OK] Created CodeArtifact: $CODEARTIFACT_DOMAIN/$PYTHON_REPO"
    fi

    echo ""
    echo "Summary: ECR repos created=$created skipped=$skipped errors=$errors"
    echo ""
    echo "To push ECR images:"
    echo "  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS \\"
    echo "    --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    echo "  docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/execution-service:latest"
    echo ""
    echo "To publish Python wheels to CodeArtifact:"
    echo "  aws codeartifact login --tool twine --domain $CODEARTIFACT_DOMAIN \\"
    echo "    --repository $PYTHON_REPO --region $AWS_REGION"
    echo "  twine upload --repository codeartifact dist/*"

    [[ "$errors" -gt 0 ]] && return 1 || return 0
}

# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------
case "$CLOUD" in
    gcp) _run_gcp_registry ;;
    aws) _run_aws_registry ;;
    *)
        echo "Unknown cloud: $CLOUD (use gcp or aws)"
        exit 1
        ;;
esac
