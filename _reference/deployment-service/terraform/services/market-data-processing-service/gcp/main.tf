# Terraform configuration for market-data-processing-service
# Processes raw tick data into OHLCV candles at multiple timeframes
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

# Configure the Google Cloud provider
provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  # Daily T+1 workflow: process yesterday's tick data into candles
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

    # ========================================
    # Run processing for all categories and timeframes
    # ========================================
    - run_processing:
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
                    - "process"
                    - "--mode"
                    - "batch"
                    - "--CEFI"
                    - "--TRADFI"
                    - "--DEFI"
                    - "--date"
                    - $${t_plus_1_date}
                    - "--timeframes"
                    - "15s,1m,5m,15m,1h,4h,24h"
        result: processing_response

    # Wait for processing to complete
    - get_execution:
        assign:
          - execution_name: $${processing_response.body.metadata.name}

    - wait_processing:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: processing_status

    - check_processing:
        switch:
          - condition: $${"completionTime" in processing_status.body}
            next: return_success
          - condition: $${map.get(processing_status.body, "failedCount") != null and map.get(processing_status.body, "failedCount") > 0}
            raise: "market-data-processing failed"
        next: processing_wait_loop

    - processing_wait_loop:
        call: sys.sleep
        args:
          seconds: 60
        next: wait_processing

    - return_success:
        return:
          status: "completed"
          date: $${t_plus_1_date}
          execution: $${execution_name}
          message: "market-data-processing-service completed"
YAML

  # Backfill workflow for historical data
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
          - timeframes: $${default(map.get(args, "timeframes"), ["15s", "1m", "5m", "15m", "1h", "4h", "24h"])}

    # Build args list dynamically
    - build_args:
        assign:
          - base_args: ["--operation", "process", "--mode", "batch", "--start-date", $${start_date}, "--end-date", $${end_date}]
          - timeframe_str: $${text.join(timeframes, ",")}

    - add_category_flags:
        for:
          value: cat
          in: $${categories}
          steps:
            - append_cat:
                assign:
                  - base_args: $${list.concat(base_args, ["--" + cat])}

    - add_timeframes:
        assign:
          - base_args: $${list.concat(base_args, ["--timeframes", timeframe_str])}

    # Run backfill
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
          categories: $${categories}
          timeframes: $${timeframes}
          execution: $${execution_name}
          message: "market-data-processing-service backfill completed"
YAML
}

# Cloud Run Job for market-data-processing-service
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
    { name = "instruments-store-cefi", bucket = "instruments-store-cefi-${var.project_id}", read_only = true },
    { name = "instruments-store-defi", bucket = "instruments-store-defi-${var.project_id}", read_only = true },
    { name = "instruments-store-tradfi", bucket = "instruments-store-tradfi-${var.project_id}", read_only = true },
    { name = "market-data-tick-cefi", bucket = "market-data-tick-cefi-${var.project_id}", read_only = false },
    { name = "market-data-tick-defi", bucket = "market-data-tick-defi-${var.project_id}", read_only = false },
    { name = "market-data-tick-tradfi", bucket = "market-data-tick-tradfi-${var.project_id}", read_only = false },
  ]

  # No external API secrets needed - reads from tick data buckets
  secret_environment_variables = {}

  service_name = "market-data-processing-service"
  environment  = var.environment

  labels = {
    "app"     = "market-data-processing-service"
    "version" = "v2"
  }
}

# Workflow for daily T+1
module "daily_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Daily T+1 workflow for market-data-processing-service"
  service_account_email = var.service_account_email

  workflow_source = local.workflow_yaml

  # Schedule after market-tick-data-service (at 10:00 AM UTC)
  schedule                        = var.schedule
  time_zone                       = var.time_zone
  scheduler_service_account_email = var.scheduler_service_account_email

  workflow_args = {
    trigger = "scheduled"
  }

  labels = {
    "app"     = "market-data-processing-service"
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
  description           = "Historical backfill workflow for market-data-processing-service"
  service_account_email = var.service_account_email

  workflow_source = local.backfill_workflow_yaml

  # No schedule - manual trigger only
  schedule  = null
  time_zone = var.time_zone

  labels = {
    "app"     = "market-data-processing-service"
    "type"    = "backfill"
    "version" = "v2"
  }
}
