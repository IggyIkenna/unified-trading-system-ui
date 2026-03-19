# Terraform configuration for execution-results-api
# HTTP API exposing execution results for the deployment-ui and operator tooling
# Runs as a periodic Cloud Run Job (every 15 minutes) to refresh cached results

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
  # Live workflow: refresh cached execution results every 15 min
  live_workflow_yaml = <<-YAML
main:
  params: [args]
  steps:
    - init:
        assign:
          - project_id: "${var.project_id}"
          - region: "${var.region}"
          - job_name: "${var.job_name}"

    # Run result refresh — single cycle
    - run_refresh:
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
                    - "refresh"
                    - "--mode"
                    - "live"
                    - "--single-cycle"
        result: refresh_response

    - get_execution:
        assign:
          - execution_name: $${refresh_response.body.metadata.name}

    - wait_refresh:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: refresh_status

    - check_refresh:
        switch:
          - condition: $${"completionTime" in refresh_status.body}
            next: return_success
          - condition: $${map.get(refresh_status.body, "failedCount") != null and map.get(refresh_status.body, "failedCount") > 0}
            raise: "execution-results-api refresh failed"
        next: refresh_wait_loop

    - refresh_wait_loop:
        call: sys.sleep
        args:
          seconds: 30
        next: wait_refresh

    - return_success:
        return:
          status: "completed"
          execution: $${execution_name}
          message: "execution-results-api cache refresh completed"
YAML
}

# Cloud Run Job for execution-results-api cache refresh
module "refresh_job" {
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
    { name = "execution-results-cache", bucket = "execution-results-cache-${var.project_id}", read_only = false },
  ]

  secret_environment_variables = {}

  service_name = "execution-results-api"
  environment  = var.environment

  labels = {
    "app"     = "execution-results-api"
    "version" = "v2"
  }
}

# Live Workflow (every 15 minutes — cache refresh)
module "live_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.live_workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Live workflow for execution-results-api cache refresh (every 15 min)"
  service_account_email = var.service_account_email

  workflow_source = local.live_workflow_yaml

  # Every 15 minutes (minute 0, 15, 30, 45)
  schedule                        = var.live_schedule
  time_zone                       = var.time_zone
  scheduler_service_account_email = var.scheduler_service_account_email

  workflow_args = {
    trigger = "scheduled"
  }

  labels = {
    "app"     = "execution-results-api"
    "type"    = "live"
    "version" = "v2"
  }
}
