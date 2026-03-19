# Terraform configuration for market-tick-data-service
# Creates Cloud Run Job + Daily Workflow + Backfill Workflow with date sharding

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
  # Daily workflow: computes yesterday and triggers the job
  daily_workflow_yaml = <<-YAML
main:
  params: [args]
  steps:
    - init:
        assign:
          - project_id: "${var.project_id}"
          - region: "${var.region}"
          - job_name: "${var.job_name}"
          - category: $${default(map.get(args, "category"), "CEFI")}

    # Compute yesterday's date (T+1)
    - compute_date:
        assign:
          - current_time: $${sys.now()}
          - yesterday_seconds: $${int(current_time) - 86400}
          - yesterday_time: $${time.format(yesterday_seconds)}
          - t_plus_1_date: $${text.substring(yesterday_time, 0, 10)}

    # Trigger market-tick-data-service job
    - run_job:
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
                    - "fetch"
                    - "--mode"
                    - "batch"
                    - "--category"
                    - $${category}
                    - "--start-date"
                    - $${t_plus_1_date}
                    - "--end-date"
                    - $${t_plus_1_date}
        result: job_response

    # Return immediately (fire and forget for daily)
    - return_success:
        return:
          status: "triggered"
          date: $${t_plus_1_date}
          category: $${category}
          execution: $${job_response.body.metadata.name}
YAML

  # Backfill workflow: DATE-LEVEL SHARDING
  # Spawns one Cloud Run job per date in the range
  # All other parameters are optional - CLI uses its defaults if not provided
  #
  # Required: start_date, end_date
  # Optional: categories, venues, instrument_types, data_types, max_instruments, force
  #
  # Example (minimal - just dates):
  #   gcloud workflows run market-tick-backfill --location=asia-northeast1 \
  #     --data='{"start_date":"2024-01-01","end_date":"2024-01-10"}'
  #
  # Example (with filters):
  #   gcloud workflows run market-tick-backfill --location=asia-northeast1 \
  #     --data='{"start_date":"2024-01-01","end_date":"2024-01-10","categories":["CEFI"],"venues":["BINANCE-SPOT"],"force":true}'
  #
  backfill_workflow_yaml = <<-YAML
main:
  params: [args]
  steps:
    - init:
        assign:
          - project_id: "${var.project_id}"
          - region: "${var.region}"
          - job_name: "${var.job_name}"
          # Required parameters
          - start_date: $${args.start_date}
          - end_date: $${args.end_date}
          # Optional filtering parameters (empty/null = CLI uses its defaults)
          - categories: $${default(map.get(args, "categories"), [])}
          - venues: $${default(map.get(args, "venues"), [])}
          - instrument_types: $${default(map.get(args, "instrument_types"), [])}
          - data_types: $${default(map.get(args, "data_types"), [])}
          - max_instruments: $${default(map.get(args, "max_instruments"), null)}
          - force: $${default(map.get(args, "force"), false)}

    # Parse dates and calculate number of days
    # Convert YYYY-MM-DD to RFC3339 format for time.parse()
    - parse_dates:
        assign:
          - start_rfc3339: $${start_date + "T00:00:00Z"}
          - end_rfc3339: $${end_date + "T00:00:00Z"}
          - start_ts: $${time.parse(start_rfc3339)}
          - end_ts: $${time.parse(end_rfc3339)}
          - num_days: $${int((end_ts - start_ts) / 86400) + 1}

    # Generate list of dates
    - init_dates:
        assign:
          - dates: []
          - current_ts: $${start_ts}

    - generate_dates:
        for:
          value: i
          range: $${[0, num_days - 1]}
          steps:
            - add_date:
                assign:
                  - date_str: $${text.substring(time.format(current_ts), 0, 10)}
                  - dates: $${list.concat(dates, [date_str])}
                  - current_ts: $${current_ts + 86400}

    # Build optional args that apply to all jobs
    - build_optional_args:
        assign:
          - cat_args: $${if(len(categories) > 0, list.concat(["--category"], categories), [])}
          - venue_args: $${if(len(venues) > 0, list.concat(["--venues"], venues), [])}
          - type_args: $${if(len(instrument_types) > 0, list.concat(["--instrument-types"], instrument_types), [])}
          - data_args: $${if(len(data_types) > 0, list.concat(["--data-types"], data_types), [])}
          - max_args: $${if(max_instruments != null, ["--max-instruments", string(max_instruments)], [])}
          - force_args: $${if(force, ["--force"], [])}

    # Run one job per date in parallel
    - run_all_dates:
        parallel:
          for:
            value: date
            in: $${dates}
            steps:
              - build_job_args:
                  assign:
                    - base: ["--operation", "fetch", "--mode", "batch", "--start-date", $${date}, "--end-date", $${date}]
              - add_optional_args:
                  assign:
                    - step1: $${list.concat(base, cat_args)}
                    - step2: $${list.concat(step1, venue_args)}
                    - step3: $${list.concat(step2, type_args)}
                    - step4: $${list.concat(step3, data_args)}
                    - step5: $${list.concat(step4, max_args)}
                    - final_args: $${list.concat(step5, force_args)}
              - trigger_job:
                  call: http.post
                  args:
                    url: $${"https://" + region + "-run.googleapis.com/v2/projects/" + project_id + "/locations/" + region + "/jobs/" + job_name + ":run"}
                    auth:
                      type: OAuth2
                    body:
                      overrides:
                        containerOverrides:
                          - args: $${final_args}
                  result: job_response

    # Return summary
    - return_results:
        return:
          status: "triggered"
          start_date: $${start_date}
          end_date: $${end_date}
          num_days: $${num_days}
          total_jobs: $${num_days}
          filters:
            categories: $${categories}
            venues: $${venues}
            instrument_types: $${instrument_types}
            data_types: $${data_types}
            max_instruments: $${max_instruments}
            force: $${force}
YAML
}

# Cloud Run Job for market-tick-data-service
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
    GCS_BUCKET_CEFI        = var.gcs_bucket_cefi
    GCS_BUCKET_TRADFI      = var.gcs_bucket_tradfi
    GCS_BUCKET_DEFI        = var.gcs_bucket_defi
    GCS_FUSE_MOUNT_PATH    = "/mnt/gcs"
    UCS_SKIP_GCSFUSE_CHECK = "1"
    PYTHONUNBUFFERED       = "1"  # Enable real-time logging
  }

  gcs_volumes = [
    { name = "instruments-store-cefi", bucket = "instruments-store-cefi-${var.project_id}", read_only = true },
    { name = "instruments-store-defi", bucket = "instruments-store-defi-${var.project_id}", read_only = true },
    { name = "instruments-store-tradfi", bucket = "instruments-store-tradfi-${var.project_id}", read_only = true },
    { name = "market-data-tick-cefi", bucket = var.gcs_bucket_cefi, read_only = false },
    { name = "market-data-tick-defi", bucket = var.gcs_bucket_defi, read_only = false },
    { name = "market-data-tick-tradfi", bucket = var.gcs_bucket_tradfi, read_only = false },
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
  }

  service_name = "market-tick-data-service"
  environment  = var.environment

  labels = {
    "app"     = "market-tick-data-service"
    "version" = "v2"
  }
}

# Daily T+1 Workflow (triggered by scheduler)
module "daily_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.daily_workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Daily T+1 workflow for market-tick-data-service"
  service_account_email = var.service_account_email

  workflow_source = local.daily_workflow_yaml

  # Schedule at 9:00 AM UTC daily (30 min after instruments-service)
  schedule                        = var.schedule
  time_zone                       = var.time_zone
  scheduler_service_account_email = var.scheduler_service_account_email

  workflow_args = {
    trigger  = "scheduled"
    category = "CEFI"
  }

  labels = {
    "app"     = "market-tick-data-service"
    "type"    = "daily"
    "version" = "v2"
  }
}

# Backfill Workflow (manual trigger with date sharding)
module "backfill_workflow" {
  source = "../../../modules/workflow/gcp"

  name                  = var.backfill_workflow_name
  project_id            = var.project_id
  region                = var.region
  description           = "Historical backfill workflow with date sharding support"
  service_account_email = var.service_account_email

  workflow_source = local.backfill_workflow_yaml

  # No schedule - manual trigger only
  schedule  = null
  time_zone = var.time_zone

  labels = {
    "app"     = "market-tick-data-service"
    "type"    = "backfill"
    "version" = "v2"
  }
}
