#!/usr/bin/env python3
"""
Cleanup script to delete old date-level instruments.parquet files.

These are legacy files from before the venue-level folder structure was implemented.
The new structure is: instrument_availability/by_date/day-{date}/venue-{VENUE}/instruments.parquet
The old structure was: instrument_availability/by_date/day-{date}/instruments.parquet

This script deletes all old date-level instruments.parquet files across all 3 buckets:
- instruments-store-cefi-{GCP_PROJECT_ID}
- instruments-store-defi-{GCP_PROJECT_ID}
- instruments-store-tradfi-{GCP_PROJECT_ID}

Usage:
    python cleanup_old_instruments_parquet.py [--dry-run] [--workers N]
"""

import argparse
import logging
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

from unified_cloud_interface import StorageClient
from unified_config_interface import UnifiedCloudConfig
from unified_trading_library import get_storage_client

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def _get_buckets(project_id: str) -> list[str]:
    return [
        f"instruments-store-cefi-{project_id}",
        f"instruments-store-defi-{project_id}",
        f"instruments-store-tradfi-{project_id}",
    ]


# Pattern to match date-level instruments.parquet files (NOT venue-level)
# Match: instrument_availability/by_date/day-YYYY-MM-DD/instruments.parquet
# Don't match: instrument_availability/by_date/day-YYYY-MM-DD/venue-*/instruments.parquet
DATE_LEVEL_PATTERN = re.compile(
    r"^instrument_availability/by_date/day-\d{4}-\d{2}-\d{2}/instruments\.parquet$"
)


def find_date_level_files(bucket_name: str, client: StorageClient) -> list[str]:
    """Find all date-level instruments.parquet files in a bucket."""
    logger.info("🔍 Scanning bucket: %s", bucket_name)

    prefix = "instrument_availability/by_date/"

    date_level_files = []

    for blob in client.list_blobs(bucket_name, prefix=prefix):
        if DATE_LEVEL_PATTERN.match(blob.name):
            date_level_files.append(blob.name)

    logger.info("📊 Found %s date-level files in %s", len(date_level_files), bucket_name)
    return date_level_files


def delete_blob(
    bucket_name: str, blob_name: str, client: StorageClient, dry_run: bool
) -> tuple[str, bool, str]:
    """Delete a single blob. Returns (blob_name, success, error_message)."""
    try:
        if dry_run:
            logger.info("[DRY-RUN] Would delete: gs://%s/%s", bucket_name, blob_name)
            return (blob_name, True, "")

        client.delete_blob(bucket_name, blob_name)
        logger.info("✅ Deleted: gs://%s/%s", bucket_name, blob_name)
        return (blob_name, True, "")
    except (OSError, ValueError, RuntimeError) as e:
        error_msg = str(e)
        logger.error("❌ Failed to delete gs://%s/%s: %s", bucket_name, blob_name, error_msg)
        return (blob_name, False, error_msg)


def cleanup_bucket(
    bucket_name: str, client: StorageClient, dry_run: bool, max_workers: int
) -> dict:
    """Cleanup a single bucket using parallel workers."""
    logger.info("\n%s", "=" * 60)
    logger.info("Processing bucket: %s", bucket_name)
    logger.info("%s", "=" * 60)

    # Find all date-level files
    files_to_delete = find_date_level_files(bucket_name, client)

    if not files_to_delete:
        logger.info("✅ No date-level files to delete in %s", bucket_name)
        return {
            "bucket": bucket_name,
            "files_found": 0,
            "files_deleted": 0,
            "files_failed": 0,
            "errors": [],
        }

    logger.info("🗑️ Deleting %s files with %s workers...", len(files_to_delete), max_workers)

    deleted = 0
    failed = 0
    errors = []

    # Use ThreadPoolExecutor for parallel deletion
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(delete_blob, bucket_name, blob_name, client, dry_run): blob_name
            for blob_name in files_to_delete
        }

        for future in as_completed(futures):
            blob_name, success, error_msg = future.result()
            if success:
                deleted += 1
            else:
                failed += 1
                errors.append(f"{blob_name}: {error_msg}")

    return {
        "bucket": bucket_name,
        "files_found": len(files_to_delete),
        "files_deleted": deleted,
        "files_failed": failed,
        "errors": errors,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Delete old date-level instruments.parquet files from GCS"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Don't actually delete, just show what would be deleted",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=5,
        help="Number of parallel workers (default: 5)",
    )
    parser.add_argument(
        "--bucket",
        type=str,
        choices=["cefi", "defi", "tradfi", "all"],
        default="all",
        help="Which bucket(s) to clean (default: all)",
    )

    args = parser.parse_args()

    project_id = UnifiedCloudConfig().gcp_project_id
    client = get_storage_client()
    all_buckets = _get_buckets(project_id)

    # Determine which buckets to clean
    if args.bucket == "all":
        buckets_to_clean = all_buckets
    else:
        bucket_map = {
            "cefi": f"instruments-store-cefi-{project_id}",
            "defi": f"instruments-store-defi-{project_id}",
            "tradfi": f"instruments-store-tradfi-{project_id}",
        }
        buckets_to_clean = [bucket_map[args.bucket]]

    logger.info("\n%s", "=" * 60)
    logger.info("GCS Cleanup: Old Date-Level instruments.parquet Files")
    logger.info("%s", "=" * 60)
    logger.info(
        "Mode: %s",
        "DRY-RUN (no files will be deleted)" if args.dry_run else "LIVE (files will be deleted)",
    )
    logger.info("Workers: %s", args.workers)
    logger.info("Buckets: %s", len(buckets_to_clean))

    # Process each bucket
    results = []
    for bucket_name in buckets_to_clean:
        result = cleanup_bucket(bucket_name, client, args.dry_run, args.workers)
        results.append(result)

    # Print summary
    logger.info("\n%s", "=" * 60)
    logger.info("SUMMARY")
    logger.info("%s", "=" * 60)

    total_found = sum(r["files_found"] for r in results)
    total_deleted = sum(r["files_deleted"] for r in results)
    total_failed = sum(r["files_failed"] for r in results)

    for result in results:
        logger.info("\n%s:", result["bucket"])
        logger.info("  Found: %s", result["files_found"])
        logger.info("  Deleted: %s", result["files_deleted"])
        logger.info("  Failed: %s", result["files_failed"])
        if result["errors"]:
            for error in result["errors"][:5]:  # Show first 5 errors
                logger.error("    - %s", error)
            if len(result["errors"]) > 5:
                logger.error("    ... and %s more errors", len(result["errors"]) - 5)

    logger.info("\n%s", "=" * 60)
    logger.info("TOTAL: Found=%s, Deleted=%s, Failed=%s", total_found, total_deleted, total_failed)
    if args.dry_run:
        logger.info("⚠️  DRY-RUN MODE - No files were actually deleted")
        logger.info("Run without --dry-run to delete files")
    logger.info("%s", "=" * 60)


if __name__ == "__main__":
    main()
