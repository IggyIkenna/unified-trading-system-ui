# Position Summary

Tab: positions
Widget ID: positions-kpi-strip
Min size: 4 x 1 columns/rows

## What it shows

Six KPI metrics summarizing current positions: total count, total notional value, unrealized P&L, total margin, long exposure, and short exposure. Uses the shared `KpiStrip` component with dynamic sentiment coloring on P&L.

## Data sources

- `usePositionsData()` context → `summary` (derived from filtered positions)
- Upstream: `usePositions()` hook → `/api/positions/active`

## Configuration

- No widget-level configuration options

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `positions-filter`, `positions-table`, `account-balances`.
- **High-level book:** **overview** `kpi-strip`, `pnl-chart`.
- **Margin / health:** **risk** `risk-margin`, `risk-kpi-strip` · **accounts** `accounts-margin-util`.
