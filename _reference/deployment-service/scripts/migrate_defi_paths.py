#!/usr/bin/env python3
"""
DeFi GCS Path Migration Script

Migrates DeFi data from flat structure to proper folder/venue hierarchy.

Current (flat):
  raw_tick_data/by_date/day-{date}/data_type-{type}/{VENUE}-{INST_TYPE}-{SYMBOL}-{CHAIN}.parquet

Target (hierarchical):
  raw_tick_data/by_date/day-{date}/data_type-{type}/{folder}/{venue}/{instrument_key}.parquet

Folder standardization:
  - POOL, A_TOKEN, DEBT_TOKEN -> pool/
  - LST, YIELD_BEARING -> lst/

Deprecated data types (skipped):
  - yields (can be computed from oracle_prices)

Usage:
  # Dry run for a single date
  python scripts/migrate_defi_paths.py --date 2025-01-01 --dry-run

  # Execute migration for date range
  python scripts/migrate_defi_paths.py --start-date 2025-01-01 --end-date 2025-01-31 --execute

  # Execute with high parallelism
  python scripts/migrate_defi_paths.py --start-date 2025-01-01 --end-date 2025-01-31 --execute --workers 20
"""

import argparse
import logging
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _common import get_project_id
from unified_cloud_interface import StorageClient
from unified_trading_library import get_storage_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)
BASE_PREFIX = "raw_tick_data/by_date"

# Known DeFi venues
DEFI_VENUES = {
    "UNISWAPV2-ETHEREUM",
    "UNISWAPV3-ETHEREUM",
    "UNISWAPV4-ETHEREUM",
    "AAVEV3_ETHEREUM",
    "MORPHO-ETHEREUM",
    "LIDO",
    "ETHERFI",
    "ETHENA",
}

# Instrument type to standardized folder mapping
FOLDER_MAPPING = {
    "POOL": "pool",
    "A_TOKEN": "pool",
    "DEBT_TOKEN": "pool",
    "LST": "lst",
    "YIELD_BEARING": "lst",
}

# Deprecated data types to skip
DEPRECATED_DATA_TYPES = {"yields"}

# Valid data types for DeFi
VALID_DATA_TYPES = {
    "swaps",
    "liquidity",
    "rate_indices",
    "oracle_prices",
    "trades",  # Legacy, but might exist
}


@dataclass
class MigrationResult:
    """Result of a migration operation."""

    old_path: str
    new_path: str | None
    action: str  # "migrate", "skip_deprecated", "skip_already_correct", "skip_unknown"
    success: bool
    error: str | None = None


def parse_flat_defi_filename(filename: str) -> dict | None:
    """
    Parse flat DeFi filename to extract components.

    Format: VENUE-INST_TYPE-SYMBOL-CHAIN.parquet

    Examples:
    - AAVEV3_ETHEREUM-A_TOKEN-AUSDT-ETHEREUM.parquet
    - UNISWAPV3-ETHEREUM-POOL-WETH-USDC-500-ETHEREUM.parquet
    - LIDO-LST-STETH-ETHEREUM.parquet
    - ETHENA-YIELD_BEARING-SUSDE-ETHEREUM.parquet

    Returns dict with: venue, inst_type, symbol, chain
    """
    if not filename.endswith(".parquet"):
        return None

    base = filename[:-8]  # Remove .parquet

    # Try to match known venues at the start
    venue = None
    rest = None

    for v in sorted(DEFI_VENUES, key=len, reverse=True):  # Try longest first
        if base.startswith(v + "-"):
            venue = v
            rest = base[len(v) + 1 :]
            break

    if not venue:
        return None

    # Split rest to find instrument type
    parts = rest.split("-")
    if len(parts) < 2:
        return None

    # Find instrument type (POOL, A_TOKEN, DEBT_TOKEN, LST, YIELD_BEARING)
    inst_type = None
    symbol_start_idx = 0

    # Check for compound instrument types first (A_TOKEN, DEBT_TOKEN, YIELD_BEARING)
    if len(parts) >= 2 and parts[0] + "_" + parts[1] in FOLDER_MAPPING:
        inst_type = parts[0] + "_" + parts[1]
        symbol_start_idx = 2
    elif parts[0] in FOLDER_MAPPING:
        inst_type = parts[0]
        symbol_start_idx = 1
    else:
        # Unknown instrument type
        return None

    # Rest is symbol (may include chain at the end)
    remaining = parts[symbol_start_idx:]
    if not remaining:
        return None

    # Last part is typically chain (ETHEREUM)
    chain = (
        remaining[-1]
        if remaining[-1] in ("ETHEREUM", "ARBITRUM", "OPTIMISM", "BASE", "POLYGON")
        else "ETHEREUM"
    )

    # Symbol is everything between inst_type and chain
    symbol = (
        "-".join(remaining[:-1])
        if remaining[-1] == chain and len(remaining) > 1
        else "-".join(remaining)
    )

    return {
        "venue": venue,
        "inst_type": inst_type,
        "symbol": symbol,
        "chain": chain,
        "original_filename": filename,
    }


def get_standardized_folder(inst_type: str) -> str:
    """Get standardized folder for instrument type."""
    return FOLDER_MAPPING.get(inst_type, "unknown")


def build_new_path(old_path: str, parsed: dict) -> str:
    """
    Build new hierarchical path from parsed components.

    Old: .../data_type-{type}/{flat_file}.parquet
    New: .../data_type-{type}/{folder}/{venue}/{instrument_key}.parquet
    """
    # Extract data_type from path
    parts = old_path.split("/")

    # Find data_type part
    data_type_part = None
    date_part = None
    for _i, p in enumerate(parts):
        if p.startswith("data_type-"):
            data_type_part = p
        if p.startswith("day-"):
            date_part = p

    if not data_type_part or not date_part:
        return old_path  # Can't parse, return as-is

    folder = get_standardized_folder(parsed["inst_type"])
    venue = parsed["venue"]

    # Build new instrument key in standard format
    # VENUE:INST_TYPE:SYMBOL@CHAIN (matches CeFi format)
    instrument_key = f"{venue}:{parsed['inst_type']}:{parsed['symbol']}@{parsed['chain']}.parquet"

    # Build new path
    new_path = f"{BASE_PREFIX}/{date_part}/{data_type_part}/{folder}/{venue}/{instrument_key}"

    return new_path


def is_already_in_folder_structure(blob_name: str) -> bool:
    """Check if blob is already in the new folder/venue structure."""
    parts = blob_name.split("/")

    # Expected structure: .../data_type-{type}/{folder}/{venue}/{file}.parquet
    # So after data_type-X we should have folder, venue, then file

    for i, part in enumerate(parts):
        if part.startswith("data_type-"):
            # Check if next parts are folder and venue
            remaining = parts[i + 1 :]
            if len(remaining) >= 3:
                # folder/venue/file structure
                folder = remaining[0]
                potential_venue = remaining[1]
                if folder in ("pool", "lst") and potential_venue in DEFI_VENUES:
                    return True

    return False


def migrate_blob(
    client: StorageClient,
    bucket_name: str,
    old_path: str,
    new_path: str,
    dry_run: bool = True,
) -> MigrationResult:
    """Migrate a single blob from old to new path."""
    if dry_run:
        return MigrationResult(old_path, new_path, "migrate", True)

    try:
        bucket = client.bucket(bucket_name)
        source_blob = bucket.blob(old_path)

        # Check if source exists
        if not source_blob.exists():
            return MigrationResult(
                old_path, new_path, "skip_not_found", False, "Source blob not found"
            )

        # Check if destination already exists
        dest_blob = bucket.blob(new_path)
        if dest_blob.exists():
            # Delete source since dest already exists
            client.delete_blob(bucket_name, old_path)
            return MigrationResult(old_path, new_path, "skip_duplicate", True)

        # Copy to new location
        bucket.copy_blob(source_blob, bucket, new_path)

        # Delete old blob via client-level delete
        client.delete_blob(bucket_name, old_path)

        return MigrationResult(old_path, new_path, "migrate", True)
    except (OSError, ValueError, RuntimeError) as e:
        return MigrationResult(old_path, new_path, "migrate", False, str(e))


def process_date(
    client: StorageClient,
    bucket_name: str,
    date_str: str,
    dry_run: bool = True,
    workers: int = 8,
) -> dict:
    """Process all DeFi files for a single date."""
    bucket = client.bucket(bucket_name)
    prefix = f"{BASE_PREFIX}/day-{date_str}/"

    stats = {
        "date": date_str,
        "scanned": 0,
        "to_migrate": 0,
        "migrated": 0,
        "skipped_deprecated": 0,
        "skipped_already_correct": 0,
        "skipped_unknown": 0,
        "failed": 0,
    }

    migrations = []

    logger.info("Scanning %s...", date_str)

    for blob in bucket.list_blobs(prefix=prefix):
        stats["scanned"] += 1

        # Skip directories
        if blob.name.endswith("/"):
            continue

        # Skip non-parquet files
        if not blob.name.endswith(".parquet"):
            continue

        # Check if in deprecated data type
        for dt in DEPRECATED_DATA_TYPES:
            if f"/data_type-{dt}/" in blob.name:
                stats["skipped_deprecated"] += 1
                continue

        # Check if already in correct structure
        if is_already_in_folder_structure(blob.name):
            stats["skipped_already_correct"] += 1
            continue

        # Try to parse the filename
        filename = blob.name.split("/")[-1]
        parsed = parse_flat_defi_filename(filename)

        if not parsed:
            stats["skipped_unknown"] += 1
            continue

        # Build new path
        new_path = build_new_path(blob.name, parsed)

        if new_path != blob.name:
            migrations.append((blob.name, new_path))
            stats["to_migrate"] += 1

    if not migrations:
        logger.info("  %s: No files need migration (scanned %s)", date_str, stats["scanned"])
        return stats

    logger.info("  %s: %s files to migrate", date_str, stats["to_migrate"])

    if dry_run:
        # Show sample of what would be migrated
        for old_path, new_path in migrations[:3]:
            logger.info("    Would migrate: %s", old_path.split("/")[-1])
            logger.info("              to: %s", "/".join(new_path.split("/")[-3:]))
        if len(migrations) > 3:
            logger.info("    ... and %s more", len(migrations) - 3)
        stats["migrated"] = stats["to_migrate"]
        return stats

    # Execute migration in parallel
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(migrate_blob, client, bucket_name, old, new, False): (old, new)
            for old, new in migrations
        }

        for future in as_completed(futures):
            result = future.result()
            if result.success:
                stats["migrated"] += 1
            else:
                stats["failed"] += 1
                if result.error:
                    logger.error("    Failed: %s: %s", result.old_path, result.error)

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
        description="Migrate DeFi GCS data from flat structure to folder/venue hierarchy"
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
        default=20,
        help="Number of parallel workers for blob operations (default: 20)",
    )
    parser.add_argument(
        "--date-workers",
        type=int,
        default=4,
        help="Number of parallel workers for date processing (default: 4)",
    )
    parser.add_argument(
        "--bucket",
        default=None,
        help="GCS bucket name (defaults to market-data-tick-defi-{GCP_PROJECT_ID})",
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
    project_id = get_project_id()
    bucket_name = args.bucket or f"market-data-tick-defi-{project_id}"

    logger.info("=" * 60)
    logger.info("DeFi GCS Migration %s", "(DRY RUN)" if dry_run else "")
    logger.info("=" * 60)
    logger.info("  Bucket: %s", bucket_name)
    logger.info("  Dates: %s to %s (%s days)", dates[0], dates[-1], len(dates))
    logger.info("  Workers: %s (per date), %s (dates)", args.workers, args.date_workers)
    logger.info("  Folder mapping: A_TOKEN/DEBT_TOKEN/POOL -> pool/, LST/YIELD_BEARING -> lst/")
    logger.info("  Deprecated (skipped): %s", DEPRECATED_DATA_TYPES)
    logger.info("")

    client = get_storage_client()

    # Process dates
    total_stats = {
        "scanned": 0,
        "to_migrate": 0,
        "migrated": 0,
        "skipped_deprecated": 0,
        "skipped_already_correct": 0,
        "skipped_unknown": 0,
        "failed": 0,
    }

    with ThreadPoolExecutor(max_workers=args.date_workers) as executor:
        futures = {
            executor.submit(
                process_date,
                client,
                bucket_name,
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
    logger.info("MIGRATION %sCOMPLETE", "(DRY RUN) " if dry_run else "")
    logger.info("=" * 60)
    logger.info("  Total scanned:          %s", total_stats["scanned"])
    logger.info("  Already correct:        %s", total_stats["skipped_already_correct"])
    logger.info("  Skipped (deprecated):   %s", total_stats["skipped_deprecated"])
    logger.info("  Skipped (unknown):      %s", total_stats["skipped_unknown"])
    logger.info(
        "  %s:       %s", "Would migrate" if dry_run else "Migrated", total_stats["migrated"]
    )
    if total_stats["failed"] > 0:
        logger.info("  Failed:                 %s", total_stats["failed"])
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
