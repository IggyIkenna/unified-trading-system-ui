# Variables for Cloud Build Module

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-northeast1"
}

variable "service_name" {
  description = "Name of the service"
  type        = string
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "IggyIkenna"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "connection_name" {
  description = "Cloud Build 2nd-gen connection name"
  type        = string
  default     = "iggyikenna-github"
}

variable "branch_pattern" {
  description = "Branch pattern to trigger builds"
  type        = string
  default     = "^main$"
}

variable "artifact_registry_repo" {
  description = "Artifact Registry repository name"
  type        = string
}

variable "dockerfile_path" {
  description = "Path to Dockerfile"
  type        = string
  default     = "Dockerfile"
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

variable "service_account_id" {
  description = "Service account ID for Cloud Build"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags for the build trigger"
  type        = list(string)
  default     = []
}
