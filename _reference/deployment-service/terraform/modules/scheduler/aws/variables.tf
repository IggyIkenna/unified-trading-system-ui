# Variables for AWS EventBridge Scheduler Module
# Mirrors GCP Cloud Scheduler interface for cloud-agnostic usage

variable "name" {
  description = "Name of the EventBridge Schedule"
  type        = string
}

variable "description" {
  description = "Description of the scheduler"
  type        = string
  default     = "Scheduled job managed by Terraform"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "schedule" {
  description = "Cron schedule expression (GCP format: '0 9 * * *' for 9am daily)"
  type        = string
}

variable "time_zone" {
  description = "Time zone for the schedule (e.g., 'UTC', 'America/New_York')"
  type        = string
  default     = "UTC"
}

variable "enabled" {
  description = "Whether the scheduler is enabled"
  type        = bool
  default     = true
}

# Target configuration
variable "target_job_name" {
  description = "Name of the AWS Batch Job to trigger"
  type        = string
}

variable "job_definition_arn" {
  description = "ARN of the Batch Job Definition to run"
  type        = string
}

variable "job_queue_name" {
  description = "Name of the Batch Job Queue"
  type        = string
}

variable "scheduler_role_arn" {
  description = "IAM role ARN for the scheduler to assume"
  type        = string
  default     = null
}

# Retry configuration
variable "retry_count" {
  description = "Number of retry attempts for failed invocations"
  type        = number
  default     = 3
}

variable "max_event_age_seconds" {
  description = "Maximum age of an event in seconds before it's dropped"
  type        = number
  default     = 3600
}

# Array job configuration
variable "array_size" {
  description = "Size of the array job (1 = single job)"
  type        = number
  default     = 1
}

# Dead letter queue
variable "dead_letter_queue_arn" {
  description = "ARN of the SQS queue for failed invocations"
  type        = string
  default     = null
}

# Schedule group
variable "schedule_group_name" {
  description = "Name of the schedule group"
  type        = string
  default     = "default"
}

variable "create_schedule_group" {
  description = "Create a new schedule group"
  type        = bool
  default     = false
}

# IAM role creation
variable "create_scheduler_role" {
  description = "Create IAM role for scheduler"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags to apply"
  type        = map(string)
  default     = {}
}

# GCP Compatibility Variables
variable "project_id" {
  description = "GCP Project ID (not used in AWS)"
  type        = string
  default     = null
}

variable "paused" {
  description = "Whether paused (maps to !enabled)"
  type        = bool
  default     = false
}

variable "scheduler_service_account_email" {
  description = "GCP Service Account (use scheduler_role_arn for AWS)"
  type        = string
  default     = null
}

variable "job_body" {
  description = "Optional JSON body (GCP compatibility)"
  type        = string
  default     = null
}

variable "max_retry_duration" {
  description = "Maximum retry duration (GCP compatibility)"
  type        = string
  default     = "3600s"
}

variable "min_backoff_duration" {
  description = "Minimum backoff duration (GCP compatibility)"
  type        = string
  default     = "5s"
}

variable "max_backoff_duration" {
  description = "Maximum backoff duration (GCP compatibility)"
  type        = string
  default     = "3600s"
}

variable "max_doublings" {
  description = "Maximum doublings (GCP compatibility)"
  type        = number
  default     = 5
}
