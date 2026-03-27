# Stress Scenarios

Tab: risk
Widget ID: risk-stress-table
Min size: 6 x 3 columns/rows

## What it shows

Historical stress scenario table with columns: Scenario, Multiplier, P&L Impact, VaR Impact, Positions Breaching, Largest Loss. Includes regime badge, regime multiplier slider, and on-demand stress test selector (GFC 2008, COVID 2020, Crypto Black Thursday) with results panel.

## Data sources

- `useRiskData()` context: stressScenarios, regimeData, regimeMultiplier, selectedStressScenario, stressTestResult

## Configuration

- Regime multiplier slider (global control).
- Stress scenario selector for on-demand tests.

## Recommended pairings

See [pairing guide](../pairing-guide.md).

- **Same tab:** `risk-var-chart`, `risk-exposure-attribution`, `risk-kpi-strip`, `risk-what-if-slider`.
- **Defi / tail:** **defi** `defi-lending`, `defi-wallet-summary` · **markets** `markets-recon`.
- **Incidents:** **alerts** `alerts-table`.
