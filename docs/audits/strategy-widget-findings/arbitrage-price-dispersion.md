---
archetype: ARBITRAGE_PRICE_DISPERSION
status: draft-awaiting-review
---

# ARBITRAGE_PRICE_DISPERSION — Widget Audit

## 1. Archetype summary

**Thesis:** Detect and capture price dispersion for the same (or equivalent) instrument across venues or chains, net of fees + slippage + gas + bridge. Paired legs executed ATOMIC (same chain / same-venue multi-leg / flash-loan) or LEADER_HEDGE (cross-venue non-atomic). Edge is structural, not directional; latency-sensitive for fast venues, 1H for yield-spread variants.

**Position shape:** Paired legs, net-zero exposure. Leg A (long) at one venue/chain/contract; leg B (short or offsetting) at another. On success the net position returns to idle cash + realized spread. Cardinality per opp: 2 legs (cross-CEX spot, cross-DEX arb, sports cross-book, cross-chain yield-dispersion), or 3-4 legs (butterfly/calendar surface no-arb, cross-category prediction-market arb).

**P&L drivers:**

- Captured arb edge = `sum(received) − sum(paid) − sum(fees + slippage + gas + bridge + commission)` per opp
- Execution slippage = detected_spread − realized_spread (latency / queue-jumping / sandwich-MEV)
- Adverse-move unwind cost when LEADER_HEDGE hedge leg fails to fill inside `max_hedge_delay_ms`
- No directional drift (each opp ideally profitable in isolation; losses only from execution failure)

**Kill switches (per v2 archetype doc + legacy `sports/arbitrage.md`):**

- Abnormal dispersion > `MAX_ARB_MARGIN` (e.g. 5%) — likely broken feed / wrong fixture match / complement pricing
- Staleness > threshold between leg timestamps (`bm_time` diff > 30 s)
- Consecutive execution failures > threshold (flag venue health)
- Venue outage / bridge pause / sequencer downtime
- Same-operator correlation (both legs share a corporate group → not a true arb)
- Capital-in-transit > `max_concurrent_opps` × `max_capital_per_opp`

**UI-visible config knobs:** `opportunity_type`, `eligible_venues[]` (with `child_books` preference list for Unity), `eligible_markets[]`, `min_edge_bps` (default 50), `max_capital_per_opp_pct` (default 5%), `max_concurrent_opps` (default 10), `execution_ordering.mode` (ATOMIC | LEADER_HEDGE), `execution_ordering.leader`, `execution_ordering.hedge`, `execution_ordering.max_hedge_delay_ms`, `execution_ordering.abort_on_adverse_move_bps`, `execution_policy_ref`, `share_class`.

**Sources:**

- v2 SSOT: [architecture-v2/archetypes/arbitrage-price-dispersion.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/arbitrage-price-dispersion.md)
- Legacy (reference only): [sports/arbitrage.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/sports/arbitrage.md) · [defi/cross-chain-sor-rebalancing.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/cross-chain-sor-rebalancing.md) · [defi/cross-chain-yield-arb.md](../../../../unified-trading-pm/codex/09-strategy/_archived_pre_v2/defi/cross-chain-yield-arb.md)
- Cross-cutting: [execution-policies.md §LEADER_HEDGE + ATOMIC_MULTI_LEG](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/execution-policies.md) · [mev-protection.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/mev-protection.md)

**Scope clarification — what this archetype is NOT:**

- **Funding-rate carry between perp venues** (bidirectional funding capture held for hours/days) → `CARRY_BASIS_PERP`. This audit's funding-rate line item is _dispersion arb_ only (enter when funding spread > threshold, exit when it normalizes).
- **Liquidation snipe during cascades** → `LIQUIDATION_CAPTURE`.
- **Cointegrated pair trades (z-score reversion)** → `STAT_ARB_PAIRS_FIXED`.
- **Rebalancing capital to a better yield venue** (move USDC from Ethereum to Arbitrum because APY is higher) → `YIELD_ROTATION_LENDING`. The split per [MIGRATION.md §2](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md): _transient_ dispersion → here; _sustained_ rate spread → rotation. Decision key = holding period (hours to seconds ⇒ dispersion arb; days ⇒ rotation).

## 2. Concrete strategies in this archetype

Per [MIGRATION.md §2, §3, §8](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md), six legacy paths consolidate into `ARBITRAGE_PRICE_DISPERSION`:

| Legacy doc / class                                        | Scope                                                                                                          | v2 Example Instance                                                                                           | Execution mode                                          |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `sports/arbitrage.md` + `sports/arbitrage.py`             | 3-way cross-book + back-lay sports arb via Unity + Betfair/Smarkets/Matchbook/Pinnacle                         | `@unity-epl-1x2-usd-prod`, `@unity-nba-moneyline-usd-prod`, `@unity-champions-league-1x2-usd-prod`            | ATOMIC (within Unity); LEADER_HEDGE (direct multi-book) |
| `defi/cross-chain-sor-rebalancing.md` (dispersion subset) | Transient cross-chain APY dispersion captured as arb; rebalancing half split to Transfer/Rebalance service     | `@multi-dex-eth-usdc-ethereum-prod`, `@multi-dex-eth-usdc-arbitrum-prod`                                      | ATOMIC (single-chain, flash-loan optional)              |
| `defi/cross-chain-yield-arb.md` (transient subset)        | APY spread > threshold held for hours then unwound                                                             | Routed to this archetype when `holding_period < 24h`; else rotation                                           | LEADER_HEDGE (withdraw → bridge → supply)               |
| `cross_exchange_btc.py`                                   | Cross-CEX spot arb (Binance ↔ Bybit etc.)                                                                      | `@binance-bybit-btc-usdt-prod`, `@cross-cex-eth-usdt-prod`                                                    | LEADER_HEDGE                                            |
| `vol_surface_btc.py` (hard no-arb subset)                 | Within-surface butterfly / calendar / put-call-parity violations on Deribit                                    | `@deribit-btc-surface-noarb-usdt-prod`, `@deribit-eth-surface-noarb-usdt-prod`                                | ATOMIC (multi-leg bundle)                               |
| `prediction_arb_btc.py`                                   | Cross-category (Polymarket ↔ Unity/Betfair) correlated-market arb; cross-venue vol arb (Deribit ↔ OKX options) | `@polymarket-unity-elections-usdc-prod`, `@deribit-okx-btc-vol-usdt-prod`, `@multi-cex-btc-funding-usdt-prod` | LEADER_HEDGE                                            |

**Archetype doc lists 13 example instances** across 6 sub-patterns (sports cross-book, single-chain DEX, cross-CEX, cross-venue vol, within-surface no-arb, cross-category, funding-dispersion) — see [archetype doc §Example instances](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/arbitrage-price-dispersion.md).

**Sub-pattern matrix — each requires distinct UI coverage:**

| Sub-pattern                                                    | Leg topology                                | Atomicity                              | Latency class                       |
| -------------------------------------------------------------- | ------------------------------------------- | -------------------------------------- | ----------------------------------- |
| Sports cross-book (3-way)                                      | 3 legs, 1 per outcome, different bookmakers | ATOMIC via Unity / LEADER_HEDGE direct | Seconds (odds drift in ≤30 s)       |
| Sports back-lay                                                | 2 legs: back at bookmaker, lay at exchange  | LEADER_HEDGE (usually exchange-first)  | Seconds                             |
| Single-chain DEX arb (Uniswap ↔ Balancer, flash-loan optional) | 2-4 legs in one tx                          | ATOMIC (multicall ± flash-loan)        | 1 block (~12 s ETH)                 |
| Cross-CEX spot/perp (Binance ↔ Bybit)                          | 2 legs, different API endpoints             | LEADER_HEDGE                           | Sub-second                          |
| Cross-venue vol (Deribit ↔ OKX options)                        | 2 legs, different wallets                   | LEADER_HEDGE                           | Sub-second to seconds               |
| Within-surface no-arb (butterfly/calendar on Deribit)          | 3-4 legs, same venue multi-leg order        | ATOMIC (native multi-leg)              | Seconds                             |
| Cross-category (Polymarket ↔ Unity)                            | 2 legs, different asset classes             | LEADER_HEDGE                           | Seconds                             |
| Funding-rate dispersion (cross-CEX, hold until funding prints) | 2 legs paired perps                         | LEADER_HEDGE, then hold                | Seconds to enter; minutes to settle |

---

## 3. UI capability requirements

Grouped by **execute · monitor · support · exit**. Each capability must be fulfillable via UI so operators can trade manually and thereby verify the backend path is wired.

### 3a. Execute

- **Opportunity-type selector** — pick one of `CROSS_BOOK_SPORTS | CROSS_DEX_SPOT | CROSS_CEX_SPOT | CROSS_VENUE_VOL | SURFACE_NOARB | CROSS_CATEGORY | FUNDING_DISPERSION`; UI shape adapts per type.
- **Leg pair display** — for every opp, render **both legs side-by-side** with venue, instrument, side, size, quoted price/odds, fees; pre-submit shows `gross_spread → net_spread` decomposition.
- **ATOMIC bundle composer** — for same-chain DEX arb and within-surface no-arb, show the full multi-leg bundle as one reviewable unit (venue, action per leg, flash-loan wrapper if present) and submit as one atomic multicall / multi-leg order.
- **LEADER_HEDGE controls** — `leader` venue picker, `hedge` venue picker, `max_hedge_delay_ms` slider (default 500), `abort_on_adverse_move_bps` (default 10). Post-submit monitor of hedge fill latency.
- **Flash-loan toggle + wrapper preview** — for single-chain DEX arb, show the auto-prepended FLASH_BORROW leg + fee + auto-appended FLASH_REPAY (balance check).
- **Min-edge gate** — `min_edge_bps` input (default 50) and a live `net_edge vs min_edge` ticker. Opps below threshold grey out.
- **Max concurrent / max capital caps** — `max_concurrent_opps` (default 10) and `max_capital_per_opp_pct` (default 5%) configurable + enforced pre-submit against current open-opp count and equity.
- **Same-operator reject** — for sports, flag if two legs share a corporate group (`VENUE_OPERATOR_GROUPS`). Never a submittable state.
- **Suspicious-arb reject** — block opps with `gross_arb_pct > MAX_ARB_MARGIN` (e.g. 5%) with a clear "likely data error" explanation.
- **Staleness reject** — block if leg timestamps diverge > threshold (`bm_time` diff > 30 s or block-time diff > 2 blocks).
- **Strategy instance tag** on every emitted order and bundle — must match one of the 13 example instance IDs (e.g. `ARBITRAGE_PRICE_DISPERSION@binance-bybit-btc-usdt-prod`), not a generic venue string.
- **MEV-submission mode** — for DeFi swap legs, expose `mev_policy_ref` choice (`FLASHBOTS_PROTECT` / `PUBLIC_MEMPOOL` / `MEV_BLOCKER`) per [mev-protection.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/mev-protection.md). Default from policy; overridable for the current opp.
- **Execution-policy reference** — display active `execution_policy_ref` (e.g. `arb-fast-v2`) with read-only params so operator knows which rule table is active.

### 3b. Monitor

- **Cross-venue spread scanner** — primary surface. Grid of `(instrument × venue-pair)` with `gross_spread_bps`, deduction chips (fee / gas / bridge / commission), `net_edge_bps`, min-edge-threshold bar. Winner pairs highlighted; live row-level decay timer (arb half-life).
- **Active opp list** — in-flight opps grouped by sub-pattern with leader-leg fill state, hedge-leg fill state, hedge-latency timer, running edge vs detected edge.
- **Dispersion time-series** — per `(instrument, venue-pair)` historical spread with entry/exit markers; identifies regime (chronic vs episodic).
- **Cross-chain price dispersion heatmap** — same asset across chains (USDC price on Ethereum / Arbitrum / Base / Solana; wBTC / cbBTC) with current ppm divergence.
- **Cross-venue vol surface overlay** — IV comparison for same option strike between Deribit and OKX; spread in vol points + premium-USD equivalent.
- **Within-surface no-arb monitor** — butterfly / calendar / put-call-parity residuals on one venue (e.g. Deribit) in dollar-violation terms.
- **Opportunity frequency + bucket heatmap** — per sub-pattern and per venue-pair/bookmaker-type (legacy sports `arb_bucket`: `soft_sharp`, `sharp_sharp`, `soft_exchange`, etc.) with hit rate and mean realized edge.
- **Execution-quality waterfall per opp** — `detected_edge → leader_fill_slippage → bridge_cost → hedge_fill_slippage → gas → commission → realized_edge`. Points to which step is eating the edge.
- **Leader-hedge adverse-move tracker** — for each LEADER_HEDGE opp in flight, live ref-price delta vs trigger; breach triggers abort+unwind.
- **Per-venue-account capital utilization** — stake committed + available per venue; critical for sports (no intraday transfers — depleted venue = blocked opps).
- **Venue health + latency** — per-venue connectivity / endpoint latency / consecutive-failure counter with action-zone thresholds.
- **Bridge transit + in-flight capital** — for cross-chain arb, live transit list with ETA (shared capability with `YIELD_ROTATION_LENDING` audit §6b.2).
- **Kill-switch board** — single pane aggregating: abnormal dispersion flag, staleness breaches, same-operator rejects, consecutive-failure counter, venue outage flags.
- **P&L attribution per opp + rollup** — arb_edge_captured, execution_slippage, gas/fees/commission, adverse-move losses (LEADER_HEDGE aborts), cumulative net P&L since inception.

### 3c. Support

- **Per-venue / per-chain balance + gas** — same as other DeFi archetypes; but here "pre-funded on both legs" is a hard precondition (archetype doc §Opportunity validation). Widget must show "has leg-A capital AND leg-B capital" gate before an opp is submittable.
- **Approve-status matrix** — for DEX arbs, per-(DEX, chain, token) ERC-20 approval state; batch-approve helper.
- **Gas budget & gas-auction mode** — per opp, current chain gas price vs the `gas_budget_pct_of_edge` cap; for fast single-chain arb, a "priority gas" toggle (Flashbots bundle vs public mempool).
- **Venue-account health pre-flight** — margin health, rate-limit headroom, open-order slots, session freshness — pre-submit gate (per [venue-account-coordination.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/venue-account-coordination.md)).
- **Inventory rebalance between CEX accounts** — cross-CEX arb drains the leg-A venue and fills leg-B; UI needs a rebalance-across-CEX widget (not a DeFi bridge). Currently missing — captured in §6.
- **Correlation / operator group lookup** — for sports, surface which venues belong to the same operator group (`VENUE_OPERATOR_GROUPS`) so operators understand the reject reason.
- **Rebalance cadence + evaluation tick** — when `react_to_equity_change` fires, UI shows new `max_capital_per_opp`. Per archetype code: `max_capital_per_opp = new_equity * max_capital_per_opp_pct`.

### 3d. Exit

- **Per-opp exit semantics differ by mode:**
  - **ATOMIC:** no exit — entire bundle reverts on failure, cash restored. Only P&L settlement to display.
  - **LEADER_HEDGE:** mid-execution abort reachable if ref-price moves > `abort_on_adverse_move_bps` during hedge-delay window. Abort sequence unwinds whichever leg filled.
- **Emergency abort** for in-flight LEADER_HEDGE opps — one-click unwind of the filled leg at best available liquidity (accepts slippage).
- **Kill-switch-driven halt** — pause new opp generation (not the hedge-fill monitor) when: `consecutive_execution_failures > threshold`, abnormal-dispersion flag, venue outage, or operator pulls the plug.
- **Funding-dispersion exit** — for held funding-arb opps, auto-unwind when funding spread converges below exit threshold; same UI as entry but mirrored sides.
- **Partial-fill reconciliation** — show which leg partially filled, remaining quantity, and route to either complete-the-leg or unwind-the-filled portion.
- **P&L settlement confirmation** — per opp: `arb_edge_captured` vs `detected_edge` delta booked to `execution_slippage` attribution bucket.

---

## 4. Widget-by-widget verification

Legend: ✅ fits archetype · 🟡 partial / needs enhancement · ❌ does not serve this archetype · ➖ not applicable here

### 4a. Primary execute widgets

#### `sports-arb` → `ArbTab` / `ArbGrid` / `ArbStream` — 🟡 partial (sports sub-pattern only)

Files: [components/widgets/sports/sports-arb-widget.tsx](../../../components/widgets/sports/sports-arb-widget.tsx) · [components/trading/sports/arb-tab.tsx](../../../components/trading/sports/arb-tab.tsx) · [components/trading/sports/arb-grid.tsx](../../../components/trading/sports/arb-grid.tsx) · [components/trading/sports/arb-stream.tsx](../../../components/trading/sports/arb-stream.tsx)

What it does today (sports cross-book 3-way + 2-way only):

- ✅ Market selector (`FT Result`, `Over/Under 2.5`, `BTTS`) and min-arb-% threshold bar ([arb-tab.tsx:22-66](../../../components/trading/sports/arb-tab.tsx#L22-L66)).
- ✅ Bookmaker × outcome odds grid with best-odds highlight + arb-opportunity popover ([arb-grid.tsx:155-255](../../../components/trading/sports/arb-grid.tsx#L155-L255)).
- ✅ Live arb stream with decay-bar countdown (arb half-life visualized) and per-leg stake split ([arb-stream.tsx:19-41, 111-176](../../../components/trading/sports/arb-stream.tsx#L19-L41), [arb-stream.tsx:111-176](../../../components/trading/sports/arb-stream.tsx#L111-L176)).
- ✅ Place-bet action with stake split and profit-per-10k preview ([arb-grid.tsx:120-149](../../../components/trading/sports/arb-grid.tsx#L120-L149)).
- ✅ Subscribed-bookmaker gating via `SUBSCRIBED_BOOKMAKERS` ([arb-grid.tsx:170-178](../../../components/trading/sports/arb-grid.tsx#L170-L178)) — matches legacy "venue-allocation + floor" design.
- 🟡 **No same-operator check visible** — `VENUE_OPERATOR_GROUPS` reject path (legacy `sports/arbitrage.md §Step 3`) not surfaced. Two legs from the same operator group would silently appear as a valid arb.
- 🟡 **No staleness gate display** — `bm_time` divergence filter (legacy §Step 8) not shown; operator has no signal whether a flagged arb is stale.
- 🟡 **No suspicious-arb (>5%) reject** — `MAX_ARB_MARGIN` gate not visualized; an operator could place on what is likely a broken feed.
- 🟡 **Commission deduction implicit** — fees shown per bookmaker but not rolled into the displayed `arbPct`. Gross vs net-of-commission arb not distinguished in the grid cells ([arb-grid.tsx:201-212](../../../components/trading/sports/arb-grid.tsx#L201-L212) — `calcArbPct` uses raw odds only).
- 🟡 **No leader-hedge controls** — every sports arb is rendered as fire-and-forget "Place Arb"; there's no `exchange_first` vs `bookmaker_first` ordering toggle, no `max_hedge_delay_ms`, no `abort_on_adverse_move_bps`. Legacy doc explicitly names `execution_order: exchange_first` as configurable.
- 🟡 **No Unity meta-broker routing** — archetype doc primary instance set is `@unity-*`; current widget has no concept of Unity child-book preference list (`child_books` ordering). Everything today hits the direct-bookmaker grid.
- 🟡 **No venue-account capital visibility at the opp level** — arb-grid / arb-stream don't show whether the relevant two bookmakers have enough locked capital to place the stake split. Legacy design explicitly tracks `VenueBalance`.
- 🟡 **Arb-bucket classification missing** — legacy `soft_sharp / soft_soft / soft_exchange / sharp_sharp / exchange_sharp` buckets are not visible; operators can't filter/analyze opp quality by bookmaker type.
- ❌ **No strategy_instance tag** — `handlePlaceBet` posts to `/api/sports/bets` with fixture/market/arbPct/legs ([arb-stream.tsx:66-82](../../../components/trading/sports/arb-stream.tsx#L66-L82)) with no instance id. Orders cannot be attributed to `@unity-epl-1x2-usd-prod` vs `@unity-nba-moneyline-usd-prod`.
- ❌ **Sports-only scope** — widget is hard-coded to bookmakers/fixtures and covers only 2 of 8 sub-patterns from §2. DEX, cross-CEX, cross-venue vol, surface-noarb, cross-category, funding-dispersion — none have any UI.

**Gap → action:** Extend with operator-group reject chip, staleness timer, MAX-margin gate, arb-bucket column, Unity-mode routing, capital-availability pre-check, strategy_instance tag prop. Keep the grid+stream shape — it's the best pattern we have; but generalize so cross-CEX / cross-DEX / cross-venue vol sub-patterns can reuse the same shell.

#### `defi-flash-loans` → `DeFiFlashLoansWidget` — 🟡 partial (single-chain DEX arb)

File: [components/widgets/defi/defi-flash-loans-widget.tsx](../../../components/widgets/defi/defi-flash-loans-widget.tsx)

What it does today:

- ✅ Multi-step bundle composer with operation/venue/algo/slippage/asset/amount per step ([defi-flash-loans-widget.tsx:74-181](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L74-L181)) — matches the ATOMIC-multi-leg shape needed for single-chain DEX arb.
- ✅ Auto-prepended `FLASH_BORROW` + auto-appended `FLASH_REPAY` rendered as read-only wrapper panels ([defi-flash-loans-widget.tsx:44-65, 189-201](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L44-L65), [L189-L201](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L189-L201)).
- ✅ P&L preview panel: `grossProfit - flashFee - gasEstimate = netPnl` ([defi-flash-loans-widget.tsx:203-218](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L203-L218)) — edge-vs-cost decomposition required by archetype.
- ✅ `is_atomic: true` set on emitted order ([defi-flash-loans-widget.tsx:246](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L246)) — aligns with archetype's ATOMIC mode.
- 🟡 **No `min_edge_bps` gate enforcement** — `netPnl` can be negative and the button still submits. Archetype requires `if net_spread > min_edge_threshold` precondition.
- 🟡 **Flash parameters hard-coded** — `100 ETH @ 0.05%` on Aave V3 ([defi-flash-loans-widget.tsx:56-62](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L56-L62)) regardless of bundle content; operator can't scale the flash size to the opp or pick Balancer (zero-fee flash).
- 🟡 **Simulate button is a no-op** ([defi-flash-loans-widget.tsx:221-224](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L221-L224)) — critical for flash-loan arb where simulation (Tenderly / eth_call) is the pre-submit sanity check. Labeled but not wired.
- 🟡 **No MEV-submission-mode selector** — flash-loan DEX arb is the archetypal MEV target (sandwich risk). Per [mev-protection.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/mev-protection.md) the default for large DeFi swaps is `FLASHBOTS_PROTECT`; widget has no way to express this.
- 🟡 **No venue-pair hint** — flash-loan arb is cross-DEX (Uniswap ↔ Balancer etc.); widget treats each step independently, doesn't surface the implied pair or link it to the dispersion scanner.
- ❌ **Hardcoded `strategy_id: "AAVE_LENDING"`** at [defi-flash-loans-widget.tsx:233](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L233) regardless of opp. Shared blocker with YIELD_ROTATION_LENDING §6a.1. Must become `ARBITRAGE_PRICE_DISPERSION@multi-dex-eth-usdc-ethereum-prod` (etc.) from the active opp context.
- ❌ **No read-only execution-policy display** — operator can't see which `execution_policy_ref` (e.g. `arb-fast-v2`) is active.

**Gap → action:** Wire `Simulate` button to a mock-simulation path; enforce `min_edge_bps` as submit gate; replace hardcoded strategy_id with opp-sourced instance id; add MEV-mode selector; surface flash-loan size + venue as bundle-level config (not buried).

#### `defi-swap` → `DeFiSwapWidget` — 🟡 partial (DEX leg for cross-DEX arb)

File: [components/widgets/defi/defi-swap-widget.tsx](../../../components/widgets/defi/defi-swap-widget.tsx)

- ✅ Per-venue SOR fill breakdown (alloc%, fill price, impact bps, fee, gas) at [defi-swap-widget.tsx:261-339](../../../components/widgets/defi/defi-swap-widget.tsx#L261-L339) — this is the closest thing we have to a per-opp leg-level edge decomposition.
- ✅ Algo select incl. `SOR_DEX` / `SOR_TWAP` / `SOR_CROSS_CHAIN` at [defi-swap-widget.tsx:190-204](../../../components/widgets/defi/defi-swap-widget.tsx#L190-L204).
- 🟡 **SOR here is "best-price single-direction swap", not "paired arb legs"** — widget aggregates venues for the same side, not two opposite-side legs. A cross-DEX arb operator would have to submit two separate swaps with no atomicity guarantee.
- ❌ **Hardcoded mode-based `strategy_id: "BASIS_TRADE" | "STAKED_BASIS" | "AAVE_LENDING"`** at [defi-swap-widget.tsx:348](../../../components/widgets/defi/defi-swap-widget.tsx#L348) — no `ARBITRAGE_PRICE_DISPERSION` branch. Shared blocker from YIELD_ROTATION_LENDING §6a.1.
- ❌ **No MEV-submission-mode control** — swap widget is a primary sandwich-attack surface; widget offers only slippage%, never the private-relay choice that [mev-protection.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/mev-protection.md) declares mandatory for ETH large swaps.

**Gap → action:** Acceptable as a single-leg execution primitive. For cross-DEX arb, a pairing orchestrator must sit above it (captured in §6). Fix strategy_id blocker, add MEV mode.

#### `defi-basis-trade` → `DeFiBasisTradeWidget` — ➖ not applicable

File: [components/widgets/defi/defi-basis-trade-widget.tsx](../../../components/widgets/defi/defi-basis-trade-widget.tsx). Emits `strategy_id: "BASIS_TRADE"` for funding-carry ([defi-basis-trade-widget.tsx:90](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L90)); that's `CARRY_BASIS_PERP`, not this archetype. Relevant _only_ for the funding-dispersion sub-pattern when used in enter-exit-on-convergence mode — no UI affordance exists for that mode today.

### 4b. Primary monitor widgets

#### `defi-funding-matrix` → `DeFiFundingMatrixWidget` — 🟡 partial (funding-dispersion only)

File: [components/widgets/defi/defi-funding-matrix-widget.tsx](../../../components/widgets/defi/defi-funding-matrix-widget.tsx)

- ✅ `(coin × venue)` matrix with best-venue-per-coin highlighted ([defi-funding-matrix-widget.tsx:29-45, 94-113](../../../components/widgets/defi/defi-funding-matrix-widget.tsx#L29-L45), [L94-L113](../../../components/widgets/defi/defi-funding-matrix-widget.tsx#L94-L113)) — shape matches the dispersion scanner this archetype needs.
- 🟡 **Best single venue, not best pair** — for arb we need `(coin × venue-pair)` with `venue_A_rate − venue_B_rate` as the cell value. Current shape picks a single "best" per coin, useful for carry but not for dispersion-edge capture.
- 🟡 **No net-edge column** — gross funding only; no deduction for gas + commission + expected hedge slippage.
- 🟡 **No threshold overlay** — `min_edge_bps` not rendered as a line on the cell coloring scale.
- ❌ **No action from matrix** — can't click a dispersion cell to open an arb opp.

**Gap → action:** Pivot to `(coin × venue-pair)` view; add net-of-cost column; make cells clickable into an opp builder. Or keep this one as the carry view and build a sibling `arb-dispersion-matrix` for this archetype.

#### `defi-rates-overview` → `DeFiRatesOverviewWidget` — 🟡 partial (cross-chain yield dispersion)

File: [components/widgets/defi/defi-rates-overview-widget.tsx](../../../components/widgets/defi/defi-rates-overview-widget.tsx)

- ✅ Lending / staking / LP rows with APY + TVL + max-APY KPI ([defi-rates-overview-widget.tsx:56-117](../../../components/widgets/defi/defi-rates-overview-widget.tsx#L56-L117) — adjacent impl; shape confirmed in YIELD_ROTATION_LENDING §4b).
- 🟡 Flat list, not a pair-wise dispersion matrix. Useful as a raw rates reference; not the "where's the widest transient spread" surface.
- 🟡 **No time-derivative** — dispersion arb fires on spread _persistence + magnitude_; current widget is snapshot-only. Legacy `cross-chain-yield-arb.md §Decision framework` requires holding-period-aware evaluation.

**Gap → action:** Complement with a pair-wise dispersion matrix + spread time-series (captured in §6).

#### `defi-trade-history` → `DeFiTradeHistoryWidget` — ✅ fits (per-opp attribution)

File: [components/widgets/defi/defi-trade-history-widget.tsx](../../../components/widgets/defi/defi-trade-history-widget.tsx)

- ✅ Per-instruction P&L decomposition with gas, fees, slippage, alpha columns ([defi-trade-history-widget.tsx:1-30, 63-80](../../../components/widgets/defi/defi-trade-history-widget.tsx#L1-L30), [L63-L80](../../../components/widgets/defi/defi-trade-history-widget.tsx#L63-L80)) — matches the archetype's `arb_edge_captured / execution_slippage / gas / fees` attribution.
- 🟡 Per-instruction, not per-opp — an ATOMIC arb bundle is N rows with no "group by opp" link; LEADER_HEDGE leg + hedge appear as two separate rows without a pairing key.
- 🟡 No `detected_edge vs realized_edge` column — critical for arb attribution per archetype doc §P&L attribution.

**Gap → action:** Add an `opp_id` grouping column and fold the ATOMIC/LEADER_HEDGE bundle into a single expandable row with detected vs realized edge.

### 4c. Supporting widgets

#### `defi-wallet-summary` — ✅ fits (DeFi-side capital check)

Same as in YIELD_STAKING_SIMPLE / YIELD_ROTATION_LENDING audits — per-chain balance + gas-low flags serve as the leg-A/leg-B capital check for DEX / cross-chain arb. No archetype-specific issues.

#### `defi-transfer` → `DeFiTransferWidget` — 🟡 partial (cross-chain arb bridge leg)

File: [components/widgets/defi/defi-transfer-widget.tsx](../../../components/widgets/defi/defi-transfer-widget.tsx)

- ✅ Bridge flow with route preview (fee / time / best-return) — matches cross-chain dispersion-arb BRIDGE leg.
- ❌ **Hardcoded `strategy_id: "AAVE_LENDING"`** (send path) at [defi-transfer-widget.tsx:220](../../../components/widgets/defi/defi-transfer-widget.tsx#L220) and **`"CROSS_CHAIN_SOR"`** (bridge path) at [defi-transfer-widget.tsx:387](../../../components/widgets/defi/defi-transfer-widget.tsx#L387). Shared blocker. When used as a cross-chain arb leg the tag must be `ARBITRAGE_PRICE_DISPERSION@<instance>`.
- 🟡 **No bridge-transit monitor** — same gap as YIELD_ROTATION_LENDING §6b.2; in-flight capital is opaque.

**Gap → action:** Fix strategy_id from context; share bridge-transit widget with rotation archetype.

#### `defi-strategy-config` — ✅ fits (config surface)

Suitable for displaying `min_edge_bps`, `max_capital_per_opp_pct`, `execution_ordering.*`, `execution_policy_ref` once backend wires them. No implementation changes visible; deferred until strategy instance is backend-registered.

### 4d. Widgets out of scope

| Widget                                      | Why it doesn't apply                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `defi-staking`, `defi-staking-rewards`      | Yield archetype surface                                                                                |
| `defi-lending`                              | Rotation archetype surface; `BORROW`/`REPAY` only relevant to recursive/flash-borrow, not arb itself   |
| `defi-liquidity`                            | Market-making archetype (LP provision), not arb                                                        |
| `defi-yield-chart`, `defi-reward-pnl`       | Yield/reward attribution, not structural-edge capture                                                  |
| `defi-health-factor`                        | Recursive-staking specific; no leverage in this archetype                                              |
| `enhanced-basis-widget`, `defi-basis-trade` | Carry archetype                                                                                        |
| `defi-waterfall-weights`                    | Two-pillar coin/venue weights — could be repurposed for per-opp-type capital allocation, but not today |

### 4e. Fixture coverage — 🟡 blocker

- Sports arb stream mock has 4 entries ([lib/mocks/fixtures/sports-data.ts:1233-1344](../../../lib/mocks/fixtures/sports-data.ts#L1233-L1344)); covers only cross-book sports sub-pattern. No fixtures for: cross-DEX arb, cross-CEX arb, cross-venue vol, surface-no-arb, cross-category, funding-dispersion.
- No cross-venue dispersion matrix fixture (would populate `(instrument × venue-pair)` view).
- No fixture with `opp_id`, `leader_venue`, `hedge_venue`, `max_hedge_delay_ms`, `abort_on_adverse_move_bps` fields.
- No fixture exposing same-operator rejects, staleness rejects, or MAX-margin rejects.

---

## 5. Codex updates proposed

Minimal — v2 archetype doc is well-scoped. Additions:

1. **Add to [arbitrage-price-dispersion.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/arbitrage-price-dispersion.md) §Config schema**: `staleness_threshold_ms` (default 30 000) and `max_arb_margin_bps` (default 500) as explicit config fields. Legacy `sports/arbitrage.md §Step 7-8` uses these; v2 doc mentions "abnormal dispersion" as a kill switch but not the threshold value.
2. **Add to same doc §Execution semantics**: explicit note that `same_operator_reject` is an archetype-level invariant (not just sports-specific) — e.g. cross-CEX operators may share corporate parent (Binance ↔ Binance.US); must be venue-capability-registry gated.
3. **Add to same doc §UI visualization (new section if absent)**: per-opp decomposition pattern (`detected_edge → leg fills → bridge/gas → realized_edge → slippage-attribution`) as SSOT for widget output shape. Prevents every widget family reinventing the decomposition.
4. **MIGRATION.md §4** already routes `vol_surface_btc.py` as "TBD arb vs vol trading"; note that **hard no-arb violations (butterfly/calendar/put-call parity)** go here — archetype doc mentions these in §Supported scenarios but MIGRATION text still says `!`.

---

## 6. Gaps summary

### 6a. Blockers (must-fix before archetype is UI-complete)

1. **No cross-venue dispersion scanner widget.** Current `defi-funding-matrix` is single-best-per-coin; `defi-rates-overview` is a flat table. Neither renders `(instrument × venue-pair)` with `gross_spread → net_edge` decomposition. **Primary monitor surface for this archetype is missing.** Candidate: new `cross-venue-dispersion-matrix-widget` with sub-pattern filter (spot / perp-funding / vol / yield / cross-chain-price). **P0.**
2. **Hardcoded `strategy_id` in 4 execute widgets.** Shared with YIELD_ROTATION_LENDING §6a.1. Affects: [defi-flash-loans-widget.tsx:233](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L233) (`"AAVE_LENDING"`), [defi-swap-widget.tsx:348](../../../components/widgets/defi/defi-swap-widget.tsx#L348) (mode-based), [defi-transfer-widget.tsx:220](../../../components/widgets/defi/defi-transfer-widget.tsx#L220) (`"AAVE_LENDING"`), [defi-transfer-widget.tsx:387](../../../components/widgets/defi/defi-transfer-widget.tsx#L387) (`"CROSS_CHAIN_SOR"`); sports arb posts no instance id at all ([arb-stream.tsx:66-82](../../../components/trading/sports/arb-stream.tsx#L66-L82)). Every emitted order for this archetype is mis-attributed or untagged. Fix: accept `strategy_id` from host surface context, resolve from active instance.
3. **No LEADER_HEDGE control surface.** Zero widgets expose `leader`, `hedge`, `max_hedge_delay_ms`, `abort_on_adverse_move_bps`, or adverse-move live tracker. This is the archetype's default execution mode for the majority of sub-patterns (cross-CEX, cross-venue vol, cross-category, sports direct). Candidate: new `leader-hedge-execution-widget`. **P0.**
4. **No opportunity-pair composer for non-sports sub-patterns.** DEX-pair / CEX-pair / vol-pair / cross-category UX does not exist. Sports has `ArbGrid + ArbStream` but no equivalent exists for crypto or options. **P0.**
5. **Fixture coverage at 1 of 8 sub-patterns.** Only cross-book sports has mock data; cross-DEX, cross-CEX, cross-venue vol, surface-no-arb, cross-category, funding-dispersion, cross-chain-price — all zero fixtures. Blocks §7 checklist for 7 of 8 sub-patterns.
6. **Sports arb gate-fails not surfaced.** Same-operator reject, staleness gate, MAX-margin reject — three of the four legacy gates (`sports/arbitrage.md §Step 3, 7, 8`) have no UI representation. Operators could submit on invalid opps today.

### 6b. Enhancement wishlist (non-blocking but high-value)

1. **Simulate button wired to dry-run path** on `defi-flash-loans-widget` ([defi-flash-loans-widget.tsx:221-224](../../../components/widgets/defi/defi-flash-loans-widget.tsx#L221-L224)) — returns expected bundle outcome (or revert reason). **P1.**
2. **MEV-submission-mode selector** on every DeFi swap/flash-loan widget (per [mev-protection.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/mev-protection.md)). Default from active `mev_policy_ref`; overridable per opp. **P1.**
3. **Execution-quality waterfall per opp** — `detected_edge → leader_fill → hedge_fill → gas/bridge/commission → realized_edge`. Extension of `defi-trade-history` row expansion. **P1.**
4. **Arb-bucket classifier chip** (`soft_sharp / sharp_sharp / soft_exchange / ...`) on sports grid + stream — legacy attribute not rendered. **P2.**
5. **Unity meta-broker routing mode** in sports arb widget (`child_books` preference, Unity-wallet atomic routing) — v2 routes sports primarily through Unity. **P1.**
6. **Venue-account capital pre-check** on each opp card — both legs funded? If not, greyed out. Pull from `venue-account-coordination` pre-flight. **P1.**
7. **Cross-CEX inventory-rebalance widget** — counterpart to `defi-transfer-widget` for CEX↔CEX moves (withdraw BTC from Binance, deposit to Bybit). Drains as opps fire; no UI today. **P2.**
8. **Bridge-transit monitor** — shared with YIELD_ROTATION_LENDING §6b.2; in-flight capital visibility. **P1.**
9. **Within-surface no-arb monitor widget** — butterfly / calendar / put-call-parity violation residuals on a single options venue; distinct shape from cross-venue dispersion matrix. **P2.**
10. **Opportunity-frequency heatmap** — per sub-pattern × venue-pair, hit-rate + mean realized edge over window. Analytics surface; comparable to legacy §UI Visualisation "arb bucket heatmap". **P2.**
11. **Kill-switch board widget** — aggregates consecutive-failure counter, abnormal-dispersion flags, venue-outage states in a single pane. Shared with other archetypes. **P2.**

---

## 7. Verified-in-browser checklist

Golden-path scenarios once blockers 6a.1–6a.4 land. Until then, marked **BLOCKED**.

1. **PARTIAL** — Sports cross-book arb via `sports-arb` widget: opens an opp from `MOCK_ARB_STREAM`, renders stake split, "Place Arb" toasts. Missing: strategy-instance tag, operator-group reject, staleness gate, MAX-margin gate (all 6a.6 / 6a.2).
2. **BLOCKED** — Unity meta-broker routing path: operator picks a sports opp and the widget routes through Unity with `child_books` preference list instead of direct-book legs.
3. **BLOCKED** — Single-chain cross-DEX arb via `defi-flash-loans-widget`: FLASH_BORROW → SWAP (Uniswap) → SWAP (Balancer) → FLASH_REPAY; Simulate reveals expected net edge; submit emits `ARBITRAGE_PRICE_DISPERSION@multi-dex-eth-usdc-ethereum-prod` with `is_atomic: true`. Currently submits as `"AAVE_LENDING"` (6a.2).
4. **BLOCKED** — Cross-CEX spot arb (Binance ↔ Bybit BTC-USDT): dispersion matrix shows the `(BTC-USDT × binance-bybit)` cell with net edge > `min_edge_bps`; operator opens LEADER_HEDGE composer; submit fires leader leg; hedge-latency timer ticks down; hedge fills; realized edge settled. No widget today (6a.1, 6a.3, 6a.4).
5. **BLOCKED** — Cross-venue vol arb (Deribit ↔ OKX BTC options): IV dispersion surface shows mismatch on a specific strike; operator reviews 2-leg options trade with LEADER_HEDGE semantics. No widget today.
6. **BLOCKED** — Within-surface no-arb (Deribit butterfly): surface-no-arb monitor flags dollar violation; operator submits ATOMIC multi-leg bundle via a Deribit native combo order. No widget today.
7. **BLOCKED** — Cross-category arb (Polymarket ↔ Unity correlated market): matrix shows dispersion; 2-leg LEADER_HEDGE. No widget today.
8. **BLOCKED** — Funding-rate dispersion on `defi-funding-matrix`: operator filters by `(venue-pair, coin)` with `net_funding_spread > min_edge_bps`; opens opp; holds until convergence; auto-unwind on exit threshold (6a.1 — matrix is wrong shape).
9. **BLOCKED** — Cross-chain price dispersion (USDC on Ethereum vs Arbitrum > ppm threshold): bridge-aware arb composer shows withdraw-bridge-deposit sequence with net edge after bridge cost; emits `ARBITRAGE_PRICE_DISPERSION@multi-dex-eth-usdc-arbitrum-prod` (6a.1, 6a.2).
10. **PARTIAL** — Attribution: `defi-trade-history` shows per-instruction fills with slippage/gas/fees; but no `opp_id` grouping to roll the ATOMIC/LEADER_HEDGE legs into a single per-opp row with `detected_edge vs realized_edge` (6b.3).
11. **BLOCKED** — Kill-switch trip: consecutive-failure counter > threshold → UI halts new opp generation; banner surfaces until operator clears (6b.11).
12. ✅ — Per-chain wallet balance + gas-low warnings render in `defi-wallet-summary-widget` for all `eligible_venues` chains (shared with other DeFi archetypes).

---

## 8. Open questions for user

1. **Scanner widget topology** — one generalized `cross-venue-dispersion-matrix-widget` covering all 8 sub-patterns with a sub-pattern filter, or 3–4 specialised widgets (sports vs crypto spot/perp vs options-vol vs yield)? Single generalized matches DRY; specialised better matches operator mental model per sub-pattern.
2. **LEADER_HEDGE UX** — build a dedicated `leader-hedge-execution-widget` as a composite reviewable unit, or extend each leg widget (`defi-swap`, a future `cefi-trade-widget`, sports arb) with a "hedge mode" so the LEADER_HEDGE pair lives inside the leg widget? Composite is cleaner separation, but duplicates venue-specific UX.
3. **Sports arb widget generalization vs new widgets** — generalize `sports-arb` shell (grid + stream + decay bar) to serve cross-CEX / cross-venue vol opp browsing, or keep it sports-specific and build parallel widgets per sub-pattern? Generalization is expensive but reduces long-term UI surface.
4. **Unity routing** — should Unity meta-broker routing be an `execution_policy_ref` detail surfaced read-only, or an explicit top-of-widget mode switch (`Unity Mode` vs `Direct Mode`)? Legacy sports had both flows; archetype §Supported scenarios makes Unity the default.
5. **Funding-dispersion boundary** — at what exit threshold do we hand off a held funding-dispersion opp back to `CARRY_BASIS_PERP` (which also uses funding spread as alpha)? Decision criterion is `holding_period` but no exact cutoff is specified in v2 doc. Needed to avoid double-attribution when the same paired position conceptually straddles both archetypes.
6. **MEV policy — per-archetype default** — archetype doc gives `execution_policy_ref` at instance level but does not mandate `mev_policy_ref`. For DEX legs in this archetype, is the default `FLASHBOTS_PROTECT` (per mev-protection.md) or is competitiveness (speed) prioritized, matching LIQUIDATION_CAPTURE's `PUBLIC_MEMPOOL` default? Needs explicit decision before widget builds the dropdown.
7. **Same-operator groups** — is the `VENUE_OPERATOR_GROUPS` registry available in the UI runtime today, or does this need a new fixture plus a capability-registry endpoint? Gates whether reject chip is implementable in BP-3 or deferred.

---

_Status: draft — awaiting user review at §5a checkpoint before consolidating into central tracker and starting archetype #4._
