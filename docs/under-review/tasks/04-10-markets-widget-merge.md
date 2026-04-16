# 4.10 Markets — Widget Audit & Merge Plan

> **Status:** DRAFT — awaiting user review
> **WORK_TRACKER ref:** §4.10
> **Page route:** `/services/trading/markets`

---

## Current Widget Inventory

| widgetId | Label | Component | Lines (bytes) | Singleton | Default Preset |
|----------|-------|-----------|---------------|-----------|----------------|
| `markets-controls` | Markets Controls | `MarketsControlsWidget` | ~153 | yes | 12x1 at (0,0) — in all 3 presets |
| `markets-order-flow` | Market Order Flow | `MarketsOrderFlowWidget` | ~100 | yes | 12x7 at (0,1) — "Trade Desk" |
| `markets-live-book` | Live Order Book | `MarketsLiveBookWidget` | ~230 | yes | 12x8 — "Live Book" preset |
| `markets-my-orders` | My Orders | `MarketsMyOrdersWidget` | ~105 | yes | 12x4 — "Live Book" preset |
| `markets-recon` | Reconciliation | `MarketsReconWidget` | ~60 | yes | 6x4 — "Trade Desk" + "Latency" |
| `markets-latency-summary` | Latency Summary | `MarketsLatencySummaryWidget` | ~250 | yes | Various sizes across presets |
| `markets-latency-detail` | Latency Detail | `MarketsLatencyDetailWidget` | ~330 | yes | 7x6 — "Latency" preset |
| `markets-defi-amm` | DeFi Pool Activity | `MarketsDefiAmmWidget` | ~100 | yes | Not in any preset |

**Total: 8 widgets.**

**Data provider:** `MarketsDataProvider` wraps the page. Manages view mode, data mode, date range, asset class, order flow view, book depth, latency data, and order flow data.

**Presets:** 3 presets:
1. **"Trade Desk"** — Controls → Order Flow → Recon (6 cols) + Latency Summary (6 cols)
2. **"Live Book"** — Controls → Live Book → My Orders
3. **"Latency"** — Controls → Latency Summary (5 cols) + Latency Detail (7 cols) → Recon

---

## What Each Widget Does

### markets-controls (153 lines)
- Global controls toolbar: Cross-Section/Time Series view mode, Live/Batch data mode, date range selector.
- Sub-toolbar: Market Orders / Live Book / My Orders view switcher, asset class selector, range, book depth.
- "Generate Report" button (non-functional placeholder).

### markets-order-flow (~100 lines)
- Scrollable order table with timestamps, latency, side, venue, aggressor info.
- Main order flow data display.

### markets-live-book (~230 lines)
- HFT-style order book with bid/ask columns, depth visualization, and legend.
- Real-time book display.

### markets-my-orders (~105 lines)
- Own order history with fill status and order IDs.

### markets-recon (~60 lines)
- Reconciliation runs table: break counts, resolution status, break value.
- Small operational widget.

### markets-latency-summary (~250 lines)
- Service list with p50/p95/p99 latency values.
- Latency view and data toggles.
- Selecting a service drives `markets-latency-detail`.

### markets-latency-detail (~330 lines)
- Selected service KPIs, lifecycle bar chart, time series chart, compare table.
- Detailed latency analysis for the service selected in the summary.
- The largest widget in this domain.

### markets-defi-amm (~100 lines)
- AMM swap / LP style table for DeFi venues.
- Mock data — not in any preset currently.

---

## Data Flow

```
MarketsDataProvider (page.tsx)
├── viewMode, dataMode, dateRange, assetClass → global controls
├── orderFlowView, orderFlowRange, bookDepth → trade desk controls
├── Order flow data, book data, my orders data
├── Latency data (per service)
├── Recon data
├── DeFi AMM data
└── provides all via React Context
    ├── MarketsControlsWidget          reads/writes: all control state
    ├── MarketsOrderFlowWidget         reads: order flow data, controls
    ├── MarketsLiveBookWidget          reads: book data, depth, controls
    ├── MarketsMyOrdersWidget          reads: own orders
    ├── MarketsReconWidget             reads: recon runs data
    ├── MarketsLatencySummaryWidget    reads: latency summary; writes: selected service
    ├── MarketsLatencyDetailWidget     reads: selected service detail
    └── MarketsDefiAmmWidget           reads: DeFi AMM data
```

---

## Testing Checklist

- [ ] **Controls:** View mode, data mode, date range, asset class, order flow view, range, depth all work
- [ ] **Controls:** "Generate Report" button present (acceptable as placeholder)
- [ ] **Order Flow:** Table renders with rows (timestamps, latency, side, venue)
- [ ] **Live Book:** Bid/ask columns render with depth bars
- [ ] **My Orders:** Own order history table has data
- [ ] **Recon:** Reconciliation table shows break counts and resolution status
- [ ] **Latency Summary:** Service list with p50/p95/p99 renders; selecting a service works
- [ ] **Latency Detail:** Shows KPIs, lifecycle bars, time series, compare table for selected service
- [ ] **DeFi AMM:** Table shows swap/LP data (even if mock)
- [ ] **Preset switching:** All 3 presets load correctly and show the right widgets

---

## Merge Proposal

**WORK_TRACKER target:** "Merge controls + order-flow into single Markets panel."

This is the most complex domain in terms of presets (3) and different workflows (trade desk, live book, latency analysis).

### Option A — Merge latency summary + detail, keep everything else (recommended)
- Merge `markets-latency-summary` + `markets-latency-detail` into a single **Latency Analysis** widget (summary as sidebar or top section, detail below).
- These two are tightly coupled (master-detail pattern).
- Keep controls separate (it drives all 3 presets).
- Keep order flow, live book, my orders, recon, defi-amm separate.
- **Result:** 7 widgets.

### Option B — Merge controls into each view widget
- Each widget (order-flow, live-book, my-orders) embeds the relevant controls it needs.
- Problem: duplicates control state management; breaks the shared context pattern.

### Option C — No merge
- The presets already handle the 3 workflows well.
- Each widget has a clear purpose.
- **Result:** 8 widgets (no change).

### Option D — Remove DeFi AMM
- It's mock-only and not in any preset.
- Can be removed or kept as "available to add manually".

---

## Questions for User

1. **Merge scope:** A (latency summary+detail), B (controls into views), C (no merge), or some other combination?
2. **DeFi AMM widget:** Keep or remove? It's not in any preset and is mock data.
3. **3 presets:** Are all 3 useful (Trade Desk, Live Book, Latency)? Should any be consolidated or renamed?
4. **Controls widget:** This is present in all 3 presets as a shared toolbar. Should it stay separate or be embedded?
5. **Any broken data?** Which widgets show empty or broken data when you visit the page?
