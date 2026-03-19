# AWS CodeBuild Module
# Equivalent to GCP Cloud Build - CI/CD pipeline for building and testing Docker images
#
# Features:
# - CodeBuild project with Docker support
# - GitHub integration via webhook
# - Build artifacts to ECR
# - CloudWatch logging

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }
}

# ============================================================
# Data Sources
# ============================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ============================================================
# Local Variables
# ============================================================

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name

  # Default buildspec if not provided
  default_buildspec = <<-BUILDSPEC
version: 0.2

phases:
  pre_build:
    commands:
      - echo "Logging in to Amazon ECR..."
      - aws ecr get-login-password --region $$AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $$AWS_ACCOUNT_ID.dkr.ecr.$$AWS_DEFAULT_REGION.amazonaws.com
      - COMMIT_HASH=$$(echo $$CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=$${COMMIT_HASH:-latest}

  build:
    commands:
      - echo "Building Docker image..."
      - docker build -t $$IMAGE_REPO_NAME:$$IMAGE_TAG .
      - docker tag $$IMAGE_REPO_NAME:$$IMAGE_TAG $$AWS_ACCOUNT_ID.dkr.ecr.$$AWS_DEFAULT_REGION.amazonaws.com/$$IMAGE_REPO_NAME:$$IMAGE_TAG
      - docker tag $$IMAGE_REPO_NAME:$$IMAGE_TAG $$AWS_ACCOUNT_ID.dkr.ecr.$$AWS_DEFAULT_REGION.amazonaws.com/$$IMAGE_REPO_NAME:latest

  post_build:
    commands:
      - echo "Running tests..."
      - docker run --rm $$IMAGE_REPO_NAME:$$IMAGE_TAG bash scripts/quality-gates.sh --no-fix --quick || true
      - echo "Pushing Docker image..."
      - docker push $$AWS_ACCOUNT_ID.dkr.ecr.$$AWS_DEFAULT_REGION.amazonaws.com/$$IMAGE_REPO_NAME:$$IMAGE_TAG
      - docker push $$AWS_ACCOUNT_ID.dkr.ecr.$$AWS_DEFAULT_REGION.amazonaws.com/$$IMAGE_REPO_NAME:latest

artifacts:
  files:
    - '**/*'
BUILDSPEC
}

# ============================================================
# CodeBuild Project
# ============================================================

resource "aws_codebuild_project" "build" {
  name          = var.name
  description   = var.description
  service_role  = var.create_role ? aws_iam_role.codebuild_role[0].arn : var.role_arn
  build_timeout = var.build_timeout_minutes

  source {
    type            = var.source_type
    location        = var.source_location
    git_clone_depth = var.git_clone_depth
    buildspec       = var.buildspec != "" ? var.buildspec : local.default_buildspec

    dynamic "git_submodules_config" {
      for_each = var.fetch_submodules ? [1] : []
      content {
        fetch_submodules = true
      }
    }
  }

  artifacts {
    type = var.artifacts_type
  }

  environment {
    compute_type                = var.compute_type
    image                       = var.build_image
    type                        = "LINUX_CONTAINER"
    privileged_mode             = true # Required for Docker builds
    image_pull_credentials_type = "CODEBUILD"

    dynamic "environment_variable" {
      for_each = var.environment_variables
      content {
        name  = environment_variable.key
        value = environment_variable.value
      }
    }

    dynamic "environment_variable" {
      for_each = var.secret_environment_variables
      content {
        name  = environment_variable.key
        value = environment_variable.value.secret_arn
        type  = "SECRETS_MANAGER"
      }
    }
  }

  logs_config {
    cloudwatch_logs {
      status      = "ENABLED"
      group_name  = var.create_log_group ? aws_cloudwatch_log_group.build_logs[0].name : var.log_group_name
      stream_name = var.name
    }
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

# ============================================================
# CloudWatch Log Group
# ============================================================

resource "aws_cloudwatch_log_group" "build_logs" {
  count = var.create_log_group ? 1 : 0

  name              = "/aws/codebuild/${var.name}"
  retention_in_days = var.log_retention_days

  tags = merge(
    {
      "managed-by" = "terraform"
    },
    var.tags
  )
}

# ============================================================
# IAM Role for CodeBuild
# ============================================================

resource "aws_iam_role" "codebuild_role" {
  count = var.create_role ? 1 : 0

  name = "${var.name}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
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

# IAM Policy for CodeBuild
resource "aws_iam_role_policy" "codebuild_policy" {
  count = var.create_role ? 1 : 0

  name = "${var.name}-codebuild-policy"
  role = aws_iam_role.codebuild_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = ["arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/codebuild/*"]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:GetAuthorizationToken"
        ]
        Resource = ["*"]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = ["arn:aws:s3:::*"]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [for k, v in var.secret_environment_variables : v.secret_arn]
      }
    ]
  })
}

# ============================================================
# GitHub Webhook (Optional)
# ============================================================

resource "aws_codebuild_webhook" "github" {
  count = var.github_webhook_enabled ? 1 : 0

  project_name = aws_codebuild_project.build.name

  filter_group {
    filter {
      type    = "EVENT"
      pattern = var.github_webhook_events
    }

    dynamic "filter" {
      for_each = var.github_branch_filter != "" ? [1] : []
      content {
        type    = "HEAD_REF"
        pattern = var.github_branch_filter
      }
    }
  }
}
