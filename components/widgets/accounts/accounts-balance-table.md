# Per-Venue Balances

Tab: accounts  
Widget ID: `accounts-balance-table`  
Min size: 6 × 3

## What it shows

Sortable table of venue balances: free, locked, total, margin used, margin available, and utilization as a color-coded badge.

## Data sources

- `useAccountsData()` → `balances`
- Upstream: `useBalances()` → `/api/positions/balances`

## Configuration

- None

## Recommended pairings

Pairs with NAV Summary and Margin Utilization for a full account snapshot.
