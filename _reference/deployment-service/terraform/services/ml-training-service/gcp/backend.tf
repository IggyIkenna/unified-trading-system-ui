# Terraform Backend Configuration

terraform {
  backend "gcs" {
    bucket = "terraform-state-{project_id}"
    prefix = "services/ml-training-service"
  }
}
