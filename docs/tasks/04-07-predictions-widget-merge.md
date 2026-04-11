# 4.7 Predictions — Widget Audit & Merge Plan

> **Status:** DRAFT — awaiting user review
> **WORK_TRACKER ref:** §4.7
> **Page route:** `/services/trading/predictions`

---

## Current Widget Inventory

| widgetId | Label | Component | Lines | Singleton | Default Preset |
|----------|-------|-----------|-------|-----------|----------------|
| `pred-markets-grid` | Markets | `PredMarketsGridWidget` | 54 | yes | 8x7 at (0,0) |
| `pred-market-detail` | Market Detail | `PredMarketDetailWidget` | — | yes | Not in default preset |
| `pred-portfolio-kpis` | Portfolio KPIs | `PredPortfolioKpisWidget` | 37 | yes | 12x2 at (0,7) |
| `pred-open-positions` | Open Positions | `PredOpenPositionsWidget` | — | yes | 12x4 at (0,9) |
| `pred-settled-positions` | Settled Positions | `PredSettledPositionsWidget` | — | yes | Not in default preset |
| `pred-odum-focus` | ODUM Focus | `PredOdumFocusWidget` | — | yes | In "Arb Focus" preset |
| `pred-arb-stream` | Arb Stream | `PredArbStreamWidget` | — | yes | In "Arb Focus" preset |
| `pred-arb-closed` | Closed Arbs | `PredArbClosedWidget` | — | yes | In "Arb Focus" preset |
| `pred-trade-panel` | Quick Trade | `PredTradePanelWidget` | 25 | yes | 4x7 at (8,0) |
| `pred-top-markets` | Top Markets | `PredTopMarketsWidget` | — | yes | Not in any preset |
| `pred-recent-fills` | Recent Trades | `PredRecentFillsWidget` | — | yes | In "Arb Focus" preset |

**Total: 11 widgets** — the largest domain.

**Data provider:** `PredictionsDataProvider` wraps the page. Manages markets, positions, bets, arb data, filters.

**Presets:** 2 presets:
1. **"Default"** — Markets grid (8 cols) + Quick Trade (4 cols) → Portfolio KPIs → Open Positions
2. **"Arb Focus"** — Arb Stream + Closed Arbs + ODUM Focus + Recent Fills

---

## What Each Widget Does

### pred-markets-grid (54 lines)
- Card grid of prediction markets (binary + multi-outcome).
- FilterBar with category, venue, sort, search.
- Clicking a market sets `selectedMarketId`.

### pred-market-detail
- Single market deep dive: price history, order book summary, trade entry.
- Driven by `selectedMarketId` from markets grid.

### pred-portfolio-kpis (37 lines)
- 4 KPIs: Open Positions count, Total Staked, Unrealised P&L, Win Rate.

### pred-open-positions
- DataTable of open prediction positions with entry/current price and P&L.

### pred-settled-positions
- Collapsible table of settled positions with win/loss/void outcome.

### pred-odum-focus
- ODUM (Odds Divergence Under Modelling) — dual-axis price/odds charts.
- Divergence signals for crypto, TradFi, and football.

### pred-arb-stream
- Live arb opportunities with decay bars and execute actions.

### pred-arb-closed
- Collapsed list of closed/decayed arb opportunities.

### pred-trade-panel (25 lines)
- Market selector + trade panel with Kelly stake suggestion.

### pred-top-markets
- Top markets by volume as quick-access cards.

### pred-recent-fills
- Recent prediction market fills table.

---

## Data Flow

```
PredictionsDataProvider (page.tsx)
├── Markets data, positions, bets, arb opportunities
├── Filters (category, venue, search, sort)
├── selectedMarketId, quickTradeMarketId
├── filteredMarkets → derived
├── portfolioKpis → derived
└── provides all via React Context
    ├── PredMarketsGridWidget     reads: filteredMarkets, filters; writes: selectedMarketId
    ├── PredMarketDetailWidget    reads: selectedMarket
    ├── PredPortfolioKpisWidget   reads: openPositions, settledPositions, portfolioKpis
    ├── PredOpenPositionsWidget   reads: openPositions
    ├── PredSettledPositionsWidget reads: settledPositions
    ├── PredOdumFocusWidget       reads: ODUM data
    ├── PredArbStreamWidget       reads: live arb opportunities
    ├── PredArbClosedWidget       reads: closed arbs
    ├── PredTradePanelWidget      reads: markets, quickTradeMarketId; writes: placeTrade
    ├── PredTopMarketsWidget      reads: markets (sorted by volume)
    └── PredRecentFillsWidget     reads: recent fills
```

---

## Testing Checklist

- [ ] **Markets Grid:** Cards render with titles, prices, venues
- [ ] **Markets Filters:** Category, venue, search, sort all work
- [ ] **Market Detail:** Selecting a market shows price history + order book
- [ ] **Quick Trade:** Market selector works; trade panel renders with Kelly suggestion
- [ ] **Portfolio KPIs:** All 4 metrics show real values
- [ ] **Open Positions:** Table has rows with P&L
- [ ] **Settled Positions:** Table has rows with win/loss/void outcomes
- [ ] **ODUM Focus:** Charts render with dual-axis data and divergence signals
- [ ] **Arb Stream:** Live arbs show with decay bars
- [ ] **Closed Arbs:** History of closed arbs renders
- [ ] **Top Markets:** Volume-sorted cards appear
- [ ] **Recent Fills:** Recent trades table has data

---

## Merge Proposal

**WORK_TRACKER target:** "Single Predictions console (markets grid, trade panel, portfolio KPIs)."

This domain is the largest (11 widgets) and already has 2 presets for different workflows.

### Option A — Merge KPIs into positions, keep other widgets separate (recommended)
- Merge `pred-portfolio-kpis` as a sticky header inside `pred-open-positions`.
- Merge `pred-settled-positions` as a collapsible section inside `pred-open-positions`.
- Keep everything else separate — the workflows (market browsing vs arb hunting vs ODUM analysis) are too different to merge.
- **Result:** 9 widgets (merged: positions-with-kpis-and-settled).

### Option B — Merge Markets + Detail + Trade into one
- Single tabbed widget for market discovery + detail + trading.
- Risk: becomes very large; loses layout flexibility.
- **Result:** 8 widgets.

### Option C — Merge Arb Stream + Closed Arbs
- These are naturally paired (active vs historical arbs).
- **Result:** 10 widgets.

### Option D — No merge
- Current separation serves different workflows well.
- 2 presets already handle different arrangements.

---

## Questions for User

1. **Merge scope:** A (KPIs + settled into positions), B (markets+detail+trade), C (arb stream+closed), D (no merge), or some combination?
2. **11 widgets is a lot.** Are all of them useful, or can some be removed entirely (e.g. `pred-top-markets`, `pred-recent-fills`)?
3. **ODUM Focus:** Is this widget functional with mock data, or is it a placeholder?
4. **Default vs Arb Focus presets:** Are both used, or should we consolidate?
5. **Any broken data?** Which widgets show empty when you visit the page?
