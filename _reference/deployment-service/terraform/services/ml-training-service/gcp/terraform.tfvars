# Terraform variables for ml-training-service

project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
gcs_location = "asia-northeast1"
environment  = "prod"

job_name     = "ml-training-service-job"
docker_image = "asia-northeast1-docker.pkg.dev/${PROJECT_ID}/ml-training-service/ml-training-service:latest"

service_account_email           = "ml-training-sa@${PROJECT_ID}.iam.gserviceaccount.com"
scheduler_service_account_email = "ml-training-sa@${PROJECT_ID}.iam.gserviceaccount.com"

# Heavy ML workload
cpu             = "4"
memory          = "16Gi"
timeout_seconds = 14400  # 4 hours
max_retries     = 2

ml_models_bucket  = "ml-models-store-${PROJECT_ID}"
ml_configs_bucket = "ml-configs-store-${PROJECT_ID}"

workflow_name          = "ml-training-service-daily"
backfill_workflow_name = "ml-training-service-full"

# Schedule at 12:00 PM UTC (after all features)
schedule  = "0 12 * * *"
time_zone = "UTC"
