---
name: sports-canonical-mapping-and-gcs-migration
locked_by: live-defi-rollout
locked_since: 2026-03-18
overview: |
  Consolidate all sports canonical ID mappings into UAC (their correct SSOT),
  remove duplicate implementations scattered across instruments-service and
  deployment-service, and write a GCS migration script for existing sports data.

  ## Problem
  Sports mapping data (league registry, team aliases, stadium names, player name
  normalisation) lives in instruments-service/sports/ (17 files) and
  deployment-service/scripts/sports/. Zero of it is in UAC where it belongs.
  Downstream services that need the same data either re-implement or go without.

  ## Solution
  1. Lift all type/data definitions into UAC (canonical/ + external/api_football/ +
     external/odds_api/) and export via the sports facade.
  2. instruments-service deletes its local sports/ implementations and imports UAC.
  3. USRI re-exports the new UAC symbols.
  4. GCS migration script handles existing data path alignment.

  ## Scope: 4 repos touched
  - unified-api-contracts (UAC)   — primary target
  - instruments-service           — delete local, import UAC
  - unified-sports-reference-interface (USRI) — re-export new symbols
  - unified-trading-pm            — GCS migration script

isProject: false
todos:
  # ============================================================================
  # PHASE 1 — UAC: Add canonical types and mapping data  [PARALLEL within phase]
  # ============================================================================
  - id: p1a-uac-league-registry-types
    content: |
      - [x] [AGENT] P1. Add LeagueDefinition dataclass + LeagueClassification types to UAC.
        Create unified_api_contracts/canonical/domain/sports/league_registry.py with:
        - LeagueDefinition frozen dataclass (league_id, display_name, sport, country,
          season_months, has_playoffs, data_sources, api_football_id, tier, classification)
        - LeagueClassificationType enum (Prediction, Features, Reference, Other)
        - LeagueClassification Pydantic model (api_football_id, type, tier, odds_api_key)
        - Helper constants: PRED_FULL, PRED_NO_UNDERSTAT, PRED_NO_FOOTYSTATS, FEAT_STANDARD,
          FEAT_NO_FOOTYSTATS, REF_API_ONLY, COUNTRY_MAP, SEASON_BY_COUNTRY frozensets
        Export from unified_api_contracts/canonical/domain/sports/__init__.py
        and from unified_api_contracts/sports.py facade.
        Source: instruments-service/instruments_service/sports/league_definition.py
                instruments-service/instruments_service/sports/league_classification.py
    status: done
  - id: p1b-uac-league-data
    content: |
      - [x] [AGENT] P1. Add league data to UAC external/api_football/league_data.py.
        Create LEAGUE_REGISTRY dict[str, LeagueDefinition] with all ~94 leagues.
        Split across prediction + other sub-modules mirroring instruments-service pattern.
        Include get_league(), get_league_by_api_football_id(), get_prediction_leagues(),
        get_leagues_by_classification(), get_leagues_by_country() query functions.
        Source: instruments-service/instruments_service/sports/league_data_prediction.py
                instruments-service/instruments_service/sports/league_data_other.py
                instruments-service/instruments_service/sports/league_lookup.py
        Add to external/api_football/__init__.py exports.
    status: done
  - id: p1c-uac-team-mappings
    content: |
      - [x] [AGENT] P1. Add team mapping data to UAC external/api_football/team_mappings.py.
        Contents:
        - EPL_TEAM_MAPPINGS: list[dict] — 40+ EPL teams with canonical_team_id,
          display_name, api_football_id, aliases list (Betfair/display variants)
        - BUNDESLIGA_TEAM_MAPPINGS: list[dict] — 30+ Bundesliga teams
        - API_FOOTBALL_TO_CANONICAL: dict[str, str] — API Football display name → canonical
        - BETFAIR_TO_CANONICAL: dict[str, str] — Betfair variations → canonical (upper)
        - get_canonical_team_name_from_api_football(name: str) -> str
        - get_canonical_team_name_from_betfair(name: str) -> str
        Source: instruments-service/instruments_service/sports/team_mapping_data.py
                instruments-service/instruments_service/sports/team_mapping_data_bundesliga.py
                /tmp/footballbets/footballbets/utils/mapping.py (EPL/BL mappings)
        Add to external/api_football/__init__.py exports.
    status: done
  - id: p1d-uac-stadium-mappings
    content: |
      - [x] [AGENT] P1. Add stadium/venue canonical name mappings to UAC.
        Create external/api_football/stadium_mappings.py with:
        - API_FOOTBALL_TO_CANONICAL_STADIUMS: dict[str, str] (~80 stadiums EPL + Bundesliga)
        - get_canonical_stadium_name_from_api_football(name: str) -> str
        Source: /tmp/footballbets/footballbets/utils/mapping.py lines 226–303
        Add to external/api_football/__init__.py exports.
    status: done
  - id: p1e-uac-player-name
    content: |
      - [x] [AGENT] P1. Add player name normalization to UAC external/api_football/player_name.py.
        Contents:
        - get_canonical_player_name_from_api_football(player_name: str, player_id: int) -> str
          Format: LASTNAME_INITIAL (e.g. PICKFORD_J) or LASTNAME_FIRSTNAME for full names
          Handles: diacritics (unicodedata.normalize NFKD), initials, compound names
        Source: /tmp/footballbets/footballbets/utils/mapping.py lines 715–782
        Add to external/api_football/__init__.py exports.
    status: pending
  - id: p1f-uac-odds-api-team-names
    content: |
      - [x] [AGENT] P1. Add OddsAPI team name mappings to UAC external/odds_api/team_names.py.
        Contents:
        - CANONICAL_TO_ODDS_API_EPL: dict[str, str] — canonical → OddsAPI display (EPL)
        - CANONICAL_TO_ODDS_API_BUNDESLIGA: dict[str, str] — canonical → OddsAPI display
        - get_odds_api_team_name(canonical_name: str, api_football_league_id: int) -> str
        - CANONICAL_TO_UNDERSTAT_EPL: dict[str, str] — canonical → Understat name
        - CANONICAL_TO_UNDERSTAT_BUNDESLIGA: dict[str, str]
        - get_understat_team_name(canonical_name: str, league_id: str) -> str
        Source: /tmp/footballbets/footballbets/utils/mapping.py lines 513–695
        Add to external/odds_api/__init__.py exports.
    status: done

  # ============================================================================
  # PHASE 1 gate: cd unified-api-contracts && bash scripts/quality-gates.sh
  # ============================================================================

  # ============================================================================
  # PHASE 2 — instruments-service: Delete local, import UAC  [SEQUENTIAL]
  # ============================================================================
  - id: p2a-instruments-delete-local
    content: |
      - [x] [AGENT] P2. Delete instruments-service local sports implementations.
        Delete (all in instruments_service/sports/):
        - league_definition.py
        - league_classification.py
        - league_data_classification.py
        - league_data_classification_a.py
        - league_data_classification_b.py
        - league_data_prediction.py
        - league_data_other.py
        - league_lookup.py
        - team_mapping_data.py
        - team_mapping_data_bundesliga.py
        Note: Keep fixture_parser.py, team_aliases.py, team_normalizer.py, round_names.py
              as they are instruments-service-specific logic (not raw data).
              Update them to import data from UAC instead.
    status: done
  - id: p2b-instruments-update-imports
    content: |
      - [x] [AGENT] P2. Update instruments-service to import from UAC.
        Files to update (imports → from unified_api_contracts.sports import ...):
        - instruments_service/sports/__init__.py
        - instruments_service/sports/league_registry.py
        - instruments_service/sports/fixture_parser.py
        - instruments_service/sports/team_aliases.py
        - instruments_service/sports/team_normalizer.py
        - instruments_service/engine/.../sports_orchestration.py
        - instruments_service/app/core/selective_validation.py
        Also update all test files to import from UAC:
        - tests/unit/test_sports_league_registry.py
        - tests/unit/test_league_registry.py
        - tests/unit/test_sports_service.py
        - tests/unit/test_fixture_parser.py
        - tests/unit/test_round_names.py
        - tests/unit/test_team_aliases.py
        - tests/unit/test_team_normalizer.py
        - tests/unit/test_team_mapping_data.py
    status: done

  # ============================================================================
  # PHASE 2 gate: cd instruments-service && bash scripts/quality-gates.sh
  # ============================================================================

  # ============================================================================
  # PHASE 3 — USRI re-exports + deployment-service cleanup  [PARALLEL]
  # ============================================================================
  - id: p3a-usri-reexports
    content: |
      - [x] [AGENT] P3. Update USRI to re-export new UAC sports symbols.
        Add to unified_sports_reference_interface/__init__.py:
        - LeagueDefinition
        - LeagueClassificationType
        - LeagueClassification
        - LEAGUE_REGISTRY
        - get_league, get_league_by_api_football_id, get_prediction_leagues
        - get_canonical_team_name_from_api_football
        - get_canonical_stadium_name_from_api_football
        - get_canonical_player_name_from_api_football
        - get_odds_api_team_name
    status: done
  - id: p3b-deployment-cleanup
    content: |
      - [x] [AGENT] P3. Update deployment-service sports scripts to import from UAC.
        Files: deployment-service/scripts/sports/league_config.py
               deployment-service/scripts/sports/verify_league_config.py
               deployment-service/scripts/sports/update_league_config.py
        These reference LEAGUE_CLASSIFICATION from a local copy. Update to import
        LEAGUE_REGISTRY from unified_api_contracts.sports.
    status: done
  - id: p3c-gcs-migration-script
    content: |
      - [x] [AGENT] P3. Audit GCS sports data paths and write migration script.
        Check features-sports-service for bucket names and path conventions.
        Write unified-trading-pm/scripts/sports/migrate_sports_gcs_paths.sh that:
        1. Lists current objects in the sports data bucket
        2. Maps old path conventions to new canonical paths
        3. Uses gsutil -m cp to migrate (preserving old paths until verified)
        Note: /tmp/footballbets/data/ was empty (no GCS data from old system).
        If GCS bucket is empty, the script just validates the path convention.
    status: done

  # ============================================================================
  # PHASE 3 gate: cd unified-sports-reference-interface && bash scripts/quality-gates.sh
  # ============================================================================

  # ============================================================================
  # PHASE 4 — Final QG sweep across all touched repos  [PARALLEL]
  # ============================================================================
  - id: p4-qg-sweep
    content: |
      - [x] [AGENT] P4. Run quality gates across all 3 code repos:
        cd unified-api-contracts && bash scripts/quality-gates.sh
        cd instruments-service && bash scripts/quality-gates.sh
        cd unified-sports-reference-interface && bash scripts/quality-gates.sh
        All must pass. Fix any failures before marking done.
    status: done
---

# Sports Canonical Mapping & GCS Migration

## Problem Statement

Sports reference mapping data (league registry, team alias tables, stadium names, player
name normalisation, OddsAPI team names) is scattered across:

- `instruments-service/instruments_service/sports/` — 17 files, built correctly but in wrong layer
- `deployment-service/scripts/sports/` — a stale copy of league config
- `/tmp/footballbets/` — original source (EPL + Bundesliga only, 2 leagues)

None of it is in UAC where external-data normalization schemas belong. This means:

1. `features-sports-service` and all future sports consumers must re-implement or go without
2. The instruments-service leaks a service-internal dependency on raw mapping tables
3. No SSOT for "what is the canonical name for X entity from source Y"

## Canonical ID Table (definitive reference)

| Entity     | Canonical ID format                                       | Example                               | Source                                               |
| ---------- | --------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------- |
| League     | `{COUNTRY_CODE}_{LEAGUE_ABBR}`                            | `EPL`, `BUN`, `ENG_CHAMPIONSHIP`      | instruments-service/sports/league_data_prediction.py |
| Team       | SCREAMING_SNAKE_CASE                                      | `MAN_CITY`, `TOTTENHAM`, `DORTMUND`   | /tmp/footballbets/utils/mapping.py                   |
| Fixture    | `{api_football_fixture_id}` (int as str)                  | `"1034567"`                           | API Football                                         |
| Player     | `{LASTNAME}_{INITIAL}` or `{LASTNAME}_{FIRSTNAME}`        | `PICKFORD_J`, `FERNANDES_BRUNO`       | player_name.py normalization                         |
| Stadium    | SCREAMING_SNAKE_CASE                                      | `ANFIELD`, `ALLIANZ_ARENA`            | stadium_mappings.py                                  |
| Referee    | `{LASTNAME}_{INITIAL}`                                    | `ATKINSON_M`                          | Same pattern as player                               |
| Season     | `{YYYY}/{YY}`                                             | `2024/25`                             | String convention                                    |
| Instrument | `{fixture_id}::{market_type}::{outcome}::{bookmaker_key}` | `"1034567::h2h::home::betfair_ex_uk"` | UAC CanonicalOdds                                    |

## Architecture Decision

```
UAC external/api_football/
├── team_mappings.py          ← EPL + Bundesliga alias tables + API Football → canonical
├── stadium_mappings.py       ← API Football stadium name → canonical
├── player_name.py            ← get_canonical_player_name_from_api_football()
└── league_data.py            ← LEAGUE_REGISTRY dict + query functions

UAC external/odds_api/
└── team_names.py             ← canonical → OddsAPI/Understat display names

UAC canonical/domain/sports/
└── league_registry.py        ← LeagueDefinition dataclass, LeagueClassificationType enum

instruments-service/sports/
├── DELETED: league_definition.py, league_classification.py, league_data_*.py, league_lookup.py
├── DELETED: team_mapping_data.py, team_mapping_data_bundesliga.py
└── KEPT + UPDATED: fixture_parser.py, team_aliases.py, team_normalizer.py, round_names.py
```

## Pre-Audit Manifest

### Symbols being MOVED from instruments-service to UAC

| Symbol                               | From                                             | To                                          |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------------- |
| `LeagueDefinition`                   | instruments_service.sports.league_definition     | unified_api_contracts.sports                |
| `LeagueClassificationType`           | instruments_service.sports.league_classification | unified_api_contracts.sports                |
| `LeagueClassification`               | instruments_service.sports.league_classification | unified_api_contracts.sports                |
| `LEAGUE_REGISTRY`                    | instruments_service.sports.league_lookup         | unified_api_contracts.sports                |
| `get_league()`                       | instruments_service.sports.league_lookup         | unified_api_contracts.sports                |
| `get_league_by_api_football_id()`    | instruments_service.sports.league_lookup         | unified_api_contracts.sports                |
| `get_prediction_leagues()`           | instruments_service.sports.league_lookup         | unified_api_contracts.sports                |
| `get_leagues_by_classification()`    | instruments_service.sports.league_lookup         | unified_api_contracts.sports                |
| `get_leagues_by_country()`           | instruments_service.sports.league_lookup         | unified_api_contracts.sports                |
| `EPL_TEAM_MAPPINGS`                  | instruments_service.sports.team_mapping_data     | unified_api_contracts.external.api_football |
| `BUNDESLIGA_TEAM_MAPPINGS`           | instruments_service.sports.team_mapping_data     | unified_api_contracts.external.api_football |
| `API_FOOTBALL_TO_CANONICAL`          | (new)                                            | unified_api_contracts.external.api_football |
| `BETFAIR_TO_CANONICAL`               | (new)                                            | unified_api_contracts.external.api_football |
| `API_FOOTBALL_TO_CANONICAL_STADIUMS` | (new)                                            | unified_api_contracts.external.api_football |
| `CANONICAL_TO_ODDS_API_EPL/BL`       | (new)                                            | unified_api_contracts.external.odds_api     |
| `CANONICAL_TO_UNDERSTAT_EPL/BL`      | (new)                                            | unified_api_contracts.external.odds_api     |

### Files that import from instruments_service.sports (pre-audit)

| File                                                   | Symbols used                          | Action              |
| ------------------------------------------------------ | ------------------------------------- | ------------------- |
| instruments_service/sports/**init**.py                 | all                                   | Re-export from UAC  |
| instruments_service/sports/league_registry.py          | LeagueClassification, league_lookup   | Re-export from UAC  |
| instruments_service/sports/fixture_parser.py           | LeagueDefinition                      | Update import       |
| instruments_service/sports/team_aliases.py             | EPL_TEAM_MAPPINGS, BUND_TEAM_MAPPINGS | Update import       |
| instruments_service/sports/team_normalizer.py          | team_aliases                          | Stays local (logic) |
| instruments_service/engine/.../sports_orchestration.py | league_registry, team_aliases         | Update import       |
| instruments_service/app/core/selective_validation.py   | league_classification                 | Update import       |
| deployment-service/scripts/sports/league_config.py     | LEAGUE_CLASSIFICATION                 | Update import       |
| tests (8 files)                                        | various                               | Update imports      |

## Dependency DAG

```
Phase 1 (UAC additions) ─┬─ p1a: league_registry types (canonical/)
  [PARALLEL]              ├─ p1b: league_data (external/api_football/)
                          ├─ p1c: team_mappings (external/api_football/)
                          ├─ p1d: stadium_mappings (external/api_football/)
                          ├─ p1e: player_name (external/api_football/)
                          └─ p1f: odds_api team_names (external/odds_api/)
                                       │
                               UAC QG gate
                                       │
Phase 2 (instruments-service) ─┬─ p2a: delete local files
  [SEQUENTIAL]                  └─ p2b: update imports + tests
                                       │
                           instruments-service QG gate
                                       │
Phase 3 ─────────────────┬─ p3a: USRI re-exports
  [PARALLEL]              ├─ p3b: deployment-service cleanup
                          └─ p3c: GCS migration script
                                       │
                               USRI QG gate
                                       │
Phase 4 ─────────────────── p4: Full QG sweep (UAC + instruments + USRI)
```

## Success Criteria

### Phase 1

- C4: `cd unified-api-contracts && bash scripts/quality-gates.sh` → green
- All 6 new modules pass basedpyright strict mode
- LEAGUE_REGISTRY has ≥28 Prediction leagues matching league_classification_config.py

### Phase 2

- C4: `cd instruments-service && bash scripts/quality-gates.sh` → green
- 0 references to `instruments_service.sports.league_data_*` or `team_mapping_data*` remain
- All 9 test files updated and passing

### Phase 3

- USRI exports ≥10 new symbols via `from unified_api_contracts.sports import`
- GCS migration script either runs successfully or documents empty-bucket state

### Phase 4

- All 3 repos pass quality gates simultaneously
- B1: Canonical ID table in plan is accurate and serves as reference for all future development
