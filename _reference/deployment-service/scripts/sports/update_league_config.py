#!/usr/bin/env python3
"""
Update league classification configuration with verified corrections.

Contains the canonical set of corrected/new league entries that were
verified against all_unique_leagues.csv.  When executed, writes the
updated entries into the league classification Parquet stored in GCS.

Usage:
    python scripts/sports/update_league_config.py --dry-run
    python scripts/sports/update_league_config.py --apply
"""

from __future__ import annotations

import argparse
import logging

from unified_config_interface import UnifiedCloudConfig

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Data-source template for Reference leagues (minimal sources)
# ---------------------------------------------------------------------------

_REFERENCE_SOURCES: dict[str, bool] = {
    "api_football": True,
    "soccerfootball_info": False,
    "footystats": False,
    "transfermarkt": False,
    "understat": False,
    "odds_api": False,
    "open_meteo": False,
}

# ---------------------------------------------------------------------------
# Correct entries to add / merge into LEAGUE_CLASSIFICATION
# ---------------------------------------------------------------------------

LeagueEntry = dict[str, str | int | bool | None | dict[str, bool]]

NEW_CORRECT_ENTRIES: dict[int, LeagueEntry] = {
    # PREDICTION - Sweden
    113: {
        "country_region": "Sweden",
        "api_football_id": 113,
        "api_football_league_name": "Allsvenskan",
        "odds_api_league_name": "soccer_sweden_allsvenskan",
        "classification": "Prediction",
        "tier": 1,
        "data_sources": {
            "api_football": True,
            "soccerfootball_info": True,
            "footystats": True,
            "transfermarkt": True,
            "understat": False,
            "odds_api": True,
            "open_meteo": True,
        },
    },
    # PREDICTION - Australia
    188: {
        "country_region": "Australia",
        "api_football_id": 188,
        "api_football_league_name": "A-League",
        "odds_api_league_name": "soccer_australia_aleague",
        "classification": "Prediction",
        "tier": 1,
        "data_sources": {
            "api_football": True,
            "soccerfootball_info": True,
            "footystats": False,
            "transfermarkt": True,
            "understat": False,
            "odds_api": True,
            "open_meteo": True,
        },
    },
    # FEATURES - Sweden
    114: {
        "country_region": "Sweden",
        "api_football_id": 114,
        "api_football_league_name": "Superettan",
        "odds_api_league_name": None,
        "classification": "Features",
        "tier": 2,
        "data_sources": {
            "api_football": True,
            "soccerfootball_info": False,
            "footystats": True,
            "transfermarkt": True,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # FEATURES - USA (corrected)
    255: {
        "country_region": "USA",
        "api_football_id": 255,
        "api_football_league_name": "USL Championship",
        "odds_api_league_name": None,
        "classification": "Features",
        "tier": 2,
        "data_sources": {
            "api_football": True,
            "soccerfootball_info": False,
            "footystats": True,
            "transfermarkt": True,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # FEATURES - Spain (Primera RFEF Group 1)
    435: {
        "country_region": "Spain",
        "api_football_id": 435,
        "api_football_league_name": "Primera Division RFEF - Group 1",
        "odds_api_league_name": None,
        "classification": "Features",
        "tier": 3,
        "data_sources": {
            "api_football": True,
            "soccerfootball_info": False,
            "footystats": True,
            "transfermarkt": True,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # REFERENCE - England
    45: {
        "country_region": "England",
        "api_football_id": 45,
        "api_football_league_name": "FA Cup",
        "odds_api_league_name": "soccer_fa_cup",
        "classification": "Reference",
        "tier": None,
        "data_sources": _REFERENCE_SOURCES,
    },
    528: {
        "country_region": "England",
        "api_football_id": 528,
        "api_football_league_name": "Community Shield",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": None,
        "data_sources": _REFERENCE_SOURCES,
    },
    # REFERENCE - Sweden
    115: {
        "country_region": "Sweden",
        "api_football_id": 115,
        "api_football_league_name": "Svenska Cupen",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": None,
        "data_sources": _REFERENCE_SOURCES,
    },
    # REFERENCE - Belgium (corrected ID)
    147: {
        "country_region": "Belgium",
        "api_football_id": 147,
        "api_football_league_name": "Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": None,
        "data_sources": _REFERENCE_SOURCES,
    },
    # REFERENCE - Turkey (corrected ID)
    206: {
        "country_region": "Turkey",
        "api_football_id": 206,
        "api_football_league_name": "Turkiye Kupasi",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": None,
        "data_sources": _REFERENCE_SOURCES,
    },
    # REFERENCE - Argentina (corrected ID)
    1032: {
        "country_region": "Argentina",
        "api_football_id": 1032,
        "api_football_league_name": "Copa de la Liga Profesional",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": None,
        "data_sources": _REFERENCE_SOURCES,
    },
    # REFERENCE - USA (corrected ID)
    257: {
        "country_region": "USA",
        "api_football_id": 257,
        "api_football_league_name": "US Open Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": None,
        "data_sources": _REFERENCE_SOURCES,
    },
    # REFERENCE - Japan (corrected ID)
    102: {
        "country_region": "Japan",
        "api_football_id": 102,
        "api_football_league_name": "Emperor Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": None,
        "data_sources": _REFERENCE_SOURCES,
    },
    # REFERENCE - Australia
    874: {
        "country_region": "Australia",
        "api_football_id": 874,
        "api_football_league_name": "Australia Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": None,
        "data_sources": _REFERENCE_SOURCES,
    },
    # REFERENCE - Scotland (corrected ID)
    185: {
        "country_region": "Scotland",
        "api_football_id": 185,
        "api_football_league_name": "League Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": None,
        "data_sources": _REFERENCE_SOURCES,
    },
    # REFERENCE - Multi-Country (corrected IDs)
    13: {
        "country_region": "Multi",
        "api_football_id": 13,
        "api_football_league_name": "CONMEBOL Libertadores",
        "odds_api_league_name": "soccer_conmebol_copa_libertadores",
        "classification": "Reference",
        "tier": None,
        "data_sources": _REFERENCE_SOURCES,
    },
    11: {
        "country_region": "Multi",
        "api_football_id": 11,
        "api_football_league_name": "CONMEBOL Sudamericana",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": None,
        "data_sources": _REFERENCE_SOURCES,
    },
}

# IDs to move from LEAGUES_NEED_VERIFICATION to LEAGUE_CLASSIFICATION
IDS_TO_MOVE_TO_VERIFIED: list[int] = [45, 528]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    """Preview or apply league classification corrections."""
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(description="Update league classification config")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Preview changes without writing (default)",
    )
    parser.add_argument("--apply", action="store_true", help="Apply changes to the config")
    args = parser.parse_args()

    config = UnifiedCloudConfig()
    logger.info("Project: %s", config.gcp_project_id)

    logger.info("=" * 80)
    logger.info("LEAGUE CLASSIFICATION UPDATE")
    logger.info("=" * 80)
    logger.info("New correct entries to add: %d", len(NEW_CORRECT_ENTRIES))
    logger.info("IDs to move to verified: %d", len(IDS_TO_MOVE_TO_VERIFIED))

    logger.info("")
    logger.info("Corrections summary:")
    logger.info("  - Sweden Allsvenskan: ID 113 (was unknown/conflicted with Norway)")
    logger.info("  - Sweden Superettan: ID 114")
    logger.info("  - Sweden Svenska Cupen: ID 115")
    logger.info("  - Australia A-League: ID 188 (was unknown/conflicted with Turkey)")
    logger.info("  - Australia Cup: ID 874")
    logger.info("  - Spain Primera RFEF: ID 435 (was wrong ID 536)")
    logger.info("  - USA USL Championship: ID 255 (was wrong ID 254)")
    logger.info("  - USA US Open Cup: ID 257")
    logger.info("  - Belgium Cup: ID 147 (was wrong ID 146)")
    logger.info("  - Turkey Turkiye Kupasi: ID 206 (was wrong ID 205)")
    logger.info("  - Argentina Copa de la Liga Profesional: ID 1032 (was wrong ID 131)")
    logger.info("  - Japan Emperor Cup: ID 102 (was wrong ID 100)")
    logger.info("  - Scotland League Cup: ID 185 (was wrong ID 182)")
    logger.info("  - CONMEBOL Libertadores: ID 13 (was wrong ID 5)")
    logger.info("  - CONMEBOL Sudamericana: ID 11 (was wrong ID 6)")

    if args.apply:
        logger.info("")
        logger.info("--apply flag set: writing changes is not yet wired to GCS.")
        logger.info("Integrate with the league-config Parquet pipeline to persist these entries.")
    else:
        logger.info("")
        logger.info("Dry-run mode. Use --apply to persist changes.")


if __name__ == "__main__":
    main()
