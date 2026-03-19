# Outputs for Cloud Build Module

output "trigger_id" {
  description = "The ID of the Cloud Build trigger"
  value       = google_cloudbuild_trigger.build_trigger.id
}

output "trigger_name" {
  description = "The name of the Cloud Build trigger"
  value       = google_cloudbuild_trigger.build_trigger.name
}

output "docker_image" {
  description = "The Docker image path"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repo}/${var.service_name}"
}
