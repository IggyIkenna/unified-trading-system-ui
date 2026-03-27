# Positions Table

Tab: positions
Widget ID: positions-table
Min size: 6 x 3 columns/rows

## What it shows

Main positions data table with sortable columns: instrument (with strategy name and clickable link to instrument page), side (with LONG/SHORT badges), quantity, entry/current price, P&L (with percentage), venue, health factor (DeFi only), and last updated time. Includes Refresh button and Export dropdown in the widget header. Uses `DataTableWidget` with compact mode.

## Data sources

- `usePositionsData()` context → `filteredPositions`, `isLive`
- Real-time updates via WebSocket (managed by data context)
- Upstream: `usePositions()` hook → `/api/positions/active`

## Configuration

- No widget-level configuration options

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `positions-filter`, `positions-kpi-strip`, `account-balances`.
- **Portfolio / NAV:** **accounts** `accounts-balance-table`, `accounts-margin-util` · **overview** `pnl-chart`, `strategy-table`.
- **Risk:** **risk** `risk-exposure-attribution`, `risk-var-chart`, `risk-margin` · **alerts** `alerts-table`.
- **Execution context:** **terminal** `instrument-bar`, `price-chart` · **orders** `orders-table`.
