# Order Summary

Tab: orders
Widget ID: orders-kpi-strip
Min size: 4 x 1 columns/rows

## What it shows

Displays 4 KPI metrics: total orders, open, partial, and filled counts from the filtered order set.

## Data sources

- `useOrdersData()` context (summary field)
- Underlying: `useOrders()` hook → `/api/execution/orders`

## Configuration

- None — metrics are derived automatically from filtered orders

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `orders-filter`, `orders-table`.
- **Flow:** **terminal** `market-trades` · **overview** `recent-fills`.
- **Incidents:** **alerts** `alerts-kpi-strip` · **instructions** `instr-summary`.
