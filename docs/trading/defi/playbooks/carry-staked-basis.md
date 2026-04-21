---
title: CARRY_STAKED_BASIS — Operator Playbook
archetype: CARRY_STAKED_BASIS
status: draft
owner: ComsicTrader
last_updated: 2026-04-21
pairs_with_spec: tests/e2e/strategies/defi/carry-staked-basis.spec.ts
---

# CARRY_STAKED_BASIS — Operator Playbook

A step-by-step manual flow an operator can follow in the UI to replicate the LST + perp-hedge carry strategy (Lido/EtherFi staked ETH long, Hyperliquid perp short). Each **Scenario** is one user intent (baseline, LST swap leg, margin transfer leg, repeat execute, slippage sanity-check). Each scenario has **Do → Observe → Pass criterion**. The matching Playwright spec automates every Pass criterion so you can re-run the flow as regression.

Source audit: [docs/audits/strategy-widget-findings/carry-staked-basis.md](../../../audits/strategy-widget-findings/carry-staked-basis.md)
Codex SSOT: [architecture-v2/families/carry-staked-basis.md](../../../../../unified-trading-pm/codex/09-strategy/architecture-v2/families/carry-staked-basis.md)

---

## 1. What this strategy does (1 paragraph)

Staked-basis carry between the LST leg and a perpetual short on the same underlying. The long leg swaps a stable (USDC/USDT) into an LST (weETH via EtherFi, or stETH via Lido) on Ethereum — capturing restaking + staking yield. The short leg is a perp hedge on Hyperliquid sized to roughly the same ETH notional, neutralising delta and earning the funding rate paid by longs to shorts in positive-funding regimes. Net P&L = (LST yield + perp funding) − (DEX swap slippage + bridge/transfer gas + perp taker fee + basis drift between LST and spot ETH). Kill switches: LST depeg > 75 bps vs ETH index, funding flips negative for 8+ hours, perp liquidation band breached, protocol incident on Lido/EtherFi/Aave.

Example instance: `CARRY_STAKED_BASIS@lido-aave-hyperliquid-eth-prod`.

## 2. Prerequisites

- Dev server running at `http://localhost:3100` (UI). Mock API bundled (`NEXT_PUBLIC_MOCK_API=true`).
- Auth in mock mode — `localStorage.portal_user` + `localStorage.portal_token` seeded with the `internal-trader` persona (spec handles this automatically).
- Execution mode: **Live**. Paper mode works identically but rows are tagged with `(Paper)` suffix; Batch mode is read-only and Execute clicks are ignored.
- Wallet needs a stable balance on the active chain (USDC or USDT) and gas headroom above `GAS_TOKEN_MIN_THRESHOLDS[ETH]`; the swap widget surfaces a low-gas warning otherwise.

## 3. Route + widget map

Route: `http://localhost:3100/services/trading/strategies/staked-basis`

| Widget                                   | Role in this strategy                                                                                                                | `data-testid`                                                                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defi-swap` (`mode: "staked-basis"`)     | **Primary execute surface** (LST leg) — swaps stable into weETH for the staked long leg; emits `SWAP` rows                           | `defi-swap-widget` root; `chain-select`, `asset-from-select`, `asset-to-select`, `capital-input`, `slippage-select`, `slippage-option-{0.1,0.5,1}`, `expected-output`, `execute-button` |
| `defi-transfer` (send mode default)      | **Margin leg** — moves stable to the Hyperliquid perp address for cross-margin on the short leg; emits `TRANSFER` rows               | `defi-transfer-widget` root; `transfer-mode-send`, `transfer-mode-bridge`, `to-address-input`, `chain-from`, `chain-to` (bridge only), `asset-select`, `amount-input`, `execute-button` |
| Perp short leg (ETH-USDC on Hyperliquid) | Not yet in the route (hedged via CeFi Book tab today)                                                                                | _navigate to `/services/trading/book`; no strategy-linked widget_                                                                                                                       |
| `defi-trade-history`                     | Verification surface — every swap + transfer appears here ~200 ms after click. Lives on `/services/trading/defi`, not on this route. | `trade-history-row` (parent), `data-trade-type="SWAP"`/`"TRANSFER"`, `data-trade-venue`, `data-trade-strategy`                                                                          |

**Out of scope for this playbook (scoped out per audit §6.a):** perp-short execute widget, LST-ETH peg monitor, funding-rate heatmap, basis-convergence chart, Hyperliquid-margin monitor. The page currently shows only the two mount points above — noted in §9 (Known gaps).

---

## 4. Scenario 1 — Baseline check

Goal: confirm the swap widget loads in staked-basis mode (stable → weETH default) and the transfer widget mounts alongside it with the expected controls.

| #   | Do                                                      | Observe                                                                                                                                            | Pass criterion                                                                                                                                     |
| --- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Navigate to `/services/trading/strategies/staked-basis` | Page renders; header `Staked basis (weETH + perp) — UI verification`; two cards: `1. Swap (stable → weETH)` + `2. Transfer & bridge`               | Both `defi-swap-widget` and `defi-transfer-widget` are present in the DOM                                                                          |
| 1.2 | Look at the swap form                                   | `asset-from-select` shows **USDT**, `asset-to-select` shows **weETH**, slippage default 0.5%, routing algo SOR_DEX                                 | `asset-to-select` contains `"weETH"`                                                                                                               |
| 1.3 | Look at the swap `capital-input`                        | Empty; swap `execute-button` disabled; `expected-output` reads `0.00`                                                                              | Swap `execute-button` disabled; `expected-output` text matches `/0\.00/`                                                                           |
| 1.4 | Look at the transfer card                               | Default mode is **Send** (highlighted); Bridge button visible; To-address / Chain / Token / Amount inputs rendered                                 | `transfer-mode-send` + `transfer-mode-bridge` + `to-address-input` + `chain-from` + `asset-select` all visible; transfer `execute-button` disabled |
| 1.5 | Scroll the page                                         | Staked-basis explainer text + links to `/services/trading/book`, `/services/trading/positions`, `/services/trading/defi`, `/services/trading/risk` | Links present                                                                                                                                      |

---

## 5. Scenario 2 — LST swap leg (USDC → weETH)

Goal: swap the stable into weETH for the staked long leg. Verifies the order fires and the ledger gains a `SWAP` row on the DeFi hub.

| #   | Do                                                                                                      | Observe                                                                                                                            | Pass criterion                                                                       |
| --- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 2.1 | Note current row count at `/services/trading/defi` trade-history widget (spec navigates there and back) | e.g. 8 seed rows                                                                                                                   | Capture `beforeRows`                                                                 |
| 2.2 | Return to staked-basis, click `asset-from-select` → pick **USDC**                                       | Swap pair updates to USDC → weETH                                                                                                  | `asset-from-select` contains `"USDC"`                                                |
| 2.3 | Type `50000` into `capital-input`                                                                       | `expected-output` updates (~14.2 weETH at ~3520 $/weETH); Route details collapsible appears with path `USDC → weETH`               | `expected-output` text no longer matches `/^\s*0\.00\s*$/`; `execute-button` enabled |
| 2.4 | Observe `Staked basis — swap leg` collapsible                                                           | Explainer text visible: `SOR swap stable → weETH (EtherFi LST). Then use Transfer & Bridge for Hyperliquid margin …`               | Collapsible visible                                                                  |
| 2.5 | Click swap `execute-button`                                                                             | Sonner toast: `Staked basis swap submitted — 50000 USDC → weETH (mock ledger)`. Input clears.                                      | Toast visible ≤ 2 s (best-effort); `capital-input` back to `""`                      |
| 2.6 | Navigate to `/services/trading/defi`, look at trade-history after ~500 ms                               | A new parent row appears: `Type=SWAP`, `Venue=UNISWAPV3-ETHEREUM` (or SOR venues joined with `+`), `Strategy=CARRY_STAKED_BASIS@…` | New `trade-history-row` with `data-trade-type="SWAP"`; row count is `beforeRows + 1` |
| 2.7 | Wallet summary                                                                                          | USDC balance on active chain decreased by ~50,000; weETH position increased                                                        | (manual check — no testid yet)                                                       |

---

## 6. Scenario 3 — Margin transfer leg (USDC → Hyperliquid)

Goal: move stable margin to the Hyperliquid address that cross-margins the perp short. Verifies the transfer widget fires, the ledger gains a `TRANSFER` row.

| #   | Do                                                                        | Observe                                                                                      | Pass criterion                                                                        |
| --- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 3.1 | Recapture `beforeRows` from trade-history on `/services/trading/defi`     | e.g. 9 rows (seed + LST leg)                                                                 | Capture `beforeRows`                                                                  |
| 3.2 | Return to staked-basis, confirm transfer widget is in **Send** mode       | `Send` button highlighted (default)                                                          | `transfer-mode-send` is the active variant                                            |
| 3.3 | Click transfer `asset-select` → pick **USDC**                             | Balance row updates to show USDC balance                                                     | `asset-select` contains `"USDC"`                                                      |
| 3.4 | Type a placeholder Hyperliquid address into `to-address-input`            | e.g. `0xHyperliquidMargin0000000000000000000001`                                             | `to-address-input` value set                                                          |
| 3.5 | Type `25000` into transfer `amount-input`                                 | Gas-estimate cell updates (ERC-20 path); transfer `execute-button` enabled                   | `execute-button` enabled                                                              |
| 3.6 | Click transfer `execute-button`                                           | Sonner toast: `Transfer submitted — 25000 USDC → 0xHyperliquid... on ETHEREUM`. Input clears | Toast visible ≤ 2 s (best-effort); transfer `amount-input` back to `""`               |
| 3.7 | Navigate to `/services/trading/defi`, look at trade-history after ~500 ms | A new parent row: `Type=TRANSFER`, `Venue=WALLET-ETHEREUM`, `Algo=DIRECT`                    | New `trade-history-row` with `data-trade-type="TRANSFER"`; row count `beforeRows + 1` |

Note: the widget address input is free-form (no checksum validation in mock mode). The real deployment resolves Hyperliquid margin accounts via a registry — out of scope here.

---

## 7. Scenario 4 — Repeat swap execute (ledger idempotency)

Goal: confirm the mock ledger appends monotonically; a second swap produces a second `SWAP` row.

| #   | Do                                                                    | Observe                                                   | Pass criterion                        |
| --- | --------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------- |
| 4.1 | Recapture `beforeRows` from trade-history on `/services/trading/defi` | e.g. 10 rows (seed + LST + TRANSFER)                      | Capture `beforeRows`                  |
| 4.2 | Return to staked-basis, re-pick **USDC** from `asset-from-select`     | Pair resets to USDC → weETH (defaults to USDT on remount) | `asset-from-select` contains `"USDC"` |
| 4.3 | Type `15000` into `capital-input`                                     | `expected-output` non-zero                                | `execute-button` enabled              |
| 4.4 | Click swap `execute-button`                                           | Toast + input clears                                      | `capital-input` back to `""`          |
| 4.5 | Verify trade-history                                                  | Another `data-trade-type="SWAP"` row appended             | Row count is `beforeRows + 1`         |

---

## 8. Scenario 5 — Slippage reactivity

Goal: confirm the swap `expected-output` recomputes when the operator tightens or loosens slippage tolerance. No order placed.

| #   | Do                                                            | Observe                                                       | Pass criterion                  |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------- |
| 5.1 | Type `20000` into `capital-input`                             | `expected-output` populated (non-zero)                        | `expected-output` text non-zero |
| 5.2 | Click `slippage-option-1` (1% loose)                          | Option highlights as active; route impact stays green         | Active class asserted           |
| 5.3 | Capture `expected-output` textContent — this is `looseOutput` | e.g. `5.68` weETH                                             | Capture                         |
| 5.4 | Click `slippage-option-0.1` (0.1% tight)                      | Option re-highlights; route re-quotes                         | Active class asserted           |
| 5.5 | Capture `expected-output` — this is `tightOutput`             | e.g. `5.67` (tighter cap → marginally lower simulated output) | Non-zero                        |
| 5.6 | Clear input                                                   | `expected-output` returns to `0.00`                           | `capital-input` value `""`      |

Note: the reference mock route is a deterministic calculation; `tightOutput` may not be strictly lower than `looseOutput` for every amount. The spec only asserts both outputs are non-zero — tighter-output-less-than-looser-output is not a guaranteed property of the current mock model.

---

## 9. Known gaps (do not flag as regressions)

These are **expected** failures — the strategy isn't UI-complete yet. Don't treat them as bugs during manual verification.

| #   | Gap                                                                         | Where it bites                                                                      | Tracked in                                                             |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 9.1 | Perp short leg has no execute widget on this route                          | Operator must hedge via CeFi Book tab manually                                      | Audit §6.a.1 — new widget `perp-short-execute` (P0)                    |
| 9.2 | Transfer destination is free-form (no Hyperliquid-address registry)         | Operator types a placeholder; production must resolve via a margin-account registry | Audit §6.a.2 — `hyperliquid-margin-registry` wiring                    |
| 9.3 | No LST-ETH peg monitor                                                      | Operator can't visualise depeg kill-switch state                                    | Audit §6.b.1 — `lst-peg-monitor-widget` (P0)                           |
| 9.4 | No funding-rate heatmap                                                     | Operator can't pick venue/tenor with best funding for the perp leg                  | Audit §6.b.2 — `funding-rate-heatmap-widget` (P1)                      |
| 9.5 | No basis-convergence chart                                                  | Can't visualise LST-vs-spot spread over time                                        | Audit §6.b.3                                                           |
| 9.6 | `expected-output` panel is calc-only and doesn't reflect live AMM quotes    | Real slippage at execute time will diverge                                          | Expected — mock mode only                                              |
| 9.7 | Trade-history widget not mounted on this route                              | Operator must navigate to `/services/trading/defi` to verify                        | Audit §6.a.3 — P1 fix                                                  |
| 9.8 | Transfer `chain-from` is restricted to `DEFI_CHAINS` (no Hyperliquid entry) | Hyperliquid is a CeFi venue; transfer is modelled as a same-chain `send` in demo    | Audit §6.a.4 — out-of-scope for UI-mock; real flow uses a CeFi deposit |

---

## 10. Regression spec

**File:** [tests/e2e/strategies/defi/carry-staked-basis.spec.ts](../../../../tests/e2e/strategies/defi/carry-staked-basis.spec.ts)

**Run:**

```bash
# All tests in the spec
npx playwright test tests/e2e/strategies/defi/carry-staked-basis.spec.ts

# Headed (watch it run)
npx playwright test tests/e2e/strategies/defi/carry-staked-basis.spec.ts --headed

# One scenario only, by test name
npx playwright test tests/e2e/strategies/defi/carry-staked-basis.spec.ts -g "swap 50000 USDC"
```

Spec tests map 1:1 to Scenarios 1–5 above:

| Playbook scenario  | Spec test                                                             |
| ------------------ | --------------------------------------------------------------------- |
| §4 Baseline        | `baseline — swap widget (staked-basis mode) + transfer widget render` |
| §5 LST swap leg    | `swap 50000 USDC → weETH for the LST leg`                             |
| §6 Margin transfer | `transfer 25000 USDC to Hyperliquid (margin leg)`                     |
| §7 Repeat execute  | `second swap 15000 USDC → weETH appends another SWAP row`             |
| §8 Slippage        | `slippage tolerance change re-renders expected-output (no order)`     |

The existing [carry-basis-perp.spec.ts](../../../../tests/e2e/strategies/defi/carry-basis-perp.spec.ts) covers the sibling archetype (same `DeFiSwapWidget` under `mode: "basis-trade"`); this spec exercises `mode: "staked-basis"` plus the `DeFiTransferWidget` margin leg and doesn't duplicate the basis-trade metrics panel.

---

## 11. Troubleshooting

- **Widget doesn't load, page hangs** — check dev server: `curl http://localhost:3100`. If dev server is the issue, `npm run dev` in this repo.
- **Trade-history stays empty after clicking Execute** — the mock ledger fills after a 200 ms delay. If still empty after 2 s, check browser console for `[defi-data-context] executeDeFiOrder ignored in batch mode` — switch execution mode to Live or Paper at the top.
- **Toast doesn't appear** — sonner toasts can be hidden behind other panels at small viewport sizes; resize browser ≥ 1280 px wide. Spec tolerates toast absence (uses `.catch`) so this doesn't fail CI.
- **Transfer execute-button stays disabled** — in send mode the button needs all of: valid `amount > 0`, `amount <= balance`, and a non-empty `to-address-input`. Empty address is the most common cause.
- **`asset-from-select` keeps reverting to USDT** — staked-basis mode's `useEffect` resets `tokenIn` to USDT on mount/remount (by design; see [defi-swap-widget.tsx L45-L50](../../../../components/widgets/defi/defi-swap-widget.tsx#L45-L50)). Re-pick USDC before each execute if needed.
- **Low-gas warning appears** — if the active chain has less than `GAS_TOKEN_MIN_THRESHOLDS[ETH]` gas, the swap widget shows an amber warning. In mock mode the chain portfolios are seeded so this shouldn't trigger; if it does, reset localStorage.
  </content>
  </invoke>
