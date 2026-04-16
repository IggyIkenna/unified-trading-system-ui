# Waterfall Widget Findings (BP-2 / S 9)

**Date:** 2026-04-16
**Status:** AUDIT COMPLETE — ISSUES FIXED (no base widget created)
**Spec reference:** [BP2-base-widget-migration-spec.md](../BP2-base-widget-migration-spec.md) section 9

---

## 1. Widgets Audited

| Widget ID                | File                                                | Lines | Domain   | Classification |
| ------------------------ | --------------------------------------------------- | ----- | -------- | -------------- |
| `pnl-waterfall`          | `widgets/pnl/pnl-waterfall-widget.tsx`              | 312   | P&L      | Full waterfall |
| `pnl-attribution`        | `widgets/overview/bottom-widgets.tsx` (lines 14-35) | 22    | Overview | **Thin shell** |
| `defi-waterfall-weights` | `widgets/defi/defi-waterfall-weights-widget.tsx`    | 94    | DeFi     | Full waterfall |
| `risk-utilization`       | `widgets/risk/risk-utilization-widget.tsx`          | 30    | Risk     | **Thin shell** |

---

## 2. Per-Widget Audit

### 2.1 `pnl-waterfall` (312 lines) -- Full waterfall, primary candidate

**Data source:** `usePnLData()` from `pnl-data-context.tsx` -- no direct mock imports in widget file.

**Rendering pattern:**

- Horizontal bars rendered as plain `div` elements with inline `width` style (no charting library)
- 4 distinct sections: Structural P&L (collapsible), Factor Attribution (scrollable, clickable drill-down), DeFi P&L Attribution (collapsible), Residual (warning-styled)
- Controls bar embedded at top (Live/Batch toggle, date range, group-by, currency selector)
- Net P&L header and footer

**Shared patterns (base-extractable):**

- Horizontal bar rendering: `<div className="h-5 bg-muted rounded-md overflow-hidden"><div style={{ width }}` (repeated 4 times with minor color variations)
- Positive/negative colour logic: `bg-[var(--pnl-positive)]/60` vs `bg-[var(--pnl-negative)]/60`
- `maxAbsValue` calculation pattern for bar width normalisation (done 3 times independently)
- Empty state: ~~MISSING~~ **FIXED** -- guard added when `pnlComponents` is empty
- Loading state: ~~MISSING~~ **FIXED** -- skeleton added when `isLoading` is true

**Issues found and resolved:**

1. ~~**Inline mock data (S 0.3 violation):** `DEFI_PNL_ATTRIBUTION` constant was hardcoded directly in the widget file.~~ **FIXED:** Moved to `pnl-data-context.tsx`, exposed via `defiPnlAttribution` and `defiPnlNet` context fields. Widget now consumes from context.
2. ~~**`DEFI_PNL_NET` and `DEFI_PNL_MAX`** computed at module level -- derived from inline mock and would never update.~~ **FIXED:** `defiPnlNet` computed in context; `defiPnlMax` computed at render time in widget.
3. ~~**No loading state.**~~ **FIXED:** Added skeleton placeholder (5 bars) gated on `isLoading` from context.
4. ~~**No empty state.**~~ **FIXED:** Added "No P&L data available" guard when `pnlComponents` is empty.
5. **Bar width recalculated 3 times** -- `maxStructVal`, `maxFactorAbs`, and `defiPnlMax` each compute the same normalisation pattern independently. (Low priority, not fixed -- could be extracted to a shared utility later.)

### 2.2 `pnl-attribution` (22 lines inside `bottom-widgets.tsx`) -- Thin shell

**Data source:** `useOverviewDataSafe()` from `overview-data-context.tsx`.

**Rendering pattern:**

- Delegates entirely to `<PnLAttributionPanel>` from `components/trading/pnl-attribution-panel.tsx`
- Has its own empty state ("Navigate to Overview tab") when context is null (cross-tab widget)
- Has a "View All" link to `/services/trading/pnl`

**Assessment:** This is a **thin shell** (22 lines). It delegates all waterfall rendering to `PnLAttributionPanel`, which is a shared domain component. The widget just wraps it with a context safety check and a navigation link. **Should NOT be migrated to a base** -- it's already correctly structured.

**Note:** `PnLAttributionPanel` (131 lines) is the actual waterfall rendering component. It renders horizontal bars with proportional width, positive/negative colouring, and a NET total. This component shares the same rendering pattern as `pnl-waterfall` but is already extracted.

### 2.3 `defi-waterfall-weights` (94 lines) -- Full waterfall

**Data source:** `useDeFiData()` from `defi-data-context.tsx` -- no direct mock imports in widget file.

**Rendering pattern:**

- Two-pillar waterfall: Pillar 1 (coin allocation weights) and Pillar 2 (per-coin venue weights)
- Uses a local `HorizontalBar` helper component (lines 20-34) for consistent bar rendering
- Click-to-drill: selecting a coin in Pillar 1 shows venue breakdown in Pillar 2
- Restricted venues highlighted with `Badge variant="destructive"`
- Empty state for Pillar 2: "Click a coin in Pillar 1 to see venue breakdown"

**Shared patterns (base-extractable):**

- `HorizontalBar` component: label + proportional bar + percentage -- reusable across waterfall widgets
- Colour array (`BAR_COLORS`) for sequential colouring
- Drill-down pattern (click parent row -> show child data)

**Issues found and resolved:**

1. **No loading state** -- DeFi context is fully synchronous (static mock data), so no async loading to guard. N/A.
2. ~~**No empty state for Pillar 1** -- if `coins` array is empty, renders nothing.~~ **FIXED:** Added "No coin allocations available" guard.
3. **Restricted venues banner** -- well-implemented, no issues.

### 2.4 `risk-utilization` (30 lines) -- Thin shell

**Data source:** `useRiskData()` from `risk-data-context.tsx`.

**Rendering pattern:**

- Delegates entirely to `<LimitBar>` from `components/trading/limit-bar.tsx`
- Wrapped in `<WidgetScroll axes="vertical">`
- Renders top 8 limits from `sortedLimits`
- Has empty state: "No limits data" when `sortedLimits.length === 0`

**Assessment:** This is a **thin shell** (30 lines). It delegates all rendering to the shared `LimitBar` component. `LimitBar` renders horizontal bars with value/limit labels, threshold markers (70%, 90%), and status colouring -- this is a utilisation bar, not a true waterfall. **Should NOT be migrated to a base** -- already correctly structured, and semantically different from waterfall charts.

---

## 3. Shared Patterns -- What Goes in the Base

The only two **full waterfall** widgets are `pnl-waterfall` (312 lines) and `defi-waterfall-weights` (94 lines). They share:

| Pattern                     | `pnl-waterfall`                                 | `defi-waterfall-weights`        |
| --------------------------- | ----------------------------------------------- | ------------------------------- |
| Horizontal bar with `width` | 4 variants (structural, factor, DeFi, residual) | 1 via `HorizontalBar` component |
| Colour logic                | Positive/negative (green/red)                   | Sequential (colour array)       |
| Max-abs normalisation       | 3 independent calculations                      | Built into `HorizontalBar`      |
| Click drill-down            | Factor selection -> drilldown panel             | Coin -> venue breakdown         |
| Empty state                 | Missing                                         | Only for Pillar 2               |
| Loading state               | Missing                                         | Missing                         |

**Proposed base (`components/shared/waterfall-widget.tsx`):**

| Feature           | Base provides                                                     |
| ----------------- | ----------------------------------------------------------------- |
| `WaterfallBar`    | Reusable horizontal bar: label, value, proportional width, colour |
| Normalisation     | `maxAbsValue` calculation from data array                         |
| Positive/negative | Configurable colour for positive vs negative values               |
| Empty state       | "No data" message when data array is empty                        |
| Loading state     | Skeleton placeholder bars when `isLoading` is true                |
| Container         | Vertical stack with consistent padding, scrollable                |

**What stays in each child:**

| Widget                   | Child-specific logic                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnl-waterfall`          | Controls bar, 4 sections (structural/factor/DeFi/residual), collapsible sections, factor drill-down click, residual alert banner, report button |
| `defi-waterfall-weights` | Two-pillar layout, coin->venue drill-down, restricted venues badge, `BAR_COLORS` array                                                          |

---

## 4. What Stays in Each Child (not base-extractable)

- `pnl-waterfall`: Embedded controls bar (Live/Batch, date range, group-by, currency), 4-section layout with `CollapsibleSection`, factor click -> selection state, residual alert banner, report toast action, DeFi-specific attribution section
- `defi-waterfall-weights`: Two-pillar drill-down (coin -> venue), `selectedCoin` local state, restricted venues display, `HorizontalBar` colour cycling
- `pnl-attribution`: Thin shell -- entire rendering delegated to `PnLAttributionPanel`
- `risk-utilization`: Thin shell -- entire rendering delegated to `LimitBar`

---

## 5. Cross-Cutting Requirements (S 0)

### 5.1 Widget Error Boundary (S 0.1)

**Status: ALREADY IN PLACE.** `WidgetErrorBoundary` exists in `widget-wrapper.tsx` (lines 29-52). Every widget rendered through `WidgetBody` is wrapped in `<WidgetErrorBoundary>`. No action needed.

The boundary includes a **Retry button** that clears the error state and re-renders the widget. Meets spec requirements.

### 5.2 Widget Loading Skeleton (S 0.2)

**Status: FIXED for `pnl-waterfall`; N/A for `defi-waterfall-weights`.**

- `pnl-waterfall`: **FIXED.** Added skeleton placeholder gated on `isLoading` from `usePnLData()`.
- `defi-waterfall-weights`: DeFi context is fully synchronous static data -- no async loading to guard. N/A.
- `pnl-attribution`: Thin shell -- no changes needed.
- `risk-utilization`: Thin shell -- no changes needed.

### 5.3 Mock Import Cleanup (S 0.3)

**Status: FIXED. No mock data in widget files.**

- `pnl-waterfall-widget.tsx`: **FIXED.** `DEFI_PNL_ATTRIBUTION` moved from widget to `pnl-data-context.tsx`. Widget now consumes `defiPnlAttribution` and `defiPnlNet` from the context.
- All other waterfall widgets: clean -- no `lib/mocks/` imports.

The data contexts themselves import from `lib/mocks/` (acceptable per spec -- mocks stay in the data context, not the widget).

### 5.4 Dead Code (S 0.4)

**No dead code found** in waterfall widget files.

---

## 6. Registration and Presets

All 4 widgets are properly registered:

| Widget ID                | Registered in          | Presets used in                              |
| ------------------------ | ---------------------- | -------------------------------------------- |
| `pnl-waterfall`          | `pnl/register.ts`      | `pnl-default`, `pnl-time-series`, `pnl-full` |
| `pnl-attribution`        | `overview/register.ts` | `overview-default`, `overview-full`          |
| `defi-waterfall-weights` | `defi/register.ts`     | `defi-walkthrough`, `defi-full`              |
| `risk-utilization`       | `risk/register.ts`     | `risk-cro-briefing`, `risk-full`             |

No orphaned registrations or missing presets.

---

## 7. Decision: No Base Widget

### Base value assessment: LOW -- decision: DO NOT CREATE

A waterfall base would serve **only 2 full widgets** (`pnl-waterfall` and `defi-waterfall-weights`). The two thin shells (`pnl-attribution`, `risk-utilization`) are already correctly structured and would not adopt a base.

The two full widgets have **very different structures**:

- `pnl-waterfall` is a complex 312-line multi-section widget with embedded controls, collapsible sections, and a residual alert system
- `defi-waterfall-weights` is a focused 94-line two-pillar drill-down widget

A base class would add indirection without meaningful deduplication. Instead, all issues were fixed directly in the widgets.

### What was done

1. **Moved `DEFI_PNL_ATTRIBUTION`** from `pnl-waterfall-widget.tsx` to `pnl-data-context.tsx` -- exposed as `defiPnlAttribution` and `defiPnlNet` on the context interface
2. **Added loading skeleton** to `pnl-waterfall` -- gated on `isLoading` from context, renders 5 shimmer bars
3. **Added empty state** to `pnl-waterfall` -- "No P&L data available" when `pnlComponents` is empty
4. **Added Pillar 1 empty state** to `defi-waterfall-weights` -- "No coin allocations available" when `coins` is empty
5. **Verified** `WidgetErrorBoundary` already has Retry button -- no action needed
6. **Verified** thin shells (`pnl-attribution`, `risk-utilization`) -- no changes needed

---

## 8. Issues Summary

| #   | Severity | Widget                   | Issue                                             | Status                                                         |
| --- | -------- | ------------------------ | ------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Medium   | `pnl-waterfall`          | Inline hardcoded `DEFI_PNL_ATTRIBUTION` mock data | **FIXED** -- moved to `pnl-data-context.tsx`                   |
| 2   | Medium   | `pnl-waterfall`          | No loading state / skeleton                       | **FIXED** -- skeleton added, gated on `isLoading`              |
| 3   | Medium   | `pnl-waterfall`          | No empty state when `pnlComponents` is empty      | **FIXED** -- "No P&L data available" guard added               |
| 4   | Low      | `pnl-waterfall`          | Bar width normalisation duplicated 3 times        | Open -- low priority, could extract to utility later           |
| 5   | Medium   | `defi-waterfall-weights` | No loading state                                  | N/A -- context is synchronous static data, nothing to load     |
| 6   | Low      | `defi-waterfall-weights` | No empty state for Pillar 1 (coins)               | **FIXED** -- "No coin allocations available" guard added       |
| 7   | Low      | Global                   | `WidgetErrorBoundary` lacks Retry button          | Already present -- Retry button exists in `widget-wrapper.tsx` |
