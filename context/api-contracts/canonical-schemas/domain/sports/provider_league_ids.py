"""Cross-provider league ID mappings for prediction leagues.

Maps canonical league IDs to provider-specific league identifiers.
Keyed by UAC LEAGUE_REGISTRY canonical league_id (e.g. "EPL").

Stability:
  - SOCCER_FOOTBALL_INFO_IDS: Stable (hex, doesn't change per season)
  - TRANSFERMARKT_IDS: Stable (short code, doesn't change per season)
  - UNDERSTAT_NAMES: Stable (5 leagues only, fixed strings)
  - FOOTYSTATS_IDS: CHANGES EVERY SEASON. Current values are for the
    2025 season. Must be refreshed each season via FootyStats /league-list.

Source: Ported from archived new-sports-batting-services
extra/league_classification_config.py + mapping/leagues.csv
"""

from __future__ import annotations

# Soccer-Football-Info championship IDs (stable hex, never changes)
SOCCER_FOOTBALL_INFO_IDS: dict[str, str] = {
    "ALLSVENSKAN": "5c67de1074b5a814",
    "ARGENTINA_PRIMERA": "3ba90aa17a307ae4",
    "AUSTRIAN_BUNDESLIGA": "826950098c1cb000",
    "A_LEAGUE": "8407bfa398b058ea",
    "BRASILEIRAO": "59fb92dcf842d738",
    "BUNDESLIGA": "a0d28d6b99d45e79",
    "BUNDESLIGA_2": "3a625640737668e1",
    "CHILE_PRIMERA": "43de84fef5ca092b",
    "DANISH_SUPERLIGA": "f12fb762acaae78b",
    "EKSTRAKLASA": "a82c7ffdce9b4912",
    "ELITESERIEN": "1a8afb27a4db853c",
    "ENG_CHAMPIONSHIP": "d463240b9b236077",
    "ENG_LEAGUE_ONE": "96860b92d421df21",
    "ENG_LEAGUE_TWO": "d90bcc42d24aaf4c",
    "EPL": "eb57e70ef2e7077e",
    "EREDIVISIE": "2713cd487a76d83a",
    "GREEK_SUPER_LEAGUE": "ce970d0823edec4d",
    "J1_LEAGUE": "cc5f9e51bd5cfffe",
    "JUPILER_PRO": "d5dd4e8a0a877908",
    "K_LEAGUE_1": "2af0ce4164de30b4",
    "LA_LIGA": "4809e54e02cc5630",
    "LIGA_3": "5812be929121305a",
    "LIGA_MX": "d4cd47172b514da3",
    "LIGUE_1": "f0644ed72e7c6a5c",
    "LIGUE_2": "6b2fcdc884329586",
    "MLS": "bdc26311f38963da",
    "PRIMEIRA_LIGA": "f8fd56a0150c50eb",
    "SCOTTISH_PREMIERSHIP": "7644713f59fb0c61",
    "SEGUNDA_DIVISION": "f5e5596b0efdef8e",
    "SERIE_A": "52df5453a0628c0a",
    "SERIE_B": "7343482548e0674b",
    "SUPER_LIG": "5359506f8b7705a4",
    "SWISS_SUPER_LEAGUE": "1dd08ad826affff0",
}

# Transfermarkt league codes (stable, never changes)
TRANSFERMARKT_IDS: dict[str, str] = {
    "ALLSVENSKAN": "SE1",
    "ARGENTINA_PRIMERA": "ARGC",
    "AUSTRIAN_BUNDESLIGA": "A1",
    "A_LEAGUE": "AUS1",
    "BRASILEIRAO": "BRA1",
    "BUNDESLIGA": "L1",
    "BUNDESLIGA_2": "L2",
    "CHILE_PRIMERA": "CLPD",
    "DANISH_SUPERLIGA": "DK1",
    "EKSTRAKLASA": "PL1",
    "ELITESERIEN": "NO1",
    "ENG_CHAMPIONSHIP": "GB2",
    "ENG_LEAGUE_ONE": "GB3",
    "ENG_LEAGUE_TWO": "GB4",
    "EPL": "GB1",
    "EREDIVISIE": "NL1",
    "J1_LEAGUE": "JAP1",
    "JUPILER_PRO": "BE1",
    "K_LEAGUE_1": "RSK1",
    "LA_LIGA": "ES1",
    "LIGA_3": "L3",
    "LIGA_MX": "MEXA",
    "LIGUE_1": "FR1",
    "LIGUE_2": "FR2",
    "MLS": "MLS1",
    "PRIMEIRA_LIGA": "PO1",
    "SCOTTISH_PREMIERSHIP": "SC1",
    "SEGUNDA_DIVISION": "ES2",
    "SERIE_A": "IT1",
    "SERIE_B": "IT2",
    "SUPER_LIG": "TR1",
    "SWISS_SUPER_LEAGUE": "C1",
}

# Understat league names (stable, only 5 leagues covered)
UNDERSTAT_NAMES: dict[str, str] = {
    "BUNDESLIGA": "Bundesliga",
    "EPL": "EPL",
    "LA_LIGA": "La_Liga",
    "LIGUE_1": "Ligue_1",
    "SERIE_A": "Serie_A",
}

# FootyStats season IDs — CHANGES EVERY SEASON
# These are for the 2025 season (current as of March 2026).
# Refresh by calling FootyStats /league-list at season start.
FOOTYSTATS_SEASON_IDS: dict[str, int] = {
    "ALLSVENSKAN": 16263,
    "ARGENTINA_PRIMERA": 15746,
    "AUSTRIAN_BUNDESLIGA": 14923,
    "BRASILEIRAO": 14231,
    "BUNDESLIGA": 14968,
    "BUNDESLIGA_2": 14931,
    "CHILE_PRIMERA": 14116,
    "DANISH_SUPERLIGA": 15055,
    "EKSTRAKLASA": 15031,
    "ELITESERIEN": 16260,
    "ENG_CHAMPIONSHIP": 14930,
    "ENG_LEAGUE_ONE": 14934,
    "ENG_LEAGUE_TWO": 14935,
    "EPL": 15050,
    "EREDIVISIE": 14936,
    "GREEK_SUPER_LEAGUE": 15163,
    "J1_LEAGUE": 16242,
    "JUPILER_PRO": 14937,
    "K_LEAGUE_1": 16243,
    "LA_LIGA": 14956,
    "LIGA_3": 14977,
    "LIGA_MX": 15234,
    "LIGUE_1": 14932,
    "LIGUE_2": 14954,
    "MLS": 13973,
    "PRIMEIRA_LIGA": 15115,
    "SCOTTISH_PREMIERSHIP": 15000,
    "SEGUNDA_DIVISION": 15066,
    "SERIE_A": 15068,
    "SERIE_B": 15632,
    "SUPER_LIG": 14972,
    "SWISS_SUPER_LEAGUE": 15047,
}


# FootyStats HISTORICAL season IDs — reverse map: season_id → canonical league_id.
# Covers ALL seasons from 2010-2026 across 30 leagues. Used to derive the
# canonical league from a FootyStats fixture_id prefix (e.g. "1712:" → ARGENTINA_PRIMERA).
# Generated from the FootyStats /league-list API endpoint.
FOOTYSTATS_HISTORICAL_SEASON_IDS: dict[int, str] = {
    1: "MLS",
    2: "SCOTTISH_PREMIERSHIP",
    3: "BUNDESLIGA",
    4: "BUNDESLIGA",
    5: "BUNDESLIGA",
    7: "BUNDESLIGA",
    9: "EPL",
    10: "EPL",
    11: "EPL",
    12: "EPL",
    13: "PRIMEIRA_LIGA",
    14: "PRIMEIRA_LIGA",
    16: "MLS",
    17: "PRIMEIRA_LIGA",
    18: "PRIMEIRA_LIGA",
    19: "SUPER_LIG",
    20: "SUPER_LIG",
    21: "SUPER_LIG",
    22: "ENG_CHAMPIONSHIP",
    23: "MLS",
    24: "MLS",
    25: "ENG_CHAMPIONSHIP",
    26: "ENG_CHAMPIONSHIP",
    27: "ENG_CHAMPIONSHIP",
    28: "ENG_LEAGUE_ONE",
    29: "ENG_LEAGUE_ONE",
    30: "ENG_LEAGUE_ONE",
    31: "ENG_LEAGUE_ONE",
    32: "ENG_LEAGUE_TWO",
    33: "ENG_LEAGUE_TWO",
    34: "LA_LIGA",
    35: "LA_LIGA",
    36: "LA_LIGA",
    37: "LA_LIGA",
    38: "LA_LIGA",
    39: "LA_LIGA_2",
    40: "LA_LIGA_2",
    41: "LA_LIGA_2",
    42: "LA_LIGA_2",
    43: "LA_LIGA_2",
    44: "ELITESERIEN",
    45: "ELITESERIEN",
    46: "ELITESERIEN",
    51: "EREDIVISIE",
    52: "EREDIVISIE",
    53: "EREDIVISIE",
    54: "EREDIVISIE",
    65: "LIGUE_1",
    66: "LIGUE_1",
    67: "LIGUE_1",
    68: "SERIE_A",
    69: "SERIE_A",
    70: "SERIE_A",
    71: "SERIE_A",
    73: "LIGUE_2",
    74: "LIGUE_2",
    75: "LIGUE_1",
    76: "LIGUE_2",
    77: "SERIE_B",
    78: "SERIE_B",
    79: "SERIE_B",
    80: "SERIE_B",
    81: "SERIE_B",
    82: "JUPILER_PRO",
    83: "BUNDESLIGA_2",
    84: "BUNDESLIGA_2",
    85: "BUNDESLIGA_2",
    86: "LIGA_3",
    87: "LIGA_3",
    88: "LIGA_3",
    100: "BRASILEIRAO",
    101: "BRASILEIRAO",
    104: "ALLSVENSKAN",
    105: "ALLSVENSKAN",
    106: "ALLSVENSKAN",
    107: "ALLSVENSKAN",
    112: "JUPILER_PRO",
    114: "ARGENTINA_PRIMERA",
    115: "ARGENTINA_PRIMERA",
    116: "ARGENTINA_PRIMERA",
    136: "SWISS_SUPER_LEAGUE",
    137: "SWISS_SUPER_LEAGUE",
    138: "SWISS_SUPER_LEAGUE",
    139: "SWISS_SUPER_LEAGUE",
    140: "SWISS_SUPER_LEAGUE",
    161: "EPL",
    162: "J1_LEAGUE",
    163: "MLS",
    164: "SCOTTISH_PREMIERSHIP",
    165: "ENG_CHAMPIONSHIP",
    166: "ENG_LEAGUE_ONE",
    167: "SCOTTISH_PREMIERSHIP",
    168: "SCOTTISH_PREMIERSHIP",
    169: "SCOTTISH_PREMIERSHIP",
    170: "ENG_LEAGUE_TWO",
    171: "LA_LIGA",
    172: "LA_LIGA_2",
    173: "PRIMEIRA_LIGA",
    175: "SUPER_LIG",
    177: "BUNDESLIGA",
    178: "EREDIVISIE",
    180: "LIGUE_1",
    181: "LIGUE_2",
    182: "SERIE_A",
    183: "SERIE_B",
    184: "JUPILER_PRO",
    186: "SWISS_SUPER_LEAGUE",
    188: "BUNDESLIGA_2",
    189: "LIGA_3",
    196: "ARGENTINA_PRIMERA",
    223: "SCOTTISH_PREMIERSHIP",
    246: "EPL",
    250: "J1_LEAGUE",
    251: "J1_LEAGUE",
    252: "J1_LEAGUE",
    253: "J1_LEAGUE",
    254: "J1_LEAGUE",
    255: "EKSTRAKLASA",
    256: "EKSTRAKLASA",
    257: "EKSTRAKLASA",
    278: "EKSTRAKLASA",
    279: "EKSTRAKLASA",
    307: "LIGA_MX",
    308: "LIGA_MX",
    309: "LIGA_MX",
    310: "LIGA_MX",
    311: "LIGA_MX",
    312: "LIGA_MX",
    494: "CHILE_PRIMERA",
    495: "CHILE_PRIMERA",
    496: "CHILE_PRIMERA",
    497: "CHILE_PRIMERA",
    498: "CHILE_PRIMERA",
    561: "DANISH_SUPERLIGA",
    562: "DANISH_SUPERLIGA",
    563: "DANISH_SUPERLIGA",
    564: "DANISH_SUPERLIGA",
    565: "DANISH_SUPERLIGA",
    580: "BRASILEIRAO",
    581: "BRASILEIRAO",
    582: "BRASILEIRAO",
    747: "K_LEAGUE_1",
    748: "K_LEAGUE_1",
    749: "K_LEAGUE_1",
    750: "K_LEAGUE_1",
    751: "K_LEAGUE_1",
    993: "ELITESERIEN",
    994: "ALLSVENSKAN",
    1053: "CHILE_PRIMERA",
    1071: "J1_LEAGUE",
    1076: "MLS",
    1115: "K_LEAGUE_1",
    1198: "BRASILEIRAO",
    1508: "LIGUE_1",
    1537: "JUPILER_PRO",
    1538: "DANISH_SUPERLIGA",
    1563: "LIGA_3",
    1564: "ENG_LEAGUE_ONE",
    1574: "ENG_LEAGUE_TWO",
    1578: "BUNDESLIGA_2",
    1579: "LIGUE_2",
    1582: "LIGA_MX",
    1585: "EREDIVISIE",
    1589: "EKSTRAKLASA",
    1593: "PRIMEIRA_LIGA",
    1600: "SCOTTISH_PREMIERSHIP",
    1610: "SWISS_SUPER_LEAGUE",
    1614: "SUPER_LIG",
    1624: "ENG_CHAMPIONSHIP",
    1625: "EPL",
    1636: "BUNDESLIGA",
    1670: "LA_LIGA_2",
    1677: "LA_LIGA",
    1680: "SERIE_A",
    1712: "ARGENTINA_PRIMERA",
    1749: "SERIE_B",
    1839: "ELITESERIEN",
    1846: "MLS",
    1848: "ALLSVENSKAN",
    1862: "K_LEAGUE_1",
    1864: "J1_LEAGUE",
    1869: "CHILE_PRIMERA",
    1936: "BRASILEIRAO",
    2012: "EPL",
    2187: "ENG_CHAMPIONSHIP",
    2191: "ENG_LEAGUE_ONE",
    2192: "ENG_LEAGUE_TWO",
    2245: "DANISH_SUPERLIGA",
    2249: "SWISS_SUPER_LEAGUE",
    2262: "JUPILER_PRO",
    2270: "LIGA_MX",
    2272: "EREDIVISIE",
    2319: "LA_LIGA",
    2321: "PRIMEIRA_LIGA",
    2328: "EKSTRAKLASA",
    2361: "SCOTTISH_PREMIERSHIP",
    2366: "ARGENTINA_PRIMERA",
    2392: "LIGUE_1",
    2396: "LIGUE_2",
    2415: "LA_LIGA_2",
    2588: "SERIE_A",
    2642: "SERIE_B",
    2648: "SUPER_LIG",
    3119: "EPL",
    3121: "EPL",
    3125: "EPL",
    3131: "EPL",
    3137: "EPL",
    3141: "ENG_CHAMPIONSHIP",
    3143: "ENG_CHAMPIONSHIP",
    3146: "ENG_CHAMPIONSHIP",
    3147: "ENG_CHAMPIONSHIP",
    3631: "LA_LIGA",
    3632: "LA_LIGA",
    3636: "LA_LIGA",
    3637: "LA_LIGA",
    3646: "CHILE_PRIMERA",
    3686: "J1_LEAGUE",
    3695: "ELITESERIEN",
    3703: "ALLSVENSKAN",
    3817: "BRASILEIRAO",
    3940: "SERIE_A",
    3941: "SERIE_A",
    3942: "SERIE_A",
    3945: "SERIE_A",
    3946: "SERIE_B",
    3948: "SERIE_B",
    3949: "SERIE_B",
    3950: "ENG_LEAGUE_ONE",
    3951: "ENG_LEAGUE_ONE",
    3952: "ENG_LEAGUE_ONE",
    3972: "EKSTRAKLASA",
    3973: "EKSTRAKLASA",
    3974: "EKSTRAKLASA",
    3975: "EKSTRAKLASA",
    4105: "BUNDESLIGA",
    4123: "BUNDESLIGA",
    4127: "LIGUE_1",
    4131: "BUNDESLIGA_2",
    4133: "BUNDESLIGA",
    4136: "LIGUE_1",
    4140: "BUNDESLIGA",
    4164: "LIGUE_2",
    4167: "LA_LIGA_2",
    4168: "BUNDESLIGA_2",
    4185: "LIGUE_2",
    4186: "LIGA_3",
    4193: "LIGUE_1",
    4195: "BUNDESLIGA_2",
    4199: "LIGUE_1",
    4200: "BUNDESLIGA_2",
    4224: "ELITESERIEN",
    4225: "PRIMEIRA_LIGA",
    4226: "EREDIVISIE",
    4227: "MLS",
    4231: "ELITESERIEN",
    4232: "PRIMEIRA_LIGA",
    4234: "EREDIVISIE",
    4235: "MLS",
    4237: "ELITESERIEN",
    4238: "PRIMEIRA_LIGA",
    4241: "MLS",
    4242: "ELITESERIEN",
    4244: "ELITESERIEN",
    4245: "LA_LIGA_2",
    4249: "LA_LIGA_2",
    4307: "ALLSVENSKAN",
    4315: "ALLSVENSKAN",
    4329: "ALLSVENSKAN",
    4379: "K_LEAGUE_1",
    4386: "LIGA_3",
    4388: "BUNDESLIGA_2",
    4392: "BUNDESLIGA",
    4473: "MLS",
    4478: "SCOTTISH_PREMIERSHIP",
    4505: "LIGUE_1",
    4507: "LIGA_MX",
    4567: "JUPILER_PRO",
    4624: "BUNDESLIGA",
    4628: "BUNDESLIGA",
    4629: "BUNDESLIGA",
    4642: "DANISH_SUPERLIGA",
    4645: "LIGUE_2",
    4673: "BUNDESLIGA",
    4676: "BUNDESLIGA_2",
    4746: "EREDIVISIE",
    4759: "EPL",
    4760: "EKSTRAKLASA",
    4840: "SUPER_LIG",
    4841: "LIGA_3",
    4844: "ENG_LEAGUE_TWO",
    4845: "ENG_LEAGUE_ONE",
    4885: "PRIMEIRA_LIGA",
    4889: "SERIE_A",
    4906: "SWISS_SUPER_LEAGUE",
    4912: "ENG_CHAMPIONSHIP",
    4923: "ENG_LEAGUE_ONE",
    4944: "LA_LIGA",
    4972: "SERIE_B",
    5220: "ARGENTINA_PRIMERA",
    5434: "J1_LEAGUE",
    5496: "ELITESERIEN",
    5505: "ALLSVENSKAN",
    5506: "K_LEAGUE_1",
    5586: "ARGENTINA_PRIMERA",
    5674: "MLS",
    5682: "CHILE_PRIMERA",
    5713: "BRASILEIRAO",
    5948: "EKSTRAKLASA",
    5951: "EREDIVISIE",
    5961: "DANISH_SUPERLIGA",
    5992: "SCOTTISH_PREMIERSHIP",
    6015: "ENG_LEAGUE_TWO",
    6017: "ENG_LEAGUE_ONE",
    6018: "LIGUE_2",
    6019: "LIGUE_1",
    6020: "BUNDESLIGA_2",
    6038: "LIGA_MX",
    6041: "LIGA_3",
    6044: "SWISS_SUPER_LEAGUE",
    6079: "JUPILER_PRO",
    6089: "ENG_CHAMPIONSHIP",
    6117: "PRIMEIRA_LIGA",
    6120: "LA_LIGA_2",
    6125: "SUPER_LIG",
    6135: "EPL",
    6192: "BUNDESLIGA",
    6198: "SERIE_A",
    6205: "SERIE_B",
    6211: "LA_LIGA",
    6935: "J1_LEAGUE",
    6969: "MLS",
    7036: "CHILE_PRIMERA",
    7048: "ELITESERIEN",
    7061: "K_LEAGUE_1",
    7064: "ALLSVENSKAN",
    7097: "BRASILEIRAO",
    7425: "LIGA_MX",
    7426: "DANISH_SUPERLIGA",
    7428: "EKSTRAKLASA",
    7482: "EREDIVISIE",
    7494: "SCOTTISH_PREMIERSHIP",
    7499: "BUNDESLIGA_2",
    7500: "LIGUE_1",
    7501: "LIGUE_2",
    7504: "SWISS_SUPER_LEAGUE",
    7544: "JUPILER_PRO",
    7570: "ENG_LEAGUE_ONE",
    7574: "ENG_LEAGUE_TWO",
    7591: "LIGA_3",
    7592: "LA_LIGA_2",
    7593: "ENG_CHAMPIONSHIP",
    7608: "SERIE_A",
    7664: "BUNDESLIGA",
    7665: "LA_LIGA",
    7704: "EPL",
    7731: "PRIMEIRA_LIGA",
    7768: "SUPER_LIG",
    7864: "SERIE_B",
    7892: "ARGENTINA_PRIMERA",
    8031: "ENG_CHAMPIONSHIP",
    8595: "ARGENTINA_PRIMERA",
    8737: "ALLSVENSKAN",
    8739: "ELITESERIEN",
    8777: "MLS",
    8810: "J1_LEAGUE",
    8833: "CHILE_PRIMERA",
    8899: "K_LEAGUE_1",
    9035: "BRASILEIRAO",
    9525: "LIGA_MX",
    9545: "DANISH_SUPERLIGA",
    9553: "EKSTRAKLASA",
    9577: "JUPILER_PRO",
    9580: "SWISS_SUPER_LEAGUE",
    9581: "ENG_LEAGUE_TWO",
    9582: "ENG_LEAGUE_ONE",
    9621: "LIGUE_2",
    9636: "SCOTTISH_PREMIERSHIP",
    9653: "EREDIVISIE",
    9655: "BUNDESLIGA",
    9656: "BUNDESLIGA_2",
    9660: "EPL",
    9663: "ENG_CHAMPIONSHIP",
    9665: "LA_LIGA",
    9674: "LIGUE_1",
    9675: "LA_LIGA_2",
    9697: "SERIE_A",
    9741: "LIGA_3",
    9808: "SERIE_B",
    9913: "SUPER_LIG",
    9984: "PRIMEIRA_LIGA",
    10969: "ALLSVENSKAN",
    10976: "ELITESERIEN",
    10977: "MLS",
    10994: "J1_LEAGUE",
    11102: "K_LEAGUE_1",
    11103: "CHILE_PRIMERA",
    11181: "SERIE_A",
    11212: "ARGENTINA_PRIMERA",
    11321: "BRASILEIRAO",
    12120: "EKSTRAKLASA",
    12132: "DANISH_SUPERLIGA",
    12136: "LIGA_MX",
    12137: "JUPILER_PRO",
    12316: "LA_LIGA",
    12322: "EREDIVISIE",
    12325: "EPL",
    12326: "SWISS_SUPER_LEAGUE",
    12337: "LIGUE_1",
    12338: "LIGUE_2",
    12422: "ENG_LEAGUE_TWO",
    12446: "ENG_LEAGUE_ONE",
    12451: "ENG_CHAMPIONSHIP",
    12455: "SCOTTISH_PREMIERSHIP",
    12467: "LA_LIGA_2",
    12528: "BUNDESLIGA_2",
    12529: "BUNDESLIGA",
    12530: "SERIE_A",
    12621: "SERIE_B",
    12623: "LIGA_3",
    12641: "SUPER_LIG",
    12931: "PRIMEIRA_LIGA",
    13973: "MLS",
    14116: "CHILE_PRIMERA",
    14231: "BRASILEIRAO",
    14930: "ENG_CHAMPIONSHIP",
    14931: "BUNDESLIGA_2",
    14932: "LIGUE_1",
    14934: "ENG_LEAGUE_ONE",
    14935: "ENG_LEAGUE_TWO",
    14936: "EREDIVISIE",
    14937: "JUPILER_PRO",
    14954: "LIGUE_2",
    14956: "LA_LIGA",
    14968: "BUNDESLIGA",
    14972: "SUPER_LIG",
    14977: "LIGA_3",
    15000: "SCOTTISH_PREMIERSHIP",
    15031: "EKSTRAKLASA",
    15047: "SWISS_SUPER_LEAGUE",
    15050: "EPL",
    15055: "DANISH_SUPERLIGA",
    15066: "LA_LIGA_2",
    15068: "SERIE_A",
    15115: "PRIMEIRA_LIGA",
    15234: "LIGA_MX",
    15632: "SERIE_B",
    15746: "ARGENTINA_PRIMERA",
    16242: "J1_LEAGUE",
    16243: "K_LEAGUE_1",
    16260: "ELITESERIEN",
    16263: "ALLSVENSKAN",
    16504: "MLS",
    16544: "BRASILEIRAO",
    16558: "ELITESERIEN",
    16571: "ARGENTINA_PRIMERA",
    16576: "ALLSVENSKAN",
    16615: "CHILE_PRIMERA",
    16627: "K_LEAGUE_1",
}


# Polymarket series slugs — CHANGES EVERY SEASON (year-suffixed)
# Current values are for the 2025 season. Polymarket appends the year
# to the slug (e.g. "premier-league-2025"). Refresh when season rolls over.
POLYMARKET_SERIES_SLUGS: dict[str, str] = {
    "ALLSVENSKAN": "allsvenskan-2025",
    "ARGENTINA_PRIMERA": "argentina-primera-division-2025",
    "AUSTRIAN_BUNDESLIGA": "austrian-bundesliga-2025",
    "A_LEAGUE": "a-league-2025",
    "BRASILEIRAO": "brazil-serie-a",
    "BUNDESLIGA": "bundesliga-2025",
    "BUNDESLIGA_2": "bundesliga-2",
    "DANISH_SUPERLIGA": "danish-superliga-2025",
    "EKSTRAKLASA": "ekstraklasa-2025",
    "ELITESERIEN": "eliteserien-2025",
    "ENG_CHAMPIONSHIP": "efl-championship",
    "EPL": "premier-league-2025",
    "EREDIVISIE": "eredivisie-2025",
    "GREEK_SUPER_LEAGUE": "greek-super-league-2025",
    "JUPILER_PRO": "jupiler-pro-league-2025",
    "LA_LIGA": "la-liga-2025",
    "LIGA_MX": "liga-mx-2025",
    "LIGUE_1": "ligue-1-2025",
    "LIGUE_2": "ligue-2-2025",
    "MLS": "mls-2025",
    "PRIMEIRA_LIGA": "primeira-liga-2025",
    "SCOTTISH_PREMIERSHIP": "scottish-premiership-2025",
    "SEGUNDA_DIVISION": "la-liga-2",
    "SERIE_A": "serie-a-2025",
    "SERIE_B": "serie-b-2025",
    "SUPER_LIG": "super-lig-2025",
    "SWISS_SUPER_LEAGUE": "swiss-super-league-2025",
}

# Odds API display league names → canonical league IDs
# Used to join V3 odds data (which uses display names in the GCS path)
# with canonical IDs used everywhere else in the system.
ODDS_API_DISPLAY_TO_CANONICAL: dict[str, str] = {
    "Premier League": "EPL",
    "Championship": "ENG_CHAMPIONSHIP",
    "League One": "ENG_LEAGUE_ONE",
    "League Two": "ENG_LEAGUE_TWO",
    "La Liga": "LA_LIGA",
    "La Liga 2": "SEGUNDA_DIVISION",
    "Bundesliga": "BUNDESLIGA",
    "2. Bundesliga": "BUNDESLIGA_2",
    "3. Liga": "LIGA_3",
    "Serie A": "SERIE_A",
    "Serie B": "SERIE_B",
    "Ligue 1": "LIGUE_1",
    "Ligue 2": "LIGUE_2",
    "Eredivisie": "EREDIVISIE",
    "Primeira Liga": "PRIMEIRA_LIGA",
    "Jupiler Pro League": "JUPILER_PRO",
    "Super Lig": "SUPER_LIG",
    "Süper Lig": "SUPER_LIG",
    "Super League": "SWISS_SUPER_LEAGUE",
    "Greek Super League": "GREEK_SUPER_LEAGUE",
    "Premiership": "SCOTTISH_PREMIERSHIP",
    "Danish Superliga": "DANISH_SUPERLIGA",
    "Eliteserien": "ELITESERIEN",
    "Allsvenskan": "ALLSVENSKAN",
    "Austrian Bundesliga": "AUSTRIAN_BUNDESLIGA",
    "Ekstraklasa": "EKSTRAKLASA",
    "MLS": "MLS",
    "Liga MX": "LIGA_MX",
    "Primera Division": "ARGENTINA_PRIMERA",
    "Brasileirão": "BRASILEIRAO",
    "A-League": "A_LEAGUE",
    "J1 League": "J1_LEAGUE",
    "K League 1": "K_LEAGUE_1",
    "Chile Primera División": "CHILE_PRIMERA",
}

# Reverse lookup: canonical → Odds API display name
_CANONICAL_TO_ODDS_API_DISPLAY: dict[str, str] = {v: k for k, v in ODDS_API_DISPLAY_TO_CANONICAL.items()}


def get_odds_api_display_league(canonical_league_id: str) -> str | None:
    """Get the Odds API display league name from a canonical league ID."""
    return _CANONICAL_TO_ODDS_API_DISPLAY.get(canonical_league_id)


def get_provider_league_id(canonical_league_id: str, provider: str) -> str | int | None:
    """Look up a provider-specific league ID from canonical league ID.

    Args:
        canonical_league_id: UAC league key (e.g. "EPL")
        provider: Provider name — "soccer_football_info", "transfermarkt",
                  "understat", "footystats"

    Returns:
        Provider-specific ID, or None if not mapped.
    """
    if provider == "soccer_football_info":
        return SOCCER_FOOTBALL_INFO_IDS.get(canonical_league_id)
    if provider == "transfermarkt":
        return TRANSFERMARKT_IDS.get(canonical_league_id)
    if provider == "understat":
        return UNDERSTAT_NAMES.get(canonical_league_id)
    if provider == "footystats":
        return FOOTYSTATS_SEASON_IDS.get(canonical_league_id)
    if provider == "polymarket":
        return POLYMARKET_SERIES_SLUGS.get(canonical_league_id)
    if provider == "odds_api":
        return _CANONICAL_TO_ODDS_API_DISPLAY.get(canonical_league_id)
    return None


# ---------------------------------------------------------------------------
# Sports entity → league coverage mapping
#
# Maps each sports manifest entity name to the set of canonical league IDs
# it covers.  ``None`` means "all leagues" — the entity is expected on every
# date that has ANY fixture.  A specific ``frozenset`` means the entity is
# only expected on dates where at least one of those leagues has a fixture.
#
# Used by instruments-service (freshness check) and deployment-api (denominator)
# to avoid phantom "missing" data for entities that only cover a subset of
# leagues (e.g. Understat covers 5 European leagues, not J1 or MLS).
# ---------------------------------------------------------------------------

# Derived from UNDERSTAT_NAMES keys — the 5 leagues Understat covers.
_UNDERSTAT_LEAGUE_COVERAGE: frozenset[str] = frozenset(UNDERSTAT_NAMES.keys())

SPORTS_ENTITY_LEAGUE_COVERAGE: dict[str, frozenset[str] | None] = {
    # Core entities — expected on all fixture dates
    "FIXTURES": None,
    "LEAGUES": None,
    "TEAMS": None,
    "STANDINGS": None,
    "INJURIES": None,
    # Per-fixture entities — expected on all fixture dates
    "FIXTURE_STATS": None,
    "FIXTURE_EVENTS": None,
    "FIXTURE_LINEUPS": None,
    "PLAYER_STATS": None,
    # Enrichment entities — coverage varies by source
    "XG": _UNDERSTAT_LEAGUE_COVERAGE,  # Understat: 5 European leagues
    "MATCHES": None,  # FootyStats: all leagues
    "PREDICTIONS": None,  # FootyStats: all leagues
    "TRANSFERMARKT_LEAGUES": None,  # Transfermarkt: all mapped leagues
    "PLAYER_VALUES": None,  # Transfermarkt: all mapped leagues
    "SFI_LEAGUES": None,  # SFI: all mapped leagues
    "SFI_STANDINGS": None,  # SFI: all mapped leagues
    "SFI_PROGRESSIVE_STATS": None,  # SFI: all mapped leagues
    "WEATHER": None,  # Open Meteo: all fixtures with coordinates
}


def get_entity_league_coverage(entity: str) -> frozenset[str] | None:
    """Return the set of canonical league IDs an entity covers.

    Returns ``None`` if the entity covers all leagues (expected on every
    fixture date).  Returns a ``frozenset`` of canonical league IDs if
    the entity is only expected when those specific leagues have fixtures.

    Args:
        entity: Sports manifest entity name (e.g. "XG", "FIXTURES").

    Returns:
        League coverage set, or ``None`` for all-league entities.
    """
    return SPORTS_ENTITY_LEAGUE_COVERAGE.get(entity.upper())


# ── Provider-specific start dates for sports entities ──
# Before these dates, the provider did not supply data — so pre-start
# fixture dates should NOT count as "missing" in the denominator.
SPORTS_ENTITY_START_DATES: dict[str, str] = {
    # SFI progressive stats / xG — Ultra xG feature launched 2024-03-15
    "SFI_PROGRESSIVE_STATS": "2024-03-15",
    "SFI_LEAGUES": "2024-03-15",
    "SFI_STANDINGS": "2024-03-15",
    # Understat xG — backfilled from 2019-01-01
    "XG": "2019-01-01",
    # FootyStats entities — backfilled from 2019-01-01
    "MATCHES": "2019-01-01",
    "PREDICTIONS": "2019-01-01",
    # Weather — collection started 2024-01-01
    "WEATHER": "2024-01-01",
    # Transfermarkt entities — backfilled from 2019-01-01
    "TRANSFERMARKT_LEAGUES": "2019-01-01",
    "PLAYER_VALUES": "2019-01-01",
    # API Football core entities — backfilled from 2019-01-01
    "FIXTURES": "2019-01-01",
    "FIXTURE_STATS": "2019-01-01",
    "FIXTURE_EVENTS": "2019-01-01",
    "FIXTURE_LINEUPS": "2019-01-01",
    "PLAYER_STATS": "2019-01-01",
    "LEAGUES": "2019-01-01",
    "TEAMS": "2019-01-01",
    "STANDINGS": "2019-01-01",
    "INJURIES": "2019-01-01",
    # Odds API — collection started 2024-07-01
    "ODDS": "2024-07-01",
}


def get_sports_entity_start_date(entity: str) -> str | None:
    """Return the earliest date a sports entity has data available.

    Used by the data status denominator to exclude pre-start dates from
    the "expected" count — prevents inflating missing data figures for
    entities whose provider only started supplying data after a given date.

    Args:
        entity: Sports manifest entity name (e.g. "SFI_PROGRESSIVE_STATS").

    Returns:
        ISO date string, or ``None`` if no start date is registered.
    """
    return SPORTS_ENTITY_START_DATES.get(entity.upper())
