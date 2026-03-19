# Variables for AWS CodeBuild configuration

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "IggyIkenna"
}

variable "branch_pattern" {
  description = "Branch pattern to trigger builds (regex)"
  type        = string
  default     = "^refs/heads/main$"
}

variable "compute_type" {
  description = "CodeBuild compute type"
  type        = string
  default     = "BUILD_GENERAL1_MEDIUM"
  # Options: BUILD_GENERAL1_SMALL, BUILD_GENERAL1_MEDIUM, BUILD_GENERAL1_LARGE
}
