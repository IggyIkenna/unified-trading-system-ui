# Alert Summary

Tab: alerts  
Widget ID: `alerts-kpi-strip`  
Min size: 4 × 1 (columns × rows)

## What it shows

Four KPI metrics: active alert count, active critical count, average resolution time (placeholder until the API exposes it), and a last-24h total (placeholder). Uses the shared `KpiStrip` component with `columns={4}`.

## Data sources

- `useAlertsData()` → `activeCount`, `criticalCount`, `isLoading`
- Upstream: `useAlerts()` → `/api/alerts/list`

## Configuration

- No widget-level configuration options.

## Recommended pairings

Works with `alerts-filter-bar`, `alerts-table`, and `alerts-kill-switch` in the default preset.
