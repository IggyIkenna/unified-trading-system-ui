# Variables for AWS Step Functions Module
# Mirrors GCP Cloud Workflows interface for cloud-agnostic usage

variable "name" {
  description = "Name of the Step Functions state machine"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "description" {
  description = "Description of the workflow"
  type        = string
  default     = ""
}

variable "definition" {
  description = "Amazon States Language (ASL) definition of the state machine"
  type        = string
}

variable "express_workflow" {
  description = "Use EXPRESS workflow type (for short-lived, high-volume workloads)"
  type        = bool
  default     = false
}

# IAM Configuration
variable "role_arn" {
  description = "IAM role ARN for Step Functions execution"
  type        = string
  default     = null
}

variable "create_role" {
  description = "Create IAM role for Step Functions"
  type        = bool
  default     = true
}

# Logging Configuration
variable "log_group_arn" {
  description = "CloudWatch Log Group ARN for workflow logs"
  type        = string
  default     = null
}

variable "create_log_group" {
  description = "Create CloudWatch Log Group"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}

variable "log_level" {
  description = "Log level (OFF, ALL, ERROR, FATAL)"
  type        = string
  default     = "ERROR"
}

variable "log_include_execution_data" {
  description = "Include execution data in logs"
  type        = bool
  default     = false
}

# Tracing
variable "enable_xray_tracing" {
  description = "Enable AWS X-Ray tracing"
  type        = bool
  default     = false
}

# Scheduler Configuration
variable "schedule" {
  description = "Cron schedule (GCP format: '0 9 * * *' for 9am daily). Null = no scheduler."
  type        = string
  default     = null
}

variable "time_zone" {
  description = "Time zone for the scheduler"
  type        = string
  default     = "UTC"
}

variable "scheduler_role_arn" {
  description = "IAM role ARN for EventBridge Scheduler"
  type        = string
  default     = null
}

variable "create_scheduler_role" {
  description = "Create IAM role for scheduler"
  type        = bool
  default     = true
}

variable "workflow_args" {
  description = "Arguments to pass to the workflow when triggered by scheduler"
  type        = map(any)
  default     = {}
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# GCP Compatibility Variables
variable "project_id" {
  description = "GCP Project ID (not used in AWS)"
  type        = string
  default     = null
}

variable "service_account_email" {
  description = "GCP Service Account (use role_arn for AWS)"
  type        = string
  default     = null
}

variable "scheduler_service_account_email" {
  description = "GCP Scheduler Service Account (use scheduler_role_arn for AWS)"
  type        = string
  default     = null
}

variable "workflow_source" {
  description = "GCP workflow YAML source (use definition for AWS ASL JSON)"
  type        = string
  default     = null
}

variable "labels" {
  description = "GCP labels (maps to tags in AWS)"
  type        = map(string)
  default     = {}
}
