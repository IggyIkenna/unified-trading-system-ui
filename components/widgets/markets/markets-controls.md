# Markets Controls

Tab: markets
Widget ID: markets-controls
Min size: 4 x 1 columns/rows

## What it shows

Global toggles (cross-section vs time-series, live vs batch, P&amp;L date range, generate report) and trade-desk controls: market orders / live book / my orders, asset class, order-flow range, and book depth when the book view is active (non-DeFi).

## Data sources

- `useMarketsData()` — local UI state only; `dateRange` / `viewMode` / `dataMode` reserved for future P&amp;L wiring.

## Configuration

- None.

## Recommended pairings

- `markets-order-flow`, `markets-live-book`, or `markets-defi-amm` depending on asset class and view.
