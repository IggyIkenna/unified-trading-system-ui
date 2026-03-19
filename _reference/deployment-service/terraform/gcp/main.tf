# Terraform bootstrap for GCP — UCI cloud abstraction layer (p3-terraform-gcp)
# Provisions: GCS buckets (per cloud-providers.yaml SSOT), BigQuery datasets,
#             Pub/Sub topics/subscriptions, Secret Manager stubs,
#             unified-trading service account with least-privilege IAM.
#
# Bucket naming follows cloud-providers.yaml two-tier model:
#   Group A (raw data)    — no env suffix; all envs share prod-level copy
#   Group B (derived data)— {domain}-{category}-{env}-{project_id}
#
# NOTE: Cloud Run Job definitions are intentionally absent here.
# See ARCHITECTURE.md "Deployment Model" section for rationale.
# Cloud Run Jobs are deployed at runtime by backends/cloud_run.py.

terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }

  # NOTE: Terraform backend blocks do not support variable interpolation.
  # Pass bucket and prefix at init time:
  #   terraform init \
  #     -backend-config="bucket=uts-terraform-state-<project_id>" \
  #     -backend-config="prefix=terraform/state/<env>"
  # Per-env state keys prevent one env's apply from destroying another env's resources.
  # Convention: prefix=terraform/state/dev | terraform/state/staging | terraform/state/prod
  backend "gcs" {
    bucket = "uts-terraform-state-central-element-323112"
    prefix = "terraform/state/dev"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  # Safe lower-kebab name fragment shared by all resources in this workspace
  env_prefix = lower(replace("${var.bucket_prefix}-${var.environment}", "_", "-"))

  # Common labels applied to every resource
  common_labels = {
    "environment" = var.environment
    "project"     = "unified-trading"
    "managed-by"  = "terraform"
  }

  # ---------------------------------------------------------------------------
  # API key secrets — names only; values must be filled manually in Secret Manager
  # ---------------------------------------------------------------------------
  # Static secrets (env-independent)
  static_secret_names = [
    "tardis-api-key",
    "databento-api-key",
    "thegraph-api-key",
    "alchemy-api-key",
    "hyperliquid-aws-s3",
    "binance-read-api-key",
    "deribit-read-api-key",
    # Sports betting secrets
    "betfair-app-key",
    "odds-api-key",
    "oddsjam-api-key",
    "opticodds-api-key",
    "metabet-api-key",
    "polymarket-private-key",
    # On-chain / CEX data secrets
    "coinglass-api-key",
    "hyblock-api-key",
    "cryptoquant-api-key",
    # Write API keys
    "binance-write-api-key",
    "deribit-write-api-key",
    # Alerting / agent secrets
    "anthropic-api-key",
    "pagerduty-api-key",
  ]

  # Env-scoped secrets — get suffix "-{environment}" appended
  env_secret_names = [
    "risk-api-key",
    "position-monitor-api-key",
  ]

  # Canonical Pub/Sub topic names (from unified-internal-contracts InternalPubSubTopic enum)
  pubsub_topic_names = [
    "fill-events",
    "order-requests",
    "execution-results",
    "position-updates",
    "positions",
    "risk-alerts",
    "margin-warnings",
    "market-ticks",
    "order-book-updates",
    "derivative-tickers",
    "liquidations",
    "feature-updates",
    "strategy-signals",
    "ml-predictions",
    "service-lifecycle-events",
    "health-alerts",
    "circuit-breaker-events",
    "eod-settlement",
    # Additional service-to-service coordination topics
    "cascade-predictions",
    "features-mtf-ready",
    "features-delta-one-ready",
    "features-cross-instrument-ready",
    "sports-odds-ready",
    # NOTE: secret-rotation-alerts is managed by google_pubsub_topic.secret_rotation_alerts
    # in secret_rotation.tf — do NOT add it here to avoid duplicate resource conflict.
  ]
}

# =============================================================================
# GCS Buckets — Group A: Raw data (no env suffix; all envs read from same copy)
# Naming: {domain}-{category}-{project_id}
# =============================================================================

resource "google_storage_bucket" "instruments_cefi" {
  name     = "instruments-store-cefi-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 90 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "instruments-raw", "tier" = "group-a" })
}

resource "google_storage_bucket" "instruments_tradfi" {
  name     = "instruments-store-tradfi-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 90 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "instruments-raw", "tier" = "group-a" })
}

resource "google_storage_bucket" "instruments_defi" {
  name     = "instruments-store-defi-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 90 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "instruments-raw", "tier" = "group-a" })
}

resource "google_storage_bucket" "market_data_cefi" {
  name     = "market-data-tick-cefi-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 90 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "market-data-raw", "tier" = "group-a" })
}

resource "google_storage_bucket" "market_data_tradfi" {
  name     = "market-data-tick-tradfi-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 90 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "market-data-raw", "tier" = "group-a" })
}

resource "google_storage_bucket" "market_data_defi" {
  name     = "market-data-tick-defi-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 90 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "market-data-raw", "tier" = "group-a" })
}

# Calendar data is shared across envs (no env suffix)
resource "google_storage_bucket" "features_calendar" {
  name     = "features-calendar-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 365 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "features-calendar", "tier" = "group-a" })
}

# =============================================================================
# GCS Buckets — Group B: Derived data (per-env)
# Naming: {domain}-{category}-{environment}-{project_id}
# =============================================================================

resource "google_storage_bucket" "features_delta_one_cefi" {
  name     = "features-delta-one-cefi-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 365 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "features-delta-one", "tier" = "group-b" })
}

resource "google_storage_bucket" "features_delta_one_tradfi" {
  name     = "features-delta-one-tradfi-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 365 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "features-delta-one", "tier" = "group-b" })
}

resource "google_storage_bucket" "features_delta_one_defi" {
  name     = "features-delta-one-defi-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 365 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "features-delta-one", "tier" = "group-b" })
}

resource "google_storage_bucket" "features_volatility_cefi" {
  name     = "features-volatility-cefi-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 365 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "features-volatility", "tier" = "group-b" })
}

resource "google_storage_bucket" "features_volatility_tradfi" {
  name     = "features-volatility-tradfi-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 365 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "features-volatility", "tier" = "group-b" })
}

resource "google_storage_bucket" "features_onchain_cefi" {
  name     = "features-onchain-cefi-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 365 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "features-onchain", "tier" = "group-b" })
}

resource "google_storage_bucket" "features_onchain_defi" {
  name     = "features-onchain-defi-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 365 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "features-onchain", "tier" = "group-b" })
}

resource "google_storage_bucket" "ml_models" {
  name     = "ml-models-store-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  labels = merge(local.common_labels, { "purpose" = "ml-models", "tier" = "group-b" })
}

resource "google_storage_bucket" "ml_predictions" {
  name     = "ml-predictions-store-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  labels = merge(local.common_labels, { "purpose" = "ml-predictions", "tier" = "group-b" })
}

resource "google_storage_bucket" "ml_configs" {
  name     = "ml-configs-store-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  labels = merge(local.common_labels, { "purpose" = "ml-configs", "tier" = "group-b" })
}

resource "google_storage_bucket" "strategy_cefi" {
  name     = "strategy-store-cefi-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  labels = merge(local.common_labels, { "purpose" = "strategy", "tier" = "group-b" })
}

resource "google_storage_bucket" "strategy_tradfi" {
  name     = "strategy-store-tradfi-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  labels = merge(local.common_labels, { "purpose" = "strategy", "tier" = "group-b" })
}

resource "google_storage_bucket" "strategy_defi" {
  name     = "strategy-store-defi-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  labels = merge(local.common_labels, { "purpose" = "strategy", "tier" = "group-b" })
}

resource "google_storage_bucket" "execution_cefi" {
  name     = "execution-store-cefi-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  labels = merge(local.common_labels, { "purpose" = "execution", "tier" = "group-b" })
}

resource "google_storage_bucket" "execution_tradfi" {
  name     = "execution-store-tradfi-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  labels = merge(local.common_labels, { "purpose" = "execution", "tier" = "group-b" })
}

resource "google_storage_bucket" "execution_defi" {
  name     = "execution-store-defi-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  labels = merge(local.common_labels, { "purpose" = "execution", "tier" = "group-b" })
}

# Deployment config and state (per-env, used by Cloud Scheduler + audit)
resource "google_storage_bucket" "deployment_state" {
  name     = lower(replace("${local.env_prefix}-deployment-state", "_", "-"))
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 30 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  labels = merge(local.common_labels, { "purpose" = "deployment-state", "tier" = "group-b" })
}

# =============================================================================
# BigQuery Datasets
# =============================================================================

resource "google_bigquery_dataset" "market_data" {
  dataset_id                 = "market_data"
  project                    = var.project_id
  location                   = var.region
  description                = "Market data tables — raw ticks and normalized OHLCV"
  delete_contents_on_destroy = false
  labels = merge(local.common_labels, { "purpose" = "market-data" })
}

resource "google_bigquery_dataset" "market_data_hft" {
  dataset_id                 = "market_data_hft"
  project                    = var.project_id
  location                   = "US" # pre-existing dataset created in US — location is immutable
  description                = "HFT market data tables — high-frequency tick and order book data"
  delete_contents_on_destroy = false
  labels = merge(local.common_labels, { "purpose" = "market-data-hft" })

  lifecycle {
    ignore_changes = [description, labels]
  }
}

resource "google_bigquery_dataset" "features" {
  dataset_id                 = "features"
  project                    = var.project_id
  location                   = var.region
  description                = "Computed feature tables for ML and strategy services"
  delete_contents_on_destroy = false
  labels = merge(local.common_labels, { "purpose" = "feature-store" })
}

resource "google_bigquery_dataset" "ml_models_bq" {
  dataset_id                 = "ml_models"
  project                    = var.project_id
  location                   = var.region
  description                = "Model metadata, hyperparameters, and evaluation metrics"
  delete_contents_on_destroy = false
  labels = merge(local.common_labels, { "purpose" = "ml-models" })
}

resource "google_bigquery_dataset" "ml_predictions_bq" {
  dataset_id                 = "ml_predictions"
  project                    = var.project_id
  location                   = var.region
  description                = "ML model predictions and inference results"
  delete_contents_on_destroy = false
  labels = merge(local.common_labels, { "purpose" = "ml-predictions" })
}

resource "google_bigquery_dataset" "audit" {
  dataset_id                 = "audit"
  project                    = var.project_id
  location                   = var.region
  description                = "Audit logs and compliance events"
  delete_contents_on_destroy = false
  labels = merge(local.common_labels, { "purpose" = "audit" })
}

# =============================================================================
# Secret Manager — stub secrets (names only; values filled manually)
# =============================================================================

resource "google_secret_manager_secret" "api_keys_static" {
  for_each = toset(local.static_secret_names)

  secret_id = each.value
  project   = var.project_id

  replication {
    auto {}
  }
  labels = merge(local.common_labels, { "purpose" = "api-credentials" })
}

resource "google_secret_manager_secret" "api_keys_env_scoped" {
  for_each = toset(local.env_secret_names)

  secret_id = "${each.value}-${var.environment}"
  project   = var.project_id

  replication {
    auto {}
  }
  labels = merge(local.common_labels, { "purpose" = "api-credentials" })
}

# =============================================================================
# Pub/Sub Topics + Subscriptions
# =============================================================================

resource "google_pubsub_topic" "unified_trading" {
  for_each = toset(local.pubsub_topic_names)

  name    = each.value
  project = var.project_id

  labels = merge(local.common_labels, { "purpose" = "event-bus" })
}

# Default pull subscriptions — one per topic ({topic}-sub)
resource "google_pubsub_subscription" "unified_trading" {
  for_each = toset(local.pubsub_topic_names)

  name    = "${each.value}-sub"
  topic   = google_pubsub_topic.unified_trading[each.value].id
  project = var.project_id

  # 7-day message retention
  message_retention_duration = "604800s"
  retain_acked_messages      = false

  ack_deadline_seconds = 60

  expiration_policy {
    ttl = "" # never expire
  }

  labels = merge(local.common_labels, { "purpose" = "event-bus" })
}

# =============================================================================
# Service Account — unified-trading-sa (least privilege)
# =============================================================================

resource "google_service_account" "unified_trading" {
  account_id   = "unified-trading-sa"
  display_name = "Unified Trading Service Account"
  description  = "Least-privilege service account for all unified-trading services"
  project      = var.project_id
}

resource "google_project_iam_member" "unified_trading_storage_admin" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.unified_trading.email}"
}

resource "google_project_iam_member" "unified_trading_bq_editor" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.unified_trading.email}"
}

resource "google_project_iam_member" "unified_trading_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.unified_trading.email}"
}

resource "google_project_iam_member" "unified_trading_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.unified_trading.email}"
}

resource "google_project_iam_member" "unified_trading_pubsub_editor" {
  project = var.project_id
  role    = "roles/pubsub.editor"
  member  = "serviceAccount:${google_service_account.unified_trading.email}"
}

# ---------------------------------------------------------------------------
# Cloud Memorystore (Redis) — optional; guarded by var.enable_memorystore
#
# Not enabled by default because:
#   1. Provisioning takes ~5-10 minutes
#   2. 1 GB basic tier costs ~$35/month per env
#   3. Requires VPC access — Memorystore is only reachable from same VPC
#
# To enable:
#   terraform apply -var="enable_memorystore=true" ...
#
# After enabling, REDIS_URL is stored in Secret Manager under "redis-url".
# Cloud Run services should inject it via:
#   --set-secrets=REDIS_URL=redis-url:latest
#
# Equivalent setup script: scripts/setup-redis.sh
# ---------------------------------------------------------------------------

resource "google_redis_instance" "unified_trading" {
  count  = var.enable_memorystore ? 1 : 0
  name   = "trading-cache-${var.environment}"
  region = var.region

  tier           = "BASIC"
  memory_size_gb = 1
  redis_version  = "REDIS_7_0"
  display_name   = "Unified Trading Cache (${var.environment})"

  auth_enabled            = true
  transit_encryption_mode = "SERVER_AUTHENTICATION"

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Store Redis URL in Secret Manager so services read it via UCI
resource "google_secret_manager_secret" "redis_url" {
  count     = var.enable_memorystore ? 1 : 0
  secret_id = "redis-url"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = { environment = var.environment }
}

resource "google_secret_manager_secret_version" "redis_url" {
  count  = var.enable_memorystore ? 1 : 0
  secret = google_secret_manager_secret.redis_url[0].id
  # auth_string requires the instance to exist; this builds the rediss:// URL
  secret_data = "rediss://:${google_redis_instance.unified_trading[0].auth_string}@${google_redis_instance.unified_trading[0].host}:${google_redis_instance.unified_trading[0].port}"
}

resource "google_project_iam_member" "unified_trading_redis_viewer" {
  count   = var.enable_memorystore ? 1 : 0
  project = var.project_id
  role    = "roles/redis.viewer"
  member  = "serviceAccount:${google_service_account.unified_trading.email}"
}

# =============================================================================
# GCS Buckets — Alerting & CI/CD Event Retention
# p5-14: alerting/history (1yr = 365d), alerting/state (90d), cicd-events (90d)
# Retention is implemented via lifecycle_rule DELETE after the retention window.
# =============================================================================

resource "google_storage_bucket" "alerting_history" {
  name     = "alerting-history-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = false }

  # Compliance requirement: alerting history retained for 1 year (365 days)
  lifecycle_rule {
    condition { age = 365 }
    action { type = "Delete" }
  }

  labels = merge(local.common_labels, {
    "purpose" = "alerting-history",
    "tier"    = "observability"
  })
}

resource "google_storage_bucket" "alerting_state" {
  name     = "alerting-state-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = false }

  # Alerting cooldown/dedup state retained for 90 days
  lifecycle_rule {
    condition { age = 90 }
    action { type = "Delete" }
  }

  labels = merge(local.common_labels, {
    "purpose" = "alerting-state",
    "tier"    = "observability"
  })
}

resource "google_storage_bucket" "cicd_events" {
  name     = "cicd-events-${var.environment}-${var.project_id}"
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = false }

  # CI/CD event audit trail retained for 90 days
  lifecycle_rule {
    condition { age = 90 }
    action { type = "Delete" }
  }

  labels = merge(local.common_labels, {
    "purpose" = "cicd-events",
    "tier"    = "observability"
  })
}

# IAM: unified-trading SA needs write access to alerting + cicd-events buckets
resource "google_storage_bucket_iam_member" "alerting_history_writer" {
  bucket = google_storage_bucket.alerting_history.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.unified_trading.email}"
}

resource "google_storage_bucket_iam_member" "alerting_state_writer" {
  bucket = google_storage_bucket.alerting_state.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.unified_trading.email}"
}

resource "google_storage_bucket_iam_member" "cicd_events_writer" {
  bucket = google_storage_bucket.cicd_events.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.unified_trading.email}"
}
