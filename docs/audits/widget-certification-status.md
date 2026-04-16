# Widget Certification Status

**Last updated:** 2026-04-16
**Spec:** [widget-certification-spec.md](widget-certification-spec.md)
**Levels:** L0 (foundation) → L1 (data) → L2 (entitlements) → L3 (modes) → L4 (functional) → L5 (strategy) → L6 (tested) = **STABLE**

---

## Legend

| Code   | Meaning                       |
| ------ | ----------------------------- |
| `—`    | Not started                   |
| `L0 ✓` | Foundation verified           |
| `L1 ✓` | Data hygiene clean            |
| `L2 ✓` | Entitlements verified (human) |
| `L3 ✓` | Mode handling verified        |
| `L4 ✓` | Functionally certified        |
| `L5 ✓` | Strategy execution confirmed  |
| `L6 ✓` | Tested — **STABLE**           |
| `🔧`   | Agent working on fixes        |

---

## Priority 1 — DeFi (16 widgets)

| Widget ID              | Label                 | Level | Known Issues (from BP-2 findings)                           |
| ---------------------- | --------------------- | ----- | ----------------------------------------------------------- |
| defi-wallet-summary    | Wallet Summary        | —     | Mock import: `MOCK_CHAIN_PORTFOLIOS`                        |
| defi-lending           | DeFi Lending          | —     | Mock import: `calculateHealthFactorDelta`, `getAssetParams` |
| defi-swap              | DeFi Swap             | —     | Mock import: `generateSwapRoute`, `getMockPrice`            |
| defi-liquidity         | Liquidity Provision   | —     |                                                             |
| defi-staking           | Staking               | —     |                                                             |
| defi-flash-loans       | Flash Loan Builder    | —     | Mock import: `SWAP_TOKENS`                                  |
| defi-transfer          | Transfer & Bridge     | —     | Mock import: `MOCK_CHAIN_PORTFOLIOS`, `getMockPrice`        |
| defi-rates-overview    | Rates Overview        | —     |                                                             |
| defi-trade-history     | Trade History         | —     |                                                             |
| defi-strategy-config   | Strategy Config       | —     | 1,157 lines (decomposed via schema-driven form)             |
| defi-staking-rewards   | Staking Rewards       | —     |                                                             |
| defi-funding-matrix    | Funding Rate Matrix   | —     | Mock import fixed (moved to defi.config.ts)                 |
| defi-waterfall-weights | Allocation Weights    | —     |                                                             |
| defi-health-factor     | Health Factor Monitor | —     |                                                             |
| defi-reward-pnl        | Reward P&L Breakdown  | —     |                                                             |
| defi-yield-chart       | Yield Performance     | —     | Mock import: yield generators                               |

---

## Priority 2 — Common Tabs: Overview (8), Terminal (8), Risk (13)

### Overview

| Widget ID       | Label                       | Level | Known Issues                                                  |
| --------------- | --------------------------- | ----- | ------------------------------------------------------------- |
| scope-summary   | Scope & Controls            | —     |                                                               |
| pnl-chart       | P&L / NAV / Exposure Charts | —     |                                                               |
| kpi-strip       | Key Metrics                 | —     | Mock import: `MOCK_PORTFOLIO_DELTA`, `STRATEGY_RISK_PROFILES` |
| strategy-table  | Strategy Performance        | —     |                                                               |
| pnl-attribution | P&L Attribution             | —     |                                                               |
| alerts-preview  | Alerts                      | —     |                                                               |
| recent-fills    | Recent Fills                | —     |                                                               |
| health-grid     | System Health               | —     |                                                               |

### Terminal

| Widget ID        | Label             | Level | Known Issues |
| ---------------- | ----------------- | ----- | ------------ |
| instrument-bar   | Instrument & Acct | —     |              |
| order-book       | Order Book        | —     |              |
| price-chart      | Price Chart       | —     |              |
| depth-chart      | Depth Chart       | —     |              |
| terminal-options | Options Chain     | —     |              |
| order-entry      | Order Entry       | —     |              |
| market-trades    | Market Trades     | —     |              |
| calendar-events  | Calendar Events   | —     |              |

### Risk

| Widget ID                 | Label                  | Level | Known Issues                                                                         |
| ------------------------- | ---------------------- | ----- | ------------------------------------------------------------------------------------ |
| risk-kpi-strip            | Risk KPIs              | —     | Mock import: `getFilledDefiOrders`, `MOCK_PORTFOLIO_DELTA`, `STRATEGY_RISK_PROFILES` |
| risk-strategy-heatmap     | Strategy Heatmap       | —     |                                                                                      |
| risk-utilization          | Highest Utilization    | —     |                                                                                      |
| risk-var-chart            | Component VaR          | —     |                                                                                      |
| risk-stress-table         | Stress Scenarios       | —     |                                                                                      |
| risk-exposure-attribution | Exposure Attribution   | —     |                                                                                      |
| risk-greeks-summary       | Portfolio Greeks       | —     |                                                                                      |
| risk-margin               | Margin & Health        | —     |                                                                                      |
| risk-term-structure       | Term Structure         | —     |                                                                                      |
| risk-limits-hierarchy     | Limits Hierarchy       | —     |                                                                                      |
| risk-what-if-slider       | What-If Slider         | —     |                                                                                      |
| risk-circuit-breakers     | Circuit Breaker Status | —     |                                                                                      |
| risk-correlation-heatmap  | Correlation Heatmap    | —     |                                                                                      |

---

## Priority 3 — Core Trading: Orders (2), Positions (2), P&L (4), Accounts (6), Alerts (3)

### Orders

| Widget ID        | Label         | Level | Known Issues |
| ---------------- | ------------- | ----- | ------------ |
| orders-kpi-strip | Order Summary | —     |              |
| orders-table     | Orders Table  | —     |              |

### Positions

| Widget ID           | Label            | Level | Known Issues |
| ------------------- | ---------------- | ----- | ------------ |
| positions-kpi-strip | Position Summary | —     |              |
| positions-table     | Positions Table  | —     |              |

### P&L

| Widget ID            | Label            | Level | Known Issues |
| -------------------- | ---------------- | ----- | ------------ |
| pnl-waterfall        | P&L Waterfall    | —     |              |
| pnl-time-series      | P&L Time Series  | —     |              |
| pnl-by-client        | P&L by Client    | —     |              |
| pnl-factor-drilldown | Factor Breakdown | —     |              |

### Accounts

| Widget ID                 | Label                 | Level | Known Issues              |
| ------------------------- | --------------------- | ----- | ------------------------- |
| accounts-kpi-strip        | NAV Summary           | —     |                           |
| accounts-balance-table    | Per-Venue Balances    | —     |                           |
| accounts-margin-util      | Margin Utilization    | —     |                           |
| accounts-transfer         | Transfer Panel        | —     |                           |
| accounts-transfer-history | Transfer History      | —     |                           |
| saft-portfolio            | SAFT & Token Warrants | —     | Mock import: `MOCK_SAFTS` |

### Alerts

| Widget ID          | Label         | Level | Known Issues |
| ------------------ | ------------- | ----- | ------------ |
| alerts-kpi-strip   | Alert Summary | —     |              |
| alerts-table       | Alert Feed    | —     |              |
| alerts-kill-switch | Kill Switch   | —     |              |

---

## Priority 4 — Execution Workflow: Strategies (9), Book (6), Bundles (5), Instructions (3)

### Strategies

| Widget ID               | Label                   | Level | Known Issues                                                 |
| ----------------------- | ----------------------- | ----- | ------------------------------------------------------------ |
| strategies-kpi-strip    | Strategy Summary        | —     |                                                              |
| strategies-catalogue    | Strategy List           | —     |                                                              |
| strategies-grid-link    | Batch Grid Link         | —     |                                                              |
| cefi-strategy-config    | CeFi/TradFi Config      | —     | 567→79 lines via schema-driven form                          |
| lending-arb-dashboard   | Lending Arb Dashboard   | —     | Fully disconnected — inline `MOCK_DATA`                      |
| liquidation-monitor     | Liquidation Monitor     | —     | Fully disconnected — inline `MOCK_POSITIONS`                 |
| active-lp-dashboard     | Active LP Dashboard     | —     | Fully disconnected — inline `MOCK_LP_POSITIONS`              |
| commodity-regime        | Commodity Regime        | —     | Fully disconnected — inline `MOCK_FACTORS`, `MOCK_POSITIONS` |
| strategy-family-browser | Strategy Family Browser | —     |                                                              |

### Book

| Widget ID               | Label                | Level | Known Issues |
| ----------------------- | -------------------- | ----- | ------------ |
| book-trade-history      | Trade History        | —     |              |
| book-hierarchy-bar      | Hierarchy Selector   | —     |              |
| book-order-form         | Book Order Entry     | —     |              |
| book-algo-config        | Algo Configuration   | —     |              |
| book-record-details     | Record Details       | —     |              |
| book-preview-compliance | Preview & Compliance | —     |              |

### Bundles

| Widget ID          | Label               | Level | Known Issues |
| ------------------ | ------------------- | ----- | ------------ |
| bundle-templates   | Bundle Templates    | —     |              |
| bundle-steps       | Execution Steps     | —     |              |
| bundle-pnl         | P&L Estimate        | —     |              |
| bundle-actions     | Bundle Actions      | —     |              |
| defi-atomic-bundle | DeFi Atomic Bundles | —     |              |

### Instructions

| Widget ID            | Label                | Level | Known Issues |
| -------------------- | -------------------- | ----- | ------------ |
| instr-summary        | Pipeline Summary     | —     |              |
| instr-pipeline-table | Instruction Pipeline | —     |              |
| instr-detail-panel   | Instruction Detail   | —     |              |

---

## Priority 5 — Domain-Specific: Markets (8), Options (9), Sports (9), Predictions (11)

### Markets

| Widget ID               | Label              | Level | Known Issues |
| ----------------------- | ------------------ | ----- | ------------ |
| markets-controls        | Markets Controls   | —     |              |
| markets-order-flow      | Market Order Flow  | —     |              |
| markets-live-book       | Live Order Book    | —     |              |
| markets-my-orders       | My Orders          | —     |              |
| markets-recon           | Reconciliation     | —     |              |
| markets-latency-summary | Latency Summary    | —     |              |
| markets-latency-detail  | Latency Detail     | —     |              |
| markets-defi-amm        | DeFi Pool Activity | —     |              |

### Options

| Widget ID             | Label               | Level | Known Issues |
| --------------------- | ------------------- | ----- | ------------ |
| options-control-bar   | Options Controls    | —     |              |
| options-watchlist     | Watchlist           | —     |              |
| options-chain         | Options Chain       | —     |              |
| options-trade-panel   | Options Trade Panel | —     |              |
| futures-table         | Futures Table       | —     |              |
| futures-trade-panel   | Futures Trade Panel | —     |              |
| options-strategies    | Strategy Builder    | —     |              |
| options-scenario      | Scenario Analysis   | —     |              |
| options-greek-surface | Greek / Vol Surface | —     |              |

### Sports

| Widget ID             | Label             | Level | Known Issues                                                 |
| --------------------- | ----------------- | ----- | ------------------------------------------------------------ |
| sports-fixtures       | Fixtures          | —     |                                                              |
| sports-fixture-detail | Fixture Detail    | —     |                                                              |
| sports-arb            | Arb Scanner       | —     |                                                              |
| sports-my-bets        | My Bets           | —     |                                                              |
| sports-live-scores    | Live Scores       | —     |                                                              |
| sports-standings      | Standings         | —     | Mock import: `MOCK_STANDINGS`                                |
| sports-clv            | CLV Performance   | —     | Mock import: `MOCK_CLV_RECORDS`                              |
| sports-predictions    | Model Predictions | —     | Mock import: `MOCK_FIXTURES`, `MOCK_PREDICTIONS`             |
| sports-ml-status      | ML Pipeline       | —     | Mock import: `MOCK_MODEL_FAMILIES`, `MOCK_FEATURE_FRESHNESS` |

### Predictions

| Widget ID              | Label             | Level | Known Issues |
| ---------------------- | ----------------- | ----- | ------------ |
| pred-markets-grid      | Markets           | —     |              |
| pred-market-detail     | Market Detail     | —     |              |
| pred-portfolio-kpis    | Portfolio KPIs    | —     |              |
| pred-open-positions    | Open Positions    | —     |              |
| pred-settled-positions | Settled Positions | —     |              |
| pred-odum-focus        | ODUM Focus        | —     |              |
| pred-arb-stream        | Arb Stream        | —     |              |
| pred-arb-closed        | Closed Arbs       | —     |              |
| pred-trade-panel       | Quick Trade       | —     |              |
| pred-top-markets       | Top Markets       | —     |              |
| pred-recent-fills      | Recent Trades     | —     |              |

---

## Summary

| Priority  | Domains                                  | Widgets | L0 ✓ | L1 ✓ | L2 ✓ | L3 ✓ | L4 ✓ | L5 ✓ | L6 ✓ |
| --------- | ---------------------------------------- | ------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| 1         | DeFi                                     | 16      | 0    | 0    | 0    | 0    | 0    | 0    | 0    |
| 2         | Overview, Terminal, Risk                 | 29      | 0    | 0    | 0    | 0    | 0    | 0    | 0    |
| 3         | Orders, Positions, P&L, Accounts, Alerts | 17      | 0    | 0    | 0    | 0    | 0    | 0    | 0    |
| 4         | Strategies, Book, Bundles, Instructions  | 23      | 0    | 0    | 0    | 0    | 0    | 0    | 0    |
| 5         | Markets, Options, Sports, Predictions    | 37      | 0    | 0    | 0    | 0    | 0    | 0    | 0    |
| **Total** |                                          | **122** | 0    | 0    | 0    | 0    | 0    | 0    | 0    |
