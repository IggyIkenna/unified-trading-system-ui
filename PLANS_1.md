# TASK: Structural Refactor — Sanitise Codebase to Target Architecture

You are refactoring the unified-trading-system-ui Next.js 16 App Router project.
This is a STRUCTURAL refactor only. No new features. No new pages. No new UI.
Move files, create directories, extract config, migrate mocks, wire plumbing.

## PROGRESS TRACKING (MANDATORY)

Create a `PROGRESS.md` file at repo root BEFORE starting. After completing each
step, update it with:
- Step number + name
- Status: ✅ DONE / 🚧 IN PROGRESS / ❌ BLOCKED (reason)
- Files created/moved/deleted
- Any blockers or decisions made

This file is your checkpoint. If you resume after a crash or context loss, read
`PROGRESS.md` first to know where you left off.

## BEFORE YOU WRITE ANY CODE

Read these files IN ORDER. They are your source of truth:

1. `UI_STRUCTURE_MANIFEST.json` — Current state vs target. The `current_structure`
   section tells you EXACTLY what exists. The `target_structure` section tells you
   what to build. The `files_to_delete_after_migration` list is your cleanup checklist.

2. `REFACTORING_PLAN_PHASE_1-4.md` — Phase 2 is your scope. Read §2.1–2.6 carefully.
   IGNORE all references to external repos (unified-trading-ui-kit, onboarding-ui,
   strategy-ui, etc.) — everything happens in THIS repo.

3. `.cursorrules` — Target patterns. NOTE: `.cursorrules` describes the TARGET state,
   not the current state. The canonical target paths are:
   - Config → `lib/config/` (NOT `shared/config/`)
   - Components → `components/` (NOT `shared/components/`)
   - Mocks → `lib/mocks/` (NOT `shared/mocks/`)
   - Hooks → `hooks/` and `hooks/api/` (NOT `shared/hooks/`)
   If you see `shared/` paths anywhere in examples, ignore them — the paths above
   are authoritative.

4. `ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md` — §1-5 for the platform model. §8 for
   shell topology. §10 for design patterns.

5. `context/SHARDING_DIMENSIONS.md` — How data is scoped. Critical for mock handlers.

6. `context/API_FRONTEND_GAPS.md` — What APIs exist vs what's missing. Don't build
   UI for blocked APIs (🔴).

---

## SCOPE: What You're Doing (Phase 2 Only)

### Step 1: Create Target Directory Structure

Create these directories (they don't exist yet):

```
app/(public)/          — route group for unauthenticated pages
app/(platform)/        — route group for THE product (internal + client)
app/(ops)/             — route group for internal-only admin/ops
lib/config/            — centralized config (api.ts, branding.ts, auth.ts)
lib/mocks/             — MSW infrastructure
lib/mocks/handlers/    — per-service mock handlers
lib/mocks/fixtures/    — static fixture data + personas
lib/stores/            — Zustand stores
lib/types/             — generated + shared types
hooks/api/             — React Query hooks per service
```

### Step 2: Create `lib/config/` (Centralized Config)

Extract from hardcoded values scattered across components:

- `lib/config/api.ts` — API base URLs, service endpoints, timeouts.
  Source: `lib/registry/openapi.json` has 298 endpoints. Build the config from that.
- `lib/config/branding.ts` — Company name, logos, colors.
  Source: `app/globals.css` has the design tokens. Export them as TS constants.
- `lib/config/auth.ts` — Demo personas, roles, entitlement definitions.
  Source: `context/SHARDING_DIMENSIONS.md` §Layer 3 has the subscription tiers.
- `lib/config/services.ts` — Service registry with entitlements.
  Source: `REFACTORING_PLAN §2.1` has the Service interface.
  Source: `lib/registry/system-topology.json` has service metadata.
- `lib/config/index.ts` — barrel export.

### Step 3: Create Shell Layouts (Route Group Infrastructure)

Existing shell components: `components/shell/unified-shell.tsx`, `lifecycle-nav.tsx`,
`require-auth.tsx`, `role-layout.tsx`, `role-selection.tsx`, `site-header.tsx`.

Create layout files that COMPOSE these existing components:

- `app/(public)/layout.tsx` — PublicShell: header + CTA + footer, no auth
- `app/(platform)/layout.tsx` — PlatformShell: auth required, sidebar,
  entitlement-driven nav. Same for internal AND client users.
- `app/(ops)/layout.tsx` — OpsShell: auth + role="internal" required

DO NOT rewrite shell components. Import and compose them.

### Step 4: Move Existing Pages into Route Groups

Move pages from flat `app/` into route groups. Route groups DON'T change URLs.

**IMPORTANT: Execution order matters.**
1. First, move ALL directories listed below into their route groups.
2. Then, fix ALL broken imports across the codebase.
3. Only THEN run `pnpm build` to verify.

Do NOT try to build after each individual move — it will fail because of cross-imports.

#### Complete Page-Move Mapping

Every directory under `app/` must end up in exactly one route group. Here is the
complete, authoritative mapping:

| Current Path              | Target Path                          | Notes                                      |
|---------------------------|--------------------------------------|--------------------------------------------|
| `app/page.tsx`            | `app/(public)/page.tsx`              | Marketing landing page                     |
| `app/login/`              | `app/(public)/login/`                |                                            |
| `app/signup/`             | `app/(public)/signup/`               |                                            |
| `app/contact/`            | `app/(public)/contact/`              |                                            |
| `app/demo/`               | `app/(public)/demo/`                 |                                            |
| `app/docs/`               | `app/(public)/docs/`                 |                                            |
| `app/privacy/`            | `app/(public)/privacy/`              |                                            |
| `app/terms/`              | `app/(public)/terms/`                |                                            |
| `app/investor-relations/` | `app/(public)/investor-relations/`   |                                            |
| `app/services/`           | `app/(public)/services/`             |                                            |
| `app/trading/`            | `app/(platform)/trading/`            |                                            |
| `app/positions/`          | `app/(platform)/positions/`          |                                            |
| `app/risk/`               | `app/(platform)/risk/`               |                                            |
| `app/markets/`            | `app/(platform)/markets/`            |                                            |
| `app/execution/`          | `app/(platform)/execution/`          | Has layout.tsx + sub-routes — move whole   |
| `app/strategy-platform/`  | `app/(platform)/strategy-platform/`  | Has layout.tsx + sub-routes — move whole   |
| `app/strategies/`         | `app/(platform)/strategies/`         | Has sub-routes ([id]/, grid/) — move whole |
| `app/ml/`                 | `app/(platform)/ml/`                 | Has layout.tsx + sub-routes — move whole   |
| `app/reports/`            | `app/(platform)/reports/`            |                                            |
| `app/portal/`             | `app/(platform)/portal/`             | Has layout.tsx + 5 sub-routes — move whole |
| `app/platform/`           | `app/(platform)/client-portal/`      | **RENAME** to avoid `(platform)/platform/` redundancy |
| `app/overview/`           | `app/(platform)/overview/`           |                                            |
| `app/quant/`              | `app/(platform)/quant/`              |                                            |
| `app/health/`             | `app/(platform)/health/`             |                                            |
| `app/alerts/`             | `app/(platform)/alerts/`             |                                            |
| `app/executive/`          | `app/(platform)/executive/`          |                                            |
| `app/admin/`              | `app/(ops)/admin/`                   |                                            |
| `app/ops/`                | `app/(ops)/ops/`                     |                                            |
| `app/devops/`             | `app/(ops)/devops/`                  |                                            |
| `app/manage/`             | `app/(ops)/manage/`                  | Has layout.tsx + sub-routes — move whole   |
| `app/compliance/`         | `app/(ops)/compliance/`              |                                            |
| `app/config/`             | `app/(ops)/config/`                  |                                            |
| `app/engagement/`         | `app/(ops)/engagement/`              |                                            |
| `app/internal/`           | `app/(ops)/internal/`                |                                            |

**Known non-existent directories (do NOT create):**
- `app/trader/` — referenced in `UI_STRUCTURE_MANIFEST.json` routes list but the
  directory was never created. Ignore it.
- `app/data/` — does not exist. Data catalogue is accessed via other routes.

After moving all directories and fixing imports, verify: `pnpm build` — all routes
must still resolve at the same URLs as before (route groups are invisible to the URL).

### Step 5: Auth Personas + useAuth Upgrade

Current: `hooks/use-auth.ts` reads localStorage, returns minimal data.
Target: returns `{ role, org, entitlements }` with demo persona support.

- Create `lib/mocks/fixtures/personas.ts` with 3 demo personas
  (see REFACTORING_PLAN §2.3 and SHARDING_DIMENSIONS §Layer 3):
  - `internal-trader`: role="internal", entitlements=["*"]
  - `client-full`: role="client", org={id:"acme"}, entitlements=["data-pro","execution-full","ml-full","strategy-full","reporting"]
  - `client-data-only`: role="client", org={id:"beta"}, entitlements=["data-basic"]
- Upgrade `hooks/use-auth.ts` to return persona-based auth

### Step 6: MSW Mock Infrastructure

- Install `msw` (Mock Service Worker)
- Create `lib/mocks/browser.ts` — setupWorker, activated when
  `NEXT_PUBLIC_MOCK_API=true`
- Create `lib/mocks/server.ts` — setupServer for Jest/node tests
- Create `lib/mocks/utils.ts` — `getPersonaFromRequest()`, `scopeByEntitlement()`
- Create ONE proof-of-concept handler: `lib/mocks/handlers/data.ts`
  - Migrate data from `lib/data-service-mock-data.ts` into fixture
  - Handler returns different instrument sets per persona tier
  - Pattern: see REFACTORING_PLAN §2.4 "Dimensional mocking pattern"

### Step 7: Migrate Inline Mock Data → Fixtures

Follow the migration manifest in `UI_STRUCTURE_MANIFEST.json` →
`target_structure.files_to_delete_after_migration`.

For each file:
1. Extract data objects into `lib/mocks/fixtures/*.json`
2. Create MSW handler in `lib/mocks/handlers/*.ts` that serves the data
3. Handler must scope data by persona (see §2.4 pattern)
4. Delete the original `lib/*.ts` mock file
5. Fix all imports that referenced the deleted file

Keep type files (`lib/*-types.ts`) — they'll be replaced by generated types later.

### Step 8: State Management Plumbing

- Install `zustand`
- Create `lib/stores/filter-store.ts` — shard/venue/instrument filter state with `reset()`
- Create `lib/stores/auth-store.ts` — current persona state with `reset()`
- Create `lib/stores/ui-prefs-store.ts` — sidebar collapsed, theme, etc. with `reset()`
- Create `lib/reset-demo.ts` — resets all stores + React Query cache + localStorage
- Create `lib/query-client.ts` — React Query client with defaults
- Wire QueryClientProvider in `app/layout.tsx`

### Step 9: Type Generation

- Install `openapi-typescript`
- Generate `lib/types/api-generated.ts` from `lib/registry/openapi.json`
- Add script to `package.json`: `"generate:types": "openapi-typescript lib/registry/openapi.json -o lib/types/api-generated.ts"`

### Step 10: Wire One Flagship Page End-to-End (Proof of Concept)

Pick the Data Catalogue page. Wire it through the full stack:
1. React Query hook in `hooks/api/use-instruments.ts`
2. MSW handler in `lib/mocks/handlers/data.ts` (already created in Step 6)
3. Page imports from hook, not from `lib/data-service-mock-data.ts`
4. Persona switching changes the data shown

### Step 11: Cleanup Orphans

- Delete `CODING_RULES_QUICK_START.md` if it still exists (contradicts .cursorrules)
- Scan for imports referencing deleted mock files — fix all
- Remove any unused dependencies from package.json
- Verify no component imports from paths that no longer exist

### Step 12: Update Manifest Status (MANDATORY FINAL STEP)

Update `UI_STRUCTURE_MANIFEST.json`:

1. Set `current_structure.status` to `"post-phase-2"`
2. Update `current_structure.description` to:
   `"Phase 2 complete. Route groups (public)/(platform)/(ops) created. MSW mock infrastructure in lib/mocks/. Zustand stores in lib/stores/. React Query wired with proof-of-concept. Centralized config in lib/config/. Auth personas with entitlements. Generated types from openapi.json."`
3. Update `current_structure.app_structure` to:
   `"ROUTE GROUPS — app/(public)/, app/(platform)/, app/(ops)/"`
4. Update `current_structure.mock_data` to:
   `"MSW — lib/mocks/handlers/ with persona-scoped fixtures in lib/mocks/fixtures/"`
5. Update `current_structure.state_management` to:
   `"Zustand stores in lib/stores/ + React Query in hooks/api/"`
6. Update `current_structure.api_layer` to:
   `"React Query hooks in hooks/api/, MSW serves data when NEXT_PUBLIC_MOCK_API=true"`
7. Update `current_structure.auth` to:
   `"Demo personas with role/org/entitlements in hooks/use-auth.ts, persona data in lib/mocks/fixtures/personas.ts"`
8. Add a new entry to `refactor_history` documenting Phase 2 completion.

**This step gates Prompt 2.** Prompt 2 checks this status and will STOP if it's not `"post-phase-2"`.

---

## QUALITY GATE (Must Pass Before Done)

```bash
pnpm lint && pnpm tsc --noEmit && pnpm build && pnpm test
```

- All routes must resolve at the same URLs as before.
- Coverage target: 50% (current) — don't regress.

## RULES

- Update `UI_STRUCTURE_MANIFEST.json` as you go — change `current_structure` to
  reflect actual state after each major step.
- Update `PROGRESS.md` after every step.
- NO new features. NO new pages. NO new UI components.
- NO V2 files. Update in place, delete originals.
- If something is unclear, check the docs listed above. If still unclear, ask.
- Commit after each step with descriptive message.
