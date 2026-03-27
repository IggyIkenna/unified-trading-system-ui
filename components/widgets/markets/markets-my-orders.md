# My Orders

Tab: markets
Widget ID: markets-my-orders
Min size: 6 x 3 columns/rows

## What it shows

Filtered own orders (`isOwn`) in a `DataTableWidget` with order id, timestamps, latency, type/side, price, size, venue, aggressor. Empty state when none.

## Data sources

- `useMarketsData().ownOrders` (derived from `orderFlowData`).

## Configuration

- Same generators as order flow; changes with `orderFlowRange` and `assetClass`.

## Recommended pairings

- `markets-controls`, `markets-live-book` or `markets-order-flow`.
