# 4.11 Accounts — Widget Audit & Merge Plan

> **Status:** DRAFT — awaiting user review
> **Page route:** `/services/trading/accounts`  
> **Deep link (same workspace tab):** `/services/trading/accounts/saft` — renders the same `accounts` workspace (widget toolbar + layouts); no separate nav item.

---

## Current Widget Inventory

| widgetId | Label | Component | Lines | Singleton | Default Preset |
|----------|-------|-----------|-------|-----------|----------------|
| `accounts-kpi-strip` | NAV Summary | `AccountsKpiWidget` | 30 | yes | 12x2 at (0,0) |
| `accounts-balance-table` | Per-Venue Balances | `AccountsBalanceTableWidget` | 99 | yes | 8x5 at (0,2) |
| `accounts-margin-util` | Margin Utilization | `AccountsMarginUtilWidget` | 15 | yes | 8x4 at (0,7) |
| `accounts-transfer` | Transfer Panel | `AccountsTransferWidget` | 390 | yes | 4x7 at (8,2) |
| `accounts-transfer-history` | Transfer History | `AccountsTransferHistoryWidget` | 85 | yes | 12x4 at (0,11) |
| `saft-portfolio` | SAFT & Token Warrants | `SaftPortfolioWidget` | ~339 | yes | 12x16 at (0,15) |

**Total: 6 widgets.**

**Data providers / data:**
- **`AccountsDataProvider`** wraps the page. Balances, margins, transfers, and transfer history consume `useAccountsData()`.
- **`saft-portfolio`** is self-contained: demo data from `MOCK_SAFTS` in `lib/mocks/fixtures/trading-pages.ts` (no API / not wired to `AccountsDataProvider`). "Add SAFT" dialog is UI-only (Save disabled).

**Presets:** 1 preset ("Default") — KPI (top) → Balance table (8 cols) + Transfer panel (4 cols) → Margin (8 cols) → Transfer History (full-width) → **SAFT & Token Warrants** (full-width, below history).

**Registry:** `availableOn: ["accounts"]` — included in **Default** and **Full** profiles for the `accounts` tab (`buildFullLayoutsForTab("accounts")` picks up all six).

---

## What Each Widget Does

### accounts-kpi-strip (30 lines)
- 3 KPIs: Total NAV, Available (Free), Locked (In Use).

### accounts-balance-table (99 lines)
- Per-venue DataTable: Venue, Free, Locked, Total, Margin Used, Margin Available, Utilization badge (colour-coded by threshold).

### accounts-margin-util (15 lines)
- Thin wrapper around shared `<MarginUtilization>` component.
- Shows margin utilization bars, trend, margin-call distance per venue.

### accounts-transfer (390 lines)
- The largest widget. Multi-type transfer form: Venue-to-Venue, Sub-Account, Withdraw, Deposit.
- Type pills at top, then contextual fields depending on type.
- Source/destination venue selectors, asset, amount, network, fee estimate.
- Confirmation dialog with risk warnings.

### accounts-transfer-history (85 lines)
- DataTable of recent transfers: Time, Type, From, To, Asset, Amount, Status (badge), Tx Hash.

### saft-portfolio (~339 lines)
- **Domain:** Private / treasury — Simple Agreements for Future Tokens (SAFT) and token-warrant style tracking (not CeFi venue balances).
- **Summary row:** Total SAFTs count, Total Committed, Vested Value (sum of `currentValue × vestedPct/100` over mock rows), Next Unlock (days to nearest future cliff among not-fully-vested rows; may show `--` if none match).
- **SAFT Portfolio table:** Token, round, committed $, token price, token quantity, vested % + bar, cliff / full-vest dates, current value, NPV.
- **Vesting timeline:** Per-row horizontal bar (cliff → vested region → "today" marker → full-vest dashed line); legend for cliff / vested / today / full vest.
- **Add SAFT:** Modal form (token, round, amounts, dates); submit not implemented.

---

## Testing Checklist

- [ ] **KPI strip:** NAV, Free, Locked values non-zero
- [ ] **Balance table:** Per-venue rows with all columns rendering
- [ ] **Margin util:** Bars render with utilization data
- [ ] **Transfer panel:** Type pills switch forms correctly; venue/asset/amount selectors work
- [ ] **Transfer panel:** Venue-to-Venue, Sub-Account, Withdraw, Deposit all have correct fields
- [ ] **Transfer history:** Rows with status badges
- [ ] **SAFT widget:** Summary cards, table, and vesting chart render from mock data; scroll layout acceptable at default 12×16
- [ ] **SAFT deep link:** `/services/trading/accounts/saft` shows `accounts` workspace toolbar and same widgets as main Accounts route
- [ ] **Full profile:** Catalogue includes `saft-portfolio` on Accounts tab

---

## Merge Proposal

### Option A — Merge KPI into balance table, merge margin into balance table (recommended)
- KPI strip → sticky header row on balance table.
- Margin util → additional column/section on balance table (already shows same venues).
- Keep transfer panel and history separate — they're a different functional domain (actions vs data).
- **Result:** 3 widgets (balance-table-with-kpi-and-margin, transfer-panel, transfer-history).

### Option B — No merge
- Current separation is clean — each widget is well-scoped.

### SAFT / treasury
- **`saft-portfolio`** is intentionally separate from venue balance widgets (different product semantics). Any future merge would be a product decision (e.g. tuck a one-line SAFT summary into KPI strip), not a layout-only refactor.

---

## Questions for User

1. **Merge?** Option A (consolidate balance/margin/kpi) or B (keep as-is)?
2. **Transfer panel:** At 390 lines it's the largest widget here. Is it functional or does it need work?
3. **Any broken data?** Do all venue widgets show data from `AccountsDataProvider`?
4. **SAFT:** When should this wire to a real API vs stay mock-only? Should "Add SAFT" persist anywhere?
