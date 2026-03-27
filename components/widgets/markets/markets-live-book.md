# Live Order Book

Tab: markets
Widget ID: markets-live-book
Min size: 8 x 4 columns/rows

## What it shows

HFT-style flattened table: bids (reversed depth), center trade column, asks, delay coloring, and footer legend. Renders an empty-state message when asset class is DeFi (use `markets-defi-amm` instead).

## Data sources

- `useMarketsData().liveBookUpdates` from `generateLiveBookUpdates()`; depth from `bookDepth`.

## Configuration

- `bookDepth` (2–10) from controls when view is book and asset is not DeFi.

## Recommended pairings

- `markets-controls`, `markets-my-orders`.
