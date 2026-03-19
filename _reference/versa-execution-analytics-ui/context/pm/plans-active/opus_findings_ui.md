# UI Information Architecture Audit & Redesign

**Plan:** ui-ia-audit-redesign-2026-03-16 **Type:** Architecture + Code **Status:** Draft **Depends on:**
ui-kit-ux-hardening-2026-03-16, ui-quality-gates-parity-2026-03-16

---

## Context

The 11 production UIs were built generically and in isolation — each UI grew its own backtest routes, its own
deployments tab, its own P&L view, its own alerts — without a coherent information architecture. The result is:

- A visitor cannot tell what does what without clicking through all 11 ports
- P&L lives in 3 different UIs (trading-analytics, strategy-ui, client-reporting) with no canonical home
- strategy-ui and execution-analytics-ui are ~90% identical (same backtest/config/instrument routes)
- batch-audit-ui and logs-dashboard-ui both hit the same API (port 8013) with overlapping data
- All 11 UIs include a `/deployments` tab that belongs exclusively to deployment-ui
- There is zero cross-UI navigation — users manually type port numbers

The fix is not cosmetic. The information architecture must be rebuilt around **how the system works**: configure →
deploy → trade live → analyse → report — with each UI owning exactly one domain and deep-linking to the next step in the
workflow.

Target: Citadel-grade — slick, integrated, zero duplication, obvious purpose, click-through from macro to micro.

---

## Phase 0: Current-State Manifest (Reference)

### UI Inventory

| UI                     | Port | API Port                   | Current Nav Items                                                                                                                                                                  |
| ---------------------- | ---- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onboarding-ui          | 5173 | config-api:8005            | Clients, Strategies, Strategy Manifest, Venues, Venue Connections, API Keys, Credentials, Risk Config, Audit Log, Deployments                                                      |
| execution-analytics-ui | 5174 | execution-results-api:8006 | Run Backtest, Load Results, Grid Results, Analysis, Deep Dive, Compare, Config Browser, Config Generator, Instruments, Availability, Tick Data, Deployments                        |
| strategy-ui            | 5175 | execution-results-api:8006 | **All Strategies, Live Trading**, Run Backtest, Load Results, Grid Results, Analysis, Deep Dive, Compare, Config Browser, Config Generator, Instruments, Availability, Deployments |
| settlement-ui          | 5176 | trading-analytics-api:8012 | Positions, Invoices, Reports, Settlements, Deployments                                                                                                                             |
| live-health-monitor-ui | 5177 | execution-results-api:8006 | Dashboard, Health, Alerts, Deployments, Dependencies                                                                                                                               |
| logs-dashboard-ui      | 5178 | batch-audit-api:8013       | Logs, Events, Alerts, CI/CD, Deployments                                                                                                                                           |
| ml-training-ui         | 5179 | ml-training-api:8011       | Experiments, Models, Deployments                                                                                                                                                   |
| trading-analytics-ui   | 5180 | trading-analytics-api:8012 | Trading Desk, P&L Attribution, Risk Matrix, Order Book, Latency, Reconciliation, Deployments                                                                                       |
| batch-audit-ui         | 5181 | batch-audit-api:8013       | Jobs, Audit Trail, Data Health, Compliance, Deployments                                                                                                                            |
| client-reporting-ui    | 5182 | client-reporting-api:8014  | Reports, Performance, Generate Report, Deployments                                                                                                                                 |
| deployment-ui          | 5183 | deployment-api:8004        | Deploy, Data Status, Cloud Builds, Service Status, Readiness, Config, History                                                                                                      |

---

## Phase 0: Duplication & Separation-of-Concerns Violations

### A. Near-Duplicate UIs

**strategy-ui vs execution-analytics-ui** (CRITICAL — collapse to one)

| Route                  | execution-analytics-ui | strategy-ui |
| ---------------------- | ---------------------- | ----------- |
| `/run-backtest`        | ✅                     | ✅          |
| `/load-results`        | ✅                     | ✅          |
| `/grid-results`        | ✅                     | ✅          |
| `/analysis`            | ✅                     | ✅          |
| `/deep-dive/:configId` | ✅                     | ✅          |
| `/compare`             | ✅                     | ✅          |
| `/configs`             | ✅                     | ✅          |
| `/generate`            | ✅                     | ✅          |
| `/instruments`         | ✅                     | ✅          |
| `/availability`        | ✅                     | ✅          |
| `/strategies`          | ❌                     | ✅ (unique) |
| `/live`                | ❌                     | ✅ (unique) |
| `/tick-data`           | ✅                     | ❌          |

**Verdict:** strategy-ui adds only `/strategies` and `/live` on top of a full copy of execution-analytics-ui. Merge:
keep one UI (rename to strategy-analytics-ui), promote `/strategies` as the default route.

**batch-audit-ui vs logs-dashboard-ui** (CRITICAL — same backend API:8013)

| What        | batch-audit-ui       | logs-dashboard-ui    |
| ----------- | -------------------- | -------------------- |
| Backend     | batch-audit-api:8013 | batch-audit-api:8013 |
| Jobs list   | ✅                   | ❌                   |
| Audit trail | ✅                   | ✅ (duplicate)       |
| Alerts      | ❌                   | ✅                   |
| CI/CD       | ❌                   | ✅                   |
| Data health | ✅                   | ❌                   |
| Compliance  | ✅                   | ❌                   |
| Logs stream | ❌                   | ✅                   |

**Verdict:** Two UIs, one API. Merge into operations-hub alongside deployment-ui.

**settlement-ui live positions vs live-health-monitor-ui positions**

settlement-ui's `/positions` page shows current positions. live-health-monitor-ui's `/dashboard` shows live positions +
risk. Two UIs showing the same underlying data.

**Verdict:** settlement-ui should only show _settled_ (historical EOD) positions and invoices. Live positions belong
exclusively to live-health-monitor-ui.

### B. Wrong-Home Routes (appear in too many UIs)

| Route          | Should live in         | Currently also appears in                      |
| -------------- | ---------------------- | ---------------------------------------------- |
| `/deployments` | deployment-ui          | ALL 11 other UIs                               |
| `/alerts`      | live-health-monitor-ui | logs-dashboard-ui                              |
| `P&L view`     | trading-analytics-ui   | strategy-ui, client-reporting-ui               |
| `risk matrix`  | trading-analytics-ui   | live-health-monitor-ui, onboarding-ui (config) |

### C. Missing Views (not in any UI)

| Missing capability                                                      | Natural home                       |
| ----------------------------------------------------------------------- | ---------------------------------- |
| Global P&L overview — all clients, grouped by client/strategy/venue     | trading-analytics-ui               |
| Strategy catalogue with filter by asset class (DeFi/CeFi/TradFi/Sports) | strategy-analytics-ui              |
| Client → Strategy → Position drilldown with cross-UI deep link          | live-health-monitor-ui             |
| Venue health / connectivity status (not just API keys)                  | onboarding-ui or live-health       |
| Backtest → Live promotion workflow (approve config, deploy strategy)    | strategy-analytics-ui → onboarding |
| Cross-UI global nav bar                                                 | ALL UIs                            |

---

## Phase 1: Proposed Information Architecture (7 UIs → 4 platforms + 3 specialist tools)

### Tier 1 — Operational Surfaces (daily-use, real-time)

#### 1. Trading Command Center (port 5177, was live-health-monitor-ui)

**Purpose:** Everything you need while markets are open.

Navigation:

- **Overview** — cross-client P&L ticker, net exposure, system health status
- **Positions** — live positions, filterable by `[All | Client | Strategy | Venue]`; each row deep-links to P&L
  waterfall in Market Intelligence
- **Risk** — real-time risk matrix (replaces duplicate in trading-analytics-ui)
- **Alerts** — unified alerts feed (absorbs logs-dashboard-ui alerts tab)
- **Manual Trades** — manual trade entry + kill switch per strategy/client
- **Health** — service readiness, dependency DAG
- **Deep Links OUT:** Position row → Market Intelligence P&L by that (client, strategy); Strategy name → Strategy
  Analytics detail page

#### 2. Operations Hub (port 5183, was deployment-ui + absorbs batch-audit + logs)

**Purpose:** Infra, deployments, logs, batch jobs, compliance. The SRE surface.

Navigation:

- **Deploy** — service deployment form (dry run + live) [existing]
- **Service Status** — health, readiness, cloud builds [existing]
- **Logs** — unified log stream (absorbs logs-dashboard-ui)
- **Batch Jobs** — job status, data health, completeness (absorbs batch-audit-ui)
- **Audit Trail** — full audit trail + compliance checks
- **History** — deployment history [existing]
- **Deep Links OUT:** Service name → Strategy Analytics for services running that strategy

### Tier 2 — Analytics Surfaces (research and deep-dive)

#### 3. Strategy Analytics (port 5175, merge strategy-ui + execution-analytics-ui)

**Purpose:** Strategy research, backtesting, config management. The quant research surface.

Navigation (grouped): **Strategies**

- **Catalogue** — all strategies, filter by `[All | DeFi | CeFi | TradFi | Sports]`, sortable by Sharpe/returns/status
- **Live Performance** — per-strategy live metrics, link to Trading Command Center for that strategy
- **Deep Dive** — per-strategy config deep dive with P&L attribution timeline

**Backtesting**

- **Run Backtest** — backtest runner
- **Results** — load & browse results
- **Grid Search** — parameter grid results
- **Compare** — algo comparison
- **Analysis** — aggregated analysis

**Configuration**

- **Config Browser** — browse existing configs
- **Config Generator** — generate new configs
- **Deep Links OUT:** Strategy detail → "Go Live" → Onboarding UI with pre-filled strategy config; Backtest result →
  "Deploy Config" → Operations Hub

**Data**

- **Instruments** — instrument definitions
- **Availability** — data availability calendar
- **Tick Data** — market tick data

#### 4. Market Intelligence (port 5180, was trading-analytics-ui)

**Purpose:** P&L attribution, microstructure, reconciliation. The analytics surface.

Navigation:

- **P&L** — waterfall P&L attribution, groupable by `[All | By Client | By Strategy | By Venue | By Asset Class]`;
  filterable by date range; P&L components: funding_pnl, basis_pnl, staking_yield_pnl, delta_pnl, transaction_costs,
  etc.
- **Trading Desk** — live order flow + fills
- **Order Book** — order book microstructure
- **Latency** — latency analytics (p50/p99 by segment)
- **Recon** — reconciliation runs, deviations drill
- **Deep Links OUT:** Client P&L row → Client Reporting for that client; Strategy P&L row → Strategy Analytics for that
  strategy

### Tier 3 — Configuration Surface

#### 5. Onboarding & Config (port 5173, was onboarding-ui, keep as-is but improve)

**Purpose:** Config publishing. New clients, new strategies, new venue connections.

Navigation (kept, improved):

- **Clients** — client creation + fee structure
- **Strategies** — strategy config publishing to GCS (hot-reload); button "Run Backtest" → Strategy Analytics; button
  "Go Live" → deploy via Operations Hub
- **Venues** — venue setup + credential management
- **Venue Connections** — live connectivity status (elevate from API Keys/Credentials detail)
- **Risk Config** — risk limits per client/strategy
- **Audit** — config change audit log
- **Deep Links OUT:** Client → Trading Command Center (filtered to that client); Strategy → Strategy Analytics

### Tier 4 — Specialist Tools

#### 6. ML Platform (port 5179, was ml-training-ui, keep as-is)

**Purpose:** Model training and registry.

Navigation: Experiments, Models, (remove Deployments tab — link to Operations Hub instead) **Deep Links OUT:** Model
version → Operations Hub deployment

#### 7. Client Reporting & Settlement (port 5182, merge client-reporting-ui + settlement-ui)

**Purpose:** Client-facing views — performance reports, invoices, settlement.

Navigation:

- **Portfolio** — client portfolio overview, links to Market Intelligence P&L
- **Performance** — historical performance reports
- **Generate Report** — PDF/CSV generation
- **Positions** — historical/EOD positions (NOT live; live positions → Trading Command Center)
- **Invoices** — invoice management
- **Settlements** — settlement records
- **Deep Links OUT:** Client portfolio → Market Intelligence P&L (that client); Position → Trading Command Center

---

## Phase 2: Cross-UI Navigation Design

### Global Nav Bar (ui-kit component: `<GlobalNavBar />`)

Every UI gets a persistent top-right nav bar with 7 icons + labels, linking to all tools by port:

```typescript
GLOBAL_NAV = [
  { label: "Trading", icon: Activity, port: 5177, color: "green" },
  { label: "Strategies", icon: TrendingUp, port: 5175, color: "blue" },
  { label: "Markets", icon: BarChart3, port: 5180, color: "purple" },
  { label: "Config", icon: Settings, port: 5173, color: "gray" },
  { label: "ML", icon: Brain, port: 5179, color: "orange" },
  { label: "Reporting", icon: FileText, port: 5182, color: "teal" },
  { label: "Ops", icon: Terminal, port: 5183, color: "slate" },
];
```

Port resolution uses `ui-api-mapping.json` as SSOT. In production, ports become subdomain paths (`/trading`,
`/strategies`, etc.).

### Deep Link Protocol

All cross-UI links carry query params for pre-filtering the destination:

```
# From Trading Command Center → Market Intelligence P&L for a specific client+strategy
http://localhost:5180/pnl?client_id=apex_capital&strategy_id=DEFI_ETH_STAKED_BASIS_SCE_1H&from=trading

# From Strategy Analytics backtest result → Onboarding with pre-filled config
http://localhost:5173/strategies/new?template=DEFI_ETH_BASIS_SCE_1H&config_id=bt-abc123&from=strategy-analytics

# From Onboarding client row → Trading Command Center filtered to that client
http://localhost:5177/positions?client_id=apex_capital&from=onboarding
```

Each receiving UI reads `?client_id=`, `?strategy_id=`, `?from=` from URL params and pre-sets filters on mount.

### Remove `/deployments` Tab From All Consumer UIs

Replace the `/deployments` tab in all 9 non-deployment UIs with:

```typescript
// In GlobalNavBar or sidebar footer:
<a href={`http://localhost:5183?service=${encodeURIComponent(serviceName)}`}>
  View in Ops Hub →
</a>
```

---

## Phase 3: P&L Hierarchy Design

P&L must be browseable across 5 dimensions from one view in Market Intelligence:

```
Dimension 1: ALL (total system P&L)
  └── Dimension 2: By Client
        └── Dimension 3: By Strategy (within client)
              └── Dimension 4: By Venue (within strategy × client)
                    └── Dimension 5: By P&L Component
                          (funding_pnl, basis_pnl, staking_yield_pnl,
                           delta_pnl, gamma_pnl, theta_pnl, vega_pnl,
                           carry_pnl, transaction_costs, interest_pnl, rewards_pnl)
```

UI controls:

- **Group By** dropdown: `[All | Client | Strategy | Asset Class | Venue]`
- **Date Range** picker
- **P&L Type** toggle: `[Total | Realized | Unrealized | Funding | Attribution Components]`
- **Waterfall Chart** per selected grouping
- Click any row → drills one level deeper, breadcrumb at top
- Click deepest level → deep-links to Trading Command Center for that position

---

## Phase 4: Implementation Tasks

### P0 — Eliminate Deployments Tab Pollution (all consumer UIs)

- [ ] [AGENT] P0. Add `<GlobalNavBar />` component to `unified-trading-ui-kit` with port-based navigation. Ports sourced
      from `ui-api-mapping.json`.
- [ ] [AGENT] P0. Remove `/deployments` route + nav item from: onboarding-ui, execution-analytics-ui, strategy-ui,
      settlement-ui, live-health-monitor-ui, logs-dashboard-ui, ml-training-ui, trading-analytics-ui, batch-audit-ui,
      client-reporting-ui (10 UIs). Replace with GlobalNavBar Ops link.
- [ ] [AGENT] P0. Mount `<GlobalNavBar />` in `AppShell` in `unified-trading-ui-kit` so all consumers get it
      automatically.

### P1 — Merge strategy-ui into execution-analytics-ui → Strategy Analytics

- [ ] [AGENT] P1. Rename execution-analytics-ui nav + page title to "Strategy Analytics". Add `/strategies` (catalogue)
      and `/live` routes from strategy-ui.
- [ ] [AGENT] P1. Strategy catalogue page: card grid filterable by asset class `[All | DeFi | CeFi | TradFi | Sports]`,
      each card showing strategy ID, Sharpe, status (live/paper/backtesting), last 30d P&L.
- [ ] [AGENT] P1. Each strategy card: "View Backtest →" (stays in strategy-analytics), "View Live →" (deep-links to
      Trading Command Center with `?strategy_id=`), "Edit Config →" (deep-links to Onboarding).
- [ ] [AGENT] P1. Update `ui-api-mapping.json`: remove strategy-ui entry (port 5175 now = strategy-analytics-ui).
- [ ] [SCRIPT] P1. Update `dev-start.sh` and `launch-all-uis.sh` to not start strategy-ui as a separate process.

### P2 — Merge batch-audit-ui + logs-dashboard-ui into Operations Hub (deployment-ui)

- [ ] [AGENT] P2. Add "Logs" tab to deployment-ui: pull log stream from batch-audit-api `/api/v1/audit/trail`. Filter by
      service, level, time range.
- [ ] [AGENT] P2. Add "Batch Jobs" tab to deployment-ui: pull job list + data health from batch-audit-api.
- [ ] [AGENT] P2. Add "Compliance" tab to deployment-ui: compliance checks from batch-audit-api.
- [ ] [AGENT] P2. Remove "Alerts" tab from logs-dashboard-ui — alerts belong in Trading Command Center.
- [ ] [SCRIPT] P2. Update `ui-api-mapping.json`: remove batch-audit-ui and logs-dashboard-ui entries.
- [ ] [SCRIPT] P2. Update `dev-start.sh`: do not start batch-audit-ui (5181) and logs-dashboard-ui (5178) as separate
      processes.

### P3 — Merge settlement-ui into client-reporting-ui → Client Reporting & Settlement

- [ ] [AGENT] P3. Add Invoices, Settlements tabs to client-reporting-ui (from settlement-ui).
- [ ] [AGENT] P3. Positions tab in client-reporting-ui: make clear this is historical/EOD — not live. Add "View Live
      Positions →" deep-link to Trading Command Center.
- [ ] [SCRIPT] P3. Update `ui-api-mapping.json` and `dev-start.sh`: remove settlement-ui (5176).

### P4 — Deep Link Protocol (cross-UI `?from=` params)

- [ ] [AGENT] P4. Add `useDeepLinkParams()` hook to `@unified-trading/ui-kit`: reads `client_id`, `strategy_id`,
      `venue`, `from` from URL params on mount, stores in context, auto-applies as default filters.
- [ ] [AGENT] P4. Trading Command Center: positions table rows have "→ P&L" link → Market Intelligence
      `?client_id=&strategy_id=`.
- [ ] [AGENT] P4. Market Intelligence P&L: rows have "→ Report" link → Client Reporting `?client_id=`.
- [ ] [AGENT] P4. Strategy Analytics strategy card: "→ Trading" link → Trading Command Center `?strategy_id=`, "→
      Config" link → Onboarding `?strategy_id=`.
- [ ] [AGENT] P4. Onboarding client row: "→ Trading" link → Trading Command Center `?client_id=`.
- [ ] [AGENT] P4. Onboarding strategy row: "→ Backtest" link → Strategy Analytics `?strategy_id=`, "→ Live" link →
      Trading Command Center `?strategy_id=`.

### P5 — P&L Hierarchy in Market Intelligence

- [ ] [AGENT] P5. P&L page: add "Group By" control with options `[All | Client | Strategy | Asset Class | Venue]`.
- [ ] [AGENT] P5. P&L page: waterfall chart (recharts) re-renders on group change. Uses `chart-theme.ts` tokens.
- [ ] [AGENT] P5. P&L page: drill-down on row click — breadcrumb + filtered sub-view.
- [ ] [AGENT] P5. P&L page: attribution breakdown panel showing the 11 P&L components for selected item.

### P6 — Trading Command Center Enhancements

- [ ] [AGENT] P6. Overview page: top-line ticker (total AUM, total unrealised P&L, net delta, system health badge).
- [ ] [AGENT] P6. Positions page: filterable by `[All Clients | Client | Strategy | Venue | Asset Class]`. Each row has
      "→ P&L", "→ Strategy" deep links.
- [ ] [AGENT] P6. Alerts feed (absorb from logs-dashboard-ui): unified stream, severity badges, dismissible.

### P7 — Quality Gates, Manifests, and Final Cleanup

- [ ] [SCRIPT] P7. Run `quality-gates.sh` on all affected repos: execution-analytics-ui, deployment-ui,
      client-reporting-ui, live-health-monitor-ui, trading-analytics-ui, onboarding-ui, unified-trading-ui-kit.
- [ ] [SCRIPT] P7. Update `workspace-manifest.json`: remove strategy-ui, batch-audit-ui, logs-dashboard-ui,
      settlement-ui entries (4 repos deprecated). Archive their plans.
- [ ] [SCRIPT] P7. Run `dev-start.sh --all --mode mock --frontend-only --open` and manually verify all 7 UIs launch,
      global nav works, and representative deep links function.

---

## Critical Files

| File                                                     | Change                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------ |
| `unified-trading-pm/scripts/dev/ui-api-mapping.json`     | Remove 4 deprecated UI entries; rename strategy-ui→strategy-analytics-ui |
| `unified-trading-pm/scripts/dev/dev-start.sh`            | Remove deprecated UI startup commands                                    |
| `unified-trading-ui-kit/src/components/GlobalNavBar.tsx` | NEW — cross-UI nav bar                                                   |
| `unified-trading-ui-kit/src/components/AppShell.tsx`     | Mount GlobalNavBar                                                       |
| `unified-trading-ui-kit/src/hooks/useDeepLinkParams.ts`  | NEW — URL param deep link hook                                           |
| `execution-analytics-ui/src/App.tsx`                     | Add /strategies, /live routes; rename to Strategy Analytics              |
| `deployment-ui/src/App.tsx`                              | Add Logs, Batch Jobs, Compliance tabs                                    |
| `client-reporting-ui/src/App.tsx`                        | Add Invoices, Settlements routes                                         |
| `live-health-monitor-ui/src/App.tsx`                     | Overview page with ticker; positions filter; absorb alerts               |
| `trading-analytics-ui/src/pages/PnL.tsx`                 | Group By control + drill-down                                            |
| `onboarding-ui/src/App.tsx`                              | Remove /deployments; add deep-link buttons                               |
| All 10 non-deployment UIs                                | Remove /deployments route + nav item                                     |

---

## Repos to Deprecate (after P1–P3 complete)

| Repo                | Replacement                        | Migration           |
| ------------------- | ---------------------------------- | ------------------- |
| `strategy-ui`       | `execution-analytics-ui` (renamed) | Routes merged in P1 |
| `batch-audit-ui`    | `deployment-ui`                    | Tabs added in P2    |
| `logs-dashboard-ui` | `deployment-ui`                    | Tabs added in P2    |
| `settlement-ui`     | `client-reporting-ui`              | Routes added in P3  |

---

## Verification

1. **`bash unified-trading-pm/scripts/dev/dev-start.sh --all --mode mock --frontend-only --open`**
   - 7 UIs start (not 11) — ports: 5173, 5174, 5175→renamed, 5177, 5179, 5180, 5182, 5183
   - No 5176, 5178, 5181

2. **Global nav check**: Open any UI → nav bar shows all 7 icons → click each → correct UI opens

3. **Deep link check**: Trading Command Center `/positions?client_id=apex_capital` → positions pre-filtered to Apex
   Capital

4. **P&L drill-down**: Market Intelligence `/pnl` → Group By "Client" → click row → Group By "Strategy" within that
   client → attribution breakdown visible

5. **No orphan `/deployments` tabs**: Grep all UI repos for `path: "/deployments"` — zero results outside deployment-ui

6. **Quality gates**: All 7 active UI repos pass `bash scripts/quality-gates.sh`

7. **Strategy catalogue**: Strategy Analytics `/strategies` → cards for DeFi (Basis, Staked Basis, AAVE, Recursive),
   CeFi (placeholder), TradFi (ML Directional), Sports (Arbitrage, Value Betting) — filterable by asset class

---

## Strategy Domain Reference (for mock data and catalogue design)

| Strategy ID                  | Asset Class | Venues                            | P&L Components                                                      | Status  |
| ---------------------------- | ----------- | --------------------------------- | ------------------------------------------------------------------- | ------- |
| DEFI_ETH_BASIS_SCE_1H        | DeFi        | Wallet + Hyperliquid              | funding_pnl, basis_pnl, trading_pnl, txn_costs                      | Live    |
| DEFI_ETH_STAKED_BASIS_SCE_1H | DeFi        | EtherFi wallet + Hyperliquid      | staking_yield_pnl, funding_pnl, rewards_pnl, trading_pnl, txn_costs | Live    |
| DEFI_ETH_AAVE_LENDING        | DeFi        | Aave V3                           | interest_income, gas_costs, slippage                                | Live    |
| DEFI_ETH_RECURSIVE_BASIS     | DeFi        | EtherFi + Hyperliquid (multi-leg) | staking_yield_pnl, funding_pnl, compounding_pnl                     | Live    |
| CEFI_MOMENTUM                | CeFi        | Binance / OKX / Hyperliquid       | delta_pnl, funding_pnl, txn_costs                                   | Planned |
| CEFI_MEAN_REVERSION          | CeFi        | Binance / OKX                     | delta_pnl, txn_costs                                                | Planned |
| TRADFI_SPY_ML_DIRECTIONAL_V1 | TradFi      | IBKR / CME / NYMEX                | delta_pnl, carry_pnl, txn_costs                                     | Live    |
| TRADFI_OPTIONS_ML            | TradFi      | IBKR / CBOE                       | delta_pnl, gamma_pnl, theta_pnl, vega_pnl, txn_costs                | Live    |
| SPORTS_ARBITRAGE             | Sports      | Betfair / Smarkets / MatchBook    | arb_pnl, txn_costs                                                  | Live    |
| SPORTS_VALUE_BETTING         | Sports      | Betfair / Kalshi / Polymarket     | ev_pnl, txn_costs                                                   | Live    |
| SPORTS_ML                    | Sports      | Polymarket / Kalshi               | ml_pnl, txn_costs                                                   | Live    |
