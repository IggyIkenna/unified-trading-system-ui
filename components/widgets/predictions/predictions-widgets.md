# Prediction Markets — Widget Decomposition Spec

**Page:** `app/(platform)/services/trading/predictions/page.tsx`
**Tier:** 3 (low priority — well-structured tab layout, already modular)

---

## 1. Page Analysis

| Metric                | Value                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Page lines            | 58 (tab orchestrator)                                                                                                                     |
| Tab components        | `MarketsTab` (~622 lines), `PortfolioTab` (~300 lines), `OdumFocusTab` (~460 lines), `ArbStreamTab` (~357 lines), `TradeTab` (~421 lines) |
| Total component lines | ~2,160 across 5 tab files + shared helpers/types/mock-data                                                                                |
| Data hooks used       | None — 100% mock data via `MOCK_MARKETS`, `MOCK_POSITIONS`, `MOCK_PREDICTION_ARBS`, `ODUM_INSTRUMENTS`, `MOCK_RECENT_FILLS`               |
| Inline mock data      | Extensive — markets, positions, arb opportunities, ODUM instruments, recent fills, price series                                           |
| External imports      | `placeMockOrder`, `useToast`, sports shared components (from `../sports/shared`)                                                          |

The page is a 5-tab layout. Each tab is already a separate component file in `components/trading/predictions/`. This is the most modular of the Tier 3 pages.

---

## 2. Widget Decomposition

| id                       | label             | description                                                                                | icon           | minW | minH | defaultW | defaultH | singleton |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------------ | -------------- | ---- | ---- | -------- | -------- | --------- |
| `pred-markets-grid`      | Markets           | Filterable grid of prediction markets with category pills, venue filter, sort, search      | `LayoutGrid`   | 4    | 4    | 8        | 7        | yes       |
| `pred-market-detail`     | Market Detail     | Single market detail panel with price history chart, order book summary, trade entry       | `FileText`     | 4    | 5    | 4        | 7        | yes       |
| `pred-portfolio-kpis`    | Portfolio KPIs    | Open positions count, total staked, unrealised P&L, win rate                               | `BarChart3`    | 4    | 1    | 12       | 2        | yes       |
| `pred-open-positions`    | Open Positions    | Table of open prediction market positions with entry/current price, P&L                    | `Target`       | 6    | 3    | 12       | 4        | yes       |
| `pred-settled-positions` | Settled Positions | Collapsible table of settled positions with win/loss/void outcome                          | `TrendingUp`   | 6    | 2    | 12       | 3        | yes       |
| `pred-odum-focus`        | ODUM Focus        | Dual-axis price/odds charts with delta divergence signals for crypto, TradFi, and football | `Activity`     | 4    | 4    | 12       | 6        | yes       |
| `pred-arb-stream`        | Arb Stream        | Live prediction market arb opportunities with decay bars and execute buttons               | `Zap`          | 4    | 4    | 6        | 6        | yes       |
| `pred-arb-closed`        | Closed Arbs       | List of closed/decayed arb opportunities                                                   | `TrendingDown` | 3    | 3    | 6        | 4        | yes       |
| `pred-trade-panel`       | Quick Trade       | Market selector + trade panel with Kelly stake suggestion                                  | `ClipboardPen` | 4    | 5    | 6        | 7        | yes       |
| `pred-top-markets`       | Top Markets       | Top markets by volume quick-access cards                                                   | `Flame`        | 3    | 3    | 6        | 4        | yes       |
| `pred-recent-fills`      | Recent Trades     | List of recent prediction market fills                                                     | `CheckCircle2` | 3    | 3    | 6        | 4        | yes       |

---

## 3. Data Context Shape

```typescript
interface PredictionsData {
  // Markets
  markets: PredictionMarket[];
  filteredMarkets: PredictionMarket[];
  activeCategory: MarketCategory;
  setActiveCategory: (c: MarketCategory) => void;
  venueFilter: "all" | MarketVenue;
  setVenueFilter: (v: "all" | MarketVenue) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedMarket: PredictionMarket | null;
  setSelectedMarketId: (id: string | null) => void;

  // Portfolio
  openPositions: PredictionPosition[];
  settledPositions: PredictionPosition[];
  portfolioKpis: {
    totalStaked: number;
    totalUnrealisedPnl: number;
    totalRealisedPnl: number;
    winRate: number;
    winCount: number;
  };

  // ODUM focus
  odumInstruments: OdumInstrument[];
  odumTypeFilter: OdumInstrumentType | "all";
  setOdumTypeFilter: (f: OdumInstrumentType | "all") => void;
  odumTfFilter: Timeframe | "all";
  setOdumTfFilter: (f: Timeframe | "all") => void;

  // Arb stream
  activeArbs: PredictionArbOpportunity[];
  closedArbs: PredictionArbOpportunity[];
  arbThreshold: number;
  setArbThreshold: (t: number) => void;
  arbMarketTypeFilter: PredictionArbMarketType | "all";
  setArbMarketTypeFilter: (f: PredictionArbMarketType | "all") => void;

  // Trade
  recentFills: RecentFill[];

  // Actions
  placeTrade: (params: TradeParams) => void;
  executeArb: (arbId: string) => void;
}
```

---

## 4. Mock Data Instructions

All mock data lives in `components/trading/predictions/mock-data.ts`. Move to:

- `lib/mocks/fixtures/prediction-markets.ts` — `MOCK_MARKETS`, price series
- `lib/mocks/fixtures/prediction-positions.ts` — `MOCK_POSITIONS`
- `lib/mocks/fixtures/prediction-arbs.ts` — `MOCK_PREDICTION_ARBS`
- `lib/mocks/fixtures/prediction-odum.ts` — `ODUM_INSTRUMENTS`
- `lib/mocks/fixtures/prediction-fills.ts` — `MOCK_RECENT_FILLS`
- Types from `predictions/types.ts` → `lib/types/predictions.ts`
- Helpers from `predictions/helpers.ts` → keep co-located or move to `lib/utils/predictions.ts`

---

## 5. UI/UX Notes

- The markets grid uses a responsive column layout (1-4 cols) — keep this in the widget; card density adapts to widget width.
- Market detail panel should work as either a drill-down overlay or a separate widget that listens to `selectedMarket`.
- ODUM Focus tab has complex dual-axis charts — ensure the chart container respects widget resize via `ResponsiveContainer`.
- Arb stream has a live polling interval (8s) with animated `NEW` badge and decay bars — performance-sensitive; ensure cleanup on widget unmount.
- Kelly stake suggestion in the trade panel is a differentiator — make it prominent.

---

## 6. Collapsible Candidates

| Section                       | Why                                                         |
| ----------------------------- | ----------------------------------------------------------- |
| Settled Positions             | Already collapsible in current implementation               |
| Closed Arbs                   | Lower priority than active arbs; collapse by default        |
| ODUM Football section         | Separate from crypto/TradFi grid; independently collapsible |
| Market detail related markets | Supplementary info at bottom                                |

---

## 7. Reusable Component Usage

| Shared widget        | Where used                                                              |
| -------------------- | ----------------------------------------------------------------------- |
| `KpiStrip`           | Portfolio KPIs (4 metrics: positions, staked, unrealised P&L, win rate) |
| `DataTableWidget`    | Open positions table, settled positions table                           |
| `CollapsibleSection` | Settled positions, closed arbs, ODUM football section                   |
| `FilterBarWidget`    | Markets category/venue/sort filters; ODUM type/timeframe filters        |

---

## 8. Default Preset Layout

```
predictions-default:
  pred-markets-grid:       { x: 0,  y: 0,  w: 8,  h: 7 }
  pred-trade-panel:        { x: 8,  y: 0,  w: 4,  h: 7 }
  pred-portfolio-kpis:     { x: 0,  y: 7,  w: 12, h: 2 }
  pred-open-positions:     { x: 0,  y: 9,  w: 12, h: 4 }

predictions-arb-focus:
  pred-arb-stream:         { x: 0,  y: 0,  w: 6,  h: 6 }
  pred-arb-closed:         { x: 6,  y: 0,  w: 6,  h: 4 }
  pred-odum-focus:         { x: 0,  y: 6,  w: 12, h: 6 }
  pred-recent-fills:       { x: 6,  y: 4,  w: 6,  h: 2 }
```

---

## 9. Questions to Resolve

1. **Market detail panel: overlay vs widget?** — When a user clicks a market card, should a detail panel replace the grid (current behavior) or open as a separate widget? Separate widget enables side-by-side comparison.
2. **ODUM Focus: shared with sports?** — The ODUM Focus tab imports sports fixture mock data and shared components. Should it be registered as `availableOn: ["predictions", "sports"]`?
3. **Arb stream: shared with sports arb?** — The predictions arb stream and sports arb tab have similar UX patterns. Can they share a `BaseArbStream` widget?
4. **Kelly stake: bankroll config** — The Kelly calculator uses a hardcoded $10K bankroll. Should this be a user preference in workspace config?
