# Variables for alerting-service on AWS

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "job_name" {
  description = "Name of the Batch Job"
  type        = string
  default     = "alerting-service"
}

variable "docker_image" {
  description = "Docker image URL in ECR"
  type        = string
}

variable "vcpus" {
  description = "vCPUs for the job"
  type        = string
  default     = "2"
}

variable "memory_mb" {
  description = "Memory in MB"
  type        = string
  default     = "1024"
}

variable "timeout_seconds" {
  description = "Job timeout in seconds"
  type        = number
  default     = 240
}

variable "max_retries" {
  description = "Maximum retry attempts"
  type        = number
  default     = 1
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "execution_role_arn" {
  description = "ECS task execution role ARN"
  type        = string
}

variable "job_role_arn" {
  description = "Job role ARN"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for Fargate tasks"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
}

variable "job_queue_arn" {
  description = "Batch job queue ARN"
  type        = string
}

variable "pagerduty_routing_key_secret_arn" {
  description = "ARN of Secrets Manager secret for PagerDuty routing key"
  type        = string
}

variable "slack_webhook_url_secret_arn" {
  description = "ARN of Secrets Manager secret for Slack webhook URL"
  type        = string
}

variable "live_workflow_name" {
  description = "Name of the live alerting Step Functions workflow"
  type        = string
  default     = "alerting-service-live"
}

variable "live_schedule" {
  description = "Cron schedule for live alerting"
  type        = string
  default     = "rate(5 minutes)"
}

variable "time_zone" {
  description = "Time zone for the schedule"
  type        = string
  default     = "UTC"
}
