# NAV Summary

Tab: accounts  
Widget ID: `accounts-kpi-strip`  
Min size: 3 × 1 (columns × rows)

## What it shows

Three KPIs: total NAV, available (free) balance, and locked (in use) balance, aggregated across all venue balance rows from the API.

## Data sources

- `useAccountsData()` → `totalNAV`, `totalFree`, `totalLocked` (derived from `balances`)
- Upstream: `useBalances()` → `/api/positions/balances`

## Configuration

- None

## Recommended pairings

Works with Per-Venue Balances and Margin Utilization widgets on the same tab.
