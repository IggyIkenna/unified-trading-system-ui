# Outputs for market-tick-data-service Terraform configuration

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

# Daily Workflow outputs
output "daily_workflow_id" {
  description = "The ID of the daily Cloud Workflow"
  value       = module.daily_workflow.workflow_id
}

output "daily_workflow_name" {
  description = "The name of the daily Cloud Workflow"
  value       = module.daily_workflow.workflow_name
}

output "daily_scheduler_name" {
  description = "The name of the daily Cloud Scheduler job"
  value       = module.daily_workflow.scheduler_job_name
}

# Backfill Workflow outputs
output "backfill_workflow_id" {
  description = "The ID of the backfill Cloud Workflow"
  value       = module.backfill_workflow.workflow_id
}

output "backfill_workflow_name" {
  description = "The name of the backfill Cloud Workflow"
  value       = module.backfill_workflow.workflow_name
}

output "backfill_execution_url" {
  description = "URL to execute the backfill workflow"
  value       = module.backfill_workflow.execution_url
}

# Example Commands
output "backfill_minimal_example" {
  description = "Minimal backfill command (only dates - spawns 1 job per day)"
  value       = "gcloud workflows run ${var.backfill_workflow_name} --location=${var.region} --data='{\"start_date\":\"2024-01-01\",\"end_date\":\"2024-01-10\"}'"
}

output "backfill_filtered_example" {
  description = "Backfill with optional filters"
  value       = "gcloud workflows run ${var.backfill_workflow_name} --location=${var.region} --data='{\"start_date\":\"2024-01-01\",\"end_date\":\"2024-01-10\",\"categories\":[\"CEFI\"],\"venues\":[\"BINANCE-SPOT\"],\"force\":true}'"
}
