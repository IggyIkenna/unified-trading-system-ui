"""Fee schedule contracts — execution fee structures for clients, venues, and prime brokers.

Three-layer fee model:
  1. Exchange fees   — maker/taker rates per venue, per-client tier (volume-based)
  2. Prime broker    — PB markup/spread/custody, linked per client with optional override
  3. Clearing        — clearinghouse or settlement agent fee per contract/notional

All monetary values use Decimal. No float.
"""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from decimal import Decimal
from enum import StrEnum


class FeeType(StrEnum):
    """Which layer of the fee stack an entry belongs to."""

    EXCHANGE = "exchange"
    PRIME_BROKER = "prime_broker"
    CLEARING = "clearing"


@dataclass
class FeeScheduleEntry:
    """A single fee tier entry for one client x venue x fee_type.

    client_id     — the account/fund this entry applies to.
                    For PB default entries, set to the pb_id (e.g. "hidden_road");
                    downstream resolution replaces it with the client_id when serving.
    venue         — exchange venue string (e.g. "BYBIT", "OKX", "BINANCE_FUTURES").
                    Use "*" to indicate this entry applies to all venues for this layer.
    fee_type      — which fee layer this entry covers.
    instrument_type — InstrumentType value this applies to, or None for all types.
    maker_fee_bps / taker_fee_bps — fee in basis points (1 bps = 0.01%).
    flat_fee_per_contract — absolute per-contract fee (e.g. clearing per-lot).
    tier_name     — human-readable tier label (e.g. "vip1", "institutional_prime").
    effective_from / effective_until — date range; None means no bound.
    is_default    — True = this is an onboarding default; per-client entries override it.
    """

    client_id: str
    venue: str
    fee_type: FeeType
    maker_fee_bps: Decimal
    taker_fee_bps: Decimal
    instrument_type: str | None = None
    flat_fee_per_contract: Decimal = Decimal("0")
    fee_currency: str = "USDT"
    tier_name: str = "default"
    effective_from: datetime | None = None
    effective_until: datetime | None = None
    is_default: bool = False

    def is_active(self, at: datetime | None = None) -> bool:
        """Return True if this entry is active at the given datetime (default: now)."""
        ts = at or datetime.now(UTC)
        if self.effective_from and ts < self.effective_from:
            return False
        return not (self.effective_until and ts > self.effective_until)


@dataclass
class ClientFeeSchedule:
    """Complete fee picture for a client: exchange + PB + clearing stacked.

    entries is the resolved list after PB defaults have been merged with
    per-client overrides. Callers should use get_effective_fee_schedule()
    from the fee_schedule_store rather than constructing this directly.
    """

    client_id: str
    venue: str
    entries: list[FeeScheduleEntry] = field(default_factory=list)

    def _entries_for(self, instrument_type: str | None) -> list[FeeScheduleEntry]:
        return [
            e
            for e in self.entries
            if e.instrument_type in (instrument_type, None) and e.is_active()
        ]

    def total_taker_bps(self, instrument_type: str | None = None) -> Decimal:
        """Sum of taker bps across all active fee layers."""
        return sum((e.taker_fee_bps for e in self._entries_for(instrument_type)), Decimal(0))

    def total_maker_bps(self, instrument_type: str | None = None) -> Decimal:
        """Sum of maker bps across all active fee layers."""
        return sum((e.maker_fee_bps for e in self._entries_for(instrument_type)), Decimal(0))

    def layer(
        self, fee_type: FeeType, instrument_type: str | None = None
    ) -> FeeScheduleEntry | None:
        """Return the active entry for a specific fee layer, or None if absent."""
        matches = [e for e in self._entries_for(instrument_type) if e.fee_type == fee_type]
        return matches[0] if matches else None


@dataclass
class PrimeBrokerEntity:
    """A prime broker with its default fee schedule.

    fee_schedule contains FeeScheduleEntry records with fee_type=PRIME_BROKER.
    These serve as defaults for all clients linked to this PB; clients can
    override individual entries via ClientPrimeBrokerLink.fee_overrides.
    """

    pb_id: str
    display_name: str
    fee_schedule: list[FeeScheduleEntry] = field(default_factory=list)
    active: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class ClientPrimeBrokerLink:
    """Links a client to their prime broker, with optional per-layer overrides.

    Resolution logic:
      For each layer, use fee_overrides entry if present, else PB default.
      Empty fee_overrides = use PB defaults exactly for all layers.
    """

    client_id: str
    pb_id: str
    fee_overrides: list[FeeScheduleEntry] = field(default_factory=list)
    linked_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    active: bool = True
