# Component VaR

Tab: risk
Widget ID: risk-var-chart
Min size: 4 x 3 columns/rows

## What it shows

Horizontal bar chart showing marginal VaR (95%) contribution by position. Bars colored by asset class (DeFi/CeFi/TradFi/Sports). Includes VaR method toggle (historical, parametric, monte_carlo, filtered_historical).

## Data sources

- `useRiskData()` context: adjustedVarData, varMethod, setVarMethod

## Configuration

- VaR method toggle in widget header.

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `risk-kpi-strip`, `risk-stress-table`, `risk-exposure-attribution`, `risk-correlation-heatmap`.
- **Tail risk:** `risk-what-if-slider` · **options** `options-strategies` (embeds scenario payoff pane), `options-greek-surface`.
- **Book:** **positions** `positions-table` · **overview** `pnl-chart`.
