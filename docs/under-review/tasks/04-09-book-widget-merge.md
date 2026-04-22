# 4.9 Book — Widget Audit & Merge Plan

> **Status:** LANDED 2026-04-22 — `book-order-form` + `book-algo-config` + `book-record-details` + `book-preview-compliance` merged into `book-order-entry` (Option A). See `unified-trading-pm/plans/active/trading_widget_merge_audit_2026_04_22.plan.md` WU-1. Document retained for historical context.
> **WORK_TRACKER ref:** §4.9
> **Page route:** `/services/trading/book`

---

## Current Widget Inventory

| widgetId | Label | Component | Lines | Singleton | Default Preset |
|----------|-------|-----------|-------|-----------|----------------|
| `book-trade-history` | Trade History | `BookTradeHistoryWidget` | — | yes | 12x8 at (0,0) |
| `book-hierarchy-bar` | Hierarchy Selector | `BookHierarchyBarWidget` | 75 | yes | 12x1 at (0,8) |
| `book-order-form` | Book Order Entry | `BookOrderFormWidget` | 181 | yes | 6x8 at (0,9) |
| `book-algo-config` | Algo Configuration | `BookAlgoConfigWidget` | — | yes | 6x4 at (6,9) |
| `book-record-details` | Record Details | `BookRecordDetailsWidget` | — | yes | 6x3 at (6,13) |
| `book-preview-compliance` | Preview & Compliance | `BookPreviewComplianceWidget` | — | yes | 6x5 at (6,16) |

**Total: 6 widgets.**

**Data provider:** `BookTradeDataProvider` wraps the page. Manages org/client/strategy selection, order form state, execution mode, category, venue, instrument, side, qty, price, algo config, compliance checks, and trade history.

**Presets:** 1 preset ("Default") — Trade History (top, full-width) → Hierarchy Bar → Order Form (left) + Algo Config / Record Details / Preview & Compliance (right stack).

---

## What Each Widget Does

### book-trade-history
- Table of executed trades with search, sort, and filtering.
- Shows historical trades already booked.

### book-hierarchy-bar (75 lines)
- Org → Client → Strategy selector strip.
- Three dropdowns in a row: Organization selector, Client ID input, Strategy selector.
- Drives scoping for the entire book page.

### book-order-form (181 lines)
- Core trade entry form: Execute/Record mode toggle, category tabs (CeFi Spot, CeFi Perp, DeFi, TradFi, Sports, Prediction), venue selector, instrument input, side (buy/sell), quantity, price.
- Preview Order button with access validation.
- Shows user info badge.

### book-algo-config
- Algorithm selector (Market, Limit, TWAP, VWAP, Iceberg) with conditional params.
- Duration, display qty, benchmark fields that appear based on selected algo.

### book-record-details
- Counterparty, source reference, fee fields.
- Only relevant in "Record Only" execution mode.

### book-preview-compliance
- Order preview summary grid.
- Pre-trade compliance checks with pass/fail badges (position limits, concentration risk, venue health, etc.).

---

## Data Flow

```
BookTradeDataProvider (page.tsx)
├── useOrganizationsList() → org list
├── Strategy registry
├── Form state: executionMode, category, venue, instrument, side, qty, price
├── orgId, clientId, strategyId → hierarchy
├── algo config state
├── record-only detail fields
├── orderState, compliance results
├── trade history data
└── provides all via React Context
    ├── BookTradeHistoryWidget      reads: trade history
    ├── BookHierarchyBarWidget      reads/writes: orgId, clientId, strategyId
    ├── BookOrderFormWidget         reads/writes: form fields, orderState
    ├── BookAlgoConfigWidget        reads/writes: algo params
    ├── BookRecordDetailsWidget     reads/writes: counterparty, source, fees
    └── BookPreviewComplianceWidget reads: order preview + compliance results
```

---

## Testing Checklist

- [ ] **Trade History:** Table shows rows of historical trades
- [ ] **Hierarchy Bar:** Org dropdown populates; Client input works; Strategy dropdown populates with live/paper strategies
- [ ] **Order Form:** Execute/Record mode toggle works; category tabs switch venues correctly; all fields accept input
- [ ] **Venue list:** Changes per category (CeFi venues for CeFi Spot, DeFi venues for DeFi, etc.)
- [ ] **Side buttons:** Buy/Sell toggle with correct colours (green/red)
- [ ] **Preview:** Preview button enables when form is filled; generates preview
- [ ] **Algo Config:** Algorithm selector shows correct params per algorithm type
- [ ] **Record Details:** Fields visible; relevant in Record Only mode
- [ ] **Preview & Compliance:** Shows order summary + compliance check results with pass/fail badges

---

## Merge Proposal

**WORK_TRACKER target:** "Merge book hierarchy + order form + record-details + preview/compliance into one."

This page represents a trade booking workflow — the widgets are steps in a flow, not independent views.

### Option A — Merge form widgets, keep history and hierarchy separate (recommended)
- Merge `book-order-form` + `book-algo-config` + `book-record-details` + `book-preview-compliance` into a single **Book Order Entry** widget with sections/tabs.
- Keep `book-trade-history` separate (it's a distinct data display).
- Keep `book-hierarchy-bar` separate (it acts as a global scope selector, like P&L controls).
- **Result:** 3 widgets (trade-history, hierarchy-bar, combined-order-entry).

### Option B — Merge everything except history
- Embed hierarchy bar at the top of the combined order form.
- **Result:** 2 widgets (trade-history, everything-else).

### Option C — Merge all into one
- Single widget: history at top, hierarchy, form, algo, compliance all stacked.
- **Result:** 1 widget. Very large — may hurt UX.

### Option D — No merge
- The current separation maps to workflow steps and keeps widgets small.

---

## Questions for User

1. **Merge scope:** A (form widgets into one, keep history + hierarchy separate), B (everything except history), C (all-in-one), or D (no merge)?
2. **Record Details widget:** Is it useful as a separate widget, or should it always be part of the order form (conditionally shown in Record Only mode)?
3. **Algo Config:** Same question — separate widget or integrated into the order form?
4. **Trade History data:** Does the history table show data, or is it empty?
5. **Compliance checks:** Do the compliance badges show real pass/fail results?
