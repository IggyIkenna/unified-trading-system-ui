# Terraform configuration for features-calendar-service
# Generates calendar/temporal features (day of week, FOMC, earnings, etc.)
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
  # Daily T+1 workflow
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

    # Run calendar feature generation for all categories
    - run_features:
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
                    - "compute"
                    - "--mode"
                    - "batch"
                    - "--category"
                    - "CEFI"
                    - "--start-date"
                    - $${t_plus_1_date}
                    - "--end-date"
                    - $${t_plus_1_date}
        result: cefi_response

    # Wait for CEFI completion
    - get_cefi_execution:
        assign:
          - cefi_execution_name: $${cefi_response.body.metadata.name}

    - wait_cefi:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + cefi_execution_name}
          auth:
            type: OAuth2
        result: cefi_status

    - check_cefi:
        switch:
          - condition: $${"completionTime" in cefi_status.body}
            next: run_tradfi
          - condition: $${map.get(cefi_status.body, "failedCount") != null and map.get(cefi_status.body, "failedCount") > 0}
            raise: "features-calendar CEFI failed"
        next: cefi_wait_loop

    - cefi_wait_loop:
        call: sys.sleep
        args:
          seconds: 30
        next: wait_cefi

    # Run TRADFI
    - run_tradfi:
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
                    - "compute"
                    - "--mode"
                    - "batch"
                    - "--category"
                    - "TRADFI"
                    - "--start-date"
                    - $${t_plus_1_date}
                    - "--end-date"
                    - $${t_plus_1_date}
        result: tradfi_response

    - get_tradfi_execution:
        assign:
          - tradfi_execution_name: $${tradfi_response.body.metadata.name}

    - wait_tradfi:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + tradfi_execution_name}
          auth:
            type: OAuth2
        result: tradfi_status

    - check_tradfi:
        switch:
          - condition: $${"completionTime" in tradfi_status.body}
            next: run_defi
          - condition: $${map.get(tradfi_status.body, "failedCount") != null and map.get(tradfi_status.body, "failedCount") > 0}
            raise: "features-calendar TRADFI failed"
        next: tradfi_wait_loop

    - tradfi_wait_loop:
        call: sys.sleep
        args:
          seconds: 30
        next: wait_tradfi

    # Run DEFI
    - run_defi:
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
                    - "compute"
                    - "--mode"
                    - "batch"
                    - "--category"
                    - "DEFI"
                    - "--start-date"
                    - $${t_plus_1_date}
                    - "--end-date"
                    - $${t_plus_1_date}
        result: defi_response

    - get_defi_execution:
        assign:
          - defi_execution_name: $${defi_response.body.metadata.name}

    - wait_defi:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + defi_execution_name}
          auth:
            type: OAuth2
        result: defi_status

    - check_defi:
        switch:
          - condition: $${"completionTime" in defi_status.body}
            next: return_success
          - condition: $${map.get(defi_status.body, "failedCount") != null and map.get(defi_status.body, "failedCount") > 0}
            raise: "features-calendar DEFI failed"
        next: defi_wait_loop

    - defi_wait_loop:
        call: sys.sleep
        args:
          seconds: 30
        next: wait_defi

    - return_success:
        return:
          status: "completed"
          date: $${t_plus_1_date}
          message: "features-calendar-service completed for all categories"
YAML

  # Backfill workflow
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
          - category: $${default(map.get(args, "category"), "CEFI")}

    # Run backfill for specified category and date range
    - run_backfill:
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
                    - "compute"
                    - "--mode"
                    - "batch"
                    - "--category"
                    - $${category}
                    - "--start-date"
                    - $${start_date}
                    - "--end-date"
                    - $${end_date}
        result: backfill_response

    # Wait for completion
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
          category: $${category}
          execution: $${execution_name}
          message: "features-calendar-service backfill completed"
YAML
}

# Cloud Run Job
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
    { name = "features-calendar", bucket = "features-calendar-${var.project_id}", read_only = false },
  ]

  secret_environment_variables = {}

  service_name = "features-calendar-service"
  environment  = var.environment

  labels = {
    "app"     = "features-calendar-service"
    "version" = "v2"
  }
}

# Daily T+1 Workflow
module "daily_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Daily T+1 workflow for features-calendar-service"
  service_account_email = var.service_account_email

  workflow_source = local.workflow_yaml

  # Schedule after instruments-service (at 8:30 AM UTC)
  schedule                        = var.schedule
  time_zone                       = var.time_zone
  scheduler_service_account_email = var.scheduler_service_account_email

  workflow_args = {
    trigger = "scheduled"
  }

  labels = {
    "app"     = "features-calendar-service"
    "type"    = "daily"
    "version" = "v2"
  }
}

# Backfill Workflow
module "backfill_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.backfill_workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Historical backfill workflow for features-calendar-service"
  service_account_email = var.service_account_email

  workflow_source = local.backfill_workflow_yaml

  schedule  = null
  time_zone = var.time_zone

  labels = {
    "app"     = "features-calendar-service"
    "type"    = "backfill"
    "version" = "v2"
  }
}
