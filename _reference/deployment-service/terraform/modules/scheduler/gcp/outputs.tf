# Outputs for GCP Cloud Scheduler Module

output "id" {
  description = "The ID of the Cloud Scheduler job"
  value       = google_cloud_scheduler_job.scheduler.id
}

output "name" {
  description = "The name of the Cloud Scheduler job"
  value       = google_cloud_scheduler_job.scheduler.name
}

output "schedule" {
  description = "The schedule of the job"
  value       = google_cloud_scheduler_job.scheduler.schedule
}

output "state" {
  description = "The state of the scheduler (ENABLED or PAUSED)"
  value       = google_cloud_scheduler_job.scheduler.paused ? "PAUSED" : "ENABLED"
}
