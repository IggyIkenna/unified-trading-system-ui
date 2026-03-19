"""
Helper utilities for deployment operations.

Contains utility functions for resource mapping, backend selection,
and other common deployment operations.
"""

import re
from typing import cast

from deployment_service.backends import CloudRunBackend, ComputeBackend, VMBackend


def vm_resource_request(compute_config: dict[str, object]) -> dict[str, float]:
    """
    Best-effort mapping from VM compute_config -> regional quota metrics.

    Args:
        compute_config: VM compute configuration with machine_type and disk_size_gb

    Returns:
        Dictionary mapping quota metric names to required amounts
    """
    machine_type = str(compute_config.get("machine_type") or "")
    disk_size_gb = float(cast(float, compute_config.get("disk_size_gb") or 0.0))

    # Parse vCPU count from trailing machine type (e.g., c2-standard-16 -> 16)
    vcpus = 0.0
    m = re.match(r".+-(\d+)$", machine_type.strip()) if machine_type else None
    if m:
        try:
            vcpus = float(int(m.group(1)))
        except (OSError, ValueError, RuntimeError):
            vcpus = 0.0

    family = machine_type.lower().split("-")[0] if machine_type else ""
    if family == "c2":
        cpu_metric = "C2_CPUS"
    elif family == "c2d":
        cpu_metric = "C2D_CPUS"
    elif family == "c3":
        cpu_metric = "C3_CPUS"
    elif family == "n2":
        cpu_metric = "N2_CPUS"
    elif family == "e2":
        cpu_metric = "E2_CPUS"
    else:
        cpu_metric = "CPUS"

    return {
        cpu_metric: vcpus,
        "IN_USE_ADDRESSES": 1.0,
        "SSD_TOTAL_GB": disk_size_gb,
    }


def get_backend(
    compute_type: str,
    project_id: str,
    region: str,
    service_account_email: str,
    state_bucket: str,
    state_prefix: str,
    job_name: str | None = None,
    zone: str | None = None,
) -> ComputeBackend:
    """
    Get the appropriate compute backend.

    Args:
        compute_type: 'cloud_run' or 'vm'
        project_id: GCP project ID
        region: GCP region
        service_account_email: Service account for jobs/VMs
        state_bucket: GCS bucket for state storage
        state_prefix: Prefix for state files
        job_name: Cloud Run job name (required for cloud_run)
        zone: GCP zone (for VM backend)

    Returns:
        ComputeBackend instance

    Raises:
        ValueError: If compute_type is unknown or required parameters are missing
    """
    if compute_type == "cloud_run":
        if not job_name:
            raise ValueError("job_name required for cloud_run backend")
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
            zone=zone,
            status_bucket=state_bucket,
            status_prefix=state_prefix,
        )
    else:
        raise ValueError(f"Unknown compute type: {compute_type}")
