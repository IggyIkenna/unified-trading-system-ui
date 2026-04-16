# G — Navigation, Shell & Filter Propagation Audit

**Date:** 2026-03-28  
**Scope:** `app/(platform)/`, `components/shell/`, `components/platform/`, `lib/lifecycle-mapping.ts`, `lib/stores/global-scope-store.ts`, `lib/stores/workspace-store.ts`, `lib/config/services/trading-nav-paths.config.ts`, trading/observe/manage/report data contexts and related hooks  
**Previous audit:** First audit

## 1. Current State

- **Lifecycle rail:** `LifecycleNav` derives `currentStage` from `getRouteMapping(pathname)?.primaryStage` (`components/shell/lifecycle-nav.tsx` ~161–162). Stage **execute** is removed from the rail (`hiddenStages` includes `"execute"`, ~133–134).
- **Row-2 tabs:** `ServiceTabs` and `TradingVerticalNav` share the same active rule: `matchPrefix || href`, with optional `exact` to avoid parent/child double-highlight (`components/shell/service-tabs.tsx` ~149–153; `components/shell/trading-vertical-nav.tsx` ~140–147, ~159–163). `TradingVerticalNav` adds family collapse, custom panels, and delete flow.
- **Breadcrumbs:** `Breadcrumbs` uses `getRouteMapping`, service segment labels, ML hub and deep-trading special cases (`components/shell/breadcrumbs.tsx` ~29–112). `GlobalScopeFilters` renders in the breadcrumb row (~116).
- **Global scope:** `global-scope-store` persists `organizationIds`, `clientIds`, `strategyIds`, `underlyingIds`, `mode`, `asOfDatetime` (`lib/stores/global-scope-store.ts` ~11–41). `GlobalScopeFilters` and `LiveAsOfToggle` read/write this store. `scope-helpers.ts` exposes `getStrategyIdsForScope` for cascading org → client → strategy.
- **Workspaces:** `workspace-store` persists per-`tab` workspaces, snapshots, undo, custom panels; `WorkspaceToolbar` exposes selector, add widget, edit lock, undo, snapshots, import/export JSON (`components/widgets/workspace-toolbar.tsx`). **Used only from** `app/(platform)/services/trading/layout.tsx` (~296).

## 2. Findings

### 2.1 Route mapping vs service tab `href`s (`getRouteMapping`)

| Tab set           | Tab label                                                   | href                                   | routeMappings / fallback                                                  | Lifecycle stage                             | Bug?                                    |
| ----------------- | ----------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------- |
| DATA_TABS         | (all 8)                                                     | `/services/data/...`                   | Synthetic via `DATA_SERVICE_HUB` branch (`lifecycle-mapping.ts` ~657–673) | acquire                                     | No                                      |
| BUILD_TABS        | Overview                                                    | `/services/research/overview`          | Exact                                                                     | build                                       | No                                      |
| BUILD_TABS        | Features                                                    | `/services/research/features`          | None (no exact/prefix/fallback)                                           | —                                           | Yes — no lifecycle highlight            |
| BUILD_TABS        | Feature ETL                                                 | `/services/research/feature-etl`       | None                                                                      | —                                           | Yes                                     |
| BUILD_TABS        | Models                                                      | `/services/research/ml`                | Exact                                                                     | build                                       | No                                      |
| BUILD_TABS        | Strategies                                                  | `/services/research/strategies`        | None                                                                      | —                                           | Yes                                     |
| BUILD_TABS        | Execution                                                   | `/services/research/execution`         | None                                                                      | —                                           | Yes                                     |
| BUILD_TABS        | Quant Workspace                                             | `/services/research/quant`             | None                                                                      | —                                           | Yes                                     |
| ML_SUB_TABS       | (each)                                                      | `/services/research/ml/...`            | Exact or prefix                                                           | build / observe / promote / manage per path | No (per mapped child)                   |
| STRATEGY_SUB_TABS | Overview                                                    | `/services/research/strategy/overview` | None                                                                      | —                                           | Yes                                     |
| STRATEGY_SUB_TABS | Backtests–Handoff                                           | `/services/research/strategy/...`      | Exact entries                                                             | build / promote                             | No                                      |
| TRADING_TABS      | (all)                                                       | `/services/trading/...`                | Trading base fallback (`~695–704`)                                        | run                                         | No                                      |
| OBSERVE_TABS      | Risk–Health                                                 | listed hrefs                           | Exact                                                                     | observe                                     | No                                      |
| OBSERVE_TABS      | Scenarios                                                   | `/services/observe/scenarios`          | Observe base fallback                                                     | observe                                     | No (label generic “Observe” in mapping) |
| MANAGE_TABS       | (all)                                                       | `/services/manage/...`                 | Exact                                                                     | manage                                      | No                                      |
| REPORTS_TABS      | P&L / Executive                                             | overview / executive                   | Exact                                                                     | report                                      | No                                      |
| REPORTS_TABS      | IBOR, NAV, Fund Ops, Settlement, Reconciliation, Regulatory | `/services/reports/*`                  | None                                                                      | —                                           | Yes                                     |
| ADMIN_TABS        | Users, requests, onboard, orgs                              | `/admin/...`                           | Prefix `/admin`                                                           | manage                                      | No                                      |
| ADMIN_TABS        | Services, Jobs                                              | `/ops/...`                             | Prefix `/ops`                                                             | observe                                     | Debatable — ops under “Observe” stage   |
| ADMIN_TABS        | Deployment & Readiness                                      | `/devops`                              | None                                                                      | —                                           | Yes                                     |
| ADMIN_TABS        | Approvals                                                   | `/approvals`                           | Exact                                                                     | manage                                      | No                                      |
| ADMIN_TABS        | Config                                                      | `/config`                              | Exact                                                                     | promote                                     | No                                      |
| ADMIN_TABS        | Data Admin                                                  | `/admin/data`                          | Prefix `/admin`                                                           | manage                                      | No                                      |
| EXECUTE_TABS      | Analytics–Handoff                                           | `/services/execution/...`              | **First** exact row in array                                              | **Conflicts** — see below                   | **Yes**                                 |

**Duplicate paths in `routeMappings`:** The same paths appear under the Build block and again under Execute (e.g. `/services/execution/algos` at `lifecycle-mapping.ts` ~291 and ~439; venues ~298 & ~446; tca ~306 & ~453; benchmarks ~313 & ~460). `getRouteMapping` uses `routeMappings.find` for exact match (~654), so **the first occurrence wins** — these URLs resolve to **`primaryStage: "build"`** (and mixed secondary lanes), not execute. Lifecycle rail then highlights **Research** while the user is in **Execution** service tabs.

**Hidden execute stage:** Even when a route maps to `primaryStage: "execute"`, `LifecycleNav` filters out the execute stage, so **no** lifecycle pill matches (`lifecycle-nav.tsx` ~133–138, ~197–199).

| Severity | Issue                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| Critical | Duplicate `/services/execution/*` rows + `find` order → wrong `primaryStage` (build) for execution URLs          |
| High     | Multiple Build/Reports/Admin hrefs have **no** mapping → `getRouteMapping` undefined → no lifecycle active state |
| High     | Execute stage hidden while routes still use `execute` → inconsistent shell semantics                             |
| Medium   | `/ops/*` mapped as `observe` — may confuse “Manage/Ops” mental model                                             |

### 2.2 Active tab logic (ServiceTabs vs TradingVerticalNav)

| Check                             | Result                                                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same `isActive` formula?          | **Yes** — duplicated in both files (should be a shared helper, e.g. `isTabActive(pathname, tab)`).                                                                                                                                 |
| `familyGroup` + `exact` on index? | DeFi, Sports, Options, Predictions index tabs use **`exact: true`** (`service-tabs.tsx` ~315, ~339, ~363, ~388). SAFT uses parent `Accounts` with `exact: true` (~303–304) so `/accounts/saft` does not double-highlight Accounts. |
| `isFamilyActive` after `exact`?   | **Correct** — same predicate as per-tab active; family stays expanded when any child matches (~141–147).                                                                                                                           |

### 2.3 Breadcrumb accuracy

| Topic                        | Finding                                                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wrong lifecycle in crumb row | Breadcrumbs do **not** show lifecycle stage text; they show Services → service name → leaf. Mis-`primaryStage` affects **lifecycle rail**, not crumb text. |
| “Observe” vs Trading         | Trading routes use trading fallback (`primaryStage: run`) — no false Observe for `/services/trading/*`.                                                    |
| Research ML nested           | Extra hub crumb for `research/ml/*` depth ≥ 3 (`breadcrumbs.tsx` ~44–88).                                                                                  |
| Trading deep routes          | Intermediate crumbs from `getTradingIntermediateBreadcrumbItems` (`trading-nav-paths.config.ts` ~68–84).                                                   |
| Reports sub-routes           | Unmapped paths still render a leaf via `mapping?.label \|\| formatLabel(pageName)` — labels may be raw segment names vs product copy.                      |

### 2.4 Global scope filter propagation

**Store fields:** `organizationIds`, `clientIds`, `strategyIds`, `underlyingIds`, `mode`, `asOfDatetime` (`global-scope-store.ts`). **`underlyingIds` is not wired in `GlobalScopeFilters` UI** (no setter exposed in that component).

| Page / hook / context                                                                                                                                              | Uses `useGlobalScope`? | Filters by org?                                                   | Filters by client? | Filters by strategy? | Gap?                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------- | ------------------ | -------------------- | --------------------------------------------------------------- |
| `GlobalScopeFilters`                                                                                                                                               | Yes (read/write)       | Yes (UI)                                                          | Yes (UI)           | Yes (UI)             | —                                                               |
| `LiveAsOfToggle`                                                                                                                                                   | Yes                    | No                                                                | No                 | No                   | —                                                               |
| `Breadcrumbs` (embeds filters)                                                                                                                                     | Via child              | —                                                                 | —                  | —                    | —                                                               |
| `app/.../trading/layout.tsx`                                                                                                                                       | Yes                    | —                                                                 | —                  | —                    | Passes scope into shell                                         |
| `app/.../trading/overview/page.tsx`                                                                                                                                | Yes                    | —                                                                 | —                  | —                    | Uses scope for widgets                                          |
| `app/.../trading/terminal/page.tsx`                                                                                                                                | Yes                    | —                                                                 | —                  | —                    | Same                                                            |
| `app/.../trading/risk/page.tsx`                                                                                                                                    | Yes                    | —                                                                 | —                  | —                    | Same                                                            |
| `hooks/api/use-strategies.ts`                                                                                                                                      | Yes                    | **Partial** — mostly `scope.mode` in query keys / `withMode` URLs | Same               | Same                 | Org/client/strategy IDs not consistently in API keys            |
| `hooks/api/use-ml-models.ts`                                                                                                                                       | Yes                    | Same                                                              | Same               | Same                 | Same                                                            |
| `positions-data-context.tsx`                                                                                                                                       | Yes                    | Via `getStrategyIdsForScope` cascade                              | Via cascade        | Yes                  | —                                                               |
| Other `*-data-context.tsx` under `components/widgets/` (orders, pnl, alerts, defi, book, bundles, markets, strategies, options, sports, predictions, instructions) | Yes (pattern)          | Mostly strategy scoping helpers where used                        | Same               | Same                 | Verify each page actually mounts context                        |
| `components/platform/research-family-shell.tsx`                                                                                                                    | Yes                    | —                                                                 | —                  | —                    | Shell-level                                                     |
| `components/shell/command-palette.tsx`                                                                                                                             | Yes                    | —                                                                 | —                  | —                    | Navigation helper                                               |
| `components/widgets/overview/*` (kpi, pnl chart, scope summary)                                                                                                    | Yes                    | Mixed                                                             | Mixed              | Mixed                | Scope summary reflects store; charts may ignore org             |
| **Typical platform pages** (data, research static routes, manage, reports, promote)                                                                                | **No** in page files   | —                                                                 | —                  | —                    | **Gap** — global selectors do not affect most non-trading pages |

**Gap list (should respect global scope but largely do not today):**

- Research **Build** tabs without `getRouteMapping` (features, feature-etl, strategies hub, execution, quant) and any pages that list org/client/strategy data without reading scope.
- **Data** service pages (org/venue scoped metrics).
- **Manage** (clients, mandates, fees) — selectors redundant if store ignored.
- **Reports** extended tabs (IBOR, NAV, settlement, etc.).
- **Promote** pipeline and **Observe** scenarios — no store consumption in page layer unless via future hooks.

### 2.5 Workspace state completeness

| Question                                  | Finding                                                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| CRUD + import/export on all widget grids? | **No** — `WorkspaceToolbar` only mounted in `services/trading/layout.tsx` for trading widget tabs.                                   |
| Per-tab isolation?                        | **Yes** — store keys by `tab` string (`workspace-store.ts` `workspaces`, `activeWorkspaceId`).                                       |
| Delete custom panels?                     | **Yes** in `TradingVerticalNav` (X + confirm when active) (~339–353, ~435–458).                                                      |
| Export includes filters?                  | **No** — `exportWorkspace` serializes `{ version: 1, workspace }` only (`workspace-store.ts` ~283–286); global scope store separate. |

## 3. Worst Offenders

| Rank | File / area                                                      | Issue                                                                                                      |
| ---- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1    | `lib/lifecycle-mapping.ts`                                       | Duplicate `/services/execution/*` paths; first-hit `find` → wrong stage; missing routes for many tab hrefs |
| 2    | `components/shell/lifecycle-nav.tsx`                             | Hides `execute` while routes still encode `execute`                                                        |
| 3    | `components/shell/service-tabs.tsx` + `trading-vertical-nav.tsx` | Duplicated `isActive` logic (~12 lines × 2)                                                                |
| 4    | `hooks/api/use-strategies.ts`, `use-ml-models.ts`                | `useGlobalScope` used for **mode**; org/client/strategy not driving query keys uniformly                   |
| 5    | `components/platform/global-scope-filters.tsx`                   | No UI for `underlyingIds` despite store field                                                              |
| 6    | `app/(platform)/services/trading/layout.tsx`                     | Only surface with full workspace toolbar — other grid UIs lack parity                                      |

## 4. Recommended Fixes

1. **Deduplicate `routeMappings`:** Keep a **single** canonical row per path. Split “research build” vs “execution analytics” URLs must not reuse the same `path` string with different stages; remove the Build-block duplicates for `/services/execution/*` or merge into one stage with explicit decision.
2. **Reorder or key by path map:** Replace `find` on a list with a `Map` or sort + unique-by-path so duplicates cannot silently win.
3. **Add mappings or a `/services/research` prefix fallback** for: `features`, `feature-etl`, `strategies`, `execution`, `quant`, `strategy/overview`, and **reports** children (`ibor`, `nav`, `fund-operations`, `settlement`, `reconciliation`, `regulatory`).
4. **Lifecycle + Execute:** Either show Execute in the rail for `/services/execution/*` **or** reclassify those routes to `run` / `observe` consistently and update labels.
5. **Extract** `function isServiceTabActive(pathname: string, tab: ServiceTab): boolean`\*\* to `@/lib/nav-utils` (or similar) and use from `ServiceTabs` and `TradingVerticalNav`.
6. **Global scope:** Add `organizationIds` / `clientIds` / `strategyIds` to React Query keys and API params where data is scoped; wire `underlyingIds` in UI or remove from store until needed.
7. **Workspace:** If other services adopt widget grids, mount `WorkspaceToolbar` + `ensureTab` from those layouts; optionally embed global scope snapshot in export JSON for reproducibility.

## 5. Remediation Priority

| Phase | Focus                                                                           | Effort   |
| ----- | ------------------------------------------------------------------------------- | -------- |
| P0    | Fix duplicate `/services/execution/*` mapping + clarify execute vs build        | ~0.5–1 d |
| P1    | Add `getRouteMapping` coverage for all `service-tabs` hrefs; `/devops`          | ~1 d     |
| P2    | Extract shared tab active helper; align breadcrumbs labels for reports children | ~0.5 d   |
| P3    | Propagate global scope into research/data/manage/report data hooks and pages    | ~2–4 d   |
| P4    | Workspace toolbar rollout + export includes scope (optional)                    | ~1–2 d   |

---

**Count summary:** 6 `OBSERVE_TABS` + 8 `DATA` + 7 `BUILD` + 4 `ML_SUB` + 7 `STRATEGY` + 18 `TRADING` + 5 `MANAGE` + 8 `REPORTS` + 9 `ADMIN` + 7 `EXECUTE` ≈ **79** tab rows audited; **≥15** hrefs lack exact/prefix mapping or are affected by duplicate execution paths.
