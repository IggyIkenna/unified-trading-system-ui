# Terraform configuration for features-calendar-service on AWS
# Creates AWS Batch Job + Step Functions Workflow for daily T+1 operations
#
# features-calendar-service generates calendar and temporal features:
# - Trading session markers (market open/close)
# - Holiday flags
# - Economic event schedules
# - Earnings calendars (TRADFI)

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }

  # Uncomment after setting up state bucket
  # backend "s3" {
  #   bucket = "unified-trading-terraform-state-ACCOUNT_ID"
  #   key    = "services/features-calendar-service/terraform.tfstate"
  #   region = "ap-northeast-1"
  # }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "unified-trading"
      Service     = "features-calendar-service"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id

  # Step Functions definition for daily T+1 workflow
  workflow_definition = jsonencode({
    Comment = "Daily T+1 workflow for features-calendar-service"
    StartAt = "ComputeDate"
    States = {
      ComputeDate = {
        Type = "Pass"
        Parameters = {
          "t_plus_1_date.$" = "$$.Execution.StartTime"
        }
        ResultPath = "$.dateInfo"
        Next       = "SubmitBatchJob"
      }
      SubmitBatchJob = {
        Type     = "Task"
        Resource = "arn:aws:states:::batch:submitJob.sync"
        Parameters = {
          JobName       = "features-calendar-service-daily"
          JobDefinition = module.daily_job.arn
          JobQueue      = var.job_queue_arn
          ContainerOverrides = {
            Command = [
              "--operation", "compute",
              "--mode", "batch",
              "--start-date.$", "$.dateInfo.t_plus_1_date",
              "--end-date.$", "$.dateInfo.t_plus_1_date",
              "--temporal",
              "--scheduled-events",
              "--event-actuals"
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
        Error = "JobExecutionFailed"
        Cause = "The batch job failed to complete successfully"
      }
    }
  })
}

# AWS Batch Job for features-calendar-service
module "daily_job" {
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
    ENVIRONMENT               = var.environment
    AWS_REGION                = var.region
    CLOUD_PROVIDER            = "aws"
    FEATURES_BUCKET_CEFI      = var.features_bucket_cefi
    FEATURES_BUCKET_TRADFI    = var.features_bucket_tradfi
    FEATURES_BUCKET_DEFI      = var.features_bucket_defi
    USE_AWS_SECRETS_MANAGER   = "true"
    FRED_SECRET_NAME          = "fred-api-key"
  }

  secret_environment_variables = {
    FRED_API_KEY = "fred-api-key"
  }

  subnet_ids         = var.subnet_ids
  security_group_ids = var.security_group_ids
  assign_public_ip   = true

  log_group_name     = "/aws/batch/${var.job_name}"
  create_log_group   = true
  log_retention_days = 30

  service_name = "features-calendar-service"
  environment  = var.environment

  tags = {
    "app"     = "features-calendar-service"
    "version" = "v1"
  }
}

# Step Functions Workflow for daily T+1
module "daily_workflow" {
  source = "../../../modules/workflow/aws"

  name        = var.workflow_name
  region      = var.region
  description = "Daily T+1 workflow for features-calendar-service"

  definition  = local.workflow_definition
  create_role = true

  # Schedule at 08:00 AM UTC daily (before other feature services)
  schedule  = var.schedule
  time_zone = var.time_zone

  create_scheduler_role = true

  workflow_args = {
    trigger = "scheduled"
  }

  tags = {
    "app"     = "features-calendar-service"
    "version" = "v1"
  }
}
