# Risk KPIs

Tab: risk
Widget ID: risk-kpi-strip
Min size: 4 x 1 columns/rows

## What it shows

9 key risk metrics in a 3x3 grid: Firm P&L, Net Exposure, Margin Used, VaR 95%, ES 95%, Active Alerts, VaR 99%, ES 99%, Kill Switches. Regime multiplier is reflected in VaR/ES values. Consolidates Tab 1 KPIs with Part 2 VaR Summary.

## Data sources

- `useRiskData()` context: totalVar95, totalVar99, totalES95, totalES99, criticalCount, warningCount, killedStrategies, varSummary

## Configuration

- None. KPI values derive from context.

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `risk-strategy-heatmap`, `risk-var-chart`, `risk-stress-table`, `risk-circuit-breakers` (CRO briefing / quick presets).
- **Action:** **alerts** `alerts-kill-switch`, `alerts-table` · **overview** `kpi-strip`, `alerts-preview`.
- **Book proof:** **positions** `positions-kpi-strip` · **accounts** `accounts-margin-util`.
