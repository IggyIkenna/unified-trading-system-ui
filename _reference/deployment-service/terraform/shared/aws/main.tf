# Terraform configuration for AWS Shared Infrastructure
# Creates all S3 buckets, ECR repos, IAM roles, VPC, and Batch environment
#
# This is the root module that bootstraps all shared AWS infrastructure.
# Run this ONCE before deploying any services to AWS.
#
# Usage:
#   cd terraform/shared/aws
#   terraform init
#   terraform plan
#   terraform apply

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }

  # Uncomment after creating the state bucket manually
  # backend "s3" {
  #   bucket         = "unified-trading-terraform-state-ACCOUNT_ID"
  #   key            = "shared-infrastructure/terraform.tfstate"
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

locals {
  account_id = data.aws_caller_identity.current.account_id

  # S3 bucket names for all services
  s3_buckets = concat(
    # Instruments buckets
    [for cat in ["cefi", "tradfi", "defi"] : "unified-trading-instruments-${cat}-${local.account_id}"],
    # Market data buckets
    [for cat in ["cefi", "tradfi", "defi"] : "unified-trading-market-data-${cat}-${local.account_id}"],
    # Features calendar buckets
    [for cat in ["cefi", "tradfi", "defi"] : "unified-trading-features-calendar-${cat}-${local.account_id}"],
    # Features delta-one buckets
    [for cat in ["cefi", "tradfi", "defi"] : "unified-trading-features-delta-one-${cat}-${local.account_id}"],
    # Features volatility buckets (no DEFI)
    [for cat in ["cefi", "tradfi"] : "unified-trading-features-volatility-${cat}-${local.account_id}"],
    # Features onchain buckets (no TRADFI)
    [for cat in ["cefi", "defi"] : "unified-trading-features-onchain-${cat}-${local.account_id}"],
    # ML buckets
    [
      "unified-trading-ml-models-${local.account_id}",
      "unified-trading-ml-predictions-${local.account_id}",
      "unified-trading-ml-configs-${local.account_id}",
    ],
    # Strategy buckets
    [for cat in ["cefi", "tradfi", "defi"] : "unified-trading-strategy-${cat}-${local.account_id}"],
    # Execution buckets
    [for cat in ["cefi", "tradfi", "defi"] : "unified-trading-execution-${cat}-${local.account_id}"],
    # Deployment orchestration bucket
    ["unified-trading-deployment-orchestration-${local.account_id}"],
    # Terraform state bucket (if creating)
    var.create_terraform_state_bucket ? ["unified-trading-terraform-state-${local.account_id}"] : [],
  )

  # ECR repositories for all services
  ecr_repositories = [
    "instruments-service",
    "market-tick-data-service",
    "market-data-processing-service",
    "features-calendar-service",
    "features-delta-one-service",
    "features-volatility-service",
    "features-onchain-service",
    "ml-training-service",
    "ml-inference-service",
    "strategy-service",
    "execution-services",
  ]

  # Secrets to create
  secrets = {
    "tardis-api-key" = {
      description = "Tardis API key for CEFI data"
    }
    "databento-api-key" = {
      description = "Databento API key for TRADFI data"
    }
    "alchemy-api-key" = {
      description = "Alchemy API key for DEFI data"
    }
    "thegraph-api-key" = {
      description = "The Graph API key for DEFI data"
    }
    "github-token" = {
      description = "GitHub token for CodeBuild"
    }
  }
}

# =============================================================================
# Shared Infrastructure Module
# =============================================================================

module "shared_infrastructure" {
  source = "../../modules/shared-infrastructure/aws"

  name_prefix = "unified-trading"
  region      = var.region

  # ECR Configuration
  create_ecr_repository = false  # We'll create multiple repos below
  ecr_repository_name   = "unified-trading"

  # IAM Configuration
  create_iam_roles = var.create_iam_roles

  # VPC Configuration
  create_vpc         = var.create_vpc
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones

  # S3 Configuration
  create_s3_buckets = var.create_s3_buckets
  s3_bucket_names   = local.s3_buckets

  # Secrets Configuration
  create_secrets = var.create_secrets
  secrets        = local.secrets

  # Batch Configuration
  create_batch_environment = var.create_batch_environment
  batch_max_vcpus          = var.batch_max_vcpus

  tags = {
    Project     = "unified-trading"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# =============================================================================
# ECR Repositories (one per service)
# =============================================================================

resource "aws_ecr_repository" "services" {
  for_each = var.create_ecr_repositories ? toset(local.ecr_repositories) : []

  name                 = each.value
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Service = each.value
  }
}

resource "aws_ecr_lifecycle_policy" "services" {
  for_each = var.create_ecr_repositories ? toset(local.ecr_repositories) : []

  repository = aws_ecr_repository.services[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 30 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# =============================================================================
# DynamoDB Table for Terraform State Locking (optional)
# =============================================================================

resource "aws_dynamodb_table" "terraform_locks" {
  count = var.create_terraform_state_bucket ? 1 : 0

  name         = "unified-trading-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Purpose = "Terraform state locking"
  }
}
