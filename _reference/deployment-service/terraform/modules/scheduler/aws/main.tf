# AWS EventBridge Scheduler Module
# Equivalent to GCP Cloud Scheduler - triggers AWS Batch Jobs on a schedule
#
# Uses EventBridge Scheduler for advanced scheduling with timezone support

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }
}

# Convert GCP cron format to AWS cron format
# GCP: minute hour day-of-month month day-of-week (5 fields)
# AWS: minute hour day-of-month month day-of-week year (6 fields with ?)
locals {
  # AWS cron needs a 6th field (year) and uses ? for day-of-week or day-of-month
  aws_schedule = "cron(${replace(var.schedule, "/([0-9*]+) ([0-9*]+) ([0-9*]+) ([0-9*]+) ([0-9*]+)/", "$1 $2 $3 $4 ? *")})"
}

# EventBridge Scheduler Schedule
resource "aws_scheduler_schedule" "schedule" {
  name        = var.name
  description = var.description
  group_name  = var.schedule_group_name

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = local.aws_schedule
  schedule_expression_timezone = var.time_zone
  state                        = var.enabled ? "ENABLED" : "DISABLED"

  target {
    arn      = "arn:aws:batch:${var.region}:${data.aws_caller_identity.current.account_id}:job-queue/${var.job_queue_name}"
    role_arn = var.scheduler_role_arn

    # Submit Batch Job
    batch_parameters {
      job_definition = var.job_definition_arn
      job_name       = "${var.target_job_name}-scheduled"

      # Optional: Pass container overrides
      array_properties {
        size = var.array_size > 1 ? var.array_size : null
      }

      retry_strategy {
        attempts = var.retry_count
      }
    }

    # Dead letter config for failed invocations
    dead_letter_config {
      arn = var.dead_letter_queue_arn
    }

    retry_policy {
      maximum_event_age_in_seconds = var.max_event_age_seconds
      maximum_retry_attempts       = var.retry_count
    }
  }
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Optional: Create schedule group
resource "aws_scheduler_schedule_group" "group" {
  count = var.create_schedule_group ? 1 : 0
  name  = var.schedule_group_name

  tags = merge(
    {
      "managed-by" = "terraform"
    },
    var.tags
  )
}

# Optional: Create IAM role for scheduler
resource "aws_iam_role" "scheduler_role" {
  count = var.create_scheduler_role ? 1 : 0
  name  = "${var.name}-scheduler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    {
      "managed-by" = "terraform"
    },
    var.tags
  )
}

# IAM policy for scheduler to submit Batch jobs
resource "aws_iam_role_policy" "scheduler_batch_policy" {
  count = var.create_scheduler_role ? 1 : 0
  name  = "${var.name}-batch-submit"
  role  = aws_iam_role.scheduler_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "batch:SubmitJob"
        ]
        Resource = [
          var.job_definition_arn,
          "arn:aws:batch:${var.region}:${data.aws_caller_identity.current.account_id}:job-queue/${var.job_queue_name}"
        ]
      }
    ]
  })
}
