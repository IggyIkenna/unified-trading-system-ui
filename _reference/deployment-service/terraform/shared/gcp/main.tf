# Terraform configuration for GCP Shared Infrastructure
# Creates all GCS buckets, Artifact Registry repos, and service accounts

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
  }

  backend "gcs" {
    bucket = "terraform-state-{project_id}"
    prefix = "shared-infrastructure"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "shared_infrastructure" {
  source = "../../modules/shared-infrastructure/gcp"

  project_id   = var.project_id
  region       = var.region
  gcs_location = var.gcs_location

  create_artifact_registry = var.create_artifact_registry
  create_gcs_buckets       = var.create_gcs_buckets
  create_service_accounts  = var.create_service_accounts

  services = [
    "instruments-service",
    "market-tick-data-service",
    "market-data-processing-service",
    "features-delta-one-service",
    "features-volatility-service",
    "features-onchain-service",
    "features-calendar-service",
    "ml-training-service",
    "ml-inference-service",
    "strategy-service",
    "execution-service",
    "pnl-attribution-service",
    "position-balance-monitor-service",
    "risk-and-exposure-service",
    "alerting-service",
    "execution-results-api",
    "market-data-api",
    "client-reporting-api",
  ]

  labels = {
    "environment" = var.environment
    "project"     = "unified-trading"
    "managed-by"  = "terraform"
  }
}
