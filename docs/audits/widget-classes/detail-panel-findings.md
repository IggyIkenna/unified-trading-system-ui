# § 4 — DetailPanelWidget Findings

**Date:** 2026-04-16
**Auditor:** Claude Opus 4.6
**Status:** AUDIT COMPLETE — no base widget, fix issues in-place
**Decision:** All 11 widgets remain standalone. Use cases are too different to justify a shared base. Fix cross-cutting issues (mocks, props, loading) directly in each widget.
**Spec reference:** [BP2-base-widget-migration-spec.md](../BP2-base-widget-migration-spec.md) § 4

> **Update 2026-04-22:** `book-preview-compliance` was absorbed into `book-order-entry` (WU-1 widget merge). References to it below are historical. Remaining detail-panel widgets: 10. See `docs/audits/live-review-findings.md` row #17.

---

## Summary

| Metric                         | Count                          |
| ------------------------------ | ------------------------------ |
| Total child widgets in scope   | 11                             |
| Thin shells (already correct)  | 4                              |
| Standalone (fix issues only)   | 7                              |
| Direct mock imports (§ 0.3)    | 1                              |
| Inline mock constants (§ 0.3)  | 2                              |
| Missing loading state          | 11/11                          |
| Missing empty state            | 5/11                           |
| Missing error state            | 10/11                          |
| Missing `WidgetComponentProps` | 2                              |
| **Base widget created**        | **No — widgets too divergent** |

---

## § 0 Cross-Cutting Status

### 0.1 Widget Error Boundary — ALREADY IN PLACE

`WidgetErrorBoundary` exists in `components/widgets/widget-wrapper.tsx:29-52`. Every widget is wrapped via the `WidgetBody` component (line 77). Shows widget label + error message on crash.

**Gap:** No retry button. The existing boundary renders a static error message but provides no way to reset. This should be enhanced with a `resetErrorBoundary` method triggered by a Retry button.

### 0.2 Widget Loading Skeleton — MISSING ON ALL 11 WIDGETS

Zero of the 11 detail panel widgets implement a loading skeleton. `book-preview-compliance` has a domain-specific loading state for compliance checks, but no general skeleton.

### 0.3 Mock Import Cleanup — 3 WIDGETS AFFECTED

| Widget             | Issue                                                                       | Target                        |
| ------------------ | --------------------------------------------------------------------------- | ----------------------------- |
| `sports-clv`       | Imports `MOCK_CLV_RECORDS` from `@/lib/mocks/fixtures/sports-data`          | `sports-data-context.tsx`     |
| `sports-ml-status` | Inline `MOCK_MODEL_FAMILIES` (5 items) + `MOCK_FEATURE_FRESHNESS` (8 items) | `sports-data-context.tsx`     |
| `commodity-regime` | Inline `MOCK_FACTORS` (5 items) + `MOCK_POSITIONS` (5 items)                | `strategies-data-context.tsx` |

**Note:** `sports-data-context.tsx` does NOT currently expose CLV records, model families, or feature freshness. These must be added to the context provider. Similarly, `strategies-data-context.tsx` has no commodity regime data.

### 0.4 Dead Code — NONE IN § 4 SCOPE

No dead code files identified in the detail-panel widget set.

---

## Per-Widget Audit

### 1. `book-preview-compliance` — 267 lines — Book domain

**File:** `components/widgets/book/book-preview-compliance-widget.tsx`

| Aspect        | Status                                                                              |
| ------------- | ----------------------------------------------------------------------------------- |
| Data source   | `useBookTradeData()` — clean                                                        |
| Mock imports  | None                                                                                |
| Loading state | Domain-specific only (`complianceLoading` for compliance checks)                    |
| Empty state   | Yes — `orderState === "idle"`: "Preview summary and compliance appear after you..." |
| Error state   | Yes — `orderState === "error"` with retry button                                    |
| Props         | `WidgetComponentProps` — clean                                                      |

**Architecture:** State machine with 5 states: `idle → preview → submitting → success → error`. Renders a summary grid (mode, category, side, instrument, venue, price, qty, total), compliance check results with PASS/FAIL badges, and submit/edit buttons.

**Base fit: LOW.** This is a form/action panel, not a read-only detail panel. It has its own state machine, submit flow, and compliance-specific loading. Forcing it into a `DetailPanelWidget` base would require fighting the base's assumptions (header/body/footer slots don't map to idle/preview/submitting/success/error states).

**Recommendation:** Apply § 0 cross-cutting only. Do not migrate to base.

---

### 2. `instructions-detail-panel` — 24 lines — Instructions domain — THIN SHELL

**File:** `components/widgets/instructions/instructions-detail-panel-widget.tsx`

| Aspect        | Status                                                    |
| ------------- | --------------------------------------------------------- |
| Data source   | `useInstructionsData()` — clean                           |
| Mock imports  | None                                                      |
| Loading state | None                                                      |
| Empty state   | Yes — "Select a row in the instruction pipeline table..." |
| Props         | `WidgetComponentProps` — clean                            |

**Architecture:** Wraps `CollapsibleSection` + `InstructionDetailGrid`. 24 lines — delegates entirely to domain component.

**Base fit: NONE.** Already correctly structured as a thin shell. Base would add indirection.

**Recommendation:** Apply § 0 cross-cutting only (add loading skeleton via data context). Do not migrate to base.

---

### 3. `sports-fixture-detail` — 32 lines — Sports domain — THIN SHELL

**File:** `components/widgets/sports/sports-fixture-detail-widget.tsx`

| Aspect        | Status                                         |
| ------------- | ---------------------------------------------- |
| Data source   | `useSportsData()` — clean                      |
| Mock imports  | None                                           |
| Loading state | None                                           |
| Empty state   | Yes — "No fixture selected" with guidance text |
| Props         | `WidgetComponentProps` — clean                 |

**Architecture:** Renders `FixtureDetailPanel` when `selectedFixture` exists, otherwise a dashed-border empty state. Clean delegation pattern.

**Base fit: NONE.** Already correctly structured as a thin shell.

**Recommendation:** Apply § 0 cross-cutting only. Do not migrate to base.

---

### 4. `sports-clv` — 100 lines — Sports domain — MOCK IMPORT VIOLATION

**File:** `components/widgets/sports/sports-clv-widget.tsx`

| Aspect        | Status                                                               |
| ------------- | -------------------------------------------------------------------- |
| Data source   | `MOCK_CLV_RECORDS` imported directly from `@/lib/mocks/` ⚠️          |
| Mock imports  | **YES** — `MOCK_CLV_RECORDS` from `@/lib/mocks/fixtures/sports-data` |
| Loading state | None ⚠️                                                              |
| Empty state   | None ⚠️                                                              |
| Error state   | None ⚠️                                                              |
| Props         | **Missing `WidgetComponentProps`** — bare `SportsCLVWidget()` ⚠️     |

**Architecture:** KPI strip (4 tiles: total bets, net P&L, avg CLV, CLV hit rate) + scrollable table with 7 columns. Uses `KpiTile` from `@/components/trading/sports/shared`. Hardcoded dark theme colours.

**Issues found:**

1. Direct mock import violates § 0.3
2. No `WidgetComponentProps` in function signature
3. No loading/empty/error states
4. Inline aggregation logic (reduce operations) should live in data context

**Recommendation:** Move mock data to `sports-data-context.tsx`, fix props signature, add loading/empty/error states in-place.

---

### 5. `sports-ml-status` — 215 lines — Sports domain — INLINE MOCKS

**File:** `components/widgets/sports/sports-ml-status-widget.tsx`

| Aspect        | Status                                                                           |
| ------------- | -------------------------------------------------------------------------------- |
| Data source   | Inline `MOCK_MODEL_FAMILIES` (lines 25-81) + `MOCK_FEATURE_FRESHNESS` (83-92) ⚠️ |
| Mock imports  | **INLINE MOCKS** — 68 lines of hardcoded mock data inside widget file ⚠️         |
| Loading state | None ⚠️                                                                          |
| Empty state   | None ⚠️                                                                          |
| Error state   | None ⚠️                                                                          |
| Props         | **Missing `WidgetComponentProps`** — bare `SportsMLStatusWidget()` ⚠️            |

**Architecture:** KPI strip (4 metrics: models healthy, avg accuracy, features fresh, total columns) + model families list with status dots + feature freshness 2-column grid. Includes local `timeSince()` utility and type definitions.

**Issues found:**

1. 68 lines of inline mock data — must move to `sports-data-context.tsx`
2. Type definitions (`ModelFamily`, `FeatureFreshness`) should move to domain types
3. No `WidgetComponentProps` in function signature
4. No loading/empty/error states
5. `timeSince()` utility could be shared

**Recommendation:** Move mocks + types to `sports-data-context.tsx`, fix props signature, add loading/empty/error states in-place.

---

### 6. `pred-market-detail` — 31 lines — Predictions domain — THIN SHELL

**File:** `components/widgets/predictions/pred-market-detail-widget.tsx`

| Aspect        | Status                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------- |
| Data source   | `usePredictionsData()` — clean                                                           |
| Mock imports  | None                                                                                     |
| Loading state | None                                                                                     |
| Empty state   | Yes — "Select a market from the Markets grid to view detail, chart, and trade controls." |
| Props         | `WidgetComponentProps` — clean                                                           |

**Architecture:** Renders `MarketDetailPanel` when `selectedMarket` exists, otherwise a Card with empty state message.

**Base fit: NONE.** Already correctly structured as a thin shell.

**Recommendation:** Apply § 0 cross-cutting only. Do not migrate to base.

---

### 7. `options-scenario` — 10 lines — Options domain — THIN SHELL

**File:** `components/widgets/options/options-scenario-widget.tsx`

| Aspect        | Status                            |
| ------------- | --------------------------------- |
| Data source   | `useOptionsData()` — clean        |
| Mock imports  | None                              |
| Loading state | None (delegated to `ScenarioTab`) |
| Empty state   | None (delegated to `ScenarioTab`) |
| Props         | `WidgetComponentProps` — clean    |

**Architecture:** Pure pass-through — destructures 3 props from context, passes to `ScenarioTab`. 10 lines total.

**Base fit: NONE.** Absolute minimum shell. Base would triple the code for zero benefit.

**Recommendation:** Apply § 0 cross-cutting only. Do not migrate to base.

---

### 8. `bundle-steps` — 258 lines — Bundles domain

**File:** `components/widgets/bundles/bundle-steps-widget.tsx`

| Aspect        | Status                                                       |
| ------------- | ------------------------------------------------------------ |
| Data source   | `useBundlesData()` — clean                                   |
| Mock imports  | None                                                         |
| Loading state | None ⚠️                                                      |
| Empty state   | Yes — "No legs in this bundle yet" with Add/Template buttons |
| Error state   | None ⚠️                                                      |
| Props         | `WidgetComponentProps` — clean                               |

**Architecture:** Interactive step builder — visual order pipeline (numbered circles with arrows), step cards with CRUD operations (add, remove, move, duplicate, update), per-step forms (operation, instrument, venue, side, depends-on, quantity, price), notional calculation.

**Base fit: LOW.** This is a form/builder widget, not a read-only detail panel. The empty state pattern fits, but the interactive step builder with reorder, CRUD, and per-step forms is fundamentally different from a "selected item detail" pattern.

**Recommendation:** Apply § 0 cross-cutting only (add loading state from context). Do not migrate to base.

---

### 9. `defi-health-factor` — 220 lines — DeFi domain

**File:** `components/widgets/defi/defi-health-factor-widget.tsx`

| Aspect        | Status                         |
| ------------- | ------------------------------ |
| Data source   | `useDeFiData()` — clean        |
| Mock imports  | None                           |
| Loading state | None ⚠️                        |
| Empty state   | None ⚠️                        |
| Error state   | None ⚠️                        |
| Props         | `WidgetComponentProps` — clean |

**Architecture:** Health factor gauge (colour-coded banner + visual bar with liquidation/warning markers), key metrics grid (buffer, oracle rates, oracle/market gap), rate spread analysis (staking vs borrow, net spread, leverage, leveraged spread), monitoring indicator, emergency exit dialog with cost breakdown and unwind steps.

**Base fit: LOW.** Highly specialized gauge/visualization widget. Not selection-driven — always renders. The emergency exit dialog is unique to this widget. Base header/body/footer slots would be awkward here.

**Recommendation:** Apply § 0 cross-cutting only (add loading state from context). Do not migrate to base.

---

### 10. `defi-reward-pnl` — 70 lines — DeFi domain

**File:** `components/widgets/defi/defi-reward-pnl-widget.tsx`

| Aspect        | Status                         |
| ------------- | ------------------------------ |
| Data source   | `useDeFiData()` — clean        |
| Mock imports  | None                           |
| Loading state | None ⚠️                        |
| Empty state   | None ⚠️                        |
| Error state   | None ⚠️                        |
| Props         | `WidgetComponentProps` — clean |

**Architecture:** Total reward P&L display + horizontal waterfall bars per factor (staking yield, restaking reward, seasonal reward, unrealised) + colour legend.

**Base fit: LOW.** Small widget (70 lines). Base wrapper would add more structural code than it saves. Not selection-driven.

**Recommendation:** Apply § 0 cross-cutting only. Do not migrate to base.

---

### 11. `commodity-regime` — 144 lines — Strategies domain — INLINE MOCKS

**File:** `components/widgets/strategies/commodity-regime-widget.tsx`

| Aspect        | Status                                                                  |
| ------------- | ----------------------------------------------------------------------- |
| Data source   | Inline `MOCK_FACTORS` (lines 29-35) + `MOCK_POSITIONS` (lines 37-43) ⚠️ |
| Mock imports  | **INLINE MOCKS** — hardcoded constants inside widget file ⚠️            |
| Loading state | None ⚠️                                                                 |
| Empty state   | None ⚠️                                                                 |
| Error state   | None ⚠️                                                                 |
| Props         | `WidgetComponentProps` — clean                                          |

**Architecture:** Card with regime badge header + factor scores table (5 rows: factor, score, signal, weight) + active positions table (5 rows: commodity, direction, entry, current, P&L, regime).

**Issues found:**

1. Inline mock data — must move to `strategies-data-context.tsx`
2. Type definitions (`Regime`, `Signal`, `FactorScore`, `CommodityPosition`) should move to domain types
3. `CURRENT_REGIME` is a hardcoded constant — should come from data context
4. No loading/empty/error states

**Recommendation:** Move mocks + types to `strategies-data-context.tsx`, add loading/empty/error states in-place.

---

## Classification Matrix

All 11 widgets remain standalone — no shared base widget.

### Thin Shells — Already correct, § 0 cross-cutting only

| Widget                      | Lines | Delegates to            |
| --------------------------- | ----- | ----------------------- |
| `instructions-detail-panel` | 24    | `InstructionDetailGrid` |
| `sports-fixture-detail`     | 32    | `FixtureDetailPanel`    |
| `pred-market-detail`        | 31    | `MarketDetailPanel`     |
| `options-scenario`          | 10    | `ScenarioTab`           |

### Standalone — Fix issues in-place

| Widget                    | Lines | Issues                                           | Status    |
| ------------------------- | ----- | ------------------------------------------------ | --------- |
| `sports-clv`              | 100   | Mock import, missing props, no empty state       | **FIXED** |
| `sports-ml-status`        | 215   | Inline mocks, missing props, no empty state      | **FIXED** |
| `commodity-regime`        | 144   | Inline mocks, no loading/empty state             | **FIXED** |
| `book-preview-compliance` | 267   | Has domain-specific loading + error — clean      | OK        |
| `bundle-steps`            | 258   | Has empty state — context has no async loading   | OK        |
| `defi-health-factor`      | 220   | Context provides non-null data — no guard needed | OK        |
| `defi-reward-pnl`         | 70    | Context provides non-null data — no guard needed | OK        |

### Why no base widget

The original spec proposed a `DetailPanelWidget` base with header/body/footer slots. After auditing all 11 widgets, the use cases are too divergent:

- 4 are thin shells (10-32 lines) — base adds indirection
- `book-preview-compliance` is a state machine (idle/preview/submitting/success/error)
- `bundle-steps` is an interactive CRUD builder
- `defi-health-factor` is a specialized gauge + emergency exit dialog
- `defi-reward-pnl` is a waterfall chart (70 lines — base would be bigger than the widget)
- Only 3 widgets (`sports-clv`, `sports-ml-status`, `commodity-regime`) share a similar pattern, but their fixes are straightforward without a base

A base for 3 widgets out of 11 adds a layer of abstraction that helps nobody. Fix each widget's issues directly.

---

## Action Items — COMPLETED

### ~~Priority 1 — Mock cleanup (§ 0.3)~~ DONE

1. ~~Move `MOCK_CLV_RECORDS` into `sports-data-context.tsx`~~ — exposed via `useSportsData().clvRecords`
2. ~~Move `MOCK_MODEL_FAMILIES` + `MOCK_FEATURE_FRESHNESS` into `sports-data-context.tsx`~~ — exposed via `useSportsData().modelFamilies` / `.featureFreshness`
3. ~~Move `MOCK_FACTORS` + `MOCK_POSITIONS` + `CURRENT_REGIME` into `strategies-data-context.tsx`~~ — exposed via `useStrategiesData().commodityRegime`
4. ~~Move type definitions~~ — `ModelFamily`, `FeatureFreshness` exported from `sports-data-context.tsx`; `CommodityRegime`, `CommoditySignal`, `FactorScore`, `CommodityPosition`, `CommodityRegimeData` exported from `strategies-data-context.tsx`
5. ~~Update 3 widget files~~ — all 3 now use context hooks, zero `lib/mocks/` imports

### ~~Priority 2 — Props signature fix~~ DONE

1. ~~`sports-clv-widget.tsx`~~ — now accepts `_props: WidgetComponentProps`
2. ~~`sports-ml-status-widget.tsx`~~ — now accepts `_props: WidgetComponentProps`

### ~~Priority 3 — Add loading/empty states~~ DONE

- `sports-clv`: empty state when `clvRecords.length === 0`
- `sports-ml-status`: empty state when `modelFamilies.length === 0`
- `commodity-regime`: loading state from `strategies-data-context.isLoading` + empty state when factors/positions empty
- Remaining 4 widgets: data contexts provide non-null synchronous data — loading/empty guards would be dead code. Will be added when contexts get real API integration.

### ~~Priority 4 — Error boundary enhancement~~ ALREADY DONE

`WidgetErrorBoundary` in `widget-wrapper.tsx` already has a retry button with `handleRetry` + `RefreshCw` icon (lines 40-57). No changes needed.

### Verification

- `tsc --noEmit`: zero errors in modified files
- All pre-existing errors are in unrelated files (data gaps page, deployment form, defi basis trade)
