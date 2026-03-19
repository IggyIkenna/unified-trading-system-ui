# Outputs for GCP Shared Infrastructure deployment

output "artifact_registry_repositories" {
  description = "Map of service names to Artifact Registry repository URLs"
  value       = module.shared_infrastructure.artifact_registry_repositories
}

output "features_delta_one_buckets" {
  description = "Map of category to features-delta-one bucket names"
  value       = module.shared_infrastructure.features_delta_one_buckets
}

output "features_volatility_buckets" {
  description = "Map of category to features-volatility bucket names"
  value       = module.shared_infrastructure.features_volatility_buckets
}

output "features_onchain_buckets" {
  description = "Map of category to features-onchain bucket names"
  value       = module.shared_infrastructure.features_onchain_buckets
}

output "ml_models_store_bucket" {
  description = "ML models store bucket name"
  value       = module.shared_infrastructure.ml_models_store_bucket
}

output "ml_predictions_store_bucket" {
  description = "ML predictions store bucket name"
  value       = module.shared_infrastructure.ml_predictions_store_bucket
}

output "ml_configs_store_bucket" {
  description = "ML configs store bucket name"
  value       = module.shared_infrastructure.ml_configs_store_bucket
}

output "strategy_store_buckets" {
  description = "Map of domain to strategy-store bucket names"
  value       = module.shared_infrastructure.strategy_store_buckets
}

output "execution_store_buckets" {
  description = "Map of domain to execution-store bucket names"
  value       = module.shared_infrastructure.execution_store_buckets
}

output "deployment_orchestration_bucket" {
  description = "Deployment orchestration state bucket name"
  value       = module.shared_infrastructure.deployment_orchestration_bucket
}

output "batch_processing_service_account_email" {
  description = "Email of the batch processing service account"
  value       = module.shared_infrastructure.batch_processing_service_account_email
}

output "all_bucket_names" {
  description = "List of all created bucket names"
  value       = module.shared_infrastructure.all_bucket_names
}
