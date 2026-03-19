# Terraform Backend Configuration
# Stores state in GCS bucket for collaboration and persistence

terraform {
  backend "gcs" {
    bucket = "terraform-state-{project_id}"
    prefix = "services/market-data-processing-service"
  }
}
