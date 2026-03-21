# app/ — Route Architecture

Next.js 15 App Router. Three route groups. **Critical architectural change from Phase 2**: as of commit `8e536fc`, all platform content now lives under a single canonical tree at `app/(platform)/service/`. All legacy parallel routes (`/trading/*`, `/execution/*`, `/ml/*`, `/research/*`, `/strategy-platform/*`) have been deleted and replaced with permanent redirects in `next.config.mjs`.

---

## Route Group Overview

| Group | URL prefix | Audience | Auth required |
|---|---|---|---|
| `(public)/` | `/`, `/login`, `/services/*`, etc. | Unauthenticated visitors | No |
| `(platform)/` | `/dashboard`, `/service/*`, `/strategies/*`, etc. | Authenticated org users + internal | Yes |
| `(ops)/` | `/admin`, `/devops`, `/compliance`, etc. | Internal operators only | Yes + role gate |

---

## (public)/ — Marketing & Unauthenticated (14 pages)

```
(public)/
├── layout.tsx                  Public shell — site header + footer only
├── page.tsx                    Home / landing page
├── login/page.tsx              Login — Internal/External toggle + 5 demo personas
├── signup/page.tsx             Sign-up — service interest → contact flow
├── demo/page.tsx               Live demo entry
├── demo/preview/page.tsx       Demo feature tour
├── contact/page.tsx
├── docs/page.tsx               Public documentation
├── investor-relations/page.tsx
├── privacy/page.tsx
├── terms/page.tsx
└── services/                   Service marketing pages (7)
    ├── platform/page.tsx
    ├── execution/page.tsx
    ├── backtesting/page.tsx
    ├── data/page.tsx
    ├── engagement/page.tsx
    ├── investment/page.tsx
    └── regulatory/page.tsx
```

---

## (platform)/ — Authenticated Platform

Layout: `app/(platform)/layout.tsx` — RequireAuth + UnifiedShell (lifecycle nav).

### Top-level pages (not under /service/)

```
(platform)/
├── layout.tsx
├── dashboard/page.tsx              Post-login dashboard (role-aware)
├── health/page.tsx                 System health summary
├── settings/page.tsx               User/org settings (added to fix 404)
├── data/page.tsx                   → redirects to /service/data/overview
├── strategies/
│   ├── page.tsx                    Strategy list/grid
│   ├── grid/page.tsx               Grid view
│   └── [id]/page.tsx               Dynamic: individual strategy detail
├── client-portal/
│   └── [org]/page.tsx              Dynamic: org-scoped client portal
└── portal/                         Client-facing portal (8 pages)
    ├── page.tsx
    ├── login/page.tsx
    ├── dashboard/page.tsx
    ├── backtesting/page.tsx
    ├── data/page.tsx
    ├── execution/page.tsx          (added to fix 404)
    ├── investment/page.tsx
    ├── regulatory/page.tsx
    └── whitelabel/page.tsx         (added to fix 404)
```

---

## (platform)/service/ — The Canonical Content Tree

**This is where all platform content lives.** Every domain has its real page.tsx here. Legacy routes in the old flat structure (`/trading/`, `/execution/`, `/ml/`, etc.) now permanently redirect here.

```
service/
├── overview/page.tsx               Service hub — entry after login
├── [key]/page.tsx                  Dynamic: service detail by registry key
├── observe/
│   ├── news/page.tsx
│   └── strategy-health/page.tsx
│
├── data/                           DATA SERVICE
│   ├── overview/page.tsx
│   ├── coverage/page.tsx
│   ├── venues/page.tsx
│   ├── markets/page.tsx
│   ├── markets/pnl/page.tsx        (moved here from /trading/markets/pnl/)
│   ├── logs/page.tsx
│   └── missing/page.tsx
│
├── trading/                        TRADING SERVICE
│   ├── overview/page.tsx
│   ├── accounts/page.tsx
│   ├── markets/page.tsx
│   ├── orders/page.tsx
│   ├── positions/page.tsx
│   ├── alerts/page.tsx
│   └── risk/page.tsx
│
├── execution/                      EXECUTION SERVICE
│   ├── overview/page.tsx
│   ├── tca/page.tsx
│   ├── venues/page.tsx
│   ├── algos/page.tsx
│   ├── benchmarks/page.tsx
│   ├── candidates/page.tsx
│   └── handoff/page.tsx
│
├── reports/                        REPORTS SERVICE
│   ├── overview/page.tsx
│   ├── executive/page.tsx
│   ├── reconciliation/page.tsx
│   ├── regulatory/page.tsx
│   └── settlement/page.tsx
│
└── research/                       RESEARCH SERVICE (strategy + ML + execution)
    ├── overview/page.tsx
    ├── quant/page.tsx              (copied from /quant/ before deletion)
    │
    ├── strategy/                   STRATEGY PLATFORM
    │   ├── overview/page.tsx       (copied here before /strategy-platform/ was deleted)
    │   ├── backtests/page.tsx
    │   ├── candidates/page.tsx
    │   ├── compare/page.tsx
    │   ├── heatmap/page.tsx
    │   ├── handoff/page.tsx
    │   └── results/page.tsx
    │
    ├── ml/                         ML PLATFORM
    │   ├── page.tsx
    │   ├── overview/page.tsx
    │   ├── config/page.tsx
    │   ├── experiments/page.tsx
    │   ├── experiments/[id]/page.tsx   Dynamic: experiment detail
    │   ├── features/page.tsx
    │   ├── training/page.tsx
    │   ├── deploy/page.tsx
    │   ├── monitoring/page.tsx
    │   ├── governance/page.tsx
    │   ├── registry/page.tsx
    │   └── validation/page.tsx
    │
    └── execution/                  RESEARCH EXECUTION ANALYTICS
        ├── algos/page.tsx
        ├── benchmarks/page.tsx
        ├── tca/page.tsx
        └── venues/page.tsx
```

---

## (ops)/ — Operations & Admin (15 pages)

Internal-only. Hidden from client personas.

```
(ops)/
├── layout.tsx                  Ops shell — role gate (admin/internal only)
├── admin/page.tsx
├── admin/data/page.tsx
├── compliance/page.tsx
├── config/page.tsx
├── devops/page.tsx             Deployment console (17K+ ported from deployment-ui)
├── engagement/page.tsx
├── internal/page.tsx
├── internal/data-etl/page.tsx
├── manage/
│   ├── clients/page.tsx
│   ├── users/page.tsx
│   ├── fees/page.tsx
│   └── mandates/page.tsx
└── ops/
    ├── page.tsx
    ├── jobs/page.tsx
    └── services/page.tsx
```

---

## Redirect Map (next.config.mjs)

All old flat and parallel routes now permanently redirect to `/service/*`. Agents must NOT create new pages at these old paths — they will be overwritten by redirects.

| Old URL | → Canonical URL |
|---|---|
| `/overview` | `/service/overview` |
| `/data` | `/service/data/overview` |
| `/trading` | `/service/trading/overview` |
| `/trading/positions` | `/service/trading/positions` |
| `/trading/risk` | `/service/trading/risk` |
| `/trading/alerts` | `/service/trading/alerts` |
| `/trading/markets` | `/service/data/markets` |
| `/trading/markets/:path*` | `/service/data/markets/:path*` |
| `/research` | `/service/research/overview` |
| `/research/strategy/:path*` | `/service/research/strategy/:path*` |
| `/research/ml/:path*` | `/service/research/ml/:path*` |
| `/research/execution/:path*` | `/service/research/execution/:path*` |
| `/ml` | `/service/research/ml` |
| `/ml/:path*` | `/service/research/ml/:path*` |
| `/positions` | `/service/trading/positions` |
| `/risk` | `/service/trading/risk` |
| `/alerts` | `/service/trading/alerts` |
| `/strategy-platform` | `/service/research/strategy/backtests` |
| `/strategy-platform/:path*` | `/service/research/strategy/:path*` |
| `/execution` | `/service/execution/overview` |
| `/execution/:path*` | `/service/execution/:path*` |
| `/reports` | `/service/reports/overview` |
| `/reports/:path*` | `/service/reports/:path*` |
| `/markets` | `/service/data/markets` |
| `/markets/pnl` | `/service/data/markets/pnl` |
| `/executive` | `/service/reports/executive` |
| `/quant` | `/service/research/quant` |

---

## Dynamic Routes

| Pattern | Example URL | Purpose |
|---|---|---|
| `service/[key]/page.tsx` | `/service/execution-service` | Service detail by registry key |
| `service/research/ml/experiments/[id]/page.tsx` | `/service/research/ml/experiments/exp-42` | ML experiment detail |
| `strategies/[id]/page.tsx` | `/strategies/strat-001` | Strategy detail |
| `client-portal/[org]/page.tsx` | `/client-portal/odum` | Org-scoped portal |

---

## Layout Hierarchy

```
app/layout.tsx                          Root — providers, theme, fonts (lib/providers.tsx)
├── app/(public)/layout.tsx             Public shell — site header + footer
├── app/(platform)/layout.tsx           Platform shell — RequireAuth + UnifiedShell
└── app/(ops)/layout.tsx                Ops shell — RequireAuth + internal/admin role gate
```

No sub-layouts remain under `(platform)/service/` — the cleanup commit deleted all sub-layouts that existed in the legacy parallel trees.

---

## Key Rule for Agents

**When adding a new platform page**, always create it under `app/(platform)/service/<domain>/`. Never create new pages at the old flat paths (`/trading/`, `/execution/`, `/ml/`, etc.) — those paths are redirects and the files would be unreachable.

**When adding a new redirect** (e.g. for a renamed URL), edit `next.config.mjs` `redirects()` array only.
