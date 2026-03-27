# 03 — Shared Component Reuse Audit

**Date:** 2026-03-27
**Scope:** `app/(platform)/`, `app/(ops)/`, `components/` in `unified-trading-system-ui`

---

## 1. Page Headers — No Shared Component

### Finding

There is **no** `PageHeader` component anywhere in the codebase. Every page creates its own heading section with `<h1>` + optional description + optional action buttons.

### Scale

- **33 files** in `app/(platform)/` contain `<h1>` tags
- **17 files** in `app/(ops)/` contain `<h1>` tags
- `settings/api-keys/page.tsx` has **2 separate** `<h1>` elements

### Inconsistency Examples

```
// reports/overview/page.tsx — typical pattern
<h1 className="text-2xl font-semibold">Reports Overview</h1>
<p className="text-sm text-muted-foreground mt-1">...</p>

// instruments/page.tsx — different size, different weight
<h1 className="text-lg font-bold tracking-tight">Instruments</h1>

// orders/page.tsx — yet another size
<h1 className="text-xl font-semibold">Orders</h1>
```

### Recommended Fix

Create `components/shared/page-header.tsx`:

```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode; // e.g. status badge next to title
}
```

**Effort:** 0.5 day to build + 2–3 days to migrate ~50 pages

---

## 2. Metric / KPI Cards — Two Implementations

### What Exists

| Component    | Location                               | Used By                                           |
| ------------ | -------------------------------------- | ------------------------------------------------- |
| `MetricCard` | `components/shared/metric-card.tsx`    | Promote tabs, research execution, some dashboards |
| `KpiTile`    | `components/trading/sports/shared.tsx` | Sports pages only                                 |

### Gap

`MetricCard` supports 5 tones (`data`, `grid`, `pipeline`, `panel`, `panelLg`) and 5 densities (`compact`, `default`, `pipeline`, `panel`, `panelSm`, `walkforward`). It's well-designed but **many pages still build ad-hoc stat cards** using raw `Card` + inline typography.

**Pages building their own stat cards (not using MetricCard):**

- `app/(platform)/services/trading/risk/page.tsx` — custom KPI grid
- `app/(platform)/services/trading/pnl/page.tsx` — inline stat blocks
- `app/(platform)/services/reports/overview/page.tsx` — custom summary cards
- `app/(platform)/services/data/instruments/page.tsx` — inline counts
- `app/(ops)/admin/data/page.tsx` — system stat cards
- Most dashboard components in `components/dashboards/`

### Recommended Fix

1. Alias `KpiTile` → `MetricCard` (or make `KpiTile` a thin wrapper)
2. Migrate ad-hoc stat cards in high-traffic pages to `MetricCard`
3. Consider adding a `MetricCard` variant for "inline" (no card border) use

**Effort:** 3–6 days for full migration

---

## 3. Tables — Two Valid Patterns, But Inconsistent Choice

### What Exists

| Component           | Purpose                                        | Location                       |
| ------------------- | ---------------------------------------------- | ------------------------------ |
| `DataTable`         | Column-driven data grid with sorting/filtering | `components/ui/data-table.tsx` |
| `Table` (primitive) | Basic HTML table wrapper                       | `components/ui/table.tsx`      |

### Usage

**`DataTable` used by:** settlement, orders, alerts, backtests, regulatory, reconciliation, mandates, compliance

**Raw `Table` used (should consider `DataTable`):**

- `reports/overview/page.tsx` — multiple inline tables
- `trading/risk/page.tsx` — risk metrics table
- `trading/positions/page.tsx` — positions grid
- `observe/health/page.tsx` — health status table
- `promote/walk-forward-panel.tsx` — walk-forward results

### Recommendation

Both patterns are valid — `DataTable` for sortable lists, `Table` for simple read-only grids. Document the decision criteria:

- **Use `DataTable`:** When data is a list of entities with >4 columns and users need sorting/filtering
- **Use `Table`:** When showing a small fixed grid (settings, config summaries, side panels)

**Effort:** Low (documentation + selective migration of 3–5 pages)

---

## 4. Status Badges — Fragmented

### What Exists

| Component     | Location                              | Token Usage                                           |
| ------------- | ------------------------------------- | ----------------------------------------------------- |
| `Badge`       | `components/ui/badge.tsx`             | ❌ Raw Tailwind colors (`green-500`, `red-500`)       |
| `StatusBadge` | `components/trading/status-badge.tsx` | Partial — `var(--status-*)` for text, `rgba()` for bg |

### Gap

- **50+ files** import `Badge` directly
- Some files create **inline badge-like pills** with custom `className` instead of using `Badge` or `StatusBadge`
- `components/research/features/features-finder-config.tsx` builds an `inline-flex` pill that's functionally a badge
- `components/data/*-finder-config.tsx` files add custom Tailwind color classes on `Badge`

### Recommended Fix

1. **Fix `Badge` variants** to use design tokens (see Color Audit §6)
2. **Use `StatusBadge`** for all system status indicators (live, paused, failed, etc.)
3. **Use `Badge`** for categorical labels (asset class, venue type, etc.)
4. **Delete inline pills** that duplicate badge functionality

**Effort:** 2–3 days

---

## 5. Empty States — Duplicate Implementations

### What Exists

| Component                | Location                                      | Props                                    |
| ------------------------ | --------------------------------------------- | ---------------------------------------- |
| `EmptyState`             | `components/ui/empty-state.tsx`               | `icon`, `title`, `description`, `action` |
| `EmptyState` (duplicate) | `components/trading/sports/shared.tsx`        | Different implementation                 |
| DataTable default        | `components/ui/data-table.tsx`                | `emptyMessage` prop                      |
| Finder empty             | `components/shared/finder/finder-browser.tsx` | `emptyState` prop with default copy      |

### Pages with Ad-Hoc Empty States

Several pages have inline "no data" blocks that don't use the shared `EmptyState`:

- Custom "No results" text in filter views
- Inline empty table messages
- Custom "loading or empty" conditional blocks

### Recommended Fix

1. **Consolidate** sports `EmptyState` into `ui/empty-state.tsx` (one implementation)
2. **Adopt `EmptyState`** across all pages that have ad-hoc "no data" blocks
3. DataTable and Finder already handle their own empty states — those are fine

**Effort:** 1–2 days

---

## 6. Filter Bar — Exists But Barely Adopted

### What Exists

| Component           | Location                                     | Imported By                                     |
| ------------------- | -------------------------------------------- | ----------------------------------------------- |
| `FilterBar`         | `components/platform/filter-bar.tsx`         | **Only 3 pages:** positions, orders, alerts     |
| `ContextBar`        | `components/platform/context-bar.tsx`        | **Only 2 pages:** strategy results, compare     |
| `StrategyFilterBar` | `components/trading/strategy-filter-bar.tsx` | Strategy pages                                  |
| `FilterBar` (local) | `components/trading/sports/sports-page.tsx`  | **Name collision** — sports-only local function |

### Pages That Should Use FilterBar But Don't

- `services/reports/overview/page.tsx` — has inline date/filter controls
- `services/trading/markets/page.tsx` — has inline venue/asset filters
- `services/data/instruments/page.tsx` — has custom search/filter UI
- `services/trading/risk/page.tsx` — has inline dimension filters
- `app/(ops)` pages with search inputs — build their own

### Recommended Fix

1. **Rename** sports local `FilterBar` to avoid collision
2. **Extend `platform/FilterBar`** to support the dimension patterns used by non-adopting pages
3. **Migrate** high-traffic pages (reports, markets, instruments) to shared `FilterBar`
4. Not all pages need full FilterBar — some just need a search input (use shared `Input` with `Search` icon)

**Effort:** High (3–5 days) — FilterBar needs to be flexible enough for diverse use cases

---

## 7. Tab Navigation — Well Centralized

### What Exists

| Component      | Purpose                        | Adoption                       |
| -------------- | ------------------------------ | ------------------------------ |
| `ServiceTabs`  | Shell-level service navigation | ✅ Used in all service layouts |
| `Tabs` (Radix) | Page-level tab content         | ✅ Widely adopted              |

**This is one of the best-structured areas.** No major reuse issues.

**Minor improvement:** Standardize inner tab trigger sizing (some use `text-xs`, some `text-sm`).

**Effort:** Low (0.5 day for visual alignment)

---

## 8. Layout / Page Wrapper — No Standard

### Finding

The shell's `<main>` element has **no padding** — every page adds its own. This results in:

| Page             | Outer Padding                 |
| ---------------- | ----------------------------- |
| Reports Overview | `p-6` + `max-w-[1600px]`      |
| Instruments      | `p-4` (multiple inner blocks) |
| Settlement       | `p-6`                         |
| Strategies       | `p-6`                         |
| Health           | `p-6 space-y-6`               |
| Ops pages        | Mix of `p-4`, `p-6`           |

### Recommended Fix

Create `components/shared/page-wrapper.tsx`:

```tsx
interface PageWrapperProps {
  children: React.ReactNode;
  maxWidth?: "default" | "wide" | "full"; // 1600px | 2400px | 100%
  density?: "default" | "compact"; // p-6 | p-4
}
```

**Effort:** 0.5 day to build + 2 days to migrate pages

---

## 9. Loading States — No Shared Presets

### What Exists

- `Skeleton` primitive in `components/ui/skeleton.tsx`
- `Loader2` icon from Lucide for inline spinners

### Gap

Each page builds its own skeleton layout:

- `reports/settlement/page.tsx` — local `LoadingSkeleton` function
- `reports/overview/page.tsx` — inline skeleton composition
- Strategy pages — conditional loading blocks

### Recommended Fix

Create 2–3 skeleton presets:

- `TableSkeleton` — for pages with a data table
- `DashboardSkeleton` — for KPI card + chart layouts
- `PageSkeleton` — header + content area skeleton

**Effort:** 1–2 days

---

## 10. Summary: Component Reuse Scorecard

| Category        | Shared Component        | Exists?                 | Adoption Rate | Priority  |
| --------------- | ----------------------- | ----------------------- | ------------- | --------- |
| Page Header     | `PageHeader`            | ❌ No                   | 0%            | 🔴 High   |
| KPI Cards       | `MetricCard`            | ✅ Yes                  | ~30%          | 🟡 Medium |
| Data Tables     | `DataTable` / `Table`   | ✅ Yes                  | ~70%          | 🟢 Low    |
| Status Badges   | `StatusBadge` / `Badge` | ✅ Yes                  | ~60%          | 🟡 Medium |
| Empty States    | `EmptyState`            | ✅ Yes (with duplicate) | ~20%          | 🟡 Medium |
| Filter Bar      | `FilterBar`             | ✅ Yes                  | ~10%          | 🟢 Low    |
| Tabs            | `ServiceTabs` / `Tabs`  | ✅ Yes                  | ~90%          | ✅ Good   |
| Page Wrapper    | `PageWrapper`           | ❌ No                   | 0%            | 🟡 Medium |
| Loading Presets | Skeleton presets        | ❌ No                   | 0%            | 🟢 Low    |
| Buttons         | `Button`                | ✅ Yes                  | ~95%          | ✅ Good   |
