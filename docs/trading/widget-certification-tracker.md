---
title: Widget Certification — DeFi rolling tracker
status: active
scope: BP-3 DeFi widget audit across 8 archetypes
last_updated: 2026-04-20
---

# Widget Certification — DeFi Rolling Tracker

Consolidated view of the 8-archetype DeFi widget audit. **Per-archetype evidence lives in [docs/audits/strategy-widget-findings/](../audits/strategy-widget-findings/)**; this tracker rolls those up into (1) audit progress, (2) cross-archetype widget matrix, (3) cross-cutting blockers, (4) new-widget queue, (5) codex updates, (6) open questions.

See [widget-certification-audit-plan.md](./widget-certification-audit-plan.md) for workflow.

## 1. Audit progress

All 8 codex archetypes drafted + 1 registry-gap archetype surfaced. Each doc status: `draft-awaiting-review`. User owns review; tracker will flip to ✅ reviewed once signed off.

| #   | Archetype                  | Status          | Doc                                                                                               |
| --- | -------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| 1   | YIELD_STAKING_SIMPLE       | ✅ drafted      | [yield-staking-simple.md](../audits/strategy-widget-findings/yield-staking-simple.md)             |
| 2   | YIELD_ROTATION_LENDING     | ✅ drafted      | [yield-rotation-lending.md](../audits/strategy-widget-findings/yield-rotation-lending.md)         |
| 3   | CARRY_BASIS_PERP           | ✅ drafted      | [carry-basis-perp.md](../audits/strategy-widget-findings/carry-basis-perp.md)                     |
| 4   | CARRY_STAKED_BASIS         | ✅ drafted      | [carry-staked-basis.md](../audits/strategy-widget-findings/carry-staked-basis.md)                 |
| 5   | CARRY_RECURSIVE_STAKED     | ✅ drafted      | [carry-recursive-staked.md](../audits/strategy-widget-findings/carry-recursive-staked.md)         |
| 6   | ARBITRAGE_PRICE_DISPERSION | ✅ drafted      | [arbitrage-price-dispersion.md](../audits/strategy-widget-findings/arbitrage-price-dispersion.md) |
| 7   | LIQUIDATION_CAPTURE        | ✅ drafted      | [liquidation-capture.md](../audits/strategy-widget-findings/liquidation-capture.md)               |
| 8   | CARRY_BASIS_DATED          | ⏸️ parked       | [carry-basis-dated.md](../audits/strategy-widget-findings/carry-basis-dated.md)                   |
| 9   | AMM_LP_PROVISION           | 🆕 gap-surfaced | (no doc yet — discovered via widget-gap audit)                                                    |

Legend: ✅ drafted (ready for user review) · ⏸️ parked (placeholder, deferred) · 🆕 gap-surfaced (archetype exists in UI widgets but not yet in codex `DEFI_STRATEGY_FAMILIES` — needs registry check)

**AMM_LP_PROVISION gap note:** `defi-liquidity-widget` emits `strategy_id: "AMM_LP"` with `algo_type: "AMM_CONCENTRATED"` (concentrated liquidity / Uniswap-V3-style). Monitoring surface is `active-lp-dashboard-widget` (in-range %, IL%, fees24h, TVL). Neither appears in the audited archetypes because AMM_LP is missing from the codex archetype set we audited against. Requires decision: (a) add to codex `DEFI_STRATEGY_FAMILIES` and draft a full archetype doc, or (b) declare the widgets orphan and remove from DeFi page.

## 2. Widget matrix

Per-cell legend: ✅ fits · 🟡 partial/enhance · ❌ does not serve · ➖ not applicable (out of archetype scope) · blank = not evaluated

Column keys: **YS** YIELD_STAKING_SIMPLE · **YRL** YIELD_ROTATION_LENDING · **CBP** CARRY_BASIS_PERP · **CSB** CARRY_STAKED_BASIS · **CRS** CARRY_RECURSIVE_STAKED · **APD** ARBITRAGE_PRICE_DISPERSION · **LIQ** LIQUIDATION_CAPTURE · **CBD** CARRY_BASIS_DATED · **ALP** AMM_LP_PROVISION (gap-surfaced)

| Widget                                             | YS  | YRL | CBP | CSB | CRS | APD | LIQ | CBD | ALP |
| -------------------------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `defi-staking-widget`                              | 🟡  | ➖  | ➖  | 🟡  | 🟡  | ➖  | ➖  | ➖  | ➖  |
| `defi-lending-widget`                              | ➖  | 🟡  | ➖  | 🟡  | 🟡  | ➖  | ➖  | ➖  | ➖  |
| `defi-swap-widget`                                 | ➖  | ✅  | 🟡  | 🟡  | 🟡  | 🟡  | ✅  | ➖  | ➖  |
| `defi-transfer-widget`                             | 🟡  | 🟡  | 🟡  | 🟡  | 🟡  | 🟡  | ➖  | ➖  | ➖  |
| `defi-yield-chart-widget`                          | ✅  | ✅  | ➖  | ✅  | ➖  | ➖  | ➖  | ➖  | ➖  |
| `defi-rates-overview-widget`                       | ✅  | 🟡  | ➖  | ➖  | ➖  | 🟡  | ➖  | ➖  | ➖  |
| `defi-wallet-summary-widget`                       | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  |
| `defi-health-factor-widget`                        | ❌  | ➖  | ➖  | 🟡  | 🟡  | ➖  | ❌  | ➖  | ➖  |
| `defi-waterfall-weights-widget`                    | ➖  | ➖  | ✅  | ➖  | ➖  | ➖  | ➖  | ➖  | ➖  |
| `defi-reward-pnl-widget`                           | ➖  | 🟡  | ❌  | 🟡  | ➖  | ➖  | ➖  | ➖  | ➖  |
| `defi-staking-rewards-widget`                      | ✅  | ➖  | ➖  | 🟡  | 🟡  | ➖  | ➖  | ➖  | ➖  |
| `defi-basis-trade-widget`                          | ➖  | ➖  | 🟡  | ➖  | ➖  | ➖  | ➖  | ❌  | ➖  |
| `defi-funding-matrix-widget`                       | ➖  | ➖  | ✅  | ✅  | ➖  | 🟡  | ➖  | ➖  | ➖  |
| `enhanced-basis-widget`                            | ➖  | ➖  | 🟡  | ➖  | ➖  | ➖  | ➖  | ❌  | ➖  |
| `defi-flash-loans-widget`                          | ➖  | ➖  | ➖  | ➖  | 🟡  | 🟡  | 🟡  | ➖  | ➖  |
| `defi-liquidity-widget`                            | ➖  | ➖  | ➖  | ➖  | ➖  | ➖  | ➖  | ➖  | ✅  |
| `defi-position-table`                              | ➖  | ➖  | ➖  | ➖  | ✅  | ➖  | ➖  | ➖  | ➖  |
| `defi-strategy-config-widget`                      | ➖  | ➖  | ➖  | 🟡  | ➖  | ➖  | ❌  | ➖  | ➖  |
| `defi-trade-history-widget`                        | ➖  | ➖  | ✅  | ✅  | ✅  | ✅  | ✅  | ➖  | ✅  |
| `liquidation-monitor-widget` (strategies/)         | ➖  | ➖  | ➖  | ➖  | ➖  | ➖  | 🟡  | ➖  | ➖  |
| `active-lp-dashboard-widget` (strategies/)         | ➖  | ➖  | ➖  | ➖  | ➖  | ➖  | ➖  | ➖  | ✅  |
| `lending-arb-dashboard-widget` (strategies/)       | ➖  | ✅  | ➖  | ➖  | ➖  | 🟡  | ➖  | ➖  | ➖  |
| `options-futures-table-widget`                     | ➖  | ➖  | ➖  | ➖  | ➖  | ➖  | ➖  | 🟡  | ➖  |
| `sports-arb-widget`                                | ➖  | ➖  | ➖  | ➖  | ➖  | 🟡  | ➖  | ➖  | ➖  |
| `DeFiBasisTradeWidget` (file exists, unregistered) | ➖  | ➖  | ➖  | ➖  | ➖  | ➖  | ➖  | ❌  | ➖  |

## 3. Cross-cutting blockers

Patterns that land in multiple per-archetype audits — fixed once, they propagate across every archetype. Ordered by blast radius.

### 3.1 Hardcoded `strategy_id` across 7 widgets — **P0, affects every DeFi archetype**

Widgets emit venue-shaped literals instead of the active strategy-instance id. Breaks per-instance attribution, event audit, and tracker rollups. Single fix pattern: accept `strategyId` via props / host context; fall back to current literal only when no host context.

| Widget                    | Line       | Current literal                                                   | Archetypes broken             |
| ------------------------- | ---------- | ----------------------------------------------------------------- | ----------------------------- |
| `defi-staking-widget`     | L129       | `"ETHENA_BENCHMARK"`                                              | YS, CSB, CRS                  |
| `defi-lending-widget`     | L259       | `"AAVE_LENDING"`                                                  | YRL, CSB, CRS, LIQ (indirect) |
| `defi-swap-widget`        | L348       | mode-based: `"BASIS_TRADE"` / `"STAKED_BASIS"` / `"AAVE_LENDING"` | YRL, CBP, CSB, CRS, APD, LIQ  |
| `defi-transfer-widget`    | L220, L387 | `"AAVE_LENDING"`, `"CROSS_CHAIN_SOR"`                             | YS, YRL, CBP, CSB, CRS, APD   |
| `defi-flash-loans-widget` | L232-234   | `"AAVE_LENDING"`                                                  | CRS, APD, LIQ                 |
| `defi-basis-trade-widget` | L90        | `"BASIS_TRADE"`                                                   | CBP                           |
| `defi-liquidity-widget`   | L160       | `"AMM_LP"`                                                        | ALP                           |

Additional tagging gap (non-DeFi): **`arb-stream` sports path** posts untagged orders at L66-82 — noted for APD.

**Parallel `client_id` hardcoding (out of scope for §3.1 ticket, but flagged):** Every widget above also hardcodes `client_id: "internal-trader"` at the same call site. Full attribution tuple fix (org+client+strategy+account+wallet+user) is Q8 teammate review — the §3.1 ticket only lifts `strategy_id` from literal to context.

### 3.2 Fixture coverage — **P0, blocks verification in §7 of 4 archetypes**

Fixtures model 5–10% of the archetype universe. UI can't be exercised against the strategy's full venue/instrument/chain universe. Hybrid approach per Q12: extend fixtures where shape is clear and public data suffices; defer ambiguous ones for teammate review.

| Fixture                                  | Before                          | After                                                                                                                              | Status                                    |
| ---------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `lib/mocks/fixtures/defi-staking.ts`     | 3 rows (Lido, Ether.fi, Ethena) | 9 rows: + Rocket Pool, Kelp, Renzo, Lombard (BTC LST), Jito (SOL), Marinade (SOL)                                                  | **DONE** (BP-3 session)                   |
| `lib/mocks/fixtures/defi-lending.ts`     | 5 of 22+ tuples                 | 16 tuples: + Aave (OP/Polygon/Avalanche/Base), Compound (Arb/OP/Polygon/Base), Morpho (Base/Arb), Euler (Ethereum w/ WEETH+WSTETH) | **DONE** (BP-3 session)                   |
| `lib/mocks/fixtures/defi-basis-trade.ts` | missing venues                  | Add Drift (1h funding), Deribit, single-venue-netted rows                                                                          | **DEFERRED** — see note below             |
| `lib/mocks/fixtures/defi-walkthrough.ts` | basis walkthrough coverage      | Include ATOMIC vs LEADER_HEDGE topology variants                                                                                   | **DEFERRED** — see note below             |
| `lib/mocks/fixtures/defi-dated-basis.ts` | does not exist                  | New file with dated perp/future chain, expiry, IV surface                                                                          | **BLOCKED** on CBD archetype reactivation |
| `lib/mocks/fixtures/defi-liquidation.ts` | does not exist                  | `AtRiskPosition` with `underwater_address`, `chain`, `bonus_bps`, `expected_net_profit_usd`                                        | **BLOCKED** on LIQ archetype registry add |

**Deferred-fixture design questions** (require teammate review before code):

- **`defi-basis-trade.ts`** — shape question: the current fixture carries `marketData`, `marginRequirements`, and helper functions. Drift (Solana perp, 1h funding cadence) and Deribit (CEX perp+options) have different margin mechanics and funding cadences than the current Binance/Bybit/OKX rows. Open: (a) do per-venue `marginRequirements` + `fundingCadenceHours` keys, or (b) normalize to a common shape and drop venue-specific margin detail. Also: "single-venue-netted rows" concept (where long spot and short perp are netted inside one venue's cross-margin account) isn't yet represented; needs a `netting: "cross-margin" | "separated"` field.
- **`defi-walkthrough.ts`** — topology question: current walkthrough shape is a linear leg list. ATOMIC (flash-loan bundle, 5 legs, one tx) vs LEADER_HEDGE (leader fill triggers hedge, 2 legs across venues, separate txs) vs MULTI_LEG_SEQUENTIAL don't fit a single shape. Open: (a) discriminated-union on `topology`, (b) separate fixture per topology, or (c) generic `legs[]` with per-leg `gating: "atomic-bundle" | "conditional" | "independent"`.
- **`defi-dated-basis.ts`** — pending CBD archetype decision (Q15). Blocked; do not author until CBD is on the roadmap.
- **`defi-liquidation.ts`** — pending LIQ registry add (§3.6). `AtRiskPosition` shape is well-defined but the archetype itself isn't configurable yet; creating fixtures before the registry add orphans the data.

### 3.3 Health-factor widget is weETH-typed — **P1, affects 4 archetypes**

`defi-health-factor-widget` reads weETH-specific fields (`weeth_oracle_rate`, `weeth_market_rate`, `oracle_market_gap_pct` at L90-100) and labels Emergency Exit as "unwind the recursive staking position" (L151). Cannot render wstETH / JitoSOL / WBTC / SOL / external liquidation-target positions. Either generalize across LST registry or fork per-LST + per-use-case.

### 3.4 Reward-PNL factor labels are staking-coded — **P1, affects 3 archetypes**

`defi-reward-pnl-widget` hardcodes `staking_yield / restaking_reward / seasonal_reward / reward_unrealised`. For lending (AAVE/COMP/MORPHO), basis (`funding / basis_spread / trading / fees / exec_alpha`), and staked-basis (`staking + funding − borrow_cost`) the labels are wrong. Pull factor names from instance metadata; remove the hardcoded label set.

### 3.5 Composite workflow widgets missing across 3 archetypes — **P1**

Every archetype that chains legs together (rotation, staked-basis, recursive, liquidation) is currently composed by the operator hopping between primitive widgets. No single review-and-submit surface. Candidates in §4: `defi-rotation-workflow-widget` (YRL), `CarryStakedBasisWorkflowWidget` (CSB), recursive loop builder (CRS), `defi-liquidation-execute-widget` (LIQ).

### 3.6 Archetype-missing-from-registry — **P0, blocks configurability**

`LIQUIDATION_CAPTURE` is absent from `DEFI_STRATEGY_IDS`, `DEFI_STRATEGY_FAMILIES`, and the strategy-config schema. Operator cannot configure or instantiate. Registry add is a 3-file change.

## 4. New widget candidates

Queue of widgets that don't exist today but are required for manual-execution parity across one or more archetypes. Reordered as archetypes landed. **Priority** reflects multi-archetype reuse + criticality.

| Widget                               | Purpose                                                                                                | Archetypes served  | Priority     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------ | ------------ |
| `defi-peg-monitor-widget`            | Unified LST + stablecoin + WBTC peg monitor; bps drift, kill-threshold bands, alert state, exit CTA    | YS, YRL, CSB, CRS  | **P0**       |
| `defi-apy-heatmap-widget`            | `(protocol × chain)` supply-APY grid with net-APY column, winner highlight, current-position badge     | YRL                | **P0**       |
| `defi-unbonding-queue-widget`        | Queued withdrawal requests with ETA, claimable amount, claim action                                    | YS, CSB, CRS       | **P0**       |
| `defi-liquidation-opportunity-queue` | At-risk-position queue with `underwater_address`, `chain`, `bonus_bps`, `expected_profit`, execute CTA | LIQ                | **P0**       |
| `defi-liquidation-execute-widget`    | Canned 5-leg flash-bundle: submission-mode + priority-fee + min-profit gate + `mev_policy_ref` badge   | LIQ                | **P0**       |
| `cross-venue-dispersion-scanner`     | `(instrument × venue-pair)` spread matrix with cost-inclusive edge badges                              | APD                | **P0**       |
| `defi-rotation-workflow-widget`      | WITHDRAW → BRIDGE → LEND composite with single review+submit across 3 legs                             | YRL                | **P1**       |
| `defi-bridge-transit-widget`         | In-flight bridge list: source/dest/asset/amount/ETA/status                                             | YRL, CSB, CRS, APD | **P1**       |
| `defi-oracle-divergence-widget`      | Chainlink (or venue-oracle) vs market-price delta, tiered alerts (1-2% warn / 2-3% reduce / >3% exit)  | YRL, LIQ           | **P1**       |
| `CarryStakedBasisWorkflowWidget`     | 3-leg STAKE → PLEDGE+BORROW → SHORT orchestrator with instance-tagged legs                             | CSB                | **P1**       |
| `defi-recursive-loop-builder`        | N-iteration composite with per-loop collateral/debt/HF decomposition and liquidation-price projection  | CRS                | **P1**       |
| `defi-delta-drift-widget`            | Spot-vs-perp notional drift %, 2/5/10% bands, rebalance-cost gate status                               | CBP, CSB           | **P1**       |
| `defi-funding-tick-timeline`         | Per-venue funding cadence (1h/4h/8h) with next-tick countdown                                          | CBP, CSB           | **P1**       |
| `leader-hedge-execution-widget`      | LEADER_HEDGE control: `max_hedge_delay_ms`, `abort_on_adverse_move_bps`, per-leg status                | APD                | **P1**       |
| `defi-bundle-inclusion-stats`        | Flashbots bundle won/lost, inclusion rate, MEV-competitor panel                                        | LIQ, APD           | **P1**       |
| `defi-flash-liquidity-widget`        | Morpho/Aave flash-loan pool depth pre-check before atomic entry                                        | CRS, LIQ           | **P1**       |
| `defi-gas-regime-widget`             | Live gas-price feed per chain + submission-mode suggestion (Flashbots / public / MEV-blocker)          | LIQ, APD, CRS      | **P1**       |
| `defi-rebalance-cost-tracker`        | Cumulative gas+bridge fees vs cumulative yield improvement since inception                             | YRL                | **P2**       |
| `defi-approve-status-matrix`         | Per `(protocol, chain, asset)` ERC-20 approval state                                                   | YRL, CSB, CRS      | **P2**       |
| `defi-liquidation-hf-distribution`   | Histogram of external wallet HFs across target protocols                                               | LIQ                | **P2**       |
| `defi-stranded-collateral-widget`    | Seized-collateral disposition queue (hold-vs-dispose) after liquidation                                | LIQ                | **P2**       |
| `defi-validator-alerts`              | Slashing / validator-incident alerts (external signal feed)                                            | YS, CSB, CRS       | **P2**       |
| `defi-dated-basis-widget`            | Dated-futures basis execute widget (spot_buy + future_sell) with expiry & roll                         | CBD                | **deferred** |
| `defi-term-structure-grid`           | `(underlying × expiry)` matrix with basis_bps, DTE, annualised_basis, active-contract flag             | CBD                | **deferred** |

## 5. Codex updates proposed

Minimal edits only. Grouped by doc.

### `architecture-v2/archetypes/yield-staking-simple.md`

- Add `reward_model: rebase | exchange_rate` column to Supported venues table.
- Add explicit default to Risk profile: `depeg kill switch default = 100 bps (1%)`.

### `architecture-v2/archetypes/yield-rotation-lending.md`

- Call out Chainlink oracle divergence as an explicit kill-switch (tiered 1-2% warn / 2-3% reduce / >3% exit).
- Non-scope note: "Leveraged variants (supply-collateral → borrow stable → re-supply) from legacy `btc-lending-yield` and `sol-lending-yield` are `CARRY_RECURSIVE_STAKED`, not this archetype."

### `architecture-v2/archetypes/carry-basis-perp.md`

- Document that `FUNDING_RATE_FLOOR` is an instance-level knob (`target_funding_rate_bps`), not a global default.
- Resolve "WBTC + Aave + perp-short" variant placement — stays in CBP or migrates to CSB? (currently ambiguous in codex + MIGRATION.md).

### `architecture-v2/archetypes/carry-staked-basis.md`

- Add `use_aave_collateral: bool` to §Config schema — differentiates 2-leg (legacy) vs 3-leg (v2) variant.
- Decide: one archetype with variant flag vs split `CARRY_STAKED_BASIS` / `CARRY_STAKED_BASIS_LEVERAGED`.

### `architecture-v2/archetypes/liquidation-capture.md`

- Add explicit MEV-policy-per-chain table.
- Surface `max_health_factor` (exists in engine at `liquidation_capture.py:95`, missing from §Config schema).
- Document `HOLD_LEG_AND_ALERT` stranded-collateral semantics.
- Reclassify `liquidation_capture_eth.yaml` — it's a cascade-dip-buy, not the flash-loan loop (naming collision).

### `architecture-v2/archetypes/carry-basis-dated.md`

- Unblock TradFi side by declaring "IBKR ↔ CME cross-venue routing policy".
- Mark explicit status: `parked — reactivate when Deribit dated-futures execution is on BP-4 roadmap`.

## 6. Open questions (rolled up)

Grouped by theme so user can resolve batches together.

**A. Peg/depeg monitoring:**

1. One generalized `defi-peg-monitor-widget` covering LSTs + stablecoins + WBTC, or separate widgets per family?
2. Emergency-exit trigger: automatic on depeg threshold, or operator-gated button-only?
3. Should Chainlink oracle-divergence live in the peg monitor or its own widget?

**B. Health-factor widget generalization:** 4. Generalize `defi-health-factor-widget` via per-LST/asset registry, or fork per-LST (weETH/wstETH/WBTC/SOL)? 5. Extend for liquidation-targeting (render external wallet HFs) or keep operator-own-position only?

**C. Composite workflow placement:** 6. ⏸️ **DEFERRED — awaiting teammate review.** New composite widgets for rotation / staked-basis / recursive / liquidation, or extend primitive widgets with an "auto-compose" mode? Full options + tradeoffs documented in [widget-certification-deferred-questions.md §Q6](./widget-certification-deferred-questions.md#q6--composite-workflow-placement). 7. ✅ **RESOLVED** — Liquidation manual-execute kept as a **diagnostic / backend-wiring-verification surface only**. Widget shows explicit "Diagnostic — not for competitive live execution; bot services handle real opportunities" framing; CTA labeled "Submit (diagnostic)" rather than "Execute". All simulate / priority-fee / min-profit / submission-mode controls remain functional.

**D. Attribution & tagging:** 8. ⏸️ **DEFERRED — awaiting teammate review.** Where does the trade-attribution tuple (org + client + strategy + account + wallet + user) flow into widgets from, and should the OpenAPI schema be extended before UI wiring? Scope is broader than just `strategy_id` — full context + 4 sub-questions (schema extension, active-tuple source, execute-widget selectors, monitor-widget columns) in [widget-certification-deferred-questions.md §Q8](./widget-certification-deferred-questions.md#q8--attribution-model-how-does-the-trade-attribution-tuple-flow-into-widgets).

**E. Archetype scope & config:** 9. ➡️ **MOVED TO CODEX** — CSB 2-leg vs 3-leg split is archetype-taxonomy (registry shape), not widget catalog. Documented as §CSB.b in [widget-certification-deferred-questions.md#codex--architecture-updates-proposed-from-audit](./widget-certification-deferred-questions.md#codex--architecture-updates-proposed-from-audit). 10. ➡️ **MOVED TO CODEX** — CBP "WBTC + Aave + perp-short" variant placement is also archetype-taxonomy, not widget catalog. Documented as §CBP.b in the same codex section. 11. APD: unified dispersion scanner vs per-sub-pattern widgets? Funding-dispersion boundary with CBP — scanner detects, carry executes?

**F. Fixture scope & ownership:** 12. ✅ **RESOLVED (hybrid per Q12)** — staking (9 rows) and lending (16 rows) extended in-session; basis-trade, walkthrough, dated-basis, liquidation deferred with explicit design questions in §3.2. 13. ✅ **RESOLVED** — fixtures stay in UI `lib/mocks/fixtures/` now; when backend wires, dynamic data (rates, positions, orders, funding) comes from backend REST API. Basic primitives that are stable enough (venue registry, chain registry, asset aliases) can live as a static UI list even post-wire. No dedicated fixture repo.

**G. Reward/P&L widget:** 14. ✅ **RESOLVED** — Rename `defi-reward-pnl-widget` → `defi-carry-pnl-widget`; factor labels pulled from `instance.pnl_factors[]` metadata. Single widget covers YS / YRL / CBP / CSB / CRS / APD. Backend schema addition (pnl_factors metadata per strategy instance) is the prerequisite; fixtures supply labels inline until wired.

**H. Roadmap:** 15. ✅ **RESOLVED — defer indefinitely + flag for removal review.** User has no prior context on CBD (CARRY_BASIS_DATED); backend has no active pipeline work; no stakeholder is running this strategy. Archetype likely entered the codex speculatively. Action: keep placeholder audit doc as-is, but raise with teammate whether to (a) remove from `DEFI_STRATEGY_FAMILIES` entirely or (b) leave as reserved-for-future. No fixture, no widget, no codex wiring work until a real CBD initiative surfaces.

## 7. Handoff / next steps

1. **User reviews this tracker** — flag disagreements with matrix verdicts, new-widget priorities, or codex edits.
2. **User reviews the 8 per-archetype audit docs** — each is `draft-awaiting-review`; user can change status to `reviewed` or annotate.
3. **Open questions (§6) get resolved** in batches — each resolution likely collapses into a small codex edit or a prioritized widget ticket.
4. **Then:** patch widget-certification coverage JSON (`docs/widget-certification/*.json`) with the new `coverage.gaps` entries per widget, and propose the first concrete implementation ticket (likely §3.1 hardcoded `strategy_id` fix since it's the lowest-cost highest-blast-radius change).
