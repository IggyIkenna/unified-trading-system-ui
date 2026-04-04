# Module E — Mock Data Placement, Duplication & Alignment Audit

**Output:** `docs/UI-shared-components-Issues/05-MOCK-DATA-AUDIT.md`
**Maps to:** WORK_TRACKER §5 (Mock Data Centralization), §6 (Mock Data Alignment)

This is the most detailed audit module. It has 4 sub-parts that can be run independently.

---

## Sub-Part E1: Mock Data Placement (Where Does Mock Data Live?)

**The rule:** All mock/fixture data belongs in `lib/` (ideally `lib/mocks/fixtures/` and `lib/mocks/generators/`). No page or component should define mock data inline.

### Search Patterns

Search in `app/` and `components/` (NOT `lib/`) for:

1. `const MOCK_*`, `const mock*`, `const SAMPLE_*`, `const DEMO_*`, `const FAKE_*`, `const FALLBACK_*`, `const DEFAULT_*` (when value is a data array/object, not a config primitive)
2. `const SEED_*` in hooks
3. Large array literals (`[{` with 3+ objects containing fields like `id`, `name`, `status`, `price`, `venue`, `timestamp`)
4. Data generation functions: `generateMock*`, `generateSample*`, `Array.from({length:N})` creating domain data
5. `Math.random()` used for synthetic data generation inside pages/components
6. Mock data files (`mock-data.ts`, `mock-fixtures.ts`) adjacent to components instead of in `lib/`

### For Each Finding Report

- File path, line numbers, variable name, approximate size (lines, array items)
- What domain it represents (trading, sports, predictions, DeFi, reports, ops, etc.)
- Whether a corresponding `lib/` mock file already exists
- Whether the data shape matches any `hooks/api/` response type

### Architecture Check

- Does `lib/mocks/` exist with `handlers/` and `fixtures/`?
- Is MSW in `package.json`?
- How does mock interception work (env flag, mock-handler, etc.)?
- Do `hooks/api/*.ts` files contain inline data or import from `lib/`?
- Are types co-located with mock data (should be separate)?

---

## Sub-Part E2: Mock Data Duplication

Search for:

1. Same data generation functions copy-pasted between pages (especially P&L ↔ Markets generators)
2. Same fixture arrays with slight variations across files
3. Same reference data (venue lists, instrument lists, org lists) defined in multiple places
4. Overlapping `MOCK_*` constants that represent the same domain entity

### For Each Duplication

- List both files with line numbers
- Count duplicated lines
- Propose: which file should be the SSOT

---

## Sub-Part E3: Mock Data Schema Consistency

For each domain's mock data, check:

1. **Field naming conventions** — are field names consistent? (e.g., `createdAt` vs `created_at` vs `timestamp` for the same concept)
2. **ID format standardization** — are IDs consistent per entity type? (e.g., `strat-001` vs `strategy_001` vs UUIDs vs plain numbers)
3. **Required fields present** — do all mock objects have the fields their TypeScript interfaces require?
4. **Type compliance** — do mock values match their TypeScript types? (e.g., string dates vs Date objects)
5. **Enum compliance** — do status fields use the correct enum values? (e.g., `"active"` vs `"Active"` vs `"ACTIVE"`)

### Cross-Reference Files

- `lib/types/*.ts` — canonical type definitions
- `lib/strategy-platform-types.ts`, `lib/backtest-analytics-types.ts`, etc.
- `hooks/api/*.ts` — expected response shapes

---

## Sub-Part E4: Mock Data Cross-Domain Reference Integrity

Check that IDs referenced across domains actually exist:

1. **Strategy IDs** in positions/orders → do they exist in strategy mock data?
2. **Client IDs** in positions/P&L → do they exist in client mock data?
3. **Org IDs** in clients → do they exist in org mock data?
4. **Instrument IDs** across trading/sports/predictions → consistent?
5. **Venue IDs** across positions/orders/execution → consistent?
6. **Persona scoping** — is mock data structured to support the 4 demo personas (`internal-trader`, `client-full`, `client-data-only`, `prospect`)? Can org/client filters meaningfully scope the data?

### Realistic Values Check

- P&L values: are totals internally consistent? (sum of parts = total)
- Prices: are they realistic for the instrument? (BTC ~$60k, ETH ~$3k, not $0.01)
- Volumes: positive, reasonable for the instrument?
- Sharpe ratios: realistic range (-1 to 4)?
- Dates: in the right range (not year 2000 for "recent" data)?
- Greeks: reasonable for the option characteristics?

---

## Previous Audit Reference

Read `docs/UI-shared-components-Issues/05-MOCK-DATA-AUDIT.md` (from 2026-03-27) before running. Compare findings to see what has changed since then. Flag any new violations introduced since the last audit.

## Output Expectations

- **E1 findings:** Table of every inline mock data location with file, lines, size, domain, target `lib/` location
- **E2 findings:** Table of duplications with both source files and line counts
- **E3 findings:** Table of schema inconsistencies per domain
- **E4 findings:** Table of broken cross-references and unrealistic values
- **Migration plan:** Ordered list of moves with estimated effort per move
