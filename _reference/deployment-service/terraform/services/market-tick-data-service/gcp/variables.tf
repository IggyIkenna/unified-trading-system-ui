# Variables for market-tick-data-service Terraform configuration

# Cloud Provider Selection
variable "cloud_provider" {
  description = "Cloud provider to deploy to (gcp or aws)"
  type        = string
  default     = "gcp"

  validation {
    condition     = contains(["gcp", "aws"], var.cloud_provider)
    error_message = "Cloud provider must be 'gcp' or 'aws'."
  }
}

# GCP Configuration
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

# Job Configuration
variable "job_name" {
  description = "Name of the Cloud Run Job"
  type        = string
  default     = "market-tick-handler-daily-v2"
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
  default     = "4"
}

variable "memory" {
  description = "Memory allocation"
  type        = string
  default     = "16Gi"
}

variable "timeout_seconds" {
  description = "Job timeout in seconds"
  type        = number
  default     = 86400  # 24 hours (maximum)
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

# GCS Bucket Configuration
variable "gcs_bucket_cefi" {
  description = "GCS bucket for CEFI market data"
  type        = string
  default     = "market-data-tick-cefi-{project_id}"
}

variable "gcs_bucket_tradfi" {
  description = "GCS bucket for TRADFI market data"
  type        = string
  default     = "market-data-tick-tradfi-{project_id}"
}

variable "gcs_bucket_defi" {
  description = "GCS bucket for DEFI market data"
  type        = string
  default     = "market-data-tick-defi-{project_id}"
}

# Workflow Configuration
variable "daily_workflow_name" {
  description = "Name of the daily T+1 workflow"
  type        = string
  default     = "market-tick-daily"
}

variable "backfill_workflow_name" {
  description = "Name of the backfill workflow"
  type        = string
  default     = "market-tick-backfill"
}

# Scheduler Configuration
variable "scheduler_name" {
  description = "Name of the Cloud Scheduler job"
  type        = string
  default     = "market-tick-trigger"
}

variable "schedule" {
  description = "Cron schedule (default: 9:30 AM UTC daily)"
  type        = string
  default     = "30 9 * * *"
}

variable "time_zone" {
  description = "Time zone for the schedule"
  type        = string
  default     = "UTC"
}

variable "scheduler_paused" {
  description = "Whether to pause the scheduler initially"
  type        = bool
  default     = false
}

variable "scheduler_service_account_email" {
  description = "Service account for Cloud Scheduler"
  type        = string
}
