# Terraform configuration for Deployment Dashboard
#
# Creates:
#   - Artifact Registry repository for dashboard images
#   - Cloud Build trigger for automatic deployment on push to main
#
# Usage:
#   cd terraform/dashboard/gcp
#   terraform init
#   terraform apply

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "terraform-state-{project_id}"
    prefix = "dashboard"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Artifact Registry repository for dashboard images
resource "google_artifact_registry_repository" "dashboard" {
  location      = var.region
  repository_id = "deployment-dashboard"
  description   = "Docker repository for deployment dashboard (API + UI)"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }
}

# Cloud Build trigger - builds and deploys on push to main
resource "google_cloudbuild_trigger" "dashboard" {
  name        = "deployment-dashboard-build"
  description = "Build and deploy deployment dashboard on push to main"
  location    = var.region

  repository_event_config {
    repository = var.repository_connection
    push {
      branch = "^main$"
    }
  }

  filename = "cloudbuild.yaml"

  substitutions = {
    _SERVICE_NAME   = "deployment-dashboard"
    _REGION         = var.region
    _ARTIFACT_REPO  = "deployment-dashboard"
  }

  service_account = "projects/${var.project_id}/serviceAccounts/${var.cloud_build_sa}"
}

# IAM: Allow Cloud Build to deploy to Cloud Run
resource "google_project_iam_member" "cloudbuild_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${var.cloud_build_sa}"
}

resource "google_project_iam_member" "cloudbuild_sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${var.cloud_build_sa}"
}

# IAM: Allow Cloud Run service to access GCS (for deployment state)
resource "google_project_iam_member" "cloudrun_storage" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"
}

resource "google_project_iam_member" "cloudrun_storage_admin" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"
}

# IAM: Allow Cloud Run service to read Cloud Logging (for deployment logs)
resource "google_project_iam_member" "cloudrun_logging_viewer" {
  project = var.project_id
  role    = "roles/logging.viewer"
  member  = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"
}

# IAM: Allow Cloud Run service to read Compute Engine (for VM status/serial console)
resource "google_project_iam_member" "cloudrun_compute_viewer" {
  project = var.project_id
  role    = "roles/compute.viewer"
  member  = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"
}

# IAM: Allow Cloud Run service to read Cloud Build (for build status)
resource "google_project_iam_member" "cloudrun_cloudbuild_viewer" {
  project = var.project_id
  role    = "roles/cloudbuild.builds.viewer"
  member  = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"
}

# IAM: Allow Cloud Run service to trigger Cloud Builds (for manual builds from UI)
resource "google_project_iam_member" "cloudrun_cloudbuild_editor" {
  project = var.project_id
  role    = "roles/cloudbuild.builds.editor"
  member  = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"
}

# IAM: Allow Cloud Run service to read Cloud Run Jobs (for deployment status)
resource "google_project_iam_member" "cloudrun_run_viewer" {
  project = var.project_id
  role    = "roles/run.viewer"
  member  = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"
}

# IAM: Allow Cloud Run service to read Artifact Registry (for image digests/tags)
resource "google_project_iam_member" "cloudrun_artifactregistry_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"
}
