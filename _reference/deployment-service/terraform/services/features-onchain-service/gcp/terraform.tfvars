# Terraform variables for features-onchain-service

project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
gcs_location = "asia-northeast1"
environment  = "prod"

job_name     = "features-onchain-service-job"
docker_image = "asia-northeast1-docker.pkg.dev/${PROJECT_ID}/features-onchain-service/features-onchain-service:latest"

service_account_email           = "features-onchain-sa@${PROJECT_ID}.iam.gserviceaccount.com"
scheduler_service_account_email = "features-onchain-sa@${PROJECT_ID}.iam.gserviceaccount.com"

cpu             = "2"
memory          = "4Gi"
timeout_seconds = 86400
max_retries     = 3

workflow_name          = "features-onchain-service-daily"
backfill_workflow_name = "features-onchain-service-backfill"

# Schedule at 11:30 AM UTC (after other features)
schedule  = "30 11 * * *"
time_zone = "UTC"
