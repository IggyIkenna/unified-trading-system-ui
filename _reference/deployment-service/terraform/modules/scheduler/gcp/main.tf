# GCP Cloud Scheduler Module
# This module creates a Cloud Scheduler job to trigger Cloud Run Jobs on a schedule

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
  }
}

# Cloud Scheduler Job
resource "google_cloud_scheduler_job" "scheduler" {
  name        = var.name
  description = var.description
  project     = var.project_id
  region      = var.region

  schedule  = var.schedule
  time_zone = var.time_zone

  paused = var.paused

  # Retry configuration
  retry_config {
    retry_count          = var.retry_count
    max_retry_duration   = var.max_retry_duration
    min_backoff_duration = var.min_backoff_duration
    max_backoff_duration = var.max_backoff_duration
    max_doublings        = var.max_doublings
  }

  # HTTP target to trigger Cloud Run Job
  http_target {
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${var.target_job_name}:run"
    http_method = "POST"

    oauth_token {
      service_account_email = var.scheduler_service_account_email
      scope                 = "https://www.googleapis.com/auth/cloud-platform"
    }

    headers = {
      "Content-Type" = "application/json"
    }

    # Optional: Pass arguments to the job via body
    body = var.job_body != null ? base64encode(var.job_body) : null
  }

  lifecycle {
    # Prevent accidental deletion
    prevent_destroy = false
  }
}
