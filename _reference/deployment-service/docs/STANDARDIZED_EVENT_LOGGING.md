# Standardized Event Logging Specification

## Overview

This document defines the **standardized event logging system** for all services in the unified trading system. Events enable:

- **Real-time status tracking** beyond "RUNNING" (validation, ingestion, processing stages)
- **Performance analysis** (measure duration of each stage)
- **Debugging** (know exactly where a job failed or stalled)
- **Cost optimization** (understand actual runtime for capacity planning)

Events are logged to `stderr` and captured by Cloud Logging. The **deployment-service** API parses these events from VM serial console logs and updates shard state in real-time (every 30 seconds during auto-sync).

---

## Event Format

**Format:** `SERVICE_EVENT: {event_name}` (logged to stderr for immediate capture)

**Python Example:**

```python
import sys
import logging

logger = logging.getLogger(__name__)

# Always log to both stderr (for immediate serial console capture) and logger
def log_event(event_name: str):
    print(f"SERVICE_EVENT: {event_name}", file=sys.stderr, flush=True)
    logger.info(f"SERVICE_EVENT: {event_name}")

# Usage
log_event("STARTED")
log_event("VALIDATION_STARTED")
```

**Why stderr?** VM serial console logs capture stderr immediately. Combined with logger for structured Cloud Logging.

---

## Common Events (All Services)

These events are **required for ALL services** and must be present to pass quality gates.

| Event                      | When to Log                                                                           | Example                                                        |
| -------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `STARTED`                  | Immediately after event setup (`setup_events()` or `setup_service()`), before any I/O | First thing in `main()` after setup_events() / setup_service() |
| `VALIDATION_STARTED`       | Before preflight/dependency checks                                                    | Before calling dependency checker                              |
| `VALIDATION_COMPLETED`     | After successful validation                                                           | After preflight checks pass                                    |
| `VALIDATION_FAILED`        | If validation fails (before exit)                                                     | Catch validation errors, log event, then exit                  |
| `DATA_INGESTION_STARTED`   | Before reading from GCS/APIs/BigQuery                                                 | Before GCS list/read operations                                |
| `DATA_INGESTION_COMPLETED` | After data loaded into memory                                                         | After all input data fetched                                   |
| `PROCESSING_STARTED`       | Before main computation/transformation                                                | Before feature generation, model training, etc.                |
| `PROCESSING_COMPLETED`     | After main computation finished                                                       | After all processing logic done                                |
| `UPLOAD_STARTED`           | Before writing to GCS/BigQuery                                                        | Before save_to_gcs() calls                                     |
| `UPLOAD_COMPLETED`         | After successful upload                                                               | After all outputs written                                      |
| `STOPPED`                  | Before exit(0) for successful completion                                              | Final log before graceful shutdown                             |
| `FAILED`                   | Before exit(1) for failures                                                           | Log in except block before re-raising                          |

**Exit Status Convention:**

- `exit(0)`: Success (must be preceded by `STOPPED` event)
- `exit(1)`: Failure (must be preceded by `FAILED` event)

**Details:** See [lifecycle-events.md](../../unified-trading-codex/03-observability/lifecycle-events.md) in the codex for complete documentation.

---

## Service-Specific Events

Each service has domain-specific events documented in the **unified-trading-codex**. These events track service-specific work units (dates processed, instruments handled, models trained, etc.) with progress counters that enable real-time status updates.

### Batch Services

- [market-tick-data-service](../../unified-trading-codex/03-observability/batch/per-service/market-tick-data-service.md) - Tick data downloads from external APIs
- [market-data-processing-service](../../unified-trading-codex/03-observability/batch/per-service/market-data-processing-service.md) - OHLCV candle generation
- [instruments-service](../../unified-trading-codex/03-observability/batch/per-service/instruments-service.md) - Instrument definition fetching and classification
- [features-volatility-service](../../unified-trading-codex/03-observability/batch/per-service/features-volatility-service.md) - Volatility feature engineering
- [features-onchain-service](../../unified-trading-codex/03-observability/batch/per-service/features-onchain-service.md) - DeFi protocol features from blockchain APIs
- [features-delta-one-service](../../unified-trading-codex/03-observability/batch/per-service/features-delta-one-service.md) - Trading features with lookback buffers
- [features-calendar-service](../../unified-trading-codex/03-observability/batch/per-service/features-calendar-service.md) - Time-based and economic calendar features
- [ml-training-service](../../unified-trading-codex/03-observability/batch/per-service/ml-training-service.md) - ML model training pipeline
- [execution-service](../../unified-trading-codex/03-observability/batch/per-service/execution-service.md) - Backtesting execution simulation

### Live Services

- [ml-inference-service](../../unified-trading-codex/03-observability/live/per-service/ml-inference-service.md) - Real-time ML predictions
- [strategy-service](../../unified-trading-codex/03-observability/live/per-service/strategy-service.md) - Live signal generation and order instructions

**Note:** Each per-service doc includes:

- Unique observability characteristics
- Complete domain-specific events table
- Example event flow
- Key metrics to monitor
- Service-specific risks

---

## Implementation: test_event_logging.py

All services MUST include `tests/unit/test_event_logging.py` that validates:

1. All 11 lifecycle events are present in source code
2. Service-specific events match the codex per-service documentation

**Important:** Populate `SERVICE_SPECIFIC_EVENTS` from your service's codex doc. Example:

```python
"""Unit tests for standardized event logging compliance.

Verifies required events are present in service source code.
"""

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
    "UPLOAD_STARTED",
    "UPLOAD_COMPLETED",
    "STOPPED",
    "FAILED",
]

# Populate from: unified-trading-codex/03-observability/[batch|live]/per-service/[your-service].md
SERVICE_SPECIFIC_EVENTS = {
    "market-tick-data-service": [
        "INSTRUMENT_LOADING_STARTED",
        "INSTRUMENT_LOADING_COMPLETED",
        "DATE_PROCESSING_STARTED",
        "DATE_PROCESSING_COMPLETED",
        "API_DOWNLOAD_STARTED",
        "API_DOWNLOAD_COMPLETED",
        "API_DOWNLOAD_FAILED",
    ],
    # ... add your service here using events from codex per-service doc ...
}


def get_service_name() -> str:
    """Detect service name from current directory."""
    return Path.cwd().name


def find_python_files(service_dir: Path) -> list[Path]:
    """Find Python files in service source (exclude tests, venv)."""
    exclude = {"tests", ".venv", "venv", "__pycache__", ".git", "examples"}
    found = []
    for py in service_dir.rglob("*.py"):
        parts = py.relative_to(service_dir).parts
        if any(p in exclude for p in parts):
            continue
        found.append(py)
    return found


def find_event_markers(file_path: Path) -> set[str]:
    """Extract SERVICE_EVENT markers from Python file."""
    content = file_path.read_text()
    # Match log_event("EVENT") or log_event('EVENT') or SERVICE_EVENT: EVENT
    pattern = r'(?:log_event\s*\(\s*["\']|SERVICE_EVENT:\s+)(\w+)'
    return set(re.findall(pattern, content))


@pytest.fixture
def all_event_markers() -> set[str]:
    """Collect all event markers from service source."""
    service_dir = Path.cwd()
    markers: set[str] = set()
    for py in find_python_files(service_dir):
        markers.update(find_event_markers(py))
    return markers


def test_required_common_events_exist(all_event_markers: set[str]) -> None:
    """Verify all required common events are present."""
    missing = set(REQUIRED_COMMON_EVENTS) - all_event_markers
    if missing:
        pytest.fail(
            f"Missing required common events: {sorted(missing)}\n"
            "See: unified-trading-codex/03-observability/lifecycle-events.md"
        )


def test_service_specific_events_exist(all_event_markers: set[str]) -> None:
    """Verify service-specific events are present."""
    name = get_service_name()
    if name not in SERVICE_SPECIFIC_EVENTS:
        pytest.skip(f"No service-specific events for {name}")
    required = set(SERVICE_SPECIFIC_EVENTS[name])
    missing = required - all_event_markers
    if missing:
        pytest.fail(
            f"Missing service-specific events for {name}: {sorted(missing)}\n"
            "See: unified-trading-codex/03-observability/[batch|live]/per-service/{name}.md"
        )


def test_event_helper_imported(all_event_markers: set[str]) -> None:
    """Verify log_event is imported when events are used. Use UEI or UTS top-level only (never unified_trading_library.observability)."""
    if not all_event_markers:
        pytest.skip("No event markers found")
    for py in find_python_files(Path.cwd()):
        text = py.read_text()
        if "from unified_events_interface import" in text and "log_event" in text:
            return
        if "from unified_trading_library import" in text and "log_event" in text:
            return
        if "from unified_trading_library.observability import log_event" in text:
            pytest.fail(
                "log_event must not be imported from unified_trading_library.observability (deleted). "
                "Use: from unified_events_interface import setup_events, log_event "
                "or: from unified_trading_library import setup_service, log_event"
            )
    pytest.fail(
        "log_event not imported. Add: from unified_events_interface import log_event "
        "or: from unified_trading_library import log_event"
    )
```

---

## Implementation Patterns

### 1. Helper Function (Common Utility)

Use **unified-events-interface** or **unified-trading-library** (top-level `log_event`). Do not use `unified_trading_library.observability` (module deleted).

Import in services:

```python
from unified_events_interface import setup_events, log_event
# or with sink config:
# from unified_trading_library import setup_service, GCSEventSink, log_event
```

### 2. Service Implementation Template

```python
import sys
import logging
from unified_events_interface import setup_events, log_event
# Or: from unified_trading_library import setup_service, log_event (with sink)

logger = logging.getLogger(__name__)

def main():
    # 1. Setup event logging FIRST
    setup_events(service_name="my-service", mode="batch")

    # 2. Log STARTED immediately
    log_event("STARTED")

    try:
        # 3. Validation phase
        log_event("VALIDATION_STARTED")
        validate_config()
        validate_dependencies()
        log_event("VALIDATION_COMPLETED")

        # 4. Data ingestion phase
        log_event("DATA_INGESTION_STARTED")
        data = load_data_from_gcs()
        log_event("DATA_INGESTION_COMPLETED", f"{len(data)} rows")

        # 5. Processing phase
        log_event("PROCESSING_STARTED")
        results = process_data(data)
        log_event("PROCESSING_COMPLETED", f"{len(results)} results")

        # 6. Upload phase
        log_event("UPLOAD_STARTED")
        upload_to_gcs(results)
        log_event("UPLOAD_COMPLETED")

        # 7. Success exit
        log_event("STOPPED")
        sys.exit(0)

    except Exception as e:
        # 8. Failure exit
        logger.error(f"Fatal error: {e}", exc_info=True)
        log_event("FAILED", str(e))
        sys.exit(1)
```

### 3. Date Loop Pattern

```python
def process_date_range(start_date: str, end_date: str):
    dates = generate_date_range(start_date, end_date)
    total_dates = len(dates)

    for idx, date in enumerate(dates, start=1):
        log_event("DATE_PROCESSING_STARTED", f"{date} ({idx}/{total_dates})")

        try:
            process_date(date)
            log_event("DATE_PROCESSING_COMPLETED", date)
        except Exception as e:
            logger.error(f"Failed to process {date}: {e}")
            log_event("DATE_PROCESSING_FAILED", f"{date}: {e}")
```

### 4. Item Loop Pattern

```python
def process_instruments(instruments: list, date: str):
    total = len(instruments)

    for idx, instrument in enumerate(instruments, start=1):
        log_event("INSTRUMENT_PROCESSING_STARTED", f"{instrument} ({idx}/{total})")

        try:
            result = process_instrument(instrument, date)
            log_event("INSTRUMENT_PROCESSING_COMPLETED", f"{instrument}, {len(result)} rows")
        except Exception as e:
            logger.error(f"Failed {instrument}: {e}")
            log_event("INSTRUMENT_PROCESSING_FAILED", f"{instrument}: {e}")
```

---

## Quality Gates

Event logging compliance is enforced through:

1. **Unit tests**: `tests/unit/test_event_logging.py` validates all required events are present
2. **Quality gates**: `scripts/quality-gates.sh` runs event logging tests before merge
3. **Diff checker**: `run-diff-checker.py` creates GitHub issues for missing or incomplete event enforcement

Services cannot merge to main without:

- All 11 lifecycle events present in source code
- Service-specific events matching codex documentation (if documented)
- `test_event_logging.py` passing

---

## Further Reading

- **Codex observability docs**: `unified-trading-codex/03-observability/`
  - [lifecycle-events.md](../../unified-trading-codex/03-observability/lifecycle-events.md) - 11 required events
  - [domain-events.md](../../unified-trading-codex/03-observability/domain-events.md) - Service-specific patterns
  - [resource-events.md](../../unified-trading-codex/03-observability/resource-events.md) - CPU/memory monitoring
  - [batch/per-service/](../../unified-trading-codex/03-observability/batch/per-service/) - Batch service event docs
  - [live/per-service/](../../unified-trading-codex/03-observability/live/per-service/) - Live service event docs
