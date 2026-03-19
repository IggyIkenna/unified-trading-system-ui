# AWS Step Functions Module
# Equivalent to GCP Cloud Workflows - orchestrates AWS Batch Jobs
#
# Step Functions provides state machine orchestration similar to Cloud Workflows

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }
}

# Get current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Step Functions State Machine
resource "aws_sfn_state_machine" "workflow" {
  name     = var.name
  role_arn = var.create_role ? aws_iam_role.step_functions_role[0].arn : var.role_arn
  type     = var.express_workflow ? "EXPRESS" : "STANDARD"

  definition = var.definition

  logging_configuration {
    log_destination        = var.create_log_group ? "${aws_cloudwatch_log_group.workflow_logs[0].arn}:*" : "${var.log_group_arn}:*"
    include_execution_data = var.log_include_execution_data
    level                  = var.log_level
  }

  tracing_configuration {
    enabled = var.enable_xray_tracing
  }

  tags = merge(
    {
      "managed-by" = "terraform"
      "component"  = "workflow"
    },
    var.tags
  )
}

# CloudWatch Log Group for workflow execution logs
resource "aws_cloudwatch_log_group" "workflow_logs" {
  count = var.create_log_group ? 1 : 0

  name              = "/aws/vendedlogs/states/${var.name}"
  retention_in_days = var.log_retention_days

  tags = merge(
    {
      "managed-by" = "terraform"
    },
    var.tags
  )
}

# IAM Role for Step Functions
resource "aws_iam_role" "step_functions_role" {
  count = var.create_role ? 1 : 0

  name = "${var.name}-step-functions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
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

# IAM Policy for Step Functions to submit Batch jobs
resource "aws_iam_role_policy" "batch_submit" {
  count = var.create_role ? 1 : 0

  name = "${var.name}-batch-submit"
  role = aws_iam_role.step_functions_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "batch:SubmitJob",
          "batch:DescribeJobs",
          "batch:TerminateJob"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutTargets",
          "events:PutRule",
          "events:DescribeRule"
        ]
        Resource = "arn:aws:events:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:rule/StepFunctionsGetEventsForBatchJobsRule"
      }
    ]
  })
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  count = var.create_role ? 1 : 0

  name = "${var.name}-cloudwatch-logs"
  role = aws_iam_role.step_functions_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogDelivery",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutLogEvents",
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy for X-Ray tracing
resource "aws_iam_role_policy" "xray" {
  count = var.create_role && var.enable_xray_tracing ? 1 : 0

  name = "${var.name}-xray"
  role = aws_iam_role.step_functions_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets"
        ]
        Resource = "*"
      }
    ]
  })
}

# Optional: EventBridge Scheduler to trigger the workflow
resource "aws_scheduler_schedule" "trigger" {
  count = var.schedule != null ? 1 : 0

  name        = "${var.name}-trigger"
  description = "Triggers ${var.name} workflow"
  group_name  = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(${replace(var.schedule, "/([0-9*]+) ([0-9*]+) ([0-9*]+) ([0-9*]+) ([0-9*]+)/", "$1 $2 $3 $4 ? *")})"
  schedule_expression_timezone = var.time_zone
  state                        = "ENABLED"

  target {
    arn      = aws_sfn_state_machine.workflow.arn
    role_arn = var.create_scheduler_role ? aws_iam_role.scheduler_role[0].arn : var.scheduler_role_arn

    input = jsonencode(var.workflow_args)

    retry_policy {
      maximum_event_age_in_seconds = 3600
      maximum_retry_attempts       = 3
    }
  }
}

# IAM Role for EventBridge Scheduler
resource "aws_iam_role" "scheduler_role" {
  count = var.schedule != null && var.create_scheduler_role ? 1 : 0

  name = "${var.name}-scheduler-role"

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

# IAM Policy for scheduler to start Step Functions execution
resource "aws_iam_role_policy" "scheduler_sfn" {
  count = var.schedule != null && var.create_scheduler_role ? 1 : 0

  name = "${var.name}-start-execution"
  role = aws_iam_role.scheduler_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.workflow.arn
      }
    ]
  })
}
