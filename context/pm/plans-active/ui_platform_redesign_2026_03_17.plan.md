# Unified Trading Platform — UI/UX Redesign Vision

**Plan:** ui-platform-redesign-2026-03-17 **Type:** Architecture + Design + Code **Status:** Draft (Design Phase)
**Supersedes:** opus_findings_ui, ui_consolidation_ux_hardening, ui_navigation_ux_model **Depends on:**
unified-trading-ui-kit (shared component library)

---

## The Problem

11 UIs built in isolation. Each grew its own deployments tab, its own P&L view, its own alerts page. The result is a
system where:

- A user cannot answer "what is happening right now?" without visiting 4+ ports
- P&L lives in 3 different UIs with no canonical home
- strategy-ui and execution-analytics-ui are 90% identical
- batch-audit-ui and logs-dashboard-ui hit the same API
- There is zero cross-UI navigation — users type port numbers manually
- No workflow coherence: the lifecycle from Design → Simulate → Promote → Run → Monitor → Explain → Reconcile is
  invisible
- No entity hierarchy: Fund → Client → Strategy → Config → Run → Position is never navigable

This is not a cosmetic problem. It's an information architecture failure.

---

## Design Philosophy

### What Citadel Gets Right

At Citadel and Renaissance, the internal platforms share one trait: **complexity is organized, never hidden**. Every
trader can see everything — positions, risk, P&L attribution, execution quality, feature freshness — but the system
surfaces the right thing at the right time through hierarchy and workflow, not by scattering it across disconnected
tools.

### Three Design Principles

**1. Entity-First Navigation** Every screen has one primary entity. Users navigate a hierarchy — Fund → Client →
Strategy → Config Version → Run — and at each level, switch lenses (positions, orders, fills, P&L, recon, timeline). The
entity is the anchor; the lens is the view.

**2. Lifecycle-Aware Flow** The platform embeds the operating lifecycle — Design → Simulate → Promote → Run → Monitor →
Explain → Reconcile — not as decoration but as wayfinding. A user always knows where they are in the lifecycle, and the
UI naturally guides them to the next step.

**3. One Screen, One Verb, One Time Horizon** Each view has a dominant verb (define, compare, promote, observe,
intervene, explain, resolve) and a time horizon (design-time, historical batch, live now, post-trade). Mixing these
creates confusion. Separating them creates clarity.

**4. Risk Attribution Mirrors P&L Attribution** If P&L breaks down into delta, funding, basis, interest, greeks, MTM —
then exposure/risk should show the CURRENT RISK in those same dimensions. They are two sides of the same coin: what
happened (P&L) and what could happen (exposure). The command center shows both side-by-side.

**5. Temporal Universality — Snapshot + Time Series Everywhere**

Every view that shows state must support two temporal modes:

**Point-in-time snapshot ("time machine"):** A global `AsOfDatetime` picker lets the user set any historical datetime.
When set, the entire surface reconstructs the state of the world at that moment — positions, P&L, risk/exposure, alerts,
strategy status, feature freshness, venue connections. When set to "Live", it shows real-time data. This is not a
separate "historical" mode — it is the SAME view, the SAME layout, the SAME drill-down, just at a different point in
time. The user should be able to scrub backward and forward and see the world change.

**Time series ("trajectory"):** For P&L, positions, and risk/exposure, the cross-sectional snapshot is necessary but
insufficient. Users also need to see evolution over time: equity curves, position size changes, risk/exposure drift,
margin utilization trends. Time series charts are embedded INLINE alongside the snapshot data — not on separate pages.
Every KPI card that shows a number should also show a sparkline of that number over time. Every drill-down that shows a
table should have a "show over time" toggle that replaces the table with a time series chart of the selected metric.

**What this means concretely:**

| Data Domain           | Snapshot (as-of T)                          | Time Series (over period)                                   |
| --------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| **Positions**         | Exact positions held at datetime T          | Position size evolution, entry/exit markers                 |
| **P&L**               | Cumulative P&L as of T, attribution at T    | Equity curve, daily P&L bars, component evolution           |
| **Risk / Exposure**   | Delta, funding, basis, greeks exposure at T | Exposure drift over time, margin utilization trend          |
| **Alerts**            | Which alerts were active at T               | Alert frequency, resolution time trends                     |
| **Strategy Status**   | Which strategies were live/paused at T      | Strategy lifecycle timeline (when promoted, paused, killed) |
| **Feature Freshness** | Freshness SLA at T                          | Freshness degradation over time, SLA breach history         |
| **Orders / Fills**    | Orders in flight at T                       | Order flow over time, fill rate evolution                   |

**UI component:** `<AsOfDatetimePicker />` in the GlobalNavBar or breadcrumb area. Defaults to "Live". Supports:

- "Live" (real-time, streaming updates)
- Date picker (reconstructs EOD snapshot)
- Datetime picker (reconstructs intraday snapshot)
- Relative shortcuts: "1h ago", "start of day", "yesterday close", "last week"

**URL state:** `?as_of=2026-03-14T14:32:00Z` — shareable, bookmarkable. Omitted = live.

**Time series component:** `<TimeSeriesToggle />` that can be embedded in any card or table. When toggled, the
cross-sectional data transforms into a chart. Period selector: 1d, 1w, 1m, 3m, 1y, max. The same GroupBy controls
(client, strategy, venue) apply to the time series view.

**6. Risk Limits as First-Class Citizens — Value vs Limit, Not Just Value**

Every risk metric must be shown as a value _against its limit_ — with utilization percentage, headroom, and threshold
status. A metric without its limit is meaningless. Limits cascade through the entity hierarchy:

```
Firm limits (global caps)
  └── Client limits (per mandate — different risk appetites per SMA)
        └── Strategy limits (per risk profile — yield has LTV, directional has delta)
              └── Venue limits (venue-imposed margin rules)
                    └── Instrument limits (concentration caps)
```

Each level has its own limit types:

| Limit Type         | Where it matters               | Example                              |
| ------------------ | ------------------------------ | ------------------------------------ |
| LTV                | DeFi lending (Recursive Basis) | LTV < 0.75, health factor > 1.5      |
| Margin utilization | CeFi venues                    | < 80% per venue, < 70% firm-wide     |
| Delta exposure     | All directional                | < $5m net per strategy, < $15m firm  |
| Concentration      | All                            | < 25% of portfolio in one instrument |
| Drawdown           | All                            | < 10% from peak per strategy         |
| Leverage           | All                            | < 3x gross per client                |
| Funding rate risk  | Basis strategies               | < $10m notional exposed to funding   |

**UI treatment:** Progress bars with threshold markers. Green < 70%, amber 70-90%, red > 90%.

```
Delta Exposure    ████████████░░░░░░░░  $2.4m / $5.0m  (48%)  ● healthy
Margin (Binance)  █████████████████░░░  78% / 80%       (97%)  ▲ WARNING
LTV (Aave)        ████████████████░░░░  0.72 / 0.75     (96%)  ▲ WARNING
```

**Drill-down:** Same pattern as P&L — click aggregate → per-client → per-strategy → per-venue → per-instrument. Same
breadcrumb, same GroupBy, same FilterBar. Highest utilization floats to top (the "early insight" surface).

**Where it lives:** Trading Command Center `/risk` — four tabs become:

1. **Risk Summary** — all limits at a glance, highest utilization first
2. **Exposure Attribution** — same 6D as P&L, forward-looking
3. **Margin & LTV** — per-venue margin + per-position DeFi health
4. **Limits Detail** — full hierarchy drill-down with thresholds, utilization %, time series

**Time series:** Every limit's utilization should be viewable over time. "When did margin hit 78%? Was it drifting up
all day or did it spike?" This combines with Principle 5 (temporal universality).

**7. Grafana for Infrastructure, Not Business Analytics**

The platform serves two audiences with different analytical needs:

| Audience        | Tool                  | What they see                                                                    |
| --------------- | --------------------- | -------------------------------------------------------------------------------- |
| Trader / PM     | In-platform (our UIs) | P&L, positions, risk, limits, strategy performance. Institutional, entity-aware. |
| Quant dev / SRE | Grafana               | Service latency p99, feature freshness, order ack latency, memory, queue depths. |

The trader should never need Grafana. The quant dev should have it for debugging.

**Bridge:** Operations Hub has a "Deep Dive in Grafana" link on each service detail page, pre-filtered to that service
via URL params. Context carries over. No duplication — linking to the right tool for the right audience.

**Business-side "I want new views":** Solved by DimensionalGrid + FilterBar + TimeSeriesToggle composability, not
Grafana. Any new analysis = pick dimensions, pick metrics, pick time range, slice. No new code needed.

**8. Canonical Ownership — No Overlap, No Drift**

Every surface owns exactly one time horizon and one dominant verb. If a concept appears in two surfaces, the tie-breaker
is: **which verb and time horizon does the user have when they need this?**

| Surface                    | Owns                   | Time Horizon              | Dominant Verbs                     | Canonical Data                                                                                                |
| -------------------------- | ---------------------- | ------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Trading Command Center** | Operational state      | Live (default) or as-of-T | OBSERVE, INTERVENE                 | Positions, risk/exposure, margin health, LTV, feature freshness, alerts, kill switches — at any point in time |
| **Strategy Analytics**     | Design & simulation    | Historical / design-time  | DESIGN, SIMULATE, COMPARE, PROMOTE | Strategy catalogue, backtest results, config grids, tick data, instruments, promotion flow                    |
| **Market Intelligence**    | Post-trade explanation | T+0 to T+n retrospective  | EXPLAIN, RECONCILE                 | P&L attribution (6D) with time series, recon, latency analysis, order book, trade desk, reports               |
| **Operations Hub**         | Infrastructure         | Deployment/ops time       | DEPLOY, DIAGNOSE                   | Services, deployments, batch jobs, logs, events, compliance, CI/CD, data health                               |
| **Config & Onboarding**    | Controlled CRUD        | Pre-trade / setup         | DEFINE, CONFIGURE, PUBLISH         | Clients, strategies, venues, API keys, credentials, risk config, venue connections                            |
| **ML Platform**            | Model lifecycle        | Training/experiment time  | TRAIN, EVALUATE, DEPLOY            | Experiments, models, hyperparameter grids                                                                     |
| **Reporting & Settlement** | Client/EOD artifacts   | EOD / periodic            | REPORT, SETTLE                     | EOD positions, invoices, settlements, performance reports, client portfolio                                   |

**Overlap resolution rules:**

- **Positions**: Trading Command Center owns _operational_ positions (live or as-of-T via the time machine). Reporting &
  Settlement owns _settled/confirmed_ positions (formal EOD snapshots for client reporting). Trading shows "what was the
  state"; Reporting shows "what was signed off." No overlap.
- **Risk/exposure**: Trading Command Center owns _current_ risk and exposure. Market Intelligence may _explain_ past
  risk events in the context of P&L attribution, but does not render a live risk matrix. No overlap.
- **Reports**: Market Intelligence owns report _generation_ (analyst creates a report as part of post-trade
  explanation). Reporting & Settlement owns the report _catalogue_ and client-facing views (client downloads their
  report). The generation form lives in Market Intelligence; the artifact lands in Reporting.
- **P&L**: Trading Command Center shows a _summary panel_ (top-line P&L + attribution preview). Market Intelligence owns
  the _full drill-down_ (5-level waterfall, Group By, component decomposition). The summary links to the full view via
  cross-link.
- **Alerts**: Trading Command Center owns _live alert feed and incident management_. Operations Hub shows alerts only in
  the context of _service health and batch job failures_ — operational alerts, not trading alerts.

**The rule: if it's about what's happening NOW, it's Trading. If it's about what HAPPENED, it's Markets. If it's about
what COULD happen based on historical analysis, it's Strategy Analytics. If it's about infrastructure, it's Ops. If it's
about config CRUD, it's Config. If it's about a client artifact, it's Reporting.**

---

## Visual Design Language

### Keep the Dark Theme — It's Already Institutional

The existing design system is strong. Dark backgrounds (`#0a0a0b`), IBM Plex Sans, JetBrains Mono, cyan accent
(`#22d3ee`). This is Bloomberg/Citadel-grade. The ChatGPT mockup's white theme would be a downgrade for a trading
terminal. What needs to change is not the palette — it's the structure.

### Refinements to the Existing Design System

```
KEEP (already excellent):
  - Dark palette: #0a0a0b → #111113 → #18181b → #1c1c1f
  - Cyan accent #22d3ee with dim overlay for active states
  - IBM Plex Sans (UI) + JetBrains Mono (data/values)
  - Status color vocabulary: green/amber/red/purple/blue
  - SidebarNav with left-border-accent active state
  - Badge system (success/error/warning/running/pending)

EVOLVE (polish without breaking):
  - Border radii: 4/6/8/12 → 6/8/12/16px (rounder, more modern)
  - Add transitions: 150ms ease on all interactive elements
  - Add card hover: subtle elevation (box-shadow: 0 2px 8px rgba(0,0,0,0.4))
  - Add section breathing room: 24px between major sections
  - Add PnL semantic tokens: --color-pnl-positive (#4ade80), --color-pnl-negative (#f87171)
  - Sparkline cells in tables: inline SVG, green/red by direction

ADD (new capabilities):
  - GlobalNavBar: persistent top rail linking all surfaces (32px, minimal)
  - LifecycleRail: 7-step horizontal indicator showing current lifecycle phase
  - BreadcrumbNav: Fund > Client > Strategy > Config > Run with cross-surface links
  - DimensionalGrid: sortable/filterable/heatmap-capable data grid for batch analysis
  - FilterBar: URL-based cascading filters that survive refresh and cross-link
  - EntityLink: clickable entity names that deep-link to the correct surface
  - CrossLink: explicit cross-surface navigation with context preservation
```

---

## The Three Hierarchies

The system has three parallel entity hierarchies. Each maps to different user workflows.

### Business Hierarchy (The Money)

```
Fund
  └── Client (allocation, risk terms, reporting)
        └── Strategy (template, archetype, intent)
              └── Config Version (typed trigger/risk/execution package)
                    └── Run (live or batch execution context)
                          ├── Positions (current state per instrument/venue)
                          ├── Orders (instructions emitted)
                          ├── Fills (executions completed)
                          ├── PnL (6D attribution: delta, funding, basis, interest, greeks, MTM)
                          └── Recon (expected vs observed, break resolution)
```

### Operations Hierarchy (The Machine)

```
Service
  └── Deployment (version, environment, region)
        └── Job (batch run, feature backfill, recon sweep)
              ├── Logs (structured events, severity, correlation_id)
              ├── Alerts (threshold breaches, anomalies)
              └── Incidents (escalated alerts requiring resolution)
```

### Research Hierarchy (The Science)

```
Strategy Archetype
  └── Experiment / Grid (parameter sweep)
        └── Result Slice (grouped by shard dimension)
              └── Selected Candidates (meet Sharpe/drawdown/capacity gates)
                    └── Promotion Package (approval + deployment target)
```

---

## Platform Architecture: 4 Surfaces + 3 Specialist Tools

### The Four Primary Surfaces

These are the daily-use surfaces. Every trading day, someone touches all four.

```
┌─────────────────────────────────────────────────────────────────────┐
│  GLOBAL NAV BAR  │ Trading │ Strategy │ Markets │ Ops │ Config │ ML │ Reports │ ⌕ Search │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   LIFECYCLE RAIL                                                    │
│   ○ Design  ○ Simulate  ● Promote  ○ Run  ○ Monitor  ○ Explain  ○ Reconcile │
│                                                                     │
│   BREADCRUMB                                                        │
│   Odum Delta One > Blue Coast Capital > BTC Basis v3 > cfg-3.2.1   │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                     CONTENT AREA                             │  │
│   │                                                              │  │
│   │   Entity-scoped view with lens tabs                          │  │
│   │   (Positions | Orders | Fills | PnL | Recon | Timeline)      │  │
│   │                                                              │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   SIDEBAR (surface-specific navigation)                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

#### Surface 1: Trading Command Center (port 5177)

_Was: live-health-monitor-ui. Absorbs: alerts from logs-dashboard-ui, performance overview from client-reporting-ui._

**Purpose:** Everything you need while markets are open. The first screen at 7am.

**Primary user verb:** OBSERVE, INTERVENE

**Lifecycle phases:** Run, Monitor

**Icon color:** `#4ade80` (green — live/active)

**Landing page (`/`) — The "How did you make this so neat?" screen:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  GLOBAL NAV ─ ◆ Trading  ◇ Strategies  ◇ Markets  ◇ Ops  ◇ Config  ◇ ML  ◇ Reports │
├─────────────────────────────────────────────────────────────────────────────┤
│  LIFECYCLE ─ ○ Design  ○ Simulate  ○ Promote  ● Run  ○ Monitor  ○ Explain │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│  │ FIRM PnL  │ │ NET EXPSR │ │ MARGIN    │ │ LIVE      │ │ ALERTS    │    │
│  │ +$1.42m   │ │ $4.2m     │ │ 82% used  │ │ 24 strats │ │ 3 crit   │    │
│  │ ▲ +0.8% 1d│ │ 1.2x levr │ │ $340k free│ │ 18● 4▲ 2○│ │ 2 high   │    │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
│                                                                             │
│  ┌───────────────────────────────────────┐  ┌──────────────────────────────┐│
│  │ STRATEGY PERFORMANCE                  │  │ P&L + RISK ATTRIBUTION      ││
│  │                                       │  │ (same dimensions, 2 sides)  ││
│  │ Strategy     │St│ PnL │Shrp│DD │ ~~~  │  │                             ││
│  │ BTC Basis v3 │●L│+412k│2.1 │4.1│╱╲╱╲ │  │ Bucket    │ P&L    │Exposure││
│  │ ETH Staked   │●L│+289k│2.5 │3.3│╱╲╱  │  │ Funding   │ +$412k │$8.2m  ││
│  │ AAVE Lending │●L│ +91k│1.8 │2.1│╱╲   │  │ Basis     │ +$355k │14 bps ││
│  │ ML Direction │▲W│ -18k│0.9 │6.8│╲╱╲  │  │ Staking   │ +$145k │LTV .72││
│  │ SPY ML Dir   │●L│ +67k│1.4 │3.9│╱╲╱  │  │ Delta     │  +$61k │$2.4m  ││
│  │ Sports Arb   │●L│ +44k│1.6 │1.8│╱╲   │  │ Greeks    │   -$8k │Δ:-0.98││
│  │                                       │  │ Slippage  │  -$61k │──     ││
│  │ Click row → Strategy Analytics        │  │ Fees      │  -$44k │──     ││
│  │ Click status → filtered positions     │  │ Recon     │  -$18k │4 brks ││
│  │ [Group: All▾] [DeFi▾] [Sort: PnL▾]   │  │ NET       │+$1.04m │       ││
│  └───────────────────────────────────────┘  │                             ││
│                                              │ [→ Full P&L in Markets]    ││
│  ┌─────────────────────────────┐             │ [→ Full Risk Detail]       ││
│  │ ALERTS & INCIDENTS          │             └──────────────────────────────┘│
│  │                             │                                            │
│  │ ● CRIT: Kill switch armed  │  ┌────────────────────────────────────────┐│
│  │   BTC Basis v3 — inv skew  │  │ HEALTH & FEATURE FRESHNESS            ││
│  │ ▲ HIGH: Feature freshness  │  │                                        ││
│  │   features-d1 92s lag EU   │  │ Service          │Fresh│ SLA │ Status  ││
│  │ ▲ MED: Recon break         │  │ features-delta-1 │ 92s│  30s│ ▲ lag   ││
│  │   Elysium SMA mismatch    │  │ execution-svc    │  2s│   5s│ ● ok    ││
│  │                             │  │ risk-exposure    │  4s│  10s│ ● ok    ││
│  │ [Kill Switch Panel]         │  │ pnl-attribution  │  8s│  15s│ ● ok    ││
│  │ [→ All Alerts]              │  │ market-tick-data │0.3s│   1s│ ● ok    ││
│  └─────────────────────────────┘  │ ml-inference     │  ──│  ──│ ○ idle  ││
│                                   └────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

**What makes this landing page Citadel-grade:**

1. P&L and Risk Attribution side-by-side in the same 6D breakdown — backward (what happened) vs forward (what's at risk)
2. Feature freshness as first-class metric — if features are stale, strategies trade on stale signals
3. Margin health / LTV in the KPI row — DeFi lending health and CeFi margin utilization at a glance
4. Every cell is a portal — click strategy → analytics, click status badge → positions, click P&L bucket → Markets
   drill-down

**Routes:**

- `/` — Fund dashboard: KPI cards + strategy table + P&L/risk attribution + alerts + health/freshness
- `/positions` — All live positions, filterable by [Client | Strategy | Venue | Asset Class]
- `/positions/:runId` — Position detail: orders, fills, execution timeline
- `/risk` — Full risk view with four tabs, all showing value-vs-limit with utilization %:
  - **Risk Summary**: all limits at a glance, sorted by highest utilization first (early insight surface). Progress
    bars: green < 70%, amber 70-90%, red > 90%. Drill-down: firm → client → strategy → venue → instrument.
  - **Exposure Attribution**: delta/funding/basis/interest/greeks exposure in same 6D as P&L, each with its limit
    threshold
  - **Margin & LTV**: per-venue margin utilization vs venue limit, per-position DeFi health factor vs liquidation
    threshold, free margin, LTV vs max LTV
  - **Limits Detail**: full limit hierarchy drill-down with cascading thresholds (firm → client → strategy → venue →
    instrument), utilization time series per limit
- `/alerts` — Unified alert feed, severity-colored, dismissible, with incident creation
- `/health` — Service health grid + dependency DAG + feature freshness SLA tracker
- `/manual` — Manual trade entry (scoped: select client + strategy first) + kill switches

**Kill Switch / Intervention Panel (slide-out sheet):**

- Scope selector: Fund → Client → Strategy → Venue (cascading)
- Actions: Pause Strategy, Cancel Outstanding Orders, Flatten Exposure, Disable Venue
- Every action requires: rationale text, scope preview, generates incident + audit record
- Confirmation modal with affected position count and estimated market impact

**Deep links OUT:**

- Strategy name → Strategy Analytics `/strategies/:id`
- Client name → Markets `/pnl/client/:id`
- P&L bucket → Markets `/pnl?component=funding` (pre-filtered to that component)
- Exposure bucket → `/risk` with that dimension expanded
- Alert → `/alerts?id=:id` (same surface)
- Service freshness → Operations `/services/:name`

---

## Service-to-Surface Data Map (No Orphans)

Every backend API endpoint maps to exactly one UI surface. No data is produced without a rendering home.

### Endpoints explicitly NOT rendered in UI (developer/CLI/Grafana only)

These are backend plumbing or infrastructure telemetry — they have no UI surface by design (per Principle 7: Grafana for
infrastructure). They are documented here to confirm they are NOT orphans but deliberate exclusions:

- `GET /system/cores` (exec-results) — CPU info. Grafana.
- `GET /local-default-directory` (exec-results) — Local filesystem path. CLI only.
- `GET /buckets`, `GET /prefixes`, `GET /files` (exec-results) — GCS browsing primitives. Backend plumbing for results
  display, not direct UI endpoints.
- `POST /run-local`, `POST /batch-local`, `POST /run-exact-cli` (exec-results) — Local execution variants. CLI/developer
  tools.
- `POST /fills` (exec-results), `POST /analytics/trades` (trading-analytics) — Ingestion/write endpoints called by
  services, not UI-initiated.
- `POST /predictions` (ml-inference) — Service-to-service prediction requests, not UI-initiated.
- `GET /instructions`, `POST /instructions` (exec-results) — Strategy execution instructions. Internal to
  strategy-service, not rendered directly in UI (strategy decisions are visible through fills/orders/positions, not raw
  instructions).

### Orphans resolved — now mapped

| Endpoint                                  | API               | Now mapped to                                       | Surface                | Route                                                                                                | Batch/Live |
| ----------------------------------------- | ----------------- | --------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- | ---------- |
| `POST /distribution`                      | exec-results      | Distribution histogram for backtest metrics         | Strategy Analytics     | `/grid` (DimensionalGrid visualization mode toggle: table / heatmap / distribution)                  | Batch      |
| `GET /analytics/predictions/quality`      | trading-analytics | ML prediction accuracy monitoring                   | ML Platform            | `/models` (model detail: accuracy, loss, prediction quality over time)                               | Batch      |
| `GET /predictions/recent`                 | ml-inference      | Recent ML predictions for live strategies           | Trading Command Center | `/` (strategy table — strategies using ML show prediction confidence as a column)                    | Live       |
| `GET /stream/predictions` (SSE)           | trading-analytics | Live prediction stream                              | Trading Command Center | `/` (live feed powering ML strategy status badges and prediction confidence)                         | Live       |
| `GET /sports/pnl`                         | client-reporting  | Sports P&L breakdown by venue/strategy              | Market Intelligence    | `/pnl` with FilterBar dimension `asset_group=Sports`                                                 | Batch      |
| `GET /sports/clv`                         | client-reporting  | Closing Line Value analysis (sports signal quality) | Strategy Analytics     | `/strategies/:id` Results tab for sports strategies (CLV is the sports equivalent of alpha/slippage) | Batch      |
| `GET /sports/venue-performance`           | client-reporting  | Per-venue ROI and limiting status                   | Market Intelligence    | `/pnl/venue/:id` with sports filter                                                                  | Batch      |
| `GET /sports/positions`                   | client-reporting  | Open sports positions                               | Trading Command Center | `/positions` with FilterBar dimension `asset_group=Sports`                                           | Live       |
| `GET /sports/risk`                        | client-reporting  | Sports risk exposure (liability, correlation)       | Trading Command Center | `/risk` with FilterBar dimension `asset_group=Sports`                                                | Live       |
| `GET /prime-brokers`, `POST`, `PUT /fees` | trading-analytics | Prime broker management and fee schedules           | Config & Onboarding    | `/prime-brokers` (new route — PB entity CRUD + fee schedule management)                              | Batch      |
| `GET /instruments/corporate-actions`      | trading-analytics | Corporate actions (dividends, splits, earnings)     | Strategy Analytics     | `/instruments` sub-tab "Corporate Actions"                                                           | Batch      |
| `POST /models/{id}/undeploy`              | ml-inference      | Model undeploy action                               | ML Platform            | `/models` (paired with deploy action as a toggle)                                                    | Batch      |
| `GET /recon/runs/{date}/agent-report`     | trading-analytics | Agent-generated recon analysis (markdown)           | Market Intelligence    | `/recon/:date` (embedded in recon detail view as "Agent Analysis" tab)                               | Batch      |
| `GET /settlements/residuals`              | trading-analytics | Explained vs unexplained P&L residuals              | Reporting & Settlement | `/settlements` sub-view "Residuals" (or `/residuals` route)                                          | Batch      |
| `GET /stream/reports` (SSE)               | client-reporting  | Report generation progress                          | Reporting & Settlement | `/reports` (progress indicator while report generates)                                               | Live       |
| `GET /features`                           | ml-training       | Available features for training                     | ML Platform            | `/experiments` (feature selection in experiment setup phase 1)                                       | Batch      |

### FilterBar dimensions that resolve sports + multi-asset class orphans

The FilterBar across Trading Command Center, Strategy Analytics, and Market Intelligence must include an **asset class
dimension**: `[All | DeFi | CeFi | TradFi | Sports]`. This single dimension eliminates 5 sports-specific orphans without
creating a new surface. Sports strategies are not special — they are strategies with `asset_group=Sports`, viewable
through the same P&L waterfall, position table, and risk matrix as any other strategy.

### Config & Onboarding — new route for prime brokers

Add `/prime-brokers` to Config & Onboarding:

- `GET /prime-brokers` — List active prime brokers
- `POST /prime-brokers` — Create new PB entity
- `PUT /prime-brokers/{id}/fees` — Set default fee schedule
- Cross-link: Client detail `/clients/:id` → fee schedule → linked PB

---

## Domain Data, Events & Logging Observability Map (No Orphans)

Beyond API endpoints, the system produces domain events (106 event types via `log_event()`), domain data models (50+
schemas in UIC), PubSub coordination messages, and structured logs. Every piece of observable data must have a rendering
home. This section maps each category to its UI surface.

### Event Categories → UI Surface

| Event Category                                                                                                                               | Event Types | UI Surface                              | Route                                                                            | How visible                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lifecycle** (STARTED, STOPPED, FAILED, PROCESSING*\*, VALIDATION*\*, etc.)                                                                 | 20+ types   | Operations Hub                          | `/events`, `/logs`                                                               | FilterBar by service + severity + event_type. Each event has timestamp, service, severity, details, correlation_id. Click correlation_id → trace.             |
| **Data Ingestion** (DATA_INGESTION_STARTED/COMPLETED, DATA_BROADCAST)                                                                        | 3 types     | Operations Hub                          | `/data-health`, `/events`                                                        | Data completeness heatmap on landing. Per-service ingestion status. Duration_ms, rows, bytes in details.                                                      |
| **Config Changes** (CONFIG_CHANGED, CONFIG_LOADED, CONFIG_RELOADED, CONFIG_SNAPSHOT_SAVED)                                                   | 4 types     | Operations Hub                          | `/audit`                                                                         | Audit trail: who changed what config, when. Cross-link to Config & Onboarding for the config itself.                                                          |
| **Auth Events** (AUTH*SUCCESS, AUTH_FAILURE, LOGIN*\*, LOGOUT, SESSION_EXPIRED)                                                              | 7 types     | Operations Hub                          | `/audit`, `/compliance`                                                          | Security audit trail. AUTH_FAILURE events surface as alerts if threshold breached.                                                                            |
| **Order & Execution** (ORDER*ORPHANED, ORDER_RECOVERY*\*, ORDER_CANCEL_UNCONFIRMED)                                                          | 6 types     | Trading Command Center                  | `/alerts` (if threshold), `/positions/:runId` (timeline)                         | Order recovery events show in position detail timeline. Orphaned orders become alerts.                                                                        |
| **Position Events** (POSITION*AGGREGATED, PORTFOLIO_VIEW_PUBLISHED, POSITION_CRITICAL_DISCREPANCY, POSITION_CORRECTION*\*)                   | 8 types     | Trading Command Center                  | `/positions` (live), `/alerts` (discrepancies)                                   | Position corrections visible in position history. Critical discrepancy → alert → incident.                                                                    |
| **Risk & Health** (KILL*SWITCH*_, CIRCUIT*BREAKER*_, RISK_DATA_INSUFFICIENT, STALE_POSITION_DATA)                                            | 13 types    | Trading Command Center                  | `/alerts`, `/risk`, `/health`                                                    | Kill switch events → alert + incident. Circuit breaker state visible on `/health`. Risk data issues → amber badge on strategy.                                |
| **Compliance/MiFID** (TRADE_REPORTED_MIFID, ORDER_SUBMITTED_MIFID, BEST_EXECUTION_CHECKED, TRANSACTION_REPORTED_FCA, POSITION_LIMIT_CHECKED) | 5 types     | Operations Hub                          | `/compliance`                                                                    | MiFID/FCA compliance records in compliance view. Best execution checks visible per trade.                                                                     |
| **Strategy Events** (STRATEGY_STARTED/STOPPED, STRATEGY_SIGNAL_GENERATED)                                                                    | 3 types     | Trading Command Center                  | `/` (strategy status column), `/positions`                                       | Strategy start/stop changes status badge. Signal generated visible in position detail timeline.                                                               |
| **Backtest Events** (BACKTEST_STARTED/COMPLETED)                                                                                             | 2 types     | Strategy Analytics                      | `/strategies/:id` Backtest tab                                                   | Backtest progress tracking. Duration, completion status.                                                                                                      |
| **Deployment & CI/CD** (DEPLOYMENT*STARTED/COMPLETED/FAILED/ROLLED_BACK, VERSION_BUMPED, CASCADE*\_, SIT\_\_, QG\_\*)                        | 12 types    | Operations Hub                          | `/services/:name` History, `/cicd`                                               | Deploy history timeline. SIT pass/fail status. QG results per service. Cascade dispatch chain visible.                                                        |
| **Agent Lifecycle** (AGENT*INVESTIGATION*_, AGENT*FIX*_)                                                                                     | 4 types     | Operations Hub                          | `/audit`, `/events`                                                              | Agent actions visible in audit trail with reasoning_summary, files_changed, commit_sha.                                                                       |
| **ML & Feature Pipeline** (FEATURE*LOADING*_, FEATURE*GROUP_PROCESSING*_, MODEL*SAVING*\_, STAGE\_\_)                                        | 10 types    | ML Platform + Trading Command Center    | ML: `/experiments/:id` (training phases). Trading: `/health` (feature freshness) | Feature loading completion → freshness SLA. Model saving → model registry update. Stage progression → experiment detail.                                      |
| **Alerting** (ALERT*ROUTED, ALERT_DELIVERED, SLACK_MESSAGE_SENT, DATA_FRESHNESS_ALERT*\*)                                                    | 5 types     | Trading Command Center + Operations Hub | Trading: `/alerts` (routed alerts). Ops: `/events` (delivery confirmation)       | Alert routing visible in alert detail. Delivery status (Slack sent/failed) in Ops events.                                                                     |
| **Data Quality** (POINT_IN_TIME_VIOLATION, LOOKAHEAD_BIAS_VIOLATION, DATA_STALE, DATA_GAP_DETECTED, FEED_UNHEALTHY)                          | 7 types     | Trading Command Center + Operations Hub | Trading: `/health` (freshness/feed status). Ops: `/data-health` (completeness)   | Data quality violations → amber/red on health grid. Point-in-time violations → critical alert (backtest integrity).                                           |
| **DeFi Domain** (DEFI_HEALTH_AGGREGATED, DEFI_LP_AGGREGATED, DEFI_STAKING_AGGREGATED, DEFI_VAULT_REBALANCED)                                 | 4 types     | Trading Command Center                  | `/risk` → DeFi Health tab                                                        | DeFi health aggregation results feed the LTV/health factor display. Vault rebalance events visible in position timeline.                                      |
| **Sports Domain** (SPORTS_ARB_DETECTED, MARKET_SUSPENDED)                                                                                    | 2 types     | Trading Command Center                  | `/alerts` (arb detected), `/positions` (market suspended badge)                  | Arb detection → opportunity alert. Market suspension → position status badge.                                                                                 |
| **P&L Events** (UNEXPLAINED_PNL_RESIDUAL)                                                                                                    | 1 type      | Market Intelligence                     | `/recon`                                                                         | Unexplained residual triggers recon case creation. Visible in recon detail with break size.                                                                   |
| **Coordination Events** (DATA_READY, PREDICTIONS_READY, INSTRUCTIONS_READY, FEATURES_READY, etc.)                                            | 8+ types    | Trading Command Center                  | `/health` (service readiness chain)                                              | Coordination events are the "heartbeat" of the live pipeline. Visible as freshness SLA on health grid — if FEATURES_READY stops arriving, freshness degrades. |

### Domain Data Models (UIC/UAC Schemas) → UI Surface

| Schema                                                                     | Source                           | UI Surface                                  | Route                                                                 | Snapshot            | Time Series                              |
| -------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------- | --------------------------------------------------------------------- | ------------------- | ---------------------------------------- |
| **RiskMetrics** (leverage, margin, concentration, drawdown, VaR, ES)       | risk-and-exposure-service        | Trading Command Center                      | `/risk` → Risk Summary                                                | Exact metrics at T  | Leverage/margin/drawdown drift over time |
| **AlertMessage** (type, threshold, current_value, recommended_action)      | alerting-service                 | Trading Command Center                      | `/alerts`                                                             | Active alerts at T  | Alert frequency, resolution trends       |
| **ExposureSummary** (gross/net/long/short, by_venue, by_instrument)        | risk-and-exposure-service        | Trading Command Center                      | `/risk` → Exposure Attribution                                        | Exposure at T       | Exposure drift over time                 |
| **PnLBreakdown** (6D: delta, funding, basis, interest, greeks, MTM)        | pnl-attribution-service          | Market Intelligence                         | `/pnl` → waterfall                                                    | Attribution at T    | Component evolution over time            |
| **GreeksExposure** (delta, gamma, theta, vega, rho)                        | risk-and-exposure-service        | Trading Command Center                      | `/risk` → Exposure Attribution                                        | Greeks at T         | Greeks drift (esp. gamma/vega)           |
| **PreTradeCheckRequest/Response** (approved, alerts, limit checks)         | risk-and-exposure-service        | Trading Command Center                      | `/manual` (pre-trade validation)                                      | Per-order check     | N/A (per-event, not time series)         |
| **DeltaOneFeatureRecord** (60+ fields: RSI, MACD, funding_rate, vol, etc.) | features-delta-one-service       | Strategy Analytics + Trading CC             | Strategy: `/strategies/:id` Deep Dive. Trading: `/health` (freshness) | Feature values at T | Feature evolution (deep dive charts)     |
| **CeFi/DeFi Position types** (quantity, price, PnL, margin, LTV, health)   | position-balance-monitor-service | Trading Command Center                      | `/positions`                                                          | Positions at T      | Position size evolution                  |
| **OrderEvent** (order_id, status, venue, fills)                            | execution-service                | Trading Command Center + Strategy Analytics | Trading: `/positions/:runId`. Strategy: Execution tab                 | Orders at T         | Order flow over time                     |
| **StrategyDecision** (signal_type, confidence, reason)                     | strategy-service                 | Strategy Analytics                          | `/strategies/:id` Deep Dive tab                                       | Decision at T       | Signal history (confidence over time)    |
| **QualityGateDetails** (tests, coverage, pyright clean)                    | CI/CD                            | Operations Hub                              | `/cicd`, `/services/:name`                                            | QG result at T      | Coverage/test trends                     |
| **DeploymentDetails** (repo, env, version, trigger)                        | deployment-api                   | Operations Hub                              | `/services/:name` History                                             | Deploy at T         | Deploy frequency, rollback rate          |
| **VersionBumpDetails** (old→new, bump_type, breaking)                      | semver-agent                     | Operations Hub                              | `/services/:name`, `/cicd`                                            | Version at T        | Version progression timeline             |
| **CascadeDispatchDetails** (source, targets, bump_type)                    | PM workflows                     | Operations Hub                              | `/cicd`                                                               | Cascade at T        | Cascade propagation history              |
| **Sports Features** (H2H, halftime goals, xG, referee odds)                | features-sports-service          | Strategy Analytics                          | `/strategies/:id` for sports strategies                               | Features at T       | Feature evolution (match buildup)        |
| **Volatility Surface** (moneyness x tenor matrix)                          | features services                | Strategy Analytics                          | `/strategies/:id` Deep Dive for options strategies                    | Surface at T        | Vol surface evolution                    |

### PubSub / Coordination Channels → UI Observability

| Channel Pattern        | Producer                         | Consumer                         | UI Visibility                                                                      |
| ---------------------- | -------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| `lifecycle-events`     | All services                     | batch-audit-api                  | Ops Hub `/events`, `/logs` — the full event stream                                 |
| `alerts-stream`        | alerting-service                 | Trading CC, client-reporting-api | Trading CC `/alerts` — live alert feed                                             |
| `positions-stream`     | position-balance-monitor-service | Trading CC (via API)             | Trading CC `/positions` — live position updates                                    |
| `signals-stream`       | strategy-service                 | Trading CC (via API)             | Trading CC `/` — strategy status + signal confidence                               |
| `features-ready`       | feature services                 | strategy-service                 | Trading CC `/health` — feature freshness SLA (if not arriving, freshness degrades) |
| `predictions-ready`    | ml-inference-service             | strategy-service                 | Trading CC `/` — ML strategy prediction confidence column                          |
| `ml-deploy`            | ml-inference-api                 | ml-inference-service             | ML Platform `/models` — deploy/undeploy status                                     |
| `CONFIG_CHANGED` event | config-api                       | strategy-service (hot-reload)    | Config & Onboarding audit + Ops Hub `/audit` — config change trail                 |

### Structured Log Fields → UI Observability

All structured log fields from `log_event()` are queryable through Operations Hub `/logs`:

| Field            | Type         | Filterable in UI | How                                                                                                            |
| ---------------- | ------------ | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `timestamp`      | datetime     | Yes              | Time range picker in FilterBar                                                                                 |
| `service_name`   | string       | Yes              | Service dropdown in FilterBar                                                                                  |
| `event_name`     | string       | Yes              | Event type dropdown in FilterBar                                                                               |
| `severity`       | enum         | Yes              | Severity multi-select (DEBUG/INFO/WARN/ERROR/CRIT)                                                             |
| `client_id`      | string (PII) | Yes              | Client filter (with PII masking for non-admin)                                                                 |
| `correlation_id` | string       | Yes              | Clickable → full cross-service trace at `/logs?correlation_id=X`                                               |
| `details.*`      | dict         | Partial          | Free-text search across details JSON. Key fields (duration_ms, rows, error_message) shown in log line preview. |

### Library Schema Observability

Libraries (UIC, UAC, UCI, UTL, UEI, UDC) don't produce events directly, but their schemas define the STRUCTURE of all
observable data. This is visible through:

- **UIC schemas** define the shape of risk metrics, positions, P&L — visible wherever those data types render (Trading
  CC, Market Intelligence)
- **UAC schemas** define external data normalization — visible in Strategy Analytics `/instruments`, `/tick-data`
- **UEI event schemas** define the structure of every `log_event()` call — visible in Ops Hub `/events`, `/logs`
- **UCI config schemas** define strategy/execution config structure — visible in Config & Onboarding, Strategy Analytics
  `/configs`

Libraries report issues via their parent service's `log_event()` calls. For example, UTL's `POINT_IN_TIME_VIOLATION` is
emitted by whichever service uses UTL — visible in Ops Hub `/events` with the service name as the emitter.

### Reference Data & Config Network (Dropdown / Filter SSOT)

The UI needs reference data for every dropdown, filter, enum badge, and config form. This data lives in generated
OpenAPI artifacts in `unified-api-contracts/openapi/`:

| File                                           | What it provides                                                                                                                                                                                       | UI Consumption                                                                                                                                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ui-reference-data.json`**                   | 100+ venue→category mappings, instrument types per venue, UAC/UIC enum values (OrderSide, OrderType, InstrumentType, AlertType, AssetClass, Sport, etc.), operational mode axes, service port registry | SSOT for every FilterBar dropdown, Select component, enum badge, and config form across ALL surfaces. Loaded once at app init.                                                                                                           |
| **`system-topology.json`**                     | 65+ repos with deps, deployment config, 20 data flow pipelines, 32 strategy definitions, dependency graph with topological order, UI-API mapping                                                       | Operations Hub `/services` (dependency DAG), Config & Onboarding (strategy manifest), Trading CC `/health` (service tier hierarchy)                                                                                                      |
| **`config-registry.json`**                     | 45 Pydantic config classes from 28 repos, all fields with types and defaults                                                                                                                           | Config & Onboarding config forms (auto-generated fields from schema), Operations Hub `/services/:name` Config tab                                                                                                                        |
| **`orphan-report.txt`**                        | 547 UAC/UIC schemas not exposed by any API endpoint                                                                                                                                                    | Development audit only — not UI-rendered. These are internal contract schemas used service-to-service. If a schema represents user-observable data and isn't exposed by an API, that's a backend gap to fix, not a UI surface to create. |
| **`unified-trading-system.openapi.json/yaml`** | Full OpenAPI spec for all services                                                                                                                                                                     | Developer reference. Could power auto-generated API docs in Operations Hub (future).                                                                                                                                                     |

**How reference data feeds the UI:**

```
ui-reference-data.json (loaded at app init)
  ├── venue_category_map → FilterBar "Venue" dropdown with category grouping
  ├── instrument_types_by_venue → FilterBar "Instrument Type" cascades based on venue selection
  ├── uac_enums (OrderSide, OrderType, etc.) → Badge variants, form selects
  ├── uic_enums (AlertType, AssetClass, etc.) → Alert severity badges, asset class filters
  ├── operational_modes → Config & Onboarding mode toggles (mock/live/ci/api-real)
  └── service_port_registry → SurfaceRegistry + GlobalNavBar port resolution
```

**Config form generation from config-registry.json:**

Config & Onboarding forms for strategy config, execution config, and risk config can be auto-generated from the config
registry. Each field in the registry has a type and default — this maps directly to form inputs:

- `str` → text input with default
- `int/float` → number input with default and validation
- `bool` → toggle switch
- `Literal[...]` or enum → Select dropdown with allowed values from ui-reference-data.json
- `list[...]` → multi-select or repeatable group

This eliminates the "where do dropdown options come from?" problem. Every dropdown in the system traces back to either
`ui-reference-data.json` (enums, venues, instruments) or `config-registry.json` (config field values).

### Confirmed: Zero Domain Data Orphans

Every event type (106), every domain schema (50+), every PubSub channel, every structured log field, and every reference
data registry maps to at least one UI surface with a specific route. The observability chain is:

```
Library schema defines structure → Service produces events/data → API exposes it →
UI surface renders it (with snapshot at T + time series over period)

Reference data (enums, venues, configs) → ui-reference-data.json / config-registry.json →
FilterBar dropdowns, form inputs, badge variants (loaded at app init)
```

547 UAC/UIC schemas in the orphan report are internal contract types used service-to-service. They are NOT orphans —
they are the plumbing that services use internally. The observable outputs of those schemas flow through the API
endpoints and events already mapped above.

---

## Complete Workflow Map — "I want to X, where do I go?"

### Seeing Things

| I want to see...                    | Surface                | Route                     | Details                                                |
| ----------------------------------- | ---------------------- | ------------------------- | ------------------------------------------------------ |
| Firm P&L at a glance                | Trading Command Center | `/`                       | KPI card + attribution panel                           |
| P&L attribution breakdown (6D)      | Market Intelligence    | `/pnl` → drill 5 levels   | delta, funding, basis, interest, greeks, MTM           |
| Risk/exposure attribution (same 6D) | Trading Command Center | `/risk` → Exposure tab    | delta exp, funding exp, basis spread, LTV, greeks      |
| Margin health / utilization         | Trading Command Center | `/risk` → Margin tab      | Per-venue margin %, free margin, liquidation dist      |
| LTV / DeFi lending health           | Trading Command Center | `/risk` → DeFi Health tab | Health factor, collateral, liquidation threshold       |
| Greek risks (options + basis)       | Trading Command Center | `/risk` → Exposure tab    | Delta, gamma, theta, vega + basis/funding Greeks       |
| Feature freshness / values          | Trading Command Center | `/health` + landing KPI   | Per-service freshness vs SLA target                    |
| Market tick data                    | Strategy Analytics     | `/tick-data`              | Instrument picker, candle/tick toggle, venue filter    |
| Order book depth                    | Market Intelligence    | `/orderbook`              | Bid/ask depth, spread, microstructure                  |
| Venue connections / latency         | Config & Onboarding    | `/venue-connections`      | REST/WS status, latency, error rate, rate limits       |
| Batch vs live reconciliation        | Market Intelligence    | `/recon`                  | Expected (backtest) vs actual (live) with break detail |
| Strategy performance ranked         | Trading Command Center | `/`                       | Strategy table with sparklines, sortable               |
| System health                       | Trading Command Center | `/health`                 | Service grid + DAG + tier status                       |
| Batch job results                   | Operations             | `/jobs`                   | Job list with status, completeness heatmap             |
| All clients                         | Config & Onboarding    | `/clients`                | Client grid with AUM, strategy count                   |

### Doing Things

| I want to...              | Surface                  | Route                        | Flow                                                  |
| ------------------------- | ------------------------ | ---------------------------- | ----------------------------------------------------- |
| Trade manually            | Trading Command Center   | `/manual`                    | Select Client → Strategy → Venue → Instrument → Order |
| Kill/pause a strategy     | Trading Command Center   | Kill Switch panel            | Scope → Action → Rationale → Confirm                  |
| Set config live (promote) | Strategy Analytics → Ops | `/grid` → select → promote   | Select best in grid → cross-link to Ops deploy form   |
| Onboard a new client      | Config & Onboarding      | `/clients` → New             | Wizard-style CRUD                                     |
| Onboard a new strategy    | Config & Onboarding      | `/strategies` → New          | Config editor + publish to GCS                        |
| Run a backtest            | Strategy Analytics       | `/strategies/:id` → Backtest | Instrument + date range + config                      |
| Deploy a service          | Operations               | `/deploy`                    | Service picker + config + dry-run toggle              |
| Generate a config grid    | Strategy Analytics       | `/generate`                  | Param grid → mass-deploy → track progress             |
| Generate a report         | Market Intelligence      | `/reports/generate`          | Client + period + format (PDF/CSV)                    |
| Deploy an ML model        | ML Platform              | `/models` → Deploy           | Model version → cross-link to Ops                     |
| Settle positions          | Reporting                | `/settlements/:id` → Confirm | Review + confirm workflow                             |

---

#### Surface 2: Strategy Analytics (port 5175)

_Was: strategy-ui. Absorbs: ALL of execution-analytics-ui (they share 90% of routes and hit the same API)._

**Purpose:** Strategy lifecycle from idea to backtest to live to execution analysis. The quant's home.

**Primary user verb:** DESIGN, SIMULATE, COMPARE, PROMOTE

**Lifecycle phases:** Design, Simulate, Promote

**Icon color:** `#60a5fa` (blue — research/analytical)

**Landing page (`/strategies`):**

```
┌──────────────────────────────────────────────────────────────────┐
│  ⌕ Search strategies, instruments, configs...                    │
│                                                                  │
│  Filter: [All ▾] [DeFi ▾] [CeFi ▾] [TradFi ▾] [Sports ▾]     │
│          [Status: live/paper/backtest ▾] [Client ▾]             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ BTC Basis v3                          DeFi │ ● live       │ │
│  │ Binance + Hyperliquid                                      │ │
│  │ Sharpe: 2.1  │  Return: +18.4%  │  DD: 4.1%  │  ╱╲╱╲╱   │ │
│  │ [View Live →]  [Backtest →]  [Config →]                   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ ETH Staked Basis                      DeFi │ ● live       │ │
│  │ EtherFi + Hyperliquid                                      │ │
│  │ Sharpe: 2.5  │  Return: +22.1%  │  DD: 3.3%  │  ╱╲╱╲    │ │
│  │ [View Live →]  [Backtest →]  [Config →]                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Routes (merged strategy-ui + execution-analytics-ui):**

_Strategies Section:_

- `/strategies` — Catalogue: filterable card grid by asset class, status, client
- `/strategies/:id` — Strategy hub with tabs:
  - Overview (config, parameters, venues, risk limits, allocation)
  - Live (real-time positions, exposure, risk — links to Trading Command Center)
  - Backtest (run new backtest, view historical results)
  - Results (equity curve, metrics, daily P&L breakdown)
  - Execution (fills on tick data, TCA, alpha decomposition, slippage analysis)
  - Deep Dive (per-config detailed attribution timeline)
- `/strategies/:id/compare` — Side-by-side config version comparison

_Batch Analysis Section:_

- `/grid` — DimensionalGrid: all backtest results, slice by [strategy, instrument, venue, date, config]
- `/compare` — Algorithm comparison: overlay equity curves, rank by metric
- `/heatmap` — Two-dimension heatmap (e.g., instrument x algorithm → Sharpe)

_Config Section:_

- `/configs` — Config browser (all configs across strategies)
- `/generate` — Config generator → mass deploy step
- `/instruments` — Instrument definitions and data availability
- `/tick-data` — Market tick data explorer

**DimensionalGrid (the killer feature for batch analysis):**

```
┌──────────────────────────────────────────────────────────────────┐
│  Showing 47 of 1,203 configs                          [Heatmap] │
│                                                                  │
│  Dimensions: [Instrument ▾] [Venue ▾] [Strategy ▾] [Date ▾]   │
│  Sort: Sharpe ↓                                                  │
│                                                                  │
│  ☐ │ Experiment │ Strategy       │ Config    │ Venue    │ Shard  │
│    │            │                │           │          │        │
│  ☐ │ exp-221    │ BTC Basis v3   │ 3.3.0-rc1 │ Bin/Bybit│ 2025Q4 │
│    │ Sharpe: 2.1 │ PnL: $1.8m │ DD: 4.1% │ Trades: 847       │
│  ☐ │ exp-301    │ ETH Staked     │ 2.5.0     │ Aave/HL  │ 2026Q1 │
│    │ Sharpe: 2.5 │ PnL: $2.4m │ DD: 5.0% │ Trades: 412       │
│  ☐ │ exp-222    │ BTC Basis v3   │ 3.3.0-rc2 │ Bin/OKX  │ 2026Q1 │
│    │ Sharpe: 1.7 │ PnL: $1.1m │ DD: 3.3% │ Trades: 923       │
│                                                                  │
│  ┌───────────── Selection Toolbar (3 selected) ──────────────┐  │
│  │  [Promote to Batch ▾]  [Promote to Live ▾]  [Export CSV]  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Promotion Flow (from Grid → Live):**

1. Select best rows by checkbox
2. Click "Promote to Live" → environment picker (dev/staging/live)
3. Generates cross-link to Operations:
   `http://localhost:5183/deploy?service=strategy-service&config_folders=gs://...&env=staging`
4. Operations UI pre-fills the deploy form with selected configs
5. User reviews and deploys (no auto-deploy)

**Deep links OUT:**

- "View Live" → Trading Command Center `/positions?strategy_id=:id`
- "Promote to Live" → Operations `/deploy?service=...&config_folders=...`
- "Edit Config" → Config & Onboarding `/strategies/:id`

---

#### Surface 3: Market Intelligence (port 5180)

_Was: trading-analytics-ui. Absorbs: report generation from client-reporting-ui._

**Purpose:** P&L attribution, microstructure, reconciliation. The post-trade analytics surface.

**Primary user verb:** EXPLAIN, RECONCILE

**Lifecycle phases:** Explain, Reconcile

**Icon color:** `#a78bfa` (purple — analytical/deep)

**Landing page (`/pnl`):**

```
┌──────────────────────────────────────────────────────────────────┐
│  GROUP BY: [All ▾] [Client ▾] [Strategy ▾] [Venue ▾] [Asset ▾]│
│  DATE: [2026-03-17 ▾]  TYPE: [Total ▾ | Realized | Unrealized] │
│                                                                  │
│  BREADCRUMB: All > Blue Coast Capital > BTC Basis v3             │
│                                                                  │
│  ┌─── P&L WATERFALL ─────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  Funding    █████████████████  +$412k                      │  │
│  │  Carry      ████████████       +$355k                      │  │
│  │  Basis      ██████             +$188k                      │  │
│  │  Staking    █████              +$145k                      │  │
│  │  Delta      ██                 +$61k                       │  │
│  │  Slippage   ▓▓▓               -$61k                       │  │
│  │  Fees       ▓▓                 -$44k                       │  │
│  │  Recon      ▓                  -$18k                       │  │
│  │  ──────────────────────────────────────                    │  │
│  │  NET        █████████████████  +$1.04m                     │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Click any row to drill down one level deeper                    │
└──────────────────────────────────────────────────────────────────┘
```

**Routes:**

- `/pnl` — P&L waterfall with Group By control: [All | Client | Strategy | Asset Class | Venue]
- `/pnl/client/:id` — Client-scoped P&L breakdown by strategy
- `/pnl/strategy/:id` — Strategy-scoped P&L with 6D attribution (delta, funding, basis, interest, greeks, MTM)
- `/pnl/venue/:id` — Venue-scoped P&L (useful for venue cost analysis)
- `/desk` — Live order flow + fills (the trading desk view)
- `/orderbook` — Order book microstructure viewer
- `/latency` — Latency analytics (p50/p95/p99 by service, venue, instrument)
- `/recon` — Reconciliation runs list
- `/recon/:date` — Recon detail: expected vs observed, break size, source system, resolution status
- `/recon/:date/deviations` — Individual deviation drill-down with evidence trail
- `/reports` — Report list (absorbed from client-reporting-ui)
- `/reports/generate` — Report generation form (PDF/CSV)

**P&L Hierarchy (5 levels deep):**

```
Level 1: ALL (total system P&L)
  Level 2: By Client
    Level 3: By Strategy (within client)
      Level 4: By Venue (within strategy × client)
        Level 5: By P&L Component
          (delta_pnl, funding_pnl, basis_pnl, staking_yield_pnl,
           interest_rate_pnl, greeks_pnl, carry_pnl, rewards_pnl,
           transaction_costs, mark_to_market_pnl, residual_pnl)
```

**Deep links OUT:**

- Strategy name → Strategy Analytics `/strategies/:id`
- Client name → same surface `/pnl/client/:id` (drill down)
- "View Live" → Trading Command Center `/positions?strategy_id=:id`

---

#### Surface 4: Operations Hub (port 5183)

_Was: deployment-ui. Absorbs: batch-audit-ui, logs-dashboard-ui, unified-admin-ui._

**Purpose:** Deploy, monitor jobs, view logs, check compliance. The SRE surface.

**Primary user verb:** DEPLOY, DIAGNOSE, INTERVENE

**Lifecycle phases:** (infrastructure, orthogonal to business lifecycle)

**Icon color:** `#fbbf24` (amber — operations/caution)

**Landing page (`/`):**

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────────────────────────────────┐ │
│  │ BATCH SUMMARY│  │ DATA COMPLETENESS HEATMAP                │ │
│  │              │  │                                          │ │
│  │ ● 47 done   │  │ Service      │ -3d │ -2d │ -1d │ today  │ │
│  │ ▲ 3 failed  │  │ features-d1  │ ███ │ ███ │ ██░ │ █░░    │ │
│  │ ◎ 12 running│  │ execution    │ ███ │ ███ │ ███ │ ███    │ │
│  │              │  │ risk-exp     │ ███ │ ███ │ ███ │ ██░    │ │
│  │ Last 24h    │  │ pnl-attrib   │ ███ │ ███ │ ███ │ ███    │ │
│  └──────────────┘  └──────────────────────────────────────────┘ │
│                                                                  │
│  RECENT DEPLOYMENTS                      QUICK ACTIONS           │
│  ┌────────────────────────────────┐     [Deploy Service →]       │
│  │ execution-service  prod v31    │     [View All Logs →]        │
│  │ features-delta-one prod v17    │     [Check Compliance →]     │
│  │ risk-and-exposure  prod v12    │                              │
│  └────────────────────────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

**Event → Alert → Incident hierarchy:**

```
Raw event (log_event() call from any service)
  │  lands in: GCS events/{service}/{date}/events.jsonl
  │  viewable at: Operations Hub /events
  │
  ├── If severity >= threshold → becomes Alert
  │     Trading alerts → Trading Command Center /alerts
  │     Infra alerts → Operations Hub /events?severity=critical
  │
  └── If alert escalated → becomes Incident
        Trading Command Center /alerts (incident management)
        Created by: kill switch, manual escalation, auto-rules
```

**Service-Client-Strategy mapping (all services are shared):**

Services are shared infrastructure — there are no per-client or per-strategy deployments. `strategy-service` runs ALL
strategy instances as async tasks. `execution-service` routes ALL orders. Sharding is logical
`(strategy_id, client_id)`, not physical (separate pods). The mapping from client to services is indirect:

```
Client (odum)
  └── has strategy instances: (via Config & Onboarding /clients/:id)
        ├── (DEFI_ETH_STAKED_BASIS, odum, v2.4.0)
        └── (TRADFI_SPY_ML_DIR, odum, v1.0.0)
              └── all flow through shared services: (EntityLinks to Ops /services/:name)
                    strategy-service, execution-service, features-delta-one,
                    risk-and-exposure, pnl-attribution, market-tick-data-service
```

Config & Onboarding `/clients/:id` shows which strategies are configured for that client, with a "Services involved"
read-only list of EntityLinks to Operations Hub. Tracing a specific client's flow through shared services uses
`correlation_id` in logs/events.

**Routes (merged deployment-ui + batch-audit-ui + logs-dashboard-ui):**

_Deploy Section:_

- `/` — Overview: batch summary + data completeness + recent deployments
- `/deploy` — Service deployment form (dry run + live), accepts query params for pre-fill
- `/services` — Services overview grid with columns: service, deployed version, expected version (from manifest),
  environment, region, status. Version drift = amber badge.
- `/services/:name` — Service detail: Deploy, Data Status, Builds, Readiness, Config, History, + "Deep Dive in Grafana"
  link (pre-filtered)
- `/epics` — Epic readiness view

_Observe Section:_

- `/jobs` — Batch jobs list with status/health (from batch-audit-ui)
- `/jobs/:id` — Job detail: shard progress, logs scoped to job correlation_id, duration (from batch-audit-ui)
- `/logs` — Unified log stream: FilterBar with service, severity (DEBUG/INFO/WARN/ERROR/CRIT), time range, free-text
  search, correlation_id filter. Each log line's correlation_id is clickable → shows full trace across services.
- `/logs/:id` — Log detail with full correlation_id trace: all events across all services for that correlation chain
- `/events` — Structured event stream from unified-events-interface. Filter by event_type, service, date range. Events
  that crossed alert thresholds are marked.
- `/data-health` — Data completeness checks per service (from batch-audit-ui)

_Compliance Section:_

- `/audit` — Audit trail: every config change, deployment, kill switch action, strategy pause. Filter by actor, action
  type, time range, entity.
- `/compliance` — Compliance checks and status (from batch-audit-ui)
- `/cicd` — CI/CD pipeline status (from logs-dashboard-ui)

**Sidebar nav grouping:**

```
DEPLOY
  Overview
  Deploy Service
  Services
  Epics

OBSERVE
  Batch Jobs
  Logs
  Events
  Data Health

COMPLIANCE
  Audit Trail
  Compliance
  CI/CD
```

---

### The Three Specialist Tools

#### Tool 5: Config & Onboarding (port 5173)

_Was: onboarding-ui. Trimmed: remove /deployments, /audit._

**Purpose:** CRUD for clients, strategies, venues, credentials, risk config. Config publishing.

**Lifecycle phase:** Design (configure before you trade)

**Routes (trimmed):**

- `/clients`, `/clients/:id` — Client CRUD with fee structure. Client detail shows: strategy instances
  `(strategy_id, client_id, config_version)` with status, plus "Services involved" read-only list (EntityLinks to
  Operations Hub `/services/:name`).
- `/strategies`, `/strategies/:id` — Strategy config editing + publishing to GCS
- `/venues`, `/venues/:id` — Venue CRUD
- `/venue-connections` — Live connectivity status
- `/api-keys` — API key management
- `/credentials` — Credential status
- `/risk` — Risk configuration per client/strategy
- `/prime-brokers` — Prime broker entity CRUD + fee schedule management (EntityLink from client fee schedule)
- `/strategy-manifest` — Strategy manifest (read-only, from UAC registry)

**Cross-links OUT:**

- "Run Backtest →" → Strategy Analytics `/strategies/:id/backtest`
- "View Live →" → Trading Command Center `/positions?strategy_id=:id`
- "View Analytics →" → Market Intelligence `/pnl/strategy/:id`

#### Tool 6: ML Platform (port 5179)

_Was: ml-training-ui. Unchanged except: remove /deployments tab._

**Purpose:** Model training, experiment management, model registry.

**Routes:**

- `/experiments` — Experiment list
- `/experiments/:id` — Experiment detail + DimensionalGrid for hyperparameter comparison
- `/experiments/:id/grid` — Hyperparameter grid: dimensions = [instrument, timeframe, learning_rate, num_layers,
  dropout, phase]
- `/models` — Model registry with deploy action

**Cross-links OUT:**

- "Deploy Model →" → Operations `/deploy?service=ml-inference-service`

#### Tool 7: Client Reporting & Settlement (port 5182)

_Was: client-reporting-ui. Absorbs: settlement-ui (invoices, settlements, EOD positions)._

**Purpose:** Client-facing views: performance reports, invoices, settlement. Post-trade/EOD only.

**Routes (merged):**

- `/portfolio` — Client portfolio overview (links to Market Intelligence for P&L detail)
- `/performance` — Historical performance: monthly returns, Sharpe, by-client breakdown
- `/reports` — Report list
- `/reports/generate` — Report generation form (PDF/CSV)
- `/positions` — Historical/EOD positions only (NOT live — live positions → Trading Command Center)
- `/invoices` — Invoice management (from settlement-ui)
- `/settlements` — Settlement records (from settlement-ui)
- `/settlements/:id` — Settlement detail with confirm workflow

---

## Cross-Surface Navigation System

### Global Nav Bar (ui-kit: `<GlobalNavBar />`)

Every UI gets a persistent 32px top bar:

```
┌─────────────────────────────────────────────────────────────┐
│ ◆ Trading  ◇ Strategies  ◇ Markets  ◇ Ops  ◇ Config  ◇ ML  ◇ Reports  │  ⌕ Global Search  │
└─────────────────────────────────────────────────────────────┘
```

- 7 surface labels, icon + text
- Current surface highlighted (filled icon, cyan underline)
- Global fuzzy search: strategies, clients, instruments, services, configs
- Uses `ui-api-mapping.json` for port resolution (local dev) or path prefixes (production)
- 32px height — compact, never dominant

### Lifecycle Rail (ui-kit: `<LifecycleRail />`)

Horizontal 7-step indicator, shown below the GlobalNavBar when relevant:

```
○ Design  ○ Simulate  ● Promote  ○ Run  ○ Monitor  ○ Explain  ○ Reconcile
```

- Active step is filled (●), others hollow (○)
- Steps are clickable — navigates to the appropriate surface for that phase
- Mapping:
  - Design → Config & Onboarding
  - Simulate → Strategy Analytics `/grid`
  - Promote → Strategy Analytics `/grid` (selection + promote flow)
  - Run → Trading Command Center
  - Monitor → Trading Command Center `/alerts`
  - Explain → Market Intelligence `/pnl`
  - Reconcile → Market Intelligence `/recon`

### Breadcrumb Nav (ui-kit: `<BreadcrumbNav />`)

```
Odum Delta One > Blue Coast Capital > BTC Basis v3 > cfg-3.2.1 > run-2026-03-17-live-01
```

- Each level is clickable
- Cross-surface: clicking "Blue Coast Capital" navigates to Market Intelligence `/pnl/client/blue-coast`
- Clicking "BTC Basis v3" navigates to Strategy Analytics `/strategies/btc-basis-v3`
- Current level shows available lenses as tabs below

### Entity Link (ui-kit: `<EntityLink />`)

Every entity name rendered anywhere becomes a clickable deep link:

| Entity     | Target Surface         | Target Path              | Example                                    |
| ---------- | ---------------------- | ------------------------ | ------------------------------------------ |
| strategy   | Strategy Analytics     | `/strategies/:id`        | "BTC Basis v3" → click → strategy detail   |
| client     | Market Intelligence    | `/pnl/client/:id`        | "Blue Coast Capital" → click → client P&L  |
| instrument | Strategy Analytics     | `/instruments?q=:symbol` | "BTC-PERP" → click → instrument detail     |
| service    | Operations             | `/services/:name`        | "execution-service" → click → service ops  |
| experiment | ML Platform            | `/experiments/:id`       | "exp-221" → click → experiment detail      |
| settlement | Reporting              | `/settlements/:id`       | "SETT-2026-03" → click → settlement detail |
| batch_job  | Operations             | `/jobs/:id`              | "JOB-123" → click → job detail             |
| run        | Trading Command Center | `/positions/:runId`      | "run-2026-03-17-live-01" → position detail |

### Cross-Link Context Preservation

When navigating between surfaces, filters carry over:

```
# From Trading Command Center → Market Intelligence P&L for specific client+strategy
http://localhost:5180/pnl?client_id=blue-coast&strategy_id=BTC_BASIS_V3&from=trading

# From Strategy Analytics promote → Operations with pre-filled deploy form
http://localhost:5183/deploy?service=strategy-service&config_folders=gs://...&env=staging&from=strategy-analytics

# From Onboarding client → Trading Command Center filtered to that client
http://localhost:5177/positions?client_id=blue-coast&from=onboarding
```

Each receiving UI reads `?client_id=`, `?strategy_id=`, `?from=` from URL params on mount.

---

## DimensionalGrid Component (ui-kit)

The shared grid component for batch analysis. Used in Strategy Analytics, ML Platform, and anywhere configs need
comparing.

### Design

```typescript
interface DimensionalGridProps {
  // Available dimensions for this grid
  dimensions: DimensionDef[];
  // Metric columns with formatters
  metrics: MetricDef[];
  // Data rows
  data: Record<string, unknown>[];
  // Currently pinned (filtered) dimensions
  pinnedDimensions: Record<string, string[]>;
  // Callbacks
  onDimensionPin: (dim: string, values: string[]) => void;
  onSort: (metric: string, direction: "asc" | "desc") => void;
  onRowSelect: (rowIds: string[]) => void;
  onRowClick: (rowId: string) => void;
  // Features
  enableSelection?: boolean;
  enableHeatmap?: boolean;
  enableExport?: boolean;
  // Selection toolbar render
  selectionToolbar?: (selectedIds: string[]) => ReactNode;
}
```

### Behavior

- **Dimension pills** at the top: dropdown filters per dimension
- **Pinning** a dimension = filtering: "Show only instrument=ETH" collapses that dimension
- **Unpinned** dimensions appear as groupable columns
- **Metrics** are sortable columns with optional sparklines
- **Row count**: "Showing 47 of 1,203 configs"
- **Heatmap toggle**: switches between table and two-dimension color matrix
- **Checkbox selection** with floating toolbar for promote/export actions
- **CSV export** of filtered/sorted results
- **URL state**: all filter/sort state written to query params

### Usage in Strategy Analytics: `/grid`

- Dimensions: strategy, instrument, venue, date_range, config_version
- Metrics: sharpe, total_return, max_drawdown, trade_count, win_rate, net_alpha_bps
- Backed by: `POST /api/v1/analysis/aggregate` and `GET /api/v1/analysis/best-configs`

### Usage in ML Platform: `/experiments/:id/grid`

- Dimensions: instrument, timeframe, learning_rate, num_layers, dropout, training_phase
- Metrics: accuracy, loss, epoch_count, training_time, sharpe_improvement

---

## FilterBar Component (ui-kit)

### Design

```typescript
interface FilterBarProps {
  filters: FilterDef[]; // Available filter slots
  values: FilterValues; // Current filter state
  onChange: (values: FilterValues) => void;
  counts?: Record<string, Record<string, number>>; // Cascading counts per option
  syncToUrl?: boolean; // Write state to query params
}
```

### Behavior

- **URL-based state**: reads/writes query params so filters survive refresh and are shareable
- **Cascading counts**: selecting client=FUND_A updates strategy dropdown to show only that client's strategies
- **Multi-select**: multiple instruments, strategies, venues at once
- **Search within dropdown**: for 50+ strategies or 60+ venues
- **Clear individual + clear all**: each filter pill has ×, plus "Clear all"
- **Dimension toggle**: pin/unpin between filter (fixed) and grid (variable)

---

## Intent Navigation Map

### "I want to see..." (Overviews)

| I want to see...                       | Surface                | Page           | What I see                               |
| -------------------------------------- | ---------------------- | -------------- | ---------------------------------------- |
| Fund-level P&L, everything at a glance | Trading Command Center | `/`            | KPI cards + strategy sparklines + alerts |
| All strategy performance ranked        | Trading Command Center | `/`            | Strategy table, sortable by Sharpe/P&L   |
| System health and service status       | Trading Command Center | `/health`      | Service grid + dependency DAG            |
| Batch run summary, what ran overnight  | Operations             | `/`            | Job counts + data completeness heatmap   |
| All clients and their allocations      | Config & Onboarding    | `/clients`     | Client grid with AUM, strategy count     |
| All pending settlements                | Reporting              | `/settlements` | Settlement list, filterable              |

### "I want to drill into..." (Deep Dives)

| I want to drill into...          | Surface                | Page                              | How I get there              |
| -------------------------------- | ---------------------- | --------------------------------- | ---------------------------- |
| One strategy's P&L decomposition | Market Intelligence    | `/pnl/strategy/:id`               | Click strategy name anywhere |
| One strategy's execution quality | Strategy Analytics     | `/strategies/:id` → Execution tab | Click strategy → Execution   |
| One strategy's live state        | Trading Command Center | `/positions?strategy_id=:id`      | Click "View Live"            |
| One client's P&L by strategy     | Market Intelligence    | `/pnl/client/:id`                 | Click client name anywhere   |
| One instrument's tick data       | Strategy Analytics     | `/tick-data?instrument=:symbol`   | Click instrument name        |
| One service's deploy history     | Operations             | `/services/:name`                 | Click service name anywhere  |
| One recon run's deviations       | Market Intelligence    | `/recon/:date/deviations`         | Click recon run row          |
| One batch job's shard progress   | Operations             | `/jobs/:id`                       | Click job row                |
| One ML experiment's results      | ML Platform            | `/experiments/:id`                | Click experiment row         |

### "I want to compare..." (Grids)

| I want to compare...        | Surface            | Page                    | Dimensions                                |
| --------------------------- | ------------------ | ----------------------- | ----------------------------------------- |
| Strategy backtest configs   | Strategy Analytics | `/grid`                 | strategy, instrument, venue, date, config |
| Execution algo performance  | Strategy Analytics | `/compare`              | algo_type, instrument, venue, benchmark   |
| ML training hyperparameters | ML Platform        | `/experiments/:id/grid` | instrument, timeframe, hyperparams, phase |
| Best configs by metric      | Strategy Analytics | `/grid` sorted          | Sharpe, alpha, P&L, win_rate              |

### "I want to do..." (Actions)

| I want to...                  | Surface                | Page                             |
| ----------------------------- | ---------------------- | -------------------------------- |
| Run a backtest                | Strategy Analytics     | `/strategies/:id` → Backtest tab |
| Deploy a service              | Operations             | `/deploy`                        |
| Promote batch results to live | Strategy Analytics     | `/grid` → select → promote       |
| Create a client               | Config & Onboarding    | `/clients` → "New Client"        |
| Create a strategy config      | Config & Onboarding    | `/strategies` → "New"            |
| Generate config grid          | Strategy Analytics     | `/generate`                      |
| Kill a strategy               | Trading Command Center | Kill Switch panel                |
| Generate a report             | Market Intelligence    | `/reports/generate`              |
| Deploy an ML model            | ML Platform            | `/models` → Deploy               |
| Settle positions              | Reporting              | `/settlements/:id` → Confirm     |

---

## Repos to Deprecate

| Repo                  | Replacement                                                     | Migration                           |
| --------------------- | --------------------------------------------------------------- | ----------------------------------- |
| `strategy-ui`         | Merged into Strategy Analytics (execution-analytics-ui renamed) | Routes merged at port 5175          |
| `batch-audit-ui`      | Merged into Operations (deployment-ui)                          | Tabs added to deployment-ui         |
| `logs-dashboard-ui`   | Merged into Operations (deployment-ui)                          | Tabs added to deployment-ui         |
| `settlement-ui`       | Merged into Reporting (client-reporting-ui)                     | Routes added to client-reporting-ui |
| `unified-admin-ui`    | Redundant (duplicates ops content)                              | Already covered by deployment-ui    |
| `client-reporting-ui` | Renamed to "Client Reporting & Settlement"                      | Absorbs settlement-ui               |

**Post-consolidation: 7 repos, 7 ports, zero duplication.**

---

## Foundational Artifacts (Created — guide all phases)

These cursor rules encode the design system, ownership rules, and component specs. They exist BEFORE Phase 0 so every
agent working on any phase has the right context automatically.

| Rule                        | Path                                              | Purpose                                                                                                |
| --------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Canonical Surface Ownership | `cursor-rules/ui/canonical-surface-ownership.mdc` | Ownership table, overlap resolution, time horizon tie-breaker                                          |
| Component Patterns          | `cursor-rules/ui/component-patterns.mdc`          | Design tokens, AppShell pattern, EntityLink usage, CSS classes, performance                            |
| Cross-Surface Navigation    | `cursor-rules/ui/cross-surface-navigation.mdc`    | Entity routing map, URL param protocol, lifecycle→surface mapping                                      |
| UI Quality Gates            | `cursor-rules/ui/ui-quality-gates.mdc`            | 8-gate standard: lint, types, vitest, build, a11y, cross-link integrity, no orphan routes, perf budget |
| DimensionalGrid Spec        | `cursor-rules/ui/dimensional-grid-spec.mdc`       | Props interface, UX behavior, usage contexts, promotion flow, performance requirements                 |

These rules apply to both Cursor (auto-loaded from `cursor-rules/`) and Claude Code (referenced from CLAUDE.md).

---

## Phased Implementation

### Phase 0: Shared Infrastructure (ui-kit only)

Build new components in unified-trading-ui-kit. No breaking changes to existing UIs.

- [ ] [AGENT] P0. `GlobalNavBar` — top nav bar with 7 surface links + global search
- [ ] [AGENT] P0. `LifecycleRail` — 7-step horizontal indicator with click navigation
- [ ] [AGENT] P0. `BreadcrumbNav` — hierarchical navigation with cross-surface links
- [ ] [AGENT] P0. `EntityLink` — clickable entity names with surface routing
- [ ] [AGENT] P0. `CrossLink` / `buildCrossLink` — URL builder with context preservation
- [ ] [AGENT] P0. `SurfaceRegistry` — port/route mapping from ui-api-mapping.json
- [ ] [AGENT] P0. `DimensionalGrid` — sortable/filterable grid with selection, heatmap, export
- [ ] [AGENT] P0. `FilterBar` — URL-based cascading filters with counts
- [ ] [AGENT] P0. `SparklineCell` — inline SVG sparklines for table cells
- [ ] [AGENT] P0. `SelectionToolbar` — floating toolbar for batch actions on selected rows
- [ ] [AGENT] P0. `LimitBar` — value-vs-limit progress bar with threshold colors (green < 70%, amber 70-90%, red > 90%),
      time series toggle
- [ ] [AGENT] P0. `AsOfDatetimePicker` — global datetime picker: Live / date / datetime / relative shortcuts; writes
      ?as_of= to URL
- [ ] [AGENT] P0. `TimeSeriesToggle` — inline toggle that transforms cross-sectional data into a time series chart with
      period selector
- [ ] [AGENT] P0. `TimeSeriesChart` — reusable chart component (recharts) for equity curves, position evolution,
      exposure drift
- [ ] [AGENT] P0. `useDeepLinkParams()` hook — reads client_id, strategy_id, as_of, from params on mount
- [ ] [AGENT] P0. Visual polish: updated radii, transitions, PnL tokens, card hover, section spacing in globals.css

**QG gate:** `cd unified-trading-ui-kit && bash scripts/quality-gates.sh` + `CI=true npm test -- --run`

### Phase 1: Remove /deployments pollution + add GlobalNavBar (all UIs)

- [ ] [AGENT] P1. Remove `/deployments` route from 10 non-deployment UIs
- [ ] [AGENT] P1. Mount `GlobalNavBar` in AppShell (all UIs get it automatically)
- [ ] [AGENT] P1. Replace plain-text entity names with `EntityLink` in all table views

**QG gate:** all 11 UIs pass quality-gates.sh

### Phase 2: Merge execution-analytics-ui + strategy-ui → Strategy Analytics

- [ ] [AGENT] P2. Add `/strategies` catalogue and `/live` routes to execution-analytics-ui
- [ ] [AGENT] P2. Wire `DimensionalGrid` into `/grid`, `/compare` using existing unwired API endpoints
- [ ] [AGENT] P2. Add promotion toolbar: select best configs → cross-link to Operations with pre-fill
- [ ] [AGENT] P2. Rename to "Strategy Analytics" in AppShell identity
- [ ] [SCRIPT] P2. Update ui-api-mapping.json, dev-start.sh: strategy-ui becomes redirect shell

**QG gate:** Strategy Analytics passes QG; promotion cross-link verified manually

### Phase 3: Build Trading Command Center (live-health-monitor-ui → Trading Command Center)

- [ ] [AGENT] P3. Build landing page: KPI grid + strategy sparkline table + alert feed + health bar
- [ ] [AGENT] P3. Build `/positions` with filterable table [Client | Strategy | Venue | Asset Class]
- [ ] [AGENT] P3. Build Kill Switch / Intervention panel (sheet with scoped actions)
- [ ] [AGENT] P3. Absorb alerts from logs-dashboard-ui
- [ ] [AGENT] P3. Rename to "Trading Command Center" in AppShell identity

**QG gate:** Trading Command Center passes QG

### Phase 4: Merge ops UIs into Operations Hub (deployment-ui)

- [ ] [AGENT] P4. Add Logs tab (from logs-dashboard-ui, hits batch-audit-api)
- [ ] [AGENT] P4. Add Batch Jobs + Data Health tabs (from batch-audit-ui)
- [ ] [AGENT] P4. Add Compliance + Audit Trail tabs (from batch-audit-ui)
- [ ] [AGENT] P4. Accept `?service=&config_folders=&env=` query params on deploy form (pre-fill)
- [ ] [AGENT] P4. Update sidebar nav with grouped sections (Deploy / Observe / Compliance)
- [ ] [SCRIPT] P4. Remove batch-audit-ui (5181), logs-dashboard-ui (5178) from dev-start.sh

**QG gate:** Operations Hub passes QG; pre-fill from Strategy Analytics verified

### Phase 5: Merge settlement-ui into client-reporting-ui → Reporting & Settlement

- [ ] [AGENT] P5. Add Invoices, Settlements routes to client-reporting-ui
- [ ] [AGENT] P5. Mark positions as historical/EOD — add "View Live →" link to Trading Command Center
- [ ] [SCRIPT] P5. Remove settlement-ui (5176) from dev-start.sh

**QG gate:** Reporting & Settlement passes QG

### Phase 6: P&L Hierarchy in Market Intelligence (trading-analytics-ui)

- [ ] [AGENT] P6. Build P&L page with Group By control: [All | Client | Strategy | Asset Class | Venue]
- [ ] [AGENT] P6. Waterfall chart (recharts) re-renders on group change
- [ ] [AGENT] P6. Drill-down on row click: breadcrumb + filtered sub-view, 5 levels deep
- [ ] [AGENT] P6. 6D attribution breakdown panel (delta, funding, basis, interest, greeks, MTM)
- [ ] [AGENT] P6. Absorb report generation from client-reporting-ui

**QG gate:** Market Intelligence passes QG; P&L drill-down verified to 5 levels

### Phase 7: UX Hardening (all surfaces)

- [ ] [AGENT] P7. Add `FilterBar` to all list views (strategies, positions, settlements, jobs, logs)
- [ ] [AGENT] P7. Add `BreadcrumbNav` to all drill-down views
- [ ] [AGENT] P7. Add `SparklineCell` to all performance/metric tables
- [ ] [AGENT] P7. Add `LifecycleRail` to relevant surfaces (Strategy Analytics, Trading, Markets)
- [ ] [AGENT] P7. Responsive design pass: mobile-friendly tables, collapsible sidebar
- [ ] [AGENT] P7. Accessibility pass: keyboard navigation, ARIA labels, focus management
- [ ] [SCRIPT] P7. Full workspace validation: `dev-start.sh --all --mode mock` → 7 UIs launch

### Phase 8: Config Lifecycle Flows (Strategy Analytics)

- [ ] [AGENT] P8. Wire `StrategyConfigGenerator` to real `/config/generate-all` API
- [ ] [AGENT] P8. Add mass-deploy preview + deploy step after config generation
- [ ] [AGENT] P8. Add deployment progress tracking: poll `/backtest/status`, shard progress bar
- [ ] [AGENT] P8. Wire ML Training `ExperimentDetailPage` to real API + `DeployModal`

**QG gate:** Strategy Analytics, ML Platform pass QG

---

## Critical Files

| File                                                             | Change                                 |
| ---------------------------------------------------------------- | -------------------------------------- |
| `unified-trading-ui-kit/src/globals.css`                         | Updated radii, transitions, PnL tokens |
| `unified-trading-ui-kit/src/components/ui/global-nav-bar.tsx`    | NEW                                    |
| `unified-trading-ui-kit/src/components/ui/lifecycle-rail.tsx`    | NEW                                    |
| `unified-trading-ui-kit/src/components/ui/breadcrumb-nav.tsx`    | NEW                                    |
| `unified-trading-ui-kit/src/components/ui/entity-link.tsx`       | NEW                                    |
| `unified-trading-ui-kit/src/components/ui/cross-link.tsx`        | NEW                                    |
| `unified-trading-ui-kit/src/components/ui/dimensional-grid.tsx`  | NEW                                    |
| `unified-trading-ui-kit/src/components/ui/filter-bar.tsx`        | NEW                                    |
| `unified-trading-ui-kit/src/components/ui/sparkline-cell.tsx`    | NEW                                    |
| `unified-trading-ui-kit/src/components/ui/selection-toolbar.tsx` | NEW                                    |
| `unified-trading-ui-kit/src/lib/surface-registry.ts`             | NEW                                    |
| `unified-trading-ui-kit/src/hooks/useDeepLinkParams.ts`          | NEW                                    |
| `unified-trading-ui-kit/src/components/ui/app-shell.tsx`         | Mount GlobalNavBar                     |
| `unified-trading-pm/scripts/dev/ui-api-mapping.json`             | Remove 4 deprecated, rename 2          |
| `unified-trading-pm/scripts/dev/dev-start.sh`                    | Remove deprecated UI startup           |
| All 10 non-deployment UIs `/App.tsx`                             | Remove `/deployments` route            |

---

## Verification Protocol

1. **`bash unified-trading-pm/scripts/dev/dev-start.sh --all --mode mock --frontend-only --open`**
   - 7 UIs start (not 11)
   - Ports: 5173, 5175, 5177, 5179, 5180, 5182, 5183

2. **Global nav check:** open any UI → nav bar shows all 7 → click each → correct UI opens

3. **Deep link check:** Trading Command Center `/positions?client_id=blue_coast` → positions pre-filtered

4. **P&L drill-down:** Market Intelligence `/pnl` → Group By "Client" → click row → Strategy → Attribution

5. **Promote flow:** Strategy Analytics `/grid` → select 3 rows → "Promote to Live" → Operations deploy form pre-filled

6. **Kill switch:** Trading Command Center → Kill Switch panel → Pause Strategy → incident record created

7. **No orphan `/deployments`:** grep all UI repos for `path.*deployments` → zero results outside Operations

8. **Quality gates:** all 7 active UI repos pass `bash scripts/quality-gates.sh`

---

## Why This Works

The current system has 11 UIs that each answer one narrow question. The redesigned system has 7 surfaces that together
answer every question through three organizing principles:

1. **Hierarchy** (Fund → Client → Strategy → Config → Run → Position) — you can always drill deeper
2. **Lifecycle** (Design → Simulate → Promote → Run → Monitor → Explain → Reconcile) — you always know what step comes
   next
3. **Cross-linking** (every entity name is a portal to its canonical home) — you never hit a dead end

The complexity doesn't decrease. What changes is that the complexity is _organized_ — navigable via hierarchy, oriented
by lifecycle, and connected by deep links. That's what makes an outsider look at the system and say: "How did you make
this complexity so neat?"
