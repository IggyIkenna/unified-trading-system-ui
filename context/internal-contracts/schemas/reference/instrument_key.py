"""Canonical instrument key — VENUE:INSTRUMENT_TYPE:SYMBOL format.

This is the UIC SSOT for InstrumentKey. Service-specific adapters (e.g.,
unified-domain-client) re-export from here and may add venue-specific
utility methods (e.g., parse_for_tardis is included here since
market-data services depend on it via unified_internal_contracts).

Import direction: service code should import InstrumentKey from
``unified_internal_contracts`` (top-level) or from this module directly.
"""

from __future__ import annotations

from dataclasses import dataclass

# Venue → Tardis exchange name mapping (static, inlined from UCI VenueMapping.tardis_to_venue).
# Inversion picks the first Tardis exchange per canonical venue (many-to-one → first wins).
# Venues not in the map fall back to venue.lower() in parse_for_tardis().
#
# NOTE: This map is inlined rather than imported from unified-config-interface to avoid
# a T0→T1 backward dependency (UIC is T0, UCI is T1). VenueMapping itself should eventually
# move to UAC (external venue identity), tracked in cicd_code_rollout_master plan.
_VENUE_TO_TARDIS: dict[str, str] = {
    "BINANCE-SPOT": "binance",
    "BINANCE-FUTURES": "binance-futures",
    "DERIBIT": "deribit",
    "BYBIT": "bybit",
    "OKX": "okex",
    "UPBIT": "upbit",
    "COINBASE": "coinbase",
}


@dataclass
class InstrumentKey:
    """Instrument key following VENUE:INSTRUMENT_TYPE:SYMBOL format.

    Used for canonical instrument identification across all services.

    Fields use plain ``str`` so this class has no dependency on
    ``unified_config_interface`` enums — callers that need enum-validated
    fields should use ``unified_domain_client.schemas.instrument_key``
    which wraps this class with Venue/InstrumentType enum coercion.

    Examples:
        - BINANCE-FUTURES:PERPETUAL:BTC-USDT
        - DERIBIT:OPTION:ETH-USDC-251027-3500-CALL
        - CME:FUTURE:ES.FUT
    """

    venue: str
    instrument_type: str
    symbol: str
    expiry: str | None = None  # For futures/options (YYMMDD format)
    option_type: str | None = None  # C or P for options

    def __str__(self) -> str:
        parts = [self.venue, self.instrument_type, self.symbol]
        if self.expiry:
            parts.append(self.expiry)
        if self.option_type:
            parts.append(self.option_type)
        return ":".join(parts)

    @classmethod
    def from_string(cls, instrument_key_str: str) -> InstrumentKey:
        """Parse instrument key from string."""
        parts = instrument_key_str.split(":")
        if len(parts) < 3:
            raise ValueError(f"Invalid instrument key format: {instrument_key_str}")
        return cls(
            venue=parts[0],
            instrument_type=parts[1],
            symbol=parts[2],
            expiry=parts[3] if len(parts) > 3 else None,
            option_type=parts[4] if len(parts) > 4 else None,
        )

    @classmethod
    def _format_tardis_symbol(cls, symbol: str, tardis_exchange: str) -> str:
        """Convert canonical symbol to Tardis exchange-specific format."""
        if tardis_exchange in ("binance", "binance-futures"):
            return symbol.replace("-", "").lower()
        if tardis_exchange == "deribit":
            return symbol.lower()
        if tardis_exchange == "upbit":
            symbol_parts = symbol.split("-")
            return f"{symbol_parts[1]}-{symbol_parts[0]}" if len(symbol_parts) == 2 else symbol
        if tardis_exchange == "coinbase":
            return symbol.upper()
        return symbol.lower()

    @classmethod
    def parse_for_tardis(cls, instrument_key_str: str) -> dict[str, str]:
        """Parse instrument key and return venue/symbol for Tardis API.

        Converts VENUE:INSTRUMENT_TYPE:SYMBOL → venue + symbol for
        streaming architecture compatibility.

        Args:
            instrument_key_str: Instrument key in format VENUE:INSTRUMENT_TYPE:SYMBOL

        Returns:
            Dict with venue, symbol, tardis_exchange, tardis_symbol, instrument_type
        """
        parts = instrument_key_str.split(":")
        if len(parts) < 3:
            raise ValueError(f"Invalid instrument key format: {instrument_key_str}")

        venue = parts[0]
        instrument_type = parts[1]
        symbol = ":".join(parts[2:])
        tardis_exchange = _VENUE_TO_TARDIS.get(venue, venue.lower())
        tardis_symbol = cls._format_tardis_symbol(symbol, tardis_exchange)

        return {
            "venue": venue,
            "symbol": symbol,
            "tardis_exchange": tardis_exchange,
            "tardis_symbol": tardis_symbol,
            "instrument_type": instrument_type,
        }
