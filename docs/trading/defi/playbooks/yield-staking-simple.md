---
title: YIELD_STAKING_SIMPLE — Operator Playbook
archetype: YIELD_STAKING_SIMPLE
status: draft
owner: ComsicTrader
last_updated: 2026-04-21
pairs_with_spec: tests/e2e/strategies/defi/yield-staking-simple.spec.ts
---

# YIELD_STAKING_SIMPLE — Operator Playbook

A step-by-step manual flow an operator can follow in the UI to review the simple-staking book. Each **Scenario** is one user intent (baseline render, tab-by-tab verification). Each scenario has **Do → Observe → Pass criterion**. The matching Playwright spec automates every Pass criterion so you can re-run the flow as regression.

Source audit: [docs/audits/strategy-widget-findings/yield-staking-simple.md](../../../audits/strategy-widget-findings/yield-staking-simple.md)
Codex SSOT: [architecture-v2/archetypes/yield-staking-simple.md](../../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/yield-staking-simple.md)

---

## 1. What this strategy does (1 paragraph)

Single-asset delegated staking across liquid-staking protocols (Lido, Rocket Pool, Marinade, Jito) and native PoS networks (ETH, SOL, MATIC, DOT, ATOM). No leverage, no borrow leg, no rotation logic — capital is parked with a validator set, earns protocol inflation plus MEV/priority-fee share, and exits via the network's native cooldown period (7 days on EigenLayer, 21 on MATIC/ATOM, 28 on DOT, 2 epochs on SOL). P&L is reward accrual minus validator commission. Kill switches: validator slashing, liquid-staking-token depeg >1%, protocol incident.

Example instance: `YIELD_STAKING_SIMPLE@lido-eth-prod`.

## 2. Prerequisites

- Dev server running at `http://localhost:3100` (UI). Mock-mode data is hard-coded on the dashboard — no mock-API dependency.
- Auth in mock mode — `localStorage.portal_user` + `localStorage.portal_token` seeded with the `internal-trader` persona (spec handles this automatically).
- Execution mode: **Live** (top-of-page badge reflects the current mode; dashboard is read-only regardless). Paper / Batch mode render identically — this surface does not submit orders.
- No preset dependency — the staking route renders a single page component, not a widget grid.

## 3. Route + widget map

Route: `http://localhost:3100/services/trading/defi/staking`

| Surface               | Role in this strategy                                         | `data-testid`                                                                                                                               |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Page root             | Dashboard container; scroll surface                           | `staking-dashboard`                                                                                                                         |
| KPI strip             | Aggregate book metrics                                        | `staking-kpi-strip`; `staking-kpi-total-staked`, `staking-kpi-annual-yield`, `staking-kpi-rewards-accrued`, `staking-kpi-active-validators` |
| Tab bar               | Switches between Positions / Validators / Rewards / Unstaking | `staking-tabs-list`; `staking-tab-positions`, `staking-tab-validators`, `staking-tab-rewards`, `staking-tab-unstaking`                      |
| Positions table       | One row per `(protocol, token)` staking position              | `staking-positions-table`; row: `staking-positions-row`                                                                                     |
| Validators table      | One row per delegated validator                               | `staking-validators-table`; row: `staking-validators-row`                                                                                   |
| Monthly rewards chart | Bar chart of the last 6 months of reward accrual              | `staking-monthly-rewards-chart`                                                                                                             |
| Rewards history table | One row per reward epoch                                      | `staking-rewards-table`; row: `staking-rewards-row`                                                                                         |
| Unstaking queue table | Pending cooldowns + ready-to-withdraw rows                    | `staking-unstaking-table`; row: `staking-unstaking-row` (with `data-unstaking-status`)                                                      |
| Withdraw button       | Per-row action on Unstaking tab; disabled while cooling       | `staking-unstaking-withdraw-button`                                                                                                         |

**Out of scope for this playbook:** stake / unstake order forms, validator-picker workflow, LST-depeg monitor. The current surface is read-only — these actions would live on a future execute-side widget (tracked in §9).

---

## 4. Scenario 1 — Baseline render

Goal: confirm the page loads clean, KPIs populate, tab bar is present, Positions is the default tab.

| #   | Do                                           | Observe                                                                 | Pass criterion                                              |
| --- | -------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1.1 | Navigate to `/services/trading/defi/staking` | Page renders with a page header, KPI strip, tab bar, and a content card | `staking-dashboard` present in DOM                          |
| 1.2 | Look at the KPI strip                        | 4 cards: Total Staked, Annual Yield, Rewards Accrued, Active Validators | All four `staking-kpi-*` testids visible                    |
| 1.3 | Look at the Total Staked card                | Shows a formatted USD value, e.g. `$4.2M`                               | Text matches `/\$\d+(\.\d+)?M/`                             |
| 1.4 | Look at the Annual Yield card                | Shows a percentage, e.g. `5.3%`                                         | Text matches `/\d+(\.\d+)?%/`                               |
| 1.5 | Look at the tab bar                          | Four tabs present, Positions is active by default                       | `staking-positions-table` visible without clicking anything |

---

## 5. Scenario 2 — Positions tab

Goal: confirm the positions book populates from the fixture and renders one row per position.

| #   | Do                                                       | Observe                                                                                                          | Pass criterion                      |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 2.1 | Click `staking-tab-positions` (or just land on the page) | Positions table appears with header row + data rows                                                              | `staking-positions-table` visible   |
| 2.2 | Count rows                                               | 8 rows in the current fixture (Lido, Rocket Pool, Native MATIC, Marinade, Osmosis, Native DOT, EigenLayer, Jito) | ≥ 1 `staking-positions-row` present |
| 2.3 | Inspect the first row                                    | Shows protocol, token badge, amount, USD, APY, rewards, lock period, unlock date, status badge, action buttons   | Row text content non-empty          |
| 2.4 | Look at status badges                                    | Mix of Active / Cooldown / Withdrawable                                                                          | (manual check)                      |

---

## 6. Scenario 3 — Validators tab

Goal: confirm tab switching works and the validator registry populates.

| #   | Do                             | Observe                                                                                                               | Pass criterion                                                       |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 3.1 | Click `staking-tab-validators` | Positions table hides, validators table appears                                                                       | `staking-validators-table` visible, `staking-positions-table` hidden |
| 3.2 | Count rows                     | 12 rows in the current fixture                                                                                        | ≥ 1 `staking-validators-row`                                         |
| 3.3 | Inspect a row                  | Shows validator name, network badge, commission, uptime, delegated amount, performance score + label, slashing events | Row text non-empty                                                   |
| 3.4 | Look at the Stakely row        | Performance 82 → Poor label with rose color; all others Good/Excellent                                                | (manual check)                                                       |

---

## 7. Scenario 4 — Rewards tab

Goal: confirm the monthly chart + reward-history table render.

| #   | Do                          | Observe                                                                        | Pass criterion                                                              |
| --- | --------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 4.1 | Click `staking-tab-rewards` | Two cards appear: Monthly Staking Rewards (bar chart) + Reward History (table) | `staking-monthly-rewards-chart` visible AND `staking-rewards-table` visible |
| 4.2 | Look at the monthly chart   | 6 bars (Oct 2025 → Mar 2026), heights scale with reward amount                 | (manual check)                                                              |
| 4.3 | Count reward rows           | 20 rows in the current fixture                                                 | ≥ 1 `staking-rewards-row`                                                   |
| 4.4 | Validators table is hidden  | Only rewards content visible                                                   | `staking-validators-table` hidden                                           |

---

## 8. Scenario 5 — Unstaking queue tab

Goal: confirm the cooldown queue renders and the Withdraw button is only enabled for `Ready to Withdraw` rows.

| #   | Do                                   | Observe                                                                                   | Pass criterion                                                              |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 5.1 | Click `staking-tab-unstaking`        | Queue table appears with 3 rows (2 Cooling Down + 1 Ready to Withdraw in current fixture) | `staking-unstaking-table` visible; ≥ 1 `staking-unstaking-row`              |
| 5.2 | Look at the Cooling Down rows        | Countdown column shows `Nd remaining`, status badge amber                                 | `data-unstaking-status="Cooling Down"` rows have disabled Withdraw button   |
| 5.3 | Look at the Ready to Withdraw row    | Countdown shows `Ready` in emerald, Withdraw button enabled + emerald                     | `data-unstaking-status="Ready to Withdraw"` row has enabled Withdraw button |
| 5.4 | Click Withdraw on a Cooling Down row | No response (button is disabled)                                                          | Button has `disabled` attribute                                             |

---

## 9. Known gaps (do not flag as regressions)

These are **expected** — the surface is intentionally read-only today. Don't treat them as bugs during manual verification.

| #   | Gap                                                          | Where it bites                                          | Tracked in                                                                   |
| --- | ------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 9.1 | No stake / unstake order form on this page                   | Operator cannot initiate a new stake from the dashboard | Pending — Stake widget to be ported from `defi-staking-widget` once designed |
| 9.2 | "Stake More" / "Unstake" buttons on Positions rows are inert | No click handler wired                                  | Pending — ties to 9.1                                                        |
| 9.3 | "Withdraw" button on Unstaking rows is inert when enabled    | No click handler wired                                  | Pending — ties to 9.1                                                        |
| 9.4 | Export button has no download action                         | Placeholder chrome                                      | Pending — export pipeline for this page is not built                         |
| 9.5 | KPI + table data are hardcoded constants                     | Not fed from `defi-data-context` yet                    | Pending — data-context integration after the execute surface lands           |
| 9.6 | No LST-depeg monitor widget                                  | Can't exercise the depeg kill-switch                    | Tracked with other DeFi monitor gaps                                         |
| 9.7 | Monthly rewards chart is a CSS bar chart, not Recharts       | Hover tooltip + axes missing                            | Pending — swap to shared chart primitive                                     |

---

## 10. Regression spec

**File:** [tests/e2e/strategies/defi/yield-staking-simple.spec.ts](../../../../tests/e2e/strategies/defi/yield-staking-simple.spec.ts)

**Run:**

```bash
# All tests in the spec
npx playwright test tests/e2e/strategies/defi/yield-staking-simple.spec.ts

# Headed (watch it run)
npx playwright test tests/e2e/strategies/defi/yield-staking-simple.spec.ts --headed

# One scenario only, by test name
npx playwright test tests/e2e/strategies/defi/yield-staking-simple.spec.ts -g "Rewards tab"
```

Spec tests map 1:1 to Scenarios 1–5 above:

| Playbook scenario | Spec test                                                        |
| ----------------- | ---------------------------------------------------------------- |
| §4 Baseline       | `baseline — page renders with 4 KPI cards and 4 tabs`            |
| §5 Positions      | `Positions tab — table renders staking-position rows`            |
| §6 Validators     | `Validators tab — switching tab swaps the visible table`         |
| §7 Rewards        | `Rewards tab — shows monthly chart and reward history`           |
| §8 Unstaking      | `Unstaking tab — Withdraw button disabled for Cooling Down rows` |

The spec uses the shared `seedPersona` + `demoPause` helpers but skips the `verifyScenarioOutcome` verify helpers — there are no trade-history rows to count on this read-only surface.

---

## 11. Troubleshooting

- **Page is blank / dashboard root not found** — dev server may be down. Confirm with `curl http://localhost:3100` (expect 200). Restart via `npm run dev` if needed.
- **KPIs show `$NaNM` or `NaN%`** — fixture arithmetic divided by zero. Check that `STAKING_POSITIONS` has at least one row (currently 8 hardcoded).
- **Withdraw button enabled for a Cooling Down row** — regression; spec §8 guards against this. File a bug against this page.
- **Tab click does nothing** — Radix Tabs sometimes miss the first click after hard reload; wait 200 ms and retry. Not seen in CI.
