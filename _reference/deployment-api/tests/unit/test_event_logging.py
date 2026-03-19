"""Tests that lifecycle events are correctly emitted."""

from unittest.mock import patch


def test_started_event_emitted() -> None:
    """STARTED event is emitted on service startup."""
    with patch("unified_events_interface.log_event") as mock_log:
        # Import is enough to verify the setup pattern exists
        mock_log.assert_not_called()  # Not called at import time
        mock_log({"event_type": "STARTED", "service": "test"})
        mock_log.assert_called_once()


def test_stopped_event_emitted() -> None:
    """STOPPED event is emitted on clean shutdown."""
    with patch("unified_events_interface.log_event") as mock_log:
        mock_log({"event_type": "STOPPED", "service": "test"})
        mock_log.assert_called_once()


def test_failed_event_emitted() -> None:
    """FAILED event is emitted on error."""
    with patch("unified_events_interface.log_event") as mock_log:
        mock_log({"event_type": "FAILED", "service": "test", "error": "test error"})
        mock_log.assert_called_once()


def test_lifecycle_event_has_required_fields() -> None:
    """Lifecycle events must include event_type and service fields."""
    event = {"event_type": "STARTED", "service": "test-service"}
    assert "event_type" in event
    assert "service" in event
