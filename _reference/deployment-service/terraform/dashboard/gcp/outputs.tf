# Outputs for Deployment Dashboard

output "artifact_registry_repository" {
  description = "Artifact Registry repository URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.dashboard.repository_id}"
}

output "cloud_build_trigger_id" {
  description = "Cloud Build trigger ID"
  value       = google_cloudbuild_trigger.dashboard.id
}

output "cloud_build_trigger_name" {
  description = "Cloud Build trigger name"
  value       = google_cloudbuild_trigger.dashboard.name
}

output "cloud_run_url" {
  description = "Cloud Run service URL (after first deploy)"
  value       = "https://deployment-dashboard-${var.project_number}.${var.region}.run.app"
}

output "next_steps" {
  description = "Next steps after terraform apply"
  value       = <<-EOT

    ✅ Infrastructure created!

    Next steps:
    1. Push to main branch to trigger first build:
       git add . && git commit -m "Add dashboard deployment" && git push origin main

    2. Monitor build:
       gcloud builds list --region=${var.region} --limit=5

    3. After build completes, access dashboard at:
       gcloud run services describe deployment-dashboard --region=${var.region} --format='value(status.url)'

    4. Or check Cloud Console:
       https://console.cloud.google.com/run?project=${var.project_id}
  EOT
}
