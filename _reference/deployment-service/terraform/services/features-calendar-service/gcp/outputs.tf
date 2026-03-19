# Outputs for features-calendar-service Terraform configuration

output "job_name" {
  description = "Name of the Cloud Run Job"
  value       = module.daily_job.job_name
}

output "daily_workflow_name" {
  description = "Name of the daily Cloud Workflow"
  value       = module.daily_workflow.workflow_name
}

output "backfill_workflow_name" {
  description = "Name of the backfill Cloud Workflow"
  value       = module.backfill_workflow.workflow_name
}
