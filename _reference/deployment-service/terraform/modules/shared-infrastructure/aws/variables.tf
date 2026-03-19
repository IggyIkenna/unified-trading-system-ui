# Variables for AWS Shared Infrastructure Module

variable "name_prefix" {
  description = "Prefix for all resource names"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

# ECR Configuration
variable "create_ecr_repository" {
  description = "Create ECR repository"
  type        = bool
  default     = true
}

variable "ecr_repository_name" {
  description = "Name of the ECR repository"
  type        = string
}

# IAM Configuration
variable "create_iam_roles" {
  description = "Create IAM roles"
  type        = bool
  default     = true
}

# VPC Configuration
variable "create_vpc" {
  description = "Create new VPC"
  type        = bool
  default     = true
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for subnets"
  type        = list(string)
  default     = ["ap-northeast-1a", "ap-northeast-1c"]
}

variable "existing_subnet_ids" {
  description = "Existing subnet IDs (if not creating VPC)"
  type        = list(string)
  default     = []
}

variable "existing_security_group_ids" {
  description = "Existing security group IDs (if not creating VPC)"
  type        = list(string)
  default     = []
}

# S3 Configuration
variable "create_s3_buckets" {
  description = "Create S3 buckets"
  type        = bool
  default     = true
}

variable "s3_bucket_names" {
  description = "List of S3 bucket names to create"
  type        = list(string)
  default     = []
}

# Secrets Manager Configuration
variable "create_secrets" {
  description = "Create secrets in Secrets Manager"
  type        = bool
  default     = false
}

variable "secrets" {
  description = "Map of secrets to create"
  type = map(object({
    description = string
  }))
  default = {}
}

# Batch Configuration
variable "create_batch_environment" {
  description = "Create Batch compute environment and job queue"
  type        = bool
  default     = true
}

variable "batch_max_vcpus" {
  description = "Maximum vCPUs for Batch compute environment"
  type        = number
  default     = 16
}

variable "existing_batch_service_role_arn" {
  description = "Existing Batch service role ARN (if not creating)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
