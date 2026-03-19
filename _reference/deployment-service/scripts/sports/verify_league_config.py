#!/usr/bin/env python3
"""
Verify league classification configuration against the reference document.

Compares the in-memory LEAGUE_CLASSIFICATION mapping with the expected values
from LEAGUE_CLASSIFICATION.md Section 2.2 (Country-by-Country Hierarchy).

Reports discrepancies (tier, odds_api_league_name, classification mismatches),
missing leagues, and extra entries that use placeholder IDs.

Usage:
    python scripts/sports/verify_league_config.py
    python scripts/sports/verify_league_config.py --json   # JSON output
"""

from __future__ import annotations

import argparse
import json
import logging
import sys

from league_config import LEAGUE_CLASSIFICATION_DATA

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Expected data from LEAGUE_CLASSIFICATION.md Section 2.2
# ---------------------------------------------------------------------------

LeagueExpectation = dict[str, int | str | None]

EXPECTED_FROM_DOC: dict[int, LeagueExpectation] = {
    # England
    39: {"tier": 1, "odds_api": "soccer_epl", "classification": "Prediction"},
    40: {"tier": 2, "odds_api": "soccer_efl_champ", "classification": "Prediction"},
    41: {"tier": 3, "odds_api": "soccer_england_league1", "classification": "Prediction"},
    42: {"tier": 4, "odds_api": "soccer_england_league2", "classification": "Prediction"},
    43: {"tier": 5, "odds_api": None, "classification": "Features"},
    48: {"tier": None, "odds_api": "soccer_england_efl_cup", "classification": "Reference"},
    45: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Spain
    140: {"tier": 1, "odds_api": "soccer_spain_la_liga", "classification": "Prediction"},
    141: {"tier": 2, "odds_api": "soccer_spain_segunda_division", "classification": "Prediction"},
    536: {"tier": 3, "odds_api": None, "classification": "Features"},
    143: {"tier": None, "odds_api": None, "classification": "Reference"},
    556: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Germany
    78: {"tier": 1, "odds_api": "soccer_germany_bundesliga", "classification": "Prediction"},
    79: {"tier": 2, "odds_api": "soccer_germany_bundesliga2", "classification": "Prediction"},
    80: {"tier": 3, "odds_api": "soccer_germany_liga3", "classification": "Prediction"},
    81: {"tier": None, "odds_api": None, "classification": "Reference"},
    529: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Italy
    135: {"tier": 1, "odds_api": "soccer_italy_serie_a", "classification": "Prediction"},
    136: {"tier": 2, "odds_api": "soccer_italy_serie_b", "classification": "Prediction"},
    137: {"tier": None, "odds_api": None, "classification": "Reference"},
    547: {"tier": None, "odds_api": None, "classification": "Reference"},
    # France
    61: {"tier": 1, "odds_api": "soccer_france_ligue_one", "classification": "Prediction"},
    62: {"tier": 2, "odds_api": "soccer_france_ligue_two", "classification": "Prediction"},
    63: {"tier": 3, "odds_api": None, "classification": "Features"},
    66: {"tier": None, "odds_api": None, "classification": "Reference"},
    526: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Netherlands
    88: {"tier": 1, "odds_api": "soccer_netherlands_eredivisie", "classification": "Prediction"},
    89: {"tier": 2, "odds_api": None, "classification": "Features"},
    90: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Portugal
    94: {"tier": 1, "odds_api": "soccer_portugal_primeira_liga", "classification": "Prediction"},
    95: {"tier": 2, "odds_api": None, "classification": "Features"},
    96: {"tier": None, "odds_api": None, "classification": "Reference"},
    97: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Belgium
    144: {"tier": 1, "odds_api": "soccer_belgium_first_div", "classification": "Prediction"},
    145: {"tier": 2, "odds_api": None, "classification": "Features"},
    146: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Turkey
    203: {"tier": 1, "odds_api": "soccer_turkey_super_league", "classification": "Prediction"},
    204: {"tier": 2, "odds_api": None, "classification": "Features"},
    205: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Greece
    197: {"tier": 1, "odds_api": "soccer_greece_super_league", "classification": "Prediction"},
    198: {"tier": 2, "odds_api": None, "classification": "Features"},
    199: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Scotland
    179: {"tier": 1, "odds_api": "soccer_spl", "classification": "Prediction"},
    180: {"tier": 2, "odds_api": None, "classification": "Features"},
    181: {"tier": None, "odds_api": None, "classification": "Reference"},
    182: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Austria
    218: {"tier": 1, "odds_api": "soccer_austria_bundesliga", "classification": "Prediction"},
    219: {"tier": 2, "odds_api": None, "classification": "Features"},
    220: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Switzerland
    207: {"tier": 1, "odds_api": "soccer_switzerland_superleague", "classification": "Prediction"},
    208: {"tier": 2, "odds_api": None, "classification": "Features"},
    209: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Denmark
    119: {"tier": 1, "odds_api": "soccer_denmark_superliga", "classification": "Prediction"},
    120: {"tier": 2, "odds_api": None, "classification": "Features"},
    121: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Sweden
    103: {"tier": 1, "odds_api": "soccer_sweden_allsvenskan", "classification": "Prediction"},
    104: {"tier": 2, "odds_api": None, "classification": "Features"},
    105: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Poland
    106: {"tier": 1, "odds_api": "soccer_poland_ekstraklasa", "classification": "Prediction"},
    107: {"tier": 2, "odds_api": None, "classification": "Features"},
    108: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Argentina
    128: {
        "tier": 1,
        "odds_api": "soccer_argentina_primera_division",
        "classification": "Prediction",
    },
    129: {"tier": 2, "odds_api": None, "classification": "Features"},
    130: {"tier": None, "odds_api": None, "classification": "Reference"},
    131: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Brazil
    71: {"tier": 1, "odds_api": "soccer_brazil_campeonato", "classification": "Prediction"},
    72: {"tier": 2, "odds_api": None, "classification": "Features"},
    73: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Chile
    265: {"tier": 1, "odds_api": "soccer_chile_campeonato", "classification": "Prediction"},
    266: {"tier": 2, "odds_api": None, "classification": "Features"},
    267: {"tier": None, "odds_api": None, "classification": "Reference"},
    # USA
    253: {"tier": 1, "odds_api": "soccer_usa_mls", "classification": "Prediction"},
    254: {"tier": 2, "odds_api": None, "classification": "Features"},
    255: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Mexico
    262: {"tier": 1, "odds_api": "soccer_mexico_ligamx", "classification": "Prediction"},
    263: {"tier": 2, "odds_api": None, "classification": "Features"},
    264: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Japan
    98: {"tier": 1, "odds_api": "soccer_japan_j_league", "classification": "Prediction"},
    99: {"tier": 2, "odds_api": None, "classification": "Features"},
    100: {"tier": None, "odds_api": None, "classification": "Reference"},
    101: {"tier": None, "odds_api": None, "classification": "Reference"},
    # South Korea
    292: {"tier": 1, "odds_api": "soccer_korea_kleague1", "classification": "Prediction"},
    293: {"tier": 2, "odds_api": None, "classification": "Features"},
    294: {"tier": None, "odds_api": None, "classification": "Reference"},
    # Multi-Country Competitions
    2: {"tier": None, "odds_api": "soccer_uefa_champs_league", "classification": "Reference"},
    3: {"tier": None, "odds_api": "soccer_uefa_europa_league", "classification": "Reference"},
    848: {"tier": None, "odds_api": None, "classification": "Reference"},
    5: {
        "tier": None,
        "odds_api": "soccer_conmebol_copa_libertadores",
        "classification": "Reference",
    },
    6: {"tier": None, "odds_api": None, "classification": "Reference"},
}

# Known ID conflicts between the source document and the real API-Football IDs.
KNOWN_ID_CONFLICTS: list[dict[str, str | int | list[str]]] = [
    {
        "id": 39,
        "leagues": ["Premier League (England)", "FA Cup (England - line 162)"],
        "resolution": "Config uses placeholder 1039 for FA Cup",
    },
    {
        "id": 103,
        "leagues": ["Allsvenskan (Sweden - line 352)", "Eliteserien (Norway - line 365)"],
        "resolution": "Config uses placeholder 365 for Norway Eliteserien",
    },
    {
        "id": 104,
        "leagues": ["Superettan (Sweden - line 353)", "1. divisjon (Norway - line 366)"],
        "resolution": "Config uses placeholder 366 for Norway 1. divisjon",
    },
    {
        "id": 105,
        "leagues": ["Swedish Cup (line 357)", "Norwegian Cup (line 370)"],
        "resolution": "Config uses placeholder 367 for Norwegian Cup",
    },
    {
        "id": 203,
        "leagues": ["Super Lig (Turkey - line 273)", "A-League (Australia - line 485)"],
        "resolution": "Config uses placeholder 195 for Australia A-League",
    },
    {
        "id": 204,
        "leagues": ["TFF First League (Turkey - line 274)", "FFA Cup (Australia - line 490)"],
        "resolution": "Config uses placeholder 196 for Australia FFA Cup",
    },
]


# ---------------------------------------------------------------------------
# Verification logic
# ---------------------------------------------------------------------------

DiscrepancyRecord = dict[str, int | str | None | LeagueExpectation]


def verify_configuration(
    league_classification: dict[int, dict[str, object]],
) -> tuple[list[DiscrepancyRecord], list[DiscrepancyRecord]]:
    """Compare *league_classification* against the expected reference document values.

    Returns a tuple of (discrepancies, extra_in_config).
    """
    discrepancies: list[DiscrepancyRecord] = []

    for league_id, expected in EXPECTED_FROM_DOC.items():
        if league_id not in league_classification:
            discrepancies.append(
                {
                    "league_id": league_id,
                    "issue": "MISSING_FROM_CONFIG",
                    "expected": expected,
                    "actual": None,
                }
            )
            continue

        actual = league_classification[league_id]

        if actual.get("tier") != expected["tier"]:
            discrepancies.append(
                {
                    "league_id": league_id,
                    "league_name": str(actual.get("api_football_league_name", "")),
                    "country": str(actual.get("country_region", "")),
                    "field": "tier",
                    "expected": expected["tier"],
                    "actual": actual.get("tier"),
                }
            )

        if actual.get("odds_api_league_name") != expected["odds_api"]:
            discrepancies.append(
                {
                    "league_id": league_id,
                    "league_name": str(actual.get("api_football_league_name", "")),
                    "country": str(actual.get("country_region", "")),
                    "field": "odds_api_league_name",
                    "expected": expected["odds_api"],
                    "actual": actual.get("odds_api_league_name"),
                }
            )

        if actual.get("classification") != expected["classification"]:
            discrepancies.append(
                {
                    "league_id": league_id,
                    "league_name": str(actual.get("api_football_league_name", "")),
                    "country": str(actual.get("country_region", "")),
                    "field": "classification",
                    "expected": expected["classification"],
                    "actual": actual.get("classification"),
                }
            )

    # Extra leagues in config that are not in the reference document
    extra_in_config: list[DiscrepancyRecord] = []
    for league_id, league in league_classification.items():
        if league_id not in EXPECTED_FROM_DOC:
            extra_in_config.append(
                {
                    "league_id": league_id,
                    "league_name": str(league.get("api_football_league_name", "")),
                    "country": str(league.get("country_region", "")),
                    "classification": str(league.get("classification", "")),
                    "tier": league.get("tier"),
                    "note": "Uses placeholder ID - conflicts in source document",
                }
            )

    return discrepancies, extra_in_config


def _print_text_report(
    discrepancies: list[DiscrepancyRecord],
    extra_in_config: list[DiscrepancyRecord],
    league_count: int,
) -> None:
    """Write a human-readable verification report to stdout."""
    logger.info("=" * 80)
    logger.info("LEAGUE CONFIGURATION VERIFICATION")
    logger.info("Comparing league_classification_config against LEAGUE_CLASSIFICATION.md")
    logger.info("=" * 80)

    if not discrepancies and not extra_in_config:
        logger.info("ALL ENTRIES MATCH - no discrepancies found.")
        return

    if discrepancies:
        logger.info("FOUND %d DISCREPANCIES:", len(discrepancies))
        logger.info("-" * 80)

        for idx, disc in enumerate(discrepancies, 1):
            logger.info("%d. League ID: %s", idx, disc["league_id"])

            if disc.get("issue") == "MISSING_FROM_CONFIG":
                logger.info("   Issue: MISSING FROM CONFIG")
                logger.info("   Expected: %s", disc["expected"])
            else:
                logger.info("   League: %s (%s)", disc.get("league_name"), disc.get("country"))
                logger.info("   Field: %s", disc.get("field"))
                logger.info("   Expected: %s", disc.get("expected"))
                logger.info("   Actual: %s", disc.get("actual"))

    if extra_in_config:
        logger.info("FOUND %d EXTRA LEAGUES IN CONFIG (placeholder IDs):", len(extra_in_config))
        logger.info("-" * 80)

        for idx, extra in enumerate(extra_in_config, 1):
            logger.info("%d. League ID: %s (PLACEHOLDER)", idx, extra["league_id"])
            logger.info("   League: %s (%s)", extra.get("league_name"), extra.get("country"))
            logger.info(
                "   Classification: %s, Tier: %s", extra.get("classification"), extra.get("tier")
            )
            logger.info("   Note: %s", extra.get("note"))

    # Known conflicts
    logger.info("=" * 80)
    logger.info("KNOWN ID CONFLICTS IN SOURCE DOCUMENT:")
    logger.info("=" * 80)

    for idx, conflict in enumerate(KNOWN_ID_CONFLICTS, 1):
        logger.info("%d. ID %s used for multiple leagues:", idx, conflict["id"])
        leagues = conflict["leagues"]
        if isinstance(leagues, list):
            for league in leagues:
                logger.info("   - %s", league)
        logger.info("   Resolution: %s", conflict["resolution"])

    logger.info("=" * 80)
    logger.info("SUMMARY")
    logger.info("  Total leagues in config: %d", league_count)
    logger.info("  Total leagues expected from doc: %d", len(EXPECTED_FROM_DOC))
    logger.info("  Discrepancies found: %d", len(discrepancies))
    logger.info("  Extra leagues (placeholder IDs): %d", len(extra_in_config))
    logger.info("  NOTE: Placeholder IDs need verification with actual API-Football IDs")
    logger.info("=" * 80)


# ---------------------------------------------------------------------------
# Standalone entry-point
# ---------------------------------------------------------------------------


def main() -> None:
    """Run verification against the league classification config."""
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(description="Verify league classification config")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    args = parser.parse_args()

    league_classification: dict[int, dict[str, object]] = dict(LEAGUE_CLASSIFICATION_DATA)

    discrepancies, extra_in_config = verify_configuration(league_classification)

    if args.json:
        payload = {
            "discrepancies": discrepancies,
            "extra_in_config": extra_in_config,
            "league_count": len(league_classification),
            "expected_count": len(EXPECTED_FROM_DOC),
        }
        sys.stdout.write(json.dumps(payload, indent=2, default=str) + "\n")
    else:
        _print_text_report(discrepancies, extra_in_config, len(league_classification))


if __name__ == "__main__":
    main()
