project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
gcs_location = "asia-northeast1"
environment  = "prod"

job_name     = "features-multi-timeframe-service-job"
docker_image = "asia-northeast1-docker.pkg.dev/${PROJECT_ID}/features-multi-timeframe-service/features-multi-timeframe-service:latest"

service_account_email           = "features-multi-timeframe-sa@${PROJECT_ID}.iam.gserviceaccount.com"
scheduler_service_account_email = "features-multi-timeframe-sa@${PROJECT_ID}.iam.gserviceaccount.com"

cpu             = "2"
memory          = "8Gi"
timeout_seconds = 86400
max_retries     = 3

workflow_name          = "features-multi-timeframe-service-daily"
backfill_workflow_name = "features-multi-timeframe-service-backfill"

# Schedule at 12:00 PM UTC (after features-delta-one at 11:00)
schedule  = "0 12 * * *"
time_zone = "UTC"
