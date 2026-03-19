# GCP Cloud Run Job Module
# This module creates a Cloud Run Job for running containerized batch workloads

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
  }
}

# Cloud Run Job
resource "google_cloud_run_v2_job" "job" {
  name                = var.name
  location            = var.region
  project             = var.project_id
  deletion_protection = false

  template {
    parallelism = var.parallelism
    task_count  = var.task_count

    template {
      timeout               = "${var.timeout_seconds}s"
      service_account       = var.service_account_email
      max_retries           = var.max_retries
      execution_environment = "EXECUTION_ENVIRONMENT_GEN2"

      containers {
        image = var.image

        resources {
          limits = {
            cpu    = var.cpu
            memory = var.memory
          }
        }

        # Environment variables
        dynamic "env" {
          for_each = var.environment_variables
          content {
            name  = env.key
            value = env.value
          }
        }

        # Secret environment variables (from Secret Manager)
        dynamic "env" {
          for_each = var.secret_environment_variables
          content {
            name = env.key
            value_source {
              secret_key_ref {
                secret  = env.value.secret_name
                version = env.value.version
              }
            }
          }
        }

        # Command/args override (optional)
        command = length(var.command) > 0 ? var.command : null
        args    = length(var.args) > 0 ? var.args : null

        # Volume mounts (must reference volumes at template level)
        dynamic "volume_mounts" {
          for_each = var.gcs_volumes
          content {
            name       = volume_mounts.value.name
            mount_path = "/mnt/gcs/${volume_mounts.value.bucket}"
          }
        }
      }

      # VPC access (optional)
      dynamic "vpc_access" {
        for_each = var.vpc_connector != null ? [1] : []
        content {
          connector = var.vpc_connector
          egress    = var.vpc_egress
        }
      }

      # GCS volume mounts (Cloud Run FUSE) - for fast parquet reads
      dynamic "volumes" {
        for_each = var.gcs_volumes
        content {
          name = volumes.value.name
          gcs {
            bucket    = volumes.value.bucket
            read_only = volumes.value.read_only
          }
        }
      }
    }
  }

  labels = merge(
    {
      "managed-by" = "terraform"
      "service"    = var.service_name
      "environment" = var.environment
    },
    var.labels
  )

  lifecycle {
    # Prevent accidental deletion
    prevent_destroy = false
  }
}
