# Unified Trading System UI Refactoring Plan (Phase 1-4)

**Status:** Planning Phase (Ready for Implementation)
**Created:** 2026-03-19
**Target Start:** Week of 2026-03-24

---

## Executive Summary

The unified trading system consists of **13 independent Vite-based React UIs** with 60+ pages organized around institutional trading services (strategy, trading analytics, settlement, ML, etc.). The codebase demonstrates strong patterns but lacks **institutional stratification**: no public marketing layer, no unified client portal experience, no cohesive internal operations layer.

**Refactoring Goals:**
- Stratify UIs into Public (marketing) → Client (authenticated portal) → Internal (operations) experiences
- Create unified platform navigation with service discovery
- Extract shared shells (deployment, configuration, audit) into reusable components
- Establish clear routing patterns without breaking existing service-specific UIs

**Phases:**
- **Phase 1:** Vision document + Service registry specification
- **Phase 2:** Shell infrastructure (PublicShell, ClientPortalShell, InternalOpsShell, ConfigurationShell, DeploymentShell)
- **Phase 3:** Migrate flagship UIs (onboarding-ui, strategy-ui, trading-analytics-ui)
- **Phase 4:** Complete public + internal shells
- **Phase 5:** (Future) Migrate remaining UIs

---

## Phase 1: Create Institutional Vision Document

**Timeline:** 1 week
**Effort:** Low (documentation-focused)

### Deliverables

**1.1 Platform Vision Document**
- File: `unified-trading-ui-kit/docs/PLATFORM_VISION.md`
- Contents:
  - Platform identity (institutional trading platform with 3-tier experience)
  - User journeys (Public visitor → Prospect → Client → Client+Internal)
  - Service lifecycle model (Design→Simulate→Promote→Run→Monitor→Explain→Reconcile)
  - Information architecture (shell topology, routing patterns, cross-platform navigation)
  - Design system expectations (institutional dark palette, role indicators, stratification cues)

**1.2 Service Registry Specification**
- File: `unified-trading-ui-kit/docs/SERVICE_REGISTRY.md`
- Define canonical service metadata schema:
  ```typescript
  interface Service {
    id: string                          // "strategy-ui"
    name: string                        // "Strategy Platform"
    description: string                 // "Strategy design, backtesting, analysis"
    icon: string                        // Icon component name or SVG path
    color: string                       // Brand color for service
    routes: Route[]                     // Main routes exposed by service
    visibility: "public" | "client" | "internal"  // Who can see this
    lifecycle_stage: "design" | "simulate" | "promote" | "run" | "monitor" | "explain" | "reconcile"
    health_check_url: string            // HTTP endpoint for status
    deployed_at: string[]               // ["prod", "staging"] or ["client-1", "client-2"]
  }
  ```

**1.3 Information Architecture Document**
- File: `unified-trading-ui-kit/docs/INFORMATION_ARCHITECTURE.md`
- Describe new directory structure and shell topology
- ASCII/Mermaid diagram showing:
  - Public shell (unauthenticated)
  - Client portal shell (authenticated client)
  - Internal ops shell (authenticated internal)
  - Service groupings by lifecycle stage
  - URL patterns for each layer

**1.4 Inventory & Gap Analysis**
- File: `unified-trading-ui-kit/docs/INVENTORY_AUDIT.md`
- List all 60+ pages across 13 UIs with lifecycle mapping
- Identify duplicated patterns (e.g., DeploymentsPage in 4 UIs)
- Flag missing pieces (public landing, role-based discovery, unified config)
- Recommend high-priority refactors for Phase 2

### Success Criteria

- [ ] PLATFORM_VISION.md approved by stakeholders
- [ ] SERVICE_REGISTRY schema finalized and reviewed
- [ ] IA diagram clearly shows Public/Client/Internal stratification
- [ ] All 13 UIs categorized by visibility + lifecycle stage
- [ ] Gap analysis identifies 3-5 high-priority refactors

### Dependencies

- None (pure documentation)

---

## Phase 2: Build Shell Infrastructure

**Timeline:** 2-3 weeks
**Effort:** High (core infrastructure work)

### Deliverables

**2.1 Service Registry Module** (unified-trading-ui-kit)
- File: `unified-trading-ui-kit/src/services/service-registry.ts`
- Exports:
  - `PLATFORM_SERVICES: Service[]` — Canonical list of all UIs + metadata
  - `getServicesByVisibility(visibility: "public" | "client" | "internal"): Service[]`
  - `getServicesByLifecycleStage(stage: string): Service[]`
  - `getServiceById(id: string): Service | undefined`
  - `useServiceRegistry(): { services, byVisibility, byStage }`

**2.2 PublicShell Component** (unified-trading-ui-kit)
- File: `unified-trading-ui-kit/src/shells/PublicShell.tsx`
- Purpose: Root for unauthenticated users (no auth required)
- Features:
  - Header with logo, CTA to login/signup
  - Service showcase carousel (visibility: "public" services)
  - Feature cards highlighting value props
  - Footer with legal links
  - Responsive design

**2.3 ClientPortalShell Component** (unified-trading-ui-kit)
- File: `unified-trading-ui-kit/src/shells/ClientPortalShell.tsx`
- Purpose: Primary authenticated user experience
- Features:
  - Top-level nav with service groups (Trading, Analytics, Configuration)
  - Cross-platform service browser (sidebar with related UIs)
  - User menu (profile, settings, logout)
  - Health status bar
  - Breadcrumb + page title
  - Role-based visibility (if user.role === "internal", show internal services)

**2.4 InternalOpsShell Component** (unified-trading-ui-kit)
- File: `unified-trading-ui-kit/src/shells/InternalOpsShell.tsx`
- Purpose: Operations/admin experience organized by lifecycle
- Features:
  - Sidebar with lifecycle stages (Design, Simulate, Promote, Run, Monitor, Explain, Reconcile)
  - Under each stage: Related UIs with status badges
  - Admin controls (user management, deployment, billing)
  - Global audit trail
  - System health dashboard
  - Feature flag editor (if applicable)

**2.5 ConfigurationShell Component** (unified-trading-ui-kit)
- File: `unified-trading-ui-kit/src/shells/ConfigurationShell.tsx`
- Purpose: Unified settings/configuration experience
- Features:
  - Tabs: General, Security, Integrations, Notifications, Billing, Audit
  - Shared state via React Query (stale time: 5min)
  - Cross-platform settings aggregation
  - Persist to `/api/settings` endpoint

**2.6 DeploymentShell Component** (unified-trading-ui-kit)
- File: `unified-trading-ui-kit/src/shells/DeploymentShell.tsx`
- Purpose: Reusable deployment control panel
- Features:
  - Service selector dropdown
  - Dry-run + live deploy toggle
  - Progress status
  - History + rollback
- Used by: deployment-ui (primary), onboarding-ui, strategy-ui, trading-analytics-ui (secondary)

**2.7 Update unified-trading-ui-kit Exports** (unified-trading-ui-kit)
- File: `unified-trading-ui-kit/src/index.ts`
- Add exports:
  ```typescript
  export { PublicShell } from "./shells/PublicShell";
  export { ClientPortalShell } from "./shells/ClientPortalShell";
  export { InternalOpsShell } from "./shells/InternalOpsShell";
  export { ConfigurationShell } from "./shells/ConfigurationShell";
  export { DeploymentShell } from "./shells/DeploymentShell";
  export { PLATFORM_SERVICES, type Service } from "./services/service-registry";
  export { useServiceRegistry } from "./services/useServiceRegistry";
  ```

### Success Criteria

- [ ] All 5 shells render without error (stub implementations acceptable)
- [ ] Service registry populated with all 13 UIs + metadata
- [ ] `useServiceRegistry()` hook works in test components
- [ ] unified-trading-ui-kit builds cleanly (`npm run build`)
- [ ] QG passes: `cd unified-trading-ui-kit && bash scripts/quality-gates.sh`
- [ ] Backward compatibility: Existing UIs using AppShell unaffected

### Dependencies

- Phase 1 complete (vision + IA finalized)

---

## Phase 3: Migrate Flagship UIs to ClientPortalShell

**Timeline:** 2 weeks
**Effort:** Medium (straightforward migrations)

### 3.1 Migrate onboarding-ui

**Files to change:**
- `onboarding-ui/src/App.tsx` — Replace AppShell with ClientPortalShell

**Steps:**
1. Import `ClientPortalShell` from `unified-trading-ui-kit`
2. Replace:
   ```tsx
   // BEFORE
   <AppShell nav={NAV_ITEMS} ... />

   // AFTER
   <ClientPortalShell>
     <Routes>...</Routes>
   </ClientPortalShell>
   ```
3. Remove local NAV_ITEMS constant (pulled from PLATFORM_SERVICES)
4. Keep all 23 pages/ unchanged
5. Update ConfigLink to point to ConfigurationShell

**Test:** `npm test` (tests unaffected by wrapper change)
**QG:** `bash scripts/quality-gates.sh`

### 3.2 Migrate strategy-ui

**Files to change:**
- `strategy-ui/src/App.tsx` — Replace AppShell with ClientPortalShell

**Steps:**
1. Same pattern as 3.1
2. Preserve NAV_ITEMS grouping structure (Strategies, Backtesting, Configuration, Data, Operations)
3. ClientPortalShell will show these as sub-items
4. Keep all 27 pages/ unchanged
5. Replace DeploymentsPage with link to deployment-ui

**Test:** `npm test`
**QG:** `bash scripts/quality-gates.sh`

### 3.3 Migrate trading-analytics-ui

**Files to change:**
- `trading-analytics-ui/src/App.tsx` — Replace AppShell with ClientPortalShell

**Steps:**
1. Same pattern as 3.1/3.2
2. Map existing routes to lifecycle stages (Trading Desk→Run, Recon→Reconcile)
3. Remove DeploymentsPage; link to deployment-ui
4. Keep all 19 pages/ unchanged
5. Integrate health status (alerting-service health checks)

**Test:** `npm test`
**QG:** `bash scripts/quality-gates.sh`

### Success Criteria

- [ ] onboarding-ui renders with ClientPortalShell; all 23 pages accessible
- [ ] strategy-ui renders with ClientPortalShell; NAV_ITEMS preserved; 27 pages accessible
- [ ] trading-analytics-ui renders with ClientPortalShell; 19 pages accessible
- [ ] Cross-platform nav links functional
- [ ] No regression in existing pages/API calls
- [ ] QG passes on all 3 repos
- [ ] Smoke tests: pages load within 3s, no console errors

### Dependencies

- Phase 2 complete (shells stable)

---

## Phase 4: Complete Public + Internal Shells

**Timeline:** 2-3 weeks
**Effort:** High (new UI surfaces)

### 4.1 Create Public Landing Page (Optional / Deferrable)

**Location:** NEW or integrate into onboarding-ui `/`

**Purpose:** Root landing page for unauthenticated users

**Features:**
- Hero section (Unified Trading System: Institutional-Grade Execution)
- Service showcase (Design, Simulate, Promote, Run cards)
- Feature highlight (cross-platform, real-time, audit-trail)
- Pricing/features table
- Call to action (Contact sales / Free trial)

### 4.2 Create Internal Operations Dashboard

**Location:** `onboarding-ui` with new `/internal/*` routes (role-gated)

**Features:**
- Sidebar: Lifecycle stage navigator (Design→Simulate→Promote→Run→Monitor→Explain→Reconcile)
- Under each stage: Related UIs with status badges
- System health dashboard (all services aggregated)
- User management (list, roles, permissions)
- Global audit log (events from all UIs)
- Deployment control (master deploy/rollback across shards)
- Feature flag editor

### 4.3 Wire PublicShell + InternalOpsShell

- Update `unified-trading-ui-kit/src/index.ts` if needed
- Create example App.tsx files in `examples/` directory

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

## Phase 5: Migrate Remaining UIs (Future)

**Scope:** Migrate remaining 10 UIs to appropriate shells over time

**Wave 1 (Q2 2026):** batch-audit-ui, execution-analytics-ui (Monitor stage)
**Wave 2 (Q2/Q3 2026):** client-reporting-ui, ml-training-ui (Run stage)
**Wave 3 (Q3 2026):** live-health-monitor-ui, settlement-ui, logs-dashboard-ui (Monitor/Run)

---

## Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Shell Implementation** | React components in unified-trading-ui-kit | Lightweight, no operational overhead, can upgrade to module federation later |
| **Service Registry** | Centralized PLATFORM_SERVICES array | Single source of truth, enables cross-platform nav discovery |
| **Public/Client/Internal Boundaries** | Visibility field + shell-level gating | Clean separation without extra auth layers |
| **Deployment Control** | DeploymentShell component | Eliminates duplication across 4 UIs; deployment-ui remains primary |
| **Configuration** | ConfigurationShell + useSettings() hook | Unified settings across platform; QueryClient caching |
| **Backward Compatibility** | New shells are opt-in; AppShell continues working | Phased migration; no breaking changes |

---

## Critical Blockers & Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Health check aggregation | HIGH | Create `/api/platform-health` endpoint that polls all services; cache results 30s |
| Settings backend undefined | HIGH | Design `/api/settings` schema (general, security, integrations, notifications, billing, audit) |
| Cross-origin nav | MEDIUM | MVP: assume same origin. Future: centralized URL dispatcher or auth redirect |
| Service registry drift | MEDIUM | Publish PLATFORM_SERVICES from unified-trading-pm at build time |
| Performance (too many nav items) | MEDIUM | Lazy-load registry; memoize PLATFORM_SERVICES; localStorage cache |

---

## Reference Insights

| Repo | Pattern | Insight |
|------|---------|---------|
| **onboarding-ui** (23 pages) | NAV_ITEMS structure | Multiple sub-pages (ClientOnboarding → ClientDetail) show hierarchical routing works |
| **strategy-ui** (27 pages) | NAV_ITEMS grouping | 5 groups (Strategies, Backtesting, Configuration, Data, Operations) map to lifecycle stages |
| **trading-analytics-ui** (19 pages) | Recon nested routes | Recon → ReconDetail → DeviationDrill shows deep nesting; maps to Reconcile stage |
| **deployment-ui** (custom tabs) | Tab-based service control | Complex deployment logic; DeploymentShell should extract this |
| **unified-trading-ui-kit** | AppShell + exports | Strong foundation; new shells follow same pattern |

---

## Files to Create/Modify

### New Files (Phase 1)
- `unified-trading-ui-kit/docs/PLATFORM_VISION.md`
- `unified-trading-ui-kit/docs/SERVICE_REGISTRY.md`
- `unified-trading-ui-kit/docs/INFORMATION_ARCHITECTURE.md`
- `unified-trading-ui-kit/docs/INVENTORY_AUDIT.md`

### New Files (Phase 2)
- `unified-trading-ui-kit/src/services/service-registry.ts`
- `unified-trading-ui-kit/src/services/useServiceRegistry.ts`
- `unified-trading-ui-kit/src/shells/PublicShell.tsx`
- `unified-trading-ui-kit/src/shells/ClientPortalShell.tsx`
- `unified-trading-ui-kit/src/shells/InternalOpsShell.tsx`
- `unified-trading-ui-kit/src/shells/ConfigurationShell.tsx`
- `unified-trading-ui-kit/src/shells/DeploymentShell.tsx`

### Modified Files (Phase 3)
- `onboarding-ui/src/App.tsx`
- `strategy-ui/src/App.tsx`
- `trading-analytics-ui/src/App.tsx`

### New Files (Phase 4)
- `onboarding-ui/src/pages/InternalOpsPage.tsx`
- Optional: `unified-trading-system-landing-ui/` (new repo)

---

## Next Steps

**Immediate (Week of 2026-03-24):**
1. [ ] Review + approve Phase 1 deliverables with stakeholders
2. [ ] Finalize SERVICE_REGISTRY schema
3. [ ] Create Phase 1 documents

**Short-term (Weeks 2-3):**
1. [ ] Implement Phase 2 shells
2. [ ] Build service-registry module
3. [ ] Run QG on unified-trading-ui-kit

**Medium-term (Weeks 4-6):**
1. [ ] Migrate onboarding-ui, strategy-ui, trading-analytics-ui (Phase 3)
2. [ ] Smoke test cross-platform nav
3. [ ] Gather user feedback

**Long-term (Weeks 7-12):**
1. [ ] Build public landing page (Phase 4.1)
2. [ ] Build internal ops dashboard (Phase 4.2)
3. [ ] Migrate remaining UIs (Phase 5)

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
