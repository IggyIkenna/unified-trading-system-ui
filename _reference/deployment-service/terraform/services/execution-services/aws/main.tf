# Terraform configuration for execution-services on AWS
# Creates AWS Batch Job + Step Functions Workflow for execution backtesting

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
    # key    = "services/execution-services/terraform.tfstate"
    # region = "ap-northeast-1"
  }
}

provider "aws" {
  region = var.region
}

data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id

  # Step Functions definition for daily execution backtesting
  workflow_definition = jsonencode({
    Comment = "Daily T+1 execution backtesting workflow for execution-services"
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
          JobName       = "execution-services-daily"
          JobDefinition = module.daily_job.arn
          JobQueue      = var.job_queue_arn
          ContainerOverrides = {
            Command = [
              "backtest",
              "--domain", "cefi",
              "--start.$", "$.dateInfo.t_plus_1_date",
              "--end.$", "$.dateInfo.t_plus_1_date"
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

# AWS Batch Job for execution-services
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
    ENVIRONMENT            = var.environment
    AWS_REGION             = var.region
    EXECUTION_BUCKET_CEFI  = var.execution_bucket_cefi
    EXECUTION_BUCKET_TRADFI = var.execution_bucket_tradfi
    EXECUTION_BUCKET_DEFI  = var.execution_bucket_defi
    TICK_DATA_BUCKET_CEFI  = var.tick_data_bucket_cefi
    TICK_DATA_BUCKET_TRADFI = var.tick_data_bucket_tradfi
    TICK_DATA_BUCKET_DEFI  = var.tick_data_bucket_defi
    STRATEGY_BUCKET_CEFI   = var.strategy_bucket_cefi
    STRATEGY_BUCKET_TRADFI = var.strategy_bucket_tradfi
    STRATEGY_BUCKET_DEFI   = var.strategy_bucket_defi
  }

  secret_environment_variables = {}

  subnet_ids         = var.subnet_ids
  security_group_ids = var.security_group_ids
  assign_public_ip   = true

  log_group_name     = "/aws/batch/${var.job_name}"
  create_log_group   = true
  log_retention_days = 30

  service_name = "execution-services"
  environment  = var.environment

  tags = {
    "app"     = "execution-services"
    "version" = "v2"
  }
}

# Step Functions Workflow for daily T+1
module "daily_workflow" {
  source = "../../../modules/workflow/aws"

  name        = var.workflow_name
  region      = var.region
  description = "Daily T+1 execution backtesting workflow for execution-services"

  definition  = local.workflow_definition
  create_role = true

  # Schedule at 3:00 PM UTC daily (after strategy-service)
  schedule  = var.schedule
  time_zone = var.time_zone

  create_scheduler_role = true

  workflow_args = {
    trigger = "scheduled"
  }

  tags = {
    "app"     = "execution-services"
    "version" = "v2"
  }
}
