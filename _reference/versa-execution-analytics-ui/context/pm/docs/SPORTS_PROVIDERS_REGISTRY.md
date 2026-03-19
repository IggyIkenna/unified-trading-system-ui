# Sports Providers Registry

## Overview

This document is the single source of truth for all sports data providers, odds aggregators, exchange bookmakers, and
non-exchange bookmakers (API or scraping) in the unified trading system. It tracks UAC (unified-api-contracts), UMI
(unified-market-interface), and USEI (unified-sports-execution-interface) integration status.

**Abbreviations:**

| Abbrev | Library                            | Role                                         |
| ------ | ---------------------------------- | -------------------------------------------- |
| UAC    | unified-api-contracts              | Schemas, Pydantic models, API response types |
| UMI    | unified-market-interface           | Market data adapters (odds feeds, streaming) |
| USEI   | unified-sports-execution-interface | Execution adapters (place bet, cancel, etc.) |

---

## 1. Data Providers (market data, fixtures, stats)

| Provider             | UAC Schemas                  | UMI Adapter           | Notes                            |
| -------------------- | ---------------------------- | --------------------- | -------------------------------- |
| API-Football         | api_football/schemas         | APIFootballAdapter    | Fixtures, stats, events, lineups |
| FootyStats           | footystats/schemas           | FootyStatsAdapter     | Match stats, referee             |
| Understat            | understat/schemas            | UnderstatAdapter      | xG (5 leagues)                   |
| Transfermarkt        | transfermarkt/schemas        | TransfermarktAdapter  | Players, injuries, transfers     |
| Soccer Football Info | soccer_football_info/schemas | SoccerFootballAdapter | HT stats, progressive            |
| Open Meteo           | open_meteo/schemas           | OpenMeteoAdapter      | Weather                          |

---

## 2. Odds Aggregators

| Provider     | Type       | UAC Schemas       | UMI              | USEI           | Notes                                          |
| ------------ | ---------- | ----------------- | ---------------- | -------------- | ---------------------------------------------- |
| The Odds API | aggregator | odds_api/schemas  | yes              | OddsApiAdapter | Tier 1: 250+ bookmakers, batch + live fallback |
| OpticOdds    | streaming  | opticodds/schemas | OpticOddsAdapter | -              | Tier 2: WebSocket streaming, sub-second        |
| OddsJam      | streaming  | oddsjam/schemas   | OddsJamAdapter   | -              | Tier 2: Live odds, arb/value detection         |
| SharpAPI     | aggregator | Planned           | -                | -              | Sub-100ms, SSE, 15+ US books                   |
| Odds Engine  | aggregator | Planned           | -                | -              | Sub-10ms, WebSocket/SSE, 30+ US books          |
| MetaBet      | aggregator | Planned           | -                | -              | Pre-game, in-play, props, futures              |

---

## 3. Exchange Bookmakers (API-based execution)

| Provider  | UAC Schemas       | USEI Adapter     | Notes                   |
| --------- | ----------------- | ---------------- | ----------------------- |
| Betfair   | betfair/schemas   | BetfairAdapter   | Primary execution venue |
| Matchbook | matchbook/schemas | MatchbookAdapter | \_matchbook_models.py   |
| Smarkets  | smarkets/schemas  | SmarketsAdapter  | \_smarkets_models.py    |
| Betdaq    | betdaq/schemas    | BetdaqAdapter    | \_betdaq_models.py      |

---

## 4. Non-Exchange Bookmakers

### 4a. API-based

| Provider | UAC Schemas      | USEI Adapter    | Notes                |
| -------- | ---------------- | --------------- | -------------------- |
| Pinnacle | pinnacle/schemas | PinnacleAdapter | Sharp reference odds |
| OneXBet  | -                | OneXBetAdapter  | BOOKMAKER_REGISTRY   |

### 4b. Scraping (Playwright)

| Provider     | UAC Schemas | USEI Adapter       | Notes                     |
| ------------ | ----------- | ------------------ | ------------------------- |
| Bet365       | -           | Bet365Adapter      | Playwright scraper        |
| SkyBet       | -           | SkyBetAdapter      | Playwright scraper        |
| William Hill | -           | WilliamHillAdapter | Playwright scraper        |
| Ladbrokes    | -           | LadbrokesAdapter   | Playwright scraper        |
| Paddy Power  | -           | PaddyPowerAdapter  | Flutter-owned             |
| Coral        | -           | CoralAdapter       | Playwright scraper        |
| Betfred      | -           | BetfredAdapter     | Playwright scraper        |
| BetVictor    | -           | BetVictorAdapter   | Playwright scraper        |
| BoyleSports  | -           | BoyleSportsAdapter | Playwright scraper        |
| Bwin         | -           | BwinAdapter        | Playwright scraper        |
| Betway       | -           | BetwayAdapter      | Playwright scraper        |
| Unibet       | -           | UnibetAdapter      | Playwright scraper        |
| 888sport     | -           | Bet888sportAdapter | Playwright scraper        |
| SBO          | Planned     | -                  | Asian bookmaker (planned) |

**Scraping for orders and market data:** Non-exchange bookmakers without APIs (Bovada, BetOnline, Bet365, SkyBet, etc.)
require Playwright-based scraping for both order placement and market data. USEI scraper adapters use Playwright for
browser automation. Odds API and aggregators (SharpAPI, Odds Engine) provide odds without scraping; scraping is only for
providers with no API.

---

## 5. Unified Library Integration Summary

| Library | Sports Integration                                                                                                                                                                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UAC     | Schemas: api_football, footystats, understat, soccer_football_info, transfermarkt, open_meteo, odds_api, betfair, pinnacle, matchbook, smarkets, betdaq, opticodds, oddsjam. BOOKMAKER_REGISTRY (22 entries). CanonicalOdds, OddsType, BetExecution, BetOrder, BookmakerUnavailableError, ScraperError. |
| UMI     | SPORTS_REGISTRY: OddsApiAdapter, OpticOddsAdapter, OddsJamAdapter. Data: APIFootballAdapter, FootyStatsAdapter, UnderstatAdapter, etc. Config: MarketDataProviderConfig.                                                                                                                                |
| USEI    | Aggregator: OddsApiAdapter. Exchanges: Betfair, Matchbook, Smarkets, Betdaq. Bookmaker API: Pinnacle, OneXBet. Scrapers: 13 (Bet365, SkyBet, William Hill, Ladbrokes, Paddy Power, Coral, Betfred, BetVictor, BoyleSports, Bwin, Betway, Unibet, 888sport). BaseSportsAdapter protocol.                 |

---

## 6. Counts by Type

| Type                   | Implemented | Planned |
| ---------------------- | ----------- | ------- |
| Data providers         | 6           | 0       |
| Odds aggregators       | 3           | 3       |
| Exchange bookmakers    | 4           | 0       |
| Non-exchange (API)     | 2           | 0       |
| Non-exchange (scraper) | 13          | 1       |

---

## Related

- unified-trading-codex/02-data/sports-schema-paths.md - GCS path structures for sports_features, sports_odds
- unified-trading-codex/02-data/sports-data-migration.md - Bucket refactoring, migration patterns
- plans/active/SPORTS_BETTING_PREVIOUS_FULL_MIGRATION.md - Previous migration context
