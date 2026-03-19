# Variables for market-data-processing-service Terraform configuration

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
  default     = "market-data-processing-service-job"
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

# Workflow Configuration
variable "workflow_name" {
  description = "Name of the daily Cloud Workflow"
  type        = string
  default     = "market-data-processing-service-daily"
}

variable "backfill_workflow_name" {
  description = "Name of the backfill Cloud Workflow"
  type        = string
  default     = "market-data-processing-service-backfill"
}

# Scheduler Configuration
variable "schedule" {
  description = "Cron schedule (default: 10:00 AM UTC daily - after tick data handler)"
  type        = string
  default     = "0 10 * * *"
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
