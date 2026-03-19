# Variables for GCP Shared Infrastructure deployment

variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "{project_id}"
}

variable "region" {
  description = "GCP region for all deployments (single-region with zone failover)"
  type        = string
  default     = "asia-northeast1"
}

variable "gcs_location" {
  description = "GCS bucket location"
  type        = string
  default     = "asia-northeast1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "create_artifact_registry" {
  description = "Whether to create Artifact Registry repositories"
  type        = bool
  default     = true
}

variable "create_gcs_buckets" {
  description = "Whether to create GCS buckets"
  type        = bool
  default     = true
}

variable "create_service_accounts" {
  description = "Whether to create service accounts"
  type        = bool
  default     = true
}
