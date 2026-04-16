# § 7 — HeatmapWidget Findings

**Date:** 2026-04-16
**Status:** AUDIT COMPLETE + FIXES APPLIED
**Auditor:** Claude (Opus 4.6)
**Scope:** 3 heatmap-class widgets

---

## 1. Widget-by-Widget Audit

### 1.1 `risk-strategy-heatmap` (212 lines)

**File:** `components/widgets/risk/risk-strategy-heatmap-widget.tsx`
**Data source:** `useRiskData()` → `strategyRiskHeatmap`, `trippedStrategies`, `killedStrategies`, `scaledStrategies`, plus action handlers (`handleTripCircuitBreaker`, `handleResetCircuitBreaker`, `handleKillSwitch`, `handleScale`)

**Observations:**

- **NOT a true heatmap.** Despite the name, this is a **row-based strategy status list** with colour-coded rows (ok/warning/critical) and action buttons (Trip CB, Reset CB, Scale 50%, Kill Switch). No row × column matrix, no colour gradient, no cell hover — it's structurally closer to a detail-panel or control-bar than a heatmap.
- Uses `WidgetScroll` for vertical scrolling.
- Has an empty state guard (`strategyRiskHeatmap.length === 0`).
- ~~No loading state~~ **FIXED:** Now shows skeleton rows when `isLoading` is true from risk context.
- No mock imports — clean on § 0.3.
- Heavy use of `AlertDialog` for kill switch confirmation.
- Action buttons are disabled in batch mode (`isBatchMode`) and during pending operations (`circuitBreakerPending`).
- `TooltipProvider` is created per-button (6 instances per row) — could be lifted to a single provider but this is a minor performance concern at typical row counts.

**Verdict:** Does NOT belong in a HeatmapWidget base. This widget has zero shared patterns with the other two heatmap widgets (correlation matrix and funding matrix). It's a bespoke risk-action widget. Should be classified as **bespoke** or re-classified under **detail-panel** or **control-bar**.

---

### 1.2 `risk-correlation-heatmap` (27 lines)

**File:** `components/widgets/risk/risk-correlation-heatmap-widget.tsx`
**Delegates to:** `components/risk/correlation-heatmap.tsx` (126 lines, dynamic import)

**Observations:**

- **Thin shell** — 27 lines. Dynamic import of `CorrelationHeatmap` with a skeleton loading fallback.
- The real logic lives in `components/risk/correlation-heatmap.tsx`.
- The delegated component:
  - Fetches its own data via `useCorrelationMatrix()` hook (not from `risk-data-context`).
  - Wraps in `Card` / `CardHeader` / `CardContent` — has its own chrome.
  - Implements full loading state (skeleton), empty state ("No correlation data available"), hover tooltip, and colour legend.
  - Uses a CSS grid for the N×N matrix layout.
  - Custom `correlationColor()` function: red (positive) → white (zero) → blue (negative).
  - Hover reveals a positioned tooltip with row/col label and value.
- **Self-contained.** The domain component already handles loading, empty, hover, and rendering. The widget shell just provides the `overflow-auto` wrapper.
- No mock imports — clean on § 0.3.

**Verdict:** Thin shell, correctly structured. The base would not add value here — the domain component (`CorrelationHeatmap`) already IS the heatmap implementation. Per spec rule: "Thin shell widgets (<50 lines that delegate to a domain component) should NOT be migrated to a base."

---

### 1.3 `defi-funding-matrix` (141 lines)

**File:** `components/widgets/defi/defi-funding-matrix-widget.tsx`
**Data source:** `useDeFiData()` → `fundingRates`

**Observations:**

- **True matrix/heatmap.** Coins × Venues table with colour-coded cells (emerald ≥5%, amber 2.5–5%, greyed <2.5%).
- Uses a `<table>` element (not CSS grid like `correlation-heatmap`).
- `useMemo` for best-venue-per-coin computation and venue averages.
- Helper functions `rateColor()` and `rateBg()` for cell colouring.
- Has a footer row (averages per venue) and a colour legend.
- No loading state — DeFi context is fully synchronous (no `isLoading` flag available).
- ~~No empty state guard~~ **FIXED:** Now shows "No funding rate data" when `coins` array is empty.
- ~~**§ 0.3 VIOLATION:**~~ **FIXED:** `FUNDING_RATE_VENUES` and `FUNDING_RATE_FLOOR` moved from `lib/mocks/fixtures/defi-walkthrough.ts` to `lib/config/services/defi.config.ts`. Originals deleted from mock file.
- Best-venue highlighting (bold + underline) is a nice domain-specific feature.

**Verdict:** Could benefit from a base that provides loading/empty states and matrix layout, but there's only one other true matrix widget (`correlation-heatmap`) and that one is already self-contained via its domain component. Forcing both into a shared base would add indirection without meaningful deduplication.

---

## 2. Cross-Widget Pattern Analysis

### Shared Patterns (what COULD go in a base)

| Pattern                   | `risk-strategy-heatmap` | `risk-correlation-heatmap`    | `defi-funding-matrix`   |
| ------------------------- | ----------------------- | ----------------------------- | ----------------------- |
| Matrix layout (row × col) | **No** (row list)       | Yes (CSS grid)                | Yes (`<table>`)         |
| Colour-coded cells        | No (row-level colour)   | Yes (gradient)                | Yes (threshold)         |
| Cell hover tooltip        | No                      | Yes (custom positioned)       | No                      |
| Loading state             | No                      | Yes (in domain component)     | No                      |
| Empty state               | Yes (text message)      | Yes (in domain component)     | No                      |
| Scrolling                 | `WidgetScroll` vertical | `overflow-auto` div           | `overflow-x-auto` div   |
| Data source               | `useRiskData()` context | `useCorrelationMatrix()` hook | `useDeFiData()` context |

### Key Finding: No Shared Pattern Across All 3

- `risk-strategy-heatmap` is **misclassified** — it's not a heatmap, it's a strategy status list with action buttons.
- `risk-correlation-heatmap` is a **thin shell** delegating to a self-contained domain component.
- `defi-funding-matrix` is the only widget that could benefit from a heatmap base, but with only 1 candidate, a base adds indirection without deduplication.

---

## 3. Recommendations

### 3.1 — Do NOT Create `heatmap-widget.tsx` Base

**Rationale:**

- Only 1 of 3 widgets is a true heatmap that isn't already self-contained.
- The spec says "Bespoke widgets are OUT OF SCOPE" and "Thin shell widgets should NOT be migrated to a base."
- `risk-strategy-heatmap` should be reclassified out of the heatmap category.
- `risk-correlation-heatmap` is a thin shell — only apply cross-cutting requirements.
- Creating a base for a single consumer (`defi-funding-matrix`) violates the "don't abstract for one use" principle.

### 3.2 — Reclassify `risk-strategy-heatmap`

Move to **bespoke** category. It shares no structural patterns with the matrix/heatmap widgets. It's a domain-specific risk-action panel with colour-coded status rows.

### 3.3 — ~~Fix § 0.3 Violation on `defi-funding-matrix`~~ DONE

`FUNDING_RATE_VENUES` and `FUNDING_RATE_FLOOR` moved to `lib/config/services/defi.config.ts` (alongside other DeFi reference data like `DEFI_VENUE_DISPLAY`, `DEFI_CHAINS`, etc.). Originals deleted from `lib/mocks/fixtures/defi-walkthrough.ts`.

### 3.4 — ~~Add Loading/Empty States~~ DONE

| Widget                     | Loading state                                 | Empty state                         |
| -------------------------- | --------------------------------------------- | ----------------------------------- |
| `risk-strategy-heatmap`    | **FIXED** — skeleton rows when `isLoading`    | Already had                         |
| `risk-correlation-heatmap` | Already handled by domain component           | Already handled by domain component |
| `defi-funding-matrix`      | N/A — context is synchronous (no `isLoading`) | **FIXED** — guard for empty `coins` |

### 3.5 — § 0.1 Widget Error Boundary

Already in place at `widget-wrapper.tsx:29-52`. All 3 widgets are wrapped via `WidgetErrorBoundary` in the `WidgetBody` renderer. No action needed.

### 3.6 — ~~Add Retry Button to Error Boundary~~ Already Present

`WidgetErrorBoundary` already includes a Retry button with `RefreshCw` icon that resets error state. No action needed.

---

## 4. Issues Found

| #   | Widget                  | Issue                                                                 | Severity | Status      |
| --- | ----------------------- | --------------------------------------------------------------------- | -------- | ----------- |
| 1   | `defi-funding-matrix`   | Imports `FUNDING_RATE_VENUES`, `FUNDING_RATE_FLOOR` from `lib/mocks/` | Medium   | **FIXED**   |
| 2   | `defi-funding-matrix`   | No loading state                                                      | Low      | N/A (sync)  |
| 3   | `defi-funding-matrix`   | No empty state guard                                                  | Low      | **FIXED**   |
| 4   | `risk-strategy-heatmap` | No loading state                                                      | Low      | **FIXED**   |
| 5   | `risk-strategy-heatmap` | Misclassified as "heatmap"                                            | Low      | Noted       |
| 6   | All                     | Error boundary lacks Retry button                                     | Low      | Already had |

---

## 5. Summary

| Metric                 | Value                                                                |
| ---------------------- | -------------------------------------------------------------------- |
| Widgets audited        | 3                                                                    |
| True heatmaps          | 1 (`defi-funding-matrix`) + 1 self-contained (`correlation-heatmap`) |
| Thin shells            | 1 (`risk-correlation-heatmap` — 27 lines)                            |
| Misclassified          | 1 (`risk-strategy-heatmap` — status list, not heatmap)               |
| Mock import violations | ~~1~~ → 0 (fixed)                                                    |
| Missing loading states | ~~2~~ → 0 (1 fixed, 1 N/A — sync context)                            |
| Missing empty states   | ~~1~~ → 0 (fixed)                                                    |
| **Base recommended**   | **No** — insufficient shared patterns across children                |

---

## 6. Changes Applied

| File                                                       | Change                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `lib/config/services/defi.config.ts`                       | Added `FUNDING_RATE_VENUES` and `FUNDING_RATE_FLOOR` constants   |
| `lib/mocks/fixtures/defi-walkthrough.ts`                   | Removed duplicate `FUNDING_RATE_VENUES` and `FUNDING_RATE_FLOOR` |
| `components/widgets/defi/defi-funding-matrix-widget.tsx`   | Import from config instead of mocks; added empty state guard     |
| `components/widgets/risk/risk-strategy-heatmap-widget.tsx` | Added `isLoading` skeleton state from risk context               |
