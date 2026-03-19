terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "terraform-state-${var.project_id}"
    prefix = "ibkr-gateway"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_compute_instance" "ibkr_gateway" {
  name         = "ibkr-gateway-vm"
  machine_type = "e2-standard-2"
  zone         = "${var.region}-a"

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 30
      type  = "pd-ssd"
    }
  }

  network_interface {
    network = "default"
    access_config {}  # Ephemeral external IP for initial setup
  }

  metadata = {
    startup-script = file("${path.module}/startup.sh")
    enable-oslogin = "TRUE"
  }

  service_account {
    email  = var.service_account_email
    scopes = ["cloud-platform"]
  }

  tags = ["ibkr-gateway", "allow-internal"]

  labels = {
    service     = "ibkr-gateway"
    environment = var.environment
    managed_by  = "terraform"
  }
}

resource "google_compute_firewall" "ibkr_internal" {
  name    = "allow-ibkr-internal"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["4001", "4002"]  # IB Gateway paper and live ports
  }

  source_tags = ["trading-service"]
  target_tags = ["ibkr-gateway"]
}

output "ibkr_gateway_internal_ip" {
  value       = google_compute_instance.ibkr_gateway.network_interface[0].network_ip
  description = "Internal IP for SSH tunnel from trading services"
}

output "ibkr_gateway_external_ip" {
  value       = google_compute_instance.ibkr_gateway.network_interface[0].access_config[0].nat_ip
  description = "External IP for initial one-time SSH login"
}
