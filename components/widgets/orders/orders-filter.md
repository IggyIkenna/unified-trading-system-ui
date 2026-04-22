# Order Filters

Tab: orders
Widget ID: orders-filter
Min size: 4 x 1 columns/rows

## What it shows

Unified filter bar with search (order ID, instrument, venue), venue select, status select, plus instrument type pills (All/Spot/Perp/Futures/Options/DeFi/Prediction).

## Data sources

- `useOrdersData()` context (filter state + unique values)
- `FilterBar` component from `components/shared/filter-bar` (`@/components/shared/filter-bar`)

## Configuration

- None — filter definitions are derived from available data

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `orders-kpi-strip`, `orders-table`.
- **Live desk:** **terminal** `instrument-bar`, `order-entry` · **markets** `markets-my-orders`.
- **Hierarchy / compliance:** **book** `book-hierarchy-bar`, `book-order-entry`.
