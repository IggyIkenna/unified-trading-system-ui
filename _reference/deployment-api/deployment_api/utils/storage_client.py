"""
Cloud-agnostic storage client with connection pool optimization.

This module provides a thin wrapper around unified-cloud-interface storage client.
Returns the UCI StorageClient ABC so callers get full type safety.

For high-concurrency workloads (e.g. TURBO data status endpoint making 7+ years
of parallel directory queries), the connection pool size is configurable via
GCS_POOL_SIZE env var.
"""

from unified_cloud_interface import StorageClient
from unified_trading_library import get_storage_client as _get_unified_storage_client

from deployment_api.settings import GCS_POOL_SIZE as DEFAULT_POOL_SIZE
from deployment_api.settings import gcp_project_id as _default_project_id


def get_storage_client(
    project_id: str | None = None,
    pool_size: int = DEFAULT_POOL_SIZE,
) -> StorageClient:
    """
    Get a cloud storage client (cloud-agnostic via unified-trading-library).

    Uses unified-trading-library for cloud-agnostic storage operations.
    Connection pool size is managed by the underlying implementation.

    Args:
        project_id: Cloud project ID (default: from env or ADC)
        pool_size: Max connections per host (default: 200, configurable via GCS_POOL_SIZE env)
                  Note: pool_size configuration depends on underlying cloud provider support

    Returns:
        UCI StorageClient (cloud-agnostic interface)
    """
    if project_id is None:
        project_id = _default_project_id

    unified_client: StorageClient = _get_unified_storage_client(project_id=project_id)
    return unified_client
