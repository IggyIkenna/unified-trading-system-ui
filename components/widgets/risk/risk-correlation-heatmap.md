# Correlation Heatmap

Tab: risk
Widget ID: risk-correlation-heatmap
Min size: 4 x 3 columns/rows

## What it shows

Asset correlation matrix heatmap. Self-contained component that dynamically imports the CorrelationHeatmap component and manages its own data via useCorrelationMatrix().

## Data sources

- Self-contained: `components/risk/correlation-heatmap.tsx` (dynamic import)

## Configuration

- None.

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `risk-var-chart`, `risk-exposure-attribution`, `risk-stress-table`.
- **Diversification:** **positions** `positions-table` · **strategies** `strategies-catalogue`.
- **Beta / macro:** **overview** `pnl-chart` · **terminal** `calendar-events`.
