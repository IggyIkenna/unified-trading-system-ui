# Widget: P&L Time Series

- **ID:** `pnl-time-series`
- **Data:** `usePnLData()` — `timeSeriesData`, `timeSeriesNetPnL`.
- **Config:** Factor colors from `lib/config/services/pnl.config.ts` (`PNL_FACTOR_CHART_COLORS`).
- **Behavior:** Recharts stacked `AreaChart`; positive and negative stack IDs; fills available height via `ResponsiveContainer`.
