# Transfer History

Tab: accounts  
Widget ID: `accounts-transfer-history`  
Min size: 4 × 3

## What it shows

Recent transfers in a compact `DataTableWidget`: time, type, from/to, asset, amount, status badge, and tx hash. Supports retry when the history request fails.

## Data sources

- `useAccountsData()` → `transferHistory`, loading and error from `useTransferHistory()`
- Upstream: `useTransferHistory()` → `/api/accounts/transfer-history` (Next route + mock handler fixture)

## Configuration

- None

## Recommended pairings

Full-width under balances and margin widgets, or tabbed with other wide tables.
