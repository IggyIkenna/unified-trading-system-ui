# Phase 2c: Promote Lifecycle Tab — Deep Audit Results

**Audit date:** 2026-03-21
**Repo:** unified-trading-system-ui
**Plan:** `unified-trading-pm/plans/active/ui_phase2_promote_tab_audit_2026_03_21.plan.md`
**Depends on:** Phase 1 findings (A3, B1–B3, C6, SR1, SR4, Gap4, C4)
**Companion:** `PROMOTE_WORKFLOW_UX_ASSESSMENT.md` — evaluates whether the components facilitate the actual promote workflow (candidate review → testnet → backtest-vs-live comparison → approval → live promotion)

---

## Executive Summary

| Category | Tasks | PASS | ISSUE | INFO |
|----------|-------|------|-------|------|
| A. Structural | 3 | 0 | 3 | 0 |
| B. Component Inventory | 4 | 0 | 0 | 4 |
| C. Navigation & Routing | 4 | 1 | 3 | 0 |
| D. Data Wiring | 3 | 0 | 0 | 3 |
| E. UX Audit | 4 | 1 | 2 | 1 |
| F. Cross-Reference | 2 | 0 | 2 | 0 |
| G. Recommendations | 2 | 0 | 0 | 2 |
| **Total** | **22** | **2** | **10** | **10** |

**Severity breakdown:**

| Severity | Count | Items |
|----------|-------|-------|
| P0-blocking | 0 | — |
| P1-fix | 5 | A1, A3, C2, C4, F1 |
| P2-improve | 5 | A2, C3, E2, E4, F2 |
| P3-cosmetic | 0 | — |
| INFO | 10 | B1–B4, D1–D3, E1, E3, G1–G2 |

---

## A. Structural Issues

### A1. No layout renders PROMOTE_TABS

```
Task: A1
Status: ISSUE
Severity: P1-fix
```

**Confirmed:** `PROMOTE_TABS` is defined in `components/shell/service-tabs.tsx` (lines 108–113) but is never imported by any layout, component, or page in the codebase. Only `service-tabs.tsx` itself contains the symbol; all other references are in `docs/phase1/` audit documentation.

**PROMOTE_TABS definition:**

```typescript
export const PROMOTE_TABS: ServiceTab[] = [
  { label: "Review Queue", href: "/service/research/strategy/candidates" },
  { label: "Execution Analysis", href: "/service/research/execution/tca" },
  { label: "Risk Review", href: "/service/trading/risk" },
  { label: "Approval Status", href: "/service/research/strategy/handoff" },
]
```

**No tabs have `requiredEntitlement` set — all are open.**

**Exact user experience:**

1. User clicks "Promote" in lifecycle nav dropdown
2. Dropdown shows single entry: "Strategy Candidates" (from `stageServiceMap.promote`)
3. User clicks → navigates to `/service/research/strategy/candidates`
4. Page renders under `app/(platform)/service/research/layout.tsx` which imports `BUILD_TABS`
5. **Row 2 tabs shown:** Research Hub | Features | ML Models | Strategies | Backtests | Signals | Execution Research
6. **Row 2 tabs expected:** Review Queue | Execution Analysis | Risk Review | Approval Status
7. User has no visual indication they are in the "Promote" lifecycle stage via Row 2 tabs
8. Lifecycle nav (Row 1) correctly highlights Promote (routeMappings primaryStage: "promote")

**Recommendation:** Create a promote-aware layout mechanism. See G1/G2 for options.

---

### A2. Tab context mismatch

```
Task: A2
Status: ISSUE
Severity: P2-improve
```

When a user navigates to `/service/research/strategy/candidates` via the Promote lifecycle dropdown:

- **Row 1 (lifecycle nav):** Correctly highlights "Promote" with amber color
- **Row 2 (service tabs):** Shows BUILD_TABS — "Research Hub", "Features", "ML Models", "Strategies", "Backtests", "Signals", "Execution Research"
- **Page heading:** "Promotion Pipeline" — clearly promote-oriented
- **Cognitive dissonance:** The page title says "Promotion Pipeline" but the tab bar context is "Build/Research"

The user sees conflicting signals: the lifecycle nav says Promote, the tab bar says Build, and the page content says Promotion. There is no visual bridge between the Promote lifecycle stage and the page's actual tab navigation context.

Additionally, the candidates page's "Promote to Paper" and "Promote to Live" buttons suggest forward-looking actions (the whole point of the Promote stage), but the surrounding navigation context (BUILD_TABS) suggests they're still in the research/build phase.

**Recommendation:** At minimum, add a contextual breadcrumb or stage indicator on the page itself. Ideally, render PROMOTE_TABS.

---

### A3. Split layout problem

```
Task: A3
Status: ISSUE
Severity: P1-fix
```

The 4 PROMOTE_TABS routes span two different layouts:

| Route | Layout File | Tab Set Shown | Parent Route Group |
|-------|-------------|---------------|-------------------|
| `/service/research/strategy/candidates` | `service/research/layout.tsx` | BUILD_TABS | research |
| `/service/research/execution/tca` | `service/research/layout.tsx` | BUILD_TABS | research |
| `/service/research/strategy/handoff` | `service/research/layout.tsx` | BUILD_TABS | research |
| `/service/trading/risk` | `service/trading/layout.tsx` | TRADING_TABS | trading |

**Impact if PROMOTE_TABS were rendered via tab-clicking:**

A user clicking through the 4 Promote tabs (if they were rendered) would experience:

1. Click "Review Queue" → research layout → BUILD_TABS context
2. Click "Execution Analysis" → research layout → BUILD_TABS context (same layout, no switch)
3. Click "Risk Review" → **trading layout** → TRADING_TABS context — **abrupt layout switch**
4. Click "Approval Status" → **research layout** → BUILD_TABS context — **another layout switch back**

This creates a jarring experience with two layout switches in a 4-tab journey. The tab bar itself would flicker between BUILD_TABS and TRADING_TABS (or whatever tabs the layout renders) despite the intent being a single PROMOTE_TABS set.

**Phase 1 confirmed:** SR1 documented that clicking Risk Review from Promote causes a layout switch from research→trading, which is jarring.

**Recommendation:** A dedicated promote layout (G1) or contextual tab switching (G2) is required to prevent the layout-switching problem.

---

## B. Component Inventory

### B1. Review Queue page (`/service/research/strategy/candidates`)

```
Task: B1
Status: INFO
Severity: —
```

**File:** `app/(platform)/service/research/strategy/candidates/page.tsx` (488 lines)

| Attribute | Value |
|-----------|-------|
| Directive | `"use client"` |
| Page component | `CandidatesPage` |
| Heading | "Promotion Pipeline" |
| Sub-navigation | None (no StrategyPlatformNav or ExecutionNav) |

**Imports:**

| Category | Components |
|----------|------------|
| UI primitives | Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow |
| Icons | ArrowRight, CheckCircle2, Clock, MessageSquare, Rocket, Shield, Target, XCircle |
| Data | `STRATEGY_CANDIDATES`, `BACKTEST_RUNS` from `@/lib/strategy-platform-mock-data` |
| Types | `StrategyCandidate` from `@/lib/strategy-platform-types` |

**Local state:**

| State var | Type | Purpose |
|-----------|------|---------|
| `candidates` | `StrategyCandidate[]` | List of strategy candidates (init from mock) |
| `promotionTargets` | `Record<string, "paper" \| "live" \| null>` | Track promotion targets per candidate |
| `commentDialog` | `string \| null` | Dialog open state for review comments |
| `commentText` | `string` | Comment input text |

**Key features:**

- Approval workflow visualization (Pending → In Review → Approved → Promoted)
- Promote to Paper / Promote to Live actions
- Reject action
- Review comment dialog
- Metrics display (Sharpe, Return, Max DD, Sortino, Hit Rate, Profit Factor)
- Pending vs Resolved section split
- Empty state card ("No candidates in the pipeline")

---

### B2. Execution Analysis page (`/service/research/execution/tca`)

```
Task: B2
Status: INFO
Severity: —
```

**File:** `app/(platform)/service/research/execution/tca/page.tsx` (407 lines)

| Attribute | Value |
|-----------|-------|
| Directive | `"use client"` |
| Page component | `ExecutionTCAPage` |
| Heading | "TCA Explorer" |
| Sub-navigation | `ExecutionNav` (from `@/components/execution-platform/execution-nav`) |

**Note:** routeMappings maps this route to `primaryStage: "observe"`, **not** `"promote"`. PROMOTE_TABS includes it as "Execution Analysis" but the lifecycle mapping says this page belongs to Observe.

**Imports:**

| Category | Components |
|----------|------------|
| UI primitives | Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs (imported but unused) |
| Charts | LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell (Recharts) |
| Icons | LineChartIcon, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, BarChart3, Clock, Target, DollarSign |
| Data | `MOCK_RECENT_ORDERS` from `@/lib/execution-platform-mock-data` |
| Utils | `cn` from `@/lib/utils` |

**Inline mock data:**

| Constant | Purpose |
|----------|---------|
| `TCA_BREAKDOWN` | Transaction cost breakdown (4 items: Spread, Impact, Timing, Fees) |
| `EXECUTION_TIMELINE` | 20 data points of price/VWAP/TWAP evolution |
| `SLIPPAGE_DISTRIBUTION` | 6-bucket slippage histogram |

**Key features:**

- Summary stats (Total Cost, Slippage, Market Impact, Timing Cost, Arrival Price)
- Execution Timeline chart (price vs VWAP vs TWAP)
- Cost breakdown bar
- Benchmark comparison (vs Arrival, VWAP, TWAP, Implementation Shortfall)
- Slippage distribution histogram
- Recent orders table with per-order TCA drill-down

---

### B3. Risk Review page (`/service/trading/risk`)

```
Task: B3
Status: INFO
Severity: —
```

**File:** `app/(platform)/service/trading/risk/page.tsx` (1071+ lines)

| Attribute | Value |
|-----------|-------|
| Directive | `"use client"` |
| Page component | `RiskDashboardPage` |
| Heading | Not explicit (tab-driven layout) |
| Sub-navigation | None |

**This page is SHARED with OBSERVE_TABS "Risk Dashboard". It appears as "Risk Review" in PROMOTE_TABS and "Risk Dashboard" in OBSERVE_TABS. The page renders identically regardless of navigation source.**

**Imports:**

| Category | Components |
|----------|------------|
| Domain components | LimitBar, PnLValue, StatusBadge (from `@/components/trading/`) |
| UI primitives | Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Button, Progress, Slider, ScrollArea, Table/*, Tooltip/*, Collapsible, Select/* |
| Charts | ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip (Recharts), Legend, LineChart, Line, Area, AreaChart, Cell, ReferenceLine |
| Icons | Shield, TrendingUp, Wallet, AlertTriangle, BarChart3, LineChart, Activity, Clock, Zap, ChevronDown, ChevronRight, Info, Target, X |
| Utils | `cn` |

**Inline mock data (extensive — ~400 lines):**

| Constant | Purpose |
|----------|---------|
| `strategyRiskHeatmap` | Strategy-level risk metrics |
| `componentVarData` | VaR by component |
| `stressScenarios` | Stress test results |
| `portfolioGreeks` | Portfolio-level Greeks |
| `positionGreeks` | Per-position Greeks |
| `greeksTimeSeries` | Greeks evolution over time |
| `secondOrderRisks` | Second-order risk metrics |
| `termStructureData` | Rate term structure |
| `hfTimeSeries` | High-frequency time series |
| `distanceToLiquidation` | Liquidation distance by asset |
| `mockLimitsHierarchy` | Risk limit hierarchy (nested) |
| `allExposureRows` | Exposure breakdown by strategy |
| `exposureTimeSeries` | Exposure evolution |
| `MOCK_STRATEGIES` | Strategy list for filtering |

**Key features:**

- 7-tab internal layout: Overview | Limits | Exposure | Greeks | HF Monitoring | Stress | Heatmap
- Strategy risk heatmap
- VaR breakdown chart
- Stress scenario table
- Portfolio and position Greeks
- High-frequency monitoring
- Limits hierarchy (collapsible tree)
- Exposure analysis with time series

**This is the largest page of the 4 at 1071+ lines and contains the most complex data visualization.**

---

### B4. Approval Status page (`/service/research/strategy/handoff`)

```
Task: B4
Status: INFO
Severity: —
```

**File:** `app/(platform)/service/research/strategy/handoff/page.tsx` (405 lines)

| Attribute | Value |
|-----------|-------|
| Directive | `"use client"` |
| Page component | `StrategyHandoffPage` |
| Heading | "Promotion Handoff" |
| Sub-navigation | `StrategyPlatformNav` (from `@/components/strategy-platform/strategy-nav`) |

**Imports:**

| Category | Components |
|----------|------------|
| UI primitives | Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Separator, Textarea, Switch, Label, Alert, AlertDescription, AlertTitle |
| Icons | Send, CheckCircle2, AlertTriangle, ArrowRight, FileJson, GitBranch, Shield, Clock, User, MessageSquare, Rocket, Copy, ExternalLink |
| Utils | `cn` |

**Inline mock data:**

| Constant | Purpose |
|----------|---------|
| `HANDOFF_CANDIDATE` | Full handoff candidate with strategy info, metrics, champion comparison, config diff, risk checks, approval chain |

**Key features:**

- Strategy summary (ID, version, source backtest/experiment)
- Key metrics vs champion comparison (Sharpe, Returns, Max DD, Win Rate)
- Config diff table (parameter changes from champion)
- Risk validation checks (VaR, drawdown, concentration, correlation, backtest period)
- Approval chain (Quant Lead, Risk Manager, CTO)
- Deployment options (Shadow Trading, Auto-Rollback, Gradual Rollout toggles)
- Promotion notes (textarea)
- Action buttons (Promote to Live, Request Approval, Return to Candidates)
- Conditional alert: "Ready for Promotion" vs "Pending Items"

---

## C. Navigation & Routing

### C1. Lifecycle nav entry point

```
Task: C1
Status: PASS
Severity: —
```

`stageServiceMap.promote` has one entry:

```typescript
promote: [
  { path: "/service/research/strategy/candidates", label: "Strategy Candidates",
    lanes: ["strategy"], description: "Review and promote winning strategies" },
],
```

**Verification:** Clicking Promote in the lifecycle dropdown shows "Strategy Candidates" as the only link. Clicking it navigates to `/service/research/strategy/candidates`.

The lifecycle nav (Row 1) correctly highlights "Promote" because `routeMappings` maps this path to `primaryStage: "promote"`.

---

### C2. Lifecycle nav stage detection

```
Task: C2
Status: ISSUE
Severity: P1-fix
```

**routeMappings for the 4 Promote routes:**

| Route | primaryStage | secondaryStage | Lifecycle highlight |
|-------|-------------|----------------|---------------------|
| `/service/research/strategy/candidates` | **promote** | — | Promote (correct) |
| `/service/research/execution/tca` | **observe** | — | **Observe** (wrong for Promote context) |
| `/service/trading/risk` | **observe** | — | **Observe** (wrong for Promote context) |
| `/service/research/strategy/handoff` | **promote** | — | Promote (correct) |

**Impact:** 2 of 4 Promote routes cause the lifecycle nav to highlight "Observe" instead of "Promote":

1. When a user navigates to "Execution Analysis" (TCA) from the Promote context → lifecycle nav highlights **Observe**, not Promote
2. When a user navigates to "Risk Review" from the Promote context → lifecycle nav highlights **Observe**, not Promote

**Phase 1 confirmed:** SR1 documented that `/service/trading/risk` navigation from Promote highlights Observe. SR4 confirmed `/service/research/execution/tca` has primaryStage "observe" not "promote".

**Root cause:** `getRouteMapping()` returns a single `primaryStage` per path — there is no concept of "I navigated here from Promote." The mapping is static and path-based.

**Recommendation:** Either add `secondaryStage: "promote"` to both routes, or implement query-parameter-based context passing (`?stage=promote`).

---

### C3. Cross-tab navigation

```
Task: C3
Status: ISSUE
Severity: P2-improve
```

**From the Review Queue (candidates) page, can a user reach the other 3 Promote routes?**

| Target route | Reachable from candidates page? | Method |
|-------------|-------------------------------|--------|
| Execution Analysis (TCA) | No direct link | Lifecycle dropdown only or direct URL |
| Risk Review (risk) | No direct link | Lifecycle dropdown only or direct URL |
| Approval Status (handoff) | Indirect — "Return to Candidates" button exists on handoff page, but no forward link from candidates→handoff | Direct URL only |

**Finding:** The 4 Promote pages are isolated from each other. There is no in-page navigation flow connecting them. Each page has its own sub-navigation component (or none):

- Candidates: No sub-nav
- TCA: `ExecutionNav` (links to execution platform pages, not other Promote pages)
- Risk: No sub-nav
- Handoff: `StrategyPlatformNav` (links to strategy platform pages, not other Promote pages)

The only way to move between Promote pages is via the lifecycle dropdown (which only lists "Strategy Candidates") or direct URL entry.

**Recommendation:** If PROMOTE_TABS were rendered in Row 2, this would be solved. Without that, consider adding explicit cross-links between the Promote pages (e.g., "Review Queue → Execution Analysis → Risk Review → Approval Status" flow).

---

### C4. Dead navigation paths

```
Task: C4
Status: ISSUE
Severity: P1-fix
```

**Phase 1 confirmed (C4):** Since PROMOTE_TABS never renders, there is no Row 2 tab bar for Promote.

**Reachability analysis:**

| Route | Via lifecycle dropdown | Via Row 2 tabs | Via in-page link | Via direct URL |
|-------|----------------------|---------------|-----------------|----------------|
| candidates | Yes (promote dropdown) | No | No | Yes |
| TCA | No (not in promote dropdown; in observe dropdown as "TCA") | Via BUILD_TABS "Execution Research" → then sub-nav? No — ExecutionNav on TCA page links within execution, not to TCA directly | No | Yes |
| risk | No (not in promote dropdown; in observe dropdown as "Risk") | Via TRADING_TABS when on trading pages | No | Yes |
| handoff | No (not in promote dropdown) | No | No | Yes |

**Key finding:** Of the 4 Promote pages, only **candidates** is reachable via the Promote lifecycle dropdown. The other 3 are reachable via Observe dropdown or other tab contexts, but **never** in a Promote context:

- TCA: reachable via Observe → "TCA" or via Build → Execution Research → ExecutionNav
- Risk: reachable via Observe → "Risk" or via Run → TRADING_TABS context
- Handoff: **only reachable via direct URL** — it appears in no dropdown and no tab set that is currently rendered

**Handoff is the most isolated page in the Promote set — completely undiscoverable through navigation.**

---

## D. Data Wiring

### D1. Strategy candidates data

```
Task: D1
Status: INFO
Severity: —
```

| Aspect | Value |
|--------|-------|
| Data source | Mock: `STRATEGY_CANDIDATES` + `BACKTEST_RUNS` from `@/lib/strategy-platform-mock-data` |
| Hook | None — direct import, initialized via `useState` |
| Real API | None |
| Schema validation | None — mock data shape matches `StrategyCandidate` type |

**Mock data structure:**

- `STRATEGY_CANDIDATES`: Array of `StrategyCandidate` with `id`, `configId`, `configVersion`, `backtestRunId`, `metricsSnapshot` (sharpe, totalReturn, maxDrawdown, sortino, hitRate, profitFactor), `reviewState`, `reviewComments`, `selectedBy`, `selectedAt`, `rationale`
- `BACKTEST_RUNS`: Array of backtest runs with `id`, `templateName` (used for display label)

**State mutations:** Promote/reject/comment actions mutate local state only — no API calls.

---

### D2. TCA data

```
Task: D2
Status: INFO
Severity: —
```

| Aspect | Value |
|--------|-------|
| Data source | Mixed: `MOCK_RECENT_ORDERS` from `@/lib/execution-platform-mock-data` + 3 inline mocks |
| Hook | None — direct import + inline constants |
| Real API | None |

**Data sources breakdown:**

| Data | Source | Type |
|------|--------|------|
| Recent orders | `@/lib/execution-platform-mock-data` (shared mock module) | External mock |
| TCA breakdown | Inline `TCA_BREAKDOWN` constant | Hardcoded |
| Execution timeline | Inline `EXECUTION_TIMELINE` (generated with `Math.random()`) | Hardcoded/random |
| Slippage distribution | Inline `SLIPPAGE_DISTRIBUTION` constant | Hardcoded |

**Note:** The execution timeline uses `Math.random()` — values change on every render/hot-reload, which may confuse during demos.

---

### D3. Strategy handoff data

```
Task: D3
Status: INFO
Severity: —
```

| Aspect | Value |
|--------|-------|
| Data source | Inline mock: `HANDOFF_CANDIDATE` constant |
| Hook | None |
| Real API | None |

**`HANDOFF_CANDIDATE` structure:** Single object with strategy info, metrics, champion comparison, config diff (5 parameter changes), risk checks (5 pass/fail), and approval chain (3 approvers).

**State mutations:** Toggle switches (shadow trading, auto-rollback, gradual rollout) and notes textarea are local state only — no API calls. The "Promote to Live" button is disabled until all approvals are complete (which they never are in mock data since Risk Manager and CTO are pending).

---

## E. UX Audit

### E1. Loading/error/empty states

```
Task: E1
Status: INFO
Severity: —
```

| Page | Loading state | Error state | Empty state |
|------|--------------|-------------|-------------|
| Candidates | None | None | Yes — "No candidates in the pipeline" card with icon and guidance text |
| TCA | None | None | None — always shows data (mock orders always populated) |
| Risk | None | None | None — always shows data (all mock data inline) |
| Handoff | None | None | None — always shows single candidate |

**Finding:** Only the Candidates page has a proper empty state. None of the 4 pages have loading spinners or error boundaries. When real APIs are integrated, all pages will need loading/error states.

The Handoff page has a conditional alert ("Ready for Promotion" vs "Pending Items") which serves as a partial status indicator, but this is business-logic state, not data-loading state.

---

### E2. Promote workflow UX

```
Task: E2
Status: ISSUE
Severity: P2-improve
```

**Is there a clear flow from Review Queue → Risk Review → Approval?**

**No.** The 4 Promote pages are completely isolated with no workflow connections:

| Step | Expected workflow | Actual UX |
|------|-------------------|-----------|
| 1. Review candidates | Candidates page shows list → user reviews metrics | Works (mock data) |
| 2. Analyze execution costs | Click "Execution Analysis" → see TCA | **No link from candidates → TCA. Must use direct URL.** |
| 3. Review risk | Click "Risk Review" → see risk dashboard | **No link from TCA → Risk. Must use direct URL. Layout switches from research→trading.** |
| 4. Approve and handoff | Click "Approval Status" → approve/reject | **No link from Risk → Handoff. Must use direct URL. Handoff page is completely undiscoverable.** |

**Cross-page workflow elements:**

- Candidates page has "Promote to Paper" / "Promote to Live" buttons but no "Send to Risk Review" or "Analyze Execution" actions
- TCA page has no "Send to Risk" or "Back to Candidates" actions
- Risk page has no "Approve for Handoff" or "Back to TCA" actions
- Handoff page has "Return to Candidates" button text but it's not wired to navigate (just a Button with no onClick)

**Recommendation:** Add a workflow stepper or breadcrumb trail connecting the 4 pages in sequence. Handoff's "Return to Candidates" button should navigate via `router.push`.

---

### E3. Responsive behavior

```
Task: E3
Status: PASS
Severity: —
```

| Page | Max width | Grid system | Responsive elements |
|------|-----------|-------------|---------------------|
| Candidates | `max-w-7xl` (1280px) | `grid-cols-6` for metrics | Card-based layout flows naturally on narrow screens |
| TCA | `max-w-[1800px]` | `grid-cols-5`, `grid-cols-3` | `ResponsiveContainer` for all charts |
| Risk | `max-w-[1600px]` | `grid-cols-7` (tab list), various grids | `lg:w-auto lg:grid-cols-none lg:flex` for tab list, `ResponsiveContainer` for charts |
| Handoff | `max-w-[1800px]` | `grid-cols-3` with `col-span-2` | Two-column layout (approval panel on right) |

**Finding:** All pages use Tailwind grid layouts that will stack on small screens. The Risk page has the most explicit responsive handling with `lg:` breakpoints for the 7-tab list. None use `useMobile()` hook for conditional rendering.

No major responsive issues at standard breakpoints.

---

### E4. Live/As-Of toggle

```
Task: E4
Status: ISSUE
Severity: P2-improve
```

**`LIVE_ASOF_VISIBLE` config:**

```typescript
export const LIVE_ASOF_VISIBLE: Record<string, boolean> = {
  acquire: true,
  build: true,
  promote: false,  // ← no toggle for Promote
  run: true,
  observe: true,
  manage: false,
  report: false,
}
```

**`promote: false`** — the toggle is intentionally not shown for the Promote stage.

**However, because PROMOTE_TABS is never rendered and routes use inherited layouts:**

| Route | Actual layout | Live/As-Of key used | Toggle shown? |
|-------|-------------|--------------------|----|
| candidates | research layout | `LIVE_ASOF_VISIBLE.build` = true | **Yes (inherited from Build)** |
| TCA | research layout | `LIVE_ASOF_VISIBLE.build` = true | **Yes (inherited from Build)** |
| handoff | research layout | `LIVE_ASOF_VISIBLE.build` = true | **Yes (inherited from Build)** |
| risk | trading layout | `LIVE_ASOF_VISIBLE.run` = true | **Yes (inherited from Run)** |

**Finding:** All 4 Promote pages show the Live/As-Of toggle via their inherited layouts, even though `LIVE_ASOF_VISIBLE.promote = false` explicitly says they shouldn't. The `promote: false` config is dead code because no layout reads it.

**Impact:** Users on Promote pages see a Live/As-Of toggle that may not be relevant to the promote workflow (which is typically reviewing historical backtests and making promotion decisions).

---

## F. Cross-Reference Markers

### F1. `/service/trading/risk` shared between Promote and Observe

```
Task: F1
Status: ISSUE
Severity: P1-fix
```

**Question:** Does the risk page render different content based on navigation context?

**Answer: No.** The page component (`RiskDashboardPage`) is identical regardless of whether the user navigated from Promote or Observe. There is no:

- Route query parameter check
- Context provider reading
- Navigation source detection
- Conditional rendering based on lifecycle stage

**The page uses the same:**
- Component tree (7 tabs: Overview, Limits, Exposure, Greeks, HF Monitoring, Stress, Heatmap)
- Mock data (all inline)
- Layout (trading layout → TRADING_TABS)
- Title behavior

**But the semantic meaning differs:**

| Context | Label | User intent | Ideal content focus |
|---------|-------|-------------|---------------------|
| Promote (PROMOTE_TABS) | "Risk Review" | Pre-promotion risk assessment of a specific strategy candidate | Strategy-specific risk metrics, VaR for the candidate, comparison vs existing book |
| Observe (OBSERVE_TABS) | "Risk Dashboard" | Real-time portfolio risk monitoring | Portfolio-level VaR, exposure, limits, alerts |

**Finding:** The page serves both purposes at once (it has both strategy-level heatmap and portfolio-level VaR), but there's no way to emphasize the relevant view based on navigation context. A "Risk Review" user (Promote) wants to see the candidate's risk profile; a "Risk Dashboard" user (Observe) wants portfolio health.

**Recommendation:** Add a `context` query parameter or use the lifecycle stage from navigation state to default to different initial tabs (e.g., Promote → open on Heatmap tab; Observe → open on Overview tab).

**Feeds into:** Phase 3 cross-reference audit.

---

### F2. `/service/research/execution/tca` mapping mismatch

```
Task: F2
Status: ISSUE
Severity: P2-improve
```

**Question:** routeMappings says `primaryStage: "observe"` but PROMOTE_TABS includes this route. Is this intentional?

**Analysis:**

```typescript
// routeMappings entry:
{ path: "/service/research/execution/tca", label: "TCA",
  primaryStage: "observe", lanes: ["execution"], requiresAuth: true }

// PROMOTE_TABS entry:
{ label: "Execution Analysis", href: "/service/research/execution/tca" }
```

**The mapping is likely a bug, not intentional.** Evidence:

1. TCA (Transaction Cost Analysis) is relevant to BOTH Promote and Observe contexts:
   - **Promote:** TCA of the candidate strategy's backtest executions — pre-promotion quality check
   - **Observe:** TCA of live executions — post-trade monitoring
2. There are TWO TCA routes in the system:
   - `/service/research/execution/tca` — research TCA (in PROMOTE_TABS, mapped to observe)
   - `/service/execution/tca` — live execution TCA (in EXECUTION_TABS)
3. The research TCA page imports `MOCK_RECENT_ORDERS` from execution-platform-mock-data and renders an `ExecutionNav` component — it appears designed for the execution/observe context, not the promote context

**Likely scenario:** The research TCA route was originally built for the observe/execution context and later added to PROMOTE_TABS without updating `routeMappings`. The fact that it renders `ExecutionNav` (not `StrategyPlatformNav`) supports this.

**Options:**

1. **If TCA is genuinely for Promote:** Change `primaryStage` to `"promote"` and add `secondaryStage: "observe"`
2. **If TCA is genuinely for Observe:** Remove it from PROMOTE_TABS and replace with a promote-specific execution analysis page
3. **If shared:** Add `secondaryStage: "promote"` to the existing mapping

**Recommendation:** Option 3 (add secondary stage) for now; consider separate promote-specific TCA view in future.

**Feeds into:** Phase 3 cross-reference audit.

---

## G. Recommendations

### G1. Create promote layout

```
Task: G1
Status: INFO
Severity: —
```

**Option: Create `app/(platform)/service/promote/layout.tsx`**

**Pros:**
- Clean separation — Promote gets its own layout, its own tab bar, its own Live/As-Of config
- PROMOTE_TABS is finally rendered
- `LIVE_ASOF_VISIBLE.promote = false` would be honored
- Follows the pattern of existing layouts (data, research, trading, execution, reports)

**Cons:**
- **Route migration required:** All 4 routes would need to move under `/service/promote/`:
  - `/service/research/strategy/candidates` → `/service/promote/candidates`
  - `/service/research/execution/tca` → `/service/promote/tca`
  - `/service/trading/risk` → `/service/promote/risk-review`
  - `/service/research/strategy/handoff` → `/service/promote/handoff`
- This creates duplicate routes for shared pages (risk, TCA) or requires redirect handling
- The page components would need to be moved or aliased
- Risk page already lives in trading layout; creating a second route for it adds complexity

**Effort estimate:** Medium — 4 route moves, 1 new layout, PROMOTE_TABS href updates, redirect from old paths, stageServiceMap updates.

---

### G2. Contextual tab switching

```
Task: G2
Status: INFO
Severity: —
```

**Option: Research/trading layouts detect lifecycle stage and switch tab sets dynamically**

**Implementation sketch:**

```typescript
// In research layout:
const pathname = usePathname()
const mapping = getRouteMapping(pathname)
const isPromoteContext = mapping?.primaryStage === "promote"

const tabs = isPromoteContext ? PROMOTE_TABS : BUILD_TABS
const liveAsOfKey = isPromoteContext ? "promote" : "build"
```

**Pros:**
- No route migration — all pages stay where they are
- No duplicate routes
- PROMOTE_TABS renders when user is on a promote-mapped route
- Works with existing `getRouteMapping()` infrastructure
- Lower effort than G1

**Cons:**
- **Only works for 3 of 4 routes** — the research layout can switch for candidates, TCA, and handoff (all under `/service/research/`), but Risk is under `/service/trading/` — the trading layout would also need this logic
- **Two layouts need modification** (research + trading)
- Tab set shown depends on routeMappings primaryStage — but TCA has `primaryStage: "observe"` (not promote), so it wouldn't trigger PROMOTE_TABS unless the mapping is fixed first
- May confuse developers: "Why does research layout sometimes show BUILD_TABS and sometimes PROMOTE_TABS?"
- Doesn't solve the layout-switch problem (clicking Risk Review still switches from research→trading)

**Feasibility:** High for candidates + handoff (both have primaryStage: "promote" and both are under research). Requires F2 fix (TCA mapping) and a trading layout change for Risk.

**Recommended approach:** G2 (contextual switching) is lower effort and solves the immediate problem. G1 (dedicated layout) is the cleaner long-term solution if the Promote workflow grows in complexity.

---

## Priority Summary

### P1-fix (Must fix — 5 items)

| ID | Finding | Recommendation |
|----|---------|----------------|
| A1 | PROMOTE_TABS defined but never rendered — users see wrong tabs | Implement G2 (contextual switching) or G1 (promote layout) |
| A3 | Routes span research + trading layouts — layout switches during tab navigation | Requires G1 or G2 to prevent jarring switches |
| C2 | 2 of 4 routes highlight Observe instead of Promote | Add `secondaryStage: "promote"` to TCA and Risk routeMappings |
| C4 | Handoff page completely undiscoverable via any navigation | Add to `stageServiceMap.promote` or add cross-links from other Promote pages |
| F1 | Risk page identical in Promote vs Observe context — no semantic differentiation | Add context parameter or default to different tab based on navigation source |

### P2-improve (Should fix — 5 items)

| ID | Finding | Recommendation |
|----|---------|----------------|
| A2 | Tab context mismatch — page says "Promotion" but tabs say "Build" | Solved by A1 fix (rendering PROMOTE_TABS) |
| C3 | No cross-navigation between the 4 Promote pages | Add workflow stepper or PROMOTE_TABS (A1 fix) |
| E2 | No clear promote workflow flow across the 4 pages | Add stepper/breadcrumb; wire "Return to Candidates" button |
| E4 | Live/As-Of toggle shown on all Promote pages via inherited layouts | Solved by G2 (contextual switching with correct key) |
| F2 | TCA `primaryStage: "observe"` but in PROMOTE_TABS | Add `secondaryStage: "promote"` or change primaryStage |

---

## Component Inventory Summary

| Page | File | Lines | Components | Data Source | Sub-Nav | Empty State |
|------|------|-------|-----------|-------------|---------|-------------|
| Review Queue | `strategy/candidates/page.tsx` | 488 | 17 UI + 8 icons | Mock module | None | Yes |
| Execution Analysis | `execution/tca/page.tsx` | 407 | 14 UI + 8 icons + 9 chart | Mixed (module + inline) | ExecutionNav | No |
| Risk Review | `trading/risk/page.tsx` | 1071+ | 17 UI + 14 icons + 10 chart + 3 domain | All inline (~400 lines) | None | No |
| Approval Status | `strategy/handoff/page.tsx` | 405 | 12 UI + 12 icons | Inline (1 object) | StrategyPlatformNav | No |

**Total component surface:** 2371+ lines across 4 pages, 60+ unique component imports, 4 different data sourcing patterns, 3 different (or absent) sub-navigation components.

---

## Data Wiring Summary

| Page | Source Type | Module | Inline | Hooks | API | Random? |
|------|-----------|--------|--------|-------|-----|---------|
| Candidates | Mock module | `strategy-platform-mock-data` | No | useState | No | No |
| TCA | Mixed | `execution-platform-mock-data` | 3 constants | useState | No | Yes (EXECUTION_TIMELINE) |
| Risk | All inline | — | ~400 lines | useState, useMemo | No | No |
| Handoff | All inline | — | 1 constant | useState | No | No |

---

## Navigation Flow Diagram

```
Lifecycle Nav (Row 1)
  └── Promote dropdown
       └── "Strategy Candidates" → /service/research/strategy/candidates
            ↓ (no link to other Promote pages)
            ├── /service/research/execution/tca (only via direct URL or Observe dropdown)
            ├── /service/trading/risk (only via direct URL or Observe dropdown)
            └── /service/research/strategy/handoff (only via direct URL)

Row 2 tabs shown per route:
  /service/research/strategy/candidates → BUILD_TABS (should be PROMOTE_TABS)
  /service/research/execution/tca       → BUILD_TABS (should be PROMOTE_TABS)
  /service/trading/risk                 → TRADING_TABS (should be PROMOTE_TABS)
  /service/research/strategy/handoff    → BUILD_TABS (should be PROMOTE_TABS)
```
