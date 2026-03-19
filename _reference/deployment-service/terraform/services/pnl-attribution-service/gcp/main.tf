# Terraform configuration for pnl-attribution-service
# Attributes PnL across strategies, venues, instruments, and time periods
# Creates Cloud Run Job + Workflow for daily T+1 operations

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
  # Daily T+1 workflow — attribute PnL for prior day
  workflow_yaml = <<-YAML
main:
  params: [args]
  steps:
    - init:
        assign:
          - project_id: "${var.project_id}"
          - region: "${var.region}"
          - job_name: "${var.job_name}"

    # Compute yesterday's date (T+1)
    - compute_date:
        assign:
          - current_time: $${sys.now()}
          - yesterday_seconds: $${int(current_time) - 86400}
          - yesterday_time: $${time.format(yesterday_seconds)}
          - t_plus_1_date: $${text.substring(yesterday_time, 0, 10)}

    # Run PnL attribution for all categories
    - run_attribution:
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
                    - "attribute"
                    - "--mode"
                    - "batch"
                    - "--category"
                    - "CEFI"
                    - "--category"
                    - "TRADFI"
                    - "--category"
                    - "DEFI"
                    - "--date"
                    - $${t_plus_1_date}
        result: attribution_response

    - get_execution:
        assign:
          - execution_name: $${attribution_response.body.metadata.name}

    - wait_attribution:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: attribution_status

    - check_attribution:
        switch:
          - condition: $${"completionTime" in attribution_status.body}
            next: return_success
          - condition: $${map.get(attribution_status.body, "failedCount") != null and map.get(attribution_status.body, "failedCount") > 0}
            raise: "pnl-attribution failed"
        next: attribution_wait_loop

    - attribution_wait_loop:
        call: sys.sleep
        args:
          seconds: 60
        next: wait_attribution

    - return_success:
        return:
          status: "completed"
          date: $${t_plus_1_date}
          execution: $${execution_name}
          message: "pnl-attribution-service completed"
YAML

  # Backfill workflow for historical PnL reattribution
  backfill_workflow_yaml = <<-YAML
main:
  params: [args]
  steps:
    - init:
        assign:
          - project_id: "${var.project_id}"
          - region: "${var.region}"
          - job_name: "${var.job_name}"
          - start_date: $${args.start_date}
          - end_date: $${args.end_date}
          - categories: $${default(map.get(args, "categories"), ["CEFI", "TRADFI", "DEFI"])}

    - build_args:
        assign:
          - base_args: ["--operation", "attribute", "--mode", "batch", "--start-date", $${start_date}, "--end-date", $${end_date}]

    - add_categories:
        for:
          value: cat
          in: $${categories}
          steps:
            - append_cat:
                assign:
                  - base_args: $${list.concat(base_args, ["--category", cat])}

    - run_backfill:
        call: http.post
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/projects/" + project_id + "/locations/" + region + "/jobs/" + job_name + ":run"}
          auth:
            type: OAuth2
          body:
            overrides:
              containerOverrides:
                - args: $${base_args}
        result: backfill_response

    - get_execution:
        assign:
          - execution_name: $${backfill_response.body.metadata.name}

    - wait_backfill:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: backfill_status

    - check_backfill:
        switch:
          - condition: $${"completionTime" in backfill_status.body}
            next: return_success
          - condition: $${map.get(backfill_status.body, "failedCount") != null and map.get(backfill_status.body, "failedCount") > 0}
            raise: "backfill failed"
        next: backfill_wait_loop

    - backfill_wait_loop:
        call: sys.sleep
        args:
          seconds: 60
        next: wait_backfill

    - return_success:
        return:
          status: "completed"
          start_date: $${start_date}
          end_date: $${end_date}
          categories: $${categories}
          execution: $${execution_name}
          message: "pnl-attribution-service backfill completed"
YAML
}

# Cloud Run Job for pnl-attribution-service
module "daily_job" {
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
    { name = "strategy-store-cefi", bucket = "strategy-store-cefi-${var.project_id}", read_only = true },
    { name = "strategy-store-tradfi", bucket = "strategy-store-tradfi-${var.project_id}", read_only = true },
    { name = "strategy-store-defi", bucket = "strategy-store-defi-${var.project_id}", read_only = true },
    { name = "pnl-attribution-store", bucket = "pnl-attribution-store-${var.project_id}", read_only = false },
  ]

  secret_environment_variables = {}

  service_name = "pnl-attribution-service"
  environment  = var.environment

  labels = {
    "app"     = "pnl-attribution-service"
    "version" = "v2"
  }
}

# Daily T+1 Workflow
module "daily_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Daily T+1 workflow for pnl-attribution-service"
  service_account_email = var.service_account_email

  workflow_source = local.workflow_yaml

  # Schedule at 17:30 PM UTC (after risk-and-exposure-service)
  schedule                        = var.schedule
  time_zone                       = var.time_zone
  scheduler_service_account_email = var.scheduler_service_account_email

  workflow_args = {
    trigger = "scheduled"
  }

  labels = {
    "app"     = "pnl-attribution-service"
    "type"    = "daily"
    "version" = "v2"
  }
}

# Backfill Workflow (manual trigger)
module "backfill_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.backfill_workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Historical backfill workflow for pnl-attribution-service"
  service_account_email = var.service_account_email

  workflow_source = local.backfill_workflow_yaml

  # No schedule - manual trigger only
  schedule  = null
  time_zone = var.time_zone

  labels = {
    "app"     = "pnl-attribution-service"
    "type"    = "backfill"
    "version" = "v2"
  }
}
