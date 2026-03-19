# Service Completion Status

Last updated: 2026-03-19

## Service Layer Completion Matrix

| Service Area | Public Marketing | Product Surface | Admin | Internal Ops | Overall |
|-------------|-----------------|----------------|-------|-------------|---------|
| **Data** | ✅ `/services/data` | ✅ `/portal/data`, instrument views | 🟡 `/admin/data` (basic) | 🟡 `/internal/data-etl` (basic) | 🟡 MOSTLY DONE |
| **Research / Simulate** | 🟡 `/services/backtesting` (basic) | 🟡 Routes exist, some components wired | ❌ N/A | ❌ N/A | 🟡 PARTIAL |
| **Trading / Run / Monitor** | 🟡 `/services/execution` (basic) | 🟡 Trading page has order entry + charts; positions, risk, execution have content | ❌ N/A | ❌ Not started | 🟡 PARTIAL |
| **Reporting / Explain / Reconcile** | 🟡 `/services/investment` (basic) | 🟡 `/reports` has 5-tab layout (700+ lines) | 🟡 `/manage/fees` exists | ❌ Not started | 🟡 PARTIAL |
| **Admin / Onboarding** | ❌ Hidden | ❌ Hidden | 🔴 `/admin` delegates to AuditDashboard stub | ❌ N/A | 🔴 STUB |
| **Deployment / DevOps** | ❌ Hidden | ❌ Hidden | ❌ N/A | 🔴 `/devops` delegates to DevOpsDashboard stub | 🔴 STUB |
| **Audit / Compliance** | 🟡 `/services/regulatory` (basic) | 🔴 `/compliance` minimal stub | ❌ N/A | 🔴 No internal audit surface | 🔴 STUB |

## Post-Login Hub Status

| Component | Status | Notes |
|-----------|--------|-------|
| Service grid with entitlement states | 🔴 Not implemented | `getVisibleServices()` exists in `lib/config/services.ts` but no hub UI |
| Activity feed | 🔴 Not implemented | |
| Quick actions | 🔴 Not implemented | |
| System health bar | 🔴 Not implemented | `useServiceOverview()` hook exists |
| Locked service upgrade modals | 🔴 Not implemented | |
| Current `/overview` page | 🟡 Exists | Data wall with ~15 widgets — needs rebuild as service hub |

## Infrastructure Status (PLANS_1 + PLANS_2 Complete)

| Component | Status | Files |
|-----------|--------|-------|
| Route groups | ✅ Done | `app/(public)/`, `app/(platform)/`, `app/(ops)/` |
| Shell layouts | ✅ Done | 3 layout.tsx files with auth gates |
| MSW handlers | ✅ 16 handlers | `lib/mocks/handlers/` |
| React Query hooks | ✅ 14 hooks | `hooks/api/` |
| Auth personas | ✅ 4 personas | `lib/mocks/fixtures/personas.ts` |
| Zustand stores | ✅ 3 stores | `lib/stores/` |
| Config | ✅ 5 files | `lib/config/` |
| Type generation | ✅ 20K lines | `lib/types/api-generated.ts` |
| Nav entitlement filtering | ✅ Done | `components/shell/lifecycle-nav.tsx` |
| Login flow | ✅ Fixed | Uses PERSONAS, proper redirects |
| Tests | ✅ 105 tests, 95%+ coverage | `__tests__/` |

## Completion Legend

- ✅ Complete — functional, data-wired, persona-tested
- 🟡 Partial — routes/components exist but not fully wired or lacking depth
- 🔴 Stub — route exists but minimal/placeholder content
- ❌ Not applicable or not started

## What's Next

See `PLANS_3.md` for the service completion plan (Phases 5A through 5I).
Priority: Phase 5A (Post-Login Hub) first, then parallel service areas.
