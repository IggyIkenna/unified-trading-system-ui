# Widget pairing guide

How to combine workspace widgets by **use case**. Widgets are scoped to their **tab** (workspace route); switch tabs or use multiple browser windows for dense layouts.

Canonical IDs come from `components/widgets/*/register.ts`. **Per-widget user docs** live next to code in `components/widgets/<tab>/*.md` (and each tab’s `README.md`). **Implementation specs** for each tab: `components/widgets/<tab>/<tab>-widgets.md` (e.g. `accounts/accounts-widgets.md`).

---

## Widget inventory (tab → widget ID)

| Tab              | Widget IDs                                                                                                                                                                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **overview**     | `scope-summary`, `pnl-chart`, `kpi-strip`, `strategy-table`, `pnl-attribution`, `alerts-preview`, `recent-fills`, `health-grid`, `calendar-events` (also on terminal)                                                                                                                               |
| **terminal**     | `instrument-bar`, `order-book`, `price-chart`, `order-entry`, `market-trades`, `calendar-events`                                                                                                                                                                                                    |
| **positions**    | `positions-filter`, `positions-kpi-strip`, `positions-table`, `account-balances`                                                                                                                                                                                                                    |
| **orders**       | `orders-filter`, `orders-kpi-strip`, `orders-table`                                                                                                                                                                                                                                                 |
| **risk**         | `risk-kpi-strip`, `risk-strategy-heatmap`, `risk-utilization`, `risk-var-chart`, `risk-stress-table`, `risk-exposure-attribution`, `risk-greeks-summary`, `risk-margin`, `risk-term-structure`, `risk-limits-hierarchy`, `risk-what-if-slider`, `risk-circuit-breakers`, `risk-correlation-heatmap` |
| **alerts**       | `alerts-kpi-strip`, `alerts-filter-bar`, `alerts-table`, `alerts-kill-switch`                                                                                                                                                                                                                       |
| **strategies**   | `strategies-kpi-strip`, `strategies-filter-bar`, `strategies-catalogue`, `strategies-grid-link`                                                                                                                                                                                                     |
| **accounts**     | `accounts-kpi-strip`, `accounts-balance-table`, `accounts-margin-util`, `accounts-transfer`, `accounts-transfer-history`                                                                                                                                                                            |
| **pnl**          | `pnl-controls`, `pnl-waterfall`, `pnl-time-series`, `pnl-by-client`, `pnl-factor-drilldown`, `pnl-report-button`                                                                                                                                                                                    |
| **markets**      | `markets-controls`, `markets-order-flow`, `markets-live-book`, `markets-my-orders`, `markets-recon`, `markets-latency-summary`, `markets-latency-detail`, `markets-defi-amm`                                                                                                                        |
| **book**         | `book-hierarchy-bar`, `book-order-form`, `book-algo-config`, `book-record-details`, `book-preview-compliance`                                                                                                                                                                                       |
| **options**      | `options-control-bar`, `options-watchlist`, `options-chain`, `options-trade-panel`, `futures-table`, `futures-trade-panel`, `options-strategies`, `options-scenario`, `options-greek-surface`                                                                                                       |
| **predictions**  | `pred-markets-grid`, `pred-market-detail`, `pred-portfolio-kpis`, `pred-open-positions`, `pred-settled-positions`, `pred-odum-focus`, `pred-arb-stream`, `pred-arb-closed`, `pred-trade-panel`, `pred-top-markets`, `pred-recent-fills`                                                             |
| **sports**       | `sports-filter-bar`, `sports-fixtures`, `sports-fixture-detail`, `sports-arb`, `sports-my-bets`, `sports-live-scores`                                                                                                                                                                               |
| **defi**         | `defi-wallet-summary`, `defi-lending`, `defi-swap`, `defi-liquidity`, `defi-staking`, `defi-flash-loans`, `defi-transfer`, `defi-rates-overview`                                                                                                                                                    |
| **bundles**      | `bundle-templates`, `bundle-steps`, `bundle-pnl`, `bundle-actions`                                                                                                                                                                                                                                  |
| **instructions** | `instr-filter-bar`, `instr-summary`, `instr-pipeline-table`, `instr-detail-panel`                                                                                                                                                                                                                   |

---

## Use case → recommended combinations

Each row is a **primary stack** (same tab) plus **cross-tab** widgets that complement it. Preset IDs in `register.ts` (e.g. `risk-quick`, `terminal-default`) are good starting layouts.

| Use case                 | Primary tab(s) & widgets                                                                                                                                                                                                                                                                          | Cross-tab complements                                                                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Day Trading**          | **terminal**: `instrument-bar`, `order-book`, `price-chart`, `order-entry`, `market-trades`, `calendar-events`                                                                                                                                                                                    | **overview**: `kpi-strip`, `recent-fills`, `alerts-preview` · **orders**: `orders-filter`, `orders-kpi-strip`, `orders-table` · **markets**: `markets-order-flow`, `markets-live-book`                                  |
| **Risk Management**      | **risk**: `risk-kpi-strip`, `risk-strategy-heatmap`, `risk-var-chart`, `risk-stress-table`, `risk-utilization`, `risk-exposure-attribution`, `risk-limits-hierarchy`, `risk-circuit-breakers`, `risk-correlation-heatmap`, `risk-what-if-slider` (use preset `risk-cro-briefing` or `risk-quick`) | **alerts**: `alerts-kpi-strip`, `alerts-table`, `alerts-kill-switch` · **overview**: `kpi-strip`, `alerts-preview` · **positions**: `positions-kpi-strip`, `positions-table`                                            |
| **Portfolio Management** | **positions**: `positions-filter`, `positions-kpi-strip`, `account-balances`, `positions-table` · **accounts**: `accounts-kpi-strip`, `accounts-balance-table`, `accounts-margin-util`, `accounts-transfer`, `accounts-transfer-history`                                                          | **overview**: `scope-summary`, `pnl-chart`, `strategy-table`, `pnl-attribution` · **strategies**: `strategies-kpi-strip`, `strategies-catalogue` · **pnl**: `pnl-controls`, `pnl-by-client`, `pnl-waterfall`            |
| **Market Making**        | **markets**: `markets-controls`, `markets-live-book`, `markets-order-flow`, `markets-my-orders`, `markets-recon` · **book**: `book-hierarchy-bar`, `book-order-form`, `book-algo-config`, `book-preview-compliance`                                                                               | **terminal**: `order-book`, `market-trades` · **risk**: `risk-margin`, `risk-circuit-breakers`, `risk-utilization`, `risk-limits-hierarchy` · **orders**: `orders-table`                                                |
| **DeFi Operations**      | **defi**: `defi-wallet-summary`, `defi-lending`, `defi-swap`, `defi-liquidity`, `defi-staking`, `defi-rates-overview`, `defi-transfer` (+ `defi-flash-loans` for advanced)                                                                                                                        | **risk**: `risk-margin`, `risk-stress-table` · **markets**: `markets-defi-amm` · **positions**: `positions-table`, `account-balances` · **bundles**: `bundle-templates`, `bundle-steps`, `bundle-pnl`, `bundle-actions` |
| **Sports Betting**       | **sports**: `sports-filter-bar`, `sports-fixtures`, `sports-fixture-detail`, `sports-my-bets` (+ `sports-arb`, `sports-live-scores` for arb/live workflows)                                                                                                                                       | **predictions**: `pred-odum-focus`, `pred-trade-panel` (cross-asset context) · **overview**: `kpi-strip`                                                                                                                |
| **P&L Analysis**         | **pnl**: `pnl-controls`, `pnl-waterfall`, `pnl-time-series`, `pnl-by-client`, `pnl-factor-drilldown`, `pnl-report-button`                                                                                                                                                                         | **overview**: `pnl-chart`, `pnl-attribution`, `kpi-strip`, `strategy-table` · **strategies**: `strategies-grid-link`                                                                                                    |
| **Order Management**     | **orders**: `orders-filter`, `orders-kpi-strip`, `orders-table` · **instructions**: `instr-filter-bar`, `instr-summary`, `instr-pipeline-table`, `instr-detail-panel`                                                                                                                             | **book**: `book-order-form`, `book-record-details` · **terminal**: `order-entry`, `market-trades` · **overview**: `recent-fills` · **alerts**: `alerts-table`                                                           |

---

## Pairing matrix (which tabs reinforce each other)

|               | Strong pairs                                                            |
| ------------- | ----------------------------------------------------------------------- |
| **terminal**  | orders, markets, book, overview (fills/alerts/KPIs), risk (when sizing) |
| **positions** | accounts, pnl, overview, risk                                           |
| **orders**    | terminal, book, instructions, alerts                                    |
| **risk**      | alerts, positions, overview, markets (latency/recon for ops risk)       |
| **pnl**       | overview, strategies, positions                                         |
| **defi**      | risk, positions, markets (`markets-defi-amm`), bundles                  |
| **sports**    | predictions (narrative/odds), overview                                  |

---

## Related

- Presets: `components/widgets/preset-registry.ts` and each tab’s `registerPresets` block.
- Per-tab docs: `components/widgets/<tab>/` — `README.md`, `<tab>-widgets.md` (spec), and optional `<widget-id>.md` files.
- Index: `components/widgets/README.md`.
