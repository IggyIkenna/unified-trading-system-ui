---
archetype: CARRY_BASIS_PERP
status: draft-awaiting-review
---

# CARRY_BASIS_PERP — Widget Audit

## 1. Archetype summary

**Thesis:** Long spot + short perpetual future. Capture the funding rate paid by perp longs to perp shorts (when perp > spot) while staying delta-neutral. Hold while funding is above entry threshold; rotate venue/coin when a better funding rate appears; exit when funding decays past the exit threshold.

**Position shape:** Two legs per instance: `spot (long) | perp (short)`. Size is matched (`|spot| ≈ |perp|`). ATOMIC when spot + perp live on the same venue (e.g. Binance cross-margin netting — the flagship capital-efficiency case); LEADER_HEDGE when cross-venue (e.g. Uniswap spot + Hyperliquid perp). Multi-coin variants rotate across eligible assets based on funding ranking.

**P&L drivers:**

- **Funding P&L:** `funding_rate × notional × holding_period` (the primary alpha; funding tick is 1 h on Drift, 8 h on Hyperliquid/Binance/OKX/Bybit — see legacy sol-basis + basis-trade docs)
- **Basis-change P&L:** mark-to-market of (perp premium − entry premium); tends to zero on perpetuals
- **Execution alpha:** vs benchmark on swap + perp fills
- **Fees + slippage + gas** (entry + exit)

**Kill switches (archetype + legacy):**

- Funding flips negative past hold threshold (`exit_funding_rate_bps`, typically 20 bps)
- Delta drift > critical band (`>10%` in legacy) → emergency exit
- Spot/perp spread widens beyond historical norm (basis blow-out)
- Venue outage (Hyperliquid / CEX circuit breaker)
- Wrapped-BTC depeg when spot leg is WBTC/cbBTC (`wbtc_premium < -1%` in legacy btc-basis; not applicable to native-ETH/SOL spot legs)

**UI-visible config knobs:** `spot_venue`, `spot_instrument`, `perp_venue`, `perp_instrument`, `target_funding_rate_bps`, `exit_funding_rate_bps`, `delta_hedge_rebalance_pct`, `max_allocated_equity_pct`, `share_class` (USDT / ETH / BTC), `exploit_venue_netting` (bool — enables single-venue cross-margin).

**Sources:**

- v2 SSOT: [architecture-v2/archetypes/carry-basis-perp.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-basis-perp.md)
- Legacy (reference only): [defi/basis-trade.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/basis-trade.md) · [defi/btc-basis-trade.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/btc-basis-trade.md) · [defi/l2-basis-trade.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/l2-basis-trade.md) · [defi/sol-basis-trade.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/sol-basis-trade.md) · [defi/ethena-benchmark.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/ethena-benchmark.md) (benchmark-only)

**Scope clarifications — what is NOT in this archetype:**

- **Staked underlying (stETH / weETH) as spot leg** with a perp hedge → `CARRY_STAKED_BASIS`. This audit treats the spot leg as native asset (ETH, WBTC/cbBTC, SOL) only.
- **Recursive / leveraged loops** (supply LST → borrow → re-supply, hedged by perp) → `CARRY_RECURSIVE_STAKED`.
- **Dated / expiry-based basis** (e.g. CME BTC future vs spot) → `CARRY_BASIS_DATED`.
- **Cross-venue perp-funding arbitrage** (no paired spot, just two perps) → `ARBITRAGE_PRICE_DISPERSION`.
- **Stacked-yield variant on BTC basis** (legacy btc-basis step 1b: supply WBTC → Aave for aWBTC yield on top of funding) — legacy doc flags this as optional; under v2 it blurs into `CARRY_STAKED_BASIS` (aWBTC is yield-bearing). Flagged as open question §8.
- **Ethena sUSDe benchmark** is preserved per MIGRATION §2 as a reference, not a deployed instance — no widget work required beyond naming the comparator.

## 2. Concrete strategies in this archetype

Per [MIGRATION.md §2 + §8](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md), 4 legacy basis docs + 1 benchmark consolidate into `CARRY_BASIS_PERP`:

| Legacy doc                 | Scope                                                                                   | v2 Example Instance                                                                    | Notes                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `defi/basis-trade.md`      | Generic ETH spot + Hyperliquid perp; multi-venue perp weighting already wired in legacy | `CARRY_BASIS_PERP@uniswap-hyperliquid-eth-usdt-prod`, `@multi-cex-eth-usdt-prod`       | Two-waterfall weighting (coin × venue) and multi-venue perp are already implemented in legacy — v2 preserves + generalizes |
| `defi/btc-basis-trade.md`  | WBTC/cbBTC spot + Hyperliquid BTC-PERP; optional Aave stacked supply                    | `CARRY_BASIS_PERP@uniswap-hyperliquid-btc-usdt-prod`, `@coinbase-deribit-btc-usd-prod` | Stacked-supply variant is staked-basis territory (flagged §8); depeg monitor for wrapped-BTC required                      |
| `defi/l2-basis-trade.md`   | Same as ETH basis but DEX leg on Arbitrum / Base                                        | `CARRY_BASIS_PERP@uniswap-arbitrum-hyperliquid-eth-usdt-prod`                          | Chain-select for spot leg; ~200× gas reduction vs mainnet                                                                  |
| `defi/sol-basis-trade.md`  | SOL spot (Jupiter) + Drift SOL-PERP                                                     | `CARRY_BASIS_PERP@kamino-drift-sol-usdc-prod`                                          | 1 h funding ticks (vs 8 h CEX); Solana-native wallet                                                                       |
| `defi/ethena-benchmark.md` | Passive buy-and-hold sUSDe — reference only                                             | (benchmark, not a deployed instance)                                                   | Preserved as comparator in codex, not audited as an active surface                                                         |

**Archetype doc §Example instances** lists 7:

```text
Single-venue netted:
  CARRY_BASIS_PERP@binance-btc-usdt-prod
  CARRY_BASIS_PERP@okx-eth-usdt-prod
  CARRY_BASIS_PERP@bybit-sol-usdt-prod

Cross-venue:
  CARRY_BASIS_PERP@uniswap-hyperliquid-eth-usdt-prod
  CARRY_BASIS_PERP@coinbase-deribit-btc-usd-prod
  CARRY_BASIS_PERP@uniswap-arbitrum-hyperliquid-eth-usdt-prod

Multi-coin rotation:
  CARRY_BASIS_PERP@binance-multicoin-usdt-prod                 (auto-rotate BTC/ETH/SOL)
```

**Supported venues — two classes:**

- **Single-venue netted (max capital efficiency):** Binance spot+perp, OKX spot+perp, Bybit spot+perp. Cross-margin netting means the spot long collateralizes the perp short — tiny margin footprint, ATOMIC entry/exit.
- **Cross-venue pair:** Uniswap/Coinbase spot + Hyperliquid/Deribit/Drift perp; L2 spot (Uniswap Arbitrum) + CEX perp. LEADER_HEDGE entry; capital locked on both sides.

Assets covered across instances: BTC, ETH, SOL primary; top-10 alts occasionally (DOGE/ARB/AVAX/LINK/OP appear in the funding-matrix fixture).

---

## 3. UI capability requirements

Grouped by **execute · monitor · support · exit**. Each capability must be fulfillable via UI so operators can manually trade each instance and thereby verify backend wiring.

### 3a. Execute

- **Select instance form:** `spot_venue` + `perp_venue` + `asset`. Options must respect the single-venue-netted vs cross-venue distinction (netting is a first-class config knob, not an inferred side-effect).
- **ENTRY workflow (paired):** emits 2 or 3 instructions depending on topology:
  - Single-venue netted (ATOMIC): one batch `BUY spot + SELL perp` on the same venue (Binance cross-margin)
  - Cross-venue (LEADER_HEDGE): `SWAP USDT→asset` on DEX + `TRANSFER USDC margin → perp venue` + `SELL perp` on perp venue — sequential with leader-hedge guarantee
- **EXIT workflow (paired):** mirror of entry. ATOMIC unwind on same venue; sequential `CLOSE perp → SWAP asset → USDT` cross-venue.
- **Hedge-ratio input** (default 100 %) — operator override for delta tilt (ETH/BTC share classes intentionally hold non-zero delta)
- **Capital amount** with 25/50/75/100% helpers relative to idle USDT balance
- **Max slippage bps** (swap leg only — perp CLOB uses limit/market explicitly)
- **Venue-weighting picker** (multi-venue perp instances only): proportional-to-funding vs EQUAL — matches the legacy two-waterfall weighting (see legacy basis-trade §Two-Waterfall Weighting)
- **Strategy instance tag** on every emitted order (SWAP, TRANSFER, TRADE) must match the active instance id (e.g. `CARRY_BASIS_PERP@uniswap-hyperliquid-eth-usdt-prod`) — not a generic `"BASIS_TRADE"` string.
- **REBALANCE action** when delta drift crosses the warn band (2 %) or major band (5 %) — adjust perp size only (cheaper than re-swapping spot)
- **MIGRATE workflow** (multi-coin / multi-venue rotation): close old (coin, venue) pair → open new — sequential, reviewable, not atomic

### 3b. Monitor

- **Funding-rate matrix:** `(coin × perp venue)` grid with live bps; highlights best venue per coin and greys rows below the `target_funding_rate_bps` floor. This is **the** primary monitor for this archetype.
- **Funding-rate time-series per instance** — 30/60/90 d chart showing entry threshold, exit threshold, and current rate (when it will cross into exit zone).
- **Basis spread (bps)** per instance — current perp − spot premium; overlay on funding chart so operators see when spread widens into kill-switch territory.
- **Delta drift** — `(|spot_exposure + perp_exposure|) / notional`; color-coded against 2 %/5 %/10 % bands (warn/major/critical per legacy `defi_base.py:_parse_thresholds`).
- **Per-leg position sizes** — spot amount + perp notional + net delta, segmented by instance.
- **Margin utilization on perp venue** — critical: under cross-margin netting this sits on a single account; cross-venue setups have separate margin per venue. Highlight liquidation distance.
- **Cumulative funding collected** — per instance; running total since inception. Legacy basis-trade calls this a "Funding collection timeline" (8 h settlement markers).
- **P&L decomposition** — `funding_pnl | basis_spread_pnl | trading_pnl | fees | gas`. Each component is a distinct lifecycle factor (not a staking reward).
- **Wrapped-BTC premium monitor** (BTC instances only) — `wbtc_premium_bps`; kill-switch at −100 bps per legacy btc-basis-trade.md §Rebalancing.
- **Multi-venue weighting view** — two-pillar bar chart: Pillar 1 (coin weight by avg funding) + Pillar 2 (venue weight within coin). Matches the legacy basis-trade two-waterfall model and is already partly wired today.

### 3c. Support

- **Per-chain wallet balance** — USDT on spot chain (ETH mainnet, Arbitrum, Base, Solana); margin-collateral tokens (USDC for Hyperliquid, USDT for Binance/OKX/Bybit, per legacy §Venue Collateral).
- **Venue-collateral pre-check** — USDT→USDC swap required for Hyperliquid (see legacy basis-trade.md §Venue Collateral). Widget must flag and auto-chain the pre-swap before TRANSFER.
- **Transfer / bridge to perp venue** — deposit USDC margin on Hyperliquid / USDT margin on Binance/OKX/Bybit. Existing transfer widget handles this.
- **Gas-token balance** per chain + gas-low warning (blocks execution).
- **Margin health ticker per perp venue** — initial margin requirement + maintenance margin; alert at >80 % usage (legacy Hyperliquid threshold).
- **Instance-scoped treasury view** — idle USDT awaiting deploy vs deployed notional per instance; rebalance preview when `react_to_equity_change` fires.

### 3d. Exit

- **Full exit** — close perp(s) → swap asset back → withdraw margin → consolidate. ATOMIC on single-venue-netted; sequential cross-venue. Per legacy basis-trade §Exit Workflow.
- **Single-leg exit** — close just one perp venue (e.g. Hyperliquid goes offline; keep Binance+OKX shorts + full spot).
- **Rotation exit** (migrate) — close current (coin, venue) → open new (coin, venue) atomically-as-possible; preview expected funding delta vs migration cost (the same cost-benefit gate in legacy basis-trade.md §Rebalance Cost-Benefit: `expected_benefit > rebalance_cost * 1.5`).
- **Emergency exit** — overrides sequencing to close as fast as possible; reachable from:
  - funding-matrix when all active venues flip below exit threshold
  - delta-drift monitor at >10 % critical
  - basis-spread monitor at historical-tail widening
  - wrapped-BTC depeg monitor at <−100 bps
- **Exit confirmation** — spot balance returns to USDT, perp balance → 0, margin withdrawn from perp venue, P&L attribution finalizes.

---

## 4. Widget-by-widget verification

Legend: ✅ fits · 🟡 partial · ❌ missing / wrong shape · ➖ tangential

### 4a. `defi-basis-trade-widget` — primary execute surface · 🟡 partial

File: [components/widgets/defi/defi-basis-trade-widget.tsx](../../../components/widgets/defi/defi-basis-trade-widget.tsx)

What it does today:

- Asset select (ETH/BTC/SOL, from `basisTradeAssets`) at [defi-basis-trade-widget.tsx:117-132](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L117-L132)
- Capital / slippage-bps / hedge-ratio inputs at [defi-basis-trade-widget.tsx:136-173](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L136-L173)
- Operation toggle `SWAP | TRADE | BOTH` at [defi-basis-trade-widget.tsx:176-194](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L176-L194)
- Strategy-metrics panel (expected output, margin usage, funding APY, cost of carry, net APY, breakeven funding) at [defi-basis-trade-widget.tsx:199-267](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L199-L267)
- In-widget trade history with per-trade funding / margin / basis / PnL at [defi-basis-trade-widget.tsx:283-311](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L283-L311)

Gaps vs archetype requirements:

1. **Hardcoded `strategy_id: "BASIS_TRADE"` at [defi-basis-trade-widget.tsx:90](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L90)** — every emitted order carries the venue-shaped id regardless of which instance is active. All 7 example instances (`@uniswap-hyperliquid-eth-usdt-prod`, `@kamino-drift-sol-usdc-prod`, `@binance-multicoin-usdt-prod`, etc.) collapse to the same tag. Same blocker class as [yield-rotation-lending.md §6a.1](./yield-rotation-lending.md). **Blocker.**
2. **No explicit `spot_venue` / `perp_venue` pickers.** The archetype's defining axis is the (spot, perp) pair — Binance-netted vs Uniswap+Hyperliquid vs Coinbase+Deribit. Today only `asset` is a control, and venue is implicit via the fixture's `spotVenues` / `perpVenues` arrays (see §4i). Operator cannot express "I want single-venue netting on OKX" vs "I want Uniswap+Hyperliquid cross-venue".
3. **No single-venue-netted vs cross-venue toggle** (`exploit_venue_netting`) — this is a first-class config knob in the v2 archetype and drives whether entry is ATOMIC (one batch) or LEADER_HEDGE (two sequential legs). Today every emit is the same shape at [defi-basis-trade-widget.tsx:88-104](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L88-L104) regardless of topology.
4. **No entry/exit funding-threshold config** (`target_funding_rate_bps`, `exit_funding_rate_bps`) — the widget shows `Net APY` vs breakeven but never lets the operator see or override the archetype-level threshold. A trade is submitted whether or not the funding rate exceeds the entry threshold.
5. **No multi-venue perp weighting picker** (proportional-to-funding vs EQUAL) — legacy basis-trade doc §Two-Waterfall Weighting documents this and the fixture supports it (see §4f), but the execute widget doesn't expose it. Multi-coin rotation instances (`@binance-multicoin-usdt-prod`) cannot be driven from this widget.
6. **Margin-usage math is one-sided** — `calculateBasisTradeMarginUsage` at [lib/mocks/fixtures/defi-basis-trade.ts:85-91](../../../lib/mocks/fixtures/defi-basis-trade.ts#L85-L91) assumes 10% of capital to margin, 90% to spot. That's correct for cross-venue on Hyperliquid but wrong for single-venue netted (no separate margin allocation) and for btc-basis (15% margin per legacy btc-basis-trade.md §Token/Position Flow). Needs parameterization per topology.
7. **Hedge-ratio input exists but is unread** — value is parsed into `hedgeRatioNum` at [defi-basis-trade-widget.tsx:44](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L44) but never flows into `expectedOutput`, the emitted order, or the cost-of-carry calc. ETH / BTC share classes expect non-zero-delta intent; operator's input is lost.

### 4b. `defi-funding-matrix-widget` — monitor: the primary decision surface · ✅ well-fitting but fixture-limited

File: [components/widgets/defi/defi-funding-matrix-widget.tsx](../../../components/widgets/defi/defi-funding-matrix-widget.tsx)

What it does today:

- `(coin × venue)` table of annualized funding rates; best venue per coin underlined; greyed rows below floor at [defi-funding-matrix-widget.tsx:10-22](../../../components/widgets/defi/defi-funding-matrix-widget.tsx#L10-L22), [L94-113](../../../components/widgets/defi/defi-funding-matrix-widget.tsx#L94-L113)
- Per-venue average row at [defi-funding-matrix-widget.tsx:115-124](../../../components/widgets/defi/defi-funding-matrix-widget.tsx#L115-L124)
- Legend with kill-switch bands (>5% emerald, 2.5–5% amber, <2.5% grey) at [defi-funding-matrix-widget.tsx:128-139](../../../components/widgets/defi/defi-funding-matrix-widget.tsx#L128-L139)
- `FUNDING_RATE_FLOOR = 2.5` at [lib/config/services/defi.config.ts:143](../../../lib/config/services/defi.config.ts#L143) — matches legacy `min_funding_rate_annual: 0.025`

Gaps:

1. **Missing DEX spot-leg venues** — the fixture universe is CEX perps only (`HYPERLIQUID, OKX, BYBIT, BINANCE, ASTER` at [lib/config/services/defi.config.ts:140](../../../lib/config/services/defi.config.ts#L140)). Drift (SOL-basis perp venue) and Deribit (BTC cross-venue perp per archetype example) are absent. Operator cannot evaluate `@kamino-drift-sol-usdc-prod` or `@coinbase-deribit-btc-usd-prod` from the matrix.
2. **No "current position" highlight** — the row(coin)/column(venue) tuple where capital is actually deployed is not visually distinguished. Operator cannot spot "my active venue has drifted from best to second-best" at a glance.
3. **No target-threshold overlay** — entry threshold (80 bps / 8 %) and exit threshold (20 bps / 2 %) per archetype config are not rendered on the matrix. The greyed <2.5% band is a reasonable proxy but doesn't expose the two-threshold model.
4. **No drill-down to time-series** — clicking a cell should open a funding-rate chart for that (coin, venue) over 30/60/90 d so operator can see trend (is this temporary or sustained?). Today it's a static snapshot.

### 4c. `enhanced-basis-widget` — monitor: basis-trade opportunity dashboard · 🟡 partial

File: [components/widgets/defi/enhanced-basis-widget.tsx](../../../components/widgets/defi/enhanced-basis-widget.tsx)

What it does today:

- Per-pair table (pair, spot venue, perp venue, spot/perp price, basis bps, 8 h funding, annualized APY); best opportunity banner at top at [enhanced-basis-widget.tsx:122-178](../../../components/widgets/defi/enhanced-basis-widget.tsx#L122-L178)
- APY-driven row highlighting (>20 % APY = emerald tint) at [enhanced-basis-widget.tsx:154](../../../components/widgets/defi/enhanced-basis-widget.tsx#L154)

Gaps:

1. **Hardcoded spot/perp venue-label tables** at [enhanced-basis-widget.tsx:22-40](../../../components/widgets/defi/enhanced-basis-widget.tsx#L22-L40) — only 6 assets mapped (ETH, BTC, SOL, ARB, AVAX, LINK) and each locked to one spot venue + one perp venue. Single-venue-netted configurations (Binance spot + Binance perp) cannot be rendered. New instances require code edits, not config.
2. **No current-position badge / active-instance highlight** — the "Best Opportunity" banner is purely a market scan; it never says "and this is where you are deployed vs the best".
3. **No funding-only APY decomposition** — the APY column is pure funding-annualized; doesn't net out gas/fees/slippage. The archetype rotation decision is `funding − cost-of-rotation` (legacy basis-trade.md §Rebalance Cost-Benefit: `expected_benefit > rebalance_cost * 1.5`). Gross-APY sort can push operator into losing rotations.
4. **Direction column shows `LONG_SPOT` hardcoded** at [enhanced-basis-widget.tsx:53](../../../components/widgets/defi/enhanced-basis-widget.tsx#L53) — this archetype never inverts (spot is always long, perp always short), so it's technically correct but misleading-looking alongside sibling archetypes that may invert.

### 4d. `defi-waterfall-weights-widget` — monitor: two-pillar basis allocation · ✅ fits

File: [components/widgets/defi/defi-waterfall-weights-widget.tsx](../../../components/widgets/defi/defi-waterfall-weights-widget.tsx)

This widget is a direct implementation of the legacy basis-trade.md §Two-Waterfall Weighting model:

- **Pillar 1 — Coin allocation** (ETH/BTC/SOL/DOGE/AVAX/LINK with % of capital) rendered as horizontal bars at [defi-waterfall-weights-widget.tsx:62-93](../../../components/widgets/defi/defi-waterfall-weights-widget.tsx#L62-L93)
- **Pillar 2 — Venue weights within coin** drilldown (Hyperliquid/OKX/Bybit/Binance/Aster split)
- Fixture [lib/mocks/fixtures/defi-walkthrough.ts:56-91](../../../lib/mocks/fixtures/defi-walkthrough.ts#L56-L91) covers both default and Patrick-restricted allocations

Gaps (minor):

1. **`Patrick (restricted)` badge at [defi-waterfall-weights-widget.tsx:70](../../../components/widgets/defi/defi-waterfall-weights-widget.tsx#L70) is hardcoded** — the widget always shows a client-specific label regardless of the active instance. Should be driven by instance metadata.
2. **No link from weights → execute widget** — operator sees "Pillar 1 says rotate 10 % from DOGE to ETH" and must manually re-enter capital in `defi-basis-trade-widget`. A migrate-shortcut would close the loop.

### 4e. `defi-swap-widget` — execute: spot leg · 🟡 partial (shared widget)

File: [components/widgets/defi/defi-swap-widget.tsx](../../../components/widgets/defi/defi-swap-widget.tsx)

Serves the USDT→asset swap leg for cross-venue topologies (and the USDT→USDC pre-swap for Hyperliquid margin). Widget itself is solid — chain selector, SOR routes, venue-split table.

Gaps:

1. **Hardcoded mode-based `strategy_id` at [defi-swap-widget.tsx:348](../../../components/widgets/defi/defi-swap-widget.tsx#L348)** — branches on `isBasisTrade ? "BASIS_TRADE" : isStakedBasis ? "STAKED_BASIS" : "AAVE_LENDING"`. Basis-trade emissions are still mis-tagged at the archetype-id level. Same blocker class as 4a. Refer to [yield-rotation-lending.md §6a.1](./yield-rotation-lending.md). **Blocker.**
2. **No venue-collateral pre-check callout** — when the target perp venue is Hyperliquid, a USDT→USDC pre-swap is mandatory (legacy basis-trade.md §Venue Collateral). Widget doesn't surface this contingency; operator must know and sequence it manually.

### 4f. `defi-transfer-widget` — execute: margin-deposit leg · 🟡 partial (shared widget)

File: [components/widgets/defi/defi-transfer-widget.tsx](../../../components/widgets/defi/defi-transfer-widget.tsx)

Serves the USDC-margin → Hyperliquid and USDT-margin → Binance/OKX/Bybit transfer legs.

Gaps:

1. \*\*Hardcoded `strategy_id: "AAVE_LENDING"` / `"CROSS_CHAIN_SOR"` at [defi-transfer-widget.tsx:220, 387](../../../components/widgets/defi/defi-transfer-widget.tsx#L220) — same blocker class as 4a, 4e.
2. **No "deposit to perp venue" shortcut** — transfer to Hyperliquid/Binance/OKX/Bybit is the same generic flow as any other transfer. A basis-specific quick-action ("deposit 2k USDC margin to Hyperliquid for this instance") would compress the manual-trade workflow from 3–4 clicks to 1.

### 4g. `defi-rates-overview-widget` — monitor: ➖ tangential for this archetype

File: [components/widgets/defi/defi-rates-overview-widget.tsx](../../../components/widgets/defi/defi-rates-overview-widget.tsx)

Covers lending supply/borrow + staking + LP. Does **not** cover funding rates — rendering is limited to `lendingProtocols`, `stakingProtocols`, `liquidityPools` at [defi-rates-overview-widget.tsx:54](../../../components/widgets/defi/defi-rates-overview-widget.tsx#L54). That's correct scope for the sibling archetypes but means operators cannot see funding rates alongside other yield opportunities in one place. Funding-rate data is already in context (`fundingRates`); it just doesn't flow into this widget. Optional enhancement, not a blocker.

### 4h. `defi-yield-chart-widget` — monitor: P&L time-series · ✅ usable

File: [components/widgets/defi/defi-yield-chart-widget.tsx](../../../components/widgets/defi/defi-yield-chart-widget.tsx)

Same time-series surface as other archetypes. The `BASIS_TRADE` strategy-id line plots correctly when fixture data exists. Same "vs Ethena" baseline nit applies as in sibling audits — but for this archetype Ethena is actually the archetype doc's own reference benchmark ([MIGRATION.md §2](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md) and the [ethena-benchmark.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/ethena-benchmark.md) legacy doc), so the hardcoded comparator is **actually correct here** (for once). The nit is that the comparator should still be instance-configurable rather than globally fixed.

### 4i. `defi-reward-pnl-widget` — P&L decomposition · ❌ wrong factor labels

File: [components/widgets/defi/defi-reward-pnl-widget.tsx](../../../components/widgets/defi/defi-reward-pnl-widget.tsx)

Factor colors at [defi-reward-pnl-widget.tsx:9-14](../../../components/widgets/defi/defi-reward-pnl-widget.tsx#L9-L14) only cover `staking_yield | restaking_reward | seasonal_reward | reward_unrealised`. Basis-trade P&L factors are `funding_pnl | basis_spread_pnl | trading_pnl | transaction_costs` (per legacy basis-trade.md §PnL Attribution). No factor labels map. Widget silently omits basis P&L or mislabels it.

**Gap → action:** Either generalize this widget (factor names per instance metadata) — same action proposed under [yield-rotation-lending.md §6b.8](./yield-rotation-lending.md) — or build an archetype-specific `defi-basis-pnl-widget` with funding-vs-basis-vs-costs breakdown.

### 4j. `defi-strategy-config-widget` — config surface · 🟡 partial

File: [components/widgets/defi/defi-strategy-config-widget.tsx](../../../components/widgets/defi/defi-strategy-config-widget.tsx)

Schema-driven config form for DeFi strategies, including `BASIS_TRADE` via `DEFI_STRATEGY_SCHEMAS`. Share-class toggle (USDT/ETH/BTC) at [defi-strategy-config-widget.tsx:138-152](../../../components/widgets/defi/defi-strategy-config-widget.tsx#L138-L152) matches legacy basis-trade.md §Share Class. Risk-indicator panel at [defi-strategy-config-widget.tsx:211-217](../../../components/widgets/defi/defi-strategy-config-widget.tsx#L211-L217) shows `Oracle Depeg / Borrow-Staking Spread / USDT Peg / Withdrawal Delay / Rebalance Cost / Full Close Cost`.

Gaps for this archetype:

1. **Risk-indicator panel is weETH-recursive specific** — `Oracle Depeg (weETH/ETH)`, `Borrow-Staking Spread`, `Withdrawal Delay (ether.fi)` at [defi-strategy-config-widget.tsx:212-215](../../../components/widgets/defi/defi-strategy-config-widget.tsx#L212-L215) are meaningless for a basis-trade instance. When `BASIS_TRADE` is selected the panel should surface `Funding regime (last 24h), Basis spread (bps), Delta drift, Margin utilization, WBTC premium (btc-basis only)` instead.
2. **Client-restrictions panel is hardcoded "HyperLiquid crossed out, OKX/Bybit/Binance allowed, ETH only"** at [defi-strategy-config-widget.tsx:188-204](../../../components/widgets/defi/defi-strategy-config-widget.tsx#L188-L204) — matches the Patrick client pattern only; doesn't reflect the active instance's `allowed_perp_venues`.

### 4k. `defi-wallet-summary-widget` — support: per-chain balances · ✅

File: [components/widgets/defi/defi-wallet-summary-widget.tsx](../../../components/widgets/defi/defi-wallet-summary-widget.tsx)

Per-chain portfolio + gas-low warnings work as-is for cross-venue basis topologies (Ethereum / Arbitrum / Base / Solana). No changes needed beyond ensuring the `chains_eligible` for an instance are all represented.

### 4l. `accounts-margin-util-widget` — support: perp-venue margin · ➖ exists but scope-adjacent

File: [components/widgets/accounts/accounts-margin-util-widget.tsx](../../../components/widgets/accounts/accounts-margin-util-widget.tsx)

Reads `venueMargins` from the accounts context. The data shape is the right shape (per-venue IMR/MMR), but the widget lives on the accounts/ surface and is not surfaced in the DeFi basis-trade layout today. For cross-margin-netted instances (Binance/OKX/Bybit) this is the **single most important** risk panel — liquidation-distance monitoring. Needs to be composable into the basis-trade surface (not rebuilt), or a basis-specific wrapper that filters to the instance's perp venue(s).

### 4m. Fixture coverage — 🟡 thin

Files: [lib/mocks/fixtures/defi-basis-trade.ts](../../../lib/mocks/fixtures/defi-basis-trade.ts) + [lib/mocks/fixtures/defi-walkthrough.ts:41-50](../../../lib/mocks/fixtures/defi-walkthrough.ts#L41-L50) (funding-rate matrix).

- **Basis-trade fixture:** 3 of ~10 assets covered (ETH/BTC/SOL at [defi-basis-trade.ts:15](../../../lib/mocks/fixtures/defi-basis-trade.ts#L15)); single spot venue per asset; single perp venue (Hyperliquid) at [defi-basis-trade.ts:21](../../../lib/mocks/fixtures/defi-basis-trade.ts#L21). None of the 7 archetype example instances are explicitly modeled:
  - No Drift perp (SOL-basis instance can't be simulated)
  - No Deribit perp (BTC cross-venue instance can't be simulated)
  - No Binance/OKX/Bybit spot+perp netting setup (single-venue-netted class of instances invisible)
  - No L2-chain tagging (Uniswap-Arbitrum vs Uniswap-Ethereum indistinguishable)
- **Funding-rate matrix fixture:** 8 coins × 5 CEX venues = 40 cells at [defi-walkthrough.ts:41-50](../../../lib/mocks/fixtures/defi-walkthrough.ts#L41-L50) — good breadth but missing Drift, Deribit, Aster-is-present-but-Drift-isn't. Enough to exercise the matrix widget in demo mode; insufficient to stress-test rotation across the full venue universe.
- **Typo in exported helper:** `calculateBreakenvenFundingRate` (not `calculateBreakevenFundingRate`) at [defi-basis-trade.ts:286](../../../lib/mocks/fixtures/defi-basis-trade.ts#L286). Consumer at [defi-basis-trade-widget.tsx:28](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L28) imports it as `calculateBreakevenFundingRate` via the data-context alias — low-risk but worth cleaning up.

### 4n. Missing coverage (no widget today)

| Capability (from §3)                                                                | Status                             | Proposed widget                                                                                                                          |
| ----------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Per-instance funding + basis time-series with threshold overlays                    | ❌ missing                         | **new:** `defi-basis-funding-chart-widget` (drill-down from funding matrix)                                                              |
| Delta-drift meter per instance (with 2/5/10 % bands)                                | ❌ missing                         | **new:** `defi-delta-drift-widget`                                                                                                       |
| Wrapped-BTC premium monitor (WBTC/BTC, cbBTC/BTC)                                   | ❌ missing                         | **new:** `defi-wrapped-btc-peg-widget` (generalizable with LST peg monitor → [yield-staking-simple.md §6b.3](./yield-staking-simple.md)) |
| Basis-specific P&L waterfall (funding / basis-spread / trading / costs)             | ❌ wrong factors today             | **enhance:** `defi-reward-pnl-widget` to drive factor labels from instance metadata (shared gap with yield-rotation-lending)             |
| Migration-preview composite (close old pair → open new pair with cost-benefit gate) | ❌ missing                         | **new:** `defi-basis-migrate-widget` (composite; accepts funding-matrix cell as input)                                                   |
| Per-perp-venue margin utilization scoped to active instance                         | 🟡 partial (accounts surface only) | **compose:** wrap `accounts-margin-util-widget` on the basis-trade layout and filter to instance's perp venues                           |

---

## 5. Codex updates proposed

Minimal — v2 archetype doc is already well-scoped. Two adds:

1. **Surface the venue-collateral contingency** in [carry-basis-perp.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-basis-perp.md) (§Execution semantics or §Supported venues). One line noting that Hyperliquid accepts USDC only → USDT margin requires a pre-swap. Legacy basis-trade.md §Venue Collateral has this; v2 silently drops it. Both backend and UI read the archetype doc as SSOT.
2. **Clarify BTC stacked-supply variant's archetype home.** Legacy btc-basis-trade.md §Token/Position Flow documents an optional `SUPPLY WBTC → Aave` step that makes the spot leg yield-bearing. v2 MIGRATION.md §2 maps btc-basis-trade.md to `CARRY_BASIS_PERP`, but a yield-bearing spot leg conceptually belongs in `CARRY_STAKED_BASIS`. Add a one-line note to the "Not in this archetype" section: "BTC stacked-supply variants (WBTC supplied to Aave for aWBTC yield under the perp hedge) belong to `CARRY_STAKED_BASIS`, not this archetype."

No schema/config changes needed.

---

## 6. Gaps summary

### 6a. Blockers (must-fix before archetype is UI-complete)

1. **Hardcoded `strategy_id` in 3 basis-touching widgets** — [defi-basis-trade-widget.tsx:90](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L90) (`"BASIS_TRADE"`), [defi-swap-widget.tsx:348](../../../components/widgets/defi/defi-swap-widget.tsx#L348) (mode-branched), [defi-transfer-widget.tsx:220, 387](../../../components/widgets/defi/defi-transfer-widget.tsx#L220) (`"AAVE_LENDING"` / `"CROSS_CHAIN_SOR"`). Same class of blocker as [yield-rotation-lending.md §6a.1](./yield-rotation-lending.md); fix propagates to every DeFi archetype.
2. **No `spot_venue` / `perp_venue` picker + no single-venue-netted vs cross-venue toggle** in the basis execute widget. The archetype's defining axis is the (spot, perp) pair plus the `exploit_venue_netting` boolean. Today the widget only exposes asset + operation. None of the 7 example instances can be manually dispatched with its actual topology.
3. **Fixture coverage for Drift + Deribit + single-venue-netted topologies.** The basis-trade fixture [lib/mocks/fixtures/defi-basis-trade.ts](../../../lib/mocks/fixtures/defi-basis-trade.ts) models one perp venue (Hyperliquid) and 3 assets. SOL-basis (Drift), BTC cross-venue (Deribit), and single-venue-netted (Binance/OKX/Bybit spot+perp) cannot be exercised. Without these, §7 scenarios are blocked.
4. **No basis-specific P&L decomposition.** `defi-reward-pnl-widget` factor labels are staking-coded (same gap as rotation-lending §6b.8). A basis instance's natural factors (funding / basis-spread / trading / costs) have no UI surface.

### 6b. Enhancements (high-value, non-blocking)

1. **Delta-drift monitor widget** (`defi-delta-drift-widget`) — per-instance drift meter with 2 / 5 / 10 % bands wired to the legacy `defi_base.py:_parse_thresholds` contract. Single most impactful risk surface this archetype lacks.
2. **Funding-threshold overlay on the funding matrix** — render the entry (`target_funding_rate_bps`) and exit (`exit_funding_rate_bps`) thresholds as columns/bands on `defi-funding-matrix-widget`; makes rotation signal obvious visually.
3. **Per-cell drilldown → time-series** on `defi-funding-matrix-widget` — clicking `(coin, venue)` opens a 30 / 60 / 90 d funding chart with threshold overlays. Proposed new widget `defi-basis-funding-chart-widget`.
4. **Wrapped-BTC premium monitor** (`defi-wrapped-btc-peg-widget`) — generalize with the LST-peg monitor proposed under [yield-staking-simple.md §6b.3](./yield-staking-simple.md) into a single `defi-peg-monitor-widget` covering WBTC/cbBTC + stETH/rETH/weETH + stablecoins.
5. **Migrate-workflow composite** (`defi-basis-migrate-widget`) — close-old → open-new sequence with the legacy cost-benefit gate (`expected_benefit > rebalance_cost * 1.5`) visible pre-submit. Multi-coin rotation instances (`@binance-multicoin-usdt-prod`) are operable only after this lands.
6. **Per-perp-venue margin-util composition on the basis-trade layout** — surface `accounts-margin-util-widget` filtered to the instance's active perp venue(s). For single-venue-netted setups this is the primary liquidation-distance panel.
7. **Venue-collateral pre-check in `defi-swap-widget`** — when target perp venue is Hyperliquid, callout USDT→USDC requirement inline instead of relying on operator knowledge.
8. **Risk-indicator panel in `defi-strategy-config-widget` driven by archetype** — for `BASIS_TRADE` show funding / basis / delta / margin / WBTC-premium, not the weETH-recursive indicators.
9. **Active-instance highlight on `enhanced-basis-widget` + `defi-funding-matrix-widget`** — mark the `(coin, venue)` tuple where capital is currently deployed.
10. **Hedge-ratio wired into execute calc + emitted order.** Currently parsed but ignored at [defi-basis-trade-widget.tsx:44](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L44).
11. **Fix `calculateBreakenvenFundingRate` typo** at [lib/mocks/fixtures/defi-basis-trade.ts:286](../../../lib/mocks/fixtures/defi-basis-trade.ts#L286). Cosmetic, not blocking.

---

## 7. Verified-in-browser checklist

Golden-path scenarios, to be run once blockers 6a.1–6a.3 land. Until then, marked **BLOCKED** or **PARTIAL**.

1. **PARTIAL** — Open basis trade widget, select ETH, input $100 k capital, submit BOTH → order emits with `strategy_id` matching `CARRY_BASIS_PERP@uniswap-hyperliquid-eth-usdt-prod` (currently emits `"BASIS_TRADE"` — blocker 6a.1).
2. **BLOCKED** — Same flow but select single-venue-netted Binance instance → one batch emit (ATOMIC) carrying both spot + perp legs (currently no topology toggle — blocker 6a.2).
3. **BLOCKED** — SOL-basis via Drift: select SOL + Drift perp → Jupiter swap leg + Drift perp order emit (Drift absent from fixture — blocker 6a.3).
4. **BLOCKED** — BTC cross-venue via Deribit: select BTC + Deribit perp (Deribit absent from fixture — blocker 6a.3).
5. ✅ — Open funding-matrix widget → 8×5 grid renders with best venue per coin underlined, below-floor cells greyed, venue averages in footer. Visually matches legacy two-waterfall expectation.
6. **PARTIAL** — Enter ETH-basis via spot widget, USDT→USDC pre-swap for Hyperliquid margin chained manually, USDC→Hyperliquid transfer, Hyperliquid short → all legs emit (today: legs emit but `strategy_id` is wrong on each).
7. **BLOCKED** — Delta drift at 6 % on an active instance → `defi-delta-drift-widget` shows major-band; clicking "Rebalance perp" emits adjust-size order (widget missing — 6b.1).
8. **BLOCKED** — Funding flips negative on Hyperliquid ETH → funding-matrix cell turns red; clicking opens migrate-preview to Binance (next-best); cost-benefit gate blocks migration if `expected_benefit < 1.5 × rebalance_cost` (migrate widget missing — 6b.5).
9. **BLOCKED** — P&L decomposition renders `funding / basis-spread / trading / costs` for a basis instance (today factor labels are staking-coded — 6a.4).
10. **PARTIAL** — Full-exit workflow on Hyperliquid ETH instance: close perp → swap ETH → USDT → withdraw margin → treasury restored. Legs all emit but instance-id is wrong (blocker 6a.1).
11. **BLOCKED** — WBTC depeg at −110 bps on a BTC basis instance → peg monitor flips to alert, emergency-exit CTA reachable (widget missing — 6b.4).
12. ✅ — Enhanced-basis widget renders per-pair table with "Best Opportunity" banner for ETH/BTC/SOL/ARB/AVAX/LINK. Works as-is for demo.

---

## 8. Open questions for user

1. **BTC stacked-supply variant scope.** Legacy [btc-basis-trade.md §Token/Position Flow](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/btc-basis-trade.md) documents an optional `SUPPLY WBTC → Aave` step on top of the perp hedge. V2 MIGRATION.md maps the whole doc to `CARRY_BASIS_PERP`, but a yield-bearing spot leg is conceptually `CARRY_STAKED_BASIS`. Should the stacked variant live here or migrate — and does `@uniswap-hyperliquid-btc-usdt-prod` exclude stacked-supply by default?
2. **Single-venue-netted vs cross-venue toggle placement.** Is `exploit_venue_netting` a widget-level control (operator picks per trade) or an instance-level config (fixed per instance id)? The archetype doc treats it as config; today's UI has no control at either level.
3. **Migrate-workflow composite widget.** Build a new composite (`defi-basis-migrate-widget` close-old → open-new with cost-benefit gate) or extend `defi-basis-trade-widget` with a migrate mode that consumes a funding-matrix cell? Composite is cleaner; extension reuses review UX. Same structural question we hit for rotation-lending (§8.1 there).
4. **Peg-monitor generalization.** Ship one `defi-peg-monitor-widget` covering WBTC/cbBTC + LST pegs + stablecoin pegs — or three archetype-specific widgets? Gen is cross-cutting-clean; separate is archetype-boundary-clean. Same question raised in [yield-rotation-lending.md §8.3](./yield-rotation-lending.md).
5. **Funding rate venue universe.** Should the fixture grow to cover Drift (SOL) + Deribit (BTC) + GMX (Arbitrum) for full archetype coverage, or defer to "when backend actually connects" and leave demo limited to HYPERLIQUID/OKX/BYBIT/BINANCE/ASTER? Matches the fake-data-discipline question from rotation-lending §8.5.
6. **Hedge-ratio UI intent.** The `defi-basis-trade-widget` hedge-ratio input exists but is unread. Intended to support ETH / BTC share-class partial-hedge policies (legacy basis-trade.md §Share Class `ETH → total_equity_in_eth` target). Is non-zero-delta a first-class operator choice or an instance-level config? Affects whether the field stays in the widget or moves to config.

---

_Status: draft — awaiting user review at §5a checkpoint before consolidating into central tracker and starting archetype #4._
