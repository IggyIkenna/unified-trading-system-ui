# Strategy Heatmap

Tab: risk
Widget ID: risk-strategy-heatmap
Min size: 6 x 3 columns/rows

## What it shows

Strategy risk status rows with status dots (ok/warning/critical), key risk metrics per strategy, and action buttons: Trip CB, Scale 50%, Kill (with confirmation dialog). Shows HALTED/KILLED/Scaled badges.

## Data sources

- `useRiskData()` context: strategyRiskHeatmap, trippedStrategies, killedStrategies, scaledStrategies, handleTripCircuitBreaker, handleResetCircuitBreaker, handleKillSwitch, handleScale

## Configuration

- Actions disabled in batch mode.

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `risk-kpi-strip`, `risk-circuit-breakers`, `risk-limits-hierarchy`.
- **Intervention:** **alerts** `alerts-kill-switch` · **overview** `scope-summary`.
- **Exposure drill:** `risk-exposure-attribution`, `risk-var-chart` · **strategies** `strategies-catalogue`.
