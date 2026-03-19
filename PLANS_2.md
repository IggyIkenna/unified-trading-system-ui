# TASK: Build Out Platform Features on Clean Architecture

The structural refactor (Prompt 1) is complete. The codebase now has:
- Route groups: `app/(public)/`, `app/(platform)/`, `app/(ops)/`
- Shell layouts composing `components/shell/` components
- MSW mock infrastructure in `lib/mocks/` with persona-scoped handlers
- Zustand stores in `lib/stores/` with reset()
- React Query in `hooks/api/`
- Centralized config in `lib/config/`
- Generated types from `lib/types/api-generated.ts`
- One proof-of-concept page wired end-to-end (Data Catalogue)

Your job: wire ALL remaining pages through this architecture, build missing
platform features, and bring the UI to demo-ready state.

## PROGRESS TRACKING (MANDATORY)

Read `PROGRESS.md` at repo root — it was created during Prompt 1 and tracks what
was already completed. Continue updating it as you go through these phases.

After completing each sub-task (3A, 3B, 3C, 3D, 4A, etc.), update `PROGRESS.md`:
- Sub-task ID + name
- Status: ✅ DONE / 🚧 IN PROGRESS / ❌ BLOCKED (reason)
- Files created/modified
- Any decisions made

## BEFORE YOU WRITE ANY CODE

Read these files IN ORDER:

1. `UI_STRUCTURE_MANIFEST.json` — Current state should show `"post-phase-2"`.
   **If `current_structure.status` is NOT `"post-phase-2"`, STOP and tell the user.**
   The structural refactor (Prompt 1) must be completed first.

2. `PROGRESS.md` — Read to understand what was done in Prompt 1 and any
   blockers or decisions that were made.

3. `REFACTORING_PLAN_PHASE_1-4.md` — Phase 3 (§3.1–3.3) and Phase 4 (§4.1–4.4)
   are your scope. Phase 3 = wire existing pages. Phase 4 = build new surfaces.

4. `context/API_FRONTEND_GAPS.md` — Check status of each gap before building.
   🔴 = don't build that feature yet, show placeholder with "Coming soon".
   🟡 = build with workaround noted in the gap doc.
   🟢 = build fully.

5. `context/SHARDING_DIMENSIONS.md` — Every data page must be shard-aware.
   Every trading page must be client-scoped. §"UI Implementation Guidance"
   has the exact patterns.

6. `.cursorrules` — §2.3 "Same Pages, Different Data" is the CORE pattern.
   One page, API scopes the data. Never build separate client/internal versions.

7. `ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md` — §3 workflow model
   (Design→Simulate→Promote→Run→Monitor→Explain→Reconcile) drives nav grouping
   and page naming.

---

## PHASE 3: Wire All Existing Pages (REFACTORING_PLAN §3.2–3.3)

### 3A: Create React Query Hooks for Each Service Domain

Create hooks in `hooks/api/` matching the 16 handler files. One hook per data concern:

**Core trading hooks:**
- `hooks/api/use-instruments.ts` — **exists from Plan 1** (data service)
- `hooks/api/use-positions.ts` — position-balance-monitor service
- `hooks/api/use-orders.ts` — execution service
- `hooks/api/use-strategies.ts` — strategy service
- `hooks/api/use-backtests.ts` — strategy service
- `hooks/api/use-ml-models.ts` — ML service
- `hooks/api/use-risk.ts` — risk service
- `hooks/api/use-trading.ts` — trading/P&L
- `hooks/api/use-market-data.ts` — OHLCV, book snapshots (REST)

**Platform feature hooks:**
- `hooks/api/use-alerts.ts` — alerting service
- `hooks/api/use-reports.ts` — reporting/settlement

**Ops/internal hooks:**
- `hooks/api/use-deployments.ts` — deployment service (internal-only pages)
- `hooks/api/use-service-status.ts` — service health
- `hooks/api/use-audit.ts` — compliance/audit
- `hooks/api/use-organizations.ts` — user/org management

Each hook:
1. Uses generated types from `lib/types/api-generated.ts`
2. Calls the endpoint defined in `lib/config/api.ts`
3. Works with MSW when `NEXT_PUBLIC_MOCK_API=true`
4. Passes org context from `useAuth()` (for client-scoped data)

### 3B: Create MSW Handlers for Each Service

There are **16 handler files** matching backend service boundaries. Plan 1 created
the proof-of-concept `handlers/data.ts`. Now create the rest.

See `UI_STRUCTURE_MANIFEST.json` → `mock_handler_manifest` for the full list, or
`REFACTORING_PLAN §2.4` for detailed specs including the migration manifest.

**Core trading handlers** (migrated from inline mock data):
- `handlers/auth.ts` — login, profile, persona switch
- `handlers/data.ts` — instruments, catalogue, download status (subscription-filtered) — **exists from Plan 1**
- `handlers/execution.ts` — orders, fills, execution results, backtest grids (client-scoped)
- `handlers/positions.ts` — positions, risk groups, margin, historical snapshots (client-scoped)
- `handlers/strategy.ts` — strategies, configs, backtests, candidates (client-scoped)
- `handlers/ml.ts` — models, features, experiments, training (subscription-filtered)
- `handlers/risk.ts` — limits, exposure, VaR, Greeks, stress scenarios (client-scoped)
- `handlers/trading.ts` — live P&L, attribution, performance (client-scoped)
- `handlers/market-data.ts` — OHLCV candles, book snapshots, trades (shared, REST only)

**Platform feature handlers** (new data for demo completeness):
- `handlers/alerts.ts` — alert CRUD, severity filtering, acknowledge/resolve (client-scoped)
- `handlers/reporting.ts` — reports, settlement, reconciliation, invoicing (client-scoped)

**Ops/internal handlers** (for ops demo):
- `handlers/deployment.ts` — services, deployments, cloud builds, shards (internal-only)
- `handlers/service-status.ts` — service health, feature freshness, overview (internal-only for full view)
- `handlers/audit.ts` — compliance checks, event history, data health (internal-only)
- `handlers/user-management.ts` — orgs, users, roles, subscriptions (internal sees all; client sees own org)

Each handler must follow the dimensional mocking pattern from REFACTORING_PLAN §2.4:
same endpoint, different data per persona. Check `context/SHARDING_DIMENSIONS.md`
§"Scoping Rules by Data Type" for whether data is shared, client-scoped, or
subscription-filtered.

**Response shape rule:** Every handler MUST return data matching `lib/registry/openapi.json`
response schemas. Where the UI needs enrichment the API doesn't yet provide (e.g., LP pool
details, lending APY, per-venue risk limits), put enrichment in `lib/mocks/adapters/` —
thin functions that transform API-shaped responses into component props. This keeps the
mock→real swap clean.

**Backend alignment rule:** Some mock handlers serve data the backend doesn't provide yet
(VaR breakdowns, stress scenarios, per-venue risk limits, protocol-specific position details).
That's fine — mock it now, build the demo, refactor the backend later. Each handler MUST
document which endpoints are **real** (exist in openapi.json) vs **aspirational** (mocked
ahead of backend). Use a comment block at the top of each handler:

```typescript
// handlers/risk.ts
// REAL endpoints (exist in openapi.json):
//   GET /api/risk/limits — global shard limits
//   GET /api/risk/exposure — current exposure
// ASPIRATIONAL endpoints (mocked ahead of backend — see API_FRONTEND_GAPS.md):
//   GET /api/risk/limits/venues — per-venue breakdown (Gap 1.1, NOT STARTED)
//   GET /api/risk/var — VaR component breakdown (not in openapi.json yet)
//   GET /api/risk/greeks — portfolio Greeks (not in openapi.json yet)
//   GET /api/risk/stress — stress scenario analysis (Gap 3.3, NOT PLANNED)
```

This creates a living manifest of what the backend needs to implement for the frontend
to go live. After Plans 1+2 are done, this manifest drives the backend refactor.

**WebSocket note:** MSW doesn't handle WebSocket. The trading page's real-time price
simulation stays client-side for now. REST endpoints (OHLCV candles, book snapshots)
go through `handlers/market-data.ts`.

### 3C: Wire Each Page to React Query

For each page in `app/(platform)/`:
1. Replace inline mock data imports with React Query hook
2. Add loading/error states
3. Verify page works with MSW mock data
4. Remove corresponding `lib/*.ts` mock file when all its consumers are migrated

**NOTE:** If any `lib/*.ts` mock files were already deleted during Prompt 1 Step 7,
skip them. Check what actually exists before trying to delete.

Priority order (flagship first):
1. Trading page (positions, P&L, alerts) — `app/(platform)/trading/`
2. Positions page — `app/(platform)/positions/`
3. Strategy Platform (strategies list, backtest results) — `app/(platform)/strategy-platform/`
4. Risk Dashboard — `app/(platform)/risk/`
5. Execution (orders, fills) — `app/(platform)/execution/`
6. ML (models, experiments) — `app/(platform)/ml/`
7. Markets (OHLCV, book data) — `app/(platform)/markets/`
8. Reports (P&L attribution, settlement) — `app/(platform)/reports/`
9. Remaining pages in `app/(platform)/`

### 3D: Wire Auth-Driven Scoping

Per REFACTORING_PLAN §3.2:
1. `app/(platform)/layout.tsx` wraps with `<RequireAuth>` — redirect to login
2. `app/(ops)/layout.tsx` wraps with `<RequireAuth role="internal">` — 403
3. Service registry drives nav items — client sees subscribed, internal sees all
4. Org selector: internal shows all orgs dropdown, client shows their org read-only
5. Test with 3 personas: switch persona → see different data/nav

**NOTE on page paths:** During Prompt 1, `app/platform/` was renamed to
`app/(platform)/client-portal/`. If you see references to the old `app/platform/`
path in docs, use `app/(platform)/client-portal/` instead.

---

## PHASE 4: Build New Platform Surfaces

### 4A: Post-Login Dashboard (`app/(platform)/dashboard/page.tsx`)

Service hub showing:
- Entitled services as cards (click → navigate to service)
- Locked services grayed with "Upgrade" CTA
- Quick stats (positions count, active strategies, alerts)
- Recent activity feed
- System health summary

Pattern: `ARCHITECTURE_AND_WORKFLOW_OVERVIEW.md` §7

### 4B: Subscription Context on Every Service Page

Per `SHARDING_DIMENSIONS.md` §Layer 3:
- Entitled services: full access, normal UI
- Non-entitled: locked state with "Upgrade" CTA
- "Export Data" button on data pages → modal: "Contact sales for cloud export"
- See REFACTORING_PLAN §4.3 for exact specs

### 4C: Public Landing Polish (`app/(public)/page.tsx`)

The landing page exists (it was moved from `app/page.tsx` in Prompt 1). Polish it:
- Hero: "Institutional-Grade Trading Infrastructure"
- Service showcase cards using service registry data
- 3 USPs prominently displayed (breadth, seamless internal/external, backtest↔live diff)
- Pricing section using subscription tiers from SHARDING_DIMENSIONS §Layer 3
- CTA → signup/contact

### 4D: Ops Dashboard (`app/(ops)/`)

For internal users only:
- System health (aggregate service status)
- User/org management
- Deployment overview
- Audit log view

### 4E: Demo Flow

- Login page shows persona picker (3 demo accounts)
- Switching persona reloads data via MSW
- "Reset Demo" button in shell debug panel calls `lib/reset-demo.ts`
- Demo works fully offline (MSW serves everything)

---

## FINAL STEP A: Generate Backend Alignment Manifest (MANDATORY)

After all handlers are created, generate `BACKEND_ALIGNMENT.md` at repo root.
This document is the output of Plans 1+2 that drives the backend refactor.

Scan every handler file in `lib/mocks/handlers/` and extract the REAL vs
ASPIRATIONAL comment blocks into a single manifest:

```markdown
# Backend Alignment Manifest

Generated from MSW handler annotations after Plans 1+2 completion.
This documents what the backend needs to implement for the frontend to go live.

## Summary
- Total mock endpoints: X
- Endpoints with real backend support: Y (exist in openapi.json)
- Aspirational endpoints (need backend work): Z

## By Service

### risk (handlers/risk.ts)
| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/risk/limits | REAL | Global shard limits |
| GET /api/risk/exposure | REAL | Current exposure |
| GET /api/risk/limits/venues | ASPIRATIONAL | Per-venue breakdown (Gap 1.1) |
| GET /api/risk/var | ASPIRATIONAL | VaR component breakdown |
...

### [repeat for each handler]
```

Cross-reference with `context/API_FRONTEND_GAPS.md` — every gap should appear
in this manifest. Any NEW gaps discovered during Plans 1+2 should be added to
API_FRONTEND_GAPS.md as well.

## FINAL STEP B: Update Manifest Status (MANDATORY)

Update `UI_STRUCTURE_MANIFEST.json`:

1. Set `current_structure.status` to `"post-phase-4"`
2. Update all `current_structure` fields to reflect the completed build-out
3. Add a new entry to `refactor_history` documenting Phase 3+4 completion
4. Update `PROGRESS.md` with final status

---

## QUALITY GATE

```bash
pnpm lint && pnpm tsc --noEmit && pnpm build && pnpm test
```

- Coverage target: 70%.
- All routes resolve. No console errors. Pages load < 3s.
- Test with all 3 personas — each should see appropriately scoped data.

## RULES

- Same pages, different data. NEVER build separate client/internal versions.
- Check `API_FRONTEND_GAPS.md` before building any API-dependent feature.
- Every data page must be shard-aware (category → venue → instrument).
- Every trading page must pass org context from `useAuth()`.
- Update `UI_STRUCTURE_MANIFEST.json` after completing each major section.
- Update `PROGRESS.md` after every sub-task.
- Commit after each logical unit of work.
- NO features beyond what's listed here. If you think something is needed, ask.
