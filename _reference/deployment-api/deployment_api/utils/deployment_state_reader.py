"""
Deployment state reader for deployment-api.

Replaces deployment_service.deployment.state.StateManager used in service_status_checkers.py
to list recent deployments. Reads GCS state files directly via UCI storage client,
removing the cross-service import boundary.

deployment-api must not import deployment-service as a Python package.
"""

import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import cast

logger = logging.getLogger(__name__)


def _compute_effective_status(shards: list[dict[str, object]]) -> str:
    """Derive effective deployment status from shard statuses."""
    running = sum(1 for s in shards if s.get("status") == "running")
    pending = sum(1 for s in shards if s.get("status") == "pending")
    failed = sum(1 for s in shards if s.get("status") == "failed")
    if running > 0:
        return "running"
    if pending > 0:
        return "pending"
    if failed > 0:
        return "failed"
    return "completed"


def _parse_state_blob(
    content: str,
    folder_name: str,
    service_filter: str | None,
) -> dict[str, object] | None:
    """Parse a state.json blob content into a deployment summary dict."""
    try:
        data = cast("dict[str, object]", json.loads(content))
        if service_filter and data.get("service") != service_filter:
            return None
        shards = cast("list[dict[str, object]]", data.get("shards") or [])
        effective_status = _compute_effective_status(shards)
        total_shards = len(shards)
        completed = sum(1 for s in shards if s.get("status") in ("succeeded", "completed"))
        failed_count = sum(1 for s in shards if s.get("status") == "failed")
        return {
            "deployment_id": cast(str, data.get("deployment_id", folder_name)),
            "service": cast(str, data.get("service", "unknown")),
            "compute_type": cast(str, data.get("compute_type", "unknown")),
            "status": effective_status,
            "created_at": data.get("created_at"),
            "completed_at": data.get("completed_at"),
            "tag": data.get("tag"),
            "cli_args": data.get("cli_args") or "",
            "progress": {
                "total_shards": total_shards,
                "completed": completed,
                "failed": failed_count,
            },
            "total_shards": total_shards,
            "completed_shards": completed,
            "failed_shards": failed_count,
        }
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        logger.debug("Failed to parse state for %s: %s", folder_name, e)
        return None


def _fetch_one_deployment(
    folder: str,
    bucket_name: str,
    project_id: str | None,
    service_filter: str | None,
) -> dict[str, object] | None:
    """Fetch and parse a single deployment state.json from GCS."""
    from deployment_api.utils.storage_client import get_storage_client

    folder_name = folder.rstrip("/").split("/")[-1]
    state_blob_name = f"{folder}state.json"
    try:
        _client = get_storage_client(project_id)
        _bucket = _client.bucket(bucket_name)
        _blob = _bucket.blob(state_blob_name)
        if not _blob.exists():
            return None
        dl_fn = cast(object, getattr(_blob, "download_as_string", None))
        raw: bytes = cast(bytes, dl_fn()) if callable(dl_fn) else b""
        content = raw.decode("utf-8")
    except (OSError, ValueError, RuntimeError) as e:
        logger.debug("Failed to read %s: %s", state_blob_name, e)
        return None
    return _parse_state_blob(content, folder_name, service_filter)


def list_deployments(
    bucket_name: str,
    project_id: str | None = None,
    service: str | None = None,
    deployment_env: str = "development",
    limit: int = 20,
) -> list[dict[str, object]]:
    """
    List recent deployments from GCS state files.

    Replaces StateManager.list_deployments() from deployment-service.
    Reads state.json files from GCS bucket under deployments.{env}/ prefix.

    Args:
        bucket_name: GCS state bucket name
        project_id: GCP project ID
        service: Optional service name filter
        deployment_env: Deployment environment (development/production)
        limit: Maximum number of deployments to return

    Returns:
        List of deployment summaries, newest first.
    """
    from deployment_api.utils.storage_client import get_storage_client

    try:
        client = get_storage_client(project_id)
        bucket = client.bucket(bucket_name)

        prefix = f"deployments.{deployment_env}/"
        list_result = bucket.list_blobs(prefix=prefix, delimiter="/")
        prefixes_attr = cast(object, getattr(list_result, "prefixes", []))
        prefixes: list[str] = [str(b) for b in cast(list[object], prefixes_attr)]

        valid_prefixes: list[str] = [
            f
            for f in prefixes
            if (n := f.rstrip("/").split("/")[-1]) and n.count("-") >= 3 and not n.startswith("d-")
        ]
        valid_prefixes.sort(reverse=True)
        if service is not None:
            valid_prefixes = [f for f in valid_prefixes if service in f]
        valid_prefixes = valid_prefixes[: limit * 2]

        results: list[dict[str, object]] = []
        with ThreadPoolExecutor(max_workers=min(len(valid_prefixes), 10)) as pool:
            futures = {
                pool.submit(_fetch_one_deployment, f, bucket_name, project_id, service): f
                for f in valid_prefixes
            }
            for future in as_completed(futures):
                result = future.result()
                if result is not None:
                    results.append(result)
                    if len(results) >= limit:
                        break

        results.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        return results[:limit]

    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Failed to list deployments from GCS: %s", e)
        return []
