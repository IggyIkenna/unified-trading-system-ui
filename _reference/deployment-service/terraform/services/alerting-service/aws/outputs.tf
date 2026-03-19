# Outputs for alerting-service on AWS

output "job_arn" {
  description = "ARN of the Batch Job Definition"
  value       = module.alerting_job.arn
}

output "job_name" {
  description = "Name of the Batch Job"
  value       = module.alerting_job.name
}

output "live_workflow_arn" {
  description = "ARN of the live alerting Step Functions state machine"
  value       = module.live_workflow.state_machine_arn
}

output "live_workflow_name" {
  description = "Name of the live alerting Step Functions state machine"
  value       = module.live_workflow.state_machine_name
}
