# T+1 Batch Reconciliation — Cloud Scheduler triggers
#
# Each batch service runs independently on its own T+1 schedule so recon data
# is ready when batch-live-reconciliation-service starts at 06:00 UTC.
#
# Cloud Run Job definitions are deployed at runtime by backends/cloud_run.py
# (see main.tf NOTE). This file only provisions the Cloud Scheduler triggers.
#
# Schedule design:
#   00:30 — execution-service config snapshot (prerequisite for Stage 3 recon)
#   01:30 — features-calendar-service
#   02:00 — features-delta-one, features-volatility
#   02:30 — features-onchain, features-sports, features-cross-instrument,
#            features-multi-timeframe, features-commodity
#   03:00 — ml-inference-service
#   04:00 — strategy-service
#   06:00 — batch-live-reconciliation-service (orchestrator, after all upstream done)

# Service account for T+1 batch Cloud Scheduler jobs — must exist before scheduler jobs are created
resource "google_service_account" "t1_batch" {
  account_id   = "${local.env_prefix}-batch-sa"
  display_name = "T+1 Batch Scheduler SA (${var.environment})"
  description  = "Service account used by Cloud Scheduler to trigger T+1 batch Cloud Run Jobs"
  project      = var.project_id
}

resource "google_project_iam_member" "t1_batch_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.t1_batch.email}"
}

locals {
  # Cloud Run Job name convention: {env_prefix}-{service}-t1-recon
  # Cloud Scheduler job name convention: {env_prefix}-{service}-t1-schedule
  t1_service_account_email = google_service_account.t1_batch.email

  t1_batch_services = {
    "execution-config-snapshot" = {
      schedule    = "30 0 * * *"
      job_name    = "${local.env_prefix}-execution-service-config-snapshot"
      description = "execution-service EOD config snapshot — prerequisite for Stage 3 recon"
    }
    "features-calendar" = {
      schedule    = "30 1 * * *"
      job_name    = "${local.env_prefix}-features-calendar-service-t1-recon"
      description = "features-calendar-service T+1 recon batch — writes to t1-recon/features/calendar/"
    }
    "features-delta-one" = {
      schedule    = "0 2 * * *"
      job_name    = "${local.env_prefix}-features-delta-one-service-t1-recon"
      description = "features-delta-one-service T+1 recon batch — writes to t1-recon/features/delta-one/"
    }
    "features-volatility" = {
      schedule    = "0 2 * * *"
      job_name    = "${local.env_prefix}-features-volatility-service-t1-recon"
      description = "features-volatility-service T+1 recon batch — writes to t1-recon/features/volatility/"
    }
    "features-onchain" = {
      schedule    = "30 2 * * *"
      job_name    = "${local.env_prefix}-features-onchain-service-t1-recon"
      description = "features-onchain-service T+1 recon batch — writes to t1-recon/features/onchain/"
    }
    "features-sports" = {
      schedule    = "30 2 * * *"
      job_name    = "${local.env_prefix}-features-sports-service-t1-recon"
      description = "features-sports-service T+1 recon batch — writes to t1-recon/features/sports/"
    }
    "features-cross-instrument" = {
      schedule    = "30 2 * * *"
      job_name    = "${local.env_prefix}-features-cross-instrument-service-t1-recon"
      description = "features-cross-instrument-service T+1 recon batch — writes to t1-recon/features/cross-instrument/"
    }
    "features-multi-timeframe" = {
      schedule    = "30 2 * * *"
      job_name    = "${local.env_prefix}-features-multi-timeframe-service-t1-recon"
      description = "features-multi-timeframe-service T+1 recon batch — writes to t1-recon/features/multi-timeframe/"
    }
    "features-commodity" = {
      schedule    = "30 2 * * *"
      job_name    = "${local.env_prefix}-features-commodity-service-t1-recon"
      description = "features-commodity-service T+1 recon batch — writes to t1-recon/features/commodity/"
    }
    "ml-inference" = {
      schedule    = "0 3 * * *"
      job_name    = "${local.env_prefix}-ml-inference-service-t1-recon"
      description = "ml-inference-service T+1 recon batch — reads t1-recon/features/, writes to t1-recon/ml/"
    }
    "strategy" = {
      schedule    = "0 4 * * *"
      job_name    = "${local.env_prefix}-strategy-service-t1-recon"
      description = "strategy-service T+1 recon batch — reads t1-recon/ml/, writes to t1-recon/strategy/"
    }
    "batch-live-reconciliation" = {
      schedule    = "0 6 * * *"
      job_name    = "${local.env_prefix}-batch-live-reconciliation-service"
      description = "batch-live-reconciliation-service — T+1 orchestrator; polls GCS for upstream data availability"
    }
  }
}

resource "google_cloud_scheduler_job" "t1_batch_schedule" {
  for_each = local.t1_batch_services

  name        = "${local.env_prefix}-${each.key}-t1-schedule"
  description = each.value.description
  schedule    = each.value.schedule
  time_zone   = "UTC"
  region      = var.region

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${each.value.job_name}:run"

    oauth_token {
      service_account_email = local.t1_service_account_email
    }
  }

  retry_config {
    retry_count          = 1
    max_retry_duration   = "0s"
    min_backoff_duration = "5s"
    max_backoff_duration = "3600s"
    max_doublings        = 5
  }

}
