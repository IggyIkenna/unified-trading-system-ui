"""
Provider Factory for Compute Backends

Provides factory functions to create the appropriate backend implementation
based on the cloud provider and compute type.

Usage:
    from backends.provider_factory import get_backend, get_backend_for_provider

    # Get backend based on current CLOUD_PROVIDER env var
    backend = get_backend(compute_type="cloud_run", project_id="...", region="...")

    # Explicitly specify provider
    backend = get_backend_for_provider(
        provider="aws",
        compute_type="batch",  # or "cloud_run" - maps to aws_batch
        project_id="...",
        region="...",
    )
"""

import logging
import sys
from pathlib import Path

# Add repo root to sys.path for deployment_service imports
_repo_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_repo_root))

from unified_config_interface import get_deployment_target

from deployment_service.deployment_config import DeploymentConfig

from .aws_batch import AWSBatchBackend
from .aws_ec2 import AWSEC2Backend
from .base import ComputeBackend
from .cloud_run import CloudRunBackend
from .vm import VMBackend

logger = logging.getLogger(__name__)


# Compute type mapping between providers
COMPUTE_TYPE_MAP = {
    "gcp": {
        "cloud_run": "cloud_run",
        "vm": "vm",
    },
    "aws": {
        "cloud_run": "batch",  # Cloud Run equivalent
        "batch": "batch",
        "vm": "ec2",
        "ec2": "ec2",
    },
}


def get_cloud_provider() -> str:
    """Get the current cloud provider from deployment config."""
    config = DeploymentConfig()
    return config.cloud_provider.lower()


def get_backend_for_provider(
    provider: str,
    compute_type: str,
    project_id: str,
    region: str,
    service_account_email: str = "",
    **kwargs,
) -> ComputeBackend:
    """
    Get a compute backend for the specified provider.

    Args:
        provider: Cloud provider ("gcp" or "aws")
        compute_type: Compute type ("cloud_run", "vm", "batch", "ec2")
        project_id: GCP project ID or AWS account ID
        region: Cloud region
        service_account_email: GCP service account (not used for AWS)
        **kwargs: Additional backend-specific parameters

    Returns:
        ComputeBackend implementation
    """
    provider = provider.lower()

    # Normalize compute type for the provider
    normalized_type = COMPUTE_TYPE_MAP.get(provider, {}).get(compute_type, compute_type)

    if provider == "gcp":
        return _get_gcp_backend(
            normalized_type, project_id, region, service_account_email, **kwargs
        )
    elif provider == "aws":
        return _get_aws_backend(normalized_type, project_id, region, **kwargs)
    else:
        raise ValueError(f"Unsupported cloud provider: {provider}")


def get_backend(
    compute_type: str,
    project_id: str,
    region: str,
    service_account_email: str = "",
    **kwargs,
) -> ComputeBackend:
    """
    Get a compute backend based on the current CLOUD_PROVIDER env var.

    Args:
        compute_type: Compute type ("cloud_run", "vm", etc.)
        project_id: GCP project ID or AWS account ID
        region: Cloud region
        service_account_email: GCP service account
        **kwargs: Additional backend-specific parameters

    Returns:
        ComputeBackend implementation
    """
    provider = get_cloud_provider()
    return get_backend_for_provider(
        provider, compute_type, project_id, region, service_account_email, **kwargs
    )


def _get_gcp_backend(
    compute_type: str,
    project_id: str,
    region: str,
    service_account_email: str,
    **kwargs,
) -> ComputeBackend:
    """Get a GCP compute backend."""
    if compute_type == "cloud_run":
        job_name = kwargs.get("job_name")
        if not isinstance(job_name, str):
            raise ValueError("job_name is required for cloud_run compute type")
        return CloudRunBackend(
            project_id=project_id,
            region=region,
            service_account_email=service_account_email,
            job_name=job_name,
        )
    elif compute_type == "vm":
        return VMBackend(
            project_id=project_id,
            region=region,
            service_account_email=service_account_email,
            zone=kwargs.get("zone"),
            status_bucket=kwargs.get("status_bucket"),  # Required for status tracking
            status_prefix=kwargs.get("status_prefix", "deployments"),
        )
    else:
        raise ValueError(f"Unsupported GCP compute type: {compute_type}")


def _get_aws_backend(
    compute_type: str,
    project_id: str,  # AWS account ID
    region: str,
    **kwargs,
) -> ComputeBackend:
    """Get an AWS compute backend."""
    if compute_type == "batch":
        return AWSBatchBackend(
            project_id=project_id,
            region=region,
            job_queue=kwargs.get("job_queue"),
            job_definition=kwargs.get("job_definition"),
        )
    elif compute_type == "ec2":
        return AWSEC2Backend(
            project_id=project_id,
            region=region,
            subnet_id=kwargs.get("subnet_id"),
            security_group_id=kwargs.get("security_group_id"),
            instance_profile_arn=kwargs.get("instance_profile_arn"),
            key_name=kwargs.get("key_name"),
        )
    else:
        raise ValueError(f"Unsupported AWS compute type: {compute_type}")


def get_backend_for_service(
    service_name: str,
    project_id: str,
    region: str,
    service_account_email: str = "",
    **kwargs,
) -> ComputeBackend:
    """
    Get a compute backend by resolving the deployment target from the topology SSOT.

    Uses get_deployment_target(service_name) from unified_config_interface.topology_reader
    to look up cloud_run vs vm (or ecs/batch for AWS) from runtime-topology.yaml.

    Args:
        service_name: Service name (e.g. "deployment-api", "instruments-service")
        project_id: GCP project ID or AWS account ID
        region: Cloud region
        service_account_email: GCP service account (not used for AWS)
        **kwargs: Additional backend-specific parameters (job_name for cloud_run, zone for vm)

    Returns:
        ComputeBackend implementation selected by topology
    """
    compute_type = get_deployment_target(service_name)
    logger.info(
        "Topology resolved deployment target for '%s': compute_type='%s'",
        service_name,
        compute_type,
    )
    return get_backend(
        compute_type=compute_type,
        project_id=project_id,
        region=region,
        service_account_email=service_account_email,
        **kwargs,
    )


def list_available_backends(provider: str | None = None) -> dict[str, list[str]]:
    """
    List available backends for a provider or all providers.

    Args:
        provider: Optional provider to filter by

    Returns:
        Dictionary mapping provider -> list of compute types
    """
    all_backends = {
        "gcp": ["cloud_run", "vm"],
        "aws": ["batch", "ec2"],
    }

    if provider:
        provider = provider.lower()
        return {provider: all_backends.get(provider, [])}

    return all_backends
