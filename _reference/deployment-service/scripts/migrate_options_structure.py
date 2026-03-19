#!/usr/bin/env python3
"""
Migrate options_chain from wrong structure to correct structure.

WRONG: raw_tick_data/by_date/day-{date}/data_type-options_chain/options_chain/{venue}/{symbol}.parquet
RIGHT: raw_tick_data/by_date/day-{date}/data_type-options_chain/{venue}/{symbol}.parquet

The issue is double nesting - options_chain appears twice.

Usage:
    # Dry run
    python scripts/migrate_options_structure.py --bucket market-data-tick-cefi-${GCP_PROJECT_ID} --dry-run

    # Execute
    python scripts/migrate_options_structure.py --bucket market-data-tick-cefi-${GCP_PROJECT_ID} --execute --workers 10
"""

import argparse
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from unified_cloud_interface import StorageBucket, StorageClient
from unified_trading_library import get_storage_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# Suppress noisy urllib3 warnings
logging.getLogger("urllib3.connectionpool").setLevel(logging.ERROR)


def migrate_blob(
    client: StorageClient,
    bucket_name: str,
    old_path: str,
    new_path: str,
    dry_run: bool = True,
    max_retries: int = 3,
) -> tuple[str, str, bool]:
    """Migrate a single blob with retry logic."""
    if dry_run:
        return old_path, new_path, True

    bucket = client.bucket(bucket_name)
    for attempt in range(max_retries):
        try:
            source_blob = bucket.blob(old_path)

            # Copy to new location
            bucket.copy_blob(source_blob, bucket, new_path)

            # Delete old blob via client-level delete
            client.delete_blob(bucket_name, old_path)

            return old_path, new_path, True
        except (OSError, ValueError, RuntimeError) as e:
            error_str = str(e).lower()

            # 404 - file doesn't exist, skip
            if "404" in str(e) or "no such object" in error_str:
                logger.debug("File not found: %s", old_path)
                return old_path, new_path, False

            # Retry for transient errors
            if attempt < max_retries - 1:
                backoff = 2**attempt
                logger.warning("Retry %s/%s for %s: %s", attempt + 1, max_retries, old_path, e)
                time.sleep(backoff)
            else:
                logger.error("Failed after %s retries: %s: %s", max_retries, old_path, e)

    return old_path, new_path, False


def find_files_to_migrate(bucket: StorageBucket) -> list[tuple[str, str]]:
    """Find all files with double options_chain nesting."""
    to_migrate = []

    logger.info("Scanning for files with double options_chain nesting...")

    for blob in bucket.list_blobs(prefix="raw_tick_data/by_date/"):
        # Look for pattern: /data_type-options_chain/options_chain/
        if "/data_type-options_chain/options_chain/" in blob.name:
            old_path = blob.name
            # Remove the duplicate options_chain
            new_path = old_path.replace(
                "/data_type-options_chain/options_chain/", "/data_type-options_chain/"
            )
            to_migrate.append((old_path, new_path))

    return to_migrate


def main():
    parser = argparse.ArgumentParser(
        description="Migrate options_chain from double-nested to single-nested structure"
    )
    parser.add_argument(
        "--bucket",
        required=True,
        help="GCS bucket name",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be migrated without making changes",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Actually execute the migration",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=10,
        help="Number of parallel workers (default: 10)",
    )

    args = parser.parse_args()

    if not args.dry_run and not args.execute:
        parser.error("Must specify either --dry-run or --execute")

    dry_run = args.dry_run

    logger.info("%sOptions chain migration starting", "DRY RUN: " if dry_run else "")
    logger.info("  Bucket: %s", args.bucket)
    logger.info("  Workers: %s", args.workers)

    client = get_storage_client()
    bucket = client.bucket(args.bucket)

    # Find files to migrate
    to_migrate = find_files_to_migrate(bucket)

    logger.info("Found %s files to migrate", len(to_migrate))

    if not to_migrate:
        logger.info("Nothing to migrate!")
        return

    # Show samples
    logger.info("Sample migrations:")
    for old_path, new_path in to_migrate[:3]:
        logger.info("  %s", old_path)
        logger.info("    -> %s", new_path)

    if dry_run:
        logger.info("\nDRY RUN complete. Would migrate %s files.", len(to_migrate))
        return

    # Execute migration
    stats = {"migrated": 0, "failed": 0}

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(migrate_blob, client, args.bucket, old, new, dry_run): (old, new)
            for old, new in to_migrate
        }

        for i, future in enumerate(as_completed(futures)):
            old_path, new_path, success = future.result()
            if success:
                stats["migrated"] += 1
            else:
                stats["failed"] += 1

            # Progress update every 50 files
            if (i + 1) % 50 == 0:
                logger.info(
                    "Progress: %s/%s (%s migrated, %s failed)",
                    i + 1,
                    len(to_migrate),
                    stats["migrated"],
                    stats["failed"],
                )

    logger.info("")
    logger.info("=" * 60)
    logger.info("MIGRATION COMPLETE")
    logger.info("  Total: %s", len(to_migrate))
    logger.info("  Migrated: %s", stats["migrated"])
    logger.info("  Failed: %s", stats["failed"])
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
