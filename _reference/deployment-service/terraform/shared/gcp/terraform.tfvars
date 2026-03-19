# Terraform variables for GCP Shared Infrastructure

project_id   = "${PROJECT_ID}"
region       = "asia-northeast1"
gcs_location = "asia-northeast1"
environment  = "prod"

create_artifact_registry = true
create_gcs_buckets       = true
create_service_accounts  = true
