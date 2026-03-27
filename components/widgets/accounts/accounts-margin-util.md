# Margin Utilization

Tab: accounts  
Widget ID: `accounts-margin-util`  
Min size: 4 × 3

## What it shows

Per-venue margin utilization from the shared `MarginUtilization` trading component: bars, trend, and margin-call distance.

## Data sources

- `useAccountsData()` → `venueMargins` (derived from `balances`)
- Upstream: `useBalances()` → `/api/positions/balances`

## Configuration

- None

## Recommended pairings

Place beside Per-Venue Balances or below NAV Summary.
