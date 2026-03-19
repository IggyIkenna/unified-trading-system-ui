"""Derivatives options schemas — options chain, contract, greeks, settlement."""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal

from pydantic import AwareDatetime


@dataclass
class SettlementPrice:
    """Settlement price for a derivative instrument."""

    venue: str
    symbol: str
    price: Decimal
    settlement_time: AwareDatetime
    contract_type: str = "perpetual"  # "perpetual" | "quarterly" | "monthly"


@dataclass
class OptionGreeks:
    """Option Greeks."""

    delta: Decimal | None = None
    gamma: Decimal | None = None
    theta: Decimal | None = None
    vega: Decimal | None = None
    rho: Decimal | None = None
    vanna: Decimal | None = None  # dDelta/dIV
    volga: Decimal | None = None  # dVega/dIV


@dataclass
class OptionContract:
    """Single option contract quote."""

    strike: Decimal
    option_type: str  # "call" | "put"
    bid: Decimal | None
    ask: Decimal | None
    last: Decimal | None
    volume: Decimal | None
    open_interest: Decimal | None
    implied_volatility: Decimal | None
    greeks: OptionGreeks | None = None


@dataclass
class OptionsChain:
    """Options chain for an underlying at an expiry."""

    venue: str
    underlying: str
    expiry: AwareDatetime
    strikes: list[Decimal] = field(default_factory=list)
    calls: dict[str, OptionContract] = field(default_factory=dict)
    puts: dict[str, OptionContract] = field(default_factory=dict)
    timestamp: AwareDatetime | None = None
