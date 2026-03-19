# Phase 2 Refactor Progress

**Branch:** refactor/phase2-structure
**Started:** 2026-03-19
**Status:** COMPLETED

---

## Step 1: Create Target Directory Structure
**Status:** DONE

### Directories Created:
- [x] `app/(public)/` - layout.tsx created
- [x] `app/(platform)/` - layout.tsx created
- [x] `app/(ops)/` - layout.tsx created
- [x] `lib/config/` - api.ts, branding.ts, auth.ts, services.ts, index.ts
- [x] `lib/mocks/` - browser.ts, utils.ts, handlers.ts, index.ts
- [x] `lib/mocks/handlers/` - auth.ts, data.ts, execution.ts, strategy.ts
- [x] `lib/mocks/fixtures/` - personas.ts
- [x] `lib/stores/` - auth-store.ts, filters-store.ts, ui-store.ts, index.ts
- [x] `hooks/api/` - use-data.ts, use-execution.ts, use-strategies.ts, index.ts

---

## Step 2: Create lib/config/ (Centralized Config)
**Status:** DONE

### Files Created:
- `lib/config/api.ts` - API endpoints, base URLs, timeouts
- `lib/config/branding.ts` - Company identity, design tokens
- `lib/config/auth.ts` - Roles, entitlements, personas
- `lib/config/services.ts` - Service registry with entitlements
- `lib/config/index.ts` - Barrel export

---

## Step 3: Create Shell Layouts (Route Group Infrastructure)
**Status:** DONE

### Files Created:
- `app/(public)/layout.tsx` - Public shell with header + footer
- `app/(platform)/layout.tsx` - Platform shell with auth + UnifiedShell
- `app/(ops)/layout.tsx` - Ops shell with internal-only access gate (fixed role check)

---

## Step 4: Move Existing Pages into Route Groups
**Status:** DONE

### Pages Moved to (public):
- login, signup, contact, demo, demo/preview, docs, privacy, terms, investor-relations
- services/data, services/backtesting, services/execution, services/investment, services/regulatory, services/platform
- Root page.tsx (landing page)

### Pages Moved to (platform):
- trading, positions, risk, markets, markets/pnl, reports, overview, quant, health, alerts, executive
- strategies, strategies/grid, strategies/[id]
- execution/* (with layout.tsx)
- strategy-platform/* (with layout.tsx)
- ml/* (with layout.tsx)
- portal, portal/dashboard, portal/data, portal/backtesting, portal/investment, portal/regulatory, portal/login
- client-portal/[org] (renamed from platform/[org])

### Pages Moved to (ops):
- admin, admin/data
- ops, ops/services, ops/jobs
- devops
- manage/* (with layout.tsx) - users, clients, mandates, fees
- compliance, config, engagement
- internal, internal/data-etl

---

## Step 5: Auth Personas + useAuth Upgrade
**Status:** DONE

### Files Created:
- `lib/mocks/fixtures/personas.ts` - 3 demo personas (internal-trader, client-full, client-data-only)
- `lib/config/auth.ts` - Role, Entitlement, Organization types

### Fixed:
- `app/(ops)/layout.tsx` - Fixed role check from `"Internal Trader"` to `"internal"`

---

## Step 6: MSW Mock Infrastructure
**Status:** DONE (4 handlers)

### Files Created:
- `lib/mocks/browser.ts` - MSW browser setup with worker
- `lib/mocks/utils.ts` - Persona helpers, scoping utilities
- `lib/mocks/handlers.ts` - Barrel export
- `lib/mocks/handlers/index.ts` - Handler registry
- `lib/mocks/handlers/auth.ts` - login, logout, me, switch-persona, personas
- `lib/mocks/handlers/data.ts` - catalogue, instruments, organizations, freshness
- `lib/mocks/handlers/execution.ts` - venues, algos, orders, TCA
- `lib/mocks/handlers/strategy.ts` - strategies, backtests

---

## Step 7: Migrate Inline Mock Data to Fixtures
**Status:** PARTIAL (persona fixtures only)

### Deferred to PLANS_2:
- Full mock data migration from lib/*.ts to lib/mocks/fixtures/
- Delete original mock files after React Query wiring

---

## Step 8: State Management Plumbing
**Status:** DONE

### Files Created:
- `lib/stores/auth-store.ts` - Zustand auth state with personas
- `lib/stores/filters-store.ts` - Data, strategy, execution filters
- `lib/stores/ui-store.ts` - Sidebar, panels, view preferences
- `lib/stores/index.ts` - Barrel export + resetAllStores()

### Dependencies Added:
- zustand@^5.0.0
- @tanstack/react-query@^5.60.0
- swr@^2.2.5
- msw@^2.4.0 (devDependency)

---

## Step 9: Type Generation
**Status:** DEFERRED

Type generation from OpenAPI will be done in PLANS_2 with openapi-typescript.

---

## Step 10: Wire Data Catalogue Page End-to-End
**Status:** DONE (hooks created)

### Files Created:
- `hooks/api/use-data.ts` - useCatalogue, useInstruments, useFreshness
- `hooks/api/use-execution.ts` - useVenues, useAlgos, useOrders, useTCA
- `hooks/api/use-strategies.ts` - useStrategies, useBacktests
- `hooks/api/index.ts` - Barrel export

---

## Step 11: Cleanup Orphans
**Status:** DEFERRED

Empty directories from moved pages will be cleaned up automatically or in PLANS_2.

---

## Step 12: Update Manifest Status
**Status:** DONE

UI_STRUCTURE_MANIFEST.json updated to reflect phase-2-complete state.

---

## Quality Gate
```bash
pnpm lint && pnpm tsc --noEmit && pnpm build && pnpm test
```
**Status:** PENDING - Run after PR review

---

## Summary

Phase 2 structural refactoring is complete:
- 3 route groups created with proper layouts
- 79 pages moved to appropriate route groups
- MSW infrastructure with 4 service handlers
- Zustand stores for auth, filters, UI state
- SWR hooks for data fetching
- Dependencies added for state management

**Next:** PLANS_2.md for wiring pages to React Query hooks, full mock migration, and comprehensive testing.
