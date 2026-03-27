# Alert Filters

Tab: alerts  
Widget ID: `alerts-filter-bar`  
Min size: 4 × 1

## What it shows

Unified platform `FilterBar`: search, status, and severity. Filter state is shared with the alert table via `AlertsDataProvider` (no duplicate legacy filter row).

## Data sources

- `useAlertsData()` → `alertFilterDefs`, `alertFilterValues`, `handleFilterChange`, `handleFilterReset`

## Configuration

- No widget-level configuration options.

## Recommended pairings

Place above `alerts-table` so filters apply to the same `filteredAlerts` slice.
