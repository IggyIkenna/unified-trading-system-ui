# Prediction Markets — Cross-Cutting Concern

Polymarket and Kalshi serve THREE distinct roles in the unified trading system. They are not just "another venue" — they
are simultaneously a data source, an execution venue, and an arbitrage surface.

## Three Use Cases

| Role                  | What                                                     | Example                                                                   |
| --------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Features source**   | Prediction market prices as signals for other strategies | Polymarket "BTC above $100k" at 72% → bullish signal for CeFi momentum    |
| **Execution venue**   | Trade prediction markets directly based on our models    | Our ML model says 90% BTC up, market says 50% → buy YES contracts         |
| **Arbitrage surface** | Cross-platform or cross-instrument arb                   | Same event on Polymarket at 55% and Kalshi at 48% → buy Kalshi, sell Poly |

## What Already Exists in the System

**Substantial infrastructure is already built:**

| Component                           | Status      | File                                                                                     |
| ----------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| Polymarket market data adapter      | IMPLEMENTED | `unified-market-interface/adapters/prediction/polymarket_adapter.py`                     |
| Kalshi market data adapter          | IMPLEMENTED | `unified-market-interface/adapters/prediction/kalshi_adapter.py`                         |
| Polymarket schemas (Pydantic)       | IMPLEMENTED | `unified-api-contracts/external/polymarket/schemas.py`                                   |
| Kalshi schemas (Pydantic)           | IMPLEMENTED | `unified-api-contracts/external/kalshi/schemas.py`                                       |
| Polymarket arb schemas              | IMPLEMENTED | `unified-api-contracts/external/polymarket/arb_schemas.py`                               |
| Polymarket CLOB execution           | IMPLEMENTED | `unified-sports-execution-interface/adapters/exchanges/polymarket_clob.py`               |
| Kalshi execution adapter            | IMPLEMENTED | `unified-sports-execution-interface/adapters/exchanges/kalshi.py`                        |
| PredictionArbStrategy               | IMPLEMENTED | `strategy-service/engine/strategies/prediction_arb/prediction_arb_strategy.py`           |
| Prediction mapping / categorisation | IMPLEMENTED | `strategy-service/engine/strategies/prediction/prediction_mapping.py`                    |
| Cross-venue arb schemas (UIC)       | IMPLEMENTED | `unified-internal-contracts/domain/prediction_market/prediction_market_arb.py`           |
| Polymarket crowd sentiment feature  | IMPLEMENTED | `features-cross-instrument-service/calculators/polymarket_crowd_sentiment_calculator.py` |
| Execution handler                   | IMPLEMENTED | `execution-service/engine/handlers/prediction_handler.py`                                |
| VCR cassettes                       | EXIST       | `unified-api-contracts/tests/`                                                           |

**What's NOT wired:**

| Gap                                                 | Impact                                 |
| --------------------------------------------------- | -------------------------------------- |
| Not in `VENUE_REGISTRY` (in `PLANNED_VENUES`)       | `get_adapter()` can't instantiate them |
| No capability declarations                          | Mode/env validation not wired          |
| No instrument taxonomy entry for prediction markets | Instrument IDs not standardised        |
| Kalshi position tracking missing                    | Can't monitor Kalshi positions         |

## Market Classification Framework

### The Core Problem: Same Event, Different Wording

Polymarket: "Will gold price exceed $2,500 by June 2025?" Kalshi: "Gold spot price above $2,500 on June 30, 2025"
**These are the same event.** Cross-platform arb requires matching them.

### Existing: `PredictionMarketCategory` Enum

```python
class PredictionMarketCategory(StrEnum):
    POLITICS = "politics"
    FINANCIAL = "financial"
    SPORTS = "sports"
    CRYPTO = "crypto"
    WEATHER = "weather"
    ENTERTAINMENT = "entertainment"
    OTHER = "other"
```

SSOT: `strategy-service/engine/strategies/prediction/prediction_mapping.py`

### Proposed: Three-Tier Classification

Every prediction market should be classified along three dimensions:

**Tier 1 — Use case:**

| Use Case      | Description                            | Example                                     |
| ------------- | -------------------------------------- | ------------------------------------------- |
| `FEATURE`     | Signal for other strategies            | BTC sentiment → CeFi momentum model         |
| `TRADABLE`    | Direct execution target                | Buy YES on underpriced outcome              |
| `ARB_SURFACE` | Cross-platform or cross-instrument arb | Polymarket vs Kalshi, prediction vs options |
| `BOTH`        | Feature AND tradable                   | Most useful markets                         |

**Tier 2 — Domain mapping:**

| Domain      | Maps To                   | Cross-Reference                     |
| ----------- | ------------------------- | ----------------------------------- |
| `CRYPTO`    | CeFi/DeFi strategies      | BTC/ETH price, DeFi protocol events |
| `MACRO`     | TradFi strategies         | Fed rates, CPI, GDP, S&P levels     |
| `SPORTS`    | Sports strategies         | Match outcomes, player props        |
| `WEATHER`   | Features only (for now)   | Temperature, hurricane, rainfall    |
| `POLITICS`  | Features only (sentiment) | Election, policy outcomes           |
| `CORPORATE` | Features only             | Earnings, M&A, layoffs              |

**Tier 3 — Equivalent instrument mapping:**

| Prediction Market                        | Traditional Equivalent                   | Arb Possible?               |
| ---------------------------------------- | ---------------------------------------- | --------------------------- |
| "S&P above 5000 on Dec 31" (Kalshi)      | SPX binary call, strike 5000, exp Dec 31 | YES — compare implied probs |
| "Fed rate cut in March" (Kalshi)         | Fed Funds Futures (CME FedWatch)         | YES — compare implied probs |
| "BTC above $100k by June" (Polymarket)   | BTC binary option (Deribit)              | YES — compare implied probs |
| "Man Utd wins vs Arsenal" (Polymarket)   | Betfair back price for Man Utd           | YES — direct arb            |
| "Will it rain in NYC tomorrow?" (Kalshi) | No traditional equivalent                | NO — feature only           |

> **TODO — CODIFY:** This three-tier classification needs to be machine-readable: (a) Add `PredictionMarketUseCase` enum
> to UIC: `FEATURE`, `TRADABLE`, `ARB_SURFACE`, `BOTH` (b) Add `equivalent_instrument_type` field to
> `CanonicalPredictionMarket`: maps to traditional instrument if arb is possible (e.g., `SPX_BINARY_CALL`,
> `FED_FUNDS_FUTURE`, `BETFAIR_BACK`) (c) Add `domain_mapping` field linking to strategy domains (d) Cross-platform
> matching rules: normalise event descriptions to canonical form for matching

## Instrument ID Convention

Prediction markets need a consistent instrument ID pattern:

```
{VENUE}:{MARKET_TYPE}:{EVENT_SLUG}@{OUTCOME}

Examples:
  POLYMARKET:BINARY:BTC_ABOVE_100K_DEC2025@YES
  POLYMARKET:BINARY:BTC_ABOVE_100K_DEC2025@NO
  KALSHI:BINARY:SP500_ABOVE_5000_DEC2025@YES
  KALSHI:BRACKET:HIGHNY_22NOV27@B58          (bracket = range market)
  POLYMARKET:CATEGORICAL:US_PRESIDENT_2028@HARRIS
```

> **TODO — CODIFY:** This convention doesn't exist. Need to add to `unified-config-interface` instrument ID rules. The
> `CanonicalPredictionMarket` in prediction_mapping.py generates deterministic IDs but they're not in the standard
> instrument key format.

## Polymarket as a Feature Source

### How It Works Today

`polymarket_crowd_sentiment_calculator.py` in features-cross-instrument-service:

- Polls Polymarket CLOB API for implied probabilities
- Feeds into cross-instrument feature signals
- No auth required (public endpoints)

### What's Valuable as Features

| Feature                                 | Source                    | Backtest-able? | Min History Needed         |
| --------------------------------------- | ------------------------- | -------------- | -------------------------- |
| BTC sentiment (implied prob of up/down) | Polymarket crypto markets | YES (~2yr)     | 1 year                     |
| Fed rate expectations                   | Kalshi fed rate series    | YES (~2yr)     | 6 months                   |
| Election/policy regime                  | Polymarket politics       | PARTIAL        | Not useful for backtesting |
| S&P range expectations                  | Kalshi S&P brackets       | YES (~1yr)     | 6 months                   |
| Weather (for commodities)               | Kalshi weather series     | YES (~2yr)     | 1 year                     |

### Semantic Grouping Problem

"Bitcoin above $95k on March 20" and "BTC price exceeds 95000 by end of March 20" are the SAME thing. Need NLP-based or
rule-based matching to group equivalent markets for stronger signals.

> **TODO — CODIFY:** Market semantic matching: (a) Rule-based normalisation: strip dates, amounts, standardise asset
> names (b) Group markets by (asset, direction, threshold, expiry_bucket) (c) Aggregate implied probabilities across
> grouped markets for stronger signal (d) Track historical accuracy per market group (calibration curve)

## Polymarket/Kalshi as Execution Venues

### The Alpha Opportunity

If our ML model predicts BTC goes up with 90% confidence and Polymarket prices "BTC up next hour" at 50% implied
probability:

- Buy YES at $0.50
- If correct: receive $1.00 → 100% return
- Expected value: 0.9 × $1.00 - $0.50 = $0.40 per contract (80% expected return!)

Compare to futures: same prediction might yield a few percent return on margin.

**This makes prediction markets potentially the highest-alpha execution venue** when our models have strong edge and the
market is mispriced.

### Short-Duration Markets

Kalshi and Polymarket both offer short-duration markets (hourly, daily):

- "BTC above $X in the next hour" (Polymarket)
- "S&P 500 daily high" (Kalshi daily series)
- These are directly tradable by our ML models

### Execution Flow

Same as any other strategy in the unified system:

```
features-service (publishes: ml_signal, prediction_market_price)
  → strategy-service receives event
    → if ml_confidence > threshold AND market_price < fair_value:
        → emit StrategyInstruction(PREDICTION_BET, side=YES, price=market_price)
          → execution-service/prediction_handler → Polymarket CLOB or Kalshi API
```

## Cross-Platform Arbitrage

### Types of Arb

**1. Intra-platform single-market:** YES + NO < $1.00 on same market (rare, <1%)

**2. Intra-platform multi-outcome:** Sum of all outcomes < $1.00 across categorical markets

**3. Cross-platform same-event:** Polymarket YES at 55%, Kalshi YES at 48% → buy Kalshi, sell Poly

- Minimum spread needed: ~2.5% after fees (Kalshi taker ~1.75%, Polymarket ~0%)
- Settlement timing difference risk: markets may resolve at slightly different times

**4. Prediction vs traditional instrument:** Kalshi "S&P above 5000" vs SPX binary option

- Compare implied probabilities
- Challenge: different settlement mechanisms, different liquidity, different fee structures

### Existing: PredictionArbStrategy

Already implemented at `strategy-service/engine/strategies/prediction_arb/prediction_arb_strategy.py`:

- Cross-venue arbitrage detection (Polymarket, Kalshi, Betfair)
- Scans for YES_a + NO_b < 1.0 opportunities
- Uses CanonicalPredictionMarket for cross-platform matching

### Existing: UIC Arb Schemas

Already implemented at `unified-internal-contracts/domain/prediction_market/prediction_market_arb.py`:

- `CrossVenueLink` — for same-event cross-platform arb
- `BucketMarket` + `ProbabilityBucket` — for neg-risk bucket arb
- `SportsbookLink` — Polymarket vs traditional sportsbooks

## Data Download & Research

### Getting Started: Pull Market Data

To understand what's available, pull a snapshot of all active markets:

```python
# Polymarket — all active events with markets
import requests
events = []
offset = 0
while True:
    resp = requests.get(
        "https://gamma-api.polymarket.com/events",
        params={"closed": "false", "limit": 50, "offset": offset}
    )
    batch = resp.json()
    if not batch: break
    events.extend(batch)
    offset += 50

# Kalshi — all active markets
markets = []
cursor = None
while True:
    params = {"status": "open", "limit": 100}
    if cursor: params["cursor"] = cursor
    resp = requests.get(
        "https://api.kalshi.com/trade-api/v2/markets",
        params=params, headers=kalshi_auth_headers()
    )
    data = resp.json()
    markets.extend(data["markets"])
    cursor = data.get("cursor")
    if not cursor: break
```

### Classification Output

For each market, determine:

1. **Category** (CRYPTO, MACRO, SPORTS, WEATHER, POLITICS, CORPORATE)
2. **Use case** (FEATURE, TRADABLE, ARB_SURFACE, BOTH)
3. **Equivalent traditional instrument** (if any)
4. **Cross-platform match** (if same event exists on other platform)
5. **Historical depth** (how long has this market/series existed?)
6. **Liquidity** (volume, open interest, bid-ask spread)

> **TODO — CODIFY:** Build a `prediction_market_classifier.py` in features-cross-instrument-service that periodically
> pulls all markets from Polymarket + Kalshi, classifies them, identifies cross-platform matches, and publishes a
> classified market registry to GCS. This becomes the SSOT for which prediction markets are useful and how.

## Key Academic Research

| Paper                                                         | Finding                                           |
| ------------------------------------------------------------- | ------------------------------------------------- |
| "Unravelling the Probabilistic Forest" (arXiv:2508.03474)     | ~$40M arb profits on Polymarket Apr 2024-Apr 2025 |
| "Semantic Non-Fungibility" (arXiv:2601.01706)                 | Why equivalent markets trade at different prices  |
| "Price Discovery in Modern Prediction Markets" (SSRN:5331995) | Polymarket leads Kalshi in price discovery        |

## Open-Source Tools

| Tool                                   | Use                                       |
| -------------------------------------- | ----------------------------------------- |
| `py-clob-client` (Polymarket official) | Trading + market data                     |
| `kalshi-python` (Kalshi official)      | Trading + market data                     |
| `Polymarket/agents` (official)         | AI agent framework for autonomous trading |
| `polymarket-apis` (third-party)        | Unified wrapper with Pydantic validation  |
| `Dome API` (domeapi.io)                | Unified cross-platform API (YC-backed)    |
| EventArb, ArbBets                      | Cross-platform arb detection              |

## Integration Gaps & TODOs

> **TODO — CODIFY:** Wire Polymarket and Kalshi into main `VENUE_REGISTRY` (currently in `PLANNED_VENUES`). Add
> capability declarations. Without this, `get_adapter()` can't instantiate.

> **TODO — CODIFY:** Add prediction market instrument ID convention to instrument taxonomy.

> **TODO — CODIFY:** Add `PredictionMarketUseCase` enum and `equivalent_instrument_type` mapping.

> **TODO — CODIFY:** Build `prediction_market_classifier.py` for automated market classification.

> **TODO — CODIFY:** Add semantic matching / NLP-based market grouping for equivalent-market detection.

> **TODO — CODIFY:** Add Kalshi `demo-api.kalshi.com` as testnet equivalent in testnet registry. Kalshi has a demo
> environment that doesn't require real money.

> **TODO — CODIFY:** Historical data pipeline: Polymarket prices-history API has 12h+ granularity for resolved markets.
> For fine-grained historical data, need to build our own recorder from WebSocket feed. Kalshi has proper historical
> endpoints with 1-min candlesticks.

## References

- **Polymarket adapters:** `unified-market-interface/adapters/prediction/polymarket_adapter.py`
- **Kalshi adapters:** `unified-market-interface/adapters/prediction/kalshi_adapter.py`
- **Execution:** `unified-sports-execution-interface/adapters/exchanges/polymarket_clob.py`
- **Strategy:** `strategy-service/engine/strategies/prediction_arb/prediction_arb_strategy.py`
- **Features:** `features-cross-instrument-service/calculators/polymarket_crowd_sentiment_calculator.py`
- **Arb schemas:** `unified-internal-contracts/domain/prediction_market/prediction_market_arb.py`
- **Polymarket docs:** https://docs.polymarket.com/
- **Kalshi docs:** https://docs.kalshi.com/
