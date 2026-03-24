#!/usr/bin/env python3
"""
Fast GCS Reorganization Script for DEFI - Parallel moves using gsutil.
Moves files from flat structure to venue-based subfolders.

DeFi venues: UNISWAPV2-ETHEREUM, UNISWAPV3-ETHEREUM, UNISWAPV4-ETHEREUM, AAVEV3_ETHEREUM, MORPHO-ETHEREUM, LIDO, ETHERFI, ETHENA

Usage: python reorganize_gcs_defi.py [--dry-run] [--workers 20] [--start-date 2023-05-23]
"""

import argparse
import logging
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _common import get_project_id

logger = logging.getLogger(__name__)
_PROJECT_ID = get_project_id()
BUCKET = f"gs://market-data-tick-defi-{_PROJECT_ID}"
BASE_PREFIX = "raw_tick_data/by_date"

# Known DeFi venues (extracted from venues.yaml)
DEFI_VENUES = [
    "UNISWAPV2-ETHEREUM",
    "UNISWAPV3-ETHEREUM",
    "UNISWAPV4-ETHEREUM",
    "AAVEV3_ETHEREUM",
    "MORPHO-ETHEREUM",
    "LIDO",
    "ETHERFI",
    "ETHENA",
]


def log(msg):
    logger.info(
        f"[{datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S')}] {msg}",
        flush=True,
    )


def list_gcs_files(prefix):
    """List files at a GCS prefix."""
    try:
        result = subprocess.run(
            ["gsutil", "ls", f"{prefix}*.parquet"],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode == 0:
            return [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
        return []
    except (subprocess.TimeoutExpired, OSError, ValueError):
        return []


def extract_venue_from_filename(filename):
    """
    Extract venue from DeFi instrument_key.

    Examples:
    - UNISWAPV2-ETHEREUM:POOL:USDC-USDT@ETHEREUM.parquet -> UNISWAPV2-ETHEREUM
    - AAVEV3_ETHEREUM:A_TOKEN:USDC@ETHEREUM.parquet -> AAVEV3_ETHEREUM
    - LIDO:LST:stETH@ETHEREUM.parquet -> LIDO
    """
    base = filename.replace(".parquet", "")
    # Extract first part before colon
    parts = base.split(":")
    if len(parts) >= 1:
        venue = parts[0]
        # Validate it's a known venue
        if venue in DEFI_VENUES:
            return venue
    return None


def batch_move_files(move_pairs, dry_run=False, parallel_threads=20):
    """Move files in batch using parallel gsutil calls."""
    if not move_pairs:
        return 0

    def move_single(pair):
        src, dst = pair
        if dry_run:
            return True
        try:
            result = subprocess.run(
                ["gsutil", "-q", "mv", src, dst],
                capture_output=True,
                text=True,
                timeout=30,
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, OSError):
            return False

    with ThreadPoolExecutor(max_workers=parallel_threads) as executor:
        results = list(executor.map(move_single, move_pairs))
        moved = sum(1 for r in results if r)

    return moved


def process_date_folder(date_folder, dry_run=False, parallel_threads=20):
    """Process all files in a date folder using parallel batch moves."""
    date_prefix = f"{BUCKET}/{BASE_PREFIX}/{date_folder}/"

    # Get list of data_type folders
    try:
        result = subprocess.run(
            ["gsutil", "ls", date_prefix], capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            return 0
        data_type_folders = [
            f.strip() for f in result.stdout.strip().split("\n") if "data_type-" in f
        ]
    except (subprocess.TimeoutExpired, OSError, ValueError):
        return 0

    all_move_pairs = []

    for dt_folder in data_type_folders:
        # Get list of instrument_type subfolders (pool, a_token, debt_token, lst, etc.)
        try:
            result = subprocess.run(
                ["gsutil", "ls", dt_folder], capture_output=True, text=True, timeout=30
            )
            if result.returncode != 0:
                continue
            inst_type_folders = [
                f.strip() for f in result.stdout.strip().split("\n") if f.strip().endswith("/")
            ]
        except (subprocess.TimeoutExpired, OSError, ValueError) as e:
            logger.debug("Skipping item due to %s: %s", type(e).__name__, e)
            continue

        for inst_folder in inst_type_folders:
            # List files in this folder
            files = list_gcs_files(inst_folder)

            for f in files:
                filename = f.split("/")[-1]
                venue = extract_venue_from_filename(filename)

                if not venue:
                    continue

                # Skip if already in venue folder
                if f"/{venue}/" in f:
                    continue

                # New path with venue subfolder
                new_path = f"{inst_folder}{venue}/{filename}"
                all_move_pairs.append((f, new_path))

    if not all_move_pairs:
        return 0

    log(f"  Moving {len(all_move_pairs)} files with {parallel_threads} parallel threads...")
    moved = batch_move_files(all_move_pairs, dry_run, parallel_threads)
    return moved


def process_date_wrapper(args):
    """Wrapper for parallel date processing."""
    date_folder, dry_run, parallel_threads, idx, total = args
    log(f"[{idx}/{total}] {date_folder}")
    moved = process_date_folder(date_folder, dry_run, parallel_threads)
    if moved > 0:
        log(f"  ✓ Moved {moved} files in {date_folder}")
    return moved


def main():
    parser = argparse.ArgumentParser(
        description="Fast GCS reorganization for DEFI with parallel moves"
    )
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done")
    parser.add_argument(
        "--workers",
        type=int,
        default=20,
        help="Parallel file moves per folder (default: 20)",
    )
    parser.add_argument(
        "--date-workers", type=int, default=3, help="Parallel date folders (default: 3)"
    )
    parser.add_argument(
        "--cpu-cores",
        type=int,
        help="Auto-configure based on CPU cores (e.g., --cpu-cores 32)",
    )
    parser.add_argument("--start-date", type=str, help="Start from this date (YYYY-MM-DD)")
    parser.add_argument("--limit", type=int, help="Limit number of date folders")
    args = parser.parse_args()

    # Auto-configure based on CPU cores if specified
    if args.cpu_cores:
        args.date_workers = max(5, args.cpu_cores // 4)
        args.workers = max(20, args.cpu_cores)
        log(f"Auto-configured for {args.cpu_cores} CPU cores")

    log("=== Starting FAST GCS Reorganization (DEFI) ===")
    log(f"Bucket: {BUCKET}")
    log(f"File workers per folder: {args.workers}")
    log(f"Parallel date folders: {args.date_workers}")
    log(f"Total parallel operations: ~{args.workers * args.date_workers}")
    if args.dry_run:
        log("DRY RUN MODE - No files will be moved")

    # Get list of date folders
    log("Scanning date folders...")
    try:
        result = subprocess.run(
            ["gsutil", "ls", f"{BUCKET}/{BASE_PREFIX}/"],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode != 0:
            log("ERROR: Failed to list date folders")
            return 1

        date_folders = []
        for line in result.stdout.strip().split("\n"):
            if "/day-" in line or "/day=" in line:
                match = re.search(r"(day[-=]\d{4}-\d{2}-\d{2})", line)
                if match:
                    date_folders.append(match.group(1))

        date_folders = sorted(set(date_folders))
    except (OSError, ValueError, RuntimeError) as e:
        log(f"ERROR: {e}")
        return 1

    if not date_folders:
        log("No date folders found")
        return 0

    # Filter by start date if specified
    if args.start_date:
        start_folder = f"day={args.start_date}"
        date_folders = [d for d in date_folders if d >= start_folder]
        log(f"Starting from {args.start_date}")

    # Apply limit if specified
    if args.limit:
        date_folders = date_folders[: args.limit]

    log(f"Processing {len(date_folders)} date folders")

    total_moved = 0
    total = len(date_folders)

    # Process date folders in parallel batches
    with ThreadPoolExecutor(max_workers=args.date_workers) as executor:
        tasks = [
            (df, args.dry_run, args.workers, i + 1, total) for i, df in enumerate(date_folders)
        ]
        results = list(executor.map(process_date_wrapper, tasks))
        total_moved = sum(results)

    log("=== Reorganization Complete ===")
    log(f"Total files moved: {total_moved}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
