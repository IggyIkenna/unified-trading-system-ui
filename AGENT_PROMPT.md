# Agent System Prompt — Unified Trading System UI

ONE platform. THREE tiers (public/client/internal). SHARDS: CeFi/DeFi/Sports/TradFi/OnChain. Workflow: Design→Simulate→Promote→Run→Monitor→Explain→Reconcile.

## CURRENT STATE (Post-Phase 2 Cleanup, commit `8e536fc`)

| What             | Current State                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| App structure    | **ROUTE GROUPS** — `app/(public)/`, `app/(platform)/`, `app/(ops)/`                                                                   |
| Canonical routes | **ALL under `/service/`** — `app/(platform)/service/<domain>/`. Legacy flat routes are redirects in `next.config.mjs`                 |
| Mock data        | **MSW** — 15 domain handlers in `lib/mocks/handlers/`, persona-scoped fixtures in `lib/mocks/fixtures/`                               |
| State management | **Zustand + React Query** — 4 stores in `lib/stores/`, 14 hooks in `hooks/api/`                                                       |
| API layer        | **React Query** — hooks in `hooks/api/`, MSW serves data when `NEXT_PUBLIC_MOCK_API=true`                                             |
| Auth             | **5 demo personas** — admin, internal-trader, client-full, client-data-only, client-premium in `lib/mocks/fixtures/personas.ts`       |
| Config           | **Centralized** — `lib/config/` (api.ts, branding.ts, auth.ts, services.ts, platform-stats.ts)                                        |
| Components       | **11 domains** — 57 UI primitives, 30 trading, 19 ops/deployment, 10 platform, 6 dashboards, 6 marketing, 5 data, 2 ML, + shell/nav   |
| Navigation       | **Lifecycle nav only** — `components/shell/lifecycle-nav.tsx` (no legacy nav models)                                                  |
| Registry data    | **Available** — `lib/registry/openapi.json` (298 endpoints), `config-registry.json`, `system-topology.json`, `ui-reference-data.json` |

## RULES (violation = wasted work)

1. **New platform pages** go in `app/(platform)/service/<domain>/` ONLY. Never at old flat paths (`/trading/`, `/execution/`, `/ml/`, `/research/`, `/strategy-platform/`).
2. **No V2/Refactored files.** Update in place. Delete originals.
3. **Shared components** in `components/<domain>/` — not per-page. One impl, everywhere.
4. **Zero hardcoding.** API endpoints, colors, strings from `lib/config/`. Change once = everywhere.
5. **Mocking:** `lib/mocks/handlers/<domain>.ts` + register in `lib/mocks/handlers/index.ts`. Same in dev & tests.
6. **Auth:** `lib/stores/auth-store.ts` is the auth store. One place for permission rules.
7. **Shard-aware:** scope data shard→venue→instrument. Never cross-shard in one component.
8. **Same pages, different data.** NEVER build separate client/internal page versions. One page, API scopes data via org + entitlements.
9. **Deleted components — do NOT recreate:** `global-nav-bar.tsx`, `app-shell.tsx`, `lifecycle-rail.tsx`, `role-layout.tsx`, `unified-batch-shell.tsx`

## BEFORE CODING — Read These Files (All In-Repo)

| Order | File                                    | What It Tells You                                                       |
| ----- | --------------------------------------- | ----------------------------------------------------------------------- |
| 1     | `CODEBASE_STRUCTURE.md`                 | Folder map, state management, tech stack, quick decision guide          |
| 2     | `ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md` | Platform vision, role model, 7-stage lifecycle, service areas           |
| 3     | `context/SHARDING_DIMENSIONS.md`        | 3-layer data scoping: infrastructure → client → subscription            |
| 4     | `context/API_FRONTEND_GAPS.md`          | What APIs exist (green), need workaround (yellow), or are blocked (red) |
| 5     | `.cursorrules`                          | Coding patterns — describes the target state                            |
| 6     | `UI_STRUCTURE_MANIFEST.json`            | SSOT for codebase metadata: routes, components, personas, mock handlers |

Deep docs for each folder: `docs/STRUCTURE_APP.md`, `docs/STRUCTURE_COMPONENTS.md`, `docs/STRUCTURE_LIB.md`, `docs/STRUCTURE_HOOKS.md`, `docs/STRUCTURE_CONTEXT.md`, `docs/STRUCTURE_REFERENCE.md`.

Also available for reference:

- `lib/registry/openapi.json` — 298 backend API endpoints (source for type generation + mock handlers)
- `lib/registry/config-registry.json` — service configuration schemas (46 config types)
- `lib/registry/system-topology.json` — service metadata, health endpoints, dependencies
- `lib/registry/ui-reference-data.json` — venues, instruments, categories, asset classes
- `context/api-contracts/` — external data schemas, canonical models, domain facades
- `context/internal-contracts/` — internal service-to-service types
- `context/codex/` — architecture standards, domain glossary, coding rules
- `_reference/` — prior UI implementations for migration reference (READ ONLY, do not modify)

## STRUCTURE (Next.js 15 App Router)

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
│   ├── portal/            -- Client-facing portal (8 pages)
│   └── service/           -- THE CANONICAL CONTENT TREE
│       ├── overview/      -- Service hub (entry after login)
│       ├── [key]/         -- Dynamic: service detail by registry key
│       ├── data/          -- Data service (overview, coverage, venues, markets, logs, missing)
│       ├── trading/       -- Trading service (overview, accounts, markets, orders, positions, alerts, risk)
│       ├── execution/     -- Execution service (overview, tca, venues, algos, benchmarks, candidates, handoff)
│       ├── reports/       -- Reports service (overview, executive, reconciliation, regulatory, settlement)
│       ├── research/      -- Research service (overview, quant, strategy/*, ml/*, execution/*)
│       └── observe/       -- Observe (news, strategy-health)
└── (ops)/                 -- Internal-only: admin, ops, devops, compliance, manage/*
    └── layout.tsx         -- OpsShell: RequireAuth + internal/admin role gate

components/                -- Shared across all route groups
├── ui/                    -- shadcn/ui primitives (57 components)
├── shell/                 -- Shell infrastructure (unified-shell, lifecycle-nav, site-header, etc.)
├── trading/               -- Trading domain components (30 files)
├── platform/              -- Platform-wide shared (10 files)
├── dashboards/            -- Role-specific dashboards (6 files)
├── ops/deployment/        -- Deployment UI (19 files, ported from deployment-ui)
├── data/                  -- Data management (5 files)
├── ml/                    -- ML components (2 files)
└── marketing/             -- Landing page (6 files)

lib/
├── config/                -- Centralized config (api.ts, branding.ts, auth.ts, services.ts)
├── mocks/                 -- MSW infrastructure
│   ├── handlers/          -- 15 per-service mock handlers
│   └── fixtures/          -- Personas + static fixture data
├── stores/                -- Zustand stores (auth, filter, global-scope, ui-prefs)
├── types/                 -- TypeScript types (deployment.ts)
├── registry/              -- OpenAPI specs, config registry, reference data
├── *-types.ts             -- Domain type files (data-service, execution, ml, strategy)
├── *-mock-data.ts         -- Domain mock data files (pending cleanup — will be replaced by MSW)
├── providers.tsx           -- Root provider tree (QueryClient, Auth, Theme, Toaster)
├── query-client.ts        -- React Query client configuration
└── utils.ts               -- General utilities (cn(), formatters)

hooks/
├── api/                   -- React Query hooks per service domain (14 hooks)
├── deployment/            -- Deployment-specific hooks
├── use-auth.ts            -- Auth hook
├── use-mobile.ts          -- Responsive breakpoint hook
└── use-toast.ts           -- Toast notification hook
```

## CODE PATTERNS

```typescript
// API config — NEVER hardcode endpoints
import { API_CONFIG } from "@/lib/config/api";

// Branding — NEVER hardcode colors/strings
import { COLORS, COMPANY } from "@/lib/config/branding";

// Auth — ALWAYS scope data through auth store
const { user } = useAuthStore();
// Internal sees all orgs; client sees their org only

// Shard-aware filtering — ALWAYS: shard -> venue -> instrument
const { selectedShard, selectedOrg } = useGlobalScopeStore();

// Data fetching — ALWAYS React Query + MSW-compatible
const { data, isLoading } = useInstruments({ shard, venue });

// Mock handlers — persona-scoped dimensional mocking
// Same endpoint returns different data per persona
```

## STATE MANAGEMENT

| State type                        | Tool          | Location                           |
| --------------------------------- | ------------- | ---------------------------------- |
| Server / async data               | React Query   | `hooks/api/use-*.ts`               |
| Global filters (org, date, shard) | Zustand       | `lib/stores/global-scope-store.ts` |
| Auth + role                       | Zustand       | `lib/stores/auth-store.ts`         |
| UI preferences (theme, layout)    | Zustand       | `lib/stores/ui-prefs-store.ts`     |
| Feature filters                   | Zustand       | `lib/stores/filter-store.ts`       |
| Batch vs live mode                | React Context | `lib/execution-mode-context.tsx`   |

## QA GATE (Before PR/Deploy)

```bash
pnpm lint && pnpm tsc --noEmit && pnpm build && pnpm test
```

See `QA_GATES.md` for full verification steps.

## MANDATE

Don't guess. Look it up. Shared. Centralized. One truth. Ask before breaking.
