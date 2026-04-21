# Strategy Summary

Tab: strategies
Widget ID: strategies-kpi-strip
Min size: 4 × 1 columns/rows

## What it shows

Four KPI metrics: active live strategies versus total count, total AUM, aggregate total P&L, and MTD P&L. Uses the shared `KpiStrip` with sentiment coloring on the P&L metrics. Execution mode is shown in the page header (`ExecutionModeIndicator`), not inside this widget.

## Data sources

- `useStrategiesData()` context → derived from `strategies` list
- Upstream: `useStrategyPerformance()` → `/api/trading/performance` (MSW in demo)
- Totals: `getTotalAUM`, `getTotalPnL`, `getTotalMTDPnL` from `@/lib/mocks/fixtures/strategy-instances` (passed the loaded strategy array)

## Configuration

- No widget-level configuration options

## Recommended pairings

(filled in Phase 4)
