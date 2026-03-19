#!/usr/bin/env python3
"""Create test_event_logging.py for each service with service-specific events."""

import json
import logging

logger = logging.getLogger(__name__)
from pathlib import Path

SERVICE_EVENTS = {
    "market-data-processing-service": [
        "DATE_PROCESSING_STARTED",
        "DATE_PROCESSING_COMPLETED",
        "INSTRUMENT_PROCESSING_STARTED",
        "INSTRUMENT_PROCESSING_COMPLETED",
        "TIMESTAMP_VALIDATION_STARTED",
        "TIMESTAMP_VALIDATION_COMPLETED",
    ],
    "features-calendar-service": [
        "DATE_PROCESSING_STARTED",
        "DATE_PROCESSING_COMPLETED",
        "FEATURE_TYPE_PROCESSING_STARTED",
        "FEATURE_TYPE_PROCESSING_COMPLETED",
    ],
    "features-volatility-service": [
        "DATE_PROCESSING_STARTED",
        "DATE_PROCESSING_COMPLETED",
        "DEPENDENCY_CHECK_STARTED",
        "DEPENDENCY_CHECK_COMPLETED",
        "UNDERLYING_PROCESSING_STARTED",
        "UNDERLYING_PROCESSING_COMPLETED",
        "SCHEMA_VALIDATION_STARTED",
        "SCHEMA_VALIDATION_COMPLETED",
    ],
    "features-onchain-service": [
        "DATE_PROCESSING_STARTED",
        "DATE_PROCESSING_COMPLETED",
        "FEATURE_GROUP_PROCESSING_STARTED",
        "FEATURE_GROUP_PROCESSING_COMPLETED",
        "API_CALL_STARTED",
        "API_CALL_COMPLETED",
    ],
    "features-delta-one-service": [
        "DATE_PROCESSING_STARTED",
        "DATE_PROCESSING_COMPLETED",
        "BUFFER_LOADING_STARTED",
        "BUFFER_LOADING_COMPLETED",
        "INSTRUMENT_PROCESSING_STARTED",
        "INSTRUMENT_PROCESSING_COMPLETED",
        "BUFFER_VALIDATION_STARTED",
        "BUFFER_VALIDATION_COMPLETED",
    ],
    "ml-inference-service": [
        "MODE_INITIALIZED",
        "DATE_PROCESSING_STARTED",
        "DATE_PROCESSING_COMPLETED",
        "FEATURE_LOADING_STARTED",
        "FEATURE_LOADING_COMPLETED",
        "INFERENCE_STARTED",
        "INFERENCE_COMPLETED",
        "PREDICTION_PUBLISHING_STARTED",
        "PREDICTION_PUBLISHING_COMPLETED",
    ],
    "ml-training-service": [
        "MODE_INITIALIZED",
        "STAGE_INITIALIZED",
        "FEATURE_LOADING_STARTED",
        "FEATURE_LOADING_COMPLETED",
        "STAGE3_STARTED",
        "STAGE3_COMPLETED",
        "MODEL_SAVING_STARTED",
        "MODEL_SAVING_COMPLETED",
    ],
    "strategy-service": [
        "MODE_INITIALIZED",
        "DATE_PROCESSING_STARTED",
        "DATE_PROCESSING_COMPLETED",
        "PREDICTION_LOADING_STARTED",
        "PREDICTION_LOADING_COMPLETED",
        "STRATEGY_EXECUTION_STARTED",
        "STRATEGY_EXECUTION_COMPLETED",
    ],
    "execution-service": [
        "DOMAIN_DETECTED",
        "CONFIG_LOADING_STARTED",
        "CONFIG_LOADING_COMPLETED",
        "PREFLIGHT_STARTED",
        "PREFLIGHT_COMPLETED",
        "DATE_PROCESSING_STARTED",
        "DATE_PROCESSING_COMPLETED",
        "BACKTEST_STARTED",
        "BACKTEST_COMPLETED",
    ],
}

TEMPLATE = '''"""Unit tests for standardized event logging compliance."""

import re
from pathlib import Path

import pytest
import logging
logger = logging.getLogger(__name__)

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

SERVICE_SPECIFIC_EVENTS = {events_json}


def get_service_name() -> str:
    return Path.cwd().name


def find_python_files(service_dir: Path) -> list[Path]:
    exclude = {{"tests", ".venv", "venv", "__pycache__", ".git", "examples"}}
    return [
        p
        for p in service_dir.rglob("*.py")
        if not any(x in p.relative_to(service_dir).parts for x in exclude)
    ]


def find_event_markers(file_path: Path) -> set[str]:
    content = file_path.read_text()
    pattern = r"(?:log_event\\s*\\(\\s*[\"']|SERVICE_EVENT:\\s+)(\\w+)"
    return set(re.findall(pattern, content))


@pytest.fixture
def all_event_markers() -> set[str]:
    markers: set[str] = set()
    for py in find_python_files(Path.cwd()):
        markers.update(find_event_markers(py))
    return markers


def test_required_common_events_exist(all_event_markers: set[str]) -> None:
    missing = set(REQUIRED_COMMON_EVENTS) - all_event_markers
    if missing:
        pytest.fail(f"Missing required common events: {{sorted(missing)}}")


def test_service_specific_events_exist(all_event_markers: set[str]) -> None:
    name = get_service_name()
    if name not in SERVICE_SPECIFIC_EVENTS:
        pytest.skip(f"No service-specific events for {{name}}")
    missing = set(SERVICE_SPECIFIC_EVENTS[name]) - all_event_markers
    if missing:
        pytest.fail(f"Missing service-specific events: {{sorted(missing)}}")


def test_event_helper_imported(all_event_markers: set[str]) -> None:
    if not all_event_markers:
        pytest.skip("No event markers found")
    for py in find_python_files(Path.cwd()):
        if "from unified_trading_library.observability import log_event" in py.read_text():
            return
    pytest.fail("log_event not imported from unified_trading_library.observability")
'''


def main():
    workspace = Path(__file__).resolve().parent.parent.parent
    for service_name, events in SERVICE_EVENTS.items():
        service_path = workspace / service_name
        if not service_path.exists():
            continue
        test_dir = service_path / "tests" / "unit"
        test_dir.mkdir(parents=True, exist_ok=True)
        events_dict = {service_name: events}
        content = TEMPLATE.replace("{events_json}", json.dumps(events_dict, indent=4))
        content = content.replace("{{", "{").replace("}}", "}")
        (test_dir / "test_event_logging.py").write_text(content)
        logger.info(f"Created {service_name}/tests/unit/test_event_logging.py")


if __name__ == "__main__":
    main()
