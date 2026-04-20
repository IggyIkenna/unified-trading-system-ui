---
archetype: YIELD_STAKING_SIMPLE
status: draft-awaiting-review
---

# YIELD_STAKING_SIMPLE — Widget Audit

## 1. Archetype summary

**Thesis:** Pure staking yield. Deposit native PoS asset (ETH, SOL) into a liquid-staking protocol, receive an LST (stETH, rETH, JitoSOL, mSOL), hold to earn validator rewards. No hedge, no leverage, no directional view. Passive held-to-earn.

**Position shape:** Single leg. `asset → LST` via selected protocol. `share_class` typically matches underlying (ETH share class for ETH-staked strategies, SOL for SOL-staked).

**P&L drivers:**

- Staking yield (~3.3–3.5% ETH, ~6–8% SOL) earned via LST rebase (stETH) or exchange-rate appreciation (rETH, JitoSOL, mSOL)
- No execution alpha (passive deposit/withdrawal)

**Kill switches:**

- LST depeg > threshold (e.g. 1%) — stETH depegged to ~0.94 in 2022
- Slashing / validator incident
- Protocol incident (hack, governance attack)

**UI-visible config knobs:** `staking_protocol`, `asset`, `share_class`, `exit_preference` (DEX_SWAP vs PROTOCOL_WITHDRAWAL), `max_allocated_pct`, `rebalance_cadence_days`.

**Sources:** [architecture-v2/archetypes/yield-staking-simple.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/yield-staking-simple.md) · [cross-cutting/reward-lifecycle.md](../../../../unified-trading-pm/codex/09-strategy/cross-cutting/reward-lifecycle.md) (only EtherFi+EigenLayer apply to this archetype; Lido/Rocket/Jito/Marinade have no separate reward tokens)

## 2. Concrete strategies in this archetype

Per [MIGRATION.md §2](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md): no legacy concrete doc exists — simple staking was previously implicit inside staked-basis. v2 extracts it as first-class for clients who want yield without basis complexity. Example instances from archetype doc §Example instances:

| Instance ID                                | Venue       | Asset → LST          | Chain    | APY   | Unbonding                                | Exit modes                           |
| ------------------------------------------ | ----------- | -------------------- | -------- | ----- | ---------------------------------------- | ------------------------------------ |
| `YIELD_STAKING_SIMPLE@lido-eth-prod`       | Lido        | ETH → stETH (rebase) | Ethereum | ~3.5% | 1–5 day queue                            | DEX swap OR Lido withdrawal queue    |
| `YIELD_STAKING_SIMPLE@rocketpool-eth-prod` | Rocket Pool | ETH → rETH (rate)    | Ethereum | ~3.3% | Via Rocket withdrawal                    | DEX swap OR Rocket withdrawal        |
| `YIELD_STAKING_SIMPLE@jito-sol-prod`       | Jito        | SOL → JitoSOL (rate) | Solana   | ~7–8% | Epoch-based (~2–3d)                      | Instant via Kamino OR slow unbonding |
| `YIELD_STAKING_SIMPLE@marinade-sol-prod`   | Marinade    | SOL → mSOL (rate)    | Solana   | ~6–7% | Instant-with-fee (~0.3%) OR free delayed | Marinade instant OR delayed          |

**Key distinction — rebase vs exchange-rate:**

- **Rebase (stETH):** LST balance grows (you get more tokens); 1 stETH ≈ 1 ETH always
- **Exchange-rate (rETH, JitoSOL, mSOL):** LST balance fixed; price vs underlying grows

This matters for P&L display (§3b below): rebase needs balance-delta tracking, exchange-rate needs price-delta tracking.

**Not deployed as single archetype today:** archetype doc notes simple staking was historically embedded in staked-basis. Production instances for pure-yield clients are the immediate target of v2 extraction.

---

## 3. UI capability requirements

Derived from v2 archetype doc (`architecture-v2/archetypes/yield-staking-simple.md`). Grouped by execute · monitor · support · exit. Each capability must be fulfillable through the UI so we can both take trades manually and verify the backend path is wired.

### 3a. Execute

- **Select protocol** among `LIDO | ROCKET_POOL | JITO | MARINADE` (chain auto-derived: Lido/Rocket → Ethereum; Jito/Marinade → Solana)
- **STAKE action** — deposit underlying (ETH/SOL), receive LST at protocol's exchange rate; respect `min_stake` (Lido/Rocket: 0, Marinade: 0.01 SOL, Jito: small min)
- **UNSTAKE action** (or SWAP via DEX) — driven by `exit_preference` (see §3d)
- **Amount entry** with percentage helpers (25/50/75/100% of available balance)
- **Share class assignment** — typically same as underlying (ETH share class for ETH strategies, SOL for SOL)
- **Strategy instance tag** on every emitted order — must match one of the 4 instance IDs (not a generic "ETHENA_BENCHMARK" tag regardless of protocol)
- **Max allocation cap** — `max_allocated_pct` enforced pre-submit (default 1.0 for pure staking)

Not in scope for this archetype:

- Reward-token claim/sell — Lido/Rocket/Jito/Marinade have no separate reward tokens per v2 archetype doc; reward-lifecycle only applies to EtherFi (ETHFI) + EigenLayer (EIGEN) which are different archetypes/compositions. If the concrete instance adds a second reward leg (e.g. Lido → EigenLayer restaking), that belongs in carry-staked-basis, not here.

### 3b. Monitor

- **Protocol APY per venue** — live, comparable across the 4 protocols
- **Current LST balance** per connected wallet + chain (stETH, rETH, JitoSOL, mSOL)
- **Accrued yield tracker** with rebase-vs-exchange-rate awareness:
  - **Rebase (stETH):** show balance-delta over time (`balance_now − balance_at_entry`) × ETH price
  - **Exchange-rate (rETH/JitoSOL/mSOL):** show `(rate_now − rate_at_entry) × balance × underlying_price`
- **TVL per protocol** (solvency / liquidity awareness; abnormal drop = kill-switch signal)
- **APY time-series chart** (30/60/90d) for historical yield trend per instance
- **Depeg monitor** — current LST/underlying spread in bps, vs kill-switch threshold (default 1% = 100 bps). This is **the** critical monitor for this archetype.
- **Peg history chart** — LST/underlying price over time; shows prior depeg episodes
- **Validator health / slashing alerts** — external signal from protocol (no widget fully owns this today, may be a gap)
- **P&L summary** — single factor `PNL_FACTOR_STAKING_YIELD` per v2 reward-lifecycle doc (base-LST yield is distinct from reward-token P&L factors)

### 3c. Support

- **Wallet balance** on strategy chain — ETH on Ethereum for Lido/Rocket, SOL on Solana for Jito/Marinade — with per-chain segmentation so user sees "enough native to stake on this chain"
- **Transfer / bridge** — move underlying onto strategy chain before first stake (user may hold ETH on Arbitrum, needs to bridge to mainnet for Lido)
- **Allocator-driven restake** — when `react_to_equity_change` fires, UI should show rebalance preview (target_staked diff) before committing. Per v2 archetype: `target_staked = new_equity * max_allocated_pct`
- **Rebalance cadence indicator** — `rebalance_cadence_days` (e.g. 30d) and countdown to next cycle; lets operator know when the strategy will next touch the position passively
- **Gas estimate** — EL/SOL gas preview for STAKE/UNSTAKE before submit
- **No cross-venue transfers** needed within this archetype (single-protocol, single-chain per instance); but the generic transfer widget is the support backbone for initial funding

### 3d. Exit

Driven by `exit_preference` config — two distinct paths:

- **DEX_SWAP exit:** market-sell LST → underlying via Uniswap (Ethereum) or Orca/Jupiter (Solana)
  - Fast, slippage cost (esp. on depeg — large stETH sells shift the peg)
  - Route preview (gas, slippage, price impact)
  - Optional: cap sell size to avoid self-caused depeg
- **PROTOCOL_WITHDRAWAL exit:** use protocol's withdrawal queue
  - Lido: 1–5 day queue
  - Rocket: Rocket withdrawal flow
  - Jito: epoch-based (~2–3d) OR instant via Kamino integration
  - Marinade: instant-with-fee (~0.3%) OR free delayed
- **Unbonding queue visualisation** — request-time, estimated completion, claimable-amount when matured
- **Emergency exit** — operator-forced close that overrides `exit_preference` to the fastest route (usually DEX_SWAP, even with slippage). Must be reachable from monitoring surface when kill-switch fires (e.g. depeg > threshold)
- **Position-closed confirmation** — LST balance returns to 0, underlying balance restored (less fees/slippage); final P&L attribution settles

---

## 4. Widget-by-widget verification

Legend: ✅ fits archetype · 🟡 partial / needs enhancement · ❌ does not serve this archetype · ➖ not applicable here

### 4a. Primary widgets (execute + monitor)

#### `defi-staking-widget` — 🟡 partial (execute)

File: [components/widgets/defi/defi-staking-widget.tsx](../../../components/widgets/defi/defi-staking-widget.tsx)

- ✅ Protocol dropdown, amount entry with 25/50/75/100% helpers ([L56-70](../../../components/widgets/defi/defi-staking-widget.tsx#L56-L70), [L82-94](../../../components/widgets/defi/defi-staking-widget.tsx#L82-L94))
- ✅ STAKE / UNSTAKE toggle ([L35-52](../../../components/widgets/defi/defi-staking-widget.tsx#L35-L52))
- ✅ APY + TVL + min-stake + unbonding readout ([L97-119](../../../components/widgets/defi/defi-staking-widget.tsx#L97-L119))
- 🟡 **Protocol coverage:** fixture at [lib/mocks/fixtures/defi-staking.ts:3-31](../../../lib/mocks/fixtures/defi-staking.ts#L3-L31) has only `LIDO-ETHEREUM`, `ETHERFI-ETHEREUM`, `ETHENA-ETHEREUM`. Missing **ROCKET_POOL, JITO, MARINADE** — 3 of the 4 example instances in the v2 archetype doc cannot even be selected. ETHERFI/ETHENA belong to other archetypes (carry-staked-basis / carry-basis-perp), not this one.
- 🟡 **`unbondingDays: 0` on every row** — masks the real exit cost for Lido (1–5 d queue) / Rocket (queue) / Jito (epoch ~2–3 d). User cannot see the true unbonding horizon before submitting STAKE.
- 🟡 **No `exit_preference` control** — UNSTAKE has no DEX_SWAP vs PROTOCOL_WITHDRAWAL toggle. For simple staking this is the defining exit knob (see §3d).
- ❌ **Hardcoded `strategy_id: "ETHENA_BENCHMARK"`** at [L129](../../../components/widgets/defi/defi-staking-widget.tsx#L129) regardless of selected protocol. Every submitted order is mis-tagged, breaking per-instance attribution. Must be replaced with the instance ID corresponding to the chosen protocol (`YIELD_STAKING_SIMPLE@lido-eth-prod`, etc.).
- ❌ **No rebase vs exchange-rate indicator** — user can't tell whether their LST accrues via balance growth (stETH) or price growth (rETH/JitoSOL/mSOL). This is the single most important UX distinction for monitor-phase expectations.
- ❌ **No `max_allocated_pct` preview / cap enforcement** pre-submit. The config caps position at `new_equity * max_allocated_pct`; widget does not surface or enforce it.

**Gap → action:** Extend fixture + widget to support 4 protocols. Add `exit_preference` selector surfaced only when UNSTAKE is active. Add per-row `unbondingDays`, `rewardModel: "rebase"|"rate"`. Wire strategy_id to selected instance. Add pre-submit cap check against `max_allocated_pct`.

#### `defi-yield-chart-widget` — ✅ adequate (monitor)

File: [components/widgets/defi/defi-yield-chart-widget.tsx](../../../components/widgets/defi/defi-yield-chart-widget.tsx)

- ✅ Time-series for APY / cumulative P&L / daily P&L ([L76-107](../../../components/widgets/defi/defi-yield-chart-widget.tsx#L76-L107))
- ✅ 30/60/90d range toggle ([L92-106](../../../components/widgets/defi/defi-yield-chart-widget.tsx#L92-L106))
- ✅ Per-strategy series with toggle chips ([L176-193](../../../components/widgets/defi/defi-yield-chart-widget.tsx#L176-L193))
- ➖ No reward-factor decomposition — not required here; v2 reward-lifecycle applies only to EtherFi+EigenLayer, not Lido/Rocket/Jito/Marinade. Single factor `PNL_FACTOR_STAKING_YIELD` is sufficient.
- 🟡 **"vs Ethena" comparison baked into KPIs** ([L117-120](../../../components/widgets/defi/defi-yield-chart-widget.tsx#L117-L120)) — Ethena is a carry-basis-perp benchmark, not the natural comparator for pure staking. Should be configurable or use a staking-native baseline (ETH spot return, consensus layer APR).

**Gap → action:** Make the comparator benchmark pluggable per archetype. No widget redesign needed.

#### `defi-rates-overview-widget` — ✅ adequate (monitor)

File: [components/widgets/defi/defi-rates-overview-widget.tsx](../../../components/widgets/defi/defi-rates-overview-widget.tsx)

- ✅ Staking rows populated from `stakingProtocols` ([L87-97](../../../components/widgets/defi/defi-rates-overview-widget.tsx#L87-L97)); columns: Protocol / Category / Detail / APY / TVL.
- ✅ Max-APY KPI at top ([L112-117](../../../components/widgets/defi/defi-rates-overview-widget.tsx#L112-L117)).
- 🟡 Inherits the 3-protocol fixture limitation — will automatically expand once staking fixture adds Rocket/Jito/Marinade.
- ➖ No projected-APY / historical-APY column — not critical for this archetype (dedicated chart widget covers trend).

**Gap → action:** None specific to this widget; fix originates in fixture.

### 4b. Supporting widgets (wallet / transfer / exit)

#### `defi-wallet-summary-widget` — ✅ fits (support)

File: [components/widgets/defi/defi-wallet-summary-widget.tsx](../../../components/widgets/defi/defi-wallet-summary-widget.tsx)

- ✅ Per-chain portfolio table with gas-token balance vs threshold warning ([L245-262](../../../components/widgets/defi/defi-wallet-summary-widget.tsx#L245-L262)) — covers "enough native to stake on this chain" requirement.
- ✅ Rebalance trigger + preview dialog ([L218-228](../../../components/widgets/defi/defi-wallet-summary-widget.tsx#L218-L228)) — covers `react_to_equity_change` support requirement.
- ✅ Key Rates collapsible ([L282](../../../components/widgets/defi/defi-wallet-summary-widget.tsx#L282)) surfaces top yield opportunities at-a-glance.
- ➖ Share-class breakdown present ([L314-336](../../../components/widgets/defi/defi-wallet-summary-widget.tsx#L314-L336)) — used by carry strategies; neutral here.

**Gap → action:** None.

#### `defi-transfer-widget` — 🟡 partial (support)

File: [components/widgets/defi/defi-transfer-widget.tsx](../../../components/widgets/defi/defi-transfer-widget.tsx)

- ✅ Send + Bridge flows both wired; route preview with fee/time/best-return badges; gas-low warning.
- ❌ **Hardcoded `strategy_id: "AAVE_LENDING"`** for SEND ([L220](../../../components/widgets/defi/defi-transfer-widget.tsx#L220)) and `"CROSS_CHAIN_SOR"` for Bridge ([L387](../../../components/widgets/defi/defi-transfer-widget.tsx#L387)). Transfers that fund a staking strategy get misattributed. Should accept a `strategy_id` prop from the strategy surface that hosts the widget.

**Gap → action:** Accept `strategy_id` via props / context; fall back to a generic `TREASURY_TRANSFER` only when no host strategy is present.

#### `defi-health-factor-widget` — ❌ does not serve this archetype (support)

File: [components/widgets/defi/defi-health-factor-widget.tsx](../../../components/widgets/defi/defi-health-factor-widget.tsx)

- ❌ Widget is weETH / recursive-staking specific: reads `weeth_oracle_rate`, `weeth_market_rate`, `oracle_market_gap_pct` ([L90-100](../../../components/widgets/defi/defi-health-factor-widget.tsx#L90-L100)); rate-spread block with `staking_rate_pct`, `borrow_rate_pct`, `leverage`, `leveraged_spread_pct` ([L110-126](../../../components/widgets/defi/defi-health-factor-widget.tsx#L110-L126)); Emergency Exit labeled "unwind the recursive staking position" ([L151](../../../components/widgets/defi/defi-health-factor-widget.tsx#L151)).
- ❌ **No generic LST depeg monitor exists** — the defining kill-switch for this archetype (`LST/underlying spread > 100 bps`) has no widget today.
- ❌ **No peg-history chart** — prior depeg episodes (stETH 2022 ~0.94) invisible in UI.

**Gap → action (BIGGEST GAP):** New widget `defi-lst-depeg-monitor` required. Shows `{current_spread_bps, kill_threshold_bps, 7/30/90d peg history}` per active LST, with alert state when spread crosses threshold and a one-click route to Emergency Exit via the staking widget.

### 4c. Missing coverage (no widget today)

| Capability (from §3)                                            | Status                    | Proposed widget                                                                                                         |
| --------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| LST depeg bps + peg history                                     | ❌ missing                | **new:** `defi-lst-depeg-monitor`                                                                                       |
| Unbonding queue visualisation (queued amount, ETA, claimable)   | ❌ missing                | **new:** `defi-unbonding-queue` (also serves CARRY_STAKED_BASIS, CARRY_RECURSIVE_STAKED)                                |
| Validator health / slashing alerts                              | ❌ missing                | **new:** `defi-validator-alerts` (lower priority — can start as a panel in depeg-monitor)                               |
| Rebase-vs-rate yield tracker per position                       | 🟡 partial in yield-chart | **enhance** `defi-yield-chart-widget` with per-position accrued-yield drilldown                                         |
| Emergency exit (overrides `exit_preference`) for simple staking | ❌ missing                | **enhance** `defi-staking-widget` — add "Emergency exit (DEX swap)" button visible when depeg-monitor is in alert state |

---

## 5. Codex updates (v2 archetype doc)

Minimal — archetype doc is already comprehensive. Two small additions only, keeping existing structure:

1. **`architecture-v2/archetypes/yield-staking-simple.md` → "Config schema" section.** Surface that the 4 example instances in §Example instances differ on **reward model** (rebase vs exchange-rate). Add a one-line row to the Supported venues table: `reward_model: rebase | exchange_rate`. UI reads this to pick the correct accrued-yield formula.
2. **Same doc → "Risk profile" section.** Add explicit line: `depeg kill switch default = 100 bps (1%)` so UI and backend share a single threshold value instead of each hard-coding.

Both are ≤ 2 lines. No structural changes.

---

## 6. Gaps summary (distilled)

**Blockers for manual-execution parity:**

1. Staking fixture missing 3 of 4 protocols (Rocket Pool / Jito / Marinade). Without these, 3 example instances cannot be traded via UI.
2. Hardcoded `strategy_id` in staking + transfer widgets breaks per-instance attribution.
3. No generic LST depeg monitor — the archetype's critical kill-switch signal has no UI surface.

**Enhancement wishlist (non-blocking but high-value):**

1. Exit-preference toggle (DEX_SWAP vs PROTOCOL_WITHDRAWAL) in staking widget.
2. Rebase vs exchange-rate indicator + per-position accrued-yield math.
3. Unbonding queue widget (shared with carry-staked-basis / recursive).
4. Emergency-exit override accessible from monitoring surface.
5. Configurable comparison benchmark in yield-chart (Ethena baseline is wrong for pure staking).

---

## 7. Verified-in-browser checklist

To be completed after widget enhancements. Golden-path scenarios operators should be able to run end-to-end via UI:

- [ ] **Fund + stake on Lido:** Bridge ETH to mainnet → confirm gas-low warning clears → submit STAKE of 1 ETH via Lido → emitted order tagged `YIELD_STAKING_SIMPLE@lido-eth-prod` → stETH balance appears in wallet-summary.
- [ ] **Monitor stETH accrual:** Observe rebase-model yield delta in yield-chart after simulated 24 h advance.
- [ ] **Stake on Jito (SOL):** Switch protocol → chain auto-switches to Solana → SOL balance surfaced → submit STAKE → JitoSOL balance appears → exchange-rate yield tracked (price-delta, not balance-delta).
- [ ] **Depeg alert:** Force stETH/ETH spread > 100 bps in fixture → depeg-monitor flips to alert state → Emergency Exit button becomes reachable from staking widget.
- [ ] **DEX_SWAP exit:** UNSTAKE with `exit_preference=DEX_SWAP` → Uniswap route preview shown → confirm → stETH → ETH settles, unbonding queue not touched.
- [ ] **PROTOCOL_WITHDRAWAL exit:** UNSTAKE with `exit_preference=PROTOCOL_WITHDRAWAL` → Lido withdrawal request emitted → unbonding-queue widget shows pending entry with ETA → on maturity, claim button enables.
- [ ] **Rebalance on equity change:** Simulate equity delta → rebalance preview dialog shows new `target_staked` → confirm → STAKE/UNSTAKE delta emitted.

---

## 8. Open questions for user

1. **LST depeg monitor widget:** build new standalone `defi-lst-depeg-monitor`, or extend `defi-health-factor-widget` with an archetype-aware mode? (Recursive uses the weETH-specific flow today; a shared depeg core with archetype-specific extensions may be cleaner.)
2. **Unbonding queue widget:** single shared widget consumed by staking-simple, staked-basis, and recursive — or per-archetype?
3. **Fixture scope for BP-3:** fully populate Rocket/Jito/Marinade with realistic mock data now, or leave as TODO and focus this BP-3 slice on getting the widget shape right with Lido only?
4. **Strategy-ID tagging:** should the staking widget receive `strategy_id` from the host surface (layout-level), or auto-derive from the selected protocol + asset + chain?
5. **Emergency exit trigger:** automatic (on depeg threshold breach) vs operator-gated (button only, always manual)? v2 archetype doc lists depeg as a kill switch but does not specify the automation boundary.

---

_Status: draft — awaiting user review at §5a checkpoint #3 before consolidating into central tracker and starting archetype #2 (YIELD_ROTATION_LENDING)._
