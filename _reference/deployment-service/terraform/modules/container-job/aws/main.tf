# AWS Batch Job Module
# Equivalent to GCP Cloud Run Job - runs containerized batch workloads
#
# AWS Batch with Fargate provides serverless container execution similar to Cloud Run Jobs

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }
}

# Batch Job Definition
resource "aws_batch_job_definition" "job" {
  name = var.name
  type = "container"

  platform_capabilities = ["FARGATE"]

  container_properties = jsonencode({
    image = var.image

    resourceRequirements = [
      {
        type  = "VCPU"
        value = var.vcpus
      },
      {
        type  = "MEMORY"
        value = var.memory_mb
      }
    ]

    executionRoleArn = var.execution_role_arn
    jobRoleArn       = var.job_role_arn

    environment = [
      for key, value in var.environment_variables : {
        name  = key
        value = value
      }
    ]

    secrets = [
      for key, secret in var.secret_environment_variables : {
        name      = key
        valueFrom = secret.secret_arn
      }
    ]

    command = length(var.command) > 0 ? var.command : null

    networkConfiguration = {
      assignPublicIp = var.assign_public_ip ? "ENABLED" : "DISABLED"
    }

    fargatePlatformConfiguration = {
      platformVersion = "LATEST"
    }

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = var.log_group_name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = var.name
      }
    }
  })

  retry_strategy {
    attempts = var.max_retries
  }

  timeout {
    attempt_duration_seconds = var.timeout_seconds
  }

  tags = merge(
    {
      "managed-by"  = "terraform"
      "service"     = var.service_name
      "environment" = var.environment
    },
    var.tags
  )
}

# CloudWatch Log Group for job logs
resource "aws_cloudwatch_log_group" "job_logs" {
  count = var.create_log_group ? 1 : 0

  name              = var.log_group_name != null ? var.log_group_name : "/aws/batch/${var.name}"
  retention_in_days = var.log_retention_days

  tags = merge(
    {
      "managed-by" = "terraform"
      "service"    = var.service_name
    },
    var.tags
  )
}

# Batch Compute Environment (Fargate)
resource "aws_batch_compute_environment" "fargate" {
  count = var.create_compute_environment ? 1 : 0

  compute_environment_name = "${var.name}-compute-env"
  type                     = "MANAGED"

  compute_resources {
    type      = "FARGATE"
    max_vcpus = var.max_vcpus

    subnets         = var.subnet_ids
    security_groups = var.security_group_ids
  }

  service_role = var.batch_service_role_arn

  tags = merge(
    {
      "managed-by" = "terraform"
      "service"    = var.service_name
    },
    var.tags
  )
}

# Batch Job Queue
resource "aws_batch_job_queue" "queue" {
  count = var.create_job_queue ? 1 : 0

  name     = "${var.name}-queue"
  state    = "ENABLED"
  priority = 1

  compute_environment_order {
    order               = 1
    compute_environment = var.create_compute_environment ? aws_batch_compute_environment.fargate[0].arn : var.compute_environment_arn
  }

  tags = merge(
    {
      "managed-by" = "terraform"
      "service"    = var.service_name
    },
    var.tags
  )
}
