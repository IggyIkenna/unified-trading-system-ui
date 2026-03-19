"""Internal options chain snapshot schema.

Note: UAC owns the canonical ``CanonicalOptionsChainEntry`` (venue-normalised,
17 fields including timestamp/venue/symbol, CanonicalBase).  This internal
schema carries a different field set (put_call vs option_type, expiry vs
expiration, bid/ask vs bid_price/ask_price, plus rho/last/open_interest/volume
not present in UAC) and is used for internal strategy-service consumption only.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


class InternalOptionsChainSnapshot(BaseModel):
    """Internal options chain snapshot — distinct from UAC CanonicalOptionsChainEntry.

    Field differences vs UAC canonical:
      - expiry (datetime) vs expiration (AwareDatetime)
      - put_call (Literal) vs option_type (str)
      - bid/ask/last/iv vs bid_price/ask_price/implied_volatility
      - rho, open_interest, volume (not in UAC)
      - No timestamp/venue/symbol/bid_size/ask_size/instrument_key (UAC-only)
    """

    underlying: str
    expiry: datetime
    strike: Decimal
    put_call: Literal["put", "call"]
    bid: Decimal | None = None
    ask: Decimal | None = None
    last: Decimal | None = None
    iv: Decimal | None = None
    delta: Decimal | None = None
    gamma: Decimal | None = None
    theta: Decimal | None = None
    vega: Decimal | None = None
    rho: Decimal | None = None
    open_interest: Decimal | None = None
    volume: Decimal | None = None
