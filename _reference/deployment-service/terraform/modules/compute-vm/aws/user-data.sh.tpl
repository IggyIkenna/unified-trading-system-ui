#!/bin/bash
# User data script for EC2 instance running Docker container
# Equivalent to GCP Container-Optimized OS cloud-init

set -e

INSTANCE_ID="${instance_id}"
REGION="${region}"
DOCKER_IMAGE="${docker_image}"
ENV_VARS="${env_vars}"
DOCKER_ARGS="${docker_args}"
SELF_TERMINATE="${self_terminate}"
STATUS_S3_PATH="${status_s3_path}"
SERVICE_NAME="${service_name}"
SHARD_ID="${shard_id}"
TIMEOUT_SECONDS=${timeout_seconds}

# ============================================================
# Setup Logging
# ============================================================

# Log to CloudWatch and console
exec > >(tee -a /var/log/container-startup.log)
exec 2>&1

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting container execution on $INSTANCE_ID"

# ============================================================
# Install Docker (if not already installed)
# ============================================================

if ! command -v docker &> /dev/null; then
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Installing Docker..."
    sudo yum update -y
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker ec2-user
fi

# ============================================================
# Authenticate to ECR
# ============================================================

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Authenticating to ECR..."
aws ecr get-login-password --region $REGION | \
    docker login --username AWS --password-stdin \
    $(echo $DOCKER_IMAGE | cut -d'/' -f1)

# ============================================================
# Pull Docker Image
# ============================================================

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Pulling Docker image: $DOCKER_IMAGE"
docker pull $DOCKER_IMAGE

# ============================================================
# Run Container with Timeout
# ============================================================

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting container..."

# Write STARTED status
if [ -n "$STATUS_S3_PATH" ]; then
    echo "STARTED" | aws s3 cp - "$STATUS_S3_PATH.txt"
fi

# Run with timeout
timeout $TIMEOUT_SECONDS docker run --rm \
    $ENV_VARS \
    $DOCKER_IMAGE \
    $DOCKER_ARGS
EXIT_CODE=$?

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Container exited with code: $EXIT_CODE"

# ============================================================
# Report Status
# ============================================================

if [ -n "$STATUS_S3_PATH" ]; then
    if [ $EXIT_CODE -eq 0 ]; then
        echo "SUCCEEDED" | aws s3 cp - "$STATUS_S3_PATH.txt"
    else
        echo "FAILED" | aws s3 cp - "$STATUS_S3_PATH.txt"
    fi
fi

# ============================================================
# Self-Terminate (if enabled)
# ============================================================

if [ "$SELF_TERMINATE" = "true" ]; then
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Self-terminating instance..."

    # Get instance ID from metadata
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)

    # Terminate this instance
    aws ec2 terminate-instances --region $REGION --instance-ids $INSTANCE_ID
fi

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Done"
