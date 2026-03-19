"""Fee structure contract for the unified trading system."""

from decimal import Decimal

from pydantic import BaseModel, field_validator


class FeeStructure(BaseModel):
    """Defines the fee percentages and introducer relationship for a client account.

    All fee fields are expressed as decimal fractions (e.g. 0.20 = 20%).
    Stored as Decimal to prevent IEEE 754 precision errors in P&L calculations.
    """

    trader_fee_pct: Decimal
    """Performance fee percentage paid to the trader (e.g. Decimal("0.20") for 20%)."""

    odum_fee_pct: Decimal
    """Performance fee percentage retained by Odum (e.g. Decimal("0.05") for 5%)."""

    introducer_fee_pct: Decimal | None = None
    """Share of the Odum fee paid to the introducing party, if any."""

    introducer_id: str | None = None
    """Identifier of the introducing party, required when introducer_fee_pct is set."""

    @field_validator("trader_fee_pct", "odum_fee_pct", "introducer_fee_pct", mode="before")
    @classmethod
    def coerce_to_decimal(cls, v: object) -> Decimal | None:
        """Coerce float or str fee values to Decimal for precision-safe arithmetic."""
        if v is None:
            return None
        if isinstance(v, float):
            return Decimal(str(v))
        if isinstance(v, (int, str, Decimal)):
            return Decimal(v)
        msg = f"Cannot coerce {type(v).__name__!r} to Decimal"
        raise ValueError(msg)
