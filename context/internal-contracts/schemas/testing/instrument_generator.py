"""Registry-driven instrument generator — SSOT is UAC representative_sample.

Every instrument spec lives in UAC registry/representative_sample.py.
This generator is a thin reader of that registry + venue-specific formatting
rules (Deribit expiry strings, CME month codes, deterministic pool addresses).

Supports full instrument lifecycle simulation:
  - Generate from registry (Layer 1)
  - Inject/expire/delist via ScenarioConfig.instrument_overrides (Layer 2)
  - Runtime CRUD via API (Layer 3)

Usage:
    gen = InstrumentGenerator(seed=42)
    instruments = gen.generate_all(ref_date=date(2025, 1, 15))

    # Ad-hoc: create a custom strike
    custom = gen.create_instrument(
        venue="DERIBIT", instrument_type="OPTION", symbol="BTC-28MAR25-100000-C",
        base_asset="BTC", quote_asset="USD", strike=100000.0,
        option_type="CALL", expiry=datetime(2025, 3, 28, 8, 0, 0, tzinfo=UTC),
    )

    # Ad-hoc: expire an instrument mid-session
    gen.expire_instrument("DERIBIT:OPTION:BTC-28MAR25-60000-C")

    # Ad-hoc: delete an instrument entirely
    gen.delete_instrument("BINANCE-SPOT:SPOT_PAIR:SOL-USDT")
"""

from __future__ import annotations

import calendar
import fnmatch
from datetime import UTC, date, datetime, timedelta

import numpy as np
from unified_api_contracts import CanonicalInstrument, InstrumentType, OptionType
from unified_api_contracts.registry.representative_sample import (
    CEFI_FUTURES_SPECS,
    CEFI_PERPETUAL_SPECS,
    CEFI_SPOT_SPECS,
    CME_MONTH_CODES,
    DEFI_INSTRUMENT_SPECS,
    OPTIONS_CHAIN_CONFIG,
    QUARTERLY_MONTHS,
    SPORTS_INSTRUMENT_SPECS,
    TRADFI_EQUITY_SPECS,
    TRADFI_FUTURES_SPECS,
)

# ---------------------------------------------------------------------------
# Date helpers
# ---------------------------------------------------------------------------


def _last_friday_of_month(year: int, month: int) -> date:
    """Return the last Friday of the given month/year."""
    last_day = calendar.monthrange(year, month)[1]
    d = date(year, month, last_day)
    offset = (d.weekday() - 4) % 7
    return d - timedelta(days=offset)


def _next_quarterly_expiries(ref: date, count: int = 3) -> list[date]:
    """Return the next *count* quarterly expiry dates."""
    expiries: list[date] = []
    year, month = ref.year, ref.month
    for _scan in range(count + 8):
        for qm in QUARTERLY_MONTHS:
            if qm >= month or year > ref.year:
                exp = _last_friday_of_month(year, qm)
                if exp > ref and exp not in expiries:
                    expiries.append(exp)
                    if len(expiries) >= count:
                        return expiries
        year += 1
        month = 1
    return expiries


def _next_weekly_expiries(ref: date, count: int = 4) -> list[date]:
    """Return the next *count* Friday expiry dates (weekly)."""
    expiries: list[date] = []
    d = ref + timedelta(days=(4 - ref.weekday()) % 7 or 7)
    while len(expiries) < count:
        expiries.append(d)
        d += timedelta(weeks=1)
    return expiries


def _next_monthly_expiries(ref: date, count: int = 3) -> list[date]:
    """Return the next *count* monthly expiries (last Friday of month)."""
    expiries: list[date] = []
    year, month = ref.year, ref.month
    for _scan in range(count + 6):
        month += 1
        if month > 12:
            month = 1
            year += 1
        exp = _last_friday_of_month(year, month)
        if exp > ref:
            expiries.append(exp)
            if len(expiries) >= count:
                break
    return expiries


def _format_deribit_expiry(d: date) -> str:
    """Format a date as Deribit expiry string: DDMMMYY (e.g. 28MAR25)."""
    return f"{d.day}{d.strftime('%b').upper()}{d.strftime('%y')}"


def _make_timestamp(d: date) -> datetime:
    """Create a timestamp for the given date."""
    return datetime(d.year, d.month, d.day, 12, 0, 0, tzinfo=UTC)


def _parse_date(s: str) -> datetime:
    """Parse YYYY-MM-DD string to aware datetime."""
    parts = s.split("-")
    return datetime(int(parts[0]), int(parts[1]), int(parts[2]), tzinfo=UTC)


def _deterministic_address(rng: np.random.Generator) -> str:
    """Generate a deterministic Ethereum-like address."""
    raw_bytes: bytes = rng.bytes(20)
    return "0x" + raw_bytes.hex()


def _defi_data_types(itype: InstrumentType, venue: str) -> list[str]:
    """Return data_types for a DeFi instrument based on type and venue."""
    if itype == InstrumentType.POOL and venue not in ("COMPOUND_V3_ETH", "EULER-ETH"):
        return ["apy", "tvl", "liquidity"] if venue == "CURVE-ETH" else ["ohlcv", "liquidity"]
    return ["apy", "tvl"]


# ---------------------------------------------------------------------------
# InstrumentGenerator — registry-driven, full lifecycle support
# ---------------------------------------------------------------------------


class InstrumentGenerator:
    """Registry-driven instrument generator with full lifecycle support.

    All instrument specs come from UAC representative_sample registry.
    Supports create/expire/delete for ad-hoc scenario testing.
    """

    def __init__(self, seed: int = 42) -> None:
        self._seed = seed
        self._rng = np.random.default_rng(seed)
        self._adhoc: list[CanonicalInstrument] = []
        self._expired: set[str] = set()
        self._deleted: set[str] = set()

    # -- Ad-hoc lifecycle (Layer 3) -----------------------------------------

    def create_instrument(self, **kwargs: str | float | int | None) -> CanonicalInstrument:
        """Create a custom instrument and add it to the ad-hoc pool.

        Accepts any CanonicalInstrument field as a keyword argument.
        Useful for generating custom strikes, expiries, or entirely new instruments.
        """
        # Build instrument_key if not provided
        if "instrument_key" not in kwargs:
            venue = kwargs.get("venue", "UNKNOWN")
            itype = kwargs.get("instrument_type", "UNKNOWN")
            symbol = kwargs.get("symbol", "UNKNOWN")
            kwargs["instrument_key"] = f"{venue}:{itype}:{symbol}"
        # Ensure timestamp
        if "timestamp" not in kwargs:
            kwargs["timestamp"] = datetime.now(UTC)
        inst = CanonicalInstrument(**kwargs)  # type: ignore[arg-type]
        self._adhoc.append(inst)
        return inst

    def expire_instrument(self, key_or_pattern: str) -> int:
        """Expire instrument(s) by exact key or glob pattern.

        Sets available_to to now. Returns count of expired instruments.
        """
        self._expired.add(key_or_pattern)
        return 1

    def delete_instrument(self, key_or_pattern: str) -> int:
        """Delete instrument(s) entirely from generation output.

        Returns count of deleted instruments.
        """
        self._deleted.add(key_or_pattern)
        return 1

    def _is_deleted(self, key: str) -> bool:
        return any(pattern == key or fnmatch.fnmatch(key, pattern) for pattern in self._deleted)

    def _is_expired(self, key: str) -> bool:
        return any(pattern == key or fnmatch.fnmatch(key, pattern) for pattern in self._expired)

    def _apply_lifecycle(self, instruments: list[CanonicalInstrument]) -> list[CanonicalInstrument]:
        """Apply delete/expire lifecycle mutations."""
        result: list[CanonicalInstrument] = []
        now = datetime.now(UTC)
        for inst in instruments:
            if self._is_deleted(inst.instrument_key):
                continue
            if self._is_expired(inst.instrument_key):
                inst = inst.model_copy(update={"available_to_datetime": now})
            result.append(inst)
        result.extend(self._adhoc)
        return result

    # -- CeFi Spot ----------------------------------------------------------

    def generate_cefi_spot(self, ref_date: date) -> list[CanonicalInstrument]:
        """Generate CeFi spot instruments from registry."""
        ts = _make_timestamp(ref_date)
        instruments: list[CanonicalInstrument] = []
        for spec in CEFI_SPOT_SPECS:
            key = f"{spec['venue']}:{InstrumentType.SPOT_PAIR}:{spec['symbol']}"
            instruments.append(
                CanonicalInstrument(
                    instrument_key=key,
                    venue=spec["venue"],
                    instrument_type=InstrumentType.SPOT_PAIR,
                    symbol=spec["symbol"],
                    base_asset=spec["base"],
                    quote_asset=spec["quote"],
                    asset_group="crypto_cefi",
                    market_category="CEFI",
                    ccxt_symbol=spec.get("ccxt_symbol"),
                    ccxt_exchange=spec.get("ccxt_exchange"),
                    tick_size=0.01,
                    available_from_datetime=_parse_date(str(spec["available_from"])),
                    available_to_datetime=None,
                    timestamp=ts,
                    data_types=["ohlcv", "trades", "orderbook"],
                )
            )
        return instruments

    # -- CeFi Perpetuals ----------------------------------------------------

    def generate_cefi_perpetuals(self, ref_date: date) -> list[CanonicalInstrument]:
        """Generate CeFi perpetual instruments from registry."""
        ts = _make_timestamp(ref_date)
        instruments: list[CanonicalInstrument] = []
        for spec in CEFI_PERPETUAL_SPECS:
            key = f"{spec['venue']}:{InstrumentType.PERPETUAL}:{spec['symbol']}"
            instruments.append(
                CanonicalInstrument(
                    instrument_key=key,
                    venue=str(spec["venue"]),
                    instrument_type=InstrumentType.PERPETUAL,
                    symbol=str(spec["symbol"]),
                    base_asset=str(spec["base"]),
                    quote_asset=str(spec["quote"]),
                    asset_group="crypto_cefi",
                    market_category="CEFI",
                    exchange_raw_symbol=str(spec["raw_symbol"]),
                    tick_size=0.5,
                    max_leverage=10.0,
                    initial_margin_rate=0.1,
                    maintenance_margin_rate=0.05,
                    available_from_datetime=_parse_date(str(spec["available_from"])),
                    available_to_datetime=None,
                    timestamp=ts,
                    data_types=["ohlcv", "trades", "funding_rate"],
                )
            )
        return instruments

    # -- CeFi Futures -------------------------------------------------------

    def generate_cefi_futures(self, ref_date: date) -> list[CanonicalInstrument]:
        """Generate dated CeFi futures from registry + quarterly expiries."""
        ts = _make_timestamp(ref_date)
        expiries = _next_quarterly_expiries(ref_date, count=3)
        instruments: list[CanonicalInstrument] = []

        for spec in CEFI_FUTURES_SPECS:
            venue = spec["venue"]
            underlying = spec["underlying"]
            quote = spec.get("quote", "USD")
            for exp_date in expiries:
                exp_str = _format_deribit_expiry(exp_date)
                symbol = f"{underlying}-{exp_str}"
                key = f"{venue}:{InstrumentType.FUTURE}:{symbol}"
                expiry_dt = datetime(
                    exp_date.year, exp_date.month, exp_date.day, 8, 0, 0, tzinfo=UTC
                )
                instruments.append(
                    CanonicalInstrument(
                        instrument_key=key,
                        venue=venue,
                        instrument_type=InstrumentType.FUTURE,
                        symbol=symbol,
                        base_asset=underlying,
                        quote_asset=quote,
                        asset_group="crypto_cefi",
                        market_category="CEFI",
                        exchange_raw_symbol=symbol,
                        expiry=expiry_dt,
                        available_from_datetime=expiry_dt - timedelta(days=365),
                        available_to_datetime=None,
                        timestamp=ts,
                        data_types=["ohlcv", "trades"],
                    )
                )

        # CME futures from tradfi specs (shared with generate_tradfi)
        for tspec in TRADFI_FUTURES_SPECS:
            if tspec["venue"] != "CME":
                continue
            for exp_date in expiries:
                mc = CME_MONTH_CODES.get(exp_date.month)
                if mc is None:
                    continue
                yy = exp_date.strftime("%y")
                root = str(tspec["root"])
                cme_symbol = f"{root}{mc}{yy}"
                cme_key = f"CME:{InstrumentType.FUTURE}:{cme_symbol}"
                expiry_dt = datetime(
                    exp_date.year, exp_date.month, exp_date.day, 8, 0, 0, tzinfo=UTC
                )
                instruments.append(
                    CanonicalInstrument(
                        instrument_key=cme_key,
                        venue="CME",
                        instrument_type=InstrumentType.FUTURE,
                        symbol=cme_symbol,
                        base_asset=root,
                        quote_asset="USD",
                        asset_group="tradfi_futures",
                        market_category="TRADFI",
                        exchange_raw_symbol=cme_symbol,
                        contract_size=float(tspec["contract_size"]),
                        expiry=expiry_dt,
                        available_from_datetime=expiry_dt - timedelta(days=365),
                        available_to_datetime=None,
                        timestamp=ts,
                        data_types=["ohlcv", "trades"],
                    )
                )

        return instruments

    # -- Options Chain ------------------------------------------------------

    def generate_options_chain(
        self,
        ref_date: date,
        underlying: str | None = None,
        atm_price: float | None = None,
        strike_interval: int | None = None,
        strike_range_pct: float | None = None,
        weekly_count: int | None = None,
        monthly_count: int | None = None,
        quarterly_count: int | None = None,
    ) -> list[CanonicalInstrument]:
        """Generate a full options chain from registry config or custom params.

        All parameters are optional — defaults come from OPTIONS_CHAIN_CONFIG.
        Override any parameter to generate custom strikes/expiries for testing.
        """
        ts = _make_timestamp(ref_date)
        cfg = OPTIONS_CHAIN_CONFIG
        _underlying = underlying or str(cfg["underlying"])
        _atm = atm_price if atm_price is not None else float(cfg["atm_price_usd"])
        _interval = (
            strike_interval if strike_interval is not None else int(cfg["strike_interval_usd"])
        )
        _range = (
            strike_range_pct if strike_range_pct is not None else float(cfg["strike_range_pct"])
        )
        _weekly = weekly_count if weekly_count is not None else int(cfg["weekly_expiries"])
        _monthly = monthly_count if monthly_count is not None else int(cfg["monthly_expiries"])
        _quarterly = (
            quarterly_count if quarterly_count is not None else int(cfg["quarterly_expiries"])
        )

        low = int((_atm * (1 - _range)) // _interval) * _interval
        high = int((_atm * (1 + _range)) // _interval) * _interval
        strikes = list(range(low, high + _interval, _interval))

        weekly = _next_weekly_expiries(ref_date, count=_weekly)
        monthly = _next_monthly_expiries(ref_date, count=_monthly)
        quarterly = _next_quarterly_expiries(ref_date, count=_quarterly)
        all_expiries: list[date] = sorted(set(weekly) | set(monthly) | set(quarterly))

        instruments: list[CanonicalInstrument] = []
        for exp_date in all_expiries:
            exp_str = _format_deribit_expiry(exp_date)
            expiry_dt = datetime(exp_date.year, exp_date.month, exp_date.day, 8, 0, 0, tzinfo=UTC)
            listed = expiry_dt - timedelta(days=30 if exp_date not in quarterly else 365)
            for strike_val in strikes:
                for opt_type in (OptionType.CALL, OptionType.PUT):
                    cp = "C" if opt_type == OptionType.CALL else "P"
                    symbol = f"{_underlying}-{exp_str}-{strike_val}-{cp}"
                    key = f"DERIBIT:{InstrumentType.OPTION}:{symbol}"
                    instruments.append(
                        CanonicalInstrument(
                            instrument_key=key,
                            venue="DERIBIT",
                            instrument_type=InstrumentType.OPTION,
                            symbol=symbol,
                            base_asset=_underlying,
                            quote_asset="USD",
                            asset_group="crypto_cefi",
                            market_category="CEFI",
                            exchange_raw_symbol=symbol,
                            strike=float(strike_val),
                            option_type=opt_type,
                            expiry=expiry_dt,
                            underlying=_underlying,
                            available_from_datetime=listed,
                            available_to_datetime=None,
                            timestamp=ts,
                            data_types=["ohlcv", "trades"],
                        )
                    )
        return instruments

    # -- TradFi -------------------------------------------------------------

    def generate_tradfi(self, ref_date: date) -> list[CanonicalInstrument]:
        """Generate TradFi equities + futures from registry."""
        ts = _make_timestamp(ref_date)
        instruments: list[CanonicalInstrument] = []

        # Equities/ETFs/Indices from registry
        for spec in TRADFI_EQUITY_SPECS:
            itype = InstrumentType(spec["type"])
            key = f"{spec['venue']}:{itype}:{spec['symbol']}"
            instruments.append(
                CanonicalInstrument(
                    instrument_key=key,
                    venue=spec["venue"],
                    instrument_type=itype,
                    symbol=spec["symbol"],
                    base_asset=spec["symbol"],
                    quote_asset="USD",
                    asset_group=spec["asset_group"],
                    market_category="TRADFI",
                    tick_size=0.01,
                    trading_hours_open=spec.get("trading_hours_open"),
                    trading_hours_close=spec.get("trading_hours_close"),
                    regular_open_utc=spec.get("regular_open_utc"),
                    regular_close_utc=spec.get("regular_close_utc"),
                    holiday_calendar=spec.get("holiday_calendar"),
                    available_from_datetime=_parse_date(str(spec["available_from"])),
                    available_to_datetime=None,
                    timestamp=ts,
                    data_types=["ohlcv"] if spec["type"] == "INDEX" else ["ohlcv", "trades"],
                )
            )

        # CME future (first expiry, reuse from cefi_futures)
        cme_futures = [f for f in self.generate_cefi_futures(ref_date) if f.venue == "CME"]
        if cme_futures:
            instruments.append(cme_futures[0])

        # ICE/other TradFi futures from registry
        expiries = _next_quarterly_expiries(ref_date, count=3)
        for spec in TRADFI_FUTURES_SPECS:
            if spec["venue"] == "CME":
                continue  # already added via cefi_futures
            venue = str(spec["venue"])
            root = str(spec["root"])
            base = str(spec["base"])
            csz = float(spec["contract_size"])
            tsz = float(spec["tick_size"])
            for exp_date in expiries:
                mc = CME_MONTH_CODES.get(exp_date.month)
                if mc is None:
                    continue
                yy = exp_date.strftime("%y")
                symbol = f"{root}{mc}{yy}"
                key = f"{venue}:{InstrumentType.FUTURE}:{symbol}"
                expiry_dt = datetime(
                    exp_date.year, exp_date.month, exp_date.day, 20, 0, 0, tzinfo=UTC
                )
                instruments.append(
                    CanonicalInstrument(
                        instrument_key=key,
                        venue=venue,
                        instrument_type=InstrumentType.FUTURE,
                        symbol=symbol,
                        base_asset=base,
                        quote_asset="USD",
                        asset_group="tradfi_futures",
                        market_category="TRADFI",
                        exchange_raw_symbol=symbol,
                        contract_size=csz,
                        tick_size=tsz,
                        expiry=expiry_dt,
                        available_from_datetime=expiry_dt - timedelta(days=365),
                        available_to_datetime=None,
                        timestamp=ts,
                        data_types=["ohlcv", "trades"],
                    )
                )

        return instruments

    # -- DeFi ---------------------------------------------------------------

    def generate_defi(self, ref_date: date) -> list[CanonicalInstrument]:
        """Generate DeFi instruments from registry with deterministic addresses."""
        ts = _make_timestamp(ref_date)
        addr_rng = np.random.default_rng(self._seed + 1000)
        return [self._build_defi_instrument(spec, ts, addr_rng) for spec in DEFI_INSTRUMENT_SPECS]

    def _build_defi_instrument(
        self, spec: dict[str, str | float | int], ts: datetime, addr_rng: np.random.Generator
    ) -> CanonicalInstrument:
        venue = str(spec["venue"])
        symbol = str(spec["symbol"])
        itype = InstrumentType(str(spec["type"]))
        key = f"{venue}:{itype}:{symbol}"
        base = str(spec.get("base", spec.get("underlying", "")))
        quote = str(spec.get("quote", "USD"))

        inst_kwargs: dict[str, str | float | int | datetime | list[str] | None] = {
            "instrument_key": key,
            "venue": venue,
            "instrument_type": itype,
            "symbol": str(spec.get("display", symbol)) if spec.get("display") else symbol,
            "base_asset": base,
            "quote_asset": quote,
            "asset_group": "crypto_defi",
            "market_category": "DEFI",
            "pool_address": _deterministic_address(addr_rng),
            "available_from_datetime": _parse_date(str(spec["available_from"])),
            "available_to_datetime": None,
            "timestamp": ts,
        }

        if "ltv" in spec:
            inst_kwargs["ltv"] = float(spec["ltv"])
        if "liq_threshold" in spec:
            inst_kwargs["liquidation_threshold"] = float(spec["liq_threshold"])
        if "fee_tier" in spec:
            inst_kwargs["pool_fee_tier"] = str(spec["fee_tier"])
        if itype == InstrumentType.LST and "underlying" in spec:
            inst_kwargs["underlying"] = str(spec["underlying"])
        if "staked_underlying" in spec:
            inst_kwargs["underlying"] = str(spec["staked_underlying"])
        inst_kwargs["data_types"] = _defi_data_types(itype, venue)

        return CanonicalInstrument(**inst_kwargs)  # type: ignore[arg-type]

    # -- Sports -------------------------------------------------------------

    def generate_sports(self, ref_date: date) -> list[CanonicalInstrument]:
        """Generate sports/prediction market instruments from registry."""
        ts = _make_timestamp(ref_date)
        sport_rng = np.random.default_rng(self._seed + 2000)
        instruments: list[CanonicalInstrument] = []

        for spec in SPORTS_INSTRUMENT_SPECS:
            venue = spec["venue"]
            symbol = spec["symbol"]
            itype = InstrumentType(spec["type"])
            key = f"{venue}:{itype}:{symbol}"

            asset_group = spec.get("asset_group", "sports")
            market_cat = "PREDICTION" if asset_group == "prediction" else "SPORTS"
            inst_kwargs: dict[str, str | float | int | datetime | list[str] | None] = {
                "instrument_key": key,
                "venue": venue,
                "instrument_type": itype,
                "symbol": symbol,
                "asset_group": asset_group,
                "market_category": market_cat,
                "timestamp": ts,
                "available_from_datetime": _parse_date(spec["available_from"]),
            }
            if "available_to" in spec:
                inst_kwargs["available_to_datetime"] = _parse_date(spec["available_to"])

            # Venue-specific IDs
            if "condition_id" in spec:
                inst_kwargs["pool_id"] = spec["condition_id"]
                inst_kwargs["data_types"] = ["odds", "volume"]
            elif itype == InstrumentType.EXCHANGE_ODDS:
                market_id_bytes: bytes = sport_rng.bytes(8)
                inst_kwargs["pool_id"] = str(
                    int.from_bytes(market_id_bytes[:4], "big") % 10_000_000
                )
                inst_kwargs["venue_type"] = spec.get("venue_type")
                inst_kwargs["data_types"] = ["match_odds", "in_play"]
            elif itype == InstrumentType.FIXED_ODDS:
                event_id_bytes: bytes = sport_rng.bytes(8)
                inst_kwargs["pool_id"] = str(int.from_bytes(event_id_bytes[:4], "big") % 10_000_000)
                inst_kwargs["venue_type"] = spec.get("venue_type")
                inst_kwargs["data_types"] = ["odds"]

            instruments.append(CanonicalInstrument(**inst_kwargs))  # type: ignore[arg-type]

        return instruments

    # -- Aggregate ----------------------------------------------------------

    def generate_all(
        self,
        ref_date: date,
        include_options_chain: bool = True,
        options_underlying: str = "BTC",
    ) -> list[CanonicalInstrument]:
        """Generate instruments from all asset classes.

        Applies lifecycle mutations (expire/delete) and includes ad-hoc instruments.
        """
        combined: list[CanonicalInstrument] = []
        combined.extend(self.generate_cefi_spot(ref_date))
        combined.extend(self.generate_cefi_perpetuals(ref_date))
        combined.extend(self.generate_cefi_futures(ref_date))
        if include_options_chain:
            combined.extend(self.generate_options_chain(ref_date, underlying=options_underlying))
        combined.extend(self.generate_tradfi(ref_date))
        combined.extend(self.generate_defi(ref_date))
        combined.extend(self.generate_sports(ref_date))

        # Deduplicate by instrument_key (first occurrence wins)
        seen: set[str] = set()
        deduplicated: list[CanonicalInstrument] = []
        for inst in combined:
            if inst.instrument_key not in seen:
                seen.add(inst.instrument_key)
                deduplicated.append(inst)

        return self._apply_lifecycle(deduplicated)
