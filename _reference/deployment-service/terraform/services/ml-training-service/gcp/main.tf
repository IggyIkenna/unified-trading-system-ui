# Terraform configuration for ml-training-service
# Trains ML models for price prediction
# Heavy compute workload - uses e2-standard-8

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
  # Daily T+1 workflow for incremental training
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

    # Run incremental training
    - run_training:
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
                    - "train"
                    - "--stage"
                    - "incremental"
                    - "--instruments"
                    - "BTC,ETH,SOL,SPY"
                    - "--timeframes"
                    - "1h,4h"
                    - "--start-date"
                    - $${t_plus_1_date}
                    - "--end-date"
                    - $${t_plus_1_date}
        result: training_response

    - get_execution:
        assign:
          - execution_name: $${training_response.body.metadata.name}

    - wait_training:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: training_status

    - check_training:
        switch:
          - condition: $${"completionTime" in training_status.body}
            next: return_success
          - condition: $${map.get(training_status.body, "failedCount") != null and map.get(training_status.body, "failedCount") > 0}
            raise: "ml-training failed"
        next: training_wait_loop

    - training_wait_loop:
        call: sys.sleep
        args:
          seconds: 120
        next: wait_training

    - return_success:
        return:
          status: "completed"
          date: $${t_plus_1_date}
          execution: $${execution_name}
          message: "ml-training-service incremental completed"
YAML

  # Full training backfill workflow
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
          - instruments: $${default(map.get(args, "instruments"), ["BTC", "ETH", "SOL", "SPY"])}
          - timeframes: $${default(map.get(args, "timeframes"), ["1h", "4h"])}
          - target_types: $${default(map.get(args, "target_types"), ["swing_high", "swing_low"])}

    - build_args:
        assign:
          - base_args: ["--operation", "train_phase1", "--mode", "batch", "--stage", "full", "--start-date", $${start_date}, "--end-date", $${end_date}]
          - instruments_str: $${text.join(instruments, ",")}
          - timeframes_str: $${text.join(timeframes, ",")}
          - targets_str: $${text.join(target_types, ",")}

    - add_params:
        assign:
          - base_args: $${list.concat(base_args, ["--instruments", instruments_str, "--timeframes", timeframes_str, "--target-types", targets_str])}

    - run_training:
        call: http.post
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/projects/" + project_id + "/locations/" + region + "/jobs/" + job_name + ":run"}
          auth:
            type: OAuth2
          body:
            overrides:
              containerOverrides:
                - args: $${base_args}
        result: training_response

    - get_execution:
        assign:
          - execution_name: $${training_response.body.metadata.name}

    - wait_training:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: training_status

    - check_training:
        switch:
          - condition: $${"completionTime" in training_status.body}
            next: return_success
          - condition: $${map.get(training_status.body, "failedCount") != null and map.get(training_status.body, "failedCount") > 0}
            raise: "training failed"
        next: training_wait_loop

    - training_wait_loop:
        call: sys.sleep
        args:
          seconds: 300
        next: wait_training

    - return_success:
        return:
          status: "completed"
          start_date: $${start_date}
          end_date: $${end_date}
          instruments: $${instruments}
          timeframes: $${timeframes}
          execution: $${execution_name}
          message: "ml-training-service full training completed"
YAML
}

module "daily_job" {
  source = "../../../modules/container-job/gcp"

  name       = var.job_name
  project_id = var.project_id
  region     = var.region

  image                 = var.docker_image
  service_account_email = var.service_account_email

  # Heavy ML workload - needs more resources
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
    ML_CONFIGS_BUCKET      = var.ml_configs_bucket
    GCS_FUSE_MOUNT_PATH    = "/mnt/gcs"
    UCS_SKIP_GCSFUSE_CHECK = "1"
    PYTHONUNBUFFERED       = "1"
  }

  gcs_volumes = [
    { name = "features-delta-one-cefi", bucket = "features-delta-one-cefi-${var.project_id}", read_only = true },
    { name = "features-delta-one-defi", bucket = "features-delta-one-defi-${var.project_id}", read_only = true },
    { name = "features-delta-one-tradfi", bucket = "features-delta-one-tradfi-${var.project_id}", read_only = true },
    { name = "features-volatility-cefi", bucket = "features-volatility-cefi-${var.project_id}", read_only = true },
    { name = "features-volatility-tradfi", bucket = "features-volatility-tradfi-${var.project_id}", read_only = true },
    { name = "features-onchain", bucket = "features-onchain-${var.project_id}", read_only = true },
    { name = "ml-training-artifacts", bucket = "ml-training-artifacts-${var.project_id}", read_only = false },
    { name = "ml-models-store", bucket = var.ml_models_bucket, read_only = false },
    { name = "ml-configs-store", bucket = var.ml_configs_bucket, read_only = true },
  ]

  secret_environment_variables = {}

  service_name = "ml-training-service"
  environment  = var.environment

  labels = {
    "app"     = "ml-training-service"
    "version" = "v2"
  }
}

module "daily_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Daily T+1 incremental training workflow for ml-training-service"
  service_account_email = var.service_account_email

  workflow_source = local.workflow_yaml

  # Schedule at 12:00 PM UTC (after all features)
  schedule                        = var.schedule
  time_zone                       = var.time_zone
  scheduler_service_account_email = var.scheduler_service_account_email

  workflow_args = {
    trigger = "scheduled"
  }

  labels = {
    "app"     = "ml-training-service"
    "type"    = "daily"
    "version" = "v2"
  }
}

module "backfill_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.backfill_workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Full training workflow for ml-training-service"
  service_account_email = var.service_account_email

  workflow_source = local.backfill_workflow_yaml

  schedule  = null
  time_zone = var.time_zone

  labels = {
    "app"     = "ml-training-service"
    "type"    = "backfill"
    "version" = "v2"
  }
}
