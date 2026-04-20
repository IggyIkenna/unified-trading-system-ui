---
archetype: MARKET_MAKING_CONTINUOUS
sub_mode: ACTIVE_LP
status: draft-awaiting-review
---

# MARKET_MAKING_CONTINUOUS (Sub-mode B — `ACTIVE_LP`) — Widget Audit

## 1. Archetype summary

**Thesis:** Two-sided quoting on continuously-priced markets. Codex
[category-instrument-coverage.md §13](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/category-instrument-coverage.md)
splits the archetype into three sub-modes; this audit covers **Sub-mode B (ACTIVE_LP)** — Uniswap V3 concentrated
liquidity with an actively managed range. Sub-mode A (CLOB on CeFi books) and Sub-mode C (PASSIVE_LP on Curve /
Balancer / Uniswap V2) are covered elsewhere.

**Position shape per instance:** A range order `[price_low, price_high]` on a V3 pool, funded with one or both
tokens of the pair. Fees accrue at the pool fee-tier rate while price trades through the range; fees are zero when
price is out-of-range. Impermanent loss is concentrated — the narrower the range, the higher the fee capture per
dollar but the larger the IL when price moves through either edge.

**Sub-mode distinction vs PASSIVE_LP:**

- Active: bounded range, rebalance logic, fee + IL + rebalance-gas exposure
- Passive: unbounded range (V2) or curve pool, no rebalance — fee-only yield, pool-composition IL

**P&L drivers:**

- Gross: `pool_fee_tier × in_range_volume_share × pool_volume` (24h)
- IL: `realised_il_on_rebalance + unrealised_il_at_current_price`
- Incentive rewards: UNI / OP / ARB emissions where active
- Gas cost: rebalance frequency × per-rebalance gas
- Net execution alpha vs passive LP on same pair (the whole point of Sub-mode B)

**Kill switches (coverage matrix §13 + archetype family doc):**

- Pool TVL collapse / impermanent depeg on a constituent
- Abnormal price volatility pushing the range far out-of-range + high rebalance cost
- Fee-tier yield compression below cost-of-capital benchmark

**UI-visible config knobs:** `pool_pair`, `range_width_pct`, `rebalance_threshold_pct`, `chain`, `fee_tier`,
`share_class`, `max_allocated_pct`.

**Representative slot-labels (codex §13):**

```
MARKET_MAKING_CONTINUOUS@uniswap-v3-weth-usdc-ethereum-active-usdc-prod
MARKET_MAKING_CONTINUOUS@uniswap-v3-weth-usdc-arbitrum-active-usdc-prod
MARKET_MAKING_CONTINUOUS@uniswap-v3-wbtc-weth-ethereum-active-usdc-prod
```

**Sources:**

- v2 coverage matrix: [category-instrument-coverage.md §13](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/category-instrument-coverage.md)
- Family doc: [families/market-making.md](../../../../unified-trading-pm/codex/09-strategy/architecture-v2/families/market-making.md)
- Engine: `strategy_service/engine/strategies/v2/market_making/continuous.py`

---

## 2. UI capability requirements

Grouped by execute · monitor · support · exit.

### 2a. Execute

- **Select pool + fee tier** (500 / 3000 / 10000 bps on Uniswap V3)
- **ADD_LIQUIDITY with range** (`price_low`, `price_high`, position size in token0 or token1)
- **REMOVE_LIQUIDITY** (partial or full)
- **Chain selection** (Ethereum / Arbitrum / Base / Optimism / Polygon)
- **Rebalance action** — manual trigger to close current range and open a new one at the rebalance threshold
- **Strategy instance tag** on every emitted order — must match a Sub-mode B slot-label (not a generic `"AMM_LP"`)

### 2b. Monitor

- **Per-position table:** pool, range (low/high), in-range flag, TVL, 24h fees, IL %, last rebalance timestamp
- **In-range indicator** (critical — out-of-range means 0 fee accrual)
- **Range utilisation heatmap** — price-vs-range distribution over last 24h/7d
- **Rebalance history** — per-position events, realised IL, gas cost per rebalance
- **Aggregate KPIs:** total TVL, position count, 24h fees, MTD IL %, out-of-range count
- **Fee-tier APR stream** per pool (comparator for opening a new position)

### 2c. Support

- **Wallet balance** on LP chain (native gas + both pool tokens)
- **Gas estimate** for ADD / REMOVE / REBALANCE on the target chain
- **Benchmark comparator** (passive LP on the same pair, or pool average) — headline metric for "is active LP
  earning its keep"

### 2d. Exit

- **REMOVE_LIQUIDITY** with slippage preview (swap residual to a single side if desired)
- **Emergency exit** when pool depeg / abnormal-vol kill-switch fires — one-click full close at any range state

---

## 3. Widget-by-widget verification

Legend: ✅ fits archetype · 🟡 partial / needs enhancement · ❌ does not serve this archetype · ➖ not applicable here

### 3a. Primary widgets (execute + monitor)

#### `defi-liquidity-widget` — 🟡 partial (execute)

File: [components/widgets/defi/defi-liquidity-widget.tsx](../../../components/widgets/defi/defi-liquidity-widget.tsx)

- ✅ ADD / REMOVE toggle ([L40-56](../../../components/widgets/defi/defi-liquidity-widget.tsx#L40-L56))
- ✅ Pool + fee-tier + range-min/range-max + position-size form ([L78-133](../../../components/widgets/defi/defi-liquidity-widget.tsx#L78-L133))
- ✅ Strategy-id fallback is now a Sub-mode B slot-label after §2.1 — `MARKET_MAKING_CONTINUOUS@uniswap-v3-weth-usdc-ethereum-active-usdc-prod` ([L163](../../../components/widgets/defi/defi-liquidity-widget.tsx#L163))
- 🟡 **No chain selector** — defaults to whatever pool is in the fixture. Multi-chain instances (Arbitrum, Base)
  cannot be traded.
- 🟡 **No rebalance action** — current-range close + new-range open is two separate REMOVE/ADD ops with no paired
  UI affordance.
- 🟡 **No in-range preview** on submit — user doesn't see whether the range they're about to open is currently
  in-range.
- ❌ **No PASSIVE_LP mode** — Sub-mode C (Curve / Balancer / Uni V2) has no UI surface today. Out of scope for this
  audit but tracked here because the family share the same container.

#### `active-lp-dashboard-widget` — ✅ fits (monitor)

File: [components/widgets/strategies/active-lp-dashboard-widget.tsx](../../../components/widgets/strategies/active-lp-dashboard-widget.tsx)

- ✅ Per-position table with pool / range / in-range / TVL / 24h fees / IL% / last-rebalance ([L24-87](../../../components/widgets/strategies/active-lp-dashboard-widget.tsx#L24-L87))
- ✅ Header KPIs cover total TVL / positions / 24h fees / IL MTD ([L100-105](../../../components/widgets/strategies/active-lp-dashboard-widget.tsx#L100-L105))
- ✅ Out-of-range count surfaced as a warning badge ([L107-113](../../../components/widgets/strategies/active-lp-dashboard-widget.tsx#L107-L113))
- 🟡 **No inline action column** — cannot rebalance / close directly from the dashboard; operator has to switch
  tabs to the liquidity widget.
- 🟡 **No range-utilisation chart** — "in-range % over time" per position is not shown.
- ➖ IL column is a realised snapshot; unrealised vs realised split would be nice-to-have but not blocking.

#### `defi-rates-overview-widget` — ➖ neutral (monitor)

Pool fee-tier APRs surface here when a Uniswap V3 row is present in the rates fixture. Neutral because the widget
is shared across archetypes; no archetype-specific gap.

### 3b. Supporting widgets

#### `defi-wallet-summary-widget` — ✅ fits (support)

Per-chain portfolio table already covers "enough native + enough token0/token1 to open a position on this chain".

#### `defi-transfer-widget` — 🟡 partial (support)

After §2.1 the `strategy_id` fallback is a slot-label, but the SEND path still defaults to a lending slot-label
(`YIELD_ROTATION_LENDING@aave-multichain-usdc-prod`). Transfers that fund an LP position on Arbitrum get
misattributed. Same gap as the staking audit §3c: widget should accept a `strategy_id` prop from the host surface.

### 3c. Missing coverage (no widget today)

| Capability (from §2)                                     | Status         | Proposed widget / enhancement                                  |
| -------------------------------------------------------- | -------------- | -------------------------------------------------------------- |
| Rebalance action (close + open at new range in one flow) | ❌ missing     | **enhance** `defi-liquidity-widget` — add REBALANCE mode       |
| Range-utilisation chart (price-vs-range over time)       | ❌ missing     | **new:** `defi-lp-range-utilisation`                           |
| Rebalance history + realised-IL / gas per event          | ❌ missing     | **new:** `defi-lp-rebalance-history` (event-table style)       |
| Active-vs-passive benchmark comparator                   | ❌ missing     | **enhance** `defi-yield-chart-widget` — add passive-LP overlay |
| PASSIVE_LP (Sub-mode C) execute surface                  | ❌ not covered | **new:** requires its own audit + widget                       |

---

## 4. Gaps summary (distilled)

**Blockers for manual-execution parity:**

1. `defi-liquidity-widget` has no chain selector — Sub-mode B instances on Arbitrum / Base / Optimism / Polygon
   cannot be opened via UI.
2. No rebalance affordance — the defining operator action for active LP is a round-trip across two forms today.
3. Transfer widget still hard-defaults `strategy_id`, misattributing LP-funding flows.

**Enhancement wishlist (non-blocking but high-value):**

1. In-range preview on the submit button state.
2. Inline rebalance / close actions on the dashboard table.
3. Range-utilisation chart for the "am I in-range often enough" question.
4. Passive-LP comparator row in yield-chart so operators can see the active premium in one place.

---

## 5. Verified-in-browser checklist

To be completed after widget enhancements.

- [ ] **Open ETH-USDC 0.05% range on Ethereum:** select pool, pick 500 bps tier, enter `[1950, 2150]` range, 1 ETH
      size → emitted order tagged `MARKET_MAKING_CONTINUOUS@uniswap-v3-weth-usdc-ethereum-active-usdc-prod`.
- [ ] **Dashboard shows new position in-range**; 24h fees KPI updates on simulated trade-through.
- [ ] **Simulate price move out of range** → dashboard flips `In Range` badge to `No`; out-of-range KPI
      increments; fees accrual stops.
- [ ] **Rebalance action** (once wired) → old position closes, new range opens one block later, rebalance-history
      widget shows the event with realised IL + gas.
- [ ] **Emergency exit:** force pool-depeg kill-switch → REMOVE_LIQUIDITY with slippage preview runs end-to-end.

---

## 6. Open questions for user

1. **Chain selector on `defi-liquidity-widget`:** add an explicit dropdown, or derive from pool (pool name
   already embeds chain for Uniswap V3)?
2. **Rebalance as a third op mode** alongside ADD / REMOVE, or a dedicated inline action on the dashboard row?
3. **PASSIVE_LP (Sub-mode C):** separate audit doc and widgets, or fold into a single "LP" audit with two modes?
   Per codex §13 the config surfaces are distinct enough (no range knobs for passive) that two audits seems
   cleaner.
4. **Strategy-id plumbing from the host surface:** when this widget is embedded under `/services/trading/defi/mm`
   vs a generic LP page, how should it receive the slot-label? Same question as §2.1 — deferred to BP-6 lazy
   activation?

---

_Status: draft — awaiting user review. This audit is the §2.3 deliverable for BP-3 and closes the 8-archetype set
noted as missing in [widget-certification-codex-sync-2026-04-20.md §8](../../trading/widget-certification-codex-sync-2026-04-20.md)._
