# Outputs for risk-and-exposure-service on AWS

output "job_arn" {
  description = "ARN of the Batch Job Definition"
  value       = module.daily_job.arn
}

output "job_name" {
  description = "Name of the Batch Job"
  value       = module.daily_job.name
}

output "workflow_arn" {
  description = "ARN of the Step Functions state machine"
  value       = module.daily_workflow.state_machine_arn
}

output "workflow_name" {
  description = "Name of the Step Functions state machine"
  value       = module.daily_workflow.state_machine_name
}
