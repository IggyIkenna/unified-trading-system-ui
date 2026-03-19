# Terraform configuration for AWS CodeBuild projects
# Creates build projects for all 11 services
#
# Equivalent to GCP Cloud Build triggers

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
  #   bucket         = "unified-trading-terraform-state-ACCOUNT_ID"
  #   key            = "cloud-build/terraform.tfstate"
  #   region         = "ap-northeast-1"
  #   encrypt        = true
  #   dynamodb_table = "unified-trading-terraform-locks"
  # }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "unified-trading"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name

  # Service configurations for CodeBuild projects
  # Each service builds from its GitHub repo and pushes to ECR
  services = {
    # Data I/O services
    "instruments-service" = {
      github_repo      = "instruments-service"
      ecr_repo         = "instruments-service"
      build_timeout    = 30
    }
    "market-tick-data-service" = {
      github_repo      = "market-tick-data-service"
      ecr_repo         = "market-tick-data-service"
      build_timeout    = 30
    }
    # Processing services
    "market-data-processing-service" = {
      github_repo      = "market-data-processing-service"
      ecr_repo         = "market-data-processing-service"
      build_timeout    = 30
    }
    # Feature services
    "features-calendar-service" = {
      github_repo      = "features-calendar-service"
      ecr_repo         = "features-calendar-service"
      build_timeout    = 30
    }
    "features-delta-one-service" = {
      github_repo      = "features-delta-one-service"
      ecr_repo         = "features-delta-one-service"
      build_timeout    = 30
    }
    "features-volatility-service" = {
      github_repo      = "features-volatility-service"
      ecr_repo         = "features-volatility-service"
      build_timeout    = 30
    }
    "features-onchain-service" = {
      github_repo      = "features-onchain-service"
      ecr_repo         = "features-onchain-service"
      build_timeout    = 30
    }
    # ML services
    "ml-training-service" = {
      github_repo      = "ml-training-service"
      ecr_repo         = "ml-training-service"
      build_timeout    = 45
    }
    "ml-inference-service" = {
      github_repo      = "ml-inference-service"
      ecr_repo         = "ml-inference-service"
      build_timeout    = 45
    }
    # Strategy and execution
    "strategy-service" = {
      github_repo      = "strategy-service"
      ecr_repo         = "strategy-service"
      build_timeout    = 30
    }
    "execution-services" = {
      github_repo      = "execution-services"
      ecr_repo         = "execution-services"
      build_timeout    = 45
    }
  }
}

# =============================================================================
# IAM Role for CodeBuild
# =============================================================================

resource "aws_iam_role" "codebuild_role" {
  name = "unified-trading-codebuild-role"

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
}

resource "aws_iam_role_policy" "codebuild_policy" {
  name = "unified-trading-codebuild-policy"
  role = aws_iam_role.codebuild_role.id

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
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:DescribeImages",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:github-token*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::unified-trading-*",
          "arn:aws:s3:::unified-trading-*/*"
        ]
      }
    ]
  })
}

# =============================================================================
# GitHub Connection (CodeStar)
# =============================================================================

resource "aws_codestarconnections_connection" "github" {
  name          = "unified-trading-github"
  provider_type = "GitHub"

  # Note: After creating, you must manually authorize the connection in AWS Console
  # This is a one-time setup step
}

# =============================================================================
# CodeBuild Projects
# =============================================================================

resource "aws_codebuild_project" "services" {
  for_each = local.services

  name          = each.key
  description   = "Build and push Docker image for ${each.key}"
  build_timeout = each.value.build_timeout
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  environment {
    compute_type                = var.compute_type
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    privileged_mode             = true  # Required for Docker builds
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = local.account_id
    }

    environment_variable {
      name  = "AWS_REGION"
      value = local.region
    }

    environment_variable {
      name  = "ECR_REPO"
      value = each.value.ecr_repo
    }

    environment_variable {
      name  = "CLOUD_PROVIDER"
      value = "aws"
    }

    environment_variable {
      name  = "GITHUB_TOKEN"
      value = "github-token"
      type  = "SECRETS_MANAGER"
    }
  }

  source {
    type            = "GITHUB"
    location        = "https://github.com/${var.github_owner}/${each.value.github_repo}.git"
    git_clone_depth = 1
    buildspec       = "buildspec.aws.yaml"

    git_submodules_config {
      fetch_submodules = false
    }
  }

  source_version = var.branch_pattern

  logs_config {
    cloudwatch_logs {
      group_name  = "/codebuild/unified-trading"
      stream_name = each.key
    }
  }

  tags = {
    Service = each.key
  }
}

# =============================================================================
# CodeBuild Webhooks (triggered on push to main)
# =============================================================================

resource "aws_codebuild_webhook" "services" {
  for_each = local.services

  project_name = aws_codebuild_project.services[each.key].name
  build_type   = "BUILD"

  filter_group {
    filter {
      type    = "EVENT"
      pattern = "PUSH"
    }

    filter {
      type    = "HEAD_REF"
      pattern = var.branch_pattern
    }
  }
}
