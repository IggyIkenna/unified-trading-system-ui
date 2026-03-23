# Service Completion Status

Last updated: 2026-03-21 (routes updated to canonical `/services/` tree after commit `8e536fc`)

## Service Layer Completion Matrix

All canonical routes now live under `app/(platform)/services/`. Old flat routes (`/trading/*`, `/research/*`, etc.) are permanent redirects — see `ROUTES.md` for the full redirect map.

| Service Area    | Canonical Route(s)                                                                                                  | Product Surface                                                                     | Admin/Ops                                              | Overall     |
| --------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------- |
| **Data**        | `/services/data/overview`, `/services/data/coverage`, `/services/data/venues`, `/services/data/markets`, etc.          | ✅ Data status dashboard, instrument views, subscriptions                           | 🟡 `/admin/data` (basic), `/internal/data-etl` (basic) | ✅ COMPLETE |
| **Research**    | `/services/research/overview`, `/services/research/strategy/*`, `/services/research/ml/*`, `/services/research/execution/*` | ✅ Strategy platform, ML models/experiments, execution research (algos, TCA)    | ❌ N/A                                                 | ✅ COMPLETE |
| **Trading**     | `/services/trading/overview`, `/services/trading/positions`, `/services/trading/risk`, `/services/trading/alerts`       | ✅ Trading terminal, positions, risk, alerts, markets                               | ❌ N/A                                                 | ✅ COMPLETE |
| **Reporting**   | `/services/reports/overview`, `/services/reports/executive`, `/services/reports/reconciliation`, etc.                  | ✅ Reports + executive dashboard                                                    | 🟡 `/manage/fees` exists                               | ✅ COMPLETE |
| **Execution**   | `/services/execution/overview`, `/services/execution/tca`, `/services/execution/algos`, etc.                           | ✅ Execution analytics (live)                                                       | ❌ N/A                                                 | ✅ COMPLETE |
| **Admin**       | `/admin`                                                                                                            | ❌ Hidden                                                                           | ✅ Admin dashboard, user/client/fee management         | ✅ COMPLETE |
| **DevOps**      | `/devops`                                                                                                           | ❌ Hidden                                                                           | ✅ Ported (17K lines from deployment-ui, 6-tab layout) | ✅ PORTED   |
| **Compliance**  | `/compliance`                                                                                                       | 🟡 FCA info page (basic)                                                            | ❌ N/A                                                 | 🟡 BASIC    |
| **Service Hub** | `/services/overview`, `/services/[key]`                                                                               | ✅ Service grid, activity feed, quick actions, health bar                           | ❌ N/A                                                 | ✅ COMPLETE |
| **Health**      | `/health`                                                                                                           | ✅ Service health dashboard                                                         | ❌ N/A                                                 | ✅ COMPLETE |

## Post-Login Hub Status (Service Hub — `/overview`)

| Component                            | Status      | Notes                                                       |
| ------------------------------------ | ----------- | ----------------------------------------------------------- |
| Service grid with entitlement states | ✅ Complete | `getVisibleServices()` in `lib/config/services.ts` + hub UI |
| Activity feed                        | ✅ Complete |                                                             |
| Quick actions                        | ✅ Complete |                                                             |
| System health bar                    | ✅ Complete | `useServiceOverview()` hook wired                           |
| Locked service upgrade modals        | ✅ Complete |                                                             |
| Subscription page (`/services/[key]`) | ✅ Complete | Per-service subscription detail page                        |

## Infrastructure Status (PLANS_1 + PLANS_2 Complete)

| Component                 | Status                      | Files                                                                  |
| ------------------------- | --------------------------- | ---------------------------------------------------------------------- |
| Route groups              | ✅ Done                     | `app/(public)/`, `app/(platform)/`, `app/(ops)/`                       |
| Nested service routes     | ✅ Done                     | All under `app/(platform)/services/<domain>/`                           |
| Old path redirects        | ✅ Done                     | All legacy flat routes redirect to `/services/*` — see `ROUTES.md`     |
| Shell layouts             | ✅ Done                     | 3 layout.tsx files with auth gates                                     |
| MSW handlers              | ✅ 16 handlers              | `lib/mocks/handlers/`                                                  |
| React Query hooks         | ✅ 14 hooks                 | `hooks/api/`                                                           |
| Auth personas             | ✅ 5 personas               | `lib/mocks/fixtures/personas.ts`                                       |
| Zustand stores            | ✅ 3 stores                 | `lib/stores/`                                                          |
| Config                    | ✅ 5 files                  | `lib/config/`                                                          |
| Type generation           | ✅ 20K lines                | `lib/types/api-generated.ts`                                           |
| Nav entitlement filtering | ✅ Done                     | `components/shell/lifecycle-nav.tsx`                                   |
| Login flow                | ✅ Fixed                    | Uses PERSONAS, proper redirects                                        |
| Tests                     | ✅ 105 tests, 95%+ coverage | `__tests__/`                                                           |

## Completion Legend

- ✅ Complete — functional, data-wired, persona-tested
- 🟡 Partial — routes/components exist but not fully wired or lacking depth
- 🔴 Stub — route exists but minimal/placeholder content
- ❌ Not applicable or not started

## What's Next

See `PLANS_3.md` for the service completion plan (Phases 5A through 5I).
Priority: Phase 5A (Post-Login Hub) first, then parallel service areas.
