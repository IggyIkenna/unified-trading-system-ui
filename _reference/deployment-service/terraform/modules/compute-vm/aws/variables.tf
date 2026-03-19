# Variables for AWS EC2 Instance Module

variable "name" {
  description = "Base name for the EC2 instance (will have unique suffix appended)"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "image" {
  description = "Docker image URL (ECR path)"
  type        = string
}

variable "args" {
  description = "Command arguments for the container"
  type        = list(string)
  default     = []
}

variable "environment_variables" {
  description = "Environment variables for the container"
  type        = map(string)
  default     = {}
}

variable "instance_type" {
  description = "EC2 instance type (e.g., 'c5.xlarge')"
  type        = string
  default     = "c5.xlarge"
}

variable "disk_size_gb" {
  description = "Root volume size in GB"
  type        = number
  default     = 40
}

variable "subnet_id" {
  description = "VPC subnet ID"
  type        = string
}

variable "security_group_ids" {
  description = "List of security group IDs"
  type        = list(string)
}

variable "instance_profile_name" {
  description = "IAM instance profile name"
  type        = string
}

variable "assign_public_ip" {
  description = "Assign a public IP address"
  type        = bool
  default     = true
}

variable "use_spot" {
  description = "Use spot instances (equivalent to GCP preemptible)"
  type        = bool
  default     = false
}

variable "spot_max_price" {
  description = "Maximum spot price per hour (leave empty for on-demand price)"
  type        = string
  default     = ""
}

variable "self_terminate" {
  description = "Terminate instance after container completes"
  type        = bool
  default     = true
}

variable "status_bucket" {
  description = "S3 bucket for status reporting (optional)"
  type        = string
  default     = ""
}

variable "status_prefix" {
  description = "S3 prefix for status files"
  type        = string
  default     = "deployments"
}

variable "deployment_id" {
  description = "Deployment ID for status tracking"
  type        = string
  default     = ""
}

variable "shard_id" {
  description = "Shard ID for this VM"
  type        = string
}

variable "timeout_seconds" {
  description = "Maximum execution time before forced termination"
  type        = number
  default     = 3600
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
