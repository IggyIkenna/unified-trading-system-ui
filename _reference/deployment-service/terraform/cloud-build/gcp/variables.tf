# Variables for Cloud Build triggers deployment

variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "{project_id}"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-northeast1"
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "IggyIkenna"
}

variable "branch_pattern" {
  description = "Branch pattern to trigger builds"
  type        = string
  default     = "^main$"
}

variable "machine_type" {
  description = "Cloud Build machine type"
  type        = string
  default     = "E2_HIGHCPU_8"
}

variable "timeout" {
  description = "Build timeout"
  type        = string
  default     = "1800s"
}

variable "cloud_build_service_account" {
  description = "Service account email for Cloud Build"
  type        = string
  default     = ""
}
