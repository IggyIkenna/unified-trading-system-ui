# AWS EC2 Instance Module
#
# Creates an EC2 instance with Docker that runs a container.
# Equivalent to GCP Compute Engine with Container-Optimized OS.
#
# Features:
# - Amazon Linux 2 with Docker pre-installed
# - User data script for automated container execution
# - Self-termination on completion (optional)
# - Status reporting to S3 (optional)
# - Spot instance support for cost savings

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

# Get latest Amazon Linux 2 AMI with Docker
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ============================================================
# Local Variables
# ============================================================

locals {
  # Instance name with unique suffix
  instance_name = "${var.name}-${substr(uuid(), 0, 8)}"

  # Build environment variables for docker run
  env_vars = join(" ", [
    for k, v in var.environment_variables : "-e ${k}='${v}'"
  ])

  # Build docker args
  docker_args = join(" ", var.args)

  # User data script for container execution
  user_data = templatefile("${path.module}/user-data.sh.tpl", {
    instance_id     = local.instance_name
    region          = var.region
    docker_image    = var.image
    env_vars        = local.env_vars
    docker_args     = local.docker_args
    self_terminate  = var.self_terminate
    status_s3_path  = var.status_bucket != "" ? "s3://${var.status_bucket}/${var.status_prefix}/${var.deployment_id}/${var.shard_id}/status" : ""
    service_name    = var.service_name
    shard_id        = var.shard_id
    timeout_seconds = var.timeout_seconds
  })

  # Tags
  all_tags = merge(
    {
      "managed-by"  = "terraform"
      "service"     = var.service_name
      "environment" = var.environment
      "Name"        = local.instance_name
    },
    var.tags
  )
}

# ============================================================
# EC2 Instance
# ============================================================

resource "aws_instance" "vm" {
  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type

  # Network configuration
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = var.security_group_ids
  associate_public_ip_address = var.assign_public_ip

  # IAM instance profile
  iam_instance_profile = var.instance_profile_name

  # Storage
  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.disk_size_gb
    delete_on_termination = true
  }

  # User data for container execution
  user_data = local.user_data

  # Spot instance (equivalent to preemptible)
  instance_market_options {
    market_type = var.use_spot ? "spot" : null

    dynamic "spot_options" {
      for_each = var.use_spot ? [1] : []
      content {
        max_price                      = var.spot_max_price
        spot_instance_type             = "one-time"
        instance_interruption_behavior = "terminate"
      }
    }
  }

  # Tags
  tags = local.all_tags

  # Metadata options
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 for security
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  # Lifecycle
  lifecycle {
    create_before_destroy = false
  }
}
