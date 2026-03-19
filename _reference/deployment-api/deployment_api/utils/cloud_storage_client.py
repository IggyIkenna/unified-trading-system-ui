"""
Cloud storage file listing utility for deployment-api.

Replaces deployment_service.cloud_client.CloudClient — previously used in services.py
to list config files in GCS/S3. Uses UCI get_storage_client() (via storage_facade)
instead of direct cloud SDK imports.

deployment-api must not import deployment-service as a Python package.
"""

import fnmatch
import logging

logger = logging.getLogger(__name__)


def list_cloud_files(
    cloud_path: str,
    pattern: str = "*",
    max_results: int = 1000,
) -> list[str]:
    """
    List files in a cloud storage path matching a pattern.

    Args:
        cloud_path: Cloud path (e.g., gs://bucket/prefix or s3://bucket/prefix)
        pattern: Glob pattern to match files (e.g., "*.json", "**/*.json")
        max_results: Maximum number of results to return

    Returns:
        List of full cloud paths matching the pattern.
    """
    from deployment_api.utils.storage_facade import list_objects

    if cloud_path.startswith("gs://") or cloud_path.startswith("s3://"):  # noqa: gs-uri
        path_without_scheme = cloud_path[5:]
    else:
        raise ValueError(
            f"Unsupported cloud path scheme. Must start with gs:// or s3://. Got: {cloud_path}"
        )

    parts = path_without_scheme.split("/", 1)
    bucket_name = parts[0]
    prefix = parts[1] if len(parts) > 1 else ""

    objects = list_objects(bucket_name, prefix=prefix, max_results=max_results)

    results: list[str] = []
    for obj in objects:
        blob_name: str = obj.name
        # Apply glob pattern matching against the blob name
        if fnmatch.fnmatch(blob_name, pattern) or fnmatch.fnmatch(
            blob_name.split("/")[-1], pattern
        ):
            if cloud_path.startswith("gs://"):  # noqa: gs-uri
                results.append(f"gs://{bucket_name}/{blob_name}")  # noqa: gs-uri
            else:
                results.append(f"s3://{bucket_name}/{blob_name}")  # noqa: gs-uri

    return results
