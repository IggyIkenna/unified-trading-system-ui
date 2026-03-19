terraform {
  backend "gcs" {
    bucket = "terraform-state-{project_id}"
    prefix = "services/features-multi-timeframe-service"
  }
}
