# Outputs for AWS Shared Infrastructure Module

# ECR
output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = var.create_ecr_repository ? aws_ecr_repository.repo[0].repository_url : null
}

output "ecr_repository_arn" {
  description = "ECR repository ARN"
  value       = var.create_ecr_repository ? aws_ecr_repository.repo[0].arn : null
}

# IAM Roles
output "execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = var.create_iam_roles ? aws_iam_role.execution_role[0].arn : null
}

output "job_role_arn" {
  description = "Job role ARN"
  value       = var.create_iam_roles ? aws_iam_role.job_role[0].arn : null
}

output "batch_service_role_arn" {
  description = "Batch service role ARN"
  value       = var.create_iam_roles ? aws_iam_role.batch_service_role[0].arn : null
}

# VPC
output "vpc_id" {
  description = "VPC ID"
  value       = var.create_vpc ? aws_vpc.main[0].id : null
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = var.create_vpc ? aws_subnet.public[*].id : var.existing_subnet_ids
}

output "security_group_id" {
  description = "Batch security group ID"
  value       = var.create_vpc ? aws_security_group.batch[0].id : null
}

# S3
output "s3_bucket_arns" {
  description = "Map of S3 bucket ARNs"
  value       = var.create_s3_buckets ? { for k, v in aws_s3_bucket.data_buckets : k => v.arn } : {}
}

output "s3_bucket_names" {
  description = "Map of S3 bucket names"
  value       = var.create_s3_buckets ? { for k, v in aws_s3_bucket.data_buckets : k => v.id } : {}
}

# Secrets
output "secret_arns" {
  description = "Map of secret ARNs"
  value       = var.create_secrets ? { for k, v in aws_secretsmanager_secret.secrets : k => v.arn } : {}
}

# Batch
output "compute_environment_arn" {
  description = "Batch compute environment ARN"
  value       = var.create_batch_environment ? aws_batch_compute_environment.fargate[0].arn : null
}

output "job_queue_arn" {
  description = "Batch job queue ARN"
  value       = var.create_batch_environment ? aws_batch_job_queue.main[0].arn : null
}

output "job_queue_name" {
  description = "Batch job queue name"
  value       = var.create_batch_environment ? aws_batch_job_queue.main[0].name : null
}
