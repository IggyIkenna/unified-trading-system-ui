---
title: CARRY_BASIS_PERP — Operator Playbook
archetype: CARRY_BASIS_PERP
status: draft
owner: ComsicTrader
last_updated: 2026-04-21
pairs_with_spec: tests/e2e/strategies/defi/carry-basis-perp.spec.ts
---

# CARRY_BASIS_PERP — Operator Playbook

A step-by-step manual flow an operator can follow in the UI to replicate the cash-and-carry / perp-basis strategy. Each **Scenario** is one user intent (baseline, spot-leg swap, slippage sanity-check, metrics panel, repeat execute). Each scenario has **Do → Observe → Pass criterion**. The matching Playwright spec automates every Pass criterion so you can re-run the flow as regression.

Source audit: [docs/audits/strategy-widget-findings/carry-basis-perp.md](../../../audits/strategy-widget-findings/carry-basis-perp.md)
Codex SSOT: [architecture-v2/families/carry-basis-perp.md](../../../../../unified-trading-pm/codex/09-strategy/architecture-v2/families/carry-basis-perp.md)

---

## 1. What this strategy does (1 paragraph)

Cash-and-carry between the spot leg and the perpetual leg of the same asset. The spot leg buys and holds the underlying (ETH, BTC, SOL …). The perp leg shorts the matching perpetual at roughly the same notional to neutralise delta. The position earns the funding rate paid by longs to shorts in positive-funding regimes; P&L = funding accrual − (DEX swap slippage + gas + perp maker/taker fee + basis drift). Kill switches: funding rate flips negative for 8+ hours, spot leg depegs from index > 75 bps, perp venue risk (liquidation band breached), or basis convergence < breakeven.

Example instance: `CARRY_BASIS_PERP@binance-btc-usdt-prod`.

## 2. Prerequisites

- Dev server running at `http://localhost:3100` (UI). Mock API bundled (`NEXT_PUBLIC_MOCK_API=true`).
- Auth in mock mode — `localStorage.portal_user` + `localStorage.portal_token` seeded with the `internal-trader` persona (spec handles this automatically).
- Execution mode: **Live**. Paper mode works identically but rows are tagged with `(Paper)` suffix; Batch mode is read-only and Execute clicks are ignored.
- Wallet needs a stable balance on the active chain (USDT default). Gas-token balance should clear `GAS_TOKEN_MIN_THRESHOLDS[ETH]`; widget surfaces a low-gas warning otherwise.

## 3. Route + widget map

Route: `http://localhost:3100/services/trading/strategies/carry-basis`

| Widget                              | Role in this strategy                                                                                                     | `data-testid`                                                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defi-swap` (`mode: "basis-trade"`) | **Primary execute surface** — swaps stable (USDT) into the underlying for the spot long leg                               | `defi-swap-widget` root; `chain-select`, `asset-from-select`, `asset-to-select`, `capital-input`, `slippage-select`, `slippage-option-{0.1,0.5,1}`, `expected-output`, `execute-button` |
| Perp short leg                      | Not yet in the route (hedged manually today via CeFi Book tab)                                                            | _placeholder card on the page_                                                                                                                                                          |
| `defi-trade-history`                | Verification surface — every swap appears here ~200 ms after click. Lives on `/services/trading/defi`, not on this route. | `trade-history-row` (parent), `data-trade-type="SWAP"`, `data-trade-venue`, `data-trade-strategy`                                                                                       |

**Out of scope for this playbook (scoped out per audit §6.a):** perp-short execute widget, funding-rate heatmap, basis-convergence chart, CeFi margin monitor. The page currently shows a placeholder card for the perp leg — noted in §9 (Known gaps).

---

## 4. Scenario 1 — Baseline check

Goal: confirm the swap widget loads in basis-trade mode with the expected USDT → ETH default pair and nothing stale.

| #   | Do                                                     | Observe                                                                                                          | Pass criterion                                                            |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1.1 | Navigate to `/services/trading/strategies/carry-basis` | Page renders; `Carry-Basis Swap (90% Capital)` header + swap widget visible                                      | `defi-swap-widget` present in DOM                                         |
| 1.2 | Look at the swap form                                  | `asset-from-select` shows **USDT**, `asset-to-select` shows **ETH**, slippage default 0.5%, routing algo SOR_DEX | `asset-from-select` contains `"USDT"`, `asset-to-select` contains `"ETH"` |
| 1.3 | Look at `capital-input`                                | Empty; `execute-button` disabled                                                                                 | `capital-input` value is `""`, `execute-button` disabled                  |
| 1.4 | Look at `expected-output`                              | Reads `"0.00"`                                                                                                   | `expected-output` textContent matches `/^\s*0\.00\s*$/`                   |
| 1.5 | Scroll down                                            | Placeholder card: `Perp short position management (coming soon)`                                                 | Card visible — manual note; no testid                                     |

---

## 5. Scenario 2 — Spot-leg swap (happy path)

Goal: swap the stable balance into ETH for the spot-long side of the basis. Verifies the order fires, ledger gains a `SWAP` row with the right venue.

| #   | Do                                                                                                      | Observe                                                                                                                          | Pass criterion                                                                       |
| --- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 2.1 | Note current row count at `/services/trading/defi` trade-history widget (spec navigates there and back) | e.g. 8 seed rows                                                                                                                 | Capture `beforeRows`                                                                 |
| 2.2 | Return to carry-basis, type `90000` into `capital-input`                                                | `expected-output` updates to show ETH amount (`~23.x`); Route details collapsible appears with path `USDT → ETH`                 | `expected-output` text no longer matches `/^\s*0\.00\s*$/`; `execute-button` enabled |
| 2.3 | `Basis Trade Metrics` section is visible — Funding APY / Cost of Carry / Net APY                        | Three metric cells populated with `%` values                                                                                     | Metrics panel visible                                                                |
| 2.4 | Click `execute-button`                                                                                  | Sonner toast: `Basis trade swap submitted — 90000 USDT → ETH (mock ledger)`. Input clears.                                       | Toast visible ≤ 2 s (best-effort); `capital-input` back to `""`                      |
| 2.5 | Navigate to `/services/trading/defi`, look at trade-history after ~500 ms                               | A new parent row appears: `Type=SWAP`, `Venue=UNISWAPV3-ETHEREUM` (or SOR venues joined with `+`), `Strategy=CARRY_BASIS_PERP@…` | New `trade-history-row` with `data-trade-type="SWAP"`; row count is `beforeRows + 1` |
| 2.6 | Wallet summary                                                                                          | USDT balance on active chain decreased by ~90,000                                                                                | (manual check — no testid yet)                                                       |

---

## 6. Scenario 3 — Slippage reactivity

Goal: confirm the expected-output recomputes when the operator tightens or loosens slippage tolerance.

| #   | Do                                                            | Observe                                                         | Pass criterion                  |
| --- | ------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------- |
| 3.1 | Type `10000` into `capital-input`                             | `expected-output` populated (non-zero)                          | `expected-output` text non-zero |
| 3.2 | Click `slippage-option-1` (1% loose)                          | Option highlights as active; route impact stays green           | Active class asserted           |
| 3.3 | Capture `expected-output` textContent — this is `looseOutput` | e.g. `23.234`                                                   | Capture                         |
| 3.4 | Click `slippage-option-0.1` (0.1% tight)                      | Option re-highlights; route re-quotes                           | Active class asserted           |
| 3.5 | Capture `expected-output` — this is `tightOutput`             | e.g. `23.210` (tighter cap → marginally lower simulated output) | Non-zero                        |
| 3.6 | Clear input                                                   | `expected-output` returns to `0.00`                             | `capital-input` value `""`      |

Note: the reference mock route is a deterministic calculation, so `tightOutput` may or may not be strictly lower than `looseOutput` for every amount. The spec only asserts both outputs are non-zero — tighter-output-less-than-looser-output is not a guaranteed property of the current mock model.

---

## 7. Scenario 4 — Basis-trade metrics panel

Goal: confirm the `isBasisTrade` code path (Funding APY / Cost of Carry / Net APY) surfaces correctly when an amount is entered.

| #   | Do                                | Observe                                                                   | Pass criterion                |
| --- | --------------------------------- | ------------------------------------------------------------------------- | ----------------------------- |
| 4.1 | Type `50000` into `capital-input` | Collapsible section `Basis Trade Metrics` expands                         | Section text visible          |
| 4.2 | Read `Funding APY` cell           | Positive percentage, green                                                | `Funding APY` label visible   |
| 4.3 | Read `Cost of Carry` cell         | Positive percentage, amber                                                | `Cost of Carry` label visible |
| 4.4 | Read `Net APY` cell               | Could be green (profitable) or red (unprofitable) depending on mock rates | `Net APY` label visible       |
| 4.5 | Clear input                       | Metrics panel collapses                                                   | `capital-input` value `""`    |

---

## 8. Scenario 5 — Repeat execute (ledger idempotency)

Goal: confirm the mock ledger appends monotonically; a second swap produces a second `SWAP` row.

| #   | Do                                                                    | Observe                                       | Pass criterion                |
| --- | --------------------------------------------------------------------- | --------------------------------------------- | ----------------------------- |
| 5.1 | Recapture `beforeRows` from trade-history on `/services/trading/defi` | e.g. 9 rows (seed + prior scenario)           | Capture `beforeRows`          |
| 5.2 | Return to carry-basis, type `25000` into `capital-input`              | `expected-output` non-zero                    | `execute-button` enabled      |
| 5.3 | Click `execute-button`                                                | Toast + input clears                          | `capital-input` back to `""`  |
| 5.4 | Verify trade-history row                                              | Another `data-trade-type="SWAP"` row appended | Row count is `beforeRows + 1` |

---

## 9. Known gaps (do not flag as regressions)

These are **expected** failures — the strategy isn't UI-complete yet. Don't treat them as bugs during manual verification.

| #   | Gap                                                                                                     | Where it bites                                                                 | Tracked in                                                                |
| --- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| 9.1 | Perp short leg has no execute widget on this route                                                      | Operator must hedge via CeFi Book tab manually                                 | Audit §6.a.1 — new widget `perp-short-execute` (P0)                       |
| 9.2 | `strategy_id` hardcoded to `CARRY_BASIS_PERP@binance-btc-usdt-prod` when no active strategy is in scope | Trade-history strategy column shows the wrong instance for non-binance configs | Covered by global fix in `de14cf2` / `1e456a0` (live-defi-rollout branch) |
| 9.3 | No funding-rate heatmap                                                                                 | Operator can't visually pick venue with best funding                           | Audit §6.b.1 — `funding-rate-heatmap-widget` (P1)                         |
| 9.4 | No basis-convergence chart                                                                              | Can't visualise spot-vs-perp spread decay into expiry                          | Audit §6.b.2                                                              |
| 9.5 | `expected-output` panel is calc-only and doesn't reflect live AMM quotes                                | Real slippage at execute time will diverge                                     | Expected — mock mode only                                                 |
| 9.6 | No perp-liquidation-band monitor                                                                        | Can't exercise kill-switch for perp venue margin breach                        | Audit §6.b.3                                                              |
| 9.7 | Trade-history widget not mounted on this route                                                          | Operator must navigate to `/services/trading/defi` to verify                   | Audit §6.a.2 — P1 fix                                                     |

---

## 10. Regression spec

**File:** [tests/e2e/strategies/defi/carry-basis-perp.spec.ts](../../../../tests/e2e/strategies/defi/carry-basis-perp.spec.ts)

**Run:**

```bash
# All tests in the spec
npx playwright test tests/e2e/strategies/defi/carry-basis-perp.spec.ts

# Headed (watch it run)
npx playwright test tests/e2e/strategies/defi/carry-basis-perp.spec.ts --headed

# One scenario only, by test name
npx playwright test tests/e2e/strategies/defi/carry-basis-perp.spec.ts -g "swap 90% capital"
```

Spec tests map 1:1 to Scenarios 1–5 above:

| Playbook scenario | Spec test                                            |
| ----------------- | ---------------------------------------------------- |
| §4 Baseline       | `baseline — swap widget renders in basis-trade mode` |
| §5 Spot-leg swap  | `swap 90% capital from USDT to ETH`                  |
| §6 Slippage       | `slippage tolerance tightens expected output`        |
| §7 Metrics panel  | `basis trade metrics surface when amount entered`    |
| §8 Repeat execute | `second swap appends another SWAP row`               |

The existing [basis-trade.spec.ts](../../../../tests/e2e/strategies/defi/basis-trade.spec.ts) covers a legacy widget variant (form inputs, margin/funding/cost metrics, health checks). This spec is **strategy-flow**-oriented: it exercises the canonical `/services/trading/strategies/carry-basis` route with the production `DeFiSwapWidget` and doesn't duplicate the legacy unit-level assertions.

---

## 11. Troubleshooting

- **Widget doesn't load, page hangs** — check dev server: `curl http://localhost:3100`. If dev server is the issue, `npm run dev` in this repo.
- **Trade-history stays empty after clicking Execute** — the mock ledger fills after a 200 ms delay. If still empty after 2 s, check browser console for `[defi-data-context] executeDeFiOrder ignored in batch mode` — switch execution mode to Live or Paper at the top.
- **Toast doesn't appear** — sonner toasts can be hidden behind other panels at small viewport sizes; resize browser ≥ 1280 px wide. Spec tolerates toast absence (uses `.catch`) so this doesn't fail CI.
- **`expected-output` reads `0.00` after typing** — the route memo keys on `amountNum > 0`. If `capital-input` holds a non-numeric value (empty, whitespace, `NaN`), no route is generated. Clear and retype.
- **Low-gas warning appears** — if the active chain has less than `GAS_TOKEN_MIN_THRESHOLDS[ETH]` gas, the widget shows an amber warning. In mock mode the chain portfolios are seeded so this shouldn't trigger; if it does, reset localStorage.
