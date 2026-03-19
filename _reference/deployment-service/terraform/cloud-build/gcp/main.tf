# Terraform configuration for Cloud Build triggers
# Creates build triggers for all services and API repos
# Libraries: use scripts/setup-cloud-build-triggers.sh (some created outside Terraform)
#
# Repos not yet linked to connection "iggyikenna-github" (asia-northeast1) must be linked
# in GCP Console (Cloud Build → Repositories → Link repository) before triggers can be created:
#   alerting-service, client-reporting-api, execution-results-api, market-data-api,
#   pnl-attribution-service, position-balance-monitor-service, risk-and-exposure-service,
# Then re-run: terraform apply -var="project_id={project_id}" -auto-approve

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
  }

  backend "gcs" {
    bucket = "terraform-state-{project_id}"
    prefix = "cloud-build"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  # Service configurations for Cloud Build triggers
  # All services enabled with quality gates in cloudbuild.yaml
  services = {
    # Data I/O services
    "instruments-service" = {
      github_repo            = "instruments-service"
      artifact_registry_repo = "instruments-service"
    }
    "market-tick-data-service" = {
      github_repo            = "market-tick-data-service"
      artifact_registry_repo = "market-tick-data-service"
    }
    # Pricing/Processing services
    "market-data-processing-service" = {
      github_repo            = "market-data-processing-service"
      artifact_registry_repo = "market-data-processing-service"
    }
    # Feature services
    "features-delta-one-service" = {
      github_repo            = "features-delta-one-service"
      artifact_registry_repo = "features-delta-one-service"
    }
    "features-volatility-service" = {
      github_repo            = "features-volatility-service"
      artifact_registry_repo = "features-volatility-service"
    }
    "features-onchain-service" = {
      github_repo            = "features-onchain-service"
      artifact_registry_repo = "features-onchain-service"
    }
    "features-calendar-service" = {
      github_repo            = "features-calendar-service"
      artifact_registry_repo = "features-calendar-service"
    }
    # Repo created + linked to iggyikenna-github connection 2026-02-28
    "features-multi-timeframe-service" = {
      github_repo            = "features-multi-timeframe-service"
      artifact_registry_repo = "features-multi-timeframe-service"
    }
    # ML services
    "ml-training-service" = {
      github_repo            = "ml-training-service"
      artifact_registry_repo = "ml-training-service"
    }
    "ml-inference-service" = {
      github_repo            = "ml-inference-service"
      artifact_registry_repo = "ml-inference-service"
    }
    # Strategy and execution
    "strategy-service" = {
      github_repo            = "strategy-service"
      artifact_registry_repo = "strategy-service"
    }
    "execution-service" = {
      github_repo            = "execution-service"
      artifact_registry_repo = "execution-service"
    }
    # Layer 6 · Risk · PnL · Ops
    "pnl-attribution-service" = {
      github_repo            = "pnl-attribution-service"
      artifact_registry_repo = "pnl-attribution-service"
    }
    "position-balance-monitor-service" = {
      github_repo            = "position-balance-monitor-service"
      artifact_registry_repo = "position-balance-monitor-service"
    }
    "risk-and-exposure-service" = {
      github_repo            = "risk-and-exposure-service"
      artifact_registry_repo = "risk-and-exposure-service"
    }
    "alerting-service" = {
      github_repo            = "alerting-service"
      artifact_registry_repo = "alerting-service"
    }
    # UI services (renamed from ml-deployment-ui 2026-02-28)
    "ml-training-ui" = {
      github_repo            = "ml-training-ui"
      artifact_registry_repo = "ml-training-ui"
    }
    # API services
    "execution-results-api" = {
      github_repo            = "execution-results-api"
      artifact_registry_repo = "execution-results-api"
    }
    "market-data-api" = {
      github_repo            = "market-data-api"
      artifact_registry_repo = "market-data-api"
    }
    "client-reporting-api" = {
      github_repo            = "client-reporting-api"
      artifact_registry_repo = "client-reporting-api"
    }
  }
}

# Create Cloud Build triggers for each service
module "cloud_build_triggers" {
  for_each = local.services
  source   = "../../modules/cloud-build/gcp"

  project_id             = var.project_id
  region                 = var.region
  service_name           = each.key
  github_owner           = var.github_owner
  github_repo            = each.value.github_repo
  artifact_registry_repo = each.value.artifact_registry_repo
  branch_pattern         = var.branch_pattern
  machine_type           = var.machine_type
  timeout                = var.timeout
  service_account_id     = var.cloud_build_service_account

  tags = [
    "service-${each.key}",
    "auto-build",
    "main-branch"
  ]
}
