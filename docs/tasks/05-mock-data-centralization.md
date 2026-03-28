# Task 05 — Mock Data Centralization & MSW Wiring

**Source:** Audit `05-MOCK-DATA-AUDIT.md`, WORK_TRACKER §5, §6
**Priority:** P2 — blocks realistic demo flows and API wiring

---

## Agent Execution Model

| Phase | What | Model | Output |
|-------|------|-------|--------|
| **Phase 1 — Discovery** | Run the audit commands below. Find every file with inline mock data, measure sizes, classify by domain. Check MSW status, persona readiness. | **Smart** (claude-4-opus or claude-3.7-sonnet) | Concrete list: file → lines of mock data → target fixture file → migration plan |
| **Phase 2 — Execution** | Take Phase 1 list and mechanically: move files, update imports, create MSW handlers, verify rendering. | **Cheap** (claude-3.5-sonnet) | Code changes + passing typecheck + pages still render |

**Splitting across sessions:**
- **Session A (move):** Parts 1-6 — move mock data files (mechanical, cheap model fine)
- **Session B (MSW):** Part 7 — set up MSW handlers (needs more judgment, medium model)
- **Session C (quality):** Parts 8-10 — schema audit, ID standardization, persona scoping (smart model)

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

Move all mock data out of component/page files into `lib/mocks/`, set up MSW handlers so
the UI fetches data the same way it will in production (via React Query hooks), and ensure
mock data is schema-aligned, cross-referenced, and persona-scoped.

**Current state:**
- `lib/mocks/fixtures/` — 13 files, 1,419 lines (partial)
- `lib/mocks/handlers/` — **does not exist** (no MSW)
- `lib/mocks/generators/` — 2 files (order-flow, pnl)
- No persona system, no fixture cross-referencing
- Large inline mock datasets scattered across components:
  - `components/promote/mock-data.ts` — ~1,685 lines
  - `components/trading/sports/mock-data.ts` — ~1,556 lines
  - `components/trading/predictions/mock-data.ts` — ~798 lines
  - `components/promote/mock-fixtures.ts` — ~674 lines
  - Multiple page files with inline arrays (DataStatusTab 386 obj opens, DeploymentDetails 293, etc.)

**After this task:** Every component and page gets its data from React Query hooks that hit
MSW handlers in development. Mock data lives exclusively in `lib/mocks/`. Switching from
mock to real API requires only changing the handler — zero component changes.

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

## Part 6 — Move inline page data to `lib/mocks/fixtures/`

**Source files with significant inline data:**
- `app/(platform)/services/trading/strategies/grid/page.tsx` — `DEFAULT_BACKTEST_RESULTS` (~114 lines), `METRICS` (~8 lines)
- `app/(platform)/services/trading/terminal/page.tsx` — `DEFAULT_INSTRUMENTS` (~14 lines), `generateCandleData()` (~20 lines)
- `app/(platform)/investor-relations/board-presentation/page.tsx` — ~290 inline object opens

**Target:** `lib/mocks/fixtures/trading-grid-data.ts`, `lib/mocks/generators/candle-data.ts`,
`lib/mocks/fixtures/board-presentation-data.ts`

**Also check these component files for inline data:**
- `components/ops/deployment/DataStatusTab.tsx` (386 object opens)
- `components/ops/deployment/DeploymentDetails.tsx` (293 object opens)
- `components/trading/options-futures-panel.tsx` (289 object opens)
- `components/ops/deployment/ExecutionDataStatus.tsx` (154 object opens)
- `components/data/raw-data-finder-config.tsx`
- `components/data/processing-finder-config.tsx`
- `components/data/instruments-finder-config.tsx`
- `components/marketing/data-services-showcase.tsx`
- `components/widgets/sports/sports-my-bets-widget.tsx`
- `components/widgets/defi/defi-rates-overview-widget.tsx`
- `components/widgets/risk/risk-stress-table-widget.tsx`

For each: extract mock data arrays to `lib/mocks/fixtures/`, leave the component importing
from the new location.

---

## Part 7 — Set up MSW handlers

**Problem:** `lib/mocks/handlers/` does not exist. No MSW (Mock Service Worker) is configured.
Components either import mock data directly or hardcode arrays inline. This means switching
to real APIs requires rewriting data flow in every component.

**Deliverable:**

1. Install MSW if not already present: check `package.json` for `msw`.
2. Create `lib/mocks/browser.ts` — MSW browser worker setup.
3. Create `lib/mocks/handlers/index.ts` — barrel export.
4. Create handlers for the most important domains first:
   - `lib/mocks/handlers/trading.ts` — positions, orders, strategies, pnl, alerts
   - `lib/mocks/handlers/promote.ts` — candidates, pipeline, gates
   - `lib/mocks/handlers/sports.ts` — fixtures, odds, bets
   - `lib/mocks/handlers/risk.ts` — risk metrics, stress tests
   - `lib/mocks/handlers/reports.ts` — reconciliation, settlement, regulatory

5. Each handler should:
   - Use `http.get()` / `http.post()` from MSW
   - Return data from `lib/mocks/fixtures/`
   - Match the API URL patterns defined in `lib/config/api.ts` (`API_CONFIG`)
   - Return `HttpResponse.json()` with proper status codes

6. Wire MSW into the app's development startup (check if there's a providers file or
   a dev-mode initializer).

**Note:** This is the largest and most impactful part. Without MSW handlers, the mock data
is just static arrays — no request/response cycle, no loading states, no error simulation.

---

## Part 8 — Schema consistency audit

Review all mock data in `lib/mocks/fixtures/` for:

1. **Field naming:** Consistent conventions (camelCase everywhere, no mixed snake_case).
2. **Required fields:** Every mock object has all fields the TypeScript interface requires.
3. **Type alignment:** Mock values match the TS type (string IDs are strings, dates are ISO strings, enums use valid values).
4. **Cross-reference:** Compare mock data shapes against `lib/types/` interfaces.

Flag mismatches. Fix in place.

---

## Part 9 — ID format standardization

Check ID formats across all mock data:
- Strategy IDs: pick one format (e.g., `strat-001` or UUID)
- Client IDs, org IDs, instrument IDs: standardize per entity type
- Ensure the same strategy ID in `promote-candidates.ts` matches the strategy ID in `positions` mock data

---

## Part 10 — Persona scoping readiness

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
3. **MSW handlers match API_CONFIG URLs.** When we switch to real APIs, we change the handler
   — not the component.
4. **Don't break existing rendering.** Every page that currently works with inline data must
   still work after the migration — just sourcing data differently.
5. **One file per domain.** Don't create `promote-mock-data-part1.ts` and `part2.ts`.
   If a fixture file is too large (>500 lines), split by entity type (e.g.,
   `promote-candidates.ts` vs `promote-gates.ts`), not by arbitrary chunks.

---

## Acceptance Criteria

- [ ] Zero mock data files in `components/` — all moved to `lib/mocks/fixtures/`
- [ ] Zero inline mock arrays in `app/` page files
- [ ] `lib/mocks/handlers/` exists with at least 5 domain handlers
- [ ] MSW browser worker configured and starts in development mode
- [ ] All imports updated — `rg "from.*mock-data\|from.*mock-fixtures" components/` returns zero
- [ ] Schema audit complete — all mock objects match their TypeScript interfaces
- [ ] ID formats standardized across domains
- [ ] `pnpm typecheck` passes
- [ ] App loads and renders with data on all major pages

---

## Self-Evaluation Checklist

When you finish, stop and honestly answer these before claiming done:

1. **Did I actually move ALL the mock data?** Run `rg "const.*=.*\[" components/ --glob '*.tsx' | head -30` — if you see large arrays of objects that look like fixtures, you missed some. Check the ops/deployment components especially — they have hundreds of inline objects.

2. **Are the MSW handlers realistic?** Do they return data in the same shape the real API will? Check `lib/config/api.ts` for the URL patterns. If the handler URL is `/api/v1/positions` but the real API is `/trading/positions`, you've created a mismatch that will break when wiring real APIs.

3. **Did I preserve the existing behavior?** Load the promote page, sports page, predictions page, and at least 2 dashboard pages. Do they still show data? If any page shows "No data" or a spinner that never resolves, you broke something during the migration.

4. **Is the fixture data quality good enough for a demo?** Look at the actual values — are prices realistic? Are strategy names sensible? Are dates recent (2026, not 2024)? Would you be embarrassed showing this data to a potential client? If the mock data looks obviously fake ("Strategy 1", "Test Client", "$999,999.99"), improve it.

5. **Can I filter by persona?** Pick one fixture file and mentally trace: if I'm `client-full` with `orgId: "org-acme"`, can the handler filter this data to show only Acme's strategies? If not, the persona scoping work isn't done.

6. **Did I leave the codebase better than I found it?** Not just "moved files around" but actually improved the architecture. Are the handlers well-organized? Are the fixture files easy to find and understand? Would a new developer know where to add mock data for a new feature?

**If the answer to any of these is "no" — go fix it before marking done.**
