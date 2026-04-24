"""Onchain data freshness contracts per chain.

Defines the maximum acceptable staleness (freshness window) for onchain
data per blockchain network. Services consuming onchain data must reject
or flag readings that exceed the freshness threshold for the chain.
"""

from pydantic import BaseModel, Field


class OnchainDataFreshnessConfig(BaseModel):
    """Per-chain configuration for onchain data freshness requirements.

    Freshness is defined as the maximum acceptable age (in seconds) of
    an onchain data reading before it is considered stale. Different chains
    have different block times and indexer latencies, so each chain requires
    its own threshold.

    Example usage
    -------------
    config = OnchainDataFreshnessConfig(
        chain_id="ethereum",
        max_age_seconds=60,
        block_time_seconds=12,
        source="alchemy",
    )
    if reading_age_seconds > config.max_age_seconds:
        raise ValueError(f"Onchain data for {config.chain_id} is stale")
    """

    chain_id: str = Field(
        description=(
            "Canonical chain identifier (e.g. 'ethereum', 'arbitrum', 'base', "
            "'polygon', 'solana', 'bsc')"
        )
    )
    max_age_seconds: int = Field(
        description=(
            "Maximum acceptable age in seconds for onchain data from this chain. "
            "Data older than this threshold is considered stale and must be rejected."
        ),
        gt=0,
    )
    block_time_seconds: float = Field(
        description=(
            "Average block production time in seconds for this chain. "
            "Used to estimate how many blocks behind a reading is."
        ),
        gt=0,
    )
    source: str = Field(
        default="",
        description=(
            "Data provider / indexer sourcing onchain data for this chain "
            "(e.g. 'alchemy', 'tenderly', 'thegraph', 'quicknode')."
        ),
    )
    warn_age_seconds: int | None = Field(
        default=None,
        description=(
            "Optional warning threshold in seconds. If set, data older than "
            "warn_age_seconds but younger than max_age_seconds triggers a warning "
            "rather than rejection."
        ),
        gt=0,
    )

    @property
    def max_blocks_behind(self) -> float:
        """Maximum number of blocks behind before data is stale."""
        return self.max_age_seconds / self.block_time_seconds


# Canonical freshness defaults per major chain.
# Services may override these per deployment config; these are sensible defaults.
CHAIN_FRESHNESS_DEFAULTS: dict[str, OnchainDataFreshnessConfig] = {
    "ethereum": OnchainDataFreshnessConfig(
        chain_id="ethereum",
        max_age_seconds=60,
        block_time_seconds=12.0,
        source="alchemy",
        warn_age_seconds=30,
    ),
    "arbitrum": OnchainDataFreshnessConfig(
        chain_id="arbitrum",
        max_age_seconds=10,
        block_time_seconds=0.25,
        source="alchemy",
        warn_age_seconds=5,
    ),
    "base": OnchainDataFreshnessConfig(
        chain_id="base",
        max_age_seconds=10,
        block_time_seconds=2.0,
        source="alchemy",
        warn_age_seconds=5,
    ),
    "polygon": OnchainDataFreshnessConfig(
        chain_id="polygon",
        max_age_seconds=30,
        block_time_seconds=2.0,
        source="alchemy",
        warn_age_seconds=15,
    ),
    "solana": OnchainDataFreshnessConfig(
        chain_id="solana",
        max_age_seconds=10,
        block_time_seconds=0.4,
        source="quicknode",
        warn_age_seconds=5,
    ),
    "bsc": OnchainDataFreshnessConfig(
        chain_id="bsc",
        max_age_seconds=20,
        block_time_seconds=3.0,
        source="quicknode",
        warn_age_seconds=10,
    ),
}
