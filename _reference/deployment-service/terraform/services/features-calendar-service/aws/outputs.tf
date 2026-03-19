# Outputs for features-calendar-service on AWS

output "job_definition_arn" {
  description = "Batch job definition ARN"
  value       = module.daily_job.arn
}

output "job_definition_name" {
  description = "Batch job definition name"
  value       = module.daily_job.name
}

output "workflow_arn" {
  description = "Step Functions workflow ARN"
  value       = module.daily_workflow.arn
}

output "workflow_name" {
  description = "Step Functions workflow name"
  value       = module.daily_workflow.name
}

output "scheduler_arn" {
  description = "EventBridge scheduler ARN"
  value       = module.daily_workflow.scheduler_arn
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = "/aws/batch/${var.job_name}"
}
