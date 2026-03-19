# Outputs for Cloud Workflow Module

output "workflow_id" {
  description = "The ID of the Cloud Workflow"
  value       = google_workflows_workflow.workflow.id
}

output "workflow_name" {
  description = "The name of the Cloud Workflow"
  value       = google_workflows_workflow.workflow.name
}

output "workflow_revision_id" {
  description = "The revision ID of the Cloud Workflow"
  value       = google_workflows_workflow.workflow.revision_id
}

output "scheduler_job_name" {
  description = "The name of the Cloud Scheduler job (if created)"
  value       = var.schedule != null ? google_cloud_scheduler_job.trigger[0].name : null
}

output "execution_url" {
  description = "URL to execute the workflow manually"
  value       = "https://workflowexecutions.googleapis.com/v1/${google_workflows_workflow.workflow.id}/executions"
}
