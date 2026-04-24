"""Seed data validator — Phase 4.1 (needed by Phase 2 shell script).

Validates all Parquet files in a seed data directory against UAC/UIC schemas:
- CanonicalOhlcvBar: timestamp, venue, symbol, open/high/low/close/volume
- CanonicalTrade: timestamp, venue, symbol, trade_id, price, quantity, side
- DeFi yields: timestamp, protocol, asset, apy
- Sports odds: timestamp, league, venue, match_id, odds_home/draw/away

Returns a ValidationReport with pass/fail per file, row counts, and date ranges.

Usage:
    python seed_validator.py /tmp/seed_data/ --strict
    python seed_validator.py /tmp/seed_data/  # lenient mode
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Final

import pandas as pd
import pyarrow.parquet as pq

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Schema definitions (lightweight — avoids UAC import dependency for portability)
# ---------------------------------------------------------------------------

OHLCV_REQUIRED: Final[list[str]] = [
    "timestamp",
    "venue",
    "symbol",
    "open",
    "high",
    "low",
    "close",
    "volume",
]

TICK_REQUIRED: Final[list[str]] = [
    "timestamp",
    "venue",
    "symbol",
    "trade_id",
    "price",
    "quantity",
    "side",
]

DEFI_REQUIRED: Final[list[str]] = [
    "timestamp",
    "protocol",
    "asset",
    "apy",
]

SPORTS_REQUIRED: Final[list[str]] = [
    "timestamp",
    "league",
    "venue",
    "match_id",
    "odds_home",
    "odds_away",
]

SCHEMA_BY_DIR: Final[dict[str, list[str]]] = {
    "ohlcv": OHLCV_REQUIRED,
    "tick": TICK_REQUIRED,
    "defi": DEFI_REQUIRED,
    "sports": SPORTS_REQUIRED,
}


# ---------------------------------------------------------------------------
# Report types
# ---------------------------------------------------------------------------


@dataclass
class FileReport:
    path: str
    schema_type: str
    row_count: int
    passed: bool
    errors: list[str] = field(default_factory=list)
    date_min: str = ""
    date_max: str = ""


@dataclass
class ValidationReport:
    total_files: int
    passed_files: int
    failed_files: int
    total_rows: int
    file_reports: list[FileReport] = field(default_factory=list)

    @property
    def success(self) -> bool:
        return self.failed_files == 0


# ---------------------------------------------------------------------------
# Validators
# ---------------------------------------------------------------------------


def _detect_schema_type(parquet_path: Path) -> str:
    """Infer schema type from path components."""
    parts = parquet_path.parts
    for schema_dir in SCHEMA_BY_DIR:
        if schema_dir in parts:
            return schema_dir
    return "unknown"


def _validate_file(parquet_path: Path, strict: bool) -> FileReport:
    """Validate a single Parquet file."""
    schema_type = _detect_schema_type(parquet_path)
    required_cols = SCHEMA_BY_DIR.get(schema_type, [])
    errors: list[str] = []
    row_count = 0
    date_min = ""
    date_max = ""

    try:
        table = pq.read_table(str(parquet_path))
        df = table.to_pandas()
        row_count = len(df)

        if schema_type == "unknown":
            if strict:
                errors.append(
                    "Cannot determine schema type from path — unknown directory structure"
                )
        else:
            # Required columns
            missing = [c for c in required_cols if c not in df.columns]
            if missing:
                errors.append(f"Missing required columns: {missing}")

            # Timestamp checks
            if "timestamp" in df.columns:
                ts_col = pd.to_datetime(df["timestamp"], utc=True, errors="coerce")
                null_ts = ts_col.isna().sum()
                if null_ts > 0:
                    errors.append(f"{null_ts} null/invalid timestamps found")
                else:
                    date_min = str(ts_col.min())
                    date_max = str(ts_col.max())

            # OHLCV-specific: OHLC sanity
            if schema_type == "ohlcv":
                numeric_cols = ["open", "high", "low", "close", "volume"]
                for col in numeric_cols:
                    if col in df.columns:
                        neg_count = (pd.to_numeric(df[col], errors="coerce") <= 0).sum()
                        if neg_count > 0:
                            errors.append(f"Column '{col}' has {neg_count} non-positive values")
                if all(c in df.columns for c in ["open", "high", "low", "close"]):
                    open_v = pd.to_numeric(df["open"], errors="coerce")
                    high_v = pd.to_numeric(df["high"], errors="coerce")
                    low_v = pd.to_numeric(df["low"], errors="coerce")
                    close_v = pd.to_numeric(df["close"], errors="coerce")
                    bad_high = (high_v < open_v) | (high_v < close_v)
                    bad_low = (low_v > open_v) | (low_v > close_v)
                    hloc_violations = (bad_high | bad_low).sum()
                    if hloc_violations > 0:
                        errors.append(
                            f"{hloc_violations} bars violate high >= open/close >= low invariant"
                        )

            # Tick-specific: side validation
            if schema_type == "tick" and "side" in df.columns:
                invalid_sides = (~df["side"].isin(["buy", "sell"])).sum()
                if invalid_sides > 0:
                    errors.append(f"{invalid_sides} rows have invalid 'side' (must be buy or sell)")

            # DeFi-specific: APY range
            if schema_type == "defi" and "apy" in df.columns:
                apy = pd.to_numeric(df["apy"], errors="coerce")
                neg_apy = (apy < 0).sum()
                if neg_apy > 0:
                    errors.append(f"{neg_apy} rows have negative APY")
                high_apy = (apy > 5.0).sum()  # >500% APY is suspicious
                if high_apy > 0 and strict:
                    errors.append(f"{high_apy} rows have suspiciously high APY (>500%)")

            # Sports-specific: odds range
            if schema_type == "sports":
                for odds_col in ["odds_home", "odds_draw", "odds_away"]:
                    if odds_col in df.columns:
                        odds = pd.to_numeric(df[odds_col], errors="coerce")
                        low_odds = (odds < 1.01).sum()
                        if low_odds > 0:
                            errors.append(
                                f"{low_odds} rows in '{odds_col}' below 1.01 (invalid odds)"
                            )

            # NaN checks in required fields
            for col in required_cols:
                if col in df.columns:
                    nan_count = df[col].isna().sum()
                    if nan_count > 0:
                        errors.append(f"Required column '{col}' has {nan_count} NaN values")

    except Exception as exc:
        errors.append(f"Failed to read Parquet: {exc}")

    passed = len(errors) == 0
    return FileReport(
        path=str(parquet_path),
        schema_type=schema_type,
        row_count=row_count,
        passed=passed,
        errors=errors,
        date_min=date_min,
        date_max=date_max,
    )


# ---------------------------------------------------------------------------
# Main orchestration
# ---------------------------------------------------------------------------


def validate_seed_data(data_dir: str, strict: bool = True) -> ValidationReport:
    """Validate all Parquet files in data_dir.

    Returns a ValidationReport with per-file results, row counts, and date ranges.
    """
    root = Path(data_dir)
    if not root.exists():
        log.error("Data directory does not exist: %s", root)
        return ValidationReport(total_files=0, passed_files=0, failed_files=0, total_rows=0)

    parquet_files = list(root.rglob("*.parquet"))
    if not parquet_files:
        log.warning("No Parquet files found in %s", root)
        return ValidationReport(total_files=0, passed_files=0, failed_files=0, total_rows=0)

    file_reports: list[FileReport] = []
    for pf in sorted(parquet_files):
        report = _validate_file(pf, strict=strict)
        file_reports.append(report)
        status = "PASS" if report.passed else "FAIL"
        log.info(
            "[%s] %s  (%d rows, %s → %s)",
            status,
            pf.relative_to(root),
            report.row_count,
            report.date_min or "?",
            report.date_max or "?",
        )
        for err in report.errors:
            log.warning("       ERROR: %s", err)

    passed = sum(1 for r in file_reports if r.passed)
    failed = len(file_reports) - passed
    total_rows = sum(r.row_count for r in file_reports)

    log.info(
        "Validation complete: %d/%d files passed, %d total rows",
        passed,
        len(file_reports),
        total_rows,
    )
    return ValidationReport(
        total_files=len(file_reports),
        passed_files=passed,
        failed_files=failed,
        total_rows=total_rows,
        file_reports=file_reports,
    )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate seed data Parquet files against UAC/UIC schemas."
    )
    parser.add_argument("data_dir", help="Root directory containing seed Parquet files")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Fail on warnings as well as errors",
    )
    parser.add_argument(
        "--json-report",
        type=Path,
        default=None,
        help="Write JSON validation report to this path",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv if argv is not None else sys.argv[1:])
    report = validate_seed_data(args.data_dir, strict=args.strict)

    if args.json_report:
        report_dict: dict[str, object] = {
            "total_files": report.total_files,
            "passed_files": report.passed_files,
            "failed_files": report.failed_files,
            "total_rows": report.total_rows,
            "success": report.success,
            "files": [
                {
                    "path": fr.path,
                    "schema_type": fr.schema_type,
                    "row_count": fr.row_count,
                    "passed": fr.passed,
                    "errors": fr.errors,
                    "date_min": fr.date_min,
                    "date_max": fr.date_max,
                }
                for fr in report.file_reports
            ],
        }
        args.json_report.write_text(json.dumps(report_dict, indent=2))
        log.info("JSON report → %s", args.json_report)

    return 0 if report.success else 1


if __name__ == "__main__":
    sys.exit(main())
