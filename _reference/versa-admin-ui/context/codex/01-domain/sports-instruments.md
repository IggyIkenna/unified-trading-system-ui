# Sports Instruments: Format, Matching, Normalization

**Asset Class:** SPORTS (FOOTBALL)  
**Purpose:** Define canonical instrument format for sports betting  
**Reference:** [sportsbetting-services/docs/INSTRUMENT_KEY.md](../../sports-betting-services/docs/INSTRUMENT_KEY.md)

---

## Overview

Sports instruments differ from crypto/TradFi in several critical ways:

| Dimension      | Crypto/TradFi                               | Sports                                                                                 |
| -------------- | ------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Identifier** | BINANCE:SPOT:BTC-USDT                       | FOOTBALL:BETFAIR:MATCH_ODDS:ENG-PREMIER_LEAGUE:2024-2025:LIVERPOOL-C_PALACE::LIVERPOOL |
| **Temporal**   | Date-based (2024-01-15)                     | Season-based (2024-2025)                                                               |
| **Uniqueness** | Venue + instrument type + symbol            | Venue + market type + league + season + fixture + selection                            |
| **Lifecycle**  | Indefinite (spot) or fixed expiry (futures) | Fixed (match date), but date unreliable                                                |
| **Outcomes**   | Binary (buy/sell)                           | Multi-outcome (home/draw/away, over/under, etc.)                                       |

**Key Insight:** Season-based identifiers (2024-2025) are more reliable than fixture dates, as matches are frequently
rescheduled.

---

## Canonical Instrument Format

### Format Specification

```
SPORT:VENUE:MARKET_TYPE:LEAGUE:SEASON:HOME-AWAY::SELECTION
```

### Components

| Component       | Description                | Example Values                                            | Rules                                              |
| --------------- | -------------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| **SPORT**       | Sport type                 | FOOTBALL, TENNIS, BASKETBALL                              | Always FOOTBALL for Phase 1                        |
| **VENUE**       | Betting exchange/bookmaker | BETFAIR, PINNACLE, POLYMARKET                             | Canonical venue names (uppercase, no spaces)       |
| **MARKET_TYPE** | Type of bet                | MATCH*ODDS, OVER_UNDER_2_5, ASIAN_HANDICAP*-1_5           | Includes handicap in name (e.g., \_-1_5)           |
| **LEAGUE**      | Competition                | ENG-PREMIER_LEAGUE, GER-BUNDESLIGA, UEFA-CHAMPIONS_LEAGUE | Canonical league names (country-league format)     |
| **SEASON**      | Season identifier          | 2024-2025, 2023-2024                                      | YYYY-YYYY format (August→May for European leagues) |
| **HOME-AWAY**   | Fixture pairing            | LIVERPOOL-C_PALACE, ARSENAL-CHELSEA                       | Home team first, canonical team names              |
| **SELECTION**   | Bet outcome                | LIVERPOOL, DRAW, OVER, UNDER, YES, NO                     | What you're betting on                             |

### Example Instruments

```
# Match odds (3-way: home/draw/away)
FOOTBALL:BETFAIR:MATCH_ODDS:ENG-PREMIER_LEAGUE:2024-2025:LIVERPOOL-C_PALACE::LIVERPOOL
FOOTBALL:BETFAIR:MATCH_ODDS:ENG-PREMIER_LEAGUE:2024-2025:LIVERPOOL-C_PALACE::DRAW
FOOTBALL:BETFAIR:MATCH_ODDS:ENG-PREMIER_LEAGUE:2024-2025:LIVERPOOL-C_PALACE::C_PALACE

# Over/Under 2.5 goals (2-way)
FOOTBALL:PINNACLE:OVER_UNDER_2_5:ENG-PREMIER_LEAGUE:2024-2025:ARSENAL-CHELSEA::OVER
FOOTBALL:PINNACLE:OVER_UNDER_2_5:ENG-PREMIER_LEAGUE:2024-2025:ARSENAL-CHELSEA::UNDER

# Asian Handicap (2-way, handicap embedded in market type)
FOOTBALL:BETFAIR:ASIAN_HANDICAP_-1_5:ENG-PREMIER_LEAGUE:2024-2025:MAN_CITY-BRIGHTON::MAN_CITY
FOOTBALL:BETFAIR:ASIAN_HANDICAP_-1_5:ENG-PREMIER_LEAGUE:2024-2025:MAN_CITY-BRIGHTON::BRIGHTON

# Both teams to score (2-way)
FOOTBALL:PINNACLE:BOTH_TEAMS_TO_SCORE:ESP-LA_LIGA:2024-2025:BARCELONA-REAL_MADRID::YES
FOOTBALL:PINNACLE:BOTH_TEAMS_TO_SCORE:ESP-LA_LIGA:2024-2025:BARCELONA-REAL_MADRID::NO

# Prediction market (on-chain, unknown league)
FOOTBALL:POLYMARKET:MATCH_WINNER:UNKNOWN:2024-2025:TEAM_A-TEAM_B::TEAM_A
```

---

## Fixture Matching

### Problem: Multiple IDs Across Providers

Each data provider uses different IDs for the same fixture:

| Provider         | ID Format              | Example        |
| ---------------- | ---------------------- | -------------- |
| **Betfair**      | Market ID (numeric)    | `1.234567890`  |
| **Odds API**     | Game ID (alphanumeric) | `abc123def456` |
| **API-Football** | Fixture ID (numeric)   | `867530`       |
| **Pinnacle**     | Event ID (numeric)     | `123456789`    |

**Challenge:** A single real-world match (Liverpool vs. Crystal Palace on 2024-08-16) has 4+ different IDs across
providers.

### Solution: Canonical Fixture Mapping

Use **API-Football fixture ID** as the canonical ID, and maintain mapping tables:

```python
# FixtureMapping table (BigQuery or GCS)
{
  "api_football_fixture_id": "867530",
  "betfair_market_id": "1.234567890",
  "odds_api_game_id": "abc123def456",
  "pinnacle_event_id": "123456789",
  "home_team_canonical": "LIVERPOOL",
  "away_team_canonical": "C_PALACE",
  "league_canonical": "ENG-PREMIER_LEAGUE",
  "season": "2024-2025",
  "kickoff_time": "2024-08-16T19:00:00Z"
}
```

### Matching Algorithm

```python
def match_fixture(venue: str, venue_id: str) -> str:
    """
    Match a venue-specific ID to canonical API-Football fixture ID.

    Args:
        venue: BETFAIR, PINNACLE, ODDS_API
        venue_id: Venue-specific ID (e.g., Betfair market ID)

    Returns:
        API-Football fixture ID (canonical)
    """
    # Lookup in FixtureMapping table
    mapping = query_fixture_mapping(venue, venue_id)

    if mapping:
        return mapping["api_football_fixture_id"]

    # Fallback: fuzzy match on team names + kickoff time
    # (for new fixtures not yet in mapping table)
    return fuzzy_match_fixture(venue, venue_id)
```

**Matching Confidence:**

- ✅ **Exact match** (90% of cases): Found in mapping table
- ⚠️ **Fuzzy match** (9% of cases): Matched via team names + kickoff time (±2 hours)
- ❌ **No match** (1% of cases): Unknown fixture, requires manual mapping

---

## Team Normalization

### Problem: Inconsistent Team Names

| Provider         | Liverpool Name | Crystal Palace Name |
| ---------------- | -------------- | ------------------- |
| **Betfair**      | Liverpool      | Crystal Palace      |
| **API-Football** | Liverpool FC   | Crystal Palace      |
| **Odds API**     | Liverpool      | Crystal Palace      |
| **Pinnacle**     | Liverpool      | Cry Palace          |

**Challenge:** 4+ variations of team names for the same team.

### Solution: Canonical Team Mapping

**Canonical Team Names:** Use abbreviated, uppercase, underscored format

| Official Name           | Canonical Name |
| ----------------------- | -------------- |
| Liverpool FC            | LIVERPOOL      |
| Crystal Palace          | C_PALACE       |
| Manchester United       | MAN_UNITED     |
| Manchester City         | MAN_CITY       |
| Tottenham Hotspur       | TOTTENHAM      |
| Brighton & Hove Albion  | BRIGHTON       |
| Wolverhampton Wanderers | WOLVES         |

**Rules:**

- Remove "FC", "AFC", "United FC" suffixes
- Replace spaces with underscores
- Abbreviate long names (Crystal Palace → C_PALACE)
- Disambiguate (Manchester United → MAN_UNITED, Manchester City → MAN_CITY)

### TeamMapping Table

```python
# TeamMapping table (BigQuery or GCS)
{
  "team_id_api_football": "40",  # Liverpool's API-Football ID
  "team_name_canonical": "LIVERPOOL",
  "team_name_betfair": "Liverpool",
  "team_name_odds_api": "Liverpool",
  "team_name_pinnacle": "Liverpool",
  "team_name_api_football": "Liverpool FC",
  "league_primary": "ENG-PREMIER_LEAGUE",
  "country": "England"
}
```

### Normalization Algorithm

```python
def normalize_team_name(venue: str, venue_team_name: str) -> str:
    """
    Normalize venue-specific team name to canonical format.

    Args:
        venue: BETFAIR, PINNACLE, ODDS_API, API_FOOTBALL
        venue_team_name: Team name as provided by venue

    Returns:
        Canonical team name (e.g., LIVERPOOL)
    """
    # Lookup in TeamMapping table
    field = f"team_name_{venue.lower()}"
    mapping = query_team_mapping(field, venue_team_name)

    if mapping:
        return mapping["team_name_canonical"]

    # Fallback: fuzzy match on team name
    return fuzzy_match_team(venue_team_name)
```

---

## League Normalization

### Canonical League Names

| League           | Canonical Name        | Country     |
| ---------------- | --------------------- | ----------- |
| Premier League   | ENG-PREMIER_LEAGUE    | England     |
| Bundesliga       | GER-BUNDESLIGA        | Germany     |
| La Liga          | ESP-LA_LIGA           | Spain       |
| Serie A          | ITA-SERIE_A           | Italy       |
| Ligue 1          | FRA-LIGUE_1           | France      |
| Champions League | UEFA-CHAMPIONS_LEAGUE | Europe      |
| Europa League    | UEFA-EUROPA_LEAGUE    | Europe      |
| Championship     | ENG-CHAMPIONSHIP      | England     |
| Eredivisie       | NED-EREDIVISIE        | Netherlands |

**Format:** `COUNTRY-LEAGUE_NAME` (uppercase, underscored)

### LeagueMapping Table

```python
# LeagueMapping table (BigQuery or GCS)
{
  "league_id_api_football": "39",  # Premier League
  "league_name_canonical": "ENG-PREMIER_LEAGUE",
  "league_name_betfair": "English Premier League",
  "league_name_odds_api": "EPL",
  "league_name_pinnacle": "England - Premier League",
  "league_name_api_football": "Premier League",
  "country": "England",
  "tier": 1
}
```

---

## Season Format

### Season-Based vs. Date-Based

**Why Season-Based?**

- Fixture dates are unreliable (matches frequently rescheduled)
- Seasons are stable (August → May for European leagues)
- Easier to query "all Premier League 2024-2025 season fixtures"

**Format:** `YYYY-YYYY` (e.g., 2024-2025)

**Season Boundaries:**

| League         | Season Start | Season End | Format    |
| -------------- | ------------ | ---------- | --------- |
| Premier League | August       | May        | 2024-2025 |
| Bundesliga     | August       | May        | 2024-2025 |
| MLS            | March        | October    | 2024      |
| NFL            | September    | February   | 2024      |

**Note:** Most European leagues use YYYY-YYYY format (e.g., 2024-2025). Some leagues (MLS, NFL) use single year (e.g.,
2024).

---

## Handicap Encoding

### Asian Handicap

**Format:** Embed handicap in market type (e.g., `ASIAN_HANDICAP_-1_5`)

**Examples:**

| Market Type           | Description          | Meaning                   |
| --------------------- | -------------------- | ------------------------- |
| `ASIAN_HANDICAP_-1_5` | Home team -1.5 goals | Home must win by 2+ goals |
| `ASIAN_HANDICAP_-0_5` | Home team -0.5 goals | Home must win by 1+ goals |
| `ASIAN_HANDICAP_+1_5` | Home team +1.5 goals | Home can lose by 1 goal   |
| `ASIAN_HANDICAP_0_0`  | Level handicap       | Draw no bet               |

**Selection:**

- `HOME_TEAM` (backing the handicap)
- `AWAY_TEAM` (opposing the handicap)

### European Handicap

Similar to Asian, but includes draw outcome:

| Market Type            | Outcomes         |
| ---------------------- | ---------------- |
| `EUROPEAN_HANDICAP_-1` | HOME, DRAW, AWAY |
| `EUROPEAN_HANDICAP_-2` | HOME, DRAW, AWAY |

---

## Storage & Schema

### Instrument Table (BigQuery)

```sql
CREATE TABLE instruments.sports_instruments (
  instrument_key STRING NOT NULL,  -- Canonical key (PRIMARY KEY)
  sport STRING NOT NULL,            -- FOOTBALL
  venue STRING NOT NULL,            -- BETFAIR, PINNACLE, POLYMARKET
  market_type STRING NOT NULL,      -- MATCH_ODDS, OVER_UNDER_2_5, etc.
  league STRING NOT NULL,           -- ENG-PREMIER_LEAGUE
  season STRING NOT NULL,           -- 2024-2025
  home_team STRING NOT NULL,        -- LIVERPOOL (canonical)
  away_team STRING NOT NULL,        -- C_PALACE (canonical)
  selection STRING NOT NULL,        -- LIVERPOOL, DRAW, OVER, etc.
  fixture_id STRING,                -- API-Football fixture ID (canonical)
  kickoff_time TIMESTAMP,           -- Actual kickoff time (may change)
  venue_market_id STRING,           -- Venue-specific market ID
  status STRING,                    -- ACTIVE, COMPLETED, POSTPONED, CANCELLED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_venue ON instruments.sports_instruments(venue);
CREATE INDEX idx_league_season ON instruments.sports_instruments(league, season);
CREATE INDEX idx_fixture_id ON instruments.sports_instruments(fixture_id);
CREATE INDEX idx_kickoff_time ON instruments.sports_instruments(kickoff_time);
```

### Mapping Tables

```sql
-- FixtureMapping (cross-provider fixture IDs)
CREATE TABLE instruments.fixture_mapping (
  api_football_fixture_id STRING PRIMARY KEY,
  betfair_market_id STRING,
  odds_api_game_id STRING,
  pinnacle_event_id STRING,
  home_team_canonical STRING,
  away_team_canonical STRING,
  league_canonical STRING,
  season STRING,
  kickoff_time TIMESTAMP
);

-- TeamMapping (cross-provider team names)
CREATE TABLE instruments.team_mapping (
  team_id_api_football STRING PRIMARY KEY,
  team_name_canonical STRING,
  team_name_betfair STRING,
  team_name_odds_api STRING,
  team_name_pinnacle STRING,
  team_name_api_football STRING,
  league_primary STRING,
  country STRING
);

-- LeagueMapping (cross-provider league names)
CREATE TABLE instruments.league_mapping (
  league_id_api_football STRING PRIMARY KEY,
  league_name_canonical STRING,
  league_name_betfair STRING,
  league_name_odds_api STRING,
  league_name_pinnacle STRING,
  league_name_api_football STRING,
  country STRING,
  tier INT64
);
```

---

## Implementation Checklist

**Phase 1: Canonical Format**

- [ ] Define instrument key format
- [ ] Define team/league canonical names
- [ ] Define season format (YYYY-YYYY)
- [ ] Define handicap encoding rules

**Phase 2: Mapping Tables**

- [ ] Create FixtureMapping table
- [ ] Create TeamMapping table
- [ ] Create LeagueMapping table
- [ ] Populate with seed data (Tier 1 leagues)

**Phase 3: Parsers**

- [ ] Implement Betfair parser (parse market ID → instrument key)
- [ ] Implement Pinnacle parser
- [ ] Implement Polymarket parser
- [ ] Implement Odds API parser

**Phase 4: Matching Logic**

- [ ] Implement fixture matching (venue ID → API-Football ID)
- [ ] Implement team normalization (venue name → canonical name)
- [ ] Implement league normalization
- [ ] Handle fuzzy matching (for new fixtures)

**Phase 5: Validation**

- [ ] Unit tests: parse instrument keys
- [ ] Unit tests: match fixtures
- [ ] Unit tests: normalize teams/leagues
- [ ] Integration test: E2E fixture ingestion
- [ ] Validate on 1 season of historical data

---

## References

- Primary Spec: [sportsbetting-services/docs/INSTRUMENT_KEY.md](../../sports-betting-services/docs/INSTRUMENT_KEY.md)
- Codex: `01-domain/asset-classes.md#sports`
- Codex: `02-data/sports-data-sources.md`
- Service: `instruments-service` (handles sports instruments)
