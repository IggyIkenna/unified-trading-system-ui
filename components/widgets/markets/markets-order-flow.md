# Market Order Flow

Tab: markets
Widget ID: markets-order-flow
Min size: 6 x 4 columns/rows

## What it shows

Latest 100 rows of generated market order flow: exchange/local time, delay, type, side, price, size, venue, aggressor. Own orders get a subtle row highlight via `DataTableWidget` `getRowClassName`.

## Data sources

- `useMarketsData().orderFlowData` from `generateOrderFlowData()` in `lib/mocks/generators/order-flow-generators.ts`.

## Configuration

- Driven by controls: `orderFlowRange`, `assetClass`.

## Recommended pairings

- `markets-controls`; optional `markets-recon` / `markets-latency-summary` on the same workspace.
