# Terraform variables for market-tick-data-service
# These are the actual values for deployment

# Cloud Provider
cloud_provider = "gcp"

# GCP Project Configuration
project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
gcs_location = "asia-northeast1"

# Job Configuration
job_name     = "market-tick-data-service"
docker_image = "asia-northeast1-docker.pkg.dev/${PROJECT_ID}/market-tick-data-service/market-tick-data-service:latest"

# Use unified service account (has all required permissions)
service_account_email = "instruments-service-cloud-run@${PROJECT_ID}.iam.gserviceaccount.com"

# Resource Allocation
cpu             = "4"
memory          = "16Gi"
timeout_seconds = 86400 # 24 hours (maximum)
max_retries     = 3
environment     = "prod"

# GCS Buckets (existing)
gcs_bucket_cefi   = "market-data-tick-cefi-${PROJECT_ID}"
gcs_bucket_tradfi = "market-data-tick-tradfi-${PROJECT_ID}"
gcs_bucket_defi   = "market-data-tick-defi-${PROJECT_ID}"

# Workflow Configuration
daily_workflow_name    = "market-tick-daily"
backfill_workflow_name = "market-tick-backfill"

# Scheduler Configuration
scheduler_name                  = "market-tick-trigger"
schedule                        = "0 9 * * *" # 9:00 AM UTC daily (30 min after instruments-service)
time_zone                       = "UTC"
scheduler_paused                = false
scheduler_service_account_email = "cloud-scheduler@${PROJECT_ID}.iam.gserviceaccount.com"
