# Cloud Workflow Module for GCP
#
# Creates a Cloud Workflow that can orchestrate multiple Cloud Run Jobs
# in sequence or parallel with proper error handling.

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
  }
}

# Cloud Workflow
resource "google_workflows_workflow" "workflow" {
  name            = var.name
  region          = var.region
  project         = var.project_id
  description     = var.description
  service_account = var.service_account_email

  source_contents = var.workflow_source

  labels = merge(
    {
      "managed-by" = "terraform"
      "component"  = "workflow"
    },
    var.labels
  )
}

# Optional: Cloud Scheduler to trigger the workflow
resource "google_cloud_scheduler_job" "trigger" {
  count = var.schedule != null ? 1 : 0

  name        = "${var.name}-trigger"
  region      = var.region
  project     = var.project_id
  description = "Triggers ${var.name} workflow"
  schedule    = var.schedule
  time_zone   = var.time_zone

  http_target {
    uri         = "https://workflowexecutions.googleapis.com/v1/${google_workflows_workflow.workflow.id}/executions"
    http_method = "POST"
    body        = base64encode(jsonencode({
      argument = jsonencode(var.workflow_args)
    }))

    oauth_token {
      service_account_email = var.scheduler_service_account_email
      scope                 = "https://www.googleapis.com/auth/cloud-platform"
    }
  }

  retry_config {
    retry_count          = 3
    min_backoff_duration = "5s"
    max_backoff_duration = "300s"
  }
}
