"""Prediction-tier league definitions for the canonical LEAGUE_REGISTRY.

Top-tier domestic football leagues across Europe, Americas, Asia, and Oceania.
Loaded by ``league_data.py`` to build the full registry.
"""

from __future__ import annotations

from .league_registry import (
    PRED_FULL,
    PRED_NO_FOOTYSTATS,
    PRED_NO_UNDERSTAT,
    LeagueDefinition,
)

PREDICTION_LEAGUES: dict[str, LeagueDefinition] = {
    # ===================================================================
    # ENGLAND
    # ===================================================================
    "EPL": LeagueDefinition(
        league_id="EPL",
        display_name="English Premier League",
        sport="FOOTBALL",
        country="GB",
        season_months=(8, 5),
        has_playoffs=False,
        data_sources=PRED_FULL,
        api_football_id=39,
        tier=1,
        classification="Prediction",
    ),
    "ENG_CHAMPIONSHIP": LeagueDefinition(
        league_id="ENG_CHAMPIONSHIP",
        display_name="English Championship",
        sport="FOOTBALL",
        country="GB",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=40,
        tier=2,
        classification="Prediction",
    ),
    "ENG_LEAGUE_ONE": LeagueDefinition(
        league_id="ENG_LEAGUE_ONE",
        display_name="English League One",
        sport="FOOTBALL",
        country="GB",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=41,
        tier=3,
        classification="Prediction",
    ),
    "ENG_LEAGUE_TWO": LeagueDefinition(
        league_id="ENG_LEAGUE_TWO",
        display_name="English League Two",
        sport="FOOTBALL",
        country="GB",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=42,
        tier=4,
        classification="Prediction",
    ),
    # ===================================================================
    # SPAIN
    # ===================================================================
    "LA_LIGA": LeagueDefinition(
        league_id="LA_LIGA",
        display_name="La Liga",
        sport="FOOTBALL",
        country="ES",
        season_months=(8, 5),
        has_playoffs=False,
        data_sources=PRED_FULL,
        api_football_id=140,
        tier=1,
        classification="Prediction",
    ),
    "SEGUNDA_DIVISION": LeagueDefinition(
        league_id="SEGUNDA_DIVISION",
        display_name="Segunda Division",
        sport="FOOTBALL",
        country="ES",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=141,
        tier=2,
        classification="Prediction",
    ),
    # ===================================================================
    # GERMANY
    # ===================================================================
    "BUNDESLIGA": LeagueDefinition(
        league_id="BUNDESLIGA",
        display_name="Bundesliga",
        sport="FOOTBALL",
        country="DE",
        season_months=(8, 5),
        has_playoffs=False,
        data_sources=PRED_FULL,
        api_football_id=78,
        tier=1,
        classification="Prediction",
    ),
    "BUNDESLIGA_2": LeagueDefinition(
        league_id="BUNDESLIGA_2",
        display_name="2. Bundesliga",
        sport="FOOTBALL",
        country="DE",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=79,
        tier=2,
        classification="Prediction",
    ),
    "LIGA_3": LeagueDefinition(
        league_id="LIGA_3",
        display_name="3. Liga",
        sport="FOOTBALL",
        country="DE",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=80,
        tier=3,
        classification="Prediction",
    ),
    # ===================================================================
    # ITALY
    # ===================================================================
    "SERIE_A": LeagueDefinition(
        league_id="SERIE_A",
        display_name="Serie A",
        sport="FOOTBALL",
        country="IT",
        season_months=(8, 5),
        has_playoffs=False,
        data_sources=PRED_FULL,
        api_football_id=135,
        tier=1,
        classification="Prediction",
    ),
    "SERIE_B": LeagueDefinition(
        league_id="SERIE_B",
        display_name="Serie B",
        sport="FOOTBALL",
        country="IT",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=136,
        tier=2,
        classification="Prediction",
    ),
    # ===================================================================
    # FRANCE
    # ===================================================================
    "LIGUE_1": LeagueDefinition(
        league_id="LIGUE_1",
        display_name="Ligue 1",
        sport="FOOTBALL",
        country="FR",
        season_months=(8, 5),
        has_playoffs=False,
        data_sources=PRED_FULL,
        api_football_id=61,
        tier=1,
        classification="Prediction",
    ),
    "LIGUE_2": LeagueDefinition(
        league_id="LIGUE_2",
        display_name="Ligue 2",
        sport="FOOTBALL",
        country="FR",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=62,
        tier=2,
        classification="Prediction",
    ),
    # ===================================================================
    # NETHERLANDS
    # ===================================================================
    "EREDIVISIE": LeagueDefinition(
        league_id="EREDIVISIE",
        display_name="Eredivisie",
        sport="FOOTBALL",
        country="NL",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=88,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # PORTUGAL
    # ===================================================================
    "PRIMEIRA_LIGA": LeagueDefinition(
        league_id="PRIMEIRA_LIGA",
        display_name="Primeira Liga",
        sport="FOOTBALL",
        country="PT",
        season_months=(8, 5),
        has_playoffs=False,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=94,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # BELGIUM
    # ===================================================================
    "JUPILER_PRO": LeagueDefinition(
        league_id="JUPILER_PRO",
        display_name="Belgian First Division A",
        sport="FOOTBALL",
        country="BE",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=144,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # TURKEY
    # ===================================================================
    "SUPER_LIG": LeagueDefinition(
        league_id="SUPER_LIG",
        display_name="Super Lig",
        sport="FOOTBALL",
        country="TR",
        season_months=(8, 5),
        has_playoffs=False,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=203,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # GREECE
    # ===================================================================
    "GREEK_SUPER_LEAGUE": LeagueDefinition(
        league_id="GREEK_SUPER_LEAGUE",
        display_name="Greek Super League",
        sport="FOOTBALL",
        country="GR",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=197,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # SCOTLAND
    # ===================================================================
    "SCOTTISH_PREMIERSHIP": LeagueDefinition(
        league_id="SCOTTISH_PREMIERSHIP",
        display_name="Scottish Premiership",
        sport="FOOTBALL",
        country="GB",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=179,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # AUSTRIA
    # ===================================================================
    "AUSTRIAN_BUNDESLIGA": LeagueDefinition(
        league_id="AUSTRIAN_BUNDESLIGA",
        display_name="Austrian Bundesliga",
        sport="FOOTBALL",
        country="AT",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=218,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # SWITZERLAND
    # ===================================================================
    "SWISS_SUPER_LEAGUE": LeagueDefinition(
        league_id="SWISS_SUPER_LEAGUE",
        display_name="Swiss Super League",
        sport="FOOTBALL",
        country="CH",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=207,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # DENMARK
    # ===================================================================
    "DANISH_SUPERLIGA": LeagueDefinition(
        league_id="DANISH_SUPERLIGA",
        display_name="Danish Superliga",
        sport="FOOTBALL",
        country="DK",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=119,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # NORWAY
    # ===================================================================
    "ELITESERIEN": LeagueDefinition(
        league_id="ELITESERIEN",
        display_name="Eliteserien",
        sport="FOOTBALL",
        country="NO",
        season_months=(3, 11),
        has_playoffs=False,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=103,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # SWEDEN
    # ===================================================================
    "ALLSVENSKAN": LeagueDefinition(
        league_id="ALLSVENSKAN",
        display_name="Allsvenskan",
        sport="FOOTBALL",
        country="SE",
        season_months=(3, 11),
        has_playoffs=False,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=113,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # POLAND
    # ===================================================================
    "EKSTRAKLASA": LeagueDefinition(
        league_id="EKSTRAKLASA",
        display_name="Ekstraklasa",
        sport="FOOTBALL",
        country="PL",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=106,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # ARGENTINA
    # ===================================================================
    "ARGENTINA_PRIMERA": LeagueDefinition(
        league_id="ARGENTINA_PRIMERA",
        display_name="Argentine Primera Division",
        sport="FOOTBALL",
        country="AR",
        season_months=(2, 11),
        has_playoffs=True,
        data_sources=PRED_NO_FOOTYSTATS,
        api_football_id=128,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # BRAZIL
    # ===================================================================
    "BRASILEIRAO": LeagueDefinition(
        league_id="BRASILEIRAO",
        display_name="Brasileirao Serie A",
        sport="FOOTBALL",
        country="BR",
        season_months=(4, 12),
        has_playoffs=False,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=71,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # CHILE
    # ===================================================================
    "CHILE_PRIMERA": LeagueDefinition(
        league_id="CHILE_PRIMERA",
        display_name="Chilean Primera Division",
        sport="FOOTBALL",
        country="CL",
        season_months=(2, 11),
        has_playoffs=True,
        data_sources=PRED_NO_FOOTYSTATS,
        api_football_id=265,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # USA
    # ===================================================================
    "MLS": LeagueDefinition(
        league_id="MLS",
        display_name="Major League Soccer",
        sport="FOOTBALL",
        country="US",
        season_months=(2, 11),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=253,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # MEXICO
    # ===================================================================
    "LIGA_MX": LeagueDefinition(
        league_id="LIGA_MX",
        display_name="Liga MX",
        sport="FOOTBALL",
        country="MX",
        season_months=(8, 5),
        has_playoffs=True,
        data_sources=PRED_NO_FOOTYSTATS,
        api_football_id=262,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # JAPAN
    # ===================================================================
    "J1_LEAGUE": LeagueDefinition(
        league_id="J1_LEAGUE",
        display_name="J1 League",
        sport="FOOTBALL",
        country="JP",
        season_months=(3, 11),
        has_playoffs=True,
        data_sources=PRED_NO_UNDERSTAT,
        api_football_id=98,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # SOUTH KOREA
    # ===================================================================
    "K_LEAGUE_1": LeagueDefinition(
        league_id="K_LEAGUE_1",
        display_name="K League 1",
        sport="FOOTBALL",
        country="KR",
        season_months=(3, 11),
        has_playoffs=True,
        data_sources=PRED_NO_FOOTYSTATS,
        api_football_id=292,
        tier=1,
        classification="Prediction",
    ),
    # ===================================================================
    # AUSTRALIA
    # ===================================================================
    "A_LEAGUE": LeagueDefinition(
        league_id="A_LEAGUE",
        display_name="A-League",
        sport="FOOTBALL",
        country="AU",
        season_months=(10, 5),
        has_playoffs=True,
        data_sources=PRED_NO_FOOTYSTATS,
        api_football_id=188,
        tier=1,
        classification="Prediction",
    ),
}

__all__ = ["PREDICTION_LEAGUES"]
