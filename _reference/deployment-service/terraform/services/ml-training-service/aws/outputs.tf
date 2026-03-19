# Outputs for ml-training-service on AWS

output "job_arn" {
  description = "The ARN of the Batch Job Definition"
  value       = module.daily_job.arn
}

output "job_name" {
  description = "The name of the Batch Job Definition"
  value       = module.daily_job.name
}

output "workflow_arn" {
  description = "The ARN of the Step Functions workflow"
  value       = module.daily_workflow.workflow_arn
}

output "workflow_name" {
  description = "The name of the Step Functions workflow"
  value       = module.daily_workflow.workflow_name
}

output "scheduler_name" {
  description = "The name of the EventBridge Scheduler"
  value       = module.daily_workflow.scheduler_job_name
}

output "execution_url" {
  description = "URL to execute the workflow in AWS Console"
  value       = module.daily_workflow.execution_url
}
