# Variables for AWS Batch Job Module
# Mirrors GCP Cloud Run Job module interface for cloud-agnostic usage

variable "name" {
  description = "Name of the Batch Job Definition"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "image" {
  description = "Docker image URL (e.g., 123456789.dkr.ecr.region.amazonaws.com/repo:tag)"
  type        = string
}

variable "vcpus" {
  description = "Number of vCPUs (e.g., '1', '2', '4')"
  type        = string
  default     = "2"
}

variable "memory_mb" {
  description = "Memory in MB (e.g., '2048', '4096', '8192')"
  type        = string
  default     = "4096"
}

variable "timeout_seconds" {
  description = "Maximum job execution time in seconds"
  type        = number
  default     = 3600
}

variable "max_retries" {
  description = "Maximum number of retries on failure"
  type        = number
  default     = 3
}

variable "environment_variables" {
  description = "Environment variables to set in the container"
  type        = map(string)
  default     = {}
}

variable "secret_environment_variables" {
  description = "Secret environment variables from AWS Secrets Manager"
  type = map(object({
    secret_arn = string
  }))
  default = {}
}

variable "command" {
  description = "Override the container command"
  type        = list(string)
  default     = []
}

variable "args" {
  description = "Command line arguments (appended to command)"
  type        = list(string)
  default     = []
}

variable "execution_role_arn" {
  description = "IAM role ARN for ECS task execution (pulling images, logs)"
  type        = string
}

variable "job_role_arn" {
  description = "IAM role ARN for the job (access to AWS services)"
  type        = string
}

variable "service_name" {
  description = "Service name for tagging"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "tags" {
  description = "Additional tags to apply"
  type        = map(string)
  default     = {}
}

# Networking
variable "subnet_ids" {
  description = "Subnet IDs for Fargate tasks"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "Security group IDs for Fargate tasks"
  type        = list(string)
  default     = []
}

variable "assign_public_ip" {
  description = "Assign public IP to Fargate tasks"
  type        = bool
  default     = true
}

# Logging
variable "log_group_name" {
  description = "CloudWatch log group name"
  type        = string
  default     = null
}

variable "create_log_group" {
  description = "Create CloudWatch log group"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}

# Compute Environment
variable "create_compute_environment" {
  description = "Create a new Batch compute environment"
  type        = bool
  default     = false
}

variable "compute_environment_arn" {
  description = "Existing compute environment ARN (if not creating new)"
  type        = string
  default     = null
}

variable "max_vcpus" {
  description = "Maximum vCPUs for the compute environment"
  type        = number
  default     = 16
}

variable "batch_service_role_arn" {
  description = "IAM role ARN for AWS Batch service"
  type        = string
  default     = null
}

# Job Queue
variable "create_job_queue" {
  description = "Create a new Batch job queue"
  type        = bool
  default     = false
}

variable "job_queue_arn" {
  description = "Existing job queue ARN (if not creating new)"
  type        = string
  default     = null
}

# GCP Compatibility Variables (for cloud-agnostic interface)
variable "project_id" {
  description = "GCP Project ID (not used in AWS, for interface compatibility)"
  type        = string
  default     = null
}

variable "service_account_email" {
  description = "GCP Service Account (use execution_role_arn for AWS)"
  type        = string
  default     = null
}

variable "cpu" {
  description = "CPU allocation string (GCP format like '2' - maps to vcpus)"
  type        = string
  default     = null
}

variable "memory" {
  description = "Memory allocation string (GCP format like '4Gi' - maps to memory_mb)"
  type        = string
  default     = null
}

variable "parallelism" {
  description = "Number of tasks to run in parallel (for interface compatibility)"
  type        = number
  default     = 1
}

variable "task_count" {
  description = "Total number of tasks (for interface compatibility)"
  type        = number
  default     = 1
}

variable "vpc_connector" {
  description = "GCP VPC connector (not used in AWS)"
  type        = string
  default     = null
}

variable "vpc_egress" {
  description = "GCP VPC egress (not used in AWS)"
  type        = string
  default     = null
}

variable "labels" {
  description = "GCP labels (maps to tags in AWS)"
  type        = map(string)
  default     = {}
}
