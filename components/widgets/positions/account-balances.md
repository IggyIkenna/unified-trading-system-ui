# Account Balances

Tab: positions
Widget ID: account-balances
Min size: 4 x 2 columns/rows

## What it shows

Venue balances table with free/locked/total amounts and utilization progress bars. Wrapped in a `CollapsibleSection` that defaults to collapsed. Shows total balance badge in the trailing slot and venue count.

## Data sources

- `usePositionsData()` context → `balances`, `balancesLoading`
- Upstream: `useBalances()` hook → `/api/positions/balances`

## Configuration

- No widget-level configuration options

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `positions-filter`, `positions-kpi-strip`, `positions-table`.
- **Cash & transfers:** **accounts** `accounts-transfer`, `accounts-transfer-history`, `accounts-balance-table`.
- **Risk:** **risk** `risk-margin`, `risk-utilization` · **defi** `defi-wallet-summary` for on-chain balances.
