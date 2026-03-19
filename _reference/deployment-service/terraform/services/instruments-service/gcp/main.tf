# Terraform configuration for instruments-service
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
  # Daily workflow: instruments mode + corporate_actions mode (per spec execution order)
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
    # STEP 1: Run instruments mode (all categories)
    # ========================================
    - run_instruments:
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
                    - "instrument"
                    - "--mode"
                    - "batch"
                    - "--CEFI"
                    - "--TRADFI"
                    - "--DEFI"
                    - "--start-date"
                    - $${t_plus_1_date}
        result: instruments_response

    # Wait for instruments to complete
    - get_instruments_execution:
        assign:
          - instruments_execution: $${instruments_response.body.metadata.name}

    - wait_instruments:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + instruments_execution}
          auth:
            type: OAuth2
        result: instruments_status

    - check_instruments:
        switch:
          - condition: $${"completionTime" in instruments_status.body}
            next: run_corporate_actions
          - condition: $${map.get(instruments_status.body, "failedCount") != null and map.get(instruments_status.body, "failedCount") > 0}
            raise: "instruments mode failed"
        next: instruments_wait_loop

    - instruments_wait_loop:
        call: sys.sleep
        args:
          seconds: 30
        next: wait_instruments

    # ========================================
    # STEP 2: Run corporate_actions (TradFi only - dividends/splits/earnings)
    # Per codex cli-standards: --operation corporate_actions --mode batch
    # ========================================
    - run_corporate_actions:
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
                    - "corporate_actions"
                    - "--mode"
                    - "batch"
                    - "--upload-to-gcs"
        result: corporate_actions_response

    # Wait for corporate_actions to complete
    - get_corporate_actions_execution:
        assign:
          - corporate_actions_execution: $${corporate_actions_response.body.metadata.name}

    - wait_corporate_actions:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + corporate_actions_execution}
          auth:
            type: OAuth2
        result: corporate_actions_status

    - check_corporate_actions:
        switch:
          - condition: $${"completionTime" in corporate_actions_status.body}
            next: return_success
          - condition: $${map.get(corporate_actions_status.body, "failedCount") != null and map.get(corporate_actions_status.body, "failedCount") > 0}
            raise: "corporate_actions mode failed"
        next: corporate_actions_wait_loop

    - corporate_actions_wait_loop:
        call: sys.sleep
        args:
          seconds: 30
        next: wait_corporate_actions

    - return_success:
        return:
          status: "completed"
          date: $${t_plus_1_date}
          instruments_execution: $${instruments_execution}
          corporate_actions_execution: $${corporate_actions_execution}
          message: "instruments-service completed (instruments + corporate_actions)"
YAML

  # Backfill workflow: instruments mode + corporate_actions for date range
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
          - force: $${default(map.get(args, "force"), false)}
          - include_corporate_actions: $${default(map.get(args, "include_corporate_actions"), true)}

    # Build args list dynamically based on categories and force flag
    - build_args:
        assign:
          - base_args: ["--operation", "instrument", "--mode", "batch", "--start-date", $${start_date}, "--end-date", $${end_date}]

    - add_force_flag:
        switch:
          - condition: $${force}
            assign:
              - base_args: $${list.concat(base_args, ["--force"])}

    - add_category_flags:
        for:
          value: cat
          in: $${categories}
          steps:
            - append_cat:
                assign:
                  - base_args: $${list.concat(base_args, ["--" + cat])}

    # ========================================
    # STEP 1: Run instruments mode for all categories
    # ========================================
    - run_instruments:
        call: http.post
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/projects/" + project_id + "/locations/" + region + "/jobs/" + job_name + ":run"}
          auth:
            type: OAuth2
          body:
            overrides:
              containerOverrides:
                - args: $${base_args}
        result: instruments_response

    # Wait for instruments to complete
    - get_instruments_execution:
        assign:
          - instruments_execution: $${instruments_response.body.metadata.name}

    - wait_instruments:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + instruments_execution}
          auth:
            type: OAuth2
        result: instruments_status

    - check_instruments:
        switch:
          - condition: $${"completionTime" in instruments_status.body}
            next: check_corporate_actions_needed
          - condition: $${map.get(instruments_status.body, "failedCount") != null and map.get(instruments_status.body, "failedCount") > 0}
            raise: "instruments mode failed"
        next: instruments_wait_loop

    - instruments_wait_loop:
        call: sys.sleep
        args:
          seconds: 30
        next: wait_instruments

    # ========================================
    # STEP 2: Run corporate_actions if requested
    # ========================================
    - check_corporate_actions_needed:
        switch:
          - condition: $${include_corporate_actions}
            next: run_corporate_actions
        next: return_success

    - run_corporate_actions:
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
                    - "corporate_actions"
                    - "--mode"
                    - "batch"
                    - "--start-date"
                    - $${start_date}
                    - "--end-date"
                    - $${end_date}
                    - "--upload-to-gcs"
        result: corporate_actions_response

    # Wait for corporate_actions to complete
    - get_corporate_actions_execution:
        assign:
          - corporate_actions_execution: $${corporate_actions_response.body.metadata.name}

    - wait_corporate_actions:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + corporate_actions_execution}
          auth:
            type: OAuth2
        result: corporate_actions_status

    - check_corporate_actions_status:
        switch:
          - condition: $${"completionTime" in corporate_actions_status.body}
            next: return_success_with_corporate_actions
          - condition: $${map.get(corporate_actions_status.body, "failedCount") != null and map.get(corporate_actions_status.body, "failedCount") > 0}
            raise: "corporate_actions mode failed"
        next: corporate_actions_wait_loop

    - corporate_actions_wait_loop:
        call: sys.sleep
        args:
          seconds: 30
        next: wait_corporate_actions

    - return_success_with_corporate_actions:
        return:
          status: "completed"
          start_date: $${start_date}
          end_date: $${end_date}
          categories: $${categories}
          instruments_execution: $${instruments_execution}
          corporate_actions_execution: $${corporate_actions_execution}
          message: "instruments-service backfill completed (instruments + corporate_actions)"

    - return_success:
        return:
          status: "completed"
          start_date: $${start_date}
          end_date: $${end_date}
          categories: $${categories}
          instruments_execution: $${instruments_execution}
          message: "instruments-service backfill completed (instruments only)"
YAML

  # Live workflow: single-cycle run every 15 min (Cloud Run scheduled - avoids wasting compute)
  live_workflow_yaml = <<-YAML
main:
  params: [args]
  steps:
    - init:
        assign:
          - project_id: "${var.project_id}"
          - region: "${var.region}"
          - job_name: "${var.job_name}"

    # Run live mode single cycle (CEFI + TRADFI + DEFI)
    - run_live:
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
                    - "instrument"
                    - "--mode"
                    - "live"
                    - "--single-cycle"
                    - "--CEFI"
                    - "--TRADFI"
                    - "--DEFI"
        result: live_response

    - get_live_execution:
        assign:
          - live_execution: $${live_response.body.metadata.name}

    - wait_live:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + live_execution}
          auth:
            type: OAuth2
        result: live_status

    - check_live:
        switch:
          - condition: $${"completionTime" in live_status.body}
            next: return_success
          - condition: $${map.get(live_status.body, "failedCount") != null and map.get(live_status.body, "failedCount") > 0}
            raise: "live mode failed"
        next: live_wait_loop

    - live_wait_loop:
        call: sys.sleep
        args:
          seconds: 30
        next: wait_live

    - return_success:
        return:
          status: "completed"
          live_execution: $${live_execution}
          message: "instruments-service live mode completed (single cycle)"
YAML
}

# Cloud Run Job for instruments-service
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
    ENVIRONMENT                 = var.environment
    GCP_PROJECT_ID              = var.project_id
    GCS_REGION                  = var.region
    GCS_LOCATION                = var.gcs_location
    INSTRUMENTS_GCS_BUCKET_CEFI  = var.gcs_bucket_cefi
    INSTRUMENTS_GCS_BUCKET_TRADFI = var.gcs_bucket_tradfi
    INSTRUMENTS_GCS_BUCKET_DEFI = var.gcs_bucket_defi
    GCS_FUSE_MOUNT_PATH         = "/mnt/gcs"
    UCS_SKIP_GCSFUSE_CHECK      = "1"
    PYTHONUNBUFFERED            = "1"  # Enable real-time logging
  }

  gcs_volumes = [
    { name = "instruments-store-cefi", bucket = var.gcs_bucket_cefi, read_only = false },
    { name = "instruments-store-defi", bucket = var.gcs_bucket_defi, read_only = false },
    { name = "instruments-store-tradfi", bucket = var.gcs_bucket_tradfi, read_only = false },
  ]

  secret_environment_variables = {
    TARDIS_API_KEY = {
      secret_name = "tardis-api-key"
      version     = "latest"
    }
    DATABENTO_API_KEY = {
      secret_name = "databento-api-key"
      version     = "latest"
    }
    ALCHEMY_API_KEY = {
      secret_name = "alchemy-api-key"
      version     = "latest"
    }
    GRAPH_API_KEY = {
      secret_name = "graph-api-key"
      version     = "latest"
    }
  }

  service_name = "instruments-service"
  environment  = var.environment

  labels = {
    "app"     = "instruments-service"
    "version" = "v2"
  }
}

# Workflow for daily T+1 (computes yesterday's date and triggers job)
module "daily_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Daily T+1 workflow for instruments-service"
  service_account_email = var.service_account_email

  workflow_source = local.workflow_yaml

  # Schedule at 8:30 AM UTC daily
  schedule                        = var.schedule
  time_zone                       = var.time_zone
  scheduler_service_account_email = var.scheduler_service_account_email

  workflow_args = {
    trigger = "scheduled"
  }

  labels = {
    "app"     = "instruments-service"
    "type"    = "daily"
    "version" = "v2"
  }
}

# Backfill Workflow (manual trigger for historical data)
module "backfill_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.backfill_workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Historical backfill workflow for instruments-service (instruments + corporate_actions)"
  service_account_email = var.service_account_email

  workflow_source = local.backfill_workflow_yaml

  # No schedule - manual trigger only
  schedule  = null
  time_zone = var.time_zone

  labels = {
    "app"     = "instruments-service"
    "type"    = "backfill"
    "version" = "v2"
  }
}

# Live Workflow (every 15 min - Cloud Run single-cycle, avoids wasting compute)
module "live_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.live_workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Live mode workflow for instruments-service (single cycle every 15 min)"
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
    "app"     = "instruments-service"
    "type"    = "live"
    "version" = "v2"
  }
}
