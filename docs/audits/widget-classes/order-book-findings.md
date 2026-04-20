# § 8 — OrderBookWidget Findings

**Date:** 2026-04-16
**Auditor:** Claude (BP-2 § 8 work unit)
**Status:** FIXES APPLIED

---

## 1. Widget-by-Widget Audit

### 1.1 `order-book` — `terminal/order-book-widget.tsx` (25 lines)

**Classification: THIN SHELL — SKIP MIGRATION**

| Aspect        | Detail                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Layout        | Single `div` wrapper with `flex h-full min-h-0 flex-col overflow-hidden`                          |
| Context       | `useTerminalData()` → destructures `selectedInstrument, bids, asks, livePrice, spread, spreadBps` |
| Delegates to  | `<OrderBook>` from `@/components/trading/order-book`                                              |
| Loading state | **None** — neither widget nor delegate handle loading                                             |
| Empty state   | **None** — no guard for empty bids/asks arrays                                                    |
| Mock imports  | **Clean** — data comes from terminal data context                                                 |

**Notes:**

- Pure prop-forwarding shell: reads context, passes 8 props to `<OrderBook>` with `hideTitle`
- All rendering, controls (Native/USD toggle, decimal selector), spread display, and bid/ask ladder live in `components/trading/order-book.tsx`
- Already correctly structured — wrapping in a base would add indirection with no benefit
- **Action:** Apply § 0 cross-cutting only. No base migration.

---

### 1.2 `depth-chart` — `terminal/depth-chart-widget.tsx` (15 lines)

**Classification: THIN SHELL — SKIP MIGRATION**

| Aspect        | Detail                                                                         |
| ------------- | ------------------------------------------------------------------------------ |
| Layout        | Single `div` wrapper with `absolute inset-0 overflow-auto p-2`                 |
| Context       | `useTerminalData()` → destructures `selectedInstrument, bids, asks, livePrice` |
| Delegates to  | `<DepthChart>` from `@/components/trading/order-book`                          |
| Loading state | **None**                                                                       |
| Empty state   | **None** — no guard for empty bids/asks                                        |
| Mock imports  | **Clean** — data comes from terminal data context                              |

**Notes:**

- Minimal shell (15 lines including imports/types) — pure delegation
- All SVG depth-curve rendering, price labels, and grid lines live in `components/trading/order-book.tsx` `DepthChart` export
- **Action:** Apply § 0 cross-cutting only. No base migration.

---

### 1.3 `markets-live-book` — `markets/markets-live-book-widget.tsx` (186 lines)

**Classification: SUBSTANTIAL — but uses `LiveFeedWidget` base, NOT order-book base**

| Aspect        | Detail                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------- |
| Layout        | Uses `<LiveFeedWidget>` shell with `header`, `footer`, and table body                       |
| Context       | `useMarketsData()` → destructures `liveBookUpdates, assetClass, bookDepth`                  |
| Base used     | `LiveFeedWidget` (from `components/shared/live-feed-widget.tsx`)                            |
| Loading state | **Handled by `LiveFeedWidget`** — `isLoading` prop available but not passed                 |
| Empty state   | **Yes** — `isEmpty={isDefi \|\| rows.length === 0}` with domain-specific message            |
| Mock imports  | **Clean** — data comes from `markets-data-context.tsx` (mocks are in the context, not here) |

**Key observations:**

- This widget is architecturally different from the other two — it renders an HFT-style rolling tape (exchange time, delay, venue, multi-level bid/ask columns, trade column), not a traditional order book ladder
- Uses `useLiveFeed()` ring-buffer hook to cap updates at 500 rows
- Dynamic column generation via `Array.from({ length: bookDepth })` for configurable depth levels
- Has a rich header (venue badges, update count) and footer (colour legend + aggressor explanation)
- Handles DeFi asset class gracefully — shows contextual empty message pointing to DeFi Pool Activity widget
- Inline `<table>` with `font-mono text-[10px]` — HFT terminal aesthetic
- Row highlighting: cyan for market trades, yellow for own trades, green/red for bid/ask updates
- **Already correctly based on `LiveFeedWidget`** — would not benefit from an order-book-specific base

**Action:** Apply § 0 cross-cutting only. Already uses a shared base.

---

## 2. Shared Component Analysis — `components/trading/order-book.tsx`

This is the real shared layer. All traditional order-book rendering lives here (not in widget files).

### 2.1 Exports

| Export                  | Lines     | Purpose                                                               |
| ----------------------- | --------- | --------------------------------------------------------------------- |
| `OrderBook`             | ~155      | Full bid/ask ladder with controls, spread display, last price         |
| `DepthChart`            | ~90       | SVG cumulative depth curve                                            |
| `OrderBookWithDepth`    | ~40       | Combined layout (grid 2-col) — **only used internally, no consumers** |
| `generateMockOrderBook` | re-export | Re-export from `lib/mocks/generators/order-book`                      |

### 2.2 § 0.3 Mock Import Violations in Shared Component

**Two mock imports in `components/trading/order-book.tsx`:**

```ts
import { mock01 } from "@/lib/mocks/generators/deterministic"; // line 7
import { generateMockOrderBook } from "@/lib/mocks/generators/order-book"; // line 11
```

These are used **only** by `OrderBookWithDepth` (lines 313-352) — a standalone combined view that:

- Generates its own mock order book data via `generateMockOrderBook()`
- Uses `mock01()` for deterministic last-price jitter
- Has **zero consumers** (not imported anywhere except within the same file)

**Also:** Line 354 re-exports `generateMockOrderBook` — this re-export is consumed by `use-terminal-page-data.ts`.

**Recommended fix:**

1. Delete `OrderBookWithDepth` — it has no consumers and exists only as a demo/storybook helper
2. Remove the `mock01` import (only used by `OrderBookWithDepth`)
3. Remove the `generateMockOrderBook` re-export from this file — the terminal data context should import directly from `lib/mocks/generators/order-book` (or better, the mock stays only in the data context which is already the correct pattern)

---

## 3. Cross-Cutting Requirements (§ 0) Assessment

### § 0.1 — Widget Error Boundary

**Already in place.** `WidgetErrorBoundary` exists in `components/widgets/widget-wrapper.tsx` (lines 29-52). Every widget rendered through the grid is wrapped via `WidgetBody` → `WidgetContextGuard` → `WidgetErrorBoundary` → `React.Suspense`. No action needed.

### § 0.2 — Widget Loading Skeleton

| Widget              | Loading state?              | Recommendation                                                                                       |
| ------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `order-book`        | **None**                    | Add `isLoading` check from terminal context; render skeleton inside `<OrderBook>` or at widget level |
| `depth-chart`       | **None**                    | Add `isLoading` check from terminal context; render skeleton at widget level                         |
| `markets-live-book` | **Available but not wired** | `LiveFeedWidget` accepts `isLoading` — pass it from markets context                                  |

**Note:** The terminal data context does not currently expose an `isLoading` flag. This would need to be added to `terminal-data-context.tsx` for the terminal widgets to use it. The markets data context should be checked similarly.

### § 0.3 — Mock Import Cleanup

| File                                   | Violation?                                                    | Action                                                       |
| -------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| `terminal/order-book-widget.tsx`       | **Clean**                                                     | None                                                         |
| `terminal/depth-chart-widget.tsx`      | **Clean**                                                     | None                                                         |
| `markets/markets-live-book-widget.tsx` | **Clean**                                                     | None                                                         |
| `components/trading/order-book.tsx`    | **FIXED** — `mock01`, `generateMockOrderBook` imports removed | Deleted `OrderBookWithDepth`, removed mock imports/re-export |

### § 0.4 — Dead Code

- ~~`OrderBookWithDepth` in `components/trading/order-book.tsx` has **zero consumers** — dead code. Delete.~~ **DONE** — deleted.
- ~~The `generateMockOrderBook` re-export on line 354 should be removed.~~ **DONE** — removed.

---

## 4. Base Component Recommendation

### Verdict: DO NOT CREATE `order-book-widget.tsx` base

**Rationale:**

1. **2 of 3 widgets are thin shells** (25 and 15 lines) — pure delegation to existing shared components in `components/trading/order-book.tsx`. A base wrapper around a wrapper adds no value.

2. **The third widget (`markets-live-book`) is architecturally different** — it uses `LiveFeedWidget` as its base and renders an HFT-style rolling update tape, not a traditional order book ladder. Forcing it into an order-book-specific base would be counterproductive.

3. **The real shared logic already exists** in `components/trading/order-book.tsx` — `OrderBook` and `DepthChart` components. This is the de facto "base" and it works well.

4. **No commonality to extract:**
   - `order-book` and `depth-chart` share a data source (terminal context) but render completely different UIs (ladder vs SVG depth curve)
   - `markets-live-book` uses a different data source (markets context) and a different rendering approach (HTML table with rolling rows)

### Completed fixes

| Task                                                       | Status   |
| ---------------------------------------------------------- | -------- |
| Delete `OrderBookWithDepth` dead code                      | **DONE** |
| Remove mock imports from `order-book.tsx`                  | **DONE** |
| Add empty-state guard to `order-book` widget               | **DONE** |
| Add empty-state guard to `depth-chart` widget              | **DONE** |
| Wire `isLoading` to `markets-live-book` via LiveFeedWidget | **DONE** |

**Note on loading states:** The terminal data context (`terminal-data-context.tsx`) does not expose an `isLoading` flag — data hydrates synchronously from mock generators. Empty-state guards were added instead, which cover the only realistic "no data" scenario for these widgets. The markets widget now passes `isLoading` from its context to `LiveFeedWidget`, which already renders a spinner.

---

## 5. Summary

| Widget              | Lines | Classification       | Base migration?    | Mock violation? | Empty state? | Loading?        |
| ------------------- | ----- | -------------------- | ------------------ | --------------- | ------------ | --------------- |
| `order-book`        | 33    | Thin shell           | No                 | Clean           | **Added**    | N/A (sync data) |
| `depth-chart`       | 19    | Thin shell           | No                 | Clean           | **Added**    | N/A (sync data) |
| `markets-live-book` | 187   | LiveFeedWidget-based | No (already based) | Clean           | Yes          | **Wired**       |

**Bottom line:** No new base component created — the three widgets are too dissimilar. Fixes applied: deleted `OrderBookWithDepth` dead code + mock imports from shared component, added empty-state guards to terminal widgets, wired `isLoading` to markets widget. `tsc --noEmit` passes (zero new errors).
