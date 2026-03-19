# Compute Backends - Cloud-Agnostic Deployment

## Overview

This module provides **production-ready, cloud-agnostic compute backends** for deploying containerized workloads on GCP or AWS.

## Architecture

### Provider Factory Pattern

The system auto-detects the cloud provider via `CLOUD_PROVIDER` environment variable:

```python
from backends import get_backend

# Auto-detects provider (GCP or AWS)
backend = get_backend(
    compute_type="cloud_run",  # Maps to AWS Batch if CLOUD_PROVIDER=aws
    project_id="my-project",
    region="asia-northeast1",
    service_account_email="sa@project.iam.gserviceaccount.com"
)

# Deploy (works on both clouds)
job = backend.deploy_shard(
    job_name="my-job",
    image="gcr.io/project/image:latest",  # or ECR for AWS
    args=["--mode", "batch"],
    env_vars={"ENVIRONMENT": "production"}
)

# Get status (works on both clouds)
status = backend.get_status(job.job_id)
```

## Available Backends

### GCP Backends (Production)

**1. VMBackend** (`vm.py` - 1,490 lines)

- **Service**: Google Compute Engine
- **Use Case**: Long-running computations, GPU workloads
- **Features**:
  - Container-Optimized OS
  - Self-deletion after completion
  - Zone-based failover (within region)
  - GCS status reporting
  - Preemptible instance support

**2. CloudRunBackend** (`cloud_run.py` - 566 lines)

- **Service**: Cloud Run Jobs
- **Use Case**: Serverless batch jobs, scheduled tasks
- **Features**:
  - Fully managed container execution
  - Automatic retries (3x with backoff)
  - GCS FUSE volumes for fast I/O
  - Timeout handling

### AWS Backends (Production)

**3. AWSEC2Backend** (`aws_ec2.py` - 383 lines)

- **Service**: Amazon EC2
- **Use Case**: Equivalent to GCP Compute Engine
- **Features**:
  - Amazon Linux 2 with Docker
  - Self-termination after completion
  - S3 status reporting
  - Spot instance support

**4. AWSBatchBackend** (`aws_batch.py` - 415 lines)

- **Service**: AWS Batch with Fargate
- **Use Case**: Equivalent to Cloud Run Jobs
- **Features**:
  - Serverless container execution
  - Automatic retries
  - CloudWatch logging
  - Timeout handling

## Base Interface

All backends implement the `ComputeBackend` abstract base class (`base.py` - 217 lines):

```python
class ComputeBackend(ABC):
    @abstractmethod
    def deploy_shard(self, job_name, image, args, env_vars, ...):
        """Deploy a compute job (VM or container)"""
        pass

    @abstractmethod
    def get_status(self, job_id):
        """Get current job status"""
        pass

    @abstractmethod
    def cancel_job(self, job_id):
        """Cancel a running job"""
        pass

    @abstractmethod
    def get_logs_url(self, job_id):
        """Get URL to view logs"""
        pass
```

## Provider Factory (`provider_factory.py` - 196 lines)

The factory provides cloud-agnostic backend selection:

```python
from backends import get_backend, get_backend_for_provider, get_cloud_provider

# Option 1: Auto-detect from CLOUD_PROVIDER env var
backend = get_backend(compute_type="vm", ...)

# Option 2: Explicitly specify provider
backend = get_backend_for_provider(
    provider="aws",
    compute_type="vm",  # Maps to EC2
    ...
)

# Get current provider
provider = get_cloud_provider()  # Returns "gcp" or "aws"
```

## Compute Type Mapping

The factory automatically maps compute types between providers:

| Generic Type | GCP Backend    | AWS Backend         |
| ------------ | -------------- | ------------------- |
| `cloud_run`  | Cloud Run Jobs | AWS Batch (Fargate) |
| `batch`      | Cloud Run Jobs | AWS Batch (Fargate) |
| `vm`         | Compute Engine | EC2                 |
| `ec2`        | Compute Engine | EC2                 |

## Environment Variables

```bash
# Required
CLOUD_PROVIDER=gcp  # or "aws"

# GCP
GCP_PROJECT_ID=test-project
GCS_REGION=asia-northeast1

# AWS
AWS_ACCOUNT_ID=123456789012
AWS_REGION=ap-northeast-1
```

## Usage Examples

### Deploy to GCP Cloud Run

```python
import os
os.environ["CLOUD_PROVIDER"] = "gcp"

from backends import get_backend

backend = get_backend(
    compute_type="cloud_run",
    project_id="my-gcp-project",
    region="asia-northeast1",
    service_account_email="service@project.iam.gserviceaccount.com"
)

job = backend.deploy_shard(
    job_name="data-processing-job",
    image="gcr.io/my-project/processor:latest",
    args=["--start-date", "2024-01-01"],
    env_vars={"ENVIRONMENT": "production"},
    cpu="4",
    memory="8Gi",
    timeout_seconds=3600
)

print(f"Job ID: {job.job_id}")
print(f"Status: {job.status}")
```

### Deploy to AWS Batch

```python
import os
os.environ["CLOUD_PROVIDER"] = "aws"

from backends import get_backend

backend = get_backend(
    compute_type="cloud_run",  # Automatically maps to AWS Batch
    project_id="123456789012",  # AWS account ID
    region="ap-northeast-1"
)

job = backend.deploy_shard(
    job_name="data-processing-job",
    image="123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/processor:latest",
    args=["--start-date", "2024-01-01"],
    env_vars={"ENVIRONMENT": "production"},
    cpu="4",
    memory="8192",  # MB for AWS
    timeout_seconds=3600
)

print(f"Job ID: {job.job_id}")
print(f"Status: {job.status}")
```

### Deploy VMs with Spot/Preemptible

```python
from backends import get_backend

backend = get_backend(
    compute_type="vm",
    project_id="...",
    region="...",
    service_account_email="..."
)

job = backend.deploy_shard(
    job_name="gpu-training-job",
    image="...",
    args=["--operation", "train_phase1", "--mode", "batch"],
    env_vars={},
    machine_type="n1-standard-8",  # GCP
    # instance_type="c5.2xlarge",  # AWS
    preemptible=True,  # GCP (60-90% cheaper)
    # use_spot=True,  # AWS (~70% cheaper)
)
```

## Testing

All backends include comprehensive unit tests with mocked cloud APIs:

```bash
# Test GCP backends
pytest tests/unit/test_vm_backend.py
pytest tests/unit/test_cloud_run_backend.py

# Test AWS backends
pytest tests/unit/test_aws_ec2_backend.py
pytest tests/unit/test_aws_batch_backend.py

# Test factory
pytest tests/unit/test_provider_factory.py
```

## File Structure

```
backends/
├── __init__.py              71 lines   (Exports + lazy AWS imports)
├── base.py                 217 lines   (Abstract ComputeBackend)
├── provider_factory.py     196 lines   (Cloud-agnostic factory)
├── vm.py                 1,490 lines   (GCP Compute Engine)
├── cloud_run.py            566 lines   (GCP Cloud Run Jobs)
├── aws_ec2.py              383 lines   (AWS EC2)
└── aws_batch.py            415 lines   (AWS Batch + Fargate)
                          ─────────
                          3,338 lines   (Production code)
```

## Design Principles

1. **Single Source of Truth**: This module is the canonical compute abstraction for the entire system
2. **Cloud-Agnostic by Default**: Use `get_backend()` for automatic provider detection
3. **Production-Ready**: All backends are battle-tested in production
4. **No Duplication**: Other services import directly from this module
5. **Consistent Interface**: Same methods work across all providers

## Related Documentation

- [Cloud-Agnostic Migration Guide](../docs/CLOUD_AGNOSTIC_MIGRATION.md)
- [Terraform Infrastructure](../terraform/README.md)
- [Deployment Guide](../docs/INFRASTRUCTURE.md)
