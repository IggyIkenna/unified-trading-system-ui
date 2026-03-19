# Variables for market-tick-data-service on AWS

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

# Job Configuration
variable "job_name" {
  description = "Name of the Batch Job"
  type        = string
  default     = "market-tick-data-service"
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
  default     = 43200  # 12 hours
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
variable "s3_bucket_cefi" {
  description = "S3 bucket for CEFI market data"
  type        = string
}

variable "s3_bucket_tradfi" {
  description = "S3 bucket for TRADFI market data"
  type        = string
}

variable "s3_bucket_defi" {
  description = "S3 bucket for DEFI market data"
  type        = string
}

# Secrets
variable "tardis_secret_arn" {
  description = "ARN of Tardis API key secret"
  type        = string
}

variable "databento_secret_arn" {
  description = "ARN of Databento API key secret"
  type        = string
}

# Workflow Configuration
variable "daily_workflow_name" {
  description = "Name of the daily Step Functions workflow"
  type        = string
  default     = "market-tick-daily"
}

variable "backfill_workflow_name" {
  description = "Name of the backfill Step Functions workflow"
  type        = string
  default     = "market-tick-backfill"
}

# Scheduler Configuration
variable "schedule" {
  description = "Cron schedule"
  type        = string
  default     = "0 9 * * *"  # 9:00 AM UTC daily
}

variable "time_zone" {
  description = "Time zone for the schedule"
  type        = string
  default     = "UTC"
}
