"""CeFi/TradFi execution types — account state, margin, rejections, amendments."""

from __future__ import annotations

from decimal import Decimal

from pydantic import AwareDatetime, Field

from .base import _CanonicalBase


class CanonicalMarginState(_CanonicalBase):
    """Canonical margin account state — all venues."""

    account_id: str
    venue: str
    timestamp: AwareDatetime
    margin_level: Decimal
    total_collateral: Decimal
    total_debt: Decimal
    available_margin: Decimal
    liquidation_price: Decimal | None = None


class CanonicalAccountState(_CanonicalBase):
    """Canonical complete account state — all venues.

    ``positions`` and ``balances`` use the canonical types from domain.py.
    The forward-reference strings are resolved by model_rebuild() at module end.
    """

    timestamp: AwareDatetime
    venue: str
    account_id: str
    # Forward references resolved via model_rebuild() below
    positions: list[object] = Field(default_factory=list)
    balances: list[object] = Field(default_factory=list)
    margins: CanonicalMarginState | None = None


class CanonicalOrderRejection(_CanonicalBase):
    """Canonical order rejection event — all venues."""

    venue: str
    order_id: str
    instrument_id: str
    reason: str
    error_code: str
    retry_safe: bool
    timestamp: AwareDatetime


class CanonicalOrderAmendment(_CanonicalBase):
    """Canonical order amendment event — all venues."""

    venue: str
    order_id: str
    instrument_id: str
    original_quantity: Decimal
    new_quantity: Decimal
    original_price: Decimal | None
    new_price: Decimal | None
    timestamp: AwareDatetime
    amendment_id: str = ""
