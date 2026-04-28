# Trader Archetype — Quinn Park (Quant Overseer)

A reference profile of a senior quant overseeing a fleet of automated trading strategies at a top-5 firm. Used as a yardstick for what an ideal terminal must support for the **systematic** side of the desk. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For sister archetypes on the same desk, see the other `trader-archetype-*.md` files in this folder.

---

## Who Quinn Is

**Name:** Quinn Park
**Role:** Senior Quant / Strategy Portfolio Manager
**Firm:** Top-5 global trading firm
**Book size:** $1B – $5B notional traded daily across her fleet
**Style:** Fully systematic. Models trade, she supervises.
**Strategies under management:** 20–80 live strategies, in tiers from ultra-short-horizon market-making to multi-day stat-arb to multi-week factor models, across CeFi crypto, on-chain, and traditional venues where the firm is licensed.

### How she thinks differently

Quinn does **not** trade discretionarily. Her job is:

- **Researching** new alpha — feature engineering, model training, walk-forward validation, robustness tests.
- **Promoting** strategies through a lifecycle — research → paper trade → small-size live → full size → monitored decay → retire.
- **Supervising** the live fleet — monitoring health, drift, capacity, regime fit; intervening when something is off.
- **Allocating capital** across strategies based on rolling performance and correlation.

Her edge is **process**, not market reading. The terminal must serve a research-and-control workflow, not a point-and-click trading workflow.

### Her cognitive load

The hardest thing about Quinn's job is **scale of attention**. She can't watch 50 strategies the way Marcus watches one position. Everything must be **anomaly-driven** — the terminal surfaces what's wrong; she trusts the rest.

---

## Physical Setup

**4 monitors** (fewer than Marcus or Julius — she's not staring at order books).

| Position     | Surface                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------- |
| Top-left     | **Strategy fleet dashboard** — the master view, every live strategy with health/PnL/capacity |
| Top-right    | **Research workspace** — Jupyter / notebook environment, current research project            |
| Bottom-left  | **Anomaly / alert console** — what needs her attention right now                             |
| Bottom-right | **Capital allocation & correlation matrix** — the meta-view                                  |

Plus tablet for chat / news / desk coordination.

She works **part-time at the desk**, part-time in the research environment. The terminal must transition cleanly between the two modes.

---

## Phase 1: Decide

For Quinn, "decide" is mostly **strategy-level**, not trade-level. The trades are decided by code; she decides which code runs at what size.

### Strategy lifecycle stages

The terminal must explicitly model where every strategy is in its lifecycle:

- **Research:** offline only, backtests + walk-forward.
- **Paper:** running live on real data, simulated fills.
- **Pilot:** real money, capped at 1–5% of target size.
- **Live:** at full target capital.
- **Monitor:** running but capped, decay being measured.
- **Retired:** code archived, can be re-promoted.

Each strategy carries a stage tag everywhere it appears.

### Research workspace

- **Notebook environment** integrated with the firm's data lake. One-click access to historical tick data, orderbook snapshots, on-chain history, fundamental data.
- **Backtest engine** with realistic execution simulation — slippage, fees, latency, partial fills, queue position. _Not_ a toy backtester.
- **Walk-forward validation framework** — out-of-sample by default, configurable splits, anti-overfitting checks (white's reality check, deflated Sharpe).
- **Feature library** — searchable catalog of all features the firm has engineered, with metadata (cost to compute, freshness, owner, used-by).
- **Model registry** — every model trained, versioned, with training data hash, hyperparameters, performance, and reproducibility guarantee.
- **Experiment tracker** — every backtest run logged with full config, comparable side-by-side.

### Strategy promotion checklist

Before a strategy moves stages, the terminal enforces:

- Walk-forward Sharpe above threshold.
- Drawdown profile within bounds.
- Capacity estimate sanity check.
- Correlation to live book within limit.
- Code review sign-off.
- Risk team sign-off.
- Production deployment + monitoring + kill-switch wired.

This is a **promotion gate UI**, not a chat conversation.

### Market regime context

Quinn cares about regime not to trade on it discretionarily, but to understand **which of her strategies should be working right now**. She watches:

- Vol regime (BTC realized 30d, SPX VIX, MOVE).
- Correlation regime (intra-crypto, crypto-equity).
- Liquidity regime (bid-ask spreads, depth, on-chain TVL).
- Macro regime (risk-on / risk-off proxy).

Each regime indicator is mapped to **which strategies historically perform** in that regime — so she can pre-empt underperformance and intervene with sizing.

---

## Phase 2: Enter

Quinn rarely enters trades manually. When she does, it's:

- **Manual override** of an automated strategy (pause, force-close).
- **Capital allocation change** — increase/decrease size on a running strategy.
- **Strategy promotion / demotion** — push from pilot to live, or live to monitor.
- **Hot-fix deployment** — push an updated model version live.

The "enter" surface for her is therefore an **operations console**, not an order ticket.

### Strategy control panel

Per strategy:

- **Start / pause / stop** with confirmation and audit trail.
- **Capital cap** — slider/input, with effective-immediately or scheduled change.
- **Risk limits** — max position, max daily loss, max drawdown (kill-on-breach).
- **Symbol whitelist / blacklist** — temporarily exclude an instrument.
- **Schedule** — active hours / days, blackout windows around macro events.
- **Mode** — live / paper / shadow (run code but don't send orders, compare to live).

### Deployment surface

- **Model version control** — every deployed model has a hash, trained-on commit, rolled-out timestamp.
- **Canary deployment** — push a new version at 1% of size first, compare to incumbent for N days, then promote.
- **Rollback** — one-click revert to previous version.
- **Code-config separation** — non-code config changes (thresholds, sizing) deployable without rebuilds.

### Orchestration view

- **Compute health** — CPU, RAM, GPU usage of strategy nodes.
- **Data pipeline health** — feature computation lag, data freshness per source.
- **Order router health** — order rates, reject rates, latency per venue.
- **Connectivity** — venue connections, mempool nodes, oracle feeds.

If any of this is degraded, Quinn needs to know before her strategies degrade.

### Manual override ticket

When she does intervene manually (rare), she gets a Marcus-style ticket — but with a mandatory **reason field** that tags the trade as a manual override on top of strategy ID. This tag carries through to attribution.

**Layout principle for Enter:** the strategy control panel is the most-used surface. Manual order entry is a fallback, deliberately friction-y so it's not the default.

---

## Phase 3: Hold / Manage — supervising the fleet

This is where Quinn spends the most live time, and where the terminal must work hardest.

### Strategy fleet dashboard (the master view)

A table or grid with one row per strategy:

- **Strategy ID, name, stage, owner.**
- **Health badge** — green / amber / red, computed from a composite of metrics.
- **Capital deployed / cap.**
- **PnL today / WTD / MTD / YTD** in $ and as % of cap.
- **Sharpe rolling 30d.**
- **Drawdown** — current, max-since-go-live.
- **Trade count today / yesterday** (unusual silence is a signal).
- **Hit rate, avg trade $.**
- **Recent regime fit** — model-vs-regime indicator.
- **Last intervention** — when was this strategy last touched, by whom.

Sortable, filterable, expandable. Click a row → strategy detail page.

### Strategy detail page

Per strategy:

- **Live equity curve** with drawdown shading.
- **Position breakdown** — what is this strategy currently holding?
- **Live signal feed** — recent signals generated, executed vs skipped, with reasons.
- **Feature health** — are the features feeding this model fresh and within historical distribution?
- **Drift indicators** — KS-test or PSI on features and predictions vs training distribution.
- **Capacity utilization** — % of estimated capacity in use; degradation curve.
- **Slippage realized vs assumed** — execution quality monitor, by venue.
- **Recent decisions log** — every model output, executed or not, why.

### Anomaly / alert console

Anomaly detection is the heart of Quinn's day. Alerts include:

- **Performance anomalies** — strategy underperforming its rolling distribution at 2σ / 3σ.
- **Behavior anomalies** — trade frequency, position size, hit rate outside historical bounds.
- **Feature drift** — input distribution shifted vs training.
- **Prediction drift** — output distribution shifted.
- **Execution anomalies** — slippage spike, rejection rate spike, fill rate drop.
- **Capacity warnings** — strategy hitting size cap; signals being skipped.
- **Correlation anomaly** — strategy starting to correlate with a strategy it was supposed to be uncorrelated with.
- **Regime mismatch** — running an "uptrend" model in a "chop" regime.
- **Infrastructure** — node down, data lag, RPC degraded.

Each alert routed to severity (info / warn / critical) with paging rules. Critical alerts auto-pause the strategy by default.

### Cross-strategy view

- **Correlation matrix** — rolling 30d correlation between every pair of strategies.
- **Aggregate Greeks** — net delta, gamma, vega across the entire fleet.
- **Net exposure to common factors** — BTC beta, ETH beta, vol factor, momentum factor.
- **Concentration check** — top-N strategies by risk contribution.

### Capacity & allocation

- **Optimal allocation suggestion** — model-driven (Markowitz / Kelly / risk-parity), updated nightly.
- **Drift from optimal** — by how much current allocation deviates.
- **Capacity headroom** — how much more capital each strategy could absorb based on slippage curves.

### Kill switches

- **Per-strategy kill** — stops one strategy.
- **Group kill** — all strategies in a tier, or all on a venue.
- **Fleet kill** — stop everything. Big red. Multi-confirmation.

### Trade journal — research notes form

Quinn's "journal" is more like research notes attached to events. Every intervention, every alert acted on, every promotion is logged with rationale.

**Layout principle for Hold:** anomaly-driven. The fleet dashboard is **green by default** when she walks in. Anything yellow or red gets her attention. She should never be reading numbers that look fine.

---

## Phase 4: Learn

This is where Quinn lives most of her cognitive depth.

### Strategy retrospectives

Per strategy, automatically generated weekly/monthly:

- Performance vs expectation (out-of-sample distribution from research).
- Drawdown decomposition — what went wrong, when.
- Regime fit — % of period in favorable regime, performance per regime.
- Capacity realized vs assumed.
- Slippage realized vs assumed.

### Fleet attribution

- **Total PnL decomposition** by strategy, by regime, by venue, by underlying.
- **Risk-adjusted contribution** — which strategies actually contribute Sharpe vs which dilute.
- **Marginal contribution** — what would the fleet Sharpe be without strategy X.

### Model decay analysis

- **Sharpe over time** per strategy with confidence intervals — is decay statistically significant?
- **Half-life estimates** — how long does this alpha persist before halving.
- **Feature importance over time** — features whose importance is shifting.

### Backtest vs live divergence

- For every live strategy, the live performance vs the backtest expectation (point estimate + distribution).
- Strategies tracking expectation: green.
- Strategies underperforming: investigated.
- Strategies overperforming: also investigated (look-ahead leak suspected).

### Research velocity metrics

- Strategies promoted per quarter.
- Average time research → live.
- Hit rate of promoted strategies (still alive after 6 / 12 months).
- Cost per researched-strategy (to manage research ROI).

### Reports

- **Weekly fleet review** for risk committee.
- **Monthly performance and capacity report.**
- **Strategy retire / promote decisions** with rationale.
- **Research pipeline status.**

**Layout principle for Learn:** workspace + drilldowns. Research mode is fundamentally different from live mode — different monitor, different mental state.

---

## What Ties Quinn's Terminal Together

1. **Strategies are first-class objects.** Every order, position, PnL, risk number is taggable to a strategy ID, traceable to a model version.
2. **Anomaly-driven attention.** With 50 strategies live, she can't watch them all. The terminal surfaces deviations; she trusts the rest.
3. **Lifecycle is explicit.** Research / paper / pilot / live / monitor / retired — every strategy has a stage, gates between stages.
4. **Backtest-live consistency is enforced.** Same execution simulation, same data, same code path. Divergence between paper and live is investigated as a defect, not normalized.
5. **Reproducibility is non-negotiable.** Any backtest, any live trade, any model version is reproducible from logged inputs.
6. **Manual intervention is rare and audited.** Friction by design; every override has reason + sign-off.
7. **Capacity is a tracked dimension.** A strategy hitting its capacity is as important to know as a strategy losing money.
8. **Correlation is monitored continuously.** Strategies don't stay uncorrelated; the terminal catches drift before it becomes a single bet.

---

## How to Use This Document

When evaluating any quant-supervision surface (including our own), walk through Quinn's four phases and ask:

- Can she research, paper-trade, and promote strategies through stages from one terminal?
- Is the live fleet dashboard genuinely anomaly-driven, or does it require staring?
- Can she trace any live trade to a strategy ID, model version, and feature snapshot?
- Are her interventions friction-y enough that she defaults to letting the system run?
- Is post-trade attribution multi-axis (strategy / regime / venue / underlying)?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
