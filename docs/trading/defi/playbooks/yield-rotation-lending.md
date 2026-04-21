---
title: YIELD_ROTATION_LENDING — Operator Playbook
archetype: YIELD_ROTATION_LENDING
status: draft
owner: ComsicTrader
last_updated: 2026-04-21
pairs_with_spec: tests/e2e/strategies/defi/yield-rotation-lending.spec.ts
---

# YIELD_ROTATION_LENDING — Operator Playbook

A step-by-step manual flow an operator can follow in the UI to replicate the lending-rotation strategy. Each **Scenario** is one user intent (baseline, lend, withdraw, rotate, exit). Each scenario has **Do → Observe → Pass criterion**. The matching Playwright spec automates every Pass criterion so you can re-run the flow as regression.

Source audit: [docs/audits/strategy-widget-findings/yield-rotation-lending.md](../../../audits/strategy-widget-findings/yield-rotation-lending.md)
Codex SSOT: [architecture-v2/archetypes/yield-rotation-lending.md](../../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/yield-rotation-lending.md)

---

## 1. What this strategy does (1 paragraph)

Single-sided supply — no leverage — into lending protocols (Aave V3, Compound V3, Morpho, Euler, Kamino). Capital rotates across `(protocol, chain, asset)` tuples when the APY differential exceeds the gas + bridge cost to move. Held-to-earn between rotations. One active supply leg per strategy instance, possibly fragmented across chains per `max_pct_per_chain`. P&L is supply-APY index growth, minus gas + bridge fees, plus (optional) reward-token accrual (AAVE / COMP / MORPHO). Kill switches: protocol incident, stablecoin depeg >1%, pool utilization >95%, Chainlink oracle divergence >3%.

Example instance: `YIELD_ROTATION_LENDING@aave-multichain-usdc-prod`.

## 2. Prerequisites

- Dev server running at `http://localhost:3100` (UI) and `http://localhost:8030` (mock API).
- Auth in mock mode — `localStorage.portal_user` + `localStorage.portal_token` seeded with the `internal-trader` persona (spec handles this automatically).
- Execution mode: **Live** (top-of-page toggle). Paper mode works identically but rows are tagged with `(Paper)` suffix; Batch mode is read-only and LEND clicks are ignored.
- Default preset on the DeFi tab (`defi-default`) — mounts `wallet-summary`, `lending`, `swap`, `staking`, `transfer`, `trade-history`. If a different preset is loaded, switch back via the preset picker.

## 3. Route + widget map

Route: `http://localhost:3100/services/trading/defi`

| Widget                | Role in this strategy                                                       | `data-testid`                                                                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defi-wallet-summary` | Shows per-chain balances — verify the asset you will LEND is present        | (no testid; text-based)                                                                                                                                                                |
| `defi-lending`        | **Primary execute surface** — LEND / BORROW / WITHDRAW / REPAY              | `defi-lending-widget` root; `protocol-select`, `asset-select`, `amount-input`, `operation-button-LEND`, `operation-button-WITHDRAW`, `execute-button`, `supply-apy`, `expected-output` |
| `defi-swap`           | Intra-family swap (hold USDT, target needs USDC)                            | _no testids yet — manual-only_                                                                                                                                                         |
| `defi-transfer`       | BRIDGE leg of rotation (chain A → chain B)                                  | _no testids yet — manual-only_                                                                                                                                                         |
| `defi-trade-history`  | Verification surface — every emitted order appears here ~200 ms after click | `trade-history-row` (parent), `data-trade-type`, `data-trade-venue`, `data-trade-strategy` attrs                                                                                       |

**Out of scope for this playbook (scoped out per audit §6.a):** APY heatmap, rotation-workflow composite, bridge-transit monitor, stablecoin depeg monitor, Chainlink oracle monitor. These widgets don't exist yet — noted in §9 (Known gaps).

---

## 4. Scenario 1 — Baseline check

Goal: confirm the page loads clean and no ghost rows are in trade history before you start.

| #   | Do                                   | Observe                                                                                                               | Pass criterion                                                                        |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1.1 | Navigate to `/services/trading/defi` | Page renders; 6 widgets visible                                                                                       | `defi-lending-widget`, `defi-wallet-summary`, `defi-trade-history` all present in DOM |
| 1.2 | Look at the `DeFi Lending` widget    | Default state: protocol-select shows a protocol, asset-select shows an asset, `LEND` operation is highlighted emerald | `operation-button-LEND` has class `bg-emerald-600`                                    |
| 1.3 | Look at `supply-apy` text            | Non-empty percentage, e.g. `3.25%`                                                                                    | `supply-apy` textContent matches `/\d+(\.\d+)?%/`                                     |
| 1.4 | Look at `amount-input`               | Empty; `execute-button` disabled                                                                                      | `amount-input` value is `""`, `execute-button` disabled                               |
| 1.5 | Scroll to trade-history widget       | Shows empty state `"No trade history yet. Execute a DeFi instruction to see results here."`                           | Zero `trade-history-row` elements present                                             |

---

## 5. Scenario 2 — LEND (happy path)

Goal: deposit USDC into Aave V3, verify the order fires, trade history gains a row, wallet balance drops.

| #   | Do                                                                                                 | Observe                                                                                                                                       | Pass criterion                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | In `DeFi Lending`, click `protocol-select` → pick **Aave V3** (default is usually already Aave V3) | Asset options update to reflect Aave V3's supported assets                                                                                    | `asset-select` shows options like `USDC / USDT / DAI / ETH / stETH / wBTC`                                                    |
| 2.2 | Click `asset-select` → pick **USDC**                                                               | `supply-apy` updates, e.g. to ~3.25%                                                                                                          | `supply-apy` text changes and remains `/\d+(\.\d+)?%/`                                                                        |
| 2.3 | Make sure `LEND` is the active operation                                                           | LEND button emerald                                                                                                                           | `operation-button-LEND` has `bg-emerald-600` class                                                                            |
| 2.4 | Type `1000` into `amount-input`                                                                    | `expected-output` block appears, shows something like `1000 aUSDC`                                                                            | `execute-button` is enabled; `expected-output` text contains `aUSDC`                                                          |
| 2.5 | Click `execute-button`                                                                             | Sonner toast: `DeFi order placed — LEND 1000 USDC on Aave V3`. Amount input clears.                                                           | Toast visible ≤ 2 s; `amount-input` value back to `""`                                                                        |
| 2.6 | Look at `defi-trade-history` after ~500 ms                                                         | A new parent row appears. Columns: `#1`, timestamp (UTC), strategy id, `Type=LEND`, `Venue=AAVEV3-…`, `Amount=1,000`, Alpha/Net P&L populated | A `trade-history-row` exists with `data-trade-type="LEND"` and `data-trade-venue` matching the selected protocol's `venue_id` |
| 2.7 | Look at `defi-wallet-summary` for the active chain                                                 | USDC balance decreased by ~1000                                                                                                               | (manual check — no testid yet)                                                                                                |

---

## 6. Scenario 3 — WITHDRAW

Goal: redeem the position just opened. Verifies the opposite side of the LEND flow.

| #   | Do                                             | Observe                                                                                          | Pass criterion                                                                                                  |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 3.1 | Same widget. Click `operation-button-WITHDRAW` | WITHDRAW button emerald; `expected-output` block flips to show `… USDC` (underlying, not aToken) | `operation-button-WITHDRAW` has `bg-emerald-600`; `expected-output` text contains `USDC` without `aUSDC` prefix |
| 3.2 | Type `500` in `amount-input`                   | `expected-output` shows a number slightly > 500 (WITHDRAW includes accrued yield)                | `expected-output` text matches `/\d+(\.\d+)?\s+USDC/`                                                           |
| 3.3 | Click `execute-button`                         | Toast: `DeFi order placed — WITHDRAW 500 USDC …`                                                 | Toast visible ≤ 2 s; `amount-input` cleared                                                                     |
| 3.4 | Trade history                                  | New parent row appended with `Type=WITHDRAW`, `Venue=AAVEV3-…`                                   | New `trade-history-row` with `data-trade-type="WITHDRAW"`                                                       |
| 3.5 | Wallet summary                                 | USDC balance recovers by ~500                                                                    | (manual check)                                                                                                  |

---

## 7. Scenario 4 — Protocol / asset reactivity

Goal: confirm the widget is actually reading the selected `(protocol, asset)` tuple, not caching stale APYs.

| #   | Do                                                                  | Observe                               | Pass criterion                                    |
| --- | ------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------- |
| 4.1 | Note the current `supply-apy` value for Aave V3 + USDC              | e.g. `3.25%`                          | Capture text                                      |
| 4.2 | Click `protocol-select` → pick **Morpho**                           | `supply-apy` changes to Morpho's rate | `supply-apy` textContent differs from 4.1 capture |
| 4.3 | Click `asset-select` → pick a different asset if Morpho supports it | `supply-apy` changes again            | textContent differs from 4.2                      |
| 4.4 | Return to **Aave V3** + **USDC**                                    | APY returns to the 4.1 value          | textContent matches 4.1 capture                   |

---

## 8. Scenario 5 (MANUAL-ONLY) — Full rotation across chains

Goal: WITHDRAW from one `(protocol, chain)` → BRIDGE to another chain → LEND on the target.

**Not in the automated spec yet** — `defi-transfer-widget` + `defi-swap-widget` have no `data-testid` coverage. Run this by hand for now; the spec will be extended when testids land (tracked as a follow-up).

| #   | Do                                                                                                       | Observe                                                                  |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 5.1 | WITHDRAW USDC from Aave V3 Ethereum (as in §6)                                                           | Trade-history row, wallet USDC restored on Ethereum                      |
| 5.2 | Open `defi-transfer-widget`, select `Bridge` mode, route USDC Ethereum → Arbitrum                        | Route preview shows fees + ETA; submit accepted, toast fires             |
| 5.3 | In `defi-lending-widget`, switch protocol to **Aave V3 Arbitrum** (if in fixture), asset USDC, LEND 1000 | LEND trade-history row on AAVEV3-ARBITRUM                                |
| 5.4 | Trade-history now contains 3 rows: WITHDRAW@ETH, BRIDGE, LEND@ARB                                        | All tagged with the same `strategy_id` (**currently broken — see §9.1**) |

**Fixture limitation:** only 5 of 22+ `(protocol, chain)` tuples are populated today — `AAVEV3-ETHEREUM`, `MORPHO-ETHEREUM`, `COMPOUNDV3-ETHEREUM`, `AAVEV3-ARBITRUM`, `KAMINO-SOLANA`. The rotation exercise is limited to these pairs until the fixture is expanded (audit §6.a.2).

---

## 9. Known gaps (do not flag as regressions)

These are **expected** failures — the strategy isn't UI-complete yet. Don't treat them as bugs during manual verification.

| #   | Gap                                                                                                  | Where it bites                                                                         | Tracked in                                                       |
| --- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 9.1 | `strategy_id` is hardcoded `"AAVE_LENDING"` / `"CROSS_CHAIN_SOR"` across the 3 execute widgets       | Trade-history `strategy_id` column shows the wrong literal for every non-Aave instance | Audit §6.a.1. Partial fix landed in `1e456a0`; full fix pending. |
| 9.2 | Only 5 `(protocol, chain)` tuples in the fixture                                                     | Rotation exercise limited to 5 cells                                                   | Audit §6.a.2                                                     |
| 9.3 | No APY heatmap widget                                                                                | Operator can't visually pick the winner tuple                                          | Audit §6.a.3 — new widget `defi-apy-heatmap-widget` (P0)         |
| 9.4 | No rotation-workflow composite                                                                       | Operator must compose WITHDRAW + BRIDGE + LEND by hand across 3 widgets                | Audit §6.b.1 — `defi-rotation-workflow-widget` (P1)              |
| 9.5 | No stablecoin depeg monitor                                                                          | Can't trigger emergency-exit from a depeg event                                        | Audit §6.b.3 — `defi-peg-monitor-widget` (P0)                    |
| 9.6 | No Chainlink oracle-divergence monitor                                                               | Can't exercise kill-switch 3                                                           | Audit §6.b.4                                                     |
| 9.7 | `defi-rates-overview-widget` is a flat table, not a heatmap, no net-APY column                       | Rotation decision is on gross APY only                                                 | Audit §6.b.7                                                     |
| 9.8 | `defi-reward-pnl-widget` factor labels are staking-coded (`staking_yield`, `restaking_reward`, etc.) | AAVE / COMP / MORPHO reward accrual not labelled correctly                             | Audit §6.b.8 — partial fix in `de14cf2`                          |

---

## 10. Regression spec

**File:** [tests/e2e/strategies/defi/yield-rotation-lending.spec.ts](../../../../tests/e2e/strategies/defi/yield-rotation-lending.spec.ts)

**Run:**

```bash
# All tests in the spec
npx playwright test tests/e2e/strategies/defi/yield-rotation-lending.spec.ts

# Headed (watch it run)
npx playwright test tests/e2e/strategies/defi/yield-rotation-lending.spec.ts --headed

# One scenario only, by test name
npx playwright test tests/e2e/strategies/defi/yield-rotation-lending.spec.ts -g "LEND produces trade-history row"
```

Spec tests map 1:1 to Scenarios 1–4 above:

| Playbook scenario | Spec test                                                                    |
| ----------------- | ---------------------------------------------------------------------------- |
| §4 Baseline       | `baseline — widgets render, trade history empty`                             |
| §5 LEND           | `LEND produces trade-history row with correct type and venue`                |
| §6 WITHDRAW       | `WITHDRAW produces trade-history row`                                        |
| §7 Reactivity     | `protocol switch updates supply-apy`, `asset switch updates expected-output` |

The existing [aave-lending.spec.ts](../../../../tests/e2e/strategies/defi/aave-lending.spec.ts) covers low-level widget mechanics (input/output reactivity, HF delta on BORROW/REPAY, slippage, edge cases). This spec is **strategy-flow**-oriented and doesn't duplicate those cases.

---

## 11. Troubleshooting

- **Widget doesn't load, page hangs** — check mock API is up: `curl http://localhost:8030/health`. If dev server is the issue, `npm run dev` in this repo.
- **Trade-history stays empty after clicking Execute** — the mock ledger fills after a 200 ms delay. If still empty after 2 s, check browser console for `[defi-data-context] executeDeFiOrder ignored in batch mode` — switch to Live or Paper at the top.
- **Toast doesn't appear** — sonner toasts can be hidden behind other panels at small viewport sizes; resize browser ≥ 1280 px wide.
- **APY shows `0.00%`** — fixture has a pool with no supply rate for the selected asset. Pick a different asset (USDC is always safe).
