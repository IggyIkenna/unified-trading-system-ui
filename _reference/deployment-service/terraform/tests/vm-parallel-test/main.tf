# Test parallel VM deployment for market-tick-data-service
# Spawns one VM per date in the range

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

# Define the dates to process (simulating 3-day parallel backfill)
locals {
  dates = ["2024-01-15", "2024-01-16", "2024-01-17"]
}

# Create one VM per date - all run in parallel
module "parallel_vms" {
  source   = "../../modules/compute-vm/gcp"
  for_each = toset(local.dates)

  name                  = "vm-parallel-${each.value}"
  project_id            = "{project_id}"
  zone                  = "asia-northeast1-a"
  image                 = "asia-northeast1-docker.pkg.dev/{project_id}/market-data-tick-handler/market-tick-data-service:latest"
  service_account_email = "instruments-service-cloud-run@{project_id}.iam.gserviceaccount.com"

  # VM config
  machine_type = "c2-standard-4"
  disk_size_gb = 50
  preemptible  = false  # PREEMPTIBLE_CPUS quota is only 16 in asia-northeast1
  self_delete  = true

  # Container args - one date per VM, small test
  args = [
    "--operation", "fetch", "--mode", "batch",
    "--start-date", each.value,
    "--end-date", each.value,
    "--category", "CEFI",
    "--venues", "BINANCE-SPOT",
    "--max-instruments", "3"
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

  # Status tracking
  status_bucket = "terraform-state-{project_id}"
  status_prefix = "vm-parallel-tests"
  deployment_id = "parallel-001"
  shard_id      = each.value
}

output "instances" {
  value = {
    for date, vm in module.parallel_vms : date => {
      name       = vm.instance_name
      external_ip = vm.external_ip
      status_path = vm.status_path
    }
  }
}

output "serial_console_urls" {
  value = {
    for date, vm in module.parallel_vms : date => vm.serial_console_url
  }
}
