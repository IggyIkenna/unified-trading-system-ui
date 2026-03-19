# Terraform variables for features-calendar-service

project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
gcs_location = "asia-northeast1"
environment  = "prod"

job_name     = "features-calendar-service-job"
docker_image = "asia-northeast1-docker.pkg.dev/${PROJECT_ID}/features-calendar-service/features-calendar-service:latest"

service_account_email           = "features-calendar-sa@${PROJECT_ID}.iam.gserviceaccount.com"
scheduler_service_account_email = "features-calendar-sa@${PROJECT_ID}.iam.gserviceaccount.com"

cpu             = "1"
memory          = "1Gi"
timeout_seconds = 600
max_retries     = 3

workflow_name          = "features-calendar-service-daily"
backfill_workflow_name = "features-calendar-service-backfill"

# Schedule at 8:30 AM UTC (after instruments-service at 8:00)
schedule  = "30 8 * * *"
time_zone = "UTC"
