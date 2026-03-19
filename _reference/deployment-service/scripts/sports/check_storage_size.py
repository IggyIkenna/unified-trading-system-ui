#!/usr/bin/env python3
"""
Check GCS storage size and object counts for sports data buckets.

Replaces the original PostgreSQL-based check_db_size.py that queried
pg_database_size and pg_total_relation_size.  This version enumerates
GCS blobs under configured bucket prefixes and reports total sizes,
object counts, and a breakdown by prefix (analogous to table-level stats).

Usage:
    python scripts/sports/check_storage_size.py
    python scripts/sports/check_storage_size.py --bucket my-bucket
    python scripts/sports/check_storage_size.py --bucket my-bucket --prefix sports/
    python scripts/sports/check_storage_size.py --top 20
"""

from __future__ import annotations

import argparse
import logging

from unified_cloud_interface import StorageClient, get_storage_client
from unified_config_interface import UnifiedCloudConfig

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Size formatting
# ---------------------------------------------------------------------------


def format_size(size_bytes: int | float) -> str:
    """Convert bytes to a human-readable string."""
    value = float(size_bytes)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if value < 1024.0:
            return f"{value:.2f} {unit}"
        value /= 1024.0
    return f"{value:.2f} PB"


# ---------------------------------------------------------------------------
# GCS enumeration
# ---------------------------------------------------------------------------

PrefixStats = dict[str, int | float]


def get_bucket_stats(
    client: StorageClient,
    bucket_name: str,
    prefix: str = "",
    depth: int = 2,
) -> tuple[int, int, dict[str, PrefixStats]]:
    """Enumerate blobs in *bucket_name* under *prefix* and aggregate stats.

    Parameters
    ----------
    depth:
        Number of path segments to group by (e.g. ``2`` groups
        ``sports/league_config/file.parquet`` under ``sports/league_config``).

    Returns
    -------
    total_size, total_objects, prefix_breakdown
    """
    bucket = client.bucket(bucket_name)
    blobs = bucket.list_blobs(prefix=prefix or None)

    prefix_breakdown: dict[str, PrefixStats] = {}
    total_size = 0
    total_objects = 0

    for blob in blobs:
        total_size += blob.size or 0
        total_objects += 1

        parts = blob.name.split("/")
        group_key = "/".join(parts[:depth]) if len(parts) > depth else blob.name

        if group_key not in prefix_breakdown:
            prefix_breakdown[group_key] = {"size": 0, "objects": 0}
        prefix_breakdown[group_key]["size"] = int(prefix_breakdown[group_key]["size"]) + (
            blob.size or 0
        )
        prefix_breakdown[group_key]["objects"] = int(prefix_breakdown[group_key]["objects"]) + 1

    return total_size, total_objects, prefix_breakdown


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------


def print_report(
    bucket_name: str,
    total_size: int,
    total_objects: int,
    prefix_breakdown: dict[str, PrefixStats],
    top_n: int = 10,
) -> None:
    """Log a formatted storage report."""
    logger.info("=" * 80)
    logger.info("GCS STORAGE SIZE ANALYSIS")
    logger.info("=" * 80)
    logger.info("")
    logger.info("Bucket: %s", bucket_name)
    logger.info("Total Size:    %s", format_size(total_size))
    logger.info("Total Objects: %s", f"{total_objects:,}")

    if not prefix_breakdown:
        logger.info("No objects found.")
        return

    # Sort by size descending
    sorted_prefixes = sorted(
        prefix_breakdown.items(), key=lambda kv: int(kv[1]["size"]), reverse=True
    )

    logger.info("")
    logger.info("-" * 80)
    logger.info("PREFIX BREAKDOWN (top %d by size)", top_n)
    logger.info("-" * 80)
    logger.info("%-50s %12s %10s", "Prefix", "Size", "Objects")
    logger.info("-" * 80)

    for prefix_key, stats in sorted_prefixes[:top_n]:
        logger.info(
            "%-50s %12s %10s",
            prefix_key,
            format_size(int(stats["size"])),
            f"{int(stats['objects']):,}",
        )

    if len(sorted_prefixes) > top_n:
        remaining_size = sum(int(s["size"]) for _, s in sorted_prefixes[top_n:])
        remaining_objects = sum(int(s["objects"]) for _, s in sorted_prefixes[top_n:])
        logger.info(
            "%-50s %12s %10s",
            f"... {len(sorted_prefixes) - top_n} more prefixes",
            format_size(remaining_size),
            f"{remaining_objects:,}",
        )

    logger.info("")
    logger.info("=" * 80)
    logger.info("SUMMARY")
    logger.info("  Total Prefixes: %d", len(sorted_prefixes))
    logger.info("  Total Objects:  %s", f"{total_objects:,}")
    logger.info("  Total Size:     %s", format_size(total_size))
    logger.info("=" * 80)


# ---------------------------------------------------------------------------
# Standalone entry-point
# ---------------------------------------------------------------------------


def main() -> None:
    """Check GCS storage size for sports data."""
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(description="Check GCS storage size for sports data")
    parser.add_argument(
        "--bucket", type=str, default="", help="GCS bucket name (overrides config default)"
    )
    parser.add_argument(
        "--prefix", type=str, default="", help="Only enumerate blobs under this prefix"
    )
    parser.add_argument(
        "--depth", type=int, default=2, help="Path segment depth for grouping (default 2)"
    )
    parser.add_argument(
        "--top", type=int, default=10, help="Number of top prefixes to show (default 10)"
    )
    args = parser.parse_args()

    config = UnifiedCloudConfig()
    bucket_name = args.bucket or f"sports-data-{config.gcp_project_id}"

    logger.info("Enumerating gs://%s/%s ...", bucket_name, args.prefix or "(all)")

    client = get_storage_client(project_id=config.gcp_project_id)
    total_size, total_objects, breakdown = get_bucket_stats(
        client,
        bucket_name,
        prefix=args.prefix,
        depth=args.depth,
    )

    print_report(bucket_name, total_size, total_objects, breakdown, top_n=args.top)


if __name__ == "__main__":
    main()
