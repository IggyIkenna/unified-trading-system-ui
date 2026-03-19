"""
Service Status Checking Functions

Functions for getting timestamps and status from various sources:
- GCS data timestamps
- Deployment info
- Build info
- GitHub code pushes
"""

import asyncio
import logging
import subprocess
import time
from datetime import UTC, datetime, timedelta
from typing import TypedDict, cast

from github import Github

from deployment_api.settings import GCS_REGION as DEFAULT_REGION
from deployment_api.settings import GITHUB_ORG
from deployment_api.settings import STATE_BUCKET as DEFAULT_STATE_BUCKET
from deployment_api.settings import gcp_project_id as default_project_id
from deployment_api.utils.deployment_state_reader import (
    list_deployments as _list_deployments_from_gcs,
)
from deployment_api.utils.storage_facade import list_objects

from .cloud_builds import get_gcp_build_client as _get_gcp_cb_client
from .service_status_cache import load_gcs_cache, save_gcs_cache

logger = logging.getLogger(__name__)


def _get_cache_dict(cache: dict[str, object], key: str) -> dict[str, object]:
    """Extract a typed sub-dict from a cache dict, returning {} if not present or wrong type."""
    raw: object = cache.get(key)
    if isinstance(raw, dict):
        return cast(dict[str, object], raw)
    return {}


def _resolve_trigger_id(
    svc: str,
    cache: dict[str, object],
    trigger_ids: dict[str, object],
) -> str | None:
    """Return the Cloud Build trigger ID for *svc*, fetching and caching if needed."""
    if svc not in trigger_ids:
        trigger_result = subprocess.run(
            [
                "gcloud",
                "builds",
                "triggers",
                "describe",
                f"{svc}-build",
                f"--region={DEFAULT_REGION}",
                "--format=value(id)",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if trigger_result.returncode != 0:
            logger.warning("Trigger %s-build not found", svc)
            return None
        trigger_ids[svc] = trigger_result.stdout.strip()
        cache["trigger_ids"] = trigger_ids
        save_gcs_cache()
    _tid2_raw: object = trigger_ids[svc]
    return _tid2_raw if isinstance(_tid2_raw, str) else ""


def _build_sort_key(b: object) -> datetime:
    """Sort key for Cloud Build objects: use create_time, fall back to datetime.min."""
    ct: object = getattr(b, "create_time", None)
    if ct is None:
        return datetime.min.replace(tzinfo=UTC)
    if isinstance(ct, datetime):
        return ct
    # Protobuf Timestamp: convert via seconds attribute
    ct_seconds: object = getattr(ct, "seconds", None)
    if ct_seconds is not None:
        return datetime.fromtimestamp(cast(float, ct_seconds), tz=UTC)
    return datetime.min.replace(tzinfo=UTC)


def _fetch_build_from_api(service: str) -> "BuildInfoDict | None":
    """Fetch the most recent Cloud Build for *service* from the GCP API (blocking)."""
    try:
        # Load GCS cache
        cache = load_gcs_cache()
        trigger_ids = _get_cache_dict(cache, "trigger_ids")

        trigger_id_or_none = _resolve_trigger_id(service, cache, trigger_ids)
        if trigger_id_or_none is None:
            return None
        trigger_id: str = trigger_id_or_none

        # Query builds (client-side filtering - server-side filter has issues)
        # UCI CloudBuildClient routes client construction through UCI factory;
        # request types (ListBuildsRequest) still use cloudbuild_v1 directly as
        # they are GCP-specific types not yet abstracted by UCI.
        from google.cloud.devtools import cloudbuild_v1  # Deferred — request types only

        client = _get_gcp_cb_client()
        parent = f"projects/{default_project_id}/locations/{DEFAULT_REGION}"

        # Fetch recent builds without filter (API v1 filter syntax is problematic)
        request = cloudbuild_v1.ListBuildsRequest(
            parent=parent,
            page_size=50,  # Fetch recent builds to filter client-side
        )

        # Get builds and filter by trigger ID client-side
        # The list_builds member has Unknown params in GCP stubs; use Protocol to type-erase
        from typing import Protocol

        class _ListBuildsCallable(Protocol):
            def __call__(self, *, request: object) -> object: ...

        _list_fn = cast(_ListBuildsCallable, client.list_builds)
        _pager = _list_fn(request=request)
        all_builds: list[object] = list(cast(list[object], _pager))
        builds = [b for b in all_builds if getattr(b, "build_trigger_id", None) == trigger_id]

        builds.sort(key=_build_sort_key, reverse=True)
        builds = builds[:1]  # Get most recent

        if builds:
            build = builds[0]
            _ct: object = getattr(build, "create_time", None)
            _ft: object = getattr(build, "finish_time", None)
            _ct_iso: str | None = _ct.isoformat() if isinstance(_ct, datetime) else None
            _dur: float | None = None
            if isinstance(_ct, datetime) and isinstance(_ft, datetime):
                _dur = (_ft - _ct).total_seconds()
            _subs: object = getattr(build, "substitutions", {})
            _subs_dict: dict[str, str] = (
                cast(dict[str, str], _subs) if isinstance(_subs, dict) else {}
            )
            _commit_sha: str | None = _subs_dict.get("COMMIT_SHA") or _subs_dict.get("SHORT_SHA")
            _status_obj: object = getattr(build, "status", None)
            _status_name: str = (
                getattr(_status_obj, "name", "UNKNOWN") if _status_obj is not None else "UNKNOWN"
            )
            result: BuildInfoDict = {
                "build_id": cast(str, getattr(build, "id", "")),
                "timestamp": _ct_iso,
                "status": _status_name,
                "duration_seconds": _dur,
                "commit_sha": _commit_sha,
                "error": "",
            }

            # Cache build info to GCS with timestamp
            builds_cache3 = _get_cache_dict(cache, "builds")
            build_times3 = _get_cache_dict(cache, "build_times")
            builds_cache3[service] = cast(object, result)
            build_times3[service] = datetime.now(UTC).isoformat()
            cache["builds"] = builds_cache3
            cache["build_times"] = build_times3
            save_gcs_cache()

            return result
        return None
    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error getting build for %s: %s", service, e)
        return {"error": str(e)}


# Service to GCS bucket mapping (constructed from project ID)
_pid = default_project_id
SERVICE_OUTPUT_BUCKETS = {
    "instruments-service": {
        "CEFI": f"instruments-store-cefi-{_pid}",
        "DEFI": f"instruments-store-defi-{_pid}",
        "TRADFI": f"instruments-store-tradfi-{_pid}",
    },
    "market-tick-data-handler": {
        "CEFI": f"market-data-tick-cefi-{_pid}",
        "DEFI": f"market-data-tick-defi-{_pid}",
        "TRADFI": f"market-data-tick-tradfi-{_pid}",
    },
    "market-data-processing-service": {
        "CEFI": f"market-data-tick-cefi-{_pid}",
        "DEFI": f"market-data-tick-defi-{_pid}",
        "TRADFI": f"market-data-tick-tradfi-{_pid}",
    },
}


class CategoryTimestampDict(TypedDict, total=False):
    """Timestamp info for a single category bucket."""

    timestamp: str | None
    file: str
    size_mb: float
    error: str


class DataTimestampResultDict(TypedDict, total=False):
    """Result from get_latest_data_timestamp."""

    by_category: dict[str, CategoryTimestampDict]
    latest: str | None
    error: str


class DeploymentInfoDict(TypedDict, total=False):
    """Result from get_latest_deployment."""

    deployment_id: str | None
    timestamp: str | None
    status: str | None
    compute_type: str | None
    used_force: bool
    tag: str | None
    total_shards: int
    completed_shards: int
    failed_shards: int
    error: str


class BuildInfoDict(TypedDict, total=False):
    """Result from get_latest_build."""

    build_id: str
    timestamp: str | None
    status: str
    duration_seconds: float | None
    commit_sha: str | None
    error: str


class CodePushInfoDict(TypedDict, total=False):
    """Result from get_latest_code_push."""

    commit_sha: str
    timestamp: str
    message: str
    author: str
    error: str


def _get_category_blob_timestamp(bucket_name: str, category: str) -> CategoryTimestampDict:
    """Fetch and return the latest blob timestamp for a single GCS bucket/category."""
    blobs = list_objects(bucket_name, prefix="", max_results=10)
    if not blobs:
        return {}
    latest_blob = max(
        blobs, key=lambda b: b.updated if b.updated else datetime.min.replace(tzinfo=UTC)
    )
    latest_ts = latest_blob.updated if latest_blob.updated else None
    if latest_ts and latest_ts.tzinfo is None:
        logger.warning("GCS blob timestamp is naive (missing timezone): %s", latest_blob.name)
    return {
        "timestamp": latest_ts.isoformat() if latest_ts else None,
        "file": latest_blob.name,
        "size_mb": round(latest_blob.size / (1024 * 1024), 2) if latest_blob.size else 0,
    }


def _get_service_timestamps_sync(service: str) -> DataTimestampResultDict:
    """Synchronously fetch latest GCS blob timestamps for all categories of a service."""
    try:
        buckets = SERVICE_OUTPUT_BUCKETS.get(service, {})
        results: dict[str, CategoryTimestampDict] = {}
        for category, bucket_name in buckets.items():
            try:
                results[category] = _get_category_blob_timestamp(bucket_name, category)
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Error checking %s bucket %s: %s", category, bucket_name, e)
                results[category] = {"error": str(e)}
        valid_timestamps = [
            datetime.fromisoformat(cast(str, r.get("timestamp")))
            for r in results.values()
            if r.get("timestamp")
        ]
        return {
            "by_category": results,
            "latest": (max(valid_timestamps).isoformat() if valid_timestamps else None),
        }
    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error getting data timestamps for %s: %s", service, e)
        return {"error": str(e)}


async def get_latest_data_timestamp(
    service: str, use_cache: bool = True
) -> DataTimestampResultDict | None:
    """
    Get the most recent data file timestamp from GCS for a service.

    Returns dict with category-level timestamps.
    OPTIMIZED: Uses 2-minute cache (data timestamps don't change frequently).
    """
    start = time.time()

    # Check cache first (GCS scanning is slow - 6-8 seconds)
    if use_cache:
        cache = load_gcs_cache()
        data_cache = _get_cache_dict(cache, "data_timestamps")
        data_times = _get_cache_dict(cache, "data_timestamp_times")

        if service in data_cache and service in data_times:
            try:
                _dts_raw: object = data_times[service]
                _dts: str = _dts_raw if isinstance(_dts_raw, str) else ""
                cache_time = datetime.fromisoformat(_dts)
                age = datetime.now(UTC) - cache_time
                if age < timedelta(minutes=2):  # 2-minute cache
                    logger.info(
                        "Using cached data timestamps for %s (age: %ss)", service, age.seconds
                    )
                    return cast(DataTimestampResultDict | None, data_cache[service])
            except (ValueError, TypeError, KeyError) as e:
                logger.debug("Cache invalid for %s: %s", service, e)

    def _get_timestamps_sync() -> DataTimestampResultDict:
        return _get_service_timestamps_sync(service)

    result = cast(
        DataTimestampResultDict | None, cast(object, await asyncio.to_thread(_get_timestamps_sync))
    )

    # Cache the result
    cache = load_gcs_cache()
    data_cache2 = _get_cache_dict(cache, "data_timestamps")
    data_times2 = _get_cache_dict(cache, "data_timestamp_times")
    data_cache2[service] = cast(object, result)
    data_times2[service] = datetime.now(UTC).isoformat()
    cache["data_timestamps"] = data_cache2
    cache["data_timestamp_times"] = data_times2
    save_gcs_cache()

    logger.info("[PERF] get_latest_data_timestamp for %s took %.2fs", service, time.time() - start)
    return result


# Deployment cache TTL (how long before we refresh from GCS state)
DEPLOYMENT_CACHE_TTL = timedelta(minutes=5)


async def get_latest_deployment(service: str, use_cache: bool = True) -> DeploymentInfoDict | None:
    """Get the most recent deployment for a service (with GCS-based caching)."""
    # Load GCS cache
    cache = load_gcs_cache()
    deployments_cache = _get_cache_dict(cache, "deployments")
    deployment_times = _get_cache_dict(cache, "deployment_times")

    # Check cache first
    now = datetime.now(UTC)
    if use_cache and deployments_cache.get(service) is not None:
        _cts_raw: object = deployment_times.get(service)
        cache_time_str: str | None = _cts_raw if isinstance(_cts_raw, str) else None
        if cache_time_str:
            try:
                cache_time = datetime.fromisoformat(cache_time_str)
                if (now - cache_time) < DEPLOYMENT_CACHE_TTL:
                    return cast(DeploymentInfoDict | None, deployments_cache[service])
            except (ValueError, TypeError, KeyError) as e:
                logger.debug("Deployment cache invalid for %s: %s", service, e)

    def _get_latest_sync():
        try:
            from deployment_api import settings as _s

            deployments = _list_deployments_from_gcs(
                bucket_name=DEFAULT_STATE_BUCKET,
                project_id=default_project_id,
                service=service,
                deployment_env=_s.DEPLOYMENT_ENV,
                limit=1,
            )

            if deployments:
                latest = deployments[0]

                # Parse cli_args to detect --force flag
                _cli_args_raw: object = latest.get("cli_args")
                cli_args: str = _cli_args_raw if isinstance(_cli_args_raw, str) else ""
                used_force = "--force" in cli_args

                # Get shard counts
                _progress_raw: object = latest.get("progress")
                progress: dict[str, object] = (
                    cast(dict[str, object], _progress_raw)
                    if isinstance(_progress_raw, dict)
                    else {}
                )
                _ts_raw: object = (
                    progress.get("total_shards", 0) if progress else latest.get("total_shards", 0)
                )
                total_shards: int = _ts_raw if isinstance(_ts_raw, int) else 0
                _comp_raw: object = (
                    progress.get("completed", 0) if progress else latest.get("completed_shards", 0)
                )
                completed: int = _comp_raw if isinstance(_comp_raw, int) else 0
                _fail_raw: object = (
                    progress.get("failed", 0) if progress else latest.get("failed_shards", 0)
                )
                failed: int = _fail_raw if isinstance(_fail_raw, int) else 0

                return {
                    "deployment_id": latest.get("deployment_id"),
                    "timestamp": latest.get("created_at"),
                    "status": latest.get("status"),
                    "compute_type": latest.get("compute_type"),
                    "used_force": used_force,
                    "tag": latest.get("tag"),
                    "total_shards": total_shards,
                    "completed_shards": completed,
                    "failed_shards": failed,
                }
            return None
        except (OSError, ValueError, RuntimeError) as e:
            logger.exception("Error getting latest deployment for %s: %s", service, e)
            return {"error": str(e)}

    result = cast(DeploymentInfoDict | None, await asyncio.to_thread(_get_latest_sync))

    # Update GCS cache
    deployments_cache[service] = cast(object, result)
    deployment_times[service] = now.isoformat()
    cache["deployments"] = deployments_cache
    cache["deployment_times"] = deployment_times
    save_gcs_cache()  # Persist to GCS

    return result


async def get_latest_build(service: str, use_cache: bool = True) -> BuildInfoDict | None:
    """
    Get the most recent Cloud Build for a service.

    OPTIMIZED: Uses GCS cache aggressively (5-min TTL) to avoid slow Cloud Build API.
    """
    # Check GCS cache first (Cloud Build API is VERY slow - 20+ seconds)
    if use_cache:
        cache = load_gcs_cache()
        builds_cache = _get_cache_dict(cache, "builds")
        build_times = _get_cache_dict(cache, "build_times")

        if service in builds_cache and service in build_times:
            try:
                _bts_raw: object = build_times[service]
                _bts: str = _bts_raw if isinstance(_bts_raw, str) else ""
                cache_time = datetime.fromisoformat(_bts)
                age = datetime.now(UTC) - cache_time
                if age < timedelta(minutes=5):  # 5-minute cache
                    logger.info("Using cached build info for %s (age: %ss)", service, age.seconds)
                    return cast(BuildInfoDict | None, builds_cache[service])
            except (ValueError, TypeError, KeyError) as e:
                logger.debug("Build cache invalid for %s: %s", service, e)

    return await asyncio.to_thread(_fetch_build_from_api, service)


async def get_latest_code_push(
    service: str, github_token: str | None = None
) -> CodePushInfoDict | None:
    """
    Get the most recent code push (commit) from GitHub.

    Requires github_token from Secret Manager.
    """
    if not github_token:
        return {"error": "GitHub token not provided"}

    def _get_commit_sync():
        try:
            g = Github(github_token)
            repo = g.get_repo(f"{GITHUB_ORG}/{service}")

            # Get latest commit on main branch
            commits = repo.get_commits(sha="main")
            latest_commit = commits[0]

            return {
                "commit_sha": latest_commit.sha[:7],
                "timestamp": latest_commit.commit.author.date.isoformat(),
                "message": latest_commit.commit.message.split("\n")[0][:100],
                "author": latest_commit.commit.author.name,
            }
        except (OSError, ValueError, RuntimeError) as e:
            logger.exception("Error getting GitHub commits for %s: %s", service, e)
            return {"error": str(e)}

    return cast(CodePushInfoDict | None, cast(object, await asyncio.to_thread(_get_commit_sync)))
