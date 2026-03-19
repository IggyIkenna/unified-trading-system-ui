#!/usr/bin/env python3
"""
High-Performance Instrument Definitions Aggregation Script

DEPRECATED: Aggregation is moving to instruments-service (--operation aggregate).
See unified-trading-codex/02-data/instruments-and-api-keys-standard.md.
This script remains for local development and migration period.

Aggregates all downloaded instrument parquet files into a single deduplicated file
using Polars for efficient parallel processing.

Features:
  - Lazy evaluation with scan_parquet() for memory efficiency
  - Parallel multi-threaded reads
  - Deduplication by instrument_key (keeps latest by timestamp)
  - Optional upload to GCS

Usage:
    # Aggregate all downloaded files
    python scripts/aggregate_instruments.py

    # Custom paths
    python scripts/aggregate_instruments.py --input data/instruments_raw --output data/aggregated.parquet

    # Upload to GCS after aggregation
    python scripts/aggregate_instruments.py --upload-to-gcs
"""

import argparse
import sys
from datetime import UTC, date, datetime
from pathlib import Path

import polars as pl
from unified_cloud_interface import get_storage_client

sys.path.insert(0, str(Path(__file__).parent))
import logging

from _common import get_project_id

logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

DEFAULT_INPUT_DIR = "data/instruments_raw"
DEFAULT_OUTPUT_DIR = "data"

# GCS bucket for aggregated instruments (optional upload)
_PROJECT_ID = get_project_id()
AGGREGATED_BUCKET = f"instruments-store-aggregated-{_PROJECT_ID}"
AGGREGATED_PREFIX = "aggregated"


def log(msg: str) -> None:
    """Print timestamped log message."""
    logger.info(
        f"[{datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S')}] {msg}",
        flush=True,
    )


def find_parquet_files(input_dir: str) -> list[Path]:
    """Find all parquet files in the input directory recursively."""
    input_path = Path(input_dir)
    if not input_path.exists():
        log(f"ERROR: Input directory does not exist: {input_dir}")
        return []

    parquet_files = list(input_path.rglob("*.parquet"))
    return sorted(parquet_files)


def aggregate_instruments(
    input_dir: str,
    output_path: str,
    columns: list[str] | None = None,
) -> pl.DataFrame | None:
    """
    Aggregate all parquet files using Polars lazy evaluation.
    Deduplicates by instrument_key, keeping the row with latest timestamp.

    Args:
        input_dir: Directory containing parquet files
        output_path: Path for output parquet file
        columns: Optional list of columns to keep (None = all columns)

    Returns:
        Aggregated DataFrame or None if no files found
    """
    # Find all parquet files
    parquet_files = find_parquet_files(input_dir)

    if not parquet_files:
        log(f"ERROR: No parquet files found in {input_dir}")
        return None

    log(f"Found {len(parquet_files)} parquet files")

    # Sample first file to get schema info
    sample_schema = pl.scan_parquet(parquet_files[0]).collect_schema()
    log(f"Schema columns: {len(sample_schema)}")

    # Check for required columns
    required_cols = ["instrument_key", "timestamp"]
    missing_cols = [col for col in required_cols if col not in sample_schema]
    if missing_cols:
        log(f"WARNING: Missing required columns: {missing_cols}")
        log("Available columns: " + ", ".join(sample_schema.names()))
        # Try alternative column names
        if "instrument_key" not in sample_schema and "instrument_id" in sample_schema:
            log("Using 'instrument_id' as dedup key instead of 'instrument_key'")
            required_cols[0] = "instrument_id"

    dedup_col = "instrument_key" if "instrument_key" in sample_schema else "instrument_id"
    timestamp_col = "timestamp" if "timestamp" in sample_schema else None

    # Lazy scan all files (doesn't load into memory yet)
    log("Creating lazy scan of all files...")
    lazy_frames = []
    for f in parquet_files:
        try:
            lf = pl.scan_parquet(f)
            if columns:
                # Select only requested columns
                available_cols = [c for c in columns if c in lf.collect_schema()]
                lf = lf.select(available_cols)
            lazy_frames.append(lf)
        except (OSError, ValueError, RuntimeError) as e:
            log(f"  WARNING: Could not scan {f}: {e}")

    if not lazy_frames:
        log("ERROR: No valid parquet files could be scanned")
        return None

    log(f"Scanning {len(lazy_frames)} files lazily...")

    # Concatenate lazily
    combined = pl.concat(lazy_frames)

    # Deduplicate: keep latest by timestamp for each instrument_key
    log(f"Deduplicating by '{dedup_col}'...")
    if timestamp_col and timestamp_col in sample_schema:
        # Sort by timestamp descending, then take first per instrument_key
        deduped = (
            combined.sort(timestamp_col, descending=True).group_by(dedup_col).agg(pl.all().first())
        )
    else:
        # No timestamp column, just take first occurrence
        log("WARNING: No timestamp column found, taking first occurrence per instrument")
        deduped = combined.group_by(dedup_col).agg(pl.all().first())

    # Collect (materialize the lazy frame)
    log("Collecting results (this may take a moment)...")
    result = deduped.collect()

    # Write output
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    log(f"Writing {len(result)} unique instruments to {output_path}...")
    result.write_parquet(output_path)

    # Get file size
    file_size_mb = output_file.stat().st_size / (1024 * 1024)
    log(f"Output file size: {file_size_mb:.2f} MB")

    return result


def upload_to_gcs(local_path: str, bucket_name: str, gcs_path: str) -> bool:
    """Upload file to GCS."""
    try:
        log(f"Uploading to gs://{bucket_name}/{gcs_path}...")
        client = get_storage_client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(gcs_path)
        blob.upload_from_filename(local_path)
        log(f"Upload complete: gs://{bucket_name}/{gcs_path}")
        return True
    except (OSError, ValueError, RuntimeError) as e:
        log(f"ERROR: Upload failed: {e}")
        return False


def main() -> int:
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(
        description="Aggregate instrument definition parquet files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Aggregate all downloaded files
  python scripts/aggregate_instruments.py

  # Custom input/output paths
  python scripts/aggregate_instruments.py --input data/instruments_raw --output data/aggregated.parquet

  # Upload to GCS after aggregation
  python scripts/aggregate_instruments.py --upload-to-gcs
        """,
    )
    parser.add_argument(
        "--input",
        type=str,
        default=DEFAULT_INPUT_DIR,
        help=f"Input directory with parquet files (default: {DEFAULT_INPUT_DIR})",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output parquet file path (default: data/aggregated_instruments_YYYY-MM-DD.parquet)",
    )
    parser.add_argument(
        "--upload-to-gcs",
        action="store_true",
        help="Upload aggregated file to GCS after creation",
    )
    parser.add_argument(
        "--gcs-bucket",
        type=str,
        default=AGGREGATED_BUCKET,
        help=f"GCS bucket for upload (default: {AGGREGATED_BUCKET})",
    )

    args = parser.parse_args()

    # Generate default output path with today's date
    today = date.today().isoformat()
    output_path = args.output or f"{DEFAULT_OUTPUT_DIR}/aggregated_instruments_{today}.parquet"

    # Print configuration
    log("=" * 60)
    log("INSTRUMENT DEFINITIONS AGGREGATOR")
    log("=" * 60)
    log(f"Input directory: {args.input}")
    log(f"Output file: {output_path}")
    log(f"Upload to GCS: {args.upload_to_gcs}")
    if args.upload_to_gcs:
        log(f"GCS bucket: {args.gcs_bucket}")
    log("=" * 60)

    # Run aggregation
    log("\n[PHASE 1] Aggregating parquet files...")
    result = aggregate_instruments(args.input, output_path)

    if result is None:
        log("\nAggregation failed. See errors above.")
        return 1

    # Summary statistics
    log("\n" + "=" * 60)
    log("AGGREGATION SUMMARY")
    log("=" * 60)
    log(f"Total unique instruments: {len(result)}")
    log(f"Columns: {len(result.columns)}")

    # Show instrument counts by category if available
    if "venue" in result.columns:
        venue_counts = result.group_by("venue").len().sort("len", descending=True)
        log("\nTop venues by instrument count:")
        for row in venue_counts.head(10).iter_rows():
            log(f"  {row[0]}: {row[1]}")

    if "instrument_type" in result.columns:
        type_counts = result.group_by("instrument_type").len().sort("len", descending=True)
        log("\nInstrument types:")
        for row in type_counts.iter_rows():
            log(f"  {row[0]}: {row[1]}")

    # Upload to GCS if requested
    if args.upload_to_gcs:
        log("\n[PHASE 2] Uploading to GCS...")
        gcs_path = f"{AGGREGATED_PREFIX}/aggregated_instruments_{today}.parquet"
        success = upload_to_gcs(output_path, args.gcs_bucket, gcs_path)
        if not success:
            return 1

    log("\n" + "=" * 60)
    log("COMPLETE")
    log("=" * 60)
    log(f"Output: {output_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
