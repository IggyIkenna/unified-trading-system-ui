# Variables for market-data-api on AWS

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "job_name" {
  description = "Name of the Batch Job"
  type        = string
  default     = "market-data-api"
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
  default     = "4096"
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

variable "tick_bucket_cefi" {
  description = "S3 bucket for CEFI tick data"
  type        = string
}

variable "tick_bucket_tradfi" {
  description = "S3 bucket for TRADFI tick data"
  type        = string
}

variable "tick_bucket_defi" {
  description = "S3 bucket for DEFI tick data"
  type        = string
}

variable "api_cache_bucket" {
  description = "S3 bucket for market data API cache"
  type        = string
}

variable "live_workflow_name" {
  description = "Name of the live cache refresh Step Functions workflow"
  type        = string
  default     = "market-data-api-live"
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
