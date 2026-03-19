# Terraform configuration for strategy-service
# Tests trading signals via strategy backtesting

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

    # Run strategy backtest for all categories
    - run_strategy:
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
                    - "--category"
                    - "CEFI"
                    - "--category"
                    - "TRADFI"
                    - "--category"
                    - "DEFI"
                    - "--start-date"
                    - $${t_plus_1_date}
                    - "--end-date"
                    - $${t_plus_1_date}
        result: strategy_response

    - get_execution:
        assign:
          - execution_name: $${strategy_response.body.metadata.name}

    - wait_strategy:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: strategy_status

    - check_strategy:
        switch:
          - condition: $${"completionTime" in strategy_status.body}
            next: return_success
          - condition: $${map.get(strategy_status.body, "failedCount") != null and map.get(strategy_status.body, "failedCount") > 0}
            raise: "strategy-service failed"
        next: strategy_wait_loop

    - strategy_wait_loop:
        call: sys.sleep
        args:
          seconds: 60
        next: wait_strategy

    - return_success:
        return:
          status: "completed"
          date: $${t_plus_1_date}
          execution: $${execution_name}
          message: "strategy-service completed"
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
          - categories: $${default(map.get(args, "categories"), ["CEFI", "TRADFI", "DEFI"])}
          - config_gcs: $${default(map.get(args, "config_gcs"), "")}

    - build_args:
        assign:
          - base_args: ["--operation", "backtest", "--mode", "batch", "--start-date", $${start_date}, "--end-date", $${end_date}]

    - add_categories:
        for:
          value: cat
          in: $${categories}
          steps:
            - append_cat:
                assign:
                  - base_args: $${list.concat(base_args, ["--category", cat])}

    - add_config:
        switch:
          - condition: $${config_gcs != ""}
            assign:
              - base_args: $${list.concat(base_args, ["--config-gcs", config_gcs])}

    - run_strategy:
        call: http.post
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/projects/" + project_id + "/locations/" + region + "/jobs/" + job_name + ":run"}
          auth:
            type: OAuth2
          body:
            overrides:
              containerOverrides:
                - args: $${base_args}
        result: strategy_response

    - get_execution:
        assign:
          - execution_name: $${strategy_response.body.metadata.name}

    - wait_strategy:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: strategy_status

    - check_strategy:
        switch:
          - condition: $${"completionTime" in strategy_status.body}
            next: return_success
          - condition: $${map.get(strategy_status.body, "failedCount") != null and map.get(strategy_status.body, "failedCount") > 0}
            raise: "strategy failed"
        next: strategy_wait_loop

    - strategy_wait_loop:
        call: sys.sleep
        args:
          seconds: 60
        next: wait_strategy

    - return_success:
        return:
          status: "completed"
          start_date: $${start_date}
          end_date: $${end_date}
          categories: $${categories}
          execution: $${execution_name}
          message: "strategy-service backfill completed"
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
    STRATEGY_BUCKET_CEFI   = var.strategy_bucket_cefi
    STRATEGY_BUCKET_TRADFI = var.strategy_bucket_tradfi
    STRATEGY_BUCKET_DEFI   = var.strategy_bucket_defi
    GCS_FUSE_MOUNT_PATH    = "/mnt/gcs"
    UCS_SKIP_GCSFUSE_CHECK = "1"
    PYTHONUNBUFFERED       = "1"
  }

  gcs_volumes = [
    { name = "ml-predictions-store", bucket = "ml-predictions-store-${var.project_id}", read_only = true },
    { name = "features-delta-one-cefi", bucket = "features-delta-one-cefi-${var.project_id}", read_only = true },
    { name = "features-delta-one-defi", bucket = "features-delta-one-defi-${var.project_id}", read_only = true },
    { name = "features-delta-one-tradfi", bucket = "features-delta-one-tradfi-${var.project_id}", read_only = true },
    { name = "instruments-store-cefi", bucket = "instruments-store-cefi-${var.project_id}", read_only = true },
    { name = "instruments-store-defi", bucket = "instruments-store-defi-${var.project_id}", read_only = true },
    { name = "instruments-store-tradfi", bucket = "instruments-store-tradfi-${var.project_id}", read_only = true },
    { name = "strategy-store-cefi", bucket = var.strategy_bucket_cefi, read_only = false },
    { name = "strategy-store-tradfi", bucket = var.strategy_bucket_tradfi, read_only = false },
    { name = "strategy-store-defi", bucket = var.strategy_bucket_defi, read_only = false },
  ]

  secret_environment_variables = {}

  service_name = "strategy-service"
  environment  = var.environment

  labels = {
    "app"     = "strategy-service"
    "version" = "v2"
  }
}

module "daily_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Daily T+1 workflow for strategy-service"
  service_account_email = var.service_account_email

  workflow_source = local.workflow_yaml

  # Schedule at 15:00 PM UTC (after inference)
  schedule                        = var.schedule
  time_zone                       = var.time_zone
  scheduler_service_account_email = var.scheduler_service_account_email

  workflow_args = {
    trigger = "scheduled"
  }

  labels = {
    "app"     = "strategy-service"
    "type"    = "daily"
    "version" = "v2"
  }
}

module "backfill_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.backfill_workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Historical backtest workflow for strategy-service"
  service_account_email = var.service_account_email

  workflow_source = local.backfill_workflow_yaml

  schedule  = null
  time_zone = var.time_zone

  labels = {
    "app"     = "strategy-service"
    "type"    = "backfill"
    "version" = "v2"
  }
}
