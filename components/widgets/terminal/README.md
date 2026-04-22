# Terminal widgets

Workspace widgets for **Terminal** (`/services/trading/terminal`).

## Provider

`TerminalDataProvider` (`components/widgets/terminal/terminal-data-context.tsx`) manages instrument selection, live price feeds, order book data, candle data, indicators, order state, and strategy linking.

## Widgets

| id                | Role                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| `instrument-bar`  | Instrument & Account — instrument selector, account picker, live price |
| `order-book`      | Order Book — live bid/ask ladder with depth visualization              |
| `price-chart`     | Price Chart — candlestick/line/depth chart with indicator overlays     |
| `order-entry`     | Order Entry — buy/sell form with strategy linking and validation       |
| `market-trades`   | Market Trades — real-time market trades and own trade history          |
| `calendar-events` | Calendar Events — economic calendar and corporate actions feed         |

## Presets

`terminal-default` is registered in `components/widgets/terminal/register.ts`.

## Recommended pairings

See [pairing guide](../pairing-guide.md).

| Widget ID         | Pair with (same tab)                           | Cross-tab                                                   |
| ----------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| `instrument-bar`  | All other terminal widgets (anchors context)   | **positions** `positions-table` · **orders** `orders-table` |
| `order-book`      | `price-chart`, `order-entry`, `market-trades`  | **markets** `markets-live-book`, `markets-order-flow`       |
| `price-chart`     | `order-book`, `order-entry`, `calendar-events` | **options** chain / scenario widgets                        |
| `order-entry`     | `order-book`, `price-chart`, `market-trades`   | **book** `book-order-entry` · **orders** `orders-table`     |
| `market-trades`   | `order-book`, `price-chart`                    | **overview** `recent-fills` · **orders** `orders-kpi-strip` |
| `calendar-events` | `price-chart`, `instrument-bar`                | **overview** `pnl-chart` (event risk)                       |
