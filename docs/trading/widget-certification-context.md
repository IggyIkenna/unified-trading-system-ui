# Widget Certification — External Context Index

**Scope:** Widget certification (BP-3) only. NOT a general reference for the UI repo.
**Goal:** Give agents a routing map from widget-certification questions → the external
docs that hold the authoritative answer. Each strategy section below extracts the
**UI capabilities** that strategy demands, then maps them to the registered widgets.

**Asset-class order:** DeFi → CeFi → TradFi → Sports → Predictions
(DeFi is stable; others are placeholders until that phase begins.)

---

## Phase A — DeFi

### A.1 Doc index (codex)

**SSOT root:** `unified-trading-pm/codex/09-strategy/` — v1 categories archived;
`architecture-v2/` is canonical. Categories (DeFi/CeFi/…) are **derived labels**, not
routing axes — strategies are composed of family + archetype + 7 axes + 10 cross-cutting
concerns.

**Authority levels:**

- `ssot` — canonical, update in lockstep with code
- `reference` — still authoritative, not absorbed into v2
- `historical` — archived; read for migration mapping only

| Doc                                                                                                                                                | Authority | Summary (≤50 words)                                                                                                                                                                                                                                                                                                                           | Keywords                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [09-strategy/README.md](../../../unified-trading-pm/codex/09-strategy/README.md)                                                                   | ssot      | Entry-point: v2 SSOT lives in `architecture-v2/`; lists still-live cross-cutting docs; explains what moved to `_archived_pre_v2/`; keeps Tier-0 UI parity doc top-level. Legacy strategy code stays deployed until factory cutover + shadow-deploy promote per MIGRATION.md §15.                                                              | routing, v2, archive                            |
| [09-strategy/TIER_ZERO_UI_DEMO_AND_PARITY.md](../../../unified-trading-pm/codex/09-strategy/TIER_ZERO_UI_DEMO_AND_PARITY.md)                       | ssot      | Three layers of truth: Codex prose → `lib/strategy-registry.ts` + `lib/*-mock-data.ts` → OpenAPI. Tier-0 simulates; fields must be in OpenAPI or dropped. When codex/manifest change, update UI fixtures + browser handbook in same effort.                                                                                                   | codex-ui-parity, tier0, mock-data               |
| [architecture-v2/README.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/README.md)                                               | ssot      | Taxonomy + capital-flow model. 8 families × 18 archetypes × 7 axes × 10 cross-cutting concerns. 5-layer identity: family→archetype→instance→config→derived-categories. Capital flows via single event bus (`TRANSFER`/`BRIDGE`/`AllocationDirective`) across 3 scopes (venue/strategy/client).                                                | taxonomy, capital-flow, event-bus               |
| [families/carry-and-yield.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/families/carry-and-yield.md)                           | ssot      | 6 archetypes capture paid rates: basis (dated/perp), staked basis, recursive staked, yield rotation, simple staking. Shared primitives: rate/APY monitor, delta tracker, rebalance scheduler, health monitor, gas-aware rotator. Dashboard: APY curves, delta, health, P&L per-venue, carry vs paid.                                          | basis, yield, staking, delta-neutral            |
| [families/arbitrage-structural.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/families/arbitrage-structural.md)                 | ssot      | Two archetypes: price-dispersion + liquidation-capture. Execution modes: ATOMIC (single-chain multicall / batch API) vs LEADER_HEDGE (cross-venue with abort/unwind). Strategy declares intent (leader leg, max_hedge_delay, abort conditions); execution_policy picks the algo. Dashboard: opp rate, fill rate, slippage, priority-fee wins. | arb, atomic, leader-hedge, MEV                  |
| [families/market-making.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/families/market-making.md)                               | ssot      | 2 archetypes: continuous + event-settled. DeFi relevance: concentrated LP (Uniswap V3, Orca) is the continuous variant. Shared: theo model, quote generator, inventory manager, delta-proxy repricer, kill switch, adverse-selection monitor. Dashboard: inventory, fill rate, spread captured, cancel/replace rate.                          | LP, concentrated-liquidity, inventory           |
| [archetypes/carry-basis-dated.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-basis-dated.md)                   | ssot      | Long spot + short dated future. Captures futures-spot premium as spread converges at expiry. Mostly TradFi (CME); crypto Deribit-quarterly instance. HOLD_UNTIL_FLIP; rollover N days before expiry. Exec: ATOMIC single-venue or LEADER_HEDGE cross-venue.                                                                                   | basis, dated, expiry, rollover                  |
| [archetypes/carry-basis-perp.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-basis-perp.md)                     | ssot      | Long spot + short perp, captures funding rate. Single-venue netted mode (Binance spot+perp cross-margin) = best capital efficiency; cross-venue mode (Uniswap spot + Hyperliquid perp) uses LEADER_HEDGE. Multi-coin rotation via funding-rate ranking. Kill: funding reversal, spread widening.                                              | funding, perp, delta-neutral, netting           |
| [archetypes/carry-staked-basis.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-staked-basis.md)                 | ssot      | Three-leg: stake→LST→pledge on Aave→borrow USDC→short perp. Earns staking yield + funding − borrow cost. Venues: Lido/RocketPool/Jito/Marinade + Aave/Kamino + Hyperliquid/Binance/Drift. Kill switches: LST depeg, health-factor breach, funding flip.                                                                                       | staking, LST, health-factor, depeg              |
| [archetypes/carry-recursive-staked.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-recursive-staked.md)         | ssot      | Recursive loop: stake→borrow→stake→borrow. Effective leverage 2.5–3× via 60% effective LTV. Typical Sharpe 2.0–3.5 normal; sharply negative during depeg. Config: target_leverage, safety_buffer_ltv, tight max_stETH_depeg_bps (50 bps). Unwind respects unbonding period.                                                                   | leverage, LTV, depeg-amplified, unwind          |
| [archetypes/yield-rotation-lending.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/yield-rotation-lending.md)         | ssot      | Supply to best-APY protocol/chain. Single-sided, no leverage. Protocols: Aave V3 (6 EVM chains), Compound V3, Euler, Morpho, Kamino. Rebalance hourly; gas-aware (skip if gas > 10% rotation gain). Bridges: CCTP, Across, LayerZero, Stargate.                                                                                               | lending, multi-chain, bridge, gas-aware         |
| [archetypes/yield-staking-simple.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/yield-staking-simple.md)             | ssot      | Pure staking: ETH→stETH (Lido ~3.5%) or rETH (Rocket), SOL→JitoSOL (~7–8%) or mSOL. Rebase vs exchange-rate LSTs differ. Exit: DEX swap or protocol withdrawal (1–5d queue for Lido). Kill: depeg >1%.                                                                                                                                        | staking, LST, unbonding, rebase                 |
| [archetypes/arbitrage-price-dispersion.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/arbitrage-price-dispersion.md) | ssot      | Detects cross-venue dispersion (CEX, DEX, sports, vol). ATOMIC single-chain (flash loan + multicall); LEADER_HEDGE cross-venue with max_hedge_delay + abort_on_adverse_move. Pre-flight: liquidity, connectivity, pre-funded capital. Kill: abnormal dispersion (likely broken feed).                                                         | dispersion, atomic, leader-hedge, flash-loan    |
| [archetypes/liquidation-capture.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/liquidation-capture.md)               | ssot      | Monitors under-collateralized positions on Aave/Compound/Euler/Morpho/Kamino. ATOMIC flash-loan bundle: FLASH_LOAN→REPAY→SEIZE→SWAP→REPAY_FLASH_LOAN. Flashbots submission on Ethereum. Bonus 5–10% per asset. Kill: protocol incident, abnormal bundle failure.                                                                              | liquidation, flash-loan, flashbots, gas-auction |
| [cross-cutting/mev-protection.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/mev-protection.md)                   | ssot      | Submission-mode per tx: PUBLIC_MEMPOOL, FLASHBOTS_PROTECT (default for Ethereum large swaps), MEV_BLOCKER, MANIFOLD (backrun revenue share). L2s mostly PUBLIC_MEMPOOL. Bloxroute removed from stack. Policies artifact-versioned. Monitor: capture rate, relay success, delay, backrun revenue.                                              | MEV, flashbots, private-relay                   |
| [cross-cutting/transfer-rebalance.md](../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/transfer-rebalance.md)           | ssot      | Venue-scope capital movement. 7 transfer types (INTERNAL_SUBACCOUNT, CEX_WITHDRAWAL_DEPOSIT, ON_CHAIN_TRANSFER, BRIDGE, WRAP_UNWRAP, UNITY_WALLET_OP, IBKR_FUND_MOVE). Target-state protocol, idempotent by instruction_id. Bridges: Across, Stargate, LayerZero, Wormhole, CCTP.                                                             | transfer, bridge, idempotent                    |
| [cross-cutting/reward-lifecycle.md](../../../unified-trading-pm/codex/09-strategy/cross-cutting/reward-lifecycle.md)                               | reference | 4-stage: accrue → claim → sell → attribute. Applies to EigenLayer (EIGEN, weekly), EtherFi (ETHFI, quarterly). Lido has no reward tokens (yield via rate). Ops: CLAIM_REWARD (≠ COLLECT_FEES), SELL_REWARD (≠ SWAP). Thresholds: $50 claim, $100 sell, 24h cooldown.                                                                          | rewards, EIGEN, ETHFI, pnl-factor               |
| [cross-cutting/instrument-filtering.md](../../../unified-trading-pm/codex/09-strategy/cross-cutting/instrument-filtering.md)                       | reference | `DEFI_MAJOR_ASSET_SYMBOLS` (~65 symbols) in `unified-api-contracts/registry/defi_major_assets.py`. DEX: both sides must be major. Lending: base asset major. Solana adds TVL floor ($10k). Perp exchanges use separate CeFi whitelist.                                                                                                        | whitelist, TVL-floor, SSOT                      |
| [cross-cutting/rate-impact-model.md](../../../unified-trading-pm/codex/09-strategy/cross-cutting/rate-impact-model.md)                             | reference | Aave V3 two-slope kinked rate model. Our trade changes pool utilization → rate changes for all. Feature: `projected_supply_apy` with `rate_impact_supply_bps`. P&L adjusted by `projected_apy/raw_apy`. Alerts at 50bps (P1) / 200bps (P0) deviation.                                                                                         | aave, rate-impact, projected-apy                |

**Not read yet (Phase A1 deferred):** `cross-cutting/pnl-attribution.md` (447 lines), `cross-cutting/client-strategy-config.md`, `cross-cutting/client-onboarding.md`, `architecture-v2/cross-cutting/portfolio-allocator.md`, `…/risk-gates.md`, `…/execution-policies.md`, `…/trade-expression.md`, `…/venue-account-coordination.md`, `…/venue-selection-split.md`, `…/benchmark-fills.md`, `…/capital-client-isolation.md`, `…/futures-roll-and-combos.md`, `…/strategy-availability-and-locking.md`. **Read next** when widget audit hits a gap these would close.

---

### A.2 Registered DeFi widgets (ground truth)

From [components/widgets/defi/register.ts](../../components/widgets/defi/register.ts) — 17 widgets:

| #   | ID                         | Role                                                                       |
| --- | -------------------------- | -------------------------------------------------------------------------- |
| 1   | `defi-wallet-summary`      | KPI strip: balances across chains + wallets                                |
| 2   | `defi-lending`             | Protocol selector + lend/borrow/withdraw/repay + APY + HF preview          |
| 3   | `defi-swap`                | Token pair, slippage, route, gas, price-impact; has basis-trade mode       |
| 4   | `defi-liquidity`           | Add/remove LP, pool selector, fee tier, price range, TVL/APR               |
| 5   | `defi-staking`             | Stake/unstake, protocol APY, yield, TVL, unbonding                         |
| 6   | `defi-flash-loans`         | Multi-step flash bundle, borrow/repay legs, P&L preview                    |
| 7   | `defi-transfer`            | Send on one chain or bridge cross-chain + gas estimate                     |
| 8   | `defi-rates-overview`      | Protocol APY comparison across lending/staking/LP                          |
| 9   | `defi-trade-history`       | Executed instructions + instant P&L decomposition                          |
| 10  | `defi-strategy-config`     | View/edit config for active DeFi strategies                                |
| 11  | `defi-staking-rewards`     | Track/claim/sell EIGEN, ETHFI; reward P&L attribution                      |
| 12  | `defi-funding-matrix`      | Per-coin × per-venue annualised funding rates, floor highlighting          |
| 13  | `defi-waterfall-weights`   | Pillar 1 coin weights + Pillar 2 per-coin venue weights                    |
| 14  | `defi-health-factor`       | HF monitor, oracle/market rates, spread, emergency exit                    |
| 15  | `defi-reward-pnl`          | P&L decomposition by reward factor (staking/restaking/seasonal/unrealised) |
| 16  | `defi-yield-chart`         | Time-series yield curves + cumulative P&L + APY comparison                 |
| 17  | `enhanced-basis-dashboard` | Cross-venue spot/perp basis + funding + annualised yield + best-opp        |

`active-lp-dashboard` is referenced in DeFi presets but registered in a different file — tracked as cross-tab. Will verify in A.3 walkthrough.

---

### A.3 Capability extraction per strategy

For each archetype, the UI capabilities demanded by its token/position flow + monitoring + kill switches. Widget coverage status: ✅ fully covered, 🟡 partial (see note), ❌ missing, ➖ N/A for this archetype.

#### 1. `CARRY_BASIS_DATED` — long spot + short dated future

| Capability                                             | Widget                                       | Status                                                             |
| ------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------ |
| Basis spread monitor (basis_bps curve per venue pair)  | —                                            | ❌ No dated-basis curve (enhanced-basis-dashboard is perp-focused) |
| Paired spot+future position with delta-neutral tracker | `defi-trade-history` + `defi-wallet-summary` | 🟡 Positions visible but no pair-locked delta view                 |
| Atomic / leader-hedge execution                        | `defi-flash-loans`                           | 🟡 Flash-loan is atomic; no LEADER_HEDGE UI                        |
| Rollover scheduler (days-before-expiry)                | —                                            | ❌ No expiry-countdown / roll-calendar                             |
| Notional delta-neutral scaling on equity change        | `defi-strategy-config`                       | 🟡 Config surface exists but no preview of resulting legs          |

**Note:** mostly TradFi archetype; minimal DeFi footprint (Deribit crypto dated). Low priority in DeFi phase.

#### 2. `CARRY_BASIS_PERP` — long spot + short perp, funding capture

| Capability                                              | Widget                              | Status                                                                                 |
| ------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| Funding-rate monitor (per coin × per venue, annualised) | `defi-funding-matrix`               | ✅                                                                                     |
| Cross-venue spot/perp basis + best-opp highlight        | `enhanced-basis-dashboard`          | ✅                                                                                     |
| Single-venue netted vs cross-venue mode toggle          | `defi-strategy-config`              | 🟡 Config field exists (`exploit_venue_netting`) but no UI affordance to compare modes |
| Multi-coin rotation ranking                             | `defi-waterfall-weights` (Pillar 1) | 🟡 Shows weights but no funding-rank scoring                                           |
| Paired entry (spot + perp) via single action            | `defi-swap`                         | 🟡 "basis trade mode" exists; verify it emits paired ATOMIC, not sequential            |
| Delta drift rebalance trigger + current delta %         | —                                   | ❌ No live delta tracker                                                               |
| Cross-margin utilisation (netted mode)                  | —                                   | ❌ No margin/netting view                                                              |

#### 3. `CARRY_STAKED_BASIS` — stake → LST → pledge → borrow → short perp

| Capability                                                            | Widget                                   | Status                                                       |
| --------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| Stake action (Lido / RocketPool / Jito / Marinade)                    | `defi-staking`                           | ✅                                                           |
| Pledge LST as Aave/Kamino collateral + borrow USDC                    | `defi-lending`                           | ✅                                                           |
| Short perp (Hyperliquid / Binance / Drift)                            | —                                        | ❌ No DeFi-adjacent perp widget; CeFi perp lives in CeFi tab |
| LST depeg monitor + kill-switch threshold                             | `defi-health-factor`                     | 🟡 Shows HF; does it show LST depeg bps separately? (verify) |
| Health-factor monitor with auto-deleverage target                     | `defi-health-factor`                     | ✅                                                           |
| Funding-rate monitor                                                  | `defi-funding-matrix`                    | ✅                                                           |
| 3-leg P&L decomp (staking yield + funding − borrow cost)              | `defi-reward-pnl` + `defi-trade-history` | 🟡 reward-pnl covers staking; no explicit basis-decomp view  |
| Multi-step entry orchestration (ATOMIC within chain, cross-venue leg) | `defi-flash-loans`                       | 🟡 Flash-loan covers multicall; no cross-chain sequence UI   |

#### 4. `CARRY_RECURSIVE_STAKED` — stake→borrow→stake loop, 2.5–3× leverage

| Capability                                      | Widget               | Status                                         |
| ----------------------------------------------- | -------------------- | ---------------------------------------------- |
| Loop depth + per-loop position visualiser       | —                    | ❌ No recursion visualiser                     |
| Effective leverage ratio gauge                  | —                    | ❌                                             |
| Per-loop health factor (vs collapsed HF)        | `defi-health-factor` | 🟡 Shows HF but likely aggregate, not per-loop |
| Tight depeg kill-switch (50 bps) status         | `defi-health-factor` | 🟡 Verify depeg bps is shown and configurable  |
| Unwind sequence with unbonding-period awareness | —                    | ❌ No unwind planner                           |
| Leveraged staking yield P&L attribution         | `defi-reward-pnl`    | 🟡 May need per-loop breakdown                 |

#### 5. `YIELD_ROTATION_LENDING` — supply to best-APY protocol/chain

| Capability                                        | Widget                   | Status                                                      |
| ------------------------------------------------- | ------------------------ | ----------------------------------------------------------- |
| Per-protocol × per-chain APY comparison           | `defi-rates-overview`    | ✅                                                          |
| Per-chain target allocation (weights)             | `defi-waterfall-weights` | 🟡 Pillar 2 is "per-coin venue"; need chain dimension check |
| Bridge execution for cross-chain rebalance        | `defi-transfer`          | 🟡 Initiate-only; no inflight-bridge status tracker         |
| Gas-aware rebalance decision + skip-if-uneconomic | —                        | ❌ No UI explaining a skip decision                         |
| Reward-token claim (Aave rewards)                 | `defi-staking-rewards`   | 🟡 Built for EIGEN/ETHFI; verify it covers Aave incentives  |
| Rate-impact preview (projected vs raw APY)        | —                        | ❌ No rate-impact / projected-APY indicator                 |
| Hourly rebalance-cadence history                  | `defi-trade-history`     | 🟡 Shows fills; no explicit rebalance-vs-skip log           |

#### 6. `YIELD_STAKING_SIMPLE` — pure LST hold, passive

| Capability                                             | Widget               | Status                                                    |
| ------------------------------------------------------ | -------------------- | --------------------------------------------------------- |
| LST protocol selector + APY                            | `defi-staking`       | ✅                                                        |
| Stake / unstake action                                 | `defi-staking`       | ✅                                                        |
| Exit-mode toggle (DEX swap vs protocol withdrawal)     | `defi-staking`       | 🟡 Verify the widget exposes this toggle                  |
| Unbonding-queue timeline (Lido 1–5d, Jito epoch-based) | —                    | ❌ No unbonding-queue visual                              |
| Rebase vs exchange-rate yield tracking                 | `defi-yield-chart`   | 🟡 Covers time-series; verify factor split                |
| Depeg kill-switch status                               | `defi-health-factor` | 🟡 Built for HF-based strategies; fit for simple staking? |

#### 7. `ARBITRAGE_PRICE_DISPERSION` — cross-venue spread capture

| Capability                                                                        | Widget               | Status                                                            |
| --------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------- |
| Dispersion scanner (live cross-venue spread ticker)                               | —                    | ❌ Major gap. enhanced-basis-dashboard is basis-specific, not arb |
| Opportunity queue with net-edge after costs                                       | —                    | ❌                                                                |
| Atomic multicall / flash-loan bundle builder                                      | `defi-flash-loans`   | ✅                                                                |
| LEADER_HEDGE execution config (leader, max_hedge_delay_ms, abort_on_adverse_move) | —                    | ❌ No leader-hedge UI                                             |
| Per-opp P&L + execution slippage vs detected spread                               | `defi-trade-history` | 🟡 Shows fills; no "detected spread" column                       |
| Priority-fee auction wins/losses (for DEX / liquidation variant)                  | —                    | ❌                                                                |
| Cross-venue vol-surface arb view (Deribit ↔ OKX IVs)                              | —                    | ❌ Out of scope for DeFi tab                                      |
| Within-surface no-arb violations (butterfly / calendar / parity)                  | —                    | ❌ Out of scope for DeFi tab                                      |

#### 8. `LIQUIDATION_CAPTURE` — under-collateralised position snipe

| Capability                                                                  | Widget                 | Status                                          |
| --------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------- |
| Under-collateralised position watcher (OTHERS' positions, per-protocol)     | —                      | ❌ defi-health-factor is for OUR positions      |
| Per-opp profit estimate (seized_collateral × bonus − debt − gas − slippage) | —                      | ❌                                              |
| Flash-loan bundle builder (FLASH_LOAN→REPAY→SEIZE→SWAP→REPAY)               | `defi-flash-loans`     | ✅                                              |
| Flashbots submission-mode selector + bundle status                          | —                      | ❌ No MEV-mode UI                               |
| Gas-auction priority-fee strategy config                                    | `defi-strategy-config` | 🟡 Config field exists; no live auction monitor |
| Per-protocol liquidation-bonus config display                               | `defi-strategy-config` | 🟡 Config-only                                  |
| Per-chain success/failure rate over time                                    | `defi-yield-chart`     | 🟡 Could decompose; verify                      |

---

### A.4 Consolidated findings (DeFi)

**Missing widgets — candidates for BP-3 creation:**

1. **Dispersion scanner + opportunity queue** — serves `ARBITRAGE_PRICE_DISPERSION`. Live cross-venue spread ticker (DEX × DEX, CEX × CEX), net-edge after costs, historical fill/skip log.
2. **Liquidation opportunity queue** — serves `LIQUIDATION_CAPTURE`. Watches others' positions across Aave/Compound/Euler/Morpho/Kamino. Profit estimate per opp. **Distinct** from existing `defi-health-factor` (which is OUR positions).
3. **Recursive-loop visualiser** — serves `CARRY_RECURSIVE_STAKED`. Shows stake→borrow→stake loops, per-loop HF, effective leverage ratio, unwind planner with unbonding-period awareness.
4. **MEV submission monitor** — serves DeFi swaps + liquidations. Routing mode per tx (PUBLIC / FLASHBOTS_PROTECT / MEV_BLOCKER / MANIFOLD), private-relay success rate, backrun revenue share, block-inclusion delay.
5. **Inflight-bridge status tracker** — serves every cross-chain strategy. Current `defi-transfer` initiates but doesn't track CCTP/Across/Stargate submissions in-flight (1–30 min typical). Target-state reconciliation view.
6. **Dated-basis curve + rollover calendar** — serves `CARRY_BASIS_DATED`. Low priority for DeFi phase; park until TradFi phase.

**Existing widgets — updates required:**

| Widget                   | Update                                                                                                            | Why                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `defi-funding-matrix`    | Add "rotation-rank" column (for multi-coin CARRY_BASIS_PERP)                                                      | Strategy needs a ranked view, not just per-cell rate                               |
| `defi-waterfall-weights` | Confirm / add per-chain dimension (ethereum/arbitrum/…) for YIELD_ROTATION_LENDING                                | Pillar 2 doc says "per-coin venue"; rotation needs chain weights                   |
| `defi-health-factor`     | Add LST depeg bps row with per-LST threshold + kill switch indicator                                              | Kill switches are depeg-based, not purely HF-based (carry-staked-basis, recursive) |
| `defi-rates-overview`    | Add projected-APY column (accounts for our rate-impact)                                                           | See `rate-impact-model.md` — strategies size on projected APY, not raw             |
| `defi-trade-history`     | Add detected-vs-realised spread column for arb legs                                                               | Execution slippage attribution requires both                                       |
| `defi-swap`              | Verify "basis trade mode" emits paired ATOMIC, not sequential legs (else cross-venue breaks)                      | ATOMIC vs LEADER_HEDGE semantics per family doc                                    |
| `defi-staking-rewards`   | Verify Aave/Compound supply-side incentives are covered, not just EIGEN/ETHFI                                     | yield-rotation-lending needs this                                                  |
| `defi-staking`           | Expose exit-mode toggle (DEX swap vs protocol withdrawal) + unbonding timeline                                    | yield-staking-simple uses both paths                                               |
| `defi-strategy-config`   | Expose execution-ordering config for arb/basis strategies (leader, max_hedge_delay_ms, abort_on_adverse_move_bps) | Per strategy-v2 contract these are strategy-level declarations                     |

**Per-widget `coverage.gaps` entries (BP-3):** the ❌ and 🟡 rows above map 1:1 into `coverage.gaps` on each widget's JSON.

**Doc drift flagged:**

- [docs/trading/INDEX.md](INDEX.md) says `WIDGET_CATALOGUE.md` covers "124 widgets across 17 domains". Actual count is **125** (verified 2026-04-20 against `registerWidget(...)` calls). Update when `WIDGET_CATALOGUE.md` is next touched.

---

## Phase B — CeFi (placeholder)

_Not yet scoped. Start after DeFi Phase A widget audit + remediation complete._

## Phase C — TradFi (placeholder)

## Phase D — Sports (placeholder)

## Phase E — Predictions (placeholder)
