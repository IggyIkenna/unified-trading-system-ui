# Variables for execution-services on AWS

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

# Job Configuration
variable "job_name" {
  description = "Name of the Batch Job"
  type        = string
  default     = "execution-services"
}

variable "docker_image" {
  description = "Docker image URL in ECR"
  type        = string
}

variable "vcpus" {
  description = "vCPUs for the job"
  type        = string
  default     = "8"
}

variable "memory_mb" {
  description = "Memory in MB"
  type        = string
  default     = "16384"
}

variable "timeout_seconds" {
  description = "Job timeout in seconds"
  type        = number
  default     = 14400  # 4 hours
}

variable "max_retries" {
  description = "Maximum retry attempts"
  type        = number
  default     = 2
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

# S3 Buckets - Execution output
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

# S3 Buckets - Tick data input
variable "tick_data_bucket_cefi" {
  description = "S3 bucket for CEFI tick data"
  type        = string
}

variable "tick_data_bucket_tradfi" {
  description = "S3 bucket for TRADFI tick data"
  type        = string
}

variable "tick_data_bucket_defi" {
  description = "S3 bucket for DEFI tick data"
  type        = string
}

# S3 Buckets - Strategy signals input
variable "strategy_bucket_cefi" {
  description = "S3 bucket for CEFI strategy signals"
  type        = string
}

variable "strategy_bucket_tradfi" {
  description = "S3 bucket for TRADFI strategy signals"
  type        = string
}

variable "strategy_bucket_defi" {
  description = "S3 bucket for DEFI strategy signals"
  type        = string
}

# Workflow Configuration
variable "workflow_name" {
  description = "Name of the Step Functions workflow"
  type        = string
  default     = "execution-services-daily"
}

# Scheduler Configuration
variable "schedule" {
  description = "Cron schedule"
  type        = string
  default     = "0 15 * * *"
}

variable "time_zone" {
  description = "Time zone for the schedule"
  type        = string
  default     = "UTC"
}
