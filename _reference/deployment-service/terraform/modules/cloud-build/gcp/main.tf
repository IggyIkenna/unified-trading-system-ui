# Cloud Build Module for GCP
# Creates build triggers for service repositories

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
  }
}

# Cloud Build Trigger (2nd-gen using repository connection)
# Uses cloudbuild.yaml from the repo for build configuration
resource "google_cloudbuild_trigger" "build_trigger" {
  project     = var.project_id
  name        = "${var.service_name}-build"
  description = "Build and push Docker image for ${var.service_name}"
  location    = var.region

  # Trigger on push to main branch using 2nd-gen repository connection
  repository_event_config {
    repository = "projects/${var.project_id}/locations/${var.region}/connections/${var.connection_name}/repositories/${var.github_repo}"
    push {
      branch = var.branch_pattern
    }
  }

  # Use cloudbuild.yaml from the repository
  filename = "cloudbuild.yaml"

  # Service account for the build (optional)
  service_account = var.service_account_id != "" ? "projects/${var.project_id}/serviceAccounts/${var.service_account_id}" : null

  tags = var.tags
}
