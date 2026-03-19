# Terraform configuration for market-tick-data-service on AWS
# Creates AWS Batch Job + Step Functions Workflows for daily T+1 and backfill operations

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
    # key    = "services/market-tick-data-service/terraform.tfstate"
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
  daily_workflow_definition = jsonencode({
    Comment = "Daily T+1 workflow for market-tick-data-service"
    StartAt = "ComputeDate"
    States = {
      ComputeDate = {
        Type = "Pass"
        Parameters = {
          "t_plus_1_date.$" = "$$.Execution.StartTime"
          "category"        = "CEFI"
        }
        ResultPath = "$.params"
        Next       = "SubmitBatchJob"
      }
      SubmitBatchJob = {
        Type     = "Task"
        Resource = "arn:aws:states:::batch:submitJob"
        Parameters = {
          JobName       = "market-tick-daily"
          JobDefinition = module.daily_job.arn
          JobQueue      = var.job_queue_arn
          ContainerOverrides = {
            Command = [
              "--operation", "fetch", "--mode", "batch",
              "--category.$", "$.params.category",
              "--start-date.$", "$.params.t_plus_1_date",
              "--end-date.$", "$.params.t_plus_1_date"
            ]
          }
        }
        ResultPath = "$.jobResult"
        Next       = "Success"
      }
      Success = {
        Type = "Succeed"
      }
    }
  })

  # Step Functions definition for backfill workflow
  backfill_workflow_definition = jsonencode({
    Comment = "Backfill workflow for market-tick-data-service"
    StartAt = "ProcessCategories"
    States = {
      ProcessCategories = {
        Type = "Map"
        ItemsPath = "$.categories"
        Parameters = {
          "category.$"   = "$$.Map.Item.Value"
          "start_date.$" = "$.start_date"
          "end_date.$"   = "$.end_date"
        }
        Iterator = {
          StartAt = "SubmitCategoryJob"
          States = {
            SubmitCategoryJob = {
              Type     = "Task"
              Resource = "arn:aws:states:::batch:submitJob.sync"
              Parameters = {
                JobName       = "market-tick-backfill"
                JobDefinition = module.daily_job.arn
                JobQueue      = var.job_queue_arn
                ContainerOverrides = {
                  Command = [
                    "--operation", "fetch", "--mode", "batch",
                    "--category.$", "$.category",
                    "--start-date.$", "$.start_date",
                    "--end-date.$", "$.end_date"
                  ]
                }
              }
              End = true
            }
          }
        }
        Next = "BackfillComplete"
      }
      BackfillComplete = {
        Type = "Succeed"
      }
    }
  })
}

# AWS Batch Job for market-tick-data-service
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
    ENVIRONMENT       = var.environment
    AWS_REGION        = var.region
    S3_BUCKET_CEFI    = var.s3_bucket_cefi
    S3_BUCKET_TRADFI  = var.s3_bucket_tradfi
    S3_BUCKET_DEFI    = var.s3_bucket_defi
  }

  secret_environment_variables = {
    TARDIS_API_KEY = {
      secret_arn = var.tardis_secret_arn
    }
    DATABENTO_API_KEY = {
      secret_arn = var.databento_secret_arn
    }
  }

  subnet_ids         = var.subnet_ids
  security_group_ids = var.security_group_ids
  assign_public_ip   = true

  log_group_name     = "/aws/batch/${var.job_name}"
  create_log_group   = true
  log_retention_days = 30

  service_name = "market-tick-data-service"
  environment  = var.environment

  tags = {
    "app"     = "market-tick-data-service"
    "version" = "v2"
  }
}

# Step Functions Workflow for daily T+1
module "daily_workflow" {
  source = "../../../modules/workflow/aws"

  name        = var.daily_workflow_name
  region      = var.region
  description = "Daily T+1 workflow for market-tick-data-service"

  definition  = local.daily_workflow_definition
  create_role = true

  # Schedule at 9:00 AM UTC daily (30 min after instruments-service)
  schedule  = var.schedule
  time_zone = var.time_zone

  create_scheduler_role = true

  workflow_args = {
    trigger  = "scheduled"
    category = "CEFI"
  }

  tags = {
    "app"  = "market-tick-data-service"
    "type" = "daily"
  }
}

# Step Functions Workflow for backfill (manual trigger)
module "backfill_workflow" {
  source = "../../../modules/workflow/aws"

  name        = var.backfill_workflow_name
  region      = var.region
  description = "Historical backfill workflow for market-tick-data-service"

  definition  = local.backfill_workflow_definition
  create_role = true

  # No schedule - manual trigger only
  schedule = null

  tags = {
    "app"  = "market-tick-data-service"
    "type" = "backfill"
  }
}
