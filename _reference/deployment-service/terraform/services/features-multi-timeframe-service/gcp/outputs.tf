output "job_name" {
  description = "Cloud Run Job name"
  value       = var.job_name
}

output "workflow_name" {
  description = "Daily workflow name"
  value       = var.workflow_name
}

output "backfill_workflow_name" {
  description = "Backfill workflow name"
  value       = var.backfill_workflow_name
}
