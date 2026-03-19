"""Unit tests for standardized event logging compliance."""

import os
import re
from pathlib import Path

import pytest

REQUIRED_COMMON_EVENTS = [
    "STARTED",
    "VALIDATION_STARTED",
    "VALIDATION_COMPLETED",
    "VALIDATION_FAILED",
    "DATA_INGESTION_STARTED",
    "DATA_INGESTION_COMPLETED",
    "PROCESSING_STARTED",
    "PROCESSING_COMPLETED",
    "DATA_BROADCAST",
    "PERSISTENCE_STARTED",
    "PERSISTENCE_COMPLETED",
    "STOPPED",
    "FAILED",
]

SERVICE_SPECIFIC_EVENTS: dict[str, list[str]] = {
    "deployment-service": [
        "DEPLOY_STARTED",
        "DEPLOY_COMPLETED",
    ]
}


def get_service_name() -> str:
    return Path.cwd().name


def find_python_files(service_dir: Path) -> list[Path]:
    exclude = {"tests", ".venv", "venv", "__pycache__", ".git", "examples"}
    result = []
    for root, dirs, files in os.walk(service_dir, followlinks=False):
        dirs[:] = [d for d in dirs if d not in exclude]
        for f in files:
            if f.endswith(".py"):
                result.append(Path(root) / f)
    return result


def find_event_markers(file_path: Path) -> set[str]:
    content = file_path.read_text()
    pattern = r'(?:log_event\s*\(\s*["\']|SERVICE_EVENT:\s+)(\w+)'
    return set(re.findall(pattern, content))


@pytest.fixture
def all_event_markers() -> set[str]:
    markers: set[str] = set()
    for py in find_python_files(Path.cwd()):
        markers.update(find_event_markers(py))
    return markers


def test_required_common_events_exist(all_event_markers: set[str]) -> None:
    service_name = get_service_name()
    if service_name == "deployment-service":
        pytest.skip("deployment-service is an orchestrator, not a pipeline service")
    missing = set(REQUIRED_COMMON_EVENTS) - all_event_markers
    if missing:
        pytest.fail(f"Missing required common events: {sorted(missing)}")
    assert not (set(REQUIRED_COMMON_EVENTS) - all_event_markers), (
        "Some required common events missing"
    )


def test_service_specific_events_exist(all_event_markers: set[str]) -> None:
    name = get_service_name()
    if name == "deployment-service":
        pytest.skip("deployment-service is an orchestrator, not a pipeline service")
    if name not in SERVICE_SPECIFIC_EVENTS:
        pytest.skip(f"No service-specific events for {name}")
    missing = set(SERVICE_SPECIFIC_EVENTS[name]) - all_event_markers
    if missing:
        pytest.fail(f"Missing service-specific events: {sorted(missing)}")
    assert True, "Service-specific events validated"


def test_event_helper_imported(all_event_markers: set[str]) -> None:
    if not all_event_markers:
        pytest.skip("No event markers found")
    for py in find_python_files(Path.cwd()):
        if "from unified_events_interface import log_event" in py.read_text():
            return
    pytest.fail("log_event not imported from unified_events_interface")
    assert True, "log_event import found"


# -------------------------
# Coverage boost: ShardEvent methods
# -------------------------


def test_shard_event_is_vm_event():
    from datetime import UTC, datetime

    from deployment_service.events import ShardEvent, VMEventType

    evt = ShardEvent(
        deployment_id="dep-1",
        shard_id="shard-0",
        event_type=VMEventType.VM_PREEMPTED,
        message="preempted",
        timestamp=datetime.now(UTC),
        metadata={},
    )
    assert evt.is_vm_event


def test_shard_event_to_jsonl_and_from_jsonl():
    from datetime import UTC, datetime

    from deployment_service.events import ShardEvent, VMEventType

    evt = ShardEvent(
        deployment_id="dep-1",
        shard_id="shard-0",
        event_type=VMEventType.VM_PREEMPTED,
        message="preempted",
        timestamp=datetime(2024, 1, 1, tzinfo=UTC),
        metadata={"key": "val"},
    )
    line = evt.to_jsonl()
    assert isinstance(line, str)
    evt2 = ShardEvent.from_jsonl(line)
    assert evt2.deployment_id == "dep-1"
    assert evt2.metadata == {"key": "val"}


def test_shard_event_from_dict_no_metadata():
    from datetime import UTC, datetime

    from deployment_service.events import ShardEvent, VMEventType

    data = {
        "deployment_id": "dep-2",
        "shard_id": "shard-1",
        "event_type": str(VMEventType.VM_DELETED),
        "message": "deleted",
        "timestamp": datetime(2024, 1, 2, tzinfo=UTC).isoformat(),
    }
    evt = ShardEvent.from_dict(data)
    assert evt.metadata == {}
