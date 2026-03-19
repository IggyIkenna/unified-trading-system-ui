#!/usr/bin/env python3
"""
Fast GCS Reorganization Script - Uses gsutil -m for parallel batch moves.
Moves files from flat structure to venue-based subfolders.

Usage: python reorganize_gcs_fast.py [--dry-run] [--workers 20] [--start-date 2023-05-11]
"""

import argparse
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import logging

from _common import get_project_id

logger = logging.getLogger(__name__)

_PROJECT_ID = get_project_id()
BUCKET = f"gs://market-data-tick-tradfi-{_PROJECT_ID}"
BASE_PREFIX = "raw_tick_data/by_date"

# Mapping of futures underlyings to venues
FUTURES_VENUE_MAP = {
    # CME Index Futures
    "ES": "CME",
    "NQ": "CME",
    "RTY": "CME",
    "YM": "CME",
    "MES": "CME",
    "MNQ": "CME",
    "M2K": "CME",
    "MYM": "CME",
    "DOW": "CME",
    "SPX": "CME",
    "NDX": "CME",
    "RUSSELL": "CME",
    # CME Metals
    "GC": "CME",
    "SI": "CME",
    "HG": "CME",
    "PL": "CME",
    "PA": "CME",
    "GOLD": "CME",
    "SILVER": "CME",
    "COPPER": "CME",
    "PLATINUM": "CME",
    "PALLADIUM": "CME",
    # CME Energy
    "CL": "CME",
    "NG": "CME",
    "RB": "CME",
    "HO": "CME",
    "CRUDE": "CME",
    "NATGAS": "CME",
    "GASOLINE": "CME",
    "HEATINGOIL": "CME",
    # CME Interest Rates
    "ZB": "CME",
    "ZN": "CME",
    "ZF": "CME",
    "ZT": "CME",
    "ZQ": "CME",
    "SR3": "CME",
    "GE": "CME",
    # CME Ags
    "ZC": "CME",
    "ZS": "CME",
    "ZW": "CME",
    "ZM": "CME",
    "ZL": "CME",
    "CORN": "CME",
    "SOYBEAN": "CME",
    "WHEAT": "CME",
    "SOYMEAL": "CME",
    "SOYOIL": "CME",
    # CME Livestock
    "LE": "CME",
    "HE": "CME",
    "GF": "CME",
    # CME FX
    "6A": "CME",
    "6B": "CME",
    "6C": "CME",
    "6E": "CME",
    "6J": "CME",
    "6M": "CME",
    "6N": "CME",
    "6S": "CME",
    "AUD": "CME",
    "GBP": "CME",
    "CAD": "CME",
    "EUR": "CME",
    "JPY": "CME",
    "MXN": "CME",
    "NZD": "CME",
    "CHF": "CME",
    "BRL": "CME",
    # ICE Products
    "BRENT": "ICE",
    "GASOIL": "ICE",
    "CC": "ICE",
    "KC": "ICE",
    "CT": "ICE",
    "SB": "ICE",
    "OJ": "ICE",
    "COCOA": "ICE",
    "COFFEE": "ICE",
    "COTTON": "ICE",
    "SUGAR": "ICE",
    "ORANGEJUICE": "ICE",
    "DOLLARINDEX": "ICE",
    "DX": "ICE",
    # CBOE
    "VIX": "CBOE",
    "VX": "CBOE",
}

# Options venue mapping (most equity options are CBOE)
OPTIONS_VENUE_MAP = {
    "SPX": "CBOE",
    "SPY": "CBOE",
    "QQQ": "CBOE",
    "IWM": "CBOE",
    "DIA": "CBOE",
    "VIX": "CBOE",
    "ES": "CME",
    "NQ": "CME",
    "CL": "CME",
    "GC": "CME",
    "ZB": "CME",
    "ZN": "CME",
}


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
    """Extract venue from instrument_key like NYSE:EQUITY:AAPL-USD."""
    base = filename.replace(".parquet", "")
    parts = base.split(":")
    if len(parts) >= 1:
        return parts[0]
    return None


def get_futures_venue(underlying):
    """Get venue for a futures underlying."""
    return FUTURES_VENUE_MAP.get(underlying.upper(), "CME")


def get_options_venue(underlying):
    """Get venue for an options underlying."""
    return OPTIONS_VENUE_MAP.get(underlying.upper(), "CBOE")


def batch_move_files(move_pairs, dry_run=False, parallel_threads=10):
    """
    Move files in batch using gsutil -m for maximum parallelism.
    move_pairs: list of (src, dst) tuples
    """
    if not move_pairs:
        return 0

    # Group by destination directory to minimize operations
    # Use a temp file with source/dest pairs for gsutil
    moved = 0

    # gsutil -m doesn't support direct src->dst mapping, so we do parallel individual moves
    # But we can use ThreadPoolExecutor with more threads
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
        # Process equities
        equities_prefix = f"{dt_folder}equities/"
        equity_files = list_gcs_files(equities_prefix)
        for f in equity_files:
            filename = f.split("/")[-1]
            venue = extract_venue_from_filename(filename)
            if venue and ":" in filename:
                new_path = f"{equities_prefix}{venue}/{filename}"
                if f != new_path and f"/{venue}/" not in f:
                    all_move_pairs.append((f, new_path))

        # Process ETFs
        etf_prefix = f"{dt_folder}etf/"
        etf_files = list_gcs_files(etf_prefix)
        for f in etf_files:
            filename = f.split("/")[-1]
            venue = extract_venue_from_filename(filename)
            if venue and ":" in filename:
                new_path = f"{etf_prefix}{venue}/{filename}"
                if f != new_path and f"/{venue}/" not in f:
                    all_move_pairs.append((f, new_path))

        # Process futures_chain
        futures_prefix = f"{dt_folder}futures_chain/"
        futures_files = list_gcs_files(futures_prefix)
        for f in futures_files:
            filename = f.split("/")[-1]
            underlying = filename.replace(".parquet", "")
            # Skip if already in a venue folder
            rel_path = f.replace(futures_prefix, "")
            if "/" in rel_path.replace(filename, ""):
                continue
            venue = get_futures_venue(underlying)
            new_path = f"{futures_prefix}{venue}/{filename}"
            all_move_pairs.append((f, new_path))

        # Process options_chain
        options_prefix = f"{dt_folder}options_chain/"
        options_files = list_gcs_files(options_prefix)
        for f in options_files:
            filename = f.split("/")[-1]
            underlying = filename.replace(".parquet", "")
            # Skip if already in a venue folder
            rel_path = f.replace(options_prefix, "")
            if "/" in rel_path.replace(filename, ""):
                continue
            venue = get_options_venue(underlying)
            new_path = f"{options_prefix}{venue}/{filename}"
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
    parser = argparse.ArgumentParser(description="Fast GCS reorganization with parallel moves")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done")
    parser.add_argument(
        "--workers",
        type=int,
        default=20,
        help="Parallel file moves per folder (default: 20)",
    )
    parser.add_argument(
        "--date-workers", type=int, default=5, help="Parallel date folders (default: 5)"
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
        # For a 32-core machine: 8 date folders × 30 file workers = 240 parallel ops
        args.date_workers = max(5, args.cpu_cores // 4)
        args.workers = max(20, args.cpu_cores)
        log(f"Auto-configured for {args.cpu_cores} CPU cores")

    log("=== Starting FAST GCS Reorganization ===")
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
