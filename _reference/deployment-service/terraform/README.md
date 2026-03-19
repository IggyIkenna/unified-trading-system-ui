# Terraform Infrastructure - Cloud-Agnostic Deployment

## Overview

This terraform configuration provides **cloud-agnostic infrastructure** for the unified trading system, supporting both **GCP** and **AWS** deployments with equivalent functionality.

## Architecture

### Provider Equivalents

| GCP Service        | AWS Service           | Terraform Module        | Status                                                     |
| ------------------ | --------------------- | ----------------------- | ---------------------------------------------------------- |
| Cloud Run Jobs     | AWS Batch (Fargate)   | `modules/container-job` | ✅ Complete                                                |
| Cloud Workflows    | Step Functions        | `modules/workflow`      | ✅ Complete                                                |
| Cloud Scheduler    | EventBridge Scheduler | `modules/scheduler`     | ✅ Complete (supports `*/15 * * * *` for 15-min intervals) |
| Compute Engine VMs | EC2 Instances         | `modules/compute-vm`    | ✅ Complete (GCP)                                          |
| Artifact Registry  | ECR                   | Image paths             | ✅ Complete                                                |
| Cloud Storage      | S3                    | Service configs         | ✅ Complete                                                |
| Secret Manager     | Secrets Manager       | Service configs         | ✅ Complete                                                |

### Directory Structure

```
terraform/
├── modules/                    # Reusable terraform modules
│   ├── container-job/
│   │   ├── gcp/               # Cloud Run Jobs
│   │   └── aws/               # AWS Batch (Fargate)
│   ├── workflow/
│   │   ├── gcp/               # Cloud Workflows
│   │   └── aws/               # Step Functions
│   ├── scheduler/
│   │   ├── gcp/               # Cloud Scheduler
│   │   └── aws/               # EventBridge Scheduler
│   ├── compute-vm/
│   │   └── gcp/               # Compute Engine (AWS EC2 coming soon)
│   └── shared-infrastructure/
│       ├── gcp/               # GCS buckets, IAM, etc.
│       └── aws/               # S3 buckets, IAM, etc.
├── services/                  # Per-service terraform configs
│   ├── instruments-service/
│   │   ├── gcp/               # GCP deployment
│   │   └── aws/               # AWS deployment
│   ├── market-data-processing-service/
│   │   ├── gcp/
│   │   └── aws/
│   └── ... (11 services total)
├── shared/                    # Shared infrastructure (buckets, IAM)
│   ├── gcp/
│   └── aws/
├── cloud-build/               # CI/CD infrastructure
│   ├── gcp/                   # Cloud Build triggers
│   └── aws/                   # CodeBuild/CodePipeline
└── dashboard/                 # Deployment dashboard infrastructure
    └── gcp/                   # Cloud Run + BigTable

```

## Quick Start

### Prerequisites

1. **Terraform** >= 1.0.0
2. **Cloud credentials**:
   - GCP: `gcloud auth application-default login`
   - AWS: `aws configure` or set `AWS_PROFILE`

### Deploy to GCP

```bash
# 1. Initialize terraform
cd terraform/services/instruments-service/gcp
terraform init

# 2. Review plan
terraform plan \
  -var="project_id=your-gcp-project" \
  -var="region=asia-northeast1" \
  -var="docker_image=gcr.io/your-project/instruments-service:latest"

# 3. Apply
terraform apply
```

### Deploy to AWS

```bash
# 1. Initialize terraform
cd terraform/services/instruments-service/aws
terraform init

# 2. Review plan
terraform plan \
  -var="region=ap-northeast-1" \
  -var="docker_image=123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/instruments-service:latest" \
  -var="job_queue_arn=arn:aws:batch:ap-northeast-1:123456789012:job-queue/trading-system" \
  -var="execution_role_arn=arn:aws:iam::123456789012:role/batch-execution-role" \
  -var="job_role_arn=arn:aws:iam::123456789012:role/instruments-service-role"

# 3. Apply
terraform apply
```

## Module Usage

### Container Job Module

#### GCP (Cloud Run Jobs)

```hcl
module "my_job" {
  source = "../../modules/container-job/gcp"

  name       = "my-service-job"
  project_id = "my-gcp-project"
  region     = "asia-northeast1"

  image                 = "gcr.io/my-project/my-service:latest"
  service_account_email = "my-service@my-project.iam.gserviceaccount.com"

  cpu             = "4"
  memory          = "8Gi"
  timeout_seconds = 3600
  max_retries     = 3

  environment_variables = {
    ENVIRONMENT    = "production"
    GCP_PROJECT_ID = "my-gcp-project"
  }

  secret_environment_variables = {
    API_KEY = {
      secret_name = "my-api-key"
      version     = "latest"
    }
  }

  # GCS FUSE volumes for fast I/O
  gcs_volumes = [
    { name = "data-store", bucket = "my-data-bucket", read_only = false }
  ]

  labels = {
    app     = "my-service"
    version = "v2"
  }
}
```

#### AWS (AWS Batch with Fargate)

```hcl
module "my_job" {
  source = "../../modules/container-job/aws"

  name   = "my-service-job"
  region = "ap-northeast-1"
  image  = "123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/my-service:latest"

  vcpus     = "4"
  memory_mb = "8192"

  timeout_seconds = 3600
  max_retries     = 3

  execution_role_arn = "arn:aws:iam::123456789012:role/batch-execution-role"
  job_role_arn       = "arn:aws:iam::123456789012:role/my-service-role"

  environment_variables = {
    ENVIRONMENT = "production"
    AWS_REGION  = "ap-northeast-1"
  }

  secret_environment_variables = {
    API_KEY = {
      secret_arn = "arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:my-api-key"
    }
  }

  subnet_ids         = ["subnet-12345678"]
  security_group_ids = ["sg-12345678"]
  assign_public_ip   = true

  log_group_name     = "/aws/batch/my-service"
  create_log_group   = true
  log_retention_days = 30

  tags = {
    app     = "my-service"
    version = "v2"
  }
}
```

### Workflow Module

#### GCP (Cloud Workflows)

```hcl
module "my_workflow" {
  source = "../../modules/workflow/gcp"

  name       = "my-service-workflow"
  project_id = "my-gcp-project"
  region     = "asia-northeast1"

  description           = "Daily workflow for my-service"
  service_account_email = "my-service@my-project.iam.gserviceaccount.com"

  workflow_source = file("${path.module}/workflow.yaml")

  # Schedule at 8:30 AM UTC daily
  schedule                        = "30 8 * * *"
  time_zone                       = "UTC"
  scheduler_service_account_email = "scheduler@my-project.iam.gserviceaccount.com"

  workflow_args = {
    trigger = "scheduled"
  }

  labels = {
    app  = "my-service"
    type = "daily"
  }
}
```

#### AWS (Step Functions)

```hcl
module "my_workflow" {
  source = "../../modules/workflow/aws"

  name   = "my-service-workflow"
  region = "ap-northeast-1"

  description = "Daily workflow for my-service"

  definition  = file("${path.module}/workflow.json")
  create_role = true

  # Schedule at 8:30 AM UTC daily
  schedule  = "cron(30 8 * * ? *)"
  time_zone = "UTC"

  create_scheduler_role = true

  workflow_args = {
    trigger = "scheduled"
  }

  tags = {
    app  = "my-service"
    type = "daily"
  }
}
```

## Environment Variables

All services use `unified-trading-library` config classes that automatically detect the provider via `CLOUD_PROVIDER` env var:

### GCP Deployment

```bash
export CLOUD_PROVIDER=gcp
export GCP_PROJECT_ID=test-project
export GCS_REGION=asia-northeast1
```

### AWS Deployment

```bash
export CLOUD_PROVIDER=aws
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=ap-northeast-1
```

## State Management

### GCP (Cloud Storage Backend)

```hcl
terraform {
  backend "gcs" {
    bucket = "terraform-state-bucket"
    prefix = "services/my-service"
  }
}
```

### AWS (S3 Backend)

```hcl
terraform {
  backend "s3" {
    bucket = "terraform-state-bucket"
    key    = "services/my-service/terraform.tfstate"
    region = "ap-northeast-1"
  }
}
```

## Workflow Syntax Differences

### GCP (Cloud Workflows - YAML)

Cloud Workflows uses YAML syntax with direct HTTP calls to Cloud Run API:

```yaml
main:
  params: [args]
  steps:
    - run_job:
        call: http.post
        args:
          url: ${"https://" + region + "-run.googleapis.com/v2/.../jobs/" + job_name + ":run"}
          auth:
            type: OAuth2
          body:
            overrides:
              containerOverrides:
                - args: ["--operation", "<op>", "--mode", "batch"]
```

### AWS (Step Functions - JSON)

Step Functions uses JSON syntax with state machine definition:

```json
{
  "Comment": "Daily workflow",
  "StartAt": "SubmitBatchJob",
  "States": {
    "SubmitBatchJob": {
      "Type": "Task",
      "Resource": "arn:aws:states:::batch:submitJob.sync",
      "Parameters": {
        "JobName": "my-service-daily",
        "JobDefinition": "${job_definition_arn}",
        "JobQueue": "${job_queue_arn}",
        "ContainerOverrides": {
          "Command": ["--operation", "<op>", "--mode", "batch"]
        }
      }
    }
  }
}
```

## Cost Comparison

### GCP

- Cloud Run Jobs: $0.000024/vCPU-second + $0.0000025/GB-second
- Cloud Workflows: $0.01 per 1,000 steps
- Cloud Storage: $0.020/GB/month (Standard)

### AWS

- Fargate: $0.04048/vCPU-hour + $0.004445/GB-hour
- Step Functions: $0.025 per 1,000 state transitions
- S3: $0.023/GB/month (Standard)

**Estimate for daily job (4 vCPU, 8GB, 30 min runtime)**:

- GCP: ~$0.12/day
- AWS: ~$0.14/day

## Service-Specific Configurations

Each service has both GCP and AWS terraform configs that are functionally equivalent:

1. **instruments-service**: Daily T+1, backfill, and live workflows (live: every 15 min via Cloud Scheduler `*/15 * * * *`, single-cycle Cloud Run to avoid wasting compute)
2. **market-data-processing-service**: Sharded by category/date
3. **market-tick-data-service**: Sharded by venue/date
4. **features-\*-service**: Feature engineering pipelines
5. **ml-training-service**: Model training workflows
6. **ml-inference-service**: Prediction workflows
7. **strategy-service**: Strategy backtesting
8. **execution-service**: Trade execution simulation

## Testing

### Validate Terraform

```bash
# GCP
cd terraform/services/instruments-service/gcp
terraform validate
terraform fmt -check

# AWS
cd terraform/services/instruments-service/aws
terraform validate
terraform fmt -check
```

### Test VM Deployment

```bash
cd terraform/tests/vm-test
terraform init
terraform apply -var="project_id=your-project" -auto-approve
terraform destroy -auto-approve
```

## Troubleshooting

### GCP Issues

**Error: Permission denied**

```bash
# Grant required roles
gcloud projects add-iam-policy-binding YOUR_PROJECT \
  --member="serviceAccount:YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/run.admin"
```

**Error: Quota exceeded**

```bash
# Request quota increase in Cloud Console
# Navigation: IAM & Admin → Quotas → Filter by "Cloud Run"
```

### AWS Issues

**Error: No default VPC**

```bash
# Create VPC, subnets, and security groups
terraform apply -target=module.shared_infrastructure
```

**Error: ECR image pull failed**

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com
```

## Related Documentation

- [Cloud-Agnostic Migration Guide](../../unified-trading-codex/05-infrastructure/cloud-agnostic-migration.md)
- [Deployment Guide](../../unified-trading-codex/05-infrastructure/deployment-guide.md)
- [Coding Standards](../../unified-trading-codex/06-coding-standards/README.md)
