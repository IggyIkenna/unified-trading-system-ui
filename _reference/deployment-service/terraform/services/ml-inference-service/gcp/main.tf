# Terraform configuration for ml-inference-service
# Generates ML predictions using trained models

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

    # Run inference
    - run_inference:
        call: http.post
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/projects/" + project_id + "/locations/" + region + "/jobs/" + job_name + ":run"}
          auth:
            type: OAuth2
          body:
            overrides:
              containerOverrides:
                - args:
                    - "--mode"
                    - "batch"
                    - "--instrument-ids"
                    - "BTC-USDT-PERPETUAL,ETH-USDT-PERPETUAL,SOL-USDT-PERPETUAL,SPY"
                    - "--timeframes"
                    - "1h,4h"
                    - "--target-types"
                    - "direction"
                    - "--start-date"
                    - $${t_plus_1_date}
                    - "--end-date"
                    - $${t_plus_1_date}
        result: inference_response

    - get_execution:
        assign:
          - execution_name: $${inference_response.body.metadata.name}

    - wait_inference:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: inference_status

    - check_inference:
        switch:
          - condition: $${"completionTime" in inference_status.body}
            next: return_success
          - condition: $${map.get(inference_status.body, "failedCount") != null and map.get(inference_status.body, "failedCount") > 0}
            raise: "ml-inference failed"
        next: inference_wait_loop

    - inference_wait_loop:
        call: sys.sleep
        args:
          seconds: 60
        next: wait_inference

    - return_success:
        return:
          status: "completed"
          date: $${t_plus_1_date}
          execution: $${execution_name}
          message: "ml-inference-service completed"
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
          - instruments: $${default(map.get(args, "instruments"), ["BTC-USDT-PERPETUAL", "ETH-USDT-PERPETUAL", "SPY"])}
          - timeframes: $${default(map.get(args, "timeframes"), ["1h", "4h"])}
          - target_types: $${default(map.get(args, "target_types"), ["direction"])}

    - build_args:
        assign:
          - instruments_str: $${text.join(instruments, ",")}
          - timeframes_str: $${text.join(timeframes, ",")}
          - targets_str: $${text.join(target_types, ",")}
          - base_args: ["--operation", "infer", "--mode", "batch", "--start-date", $${start_date}, "--end-date", $${end_date}, "--instrument-ids", $${instruments_str}, "--timeframes", $${timeframes_str}, "--target-types", $${targets_str}]

    - run_inference:
        call: http.post
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/projects/" + project_id + "/locations/" + region + "/jobs/" + job_name + ":run"}
          auth:
            type: OAuth2
          body:
            overrides:
              containerOverrides:
                - args: $${base_args}
        result: inference_response

    - get_execution:
        assign:
          - execution_name: $${inference_response.body.metadata.name}

    - wait_inference:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: inference_status

    - check_inference:
        switch:
          - condition: $${"completionTime" in inference_status.body}
            next: return_success
          - condition: $${map.get(inference_status.body, "failedCount") != null and map.get(inference_status.body, "failedCount") > 0}
            raise: "inference failed"
        next: inference_wait_loop

    - inference_wait_loop:
        call: sys.sleep
        args:
          seconds: 60
        next: wait_inference

    - return_success:
        return:
          status: "completed"
          start_date: $${start_date}
          end_date: $${end_date}
          instruments: $${instruments}
          execution: $${execution_name}
          message: "ml-inference-service backfill completed"
YAML
}

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
    ML_MODELS_BUCKET       = var.ml_models_bucket
    ML_PREDICTIONS_BUCKET  = var.ml_predictions_bucket
    GCS_FUSE_MOUNT_PATH    = "/mnt/gcs"
    UCS_SKIP_GCSFUSE_CHECK = "1"
    PYTHONUNBUFFERED       = "1"
  }

  gcs_volumes = [
    { name = "ml-models-store", bucket = var.ml_models_bucket, read_only = true },
    { name = "features-delta-one-cefi", bucket = "features-delta-one-cefi-${var.project_id}", read_only = true },
    { name = "features-delta-one-defi", bucket = "features-delta-one-defi-${var.project_id}", read_only = true },
    { name = "features-delta-one-tradfi", bucket = "features-delta-one-tradfi-${var.project_id}", read_only = true },
    { name = "ml-predictions-store", bucket = var.ml_predictions_bucket, read_only = false },
  ]

  secret_environment_variables = {}

  service_name = "ml-inference-service"
  environment  = var.environment

  labels = {
    "app"     = "ml-inference-service"
    "version" = "v2"
  }
}

module "daily_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Daily T+1 workflow for ml-inference-service"
  service_account_email = var.service_account_email

  workflow_source = local.workflow_yaml

  # Schedule at 14:00 PM UTC (after training)
  schedule                        = var.schedule
  time_zone                       = var.time_zone
  scheduler_service_account_email = var.scheduler_service_account_email

  workflow_args = {
    trigger = "scheduled"
  }

  labels = {
    "app"     = "ml-inference-service"
    "type"    = "daily"
    "version" = "v2"
  }
}

module "backfill_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.backfill_workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Batch inference workflow for ml-inference-service"
  service_account_email = var.service_account_email

  workflow_source = local.backfill_workflow_yaml

  schedule  = null
  time_zone = var.time_zone

  labels = {
    "app"     = "ml-inference-service"
    "type"    = "backfill"
    "version" = "v2"
  }
}
