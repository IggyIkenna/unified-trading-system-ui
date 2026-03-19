# Terraform configuration for execution-services
# Backtest execution on tick-level data
# Heavy compute workload - tick-by-tick simulation

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

    # Run execution backtest
    - run_execution:
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
                    - "execute"
                    - "--mode"
                    - "live"
                    - "--domain"
                    - "cefi"
                    - "--start"
                    - $${t_plus_1_date + "T00:00:00Z"}
                    - "--end"
                    - $${t_plus_1_date + "T23:59:59Z"}
        result: execution_response

    - get_execution:
        assign:
          - execution_name: $${execution_response.body.metadata.name}

    - wait_execution:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: execution_status

    - check_execution:
        switch:
          - condition: $${"completionTime" in execution_status.body}
            next: return_success
          - condition: $${map.get(execution_status.body, "failedCount") != null and map.get(execution_status.body, "failedCount") > 0}
            raise: "execution-services failed"
        next: execution_wait_loop

    - execution_wait_loop:
        call: sys.sleep
        args:
          seconds: 120
        next: wait_execution

    - return_success:
        return:
          status: "completed"
          date: $${t_plus_1_date}
          execution: $${execution_name}
          message: "execution-services completed"
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
          - domain: $${default(map.get(args, "domain"), "cefi")}
          - config_gcs: $${default(map.get(args, "config_gcs"), "")}

    - build_args:
        assign:
          - base_args: ["backtest", "--domain", $${domain}, "--start", $${start_date + "T00:00:00Z"}, "--end", $${end_date + "T23:59:59Z"}]

    - add_config:
        switch:
          - condition: $${config_gcs != ""}
            assign:
              - base_args: $${list.concat(base_args, ["--config", config_gcs])}

    - run_execution:
        call: http.post
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/projects/" + project_id + "/locations/" + region + "/jobs/" + job_name + ":run"}
          auth:
            type: OAuth2
          body:
            overrides:
              containerOverrides:
                - args: $${base_args}
        result: execution_response

    - get_execution:
        assign:
          - execution_name: $${execution_response.body.metadata.name}

    - wait_execution:
        call: http.get
        args:
          url: $${"https://" + region + "-run.googleapis.com/v2/" + execution_name}
          auth:
            type: OAuth2
        result: execution_status

    - check_execution:
        switch:
          - condition: $${"completionTime" in execution_status.body}
            next: return_success
          - condition: $${map.get(execution_status.body, "failedCount") != null and map.get(execution_status.body, "failedCount") > 0}
            raise: "execution failed"
        next: execution_wait_loop

    - execution_wait_loop:
        call: sys.sleep
        args:
          seconds: 120
        next: wait_execution

    - return_success:
        return:
          status: "completed"
          start_date: $${start_date}
          end_date: $${end_date}
          domain: $${domain}
          execution: $${execution_name}
          message: "execution-services backfill completed"
YAML
}

module "daily_job" {
  source = "../../../modules/container-job/gcp"

  name       = var.job_name
  project_id = var.project_id
  region     = var.region

  image                 = var.docker_image
  service_account_email = var.service_account_email

  # Heavy workload - tick-by-tick simulation
  cpu             = var.cpu
  memory          = var.memory
  timeout_seconds = var.timeout_seconds
  max_retries     = var.max_retries

  environment_variables = {
    ENVIRONMENT               = var.environment
    GCP_PROJECT_ID            = var.project_id
    GCS_REGION                = var.region
    GCS_LOCATION              = var.gcs_location
    EXECUTION_BUCKET_CEFI     = var.execution_bucket_cefi
    EXECUTION_BUCKET_TRADFI   = var.execution_bucket_tradfi
    EXECUTION_BUCKET_DEFI     = var.execution_bucket_defi
    GCS_FUSE_MOUNT_PATH       = "/mnt/gcs"
    UCS_SKIP_GCSFUSE_CHECK    = "1"
    PYTHONUNBUFFERED          = "1"
  }

  gcs_volumes = [
    { name = "execution-store-cefi", bucket = var.execution_bucket_cefi, read_only = false },
    { name = "execution-store-tradfi", bucket = var.execution_bucket_tradfi, read_only = false },
    { name = "execution-store-defi", bucket = var.execution_bucket_defi, read_only = false },
    { name = "strategy-store", bucket = "strategy-store-${var.project_id}", read_only = true },
    { name = "instruments-store-cefi", bucket = "instruments-store-cefi-${var.project_id}", read_only = true },
    { name = "instruments-store-tradfi", bucket = "instruments-store-tradfi-${var.project_id}", read_only = true },
    { name = "instruments-store-defi", bucket = "instruments-store-defi-${var.project_id}", read_only = true },
    { name = "market-data-tick-cefi", bucket = "market-data-tick-cefi-${var.project_id}", read_only = true },
    { name = "market-data-tick-tradfi", bucket = "market-data-tick-tradfi-${var.project_id}", read_only = true },
    { name = "market-data-tick-defi", bucket = "market-data-tick-defi-${var.project_id}", read_only = true },
  ]

  secret_environment_variables = {}

  service_name = "execution-services"
  environment  = var.environment

  labels = {
    "app"     = "execution-services"
    "version" = "v2"
  }
}

module "daily_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Daily T+1 workflow for execution-services"
  service_account_email = var.service_account_email

  workflow_source = local.workflow_yaml

  # Schedule at 16:00 PM UTC (after strategy)
  schedule                        = var.schedule
  time_zone                       = var.time_zone
  scheduler_service_account_email = var.scheduler_service_account_email

  workflow_args = {
    trigger = "scheduled"
  }

  labels = {
    "app"     = "execution-services"
    "type"    = "daily"
    "version" = "v2"
  }
}

module "backfill_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.backfill_workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Historical execution backtest workflow for execution-services"
  service_account_email = var.service_account_email

  workflow_source = local.backfill_workflow_yaml

  schedule  = null
  time_zone = var.time_zone

  labels = {
    "app"     = "execution-services"
    "type"    = "backfill"
    "version" = "v2"
  }
}
