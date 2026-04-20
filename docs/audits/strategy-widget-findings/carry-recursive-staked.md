---
archetype: CARRY_RECURSIVE_STAKED
status: draft-awaiting-review
---

# CARRY_RECURSIVE_STAKED — Widget Audit

## 1. Archetype summary

**Thesis:** Leveraged yield loop. Supply collateral (stETH / weETH / JitoSOL on the ETH-family lane, or WBTC / SOL on the BTC-/SOL-family lanes) → borrow a correlated asset (ETH / USDC) → re-supply → repeat N loops. Target **effective leverage 2.5–3.0×**. Captures amplified staking + carry yield, at the cost of cascading liquidation risk.

**Position shape:** Per loop `(stake, pledge, borrow)` triple, compounded. After N loops the wallet holds a stack of aTokens (collateral) against a stack of debtTokens. Unwind is the reverse — REPAY → UNPLEDGE → UNSTAKE, with unbonding period on the staking leg for PROTOCOL_WITHDRAWAL path. Atomic multicall per loop on entry and exit.

**P&L drivers:**

- Leveraged staking yield: `(1 / (1 − effective_LTV)) × staking_yield`
- Leveraged reward-token yield (EIGEN / ETHFI) on weETH variants — amplified by same factor
- Minus: leveraged borrow cost: `leverage × borrow_rate`
- Minus: execution-leg gas/slippage per loop; flash-loan fee if entry is flash-bundled (weETH flow)
- **Tail:** depeg loss amplified by leverage — recursive amplifies any stETH/weETH/JitoSOL basis move

**Kill switches (per v2 archetype doc §Risk profile + legacy `recursive-staked-basis.md`):**

- LST depeg > `max_stETH_depeg_bps` (default 50 bps — **tighter** than simple-staking 100 bps because leverage amplifies the loss)
- Aave / Kamino health-factor < `health_factor_kill` (default 1.25)
- Flash-loan liquidity dry-up (Morpho pool < required flash amount — blocks atomic unwind)
- Chain congestion / gas spike preventing deleverage within the HF degradation window
- Aave governance LTV reduction or E-Mode pause

**UI-visible config knobs:** `staking_protocol`, `lending_protocol`, `collateral_asset`, `borrow_asset`, `target_leverage`, `max_leverage`, `safety_buffer_ltv`, `max_stETH_depeg_bps`, `health_factor_target`, `health_factor_kill`, `max_allocated_equity_pct`, `rebalance_cadence`, `reward_mode` (weETH variants), `mev_protection` (bundle path).

**Sources:**

- v2 SSOT: [architecture-v2/archetypes/carry-recursive-staked.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-recursive-staked.md)
- Legacy: [defi/recursive-staked-basis.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/recursive-staked-basis.md) · leveraged variants from [defi/btc-lending-yield.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/btc-lending-yield.md) · [defi/sol-lending-yield.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/sol-lending-yield.md)
- Cross-cutting: [reward-lifecycle.md](../../../../unified-trading-pm/codex/09-strategy/cross-cutting/reward-lifecycle.md) · [mev-protection.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/mev-protection.md)
- Prior audits cross-referencing this archetype: [yield-rotation-lending.md §1 scope note](./yield-rotation-lending.md) (leveraged WBTC/SOL variants explicitly scoped here) · [yield-staking-simple.md §4b](./yield-staking-simple.md) (weETH-specific health-factor widget flagged as "this archetype's primary surface")

## 2. Concrete strategies in this archetype

Per [MIGRATION.md §2 + §8](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md) one legacy doc maps directly. Two further legacy docs contribute their **leveraged variants only** (per [yield-rotation-lending.md §1 scope clarification](./yield-rotation-lending.md)):

| Legacy doc                                       | Scope contributed to this archetype                                             | v2 Example Instance                                                                                                                                             | Notes                                                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `defi/recursive-staked-basis.md`                 | Full doc — weETH / Aave E-Mode flash-loan loop with optional perp hedge         | `CARRY_RECURSIVE_STAKED@lido-aave-eth-prod`                                                                                                                     | The "canonical" recursive: Lido→Aave→borrow ETH→re-stake                                                                   |
| `defi/btc-lending-yield.md` (§Leveraged Variant) | Supply WBTC as collateral → borrow USDC → swap USDC→WBTC → re-supply            | `CARRY_RECURSIVE_STAKED@aave-multichain-wbtc-lev-prod` _(new instance slug; archetype doc §Example instances currently lists only ETH/SOL variants — see §5.3)_ | No staking yield; pure spread between WBTC supply APY and USDC borrow APY × leverage. Directional BTC exposure (no hedge). |
| `defi/sol-lending-yield.md` (§Leveraged Mode)    | Supply SOL (or kSOL via Jito) as collateral on Kamino → borrow USDC → re-supply | `CARRY_RECURSIVE_STAKED@jito-kamino-sol-prod`                                                                                                                   | Jito variant is staked-recursive (matches v2 archetype doc); plain SOL-collateral variant also in scope                    |

**Archetype doc §Example instances** lists three:

```text
CARRY_RECURSIVE_STAKED@lido-aave-eth-prod
CARRY_RECURSIVE_STAKED@lido-aave-arbitrum-eth-prod
CARRY_RECURSIVE_STAKED@jito-kamino-sol-prod
```

**In-scope but not yet in archetype doc** (needs §5 fix):

```text
CARRY_RECURSIVE_STAKED@aave-multichain-wbtc-lev-prod         (WBTC collateral → USDC borrow → re-WBTC)
CARRY_RECURSIVE_STAKED@kamino-sol-usdc-lev-prod              (plain SOL collateral, no Jito staking leg)
CARRY_RECURSIVE_STAKED@etherfi-aave-weeth-eth-prod           (weETH flow used today as the dev-fixture reference)
```

**Collateral rule differences per legacy doc §Collateral Haircuts + §E-Mode:**

| Collateral  | Lending venue  | LTV   | Liq threshold | Max theoretical leverage | Notes                                                          |
| ----------- | -------------- | ----- | ------------- | ------------------------ | -------------------------------------------------------------- |
| weETH       | Aave V3 E-Mode | 93%   | 95%           | 14.3×                    | Capped to `max_leverage` 3.0×; depeg tolerance narrows further |
| stETH       | Aave V3 E-Mode | 93%   | 95%           | 14.3×                    | Same ETH-family E-Mode                                         |
| wstETH      | Aave V3 non-EM | 79.5% | 82%           | 4.88×                    | Higher LTV than weETH non-EM                                   |
| WBTC        | Aave V3        | ~75%  | ~78%          | 3.6×                     | BTC-family, no E-Mode                                          |
| SOL/JitoSOL | Kamino         | ~65%  | ~80%          | ~2×                      | Target leverage is 2× per legacy `sol-lending-yield`           |

**Reward-model matters** (per [reward-lifecycle.md](../../../../unified-trading-pm/codex/09-strategy/cross-cutting/reward-lifecycle.md)): only EtherFi (ETHFI) + EigenLayer (EIGEN) flows emit separate reward tokens. Lido / Rocket / Jito accrue via rate-appreciation only. This affects the monitor-phase P&L widget — reward-token factors apply only to weETH and restaked wstETH.

---

## 3. UI capability requirements

Derived from v2 archetype doc (`architecture-v2/archetypes/carry-recursive-staked.md`) + legacy recursive-staked-basis doc. Grouped by **execute · monitor · support · exit**.

### 3a. Execute

- **Select `(staking_protocol, lending_protocol, chain)` triple** among the three supported venues: `LIDO+AAVE_V3_ETHEREUM` / `LIDO+AAVE_V3_ARBITRUM` / `JITO+KAMINO_SOLANA`. Plus leveraged WBTC/SOL variants (§2) with no staking leg.
- **Target leverage slider** — capped at `max_leverage` (default 3.0), default `target_leverage` 2.5. Show effective leverage vs theoretical max per collateral table.
- **Safety buffer LTV entry** — `effective_LTV = protocol_LTV − safety_buffer_ltv` (default 0.15). Preview health-factor that results at that LTV.
- **BUILD-LOOP action** — submits the **atomic multicall**: STAKE / SWAP→LST (or SWAP to collateral asset) → PLEDGE → BORROW → (optional re-STAKE). For the weETH fast path this is a flash-loan bundle: FLASH_BORROW → SWAP → LEND → BORROW → FLASH_REPAY (all `is_atomic=true`).
- **ADD-LOOP action** — append one more loop to an existing position (re-runs the multicall with residual borrow output). Each loop tightens HF incrementally.
- **UNWIND-LOOP / FULL UNWIND action** — reverse multicall: REPAY → UNPLEDGE → UNSTAKE (or SWAP back). Full unwind iterates all loops.
- **MEV protection toggle** — per archetype mev-protection doc: `FLASHBOTS_RELAY` (mainnet default) / `PRIVATE_MEMPOOL` (L2) / `NONE` (testnet). Atomic bundles are MEV-vulnerable on the swap leg, so this is non-optional on mainnet.
- **Emergency unwind (kill-switch)** — overrides `exit_preference`, accepts slippage, uses priority gas. Reachable from HF monitor and depeg monitor.
- **Amount entry with percentage helpers** (25/50/75/100% of available equity), gated by `max_allocated_equity_pct` (default 0.25).
- **Strategy-instance tag** on every emitted leg — must match one of the 3+ instance IDs listed above (not a hardcoded venue string).
- **Reward-mode select** (weETH variants only): `HOLD` / `SELL` / `SPLIT` per [reward-lifecycle.md](../../../../unified-trading-pm/codex/09-strategy/cross-cutting/reward-lifecycle.md).

### 3b. Monitor (this archetype's heart)

- **Health factor, live** — `HF = (collateral_value × liquidation_threshold) / debt_value`. Must be per-candle at minimum; legacy doc requires **sub-5-minute** tightening as HF degrades (30-second block-level checks at HF < 1.5). Thresholds: 1.5 warn → 1.3 critical → 1.25 kill → 1.0 liquidation.
- **HF time-series chart** with three marker lines (warn / kill / liquidation) and a shaded alert zone.
- **Liquidation-price projection** — "ETH (or SOL / BTC) must drop below $X for HF=1.0 given current loops". The single most decision-relevant readout when equity is leveraged.
- **Per-loop decomposition** — table showing each loop: `staked_amount`, `pledged_amount`, `borrowed_amount`, cumulative effective leverage. Lets the operator see "are we 2.5× or 2.7×?".
- **LST depeg monitor** — `(oracle_rate − market_rate)` in bps for weETH/stETH/JitoSOL against the `max_stETH_depeg_bps` (50 bps default) threshold. Legacy doc treats depeg as a **sliding leverage cap** + a binary emergency exit at 3%. UI must show both.
- **Net leveraged spread** — `staking_rate × leverage − borrow_rate × (leverage − 1)`. Negative spread = strategy is losing money; should flip cell to amber regardless of HF.
- **Reward-token P&L factor decomposition** (weETH only) — `staking_yield × leverage`, `restaking_reward × leverage`, `seasonal_reward`, `reward_unrealised`. Amplification by leverage must be explicit on the chart.
- **Borrow-rate sensitivity** — "+100 bps borrow rate → HF drops from 1.6 to 1.42" preview. Legacy doc calls this out as a custom risk type (rate_sensitivity).
- **Flash-loan pool liquidity** (weETH variants only) — current Morpho WETH liquidity vs required flash for either a new loop or an emergency unwind. A dry-up blocks atomic unwind; operator needs this before depeg is already moving.
- **Oracle-vs-market gap** — Chainlink/Aave oracle price of the LST vs DEX market price; gap > 0.1% warns that the HF readout may not match what the protocol actually sees.
- **TVL / utilization of the lending pool** — if pool utilization is > 90% the atomic unwind's `withdraw collateral` step can fail.
- **MEV / bundle execution log** — gas used per entry/exit bundle, Flashbots success/revert, reason.

### 3c. Support

- **Per-chain wallet** — ETH on Ethereum + Arbitrum for the ETH variants, SOL on Solana for the Jito/Kamino variant. Gas-low warning per chain. Bundle entry needs ~0.1 ETH pre-funded on mainnet for gas.
- **Treasury rebalance preview** when `react_to_equity_change` fires — per v2 doc, the archetype "rescales initial stake; recursion depth preserved". UI must show "target_initial_stake moves from X to Y, loops stay at N".
- **Rebalance cadence indicator** — `rebalance_cadence` (default 1h) countdown to next tick.
- **Approve-status** — ERC-20 approves for (Morpho flash loan, Aave lending pool, Curve/Uniswap swap, EtherFi stake) per wallet × chain. Missing approve = bundle will revert at first signing step.
- **Gas-price per chain** + priority-gas preview for bundle execution.
- **Emergency-exit cost estimate** (legacy doc §Emergency Exit Cost Estimation) — `expected_annual_yield < emergency_close_cost × annualization_factor` must hold pre-deploy. Legacy `annualization_factor` default = 4 (must recover exit cost within 3 months). UI should block BUILD-LOOP if this check fails.

### 3d. Exit

- **Partial deleverage** — repay `deleverage_pct` of the debt stack (default 20%) atomically. Bring HF from 1.3 back to ≥ 1.5 without fully closing.
- **Full unwind** — reverse every loop. For weETH path: FLASH_BORROW → REPAY all → WITHDRAW all collateral → SWAP weETH→ETH → FLASH_REPAY. Non-atomic steps (perp hedge close, if hedge_mode=hedged) follow.
- **Emergency unwind** — HF < `health_factor_kill` (1.25) auto-fires; operator-confirmable in under 60s. Uses priority gas, accepts higher slippage.
- **Exit-preference toggle** — for the unleveraged-exit leg (after REPAY), DEX_SWAP (fast, slippage cost) vs PROTOCOL_WITHDRAWAL (Lido queue 1–5d, Jito epoch 2–3d). Inherited from YIELD_STAKING_SIMPLE concern.
- **Share-class-aware settlement** — USDT / ETH / BTC share class decides whether the final balance is swapped back to stablecoin or kept in the share-class native asset (see [share-class axis](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/axes/share-class.md)).
- **Position-closed confirmation** — aToken + debtToken balances both → 0; final leveraged-yield P&L attribution settles (staking × leverage − borrow × (leverage−1) − all gas/slippage/flash fees).

---

## 4. Widget-by-widget verification

Legend: ✅ fits archetype · 🟡 partial / needs enhancement · ❌ does not serve this archetype · ➖ not applicable here

### 4a. Primary widgets (execute + monitor)

#### `defi-health-factor-widget` — 🟡 partial (the defining monitor surface) · ⚠️ weETH-locked

File: [components/widgets/defi/defi-health-factor-widget.tsx](../../../components/widgets/defi/defi-health-factor-widget.tsx)

- ✅ HF gauge with 3-zone colour coding (healthy / warning / critical) at [L22-38](../../../components/widgets/defi/defi-health-factor-widget.tsx#L22-L38), plus visual bar with warning + liquidation marker lines at [L61-80](../../../components/widgets/defi/defi-health-factor-widget.tsx#L61-L80).
- ✅ Emergency Exit button with cost-breakdown dialog (gas / slippage / exchange fees / % of NAV / estimated time / step list) at [L136-217](../../../components/widgets/defi/defi-health-factor-widget.tsx#L136-L217). Matches the legacy "emergency close cost estimation" requirement.
- ✅ Monitoring interval indicator at [L130-134](../../../components/widgets/defi/defi-health-factor-widget.tsx#L130-L134) — fixture sets `"5 minutes"` at [lib/mocks/fixtures/defi-walkthrough.ts:110](../../../lib/mocks/fixtures/defi-walkthrough.ts#L110). Should tighten to 30s when HF < 1.5 per legacy doc §Health Factor Monitoring — currently static.
- ✅ Net-spread display with leverage multiplier ([L105-128](../../../components/widgets/defi/defi-health-factor-widget.tsx#L105-L128)) — `leveraged_spread_pct = net_spread × leverage` matches v2 P&L formula.
- ❌ **Hardcoded `weETH` labels** at [L90-95](../../../components/widgets/defi/defi-health-factor-widget.tsx#L90-L95) (`weeth_oracle_rate`, `weeth_market_rate`, `oracle_market_gap_pct`). Three of the five in-scope instances are **not weETH** (stETH / wstETH / JitoSOL / SOL / WBTC); the widget cannot render their depeg or oracle/market gap. Fixture schema at [defi-walkthrough.ts:97-111](../../../lib/mocks/fixtures/defi-walkthrough.ts#L97-L111) is similarly weETH-typed.
- ❌ **Emergency Exit step list is weETH-specific** at [defi-walkthrough.ts:124-130](../../../lib/mocks/fixtures/defi-walkthrough.ts#L124-L130) (references `AAVEV3-ETHEREUM` and `HYPERLIQUID` perp) and the dialog description literally says "unwind the recursive staking position" at [L151](../../../components/widgets/defi/defi-health-factor-widget.tsx#L151). For the Jito+Kamino and WBTC-leveraged instances the correct step-list is different (no Aave, no Hyperliquid).
- ❌ **No per-loop decomposition.** Operator cannot see "loop 1 = 3 ETH staked, loop 2 = 1.8 ETH, loop 3 = 1.08 ETH" — the v2 example at §Token flow shows this exact breakdown, and legacy doc calls "dual-index decomposition" out as a UI requirement at `recursive-staked-basis.md §UI Visualisation`.
- ❌ **No liquidation-price projection.** Absent the "ETH must drop to $X for HF=1.0" readout the gauge is abstract — operators manage leverage by price, not HF.
- ❌ **No flash-loan liquidity indicator.** Morpho pool depth gates atomic unwind (legacy §Custom Strategy Risk Types: "Flash loan liquidity risk"). Not surfaced.
- ❌ **No borrow-rate sensitivity preview.** "+100 bps → HF drops to X" is listed as a custom risk type; widget has no such preview.
- ❌ **No "sub-5-min monitoring tightens as HF degrades"** behaviour — interval is fixed at the fixture value.

**Gap → action (biggest gap in this archetype):** Generalize the widget to accept an archetype/instance-aware schema: `(collateral_asset, lending_venue, oracle_rate, market_rate, depeg_threshold_bps, unwind_steps[])`. Add per-loop decomposition table + liquidation-price projection + flash-loan-liquidity row + borrow-rate-sensitivity preview. The current widget is effectively the MVP for the weETH instance only.

#### `defi-lending-widget` — 🟡 partial (execute: the BORROW / REPAY legs)

File: [components/widgets/defi/defi-lending-widget.tsx](../../../components/widgets/defi/defi-lending-widget.tsx)

- ✅ 4-op toggle (LEND / BORROW / WITHDRAW / REPAY) at [L86-105](../../../components/widgets/defi/defi-lending-widget.tsx#L86-L105) — BORROW / REPAY are **core to this archetype** (out-of-scope for YIELD_ROTATION_LENDING, in-scope here).
- ✅ Per-operation expected-output block at [L155-191](../../../components/widgets/defi/defi-lending-widget.tsx#L155-L191) — covers all 4 ops.
- ✅ Health-factor preview (before → after, liquidation warning at HF < 1.1) at [L208-250](../../../components/widgets/defi/defi-lending-widget.tsx#L208-L250). For a single leg this is the correct pre-submit surface.
- 🟡 **HF calculation hardcoded to `AAVEV3` params** at [L44,48](../../../components/widgets/defi/defi-lending-widget.tsx#L44-L48) via `getAssetParams("AAVEV3", asset)` and `calculateHealthFactorDelta("AAVEV3", asset, ...)`. Will mis-preview HF for the Kamino (SOL) instance.
- 🟡 **No atomic-bundle mode.** Widget emits one leg at a time. The archetype requires BORROW-as-part-of-ATOMIC-multicall (STAKE→PLEDGE→BORROW in one tx). `defi-flash-loans-widget` partially covers that (see below) but the lending widget itself is single-leg only.
- 🟡 **No per-loop iteration.** Each recursive loop = repeat (SWAP→LEND→BORROW). Widget has no "run this loop N times with residual" control.
- ❌ **Hardcoded `strategy_id: "AAVE_LENDING"`** at [L259](../../../components/widgets/defi/defi-lending-widget.tsx#L259). Every BORROW / REPAY leg emitted for the recursive strategy gets tagged `AAVE_LENDING`, same per-instance attribution break called out in [yield-rotation-lending.md §6a.1](./yield-rotation-lending.md). **Blocker.**
- ❌ **No approve-status indicator.** First-time BORROW on a new `(chain, debt_asset)` needs a separate approve; widget will submit and silently fail if missing.

**Gap → action:** Wire `strategy_id` from host context. Add Kamino-params variant for the SOL instance. Either compose `defi-lending-widget` into a higher-level "recursive-loop builder" widget or extend it with a loop-iterator (recommended the former — see §6b).

#### `defi-staking-widget` — 🟡 partial (execute: the STAKE leg)

File: [components/widgets/defi/defi-staking-widget.tsx](../../../components/widgets/defi/defi-staking-widget.tsx)

- ✅ STAKE / UNSTAKE toggle, protocol select, 25/50/75/100% helpers — covers the LST-acquisition leg ([L34-52](../../../components/widgets/defi/defi-staking-widget.tsx#L34-L52), [L82-94](../../../components/widgets/defi/defi-staking-widget.tsx#L82-L94)).
- 🟡 **Protocol coverage** — fixture at [lib/mocks/fixtures/defi-staking.ts:3-31](../../../lib/mocks/fixtures/defi-staking.ts#L3-L31) has Lido + EtherFi + Ethena only. **Jito (Solana) missing** — the v2 `@jito-kamino-sol-prod` instance cannot even select a staking protocol. (Same gap called out in [yield-staking-simple.md §4a](./yield-staking-simple.md).)
- 🟡 **No "pledge immediately after stake" composition** — for the recursive flow, STAKE is step 1 of a 4-step atomic multicall. Widget has no way to chain it into the loop; that's the rotation-workflow gap (§6b).
- ❌ **Hardcoded `strategy_id: "ETHENA_BENCHMARK"`** at [L129](../../../components/widgets/defi/defi-staking-widget.tsx#L129). Shared blocker with lending / transfer / swap widgets. **Blocker.**
- ❌ **No reward-mode selector** (`HOLD` / `SELL` / `SPLIT`) — legacy `recursive-staked-basis.md` makes reward_mode a first-class config knob for the weETH variant; widget has no affordance.

**Gap → action:** Add Jito to fixture. Wire `strategy_id` from host. Add reward-mode selector, visible when protocol is EtherFi. Fold into the recursive-loop builder widget in §6b rather than letting the operator staple steps together manually.

#### `defi-flash-loans-widget` — 🟡 partial (execute: the atomic-bundle path for weETH variants)

File: [components/widgets/defi/defi-flash-loans-widget.tsx](../../../components/widgets/defi/defi-flash-loans-widget.tsx)

- ✅ Bundle-step composition UI with auto-prepended FLASH_BORROW + auto-appended FLASH_REPAY at [L44-65](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L44-L65), [L189-201](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L189-L201). Matches the legacy recursive-staked-basis `ATOMIC BUNDLE (all-or-nothing, single transaction)` shape.
- ✅ Per-step operation + venue + slippage + algo-type selects ([L89-178](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L89-L178)).
- ✅ Net-P&L preview with gross profit / flash fee / gas estimate split at [L202-218](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L202-L218).
- ✅ `is_atomic: true` emitted on submit at [L246](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L246) — execution-service contract preserved.
- 🟡 **No loop-template.** The operator has to manually build (SWAP → LEND → BORROW) every time instead of selecting "recursive-staked weETH loop" and having the 4 steps pre-populated per loop count. Legacy doc §Token/Position Flow shows a well-defined 6-step entry template that could ship as a preset.
- 🟡 **Flash-loan pool liquidity not shown.** The header collapsible shows `"Protocol: Aave V3, Fee: 0.05% ($27.50)"` at [L47-63](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L47-L63) but no real-time Morpho pool depth check. Required liquidity = sum of step amounts; widget should compare against `morpho_flash_loan_liquidity` feature.
- 🟡 **Hardcoded 100 ETH / Aave-flash preset values** at [L58-62](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L58-L62) regardless of user intent. Legacy doc prefers Morpho over Aave (0% vs 0.05% fee); widget's preset says Aave.
- ❌ **Hardcoded `strategy_id: "AAVE_LENDING"` + `algo_type: "FLASH_LOAN_AAVE"`** at [L232-234](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L232-L234). Should be `CARRY_RECURSIVE_STAKED@lido-aave-eth-prod` (or instance id from host) and `FLASH_LOAN_MORPHO` when Morpho is selected. **Blocker.**
- ❌ **No MEV-protection toggle** despite legacy doc §MEV Protection making Flashbots-relay the mainnet default for this exact atomic-bundle pattern.

**Gap → action:** Ship a "Recursive-staked loop" preset (populates the 4 loop steps correctly for a chosen `collateral × lending venue × N loops`). Add Morpho liquidity check row. Add MEV-protection select. Wire instance id from host.

#### `defi-swap-widget` — ✅ fits (execute: the LST-swap leg within the bundle)

File: [components/widgets/defi/defi-swap-widget.tsx](../../../components/widgets/defi/defi-swap-widget.tsx)

- ✅ SOR DEX / TWAP / Cross-chain algo select ([L190-204](../../../components/widgets/defi/defi-swap-widget.tsx#L190-L204)); per-venue split table ([L261-339](../../../components/widgets/defi/defi-swap-widget.tsx#L261-L339)). Matches the v2 legacy doc's "SOR applies only to the ETH→weETH swap within the atomic bundle" requirement.
- ❌ **Hardcoded mode-based `strategy_id`** at [L348](../../../components/widgets/defi/defi-swap-widget.tsx#L348) (`BASIS_TRADE` / `STAKED_BASIS` / `AAVE_LENDING`) — no entry for `CARRY_RECURSIVE_STAKED`. **Blocker shared across DeFi audits.**

**Gap → action:** Wire `strategy_id` from host context. Shared fix across lending/transfer/swap/flash widgets.

### 4b. Monitor widgets

#### `defi-reward-pnl-widget` — 🟡 partial (monitor: leveraged reward-factor breakdown)

File: [components/widgets/defi/defi-reward-pnl-widget.tsx](../../../components/widgets/defi/defi-reward-pnl-widget.tsx)

- ✅ Waterfall over 4 factors (`staking_yield`, `restaking_reward`, `seasonal_reward`, `reward_unrealised`) at [L9-14](../../../components/widgets/defi/defi-reward-pnl-widget.tsx#L9-L14). Those factors match [reward-lifecycle.md §Attribute](../../../../unified-trading-pm/codex/09-strategy/cross-cutting/reward-lifecycle.md) exactly for weETH + EigenLayer flows.
- 🟡 **No leverage-amplification display.** The archetype amplifies each factor by `leverage` (per v2 §P&L attribution: "leveraged staking yield = (1 / (1 − effective_LTV)) × staking_yield"). Widget shows raw `$2100 staking yield` without indicating it's already × 2.5 — or hasn't been multiplied. Ambiguity defeats the attribution purpose.
- 🟡 **Borrow-cost factor missing.** Recursive-staked P&L decomposes as `+staking_yield × L + reward_yield × L − borrow_rate × (L−1) − fees`. Widget shows only the positive factors; `borrow_cost_pnl` should be a fifth red bar.
- ➖ For non-weETH variants (WBTC-leveraged, plain-SOL-Kamino) the reward factors are empty — widget correctly shows zero bars, but also should not be rendered in those strategy surfaces. Gate on archetype / instance metadata.

**Gap → action:** Add a `leverage` field to fixture + display "(leveraged × 2.5)" badge on amplified factors. Add borrow-cost factor (negative red bar). Hide widget from surfaces hosting non-reward-emitting instances.

#### `defi-yield-chart-widget` — ✅ adequate (monitor)

File: [components/widgets/defi/defi-yield-chart-widget.tsx](../../../components/widgets/defi/defi-yield-chart-widget.tsx)

- ✅ Time-series for APY / cumulative P&L / daily P&L. Same "vs Ethena" baseline nit carried over from [yield-staking-simple.md §4a](./yield-staking-simple.md) and [yield-rotation-lending.md §4f](./yield-rotation-lending.md) — comparator should be `"vs simple staking (same collateral, no leverage)"` here, to visualise whether the leverage is paying for itself.

**Gap → action:** Shared fix: make baseline configurable per archetype instance.

#### `defi-rates-overview-widget` — ➖ tangential

Tangential at best — shows protocol APY and TVL as a flat table. For recursive-staked the relevant decision is `(supply_APY − borrow_APY) × leverage_factor` net of fees, which this widget doesn't compute. Net-leveraged-spread row would fit as an enhancement but is better captured in the health-factor widget.

### 4c. Support widgets

#### `defi-wallet-summary-widget` — ✅ fits (support)

File: [components/widgets/defi/defi-wallet-summary-widget.tsx](../../../components/widgets/defi/defi-wallet-summary-widget.tsx)

- ✅ Per-chain balances + gas-low warnings + rebalance-preview dialog. Covers "enough ETH on mainnet for the flash bundle" requirement (~0.1 ETH pre-funded per legacy doc §Client Onboarding). Same verdict as §4e in [yield-rotation-lending.md](./yield-rotation-lending.md).

#### `defi-transfer-widget` — 🟡 partial (support)

File: [components/widgets/defi/defi-transfer-widget.tsx](../../../components/widgets/defi/defi-transfer-widget.tsx)

- ❌ **Hardcoded `strategy_id`** — `"AAVE_LENDING"` (send) at [L220](../../../components/widgets/defi/defi-transfer-widget.tsx#L220), `"CROSS_CHAIN_SOR"` (bridge) at [L387](../../../components/widgets/defi/defi-transfer-widget.tsx#L387). Same blocker as rotation audit — transfers that fund a recursive position get mis-tagged. **Blocker.**

For this archetype the primary use is: bridge ETH from L2 to mainnet for the Lido+Aave loop, or transfer USDC to Hyperliquid margin account when hedge-mode is enabled (weETH variant). The widget is correct in shape; only the strategy_id wiring breaks attribution.

### 4d. Missing coverage

| Capability (from §3)                                                                              | Status     | Proposed widget                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-loop decomposition + liquidation-price projection                                             | ❌ missing | **enhance** `defi-health-factor-widget` (see §4a gap action)                                                                                                                                                                                         |
| Recursive-loop builder composite (STAKE → LEND → BORROW × N)                                      | ❌ missing | **new:** `defi-recursive-loop-builder-widget` (wraps staking + swap + lending + flash-loan widgets into a single reviewable flow)                                                                                                                    |
| LST depeg monitor (cross-archetype; shared with YIELD_STAKING_SIMPLE)                             | ❌ missing | **new:** `defi-lst-depeg-monitor-widget` — same candidate from [yield-staking-simple.md §4c](./yield-staking-simple.md); here it must support the tighter `max_stETH_depeg_bps` = 50 threshold and surface the **sliding leverage cap** relationship |
| Flash-loan pool liquidity tracker                                                                 | ❌ missing | **new:** `defi-flash-liquidity-widget` (Morpho / Aave / Balancer pool depth per chain, with dry-up alert)                                                                                                                                            |
| Borrow-rate sensitivity preview (HF at +100 bps)                                                  | ❌ missing | **enhance** `defi-health-factor-widget` scenario block                                                                                                                                                                                               |
| MEV-protection method selector                                                                    | ❌ missing | **enhance** `defi-flash-loans-widget` with toggle                                                                                                                                                                                                    |
| Emergency-exit cost gate ("blocks deploy when projected annual yield < emergency close cost × 4") | ❌ missing | **new check**, either in `defi-recursive-loop-builder-widget` pre-submit or as an overlay on `defi-health-factor-widget`                                                                                                                             |
| Unbonding-queue visualisation (PROTOCOL_WITHDRAWAL exit path)                                     | ❌ missing | **new:** `defi-unbonding-queue-widget` — inherited from [yield-staking-simple.md §4c](./yield-staking-simple.md)                                                                                                                                     |

---

## 5. Codex updates proposed

v2 archetype doc is concise but leaves 3 gaps for this audit:

1. **Archetype doc §Example instances** lists 3 ETH/SOL-staked variants only. Add the leveraged-lending-only variants explicitly: `CARRY_RECURSIVE_STAKED@aave-multichain-wbtc-lev-prod` (WBTC→USDC→re-WBTC) and `CARRY_RECURSIVE_STAKED@kamino-sol-usdc-lev-prod` (plain SOL collateral, no Jito leg). Matches the cross-reference in [yield-rotation-lending.md §1](./yield-rotation-lending.md) "leveraged variants belong to CARRY_RECURSIVE_STAKED".
2. **§Risk profile** lists kill switches but does not quantify `max_stETH_depeg_bps = 50` as an explicit **archetype-wide** default. Add one line: "LST depeg kill threshold default = 50 bps (half of YIELD_STAKING_SIMPLE because leverage doubles the loss)". This gives UI and backend the same threshold value.
3. **§Config schema** should name `reward_mode: HOLD | SELL | SPLIT` for the weETH variant and `mev_protection: FLASHBOTS_RELAY | PRIVATE_MEMPOOL | NONE` for all mainnet variants. Both are load-bearing config knobs in the legacy doc but are absent from the v2 schema block at [archetype doc lines 58-72](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-recursive-staked.md).

No structural changes; all three adds are ≤ 2 lines each.

---

## 6. Gaps summary (distilled)

### 6a. Blockers (must-fix before archetype is UI-complete)

1. **`defi-health-factor-widget` is weETH-locked** ([L90-95](../../../components/widgets/defi/defi-health-factor-widget.tsx#L90-L95), [defi-walkthrough.ts:97-111](../../../lib/mocks/fixtures/defi-walkthrough.ts#L97-L111), [defi-walkthrough.ts:124-130](../../../lib/mocks/fixtures/defi-walkthrough.ts#L124-L130)). Three of five in-scope instances (stETH+Lido, SOL+Kamino leveraged, SOL+Jito, WBTC-leveraged) cannot render HF + depeg + unwind correctly. **Generalize fixture + widget to accept collateral-asset + venue-aware schema.**
2. **Hardcoded `strategy_id` across 4 widgets** ([defi-lending:259](../../../components/widgets/defi/defi-lending-widget.tsx#L259), [defi-staking:129](../../../components/widgets/defi/defi-staking-widget.tsx#L129), [defi-flash-loans:232](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L232), [defi-transfer:220,387](../../../components/widgets/defi/defi-transfer-widget.tsx#L220), [defi-swap:348](../../../components/widgets/defi/defi-swap-widget.tsx#L348)). Every atomic bundle emits with the wrong instance id. Same root-cause as the blockers in [yield-staking-simple.md §6](./yield-staking-simple.md) and [yield-rotation-lending.md §6a.1](./yield-rotation-lending.md) — fix propagates to all DeFi archetypes. **Blocker.**
3. **No recursive-loop builder.** Operators cannot submit a single reviewable "BUILD 3-loop weETH position @ 2.5× target leverage" action — they have to hand-chain SWAP → LEND → BORROW → …. Without this, manual-execution parity is impossible; the archetype is backend-only today. **Blocker for §7 checklist.**

### 6b. Enhancement wishlist

1. **LST depeg monitor widget** — shared candidate with YIELD_STAKING_SIMPLE, stricter 50 bps threshold and sliding-leverage-cap overlay here. **P0** (it's this archetype's second most critical monitor after HF).
2. **Per-loop decomposition + liquidation-price projection** in the HF widget. **P0.**
3. **Flash-loan pool liquidity tracker** (`defi-flash-liquidity-widget`). Dry-up blocks atomic unwind — silent failure mode without this. **P1.**
4. **Borrow-rate sensitivity preview** in HF widget — "+100 bps borrow → HF drops to X". **P1.**
5. **MEV-protection selector** in flash-loans widget (Flashbots relay / private mempool / none). **P1.**
6. **Emergency-exit cost gate** pre-deploy check (expected yield × annualization_factor ≥ emergency close cost). **P1.**
7. **Reward-mode selector** (HOLD / SELL / SPLIT) on the staking widget when protocol is EtherFi. **P2.**
8. **Leverage-amplification label** on `defi-reward-pnl-widget` factors (+ borrow-cost factor as a negative bar). **P2.**
9. **Configurable yield-chart baseline** (vs simple staking, not vs Ethena) — shared nit across all 3 completed audits. **P2.**
10. **Unbonding-queue widget** — shared with YIELD_STAKING_SIMPLE for PROTOCOL_WITHDRAWAL exit leg. **P2.**

---

## 7. Verified-in-browser checklist

Golden-path scenarios. **BLOCKED** until 6a.1–6a.3 land.

1. **BLOCKED** — Open `/trading/defi` with `CARRY_RECURSIVE_STAKED@lido-aave-eth-prod` active; recursive-loop builder renders, pre-populated with 4 loop steps at 2.5× target leverage. Submit as single atomic bundle → emitted instructions all carry that instance id, `is_atomic=true`, `algo_type=FLASH_LOAN_MORPHO`.
2. **PARTIAL** — Manual per-leg STAKE → LEND → BORROW via existing widgets, each with correct `strategy_id` (currently emits `ETHENA_BENCHMARK`, `AAVE_LENDING`, `AAVE_LENDING` respectively — blocker 6a.2).
3. **BLOCKED** — Jito + Kamino recursive loop on Solana (`@jito-kamino-sol-prod`); health-factor widget renders `JitoSOL oracle/market gap` + Kamino-specific unwind steps (currently weETH-locked — blocker 6a.1).
4. **BLOCKED** — WBTC-leveraged instance (`@aave-multichain-wbtc-lev-prod`); depeg monitor non-applicable (no LST), but HF widget + borrow-rate sensitivity + USDC depeg row all render.
5. **PARTIAL** — HF gauge + emergency-exit dialog for weETH instance (existing widget works — but monitoring-interval tightening at HF < 1.5 is not implemented).
6. **BLOCKED** — LST depeg breaches 50 bps → HF widget's sliding-leverage-cap row recommends "deleverage to ≤ 2.1×" → one-click route into the recursive-loop builder with UNWIND pre-selected.
7. **BLOCKED** — Flash-loan liquidity dry-up: set Morpho WETH pool < required flash amount → BUILD-LOOP button disables with tooltip "flash-loan liquidity insufficient — use Aave fallback at 0.05% or wait".
8. **BLOCKED** — Emergency-exit cost gate blocks BUILD-LOOP when `expected_annual_yield < total_exit_cost × 4`.
9. ✅ — Per-chain wallet balance + gas-low warnings for mainnet + Arbitrum + Solana render in wallet-summary.
10. **PARTIAL** — Reward P&L waterfall renders with correct factor labels (weETH instance) — but no leverage-amplification indication and no borrow-cost factor (6b.8).
11. **BLOCKED** — Full unwind: FULL UNWIND action executes reverse multicall; all aToken + debtToken balances → 0; P&L attribution finalizes with `staking × 2.5 + reward × 2.5 − borrow × 1.5 − gas − flash fees − slippage`.

---

## 8. Open questions for user

1. **Health-factor widget generalisation scope:** retrofit `defi-health-factor-widget` into an archetype-aware generic (accepting `{collateral_asset, lending_venue, oracle_rate, market_rate, unwind_steps[]}` from fixture) OR keep the weETH-specific implementation and build a sibling `defi-health-factor-kamino-widget` / `defi-health-factor-wbtc-widget`? Generic is cleaner but introduces indirection; per-archetype is more explicit.
2. **Recursive-loop builder composition:** new top-level widget that internally composes staking + swap + lending + flash-loans widgets, OR a preset-mode on `defi-flash-loans-widget` that pre-populates 4-step loop templates? Composition is cleaner; preset reuses the bundle-review UX already built.
3. **LST depeg monitor shared vs per-archetype:** one `defi-lst-depeg-monitor-widget` with configurable threshold (50 bps here, 100 bps for simple staking) or separate widgets? Preference is shared (matches the cross-cutting nature) but per-archetype avoids the threshold config drift.
4. **Liquidation-price projection UX:** inline in HF widget as a "price-to-HF-1.0" readout, or a separate `defi-liquidation-scenario-widget` that sweeps a price range and plots the HF curve? Inline is terse; scenario widget makes it more visual at the cost of real estate.
5. **MEV-protection default:** should the flash-loans widget default to `FLASHBOTS_RELAY` on mainnet and block submit if the user explicitly picks `NONE`? Legacy doc treats Flashbots as the production default; making it opt-out (rather than opt-in) matches that discipline.
6. **Archetype-doc §Example instances update:** add the leveraged-lending-only instances (`@aave-multichain-wbtc-lev-prod`, `@kamino-sol-usdc-lev-prod`) now, or defer until a real operator onboards one? Adding now keeps the migration table in [MIGRATION.md §9](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md) complete.

---

_Status: draft — awaiting user review at §5a checkpoint before consolidating into the central tracker. Next archetype after this: CARRY_STAKED_BASIS (non-recursive hedged variant)._
