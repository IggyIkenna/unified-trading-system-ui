#!/usr/bin/env python3
"""
High-Performance Instrument Definitions Download Script

Downloads all instrument definition parquet files from GCS (CEFI, TRADFI, DEFI)
using Google's transfer_manager API with parallel processing.

Smart Date Detection:
  - Automatically detects the last aggregated instrument file date from GCS
  - Downloads only new data from (last_date + 1) to T-1 (yesterday)
  - Prompts user to confirm before downloading
  - Use --yes to skip confirmation prompt

Environment-aware worker scaling:
  - development (default): 1x multiplier (CPU*2 download, CPU list)
  - production: 4x multiplier (CPU*8 download, CPU*4 list)

Usage:
    # Auto-detect date range and prompt for confirmation
    python scripts/download_instruments.py --auto

    # Auto-detect with no prompt (for scripts/automation)
    python scripts/download_instruments.py --auto --yes

    # Full download with auto-tuned workers
    python scripts/download_instruments.py

    # Dry-run to see file count
    python scripts/download_instruments.py --dry-run

    # Download specific category
    python scripts/download_instruments.py --category CEFI

    # Test with limited date range
    python scripts/download_instruments.py --start-date 2026-01-01 --end-date 2026-01-07

    # Download and aggregate at the end
    python scripts/download_instruments.py --aggregate

    # Aggregate only (no download) - use existing local data
    python scripts/download_instruments.py --aggregate-only

    # Aggregate only and upload to GCS
    python scripts/download_instruments.py --aggregate-only --upload-to-gcs

    # Production mode (4x workers) on Windows VM
    set DEPLOYMENT_ENV=production
    python scripts/download_instruments.py
"""

import argparse
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Optional

import polars as pl
from unified_cloud_interface import StorageClient, get_storage_client

sys.path.insert(0, str(Path(__file__).parent))
import logging

from _common import get_project_id

from deployment_service.deployment_config import DeploymentConfig

logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

_PROJECT_ID = get_project_id()
BUCKETS = {
    "CEFI": f"instruments-store-cefi-{_PROJECT_ID}",
    "TRADFI": f"instruments-store-tradfi-{_PROJECT_ID}",
    "DEFI": f"instruments-store-defi-{_PROJECT_ID}",
}
PREFIX = "instrument_availability/by_date"
AGGREGATED_PREFIX = "aggregated"

# Environment detection (same pattern as deployment/state.py)
_dl_config = DeploymentConfig()
DEPLOYMENT_ENV = _dl_config.deployment_env
IS_PRODUCTION = DEPLOYMENT_ENV == "production"

# Environment multiplier: 4x workers in production
ENV_MULTIPLIER = 4 if IS_PRODUCTION else 1

# Base workers (auto-tuned to CPU)
CPU_COUNT = os.cpu_count() or 4
BASE_DOWNLOAD_WORKERS = CPU_COUNT * 2
BASE_LIST_WORKERS = CPU_COUNT

# Apply environment multiplier with caps
_computed_download = min(64 if IS_PRODUCTION else 16, BASE_DOWNLOAD_WORKERS * ENV_MULTIPLIER)
_computed_list = min(32 if IS_PRODUCTION else 8, BASE_LIST_WORKERS * ENV_MULTIPLIER)
DEFAULT_DOWNLOAD_WORKERS = int(_dl_config.instrument_download_workers or _computed_download)
DEFAULT_LIST_WORKERS = int(_dl_config.instrument_list_workers or _computed_list)


def log(msg: str) -> None:
    """Print timestamped log message."""
    logger.info(
        f"[{datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S')}] {msg}",
        flush=True,
    )


def get_last_aggregated_date(categories: list[str] | None = None) -> date | None:
    """
    Detect the most recent aggregated instrument file date from GCS.

    Scans the aggregated/ prefix in each category bucket for files matching:
    aggregated_instruments_YYYY-MM-DD.parquet

    Returns the most recent date found across all categories, or None if no files exist.
    """
    categories = categories or list(BUCKETS.keys())
    client = get_storage_client()
    latest_date: date | None = None

    log("Detecting last aggregated instrument date from GCS...")

    for category in categories:
        if category not in BUCKETS:
            continue

        bucket_name = BUCKETS[category]
        bucket = client.bucket(bucket_name)

        try:
            blobs = list(bucket.list_blobs(prefix=AGGREGATED_PREFIX))
            for blob in blobs:
                # Match: aggregated/aggregated_instruments_2026-02-04.parquet
                match = re.search(r"aggregated_instruments_(\d{4}-\d{2}-\d{2})\.parquet", blob.name)
                if match:
                    blob_date = (
                        datetime.strptime(match.group(1), "%Y-%m-%d").replace(tzinfo=UTC).date()
                    )
                    if latest_date is None or blob_date > latest_date:
                        latest_date = blob_date
                        log(f"  {category}: Found aggregated file dated {blob_date}")
        except (OSError, PermissionError) as e:
            log(f"  Warning: Failed to check aggregated files: {e}")

    if latest_date:
        log(f"Last aggregated date: {latest_date}")
    else:
        log("No existing aggregated files found")

    return latest_date


def prompt_date_range_confirmation(
    start_date: date, end_date: date, skip_prompt: bool = False
) -> bool:
    """
    Prompt user to confirm the date range for downloading instrument definitions.

    Args:
        start_date: First date to download (day after last aggregated)
        end_date: Last date to download (T-1, yesterday)
        skip_prompt: If True, skip the prompt and return True

    Returns:
        True if user confirms (or skip_prompt=True), False otherwise
    """
    if skip_prompt:
        return True

    days_count = (end_date - start_date).days + 1

    logger.info()
    logger.info("=" * 60)
    logger.info("INSTRUMENT DEFINITIONS DOWNLOAD")
    logger.info("=" * 60)
    logger.info()
    logger.info(f"  Last aggregated date:  {start_date - timedelta(days=1)}")
    logger.info(f"  Download range:        {start_date} to {end_date}")
    logger.info(f"  Days to download:      {days_count}")
    logger.info()
    logger.info("NOTE: Instrument definitions must be generated before they can be")
    logger.info("      downloaded and aggregated. If definitions for these dates")
    logger.info("      don't exist, the download will find no files.")
    logger.info()

    try:
        response = input("Proceed with download? [Y/n]: ").strip().lower()
        return response in ("", "y", "yes")
    except (EOFError, KeyboardInterrupt):
        logger.info()
        return False


class InstrumentDownloader:
    """High-performance downloader for instrument definitions from GCS."""

    def __init__(
        self,
        download_workers: int = DEFAULT_DOWNLOAD_WORKERS,
        list_workers: int = DEFAULT_LIST_WORKERS,
        categories: list[str] | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ):
        self.download_workers = download_workers
        self.list_workers = list_workers
        self.categories = categories or list(BUCKETS.keys())
        self.start_date = start_date
        self.end_date = end_date
        self._clients: dict[str, StorageClient] = {}
        self._buckets: dict[str, object] = {}

    def warmup_connections(self) -> None:
        """Pre-create GCS clients for each bucket (connection warmup)."""
        log(f"Warming up connections to {len(self.categories)} buckets...")
        for category in self.categories:
            if category not in BUCKETS:
                log(f"  WARNING: Unknown category '{category}', skipping")
                continue
            bucket_name = BUCKETS[category]
            self._clients[category] = get_storage_client()
            self._buckets[category] = self._clients[category].bucket(bucket_name)
            # Warmup: make a small request to establish connection
            try:
                list(self._buckets[category].list_blobs(prefix=PREFIX, max_results=1))
                log(f"  {category}: Connected to {bucket_name}")
            except (OSError, ValueError, RuntimeError) as e:
                log(f"  {category}: WARNING - Connection test failed: {e}")

    def _filter_by_date(self, blob_name: str) -> bool:
        """Filter blob by date range if specified."""
        # Extract date from path like: instrument_availability/by_date/day-2024-01-15/...
        match = re.search(r"day-(\d{4}-\d{2}-\d{2})", blob_name)
        if not match:
            return True  # Include if no date found

        blob_date = match.group(1)

        if self.start_date and blob_date < self.start_date:
            return False
        if self.end_date and blob_date > self.end_date:
            return False

        return True

    def list_all_blobs_parallel(self) -> dict[str, list[str]]:
        """List blobs from all buckets in parallel using ThreadPoolExecutor."""
        log(
            f"Listing blobs from {len(self.categories)} buckets with {self.list_workers} workers..."
        )

        def list_bucket_blobs(category: str) -> tuple[str, list[str]]:
            if category not in self._buckets:
                return category, []

            bucket = self._buckets[category]
            try:
                blobs = list(bucket.list_blobs(prefix=PREFIX))
                blob_names = [
                    b.name
                    for b in blobs
                    if b.name.endswith(".parquet") and self._filter_by_date(b.name)
                ]
                log(f"  {category}: Found {len(blob_names)} parquet files")
                return category, blob_names
            except (OSError, ValueError, RuntimeError) as e:
                log(f"  {category}: ERROR listing blobs: {e}")
                return category, []

        with ThreadPoolExecutor(max_workers=self.list_workers) as executor:
            results = dict(executor.map(list_bucket_blobs, self.categories))

        total_files = sum(len(files) for files in results.values())
        log(f"Total files to download: {total_files}")
        return results

    def download_all_parallel(
        self,
        blob_map: dict[str, list[str]],
        dest_dir: str,
        skip_existing: bool = False,
    ) -> dict[str, dict]:
        """Download all blobs in parallel using UCI StorageClient (ThreadPoolExecutor)."""
        stats = {"total": 0, "success": 0, "failed": 0, "skipped": 0}
        dest_path = Path(dest_dir)

        for category, blob_names in blob_map.items():
            if not blob_names:
                log(f"  {category}: No files to download")
                continue

            if category not in self._buckets:
                log(f"  {category}: WARNING - No bucket connection, skipping")
                continue

            bucket = self._buckets[category]
            category_dest = dest_path / category
            category_dest.mkdir(parents=True, exist_ok=True)

            # Filter out existing files if skip_existing is enabled
            if skip_existing:
                original_count = len(blob_names)
                blob_names = [name for name in blob_names if not (category_dest / name).exists()]
                skipped = original_count - len(blob_names)
                stats["skipped"] += skipped
                if skipped > 0:
                    log(f"  {category}: Skipping {skipped} existing files")

            if not blob_names:
                log(f"  {category}: All files already exist")
                continue

            stats["total"] += len(blob_names)
            log(
                f"  {category}: Downloading {len(blob_names)} files with {self.download_workers} workers..."
            )

            def _download_one(args: tuple[str, object, Path]) -> Exception | None:
                """Download a single blob to its local destination path."""
                blob_name, _bkt, _dest = args
                dest_file = _dest / blob_name
                dest_file.parent.mkdir(parents=True, exist_ok=True)
                try:
                    blob = _bkt.blob(blob_name)
                    blob.download_to_filename(str(dest_file))
                    return None
                except (OSError, ValueError, RuntimeError) as exc:
                    return exc

            try:
                work_items = [(name, bucket, category_dest) for name in blob_names]
                with ThreadPoolExecutor(max_workers=self.download_workers) as executor:
                    download_results = list(executor.map(_download_one, work_items))

                # Process results
                for name, result in zip(blob_names, download_results):
                    if isinstance(result, Exception):
                        log(f"    FAILED: {name} - {result}")
                        stats["failed"] += 1
                    else:
                        stats["success"] += 1

                log(f"  {category}: Downloaded {stats['success']} files")

            except (OSError, ValueError, RuntimeError) as e:
                log(f"  {category}: ERROR during download: {e}")
                stats["failed"] += len(blob_names)

        return stats


class InstrumentAggregator:
    """Aggregates instrument parquet files per category using Polars."""

    def __init__(self, input_dir: str, categories: list[str] | None = None):
        self.input_dir = Path(input_dir)
        self.categories = categories or list(BUCKETS.keys())

    def find_parquet_files(self, category: str) -> list[Path]:
        """Find all parquet files for a category."""
        category_path = self.input_dir / category
        if not category_path.exists():
            return []
        return list(category_path.rglob("*.parquet"))

    def aggregate_category(self, category: str) -> Optional["pl.DataFrame"]:
        """Aggregate all parquet files for a single category."""
        parquet_files = self.find_parquet_files(category)
        if not parquet_files:
            log(f"  {category}: No parquet files found")
            return None

        log(f"  {category}: Found {len(parquet_files)} parquet files")

        # Lazy scan all files
        lazy_frames = []
        for f in parquet_files:
            try:
                lf = pl.scan_parquet(f)
                lazy_frames.append(lf)
            except (OSError, ValueError, RuntimeError) as e:
                log(f"    WARNING: Could not scan {f.name}: {e}")

        if not lazy_frames:
            log(f"  {category}: No valid parquet files could be scanned")
            return None

        # Concatenate with diagonal_relaxed to handle schema mismatches
        # This allows columns with different types (e.g., Null vs Float64) to be merged
        combined = pl.concat(lazy_frames, how="diagonal_relaxed")

        # Determine dedup column
        sample_schema = lazy_frames[0].collect_schema()
        dedup_col = "instrument_key" if "instrument_key" in sample_schema else "instrument_id"
        timestamp_col = "timestamp" if "timestamp" in sample_schema else None

        # Deduplicate: keep latest by timestamp for each instrument_key
        if timestamp_col:
            deduped = (
                combined.sort(timestamp_col, descending=True)
                .group_by(dedup_col)
                .agg(pl.all().first())
            )
        else:
            deduped = combined.group_by(dedup_col).agg(pl.all().first())

        # Collect
        result = deduped.collect()
        log(f"  {category}: Aggregated to {len(result)} unique instruments")
        return result

    def aggregate_all(
        self,
        output_dir: str | None = None,
        upload_to_gcs: bool = False,
    ) -> dict[str, Path]:
        """Aggregate all categories and optionally upload to GCS."""
        today = date.today().isoformat()
        output_path = Path(output_dir) if output_dir else self.input_dir.parent
        output_path.mkdir(parents=True, exist_ok=True)

        results = {}
        gcs_client = None

        if upload_to_gcs:
            gcs_client = get_storage_client()

        for category in self.categories:
            log(f"\nAggregating {category}...")
            df = self.aggregate_category(category)

            if df is None or len(df) == 0:
                continue

            # Write local file
            local_file = output_path / f"aggregated_instruments_{category}_{today}.parquet"
            df.write_parquet(local_file)
            file_size_mb = local_file.stat().st_size / (1024 * 1024)
            log(f"  {category}: Wrote {local_file} ({file_size_mb:.2f} MB)")
            results[category] = local_file

            # Upload to GCS if requested
            if upload_to_gcs and gcs_client:
                bucket_name = BUCKETS[category]
                gcs_path = f"aggregated/aggregated_instruments_{today}.parquet"
                try:
                    bucket = gcs_client.bucket(bucket_name)
                    blob = bucket.blob(gcs_path)
                    blob.upload_from_filename(str(local_file))
                    log(f"  {category}: Uploaded to gs://{bucket_name}/{gcs_path}")
                except (OSError, ValueError, RuntimeError) as e:
                    log(f"  Warning: Failed to upload {category}: {e}")

        return results


def main() -> int:
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(
        description="Download instrument definitions from GCS",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Environment Variables:
  DEPLOYMENT_ENV              Set to 'production' for 4x worker scaling
  INSTRUMENT_DOWNLOAD_WORKERS Override auto-tuned download workers
  INSTRUMENT_LIST_WORKERS     Override auto-tuned list workers

Examples:
  # RECOMMENDED: Auto-detect date range from last aggregated file
  python scripts/download_instruments.py --auto --aggregate --upload-to-gcs

  # Auto-detect with no prompt (for automation/scripts)
  python scripts/download_instruments.py --auto --yes --aggregate --upload-to-gcs

  # Full download (all dates)
  python scripts/download_instruments.py

  # Production mode on Windows VM
  set DEPLOYMENT_ENV=production
  python scripts/download_instruments.py --auto --aggregate --upload-to-gcs

  # Test with one week of data
  python scripts/download_instruments.py --start-date 2026-01-01 --end-date 2026-01-07

  # Download and aggregate at the end
  python scripts/download_instruments.py --aggregate

  # Download, aggregate, and upload to GCS
  python scripts/download_instruments.py --aggregate --upload-to-gcs

  # Aggregate only (no download) - use existing local data
  python scripts/download_instruments.py --aggregate-only

  # Aggregate only and upload to GCS (one file per category)
  python scripts/download_instruments.py --aggregate-only --upload-to-gcs
        """,
    )
    parser.add_argument(
        "--download-workers",
        type=int,
        default=DEFAULT_DOWNLOAD_WORKERS,
        help=f"Parallel download workers (default: {DEFAULT_DOWNLOAD_WORKERS})",
    )
    parser.add_argument(
        "--list-workers",
        type=int,
        default=DEFAULT_LIST_WORKERS,
        help=f"Parallel listing workers (default: {DEFAULT_LIST_WORKERS})",
    )
    parser.add_argument(
        "--category",
        type=str,
        choices=["CEFI", "TRADFI", "DEFI"],
        action="append",
        help="Filter to specific category (can be repeated)",
    )
    parser.add_argument(
        "--start-date",
        type=str,
        help="Filter dates >= this (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--end-date",
        type=str,
        help="Filter dates <= this (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="data/instruments_raw",
        help="Local destination directory (default: data/instruments_raw)",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip files that already exist locally",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List files without downloading",
    )

    # Aggregation options
    parser.add_argument(
        "--aggregate",
        action="store_true",
        help="Aggregate downloaded data after download completes",
    )
    parser.add_argument(
        "--aggregate-only",
        action="store_true",
        help="Only aggregate existing local data (skip download)",
    )
    parser.add_argument(
        "--upload-to-gcs",
        action="store_true",
        help="Upload aggregated files to GCS (one per category in same bucket)",
    )
    parser.add_argument(
        "--aggregate-output-dir",
        type=str,
        default=None,
        help="Output directory for aggregated files (default: data/)",
    )

    # Auto date detection options
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Auto-detect date range from last aggregated file (downloads from last+1 to T-1)",
    )
    parser.add_argument(
        "--yes",
        "-y",
        action="store_true",
        help="Skip confirmation prompt (use with --auto for automation)",
    )

    args = parser.parse_args()

    # Validate args
    if args.aggregate_only and args.dry_run:
        log("ERROR: Cannot use --aggregate-only with --dry-run")
        return 1

    if args.auto and (args.start_date or args.end_date):
        log("ERROR: Cannot use --auto with --start-date or --end-date")
        return 1

    # Auto date detection mode
    if args.auto and not args.aggregate_only:
        last_date = get_last_aggregated_date(args.category)

        if last_date is None:
            log("ERROR: No existing aggregated files found. Cannot use --auto mode.")
            log("       Run without --auto and specify --start-date manually for initial backfill.")
            return 1

        # Start from day after last aggregated, end at T-1 (yesterday)
        auto_start = last_date + timedelta(days=1)
        auto_end = date.today() - timedelta(days=1)

        if auto_start > auto_end:
            log(f"Already up to date! Last aggregated: {last_date}, today: {date.today()}")
            log("No new instrument definitions to download.")
            return 0

        # Prompt user for confirmation
        if not prompt_date_range_confirmation(auto_start, auto_end, skip_prompt=args.yes):
            log("Download cancelled by user.")
            return 0

        # Set the date range
        args.start_date = auto_start.isoformat()
        args.end_date = auto_end.isoformat()
        log(f"Auto-detected date range: {args.start_date} to {args.end_date}")

    # Print configuration
    log("=" * 60)
    if args.aggregate_only:
        log("INSTRUMENT DEFINITIONS AGGREGATOR (aggregate-only mode)")
    else:
        log("INSTRUMENT DEFINITIONS DOWNLOADER")
    log("=" * 60)
    log(f"Environment: {DEPLOYMENT_ENV} ({'4x workers' if IS_PRODUCTION else '1x workers'})")
    log(f"CPU cores: {CPU_COUNT}")
    if not args.aggregate_only:
        log(f"Download workers: {args.download_workers}")
        log(f"List workers: {args.list_workers}")
    log(f"Categories: {args.category or 'ALL'}")
    if not args.aggregate_only:
        log(f"Date range: {args.start_date or 'beginning'} to {args.end_date or 'now'}")
    log(f"Data directory: {args.output_dir}")
    if not args.aggregate_only:
        log(f"Skip existing: {args.skip_existing}")
        log(f"Dry run: {args.dry_run}")
    log(f"Aggregate: {args.aggregate or args.aggregate_only}")
    log(f"Upload to GCS: {args.upload_to_gcs}")
    log("=" * 60)

    # Aggregate-only mode: skip download, just aggregate existing data
    if args.aggregate_only:
        log("\n[AGGREGATE-ONLY MODE] Using existing local data...")
        aggregator = InstrumentAggregator(
            input_dir=args.output_dir,
            categories=args.category,
        )

        log("\n[PHASE 1] Aggregating local parquet files...")
        agg_output = args.aggregate_output_dir or str(Path(args.output_dir).parent)
        results = aggregator.aggregate_all(
            output_dir=agg_output,
            upload_to_gcs=args.upload_to_gcs,
        )

        # Summary
        log("\n" + "=" * 60)
        log("AGGREGATION COMPLETE")
        log("=" * 60)
        for category, path in results.items():
            log(f"  {category}: {path}")

        return 0

    # Normal download mode
    downloader = InstrumentDownloader(
        download_workers=args.download_workers,
        list_workers=args.list_workers,
        categories=args.category,
        start_date=args.start_date,
        end_date=args.end_date,
    )

    # Phase 1: Warmup connections
    log("\n[PHASE 1] Warming up GCS connections...")
    downloader.warmup_connections()

    # Phase 2: List all blobs
    log("\n[PHASE 2] Listing blobs from GCS...")
    blob_map = downloader.list_all_blobs_parallel()

    total_files = sum(len(files) for files in blob_map.values())
    if total_files == 0:
        log("\nNo files found matching criteria. Exiting.")
        return 0

    # Dry run: just show file count
    if args.dry_run:
        log("\n[DRY RUN] Would download:")
        for category, blobs in blob_map.items():
            log(f"  {category}: {len(blobs)} files")
            if blobs:
                log(f"    First: {blobs[0]}")
                log(f"    Last:  {blobs[-1]}")
        log(f"\nTotal: {total_files} files")
        return 0

    # Phase 3: Download all files
    log("\n[PHASE 3] Downloading files...")
    stats = downloader.download_all_parallel(
        blob_map,
        args.output_dir,
        skip_existing=args.skip_existing,
    )

    # Summary
    log("\n" + "=" * 60)
    log("DOWNLOAD COMPLETE")
    log("=" * 60)
    log(f"Total files: {stats['total']}")
    log(f"Successful:  {stats['success']}")
    log(f"Failed:      {stats['failed']}")
    log(f"Skipped:     {stats['skipped']}")
    log(f"Output:      {args.output_dir}")

    # Aggregate after download if requested
    if args.aggregate:
        log("\n[PHASE 4] Aggregating downloaded data...")
        aggregator = InstrumentAggregator(
            input_dir=args.output_dir,
            categories=args.category,
        )
        agg_output = args.aggregate_output_dir or str(Path(args.output_dir).parent)
        results = aggregator.aggregate_all(
            output_dir=agg_output,
            upload_to_gcs=args.upload_to_gcs,
        )

        log("\n" + "=" * 60)
        log("AGGREGATION COMPLETE")
        log("=" * 60)
        for category, path in results.items():
            log(f"  {category}: {path}")

    return 0 if stats["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
