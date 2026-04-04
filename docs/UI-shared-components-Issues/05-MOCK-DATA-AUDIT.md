# E — Mock Data Audit

**Date:** 2026-03-28  
**Scope:** `app/`, `components/`, `hooks/api/`, `lib/mocks/`, `lib/api/mock-handler.ts`, `lib/*mock*`, policy vs `.cursorrules`  
**Previous audit:** Prior `05-MOCK-DATA-AUDIT.md` (2026-03-27) is **not present in the tree** (deleted); this run is a **full baseline** against current policy, not a delta vs that file.

---

## 1. Current State

### Architecture (actual)

| Item                      | State                                                                                                                                                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`lib/mocks/`**          | Exists with `fixtures/` (15 files) and `generators/` (2 files). **No `handlers/` directory.**                                                                                                                                                                                                         |
| **MSW in `package.json`** | **Not listed** in dependencies or devDependencies.                                                                                                                                                                                                                                                    |
| **Mock interception**     | `NEXT_PUBLIC_MOCK_API === "true"` → dynamic import in `lib/providers.tsx` calls `installMockHandler()` from `lib/api/mock-handler.ts`, which patches `fetch` for `/api/*` and returns JSON from large in-memory maps importing `lib/trading-data`, `lib/*-mock-data.ts`, `lib/mocks/fixtures/*`, etc. |
| **Personas**              | Demo users live in `lib/auth/personas.ts`; provisioning / ledger helpers in `lib/api/mock-provisioning-state.ts`, `lib/api/mock-trade-ledger.ts`. Cursorrules cite four personas; `AGENT_PROMPT.md` still mentions five — **doc drift**.                                                              |
| **Hooks**                 | Most hooks call `apiFetch` / React Query; **some** embed `SEED_*` fallback arrays (`hooks/api/use-strategies.ts`, `hooks/api/use-news.ts`).                                                                                                                                                           |

### Policy (`.cursorrules` + `AGENT-AUDIT-INSTRUCTIONS.md`)

- Mocks: **MSW** in `lib/mocks/handlers/`, fixtures in `lib/mocks/fixtures/`, dimensional mocking by persona, **no per-component mocks**.

### Gap

Implementation is **fetch interception + scattered lib root mock modules**, not MSW handlers. Many pages/components still hold **large inline fixtures**. Internal docs (`AGENT_PROMPT.md`, `START_HERE.md`, `SERVICE_COMPLETION_STATUS.md`) **overstate** `lib/mocks/handlers/` and MSW.

**Severity:** 🔴 Critical (policy vs reality + fragmentation).

---

## 2. Findings

### 2.1 E1 — Mock data placement (inline / wrong layer)

**Rule violated:** No page or component should define mock data inline; fixtures belong under `lib/mocks/fixtures/` (and generators under `lib/mocks/generators/`), with API-shaped data feeding handlers — per `.cursorrules` target architecture.

**Scale (indicative):**

- **~83** lines matching `const (MOCK_|SEED_|FALLBACK_|…)` in `app/` + `components/` (ripgrep count).
- **≥39** files in `app/` + `components/` with `MOCK_*` / `SEED_*` / `FALLBACK_*` / exported `MOCK_*`.
- **+9** additional files using `const mock…` (e.g. `mockStrategies`, `mockBenchmarkPerformance`).

**Representative inline / adjacent violations**

| File                                                           | Lines (approx.) | Name / pattern                                   | Domain           | Notes                                                                                              |
| -------------------------------------------------------------- | --------------- | ------------------------------------------------ | ---------------- | -------------------------------------------------------------------------------------------------- |
| `components/trading/sports/mock-data.ts`                       | 93–~1550        | `MOCK_FIXTURES`, `MOCK_ODDS`, `MOCK_BETS`, …     | Sports           | **~1.5k lines**; correct _folder_ is wrong — should be `lib/mocks/fixtures/` (+ typed re-exports). |
| `components/trading/predictions/mock-data.ts`                  | 11–~800         | `MOCK_MARKETS`, `MOCK_POSITIONS`, …              | Predictions      | Same.                                                                                              |
| `components/promote/mock-data.ts`                              | 52+             | `MOCK_CANDIDATES`                                | Promote          | Same; `mock-fixtures.ts` also under `components/promote/`.                                         |
| `app/(platform)/services/reports/ibor/page.tsx`                | 85–336          | `MOCK_POSITIONS`, `MOCK_JOURNAL`, …              | Reports / IBOR   | Large page-local arrays.                                                                           |
| `app/(platform)/services/reports/settlement/page.tsx`          | 39+             | `MOCK_SETTLEMENTS`, `MOCK_INVOICES`              | Reports          | Inline.                                                                                            |
| `app/(platform)/services/data/valuation/page.tsx`              | 78–138          | `MOCK_PRICING`, `MOCK_WATERFALL`, …              | Data / valuation | Inline.                                                                                            |
| `app/(platform)/services/trading/sports/accumulators/page.tsx` | 50+             | Local `Fixture` + `MOCK_FIXTURES`                | Sports           | **Duplicates ID space** with sports `mock-data.ts` (see E4).                                       |
| `components/dashboards/trader-dashboard.tsx`                   | 43–144          | `mockStrategies`, `mockAlerts`, …                | Dashboard        | Inline.                                                                                            |
| `components/trading/options-chain.tsx`                         | 95–192          | `generateMockExpiry`, `generateMockOptionsChain` | Options          | Heavy generation + `Math.random` in component.                                                     |
| `components/trading/order-book.tsx`                            | 33+             | `generateMockOrderBook`                          | Order book       | Exported from trading barrel.                                                                      |
| `components/widgets/book/book-data-context.tsx`                | 136–187         | `generateMockTrades`, `MOCK_TRADES`              | Widget           | Inline generation.                                                                                 |
| `app/(ops)/ops/services/page.tsx`                              | 60–69           | Synthetic metrics                                | Ops              | **`Math.random`** per row.                                                                         |
| `components/marketing/arbitrage-galaxy.tsx`                    | 91–95           | Particle positions                               | Marketing        | `Math.random` (acceptable for viz-only if isolated; still off-SSOT for “domain” mocks).            |

**`mock-data.ts` / `mock-fixtures.ts` adjacent to components (policy: should be `lib/mocks/`)**

- `components/trading/sports/mock-data.ts`, `mock-fixtures.ts`
- `components/trading/predictions/mock-data.ts`
- `components/promote/mock-data.ts`, `mock-fixtures.ts`

**`lib/` root mock modules (not under `lib/mocks/fixtures/`)**

- `lib/trading-data.ts`, `lib/execution-platform-mock-data.ts`, `lib/ml-mock-data.ts`, `lib/strategy-platform-mock-data.ts`, `lib/data-service-mock-data.ts`, `lib/build-mock-data.ts`, `lib/backtest-analytics-mock.ts`, `lib/deterministic-mock.ts`, `lib/mock-data/` (`index.ts`, `seed.ts`)

These are **centralized relative to pages** but **split** from `lib/mocks/fixtures/` SSOT named in rules.

**Hooks (`hooks/api/`)**

| File                          | Finding                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `hooks/api/use-strategies.ts` | `SEED_STRATEGIES` (~164+) — fallback domain data in hook. |
| `hooks/api/use-news.ts`       | `SEED_NEWS` (~17+) — same.                                |

**What to use instead:** Move fixtures to `lib/mocks/fixtures/<domain>.ts` (or merge into existing fixture files), import from hooks/pages; long term align with **one** interception layer (see migration plan).

---

### 2.2 E2 — Duplication

| Topic                      | Locations                                                                                                                                                                                                                              | Estimate                                    | Proposed SSOT                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Sports fixtures**        | `components/trading/sports/mock-data.ts` (`fix-001` = MCI vs LIV, rich `Fixture`) vs `app/.../sports/accumulators/page.tsx` (`fix-001` = Arsenal vs Man City, flat shape) vs `app/.../sports/bet/page.tsx` (`MOCK_FIXTURES_WITH_ODDS`) | Tens–hundreds of lines overlapping concept  | `lib/mocks/fixtures/sports-fixtures.ts` + single `Fixture` type from `components/trading/sports/types` or `lib/types` |
| **Prediction markets**     | `components/trading/predictions/mock-data.ts` vs `app/.../predictions/aggregators/page.tsx` (`MOCK_MARKETS`)                                                                                                                           | Duplicate market lists                      | One fixture module                                                                                                    |
| **Execution seeds**        | `lib/execution-platform-mock-data.ts` (imported by `mock-handler.ts`) vs `app/.../execution/overview/page.tsx` (`SEED_VENUES`, `SEED_ALGOS`, `SEED_RECENT_ORDERS`)                                                                     | Parallel seed data                          | Import SSOT from `lib/execution-platform-mock-data.ts` only                                                           |
| **Reports overview seeds** | `app/.../reports/overview/page.tsx` (`SEED_REPORTS`, `SEED_SETTLEMENTS`, …)                                                                                                                                                            | Likely overlaps mock-handler / lib mocks    | Consolidate under `lib/mocks/fixtures/reports-overview.ts`                                                            |
| **Promote vs research**    | `components/promote/mock-data.ts` vs `components/research/execution/new-execution-dialog.tsx` (`MOCK_STRATEGY_BACKTESTS`)                                                                                                              | Overlapping “strategy / backtest” demo rows | `lib/mocks/fixtures/promote-execution.ts`                                                                             |

---

### 2.3 E3 — Schema consistency (mock vs TypeScript / API)

| Issue                          | Examples                                                                                                                                                                     | Severity                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **`Array<any>` in pages**      | `execution/benchmarks/page.tsx` (`mockBenchmarkPerformance`), `execution/algos/page.tsx`, `venues/page.tsx`, `candidates/page.tsx`, `overview/page.tsx` (`MOCK_VENUES` etc.) | 🟡 High — breaks contract alignment with OpenAPI-generated types |
| **Duplicate local interfaces** | `accumulators/page.tsx` defines its own `Fixture` vs `components/trading/sports/types`                                                                                       | 🟡 High — drift guaranteed                                       |
| **Mixed naming**               | API / ledger mocks often `snake_case` (`client_id`); UI entities often `camelCase` — acceptable if boundary is explicit; **inline pages** mix both ad hoc                    | 🟢 Medium                                                        |
| **Enum / status casing**       | Must be checked per screen; several mocks use display strings vs strict unions                                                                                               | 🟢 Medium (spot-check during moves)                              |
| **Date types**                 | Mix of ISO strings vs `new Date()` in sports mocks                                                                                                                           | 🟢 Medium — serialize consistently for JSON                      |

**Cross-reference:** `lib/types/*.ts`, `lib/registry/openapi.json` → `lib/types/api-generated.ts`, and `hooks/api/*.ts` response types should be the **lint target** when moving mocks.

---

### 2.4 E4 — Cross-domain integrity & realism

| Check                  | Result                                                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sports `fix-001`**   | **Broken:** accumulators page = Arsenal–Man City; `mock-data.ts` = Man City–Liverpool. Same ID, different truth.                                          |
| **Strategy / org IDs** | `mock-handler.ts` pulls `STRATEGIES`, `ORGANIZATIONS`, etc. from `lib/trading-data` — generally coherent; **page-only seeds** may not match hook/API IDs. |
| **Persona scoping**    | Ledger / provisioning reference `internal-trader`, `client-full`; many **inline page mocks** do not vary by persona → filters demo poorly.                |
| **P&L / prices**       | `lib/trading-data` + widgets use plausible ranges; **randomized** ops/training charts are non-deterministic (harder to test).                             |
| **Sharpe / Greeks**    | Options pricing page uses static `MOCK_GREEKS` rows — spot-check vs instrument (manual QA).                                                               |

---

## 3. Worst Offenders (by impact)

1. **`components/trading/sports/mock-data.ts`** — size + `Math.random`-style progressive generation embedded with fixtures.
2. **`components/trading/predictions/mock-data.ts`** — same pattern.
3. **`app/(platform)/services/reports/ibor/page.tsx`** — multiple large inline datasets.
4. **`app/(platform)/services/trading/sports/accumulators/page.tsx`** — duplicate ID space / shape vs SSOT sports fixtures.
5. **`lib/api/mock-handler.ts`** — monolithic interceptor (correct role) but **imports many non–`lib/mocks`** sources → encourages parallel mock universes.
6. **`components/trading/options-chain.tsx`**, **`order-book.tsx`**, **`vol-surface-chart.tsx`** — exported generators + randomness in UI layer.
7. **`app/(ops)/ops/services/page.tsx`** — random metrics (non-reproducible).
8. **Docs claiming MSW + `lib/mocks/handlers/`** — mislead implementers.

---

## 4. Recommended Fixes

1. **Declare SSOT:** Either adopt **real MSW** (add dependency, add `lib/mocks/handlers/`, register in tests + dev) **or** formally document **`installMockHandler`** as the canonical approach and **delete** MSW references from internal docs — pick one; rules should match.
2. **Move** `components/**/mock-data.ts` (sports, predictions, promote) → `lib/mocks/fixtures/` with thin re-exports if needed.
3. **Delete** page-local `MOCK_*` / `SEED_*` where `mock-handler` or shared fixtures already provide the same domain; pages should consume hooks only.
4. **Resolve** sports `fix-001` conflict: one ID graph for all sports UIs.
5. **Relocate** `generateMockOrderBook`, `generateMockOptionsChain`, `generateMockVolSurface` to `lib/mocks/generators/` (or keep deterministic seeds). Replace `Math.random` in ops/training demos with **seeded** generators (`lib/deterministic-mock.ts` exists — reuse).
6. **Remove `Array<any>`** from execution/report pages; type against `api-generated` or domain types.
7. **Align persona story:** ensure four vs five persona docs match `lib/auth/personas.ts`.

---

## 5. Remediation Priority (migration plan)

| Phase  | Action                                                                                                    | Effort |
| ------ | --------------------------------------------------------------------------------------------------------- | ------ |
| **P0** | Fix **sports ID / shape** conflict (accumulators + bet page → import shared types + fixtures).            | ~0.5 d |
| **P1** | Move **sports + predictions** mock files to `lib/mocks/fixtures/`; update imports.                        | ~1–2 d |
| **P1** | Move **promote** mocks to `lib/mocks/fixtures/`; keep components UI-only.                                 | ~1 d   |
| **P2** | Strip **inline MOCK\_** from reports/data pages; wire to hooks or fixture imports.                        | ~3–5 d |
| **P2** | Consolidate **`lib/*-mock-data.ts`** into `lib/mocks/fixtures/` namespaces (re-export to avoid big-bang). | ~2–4 d |
| **P3** | **MSW vs mock-handler** decision + doc + dependency cleanup.                                              | ~2–5 d |
| **P3** | Generators out of `components/trading/*`; seeded ops/training metrics.                                    | ~2 d   |

**Total rough order:** ~2–3 weeks calendar time for P0–P2 with testing across `NEXT_PUBLIC_MOCK_API=true` and two personas.

---

## 6. Severity & Effort Summary

| Category                                    | Severity    | Fix effort                                        |
| ------------------------------------------- | ----------- | ------------------------------------------------- |
| Policy vs actual (no MSW / no handlers dir) | 🔴 Critical | Doc + arch decision: 0.5–2 d + optional MSW build |
| Inline / component mock data                | 🔴 Critical | Multi-day (see plan)                              |
| Duplication & ID collisions                 | 🟡 High     | 1–3 d                                             |
| Schema / `any` / local interfaces           | 🟡 High     | 2–4 d                                             |
| Persona-scoped data gaps                    | 🟢 Medium   | Ongoing                                           |

---

_End of Module E audit._
