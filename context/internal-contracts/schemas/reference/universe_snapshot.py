"""Per-venue universe snapshot — canonical domain contract for instrument sets."""

from __future__ import annotations

from datetime import UTC, datetime

from pydantic import BaseModel

from .instrument import InstrumentRecord


class UniverseSnapshot(BaseModel):
    """Snapshot of all instruments available at a venue at a point in time."""

    schema_version: str = "v1"
    snapshot_timestamp: datetime
    venue: str
    instrument_count: int
    instruments: list[InstrumentRecord]

    @classmethod
    def from_instruments(
        cls,
        venue: str,
        instruments: list[InstrumentRecord],
    ) -> UniverseSnapshot:
        return cls(
            snapshot_timestamp=datetime.now(UTC),
            venue=venue,
            instrument_count=len(instruments),
            instruments=instruments,
        )
