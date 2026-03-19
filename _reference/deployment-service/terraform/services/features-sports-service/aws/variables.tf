# Variables for features-sports-service on AWS

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "job_name" {
  description = "Name of the Batch Job"
  type        = string
  default     = "features-sports-service"
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

variable "features_bucket" {
  description = "S3 bucket for sports features output"
  type        = string
}

variable "betfair_app_key_secret_arn" {
  description = "ARN of Secrets Manager secret for Betfair app key"
  type        = string
}

variable "odds_api_key_secret_arn" {
  description = "ARN of Secrets Manager secret for Odds API key"
  type        = string
}

variable "oddsjam_api_key_secret_arn" {
  description = "ARN of Secrets Manager secret for OddsJam API key"
  type        = string
}

variable "opticodds_api_key_secret_arn" {
  description = "ARN of Secrets Manager secret for OpticOdds API key"
  type        = string
}

variable "workflow_name" {
  description = "Name of the Step Functions workflow"
  type        = string
  default     = "features-sports-service-daily"
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
