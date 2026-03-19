#!/usr/bin/env python3
"""
Refresh Data Catalogue YAML files from data-status API.

Queries the UTD v2 data-status API (or CLI) for each data pipeline service,
then updates the corresponding data-catalogue.{service}.yaml files with
actual GCS state (stage_1_has_run, stage_2_data_complete, latest_data_date).

Preserves manual fields (assignee, notes) while updating auto-populated fields.

Usage:
    python scripts/refresh_data_catalogue.py --all
    python scripts/refresh_data_catalogue.py --service market-tick-data-handler
    python scripts/refresh_data_catalogue.py --service instruments-service --start-date 2024-01-01
"""

import argparse
import json
import logging
import subprocess
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

import yaml

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

CONFIGS_DIR = Path(__file__).parent.parent / "configs"

DATA_PIPELINE_SERVICES = [
    "instruments-service",
    "market-tick-data-handler",
    "market-data-processing-service",
    "features-calendar-service",
    "features-delta-one-service",
    "features-volatility-service",
    "features-onchain-service",
]

# Default date range for data status checks
DEFAULT_START_DATE = "2024-01-01"
DEFAULT_END_DATE = (datetime.now(UTC) - timedelta(days=1)).strftime("%Y-%m-%d")


def run_data_status_cli(
    service: str,
    start_date: str,
    end_date: str,
) -> dict | None:
    """Run deploy.py data-status CLI and parse JSON output."""
    deploy_py = Path(__file__).parent.parent / "deploy.py"
    if not deploy_py.exists():
        # Try deployment_service CLI
        deploy_py = "deploy.py"

    cmd = [
        sys.executable,
        str(deploy_py),
        "data-status",
        "-s",
        service,
        "--start-date",
        start_date,
        "--end-date",
        end_date,
        "--output",
        "json",
    ]

    # Add service-specific flags
    if service == "market-tick-data-handler":
        cmd.extend(["--check-data-types", "--check-venues"])
    elif service == "market-data-processing-service":
        cmd.extend(["--check-data-types", "--check-timeframes"])
    elif service in (
        "features-delta-one-service",
        "features-volatility-service",
        "features-onchain-service",
    ):
        cmd.append("--check-feature-groups")
    elif service == "instruments-service":
        cmd.append("--check-venues")

    logger.info("Running: %s", " ".join(cmd))

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
            cwd=str(Path(__file__).parent.parent),
        )
        if result.returncode != 0:
            logger.error("data-status failed for %s: %s", service, result.stderr[:500])
            return None

        # Parse JSON from stdout
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            logger.error("Failed to parse JSON output for %s", service)
            logger.debug("stdout: %s", result.stdout[:500])
            return None

    except subprocess.TimeoutExpired:
        logger.error("data-status timed out for %s", service)
        return None
    except FileNotFoundError:
        logger.error("deploy.py not found at %s", deploy_py)
        return None


def try_api_data_status(
    service: str,
    start_date: str,
    end_date: str,
    api_url: str = "http://127.0.0.1:8000",
) -> dict | None:
    """Try the API endpoint first (faster than CLI)."""
    try:
        import urllib.request

        url = (
            f"{api_url}/api/data-status/turbo"
            f"?service={service}"
            f"&start_date={start_date}"
            f"&end_date={end_date}"
            f"&include_instrument_types=true"
            f"&force_refresh=true"
        )
        logger.info("Trying API: %s", url)

        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=120) as response:
            return json.loads(response.read().decode())

    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("API not available (%s), falling back to CLI", e)
        return None


def load_catalogue(service: str) -> dict | None:
    """Load existing data-catalogue YAML for a service."""
    catalogue_path = CONFIGS_DIR / f"data-catalogue.{service}.yaml"
    if not catalogue_path.exists():
        logger.warning("No catalogue file: %s", catalogue_path)
        return None

    with open(catalogue_path) as f:
        return yaml.safe_load(f)


def save_catalogue(service: str, data: dict) -> None:
    """Save updated data-catalogue YAML."""
    catalogue_path = CONFIGS_DIR / f"data-catalogue.{service}.yaml"

    # Update metadata
    data["last_updated"] = datetime.now(UTC).strftime("%Y-%m-%d")
    data["auto_refreshed"] = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S")

    with open(catalogue_path, "w") as f:
        yaml.dump(data, f, default_flow_style=False, sort_keys=False, width=120)

    logger.info("Updated %s", catalogue_path)


def update_catalogue_from_status(catalogue: dict, status_data: dict) -> dict:
    """Update catalogue shard_status from data-status API response.

    Preserves manual fields (assignee, notes) while updating:
    - stage_1_has_run: true if any data found
    - stage_2_data_complete: true if completion > 95%
    - latest_data_date: most recent date with data
    """
    if not status_data or "shard_status" not in catalogue:
        return catalogue

    # If we have per-category breakdown
    categories = status_data.get("categories", {})
    for cat_name, cat_data in categories.items():
        if cat_name not in catalogue.get("shard_status", {}):
            continue

        # Update venues if available
        venues = cat_data.get("venues", {})
        for venue_name, venue_data in venues.items():
            venue_entry = catalogue["shard_status"][cat_name].get(venue_name, {})
            if not venue_entry or isinstance(venue_entry, str):
                continue

            venue_completion = venue_data.get("completion_percentage", 0)
            venue_has_data = venue_data.get("dates_with_data", 0) > 0

            # Handle instrument_types nested structure
            if "instrument_types" in venue_entry:
                for _inst_type, inst_data in venue_entry["instrument_types"].items():
                    if isinstance(inst_data, dict):
                        inst_data["stage_1_has_run"] = venue_has_data
                        inst_data["stage_2_data_complete"] = venue_completion >= 95
            else:
                venue_entry["stage_1_has_run"] = venue_has_data
                venue_entry["stage_2_data_complete"] = venue_completion >= 95

    return catalogue


def refresh_service(
    service: str,
    start_date: str,
    end_date: str,
    api_url: str = "http://127.0.0.1:8000",
) -> bool:
    """Refresh a single service's data catalogue."""
    logger.info("\n%s", "=" * 60)
    logger.info("Refreshing %s", service)
    logger.info("%s", "=" * 60)

    # Load existing catalogue
    catalogue = load_catalogue(service)
    if catalogue is None:
        logger.error("No catalogue for %s, skipping", service)
        return False

    # Try API first, fall back to CLI
    status_data = try_api_data_status(service, start_date, end_date, api_url)
    if status_data is None:
        status_data = run_data_status_cli(service, start_date, end_date)

    if status_data is None:
        logger.error("Could not get data status for %s", service)
        return False

    # Update catalogue
    updated = update_catalogue_from_status(catalogue, status_data)
    save_catalogue(service, updated)

    logger.info("Done refreshing %s", service)
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Refresh data catalogue YAMLs from data-status API"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Refresh all data pipeline services",
    )
    parser.add_argument(
        "--service",
        "-s",
        type=str,
        help="Specific service to refresh",
    )
    parser.add_argument(
        "--start-date",
        type=str,
        default=DEFAULT_START_DATE,
        help=f"Start date for data status check (default: {DEFAULT_START_DATE})",
    )
    parser.add_argument(
        "--end-date",
        type=str,
        default=DEFAULT_END_DATE,
        help=f"End date for data status check (default: {DEFAULT_END_DATE})",
    )
    parser.add_argument(
        "--api-url",
        type=str,
        default="http://127.0.0.1:8000",
        help="UTD v2 API URL (default: http://127.0.0.1:8000)",
    )

    args = parser.parse_args()

    if not args.all and not args.service:
        parser.error("Either --all or --service is required")

    services = DATA_PIPELINE_SERVICES if args.all else [args.service]

    results = {}
    for service in services:
        success = refresh_service(service, args.start_date, args.end_date, args.api_url)
        results[service] = "OK" if success else "FAILED"

    # Summary
    logger.info("\n%s", "=" * 60)
    logger.info("REFRESH SUMMARY")
    logger.info("%s", "=" * 60)
    for service, status in results.items():
        logger.info("  %s: %s", service, status)


if __name__ == "__main__":
    main()
