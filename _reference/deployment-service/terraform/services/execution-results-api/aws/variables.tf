# Variables for execution-results-api on AWS

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "job_name" {
  description = "Name of the Batch Job"
  type        = string
  default     = "execution-results-api"
}

variable "docker_image" {
  description = "Docker image URL in ECR"
  type        = string
}

variable "vcpus" {
  description = "vCPUs for the job"
  type        = string
  default     = "2"
}

variable "memory_mb" {
  description = "Memory in MB"
  type        = string
  default     = "2048"
}

variable "timeout_seconds" {
  description = "Job timeout in seconds"
  type        = number
  default     = 840
}

variable "max_retries" {
  description = "Maximum retry attempts"
  type        = number
  default     = 1
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "execution_role_arn" {
  description = "ECS task execution role ARN"
  type        = string
}

variable "job_role_arn" {
  description = "Job role ARN"
  type        = string
}

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

variable "execution_bucket_cefi" {
  description = "S3 bucket for CEFI execution results"
  type        = string
}

variable "execution_bucket_tradfi" {
  description = "S3 bucket for TRADFI execution results"
  type        = string
}

variable "execution_bucket_defi" {
  description = "S3 bucket for DEFI execution results"
  type        = string
}

variable "results_cache_bucket" {
  description = "S3 bucket for execution results cache"
  type        = string
}

variable "live_workflow_name" {
  description = "Name of the live cache refresh Step Functions workflow"
  type        = string
  default     = "execution-results-api-live"
}

variable "live_schedule" {
  description = "Cron schedule for cache refresh"
  type        = string
  default     = "rate(15 minutes)"
}

variable "time_zone" {
  description = "Time zone for the schedule"
  type        = string
  default     = "UTC"
}
