# Alert Feed

Tab: alerts  
Widget ID: `alerts-table`  
Min size: 6 × 3

## What it shows

Toolbar row with `DataFreshness`, critical/high badges, batch-mode notice, and CSV/Excel export. Main `DataTable` with severity, alert text, entity, value/threshold, status, time, and row actions (acknowledge, escalate, resolve) plus a detail `Sheet` per row. Uses `BatchGuardButton` for disabled live actions in batch mode.

## Data sources

- `useAlertsData()` → `filteredAlerts`, loading/error, mutations, `criticalCount`, `highCount`, `isBatchMode`, `alertsResponse` (freshness)
- Export columns: `ALERT_EXPORT_COLUMNS` from `lib/config/services/alerts.config.ts`

## Configuration

- No widget-level configuration options.

## Recommended pairings

Pair with `alerts-filter-bar` and `alerts-kpi-strip` for the full alerts workspace.
