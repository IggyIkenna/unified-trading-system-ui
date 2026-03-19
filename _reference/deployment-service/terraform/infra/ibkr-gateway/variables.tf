variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment: prod or paper"
  type        = string
  default     = "prod"
}

variable "service_account_email" {
  description = "Service account email for the VM"
  type        = string
}
