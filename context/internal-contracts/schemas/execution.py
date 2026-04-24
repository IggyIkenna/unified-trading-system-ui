"""Execution-service top-level internal contracts.

Contains schemas for manual/operator-initiated execution operations that
are not covered by the canonical ExecutionInstruction in UAC.

Note: CanonicalOrder, CanonicalFill, ExecutionInstruction, ExecutionResult
live in UAC unified_api_contracts.canonical.domain.execution (the canonical layer).
This module is for UIC-owned internal schemas consumed within and between
execution-service components.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class SettlementType(StrEnum):
    """Types of settlement events that change token balances."""

    FUNDING_8H = "funding_8h"
    FUNDING_CONTINUOUS = "funding_continuous"
    SEASONAL_WEEKLY = "seasonal_weekly"
    AAVE_INDEX = "aave_index"
    STAKING_YIELD = "staking_yield"
    LST_YIELD = "lst_yield"
    TRANSACTION_FEE = "transaction_fee"
    GAS_REBATE = "gas_rebate"
    LIQUIDATION = "liquidation"
    LP_FEE = "lp_fee"
    FLASH_LOAN_FEE = "flash_loan_fee"


class ManualExecutionMode(StrEnum):
    """How a manual instruction should be processed by the execution service."""

    EXECUTE = "execute"
    """Route to venue via orchestrator (normal flow — same path as automated strategies)."""

    RECORD_ONLY = "record_only"
    """Skip venue execution, record fill directly (OTC, missed trades, simulation)."""


class ManualInstruction(BaseModel):
    """An operator-submitted manual execution instruction for audit and routing.

    Created by the manual-trading API endpoint and persisted to the audit log
    before being forwarded to the live orchestrator (EXECUTE mode) or recorded
    directly as a fill (RECORD_ONLY mode).

    Attributes:
        instruction_id: Unique UUID for idempotency and audit tracing.
        submitted_by: Identity of the operator (OAuth sub claim).
        venue: Target venue slug (e.g. "binance", "deribit", or counterparty for OTC).
        account_id: Account identifier at the venue.
        instrument_key: Canonical instrument key (VENUE:TYPE:SYMBOL).
        side: "BUY" or "SELL".
        order_type: Execution algorithm or order type (e.g. "MARKET", "TWAP").
        quantity: Order quantity in base asset units.
        price: Limit price; None for market orders.
        reason: Human-readable reason for the manual trade (audit log).
        submitted_at: UTC wall-clock time of submission.
        execution_mode: EXECUTE (route to venue) or RECORD_ONLY (direct fill recording).
        client_id: Org hierarchy — client identifier.
        strategy_id: Org hierarchy — strategy identifier.
        portfolio_id: Org hierarchy — portfolio/book identifier.
        category: Instrument category (e.g. "cefi", "defi", "sports", "prediction").
        counterparty: OTC counterparty identifier.
        source_reference: External trade ID (exchange reference, broker confirmation).
    """

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
    execution_mode: ManualExecutionMode = ManualExecutionMode.EXECUTE
    client_id: str = ""
    strategy_id: str = ""
    portfolio_id: str = ""
    category: str = ""
    counterparty: str = ""
    source_reference: str = ""


__all__ = ["ManualExecutionMode", "ManualInstruction", "SettlementType"]
