# What-If Slider

Tab: risk
Widget ID: risk-what-if-slider
Min size: 4 x 2 columns/rows

## What it shows

BTC price shock slider (-30% to +30%) with real-time estimated portfolio PnL using Delta + Gamma approximation. Shows dS, Delta, and Gamma values.

## Data sources

- `useRiskData()` context: btcPriceChangePct, estimatedPnl, portfolioGreeks

## Configuration

- None.

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `risk-var-chart`, `risk-greeks-summary`, `risk-stress-table`.
- **Scenario depth:** **options** `options-scenario` · **terminal** `price-chart`.
- **Quick book impact:** **positions** `positions-kpi-strip`.
