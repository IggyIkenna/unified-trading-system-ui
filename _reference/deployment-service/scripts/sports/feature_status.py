#!/usr/bin/env python3
"""
Feature development status viewer for sports betting features.

Command-line script for viewing feature development status and generating
reports.  Reads feature tracking data from a local directory or GCS Parquet
and prints a summary to stdout.

Usage:
    python scripts/sports/feature_status.py --tracking-dir path/to/tracking
    python scripts/sports/feature_status.py --tracking-dir path/to/tracking --detailed
    python scripts/sports/feature_status.py --tracking-dir path/to/tracking --category Team
    python scripts/sports/feature_status.py --tracking-dir path/to/tracking --export csv --output status.csv
"""

from __future__ import annotations

import argparse
import csv
import io
import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Status codes
# ---------------------------------------------------------------------------

STATUS_LABELS: dict[str, str] = {
    "D": "Done",
    "P": "In Progress",
    "T": "TODO",
    "S": "Skipped",
    "B": "Blocked",
}


# ---------------------------------------------------------------------------
# Feature scanning
# ---------------------------------------------------------------------------

FeatureRecord = dict[str, str]


def scan_tracking_directory(tracking_dir: Path) -> list[FeatureRecord]:
    """Parse all *_features.py tracking files and return feature records."""
    records: list[FeatureRecord] = []

    for tracking_file in sorted(tracking_dir.glob("*_features.py")):
        if tracking_file.name == "__init__.py":
            continue

        category = tracking_file.stem.replace("_features", "").title()
        content = tracking_file.read_text(encoding="utf-8")

        # Pattern: ("feature_name", "STATUS", ...)
        feature_pattern = r'\(\s*"([a-z0-9_]+)"\s*,\s*"([A-Z])"\s*,'
        for name, status_code in re.findall(feature_pattern, content):
            records.append(
                {
                    "category": category,
                    "feature": name,
                    "status_code": status_code,
                    "status": STATUS_LABELS.get(status_code, status_code),
                }
            )

    return records


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------


def print_summary(records: list[FeatureRecord], category_filter: str = "") -> None:
    """Log a feature status summary."""
    if category_filter:
        records = [r for r in records if r["category"].lower() == category_filter.lower()]

    if not records:
        logger.info("No features found.")
        return

    # Group by category
    categories: dict[str, list[FeatureRecord]] = {}
    for rec in records:
        categories.setdefault(rec["category"], []).append(rec)

    logger.info("=" * 80)
    logger.info("FEATURE DEVELOPMENT STATUS")
    logger.info("=" * 80)

    total_done = sum(1 for r in records if r["status_code"] == "D")
    total_progress = sum(1 for r in records if r["status_code"] == "P")
    total_todo = sum(1 for r in records if r["status_code"] == "T")

    logger.info("Total features: %d", len(records))
    logger.info("  Done:        %d", total_done)
    logger.info("  In Progress: %d", total_progress)
    logger.info("  TODO:        %d", total_todo)
    if len(records) > 0:
        logger.info("  Completion:  %.1f%%", total_done / len(records) * 100)

    for cat_name in sorted(categories):
        cat_records = categories[cat_name]
        done = sum(1 for r in cat_records if r["status_code"] == "D")
        logger.info("")
        logger.info(
            "  %s: %d features (%d done, %.0f%%)",
            cat_name,
            len(cat_records),
            done,
            done / len(cat_records) * 100 if cat_records else 0,
        )

    logger.info("=" * 80)


def print_detailed(records: list[FeatureRecord], category_filter: str = "") -> None:
    """Log every feature with its status."""
    if category_filter:
        records = [r for r in records if r["category"].lower() == category_filter.lower()]

    if not records:
        logger.info("No features found.")
        return

    current_category = ""
    for rec in sorted(records, key=lambda r: (r["category"], r["feature"])):
        if rec["category"] != current_category:
            current_category = rec["category"]
            logger.info("")
            logger.info("--- %s ---", current_category)
        logger.info("  [%s] %s", rec["status_code"], rec["feature"])


def export_csv(records: list[FeatureRecord], output_path: Path) -> None:
    """Write feature records to a CSV file."""
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=["category", "feature", "status_code", "status"])
    writer.writeheader()
    writer.writerows(records)

    output_path.write_text(buf.getvalue(), encoding="utf-8")
    logger.info("Exported %d records to %s", len(records), output_path)


# ---------------------------------------------------------------------------
# Standalone entry-point
# ---------------------------------------------------------------------------


def main() -> None:
    """View feature development status."""
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(description="View sports feature development status")
    parser.add_argument(
        "--tracking-dir", type=str, required=True, help="Path to tracking directory"
    )
    parser.add_argument("--detailed", action="store_true", help="Show every feature")
    parser.add_argument("--category", type=str, default="", help="Filter by category name")
    parser.add_argument("--export", choices=["csv"], default="", help="Export format")
    parser.add_argument(
        "--output", type=str, default="feature_status.csv", help="Export output path"
    )
    args = parser.parse_args()

    tracking_dir = Path(args.tracking_dir)
    if not tracking_dir.exists():
        logger.error("Tracking directory not found: %s", tracking_dir)
        return

    records = scan_tracking_directory(tracking_dir)

    if args.export == "csv":
        export_csv(records, Path(args.output))
        return

    if args.detailed:
        print_detailed(records, category_filter=args.category)
    else:
        print_summary(records, category_filter=args.category)


if __name__ == "__main__":
    main()
