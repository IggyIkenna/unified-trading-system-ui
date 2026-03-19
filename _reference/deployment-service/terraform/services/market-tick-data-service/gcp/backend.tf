# Terraform Backend Configuration
# Stores state in GCS bucket for collaboration and persistence

terraform {
  backend "gcs" {
    bucket = "terraform-state-{project_id}"
    prefix = "services/market-tick-data-service"
  }
}

# Note: Before first use, create the state bucket:
# gsutil mb -l asia-northeast1 gs://terraform-state-{project_id}
# gsutil versioning set on gs://terraform-state-{project_id}
