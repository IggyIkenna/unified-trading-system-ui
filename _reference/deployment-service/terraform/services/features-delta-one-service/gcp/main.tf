# Terraform configuration for features-delta-one-service
# Generates delta-one features (technical indicators, momentum, etc.)
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
  # All feature groups to process
  feature_groups = [
    "technical_indicators",
    "moving_averages",
    "price_momentum",
    "volume_profile",
    "funding_oi",
    "liquidation_intensity",
    "premium_basis",
    "orderbook_imbalance",
    "volatility_regime",
    "correlation_features",
    "regime_labels",
    "rolling_returns",
    "price_levels",
    "swing_outcome_targets",
    "target_labels",
    "time_features",
    "vwap_features"
  ]

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

    # Run feature generation for all categories
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
                    - "--mode"
                    - "batch"
                    - "--category"
                    - "CEFI"
                    - "--category"
                    - "TRADFI"
                    - "--category"
                    - "DEFI"
                    - "--feature-group"
                    - "all"
                    - "--start-date"
                    - $${t_plus_1_date}
                    - "--end-date"
                    - $${t_plus_1_date}
        result: features_response

    # Wait for completion
    - get_execution:
        assign:
          - execution_name: $${features_response.body.metadata.name}

    - wait_features:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: features_status

    - check_features:
        switch:
          - condition: $${"completionTime" in features_status.body}
            next: return_success
          - condition: $${map.get(features_status.body, "failedCount") != null and map.get(features_status.body, "failedCount") > 0}
            raise: "features-delta-one failed"
        next: features_wait_loop

    - features_wait_loop:
        call: sys.sleep
        args:
          seconds: 60
        next: wait_features

    - return_success:
        return:
          status: "completed"
          date: $${t_plus_1_date}
          execution: $${execution_name}
          message: "features-delta-one-service completed"
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
          - feature_groups: $${default(map.get(args, "feature_groups"), ["all"])}

    # Build args list
    - build_args:
        assign:
          - base_args: ["--operation", "compute", "--mode", "batch", "--start-date", $${start_date}, "--end-date", $${end_date}]

    - add_categories:
        for:
          value: cat
          in: $${categories}
          steps:
            - append_cat:
                assign:
                  - base_args: $${list.concat(base_args, ["--category", cat])}

    - add_feature_groups:
        for:
          value: fg
          in: $${feature_groups}
          steps:
            - append_fg:
                assign:
                  - base_args: $${list.concat(base_args, ["--feature-group", fg])}

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
          feature_groups: $${feature_groups}
          execution: $${execution_name}
          message: "features-delta-one-service backfill completed"
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
    { name = "market-data-tick-cefi", bucket = "market-data-tick-cefi-${var.project_id}", read_only = true },
    { name = "market-data-tick-defi", bucket = "market-data-tick-defi-${var.project_id}", read_only = true },
    { name = "market-data-tick-tradfi", bucket = "market-data-tick-tradfi-${var.project_id}", read_only = true },
    { name = "features-calendar", bucket = "features-calendar-${var.project_id}", read_only = true },
    { name = "features-delta-one-cefi", bucket = "features-delta-one-cefi-${var.project_id}", read_only = false },
    { name = "features-delta-one-defi", bucket = "features-delta-one-defi-${var.project_id}", read_only = false },
    { name = "features-delta-one-tradfi", bucket = "features-delta-one-tradfi-${var.project_id}", read_only = false },
  ]

  secret_environment_variables = {}

  service_name = "features-delta-one-service"
  environment  = var.environment

  labels = {
    "app"     = "features-delta-one-service"
    "version" = "v2"
  }
}

# Daily T+1 Workflow
module "daily_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Daily T+1 workflow for features-delta-one-service"
  service_account_email = var.service_account_email

  workflow_source = local.workflow_yaml

  # Schedule after market-data-processing (at 11:00 AM UTC)
  schedule                        = var.schedule
  time_zone                       = var.time_zone
  scheduler_service_account_email = var.scheduler_service_account_email

  workflow_args = {
    trigger = "scheduled"
  }

  labels = {
    "app"     = "features-delta-one-service"
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
  description           = "Historical backfill workflow for features-delta-one-service"
  service_account_email = var.service_account_email

  workflow_source = local.backfill_workflow_yaml

  schedule  = null
  time_zone = var.time_zone

  labels = {
    "app"     = "features-delta-one-service"
    "type"    = "backfill"
    "version" = "v2"
  }
}
