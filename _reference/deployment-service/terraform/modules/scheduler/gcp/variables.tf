# Variables for GCP Cloud Scheduler Module

variable "name" {
  description = "Name of the Cloud Scheduler job"
  type        = string
}

variable "description" {
  description = "Description of the scheduler job"
  type        = string
  default     = "Scheduled job managed by Terraform"
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region for the scheduler"
  type        = string
  default     = "asia-northeast1"
}

variable "schedule" {
  description = "Cron schedule expression (e.g., '0 9 * * *' for 9am daily)"
  type        = string
}

variable "time_zone" {
  description = "Time zone for the schedule (e.g., 'UTC', 'America/New_York')"
  type        = string
  default     = "UTC"
}

variable "paused" {
  description = "Whether the scheduler is paused"
  type        = bool
  default     = false
}

variable "target_job_name" {
  description = "Name of the Cloud Run Job to trigger"
  type        = string
}

variable "scheduler_service_account_email" {
  description = "Service account email for the scheduler to use when invoking the job"
  type        = string
}

variable "job_body" {
  description = "Optional JSON body to pass to the job"
  type        = string
  default     = null
}

# Retry configuration
variable "retry_count" {
  description = "Number of retry attempts for failed invocations"
  type        = number
  default     = 3
}

variable "max_retry_duration" {
  description = "Maximum duration for retries (e.g., '3600s')"
  type        = string
  default     = "3600s"
}

variable "min_backoff_duration" {
  description = "Minimum backoff duration (e.g., '5s')"
  type        = string
  default     = "5s"
}

variable "max_backoff_duration" {
  description = "Maximum backoff duration (e.g., '3600s')"
  type        = string
  default     = "3600s"
}

variable "max_doublings" {
  description = "Maximum number of times backoff will double"
  type        = number
  default     = 5
}
