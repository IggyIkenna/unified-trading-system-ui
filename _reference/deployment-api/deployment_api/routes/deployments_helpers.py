"""
Helper functions for deployments routes.

Contains utility functions for log analysis, state management, and other common operations.
"""

import logging
import re
import time
from datetime import UTC, datetime, timedelta
from typing import cast

from deployment_api.deployment_api_config import DeploymentApiConfig

logger = logging.getLogger(__name__)

# Deployment configuration (public alias for cross-module access)
_deployment_config = DeploymentApiConfig()
deployment_config: DeploymentApiConfig = _deployment_config

# Cache for verification results
_verification_cache: dict[str, dict[str, object]] = {}


def _set_verification_cache(deployment_id: str, data: dict[str, object]) -> None:
    """
    Set verification cache for a deployment.
    """
    _verification_cache[deployment_id] = {"data": data, "timestamp": time.time()}


def set_verification_cache(deployment_id: str, data: dict[str, object]) -> None:
    """Public alias for _set_verification_cache."""
    _set_verification_cache(deployment_id, data)


_VERIFICATION_CACHE_TTL_SEC = 300


def _get_verification_cache(deployment_id: str) -> dict[str, object] | None:
    """Get verification cache for a deployment (reads from local _verification_cache)."""
    entry = _verification_cache.get(deployment_id)
    if not entry:
        return None
    ts = entry.get("timestamp")
    if isinstance(ts, float) and time.time() - ts > _VERIFICATION_CACHE_TTL_SEC:
        _verification_cache.pop(deployment_id, None)
        return None
    data: object = entry.get("data")
    return cast(dict[str, object], data) if isinstance(data, dict) else None


def build_deploy_env_vars(
    service: str,
    project_id: str,
    deployment_id: str,
    max_concurrent: int,
    deployment_mode: str = "vm",  # or "cloud-run"
    enable_direct_gcs: bool = False,
    shard_id: str | None = None,
    # Runtime topology env vars (Stream 3 — operational mode injection)
    deploy_mode: str = "batch",  # "batch" | "live"
    operational_mode: str = "",  # service-specific: "train_phase1", "execute", etc.
    cloud_provider: str = "gcp",  # "gcp" | "aws" | "local"
) -> dict[str, str]:
    """
    Build standardized environment variables for deployment.

    These are passed to the actual deployment containers and must match
    what the services expect. See: deployment env var standardization.

    Args:
        service: Service name (e.g. "ml-training-service").
        project_id: Cloud project / account ID.
        deployment_id: Unique deployment ID for correlation.
        max_concurrent: Maximum concurrent jobs / VMs.
        deployment_mode: Compute substrate ("vm", "cloud_run", "batch", "ec2").
        enable_direct_gcs: Pass ENABLE_DIRECT_GCS=true for high-throughput services.
        shard_id: Optional shard identifier for per-shard containers.
        deploy_mode: Runtime mode — "batch" (GCS transport) or "live" (PubSub/SQS).
        operational_mode: Service-specific operational sub-mode injected as
            OPERATIONAL_MODE (e.g. "train_phase1", "execute", "instrument").
            Empty string omits the var so services use their own default.
        cloud_provider: Cloud provider routing key ("gcp", "aws", "local").
    """
    env_vars = {
        "SERVICE_NAME": service,
        "PROJECT_ID": project_id,
        "DEPLOYMENT_ID": deployment_id,
        "MAX_CONCURRENT": str(max_concurrent),
        "DEPLOYMENT_MODE": deployment_mode,
        # Runtime topology env vars — consumed by services via UCI/UnifiedCloudConfig
        "RUNTIME_MODE": deploy_mode,
        "CLOUD_PROVIDER": cloud_provider,
    }

    # Inject OPERATIONAL_MODE only when non-empty so services can detect it was set
    if operational_mode:
        env_vars["OPERATIONAL_MODE"] = operational_mode

    # Optional shard-specific environment
    if shard_id:
        env_vars["SHARD_ID"] = shard_id

    # GCS direct access for performance-critical services
    if enable_direct_gcs:
        env_vars["ENABLE_DIRECT_GCS"] = "true"

    return env_vars


def maybe_add_direct_gcs(
    service: str, env_vars: dict[str, str], deployment_config: dict[str, object] | None = None
) -> dict[str, str]:
    """
    Conditionally add direct GCS environment variables for high-throughput services.

    Services like market-tick-data-handler benefit from direct GCS access
    instead of going through the API server.
    """
    # Services that benefit from direct GCS access
    direct_gcs_services = {
        "market-tick-data-handler",
        "market-data-processing-service",
        "features-delta-one-service",
    }

    if service in direct_gcs_services:
        env_vars["ENABLE_DIRECT_GCS"] = "true"
        if deployment_config:
            # Add any service-specific GCS configuration
            gcs_config_raw = deployment_config.get("gcs_config")
            gcs_config: dict[str, object] = (
                cast(dict[str, object], gcs_config_raw) if isinstance(gcs_config_raw, dict) else {}
            )
            if gcs_config:
                env_vars.update({f"GCS_{str(k).upper()}": str(v) for k, v in gcs_config.items()})

    return env_vars


# Backward-compatible alias (tests import the private name)
_maybe_add_direct_gcs = maybe_add_direct_gcs


def _check_deployment_for_conflicts(
    state_manager: object,
    active_deployment: dict[str, object],
    deployment_id: str,
    service: str,
    new_shard_signatures: set[str],
) -> list[dict[str, object]]:
    """Check a single active deployment for shard conflicts."""
    conflicts: list[dict[str, object]] = []
    dep_id_raw = active_deployment.get("deployment_id")
    if not isinstance(dep_id_raw, str) or dep_id_raw == deployment_id:
        return conflicts
    get_shards_fn = getattr(state_manager, "get_deployment_shards", None)
    if not callable(get_shards_fn):
        return conflicts
    active_shards_raw: object = get_shards_fn(dep_id_raw)
    active_shards: list[dict[str, object]] = (
        cast(list[dict[str, object]], active_shards_raw)
        if isinstance(active_shards_raw, list)
        else []
    )
    for active_shard in active_shards:
        args_raw = active_shard.get("args")
        args_list: list[str] = cast(list[str], args_raw) if isinstance(args_raw, list) else []
        active_signature = _extract_shard_signature(service, args_list)
        if active_signature and active_signature in new_shard_signatures:
            conflicts.append(
                {
                    "deployment_id": dep_id_raw,
                    "shard_id": active_shard.get("shard_id"),
                    "signature": active_signature,
                    "status": active_deployment.get("status"),
                    "started_at": active_deployment.get("started_at"),
                }
            )
    return conflicts


def find_duplicate_running_shards(
    state_manager: object, service: str, deployment_id: str, shard_args_list: list[list[str]]
) -> list[dict[str, object]]:
    """
    Find any currently running deployments that would conflict with the new shards.

    Returns list of conflicts with details about the overlapping deployments.
    This is critical for preventing data corruption in services that process
    by date ranges or other dimensions.
    """
    conflicts: list[dict[str, object]] = []
    try:
        list_fn = getattr(state_manager, "list_deployments", None)
        if not callable(list_fn):
            return conflicts
        active_deployments_raw: object = list_fn(
            service=service, status=["running", "pending", "resuming"]
        )
        active_deployments: list[dict[str, object]] = (
            cast(list[dict[str, object]], active_deployments_raw)
            if isinstance(active_deployments_raw, list)
            else []
        )
        new_shard_signatures: set[str] = {
            sig
            for shard_args in shard_args_list
            if (sig := _extract_shard_signature(service, shard_args)) is not None
        }
        for active_deployment in active_deployments:
            conflicts.extend(
                _check_deployment_for_conflicts(
                    state_manager, active_deployment, deployment_id, service, new_shard_signatures
                )
            )
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Error checking for duplicate shards: %s", e)
    return conflicts


def _extract_shard_signature(service: str, shard_args: list[str]) -> str | None:
    """
    Extract a signature from shard arguments that uniquely identifies the work.

    This is used to detect overlapping shards across deployments.
    Service-specific logic for what constitutes "overlapping work".
    """
    if not shard_args:
        return None

    signature_parts = [service]

    # Extract date range and category for most services
    for i, arg in enumerate(shard_args):
        if arg == "--start-date" and i + 1 < len(shard_args):
            signature_parts.append(f"start:{shard_args[i + 1]}")
        elif arg == "--end-date" and i + 1 < len(shard_args):
            signature_parts.append(f"end:{shard_args[i + 1]}")
        elif arg == "--category" and i + 1 < len(shard_args):
            signature_parts.append(f"cat:{shard_args[i + 1]}")
        elif arg == "--venue" and i + 1 < len(shard_args):
            signature_parts.append(f"venue:{shard_args[i + 1]}")

    return "|".join(signature_parts) if len(signature_parts) > 1 else None


def _status_str(status: object) -> str:
    """Convert a status value to a string representation.

    Handles str, dict (extracts 'status' key), objects with .status attr, and other types.
    """
    if isinstance(status, str):
        return status
    if isinstance(status, dict):
        _sd = cast(dict[str, object], status)
        _val: object = _sd.get("status", "unknown")
        return str(_val)
    _attr: object = getattr(status, "status", None)
    if _attr is not None:
        return str(_attr)
    return str(status)


# Severity aliases for common non-standard log levels
_SEVERITY_ALIASES: dict[str, str] = {
    "WARN": "WARNING",
    "ERR": "ERROR",
    "FATAL": "CRITICAL",
    "TRACE": "DEBUG",
}

_KNOWN_SEVERITIES = frozenset(
    {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL", "WARN", "ERR", "FATAL", "TRACE"}
)


def _extract_severity_and_logger(line: str) -> tuple[str, str]:
    """Extract severity level and logger name from a log line.

    Supports:
    - Python logging format: "LEVEL:module:message"
    - JSON format: {"level": "...", "logger"/"name": "..."}
    - Plain text: defaults to INFO

    Returns:
        (severity, logger_name) tuple where severity is one of
        DEBUG, INFO, WARNING, ERROR, CRITICAL.
    """
    import json as _json

    # Try JSON first
    stripped = line.strip()
    if stripped.startswith("{"):
        try:
            data: object = cast(object, _json.loads(stripped))
            if isinstance(data, dict):
                _data = cast(dict[str, object], data)
                raw_level = str(_data.get("level") or _data.get("severity") or "INFO").upper()
                severity = _SEVERITY_ALIASES.get(raw_level, raw_level)
                if severity not in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}:
                    severity = "INFO"
                log_name = str(
                    _data.get("logger") or _data.get("name") or _data.get("module") or ""
                )
                return severity, log_name
        except (ValueError, KeyError, TypeError):
            pass

    # Try Python logging format: "LEVEL:module:message"
    parts = line.split(":", 2)
    if len(parts) >= 2:
        candidate = parts[0].strip().upper()
        if candidate in _KNOWN_SEVERITIES:
            severity = _SEVERITY_ALIASES.get(candidate, candidate)
            log_name = parts[1].strip()
            return severity, log_name

    return "INFO", ""


_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _extract_date_range(date_str: str | None) -> tuple[str | None, str | None]:
    """Parse a date range string into (start, end) tuple.

    Supported formats:
      - None or ""           → (None, None)
      - "YYYY-MM-DD"         → (date, date)
      - "YYYY-MM-DD,YYYY-MM-DD" → (start, end)
      - "YYYY-MM-DD to YYYY-MM-DD" → (start, end)
      - "last-N-days"        → (today - N days, today)
    """
    if not date_str:
        return None, None

    # Comma-separated range
    if "," in date_str:
        parts = [p.strip() for p in date_str.split(",", 1)]
        if len(parts) == 2 and _DATE_RE.match(parts[0]) and _DATE_RE.match(parts[1]):
            return parts[0], parts[1]
        return None, None

    # " to " separated range
    if " to " in date_str:
        parts = [p.strip() for p in date_str.split(" to ", 1)]
        if len(parts) == 2 and _DATE_RE.match(parts[0]) and _DATE_RE.match(parts[1]):
            return parts[0], parts[1]
        return None, None

    # Relative: "last-N-days"
    m = re.match(r"^last-(\d+)-days$", date_str)
    if m:
        n = int(m.group(1))
        today = datetime.now(UTC)
        start = (today - timedelta(days=n)).strftime("%Y-%m-%d")
        end = today.strftime("%Y-%m-%d")
        return start, end

    # Single date
    if _DATE_RE.match(date_str):
        return date_str, date_str

    return None, None
