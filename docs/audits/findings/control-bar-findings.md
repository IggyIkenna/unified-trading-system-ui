# § 5 — ControlBarWidget Findings

**Date:** 2026-04-16
**Auditor:** Claude (BP-2 § 5 work unit)
**Status:** AUDIT COMPLETE — NO BASE CREATED
**Decision:** Control bars are contextual widgets that work alongside other widgets, not standalone. They will be merged with their companion widgets. No base class warranted.

---

## 1. Widget-by-Widget Audit

### 1.1 `pnl-controls` — `pnl/pnl-controls-widget.tsx` (4 lines)

**Classification: DEAD CODE — DELETE**

```ts
// Controls (live/batch, date range, group-by, currency, report button, residual alert)
// are now embedded in the PnlWaterfallWidget header.
// This file can be safely deleted once any remaining references are confirmed gone.
export {};
```

- Already unregistered — not present in `pnl/register.ts`
- Related dead file: `pnl/pnl-report-button-widget.tsx` (3 lines, same `export {}` pattern)
- Both referenced in § 0.4 as known dead code
- **Action:** Delete both files. No registration cleanup needed — already removed.

---

### 1.2 `options-control-bar` — `options/options-control-bar-widget.tsx` (33 lines)

**Classification: THIN SHELL — SKIP MIGRATION**

- Pure prop-forwarding: reads `useOptionsData()` context, passes 20 props to `<OptionsToolbar>`
- Real control-bar logic lives in `components/trading/options-futures` → `OptionsToolbar`
- No layout code, no loading/error state (delegated component handles everything)
- Clean on § 0.3 (no mock imports)
- **Action:** Apply § 0 cross-cutting only. No base migration — already correctly structured.

---

### 1.3 `scope-summary` — `overview/scope-summary-widget.tsx` (75 lines)

**Classification: SUBSTANTIAL — MIGRATE TO BASE**

| Aspect        | Detail                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| Layout        | `flex flex-wrap items-center justify-between gap-2 px-3 py-2 h-full`                                                 |
| Context       | `useOverviewDataSafe()` + `useGlobalScope()` store                                                                   |
| Components    | Delegates to `<ScopeSummary>` (left) + `<InterventionControls>` + link button (right)                                |
| Loading state | **None**                                                                                                             |
| Empty state   | Yes — renders "Navigate to Overview tab" when context missing                                                        |
| Mock imports  | **§ 0.3 VIOLATION** — imports `type { TradingOrganization, TradingClient }` from `@/lib/mocks/fixtures/trading-data` |

**Mock import detail:** The import is **type-only** (`import type`), not runtime data. The `overview-data-context.tsx` also imports these same types from the mock file. Fix: move `TradingOrganization` and `TradingClient` interfaces to `lib/types/trading.ts` and update both imports. This is a shared concern with the overview data context, not just this widget.

---

### 1.4 `instrument-bar` — `terminal/instrument-bar-widget.tsx` (130 lines)

**Classification: SUBSTANTIAL — MIGRATE TO BASE**

| Aspect        | Detail                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout        | `flex items-center gap-3 px-3 h-full flex-wrap`                                                                                                   |
| Context       | `useTerminalData()`                                                                                                                               |
| Components    | Instrument `<Select>`, account `<Select>`, live price display with `<Badge>`, live/batch mode badge, action buttons (refresh, settings, maximize) |
| Loading state | **None**                                                                                                                                          |
| Empty state   | **None**                                                                                                                                          |
| Mock imports  | Clean                                                                                                                                             |

**Notes:**

- Uses `flex-1` spacer div to push action buttons right — maps to `left`/`right` slot pattern
- Contains domain-specific `formatPrice` helper inline
- Live price display is data-derived (from context), but this is presentation, not data loading

---

### 1.5 `book-hierarchy-bar` — `book/book-hierarchy-bar-widget.tsx` (75 lines)

**Classification: SUBSTANTIAL — MIGRATE TO BASE**

| Aspect        | Detail                                                                              |
| ------------- | ----------------------------------------------------------------------------------- |
| Layout        | `px-2 py-2 flex items-center gap-4 flex-wrap`                                       |
| Context       | `useBookTradeData()`                                                                |
| Components    | Org `<Select>`, client `<Input>`, strategy `<Select>` — each with a `<label>`       |
| Loading state | **None**                                                                            |
| Empty state   | **None** (shows "No organizations" disabled item if empty, but no full empty state) |
| Mock imports  | Clean                                                                               |

**Notes:**

- Simplest of the substantial widgets — three labeled controls in a row
- Cascading selection: changing org resets client

---

### 1.6 `markets-controls` — `markets/markets-controls-widget.tsx` (152 lines)

**Classification: SUBSTANTIAL — MIGRATE TO BASE (with caveats)**

| Aspect        | Detail                                                                                                                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout        | `flex flex-col gap-3 p-1` → two rows of `flex flex-wrap`                                                                                                                                            |
| Context       | `useMarketsData()`                                                                                                                                                                                  |
| Components    | Row 1: view mode toggle group, data mode toggle group, date range `<Select>`, report button. Row 2: order flow view buttons, asset class `<Select>`, range `<Select>`, conditional depth `<Select>` |
| Loading state | **None**                                                                                                                                                                                            |
| Empty state   | **None**                                                                                                                                                                                            |
| Mock imports  | Clean                                                                                                                                                                                               |

**Notes:**

- **Two-row layout** — does NOT match the single-row horizontal flex of other control bars
- Row 2 has a `border-t` separator
- Conditional rendering: depth select only shows when `orderFlowView === "book"` and `assetClass !== "defi"`
- Largest control bar by line count and control density
- The base would need to support multi-row or the widget would override the base layout via `className`

---

### 1.7 `sports-live-scores` — `sports/sports-live-scores-widget.tsx` (60 lines)

**Classification: DOMAIN-SPECIFIC — ASSESS BASE VALUE**

| Aspect        | Detail                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| Layout        | `flex items-stretch h-full min-h-[2rem] overflow-x-auto gap-px bg-border/30 rounded border border-border` |
| Context       | `useSportsData()`                                                                                         |
| Components    | WS connection dot + horizontally scrollable live match buttons with scores and minute indicators          |
| Loading state | **None**                                                                                                  |
| Empty state   | Yes — "No live matches" centered message                                                                  |
| Mock imports  | Clean                                                                                                     |

**Notes:**

- This is a **live ticker / scoreboard**, not a traditional control bar with selects/toggles
- Completely different layout semantics: `overflow-x-auto`, `gap-px`, border wrapping
- `useMemo` filters fixtures to live/HT/SUSP status
- Includes WebSocket connection status indicator
- **Verdict:** The base adds no value here. The layout is unique and the widget has nothing in common with the other control bars except being a horizontal strip.

---

## 2. Cross-Cutting Requirements Status

### § 0.1 — Widget Error Boundary

**ALREADY IN PLACE.** `WidgetErrorBoundary` exists in `components/widgets/widget-wrapper.tsx:29-52`. All widgets are wrapped via the `WidgetBody` component (line 77). No action needed.

### § 0.2 — Widget Loading Skeleton

**Not applicable per spec.** The spec states: "No loading/error states (control bars display controls, not data)." However, `scope-summary` displays data-derived KPI values and `instrument-bar` displays live prices. These widgets would benefit from a loading skeleton when their data context is loading, but this is domain data presentation, not a control bar concern. **Recommendation:** Add optional `isLoading` support to the base but don't enforce it.

### § 0.3 — Mock Import Cleanup

| Widget          | Violation                                                                                     | Fix                                                                                                                             | Status   |
| --------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `scope-summary` | `import type { TradingOrganization, TradingClient } from "@/lib/mocks/fixtures/trading-data"` | Moved interfaces to `lib/types/trading.ts`. Updated `overview-data-context.tsx`, `use-trading.ts`, `use-overview-page-data.ts`. | **DONE** |
| All others      | Clean                                                                                         | —                                                                                                                               | —        |

### § 0.4 — Dead Code

| File                               | Lines | Action                                  | Status   |
| ---------------------------------- | ----- | --------------------------------------- | -------- |
| `pnl/pnl-controls-widget.tsx`      | 4     | **Delete** — stub, already unregistered | **DONE** |
| `pnl/pnl-report-button-widget.tsx` | 3     | **Delete** — stub, already unregistered | **DONE** |

---

## 3. Base Widget Decision: NOT CREATING

Control bars are contextual widgets that work alongside other widgets (e.g., `instrument-bar` serves `order-book`, `order-entry`; `scope-summary` drives `strategy-table`, `kpi-strip`). They don't provide standalone value and will eventually be merged with their companion widgets. Creating a base class for them would add indirection to widgets that are already headed for absorption.

Additional reasons:

- The layout is 1 line of Tailwind — a base class saves nothing
- Each bar has a different layout: single-row flex, two-row flex-col, horizontal ticker
- No shared loading/error state needed (controls, not data)
- The thinnest widgets (33-line `options-control-bar`) are already correctly structured as delegation shells

---

## 4. Issues Found & Remediation

| #   | Severity | Widget               | Issue                                                                                           | Status                                      |
| --- | -------- | -------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | Medium   | `scope-summary`      | Type import from `@/lib/mocks/fixtures/trading-data` — § 0.3 violation (type-only, not runtime) | **FIXED** — moved to `lib/types/trading.ts` |
| 2   | Low      | `pnl-controls`       | Dead code — 4-line stub with `export {}`                                                        | **DELETED**                                 |
| 3   | Low      | `pnl-report-button`  | Dead code — 3-line stub with `export {}`                                                        | **DELETED**                                 |
| 4   | Info     | All 5 substantial    | No loading state — acceptable per spec, but `scope-summary` and `instrument-bar` display data   | No action                                   |
| 5   | Info     | `sports-live-scores` | Not a control bar pattern — horizontal ticker with WS status                                    | No action                                   |
