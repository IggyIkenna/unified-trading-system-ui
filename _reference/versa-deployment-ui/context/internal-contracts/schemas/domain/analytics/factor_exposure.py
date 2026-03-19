"""Factor exposure schema for analytics attribution."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class FactorType(StrEnum):
    MOMENTUM = "momentum"
    VALUE = "value"
    QUALITY = "quality"
    SIZE = "size"
    VOLATILITY = "volatility"
    CARRY = "carry"
    LIQUIDITY = "liquidity"
    MACRO = "macro"
    CRYPTO_BETA = "crypto_beta"
    DEFI_YIELD = "defi_yield"
    SENTIMENT = "sentiment"
    TECHNICAL = "technical"


class FactorExposure(BaseModel):
    """Exposure of an instrument or portfolio to a single risk factor."""

    factor: FactorType
    beta: float = Field(description="factor loading / sensitivity")
    t_stat: float | None = Field(default=None, description="statistical significance")
    r_squared: float | None = Field(default=None, description="regression R^2")
    factor_return: float | None = Field(default=None, description="factor return over period")
    contribution: float | None = Field(
        default=None, description="beta * factor_return = P&L contribution"
    )


class FactorAttributionRecord(BaseModel):
    """Daily factor attribution for a portfolio/instrument."""

    date: date
    instrument_id: str | None = None
    portfolio_id: str | None = None
    strategy_id: str | None = None
    total_return: float
    factor_exposures: list[FactorExposure] = Field(default_factory=list)
    factor_returns: dict[str, float] = Field(
        default_factory=dict,
        description="FactorType -> return for that factor on this date",
    )
    residual_return: float | None = Field(default=None, description="return unexplained by factors")
    explained_pct: float | None = Field(
        default=None, description="fraction of return explained by factors (R^2)"
    )


class FactorAttributionModel(BaseModel):
    """Metadata about a factor model used for attribution."""

    model_id: str
    model_name: str
    factors: list[FactorType]
    estimation_window_days: int = 252
    rebalance_frequency: str = "monthly"
    last_calibrated: date | None = None
    universe: str | None = Field(default=None, description="e.g. crypto_large_cap, equity_us")
    r_squared_median: float | None = None


# ---------------------------------------------------------------------------
# Correlation analytics (moved from UAC — internal computation, not external data)
# ---------------------------------------------------------------------------


class CorrelationRegime(StrEnum):
    """Detected correlation regime across assets."""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRISIS = "crisis"


class CrossAssetCorrelationMatrix(BaseModel):
    """Pairwise correlation matrix across assets/instruments."""

    computed_at: datetime
    window_days: int = Field(description="rolling window used for computation")
    instruments: list[str] = Field(description="ordered list of instruments")
    correlation_matrix: list[list[Decimal]] = Field(
        description="N x N matrix indexed by instruments"
    )
    regime: CorrelationRegime = CorrelationRegime.NORMAL
    average_pairwise_correlation: Decimal | None = None
    max_eigenvalue: Decimal | None = Field(default=None, description="largest eigenvalue")


class CorrelationRegimeChange(BaseModel):
    """Detected change in correlation regime."""

    detected_at: datetime
    regime_before: CorrelationRegime
    regime_after: CorrelationRegime
    assets_affected: list[str]
    trigger: str | None = Field(default=None, description="e.g. macro_shock, deleveraging")
    correlation_delta: Decimal | None = None
    confidence: Decimal | None = None
