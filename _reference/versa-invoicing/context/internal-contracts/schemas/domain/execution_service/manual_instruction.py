"""Execution-service manual instruction schema."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ManualInstruction(BaseModel):
    """An operator-submitted manual execution instruction for audit and routing."""

    instruction_id: str
    submitted_by: str
    venue: str
    account_id: str
    instrument_key: str
    side: str
    order_type: str
    quantity: Decimal
    submitted_at: datetime
    price: Decimal | None = None
    reason: str = Field(default="manual_trade")


__all__ = ["ManualInstruction"]
