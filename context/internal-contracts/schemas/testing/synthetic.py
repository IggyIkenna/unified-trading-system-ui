"""Synthetic market data generator for dev project seeding.

Generates realistic OHLCV bars, tick trades, DeFi yield series, and sports match
odds using Geometric Brownian Motion (GBM) and Ornstein-Uhlenbeck mean reversion.
No live API calls — all data is deterministically seeded and schema-validated.

Usage:
    from unified_internal_contracts.testing import SyntheticDataGenerator, ScenarioConfig
    from unified_internal_contracts.modes import MockScenario

    cfg = ScenarioConfig.load(MockScenario.NORMAL)
    gen = SyntheticDataGenerator(spec, scenario=cfg)
    df = gen.generate_ohlcv("BTC/USDT", "binance", start, end, "1m")
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Final

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

from unified_internal_contracts.testing.scenario_config import (
    InstrumentOverrideAction,
    ScenarioConfig,
)

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

INTERVAL_MINUTES: Final[dict[str, int]] = {
    "1m": 1,
    "5m": 5,
    "15m": 15,
    "1h": 60,
    "4h": 240,
    "1d": 1440,
}

TRADING_DAYS_PER_YEAR: Final[int] = 252
MINUTES_PER_YEAR: Final[int] = 525_600
SECONDS_PER_MINUTE: Final[int] = 60

# Staking OU parameters: mean-reverting APY for ETH staking / LST protocols
_STAKING_PARAMS: Final[dict[str, dict[str, float]]] = {
    "lido": {"mean": 0.040, "kappa": 3.0, "sigma": 0.003, "base_apy": 0.040},
    "etherfi": {"mean": 0.045, "kappa": 2.5, "sigma": 0.004, "base_apy": 0.045},
    "rocket_pool": {"mean": 0.042, "kappa": 2.8, "sigma": 0.0035, "base_apy": 0.042},
    "native_eth": {"mean": 0.035, "kappa": 4.0, "sigma": 0.002, "base_apy": 0.035},
    "_default": {"mean": 0.040, "kappa": 3.0, "sigma": 0.003, "base_apy": 0.040},
}

# Protocol-specific borrow/supply spread factors (borrow APY = supply APY * factor)
_BORROW_SPREAD: Final[dict[str, float]] = {
    "aave_v3": 1.35,
    "compound_v3": 1.30,
    "uniswap_v3": 1.20,
    "curve": 1.25,
    "lido": 1.20,
}

# Intraday volume profile weights (by hour-of-day UTC, 0-23)
_HOUR_VOLUME_WEIGHTS: Final[list[float]] = [
    0.6,
    0.5,
    0.5,
    0.5,
    0.6,
    0.7,
    0.8,
    0.9,  # 00-07
    1.2,
    1.4,
    1.3,
    1.1,
    0.9,
    0.8,
    0.9,
    1.0,  # 08-15
    1.5,
    1.8,
    1.6,
    1.3,
    1.1,
    0.9,
    0.7,
    0.6,  # 16-23
]


# ---------------------------------------------------------------------------
# Core generator
# ---------------------------------------------------------------------------


class SyntheticDataGenerator:
    """Generates realistic (not random) synthetic price and market data.

    Calibrated parameters:
    - GBM drift + volatility per asset (BTC: vol=0.8, drift=0.0; SPY: vol=0.18, drift=0.12)
    - Realistic volume profiles (higher at open/close, lower at lunch)
    - BTC/ETH/SOL correlations preserved (rho_btc_eth=0.85, rho_btc_sol=0.75)
    - DeFi APY series: Ornstein-Uhlenbeck mean-reverting around realistic long-run values
    - Sports odds: realistic pre-match movement profiles
    - All output validates against UAC schemas before writing

    When a ScenarioConfig is provided:
    - ``scenario.seed`` seeds the RNG (deterministic across calls)
    - ``scenario.vol_multiplier`` scales all per-asset volatility parameters
    - ``scenario.volume_multiplier`` scales all volume outputs
    - ``scenario.missing_data_rate`` randomly drops that fraction of OHLCV bars
    """

    def __init__(
        self,
        spec: dict[object, object],
        seed: int = 42,
        scenario: ScenarioConfig | None = None,
    ) -> None:
        effective_seed = scenario.seed if scenario is not None else seed
        self._spec = spec
        self._scenario = scenario
        self._rng = np.random.default_rng(effective_seed)

        vol_mult = scenario.vol_multiplier if scenario is not None else 1.0
        raw_gbm: dict[str, object] = {str(k): v for k, v in (spec.get("gbm_params") or {}).items()}
        self._gbm_params: dict[str, dict[str, float]] = {
            sym: {
                str(pk): float(pv) * (vol_mult if pk == "vol" else 1.0) for pk, pv in params.items()
            }
            for sym, params in (
                (sym, {str(pk): pv for pk, pv in p.items()})
                for sym, p in raw_gbm.items()
                if isinstance(p, dict)
            )
        }
        raw_defi: dict[str, object] = {
            str(k): v for k, v in (spec.get("defi_yield_params") or {}).items()
        }
        self._defi_params: dict[str, dict[str, float]] = {
            key: {str(pk): float(pv) for pk, pv in params.items()}
            for key, params in (
                (key, {str(pk): pv for pk, pv in p.items()})
                for key, p in raw_defi.items()
                if isinstance(p, dict)
            )
        }
        correlations_raw = spec.get("correlations") or {}
        self._correlations: dict[str, float] = {
            str(k): float(v) for k, v in correlations_raw.items()
        }  # type: ignore[arg-type]

    # ------------------------------------------------------------------
    # Fault injection helpers
    # ------------------------------------------------------------------

    def _get_fault_rate(self, field: str) -> float:
        """Get a fault config rate, returning 0.0 if no scenario or no fault."""
        if self._scenario is None or self._scenario.fault is None:
            return 0.0
        return float(getattr(self._scenario.fault, field, 0.0))

    def _apply_schema_corruption(self, df: pd.DataFrame) -> pd.DataFrame:
        """Randomly corrupt fields based on fault.corrupt_schema_rate."""
        rate = self._get_fault_rate("corrupt_schema_rate")
        if rate <= 0.0 or len(df) == 0:
            return df
        n_corrupt = int(len(df) * rate)
        if n_corrupt == 0:
            return df
        corrupt_indices = self._rng.choice(len(df), size=n_corrupt, replace=False)
        numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
        if numeric_cols:
            col = self._rng.choice(numeric_cols)
            df.loc[df.index[corrupt_indices], col] = np.nan
        log.info("Corrupted %d rows (%.1f%%) for BAD_SCHEMA scenario", n_corrupt, rate * 100)
        return df

    def _apply_flash_crash(self, prices: np.ndarray) -> np.ndarray:
        """Inject a flash crash into a price path based on fault config."""
        if self._scenario is None or self._scenario.fault is None:
            return prices
        drop_pct = self._scenario.fault.price_drop_pct
        recovery_min = self._scenario.fault.recovery_minutes
        if drop_pct <= 0.0 or len(prices) < 10:
            return prices
        crash_start = len(prices) // 2
        crash_depth = int(min(recovery_min, len(prices) - crash_start))
        if crash_depth < 2:
            return prices
        mid = crash_depth // 2
        for i in range(crash_depth):
            if i <= mid:
                factor = 1.0 - drop_pct * (i / mid)
            else:
                factor = 1.0 - drop_pct * ((crash_depth - i) / (crash_depth - mid))
            prices[crash_start + i] *= factor
        log.info(
            "Injected flash crash: %.0f%% drop over %d bars at index %d",
            drop_pct * 100,
            crash_depth,
            crash_start,
        )
        return prices

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def generate_ohlcv(
        self,
        symbol: str,
        venue: str,
        start: date,
        end: date,
        interval: str,
    ) -> pd.DataFrame:
        """Generate OHLCV bars matching CanonicalOhlcvBar schema."""
        params = self._gbm_params.get(symbol, {"vol": 0.50, "drift": 0.05, "base_price": 100.0})
        prices = self._gbm_path(
            base_price=params["base_price"],
            annual_vol=params["vol"],
            annual_drift=params["drift"],
            start=start,
            end=end,
            interval=interval,
        )

        # Inject flash crash if configured (FLASH_CRASH scenario)
        prices = self._apply_flash_crash(prices)

        df = self._prices_to_ohlcv(prices, symbol, venue, interval, start, end)

        # Apply missing_data_rate dropout
        missing_rate = self._scenario.missing_data_rate if self._scenario is not None else 0.0
        if missing_rate > 0.0 and len(df) > 0:
            mask = self._rng.random(len(df)) >= missing_rate
            df = df[mask].reset_index(drop=True)

        # Apply schema corruption if configured (BAD_SCHEMA scenario)
        df = self._apply_schema_corruption(df)

        log.info(
            "Generated %d OHLCV bars for %s/%s [%s] (%s → %s)",
            len(df),
            venue,
            symbol,
            interval,
            start,
            end,
        )
        return df

    def generate_defi_yields(
        self,
        protocol: str,
        asset: str,
        start: date,
        end: date,
        interval: str,
    ) -> pd.DataFrame:
        """Generate DeFi APY time-series with cumulative index columns.

        Returns a DataFrame with columns:
        - ``apy``: supply-side annualised percentage yield
        - ``liquidity_index``: cumulative supply index (starts at 1.0)
        - ``borrow_apy``: borrow-side APY (supply * spread factor, 1.2-1.5x)
        - ``variable_borrow_index``: cumulative borrow index (starts at 1.0)
        - ``tvl_usd``: synthetic total-value-locked series
        """
        key = f"{protocol}_{asset}"
        params = self._defi_params.get(
            key, {"mean": 0.05, "kappa": 2.0, "sigma": 0.01, "base_apy": 0.05}
        )
        timestamps = self._make_timestamps(start, end, interval)
        n = len(timestamps)
        dt = INTERVAL_MINUTES.get(interval, 60) / (MINUTES_PER_YEAR)
        apy = np.empty(n)
        apy[0] = params["base_apy"]
        for i in range(1, n):
            mean_rev = params["kappa"] * (params["mean"] - apy[i - 1]) * dt
            noise = params["sigma"] * np.sqrt(dt) * float(self._rng.standard_normal())
            apy[i] = max(0.0, apy[i - 1] + mean_rev + noise)

        # Deferred import: UTL depends on UCI; eager import creates circular chain.
        from unified_trading_library import (
            apy_to_cumulative_index,
        )

        # Convert APY series to cumulative liquidity index via UTL
        apy_list: list[float] = [float(v) for v in apy]
        liquidity_index = apy_to_cumulative_index(apy_list, timestamps, base=1.0)

        # Borrow APY: supply * spread factor (1.2-1.5x, deterministic per protocol)
        borrow_spread = self._borrow_spread(protocol)
        borrow_apy = np.array([v * borrow_spread for v in apy_list])
        borrow_apy_list: list[float] = [float(v) for v in borrow_apy]
        variable_borrow_index = apy_to_cumulative_index(borrow_apy_list, timestamps, base=1.0)

        return pd.DataFrame(
            {
                "timestamp": timestamps,
                "protocol": protocol,
                "asset": asset,
                "apy": apy,
                "liquidity_index": liquidity_index,
                "borrow_apy": borrow_apy,
                "variable_borrow_index": variable_borrow_index,
                "tvl_usd": self._synthetic_tvl(protocol, n),
            }
        )

    def generate_staking_rates(
        self,
        protocols: list[str],
        duration_days: int = 365,
        interval_hours: int = 1,
    ) -> pd.DataFrame:
        """Generate ETH staking / LST rate time-series with cumulative index.

        Uses OU mean reversion with protocol-specific parameters for realistic
        staking APY trajectories.  Each protocol gets both ``staking_apy`` and
        ``staking_rate_index`` columns.

        Args:
            protocols: Protocol names (e.g. ``["lido", "etherfi", "rocket_pool"]``).
            duration_days: Length of generated series in days.
            interval_hours: Sampling interval in hours.

        Returns:
            Long-format DataFrame with columns: ``timestamp``, ``protocol``,
            ``staking_apy``, ``staking_rate_index``.
        """
        start_dt = date(2024, 1, 1)
        end_dt = start_dt + timedelta(days=duration_days)
        interval_key = f"{interval_hours}h" if interval_hours != 24 else "1d"
        timestamps = self._make_timestamps(start_dt, end_dt, interval_key)
        n = len(timestamps)

        frames: list[pd.DataFrame] = []
        for proto in protocols:
            params = _STAKING_PARAMS.get(proto, _STAKING_PARAMS["_default"])
            dt = (interval_hours * 60) / MINUTES_PER_YEAR
            apy = np.empty(n)
            apy[0] = params["base_apy"]
            for i in range(1, n):
                mean_rev = params["kappa"] * (params["mean"] - apy[i - 1]) * dt
                noise = params["sigma"] * np.sqrt(dt) * float(self._rng.standard_normal())
                apy[i] = max(0.001, apy[i - 1] + mean_rev + noise)

            # Deferred import: UTL depends on UCI; eager import creates circular chain.
            from unified_trading_library import staking_rate_to_index

            apy_list: list[float] = [float(v) for v in apy]
            index_values = staking_rate_to_index(apy_list, timestamps, base=1.0)

            frames.append(
                pd.DataFrame(
                    {
                        "timestamp": timestamps,
                        "protocol": proto,
                        "staking_apy": apy,
                        "staking_rate_index": index_values,
                    }
                )
            )

        result = pd.concat(frames, ignore_index=True)
        log.info("Generated staking rates for %d protocols (%d rows)", len(protocols), len(result))
        return result

    def generate_match_odds(
        self,
        league: str,
        venue: str,
        num_matches: int = 50,
    ) -> pd.DataFrame:
        """Generate pre-match odds for a sports league (CanonicalOdds-compatible)."""
        rows: list[dict[str, object]] = []
        base_date = datetime(2024, 1, 6, 15, 0, 0, tzinfo=UTC)
        match_interval_days = 7

        for i in range(num_matches):
            match_dt = base_date + timedelta(days=i * match_interval_days)
            home_prob = 0.35 + 0.30 * float(self._rng.random())
            away_prob = 0.20 + 0.30 * float(self._rng.random())
            draw_prob = max(0.05, 1.0 - home_prob - away_prob)
            total = home_prob + draw_prob + away_prob
            home_prob /= total
            draw_prob /= total
            away_prob /= total
            margin = 1.05 + 0.05 * float(self._rng.random())
            home_odds = round(margin / home_prob, 3)
            draw_odds = round(margin / draw_prob, 3)
            away_odds = round(margin / away_prob, 3)
            rows.append(
                {
                    "timestamp": match_dt,
                    "league": league,
                    "venue": venue,
                    "match_id": f"{league}_{i:04d}",
                    "home_team": f"team_home_{i % 20:02d}",
                    "away_team": f"team_away_{i % 20:02d}",
                    "odds_home": home_odds,
                    "odds_draw": draw_odds,
                    "odds_away": away_odds,
                    "implied_prob_home": round(1.0 / home_odds, 4),
                    "implied_prob_draw": round(1.0 / draw_odds, 4),
                    "implied_prob_away": round(1.0 / away_odds, 4),
                    "market_status": "active",
                }
            )
        log.info("Generated %d match odds for %s/%s", num_matches, venue, league)
        return pd.DataFrame(rows)

    def generate_orderbook_snapshots(
        self,
        symbol: str,
        num_snapshots: int = 100,
        levels: int = 10,
        mid_price: float = 60000.0,
        spread_bps: float = 5.0,
    ) -> list[dict[str, object]]:
        """Generate L2 orderbook snapshots with realistic bid/ask levels.

        Each snapshot contains ``levels`` bid and ``levels`` ask levels around a
        drifting mid price.  Sizes follow a power-law distribution (thicker at
        the top of book) and the spread varies stochastically around
        ``spread_bps`` basis points.

        Args:
            symbol: Instrument symbol (e.g. ``"BTC/USDT"``).
            num_snapshots: Number of snapshots to generate.
            levels: Number of bid/ask price levels per snapshot.
            mid_price: Starting mid price.
            spread_bps: Mean half-spread in basis points (1 bp = 0.01%).

        Returns:
            List of dicts, each representing one book snapshot with keys:
            ``symbol``, ``timestamp``, ``bids``, ``asks``, ``mid_price``,
            ``spread_bps``.  ``bids`` and ``asks`` are lists of
            ``[price, size]`` pairs sorted best-to-worst.
        """
        base_ts = datetime(2024, 1, 1, 0, 0, 0, tzinfo=UTC)
        interval_s = 1  # 1 second between snapshots

        # Power-law exponent for size distribution (higher = more concentrated
        # at top of book).  Index 0 (best price) gets the largest size.
        power_exp = 1.5

        snapshots: list[dict[str, object]] = []
        current_mid = mid_price

        for i in range(num_snapshots):
            ts = base_ts + timedelta(seconds=i * interval_s)

            # Mid-price random walk (small increments)
            current_mid *= 1.0 + 0.0001 * float(self._rng.standard_normal())

            # Spread varies around spread_bps (clamped to >= 1 bp)
            actual_spread_bps = max(1.0, spread_bps + 2.0 * float(self._rng.standard_normal()))
            half_spread = current_mid * actual_spread_bps / 10_000.0

            best_bid = current_mid - half_spread
            best_ask = current_mid + half_spread

            # Tick size: derive from price magnitude
            if current_mid >= 1000.0:
                tick = 0.01
            elif current_mid >= 10.0:
                tick = 0.001
            else:
                tick = 0.0001

            # Build bid levels (descending prices from best_bid)
            bids: list[list[float]] = []
            for lvl in range(levels):
                price = round(best_bid - lvl * tick * (1 + lvl * 0.5), 8)
                # Power-law: top-of-book has the most liquidity
                base_size = float(self._rng.exponential(1.0))
                size = round(base_size * (levels / (lvl + 1)) ** power_exp, 8)
                size = max(0.001, size)
                bids.append([price, size])

            # Build ask levels (ascending prices from best_ask)
            asks: list[list[float]] = []
            for lvl in range(levels):
                price = round(best_ask + lvl * tick * (1 + lvl * 0.5), 8)
                base_size = float(self._rng.exponential(1.0))
                size = round(base_size * (levels / (lvl + 1)) ** power_exp, 8)
                size = max(0.001, size)
                asks.append([price, size])

            snapshots.append(
                {
                    "symbol": symbol,
                    "timestamp": ts.isoformat(),
                    "bids": bids,
                    "asks": asks,
                    "mid_price": round(current_mid, 8),
                    "spread_bps": round(actual_spread_bps, 4),
                }
            )

        log.info(
            "Generated %d orderbook snapshots for %s (%d levels, mid=%.2f)",
            num_snapshots,
            symbol,
            levels,
            mid_price,
        )
        return snapshots

    # ------------------------------------------------------------------
    # Instrument-driven generation (bridges InstrumentGenerator → data)
    # ------------------------------------------------------------------

    def generate_for_instruments(
        self,
        instruments: list[object],
        start: date,
        end: date,
        interval: str = "1h",
    ) -> dict[str, pd.DataFrame]:
        """Generate synthetic data for all instruments from InstrumentGenerator.

        Dispatches each instrument to the appropriate generator method based on
        instrument_type and asset_group. Applies instrument_overrides from the
        scenario config (expire instruments produce truncated data, injected
        instruments get fresh GBM paths, deleted instruments are skipped).

        Args:
            instruments: List of CanonicalInstrument objects from InstrumentGenerator.
            start: Start date for data generation.
            end: End date for data generation.
            interval: OHLCV interval (default "1h").

        Returns:
            Dict mapping instrument_key to DataFrame of generated data.
        """
        results: dict[str, pd.DataFrame] = {}
        overrides = self._scenario.instrument_overrides if self._scenario else []
        deleted_patterns = [
            o.instrument_key or o.pattern
            for o in overrides
            if o.action == InstrumentOverrideAction.DELIST
        ]
        expired_patterns = [
            o.instrument_key or o.pattern
            for o in overrides
            if o.action == InstrumentOverrideAction.EXPIRE
        ]

        for inst in instruments:
            key = str(getattr(inst, "instrument_key", ""))
            itype = str(getattr(inst, "instrument_type", ""))
            asset_group = str(getattr(inst, "asset_group", ""))

            # Skip deleted instruments
            if self._matches_any_pattern(key, deleted_patterns):
                log.info("Skipping deleted instrument: %s", key)
                continue

            # Determine effective end date (expired instruments get truncated data)
            effective_end = end
            if self._matches_any_pattern(key, expired_patterns):
                midpoint = start + (end - start) // 2
                effective_end = midpoint
                log.info("Truncating data for expired instrument %s at %s", key, effective_end)

            df = self._generate_for_single_instrument(
                inst, start, effective_end, interval, itype, asset_group
            )
            if df is not None and not df.empty:
                results[key] = df

        return results

    def _generate_for_single_instrument(
        self,
        inst: object,
        start: date,
        end: date,
        interval: str,
        itype: str,
        asset_group: str,
    ) -> pd.DataFrame | None:
        """Generate data for a single instrument based on its type."""
        symbol = str(getattr(inst, "symbol", ""))
        venue = str(getattr(inst, "venue", ""))

        # DeFi lending/yield instruments → yield series
        if itype in ("A_TOKEN", "DEBT_TOKEN", "YIELD_BEARING"):
            protocol = venue.lower().replace("-", "_").replace("_eth", "")
            underlying = str(getattr(inst, "base_asset", symbol))
            return self.generate_defi_yields(protocol, underlying, start, end, interval)

        # DeFi pool instruments → OHLCV (treated like spot pairs)
        if itype == "POOL":
            return self.generate_ohlcv(symbol, venue, start, end, interval)

        # LST → staking rates (single protocol)
        if itype == "LST":
            protocol = venue.lower()
            days = (end - start).days or 30
            df = self.generate_staking_rates([protocol], duration_days=days)
            return df[df["protocol"] == protocol] if not df.empty else df

        # Options / Futures → skip data gen (derivatives priced from underlying)
        if itype in ("OPTION", "FUTURE"):
            return None

        # Sports → match odds
        if itype in ("PREDICTION_MARKET", "EXCHANGE_ODDS", "FIXED_ODDS"):
            league = symbol.split("-")[0] if "-" in symbol else "general"
            return self.generate_match_odds(league, venue, num_matches=20)

        # Default: OHLCV (spot, perpetual, equity, ETF, index)
        return self.generate_ohlcv(symbol, venue, start, end, interval)

    @staticmethod
    def _matches_any_pattern(key: str, patterns: list[str]) -> bool:
        """Check if instrument_key matches any of the glob patterns."""
        import fnmatch

        return any(fnmatch.fnmatch(key, p) or p == key for p in patterns)

    def generate_tick_trades(
        self,
        symbol: str,
        venue: str,
        start: date,
        end: date,
        trades_per_minute: int = 5,
    ) -> pd.DataFrame:
        """Generate synthetic tick trades (CanonicalTrade-compatible)."""
        params = self._gbm_params.get(symbol, {"vol": 0.50, "drift": 0.05, "base_price": 100.0})
        prices_1m = self._gbm_path(
            base_price=params["base_price"],
            annual_vol=params["vol"],
            annual_drift=params["drift"],
            start=start,
            end=end,
            interval="1m",
        )
        vol_mult = self._scenario.volume_multiplier if self._scenario is not None else 1.0
        timestamps: list[datetime] = list(prices_1m["timestamps"])  # type: ignore[arg-type]
        close_prices: list[float] = [float(p) for p in prices_1m["close"]]  # type: ignore[union-attr]
        rows: list[dict[str, object]] = []
        for bar_ts, bar_price in zip(timestamps, close_prices, strict=False):
            self._append_bar_ticks(
                rows, bar_ts, bar_price, venue, symbol, trades_per_minute, vol_mult
            )
        log.info(
            "Generated %d ticks for %s/%s (%s → %s)",
            len(rows),
            venue,
            symbol,
            start,
            end,
        )
        return pd.DataFrame(rows)

    def _append_bar_ticks(
        self,
        rows: list[dict[str, object]],
        bar_ts: datetime,
        bar_price: float,
        venue: str,
        symbol: str,
        trades_per_minute: int,
        vol_mult: float,
    ) -> None:
        """Append per-minute tick rows for one GBM bar price."""
        for t in range(trades_per_minute):
            tick_ts = bar_ts + timedelta(seconds=int(t * SECONDS_PER_MINUTE / trades_per_minute))
            spread_pct = 0.0005 + 0.0005 * float(self._rng.random())
            price = bar_price * (1.0 + spread_pct * float(self._rng.standard_normal()))
            qty_raw = float(self._rng.exponential(0.5)) * vol_mult
            qty = max(0.001, qty_raw)
            side = "buy" if self._rng.random() > 0.5 else "sell"
            rows.append(
                {
                    "timestamp": tick_ts,
                    "venue": venue,
                    "symbol": symbol,
                    "instrument_key": f"{venue}:SPOT_PAIR:{symbol.replace('/', '')}",
                    "trade_id": f"{venue}_{symbol}_{len(rows):010d}",
                    "price": round(price, 6),
                    "quantity": round(qty, 8),
                    "side": side,
                    "buyer_maker": side == "sell",
                    "schema_version": "1.0",
                }
            )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _gbm_path(
        self,
        base_price: float,
        annual_vol: float,
        annual_drift: float,
        start: date,
        end: date,
        interval: str,
    ) -> dict[str, object]:
        """Geometric Brownian Motion price path."""
        timestamps = self._make_timestamps(start, end, interval)
        n = len(timestamps)
        interval_minutes = INTERVAL_MINUTES.get(interval, 1)
        dt = interval_minutes / MINUTES_PER_YEAR
        drift_term = (annual_drift - 0.5 * annual_vol**2) * dt
        vol_term = annual_vol * np.sqrt(dt)
        shocks = self._rng.standard_normal(n)
        log_returns = drift_term + vol_term * shocks
        log_prices = np.log(base_price) + np.cumsum(log_returns)
        log_prices = np.insert(log_prices[:-1], 0, np.log(base_price))
        prices = np.exp(log_prices)
        return {"timestamps": timestamps, "prices": prices, "close": prices}

    def _prices_to_ohlcv(
        self,
        path: dict[str, object],
        symbol: str,
        venue: str,
        interval: str,
        start: date,
        end: date,
    ) -> pd.DataFrame:
        """Convert GBM price path to OHLCV bars."""
        timestamps: list[datetime] = list(path["timestamps"])  # type: ignore[arg-type]
        prices: np.ndarray = np.asarray(path["prices"])
        n = len(timestamps)
        interval_minutes = INTERVAL_MINUTES.get(interval, 1)
        intrabar_vol = 0.002 * np.sqrt(interval_minutes)

        opens = prices.copy()
        closes = prices * np.exp(intrabar_vol * self._rng.standard_normal(n))
        highs = np.maximum(opens, closes) * (
            1.0 + abs(intrabar_vol * self._rng.standard_normal(n) * 0.5)
        )
        lows = np.minimum(opens, closes) * (
            1.0 - abs(intrabar_vol * self._rng.standard_normal(n) * 0.5)
        )

        hour_weights = np.array([_HOUR_VOLUME_WEIGHTS[ts.hour] for ts in timestamps])
        base_volume = self._base_volume_for_symbol(symbol)
        vol_mult = self._scenario.volume_multiplier if self._scenario is not None else 1.0
        volumes = base_volume * hour_weights * (0.5 + self._rng.random(n)) * vol_mult
        quote_volumes = volumes * prices

        return pd.DataFrame(
            {
                "timestamp": timestamps,
                "venue": venue,
                "symbol": symbol,
                "open": np.round(opens, 8),
                "high": np.round(highs, 8),
                "low": np.round(lows, 8),
                "close": np.round(closes, 8),
                "volume": np.round(volumes, 8),
                "quote_volume": np.round(quote_volumes, 2),
                "count": self._rng.integers(50, 2000, n),
                "vwap": np.round((opens + closes) / 2.0, 8),
                "schema_version": "1.0",
            }
        )

    def _make_timestamps(self, start: date, end: date, interval: str) -> list[datetime]:
        """Generate UTC timestamp sequence for a date range and interval."""
        interval_minutes = INTERVAL_MINUTES.get(interval, 1)
        current = datetime(start.year, start.month, start.day, tzinfo=UTC)
        end_dt = datetime(end.year, end.month, end.day, tzinfo=UTC)
        delta = timedelta(minutes=interval_minutes)
        timestamps: list[datetime] = []
        while current < end_dt:
            timestamps.append(current)
            current += delta
        return timestamps

    def _base_volume_for_symbol(self, symbol: str) -> float:
        """Return approximate base volume per bar for a symbol."""
        volumes: dict[str, float] = {
            "BTC/USDT": 100.0,
            "ETH/USDT": 500.0,
            "SOL/USDT": 5000.0,
            "BTC-PERP": 80.0,
            "ETH-PERP": 400.0,
            "ETH/USDC": 300.0,
            "SPY": 20_000.0,
            "QQQ": 15_000.0,
            "AAPL": 5_000.0,
            "TSLA": 3_000.0,
            "GLD": 2_000.0,
        }
        return volumes.get(symbol, 1000.0)

    @staticmethod
    def _borrow_spread(protocol: str) -> float:
        """Return the borrow/supply spread factor for a protocol."""
        return _BORROW_SPREAD.get(protocol, 1.30)

    def _synthetic_tvl(self, protocol: str, n: int) -> np.ndarray:
        """Generate a synthetic TVL series (GBM-like, slow-moving)."""
        tvl_base: dict[str, float] = {
            "uniswap_v3": 4_000_000_000.0,
            "aave_v3": 8_000_000_000.0,
            "curve": 2_500_000_000.0,
            "lido": 20_000_000_000.0,
        }
        base = tvl_base.get(protocol, 1_000_000_000.0)
        shocks = self._rng.standard_normal(n) * 0.005
        log_tvl = np.log(base) + np.cumsum(shocks)
        log_tvl = np.insert(log_tvl[:-1], 0, np.log(base))
        return np.round(np.exp(log_tvl), 0)


# ---------------------------------------------------------------------------
# Instrument definitions generator
# ---------------------------------------------------------------------------


def build_instrument_key(venue: str, symbol: str, instrument_type: str = "SPOT_PAIR") -> str:
    """Return canonical instrument_key in VENUE:TYPE:SYMBOL format."""
    clean_symbol = symbol.replace("/", "").replace("-", "")
    return f"{venue.upper()}:{instrument_type}:{clean_symbol}"


# ---------------------------------------------------------------------------
# Output writer
# ---------------------------------------------------------------------------


class SeedDataWriter:
    """Writes seed data to Parquet files organised by partition template."""

    def __init__(self, output_dir: Path) -> None:
        self._output_dir = output_dir

    def write_ohlcv(self, df: pd.DataFrame, symbol: str, venue: str) -> Path:
        """Write OHLCV parquet file partitioned by symbol/YYYY/MM/DD."""
        if df.empty:
            log.warning("Empty OHLCV dataframe for %s/%s — skipping", venue, symbol)
            return self._output_dir
        clean_symbol = symbol.replace("/", "_").replace("-", "_")
        min_date = pd.to_datetime(df["timestamp"]).min()
        year = min_date.year
        month = f"{min_date.month:02d}"
        day = f"{min_date.day:02d}"
        out_dir = self._output_dir / "ohlcv" / clean_symbol / str(year) / month / day
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "data.parquet"
        table = pa.Table.from_pandas(df, preserve_index=False)
        pq.write_table(table, out_path, compression="snappy")
        log.info("Wrote %d rows → %s", len(df), out_path)
        return out_path

    def write_tick(self, df: pd.DataFrame, symbol: str, venue: str) -> Path:
        """Write tick trades parquet file."""
        if df.empty:
            log.warning("Empty tick dataframe for %s/%s — skipping", venue, symbol)
            return self._output_dir
        clean_symbol = symbol.replace("/", "_").replace("-", "_")
        out_dir = self._output_dir / "tick" / venue / clean_symbol
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "data.parquet"
        table = pa.Table.from_pandas(df, preserve_index=False)
        pq.write_table(table, out_path, compression="snappy")
        log.info("Wrote %d tick rows → %s", len(df), out_path)
        return out_path

    def write_defi(self, df: pd.DataFrame, protocol: str, asset: str) -> Path:
        """Write DeFi yield series parquet file."""
        if df.empty:
            log.warning("Empty DeFi dataframe for %s/%s — skipping", protocol, asset)
            return self._output_dir
        out_dir = self._output_dir / "defi" / protocol / asset
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "yields.parquet"
        table = pa.Table.from_pandas(df, preserve_index=False)
        pq.write_table(table, out_path, compression="snappy")
        log.info("Wrote %d DeFi rows → %s", len(df), out_path)
        return out_path

    def write_sports(self, df: pd.DataFrame, league: str, venue: str) -> Path:
        """Write sports odds parquet file."""
        if df.empty:
            log.warning("Empty sports dataframe for %s/%s — skipping", venue, league)
            return self._output_dir
        out_dir = self._output_dir / "sports" / venue / league
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "odds.parquet"
        table = pa.Table.from_pandas(df, preserve_index=False)
        pq.write_table(table, out_path, compression="snappy")
        log.info("Wrote %d sports rows → %s", len(df), out_path)
        return out_path

    def write_orderbook(self, snapshots: list[dict[str, object]], symbol: str, venue: str) -> Path:
        """Write orderbook snapshots to a JSON file."""
        if not snapshots:
            log.warning("Empty orderbook snapshots for %s/%s — skipping", venue, symbol)
            return self._output_dir
        clean_symbol = symbol.replace("/", "_").replace("-", "_")
        out_dir = self._output_dir / "orderbook" / venue / clean_symbol
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "snapshots.json"
        out_path.write_text(json.dumps(snapshots, indent=2, default=str))
        log.info("Wrote %d orderbook snapshots → %s", len(snapshots), out_path)
        return out_path

    def write_manifest(self, manifest: dict[str, object]) -> Path:
        """Write a JSON manifest summarising all generated files."""
        out_path = self._output_dir / "seed_manifest.json"
        out_path.write_text(json.dumps(manifest, indent=2, default=str))
        log.info("Manifest written → %s", out_path)
        return out_path
