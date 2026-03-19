# Outputs for AWS Batch Job Module

output "id" {
  description = "The revision ID of the Batch Job Definition"
  value       = aws_batch_job_definition.job.revision
}

output "name" {
  description = "The name of the Batch Job Definition"
  value       = aws_batch_job_definition.job.name
}

output "arn" {
  description = "The ARN of the Batch Job Definition"
  value       = aws_batch_job_definition.job.arn
}

output "uid" {
  description = "The ARN of the Batch Job Definition (alias for GCP compatibility)"
  value       = aws_batch_job_definition.job.arn
}

output "revision" {
  description = "The revision number of the job definition"
  value       = aws_batch_job_definition.job.revision
}

output "job_queue_arn" {
  description = "The ARN of the Batch Job Queue (if created)"
  value       = var.create_job_queue ? aws_batch_job_queue.queue[0].arn : var.job_queue_arn
}

output "job_queue_name" {
  description = "The name of the Batch Job Queue (if created)"
  value       = var.create_job_queue ? aws_batch_job_queue.queue[0].name : null
}

output "compute_environment_arn" {
  description = "The ARN of the Compute Environment (if created)"
  value       = var.create_compute_environment ? aws_batch_compute_environment.fargate[0].arn : var.compute_environment_arn
}

output "log_group_name" {
  description = "The CloudWatch Log Group name"
  value       = var.create_log_group ? aws_cloudwatch_log_group.job_logs[0].name : var.log_group_name
}

output "log_group_arn" {
  description = "The CloudWatch Log Group ARN"
  value       = var.create_log_group ? aws_cloudwatch_log_group.job_logs[0].arn : null
}

# GCP compatibility outputs
output "location" {
  description = "The region (GCP compatibility)"
  value       = var.region
}

output "project" {
  description = "Not applicable in AWS (GCP compatibility)"
  value       = null
}
