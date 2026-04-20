---
archetype: CARRY_BASIS_DATED
status: draft-awaiting-review
---

# CARRY_BASIS_DATED — Widget Audit

## 1. Archetype summary

**Thesis:** Long spot + short **dated** future (fixed expiry) — captures the futures-over-spot premium (contango) or
discount (backwardation) as the spread converges to zero at expiry. Delta-neutral term-structure carry. Distinct from
`CARRY_BASIS_PERP` (funding-rate carry on perpetuals): dated basis has a **known maturity**, convergence is mechanical,
and rolling is a first-class lifecycle event rather than a continuous operation.

**Position shape:** Paired two-leg instance. `spot_instrument` (long) + `future_instrument` (short) at
`-target_notional`. Legs entered atomically (`ATOMIC` same-venue) or `LEADER_HEDGE` cross-venue. Held until spread
collapses below `exit_basis_bps`, until expiry (auto-settlement), or until a kill-switch fires.

**P&L drivers:**

- **Basis convergence** — locked-in `(F − S)` × notional captured at exit/expiry (primary alpha)
- **Carrying cost** — borrow/funding cost of the spot leg; storage cost for physical commodities
- **Roll slippage** when held across expiry via the `-dated-` rolling convention
- **Commissions + execution alpha** on each leg

**Kill switches (from archetype doc §Risk profile):**

- Basis widens beyond configured max before convergence (adverse carry)
- Venue outage on either leg
- One-leg liquidity collapse (unable to exit at fair mid)
- Roll failure — `max_roll_slippage_bps` breached on the calendar-spread combo leg

**UI-visible config knobs:** `spot_venue`, `spot_instrument`, `future_venue`, `future_instrument`, `share_class`,
`min_entry_basis_bps`, `exit_basis_bps`, `max_allocated_equity_pct`, `rollover_days_before_expiry`,
`execution_policy_ref`.

**Sources:**

- v2 SSOT: [architecture-v2/archetypes/carry-basis-dated.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-basis-dated.md)
- Coverage + slot labels: [category-instrument-coverage.md §5 CARRY_BASIS_DATED](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/category-instrument-coverage.md#5-carry_basis_dated)
- Rolling spec: [cross-cutting/futures-roll-and-combos.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/futures-roll-and-combos.md)
- Execution policy framework: [cross-cutting/execution-policies.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/execution-policies.md)

## 2. Concrete strategies in this archetype

**This is a parked-placeholder archetype.** Per [archetype doc §Migration from legacy](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-basis-dated.md):

> No dedicated legacy doc. Crypto dated basis is rare (perp variant more common — see CARRY_BASIS_PERP). TradFi
> dated basis is a new codified archetype under v2.

Per [MIGRATION.md §2](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md) and
[MIGRATION.md §8](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/MIGRATION.md) the legacy `defi/`
basis docs and `strategy-service/engine/strategies/defi/basis_trade.py` / `btc_basis_trade.py` / `l2_basis.py` /
`sol_basis.py` all route to `CARRY_BASIS_PERP` — **none** land in `CARRY_BASIS_DATED`. There is no legacy Python
class, no legacy YAML config under `e2e-testing/configs/defi/strategies/`, and no entry in the legacy `defi/` doc
set that maps to this archetype. Crypto dated basis is documented in coverage as `PARTIAL` on CeFi (BTC/ETH Deribit
dated + Binance/Coinbase spot); TradFi dated basis is `PARTIAL` (CME ES / NQ / GC / CL paired with IBKR or CME spot
ETFs) — coverage doc explicitly flags _"IBKR ↔ CME cross-venue routing policy not declared"_ as a blocker.

Example instances are defined on paper only — archetype doc §Example instances +
[category-instrument-coverage.md §5](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/category-instrument-coverage.md#5-carry_basis_dated):

| Instance ID                                                   | Spot venue     | Future venue  | Underlying  | Roll mode                   |
| ------------------------------------------------------------- | -------------- | ------------- | ----------- | --------------------------- |
| `CARRY_BASIS_DATED@binance-deribit-btc-dated-usdt-prod`       | Binance spot   | Deribit dated | BTC         | rolling (`-dated-`)         |
| `CARRY_BASIS_DATED@binance-deribit-eth-dated-usdt-prod`       | Binance spot   | Deribit dated | ETH         | rolling (`-dated-`)         |
| `CARRY_BASIS_DATED@coinbase-deribit-btc-dated-usd-prod`       | Coinbase spot  | Deribit dated | BTC         | rolling (`-dated-`)         |
| `CARRY_BASIS_DATED@ibkr-cme-spy-es-dated-usd-prod`            | IBKR SPY ETF   | CME ES future | S&P 500     | rolling (`-dated-`)         |
| `CARRY_BASIS_DATED@ibkr-cme-qqq-nq-dated-usd-prod`            | IBKR QQQ ETF   | CME NQ future | Nasdaq 100  | rolling (`-dated-`)         |
| `CARRY_BASIS_DATED@ibkr-ice-brent-dated-usd-prod`             | IBKR Brent ETF | ICE Brent     | Brent crude | rolling (`-dated-`)         |
| `CARRY_BASIS_DATED@cme-cl-front-second-usd-prod`              | CME CL front   | CME CL second | WTI crude   | calendar spread (intra-CME) |
| `CARRY_BASIS_DATED@binance-deribit-btc-fixed-dec25-usdt-prod` | Binance spot   | Deribit DEC25 | BTC         | expiry-targeted (no roll)   |

**Two lifecycle modes:**

- **`-dated-` rolling-continuous** — strategy trades "the front" and rolls automatically when
  `REPRESENTATIVE_FUTURE_CHANGED` event fires (spec in
  [cross-cutting/futures-roll-and-combos.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/futures-roll-and-combos.md)).
- **`-fixed-{contract}-` expiry-targeted** — strategy trades a specific contract to a specific expiry; no roll;
  closes at convergence or at expiry.

Each mode implies different UI affordances (roll preview + combo-order review for rolling; expiry countdown for
fixed). Neither is exercisable via UI today — see §4.

---

## 3. UI capability requirements

Grouped by **execute · monitor · support · exit**. Because there is no concrete deployed instance, this section
describes the capabilities that **would be required** if the archetype were activated. Many are inherited from
`CARRY_BASIS_PERP` (paired leg execution, delta-neutral monitor); the archetype-specific additions are expiry-aware.

### 3a. Execute

- **Pick instance** — single-select from the dated-instance registry; chooses spot venue, future venue, underlying,
  and roll mode (rolling vs fixed) in one affordance
- **Instance-driven contract resolution** — for `-dated-` mode, pull `current_representative_future` from
  representative-future-service; for `-fixed-` mode, surface the targeted contract code + days-to-expiry
- **PAIRED ENTRY action** — single confirm that emits `ATOMIC(spot_buy, future_sell)` at `target_notional =
allocated_equity * max_allocated_equity_pct`; shows both legs + estimated fill spread pre-submit
- **Basis entry gate** — hide/disable the entry action when `observed_basis_bps < min_entry_basis_bps` (after
  modeled costs)
- **Execution-mode selector (read-only indicator)** — `ATOMIC` if both legs on the same venue (e.g. Deribit combo
  market), `LEADER_HEDGE` if cross-venue (e.g. Binance spot + Deribit dated); reflects the archetype's execution
  semantics
- **Roll preview + confirm** (rolling mode only) — surfaces the combo order (`close prior_contract` +
  `open new_contract`) with synthetic fair-value mid and `max_roll_slippage_bps` guard; operator confirms once,
  execution-service picks listed combo / synthetic combo / LEADER_HEDGE per the
  [futures-roll-and-combos.md §6 path](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/futures-roll-and-combos.md)
- **Strategy instance tag** on every emitted `TRADE` / `ATOMIC` / `FUTURES_ROLL` order — must match the full
  archetype@instance id, not a generic `"BASIS_TRADE"` string
- **Pre-submit cap check** against `max_allocated_equity_pct` (default 0.20 per archetype doc `config schema`)

### 3b. Monitor

- **Basis spread readout per instance** — `(F − S) / S` in bps; vs `min_entry_basis_bps` (entry band) and
  `exit_basis_bps` (exit band); primary decision variable
- **Term-structure strip** — the full (expiry × mid) curve per underlying showing contango/backwardation shape, with
  the active contract flagged and a days-to-expiry annotation on each node
- **Annualised basis** — `basis_bps × (365 / days_to_expiry)` for like-for-like comparison with perp funding APY
- **Days-to-expiry countdown** on the active contract; alarm when `days_to_expiry <= rollover_days_before_expiry`
- **Convergence chart** — `(F − S)` over time with overlay line showing linear decay to zero at expiry; deviation
  from theoretical = the alpha still to capture
- **Per-leg mark + PnL** — spot leg mark, future leg mark, net delta (should be ~0), and instance-level carry accrued
  (`initial_basis − current_basis`) × notional
- **Liquidity / OI per contract** — open interest, 24h volume, depth at top-5 levels (feeds the
  representative-future selection; operator should see why the current representative is the winner)
- **Representative-future tick history** — list of recent `REPRESENTATIVE_FUTURE_CHANGED` events for subscribed
  underlyings (when did we roll, to what, with what slippage)
- **Roll P&L ledger** — per-roll executed spread vs synthetic fair value, slippage_bps, accumulated roll cost over
  position lifetime — is rolling costing more than the basis captured?
- **Kill-switch state** — basis-widening breach, venue outage, liquidity collapse, roll failure

### 3c. Support

- **Margin / collateral readout** — required margin for the short future leg on the future venue; available cash on
  the spot venue; cross-venue margin netting indicator when applicable (e.g. Deribit portfolio margin)
- **Venue-account transfer** — funds between spot venue and future venue before PAIRED ENTRY (capital support; see
  [cross-cutting/venue-account-coordination.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/venue-account-coordination.md))
- **Rebalance trigger** — when `react_to_equity_change` fires, preview the delta: new `target_notional` on both legs
  scaled to the new equity; emit paired rebalance
- **Allocator integration** — unlike yield archetypes, basis-dated instances are bounded by
  `max_allocated_equity_pct` and often run as a small slice of a larger book; rebalance preview must show the
  instance-level delta, not the portfolio delta
- **Execution policy reference** — surface the active `execution_policy_ref` (e.g. `tradfi-paired-basis-v2`) as a
  read-only tooltip for operator context

### 3d. Exit

Three distinct exit paths from archetype doc §Token flow step 4:

- **Convergence exit** — when `observed_basis_bps < exit_basis_bps`, close both legs as a paired unwind (same
  ATOMIC / LEADER_HEDGE shape as entry). Operator sees a "convergence achieved" affordance; one confirm.
- **Auto-settlement at expiry** — fixed-contract mode only. Future leg settles automatically on expiry; spot leg
  closed at settlement price. UI should show pending-settlement state on the expiry day and final P&L once both
  legs reconcile.
- **Risk-triggered exit (emergency)** — kill-switch: basis widens adversely, venue outage, roll failure. Accepts
  slippage and fires from whichever monitor surfaces the breach. Reaches the same paired-unwind path but bypasses
  the `exit_basis_bps` gate.
- **Position-closed confirmation** — spot + future net positions both at zero, consolidated P&L attribution
  (basis-convergence P&L + carrying cost + commissions + execution alpha per archetype doc §P&L attribution)

---

## 4. Widget-by-widget verification

Legend: ✅ fits · 🟡 partial / needs enhancement · ❌ does not serve this archetype · ➖ tangential

### 4a. `defi-basis-trade-widget` — primary execute (perp-oriented) · ❌ wrong target archetype

File: [components/widgets/defi/defi-basis-trade-widget.tsx](../../../components/widgets/defi/defi-basis-trade-widget.tsx)

- ❌ **Perpetual-only execution model.** Emits `BASIS:${asset}:${operation}` with `venue: ${asset}-PERP` at
  [defi-basis-trade-widget.tsx:95-96](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L95-L96). No
  dated-contract selector, no expiry, no roll mode.
- ❌ **Funding-rate-centric metrics.** Strategy Metrics section ([L198-257](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L198-L257))
  surfaces `Funding APY`, `Cost of Carry`, `Breakeven Funding` — all perp funding-rate concepts. For dated basis
  the core numbers are `basis_bps`, `days_to_expiry`, and `annualised_basis`. None of those are exposed.
- ❌ **Hardcoded `strategy_id: "BASIS_TRADE"`** at [L90](../../../components/widgets/defi/defi-basis-trade-widget.tsx#L90).
  Matches the cross-archetype blocker flagged in
  [yield-rotation-lending.md §6a.1](./yield-rotation-lending.md#6a-blockers-must-fix-before-archetype-is-ui-complete);
  would mis-tag every dated-basis order as a perp basis order even if the rest of the widget were wired for dated.
- ❌ **Not registered for DeFi tab.** Despite being in `components/widgets/defi/`,
  `DeFiBasisTradeWidget` is not wired in [components/widgets/defi/register.ts](../../../components/widgets/defi/register.ts) —
  no `registerWidget({id: "defi-basis-trade", ...})` call. The widget exists in the codebase but is not reachable
  from any preset today. For this audit that's a neutral observation (it's targeting the perp archetype anyway), but
  worth flagging since the file masquerades as archetype-ready.

**Gap → action:** Do not extend this widget for dated basis. Keep it scoped to `CARRY_BASIS_PERP`. Dated basis needs
its own execute surface — see 6a below.

### 4b. `enhanced-basis-widget` — monitor: per-asset basis table · ❌ perp-only

File: [components/widgets/defi/enhanced-basis-widget.tsx](../../../components/widgets/defi/enhanced-basis-widget.tsx)

- ❌ **Venue labels hardcoded to perp venues** (`Hyperliquid`, `Drift`) at
  [L33-40](../../../components/widgets/defi/enhanced-basis-widget.tsx#L33-L40). No dated-future venue (Deribit
  dated, CME, ICE) anywhere.
- ❌ **Funding-rate column** at [L148](../../../components/widgets/defi/enhanced-basis-widget.tsx#L148) — the
  "Funding 8h" header assumes perpetual funding cadence; dated basis has no funding rate, only a
  basis-to-convergence.
- ❌ **`annualisedYield` derived from `fundingRateAnnualized`** at [L52](../../../components/widgets/defi/enhanced-basis-widget.tsx#L52).
  Dated basis annualisation is `basis_bps × (365 / days_to_expiry)`, which this widget cannot compute because
  `days_to_expiry` isn't in the context.
- ❌ **No term-structure / expiry grid** — rows are one-per-asset (ETH, BTC, SOL) at
  [L97-102](../../../components/widgets/defi/enhanced-basis-widget.tsx#L97-L102), not one-per-(asset, expiry). The
  dated-basis monitor fundamentally needs the two-dimensional view.

**Gap → action:** Same as 4a — keep this widget scoped to perp. A new `defi-dated-basis-dashboard` (or similar)
needs to render the expiry × basis grid. Proposal in 6a.

### 4c. `defi-funding-matrix-widget` — monitor: funding rates · ➖ tangential

File: [components/widgets/defi/defi-funding-matrix-widget.tsx](../../../components/widgets/defi/defi-funding-matrix-widget.tsx)

- ➖ Funding-rate matrix is explicitly a perp concept ([L76-77](../../../components/widgets/defi/defi-funding-matrix-widget.tsx#L76-L77)
  header: _"Annualised funding rates"_). Has no bearing on dated basis. Useful only for the
  `CARRY_BASIS_DATED` operator who wants to cross-check whether the same underlying's perp funding argues for
  `CARRY_BASIS_PERP` instead of dated.

**Gap → action:** None for this archetype.

### 4d. `options-futures-table-widget` — monitor: per-contract dated-futures table · 🟡 closest-fit existing widget

File: [components/widgets/options/options-futures-table-widget.tsx](../../../components/widgets/options/options-futures-table-widget.tsx)

This widget lives in the options tab (`availableOn: ["options"]`) and renders the `FuturesTab` component for crypto
underlyings. It's the only place in the UI today that actually displays dated-future contracts.

- ✅ Dated-future rows generated per underlying with quarterly ladders
  ([options-futures-mock.ts:360-376](../../../lib/mocks/fixtures/options-futures-mock.ts#L360-L376)): `BTC-26MAR26`,
  `BTC-26JUN26`, `BTC-25SEP26`, `BTC-25DEC26`, `BTC-26MAR27`, plus `-PERPETUAL`.
- ✅ Row schema includes `basis` (bps), `openInterest`, `volume24h`, `isPerpetual` discriminator —
  [lib/types/options.ts:50-62](../../../lib/types/options.ts#L50-L62). That's the correct monitor shape for dated
  basis.
- 🟡 Scope limited to crypto — guard at [options-futures-table-widget.tsx:21-27](../../../components/widgets/options/options-futures-table-widget.tsx#L21-L27)
  blocks non-crypto asset classes. TradFi instances (CME ES / NQ / GC / CL, ICE Brent) — the archetype's richer
  venue set — have no equivalent surface.
- 🟡 No paired-leg concept — it's a standalone futures table, not a spot+future basis view. Operator can't see
  `basis = F − S` against the matched spot instrument, or the `(days_to_expiry, annualised_basis)` pair.
- 🟡 Entitlement silo — `availableOn: ["options"]` (see
  [options/register.ts](../../../components/widgets/options/register.ts) widget registration). A dated-basis
  dashboard needs `availableOn: ["defi", "strategies"]` (or similar) to reach the strategy host surfaces.
- ❌ No roll affordance — no indicator when `REPRESENTATIVE_FUTURE_CHANGED` fires, no combo-order review path.

**Gap → action:** This is the reference pattern for the dated-futures row shape but it's not reusable directly.
Either extend it with a basis / spot-leg column and promote to `availableOn: ["defi", "strategies", "options"]`,
or fork into `defi-dated-basis-table`.

### 4e. `defi-wallet-summary-widget` — support: per-venue balances · ✅ adequate

File: [components/widgets/defi/defi-wallet-summary-widget.tsx](../../../components/widgets/defi/defi-wallet-summary-widget.tsx)

- ✅ Covers the support backbone (per-venue balances, gas-low flag, rebalance trigger) — same finding as
  [yield-rotation-lending.md §4e](./yield-rotation-lending.md#4e-defi-wallet-summary-widget--support-per-chain-balances--).
- ➖ Does not distinguish spot-venue vs future-venue margin accounts, which is the specific cross-venue coordination
  this archetype needs. Adequate for MVP; not rich enough for venue-account pre-flight per
  [venue-account-coordination.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/venue-account-coordination.md).

**Gap → action:** None blocking. Enhancement: per-venue margin segmentation (add a future-venue margin column for
instances that have a short-future leg).

### 4f. `defi-yield-chart-widget` — monitor: time-series P&L · 🟡 inherits baseline gap

File: [components/widgets/defi/defi-yield-chart-widget.tsx](../../../components/widgets/defi/defi-yield-chart-widget.tsx)

- 🟡 Usable for dated-basis P&L time-series in principle but carries the same "vs Ethena" hardcoded comparator
  issue flagged in
  [yield-staking-simple.md §4 defi-yield-chart-widget](./yield-staking-simple.md#defi-yield-chart-widget--adequate-monitor)
  and [yield-rotation-lending.md §4f](./yield-rotation-lending.md#4f-defi-yield-chart-widget--monitor-apy-time-series--).
  For dated basis the natural comparator is `annualised_basis_bps` vs a risk-free rate (T-bill / SOFR), not Ethena.
- ➖ No convergence overlay — cannot show the theoretical linear decay of basis-to-zero at expiry alongside realised
  basis.

**Gap → action:** Comparator pluggability is already tracked as a cross-archetype enhancement. Convergence overlay
is dated-basis-specific; add as enhancement when the archetype is activated.

### 4g. `defi-strategy-config-widget` — support: config viewer · 🟡 unknown fit

File: [components/widgets/defi/defi-strategy-config-widget.tsx](../../../components/widgets/defi/defi-strategy-config-widget.tsx)

- 🟡 Generic config viewer; would need the
  [archetype doc §Config schema](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-basis-dated.md)
  fields wired through (`spot_venue`, `future_venue`, `min_entry_basis_bps`, `exit_basis_bps`,
  `rollover_days_before_expiry`, `execution_policy_ref`). Until an instance is deployed and a fixture surfaces
  these, this widget has no content to render for the archetype.

**Gap → action:** Extend fixture + widget in lockstep when the first instance is deployed.

### 4h. Fixture coverage — ❌ no dated-basis fixture

- [lib/mocks/fixtures/defi-basis-trade.ts](../../../lib/mocks/fixtures/defi-basis-trade.ts) is perp-only: `perpVenues:
["HYPERLIQUID"]` at [L21](../../../lib/mocks/fixtures/defi-basis-trade.ts#L21); `fundingRate` /
  `fundingRateAnnualized` on every asset ([L28-52](../../../lib/mocks/fixtures/defi-basis-trade.ts#L28-L52)). No
  expiry, no `days_to_expiry`, no future-contract identity, no basis-convergence model.
- [lib/mocks/fixtures/options-futures-mock.ts §generateFuturesData](../../../lib/mocks/fixtures/options-futures-mock.ts#L339-L379)
  has quarterly dated-future rows per crypto asset with `basis` bps and mark price — usable as a monitor data
  source if a dated-basis widget were built — but has **no matched spot price**, so the `F − S` computation can't
  be done inside the fixture today.
- No TradFi dated futures in any fixture (CME ES / NQ / GC / CL, ICE Brent). The archetype's target venue set is
  unreachable.

**Gap → action:** New fixture `defi-dated-basis.ts` (or `carry-basis-dated.ts`) with 3–8 representative instances
covering `-dated-` (rolling) and `-fixed-` (expiry-targeted) modes, both crypto and TradFi.

---

## 5. Codex updates (v2 archetype doc)

Minimal; archetype doc is clean. Suggested adds:

1. **Explicit "parked placeholder" note** at the top of
   [archetypes/carry-basis-dated.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/archetypes/carry-basis-dated.md).
   Today the doc is comprehensive enough to build against but has no deployed instance; a one-line status banner
   (`Status: placeholder — no deployed instance as of 2026-04-20`) aligns expectations for UI work ordering.
2. **Cross-link to [futures-roll-and-combos.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/futures-roll-and-combos.md)**
   in the archetype doc's `Execution semantics` section. Roll is the most distinctive dated-basis lifecycle event;
   today the archetype doc mentions it in one sentence (_"Roll: close expiring future, open next-month future;
   rebalance spot if notional drift"_) and doesn't point to the SSOT.
3. **Surface the `-dated-` vs `-fixed-` slot-label dichotomy** in the archetype doc's `Config schema` section.
   Currently only the `-fixed-{contract}-` expiry-targeted shape is shown in the YAML example; the rolling-continuous
   mode is documented only in `category-instrument-coverage.md §5 / Representative slot_labels`. UI will consume the
   mode as a first-class config knob, not an emergent property.

No schema changes needed.

---

## 6. Gaps summary

### 6a. Blockers (must-fix before archetype is UI-complete)

This archetype is **deferred** — none of the blockers need to land before `CARRY_BASIS_PERP`, `CARRY_STAKED_BASIS`,
and `CARRY_RECURSIVE_STAKED` are audited/certified. The list below is the buildout plan **if/when** an instance is
commissioned.

1. **No dated-basis execute surface.** Neither `defi-basis-trade-widget` nor `enhanced-basis-widget` covers dated
   futures; both assume perpetuals. A new execute widget (working name `defi-dated-basis-widget`) is required,
   rendering: instance picker → resolved `(spot_instrument, future_instrument)` pair → basis readout vs
   `min_entry_basis_bps` / `exit_basis_bps` gates → paired ENTRY action emitting `ATOMIC(spot_buy, future_sell)`
   with the correct instance id. **P0 on activation.**
2. **No term-structure / expiry grid monitor.** Need a `defi-dated-basis-dashboard` (or similar) rendering a
   `(underlying × expiry)` matrix with `basis_bps`, `days_to_expiry`, `annualised_basis`, OI, and an "active
   contract" highlight per the rolling-continuous vs expiry-targeted mode. **P0 on activation.**
3. **No roll-preview / combo-order review affordance.** Rolling-continuous instances need a UI path that surfaces
   `REPRESENTATIVE_FUTURE_CHANGED` events, shows the synthetic fair-value mid + `max_roll_slippage_bps` guard, and
   lets the operator review the combo order before execution-service routes it (listed combo / synthetic combo /
   LEADER_HEDGE per [futures-roll-and-combos.md §6](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/cross-cutting/futures-roll-and-combos.md)).
   **P0 on activation.**
4. **Hardcoded `strategy_id` blocker** — same cross-archetype issue as
   [yield-rotation-lending.md §6a.1](./yield-rotation-lending.md#6a-blockers-must-fix-before-archetype-is-ui-complete)
   and [yield-staking-simple.md §6](./yield-staking-simple.md#6-gaps-summary-distilled). Any new dated-basis widget
   must accept `strategy_id` from instance context, not hardcode a venue-shaped string.
5. **No dated-basis fixture.** Existing `defi-basis-trade.ts` is perp-only; `options-futures-mock.ts` has
   dated-future rows but no matched spot price. New fixture (see §4h) required for UI demo parity. **P0 on
   activation.**
6. **TradFi coverage gap.** Per
   [category-instrument-coverage.md §5](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/category-instrument-coverage.md#5-carry_basis_dated)
   the TradFi dated-basis variant is blocked on _"IBKR ↔ CME cross-venue routing policy not declared"_. UI
   cannot exercise the TradFi example instances until that execution-policy gap is closed at the service layer.

### 6b. Enhancement wishlist (non-blocking)

1. **Convergence chart overlay** on `defi-yield-chart-widget` — show realised basis vs theoretical linear decay to
   zero at expiry per active instance.
2. **Days-to-expiry countdown + roll-window alarm** on the dashboard — visual alert when
   `days_to_expiry <= rollover_days_before_expiry`.
3. **Annualised-basis comparator** in the yield chart — swap the hardcoded "vs Ethena" baseline for a risk-free rate
   (T-bill / SOFR) natural to basis-trade comparison; shared nit with
   [yield-staking-simple.md](./yield-staking-simple.md) and [yield-rotation-lending.md §6b.9](./yield-rotation-lending.md#6b-enhancement-wishlist).
4. **Per-venue margin segmentation** in `defi-wallet-summary-widget` — explicit spot-venue vs future-venue margin
   columns to support the cross-venue coordination pre-flight.
5. **Roll-P&L ledger** — per-roll executed spread vs synthetic fair value + slippage; shows whether roll costs are
   eating basis captured.
6. **Extend `options-futures-table-widget`** to `availableOn: ["defi", "strategies", "options"]` with an optional
   basis column (spot leg sourced from a matched instance), so the existing dated-future surface becomes reusable
   from the strategy shell without forking.

---

## 7. Verified-in-browser checklist

All scenarios are **BLOCKED** on 6a.1–6a.5. Listed for reference once the archetype is activated and widgets exist.

1. **BLOCKED** — Browse `/trading/defi` (or strategies shell) with
   `CARRY_BASIS_DATED@binance-deribit-btc-dated-usdt-prod` active; dashboard renders the `(BTC × [26MAR26, 26JUN26,
25SEP26, 25DEC26, 26MAR27])` grid with the representative contract flagged.
2. **BLOCKED** — Operator picks the flagged contract → dated-basis execute widget loads → shows
   `basis_bps = 42 bps`, `days_to_expiry = 71`, `annualised_basis = 216 bps`, above `min_entry_basis_bps` gate
   → PAIRED ENTRY button active.
3. **BLOCKED** — Submit PAIRED ENTRY → `ATOMIC(Binance:BTC_spot buy, Deribit:BTC-26JUN26 sell)` emitted at
   `target_notional = equity * 0.20`; both orders tagged `strategy_id:
"CARRY_BASIS_DATED@binance-deribit-btc-dated-usdt-prod"`.
4. **BLOCKED** — `REPRESENTATIVE_FUTURE_CHANGED` event fires → roll-preview dialog opens with combo order
   (`close BTC-26JUN26`, `open BTC-25SEP26`), synthetic fair-value mid, slippage guard → operator confirms → combo
   fills; `FUTURES_ROLL_COMPLETED` event rewrites PBMS attribution; roll-P&L ledger row appended.
5. **BLOCKED** — Basis converges below `exit_basis_bps` → convergence-exit affordance surfaces → paired unwind
   fires; instance P&L reconciled (basis-convergence + carrying-cost + commissions + execution alpha per archetype
   §P&L attribution).
6. **BLOCKED** — Emergency exit (simulated venue outage on Deribit) → operator triggers kill-switch → LEADER_HEDGE
   unwind on Binance + queued Deribit retry; P&L breakdown shows the outage slippage as its own line item.
7. **BLOCKED** — TradFi instance `CARRY_BASIS_DATED@ibkr-cme-spy-es-dated-usd-prod` selected → widget communicates
   that TradFi routing is unsupported (blocker 6a.6) rather than silently failing.

---

## 8. Open questions for user

1. **Dated-basis UI priority** — is this archetype on the BP-4 buildout roadmap, or deferred indefinitely until a
   client demands TradFi/Deribit dated-basis exposure? All §6a blockers assume we build on activation; if deferred,
   this audit stays in "awaiting-review" status indefinitely.
2. **Extend vs fork** for the dated-futures table — extend `options-futures-table-widget` (works if we accept
   availability-list broadening + entitlement re-scoping) or fork a `defi-dated-basis-table` under `defi/`? Extend
   reuses the existing `FutureRow` contract; fork avoids cross-tab entitlement churn.
3. **Rolling vs fixed as separate widgets or a mode toggle** — the two lifecycle modes have different operator
   affordances (roll preview vs expiry countdown). A single instance-driven widget that switches mode from the slot
   label seems cleaner than two parallel widgets; confirm direction.
4. **TradFi dated-basis ETA** — coverage doc blocks TradFi on "IBKR ↔ CME cross-venue routing policy not
   declared". Is that execution-service gap in scope for the same BP-4 cycle, or should UI ship crypto-only first?
5. **Perp vs dated cross-archetype comparison view** — operators running both `CARRY_BASIS_PERP` and
   `CARRY_BASIS_DATED` on the same underlying want a side-by-side _"funding APY vs annualised dated basis"_ view to
   pick the better carry. Does that belong in this archetype's audit, `CARRY_BASIS_PERP`'s audit, or a separate
   family-level dashboard?

---

_Status: draft — awaiting user review. Archetype is a parked placeholder; gaps listed are activation-gated._
