# GCP Compute VM Module
#
# Creates a GCE VM with Container-Optimized OS that runs a Docker container.
# Designed to mirror the container-job module interface for easy switching.
#
# Features:
# - Container-Optimized OS (COS) for secure, minimal container hosting
# - Cloud-init for automated container execution
# - Self-deletion on completion (optional)
# - Status reporting to GCS (optional)
# - Preemptible/Spot support for cost savings

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.0"
    }
  }
}

# ============================================================
# Data Sources
# ============================================================

# Get the latest Container-Optimized OS image
data "google_compute_image" "cos" {
  family  = "cos-stable"
  project = "cos-cloud"
}

# Generate timestamp for unique instance names
resource "random_id" "instance_suffix" {
  byte_length = 4
}

# ============================================================
# Local Variables
# ============================================================

locals {
  # Instance name with unique suffix
  instance_name = "${var.name}-${random_id.instance_suffix.hex}"

  # Extract registry region from image URL for docker-credential-gcr
  # e.g., asia-northeast1-docker.pkg.dev/project/repo/image:tag -> asia-northeast1
  registry_region = try(
    regex("^([a-z]+-[a-z]+[0-9]*)-docker\\.pkg\\.dev", var.image)[0],
    "asia-northeast1"
  )

  # Build environment variables string for docker run
  env_flags = join(" ", [
    for k, v in var.environment_variables : "-e ${k}='${v}'"
  ])

  # Build args string
  args_string = join(" ", var.args)

  # Labels
  all_labels = merge(
    {
      "managed-by"  = "terraform"
      "service"     = var.service_name
      "environment" = var.environment
      "app"         = var.service_name
    },
    var.labels
  )

  # Status GCS path (if configured)
  status_path = var.status_bucket != "" ? "gs://${var.status_bucket}/${var.status_prefix}/${var.deployment_id}/${var.shard_id}/status" : ""

  # Cloud-init configuration
  cloud_init = templatefile("${path.module}/cloud-init.yaml.tpl", {
    instance_name              = local.instance_name
    project_id                 = var.project_id
    zone                       = var.zone
    registry_region            = local.registry_region
    docker_image               = var.image
    env_flags                  = local.env_flags
    args_string                = local.args_string
    self_delete                = var.self_delete
    status_path                = local.status_path
    service_name               = var.service_name
    shard_id                   = var.shard_id
    timeout_seconds            = var.timeout_seconds
    delete_batch_index         = var.delete_batch_index
    delete_batch_delay_seconds = var.delete_batch_delay_seconds
  })
}

# ============================================================
# GCE Instance
# ============================================================

resource "google_compute_instance" "vm" {
  name         = local.instance_name
  machine_type = var.machine_type
  zone         = var.zone
  project      = var.project_id

  # Boot disk with Container-Optimized OS
  boot_disk {
    initialize_params {
      image = data.google_compute_image.cos.self_link
      size  = var.disk_size_gb
      type  = "pd-ssd"
    }
    auto_delete = true
  }

  # Network interface
  network_interface {
    network    = var.network
    subnetwork = var.subnetwork != "" ? var.subnetwork : null

    # External IP (required for Artifact Registry access without VPC)
    dynamic "access_config" {
      for_each = var.external_ip ? [1] : []
      content {
        // Ephemeral public IP
      }
    }
  }

  # Service account
  service_account {
    email  = var.service_account_email
    scopes = ["cloud-platform"]
  }

  # Metadata with cloud-init
  metadata = {
    # Cloud-init configuration (COS reads user-data)
    user-data = local.cloud_init

    # Enable serial port logging for debugging
    serial-port-logging-enable = "true"

    # Enable OS Login (optional, for SSH access)
    enable-oslogin = "true"
  }

  # Labels for tracking and filtering
  labels = local.all_labels

  # Scheduling options
  scheduling {
    preemptible         = var.preemptible
    automatic_restart   = false  # Don't restart on preemption
    on_host_maintenance = "TERMINATE"

    # Use Spot VM if specified (newer, replaces preemptible)
    provisioning_model = var.spot ? "SPOT" : (var.preemptible ? "SPOT" : "STANDARD")
  }

  # Allow the instance to be stopped/deleted
  allow_stopping_for_update = true

  # Tags for firewall rules (if needed)
  tags = ["container-vm", var.service_name]

  lifecycle {
    # Ignore changes to metadata that might be modified by cloud-init
    ignore_changes = [
      metadata["ssh-keys"],
    ]
  }
}
