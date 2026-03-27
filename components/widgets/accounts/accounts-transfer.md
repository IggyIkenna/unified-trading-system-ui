# Transfer Panel

Tab: accounts  
Widget ID: `accounts-transfer`  
Min size: 3 × 4

## What it shows

Collapsible transfer flows: venue-to-venue, sub-account ↔ main, withdraw to wallet, and deposit from wallet. Compact controls (`h-8` inputs, pill-style type switcher). Available amounts use aggregated **free USD** per selected venue from live balances (not per-asset mock map).

## Data sources

- `useAccountsData()` → `balances` for venue free USD
- Static options: `lib/config/services/accounts.config.ts` (`CEFI_VENUES`, `TRANSFER_ASSETS`, etc.)

## Configuration

- None

## Recommended pairings

Often placed next to Per-Venue Balances; Transfer History below or full width.
