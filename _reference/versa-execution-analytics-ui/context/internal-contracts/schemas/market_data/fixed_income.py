"""Fixed income canonical schemas — bonds, yield curves.

Per plan Appendix A.17. Sources: FRED, ECB, IBKR.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class CanonicalBondData(BaseModel):
    """Normalized bond market data — IBKR TWS, OpenBB."""

    instrument_key: str
    venue: str
    timestamp: datetime
    bid_price: Decimal | None = None
    ask_price: Decimal | None = None
    last_price: Decimal | None = None
    bid_yield: Decimal | None = None
    ask_yield: Decimal | None = None
    ytm: Decimal | None = None  # yield to maturity
    ytw: Decimal | None = None  # yield to worst
    duration: Decimal | None = None  # modified duration %
    convexity: Decimal | None = None
    dv01: Decimal | None = None  # dollar value of 1bp
    coupon_rate: Decimal | None = None
    coupon_frequency: int | None = None  # payments per year
    maturity_date: datetime | None = None
    cusip: str | None = None
    isin: str | None = None


class YieldCurveTenor(BaseModel):
    """Single tenor on yield curve."""

    maturity_label: str  # "2Y", "10Y"
    maturity_years: float
    yield_bps: int


class CanonicalYieldCurve(BaseModel):
    """Normalized yield curve — FRED, ECB, IBKR."""

    source: str  # "FRED", "ECB", "IBKR"
    currency: str  # "USD", "EUR", "GBP"
    curve_type: str  # "TREASURY", "OIS", "ESTR", "SOFR"
    as_of: datetime
    tenors: list[YieldCurveTenor]
