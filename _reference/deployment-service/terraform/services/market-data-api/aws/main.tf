# Terraform configuration for market-data-api on AWS
# Creates AWS Batch Job + Step Functions for market data cache refresh

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }

  backend "s3" {
    # Configure in backend.hcl or via -backend-config
    # bucket = "terraform-state-bucket"
    # key    = "services/market-data-api/terraform.tfstate"
    # region = "ap-northeast-1"
  }
}

provider "aws" {
  region = var.region
}

data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id

  workflow_definition = jsonencode({
    Comment = "Market data API cache refresh workflow"
    StartAt = "SubmitRefreshJob"
    States = {
      SubmitRefreshJob = {
        Type     = "Task"
        Resource = "arn:aws:states:::batch:submitJob.sync"
        Parameters = {
          JobName       = "market-data-api-refresh"
          JobDefinition = module.refresh_job.arn
          JobQueue      = var.job_queue_arn
          ContainerOverrides = {
            Command = [
              "--operation", "refresh", "--mode", "live", "--single-cycle",
              "--category", "CEFI"
            ]
          }
        }
        ResultPath = "$.jobResult"
        Next       = "Success"
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "JobFailed"
          }
        ]
      }
      Success = {
        Type = "Succeed"
      }
      JobFailed = {
        Type  = "Fail"
        Error = "RefreshJobFailed"
        Cause = "Market data API cache refresh job failed"
      }
    }
  })
}

module "refresh_job" {
  source = "../../../modules/container-job/aws"

  name   = var.job_name
  region = var.region
  image  = var.docker_image

  vcpus     = var.vcpus
  memory_mb = var.memory_mb

  timeout_seconds = var.timeout_seconds
  max_retries     = var.max_retries

  execution_role_arn = var.execution_role_arn
  job_role_arn       = var.job_role_arn

  environment_variables = {
    ENVIRONMENT          = var.environment
    AWS_REGION           = var.region
    TICK_BUCKET_CEFI     = var.tick_bucket_cefi
    TICK_BUCKET_TRADFI   = var.tick_bucket_tradfi
    TICK_BUCKET_DEFI     = var.tick_bucket_defi
    API_CACHE_BUCKET     = var.api_cache_bucket
  }

  secret_environment_variables = {}

  subnet_ids         = var.subnet_ids
  security_group_ids = var.security_group_ids
  assign_public_ip   = true

  log_group_name     = "/aws/batch/${var.job_name}"
  create_log_group   = true
  log_retention_days = 14

  service_name = "market-data-api"
  environment  = var.environment

  tags = {
    "app"     = "market-data-api"
    "version" = "v2"
  }
}

module "live_workflow" {
  source = "../../../modules/workflow/aws"

  name        = var.live_workflow_name
  region      = var.region
  description = "Market data API cache refresh workflow (every 15 min)"

  definition  = local.workflow_definition
  create_role = true

  schedule  = var.live_schedule
  time_zone = var.time_zone

  create_scheduler_role = true

  workflow_args = {
    trigger = "scheduled"
  }

  tags = {
    "app"     = "market-data-api"
    "version" = "v2"
  }
}
