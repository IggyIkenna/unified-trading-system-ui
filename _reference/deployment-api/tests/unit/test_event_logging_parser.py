"""Unit tests for parse_service_event and update_shard_state_from_event."""

from datetime import UTC, datetime

from deployment_api.utils.service_utils import parse_service_event, update_shard_state_from_event


def test_parse_service_event_simple():
    """Parse simple event without details."""
    result = parse_service_event("SERVICE_EVENT: STARTED")
    assert result is not None
    assert result["event_name"] == "STARTED"
    assert result["details"] == ""
    assert "timestamp" in result


def test_parse_service_event_with_details():
    """Parse event with details in parentheses."""
    result = parse_service_event(
        "SERVICE_EVENT: INSTRUMENT_PROCESSING_COMPLETED (BTC-USDT-SWAP, 5760 candles)"
    )
    assert result is not None
    assert result["event_name"] == "INSTRUMENT_PROCESSING_COMPLETED"
    assert "BTC-USDT-SWAP" in result["details"]
    assert "5760" in result["details"]


def test_parse_service_event_serial_console_prefix():
    """Parse SERVICE_EVENT when line has serial console prefix (e.g. docker[1207]:)."""
    line = "[ 34.182353] docker[1207]: SERVICE_EVENT: CLASSIFICATION_COMPLETED (1)\r\n"
    result = parse_service_event(line)
    assert result is not None
    assert result["event_name"] == "CLASSIFICATION_COMPLETED"
    assert result["details"] == "1"


def test_parse_service_event_no_match():
    """Return None for non-event lines."""
    assert parse_service_event("some random log line") is None
    assert parse_service_event("") is None
    assert parse_service_event("INFO: Processing started") is None


def test_parse_service_event_with_whitespace():
    """Handle leading/trailing whitespace."""
    result = parse_service_event("  SERVICE_EVENT: STOPPED  ")
    assert result is not None
    assert result["event_name"] == "STOPPED"


def test_update_shard_state_stopped():
    """STOPPED event sets completed status."""
    shard = {}
    event = {
        "event_name": "STOPPED",
        "details": "",
        "timestamp": datetime.now(UTC),
    }
    update_shard_state_from_event(shard, event)
    assert shard["status"] == "completed"
    assert shard["current_stage"] == "completed"
    assert shard["progress"] == 100


def test_update_shard_state_failed():
    """FAILED event sets failed status."""
    shard = {}
    event = {
        "event_name": "FAILED",
        "details": "Connection timeout",
        "timestamp": datetime.now(UTC),
    }
    update_shard_state_from_event(shard, event)
    assert shard["status"] == "failed"
    assert shard["failure_category"] == "service_failed"
    assert shard["stage_details"] == "Connection timeout"


def test_update_shard_state_progress_counter():
    """Parse progress counter from details."""
    shard = {}
    event = {
        "event_name": "DATE_PROCESSING_STARTED",
        "details": "2025-01-01 (5/30)",
        "timestamp": datetime.now(UTC),
    }
    update_shard_state_from_event(shard, event)
    assert shard.get("progress_current") == 5
    assert shard.get("progress_total") == 30
    assert shard.get("progress_message") == "5/30"
    assert shard.get("progress") == 16  # 5/30 * 100
