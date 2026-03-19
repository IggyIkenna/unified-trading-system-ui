# Terraform Backend Configuration

terraform {
  backend "gcs" {
    bucket = "terraform-state-{project_id}"
    prefix = "services/features-volatility-service"
  }
}
