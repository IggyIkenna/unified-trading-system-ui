"""
Compute backends for deployment orchestration.

Multi-cloud support for GCP and AWS:

GCP Backends:
- CloudRunBackend: Cloud Run Jobs (cloud_run.py)
- VMBackend: GCE VMs with Container-Optimized OS (vm.py)

AWS Backends:
- AWSBatchBackend: AWS Batch with Fargate (aws_batch.py)
- AWSEC2Backend: EC2 instances with ECS-optimized AMI (aws_ec2.py)

Usage:
    # Use provider factory for cloud-agnostic backend selection
    from backends import get_backend

    backend = get_backend(
        compute_type="cloud_run",  # Maps to Batch on AWS
        project_id="...",
        region="...",
    )
"""

from .base import ComputeBackend, JobInfo, JobStatus
from .provider_factory import (
    get_backend,
    get_backend_for_provider,
    get_cloud_provider,
    list_available_backends,
)
from .vm import VMBackend

__all__ = [
    # Base classes
    "ComputeBackend",
    "JobInfo",
    "JobStatus",
    "VMBackend",
    # Provider factory (recommended for multi-cloud)
    "get_backend",
    "get_backend_for_provider",
    "get_cloud_provider",
    "list_available_backends",
]


def __getattr__(name: str):
    """Lazy-load CloudRunBackend (requires google-cloud-run, breaks when run_v2 unavailable)."""
    if name == "CloudRunBackend":
        from .cloud_run import CloudRunBackend

        return CloudRunBackend
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
