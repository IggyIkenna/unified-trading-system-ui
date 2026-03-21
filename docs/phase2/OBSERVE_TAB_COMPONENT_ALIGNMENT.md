# Observe Tab — Component Alignment & Tab Consolidation Assessment

**Date:** 2026-03-21
**Context:** Phase 2e supplement — re-assessed with refined scope from product owner
**Repo:** unified-trading-system-ui
**Branch:** feat/service-centric-navigation

---

## Scope Clarification

The Observe lifecycle tab is responsible for **observing the overall trading system**: execution health, system health, live deployments, hardware monitoring, service latency, and all operational aspects. Mock data used throughout is identical to the real backend data shape — the goal is to validate that the **right components are on the right pages** and that **redirections are sensible** before backend integration.

There are **two tab layers** in the current UI:
- **Row 2 (new):** `ServiceTabs` component — the unified navigation layer below the lifecycle nav. For the execution context, this shows: Analytics, Algos, Venues, TCA, Benchmarks.
- **Page-level tabs (old):** Internal `Tabs`/`TabsList` components within individual pages — more granular, often with more tabs than Row 2. These need to be consolidated into the Row 2 structure, then the old page-level tab structures removed.

---

## 1. Current Component Map — What's Where

### Row 2 Tab Definitions

| Tab Set | Rendered By Layout? | Tabs |
|---------|-------------------|------|
| OBSERVE_TABS | **NO** (dead code) | Risk Dashboard, Alerts, News, Strategy Health, System Health |
| EXECUTION_TABS | Yes (`service/execution/layout.tsx`) | Analytics, Algos, Venues, TCA, Benchmarks |
| TRADING_TABS | Yes (`service/trading/layout.tsx`) | Terminal, Positions, Orders, Execution Analytics, Accounts, Markets |

### Page-Level (Old) Tabs on Observe-Domain Pages

| Page | Route | Old Internal Tabs | Row 2 Tab Context |
|------|-------|-------------------|-------------------|
| **Risk Dashboard** | `/service/trading/risk` | Risk Summary, VaR & Stress, Exposure, Greeks, Margin, Term Structure, Limits (7 tabs) | Shows TRADING_TABS (wrong context) |
| **Alerts** | `/service/trading/alerts` | None | Shows TRADING_TABS (no tab highlighted) |
| **System Health** | `/health` | Services, Feature Freshness, Dependencies (3 tabs) | No Row 2 tabs at all |
| **Ops Hub** | `/ops` (ops route group) | Deploy, Observe, Compliance (3 tabs) | No Row 2 tabs (ops layout) |
| **DevOps** | `/devops` (ops route group) | Overview, Deployments, Data Status, Cloud Builds, Services, Readiness (6 tabs) | No Row 2 tabs (ops layout) |
| **Ops Services** | `/ops/services` (ops route group) | All Services, APIs, Core Services (3 tabs) | No Row 2 tabs (ops layout) |
| **News** | `/service/observe/news` | None (placeholder) | No Row 2 tabs |
| **Strategy Health** | `/service/observe/strategy-health` | None (placeholder) | No Row 2 tabs |

### Monitoring-Related Pages Elsewhere (Not Under Observe)

| Page | Route | Lifecycle | Monitoring Content |
|------|-------|-----------|-------------------|
| ML Model Monitoring | `/service/research/ml/monitoring` | Build (primaryStage: observe) | Live model monitoring: latency charts, error rate, throughput, feature health |
| Markets | `/service/trading/markets` | Run | Latency tab with per-venue latency metrics |
| Execution TCA | `/service/execution/tca` | Observe (primaryStage) | Transaction cost analysis |
| Venue Health | `/service/data/venues` | Acquire | Per-venue connectivity and health monitoring |

---

## 2. Assessment: Are Components Aligned to Observe?

### What Observe SHOULD Cover (Per Product Scope)

| Concern | Required Component | Currently Exists? | Current Location | On Observe Tab? |
|---------|-------------------|-------------------|-----------------|-----------------|
| Execution health | Service health grid, p50/p99 latency, error rates | Yes | `/health` (platform) + `/ops/services` (ops) | No — standalone / ops |
| System health | Service status, feature freshness, dependency DAG | Yes | `/health` (platform) | No — standalone |
| Live deployments | Recent deployments, version drift, deploy button | Yes | `/ops` Deploy tab + `/devops` Deployments tab | No — ops route group |
| Hardware monitoring | CPU, memory, instance counts per service | Yes | `/ops/services` table columns | No — ops route group |
| Service latency | p50/p99, latency charts, latency profiles | Partial | `/ops/services` (table), `/service/trading/markets` (Latency tab), `/health` (per-service) | No — scattered |
| Risk monitoring | VaR, exposure, limits, greeks, stress testing | Yes (rich) | `/service/trading/risk` (1,089 lines) | OBSERVE_TABS says yes, but page shows TRADING_TABS |
| Alerts & incidents | Alert feed, kill switch, incident management | Yes | `/service/trading/alerts` (378 lines) | OBSERVE_TABS says yes, but page shows TRADING_TABS |
| Strategy health | Sharpe drift, drawdown, signal decay | Placeholder | `/service/observe/strategy-health` | OBSERVE_TABS says yes, no layout renders it |
| News & events | Market news, sentiment, event calendar | Placeholder | `/service/observe/news` | OBSERVE_TABS says yes, no layout renders it |
| TCA | Transaction cost analysis | Yes | `/service/execution/tca` | No — under execution layout |
| Venue connectivity | WebSocket status, reconnect, message rates | Yes (component) | `/ops` → `VenueConnectivity` component | No — ops route group |
| Data completeness | Per-service data completeness heatmap | Yes | `/ops` Observe tab | No — ops route group |
| Batch jobs | Job status, progress, errors | Yes | `/ops` Observe tab + `/ops/jobs` | No — ops route group |
| Audit trail | Config changes, interventions, deployments | Yes | `/ops` Compliance tab | No — ops route group |

### Verdict: Significant Misalignment

The **core problem**: observe-domain monitoring components are split across three disconnected areas:
1. **`(platform)` route group** — Risk, Alerts, Health (accessible to all auth users)
2. **`(ops)` route group** — Ops Hub, DevOps, Services (internal-only, role-gated)
3. **Scattered** — ML Monitoring (build), Markets Latency (run), Venue Health (acquire)

The current OBSERVE_TABS definition only captures group 1. Groups 2 and 3 contain the majority of the "observing the overall system" functionality but are invisible from the Observe lifecycle.

---

## 3. The Two-Tab-Layer Problem

### Current State (Example: Execution)

When a user navigates to `/service/execution/overview`:

```
┌────────────────────────────────────────────────────────────┐
│ [Acquire] [Build] [Promote] [Run] [Observe] [Manage] [Report]  ← Row 1: Lifecycle Nav
├────────────────────────────────────────────────────────────┤
│ Analytics | Algos | Venues | TCA | Benchmarks               ← Row 2: EXECUTION_TABS (new)
├────────────────────────────────────────────────────────────┤
│ (page content — no old tabs on this particular page)         ← Page content
└────────────────────────────────────────────────────────────┘
```

For execution, Row 2 has 5 tabs. This works cleanly because:
- The execution layout renders EXECUTION_TABS
- The page content doesn't have its own competing tab layer

### Problem: Risk Dashboard Has Competing Tabs

When a user navigates to `/service/trading/risk`:

```
┌────────────────────────────────────────────────────────────┐
│ [Acquire] [Build] [Promote] [Run] [Observe] [Manage] [Report]  ← Row 1
├────────────────────────────────────────────────────────────┤
│ Terminal | Positions | Orders | Exec Analytics | Accounts | Markets  ← Row 2: TRADING_TABS (WRONG)
├────────────────────────────────────────────────────────────┤
│ [Risk Summary] [VaR & Stress] [Exposure] [Greeks] [Margin] [Term] [Limits]  ← Old page tabs (7!)
│ ┌───────────────────────────────────────────────────────┐
│ │ (tab content: KPI cards, charts, tables)              │
│ └───────────────────────────────────────────────────────┘
└────────────────────────────────────────────────────────────┘
```

**Three layers of navigation.** The user sees:
1. Lifecycle nav (correct)
2. TRADING_TABS (wrong — should be OBSERVE_TABS)
3. Risk page internal tabs (old — these should move to Row 2 or be consolidated)

### Target State

```
┌────────────────────────────────────────────────────────────┐
│ [Acquire] [Build] [Promote] [Run] [Observe] [Manage] [Report]  ← Row 1
├────────────────────────────────────────────────────────────┤
│ Risk Summary | VaR | Exposure | Greeks | Margin | Limits | Alerts | Health | ...  ← Row 2: OBSERVE_TABS (expanded)
├────────────────────────────────────────────────────────────┤
│ (page content — no competing internal tabs)                  ← Clean single page
└────────────────────────────────────────────────────────────┘
```

---

## 4. OBSERVE_TABS Redesign Recommendation

The current OBSERVE_TABS has 5 entries. Based on the product scope (system-wide observation), it should be expanded to cover the full monitoring surface. Below is the recommended tab set, mapping old page-level tabs into the Row 2 structure.

### Proposed OBSERVE_TABS (Expanded)

| # | Tab Label | Route | Source | Notes |
|---|-----------|-------|--------|-------|
| 1 | Risk Summary | `/service/observe/risk` | Risk page "Risk Summary" tab | KPIs, strategy heatmap, top utilization |
| 2 | VaR & Stress | `/service/observe/var` | Risk page "VaR & Stress" tab | Component VaR, stress scenarios, regime slider |
| 3 | Exposure | `/service/observe/exposure` | Risk page "Exposure" tab | 23 risk types, strategy filter, time series |
| 4 | Greeks | `/service/observe/greeks` | Risk page "Greeks" tab | Portfolio greeks, per-position, time series |
| 5 | Margin & Limits | `/service/observe/margin` | Risk page "Margin" + "Term Structure" + "Limits" tabs | Merged: CeFi margin, DeFi HF, term structure, limit hierarchy |
| 6 | Alerts | `/service/observe/alerts` | Alerts page (full) | Alert feed, kill switch panel |
| 7 | Services | `/service/observe/services` | Health page "Services" tab + Ops Services page | Service health grid, CPU/memory, latency, shard config |
| 8 | Deployments | `/service/observe/deployments` | Ops Deploy tab + DevOps Deployments | Recent deployments, version drift, deploy actions |
| 9 | Data & Jobs | `/service/observe/data` | Ops "Observe" tab + Health "Feature Freshness" | Batch jobs, data completeness, feature freshness |
| 10 | Strategy Health | `/service/observe/strategy-health` | Current placeholder | (Coming Soon → will show Sharpe drift, drawdowns, signal decay) |

### What Gets Consolidated

| Old Location | Tabs/Content | Moves To |
|-------------|-------------|----------|
| `/service/trading/risk` (7 internal tabs) | Risk Summary, VaR & Stress, Exposure, Greeks, Margin, Term Structure, Limits | Observe tabs 1-5 (each old tab becomes a Row 2 tab or merged) |
| `/service/trading/alerts` | Alert feed + Kill Switch | Observe tab 6 |
| `/health` (3 internal tabs) | Services, Feature Freshness, Dependencies | Observe tabs 7 + 9 |
| `/ops` (3 internal tabs) | Deploy, Observe, Compliance | Observe tabs 8 + 9 (compliance stays in Manage) |
| `/ops/services` | Service table with shards | Merged into Observe tab 7 |
| `/devops` (6 internal tabs) | Overview, Deployments, Data Status, Cloud Builds, Services, Readiness | Observe tab 8 (deployments), rest available via drill-down |

### What Gets Removed (After Consolidation)

- Risk page internal `<Tabs>` component with 7 TabsTriggers — replaced by 4 separate pages under `/service/observe/`
- Health page internal `<Tabs>` — services content moves to observe tab 7, freshness to tab 9
- Old `/ops` and `/devops` internal tabs for monitoring content — moved to platform observe (deployment/data tabs)
- Compliance content from `/ops` Compliance tab — stays in Manage lifecycle, not Observe

### What Stays as Page-Level Tabs (Acceptable)

Some pages will retain page-level tabs where they represent **view modes within a single concern**, not navigation between concerns:

| Page | Retained Internal Tabs | Reason |
|------|----------------------|--------|
| Margin & Limits | CeFi Margin / DeFi Health / Term Structure / All Limits | These are view modes within the single "margin & limits" concern |
| Services | All Services / APIs / Core Services | Filter views within the service health concern |
| Data & Jobs | Batch Jobs / Data Completeness / Feature Freshness | View modes within the data health concern |

---

## 5. Navigation Redirect Assessment

### Current Redirects That Are Wrong

| User Action | Current Behavior | Problem |
|-------------|-----------------|---------|
| Lifecycle nav → Observe → Risk | Goes to `/service/trading/risk`, shows TRADING_TABS | Wrong tab context, wrong lifecycle feel |
| Lifecycle nav → Observe → Alerts | Goes to `/service/trading/alerts`, shows TRADING_TABS with no tab highlighted | Invisible page |
| Lifecycle nav → Observe → Health | Goes to `/health`, no Row 2 tabs | Disconnected from observe navigation |
| Direct URL `/service/observe/news` | Lands on placeholder, no tabs, no lifecycle highlight | Undiscoverable |
| Direct URL `/service/observe/strategy-health` | Same as news | Undiscoverable |

### Redirects That Need to Exist (After Consolidation)

| Old Route | New Route | Redirect Type |
|-----------|-----------|---------------|
| `/service/trading/risk` | `/service/observe/risk` | 301 permanent (risk is primarily an observe concern) |
| `/service/trading/alerts` | `/service/observe/alerts` | 301 permanent |
| `/health` | `/service/observe/services` | 301 permanent |
| `/ops` (monitoring parts) | `/service/observe/deployments` or `/service/observe/data` | Soft — ops page remains for compliance/audit trail |

### Redirects That Are Currently Sensible

| Route | Behavior | Assessment |
|-------|----------|------------|
| `/service/execution/overview` | Shows EXECUTION_TABS (Analytics highlighted) | Correct — execution analytics is a Run/Observe concern and works well in execution context |
| `/service/execution/tca` | Shows EXECUTION_TABS (TCA highlighted) | Correct — TCA is properly scoped. It has `primaryStage: "observe"` in routeMappings which correctly highlights Observe in lifecycle nav |
| `/service/execution/venues` | Shows EXECUTION_TABS (Venues highlighted) | Correct — venue execution analytics |
| `/dashboard` | Shows no Row 2 tabs (command center) | Acceptable — dashboard is a standalone overview |

---

## 6. Mock Data Alignment Check

All observe-domain pages use mock data that matches the expected real backend shapes:

| Page | Mock Data Quality | Backend-Ready? |
|------|-------------------|---------------|
| **Risk Dashboard** | High — 7 well-structured data sets (VaR, limits hierarchy, greeks, stress scenarios, exposure attribution, term structure). Strategy IDs match real naming conventions (DEFI_ETH_BASIS_SCE_1H). | Yes — mock shapes match risk-and-exposure-service API contracts |
| **Alerts** | Good — 7 alerts with proper severity/status/entity/threshold model. Sources reference real services (risk-and-exposure-service, alerting-service, execution-service). | Yes — mock shapes match alerting-service contracts |
| **System Health** | Good — 10 services with realistic names, latency metrics, freshness SLA model. | Yes — mock shapes match health endpoint contracts |
| **Ops Hub** | Good — batch jobs, services with version drift, data completeness heatmap, audit trail. | Yes — matches deployment-service and ops-api contracts |
| **Ops Services** | Good — uses `SERVICES` from `lib/reference-data.ts`, extends with runtime metrics. Shard model is well-structured. | Yes — shard config matches real service topology |
| **DevOps** | Good — delegates to 6 dedicated components (DevOpsDashboard, DeploymentHistory, DataStatusTab, CloudBuildsTab, ServicesOverviewTab, ReadinessTab). | Yes — ported from deployment-ui with matching data shapes |
| **News** | None (placeholder) | N/A |
| **Strategy Health** | None (placeholder) | N/A |

**Verdict:** Mock data is high quality and backend-ready. The problem is not data shape — it's that the components are in the wrong place and navigated to through the wrong tab structure.

---

## 7. Tab Consolidation Migration Path

### Step 1: Create Observe Layout (Low Effort)

Create `app/(platform)/service/observe/layout.tsx` rendering OBSERVE_TABS. This immediately fixes news and strategy-health (they get tabs).

### Step 2: Expand OBSERVE_TABS (Medium Effort)

Update the OBSERVE_TABS constant in `service-tabs.tsx` to include the full observe scope (10 tabs from Section 4 above, or a reasonable subset).

### Step 3: Create Observe Route Pages (Medium Effort)

For each new observe tab, create a page under `/service/observe/` that renders the relevant component:
- `/service/observe/risk` → imports RiskSummary component from the current risk page
- `/service/observe/var` → imports VaR section from the current risk page
- etc.

This requires extracting the current 1,089-line `risk/page.tsx` into separate components — which is good practice regardless.

### Step 4: Set Up Redirects (Low Effort)

Add `next.config.js` redirects from old routes to new observe routes.

### Step 5: Remove Old Tab Structures (Low Effort, After Verification)

Once the new Row 2 tabs are working, remove the old `<Tabs>` components from the risk page and health page. The risk page goes from 1,089 lines with 7 internal tabs to a single-section page rendering one concern per route.

### Step 6: Update routeMappings and stageServiceMap (Low Effort)

Add all new `/service/observe/*` routes to `routeMappings` with `primaryStage: "observe"` and update `stageServiceMap` to include the full set.

---

## 8. Ops vs Platform Decision

Currently, ops-domain pages live under `app/(ops)/` — a separate route group that requires `role=internal`. Observe-domain monitoring belongs in `app/(platform)/` because:

1. **Client users** with execution or strategy subscriptions need to see system health, latency, and service status for the services they use
2. The platform approach (same pages, data-scoped by entitlements) means internal users see all services, clients see their subscribed services
3. Deployment-specific actions (deploy button, rollback) remain in ops — but monitoring (status, health) should be in platform/observe

**Recommendation:** The monitoring-read surfaces (service health, latency, deployment status) should be accessible from Observe in the platform. The write surfaces (deploy, rollback, config changes) remain in ops.

---

## Summary of Issues for Resolution

| # | Issue | Impact | Resolution |
|---|-------|--------|------------|
| 1 | OBSERVE_TABS is dead code (no layout renders it) | Users cannot navigate observe pages via tabs | Create observe layout |
| 2 | OBSERVE_TABS only has 5 tabs, should have ~10 to cover full observe scope | Missing: deployments, services, data/jobs, margin/limits consolidated | Expand OBSERVE_TABS constant |
| 3 | Risk page has 7 internal tabs competing with Row 2 (3 nav layers) | Confusing UX — which tabs do I use? | Extract risk tabs into separate observe route pages |
| 4 | Health page has 3 internal tabs, no Row 2 | Disconnected from observe context | Move health content into observe services/data tabs |
| 5 | Ops monitoring content (deploy, services, data completeness) not accessible from Observe | Users must switch to ops route group to see deployment status | Surface read-only monitoring in platform observe |
| 6 | Risk and Alerts routes are under `/service/trading/` but belong to Observe | Wrong Row 2 tabs shown, wrong lifecycle context | Move to `/service/observe/` with redirects from old routes |
| 7 | `/service/observe/news` and `/service/observe/strategy-health` not in stageServiceMap or routeMappings | Undiscoverable pages | Add entries |
| 8 | EXECUTION_TABS (Analytics, Algos, Venues, TCA, Benchmarks) partially overlaps with observe scope (TCA is observe) | Minor — TCA correctly has `primaryStage: observe` in routeMappings | Acceptable — TCA lives in execution layout for contextual access, lifecycle nav correctly highlights Observe |
