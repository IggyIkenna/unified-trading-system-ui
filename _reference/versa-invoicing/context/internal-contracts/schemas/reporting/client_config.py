"""Client configuration contracts for the unified trading system."""

from decimal import Decimal
from typing import TypedDict


class ClientConfig(TypedDict, total=False):
    """Configuration for a single client.

    Fee percentage fields use Decimal to prevent IEEE 754 precision errors.
    When loading from YAML, callers must convert float values to Decimal before
    passing to FeeStructure for arithmetic.
    """

    full_name: str
    tranche: str
    currency: str
    venue: str
    secret_name: str
    odum_fee_pct: Decimal
    trader_fee_pct: Decimal
    introducer_id: str
    introducer_fee_pct: Decimal
    is_underwater: bool
    is_active: bool
    data_source: str
    is_pooled: bool
    pool_investors: dict[str, Decimal]


class CredentialsRegistry(TypedDict):
    """The complete credentials registry structure."""

    clients: dict[str, ClientConfig]
    server_costs_per_underwater_account_usd: int
