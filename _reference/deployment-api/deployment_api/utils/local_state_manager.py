"""
Local deployment state manager for deployment-api.

Reads and writes deployment state.json files from GCS via storage_facade WITHOUT
importing deployment-service Python modules (enforces tier boundary).

Uses plain dicts throughout. Status values are str (matching the enum .value strings
produced by deployment_service.deployment.state, e.g. "running", "completed", "failed").
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import cast

from deployment_api import settings as _settings
from deployment_api.utils.storage_facade import read_object_text, write_object_text

logger = logging.getLogger(__name__)

# ── Status string constants (match deployment_service.deployment.state enum values) ──

STATUS_PENDING = "pending"
STATUS_RUNNING = "running"
STATUS_COMPLETED = "completed"
STATUS_COMPLETED_PENDING_DELETE = "completed_pending_delete"
STATUS_COMPLETED_WITH_ERRORS = "completed_with_errors"
STATUS_COMPLETED_WITH_WARNINGS = "completed_with_warnings"
STATUS_FAILED = "failed"
STATUS_CANCELLED = "cancelled"

_TERMINAL_STATUSES = frozenset(
    [
        STATUS_COMPLETED,
        STATUS_COMPLETED_WITH_ERRORS,
        STATUS_COMPLETED_WITH_WARNINGS,
        STATUS_FAILED,
        STATUS_CANCELLED,
        STATUS_COMPLETED_PENDING_DELETE,
    ]
)
_SHARD_DONE = frozenset(["succeeded", "failed", "cancelled"])


def _deployment_env() -> str:
    return getattr(_settings, "DEPLOYMENT_ENV", "development")


def _state_path(deployment_id: str) -> str:
    env = _deployment_env()
    return f"deployments.{env}/{deployment_id}/state.json"


def load_state(
    deployment_id: str,
    bucket: str | None = None,
) -> dict[str, object] | None:
    """
    Load deployment state JSON from GCS.

    Returns the raw deserialized dict, or None if not found.
    """
    bucket_name = bucket or _settings.STATE_BUCKET
    path = _state_path(deployment_id)
    try:
        content = read_object_text(bucket_name, path)
        if not content:
            return None
        return cast("dict[str, object]", json.loads(content))
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as e:
        logger.warning("load_state failed for %s: %s", deployment_id, e)
        return None


def save_state(
    state: dict[str, object],
    bucket: str | None = None,
) -> None:
    """Write deployment state JSON back to GCS."""
    bucket_name = bucket or _settings.STATE_BUCKET
    deployment_id = cast(str, state.get("deployment_id", "unknown"))
    state["updated_at"] = datetime.now(UTC).isoformat()
    path = _state_path(deployment_id)
    try:
        content = json.dumps(state, indent=2)
        write_object_text(bucket_name, path, content)
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("save_state failed for %s: %s", deployment_id, e)
        raise


def get_shards(state: dict[str, object]) -> list[dict[str, object]]:
    """Return the shards list from a state dict."""
    raw = state.get("shards")
    return cast("list[dict[str, object]]", raw) if isinstance(raw, list) else []


def get_status(state: dict[str, object]) -> str:
    """Return the deployment status string."""
    return cast(str, state.get("status") or STATUS_PENDING)


def is_terminal(status: str) -> bool:
    """Return True if the status is terminal (won't change further)."""
    return status in _TERMINAL_STATUSES


def recompute_status(shards: list[dict[str, object]]) -> str:
    """
    Derive overall deployment status from shard states.

    Mirrors the logic in deployment_service.deployment.state.StateManager.
    """
    if not shards:
        return STATUS_PENDING
    statuses = [cast(str, s.get("status") or "pending") for s in shards]
    all_done = all(s in _SHARD_DONE for s in statuses)
    any_failed = any(s == "failed" for s in statuses)
    all_failed = all(s == "failed" for s in statuses)
    any_running = any(s == "running" for s in statuses)
    any_pending = any(s == "pending" for s in statuses)

    if all_done:
        if all_failed:
            return STATUS_FAILED
        if any_failed:
            return STATUS_FAILED
        return STATUS_COMPLETED
    if any_running or any_pending:
        return STATUS_RUNNING
    return STATUS_PENDING
