# Terraform Modules - Cloud-Agnostic Infrastructure

## Overview

Reusable terraform modules that provide cloud-agnostic infrastructure primitives for the unified trading system.

Each module has both **GCP** and **AWS** implementations with equivalent functionality.

## Available Modules

### 1. container-job

Serverless container execution.

- **GCP**: Cloud Run Jobs
- **AWS**: AWS Batch with Fargate

**Use for**: Scheduled batch jobs, data processing, ML training/inference

```hcl
# GCP
module "job" {
  source = "./modules/container-job/gcp"
  # ... config
}

# AWS
module "job" {
  source = "./modules/container-job/aws"
  # ... config
}
```

### 2. workflow

Workflow orchestration for multi-step pipelines.

- **GCP**: Cloud Workflows (YAML syntax)
- **AWS**: Step Functions (JSON syntax)

**Use for**: Daily T+1 workflows, backfill orchestration, multi-stage pipelines

```hcl
# GCP
module "workflow" {
  source          = "./modules/workflow/gcp"
  workflow_source = file("workflow.yaml")
  # ... config
}

# AWS
module "workflow" {
  source     = "./modules/workflow/aws"
  definition = file("workflow.json")
  # ... config
}
```

### 3. scheduler

Scheduled triggers for workflows or jobs.

- **GCP**: Cloud Scheduler
- **AWS**: EventBridge Scheduler

**Use for**: Daily/hourly job triggers, cron-based execution. Supports 15-min intervals (`*/15 * * * *`) for live mode.

```hcl
# GCP - integrated into workflow module
module "workflow" {
  source   = "./modules/workflow/gcp"
  schedule = "30 8 * * *" # 8:30 AM UTC daily
  # schedule = "*/15 * * * *" # Every 15 min (e.g. instruments-service live mode)
  # ... config
}

# AWS - integrated into workflow module
module "workflow" {
  source   = "./modules/workflow/aws"
  schedule = "cron(30 8 * * ? *)" # 8:30 AM UTC daily
  # ... config
}
```

### 4. compute-vm

Virtual machine instances with Docker.

- **GCP**: Compute Engine with Container-Optimized OS
- **AWS**: EC2 with Amazon Linux 2 + Docker

**Use for**: Long-running computations, GPU workloads, specific hardware requirements

```hcl
# GCP
module "vm" {
  source = "./modules/compute-vm/gcp"
  image  = "gcr.io/project/image:latest"
  # ... config
}

# AWS
module "vm" {
  source = "./modules/compute-vm/aws"
  image  = "123456789012.dkr.ecr.region.amazonaws.com/image:latest"
  # ... config
}
```

### 5. shared-infrastructure

Shared resources (buckets, IAM, networking).

- **GCP**: GCS buckets, IAM service accounts, VPC
- **AWS**: S3 buckets, IAM roles, VPC

**Use for**: Common infrastructure that all services depend on

```hcl
# GCP
module "shared" {
  source     = "./modules/shared-infrastructure/gcp"
  project_id = "my-project"
  # ... config
}

# AWS
module "shared" {
  source     = "./modules/shared-infrastructure/aws"
  account_id = "123456789012"
  # ... config
}
```

### 6. cloud-build

CI/CD pipeline infrastructure.

- **GCP**: Cloud Build triggers
- **AWS**: CodeBuild projects + webhooks

**Use for**: Automated Docker image builds on git push

```hcl
# GCP
module "build" {
  source      = "./modules/cloud-build/gcp"
  github_repo = "IggyIkenna/my-service"
  # ... config
}

# AWS
module "build" {
  source          = "./modules/cloud-build/aws"
  source_location = "https://github.com/IggyIkenna/my-service"
  # ... config
}
```

## Module Design Principles

1. **Consistent Interface**: GCP and AWS modules have similar variable names and outputs where possible
2. **Sensible Defaults**: Most variables have defaults that work for common use cases
3. **Composable**: Modules can be combined to build complete service infrastructure
4. **Provider-Agnostic**: Business logic (args, env vars, schedules) is identical across providers

## Cost Optimization

### Use Spot/Preemptible Instances

```hcl
# GCP
module "job" {
  source      = "./modules/compute-vm/gcp"
  preemptible = true # 60-90% cheaper
}

# AWS
module "vm" {
  source   = "./modules/compute-vm/aws"
  use_spot = true # ~70% cheaper
}
```

### Right-Size Resources

```hcl
# Small job: 1 vCPU, 2GB RAM
cpu    = "1"
memory = "2Gi"

# Medium job: 4 vCPU, 8GB RAM (default)
cpu    = "4"
memory = "8Gi"

# Large job: 8 vCPU, 16GB RAM
cpu    = "8"
memory = "16Gi"
```

## Testing Modules

Each module can be tested independently:

```bash
# Navigate to module
cd modules/container-job/gcp

# Initialize
terraform init

# Validate syntax
terraform validate

# Format check
terraform fmt -check

# Create test configuration
cat > test.tf <<EOF
module "test_job" {
  source = "."

  name       = "test-job"
  project_id = "test-project"
  region     = "asia-northeast1"
  image      = "gcr.io/test/image:latest"

  service_account_email = "test@test.iam.gserviceaccount.com"
}
EOF

# Plan (will fail without real credentials, but validates structure)
terraform plan
```

## Related Documentation

- [Terraform README](../README.md) - Quick start and usage guide
- [Cloud-Agnostic Migration](../../../unified-trading-codex/05-infrastructure/cloud-agnostic-migration.md)
- [Deployment Guide](../../../unified-trading-codex/05-infrastructure/deployment-guide.md)
