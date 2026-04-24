"""Data freshness contracts for all live data sources.

Extends the onchain_freshness.py pattern to market tick venues, feature pipeline
outputs, and ML model artifacts. Services consuming live data must reject or flag
readings that exceed the freshness threshold for their source.

Every data-producing service instantiates a FreshnessMonitor (from unified-trading-library)
with the appropriate contract. Every data-consuming service checks the contract before
using an input.
"""

from typing import Literal

from pydantic import BaseModel, Field


class DataFreshnessContract(BaseModel):
    """Freshness SLA for a single data source.

    Freshness levels
    ----------------
    - ok        : age < warn_age_seconds
    - warn      : warn_age_seconds <= age < max_age_seconds  → emit DATA_STALE
    - critical  : age >= max_age_seconds                     → emit FEED_UNHEALTHY

    Example usage
    -------------
    contract = MARKET_TICK_FRESHNESS["binance"]
    age = (datetime.now(timezone.utc) - last_tick_ts).total_seconds()
    if age > contract.max_age_seconds:
        raise DataStalenessError(
            f"binance data is {age:.0f}s old — max {contract.max_age_seconds}s"
        )
    """

    source: str = Field(
        description="Canonical source identifier (venue key, service name, or provider slug)."
    )
    asset_class: Literal[
        "crypto_cefi",
        "crypto_defi",
        "tradfi",
        "onchain",
        "sports",
        "feature",
        "ml",
    ] = Field(description="Asset class that determines the data domain.")
    max_age_seconds: int = Field(
        description=(
            "Maximum acceptable data age in seconds. Data older than this triggers "
            "FEED_UNHEALTHY and must be rejected by consuming services."
        ),
        gt=0,
    )
    warn_age_seconds: int = Field(
        description=(
            "Warning threshold in seconds. Data older than this but younger than "
            "max_age_seconds triggers DATA_STALE (warning only)."
        ),
        gt=0,
    )
    expected_cadence_seconds: int = Field(
        description=(
            "Expected interval in seconds between consecutive data arrivals. "
            "Used to detect gaps: age > 2x cadence implies DATA_GAP_DETECTED."
        ),
        gt=0,
    )
    criticality: Literal["critical", "important", "informational"] = Field(
        description=(
            "Operational criticality. 'critical' sources block order flow on staleness; "
            "'important' sources trigger alerts but do not block; "
            "'informational' sources log only."
        )
    )


# ---------------------------------------------------------------------------
# Market tick data — per venue
# ---------------------------------------------------------------------------

MARKET_TICK_FRESHNESS: dict[str, DataFreshnessContract] = {
    # CeFi — high-frequency venues (1s cadence, 5s max)
    "binance": DataFreshnessContract(
        source="binance",
        asset_class="crypto_cefi",
        max_age_seconds=5,
        warn_age_seconds=2,
        expected_cadence_seconds=1,
        criticality="critical",
    ),
    "bybit": DataFreshnessContract(
        source="bybit",
        asset_class="crypto_cefi",
        max_age_seconds=5,
        warn_age_seconds=2,
        expected_cadence_seconds=1,
        criticality="critical",
    ),
    "okx": DataFreshnessContract(
        source="okx",
        asset_class="crypto_cefi",
        max_age_seconds=5,
        warn_age_seconds=2,
        expected_cadence_seconds=1,
        criticality="critical",
    ),
    "coinbase": DataFreshnessContract(
        source="coinbase",
        asset_class="crypto_cefi",
        max_age_seconds=5,
        warn_age_seconds=2,
        expected_cadence_seconds=1,
        criticality="critical",
    ),
    "hyperliquid": DataFreshnessContract(
        source="hyperliquid",
        asset_class="crypto_cefi",
        max_age_seconds=5,
        warn_age_seconds=2,
        expected_cadence_seconds=1,
        criticality="critical",
    ),
    # CeFi — options venue with slightly higher latency (10s max)
    "deribit": DataFreshnessContract(
        source="deribit",
        asset_class="crypto_cefi",
        max_age_seconds=10,
        warn_age_seconds=3,
        expected_cadence_seconds=1,
        criticality="critical",
    ),
    # DeFi — on-chain AMMs / lending (12s cadence, 15s max)
    "uniswap_v3": DataFreshnessContract(
        source="uniswap_v3",
        asset_class="crypto_defi",
        max_age_seconds=15,
        warn_age_seconds=6,
        expected_cadence_seconds=12,
        criticality="critical",
    ),
    "aave_v3": DataFreshnessContract(
        source="aave_v3",
        asset_class="crypto_defi",
        max_age_seconds=15,
        warn_age_seconds=6,
        expected_cadence_seconds=12,
        criticality="critical",
    ),
    "curve": DataFreshnessContract(
        source="curve",
        asset_class="crypto_defi",
        max_age_seconds=15,
        warn_age_seconds=6,
        expected_cadence_seconds=12,
        criticality="critical",
    ),
    "balancer": DataFreshnessContract(
        source="balancer",
        asset_class="crypto_defi",
        max_age_seconds=15,
        warn_age_seconds=6,
        expected_cadence_seconds=12,
        criticality="critical",
    ),
    # TradFi — intraday (60s cadence)
    "databento_intraday": DataFreshnessContract(
        source="databento_intraday",
        asset_class="tradfi",
        max_age_seconds=60,
        warn_age_seconds=30,
        expected_cadence_seconds=60,
        criticality="important",
    ),
    # TradFi — EOD (daily cadence)
    "databento_eod": DataFreshnessContract(
        source="databento_eod",
        asset_class="tradfi",
        max_age_seconds=86400,
        warn_age_seconds=43200,
        expected_cadence_seconds=86400,
        criticality="important",
    ),
    "yahoo_finance": DataFreshnessContract(
        source="yahoo_finance",
        asset_class="tradfi",
        max_age_seconds=86400,
        warn_age_seconds=43200,
        expected_cadence_seconds=86400,
        criticality="important",
    ),
    # Alt data — daily (informational)
    "openbb": DataFreshnessContract(
        source="openbb",
        asset_class="tradfi",
        max_age_seconds=86400,
        warn_age_seconds=43200,
        expected_cadence_seconds=86400,
        criticality="informational",
    ),
    "fred": DataFreshnessContract(
        source="fred",
        asset_class="tradfi",
        max_age_seconds=86400,
        warn_age_seconds=43200,
        expected_cadence_seconds=86400,
        criticality="informational",
    ),
    "ecb": DataFreshnessContract(
        source="ecb",
        asset_class="tradfi",
        max_age_seconds=86400,
        warn_age_seconds=43200,
        expected_cadence_seconds=86400,
        criticality="informational",
    ),
    "ofr": DataFreshnessContract(
        source="ofr",
        asset_class="tradfi",
        max_age_seconds=86400,
        warn_age_seconds=43200,
        expected_cadence_seconds=86400,
        criticality="informational",
    ),
    # Sports betting — odds feeds
    "pinnacle": DataFreshnessContract(
        source="pinnacle",
        asset_class="sports",
        max_age_seconds=300,
        warn_age_seconds=60,
        expected_cadence_seconds=30,
        criticality="important",
    ),
    "odds_api": DataFreshnessContract(
        source="odds_api",
        asset_class="sports",
        max_age_seconds=300,
        warn_age_seconds=60,
        expected_cadence_seconds=30,
        criticality="important",
    ),
    "betfair": DataFreshnessContract(
        source="betfair",
        asset_class="sports",
        max_age_seconds=60,
        warn_age_seconds=15,
        expected_cadence_seconds=5,
        criticality="important",
    ),
    # Onchain analytics providers (hourly cadence)
    "glassnode": DataFreshnessContract(
        source="glassnode",
        asset_class="onchain",
        max_age_seconds=3600,
        warn_age_seconds=1800,
        expected_cadence_seconds=3600,
        criticality="important",
    ),
    "coinglass": DataFreshnessContract(
        source="coinglass",
        asset_class="onchain",
        max_age_seconds=3600,
        warn_age_seconds=1800,
        expected_cadence_seconds=3600,
        criticality="important",
    ),
}

# ---------------------------------------------------------------------------
# Feature pipeline outputs — per service
# ---------------------------------------------------------------------------

FEATURE_FRESHNESS: dict[str, DataFreshnessContract] = {
    "features-delta-one-service": DataFreshnessContract(
        source="features-delta-one-service",
        asset_class="feature",
        max_age_seconds=120,
        warn_age_seconds=60,
        expected_cadence_seconds=60,
        criticality="critical",
    ),
    "features-volatility-service": DataFreshnessContract(
        source="features-volatility-service",
        asset_class="feature",
        max_age_seconds=300,
        warn_age_seconds=150,
        expected_cadence_seconds=60,
        criticality="critical",
    ),
    "features-onchain-service": DataFreshnessContract(
        source="features-onchain-service",
        asset_class="feature",
        max_age_seconds=600,
        warn_age_seconds=300,
        expected_cadence_seconds=300,
        criticality="important",
    ),
    "features-calendar-service": DataFreshnessContract(
        source="features-calendar-service",
        asset_class="feature",
        max_age_seconds=86400,
        warn_age_seconds=43200,
        expected_cadence_seconds=3600,
        criticality="informational",
    ),
    "features-commodity-service": DataFreshnessContract(
        source="features-commodity-service",
        asset_class="feature",
        max_age_seconds=3600,
        warn_age_seconds=1800,
        expected_cadence_seconds=3600,
        criticality="informational",
    ),
    "features-cross-instrument-service": DataFreshnessContract(
        source="features-cross-instrument-service",
        asset_class="feature",
        max_age_seconds=300,
        warn_age_seconds=150,
        expected_cadence_seconds=60,
        criticality="important",
    ),
    "features-multi-timeframe-service": DataFreshnessContract(
        source="features-multi-timeframe-service",
        asset_class="feature",
        max_age_seconds=300,
        warn_age_seconds=150,
        expected_cadence_seconds=60,
        criticality="critical",
    ),
    "features-sports-service": DataFreshnessContract(
        source="features-sports-service",
        asset_class="feature",
        max_age_seconds=300,
        warn_age_seconds=60,
        expected_cadence_seconds=60,
        criticality="important",
    ),
}

# ---------------------------------------------------------------------------
# ML outputs — per API
# ---------------------------------------------------------------------------

ML_FRESHNESS: dict[str, DataFreshnessContract] = {
    "ml-inference-api": DataFreshnessContract(
        source="ml-inference-api",
        asset_class="ml",
        max_age_seconds=120,
        warn_age_seconds=60,
        expected_cadence_seconds=60,
        criticality="critical",
    ),
    "ml-training-api": DataFreshnessContract(
        source="ml-training-api",
        asset_class="ml",
        # 7 days (604800s) — model artifacts are not real-time
        max_age_seconds=604800,
        warn_age_seconds=259200,  # 3 days
        expected_cadence_seconds=86400,  # daily retraining
        criticality="informational",
    ),
}

# ---------------------------------------------------------------------------
# Aggregate — all sources in a single flat dict for O(1) lookup
# ---------------------------------------------------------------------------

ALL_FRESHNESS_CONTRACTS: dict[str, DataFreshnessContract] = {
    **MARKET_TICK_FRESHNESS,
    **FEATURE_FRESHNESS,
    **ML_FRESHNESS,
}


# ---------------------------------------------------------------------------
# DataStalenessError — raised by consuming services when data is stale
# ---------------------------------------------------------------------------


class DataStalenessError(RuntimeError):
    """Raised when consumed data exceeds its freshness SLA.

    Strategy-service raises this in ``assert_feature_fresh()`` to block signal
    generation when a feature input is too old.  Execution-service raises it in
    ``assert_market_data_fresh()`` to block order submission when market data is
    stale.

    The ``source`` and ``age_seconds`` attributes are always set so that
    upstream callers can inspect the failure programmatically.
    """

    def __init__(
        self,
        message: str,
        *,
        source: str = "",
        age_seconds: float = 0.0,
        max_age_seconds: int = 0,
    ) -> None:
        super().__init__(message)
        self.source = source
        self.age_seconds = age_seconds
        self.max_age_seconds = max_age_seconds
