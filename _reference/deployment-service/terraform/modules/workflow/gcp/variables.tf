# Variables for Cloud Workflow Module

variable "name" {
  description = "Name of the Cloud Workflow"
  type        = string
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region for the workflow"
  type        = string
}

variable "description" {
  description = "Description of the workflow"
  type        = string
  default     = ""
}

variable "service_account_email" {
  description = "Service account email for workflow execution"
  type        = string
}

variable "workflow_source" {
  description = "YAML source content of the workflow definition"
  type        = string
}

variable "schedule" {
  description = "Cron schedule to trigger the workflow (optional, null = no scheduler)"
  type        = string
  default     = null
}

variable "time_zone" {
  description = "Time zone for the scheduler"
  type        = string
  default     = "UTC"
}

variable "scheduler_service_account_email" {
  description = "Service account for Cloud Scheduler to invoke workflow"
  type        = string
  default     = null
}

variable "workflow_args" {
  description = "Arguments to pass to the workflow when triggered by scheduler"
  type        = map(any)
  default     = {}
}

variable "labels" {
  description = "Labels to apply to the workflow"
  type        = map(string)
  default     = {}
}
