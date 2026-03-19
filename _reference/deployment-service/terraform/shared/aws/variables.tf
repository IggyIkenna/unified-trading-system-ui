# Variables for AWS Shared Infrastructure deployment

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# VPC Configuration
variable "create_vpc" {
  description = "Whether to create a new VPC (set to false to use existing)"
  type        = bool
  default     = true
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["ap-northeast-1a", "ap-northeast-1c"]
}

# S3 Configuration
variable "create_s3_buckets" {
  description = "Whether to create S3 buckets"
  type        = bool
  default     = true
}

variable "create_terraform_state_bucket" {
  description = "Whether to create the Terraform state bucket"
  type        = bool
  default     = true
}

# ECR Configuration
variable "create_ecr_repositories" {
  description = "Whether to create ECR repositories"
  type        = bool
  default     = true
}

# IAM Configuration
variable "create_iam_roles" {
  description = "Whether to create IAM roles"
  type        = bool
  default     = true
}

# Secrets Configuration
variable "create_secrets" {
  description = "Whether to create Secrets Manager secrets (you'll need to populate values manually)"
  type        = bool
  default     = true
}

# Batch Configuration
variable "create_batch_environment" {
  description = "Whether to create AWS Batch compute environment"
  type        = bool
  default     = true
}

variable "batch_max_vcpus" {
  description = "Maximum vCPUs for Batch compute environment"
  type        = number
  default     = 16
}
