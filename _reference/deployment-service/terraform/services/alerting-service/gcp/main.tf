# Terraform configuration for alerting-service
# Routes system alerts to PagerDuty and Slack; monitors kill-switch and circuit-breaker events
# Runs as a periodic Cloud Run Job (every 5 minutes) for event polling + notifications

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  # Live polling workflow — single cycle alert evaluation
  live_workflow_yaml = <<-YAML
main:
  params: [args]
  steps:
    - init:
        assign:
          - project_id: "${var.project_id}"
          - region: "${var.region}"
          - job_name: "${var.job_name}"

    # Run alerting — single cycle event check and notification dispatch
    - run_alerting:
        call: http.post
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/projects/" + project_id + "/locations/" + region + "/jobs/" + job_name + ":run"}
          auth:
            type: OAuth2
          body:
            overrides:
              containerOverrides:
                - args:
                    - "--operation"
                    - "poll"
                    - "--mode"
                    - "live"
                    - "--single-cycle"
        result: alerting_response

    - get_execution:
        assign:
          - execution_name: $${alerting_response.body.metadata.name}

    - wait_alerting:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: alerting_status

    - check_alerting:
        switch:
          - condition: $${"completionTime" in alerting_status.body}
            next: return_success
          - condition: $${map.get(alerting_status.body, "failedCount") != null and map.get(alerting_status.body, "failedCount") > 0}
            raise: "alerting-service failed"
        next: alerting_wait_loop

    - alerting_wait_loop:
        call: sys.sleep
        args:
          seconds: 30
        next: wait_alerting

    - return_success:
        return:
          status: "completed"
          execution: $${execution_name}
          message: "alerting-service live cycle completed"
YAML
}

# Cloud Run Job for alerting-service
module "alerting_job" {
  source = "../../../modules/container-job/gcp"

  name       = var.job_name
  project_id = var.project_id
  region     = var.region

  image                 = var.docker_image
  service_account_email = var.service_account_email

  cpu             = var.cpu
  memory          = var.memory
  timeout_seconds = var.timeout_seconds
  max_retries     = var.max_retries

  environment_variables = {
    ENVIRONMENT            = var.environment
    GCP_PROJECT_ID         = var.project_id
    GCS_REGION             = var.region
    GCS_LOCATION           = var.gcs_location
    GCS_FUSE_MOUNT_PATH    = "/mnt/gcs"
    UCS_SKIP_GCSFUSE_CHECK = "1"
    PYTHONUNBUFFERED       = "1"
  }

  gcs_volumes = []

  secret_environment_variables = {
    PAGERDUTY_ROUTING_KEY = {
      secret_name = "pagerduty-routing-key"
      version     = "latest"
    }
    SLACK_WEBHOOK_URL = {
      secret_name = "slack-webhook-url"
      version     = "latest"
    }
  }

  service_name = "alerting-service"
  environment  = var.environment

  labels = {
    "app"     = "alerting-service"
    "version" = "v2"
  }
}

# Live Workflow (every 5 minutes — single-cycle alert polling)
module "live_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.live_workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Live alerting workflow — polls for system events and dispatches notifications"
  service_account_email = var.service_account_email

  workflow_source = local.live_workflow_yaml

  # Every 5 minutes
  schedule                        = var.live_schedule
  time_zone                       = var.time_zone
  scheduler_service_account_email = var.scheduler_service_account_email

  workflow_args = {
    trigger = "scheduled"
  }

  labels = {
    "app"     = "alerting-service"
    "type"    = "live"
    "version" = "v2"
  }
}
