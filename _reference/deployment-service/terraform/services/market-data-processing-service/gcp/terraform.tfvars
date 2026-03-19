# Terraform variables for market-data-processing-service

project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
gcs_location = "asia-northeast1"
environment  = "prod"

job_name     = "market-data-processing-service-job"
docker_image = "asia-northeast1-docker.pkg.dev/${PROJECT_ID}/market-data-processing-service/market-data-processing-service:latest"

service_account_email           = "market-data-processing-sa@${PROJECT_ID}.iam.gserviceaccount.com"
scheduler_service_account_email = "market-data-processing-sa@${PROJECT_ID}.iam.gserviceaccount.com"

# Job configuration
cpu             = "2"
memory          = "8Gi"
timeout_seconds = 86400
max_retries     = 3

# Workflow configuration
workflow_name          = "market-data-processing-service-daily"
backfill_workflow_name = "market-data-processing-service-backfill"

# Schedule at 10:00 AM UTC (after tick data handler at 9:30)
schedule  = "0 10 * * *"
time_zone = "UTC"
