# Terraform configuration for position-balance-monitor-service on AWS
# Creates AWS Batch Job + EventBridge scheduled rule for live position monitoring

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
    # key    = "services/position-balance-monitor-service/terraform.tfstate"
    # region = "ap-northeast-1"
  }
}

provider "aws" {
  region = var.region
}

data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id

  # Step Functions definition for live single-cycle monitoring
  workflow_definition = jsonencode({
    Comment = "Live position balance monitoring workflow (single cycle)"
    StartAt = "SubmitMonitorJob"
    States = {
      SubmitMonitorJob = {
        Type     = "Task"
        Resource = "arn:aws:states:::batch:submitJob.sync"
        Parameters = {
          JobName       = "position-balance-monitor-live"
          JobDefinition = module.monitor_job.arn
          JobQueue      = var.job_queue_arn
          ContainerOverrides = {
            Command = [
              "--operation", "monitor", "--mode", "live", "--single-cycle",
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
        Error = "MonitorJobFailed"
        Cause = "Position balance monitor job failed"
      }
    }
  })
}

module "monitor_job" {
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
    ENVIRONMENT             = var.environment
    AWS_REGION              = var.region
    EXECUTION_BUCKET_CEFI   = var.execution_bucket_cefi
    EXECUTION_BUCKET_TRADFI = var.execution_bucket_tradfi
    EXECUTION_BUCKET_DEFI   = var.execution_bucket_defi
    MONITOR_BUCKET          = var.monitor_bucket
  }

  secret_environment_variables = {}

  subnet_ids         = var.subnet_ids
  security_group_ids = var.security_group_ids
  assign_public_ip   = true

  log_group_name     = "/aws/batch/${var.job_name}"
  create_log_group   = true
  log_retention_days = 14

  service_name = "position-balance-monitor-service"
  environment  = var.environment

  tags = {
    "app"     = "position-balance-monitor-service"
    "version" = "v2"
  }
}

module "live_workflow" {
  source = "../../../modules/workflow/aws"

  name        = var.live_workflow_name
  region      = var.region
  description = "Live position balance monitoring workflow (every 5 min)"

  definition  = local.workflow_definition
  create_role = true

  # Every 5 minutes
  schedule  = var.live_schedule
  time_zone = var.time_zone

  create_scheduler_role = true

  workflow_args = {
    trigger = "scheduled"
  }

  tags = {
    "app"     = "position-balance-monitor-service"
    "version" = "v2"
  }
}
