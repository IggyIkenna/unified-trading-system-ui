# DeFi trading widgets

Workspace tab: `defi` (`/services/trading/defi`).

## Data

- **Provider:** `components/widgets/defi/defi-data-context.tsx` — mock-backed `DeFiDataContextValue` aligned with [`defi-widgets.md`](./defi-widgets.md) (wallet, lending, swap route template, pools, staking, flash steps, transfer mode, `executeDeFiOrder`).
- **Types:** `lib/types/defi.ts`
- **Fixtures:** `lib/mocks/fixtures/defi-*.ts`
- **Config:** `lib/config/services/defi.config.ts` (fee tiers, flash operation types, flash venues)

## Widgets

| id                    | Component                        |
| --------------------- | -------------------------------- |
| `defi-wallet-summary` | `defi-wallet-summary-widget.tsx` |
| `defi-lending`        | `defi-lending-widget.tsx`        |
| `defi-swap`           | `defi-swap-widget.tsx`           |
| `defi-liquidity`      | `defi-liquidity-widget.tsx`      |
| `defi-staking`        | `defi-staking-widget.tsx`        |
| `defi-flash-loans`    | `defi-flash-loans-widget.tsx`    |
| `defi-transfer`       | `defi-transfer-widget.tsx`       |
| `defi-rates-overview` | `defi-rates-overview-widget.tsx` |

## Shared components

- `KpiStrip` — wallet summary; rates overview header metrics.
- `CollapsibleSection` — swap route details, liquidity pool info, flash borrow/repay, bridge fee/time.
- `DataTableWidget` — rates comparison table.

## Presets

Registered in `components/widgets/defi/register.ts`: **Default** and **Advanced** (see spec section 8 for layout coordinates).

## Legacy panel

`components/trading/defi-ops-panel.tsx` remains available for any non-widget embeds; the DeFi route uses the widget grid only.
