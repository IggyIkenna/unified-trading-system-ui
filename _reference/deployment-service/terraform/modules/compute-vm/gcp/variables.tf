# Variables for GCP Compute VM Module
#
# Designed to mirror container-job interface where possible,
# making it easy to switch between Cloud Run and VM backends.

# ============================================================
# Core Configuration (mirrors container-job)
# ============================================================

variable "name" {
  description = "Base name for the VM instance (will be suffixed with timestamp)"
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

variable "zone" {
  description = "GCP zone for the VM (must be in the specified region)"
  type        = string
  default     = "asia-northeast1-a"
}

variable "image" {
  description = "Docker image URL (e.g., asia-northeast1-docker.pkg.dev/project/repo/image:tag)"
  type        = string
}

variable "service_account_email" {
  description = "Service account email for the VM"
  type        = string
}

# ============================================================
# VM-Specific Configuration
# ============================================================

variable "machine_type" {
  description = "GCE machine type (e.g., c2-standard-4, c2-standard-8, c2-standard-16)"
  type        = string
  default     = "c2-standard-4"
}

variable "disk_size_gb" {
  description = "Boot disk size in GB"
  type        = number
  default     = 50
}

variable "preemptible" {
  description = "Use preemptible VM (80% cost savings, may be terminated). NOTE: PREEMPTIBLE_CPUS quota is only 16 in asia-northeast1, use non-preemptible for parallel deployments."
  type        = bool
  default     = false
}

variable "spot" {
  description = "Use Spot VM (newer version of preemptible, same cost savings)"
  type        = bool
  default     = false
}

variable "self_delete" {
  description = "VM self-deletes after container completes"
  type        = bool
  default     = true
}

variable "timeout_seconds" {
  description = "Maximum job execution time before self-termination (0 = no limit)"
  type        = number
  default     = 0  # No limit by default (unlike Cloud Run)
}

variable "delete_batch_index" {
  description = "Batch index for staggered self-delete (0-199); batch N waits N*delete_batch_delay_seconds before deleting"
  type        = number
  default     = 0
}

variable "delete_batch_delay_seconds" {
  description = "Delay in seconds between delete batches (batch N waits N*this before deleting)"
  type        = number
  default     = 45
}

# ============================================================
# Container Configuration (mirrors container-job)
# ============================================================

variable "environment_variables" {
  description = "Environment variables to set in the container"
  type        = map(string)
  default     = {}
}

variable "secret_environment_variables" {
  description = "Secret environment variables from Secret Manager (secret_name -> env_var_name)"
  type = map(object({
    secret_name = string
    version     = string
  }))
  default = {}
}

variable "args" {
  description = "Command line arguments to pass to the container"
  type        = list(string)
  default     = []
}

# ============================================================
# State & Status Configuration
# ============================================================

variable "status_bucket" {
  description = "GCS bucket to write completion status (optional)"
  type        = string
  default     = ""
}

variable "status_prefix" {
  description = "GCS prefix for status files (e.g., deployments/service-name)"
  type        = string
  default     = ""
}

variable "deployment_id" {
  description = "Deployment ID for tracking (optional)"
  type        = string
  default     = ""
}

variable "shard_id" {
  description = "Shard ID for tracking (optional)"
  type        = string
  default     = ""
}

# ============================================================
# Labeling & Metadata (mirrors container-job)
# ============================================================

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
  description = "Additional labels to apply to the VM"
  type        = map(string)
  default     = {}
}

# ============================================================
# Networking (optional)
# ============================================================

variable "network" {
  description = "VPC network name (default uses default network)"
  type        = string
  default     = "default"
}

variable "subnetwork" {
  description = "VPC subnetwork name (optional)"
  type        = string
  default     = ""
}

variable "external_ip" {
  description = "Assign external IP (required for pulling from Artifact Registry without VPC)"
  type        = bool
  default     = true
}
