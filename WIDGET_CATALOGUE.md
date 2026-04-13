# Widget Catalogue

Maps every registered widget to its UI tab, source file, and purpose.

**UI Tab → URL:** `/services/trading/<tab-id>`
**Source path:** all files are under `components/widgets/<folder>/`

> **Markets tab** was not in the left-nav (`TRADING_TABS`). Added as a first-class tab (icon: Activity, after Terminal) on 2026-04-13.

---

## Overview tab (`/services/trading/overview`)

| Display Name                | Widget ID         | File                                                                      | Description                                                          |
| --------------------------- | ----------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Scope & Controls            | `scope-summary`   | `overview/scope-summary-widget.tsx`                                       | Global scope summary with intervention controls and terminal link.   |
| Key Metrics                 | `kpi-strip`       | `overview/kpi-strip-widget.tsx`                                           | P&L, exposure, margin, live strategies, and alerts at a glance.      |
| P&L / NAV / Exposure Charts | `pnl-chart`       | `overview/pnl-chart-widget.tsx`                                           | Live vs batch time series comparison with drift analysis.            |
| Strategy Performance        | `strategy-table`  | `overview/overview-data-context.tsx` (rendered via `StrategyTableWidget`) | Filterable strategy table grouped by asset class with real-time P&L. |
| P&L Attribution             | `pnl-attribution` | `overview/`                                                               | Breakdown of P&L by factor: funding, carry, basis, delta, etc.       |
| Alerts                      | `alerts-preview`  | `overview/bottom-widgets.tsx`                                             | Recent critical and high alerts with severity indicators.            |
| Recent Fills                | `recent-fills`    | `overview/bottom-widgets.tsx`                                             | Latest order fills with side, instrument, and status.                |
| System Health               | `health-grid`     | `overview/bottom-widgets.tsx`                                             | Service health grid showing status of platform services.             |
| Calendar Events             | `calendar-events` | `terminal/calendar-events-widget.tsx`                                     | Economic calendar and corporate actions feed. _(also on Terminal)_   |

---

## Terminal tab (`/services/trading/terminal`)

| Display Name         | Widget ID          | File                                   | Description                                                                  |
| -------------------- | ------------------ | -------------------------------------- | ---------------------------------------------------------------------------- |
| Instrument & Account | `instrument-bar`   | `terminal/instrument-bar-widget.tsx`   | Instrument selector, account picker, live price, and quick actions.          |
| Price Chart          | `price-chart`      | `terminal/price-chart-widget.tsx`      | Candlestick and line chart with technical indicators and timeframe controls. |
| Depth Chart          | `depth-chart`      | `terminal/depth-chart-widget.tsx`      | Market depth visualization showing cumulative bid/ask volume.                |
| Options Chain        | `terminal-options` | `terminal/terminal-options-widget.tsx` | Options chain and volatility surface for the selected underlying.            |
| Order Book           | `order-book`       | `terminal/order-book-widget.tsx`       | Live bid/ask ladder with depth visualization.                                |
| Order Entry          | `order-entry`      | `terminal/order-entry-widget.tsx`      | Buy/sell order form with strategy linking and constraint validation.         |
| Market Trades        | `market-trades`    | `terminal/market-trades-widget.tsx`    | Real-time market trades and own trade history.                               |
| Calendar Events      | `calendar-events`  | `terminal/calendar-events-widget.tsx`  | Economic calendar and corporate actions feed. _(also on Overview)_           |

---

## Book tab (`/services/trading/book`)

| Display Name         | Widget ID                 | File                                      | Description                                                                  |
| -------------------- | ------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| Hierarchy Selector   | `book-hierarchy-bar`      | `book/book-hierarchy-bar-widget.tsx`      | Org → Client → Strategy selector strip.                                      |
| Book Order Entry     | `book-order-form`         | `book/book-order-form-widget.tsx`         | Core order form: mode toggle, category, venue, instrument, side, qty, price. |
| Algo Configuration   | `book-algo-config`        | `book/book-algo-config-widget.tsx`        | Algorithm selector and conditional params (TWAP/VWAP, iceberg, benchmark).   |
| Record Details       | `book-record-details`     | `book/book-record-details-widget.tsx`     | Counterparty, source reference, fee fields for record-only mode.             |
| Preview & Compliance | `book-preview-compliance` | `book/book-preview-compliance-widget.tsx` | Order preview grid and pre-trade compliance checks with pass/fail badges.    |
| Trade History        | `book-trade-history`      | `book/book-trade-history-widget.tsx`      | Table of executed trades with search, sort, and filtering.                   |

---

## Orders tab (`/services/trading/orders`)

| Display Name  | Widget ID          | File                                 | Description                                                                   |
| ------------- | ------------------ | ------------------------------------ | ----------------------------------------------------------------------------- |
| Order Summary | `orders-kpi-strip` | `orders/orders-kpi-strip-widget.tsx` | 6 KPIs: total, open, partial, filled, rejected, and failed order counts.      |
| Orders Table  | `orders-table`     | `orders/orders-table-widget.tsx`     | Full orders table with integrated filters, sorting, cancel and amend actions. |

---

## Positions tab (`/services/trading/positions`)

| Display Name     | Widget ID             | File                                   | Description                                                                            |
| ---------------- | --------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| Position Summary | `positions-kpi-strip` | `positions/positions-kpi-widget.tsx`   | 6 KPIs: count, notional, unrealized P&L, margin, long/short exposure.                  |
| Positions Table  | `positions-table`     | `positions/positions-table-widget.tsx` | Main positions table with filters, instrument links, side, P&L, and trades drill-down. |

---

## Alerts tab (`/services/trading/alerts`)

| Display Name  | Widget ID            | File                                   | Description                                                              |
| ------------- | -------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Alert Summary | `alerts-kpi-strip`   | `alerts/alerts-kpi-strip-widget.tsx`   | Active count, critical count, avg resolution, 24h total.                 |
| Alert Feed    | `alerts-table`       | `alerts/alerts-table-widget.tsx`       | Filterable alert table with severity, entity, actions, and detail sheet. |
| Kill Switch   | `alerts-kill-switch` | `alerts/alerts-kill-switch-widget.tsx` | Emergency intervention panel: scope, actions, rationale, impact preview. |

---

## Risk tab (`/services/trading/risk`)

| Display Name           | Widget ID                   | File                                        | Description                                                                             |
| ---------------------- | --------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| Risk KPIs              | `risk-kpi-strip`            | `risk/risk-kpi-strip-widget.tsx`            | 9 metrics: P&L, exposure, margin%, VaR95, ES95, alerts, VaR99, ES99, kill switches.     |
| Strategy Heatmap       | `risk-strategy-heatmap`     | `risk/risk-strategy-heatmap-widget.tsx`     | Strategy risk status with CB trip/reset, scale, and kill actions.                       |
| Highest Utilization    | `risk-utilization`          | `risk/risk-utilization-widget.tsx`          | Top N limits ranked by utilization with limit bars.                                     |
| Component VaR          | `risk-var-chart`            | `risk/risk-var-chart-widget.tsx`            | Horizontal bar chart: marginal VaR contribution by position.                            |
| Stress Scenarios       | `risk-stress-table`         | `risk/risk-stress-table-widget.tsx`         | Historical stress scenario table with multiplier, P&L, breaches, on-demand stress test. |
| Exposure Attribution   | `risk-exposure-attribution` | `risk/risk-exposure-attribution-widget.tsx` | Grouped exposure table (first/second/structural/operational/domain) with time series.   |
| Portfolio Greeks       | `risk-greeks-summary`       | `risk/risk-greeks-summary-widget.tsx`       | 5 Greek cards, per-position table, time series, and second-order risks.                 |
| Margin & Health        | `risk-margin`               | `risk/risk-margin-widget.tsx`               | CeFi margin bars, SPAN summary, DeFi HF, distance to liquidation.                       |
| Term Structure         | `risk-term-structure`       | `risk/risk-term-structure-widget.tsx`       | Stacked bar chart: exposure by maturity bucket.                                         |
| Limits Hierarchy       | `risk-limits-hierarchy`     | `risk/risk-limits-hierarchy-widget.tsx`     | Interactive 6-level hierarchy tree table and all limits detail.                         |
| What-If Slider         | `risk-what-if-slider`       | `risk/risk-what-if-slider-widget.tsx`       | BTC price shock slider with estimated PnL via delta + gamma approximation.              |
| Circuit Breaker Status | `risk-circuit-breakers`     | `risk/risk-circuit-breakers-widget.tsx`     | Per-venue circuit breaker cards with status badges.                                     |
| Correlation Heatmap    | `risk-correlation-heatmap`  | `risk/risk-correlation-heatmap-widget.tsx`  | Asset correlation matrix heatmap (self-contained, dynamic import).                      |

---

## P&L tab (`/services/trading/pnl`)

| Display Name     | Widget ID              | File                                  | Description                                                           |
| ---------------- | ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| P&L Controls     | `pnl-controls`         | `pnl/pnl-controls-widget.tsx`         | View mode, live/batch, date range, group-by, data mode badge.         |
| P&L Waterfall    | `pnl-waterfall`        | `pnl/pnl-waterfall-widget.tsx`        | Structural P&L, factor bars with drill-down, residual, net total.     |
| P&L Time Series  | `pnl-time-series`      | `pnl/pnl-time-series-widget.tsx`      | Stacked area chart of ten factors over time.                          |
| P&L by Client    | `pnl-by-client`        | `pnl/pnl-by-client-widget.tsx`        | Client-level P&L with org, strategy count, and change percent.        |
| Factor Breakdown | `pnl-factor-drilldown` | `pnl/pnl-factor-drilldown-widget.tsx` | Per-strategy breakdown for the selected factor plus mini time series. |
| P&L Report       | `pnl-report-button`    | `pnl/pnl-report-button-widget.tsx`    | Placeholder CTA to generate a P&L report.                             |

---

## Accounts tab (`/services/trading/accounts`)

| Display Name          | Widget ID                   | File                                            | Description                                                          |
| --------------------- | --------------------------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| NAV Summary           | `accounts-kpi-strip`        | `accounts/accounts-kpi-widget.tsx`              | Total NAV, available (free), and locked (in use) across venues.      |
| Per-Venue Balances    | `accounts-balance-table`    | `accounts/accounts-balance-table-widget.tsx`    | Free, locked, total, margin, and utilization per venue.              |
| Margin Utilization    | `accounts-margin-util`      | `accounts/accounts-margin-util-widget.tsx`      | Margin utilization bars, trend, and margin-call distance per venue.  |
| Transfer Panel        | `accounts-transfer`         | `accounts/accounts-transfer-widget.tsx`         | Venue-to-venue, sub-account, withdraw, and deposit flows.            |
| Transfer History      | `accounts-transfer-history` | `accounts/accounts-transfer-history-widget.tsx` | Recent transfers with status and transaction references.             |
| SAFT & Token Warrants | `saft-portfolio`            | `accounts/saft-portfolio-widget.tsx`            | SAFT portfolio, vesting timeline, and treasury tracking (demo data). |

---

## Strategies tab (`/services/trading/strategies`)

| Display Name     | Widget ID              | File                                         | Description                                                                        |
| ---------------- | ---------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| Strategy Summary | `strategies-kpi-strip` | `strategies/strategies-kpi-strip-widget.tsx` | Active count, total AUM, total P&L, MTD P&L with execution mode badge.             |
| Strategy List    | `strategies-catalogue` | `strategies/strategies-catalogue-widget.tsx` | Grouped card grid with filters, performance metrics, sparklines, and action links. |
| Batch Grid Link  | `strategies-grid-link` | `strategies/strategies-grid-link-widget.tsx` | CTA to open DimensionalGrid for batch analysis.                                    |

---

## Instructions tab (`/services/trading/instructions`)

| Display Name         | Widget ID              | File                                                  | Description                                                                           |
| -------------------- | ---------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Pipeline Summary     | `instr-summary`        | `instructions/instructions-summary-widget.tsx`        | Total instructions, filled, partial, pending, average slippage.                       |
| Instruction Pipeline | `instr-pipeline-table` | `instructions/instructions-pipeline-table-widget.tsx` | Signal, instruction, and fill columns with filters and expandable discrepancy detail. |
| Instruction Detail   | `instr-detail-panel`   | `instructions/instructions-detail-panel-widget.tsx`   | Persistent detail for the selected instruction (master-detail pattern).               |

---

## DeFi tab (`/services/trading/defi`) and sub-tabs

> All DeFi widgets share `availableOn: ["defi"]`. The DeFi family in the nav has three pages: **DeFi** (main), **Bundles**, and **Staking** — but widget `availableOn` does not currently distinguish between them; all are shown on the main DeFi page.

| Display Name          | Widget ID                | File                                     | Description                                                                         |
| --------------------- | ------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------- |
| Wallet Summary        | `defi-wallet-summary`    | `defi/defi-wallet-summary-widget.tsx`    | Token balances, connected wallet, chain selector.                                   |
| DeFi Lending          | `defi-lending`           | `defi/defi-lending-widget.tsx`           | Protocol selector, lend/borrow/withdraw/repay, APY, health factor preview.          |
| DeFi Swap             | `defi-swap`              | `defi/defi-swap-widget.tsx`              | Token pair, amount, slippage, route with price impact and gas.                      |
| Liquidity Provision   | `defi-liquidity`         | `defi/defi-liquidity-widget.tsx`         | Add/remove liquidity, pool selector, fee tier, price range, TVL/APR.                |
| Staking               | `defi-staking`           | `defi/defi-staking-widget.tsx`           | Stake/unstake, protocol APY, yield, TVL, unbonding.                                 |
| Flash Loan Builder    | `defi-flash-loans`       | `defi/defi-flash-loans-widget.tsx`       | Multi-step flash bundle, borrow/repay legs, P&L preview.                            |
| Transfer & Bridge     | `defi-transfer`          | `defi/defi-transfer-widget.tsx`          | Send on one chain or bridge cross-chain with gas estimate.                          |
| Rates Overview        | `defi-rates-overview`    | `defi/defi-rates-overview-widget.tsx`    | Protocol APY comparison across lending, staking, and LP yields.                     |
| Trade History         | `defi-trade-history`     | `defi/defi-trade-history-widget.tsx`     | Executed instructions with instant P&L decomposition and running totals.            |
| Strategy Config       | `defi-strategy-config`   | `defi/defi-strategy-config-widget.tsx`   | View and edit configuration for active DeFi strategies.                             |
| Staking Rewards       | `defi-staking-rewards`   | `defi/defi-staking-rewards-widget.tsx`   | Track, claim, and sell staking rewards. Reward P&L attribution.                     |
| Funding Rate Matrix   | `defi-funding-matrix`    | `defi/defi-funding-matrix-widget.tsx`    | Per-coin-per-venue annualised funding rates with floor highlighting.                |
| Allocation Weights    | `defi-waterfall-weights` | `defi/defi-waterfall-weights-widget.tsx` | Two-waterfall allocation: coin weights and per-coin venue weights.                  |
| Health Factor Monitor | `defi-health-factor`     | `defi/defi-health-factor-widget.tsx`     | Real-time HF monitoring with oracle/market rates, spread analysis, emergency exit.  |
| Reward P&L Breakdown  | `defi-reward-pnl`        | `defi/defi-reward-pnl-widget.tsx`        | P&L decomposition by reward factor: staking yield, restaking, seasonal, unrealised. |

### Bundles sub-tab (`/services/trading/bundles`)

| Display Name        | Widget ID            | File                                    | Description                                                                                      |
| ------------------- | -------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Bundle Templates    | `bundle-templates`   | `bundles/bundle-templates-widget.tsx`   | Pre-built template gallery with category badges, estimated cost/profit, step preview.            |
| Execution Steps     | `bundle-steps`       | `bundles/bundle-steps-widget.tsx`       | Step list with reorder, duplicate, fields, dependency links, and visual flow.                    |
| P&L Estimate        | `bundle-pnl`         | `bundles/bundle-pnl-widget.tsx`         | Buy/sell notional, gas estimate, net P&L via KPI strip and collapsible breakdown.                |
| Bundle Actions      | `bundle-actions`     | `bundles/bundle-actions-widget.tsx`     | Simulate (dry run) and submit with leg count badge.                                              |
| DeFi Atomic Bundles | `defi-atomic-bundle` | `bundles/defi-atomic-bundle-widget.tsx` | DeFi-specific atomic bundle builder with Flash Loan Arb, Leverage Long, Yield Harvest templates. |

---

## Sports tab (`/services/trading/sports`)

| Display Name   | Widget ID               | File                                      | Description                                                              |
| -------------- | ----------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| Fixtures       | `sports-fixtures`       | `sports/sports-fixtures-widget.tsx`       | Fixture list with filters, live pulse, scores, and selection for detail. |
| Fixture Detail | `sports-fixture-detail` | `sports/sports-fixture-detail-widget.tsx` | Stats, timeline, odds movement, and trade panel for the selected match.  |
| Arb Scanner    | `sports-arb`            | `sports/sports-arb-widget.tsx`            | Odds grid and live arb stream with minimum arb threshold.                |
| My Bets        | `sports-my-bets`        | `sports/sports-my-bets-widget.tsx`        | KPI strip, open/settled tables, and accumulators.                        |
| Live Scores    | `sports-live-scores`    | `sports/sports-live-scores-widget.tsx`    | Compact horizontal ticker of live and suspended fixtures.                |

---

## Options & Futures tab (`/services/trading/options`)

| Display Name        | Widget ID               | File                                             | Description                                                            |
| ------------------- | ----------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| Options Controls    | `options-control-bar`   | `options/options-control-bar-widget.tsx`         | Asset class, venue, settlement, main tabs, watchlist toggle.           |
| Watchlist           | `options-watchlist`     | `options/options-watchlist-widget.tsx`           | Saved watchlists and symbol selection for the active underlying.       |
| Options Chain       | `options-chain`         | `options/options-chain-widget.tsx`               | Calls and puts per strike with greeks, IV, and open interest.          |
| Options Trade Panel | `options-trade-panel`   | `options/options-trade-panel-widget.tsx`         | Order entry for options, spreads, and combos from chain or strategies. |
| Futures Table       | `futures-table`         | `options/options-futures-table-widget.tsx`       | Perpetual and dated futures with funding, basis, and volume.           |
| Futures Trade Panel | `futures-trade-panel`   | `options/options-futures-trade-panel-widget.tsx` | Futures order entry after selecting a contract in the futures table.   |
| Strategy Builder    | `options-strategies`    | `options/options-strategies-widget.tsx`          | Futures calendar spreads and multi-leg options combos.                 |
| Scenario Analysis   | `options-scenario`      | `options/options-scenario-widget.tsx`            | Spot and vol shock grid with preset scenarios.                         |
| Greek / Vol Surface | `options-greek-surface` | `options/options-greek-surface-widget.tsx`       | Crypto greek surface; TradFi shows skew-aware vol grid.                |

---

## Predictions tab (`/services/trading/predictions`)

| Display Name      | Widget ID                | File                                            | Description                                                                          |
| ----------------- | ------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| Portfolio KPIs    | `pred-portfolio-kpis`    | `predictions/pred-portfolio-kpis-widget.tsx`    | Open positions count, total staked, unrealised P&L, and win rate.                    |
| Markets           | `pred-markets-grid`      | `predictions/pred-markets-grid-widget.tsx`      | Filterable grid of prediction markets with category, venue, sort, and search.        |
| Market Detail     | `pred-market-detail`     | `predictions/pred-market-detail-widget.tsx`     | Single market detail with price history, order book summary, and trade entry.        |
| Open Positions    | `pred-open-positions`    | `predictions/pred-open-positions-widget.tsx`    | Open prediction market positions with entry/current price and P&L.                   |
| Settled Positions | `pred-settled-positions` | `predictions/pred-settled-positions-widget.tsx` | Collapsible table of settled positions with win/loss/void outcome.                   |
| ODUM Focus        | `pred-odum-focus`        | `predictions/pred-odum-focus-widget.tsx`        | Dual-axis price/odds charts and divergence signals for crypto, TradFi, and football. |
| Arb Stream        | `pred-arb-stream`        | `predictions/pred-arb-stream-widget.tsx`        | Live prediction market arb opportunities with decay bars and execute actions.        |
| Closed Arbs       | `pred-arb-closed`        | `predictions/pred-arb-closed-widget.tsx`        | Collapsed list of closed or decayed arb opportunities.                               |
| Quick Trade       | `pred-trade-panel`       | `predictions/pred-trade-panel-widget.tsx`       | Market selector and trade panel with Kelly stake suggestion.                         |
| Top Markets       | `pred-top-markets`       | `predictions/pred-top-markets-widget.tsx`       | Top markets by volume as quick-access cards.                                         |
| Recent Trades     | `pred-recent-fills`      | `predictions/pred-recent-fills-widget.tsx`      | Recent prediction market fills.                                                      |

---

## Markets tab (`/services/trading/markets`)

| Display Name       | Widget ID                 | File                                         | Description                                                                     |
| ------------------ | ------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| Markets Controls   | `markets-controls`        | `markets/markets-controls-widget.tsx`        | Global controls: view/data mode, date range, asset, order-flow range and depth. |
| Market Order Flow  | `markets-order-flow`      | `markets/markets-order-flow-widget.tsx`      | Scrollable order table with timestamps, latency, side, venue, aggressor.        |
| Live Order Book    | `markets-live-book`       | `markets/markets-live-book-widget.tsx`       | HFT-style book and trades with bid/ask columns and legend.                      |
| My Orders          | `markets-my-orders`       | `markets/markets-my-orders-widget.tsx`       | Own order history with fill status and order IDs.                               |
| Reconciliation     | `markets-recon`           | `markets/markets-recon-widget.tsx`           | Recon runs with break counts, resolution, and break value.                      |
| Latency Summary    | `markets-latency-summary` | `markets/markets-latency-summary-widget.tsx` | Service list with p50/p95/p99 and latency view/data toggles.                    |
| Latency Detail     | `markets-latency-detail`  | `markets/markets-latency-detail-widget.tsx`  | Selected service KPIs, lifecycle bars, time series, compare table.              |
| DeFi Pool Activity | `markets-defi-amm`        | `markets/markets-defi-amm-widget.tsx`        | AMM swap/LP style table for DeFi venues (mock).                                 |

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
| Strategies        | 3            |
| Instructions      | 3            |
| DeFi (main)       | 15           |
| Bundles           | 5            |
| Sports            | 5            |
| Options & Futures | 9            |
| Predictions       | 11           |
| Markets           | 8            |
| **Total**         | **114**      |

---

## Default Preset Audit

Which widgets appear in the tab's default layout (visible on first load) vs. which are registered but only accessible via the widget catalogue (+ Add Widget).

`✅ in default preset` — shown automatically when the tab loads
`➕ catalogue only` — registered but must be manually added

| Tab                   | Widget ID                   | Status               |
| --------------------- | --------------------------- | -------------------- |
| **Accounts**          | `accounts-kpi-strip`        | ✅ in default preset |
|                       | `accounts-balance-table`    | ✅ in default preset |
|                       | `accounts-margin-util`      | ✅ in default preset |
|                       | `accounts-transfer`         | ✅ in default preset |
|                       | `accounts-transfer-history` | ✅ in default preset |
|                       | `saft-portfolio`            | ✅ in default preset |
| **Alerts**            | `alerts-kpi-strip`          | ✅ in default preset |
|                       | `alerts-table`              | ✅ in default preset |
|                       | `alerts-kill-switch`        | ✅ in default preset |
| **Book**              | `book-hierarchy-bar`        | ✅ in default preset |
|                       | `book-order-form`           | ✅ in default preset |
|                       | `book-algo-config`          | ✅ in default preset |
|                       | `book-record-details`       | ✅ in default preset |
|                       | `book-preview-compliance`   | ✅ in default preset |
|                       | `book-trade-history`        | ✅ in default preset |
| **Bundles**           | `bundle-templates`          | ✅ in default preset |
|                       | `bundle-steps`              | ✅ in default preset |
|                       | `bundle-pnl`                | ✅ in default preset |
|                       | `bundle-actions`            | ✅ in default preset |
|                       | `defi-atomic-bundle`        | ✅ in default preset |
| **DeFi**              | `defi-wallet-summary`       | ✅ in default preset |
|                       | `defi-lending`              | ✅ in default preset |
|                       | `defi-swap`                 | ✅ in default preset |
|                       | `defi-liquidity`            | ✅ in default preset |
|                       | `defi-staking`              | ✅ in default preset |
|                       | `defi-flash-loans`          | ➕ catalogue only    |
|                       | `defi-transfer`             | ✅ in default preset |
|                       | `defi-rates-overview`       | ➕ catalogue only    |
|                       | `defi-trade-history`        | ✅ in default preset |
|                       | `defi-strategy-config`      | ✅ in default preset |
|                       | `defi-staking-rewards`      | ✅ in default preset |
|                       | `defi-funding-matrix`       | ✅ in default preset |
|                       | `defi-waterfall-weights`    | ✅ in default preset |
|                       | `defi-health-factor`        | ✅ in default preset |
|                       | `defi-reward-pnl`           | ✅ in default preset |
| **Instructions**      | `instr-summary`             | ✅ in default preset |
|                       | `instr-pipeline-table`      | ✅ in default preset |
|                       | `instr-detail-panel`        | ✅ in default preset |
| **Markets**           | `markets-controls`          | ✅ in default preset |
|                       | `markets-order-flow`        | ✅ in default preset |
|                       | `markets-live-book`         | ✅ in default preset |
|                       | `markets-my-orders`         | ✅ in default preset |
|                       | `markets-recon`             | ✅ in default preset |
|                       | `markets-latency-summary`   | ✅ in default preset |
|                       | `markets-latency-detail`    | ✅ in default preset |
|                       | `markets-defi-amm`          | ➕ catalogue only    |
| **Options & Futures** | `options-control-bar`       | ✅ in default preset |
|                       | `options-watchlist`         | ✅ in default preset |
|                       | `options-chain`             | ✅ in default preset |
|                       | `options-trade-panel`       | ✅ in default preset |
|                       | `futures-table`             | ✅ in default preset |
|                       | `futures-trade-panel`       | ➕ catalogue only    |
|                       | `options-strategies`        | ✅ in default preset |
|                       | `options-scenario`          | ✅ in default preset |
|                       | `options-greek-surface`     | ✅ in default preset |
| **Orders**            | `orders-kpi-strip`          | ✅ in default preset |
|                       | `orders-table`              | ✅ in default preset |
| **Overview**          | `scope-summary`             | ✅ in default preset |
|                       | `pnl-chart`                 | ✅ in default preset |
|                       | `kpi-strip`                 | ✅ in default preset |
|                       | `strategy-table`            | ✅ in default preset |
|                       | `pnl-attribution`           | ✅ in default preset |
|                       | `alerts-preview`            | ✅ in default preset |
|                       | `recent-fills`              | ✅ in default preset |
|                       | `health-grid`               | ✅ in default preset |
| **P&L**               | `pnl-controls`              | ✅ in default preset |
|                       | `pnl-waterfall`             | ✅ in default preset |
|                       | `pnl-time-series`           | ✅ in default preset |
|                       | `pnl-by-client`             | ✅ in default preset |
|                       | `pnl-factor-drilldown`      | ✅ in default preset |
|                       | `pnl-report-button`         | ➕ catalogue only    |
| **Positions**         | `positions-kpi-strip`       | ✅ in default preset |
|                       | `positions-table`           | ✅ in default preset |
| **Predictions**       | `pred-markets-grid`         | ✅ in default preset |
|                       | `pred-market-detail`        | ➕ catalogue only    |
|                       | `pred-portfolio-kpis`       | ✅ in default preset |
|                       | `pred-open-positions`       | ✅ in default preset |
|                       | `pred-settled-positions`    | ➕ catalogue only    |
|                       | `pred-odum-focus`           | ✅ in default preset |
|                       | `pred-arb-stream`           | ✅ in default preset |
|                       | `pred-arb-closed`           | ✅ in default preset |
|                       | `pred-trade-panel`          | ✅ in default preset |
|                       | `pred-top-markets`          | ➕ catalogue only    |
|                       | `pred-recent-fills`         | ✅ in default preset |
| **Risk**              | `risk-kpi-strip`            | ✅ in default preset |
|                       | `risk-strategy-heatmap`     | ✅ in default preset |
|                       | `risk-utilization`          | ✅ in default preset |
|                       | `risk-var-chart`            | ✅ in default preset |
|                       | `risk-stress-table`         | ✅ in default preset |
|                       | `risk-exposure-attribution` | ✅ in default preset |
|                       | `risk-greeks-summary`       | ✅ in default preset |
|                       | `risk-margin`               | ✅ in default preset |
|                       | `risk-term-structure`       | ✅ in default preset |
|                       | `risk-limits-hierarchy`     | ✅ in default preset |
|                       | `risk-what-if-slider`       | ✅ in default preset |
|                       | `risk-circuit-breakers`     | ✅ in default preset |
|                       | `risk-correlation-heatmap`  | ✅ in default preset |
| **Sports**            | `sports-fixtures`           | ✅ in default preset |
|                       | `sports-fixture-detail`     | ✅ in default preset |
|                       | `sports-arb`                | ✅ in default preset |
|                       | `sports-my-bets`            | ✅ in default preset |
|                       | `sports-live-scores`        | ✅ in default preset |
| **Strategies**        | `strategies-kpi-strip`      | ✅ in default preset |
|                       | `strategies-catalogue`      | ✅ in default preset |
|                       | `strategies-grid-link`      | ✅ in default preset |
| **Terminal**          | `instrument-bar`            | ✅ in default preset |
|                       | `price-chart`               | ✅ in default preset |
|                       | `depth-chart`               | ➕ catalogue only    |
|                       | `terminal-options`          | ➕ catalogue only    |
|                       | `order-book`                | ✅ in default preset |
|                       | `order-entry`               | ✅ in default preset |
|                       | `market-trades`             | ✅ in default preset |
|                       | `calendar-events`           | ✅ in default preset |

### Catalogue-only summary (10 widgets not in any default preset)

| Widget ID                | Tab               | Why it might be catalogue-only                              |
| ------------------------ | ----------------- | ----------------------------------------------------------- |
| `depth-chart`            | Terminal          | Just split out from price-chart; not yet placed in preset   |
| `terminal-options`       | Terminal          | Just split out from price-chart; not yet placed in preset   |
| `defi-flash-loans`       | DeFi              | Advanced / power-user feature                               |
| `defi-rates-overview`    | DeFi              | Supplementary overview, not core workflow                   |
| `markets-defi-amm`       | Markets           | DeFi-specific sub-view, not core markets workflow           |
| `futures-trade-panel`    | Options & Futures | Secondary panel; shown on demand after selecting a contract |
| `pnl-report-button`      | P&L               | Single-button CTA, optional add-on                          |
| `pred-market-detail`     | Predictions       | Master-detail secondary panel                               |
| `pred-settled-positions` | Predictions       | Secondary view, collapsed by default                        |
| `pred-top-markets`       | Predictions       | Supplementary quick-access cards                            |
