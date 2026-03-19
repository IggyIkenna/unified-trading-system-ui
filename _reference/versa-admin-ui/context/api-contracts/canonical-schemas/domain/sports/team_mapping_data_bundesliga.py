"""Bundesliga team mapping data - structured team entries for alias resolution.

Each entry combines canonical team identity, display name, API-Football ID,
and a list of known name aliases used across data providers (Betfair,
API-Football, Understat, The Odds API).

Data is expressed as plain dicts for use with
:func:`~instruments_service.sports.team_aliases.load_team_mappings_from_dict`.

Source: Ported from instruments-service/instruments_service/sports/team_mapping_data_bundesliga.py
into UAC so all downstream consumers share a single SSOT.
"""

from __future__ import annotations

BUNDESLIGA_TEAM_MAPPINGS: list[dict[str, str | int | None | list[str]]] = [
    {
        "canonical_team_id": "ARMINIA_BIELEFELD",
        "display_name": "Arminia Bielefeld",
        "api_football_id": None,
        "aliases": [
            "ARMINIA BIELEFELD",
            "BIELEFELD",
            "ARMINIA",
            "Bielefeld",
            "Arminia",
        ],
    },
    {
        "canonical_team_id": "AUGSBURG",
        "display_name": "Augsburg",
        "api_football_id": None,
        "aliases": [
            "AUGSBURG",
            "FC AUGSBURG",
            "FC Augsburg",
        ],
    },
    {
        "canonical_team_id": "BAYERN",
        "display_name": "Bayern Munich",
        "api_football_id": 157,
        "aliases": [
            "BAYERN",
            "BAYERN MUNICH",
            "FC BAYERN MUNICH",
            "BAYERN MUNCHEN",
            "Bayern",
            "FC Bayern Munich",
            "Bayern Munchen",
            "Bayern München",
        ],
    },
    {
        "canonical_team_id": "BOCHUM",
        "display_name": "Bochum",
        "api_football_id": 176,
        "aliases": [
            "BOCHUM",
            "VFL BOCHUM",
            "VfL Bochum",
            "Vfl Bochum",
        ],
    },
    {
        "canonical_team_id": "DORTMUND",
        "display_name": "Borussia Dortmund",
        "api_football_id": None,
        "aliases": [
            "BORUSSIA DORTMUND",
            "DORTMUND",
            "BVB",
            "Dortmund",
        ],
    },
    {
        "canonical_team_id": "MGLADBACH",
        "display_name": "Borussia Monchengladbach",
        "api_football_id": 163,
        "aliases": [
            "BORUSSIA MONCHENGLADBACH",
            "BORUSSIA M'GLADBACH",
            "MGLADBACH",
            "MONCHENGLADBACH",
            "M'GLADBACH",
            "Borussia M.Gladbach",
            "Borussia Mönchengladbach",
            "Monchengladbach",
        ],
    },
    {
        "canonical_team_id": "COLOGNE",
        "display_name": "FC Cologne",
        "api_football_id": 192,
        "aliases": [
            "COLOGNE",
            "FC KOLN",
            "FC COLOGNE",
            "KOLN",
            "Koln",
            "FC Koln",
            "1.FC Köln",
            "1. FC Köln",
        ],
    },
    {
        "canonical_team_id": "DARMSTADT",
        "display_name": "Darmstadt",
        "api_football_id": None,
        "aliases": [
            "DARMSTADT",
            "DARMSTADT 98",
            "SV Darmstadt 98",
            "Darmstadt 98",
        ],
    },
    {
        "canonical_team_id": "FRANKFURT",
        "display_name": "Eintracht Frankfurt",
        "api_football_id": None,
        "aliases": [
            "EINTRACHT FRANKFURT",
            "FRANKFURT",
            "Frankfurt",
        ],
    },
    {
        "canonical_team_id": "FREIBURG",
        "display_name": "Freiburg",
        "api_football_id": None,
        "aliases": [
            "FREIBURG",
            "SC FREIBURG",
            "SC Freiburg",
        ],
    },
    {
        "canonical_team_id": "GREUTHER_FURTH",
        "display_name": "Greuther Furth",
        "api_football_id": 178,
        "aliases": [
            "GREUTHER FURTH",
            "GREUTHER FÜRTH",
            "SpVgg Greuther Fürth",
            "SpVgg Greuther Furth",
            "Greuther Fuerth",
        ],
    },
    {
        "canonical_team_id": "HAMBURG",
        "display_name": "Hamburger SV",
        "api_football_id": None,
        "aliases": [
            "HAMBURGER SV",
            "HAMBURG",
            "HSV",
            "Hamburg",
        ],
    },
    {
        "canonical_team_id": "HANNOVER",
        "display_name": "Hannover 96",
        "api_football_id": None,
        "aliases": [
            "HANNOVER",
            "HANNOVER 96",
            "Hannover",
        ],
    },
    {
        "canonical_team_id": "HERTHA",
        "display_name": "Hertha Berlin",
        "api_football_id": 159,
        "aliases": [
            "HERTHA BERLIN",
            "HERTHA",
            "HERTHA BSC",
            "Hertha BSC",
            "Hertha",
        ],
    },
    {
        "canonical_team_id": "HOFFENHEIM",
        "display_name": "Hoffenheim",
        "api_football_id": None,
        "aliases": [
            "HOFFENHEIM",
            "TSG HOFFENHEIM",
            "TSG Hoffenheim",
            "1899 Hoffenheim",
        ],
    },
    {
        "canonical_team_id": "HEIDENHEIM",
        "display_name": "Heidenheim",
        "api_football_id": 180,
        "aliases": [
            "HEIDENHEIM",
            "FC HEIDENHEIM",
            "FC Heidenheim",
            "1. FC Heidenheim",
        ],
    },
    {
        "canonical_team_id": "HOLSTEIN_KIEL",
        "display_name": "Holstein Kiel",
        "api_football_id": None,
        "aliases": [
            "HOLSTEIN KIEL",
            "KIEL",
            "Kiel",
        ],
    },
    {
        "canonical_team_id": "KAISERSLAUTERN",
        "display_name": "Kaiserslautern",
        "api_football_id": 745,
        "aliases": [
            "KAISERSLAUTERN",
            "FC KAISERSLAUTERN",
            "FC Kaiserslautern",
            "1. FC Kaiserslautern",
        ],
    },
    {
        "canonical_team_id": "KARLSRUHE",
        "display_name": "Karlsruhe",
        "api_football_id": None,
        "aliases": [
            "KARLSRUHE",
            "KARLSRUHER SC",
            "Karlsruher SC",
        ],
    },
    {
        "canonical_team_id": "LEVERKUSEN",
        "display_name": "Bayer Leverkusen",
        "api_football_id": None,
        "aliases": [
            "LEVERKUSEN",
            "BAYER LEVERKUSEN",
            "Leverkusen",
        ],
    },
    {
        "canonical_team_id": "MAINZ",
        "display_name": "Mainz",
        "api_football_id": None,
        "aliases": [
            "MAINZ",
            "MAINZ 05",
            "FSV MAINZ 05",
            "Mainz 05",
            "FSV Mainz 05",
        ],
    },
    {
        "canonical_team_id": "PADERBORN",
        "display_name": "Paderborn",
        "api_football_id": None,
        "aliases": [
            "PADERBORN",
            "SC PADERBORN",
            "SC Paderborn",
            "SC Paderborn 07",
        ],
    },
    {
        "canonical_team_id": "LEIPZIG",
        "display_name": "RB Leipzig",
        "api_football_id": None,
        "aliases": [
            "LEIPZIG",
            "RB LEIPZIG",
            "Leipzig",
            "RasenBallsport Leipzig",
        ],
    },
    {
        "canonical_team_id": "SCHALKE",
        "display_name": "Schalke 04",
        "api_football_id": None,
        "aliases": [
            "SCHALKE",
            "SCHALKE 04",
            "FC SCHALKE 04",
            "FC Schalke 04",
        ],
    },
    {
        "canonical_team_id": "ST_PAULI",
        "display_name": "FC St. Pauli",
        "api_football_id": None,
        "aliases": [
            "ST PAULI",
            "ST. PAULI",
            "FC ST PAULI",
            "St Pauli",
            "St. Pauli",
            "FC St Pauli",
        ],
    },
    {
        "canonical_team_id": "STUTTGART",
        "display_name": "VfB Stuttgart",
        "api_football_id": None,
        "aliases": [
            "STUTTGART",
            "VFB STUTTGART",
            "Stuttgart",
        ],
    },
    {
        "canonical_team_id": "UNION_BERLIN",
        "display_name": "Union Berlin",
        "api_football_id": None,
        "aliases": [
            "UNION BERLIN",
            "UNION",
            "FC UNION BERLIN",
            "FC Union Berlin",
        ],
    },
    {
        "canonical_team_id": "WERDER_BREMEN",
        "display_name": "Werder Bremen",
        "api_football_id": None,
        "aliases": [
            "WERDER BREMEN",
            "BREMEN",
            "SV WERDER BREMEN",
            "Bremen",
            "SV Werder Bremen",
        ],
    },
    {
        "canonical_team_id": "WOLFSBURG",
        "display_name": "Wolfsburg",
        "api_football_id": None,
        "aliases": [
            "WOLFSBURG",
            "VFL WOLFSBURG",
            "VfL Wolfsburg",
        ],
    },
    # -- Historical Bundesliga teams (2010-2019, relegated/not current) --
    {
        "canonical_team_id": "NURNBERG",
        "display_name": "FC Nurnberg",
        "api_football_id": 171,
        "aliases": [
            "1. FC Nürnberg",
            "Nurnberg",
            "Nuernberg",
        ],
    },
    {
        "canonical_team_id": "FORTUNA_DUSSELDORF",
        "display_name": "Fortuna Dusseldorf",
        "api_football_id": 158,
        "aliases": [
            "Fortuna Düsseldorf",
            "Fortuna Duesseldorf",
        ],
    },
    {
        "canonical_team_id": "BRAUNSCHWEIG",
        "display_name": "Eintracht Braunschweig",
        "api_football_id": None,
        "aliases": [
            "Braunschweig",
        ],
    },
    {
        "canonical_team_id": "INGOLSTADT",
        "display_name": "FC Ingolstadt",
        "api_football_id": None,
        "aliases": [
            "FC Ingolstadt 04",
            "Ingolstadt",
        ],
    },
    {
        "canonical_team_id": "ELVERSBERG",
        "display_name": "SV Elversberg",
        "api_football_id": None,
        "aliases": [
            "Elversberg",
        ],
    },
]

__all__ = ["BUNDESLIGA_TEAM_MAPPINGS"]
