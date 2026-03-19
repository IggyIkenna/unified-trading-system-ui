# Variables for ml-training-service Terraform configuration

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-northeast1"
}

variable "gcs_location" {
  description = "GCS location"
  type        = string
  default     = "asia-northeast1"
}

variable "job_name" {
  description = "Name of the Cloud Run Job"
  type        = string
  default     = "ml-training-service-job"
}

variable "docker_image" {
  description = "Docker image URL"
  type        = string
}

variable "service_account_email" {
  description = "Service account email for the job"
  type        = string
}

# Heavy ML workload - needs more resources
variable "cpu" {
  description = "CPU allocation"
  type        = string
  default     = "4"
}

variable "memory" {
  description = "Memory allocation"
  type        = string
  default     = "16Gi"
}

variable "timeout_seconds" {
  description = "Job timeout in seconds (4 hours for training)"
  type        = number
  default     = 14400
}

variable "max_retries" {
  description = "Maximum retry attempts"
  type        = number
  default     = 2
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# ML-specific buckets
variable "ml_models_bucket" {
  description = "GCS bucket for ML models"
  type        = string
  default     = "ml-models-store-{project_id}"
}

variable "ml_configs_bucket" {
  description = "GCS bucket for ML configs"
  type        = string
  default     = "ml-configs-store-{project_id}"
}

variable "workflow_name" {
  description = "Name of the daily Cloud Workflow"
  type        = string
  default     = "ml-training-service-daily"
}

variable "backfill_workflow_name" {
  description = "Name of the full training Cloud Workflow"
  type        = string
  default     = "ml-training-service-full"
}

variable "schedule" {
  description = "Cron schedule (default: 12:00 PM UTC - after features)"
  type        = string
  default     = "0 12 * * *"
}

variable "time_zone" {
  description = "Time zone for the schedule"
  type        = string
  default     = "UTC"
}

variable "scheduler_service_account_email" {
  description = "Service account for Cloud Scheduler"
  type        = string
}
