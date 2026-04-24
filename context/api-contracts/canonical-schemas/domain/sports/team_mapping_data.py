"""Static team mapping: canonical team ID → provider-specific IDs.

Loaded from data/team_mapping.csv (6,245 teams, ~297KB).
Pure crosswalk — no league or season context. Team IDs are stable
across seasons for all providers (only 3 edge cases in SF).

Refresh: Yearly, when new teams enter prediction leagues (promotion).
Add new rows to data/team_mapping.csv.

Usage:
    from unified_api_contracts.canonical.domain.sports.team_mapping_data import (
        get_team_provider_ids,
        get_team_by_af_id,
    )

    ids = get_team_provider_ids("ARSENAL")
    # → {"af_team_id": "42", "ft_team_id": "59", "us_team_id": "83", ...}

    team = get_team_by_af_id(42)
    # → {"canonical_team_id": "ARSENAL", "af_team_name": "Arsenal", ...}
"""

from __future__ import annotations

import contextlib
import csv
import logging
from functools import lru_cache
from pathlib import Path

from .canonical_ids import build_team_id

logger = logging.getLogger(__name__)

_DATA_FILE = Path(__file__).parent / "data" / "team_mapping.csv"


@lru_cache(maxsize=1)
def _load_mapping() -> list[dict[str, str]]:
    """Load team mapping CSV. Cached — loaded once per process."""
    if not _DATA_FILE.exists():
        logger.warning("Team mapping file not found: %s", _DATA_FILE)
        return []
    with _DATA_FILE.open() as f:
        return list(csv.DictReader(f))


@lru_cache(maxsize=1)
def _canonical_index() -> dict[str, dict[str, str]]:
    """Index by canonical_team_id for O(1) lookup."""
    return {row["canonical_team_id"]: row for row in _load_mapping()}


@lru_cache(maxsize=1)
def _af_id_index() -> dict[int, dict[str, str]]:
    """Index by af_team_id for O(1) lookup."""
    idx: dict[int, dict[str, str]] = {}
    for row in _load_mapping():
        af_id = row.get("af_team_id", "")  # noqa: qg-empty-fallback — CSV field may be absent
        if af_id:
            with contextlib.suppress(ValueError, TypeError):
                idx[int(float(af_id))] = row
    return idx


def get_team_provider_ids(canonical_team_id: str) -> dict[str, str]:
    """Get all provider IDs for a team by canonical ID.

    Returns empty dict if not found.
    """
    return _canonical_index().get(canonical_team_id, {})


def get_team_by_af_id(af_team_id: int) -> dict[str, str]:
    """Get team mapping by API-Football team ID.

    Returns empty dict if not found.
    """
    return _af_id_index().get(af_team_id, {})


@lru_cache(maxsize=1)
def _us_name_index() -> dict[str, str]:
    """Index: Understat team name (lowercased) → canonical_team_id."""
    idx: dict[str, str] = {}
    for row in _load_mapping():
        us_name = row.get("us_team_name")
        if us_name is not None and us_name.strip():
            idx[us_name.strip().lower()] = row["canonical_team_id"]
    return idx


@lru_cache(maxsize=1)
def _ft_name_index() -> dict[str, str]:
    """Index: FootyStats team name (lowercased) → canonical_team_id."""
    idx: dict[str, str] = {}
    for row in _load_mapping():
        ft_name = row.get("ft_team_name")
        if ft_name is not None and ft_name.strip():
            idx[ft_name.strip().lower()] = row["canonical_team_id"]
    return idx


def resolve_understat_team(team_name: str) -> str:
    """Resolve Understat team name to canonical team ID.

    Falls back to build_team_id() if no mapping found.
    """
    canonical = _us_name_index().get(team_name.lower().strip())
    return canonical if canonical else build_team_id(team_name)


def resolve_footystats_team(team_name: str) -> str:
    """Resolve FootyStats team name to canonical team ID.

    Falls back to build_team_id() if no mapping found.
    """
    canonical = _ft_name_index().get(team_name.lower().strip())
    return canonical if canonical else build_team_id(team_name)


def get_all_teams() -> list[dict[str, str]]:
    """Get all team mappings."""
    return _load_mapping()


def get_team_count() -> int:
    """Return number of mapped teams."""
    return len(_load_mapping())
