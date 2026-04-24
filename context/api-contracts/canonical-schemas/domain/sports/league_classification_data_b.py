"""League classification raw data - part B.

Contains the second half of LEAGUE_CLASSIFICATION_DATA entries (league IDs for
Features third divisions and lower tiers through Reference domestic cups).

Split to stay under 900-line file limit.
Import via league_classification_data.py -- do not import directly.

Source: Ported from instruments-service/instruments_service/sports/
into UAC so all downstream consumers share a single SSOT.
"""

from __future__ import annotations

LEAGUE_CLASSIFICATION_DATA_B: dict[int, dict[str, str | int | bool | dict[str, bool] | None]] = {
    266: {
        "country_region": "Chile",
        "api_football_id": 266,
        "api_football_league_name": "Primera B",
        "odds_api_league_name": None,
        "classification": "Features",
        "tier": 2,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": True,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    263: {
        "country_region": "Mexico",
        "api_football_id": 263,
        "api_football_league_name": "Liga de Expansion MX",
        "odds_api_league_name": None,
        "classification": "Features",
        "tier": 2,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": True,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    99: {
        "country_region": "Japan",
        "api_football_id": 99,
        "api_football_league_name": "J2 League",
        "odds_api_league_name": None,
        "classification": "Features",
        "tier": 2,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": True,
            "transfermarkt": True,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    293: {
        "country_region": "South Korea",
        "api_football_id": 293,
        "api_football_league_name": "K League 2",
        "odds_api_league_name": None,
        "classification": "Features",
        "tier": 2,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": True,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # FEATURES: Third divisions and lower tiers
    # =========================================================================
    63: {
        "country_region": "France",
        "api_football_id": 63,
        "api_football_league_name": "National",
        "odds_api_league_name": None,
        "classification": "Features",
        "tier": 3,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": True,
            "transfermarkt": True,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    435: {
        "country_region": "Spain",
        "api_football_id": 435,
        "api_football_league_name": "Primera Division RFEF - Group 1",
        "odds_api_league_name": None,
        "classification": "Features",
        "tier": 3,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": True,
            "transfermarkt": True,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    43: {
        "country_region": "England",
        "api_football_id": 43,
        "api_football_league_name": "National League",
        "odds_api_league_name": None,
        "classification": "Features",
        "tier": 5,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": True,
            "transfermarkt": True,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: European competitions (cups, tier 4 = non-league)
    # =========================================================================
    2: {
        "country_region": "Multi",
        "api_football_id": 2,
        "api_football_league_name": "UEFA Champions League",
        "odds_api_league_name": "soccer_uefa_champs_league",
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    3: {
        "country_region": "Multi",
        "api_football_id": 3,
        "api_football_league_name": "UEFA Europa League",
        "odds_api_league_name": "soccer_uefa_europa_league",
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    848: {
        "country_region": "Multi",
        "api_football_id": 848,
        "api_football_league_name": "UEFA Conference League",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    13: {
        "country_region": "Multi",
        "api_football_id": 13,
        "api_football_league_name": "CONMEBOL Libertadores",
        "odds_api_league_name": "soccer_conmebol_copa_libertadores",
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    11: {
        "country_region": "Multi",
        "api_football_id": 11,
        "api_football_league_name": "CONMEBOL Sudamericana",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- England
    # =========================================================================
    48: {
        "country_region": "England",
        "api_football_id": 48,
        "api_football_league_name": "Carabao Cup (EFL Cup)",
        "odds_api_league_name": "soccer_england_efl_cup",
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Spain
    # =========================================================================
    143: {
        "country_region": "Spain",
        "api_football_id": 143,
        "api_football_league_name": "Copa del Rey",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    556: {
        "country_region": "Spain",
        "api_football_id": 556,
        "api_football_league_name": "Supercopa de Espana",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Germany
    # =========================================================================
    81: {
        "country_region": "Germany",
        "api_football_id": 81,
        "api_football_league_name": "DFB Pokal",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    529: {
        "country_region": "Germany",
        "api_football_id": 529,
        "api_football_league_name": "DFL Supercup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Italy
    # =========================================================================
    137: {
        "country_region": "Italy",
        "api_football_id": 137,
        "api_football_league_name": "Coppa Italia",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    547: {
        "country_region": "Italy",
        "api_football_id": 547,
        "api_football_league_name": "Supercoppa Italiana",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- France
    # =========================================================================
    66: {
        "country_region": "France",
        "api_football_id": 66,
        "api_football_league_name": "Coupe de France",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    526: {
        "country_region": "France",
        "api_football_id": 526,
        "api_football_league_name": "Trophee des Champions",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Netherlands
    # =========================================================================
    90: {
        "country_region": "Netherlands",
        "api_football_id": 90,
        "api_football_league_name": "KNVB Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Portugal
    # =========================================================================
    96: {
        "country_region": "Portugal",
        "api_football_id": 96,
        "api_football_league_name": "Taca de Portugal",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    97: {
        "country_region": "Portugal",
        "api_football_id": 97,
        "api_football_league_name": "Taca da Liga",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Belgium
    # =========================================================================
    147: {
        "country_region": "Belgium",
        "api_football_id": 147,
        "api_football_league_name": "Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Turkey
    # =========================================================================
    206: {
        "country_region": "Turkey",
        "api_football_id": 206,
        "api_football_league_name": "Turkiye Kupasi",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Greece
    # =========================================================================
    199: {
        "country_region": "Greece",
        "api_football_id": 199,
        "api_football_league_name": "Greek Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Scotland
    # =========================================================================
    181: {
        "country_region": "Scotland",
        "api_football_id": 181,
        "api_football_league_name": "Scottish Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    182: {
        "country_region": "Scotland",
        "api_football_id": 182,
        "api_football_league_name": "Scottish League Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    185: {
        "country_region": "Scotland",
        "api_football_id": 185,
        "api_football_league_name": "League Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Austria
    # =========================================================================
    220: {
        "country_region": "Austria",
        "api_football_id": 220,
        "api_football_league_name": "Austrian Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Switzerland
    # =========================================================================
    209: {
        "country_region": "Switzerland",
        "api_football_id": 209,
        "api_football_league_name": "Swiss Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Denmark
    # =========================================================================
    121: {
        "country_region": "Denmark",
        "api_football_id": 121,
        "api_football_league_name": "Danish Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Norway
    # =========================================================================
    105: {
        "country_region": "Norway",
        "api_football_id": 105,
        "api_football_league_name": "Norwegian Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Sweden
    # =========================================================================
    115: {
        "country_region": "Sweden",
        "api_football_id": 115,
        "api_football_league_name": "Svenska Cupen",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Poland
    # =========================================================================
    108: {
        "country_region": "Poland",
        "api_football_id": 108,
        "api_football_league_name": "Polish Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Argentina
    # =========================================================================
    130: {
        "country_region": "Argentina",
        "api_football_id": 130,
        "api_football_league_name": "Copa Argentina",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    1032: {
        "country_region": "Argentina",
        "api_football_id": 1032,
        "api_football_league_name": "Copa de la Liga Profesional",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Brazil
    # =========================================================================
    73: {
        "country_region": "Brazil",
        "api_football_id": 73,
        "api_football_league_name": "Copa do Brasil",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Chile
    # =========================================================================
    267: {
        "country_region": "Chile",
        "api_football_id": 267,
        "api_football_league_name": "Copa Chile",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Mexico
    # =========================================================================
    264: {
        "country_region": "Mexico",
        "api_football_id": 264,
        "api_football_league_name": "Copa MX",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- USA
    # =========================================================================
    257: {
        "country_region": "USA",
        "api_football_id": 257,
        "api_football_league_name": "US Open Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Japan
    # =========================================================================
    101: {
        "country_region": "Japan",
        "api_football_id": 101,
        "api_football_league_name": "J.League Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    102: {
        "country_region": "Japan",
        "api_football_id": 102,
        "api_football_league_name": "Emperor Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- South Korea
    # =========================================================================
    294: {
        "country_region": "South Korea",
        "api_football_id": 294,
        "api_football_league_name": "Korean FA Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
    # =========================================================================
    # REFERENCE: Domestic cups -- Australia
    # =========================================================================
    874: {
        "country_region": "Australia",
        "api_football_id": 874,
        "api_football_league_name": "Australia Cup",
        "odds_api_league_name": None,
        "classification": "Reference",
        "tier": 4,
        "data_sources": {
            "api_football": True,
            "soccer_football_info": False,
            "footystats": False,
            "transfermarkt": False,
            "understat": False,
            "odds_api": False,
            "open_meteo": False,
        },
    },
}

__all__ = ["LEAGUE_CLASSIFICATION_DATA_B"]
