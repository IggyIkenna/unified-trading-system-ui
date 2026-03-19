# Outputs for execution-services Terraform configuration

output "job_id" {
  description = "The ID of the Cloud Run Job"
  value       = module.daily_job.id
}

output "job_name" {
  description = "The name of the Cloud Run Job"
  value       = module.daily_job.name
}

output "job_uid" {
  description = "The UID of the Cloud Run Job"
  value       = module.daily_job.uid
}

output "workflow_id" {
  description = "The ID of the Cloud Workflow"
  value       = module.daily_workflow.workflow_id
}

output "workflow_name" {
  description = "The name of the Cloud Workflow"
  value       = module.daily_workflow.workflow_name
}

output "scheduler_name" {
  description = "The name of the Cloud Scheduler job"
  value       = module.daily_workflow.scheduler_job_name
}

output "daily_execution_url" {
  description = "URL to execute the daily workflow manually"
  value       = module.daily_workflow.execution_url
}

output "backfill_workflow_id" {
  description = "The ID of the backtest Cloud Workflow"
  value       = module.backfill_workflow.workflow_id
}

output "backfill_workflow_name" {
  description = "The name of the backtest Cloud Workflow"
  value       = module.backfill_workflow.workflow_name
}

output "backfill_execution_url" {
  description = "URL to execute the backtest workflow manually"
  value       = module.backfill_workflow.execution_url
}

output "backfill_example_command" {
  description = "Example command to run backtest workflow"
  value       = "gcloud workflows run ${var.backfill_workflow_name} --location=${var.region} --data='{\"start_date\":\"2020-01-01\",\"end_date\":\"2026-01-25\",\"domain\":\"cefi\"}'"
}
