# Options & Futures — Widget Decomposition Spec

> **Update 2026-04-22 (WU-3):** `options-trade-panel` + `futures-trade-panel` + `options-scenario` were absorbed into their host widgets as docked/embedded panes. Live inventory is 6 widgets: `options-control-bar`, `options-watchlist`, `options-chain` (docks trade panel on selection), `futures-table` (docks trade panel on selection), `options-strategies` (embeds scenario payoff pane), `options-greek-surface`. Rows below and the default-preset block are historical — see `components/widgets/options/register.ts` and `README.md` for live definitions.

**Page:** `app/(platform)/services/trading/options/page.tsx`
**Component:** `components/trading/options-futures-panel.tsx`
**Tier:** 3 (low priority — massive monolith, ~4700+ lines)

---

## 1. Page Analysis

| Metric           | Value                                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page lines       | 11 (thin wrapper)                                                                                                                                        |
| Component lines  | ~4,700+ (options-futures-panel.tsx exceeds 100K chars)                                                                                                   |
| Sections visible | Watchlist sidebar (collapsible), main area with 4 tabs: Options Chain, Futures Table, Strategies (futures spreads + options combos), Scenario Analysis   |
| Data hooks used  | None — 100% inline mock data                                                                                                                             |
| Inline mock data | Option chain rows (strikes, bids, asks, greeks), futures rows (contracts, funding, basis), combo strategies, scenario payoff data, watchlist definitions |
| Sub-components   | WatchlistPanel (imported from trading/watchlist-panel.tsx), plus ~15 inline sub-components                                                               |

This is the largest file in the codebase. It defines all types, mock data, and ~15 sub-components inline. The main tabs are: Options, Futures, Strategies, Scenario.

---

## 2. Widget Decomposition

| id                      | label               | description                                                                                                  | icon           | minW | minH | defaultW | defaultH | singleton |
| ----------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ | -------------- | ---- | ---- | -------- | -------- | --------- |
| `options-watchlist`     | Watchlist           | Sidebar with saved watchlists and symbol search                                                              | `Star`         | 2    | 4    | 3        | 10       | yes       |
| `options-chain`         | Options Chain       | Full options chain table with calls/puts, greeks, IV, OI per strike                                          | `Grid3X3`      | 6    | 5    | 9        | 8        | yes       |
| `options-trade-panel`   | Options Trade Panel | Order entry for options: direction, type, strike, qty, price                                                 | `ClipboardPen` | 3    | 4    | 3        | 6        | yes       |
| `futures-table`         | Futures Table       | Contract list with mark price, 24h change, volume, OI, funding rate, basis                                   | `BarChart3`    | 5    | 4    | 9        | 6        | yes       |
| `futures-trade-panel`   | Futures Trade Panel | Futures order entry with contract selector                                                                   | `ClipboardPen` | 3    | 3    | 3        | 5        | yes       |
| `options-strategies`    | Strategy Builder    | Futures spreads and options combo builder (vertical, straddle, strangle, calendar, butterfly, risk-reversal) | `Zap`          | 5    | 4    | 9        | 6        | yes       |
| `options-scenario`      | Scenario Analysis   | Payoff diagram with IV/price/time sliders for P&L simulation                                                 | `Activity`     | 5    | 4    | 9        | 6        | yes       |
| `options-greek-surface` | Greek Surface       | Delta/gamma/vega/theta surface view across strikes                                                           | `BarChart3`    | 4    | 3    | 6        | 4        | no        |
| `options-control-bar`   | Controls            | Asset selector, expiry, settlement, venue, greek surface toggle                                              | `Settings2`    | 6    | 1    | 12       | 1        | yes       |

---

## 3. Data Context Shape

```typescript
interface OptionsData {
  // Asset/market selection
  assetClass: "crypto" | "tradfi";
  asset: string;
  settlement: "inverse" | "linear";
  market: string;
  expiry: string;
  setAssetClass: (ac: "crypto" | "tradfi") => void;
  setAsset: (a: string) => void;
  setSettlement: (s: "inverse" | "linear") => void;
  setMarket: (m: string) => void;
  setExpiry: (e: string) => void;

  // Options chain
  optionRows: OptionRow[];
  spotPrice: number;
  activeStrike: number | null;
  setActiveStrike: (s: number | null) => void;
  greekSurface: "delta" | "gamma" | "vega" | "theta" | null;
  setGreekSurface: (g: "delta" | "gamma" | "vega" | "theta" | null) => void;

  // Futures
  futureRows: FutureRow[];
  selectedFuture: FutureRow | null;
  setSelectedFuture: (f: FutureRow | null) => void;

  // Strategies
  strategiesMode: "futures-spreads" | "options-combos";
  setStrategiesMode: (m: "futures-spreads" | "options-combos") => void;
  comboType: ComboType;
  setComboType: (c: ComboType) => void;
  comboLegs: ComboLeg[];
  comboNetCost: number;
  comboMaxProfit: number;
  comboMaxLoss: number;

  // Scenario
  scenarioIvShift: number;
  scenarioPriceRange: [number, number];
  scenarioDte: number;
  payoffData: Array<{ price: number; pnl: number }>;

  // Watchlist
  watchlists: WatchlistDefinition[];
  selectedSymbol: WatchlistSymbol | null;
  setSelectedSymbol: (s: WatchlistSymbol | null) => void;

  // Trade execution
  tradeDirection: "buy" | "sell";
  orderType: "limit" | "market" | "post-only" | "reduce-only";
  orderQty: string;
  orderPrice: string;
  handleSubmitOrder: () => void;
}
```

---

## 4. Mock Data Instructions

This file has the most inline mock data in the codebase. Extract:

- **Option chain data** (`generateOptionRows`) → `lib/mocks/fixtures/options-chain.ts`
- **Futures contracts** (`MOCK_FUTURES_*`) → `lib/mocks/fixtures/futures-contracts.ts`
- **Strategy combos** (pre-built combo definitions) → `lib/mocks/fixtures/options-strategies.ts`
- **Watchlist definitions** → `lib/mocks/fixtures/watchlists.ts`
- **Payoff diagram helpers** → keep as pure functions, move to `lib/utils/options-math.ts`
- All types at the top → `lib/types/options.ts`

---

## 5. UI/UX Notes

- The options chain is a wide horizontal table — it needs **horizontal scroll** and benefits from full width (9-12 cols).
- The trade panel should be a **narrow sidebar** (3 cols) docked to the right.
- Watchlist sidebar should be collapsible (already has toggle) — default collapsed in compact workspaces.
- Greek surface toggle should highlight the active greek column in the chain table with color coding.
- Strategy builder payoff chart should use the shared chart infrastructure when available.
- Font sizes are already compact (`text-xs`, `text-[10px]`).

---

## 6. Collapsible Candidates

| Section                      | Why                                     |
| ---------------------------- | --------------------------------------- |
| Watchlist sidebar            | Already collapsible; secondary context  |
| Greek surface view           | Optional overlay; not always needed     |
| Strategy builder legs detail | Expand per-leg details on click         |
| Scenario sliders             | Power-user feature; collapse by default |

---

## 7. Reusable Component Usage

| Shared widget        | Where used                                                    |
| -------------------- | ------------------------------------------------------------- |
| `DataTableWidget`    | Futures table (sortable columns, compact mode)                |
| `FilterBarWidget`    | Asset class / market / expiry selector strip                  |
| `CollapsibleSection` | Watchlist panel, greek surface toggle                         |
| `KpiStrip`           | Summary metrics: spot price, ATM IV, put/call ratio, total OI |

---

## 8. Default Preset Layout

```
options-default:
  options-control-bar:    { x: 0,  y: 0,  w: 12, h: 1 }
  options-watchlist:      { x: 0,  y: 1,  w: 3,  h: 10 }
  options-chain:          { x: 3,  y: 1,  w: 6,  h: 8 }
  options-trade-panel:    { x: 9,  y: 1,  w: 3,  h: 6 }
  options-greek-surface:  { x: 9,  y: 7,  w: 3,  h: 4 }
  futures-table:          { x: 3,  y: 9,  w: 9,  h: 4 }

options-strategies-preset:
  options-control-bar:    { x: 0,  y: 0,  w: 12, h: 1 }
  options-strategies:     { x: 0,  y: 1,  w: 7,  h: 7 }
  options-scenario:       { x: 7,  y: 1,  w: 5,  h: 7 }
  options-trade-panel:    { x: 0,  y: 8,  w: 4,  h: 5 }
  options-chain:          { x: 4,  y: 8,  w: 8,  h: 5 }
```

---

## 9. Questions to Resolve

1. **File splitting strategy** — at 4700+ lines, should the component be split into separate files before widgetizing, or does widgetization itself handle the split?
2. **Watchlist: shared across tabs?** — The watchlist panel is potentially useful on terminal and overview tabs too. Should it be registered as `availableOn: ["options", "terminal"]`?
3. **Options chain interactivity** — clicking a strike row currently populates the trade panel. In widget mode, this cross-widget communication goes through the data context. Is that sufficient, or do we need an event bus?
4. **TradFi vs Crypto asset class** — the component swaps between crypto options (Deribit/OKX/Bybit) and TradFi options (CBOE/TD/IBKR). Should these be separate presets or a single configurable workspace?
