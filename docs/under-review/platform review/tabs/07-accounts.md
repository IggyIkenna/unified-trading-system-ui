# Tab: Accounts

**Route:** `/services/trading/accounts`
**Page file:** `app/(platform)/services/trading/accounts/page.tsx`
**Lines:** 877 | **Status:** Full implementation (transfers use mock data)

---

## Current State

Venue balances and account management page. Shows NAV-level summary and per-venue breakdown.

**What it renders:**

- NAV KPI cards: total NAV, total margin used, available margin, margin utilisation %
- Per-venue balance table: venue, currency, balance, locked, available, USD equivalent
- `MarginUtilization` component — visual margin breakdown
- Collapsible `TransferPanel`: venue-to-venue transfer, sub-account transfer, withdraw, deposit forms
- `TransferHistoryTable`: recent transfer history

**Data sources:**

- `useBalances` — real API data for balance table and KPIs
- Transfer UI uses **hardcoded mock constants** (`MOCK_TRANSFER_HISTORY`, `MOCK_VENUE_BALANCES`, `CEFI_VENUES`) — NOT wired to API

**Filtering/scoping:** None. No global scope integration, no client/venue filters, no asset-class filtering.

---

## Meeting Review Items

From `trading-accounts-risk-pnl-reconciliation.md`:

- **Filter by client and venue:** Add client filter and venue filter to the accounts view.
- **Time series:** Currently snapshot-only. Add time series charts showing NAV and margin over time (borrow the chart pattern from Positions/Overview).
- **Accounts as high-level positions view:** The accounts tab is partly playing the role of a high-level positions summary. Make this explicit — link between accounts and positions is important.

---

## Improvements Needed

1. **Client filter:** Add a client selector (from `useOrganizationsList` or similar) so internal users can scope to a specific client's accounts.
2. **Venue filter:** Multi-select venue filter on the balance table.
3. **Time series chart:** NAV over time and margin utilisation over time. Toggle between snapshot and time series view. Share the chart component from Overview (`useTradingTimeseries`).
4. **Wire transfers to API:** Replace `MOCK_TRANSFER_HISTORY` and `MOCK_VENUE_BALANCES` in the transfer panel with real API calls when backend supports it.
5. **CeFi-only hardcoding:** `CEFI_VENUES` is hardcoded — transfers for DeFi (on-chain) and sports (bookmaker deposits/withdrawals) need different flows. Don't assume CeFi only.
6. **Link to positions:** Add a "View Positions" link/button per venue that takes the user to the Positions tab pre-filtered by that venue.
7. **Link from reconcile flow:** Unhealthy positions on the Positions tab should link to Accounts for the relevant venue when the discrepancy is balance-related.

---

## Asset-Class Relevance

**Common** — all asset classes have account balances. The current implementation is CeFi-biased (hardcoded CeFi venues in transfers). Needs to be generalised:

- CeFi: exchange account balances, margin, sub-accounts
- DeFi: wallet balances, on-chain protocol positions (Aave, Uniswap LP), gas reserves
- TradFi: brokerage account balances, margin, settlement accounts
- Sports+Predictions: bookmaker balances, Polymarket/Kalshi USDC balances

---

## Action

**Enhance** — add client/venue filters, time series, wire transfers to API, generalise beyond CeFi assumptions.
