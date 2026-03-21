# Phase 2e: Observe Lifecycle Tab — Deep Audit Results

**Audit date:** 2026-03-21
**Repo:** unified-trading-system-ui
**Branch:** feat/service-centric-navigation
**Plan:** `unified-trading-pm/plans/active/ui_phase2_observe_tab_audit_2026_03_21.plan.md`
**Parent:** Phase 1 cross-reference audit

---

## Executive Summary

| Category | Total | PASS | ISSUE | INFO |
|----------|-------|------|-------|------|
| A. Structural Issues | 3 | 0 | 3 | 0 |
| B. Component Inventory | 5 | 2 | 1 | 2 |
| C. Navigation & Routing | 4 | 0 | 4 | 0 |
| D. Data Wiring | 3 | 2 | 0 | 1 |
| E. UX Audit | 4 | 0 | 3 | 1 |
| F. Cross-Reference | 3 | 0 | 3 | 0 |
| **Total** | **22** | **4** | **14** | **4** |

**Severity breakdown:**

| Severity | Count | Items |
|----------|-------|-------|
| P0-blocking | 0 | — |
| P1-fix | 6 | A1, A2, C1, C3, F1, F2 |
| P2-improve | 6 | A3, C2, C4, E1, E4, F3 |
| P3-cosmetic | 2 | E2, E3 |

---

## Section A: Structural Issues

### A1. No layout renders OBSERVE_TABS

```
Task: A1
Status: ISSUE
Severity: P1-fix
```

**Finding:** OBSERVE_TABS is defined in `components/shell/service-tabs.tsx` (lines 126-132) with 5 tabs:

| # | Label | href |
|---|-------|------|
| 1 | Risk Dashboard | `/service/trading/risk` |
| 2 | Alerts | `/service/trading/alerts` |
| 3 | News | `/service/observe/news` |
| 4 | Strategy Health | `/service/observe/strategy-health` |
| 5 | System Health | `/health` |

**No layout.tsx anywhere in the codebase imports or renders OBSERVE_TABS.** The constant is dead code — defined but never used.

**UX impact:** User clicks "Observe" in lifecycle nav → dropdown shows 3 items (Risk, Alerts, Health — from `stageServiceMap`) → user clicks one:
- Risk → lands on `/service/trading/risk` → sees TRADING_TABS (Terminal, Positions, Orders, Execution Analytics, Accounts, Markets). No "Risk Dashboard" tab highlighted.
- Alerts → lands on `/service/trading/alerts` → sees TRADING_TABS. No tab highlighted at all (Alerts is not in TRADING_TABS).
- Health → lands on `/health` → sees NO Row 2 tabs at all. Platform layout only.

**News and Strategy Health** are not even accessible from the lifecycle dropdown — they only exist in the unused OBSERVE_TABS constant.

**Recommendation:** Create `app/(platform)/service/observe/layout.tsx` that renders `ServiceTabs` with `OBSERVE_TABS`. Routes under `/service/observe/*` (news, strategy-health) will automatically inherit it. Risk and Alerts routes remain under `/service/trading/` — they need either (a) the observe layout to also apply to them via a shared mechanism, or (b) dedicated `/service/observe/risk` and `/service/observe/alerts` routes that render the same components with observe context.

---

### A2. Split context — two broken patterns

```
Task: A2
Status: ISSUE
Severity: P1-fix
```

**Finding:** The 5 Observe routes fall into two broken patterns:

**Pattern A — Wrong tabs (Routes 1-2):**

| Route | Layout | Tabs Shown | Expected Tabs |
|-------|--------|------------|---------------|
| `/service/trading/risk` | `service/trading/layout.tsx` | TRADING_TABS | OBSERVE_TABS |
| `/service/trading/alerts` | `service/trading/layout.tsx` | TRADING_TABS | OBSERVE_TABS |

These inherit the trading layout because they live under `app/(platform)/service/trading/`. The layout renders `TRADING_TABS`. There is no mechanism to switch tab bars based on the lifecycle stage the user navigated from.

**Pattern B — No tabs (Routes 3-5):**

| Route | Layout | Tabs Shown | Expected Tabs |
|-------|--------|------------|---------------|
| `/service/observe/news` | Platform only | NONE | OBSERVE_TABS |
| `/service/observe/strategy-health` | Platform only | NONE | OBSERVE_TABS |
| `/health` | Platform only | NONE | OBSERVE_TABS |

These have no service-level layout. The user sees the lifecycle nav (Row 1) and page content — but no Row 2 tabs. They are standalone pages with no tab-based navigation context.

**Recommendation:** Creating `app/(platform)/service/observe/layout.tsx` fixes Pattern B for news and strategy-health. Pattern A requires a deeper architectural decision (see F1 for the full cross-reference analysis).

---

### A3. /service/observe/ directory state

```
Task: A3
Status: ISSUE
Severity: P2-improve
```

**Finding:** Directory `app/(platform)/service/observe/` exists with two subdirectories:

```
app/(platform)/service/observe/
├── news/page.tsx          (25 lines — "Coming Soon" placeholder)
└── strategy-health/page.tsx (24 lines — "Coming Soon" placeholder)
```

**No `layout.tsx` exists** in this directory. This confirms Phase 1 finding C7 — the directory was set up for content but never wired with a layout.

**Impact:** Both pages render as standalone content under the platform layout. No Row 2 tabs, no service-level navigation, no Live/As-Of toggle. The pages are accessible by direct URL but disconnected from the Observe lifecycle context.

**Recommendation:** Add `layout.tsx` to this directory. Minimal implementation:

```tsx
"use client"
import { ServiceTabs, OBSERVE_TABS, LIVE_ASOF_VISIBLE } from "@/components/shell/service-tabs"
import { LiveAsOfToggle } from "@/components/platform/live-asof-toggle"
import { useAuth } from "@/hooks/use-auth"

export default function ObserveServiceLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return (
    <>
      <ServiceTabs
        tabs={OBSERVE_TABS}
        entitlements={user?.entitlements}
        rightSlot={LIVE_ASOF_VISIBLE.observe ? <LiveAsOfToggle /> : undefined}
      />
      {children}
    </>
  )
}
```

---

## Section B: Component Inventory

### B1. Risk Dashboard (`/service/trading/risk`)

```
Task: B1
Status: INFO
Severity: —
```

**File:** `app/(platform)/service/trading/risk/page.tsx` — **1,089 lines** (single file)

**Component structure:** Single `RiskPage` component with internal state management.

**Internal tabs (7):**

| Tab | Content |
|-----|---------|
| Risk Summary | 9 KPI cards (3x3 grid), strategy risk heatmap, highest utilization limit bars |
| VaR & Stress | Component VaR bar chart (4 methods: historical, parametric, monte carlo, filtered historical), stress test scenarios table, regime multiplier slider |
| Exposure | Exposure attribution table (23 risk types across 5 categories), strategy risk filter dropdown, exposure time series line chart |
| Greeks | Portfolio greeks summary (5 cards), per-position greeks table, greeks time series chart, second-order risks display |
| Margin | CeFi margin by venue (limit bars), SPAN margin summary (IBKR), DeFi health factor (Aave v3), health factor time series area chart, distance to liquidation table |
| Term Structure | Exposure by maturity bucket stacked bar chart (O/N through 2Y+, split by DeFi/CeFi/TradFi/Sports) |
| Limits | Full limit hierarchy (6-level: company→client→account→strategy→underlying→instrument), clickable rows with scope breadcrumb, all limits detail table sorted by utilization |

**UI components used:** `LimitBar`, `PnLValue`, `StatusBadge` (trading); `Card`, `Tabs`, `Badge`, `Button`, `Progress`, `Slider`, `ScrollArea`, `Table`, `Tooltip`, `Collapsible`, `Select` (ui); `ResponsiveContainer`, `BarChart`, `LineChart`, `AreaChart` (recharts)

**State variables:** `varMethod`, `regimeMultiplier`, `exposurePeriod`, `expandedCategories`, `riskFilterStrategy`, `selectedNode`

**Data:** All inline mock data (~350 lines of mock constants). No hooks, no API calls. Key data structures:
- `strategyRiskHeatmap` (5 entries)
- `componentVarData` (8 entries)
- `stressScenarios` (3 entries)
- `portfolioGreeks` + `positionGreeks` (3 entries) + `greeksTimeSeries` (30 entries)
- `termStructureData` (7 entries)
- `mockLimitsHierarchy` (15 entries)
- `allExposureRows` (23 entries)

**Note:** This page is shared with PROMOTE_TABS "Risk Review" — same component, same route, different lifecycle context. See F1.

---

### B2. Alerts (`/service/trading/alerts`)

```
Task: B2
Status: INFO
Severity: —
```

**File:** `app/(platform)/service/trading/alerts/page.tsx` — **378 lines**

**Component structure:** Single `AlertsPage` component.

**Features:**
- Header with critical/high count badges
- Kill Switch panel (Sheet/drawer) with scope selector (firm/client/strategy/venue), entity selector, 4 action buttons (Pause, Cancel Orders, Flatten, Disable Venue), rationale input, impact preview
- Stats row: Active Alerts, Critical, Avg Resolution, Last 24h
- Filter bar: search input, status filter, severity filter
- Alerts table with 7 mock alerts showing severity, title/description, entity, value/threshold, status, time, view button

**UI components used:** `StatusBadge` (trading); `Card`, `Badge`, `Button`, `Input`, `Select`, `Table`, `Sheet` (ui)

**State variables:** `filter` (status), `severityFilter`

**Data:** All inline mock data. `mockAlerts` array with 7 entries. Alert types: Kill Switch Armed, Feature Freshness SLA Breach, Margin Utilization Warning, Reconciliation Break, LTV Near Threshold, Order Latency Spike, Strategy Resumed.

---

### B3. News (`/service/observe/news`)

```
Task: B3
Status: ISSUE
Severity: P2-improve (placeholder page)
```

**File:** `app/(platform)/service/observe/news/page.tsx` — **25 lines**

**Component structure:** Static "Coming Soon" placeholder. No interactivity, no data, no hooks.

**Content:** Icon (Newspaper, cyan-400) + h1 "News" + "Coming Soon" badge + single Card with description text:
- "Aggregated news feed filtered by relevance to active strategies and positions"
- Planned features: real-time news stream with sentiment scoring, event impact alerts, correlation to portfolio exposure, scheduled event calendar

**No tab bar context.** Page renders directly under platform layout.

---

### B4. Strategy Health (`/service/observe/strategy-health`)

```
Task: B4
Status: PASS
Severity: —
```

**File:** `app/(platform)/service/observe/strategy-health/page.tsx` — **24 lines**

**Component structure:** Static "Coming Soon" placeholder. Same pattern as News.

**Content:** Icon (HeartPulse, emerald-400) + h1 "Strategy Health" + "Coming Soon" badge + single Card:
- "Continuous health monitoring for all live strategies"
- Planned features: per-strategy health scorecard, rolling Sharpe/drawdown charts, signal decay indicators, backtest-vs-live drift alerts, auto-pause recommendations

**Note:** Acceptable as a placeholder given the lifecycle tab is not yet wired.

---

### B5. System Health (`/health`)

```
Task: B5
Status: PASS
Severity: —
```

**File:** `app/(platform)/health/page.tsx` — **318 lines**

**Component structure:** Single `HealthPage` component.

**Internal tabs (3):**

| Tab | Content |
|-----|---------|
| Services | Service grid by tier (Critical: 4 services, Core: 3 services, Support: 3 services). Each card shows status icon, version, p50/p99 latency |
| Feature Freshness | Table with 7 entries showing service, region, freshness (seconds), SLA, status, utilization progress bar, last update |
| Dependencies | Placeholder: "Dependency DAG visualization coming soon" |

**UI components used:** `StatusBadge` (trading); `Card`, `Badge`, `Button`, `Progress`, `Tabs`, `Table` (ui)

**Data:** All inline mock data. `mockServices` (10 entries), `mockFeatureFreshness` (7 entries). Services include: execution-service, risk-and-exposure-service, pnl-attribution-service, strategy-service, features-delta-1, market-tick-data-service, ml-inference-service, alerting-service, recon-service, client-reporting-api.

---

## Section C: Navigation & Routing

### C1. Lifecycle nav entry points

```
Task: C1
Status: ISSUE
Severity: P1-fix
```

**Finding:** The Observe lifecycle dropdown is populated from `stageServiceMap` in `lib/lifecycle-mapping.ts` (lines 264-268):

| Dropdown Item | Path | Present in OBSERVE_TABS? |
|---------------|------|--------------------------|
| Risk | `/service/trading/risk` | Yes (#1) |
| Alerts | `/service/trading/alerts` | Yes (#2) |
| Health | `/health` | Yes (#5) |

**Missing from dropdown (but defined in OBSERVE_TABS):**

| OBSERVE_TABS Entry | Path | In Dropdown? | In stageServiceMap? |
|-------------------|------|-------------|---------------------|
| News | `/service/observe/news` | No | No |
| Strategy Health | `/service/observe/strategy-health` | No | No |

**Impact:** Users cannot discover News or Strategy Health pages through the lifecycle navigation. These pages are only accessible via direct URL. Even if the observe layout were created, users would have no way to navigate to these pages from the lifecycle nav.

**Recommendation:** Add news and strategy-health to `stageServiceMap.observe`:

```typescript
observe: [
  { path: "/service/trading/risk", label: "Risk", lanes: ["strategy", "execution", "capital"] },
  { path: "/service/trading/alerts", label: "Alerts", lanes: ["strategy", "execution", "ml"] },
  { path: "/service/observe/news", label: "News", lanes: ["data", "strategy"] },
  { path: "/service/observe/strategy-health", label: "Strategy Health", lanes: ["strategy", "ml"] },
  { path: "/health", label: "Health", lanes: ["data", "execution"] },
],
```

---

### C2. Stage detection for shared routes

```
Task: C2
Status: ISSUE
Severity: P2-improve
```

**Finding:** `routeMappings` in `lib/lifecycle-mapping.ts` assigns:

| Route | primaryStage | secondaryStage |
|-------|-------------|----------------|
| `/service/trading/risk` | observe | — |
| `/service/trading/alerts` | observe | — |
| `/health` | observe | — |
| `/service/observe/news` | **NOT IN routeMappings** | — |
| `/service/observe/strategy-health` | **NOT IN routeMappings** | — |

When user navigates to `/service/trading/risk`:
- Lifecycle nav correctly highlights **Observe** (because `primaryStage` is "observe")
- This is correct regardless of whether user came from the Observe dropdown or typed the URL directly

When user navigates to `/service/observe/news` or `/service/observe/strategy-health`:
- These routes have **no routeMappings entry** → lifecycle nav cannot determine the correct stage
- Lifecycle nav will not highlight any stage (or will highlight based on fallback logic)

**Recommendation:** Add routeMappings entries for the missing observe routes:

```typescript
{ path: "/service/observe/news", label: "News", primaryStage: "observe", lanes: ["data", "strategy"], requiresAuth: true },
{ path: "/service/observe/strategy-health", label: "Strategy Health", primaryStage: "observe", lanes: ["strategy", "ml"], requiresAuth: true },
```

---

### C3. Observe-internal navigation

```
Task: C3
Status: ISSUE
Severity: P1-fix
```

**Finding:** There is **no way** to navigate between the 5 Observe pages without going back to the lifecycle dropdown. This is because:

1. OBSERVE_TABS is never rendered — there is no shared tab bar connecting the 5 pages
2. None of the 5 pages contain links to the other Observe pages
3. The Risk page (1,089 lines) and Alerts page (378 lines) have no cross-links to News, Strategy Health, or Health
4. News and Strategy Health are placeholders with no links at all
5. The Health page has no links to Risk or Alerts

**UX flow today:**

```
User on Risk → wants Alerts → must: click Observe dropdown → click Alerts
User on Health → wants Risk → must: click Observe dropdown → click Risk
User on News → wants anything → must: find Observe dropdown (may not know it exists)
```

**Expected UX (with OBSERVE_TABS rendered):**

```
User on Risk → wants Alerts → clicks "Alerts" tab in Row 2
User on Health → wants Risk → clicks "Risk Dashboard" tab in Row 2
```

**Recommendation:** Creating the observe layout (A3) directly resolves this for News and Strategy Health. Risk, Alerts, and Health need the tab bar as well — either via layout reorganization or a context-aware tab rendering mechanism.

---

### C4. Cross-lifecycle links

```
Task: C4
Status: ISSUE
Severity: P2-improve
```

**Finding:** Cross-lifecycle links from Observe pages to other lifecycle stages:

| From | To | Link Exists? |
|------|----|-------------|
| Risk Dashboard → Alerts (same lifecycle) | `/service/trading/alerts` | No |
| Risk Dashboard → Trading Terminal (Run lifecycle) | `/service/trading/overview` | No |
| Alerts → Risk Dashboard (same lifecycle) | `/service/trading/risk` | No |
| Alerts → Kill Switch action → Trading context | N/A | Kill Switch is a Sheet, not navigation |
| Health → Degraded service → Service detail | No link | Clicking a service card does nothing (hover effect only) |
| Health → Grafana | External link button exists | Yes (button present, likely non-functional in demo) |

The Kill Switch panel on the Alerts page contains entity references (e.g., "BTC Basis v3") that could link to the Risk page or Strategy Health, but they are currently just labels.

**Recommendation:** Priority cross-links to add:
1. Risk Dashboard: link to Alerts when active alerts exist (the "Active Alerts: 3" KPI card)
2. Alerts: link to Risk when alert entity is a strategy or venue
3. Health: link to Alerts when service is degraded
4. Health: service card click → navigate to ops/service detail

---

## Section D: Data Wiring

### D1. Risk/Alerts data

```
Task: D1
Status: PASS
Severity: —
```

**Finding:** Both pages use **inline mock data only**. No hooks, no API calls, no data fetching.

**Risk Dashboard (`risk/page.tsx`):**
- ~350 lines of mock data constants defined at module level
- 7 mock data structures: `strategyRiskHeatmap`, `componentVarData`, `stressScenarios`, `portfolioGreeks`/`positionGreeks`/`greeksTimeSeries`, `termStructureData`, `hfTimeSeries`, `distanceToLiquidation`, `mockLimitsHierarchy`, `allExposureRows`
- All data is static — no refresh, no polling, no WebSocket
- Interactive elements (VaR method toggle, regime slider, strategy filter, hierarchy click) operate on client-side state transformations of the static data

**Alerts (`alerts/page.tsx`):**
- `mockAlerts` array with 7 entries
- Filter/search operates on client-side state
- Kill Switch panel is UI-only — actions have no backend wiring

**Assessment:** Appropriate for current demo stage. When backend APIs exist, these should migrate to React Query hooks in `hooks/api/`.

---

### D2. News data

```
Task: D2
Status: PASS
Severity: —
```

**Finding:** News page is a "Coming Soon" placeholder with **zero data**. No feeds, no API, no mocks. The page describes planned functionality:
- Real-time news stream with sentiment scoring
- Event impact alerts
- Correlation to portfolio exposure
- Scheduled event calendar

**Assessment:** Acceptable — page is correctly identified as "Coming Soon" with a description of planned features.

---

### D3. Health data

```
Task: D3
Status: INFO
Severity: —
```

**Finding:** Health page uses inline mock data:
- `mockServices` (10 entries) with service name, tier, status, latency p50/p99, error rate, uptime, version
- `mockFeatureFreshness` (7 entries) with service, freshness (seconds), SLA, region
- Dependencies tab is a placeholder: "Dependency DAG visualization coming soon"

Service data models are well-structured with `ServiceStatus` type (`healthy | degraded | unhealthy | idle`) and `FeatureFreshness` interface. The freshness status calculation (`getFreshnessStatus`) correctly computes SLA ratio.

**Note:** The service list (execution-service, risk-and-exposure-service, pnl-attribution-service, strategy-service, features-delta-1, market-tick-data-service, ml-inference-service, alerting-service, recon-service, client-reporting-api) is reasonably representative of the real backend service topology.

---

## Section E: UX Audit

### E1. Loading/error/empty states

```
Task: E1
Status: ISSUE
Severity: P2-improve
```

**Finding:**

| Page | Loading State | Error State | Empty State |
|------|--------------|-------------|-------------|
| Risk Dashboard | None | None | N/A (always has mock data) |
| Alerts | None | None | Table shows all rows (no "no alerts" message) |
| News | N/A (placeholder) | N/A | N/A |
| Strategy Health | N/A (placeholder) | N/A | N/A |
| System Health | None | None | N/A (always has mock data) |

None of the 3 implemented pages (Risk, Alerts, Health) have:
- Loading skeletons or spinners
- Error boundaries or error states
- Empty state messages (e.g., "No active alerts" when filter returns zero results)

The Alerts page does filter, but when all alerts are filtered out, the table simply shows no rows with no visual feedback.

**Recommendation:** Before connecting to real APIs, add:
1. `Skeleton` components for loading states
2. `ErrorBoundary` wrapper with retry button
3. Empty state component: "No alerts match your filters" / "All services healthy" etc.

---

### E2. Monitoring workflow

```
Task: E2
Status: ISSUE
Severity: P3-cosmetic
```

**Finding:** There is **no logical monitoring workflow** connecting the 5 Observe pages. Each page is an isolated view:

```
System Health ──?──> Risk Dashboard ──?──> Alerts ──?──> News
     │                    │                  │            │
     └────── No links between pages ─────────┴────────────┘
```

An ideal monitoring workflow would be:
1. **Health** — are all services running? → click degraded service → see impact
2. **Risk** — are limits breached? → click breached limit → see alert
3. **Alerts** — what needs action? → click alert entity → see risk context
4. **News** — any external events affecting positions?
5. **Strategy Health** — are live strategies performing within bounds?

Currently, each page is self-contained with no drill-through or linking between them.

**Recommendation:** This is a UX enhancement for post-layout-fix work. The tab bar (once wired) provides basic navigation. Deep linking and drill-through can be added incrementally.

---

### E3. Responsive behavior

```
Task: E3
Status: ISSUE
Severity: P3-cosmetic
```

**Finding:**

| Page | Mobile Behavior | Notes |
|------|----------------|-------|
| Risk Dashboard | 3-column grid → no responsive breakpoint | 3x3 KPI grid, 5-column Greeks grid, 2-column margin grid — none have responsive classes. Charts are `ResponsiveContainer` (recharts) which adapts width but not layout. |
| Alerts | 4-column stats → no responsive breakpoint | Stats row uses `grid-cols-4`. Kill Switch Sheet has `w-[400px] sm:w-[540px]` — only responsive element. |
| News | Single column | Works at all widths (simple Card layout) |
| Strategy Health | Single column | Works at all widths (simple Card layout) |
| Health | 4-column stats, 2/4-column service grid | Service grid uses `grid-cols-2 lg:grid-cols-4` — responsive. Stats row uses `grid-cols-4` — not responsive. |

**Summary:**
- News and Strategy Health: responsive (trivial — single card)
- Health: partially responsive (service grid adapts, stats don't)
- Risk Dashboard: not responsive (hard-coded grid layouts for desktop)
- Alerts: not responsive (hard-coded stats grid)

**Recommendation:** Low priority. These are operational dashboards primarily used on desktop. Add `sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3` breakpoints to Risk and Alerts grids when addressing broader responsive requirements.

---

### E4. Live/As-Of toggle

```
Task: E4
Status: ISSUE
Severity: P2-improve
```

**Finding:** `LIVE_ASOF_VISIBLE` in `components/shell/service-tabs.tsx` maps `observe: true`, meaning the Observe lifecycle stage should show a Live/As-Of toggle.

However:

1. **OBSERVE_TABS is never rendered** → the toggle has no host component to appear in
2. Routes 1-2 (`/service/trading/risk`, `/service/trading/alerts`) use the **trading layout**, which renders: `rightSlot={LIVE_ASOF_VISIBLE.run ? <LiveAsOfToggle /> : undefined}`. This checks `LIVE_ASOF_VISIBLE.run` (true), so the toggle IS shown — but in the **Run** context, not Observe.
3. Routes 3-5 have **no layout** → no toggle shown at all

**Result:** The Live/As-Of toggle is orphaned for Observe:
- It shows on Risk/Alerts pages, but as part of the trading (Run) layout — the toggle state would affect Run-context behavior, not Observe
- It does not show on News, Strategy Health, or Health pages
- `LIVE_ASOF_VISIBLE.observe = true` is dead configuration

**Recommendation:** Creating the observe layout (A3) should include `rightSlot={LIVE_ASOF_VISIBLE.observe ? <LiveAsOfToggle /> : undefined}`, which brings the toggle to News and Strategy Health. Risk/Alerts need the observe layout to show the correct toggle context.

---

## Section F: Cross-Reference Markers

### F1. /service/trading/risk triple ownership

```
Task: F1
Status: ISSUE
Severity: P1-fix
```

**Finding:** `/service/trading/risk` appears in three lifecycle contexts:

| Context | Tab Set | Label | Rendered? |
|---------|---------|-------|-----------|
| Promote | PROMOTE_TABS | "Risk Review" | No (no promote layout) |
| Observe | OBSERVE_TABS | "Risk Dashboard" | No (no observe layout) |
| Run (actual) | TRADING_TABS | — (not listed) | Yes (trading layout) |

The `routeMappings` entry sets `primaryStage: "observe"`, so lifecycle nav always highlights Observe regardless of navigation source.

**UX impact matrix:**

| User navigates from | Lifecycle highlights | Row 2 tabs | Risk tab active? | Correct? |
|---------------------|---------------------|------------|------------------|----------|
| Observe dropdown | Observe | TRADING_TABS | No (not in TRADING_TABS) | Wrong tabs |
| Promote dropdown | Observe (not Promote) | TRADING_TABS | No | Wrong highlight + wrong tabs |
| Direct URL | Observe | TRADING_TABS | No | Wrong tabs |
| Trading context | Observe (not Run) | TRADING_TABS | No | Wrong highlight |

**Every navigation path produces an incorrect UX.** The page always shows TRADING_TABS (because it's under the trading layout), but the page is not a TRADING_TAB entry, so no tab is ever highlighted.

**Recommendation (architectural options ranked):**

1. **Option A — Separate routes, shared component:** Create `/service/observe/risk`, `/service/promote/risk-review`, and keep `/service/trading/risk`. Each layout renders its own tab set. Risk component is imported by all three pages. Most correct UX, most files.

2. **Option B — Context-aware layout:** Query param `?context=observe|promote|run` → the trading layout reads it and renders the appropriate tab set. Fewer files, but requires layout refactoring.

3. **Option C — Observe layout only:** Create observe layout. Accept that Risk shows trading tabs when accessed from Run, and observe tabs when accessed from Observe. Promote remains broken. Partial fix.

---

### F2. /service/trading/alerts — invisible in TRADING_TABS

```
Task: F2
Status: ISSUE
Severity: P1-fix
```

**Finding:** Alerts page is under the trading layout (`app/(platform)/service/trading/alerts/page.tsx`) and thus inherits TRADING_TABS:

```
TRADING_TABS = [
  Terminal, Positions, Orders, Execution Analytics, Accounts, Markets
]
```

"Alerts" is NOT in this list. When a user navigates to the Alerts page:
- Row 2 shows TRADING_TABS
- No tab is highlighted
- The user has no visual indication of where they are within the tab navigation
- The only way to reach this page is via the Observe lifecycle dropdown or direct URL

**Impact:**
- User confusion: "I'm on the Alerts page but the tab bar shows Trading tabs with none selected"
- Navigation dead-end: no way to get back to other Observe pages via tabs
- The page effectively "belongs" to Observe but "lives" in the trading filesystem

**Recommendation (two options):**

1. **Add "Alerts" to TRADING_TABS:** Quick fix, but semantically wrong — Alerts is a monitoring (Observe) concept, not a trading (Run) concept.

2. **Create observe layout and move route:** Move `/service/trading/alerts` → `/service/observe/alerts` (with redirect from old URL). The observe layout renders OBSERVE_TABS with "Alerts" highlighted. This is the correct fix.

---

### F3. Observe pages with no tab context

```
Task: F3
Status: ISSUE
Severity: P2-improve
```

**Finding:** Three Observe pages have no Row 2 tabs at all:

| Page | Route | Layout | Row 2 Tabs |
|------|-------|--------|-----------|
| News | `/service/observe/news` | Platform only | NONE |
| Strategy Health | `/service/observe/strategy-health` | Platform only | NONE |
| System Health | `/health` | Platform only | NONE |

**UX assessment:**

- **News and Strategy Health:** These are "Coming Soon" placeholders. The lack of tabs is acceptable for now but should be fixed when the observe layout is created (A3). Once the layout exists, they will automatically get OBSERVE_TABS.

- **System Health (`/health`):** This is a fully implemented page (318 lines) with 3 internal tabs. It sits at `/health` (top-level under platform), not under `/service/observe/`. Even if an observe layout is created at `/service/observe/layout.tsx`, the Health page at `/health` would NOT inherit it.

**Options for `/health`:**
1. Move to `/service/observe/health` and let it inherit the observe layout
2. Keep at `/health` and accept it has no Row 2 tabs (it functions well as a standalone page)
3. Add a separate health layout at `app/(platform)/health/layout.tsx` that renders OBSERVE_TABS

**Recommendation:** Option 1 (move to `/service/observe/health`) provides the best UX consistency. Add a redirect from `/health` → `/service/observe/health` for backward compatibility. Update `stageServiceMap` and `routeMappings` accordingly.

---

## Consolidated Issue Registry

| ID | Severity | Summary | Fix Complexity |
|----|----------|---------|----------------|
| A1 | P1-fix | OBSERVE_TABS never rendered — dead code, no observe layout exists | Medium — create layout.tsx |
| A2 | P1-fix | Split context: risk/alerts show wrong tabs; news/strategy-health/health show no tabs | Medium — requires layout + route decisions |
| C1 | P1-fix | News and Strategy Health missing from lifecycle dropdown (stageServiceMap) | Low — add 2 entries |
| C3 | P1-fix | No inter-page navigation within Observe lifecycle | Medium — blocked by A1 |
| F1 | P1-fix | Risk page has triple lifecycle ownership with wrong tabs and highlight in every path | High — architectural decision needed |
| F2 | P1-fix | Alerts page shows TRADING_TABS with no tab highlighted | Medium — route move or tab addition |
| A3 | P2-improve | /service/observe/ directory has no layout.tsx | Low — create file |
| C2 | P2-improve | News and Strategy Health missing from routeMappings — no stage detection | Low — add 2 entries |
| C4 | P2-improve | No cross-lifecycle links between Observe pages | Low — add href props |
| E1 | P2-improve | No loading/error/empty states on any implemented page | Medium — add states before API wiring |
| E4 | P2-improve | Live/As-Of toggle orphaned — LIVE_ASOF_VISIBLE.observe is dead config | Low — resolved by observe layout |
| F3 | P2-improve | 3 pages have no Row 2 tabs; /health needs route decision | Medium — route move for /health |
| E2 | P3-cosmetic | No logical monitoring workflow connecting the 5 pages | Low — add after layout fix |
| E3 | P3-cosmetic | Risk and Alerts pages not responsive for mobile/tablet | Low — add breakpoint classes |

---

## Recommended Fix Order

1. **Add missing routeMappings and stageServiceMap entries** (C1, C2) — Low effort, immediate improvement to lifecycle nav
2. **Create observe layout** (A1, A3) — Fixes tab rendering for news and strategy-health
3. **Decide route architecture for shared routes** (F1, F2, A2) — Architectural decision required before implementation
4. **Move /health to /service/observe/health** (F3) — Dependent on observe layout
5. **Add loading/error/empty states** (E1) — Independent, can be done in parallel
6. **Add cross-lifecycle links** (C4, E2) — Polish after structure is correct
7. **Responsive improvements** (E3) — Lowest priority

---

## Related Documents

- **[OBSERVE_TAB_COMPONENT_ALIGNMENT.md](./OBSERVE_TAB_COMPONENT_ALIGNMENT.md)** — Supplement: component alignment assessment, two-tab-layer analysis, OBSERVE_TABS redesign recommendation, and tab consolidation migration path. Written after product owner clarified that Observe covers system-wide observation (execution health, deployments, hardware, latency, all services).

## Feeds Into

- **Phase 3 cross-reference audit:** F1 (triple ownership), F2 (alerts context), F3 (no-tab pages), C4 (cross-lifecycle links)
- **Phase 2 sibling audits:** F1 and F2 are shared with the Run tab audit (risk/alerts live under trading layout)
