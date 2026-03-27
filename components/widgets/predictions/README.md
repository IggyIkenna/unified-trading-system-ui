# Prediction markets widgets

Workspace tab: `predictions` (`/services/trading/predictions`).

## Data

- **Provider:** `components/widgets/predictions/predictions-data-context.tsx`
- **Mock source:** `components/trading/predictions/mock-data.ts` (markets, positions, arbs, ODUM instruments, fills)
- **Types:** `components/trading/predictions/types.ts` (includes `PredictionQuickTradeParams` for `placeTrade`)

Shared state includes market filters, selected market for the detail widget, ODUM type/timeframe filters, arb stream state (8s tick + `NEW` ids), quick-trade market id, and `recentFills` updated when `placeTrade` runs.

## Widgets

| id                       | Component                           | Notes                                                                     |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------------- |
| `pred-markets-grid`      | `pred-markets-grid-widget.tsx`      | `FilterBar` for category, venue, sort, search; responsive card grid       |
| `pred-market-detail`     | `pred-market-detail-widget.tsx`     | `MarketDetailPanel` from `markets-tab`; empty state when nothing selected |
| `pred-portfolio-kpis`    | `pred-portfolio-kpis-widget.tsx`    | `KpiStrip`, four metrics                                                  |
| `pred-open-positions`    | `pred-open-positions-widget.tsx`    | `DataTableWidget`                                                         |
| `pred-settled-positions` | `pred-settled-positions-widget.tsx` | `CollapsibleSection` (default collapsed) + `DataTableWidget`              |
| `pred-odum-focus`        | `pred-odum-focus-widget.tsx`        | `OdumFocusBody` with filters from context                                 |
| `pred-arb-stream`        | `pred-arb-stream-widget.tsx`        | Threshold + type filters; `PredActiveArbCard`                             |
| `pred-arb-closed`        | `pred-arb-closed-widget.tsx`        | `CollapsibleSection` + `PredClosedArbCard`                                |
| `pred-trade-panel`       | `pred-trade-panel-widget.tsx`       | `MarketSelector` + `TradePanelInner` with `onPlaceTrade` → `placeTrade`   |
| `pred-top-markets`       | `pred-top-markets-widget.tsx`       | `TopMarketCard`; sets quick-trade + selected market                       |
| `pred-recent-fills`      | `pred-recent-fills-widget.tsx`      | Scrollable list from context                                              |

## Registration

- `components/widgets/predictions/register.ts` — widgets + presets `predictions-default`, `predictions-arb-focus`

## Trading components reused

- `markets-tab.tsx` — `BinaryMarketCard`, `MultiOutcomeMarketCard`, `MarketDetailPanel` (with `allMarkets` + `onSelectRelated`)
- `odum-focus-tab.tsx` — `OdumFocusBody` (controlled filters)
- `trade-tab.tsx` — `MarketSelector`, `TopMarketCard`, `TradePanelInner` (`onPlaceTrade` optional)

## Spec

Decomposition and layout presets: [`predictions-widgets.md`](./predictions-widgets.md) (do not edit the spec from implementation work).
