# Variables for features-onchain-service on AWS
# Note: TRADFI not supported (no on-chain data)

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

# Job Configuration
variable "job_name" {
  description = "Name of the Batch Job"
  type        = string
  default     = "features-onchain-service"
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
  default     = "4096"
}

variable "timeout_seconds" {
  description = "Job timeout in seconds"
  type        = number
  default     = 1800
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

# S3 Buckets - Input (candles)
# Note: Only CEFI and DEFI - no TRADFI (no on-chain data)
variable "s3_bucket_cefi" {
  description = "S3 bucket for CEFI candles"
  type        = string
}

variable "s3_bucket_defi" {
  description = "S3 bucket for DEFI candles"
  type        = string
}

# S3 Buckets - Output (onchain features)
variable "features_bucket_cefi" {
  description = "S3 bucket for CEFI onchain features"
  type        = string
}

variable "features_bucket_defi" {
  description = "S3 bucket for DEFI onchain features"
  type        = string
}

# Secrets
variable "alchemy_secret_arn" {
  description = "ARN of Alchemy API key secret"
  type        = string
}

variable "graph_secret_arn" {
  description = "ARN of The Graph API key secret"
  type        = string
}

# Workflow Configuration
variable "workflow_name" {
  description = "Name of the Step Functions workflow"
  type        = string
  default     = "features-onchain-service-daily"
}

# Scheduler Configuration
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
