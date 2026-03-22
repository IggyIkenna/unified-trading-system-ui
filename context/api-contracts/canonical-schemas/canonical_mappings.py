"""Canonical mappings and reference data for the unified trading system.

ALL mappings live in api-contracts; interfaces and services import from here only.
Single source of truth for data source ↔ venue, dataset ↔ venue, and symbol normalization.

Scope: Venues in our universe; TradFi via Databento (~506 venues); DeFi = Euler, Fluid, ERC20, BTC only.
"""

from __future__ import annotations

from decimal import Decimal
from typing import TypedDict


class ContractSpec(TypedDict, total=False):
    """Contract specification: tick size, lot size, expiry format per venue."""

    tick_size: Decimal
    lot_size: Decimal
    min_qty: Decimal
    max_qty: Decimal
    expiry_format: str  # e.g. "YYYYMM", "YYYY-MM-DD"


# --- DATA_SOURCE_TO_VENUES ---
DATA_SOURCE_TO_VENUES: dict[str, list[str]] = {
    "tardis": [
        "BINANCE-SPOT",
        "BINANCE-FUTURES",
        "COINBASE-SPOT",
        "DERIBIT",
        "BYBIT-SPOT",
        "BYBIT-FUTURES",
        "OKX-SPOT",
        "OKX-FUTURES",
        "OKX-SWAP",
        "BITFINEX-SPOT",
        "GEMINI-SPOT",
        "BITSTAMP-SPOT",
        "HUOBI-SPOT",
        "HUOBI-FUTURES",
        "PHEMEX-SPOT",
        "PHEMEX-FUTURES",
    ],
    "databento": [
        "CME",
        "CBOT",
        "NYMEX",
        "COMEX",
        "GLOBEX",
        "XCME",
        "XNAS",
        "XNYS",
        "BATS",
        "ARCX",
        "IEXG",
        "XPSX",
        "EPRL",
        "XCHI",
        "CBOE",
    ],
    "ccxt": [
        "BINANCE-SPOT",
        "BINANCE-FUTURES",
        "OKX",
        "BYBIT",
        "COINBASE-SPOT",
        "UPBIT",
        "KUCOIN",
        "BITFINEX-SPOT",
        "HUOBI-SPOT",
    ],
    "ibkr": [
        "NASDAQ",
        "NYSE",
        "CME",
        "CBOE",
        "ARCA",
        "BATS",
        "IEX",
    ],
    "aster": ["ASTER"],
    "hyperliquid": ["HYPERLIQUID"],
    "thegraph": [
        "UNISWAP-V2",
        "UNISWAP-V3",
        "UNISWAP-V4",
        "AAVE-V3",
        "CURVE",
        "BALANCER",
        "MORPHO",
        "EULER",
        "FLUID",
        "LIDO",
        "ETHERFI",
        "ETHENA",
    ],
    "yfinance": ["FX"],
    "barchart": ["VIX"],
}

# --- VENUE_TO_DATA_SOURCE (originally in unified-trading-library) ---
VENUE_TO_DATA_SOURCE: dict[str, str] = {
    "BINANCE-SPOT": "tardis",
    "BINANCE-FUTURES": "tardis",
    "COINBASE-SPOT": "tardis",
    "DERIBIT": "tardis",
    "BYBIT-SPOT": "tardis",
    "BYBIT-FUTURES": "tardis",
    "OKX-SPOT": "tardis",
    "OKX-FUTURES": "tardis",
    "OKX-SWAP": "tardis",
    "BITFINEX-SPOT": "tardis",
    "GEMINI-SPOT": "tardis",
    "BITSTAMP-SPOT": "tardis",
    "HUOBI-SPOT": "tardis",
    "HUOBI-FUTURES": "tardis",
    "PHEMEX-SPOT": "tardis",
    "PHEMEX-FUTURES": "tardis",
    "CME": "databento",
    "CBOT": "databento",
    "NYMEX": "databento",
    "COMEX": "databento",
    "GLOBEX": "databento",
    "XCME": "databento",
    "XNAS": "databento",
    "XNYS": "databento",
    "BATS": "databento",
    "ARCX": "databento",
    "IEXG": "databento",
    "XPSX": "databento",
    "EPRL": "databento",
    "XCHI": "databento",
    "CBOE": "databento",
    "ASTER": "aster",
    "HYPERLIQUID": "hyperliquid",
    "UNISWAP-V2": "thegraph",
    "UNISWAP-V3": "thegraph",
    "UNISWAP-V4": "thegraph",
    "AAVE-V3": "thegraph",
    "CURVE": "thegraph",
    "BALANCER": "thegraph",
    "MORPHO": "thegraph",
    "EULER": "thegraph",
    "FLUID": "thegraph",
    "LIDO": "thegraph",
    "ETHERFI": "thegraph",
    "ETHENA": "thegraph",
    "FX": "yfinance",
    "VIX": "barchart",
}

# --- DATASET_TO_CANONICAL_VENUE ---
# Databento dataset_id → canonical venue (TradFi ~506 venues)
# Tardis exchange → canonical venue (CeFi; DeFi = Euler, Fluid, ERC20, BTC only)
# Ref: https://databento.com/docs/standards-and-conventions/common-fields-enums-types
# Ref: https://docs.tardis.dev/historical-data-details
DATASET_TO_CANONICAL_VENUE: dict[str, str] = {
    # Databento: CME Group
    "GLBX.MDP3": "CME",
    # Databento: NASDAQ
    "XNAS.ITCH": "NASDAQ",
    "XNAS.BASIC": "XNAS",
    "XBOS.ITCH": "NASDAQ",
    "XPSX.ITCH": "NASDAQ",
    # Databento: CBOE
    "BATS.PITCH": "CBOE",
    "BATY.PITCH": "CBOE",
    "EDGA.PITCH": "CBOE",
    "EDGX.PITCH": "CBOE",
    "BATS.BASIC": "BATS",
    "OPRA.PILLAR": "CBOE",
    # Databento: NYSE
    "XNYS.PILLAR": "NYSE",
    "XNYS.BASIC": "XNYS",
    "XNYS.ITCH": "XNYS",
    "XCIS.PILLAR": "NYSE",
    "XASE.PILLAR": "NYSE",
    "XCHI.PILLAR": "NYSE",
    "XCIS.BBO": "NYSE",
    "XCIS.TRADES": "NYSE",
    "XCIS.TRADESBBO": "NYSE",
    "ARCX.PILLAR": "NYSE",
    "ARCX.BASIC": "ARCX",
    # Databento: Other US venues
    "MEMX.MEMOIR": "MEMX",
    "EPRL.DOM": "MIAX",
    "EPRL.BASIC": "EPRL",
    "IEXG.TOPS": "IEX",
    "IEXG.BASIC": "IEXG",
    "XPSX.BASIC": "XPSX",
    "XCHI.BASIC": "XCHI",
    # Databento: FINRA
    "XNAS.NLS": "FINRA",
    "XNYS.TRADES": "FINRA",
    # Databento: ICE
    "IFEU.IMPACT": "ICE",
    "IFUS.IMPACT": "ICE",
    "IFLL.IMPACT": "ICE",
    "NDEX.IMPACT": "ICE",
    # Databento: Consolidated
    "DBEQ.BASIC": "DATABENTO",
    "EQUS.MINI": "DATABENTO",
    "EQUS.SUMMARY": "DATABENTO",
    # Tardis: CeFi exchanges
    "binance": "BINANCE-SPOT",
    "binance-futures": "BINANCE-FUTURES",
    "binanceusdm": "BINANCE-FUTURES",
    "binancecoinm": "BINANCE-FUTURES",
    "bybit": "BYBIT",
    "bybit-spot": "BYBIT",
    "okex": "OKX",
    "okex-futures": "OKX",
    "okex-swap": "OKX",
    "okx": "OKX",
    "deribit": "DERIBIT",
    "upbit": "UPBIT",
    "coinbase": "COINBASE-SPOT",
    "bitfinex": "BITFINEX-SPOT",
    "gemini": "GEMINI-SPOT",
    "bitstamp": "BITSTAMP-SPOT",
    "huobi": "HUOBI-SPOT",
    "huobipro": "HUOBI-SPOT",
    "phemex": "PHEMEX-SPOT",
    "hyperliquid": "HYPERLIQUID",
    "aster": "ASTER",
    # Tardis: DeFi (Euler, Fluid, ERC20, BTC only)
    "euler": "EULER-PLASMA",
    "fluid": "FLUID-PLASMA",
}

# --- DEFI_DATASET_TO_CANONICAL_VENUE ---
# DeFi: dataset/subgraph/chain → canonical venue. Scope: Euler, Fluid, ERC20, BTC only.
DEFI_DATASET_TO_CANONICAL_VENUE: dict[str, str] = {
    "uniswap-v2-ethereum": "UNISWAPV2-ETH",
    "uniswap-v3-ethereum": "UNISWAPV3-ETH",
    "uniswap-v4-ethereum": "UNISWAPV4-ETH",
    "uniswap/uniswap-v2": "UNISWAPV2-ETH",
    "uniswap/uniswap-v3": "UNISWAPV3-ETH",
    "curve-ethereum": "CURVE-ETH",
    "curvefi/curve-ethereum": "CURVE-ETH",
    "aerodrome-base": "AERODROME-BASE",
    "aave-v3-ethereum": "AAVE_V3_ETH",
    "aave-v3": "AAVE_V3",
    "morpho-ethereum": "MORPHO-ETHEREUM",
    "morpho-org/morpho-blue": "MORPHO-ETHEREUM",
    "euler-plasma": "EULER-PLASMA",
    "fluid-plasma": "FLUID-PLASMA",
    "aave-plasma": "AAVE-PLASMA",
    "lido-ethereum": "LIDO",
    "lido/lido": "LIDO",
    "etherfi": "ETHERFI",
    "ethena": "ETHENA",
}


# --- SYMBOL_MAPPINGS ---
SYMBOL_MAPPINGS: dict[str, set[tuple[str, str]]] = {
    "BTC-USDT": {
        ("BINANCE-SPOT", "BTCUSDT"),
        ("BINANCE-FUTURES", "BTCUSDT"),
        ("OKX", "BTC-USDT"),
        ("OKX", "BTC-USDT-SWAP"),
        ("BYBIT", "BTCUSDT"),
        ("DERIBIT", "BTC-PERPETUAL"),
        ("COINBASE-SPOT", "BTC-USD"),
        ("CCXT", "BTC/USDT"),
        ("CME", "XBT"),
        ("CME", "BTC"),
    },
    "ETH-USDT": {
        ("BINANCE-SPOT", "ETHUSDT"),
        ("BINANCE-FUTURES", "ETHUSDT"),
        ("OKX", "ETH-USDT"),
        ("OKX", "ETH-USDT-SWAP"),
        ("BYBIT", "ETHUSDT"),
        ("DERIBIT", "ETH-PERPETUAL"),
        ("COINBASE-SPOT", "ETH-USD"),
        ("CCXT", "ETH/USDT"),
        ("CME", "ETH"),
    },
    "BTC-USD": {
        ("DERIBIT", "BTC-PERPETUAL"),
        ("CME", "XBT"),
        ("CME", "BTC"),
        ("COINBASE-SPOT", "BTC-USD"),
        ("OKX", "BTC-USD-SWAP"),
    },
    "ETH-USD": {
        ("DERIBIT", "ETH-PERPETUAL"),
        ("CME", "ETH"),
        ("COINBASE-SPOT", "ETH-USD"),
        ("OKX", "ETH-USD-SWAP"),
    },
}

# --- SYMBOLOGY_BY_VENUE ---
SYMBOLOGY_BY_VENUE: dict[str, dict[str, str]] = {
    "BINANCE-SPOT": {"format": "BASEQUOTE", "separator": "", "example": "BTCUSDT"},
    "BINANCE-FUTURES": {"format": "BASEQUOTE", "separator": "", "example": "BTCUSDT"},
    "OKX": {"format": "BASE-QUOTE-TYPE", "separator": "-", "example": "BTC-USDT-SWAP"},
    "BYBIT": {"format": "BASEQUOTE", "separator": "", "example": "BTCUSDT"},
    "DERIBIT": {
        "format": "BASE-PERPETUAL|BASE-EXPIRY-STRIKE-C/P",
        "separator": "-",
        "example": "BTC-PERPETUAL",
    },
    "COINBASE-SPOT": {"format": "BASE-QUOTE", "separator": "-", "example": "BTC-USD"},
    "CME": {
        "format": "ROOT+MONTH+YEAR",
        "separator": "",
        "example": "XBT",
        "futures_example": "XBTZ4",
    },
    "XNAS": {"format": "TICKER", "separator": "", "example": "AAPL"},
    "XNYS": {"format": "TICKER", "separator": "", "example": "AAPL"},
    "CCXT": {"format": "BASE/QUOTE", "separator": "/", "example": "BTC/USDT"},
    "IBKR": {"format": "LOCAL_SYMBOL", "separator": "", "example": "XBTUSD"},
}

# --- CONTRACT_SPECS_BY_VENUE ---
CONTRACT_SPECS_BY_VENUE: dict[str, ContractSpec] = {
    "BINANCE-SPOT": {
        "tick_size": Decimal("0.01"),
        "lot_size": Decimal("0.00001"),
        "min_qty": Decimal("0.00001"),
        "max_qty": Decimal("9000.0"),
    },
    "BINANCE-FUTURES": {
        "tick_size": Decimal("0.01"),
        "lot_size": Decimal("0.001"),
        "min_qty": Decimal("0.001"),
        "max_qty": Decimal("1000.0"),
    },
    "OKX": {
        "tick_size": Decimal("0.01"),
        "lot_size": Decimal("0.001"),
        "min_qty": Decimal("0.001"),
        "max_qty": Decimal("1000.0"),
        "expiry_format": "YYYY-MM-DD",
    },
    "BYBIT": {
        "tick_size": Decimal("0.01"),
        "lot_size": Decimal("0.001"),
        "min_qty": Decimal("0.001"),
        "max_qty": Decimal("100.0"),
    },
    "DERIBIT": {
        "tick_size": Decimal("0.01"),
        "lot_size": Decimal("0.1"),
        "min_qty": Decimal("0.1"),
        "max_qty": Decimal("10000.0"),
        "expiry_format": "DDMMMYY",
    },
    "CME": {
        "tick_size": Decimal("5.0"),
        "lot_size": Decimal("0.01"),
        "min_qty": Decimal("0.01"),
        "expiry_format": "YYYYMM",
    },
    "COINBASE-SPOT": {
        "tick_size": Decimal("0.01"),
        "lot_size": Decimal("0.00001"),
        "min_qty": Decimal("0.00001"),
    },
    "HYPERLIQUID": {
        "tick_size": Decimal("0.01"),
        "lot_size": Decimal("0.001"),
        "min_qty": Decimal("0.001"),
    },
    "ASTER": {
        "tick_size": Decimal("0.01"),
        "lot_size": Decimal("0.001"),
        "min_qty": Decimal("0.001"),
    },
}

# --- DATA_SOURCE_TO_SECRET ---
DATA_SOURCE_TO_SECRET: dict[str, str | None] = {
    "tardis": "TARDIS_API_KEY",
    "databento": "DATABENTO_API_KEY",
    "aster": None,
    "hyperliquid": None,
    "thegraph": "THE_GRAPH_API_KEY",
    "alchemy": "ALCHEMY_API_KEY",
    "yfinance": None,
    "barchart": "BARCHART_API_KEY",
    "ccxt": None,
    "ibkr": None,
    "glassnode": "GLASSNODE_API_KEY",
    "arkham": "ARKHAM_API_KEY",
    "defillama": None,
    "betfair": "BETFAIR_API_KEY",
    "coingecko": "COINGECKO_API_KEY",
}


def get_data_source_for_venue(venue: str) -> str | None:
    """Get primary data source for a venue."""
    return VENUE_TO_DATA_SOURCE.get(venue.upper())


def get_required_data_sources(venues: list[str]) -> set[str]:
    """Get unique data sources needed for list of venues."""
    sources: set[str] = set()
    for venue in venues:
        source = get_data_source_for_venue(venue)
        if source:
            sources.add(source)
    return sources


def get_required_secrets(venues: list[str]) -> dict[str, str]:
    """Get required secrets for list of venues (only sources requiring API keys)."""
    data_sources = get_required_data_sources(venues)
    secrets: dict[str, str] = {}
    for source in data_sources:
        secret_name = DATA_SOURCE_TO_SECRET.get(source)
        if secret_name:
            secrets[source] = secret_name
    return secrets


class DataSourceMapping:
    """Maps venues to their upstream data sources. Re-exports from canonical_mappings.

    Originally in unified-trading-library. All consumers import from api-contracts.
    """

    VENUE_TO_DATA_SOURCE = VENUE_TO_DATA_SOURCE
    DATA_SOURCE_TO_SECRET = DATA_SOURCE_TO_SECRET

    @classmethod
    def get_data_source_for_venue(cls, venue: str) -> str | None:
        return get_data_source_for_venue(venue)

    @classmethod
    def get_required_data_sources(cls, venues: list[str]) -> set[str]:
        return get_required_data_sources(venues)

    @classmethod
    def get_required_secrets(cls, venues: list[str]) -> dict[str, str]:
        return get_required_secrets(venues)

    @classmethod
    def requires_tardis(cls, venues: list[str]) -> bool:
        return "tardis" in cls.get_required_data_sources(venues)

    @classmethod
    def requires_databento(cls, venues: list[str]) -> bool:
        return "databento" in cls.get_required_data_sources(venues)

    @classmethod
    def requires_thegraph(cls, venues: list[str]) -> bool:
        return "thegraph" in cls.get_required_data_sources(venues)
