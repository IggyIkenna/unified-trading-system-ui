# 4.1 Positions — Widget Audit & Merge Plan

> **Status:** APPROVED — ready for agent implementation
> **WORK_TRACKER ref:** §4.1
> **Page route:** `/services/trading/positions`

---

## Current Widget Inventory

| widgetId | Label | Component | Lines | Singleton | Default Preset |
|----------|-------|-----------|-------|-----------|----------------|
| `positions-kpi-strip` | Position Summary | `PositionsKpiWidget` | 45 | yes | 12x2 at (0,0) |
| `account-balances` | Account Balances | `AccountBalancesWidget` | 79 | yes | 12x3 at (0,2) |
| `positions-table` | Positions Table | `PositionsTableWidget` | 272 | yes | 12x8 at (0,5) |

**Data provider:** `PositionsDataProvider` (413 lines) wraps the entire page in `positions/page.tsx`. All three widgets consume `usePositionsData()`.

---

## Decisions (user-approved)

### 1. Remove Account Balances widget

The `account-balances` widget (`AccountBalancesWidget`) is **deleted** from the positions page. The Accounts page (`/services/trading/accounts`) already has a richer `accounts-balance-table` (Per-Venue Balances) + `accounts-margin-util` (Margin Utilization) — this widget was a duplicate.

**Files to change:**

- **Delete** `components/widgets/positions/account-balances-widget.tsx`
- **Remove** the `account-balances` registration and import from `components/widgets/positions/register.ts`
- **Remove** the `account-balances` entry from the default preset layout in `register.ts`
- **Remove** `balances`, `balancesLoading` from `PositionsDataProvider` if no other widget uses them (check first — currently only `AccountBalancesWidget` reads these)
- **Remove** `useBalances()` import in `positions-data-context.tsx` if unused after widget deletion

### 2. Position Summary — responsive grid layout

Keep `positions-kpi-strip` as a **separate** widget. Currently it renders via `<KpiStrip columns={6}>` which forces a single horizontal row.

**Change:** Make the KPI cards responsive so they adapt to the widget's container dimensions:

- Replace the fixed `columns={6}` with a responsive CSS grid using `auto-fill` / `auto-fit` with a `minmax()` approach
- Each card has a min width (~140px) so:
  - **Full-width (12 cols):** all 6 cards side by side (6×1)
  - **Half-width (6 cols):** 3 × 2 grid
  - **Narrow/vertical (3–4 cols):** 2 × 3 grid
  - **Very narrow (1–2 cols):** stacked vertically (1×6)
- The `KpiStrip` shared component uses a `GRID_COLS` map with fixed column classes. The positions KPI widget should bypass this and use its own responsive grid, or the `KpiStrip` component should be enhanced to support a `responsive` mode. Prefer enhancing `KpiStrip` since other pages will benefit.

**Widget registration `minW` / `minH` change:**

- Currently `positions-kpi-strip` has `minW: 4, minH: 1` — this prevents the user from making the widget narrower than 4 grid columns, which blocks 2×3 or 1×6 layouts
- Change to `minW: 2, minH: 1` so the widget can be resized down to 2 columns wide (cards will reflow into a vertical stack)
- `minH` should also be raised to `minH: 2` to accommodate multi-row layouts when narrow

**Files to change:**

- `components/shared/kpi-strip.tsx` — add a `responsive?: boolean` prop. When `true`, use `grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))` style instead of the fixed `GRID_COLS` class
- `components/widgets/positions/positions-kpi-widget.tsx` — pass `responsive` to `<KpiStrip>`
- `components/widgets/positions/register.ts` — change `positions-kpi-strip` registration: `minW: 4` → `minW: 2`, `minH: 1` → `minH: 2`

### 3. Positions Table — filter bar overhaul

**Remove:**

- The "Hide Filters" / "Show Filters" toggle button and the `showFilters` state
- The "Filters" text/label below the toggle

**Keep:**

- Search bar
- Strategy dropdown
- Venue dropdown
- Side dropdown
- Live / Refresh / Export buttons on the right side

**Change — Asset Class filter:**

- The row of `instrumentTypes` buttons (`All`, `Spot`, `Perp`, `Futures`, `Options`, `DeFi`, `Prediction`) is currently a row of toggle buttons where only one can be selected at a time
- Replace with a **multi-select dropdown** (similar to venue/strategy dropdowns but with checkboxes)
- User can select multiple asset classes at once (e.g. show Spot + Perp together)
- "All" is the default (no filter applied)
- Update `instrumentTypeFilter` from `InstrumentType` (single) to `InstrumentType[]` (array) in both `PositionsDataProvider` and the widget

**Files to change:**

- `components/widgets/positions/positions-table-widget.tsx`:
  - Remove `showFilters` state, the toggle `<button>`, and the conditional `{showFilters && ...}` wrapper
  - Replace `instrumentTypes` buttons with a multi-select dropdown component
  - Filters should always be visible (no toggle)
- `components/widgets/positions/positions-data-context.tsx`:
  - Change `instrumentTypeFilter: InstrumentType` → `instrumentTypeFilters: InstrumentType[]`
  - Change `setInstrumentTypeFilter` → `setInstrumentTypeFilters`
  - Update `filteredPositions` logic to filter by `instrumentTypeFilters.length === 0 || instrumentTypeFilters.includes(classifyInstrument(p.instrument))`

### 4. Health column — remove

The "Health" column currently shows `health_factor` only for DeFi venues and `—` for everything else. No data is populated in the mock (`health_factor` is not set in `SEED_POSITIONS` or the data context mapping). **Remove the column entirely.**

**Files to change:**

- `components/widgets/positions/positions-table-widget.tsx` — remove the `health_factor` column definition from the `columns` array
- `components/widgets/positions/positions-data-context.tsx` — remove `health_factor` from the `PositionRecord` interface and `isDeFiVenue` from the context (if unused elsewhere after column removal)

### 5. P&L columns — split into Today's P&L and Net P&L

Currently there is a single "P&L" column showing `pnl` (absolute $) and `pnl_pct` (%). Replace with **two columns**:

**Column: "Today's P&L"**

- Shows today's unrealized P&L change (the difference between current price and today's open price)
- Display: absolute $ value and % change
- Color-coded green/red

**Column: "Net P&L"**

- Shows the total unrealized P&L since position entry (current logic)
- Display: absolute $ value and % change
- Color-coded green/red

**Data changes:**

- Add `today_pnl` and `today_pnl_pct` fields to `PositionRecord` in the data context
- In the mock data mapping (inside `PositionsDataProvider`), compute `today_pnl` as a fraction of the total unrealized PnL (simulate a daily slice, e.g. ~10–30% of total unrealized PnL with some randomness seeded by position id)
- Rename existing `pnl` → `net_pnl` and `pnl_pct` → `net_pnl_pct` for clarity

**Files to change:**

- `components/widgets/positions/positions-data-context.tsx` — update `PositionRecord` interface, add `today_pnl`, `today_pnl_pct`, rename `pnl` → `net_pnl`, `pnl_pct` → `net_pnl_pct`
- `components/widgets/positions/positions-table-widget.tsx` — replace single P&L column with two columns
- `components/widgets/positions/positions-kpi-widget.tsx` — update to use renamed fields if applicable

### 6. Trades drill-down — new "Trades" column

Add a **last column** to the positions table that links to a trade history view for that position.

**UI:**

- Column header: "Trades" (or icon-only column)
- Each row shows a small button/link (e.g. `View trades →` or an icon like `ExternalLink`)
- Clicking navigates to `/services/trading/positions/trades?position_id={positionId}`

**New page: `/services/trading/positions/trades/page.tsx`**

- Reads `position_id` from search params
- Shows a table of all trades that created/modified this position
- Columns: Trade ID, Timestamp, Side, Quantity, Price, Fees, Total, Type (Exchange/OTC/DeFi), Counterparty, Status
- Filter by: side, type

**Mock data alignment:**

The seed data in `mock-data-seed.ts` already has trades (`SEED_TRADES`) that partially align with positions. The trades reference the same `strategyId` and `instrument`. However, the alignment is not perfect — some positions don't have corresponding trades, and trade quantities don't sum to position quantities.

**Required seed data changes in `mock-data-seed.ts`:**

For each position in `SEED_POSITIONS`, ensure there is at least one trade (and ideally 2–5 trades) in `SEED_TRADES` where:
- `instrument` matches the position's `instrument`
- `strategyId` matches
- `venue` matches
- The **net quantity** of all trades for that (instrument, strategy, venue) combination equals the position's `quantity`
  - For LONG positions: sum of buy quantities - sum of sell quantities = position quantity
  - For SHORT positions: sum of sell quantities - sum of buy quantities = position quantity
- Trade prices should average out to approximately the position's `entryPrice`
- Add a `positionId` field to `SeedTrade` so we can directly link trades to positions

**New helper in `mock-data-index.ts`:**

- `getTradesForPosition(positionId: string): SeedTrade[]` — returns all trades linked to a specific position

---

## Updated Default Preset Layout

After removing `account-balances`, the preset becomes:

```
positions-kpi-strip → 12x2 at (0,0)
positions-table     → 12x10 at (0,2)    (taller — takes the space freed by balances)
```

---

## Summary of All File Changes

| File | Action |
|------|--------|
| `components/widgets/positions/account-balances-widget.tsx` | DELETE |
| `components/widgets/positions/register.ts` | Remove account-balances widget + update preset |
| `components/widgets/positions/positions-data-context.tsx` | Remove balances, update instrumentTypeFilter to array, add today_pnl/net_pnl fields, remove health_factor, remove isDeFiVenue |
| `components/widgets/positions/positions-kpi-widget.tsx` | Pass `responsive` to KpiStrip, update field names |
| `components/widgets/positions/register.ts` | Also update `positions-kpi-strip` minW: 4 → 2, minH: 1 → 2 |
| `components/widgets/positions/positions-table-widget.tsx` | Remove filters toggle, remove health column, replace instrument type buttons with multi-select dropdown, split P&L into 2 columns, add trades column |
| `components/shared/kpi-strip.tsx` | Add `responsive` mode with auto-fill grid |
| `lib/mocks/fixtures/mock-data-seed.ts` | Add `positionId` to SeedTrade, ensure trades align with positions (quantities sum correctly) |
| `lib/mocks/fixtures/mock-data-index.ts` | Add `getTradesForPosition()` helper |
| `app/(platform)/services/trading/positions/trades/page.tsx` | NEW — trades drill-down page |

---

## IMPORTANT — Check Current State First

**The user may have already made manual changes to the positions widgets.** Before implementing anything, read the current versions of these files and incorporate any changes already present:

- `components/widgets/positions/positions-kpi-widget.tsx`
- `components/widgets/positions/positions-table-widget.tsx`
- `components/widgets/positions/positions-data-context.tsx`
- `components/widgets/positions/register.ts`
- `components/shared/kpi-strip.tsx`

Do NOT overwrite or revert any manual changes. Build on top of what's already there. If a decision listed in this doc has already been partially or fully implemented, skip it and move on to the remaining items.

## Implementation Order

1. Update mock data — align trades to positions, add `positionId` to `SeedTrade`
2. Add `getTradesForPosition()` to `mock-data-index.ts`
3. Delete `account-balances-widget.tsx`, clean up `register.ts` and data context
4. Enhance `KpiStrip` with responsive mode (if not already done)
5. Overhaul positions table: remove filter toggle, remove health column, add multi-select asset class dropdown, split P&L columns, add trades column (skip anything already done)
6. Create `/services/trading/positions/trades/page.tsx`
7. Update default preset in `register.ts`
