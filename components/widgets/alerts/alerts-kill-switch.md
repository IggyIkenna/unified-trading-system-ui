# Kill Switch

Tab: alerts  
Widget ID: `alerts-kill-switch`  
Min size: 3 × 4

## What it shows

Emergency intervention controls inside a shared `CollapsibleSection` (default collapsed): scope selector, strategy entity selector populated from `useStrategyHealth()`, action tiles (pause, cancel orders, flatten, disable venue), rationale field, and an impact preview derived from the current filtered alert feed for the selected strategy entity (plus a note that full position/order impact needs execution API wiring).

## Data sources

- `useStrategyHealth()` → strategy id/name list for the entity dropdown
- `useAlertsData()` → `filteredAlerts` for a lightweight active-alert count by entity

## Configuration

- No widget-level configuration options.

## Recommended pairings

Default preset places this widget beside `alerts-table` for quick access without opening a sheet.
