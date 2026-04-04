# Task 05 — Mock Data Centralization

**Source:** Audit `05-MOCK-DATA-AUDIT.md`, WORK_TRACKER §5, §6
**Priority:** P2 — blocks realistic demo flows and API wiring

> **MSW is deferred.** The codebase has a working fetch interceptor (`lib/api/mock-handler.ts`,
> 4,459 lines). MSW adoption is a separate future task. This task focuses exclusively on
> consolidating scattered mock data into `lib/mocks/fixtures/`.

---

## Agent Execution Model

| Phase | What | Model | Output |
|-------|------|-------|--------|
| **Phase 1 — Discovery** | Run the audit commands below. Find every file with inline mock data, measure sizes, classify by domain. Build exact move list with triage (MOVE / EXTRACT / RELOCATE / SEED / FIX / SKIP). | **Smart** (claude-4-opus or claude-3.7-sonnet) | Concrete table: source file → variable names → target file → import update count → action type |
| **Phase 2 — Execution** | Take Phase 1 move list and mechanically: move files, update imports, fix ID collisions, replace Math.random, verify rendering. | **Medium** (claude-3.7-sonnet) | Code changes + passing `pnpm typecheck` + `pnpm build` |

**Key triage rule:** Not everything named `MOCK_*` is mock *data*. Column definitions, form
schemas, config objects should stay in components. Only fixture/sample *data* (arrays of
domain objects with fields like id, name, status, price, venue, timestamp) moves.

**Splitting across sessions:**
- **Session A (move):** Parts 1-6 — move component mock files + extract inline page data
- **Session B (relocate):** Part 7 — relocate `lib/` root mock modules under `lib/mocks/`
- **Session C (quality):** Parts 8-11 — sports ID fix, Math.random cleanup, hook SEED cleanup, schema audit

### Discovery Commands (Phase 1 — run BEFORE starting any part)

```bash
cd unified-trading-system-ui

# Current fixture state
ls -la lib/mocks/fixtures/
ls -la lib/mocks/generators/
ls -la lib/mocks/handlers/ 2>/dev/null || echo "HANDLERS DIR MISSING"
wc -l lib/mocks/fixtures/*.ts

# Mock data in component files (files to move)
rg -l "const mock|const MOCK|const fake|const sample|mockData|sampleData" components/ --glob '*.ts' --glob '*.tsx'

# Large inline data arrays in components
for f in $(rg -l "const.*=.*\[" components/ --glob '*.tsx'); do
  count=$(rg -c "^\s*\{" "$f")
  [ "$count" -gt 50 ] && echo "$count objects: $f"
done | sort -rn

# Large inline data arrays in app pages
for f in $(rg -l "const.*=.*\[" app/ --glob '*.tsx'); do
  count=$(rg -c "^\s*\{" "$f")
  [ "$count" -gt 50 ] && echo "$count objects: $f"
done | sort -rn

# MSW status
rg -l "setupWorker|setupServer|http.get|http.post|HttpResponse" lib/mocks/
grep -q "msw" package.json && echo "MSW installed" || echo "MSW NOT installed"

# Persona system
rg -l "persona|Persona|fixture|Fixture" lib/mocks/

# API config (for MSW URL patterns)
head -50 lib/config/api.ts
```

> **The file lists in the parts below are historical snapshots from 2026-03-28.**
> Always run the discovery commands to get current state before starting work.

---

## Goal

Move all mock data out of component/page files into `lib/mocks/`. Consolidate the 7
`lib/` root mock modules under `lib/mocks/`. Fix data collisions, replace `Math.random`
with deterministic generators, clean SEED data out of hooks. Keep the existing
`lib/api/mock-handler.ts` fetch interceptor as-is — do NOT install MSW.

**Current state (verified 2026-03-29):**
- `lib/mocks/fixtures/` — 13 files, 1,419 lines (partial)
- `lib/mocks/handlers/` — **does not exist** (no MSW — and we are NOT adding it in this task)
- `lib/mocks/generators/` — 2 files (order-flow, pnl)
- `lib/api/mock-handler.ts` — 4,459-line fetch interceptor (DO NOT TOUCH architecture)
- `lib/auth/personas.ts` — 97 lines, 4 demo personas
- **5 component-level mock files** still in `components/`:
  - `components/promote/mock-data.ts`, `components/promote/mock-fixtures.ts`
  - `components/trading/sports/mock-data.ts`, `components/trading/sports/mock-fixtures.ts`
  - `components/trading/predictions/mock-data.ts`
- **38 files** with inline `MOCK_*`/`SEED_*`/`FALLBACK_*` in `app/` + `components/`
- **7 `lib/` root mock modules** not under `lib/mocks/`:
  - `lib/trading-data.ts`, `lib/execution-platform-mock-data.ts`, `lib/ml-mock-data.ts`
  - `lib/strategy-platform-mock-data.ts`, `lib/data-service-mock-data.ts`
  - `lib/build-mock-data.ts`, `lib/backtest-analytics-mock.ts`
  - `lib/mock-data/` directory (index.ts, seed.ts)
- **15 files** with `Math.random` in `app/` + `components/` (non-deterministic)
- **2 hooks** with `SEED_*` fallback data: `use-strategies.ts`, `use-news.ts`
- **Sports `fix-001` ID collision**: accumulators page = Arsenal vs Man City, mock-data.ts = Man City vs Liverpool

**After this task:** All fixture/sample data lives exclusively in `lib/mocks/fixtures/` and
`lib/mocks/generators/`. Components and pages import data from `lib/mocks/` only. The fetch
interceptor (`mock-handler.ts`) continues to work, now importing from consolidated locations.

---

## Part 1 — Move promote mock data to `lib/mocks/fixtures/`

**Source files:**
- `components/promote/mock-data.ts` (~1,685 lines)
- `components/promote/mock-fixtures.ts` (~674 lines)

**Target:**
- `lib/mocks/fixtures/promote-candidates.ts`
- `lib/mocks/fixtures/promote-fixtures.ts`

**Steps:**
1. Move files to target locations.
2. Update all imports in `components/promote/` to point to new locations.
3. Verify: `rg "from.*mock-data\|from.*mock-fixtures" components/promote/` returns zero.
4. Delete original files.

**Files:** 2 source files, ~10 consumer components in `components/promote/`

---

## Part 2 — Move sports mock data to `lib/mocks/fixtures/`

**Source files:**
- `components/trading/sports/mock-data.ts` (~1,556 lines)
- `components/trading/sports/mock-fixtures.ts` (~46 lines)

**Target:**
- `lib/mocks/fixtures/sports-data.ts`
- `lib/mocks/fixtures/sports-fixtures.ts`

**Steps:** Same pattern as Part 1. Update imports in `components/trading/sports/` and
`components/widgets/sports/`.

---

## Part 3 — Move predictions mock data to `lib/mocks/fixtures/`

**Source:** `components/trading/predictions/mock-data.ts` (~798 lines)
**Target:** `lib/mocks/fixtures/predictions-data.ts`

---

## Part 4 — Move risk mock data to `lib/mocks/fixtures/`

**Source:** `components/widgets/risk/risk-data-context.tsx` — inline `MOCK_STRATEGIES`,
`STRATEGY_RISK_MAP`, `COMPONENT_TO_RISK_TYPE` (~50 lines)
**Target:** `lib/mocks/fixtures/risk-data.ts`

Extract mock data only. Leave the context provider in place.

---

## Part 5 — Move order-book mock generator to `lib/mocks/generators/`

**Source:** `components/trading/order-book.tsx` — `generateMockOrderBook()` (~50 lines)
**Target:** `lib/mocks/generators/order-book.ts`

---

## Part 6 — Extract inline data from `app/` and `components/` pages

**Full list of files with inline `MOCK_*`/`SEED_*`/`FALLBACK_*` (38 files, verified 2026-03-29):**

Run this to get the current list before starting:
```bash
rg -l "const MOCK_|const SEED_|const FALLBACK_" app/ components/ --glob '*.tsx' --glob '*.ts' | sort
```

**Pages (24 files):**
- `app/(platform)/services/data/logs/page.tsx`
- `app/(platform)/services/data/missing/page.tsx`
- `app/(platform)/services/data/valuation/page.tsx`
- `app/(platform)/services/execution/algos/page.tsx`
- `app/(platform)/services/execution/overview/page.tsx`
- `app/(platform)/services/execution/venues/page.tsx`
- `app/(platform)/services/manage/compliance/page.tsx`
- `app/(platform)/services/manage/mandates/page.tsx`
- `app/(platform)/services/reports/fund-operations/page.tsx`
- `app/(platform)/services/reports/ibor/page.tsx`
- `app/(platform)/services/reports/nav/page.tsx`
- `app/(platform)/services/reports/overview/page.tsx`
- `app/(platform)/services/reports/regulatory/page.tsx`
- `app/(platform)/services/reports/settlement/page.tsx`
- `app/(platform)/services/research/quant/page.tsx`
- `app/(platform)/services/research/signals/page.tsx`
- `app/(platform)/services/research/strategy/candidates/page.tsx`
- `app/(platform)/services/trading/accounts/saft/page.tsx`
- `app/(platform)/services/trading/options/pricing/page.tsx`
- `app/(platform)/services/trading/overview/page.tsx`
- `app/(platform)/services/trading/predictions/aggregators/page.tsx`
- `app/(platform)/services/trading/sports/accumulators/page.tsx`
- `app/(platform)/services/trading/sports/bet/page.tsx`
- `app/(platform)/settings/notifications/page.tsx`

**Components (14 files):**
- `components/ops/deployment/MockModeBanner.tsx`
- `components/ops/event-stream-viewer.tsx`
- `components/platform/activity-feed.tsx`
- `components/platform/health-bar.tsx`
- `components/promote/mock-data.ts` (already covered in Part 1)
- `components/reports/reconciliation/reconciliation-constants.ts`
- `components/research/execution/new-execution-dialog.tsx`
- `components/trading/kill-switch-panel.tsx`
- `components/trading/predictions/mock-data.ts` (already covered in Part 3)
- `components/trading/sports/mock-data.ts` (already covered in Part 2)
- `components/trading/strategy-audit-trail.tsx`
- `components/widgets/book/book-data-context.tsx`
- `components/widgets/defi/defi-data-context.tsx`
- `components/widgets/risk/risk-data-context.tsx` (already covered in Part 4)

**For each file (excluding those covered in Parts 1-5):**
1. Read the file, identify `MOCK_*`/`SEED_*`/`FALLBACK_*` constants
2. **Triage:** Is this fixture data (arrays of domain objects) or config data (column defs, form schemas)?
   - Fixture data → EXTRACT to `lib/mocks/fixtures/<domain>.ts`
   - Config data → SKIP (stays in the component)
   - `MockModeBanner.tsx` → SKIP (it's a UI component, not data)
3. Move the data, update the import, verify the page still renders

**Target fixture files by domain:**
- Reports: `lib/mocks/fixtures/reports-data.ts` (ibor, settlement, nav, regulatory, fund-ops, overview)
- Execution: `lib/mocks/fixtures/execution-data.ts` (algos, venues, overview)
- Data service: `lib/mocks/fixtures/data-service-pages.ts` (logs, missing, valuation)
- Trading: `lib/mocks/fixtures/trading-pages.ts` (overview, options, accounts, kill-switch)
- Research: `lib/mocks/fixtures/research-pages.ts` (quant, signals, candidates)
- Manage: `lib/mocks/fixtures/manage-data.ts` (compliance, mandates)
- Widgets: `lib/mocks/fixtures/widget-data.ts` (book, defi, events)
- Misc: `lib/mocks/fixtures/settings-data.ts` (notifications), `lib/mocks/fixtures/activity-feed.ts`

---

## Part 7 — Relocate `lib/` root mock modules under `lib/mocks/`

**Problem:** 7 large mock data modules sit at `lib/` root instead of under `lib/mocks/`.
The `mock-handler.ts` imports from these — updating its imports is critical.

**Source → Target:**

| Source | Target | Importers |
|--------|--------|-----------|
| `lib/trading-data.ts` | `lib/mocks/fixtures/trading-data.ts` | mock-handler.ts + pages + widgets |
| `lib/execution-platform-mock-data.ts` | `lib/mocks/fixtures/execution-platform.ts` | mock-handler.ts + pages |
| `lib/ml-mock-data.ts` | `lib/mocks/fixtures/ml-data.ts` | mock-handler.ts + ML pages |
| `lib/strategy-platform-mock-data.ts` | `lib/mocks/fixtures/strategy-platform.ts` | mock-handler.ts + pages |
| `lib/data-service-mock-data.ts` | `lib/mocks/fixtures/data-service.ts` | mock-handler.ts + pages |
| `lib/build-mock-data.ts` | `lib/mocks/fixtures/build-data.ts` | mock-handler.ts |
| `lib/backtest-analytics-mock.ts` | `lib/mocks/fixtures/backtest-analytics.ts` | mock-handler.ts + pages |
| `lib/mock-data/` (dir) | merge into `lib/mocks/fixtures/` | various |
| `lib/deterministic-mock.ts` | `lib/mocks/generators/deterministic.ts` | generators |

**Steps:**
1. Run `rg -l "from.*@/lib/trading-data" app/ components/ lib/` for each source to get exact importer list
2. Move file to target
3. Update ALL imports (in mock-handler.ts, pages, components, other lib/ files)
4. Delete original
5. Run `pnpm typecheck` after each move

**CRITICAL:** `lib/api/mock-handler.ts` imports from most of these. Update its import paths
but do NOT change its logic or architecture.

**Also relocate associated type files:**
- `lib/execution-platform-types.ts` → `lib/types/execution-platform.ts` (if not already there)
- `lib/data-service-types.ts` → `lib/types/data-service.ts` (if not already there)
- `lib/ml-types.ts` → `lib/types/ml.ts` (if not already there)
- `lib/strategy-platform-types.ts` → `lib/types/strategy-platform.ts` (if not already there)
- `lib/backtest-analytics-types.ts` → `lib/types/backtest-analytics.ts` (if not already there)

---

## Part 8 — Fix sports `fix-001` ID collision

**Problem:** `fix-001` means different things in different files:
- `components/trading/sports/mock-data.ts` → Man City vs Liverpool
- `app/(platform)/services/trading/sports/accumulators/page.tsx` → Arsenal vs Man City

**Fix:** Pick one truth for `fix-001`. Update the other file to use the canonical version.
If the accumulators page needs a different fixture, give it a different ID (e.g., `fix-020`).

---

## Part 9 — Replace `Math.random` with deterministic generators

**15 files with `Math.random` (verified 2026-03-29):**

```bash
rg -l "Math\.random" app/ components/ --glob '*.tsx'
```

- `app/(ops)/ops/jobs/page.tsx`
- `app/(ops)/ops/services/page.tsx`
- `app/(platform)/dashboard/page.tsx`
- `app/(platform)/services/research/ml/training/page.tsx`
- `components/marketing/arbitrage-galaxy.tsx`
- `components/marketing/data-services-showcase.tsx`
- `components/ml/loss-curves.tsx`
- `components/trading/manual/mass-quote-panel.tsx`
- `components/trading/predictions/arb-stream-tab.tsx`
- `components/trading/sports/arb-stream.tsx`
- `components/trading/time-series-panel.tsx`
- `components/trading/vol-surface-chart.tsx`
- `components/widgets/markets/markets-latency-detail-widget.tsx`
- `components/widgets/orders/orders-data-context.tsx`
- `components/widgets/predictions/predictions-data-context.tsx`

**Triage:**
- **Marketing viz** (arbitrage-galaxy, data-services-showcase) → SKIP (visual-only, not domain data)
- **Streaming/ticking** (arb-stream, time-series, vol-surface, mass-quote, loss-curves) → use `lib/deterministic-mock.ts` seeded generator for initial state; keep tick animation logic
- **Page data** (ops jobs/services, dashboard, ML training) → replace with fixture imports from `lib/mocks/fixtures/`
- **Widget contexts** (orders, predictions, markets-latency) → replace with fixture imports

---

## Part 10 — Clean up hooks with SEED data

**2 hooks with inline seed data:**
- `hooks/api/use-strategies.ts` — `SEED_STRATEGIES` (~164+ lines)
- `hooks/api/use-news.ts` — `SEED_NEWS` (~17+ lines)

**Steps:**
1. Move `SEED_STRATEGIES` → `lib/mocks/fixtures/strategies-seed.ts`
2. Move `SEED_NEWS` → `lib/mocks/fixtures/news-seed.ts`
3. Update hooks to import from new locations

---

## Part 11 — Schema consistency audit

Review all mock data in `lib/mocks/fixtures/` for:

1. **Field naming:** Consistent conventions (camelCase everywhere, no mixed snake_case).
2. **Required fields:** Every mock object has all fields the TypeScript interface requires.
3. **Type alignment:** Mock values match the TS type (string IDs are strings, dates are ISO strings, enums use valid values).
4. **Cross-reference:** Compare mock data shapes against `lib/types/` interfaces.

Flag mismatches. Fix in place.

---

## Part 12 — ID format standardization

Check ID formats across all mock data:
- Strategy IDs: pick one format (e.g., `strat-001` or UUID)
- Client IDs, org IDs, instrument IDs: standardize per entity type
- Ensure the same strategy ID in `promote-candidates.ts` matches the strategy ID in `positions` mock data

---

## Part 13 — Persona scoping readiness

Review whether mock data supports the 4 demo personas:
- `internal-trader` — all orgs, all strategies, full access
- `client-full` — single org, their strategies only
- `client-data-only` — data endpoints only, no trading
- `prospect` — public data only

For each fixture file, check: can the data be filtered by `orgId` or `clientId`? If not,
add the fields so persona-scoped handlers can filter appropriately.

---

## Rules

1. **Mock data lives in `lib/mocks/` only.** After this task, zero mock data in `components/`
   or `app/` files. Config data (column definitions, form schemas) stays in components — only
   fixture/sample data moves.
2. **Imports from `lib/mocks/` only.** No component should import from another component's
   mock file.
3. **Do NOT touch `lib/api/mock-handler.ts` architecture.** Update its import paths when you
   move files it imports from, but do NOT change its logic or structure.
4. **Do NOT install MSW.** MSW adoption is a separate future task.
5. **Don't break existing rendering.** Every page that currently works with inline data must
   still work after the migration — just sourcing data differently.
6. **One file per domain.** Don't create `promote-mock-data-part1.ts` and `part2.ts`.
   If a fixture file is too large (>500 lines), split by entity type (e.g.,
   `promote-candidates.ts` vs `promote-gates.ts`), not by arbitrary chunks.
7. **Triage before moving.** Not everything named `MOCK_*` is fixture data. Column definitions,
   form schemas, UI config objects stay in components. Only arrays of domain objects move.

---

## Acceptance Criteria

- [ ] Zero mock data files in `components/` — `find components/ -name "mock-data*" -o -name "mock-fixtures*"` returns empty
- [ ] Inline `MOCK_*`/`SEED_*` in `app/` + `components/` reduced to near-zero — `rg -l "const MOCK_|const SEED_" app/ components/ --glob '*.tsx'` returns ≤5 (documented exceptions only)
- [ ] `lib/` root mock modules relocated — zero `lib/*mock*.ts` files at root (all under `lib/mocks/`)
- [ ] `lib/mocks/fixtures/` is the SSOT for all domain fixture data
- [ ] Sports `fix-001` ID collision resolved — one truth across all files
- [ ] `Math.random` in domain data generation replaced with `lib/deterministic-mock.ts` (marketing viz excepted)
- [ ] `SEED_*` removed from `hooks/api/` — data imported from `lib/mocks/fixtures/`
- [ ] `mock-handler.ts` imports updated to new paths — still functions correctly
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] App loads and renders with data on promote, sports, predictions, dashboard, reports pages

---

## Self-Evaluation Checklist

When you finish, stop and honestly answer these before claiming done:

1. **Did I actually move ALL the mock data?** Run `rg "const.*=.*\[" components/ --glob '*.tsx' | head -30` — if you see large arrays of objects that look like fixtures, you missed some. Check the ops/deployment components especially — they have hundreds of inline objects.

2. **Did I update `mock-handler.ts` imports correctly?** It's 4,459 lines and imports from many of the files you moved. If any import is broken, the entire mock system fails. Run `pnpm typecheck` and specifically check `lib/api/mock-handler.ts` has zero errors.

3. **Did I preserve the existing behavior?** Load the promote page, sports page, predictions page, and at least 2 dashboard pages. Do they still show data? If any page shows "No data" or a spinner that never resolves, you broke something during the migration.

4. **Is the fixture data quality good enough for a demo?** Look at the actual values — are prices realistic? Are strategy names sensible? Are dates recent (2026, not 2024)? Would you be embarrassed showing this data to a potential client? If the mock data looks obviously fake ("Strategy 1", "Test Client", "$999,999.99"), improve it.

5. **Is `lib/` root clean?** Run `ls lib/*mock*.ts lib/*-mock-data.ts` — it should return nothing. All mock data lives under `lib/mocks/`.

6. **Is the sports ID collision fixed?** `fix-001` should mean the same thing everywhere. Run `rg "fix-001" lib/mocks/ app/ components/` and verify consistency.

7. **Did I leave the codebase better than I found it?** Not just "moved files around" but actually improved discoverability. Would a new developer know where to add mock data for a new feature? Is `lib/mocks/fixtures/` well-organized by domain?

**If the answer to any of these is "no" — go fix it before marking done.**
