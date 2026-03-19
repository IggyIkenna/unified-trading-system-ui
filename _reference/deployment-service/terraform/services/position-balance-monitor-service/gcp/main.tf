# Terraform configuration for position-balance-monitor-service
# Monitors live position balances and triggers alerts on limit breaches
# Runs as a periodic Cloud Run Job (every 5 minutes during market hours)

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
  # Live monitoring workflow — single cycle per trigger
  live_workflow_yaml = <<-YAML
main:
  params: [args]
  steps:
    - init:
        assign:
          - project_id: "${var.project_id}"
          - region: "${var.region}"
          - job_name: "${var.job_name}"

    # Run position monitor — single cycle scan
    - run_monitor:
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
                    - "monitor"
                    - "--mode"
                    - "live"
                    - "--single-cycle"
                    - "--category"
                    - "CEFI"
                    - "--category"
                    - "TRADFI"
                    - "--category"
                    - "DEFI"
        result: monitor_response

    - get_execution:
        assign:
          - execution_name: $${monitor_response.body.metadata.name}

    - wait_monitor:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: monitor_status

    - check_monitor:
        switch:
          - condition: $${"completionTime" in monitor_status.body}
            next: return_success
          - condition: $${map.get(monitor_status.body, "failedCount") != null and map.get(monitor_status.body, "failedCount") > 0}
            raise: "position-balance-monitor failed"
        next: monitor_wait_loop

    - monitor_wait_loop:
        call: sys.sleep
        args:
          seconds: 30
        next: wait_monitor

    - return_success:
        return:
          status: "completed"
          execution: $${execution_name}
          message: "position-balance-monitor-service live cycle completed"
YAML
}

# Cloud Run Job for position-balance-monitor-service
module "monitor_job" {
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

  gcs_volumes = [
    { name = "execution-store-cefi", bucket = "execution-store-cefi-${var.project_id}", read_only = true },
    { name = "execution-store-tradfi", bucket = "execution-store-tradfi-${var.project_id}", read_only = true },
    { name = "execution-store-defi", bucket = "execution-store-defi-${var.project_id}", read_only = true },
    { name = "position-monitor-store", bucket = "position-monitor-store-${var.project_id}", read_only = false },
  ]

  secret_environment_variables = {}

  service_name = "position-balance-monitor-service"
  environment  = var.environment

  labels = {
    "app"     = "position-balance-monitor-service"
    "version" = "v2"
  }
}

# Live Workflow (every 5 minutes — single-cycle scan)
module "live_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.live_workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Live position balance monitoring workflow (every 5 min)"
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
    "app"     = "position-balance-monitor-service"
    "type"    = "live"
    "version" = "v2"
  }
}
