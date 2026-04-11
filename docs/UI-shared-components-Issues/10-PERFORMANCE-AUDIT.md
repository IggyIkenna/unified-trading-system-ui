# J — Performance Patterns Audit

**Date:** 2026-03-28  
**Scope:** `app/`, `components/`, `hooks/`, `lib/` (line counts and patterns; generated `lib/types/api-generated.ts` noted separately)  
**Previous audit:** First audit

---

## 1. Current State

| Area                            | What exists                                                                                                                                                                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Routing**                     | Next.js App Router; **138** `page.tsx` files under `app/`.                                                                                                                                                                                                             |
| **Client boundary**             | **135** of **138** pages declare `"use client"` in the first lines (≈98%). Only **3** pages omit it: `app/(platform)/services/research/page.tsx`, `app/(platform)/services/promote/page.tsx`, `app/(ops)/engagement/page.tsx`.                                         |
| **Memoization hooks**           | **144** `.tsx` files under `app/`, `components/`, `hooks/`, `lib/` use `useMemo(` and/or `useCallback(`.                                                                                                                                                               |
| **`React.memo` / `memo(`**      | **0** `.tsx` files in `app/`, `components/`, `hooks/`, `lib/` use `React.memo` or `memo(` — no component-level memoization pattern in source tree.                                                                                                                     |
| **Code splitting**              | `next/dynamic` appears in **4** files: `app/(ops)/devops/page.tsx` (multiple tab panels), `components/platform/guided-tour.tsx` (Joyride), `components/widgets/terminal/price-chart-widget.tsx`, `components/widgets/risk/risk-correlation-heatmap-widget.tsx`.        |
| **Images**                      | **No** `next/image` imports anywhere in the repo (search under `app/`, `components/`, `hooks/`, `lib/`). Raw `<img>`: `components/shell/site-header.tsx` (~line 84); string template with `<img>` in `app/(public)/signup/page.tsx` (~line 333).                       |
| **Charts**                      | `components/ui/chart.tsx` uses `import * as RechartsPrimitive from "recharts"` (full namespace). Multiple widgets import named exports from `recharts` at module top level.                                                                                            |
| **Heavy dependencies**          | **366** distinct `.tsx` files (under `app/`, `components/`, `hooks/`, `lib/`) match at least one of: `recharts`, `@tanstack/react-table`, `lucide-react`, `date-fns`, `framer-motion`, `chart.js`, `d3-`, `ag-grid` (indicative of widespread table/chart/icon usage). |
| **Inline handlers (heuristic)** | **675** matches for `onClick={() =>` and **284** for `onChange={` with inline arrows in `app/` + `components/` (not all are performance bugs; many are fine for leaf nodes).                                                                                           |
| **`useEffect` density**         | Files with **≥6** `useEffect(` calls (same scope): `components/ops/deployment/DeploymentDetails.tsx` (8), `components/ops/deployment/DataStatusTab.tsx` (8), `app/(platform)/services/trading/terminal/page.tsx` (9).                                                  |
| **`exhaustive-deps` overrides** | `hooks/use-auth.tsx` (~110), `components/ops/deployment/DeploymentDetails.tsx` (~1119, commented rationale), `components/research/features/feature-dialogs.tsx` (~92), `components/research/execution/new-execution-dialog.tsx` (~204).                                |

---

## 2. Findings

### 2.1 Large files (>500 lines) — split / lazy-load candidates

**Rule:** Files >500 lines are hard to tree-shake mentally and often correlate with large client bundles when imported from client pages.

| File                                                                       | Lines (wc) | Severity    | Notes                                                                                                                                                        |
| -------------------------------------------------------------------------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/types/api-generated.ts`                                               | 18 731     | 🟡 High     | Generated; exclude from manual “split” — but **pulls full OpenAPI surface** into typecheck/IDE; ensure it is never imported wholesale into hot client paths. |
| `lib/strategy-registry.ts`                                                 | 7 509      | 🔴 Critical | Domain registry size; risk if imported by client components without lazy boundaries.                                                                         |
| `lib/api/mock-handler.ts`                                                  | 4 459      | 🟡 High     | Mock path only; still large module graph for dev/demo.                                                                                                       |
| `components/ops/deployment/DataStatusTab.tsx`                              | 4 054      | 🔴 Critical | Ops UI monolith.                                                                                                                                             |
| `components/ops/deployment/DeploymentDetails.tsx`                          | 3 709      | 🔴 Critical | Many effects; see §2.5.                                                                                                                                      |
| `components/trading/options-futures-panel.tsx`                             | 3 280      | 🔴 Critical | Trading surface.                                                                                                                                             |
| `lib/ml-mock-data.ts`                                                      | 2 907      | 🟡 High     | Fixture volume.                                                                                                                                              |
| `lib/build-mock-data.ts`                                                   | 2 595      | 🟡 High     | Fixture volume.                                                                                                                                              |
| `lib/data-service-mock-data.ts`                                            | 2 452      | 🟡 High     | Fixture volume.                                                                                                                                              |
| `app/(public)/signup/page.tsx`                                             | 2 139      | 🔴 Critical | Public page + huge client component.                                                                                                                         |
| `app/(platform)/investor-relations/board-presentation/page.tsx`            | 1 888      | 🔴 Critical | Presentation / export flows.                                                                                                                                 |
| `components/ops/deployment/DeployForm.tsx`                                 | 1 783      | 🔴 Critical | Form + deployment logic.                                                                                                                                     |
| `components/promote/mock-data.ts`                                          | 1 684      | 🟡 High     | Data volume adjacent to UI.                                                                                                                                  |
| `app/(platform)/services/manage/clients/page.tsx`                          | 1 594      | 🔴 Critical | Platform page.                                                                                                                                               |
| `components/ops/deployment/ExecutionDataStatus.tsx`                        | 1 573      | 🔴 Critical | Ops.                                                                                                                                                         |
| `app/(platform)/services/trading/strategies/[id]/page.tsx`                 | 1 527      | 🔴 Critical | Detail route.                                                                                                                                                |
| `components/dashboards/quant-dashboard.tsx`                                | 1 416      | 🔴 Critical | Dashboard.                                                                                                                                                   |
| `lib/reference-data.ts`                                                    | 1 369      | 🟡 High     | Reference payload size.                                                                                                                                      |
| `app/(platform)/services/observe/health/page.tsx`                          | 1 358      | 🔴 Critical | Health observability.                                                                                                                                        |
| `components/trading/manual-trading-panel.tsx`                              | 1 350      | 🔴 Critical | Core trading.                                                                                                                                                |
| `app/(platform)/services/research/strategy/backtests/page.tsx`             | 1 345      | 🔴 Critical | Research.                                                                                                                                                    |
| `components/dashboards/risk-dashboard.tsx`                                 | 1 294      | 🔴 Critical | Risk.                                                                                                                                                        |
| `app/(platform)/services/research/ml/training/page.tsx`                    | 1 267      | 🔴 Critical | ML.                                                                                                                                                          |
| `components/dashboards/devops-dashboard.tsx`                               | 1 164      | 🔴 Critical | DevOps dash.                                                                                                                                                 |
| `components/trading/options-chain.tsx`                                     | 1 162      | 🔴 Critical | Options.                                                                                                                                                     |
| `app/(ops)/config/page.tsx`                                                | 1 147      | 🔴 Critical | Ops config.                                                                                                                                                  |
| `lib/taxonomy.ts`                                                          | 1 110      | 🟡 High     | Taxonomy data.                                                                                                                                               |
| `lib/trading-data.ts`                                                      | 1 086      | 🟡 High     | Trading mock/data.                                                                                                                                           |
| `app/(platform)/services/research/ml/components/run-analysis-sections.tsx` | 1 057      | 🔴 Critical | ML sections.                                                                                                                                                 |
| `components/research/features/feature-dialogs.tsx`                         | 1 041      | 🔴 Critical | Dialog stack.                                                                                                                                                |
| `components/dashboards/audit-dashboard.tsx`                                | 1 001      | 🔴 Critical | Audit.                                                                                                                                                       |
| `components/dashboards/executive-dashboard.tsx`                            | 938        | 🔴 Critical | Executive.                                                                                                                                                   |
| `lib/strategy-platform-mock-data.ts`                                       | 937        | 🟡 High     | Fixtures.                                                                                                                                                    |
| `app/(platform)/services/reports/reconciliation/page.tsx`                  | 933        | 🔴 Critical | Reports.                                                                                                                                                     |
| `components/trading/context-bar.tsx`                                       | 916        | 🟡 High     | Shell-adjacent; high rerender risk.                                                                                                                          |
| `lib/lifecycle-mapping.ts`                                                 | 911        | 🟢 Medium   | Mostly static mapping.                                                                                                                                       |
| `components/research/execution/execution-detail-view.tsx`                  | 899        | 🔴 Critical | Execution UI.                                                                                                                                                |
| `components/research/execution/new-execution-dialog.tsx`                   | 897        | 🔴 Critical | Dialog.                                                                                                                                                      |

**What to use instead:** Extract presentational subcomponents, route-level `loading.tsx` / Suspense, `next/dynamic` for below-the-fold or tabbed panels, and move static/marketing content to Server Components where possible.

---

### 2.2 `"use client"` on pages that could be server components

| File                                  | Line | Violation                                                               | Replacement                                                           |
| ------------------------------------- | ---- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `app/(public)/privacy/page.tsx`       | 1    | Static prose; no hooks in file body                                     | Default **Server Component**; remove `"use client"`.                  |
| `app/(public)/terms/page.tsx`         | 1    | Static prose; no hooks                                                  | Same as privacy.                                                      |
| _(Many other marketing/public pages)_ | 1    | Pattern: `"use client"` without `useState` / `useEffect` / browser APIs | Audit per file; split interactive islands into small client children. |

**Scale:** Essentially **all** feature pages are client components; many **likely require** hooks (filters, tables, React Query). Priority is **static** routes first (legal, simple marketing), then **hybrid** layouts (server shell + client widget grid).

**Severity:** 🔴 Critical for blanket client pages (JS payload + TTFB interaction); 🟡 High for static pages incorrectly marked client.

---

### 2.3 Missing `React.memo` / `useMemo` / `useCallback` (patterns)

| Finding             | Evidence                                                                          | Severity  |
| ------------------- | --------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **No `memo` usage** | 0 files with `React.memo` / `memo(` in audited dirs                               | 🟡 High   | Lists/grids/context consumers may over-render; profile before blanket memo — but **zero** memo suggests no systematic approach. |
| **Hooks present**   | 144 files use `useMemo` / `useCallback`                                           | 🟢 Medium | Some optimization exists; inconsistent vs large dashboard/trading trees.                                                        |
| **Recharts barrel** | `components/ui/chart.tsx` line 4: `import * as RechartsPrimitive from "recharts"` | 🟡 High   | Pulls entire module namespace into chart helper consumers; prefer **named** imports or lazy `dynamic()` for chart routes.       |

**What to use instead:** After React Compiler adoption (if planned), prefer compiler; until then, memoize **row** / **cell** components in virtualized tables, stable `useCallback` for props passed to memoized children, and `dynamic(..., { ssr: false })` only where necessary for chart-only routes.

---

### 2.4 Unnecessary re-renders — inline functions / unstable refs (heuristic)

| Pattern             | Count (`app/` + `components/`) | Severity  | Note                                                                                         |
| ------------------- | ------------------------------ | --------- | -------------------------------------------------------------------------------------------- |
| `onClick={() =>`    | **675**                        | 🟢 Medium | Many are acceptable; problematic when passed to **memoized** children or **heavy** subtrees. |
| `onChange={` inline | **284**                        | 🟢 Medium | Same.                                                                                        |
| `style={{`          | **246**                        | 🟢 Medium | New object per render; prefer Tailwind/classes or `useMemo` for animated styles.             |

**Representative “unstable prop” risk:** Any large page that maps rows and passes `onClick={() => ...}` into a child that could be memoized — without `useCallback` or row component extraction.

---

### 2.5 Images: `<img>` vs `next/image`

| File                               | Line | Issue                                        | Fix                                                                                                           |
| ---------------------------------- | ---- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `components/shell/site-header.tsx` | ~84  | `<img src="/images/odum-logo.png" ... />`    | `next/image` with `width`/`height` or `fill` + `priority` for LCP if above fold.                              |
| `app/(public)/signup/page.tsx`     | ~333 | `<img>` inside template string (HTML string) | Refactor to React tree + `next/image` or ensure build-time asset pipeline documents why raw HTML is required. |

**Severity:** 🟡 High (LCP, sizing, CDN optimization missed).

---

### 2.6 Dynamic imports / code splitting

| File                                                          | Usage                            | Severity                                                                  |
| ------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------- |
| `app/(ops)/devops/page.tsx`                                   | Multiple `dynamic()` tab chunks  | 🟢 Medium — **good** pattern; replicate for other heavy ops/trading tabs. |
| `components/platform/guided-tour.tsx`                         | Joyride lazy                     | 🟢 Medium                                                                 |
| `components/widgets/terminal/price-chart-widget.tsx`          | Options chain + vol surface lazy | 🟢 Medium                                                                 |
| `components/widgets/risk/risk-correlation-heatmap-widget.tsx` | Heatmap lazy                     | 🟢 Medium                                                                 |

**Gap:** 🔴 Critical — **only 4** files use `next/dynamic` under `app/` + `components/` for heavy UI. Large dashboards and trading panels are overwhelmingly static imports.

---

### 2.7 Bundle size — top-level heavy libraries

| Library                   | Example locations                                                                    | Severity                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **recharts**              | `components/ui/chart.tsx` (namespace import); widgets import chart primitives at top | 🟡 High                                                                           |
| **@tanstack/react-table** | Widespread (part of 366-file heavy-dep set)                                          | 🟢 Medium — appropriate; ensure column defs are stable (`useMemo`).               |
| **lucide-react**          | Icon barrel imports common                                                           | 🟢 Medium — verify bundler tree-shakes; avoid `import * as Icons`.                |
| **firebase**              | `package.json` dependency                                                            | 🟡 High if imported in root `providers` for all routes — audit **entry** imports. |

**What to use instead:** Route-level or widget-level **dynamic import** for chart-heavy and PDF/canvas stacks; defer Firebase to auth route chunk if possible.

---

### 2.8 `useEffect` — missing / incorrect dependency arrays

| File                                                     | Line  | Finding                                                                                                                 |
| -------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------- |
| `components/research/execution/new-execution-dialog.tsx` | ~204  | `}, [strategyBt]); // eslint-disable-line react-hooks/exhaustive-deps` — intentional omit; verify stale closure safety. |
| `components/ops/deployment/DeploymentDetails.tsx`        | ~1119 | `eslint-disable-next-line` with comment — document contract; risk of drift.                                             |
| `components/research/features/feature-dialogs.tsx`       | ~92   | Disabled exhaustive-deps                                                                                                |
| `hooks/use-auth.tsx`                                     | ~110  | Disabled exhaustive-deps                                                                                                |

**Severity:** 🟡 High — small count of **explicit** suppressions; many more effects may have **silent** incomplete deps (not flagged without strict lint in CI).

**What to use instead:** Enable / enforce `react-hooks/exhaustive-deps` in CI; refactor to `useQuery` / event subscriptions where effects duplicate React Query.

---

## 3. Worst Offenders (by performance risk × size)

| Rank | File                                                       | Primary issue                                                |
| ---- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| 1    | `lib/types/api-generated.ts`                               | Enormous generated module — guard client imports.            |
| 2    | `lib/strategy-registry.ts`                                 | Very large registry — verify server/client split.            |
| 3    | `app/(public)/signup/page.tsx`                             | **2k+** lines, public route, client component.               |
| 4    | `components/ops/deployment/DataStatusTab.tsx`              | **4k+** lines, client ops surface.                           |
| 5    | `components/ops/deployment/DeploymentDetails.tsx`          | **3.7k** lines, 8× `useEffect`, eslint-deps override.        |
| 6    | `components/trading/options-futures-panel.tsx`             | **3.2k** lines, hot trading path.                            |
| 7    | `app/(platform)/services/observe/health/page.tsx`          | **1.35k** lines, observability dashboard.                    |
| 8    | `app/(platform)/services/trading/strategies/[id]/page.tsx` | **1.5k** lines, strategy detail.                             |
| 9    | `components/ui/chart.tsx`                                  | Namespace **recharts** import — affects all chart consumers. |
| 10   | **135/138** `page.tsx` with `"use client"`                 | Systemic RSC / payload tradeoff.                             |

---

## 4. Recommended Fixes

1. **Server Components pass:** Remove `"use client"` from **static** pages (`privacy`, `terms`, and any page with no hooks/browser APIs); extract interactive bits into `*-client.tsx` children.
2. **Split monoliths:** Target **ops deployment** trio and **options-futures-panel** / **signup** for phased extractions (tabs → files, hooks → `use*-ts` modules).
3. **Expand `next/dynamic`:** Mirror `app/(ops)/devops/page.tsx` for trading terminal tabs, large dashboards, and ML training sections.
4. **Images:** Adopt `next/image` for logo and signup HTML export path; define sizes for CLS.
5. **Charts:** Replace `import * as RechartsPrimitive` with **named** imports or lazy-load chart wrapper at route/widget boundary.
6. **Memo strategy:** Introduce `memo` for **table rows**, **widget chrome**, and **list items** only after profiling; pair with stable callbacks from parents.
7. **Effects:** Replace multi-effect polling blocks with React Query `refetchInterval` where applicable; reduce `eslint-disable` surface.
8. **Type generation:** Ensure `api-generated.ts` is imported with **`type`-only** imports in client files and never re-exported from barrel files used by client entrypoints.

---

## 5. Remediation Priority

| Phase  | Focus                                                                                  | Effort (indicative) | Outcome                               |
| ------ | -------------------------------------------------------------------------------------- | ------------------- | ------------------------------------- |
| **P0** | Static public pages → Server Components; `next/image` for header logo                  | 0.5–1 d             | Smaller public bundle, better SEO/LCP |
| **P1** | `dynamic()` for top 10 heaviest trading/dashboard routes; chart import slimming        | 2–4 d               | Faster TTI on first load              |
| **P2** | Split **signup** + **ops deployment** files (>3k lines) into modules + lazy tabs       | 1–2 w               | Maintainability + incremental loading |
| **P3** | Systematic memo / React Query migration for terminal + health pages; strict hooks lint | 1–2 w               | Fewer wasted renders                  |

---

**Top risk summary:** Client-side **monolith pages** (many **1k–4k+** lines) and **near-universal `"use client"`** on routes concentrate JS execution and limit Server Component streaming, while **minimal** `next/dynamic` and **zero** `next/image` usage leave bundle and media optimization on the table.
