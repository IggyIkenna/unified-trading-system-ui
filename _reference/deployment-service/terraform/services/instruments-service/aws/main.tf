# Terraform configuration for instruments-service on AWS
# Creates AWS Batch Job + Step Functions Workflow for daily T+1 operations

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
    # key    = "services/instruments-service/terraform.tfstate"
    # region = "ap-northeast-1"
  }
}

provider "aws" {
  region = var.region
}

data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id

  # Step Functions definition for daily T+1 workflow
  workflow_definition = jsonencode({
    Comment = "Daily T+1 workflow for instruments-service"
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
          JobName       = "instruments-service-daily"
          JobDefinition = module.daily_job.arn
          JobQueue      = var.job_queue_arn
          ContainerOverrides = {
            Command = [
              "--operation", "instrument", "--mode", "batch",
              "--CEFI", "--TRADFI", "--DEFI",
              "--start-date.$", "$.dateInfo.t_plus_1_date"
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

# AWS Batch Job for instruments-service
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
    ENVIRONMENT     = var.environment
    AWS_REGION      = var.region
    S3_BUCKET_CEFI  = var.s3_bucket_cefi
    S3_BUCKET_TRADFI = var.s3_bucket_tradfi
    S3_BUCKET_DEFI  = var.s3_bucket_defi
  }

  secret_environment_variables = {
    TARDIS_API_KEY = {
      secret_arn = var.tardis_secret_arn
    }
    DATABENTO_API_KEY = {
      secret_arn = var.databento_secret_arn
    }
    ALCHEMY_API_KEY = {
      secret_arn = var.alchemy_secret_arn
    }
    GRAPH_API_KEY = {
      secret_arn = var.graph_secret_arn
    }
  }

  subnet_ids         = var.subnet_ids
  security_group_ids = var.security_group_ids
  assign_public_ip   = true

  log_group_name     = "/aws/batch/${var.job_name}"
  create_log_group   = true
  log_retention_days = 30

  service_name = "instruments-service"
  environment  = var.environment

  tags = {
    "app"     = "instruments-service"
    "version" = "v2"
  }
}

# Step Functions Workflow for daily T+1
module "daily_workflow" {
  source = "../../../modules/workflow/aws"

  name        = var.workflow_name
  region      = var.region
  description = "Daily T+1 workflow for instruments-service"

  definition   = local.workflow_definition
  create_role  = true

  # Schedule at 8:30 AM UTC daily
  schedule    = var.schedule
  time_zone   = var.time_zone

  create_scheduler_role = true

  workflow_args = {
    trigger = "scheduled"
  }

  tags = {
    "app"     = "instruments-service"
    "version" = "v2"
  }
}
