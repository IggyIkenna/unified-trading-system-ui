# Terraform variables for strategy-service

project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
gcs_location = "asia-northeast1"
environment  = "prod"

job_name     = "strategy-service-job"
docker_image = "asia-northeast1-docker.pkg.dev/${PROJECT_ID}/strategy-service/strategy-service:latest"

service_account_email           = "strategy-service-sa@${PROJECT_ID}.iam.gserviceaccount.com"
scheduler_service_account_email = "strategy-service-sa@${PROJECT_ID}.iam.gserviceaccount.com"

cpu             = "2"
memory          = "8Gi"
timeout_seconds = 86400
max_retries     = 3

strategy_bucket_cefi   = "strategy-store-cefi-${PROJECT_ID}"
strategy_bucket_tradfi = "strategy-store-tradfi-${PROJECT_ID}"
strategy_bucket_defi   = "strategy-store-defi-${PROJECT_ID}"

workflow_name          = "strategy-service-daily"
backfill_workflow_name = "strategy-service-backtest"

# Schedule at 15:00 PM UTC (after inference)
schedule  = "0 15 * * *"
time_zone = "UTC"
