"""League classification raw data - assembler and default registry.

Merges LEAGUE_CLASSIFICATION_DATA_A and LEAGUE_CLASSIFICATION_DATA_B
into a single LEAGUE_CLASSIFICATION_DATA dict (94 leagues total) and
builds the DEFAULT_CLASSIFICATION_REGISTRY singleton.

Source: Ported from instruments-service/instruments_service/sports/
into UAC so all downstream consumers share a single SSOT.
"""

from __future__ import annotations

from .league_classification_data_a import LEAGUE_CLASSIFICATION_DATA_A
from .league_classification_data_b import LEAGUE_CLASSIFICATION_DATA_B
from .league_registry import LeagueClassificationRegistry

LEAGUE_CLASSIFICATION_DATA: dict[int, dict[str, str | int | bool | dict[str, bool] | None]] = {
    **LEAGUE_CLASSIFICATION_DATA_A,
    **LEAGUE_CLASSIFICATION_DATA_B,
}

DEFAULT_CLASSIFICATION_REGISTRY: LeagueClassificationRegistry = LeagueClassificationRegistry.from_raw_dict(
    LEAGUE_CLASSIFICATION_DATA
)

__all__ = [
    "DEFAULT_CLASSIFICATION_REGISTRY",
    "LEAGUE_CLASSIFICATION_DATA",
]
