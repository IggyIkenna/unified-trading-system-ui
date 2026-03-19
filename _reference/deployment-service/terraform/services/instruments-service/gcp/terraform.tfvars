# Terraform variables for instruments-service
# These are the actual values for deployment

# Cloud Provider
cloud_provider = "gcp"

# GCP Project Configuration
project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
gcs_location = "asia-northeast1"

# Job Configuration
job_name     = "instruments-service"
docker_image = "asia-northeast1-docker.pkg.dev/${PROJECT_ID}/instruments-service/instruments-service:latest"

# Use existing service account
service_account_email = "instruments-service-cloud-run@${PROJECT_ID}.iam.gserviceaccount.com"

# Resource Allocation
cpu               = "2"
memory            = "4Gi"
timeout_seconds   = 86400  # 24 hours (maximum)
max_retries       = 3
environment       = "prod"

# GCS Buckets (existing)
gcs_bucket_cefi   = "instruments-store-cefi-${PROJECT_ID}"
gcs_bucket_tradfi = "instruments-store-tradfi-${PROJECT_ID}"
gcs_bucket_defi   = "instruments-store-defi-${PROJECT_ID}"

# Workflow Configuration
workflow_name        = "instruments-service-daily"
live_workflow_name   = "instruments-service-live"
live_schedule        = "*/15 * * * *"  # Every 15 min (Cloud Run single-cycle, avoids wasting compute)

# Scheduler Configuration
scheduler_name                  = "instruments-service-trigger"
schedule                        = "30 8 * * *"  # 8:30 AM UTC daily
time_zone                       = "UTC"
scheduler_paused                = false
scheduler_service_account_email = "cloud-scheduler@${PROJECT_ID}.iam.gserviceaccount.com"
