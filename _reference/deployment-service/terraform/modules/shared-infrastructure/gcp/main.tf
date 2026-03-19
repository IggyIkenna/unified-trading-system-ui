# GCP Shared Infrastructure Module
# Creates foundational resources for running services on GCP
#
# This module provisions:
# - Artifact Registry repositories for Docker images
# - GCS Buckets for data storage (named with env for staging/prod isolation)
# - Service accounts with appropriate per-bucket IAM (not project-level)
# - Cross-env read access via cross_env_read_sa_emails (staging SA reads prod buckets)
# - Secret Manager access configuration

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
  }
}

locals {
  # Categories for per-category buckets
  categories = ["cefi", "tradfi", "defi"]

  # Domains for backtesting buckets
  domains = ["cefi", "tradfi", "defi"]

  # Collect all data bucket names for per-bucket IAM bindings.
  # deployment_orchestration is excluded — it is an infra bucket isolated by
  # state path prefix, not by env name.
  data_bucket_names = var.create_gcs_buckets ? concat(
    [for k, v in google_storage_bucket.features_delta_one : v.name],
    [for k, v in google_storage_bucket.features_volatility : v.name],
    [for k, v in google_storage_bucket.features_onchain : v.name],
    [for v in google_storage_bucket.ml_models_store : v.name],
    [for v in google_storage_bucket.ml_predictions_store : v.name],
    [for v in google_storage_bucket.ml_configs_store : v.name],
    [for k, v in google_storage_bucket.strategy_store : v.name],
    [for k, v in google_storage_bucket.execution_store : v.name],
  ) : []

  # SA email for use in IAM bindings (empty string when not created)
  env_sa_email = var.create_service_accounts ? google_service_account.env_sa[0].email : ""
}

# =============================================================================
# Artifact Registry Repositories
# =============================================================================

resource "google_artifact_registry_repository" "service_repos" {
  for_each = var.create_artifact_registry ? toset(var.services) : []

  project       = var.project_id
  location      = var.region
  repository_id = each.value
  description   = "Docker repository for ${each.value}"
  format        = "DOCKER"

  labels = merge(
    {
      "managed-by" = "terraform"
      "service"    = each.value
    },
    var.labels
  )
}

# =============================================================================
# GCS Buckets - Features Services (per category)
# =============================================================================

# Features Delta One buckets (CEFI, TRADFI, DEFI)
resource "google_storage_bucket" "features_delta_one" {
  for_each = var.create_gcs_buckets ? toset(local.categories) : []

  name     = "features-delta-one-${each.value}-${var.env}-${var.project_id}"
  project  = var.project_id
  location = var.gcs_location

  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  labels = merge(
    {
      "managed-by" = "terraform"
      "service"    = "features-delta-one-service"
      "category"   = each.value
      "env"        = var.env
    },
    var.labels
  )
}

# Features Volatility buckets (CEFI, TRADFI only - DEFI has no options)
resource "google_storage_bucket" "features_volatility" {
  for_each = var.create_gcs_buckets ? toset(["cefi", "tradfi"]) : []

  name     = "features-volatility-${each.value}-${var.env}-${var.project_id}"
  project  = var.project_id
  location = var.gcs_location

  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  labels = merge(
    {
      "managed-by" = "terraform"
      "service"    = "features-volatility-service"
      "category"   = each.value
      "env"        = var.env
    },
    var.labels
  )
}

# Features Onchain buckets (CEFI, DEFI)
resource "google_storage_bucket" "features_onchain" {
  for_each = var.create_gcs_buckets ? toset(["cefi", "defi"]) : []

  name     = "features-onchain-${each.value}-${var.env}-${var.project_id}"
  project  = var.project_id
  location = var.gcs_location

  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  labels = merge(
    {
      "managed-by" = "terraform"
      "service"    = "features-onchain-service"
      "category"   = each.value
      "env"        = var.env
    },
    var.labels
  )
}

# =============================================================================
# GCS Buckets - ML Services (shared)
# =============================================================================

# ML Models Store
resource "google_storage_bucket" "ml_models_store" {
  count = var.create_gcs_buckets ? 1 : 0

  name     = "ml-models-store-${var.env}-${var.project_id}"
  project  = var.project_id
  location = var.gcs_location

  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = true
  }

  labels = merge(
    {
      "managed-by" = "terraform"
      "service"    = "ml-training-service"
      "env"        = var.env
    },
    var.labels
  )
}

# ML Predictions Store
resource "google_storage_bucket" "ml_predictions_store" {
  count = var.create_gcs_buckets ? 1 : 0

  name     = "ml-predictions-store-${var.env}-${var.project_id}"
  project  = var.project_id
  location = var.gcs_location

  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  labels = merge(
    {
      "managed-by" = "terraform"
      "service"    = "ml-inference-service"
      "env"        = var.env
    },
    var.labels
  )
}

# ML Configs Store (for grid configs)
resource "google_storage_bucket" "ml_configs_store" {
  count = var.create_gcs_buckets ? 1 : 0

  name     = "ml-configs-store-${var.env}-${var.project_id}"
  project  = var.project_id
  location = var.gcs_location

  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = true
  }

  labels = merge(
    {
      "managed-by" = "terraform"
      "service"    = "ml-training-service"
      "env"        = var.env
    },
    var.labels
  )
}

# =============================================================================
# GCS Buckets - Strategy & Execution Services (per domain)
# =============================================================================

# Strategy Store buckets (per domain)
resource "google_storage_bucket" "strategy_store" {
  for_each = var.create_gcs_buckets ? toset(local.domains) : []

  name     = "strategy-store-${each.value}-${var.env}-${var.project_id}"
  project  = var.project_id
  location = var.gcs_location

  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = true
  }

  labels = merge(
    {
      "managed-by" = "terraform"
      "service"    = "strategy-service"
      "domain"     = each.value
      "env"        = var.env
    },
    var.labels
  )
}

# Execution Store buckets (per domain)
resource "google_storage_bucket" "execution_store" {
  for_each = var.create_gcs_buckets ? toset(local.domains) : []

  name     = "execution-store-${each.value}-${var.env}-${var.project_id}"
  project  = var.project_id
  location = var.gcs_location

  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = true
  }

  labels = merge(
    {
      "managed-by" = "terraform"
      "service"    = "execution-service"
      "domain"     = each.value
      "env"        = var.env
    },
    var.labels
  )
}

# =============================================================================
# GCS Buckets - Deployment Orchestration State
# (no env suffix — isolated by path prefix deployments.{env}/ inside the bucket)
# =============================================================================

resource "google_storage_bucket" "deployment_orchestration" {
  count = var.create_gcs_buckets ? 1 : 0

  name     = "deployment-orchestration-${var.project_id}"
  project  = var.project_id
  location = var.gcs_location

  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  labels = merge(
    {
      "managed-by" = "terraform"
      "service"    = "unified-trading-deployment"
    },
    var.labels
  )
}

# =============================================================================
# Service Accounts
# =============================================================================

# Environment-specific service account for data processing services.
# account_id has a 30-char max; "staging-data-sa" and "prod-data-sa" are safe.
resource "google_service_account" "env_sa" {
  count = var.create_service_accounts ? 1 : 0

  account_id   = "${var.env}-data-sa"
  display_name = "${title(var.env)} Data Service Account"
  description  = "Service account for ${var.env} data processing (features, ML, strategy, execution)"
  project      = var.project_id
}

# Grant Secret Manager access
resource "google_project_iam_member" "env_sa_secrets" {
  count = var.create_service_accounts ? 1 : 0

  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${local.env_sa_email}"
}

# Grant Cloud Run invoker for workflows
resource "google_project_iam_member" "env_sa_run_invoker" {
  count = var.create_service_accounts ? 1 : 0

  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${local.env_sa_email}"
}

# Grant Workflows invoker
resource "google_project_iam_member" "env_sa_workflows_invoker" {
  count = var.create_service_accounts ? 1 : 0

  project = var.project_id
  role    = "roles/workflows.invoker"
  member  = "serviceAccount:${local.env_sa_email}"
}

# =============================================================================
# Per-Bucket IAM — env SA gets objectAdmin on its own env's buckets
# (replaces the old project-wide objectAdmin grant)
# =============================================================================

resource "google_storage_bucket_iam_binding" "env_sa_admin" {
  for_each = var.create_service_accounts && var.create_gcs_buckets ? toset(local.data_bucket_names) : toset([])

  bucket  = each.value
  role    = "roles/storage.objectAdmin"
  members = ["serviceAccount:${local.env_sa_email}"]
}

# =============================================================================
# Cross-Env Read Access
#
# Pass staging-sa email(s) via cross_env_read_sa_emails when deploying prod.
# This grants staging services read-only access to prod data without duplicating
# storage. Staging can test against real prod data; writes are blocked by IAM.
# =============================================================================

resource "google_storage_bucket_iam_binding" "cross_env_reader" {
  for_each = var.create_gcs_buckets && length(var.cross_env_read_sa_emails) > 0 ? toset(local.data_bucket_names) : toset([])

  bucket  = each.value
  role    = "roles/storage.objectViewer"
  members = [for email in var.cross_env_read_sa_emails : "serviceAccount:${email}"]
}
