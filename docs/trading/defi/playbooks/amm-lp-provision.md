---
title: AMM_LP_PROVISION — Operator Playbook
archetype: AMM_LP_PROVISION
status: draft
owner: ComsicTrader
last_updated: 2026-04-21
pairs_with_spec: tests/e2e/strategies/defi/amm-lp-provision.spec.ts
---

# AMM_LP_PROVISION — Operator Playbook

A step-by-step manual flow an operator can follow in the UI to replicate the concentrated-liquidity LP provision strategy on AMM venues (Uniswap V3, Curve, Balancer). Each **Scenario** is one user intent (baseline, add liquidity, remove liquidity, switch pool, change fee tier). Each scenario has **Do → Observe → Pass criterion**. The matching Playwright spec automates every Pass criterion so you can re-run the flow as regression.

Source audit: [docs/audits/strategy-widget-findings/amm-lp-provision.md](../../../audits/strategy-widget-findings/amm-lp-provision.md) (TBD)
Codex SSOT: closest family is [market-making-continuous.md](../../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/market-making-continuous.md) (sub-mode B: AMM concentrated-liquidity LP).

---

## 1. What this strategy does (1 paragraph)

Provide two-sided liquidity into a concentrated-range AMM pool (Uniswap V3/V4, Curve, Balancer) on a chosen `(venue, pool, fee_tier)` tuple. The operator picks a price band `[price_min, price_max]` around the current spot and posts a position sized in `token0`. P&L is the sum of (a) LP fees earned on swaps routed through the active range, minus (b) impermanent loss vs a 50/50 HODL basket, minus (c) gas for mint + rebalance + burn. One active position per strategy instance. Range gets rebalanced when spot drifts outside the band; the strategy exits (burn) on a kill-switch (pool-TVL crash, oracle divergence, fee-tier deprecation, impermanent-loss exceeding an operator-defined cap).

Example instance: `AMM_LP_PROVISION@uniswap-v3-eth-usdc-ethereum-active-usdc-prod`.

## 2. Prerequisites

- Dev server running at `http://localhost:3100` (UI) and `http://localhost:8030` (mock API).
- Auth in mock mode — `localStorage.portal_user` + `localStorage.portal_token` seeded with the `internal-trader` persona (spec handles this automatically).
- Execution mode: **Live** (top-of-page toggle). Paper mode works identically but rows are tagged with `(Paper)` suffix; Batch mode is read-only and ADD/REMOVE clicks are ignored.
- DeFi tab preset must mount `defi-liquidity` — the default preset (`defi-default`) does **not**. Switch to `defi-advanced` or `defi-full` via the preset picker. The spec seeds `activeWorkspaceId.defi = defi-advanced` in localStorage so the widget is mounted on first render.

## 3. Route + widget map

Route: `http://localhost:3100/services/trading/defi` (on `defi-advanced` preset)

| Widget                | Role in this strategy                                                       | `data-testid`                                                                                                                                                                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defi-wallet-summary` | Shows per-chain balances — verify `token0` of the target pool is present    | (no testid; text-based)                                                                                                                                                                                                                                                                               |
| `defi-liquidity`      | **Primary execute surface** — ADD_LIQUIDITY / REMOVE_LIQUIDITY              | `defi-liquidity-widget` root; `pool-select`, `operation-button-ADD_LIQUIDITY`, `operation-button-REMOVE_LIQUIDITY`, `fee-tier-group`, `fee-tier-0.01`/`0.05`/`0.3`/`1`, `price-min-input`, `price-max-input`, `amount-input`, `pool-stats`, `pool-tvl`, `pool-apr`, `pool-fee-tier`, `execute-button` |
| `defi-swap`           | Acquire the `token0` / `token1` basket needed to mint the LP position       | _no testids yet — manual-only_                                                                                                                                                                                                                                                                        |
| `defi-transfer`       | BRIDGE leg when the target pool is on a different chain                     | _no testids yet — manual-only_                                                                                                                                                                                                                                                                        |
| `defi-trade-history`  | Verification surface — every emitted order appears here ~200 ms after click | `trade-history-row` (parent), `data-trade-type`, `data-trade-venue`, `data-trade-strategy` attrs                                                                                                                                                                                                      |
| `active-lp-dashboard` | In-range %, IL vs HODL, fee accrual — not exercised by this spec            | _not in default preset_                                                                                                                                                                                                                                                                               |

**Out of scope for this playbook (scoped out per audit):** range-rebalance workflow, IL-forecast widget, fee-projection widget, LP-aware risk waterfall. These widgets don't exist yet — noted in §9 (Known gaps).

---

## 4. Scenario 1 — Baseline check

Goal: confirm the page loads clean and the liquidity widget's default pool + stats render.

| #   | Do                                                                 | Observe                                                                                                                | Pass criterion                                                                                                |
| --- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1.1 | Navigate to `/services/trading/defi` on the `defi-advanced` preset | Page renders; liquidity widget visible                                                                                 | `defi-liquidity-widget`, `pool-select`, `fee-tier-group`, `amount-input`, `execute-button` all present in DOM |
| 1.2 | Look at the `Liquidity Provision` widget                           | Default state: pool-select shows `ETH/USDC`, fee-tier 0.05% highlighted, `ADD_LIQUIDITY` operation highlighted emerald | `operation-button-ADD_LIQUIDITY` has class `bg-emerald-600`                                                   |
| 1.3 | Look at `pool-tvl`, `pool-apr`, `pool-fee-tier`                    | Non-empty strings, e.g. `$485M`, `18.4%`, `0.05%`                                                                      | `pool-tvl` matches `/\$\d/`; `pool-apr` matches `/\d+(\.\d+)?%/`; `pool-fee-tier` matches `/\d/`              |
| 1.4 | Look at `amount-input`                                             | Empty; `execute-button` disabled                                                                                       | `amount-input` value is `""`, `execute-button` disabled                                                       |
| 1.5 | Scroll to trade-history widget                                     | Pre-seeded rows OR empty state                                                                                         | `count(trade-history-row)` is `>= 0` (no assertion on exact count — the ledger is shared across specs)        |

---

## 5. Scenario 2 — ADD_LIQUIDITY (happy path)

Goal: mint a liquidity position on ETH/USDC / Uniswap V3 Ethereum, verify the order fires, trade history gains a row with the right type + venue.

| #   | Do                                                                    | Observe                                                                                                                                                | Pass criterion                                                                                                  |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 2.1 | In `Liquidity Provision`, pool-select is already `ETH/USDC` (default) | No change; confirm fee tier is `0.05%`                                                                                                                 | `fee-tier-0.05` button is visually active                                                                       |
| 2.2 | Make sure `ADD_LIQUIDITY` is the active operation                     | Emerald highlight on `Add liquidity` button                                                                                                            | `operation-button-ADD_LIQUIDITY` has `bg-emerald-600` class                                                     |
| 2.3 | Type `5` into `amount-input` (Position size in ETH)                   | `execute-button` becomes enabled                                                                                                                       | `execute-button` is enabled                                                                                     |
| 2.4 | Click `execute-button`                                                | Sonner toast: `Liquidity order placed — Add 5 ETH in ETH/USDC (mock ledger)`. Amount input clears.                                                     | Toast visible ≤ 3 s; `amount-input` value back to `""`                                                          |
| 2.5 | Look at `defi-trade-history` after ~500 ms                            | A new parent row appears. Columns: timestamp (UTC), strategy id, `Type=ADD_LIQUIDITY`, `Venue=UNISWAPV3-ETHEREUM`, `Amount=5`, Alpha/Net P&L populated | A `trade-history-row` exists with `data-trade-type="ADD_LIQUIDITY"` and `data-trade-venue` contains `UNISWAPV3` |
| 2.6 | Look at `defi-wallet-summary` for Ethereum                            | ETH balance decreased by ~5                                                                                                                            | (manual check — no testid yet)                                                                                  |

Note: the liquidity widget submits `instruction_type=ADD_LIQUIDITY` to the mock ledger, which derives `data-trade-type="ADD_LIQUIDITY"` on the rendered trade-history row (see [components/widgets/defi/defi-data-context.tsx](../../../../components/widgets/defi/defi-data-context.tsx) — `derivedType` prefers the instruction type on the ledger order when present).

---

## 6. Scenario 3 — REMOVE_LIQUIDITY

Goal: burn a liquidity position. Verifies the opposite side of the ADD_LIQUIDITY flow.

| #   | Do                                                     | Observe                                                                   | Pass criterion                                                    |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 3.1 | Same widget. Click `operation-button-REMOVE_LIQUIDITY` | Rose highlight on `Remove liquidity` button                               | `operation-button-REMOVE_LIQUIDITY` has `bg-rose-600`             |
| 3.2 | Type `2` in `amount-input`                             | `execute-button` enabled                                                  | `execute-button` enabled                                          |
| 3.3 | Click `execute-button`                                 | Toast: `Liquidity order placed — Remove 2 ETH …`                          | Toast visible ≤ 3 s; `amount-input` cleared                       |
| 3.4 | Trade history                                          | New parent row appended with `Type=REMOVE_LIQUIDITY`, `Venue=UNISWAPV3-…` | New `trade-history-row` with `data-trade-type="REMOVE_LIQUIDITY"` |
| 3.5 | Wallet summary                                         | ETH balance recovers by ~2                                                | (manual check)                                                    |

---

## 7. Scenario 4 — Pool-switch reactivity

Goal: confirm the widget actually reads the selected pool from the fixture, not caching stale TVL/APR.

| #   | Do                                                                               | Observe                                                       | Pass criterion                                                               |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 4.1 | Note the current `pool-tvl` and `pool-apr` values for ETH/USDC                   | e.g. `$485M`, `18.4%`                                         | Capture text                                                                 |
| 4.2 | Click `pool-select` → pick the second pool (`ETH/USDT` by default fixture order) | `pool-tvl` and/or `pool-apr` update to the new pool's figures | At least one of `pool-tvl` / `pool-apr` textContent differs from 4.1 capture |
| 4.3 | (Manual) repeat for WBTC/ETH, USDC/USDT, ETH/DAI                                 | Each pool shows distinct stats                                | —                                                                            |

Fixture source: [lib/mocks/fixtures/defi-liquidity.ts](../../../../lib/mocks/fixtures/defi-liquidity.ts) — 5 pools across Uniswap V3 / Curve / Balancer on Ethereum.

---

## 8. Scenario 5 — Fee-tier selection

Goal: confirm fee-tier buttons toggle (this is a UI-only control today — the selected tier does not yet filter pools, see §9.3).

| #   | Do                                                        | Observe                                             | Pass criterion                                            |
| --- | --------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| 5.1 | Click `fee-tier-0.3` (Most pairs)                         | The 0.30% button becomes active (filled variant)    | `fee-tier-0.3` button has default (filled) Button variant |
| 5.2 | `execute-button` with no amount                           | Stays disabled                                      | `execute-button` disabled                                 |
| 5.3 | Repeat for `fee-tier-0.01`, `fee-tier-0.05`, `fee-tier-1` | Each click toggles the active tier without throwing | No console errors                                         |

---

## 9. Known gaps (do not flag as regressions)

These are **expected** gaps — the strategy isn't UI-complete yet. Don't treat them as bugs during manual verification.

| #   | Gap                                                                                                                               | Where it bites                                                                                        | Tracked in                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 9.1 | `strategy_id` falls back to a hardcoded `MARKET_MAKING_CONTINUOUS@...` literal when no active strategy is scoped                  | Trade-history `strategy_id` column shows the market-making literal for every instance                 | Partial fix landed in `1e456a0` — full fix pending                    |
| 9.2 | Only 5 `(venue, pool)` tuples in the fixture                                                                                      | Fixture-robust — all 5 pools are on Ethereum only                                                     | [defi-liquidity.ts](../../../../lib/mocks/fixtures/defi-liquidity.ts) |
| 9.3 | Fee-tier buttons are UI-only — selection doesn't filter `pool-select` or change the submitted order's fee tier                    | Operator can't mint a 0.3% ETH/USDC position from the UI; the pool's native `feeTier` is used instead | Audit — no ticket yet                                                 |
| 9.4 | No IL-forecast widget                                                                                                             | Operator can't preview impermanent-loss before minting                                                | Audit — no ticket yet                                                 |
| 9.5 | No range-rebalance workflow composite                                                                                             | Operator must burn + mint by hand when spot drifts outside band                                       | Audit — no ticket yet                                                 |
| 9.6 | Pool-TVL crash / oracle-divergence kill-switches have no monitor widget                                                           | Can't exercise kill-switch from the UI                                                                | Audit — no ticket yet                                                 |
| 9.7 | `price-min-input` / `price-max-input` do not yet flow into the submitted order — the mock ledger accepts `expected_output=amount` | Range parameters are captured but not persisted in the ledger row                                     | Audit — wired into widget spec, not ledger                            |

---

## 10. Regression spec

**File:** [tests/e2e/strategies/defi/amm-lp-provision.spec.ts](../../../../tests/e2e/strategies/defi/amm-lp-provision.spec.ts)

**Run:**

```bash
# All tests in the spec
npx playwright test tests/e2e/strategies/defi/amm-lp-provision.spec.ts

# Headed (watch it run)
npx playwright test tests/e2e/strategies/defi/amm-lp-provision.spec.ts --headed

# One scenario only, by test name
npx playwright test tests/e2e/strategies/defi/amm-lp-provision.spec.ts -g "ADD_LIQUIDITY"
```

Spec tests map 1:1 to Scenarios 1–5 above:

| Playbook scenario         | Spec test                                         |
| ------------------------- | ------------------------------------------------- |
| §4 Baseline               | `baseline — widget renders, pool stats queryable` |
| §5 ADD_LIQUIDITY          | `ADD_LIQUIDITY 5 on default pool + fee tier`      |
| §6 REMOVE_LIQUIDITY       | `REMOVE_LIQUIDITY 2 on default pool`              |
| §7 Pool-switch reactivity | `pool switch refreshes TVL + APR`                 |
| §8 Fee-tier selection     | `fee-tier selection toggles active tier`          |

The reference pattern for strategy-flow specs is [yield-rotation-lending.spec.ts](../../../../tests/e2e/strategies/defi/yield-rotation-lending.spec.ts). This spec mirrors it — ledger-count deltas + `data-trade-type` assertions + reactive-only scenarios.

---

## 11. Troubleshooting

- **Widget doesn't load, page hangs** — check mock API is up: `curl http://localhost:8030/health`. If dev server is the issue, `npm run dev` in this repo.
- **`defi-liquidity-widget` not present** — the default preset does not include it. Switch to `defi-advanced` (or `defi-full`) via the preset picker, or seed `activeWorkspaceId.defi = defi-advanced` in `unified-workspace-layouts` localStorage (the spec does this automatically).
- **Trade-history stays empty after clicking Execute** — the mock ledger fills after a 200 ms delay. If still empty after 2 s, check browser console for `[defi-data-context] executeDeFiOrder ignored in batch mode` — switch to Live or Paper at the top.
- **Toast doesn't appear** — sonner toasts can be hidden behind other panels at small viewport sizes; resize browser ≥ 1280 px wide.
- **Pool stats show stale numbers after switch** — re-open the pool-select dropdown and reselect; the widget reads from `liquidityPools` which is seeded from [defi-liquidity.ts](../../../../lib/mocks/fixtures/defi-liquidity.ts).
