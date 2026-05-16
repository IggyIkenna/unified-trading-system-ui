# System Inventory — April 2026

**Purpose:** Read-only reconnaissance of the actual UI and backend repos as they exist today.
No comparisons, no recommendations — just what is here, where it lives, and what it appears to do.

---

## 1. UI Repo Overview — `unified-trading-system-ui`

### Tech stack

| Dimension        | Detail                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Framework        | Next.js 16.2.1 (App Router)                                                                                               |
| React            | 19.2.4                                                                                                                    |
| TypeScript       | 5.7.3                                                                                                                     |
| Styling          | Tailwind CSS v4, `class-variance-authority`, Radix UI primitives (full set)                                               |
| State management | Zustand v5 (stores: workspace, global-scope, auth, filter, ui-prefs, defi-strategy, promote-lifecycle, combo-persistence) |
| Server state     | TanStack Query v5                                                                                                         |
| Charting         | `lightweight-charts` v5 (candlestick/price), Recharts 2.15 (analytics charts)                                             |
| Grid layout      | `react-grid-layout` v2 — widget drag-and-drop on 24-column grid                                                           |
| Tables           | `@tanstack/react-table` v8 + `@tanstack/react-virtual`                                                                    |
| Auth             | Firebase (Auth + Firestore + Storage); demo/mock mode via `NEXT_PUBLIC_AUTH_PROVIDER=demo`                                |
| Forms            | `react-hook-form` + Zod                                                                                                   |
| Icons            | Lucide React                                                                                                              |
| Fonts            | IBM Plex Sans + JetBrains Mono (Google Fonts)                                                                             |
| Build            | Webpack (dev), Turbopack available via `next dev --turbo`                                                                 |
| Tests            | Vitest (unit/integration/audit), Playwright (E2E, smoke, invariants, marketing, static)                                   |
| Mock mode        | `NEXT_PUBLIC_MOCK_API=true` — intercepts all `/api/*` fetches client-side via `lib/api/mock-handler.ts`                   |
| PDF export       | jsPDF, `html-to-image`, `write-excel-file`                                                                                |
| Guided tour      | `react-joyride`                                                                                                           |

### Top-level folder structure

| Folder                    | One-line description                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `app/`                    | Next.js App Router — three route groups: `(public)`, `(platform)`, `(ops)`, plus `/api` routes |
| `components/`             | All React components, organised by domain/feature (30+ subdirs)                                |
| `hooks/`                  | React hooks — `api/` for data fetching, `deployment/`, and general-purpose                     |
| `lib/`                    | Shared logic — stores, providers, API config, mock fixtures, types, utilities                  |
| `styles/`                 | Global CSS (minimal — Tailwind-driven)                                                         |
| `public/`                 | Static assets                                                                                  |
| `server/`                 | Next.js server-only utilities                                                                  |
| `context/`                | React context providers (separate from `lib/context`)                                          |
| `functions/`              | Firebase Cloud Functions (TypeScript sub-package)                                              |
| `scripts/`                | Dev tooling scripts (admin seed, IR presentation generator, orphan audit)                      |
| `config/`                 | Additional Next/build config                                                                   |
| `extra/`                  | Misc extra files                                                                               |
| `archive/`                | Archived/deprecated components kept for reference only                                         |
| `docs/`                   | Platform documentation (audits, reference, core, trading, etc.)                                |
| `__tests__/` and `tests/` | Test files                                                                                     |

### Routes / pages

#### Route groups

- `(public)` — unauthenticated marketing site and auth flows
- `(platform)` — authenticated trading platform (dashboard + services)
- `(ops)` — internal operations and admin tooling

#### Public routes (`(public)`)

| Route                         | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `/`                           | Marketing home page                     |
| `/platform`                   | DART service marketing page             |
| `/investment-management`      | Investment management service marketing |
| `/regulatory`                 | Regulatory umbrella marketing           |
| `/our-story`                  | About / who we are                      |
| `/story`                      | Alternate story page                    |
| `/who-we-are`                 | Team/company page                       |
| `/faq`                        | FAQ                                     |
| `/contact`                    | Contact form                            |
| `/privacy`                    | Privacy policy                          |
| `/terms`                      | Terms of service                        |
| `/login`                      | Firebase login                          |
| `/signup`                     | Signup form                             |
| `/pending`                    | Pending approval screen                 |
| `/demo`                       | Demo request page                       |
| `/demo/preview`               | Demo preview                            |
| `/demo-session`               | Demo session entry                      |
| `/briefings`                  | Briefings hub (access-gated)            |
| `/briefings/[slug]`           | Individual briefing                     |
| `/docs`                       | Platform docs                           |
| `/questionnaire`              | Prospective client questionnaire        |
| `/strategy-evaluation`        | External strategy evaluation submission |
| `/strategy-evaluation/status` | Strategy evaluation status check        |
| `/strategy-review`            | Strategy review link entry              |
| `/start-your-review`          | Entry point for external review         |
| `/auth/reset-password`        | Password reset flow                     |
| `/auth/verify-email`          | Email verification                      |
| `/services/backtesting`       | Backtesting service marketing           |
| `/services/data`              | Data service marketing                  |
| `/services/investment`        | Investment service marketing            |
| `/services/platform`          | Platform service marketing              |
| `/services/regulatory`        | Regulatory service marketing            |

#### Platform routes (`(platform)`)

**Dashboard:**

| Route        | Purpose                 |
| ------------ | ----------------------- |
| `/dashboard` | Main platform dashboard |

**Trading surfaces** (`/services/trading/`):

| Route                                           | Widget tab     | Purpose                                                                                                                                                                          |
| ----------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/services/trading/overview`                    | `overview`     | Portfolio overview — KPIs, P&L chart, strategy table, recent fills, health grid                                                                                                  |
| `/services/trading/terminal`                    | `terminal`     | Analytics + reconciliation surface with manual-order emergency capability; includes price chart, order book, order entry, watchlist, market trades, calendar events, events feed |
| `/services/trading/book`                        | `book`         | Trade history, hierarchy bar, manual order entry                                                                                                                                 |
| `/services/trading/orders`                      | `orders`       | Orders table and KPI strip                                                                                                                                                       |
| `/services/trading/positions`                   | `positions`    | Positions table and KPI strip                                                                                                                                                    |
| `/services/trading/positions/trades`            | —              | Positions + trades combined view                                                                                                                                                 |
| `/services/trading/alerts`                      | `alerts`       | Alerts table, KPI strip, kill switch widget                                                                                                                                      |
| `/services/trading/risk`                        | `risk`         | Full risk dashboard — VaR, Greeks, stress, correlation, limits, circuit breakers, what-if                                                                                        |
| `/services/trading/pnl`                         | `pnl`          | P&L waterfall, time series, factor drilldown                                                                                                                                     |
| `/services/trading/accounts`                    | `accounts`     | Account balances, margin utilisation, transfer history, SAFT portfolio                                                                                                           |
| `/services/trading/accounts/saft`               | —              | SAFT portfolio detail                                                                                                                                                            |
| `/services/trading/instructions`                | `instructions` | Strategy instruction pipeline, detail panel, summary                                                                                                                             |
| `/services/trading/markets`                     | `markets`      | Live order book, order flow, my orders, latency, recon, DeFi AMM                                                                                                                 |
| `/services/trading/strategies`                  | `strategies`   | Strategy catalogue, KPI strip, family browser, specialised strategy dashboards                                                                                                   |
| `/services/trading/strategies/[id]`             | —              | Individual strategy detail                                                                                                                                                       |
| `/services/trading/strategies/[id]/versions`    | —              | Strategy version history                                                                                                                                                         |
| `/services/trading/strategies/carry-basis`      | —              | Carry/basis strategies standalone view                                                                                                                                           |
| `/services/trading/strategies/grid`             | —              | Grid strategy view                                                                                                                                                               |
| `/services/trading/strategies/staked-basis`     | —              | Staked basis strategy view                                                                                                                                                       |
| `/services/trading/strategies/model-portfolios` | —              | Model portfolios (standalone, no widget grid)                                                                                                                                    |
| `/services/trading/strategy-config`             | —              | Strategy configuration panel                                                                                                                                                     |
| `/services/trading/deployment`                  | —              | Deployment status within trading section                                                                                                                                         |
| `/services/trading/tradfi`                      | —              | TradFi rates/vol surface widgets                                                                                                                                                 |
| `/services/trading/custom/[id]`                 | `custom-[id]`  | User-created custom workspace panels                                                                                                                                             |

**DeFi** (`/services/trading/defi/`):

| Route                            | Purpose                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/services/trading/defi`         | `defi` tab — wallet summary, lending, swap, liquidity, staking, flash loans, transfer, rates, yield chart, enhanced basis, strategy config |
| `/services/trading/defi/bundles` | `bundles` tab — bundle builder, atomic DeFi bundle                                                                                         |
| `/services/trading/defi/staking` | Staking standalone page                                                                                                                    |

**Sports** (`/services/trading/sports/`):

| Route                                   | Purpose                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `/services/trading/sports`              | `sports` tab — fixtures, arb scanner, my bets, live scores, standings, CLV, ML status |
| `/services/trading/sports/bet`          | Bet-slip standalone page                                                              |
| `/services/trading/sports/accumulators` | Accumulators standalone page                                                          |

**Options & Futures** (`/services/trading/options/`):

| Route                               | Purpose                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `/services/trading/options`         | `options` tab — control bar, watchlist, options chain, futures table, options strategies, Greek surface |
| `/services/trading/options/combos`  | Multi-leg options combo builder standalone                                                              |
| `/services/trading/options/pricing` | Options pricing standalone page                                                                         |

**Predictions** (`/services/trading/predictions/`):

| Route                                       | Purpose                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `/services/trading/predictions`             | `predictions` tab — prediction markets grid, portfolio KPIs, open/settled positions, arb stream, trade panel |
| `/services/trading/predictions/aggregators` | Aggregators standalone page                                                                                  |

**Data services** (`/services/data/`): overview, instruments, raw, processing, events, coverage, gaps, completeness, valuation, markets/pnl, logs, venues, missing

**Execution** (`/services/execution/`): overview, algos, venues, TCA, benchmarks, candidates, handoff, individual execution detail `[executionId]`

**Research** (`/services/research/`): overview, features, feature ETL, ML (pipeline/training/analysis/registry/grid-config/monitoring/governance/config), strategies, execution, quant workspace, signals

**Strategy research** (`/services/research/strategy/`): overview, families, catalog, catalog/[strategyId], unity, venues, execution-policies, backtests, compare, results, heatmap, candidates, handoff, sports

**Observe** (`/services/observe/`): risk, alerts, news, strategy-health, scenarios, health, event-audit, reconciliation, recovery, registry

**Manage** (`/services/manage/`): clients, mandates, fees, users, user-request, compliance, best-execution

**Reports** (`/services/reports/`): P&L/overview, performance, trades, executive, IBOR, NAV, fund-operations, settlement, analytics, reconciliation, regulatory, invoices, strategy-catalogue, own-account

**Promote** (`/services/promote/`): pipeline overview + lifecycle stages (data-validation, model-assessment, paper-trading, risk-stress, execution-readiness, governance, capital-allocation, champion)

**Investment management** (`/services/im/`): funds (overview, allocations, history, subscriptions, redemptions), allocator

**Strategy catalogue** (`/services/strategy-catalogue/`): overview, coverage, by-combination, blocked, envelope, admin/lock-state, strategies/[archetype]/[slot]

**Signals** (`/services/signals/`): dashboard, counterparties

**Trading platform** (`/services/trading-platform/`): allocator

**Investor relations** (`/investor-relations/`): overview, board-presentation, disaster-recovery, investment-presentation, plan-presentation, platform-presentation, regulatory-presentation, site-navigation

**Settings** (`/settings/`): profile, notifications, api-keys

#### Ops routes (`(ops)`)

| Route group          | Pages                                                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin/`            | Users, requests, catalogue, onboard, templates, firebase-users, groups, questionnaires, strategy-evaluations, notifications, organizations, apps, github, audit-log, health-checks, data, demo-sessions, strategy-catalogue, strategy-universe, strategy-lifecycle-editor, strategy-reviews, system-health |
| `/admin/users/[id]/` | User detail, modify, offboard, persona-override, visibility                                                                                                                                                                                                                                                |
| `/approvals/`        | Approvals queue, strategy-versions                                                                                                                                                                                                                                                                         |
| `/devops/`           | Overview, schemas, topology                                                                                                                                                                                                                                                                                |
| `/ops/`              | Services, jobs                                                                                                                                                                                                                                                                                             |
| `/internal/`         | Internal overview, data-etl                                                                                                                                                                                                                                                                                |
| `/config/`           | Configuration page                                                                                                                                                                                                                                                                                         |
| `/seed-demo/`        | Demo data seeding                                                                                                                                                                                                                                                                                          |

#### API routes (`app/api/`)

Native Next.js server routes:

- `/api/v1/users/*` — user CRUD, documents, offboard, reprovision, workflows, Microsoft 365 provisioning, effective-access
- `/api/v1/groups/*` — group management
- `/api/v1/apps/*` — app entitlements, capabilities
- `/api/v1/onboarding-requests/*` — approve/reject onboarding
- `/api/v1/admin/*` — health checks, stats
- `/api/v1/github/*` — repo discovery, assignments, access scan
- `/api/v1/settings/*` — profile, password change
- `/api/auth/*` — email verification, password reset
- `/api/onboarding/*` — document upload/download
- `/api/demo-session/*` — issue/revoke/verify demo links
- `/api/strategy-review/*`, `/api/strategy-evaluation/*` — external review flows

All `/api/market-data/*`, `/api/positions/*`, `/api/orders/*`, etc. are proxied by `next.config.mjs` rewrites to the `unified-trading-api` backend (port 8030) or `deployment-api` (port 8004).

### Widget inventory

#### Widget grid architecture

The platform uses a **tab-based widget workspace** — each trading section (`terminal`, `positions`, `orders`, etc.) renders a `<WidgetGrid tab="...">`. Widgets are drag-and-drop on a 24-column react-grid-layout. Each widget has `minW/H`, `maxW/H`, `defaultW/H` in the registry. Presets provide named layouts ("Default", "Full", "Compact", etc.); users can save custom workspaces and snapshots (up to 30 undo levels, 20 snapshots per workspace). Workspaces are persisted via Zustand + Firestore sync (`workspace-sync.ts`).

17 domain data providers (`AllWidgetProviders`) are globally mounted on the trading layout — all active simultaneously (lazy activation deferred per existing BP-5 TODO comment in `all-widget-providers.tsx:5`).

The widget catalogue drawer (`widget-catalog-drawer.tsx`) groups widgets by `catalogGroup` and `assetGroup` (CEFI/DEFI/TRADFI/SPORTS/PREDICTION/PLATFORM). Each widget definition carries `families[]` and `archetypes[]` tags for scope-aware rendering.

#### All registered widgets

**Overview tab** (`catalogGroup: "Overview"`)

| Widget ID         | File                                  | What it does                                                       |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `scope-summary`   | `overview/scope-summary-widget.tsx`   | Shows active scope (org/client/strategy filters) at a glance       |
| `pnl-chart`       | `overview/pnl-chart-widget.tsx`       | P&L time-series line chart for the active scope                    |
| `kpi-strip`       | `overview/kpi-strip-widget.tsx`       | Row of KPI cards (positions count, exposure, unrealised P&L, etc.) |
| `strategy-table`  | `overview/strategy-table-widget.tsx`  | Table of active strategies with status/P&L columns                 |
| `pnl-attribution` | `overview/pnl-attribution-widget.tsx` | P&L attribution breakdown chart                                    |
| `alerts-preview`  | `overview/alerts-preview-widget.tsx`  | Compact alerts feed preview                                        |
| `recent-fills`    | `overview/recent-fills-widget.tsx`    | Last N filled orders                                               |
| `health-grid`     | `overview/health-grid-widget.tsx`     | Service health status grid                                         |

**Terminal tab** (`catalogGroup: "Terminal"`)

| Widget ID            | File                                     | What it does                                       |
| -------------------- | ---------------------------------------- | -------------------------------------------------- |
| `terminal-watchlist` | `terminal/terminal-watchlist-widget.tsx` | Watchlist of instruments with live prices          |
| `order-book`         | `terminal/order-book-widget.tsx`         | Live bid/ask order book depth display              |
| `price-chart`        | `terminal/price-chart-widget.tsx`        | Candlestick/OHLCV price chart (lightweight-charts) |
| `terminal-options`   | `terminal/terminal-options-widget.tsx`   | Options summary panel in terminal context          |
| `order-entry`        | `terminal/order-entry-widget.tsx`        | Manual order entry form (market/limit/stop)        |
| `market-trades`      | `terminal/market-trades-widget.tsx`      | Live tape of recent market trades                  |
| `calendar-events`    | `terminal/calendar-events-widget.tsx`    | Economic calendar events strip                     |
| `events-feed`        | `terminal/events-feed-widget.tsx`        | Live event notifications feed                      |

**Positions tab** (`catalogGroup: "Positions"`)

| Widget ID             | File                                   | What it does                                           |
| --------------------- | -------------------------------------- | ------------------------------------------------------ |
| `positions-kpi-strip` | `positions/positions-kpi-widget.tsx`   | KPI strip: total positions, gross/net exposure, margin |
| `positions-table`     | `positions/positions-table-widget.tsx` | Full positions table with sorting/filtering            |

**Trades sub-tab** (`catalogGroup: "Trades"`)

| Widget ID                | File                             | What it does         |
| ------------------------ | -------------------------------- | -------------------- |
| `positions-trades-table` | `trades/trades-table-widget.tsx` | Trades history table |

**Orders tab** (`catalogGroup: "Orders"`)

| Widget ID          | File                                 | What it does                               |
| ------------------ | ------------------------------------ | ------------------------------------------ |
| `orders-kpi-strip` | `orders/orders-kpi-strip-widget.tsx` | KPI strip: pending/filled/cancelled counts |
| `orders-table`     | `orders/orders-table-widget.tsx`     | Orders blotter table                       |

**Alerts tab** (`catalogGroup: "Alerts"`)

| Widget ID            | File                                   | What it does                             |
| -------------------- | -------------------------------------- | ---------------------------------------- |
| `alerts-kpi-strip`   | `alerts/alerts-kpi-strip-widget.tsx`   | Alert counts by severity                 |
| `alerts-table`       | `alerts/alerts-table-widget.tsx`       | Alerts log table with acknowledge action |
| `alerts-kill-switch` | `alerts/alerts-kill-switch-widget.tsx` | Kill switch panel with confirmation flow |

**Risk tab** (`catalogGroup: "Risk"`)

| Widget ID                   | File                                        | What it does                                      |
| --------------------------- | ------------------------------------------- | ------------------------------------------------- |
| `risk-kpi-strip`            | `risk/risk-kpi-strip-widget.tsx`            | Risk KPIs: VaR, max drawdown, margin utilisation  |
| `risk-strategy-heatmap`     | `risk/risk-strategy-heatmap-widget.tsx`     | Heatmap of strategy-level risk metrics            |
| `risk-utilization`          | `risk/risk-utilization-widget.tsx`          | Limit utilisation bar chart                       |
| `risk-var-chart`            | `risk/risk-var-chart-widget.tsx`            | VaR historical chart                              |
| `risk-stress-table`         | `risk/risk-stress-table-widget.tsx`         | Stress test scenario results table                |
| `risk-exposure-attribution` | `risk/risk-exposure-attribution-widget.tsx` | Exposure breakdown by factor/asset class          |
| `risk-greeks-summary`       | `risk/risk-greeks-summary-widget.tsx`       | Aggregate Greeks (delta/gamma/vega/theta)         |
| `risk-margin`               | `risk/risk-margin-widget.tsx`               | Margin usage breakdown                            |
| `risk-term-structure`       | `risk/risk-term-structure-widget.tsx`       | Term structure of risk metrics                    |
| `risk-limits-hierarchy`     | `risk/risk-limits-hierarchy-widget.tsx`     | Hierarchical risk limits tree                     |
| `risk-what-if-slider`       | `risk/risk-what-if-slider-widget.tsx`       | What-if scenario slider for position/price shocks |
| `risk-circuit-breakers`     | `risk/risk-circuit-breakers-widget.tsx`     | Circuit breaker status and thresholds             |
| `risk-correlation-heatmap`  | `risk/risk-correlation-heatmap-widget.tsx`  | Asset correlation matrix heatmap                  |
| `risk-live-alert-feed`      | `risk/risk-live-alert-feed-widget.tsx`      | Live streaming risk alert feed                    |

**P&L tab** (`catalogGroup: "P&L"`)

| Widget ID              | File                                  | What it does                           |
| ---------------------- | ------------------------------------- | -------------------------------------- |
| `pnl-waterfall`        | `pnl/pnl-waterfall-widget.tsx`        | P&L waterfall chart by factor/strategy |
| `pnl-time-series`      | `pnl/pnl-time-series-widget.tsx`      | P&L time series with period selector   |
| `pnl-factor-drilldown` | `pnl/pnl-factor-drilldown-widget.tsx` | Factor-level P&L drilldown             |

**Markets tab** (`catalogGroup: "Markets"`)

| Widget ID                 | File                                         | What it does                               |
| ------------------------- | -------------------------------------------- | ------------------------------------------ |
| `markets-controls`        | `markets/markets-controls-widget.tsx`        | Instrument/venue selector bar              |
| `markets-order-flow`      | `markets/markets-order-flow-widget.tsx`      | Order flow imbalance chart                 |
| `markets-live-book`       | `markets/markets-live-book-widget.tsx`       | Live order book widget                     |
| `markets-my-orders`       | `markets/markets-my-orders-widget.tsx`       | User's own active orders in market context |
| `markets-recon`           | `markets/markets-recon-widget.tsx`           | Position reconciliation against exchange   |
| `markets-latency-summary` | `markets/markets-latency-summary-widget.tsx` | Round-trip latency summary KPIs            |
| `markets-latency-detail`  | `markets/markets-latency-detail-widget.tsx`  | Per-venue latency detail table             |
| `markets-defi-amm`        | `markets/markets-defi-amm-widget.tsx`        | DeFi AMM pool depth and price impact       |

**Accounts tab** (`catalogGroup: "Accounts"`)

| Widget ID                   | File                                            | What it does                        |
| --------------------------- | ----------------------------------------------- | ----------------------------------- |
| `accounts-kpi-strip`        | `accounts/accounts-kpi-widget.tsx`              | Account balance KPIs across venues  |
| `accounts-balance-table`    | `accounts/accounts-balance-table-widget.tsx`    | Per-venue balance table             |
| `accounts-margin-util`      | `accounts/accounts-margin-util-widget.tsx`      | Margin utilisation per account      |
| `accounts-transfer`         | `accounts/accounts-transfer-widget.tsx`         | Cross-venue transfer form           |
| `accounts-transfer-history` | `accounts/accounts-transfer-history-widget.tsx` | Transfer log                        |
| `saft-portfolio`            | `accounts/saft-portfolio-widget.tsx`            | SAFT (DeFi token) portfolio summary |

**Instructions tab** (`catalogGroup: "Instructions"`)

| Widget ID              | File                                                  | What it does                                |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------- |
| `instr-summary`        | `instructions/instructions-summary-widget.tsx`        | Strategy instruction KPI summary            |
| `instr-pipeline-table` | `instructions/instructions-pipeline-table-widget.tsx` | Instruction pipeline table with fill status |
| `instr-detail-panel`   | `instructions/instructions-detail-panel-widget.tsx`   | Detail panel for a selected instruction     |

**Strategies tab** (`catalogGroup: "Strategies"`)

| Widget ID                 | File                                            | What it does                            |
| ------------------------- | ----------------------------------------------- | --------------------------------------- |
| `strategies-kpi-strip`    | `strategies/strategies-kpi-widget.tsx`          | Strategy count/P&L KPI strip            |
| `strategies-catalogue`    | `strategies/strategies-catalogue-widget.tsx`    | Browseable strategy catalogue           |
| `strategies-grid-link`    | `strategies/strategies-grid-link-widget.tsx`    | Grid-style link cards to strategy pages |
| `cefi-strategy-config`    | `strategies/cefi-strategy-config-widget.tsx`    | CeFi strategy parameter editor          |
| `lending-arb-dashboard`   | `strategies/lending-arb-dashboard-widget.tsx`   | Lending arbitrage P&L and rate monitor  |
| `liquidation-monitor`     | `strategies/liquidation-monitor-widget.tsx`     | DeFi liquidation event monitor          |
| `active-lp-dashboard`     | `strategies/active-lp-dashboard-widget.tsx`     | Active LP position and fee dashboard    |
| `commodity-regime`        | `strategies/commodity-regime-widget.tsx`        | Commodity HMM regime state indicator    |
| `strategy-family-browser` | `strategies/strategy-family-browser-widget.tsx` | Browse strategies by family/archetype   |

**Book tab** (`catalogGroup: "Book"`)

| Widget ID            | File                                 | What it does                       |
| -------------------- | ------------------------------------ | ---------------------------------- |
| `book-trade-history` | `book/book-trade-history-widget.tsx` | Book-level trade history           |
| `book-hierarchy-bar` | `book/book-hierarchy-bar-widget.tsx` | Portfolio hierarchy navigation bar |
| `book-order-entry`   | `book/book-order-entry-widget.tsx`   | Order entry form (book context)    |

**DeFi tab** (`catalogGroup: "DeFi"`)

| Widget ID                  | File                                     | What it does                                |
| -------------------------- | ---------------------------------------- | ------------------------------------------- |
| `defi-wallet-summary`      | `defi/defi-wallet-summary-widget.tsx`    | Wallet balances across chains               |
| `defi-lending`             | `defi/defi-lending-widget.tsx`           | Lending protocol supply/borrow positions    |
| `defi-swap`                | `defi/defi-swap-widget.tsx`              | Token swap execution form                   |
| `defi-liquidity`           | `defi/defi-liquidity-widget.tsx`         | Liquidity pool position manager             |
| `defi-staking`             | `defi/defi-staking-widget.tsx`           | Staking position overview                   |
| `defi-flash-loans`         | `defi/defi-flash-loans-widget.tsx`       | Flash loan execution and monitoring         |
| `defi-transfer`            | `defi/defi-transfer-widget.tsx`          | On-chain transfer form                      |
| `defi-rates-overview`      | `defi/defi-rates-overview-widget.tsx`    | Cross-protocol rate overview                |
| `defi-trade-history`       | `defi/defi-trade-history-widget.tsx`     | On-chain trade history                      |
| `defi-strategy-config`     | `defi/defi-strategy-config-widget.tsx`   | DeFi strategy parameter configurator        |
| `defi-staking-rewards`     | `defi/defi-staking-rewards-widget.tsx`   | Staking rewards accrual tracker             |
| `defi-funding-matrix`      | `defi/defi-funding-matrix-widget.tsx`    | DeFi funding rate matrix                    |
| `defi-waterfall-weights`   | `defi/defi-waterfall-weights-widget.tsx` | Yield waterfall strategy weights            |
| `defi-health-factor`       | `defi/defi-health-factor-widget.tsx`     | Lending protocol health factor gauge        |
| `defi-reward-pnl`          | `defi/defi-reward-pnl-widget.tsx`        | Reward token P&L tracker                    |
| `defi-yield-chart`         | `defi/defi-yield-chart-widget.tsx`       | Yield performance time series               |
| `enhanced-basis-dashboard` | `defi/enhanced-basis-widget.tsx`         | Enhanced CeFi/DeFi basis strategy dashboard |

**Bundles tab** (`catalogGroup: "Bundles"`)

| Widget ID            | File                                    | What it does                              |
| -------------------- | --------------------------------------- | ----------------------------------------- |
| `bundle-builder`     | `bundles/bundle-builder-widget.tsx`     | Multi-step DeFi atomic bundle constructor |
| `defi-atomic-bundle` | `bundles/defi-atomic-bundle-widget.tsx` | Atomic bundle execution status            |

**Options tab** (`catalogGroup: "Options"`)

| Widget ID                   | File                                       | What it does                                    |
| --------------------------- | ------------------------------------------ | ----------------------------------------------- |
| `options-control-bar`       | `options/options-control-bar-widget.tsx`   | Underlying/expiry/strike selector bar           |
| `options-watchlist`         | `options/options-watchlist-widget.tsx`     | Options instrument watchlist                    |
| `options-chain`             | `options/options-chain-widget.tsx`         | Full options chain table (calls/puts by strike) |
| `futures-table`             | `options/options-futures-table-widget.tsx` | Futures contract table                          |
| `options-strategies`        | `options/options-strategies-widget.tsx`    | Named options strategies browser                |
| `options-greek-surface`     | `options/options-greek-surface-widget.tsx` | 3D/2D Greek surface (vol surface)               |
| `options-iv-smile`          | `options/dart-options-analytics.tsx`       | IV smile curve                                  |
| `options-iv-term-structure` | `options/dart-options-analytics.tsx`       | IV term structure chart                         |
| `options-max-pain`          | `options/dart-options-analytics.tsx`       | Max pain calculation chart                      |
| `options-put-call-ratio`    | `options/dart-options-analytics.tsx`       | Put/call ratio chart                            |

**Sports tab** (`catalogGroup: "Sports"`)

| Widget ID               | File                                      | What it does                                   |
| ----------------------- | ----------------------------------------- | ---------------------------------------------- |
| `sports-fixtures`       | `sports/sports-fixtures-widget.tsx`       | Upcoming sports fixtures list                  |
| `sports-fixture-detail` | `sports/sports-fixture-detail-widget.tsx` | Selected fixture detail with model predictions |
| `sports-arb`            | `sports/sports-arb-widget.tsx`            | Cross-bookmaker arb opportunity scanner        |
| `sports-my-bets`        | `sports/sports-my-bets-widget.tsx`        | Open/settled bets portfolio                    |
| `sports-live-scores`    | `sports/sports-live-scores-widget.tsx`    | Live match score feed                          |
| `sports-standings`      | `sports/sports-standings-widget.tsx`      | League/competition standings table             |
| `sports-clv`            | `sports/sports-clv-widget.tsx`            | Closing line value tracker                     |
| `sports-predictions`    | `sports/sports-predictions-widget.tsx`    | ML model prediction output grid                |
| `sports-ml-status`      | `sports/sports-ml-status-widget.tsx`      | Sports ML pipeline status                      |

**Predictions tab** (`catalogGroup: "Predictions"`)

| Widget ID                       | File                                            | What it does                                         |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| `pred-markets-grid`             | `predictions/pred-markets-grid-widget.tsx`      | Prediction market grid (Polymarket / Manifold style) |
| `pred-market-detail`            | `predictions/pred-market-detail-widget.tsx`     | Selected prediction market detail                    |
| `pred-portfolio-kpis`           | `predictions/pred-portfolio-kpis-widget.tsx`    | Prediction portfolio KPIs                            |
| `pred-open-positions`           | `predictions/pred-open-positions-widget.tsx`    | Open prediction market positions                     |
| `pred-settled-positions`        | `predictions/pred-settled-positions-widget.tsx` | Settled/resolved position history                    |
| `pred-odum-focus`               | `predictions/pred-odum-focus-widget.tsx`        | Odum-curated high-priority prediction markets        |
| `pred-arb-stream`               | `predictions/pred-arb-stream-widget.tsx`        | Live prediction market arbitrage stream              |
| `pred-arb-closed`               | `predictions/pred-arb-closed-widget.tsx`        | Closed arb opportunity history                       |
| `pred-trade-panel`              | `predictions/pred-trade-panel-widget.tsx`       | Trade execution panel for prediction markets         |
| `pred-top-markets`              | `predictions/pred-top-markets-widget.tsx`       | Highest-volume prediction markets                    |
| `pred-recent-fills`             | `predictions/pred-recent-fills-widget.tsx`      | Recent prediction market fills                       |
| `pred-market-probability-curve` | `predictions/polymarket-widgets.tsx`            | Probability over time chart for a market             |
| `pred-outcome-order-book`       | `predictions/polymarket-widgets.tsx`            | Outcome-level order book                             |
| `pred-outcome-volume-chart`     | `predictions/polymarket-widgets.tsx`            | Outcome volume chart                                 |
| `pred-trending-markets`         | `predictions/polymarket-widgets.tsx`            | Trending prediction markets                          |
| `pred-closing-soon`             | `predictions/polymarket-widgets.tsx`            | Markets closing soon                                 |
| `pred-topic-browser`            | `predictions/polymarket-widgets.tsx`            | Topic-based market browser                           |

**CeFi widgets** (`catalogGroup: "CeFi"`, available on `markets` tab)

| Widget ID                    | File                                    | What it does                             |
| ---------------------------- | --------------------------------------- | ---------------------------------------- |
| `cefi-funding-rate-matrix`   | `cefi/funding-rate-matrix-widget.tsx`   | Funding rate matrix across venues/assets |
| `cefi-open-interest-ranking` | `cefi/open-interest-ranking-widget.tsx` | Open interest ranking by asset           |
| `cefi-liquidation-heatmap`   | `cefi/liquidation-heatmap-widget.tsx`   | Liquidation level heatmap                |
| `cefi-long-short-ratio`      | `cefi/long-short-ratio-widget.tsx`      | Long/short ratio tracker                 |
| `cefi-basis-curve`           | `cefi/basis-curve-widget.tsx`           | CeFi futures basis curve                 |
| `cefi-market-cap-ranking`    | `cefi/market-cap-ranking-widget.tsx`    | Market cap ranking (CMC-style)           |
| `cefi-gainers-losers`        | `cefi/gainers-losers-widget.tsx`        | Top gainers and losers                   |
| `cefi-volume-dominance`      | `cefi/volume-dominance-widget.tsx`      | Volume dominance by venue                |
| `cefi-trending-tokens`       | `cefi/trending-tokens-widget.tsx`       | Trending tokens list                     |

**TradFi tab** (`catalogGroup: "TradFi"`)

| Widget ID               | File                        | What it does                       |
| ----------------------- | --------------------------- | ---------------------------------- |
| `tradfi-rates-curve`    | `tradfi/tradfi-widgets.tsx` | Yield curve (rates term structure) |
| `tradfi-vol-surface`    | `tradfi/tradfi-widgets.tsx` | TradFi implied vol surface         |
| `tradfi-etf-flows`      | `tradfi/tradfi-widgets.tsx` | ETF flow data                      |
| `tradfi-sector-heatmap` | `tradfi/tradfi-widgets.tsx` | Sector performance heatmap         |

**Screeners** (available across multiple tabs)

| Widget ID             | File                       | What it does                       |
| --------------------- | -------------------------- | ---------------------------------- |
| `sports-screener`     | `_screeners/screeners.tsx` | Sports event screener with filters |
| `prediction-screener` | `_screeners/screeners.tsx` | Prediction market screener         |
| `crypto-screener`     | `_screeners/screeners.tsx` | Crypto asset screener              |
| `defi-screener`       | `_screeners/screeners.tsx` | DeFi protocol screener             |
| `tradfi-screener`     | `_screeners/screeners.tsx` | TradFi instrument screener         |

**Widget infrastructure / primitives** (`components/widgets/_primitives/`)

| File                       | What it does                                |
| -------------------------- | ------------------------------------------- |
| `categorical-matrix.tsx`   | Reusable categorical matrix table primitive |
| `continuous-heatmap.tsx`   | Reusable continuous value heatmap           |
| `depth-area-chart.tsx`     | Order book depth area chart primitive       |
| `flow-chart.tsx`           | Flow chart (sankey-style) primitive         |
| `metric-gauge.tsx`         | Gauge / progress ring primitive             |
| `options-chain-preset.tsx` | Options chain layout preset                 |
| `ranking-list-preset.tsx`  | Ranked list layout preset                   |
| `scatter-plot.tsx`         | Scatter plot primitive                      |

**Total widget count:** approximately 140 registered widget IDs across all tabs.

### Major surfaces

The trading terminal is structured as a **single-page application with a tab-based widget workspace**:

1. **Shell** — `unified-shell.tsx` wraps all authenticated content. Contains: `LifecycleNav` (top-level section picker: Data/Research/Trading/Promote/Observe/Manage/Reports), `CommandPalette`, `RuntimeModeStrip`, `ChatWidgetConnected`, `GuidedTour`, `Breadcrumbs`, `DebugFooter`.

2. **Lifecycle nav** — horizontal top bar with lifecycle stages. Within Trading, replaced by `TradingVerticalNav` (collapsible left sidebar with icon+label nav, family group headers: DeFi, Sports, Options & Futures, Predictions).

3. **Trading layout** (`app/(platform)/services/trading/layout.tsx`) — wraps all `/services/trading/*` pages:
   - Left: `TradingVerticalNav` (collapsible)
   - Center: `WorkspaceToolbar` (profile selector, edit mode, workspace save/import/export) + `WidgetGrid` (react-grid-layout, 24 cols)
   - Right: optional "Quick View" collapsible panel showing positions summary, alerts, recent fills, system health, accounts, news headlines
   - Bottom toggle: `LiveAsOfToggle` (live vs. batch as-of datetime)

4. **Widget grid** — `WidgetGrid` renders `WidgetWrapper` for each placement, which renders a `WidgetChrome` (header with title, drag handle, resize, co-tab switcher, fullscreen toggle) around the widget component.

5. **Workspace toolbar** — above the grid. Shows: profile name, profile switcher (named presets + user-saved profiles), workspace switcher (named workspaces per tab), edit mode toggle, add-widget button, snapshot save/restore, workspace import/export.

6. **Context bar / global scope** — `TradingContextBar` at top of trading section with: Org/Client selectors, Strategy Family → Archetype picker (architecture-v2 taxonomy), strategy filter, Live/Batch toggle, As-Of datetime picker.

7. **Quick View sidebar** — collapsible right panel with compact cards: positions, alerts, recent fills, system health, accounts, news feed.

### Notable hooks / providers / data layer

| File                                    | Purpose                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `lib/providers.tsx`                     | Root providers: QueryClientProvider → AuthProvider → AppAccessProvider; handles mock-fetch-ready guard |
| `lib/stores/workspace-store.ts`         | Zustand workspace state — profiles, workspaces per tab, undo stack, custom panels, snapshots           |
| `lib/stores/global-scope-store.ts`      | Global scope filters: org/client/strategy/family/archetype/mode/as-of datetime                         |
| `lib/stores/auth-store.ts`              | Auth state (Zustand layer on Firebase auth)                                                            |
| `lib/stores/ui-prefs-store.ts`          | UI preferences (theme, nav collapsed state)                                                            |
| `lib/stores/defi-strategy-store.ts`     | DeFi strategy active selection store                                                                   |
| `lib/stores/promote-lifecycle-store.ts` | Promote workflow selected-strategy state                                                               |
| `lib/stores/workspace-sync.ts`          | Firestore sync for workspace profiles                                                                  |
| `lib/stores/filter-store.ts`            | Cross-page filter state                                                                                |
| `lib/api/mock-handler.ts`               | Client-side fetch interceptor for mock mode — handles all `/api/*` routes with fixture data            |
| `hooks/use-auth.tsx`                    | Firebase auth hook — user, entitlements, role checks                                                   |
| `hooks/use-app-access.tsx`              | App access and entitlement gate                                                                        |
| `hooks/use-websocket.ts`                | WebSocket hook for live streaming data                                                                 |
| `hooks/api/use-sse.ts`                  | Server-Sent Events hook for live feeds                                                                 |
| `hooks/api/use-sse-channels.ts`         | Multi-channel SSE subscriptions                                                                        |
| `hooks/api/use-market-data.ts`          | Market data fetching (tickers, candles, order book)                                                    |
| `hooks/api/use-positions.ts`            | Positions data with summary                                                                            |
| `hooks/api/use-orders.ts`               | Orders blotter data                                                                                    |
| `hooks/api/use-risk.ts`                 | Risk and exposure data                                                                                 |
| `hooks/api/use-trading.ts`              | Order submission, trade execution                                                                      |
| `hooks/api/use-strategies.ts`           | Strategy list and detail                                                                               |
| `hooks/api/use-sports.ts`               | Sports fixtures, predictions, bets                                                                     |
| `hooks/api/use-kill-switch.ts`          | Kill switch activation hook                                                                            |
| `hooks/api/use-emergency-close.ts`      | Emergency position close hook                                                                          |
| `lib/execution-mode-context.tsx`        | Execution mode context (manual/automated)                                                              |
| `lib/architecture-v2.ts`                | Strategy family + archetype taxonomy types (v2)                                                        |
| `lib/config/auth.ts`                    | Entitlement types, trading entitlements, strategy family entitlements                                  |
| `lib/config/api.ts`                     | Service endpoint URLs (proxied to unified-trading-api)                                                 |

### Mock vs. live data

**Mock mode** (`NEXT_PUBLIC_MOCK_API=true`):

- `lib/api/mock-handler.ts` intercepts all `/api/*` fetch calls client-side
- Fixture data in `lib/mocks/fixtures/` covers: trading-data, positions, orders, risk-data, alerts, strategies-seed, defi-\*, sports-data, predictions, options-futures-mock, ml-data, reports-pages, research-pages, execution-pages, data-pages, and more (40+ fixture files)
- Deterministic price simulation in `lib/mocks/generators/` (market-data, order-book, pnl, order-flow generators)
- `lib/api/mock-position-ledger.ts` — stateful in-memory position ledger that applies filled orders
- `lib/deterministic-mock.ts` — seeded PRNG for stable mock values across renders

**Live mode** (`NEXT_PUBLIC_MOCK_API` unset/false):

- `next.config.mjs` rewrites proxy trading domain routes to `unified-trading-api` (port 8030)
- Auth/user management routes go to Firebase Admin SDK (Next.js API routes under `app/api/v1/`)
- Reporting goes to `client-reporting-api` (port 8014)
- Deployment ops go to `deployment-api` (port 8004)
- WebSocket (`use-websocket.ts`) and SSE (`use-sse.ts`) hooks for live streaming

**Mixed state:** Some pages appear to have partial live integration; the `ignoreBuildErrors: true` in `tsconfig` suggests the auto-generated `lib/types/api-generated.ts` (from OpenAPI) currently has issues. The `.env.local` is empty (0 bytes), indicating the developer environment is not currently pointed at a live backend.

### Unfinished, deprecated, or stubbed items

- `archive/` folder contains removed components: `defi-basis-trade-widget.tsx`, `depth-chart-widget.tsx` (terminal), `instrument-bar-widget.tsx` (terminal), plus some ML components.
- `next.config.mjs`: `typescript: { ignoreBuildErrors: true }` with TODO to fix after regenerating `api-generated.ts`
- `all-widget-providers.tsx:5`: BP-5 TODO — all 17 providers are always-active; lazy activation deferred.
- Terminal page has comment: "Phase 11 reposition: terminal is analytics + reconciliation first. Manual execution is emergency-only." — indicating this surface is intentionally constrained.
- `components/widgets/options/register.ts`: Several options analytic widgets (`options-iv-smile`, `options-iv-term-structure`, `options-max-pain`, `options-put-call-ratio`) appear to be inside a `dart-options-analytics.tsx` file that groups them together; their separate implementation depth is unclear without reading that file.
- Screener widgets (`_screeners/screeners.tsx`) are all in a single file with multiple registered IDs — likely thin stubs sharing one layout.
- `trading-agent-service` (AI-driven execution agent) exists as a backend service but there is no dedicated "automation mode" UI surface in the current trading terminal beyond the `execution-mode-toggle.tsx` component in `components/trading/`.
- `.env.local` is empty — no local API URL configured; mock mode required for local dev without a running backend.
- `firebase-export-*` directories in the repo root suggest emulator state exports have accumulated.
- `root-structure-cleanup.md` and `issues.md` in the repo root suggest ongoing housekeeping.

---

## 2. UI Repo Overview — `deployment-ui`

### Purpose

A **standalone ops tool** (not a trading terminal). Operators use it to deploy and monitor batch/live services for the trading system. It communicates exclusively with `deployment-api` (port 8004) via REST and SSE. It has no shared codebase with `unified-trading-system-ui`.

### Tech stack

| Dimension  | Detail                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------- |
| Framework  | React 18 + Vite (not Next.js)                                                                      |
| Router     | React Router v6                                                                                    |
| Styling    | Tailwind CSS + Radix UI (inlined shadcn components in `src/components/ui/`)                        |
| Auth       | Cognito (AWS) + Google OAuth, both inlined (`src/auth/`) — previously external packages, now local |
| API client | Fetch-based client in `src/api/client.ts` (no SDK dependency)                                      |
| State      | Local React state + React Query implied (hooks pattern)                                            |
| Build      | Vite                                                                                               |
| Tests      | Vitest (unit), Playwright (E2E)                                                                    |
| Port       | 5183                                                                                               |

### Structure

```
src/
  api/         deploymentApi.ts, client.ts
  auth/        CognitoAuth.tsx, GoogleAuth.tsx, RequireAuth.tsx
  components/  20 domain components + ui/ primitives
  contexts/    CloudProviderContext.tsx
  hooks/       useConfig, useDebounce, useDeployEventStream, useEpics, useHealth, useServices
  lib/         utils, mock-api, chart-theme, data-status-helpers
  pages/       DeployTrigger, DeploymentHistory, DeploymentsList, VmDeployments, Chaos, ClientSubscriptions
  types/       deploymentTypes.ts, index.ts
```

### What each tab/page covers

| Surface        | File                                               | Purpose                                                                       |
| -------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Deploy         | `DeployForm.tsx` + `DeployTrigger.tsx`             | Submit new deployment (service, mode, image, branch, date range, asset scope) |
| Data Status    | `DataStatusTab.tsx` + `DataStatusDrilldown.tsx`    | GCS data file readiness check per date/scope                                  |
| Cloud Builds   | `CloudBuildsTab.tsx`                               | Cloud Build run history with logs link, commit SHA, duration                  |
| Readiness      | `ReadinessTab.tsx`                                 | Pre-deployment service health probe                                           |
| Service Status | `ServiceStatusTab.tsx` + `ServicesOverviewTab.tsx` | Live Cloud Run instance status                                                |
| Config         | `CloudConfigBrowser.tsx`                           | Active deployment config viewer                                               |
| History        | `DeploymentHistory.tsx`                            | Past deployments log                                                          |
| Epic Readiness | `EpicReadinessView.tsx`                            | Workspace-level deployment tracking (Overview tab)                            |
| VM Deployments | `VmDeployments.tsx` + `VmDeploymentDetails.tsx`    | VM-based deployment tracking                                                  |
| Client Subs    | `ClientSubscriptions.tsx`                          | Client subscription management                                                |
| Chaos          | `Chaos.tsx`                                        | Chaos engineering / fault injection controls                                  |
| Heatmap        | `HeatmapCalendar.tsx`                              | Calendar heatmap of deployment frequency                                      |

### Relationship to main UI

- Completely separate React application (Vite vs. Next.js).
- The main `unified-trading-system-ui` contains **mirrored copies** of many of these components in `components/ops/deployment/` — the same tab names (BuildSelector, CLIPreview, CloudBuildsTab, etc.). These mirror copies allow embedding deployment status directly into the platform UI without opening a separate tool.
- Auth previously shared via `@unified-admin/core`, `@unified-trading/ui-auth` packages, both now archived; functionality is inlined.

---

## 3. Backend Repos — One-liner inventory

| Repo name                           | One-line purpose                                                                                                              | Tier                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `unified-api-contracts`             | Pydantic schemas and VCR cassette directories for all external API venues (UAC layer)                                         | T0                    |
| `unified-trading-library`           | Core cloud-agnostic abstractions: storage, secrets, config, events                                                            | T1                    |
| `unified-trading-api`               | Consolidated FastAPI gateway serving all domain data to the UIs (absorbs 9 domain APIs)                                       | T3                    |
| `alerting-service`                  | Multi-channel alerting (Slack, email, PagerDuty) for system health and trading events                                         | T3                    |
| `batch-live-reconciliation-service` | T+1 nightly batch-live reconciliation orchestrator                                                                            | T3                    |
| `client-reporting-api`              | Client reporting, fee engine (high-water mark), and invoice generation service                                                | T3                    |
| `deployment-api`                    | FastAPI deployment orchestrator — Cloud Build triggers, SSE progress stream, service status                                   | T3                    |
| `deployment-service`                | Deployment engine — Terraform, configs, shard calculator, Cloud Build YAML                                                    | T3                    |
| `execution-service`                 | Multi-domain backtesting and live execution system (NautilusTrader-based)                                                     | T3                    |
| `features-calendar-service`         | Time and event-based features for trading strategies                                                                          | T3                    |
| `features-commodity-service`        | Commodity fundamental factor computation (EIA, CFTC, Baker Hughes, Open-Meteo) and HMM regime signal                          | T3                    |
| `features-cross-instrument-service` | Cross-instrument feature engineering — regime detection and correlation analysis                                              | T3                    |
| `features-delta-one-service`        | Technical analysis feature engineering for delta-one strategies                                                               | T3                    |
| `features-multi-timeframe-service`  | Cross-timeframe feature aggregation (symmetric counterpart to cross-instrument)                                               | T3                    |
| `features-onchain-service`          | On-chain feature engineering for DeFi trading strategies                                                                      | T3                    |
| `features-sports-service`           | Pre-match ML features for sports (team form, H2H, referee, venue, weather, market odds)                                       | T3                    |
| `features-volatility-service`       | Options and futures volatility features                                                                                       | T3                    |
| `ibkr-gateway-infra`                | Shared IB Gateway process providing all IBKR connectivity                                                                     | (no tier in manifest) |
| `instruments-service`               | Fetches and writes canonical instrument records from URDI to GCS                                                              | T3                    |
| `market-data-processing-service`    | Processes raw tick data into candles with aggregation and HFT features                                                        | T3                    |
| `market-tick-data-service`          | Market tick data ingestion and normalisation                                                                                  | T3                    |
| `ml-inference-service`              | Batch and live model inference — loads models, subscribes to features, publishes predictions                                  | T3                    |
| `ml-training-service`               | LightGBM model training on swing event prediction                                                                             | T3                    |
| `pnl-attribution-service`           | P&L attribution, trade history, performance analytics                                                                         | T3                    |
| `position-balance-monitor-service`  | Source of truth for position tracking, reconciliation, and account state                                                      | T3                    |
| `risk-and-exposure-service`         | Pre-trade risk checks, real-time risk monitoring, exposure aggregation                                                        | T3                    |
| `strategy-service`                  | Strategy backtesting orchestration service                                                                                    | T3                    |
| `trading-agent-service`             | AI-driven trading agent — 7-loop asyncio pipeline translating ML signals into live instructions; optional LLM commentary loop | T3                    |
| `system-integration-tests`          | Layer 3 integration tests — interacts with running services via HTTP, checks GCS/PubSub state                                 | (no tier)             |
| `unified-trading-pm`                | Project management SSOT — workspace-manifest.json, setup.sh template, cursor rules, plans                                     | (no tier)             |
| `e2e-testing`                       | End-to-end pipeline tests for DeFi and Sports domains (3-layer: instruments → market data → features)                         | (no tier)             |
| `new-sports-batting-services`       | Football betting ML system for feature engineering and data collection (appears separate/experimental)                        | (not in manifest)     |
| `deployment-ui`                     | Deployment control centre UI (React/Vite, separate from main UI)                                                              | T3                    |
| `unified-trading-system-ui`         | Main trading terminal UI (Next.js 16, widget workspace)                                                                       | T3                    |

---

## 4. Observations

### What is clearly present

- **Order entry form** exists at `components/widgets/terminal/order-entry-widget.tsx` and `components/trading/manual/single-order-form.tsx`. It is in the `terminal` tab and `book` tab. The terminal page itself labels manual order entry as "emergency-only" use.
- **Order blotter** — `orders-table-widget.tsx` on the orders tab.
- **Positions table** — `positions-table-widget.tsx` on the positions tab, with KPI strip above.
- **Live order book** — `order-book-widget.tsx` (terminal tab) and `markets-live-book-widget.tsx` (markets tab). Depth area chart primitive also exists.
- **Price chart** — `price-chart-widget.tsx` using lightweight-charts (candlestick). Recharts used for analytics.
- **Kill switch** — `alerts-kill-switch-widget.tsx` and `components/trading/kill-switch-panel.tsx`.
- **Risk dashboard** — one of the most complete sections: VaR chart, stress table, Greek surface, correlation heatmap, limits hierarchy, what-if slider, circuit breakers, live alert feed (14 registered risk widgets).
- **P&L attribution** — waterfall chart, time series, factor drilldown, plus `pnl-attribution-panel.tsx` in trading components.
- **Options chain** — full options chain widget, Greek surface, multi-leg combo builder, IV smile/term structure, max pain, put/call ratio.
- **DeFi suite** — most complete domain: 17+ DeFi widgets covering lending, staking, swap, LP, flash loans, bundle builder, yield charts, health factor gauge, reward P&L.
- **Sports betting** — fixtures, arb scanner, CLV tracker, live scores, standings, ML predictions, my bets, bet slip.
- **Prediction markets** — full Polymarket-style surface: markets grid, order book per outcome, probability curve, arb stream, portfolio KPIs.
- **Strategy lifecycle / promote pipeline** — multi-stage promote workflow with paper trading, model assessment, risk stress, governance, capital allocation, champion/challenger tabs.
- **Workspace save/restore/undo** — full workspace management with profiles, snapshots, import/export, undo stack.
- **Live/As-Of toggle** — batch vs. live mode selection with datetime picker.
- **Command palette** — `command-palette.tsx` (keyboard navigation across the platform).
- **Entitlement-gating** — per-widget entitlements with OR/AND semantics, family/archetype-level gating.
- **Analytics/TCA** — execution analytics adapter, TCA page, benchmarks page.
- **Reconciliation** — position recon widget, `markets-recon-widget.tsx`, reconciliation reports page, batch-live-reconciliation reports.

### What is clearly absent or stubbed

- **No dedicated "automated mode" trading surface** in the UI. `execution-mode-toggle.tsx` exists in `components/trading/` and `ExecutionModeProvider` wraps the root layout, but there is no separate multi-panel automated trading workspace equivalent to what the reference docs describe (18 surfaces). The terminal page comment explicitly says "Manual trading is for emergency use only."
- **No separate watchlist manager** as a standalone feature — the watchlist is embedded in the terminal widget only.
- **No charting tools / drawing tools** on the price chart widget. `lightweight-charts` supports drawings but there is no toolbar wired up for freehand chart annotation.
- **No depth-of-market (DOM/ladder) view** — the depth-chart-widget.tsx was archived (`archive/components/widgets/terminal/`). The depth area chart primitive exists but is not exposed as a registered widget.
- **No broker/venue connectivity status UI** in the trading terminal itself — venue connectivity lives in `components/ops/venue-connectivity.tsx` under the ops section.
- **Strategy config UI is limited** — `cefi-strategy-config-widget.tsx` exists; DeFi strategy config also exists. But no generic parameter editor for arbitrary strategy families is visible in the widget registry.
- **TradFi domain is thin** — only 4 TradFi widgets (rates curve, vol surface, ETF flows, sector heatmap), all inside one file `tradfi-widgets.tsx`. No TradFi order entry, no equity-specific views.
- **No account reconciliation panel at trade level** — reconciliation is at position level and as a reports page; there is no intra-day trade-level reconciliation widget.
- **No P&L explain / scenario P&L** widget for manual analysis (what-if exists for risk but not for P&L scenarios).
- **No chat/commentary integrated with positions** — `chat-widget.tsx` exists but appears to be a general-purpose chat, not a position-or-trade-linked commentary.
- **Instrument bar widget archived** — `archive/components/widgets/terminal/instrument-bar-widget.tsx` was removed. The terminal uses a watchlist instead.
- **`typescript: { ignoreBuildErrors: true }`** in `next.config.mjs` — means some type errors in the generated API types file are currently ignored in builds.
- **`fund-administration-service`** appears in the workspace manifest but the repo directory does not exist locally (not checked out).
- **`user-management-ui`** appears in the manifest as Tier 3 but its directory was not found in the workspace root — also not checked out locally.

### Surprising findings

- The **terminal page is explicitly labeled "analytics + reconciliation first, emergency manual execution only"** in its page comment. The primary trader workflow is intended to run through strategy schedulers, not the UI order entry. This is a significant architectural choice — the terminal is a monitoring/reconciliation surface, not a click-to-trade terminal.
- **All 17 widget domain providers are always-on** globally regardless of which tab is active. The TODO to make them lazy is BP-5 (acknowledged in code). This means DeFi WebSocket simulations run even when the user is on the Risk tab.
- The **widget co-tabs feature** exists — any widget cell can host multiple widget types as tabs, switchable within the cell. The `WorkspaceStore` manages `coTabs[]` and `activeTabId` per placement. This is a non-trivial feature not common in off-the-shelf trading terminals.
- **workspace-manifest.json lists `deployment-api` as "ARCHIVED"** (its README confirms this). The actual deployment API service is `deployment-service`/`deployment-api` but the manifest entry for `deployment-api` references archived content. This may be a naming collision in the manifest.
- The platform has a full **investor relations section** under `(platform)/investor-relations/` with board presentations, disaster recovery docs, plan presentations, and regulatory presentations — suggesting the UI doubles as a client/investor portal beyond the trading terminal.
- **Sports betting, DeFi, and prediction markets are first-class widget tabs** — on parity with risk, positions, and orders in terms of widget count and data infrastructure.
- The `new-sports-batting-services` repo is not registered in `workspace-manifest.json` — it appears to be an experimental/separate sports ML codebase outside the main workspace topology.
