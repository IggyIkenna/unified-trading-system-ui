# Overview widgets

Workspace widgets for **Overview** (`/services/trading/overview`).

## Provider

`OverviewDataProvider` (`components/widgets/overview/overview-data-context.tsx`) aggregates P&L, timeseries, strategy performance, alerts, orders, health, and formatting utilities from multiple API hooks.

## Widgets

| id                | Role                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `kpi-strip`       | Key Metrics — P&L, NAV, exposure, live/warning counts, alerts         |
| `scope-summary`   | Scope & Controls — org/client/strategy context, intervention controls |
| `pnl-chart`       | P&L / NAV / Exposure Charts — live vs batch time series               |
| `pnl-attribution` | P&L Attribution — waterfall breakdown by factor                       |
| `strategy-table`  | Strategy Performance — sortable table with sparklines                 |
| `recent-fills`    | Recent Fills — latest order activity                                  |
| `alerts-preview`  | Alerts — severity-colored alert feed                                  |
| `health-grid`     | System Health — service status indicators                             |

## Presets

`overview-default` is registered in `components/widgets/overview/register.ts`.

## Recommended pairings

See [pairing guide](../pairing-guide.md).

| Widget ID         | Pair with (same tab)                          | Cross-tab                                                                          |
| ----------------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `scope-summary`   | `kpi-strip`, `strategy-table`                 | **positions** `positions-table` · **accounts** for funding context                 |
| `pnl-chart`       | `kpi-strip`, `pnl-attribution`                | **pnl** `pnl-time-series`, `pnl-waterfall`                                         |
| `kpi-strip`       | `pnl-chart`, `alerts-preview`, `recent-fills` | **risk** `risk-kpi-strip` · **terminal** for drill-down                            |
| `strategy-table`  | `pnl-chart`, `scope-summary`                  | **strategies** `strategies-catalogue` · **pnl** `pnl-by-client`                    |
| `pnl-attribution` | `pnl-chart`, `kpi-strip`                      | **pnl** `pnl-factor-drilldown`                                                     |
| `alerts-preview`  | `kpi-strip`, `health-grid`                    | **alerts** `alerts-table`, `alerts-kill-switch` · **risk** `risk-circuit-breakers` |
| `recent-fills`    | `kpi-strip`                                   | **orders** `orders-table` · **terminal** `market-trades`                           |
| `health-grid`     | `alerts-preview`                              | **markets** latency widgets for service-level detail                               |
| `calendar-events` | `pnl-chart`, `kpi-strip`                      | **terminal** full tape + **options** for event vol                                 |
