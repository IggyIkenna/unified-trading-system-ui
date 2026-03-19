# Variables for ml-inference-service on AWS

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

# Job Configuration
variable "job_name" {
  description = "Name of the Batch Job"
  type        = string
  default     = "ml-inference-service"
}

variable "docker_image" {
  description = "Docker image URL in ECR"
  type        = string
}

variable "vcpus" {
  description = "vCPUs for the job"
  type        = string
  default     = "4"
}

variable "memory_mb" {
  description = "Memory in MB"
  type        = string
  default     = "8192"
}

variable "timeout_seconds" {
  description = "Job timeout in seconds"
  type        = number
  default     = 3600
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

# IAM Roles
variable "execution_role_arn" {
  description = "ECS task execution role ARN"
  type        = string
}

variable "job_role_arn" {
  description = "Job role ARN"
  type        = string
}

# Networking
variable "subnet_ids" {
  description = "Subnet IDs for Fargate tasks"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
}

variable "job_queue_arn" {
  description = "Batch job queue ARN"
  type        = string
}

# S3 Buckets
variable "ml_models_bucket" {
  description = "S3 bucket for ML models (input)"
  type        = string
}

variable "ml_predictions_bucket" {
  description = "S3 bucket for ML predictions (output)"
  type        = string
}

variable "features_bucket" {
  description = "S3 bucket for features input"
  type        = string
}

# Workflow Configuration
variable "workflow_name" {
  description = "Name of the Step Functions workflow"
  type        = string
  default     = "ml-inference-service-daily"
}

# Scheduler Configuration
variable "schedule" {
  description = "Cron schedule"
  type        = string
  default     = "0 13 * * *"
}

variable "time_zone" {
  description = "Time zone for the schedule"
  type        = string
  default     = "UTC"
}
