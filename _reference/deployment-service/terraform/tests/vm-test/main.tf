# Test deployment for compute-vm module
# Creates a single VM to test the module

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.0"
    }
  }
}

provider "google" {
  project = "{project_id}"
  region  = "asia-northeast1"
}

module "test_vm" {
  source = "../../modules/compute-vm/gcp"

  name                  = "vm-test"
  project_id            = "{project_id}"
  zone                  = "asia-northeast1-a"
  image                 = "asia-northeast1-docker.pkg.dev/{project_id}/market-data-tick-handler/market-tick-data-service:latest"
  service_account_email = "instruments-service-cloud-run@{project_id}.iam.gserviceaccount.com"

  # VM config
  machine_type = "c2-standard-4"
  disk_size_gb = 50
  preemptible  = false  # PREEMPTIBLE_CPUS quota is only 16 in asia-northeast1
  self_delete  = true

  # Container args - small test (1 day, 1 venue)
  args = [
    "--operation", "fetch", "--mode", "batch",
    "--start-date", "2024-01-15",
    "--end-date", "2024-01-15",
    "--category", "CEFI",
    "--venues", "BINANCE-SPOT",
    "--max-instruments", "5"
  ]

  # Environment variables
  environment_variables = {
    PYTHONUNBUFFERED = "1"
    GCS_REGION       = "asia-northeast1"
    GCS_LOCATION     = "asia-northeast1"
    ENVIRONMENT      = "prod"
  }

  # Labeling
  service_name = "market-tick-data-service"
  environment  = "test"

  # Status tracking (optional)
  status_bucket  = "terraform-state-{project_id}"
  status_prefix  = "vm-tests"
  deployment_id  = "test-001"
  shard_id       = "2024-01-15"
}

output "instance_name" {
  value = module.test_vm.instance_name
}

output "serial_console_url" {
  value = module.test_vm.serial_console_url
}

output "ssh_command" {
  value = module.test_vm.ssh_command
}

output "external_ip" {
  value = module.test_vm.external_ip
}
