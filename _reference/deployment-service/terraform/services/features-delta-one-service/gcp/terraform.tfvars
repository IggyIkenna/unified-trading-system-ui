# Terraform variables for features-delta-one-service

project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
gcs_location = "asia-northeast1"
environment  = "prod"

job_name     = "features-delta-one-service-job"
docker_image = "asia-northeast1-docker.pkg.dev/${PROJECT_ID}/features-delta-one-service/features-delta-one-service:latest"

service_account_email           = "features-delta-one-sa@${PROJECT_ID}.iam.gserviceaccount.com"
scheduler_service_account_email = "features-delta-one-sa@${PROJECT_ID}.iam.gserviceaccount.com"

cpu             = "2"
memory          = "8Gi"
timeout_seconds = 86400
max_retries     = 3

workflow_name          = "features-delta-one-service-daily"
backfill_workflow_name = "features-delta-one-service-backfill"

# Schedule at 11:00 AM UTC (after market-data-processing at 10:00)
schedule  = "0 11 * * *"
time_zone = "UTC"
