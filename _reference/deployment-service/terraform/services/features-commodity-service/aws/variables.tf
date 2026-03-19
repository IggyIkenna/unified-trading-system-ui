# Variables for features-commodity-service on AWS

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "job_name" {
  description = "Name of the Batch Job"
  type        = string
  default     = "features-commodity-service"
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

variable "s3_bucket_cefi" {
  description = "S3 bucket for CEFI tick data"
  type        = string
}

variable "s3_bucket_tradfi" {
  description = "S3 bucket for TRADFI tick data"
  type        = string
}

variable "features_bucket_cefi" {
  description = "S3 bucket for CEFI commodity features"
  type        = string
}

variable "features_bucket_tradfi" {
  description = "S3 bucket for TRADFI commodity features"
  type        = string
}

variable "workflow_name" {
  description = "Name of the Step Functions workflow"
  type        = string
  default     = "features-commodity-service-daily"
}

variable "schedule" {
  description = "Cron schedule"
  type        = string
  default     = "30 10 * * *"
}

variable "time_zone" {
  description = "Time zone for the schedule"
  type        = string
  default     = "UTC"
}
