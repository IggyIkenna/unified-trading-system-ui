# Variables for strategy-service Terraform configuration

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
  default     = "strategy-service-job"
}

variable "docker_image" {
  description = "Docker image URL"
  type        = string
}

variable "service_account_email" {
  description = "Service account email for the job"
  type        = string
}

variable "cpu" {
  description = "CPU allocation"
  type        = string
  default     = "2"
}

variable "memory" {
  description = "Memory allocation"
  type        = string
  default     = "8Gi"
}

variable "timeout_seconds" {
  description = "Job timeout in seconds"
  type        = number
  default     = 86400
}

variable "max_retries" {
  description = "Maximum retry attempts"
  type        = number
  default     = 3
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Domain-specific buckets
variable "strategy_bucket_cefi" {
  description = "GCS bucket for CEFI strategies"
  type        = string
  default     = "strategy-store-cefi-{project_id}"
}

variable "strategy_bucket_tradfi" {
  description = "GCS bucket for TRADFI strategies"
  type        = string
  default     = "strategy-store-tradfi-{project_id}"
}

variable "strategy_bucket_defi" {
  description = "GCS bucket for DEFI strategies"
  type        = string
  default     = "strategy-store-defi-{project_id}"
}

variable "workflow_name" {
  description = "Name of the daily Cloud Workflow"
  type        = string
  default     = "strategy-service-daily"
}

variable "backfill_workflow_name" {
  description = "Name of the backtest Cloud Workflow"
  type        = string
  default     = "strategy-service-backtest"
}

variable "schedule" {
  description = "Cron schedule (default: 15:00 PM UTC - after inference)"
  type        = string
  default     = "0 15 * * *"
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
