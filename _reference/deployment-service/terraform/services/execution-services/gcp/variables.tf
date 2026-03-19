# Variables for execution-services Terraform configuration

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
  default     = "execution-services-job"
}

variable "docker_image" {
  description = "Docker image URL"
  type        = string
}

variable "service_account_email" {
  description = "Service account email for the job"
  type        = string
}

# Heavy tick-by-tick simulation workload
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
  description = "Job timeout in seconds (4 hours for execution)"
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

# Domain-specific execution buckets
variable "execution_bucket_cefi" {
  description = "GCS bucket for CEFI execution results"
  type        = string
  default     = "execution-store-cefi-{project_id}"
}

variable "execution_bucket_tradfi" {
  description = "GCS bucket for TRADFI execution results"
  type        = string
  default     = "execution-store-tradfi-{project_id}"
}

variable "execution_bucket_defi" {
  description = "GCS bucket for DEFI execution results"
  type        = string
  default     = "execution-store-defi-{project_id}"
}

variable "workflow_name" {
  description = "Name of the daily Cloud Workflow"
  type        = string
  default     = "execution-services-daily"
}

variable "backfill_workflow_name" {
  description = "Name of the backtest Cloud Workflow"
  type        = string
  default     = "execution-services-backtest"
}

variable "schedule" {
  description = "Cron schedule (default: 16:00 PM UTC - after strategy)"
  type        = string
  default     = "0 16 * * *"
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
