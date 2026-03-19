# Variables for instruments-service Terraform configuration

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
  default     = "instruments-service-daily-v2"
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
  default     = "4Gi"
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
  description = "GCS bucket for CEFI instruments"
  type        = string
  default     = "instruments-store-cefi-{project_id}"
}

variable "gcs_bucket_tradfi" {
  description = "GCS bucket for TRADFI instruments"
  type        = string
  default     = "instruments-store-tradfi-{project_id}"
}

variable "gcs_bucket_defi" {
  description = "GCS bucket for DEFI instruments"
  type        = string
  default     = "instruments-store-defi-{project_id}"
}

# Workflow Configuration
variable "workflow_name" {
  description = "Name of the daily Cloud Workflow"
  type        = string
  default     = "instruments-service-daily"
}

variable "backfill_workflow_name" {
  description = "Name of the backfill Cloud Workflow"
  type        = string
  default     = "instruments-service-backfill"
}

variable "live_workflow_name" {
  description = "Name of the live mode Cloud Workflow"
  type        = string
  default     = "instruments-service-live"
}

variable "live_schedule" {
  description = "Cron schedule for live mode (default: every 15 min to avoid wasting compute)"
  type        = string
  default     = "*/15 * * * *"
}

# Scheduler Configuration (for workflow trigger)
variable "scheduler_name" {
  description = "Name of the Cloud Scheduler job"
  type        = string
  default     = "instruments-service-scheduler"
}

variable "schedule" {
  description = "Cron schedule (default: 9:00 AM UTC daily)"
  type        = string
  default     = "0 9 * * *"
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
