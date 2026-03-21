# Phase 2b: Build Tab — UX & Entitlement Audit

**Generated:** 2026-03-21 | **Source:** Phase 2b Audit

---

## UX States Matrix

### Loading States

| # | Page | Loading Pattern | State |
| - | ---- | -------------- | ----- |
| 1 | overview | None — renders immediately | ✗ Missing |
| 2 | ml/features | None | ✗ Missing |
| 3 | ml (models) | None | ✗ Missing |
| 4 | strategy/backtests | None | ✗ Missing |
| 5 | strategy/compare | None | ✗ Missing |
| 6 | ml/validation | None | ✗ Missing |
| 7 | execution/algos | None | ✗ Missing |
| 8 | ml/overview | None | ✗ Missing |
| 9 | ml/experiments | None | ✗ Missing |
| 10 | ml/experiments/[id] | None | ✗ Missing |
| 11 | ml/training | None | ✗ Missing |
| 12 | ml/registry | None | ✗ Missing |
| 13 | ml/monitoring | None | ✗ Missing |
| 14 | ml/deploy | None | ✗ Missing |
| 15 | ml/governance | None | ✗ Missing |
| 16 | ml/config | None | ✗ Missing |
| 17 | strategy/overview | None | ✗ Missing |
| 18 | strategy/results | None | ✗ Missing |
| 19 | strategy/heatmap | None | ✗ Missing |
| 20 | execution/venues | None | ✗ Missing |
| 21 | execution/benchmarks | None | ✗ Missing |
| 22 | quant | None | ✗ Missing |

**Root cause:** All pages use synchronous mock data (direct imports or inline constants). No async fetching occurs, so loading states were never needed. When migrating to React Query hooks, every page will need loading state handling.

**Recommended patterns:**

```tsx
// Skeleton pattern (preferred for tables/grids)
if (isLoading) return <TableSkeleton rows={10} columns={6} />

// Spinner pattern (preferred for detail views)
if (isLoading) return (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="size-8 animate-spin text-muted-foreground" />
  </div>
)
```

---

### Error States

| # | Page | Error Pattern | State |
| - | ---- | ------------- | ----- |
| 1-22 | All pages | None | ✗ Missing |

**Note:** Some pages have CSS classes like `status-error` or data fields like `errorRate` / `job.error`, but these are for displaying error-status data in the UI, not for handling fetch/render errors.

**Recommended pattern:**

```tsx
// Layout-level error boundary
// app/(platform)/service/research/layout.tsx
<ErrorBoundary fallback={<ResearchErrorFallback />}>
  <ServiceTabs ... />
  {children}
</ErrorBoundary>

// Page-level error state
if (error) return (
  <Alert variant="destructive">
    <AlertTitle>Failed to load data</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
    <Button onClick={refetch} size="sm">Retry</Button>
  </Alert>
)
```

---

### Empty States

| # | Page | Empty Pattern | State |
| - | ---- | ------------- | ----- |
| 1-22 | All pages | None | ✗ Missing |

**Recommended pages to prioritize empty states:**

| Page | Empty Context | Suggested Message |
| ---- | ------------- | ----------------- |
| ml/experiments | No experiments yet | "Start your first experiment to see results here" |
| ml/training | No training runs | "Launch a training run from the Experiments page" |
| ml/registry | No registered models | "Promote a trained model to see it in the registry" |
| strategy/backtests | No backtests | "Configure and run your first backtest" |
| ml/features | No features defined | "Connect a data source to populate features" |

---

## Responsive Behavior

### Tab Pages (7)

| Tab Page | Grid Layout | Responsive Classes | Mobile Safe? |
| -------- | ----------- | ------------------ | ------------ |
| Research Hub | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (workflow), `grid-cols-2 md:grid-cols-4` (stats) | ✓ Full responsive | ✓ Yes |
| Features | Fixed grids, table layout | ✗ None | ✗ Table overflows |
| ML Models | `grid-cols-3`, `grid-cols-4` fixed | ✗ None | ✗ Grid overflows |
| Strategies (backtests) | Table with `sm:max-w-lg` dialog | Minimal | ✗ Table overflows |
| Backtests (compare) | `grid-cols-2` fixed | ✗ None | ✗ Compare cards overflow |
| Signals (validation) | Multiple tables and charts | ✗ None | ✗ Multiple overflows |
| Execution Research | Table layout, comparison grid | ✗ None | ✗ Table overflows |

### Orphan Pages (15)

| Page | Responsive Classes | Mobile Safe? |
| ---- | ------------------ | ------------ |
| ml/overview | `grid-cols-6`, `grid-cols-3`, `grid-cols-2`, `grid-cols-4` — all fixed | ✗ |
| ml/experiments | Fixed grid | ✗ |
| ml/experiments/[id] | `grid-cols-6`, `grid-cols-2`, `grid-cols-3` — fixed | ✗ |
| ml/training | `grid-cols-5`, `grid-cols-3`, `grid-cols-4` — fixed | ✗ |
| ml/registry | Fixed grids | ✗ |
| ml/monitoring | Fixed grids | ✗ |
| ml/deploy | Fixed grids | ✗ |
| ml/governance | Fixed grids | ✗ |
| ml/config | Fixed grids | ✗ |
| strategy/overview | `sm:grid-cols-2`, `lg:grid-cols-4`, `lg:grid-cols-3` | ✓ |
| strategy/results | `grid-cols-6`, `grid-cols-4` — fixed | ✗ |
| strategy/heatmap | Fixed grids | ✗ |
| execution/venues | Fixed grids | ✗ |
| execution/benchmarks | Fixed grids | ✗ |
| quant | Depends on QuantDashboard | Unknown |

**Summary:** 2 of 22 pages have proper responsive support. 20 pages will overflow on mobile/tablet.

---

## Entitlement Gating Audit

### Layer Analysis Per Page

| # | Page | useAuth() Call | hasEntitlement Check | Tab Entitlement | Nav isItemAccessible |
| - | ---- | -------------- | -------------------- | --------------- | -------------------- |
| 1 | overview | ✓ | ml-full, strategy-full, execution-basic/full | — (no tab gate) | strategy-full OR ml-full |
| 2 | ml/features | ✗ | ✗ | ml-full | strategy-full OR ml-full |
| 3 | ml (models) | ✗ | ✗ | ml-full | strategy-full OR ml-full |
| 4 | strategy/backtests | ✗ | ✗ | strategy-full | strategy-full OR ml-full |
| 5 | strategy/compare | ✗ | ✗ | strategy-full | strategy-full OR ml-full |
| 6 | ml/validation | ✗ | ✗ | ml-full | strategy-full OR ml-full |
| 7 | execution/algos | ✗ | ✗ | execution-basic | strategy-full OR ml-full |
| 8-22 | All orphans | ✗ | ✗ | — (no tab) | strategy-full OR ml-full |

### Entitlement Gap Scenarios

#### Scenario 1: User with `execution-basic` only

- **Nav:** Blocks `/service/research/*` (requires strategy-full OR ml-full) — user cannot navigate to any research page
- **Tab:** Execution Research tab would be unlocked (requires `execution-basic`)
- **URL:** Direct navigation to `/service/research/execution/algos` works — page renders, tab shows unlocked
- **Verdict:** Nav overly restrictive. User with legitimate execution entitlement is blocked from their research tab.

#### Scenario 2: User with `strategy-full` only (no ml-full)

- **Nav:** Allows `/service/research/*` (has strategy-full)
- **Tab:** Strategies ✓, Backtests ✓, Features ✗ (locked), ML Models ✗ (locked), Signals ✗ (locked)
- **Orphans:** All ML orphan pages accessible via URL (no page-level gate) but content assumes ML context
- **Verdict:** Correct tab behavior. Orphan pages lack entitlement gates — a strategy-only user can access ML governance, ML monitoring, etc. via URL.

#### Scenario 3: User with `data-basic` only

- **Nav:** Blocks all `/service/research/*`
- **URL:** All research pages accessible (no page-level middleware)
- **Tab:** Research Hub accessible (no gate), all other tabs locked
- **Orphans:** All orphan pages accessible via URL
- **Verdict:** Nav-only protection. No server-side or page-level enforcement.

### Recommendations

1. **Add page-level entitlement checks (P1):** Each research page should check entitlements and redirect or show an access-denied message if the user lacks the required entitlement. The tab-level check is cosmetic (hides the tab link); it doesn't prevent URL access.

2. **Fix isItemAccessible for execution-basic (P1):** The nav should allow `/service/research/execution/*` for users with `execution-basic`, not require strategy-full/ml-full.

3. **Add entitlement gates to orphan pages (P2):** ML orphan pages should check `ml-full`. Strategy orphans should check `strategy-full`. Execution orphans should check `execution-basic`.

---

## Live/As-Of Toggle

### Current State

- `LiveAsOfToggle` rendered in research layout right slot
- `LIVE_ASOF_VISIBLE.build = true` → toggle is visible
- No research page reads or reacts to the toggle state
- Toggle appears functional (renders) but has no data effect

### Integration Status

| Aspect | Status |
| ------ | ------ |
| Toggle renders | ✓ |
| Toggle is interactive | ✓ (state changes locally) |
| Pages read toggle state | ✗ |
| Data fetching respects toggle | ✗ |
| Different data for live vs as-of | ✗ |

**Recommendation:** When migrating to React Query hooks, add `mode` parameter to query keys so data refreshes when the toggle changes. The `ContextBar` component on strategy/compare and strategy/results already has a BATCH/LIVE selector — coordinate with the layout-level toggle to avoid duplicate controls.
