# Term Structure

Tab: risk
Widget ID: risk-term-structure
Min size: 4 x 3 columns/rows

## What it shows

Stacked bar chart showing exposure by maturity bucket, with bars stacked by asset class (DeFi/CeFi/TradFi/Sports). Note that DeFi/CeFi perpetuals are classified as Overnight (8h funding settlement).

## Data sources

- `useRiskData()` context: termStructureData

## Configuration

- None.

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `risk-exposure-attribution`, `risk-var-chart`, `risk-stress-table`.
- **Rates / carry:** **overview** `pnl-attribution` · **pnl** `pnl-factor-drilldown`.
- **Futures curve:** **options** `futures-table`.
