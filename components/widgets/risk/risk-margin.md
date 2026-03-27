# Margin & Health

Tab: risk
Widget ID: risk-margin
Min size: 4 x 3 columns/rows

## What it shows

CeFi margin by venue (limit bars), SPAN margin summary (IBKR initial/maintenance/offset/net with utilization progress bar), DeFi health factor bars, health factor time series chart (7 days with liquidation/deleverage reference lines), and distance-to-liquidation table.

## Data sources

- `useRiskData()` context: sortedLimits (margin/ltv categories), hfTimeSeries, distanceToLiquidation

## Configuration

- None. SPAN margins are hardcoded (noted in mock-data-changes.md).

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `risk-kpi-strip`, `risk-utilization`, `risk-circuit-breakers`.
- **Funding:** **accounts** `accounts-margin-util`, `accounts-balance-table` · **positions** `account-balances`.
- **Defi:** **defi** `defi-lending`, `defi-wallet-summary`.
