"""
Service event parsing and shard state management utilities.

Handles parsing of SERVICE_EVENT messages from logs and updating shard states accordingly.
"""

import logging
import re
from datetime import UTC, datetime
from typing import cast

logger = logging.getLogger(__name__)

# Maps event_name -> (stage_name, new_status_or_None)
_STAGE_START_MAP: dict[str, tuple[str, str | None]] = {
    "VALIDATION_STARTED": ("validation", "initializing"),
    "DATA_INGESTION_STARTED": ("ingestion", "running"),
    "PROCESSING_STARTED": ("processing", None),
    "DATA_BROADCAST": ("broadcasting", None),
    "PERSISTENCE_STARTED": ("persistence", None),
}

# Maps completed event_name -> stage_name for duration recording
_STAGE_DONE_MAP: dict[str, str] = {
    "VALIDATION_COMPLETED": "validation",
    "DATA_INGESTION_COMPLETED": "ingestion",
    "PROCESSING_COMPLETED": "processing",
    "PERSISTENCE_COMPLETED": "persistence",
}


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


def _record_stage_duration(
    shard_state: dict[str, object],
    stage_timings: dict[str, object],
    stage_name: str,
    timestamp: datetime,
) -> None:
    """Record elapsed time for a completed stage into stage_timings."""
    started = cast(str, shard_state.get("stage_started_at"))
    if not started:
        return
    try:
        start_dt = datetime.fromisoformat(started.replace("Z", "+00:00"))
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=UTC)
        stage_timings[stage_name] = (timestamp - start_dt).total_seconds()
    except (ValueError, TypeError) as e:
        logger.debug("Suppressed %s during operation: %s", type(e).__name__, e)


def _apply_stage_event(
    event_name: str,
    is_validation_failed: bool,
    shard_state: dict[str, object],
    stage_timings: dict[str, object],
    details: object,
    timestamp: datetime,
) -> None:
    """Apply a single stage lifecycle event to shard_state."""
    if event_name in _STAGE_START_MAP:
        stage_name, new_status = _STAGE_START_MAP[event_name]
        shard_state["current_stage"] = stage_name
        shard_state["stage_started_at"] = timestamp.isoformat()
        if new_status:
            shard_state["status"] = new_status
    elif event_name in _STAGE_DONE_MAP:
        _record_stage_duration(shard_state, stage_timings, _STAGE_DONE_MAP[event_name], timestamp)
        if event_name == "DATA_INGESTION_COMPLETED":
            shard_state["stage_details"] = details
    elif event_name == "VALIDATION_FAILED" or is_validation_failed:
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


def update_shard_state_from_event(
    shard_state: dict[str, object],
    event: dict[str, object],
) -> dict[str, object]:
    """Update shard state based on parsed event.

    Args:
        shard_state: Current shard state (one shard from shards array)
        event: Parsed event dict from parse_service_event()

    Returns:
        Updated shard state
    """
    event_name = cast(str, event["event_name"])
    details: object = event["details"]
    timestamp = cast(datetime, event["timestamp"])

    if "stage_timings" not in shard_state or shard_state["stage_timings"] is None:
        shard_state["stage_timings"] = {}
    stage_timings = cast(dict[str, object], shard_state["stage_timings"])

    _details_dict: dict[str, object] = (
        cast(dict[str, object], details) if isinstance(details, dict) else {}
    )
    is_validation_failed: bool = (
        event_name == "FAILED" and _details_dict.get("error_category") == "validation"
    )

    _details_as_object = cast(object, details)
    _apply_stage_event(
        event_name, is_validation_failed, shard_state, stage_timings, _details_as_object, timestamp
    )

    # Parse progress counters from details (e.g., "BTC-USDT-SWAP (5/325)" or "2025-01-01 (1/30)")
    details_str: str = str(details)
    progress_match = re.search(r"\((\d+)/(\d+)\)", details_str)
    if progress_match:
        _grps = progress_match.groups()
        current_s: str = str(_grps[0]) if _grps else ""
        total_s: str = str(_grps[1]) if len(_grps) > 1 else ""
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
