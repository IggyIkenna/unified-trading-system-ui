# Architecture Hardening — Doc & Rule Updates for Service Completion

**Purpose:** This document specifies exactly what docs, rules, and structural definitions need to be updated so that any agent working on this repo in isolation has full clarity on how to complete all service areas to production standard.

**Status:** Ready for execution
**Created:** 2026-03-19

---

## 1. Problem Statement

The repo has strong structural foundations (Phase 2 complete) but the documentation and rules still reflect a **Data-service-first world**. The Data service has four clean layers (public → portal → admin → internal/ETL). The other service areas do NOT yet have equivalent architectural clarity in the docs.

An agent arriving fresh and reading the current docs would:
- Know how to build Data pages (clear four-layer pattern)
- NOT know how to consistently build Research/Simulate, Run/Monitor, Explain/Reconcile, Admin, Deployment, or Audit pages
- NOT have clear guidance on the post-login service hub as a central experience
- NOT understand how the reference UIs (`_reference/`) map to implementation tasks vs design inspiration
- NOT have a clear commercial packaging → UI entitlement mapping

This document fixes that by specifying every doc/rule update needed.

---

## 2. Updates to ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md

### 2A. Add: Generalized Service Layer Model (new §6.1)

Insert after §6 "Service / Product Areas". This makes the Data pattern the canonical template:

```markdown
## 6.1 Service Layer Model (Generalized from Data)

Every service area MUST define up to four access layers. Not every service needs all four,
but the pattern must be explicitly decided per service.

| Layer | Route Pattern | Auth | Audience | Purpose |
|-------|--------------|------|----------|---------|
| **Public** | `(public)/services/{service}` | None | Prospects | Marketing, demo, capability showcase |
| **Product** | `(platform)/{service}/*` | Required | Client + Internal | The actual product surface (same pages, API-scoped data) |
| **Admin** | `(ops)/admin/{service}` | Internal + role | Internal admins | Cross-org management, billing, configuration |
| **Internal Ops** | `(ops)/internal/{service}` | Internal + ops role | Ops team | Pipeline management, health, debugging |

### Per-Service Layer Decisions

| Service Area | Public | Product | Admin | Internal Ops |
|-------------|--------|---------|-------|--------------|
| **Data** | ✅ `/services/data` | ✅ `/data/*`, `/portal/data` | 🟡 `/admin/data` (basic) | 🟡 `/internal/data-etl` (basic) |
| **Research / Simulate** | ✅ `/services/backtesting` | ✅ `/strategy-platform/*`, `/ml/*`, `/quant/*` | ❌ (managed via platform) | ❌ (no separate ops surface) |
| **Trading / Run / Monitor** | ✅ `/services/execution` | ✅ `/trading/*`, `/positions/*`, `/risk/*`, `/execution/*`, `/markets/*`, `/alerts/*` | ❌ | ✅ `/internal/trading-ops` (future: live intervention, kill switches) |
| **Reporting / Explain / Reconcile** | ✅ `/services/investment` | ✅ `/reports/*`, `/executive/*` | ✅ `/manage/fees`, `/manage/mandates` | ✅ `/internal/settlement-ops` (future) |
| **Admin / Onboarding** | ❌ (hidden) | ❌ (hidden from clients) | ✅ `/admin/*`, `/manage/*` | ❌ |
| **Deployment / DevOps** | ❌ (hidden) | ❌ (hidden from clients) | ❌ | ✅ `/devops/*`, `/ops/*` |
| **Audit / Compliance** | ✅ `/services/regulatory` (light) | ✅ `/compliance` (client: own org audit trail) | ❌ | ✅ `/compliance` (internal: full cross-org) |
```

### 2B. Expand: Post-Login Service Hub (replace §7)

The current §7 is conceptually correct but too brief. Replace with:

```markdown
## 7. Post-Login Service Hub

### 7.1 The Hub is the Central Experience

After authentication, ALL users land on `/overview` — the service-aware hub.
This is NOT a dashboard with random widgets. It is the **service discovery and entry point**.

### 7.2 Hub Sections

1. **Service Grid** — Cards for each service area, showing:
   - Service name, icon, lifecycle stage color
   - Status: Available | Locked | Hidden
   - For available: quick-stats (e.g., "12 active strategies", "3 pending settlements")
   - For locked: "Upgrade" CTA with brief explanation of what the service provides
   - Click → navigate to the product surface for that service

2. **Activity Feed** — Recent cross-service activity:
   - "Strategy Alpha-7 promoted to live" (Research → Run transition)
   - "Settlement #4521 completed" (Reconcile)
   - "Alert: Risk limit breach on venue Binance" (Monitor)

3. **Quick Actions** — Role-aware shortcuts:
   - Client quant: "New Backtest", "View Models", "Check Data Status"
   - Internal trader: "Trading Dashboard", "Risk Overview", "Deployment Status"
   - Admin: "Manage Users", "View Audit Log", "System Health"

4. **System Health Bar** — Aggregate service health (green/yellow/red per service)
   - Internal: all services visible
   - Client: only subscribed services visible

### 7.3 Service Card States

| State | Visual | Interaction | Who Sees It |
|-------|--------|-------------|-------------|
| **Available** | Full color, active | Click → product surface | Subscribed users |
| **Locked** | Grayed, lock icon | Click → upgrade modal | Users without entitlement |
| **Hidden** | Not rendered | N/A | Wrong role (client can't see admin) |
| **Degraded** | Yellow border, warning icon | Click → product surface + status banner | Subscribed users when service is unhealthy |

### 7.4 Implementation

- Source: `lib/config/services.ts` `SERVICE_REGISTRY` array + `getVisibleServices()` (already built)
- Filtering: `useAuth()` provides `entitlements[]`, `role`, and `isInternal()`
- React Query hooks: `hooks/api/use-service-status.ts` (useServiceOverview, useFeatureFreshness) — already built
- Component: `components/platform/service-hub.tsx` (new)
- Page: `app/(platform)/overview/page.tsx` (exists, needs rebuild)
```

### 2C. Add: Commercial Packaging → UI Mapping (new §11.1)

After §11 "Commercial Modularity":

```markdown
## 11.1 Commercial Packaging → UI Entitlement Mapping

| Package | Entitlements | Services Visible | Services Locked |
|---------|-------------|------------------|-----------------|
| **Data Only** | `data-basic` | Data (basic catalogue, 180 instruments) | Research, Execution, Reporting |
| **Data Pro** | `data-pro` | Data (full catalogue, 2400 instruments, API keys) | Research, Execution, Reporting |
| **Data + Research** | `data-pro`, `strategy-full`, `ml-full` | Data, Research/Simulate (full backtest, ML) | Execution, Reporting |
| **Data + Execution** | `data-pro`, `execution-full` | Data, Trading/Execution (live) | Research (limited), Reporting |
| **Full Suite** | `data-pro`, `strategy-full`, `ml-full`, `execution-full`, `reporting-full` | All client-facing services | None |
| **Custom** | Bespoke | As negotiated | As negotiated |

### Compute Entitlements (Future)

Beyond service access, compute-intensive features have usage limits:
- Backtest compute hours (per month)
- ML training GPU hours
- Data API call limits
- Export bandwidth

These are NOT enforced in the current demo but the UI should show:
- Usage meters on relevant service pages
- "X of Y compute hours used this month"
- Upgrade CTAs when approaching limits
```

---

## 3. Updates to .cursorrules

### 3A. Add: Service Layer Pattern (new section after §1)

```
## §1.5 Service Layer Pattern (Canonical)

Every service area follows the Data service pattern. When building a new service page:

1. Check the Per-Service Layer Decisions table in ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md §6.1
2. Identify which layers this service needs (public, product, admin, internal ops)
3. Build ONLY the layers that are marked ✅ for that service
4. Use the reference UI in _reference/ for design patterns (see REFERENCE_MAPPING.md)

### Service Page Template

Every product-layer service page MUST include:
- Entitlement check (show locked state if not subscribed)
- Org-scoping (client sees own data, internal sees all)
- Shard-awareness where data is shard-partitioned
- Loading/error states via React Query
- Context bar with relevant filters (org, venue, strategy, date range)

### The Post-Login Hub is Sacred

`/overview` is the service hub. It is NOT a generic dashboard.
Every service links FROM the hub. Users discover services THROUGH the hub.
Do not create orphan service pages that bypass the hub navigation.
```

### 3B. Add: Reference UI Usage Rules (new section)

```
## §1.6 Reference UI Usage Rules

The `_reference/` directory contains 8 prior UI implementations.
They are design references, NOT copy-paste sources.

### How to Use References

1. BEFORE building a service area, read the corresponding reference in _reference/
2. Extract 2-3 key design PATTERNS (not code)
3. Implement those patterns using the current architecture (React Query + MSW + Zustand)
4. Document which reference patterns you used in a comment at the top of the page

### Reference → Service Mapping

| Building This | Check This Reference | Key Patterns to Extract |
|--------------|---------------------|----------------------|
| Admin pages | `_reference/versa-admin-ui/` | User grid, role toggles, subscription matrix, integration cards |
| Audit/Compliance | `_reference/versa-audit-ui/` | Event filtering, provenance viz, evidence collection, timeline |
| Reports/Settlement | `_reference/versa-client-reporting/` | P&L tabs, client/internal split, download/send, fee transparency |
| Execution analytics | `_reference/versa-execution-analytics-ui/` | Order flow, venue status, TCA visualization, fill analysis |
| Invoicing | `_reference/versa-invoicing/` | Template rendering, payment status, fee breakdowns |
| Onboarding flows | `_reference/versa-onboarding/` | Guided setup, role-specific paths, demo data, progress indicators |
| Deployment/DevOps | `_reference/deployment-ui/` | Pipeline status, health aggregation, rollback UX, SSE patterns |
| Deployment API | `_reference/deployment-api/` | 92 endpoints, health check aggregation, audit logging |

### What NOT to Do

- Do NOT import from _reference/ directories
- Do NOT copy component files wholesale
- Do NOT use old state management patterns (references use various approaches)
- Do NOT adopt reference routing — use the current route group structure
```

### 3C. Add: Lifecycle-Aligned Naming Rules (new section)

```
## §1.7 Lifecycle-Aligned Naming

Service areas, navigation labels, and page titles MUST align with the lifecycle model:

| Lifecycle Stage | Nav Label | Service Area | Color Token |
|----------------|-----------|-------------|-------------|
| Design | Design | Research / Simulate | `--surface-design` (purple) |
| Simulate | Simulate | Research / Simulate | `--surface-simulate` (blue) |
| Promote | Promote | Research → Trading handoff | `--surface-promote` (green) |
| Run | Run | Trading / Execution | `--surface-run` (orange) |
| Monitor | Monitor | Trading / Execution, Alerting | `--surface-monitor` (red) |
| Explain | Explain | Reporting, Analytics | `--surface-explain` (cyan) |
| Reconcile | Reconcile | Reporting, Settlement | `--surface-reconcile` (yellow) |

### Naming Rules

- Navigation groups use lifecycle stage names, not arbitrary categories
- Page titles can be more specific (e.g., "Backtest Results" under Simulate)
- Service hub cards use the service area name (e.g., "Research & Simulation")
- Internal documentation uses both (e.g., "Research/Simulate service — Design & Simulate stages")

### Forbidden Names

Do NOT use these as primary navigation labels:
- "Build" (too vague — use Design or Simulate)
- "Analyse" (too vague — use Explain)
- "Explore" (too vague — use the specific lifecycle stage)
- "Research" alone (use "Research & Simulation" or map to Design/Simulate)
```

---

## 4. Updates to REFACTORING_PLAN_PHASE_1-4.md

### 4A. Add Phase 5 Scope (append after Phase 5 stub)

The current Phase 5 is a one-line stub. Expand it:

```markdown
## Phase 5: Service Completion & Architecture Hardening

### 5.1 Generalize Service Layering

For each service area, implement the layers defined in ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md §6.1:

| Service Area | What Needs Building | Reference |
|-------------|-------------------|-----------|
| Research / Simulate | Deepen `/strategy-platform/*` and `/ml/*` with lifecycle-aligned naming, candidate promotion flow, backtest comparison views | `_reference/versa-execution-analytics-ui/` (workflow viz) |
| Trading / Run / Monitor | Wire `/trading/*`, `/positions/*`, `/risk/*` to React Query, add real-time simulation, alert acknowledgment | Current trading components |
| Reporting / Explain / Reconcile | Deepen `/reports/*` with P&L attribution, settlement workflow, invoice generation | `_reference/versa-client-reporting/`, `_reference/versa-invoicing/` |
| Admin / Onboarding | Build org management, user roles, subscription management, onboarding flow | `_reference/versa-admin-ui/`, `_reference/versa-onboarding/` |
| Deployment / DevOps | Build deployment pipeline UI, service health aggregation, rollback controls | `_reference/deployment-ui/`, `_reference/deployment-api/` |
| Audit / Compliance | Build audit trail viewer, compliance dashboard, evidence collection | `_reference/versa-audit-ui/` |

### 5.2 Service Hub Centralization

- Rebuild `/overview` as the service-aware hub (see ARCHITECTURE §7)
- Implement service card states (available, locked, hidden, degraded)
- Add activity feed with cross-service events
- Add quick actions per role
- Add system health bar

### 5.3 Commercial Packaging UX

- Implement locked service states with upgrade CTAs
- Add subscription tier display on relevant pages
- Add usage meters (compute hours, API calls) — mock for now
- Add "Contact sales" modals for premium features (data export, bespoke access)

### 5.4 Entry Point Logic

- Public → sign-up → service hub flow must be seamless
- Post-login redirect must go to `/overview` (service hub), NOT a marketing page
- Deep links must work (bookmark `/execution/tca` → login → redirect to `/execution/tca`)
- Demo personas must demonstrate all entry point variations
```

---

## 5. New File: SERVICE_COMPLETION_STATUS.md

Create this file at repo root as a living tracker of which service areas are complete:

```markdown
# Service Completion Status

Last updated: 2026-03-19

## Service Layer Completion Matrix

| Service Area | Public Marketing | Product Surface | Admin | Internal Ops | Overall |
|-------------|-----------------|----------------|-------|-------------|---------|
| **Data** | ✅ Complete | ✅ Complete | 🟡 Basic | 🟡 Basic | 🟡 MOSTLY DONE |
| **Research / Simulate** | 🟡 Basic (`/services/backtesting`) | 🟡 Routes exist, stubs | ❌ N/A | ❌ N/A | 🟡 PARTIAL |
| **Trading / Run / Monitor** | 🟡 Basic (`/services/execution`) | 🟡 Routes exist, some components | ❌ N/A | ❌ Not started | 🟡 PARTIAL |
| **Reporting / Explain / Reconcile** | 🟡 Basic (`/services/investment`) | 🟡 `/reports` has content | 🟡 `/manage/fees` exists | ❌ Not started | 🟡 PARTIAL |
| **Admin / Onboarding** | ❌ Hidden | ❌ Hidden | 🔴 Stub only | ❌ N/A | 🔴 STUB |
| **Deployment / DevOps** | ❌ Hidden | ❌ Hidden | ❌ N/A | 🔴 Stub only | 🔴 STUB |
| **Audit / Compliance** | 🟡 Basic (`/services/regulatory`) | 🔴 Stub | ❌ N/A | 🔴 Stub | 🔴 STUB |

## Post-Login Hub Status

| Component | Status |
|-----------|--------|
| Service grid with entitlement states | 🔴 Not implemented |
| Activity feed | 🔴 Not implemented |
| Quick actions | 🔴 Not implemented |
| System health bar | 🔴 Not implemented |
| Locked service upgrade modals | 🔴 Not implemented |

## Completion Legend

- ✅ Complete — functional, data-wired, persona-tested
- 🟡 Partial — routes/components exist but not fully wired or lacking depth
- 🔴 Stub — route exists but minimal/placeholder content
- ❌ Not applicable or not started
```

---

## 6. Updates to UI_STRUCTURE_MANIFEST.json

Add a new top-level key `service_completion` that tracks per-service status. This gives agents machine-readable state:

```json
{
  "service_completion": {
    "data": { "public": "complete", "product": "complete", "admin": "complete", "ops": "complete" },
    "research_simulate": { "public": "basic", "product": "stub", "admin": "n/a", "ops": "n/a" },
    "trading_run_monitor": { "public": "basic", "product": "partial", "admin": "n/a", "ops": "not_started" },
    "reporting_explain_reconcile": { "public": "basic", "product": "partial", "admin": "partial", "ops": "not_started" },
    "admin_onboarding": { "public": "hidden", "product": "hidden", "admin": "stub", "ops": "n/a" },
    "deployment_devops": { "public": "hidden", "product": "hidden", "admin": "n/a", "ops": "stub" },
    "audit_compliance": { "public": "basic", "product": "stub", "admin": "n/a", "ops": "stub" },
    "service_hub": "not_started"
  }
}
```

---

## 7. Updates to START_HERE.md

### 7A. Add: Service Completion Context (new section after onboarding)

```markdown
## Current Service Completion State

Before building any feature, check `SERVICE_COMPLETION_STATUS.md` to understand what's done.

**Fully complete:** Data service (all 4 layers)
**Partially built:** Research/Simulate, Trading/Run/Monitor, Reporting
**Stubs only:** Admin, Deployment/DevOps, Audit/Compliance
**Not started:** Post-login service hub, commercial packaging UX

### The Pattern to Follow

The Data service is the canonical example. Every service should eventually have the same
layered quality. When building a new service, follow Data's pattern:
1. Public marketing page with capability showcase
2. Product surface with org-scoped, subscription-filtered data
3. Admin/internal ops layer where applicable

See ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md §6.1 for the per-service layer matrix.
```

### 7B. Add: Reference UI Quick Guide

```markdown
## Reference UIs (_reference/)

Before building a service area, check the corresponding reference UI:

| Service | Reference | What to Look For |
|---------|-----------|-----------------|
| Admin | `_reference/versa-admin-ui/` | User management UX, role grids |
| Audit | `_reference/versa-audit-ui/` | Event timeline, compliance reporting |
| Reporting | `_reference/versa-client-reporting/` | P&L tabs, settlement workflow |
| Execution | `_reference/versa-execution-analytics-ui/` | TCA viz, order flow |
| Invoicing | `_reference/versa-invoicing/` | Invoice templates, fee display |
| Onboarding | `_reference/versa-onboarding/` | Guided setup flows |
| DevOps | `_reference/deployment-ui/` | Pipeline status, health aggregation |

These are design references — extract patterns, don't copy code.
See REFERENCE_MAPPING.md for detailed assessment.
```

---

## 8. Updates to ROUTES.md

The current ROUTES.md is outdated (still references old route structure and "separate app" comments that are incorrect post-Phase-2). It needs a full rewrite to reflect the three route groups and service layer model.

Replace with a comprehensive route map organized by service area and layer, showing status (complete/partial/stub/planned). Include the lifecycle stage alignment for each route.

Key changes:
- Remove "Routes to Delete" section (those routes were already handled in Phase 2)
- Add all `(platform)` routes with their service area and lifecycle stage
- Add all `(ops)` routes with their access requirements
- Add service hub route (`/overview`) with its central role
- Mark each route's completion status

---

## 9. New Rule: Agent Pre-Flight Checklist

Add to `.cursorrules` at the top:

```
## §0 Agent Pre-Flight Checklist

Before writing ANY code in this repo, complete this checklist:

1. [ ] Read ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md (platform vision, service layers, roles)
2. [ ] Read SERVICE_COMPLETION_STATUS.md (what's done, what's not)
3. [ ] Read UI_STRUCTURE_MANIFEST.json `service_completion` (machine-readable state)
4. [ ] Identify which service area your task belongs to
5. [ ] Check the Per-Service Layer Decisions table (§6.1) for which layers to build
6. [ ] Check _reference/REFERENCE_MAPPING.md for relevant reference UIs
7. [ ] Check context/API_FRONTEND_GAPS.md for API readiness
8. [ ] Check context/SHARDING_DIMENSIONS.md if your service handles data

Only then proceed with implementation.
```

---

## 10. Summary of All Changes

| File | Action | What Changes |
|------|--------|-------------|
| `ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md` | UPDATE | Add §6.1 (service layer model), expand §7 (service hub), add §11.1 (commercial mapping) |
| `.cursorrules` | UPDATE | Add §0 (pre-flight), §1.5 (service layer pattern), §1.6 (reference usage), §1.7 (lifecycle naming) |
| `REFACTORING_PLAN_PHASE_1-4.md` | UPDATE | Expand Phase 5 with service completion scope |
| `SERVICE_COMPLETION_STATUS.md` | CREATE | Living tracker of per-service completion |
| `UI_STRUCTURE_MANIFEST.json` | UPDATE | Add `service_completion` key |
| `START_HERE.md` | UPDATE | Add service completion context, reference UI guide |
| `ROUTES.md` | REWRITE | Full route map with service areas, lifecycle stages, status |

**After these updates, any agent reading the docs will know:**
1. What the full service architecture looks like (not just Data)
2. Which services are complete, partial, or stub
3. How to use reference UIs for design patterns
4. What the post-login hub should be
5. How commercial packaging maps to UI entitlements
6. What lifecycle-aligned naming to use
7. What to check before writing any code
