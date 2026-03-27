# Portfolio Greeks

Tab: risk
Widget ID: risk-greeks-summary
Min size: 4 x 2 columns/rows

## What it shows

5 Greek KPI cards (Delta, Gamma, Vega, Theta, Rho) as a KpiStrip, followed by per-position Greeks table with totals row, Greeks time series chart (30 days), collapsible second-order risks (Volga, Vanna, Slide), and collapsible per-underlying breakdown table.

## Data sources

- `useRiskData()` context: portfolioGreeks, positionGreeks, greeksTimeSeries, secondOrderRisks, portfolioGreeksData

## Configuration

- None.

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `risk-exposure-attribution`, `risk-what-if-slider`, `risk-var-chart`.
- **Derivatives desk:** **options** `options-chain`, `options-trade-panel`, `options-scenario` · **terminal** `price-chart`.
- **Portfolio:** **positions** `positions-table`.
