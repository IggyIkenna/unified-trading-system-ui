---
name: registry-completeness-implementation-detail
overview:
  Execute the UAC registry completeness refactor -- add missing instrument types, sports market granularity (BTTS
  end-to-end), BetSide/CommissionModel enums, consumer adoption across 11 repos, enum consolidation (UCI re-exports from
  UAC), and integration tests. Phase 0-1 purely additive (non-breaking). Phase 2-4 consolidation and consumer adoption.
todos:
  - id: p0-add-instrument-types
    content: |
      - [x] [AGENT] P0. Add BOND, EQUITY, ETF, COMMODITY, CURRENCY, CDS, SPOT_ASSET, YIELD_BEARING, DEBT_TOKEN, POOL, LENDING, STAKING to UAC InstrumentType in canonical/domain/reference/__init__.py. Update INSTRUMENT_TYPES_BY_VENUE, INSTRUCTION_VALID_INSTRUMENT_TYPES, INSTRUMENT_TYPE_FOLDER_MAP in venue_constants.py.
    status: done
    completion_note:
      All 12 InstrumentType values already existed. INSTRUMENT_TYPE_FOLDER_MAP updated for 7 missing types.
      INSTRUCTION_VALID_INSTRUMENT_TYPES updated.
  - id: p0-fix-databento-normalizer
    content: |
      - [x] [AGENT] P0. Fix _instrument_class_to_type in external/databento/normalize.py: add B->BOND, E->EQUITY, N->ETF, X->INDEX, C->COMMODITY. Current mapping only has F/O/S.
    status: done
    completion_note: Already had all correct mappings.
  - id: p0-fix-ibkr-normalizer
    content: |
      - [x] [AGENT] P0. Fix _ibkr_instrument_type in external/ibkr/normalize.py (lines 111-125): STK->EQUITY, CASH->CURRENCY, IND->INDEX, FUND->ETF, CMDTY->COMMODITY, BOND->BOND. Also fix type_map in normalize_ibkr_market_state (line 353).
    status: done
    completion_note: Already correct; fixed FUND->ETF in normalize_ibkr_market_state type_map.
  - id: p0-add-odds-types
    content: |
      - [x] [AGENT] P1. Add 8 new OddsType values to canonical/domain/sports/odds.py: HALF_TIME_RESULT, FIRST_HALF_OVER_UNDER, CORNERS, CARDS, PLAYER_PROPS, DRAW_NO_BET, DOUBLE_CHANCE, GOAL_SCORER. Remove duplicate OddsType class from sports/__init__.py (line 347).
    status: done
    completion_note: All 8 already existed. No duplicate class found.
  - id: p0-create-betside-enum
    content: |
      - [x] [AGENT] P1. Create BetSide StrEnum (BACK, LAY) and CommissionModel StrEnum (NET_WINNINGS_PCT, BUILT_INTO_ODDS, NOTIONAL_PCT, FLAT_FEE) in betting.py. Export from sports/__init__.py and sports.py facade.
    status: done
    completion_note: BetSide + CommissionModel already existed in betting.py.
  - id: p0-type-commission-model
    content: |
      - [x] [AGENT] P1. Change VenueExecutionProfile.commission_model from str|None to CommissionModel|None in venue_execution.py (line 163). Verify all venue_execution_registry.py entries auto-coerce.
    status: done
    completion_note: Already used CommissionModel type.
  - id: p0-extend-odds-api-markets
    content: |
      - [x] [AGENT] P1. Create external/odds_api/_market_keys.py with OddsType-to-market-key mapping. Extend UMI adapter get_markets (line 116) and get_prices (line 167) to request btts,draw_no_bet,double_chance alongside existing markets.
    status: done
    completion_note: _market_keys.py already existed.
  - id: p0-btts-normalization
    content: |
      - [x] [AGENT] P1. Add _MARKET_KEY_MAP dict in external/odds_api/normalize.py mapping "btts"->BOTH_TEAMS_SCORE, "draw_no_bet"->DRAW_NO_BET, etc. Handle Yes/No outcome mapping for BTTS.
    status: done
    completion_note: Added _BTTS_OUTCOME_MAP + normalize_btts_outcomes(). Cassette fixed.
  - id: p0-sports-venues-instrument-types
    content: |
      - [x] [AGENT] P1. Add sports venues to INSTRUMENT_TYPES_BY_VENUE: SPORTS_EXCHANGE_VENUES->EXCHANGE_ODDS, PREDICTION_MARKET_VENUES->PREDICTION_MARKET, BOOKMAKER_API_VENUES->FIXED_ODDS, BOOKMAKER_WEB_VENUES->FIXED_ODDS, DFS_VENUES->PROP.
    status: done
    completion_note: Already mapped in venue_constants.py.
  - id: p0-supported-market-types
    content: |
      - [x] [AGENT] P2. Add SUPPORTED_MARKET_TYPES dict in venue_constants.py mapping each sports venue to its supported frozenset[OddsType]. Betfair/Pinnacle: full set incl BTTS. Smarkets/Betdaq: H2H/OU/AH/CS only. Matchbook: H2H/OU/AH only.
    status: done
    completion_note: Added SUPPORTED_MARKET_TYPES covering all 78 venues.
  - id: p0-add-missing-venues-manifest
    content: |
      - [x] [AGENT] P2. Add VenueContract entries in registry/venue_manifest/betting_sports.py for: smarkets, matchbook, betdaq, manifold, onexbet, novig, betopenly, prophetx.
    status: done
    completion_note: Added 16 VenueContract entries for scraper+aggregator venues.
  - id: p0-update-fixture-example
    content: |
      - [x] [AGENT] P2. Add BTTS market example to external/odds_api/examples/fixture_example.json. Add draw_no_bet and double_chance examples too.
    status: done
    completion_note: Cassette updated with camelCase keys.
  - id: p0-odds-api-v3-v4-registry
    content: |
      - [x] [AGENT] P1. Update odds_api EndpointSpec in _endpoint_registry_data.py: single v4 endpoint with available_from_date=2018-01-01 and data fidelity warning (pre-2023 = v3 era: h2h/spreads/totals only, ~10min intervals; post-2023 = v4 era: full market coverage, ~5min intervals). Update provider_api_versions.yaml with v3_era_cutoff, per-era markets and intervals.
    status: done
  - id: p1-vcr-cassettes
    content: |
      - [x] [AGENT] P1. Record 4 pending VCR cassettes (polymarket gamma_events, gamma_tags, prices_history; coinbase products). Update cassette_status from PENDING to RECORDED.
    status: done
    completion_note: Coinbase Exchange cassette created; Polymarket cassettes pre-existing and RECORDED.
  - id: p1-btts-cassette
    content: |
      - [x] [AGENT] P2. Add BTTS mock cassette for odds_api: external/odds_api/mocks/btts_soccer_epl_cassette.json with realistic Yes/No outcomes.
    status: done
    completion_note: Cassette exists and updated.
  - id: p1-registry-consumer-tests
    content: |
      - [x] [AGENT] P1. Create unified-api-contracts/tests/integration/test_registry_consumer_contracts.py. Tests: CLOB/DEX/ZERO_ALPHA covered in INSTRUMENT_TYPES_BY_VENUE; SPORTS_VENUES covered; BETTING_SPORTS_VENUES have constants.
    status: done
    completion_note: test_registry_completeness.py + test_registry_completeness_p1.py created (55+ tests).
  - id: p1-btts-field-mapping
    content: |
      - [x] [AGENT] P2. Add dedicated BTTS field mapping in market-tick-data-service (replace H2H fallback). Add btts_yes_odds, btts_no_odds fields.
    status: done
    completion_note:
      odds_compat bridge for BTTS added in unified-sports-execution-interface; market-tick-data-service already had
      _BTTS_FIELDS.
  - id: p2-enum-consolidation-uac
    content: |
      - [x] [AGENT] P0. Ensure UAC InstrumentType is superset of UCI InstrumentType (instrument.py lines 67-94). Add PERP as deprecated alias. Add alignment CI test.
    status: done
    completion_note: UAC already superset. PERP alias exists.
  - id: p2-uci-reexport
    content: |
      - [x] [AGENT] P0. Replace UCI InstrumentType class (instrument.py lines 67-94) with re-export from UAC. Verify unified-api-contracts is in UCI pyproject.toml. Search for InstrumentType.PERP usage first.
    status: done
    completion_note: UCI InstrumentType replaced with re-export from UAC.
  - id: p2-uic-tardis-consolidation
    content: |
      - [x] [AGENT] P1. Replace hardcoded _VENUE_TO_TARDIS in UIC instrument_key.py (lines 17-26) with inverted UCI VenueMapping.tardis_to_venue.
    status: done
    completion_note: _VENUE_TO_TARDIS replaced with computed version from VenueMapping.
  - id: p2-alignment-tests
    content: |
      - [x] [AGENT] P1. Create system-integration-tests/tests/test_registry_alignment.py. Tests: UCI.InstrumentType subset of UAC; UIC._VENUE_TO_TARDIS keys subset of UCI.Venue; exec-service venue sets subset of UAC.
    status: done
    completion_note: test_registry_alignment.py created in SIT (4 tests).
  - id: p3-exec-service-adopt
    content: |
      - [x] [AGENT] P0. Replace execution-service local CLOB_VENUES/DEX_VENUES/ZERO_ALPHA_VENUES (instruction_type.py lines 47-108) with UAC imports + local alias unions. Keep exec-specific aliases (BINANCE, WALLET, etc.) as union sets.
    status: done
    completion_note: Local CLOB/DEX/ZERO_ALPHA venues replaced with UAC imports.
  - id: p3-instruments-service-adopt
    content: |
      - [x] [AGENT] P1. instruments-service adopts INSTRUMENT_TYPES_BY_VENUE from UAC for venue-to-instrument-type logic.
    status: done
    completion_note: Already adopted INSTRUMENT_TYPES_BY_VENUE from UAC.
  - id: p3-market-data-api-adopt
    content: |
      - [x] [AGENT] P2. Add unified-api-contracts to market-data-api pyproject.toml. Add venue name validation in API routes against VENUE_CATEGORY_MAP.
    status: done
    completion_note:
      UAC already in pyproject.toml. orderbook.py imports VENUE_CATEGORY_MAP, validates venue names via
      is_known_venue(). /venues and /venues/{venue}/validate endpoints added. Unit + integration tests exist.
  - id: p3-umi-adopt-registry
    content: |
      - [x] [AGENT] P1. UMI sports/registry.py: keep _ADAPTER_PATHS but validate keys against UAC BETTING_SPORTS_VENUES at import time.
    status: done
    completion_note: Upgraded validation from warning to ValueError.
  - id: p3-utei-venue-validation
    content: |
      - [x] [AGENT] P2. UTEI: add venue validation in adapter factory using CLOB_VENUES|DEX_VENUES from UAC.
    status: done
    completion_note: Added venue validation in factory using UAC imports.
  - id: p3-fix-hardcoded-back
    content: |
      - [x] [AGENT] P1. Fix normalize_sports_order in normalize_utils/sports.py (line 59): replace side="back" with BetSide enum. Derive side from venue type (EXCHANGE->configurable, BOOKMAKER->always BACK).
    status: done
    completion_note: normalize_sports_order already uses BetSide enum.
  - id: p4-usri-scope
    content: |
      - [x] [AGENT] P2. Clarify USRI scope: add UAC sports type re-exports in USRI __init__.py.
    status: done
    completion_note:
      USRI __init__.py already re-exports 35 UAC sports types including OddsType, BetSide, CommissionModel,
      BetExecution, BetOrder, BettingSignal, CanonicalBookmakerMarket, CLVRecord, LiveMatchState, LiveOddsUpdate, etc.
      Unit tests verify importability; integration tests verify identity with UAC originals.
  - id: p4-provider-versions-cleanup
    content: |
      - [x] [AGENT] P2. Audit 53 yellow providers in provider_api_versions.yaml. If schemas+cassettes exist -> green. If schemas but no cassette -> pending_cassette. If no schemas -> dormant.
    status: done
    completion_note:
      28 yellow providers remain (others already promoted to green by earlier work). All 28 have schemas.py but no VCR
      cassettes -- correctly classified as yellow with cassette_status=pending. 3 dormant providers (macro, onchain,
      sentiment) have no schemas.py -- correctly dormant. No providers qualify for promotion to green (none have
      recorded cassettes). Test suite in test_registry_completeness_p2.py validates YAML structure, status values, and
      consistency rules.
  - id: p4-sports-aggregator-classification
    content: |
      - [x] [AGENT] P2. Add SportsAggregatorType StrEnum and VENUE_AGGREGATOR_TYPE mapping in venue_constants.py: DIRECT_EXECUTION, ODDS_AGGREGATOR, EXECUTION_AGGREGATOR, POSITION_AGGREGATOR.
    status: done
    completion_note:
      SportsAggregatorType StrEnum exists in _sports_venue_constants.py with all 4 members. VENUE_AGGREGATOR_TYPE maps
      odds aggregators (odds_api, opticodds, oddsjam, sharpapi, metabet, odds_engine) and direct execution venues
      (exchanges, bookmaker APIs, prediction markets). Exported from registry/__init__.py. Tests in
      test_registry_completeness_p2.py verify enum membership, values, and mapping coverage.
isProject: false
---

# Registry Completeness Refactor — Implementation Detail

## Related Documents

- Architectural decisions: `.cursor/plans/registry_completeness_refactor_6ecf4abc.md` (scope, decision framework,
  separation of concerns)
- UAC Citadel execution plan: `.cursor/plans/uac_citadel_implementation_execution.md` (completed — facade pattern,
  per-source normalization)

## Context

The UAC registry has comprehensive provider coverage (79 provider dirs, 240+ endpoint mappings) but **zero consumer
repos import from it**. Every consumer (execution-service, instruments-service, UMI, UTEI) hardcodes venue data or uses
UCI's overlapping definitions. Additionally, the registry is missing TradFi instrument types, sports market granularity
(BTTS is in the enum but not wired through adapters), and type-safe enums for BetSide/CommissionModel. This plan
completes the registry, wires BTTS end-to-end, and migrates all consumers to the single source of truth.

**BTTS / Odds API Finding**: `OddsType.BOTH_TEAMS_SCORE` already exists in the enum. The Odds API v4 supports `btts` as
a market key for soccer events. However, the UMI adapter is hardcoded to `"h2h"` only (line 116) /
`"h2h,spreads,totals"` (line 167). OddsJam and OpticOdds also support BTTS. The market-tick-data-service falls back to
H2H fields for BTTS (no dedicated mapping).

**Odds API Data Fidelity (v3/v4 eras)**: The Odds API is a live-capture service — all queries use the v4 endpoint, but
historical data fidelity is bounded by what was actually collected at the time. Pre-2023 data was captured under v3
constraints (h2h/spreads/totals only, ~10min polling intervals). Post-2023 data has full v4 market coverage (btts,
draw_no_bet, double_chance, player_props) at ~5min intervals. Querying BTTS for a pre-2023 event will return empty — the
data was never captured. This is tracked in `provider_api_versions.yaml` (`v3_era_cutoff`, `v3_era_markets`,
`v3_era_interval_minutes`) and `_endpoint_registry_data.py` (notes field).

---

## Phases Overview + Sizing

| Phase | Description                                   | Todos | Size | Effort                                 | Risk       |
| ----- | --------------------------------------------- | ----- | ---- | -------------------------------------- | ---------- |
| 0     | UAC Schema Additions (non-breaking, UAC-only) | 13    | L    | ~15 files modified, ~300 lines added   | Low        |
| 1     | VCR + Tests (UAC + MTDS)                      | 4     | M    | 4 cassettes + 2 new test files         | Low        |
| 2     | Enum Consolidation (UAC + UCI + UIC)          | 4     | M    | Cross-repo enum alignment, 3 repos     | **Medium** |
| 3     | Consumer Adoption (multi-repo, sequential)    | 6     | L    | 6 consumer repos adopt UAC registry    | Medium     |
| 4     | Cleanup (multi-repo)                          | 3     | S    | USRI scope + provider audit + classify | Low        |

**Critical path**: p0-add-instrument-types → p0-fix-databento/ibkr (parallel) → p2-enum-consolidation → p2-uci-reexport
→ p2-alignment-tests → p3-exec-service-adopt. **Total: 30 todos. Completion = QG pass per repo. No quickmerge unless
explicitly requested.**

---

## Phase 0: UAC Schema Additions (Non-Breaking, UAC-Only)

### p0-add-instrument-types

**File**: `unified-api-contracts/unified_api_contracts/canonical/domain/reference/__init__.py` (lines 10-17)

**Current** (7 values):

```python
class InstrumentType(StrEnum):
    SPOT_PAIR = "SPOT_PAIR"
    PERPETUAL = "PERPETUAL"
    FUTURE = "FUTURE"
    OPTION = "OPTION"
    LST = "LST"
    A_TOKEN = "A_TOKEN"
    INDEX = "INDEX"
```

**After** (add 12 values for TradFi + UCI parity + DeFi coverage):

```python
class InstrumentType(StrEnum):
    SPOT_PAIR = "SPOT_PAIR"
    PERPETUAL = "PERPETUAL"
    FUTURE = "FUTURE"
    OPTION = "OPTION"
    LST = "LST"
    A_TOKEN = "A_TOKEN"
    INDEX = "INDEX"
    # TradFi
    BOND = "BOND"
    EQUITY = "EQUITY"
    ETF = "ETF"
    COMMODITY = "COMMODITY"
    CURRENCY = "CURRENCY"
    CDS = "CDS"
    # UCI parity
    SPOT_ASSET = "SPOT_ASSET"
    YIELD_BEARING = "YIELD_BEARING"
    DEBT_TOKEN = "DEBT_TOKEN"
    POOL = "POOL"
    LENDING = "LENDING"
    STAKING = "STAKING"
```

**Also modify** `unified-api-contracts/unified_api_contracts/registry/venue_constants.py`:

- `INSTRUMENT_TYPES_BY_VENUE`: Add BOND for CME/CBOT, COMMODITY for NYMEX/COMEX/ICE, EQUITY for
  NASDAQ/NYSE/CBOE/XNAS/XNYS, ETF for NASDAQ/NYSE
- `INSTRUCTION_VALID_INSTRUMENT_TYPES`: Add `"BOND"` and `"COMMODITY"` to the `"TRADE"` set
- `INSTRUMENT_TYPE_FOLDER_MAP`: Add `"BOND": "bonds"`, `"COMMODITY": "commodities"`, `"CURRENCY": "currencies"`,
  `"CDS": "cds"`, `"LENDING": "lending"`, `"STAKING": "staking"`

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

**Smoke test**:

```bash
cd unified-api-contracts && .venv/bin/python -c "
from unified_api_contracts.reference import InstrumentType
for t in ('BOND','EQUITY','ETF','COMMODITY','CURRENCY','CDS','POOL','LENDING','STAKING'):
    assert hasattr(InstrumentType, t), f'Missing: {t}'
print('PASSED')
"
```

---

### p0-fix-databento-normalizer

**Blocked by**: p0-add-instrument-types

**File**: `unified-api-contracts/unified_api_contracts/external/databento/normalize.py` (lines 62-66)

**Current**:

```python
m = {"F": InstrumentType.FUTURE, "O": InstrumentType.OPTION, "S": InstrumentType.SPOT_PAIR}
```

**After**:

```python
m = {
    "F": InstrumentType.FUTURE,
    "O": InstrumentType.OPTION,
    "S": InstrumentType.SPOT_PAIR,
    "B": InstrumentType.BOND,
    "E": InstrumentType.EQUITY,
    "N": InstrumentType.ETF,
    "X": InstrumentType.INDEX,
    "C": InstrumentType.COMMODITY,
}
```

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p0-fix-ibkr-normalizer

**Blocked by**: p0-add-instrument-types

**File**: `unified-api-contracts/unified_api_contracts/external/ibkr/normalize.py`

**ibkr_instrument_type** (lines 111-125) — change:

| secType   | Current | After     |
| --------- | ------- | --------- |
| STK       | SPOT    | EQUITY    |
| CASH      | SPOT    | CURRENCY  |
| CFD       | SPOT    | SPOT_PAIR |
| IND       | SPOT    | INDEX     |
| FUND      | SPOT    | ETF       |
| CMDTY     | SPOT    | COMMODITY |
| BOND      | SPOT    | BOND      |
| (default) | SPOT    | SPOT_PAIR |

Also add `"FOP": "OPTION"` (futures options).

**normalize_ibkr_market_state type_map** (line 353):

```python
# Current:
type_map = {"STK": "SPOT", "FUT": "FUTURE", "OPT": "OPTION", "CASH": "SPOT"}
# After:
type_map = {"STK": "EQUITY", "FUT": "FUTURE", "OPT": "OPTION", "CASH": "CURRENCY", "IND": "INDEX", "CMDTY": "COMMODITY", "BOND": "BOND"}
```

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p0-add-odds-types

**File**: `unified-api-contracts/unified_api_contracts/canonical/domain/sports/odds.py` (lines 17-25)

**Add after line 25** (OUTRIGHT):

```python
    HALF_TIME_RESULT = "half_time_result"
    FIRST_HALF_OVER_UNDER = "first_half_over_under"
    CORNERS = "corners"
    CARDS = "cards"
    PLAYER_PROPS = "player_props"
    DRAW_NO_BET = "draw_no_bet"
    DOUBLE_CHANCE = "double_chance"
    GOAL_SCORER = "goal_scorer"
```

**CRITICAL**: OddsType is defined in TWO places:

1. `canonical/domain/sports/odds.py` (lines 17-25) — the canonical definition
2. `canonical/domain/sports/__init__.py` (lines 347-355) — a DUPLICATE

**Fix**: Remove the duplicate class from `__init__.py` (lines 347-355). The `__init__.py` already imports from `.odds`
at line 22 (`from .odds import OddsType, OutcomeType`), so the duplicate at line 347 can be safely deleted. Verify no
circular import results.

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p0-create-betside-enum

**File**: `unified-api-contracts/unified_api_contracts/canonical/domain/sports/betting.py`

**Add after line 27** (after BetStatus class):

```python
class BetSide(StrEnum):
    """Side of a bet: back (for outcome) or lay (against outcome)."""
    BACK = "back"
    LAY = "lay"


class CommissionModel(StrEnum):
    """Fee model for a sports venue."""
    NET_WINNINGS_PCT = "net_winnings_pct"
    BUILT_INTO_ODDS = "built_into_odds"
    NOTIONAL_PCT = "notional_pct"
    FLAT_FEE = "flat_fee"
```

**Also update**:

- `canonical/domain/sports/__init__.py`: Add `BetSide, CommissionModel` to imports from `.betting`
- `unified_api_contracts/sports.py` (root facade): Add `BetSide, CommissionModel` to `__all__` and re-exports

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p0-type-commission-model

**Blocked by**: p0-create-betside-enum

**File**: `unified-api-contracts/unified_api_contracts/canonical/domain/sports/venue_execution.py` (line 163)

**Current**: `commission_model: str | None = None` **After**: `commission_model: CommissionModel | None = None` (import
from `.betting`)

CommissionModel is a StrEnum so existing string values in `venue_execution_registry.py` will auto-coerce. Verify all
entries use valid enum values.

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p0-extend-odds-api-markets

**Blocked by**: p0-add-odds-types

**Step 1 — UAC side**: Create `unified-api-contracts/unified_api_contracts/external/odds_api/_market_keys.py`:

```python
"""Odds API v4 market key <-> OddsType mapping.

Ref: https://the-odds-api.com/liveapi/guides/v4/
The Odds API v4 supports: h2h, spreads, totals, outrights, btts, draw_no_bet,
double_chance, player_pass_tds (and other player props).

NOTE: v3 is deprecated and no longer serves data. All market keys below are v4 only.
btts, draw_no_bet, double_chance were added in v4 — no historical data from v3 era.
"""
from ...canonical.domain.sports.odds import OddsType

ODDS_API_MARKET_KEYS: dict[OddsType, str] = {
    OddsType.H2H: "h2h",
    OddsType.OVER_UNDER: "totals",
    OddsType.ASIAN_HANDICAP: "spreads",
    OddsType.BOTH_TEAMS_SCORE: "btts",
    OddsType.CORRECT_SCORE: "correct_score",
    OddsType.OUTRIGHT: "outrights",
    OddsType.DRAW_NO_BET: "draw_no_bet",
    OddsType.DOUBLE_CHANCE: "double_chance",
    OddsType.PLAYER_PROPS: "player_pass_tds",
}

ALL_SOCCER_MARKETS = ",".join([
    "h2h", "spreads", "totals", "btts", "draw_no_bet", "double_chance",
])
DEFAULT_MARKETS = "h2h,spreads,totals"
```

**Step 2 — UMI side**: `unified-market-interface/unified_market_interface/adapters/sports/odds_api_adapter.py`

Line 116 (`get_markets`):

```python
# Current: "markets": "h2h",
# After:   "markets": "h2h,btts,draw_no_bet,double_chance",
```

Line 167 (`get_prices`):

```python
# Current: "markets": "h2h,spreads,totals",
# After:   "markets": "h2h,spreads,totals,btts,draw_no_bet,double_chance",
```

**Note**: The Odds API charges per-request regardless of markets requested — adding markets doesn't increase API cost.

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh` then
`cd unified-market-interface && bash scripts/quality-gates.sh`

---

### p0-btts-normalization

**Blocked by**: p0-extend-odds-api-markets

**File**: `unified-api-contracts/unified_api_contracts/external/odds_api/normalize.py`

Add `_MARKET_KEY_MAP` dict:

```python
_MARKET_KEY_MAP: dict[str, OddsType] = {
    "h2h": OddsType.H2H,
    "spreads": OddsType.ASIAN_HANDICAP,
    "totals": OddsType.OVER_UNDER,
    "btts": OddsType.BOTH_TEAMS_SCORE,
    "draw_no_bet": OddsType.DRAW_NO_BET,
    "double_chance": OddsType.DOUBLE_CHANCE,
    "outrights": OddsType.OUTRIGHT,
    "correct_score": OddsType.CORRECT_SCORE,
}
```

When `market.key == "btts"`, normalize to `OddsType.BOTH_TEAMS_SCORE` with outcomes mapped to `OutcomeType.YES` /
`OutcomeType.NO`. The Odds API returns BTTS outcomes as `{"name": "Yes", "price": 1.83}` and
`{"name": "No", "price": 1.91}`.

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p0-sports-venues-instrument-types

**File**: `unified-api-contracts/unified_api_contracts/registry/venue_constants.py`

After existing INSTRUMENT_TYPES_BY_VENUE entries, add:

```python
# Sports venue instrument types
INSTRUMENT_TYPES_BY_VENUE.update(dict.fromkeys(SPORTS_EXCHANGE_VENUES, {"EXCHANGE_ODDS"}))
INSTRUMENT_TYPES_BY_VENUE.update(dict.fromkeys(SPORTS_PREDICTION_MARKET_VENUES, {"PREDICTION_MARKET"}))
INSTRUMENT_TYPES_BY_VENUE.update(dict.fromkeys(SPORTS_BOOKMAKER_API_VENUES, {"FIXED_ODDS"}))
INSTRUMENT_TYPES_BY_VENUE.update(dict.fromkeys(SPORTS_BOOKMAKER_WEB_VENUES, {"FIXED_ODDS"}))
INSTRUMENT_TYPES_BY_VENUE.update(dict.fromkeys(SPORTS_DFS_VENUES, {"PROP"}))
```

Also add to INSTRUMENT_TYPE_FOLDER_MAP: `"EXCHANGE_ODDS": "exchange_odds"`, `"FIXED_ODDS": "fixed_odds"`,
`"PREDICTION_MARKET": "prediction_markets"`, `"PROP": "props"`.

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p0-supported-market-types-per-venue

**Blocked by**: p0-add-odds-types

**File**: `unified-api-contracts/unified_api_contracts/registry/venue_constants.py`

Add:

```python
SUPPORTED_MARKET_TYPES: dict[str, frozenset[OddsType]] = {
    BETFAIR: frozenset({OddsType.H2H, OddsType.OVER_UNDER, OddsType.ASIAN_HANDICAP,
                        OddsType.CORRECT_SCORE, OddsType.BOTH_TEAMS_SCORE,
                        OddsType.PLAYER_PROPS, OddsType.CORNERS, OddsType.CARDS}),
    SMARKETS: frozenset({OddsType.H2H, OddsType.OVER_UNDER, OddsType.ASIAN_HANDICAP,
                         OddsType.CORRECT_SCORE}),
    MATCHBOOK: frozenset({OddsType.H2H, OddsType.OVER_UNDER, OddsType.ASIAN_HANDICAP}),
    BETDAQ: frozenset({OddsType.H2H, OddsType.OVER_UNDER, OddsType.ASIAN_HANDICAP,
                       OddsType.CORRECT_SCORE}),
    PINNACLE: frozenset({OddsType.H2H, OddsType.OVER_UNDER, OddsType.ASIAN_HANDICAP,
                         OddsType.CORRECT_SCORE, OddsType.BOTH_TEAMS_SCORE,
                         OddsType.PLAYER_PROPS, OddsType.CORNERS, OddsType.CARDS}),
}
```

Import `OddsType` from `..canonical.domain.sports.odds`.

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p0-add-missing-venues-manifest

**File**: `unified-api-contracts/unified_api_contracts/registry/venue_manifest/betting_sports.py`

Add 8 VenueContract entries:

| Venue     | has_rest | has_websocket | has_fix | Notes          |
| --------- | -------- | ------------- | ------- | -------------- |
| smarkets  | Y        | Y             | N       | REST+streaming |
| matchbook | Y        | N             | N       | REST only      |
| betdaq    | Y        | N             | N       | REST only      |
| manifold  | Y        | N             | N       | REST only      |
| onexbet   | Y        | N             | N       | REST only      |
| novig     | Y        | N             | N       | REST only      |
| betopenly | Y        | N             | N       | REST only      |
| prophetx  | Y        | N             | N       | REST only      |

Copy structure from existing betfair/pinnacle entries.

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p0-update-fixture-example

**Blocked by**: p0-btts-normalization

**File**: `unified-api-contracts/unified_api_contracts/external/odds_api/examples/fixture_example.json`

Add BTTS market to Pinnacle bookmaker markets array:

```json
{
  "key": "btts",
  "lastUpdate": "2025-02-27T12:00:00Z",
  "outcomes": [
    { "name": "Yes", "price": 1.83 },
    { "name": "No", "price": 1.91 }
  ]
}
```

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p0-odds-api-v3-v4-registry — DONE

**Status**: Completed. Changes committed to UAC.

**Key insight**: The Odds API is a live-capture service. All queries use the v4 endpoint, but historical data fidelity
is bounded by what was actually collected at the time. There is ONE endpoint, not two — the v3/v4 distinction describes
the data era, not which endpoint to call.

**Files modified**:

1. `unified-api-contracts/unified_api_contracts/registry/_endpoint_registry_data.py` (lines 676-715)
2. `unified-api-contracts/unified_api_contracts/config/provider_api_versions.yaml` (lines 330-348)

**What was done**:

- Single v4 EndpointSpec with `available_from_date="2018-01-01"` and `data_availability=BOTH`
- Detailed data fidelity warning in `notes` explaining the two eras:
  - **Pre-2023 (v3 era)**: h2h/spreads/totals only, ~10min polling intervals
  - **Post-2023 (v4 era)**: full market coverage (btts, draw_no_bet, etc.), ~5min intervals
- `provider_api_versions.yaml` now has `v3_era_cutoff`, per-era market lists, per-era interval minutes
- Consumers can check `v3_era_cutoff` to avoid querying markets/intervals that don't exist for the time range

---

## Phase 1: VCR + Tests

### p1-vcr-cassettes

4 PENDING cassettes (all public, no auth needed):

1. Polymarket gamma_events — `https://gamma-api.polymarket.com/events`
2. Polymarket gamma_tags — `https://gamma-api.polymarket.com/tags`
3. Polymarket prices_history — `https://gamma-api.polymarket.com/prices/history`
4. Coinbase products — `https://api.coinbase.com/api/v3/brokerage/products`

**Agent instruction**: `curl` each endpoint, save response to `external/{provider}/mocks/` as
`{endpoint}_cassette.json`, update `_endpoint_registry_data.py` `cassette_status` from `PENDING` to `RECORDED`.

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p1-btts-cassette

**Blocked by**: p0-btts-normalization

Create `external/odds_api/mocks/btts_soccer_epl_cassette.json` with realistic BTTS response (soccer_epl sport, 2-3
events, 3-4 bookmakers each, btts market outcomes `Yes`/`No`).

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p1-registry-consumer-tests

**Blocked by**: p0-sports-venues-instrument-types

**File to create**: `unified-api-contracts/tests/integration/test_registry_consumer_contracts.py`

Tests:

1. Every venue in `CLOB_VENUES | DEX_VENUES | ZERO_ALPHA_VENUES` has an `INSTRUMENT_TYPES_BY_VENUE` entry
2. Every venue in `VENUE_CATEGORY_MAP` has a `VENUE_CAPABILITIES` entry
3. All `SPORTS_VENUES` are in `INSTRUMENT_TYPES_BY_VENUE`
4. Every key in `BETTING_SPORTS_VENUES` dict has a matching constant in `venue_constants.py`
5. OddsType values cover all market keys used in `ODDS_API_MARKET_KEYS`

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p1-btts-field-mapping

**Blocked by**: p0-btts-normalization

Currently `OddsType.BOTH_TEAMS_SCORE` falls back to H2H fields in
`market-tick-data-service/tests/unit/test_coverage_boost_mtds_26.py` (lines 86-93). Add proper field mapping with
`btts_yes_odds`, `btts_no_odds` fields.

**Verification**: `cd market-tick-data-service && bash scripts/quality-gates.sh`

---

## Phase 2: Enum Consolidation (UAC + UCI + UIC)

### p2-enum-consolidation-uac

**Blocked by**: p0-add-instrument-types

After p0-add-instrument-types, UAC will have BOND, EQUITY, ETF, etc. This step verifies full parity with UCI
(`unified-config-interface/unified_config_interface/instrument.py` lines 67-94).

UCI has `PERP = "PERP"` — alias for PERPETUAL but different string value. **Decision**: Add as deprecated alias in UAC.
Document in codex.

Add alignment CI test:

```python
# tests/integration/test_uci_alignment.py
def test_instrument_type_parity():
    from unified_api_contracts.reference import InstrumentType as UAC_IT
    from unified_config_interface.instrument import InstrumentType as UCI_IT
    uac_names = set(UAC_IT.__members__)
    uci_names = set(UCI_IT.__members__)
    missing = uci_names - uac_names
    assert not missing, f"UCI has InstrumentType values not in UAC: {missing}"
```

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p2-uci-reexport

**Blocked by**: p2-enum-consolidation-uac

**File**: `unified-config-interface/unified_config_interface/instrument.py` (lines 67-94)

Replace the local `InstrumentType` class definition with:

```python
from unified_api_contracts.reference import InstrumentType  # UAC owns canonical definition
```

**Pre-check**: Verify `unified-api-contracts` is in UCI's `pyproject.toml` dependencies. Search for
`InstrumentType.PERP` usage across all repos before proceeding. If found, add `PERP` to UAC as an alias first.

**Verification**: `cd unified-config-interface && bash scripts/quality-gates.sh`

---

### p2-uic-tardis-consolidation

**Blocked by**: p2-uci-reexport

**File**: `unified-internal-contracts/unified_internal_contracts/reference/instrument_key.py` (lines 17-26)

Replace hardcoded `_VENUE_TO_TARDIS` (8 mappings) with:

```python
from unified_config_interface.venue_config import VenueMapping
_VENUE_TO_TARDIS = {v: k for k, v in VenueMapping.tardis_to_venue.items()}
```

**Verification**: `cd unified-internal-contracts && bash scripts/quality-gates.sh`

---

### p2-alignment-tests

**Blocked by**: p2-uci-reexport

**File to create**: `system-integration-tests/tests/test_registry_alignment.py`

Tests:

1. `UCI.InstrumentType` values subset of `UAC.InstrumentType`
2. `UIC._VENUE_TO_TARDIS` keys subset of UCI Venue values
3. execution-service `CLOB_VENUES` subset of `UAC CLOB_VENUES` (union with exec aliases)
4. execution-service `DEX_VENUES` subset of `UAC DEX_VENUES`
5. execution-service `ZERO_ALPHA_VENUES` subset of `UAC ZERO_ALPHA_VENUES`

**Verification**: `cd system-integration-tests && bash scripts/quality-gates.sh`

---

## Phase 3: Consumer Adoption (Multi-Repo, Sequential)

### p3-exec-service-adopt

**Blocked by**: p2-alignment-tests

**File**: `execution-service/execution_service/utils/instruction_type.py` (lines 47-108)

Replace local sets with UAC imports + local alias unions:

```python
from unified_api_contracts.registry.venue_constants import (
    CLOB_VENUES as _UAC_CLOB,
    DEX_VENUES as _UAC_DEX,
    ZERO_ALPHA_VENUES as _UAC_ZERO,
)

_EXEC_CLOB_ALIASES: frozenset[str] = frozenset({"BINANCE", "COINBASE", "UPBIT"})
_EXEC_DEX_ALIASES: frozenset[str] = frozenset({
    "UNISWAPV2", "UNISWAPV3", "UNISWAPV4",
    "UNISWAP_V2", "UNISWAP_V3", "UNISWAP_V4",
    "BALANCER", "BALANCER-ETH", "CURVE",
})
_EXEC_ZERO_ALIASES: frozenset[str] = frozenset({"AAVE", "MORPHO", "EULER", "FLUID", "WALLET"})

CLOB_VENUES = _UAC_CLOB | _EXEC_CLOB_ALIASES
DEX_VENUES = _UAC_DEX | _EXEC_DEX_ALIASES
ZERO_ALPHA_VENUES = _UAC_ZERO | _EXEC_ZERO_ALIASES
```

**Verification**: `cd execution-service && bash scripts/quality-gates.sh`

**Smoke test**:

```bash
cd execution-service && .venv/bin/python -c "
from execution_service.utils.instruction_type import CLOB_VENUES, DEX_VENUES, ZERO_ALPHA_VENUES
assert 'BINANCE-SPOT' in CLOB_VENUES  # from UAC
assert 'BINANCE' in CLOB_VENUES       # exec alias
assert 'HYPERLIQUID' in CLOB_VENUES   # from UAC
assert 'WALLET' in ZERO_ALPHA_VENUES  # exec alias
print('PASSED')
"
```

---

### p3-instruments-service-adopt

**Blocked by**: p2-alignment-tests

Replace any implicit venue-to-instrument-type logic in instruments-service adapters with explicit
`INSTRUMENT_TYPES_BY_VENUE` lookups from UAC.

**Verification**: `cd instruments-service && bash scripts/quality-gates.sh`

---

### p3-market-data-api-adopt

**Blocked by**: p2-alignment-tests

Add `unified-api-contracts` to `market-data-api/pyproject.toml` dependencies. Add venue name validation in API routes
against UAC `VENUE_CATEGORY_MAP`.

**Verification**: `cd market-data-api && bash scripts/quality-gates.sh`

---

### p3-umi-adopt-registry

**Blocked by**: p2-alignment-tests

**File**: `unified-market-interface/unified_market_interface/sports/registry.py` (lines 21-49)

Keep `_ADAPTER_PATHS` dict. Add startup validation:

```python
from unified_api_contracts.registry.venue_manifest.betting_sports import BETTING_SPORTS_VENUES

_KNOWN_VENUES = set(BETTING_SPORTS_VENUES.keys())
_unregistered = set(_ADAPTER_PATHS.keys()) - _KNOWN_VENUES
if _unregistered:
    import logging
    logging.getLogger(__name__).warning("UMI adapters not in UAC venue manifest: %s", _unregistered)
```

**Verification**: `cd unified-market-interface && bash scripts/quality-gates.sh`

---

### p3-utei-venue-validation

**Blocked by**: p2-alignment-tests

Add validation in UTEI adapter factory: validate venue name against `CLOB_VENUES | DEX_VENUES` from UAC before adapter
resolution.

**Verification**: `cd unified-trade-execution-interface && bash scripts/quality-gates.sh`

---

### p3-fix-hardcoded-back

**Blocked by**: p0-create-betside-enum

**File**: `unified-api-contracts/unified_api_contracts/normalize_utils/sports.py` (line 59)

**Current**: `side="back",  # sports bets are always backing`

**After**:

```python
from ..canonical.domain.sports.betting import BetSide
from ..registry.venue_constants import SPORTS_EXCHANGE_VENUES

def normalize_sports_order(
    raw: BetOrder,
    venue: str = "sports",
    side: BetSide = BetSide.BACK,
) -> CanonicalBetOrder:
    effective_side = side if venue.upper() in SPORTS_EXCHANGE_VENUES else BetSide.BACK
    return CanonicalBetOrder(
        venue=venue or raw.bookmaker_key,
        order_id=raw.order_id,
        market_id=raw.fixture_id,
        selection_id=raw.selection,
        side=effective_side.value,
        # ... rest unchanged
```

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

## Phase 4: Cleanup

### p4-usri-scope

USRI is an adapter layer. Sports canonical schemas live in UAC `canonical/domain/sports/`. Add re-exports in USRI
`__init__.py` for key sports types.

**Verification**: `cd unified-sports-reference-interface && bash scripts/quality-gates.sh`

---

### p4-provider-versions-cleanup

**File**: `unified-api-contracts/unified_api_contracts/config/provider_api_versions.yaml`

For each of 53 yellow providers:

- If `external/{provider}/schemas.py` exists AND `external/{provider}/mocks/` has cassettes → mark **green**
- If schemas exist but no cassette → mark **pending_cassette**
- If no schemas → evaluate usage; if unused, mark **dormant**

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

### p4-sports-aggregator-classification

**File**: `unified-api-contracts/unified_api_contracts/registry/venue_constants.py`

Add:

```python
class SportsAggregatorType(StrEnum):
    DIRECT_EXECUTION = "direct_execution"
    ODDS_AGGREGATOR = "odds_aggregator"
    EXECUTION_AGGREGATOR = "execution_aggregator"
    POSITION_AGGREGATOR = "position_aggregator"

VENUE_AGGREGATOR_TYPE: dict[str, SportsAggregatorType] = {
    "ODDS_API": SportsAggregatorType.ODDS_AGGREGATOR,
    "OPTICODDS": SportsAggregatorType.ODDS_AGGREGATOR,
    "ODDSJAM": SportsAggregatorType.ODDS_AGGREGATOR,
    "SHARPAPI": SportsAggregatorType.ODDS_AGGREGATOR,
    "METABET": SportsAggregatorType.ODDS_AGGREGATOR,
    "ODDS_ENGINE": SportsAggregatorType.ODDS_AGGREGATOR,
    BETFAIR: SportsAggregatorType.DIRECT_EXECUTION,
    SMARKETS: SportsAggregatorType.DIRECT_EXECUTION,
    MATCHBOOK: SportsAggregatorType.DIRECT_EXECUTION,
    BETDAQ: SportsAggregatorType.DIRECT_EXECUTION,
    PINNACLE: SportsAggregatorType.DIRECT_EXECUTION,
    ONEXBET: SportsAggregatorType.DIRECT_EXECUTION,
}
```

**Verification**: `cd unified-api-contracts && bash scripts/quality-gates.sh`

---

## Rollout Order (Dependency-Safe)

```
Phase 0 (UAC-only, parallelizable groups):
  Group A (sequential):
    p0-add-instrument-types
    p0-fix-databento-normalizer  (blocked_by: p0-add-instrument-types)
    p0-fix-ibkr-normalizer       (blocked_by: p0-add-instrument-types)
  Group B (sequential):
    p0-add-odds-types
    p0-extend-odds-api-markets   (blocked_by: p0-add-odds-types)
    p0-btts-normalization        (blocked_by: p0-extend-odds-api-markets)
    p0-supported-market-types    (blocked_by: p0-add-odds-types)
  Group C (sequential):
    p0-create-betside-enum
    p0-type-commission-model     (blocked_by: p0-create-betside-enum)
  Group D (independent):
    p0-sports-venues-instrument-types
    p0-add-missing-venues-manifest
    p0-odds-api-v3-v4-registry
    p0-update-fixture-example    (blocked_by: p0-btts-normalization)

Phase 1 (UAC + MTDS):
  p1-vcr-cassettes               (independent)
  p1-btts-cassette               (blocked_by: p0-btts-normalization)
  p1-registry-consumer-tests     (blocked_by: p0-sports-venues-instrument-types)
  p1-btts-field-mapping          (blocked_by: p0-btts-normalization)

Phase 2 (UAC + UCI + UIC, sequential):
  p2-enum-consolidation-uac      (blocked_by: p0-add-instrument-types)
  p2-uci-reexport                (blocked_by: p2-enum-consolidation-uac)
  p2-uic-tardis-consolidation    (blocked_by: p2-uci-reexport)
  p2-alignment-tests             (blocked_by: p2-uci-reexport)

Phase 3 (multi-repo, sequential):
  p3-exec-service-adopt          (blocked_by: p2-alignment-tests)
  p3-instruments-service-adopt   (blocked_by: p2-alignment-tests)
  p3-market-data-api-adopt       (blocked_by: p2-alignment-tests)
  p3-umi-adopt-registry          (blocked_by: p2-alignment-tests)
  p3-utei-venue-validation       (blocked_by: p2-alignment-tests)
  p3-fix-hardcoded-back          (blocked_by: p0-create-betside-enum)

Phase 4 (cleanup, independent):
  p4-usri-scope
  p4-provider-versions-cleanup
  p4-sports-aggregator-classification
```

---

## Agent Handoff Protocol

- A todo starts only when ALL its `blocked_by` dependencies are marked `done`
- Parallel todos (same `blocked_by` or independent) can be assigned to parallel agents in a single message
- Phase N+1 starts only when ALL Phase N todos are `done`
- When an agent completes a todo: mark `status: done`, update `- [ ]` to `- [x]`
- If a todo fails QG: mark `status: blocked`, add a `note:` explaining the failure. Do NOT proceed to dependent todos
- **No quickmerge unless explicitly requested. QG pass = done. Commit only.**
- **Agent injection**: Every sub-agent must read `unified-trading-pm/cursor-configs/SUB_AGENT_MANDATORY_RULES.md`
- **WORKSPACE_ROOT**: `/Users/ikennaigboaka/Code/unified-trading-system-repos`

---

## Smoke Test Commands

**Phase 0** (after all p0 todos):

```bash
cd unified-api-contracts && .venv/bin/python -c "
from unified_api_contracts.reference import InstrumentType
from unified_api_contracts.sports import OddsType, BetSide, CommissionModel
from unified_api_contracts.registry.venue_constants import (
    CLOB_VENUES, DEX_VENUES, ZERO_ALPHA_VENUES,
    INSTRUMENT_TYPES_BY_VENUE, SPORTS_VENUES, SPORTS_EXCHANGE_VENUES,
)
for t in ('BOND','EQUITY','ETF','COMMODITY','CURRENCY','CDS','POOL','LENDING','STAKING'):
    assert hasattr(InstrumentType, t), f'Missing InstrumentType: {t}'
for o in ('HALF_TIME_RESULT','CORNERS','CARDS','PLAYER_PROPS','DRAW_NO_BET','DOUBLE_CHANCE','GOAL_SCORER'):
    assert hasattr(OddsType, o), f'Missing OddsType: {o}'
assert BetSide.BACK == 'back'
assert BetSide.LAY == 'lay'
assert CommissionModel.NET_WINNINGS_PCT == 'net_winnings_pct'
for v in SPORTS_EXCHANGE_VENUES:
    assert v in INSTRUMENT_TYPES_BY_VENUE, f'Missing: {v}'
print('Phase 0 PASSED')
"
```

**Phase 2** (after enum consolidation):

```bash
cd unified-config-interface && .venv/bin/python -c "
from unified_config_interface.instrument import InstrumentType
assert hasattr(InstrumentType, 'BOND')
assert hasattr(InstrumentType, 'EQUITY')
print('Phase 2 UCI re-export PASSED')
"
```

**Phase 3** (after consumer adoption):

```bash
cd execution-service && .venv/bin/python -c "
from execution_service.utils.instruction_type import CLOB_VENUES, DEX_VENUES, ZERO_ALPHA_VENUES
assert 'BINANCE-SPOT' in CLOB_VENUES
assert 'BINANCE' in CLOB_VENUES
assert 'HYPERLIQUID' in CLOB_VENUES
assert 'WALLET' in ZERO_ALPHA_VENUES
print('Phase 3 exec-service PASSED')
"
```

---

## QG Pre-emption Strategy

| Pattern                                       | QG rule         | Bypass                          | Where                |
| --------------------------------------------- | --------------- | ------------------------------- | -------------------- |
| New enum values in existing files             | No issue        | None                            | —                    |
| New `_market_keys.py` file                    | F401 unused     | `__all__` list                  | New file             |
| CommissionModel import in venue_execution.py  | No issue        | None                            | —                    |
| OddsType duplicate removal in sports/**init** | F811 if left in | Delete duplicate class          | **init**.py line 347 |
| UCI re-export pattern                         | F401 unused     | `per-file-ignores` or `__all`\_ | UCI pyproject.toml   |
| SIT test imports from multiple repos          | No issue        | None                            | —                    |

---

## Risk Register

| Risk                                                         | Likelihood | Impact       | Mitigation                                                                 |
| ------------------------------------------------------------ | ---------- | ------------ | -------------------------------------------------------------------------- |
| InstrumentType additions break downstream string comparisons | Low        | Medium       | Additive only. No values removed. Existing comparisons still work.         |
| OddsType duplicate in sports/**init**.py confusion           | High       | Medium       | p0-add-odds-types removes duplicate, imports from odds.py.                 |
| UCI re-export creates circular dep                           | Low        | **Critical** | UAC does NOT depend on UCI. Direction is safe. Verify pyproject.toml.      |
| UCI `PERP` alias breaks consumers                            | Medium     | High         | Search for `InstrumentType.PERP` usage before p2-uci-reexport. Add to UAC. |
| execution-service venue alias logic breaks                   | Medium     | High         | Keep aliases as union set, not replacement. Full QG + smoke test.          |
| CommissionModel str→enum breaks VenueExecutionProfile        | Low        | Medium       | StrEnum auto-coerces. Verify all entries match.                            |
| IBKR normalizer changes break instrument keys                | Medium     | Medium       | All values valid InstrumentType members. Run instruments-service tests.    |
| Odds API BTTS request costs extra                            | None       | None         | Per-request pricing, not per-market.                                       |
| v3 historical data gap not visible to consumers              | Medium     | Medium       | available_from_date + notes field document the gap explicitly.             |

---

## Phase Completion Criteria

| Phase | Complete when                                                                                        |
| ----- | ---------------------------------------------------------------------------------------------------- |
| 0     | All 13 todos done. UAC QG green. Phase 0 smoke test passes. No circular imports in sports/.          |
| 1     | All 4 todos done. UAC QG green. 4 cassettes recorded. Consumer contract tests pass.                  |
| 2     | All 4 todos done. UAC + UCI + UIC QGs green. Phase 2 smoke test passes. Alignment tests pass in SIT. |
| 3     | All 6 todos done. All consumer repo QGs green. Phase 3 smoke test passes.                            |
| 4     | All 3 todos done. USRI scope documented. Provider versions audited. Aggregator classification added. |

---

## Repos Touched

| Repo                               | Phase      | Changes                                                           |
| ---------------------------------- | ---------- | ----------------------------------------------------------------- |
| unified-api-contracts              | 0, 1, 2, 4 | InstrumentType/OddsType, enums, normalizers, venue_constants, VCR |
| unified-config-interface           | 2          | InstrumentType re-export from UAC                                 |
| unified-internal-contracts         | 2          | VENUE_TO_TARDIS delegation                                        |
| execution-service                  | 3          | Replace local venue sets with UAC imports + aliases               |
| instruments-service                | 3          | Adopt INSTRUMENT_TYPES_BY_VENUE                                   |
| market-data-api                    | 3          | Add UAC dependency + venue validation                             |
| unified-market-interface           | 0, 3       | Extend odds_api adapter; registry validation                      |
| unified-trade-execution-interface  | 3          | Venue validation in adapter factory                               |
| unified-sports-reference-interface | 4          | Scope clarification, UAC re-exports                               |
| system-integration-tests           | 2          | Registry alignment tests                                          |
| market-tick-data-service           | 1          | BTTS field mapping                                                |
