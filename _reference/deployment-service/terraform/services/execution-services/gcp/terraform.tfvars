# Terraform variables for execution-services

project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
gcs_location = "asia-northeast1"
environment  = "prod"

job_name     = "execution-services-job"
docker_image = "asia-northeast1-docker.pkg.dev/${PROJECT_ID}/execution-service/execution-service:latest"

service_account_email           = "execution-services-sa@${PROJECT_ID}.iam.gserviceaccount.com"
scheduler_service_account_email = "execution-services-sa@${PROJECT_ID}.iam.gserviceaccount.com"

# Heavy tick-by-tick simulation workload
cpu             = "4"
memory          = "16Gi"
timeout_seconds = 14400  # 4 hours
max_retries     = 2

execution_bucket_cefi   = "execution-store-cefi-${PROJECT_ID}"
execution_bucket_tradfi = "execution-store-tradfi-${PROJECT_ID}"
execution_bucket_defi   = "execution-store-defi-${PROJECT_ID}"

workflow_name          = "execution-services-daily"
backfill_workflow_name = "execution-services-backtest"

# Schedule at 16:00 PM UTC (after strategy)
schedule  = "0 16 * * *"
time_zone = "UTC"
