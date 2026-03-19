#!/usr/bin/env python3
"""
Check that only deployment-service uses setup_cloud_logging or
unified_trading_library.observability. All other services must use unified_events_interface.

Run from deployment-service/scripts/ with REPO_ROOT as parent.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

logger = logging.getLogger(__name__)
REPO_ROOT = Path(__file__).resolve().parents[2]
# Only UTD v2 may use setup_cloud_logging/observability; UCS defines them
ALLOWED_REPOS = {"deployment-service", "unified-trading-library"}
# Exclude test validation logic (checks for either import pattern)
EXCLUDE_PATTERNS = [
    "test_event_logging.py",  # Validates import pattern
    "find_coding_violations.py",  # Flags violations
    "create_event_logging_tests.py",  # Test generator
    "test_split_library_imports.py",  # Template
    "generate-per-service-specs.py",  # Example in docstring
]


# Service repos to check (from run-all-quality-gates REPOS_ORDERED)
SERVICE_REPOS = [
    "instruments-service",
    "market-tick-data-service",
    "market-data-processing-service",
    "features-calendar-service",
    "features-delta-one-service",
    "features-volatility-service",
    "features-onchain-service",
    "ml-training-service",
    "ml-inference-service",
    "strategy-service",
    "execution-service",
    "position-balance-monitor-service",
    "risk-and-exposure-service",
]


def main() -> int:
    logging.basicConfig(level=logging.INFO)
    violations = []
    for repo_name in SERVICE_REPOS:
        repo_dir = REPO_ROOT / repo_name
        if not repo_dir.is_dir():
            continue
        for py in repo_dir.rglob("*.py"):
            if any(ex in py.name for ex in EXCLUDE_PATTERNS):
                continue
            # Skip build artifacts and venv
            if ".venv" in py.parts or "build" in py.parts or "__pycache__" in py.parts:
                continue
            try:
                text = py.read_text()
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Skipping item during main: %s", e)
                continue
            rel = py.relative_to(REPO_ROOT)
            if "setup_cloud_logging" in text or "unified_trading_library.observability" in text:
                # Skip if it's in a string/comment (e.g. "use setup_events instead of setup_cloud_logging")
                if "from unified_trading_library import setup_cloud_logging" in text:
                    violations.append((str(rel), "setup_cloud_logging"))
                elif "from unified_trading_library.observability import" in text:
                    violations.append((str(rel), "unified_trading_library.observability"))

    if violations:
        logger.info(
            "ERROR: Only deployment-service may use setup_cloud_logging or unified_trading_library.observability"
        )
        logger.info("Use unified_events_interface (setup_events, log_event) instead.")
        logger.info()
        for path, pattern in violations:
            logger.info(f"  {path}: {pattern}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
