# Merge Plan: feat/phase-2-structural-refactor + task-planning-and-qa

**Goal:** Create a combined branch that captures the best of both implementations.

---

## Visual: What Each Branch Owns

```
                    OUR BRANCH                              THEIR BRANCH
                    (phase-2-structural-refactor)           (task-planning-and-qa)

INFRASTRUCTURE      ████████████████████  WINNER            ██████░░░░░░░░░░░░░░
  16 MSW handlers   ✅ complete                             9 handlers (missing 7)
  14 React Query    ✅ complete                             not built
  105 tests         ✅ 95%+ coverage                        unknown
  4 personas        ✅ with entitlements                    basic auth

SERVICE HUB         ████████████████████  WINNER            ░░░░░░░░░░░░░░░░░░░░
  /overview hub     ✅ service grid + activity              ❌ not built (uses old dashboard)
  /service/[key]    ✅ subscription funnel                  ❌ not built
  Upgrade modals    ✅ locked service CTAs                  ❌ not built

ADMIN/OPS           ████████████████████  WINNER            ██████░░░░░░░░░░░░░░
  /admin            ✅ interactive (org cards, stats)       stub (delegates to component)
  /manage/users     ✅ invite, role edit, suspend           not rebuilt
  /manage/clients   ✅ org CRUD, subscription edit          not rebuilt
  /manage/fees      ✅ fee editor, simulation               not rebuilt

RESEARCH/SIMULATE   ████████████████████  WINNER            ██████████░░░░░░░░░░
  strategy-platform ✅ 3 pages rebuilt (forms work)         pages exist, less interactive
  ML pages          ✅ 3 pages rebuilt (forms work)         pages exist, less interactive

LANDING/MARKETING   ██████████░░░░░░░░░░                    ████████████████████  WINNER
  Landing page      ⚠️ double header bug                   ✅ fixed header, polished
  Engagement page   ❌ not built                            ✅ built (150+ lines)
  Visual polish     ⚠️ functional but dense                ✅ cleaner layout

DATA COMPONENTS     ░░░░░░░░░░░░░░░░░░░░                    ████████████████████  WINNER
  freshness-heatmap ❌                                      ✅ GitHub-style calendar
  shard-catalogue   ❌                                      ✅ hierarchical browser
  cloud-pricing     ❌                                      ✅ cloud provider selector
  org-data-selector ❌                                      ✅ org picker
  subscription-mgr  ❌                                      ✅ subscription dashboard

MISSION CONTROL     ██████████░░░░░░░░░░                    ████████████████████  WINNER
  Overview dashboard ours = 88-line hub                     theirs = 488-line mission control
  (These serve different purposes — KEEP BOTH)

TRADING/POSITIONS   ████████████████████  TIED              ████████████████████
  /trading          806 lines (order entry works)           similar
  /positions        858 lines (protocol details)            similar
  /risk             1,443 lines                             similar
  /markets          2,119 lines                             similar
  /reports          773 lines                                similar
```

---

## Merge Strategy: What Goes Where

### KEEP FROM OURS (do not overwrite)

| File/Area | Why |
|---|---|
| All 16 MSW handlers (`lib/mocks/handlers/`) | Theirs deleted 7 we need |
| All 14 React Query hooks (`hooks/api/`) | Theirs doesn't have these |
| Test suite (`__tests__/`) | 105 tests, 95%+ coverage |
| Service hub (`components/platform/`) | They don't have this |
| Service subscription page (`app/(platform)/service/[key]/`) | They don't have this |
| Admin pages (admin, manage/users, manage/clients, manage/fees) | Our interactive rebuilds |
| Strategy-platform pages (overview, backtests, candidates) | Our interactive rebuilds |
| ML pages (page, experiments, registry) | Our interactive rebuilds |
| Auth flow (`hooks/use-auth.ts`, login page) | Ours has proper persona flow |
| Nav entitlement filtering (`lifecycle-nav.tsx`) | Ours checks entitlements |
| `lib/config/` (api, auth, branding, services) | Complete config system |
| `lib/stores/` (filter, auth, ui-prefs) | With reset() for demo |
| `lib/types/api-generated.ts` | Keep for now — delete later when hand-crafted types ready |
| Zustand + React Query + MSW wiring | `providers.tsx`, `query-client.ts`, `reset-demo.ts` |
| Architecture docs | ARCHITECTURE_HARDENING.md, PLANS_1/2/3, SERVICE_COMPLETION_STATUS |

### PORT FROM THEIRS (copy into our branch)

| File/Area | What it adds | Priority |
|---|---|---|
| `components/data/freshness-heatmap.tsx` | GitHub-style data availability calendar | HIGH |
| `components/data/shard-catalogue.tsx` | Hierarchical instrument browser | HIGH |
| `components/data/cloud-pricing-selector.tsx` | Cloud export pricing UI | MEDIUM |
| `components/data/org-data-selector.tsx` | Org picker for data pages | MEDIUM |
| `components/data/data-subscription-manager.tsx` | Subscription dashboard with KPIs | MEDIUM |
| `app/(public)/engagement/page.tsx` | Engagement models marketing page | MEDIUM |
| Their 488-line overview → `app/(platform)/dashboard/page.tsx` | Full mission control (separate from hub) | HIGH |

### FIX IN OURS (bugs/UX issues)

| Issue | Fix |
|---|---|
| Double header on landing page | Public layout adds SiteHeader; landing page should NOT add its own header |
| Overview too sparse for power users | Add `/dashboard` route with the mission control view (from their overview) |
| Footer hardcoded | Use `COMPANY` config from `lib/config/branding.ts` |

### DO NOT PORT (their approach is worse)

| Area | Why |
|---|---|
| Their `app/layout.tsx` (no Providers wrapper) | We need Providers for QueryClient + MSW |
| Their `(platform)/layout.tsx` (duplicate orgName bug) | Our version is correct |
| Their handler deletions (removed 7 handlers) | We need all 16 for complete demo |
| Their overview replacing our hub | Different purposes — both should exist |

---

## Execution Plan

### Step 1: Create merge branch from ours
```bash
git checkout feat/phase-2-structural-refactor
git checkout -b merge/combined-best-of-both
```

### Step 2: Port data components from theirs
```bash
git show origin/task-planning-and-qa:components/data/freshness-heatmap.tsx > components/data/freshness-heatmap.tsx
git show origin/task-planning-and-qa:components/data/shard-catalogue.tsx > components/data/shard-catalogue.tsx
# ... etc for each data component
```

### Step 3: Port engagement page
```bash
git show origin/task-planning-and-qa:app/\(public\)/engagement/page.tsx > app/\(public\)/engagement/page.tsx
```

### Step 4: Port mission control dashboard
```bash
git show origin/task-planning-and-qa:app/\(platform\)/overview/page.tsx > app/\(platform\)/dashboard/page.tsx
```

### Step 5: Fix double header on landing page

### Step 6: Verify build + tests

### Step 7: Push merge branch

---

## Post-Merge: Route Map

```
PUBLIC (unauthenticated):
  /                     Marketing landing (NO double header)
  /login                4 demo personas
  /services/*           Service marketing pages
  /engagement           Engagement models (PORTED from theirs)
  /contact, /docs, etc.

PLATFORM (authenticated — all personas land here):
  /overview             SERVICE HUB — cards, quick actions, activity (OURS)
  /dashboard            MISSION CONTROL — KPIs, P&L, health, alerts (THEIRS, new route)
  /service/[key]        Service subscription page (OURS)
  /trading              Trading terminal
  /positions            Position monitor
  /risk                 Risk dashboard
  /execution/*          Execution analytics
  /strategy-platform/*  Strategy research + backtesting
  /ml/*                 ML models + experiments
  /markets/*            Market data + P&L
  /reports              Reports + settlements
  /strategies           Strategy browser
  /alerts               Alert management
  /health               Service health

OPS (admin/internal only):
  /admin                Admin dashboard
  /manage/*             User, client, fee management
  /devops               DevOps dashboard
  /ops                  Operations
  /compliance           Compliance
```

---

## Visual: Combined Platform After Merge

```
┌─────────────────────────────────────────────────────────────┐
│  LANDING PAGE (public)                                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │  Data   │  │Research │  │Execution│  │  Invest │       │
│  │ Service │  │Backtest │  │ Service │  │  Mgmt  │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│       │ Subscribe   │           │              │             │
└───────┼─────────────┼───────────┼──────────────┼─────────────┘
        │             │           │              │
        ▼             ▼           ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│  LOGIN → SERVICE HUB (/overview)                             │
│  ┌──────────────────────────────────────────────────┐       │
│  │ Quick Actions: [Trading] [Risk] [Backtest] [ML]  │       │
│  ├──────────────────────────────────────────────────┤       │
│  │ Data          │ Trading      │ Analytics    │ ML │       │
│  │ ✅ Catalogue  │ ✅ Trading   │ ✅ Strategy  │ ✅│       │
│  │ ✅ Markets    │ ✅ Positions │ ✅ Reports   │   │       │
│  │               │ 🔒 Risk     │              │   │ ←client│
│  │               │ 🔒 Execution│              │   │  sees  │
│  ├──────────────────────────────────────────────────┤  locks │
│  │ Operations (internal only)                        │       │
│  │ ✅ Admin  ✅ DevOps  ✅ Compliance  ✅ Manage   │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
        │ Click service card
        ▼
┌─────────────────────────────────────────────────────────────┐
│  SERVICE PAGE (/service/[key])                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │ [Data Catalogue]  ✅ Subscribed                   │       │
│  │ Your tier: Data Pro (2,400 instruments)           │       │
│  ├──────────────────────────────────────────────────┤       │
│  │ Available Features:                               │       │
│  │ ┌────────────┐ ┌────────────┐ ┌────────────┐    │       │
│  │ │ Instrument │ │ Market     │ │ Data       │    │       │
│  │ │ Catalogue  │ │ Data       │ │ Status     │    │       │
│  │ │ → /portal  │ │ → /markets │ │ → /health  │    │       │
│  │ └────────────┘ └────────────┘ └────────────┘    │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
        │ Click feature card
        ▼
┌─────────────────────────────────────────────────────────────┐
│  DETAIL PAGE (/portal/data, /trading, /positions, etc.)      │
│  Same page for ALL users — API scopes the data               │
│  Internal sees all orgs; Client sees their org               │
└─────────────────────────────────────────────────────────────┘
```
