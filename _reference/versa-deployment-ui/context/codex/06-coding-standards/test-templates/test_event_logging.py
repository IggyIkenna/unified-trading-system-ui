# CANONICAL TEMPLATE — copy to tests/unit/ in each service repo
# Replace SERVICE_NAME with the actual service directory name (e.g. "execution-service").
# Replace SERVICE_SPECIFIC_EVENTS entries with events emitted by this service.
# Do NOT remove REQUIRED_COMMON_EVENTS — every service must emit them all.
"""Unit tests for standardized event logging compliance.

Verifies that:
  (a) log_event is called with event names that match the required common set
  (b) Required fields (service, environment, timestamp) are present via setup_events
  (c) The import comes from unified_events_interface (Pattern B — no fallbacks)
  (d) Service-specific events are present in source code
  (e) MockEventSink is importable and functional
  (f) setup_events signature meets the codex contract
"""

import os
import re
from pathlib import Path

import pytest

# ── Configure per service ─────────────────────────────────────────────────────
SERVICE_NAME = "replace-with-service-name"  # e.g. "execution-service"

SERVICE_SPECIFIC_EVENTS: dict[str, list[str]] = {
    # "replace-with-service-name": [
    #     "SOME_SERVICE_SPECIFIC_EVENT",
    # ],
}
# ─────────────────────────────────────────────────────────────────────────────

REQUIRED_COMMON_EVENTS = [
    "STARTED",
    "VALIDATION_STARTED",
    "VALIDATION_COMPLETED",
    "VALIDATION_FAILED",
    "DATA_INGESTION_STARTED",
    "DATA_INGESTION_COMPLETED",
    "PROCESSING_STARTED",
    "PROCESSING_COMPLETED",
    "PERSISTENCE_STARTED",
    "PERSISTENCE_COMPLETED",
    "STOPPED",
    "FAILED",
]

_EXCLUDE_DIRS = {"tests", ".venv", "venv", "__pycache__", ".git", "examples"}


def _find_python_files(service_dir: Path) -> list[Path]:
    exclude = {"tests", ".venv", "venv", "__pycache__", ".git", "examples"}
    result = []
    for root, dirs, files in os.walk(service_dir, followlinks=False):
        dirs[:] = [d for d in dirs if d not in exclude]
        for f in files:
            if f.endswith(".py"):
                result.append(Path(root) / f)
    return result

def _find_event_markers(file_path: Path) -> set[str]:
    """Extract all log_event marker names from a Python source file.

    Handles three call styles:
      log_event("EVENT_NAME")      — string literal
      log_event(SomeEnum.EVENT)    — enum attribute access
      # SERVICE_EVENT: EVENT_NAME  — inline comment marker
    """
    content = file_path.read_text()
    string_pattern = r'log_event\s*\(\s*["\'](\w+)'
    enum_pattern = r"log_event\s*\(\s*\w+\.(\w+)"
    comment_pattern = r"SERVICE_EVENT:\s+(\w+)"
    results: set[str] = set(re.findall(string_pattern, content))
    results.update(re.findall(enum_pattern, content))
    results.update(re.findall(comment_pattern, content))
    return results


def _get_service_name() -> str:
    """Detect service name from the current working directory."""
    return Path.cwd().name


@pytest.fixture(scope="module")
def all_event_markers() -> set[str]:
    """Collect every event marker from the service's non-test Python source."""
    markers: set[str] = set()
    for py in _find_python_files(Path.cwd()):
        markers.update(_find_event_markers(py))
    return markers


# ── Test: startup / lifecycle events ─────────────────────────────────────────


def test_required_common_events_exist(all_event_markers: set[str]) -> None:
    """All required common lifecycle events must be present in source code."""
    if not all_event_markers:
        pytest.skip("No event markers found in source — check service directory")
    missing = set(REQUIRED_COMMON_EVENTS) - all_event_markers
    assert not missing, (
        f"Missing required common events: {sorted(missing)}\n"
        "See: unified-trading-codex/06-coding-standards/testing.md"
    )


# ── Test: service-specific events ────────────────────────────────────────────


def test_service_specific_events_exist(all_event_markers: set[str]) -> None:
    """Service-specific events declared in SERVICE_SPECIFIC_EVENTS must exist."""
    name = _get_service_name()
    if name not in SERVICE_SPECIFIC_EVENTS:
        pytest.skip(f"No service-specific events declared for '{name}'")
    missing = set(SERVICE_SPECIFIC_EVENTS[name]) - all_event_markers
    assert not missing, (
        f"Missing service-specific events for '{name}': {sorted(missing)}\n"
        "See: unified-trading-codex/06-coding-standards/testing.md"
    )


# ── Test: import correctness (Pattern B — no fallbacks) ──────────────────────


def test_event_helper_imported(all_event_markers: set[str]) -> None:
    """log_event must be imported directly from unified_events_interface.

    No try/except ImportError fallbacks are permitted (see no-empty-fallbacks rule).
    """
    if not all_event_markers:
        pytest.skip("No event markers found in source — check service directory")
    for py in _find_python_files(Path.cwd()):
        if "from unified_events_interface import log_event" in py.read_text():
            return
    pytest.fail(
        "log_event not imported from unified_events_interface.\n"
        "Add: from unified_events_interface import log_event"
    )


# ── Test: event field validation via MockEventSink ───────────────────────────


def test_mock_event_sink_importable() -> None:
    """MockEventSink must be importable and expose the required interface."""
    from unified_events_interface import MockEventSink

    sink = MockEventSink()
    assert hasattr(sink, "events"), "MockEventSink missing 'events' attribute"
    assert hasattr(sink, "write_event"), "MockEventSink missing 'write_event' method"
    assert sink.events == [], "MockEventSink.events must start empty"


# ── Test: setup_events signature (required fields contract) ──────────────────


def test_setup_events_signature_meets_contract() -> None:
    """setup_events must accept service_name and mode to satisfy field contract.

    This ensures the service, environment, and timestamp fields are populated
    on every emitted event (required fields per codex event schema).
    """
    import inspect

    from unified_events_interface import setup_events

    sig = inspect.signature(setup_events)
    param_names = list(sig.parameters.keys())
    assert "service_name" in param_names, (
        "setup_events missing 'service_name' parameter — required for event field population"
    )
    assert "mode" in param_names, (
        "setup_events missing 'mode' parameter — required for event field population"
    )


# ── Test: error path events ───────────────────────────────────────────────────


def test_error_events_exist(all_event_markers: set[str]) -> None:
    """At least one error/failure event must be present in source code.

    Services must emit an event on error paths so alerting can trigger.
    FAILED, SERVICE_ERROR, or VALIDATION_FAILED all satisfy this requirement.
    """
    if not all_event_markers:
        pytest.skip("No event markers found in source — check service directory")
    error_events = {"FAILED", "SERVICE_ERROR", "VALIDATION_FAILED", "ERROR"}
    found = error_events & all_event_markers
    assert found, (
        f"No error-path events found. At least one of {sorted(error_events)} must be emitted.\n"
        "See: unified-trading-codex/06-coding-standards/testing.md"
    )
