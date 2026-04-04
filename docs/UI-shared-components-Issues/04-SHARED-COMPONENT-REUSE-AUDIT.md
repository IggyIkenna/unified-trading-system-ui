# D — Shared Component Reuse & Centralization Audit

**Date:** 2026-03-28  
**Scope:** `app/`, `components/`, `hooks/`, `lib/` (TypeScript/TSX; `node_modules` excluded)  
**Previous audit:** First structured Module D pass (file was removed from tree; this run re-establishes baseline)

**Update 2026-03-29 (Task 13):** Cross-domain shared UI now lives under `components/shared/` (including `StatusBadge`, `PageHeader`, `FilterBar`, `KpiStrip`, `DataTable`, `DataTableWidget`, `FilterBarWidget`, `Spinner`, `EmptyState`, `ErrorBoundary`, `ApiError`, `ExportDropdown`). The `components/widgets/shared/` directory was removed; use `@/components/shared` or `@/components/shared/<file>`. Counts and “gap” rows below are a **2026-03-28 snapshot** — re-run Module D for current numbers.

## 1. Current State

- **Design tokens / shell:** Global styling SSOT remains `app/globals.css`; platform chrome is `UnifiedShell` / service layouts with `ErrorBoundary` on most service `layout.tsx` files.
- **Shared primitives in active use:** `ServiceTabs` + tab constants (`components/shell/service-tabs.tsx`), `TradingVerticalNav` (trading layout only), `FilterBar` + `FilterBarWidget` (`components/shared/`), `KpiStrip` (`components/shared/kpi-strip.tsx`) consumed by domain KPI widgets, `MetricCard` (`components/shared/metric-card.tsx`), `DataTable` / `DataTableWidget` (`components/shared/`), `StatusBadge` (`components/shared/status-badge.tsx`), `Skeleton`, Sonner/toast patterns, `Breadcrumbs` in shell.
- **Barrel:** `components/shared/index.ts` exports shared UI including `KpiStrip`, `FilterBarWidget`, `DataTableWidget`, `CollapsibleSection`, plus other cross-domain components.

## 2. Findings

### Part 1 — Adoption vs ad-hoc (counts are repo-wide under scope)

| Pattern                              | Shared location                        | Uses shared (files)                                                           | Rolls own / gap                                                                                      | Severity  | Use instead / action                                                            |
| ------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------- |
| Page header (title + desc + actions) | `components/shared/page-header.tsx`    | (re-audit)                                                                    | **~89** `<h1>` occurrences across `app/` (138 `page.tsx` files); only niche `strategies-page-header` | 🟡 High   | Prefer `PageHeader`; migrate remaining ad-hoc `<h1>` stacks when touching pages |
| Metric / KPI card                    | `components/shared/metric-card.tsx`    | **10** consumers (promote, research execution, etc.)                          | Many pages/widgets still use raw `Card` + typography                                                 | 🟢 Medium | Prefer `MetricCard` or `KpiStrip` for numeric summaries                         |
| KPI strip (row)                      | `components/shared/kpi-strip.tsx`      | **13** widgets import `KpiStrip` (via `@/components/shared` or per-file path) | **0** duplicate strip primitives found in audited `*-kpi*` widgets                                   | ✅        | Keep; document as mandatory for new KPI widgets                                 |
| Status badge                         | `components/shared/status-badge.tsx`   | **26** files reference `StatusBadge`                                          | **~23** files with ad-hoc badge/pill styling (heuristic: `Badge` + status-ish layout)                | 🟢 Medium | Route new status UI through `StatusBadge`                                       |
| Empty state                          | `components/shared/empty-state.tsx`    | **4** pages (strategy backtests/results/compare, ML registry)                 | **10** files with “No data” / “No results” strings (not all pages)                                   | 🟡 High   | Replace inline copy with `EmptyState` + consistent CTA                          |
| Loading skeleton                     | `components/ui/skeleton.tsx`           | **30** files import/use `<Skeleton>`                                          | Per-page compositions (expected)                                                                     | ✅        | Optional: page-level skeleton template                                          |
| Data table                           | `components/shared/data-table.tsx`     | **9** imports                                                                 | **43** files with `<table`                                                                           | 🟡 High   | Prefer `DataTable` or `DataTableWidget` when tabular data is standard           |
| Filter bar                           | `components/shared/filter-bar.tsx`     | **11** imports; **10** files name `FilterBar`                                 | Per-page one-off filters outside this set                                                            | 🟢 Medium | Extend `FilterBar` / `FilterBarWidget` before new filter UIs                    |
| Toolbar / controls row               | _No shared primitive_                  | **1** `options-control-bar-widget.tsx` matches `*control*`                    | Inline toolbars in pages/widgets                                                                     | 🟢 Medium | Add `components/widgets/primitives/toolbar-row.tsx` (see Part 3)                |
| Master-detail layout                 | _No shared primitive_                  | **1** clear `ResizablePanel` usage (`components/trading/sports/arb-tab.tsx`)  | Possible split layouts embedded in domain components                                                 | 🟢 Medium | Extract `master-detail-layout` when a second consumer appears                   |
| Error boundary                       | `components/shared/error-boundary.tsx` | **8** service layouts + `research-family-shell.tsx`                           | No `app/**/error.tsx` route handlers found                                                           | 🟢 Medium | Consider Next `error.tsx` per segment for consistent error UI                   |
| Confirmation dialog                  | `components/ui/alert-dialog.tsx`       | **2** (`trading-vertical-nav.tsx`, `risk-strategy-heatmap-widget.tsx`)        | **28** files use `components/ui/dialog` (general modals)                                             | ✅        | Keep `AlertDialog` for destructive confirm; `Dialog` for general                |
| Toast / notification                 | `components/ui/sonner.tsx` + hooks     | **27** files                                                                  | _Low duplication_                                                                                    | ✅        | Continue central pattern                                                        |
| Tab navigation                       | `components/shell/service-tabs.tsx`    | **13** files import / use `ServiceTabs` or tab exports                        | **~49** files use `components/ui/tabs` (in-page tabs — legitimate)                                   | ✅        | Distinguish shell row-2 tabs vs in-content tabs                                 |
| Breadcrumb                           | `components/shell/breadcrumbs.tsx`     | **3** imports of shell `Breadcrumbs`                                          | **8** files mention `Breadcrumb` (includes shadcn `breadcrumb.tsx`)                                  | 🟢 Medium | Prefer shell `Breadcrumbs` for app chrome; avoid duplicate trail UIs            |
| Page wrapper (padding / max-width)   | _Implicit via layouts_                 | **68** files use `max-w-` / `p-page` / related                                | Inconsistent per page                                                                                | 🟢 Medium | Optional `PageSection` with tokenized padding                                   |
| Quick stat card                      | _Same as metric / KPI_                 | See `MetricCard` / `KpiStrip`                                                 | Trading sidebars repeat `Card` patterns                                                              | 🟢 Medium | Reuse `MetricCard` in side rails                                                |

### Part 2 — Duplication & dead weight

| Finding                                                                                 | Evidence                                                                                                                                                                                                        | Severity                                                     |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Duplicate **names** for “filter bar”                                                    | `components/shared/filter-bar.tsx` exports `FilterBar`; `components/shared/filter-bar-widget.tsx` wraps it (compositional, not a duplicate implementation)                                                      | ✅ OK                                                        |
| Duplicate **EmptyState** export                                                         | `components/trading/sports/shared.tsx` exports `EmptyState` in addition to `components/shared/empty-state.tsx`                                                                                                  | 🟡 High — consolidate on `components/shared/empty-state.tsx` |
| **`components/ui/*` never imported** (heuristic: zero `@/components/ui/<file>` imports) | **~28** files flagged (e.g. `carousel`, `drawer`, `chart`, `pagination`, `sidebar`; `empty.tsx` removed 2026-03-29; `breadcrumb.tsx` vs shell)                                                                  | 🟡 High — prune or wire; risk of drift and bundle noise      |
| **`components/trading/` candidates for `shared/`**                                      | **110** exported symbols under `components/trading/`; many are domain-specific (sports/options). True generics: small presentational pieces (e.g. shared sports `EmptyState`) should move to `shared/` or `ui/` | 🟢 Medium — case-by-case PRs                                 |

**Near-identical layout (3+ files):** KPI row pattern is already centralized via `KpiStrip`. Remaining repetition is **page headers** (`<h1>` + siblings) and **raw `<table>`** blocks.

### Part 3 — Widget primitive patterns

| Primitive              | Implementations (count / notes)                                                               | Centralize to                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Metric strip           | **14** widget files tied to KPI/metric naming; **13** use `KpiStrip` from `components/shared` | ✅ `kpi-strip.tsx` (done)                                                            |
| Controls / toolbar row | **1** `options-control-bar-widget.tsx`; other toolbars inline                                 | `components/widgets/primitives/toolbar-row.tsx`                                      |
| Master-detail split    | **1** `arb-tab.tsx` (`ResizablePanel`); thin spread elsewhere                                 | `components/widgets/primitives/master-detail-layout.tsx` when second consumer exists |
| Data table shell       | **6** `*-table-widget.tsx` files + `components/shared/data-table-widget.tsx`                  | Optional `components/ui/data-table-shell.tsx` if wrappers diverge                    |

### Part 4 — `ServiceTabs` vs `TradingVerticalNav` active-route logic (line-level)

**Source A — `components/shell/service-tabs.tsx`**

- **Lines 150–153** (inside `tabs.map`): pathname match for a single tab:

```ts
const matchPath = tab.matchPrefix || tab.href;
const isActive = tab.exact
  ? pathname === tab.href || pathname === `${tab.href}/`
  : pathname === tab.href || pathname.startsWith(matchPath + "/");
```

**Source B — `components/shell/trading-vertical-nav.tsx`**

- **Lines 141–147** — `isFamilyActive`: **identical** predicate inside `familyTabs.some((tab) => { ... })`:

```ts
const matchPath = tab.matchPrefix || tab.href;
return tab.exact
  ? pathname === tab.href || pathname === `${tab.href}/`
  : pathname === tab.href || pathname.startsWith(matchPath + "/");
```

- **Lines 160–163** — `renderTabItem`: **identical** to ServiceTabs (same `matchPath` + `isActive` ternary).

**Verdict:** Logic is **byte-for-byte duplicated** in three places (ServiceTabs once; VerticalNav twice). **Recommendation:** extract e.g. `isServiceTabActive(pathname: string, tab: ServiceTab): boolean` to `lib/utils/nav-helpers.ts` (or `lib/nav/service-tab-active.ts`) and import from both components. Also reuse for custom panel active check (**lines 313–314**) which duplicates the **non-exact** branch only (`pathname === panelHref || pathname.startsWith(panelHref + "/")`).

### Top 5 “worst offender” pages (ad-hoc headers / density)

| Rank | File                                              | Issue                                                                  |
| ---- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| 1    | `app/(public)/signup/page.tsx`                    | **6** `<h1>`; inline HTML template string; multiple competing headings |
| 2    | `app/(public)/demo/preview/page.tsx`              | **4** `<h1>` in one file                                               |
| 3    | `app/(public)/contact/page.tsx`                   | **2** `<h1>`                                                           |
| 4    | `app/(platform)/settings/api-keys/page.tsx`       | **2** `<h1>`                                                           |
| 5    | `app/(platform)/services/manage/clients/page.tsx` | **2** `<h1>`                                                           |

## 3. Worst Offenders (consolidated)

1. **Unshared page headers** — systemic `<h1>` / layout variance across **~89** occurrences.
2. **Raw `<table>`** — **43** files vs **9** `data-table` imports.
3. **`empty-state` underuse** — **4** adopters vs broader “No data” copy.
4. **Duplicate `EmptyState`** — `components/trading/sports/shared.tsx` vs `components/shared/empty-state.tsx`.
5. **Unused shadcn-style modules** — **~28** `components/ui/*.tsx` files with zero direct imports (cleanup or integrate).
6. **Nav active logic duplication** — `service-tabs.tsx` + `trading-vertical-nav.tsx` (Part 4).

## 4. Recommended Fixes

1. **Extract** `isServiceTabActive(pathname, tab)` (+ optional `isPathActive(path, href, { exact })` for custom panels) to `lib/utils/nav-helpers.ts`; replace **ServiceTabs** lines 150–153 and **TradingVerticalNav** lines 141–147 and 160–163 (and align panel logic with helper).
2. **Introduce** `PageHeader` (title, description, actions) and migrate **public** multi-`h1` pages first (`signup`, `demo/preview`).
3. **Migrate** “No data / No results” surfaces to `components/shared/empty-state.tsx`; **delete** sports `EmptyState` after re-export shim removal (no long-term dual exports per project rules).
4. **Audit** `<table>` occurrences; replace with `DataTable` / `DataTableWidget` where schema fits.
5. **Prune or adopt** unused `components/ui/*` primitives (document intentional keepers).
6. **Add** `toolbar-row` primitive when a second non-options toolbar clone appears.

## 5. Remediation Priority

| Phase  | Work                                                            | Effort         | Outcome                                                                                   |
| ------ | --------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------- |
| **P0** | Nav helper extraction + unit tests for `isServiceTabActive`     | ~0.5–1 dev-day | Single source for active tab state; fewer regressions when `matchPrefix` / `exact` change |
| **P1** | `PageHeader` + migrate top 10 pages by `<h1>` count             | ~1–2 dev-days  | Visual and semantic consistency                                                           |
| **P1** | Empty state consolidation (sports + inline strings)             | ~1 dev-day     | Consistent empty UX                                                                       |
| **P2** | Table migration campaign (prioritize trading + research tables) | ~2–4 dev-days  | Less one-off table CSS/a11y drift                                                         |
| **P3** | `components/ui` import audit (delete or wire)                   | ~1 dev-day     | Smaller mental map, less dead code                                                        |

---

**Evidence standard:** Paths and counts from `rg` / `find` on 2026-03-28 against `unified-trading-system-ui` source trees (`app`, `components`, `hooks`, `lib`).
