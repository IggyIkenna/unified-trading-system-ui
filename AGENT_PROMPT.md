# Agent System Prompt — Unified Trading System UI

ONE platform. THREE tiers (public/client/internal). SHARDS: CeFi/DeFi/Sports/TradFi. Workflow: Design→Simulate→Promote→Run→Monitor→Explain→Reconcile.

## CURRENT STATE (What Exists Now)

The codebase is **pre-Phase 2** — a V0-generated prototype:

| What | Current State |
|------|---------------|
| App structure | **FLAT** — 33 route dirs directly under `app/` (no route groups yet) |
| Mock data | **INLINE** — ~9,100 lines of hardcoded objects in `lib/*.ts` files |
| State management | **NONE** — no Zustand, no React Query |
| API layer | **NONE** — pages render static data, no fetch calls |
| Auth | **MINIMAL** — `hooks/use-auth.ts` reads localStorage, returns `{ user, loading, logout }` |
| Config | **NONE** — no `lib/config/`, values hardcoded in components |
| Shells | **PARTIAL** — `components/shell/` has 6 components (unified-shell, lifecycle-nav, require-auth, role-layout, role-selection, site-header) but NOT wired as layout.tsx files |
| Components | **GOOD** — 59 Radix UI primitives in `components/ui/`, domain components in `components/trading/`, `components/data/`, etc. |
| Registry data | **FRESH** — `lib/registry/openapi.json` (298 endpoints), `config-registry.json`, `system-topology.json`, `ui-reference-data.json` |

**Directories that DO NOT exist yet** (you will create them):
`lib/config/`, `lib/mocks/`, `lib/stores/`, `lib/types/`, `hooks/api/`, `app/(public)/`, `app/(platform)/`, `app/(ops)/`

## RULES (violation = wasted work)

1. **NO V2/Refactored files.** Ask before breaking changes. Update `UI_STRUCTURE_MANIFEST.json`.
2. **Shared components** (filters/tables/headers) in `components/`, not per-page. One impl, everywhere.
3. **Zero hardcoding.** API endpoints, colors, strings from `lib/config/`. Change once = everywhere.
4. **Mocking:** `lib/mocks/` only (MSW handlers + fixtures). Same in dev & tests. No per-page mocks.
5. **Auth:** `hooks/use-auth.ts` is the single auth hook. One place for permission rules.
6. **Shard-aware:** scope data shard→venue→instrument. Never cross-shard in one component.
7. **Same pages, different data.** NEVER build separate client/internal page versions. One page, API scopes the data via org + entitlements.
8. If unable to follow rules, tell user immediately — they will use a better agent.

## BEFORE CODING — Read These Files (All In-Repo)

| Order | File | What It Tells You |
|-------|------|-------------------|
| 1 | `ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md` | Platform vision, role model, 7-stage lifecycle, service areas |
| 2 | `context/CONFIG_REFERENCE.md` | Backend configuration fields and types |
| 3 | `context/SHARDING_DIMENSIONS.md` | 3-layer data scoping: infrastructure → client → subscription |
| 4 | `context/API_FRONTEND_GAPS.md` | What APIs exist (🟢), need workaround (🟡), or are blocked (🔴) |
| 5 | `UI_STRUCTURE_MANIFEST.json` | SSOT for current vs target structure. Check `current_structure.status`. |
| 6 | `.cursorrules` | Target patterns (NOT current state). Describes what the codebase SHOULD look like after refactor. |
| 7 | `REFACTORING_PLAN_PHASE_1-4.md` | Phase-by-phase execution plan with migration manifests |
| 8 | `REFACTORING_GUIDE.md` | Refactor lifecycle protocol: ask → start → track → complete → rollback |
| 9 | `QA_GATES.md` | Quality checks + `.scripts/verify.sh` specification |

Also available for reference:
- `lib/registry/openapi.json` — 298 backend API endpoints (source for type generation + mock handlers)
- `lib/registry/config-registry.json` — service configuration schemas (46 config types)
- `lib/registry/system-topology.json` — service metadata, health endpoints, dependencies
- `lib/registry/ui-reference-data.json` — venues, instruments, categories, asset classes
- `context/api-contracts/` — external data schemas, canonical models, domain facades
- `context/internal-contracts/` — internal service-to-service types
- `context/codex/` — architecture standards, domain glossary, coding rules
- `_reference/` — prior UI implementations for migration reference

## REFACTOR vs NEW

**Refactor existing page?**
1. Read `UI_STRUCTURE_MANIFEST.json` — find the page.
2. Ask: "I plan to [change]. Approve?"
3. Update in place. Delete originals. No V2 files.
4. Update `UI_STRUCTURE_MANIFEST.json` when done.

**New page?**
1. Create in correct route group: `app/(public)/`, `app/(platform)/`, or `app/(ops)/`.
2. Use layout.tsx from the route group (auth + shell applied automatically).
3. Wire to React Query hook in `hooks/api/`.

## STRUCTURE (Next.js 16 App Router)

```
app/
├── (public)/              ← Unauthenticated: landing, login, signup, docs, contact
│   └── layout.tsx         ← PublicShell: header + CTA + footer, no sidebar
├── (platform)/            ← THE product: same pages for internal AND client users
│   └── layout.tsx         ← PlatformShell: auth required, entitlement-driven nav
├── (ops)/                 ← Internal-only: admin, ops, devops, compliance, manage
│   └── layout.tsx         ← OpsShell: auth + role="internal" required
├── layout.tsx             ← Root layout: fonts, providers, analytics
└── globals.css            ← Design tokens

components/                ← Shared across all route groups
├── ui/                    ← Radix UI primitives (59 components)
├── shell/                 ← Shell infrastructure (unified-shell, lifecycle-nav, etc.)
├── trading/               ← Trading domain components
├── dashboards/            ← Dashboard layouts
├── data/                  ← Data catalogue components
├── marketing/             ← Public page components
└── [domain]/              ← Other domain-specific components

lib/
├── config/                ← Centralized config (api.ts, branding.ts, auth.ts, services.ts)
├── mocks/                 ← MSW infrastructure
│   ├── handlers/          ← 16 per-service mock handlers
│   ├── fixtures/          ← Static fixture data + personas
│   └── adapters/          ← Transform mock→component props
├── stores/                ← Zustand stores (filter, auth, ui-prefs)
├── types/                 ← Generated + shared TypeScript types
├── registry/              ← OpenAPI specs, config registry, reference data
└── utils.ts               ← Shared utilities

hooks/
├── use-auth.ts            ← Auth hook (single source for permission rules)
├── use-mobile.ts          ← Responsive breakpoint hook
├── use-toast.ts           ← Toast notification hook
└── api/                   ← React Query hooks per service domain
    ├── use-instruments.ts
    ├── use-positions.ts
    ├── use-orders.ts
    └── [use-{domain}.ts]
```

## CODE PATTERNS

```typescript
// API config — NEVER hardcode endpoints
import { API_CONFIG } from '@/lib/config/api'

// Branding — NEVER hardcode colors/strings
import { COLORS, COMPANY } from '@/lib/config/branding'

// Auth — ALWAYS scope data through auth context
const { user } = useAuth()
// Internal sees all orgs; client sees their org only

// Shard-aware filtering — ALWAYS: shard → venue → instrument
const { shard, venue, instrument } = useFilterStore()

// Data fetching — ALWAYS React Query + MSW-compatible
const { data, isLoading } = useInstruments({ shard, venue })

// Mock handlers — persona-scoped dimensional mocking
// Same endpoint returns different data per persona
```

## QA GATE (Before PR/Deploy)

```bash
bash .scripts/verify.sh
```

Runs: clean → install → type-check → build → test.
Catches broken imports, TypeScript errors, missing deps. See `QA_GATES.md`.

## PROGRESS TRACKING

Create/update `PROGRESS.md` at repo root. After each step:
- Step number + name
- Status: ✅ DONE / 🚧 IN PROGRESS / ❌ BLOCKED (reason)
- Files created/moved/deleted

Update `UI_STRUCTURE_MANIFEST.json` after each major structural change.

## QUALITY STANDARD

100% institutional standard or stop. No half-baked work. User escalates to better model.

## MANDATE

Don't guess. Look it up. Shared. Centralized. One truth. Ask before breaking.
