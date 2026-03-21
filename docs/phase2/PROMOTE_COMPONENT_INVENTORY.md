# Phase 2c: Promote Tab — Component Inventory

**Generated:** 2026-03-21 | **Source:** Phase 2c Promote Tab Audit

Detailed component, import, and data source inventory for each Promote lifecycle page.

---

## Page 1: Review Queue (`/service/research/strategy/candidates`)

**File:** `app/(platform)/service/research/strategy/candidates/page.tsx` (488 lines)

### Import Map

```
React ─────────────────── * as React
Icons ─────────────────── ArrowRight, CheckCircle2, Clock, MessageSquare, Rocket, Shield, Target, XCircle
UI ────────────────────── Badge, Button, Card, CardContent, CardHeader, CardTitle,
                          Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
                          Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow
Data ──────────────────── STRATEGY_CANDIDATES, BACKTEST_RUNS (from strategy-platform-mock-data)
Types ─────────────────── StrategyCandidate (from strategy-platform-types)
```

### State

| Variable | Type | Init | Mutated by |
|----------|------|------|------------|
| `candidates` | `StrategyCandidate[]` | `STRATEGY_CANDIDATES` | `promoteCandidate`, `rejectCandidate`, `addComment` |
| `promotionTargets` | `Record<string, "paper" \| "live" \| null>` | `{}` | `promoteCandidate` |
| `commentDialog` | `string \| null` | `null` | Dialog open/close |
| `commentText` | `string` | `""` | Input onChange |

### Rendered Sections

1. Header — "Promotion Pipeline" with pending/resolved count
2. Awaiting Review — cards with metrics grid (6 cols), workflow viz, actions (Promote Paper/Live, Reject, Comment)
3. Resolved — table of resolved candidates
4. Empty state — "No candidates in the pipeline"
5. Comment Dialog — modal for adding review comments

---

## Page 2: Execution Analysis (`/service/research/execution/tca`)

**File:** `app/(platform)/service/research/execution/tca/page.tsx` (407 lines)

### Import Map

```
React ─────────────────── * as React
UI ────────────────────── Card, CardContent, CardDescription, CardHeader, CardTitle,
                          Badge, Button, Select/*, Table/*, Tabs/* (unused)
Charts ────────────────── LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
                          AreaChart, Area, BarChart, Bar, Cell (recharts)
Icons ─────────────────── LineChartIcon, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown,
                          BarChart3, Clock, Target, DollarSign
Domain ────────────────── ExecutionNav (from execution-platform/execution-nav)
Data ──────────────────── MOCK_RECENT_ORDERS (from execution-platform-mock-data)
Utils ─────────────────── cn (from utils)
```

### Inline Mock Data

| Constant | Records | Fields |
|----------|---------|--------|
| `TCA_BREAKDOWN` | 4 | name, value, color |
| `EXECUTION_TIMELINE` | 20 | time, price, vwap, twap, fill (uses `Math.random()`) |
| `SLIPPAGE_DISTRIBUTION` | 6 | range, count, color |

### Rendered Sections

1. ExecutionNav sub-bar
2. Header — "TCA Explorer" with time range selector
3. Summary stats — 5 metric cards (Total Cost, Slippage, Market Impact, Timing Cost, Arrival Price)
4. Execution Timeline — LineChart (price vs VWAP vs TWAP)
5. Cost Breakdown — horizontal bar visualization
6. Benchmark Comparison — 4-card grid (vs Arrival, VWAP, TWAP, Implementation Shortfall)
7. Slippage Distribution — BarChart histogram
8. Recent Orders — clickable table with per-order TCA

---

## Page 3: Risk Review (`/service/trading/risk`)

**File:** `app/(platform)/service/trading/risk/page.tsx` (1071+ lines)

### Import Map

```
React ─────────────────── * as React
Domain ────────────────── LimitBar, PnLValue, StatusBadge (from trading/*)
UI ────────────────────── Card, CardContent, CardDescription, CardHeader, CardTitle,
                          Tabs, TabsContent, TabsList, TabsTrigger,
                          Badge, Button, Progress, Slider, ScrollArea,
                          Table/*, Tooltip/*, Collapsible, Select/*
Charts ────────────────── ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
                          RechartsTooltip, Legend, RechartsLineChart, Line, Area, AreaChart,
                          Cell, ReferenceLine (recharts)
Icons ─────────────────── Shield, TrendingUp, Wallet, AlertTriangle, BarChart3, LineChart,
                          Activity, Clock, Zap, ChevronDown, ChevronRight, Info, Target, X
Utils ─────────────────── cn
```

### Inline Mock Data (~400 lines)

| Constant | Purpose | Approx. records |
|----------|---------|----------------|
| `strategyRiskHeatmap` | Strategy-level risk metrics | 6 strategies |
| `componentVarData` | VaR by component | 6 items |
| `stressScenarios` | Stress test results | 6 scenarios |
| `portfolioGreeks` | Portfolio Greeks | 1 object |
| `positionGreeks` | Per-position Greeks | 5 positions |
| `greeksTimeSeries` | Greeks over 12 months | 12 data points |
| `secondOrderRisks` | Second-order metrics | 4 items |
| `termStructureData` | Rate term structure | 7 tenors |
| `hfTimeSeries` | HF monitoring data | 24 data points |
| `distanceToLiquidation` | Liquidation distance | 5 assets |
| `mockLimitsHierarchy` | Limits tree | 3 levels deep |
| `allExposureRows` | Exposure by strategy | 6 rows |
| `exposureTimeSeries` | Exposure over time | 7 data points |
| `MOCK_STRATEGIES` | Strategy filter list | 5 items |

### 7-Tab Internal Layout

| Tab | Content |
|-----|---------|
| Overview | VaR summary, stress highlights, strategy heatmap preview |
| Limits | Hierarchical limits tree (collapsible), utilization bars |
| Exposure | Exposure table by strategy, time series chart |
| Greeks | Portfolio and position Greeks, time series, term structure |
| HF Monitoring | High-frequency metrics, distance to liquidation |
| Stress | Stress scenario table, impact analysis |
| Heatmap | Full strategy risk heatmap |

---

## Page 4: Approval Status (`/service/research/strategy/handoff`)

**File:** `app/(platform)/service/research/strategy/handoff/page.tsx` (405 lines)

### Import Map

```
React ─────────────────── * as React
UI ────────────────────── Card, CardContent, CardDescription, CardHeader, CardTitle,
                          Button, Badge, Separator, Textarea, Switch, Label,
                          Alert, AlertDescription, AlertTitle
Domain ────────────────── StrategyPlatformNav (from strategy-platform/strategy-nav)
Icons ─────────────────── Send, CheckCircle2, AlertTriangle, ArrowRight, FileJson, GitBranch,
                          Shield, Clock, User, MessageSquare, Rocket, Copy, ExternalLink
Utils ─────────────────── cn
```

### Inline Mock Data

| Constant | Structure |
|----------|-----------|
| `HANDOFF_CANDIDATE` | `{ strategyId, backtestId, configVersion, sourceExperiment, metrics{7}, champion{4}, configDiff[5], riskChecks[5], approvals[3] }` |

### State

| Variable | Type | Init |
|----------|------|------|
| `notes` | `string` | `""` |
| `shadowTradingEnabled` | `boolean` | `true` |
| `autoRollback` | `boolean` | `true` |
| `gradualRollout` | `boolean` | `true` |

### Rendered Sections (2-column layout)

**Left column (col-span-2):**
1. Conditional alert — "Ready for Promotion" / "Pending Items"
2. Strategy summary — ID, version, backtest, experiment + 4 metric cards
3. Config diff table — 5 parameter changes vs champion
4. Risk validation checks — 5 pass/fail items with value/limit

**Right column:**
1. Approval chain — 3 roles (Quant Lead, Risk Manager, CTO) with status
2. Deployment options — 3 switches (Shadow Trading, Auto-Rollback, Gradual Rollout)
3. Promotion notes — textarea
4. Action buttons — Promote to Live (disabled until approved), Request Approval, Return to Candidates

---

## Shared Components Across Pages

| Component | Candidates | TCA | Risk | Handoff |
|-----------|:---------:|:---:|:----:|:------:|
| Card/CardContent/CardHeader/CardTitle | ✓ | ✓ | ✓ | ✓ |
| Badge | ✓ | ✓ | ✓ | ✓ |
| Button | ✓ | ✓ | ✓ | ✓ |
| Table/* | ✓ | ✓ | ✓ | — |
| CardDescription | — | ✓ | ✓ | ✓ |
| Select/* | — | ✓ | ✓ | — |
| cn (utils) | — | ✓ | ✓ | ✓ |
| Tabs/* | — | import (unused) | ✓ | — |
| ResponsiveContainer (recharts) | — | ✓ | ✓ | — |
| Dialog/* | ✓ | — | — | — |
| Switch | — | — | — | ✓ |
| Alert/* | — | — | — | ✓ |
| Progress | — | — | ✓ | — |
| Slider | — | — | ✓ | — |
| Collapsible | — | — | ✓ | — |
| ScrollArea | — | — | ✓ | — |
| Tooltip/* (UI) | — | — | ✓ | — |

### Sub-Navigation Components

| Page | Sub-nav | Links to |
|------|---------|----------|
| Candidates | None | — |
| TCA | `ExecutionNav` | Execution platform pages (NOT other Promote pages) |
| Risk | None | — |
| Handoff | `StrategyPlatformNav` | Strategy platform pages (NOT other Promote pages) |

### Domain Components (Risk page only)

| Component | Source | Purpose |
|-----------|--------|---------|
| `LimitBar` | `@/components/trading/limit-bar` | Risk limit utilization bar |
| `PnLValue` | `@/components/trading/pnl-value` | Formatted P&L display |
| `StatusBadge` | `@/components/trading/status-badge` | Status indicator badge |
