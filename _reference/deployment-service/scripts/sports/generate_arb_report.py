#!/usr/bin/env python3
"""
Generate an HTML liquidity/arbitrage analysis report from GCS Parquet data.

Reads bookmaker liquidity, market liquidity, spread-line, and totals-line
analysis files from a GCS bucket and produces a standalone HTML report with
key insights.

The original script read CSV files from a local directory.  This version reads
Parquet from GCS and writes the HTML report locally (or optionally to GCS).

Usage:
    python scripts/sports/generate_arb_report.py --bucket my-bucket --prefix sports/liquidity_analysis
    python scripts/sports/generate_arb_report.py --local-dir data/liquidity_analysis
    python scripts/sports/generate_arb_report.py --local-dir data/liquidity_analysis --output report.html
"""

from __future__ import annotations

import argparse
import io
import logging
from datetime import UTC, datetime
from pathlib import Path

import pandas as pd
from unified_cloud_interface import StorageClient, get_storage_client
from unified_config_interface import UnifiedCloudConfig

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------


def _read_parquet_from_gcs(client: StorageClient, bucket_name: str, blob_path: str) -> pd.DataFrame:
    """Download a Parquet blob and return a DataFrame."""
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_path)
    data = blob.download_as_bytes()
    return pd.read_parquet(io.BytesIO(data))


def _load_from_gcs(
    client: StorageClient,
    bucket_name: str,
    prefix: str,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load the four analysis DataFrames from GCS Parquet."""
    bookmaker_liq = _read_parquet_from_gcs(
        client, bucket_name, f"{prefix}/bookmaker_liquidity.parquet"
    )
    market_liq = _read_parquet_from_gcs(client, bucket_name, f"{prefix}/market_liquidity.parquet")
    spread_lines = _read_parquet_from_gcs(
        client, bucket_name, f"{prefix}/spread_line_popularity.parquet"
    )
    totals_lines = _read_parquet_from_gcs(
        client, bucket_name, f"{prefix}/totals_line_popularity.parquet"
    )
    return bookmaker_liq, market_liq, spread_lines, totals_lines


def _load_from_local(
    local_dir: Path,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load the four analysis DataFrames from local CSV/Parquet files."""
    # Try Parquet first, fall back to CSV
    for ext, reader in [(".parquet", pd.read_parquet), (".csv", pd.read_csv)]:
        bm_path = local_dir / f"bookmaker_liquidity{ext}"
        if bm_path.exists():
            bookmaker_liq: pd.DataFrame = reader(bm_path)
            market_liq: pd.DataFrame = reader(local_dir / f"market_liquidity{ext}")
            spread_lines: pd.DataFrame = reader(local_dir / f"spread_line_popularity{ext}")
            totals_lines: pd.DataFrame = reader(local_dir / f"totals_line_popularity{ext}")
            return bookmaker_liq, market_liq, spread_lines, totals_lines

    msg = f"No liquidity data found in {local_dir}"
    raise FileNotFoundError(msg)


# ---------------------------------------------------------------------------
# HTML generation
# ---------------------------------------------------------------------------


def generate_html(
    bookmaker_liq: pd.DataFrame,
    market_liq: pd.DataFrame,
    spread_lines: pd.DataFrame,
    totals_lines: pd.DataFrame,
) -> str:
    """Build a standalone HTML report string from the analysis DataFrames."""
    generated_at = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")

    bookmaker_table = bookmaker_liq.head(10).to_html(classes="", escape=False, index=True)
    market_table = market_liq.to_html(classes="", escape=False, index=True)
    spread_table = spread_lines.head(10).to_html(classes="", escape=False, index=True)
    totals_table = totals_lines.head(10).to_html(classes="", escape=False, index=True)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Football Betting Liquidity Analysis Report</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; color: #333; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }}
        .header h1 {{ margin: 0; font-size: 2em; }}
        .header p {{ margin: 10px 0 0; opacity: 0.9; }}
        .section {{ background: white; padding: 25px; margin-bottom: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .section h2 {{ color: #667eea; border-bottom: 3px solid #667eea; padding-bottom: 10px; margin-top: 0; }}
        .metric-box {{ display: inline-block; background: #f8f9fa; padding: 15px 25px; border-radius: 8px; margin: 10px 10px 10px 0; border-left: 4px solid #667eea; }}
        .metric-box strong {{ display: block; font-size: 1.8em; color: #667eea; }}
        .metric-box span {{ color: #666; font-size: 0.9em; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        table th {{ background-color: #667eea; color: white; padding: 12px; text-align: left; }}
        table td {{ padding: 10px 12px; border-bottom: 1px solid #ddd; }}
        table tr:hover {{ background-color: #f5f5f5; }}
        .recommendation {{ background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; border-radius: 4px; }}
        .footer {{ text-align: center; color: #666; margin-top: 40px; padding: 20px; border-top: 1px solid #ddd; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Football Betting Liquidity Analysis</h1>
        <p>Comprehensive analysis of bookmaker liquidity, market coverage, and trading opportunities</p>
        <p style="font-size: 0.9em;">Generated: {generated_at}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="metric-box"><strong>{len(bookmaker_liq)}</strong><span>Bookmakers Analyzed</span></div>
        <div class="metric-box"><strong>{len(market_liq)}</strong><span>Markets Covered</span></div>
        <div class="metric-box"><strong>{len(spread_lines)}</strong><span>Spread Lines</span></div>
        <div class="metric-box"><strong>{len(totals_lines)}</strong><span>Totals Lines</span></div>
    </div>

    <div class="section">
        <h2>Top 10 Most Liquid Bookmakers</h2>
        {bookmaker_table}
    </div>

    <div class="section">
        <h2>Market Liquidity Overview</h2>
        {market_table}
    </div>

    <div class="section">
        <h2>Top 10 Most Liquid Spread Lines</h2>
        {spread_table}
    </div>

    <div class="section">
        <h2>Top 10 Most Liquid Totals Lines</h2>
        {totals_table}
    </div>

    <div class="footer">
        <p>Data source: GCS Parquet | Generated by generate_arb_report.py</p>
    </div>
</body>
</html>"""


# ---------------------------------------------------------------------------
# Standalone entry-point
# ---------------------------------------------------------------------------


def main() -> None:
    """Generate the liquidity analysis HTML report."""
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(description="Generate arbitrage/liquidity HTML report")
    parser.add_argument(
        "--bucket", type=str, default="", help="GCS bucket for liquidity analysis data"
    )
    parser.add_argument(
        "--prefix", type=str, default="sports/liquidity_analysis", help="GCS prefix"
    )
    parser.add_argument(
        "--local-dir", type=str, default="", help="Read from local directory instead of GCS"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="Football_Betting_Liquidity_Report.html",
        help="Output HTML file path",
    )
    args = parser.parse_args()

    config = UnifiedCloudConfig()

    if args.local_dir:
        logger.info("Loading data from local directory: %s", args.local_dir)
        bookmaker_liq, market_liq, spread_lines, totals_lines = _load_from_local(
            Path(args.local_dir)
        )
    else:
        bucket_name = args.bucket or f"sports-analysis-{config.gcp_project_id}"
        logger.info("Loading data from GCS: gs://%s/%s", bucket_name, args.prefix)
        client = get_storage_client(project_id=config.gcp_project_id)
        bookmaker_liq, market_liq, spread_lines, totals_lines = _load_from_gcs(
            client, bucket_name, args.prefix
        )

    logger.info("Generating HTML report...")
    html = generate_html(bookmaker_liq, market_liq, spread_lines, totals_lines)

    output_path = Path(args.output)
    output_path.write_text(html, encoding="utf-8")
    logger.info("Report written to: %s", output_path.resolve())


if __name__ == "__main__":
    main()
