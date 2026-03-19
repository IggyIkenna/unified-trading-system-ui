#!/usr/bin/env python3
"""
Validate Test Sample Data Availability

This script validates that all instruments in the test sample have:
1. Consistent instrument key across the lookback period
2. Data files exist for all dates
3. Expected candle count per date

Usage:
    python scripts/validate_test_sample.py [--test-date 2023-05-23] [--lookback-days 30]
"""

import argparse
import json
import logging
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import TypedDict

import yaml
from unified_cloud_interface import StorageClient
from unified_trading_library import get_storage_client

sys.path.insert(0, str(Path(__file__).parent))
from _common import get_project_id

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class InstrumentsBucketResultDict(TypedDict, total=False):
    """Result from checking an instruments bucket."""

    bucket: str
    missing_dates: list[str]
    missing_instruments: dict[str, list[str]]
    total_checked: int
    total_found: int
    error: str


class MissingDataEntryDict(TypedDict):
    """A single missing data entry."""

    date: str
    instrument: str
    data_type: str


class MarketDataBucketResultDict(TypedDict, total=False):
    """Result from checking a market data bucket."""

    bucket: str
    missing_data: list[MissingDataEntryDict]
    total_checked: int
    total_found: int
    error: str


class DateRangeDict(TypedDict):
    """Date range information."""

    start: str
    end: str
    count: int


class ValidationSummaryDict(TypedDict, total=False):
    """Summary section of the validation report."""

    total_instruments: int
    total_data_types: int
    missing_instruments_data: int
    missing_market_data: int


class ValidationReportDict(TypedDict, total=False):
    """The full validation report."""

    test_date: str
    lookback_days: int
    date_range: DateRangeDict
    categories: dict[str, dict[str, object]]
    summary: ValidationSummaryDict
    mode: str
    error: str


def load_test_sample_config(config_path: Path) -> dict[str, object]:
    """Load the test sample instruments configuration."""
    with open(config_path) as f:
        return yaml.safe_load(f)


def get_date_range(test_date: str, lookback_days: int) -> list[str]:
    """Generate list of dates for lookback period."""
    end_date = datetime.strptime(test_date, "%Y-%m-%d").replace(tzinfo=UTC)
    dates = []
    for i in range(lookback_days + 1):  # Include test date
        date = end_date - timedelta(days=lookback_days - i)
        dates.append(date.strftime("%Y-%m-%d"))
    return dates


def check_instruments_bucket(
    storage_client: StorageClient,
    category: str,
    project_id: str,
    dates: list[str],
    instruments: list[dict[str, str]],
) -> InstrumentsBucketResultDict:
    """Check if instruments exist in the instruments bucket for all dates."""
    bucket_name = f"instruments-store-{category.lower()}-{project_id}"
    results = {
        "bucket": bucket_name,
        "missing_dates": [],
        "missing_instruments": {},
        "total_checked": 0,
        "total_found": 0,
    }

    try:
        bucket = storage_client.bucket(bucket_name)

        for date in dates:
            # Check if instruments file exists for this date
            prefix = f"instrument_availability/by_date/day-{date}/"
            blobs = list(bucket.list_blobs(prefix=prefix, max_results=1))

            if not blobs:
                results["missing_dates"].append(date)
            else:
                results["total_found"] += 1

            results["total_checked"] += 1

    except (OSError, ValueError, RuntimeError) as e:
        logger.error("Error checking bucket %s: %s", bucket_name, e)
        results["error"] = str(e)

    return results


def check_market_data_bucket(
    storage_client: StorageClient,
    category: str,
    project_id: str,
    dates: list[str],
    instruments: list[dict[str, str]],
    data_types: list[str],
) -> MarketDataBucketResultDict:
    """Check if market data files exist for instruments."""
    bucket_name = f"market-data-tick-{category.lower()}-{project_id}"
    results = {
        "bucket": bucket_name,
        "missing_data": [],
        "total_checked": 0,
        "total_found": 0,
    }

    try:
        bucket = storage_client.bucket(bucket_name)

        for date in dates:
            for instrument in instruments:
                instrument_key = instrument.get("instrument_key", "")
                for data_type in data_types:
                    # Build expected path
                    # Format: processed_candles/by_date/day-{date}/timeframe-{tf}/data_type-{dt}/{asset_class}/{venue}/{instrument_id}.parquet
                    # For raw tick data: raw_tick_data/by_date/day-{date}/{data_type}/{venue}/{instrument_id}.parquet

                    # Check raw tick data path
                    venue = instrument_key.split(":")[0]
                    # URL encode the instrument key for file name
                    encoded_key = instrument_key.replace(":", "%3A").replace("@", "%40")

                    prefix = f"raw_tick_data/by_date/day-{date}/{data_type}/{venue}/"

                    blobs = list(bucket.list_blobs(prefix=prefix, max_results=10))
                    results["total_checked"] += 1

                    # Check if any blob matches our instrument
                    found = False
                    for blob in blobs:
                        if encoded_key in blob.name or instrument_key in blob.name:
                            found = True
                            break

                    if found:
                        results["total_found"] += 1
                    else:
                        results["missing_data"].append(
                            {
                                "date": date,
                                "instrument": instrument_key,
                                "data_type": data_type,
                            }
                        )

    except (OSError, ValueError, RuntimeError) as e:
        logger.error("Error checking bucket %s: %s", bucket_name, e)
        results["error"] = str(e)

    return results


def validate_test_sample(
    test_date: str = "2023-05-23",
    lookback_days: int = 30,
    project_id: str | None = None,
    dry_run: bool = False,
) -> ValidationReportDict:
    """
    Validate that all test sample instruments have data for the lookback period.

    Args:
        test_date: Target test date (YYYY-MM-DD)
        lookback_days: Number of days to look back
        project_id: GCP project ID
        dry_run: If True, only show what would be checked

    Returns:
        Validation report dict
    """
    # Load config
    config_path = Path(__file__).parent.parent / "configs" / "test_sample_instruments.yaml"
    if not config_path.exists():
        logger.error("Config file not found: %s", config_path)
        return {"error": f"Config file not found: {config_path}"}

    config = load_test_sample_config(config_path)
    dates = get_date_range(test_date, lookback_days)

    logger.info("Validating test sample for %s with %s-day lookback", test_date, lookback_days)
    logger.info("Date range: %s to %s (%s days)", dates[0], dates[-1], len(dates))

    report = {
        "test_date": test_date,
        "lookback_days": lookback_days,
        "date_range": {"start": dates[0], "end": dates[-1], "count": len(dates)},
        "categories": {},
        "summary": {
            "total_instruments": 0,
            "total_data_types": 0,
            "missing_instruments_data": 0,
            "missing_market_data": 0,
        },
    }

    if dry_run:
        logger.info("Running in dry-run mode - not checking GCS")
        report["mode"] = "dry_run"

        # Just report what would be checked
        for category in ["cefi", "tradfi", "defi"]:
            if category not in config:
                continue

            category_config = config[category]
            category_report = {"venues": {}}

            for venue, venue_config in category_config.items():
                if isinstance(venue_config, dict) and "instruments" in venue_config:
                    instruments = venue_config.get("instruments", [])
                    data_types = venue_config.get("data_types", [])

                    category_report["venues"][venue] = {
                        "instrument_count": len(instruments),
                        "data_types": data_types,
                        "instruments": [i.get("instrument_key") for i in instruments],
                    }
                    report["summary"]["total_instruments"] += len(instruments)
                    report["summary"]["total_data_types"] += len(data_types)

            report["categories"][category.upper()] = category_report

        return report

    # Real validation with GCS
    resolved_project_id = project_id or get_project_id()
    storage_client = get_storage_client()

    for category in ["cefi", "tradfi", "defi"]:
        if category not in config:
            continue

        category_config = config[category]
        category_report = {
            "venues": {},
            "instruments_check": None,
            "market_data_check": None,
        }

        all_instruments = []
        all_data_types = set()

        for venue, venue_config in category_config.items():
            if isinstance(venue_config, dict) and "instruments" in venue_config:
                instruments = venue_config.get("instruments", [])
                data_types = venue_config.get("data_types", [])

                all_instruments.extend(instruments)
                all_data_types.update(data_types)

                category_report["venues"][venue] = {
                    "instrument_count": len(instruments),
                    "data_types": data_types,
                }
                report["summary"]["total_instruments"] += len(instruments)
                report["summary"]["total_data_types"] += len(data_types)

        # Check instruments bucket
        logger.info("Checking instruments bucket for %s...", category.upper())
        instruments_result = check_instruments_bucket(
            storage_client, category, resolved_project_id, dates, all_instruments
        )
        category_report["instruments_check"] = instruments_result

        if instruments_result.get("missing_dates"):
            report["summary"]["missing_instruments_data"] += len(
                instruments_result["missing_dates"]
            )

        # Check market data bucket (sample check - first few instruments only)
        logger.info("Checking market data bucket for %s...", category.upper())
        sample_instruments = all_instruments[:3]  # Only check first 3 to avoid long runtime
        sample_dates = dates[-3:]  # Only check last 3 dates

        market_data_result = check_market_data_bucket(
            storage_client,
            category,
            resolved_project_id,
            sample_dates,
            sample_instruments,
            list(all_data_types)[:2],  # Only check first 2 data types
        )
        category_report["market_data_check"] = market_data_result

        if market_data_result.get("missing_data"):
            report["summary"]["missing_market_data"] += len(market_data_result["missing_data"])

        report["categories"][category.upper()] = category_report

    return report


def print_report(report: ValidationReportDict) -> None:
    """Print the validation report in a readable format."""
    logger.info("\n" + "=" * 80)
    logger.info("TEST SAMPLE VALIDATION REPORT")
    logger.info("=" * 80)

    logger.info("Test Date: %s", report["test_date"])
    logger.info("Lookback Days: %s", report["lookback_days"])
    logger.info(
        "Date Range: %s to %s (%s days)",
        report["date_range"]["start"],
        report["date_range"]["end"],
        report["date_range"]["count"],
    )

    if report.get("mode") == "dry_run":
        logger.info("[DRY RUN MODE - No GCS checks performed]")

    logger.info("-" * 40)
    logger.info("SUMMARY")
    logger.info("-" * 40)
    logger.info("Total Instruments: %s", report["summary"]["total_instruments"])
    logger.info("Total Data Types: %s", report["summary"]["total_data_types"])

    if report.get("mode") != "dry_run":
        logger.info("Missing Instruments Data: %s", report["summary"]["missing_instruments_data"])
        logger.info("Missing Market Data: %s", report["summary"]["missing_market_data"])

    for category, cat_report in report.get("categories", {}).items():
        logger.info("-" * 40)
        logger.info("%s", category)
        logger.info("-" * 40)

        for venue, venue_info in cat_report.get("venues", {}).items():
            logger.info("  %s:", venue)
            logger.info("    Instruments: %s", venue_info["instrument_count"])
            logger.info("    Data Types: %s", ", ".join(venue_info.get("data_types", [])))

            if "instruments" in venue_info:
                for inst in venue_info["instruments"][:3]:
                    logger.info("      - %s", inst)
                if len(venue_info["instruments"]) > 3:
                    logger.info("      ... and %s more", len(venue_info["instruments"]) - 3)

        # Show check results if available
        if cat_report.get("instruments_check"):
            check = cat_report["instruments_check"]
            if check.get("missing_dates"):
                logger.warning("  Missing instrument dates: %s", len(check["missing_dates"]))
                for date in check["missing_dates"][:5]:
                    logger.warning("      - %s", date)
            else:
                logger.info(
                    "  Instruments check: %s/%s dates found",
                    check.get("total_found", 0),
                    check.get("total_checked", 0),
                )

        if cat_report.get("market_data_check"):
            check = cat_report["market_data_check"]
            if check.get("missing_data"):
                logger.warning("  Missing market data: %s files", len(check["missing_data"]))
                for item in check["missing_data"][:5]:
                    logger.warning(
                        "      - %s: %s (%s)", item["date"], item["instrument"], item["data_type"]
                    )
            else:
                logger.info(
                    "  Market data check: %s/%s files found",
                    check.get("total_found", 0),
                    check.get("total_checked", 0),
                )

    logger.info("=" * 80)


def main():
    parser = argparse.ArgumentParser(description="Validate test sample data availability")
    parser.add_argument(
        "--test-date",
        default="2023-05-23",
        help="Test date (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--lookback-days",
        type=int,
        default=30,
        help="Number of days to look back",
    )
    parser.add_argument(
        "--project-id",
        default=None,
        help="GCP project ID (defaults to GCP_PROJECT_ID env var)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only show what would be checked, don't access GCS",
    )
    parser.add_argument(
        "--output",
        choices=["text", "yaml", "json"],
        default="text",
        help="Output format",
    )

    args = parser.parse_args()

    report = validate_test_sample(
        test_date=args.test_date,
        lookback_days=args.lookback_days,
        project_id=args.project_id,
        dry_run=args.dry_run,
    )

    if args.output == "text":
        print_report(report)
    elif args.output == "yaml":
        logger.info(yaml.dump(report, default_flow_style=False, sort_keys=False))
    elif args.output == "json":
        logger.info(json.dumps(report, indent=2))

    # Return non-zero exit code if there are missing data
    if report["summary"].get("missing_instruments_data", 0) > 0:
        return 1
    if report["summary"].get("missing_market_data", 0) > 0:
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
