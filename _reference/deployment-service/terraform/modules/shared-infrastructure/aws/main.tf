# AWS Shared Infrastructure Module
# Creates foundational resources for running batch jobs on AWS
#
# This module provisions:
# - ECR Repository for Docker images
# - IAM Roles (execution, job, batch service, scheduler)
# - VPC with public/private subnets
# - Security Groups
# - S3 Buckets for data storage
# - Secrets Manager secrets
# - Batch Compute Environment and Job Queue

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
}

# =============================================================================
# ECR Repository
# =============================================================================

resource "aws_ecr_repository" "repo" {
  count = var.create_ecr_repository ? 1 : 0

  name                 = var.ecr_repository_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(
    {
      "managed-by" = "terraform"
    },
    var.tags
  )
}

resource "aws_ecr_lifecycle_policy" "cleanup" {
  count = var.create_ecr_repository ? 1 : 0

  repository = aws_ecr_repository.repo[0].name

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
# IAM Roles
# =============================================================================

# ECS Task Execution Role (for pulling images, logs)
resource "aws_iam_role" "execution_role" {
  count = var.create_iam_roles ? 1 : 0

  name = "${var.name_prefix}-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "execution_role_policy" {
  count = var.create_iam_roles ? 1 : 0

  role       = aws_iam_role.execution_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "execution_role_secrets" {
  count = var.create_iam_roles ? 1 : 0

  name = "${var.name_prefix}-secrets-access"
  role = aws_iam_role.execution_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:*"
      }
    ]
  })
}

# Job Role (for application access to AWS services)
resource "aws_iam_role" "job_role" {
  count = var.create_iam_roles ? 1 : 0

  name = "${var.name_prefix}-job-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "job_role_s3" {
  count = var.create_iam_roles ? 1 : 0

  name = "${var.name_prefix}-s3-access"
  role = aws_iam_role.job_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.name_prefix}-*",
          "arn:aws:s3:::${var.name_prefix}-*/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "job_role_secrets" {
  count = var.create_iam_roles ? 1 : 0

  name = "${var.name_prefix}-secrets-read"
  role = aws_iam_role.job_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:*"
      }
    ]
  })
}

# Batch Service Role
resource "aws_iam_role" "batch_service_role" {
  count = var.create_iam_roles ? 1 : 0

  name = "${var.name_prefix}-batch-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "batch.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "batch_service_role_policy" {
  count = var.create_iam_roles ? 1 : 0

  role       = aws_iam_role.batch_service_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole"
}

# =============================================================================
# VPC and Networking
# =============================================================================

resource "aws_vpc" "main" {
  count = var.create_vpc ? 1 : 0

  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    {
      Name         = "${var.name_prefix}-vpc"
      "managed-by" = "terraform"
    },
    var.tags
  )
}

resource "aws_internet_gateway" "main" {
  count = var.create_vpc ? 1 : 0

  vpc_id = aws_vpc.main[0].id

  tags = merge(
    {
      Name = "${var.name_prefix}-igw"
    },
    var.tags
  )
}

resource "aws_subnet" "public" {
  count = var.create_vpc ? length(var.availability_zones) : 0

  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    {
      Name = "${var.name_prefix}-public-${count.index + 1}"
      Type = "public"
    },
    var.tags
  )
}

resource "aws_route_table" "public" {
  count = var.create_vpc ? 1 : 0

  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = merge(
    {
      Name = "${var.name_prefix}-public-rt"
    },
    var.tags
  )
}

resource "aws_route_table_association" "public" {
  count = var.create_vpc ? length(var.availability_zones) : 0

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

# Security Group for Batch jobs
resource "aws_security_group" "batch" {
  count = var.create_vpc ? 1 : 0

  name        = "${var.name_prefix}-batch-sg"
  description = "Security group for AWS Batch jobs"
  vpc_id      = aws_vpc.main[0].id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    {
      Name = "${var.name_prefix}-batch-sg"
    },
    var.tags
  )
}

# =============================================================================
# S3 Buckets
# =============================================================================

resource "aws_s3_bucket" "data_buckets" {
  for_each = var.create_s3_buckets ? toset(var.s3_bucket_names) : []

  bucket = each.value

  tags = merge(
    {
      "managed-by" = "terraform"
    },
    var.tags
  )
}

resource "aws_s3_bucket_versioning" "data_buckets" {
  for_each = var.create_s3_buckets ? toset(var.s3_bucket_names) : []

  bucket = aws_s3_bucket.data_buckets[each.key].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_buckets" {
  for_each = var.create_s3_buckets ? toset(var.s3_bucket_names) : []

  bucket = aws_s3_bucket.data_buckets[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# =============================================================================
# Secrets Manager
# =============================================================================

resource "aws_secretsmanager_secret" "secrets" {
  for_each = var.create_secrets ? var.secrets : {}

  name        = each.key
  description = each.value.description

  tags = merge(
    {
      "managed-by" = "terraform"
    },
    var.tags
  )
}

# =============================================================================
# Batch Compute Environment
# =============================================================================

resource "aws_batch_compute_environment" "fargate" {
  count = var.create_batch_environment ? 1 : 0

  compute_environment_name = "${var.name_prefix}-fargate"
  type                     = "MANAGED"

  compute_resources {
    type      = "FARGATE"
    max_vcpus = var.batch_max_vcpus

    subnets         = var.create_vpc ? aws_subnet.public[*].id : var.existing_subnet_ids
    security_groups = var.create_vpc ? [aws_security_group.batch[0].id] : var.existing_security_group_ids
  }

  service_role = var.create_iam_roles ? aws_iam_role.batch_service_role[0].arn : var.existing_batch_service_role_arn

  tags = var.tags
}

# Batch Job Queue
resource "aws_batch_job_queue" "main" {
  count = var.create_batch_environment ? 1 : 0

  name     = "${var.name_prefix}-queue"
  state    = "ENABLED"
  priority = 1

  compute_environment_order {
    order               = 1
    compute_environment = aws_batch_compute_environment.fargate[0].arn
  }

  tags = var.tags
}
