# Outputs for GCP Cloud Run Job Module

output "id" {
  description = "The ID of the Cloud Run Job"
  value       = google_cloud_run_v2_job.job.id
}

output "name" {
  description = "The name of the Cloud Run Job"
  value       = google_cloud_run_v2_job.job.name
}

output "uid" {
  description = "The UID of the Cloud Run Job"
  value       = google_cloud_run_v2_job.job.uid
}

output "location" {
  description = "The location/region of the Cloud Run Job"
  value       = google_cloud_run_v2_job.job.location
}

output "project" {
  description = "The project of the Cloud Run Job"
  value       = google_cloud_run_v2_job.job.project
}
