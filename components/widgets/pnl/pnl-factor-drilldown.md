# Widget: Factor Breakdown

- **ID:** `pnl-factor-drilldown`
- **Data:** `usePnLData()` — `selectedFactorData`, `setSelectedFactor`, `viewMode` for empty-state copy.
- **Shared UI:** `EntityLink` (strategy), `PnLValue`, Recharts `AreaChart` for per-strategy series.
- **Behavior:** When no factor selected, shows guidance; with selection, strategy bars + stacked areas over time.
