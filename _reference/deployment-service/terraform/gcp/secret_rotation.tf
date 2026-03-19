# Secret Rotation — Cloud Function + Cloud Scheduler
# PCI DSS §8.3.9 compliance: automated 90/180-day key rotation alerts
#
# Deploy function: see functions/rotate-exchange-keys/main.py
# Alert routing:   secret-rotation-alerts PubSub → alerting-service
#
# Guarded by var.enable_secret_rotation (default false).
# Requires unified-cloud-interface and unified-events-interface to be published
# to a private package registry accessible by Cloud Build.

locals {
  rotation_function_name = "rotate-exchange-keys"
  rotation_topic_name    = "secret-rotation-alerts"
}

# PubSub topic for rotation alerts → alerting-service subscribes
# Always created (not guarded) so alerting-service can subscribe regardless.
resource "google_pubsub_topic" "secret_rotation_alerts" {
  name    = local.rotation_topic_name
  project = var.project_id

  labels = {
    managed_by = "terraform"
    purpose    = "secret-rotation-alerts"
  }
}

# Service account with minimal permissions for the rotation function
resource "google_service_account" "secret_rotator" {
  account_id   = "secret-rotator"
  display_name = "Secret Rotation Cloud Function SA"
  project      = var.project_id
}

resource "google_project_iam_member" "rotator_sm_viewer" {
  project = var.project_id
  role    = "roles/secretmanager.viewer"
  member  = "serviceAccount:${google_service_account.secret_rotator.email}"
}

resource "google_project_iam_member" "rotator_pubsub_publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.secret_rotator.email}"
  condition {
    title       = "rotation_topic_only"
    description = "Restrict publish to the secret-rotation-alerts topic only"
    expression  = "resource.name == 'projects/${var.project_id}/topics/${local.rotation_topic_name}'"
  }
}

# GCS bucket for function source — always created so it's ready when rotation is enabled
resource "google_storage_bucket" "function_source" {
  name                        = "${var.project_id}-function-source"
  location                    = var.region
  project                     = var.project_id
  uniform_bucket_level_access = true

  lifecycle_rule {
    condition { age = 30 }
    action {
      type = "Delete"
    }
  }
}

# ---------------------------------------------------------------------------
# Cloud Function + Scheduler — guarded by var.enable_secret_rotation
# Requires private packages (unified-cloud-interface, unified-events-interface)
# to be available in a registry accessible by Cloud Build.
# ---------------------------------------------------------------------------

data "archive_file" "rotation_function" {
  count       = var.enable_secret_rotation ? 1 : 0
  type        = "zip"
  output_path = "/tmp/rotate-exchange-keys.zip"
  source_dir  = "${path.module}/../../functions/rotate-exchange-keys"
}

resource "google_storage_bucket_object" "rotation_function_zip" {
  count  = var.enable_secret_rotation ? 1 : 0
  name   = "rotate-exchange-keys-${filemd5("${path.module}/../../functions/rotate-exchange-keys/main.py")}.zip"
  bucket = google_storage_bucket.function_source.name
  source = data.archive_file.rotation_function[0].output_path
}

resource "google_cloudfunctions2_function" "rotate_exchange_keys" {
  count    = var.enable_secret_rotation ? 1 : 0
  name     = local.rotation_function_name
  location = var.region
  project  = var.project_id

  build_config {
    runtime     = "python312"
    entry_point = "rotate_exchange_keys"
    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.rotation_function_zip[0].name
      }
    }
  }

  service_config {
    min_instance_count             = 0
    max_instance_count             = 1
    available_memory               = "256M"
    timeout_seconds                = 300
    service_account_email          = google_service_account.secret_rotator.email
    ingress_settings               = "ALLOW_INTERNAL_ONLY"
    all_traffic_on_latest_revision = true

    environment_variables = {
      PROJECT_ID             = var.project_id
      ALERT_TOPIC            = local.rotation_topic_name
      TRADE_KEY_MAX_AGE_DAYS = "90"
      DATA_KEY_MAX_AGE_DAYS  = "180"
      WARN_BEFORE_DAYS       = "14"
    }
  }

  labels = {
    managed_by = "terraform"
    purpose    = "secret-rotation"
    pci_dss    = "8-3-9"
  }
}

resource "google_cloud_scheduler_job" "rotate_keys_daily" {
  count       = var.enable_secret_rotation ? 1 : 0
  name        = "rotate-exchange-keys-daily"
  description = "Daily secret rotation audit — PCI DSS §8.3.9"
  schedule    = "0 6 * * *" # 06:00 UTC daily
  time_zone   = "UTC"
  project     = var.project_id
  region      = var.region

  http_target {
    uri         = google_cloudfunctions2_function.rotate_exchange_keys[0].service_config[0].uri
    http_method = "POST"
    body        = base64encode("{\"source\":\"scheduler\"}")

    oidc_token {
      service_account_email = google_service_account.secret_rotator.email
      audience              = google_cloudfunctions2_function.rotate_exchange_keys[0].service_config[0].uri
    }
  }

  retry_config {
    retry_count          = 3
    min_backoff_duration = "30s"
    max_backoff_duration = "300s"
  }
}

# Outputs
output "rotation_function_uri" {
  description = "Cloud Function URI for secret rotation (empty when disabled)"
  value       = var.enable_secret_rotation ? google_cloudfunctions2_function.rotate_exchange_keys[0].service_config[0].uri : ""
}

output "rotation_alerts_topic" {
  description = "PubSub topic for secret rotation alerts"
  value       = google_pubsub_topic.secret_rotation_alerts.id
}
