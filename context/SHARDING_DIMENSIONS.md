# Sharding, Access Scoping & Subscription Model

## Overview

The Unified Trading System partitions data across **three layers**:

1. **Infrastructure Sharding** — How services partition and deploy data (category, venue, instrument, date, etc.)
2. **Client Sharding** — How positions, risk, strategies, and execution are isolated per client/org
3. **Access & Subscription Scoping** — What each user/org can SEE and DO based on their subscription tier

Understanding all three layers is critical for building the UI correctly. They are orthogonal but intersect:
a shared data feed (layer 1) is accessed through a subscription filter (layer 3) by a client whose
positions are isolated (layer 2).

**SSOT for infrastructure sharding:** `lib/registry/sharding_config.yaml` (copied from unified-trading-pm/configs/)
**SSOT for market categories:** `context/internal-contracts/schemas/market_category.py`

---

## Layer 1: Infrastructure Sharding (How Data is Partitioned)

### Market Categories (the "shards")

```python
class MarketCategory(StrEnum):
    CEFI = "CEFI"      # Centralized crypto exchanges (Binance, Kraken, CME, etc.)
    TRADFI = "TRADFI"  # Traditional finance (equities, bonds, FX)
    DEFI = "DEFI"      # Decentralized finance (Uniswap, Aave, Curve, etc.)
    SPORTS = "SPORTS"  # Sports betting & prediction markets
```

Default enabled: `["CEFI", "TRADFI", "DEFI"]`. SPORTS can be enabled via `ENABLED_CATEGORIES`.

### Sharding Dimensions by Service (from PM configs SSOT)

Services shard differently depending on their domain. Below is the canonical truth from `sharding_config.yaml`.

#### Data Pipeline Services

| Service | Batch Dimensions | Live Dimensions |
|---------|------------------|-----------------|
| **instruments-service** | `[category, venue, date]` | `[venue]` |
| **market-tick-data-service** | `[category, venue, instrument_type, data_type, date]` | `[venue, instrument_type, data_type]` |
| **market-data-processing-service** | `[category, venue, instrument_type, date, timeframe]` | `[venue, instrument_type]` |

Instrument types: `spot, perpetual, future, option, odds`
Data types: `trades, book_snapshot_5, derivative_ticker, liquidations, incremental_book_l2, opra_options, cme_options, odds_tick, book_update`
Timeframes: `15s, 1min, 5min, 15min, 1h, 4h, 1d`

#### Feature Services

| Service | Batch Dimensions | Live Dimensions |
|---------|------------------|-----------------|
| **features-delta-one-service** | `[category, venue, feature_category, date]` | `[venue, feature_category]` |
| **features-volatility-service** | `[category, venue, feature_category, date]` | `[venue, feature_category]` |
| **features-calendar-service** | `[category, date]` | N/A (batch only) |
| **features-onchain-service** | `[protocol, chain, date]` | N/A (batch only) |
| **features-cross-instrument-service** | `[category, feature_category, date]` | `[feature_category]` |
| **features-multi-timeframe-service** | `[category, feature_category, date]` | `[feature_category]` |
| **features-sports-service** | `[league, feature_group, date]` | `[league]` |

**Sports shards by league, NOT category:** EPL, LA_LIGA, BUNDESLIGA, SERIE_A, LIGUE_1, CHAMPIONSHIP, EREDIVISIE, PRIMEIRA_LIGA

Feature categories (delta-one): `technical_indicators, moving_averages, oscillators, volatility_realized, momentum, volume_analysis, vwap, candlestick_patterns, market_structure, returns, round_numbers, streaks, microstructure, funding_oi, liquidations, temporal`

On-chain protocols: `aave_v3, uniswap_v3, curve, morpho, euler, fluid` across chains: `ethereum, base, arbitrum, optimism`

#### ML Services

| Service | Batch Dimensions | Live Dimensions |
|---------|------------------|-----------------|
| **ml-training-service** | `[model, instrument, timeframe, target_type, config]` | N/A (batch only, ~quarterly) |
| **ml-inference-service** | `[model, venue, instrument, date]` | `[model, venue, instrument]` |

Models: `lstm, xgboost, lightgbm, ensemble`
Target types: `return, volatility, direction, regime`

#### Trading Services (Client-Sharded — see Layer 2)

| Service | Batch Dimensions | Live Dimensions |
|---------|------------------|-----------------|
| **strategy-service** | `[strategy_id, client, date]` | `[strategy_id, client]` |
| **execution-service** | `[client, subaccount, date]` | `[client, subaccount]` |
| **position-balance-monitor-service** | `[client, venue, date]` | `[client, venue]` |
| **risk-and-exposure-service** | `[client, date]` | `[client]` |
| **pnl-attribution-service** | `[client, date]` | `[client]` |
| **alerting-service** | N/A | singleton |

**Key notes:**
- **strategy-service is NOT sharded by venue** — a strategy may span venues (arb, spread)
- **execution-service uses subaccount** — finer than client-level isolation
- **position-balance-monitor raw granularity:** `[client, subaccount, venue, instrument]`
- **risk aggregation dimensions:** `[client, underlying, risk_category, pool]`
- **pnl output dimensions:** `[client, strategy, date]`

### Dimension Types (deployment-service)

| Type | Description | Example |
|------|-------------|---------|
| **fixed** | Static list of values | `category_values: [cefi, defi, tradfi]` |
| **hierarchical** | Depends on parent dimension | venue depends on category |
| **date_range** | Date-based with granularity (daily/weekly/monthly/none) | `[..., date]` |
| **cloud_dynamic / gcs_dynamic** | Discovered from GCS bucket paths at runtime | Dynamic instrument lists |

---

## Layer 2: Client Sharding (How Org/Client Data is Isolated)

Client is a **real sharding dimension** on trading services. Each client has their own:
- Strategies (deployed per-client with separate configs)
- Execution (separate subaccounts, separate order flows)
- Positions (isolated position state per client per venue)
- Risk (separate risk limits, separate exposure calculations)
- P&L (separate attribution, separate reporting)

**In the UI:**
- Internal users see ALL clients via org/client selector at top
- Client users see ONLY their client (selector is read-only or hidden)
- The pages are the same — the API scopes the data by the `client` dimension
- The hierarchy is: Organisation → Client → Subaccount → Venue → Instrument

**Client values in the system today:** `internal`, `external` (will expand as more orgs onboard)

**What already exists per-client:**
- Strategy configs deployed per-client (strategy-service)
- Execution per-client with subaccount (execution-service)
- Positions per-client per-venue (position-balance-monitor-service)
- Risk per-client (risk-and-exposure-service)
- P&L per-client per-strategy (pnl-attribution-service)

---

## Layer 3: Access & Subscription Scoping (What Users See)

This layer controls what a user/org can ACCESS through the platform. It sits ON TOP of the
infrastructure sharding and client isolation.

### Scoping Rules by Data Type

| Data Type | Infrastructure Shard | Client Isolation | Subscription Scoping | Notes |
|-----------|---------------------|------------------|---------------------|-------|
| **Market data** (OHLCV, books, ticks) | category→venue→instrument | **None** — shared infrastructure | **None** — everyone accesses same data | Data exists; clients use it within the platform. No duplication. |
| **Instrument registry** | category→venue | **None** — shared | **Subscription-filtered** | Same registry, filtered view. Basic tier = 180 instruments. Pro = 2400. |
| **Download/data status** | category→venue | **None** — shared | **Subscription-scoped** | Progress bars for entitled instruments. Same UI as internal data status page. |
| **Features** (delta-one, vol, etc.) | category→venue→feature_category | **None** — shared computation | **Subscription-filtered** | Full feature subscription = see all. Basic = subset. Same feature pipeline. |
| **ML models** | model→instrument→timeframe | **None** — shared models | **Subscription-filtered** | Full ML sub = all models/features/targets. Basic = restricted set. |
| **Strategies** | strategy_id→client | **Client-isolated** | **Client-scoped** | Each org has their own strategies. Internal sees all. |
| **Execution/Orders** | client→subaccount | **Client-isolated** | **Client-scoped** | Each org's order flow. Internal sees all via client selector. |
| **Positions** | client→venue→instrument | **Client-isolated** | **Client-scoped** | Each org's positions. Internal sees all. |
| **Risk/Exposure** | client | **Client-isolated** | **Client-scoped** | Each org's risk limits and exposure. |
| **P&L/Attribution** | client→strategy→date | **Client-isolated** | **Client-scoped** | Each org's P&L. Key USP: backtest↔live diff visible here. |
| **Reports/Settlement** | client→date | **Client-isolated** | **Client-scoped** | Each org's reports. |
| **Data export** | category→venue | N/A | **Premium add-on** | Optional: export to client's GCP/AWS or download. Not default. |

### Key Principle: Shared Data, Not Duplicated

Market data, features, and ML models are **shared infrastructure**. Clients don't get copies — they
access the same data feeds through the platform. If they don't need to take data out of the platform,
there's no extra cost. Data export (to their own GCP/AWS bucket or file download) is a premium add-on.

### Subscription Tiers (Mock Demo)

| Tier | Data | Features | ML | Strategy | Execution | Analytics |
|------|------|----------|----|----------|-----------|-----------|
| **data-basic** | 180 instruments, CEFI only | — | — | — | — | — |
| **data-pro** | 2400 instruments, all categories | All features | — | — | — | — |
| **execution-basic** | Via data tier | Via data tier | — | — | Basic algos (TWAP, VWAP) | — |
| **execution-full** | Via data tier | Via data tier | — | — | All algos + SOR + dark pool | TCA, fill analysis |
| **ml-full** | Via data tier | All features | All models, targets, training | — | — | Model performance |
| **strategy-full** | Via data tier | All features | All models | Full strategy suite | Full execution | Backtest↔live diff |
| **reporting** | — | — | — | — | — | P&L, settlement, attribution |

Internal users: `entitlements: ["*"]` — see everything.

### Data Export (Premium Add-On)

Clients who need data outside the platform can:
1. **Export to their cloud** (GCP bucket or AWS S3) — aligned with our cloud infrastructure
2. **Download** (CSV/Parquet) — for offline analysis

This is NOT the default. Using data within the platform is the default experience. Export is an
upsell. In the demo, show an "Export Data" button that opens a modal: "Contact sales for cloud
export pricing" with options for GCP and AWS.

---

## UI Implementation Guidance

### How to Scope API Calls

```typescript
// Always include shard dimensions
const { data } = useInstrumentRegistry({
  category: shard,      // CEFI, DEFI, TRADFI, SPORTS
  venue: selectedVenue,  // BINANCE, UNISWAP, etc.
});

// Client-scoped calls include org_id (from auth)
const { data } = usePositions({
  shard: "CEFI",
  venue: "BINANCE",
  // org_id comes from auth context — internal sees all, client sees theirs
});
```

### How to Build Shard-Aware Pages

1. **Identify which layer applies** — Is this shared data (Layer 1), client-isolated (Layer 2), or subscription-filtered (Layer 3)?
2. **Use shard selectors** — Category tabs/dropdown at top of data pipeline pages
3. **Use client selector** — Org/client dropdown at top of trading pages (read-only for clients)
4. **Show shard health** — Badge per category (online/degraded/offline)
5. **Never cross-shard** in one API call — fetch per-shard, aggregate in UI
6. **Show subscription context** — If client can't access something, show locked state with upgrade CTA

### Venue Hierarchy by Category

| Category | Venues |
|----------|--------|
| **CEFI** | BINANCE, KRAKEN, COINBASE, BYBIT, DERIBIT, CME, OTC |
| **DEFI** | UNISWAP, AAVE, HYPERLIQUID, DYDX, CURVE, MORPHO, EULER, FLUID |
| **SPORTS** | FANDUEL, DRAFTKINGS, POLYMARKET, BETFAIR, PINNACLE, ODDS_API |
| **TRADFI** | NYSE, LSE, EUREX, LIFFE |

### Sports: League-Based Sharding

Sports features are sharded by **league**, not by category. The UI should use league selectors
(EPL, La Liga, Bundesliga, etc.) rather than the category→venue pattern used by other shards.

### Common Mistakes

1. **Don't duplicate shared data per org** — Market data is shared. Don't mock separate data feeds per client.
2. **Don't build separate pages for internal vs client** — Same page, different API scope.
3. **Don't ignore batch vs live** — Some services are batch-only (ml-training, features-calendar, features-onchain). UI should show "last updated" timestamps, not real-time indicators.
4. **Don't mix venue namespaces** — `BTC/USD` on BINANCE ≠ `BTC/USD` on KRAKEN. Always scope by category + venue.
5. **Don't aggregate P&L across categories naively** — CEFI P&L is realized; DeFi includes unrealized LP positions. Show per-category first, then total with caveats.

---

**References (all paths relative to this repo root):**
- Infrastructure sharding: `lib/registry/sharding_config.yaml`
- Market categories: `context/internal-contracts/schemas/market_category.py`
- Runtime topology: `lib/registry/runtime-topology.yaml`
- System topology: `lib/registry/system-topology.json`
- Sharding SSOT: `unified-trading-pm/configs/` (canonical sharding config)
- Dimension processor: `deployment-service/deployment_service/calculators/shard_dimensions.py`
- OpenAPI spec: `lib/registry/openapi.json`
- Config registry: `lib/registry/config-registry.json`
- UI reference data (venues, instruments): `lib/registry/ui-reference-data.json`

**Version:** 2.0
**Last Updated:** 2026-03-19
