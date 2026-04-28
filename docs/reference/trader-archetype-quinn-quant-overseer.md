# Trader Archetype — Quinn Park (Quant Overseer)

A reference profile of a senior quant overseeing a fleet of automated trading strategies at a top-5 firm. Used as a yardstick for what an ideal terminal must support for the **systematic** side of the desk. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For shared surfaces every archetype uses, see [common-tools.md](common-tools.md).
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

Her edge is **process**, not market reading. The terminal must serve a research-and-control workflow, not a point-and-click trading workflow. Most "shared" surfaces are abstract for her — her trade ticket is rare, her chart is a strategy equity curve, her positions blotter rolls up by strategy ID. The primary surface is the strategy fleet dashboard.

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

She works **part-time at the desk**, part-time in the research environment. The terminal must transition cleanly between the two modes. See [#30 Customizable Layout](common-tools.md#30-customizable-layout--workspace) — Quinn's mode-switch is research ↔ live-supervision.

---

## Phase 1: Decide

For Quinn, "decide" is mostly **strategy-level**, not trade-level. The trades are decided by code; she decides which code runs at what size.

### Strategy lifecycle stages (UNIQUE)

Every strategy carries a stage tag everywhere it appears (positions, PnL, attribution, journal, kill): **Research** (offline backtests + walk-forward) → **Paper** (live data, simulated fills) → **Pilot** (real money, 1–5% of target) → **Live** (full target capital) → **Monitor** (capped, decay being measured) → **Retired** (archived, re-promotable). A first-class extension of the [tagging framework](common-tools.md#29-strategy-tagging-framework) — stage is not metadata, it's a state machine with promotion gates.

### Research workspace (UNIQUE)

The center of gravity for Phase 1, not a "tool" so much as an integrated environment:

- **Notebook environment** — Jupyter-style, attached to the firm's data lake. One-click access to historical tick data, orderbook snapshots, on-chain history, fundamental data. Kernel runs against research compute, not her laptop.
- **Backtest engine** — realistic execution simulation: slippage curves, fee schedules, latency model, partial fills, queue position estimation. _Not_ a toy backtester. Same execution code path as live, fed historical data instead of live feeds.
- **Walk-forward validation framework** — out-of-sample by default, configurable splits (rolling / expanding / purged k-fold for time series), anti-overfitting checks (White's reality check, deflated Sharpe ratio, combinatorial purged CV).

### Feature library (UNIQUE)

A searchable catalog of every feature the firm has engineered. Per feature: **identity** (name, version, owner, source code link), **metadata** (description, computation cost in CPU-ms and $, update cadence — tick/1s/1m/EOD, freshness SLA), **lineage** (upstream raw sources, downstream dependent features), **used-by** (every live strategy currently consuming it — impact-of-change visible before deprecating), **distribution monitor** (rolling histogram, drift vs training distribution), and **quality** (null rate, outlier rate, recent incidents). Search by name, tag (price / volume / on-chain / sentiment / macro), owner, or used-by-strategy. New strategies start by browsing this catalog — feature reuse over re-engineering.

### Model registry & experiment tracker (UNIQUE)

Every model trained, ever. Per entry: **version** (semantic version + content hash — same code + same data = same hash), **training data hash** (exact snapshot, reproducible), **hyperparameters** (full config, not just headlines), **code commit** of the training pipeline, **performance** (in-sample, out-of-sample, walk-forward, by regime), **reproducibility guarantee** (rerun-from-registry produces bit-identical model, or flagged drift if the data lake changed), **lineage** (parent if fine-tuned/retrained, children), **deployment status** (which versions are live where). The experiment tracker logs every backtest run with full config, comparable side-by-side, filterable by feature set / hyperparameter / regime / period. Failed experiments stay in the log — negative results are also data.

### Strategy promotion gate UI (UNIQUE)

Before a strategy moves stages, the terminal enforces a **checklist** — not a chat conversation. Each gate is a binary check with evidence link: walk-forward Sharpe above threshold (with confidence interval); drawdown profile within bounds; capacity estimate sanity check (slippage curve fit); correlation to live book within limit; code review sign-off (PR link); risk team sign-off (David's archetype); production deployment + monitoring + kill-switch wired. Gate state, evidence, and approver identities are immutable once promoted (audit trail per [#28 Compliance](common-tools.md#28-compliance--audit-trail)).

### Market regime context

Quinn cares about regime not to trade discretionarily on it, but to understand **which of her strategies should be working right now**. She watches: vol regime (BTC realized 30d, SPX VIX, MOVE), correlation regime, liquidity regime, macro risk-on/off. Each indicator is mapped to **which strategies historically perform** in that regime — pre-empt underperformance, intervene with sizing rather than wait for drawdown.

---

## Phase 2: Enter

Quinn rarely enters trades manually. The "enter" surface for her is an **operations console**, not an order ticket. Manual order entry exists as a fallback (see [#2 Order Ticket](common-tools.md#2-order-entry-ticket-framework)) but is deliberately friction-y so it's not the default — and when used, requires a mandatory reason field that tags the trade as a manual override on top of strategy ID.

### Strategy control panel (UNIQUE — primary Phase 2 surface)

Per strategy: start / pause / stop with confirmation + audit trail; capital cap (slider/input, effective-immediately or scheduled); risk limits (max position, max daily loss, max drawdown — kill-on-breach); symbol whitelist/blacklist; schedule (active hours/days, blackout windows around macro events); mode (live / paper / shadow — runs code but doesn't send orders, compared to live). What Quinn touches dozens of times a day; it is to her what the order ticket is to Marcus.

### Canary deployment & rollback surface (UNIQUE)

Every model deployment goes through a canary path: push at 1% of target size for N days alongside the incumbent; side-by-side comparison (fills, PnL, slippage, signal correlation between canary and incumbent); promote (ramp canary to full size, retire incumbent); one-click rollback (revert to previous version, with the canary's positions absorbed or flattened per a documented rule). **Code-config separation:** non-code config changes (thresholds, sizing) are deployable without rebuilds but still versioned and canaried for high-risk parameters.

### Orchestration view

Compute health (CPU / RAM / GPU per strategy node), data pipeline health (feature computation lag, freshness per source), order-router health (rates, rejects, latency per venue), connectivity (venues, mempool nodes, oracle feeds). If any of this is degraded, Quinn needs to know **before** her strategies degrade — these tie into [#18 Latency / Infra](common-tools.md#18-latency--connectivity--infra-panel) but the granularity is per-strategy-node, not per-venue-link.

**Layout principle for Enter:** the strategy control panel is the most-used surface. Manual order entry is a fallback, deliberately friction-y so it's not the default.

---

## Phase 3: Hold / Manage — supervising the fleet

This is where Quinn spends the most live time, and where the terminal must work hardest.

### Strategy fleet dashboard (UNIQUE — the master view)

A table/grid, one row per strategy, sortable and filterable. Per row: ID, name, stage, owner, **health badge** (green/amber/red composite), capital deployed/cap, PnL today/WTD/MTD/YTD ($ and % of cap), rolling 30d Sharpe, current and since-go-live drawdown, trade count today/yesterday (unusual silence is a signal), hit rate, avg trade $, **recent regime fit** indicator, **last intervention** (when, by whom).

Click a row → strategy detail page: live equity curve, current positions (rolled up from [#7 Positions](common-tools.md#7-positions-blotter) filtered by strategy ID), live signal feed (signals generated, executed vs skipped, with reasons), feature health, drift indicators, capacity utilization, slippage realized vs assumed, full decisions log.

### Drift indicators per strategy (UNIQUE)

Per live strategy, continuously computed: **feature drift** (KS-test or PSI on each input vs training distribution), **prediction drift** (KS-test on model output vs training), **label drift** (for strategies with measurable realized labels). Severity tiers: info / warn / critical (auto-pause candidate). **Drift breakdown** identifies which feature is contributing most; click through to feature distribution chart. Surfaces both as a fleet dashboard badge and as alerts ([#14 Alerts](common-tools.md#14-alerts-engine)) routed by severity.

### Capacity utilization tracker (UNIQUE)

Per strategy: **% of estimated capacity in use** (derived from realized slippage vs the slippage curve fitted in research), **degradation curve** (actual slippage at current size vs projected), **headroom** (additional capital absorbable before slippage exceeds threshold), and **signal-skip rate** (when capacity is hit, fraction of signals dropped — a strategy at cap is _earning less than it could_). An underdeployed alpha is as important to know as a losing one.

### Anomaly / alert console

See [#14 Alerts](common-tools.md#14-alerts-engine). **Quinn-specific alert categories:** performance anomaly (rolling distribution 2σ/3σ), behavior anomaly (trade frequency / size / hit rate outside historical bounds), feature drift, prediction drift, execution anomaly (slippage / reject / fill-rate spike), capacity warning, correlation drift, regime mismatch, infra (node down, data lag, RPC degraded). Critical alerts auto-pause the strategy by default (unique policy — most archetypes' alerts only notify).

### Cross-strategy correlation matrix (UNIQUE)

Rolling 30d correlation between every pair of strategies in PnL space, with a **drift detector** that alerts when a previously uncorrelated pair starts correlating beyond threshold (often signals a shared latent factor newly active). Adjacent: **aggregate Greeks** (net delta, gamma, vega across the fleet — overlaps with [#10 Risk](common-tools.md#10-risk-panel-multi-axis) but rolled up by strategy contribution), **net factor exposure** (BTC beta, ETH beta, vol, momentum), and **concentration check** (top-N strategies by risk contribution).

### Capacity & allocation

Model-driven optimal allocation (Markowitz / Kelly / risk-parity) updated nightly, drift from optimal, capacity headroom by strategy.

### Kill switches

See [#19 Kill Switches](common-tools.md#19-kill-switches-granular). **Quinn-specific levels:** per-strategy kill, group kill (all strategies in a tier, or all on a venue), fleet kill (everything; multi-confirmation, big red).

### Trade journal — research notes form

See [#15 Trade Journal](common-tools.md#15-trade-journal). **Quinn-specific:** her journal is research notes attached to events, not per-trade. Every intervention, every alert acted on, every promotion is logged with rationale, attached to the strategy ID and (where applicable) the model version.

**Layout principle for Hold:** anomaly-driven. The fleet dashboard is **green by default** when she walks in. Anything yellow or red gets her attention. She should never be reading numbers that look fine.

---

## Phase 4: Learn

This is where Quinn lives most of her cognitive depth.

### Strategy retrospectives

Per strategy, automatically generated weekly/monthly: performance vs expectation (out-of-sample distribution from research), drawdown decomposition, regime fit (% of period in favorable regime, performance per regime), capacity realized vs assumed, slippage realized vs assumed. Distributed via [#27 Reports](common-tools.md#27-reports).

### Fleet attribution

See [#22 PnL Attribution](common-tools.md#22-pnl-attribution-multi-axis). **Quinn-specific axes:** by strategy, by regime, by venue, by underlying. **Risk-adjusted contribution** — which strategies actually contribute Sharpe vs which dilute. **Marginal contribution** — what would the fleet Sharpe be without strategy X.

### Model decay analysis

Sharpe over time per strategy with confidence intervals (is decay statistically significant?), alpha half-life estimates, feature importance shifting over time.

### Backtest-vs-live divergence tracker (UNIQUE)

For every live strategy, live performance is continuously tracked against the backtest expectation. The walk-forward Sharpe distribution becomes the **tracking band**: green within expectation, amber below 1σ, red below 2σ. **Underperformers** are investigated for regime mismatch, capacity issues, execution degradation, or alpha decay. **Overperformers** are also investigated — suspected look-ahead leak, fortunate regime, or genuinely under-budgeted in research. **Divergence decomposition:** slippage vs assumed, fill rate vs assumed, signal hit rate vs assumed. The most important feedback loop into research priorities.

### Strategy retire/promote decision log (UNIQUE)

Append-only log of every promotion, demotion, and retire decision. Per entry: strategy ID + version, from-stage → to-stage, decision date, mandatory rationale + linked evidence (retrospective report, backtest comparison, decay analysis), decision-makers (Quinn + risk + any other approver per gate policy), capital impact and reallocation target, **post-decision tracking** (did the retired strategy keep decaying? did the promoted strategy perform as expected?). **Calibration metric over time** — when Quinn retired a strategy, how often was she right? — drives meta-improvement of the promotion gates.

### Research velocity metrics

Strategies promoted per quarter, average time research → live, hit rate of promoted strategies (still alive after 6 / 12 months), cost per researched-strategy. ROI on research itself.

### Reports

See [#27 Reports](common-tools.md#27-reports). **Quinn-specific:** weekly fleet review for risk committee, monthly performance and capacity report, retire/promote decision log export, research pipeline status.

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
- Is backtest-vs-live divergence tracked continuously, not just at retro time?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
