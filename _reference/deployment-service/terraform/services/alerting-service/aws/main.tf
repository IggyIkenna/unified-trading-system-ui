# Terraform configuration for alerting-service on AWS
# Creates AWS Batch Job + EventBridge scheduled rule for live alert polling

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
    # key    = "services/alerting-service/terraform.tfstate"
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
    Comment = "Live alerting workflow — polls system events and dispatches notifications"
    StartAt = "SubmitAlertJob"
    States = {
      SubmitAlertJob = {
        Type     = "Task"
        Resource = "arn:aws:states:::batch:submitJob.sync"
        Parameters = {
          JobName       = "alerting-service-live"
          JobDefinition = module.alerting_job.arn
          JobQueue      = var.job_queue_arn
          ContainerOverrides = {
            Command = [
              "--operation", "poll", "--mode", "live", "--single-cycle"
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
        Error = "AlertingJobFailed"
        Cause = "Alerting service job failed"
      }
    }
  })
}

module "alerting_job" {
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
    ENVIRONMENT = var.environment
    AWS_REGION  = var.region
  }

  secret_environment_variables = {
    PAGERDUTY_ROUTING_KEY = var.pagerduty_routing_key_secret_arn
    SLACK_WEBHOOK_URL     = var.slack_webhook_url_secret_arn
  }

  subnet_ids         = var.subnet_ids
  security_group_ids = var.security_group_ids
  assign_public_ip   = true

  log_group_name     = "/aws/batch/${var.job_name}"
  create_log_group   = true
  log_retention_days = 14

  service_name = "alerting-service"
  environment  = var.environment

  tags = {
    "app"     = "alerting-service"
    "version" = "v2"
  }
}

module "live_workflow" {
  source = "../../../modules/workflow/aws"

  name        = var.live_workflow_name
  region      = var.region
  description = "Live alerting workflow (every 5 min)"

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
    "app"     = "alerting-service"
    "version" = "v2"
  }
}
