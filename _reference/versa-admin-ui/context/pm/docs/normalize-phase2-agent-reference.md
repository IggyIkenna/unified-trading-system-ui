# Normalize Phase 2 — Agent Reference for Parallel Implementation

**Purpose:** Enable up to 20 parallel agents to implement `external/{source}/normalize.py` for providers that lack it.
Each agent gets domain, reference normalizer, canonical types, and schema mapping.

**Plan:** `plans/active/uac_citadel_remediation.plan.md` todo `c1-missing-normalize-py`

---

## 1. Canonical Types (Target Output)

| Domain               | Canonical Types                                                                                                                                                                   | Import Path                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Sports / Betting** | `CanonicalBetMarket`, `CanonicalOdds`, `CanonicalBetOrder`, `CanonicalFixture`, `CanonicalFixtureEvent`, `CanonicalLineup`, `CanonicalPlayer`, `CanonicalTeam`, `CanonicalLeague` | `unified_api_contracts.canonical.domain`                |
| **Onchain / DeFi**   | `CanonicalOnChainMetric`, `CanonicalOraclePriceFeed`, `CanonicalInstrument`, `CanonicalTrade`, `CanonicalBalance`, `CanonicalPosition`                                            | `unified_api_contracts.canonical.domain`                |
| **TradFi / Macro**   | `CanonicalOhlcvBar`, `CanonicalInstrument`, `CanonicalYieldCurvePoint`, `CanonicalBondData`, `CanonicalCdsSpread`, `CanonicalTicker`                                              | `unified_api_contracts.canonical.domain`                |
| **Infra / Meta**     | `CanonicalCloudStorage`, `CanonicalComputeJob`, etc.                                                                                                                              | `unified_api_contracts.canonical.domain.infrastructure` |

---

## 2. normalize_utils Helpers (Always Use)

```python
from ...normalize_utils._helpers import _d, _to_decimal, _to_levels, _ts_ms_to_datetime
from ...normalize_utils.sides import normalize_side
from ...normalize_utils.symbols import normalize_symbol
```

- `_d(val)` -> `Decimal | None` (numeric conversion)
- `_to_decimal(val)` -> `Decimal | None`
- `_ts_ms_to_datetime(ms)` -> `datetime` (UTC)
- `_to_levels(bids, asks)` -> orderbook levels

---

## 3. Provider Assignment by Domain

### 3.1 EXTRACTABLE (logic exists in normalize_utils — move, don't implement)

| Provider        | normalize_utils Location      | Functions to Move                                         |
| --------------- | ----------------------------- | --------------------------------------------------------- |
| **odds_api**    | `instruments.py`, `sports.py` | `normalize_odds_api_market`, `normalize_odds_api_fixture` |
| **odds_engine** | `instruments.py`              | `normalize_odds_engine_market`                            |

**Agent task:** Create `external/{source}/normalize.py`, move functions from normalize_utils, update normalize_utils to
import from external.

---

### 3.2 SPORTS / BETTING (reference: `betfair/normalize.py`, `pinnacle/normalize.py`)

| Provider                 | Schema Classes (key)                                                            | Target Canonical                                          | Notes                                                |
| ------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| **api_football**         | `ApiFootballFixture`, `ApiFootballOdds`, `ApiFootballTeam`, `ApiFootballLeague` | `CanonicalBetMarket`, `CanonicalOdds`, `CanonicalFixture` | Fixtures + odds; map bookmaker/bets to CanonicalOdds |
| **footystats**           | `FootyStatsMatch`, `FootyStatsOdds`, `FootyStatsLeague`, `FootyStatsTeam`       | `CanonicalBetMarket`, `CanonicalOdds`, `CanonicalFixture` | Match/odds/league/team                               |
| **oddsjam**              | Odds market schemas                                                             | `CanonicalBetMarket`, `CanonicalOdds`                     | Odds aggregation                                     |
| **opticodds**            | Odds schemas                                                                    | `CanonicalBetMarket`, `CanonicalOdds`                     | Odds feed                                            |
| **sharpapi**             | Sharp odds schemas                                                              | `CanonicalBetMarket`, `CanonicalOdds`                     | Sharp odds                                           |
| **soccer_football_info** | Fixture, team, league schemas                                                   | `CanonicalFixture`, `CanonicalTeam`, `CanonicalLeague`    | Football reference data                              |
| **transfermarkt**        | Player, team, transfer schemas                                                  | `CanonicalPlayer`, `CanonicalTeam`                        | Transfer market data                                 |
| **understat**            | xG, match stats schemas                                                         | `CanonicalFixture`, `CanonicalFeatureRecord`              | Advanced stats                                       |

---

### 3.3 ONCHAIN / DEFI (reference: `glassnode/normalize.py`, `arkham/normalize.py`, `defillama/normalize.py`)

| Provider      | Schema Classes (key)                                                                        | Target Canonical                                                  | Notes                                                                     |
| ------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **alchemy**   | `AlchemyAssetTransfer`, `AlchemyTokenBalance`, `AlchemyBlock`, `AlchemyTransaction`         | `CanonicalTrade`, `CanonicalBalance`, `CanonicalOnChainMetric`    | RPC/Data API; asset transfers -> trade-like; balances -> CanonicalBalance |
| **bloxroute** | Block, tx, mempool schemas                                                                  | `CanonicalTrade`, `CanonicalOraclePriceFeed`                      | Block propagation / BDN                                                   |
| **thegraph**  | `SubgraphPool`, `SubgraphSwap`, `SubgraphToken`, `GraphUniswapPool`, `GraphSwapTransaction` | `CanonicalInstrument`, `CanonicalTrade`, `CanonicalOnChainMetric` | Subgraph DEX data -> instruments/trades                                   |
| **instadapp** | Position, vault schemas                                                                     | `CanonicalPosition`, `CanonicalBalance`                           | DeFi positions                                                            |
| **mev**       | MEV bundle, block schemas                                                                   | `CanonicalTrade`, custom MEV types                                | MEV-specific if no direct canonical match                                 |

---

### 3.4 TRADFI / MACRO (reference: `fred/normalize.py`, `ecb/normalize.py`, `openbb/normalize.py`)

| Provider         | Schema Classes (key)            | Target Canonical                                              | Notes                    |
| ---------------- | ------------------------------- | ------------------------------------------------------------- | ------------------------ |
| **polygon**      | OHLCV, ticker schemas           | `CanonicalOhlcvBar`, `CanonicalTicker`, `CanonicalInstrument` | US equities/crypto       |
| **baker_hughes** | Rig count, energy schemas       | `CanonicalOnChainMetric` or `CanonicalOhlcvBar`               | Commodity/energy metrics |
| **cftc**         | COT report schemas              | `CanonicalOnChainMetric` or custom                            | Commitments of Traders   |
| **cryptoquant**  | On-chain metrics                | `CanonicalOnChainMetric`                                      | Similar to Glassnode     |
| **eia**          | Energy inventory, price schemas | `CanonicalOhlcvBar`, `CanonicalOnChainMetric`                 | EIA energy data          |
| **fear_greed**   | Fear & Greed index              | `CanonicalOnChainMetric` (metric_type="fear_greed")           | Single index value       |
| **open_meteo**   | Weather observation             | `CanonicalFeatureRecord` or custom                            | Weather for commodities  |

---

### 3.5 INFRA / META (lower priority, may need new canonical types)

| Provider      | Schema Classes                                             | Target Canonical                                                                                        | Notes                                               |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **aws**       | S3 list_objects_v2, EC2 describe_instances, ECR, CodeBuild | `CanonicalCloudStorage`, `CanonicalVirtualMachine`, `CanonicalContainerRegistry`, `CanonicalComputeJob` | DONE — external/aws/normalize.py                    |
| **gcp**       | GCS, Compute Engine, Artifact Registry, Cloud Build        | `CanonicalCloudStorage`, `CanonicalVirtualMachine`, `CanonicalContainerRegistry`, `CanonicalComputeJob` | DONE — external/gcp/normalize.py                    |
| **github**    | Repository, PullRequest, WorkflowRun                       | `CanonicalRepository`, `CanonicalPullRequest`, `CanonicalWorkflowRun`                                   | DONE — external/github/normalize.py (routing layer) |
| **sentiment** | Sentiment score schemas                                    | `CanonicalOnChainMetric` (metric_type="sentiment")                                                      | Sentiment index                                     |

---

## 4. Exempt (Do Not Create normalize.py)

- **defi** — Aggregator, not a data source
- **prime_broker** — Execution/prime, not normalization
- **protocol_sdks** — SDK wrappers, not raw data
- **sports** — Stale dir, to be deleted (a2)
- **venue_manifest** — Registry metadata, not provider data

---

## 5. File Template (external/{source}/normalize.py)

```python
"""{{Provider}} normalizers — all normalize_{{provider}}_* functions.

{{One-line description of what this provider exposes.}}
"""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from ...canonical.domain import CanonicalBetMarket, CanonicalOdds  # adjust imports
from ...normalize_utils._helpers import _d, _to_decimal, _ts_ms_to_datetime
from .schemas import SomeSchema


def normalize_{{provider}}_market(raw: SomeSchema, venue: str = "{{provider}}") -> CanonicalBetMarket:
    """Convert SomeSchema to CanonicalBetMarket."""
    # Use _d(), _to_decimal(), _ts_ms_to_datetime() from _helpers
    return CanonicalBetMarket(...)
```

---

## 6. Agent Assignment Suggestion (20 parallel)

| Agent | Providers                                      | Domain    |
| ----- | ---------------------------------------------- | --------- |
| 1     | odds_api                                       | Extract   |
| 2     | odds_engine                                    | Extract   |
| 3     | api_football                                   | Sports    |
| 4     | footystats                                     | Sports    |
| 5     | oddsjam, opticodds, sharpapi                   | Sports    |
| 6     | soccer_football_info, transfermarkt, understat | Sports    |
| 7     | alchemy                                        | Onchain   |
| 8     | bloxroute, thegraph                            | Onchain   |
| 9     | instadapp, mev                                 | Onchain   |
| 10    | polygon                                        | TradFi    |
| 11    | baker_hughes, cftc, cryptoquant                | TradFi    |
| 12    | eia, fear_greed, open_meteo                    | TradFi    |
| 13–20 | Reserve / overflow                             | As needed |

---

## 7. Context7 References (External API Docs)

- **Alchemy:** `/alchemyplatform/docs` — asset transfers, token balances, blocks
- **The Graph:** Subgraph GraphQL — pools, swaps, tokens (no direct Context7 match; use schema inspection)
- **AWS (boto3):** `/boto/boto3` — S3 list_objects_v2 response, EC2 describe_instances, ECR describe_repositories,
  CodeBuild batch_get_builds. Use for external/aws/normalize.py → CanonicalCloudStorage, CanonicalVirtualMachine,
  CanonicalContainerRegistry, CanonicalComputeJob, CloudProvider
- **GCP (google-cloud-\*):** `/googleapis/python-storage` — GCS buckets/blobs; Compute Engine, Artifact Registry, Cloud
  Build use google-cloud-compute, artifact-registry, cloudbuild SDKs. Use for external/gcp/normalize.py → same
  canonicals.
- **GitHub:** REST API v3 — repos, PRs, workflow runs. Use for external/github/normalize.py → CanonicalRepository,
  CanonicalPullRequest, CanonicalWorkflowRun. PyGithub / gh CLI both use same API.

---

## 8. Verification

After creating `external/{source}/normalize.py`:

1. `cd unified-api-contracts && bash scripts/quality-gates.sh`
2. Ensure no new imports from `canonical.normalize` (use `normalize_utils` or `external.{source}.normalize`)
3. For extractable (odds_api, odds_engine): update `normalize_utils/instruments.py` and `normalize_utils/sports.py` to
   import from `external.{source}.normalize`
