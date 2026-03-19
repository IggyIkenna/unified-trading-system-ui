"""EPL team mapping data - structured team entries for alias resolution.

Each entry combines canonical team identity, display name, API-Football ID,
and a list of known name aliases used across data providers (Betfair,
API-Football, Understat, The Odds API).

Data is expressed as plain dicts for use with
:func:`~instruments_service.sports.team_aliases.load_team_mappings_from_dict`.

Source: Ported from instruments-service/instruments_service/sports/team_mapping_data.py
into UAC so all downstream consumers share a single SSOT.
"""

from __future__ import annotations

EPL_TEAM_MAPPINGS: list[dict[str, str | int | None | list[str]]] = [
    {
        "canonical_team_id": "ARSENAL",
        "display_name": "Arsenal",
        "api_football_id": None,
        "aliases": [
            "ARSENAL",
            "ARSENAL FC",
            "Arsenal FC",
            "AFC",
            "The Gunners",
        ],
    },
    {
        "canonical_team_id": "ASTON_VILLA",
        "display_name": "Aston Villa",
        "api_football_id": None,
        "aliases": [
            "ASTON VILLA",
            "VILLA",
            "Aston Villa",
        ],
    },
    {
        "canonical_team_id": "BOURNEMOUTH",
        "display_name": "Bournemouth",
        "api_football_id": None,
        "aliases": [
            "BOURNEMOUTH",
            "AFC BOURNEMOUTH",
            "AFC Bournemouth",
        ],
    },
    {
        "canonical_team_id": "BRENTFORD",
        "display_name": "Brentford",
        "api_football_id": None,
        "aliases": [
            "BRENTFORD",
            "BRENTFORD FC",
            "Brentford FC",
        ],
    },
    {
        "canonical_team_id": "BRIGHTON",
        "display_name": "Brighton",
        "api_football_id": None,
        "aliases": [
            "BRIGHTON",
            "BRIGHTON & HOVE ALBION",
            "BRIGHTON AND HOVE ALBION",
            "Brighton and Hove Albion",
            "Brighton & Hove Albion",
        ],
    },
    {
        "canonical_team_id": "BURNLEY",
        "display_name": "Burnley",
        "api_football_id": None,
        "aliases": [
            "BURNLEY",
            "BURNLEY FC",
            "Burnley FC",
        ],
    },
    {
        "canonical_team_id": "CARDIFF",
        "display_name": "Cardiff",
        "api_football_id": None,
        "aliases": [
            "CARDIFF",
            "CARDIFF CITY",
            "Cardiff City",
        ],
    },
    {
        "canonical_team_id": "CHELSEA",
        "display_name": "Chelsea",
        "api_football_id": None,
        "aliases": [
            "CHELSEA",
            "CHELSEA FC",
            "Chelsea FC",
            "CFC",
        ],
    },
    {
        "canonical_team_id": "CRYSTAL_PALACE",
        "display_name": "Crystal Palace",
        "api_football_id": None,
        "aliases": [
            "CRYSTAL PALACE",
            "C PALACE",
            "PALACE",
        ],
    },
    {
        "canonical_team_id": "EVERTON",
        "display_name": "Everton",
        "api_football_id": None,
        "aliases": [
            "EVERTON",
            "EVERTON FC",
            "Everton FC",
        ],
    },
    {
        "canonical_team_id": "FULHAM",
        "display_name": "Fulham",
        "api_football_id": None,
        "aliases": [
            "FULHAM",
            "FULHAM FC",
            "Fulham FC",
        ],
    },
    {
        "canonical_team_id": "HUDDERSFIELD",
        "display_name": "Huddersfield",
        "api_football_id": None,
        "aliases": [
            "HUDDERSFIELD",
            "HUDDERSFIELD TOWN",
            "Huddersfield Town",
        ],
    },
    {
        "canonical_team_id": "IPSWICH",
        "display_name": "Ipswich",
        "api_football_id": None,
        "aliases": [
            "IPSWICH",
            "IPSWICH TOWN",
            "Ipswich Town",
        ],
    },
    {
        "canonical_team_id": "LEEDS",
        "display_name": "Leeds",
        "api_football_id": None,
        "aliases": [
            "LEEDS",
            "LEEDS UNITED",
            "LEEDS UTD",
            "Leeds United",
        ],
    },
    {
        "canonical_team_id": "LEICESTER",
        "display_name": "Leicester",
        "api_football_id": None,
        "aliases": [
            "LEICESTER",
            "LEICESTER CITY",
            "Leicester City",
        ],
    },
    {
        "canonical_team_id": "LIVERPOOL",
        "display_name": "Liverpool",
        "api_football_id": None,
        "aliases": [
            "LIVERPOOL",
            "LIVERPOOL FC",
            "Liverpool FC",
            "LFC",
        ],
    },
    {
        "canonical_team_id": "LUTON",
        "display_name": "Luton",
        "api_football_id": None,
        "aliases": [
            "LUTON",
            "LUTON TOWN",
            "Luton Town",
        ],
    },
    {
        "canonical_team_id": "MAN_CITY",
        "display_name": "Manchester City",
        "api_football_id": None,
        "aliases": [
            "MANCHESTER CITY",
            "MAN CITY",
            "MAN C",
            "Man City",
            "MCFC",
        ],
    },
    {
        "canonical_team_id": "MAN_UNITED",
        "display_name": "Manchester United",
        "api_football_id": None,
        "aliases": [
            "MANCHESTER UNITED",
            "MAN UNITED",
            "MAN UTD",
            "MANCHESTER UTD",
            "Man Utd",
            "Man United",
            "Manchester Utd",
            "MUFC",
        ],
    },
    {
        "canonical_team_id": "NEWCASTLE",
        "display_name": "Newcastle",
        "api_football_id": None,
        "aliases": [
            "NEWCASTLE",
            "NEWCASTLE UNITED",
            "NEWCASTLE UTD",
            "Newcastle United",
        ],
    },
    {
        "canonical_team_id": "NORWICH",
        "display_name": "Norwich",
        "api_football_id": None,
        "aliases": [
            "NORWICH",
            "NORWICH CITY",
            "Norwich City",
        ],
    },
    {
        "canonical_team_id": "NOTTM_FOREST",
        "display_name": "Nottingham Forest",
        "api_football_id": None,
        "aliases": [
            "NOTTINGHAM FOREST",
            "NOTT'M FOREST",
            "NOTTM FOREST",
            "FOREST",
            "Nott'm Forest",
            "Nottm Forest",
        ],
    },
    {
        "canonical_team_id": "SHEFFIELD_UNITED",
        "display_name": "Sheffield Utd",
        "api_football_id": None,
        "aliases": [
            "SHEFFIELD UNITED",
            "SHEFF UTD",
            "SHEFF UNITED",
            "SHEFFIELD UTD",
            "SHEFFIELD U",
            "SHEFFIELD",
            "Sheffield United",
        ],
    },
    {
        "canonical_team_id": "SOUTHAMPTON",
        "display_name": "Southampton",
        "api_football_id": None,
        "aliases": [
            "SOUTHAMPTON",
            "SOUTHAMPTON FC",
            "Southampton FC",
        ],
    },
    {
        "canonical_team_id": "SUNDERLAND",
        "display_name": "Sunderland",
        "api_football_id": None,
        "aliases": [
            "SUNDERLAND",
            "SUNDERLAND AFC",
            "Sunderland AFC",
        ],
    },
    {
        "canonical_team_id": "TOTTENHAM",
        "display_name": "Tottenham",
        "api_football_id": None,
        "aliases": [
            "TOTTENHAM",
            "TOTTENHAM HOTSPUR",
            "SPURS",
            "Tottenham Hotspur",
            "Spurs",
            "THFC",
        ],
    },
    {
        "canonical_team_id": "WATFORD",
        "display_name": "Watford",
        "api_football_id": None,
        "aliases": [
            "WATFORD",
            "WATFORD FC",
            "Watford FC",
        ],
    },
    {
        "canonical_team_id": "WEST_HAM",
        "display_name": "West Ham",
        "api_football_id": None,
        "aliases": [
            "WEST HAM",
            "WEST HAM UNITED",
            "WEST HAM UTD",
            "West Ham United",
        ],
    },
    {
        "canonical_team_id": "WOLVES",
        "display_name": "Wolves",
        "api_football_id": None,
        "aliases": [
            "WOLVES",
            "WOLVERHAMPTON",
            "WOLVERHAMPTON WANDERERS",
            "Wolverhampton Wanderers",
        ],
    },
    # -- Historical EPL teams (2010-2019, relegated/not current) --
    {
        "canonical_team_id": "BIRMINGHAM",
        "display_name": "Birmingham",
        "api_football_id": None,
        "aliases": [
            "Birmingham City",
        ],
    },
    {
        "canonical_team_id": "WEST_BROM",
        "display_name": "West Brom",
        "api_football_id": None,
        "aliases": [
            "West Bromwich Albion",
            "WEST BROM",
        ],
    },
    {
        "canonical_team_id": "WIGAN",
        "display_name": "Wigan",
        "api_football_id": None,
        "aliases": [
            "Wigan Athletic",
        ],
    },
    {
        "canonical_team_id": "BLACKBURN",
        "display_name": "Blackburn",
        "api_football_id": None,
        "aliases": [
            "Blackburn Rovers",
        ],
    },
    {
        "canonical_team_id": "BOLTON",
        "display_name": "Bolton",
        "api_football_id": None,
        "aliases": [
            "Bolton Wanderers",
        ],
    },
    {
        "canonical_team_id": "STOKE_CITY",
        "display_name": "Stoke City",
        "api_football_id": None,
        "aliases": [
            "Stoke",
            "STOKE CITY",
        ],
    },
    {
        "canonical_team_id": "BLACKPOOL",
        "display_name": "Blackpool",
        "api_football_id": None,
        "aliases": [],
    },
    {
        "canonical_team_id": "SWANSEA",
        "display_name": "Swansea",
        "api_football_id": None,
        "aliases": [
            "Swansea City",
        ],
    },
    {
        "canonical_team_id": "READING",
        "display_name": "Reading",
        "api_football_id": None,
        "aliases": [],
    },
    {
        "canonical_team_id": "HULL_CITY",
        "display_name": "Hull City",
        "api_football_id": None,
        "aliases": [
            "Hull",
        ],
    },
    {
        "canonical_team_id": "MIDDLESBROUGH",
        "display_name": "Middlesbrough",
        "api_football_id": None,
        "aliases": [],
    },
]

__all__ = ["EPL_TEAM_MAPPINGS"]
