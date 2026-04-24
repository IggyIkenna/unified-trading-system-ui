"""Tournament Round Names — canonical round identifiers for football fixtures.

Migrated from ``sports-betting-services-previous/extra/rounds.py``.

Provides:
- ``ROUND_NAMES``: frozenset of ~210 known tournament round name strings
  (e.g. ``"Quarter-finals"``, ``"Regular Season - 12"``, ``"Group A - 3"``).
- ``ROUND_PREFIXES``: frozenset of ~65 unique prefix strings used to match
  round names by startswith (e.g. ``"Regular Season "`` matches
  ``"Regular Season - 1"`` through ``"Regular Season - 46"``).
- ``resolve_round_name``: look up whether a string is a known round name
  (exact or prefix match).
- ``RoundMatch``: lightweight result container returned by resolution.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Canonical round names — exhaustive list from the original codebase
# ---------------------------------------------------------------------------

ROUND_NAMES: frozenset[str] = frozenset(
    {
        "1/128-finals",
        "16th Finals",
        "1st Qualifying Round",
        "1st Round",
        "1st Round Qualifying",
        "1st Round Qualifying Replays",
        "1st Round Replays",
        "2nd Qualifying Round",
        "2nd Round",
        "2nd Round Qualifying",
        "2nd Round Qualifying Replays",
        "2nd Round Replays",
        "32nd Finals",
        "3rd Qualifying Round",
        "3rd Round",
        "3rd Round Qualifying",
        "3rd Round Qualifying Replays",
        "3rd Round Replays",
        "4th Round",
        "4th Round Qualifying",
        "4th Round Qualifying Replays",
        "4th Round Replays",
        "5th Round",
        "7th Round",
        "8th Finals",
        "8th Round",
        "Extra Preliminary Round",
        "Extra Preliminary Round Replays",
        "Final",
        # Group A-L, matchdays 1-6
        "Group A - 1",
        "Group A - 2",
        "Group A - 3",
        "Group A - 4",
        "Group A - 5",
        "Group A - 6",
        "Group B - 1",
        "Group B - 2",
        "Group B - 3",
        "Group B - 4",
        "Group B - 5",
        "Group B - 6",
        "Group C - 1",
        "Group C - 2",
        "Group C - 3",
        "Group C - 4",
        "Group C - 5",
        "Group C - 6",
        "Group D - 1",
        "Group D - 2",
        "Group D - 3",
        "Group D - 4",
        "Group D - 5",
        "Group D - 6",
        "Group E - 1",
        "Group E - 2",
        "Group E - 3",
        "Group E - 4",
        "Group E - 5",
        "Group E - 6",
        "Group F - 1",
        "Group F - 2",
        "Group F - 3",
        "Group F - 4",
        "Group F - 5",
        "Group F - 6",
        "Group G - 1",
        "Group G - 2",
        "Group G - 3",
        "Group G - 4",
        "Group G - 5",
        "Group G - 6",
        "Group H - 1",
        "Group H - 2",
        "Group H - 3",
        "Group H - 4",
        "Group H - 5",
        "Group H - 6",
        "Group I - 1",
        "Group I - 2",
        "Group I - 3",
        "Group I - 4",
        "Group I - 5",
        "Group I - 6",
        "Group J - 1",
        "Group J - 2",
        "Group J - 3",
        "Group J - 4",
        "Group J - 5",
        "Group J - 6",
        "Group K - 1",
        "Group K - 2",
        "Group K - 3",
        "Group K - 4",
        "Group K - 5",
        "Group K - 6",
        "Group L - 1",
        "Group L - 2",
        "Group L - 3",
        "Group L - 4",
        "Group L - 5",
        "Group L - 6",
        # Generic group / league stages
        "Group Stage - 1",
        "Group Stage - 2",
        "Group Stage - 3",
        "Group Stage - 4",
        "Group Stage - 5",
        "Group Stage - 6",
        "Knockout Round Play-offs",
        "League Stage - 1",
        "League Stage - 2",
        "League Stage - 3",
        "League Stage - 4",
        "League Stage - 5",
        "League Stage - 6",
        "League Stage - 7",
        "League Stage - 8",
        # Playoffs and preliminary
        "Play-offs",
        "Playoff round",
        "Preliminary Round",
        "Preliminary Round Replays",
        "Preliminary round",
        "Preliminary round 1",
        "Preliminary round 2",
        # Premier League Path
        "Premier League Path - Final",
        "Premier League Path - Group Stage - 1",
        "Premier League Path - Group Stage - 2",
        "Premier League Path - Group Stage - 3",
        "Premier League Path - Group Stage - 4",
        "Premier League Path - Group Stage - 5",
        "Premier League Path - Quarter-finals",
        "Premier League Path - Semi-finals",
        # Promotion Play-offs
        "Promotion Play-offs - 1st Round",
        "Promotion Play-offs - 2nd Round",
        "Promotion Play-offs - Final",
        "Promotion Play-offs - Finals",
        "Promotion Play-offs - Qualifying Round",
        "Promotion Play-offs - Semi-finals",
        "Promotion Play-offs - final",
        # Knockout rounds
        "Quarter-finals",
        # Regions Path
        "Regions Path - 1st Round",
        "Regions Path - 2nd Round",
        "Regions Path - 3rd Round",
        "Regions Path - 4th Round",
        "Regions Path - 5th Round",
        "Regions Path - 6th Round",
        "Regions Path - Final",
        "Regions Path - Final - 1st Round",
        "Regions Path - Final - 2nd Round",
        "Regions Path - Quarter-finals - 1st Round",
        "Regions Path - Quarter-finals - 2nd Round",
        "Regions Path - Semi-finals",
        "Regions Path - Semi-finals - 1st Round",
        "Regions Path - Semi-finals - 2nd Round",
        # Regular Season matchdays 1-46
        "Regular Season - 1",
        "Regular Season - 10",
        "Regular Season - 11",
        "Regular Season - 12",
        "Regular Season - 13",
        "Regular Season - 14",
        "Regular Season - 15",
        "Regular Season - 16",
        "Regular Season - 17",
        "Regular Season - 18",
        "Regular Season - 19",
        "Regular Season - 2",
        "Regular Season - 20",
        "Regular Season - 21",
        "Regular Season - 22",
        "Regular Season - 23",
        "Regular Season - 24",
        "Regular Season - 25",
        "Regular Season - 26",
        "Regular Season - 27",
        "Regular Season - 28",
        "Regular Season - 29",
        "Regular Season - 3",
        "Regular Season - 30",
        "Regular Season - 31",
        "Regular Season - 32",
        "Regular Season - 33",
        "Regular Season - 34",
        "Regular Season - 35",
        "Regular Season - 36",
        "Regular Season - 37",
        "Regular Season - 38",
        "Regular Season - 39",
        "Regular Season - 4",
        "Regular Season - 40",
        "Regular Season - 41",
        "Regular Season - 42",
        "Regular Season - 43",
        "Regular Season - 44",
        "Regular Season - 45",
        "Regular Season - 46",
        "Regular Season - 5",
        "Regular Season - 6",
        "Regular Season - 7",
        "Regular Season - 8",
        "Regular Season - 9",
        # Relegation
        "Relegation Decider",
        "Relegation Play-off Decider",
        "Relegation Play-offs - Final",
        "Relegation Round",
        # Round of N
        "Round of 128",
        "Round of 16",
        "Round of 32",
        "Round of 64",
        # Semi-finals
        "Semi-finals",
    }
)


# ---------------------------------------------------------------------------
# Round prefixes — used for startswith matching when exact lookup fails.
# Derived from the original ``split_rounds`` set.  Trailing whitespace on
# group/path prefixes is intentional so ``"Group A "`` matches
# ``"Group A - 1"`` but not ``"Group ABC"``.
# ---------------------------------------------------------------------------

ROUND_PREFIXES: frozenset[str] = frozenset(
    {
        "1/128",
        "16th Finals",
        "1st Qualifying Round",
        "1st Round",
        "1st Round Qualifying",
        "1st Round Qualifying Replays",
        "1st Round Replays",
        "2nd Qualifying Round",
        "2nd Round",
        "2nd Round Qualifying",
        "2nd Round Qualifying Replays",
        "2nd Round Replays",
        "32nd Finals",
        "3rd Qualifying Round",
        "3rd Round",
        "3rd Round Qualifying",
        "3rd Round Qualifying Replays",
        "3rd Round Replays",
        "4th Round",
        "4th Round Qualifying",
        "4th Round Qualifying Replays",
        "4th Round Replays",
        "5th Round",
        "7th Round",
        "8th Finals",
        "8th Round",
        "Extra Preliminary Round",
        "Extra Preliminary Round Replays",
        "Final",
        "Group A ",
        "Group B ",
        "Group C ",
        "Group D ",
        "Group E ",
        "Group F ",
        "Group G ",
        "Group H ",
        "Group I ",
        "Group J ",
        "Group K ",
        "Group L ",
        "Group Stage ",
        "Knockout Round Play",
        "League Stage ",
        "Play",
        "Playoff round",
        "Preliminary Round",
        "Preliminary Round Replays",
        "Preliminary round",
        "Preliminary round 1",
        "Preliminary round 2",
        "Premier League Path ",
        "Promotion Play",
        "Quarter",
        "Regions Path ",
        "Regular Season ",
        "Relegation Decider",
        "Relegation Play",
        "Relegation Round",
        "Round of 128",
        "Round of 16",
        "Round of 32",
        "Round of 64",
        "Semi",
    }
)

# Pre-sort prefixes longest-first so the most specific prefix wins.
_SORTED_PREFIXES: tuple[str, ...] = tuple(sorted(ROUND_PREFIXES, key=len, reverse=True))


# ---------------------------------------------------------------------------
# RoundMatch — lightweight result container
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class RoundMatch:
    """Result of a round-name resolution.

    Attributes
    ----------
    name:
        The round name string that was matched (the original input when an
        exact match is found, or the matching prefix otherwise).
    is_exact:
        ``True`` when *name* matched an entry in :data:`ROUND_NAMES` exactly.
    matched_prefix:
        The prefix string that matched when ``is_exact`` is ``False``.
        ``None`` for exact matches.
    """

    name: str
    is_exact: bool
    matched_prefix: str | None = None


# ---------------------------------------------------------------------------
# Lookup function
# ---------------------------------------------------------------------------


def resolve_round_name(name: str) -> RoundMatch | None:
    """Resolve a round name string against known tournament rounds.

    Lookup strategy:
    1. **Exact match** — checks ``name`` against :data:`ROUND_NAMES`.
    2. **Prefix match** — checks whether ``name`` starts with any entry in
       :data:`ROUND_PREFIXES` (longest prefix wins).

    Parameters
    ----------
    name:
        The round name to look up (e.g. ``"Quarter-finals"``,
        ``"Regular Season - 22"``).

    Returns
    -------
    RoundMatch | None
        A :class:`RoundMatch` if the name is recognised, otherwise ``None``.
    """
    stripped = name.strip()
    if not stripped:
        return None

    # 1. Exact match
    if stripped in ROUND_NAMES:
        return RoundMatch(name=stripped, is_exact=True)

    # 2. Prefix match (longest-first)
    for prefix in _SORTED_PREFIXES:
        if stripped.startswith(prefix):
            return RoundMatch(name=stripped, is_exact=False, matched_prefix=prefix)

    logger.debug("Round name not recognised: %r", name)
    return None


def is_known_round(name: str) -> bool:
    """Return ``True`` if *name* is a known round (exact or prefix match)."""
    return resolve_round_name(name) is not None
