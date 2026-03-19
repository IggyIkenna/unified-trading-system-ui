#!/usr/bin/env python3
"""
Fast GCS Reorganization Script - Parallel moves using gsutil -m
Moves files from flat structure to venue-based subfolders.

Usage: python reorganize_gcs_parallel.py [--dry-run] [--workers 5]
"""

import argparse
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
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


def run_gsutil(cmd, dry_run=False):
    """Run a gsutil command."""
    if dry_run:
        log(f"[DRY-RUN] {' '.join(cmd)}")
        return True
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        return result.returncode == 0
    except (OSError, ValueError, RuntimeError) as e:
        log(f"ERROR: {e}")
        return False


def list_gcs_files(prefix):
    """List files at a GCS prefix."""
    try:
        result = subprocess.run(
            ["gsutil", "ls", f"{prefix}*.parquet"],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            return [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
        return []
    except (subprocess.TimeoutExpired, OSError, ValueError):
        return []


def extract_venue_from_filename(filename):
    """Extract venue from instrument_key like NYSE:EQUITY:AAPL-USD."""
    # Remove .parquet extension
    base = filename.replace(".parquet", "")
    # Extract first part before colon
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


def move_file(src, dst, dry_run=False):
    """Move a single file."""
    return run_gsutil(["gsutil", "mv", src, dst], dry_run)


def process_date_folder(date_folder, dry_run=False, max_workers=5):
    """Process all files in a date folder."""
    log(f"Processing {date_folder}...")

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

    total_moved = 0
    move_tasks = []

    for dt_folder in data_type_folders:
        # Process equities
        equities_prefix = f"{dt_folder}equities/"
        equity_files = list_gcs_files(equities_prefix)
        for f in equity_files:
            filename = f.split("/")[-1]
            venue = extract_venue_from_filename(filename)
            if venue and ":" in filename:  # Old format with venue:type:symbol
                new_path = f"{equities_prefix}{venue}/{filename}"
                if f != new_path:
                    move_tasks.append((f, new_path))

        # Process ETFs
        etf_prefix = f"{dt_folder}etf/"
        etf_files = list_gcs_files(etf_prefix)
        for f in etf_files:
            filename = f.split("/")[-1]
            venue = extract_venue_from_filename(filename)
            if venue and ":" in filename:
                new_path = f"{etf_prefix}{venue}/{filename}"
                if f != new_path:
                    move_tasks.append((f, new_path))

        # Process futures_chain
        futures_prefix = f"{dt_folder}futures_chain/"
        futures_files = list_gcs_files(futures_prefix)
        for f in futures_files:
            filename = f.split("/")[-1]
            underlying = filename.replace(".parquet", "")
            # Skip if already in a venue folder
            if "/" in f.replace(futures_prefix, "").replace(filename, ""):
                continue
            venue = get_futures_venue(underlying)
            new_path = f"{futures_prefix}{venue}/{filename}"
            move_tasks.append((f, new_path))

        # Process options_chain
        options_prefix = f"{dt_folder}options_chain/"
        options_files = list_gcs_files(options_prefix)
        for f in options_files:
            filename = f.split("/")[-1]
            underlying = filename.replace(".parquet", "")
            # Skip if already in a venue folder
            if "/" in f.replace(options_prefix, "").replace(filename, ""):
                continue
            venue = get_options_venue(underlying)
            new_path = f"{options_prefix}{venue}/{filename}"
            move_tasks.append((f, new_path))

    if not move_tasks:
        log(f"  No files to move in {date_folder}")
        return 0

    log(f"  Moving {len(move_tasks)} files with {max_workers} workers...")

    # Execute moves in parallel
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(move_file, src, dst, dry_run): (src, dst) for src, dst in move_tasks
        }

        for future in as_completed(futures):
            src, _dst = futures[future]
            try:
                if future.result():
                    total_moved += 1
            except (OSError, ValueError, RuntimeError) as e:
                log(f"  ERROR moving {src}: {e}")

    log(f"  Moved {total_moved}/{len(move_tasks)} files in {date_folder}")
    return total_moved


def main():
    parser = argparse.ArgumentParser(description="Reorganize GCS files into venue subfolders")
    parser.add_argument(
        "--dry-run", action="store_true", help="Show what would be done without moving"
    )
    parser.add_argument(
        "--workers", type=int, default=5, help="Number of parallel workers (default: 5)"
    )
    parser.add_argument("--start-date", type=str, help="Start from this date (YYYY-MM-DD)")
    parser.add_argument("--limit", type=int, help="Limit number of date folders to process")
    args = parser.parse_args()

    log("=== Starting GCS Reorganization (Parallel) ===")
    log(f"Bucket: {BUCKET}")
    log(f"Workers: {args.workers}")
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
                # Extract day=YYYY-MM-DD or day-YYYY-MM-DD from path
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

    # Apply limit if specified
    if args.limit:
        date_folders = date_folders[: args.limit]

    log(f"Found {len(date_folders)} date folders to process")

    total_moved = 0
    for i, date_folder in enumerate(date_folders, 1):
        log(f"[{i}/{len(date_folders)}] {date_folder}")
        moved = process_date_folder(date_folder, args.dry_run, args.workers)
        total_moved += moved

    log("=== Reorganization Complete ===")
    log(f"Total files moved: {total_moved}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
