# Outputs for AWS Shared Infrastructure deployment

output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS Region"
  value       = var.region
}

# ECR Outputs
output "ecr_repository_urls" {
  description = "Map of service names to ECR repository URLs"
  value = {
    for name, repo in aws_ecr_repository.services :
    name => repo.repository_url
  }
}

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.shared_infrastructure.vpc_id
}

output "subnet_ids" {
  description = "Subnet IDs"
  value       = module.shared_infrastructure.subnet_ids
}

output "security_group_id" {
  description = "Batch security group ID"
  value       = module.shared_infrastructure.security_group_id
}

# IAM Outputs
output "execution_role_arn" {
  description = "ECS Task Execution Role ARN"
  value       = module.shared_infrastructure.execution_role_arn
}

output "job_role_arn" {
  description = "ECS Task Job Role ARN"
  value       = module.shared_infrastructure.job_role_arn
}

output "batch_service_role_arn" {
  description = "Batch Service Role ARN"
  value       = module.shared_infrastructure.batch_service_role_arn
}

# Batch Outputs
output "batch_compute_environment_arn" {
  description = "Batch Compute Environment ARN"
  value       = module.shared_infrastructure.batch_compute_environment_arn
}

output "batch_job_queue_arn" {
  description = "Batch Job Queue ARN"
  value       = module.shared_infrastructure.batch_job_queue_arn
}

# S3 Buckets Output (grouped by type)
output "s3_buckets" {
  description = "All created S3 bucket names"
  value       = module.shared_infrastructure.s3_bucket_names
}

output "instruments_buckets" {
  description = "Instruments S3 bucket names by category"
  value = {
    for name in module.shared_infrastructure.s3_bucket_names :
    upper(split("-", name)[3]) => name
    if can(regex("instruments", name))
  }
}

output "market_data_buckets" {
  description = "Market data S3 bucket names by category"
  value = {
    for name in module.shared_infrastructure.s3_bucket_names :
    upper(split("-", name)[3]) => name
    if can(regex("market-data", name))
  }
}

output "features_delta_one_buckets" {
  description = "Features delta-one S3 bucket names by category"
  value = {
    for name in module.shared_infrastructure.s3_bucket_names :
    upper(split("-", name)[4]) => name
    if can(regex("features-delta-one", name))
  }
}

output "features_volatility_buckets" {
  description = "Features volatility S3 bucket names by category"
  value = {
    for name in module.shared_infrastructure.s3_bucket_names :
    upper(split("-", name)[4]) => name
    if can(regex("features-volatility", name))
  }
}

output "features_onchain_buckets" {
  description = "Features onchain S3 bucket names by category"
  value = {
    for name in module.shared_infrastructure.s3_bucket_names :
    upper(split("-", name)[4]) => name
    if can(regex("features-onchain", name))
  }
}

output "features_calendar_buckets" {
  description = "Features calendar S3 bucket names by category"
  value = {
    for name in module.shared_infrastructure.s3_bucket_names :
    upper(split("-", name)[4]) => name
    if can(regex("features-calendar", name))
  }
}

output "ml_buckets" {
  description = "ML-related S3 bucket names"
  value = [
    for name in module.shared_infrastructure.s3_bucket_names :
    name
    if can(regex("ml-", name))
  ]
}

output "strategy_buckets" {
  description = "Strategy S3 bucket names by category"
  value = {
    for name in module.shared_infrastructure.s3_bucket_names :
    upper(split("-", name)[3]) => name
    if can(regex("strategy", name))
  }
}

output "execution_buckets" {
  description = "Execution S3 bucket names by category"
  value = {
    for name in module.shared_infrastructure.s3_bucket_names :
    upper(split("-", name)[3]) => name
    if can(regex("execution", name))
  }
}

output "deployment_orchestration_bucket" {
  description = "Deployment orchestration S3 bucket name"
  value = [
    for name in module.shared_infrastructure.s3_bucket_names :
    name
    if can(regex("deployment-orchestration", name))
  ][0]
}

# Quick Start Info
output "quick_start_info" {
  description = "Quick start information"
  value = {
    account_id = data.aws_caller_identity.current.account_id
    region     = var.region
    ecr_login_command = "aws ecr get-login-password --region ${var.region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
    next_steps = [
      "1. Set secret values: aws secretsmanager put-secret-value --secret-id tardis-api-key --secret-string 'YOUR_KEY'",
      "2. Configure CodeBuild: cd ../cloud-build/aws && terraform apply",
      "3. Deploy services: cd ../services/instruments-service/aws && terraform apply",
    ]
  }
}
