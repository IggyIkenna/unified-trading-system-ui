#!/usr/bin/env python3
"""
Football competition round definitions and normalization utilities.

Provides canonical lists of round names seen in the API-Football data source
together with a mapping of full round names to their *split* (group-level)
equivalents. These are used by feature pipelines to bucket fixtures into
comparable competition phases.

Usage:
    python scripts/sports/rounds.py                 # Print summary
    python scripts/sports/rounds.py --list          # Print all rounds
    python scripts/sports/rounds.py --split         # Print split-round mapping
    python scripts/sports/rounds.py --normalize "Regular Season - 12"
"""

from __future__ import annotations

import argparse
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Canonical round names observed in API-Football data
# ---------------------------------------------------------------------------

ROUNDS: list[str] = [
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
    "Play-offs",
    "Playoff round",
    "Preliminary Round",
    "Preliminary Round Replays",
    "Preliminary round",
    "Preliminary round 1",
    "Preliminary round 2",
    "Premier League Path - Final",
    "Premier League Path - Group Stage - 1",
    "Premier League Path - Group Stage - 2",
    "Premier League Path - Group Stage - 3",
    "Premier League Path - Group Stage - 4",
    "Premier League Path - Group Stage - 5",
    "Premier League Path - Quarter-finals",
    "Premier League Path - Semi-finals",
    "Promotion Play-offs - 1st Round",
    "Promotion Play-offs - 2nd Round",
    "Promotion Play-offs - Final",
    "Promotion Play-offs - Finals",
    "Promotion Play-offs - Qualifying Round",
    "Promotion Play-offs - Semi-finals",
    "Promotion Play-offs - final",
    "Quarter-finals",
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
    "Relegation Decider",
    "Relegation Play-off Decider",
    "Relegation Play-offs - Final",
    "Relegation Round",
    "Round of 128",
    "Round of 16",
    "Round of 32",
    "Round of 64",
    "Semi-finals",
]

# ---------------------------------------------------------------------------
# Split-round mapping: group-level prefix used to normalize round names
# ---------------------------------------------------------------------------

SPLIT_ROUNDS: set[str] = {
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


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------


def normalize_round(round_name: str) -> str:
    """Return the split-round prefix that *round_name* belongs to.

    If no split-round prefix matches, the original name is returned unchanged.
    """
    for prefix in sorted(SPLIT_ROUNDS, key=len, reverse=True):
        if round_name.startswith(prefix):
            return prefix.rstrip()
    return round_name


def is_regular_season(round_name: str) -> bool:
    """Return True if the round represents a regular-season matchday."""
    return round_name.startswith("Regular Season")


def is_knockout(round_name: str) -> bool:
    """Return True if the round represents a knockout-stage fixture."""
    knockout_prefixes = (
        "Quarter",
        "Semi",
        "Final",
        "Round of",
        "1/128",
        "8th Finals",
        "16th Finals",
        "32nd Finals",
    )
    return round_name.startswith(knockout_prefixes)


# ---------------------------------------------------------------------------
# Standalone entry-point
# ---------------------------------------------------------------------------


def main() -> None:
    """Print round information or normalize a given round name."""
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(description="Football round definitions and normalization")
    parser.add_argument("--list", action="store_true", help="Print all canonical round names")
    parser.add_argument("--split", action="store_true", help="Print split-round prefixes")
    parser.add_argument("--normalize", type=str, default="", help="Normalize a specific round name")
    args = parser.parse_args()

    if args.normalize:
        normalized = normalize_round(args.normalize)
        logger.info("Input:      %s", args.normalize)
        logger.info("Normalized: %s", normalized)
        logger.info("Regular season: %s", is_regular_season(args.normalize))
        logger.info("Knockout:       %s", is_knockout(args.normalize))
        return

    if args.list:
        logger.info("All %d canonical round names:", len(ROUNDS))
        for r in ROUNDS:
            logger.info("  %s", r)
        return

    if args.split:
        logger.info("All %d split-round prefixes:", len(SPLIT_ROUNDS))
        for prefix in sorted(SPLIT_ROUNDS):
            logger.info("  '%s'", prefix)
        return

    # Default: summary
    regular = [r for r in ROUNDS if is_regular_season(r)]
    knockout = [r for r in ROUNDS if is_knockout(r)]
    other = [r for r in ROUNDS if not is_regular_season(r) and not is_knockout(r)]

    logger.info("Round summary:")
    logger.info("  Total rounds:    %d", len(ROUNDS))
    logger.info("  Regular season:  %d", len(regular))
    logger.info("  Knockout:        %d", len(knockout))
    logger.info("  Other:           %d", len(other))
    logger.info("  Split prefixes:  %d", len(SPLIT_ROUNDS))


if __name__ == "__main__":
    main()
