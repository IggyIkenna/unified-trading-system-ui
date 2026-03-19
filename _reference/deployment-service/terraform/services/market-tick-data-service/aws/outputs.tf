# Outputs for market-tick-data-service on AWS

output "job_arn" {
  description = "The ARN of the Batch Job Definition"
  value       = module.daily_job.arn
}

output "job_name" {
  description = "The name of the Batch Job Definition"
  value       = module.daily_job.name
}

output "daily_workflow_arn" {
  description = "The ARN of the daily Step Functions workflow"
  value       = module.daily_workflow.workflow_arn
}

output "daily_workflow_name" {
  description = "The name of the daily Step Functions workflow"
  value       = module.daily_workflow.workflow_name
}

output "daily_scheduler_name" {
  description = "The name of the daily EventBridge Scheduler"
  value       = module.daily_workflow.scheduler_job_name
}

output "backfill_workflow_arn" {
  description = "The ARN of the backfill Step Functions workflow"
  value       = module.backfill_workflow.workflow_arn
}

output "backfill_workflow_name" {
  description = "The name of the backfill Step Functions workflow"
  value       = module.backfill_workflow.workflow_name
}

output "daily_execution_url" {
  description = "URL to execute the daily workflow in AWS Console"
  value       = module.daily_workflow.execution_url
}

output "backfill_execution_url" {
  description = "URL to execute the backfill workflow in AWS Console"
  value       = module.backfill_workflow.execution_url
}
