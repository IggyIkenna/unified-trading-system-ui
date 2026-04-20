---
title: Widget-certification sync — incoming codex commit 83a2f95 (2026-04-20)
status: reference
scope: Widget-cert program; resolves / clarifies open items against the BP-3 DeFi widget audit
incoming_commit: unified-trading-pm@83a2f953753a29142609453e71b84164e3ebaf38
primary_ssot: unified-trading-pm/codex/09-strategy/architecture-v2/category-instrument-coverage.md
created: 2026-04-20
---

# Widget-certification sync — incoming codex commit

The PM-repo commit `83a2f95` (`chore(pm): parallel-agent codex/plans sync on live-defi-rollout`) rewrites every strategy archetype doc the widget-cert audit was built against. This note is the diff from the widget-cert program's perspective: what the incoming commit **resolves**, **changes**, or **adds** — and the per-widget actions that follow.

Nothing here supersedes the tracker ([widget-certification-tracker.md](./widget-certification-tracker.md)) or the per-archetype findings ([docs/audits/strategy-widget-findings/](../audits/strategy-widget-findings/)); it lists the _codex deltas_ that widget-cert authors should reflect in their next pass.

## 1. The big structural change

Every per-archetype "Supported venues / instruments" table is **gone**. Archetype docs now point to one SSOT:

`unified-trading-pm/codex/09-strategy/architecture-v2/category-instrument-coverage.md` (1,396 lines, §5 – §18 cover the 14 archetypes in our audit set).

Each coverage section carries:

- A `Category × Instrument` table with `status ∈ {SUPPORTED, PARTIAL, BLOCKED, N/A}`, representative venues, signal variant, notes/gap.
- A `Representative slot_labels` block — the canonical `strategy_id` shape.

**Why this matters for widgets:** the BP-3 fixture scope questions (§3.2 of tracker), the `strategy_id` literal questions (§3.1 of tracker), and the AMM_LP / CBP / CSB archetype-ambiguity questions (§6 E of tracker) all have authoritative answers now.

## 2. `strategy_id` — the canonical shape is the slot_label

Tracker §3.1 flagged 7 widgets hardcoding `strategy_id` literals like `"AAVE_LENDING"`, `"BASIS_TRADE"`, `"AMM_LP"`. The codex-side SSOT for `strategy_id` shape is:

```
{ARCHETYPE}@{slot}-{env}
```

Examples straight from `category-instrument-coverage.md`:

| Archetype                  | Slot-label example                                                        |
| -------------------------- | ------------------------------------------------------------------------- |
| YIELD_STAKING_SIMPLE       | `YIELD_STAKING_SIMPLE@lido-steth-ethereum-eth-prod`                       |
| YIELD_ROTATION_LENDING     | `YIELD_ROTATION_LENDING@aave-multichain-usdc-prod`                        |
| CARRY_BASIS_PERP           | `CARRY_BASIS_PERP@binance-btc-usdt-prod`                                  |
| CARRY_STAKED_BASIS         | `CARRY_STAKED_BASIS@lido-aave-hyperliquid-eth-prod`                       |
| CARRY_RECURSIVE_STAKED     | `CARRY_RECURSIVE_STAKED@lido-aave-steth-ltv75-ethereum-prod`              |
| ARBITRAGE_PRICE_DISPERSION | `ARBITRAGE_PRICE_DISPERSION@binance-bybit-btc-usdt-prod`                  |
| LIQUIDATION_CAPTURE        | `LIQUIDATION_CAPTURE@aave-ethereum-eth-usdc-prod`                         |
| MARKET_MAKING_CONTINUOUS   | `MARKET_MAKING_CONTINUOUS@uniswap-v3-weth-usdc-ethereum-active-usdc-prod` |

**Implication for §3.1 ticket:** the widget context source should supply the full slot-label (or a record with `archetype`, `slot`, `env` fields). The current literals (`"AAVE_LENDING"`) are not shortenings of the slot-label — they're venue-shaped aliases. Fall-back when no host context is present should be a placeholder slot-label, not a venue-id string.

`env` launch order (from coverage doc §Slot label grammar): **`shadow → uat → paper → prod`**. Strategy instance badges need this field.

## 3. AMM_LP_PROVISION is NOT a missing archetype

Tracker §1 marks `AMM_LP_PROVISION` as `🆕 gap-surfaced — discovered via widget-gap audit` and raises whether to add it to `DEFI_STRATEGY_FAMILIES` (item in open-questions §6).

**Resolution from codex:** `AMM_LP` is the [`MARKET_MAKING_CONTINUOUS`](#) archetype's Sub-mode B (ACTIVE_LP) / Sub-mode C (PASSIVE_LP). See `architecture-v2/archetypes/market-making-continuous.md` §Sub-mode B/C and coverage doc §13.

Widget mapping follows:

| Widget                       | Archetype                            | Notes                                                                          |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------ |
| `defi-liquidity-widget`      | `MARKET_MAKING_CONTINUOUS` ACTIVE_LP | Current literal `"AMM_LP"` should become the MMC slot_label (§2 pattern above) |
| `active-lp-dashboard-widget` | `MARKET_MAKING_CONTINUOUS` ACTIVE_LP | In-range %, IL%, fees24h, TVL panel; fits Sub-mode B description               |

**Action:** update tracker §1 row 9 status from `gap-surfaced` → `resolved — covered by MARKET_MAKING_CONTINUOUS Sub-mode B`. Write a `market-making-continuous-active-lp.md` audit note in `docs/audits/strategy-widget-findings/` (matches existing 8-archetype format). The codex edit we proposed for "add AMM_LP to `DEFI_STRATEGY_FAMILIES`" is no longer needed — `DEFI_STRATEGY_FAMILIES` needs an MMC entry instead (if it doesn't have one).

## 4. Archetype-placement ambiguities — resolved in MIGRATION.md §14

MIGRATION.md §14 is renamed from "Outstanding Decisions (TBD)" to **"Routing defaults for ambiguous legacy files"** — decisions are now pre-decided defaults rather than open questions. Directly relevant to tracker open-questions §6E:

| Tracker question                            | Incoming resolution                                                                                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q9: CSB 2-leg vs 3-leg split                | `defi/enhanced_basis.py` routes CRS if loop is recursive, CSB if single-step.                                                                                                                    |
| Q10: CBP "WBTC + Aave + perp-short" variant | Same routing rule — LST + perp with Aave borrow = CSB (redirect note in CBP §LST).                                                                                                               |
| `defi/cross_chain_yield_arb.py` placement   | YRL if rate-spread alpha sustained over hours; APD if transient structural arb.                                                                                                                  |
| `defi/ethena-benchmark.md`                  | Benchmark reference, not a deployed strategy. The `"ETHENA_BENCHMARK"` literal in `defi-staking-widget` L129 should NOT survive as a runtime `strategy_id` — it's a benchmark label, not a slot. |

**Action:** collapse tracker §6 items Q9, Q10, Q11 "MOVED TO CODEX" notes into concrete codex references (cite MIGRATION.md §14 directly). The `ETHENA_BENCHMARK` hardcoding in `defi-staking-widget` needs a different fix than §3.1 — it's a benchmark surface, not a strategy instance.

## 5. Fixture coverage — the codex SSOT for §3.2 extension

Tracker §3.2 extended `defi-staking.ts` (9 rows) and `defi-lending.ts` (16 tuples). Cross-check against the coverage matrix:

| Fixture                          | Codex coverage status (coverage.md §)                                                           | Over/under-coverage note                                                                                                                                                                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defi-staking.ts`                | §10 YS: Lido stETH / Rocket Pool rETH / Ether.fi eETH / Jito JitoSOL / Marinade mSOL — 5 tuples | Our fixture has 9 rows including **Kelp, Renzo, Lombard** — codex does not list these. Either they're below the codex granularity bar (LRTs / BTC-LST not yet in YS) or our fixture over-reached. Flag for teammate: remove or add capability declaration.                                                          |
| `defi-lending.ts`                | §9 YRL: Aave V3 on 6 chains + Compound V3 (ETH) + Euler (ETH) + Morpho (ETH) + Kamino (SOL)     | Our 16-tuple fixture aligns with the codex surface. Codex note: **CeFi lending is BLOCKED (deliberate)** — Binance Earn / Bybit out-of-scope per lockup + counterparty risk.                                                                                                                                        |
| `defi-basis-trade.ts` (deferred) | §6 CBP                                                                                          | Codex confirms Drift = SOL perp; Deribit = dated / option surface (not a CBP-friendly perp venue — CBP is "spot + perp continuous"). Drift belongs in CBP coverage; Deribit perp does too. Deribit **dated** goes to CBD (§5), not CBP.                                                                             |
| `defi-walkthrough.ts` (deferred) | §6 CBP coverage row 4 (DeFi cross-chain)                                                        | Codex explicitly states: "Bridge latency breaks LEADER_HEDGE deadline — needs longer `max_hedge_delay_ms` config + bridge state machine integration." The ATOMIC vs LEADER_HEDGE question resolves to: **topology is an execution-policy axis, not archetype**. Shape as `execution_policy_ref` on the walkthrough. |
| `defi-dated-basis.ts` (blocked)  | §5 CBD                                                                                          | Still deferred per tracker §6 H. Codex confirms DeFi dated-future is BLOCKED (no venue). IBKR ↔ CME cross-venue routing policy also flagged in CBD coverage notes.                                                                                                                                                  |
| `defi-liquidation.ts` (blocked)  | §12 LIQ                                                                                         | Still blocked on registry. Coverage matrix is clear: Aave V3 on 6 chains, Compound/Euler/Morpho PARTIAL, Kamino SUPPORTED, GMX V2 perp PARTIAL. Use this list when the registry lands.                                                                                                                              |

## 6. `coverage.gaps` metadata for widget-certification JSON

Tracker §7 step 4 mentions patching widget-certification coverage JSON with `coverage.gaps`. The incoming coverage matrix gives us a vocabulary that mirrors the codex status values:

- `status: SUPPORTED` — full fit
- `status: PARTIAL` — cite the notes/gap column verbatim (e.g., "Bridge latency breaks LEADER_HEDGE deadline")
- `status: BLOCKED` — cite the blocker
- `status: N/A` — out-of-scope for the widget's archetype

**Action:** when populating `coverage.gaps` on any widget JSON, pull the exact wording from coverage matrix §5-§18 notes/gap column. Keeps UI metadata in sync with codex (single update point if the codex note changes).

## 7. Prediction-markets gap register — new SSOT

New file: `unified-trading-pm/codex/09-strategy/cross-cutting/prediction-markets-codification-gaps.md` — 7 numbered gaps (G1–G7) covering UIC enums, instrument-ID convention, semantic market matching, classifier, venue registry wiring, Kalshi testnet, history pipeline.

**Relevance to widgets:** APD archetype coverage §11 has prediction-markets rows (`unity-epl-1x2-usd-prod`, `polymarket-unity-elections-usdc-prod`, etc.). Any widget that surfaces APD + sports/prediction (e.g., `sports-arb-widget` row in tracker §2) should reflect that Polymarket/Kalshi venue declaration is still at G5 (PLANNED → VENUE_REGISTRY). Treat prediction-market cells as `PARTIAL` until G5 closes.

## 8. Concrete follow-up actions for widget-cert

- [ ] Tracker §1 row 9: flip `AMM_LP_PROVISION` → "resolved under MMC Sub-mode B"; move row to a new "MARKET_MAKING_CONTINUOUS (ACTIVE_LP view)" entry in §2.
- [ ] Tracker §3.1 ticket: rewrite fix pattern to "slot-label from host context, not literal". Call out `ETHENA_BENCHMARK` as a separate fix (benchmark surface, not strategy_id).
- [ ] Tracker §3.2 fixtures: re-evaluate `defi-staking.ts` Kelp/Renzo/Lombard rows against codex §10; either remove or flag as "pending UAC capability declaration".
- [ ] Tracker §5 "Codex updates proposed": all proposed archetype-doc edits need rewrite — inline tables are gone, so edits should either target the coverage matrix (§5-§18) or the archetype-specific prose sections only.
- [ ] Widget-certification JSON: populate `coverage.gaps` using coverage-matrix status + notes verbatim.
- [ ] Add `env` field (`shadow | uat | paper | prod`) to strategy-instance display where it currently shows none.
- [ ] Write per-archetype audit doc for MARKET_MAKING_CONTINUOUS ACTIVE_LP (fills the audit-set gap).

## 9. Files to read in order (for new agents picking this up)

1. **This doc** — for the widget-cert-scoped summary.
2. `unified-trading-pm/codex/09-strategy/architecture-v2/category-instrument-coverage.md` — SSOT for venue/instrument/slot-label.
3. `unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md` §14 — routing defaults for ambiguous legacy files.
4. `unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/market-making-continuous.md` §Sub-mode B/C — AMM_LP coverage.
5. `unified-trading-pm/codex/09-strategy/cross-cutting/prediction-markets-codification-gaps.md` — prediction-market G1-G7 gaps (relevant to APD + sports widgets).
6. `docs/trading/widget-certification-tracker.md` — existing tracker (this doc updates its open questions, does not replace it).
