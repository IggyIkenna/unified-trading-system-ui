# Unified Trading System UI Refactoring Plan (Phase 1-4)

**Status:** Planning Phase (Ready for Implementation)
**Created:** 2026-03-19
**Target Start:** Week of 2026-03-24

---

## Executive Summary

This is a **single Next.js 16 App Router project** (unified-trading-system-ui) with 30+ pages. The codebase has strong components but lacks **institutional stratification**: no public marketing layer, no unified platform experience with auth-driven scoping, no cohesive internal operations layer.

> **NOTE:** This plan was originally written in the context of 13 separate Vite-based UIs. It has been consolidated to this single repo. References to external repos (onboarding-ui, strategy-ui, trading-analytics-ui, unified-trading-ui-kit) in later sections are **historical context only** — all work happens in THIS repo. The `_reference/` directory contains prior UI implementations for design reference.

**Refactoring Goals:**
- Stratify pages into `app/(public)/` → `app/(platform)/` → `app/(ops)/` route groups
- Create unified platform navigation with service discovery and entitlement-driven scoping
- Wire MSW mock infrastructure with dimensional mocking (same endpoint, different data per persona)
- Establish Zustand + React Query state management with demo reset capability

**Phases:**
- **Phase 1:** Vision document + Service registry specification (DONE — see `ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md`)
- **Phase 2:** Shell infrastructure, MSW mocks, config, state management, type generation
- **Phase 3:** Wire existing pages to React Query + MSW, auth-driven scoping
- **Phase 4:** Build new surfaces (dashboard, ops, subscription context, demo flow)
- **Phase 5:** (Future) Polish and remaining page buildout

---

## Phase 1: Vision & Specification ✅ COMPLETE

**Status:** Done — all deliverables exist in this repo.

| Deliverable | File (this repo) | Status |
|---|---|---|
| Platform Vision | `ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md` | ✅ Done |
| Service Registry Schema | Defined in §2.1 below; implemented as `lib/config/services.ts` | ✅ Specified |
| Information Architecture | `.cursorrules` §1.1 (route group layout) | ✅ Done |
| Inventory & Gap Analysis | `context/API_FRONTEND_GAPS.md` | ✅ Done |

### Dependencies

- None (pure documentation)

---

## Phase 2: Build Shell Infrastructure

**Timeline:** 2-3 weeks
**Effort:** High (core infrastructure work)

### Deliverables

**NOTE:** All shell and registry work happens IN THIS REPO (unified-trading-system-ui), not in unified-trading-ui-kit. Existing shell components in `components/shell/` are the foundation — extend, don't replace.

**2.1 Service Registry Module**
- File: `lib/config/service-registry.ts`
- Build on existing `lib/registry/` data (system-topology.json, ui-reference-data.json)
- Exports:
  - `PLATFORM_SERVICES: Service[]` — Canonical list of all services + metadata
  - `getServicesByVisibility(visibility: "public" | "client" | "internal"): Service[]`
  - `getServicesByLifecycleStage(stage: string): Service[]`
  - `getServiceById(id: string): Service | undefined`
  - `useServiceRegistry(): { services, byVisibility, byStage }`
- Service interface must include entitlements:
  ```typescript
  interface Service {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    routes: Route[];
    visibility: "public" | "client" | "internal";
    lifecycle_stage: string;
    entitlement_required: string | null;  // "data-pro", "execution-basic", etc.
    health_check_url: string;
  }
  ```

**2.2 Shell Refactor** (extend existing `components/shell/`)
- Existing: `unified-shell.tsx` (104 lines), `lifecycle-nav.tsx` (308 lines), `role-layout.tsx`, `require-auth.tsx`
- Refactor into Next.js App Router `layout.tsx` files:
  - `app/(public)/layout.tsx` → PublicShell (header, CTA, footer — no auth)
  - `app/(platform)/layout.tsx` → PlatformShell (sidebar, entitlement-driven nav, health bar — auth required, same for internal AND client)
  - `app/(ops)/layout.tsx` → OpsShell (admin/deployment surfaces — auth + role=internal required)
- Keep `components/shell/` as the component library; `layout.tsx` files compose them

**2.3 Auth Mock Personas**
- File: `lib/mocks/fixtures/personas.ts`
- Define demo personas: internal-trader (sees all), client-pm (sees subscribed services), prospect (public only)
- `hooks/use-auth.ts` returns persona based on login selection
- Shell layouts use persona to show/hide services, nav items, admin controls
- "Role switcher" in debug panel for quick persona switching during demo

**2.4 MSW Mock Infrastructure — Inline Data Migration**

The current `lib/*.ts` files contain ~9,100 lines of hardcoded mock objects that are NOT persona-aware,
NOT schema-validated, and NOT structured as API responses. They must be migrated to MSW handlers that
return different data per persona (dimensional mocking).

**Target structure:**
```
lib/mocks/
├── browser.ts                     ← MSW setupWorker, install when NEXT_PUBLIC_MOCK_API=true
├── server.ts                      ← MSW setupServer for tests (node)
├── utils.ts                       ← Helper: getPersonaFromRequest(), scopeByEntitlement()
├── handlers/
│   ├── index.ts                   ← Aggregates all handlers into single array
│   │
│   │  ── CORE TRADING (migrated from inline lib/*.ts mock data) ──
│   ├── auth.ts                    ← Login, profile, persona switch
│   ├── data.ts                    ← Instrument registry, catalogue, download status (subscription-filtered)
│   ├── execution.ts               ← Orders, fills, execution results, backtest grids (client-scoped)
│   ├── positions.ts               ← Positions, risk groups, margin, historical snapshots (client-scoped)
│   ├── strategy.ts                ← Strategies, configs, backtests, candidates (client-scoped)
│   ├── ml.ts                      ← Models, features, experiments, training (subscription-filtered)
│   ├── risk.ts                    ← Limits, exposure, VaR, Greeks, stress scenarios (client-scoped)
│   ├── trading.ts                 ← Live P&L, attribution, performance (client-scoped)
│   ├── market-data.ts             ← OHLCV candles, book snapshots, trades (shared — REST only, see WS note)
│   │
│   │  ── PLATFORM FEATURES (new mock data for demo completeness) ──
│   ├── alerts.ts                  ← Alert CRUD, severity filtering, acknowledge/resolve (client-scoped)
│   ├── reporting.ts               ← Reports, settlement, reconciliation, invoicing (client-scoped)
│   │
│   │  ── OPS / INTERNAL-ONLY (for ops demo) ──
│   ├── deployment.ts              ← Services, deployments, cloud builds, shards (internal-only)
│   ├── service-status.ts          ← Service health, feature freshness, system overview (internal-only for full view)
│   ├── audit.ts                   ← Compliance checks, event history, data health (internal-only)
│   └── user-management.ts         ← Orgs, users, roles, subscriptions (internal sees all; client sees own org)
│
├── fixtures/
│   ├── personas.ts                ← Demo user personas with role + entitlements
│   ├── instruments-full.json      ← Full instrument registry (2400 instruments, internal/pro tier)
│   ├── instruments-basic.json     ← Basic tier subset (180 instruments)
│   ├── venues.json                ← 128 venues from lib/registry/ui-reference-data.json
│   ├── strategies.json            ← Strategy configs per client
│   ├── positions.json             ← Position snapshots with protocol details (LP, lending, perp, staking)
│   ├── orders.json                ← Order/fill history per client
│   ├── ml-models.json             ← Model registry (full + restricted sets)
│   ├── alerts.json                ← Alert templates with severity/entity metadata
│   ├── risk-limits.json           ← Risk limit hierarchies (company→client→account→strategy)
│   ├── candles.json               ← Pre-generated OHLCV data (or generate dynamically in handler)
│   ├── reports.json               ← Report templates per client
│   ├── services.json              ← Service registry with health status
│   └── deployments.json           ← Deployment history (internal-only)
│
└── adapters/
    └── README.md                  ← Documents the adapter pattern (see below)
```

**Why 16 handlers, not 8:** The backend (openapi.json) exposes 323 endpoints across 16 API
services. Positions are served by a DIFFERENT backend service than execution (position-balance-
monitor-service vs execution-results-api). Alerts, deployments, service status, audit, and user
management are all distinct backend services. Matching the handler split to the backend service
split means swapping mock→real is one handler at a time, not a surgical extraction from a
monolithic handler.

**WebSocket note:** MSW doesn't handle WebSocket. The trading page's real-time price simulation
(Brownian motion in setInterval) stays client-side for now. When real WebSocket APIs are available,
a separate `lib/mocks/ws-mock.ts` can use a mock WebSocket server. Document this as a known gap.

**API response shape rule:** Every MSW handler MUST return data matching the `lib/registry/openapi.json`
response schemas. If a page needs data the API doesn't provide (e.g., protocol-specific details like
LP pool info, lending APY), the handler returns the API shape and the page has a thin adapter function
(`lib/mocks/adapters/`) that enriches it. This way, swapping mock→real only requires removing MSW —
the adapter layer stays the same and can be removed later when the backend adds those fields.

**Migration manifest — what inline data becomes what handler:**

| Current File (DELETE after migration) | Lines | Becomes | Scoping Rule |
|---------------------------------------|-------|---------|-------------|
| `lib/strategy-registry.ts` (1,856 lines) | Static strategy list + positions | `handlers/strategy.ts` + `handlers/positions.ts` + `fixtures/strategies.json` + `fixtures/positions.json` | **Client-scoped**: internal sees all, client sees their org's only |
| `lib/reference-data.ts` (895 lines) | Static instrument/venue data | `handlers/data.ts` + `fixtures/instruments-*.json` + `fixtures/venues.json` | **Subscription-filtered**: pro=full registry, basic=subset |
| `lib/ml-mock-data.ts` (1,019 lines) | Static ML model list | `handlers/ml.ts` + `fixtures/ml-models.json` | **Subscription-filtered**: ml-full=all models, no ml sub=hidden |
| `lib/trading-data.ts` (769 lines) | Hierarchical org/client/strategy data + P&L | `handlers/trading.ts` + `handlers/user-management.ts` + `fixtures/reports.json` | **Client-scoped**: internal sees all orgs, client sees their org |
| `lib/data-service-mock-data.ts` (638 lines) | Static data catalogue | `handlers/data.ts` + `fixtures/instruments-*.json` | **Subscription-filtered**: same catalogue, different visible set |
| `lib/strategy-platform-mock-data.ts` (617 lines) | Static backtest results | `handlers/strategy.ts` + `fixtures/backtests.json` | **Client-scoped**: each org's backtests |
| `lib/execution-platform-mock-data.ts` (551 lines) | Static execution data | `handlers/execution.ts` + `fixtures/orders.json` | **Client-scoped**: each org's orders/fills |
| `lib/taxonomy.ts` (810 lines) | Static classification data | `handlers/data.ts` (or keep as config in `lib/config/`) | **Shared**: same for everyone, no scoping needed |

**New handlers NOT sourced from inline data (created fresh for demo completeness):**

| Handler | Source of mock data | Scoping Rule | Backend service (openapi.json) |
|---------|--------------------|--------------|---------------------------------|
| `handlers/market-data.ts` | Move `generateMockCandles()` / `generateMockOrderBook()` from trading page | **Shared**: market data not client-scoped | market-tick-data-service, market-data-processing-service |
| `handlers/alerts.ts` | Extract from `app/alerts/page.tsx` inline data (8+ alert objects) | **Client-scoped**: client sees their alerts, internal sees all | alerting-service |
| `handlers/deployment.ts` | Model from `_reference/deployment-api/` route definitions (92 endpoints) | **Internal-only**: ops pages only | deployment-api |
| `handlers/service-status.ts` | Model from `_reference/deployment-api/` service-status routes | **Internal-only** for full view; client sees subscribed service health | deployment-api (service-status routes) |
| `handlers/audit.ts` | Model from openapi.json batch-audit-api (20 endpoints) | **Internal-only**: compliance/audit | batch-audit-api |
| `handlers/user-management.ts` | Derive org/user lists from `lib/trading-data.ts` hierarchical data | **Internal sees all orgs**; client admin sees own org | deployment-api (user-management routes) |

**Backend alignment: REAL vs ASPIRATIONAL endpoints**

Some handlers will mock endpoints that don't exist in the backend yet. This is intentional —
the frontend shouldn't be blocked by missing backend features. Every handler MUST document
which endpoints are real (exist in openapi.json) vs aspirational (mocked ahead of backend)
using a comment block at the top of each handler file.

After Plans 1+2 are complete, a `BACKEND_ALIGNMENT.md` manifest is generated at repo root
by scanning all handler annotations. This manifest drives the backend refactor — it shows
exactly what the backend needs to implement for the frontend to go live. The backend can
then be upgraded incrementally: implement an endpoint, remove the MSW mock for it, done.

Cross-reference with `context/API_FRONTEND_GAPS.md` — every gap should appear in handler
annotations. New gaps discovered during implementation should be added to API_FRONTEND_GAPS.md.

**Type files (KEEP, eventually replace with generated types):**
- `lib/data-service-types.ts`, `lib/ml-types.ts`, `lib/strategy-platform-types.ts`, `lib/execution-platform-types.ts`
- Phase 2.5 generates `lib/types/api-generated.ts` from openapi.json — these manual types get replaced

**Every MSW handler must:**
1. Read persona context from request headers (`X-Org-Id`, `X-Subscription-Tier`) or auth cookie
2. Return data scoped to that persona's org + entitlements
3. Match the response schema from `lib/registry/openapi.json`
4. Return proper HTTP status codes (401 if no auth, 403 if no entitlement)

**Dimensional mocking pattern (the core of the demo):**
```typescript
// handlers/data.ts — same endpoint, different response per persona
http.get('/api/data/instruments', ({ request }) => {
  const persona = getPersonaFromRequest(request);
  if (!persona) return new HttpResponse(null, { status: 401 });
  if (!persona.entitlements.includes('data-basic') && !persona.entitlements.includes('*'))
    return new HttpResponse(null, { status: 403 });

  const tier = persona.entitlements.includes('data-pro') || persona.entitlements.includes('*')
    ? 'full' : 'basic';
  const instruments = tier === 'full' ? FULL_INSTRUMENTS : BASIC_INSTRUMENTS;
  return HttpResponse.json({ instruments, total: instruments.length });
});
```

**2.5 TypeScript Type Generation from OpenAPI**
- Source: `lib/registry/openapi.json` (639KB, real backend API spec)
- Generate: `lib/types/api-generated.ts` using `openapi-typescript`
- Types used by MSW handlers AND React Query hooks — one source of truth
- Regenerate when backend publishes new spec

**2.6 State Management Infrastructure**
- Zustand stores in `lib/stores/` (filterStore, authStore, uiPrefsStore)
- React Query via `lib/query-client.ts` with QueryClientProvider in root layout
- Every store MUST have `reset()` method
- `lib/reset-demo.ts` — resets all stores, React Query cache, localStorage, sessionStorage
- "Reset Demo" button accessible in shell debug panel

### Success Criteria

- [ ] Three layout.tsx shells render for (public), (platform), (ops) route groups
- [ ] Service registry populated with all services + entitlement metadata
- [ ] Auth mock returns different personas with different entitlements
- [ ] MSW handlers installed when NEXT_PUBLIC_MOCK_API=true
- [ ] At least one React Query hook wired to MSW handler (proof of concept)
- [ ] Zustand store with reset() wired to "Reset Demo" button
- [ ] TypeScript types generated from openapi.json
- [ ] QG passes: `pnpm run lint && pnpm tsc --noEmit && pnpm build && pnpm test`
- [ ] Coverage at or above 70%

### Dependencies

- Phase 1 complete (vision + IA finalized)

---

## Phase 3: Wire Pages to React Query + MSW, Auth-Driven Scoping

**Timeline:** 2 weeks
**Effort:** Medium (straightforward migrations)

### 3.1 Reorganize Existing Pages into Route Groups

**Current state:** Pages live in flat `app/` directory (e.g., `app/trader/page.tsx`, `app/admin/page.tsx`)
**Target state:** Pages organized into `app/(public)/`, `app/(platform)/`, `app/(ops)/` route groups

**CRITICAL CONCEPT:** `(platform)` is ONE experience for BOTH internal and client users.
Same pages, same components. API returns data scoped by org + subscription.
Only `(ops)` is internal-only (admin, deployment, version rollback).

**Steps:**
1. Move public pages into `app/(public)/`: landing, services, contact, login, signup, demo, docs, privacy, terms
2. Move platform pages into `app/(platform)/`: dashboard, trader, positions, risk, markets, strategy-platform, execution, ml, reports, trading, data — these serve BOTH internal and client
3. Move ops-only pages into `app/(ops)/`: admin, ops, devops, compliance, manage — role=internal required
4. Create `layout.tsx` in each group composing the appropriate shell
5. Verify all existing routes still work (route groups don't change URLs)

**Test:** All pages load at same URLs as before (route groups are transparent)
**QG:** `pnpm run lint && pnpm tsc --noEmit && pnpm build && pnpm test`

### 3.2 Wire Auth-Driven Scoping (Same Pages, Different Data)

**CORE PRINCIPLE:** Internal and client users land on the SAME pages. The API scopes the data.
Never build a separate client version of a page.

**Steps:**
1. `app/(platform)/layout.tsx` wraps with `<RequireAuth>` — redirects to login if no session
2. `app/(ops)/layout.tsx` wraps with `<RequireAuth role="internal">` — 403 if wrong role
3. Service registry drives nav items — client sees subscribed services; internal sees all + ops
4. Org selector: internal shows all orgs in dropdown; client shows their org only (read-only)
5. MSW handlers return different data per persona (dimensional mocking — same endpoint, different scope)
6. Test with at least three personas: internal-trader (all), client-full (most), client-data-only (minimal)

### 3.3 Migrate Key Pages to React Query + MSW

**Steps:**
1. Pick 3-5 flagship pages: Trader Dashboard, Positions, Strategy Platform, Risk, Data Catalogue
2. Wire each to React Query hooks in `hooks/api/`
3. Create MSW handlers in `lib/mocks/handlers/` for their endpoints
4. Mock data validated against `lib/registry/openapi.json` schemas
5. Verify pages render with MSW mock data (NEXT_PUBLIC_MOCK_API=true)
6. Remove corresponding inline mock data from `lib/*.ts` files as pages migrate

### Success Criteria

- [ ] All existing pages accessible at same URLs (no broken routes)
- [ ] Route groups correctly wrap pages with appropriate shells
- [ ] Auth mock redirects unauthenticated users from (platform) and (ops) routes
- [ ] Internal-only pages hidden from client persona
- [ ] 3-5 flagship pages wired to React Query + MSW
- [ ] Migrated pages no longer depend on inline mock data
- [ ] QG passes with 70% coverage
- [ ] Smoke tests: pages load within 3s, no console errors

### Dependencies

- Phase 2 complete (shells stable)

---

## Phase 4: Complete Public + Internal Shells

**Timeline:** 2-3 weeks
**Effort:** High (new UI surfaces)

### 4.1 Create Public Landing Page (Optional / Deferrable)

**Location:** `app/(public)/page.tsx` (already exists as 41KB marketing page — polish it)

**Purpose:** Root landing page for unauthenticated users

**Features:**
- Hero section (Unified Trading System: Institutional-Grade Execution)
- Service showcase (Design, Simulate, Promote, Run cards)
- Feature highlight (cross-platform, real-time, audit-trail)
- Pricing/features table
- Call to action (Contact sales / Free trial)

### 4.2 Create Internal Operations Dashboard

**Location:** `app/(ops)/` route group (role-gated to internal users)

**Features:**
- Sidebar: Lifecycle stage navigator (Design→Simulate→Promote→Run→Monitor→Explain→Reconcile)
- Under each stage: Related UIs with status badges
- System health dashboard (all services aggregated)
- User management (list, roles, permissions)
- Global audit log (events from all UIs)
- Deployment control (master deploy/rollback across shards)
- Feature flag editor

### 4.3 Subscription & Data Export Mocks

**Subscription tiers in mock:**
- Internal: `entitlements: ["*"]` — sees everything
- Client Full Suite: `entitlements: ["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"]`
- Client Data Only: `entitlements: ["data-basic"]`

**Service pages show subscription context:**
- Entitled services: full access, normal UI
- Non-entitled services: locked state with "Upgrade" CTA linking to pricing/contact sales
- API keys page: mock API key display for subscribed data tiers

**Data Export button (premium add-on):**
- Visible on data pages (catalogue, status, download)
- Button: "Export Data" → modal with GCP/AWS options → "Contact sales for cloud export pricing"
- Shows: "Using data within the platform is included in your subscription. Export to your own cloud (GCP/AWS) or download (CSV/Parquet) is available as an add-on."
- Phase 5+: wire to real export API

### 4.4 Wire Ops Shell

- `app/(ops)/layout.tsx` with role=internal gate
- Admin, deployment, user management pages (internal-only)

### Success Criteria

- [ ] Public landing page renders (hero + showcase working)
- [ ] Internal ops dashboard accessible at `/internal/*` (role-gated to role: "internal")
- [ ] Cross-platform nav visible from all shells
- [ ] Health status aggregation working
- [ ] Audit log showing events across all services
- [ ] No breaking changes to Phase 3 migrations
- [ ] QG passes on updated repos

### Dependencies

- Phase 3 complete (core shells working)

---

## Phase 5: Polish & Remaining Pages (Future)

**Scope:** Wire remaining pages, add tests, polish demo flow

- Wire remaining pages not covered in Phase 3-4 to React Query + MSW
- Add comprehensive tests (70%+ coverage target)
- Performance optimization (lazy loading, code splitting)
- Accessibility audit

---

## Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Shell Implementation** | Next.js App Router `layout.tsx` files composing `components/shell/` | File-system routing, no extra infra, shells compose existing components |
| **Service Registry** | Centralized `PLATFORM_SERVICES` array in `lib/config/services.ts` | Single source of truth, enables entitlement-driven nav discovery |
| **Public/Platform/Ops Boundaries** | Route groups + `layout.tsx` auth gating | Clean separation without extra auth layers |
| **Mock Strategy** | MSW with dimensional mocking (same endpoint, different data per persona) | One mock layer for dev + tests, persona-driven scoping |
| **State Management** | Zustand (UI state) + React Query (server state) | Clear separation, `reset()` on every store for demo cleanup |
| **Type Generation** | `openapi-typescript` from `lib/registry/openapi.json` | Types match backend spec, regenerate on backend change |

---

## Critical Blockers & Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Health check aggregation | HIGH | Create `/api/platform-health` endpoint that polls all services; cache results 30s |
| Settings backend undefined | HIGH | Design `/api/settings` schema (general, security, integrations, notifications, billing, audit) |
| Service registry drift | MEDIUM | Build `PLATFORM_SERVICES` from `lib/registry/system-topology.json` at build time |
| Performance (too many nav items) | MEDIUM | Lazy-load registry; memoize PLATFORM_SERVICES; localStorage cache |

---

## Reference Insights (from `_reference/` directory)

> These are prior UI implementations kept in `_reference/` for design reference only.
> They are NOT part of this codebase and should NOT be imported from or modified.

| Prior UI (in `_reference/`) | Pattern | Insight for this repo |
|---|---|---|
| **versa-onboarding** (23 pages) | NAV_ITEMS structure | Hierarchical routing works (ClientOnboarding → ClientDetail) |
| **versa-admin-ui** (27 pages) | NAV_ITEMS grouping | 5 groups map to lifecycle stages |
| **versa-execution-analytics-ui** (19 pages) | Recon nested routes | Deep nesting for Reconcile stage |
| **deployment-ui** (custom tabs) | Tab-based service control | Complex deployment logic reference |
| **components/shell/** (THIS repo) | unified-shell, lifecycle-nav, require-auth, role-layout | Existing foundation; new `layout.tsx` shells compose these |

---

## Files to Create/Modify — ALL in THIS repo

### Phase 2: New Files/Directories
- `lib/config/api.ts`, `lib/config/branding.ts`, `lib/config/auth.ts`, `lib/config/services.ts`, `lib/config/index.ts`
- `lib/mocks/browser.ts`, `lib/mocks/server.ts`, `lib/mocks/utils.ts`
- `lib/mocks/handlers/` — auth, data, execution, strategy, ml, risk, trading, reporting
- `lib/mocks/fixtures/` — personas, instruments, strategies, positions, etc.
- `lib/stores/` — filter-store, auth-store, ui-prefs-store
- `lib/types/api-generated.ts`
- `lib/query-client.ts`, `lib/reset-demo.ts`
- `hooks/api/` — per-service React Query hooks
- `app/(public)/layout.tsx`, `app/(platform)/layout.tsx`, `app/(ops)/layout.tsx`

### Phase 3: Modified Files
- Move existing `app/` pages into route groups (`(public)`, `(platform)`, `(ops)`)
- Wire pages to React Query hooks + MSW handlers
- Delete `lib/*.ts` inline mock files as they're replaced by MSW handlers

### Phase 4: New Files
- `app/(platform)/dashboard/page.tsx` — post-login service hub
- Subscription context components (locked service state, upgrade CTA)
- `app/(ops)/` pages — system health, user management, deployment, audit

---

## Next Steps

**Phase 2 (Weeks 1-2):**
1. [ ] Create target directory structure
2. [ ] Build `lib/config/` (api, branding, auth, services)
3. [ ] Create shell `layout.tsx` files for route groups
4. [ ] Move existing pages into route groups
5. [ ] Set up MSW infrastructure + one proof-of-concept handler
6. [ ] Migrate inline mock data → MSW fixtures/handlers
7. [ ] Set up Zustand stores + React Query client
8. [ ] Generate types from openapi.json
9. [ ] Wire one flagship page end-to-end (Data Catalogue)
10. [ ] Cleanup orphans
11. [ ] QG: `pnpm lint && pnpm tsc --noEmit && pnpm build && pnpm test`

**Phase 3 (Weeks 3-4):**
1. [ ] Create React Query hooks for all service domains
2. [ ] Create MSW handlers for all services
3. [ ] Wire all pages to React Query + MSW (priority: trader, positions, strategy, risk, execution, ml, markets, reports)
4. [ ] Wire auth-driven scoping (RequireAuth, entitlement nav, org selector)
5. [ ] QG with 70% coverage

**Phase 4 (Weeks 5-6):**
1. [ ] Build post-login dashboard
2. [ ] Add subscription context to service pages
3. [ ] Polish public landing page
4. [ ] Build ops dashboard
5. [ ] Implement demo flow (persona picker, reset demo)
6. [ ] Final QG

---

## Quality Bar

- Institutional feel (premium dark palette, dense info hierarchy)
- Clear role-based access boundaries
- Unified yet flexible shells
- Backward compatible
- Phased, non-disruptive rollout
- Well-documented for future agents

---

**Plan Status:** Ready for Phase 1 Execution
