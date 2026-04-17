# Codebase Structure — unified-trading-system-ui

**Last verified: 2026-04-17**
**Supersedes `START_HERE.md` and `AGENT_PROMPT.md` (deleted — gold folded in).**

**Read this first.** One page. Every agent must read this before touching code.
Deep documentation for each folder lives in sibling `docs/STRUCTURE_*.md` files.

---

## §0 Agent Onboarding (5 Steps)

Complete this onboarding before you start coding (~40 min total). Paths are repo-relative.

### Step 1 — Understand the Platform (15 min)

Read: [`docs/ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md`](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md)

Learn:

- What the platform is (unified institutional system, not just a website)
- The three experience modes (public, client, internal)
- The six service areas (data, research, execution, reporting, admin, deployment)
- The core workflow: Design → Simulate → Promote → Run → Monitor → Explain → Reconcile
- Role model and organization-first architecture

### Step 2 — Understand the Code Structure (5 min)

You are reading it. Then dive into the deep docs for your area:

- [`docs/STRUCTURE_COMPONENTS.md`](./STRUCTURE_COMPONENTS.md) — all component domains
- [`docs/STRUCTURE_LIB.md`](./STRUCTURE_LIB.md) — types, stores, mocks, config
- [`docs/STRUCTURE_HOOKS.md`](./STRUCTURE_HOOKS.md) — React Query hooks
- [`docs/STRUCTURE_CONTEXT.md`](./STRUCTURE_CONTEXT.md) — backend reference material
- [`docs/ROUTES.md`](./ROUTES.md) — full route inventory + redirect map
- [`docs/TIER_ZERO.md`](./TIER_ZERO.md) — tier-0 scaffold and guardrails

### Step 3 — Understand Data Partitioning (10 min)

Every data screen must be shard-aware. Five primary shards: **CeFi, DeFi, Sports, TradFi, OnChain**.
Partitioning: shard → venue → instrument → org. Never mix data across shards in one component.
Reference: [`docs/UX_OPERATING_RULES.md`](./UX_OPERATING_RULES.md), [`docs/UX_FLOW_SPEC.md`](./UX_FLOW_SPEC.md).

### Step 4 — Check API Readiness (5 min)

Scan: `context/API_FRONTEND_GAPS.md`

- 🔴 API blocked — don't build features that depend on this yet
- 🟡 API in progress — plan it, but wait
- 🟢 API ready — build now

### Step 5 — Review Coding + UX Rules (5 min)

- [`docs/UX_OPERATING_RULES.md`](./UX_OPERATING_RULES.md) — UX invariants
- [`docs/DATA_MODE_IDEOLOGY.md`](./DATA_MODE_IDEOLOGY.md) — mock vs. real data
- [`docs/QA_GATES.md`](./QA_GATES.md), [`docs/TESTING.md`](./TESTING.md), [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md)
- [`docs/FRONTEND_PRIMER_FOR_BACKEND_ENGINEERS.md`](./FRONTEND_PRIMER_FOR_BACKEND_ENGINEERS.md) — if you come from the backend
- [`README.md`](../README.md) — repo-level quickstart

Key rules:

- All new platform pages go under `app/(platform)/services/<domain>/`
- Never create pages at legacy flat paths (`/trading/`, `/execution/`, `/ml/`, `/research/`, `/strategy-platform/`) — they are permanent redirects in `next.config.mjs`
- Components in `components/<domain>/` with kebab-case filenames
- Domain types in `lib/<domain>-types.ts`; mock data via MSW handlers in `lib/mocks/handlers/<domain>.ts`
- No V2/Refactored files — update in place, delete originals

---

## What This Repo Is

A **Next.js 16.2.1** App Router TypeScript application (React 19.2.4). Institutional trading platform UI serving three audiences:

- **Public** — marketing, service discovery, demo
- **Client / org user** — authenticated, sees only their org's entitlements
- **Internal user** — full operator surface (quant, trader, risk, devops, compliance, admin)

Design language: dark, institutional, premium. Not a generic SaaS dashboard.

Lifecycle model the UI aligns to: **Design → Simulate → Promote → Run → Monitor → Explain → Reconcile**

---

## Folder Map (code only)

```
app/               Next.js pages — route groups (public), (platform), (ops) + api/, health/
components/        React components — domain subfolders (ui, shell, trading, platform, dashboards,
                   ops, data, ml, marketing, execution-platform, strategy-platform, research, risk,
                   reports, promote, batch-workspace, chat, shared, widgets)
lib/               Types, stores (Zustand), MSW mocks, config, registry, runtime, utilities
hooks/             React Query data hooks (hooks/api/) + deployment hooks (hooks/deployment/)
context/           Read-only agent reference: API contracts, schemas, topology, config registry
styles/            globals.css — Tailwind + custom CSS variables
public/            Static assets, icons, MSW worker script
_reference/        Python FastAPI backends (deployment-api, versa-* services) — READ ONLY
eslint-rules/      Custom ESLint rules (button handler, filter prop)
```

Verified top-level `app/` entries: `api/`, `health/`, `(ops)/`, `(platform)/`, `(public)/`, plus `layout.tsx`, `error.tsx`, `not-found.tsx`, `globals.css`, `opengraph-image.tsx`.

---

## Architecture: Single Canonical Route Tree

**Critical:** All platform content lives under `app/(platform)/services/`. Legacy flat routes (`/trading/*`, `/execution/*`, `/ml/*`, `/research/*`, `/strategy-platform/*`, etc.) are permanent redirects in `next.config.mjs` — there are no page files at those paths. See [`docs/ROUTES.md`](./ROUTES.md) for the full redirect map.

```
app/
├── (public)/              -- Unauthenticated: landing, login, signup, docs, contact, services/*
│   └── layout.tsx         -- PublicShell: site header + footer, no sidebar
├── (platform)/            -- THE product: same pages for internal AND client users
│   ├── layout.tsx         -- PlatformShell: RequireAuth + UnifiedShell (lifecycle nav)
│   ├── dashboard/         -- Post-login dashboard (role-aware)
│   ├── health/            -- System health summary
│   ├── settings/          -- User/org settings
│   ├── strategies/        -- Strategy list/grid + [id] detail
│   ├── client-portal/     -- Org-scoped client portal
│   ├── portal/            -- Client-facing portal
│   └── services/          -- THE CANONICAL CONTENT TREE
│       ├── overview/      -- Service hub (entry after login)
│       ├── [key]/         -- Dynamic: service detail by registry key
│       ├── data/          -- Data service
│       ├── trading/       -- Trading service
│       ├── execution/     -- Execution service
│       ├── reports/       -- Reports service
│       ├── research/      -- Research service (quant, strategy/*, ml/*, execution/*)
│       └── observe/       -- Observe (news, strategy-health)
└── (ops)/                 -- Internal-only: admin, ops, devops, compliance, manage/*
    └── layout.tsx         -- OpsShell: RequireAuth + internal/admin role gate
```

---

## Quick Decision Guide for Agents

| Task                               | Where to go                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| Add a new platform page            | `app/(platform)/services/<domain>/` — **only canonical location**            |
| Add a new redirect for renamed URL | `next.config.mjs` → `redirects()` array                                      |
| Add a reusable component           | `components/<domain>/` — pick the closest domain                             |
| Add a base UI primitive            | `components/ui/` — shadcn/ui pattern                                         |
| Add a data-fetching hook           | `hooks/api/use-<domain>.ts`                                                  |
| Add a Zustand store                | `lib/stores/`                                                                |
| Add domain types                   | `lib/<domain>-types.ts` (convention) or `lib/types/`                         |
| Add MSW mock handler               | `lib/mocks/handlers/<domain>.ts` + register in `lib/mocks/handlers/index.ts` |
| Add app config or branding         | `lib/config/`                                                                |
| Understand API shape / schema      | `context/api-contracts/`                                                     |
| Understand what's not yet built    | `context/API_FRONTEND_GAPS.md`                                               |
| Understand backend data flow       | `context/pm/data-flow-manifest.json`                                         |
| Understand service config fields   | `context/api-contracts/openapi/config-registry.json`                         |
| Understand backend Python patterns | `_reference/deployment-api/` — reference only                                |

---

## State Management Contract

| State type                        | Tool          | Location                           |
| --------------------------------- | ------------- | ---------------------------------- |
| Server / async data               | React Query   | `hooks/api/use-*.ts`               |
| Global filters (org, date, shard) | Zustand       | `lib/stores/global-scope-store.ts` |
| Auth + role                       | Zustand       | `lib/stores/auth-store.ts`         |
| UI preferences (theme, layout)    | Zustand       | `lib/stores/ui-prefs-store.ts`     |
| Feature filters                   | Zustand       | `lib/stores/filter-store.ts`       |
| Batch vs live mode                | React Context | `lib/execution-mode-context.tsx`   |

---

## Code Patterns

```typescript
// API config — NEVER hardcode endpoints
import { API_CONFIG } from "@/lib/config/api";

// Branding — NEVER hardcode colors/strings
import { COLORS, COMPANY } from "@/lib/config/branding";

// Auth — ALWAYS scope data through auth store
const { user } = useAuthStore();

// Shard-aware filtering — ALWAYS: shard -> venue -> instrument
const { selectedShard, selectedOrg } = useGlobalScopeStore();

// Data fetching — ALWAYS React Query + MSW-compatible
const { data, isLoading } = useInstruments({ shard, venue });
```

---

## Deleted Components (do not recreate)

Deleted in commit `8e536fc` — zero consumers after nav consolidation:

- `components/trading/global-nav-bar.tsx` — replaced by `shell/lifecycle-nav.tsx`
- `components/trading/app-shell.tsx` — GlobalNavBar wrapper, no longer needed
- `components/trading/lifecycle-rail.tsx` — merged into `shell/lifecycle-nav.tsx`
- `components/shell/role-layout.tsx` — role layout now handled inline
- `components/platform/unified-batch-shell.tsx` — no consumers

---

## Tech Stack

- **Framework**: Next.js 16.2.1, App Router, TypeScript strict mode
- **Runtime**: React 19.2.4
- **Package manager**: **pnpm only** (no npm/yarn)
- **Styling**: Tailwind CSS + shadcn/ui components (`components.json`)
- **State**: Zustand (client) + React Query (server)
- **Testing**: **Vitest 4.1.1** (unit) + Playwright (E2E in `e2e/`)
- **API mocking**: MSW (Mock Service Worker) — `public/mockServiceWorker.js`
- **Linting**: ESLint + 2 custom rules in `eslint-rules/`

---

## QA Gate (Before PR/Deploy)

> **Warning:** `pnpm lint` and `pnpm tsc` are currently **noop stubs** in this repo.
> Use the explicit forms instead:

```bash
pnpm exec tsc --noEmit        # type-check
pnpm exec eslint .            # lint
pnpm build                    # build smoke test
pnpm test                     # Vitest unit tests
```

Full verification steps: [`docs/QA_GATES.md`](./QA_GATES.md) and [`docs/TESTING.md`](./TESTING.md).

---

## Final Doc Set (canonical orientation)

| File                                                                                          | Covers                                                        |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `docs/CODEBASE_STRUCTURE.md` (this file)                                                      | Canonical first-read — folder map, rules, onboarding          |
| [`docs/ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md`](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md)       | Platform vision, role model, 7-stage lifecycle, service areas |
| [`docs/ROUTES.md`](./ROUTES.md)                                                               | Full route inventory + legacy redirect map                    |
| [`docs/STRUCTURE_LIB.md`](./STRUCTURE_LIB.md)                                                 | `lib/` layout — types, stores, mocks, config, utilities       |
| [`docs/STRUCTURE_HOOKS.md`](./STRUCTURE_HOOKS.md)                                             | `hooks/api/` and `hooks/deployment/` — conventions + patterns |
| [`docs/STRUCTURE_COMPONENTS.md`](./STRUCTURE_COMPONENTS.md)                                   | All component domains, key files, naming rules                |
| [`docs/STRUCTURE_CONTEXT.md`](./STRUCTURE_CONTEXT.md)                                         | `context/` — how to use backend reference material            |
| [`docs/TIER_ZERO.md`](./TIER_ZERO.md)                                                         | Tier-0 scaffold, guardrails, dependency constraints           |
| [`docs/UX_OPERATING_RULES.md`](./UX_OPERATING_RULES.md)                                       | UX invariants and operating rules                             |
| [`docs/UX_FLOW_SPEC.md`](./UX_FLOW_SPEC.md)                                                   | End-to-end UX flows                                           |
| [`docs/DATA_MODE_IDEOLOGY.md`](./DATA_MODE_IDEOLOGY.md)                                       | Mock-vs-real data ideology — `isMockDataMode()`               |
| [`docs/FRONTEND_PRIMER_FOR_BACKEND_ENGINEERS.md`](./FRONTEND_PRIMER_FOR_BACKEND_ENGINEERS.md) | Primer for backend engineers onboarding to the UI             |
| [`docs/TESTING.md`](./TESTING.md), [`docs/QA_GATES.md`](./QA_GATES.md)                        | Test strategy and QA gates                                    |
| [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md)                                                       | Deployment flow                                               |
| [`README.md`](../README.md)                                                                   | Repo-level quickstart                                         |

---

## Mandate

Don't guess. Look it up. Shared. Centralized. One truth. Ask before breaking.
