# Widget Catalogue

Maps every registered widget to its UI tab, source file, UI class, chart library, and purpose.

**UI Tab → URL:** `/services/trading/<tab-id>`
**Source path:** all files are under `components/widgets/<folder>/`
**Last audited:** 2026-04-16 (updated with 10 new widgets from `ab98f92` + `64153fd`)

> **Markets tab** was not in the left-nav (`TRADING_TABS`). Added as a first-class tab (icon: Activity, after Terminal) on 2026-04-13.

---

## Class Legend

| Class              | Description                                                       | Base widget / lib                           | Count |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------- | ----- |
| **kpi-strip**      | KPI metric cards with layout mode dropdown                        | `KpiSummaryWidget` / `KpiStrip` (shared)    | 9     |
| **data-table**     | Typed table with sort, row click, sticky col                      | `DataTableWidget<T>` (shared)               | 2     |
| **inline-table**   | Ad-hoc table (not using DataTableWidget base)                     | none — bespoke `<table>` / map              | 18    |
| **live-feed**      | Streaming row feed with auto-scroll                               | `LiveFeedWidget` + `useLiveFeed` (shared)   | 8     |
| **filter-grid**    | Filterable card/row grid with `FilterBar`                         | `FilterBar` (shared — may be demoted)       | 2     |
| **recharts-chart** | Chart rendered with recharts (Area/Bar/Line/Pie)                  | `recharts`                                  | 10    |
| **lw-chart**       | Chart rendered with lightweight-charts (candlestick, high-volume) | `lightweight-charts` via `CandlestickChart` | 1     |
| **form**           | Input form (order entry, config, transfer, DeFi ops)              | none — candidate for base                   | 16    |
| **card-grid**      | Card layout (templates, status cards, portfolio)                  | none — candidate for base                   | 8     |
| **detail-panel**   | Master-detail / drill-down panel                                  | none — candidate for base                   | 10    |
| **control-bar**    | Toolbar / selector strip / filter controls                        | none — candidate for base                   | 7     |
| **heatmap**        | Matrix / grid heatmap (correlation, funding)                      | none — no base needed (see § 7 audit)       | 2     |
| **waterfall**      | Waterfall / stacked attribution bars                              | none — bespoke                              | 3     |
| **action-panel**   | CTA buttons / single-action widget                                | none — bespoke                              | 2     |
| **bespoke**        | Unique composite — no clear class match                           | none                                        | 11    |
| **order-book**     | Bid/ask ladder with depth                                         | none — candidate for base                   | 3     |

**Chart library policy:** `lightweight-charts` for candlestick / high-volume historical data. `recharts` for simple histograms, area, bar, pie. Final choice per widget based on rendering performance vs visual quality.

---

## Overview tab (`/services/trading/overview`)

| Widget ID         | Display Name                | Class       | Chart Lib | File                                  | Description                                                         |
| ----------------- | --------------------------- | ----------- | --------- | ------------------------------------- | ------------------------------------------------------------------- |
| `scope-summary`   | Scope & Controls            | control-bar | —         | `overview/scope-summary-widget.tsx`   | Global scope summary with intervention controls and terminal link   |
| `kpi-strip`       | Key Metrics                 | kpi-strip   | —         | `overview/kpi-strip-widget.tsx`       | P&L, exposure, margin, live strategies, alerts at a glance          |
| `pnl-chart`       | P&L / NAV / Exposure Charts | bespoke     | recharts  | `overview/pnl-chart-widget.tsx`       | Live vs batch time series comparison with drift analysis            |
| `strategy-table`  | Strategy Performance        | live-feed   | —         | `overview/strategy-table-widget.tsx`  | Filterable strategy table grouped by asset class with real-time P&L |
| `pnl-attribution` | P&L Attribution             | waterfall   | —         | `overview/`                           | Breakdown of P&L by factor: funding, carry, basis, delta, etc.      |
| `alerts-preview`  | Alerts                      | card-grid   | —         | `overview/bottom-widgets.tsx`         | Recent critical and high alerts with severity indicators            |
| `recent-fills`    | Recent Fills                | card-grid   | —         | `overview/bottom-widgets.tsx`         | Latest order fills with side, instrument, and status                |
| `health-grid`     | System Health               | card-grid   | —         | `overview/bottom-widgets.tsx`         | Service health grid showing status of platform services             |
| `calendar-events` | Calendar Events             | bespoke     | —         | `terminal/calendar-events-widget.tsx` | Economic calendar and corporate actions feed _(also on Terminal)_   |

---

## Terminal tab (`/services/trading/terminal`)

| Widget ID          | Display Name         | Class       | Chart Lib          | File                                   | Description                                                                 |
| ------------------ | -------------------- | ----------- | ------------------ | -------------------------------------- | --------------------------------------------------------------------------- |
| `instrument-bar`   | Instrument & Account | control-bar | —                  | `terminal/instrument-bar-widget.tsx`   | Instrument selector, account picker, live price, quick actions              |
| `price-chart`      | Price Chart          | lw-chart    | lightweight-charts | `terminal/price-chart-widget.tsx`      | Candlestick and line chart with technical indicators and timeframe controls |
| `depth-chart`      | Depth Chart          | order-book  | —                  | `terminal/depth-chart-widget.tsx`      | Market depth visualization showing cumulative bid/ask volume                |
| `terminal-options` | Options Chain        | bespoke     | —                  | `terminal/terminal-options-widget.tsx` | Options chain and volatility surface for the selected underlying            |
| `order-book`       | Order Book           | order-book  | —                  | `terminal/order-book-widget.tsx`       | Live bid/ask ladder with depth visualization                                |
| `order-entry`      | Order Entry          | form        | —                  | `terminal/order-entry-widget.tsx`      | Buy/sell order form with strategy linking and constraint validation         |
| `market-trades`    | Market Trades        | live-feed   | —                  | `terminal/market-trades-widget.tsx`    | Real-time market trades and own trade history                               |
| `calendar-events`  | Calendar Events      | bespoke     | —                  | `terminal/calendar-events-widget.tsx`  | Economic calendar and corporate actions feed _(also on Overview)_           |

---

## Book tab (`/services/trading/book`)

| Widget ID            | Display Name       | Class        | Chart Lib | File                                 | Description                                                                                                  |
| -------------------- | ------------------ | ------------ | --------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `book-hierarchy-bar` | Hierarchy Selector | control-bar  | —         | `book/book-hierarchy-bar-widget.tsx` | Org → Client → Strategy selector strip                                                                       |
| `book-order-entry`   | Book Order Entry   | form         | —         | `book/book-order-entry-widget.tsx`   | Full booking workflow: form body, algo config, record-only details, preview & compliance (merged 2026-04-22) |
| `book-trade-history` | Trade History      | inline-table | —         | `book/book-trade-history-widget.tsx` | Table of executed trades with search, sort, and filtering                                                    |

---

## Orders tab (`/services/trading/orders`)

| Widget ID          | Display Name  | Class        | Chart Lib | File                                 | Description                                                                  |
| ------------------ | ------------- | ------------ | --------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| `orders-kpi-strip` | Order Summary | kpi-strip    | —         | `orders/orders-kpi-strip-widget.tsx` | 6 KPIs: total, open, partial, filled, rejected, failed order counts          |
| `orders-table`     | Orders Table  | inline-table | —         | `orders/orders-table-widget.tsx`     | Full orders table with integrated filters, sorting, cancel and amend actions |

---

## Positions tab (`/services/trading/positions`)

| Widget ID             | Display Name     | Class        | Chart Lib | File                                   | Description                                                                       |
| --------------------- | ---------------- | ------------ | --------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| `positions-kpi-strip` | Position Summary | kpi-strip    | —         | `positions/positions-kpi-widget.tsx`   | 6 KPIs: count, notional, unrealized P&L, margin, long/short exposure              |
| `positions-table`     | Positions Table  | inline-table | —         | `positions/positions-table-widget.tsx` | Main positions table with filters, instrument links, side, P&L, trades drill-down |

---

## Alerts tab (`/services/trading/alerts`)

| Widget ID            | Display Name  | Class        | Chart Lib | File                                   | Description                                                             |
| -------------------- | ------------- | ------------ | --------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `alerts-kpi-strip`   | Alert Summary | kpi-strip    | —         | `alerts/alerts-kpi-strip-widget.tsx`   | Active count, critical count, avg resolution, 24h total                 |
| `alerts-table`       | Alert Feed    | inline-table | —         | `alerts/alerts-table-widget.tsx`       | Filterable alert table with severity, entity, actions, detail sheet     |
| `alerts-kill-switch` | Kill Switch   | action-panel | —         | `alerts/alerts-kill-switch-widget.tsx` | Emergency intervention panel: scope, actions, rationale, impact preview |

---

## Risk tab (`/services/trading/risk`)

| Widget ID                   | Display Name           | Class          | Chart Lib | File                                        | Description                                                                                     |
| --------------------------- | ---------------------- | -------------- | --------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `risk-kpi-strip`            | Risk KPIs              | kpi-strip      | recharts  | `risk/risk-kpi-strip-widget.tsx`            | 9 metrics + sparklines: P&L, exposure, margin%, VaR95, ES95, alerts, VaR99, ES99, kill switches |
| `risk-strategy-heatmap`     | Strategy Heatmap       | bespoke        | —         | `risk/risk-strategy-heatmap-widget.tsx`     | Strategy risk status with CB trip/reset, scale, and kill actions (reclassified from heatmap)    |
| `risk-utilization`          | Highest Utilization    | waterfall      | —         | `risk/risk-utilization-widget.tsx`          | Top N limits ranked by utilization with limit bars                                              |
| `risk-var-chart`            | Component VaR          | recharts-chart | recharts  | `risk/risk-var-chart-widget.tsx`            | Horizontal bar chart: marginal VaR contribution by position                                     |
| `risk-stress-table`         | Stress Scenarios       | inline-table   | —         | `risk/risk-stress-table-widget.tsx`         | Historical stress scenario table with multiplier, P&L, breaches, on-demand stress test          |
| `risk-exposure-attribution` | Exposure Attribution   | recharts-chart | recharts  | `risk/risk-exposure-attribution-widget.tsx` | Grouped exposure table with stacked time series                                                 |
| `risk-greeks-summary`       | Portfolio Greeks       | recharts-chart | recharts  | `risk/risk-greeks-summary-widget.tsx`       | 5 Greek cards, per-position table, time series, second-order risks                              |
| `risk-margin`               | Margin & Health        | recharts-chart | recharts  | `risk/risk-margin-widget.tsx`               | CeFi margin bars, SPAN summary, DeFi HF, distance to liquidation                                |
| `risk-term-structure`       | Term Structure         | recharts-chart | recharts  | `risk/risk-term-structure-widget.tsx`       | Stacked bar chart: exposure by maturity bucket                                                  |
| `risk-limits-hierarchy`     | Limits Hierarchy       | inline-table   | —         | `risk/risk-limits-hierarchy-widget.tsx`     | Interactive 6-level hierarchy tree table and all limits detail                                  |
| `risk-what-if-slider`       | What-If Slider         | bespoke        | —         | `risk/risk-what-if-slider-widget.tsx`       | BTC price shock slider with estimated PnL via delta + gamma approximation                       |
| `risk-circuit-breakers`     | Circuit Breaker Status | card-grid      | —         | `risk/risk-circuit-breakers-widget.tsx`     | Per-venue circuit breaker cards with status badges                                              |
| `risk-correlation-heatmap`  | Correlation Heatmap    | heatmap        | —         | `risk/risk-correlation-heatmap-widget.tsx`  | Asset correlation matrix heatmap (self-contained, dynamic import)                               |

---

## P&L tab (`/services/trading/pnl`)

| Widget ID              | Display Name     | Class          | Chart Lib | File                                  | Description                                                      |
| ---------------------- | ---------------- | -------------- | --------- | ------------------------------------- | ---------------------------------------------------------------- |
| `pnl-controls`         | P&L Controls     | control-bar    | —         | `pnl/pnl-controls-widget.tsx`         | View mode, live/batch, date range, group-by, data mode badge     |
| `pnl-waterfall`        | P&L Waterfall    | waterfall      | —         | `pnl/pnl-waterfall-widget.tsx`        | Structural P&L, factor bars with drill-down, residual, net total |
| `pnl-time-series`      | P&L Time Series  | recharts-chart | recharts  | `pnl/pnl-time-series-widget.tsx`      | Stacked area chart of ten factors over time                      |
| `pnl-by-client`        | P&L by Client    | inline-table   | —         | `pnl/pnl-by-client-widget.tsx`        | Client-level P&L with org, strategy count, change percent        |
| `pnl-factor-drilldown` | Factor Breakdown | recharts-chart | recharts  | `pnl/pnl-factor-drilldown-widget.tsx` | Per-strategy breakdown for selected factor plus mini time series |
| `pnl-report-button`    | P&L Report       | action-panel   | —         | `pnl/pnl-report-button-widget.tsx`    | Placeholder CTA to generate a P&L report                         |

---

## Accounts tab (`/services/trading/accounts`)

| Widget ID                   | Display Name          | Class        | Chart Lib | File                                            | Description                                                     |
| --------------------------- | --------------------- | ------------ | --------- | ----------------------------------------------- | --------------------------------------------------------------- |
| `accounts-kpi-strip`        | NAV Summary           | kpi-strip    | —         | `accounts/accounts-kpi-widget.tsx`              | Total NAV, available (free), locked (in use) across venues      |
| `accounts-balance-table`    | Per-Venue Balances    | inline-table | —         | `accounts/accounts-balance-table-widget.tsx`    | Free, locked, total, margin, utilization per venue              |
| `accounts-margin-util`      | Margin Utilization    | bespoke      | —         | `accounts/accounts-margin-util-widget.tsx`      | Margin utilization bars, trend, margin-call distance per venue  |
| `accounts-transfer`         | Transfer Panel        | form         | —         | `accounts/accounts-transfer-widget.tsx`         | Venue-to-venue, sub-account, withdraw, deposit flows            |
| `accounts-transfer-history` | Transfer History      | inline-table | —         | `accounts/accounts-transfer-history-widget.tsx` | Recent transfers with status and transaction references         |
| `saft-portfolio`            | SAFT & Token Warrants | card-grid    | —         | `accounts/saft-portfolio-widget.tsx`            | SAFT portfolio, vesting timeline, treasury tracking (demo data) |

---

## Strategies tab (`/services/trading/strategies`)

| Widget ID                 | Display Name                | Class        | Chart Lib | File                                            | Description                                                                                                              |
| ------------------------- | --------------------------- | ------------ | --------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `strategies-kpi-strip`    | Strategy Summary            | kpi-strip    | —         | `strategies/strategies-kpi-widget.tsx`          | Active count, total AUM, total P&L, MTD P&L with execution mode badge                                                    |
| `strategies-catalogue`    | Strategy List               | card-grid    | —         | `strategies/strategies-catalogue-widget.tsx`    | Grouped card grid with filters, performance metrics, sparklines, action links                                            |
| `strategies-grid-link`    | Batch Grid Link             | action-panel | —         | `strategies/strategies-grid-link-widget.tsx`    | CTA to open DimensionalGrid for batch analysis                                                                           |
| `cefi-strategy-config`    | CeFi/TradFi Strategy Config | form         | —         | `strategies/cefi-strategy-config-widget.tsx`    | Configure CeFi, TradFi, Options, Prediction strategies — momentum, mean-rev, ML, stat-arb, cross-exchange, market-making |
| `strategy-family-browser` | Strategy Family Browser     | card-grid    | —         | `strategies/strategy-family-browser-widget.tsx` | Browse all 65+ strategy types across DeFi, CeFi, TradFi, Sports — grouped by family with configurable parameters         |
| `lending-arb-dashboard`   | Lending Arb Dashboard       | inline-table | —         | `strategies/lending-arb-dashboard-widget.tsx`   | Cross-protocol lending rate comparison with spread and utilization tracking across Aave, Morpho, Compound, Kamino        |
| `liquidation-monitor`     | Liquidation Monitor         | inline-table | —         | `strategies/liquidation-monitor-widget.tsx`     | Real-time cascade risk monitor showing at-risk DeFi positions, health factors, and liquidation price proximity           |
| `active-lp-dashboard`     | Active LP Dashboard         | inline-table | —         | `strategies/active-lp-dashboard-widget.tsx`     | Concentrated liquidity position tracker with TVL, fees, impermanent loss, and range status monitoring                    |
| `commodity-regime`        | Commodity Regime            | detail-panel | —         | `strategies/commodity-regime-widget.tsx`        | Regime detection dashboard with factor scores, signals, and active commodity positions with P&L tracking                 |

---

## Instructions tab (`/services/trading/instructions`)

| Widget ID              | Display Name         | Class        | Chart Lib | File                                                  | Description                                                          |
| ---------------------- | -------------------- | ------------ | --------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| `instr-summary`        | Pipeline Summary     | kpi-strip    | —         | `instructions/instructions-summary-widget.tsx`        | Total instructions, filled, partial, pending, average slippage       |
| `instr-pipeline-table` | Instruction Pipeline | live-feed    | —         | `instructions/instructions-pipeline-table-widget.tsx` | Signal, instruction, fill columns with filters and expandable detail |
| `instr-detail-panel`   | Instruction Detail   | detail-panel | —         | `instructions/instructions-detail-panel-widget.tsx`   | Persistent detail for the selected instruction (master-detail)       |

---

## DeFi tab (`/services/trading/defi`) and sub-tabs

> All DeFi widgets share `availableOn: ["defi"]`. The DeFi family in the nav has three pages: **DeFi** (main), **Bundles**, and **Staking** — but widget `availableOn` does not currently distinguish between them; all are shown on the main DeFi page.

| Widget ID                | Display Name          | Class        | Chart Lib | File                                     | Description                                                               |
| ------------------------ | --------------------- | ------------ | --------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| `defi-wallet-summary`    | Wallet Summary        | bespoke      | —         | `defi/defi-wallet-summary-widget.tsx`    | KPI strip + chain selector + token balances (composite)                   |
| `defi-lending`           | DeFi Lending          | form         | —         | `defi/defi-lending-widget.tsx`           | Protocol selector, lend/borrow/withdraw/repay, APY, health factor preview |
| `defi-swap`              | DeFi Swap             | form         | —         | `defi/defi-swap-widget.tsx`              | Token pair, amount, slippage, route with price impact and gas             |
| `defi-liquidity`         | Liquidity Provision   | form         | —         | `defi/defi-liquidity-widget.tsx`         | Add/remove liquidity, pool selector, fee tier, price range, TVL/APR       |
| `defi-staking`           | Staking               | form         | —         | `defi/defi-staking-widget.tsx`           | Stake/unstake, protocol APY, yield, TVL, unbonding                        |
| `defi-flash-loans`       | Flash Loan Builder    | form         | —         | `defi/defi-flash-loans-widget.tsx`       | Multi-step flash bundle, borrow/repay legs, P&L preview                   |
| `defi-transfer`          | Transfer & Bridge     | form         | —         | `defi/defi-transfer-widget.tsx`          | Send on one chain or bridge cross-chain with gas estimate                 |
| `defi-rates-overview`    | Rates Overview        | inline-table | —         | `defi/defi-rates-overview-widget.tsx`    | Protocol APY comparison across lending, staking, LP yields                |
| `defi-trade-history`     | Trade History         | live-feed    | —         | `defi/defi-trade-history-widget.tsx`     | Executed instructions with instant P&L decomposition and running totals   |
| `defi-strategy-config`   | Strategy Config       | form         | —         | `defi/defi-strategy-config-widget.tsx`   | View and edit configuration for active DeFi strategies                    |
| `defi-staking-rewards`   | Staking Rewards       | form         | —         | `defi/defi-staking-rewards-widget.tsx`   | Track, claim, sell staking rewards; reward P&L attribution                |
| `defi-funding-matrix`    | Funding Rate Matrix   | heatmap      | —         | `defi/defi-funding-matrix-widget.tsx`    | Per-coin-per-venue annualised funding rates with floor highlighting       |
| `defi-waterfall-weights` | Allocation Weights    | waterfall    | —         | `defi/defi-waterfall-weights-widget.tsx` | Two-waterfall allocation: coin weights and per-coin venue weights         |
| `defi-health-factor`     | Health Factor Monitor | detail-panel | —         | `defi/defi-health-factor-widget.tsx`     | Real-time HF monitoring with oracle/market rates, spread, emergency exit  |
| `defi-reward-pnl`        | Reward P&L Breakdown  | detail-panel | —         | `defi/defi-reward-pnl-widget.tsx`        | P&L decomposition by reward factor: staking yield, restaking, seasonal    |

### Bundles sub-tab (`/services/trading/bundles`)

| Widget ID            | Display Name        | Class        | Chart Lib | File                                    | Description                                                                      |
| -------------------- | ------------------- | ------------ | --------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| `bundle-templates`   | Bundle Templates    | card-grid    | —         | `bundles/bundle-templates-widget.tsx`   | Pre-built template gallery with category badges, cost/profit, step preview       |
| `bundle-steps`       | Execution Steps     | detail-panel | —         | `bundles/bundle-steps-widget.tsx`       | Step list with reorder, duplicate, fields, dependency links, visual flow         |
| `bundle-pnl`         | P&L Estimate        | kpi-strip    | —         | `bundles/bundle-pnl-widget.tsx`         | Buy/sell notional, gas estimate, net P&L via KpiStrip and breakdown              |
| `bundle-actions`     | Bundle Actions      | action-panel | —         | `bundles/bundle-actions-widget.tsx`     | Simulate (dry run) and submit with leg count badge                               |
| `defi-atomic-bundle` | DeFi Atomic Bundles | card-grid    | —         | `bundles/defi-atomic-bundle-widget.tsx` | DeFi-specific atomic bundle builder with Flash Loan Arb, Leverage Long templates |

---

## Sports tab (`/services/trading/sports`)

| Widget ID               | Display Name      | Class        | Chart Lib | File                                      | Description                                                                   |
| ----------------------- | ----------------- | ------------ | --------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `sports-fixtures`       | Fixtures          | filter-grid  | —         | `sports/sports-fixtures-widget.tsx`       | Fixture list with FilterBar, live pulse, scores, selection for detail         |
| `sports-fixture-detail` | Fixture Detail    | detail-panel | —         | `sports/sports-fixture-detail-widget.tsx` | Stats, timeline, odds movement, trade panel for selected match                |
| `sports-arb`            | Arb Scanner       | bespoke      | —         | `sports/sports-arb-widget.tsx`            | Odds grid and live arb stream with minimum arb threshold                      |
| `sports-my-bets`        | My Bets           | data-table   | —         | `sports/sports-my-bets-widget.tsx`        | KPI strip + open/settled DataTableWidget tables + accumulators                |
| `sports-live-scores`    | Live Scores       | control-bar  | —         | `sports/sports-live-scores-widget.tsx`    | Compact horizontal ticker of live and suspended fixtures                      |
| `sports-standings`      | Standings         | inline-table | —         | `sports/sports-standings-widget.tsx`      | League table with form dots, goal difference, and qualification zones         |
| `sports-clv`            | CLV Performance   | detail-panel | —         | `sports/sports-clv-widget.tsx`            | Closing line value tracking — hit rate, mean CLV, P&L by market and bookmaker |
| `sports-predictions`    | Model Predictions | bespoke      | —         | `sports/sports-predictions-widget.tsx`    | ML model predictions for upcoming fixtures — 1X2, xG, BTTS, O/U probabilities |
| `sports-ml-status`      | ML Pipeline       | detail-panel | —         | `sports/sports-ml-status-widget.tsx`      | Training status, model families, feature freshness, and accuracy metrics      |

---

## Options & Futures tab (`/services/trading/options`)

| Widget ID               | Display Name        | Class        | Chart Lib | File                                             | Description                                                       |
| ----------------------- | ------------------- | ------------ | --------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| `options-control-bar`   | Options Controls    | control-bar  | —         | `options/options-control-bar-widget.tsx`         | Asset class, venue, settlement, main tabs, watchlist toggle       |
| `options-watchlist`     | Watchlist           | inline-table | —         | `options/options-watchlist-widget.tsx`           | Saved watchlists and symbol selection for active underlying       |
| `options-chain`         | Options Chain       | inline-table | —         | `options/options-chain-widget.tsx`               | Calls and puts per strike with greeks, IV, open interest          |
| `options-trade-panel`   | Options Trade Panel | form         | —         | `options/options-trade-panel-widget.tsx`         | Order entry for options, spreads, combos from chain or strategies |
| `futures-table`         | Futures Table       | inline-table | —         | `options/options-futures-table-widget.tsx`       | Perpetual and dated futures with funding, basis, volume           |
| `futures-trade-panel`   | Futures Trade Panel | form         | —         | `options/options-futures-trade-panel-widget.tsx` | Futures order entry after selecting a contract                    |
| `options-strategies`    | Strategy Builder    | bespoke      | —         | `options/options-strategies-widget.tsx`          | Futures calendar spreads and multi-leg options combos             |
| `options-scenario`      | Scenario Analysis   | detail-panel | —         | `options/options-scenario-widget.tsx`            | Spot and vol shock grid with preset scenarios                     |
| `options-greek-surface` | Greek / Vol Surface | bespoke      | —         | `options/options-greek-surface-widget.tsx`       | Crypto greek surface; TradFi shows skew-aware vol grid            |

---

## Predictions tab (`/services/trading/predictions`)

| Widget ID                | Display Name      | Class        | Chart Lib | File                                            | Description                                                                  |
| ------------------------ | ----------------- | ------------ | --------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `pred-portfolio-kpis`    | Portfolio KPIs    | kpi-strip    | —         | `predictions/pred-portfolio-kpis-widget.tsx`    | Open positions count, total staked, unrealised P&L, win rate                 |
| `pred-markets-grid`      | Markets           | filter-grid  | —         | `predictions/pred-markets-grid-widget.tsx`      | Filterable grid with FilterBar: category, venue, sort, search                |
| `pred-market-detail`     | Market Detail     | detail-panel | —         | `predictions/pred-market-detail-widget.tsx`     | Single market detail with price history, order book summary, trade entry     |
| `pred-open-positions`    | Open Positions    | inline-table | —         | `predictions/pred-open-positions-widget.tsx`    | Open prediction market positions with entry/current price and P&L            |
| `pred-settled-positions` | Settled Positions | data-table   | —         | `predictions/pred-settled-positions-widget.tsx` | Collapsible table of settled positions (uses DataTableWidget)                |
| `pred-odum-focus`        | ODUM Focus        | bespoke      | —         | `predictions/pred-odum-focus-widget.tsx`        | Dual-axis price/odds charts and divergence signals                           |
| `pred-arb-stream`        | Arb Stream        | bespoke      | —         | `predictions/pred-arb-stream-widget.tsx`        | Live prediction market arb opportunities with decay bars and execute actions |
| `pred-arb-closed`        | Closed Arbs       | inline-table | —         | `predictions/pred-arb-closed-widget.tsx`        | Collapsed list of closed or decayed arb opportunities                        |
| `pred-trade-panel`       | Quick Trade       | form         | —         | `predictions/pred-trade-panel-widget.tsx`       | Market selector and trade panel with Kelly stake suggestion                  |
| `pred-top-markets`       | Top Markets       | card-grid    | —         | `predictions/pred-top-markets-widget.tsx`       | Top markets by volume as quick-access cards                                  |
| `pred-recent-fills`      | Recent Trades     | live-feed    | —         | `predictions/pred-recent-fills-widget.tsx`      | Recent prediction market fills                                               |

---

## Markets tab (`/services/trading/markets`)

| Widget ID                 | Display Name       | Class          | Chart Lib | File                                         | Description                                                                    |
| ------------------------- | ------------------ | -------------- | --------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| `markets-controls`        | Markets Controls   | control-bar    | —         | `markets/markets-controls-widget.tsx`        | Global controls: view/data mode, date range, asset, order-flow range and depth |
| `markets-order-flow`      | Market Order Flow  | live-feed      | —         | `markets/markets-order-flow-widget.tsx`      | Scrollable order table with timestamps, latency, side, venue, aggressor        |
| `markets-live-book`       | Live Order Book    | live-feed      | —         | `markets/markets-live-book-widget.tsx`       | HFT-style book and trades with bid/ask columns and legend                      |
| `markets-my-orders`       | My Orders          | inline-table   | —         | `markets/markets-my-orders-widget.tsx`       | Own order history with fill status and order IDs                               |
| `markets-recon`           | Reconciliation     | inline-table   | —         | `markets/markets-recon-widget.tsx`           | Recon runs with break counts, resolution, break value                          |
| `markets-latency-summary` | Latency Summary    | inline-table   | —         | `markets/markets-latency-summary-widget.tsx` | Service list with p50/p95/p99 and latency view/data toggles                    |
| `markets-latency-detail`  | Latency Detail     | recharts-chart | recharts  | `markets/markets-latency-detail-widget.tsx`  | Selected service KPIs, lifecycle bars, time series, compare table              |
| `markets-defi-amm`        | DeFi Pool Activity | live-feed      | —         | `markets/markets-defi-amm-widget.tsx`        | AMM swap/LP style table for DeFi venues (mock)                                 |

---

## Summary counts

| UI Tab            | Widget Count |
| ----------------- | ------------ |
| Overview          | 9            |
| Terminal          | 8            |
| Book              | 6            |
| Orders            | 2            |
| Positions         | 2            |
| Alerts            | 3            |
| Risk              | 13           |
| P&L               | 6            |
| Accounts          | 6            |
| Strategies        | 9            |
| Instructions      | 3            |
| DeFi (main)       | 15           |
| Bundles           | 5            |
| Sports            | 9            |
| Options & Futures | 9            |
| Predictions       | 11           |
| Markets           | 8            |
| **Total**         | **124**      |

---

## Class Summary — base widget extraction candidates

### Existing bases (4)

| Base                 | Import                                  | Widgets using it                                                                                                                                        | Notes                                                                                                                                                                 |
| -------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KpiSummaryWidget`   | `@/components/shared`                   | 9 (orders, positions, alerts, accounts, strategies, predictions, risk, instructions, bundles)                                                           | Well-adopted. KpiStrip also used directly in 5 more widgets.                                                                                                          |
| `LiveFeedWidget`     | `@/components/shared/live-feed-widget`  | 8 (market-trades, markets-order-flow, markets-live-book, markets-defi-amm, instr-pipeline-table, strategy-table, pred-recent-fills, defi-trade-history) | Well-adopted.                                                                                                                                                         |
| `DataTableWidget<T>` | `@/components/shared/data-table-widget` | 2 (sports-my-bets, pred-settled-positions)                                                                                                              | Under-adopted — 14 widgets use inline tables instead. Migration candidate. Currently sort-only — **filtering will be added to DataTable itself** (not via FilterBar). |
| `FilterBar`          | `@/components/shared/filter-bar`        | 2 (sports-fixtures, pred-markets-grid)                                                                                                                  | Under-adopted. **May not remain a base widget.** If DataTable gets its own filters, FilterBar may be demoted to utility or removed.                                   |

### Candidate new bases (priority order for BP-2)

| Priority | Proposed base                                      | Class          | Current count | Widgets                                                                                                                                                                                                                                                                                                                                                                                                                                       | Rationale                                                                                                                 |
| -------- | -------------------------------------------------- | -------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **1**    | `RechartsWidget`                                   | recharts-chart | 10            | risk-var-chart, risk-exposure-attribution, risk-greeks-summary, risk-margin, risk-term-structure, pnl-time-series, pnl-factor-drilldown, markets-latency-detail, defi-yield-chart, risk-kpi-strip (sparklines)                                                                                                                                                                                                                                | Common ResponsiveContainer + theme + resize boilerplate. Base handles container sizing, dark theme, empty state, loading. |
| **2**    | `FormWidget`                                       | form           | 13            | order-entry, book-order-entry, defi-lending, defi-swap, defi-liquidity, defi-staking, defi-flash-loans, defi-transfer, defi-strategy-config, defi-staking-rewards, accounts-transfer, options-trade-panel, futures-trade-panel, pred-trade-panel, cefi-strategy-config                                                                                                                                                                        | Most are submit-with-validation forms. Base handles submit/loading/error state, validation, submit button chrome.         |
| **3**    | `InlineTableWidget` → migrate to `DataTableWidget` | inline-table   | 18            | orders-table, positions-table, alerts-table, book-trade-history, accounts-balance-table, accounts-transfer-history, risk-stress-table, risk-limits-hierarchy, pnl-by-client, markets-my-orders, markets-recon, markets-latency-summary, options-watchlist, options-chain, options-futures-table, pred-open-positions, pred-arb-closed, defi-rates-overview, sports-standings, lending-arb-dashboard, liquidation-monitor, active-lp-dashboard | Not a new base — migrate these to use the existing `DataTableWidget<T>`.                                                  |
| **4**    | `DetailPanelWidget`                                | detail-panel   | 9             | instr-detail-panel, sports-fixture-detail, pred-market-detail, options-scenario, bundle-steps, defi-health-factor, defi-reward-pnl, sports-clv, sports-ml-status, commodity-regime                                                                                                                                                                                                                                                            | Master-detail with header + body + optional actions. Base handles selection state, empty state, back navigation.          |
| **5**    | `ControlBarWidget`                                 | control-bar    | 7             | scope-summary, instrument-bar, book-hierarchy-bar, pnl-controls, markets-controls, options-control-bar, sports-live-scores                                                                                                                                                                                                                                                                                                                    | Horizontal bar with selects/toggles/badges. Base handles responsive collapse, shared filter state.                        |
| **6**    | `CardGridWidget`                                   | card-grid      | 8             | alerts-preview, recent-fills, health-grid, risk-circuit-breakers, saft-portfolio, bundle-templates, defi-atomic-bundle, strategies-catalogue, pred-top-markets, strategy-family-browser                                                                                                                                                                                                                                                       | Grid of uniform cards. Base handles responsive columns, empty state, card click.                                          |
| **7**    | `HeatmapWidget`                                    | heatmap        | 3             | risk-strategy-heatmap, risk-correlation-heatmap, defi-funding-matrix                                                                                                                                                                                                                                                                                                                                                                          | Matrix with colour-coded cells. Base handles axis labels, colour scale, tooltip, cell click.                              |
| **8**    | `OrderBookWidget`                                  | order-book     | 3             | order-book, depth-chart, markets-live-book                                                                                                                                                                                                                                                                                                                                                                                                    | Bid/ask ladder or depth curve. Base handles spread display, depth aggregation, price levels.                              |
| **9**    | `WaterfallWidget`                                  | waterfall      | 3             | pnl-waterfall, pnl-attribution, defi-waterfall-weights, risk-utilization                                                                                                                                                                                                                                                                                                                                                                      | Stacked/waterfall bars with running total. Base handles positive/negative colouring, drill-down.                          |

### Chart library assignments

| Library                | Use case                                                          | Current widgets                                                                           |
| ---------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **lightweight-charts** | Candlestick, OHLCV, high-volume historical time series            | `price-chart` (via `CandlestickChart`). Also used in research components outside widgets. |
| **recharts**           | Area, bar, line, pie — simple statistical charts                  | 10 widgets (see recharts-chart class above)                                               |
| **None (bespoke)**     | Custom rendering (order book ladder, heatmap cells, form layouts) | 104 widgets                                                                               |

**Policy:** `lightweight-charts` for anything candlestick or high-data-volume. `recharts` for simple aggregation/summary charts. Final per-widget decision based on rendering performance vs visual quality — avoid CPU/RAM bloat.

---

## Default Preset Audit

Which widgets appear in the tab's default layout (visible on first load) vs. which are registered but only accessible via the widget catalogue (+ Add Widget).

`✅ in default preset` — shown automatically when the tab loads
`➕ catalogue only` — registered but must be manually added

| Tab                   | Widget ID                   | Status                             |
| --------------------- | --------------------------- | ---------------------------------- |
| **Accounts**          | `accounts-kpi-strip`        | ✅ in default preset               |
|                       | `accounts-balance-table`    | ✅ in default preset               |
|                       | `accounts-margin-util`      | ✅ in default preset               |
|                       | `accounts-transfer`         | ✅ in default preset               |
|                       | `accounts-transfer-history` | ✅ in default preset               |
|                       | `saft-portfolio`            | ✅ in default preset               |
| **Alerts**            | `alerts-kpi-strip`          | ✅ in default preset               |
|                       | `alerts-table`              | ✅ in default preset               |
|                       | `alerts-kill-switch`        | ✅ in default preset               |
| **Book**              | `book-hierarchy-bar`        | ✅ in default preset               |
|                       | `book-order-entry`          | ✅ in default preset               |
|                       | `book-trade-history`        | ✅ in default preset               |
| **Bundles**           | `bundle-templates`          | ✅ in default preset               |
|                       | `bundle-steps`              | ✅ in default preset               |
|                       | `bundle-pnl`                | ✅ in default preset               |
|                       | `bundle-actions`            | ✅ in default preset               |
|                       | `defi-atomic-bundle`        | ✅ in default preset               |
| **DeFi**              | `defi-wallet-summary`       | ✅ in default preset               |
|                       | `defi-lending`              | ✅ in default preset               |
|                       | `defi-swap`                 | ✅ in default preset               |
|                       | `defi-liquidity`            | ✅ in default preset               |
|                       | `defi-staking`              | ✅ in default preset               |
|                       | `defi-flash-loans`          | ➕ catalogue only                  |
|                       | `defi-transfer`             | ✅ in default preset               |
|                       | `defi-rates-overview`       | ➕ catalogue only                  |
|                       | `defi-trade-history`        | ✅ in default preset               |
|                       | `defi-strategy-config`      | ✅ in default preset               |
|                       | `defi-staking-rewards`      | ✅ in default preset               |
|                       | `defi-funding-matrix`       | ✅ in default preset               |
|                       | `defi-waterfall-weights`    | ✅ in default preset               |
|                       | `defi-health-factor`        | ✅ in default preset               |
|                       | `defi-reward-pnl`           | ✅ in default preset               |
| **Instructions**      | `instr-summary`             | ✅ in default preset               |
|                       | `instr-pipeline-table`      | ✅ in default preset               |
|                       | `instr-detail-panel`        | ✅ in default preset               |
| **Markets**           | `markets-controls`          | ✅ in default preset               |
|                       | `markets-order-flow`        | ✅ in default preset               |
|                       | `markets-live-book`         | ✅ in default preset               |
|                       | `markets-my-orders`         | ✅ in default preset               |
|                       | `markets-recon`             | ✅ in default preset               |
|                       | `markets-latency-summary`   | ✅ in default preset               |
|                       | `markets-latency-detail`    | ✅ in default preset               |
|                       | `markets-defi-amm`          | ➕ catalogue only                  |
| **Options & Futures** | `options-control-bar`       | ✅ in default preset               |
|                       | `options-watchlist`         | ✅ in default preset               |
|                       | `options-chain`             | ✅ in default preset               |
|                       | `options-trade-panel`       | ✅ in default preset               |
|                       | `futures-table`             | ✅ in default preset               |
|                       | `futures-trade-panel`       | ➕ catalogue only                  |
|                       | `options-strategies`        | ✅ in default preset               |
|                       | `options-scenario`          | ✅ in default preset               |
|                       | `options-greek-surface`     | ✅ in default preset               |
| **Orders**            | `orders-kpi-strip`          | ✅ in default preset               |
|                       | `orders-table`              | ✅ in default preset               |
| **Overview**          | `scope-summary`             | ✅ in default preset               |
|                       | `pnl-chart`                 | ✅ in default preset               |
|                       | `kpi-strip`                 | ✅ in default preset               |
|                       | `strategy-table`            | ✅ in default preset               |
|                       | `pnl-attribution`           | ✅ in default preset               |
|                       | `alerts-preview`            | ✅ in default preset               |
|                       | `recent-fills`              | ✅ in default preset               |
|                       | `health-grid`               | ✅ in default preset               |
| **P&L**               | `pnl-controls`              | ✅ in default preset               |
|                       | `pnl-waterfall`             | ✅ in default preset               |
|                       | `pnl-time-series`           | ✅ in default preset               |
|                       | `pnl-by-client`             | ✅ in default preset               |
|                       | `pnl-factor-drilldown`      | ✅ in default preset               |
|                       | `pnl-report-button`         | ➕ catalogue only                  |
| **Positions**         | `positions-kpi-strip`       | ✅ in default preset               |
|                       | `positions-table`           | ✅ in default preset               |
| **Predictions**       | `pred-markets-grid`         | ✅ in default preset               |
|                       | `pred-market-detail`        | ➕ catalogue only                  |
|                       | `pred-portfolio-kpis`       | ✅ in default preset               |
|                       | `pred-open-positions`       | ✅ in default preset               |
|                       | `pred-settled-positions`    | ➕ catalogue only                  |
|                       | `pred-odum-focus`           | ✅ in default preset               |
|                       | `pred-arb-stream`           | ✅ in default preset               |
|                       | `pred-arb-closed`           | ✅ in default preset               |
|                       | `pred-trade-panel`          | ✅ in default preset               |
|                       | `pred-top-markets`          | ➕ catalogue only                  |
|                       | `pred-recent-fills`         | ✅ in default preset               |
| **Risk**              | `risk-kpi-strip`            | ✅ in default preset               |
|                       | `risk-strategy-heatmap`     | ✅ in default preset               |
|                       | `risk-utilization`          | ✅ in default preset               |
|                       | `risk-var-chart`            | ✅ in default preset               |
|                       | `risk-stress-table`         | ✅ in default preset               |
|                       | `risk-exposure-attribution` | ✅ in default preset               |
|                       | `risk-greeks-summary`       | ✅ in default preset               |
|                       | `risk-margin`               | ✅ in default preset               |
|                       | `risk-term-structure`       | ✅ in default preset               |
|                       | `risk-limits-hierarchy`     | ✅ in default preset               |
|                       | `risk-what-if-slider`       | ✅ in default preset               |
|                       | `risk-circuit-breakers`     | ✅ in default preset               |
|                       | `risk-correlation-heatmap`  | ✅ in default preset               |
| **Sports**            | `sports-fixtures`           | ✅ in default preset               |
|                       | `sports-fixture-detail`     | ✅ in default preset               |
|                       | `sports-arb`                | ✅ in default preset               |
|                       | `sports-my-bets`            | ✅ in default preset               |
|                       | `sports-live-scores`        | ✅ in default preset               |
|                       | `sports-standings`          | ➕ catalogue only (in Full preset) |
|                       | `sports-clv`                | ➕ catalogue only (in Full preset) |
|                       | `sports-predictions`        | ➕ catalogue only (in Full preset) |
|                       | `sports-ml-status`          | ➕ catalogue only (in Full preset) |
| **Strategies**        | `strategies-kpi-strip`      | ✅ in default preset               |
|                       | `strategies-catalogue`      | ✅ in default preset               |
|                       | `strategies-grid-link`      | ✅ in default preset               |
|                       | `cefi-strategy-config`      | ➕ catalogue only (in Full preset) |
|                       | `strategy-family-browser`   | ➕ catalogue only (in Full preset) |
|                       | `lending-arb-dashboard`     | ➕ catalogue only                  |
|                       | `liquidation-monitor`       | ➕ catalogue only                  |
|                       | `active-lp-dashboard`       | ➕ catalogue only                  |
|                       | `commodity-regime`          | ➕ catalogue only                  |
| **Terminal**          | `instrument-bar`            | ✅ in default preset               |
|                       | `price-chart`               | ✅ in default preset               |
|                       | `depth-chart`               | ➕ catalogue only                  |
|                       | `terminal-options`          | ➕ catalogue only                  |
|                       | `order-book`                | ✅ in default preset               |
|                       | `order-entry`               | ✅ in default preset               |
|                       | `market-trades`             | ✅ in default preset               |
|                       | `calendar-events`           | ✅ in default preset               |

### Catalogue-only summary (20 widgets not in default preset)

| Widget ID                 | Tab               | Why it might be catalogue-only                              |
| ------------------------- | ----------------- | ----------------------------------------------------------- |
| `depth-chart`             | Terminal          | Just split out from price-chart; not yet placed in preset   |
| `terminal-options`        | Terminal          | Just split out from price-chart; not yet placed in preset   |
| `defi-flash-loans`        | DeFi              | Advanced / power-user feature                               |
| `defi-rates-overview`     | DeFi              | Supplementary overview, not core workflow                   |
| `markets-defi-amm`        | Markets           | DeFi-specific sub-view, not core markets workflow           |
| `futures-trade-panel`     | Options & Futures | Secondary panel; shown on demand after selecting a contract |
| `pnl-report-button`       | P&L               | Single-button CTA, optional add-on                          |
| `pred-market-detail`      | Predictions       | Master-detail secondary panel                               |
| `pred-settled-positions`  | Predictions       | Secondary view, collapsed by default                        |
| `pred-top-markets`        | Predictions       | Supplementary quick-access cards                            |
| `sports-standings`        | Sports            | In Full preset only; league standings for deeper analysis   |
| `sports-clv`              | Sports            | In Full preset only; CLV performance analysis               |
| `sports-predictions`      | Sports            | In Full preset only; ML model predictions                   |
| `sports-ml-status`        | Sports            | In Full preset only; ML pipeline monitoring                 |
| `cefi-strategy-config`    | Strategies        | In Full preset only; strategy configuration panel           |
| `strategy-family-browser` | Strategies        | In Full preset only; browse all strategy families           |
| `lending-arb-dashboard`   | Strategies        | New — cross-protocol lending rate comparison                |
| `liquidation-monitor`     | Strategies        | New — DeFi liquidation risk monitor                         |
| `active-lp-dashboard`     | Strategies        | New — concentrated liquidity position tracker               |
| `commodity-regime`        | Strategies        | New — regime detection dashboard                            |
