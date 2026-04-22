# § 6 — CardGridWidget Findings

**Date:** 2026-04-16
**Auditor:** Claude Agent (BP-2)
**Child count:** 10 (spec listed 8 + 2 additional discovered)
**Base file:** `components/shared/card-grid-widget.tsx` — **NOT CREATED** (see S 3.3 — base not justified)

> **Update 2026-04-22 (WU-2):** `bundle-templates` was absorbed into `bundle-builder` (bundles widget merge). References to it below are historical. Effective card-grid child count: 9.

---

## 1. Files Audited

| #   | Widget ID                 | File                                                               | Lines | Domain      | Layout Pattern                                  |
| --- | ------------------------- | ------------------------------------------------------------------ | ----- | ----------- | ----------------------------------------------- |
| 1   | `alerts-preview`          | `components/widgets/overview/bottom-widgets.tsx` (L37-87)          | ~50   | Overview    | Vertical list (`space-y-2`), not card grid      |
| 2   | `recent-fills`            | `components/widgets/overview/bottom-widgets.tsx` (L89-148)         | ~60   | Overview    | Vertical list (`space-y-1.5`), not card grid    |
| 3   | `health-grid`             | `components/widgets/overview/bottom-widgets.tsx` (L150-171)        | ~22   | Overview    | Delegates to `HealthStatusGrid`                 |
| 4   | `risk-circuit-breakers`   | `components/widgets/risk/risk-circuit-breakers-widget.tsx`         | 47    | Risk        | `grid grid-cols-2 gap-1.5`                      |
| 5   | `saft-portfolio`          | `components/widgets/accounts/saft-portfolio-widget.tsx`            | 340   | Accounts    | `grid-cols-2 sm:grid-cols-4` + table + timeline |
| 6   | `bundle-templates`        | `components/widgets/bundles/bundle-templates-widget.tsx`           | 87    | Bundles     | `grid grid-cols-1 sm:grid-cols-2 gap-1.5`       |
| 7   | `defi-atomic-bundle`      | `components/widgets/bundles/defi-atomic-bundle-widget.tsx`         | 472   | Bundles     | Bundle builder (template grid + form)           |
| 8   | `strategies-catalogue`    | `components/widgets/strategies/strategies-catalogue-widget.tsx`    | 392   | Strategies  | Grouped card grid with full filter UI           |
| 9   | `pred-top-markets`        | `components/widgets/predictions/pred-top-markets-widget.tsx`       | 34    | Predictions | `grid grid-cols-1 sm:grid-cols-2 gap-2`         |
| 10  | `strategy-family-browser` | `components/widgets/strategies/strategy-family-browser-widget.tsx` | 107   | Strategies  | Table-per-family, NOT a card grid               |

---

## 2. Shared Patterns (candidates for the base)

### 2.1 Grid Layout

Only 4 of 10 widgets actually use a responsive CSS grid with card items:

| Widget                  | Grid classes                              | Items per row        |
| ----------------------- | ----------------------------------------- | -------------------- |
| `risk-circuit-breakers` | `grid grid-cols-2 gap-1.5`                | Fixed 2              |
| `bundle-templates`      | `grid grid-cols-1 sm:grid-cols-2 gap-1.5` | 1-2 responsive       |
| `pred-top-markets`      | `grid grid-cols-1 sm:grid-cols-2 gap-2`   | 1-2 responsive       |
| `saft-portfolio`        | `grid grid-cols-2 sm:grid-cols-4 gap-3`   | 2-4 (KPI cards only) |

`strategies-catalogue` uses a dynamic grid (`grid-cols-1` vs `grid-cols-2` via `ResizeObserver`) but the grid is deeply interleaved with collapsible sections and multi-level grouping (asset class -> archetype). Too custom for a generic base.

### 2.2 Card Patterns

The card content varies enormously across widgets:

- **`risk-circuit-breakers`**: Mini status cards (venue + status badge + kill switch)
- **`bundle-templates`**: Clickable template buttons with operation flow badges
- **`saft-portfolio`**: KPI summary cards + full table + vesting timeline chart (NOT a card grid at all)
- **`strategies-catalogue`**: Rich strategy cards with sparklines, performance stats, action buttons
- **`pred-top-markets`**: Delegates entirely to `TopMarketCard` component

No shared `Card`/`CardContent` wrapper pattern exists across these widgets. Each renders completely bespoke content.

### 2.3 Empty State

| Widget                    | Empty state?              | Implementation                              |
| ------------------------- | ------------------------- | ------------------------------------------- |
| `alerts-preview`          | Yes                       | Inline "No active alerts" text              |
| `recent-fills`            | Yes                       | Inline "No recent fills" text               |
| `health-grid`             | No                        | Delegates to `HealthStatusGrid`             |
| `risk-circuit-breakers`   | Yes                       | "No venue CB data" centered                 |
| `saft-portfolio`          | No (always has mock data) | --                                          |
| `bundle-templates`        | No (always has templates) | Has hidden state ("Show pre-built gallery") |
| `defi-atomic-bundle`      | Yes (when no ops)         | Custom empty with icon + CTA buttons        |
| `strategies-catalogue`    | Yes                       | "No strategies match your filters"          |
| `pred-top-markets`        | No                        | Relies on data being present                |
| `strategy-family-browser` | No                        | Relies on API response                      |

### 2.4 Loading State

| Widget                    | Loading state? | Implementation                             |
| ------------------------- | -------------- | ------------------------------------------ |
| `alerts-preview`          | Yes            | `<Spinner>` from context `alertsLoading`   |
| `recent-fills`            | Yes            | `<Spinner>` from context `ordersLoading`   |
| `health-grid`             | No             | --                                         |
| `risk-circuit-breakers`   | No             | --                                         |
| `saft-portfolio`          | No             | Static mock data, no loading               |
| `bundle-templates`        | No             | Data from context, no loading guard        |
| `defi-atomic-bundle`      | No             | Local state only                           |
| `strategies-catalogue`    | Yes            | `<Spinner>` from context `isLoading`       |
| `pred-top-markets`        | No             | --                                         |
| `strategy-family-browser` | Yes            | `<Spinner>` from `useStrategyCatalog` hook |

### 2.5 Data Source

| Widget                    | Data source                         | Mock import issue?         |
| ------------------------- | ----------------------------------- | -------------------------- |
| `alerts-preview`          | `useOverviewDataSafe()` context     | No (context handles)       |
| `recent-fills`            | `useOverviewDataSafe()` context     | No (context handles)       |
| `health-grid`             | `useOverviewDataSafe()` context     | No (context handles)       |
| `risk-circuit-breakers`   | `useRiskData()` context             | No                         |
| `saft-portfolio`          | Direct `MOCK_SAFTS` import          | **YES -- S 0.3 violation** |
| `bundle-templates`        | `useBundlesData()` context          | No (context handles)       |
| `defi-atomic-bundle`      | Local `useState` + inline constants | No (self-contained)        |
| `strategies-catalogue`    | `useStrategiesData()` context       | No                         |
| `pred-top-markets`        | `usePredictionsData()` context      | No                         |
| `strategy-family-browser` | `useStrategyCatalog()` API hook     | No                         |

---

## 3. Classification Verdict

### 3.1 NOT Card Grids (misclassified in spec)

These widgets do NOT render a card grid and should be reclassified:

| Widget                    | Actual class                   | Reason                                                                                                                    |
| ------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `alerts-preview`          | **Live feed / list**           | Vertical list of alert items with badges, not cards                                                                       |
| `recent-fills`            | **Live feed / list**           | Vertical list of fill rows, not cards                                                                                     |
| `health-grid`             | **Thin shell**                 | 22 lines, delegates entirely to `HealthStatusGrid`                                                                        |
| `saft-portfolio`          | **Bespoke dashboard**          | 340 lines: KPI strip + table + vesting timeline chart. Complex composite widget                                           |
| `defi-atomic-bundle`      | **Bundle builder (form-like)** | 472 lines: template picker + operation builder + simulation preview. Interactive builder, not a display grid              |
| `strategy-family-browser` | **Table widget**               | Renders `Table` per family group, no card grid                                                                            |
| `strategies-catalogue`    | **Bespoke catalogue**          | 392 lines with full filter bar, asset class grouping, archetype sub-grouping, ResizeObserver. Too custom for generic base |

### 3.2 Genuine Card Grids (3 widgets)

Only these widgets genuinely render a simple responsive card grid:

| Widget                  | Lines | Grid pattern                              | Card content complexity            |
| ----------------------- | ----- | ----------------------------------------- | ---------------------------------- |
| `risk-circuit-breakers` | 47    | `grid grid-cols-2 gap-1.5`                | Low (status badge)                 |
| `bundle-templates`      | 87    | `grid grid-cols-1 sm:grid-cols-2 gap-1.5` | Medium (template card)             |
| `pred-top-markets`      | 34    | `grid grid-cols-1 sm:grid-cols-2 gap-2`   | Low (delegates to `TopMarketCard`) |

### 3.3 Base Cost-Benefit Analysis

**With only 3 genuine card-grid widgets, the cost of creating a `CardGridWidget` base likely exceeds the benefit.**

The base would provide:

- Responsive grid container (5-10 lines of shared code)
- Empty state (5 lines)
- Loading skeleton (10 lines)

Each widget already handles its grid in 1-2 lines of Tailwind. Adding a base would:

- Add indirection for minimal code savings (~15 lines per widget)
- Force each widget to conform to a slot/render-prop pattern that may not match their specific needs
- Not reduce complexity since card content is 100% domain-specific

**Recommendation: Do NOT create a `CardGridWidget` base.** Instead, apply cross-cutting requirements (S 0) individually.

---

## 4. Issues Found

### 4.1 Mock Import Violation (S 0.3) -- `saft-portfolio-widget.tsx` -- FIXED

**Severity: HIGH** | **Status: RESOLVED**

`saft-portfolio-widget.tsx` imported `MOCK_SAFTS` directly from `lib/mocks/`.

**Fix applied:**

- Moved `MOCK_SAFTS` import into `accounts-data-context.tsx`
- Exposed `saftRecords` via the context value
- Re-exported `SAFTRecord` type from the data context
- Updated widget to use `useAccountsData().saftRecords` instead of direct mock import
- Added loading state (`isLoading` from context) and empty state guard

### 4.2 Missing Loading States -- FIXED

| Widget                  | Had loading? | Fix applied                                                   |
| ----------------------- | ------------ | ------------------------------------------------------------- |
| `health-grid`           | No           | Low priority -- thin shell, delegates rendering (skip)        |
| `risk-circuit-breakers` | **No**       | **FIXED** -- Added `isLoading` guard from `useRiskData()`     |
| `saft-portfolio`        | **No**       | **FIXED** -- Added `isLoading` guard from `useAccountsData()` |
| `bundle-templates`      | No           | Low priority -- templates always available (skip)             |
| `defi-atomic-bundle`    | No           | N/A -- local state only, no async data                        |
| `pred-top-markets`      | No           | Data is static mocks via context, no async loading            |

### 4.3 Missing Empty States -- FIXED

| Widget                    | Had empty? | Fix applied                                           |
| ------------------------- | ---------- | ----------------------------------------------------- |
| `health-grid`             | No         | Low priority -- thin shell (skip)                     |
| `saft-portfolio`          | **No**     | **FIXED** -- Added "No SAFT records" empty guard      |
| `pred-top-markets`        | **No**     | **FIXED** -- Added "No markets available" empty guard |
| `strategy-family-browser` | **No**     | **FIXED** -- Added "No strategies found" empty guard  |

### 4.4 `saft-portfolio-widget.tsx` -- Inline Utility Functions

Lines 295-339 define 5 utility functions (`formatCurrency`, `formatTokens`, `roundBadge`, `vestingColor`, `daysUntil`, `dateLabel`) that are tightly coupled to the widget. `formatCurrency` duplicates similar logic in `@/lib/utils/formatters`. Consider consolidating.

### 4.5 `defi-atomic-bundle-widget.tsx` -- Inline Constants -- FIXED

**Status: RESOLVED**

~70 lines of constants (`DEFI_OPERATIONS`, `DEFI_TOKENS`, `DEFI_TEMPLATES`, `GAS_PRICE_GWEI`, gas estimate map, `gasToUsd`) moved to `lib/config/services/defi-bundles.config.ts`. Widget now imports from config. Also extracted `GAS_ESTIMATES` record so the inline duplicate in `updateOp` is eliminated.

### 4.6 `strategy-family-browser-widget.tsx` -- Missing `WidgetComponentProps` -- FIXED

**Status: RESOLVED**

Added `WidgetComponentProps` import and type annotation. Also added empty state guard for when the catalog API returns no strategies.

### 4.7 Widget Error Boundary (S 0.1) -- Already Complete

`WidgetErrorBoundary` already exists in `components/widgets/widget-wrapper.tsx` (lines 30-63). It wraps every widget via the `WidgetBody` render path. Retry button with `RefreshCw` icon is already implemented -- calls `this.setState({ error: null })` to re-attempt rendering. **No action needed.**

---

## 5. Per-Widget Migration Recommendation

| Widget                    | Action                            | Notes                                                                            |
| ------------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| `alerts-preview`          | **S 0 only**                      | Not a card grid. Already has loading + empty.                                    |
| `recent-fills`            | **S 0 only**                      | Not a card grid. Already has loading + empty.                                    |
| `health-grid`             | **S 0 only (thin shell)**         | 22 lines, delegates to `HealthStatusGrid`. No changes.                           |
| `risk-circuit-breakers`   | **S 0 only + add loading**        | 47 lines. Add `isLoading` guard from `useRiskData()`.                            |
| `saft-portfolio`          | **S 0.3 fix + add loading/empty** | Move `MOCK_SAFTS` to data context. Add loading/empty.                            |
| `bundle-templates`        | **S 0 only**                      | 87 lines. Data from context. Clean.                                              |
| `defi-atomic-bundle`      | **Move constants to lib**         | 472 lines. Move `DEFI_OPERATIONS`, `DEFI_TOKENS`, `DEFI_TEMPLATES` to constants. |
| `strategies-catalogue`    | **S 0 only**                      | Already has loading + empty + full filter UI. Clean.                             |
| `pred-top-markets`        | **S 0 only + add loading/empty**  | 34 lines. Add loading and empty guards.                                          |
| `strategy-family-browser` | **Fix props + add empty**         | Fix `WidgetComponentProps`. Add empty state.                                     |

---

## 6. Cross-Cutting Requirements Status (S 0)

| Requirement            | Status                                                                            |
| ---------------------- | --------------------------------------------------------------------------------- |
| S 0.1 Error boundary   | **DONE** -- `WidgetErrorBoundary` in `widget-wrapper.tsx` with retry button.      |
| S 0.2 Loading skeleton | **DONE** -- Added loading guards to `risk-circuit-breakers` and `saft-portfolio`. |
| S 0.3 Mock cleanup     | **DONE** -- `saft-portfolio` now uses `useAccountsData().saftRecords`.            |
| S 0.4 Dead code        | **N/A** -- No dead code found in card-grid widgets.                               |

---

## 7. Summary

**Base creation: NOT RECOMMENDED.** Only 3 of 10 widgets are genuine card grids, and they share only ~15 lines of boilerplate (a `div` with Tailwind grid classes). The remaining 7 are misclassified -- they are lists, tables, thin shells, or bespoke composite widgets.

**All priority issues have been resolved:**

1. **FIXED** -- `saft-portfolio-widget.tsx` mock import moved to `accounts-data-context.tsx` (S 0.3)
2. **FIXED** -- Loading states added to `risk-circuit-breakers`, `saft-portfolio` (S 0.2)
3. **FIXED** -- Empty states added to `saft-portfolio`, `pred-top-markets`, `strategy-family-browser`
4. **FIXED** -- `defi-atomic-bundle` inline constants moved to `lib/config/services/defi-bundles.config.ts`
5. **FIXED** -- `strategy-family-browser` props signature corrected to `WidgetComponentProps`
6. **ALREADY DONE** -- `WidgetErrorBoundary` retry button was already in place

### Files Changed

| File                                                               | Change                                           |
| ------------------------------------------------------------------ | ------------------------------------------------ |
| `components/widgets/accounts/accounts-data-context.tsx`            | Added `MOCK_SAFTS` import, exposed `saftRecords` |
| `components/widgets/accounts/saft-portfolio-widget.tsx`            | Use context, add loading/empty states            |
| `components/widgets/risk/risk-circuit-breakers-widget.tsx`         | Add loading state from `useRiskData().isLoading` |
| `components/widgets/predictions/pred-top-markets-widget.tsx`       | Add empty state guard                            |
| `components/widgets/bundles/defi-atomic-bundle-widget.tsx`         | Import constants from config instead of inline   |
| `components/widgets/strategies/strategy-family-browser-widget.tsx` | Fix props type, add empty state                  |
| `lib/config/services/defi-bundles.config.ts` (NEW)                 | Extracted DeFi bundle constants + types          |

### Verification

- `tsc --noEmit` passes (no new errors in changed files)
- All files formatted with Prettier
