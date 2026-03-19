# Sharding Dimensions for Unified Trading System

## Overview

Data availability, configuration, and capacity in the Unified Trading System is **sharded** — partitioned across dimensions.

When building the UI, understanding sharding dimensions tells you:
- **Data availability:** "Am I looking at the right subset of data?"
- **Configuration grouping:** "Is this config per-venue? Per-shard? Global?"
- **Capacity planning:** "How is load distributed?"

---

## 1. Primary Sharding Dimensions

### Dimension 1: **Shard** (Trading Domain)

Services are sharded by **market domain**. Each shard is independently deployed, scaled, and configured.

| Shard | Name | Markets | Examples |
|-------|------|---------|----------|
| **CEFI** | Centralized Finance | Spot, Futures, Options | Binance, Kraken, CME, OTC |
| **DeFi** | Decentralized Finance | DEXs, Lending, Staking | Aave, Uniswap, Hyperliquid, dYdX |
| **Sports** | Sports & Prediction | Sports betting, prediction markets | FanDuel, DraftKings, Polymarket |
| **TradFi** | Traditional Finance | Equities, Bonds, FX | NYSE, LSE, EUREX, FX dealers |
| **OnChain** | On-Chain Perps | Perpetual futures on-chain | Hyperliquid (on-chain), dYdX v4 |

**In the UI:**
- Many screens are shard-specific (e.g., "DeFi Positions", "Sports Betting")
- If showing all shards, make shard clear in the UI (badge, label, color)
- Some metrics are **per-shard** (e.g., risk limits, position limits, P&L)

**Example:** Risk dashboard might show:
```
┌─ CEFI Risk
│  ├─ Max daily loss: $100K (global config)
│  ├─ Max position: 5% (per-venue, Binance specific)
│
├─ DeFi Risk
│  ├─ Max daily loss: $50K (lower risk tolerance)
│  ├─ Slippage target: 50 bps (per-protocol)
│
└─ Sports Risk
   ├─ Max daily loss: $10K
   └─ Max position: 1% of bankroll
```

### Dimension 2: **Venue** (Exchange / Market)

Within each shard, data is partitioned by **venue** (exchange, DEX, bookmaker, etc.).

#### CEFI Venues

| Venue | Type | Region | API | Specialization |
|-------|------|--------|-----|-----------------|
| **BINANCE** | CEX | Global | RESTful | Largest spot + futures |
| **KRAKEN** | CEX | Europe | RESTful | Institutional, low fees |
| **COINBASE** | CEX | US | RESTful | US retail/institutional |
| **BYBIT** | CEX | Global | WebSocket | Derivatives, fast fills |
| **DERIBIT** | Derivatives | Europe | WebSocket | Options (Ethereum) |
| **CME** | Derivatives | US | FIX | Traditional futures (BTC/ETH) |
| **OTC** | OTC Desk | Global | Custom | Large block trades |

#### DeFi Venues

| Venue | Type | Chain | Protocol |
|-------|------|-------|----------|
| **UNISWAP** | DEX | Ethereum | Automated market maker |
| **AAVE** | Lending | Ethereum | Lending protocol |
| **HYPERLIQUID** | Perps | Solana | On-chain perpetuals |
| **DYDX** | Perps | Cosmos | Cross-chain perps |
| **CURVE** | Stableswap | Ethereum | Stablecoin specialization |

#### Sports Venues

| Venue | Type | Markets |
|-------|------|---------|
| **FANDUEL** | Bookmaker | US sports |
| **DRAFTKINGS** | Bookmaker | US sports, betting lines |
| **POLYMARKET** | Prediction | Political, event outcomes |

#### TradFi Venues

| Venue | Type | Region |
|-------|------|--------|
| **NYSE** | Equity | US |
| **LSE** | Equity | UK |
| **EUREX** | Futures | EU |
| **LIFFE** | Derivatives | EU |

**In the UI:**
- Positions, orders, fills are always **per-venue**
- When showing cross-venue data, aggregate carefully (P&L is per-venue, then summed)
- Venue-specific parameters (fees, tick sizes, limits) come from configuration

### Dimension 3: **Instrument** (Asset / Product)

Within a venue, data is partitioned by **instrument**.

| Type | Examples | Venues |
|------|----------|--------|
| **Spot** | BTC/USD, ETH/USD, AAPL/USD | CEFI, TradFi |
| **Futures** | BTC-PERP-USD, ES (S&P 500) | CEFI, TradFi |
| **Options** | BTC-USD-C-50000, SPY-USD-C-450 | DERIBIT, CME |
| **Sports** | MLB-Team-A-vs-Team-B | Sports venues |
| **Lending** | USDC-lending-Aave | DeFi |
| **LP Token** | UNI-V3-ETH-USDC-0.30% | DeFi |

**In the UI:**
- Instruments are typically **filtered, not paginated** (use dropdowns, search, favorites)
- Instrument metadata (decimal places, min/max order size) from config
- P&L, positions, orders grouped by instrument

### Dimension 4: **Organization / Client** (Account Segmentation)

Some data is partitioned by **organization** (client account).

**In single-account operation:**
- You typically work with one org at a time

**In multi-account internal operations:**
- May see data across orgs (admin view)
- Shard + venue + instrument + org = unique data point

**In the UI:**
- Multi-client UIs have org selector at top
- Role determines if you can see other orgs
- Dashboard filters include org selector for internal users

---

## 2. Sharding in Key Services

### Market Data Service

**Sharding:** Shard → Venue → Instrument → Timeframe

```
Market Data Service
├─ CEFI shard
│  ├─ BINANCE venue
│  │  ├─ BTC/USD (1m, 5m, 1h, 1d candles; L2 book; trades)
│  │  └─ ETH/USD (1m, 5m, 1h, 1d candles; L2 book; trades)
│  └─ KRAKEN venue
│     └─ BTC/USD (different candles, different book depth)
│
└─ DeFi shard
   ├─ UNISWAP venue
   │  └─ ETH/USDC (CPMM pricing, TVL, fees)
   └─ AAVE venue
      └─ USDC (deposit/borrow rates, utilization, risk params)
```

**UI relevance:**
- Data catalogue: Filter by shard → venue → instrument
- Backtesting: Select shard/venue/instrument combo
- Real-time monitoring: Subscribe per-shard to avoid overload

### Execution Service

**Sharding:** Shard → Venue → Account (optional multi-account)

```
Execution Service
├─ CEFI shard
│  ├─ BINANCE account
│  │  ├─ Open orders (BTC/USD, ETH/USD, ...)
│  │  ├─ Fills (execution history)
│  │  └─ Positions (spot holdings, margin)
│  │
│  └─ KRAKEN account
│     └─ (same structure)
│
└─ DeFi shard
   ├─ UNISWAP protocol
   │  └─ Pending transactions, swap quotes
   └─ AAVE protocol
      └─ Lending positions, collateral
```

**UI relevance:**
- Order placement: Shard → Venue → Instrument → Amount
- Positions dashboard: Show per-shard summary, expandable per-venue
- Order history: Filter by shard/venue date range

### Strategy Service

**Sharding:** Shard → Strategy Instance → Venue Constraints

```
Strategy Service
├─ CEFI shard
│  ├─ Strategy A (BTC carry trade)
│  │  ├─ Config per BINANCE
│  │  ├─ Config per KRAKEN
│  │  └─ Config per OTC (venue-specific overrides)
│  │
│  └─ Strategy B (Stat arb)
│     └─ (shard-level config)
│
└─ DeFi shard
   ├─ Strategy C (Yield farming)
   │  ├─ Config per UNISWAP
   │  ├─ Config per AAVE
   │  └─ Config per CURVE
```

**UI relevance:**
- Strategy dashboard: Shard-aware (CEFI strategies separate from DeFi)
- Configuration: Per-shard config + per-venue overrides
- P&L attribution: Break down by shard, then venue

### Risk Service

**Sharding:** Shard → Risk Dimension (per-venue limits, cross-venue correlation, shard-level exposure)

```
Risk Dashboard
├─ CEFI Risk
│  ├─ Shard-level exposure: $5M (total)
│  ├─ Per-venue limits: BINANCE $2M, KRAKEN $1.5M, OTC $1.5M
│  ├─ Cross-venue correlation (BINANCE ↔ KRAKEN)
│  └─ Per-instrument concentration: BTC 30%, ETH 20%, ...
│
├─ DeFi Risk
│  ├─ Shard-level exposure: $2M
│  ├─ Per-protocol limits: UNISWAP $1M, AAVE $1M
│  ├─ Smart contract risk (UNISWAP v3 vs v2)
│  └─ Slippage risk per-protocol
│
└─ Sports Risk
   ├─ Shard-level exposure: $100K
   ├─ Per-venue limits
   └─ Bet correlation risk
```

**UI relevance:**
- Risk dashboard is **always shard-first** (shows CEFI, DeFi, Sports separately)
- Within each shard, show per-venue breakdown
- Alert thresholds configured per-shard

---

## 3. Data Availability Implications

### Implication 1: Real-Time vs Batch

Different shards have different **data freshness guarantees**:

| Shard | Real-Time | Batch | Frequency |
|-------|-----------|-------|-----------|
| **CEFI** | WebSocket (sub-100ms) | OHLCV candles | 1min, 5min, 1hr, 1d |
| **DeFi** | Event logs (per-block) | Quotes | Per-block (~12s) |
| **TradFi** | REST polling | End-of-day | Daily |
| **Sports** | API polling | Historical | 1-5min |

**In the UI:**
- CEFI dashboard: Can show real-time positions, fills, order book
- DeFi dashboard: Block-based updates (less frequent)
- TradFi dashboard: EOD updates sufficient
- Show data freshness timestamp to users

### Implication 2: Shard Failure Isolation

If one shard fails:
- Other shards continue unaffected
- UI should show shard-level health status
- Don't block entire dashboard if DeFi shard is down; just mark it unavailable

**In the UI:**
```
CEFI     ✅ Online
DeFi     ⚠️  Degraded (Event service latency)
Sports   ✅ Online
TradFi   ⚠️  Offline (Scheduled maintenance)
```

### Implication 3: Data Scoping

When fetching data, specify **shard + venue + instrument**:

```typescript
// Good
fetchPositions({ shard: 'CEFI', venue: 'BINANCE' })

// Bad (ambiguous)
fetchPositions({ symbol: 'BTC/USD' })  // which shard? which venue?
```

---

## 4. Configuration by Shard

Different shards have **different configuration**:

```python
class ExecutionServiceConfig:
    # Global config
    default_timeout_ms: int = 5000

    # Shard-specific config
    shards: dict[str, ShardExecutionConfig] = {
        "CEFI": ShardExecutionConfig(
            max_position_pct=5.0,  # 5% of portfolio
            preferred_venues=["BINANCE", "KRAKEN"],
            smart_order_routing=True,
        ),
        "DeFi": ShardExecutionConfig(
            max_position_pct=2.0,  # More conservative
            slippage_target_bps=50,  # Slippage matters in DeFi
            router="1INCH",
        ),
        "Sports": ShardExecutionConfig(
            max_position_pct=0.5,  # Very conservative
            max_single_bet=10000,
        ),
    }
```

**In the UI:**
- When configuring risk limits, ask: "For which shard?"
- Configuration form should have shard selector
- Show shard-specific defaults and constraints

---

## 5. Common Sharding Mistakes

### Mistake 1: Ignoring Shard When Aggregating P&L

```typescript
// ❌ WRONG: P&L by shard are NOT directly comparable
const totalPnL = shards.CEFI.pnl + shards.DeFi.pnl
// CEFI P&L is realized (closed positions)
// DeFi P&L includes unrealized (active LP positions)
// Not directly comparable!

// ✅ CORRECT: Understand shard semantics
const totalRealized = shards.CEFI.realized_pnl + shards.DeFi.realized_pnl
const totalUnrealized = shards.CEFI.unrealized_pnl + shards.DeFi.unrealized_pnl
const totalPnL = totalRealized + totalUnrealized
```

### Mistake 2: Mixing Venue Namespaces

```typescript
// ❌ WRONG: Treating venues as globally unique
positions['BTC/USD']  // which venue? BINANCE or KRAKEN?

// ✅ CORRECT: Always scope by shard + venue
positions['CEFI']['BINANCE']['BTC/USD']
positions['CEFI']['KRAKEN']['BTC/USD']
```

### Mistake 3: Ignoring Configuration Shards

```typescript
// ❌ WRONG: Using global config for all shards
const maxPosition = config.max_position_pct  // 5%
// But DeFi should be 2%!

// ✅ CORRECT: Use shard-specific config
const maxPosition = config.shards[shard].max_position_pct
// For CEFI: 5%, for DeFi: 2%, for Sports: 0.5%
```

---

## 6. Sharding by Service

### API Services

- **Market Data API:** Shard + Venue + Instrument + Timeframe
- **Config API:** Shard (some configs are shard-specific)
- **Trading Analytics API:** Shard + Venue + TimeRange

### Core Services

- **Execution:** Shard + Venue (per-shard execution engines)
- **Risk:** Shard (per-shard risk models, limits, correlation)
- **Strategy:** Shard (strategies don't cross shards)
- **Alerting:** Shard (alerts are shard-aware)

### Feature Services

- **Features Sports:** Sports shard only
- **Features DeFi:** DeFi shard only
- **Features Liquidity:** Shard-agnostic (all)
- **Features Volatility:** Shard-agnostic

---

## 7. Quick Reference: Sharding by UI Screen

| Screen | Shards | Grouping | Notes |
|--------|--------|----------|-------|
| **Dashboard** | All | Shard tabs or cards | Shard selector at top |
| **Positions** | All | Shard → Venue → Instrument | Show shard badge |
| **Orders** | All | Shard → Venue | Filter by shard |
| **Risk Limits** | All | Shard → Config section | Different limits per shard |
| **Strategy Config** | Single | Shard-specific | Create separate UIs per shard |
| **Backtesting** | Single | Shard selector → venue → instrument | One shard per backtest |
| **Data Catalogue** | All | Shard → Venue → Instrument | Hierarchical browse |
| **Alerts** | All | Shard-specific rules | Alert type varies by shard |

---

## 8. Sharding Registry

**Source:** `unified-trading-pm/workspace-manifest.json`

Each service declares its sharding model:

```json
{
  "service": "execution-service",
  "sharding_dimensions": ["shard", "venue"],
  "shards": ["CEFI", "DeFi", "Sports", "TradFi"],
  "venues_per_shard": {
    "CEFI": ["BINANCE", "KRAKEN", "COINBASE", "BYBIT", "CME", "OTC"],
    "DeFi": ["UNISWAP", "AAVE", "HYPERLIQUID", "DYDX", "CURVE"],
    "Sports": ["FANDUEL", "DRAFTKINGS", "POLYMARKET"],
    "TradFi": ["NYSE", "LSE", "EUREX", "LIFFE"]
  }
}
```

**To find sharding info:**
1. Open `unified-trading-pm/workspace-manifest.json`
2. Search for service name
3. Look for `sharding_dimensions` and `shards`

---

## 9. For Agents Building UI

### Before building any data view:

1. **Identify the shard(s):** "Is this CEFI? Multi-shard?"
2. **Identify the venue:** "Which venue(s) in that shard?"
3. **Identify the instrument:** "Specific or all instruments?"
4. **Check the sharding registry:** Confirm shard list matches manifest
5. **Use shard-aware selectors:** Add shard/venue dropdown filters
6. **Show shard context:** Badge or label to remind user which shard they're viewing

### Example: Building a Positions Table

```typescript
// Component
<PositionsTable
  shard="CEFI"                    // ← Required
  venues={["BINANCE", "KRAKEN"]}  // ← Filter venues
  instrument="BTC/USD"            // ← Or null for all
/>

// Inside component:
// 1. Fetch positions for shard+venues
// 2. Group by shard → venue → instrument
// 3. Render table with shard context visible
// 4. Show shard-specific config (limits, etc.)
```

---

**Version:** 1.0
**Last Updated:** 2026-03-19
**Maintainer:** Unified Trading System UI Team
