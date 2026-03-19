# Outputs for GCP Shared Infrastructure Module

# =============================================================================
# Artifact Registry Outputs
# =============================================================================

output "artifact_registry_repositories" {
  description = "Map of service names to Artifact Registry repository URLs"
  value = {
    for service, repo in google_artifact_registry_repository.service_repos :
    service => "${var.region}-docker.pkg.dev/${var.project_id}/${repo.repository_id}"
  }
}

# =============================================================================
# GCS Bucket Outputs - Features
# =============================================================================

output "features_delta_one_buckets" {
  description = "Map of category to features-delta-one bucket names"
  value = {
    for cat, bucket in google_storage_bucket.features_delta_one :
    cat => bucket.name
  }
}

output "features_volatility_buckets" {
  description = "Map of category to features-volatility bucket names"
  value = {
    for cat, bucket in google_storage_bucket.features_volatility :
    cat => bucket.name
  }
}

output "features_onchain_buckets" {
  description = "Map of category to features-onchain bucket names"
  value = {
    for cat, bucket in google_storage_bucket.features_onchain :
    cat => bucket.name
  }
}

# =============================================================================
# GCS Bucket Outputs - ML
# =============================================================================

output "ml_models_store_bucket" {
  description = "ML models store bucket name"
  value       = var.create_gcs_buckets ? google_storage_bucket.ml_models_store[0].name : ""
}

output "ml_predictions_store_bucket" {
  description = "ML predictions store bucket name"
  value       = var.create_gcs_buckets ? google_storage_bucket.ml_predictions_store[0].name : ""
}

output "ml_configs_store_bucket" {
  description = "ML configs store bucket name"
  value       = var.create_gcs_buckets ? google_storage_bucket.ml_configs_store[0].name : ""
}

# =============================================================================
# GCS Bucket Outputs - Strategy & Execution
# =============================================================================

output "strategy_store_buckets" {
  description = "Map of domain to strategy-store bucket names"
  value = {
    for domain, bucket in google_storage_bucket.strategy_store :
    domain => bucket.name
  }
}

output "execution_store_buckets" {
  description = "Map of domain to execution-store bucket names"
  value = {
    for domain, bucket in google_storage_bucket.execution_store :
    domain => bucket.name
  }
}

# =============================================================================
# GCS Bucket Outputs - Deployment
# =============================================================================

output "deployment_orchestration_bucket" {
  description = "Deployment orchestration state bucket name"
  value       = var.create_gcs_buckets ? google_storage_bucket.deployment_orchestration[0].name : ""
}

# =============================================================================
# Service Account Outputs
# =============================================================================

output "env_service_account_email" {
  description = "Email of the environment-specific data service account"
  value       = var.create_service_accounts ? google_service_account.env_sa[0].email : ""
}

output "env_service_account_name" {
  description = "Name of the environment-specific data service account"
  value       = var.create_service_accounts ? google_service_account.env_sa[0].name : ""
}

# =============================================================================
# Summary Outputs
# =============================================================================

output "all_bucket_names" {
  description = "List of all created bucket names"
  value = concat(
    [for b in google_storage_bucket.features_delta_one : b.name],
    [for b in google_storage_bucket.features_volatility : b.name],
    [for b in google_storage_bucket.features_onchain : b.name],
    var.create_gcs_buckets ? [google_storage_bucket.ml_models_store[0].name] : [],
    var.create_gcs_buckets ? [google_storage_bucket.ml_predictions_store[0].name] : [],
    var.create_gcs_buckets ? [google_storage_bucket.ml_configs_store[0].name] : [],
    [for b in google_storage_bucket.strategy_store : b.name],
    [for b in google_storage_bucket.execution_store : b.name],
    var.create_gcs_buckets ? [google_storage_bucket.deployment_orchestration[0].name] : [],
  )
}
