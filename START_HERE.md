# START HERE — UI Development Guide

**Welcome to the Unified Trading System UI.**

This document tells you exactly what to read and in what order before you start building.

---

## For Iggy (Product Owner)

**Read these to understand current state and plan next work:**

1. **[ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md)** (15 min)
   - Platform ideology, role model, three experience modes
   - Service areas and workflow lifecycle

2. **[CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md)** (5 min)
   - Current code structure, folder map, state management, tech stack

3. **[context/API_FRONTEND_GAPS.md](./context/API_FRONTEND_GAPS.md)** (5 min)
   - Review known API gaps
   - Prioritize backend work based on UI needs

---

## For Agents and UI Builders

**Complete this onboarding before you start coding (40 min total):**

### Step 1: Understand the Platform (15 min)

Read: **[ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md)**

Learn:
- What the platform is (unified institutional system, not just a website)
- The three experience modes (public, client, internal)
- The six service areas (data, research, execution, reporting, admin, deployment)
- The core workflow: Design → Simulate → Promote → Run → Monitor → Explain → Reconcile
- Role model and organization-first architecture

---

### Step 2: Understand the Code Structure (5 min)

Read: **[CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md)**

Learn:
- Next.js 15 App Router with three route groups `(public)`, `(platform)`, `(ops)`
- The canonical content tree lives at `app/(platform)/services/`
- Where to add new pages, components, hooks, types, mock handlers
- State management: Zustand (global) + React Query (server data)

Then read the deep docs for your area:
- **[docs/STRUCTURE_APP.md](./docs/STRUCTURE_APP.md)** — Full route inventory, redirect map
- **[docs/STRUCTURE_COMPONENTS.md](./docs/STRUCTURE_COMPONENTS.md)** — All 11 component domains
- **[docs/STRUCTURE_LIB.md](./docs/STRUCTURE_LIB.md)** — Types, stores, mocks, config
- **[docs/STRUCTURE_HOOKS.md](./docs/STRUCTURE_HOOKS.md)** — React Query hooks
- **[docs/STRUCTURE_CONTEXT.md](./docs/STRUCTURE_CONTEXT.md)** — Backend reference material

---

### Step 3: Understand Data Partitioning (10 min)

Read: **[context/SHARDING_DIMENSIONS.md](./context/SHARDING_DIMENSIONS.md)**

Learn:
- Five primary shards (CEFI, DeFi, Sports, TradFi, OnChain)
- How data is partitioned (shard → venue → instrument → org)
- Why sharding matters (failure isolation, per-shard config, data scoping)
- Common sharding mistakes to avoid

**Why:** Every data screen must be shard-aware. You can't mix data across shards.

---

### Step 4: Check API Readiness (5 min)

Scan: **[context/API_FRONTEND_GAPS.md](./context/API_FRONTEND_GAPS.md)**

- 🔴 = API blocked — don't build features that depend on this yet
- 🟡 = API in progress — plan it, but wait
- 🟢 = API ready — build now

---

### Step 5: Review Coding Rules (5 min)

Skim: **[.cursorrules](./.cursorrules)**

Key rules:
- All new platform pages go under `app/(platform)/services/<domain>/`
- Never create pages at old flat paths (`/trading/`, `/execution/`, etc.) — they are redirects
- Components in `components/<domain>/` — kebab-case filenames
- Domain types in `lib/<domain>-types.ts`, mock data in `lib/mocks/handlers/<domain>.ts`
- No V2 files — update in place, delete originals

---

## Before You Start Coding Each Feature

### 1. Check Route Location (1 min)

- Platform page? → `app/(platform)/services/<domain>/`
- Public page? → `app/(public)/`
- Ops-only page? → `app/(ops)/`
- Never create at `/trading/`, `/execution/`, `/research/`, `/ml/` — those are permanent redirects

### 2. Find the Configuration (3 min)

- Open `context/api-contracts/openapi/config-registry.json`
- Search for your service (e.g., "execution-service")
- List all configurable fields, types, defaults

### 3. Check API Readiness (2 min)

- Check `context/API_FRONTEND_GAPS.md`
- Your feature depends on which APIs?
- If blocked, defer the feature. If in progress, plan it but wait.

### 4. Find API Specs (3 min)

- Open `context/api-contracts/openapi/<your-api>.yaml`
- See endpoint signatures and response shapes
- Open `context/api-contracts/canonical-schemas/` for Pydantic models

### 5. Plan Architecture (5 min)

- New page → which service domain? `/services/<domain>/`
- Reuse existing component from `components/<domain>/` or build new?
- Which React Query hook from `hooks/api/`?
- Which MSW handler in `lib/mocks/handlers/`?
- What permission checks? (`useAuthStore()` from `lib/stores/auth-store.ts`)

---

## Key File Locations

| What you need           | Where to find it |
|---|---|
| Codebase overview       | [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md) |
| Platform vision         | [ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md) |
| Route inventory         | [ROUTES.md](./ROUTES.md) or [docs/STRUCTURE_APP.md](./docs/STRUCTURE_APP.md) |
| Component inventory     | [docs/STRUCTURE_COMPONENTS.md](./docs/STRUCTURE_COMPONENTS.md) |
| Lib layer               | [docs/STRUCTURE_LIB.md](./docs/STRUCTURE_LIB.md) |
| API hooks               | [docs/STRUCTURE_HOOKS.md](./docs/STRUCTURE_HOOKS.md) |
| Sharding model          | [context/SHARDING_DIMENSIONS.md](./context/SHARDING_DIMENSIONS.md) |
| API readiness           | [context/API_FRONTEND_GAPS.md](./context/API_FRONTEND_GAPS.md) |
| Coding rules (full)     | [.cursorrules](./.cursorrules) |
| Config schema reference | `context/api-contracts/openapi/config-registry.json` |
| API specs               | `context/api-contracts/openapi/*.yaml` |
| Data schemas            | `context/api-contracts/canonical-schemas/` |
| Service types           | `context/internal-contracts/schemas/` |

---

## Key Rules (TL;DR)

### DO

- Organize new platform pages under `app/(platform)/services/<domain>/`
- Use shared components from `components/<domain>/` for consistency
- Get configuration from `lib/config/` — no hardcoded values
- Use React Query hooks from `hooks/api/` for data fetching
- Use Zustand stores from `lib/stores/` for client state
- Update in place when refactoring — no V2 files
- Check API readiness before building (`context/API_FRONTEND_GAPS.md`)

### DON'T

- Create new pages at old flat paths (`/trading/`, `/execution/`, etc.) — they are redirects
- Create `PositionsTableV2`, `PositionsTableRefactored` — one source of truth
- Hardcode API endpoints, colors, strings in components
- Create per-page mock implementations — use MSW handlers in `lib/mocks/handlers/`
- Scatter auth logic across components — use `useAuthStore()`
- Leave old code alongside new code after refactoring
- Build features that depend on 🔴 blocked APIs

---

## Common Questions

**Q: Where do I add a new platform page?**
A: `app/(platform)/services/<domain>/` — never at the old flat paths.

**Q: Where do I find what the backend API returns?**
A: `context/api-contracts/openapi/` (specs) and `context/api-contracts/canonical-schemas/` (schemas)

**Q: How do I know if an API is ready?**
A: Check `context/API_FRONTEND_GAPS.md`

**Q: Where should I add a new component?**
A: `components/<closest-domain>/` — see [docs/STRUCTURE_COMPONENTS.md](./docs/STRUCTURE_COMPONENTS.md)

**Q: Where should config values go?**
A: `lib/config/` — see `lib/config/api.ts`, `lib/config/branding.ts`, `lib/config/services.ts`

**Q: How do I add mock data for a new endpoint?**
A: Add an MSW handler to `lib/mocks/handlers/<domain>.ts` and register it in `lib/mocks/handlers/index.ts`

---

**Ready?**

→ Start with [CODEBASE_STRUCTURE.md](./CODEBASE_STRUCTURE.md) for the technical overview.
→ Then read [ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md](./ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md) for the product vision.
