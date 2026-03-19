#!/usr/bin/env python3
"""
Migrate GCS tick data from old/incorrect structures to new venue-directory structure.

Handles two migration cases:

Case 1: File directly under asset_class (no venue directory)
OLD: raw_tick_data/by_date/day-{date}/data_type-{type}/{asset_class}/{VENUE}:{INST}:{SYMBOL}.parquet
NEW: raw_tick_data/by_date/day-{date}/data_type-{type}/{asset_class}/{VENUE}/{VENUE}:{INST}:{SYMBOL}.parquet

Case 2: File under underlying directory instead of venue directory (futures_chain/options_chain)
OLD: raw_tick_data/by_date/day-{date}/data_type-{type}/futures_chain/{underlying}/{VENUE}:{INST}:{SYMBOL}.parquet
NEW: raw_tick_data/by_date/day-{date}/data_type-{type}/futures_chain/{VENUE}/{underlying}/{VENUE}:{INST}:{SYMBOL}.parquet

Usage:
    # Dry run for a single date
    python scripts/migrate_venue_directories.py --bucket market-data-tick-cefi-${GCP_PROJECT_ID} --date 2023-05-23 --dry-run

    # Execute migration for a date range
    python scripts/migrate_venue_directories.py --bucket market-data-tick-cefi-${GCP_PROJECT_ID} --start-date 2023-01-01 --end-date 2023-12-31 --execute

    # Execute with parallelism
    python scripts/migrate_venue_directories.py --bucket market-data-tick-cefi-${GCP_PROJECT_ID} --start-date 2023-01-01 --end-date 2023-12-31 --execute --workers 16
"""

import argparse
import logging
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime, timedelta

from unified_cloud_interface import StorageClient
from unified_trading_library import get_storage_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# Venue extraction pattern: extract venue from filenames like "BINANCE-FUTURES:PERPETUAL:BTC-USDT@LIN.parquet"
VENUE_PATTERN = re.compile(r"^([A-Z0-9_-]+):")

# Asset classes that need migration (directories under data_type-X/)
ASSET_CLASSES = [
    "perpetuals",
    "spot",
    "futures_chain",
    "options_chain",
    "equities",
    "etf",
    "indices",
    "pool",  # DEFI
]

# Known valid venues for CeFi - used to detect misplaced underlying directories
# If a directory under futures_chain/options_chain is NOT in this set, it's likely an underlying
VALID_CEFI_VENUES = {
    "BINANCE-SPOT",
    "BINANCE-FUTURES",
    "DERIBIT",
    "BYBIT",
    "OKX",
    "UPBIT",
    "COINBASE",
    "HYPERLIQUID",
    "ASTER",
    # TradFi venues
    "CME",
    "CBOE",
    "NASDAQ",
    "NYSE",
    "ICE",
}

# Data types to check
DATA_TYPES = [
    "trades",
    "book_snapshot_5",
    "book_snapshot_10",
    "book_snapshot_25",
    "derivative_ticker",
    "liquidations",
    "funding_rates",
    "ohlcv_24h",
    "ohlcv_15m",
    "swaps",
]


def extract_venue_from_filename(filename: str) -> str | None:
    """Extract venue from filename like 'BINANCE-FUTURES:PERPETUAL:BTC-USDT@LIN.parquet'."""
    match = VENUE_PATTERN.match(filename)
    if match:
        return match.group(1)
    return None


def is_old_structure(blob_name: str) -> bool:
    """Check if blob is in OLD structure (no venue directory)."""
    # OLD: .../perpetuals/BINANCE-FUTURES:PERPETUAL:BTC.parquet
    # NEW: .../perpetuals/BINANCE-FUTURES/BINANCE-FUTURES:PERPETUAL:BTC.parquet
    parts = blob_name.split("/")
    if len(parts) < 2:
        return False

    # Get the filename
    filename = parts[-1]
    if not filename.endswith(".parquet"):
        return False

    # Check if parent directory is an asset_class (old) or a venue (new)
    parent_dir = parts[-2]

    # If parent is an asset_class AND filename has venue prefix, it's old structure
    if parent_dir in ASSET_CLASSES:
        venue = extract_venue_from_filename(filename)
        if venue:
            return True

    return False


def get_new_path(old_path: str) -> str | None:
    """Convert old path to new path with venue directory."""
    parts = old_path.split("/")
    filename = parts[-1]

    venue = extract_venue_from_filename(filename)
    if not venue:
        return None

    # Insert venue directory before filename
    # OLD: .../perpetuals/BINANCE-FUTURES:xxx.parquet
    # NEW: .../perpetuals/BINANCE-FUTURES/BINANCE-FUTURES:xxx.parquet
    new_parts = [*parts[:-1], venue, filename]
    return "/".join(new_parts)


def is_misplaced_underlying_structure(blob_name: str) -> bool:
    """Check if file is under an underlying directory instead of a venue directory.

    Detects: futures_chain/{underlying}/{VENUE}:FUTURE:...parquet
    Should be: futures_chain/{VENUE}/{underlying}/{VENUE}:FUTURE:...parquet

    This happens when files are organized by underlying first (old structure)
    instead of venue first (correct structure).
    """
    parts = blob_name.split("/")
    if len(parts) < 3:
        return False

    filename = parts[-1]
    if not filename.endswith(".parquet"):
        return False

    parent_dir = parts[-2]  # Could be underlying (wrong) or venue (correct)
    grandparent_dir = parts[-3]  # Should be asset_class

    # If grandparent is futures_chain or options_chain
    # AND parent is NOT a valid venue (so it's likely an underlying)
    # AND filename has a venue prefix that IS a valid venue
    # Then this file is in the wrong structure
    if (
        grandparent_dir in ("futures_chain", "options_chain")
        and parent_dir not in VALID_CEFI_VENUES
    ):
        venue = extract_venue_from_filename(filename)
        if venue and venue in VALID_CEFI_VENUES:
            return True

    return False


def get_new_path_for_misplaced(old_path: str) -> str | None:
    """Convert misplaced underlying path to correct venue-first path.

    OLD: .../futures_chain/{underlying}/{VENUE}:FUTURE:...parquet
    NEW: .../futures_chain/{VENUE}/{underlying}/{VENUE}:FUTURE:...parquet
    """
    parts = old_path.split("/")
    filename = parts[-1]
    underlying = parts[-2]

    venue = extract_venue_from_filename(filename)
    if not venue:
        return None

    # Insert venue directory between grandparent (asset_class) and parent (underlying)
    # OLD: [..., 'futures_chain', 'BTC-USD', 'DERIBIT:FUTURE:...parquet']
    # NEW: [..., 'futures_chain', 'DERIBIT', 'BTC-USD', 'DERIBIT:FUTURE:...parquet']
    new_parts = [*parts[:-2], venue, underlying, filename]
    return "/".join(new_parts)


def migrate_blob(
    client: StorageClient,
    bucket_name: str,
    old_path: str,
    new_path: str,
    dry_run: bool = True,
) -> tuple[str, str, bool]:
    """Migrate a single blob from old to new path."""
    if dry_run:
        return old_path, new_path, True

    try:
        bucket = client.bucket(bucket_name)
        source_blob = bucket.blob(old_path)

        # Copy to new location
        bucket.copy_blob(source_blob, bucket, new_path)

        # Delete old blob via client-level delete
        client.delete_blob(bucket_name, old_path)

        return old_path, new_path, True
    except (OSError, ValueError, RuntimeError) as e:
        logger.error("Failed to migrate %s: %s", old_path, e)
        return old_path, new_path, False


def migrate_date(
    client: StorageClient,
    bucket_name: str,
    date_str: str,
    dry_run: bool = True,
    workers: int = 8,
) -> dict:
    """Migrate all old-structure files for a single date."""
    bucket = client.bucket(bucket_name)
    prefix = f"raw_tick_data/by_date/day-{date_str}/"

    stats = {
        "date": date_str,
        "scanned": 0,
        "needs_migration": 0,
        "migrated": 0,
        "failed": 0,
        "already_new": 0,
    }

    # Find all blobs that need migration
    to_migrate = []

    logger.info("Scanning %s...", date_str)

    for blob in bucket.list_blobs(prefix=prefix):
        stats["scanned"] += 1

        if is_old_structure(blob.name):
            # Case 1: File directly under asset_class (no venue directory at all)
            # e.g., perpetuals/BINANCE-FUTURES:PERPETUAL:BTC.parquet
            new_path = get_new_path(blob.name)
            if new_path:
                to_migrate.append((blob.name, new_path))
                stats["needs_migration"] += 1
        elif is_misplaced_underlying_structure(blob.name):
            # Case 2: File under underlying directory instead of venue directory
            # e.g., futures_chain/BTC-USD/DERIBIT:FUTURE:...parquet
            # Should be: futures_chain/DERIBIT/BTC-USD/DERIBIT:FUTURE:...parquet
            new_path = get_new_path_for_misplaced(blob.name)
            if new_path:
                to_migrate.append((blob.name, new_path))
                stats["needs_migration"] += 1
        else:
            stats["already_new"] += 1

    if not to_migrate:
        logger.info(
            "  %s: No files need migration (%s scanned, %s already in new structure)",
            date_str,
            stats["scanned"],
            stats["already_new"],
        )
        return stats

    logger.info(
        "  %s: %s files to migrate out of %s scanned",
        date_str,
        stats["needs_migration"],
        stats["scanned"],
    )

    if dry_run:
        # Just show what would be migrated
        for old_path, new_path in to_migrate[:5]:
            logger.info("    Would migrate: %s -> %s", old_path, new_path)
        if len(to_migrate) > 5:
            logger.info("    ... and %s more", len(to_migrate) - 5)
        stats["migrated"] = stats["needs_migration"]
        return stats

    # Execute migration in parallel
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(migrate_blob, client, bucket_name, old, new, dry_run): (old, new)
            for old, new in to_migrate
        }

        for future in as_completed(futures):
            old_path, new_path, success = future.result()
            if success:
                stats["migrated"] += 1
            else:
                stats["failed"] += 1

    logger.info("  %s: Migrated %s, Failed %s", date_str, stats["migrated"], stats["failed"])
    return stats


def generate_date_range(start_date: str, end_date: str) -> list[str]:
    """Generate list of date strings between start and end."""
    start = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=UTC)
    end = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=UTC)

    dates = []
    current = start
    while current <= end:
        dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)

    return dates


def main():
    parser = argparse.ArgumentParser(
        description="Migrate GCS tick data from old flat structure to new venue-directory structure"
    )
    parser.add_argument(
        "--bucket",
        required=True,
        help="GCS bucket name (e.g., market-data-tick-cefi-${GCP_PROJECT_ID})",
    )
    parser.add_argument(
        "--date",
        help="Single date to migrate (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--start-date",
        help="Start date for range migration (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--end-date",
        help="End date for range migration (YYYY-MM-DD)",
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
        default=8,
        help="Number of parallel workers for blob operations (default: 8)",
    )
    parser.add_argument(
        "--date-workers",
        type=int,
        default=4,
        help="Number of parallel workers for date processing (default: 4)",
    )

    args = parser.parse_args()

    # Validate arguments
    if not args.dry_run and not args.execute:
        parser.error("Must specify either --dry-run or --execute")

    if args.date:
        dates = [args.date]
    elif args.start_date and args.end_date:
        dates = generate_date_range(args.start_date, args.end_date)
    else:
        parser.error("Must specify either --date or both --start-date and --end-date")

    dry_run = args.dry_run

    logger.info("%sMigration starting", "DRY RUN: " if dry_run else "")
    logger.info("  Bucket: %s", args.bucket)
    logger.info("  Dates: %s to %s (%s days)", dates[0], dates[-1], len(dates))
    logger.info("  Workers: %s (per date), %s (dates)", args.workers, args.date_workers)

    client = get_storage_client()

    # Process dates in parallel
    total_stats = {
        "scanned": 0,
        "needs_migration": 0,
        "migrated": 0,
        "failed": 0,
        "already_new": 0,
    }

    with ThreadPoolExecutor(max_workers=args.date_workers) as executor:
        futures = {
            executor.submit(
                migrate_date,
                client,
                args.bucket,
                date_str,
                dry_run,
                args.workers,
            ): date_str
            for date_str in dates
        }

        for future in as_completed(futures):
            stats = future.result()
            for key in total_stats:
                total_stats[key] += stats.get(key, 0)

    logger.info("")
    logger.info("=" * 60)
    logger.info("%sMIGRATION COMPLETE", "DRY RUN " if dry_run else "")
    logger.info("  Total scanned: %s", total_stats["scanned"])
    logger.info("  Already in new structure: %s", total_stats["already_new"])
    logger.info("  Needed migration: %s", total_stats["needs_migration"])
    logger.info("  %s: %s", "Would migrate" if dry_run else "Migrated", total_stats["migrated"])
    if total_stats["failed"] > 0:
        logger.info("  Failed: %s", total_stats["failed"])
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
