# Accounts Page — Widget Decomposition Spec

Tab: `accounts`
Source: `app/(platform)/services/trading/accounts/page.tsx`
Lines: ~877

---

## 1. Page Analysis

### Current Sections

| Section                      | Lines   | Description                                                                                                                                          |
| ---------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header                       | 716–750 | Title with venue count badge, Transfer toggle button, Refresh button                                                                                 |
| NAV Summary KPIs             | 753–791 | 3-card grid: Total NAV, Available (Free), Locked (In Use)                                                                                            |
| Transfer Panel (Collapsible) | 794–799 | Collapsible section containing TransferPanel + TransferHistoryTable                                                                                  |
| TransferPanel                | 162–567 | Complex form: transfer type selector (venue-to-venue, sub-account, withdraw, deposit), venue/asset/amount selects, available balance, submit buttons |
| TransferHistoryTable         | 571–630 | Table with columns: time, type, from, to, asset, amount, status, tx hash                                                                             |
| MarginUtilization            | 802     | Imported `MarginUtilization` component with per-venue margin bars                                                                                    |
| Per-Venue Balance Table      | 805–873 | Table: venue, free, locked, total, margin used, margin available, utilization %                                                                      |

### Data Hooks Used

- `useBalances()` — fetches per-venue balance data

### Inline Mock Data

- `MOCK_TRANSFER_HISTORY` (lines 99–150) — 5 hardcoded transfer history entries
- `MOCK_VENUE_BALANCES` (lines 152–158) — per-venue per-asset balance map (used in TransferPanel for available balance)
- `CEFI_VENUES`, `SUB_ACCOUNT_VENUES`, `TRANSFER_ASSETS`, `NETWORKS`, `SUB_ACCOUNTS` (lines 66–86) — venue/asset/network constants
- `BalanceRecord` interface (lines 51–59) — could move to types

---

## 2. Widget Decomposition

| id                          | label              | description                                                                  | icon             | minW | minH | defaultW | defaultH | singleton |
| --------------------------- | ------------------ | ---------------------------------------------------------------------------- | ---------------- | ---- | ---- | -------- | -------- | --------- |
| `accounts-kpi-strip`        | NAV Summary        | Total NAV, Available (Free), Locked (In Use)                                 | `DollarSign`     | 3    | 1    | 12       | 2        | yes       |
| `accounts-balance-table`    | Per-Venue Balances | Table with free/locked/total/margin per venue + utilization badges           | `Wallet`         | 6    | 3    | 12       | 5        | yes       |
| `accounts-margin-util`      | Margin Utilization | Visual margin utilization bars per venue with trend and margin-call distance | `ShieldCheck`    | 4    | 3    | 12       | 4        | yes       |
| `accounts-transfer`         | Transfer Panel     | Form for venue-to-venue, sub-account, withdraw, deposit transfers            | `ArrowRightLeft` | 3    | 4    | 4        | 7        | yes       |
| `accounts-transfer-history` | Transfer History   | Recent transfer table with status badges and tx hashes                       | `Clock`          | 4    | 3    | 8        | 4        | yes       |

---

## 3. Data Context Shape

```typescript
export interface AccountsData {
  balances: BalanceRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;

  // Computed
  totalNAV: number;
  totalFree: number;
  totalLocked: number;
  venueMargins: VenueMargin[];

  // Transfer state
  transferOpen: boolean;
  setTransferOpen: (open: boolean) => void;
}

export interface BalanceRecord {
  venue: string;
  free: number;
  locked: number;
  total: number;
  margin_used?: number;
  margin_available?: number;
  margin_total?: number;
}
```

---

## 4. Mock Data Instructions

- **Move**: `MOCK_TRANSFER_HISTORY` → `lib/mocks/fixtures/transfer-history.ts`
- **Move**: `MOCK_VENUE_BALANCES` → `lib/mocks/fixtures/venue-balances.ts`
- **Move**: `CEFI_VENUES`, `SUB_ACCOUNT_VENUES`, `TRANSFER_ASSETS`, `NETWORKS`, `SUB_ACCOUNTS` → `lib/config/services/accounts.config.ts`
- **Move**: `BalanceRecord` interface → `lib/types/accounts.ts`
- **Add MSW handler**: Transfer history should come from a hook (`useTransferHistory()`) with MSW handler, not inline constant
- **Add MSW handler**: Available venue balances for the transfer panel should come from `useBalances()` rather than `MOCK_VENUE_BALANCES`

---

## 5. UI/UX Notes

- **Transfer Panel form density**: The transfer panel has many selects and inputs. In widget form at `w=4`, inputs should use compact sizing (`h-8` selects, smaller labels). Use `text-xs` for labels consistently.
- **Transfer Panel tabs**: The transfer type switcher (venue-to-venue, sub-account, withdraw, deposit) is currently a Select dropdown. Consider converting to pill tabs for quicker switching in a widget context.
- **Deposit QR placeholder**: The deposit panel shows a `32x32 QR` placeholder div. In widget mode, this should be proportionally smaller or hidden at narrow widths.
- **Balance table font sizing**: Already uses `font-mono` for numbers — good. In compact mode, reduce to `text-xs` throughout.
- **Copy address button**: Works well in widget context, no changes needed.
- **MarginUtilization**: Already a standalone component (`components/trading/margin-utilization.tsx`), wraps cleanly into a widget.

---

## 6. Collapsible Candidates

| Section            | Collapsible?            | Reason                                               |
| ------------------ | ----------------------- | ---------------------------------------------------- |
| Transfer Panel     | Yes (default collapsed) | Complex form, only needed when actively transferring |
| Transfer History   | Yes (default open)      | Useful context but not primary                       |
| Margin Utilization | No                      | Key risk view, always visible                        |
| Balance Table      | No                      | Primary data view                                    |
| KPI strip          | No                      | Summary, always visible                              |

---

## 7. Reusable Component Usage

| Shared Component     | Used In                                                               |
| -------------------- | --------------------------------------------------------------------- |
| `KpiStrip`           | `accounts-kpi-strip` — 3 metrics: NAV, free, locked                   |
| `DataTableWidget`    | `accounts-balance-table` — venue balance rows with utilization badges |
| `DataTableWidget`    | `accounts-transfer-history` — transfer history rows                   |
| `CollapsibleSection` | Transfer Panel widget body (default collapsed)                        |

---

## 8. Default Preset Layout

12-column grid:

```
| accounts-kpi-strip (0,0) w=12 h=2                                  |
| accounts-balance-table (0,2) w=8 h=5  | accounts-transfer (8,2) w=4 h=7  |
| accounts-margin-util (0,7) w=8 h=4    |                                    |
| accounts-transfer-history (0,11) w=12 h=4                          |
```

```typescript
registerPresets("accounts", [
  {
    id: "accounts-default",
    name: "Default",
    tab: "accounts",
    isPreset: true,
    layouts: [
      { widgetId: "accounts-kpi-strip", instanceId: "accounts-kpi-strip-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "accounts-balance-table", instanceId: "accounts-balance-table-1", x: 0, y: 2, w: 8, h: 5 },
      { widgetId: "accounts-transfer", instanceId: "accounts-transfer-1", x: 8, y: 2, w: 4, h: 7 },
      { widgetId: "accounts-margin-util", instanceId: "accounts-margin-util-1", x: 0, y: 7, w: 8, h: 4 },
      { widgetId: "accounts-transfer-history", instanceId: "accounts-transfer-history-1", x: 0, y: 11, w: 12, h: 4 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);
```

---

## 9. Questions to Resolve

1. **Transfer panel as widget or embedded?** The transfer panel is complex (4 transfer types, many form fields). Should it be a standalone widget or remain a collapsible section within a combined accounts widget?
2. **Transfer history data source**: Currently hardcoded `MOCK_TRANSFER_HISTORY`. A `useTransferHistory()` hook should be created — confirm endpoint shape.
3. **Venue balance available for transfer**: The transfer panel uses `MOCK_VENUE_BALANCES` for per-asset balances. Should this come from a separate endpoint or be derived from `useBalances()`?
4. **MarginUtilization already imported**: `components/trading/margin-utilization.tsx` is already a standalone component. Should the widget be a thin wrapper, or should MarginUtilization be enhanced to accept widget-context props?
5. **Deposit QR code**: The QR placeholder is static. Is there a plan to generate real deposit addresses, or should this remain a placeholder?
