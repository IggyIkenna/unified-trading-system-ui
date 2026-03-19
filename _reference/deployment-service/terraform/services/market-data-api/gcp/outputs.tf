# Outputs for market-data-api Terraform configuration

output "job_id" {
  description = "The ID of the Cloud Run Job"
  value       = module.refresh_job.id
}

output "job_name" {
  description = "The name of the Cloud Run Job"
  value       = module.refresh_job.name
}

output "job_uid" {
  description = "The UID of the Cloud Run Job"
  value       = module.refresh_job.uid
}

output "live_workflow_id" {
  description = "The ID of the live cache refresh Cloud Workflow"
  value       = module.live_workflow.workflow_id
}

output "live_workflow_name" {
  description = "The name of the live cache refresh Cloud Workflow"
  value       = module.live_workflow.workflow_name
}

output "live_scheduler_name" {
  description = "The name of the Cloud Scheduler job"
  value       = module.live_workflow.scheduler_job_name
}

output "live_execution_url" {
  description = "URL to trigger the live cache refresh workflow manually"
  value       = module.live_workflow.execution_url
}
