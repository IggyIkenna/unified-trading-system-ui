"""
Service utility functions for event parsing and state management.

Contains functions for parsing service events from logs and updating shard states.
"""

import logging
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import cast

logger = logging.getLogger(__name__)


def parse_service_event(log_line: str) -> dict[str, object] | None:
    """Parse standardized service event from log line.

    Serial console lines often have a prefix (e.g. "[ 34.18] docker[1207]: ")
    before SERVICE_EVENT, so we search for the pattern anywhere in the line.

    Args:
        log_line: Single line from serial console logs

    Returns:
        dict with event_name, details, timestamp (if SERVICE_EVENT found)
        None otherwise
    """
    match = re.search(
        r"SERVICE_EVENT:\s+([A-Za-z0-9_]+)(?:\s+\(([^)]*)\))?",
        log_line.strip(),
    )
    if not match:
        return None
    event_name, details = match.groups()
    return {
        "event_name": event_name,
        "details": details or "",
        "timestamp": datetime.now(UTC),
    }


def _get_started_str(shard_state: dict[str, object]) -> str | None:
    """Extract stage_started_at as str from shard_state, or None."""
    raw: object = shard_state.get("stage_started_at")
    if isinstance(raw, str):
        return raw
    return None


def _record_stage_duration(
    shard_state: dict[str, object],
    stage_timings: dict[str, object],
    stage_name: str,
    end_ts: datetime,
) -> None:
    """Record the duration for a completed stage in stage_timings."""
    started = _get_started_str(shard_state)
    if not started:
        return
    try:
        start_dt = datetime.fromisoformat(started.replace("Z", "+00:00"))
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=UTC)
        stage_timings[stage_name] = (end_ts - start_dt).total_seconds()
    except (ValueError, TypeError) as e:
        logger.debug("Suppressed %s during operation: %s", type(e).__name__, e)


_STAGE_MAP: dict[str, tuple[str, str | None]] = {
    "VALIDATION_STARTED": ("validation", "initializing"),
    "DATA_INGESTION_STARTED": ("ingestion", "running"),
    "PROCESSING_STARTED": ("processing", None),
    "DATA_BROADCAST": ("broadcasting", None),
    "PERSISTENCE_STARTED": ("persistence", None),
}

_STAGE_COMPLETED_MAP: dict[str, str] = {
    "VALIDATION_COMPLETED": "validation",
    "DATA_INGESTION_COMPLETED": "ingestion",
    "PROCESSING_COMPLETED": "processing",
    "PERSISTENCE_COMPLETED": "persistence",
}


def _apply_stage_event(
    event_name: str,
    shard_state: dict[str, object],
    stage_timings: dict[str, object],
    details: str,
    timestamp: datetime,
) -> None:
    """Apply a stage lifecycle event to shard_state."""
    if event_name in _STAGE_MAP:
        stage_name, new_status = _STAGE_MAP[event_name]
        shard_state["current_stage"] = stage_name
        shard_state["stage_started_at"] = timestamp.isoformat()
        if new_status:
            shard_state["status"] = new_status
    elif event_name in _STAGE_COMPLETED_MAP:
        _record_stage_duration(
            shard_state, stage_timings, _STAGE_COMPLETED_MAP[event_name], timestamp
        )
        if event_name == "DATA_INGESTION_COMPLETED":
            shard_state["stage_details"] = details
    elif event_name == "VALIDATION_FAILED":
        shard_state["status"] = "failed"
        shard_state["failure_category"] = "validation_failed"
    elif event_name == "STOPPED":
        shard_state["status"] = "completed"
        shard_state["current_stage"] = "completed"
        shard_state["progress"] = 100
    elif event_name == "FAILED":
        shard_state["status"] = "failed"
        shard_state["failure_category"] = "service_failed"
        shard_state["stage_details"] = details


def _get_stage_timings(shard_state: dict[str, object]) -> dict[str, object]:
    """Return the stage_timings dict from shard_state, creating it if absent."""
    raw: object = shard_state.get("stage_timings")
    if isinstance(raw, dict):
        return cast(dict[str, object], raw)
    result: dict[str, object] = {}
    shard_state["stage_timings"] = result
    return result


def update_shard_state_from_event(
    shard_state: dict[str, object], event: dict[str, object]
) -> dict[str, object]:
    """Update shard state based on parsed event.

    Args:
        shard_state: Current shard state (one shard from shards array)
        event: Parsed event dict from parse_service_event()

    Returns:
        Updated shard state
    """
    event_name_raw: object = event["event_name"]
    event_name: str = event_name_raw if isinstance(event_name_raw, str) else ""
    details_raw: object = event.get("details")
    details: str = details_raw if isinstance(details_raw, str) else ""
    timestamp_raw: object = event.get("timestamp")
    timestamp = timestamp_raw if isinstance(timestamp_raw, datetime) else datetime.now(UTC)

    stage_timings = _get_stage_timings(shard_state)
    _apply_stage_event(event_name, shard_state, stage_timings, details, timestamp)

    # Parse progress counters from details (e.g., "BTC-USDT-SWAP (5/325)" or "2025-01-01 (1/30)")
    progress_match = re.search(r"\((\d+)/(\d+)\)", details)
    if progress_match:
        current_s, total_s = progress_match.groups()
        try:
            current_val = int(current_s)
            total_val = int(total_s)
            shard_state["progress_current"] = current_val
            shard_state["progress_total"] = total_val
            shard_state["progress_message"] = f"{current_val}/{total_val}"
            if total_val > 0:
                shard_state["progress"] = int((current_val / total_val) * 100)
        except ValueError as e:
            logger.debug("Suppressed %s during operation: %s", type(e).__name__, e)

    shard_state["stage_details"] = details
    return shard_state


def get_config_dir() -> Path:
    """Get the operational configs directory path.

    Search order:
    1. repo_root/pm-configs/  -- symlink to ../unified-trading-pm/configs (local dev)
                              -- real dir populated by cloudbuild before docker build (prod)
    2. workspace sibling      -- ../unified-trading-pm/configs

    SSOT: unified-trading-pm/configs/ (PM is the canonical source for operational configs)
    """
    api_dir = Path(__file__).parent.parent  # deployment_api/
    repo_root = api_dir.parent  # deployment-api/

    bundled = repo_root / "pm-configs"
    if bundled.exists():
        return bundled

    sibling = repo_root.parent / "unified-trading-pm" / "configs"
    if sibling.exists():
        return sibling

    raise RuntimeError(
        "Could not find operational configs directory. "
        "Expected pm-configs/ (bundled) or ../unified-trading-pm/configs (sibling)."
    )


def get_codex_dir() -> Path | None:
    """Get the unified-trading-codex/10-audit/repos/ path.

    Search order:
    1. repo_root/codex-data/  -- symlink to ../unified-trading-codex/10-audit/repos (local dev)
                              -- real dir populated by cloudbuild before docker build (prod)
    2. workspace sibling      -- ../unified-trading-codex/10-audit/repos (GHA sibling clone)

    Returns None when neither resolves; checklist endpoints return 503.
    SSOT: unified-trading-codex/10-audit/repos/ (schema v3.0)
    """
    api_dir = Path(__file__).parent.parent  # deployment_api/
    repo_root = api_dir.parent  # deployment-api/

    bundled = repo_root / "codex-data"
    if bundled.exists():
        return bundled

    sibling = repo_root.parent / "unified-trading-codex" / "10-audit" / "repos"
    if sibling.exists():
        return sibling

    return None


def get_epics_dir() -> Path | None:
    """Get the unified-trading-codex/11-project-management/epics/ path.

    Search order:
    1. repo_root/codex-data-epics/  -- symlink to
       ../unified-trading-codex/11-project-management/epics
    2. workspace sibling             -- ../unified-trading-codex/11-project-management/epics

    Returns None when neither resolves; epic endpoints return 503.
    SSOT: unified-trading-codex/11-project-management/epics/
    """
    api_dir = Path(__file__).parent.parent  # deployment_api/
    repo_root = api_dir.parent  # deployment-api/

    bundled = repo_root / "codex-data-epics"
    if bundled.exists():
        return bundled

    sibling = repo_root.parent / "unified-trading-codex" / "11-project-management" / "epics"
    if sibling.exists():
        return sibling

    return None


def get_plans_dir() -> Path | None:
    """Get the unified-trading-pm/plans/ path for PM plan visualization.

    Search order:
    1. repo_root/pm-plans/    -- symlink to ../unified-trading-pm/plans (local dev)
                              -- real dir populated by cloudbuild before docker build (prod)
    2. workspace sibling      -- ../unified-trading-pm/plans

    Returns None when neither resolves; plans endpoints return empty.
    """
    api_dir = Path(__file__).parent.parent  # deployment_api/
    repo_root = api_dir.parent  # deployment-api/

    bundled = repo_root / "pm-plans"
    if bundled.exists():
        return bundled

    sibling = repo_root.parent / "unified-trading-pm" / "plans"
    if sibling.exists():
        return sibling

    return None


def get_ui_dist_dir() -> Path | None:
    """Get the UI dist directory if it exists (for production serving)."""
    api_dir = Path(__file__).parent.parent  # Go up from utils to api
    repo_root = api_dir.parent
    ui_dist = repo_root / "ui" / "dist"

    if ui_dist.exists() and (ui_dist / "index.html").exists():
        return ui_dist
    return None
