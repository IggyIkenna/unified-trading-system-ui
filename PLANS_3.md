# PLANS_3: Service Architecture Completion & Entry-Point Logic

**Purpose:** Implement the generalized service architecture across all service areas, build the post-login service hub, and establish lifecycle-aligned entry-point logic.

**Prerequisites:**
- Phase 2 complete (structural foundation) ✅
- PLANS_1 (structural refactor) ✅
- PLANS_2 (React Query wiring, MSW handlers) ✅
  - 16 MSW handlers created (auth, data, execution, positions, strategy, ml, risk, trading, market-data, alerts, reporting, deployment, service-status, audit, user-management)
  - 14 React Query hooks created (use-instruments, use-positions, use-orders, use-strategies, use-ml-models, use-risk, use-trading, use-market-data, use-alerts, use-reports, use-deployments, use-service-status, use-audit, use-organizations)
  - Auth flow fixed: login page uses PERSONAS, nav filters by entitlements
  - 105 tests passing at 95%+ coverage
- ARCHITECTURE_HARDENING.md changes applied to docs

**Relationship to PLANS_2:** PLANS_2 created the mock/hook/handler infrastructure. PLANS_3 uses that infrastructure to build the actual user experience — deepening pages from stubs to functional service surfaces, building the service hub, and establishing end-to-end user journeys.

**Urgency:** This needs to be a COMPLETE platform experience — not slides in the form of web pages. Users must be able to create accounts, configure strategies, run backtests, set up ML experiments, trade, monitor, generate reports. Everything operates on mock data, but the interactions must be REAL (forms submit, state changes, new items appear in lists, filters work end-to-end).

**Porting strategy:** Several `_reference/` UIs have production-grade components that should be PORTED (adapted) not just referenced. Especially `deployment-ui` (17K lines, 20 components) and `versa-client-reporting`. See ARCHITECTURE_HARDENING.md §10 for the porting checklist.

**Execution:** Work through phases sequentially: 5A first, then 5B-5G (which can be parallelized), then 5H-5I. Each phase should complete fully before moving on.

**Scope:** This plan covers what PLANS_2 does NOT — the service architecture consistency, commercial packaging UX, hub experience, and completion of all service areas using reference UI patterns.

---

## BEFORE YOU WRITE ANY CODE

Read these files IN ORDER:

1. `ARCHITECTURE_HARDENING.md` — The doc/rule updates that define the target architecture for this plan
2. `ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md` — Platform vision (especially §6.1 service layers after hardening update)
3. `SERVICE_COMPLETION_STATUS.md` — Current state of each service area (created by hardening)
4. `UI_STRUCTURE_MANIFEST.json` → `service_completion` — Machine-readable state
5. `_reference/REFERENCE_MAPPING.md` — Which reference UIs to consult per service
6. `context/API_FRONTEND_GAPS.md` — API readiness
7. `.cursorrules` — Coding patterns, especially §1.5 (service layer pattern), §1.6 (reference usage), §1.7 (lifecycle naming)

---

## KEY PRINCIPLE: Universal Service Funnel

Every service follows the SAME funnel. Three doors, same destination:

1. **Prospect** → Landing → `/services/{domain}` marketing page → Subscribe → Register → Login → Hub (subscription overview) → Service detail
2. **Client** → Login → Hub (shows entitled vs locked) → Click entitled → Service detail (org-scoped)
3. **Internal** → Login → Hub (everything available) → Service detail (all data + admin surfaces)

The hub IS the subscription overview. The service detail IS the same page for everyone.
The only difference is data filtering. See ARCHITECTURE_HARDENING.md §2A-PRE for full spec.

**This means:** Every service page must handle three states:
- **Subscribed:** Full functionality, org-scoped data
- **Not subscribed:** Locked overlay with "Upgrade" CTA showing what they'd get
- **Internal:** Full data, no restrictions, plus admin/ops links

---

## PHASE 5A: Post-Login Service Hub (Priority: HIGHEST)

**Why first:** The hub is the central organizing experience. Every other service improvement flows from it. Without it, new service pages feel disconnected.

### 5A.1: Build Service Hub Component

**File:** `components/platform/service-hub.tsx` (NEW)

Build the core service hub component that renders the service grid:

```typescript
// Inputs:
// - services: from lib/config/services.ts PLATFORM_SERVICES
// - entitlements: from useAuth() → service_entitlements[]
// - permission_level: from useAuth() → "internal" | "client" | "prospective"

// Renders:
// 1. Service grid (cards with state: available | locked | hidden | degraded)
// 2. Each card shows: name, icon, lifecycle color, quick-stat, status
// 3. Available cards → click navigates to product surface
// 4. Locked cards → click opens upgrade modal
// 5. Hidden cards → not rendered (filtered out by permission_level)
```

**Service card states:**

| State | Condition | Visual | Interaction |
|-------|-----------|--------|-------------|
| Available | User has entitlement | Full color, active stats | Click → navigate to service |
| Locked | No entitlement, but service is client-visible | Grayed, lock icon, "Upgrade" badge | Click → upgrade modal |
| Hidden | Service visibility = "internal" AND user is client | Not rendered | N/A |
| Degraded | Service health = warning/error | Yellow/red border + warning icon | Click → navigate (banner shows status) |

**Design reference:** Use institutional card grid layout. Each card should feel like a Bloomberg terminal panel — dense, information-forward, dark palette. NOT a SaaS pricing grid.

### 5A.2: Build Upgrade Modal

**File:** `components/platform/upgrade-modal.tsx` (NEW)

When a client clicks a locked service:
- Modal shows: service name, description, what it includes
- "Contact Sales" CTA button
- "Request Trial" secondary CTA (future)
- List of capabilities they would unlock
- Current package vs package that includes this service

### 5A.3: Build Activity Feed

**File:** `components/platform/activity-feed.tsx` (NEW)

Cross-service activity stream:
- Recent events from all subscribed services
- Each event shows: timestamp, service icon, lifecycle stage color, description
- Events are persona-scoped (client sees own org events, internal sees all)
- MSW handler: add activity events to existing handlers or create `handlers/activity.ts`

Mock events should span the lifecycle:
- Design: "New strategy template created: Mean-Reversion-V3"
- Simulate: "Backtest completed: Alpha-7 → Sharpe 2.1"
- Promote: "Candidate Alpha-7 promoted to paper trading"
- Run: "Strategy Alpha-7 live on Binance (3 instruments)"
- Monitor: "Alert: Risk limit 80% utilization on venue Binance"
- Explain: "Monthly P&L report generated for Alpha Capital"
- Reconcile: "Settlement #4521 completed — $12.4M settled"

### 5A.4: Build Quick Actions Bar

**File:** `components/platform/quick-actions.tsx` (NEW)

Role-aware shortcuts rendered below service grid:
- Derives actions from `useAuth()` role and entitlements
- Each action: icon + label + route
- Max 6 actions visible (overflow into "More" dropdown)

| Role | Actions |
|------|---------|
| Internal Admin | Manage Users, System Health, Audit Log, Config, Deployment |
| Internal Trader | Trading Dashboard, Risk Overview, Positions, Alerts |
| Internal Quant | New Backtest, Model Registry, Feature Lab, Data Catalogue |
| Client PM | Portfolio Overview, Reports, Settlement Status, Data |
| Client Analyst | Data Catalogue, Research, Market Data |

### 5A.5: Build System Health Bar

**File:** `components/platform/health-bar.tsx` (NEW)

Thin bar at the top of the service hub showing aggregate health:
- One colored dot per service (green/yellow/red)
- Hover shows service name + status
- Click expands to full health dashboard (`/health`)
- Client sees only subscribed services' health
- Internal sees all services

### 5A.6: Wire Service Hub Page

**File:** `app/(platform)/overview/page.tsx` (MODIFY — exists, needs rebuild)

Compose the hub from the components above:
1. SystemHealthBar
2. ServiceHub (grid)
3. QuickActions
4. ActivityFeed

This page is the post-login landing. `app/(platform)/layout.tsx` should redirect `/` to `/overview` when authenticated.

**Test with all 4 personas:**
- admin → sees all services available, all health, admin quick actions
- internal-trader → sees all services available, trader quick actions
- client-full → sees most services available, some locked, client quick actions
- client-data-only → sees Data available, most services locked, limited quick actions

### 5A.7: Update Auth Redirect Logic

**File:** `components/shell/require-auth.tsx` (MODIFY)

Ensure:
- Unauthenticated user on `(platform)` route → redirect to `/login`
- After login → redirect to `/overview` (service hub) NOT back to marketing
- Deep link preservation: if user was trying to reach `/execution/tca`, redirect there after login (store intended destination in session/query param)
- Client user attempting `(ops)` route → 403 with "This area is restricted to internal users"

---

## PHASE 5B: Research / Simulate Service Completion

**Current state:** Routes exist (`/strategy-platform/*`, `/ml/*`, `/quant/*`), marketing page exists (`/services/backtesting`), but pages are stubs or partially wired.

**Reference UIs to consult:**
- `_reference/versa-execution-analytics-ui/` — workflow visualization, candidate comparison
- ML components already exist in `components/ml/`
- Strategy components exist in `components/strategy-platform/`

### 5B.1: Update Public Marketing Page

**File:** `app/(public)/services/backtesting/page.tsx` (MODIFY)

Rename service from "Backtesting" to "Research & Simulation" in the UI. This page should:
- Explain Design → Simulate → Promote lifecycle stages
- Showcase capabilities: strategy backtesting, ML model training, execution simulation, signal development
- Show example outputs (mock backtest results, model performance charts)
- Tiered access explanation (basic vs full)
- CTA → sign up / contact sales

### 5B.2: Build Strategy Platform Product Surface

**Files:** `app/(platform)/strategy-platform/` pages (MODIFY existing stubs)

**Already built (from PLANS_2):**
- MSW handler: `lib/mocks/handlers/strategy.ts` (templates, configs, backtests, candidates, alerts)
- React Query hooks: `hooks/api/use-strategies.ts` (useStrategyTemplates, useStrategyConfigs, useBacktests, useStrategyCandidates, useStrategyAlerts)

Wire these existing hooks into the pages and deepen the UX:

| Page | Purpose | Key Components | Lifecycle Stage |
|------|---------|---------------|----------------|
| `/strategy-platform` | Overview dashboard | Active strategies, recent backtests, candidate pipeline | Design |
| `/strategy-platform/backtests` | Backtest management | Run new, view history, compare results | Simulate |
| `/strategy-platform/results/[id]` | Backtest result detail | P&L curve, drawdown, Sharpe, trade log | Simulate |
| `/strategy-platform/candidates` | Candidate pipeline | Candidates awaiting promotion, comparison view | Promote |
| `/strategy-platform/compare` | Side-by-side comparison | Multiple backtest results compared | Simulate |
| `/strategy-platform/heatmap` | Parameter sensitivity | Heatmap of strategy parameters vs performance | Simulate |
| `/strategy-platform/handoff` | Promote to live | Candidate → paper → live promotion workflow | Promote |

**Key UX patterns from references:**
- Candidate comparison view: side-by-side metrics table + overlaid P&L curves
- Promotion flow: candidate card → review → approve → deploy (status badges at each stage)
- Backtest result: tabbed view (Summary | Trades | Risk | Parameters)

### 5B.3: Build ML Platform Product Surface

**Files:** `app/(platform)/ml/` pages (MODIFY existing stubs)

**Already built (from PLANS_2):**
- MSW handler: `lib/mocks/handlers/ml.ts` (model-families, experiments, training-runs, versions, deployments, features, datasets)
- React Query hooks: `hooks/api/use-ml-models.ts` (useModelFamilies, useExperiments, useTrainingRuns, useModelVersions, useMLDeployments, useFeatureProvenance, useDatasets)

| Page | Purpose | Key Components | Lifecycle Stage |
|------|---------|---------------|----------------|
| `/ml` | ML overview | Model count, training status, inference health | Design |
| `/ml/registry` | Model registry | All models with version, status, metrics | Design |
| `/ml/features` | Feature catalogue | Available features, freshness, usage | Design |
| `/ml/training` | Training management | Active training jobs, history, GPU usage | Simulate |
| `/ml/experiments` | Experiment tracking | Compare experiments, metrics, hyperparameters | Simulate |
| `/ml/validation` | Model validation | Validation results, A/B tests, drift detection | Promote |
| `/ml/deploy` | Model deployment | Deploy models to inference, canary, rollback | Promote |
| `/ml/monitoring` | Inference monitoring | Prediction latency, drift, error rates | Monitor |
| `/ml/governance` | Model governance | Approval workflows, audit trail, lineage | Explain |

**Subscription filtering:**
- `ml-full`: all pages accessible
- `ml-restricted`: inference monitoring only (everything else locked)
- No ML entitlement: entire section locked with upgrade CTA

### 5B.4: Wire Quant Tools

**File:** `app/(platform)/quant/page.tsx` (MODIFY)

Quant tools page bridges Research and Run stages:
- Signal analysis (feature importance, correlation)
- Feature engineering workspace
- Data exploration tools
- Links to both ML and Strategy Platform

---

## PHASE 5C: Trading / Run / Monitor Service Completion

**Current state:** Routes exist, some components built, but not fully wired or deepened.

### 5C.1: Update Public Marketing Page

**File:** `app/(public)/services/execution/page.tsx` (MODIFY)

Rename/expand to cover "Trading & Execution" holistically:
- Live trading capabilities
- Multi-venue execution (CeFi, TradFi, DeFi)
- Position monitoring and risk management
- Real-time alerting
- Execution analytics and TCA

### 5C.2: Trading Dashboard

**File:** `app/(platform)/trading/page.tsx` (MODIFY)

**Already built (from PLANS_2):**
- MSW handlers: `lib/mocks/handlers/trading.ts` (orgs, clients, P&L, timeseries, performance, live-batch-delta), `lib/mocks/handlers/market-data.ts` (candles, orderbook, trades, tickers), `lib/mocks/handlers/positions.ts`, `lib/mocks/handlers/alerts.ts`
- React Query hooks: `hooks/api/use-trading.ts`, `hooks/api/use-market-data.ts`, `hooks/api/use-positions.ts`, `hooks/api/use-alerts.ts`

This is the core Run stage page. Ensure it has:
- Live P&L (simulated via client-side interval, documented as WebSocket gap)
- Position summary (top positions by PnL, by risk)
- Active strategy performance
- Recent fills/orders
- Alert summary (unacknowledged alerts)
- Market overview (key prices)

**Lifecycle color:** Use `--surface-run` (orange) for Run stage visual cues.

### 5C.3: Positions & Risk

**Files:** `app/(platform)/positions/page.tsx`, `app/(platform)/risk/page.tsx` (MODIFY)

Positions:
- Position grid with real-time P&L
- Group by: strategy, venue, instrument, asset class
- Risk metrics per position (delta, vega, theta for options)
- Historical position snapshots

Risk:
- Risk limits dashboard (utilization bars per limit type)
- Exposure breakdown (by venue, by asset class, by strategy)
- VaR components (mock — aspirational API)
- Stress scenarios (mock — aspirational API)
- Greeks portfolio view (mock — aspirational API)

### 5C.4: Execution Analytics

**Files:** `app/(platform)/execution/` pages (MODIFY)

Ensure these are wired and functional:
- `/execution` — overview with key execution metrics
- `/execution/algos` — algorithm performance comparison
- `/execution/venues` — venue connectivity status, latency
- `/execution/tca` — transaction cost analysis (slippage, market impact)
- `/execution/benchmarks` — VWAP, TWAP, implementation shortfall
- `/execution/candidates` — execution strategy candidates

### 5C.5: Alerts

**File:** `app/(platform)/alerts/page.tsx` (MODIFY)

- Alert list with severity filtering (critical/warning/info)
- Acknowledge/resolve actions
- Alert history with search
- Client sees own org alerts, internal sees all
- Real-time alert badge in nav (unacknowledged count)

### 5C.6: Markets

**File:** `app/(platform)/markets/page.tsx` (MODIFY)

- Market data overview (key prices, movers)
- Shard-filtered (CeFi, TradFi, DeFi tabs)
- OHLCV charts for selected instruments
- Order book snapshots
- P&L by market (`/markets/pnl`)

---

## PHASE 5D: Reporting / Explain / Reconcile Service Completion

**Current state:** `/reports` page has good content (700+ lines). Marketing page exists. Admin/ops surfaces are stubs.

**Reference UIs:**
- `_reference/versa-client-reporting/` — PRIMARY reference (P&L tabs, settlement workflow)
- `_reference/versa-invoicing/` — Invoice generation and payment tracking

### 5D.1: Update Public Marketing Page

**File:** `app/(public)/services/investment/page.tsx` (MODIFY)

Rename to "Reporting & Investment Management":
- P&L and performance reporting
- Settlement and reconciliation
- Invoice and fee transparency
- Regulatory reporting
- Client portal access

### 5D.2: Deepen Reports Product Surface

**File:** `app/(platform)/reports/page.tsx` (MODIFY)

Current page has good tabs (Portfolio, Reports, Settlements, Invoices, Treasury). Deepen each:

**Portfolio tab:**
- AUM chart (time series)
- Performance attribution (by strategy, by asset class, by venue)
- Benchmark comparison
- Risk-adjusted returns (Sharpe, Sortino, Max Drawdown)

**Reports tab:**
- Report generation wizard (select period, strategies, format)
- Report templates (monthly performance, quarterly review, annual)
- Download as PDF / send via email (mock actions)
- Report history with status (draft, reviewed, sent)

**Settlements tab:**
- Settlement calendar (upcoming, overdue)
- Settlement detail view (counterparty, amount, status)
- Reconciliation status (matched, unmatched, disputed)
- Auto-reconciliation results

**Invoices tab (reference: `_reference/versa-invoicing/`):**
- Invoice list with payment status (paid, pending, overdue)
- Invoice detail view (line items, fees, taxes)
- Fee schedule transparency
- Download/send actions

**Treasury tab:**
- Capital allocation by venue/strategy
- Cash flow projections
- Recent transfers
- Margin requirements

### 5D.3: Executive Dashboard

**File:** `app/(platform)/executive/page.tsx` (MODIFY)

C-level view:
- Portfolio-level KPIs (AUM, MTD Return, YTD Return, Sharpe)
- Top performing / worst performing strategies
- Risk utilization summary
- Pending settlements / outstanding invoices
- Recent compliance events

### 5D.4: Fee Management (Ops)

**File:** `app/(ops)/manage/fees/page.tsx` (MODIFY)

Internal fee management:
- Fee schedule editor per client org
- Fee type management (management fees, performance fees, data fees, compute fees)
- Fee simulation (what-if analysis)
- Billing cycle management

### 5D.5: Mandate Management (Ops)

**File:** `app/(ops)/manage/mandates/page.tsx` (MODIFY)

Internal mandate management:
- Client mandate configurations
- Investment guidelines and restrictions
- Benchmark assignments
- Reporting frequency settings

---

## PHASE 5E: Admin / Onboarding Service Completion

**Current state:** `/admin` route exists with minimal stub. No onboarding flow beyond basic login/signup.

**Reference UIs:**
- `_reference/versa-admin-ui/` — PRIMARY (user management, org hierarchy, role assignment)
- `_reference/versa-onboarding/` — Guided setup flows

### 5E.1: Admin Dashboard

**File:** `app/(ops)/admin/page.tsx` (MODIFY)

Build the internal admin dashboard:
- Organization list (all client orgs, with status, subscription tier, user count)
- Quick actions: create org, manage subscriptions, view billing
- System stats: total users, active orgs, MRR, service usage

### 5E.2: Organization Management

**File:** `app/(ops)/manage/clients/page.tsx` (MODIFY)

Per-organization management:
- Org detail view (name, contact, subscription, billing)
- User list within org (role, last login, status)
- Subscription management (add/remove services, change tier)
- API key management (view, revoke, generate)
- Usage analytics (API calls, compute hours, data queries)

### 5E.3: User Management

**File:** `app/(ops)/manage/users/page.tsx` (MODIFY)

Cross-org user management (internal only):
- User grid (name, org, role, last login, status)
- Role assignment (owner, admin, trader, quant, compliance, viewer)
- Invite flow (email invite with role pre-assignment)
- Deactivate / suspend user
- Audit trail per user (recent actions)

### 5E.4: Onboarding Flow

**Files:** `app/(public)/signup/page.tsx` (MODIFY), `components/platform/onboarding-wizard.tsx` (NEW)

Improve the signup → first-use experience:

**Signup page:**
- Organization registration form (company name, contact, size)
- Interest selection (which services, what asset classes)
- Demo mode entry (skip registration, use demo persona)

**Post-signup onboarding wizard** (shown on first login):
- Welcome step (explain the platform, show available services)
- Service selection step (choose initial services to explore)
- Data preferences (which asset classes, which venues)
- Role assignment (if org admin, set up team roles)
- Tutorial/demo option (guided tour of key features)

Reference patterns from `_reference/versa-onboarding/`:
- Progress indicator (step X of Y)
- Skip option (experienced users can skip onboarding)
- Role-specific paths (trader onboarding ≠ quant onboarding)

---

## PHASE 5F: Deployment / DevOps Service Completion

**Current state:** `/devops` and `/ops` routes exist with minimal stubs.

**Reference UIs:**
- `_reference/deployment-ui/` — PRIMARY (production-grade deployment UI)
- `_reference/deployment-api/` — 92 API endpoints for deployment operations
- `_reference/deployment-service/` — Orchestration patterns

**IMPORTANT:** This service area should be PORTED from `_reference/deployment-ui/`, not built from scratch. The deployment-ui has 17K+ lines of production-grade UI (20 components, 67 types, 5 hooks). See ARCHITECTURE_HARDENING.md §10 for the porting checklist.

**Porting approach:**
1. Copy component files from `_reference/deployment-ui/src/components/` to `components/ops/`
2. Replace `react-router-dom` → Next.js `Link` + `useRouter`
3. Replace `@unified-trading/ui-kit` → `@/components/ui/` (shadcn)
4. Replace `createApiClient()` → `fetchWithPersona()` from our hooks
5. Replace inline state → React Query hooks (`useDeploymentServices`, `useDeployments`, `useBuildTriggers`)
6. Copy types from `_reference/deployment-ui/src/types/index.ts` to `lib/types/deployment.ts`

### 5F.1: DevOps Dashboard

**File:** `app/(ops)/devops/page.tsx` (MODIFY)

**Already built (from PLANS_2):**
- MSW handlers: `lib/mocks/handlers/deployment.ts` (services, deployments, builds), `lib/mocks/handlers/service-status.ts` (overview, features)
- React Query hooks: `hooks/api/use-deployments.ts` (useDeploymentServices, useDeployments, useBuildTriggers), `hooks/api/use-service-status.ts` (useServiceOverview, useFeatureFreshness)

Build the deployment control center:

**Tab structure (reference: deployment-ui):**
1. **Deploy** — Trigger deployments, select environment, select services
2. **Services** — Service inventory with current version, health, last deploy
3. **Builds** — Cloud Build history, status, logs
4. **Readiness** — Pre-deployment readiness checks (all green = safe to deploy)
5. **Config** — Environment configuration, feature flags, secrets reference
6. **History** — Deployment history with rollback option

**Key patterns from deployment-ui reference:**
- Service health aggregation (poll all services, show aggregate)
- Deployment progress (SSE-style updates — mock with interval for now)
- Rollback controls (one-click rollback to previous version with confirmation)
- Environment selector (dev → staging → production)
- Shard-aware deployment (deploy per shard or all shards)

### 5F.2: Ops Dashboard

**File:** `app/(ops)/ops/page.tsx` (MODIFY)

Operational overview:
- System health aggregate (all services)
- Job queue status (pending, running, failed jobs)
- Resource utilization (CPU, memory, disk — mock)
- Recent incidents / alerts
- Service dependency graph (which services depend on which)

### 5F.3: Service Status Pages

**Files:** `app/(ops)/ops/services/page.tsx`, `app/(ops)/ops/jobs/page.tsx` (MODIFY)

Service status:
- Per-service health detail (uptime, latency, error rate)
- Health history (last 24h, 7d, 30d)
- Dependency status (upstream/downstream services)
- Configuration viewer

Job monitoring:
- Job queue overview (by service, by type)
- Active jobs with progress
- Failed jobs with error details
- Job retry/cancel actions

### 5F.4: Config Management

**File:** `app/(ops)/config/page.tsx` (MODIFY)

System configuration (internal only):
- Feature flags (toggle features on/off)
- Service toggles (enable/disable services)
- Environment variables viewer (read-only, no secrets)
- Configuration diff (compare environments)

---

## PHASE 5G: Audit / Compliance Service Completion

**Current state:** `/compliance` route exists with minimal stub. Marketing page at `/services/regulatory`.

**Reference UI:** `_reference/versa-audit-ui/` — PRIMARY

### 5G.1: Update Public Marketing Page

**File:** `app/(public)/services/regulatory/page.tsx` (MODIFY)

Explain compliance capabilities:
- Full audit trail for all trading operations
- Regulatory reporting (MiFID II, FCA)
- Event provenance and lineage
- Compliance evidence collection
- Client-facing audit access (own org only)

### 5G.2: Compliance Product Surface (Client + Internal)

**File:** `app/(platform)/compliance/page.tsx` (MODIFY — exists in `(ops)`, consider split)

**Important architectural decision:** Compliance has BOTH client-facing and internal-only surfaces.

**Client view** (in `(platform)`):
- Own org's audit trail (filtered)
- Compliance status summary
- Regulatory reports (own org)
- Evidence downloads (own org)

**Internal view** (in `(ops)` or same page with role-aware depth):
- Cross-org audit trail
- Full event history with powerful filtering
- Compliance report generation
- Evidence collection and export
- Regulatory submission tracking
- Compliance rule management

**Key patterns from `_reference/versa-audit-ui/`:**
- Event timeline visualization (chronological event stream with filters)
- Event detail modal (full event payload, related events, provenance chain)
- Filter bar (date range, event type, severity, service, user, org)
- Evidence collection (select events → generate evidence package)
- Compliance dashboard (checks passed/failed, upcoming deadlines)

### 5G.3: Engagement / Client Success (Ops)

**File:** `app/(ops)/engagement/page.tsx` (MODIFY)

Internal tool for client relationship management:
- Client engagement metrics (logins, feature usage, support tickets)
- Onboarding progress tracking
- Churn risk indicators
- NPS / satisfaction scores
- Upcoming renewals / contract events

---

## PHASE 5H: Navigation & Shell Updates

### 5H.1: Update Lifecycle Navigation

**File:** `components/shell/lifecycle-nav.tsx` (MODIFY)

Ensure navigation groups align with lifecycle stages:

```
Design
  ├── Strategy Platform
  ├── ML Registry
  ├── Feature Lab
  └── Data Catalogue

Simulate
  ├── Backtests
  ├── Experiments
  └── Candidate Comparison

Promote
  ├── Candidate Pipeline
  ├── Model Validation
  └── Deployment Review

Run
  ├── Trading Dashboard
  ├── Positions
  ├── Execution
  └── Markets

Monitor
  ├── Risk Dashboard
  ├── Alerts
  ├── Health Status
  └── Performance

Explain
  ├── Reports
  ├── Executive Dashboard
  ├── P&L Attribution
  └── Compliance

Reconcile
  ├── Settlements
  ├── Invoices
  ├── Treasury
  └── Audit Trail
```

### 5H.2: Update Service Registry

**File:** `lib/config/services.ts` (MODIFY)

Ensure `PLATFORM_SERVICES` array includes ALL service areas with correct:
- lifecycle_stage alignment
- entitlement_required values
- visibility (public/client/internal)
- health_check_url
- Route mappings

### 5H.3: Update Navigation Visibility Logic

**File:** `app/(platform)/layout.tsx` (MODIFY)

Navigation items filtered by:
1. `permission_level`: client can't see ops items
2. `service_entitlements`: locked services shown as disabled (not hidden)
3. `role`: role-specific quick actions

---

## PHASE 5I: Commercial Packaging UX

### 5I.1: Locked Service State Component

**File:** `components/platform/locked-service.tsx` (NEW)

Reusable component for when a user visits a service they don't have access to:
- Service name and description
- What's included in the service
- Which package includes this service
- "Contact Sales" CTA
- "Request Trial" secondary CTA
- Visual: grayed page skeleton with lock overlay

### 5I.2: Subscription Display

**File:** `components/platform/subscription-badge.tsx` (NEW)

Small badge showing current subscription tier, shown in shell header:
- Package name (e.g., "Data Pro", "Full Suite")
- Quick link to subscription management
- Usage summary (if applicable)

### 5I.3: Data Export Premium Feature

**File:** `components/data/export-modal.tsx` (NEW or MODIFY)

On data pages, "Export Data" button shows modal:
- Platform usage included in subscription
- Cloud export (GCP/AWS) = premium add-on
- CSV/Parquet download = premium add-on
- "Contact sales for export pricing"
- Show sample pricing tiers

---

## EXECUTION ORDER & DEPENDENCIES

```
PHASE 5A (Hub)          ─── no deps ──→ START HERE
    │
    ├── 5A.1-5A.5 (components) → 5A.6 (wire page) → 5A.7 (redirect logic)
    │
PHASE 5B (Research)     ─── depends on 5A (hub links to services)
PHASE 5C (Trading)      ─── depends on 5A
PHASE 5D (Reporting)    ─── depends on 5A
    │
    ├── 5B, 5C, 5D are PARALLEL (no cross-dependencies)
    │
PHASE 5E (Admin)        ─── depends on 5A (hub shows admin for internal)
PHASE 5F (DevOps)       ─── depends on 5A
PHASE 5G (Compliance)   ─── depends on 5A
    │
    ├── 5E, 5F, 5G are PARALLEL (no cross-dependencies)
    │
PHASE 5H (Navigation)   ─── depends on 5B-5G (nav items from all services)
PHASE 5I (Commercial)   ─── depends on 5A (locked states in hub)
```

**Parallelization strategy:** After 5A is complete, all service-area phases (5B through 5G) can run in parallel using separate agents. Each agent needs only:
1. Its service area's reference UI
2. The hub component API (how to register in service grid)
3. The MSW handler for its service (from PLANS_2)
4. The cursorrules and architecture docs

---

## QUALITY GATES

### Per-Phase QG

After completing each phase:
```bash
pnpm lint && pnpm tsc --noEmit && pnpm build
```

### Persona Testing (after each service area)

Test with all 4 personas:
1. **admin** — sees all services, all data, ops surfaces
2. **internal-trader** — sees all platform services, no ops
3. **client-full** — sees most services, some locked, org-scoped data
4. **client-data-only** — sees Data only, most services locked

### Service Hub Testing (after 5A)

- [ ] Hub renders for all 4 personas with correct service states
- [ ] Available services navigate to product surface
- [ ] Locked services open upgrade modal
- [ ] Hidden services not rendered
- [ ] Activity feed shows persona-scoped events
- [ ] Quick actions match role
- [ ] Health bar shows correct service health

### Final QG (after all phases)

```bash
pnpm lint && pnpm tsc --noEmit && pnpm build && pnpm test
```

- [ ] All routes resolve without 404
- [ ] No console errors on any page
- [ ] All 4 personas see correct service states
- [ ] Navigation aligns with lifecycle model
- [ ] Locked services show upgrade path
- [ ] Client users cannot access ops routes
- [ ] Service hub is the post-login landing page
- [ ] Deep links work (login preserves destination)

---

## DELIVERABLES

After this plan is complete:

1. **SERVICE_COMPLETION_STATUS.md** updated — all services at ✅ or 🟡 (no 🔴 stubs)
2. **UI_STRUCTURE_MANIFEST.json** → `service_completion` updated
3. **PROGRESS.md** updated with Phase 5 completion
4. **BACKEND_ALIGNMENT.md** updated with any new aspirational endpoints discovered
5. **Post-login service hub** functional with all service cards
6. **All service areas** have at least product-layer pages wired to React Query
7. **Commercial packaging** visible (locked states, upgrade CTAs)
8. **Navigation** lifecycle-aligned across all shells

---

## INTERACTIVITY REQUIREMENTS (NOT SLIDES)

Every page must have WORKING interactions, not just data display. Mock data changes
when users take actions. State persists within the session (Zustand stores).

| Action | What Must Happen |
|--------|-----------------|
| Create new strategy | Form → submit → new strategy appears in list → toast confirmation |
| Run backtest | Select strategy → configure params → "Run" → progress bar → results appear |
| Set up ML experiment | Configure model/features/target → "Train" → experiment appears in list |
| Generate grid config | Select parameter ranges → "Generate" → grid configs appear |
| Place trade | Order form → submit → fill appears in "Own Trades" → position updates |
| Create user/org | Admin form → submit → new org/user in management list |
| Generate report | Select params → "Generate" → report appears in list with "Ready" status |
| Acknowledge alert | Click "Acknowledge" → alert status changes → count updates |
| Confirm settlement | Click "Confirm" → status changes to "Confirmed" |
| Deploy service | Select service/env → "Deploy" → deployment appears with progress |

These use Zustand stores and MSW handlers to persist state within the demo session.
The "Reset Demo" button (in shell debug panel) clears all state back to initial.

---

## RULES

- Same pages, different data. NEVER build separate client/internal versions.
- Check `_reference/REFERENCE_MAPPING.md` BEFORE building any service area.
- Extract PATTERNS from references, don't copy code.
- Use lifecycle-aligned naming (Design/Simulate/Promote/Run/Monitor/Explain/Reconcile).
- Every service page must check entitlements and show locked state if not subscribed.
- Every data page must be shard-aware and org-scoped.
- Update `SERVICE_COMPLETION_STATUS.md` after completing each service area.
- Update `PROGRESS.md` after every sub-task.
- Commit after each logical unit of work.
- If a backend API doesn't exist yet, mock it and document as ASPIRATIONAL in the handler.
- The post-login hub (`/overview`) is the single most important page. Get it right first.
