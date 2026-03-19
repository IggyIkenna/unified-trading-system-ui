# Terraform variables for ml-inference-service

project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
gcs_location = "asia-northeast1"
environment  = "prod"

job_name     = "ml-inference-service-job"
docker_image = "asia-northeast1-docker.pkg.dev/${PROJECT_ID}/ml-inference-service/ml-inference-service:latest"

service_account_email           = "ml-inference-sa@${PROJECT_ID}.iam.gserviceaccount.com"
scheduler_service_account_email = "ml-inference-sa@${PROJECT_ID}.iam.gserviceaccount.com"

cpu             = "2"
memory          = "8Gi"
timeout_seconds = 86400
max_retries     = 3

ml_models_bucket      = "ml-models-store-${PROJECT_ID}"
ml_predictions_bucket = "ml-predictions-store-${PROJECT_ID}"

workflow_name          = "ml-inference-service-daily"
backfill_workflow_name = "ml-inference-service-batch"

# Schedule at 14:00 PM UTC (after training)
schedule  = "0 14 * * *"
time_zone = "UTC"
