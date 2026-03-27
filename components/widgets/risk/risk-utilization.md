# Highest Utilization

Tab: risk
Widget ID: risk-utilization
Min size: 4 x 2 columns/rows

## What it shows

Top 8 limits ranked by utilization percentage, displayed as horizontal limit bars with value/limit labels.

## Data sources

- `useRiskData()` context: sortedLimits

## Configuration

- None.

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `risk-limits-hierarchy`, `risk-kpi-strip`, `risk-stress-table`.
- **Limits detail:** **accounts** `accounts-margin-util` · **positions** `account-balances`.
- **Market ops:** **markets** `markets-recon`, `markets-latency-summary`.
