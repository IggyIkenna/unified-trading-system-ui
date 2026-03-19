# Terraform variables for features-volatility-service

project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
gcs_location = "asia-northeast1"
environment  = "prod"

job_name     = "features-volatility-service-job"
docker_image = "asia-northeast1-docker.pkg.dev/${PROJECT_ID}/features-volatility-service/features-volatility-service:latest"

service_account_email           = "features-volatility-sa@${PROJECT_ID}.iam.gserviceaccount.com"
scheduler_service_account_email = "features-volatility-sa@${PROJECT_ID}.iam.gserviceaccount.com"

cpu             = "2"
memory          = "8Gi"
timeout_seconds = 86400
max_retries     = 3

workflow_name          = "features-volatility-service-daily"
backfill_workflow_name = "features-volatility-service-backfill"

# Schedule at 11:00 AM UTC (parallel with delta-one)
schedule  = "0 11 * * *"
time_zone = "UTC"
