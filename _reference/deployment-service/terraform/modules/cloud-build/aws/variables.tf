# Variables for AWS CodeBuild Module

variable "name" {
  description = "Name of the CodeBuild project"
  type        = string
}

variable "description" {
  description = "Description of the build project"
  type        = string
  default     = ""
}

variable "source_type" {
  description = "Source type (GITHUB, GITHUB_ENTERPRISE, CODECOMMIT, S3)"
  type        = string
  default     = "GITHUB"
}

variable "source_location" {
  description = "Source repository URL"
  type        = string
}

variable "git_clone_depth" {
  description = "Git clone depth"
  type        = number
  default     = 1
}

variable "fetch_submodules" {
  description = "Fetch git submodules"
  type        = bool
  default     = false
}

variable "buildspec" {
  description = "Buildspec content (leave empty for default)"
  type        = string
  default     = ""
}

variable "artifacts_type" {
  description = "Artifacts type (NO_ARTIFACTS, S3)"
  type        = string
  default     = "NO_ARTIFACTS"
}

variable "compute_type" {
  description = "Compute type (BUILD_GENERAL1_SMALL, BUILD_GENERAL1_MEDIUM, BUILD_GENERAL1_LARGE)"
  type        = string
  default     = "BUILD_GENERAL1_MEDIUM"
}

variable "build_image" {
  description = "Docker image to use for builds"
  type        = string
  default     = "aws/codebuild/standard:7.0"
}

variable "build_timeout_minutes" {
  description = "Build timeout in minutes"
  type        = number
  default     = 60
}

variable "environment_variables" {
  description = "Environment variables for build"
  type        = map(string)
  default     = {}
}

variable "secret_environment_variables" {
  description = "Secret environment variables from Secrets Manager"
  type = map(object({
    secret_arn = string
  }))
  default = {}
}

variable "create_role" {
  description = "Create IAM role for CodeBuild"
  type        = bool
  default     = true
}

variable "role_arn" {
  description = "Existing IAM role ARN (if create_role is false)"
  type        = string
  default     = ""
}

variable "create_log_group" {
  description = "Create CloudWatch log group"
  type        = bool
  default     = true
}

variable "log_group_name" {
  description = "CloudWatch log group name (if create_log_group is false)"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "github_webhook_enabled" {
  description = "Enable GitHub webhook for automatic builds"
  type        = bool
  default     = false
}

variable "github_webhook_events" {
  description = "GitHub events to trigger builds (PUSH, PULL_REQUEST_CREATED, etc.)"
  type        = string
  default     = "PUSH, PULL_REQUEST_CREATED, PULL_REQUEST_UPDATED, PULL_REQUEST_REOPENED"
}

variable "github_branch_filter" {
  description = "Branch pattern for webhook (e.g., 'refs/heads/main', empty for all)"
  type        = string
  default     = ""
}

variable "service_name" {
  description = "Name of the service (for tagging)"
  type        = string
}

variable "environment" {
  description = "Environment name (development, production)"
  type        = string
  default     = "production"
}

variable "tags" {
  description = "Additional tags to apply"
  type        = map(string)
  default     = {}
}
