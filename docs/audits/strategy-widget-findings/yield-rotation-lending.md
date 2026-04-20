---
archetype: YIELD_ROTATION_LENDING
status: in-progress
---

# YIELD_ROTATION_LENDING — Widget Audit

## 1. Archetype summary

**Thesis:** Single-sided supply (no leverage) into lending protocols, with capital rotated across `(protocol, chain, asset)` tuples when APY differentials exceed the cost to move. "Where's the best place for my stablecoin / BTC / ETH to sit right now?" — monitor 22+ venues, pick the winner, migrate when it's worth it.

**Position shape:** One active supply position per strategy instance, possibly fragmented across chains per `max_pct_per_chain` (default 50%). Each leg: `asset → aToken / cToken / mToken / kToken` on the target protocol. Held-to-earn, rotated on signal.

**P&L drivers:**

- Supply APY realized via index growth (Aave: `liquidityIndex`) or exchange-rate growth (Compound, Morpho, Kamino)
- Reward tokens (Aave AAVE, Compound COMP, Morpho MORPHO) — optional claim + sell
- Minus: gas on every LEND / WITHDRAW / BRIDGE; bridge fees (Socket / CCTP); approve gas
- No execution alpha (mostly deterministic)

**Kill switches (per v2 archetype + legacy docs):**

- Protocol incident (exploit, governance pause, oracle failure)
- Stablecoin / asset depeg > threshold (e.g. 1%)
- Pool utilization > 95% (withdrawal blocked until borrowers repay)
- Chain halt / severe congestion preventing withdrawal
- Bridge exploit or prolonged bridge pause
- Protocol TVL drops > 30% in 24h (panic / exploit signal)

**UI-visible config knobs:** `protocol_eligible[]`, `chains_eligible[]`, `asset`, `share_class`, `min_apy_differential_bps`, `min_rebalance_notional_usd`, `gas_budget_pct_of_rotation`, `rebalance_cadence_minutes`, `max_pct_per_chain`.

**Sources:**

- v2 SSOT: [architecture-v2/archetypes/yield-rotation-lending.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/yield-rotation-lending.md)
- Legacy (reference only): [defi/aave-lending.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/aave-lending.md) · [defi/multi-chain-lending-yield.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/multi-chain-lending-yield.md) · [defi/btc-lending-yield.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/btc-lending-yield.md) · [defi/sol-lending-yield.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/sol-lending-yield.md)
- Cross-cutting reward lifecycle: [cross-cutting/reward-lifecycle.md](../../../../unified-trading-pm/codex/09-strategy/cross-cutting/reward-lifecycle.md)

**Scope clarification — leverage is out of scope here:** legacy `btc-lending-yield` and `sol-lending-yield` both document optional leveraged variants (supply WBTC → borrow USDC → re-supply; supply SOL → borrow USDC → re-supply). Per v2 archetype doc `YIELD_ROTATION_LENDING` is **single-sided supply, no leverage** — the legacy leveraged variants belong to `CARRY_RECURSIVE_STAKED` (Lido/Jito recursive loops) or a future "lending-leveraged" archetype. This audit covers only the pure-supply path; leveraged WBTC/SOL flows will be re-audited under CARRY_RECURSIVE_STAKED.

## 2. Concrete strategies in this archetype

Per [MIGRATION.md §2 + §8](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md), 4 legacy DeFi docs consolidate into `YIELD_ROTATION_LENDING`:

| Legacy doc                                        | Scope                                                                            | v2 Example Instance                                                                     | Notes                                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `defi/aave-lending.md`                            | Stablecoin supply to Aave V3 (Ethereum, with intra-family USDC/USDT/DAI routing) | `YIELD_ROTATION_LENDING@aave-ethereum-usdc-prod` (single-chain instance)                | Has intra-family SOR (swap to best-APY stable within family) — a sub-primitive above pure rotation |
| `defi/multi-chain-lending-yield.md`               | Multi-protocol × multi-chain rotation (22+ tuples)                               | `YIELD_ROTATION_LENDING@aave-multichain-usdc-prod`, `@aave-compound-ethereum-usdc-prod` | The canonical "rotation" shape; consolidates aave-lending into multi-chain                         |
| `defi/btc-lending-yield.md` (supply-only portion) | WBTC / cbBTC supply across Aave V3 on 5 chains                                   | `YIELD_ROTATION_LENDING@aave-multichain-wbtc-prod`                                      | Directional BTC exposure (no hedge); uses WBTC on L1/L2s and cbBTC on Base                         |
| `defi/sol-lending-yield.md` (supply-only portion) | USDC / SOL / USDT supply to Kamino on Solana                                     | `YIELD_ROTATION_LENDING@kamino-sol-usdc-prod`                                           | Single-chain (Solana); 5–15% APY higher than EVM stablecoin supply                                 |

**Archetype doc lists 7 example instances** (v2 `yield-rotation-lending.md` §Example instances):

```text
YIELD_ROTATION_LENDING@aave-multichain-usdc-prod
YIELD_ROTATION_LENDING@aave-multichain-usdt-prod
YIELD_ROTATION_LENDING@aave-multichain-wbtc-prod
YIELD_ROTATION_LENDING@aave-multichain-eth-prod
YIELD_ROTATION_LENDING@aave-compound-ethereum-usdc-prod   (multi-protocol single-chain)
YIELD_ROTATION_LENDING@kamino-sol-usdc-prod               (Solana only)
YIELD_ROTATION_LENDING@aave-ethereum-steth-prod           (stETH supply, ETH share class)
```

**Lending basket families** (from aave-lending §Underlying Families and multi-chain-lending §Underlying Families):

- Stablecoin family: `[USDC, USDT, DAI]` — USD-pegged, interchangeable
- ETH family: `[ETH, WETH, stETH]` — for ETH share class
- BTC family: `[WBTC, cbBTC]` — cross-chain BTC exposure
- Solana: `[USDC, USDT, SOL, bonk]` via Kamino

Within a family, the strategy may pick the highest-APY variant (gated by `min_apy_improvement_bps` — default 50 bps — to cover swap cost). That is a **second SOR layer** on top of the (protocol, chain) rotation.

**Supported venues per archetype doc §Supported venues:**

| Protocol    | Chains                                                                                                                   | Assets                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Aave V3     | Ethereum, Arbitrum, Optimism, Polygon, Avalanche, Base (+ 4 more per multi-chain-lending: Gnosis, Metis, Scroll, zkSync) | USDC, USDT, DAI, ETH, stETH, wBTC |
| Compound V3 | Ethereum, Arbitrum, Optimism, Polygon, Base, Scroll                                                                      | USDC, ETH                         |
| Euler       | Ethereum                                                                                                                 | Wider asset set                   |
| Morpho      | Ethereum, Base, Arbitrum, Optimism, Polygon, Scroll                                                                      | Wider asset set                   |
| Kamino      | Solana                                                                                                                   | USDC, SOL, JitoSOL, bonk          |

22+ active `(protocol, chain)` tuples in the universe.

---

## 3. UI capability requirements

Grouped by **execute · monitor · support · exit**. Each capability must be fulfillable via UI so operators can trade manually and thereby verify the backend path is wired.

### 3a. Execute

- **Select `(protocol, chain, asset)` target** — single-pick for manual deploy; or **pick winner** button that populates from APY heatmap
- **LEND action** — supply `asset` to `(protocol, chain)`, receive yield-bearing token (aToken / cToken / mToken / kToken); pre-submit shows expected rate + utilization + min-deposit
- **WITHDRAW action** — redeem from `(protocol, chain)`; pre-submit shows withdrawal availability if utilization high
- **BRIDGE action** — cross-chain capital move (Socket for EVM-EVM, CCTP for USDC, Wormhole for EVM↔Solana); route preview with fee + time + trust score
- **ROTATE workflow** — orchestrates WITHDRAW (source) → BRIDGE → LEND (target) as a single reviewable sequence; operator confirms once, watches the 3 legs execute
- **Approve helper** — ERC-20 approve for the target protocol (gas + blocker for new chains)
- **Amount entry** with 25/50/75/100% helpers relative to available balance on source chain
- **Config surface (manual override pre-submit):** `min_apy_differential_bps`, `max_pct_per_chain`, `gas_budget_pct_of_rotation`, active rebalance cadence countdown
- **Strategy instance tag** on every emitted order (LEND / WITHDRAW / BRIDGE) matches the active instance ID (e.g. `YIELD_ROTATION_LENDING@aave-multichain-usdc-prod`) — not a venue-specific string like `"AAVE_LENDING"`
- **Family-aware asset swap** (intra-family SOR) — if the operator holds USDT but USDC has better APY at the target, widget should offer a pre-step swap on source chain (respects `min_apy_improvement_bps`)

### 3b. Monitor

- **Cross-chain APY heatmap** — grid of `(protocol × chain)` with current supply APY color-coded; highlights the winner tuple for the active asset. This is the primary monitor for rotation decisions.
- **Net APY per tuple** — gross APY minus annualized `(gas + bridge_fee) / expected_holding_period`. Rotation-decision source of truth.
- **Current position distribution** — pie / bar showing actual deployed capital by `(protocol, chain)`, with concentration vs `max_pct_per_chain` cap
- **Per-pool utilization** — color-coded against withdrawal-risk thresholds (warn ≥ 85/90%, critical ≥ 95%)
- **Per-pool TVL** — with TVL-cliff alert (> 30% drop in 24h)
- **APY time-series** per active tuple (30/60/90d) — identify regime shifts
- **Liquidity-index / exchange-rate growth** — actual realized yield from on-chain index change, not estimated
- **Reward-token accrual** (AAVE, COMP, MORPHO) when protocol has a separate reward program (per [cross-cutting/reward-lifecycle.md](../../../../unified-trading-pm/codex/09-strategy/cross-cutting/reward-lifecycle.md))
- **P&L waterfall per instance** — supply yield − gas − bridge − reward-token claim/sell outcome
- **Rebalance cost tracker** — cumulative gas + bridge fees vs cumulative yield improvement since inception (is the rotation strategy paying for itself?)
- **Stablecoin depeg monitor** — `abs(1.0 − token_price_usd)` for active supply asset; tiered action zones (`>0.5% warn`, `>1% reduce`, `>2% full exit`). Shared concern with LST depeg from YIELD_STAKING_SIMPLE.
- **Oracle divergence monitor** (Chainlink on Aave) — oracle vs market price delta; tiered alerts (1-2% warn, 2-3% reduce, >3% emergency exit)
- **Bridge health / liveness** — Socket operational status per route; pause indicator

### 3c. Support

- **Per-chain wallet balance** — native + supply asset + gas-token threshold warning per chain (gas-low = can't execute on that chain)
- **Bridge route preview** — fee / time / best-return / fastest badges before committing (multi-chain-lending §PnL Attribution: "bridge cost is one-time P&L hit")
- **Bridge-transit monitor** — list of in-flight bridges with source/dest chain, asset, amount, ETA, status. Critical: capital is "temporarily illiquid" (multi-chain-lending §Margin & Liquidation) during 2-15 min Socket transit
- **Gas price per chain** — live feed; used both to warn pre-submit and to inform rotation-vs-stay decision
- **Approve status** — which `(protocol, chain, asset)` pairs are already ERC-20-approved for the active wallet (approves are one-time but required before first LEND on each new combo)
- **Treasury / share-class view** — supply-side view of capital: deposited, deployed, in-transit, idle. Rebalance preview when `react_to_equity_change` fires
- **Rebalance cadence indicator** — countdown to next auto-rebalance tick; manual "evaluate now" button
- **Validation preview** — pre-submit check that the target `(protocol, chain, asset)` is in `protocol_eligible × chains_eligible` and that per-chain cap wouldn't be breached

### 3d. Exit

- **Single-tuple withdraw** — WITHDRAW from one `(protocol, chain)` only (e.g. when that chain degrades but others are fine)
- **Full exit workflow** — iterate all active tuples: WITHDRAW → BRIDGE back to base chain (e.g. Ethereum for EVM, Solana→Ethereum via Wormhole if needed) → consolidated idle balance. Review + confirm once, execute sequentially.
- **Emergency exit** — forced withdraw that accepts slippage and high gas; reachable from:
  - stablecoin-depeg monitor when asset deviates > 2%
  - oracle-divergence monitor when Chainlink off by > 3%
  - utilization monitor when pool util > 95% (withdraw while you still can)
  - protocol TVL cliff alert
- **Per-protocol partial exit** — "close Morpho positions, keep Aave" — useful when one protocol shows risk but others don't
- **Reward-token harvest on exit** — if rewards accrued, option to claim + swap to base asset as part of exit sequence (per `cross-cutting/reward-lifecycle.md`)
- **Exit confirmation** — aToken/cToken balance → 0, underlying restored to wallet, P&L attribution finalizes (supply yield + realized rewards − all gas/bridge costs)

---

## 4. Widget-by-widget verification

Legend: ✅ fits · 🟡 partial · ❌ missing · ➖ tangential

### 4a. `defi-lending-widget` — primary execute surface · 🟡 partial

File: [components/widgets/defi/defi-lending-widget.tsx](../../../components/widgets/defi/defi-lending-widget.tsx)

What it does today:

- 4 operations toggle: LEND / BORROW / WITHDRAW / REPAY at [defi-lending-widget.tsx:86-105](../../../components/widgets/defi/defi-lending-widget.tsx#L86-L105)
- Protocol select (flat list, not grouped by chain) at [defi-lending-widget.tsx:70-82](../../../components/widgets/defi/defi-lending-widget.tsx#L70-L82)
- Asset select scoped to selected protocol, shows per-asset supply + borrow APY at [defi-lending-widget.tsx:109-124](../../../components/widgets/defi/defi-lending-widget.tsx#L109-L124)
- Max slippage selector at [defi-lending-widget.tsx:140-152](../../../components/widgets/defi/defi-lending-widget.tsx#L140-L152)
- Expected output block varies per operation at [defi-lending-widget.tsx:155-191](../../../components/widgets/defi/defi-lending-widget.tsx#L155-L191)
- Health-factor preview (before/after, liquidation warning at HF < 1.1) at [defi-lending-widget.tsx:208-250](../../../components/widgets/defi/defi-lending-widget.tsx#L208-L250)

Gaps vs archetype requirements:

1. **Hardcoded `strategy_id: "AAVE_LENDING"` at [defi-lending-widget.tsx:259](../../../components/widgets/defi/defi-lending-widget.tsx#L259)** — blocks per-instance attribution. Seven example instances (`@aave-multichain-usdc-prod`, `@aave-compound-ethereum-usdc-prod`, `@kamino-sol-usdc-prod`, etc.) all emit the same venue-shaped id. **Blocker.**
2. **No explicit chain selector** — protocol select conflates `(protocol, chain)` because fixture uses `venue_id` like `"AAVEV3-ARBITRUM"`. Operator cannot express "lend into Aave V3 on Base" unless that specific tuple is pre-seeded. Not a bug in the widget, but the widget needs a proper `(protocol, chain, asset)` 3-pick shape once the fixture grows.
3. **BORROW and REPAY are out of scope for pure-supply rotation** — they belong to CARRY_RECURSIVE_STAKED / a future lending-leveraged archetype. Not removable (the widget is generic), but the archetype config should drive which ops are offered.
4. **No rotation-workflow composite** — operator cannot submit a single "WITHDRAW from A, BRIDGE, LEND into B" review. Needs composition across this widget and `defi-transfer-widget` today, with the rotation widget missing.
5. **No per-pool utilization or TVL context** in the expected-output block — operator cannot see "you're about to supply to a 96% utilized pool" before confirming.
6. **No approve-status indicator** — operator can't see whether the `(protocol, chain, asset)` is already approved; will submit and then the tx will fail if approve is required first.

### 4b. `defi-rates-overview-widget` — monitor: APY table · 🟡 partial

File: [components/widgets/defi/defi-rates-overview-widget.tsx](../../../components/widgets/defi/defi-rates-overview-widget.tsx)

Shows a flat table of supply + borrow rates per protocol. Useful for top-level "where's USDC paying best" glance.

Gaps:

1. **Not a heatmap** — no protocol × chain grid. The archetype needs the two-dimensional winner view (22+ tuples laid out so the best stands out). Flat table is okay for the 5-row fixture, not for the target 22+ tuples.
2. **No net-APY column** — gross APY only, missing `gross − annualized(gas + bridge_fee) / holding_period`. Net APY is the rotation decision variable per legacy `multi-chain-lending-yield.md §Rotation logic`; without it the operator is rotating on wrong signal.
3. **No "current position" highlight** — the row where capital is deployed right now is not visually distinguished from candidate rows.
4. **Inherits fixture gap** — only 5 `(protocol, chain)` tuples populated at [lib/mocks/fixtures/defi-lending.ts:6,32,40,48,56](../../../lib/mocks/fixtures/defi-lending.ts#L6) vs 22+ in the strategy universe. Operator cannot exercise the full rotation basket.

### 4c. `defi-transfer-widget` — execute: bridge/send leg · 🟡 partial

File: [components/widgets/defi/defi-transfer-widget.tsx](../../../components/widgets/defi/defi-transfer-widget.tsx)

Covers same-chain `send` and cross-chain `bridge` execution, matching the BRIDGE step of the rotation flow.

Gaps:

1. **Hardcoded `strategy_id: "AAVE_LENDING"` at [defi-transfer-widget.tsx:220](../../../components/widgets/defi/defi-transfer-widget.tsx#L220)** (send path) and **`"CROSS_CHAIN_SOR"` at [defi-transfer-widget.tsx:387](../../../components/widgets/defi/defi-transfer-widget.tsx#L387)** (bridge path). Same per-instance attribution break as 4a. **Blocker.**
2. **No bridge-transit monitor** — bridge tx is fire-and-forget; in-flight bridges between legs of a rotation are where capital is "temporarily illiquid" (multi-chain-lending §Margin & Liquidation). Missing widget — captured in 6a.
3. **Route preview is decent but no trust-score column** — Socket returns multiple routes with differing security profiles; the widget should surface this per route.

### 4d. `defi-swap-widget` — execute: intra-family swap leg · ✅

File: [components/widgets/defi/defi-swap-widget.tsx](../../../components/widgets/defi/defi-swap-widget.tsx)

Fits the intra-family swap requirement (USDT→USDC etc) when the operator holds the wrong member of a family:

- Chain selector, token in/out, reverse button at [defi-swap-widget.tsx:87-150](../../../components/widgets/defi/defi-swap-widget.tsx#L87-L150)
- SOR algo select (`SOR_DEX`, `SOR_TWAP`, `SOR_CROSS_CHAIN`) at [defi-swap-widget.tsx:190-204](../../../components/widgets/defi/defi-swap-widget.tsx#L190-L204)
- Per-venue split table (alloc%, fill price, impact bps, fee, gas) at [defi-swap-widget.tsx:261-339](../../../components/widgets/defi/defi-swap-widget.tsx#L261-L339)

Gap:

1. **Hardcoded mode-based `strategy_id` at [defi-swap-widget.tsx:348](../../../components/widgets/defi/defi-swap-widget.tsx#L348)** (`BASIS_TRADE` / `STAKED_BASIS` / `AAVE_LENDING`) — same per-instance break. **Blocker shared with 4a, 4c.**
2. **No `min_apy_improvement_bps` gate** — the widget doesn't know it's being used for a rotation sub-step; operator can swap into worse-APY token. This is acceptable (gate lives at rotation-orchestrator layer, not swap widget).

### 4e. `defi-wallet-summary-widget` — support: per-chain balances · ✅

File: [components/widgets/defi/defi-wallet-summary-widget.tsx](../../../components/widgets/defi/defi-wallet-summary-widget.tsx)

Adequate for the support bucket: per-chain native + asset balances, gas-low flags, rebalance trigger button. No changes needed for rotation scope beyond ensuring all `chains_eligible` chains appear.

### 4f. `defi-yield-chart-widget` — monitor: APY time-series · ✅

File: [components/widgets/defi/defi-yield-chart-widget.tsx](../../../components/widgets/defi/defi-yield-chart-widget.tsx)

Same "vs Ethena" baseline nit applies as in YIELD_STAKING_SIMPLE audit — the comparison baseline is hard-coded; should be configurable per archetype (e.g. "vs Aave V3 Ethereum USDC" for lending instances). Otherwise usable.

### 4g. `defi-waterfall-weights-widget` — partial fit for `(protocol, chain)` distribution · ➖

File: [components/widgets/defi/defi-waterfall-weights-widget.tsx](../../../components/widgets/defi/defi-waterfall-weights-widget.tsx)

Two-pillar display (coin → venue weight). Conceptually parallel to the needed `(protocol, chain)` distribution view but wired to coin_weights / venue_weights — would need data-model adaptation or a sibling component. Closer to a reference pattern than a drop-in.

### 4h. `defi-reward-pnl-widget` — partial fit for reward-token accrual · 🟡

File: [components/widgets/defi/defi-reward-pnl-widget.tsx](../../../components/widgets/defi/defi-reward-pnl-widget.tsx)

Current factor names (`staking_yield`, `restaking_reward`, `seasonal_reward`, `reward_unrealised`) are staking-focused. Lending reward tokens (AAVE, COMP, MORPHO) don't map to these labels cleanly. Per [cross-cutting/reward-lifecycle.md](../../../../unified-trading-pm/codex/09-strategy/cross-cutting/reward-lifecycle.md) reward accrual is a shared concern — this widget should generalize factor labels per instance metadata, not archetype-specific.

### 4i. Fixture coverage — 🟡 blocker

File: [lib/mocks/fixtures/defi-lending.ts](../../../lib/mocks/fixtures/defi-lending.ts) (62 lines)

Only 5 of 22+ `(protocol, chain)` tuples populated:

- `AAVEV3-ETHEREUM`, `MORPHO-ETHEREUM`, `COMPOUNDV3-ETHEREUM`, `AAVEV3-ARBITRUM`, `KAMINO-SOLANA`

Missing (archetype-required): Aave on Optimism / Polygon / Avalanche / Base; Compound on Arbitrum / Optimism / Polygon / Base / Scroll; Morpho on Base / Arbitrum / Optimism / Polygon / Scroll; Euler on Ethereum. Without these the rotation decision cannot be exercised in UI — any APY heatmap or rotation workflow renders against a 5-cell universe. **Blocker for §7 verification checklist.**

---

## 5. Codex updates proposed

Minimal — v2 archetype doc is already well-scoped. Two adds:

1. **Add a line under §Kill switches** in [yield-rotation-lending.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/yield-rotation-lending.md) making "Chainlink oracle divergence" an explicit kill-switch (tiered 1-2% warn, 2-3% reduce, >3% emergency exit). Legacy `aave-lending.md §Oracle Handling` has this; v2 archetype doc doesn't call it out.
2. **Add explicit non-scope note**: "Leveraged variants (supply-collateral → borrow stablecoin → re-supply) from legacy `btc-lending-yield` and `sol-lending-yield` are CARRY_RECURSIVE_STAKED, not this archetype." Prevents the same scope question recurring across audits.

No schema/config changes needed.

---

## 6. Gaps summary

### 6a. Blockers (must-fix before archetype is UI-complete)

1. **Hardcoded `strategy_id` in 3 widgets** ([defi-lending-widget.tsx:259](../../../components/widgets/defi/defi-lending-widget.tsx#L259), [defi-transfer-widget.tsx:220,387](../../../components/widgets/defi/defi-transfer-widget.tsx#L220), [defi-swap-widget.tsx:348](../../../components/widgets/defi/defi-swap-widget.tsx#L348)) — replace with active strategy-instance id from context. Same pattern as YIELD_STAKING_SIMPLE blocker; fix propagates to all DeFi archetypes.
2. **Fixture `(protocol, chain)` coverage** — expand [lib/mocks/fixtures/defi-lending.ts](../../../lib/mocks/fixtures/defi-lending.ts) from 5 to 22+ tuples covering Aave/Compound/Morpho on Ethereum + 4 L2s + Polygon/Avalanche, plus Euler on Ethereum. Without this the rotation exercise has no universe.
3. **No APY heatmap widget** — rotation decision surface missing. Candidate: new `defi-apy-heatmap-widget` with `(protocol × chain)` grid, color-coded net-APY, winner highlight, current-position badge. **P0.**

### 6b. Enhancement wishlist

1. **Rotation-workflow composite widget** — single reviewable "WITHDRAW → BRIDGE → LEND" sequence. Candidate: `defi-rotation-workflow-widget`. **P1.**
2. **Bridge-transit monitor** — list of in-flight bridges with ETA and status. Candidate: `defi-bridge-transit-widget`. **P1.**
3. **Stablecoin depeg monitor** — `abs(1.0 − price)` per active supply asset with tiered action zones. Shared with LST depeg concern. Candidate: `defi-peg-monitor-widget` (generalized to cover LSTs too). **P0.**
4. **Chainlink oracle-divergence monitor** — oracle vs market price delta, tiered alerts. Candidate: `defi-oracle-divergence-widget`. **P1.**
5. **Rebalance-cost tracker** — cumulative gas+bridge fees vs cumulative yield improvement since inception. Tells operator whether rotation is paying for itself. **P2.**
6. **Approve-status matrix** — per `(protocol, chain, asset)` approval state. **P2.**
7. **`defi-rates-overview-widget` net-APY column** — add `gross_apy - annualized(gas + bridge_fee)/holding_period` column; highlight current position. **P1 (cheap, correct decision surface).**
8. **`defi-reward-pnl-widget` factor generalization** — pull factor names from instance metadata rather than hardcoded staking labels so lending reward tokens (AAVE/COMP/MORPHO) map cleanly. **P2.**
9. **`defi-yield-chart-widget` configurable baseline** — comparison baseline per archetype instance, not a hardcoded "vs Ethena". Shared nit with YIELD_STAKING_SIMPLE. **P2.**

---

## 7. Verified-in-browser checklist

Golden-path scenarios to run once blockers 6a.1–6a.3 land. Until then, marked **BLOCKED**.

1. **BLOCKED** — Browse `/trading/defi` with `YIELD_ROTATION_LENDING@aave-multichain-usdc-prod` active; APY heatmap renders a 22+ tuple grid with winner highlighted, current position badged.
2. **BLOCKED** — Operator clicks winner tuple → rotation workflow opens → reviews WITHDRAW (source), BRIDGE (Socket preview), LEND (target) legs → submits once → all 3 emitted orders carry `strategy_id: "YIELD_ROTATION_LENDING@aave-multichain-usdc-prod"`.
3. **PARTIAL** — Manual LEND via `defi-lending-widget` to Aave V3 Ethereum USDC; order emits with correct instance id (currently emits `"AAVE_LENDING"` — blocker 6a.1).
4. **PARTIAL** — Manual BRIDGE via `defi-transfer-widget` Ethereum→Arbitrum USDC; order emits with instance id (currently `"CROSS_CHAIN_SOR"` — blocker 6a.1).
5. **BLOCKED** — Intra-family swap (hold USDT, target needs USDC) via `defi-swap-widget` pre-step; gated by `min_apy_improvement_bps`.
6. **BLOCKED** — Stablecoin depeg monitor shows `abs(1 - price)` per active asset; at `0.6%` the row color-shifts to warn; at `1.1%` the "reduce exposure" affordance appears.
7. **BLOCKED** — Chainlink oracle divergence at `2.5%` surfaces emergency-exit CTA that routes into `defi-lending-widget` WITHDRAW with `max` preset.
8. ✅ — Per-chain wallet balance + gas-low warnings render in `defi-wallet-summary-widget` for all `chains_eligible` chains.
9. ✅ — APY time-series renders 30/60/90d in `defi-yield-chart-widget` for active tuple.
10. **PARTIAL** — P&L waterfall per instance renders supply-yield − gas − bridge − reward contributions (reward-token factors miss `AAVE/COMP/MORPHO` labels — 6b.8).
11. **BLOCKED** — Full-exit workflow iterates all active tuples → WITHDRAW → BRIDGE back to base chain → aToken/cToken balances → 0 → consolidated idle balance visible.

---

## 8. Open questions for user

1. **Rotation workflow composite placement** — build a new composite widget orchestrating WITHDRAW/BRIDGE/LEND, or extend `defi-lending-widget` with an "auto-rotate" mode that consumes the heatmap winner? Composite is cleaner separation; extension reuses review UX.
2. **APY heatmap scope** — separate per-asset-family (stablecoin heatmap, BTC heatmap, ETH heatmap) or single heatmap with asset-family filter? Single-with-filter uses less screen real estate; separate makes winner more obvious.
3. **Depeg monitor reuse** — one generalized `defi-peg-monitor-widget` (covers USDC/USDT/DAI peg, stETH/rETH/weETH peg, wBTC peg) or separate widgets per family? Generalized matches the cross-cutting nature; separate fits archetype boundary discipline.
4. **Bridge-transit persistence** — should in-flight bridges survive page reload and operator-switch (server-side tracked) or is local-only acceptable for MVP? Rotations that cross chains are multi-minute; losing visibility mid-flight is bad.
5. **Euler + additional Compound/Morpho chains** — are these in scope for Phase-1 fixture expansion or defer until backend actually connects to them? Fixture can list them before backend but we should decide the fake-data discipline.
