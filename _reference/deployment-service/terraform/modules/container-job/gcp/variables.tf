# Variables for GCP Cloud Run Job Module

variable "name" {
  description = "Name of the Cloud Run Job"
  type        = string
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region for all deployments (single-region with zone failover)"
  type        = string
  default     = "asia-northeast1"
}

variable "image" {
  description = "Docker image URL (e.g., asia-northeast1-docker.pkg.dev/project/repo/image:tag)"
  type        = string
}

variable "service_account_email" {
  description = "Service account email for the job"
  type        = string
}

variable "cpu" {
  description = "CPU allocation (e.g., '1', '2', '4')"
  type        = string
  default     = "2"
}

variable "memory" {
  description = "Memory allocation (e.g., '512Mi', '2Gi', '8Gi')"
  type        = string
  default     = "2Gi"
}

variable "timeout_seconds" {
  description = "Maximum job execution time in seconds (max 86400 = 24 hours)"
  type        = number
  default     = 3600  # 1 hour
}

variable "max_retries" {
  description = "Maximum number of retries on failure"
  type        = number
  default     = 3
}

variable "parallelism" {
  description = "Number of tasks to run in parallel"
  type        = number
  default     = 1
}

variable "task_count" {
  description = "Total number of tasks"
  type        = number
  default     = 1
}

variable "environment_variables" {
  description = "Environment variables to set in the container"
  type        = map(string)
  default     = {}
}

variable "secret_environment_variables" {
  description = "Secret environment variables from Secret Manager"
  type = map(object({
    secret_name = string
    version     = string
  }))
  default = {}
}

variable "command" {
  description = "Override the container entrypoint command"
  type        = list(string)
  default     = []
}

variable "args" {
  description = "Command line arguments to pass to the container"
  type        = list(string)
  default     = []
}

variable "vpc_connector" {
  description = "VPC connector for private networking (optional)"
  type        = string
  default     = null
}

variable "vpc_egress" {
  description = "VPC egress setting (all-traffic or private-ranges-only)"
  type        = string
  default     = "private-ranges-only"
}

variable "service_name" {
  description = "Service name for labeling"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "labels" {
  description = "Additional labels to apply to the job"
  type        = map(string)
  default     = {}
}

variable "gcs_volumes" {
  description = "List of GCS buckets to mount as volumes (FUSE). Each object: { name, bucket, read_only }"
  type = list(object({
    name      = string
    bucket    = string
    read_only = bool
  }))
  default = []
}
