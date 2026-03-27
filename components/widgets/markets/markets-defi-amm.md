# DeFi Pool Activity

Tab: markets
Widget ID: markets-defi-amm
Min size: 6 x 3 columns/rows

## What it shows

AMM-oriented table (swap vs LP) with mock price impact and gas; amber notice card when asset class is DeFi. Prompts to switch to DeFi when another asset is selected.

## Data sources

- `useMarketsData().orderFlowData` (same generator as CeFi flow, displayed as pool rows).

## Configuration

- `assetClass === "defi"` to populate meaningful rows.

## Recommended pairings

- `markets-controls` (set asset to DeFi); optional instead of `markets-live-book` for DeFi workflows.
