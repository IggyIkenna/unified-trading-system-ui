---
archetype: CARRY_STAKED_BASIS
status: draft-awaiting-review
---

# CARRY_STAKED_BASIS — Widget Audit

## 1. Archetype summary

**Thesis:** Delta-neutral staking-enhanced basis. Stake native asset (ETH/SOL) into LST (stETH/rETH/JitoSOL/mSOL), optionally pledge the LST on a lending protocol to borrow stablecoin margin, then short the underlying perp. Collects **staking yield + perp funding** on one capital base. vs `CARRY_BASIS_PERP`: spot leg is an LST (adds ~3–7% staking APY). vs `YIELD_STAKING_SIMPLE`: hedged, so delta-neutral, not directional. vs `CARRY_RECURSIVE_STAKED`: 1× only, no borrow-and-restake loop.

**Position shape:** 3 legs per v2 archetype doc (`STAKE` → `PLEDGE+BORROW` on Aave/Kamino → `SHORT PERP`). Legacy `staked-basis.md` deploys a 2-leg variant (STAKE → SHORT PERP, stable margin from wallet, no Aave). Both are valid v2 instance configs; widget must handle both (see §3 / §6a.3).

**P&L drivers:**

- Staking yield via LST rebase (stETH) or exchange-rate (rETH, JitoSOL, mSOL)
- Funding rate earned on short perp (positive funding = pay for the hedge)
- Borrow cost on pledged variant (Aave/Kamino stablecoin borrow ~5–8% APY)
- Execution alpha on swap + stake + perp legs
- Optional reward tokens (EIGEN/ETHFI) when LST is EtherFi-based per [reward-lifecycle.md](../../../../unified-trading-pm/codex/09-strategy/cross-cutting/reward-lifecycle.md)

**Kill switches (per v2 archetype §Risk profile + legacy):**

- LST depeg > `max_stETH_depeg_bps` (default 100 bps)
- Aave/Kamino health factor < `max_health_factor_breach` (default 1.2) — only applies to pledged variant
- Funding flip persistent beyond `exit_funding_rate_bps` (default 20 bps)
- Aave liquidity crunch (can't withdraw pledged LST)
- Perp venue circuit breaker / chain congestion preventing rebalance

**UI-visible config knobs:** `staking_protocol`, `staking_instrument`, `lending_protocol` (optional), `collateral_asset`, `borrow_asset`, `perp_venue`, `perp_instrument`, `share_class`, `target_health_factor`, `max_health_factor_breach`, `target_funding_rate_bps`, `exit_funding_rate_bps`, `max_stETH_depeg_bps`, `max_allocated_equity_pct`, `execution_policy_ref`.

**Sources:**

- v2 SSOT: [architecture-v2/archetypes/carry-staked-basis.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-staked-basis.md)
- Legacy: [defi/staked-basis.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/staked-basis.md) (ETH, weETH variant, no Aave) · [defi/sol-staked-basis.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/sol-staked-basis.md) (SOL, mSOL variant, no lending)
- Cross-cutting: [reward-lifecycle.md](../../../../unified-trading-pm/codex/09-strategy/cross-cutting/reward-lifecycle.md) · [MIGRATION.md §2](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md)

**Scope tension to flag (§6a.3):** v2 archetype doc §Token position flow makes PLEDGE + BORROW a core step; legacy `staked-basis.md` §Margin & Liquidation explicitly states "No Aave positions -- weETH is held in wallet, not as collateral" and funds perp margin directly from stable. The 2-leg (no-Aave) variant is the one wired in the UI today at [app/(platform)/services/trading/strategies/staked-basis/page.tsx](<../../../app/(platform)/services/trading/strategies/staked-basis/page.tsx>). The 3-leg (pledge+borrow) variant has no UI surface.

## 2. Concrete strategies in this archetype

Per [MIGRATION.md §2 + §8](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md):

| Legacy doc                 | Legacy code                | v2 Example Instance                                   | Notes                                                                                                   |
| -------------------------- | -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `defi/staked-basis.md`     | `defi/staked_basis.py`     | `CARRY_STAKED_BASIS@lido-aave-hyperliquid-eth-prod`   | ETH; legacy deploys weETH+Hyperliquid **without** Aave (2-leg). v2 adds Aave PLEDGE+BORROW as standard. |
| `defi/sol-staked-basis.md` | `defi/sol_staked_basis.py` | `CARRY_STAKED_BASIS@jito-kamino-drift-sol-prod`       | SOL; legacy deploys mSOL+Drift **without** Kamino. v2 adds Kamino PLEDGE+BORROW.                        |
| (no legacy doc)            | (no legacy code)           | `CARRY_STAKED_BASIS@rocketpool-aave-binance-eth-prod` | rETH; new v2 instance.                                                                                  |
| (no legacy doc)            | (no legacy code)           | `CARRY_STAKED_BASIS@marinade-kamino-drift-sol-prod`   | mSOL; Kamino-pledged variant.                                                                           |

**Archetype doc §Example instances lists 4 instances.** Legacy LST set `{weETH, mSOL}` (from [lib/config/strategy-config-schemas/options.ts:21](../../../lib/config/strategy-config-schemas/options.ts#L21)); v2 expands to `{stETH, rETH, JitoSOL, mSOL}` (archetype doc §Supported venues).

**Key per-instance distinctions:**

- **Rebase (stETH) vs exchange-rate (rETH / JitoSOL / mSOL / weETH):** drives delta-drift calculation. stETH balance grows → perp size must grow proportionally. rETH/JitoSOL/mSOL/weETH: token count fixed, rate grows → same rebalance signal, different underlying math. See legacy `staked-basis.md §weETH Mechanics` and `sol-staked-basis.md §mSOL Mechanics`.
- **Pledged (3-leg) vs held-in-wallet (2-leg):** pledged has HF risk + borrow cost; held-in-wallet has neither but consumes 10–15% of capital as direct perp margin (loss of capital efficiency).
- **Reward-token variants:** EtherFi (weETH) emits EIGEN + ETHFI; Lido/Rocket/Jito/Marinade do not. Reward-lifecycle active only when LST = weETH.

## 3. UI capability requirements

Grouped by **execute · monitor · support · exit**. Each capability must be fulfillable via UI so operators can trade manually and verify backend wiring.

### 3a. Execute

- **Select `(staking_protocol, lending_protocol?, perp_venue)` triple** — three dropdowns (lending optional). Chain auto-derived: Lido/Rocket + Aave + Hyperliquid/Binance/Bybit/Deribit on Ethereum; Jito/Marinade + Kamino + Drift on Solana.
- **3-leg sequenced flow (v2 3-leg variant):**
  1. `STAKE` — deposit native (ETH/SOL) into staking protocol, receive LST
  2. `PLEDGE` (TRANSFER + LEND as collateral) — deposit LST to Aave/Kamino, receive aToken/kToken
  3. `BORROW` — draw stablecoin (USDC/USDT) against the pledged LST, respecting `target_health_factor`
  4. `TRANSFER` borrowed stablecoin to perp venue
  5. `TRADE` short perp, size = `LST_balance * LST_rate` (notional)
- **2-leg legacy variant (no Aave):** STAKE → TRANSFER stablecoin (from wallet, not borrow) to perp venue → TRADE short perp. Must be reachable via same surface (widget-level toggle: `use_aave_collateral`).
- **Amount entry** with 25/50/75/100% helpers; respects `max_allocated_equity_pct` (default 0.40).
- **Hedge ratio** control (default 100%) for imperfect hedge scenarios (ETH share class may want < 100%).
- **Strategy instance tag** on every emitted order matching the active instance (e.g. `CARRY_STAKED_BASIS@lido-aave-hyperliquid-eth-prod`), NOT generic `STAKED_BASIS`.
- **HF preview pre-submit** for pledged variant — widget must show projected HF after BORROW before operator confirms.
- **Reward-token claim/sell** actions (only for EtherFi/EIGEN variants) per reward-lifecycle doc.

### 3b. Monitor

- **Combined APY decomposition** — stacked bar: `staking_yield + funding_rate - borrow_cost` = net. This is the central thesis monitor; legacy docs both reference it as strategy-specific view.
- **LST depeg monitor** — current `LST/underlying` spread in bps vs `max_stETH_depeg_bps` kill-switch threshold. Same gap as YIELD_STAKING_SIMPLE §4c.
- **Peg history chart** — LST/underlying rate over time (weETH ~1.035 → growth; stETH ~1.00; mSOL ~1.18 → growth). Entry-anchored trace to see accrued yield as price delta.
- **Funding rate monitor per perp venue** — current funding + annualized APY vs `exit_funding_rate_bps` threshold. Funding flip = thesis break.
- **Funding rate history** — 7/30/90d time series; identifies regime (sustained positive = healthy; flip = exit signal).
- **Net delta drift indicator** — `abs(perp_notional_short - LST_balance * LST_rate)` vs minor/major/critical thresholds (2/5/10%). Rebalance trigger surface.
- **Health factor dashboard** (pledged variant only) — current HF vs `target_health_factor` vs `max_health_factor_breach` vs liquidation, oracle vs market LST rate, oracle/market gap.
- **Per-venue margin usage** on perp venue (Hyperliquid cross-margin / Binance futures).
- **P&L attribution by factor** — `staking_yield_pnl + funding_pnl - borrow_cost - reward_pnl - txn_costs`. Waterfall per instance.
- **Reward accrual tracker** (EtherFi only) — EIGEN + ETHFI accrued / claimed / sold, next claim date, next payout.

### 3c. Support

- **Wallet balances by chain** — native + LST + stablecoin on Ethereum / Solana; per-chain gas-low threshold.
- **Treasury → hot-wallet capital flow** — reserve %, deployed %, idle %. Rebalance preview on `react_to_equity_change` (archetype doc §Reaction to equity change: scales all three legs proportionally).
- **Gas estimate** — per leg pre-submit (STAKE ~150k, PLEDGE+BORROW ~250k multicall, TRANSFER-to-perp ~80k, perp trade = 0 gas on Hyperliquid).
- **CEX sub-account state** — Hyperliquid / Binance / Bybit / Drift margin, PnL, liquidation price.
- **Bridge** — single-chain per instance (Ethereum OR Solana); bridge only needed if capital originates off-chain. Covered by existing transfer widget.
- **Rebalance preview** — minor (log), major (adjust perp size), critical (emergency exit). Thresholds from `rebalancing_config.yaml`.

### 3d. Exit

Driven by `exit_funding_rate_bps`, `max_stETH_depeg_bps`, or manual trigger.

- **Ordinary exit (reverse 3-leg):** close perp → WITHDRAW stablecoin from perp venue → REPAY borrow (pledged variant) → WITHDRAW LST from Aave (pledged variant) → unstake LST OR DEX-swap LST back to native → consolidate to base stable.
- **2-leg ordinary exit:** close perp → WITHDRAW stable from perp → unstake LST / DEX-swap.
- **Emergency exit (kill switch):** operator-forced sequence that tolerates slippage; overrides `exit_preference`. Reachable from depeg monitor, HF monitor, funding monitor.
- **Partial unwind:** reduce leg size proportionally (e.g. trim 30% of all 3 legs) — for `react_to_equity_change` down-scale.
- **Reward-token harvest on exit** (EtherFi): claim accrued EIGEN + ETHFI, sell, include in final P&L.
- **Position-closed confirmation:** LST + aToken + perp position all 0, base stable restored; final P&L attribution settles.

---

## 4. Widget-by-widget verification

Legend: ✅ fits · 🟡 partial · ❌ does not serve this archetype · ➖ tangential.

Primary widgets per audit plan §2: `defi-staking`, `defi-lending`, `defi-health-factor`, `defi-funding-matrix`, `defi-reward-pnl`. Supporting: `defi-yield-chart`, `defi-trade-history`.

### 4a. `defi-staking-widget` — execute leg 1 (STAKE) · 🟡 partial

File: [components/widgets/defi/defi-staking-widget.tsx](../../../components/widgets/defi/defi-staking-widget.tsx)

- ✅ Protocol dropdown, amount with 25/50/75/100% helpers, STAKE/UNSTAKE toggle ([L34-94](../../../components/widgets/defi/defi-staking-widget.tsx#L34-L94))
- ✅ APY + TVL + min-stake readout ([L97-119](../../../components/widgets/defi/defi-staking-widget.tsx#L97-L119))
- 🟡 **Protocol coverage:** fixture [lib/mocks/fixtures/defi-staking.ts:3-31](../../../lib/mocks/fixtures/defi-staking.ts#L3-L31) has only `LIDO-ETHEREUM`, `ETHERFI-ETHEREUM`, `ETHENA-ETHEREUM`. Missing **ROCKET_POOL, JITO, MARINADE** — 3 of the 4 archetype example instances (`rocketpool-aave-binance-eth`, `jito-kamino-drift-sol`, `marinade-kamino-drift-sol`) cannot be selected. ETHENA is a benchmark/separate archetype, not a staking venue.
- 🟡 **`unbondingDays: 0` on every row** ([fixture L10,19,29](../../../lib/mocks/fixtures/defi-staking.ts#L10)) — masks real unbonding cost: Lido queue 1–5d, Rocket queue, Jito epoch ~2–3d. For staked-basis the user typically DEX-swaps out so this is secondary, but still misleading.
- ❌ **Hardcoded `strategy_id: "ETHENA_BENCHMARK"` at [L129](../../../components/widgets/defi/defi-staking-widget.tsx#L129)** regardless of selected protocol. Every STAKE order on staked-basis surface mis-tagged. Same blocker as YIELD_STAKING_SIMPLE §6a.2 and YIELD_ROTATION_LENDING §6a.1. **Blocker shared across DeFi archetypes.**
- ❌ **No rebase-vs-rate indicator** — user can't tell stETH (rebase) from weETH/rETH/mSOL/JitoSOL (rate). Drives the delta-rebalance math (legacy `sol-staked-basis.md §mSOL Mechanics`).
- ❌ **No `lending_protocol` companion selector** — cannot express "STAKE into Lido, then PLEDGE on Aave" as one flow; operator must chain staking widget + lending widget + transfer widget + basis-trade widget manually with no orchestrating review.

**Gap → action:** Expand fixture to 4 LST protocols. Add `rewardModel: "rebase"|"rate"` and accurate `unbondingDays` per row. Replace hardcoded strategy_id with instance id from host surface. Consider adding an archetype-aware "next step" button for the pledge + perp legs.

### 4b. `defi-lending-widget` — execute legs 2+3 (PLEDGE + BORROW) · 🟡 partial (pledged variant only)

File: [components/widgets/defi/defi-lending-widget.tsx](../../../components/widgets/defi/defi-lending-widget.tsx)

- ✅ LEND + BORROW toggle ([L85-105](../../../components/widgets/defi/defi-lending-widget.tsx#L85-L105)) — covers PLEDGE (LEND the LST) and the stablecoin BORROW against it.
- ✅ HF preview (current → after) with liquidation warning at HF < 1.1 ([L208-250](../../../components/widgets/defi/defi-lending-widget.tsx#L208-L250)) — critical for pledged-variant pre-submit.
- ✅ Supply + borrow APY surfaced per asset ([L193-206](../../../components/widgets/defi/defi-lending-widget.tsx#L193-L206)) — shows the `borrow_cost` leg of combined-APY math.
- 🟡 **Asset set doesn't prominently include LSTs as collateral.** Lending fixture [lib/mocks/fixtures/defi-lending.ts](../../../lib/mocks/fixtures/defi-lending.ts) populates stablecoin + ETH/BTC rows. To PLEDGE stETH/weETH/rETH/wstETH as Aave collateral (per archetype doc §Supported venues), those LSTs must appear in `selectedProtocol.assets`. Not yet verified; if missing, blocks the pledged flow end-to-end.
- 🟡 **No wrapping affordance.** Per legacy `staked-basis.md §Token Wrapping`, rebasing tokens (stETH, eETH) cannot be pledged as Aave collateral directly — they must be wrapped (→ wstETH, weETH). Widget has no WRAP instruction preview; operator would silently fail if choosing raw stETH.
- ❌ **Hardcoded `strategy_id: "AAVE_LENDING"` at [L259](../../../components/widgets/defi/defi-lending-widget.tsx#L259)** — every PLEDGE/BORROW instruction emits `AAVE_LENDING` instead of `CARRY_STAKED_BASIS@<instance>`. **Blocker shared with YIELD_ROTATION_LENDING §6a.1.**
- ❌ **No multi-step orchestration** — PLEDGE + BORROW should be a single multicall review (archetype doc §Execution semantics: "ATOMIC: TRANSFER stETH to Aave + LEND as collateral + BORROW USDC (multicall)"). Today it's two separate submissions.

**Gap → action:** Verify LST assets are in fixture for AAVE-ETHEREUM + KAMINO-SOLANA. Add WRAP step preview when raw rebasing token is selected. Expose ATOMIC multicall review. Wire strategy_id from host.

### 4c. `defi-health-factor-widget` — monitor HF (pledged variant) · 🟡 partial

File: [components/widgets/defi/defi-health-factor-widget.tsx](../../../components/widgets/defi/defi-health-factor-widget.tsx)

- ✅ HF gauge with warning + liquidation markers, current/threshold comparison ([L61-81](../../../components/widgets/defi/defi-health-factor-widget.tsx#L61-L81)) — covers `target_health_factor` / `max_health_factor_breach` monitor.
- ✅ **LST oracle vs market rate + gap display** ([L90-102](../../../components/widgets/defi/defi-health-factor-widget.tsx#L90-L102)) — partial depeg signal. Values hardcoded to weETH (`weeth_oracle_rate`, `weeth_market_rate`) in [fixture L102-104](../../../lib/mocks/fixtures/defi-walkthrough.ts#L102-L104).
- ✅ Emergency Exit button with cost estimate + unwind steps ([L137-215](../../../components/widgets/defi/defi-health-factor-widget.tsx#L137-L215)) — fits the kill-switch exit path.
- 🟡 **weETH-locked nomenclature.** All labels say "weETH" ([L90,94](../../../components/widgets/defi/defi-health-factor-widget.tsx#L90-L94)); dialog copy "unwind the recursive staking position" ([L151](../../../components/widgets/defi/defi-health-factor-widget.tsx#L151)). Must generalise to `{lst_symbol}` pulled from active instance config (stETH / rETH / JitoSOL / mSOL).
- 🟡 **Rate Spread (Leveraged) block** ([L106-128](../../../components/widgets/defi/defi-health-factor-widget.tsx#L106-L128)) shows `staking_rate − borrow_rate × leverage = leveraged_spread`. Leverage ≠ 1 for staked-basis (1×, no loop); this block is RECURSIVE_STAKED-specific. Either hide for staked-basis or show as `net_carry = staking + funding − borrow` (the actual thesis math).
- ❌ **No depeg-threshold alert bar** — shows numeric gap but no color-tier against `max_stETH_depeg_bps` (100 bps default). No one-click escalation to emergency exit when gap > threshold.
- ❌ **No funding-rate row** — HF panel is Aave-only; funding leg (the other half of the carry) is not in this widget. Operator must cross-reference funding-matrix separately to evaluate the full thesis state.

**Gap → action:** Parametrise LST symbol + oracle/market keys from instance config. Hide the leveraged-spread block for staked-basis; show `net_carry` instead. Add depeg-threshold color band + alert → emergency exit. Consider adding a funding summary row to make this widget the single thesis-health pane.

### 4d. `defi-funding-matrix-widget` — monitor funding rate · ✅

File: [components/widgets/defi/defi-funding-matrix-widget.tsx](../../../components/widgets/defi/defi-funding-matrix-widget.tsx)

- ✅ Coin × venue matrix with best-venue-per-coin highlight ([L73-114](../../../components/widgets/defi/defi-funding-matrix-widget.tsx#L73-L114)), color-coded against `FUNDING_RATE_FLOOR`.
- ✅ Fixture [MOCK_FUNDING_RATES at defi-walkthrough.ts:41-50](../../../lib/mocks/fixtures/defi-walkthrough.ts#L41-L50) covers ETH + SOL (the two asset branches of this archetype) across Hyperliquid / OKX / Bybit / Binance / Aster. Drift missing — the Solana-native perp venue from archetype doc §Supported venues.
- 🟡 **No threshold indicator for `exit_funding_rate_bps`** — widget color tiers at 2.5% / 5% are coarse; archetype config specifies `target_funding_rate_bps=80` and `exit_funding_rate_bps=20` (equivalent to 29% and 7.3% annualised on 8h funding). UI color threshold doesn't align with exit kill-switch.
- 🟡 **No per-coin active-venue badge** — operator can't see "this instance is shorting ETH on Hyperliquid" in the matrix; best-venue-underline is about where one SHOULD be, not where one IS.
- ➖ Decent fit as a "where's the hedge cheapest" view; can serve both staked-basis and plain basis.

**Gap → action:** Add Drift to `FUNDING_RATE_VENUES`. Add configurable threshold lines (target/exit) from instance config. Add "active instance" badge on the currently-shorted (coin, venue) cell.

### 4e. `defi-reward-pnl-widget` — monitor reward P&L (EtherFi variants) · 🟡 partial

File: [components/widgets/defi/defi-reward-pnl-widget.tsx](../../../components/widgets/defi/defi-reward-pnl-widget.tsx)

- ✅ Waterfall per factor with total ([L51-82](../../../components/widgets/defi/defi-reward-pnl-widget.tsx#L51-L82)). Factor labels `staking_yield`, `restaking_reward`, `seasonal_reward`, `reward_unrealised` ([L9-14](../../../components/widgets/defi/defi-reward-pnl-widget.tsx#L9-L14)) map correctly to `PNL_FACTOR_STAKING_YIELD` + `PNL_FACTOR_RESTAKING_REWARD` (EIGEN) + `PNL_FACTOR_SEASONAL_REWARD` (ETHFI) + `PNL_FACTOR_REWARD_UNREALISED` per [reward-lifecycle.md §Attribute](../../../../unified-trading-pm/codex/09-strategy/cross-cutting/reward-lifecycle.md).
- ✅ Companion `defi-staking-rewards-widget` at [components/widgets/defi/defi-staking-rewards-widget.tsx](../../../components/widgets/defi/defi-staking-rewards-widget.tsx) wires Claim + Claim&Sell flow ([L128-157](../../../components/widgets/defi/defi-staking-rewards-widget.tsx#L128-L157)) — covers reward-lifecycle execute path for EtherFi variants.
- 🟡 **Not instance-aware.** For Lido/Rocket/Jito/Marinade variants (no separate reward tokens per reward-lifecycle §Supported Protocols), the widget still renders EIGEN + ETHFI factors — misleading for ~3 of 4 example instances.
- 🟡 **No funding_pnl or borrow_cost factors** — this is a **reward** P&L widget, not a full staked-basis P&L attribution. Staked-basis total P&L is `staking_yield + funding − borrow − txn_costs`; `funding_pnl` and `borrow_cost` factors are missing from this widget and not clearly covered elsewhere on the staked-basis page.

**Gap → action:** Gate factor rows by active instance's reward-token set (hide EIGEN/ETHFI rows on Lido/Jito/Marinade/Rocket instances). Add `funding_pnl` and `borrow_cost` factor rows, OR promote a separate `defi-carry-pnl-widget` for the full staked-basis attribution (§6b.2).

### 4f. `enhanced-basis-widget` — supporting: basis overview (not primary for this archetype) · ➖

File: [components/widgets/defi/enhanced-basis-widget.tsx](../../../components/widgets/defi/enhanced-basis-widget.tsx)

- ➖ Shows spot-vs-perp basis rows per asset ([L138-177](../../../components/widgets/defi/enhanced-basis-widget.tsx#L138-L177)), best-opportunity badge ([L117-135](../../../components/widgets/defi/enhanced-basis-widget.tsx#L117-L135)) — better fit for CARRY_BASIS_PERP than this archetype. Included here because staked-basis shares the funding/basis monitor concern. Not a blocker — but does NOT show **staking yield contribution**, so the "combined APY" thesis (staking + funding − borrow) is not visible here.

**Gap → action:** Out of scope for this audit. Either generalise to a `defi-carry-opportunities-widget` (combined APY across basis variants) or leave archetype-bound.

### 4g. `defi-yield-chart-widget` — supporting: APY time-series · ✅ with nit

File: [components/widgets/defi/defi-yield-chart-widget.tsx](../../../components/widgets/defi/defi-yield-chart-widget.tsx)

- ✅ APY / cumulative P&L / daily P&L with 30/60/90d range ([L76-107](../../../components/widgets/defi/defi-yield-chart-widget.tsx#L76-L107)), per-strategy toggle chips ([L176-193](../../../components/widgets/defi/defi-yield-chart-widget.tsx#L176-L193)).
- 🟡 Same **"vs Ethena" baseline nit** as YIELD_STAKING_SIMPLE §4b and YIELD_ROTATION_LENDING §4f at [L117-120](../../../components/widgets/defi/defi-yield-chart-widget.tsx#L117-L120). For staked-basis, Ethena is actually a credible comparator (it is a synthetic-dollar basis benchmark per [MIGRATION.md §2](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md)), but should still be configurable per instance.

### 4h. `defi-trade-history-widget` — supporting: executed leg audit · ✅

File: [components/widgets/defi/defi-trade-history-widget.tsx](../../../components/widgets/defi/defi-trade-history-widget.tsx)

- ✅ Covers STAKE / LEND / BORROW / TRANSFER / TRADE instruction types ([L15-29](../../../components/widgets/defi/defi-trade-history-widget.tsx#L15-L29)) — all 5 legs of the 3-leg variant visible.
- 🟡 Inherits the hardcoded strategy_id problem: rows tagged based on `instruction_type` in [defi-data-context.tsx:294-306](../../../components/widgets/defi/defi-data-context.tsx#L294-L306) — a STAKE row is labelled `STAKED_BASIS`, a TRADE `BASIS_TRADE`. Cross-instance attribution impossible for three parallel staked-basis instances.

### 4i. `defi-strategy-config-widget` — execute: instance config · 🟡 partial

File: [components/widgets/defi/defi-strategy-config-widget.tsx](../../../components/widgets/defi/defi-strategy-config-widget.tsx)

- ✅ STAKED_BASIS config surface at [lib/config/strategy-config-schemas/defi.ts:191-210](../../../lib/config/strategy-config-schemas/defi.ts#L191-L210) — fields: `lst_token`, `perp_venue`, `max_delta_deviation`.
- ❌ **Schema too narrow.** v2 archetype config (§Config schema) specifies ~13 fields: `staking_protocol`, `lending_protocol`, `collateral_asset`, `borrow_asset`, `perp_instrument`, `share_class`, `target_health_factor`, `max_health_factor_breach`, `target_funding_rate_bps`, `exit_funding_rate_bps`, `max_stETH_depeg_bps`, `max_allocated_equity_pct`, `execution_policy_ref`. UI surface exposes 3. Operator cannot configure kill-switch thresholds, HF targets, funding exit, allocation cap, or lending leg.
- ❌ **`LST_TOKEN_OPTIONS = ["weETH", "mSOL"]`** at [options.ts:21](../../../lib/config/strategy-config-schemas/options.ts#L21) — excludes stETH, rETH, JitoSOL (3 of 4 v2 LSTs).
- ❌ **No `use_aave_collateral` toggle** — cannot choose between 2-leg (legacy) and 3-leg (v2) variants.
- ✅ Risk indicators block ([L211-229](../../../components/widgets/defi/defi-strategy-config-widget.tsx#L211-L229)) hard-codes weETH/ETH depeg, borrow-staking spread, USDT peg, withdrawal delay, rebalance cost — correct shape but static literals, not instance-driven.

**Gap → action:** Expand STAKED_BASIS schema to v2 config (~13 fields). Add `use_aave_collateral` boolean. Expand LST options to 4. Wire Risk indicators to instance data (depeg bps from fixture, HF from health-factor fixture, etc.).

### 4j. Legacy page layout: `/services/trading/strategies/staked-basis/page.tsx` · 🟡 partial

File: [app/(platform)/services/trading/strategies/staked-basis/page.tsx](<../../../app/(platform)/services/trading/strategies/staked-basis/page.tsx>)

- 🟡 Wires only 2 widgets (`DeFiSwapWidget` in staked-basis mode + `DeFiTransferWidget`) ([L49,61](<../../../app/(platform)/services/trading/strategies/staked-basis/page.tsx#L49>)). Missing: STAKE (step 1 of 5), PLEDGE+BORROW (steps 2+3), TRADE short perp (step 5), HF monitor, funding monitor, combined-APY decomposition, depeg monitor.
- 🟡 Deep-links to Book / Positions / DeFi hub / Risk ([L22-38](<../../../app/(platform)/services/trading/strategies/staked-basis/page.tsx#L22-L38>)) — operator bounces between surfaces to execute legs 3–5. No single-review orchestrator.
- 🟡 Header copy identifies canonical id as `STAKED_BASIS` ([L20](<../../../app/(platform)/services/trading/strategies/staked-basis/page.tsx#L20>)) — should match v2 instance id, not archetype shorthand.

**Gap → action:** Extend page layout to include all 5 primary widgets from §2 of audit plan; link strategy_id to active v2 instance id; consider an orchestrator composite widget (§6b.1).

### 4k. Missing coverage (no widget today)

| Capability (from §3)                                                                          | Status                   | Proposed widget                                                                                  |
| --------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| LST depeg monitor (bps vs `max_stETH_depeg_bps` + peg history)                                | ❌ missing               | **new:** `defi-lst-depeg-monitor` (shared with YIELD_STAKING_SIMPLE §4c, CARRY_RECURSIVE_STAKED) |
| Combined-APY decomposition (`staking + funding − borrow` stacked bar, per instance)           | ❌ missing               | **new:** `defi-carry-pnl-widget` (the thesis monitor)                                            |
| Unbonding / withdrawal-queue tracker                                                          | ❌ missing               | **new:** `defi-unbonding-queue` (shared per YIELD_STAKING_SIMPLE §4c)                            |
| Staked-basis 5-leg execution orchestrator (STAKE → PLEDGE → BORROW → TRANSFER → TRADE review) | ❌ missing               | **new:** `defi-staked-basis-workflow` (archetype-level composite)                                |
| Funding-rate history per venue with `exit_funding_rate_bps` overlay                           | ❌ missing               | **new:** `defi-funding-history-widget` (could extend `defi-funding-matrix`)                      |
| Delta-drift indicator (live `perp_notional − LST_balance*LST_rate` vs rebalance thresholds)   | ❌ missing               | **new:** `defi-delta-drift-widget` (also serves plain basis)                                     |
| Full P&L attribution for staked-basis (`staking + funding − borrow − gas − slippage`)         | 🟡 partial in reward-pnl | **enhance** `defi-reward-pnl-widget` → `defi-carry-pnl-widget` (§6b.2)                           |

---

## 5. Codex updates (v2 archetype doc)

Minimal — archetype doc is comprehensive. Three clarifying adds:

1. **Variant flag under §Config schema.** Add `use_lending_collateral: bool (default true)` (or equivalent) so the 2-leg legacy variant (LST held in wallet, direct stable margin to perp) is a first-class config choice, not an implicit departure. Today legacy `staked-basis.md §Margin & Liquidation` says "No Aave positions" while v2 archetype says PLEDGE+BORROW is core. Make it a dial.
2. **Reward-model axis under §Supported venues.** Add a column `reward_model: rebase | exchange_rate` (stETH = rebase, rETH/JitoSOL/mSOL/weETH = rate). UI reads to pick correct delta-drift + accrued-yield formula. Same add requested in YIELD_STAKING_SIMPLE §5.
3. **Kill-switch thresholds under §Risk profile.** State explicit defaults: `max_stETH_depeg_bps=100`, `max_health_factor_breach=1.2`, `exit_funding_rate_bps=20`. Defaults already in §Config schema; §Risk profile currently restates them narratively — make them a machine-readable table so UI and backend share source.

No structural changes.

---

## 6. Gaps summary

### 6a. Blockers (must-fix before archetype is UI-complete)

1. **Hardcoded `strategy_id` in 3 widgets** — `"ETHENA_BENCHMARK"` in [defi-staking-widget.tsx:129](../../../components/widgets/defi/defi-staking-widget.tsx#L129), `"AAVE_LENDING"` in [defi-lending-widget.tsx:259](../../../components/widgets/defi/defi-lending-widget.tsx#L259) + [defi-transfer-widget.tsx:220](../../../components/widgets/defi/defi-transfer-widget.tsx#L220), `"STAKED_BASIS"|"BASIS_TRADE"|"AAVE_LENDING"` mode-based in [defi-swap-widget.tsx:348](../../../components/widgets/defi/defi-swap-widget.tsx#L348). All 4 legs of the staked-basis flow mis-tag orders; per-instance attribution impossible. **Same root cause as YIELD_STAKING_SIMPLE / YIELD_ROTATION_LENDING; single fix propagates.**
2. **LST coverage in fixtures.** [lib/mocks/fixtures/defi-staking.ts:3-31](../../../lib/mocks/fixtures/defi-staking.ts#L3-L31) and [LST_TOKEN_OPTIONS at options.ts:21](../../../lib/config/strategy-config-schemas/options.ts#L21) omit 3 of 4 archetype LSTs. Without Rocket (rETH), Jito (JitoSOL), Marinade (mSOL), 3 of 4 example instances cannot be exercised.
3. **2-leg vs 3-leg variant not a first-class choice.** Legacy staked-basis (in-wallet LST, direct stable margin) and v2 staked-basis (pledged on Aave + borrowed stable) are both valid instances; UI + schema currently only model a 3-leg-ish flow without Aave actually wired. No `use_aave_collateral` toggle. Surface + config both need the dial (and §5 codex update closes the SSOT gap).
4. **No LST depeg monitor widget.** `max_stETH_depeg_bps` (the archetype's primary kill switch) has no dedicated UI — `defi-health-factor-widget` shows an oracle/market gap number but no threshold alert, no peg history, weETH-locked labels. Identical blocker to YIELD_STAKING_SIMPLE §4c. **P0 new widget.**
5. **No combined-APY / net-carry monitor.** The thesis (`staking + funding − borrow`) is decomposed nowhere. `defi-reward-pnl-widget` shows reward factors only; `defi-yield-chart-widget` shows gross APY; no widget sums the legs per instance. **P0 new or enhanced widget.**

### 6b. Enhancements (non-blocking but high-value)

1. **Staked-basis workflow composite widget** — single reviewable 5-leg execution (STAKE → PLEDGE → BORROW → TRANSFER → TRADE). Today operator bounces between `/trading/strategies/staked-basis` + `/trading/defi` + `/trading/book` + `/trading/positions`. Candidate: `defi-staked-basis-workflow`. **P1.**
2. **Promote `defi-reward-pnl-widget` → `defi-carry-pnl-widget`** — add `funding_pnl`, `borrow_cost`, `gas_cost` factor rows; gate reward-token rows (EIGEN/ETHFI) by active instance. Becomes the P&L attribution pane for all carry archetypes (staked-basis, basis-perp, recursive). **P1.**
3. **Delta-drift indicator widget.** Live `abs(perp_notional − LST_balance*LST_rate)` vs rebalance tiers (2/5/10%). Trigger for `react_to_equity_change` rebalance. Shared with plain basis. Candidate: `defi-delta-drift-widget`. **P1.**
4. **Unbonding / withdrawal queue widget.** Shared with YIELD_STAKING_SIMPLE §4c + CARRY_RECURSIVE_STAKED. Candidate: `defi-unbonding-queue`. **P2.**
5. **Parametrise `defi-health-factor-widget` per LST.** Remove hardcoded weETH labels; pull `{lst_symbol, oracle_rate_key, market_rate_key}` from active instance. **P1 (cheap, unblocks multi-instance verification).**
6. **Funding-rate history + thresholds in `defi-funding-matrix`.** Add Drift, add `target_funding_rate_bps` / `exit_funding_rate_bps` threshold lines per instance config, add active-instance cell badge. **P2.**
7. **Expand `defi-strategy-config-widget` STAKED_BASIS schema** to the full v2 ~13-field set; add `use_aave_collateral` toggle; wire static Risk indicators to live fixture values. **P1 (gates manual configuration parity).**
8. **Configurable yield-chart baseline.** Same nit as YIELD_STAKING_SIMPLE §4b + YIELD_ROTATION_LENDING §4f. **P2.**

---

## 7. Verified-in-browser checklist

To run after blockers 6a.1–6a.5 land. Until then, marked **BLOCKED**.

- [ ] **BLOCKED (6a.1)** — Deploy `CARRY_STAKED_BASIS@lido-aave-hyperliquid-eth-prod` via `/trading/strategies/staked-basis`; all 5 emitted instructions (STAKE, LEND, BORROW, TRANSFER, TRADE) carry `strategy_id=CARRY_STAKED_BASIS@lido-aave-hyperliquid-eth-prod`.
- [ ] **BLOCKED (6a.2)** — Switch protocol to Jito; chain auto-flips to Solana; JitoSOL selectable; submit STAKE → Drift short perp round-trip; all 5 orders carry `@jito-kamino-drift-sol-prod` tag.
- [ ] **PARTIAL (6a.3)** — Toggle `use_aave_collateral=false`; flow collapses to 2-leg (STAKE → TRANSFER stable → TRADE); PLEDGE + BORROW steps skipped; Risk indicators hide HF panel.
- [ ] **BLOCKED (6a.4)** — Force `stETH/ETH` spread > 100 bps in fixture; depeg-monitor flips to alert; Emergency Exit button reachable from monitoring surface; unwind plan shows correct 5-leg reverse sequence.
- [ ] **BLOCKED (6a.5)** — Combined-APY decomposition shows `3.5% staking + 8% funding − 5.5% borrow = +6% net` per active instance; hides reward rows for Lido/Rocket/Jito/Marinade; shows EIGEN+ETHFI rows only for EtherFi.
- [ ] **PARTIAL** — HF dashboard shows `target=1.5`, `breach=1.2`, current HF; oracle vs market rate labelled with active LST (stETH, not weETH); gap alerts at kill-switch threshold.
- [ ] **PARTIAL** — Funding matrix shows current rate for active (coin, venue); threshold line at `exit_funding_rate_bps`; flip triggers exit CTA.
- [ ] ✅ — Per-chain wallet balances + gas-low warnings render in `defi-wallet-summary-widget` for Ethereum and Solana.
- [ ] ✅ — Trade history shows STAKE → LEND → BORROW → TRANSFER → TRADE sequence; expanded row shows child fills + instant P&L per leg.
- [ ] **BLOCKED (6b.3)** — Delta-drift widget shows `perp_notional − LST_balance*LST_rate`; hits 5% tier → REBALANCE suggestion surfaces in HF panel.
- [ ] **BLOCKED (6b.2)** — P&L attribution renders `staking_yield + funding_pnl − borrow_cost − gas − slippage` with correct sign per factor.

---

## 8. Open questions for user

1. **2-leg vs 3-leg scope.** v2 archetype doc treats Aave PLEDGE+BORROW as core; legacy docs + current UI deploy a 2-leg variant. Should the archetype UI present both behind a `use_aave_collateral` toggle (my assumption), treat the legacy 2-leg as a separate sub-archetype (e.g. `CARRY_STAKED_BASIS_UNPLEDGED`), or deprecate the 2-leg entirely?
2. **LST depeg monitor consolidation.** Build a generalised `defi-lst-depeg-monitor` serving YIELD_STAKING_SIMPLE + CARRY_STAKED_BASIS + CARRY_RECURSIVE_STAKED, or extend `defi-health-factor-widget` with an archetype-aware mode? Shared widget loses HF + spread + funding context; archetype-specific duplicates the peg math.
3. **Thesis-health pane consolidation.** Combine HF + depeg + funding + delta-drift into one `defi-carry-health-widget`, or keep them as four independent widgets? Single pane is better for operators; per-widget keeps separation of concerns.
4. **Reward-lifecycle gating.** For Lido/Rocket/Jito/Marinade variants, should reward-related widgets be hidden (cleaner) or shown with "N/A" state (consistent)? Reward-lifecycle doc says Lido has no reward token; same applies to the Solana LSTs.
5. **5-leg workflow widget vs linked-widgets.** Build a composite `defi-staked-basis-workflow` that orchestrates STAKE+PLEDGE+BORROW+TRANSFER+TRADE as one reviewable bundle, or continue with today's "link to Book, Positions, DeFi hub" pattern on the strategy page? Composite gives atomic-review UX; linked is already wired.
6. **Instance config SSOT.** Should the STAKED_BASIS form expose all ~13 v2 config fields in UI, or only the operator-tunable subset (leaving defaults like `execution_policy_ref` hidden)? Full exposure matches backend parity but crowds the form.

---

_Status: draft — awaiting user review before consolidating into central tracker and starting archetype #5 (CARRY_RECURSIVE_STAKED)._
