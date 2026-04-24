"""Feature seeder — Phase 2.2.

Runs all 8 feature services in batch mode against synthetic tick data and writes
pre-computed feature Parquet files to GCS (or local /tmp in dry-run mode).

All computations use only the already-generated seed data — no live API calls.

Feature service execution order (parallelism is simulated — in real usage, a
proper process pool / Cloud Run batch job would be used):
  Layer 1 (parallel): features-delta-one, features-volatility,
                       features-calendar, features-onchain
  Layer 2 (parallel): features-cross-instrument, features-commodity
  Layer 3 (sequential): features-multi-timeframe (depends on L1+L2)

Usage:
    python seed_features.py --mode quick --project unified-trading-dev --dry-run
    python seed_features.py --mode full  --input /tmp/seed_data/ --output /tmp/seed_features/
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Feature computation helpers (pure numpy/pandas — no service imports)
# ---------------------------------------------------------------------------


def _read_ohlcv_files(data_dir: Path) -> pd.DataFrame:
    """Concatenate all OHLCV Parquet files from data_dir into a single DataFrame."""
    ohlcv_root = data_dir / "ohlcv"
    if not ohlcv_root.exists():
        log.warning("No OHLCV data directory found at %s", ohlcv_root)
        return pd.DataFrame()

    frames: list[pd.DataFrame] = []
    for pf in ohlcv_root.rglob("*.parquet"):
        try:
            table = pq.read_table(str(pf))
            frames.append(table.to_pandas())
        except Exception as exc:
            log.warning("Failed to read %s: %s", pf, exc)

    if not frames:
        return pd.DataFrame()
    df = pd.concat(frames, ignore_index=True)
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    df = df.sort_values(["symbol", "timestamp"]).reset_index(drop=True)
    log.info("Loaded %d OHLCV rows for %d symbols", len(df), df["symbol"].nunique())
    return df


# ---------------------------------------------------------------------------
# Layer 1: delta-one features
# ---------------------------------------------------------------------------


def compute_delta_one(df: pd.DataFrame) -> pd.DataFrame:
    """Returns, momentum, and relative-strength features per symbol."""
    if df.empty:
        return pd.DataFrame()
    out_frames: list[pd.DataFrame] = []
    for symbol, grp in df.groupby("symbol"):
        grp = grp.copy().sort_values("timestamp")
        close = pd.to_numeric(grp["close"], errors="coerce")
        result = grp[["timestamp", "symbol", "venue"]].copy()
        result["return_1"] = close.pct_change(1)
        result["return_5"] = close.pct_change(5)
        result["return_20"] = close.pct_change(20)
        result["momentum_10"] = close / close.shift(10) - 1
        result["rsi_14"] = _rsi(close, 14)
        result["feature_service"] = "features-delta-one"
        out_frames.append(result)
    return pd.concat(out_frames, ignore_index=True)


def _rsi(close: pd.Series, period: int) -> pd.Series:
    """Compute RSI without TA-Lib dependency."""
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = (-delta).clip(lower=0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - 100 / (1 + rs)
    return rsi


# ---------------------------------------------------------------------------
# Layer 1: volatility features
# ---------------------------------------------------------------------------


def compute_volatility(df: pd.DataFrame) -> pd.DataFrame:
    """Realised vol, ATR, Bollinger bandwidth."""
    if df.empty:
        return pd.DataFrame()
    out_frames: list[pd.DataFrame] = []
    for symbol, grp in df.groupby("symbol"):
        grp = grp.copy().sort_values("timestamp")
        close = pd.to_numeric(grp["close"], errors="coerce")
        high = pd.to_numeric(grp["high"], errors="coerce")
        low = pd.to_numeric(grp["low"], errors="coerce")
        log_ret = np.log(close / close.shift(1))

        result = grp[["timestamp", "symbol", "venue"]].copy()
        result["realised_vol_20"] = log_ret.rolling(20).std() * np.sqrt(252)
        result["realised_vol_5"] = log_ret.rolling(5).std() * np.sqrt(252)
        tr = pd.concat(
            [
                (high - low),
                (high - close.shift(1)).abs(),
                (low - close.shift(1)).abs(),
            ],
            axis=1,
        ).max(axis=1)
        result["atr_14"] = tr.rolling(14).mean()
        ma20 = close.rolling(20).mean()
        std20 = close.rolling(20).std()
        result["bb_upper"] = ma20 + 2 * std20
        result["bb_lower"] = ma20 - 2 * std20
        result["bb_bandwidth"] = (result["bb_upper"] - result["bb_lower"]) / ma20
        result["feature_service"] = "features-volatility"
        out_frames.append(result)
    return pd.concat(out_frames, ignore_index=True)


# ---------------------------------------------------------------------------
# Layer 1: calendar features
# ---------------------------------------------------------------------------


def compute_calendar(df: pd.DataFrame) -> pd.DataFrame:
    """Day-of-week, hour-of-day, month, US market session flags."""
    if df.empty:
        return pd.DataFrame()
    result = df[["timestamp", "symbol", "venue"]].copy()
    ts = pd.to_datetime(df["timestamp"], utc=True)
    result["day_of_week"] = ts.dt.dayofweek
    result["hour_of_day"] = ts.dt.hour
    result["month"] = ts.dt.month
    result["is_us_market_hours"] = ts.dt.hour.between(14, 21)  # 09:30-16:00 ET → 14:30-21:00 UTC
    result["is_asia_session"] = ts.dt.hour.between(0, 8)
    result["is_eu_session"] = ts.dt.hour.between(7, 16)
    result["feature_service"] = "features-calendar"
    return result


# ---------------------------------------------------------------------------
# Layer 1: on-chain features (synthetic — no live RPC)
# ---------------------------------------------------------------------------


def compute_onchain(df: pd.DataFrame) -> pd.DataFrame:
    """Synthetic on-chain metrics (NVT, MVRV, active addresses — synthetic GBM)."""
    if df.empty:
        return pd.DataFrame()
    rng = np.random.default_rng(42)
    crypto_symbols = ["BTC/USDT", "ETH/USDT", "SOL/USDT"]
    frames: list[pd.DataFrame] = []
    for symbol, grp in df.groupby("symbol"):
        if symbol not in crypto_symbols:
            continue
        grp = grp.copy().sort_values("timestamp")
        n = len(grp)
        result = grp[["timestamp", "symbol", "venue"]].copy()
        result["active_addresses_norm"] = np.clip(
            0.5 + np.cumsum(rng.standard_normal(n)) * 0.01, 0.0, 1.0
        )
        result["nvt_ratio"] = np.clip(50 + np.cumsum(rng.standard_normal(n)) * 2.0, 10.0, 200.0)
        result["mvrv_ratio"] = np.clip(1.5 + np.cumsum(rng.standard_normal(n)) * 0.05, 0.5, 5.0)
        result["feature_service"] = "features-onchain"
        frames.append(result)
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()


# ---------------------------------------------------------------------------
# Layer 2: cross-instrument features
# ---------------------------------------------------------------------------


def compute_cross_instrument(df: pd.DataFrame) -> pd.DataFrame:
    """BTC/ETH correlation rolling, BTC dominance proxy."""
    if df.empty:
        return pd.DataFrame()
    pivot = df.pivot_table(index="timestamp", columns="symbol", values="close", aggfunc="last")
    if "BTC/USDT" not in pivot.columns or "ETH/USDT" not in pivot.columns:
        return pd.DataFrame()
    btc = pd.to_numeric(pivot.get("BTC/USDT"), errors="coerce")
    eth = pd.to_numeric(pivot.get("ETH/USDT"), errors="coerce")
    combined = pd.DataFrame({"timestamp": pivot.index, "symbol": "cross"})
    combined["btc_eth_corr_20"] = btc.pct_change().rolling(20).corr(eth.pct_change())
    combined["btc_eth_ratio"] = btc / eth.replace(0, np.nan)
    combined["feature_service"] = "features-cross-instrument"
    return combined.reset_index(drop=True)


# ---------------------------------------------------------------------------
# Layer 2: commodity features
# ---------------------------------------------------------------------------


def compute_commodity(df: pd.DataFrame) -> pd.DataFrame:
    """Commodity-specific features: GLD/SLV ratio, oil regime flags."""
    if df.empty:
        return pd.DataFrame()
    commodity_symbols = {"GLD", "SLV", "USO", "UNG", "PDBC"}
    frames: list[pd.DataFrame] = []
    for symbol, grp in df.groupby("symbol"):
        if symbol not in commodity_symbols:
            continue
        grp = grp.copy().sort_values("timestamp")
        close = pd.to_numeric(grp["close"], errors="coerce")
        result = grp[["timestamp", "symbol", "venue"]].copy()
        result["commodity_ma_20"] = close.rolling(20).mean()
        result["commodity_trend"] = (close > result["commodity_ma_20"]).astype(int)
        result["feature_service"] = "features-commodity"
        frames.append(result)
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()


# ---------------------------------------------------------------------------
# Layer 3: multi-timeframe features
# ---------------------------------------------------------------------------


def compute_multi_timeframe(df: pd.DataFrame) -> pd.DataFrame:
    """Weekly and monthly summaries derived from higher-frequency bars."""
    if df.empty:
        return pd.DataFrame()
    out_frames: list[pd.DataFrame] = []
    for symbol, grp in df.groupby("symbol"):
        grp = grp.copy().sort_values("timestamp")
        grp["timestamp"] = pd.to_datetime(grp["timestamp"], utc=True)
        grp = grp.set_index("timestamp")
        close_col = pd.to_numeric(grp["close"], errors="coerce")
        # Weekly resampled
        weekly = close_col.resample("W").agg(["first", "last", "max", "min"])
        weekly.columns = ["open_w", "close_w", "high_w", "low_w"]
        weekly["return_w"] = weekly["close_w"] / weekly["open_w"] - 1
        weekly["symbol"] = symbol
        weekly["venue"] = grp["venue"].iloc[0] if "venue" in grp.columns else ""
        weekly["feature_service"] = "features-multi-timeframe"
        out_frames.append(weekly.reset_index())
    return pd.concat(out_frames, ignore_index=True) if out_frames else pd.DataFrame()


# ---------------------------------------------------------------------------
# Writer
# ---------------------------------------------------------------------------


def _write_feature_df(df: pd.DataFrame, name: str, output_dir: Path, dry_run: bool) -> None:
    """Write a feature DataFrame to Parquet."""
    if df.empty:
        log.info("[%s] No rows — skipping write", name)
        return
    out_dir = output_dir / name
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "features.parquet"
    if dry_run:
        log.info("[DRY RUN] Would write %d rows → %s", len(df), out_path)
    else:
        df_clean = df.copy()
        # Ensure timestamp column is serializable
        if "timestamp" in df_clean.columns:
            df_clean["timestamp"] = pd.to_datetime(df_clean["timestamp"], utc=True)
        table = pa.Table.from_pandas(df_clean, preserve_index=False)
        pq.write_table(table, out_path, compression="snappy")
        log.info("Wrote %d rows → %s", len(df_clean), out_path)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def run(mode: str, input_dir: Path, output_dir: Path, project: str | None, dry_run: bool) -> int:
    """Run all feature services in batch mode against synthetic seed data."""
    df = _read_ohlcv_files(input_dir)
    if df.empty:
        log.error(
            "No OHLCV seed data found in %s — run generate_synthetic_data.py first", input_dir
        )
        return 1

    if mode == "quick":
        # Limit to 5 symbols for quick mode
        quick_symbols = {"BTC/USDT", "ETH/USDT", "SPY", "ETH/USDC", "GLD"}
        df = df[df["symbol"].isin(quick_symbols)].copy()
        log.info(
            "Quick mode: filtered to %d rows across %d symbols", len(df), df["symbol"].nunique()
        )

    # Layer 1 — independent
    log.info("==> Layer 1: delta-one, volatility, calendar, onchain")
    df_delta = compute_delta_one(df)
    df_vol = compute_volatility(df)
    df_cal = compute_calendar(df)
    df_onchain = compute_onchain(df)

    _write_feature_df(df_delta, "features-delta-one", output_dir, dry_run)
    _write_feature_df(df_vol, "features-volatility", output_dir, dry_run)
    _write_feature_df(df_cal, "features-calendar", output_dir, dry_run)
    _write_feature_df(df_onchain, "features-onchain", output_dir, dry_run)

    # Layer 2 — independent
    log.info("==> Layer 2: cross-instrument, commodity")
    df_cross = compute_cross_instrument(df)
    df_comm = compute_commodity(df)

    _write_feature_df(df_cross, "features-cross-instrument", output_dir, dry_run)
    _write_feature_df(df_comm, "features-commodity", output_dir, dry_run)

    # Layer 3 — depends on L1+L2
    log.info("==> Layer 3: multi-timeframe")
    df_mtf = compute_multi_timeframe(df)
    _write_feature_df(df_mtf, "features-multi-timeframe", output_dir, dry_run)

    if project and not dry_run:
        log.info(
            "To upload: gsutil -m cp -r %s/ gs://%s-features/seed/",
            output_dir,
            project,
        )

    log.info("Feature seeding complete. Output dir: %s", output_dir)
    return 0


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed pre-computed feature data for the unified-trading dev project."
    )
    parser.add_argument("--mode", choices=["quick", "full"], default="quick")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("/tmp/seed_data"),  # nosec B108 — CLI default for dev seeding tool
        help="Input directory containing seed OHLCV Parquet files",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("/tmp/seed_features"),  # nosec B108 — CLI default for dev seeding tool
        help="Output directory for feature Parquet files",
    )
    parser.add_argument("--project", type=str, default=None, help="GCP project name")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv if argv is not None else sys.argv[1:])
    return run(
        mode=args.mode,
        input_dir=args.input,
        output_dir=args.output,
        project=args.project,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    sys.exit(main())
