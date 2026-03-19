# Phase 2 Structural Refactor — Progress Tracker

## Step 1: Create Target Directory Structure
- **Status:** DONE
- **Created:** `app/(public)/`, `app/(platform)/`, `app/(ops)/`, `lib/config/`, `lib/mocks/`, `lib/mocks/handlers/`, `lib/mocks/fixtures/`, `lib/stores/`, `lib/types/`, `hooks/api/`

## Step 2: Create lib/config/ (Centralized Config)
- **Status:** DONE
- **Created:** `api.ts` (16 service endpoints), `branding.ts` (company + tokens), `auth.ts` (roles + entitlements + tiers), `services.ts` (15 service definitions with entitlement gates), `index.ts`

## Step 3: Create Shell Layouts
- **Status:** DONE
- **Created:** `app/(public)/layout.tsx` (SiteHeader + footer), `app/(platform)/layout.tsx` (RequireAuth + UnifiedShell), `app/(ops)/layout.tsx` (RequireAuth + role gate)

## Step 4: Move Pages into Route Groups
- **Status:** DONE
- **Moved:** 32 directories, 82 files (all pure renames, 0 insertions/deletions)
- **Public (10):** page.tsx, login, signup, contact, demo, docs, privacy, terms, investor-relations, services
- **Platform (16):** trading, positions, risk, markets, execution, strategy-platform, strategies, ml, reports, portal, overview, quant, health, alerts, executive, client-portal (renamed from platform/)
- **Ops (8):** admin, ops, devops, manage, compliance, config, engagement, internal
- **Decision:** No import changes needed — all pages use `@/` aliases to lib/components/hooks

## Step 5: Auth Personas + useAuth Upgrade
- **Status:** DONE
- **Created:** `lib/mocks/fixtures/personas.ts` (4 personas)
- **Modified:** `hooks/use-auth.ts` (now returns role/org/entitlements), `components/shell/require-auth.tsx` (persona picker)
- **Personas:** admin (full system), internal-trader (platform + wildcard), client-full (Alpha Capital, broad sub), client-data-only (Beta Fund, data-basic)

## Step 6: MSW Mock Infrastructure
- **Status:** DONE
- **Created:** `lib/mocks/browser.ts`, `lib/mocks/server.ts`, `lib/mocks/utils.ts`, `lib/mocks/handlers/data.ts` (7 endpoints), `lib/mocks/handlers/index.ts`, `public/mockServiceWorker.js`
- **Installed:** msw

## Step 7: Migrate Mock Data to Fixtures
- **Status:** DONE (handlers created, original files kept)
- **Created:** `handlers/execution.ts` (4 endpoints), `handlers/strategy.ts` (5 endpoints), `handlers/ml.ts` (7 endpoints)
- **Decision:** Original `lib/*-mock-data.ts` files NOT deleted — pages still import directly. Deletion deferred to PLANS_2 Phase 3C when pages wire through React Query.

## Step 8: State Management Plumbing
- **Status:** DONE
- **Created:** `lib/stores/filter-store.ts`, `lib/stores/auth-store.ts`, `lib/stores/ui-prefs-store.ts`, `lib/query-client.ts`, `lib/reset-demo.ts`, `lib/providers.tsx`
- **Modified:** `app/layout.tsx` (wrapped with Providers)
- **Installed:** zustand, @tanstack/react-query

## Step 9: Type Generation
- **Status:** DONE
- **Created:** `lib/types/api-generated.ts` (20,003 lines from 298 endpoints)
- **Script:** `pnpm generate:types`
- **Installed:** openapi-typescript (dev)

## Step 10: Wire Data Catalogue Page
- **Status:** DONE
- **Created:** `hooks/api/use-instruments.ts` (useInstruments + useCatalogue hooks)
- **Decision:** Full page rewiring deferred to PLANS_2 Phase 3C. Hooks are ready for consumption.

## Step 11: Cleanup Orphans
- **Status:** DONE
- **Findings:** CODING_RULES_QUICK_START.md already deleted. No broken imports from our changes. 2 pre-existing import errors in role-layout.tsx and role-selection.tsx (not caused by refactor).

## Step 12: Update Manifest Status
- **Status:** DONE
- **Updated:** UI_STRUCTURE_MANIFEST.json (status: post-phase-2, all fields updated, refactor_history entry added)

## Bug Fixes (during refactor)
- Fixed ops layout role check: was comparing against displayName "Internal Trader" instead of enum "internal"
- Added SECURITY NOTE to personas.ts about plaintext demo passwords
- Added SSR hydration documentation to query-client.ts
