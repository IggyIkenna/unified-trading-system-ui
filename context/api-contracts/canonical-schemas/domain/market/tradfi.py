from __future__ import annotations

from decimal import Decimal

from pydantic import AwareDatetime, Field

from .._base import CanonicalBase


class CanonicalYieldCurvePoint(CanonicalBase):
    """One point on a yield curve."""

    timestamp: AwareDatetime
    venue: str = Field(description="Data provider: fred | ecb | ofr | openbb | ibkr")
    series_id: str = Field(description="Series identifier e.g. DGS10 (FRED), OIS5Y (ECB)")
    tenor: str | None = Field(default=None, description="Tenor label e.g. 1Y, 5Y, 10Y")
    value: Decimal = Field(description="Yield / rate / spread (units per provider docs)")
    currency: str | None = None
    schema_version: str = "1.0"


class CanonicalBondData(CanonicalBase):
    """Normalized bond bid/ask/YTM data row."""

    timestamp: AwareDatetime
    venue: str = Field(description="Data provider: openbb | ibkr")
    symbol: str = Field(description="Bond symbol or ISIN")
    name: str | None = None
    bid: Decimal | None = None
    ask: Decimal | None = None
    last: Decimal | None = None
    yield_to_maturity: Decimal | None = None
    currency: str | None = None
    schema_version: str = "1.0"


class CanonicalCdsSpread(CanonicalBase):
    """Normalized CDS spread index observation."""

    timestamp: AwareDatetime
    venue: str = "ofr"
    series_id: str
    index_name: str | None = None
    tenor: str | None = None
    sector: str | None = None
    spread_bps: Decimal = Field(description="CDS spread in basis points")
    schema_version: str = "1.0"
