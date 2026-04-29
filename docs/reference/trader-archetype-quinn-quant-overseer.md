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

# Automated Mode

This appendix describes Quinn's terminal and daily workflow in the new world — where every other archetype on the floor (Marcus, Henry, Sasha, Theo, Ingrid, Yuki, Diego, Aria, Naomi, Rafael, Julius, Mira) now operates a fleet of automated strategies alongside Quinn. Quinn was always systematic; the appendix above already covers her lifecycle, fleet supervision, research workspace, and intervention surfaces in detail. This appendix does **not** repeat that material.

What's new for Quinn in the automated world is **role redefinition**. With every desk now running a quant fleet, Quinn is no longer "the systematic person on a floor of discretionary traders." She is the **cross-archetype meta-overseer** and the **firm-systematic PM** — running cross-archetype factor / stat-arb / market-neutral strategies that no single-domain archetype could run alone, and providing the cross-fleet correlation, capacity, and capital-allocation lens that no per-archetype console can produce.

This appendix focuses on **what's different** from her existing manual sections, not what's the same. Where her existing sections already cover a surface (research workspace, model registry, lifecycle gates, drift dashboards), this appendix references rather than restates.

For the universal automated-trading platform concepts this builds on, see [automation-foundation.md](automation-foundation.md). For the per-archetype automated cousins Quinn now coexists with, see the `# Automated Mode` section in each `trader-archetype-*.md` file.

> _Throughout this appendix, examples are illustrative — actual factor names, cross-archetype strategies, dataset names, and metrics shown are sample shapes to make the surfaces concrete. The platform's real catalog will differ._

## 1. What Quinn's Edge Becomes

Quinn always ran systematic strategies. The shift is **what kind**, not whether. In the manual-floor world, her remit overlapped heavily with what individual traders couldn't reach by hand — funding harvest at 03:00 UTC, multi-instrument basis arb, factor-tilt sleeves the rest of the floor couldn't watch. With every archetype now running their own automated cousin, that overlap collapses. Marcus's automated cousin runs basis arb and funding harvest natively. Henry's automated cousin runs factor-tilt across a 1000-name universe. Sasha's runs vol surface arb across strikes and tenors.

Quinn's edge in the new world is **what no single-archetype cousin can do**: strategies that span archetypes, asset classes, and books, requiring the firm-level lens.

**Cross-archetype factor strategies (illustrative).** Equity-vs-crypto factor parity (low-vol equity sleeve vs low-vol crypto sleeve, weighted to firm-level risk-parity). Macro-rates-vs-FX-vs-equity-vol composite carry (Yuki's carry signals + Ingrid's curve signals + Sasha's vol-risk-premium harvested as one portfolio). Cross-asset momentum across the firm's tradable universe (every venue, every instrument, every desk). Cross-asset mean-reversion at horizons no single archetype's cousin tunes for.

**Cross-archetype stat-arb (illustrative).** Pairs / triples that span archetype boundaries (a crypto miner vs a power-grid utility vs a natgas calendar — Theo + Marcus inputs combined). Cross-venue arb that requires both Marcus's CeFi venues and Aria's prediction-market venues (an event resolution that prices differently in a derivative market vs a prediction market). Cross-archetype lead-lag (a Henry-side equity-flow signal predicting a Sasha-side vol move).

**Market-neutral firm-systematic sleeves.** Long-short factor portfolios that net to delta-neutral across the entire firm (not just within Henry's book). Carry-vol-momentum-quality multi-factor with risk decomposition managed at the firm level. Statistical risk-premium harvesting (volatility-risk-premium, term-premium, credit-premium) sized as one portfolio.

**Meta-strategies that allocate across archetypes' fleets.** Tactical regime-conditional reallocation (when vol-regime shifts to "expanded," reweight from Marcus's funding-harvest fleet to Sasha's short-vol fleet). Dispersion across archetype-fleet performance — bet on the spread between archetype-fleet outcomes when correlations decouple. Strategy-of-strategies portfolios where the underlying units are entire archetype fleets, not individual strategies.

**Capacity-allocation strategic moves.** Where to shift firm capital across archetype fleets when one is at cap and another has headroom. When to commission a new archetype fleet (a new asset-class desk going automated). When to retire a strategy class entirely across the firm — this is Quinn's call, with David's sign-off.

The cognitive shift: in the old world, Quinn ran 20–80 strategies herself. In the new world, she runs **dozens of cross-archetype firm-systematic strategies plus oversees thousands of strategies across all the archetype fleets**. Her own fleet is a smaller fraction of total firm activity; her oversight surface is the larger fraction.

## 2. What Stays Quinn

Quinn was already mostly process and judgment over execution. The platform automates the cross-archetype mechanics; what stays her:

- **Cross-archetype correlation drift judgment.** When the correlation matrix between Marcus's fleet, Henry's fleet, and Sasha's fleet starts to migrate, the platform flags it but doesn't decide what it means. Is this regime shift, or is it that Marcus, Henry, and Sasha all started consuming the same new feature (a shared latent factor newly active)? Different causes, different responses. Quinn's reading.
- **Strategy-class sanctioning.** When a new strategy class is proposed (a Diego-side in-running scalp template, a Naomi-side document-NLP-driven deal-screen) that the firm has not yet approved as an alpha class, sanctioning is a Quinn judgment. Does this class's risk profile fit the firm? Does it overlap dangerously with existing classes? What capacity should it be capped at across all archetypes that could run it?
- **Capacity-allocation strategic moves at firm level.** The allocation engine proposes; David has firm-budget veto; but the strategic move ("shift 10% of firm capital from rates-and-FX to crypto over the next quarter because edge is migrating") is Quinn's call to formulate, with David's sign-off. The optimizer doesn't make strategy calls, it implements them.
- **Cross-archetype meta-strategy invention.** A meta-strategy that allocates across archetype fleets cannot be invented by any single archetype's cousin. Quinn sees the cross-fleet view; meta-strategy ideas originate from her or from the joint-research surfaces she runs with the floor.
- **Promotion-gate calibration across the firm.** What Sharpe threshold should a Marcus-side basis-arb pass to go live? What Sharpe should a Diego-side in-running scalp pass? Different. Calibrated by archetype + strategy class + capital tier. Quinn sets and revises these thresholds in conjunction with David.
- **Cross-archetype crisis judgment.** When a regime shift impairs three archetype fleets at once (a stablecoin depeg hits Marcus + Julius; a flash crash hits Henry + Sasha; an oracle deviation hits Aria + Julius), Quinn coordinates the cross-fleet response. Per-archetype kill switches are owned by each archetype's trader; firm-wide responses are Quinn + David.
- **Research priority across the firm.** Where should the firm's joint research compute go this quarter? What new alpha class should the firm prioritize? Quinn shapes the cross-archetype research agenda — partly her own work, partly directing where Marcus / Henry / Sasha / others should investigate.
- **Distinguishing decay from regime.** When an archetype fleet underperforms, is the strategy class decaying, or is the current regime simply unfavorable for it? The per-archetype trader has the domain read; Quinn has the cross-archetype context (is this class underperforming uniquely, or in line with the regime backdrop). Joint diagnosis.

The platform is opinionated about what to automate (cross-fleet aggregation, correlation tracking, allocation optimization) and humble about what cannot be (cross-archetype strategy-class judgment, capacity-allocation strategic intent, regime interpretation in cross-fleet context).

## 3. The Data Layer for Quinn

Quinn's existing manual sections cover the firm-level data lake — orderbook history, fundamentals, on-chain, polling aggregators, etc. — that her own strategies consume. The same lake serves every archetype.

What's distinct for Quinn in automated mode is **the firm-aggregate view of the data layer** — the lens above any single archetype's catalog filter.

**3.1 Firm-Aggregate Data Catalog View.** Quinn's catalog filter is **all archetypes, all asset classes**, not crypto-only or equity-only. Layout matches the standard catalog browser (see [Marcus's section 3.1](trader-archetype-marcus-cefi.md#31-the-data-catalog-browser) for the structural reference) with one extra dimension: **per-dataset, which archetypes' fleets depend on it**. A dataset with 4 archetype-fleet dependencies is firm-critical; one with single-archetype dependency is bounded. Used during procurement strategic decisions (a $2M/year feed used by 5 archetype fleets is a different conversation from one used by Marcus alone).

**3.2 Quinn's Distinct Datasets.** Beyond the per-archetype core datasets (covered in each archetype's appendix), Quinn consumes:

- **Cross-archetype performance archives.** Every archetype fleet's rolling Sharpe, drawdown, regime fit, capacity utilization, attribution decomposition — at fleet-level, weekly granularity. Feeds her meta-strategies that allocate across fleets.
- **Firm-aggregate position state archives.** Every position the firm holds across all archetypes, with risk decomposition and historical evolution. Feeds her cross-fleet correlation analysis.
- **Risk-factor archives.** Standard factor models (equity factors via Barra-style decomposition, fixed-income factors, cross-asset macro factors, crypto-native factors when defined). Quinn's stat-arb depends on these.
- **Cross-venue execution-quality archives.** Slippage realized vs assumed across every archetype's fleet. Feeds capacity estimation.
- **Sanctioned-strategy-class archive.** Every strategy class the firm has sanctioned, currently active or retired, with the rationale and outcome. Quinn's institutional memory of strategy-class decisions.

**3.3 Firm-Level Procurement Lens.** When Quinn evaluates a procurement, she sees cross-archetype usage potential, not single-archetype P/L attribution. A new alt-data feed might serve 3 archetypes' fleets and Quinn's firm-systematic sleeves; the procurement decision is firm-level. Coordinates with each archetype's procurement views (their per-archetype sections cover the per-archetype lens).

**3.4 Gap Analysis at Firm Level.** What datasets would unlock a cross-archetype strategy class the firm cannot currently run? E.g. "If we licensed a real-time M&A-deal-NLP feed, Naomi's automated cousin would benefit, and Quinn could run a cross-archetype event-driven sleeve combining Naomi's deal signals with Sasha's vol structures around announcement dates." Gap analysis surfaces this composite ROI.

**3.5 Cadence.** Daily glance during fleet review; deeper weekly review of procurement lens; monthly cross-archetype gap analysis with each archetype's PM and David.

**3.6 Why this matters.** Without the firm-aggregate lens, the firm pays twice for the same dataset across desks, misses cross-archetype data uplifts, and cannot prioritize licensing strategically. Quinn's lens is the difference between $20M/year of disciplined data spend and $30M/year of accidental duplication.

## 4. The Feature Library for Quinn

Quinn's existing manual sections cover the feature library in depth (her [Phase 1 feature-library section](#feature-library-unique) is her surface). The library serves every archetype; nothing about that changes.

What's distinct in the new world is the **cross-archetype factor lens** — features that span archetype domains and become the inputs to Quinn's firm-systematic strategies.

**4.1 Cross-Archetype Feature Discovery.** Quinn's filter on the feature library is **cross-pollination-relevant**: features built by one archetype that have been (or could be) consumed by strategies in another. The library surfaces these explicitly — a "used by 3+ archetypes" tag flags genuinely cross-firm features. Examples: a vol-regime feature originally built by Sasha now consumed by Marcus's basis-arb regime gating; a stablecoin-flow feature built by Julius now consumed by Henry's exchange-stock-correlation strategies; a polling-aggregator feature built by Aria now consumed by Yuki's USD-related macro strategies.

**4.2 Quinn's Distinct Features (Illustrative).** Beyond per-archetype features, Quinn builds and consumes:

- **Cross-asset factor exposures.** Standard factors (value, growth, momentum, low-vol, quality, size) extended cross-asset where defensible. Risk-decomposition primitives for her market-neutral sleeves.
- **Cross-archetype-fleet correlation signals.** Rolling pairwise correlations between archetype fleets at PnL space, with regime conditioning. Drives her meta-strategy allocation logic.
- **Firm-aggregate-position derived features.** "What is the firm's net delta to BTC across all desks right now?" — a feature consumed by her hedging overlays.
- **Regime composites.** Multi-input regime classifiers (vol-regime + correlation-regime + liquidity-regime + macro risk-on/off) that gate her meta-strategies.
- **Capacity-utilization features.** Per-archetype-fleet capacity utilization, fleet-headroom estimates, fed into her capital-allocation logic.
- **Strategy-class-aggregate features.** Funding-harvest-as-a-class realized Sharpe and drawdown profile (averaged across all instances across archetypes that run the class). Used in strategy-class sanctioning decisions.

**4.3 Feature Engineering Cadence.** Quinn engineers cross-asset / cross-fleet features that single-archetype researchers don't naturally surface. Her engineering load is moderate — she leans heavily on archetype-specific features built by their owners — but the cross-archetype features are her unique contribution.

**4.4 Cross-Pollination as a Daily Surface.** Quinn's cross-pollination view is foveal, not light-touch (unlike, say, Marcus's). She actively curates and propagates — when Theo's hurricane-track-probability layer feature looks like it could feed Marcus's BTC-correlation-with-natgas strategy, Quinn flags the connection. Her view of the cross-archetype feature graph is the firm's institutional intelligence about feature cross-applicability.

**4.5 Why this matters.** Without cross-archetype feature discovery, the firm's accumulated alpha vocabulary fragments along desk lines; cross-asset alpha goes uncaptured. Quinn's role at the feature-library level is the connector — she compounds the firm's research output by making cross-pollination structural, not accidental.

## 5. The Research Workspace

Quinn's existing manual sections cover the research workspace, backtest engine, and walk-forward validation framework in detail. Same notebook environment, same backtest engine, same anti-pattern enforcement as every other archetype — see [foundation §3](automation-foundation.md) and [Marcus's section 5](trader-archetype-marcus-cefi.md#5-the-research-workspace) for shared mechanics.

What's distinct: **strategy-template library** is meaningfully different for Quinn.

**5.4 Quinn's Strategy Templates (Illustrative).** Pre-built compositions Quinn starts from:

- **Cross-archetype factor portfolio template.** Multi-factor long-short portfolio across multiple asset classes; risk decomposition into named factors; rebalance cadence; transaction-cost-aware optimization.
- **Cross-asset stat-arb template.** Pair / basket trade across asset class boundaries; cointegration-based or correlation-based; entry/exit on z-score thresholds; risk gating.
- **Meta-strategy fleet-allocator template.** Allocate firm capital across archetype fleets based on rolling Sharpe, regime fit, capacity utilization. Not a strategy in the usual sense — a portfolio-of-fleets composition.
- **Cross-archetype event-driven sleeve.** Combine event signals from one archetype (Naomi's deal-state) with hedging structures from another (Sasha's vol structures around the announcement window).
- **Firm-systematic carry / momentum / mean-reversion templates.** Cross-asset, multi-horizon, the canonical alpha-style sleeves run as firm portfolios.

**Backtest engine extensions Quinn cares about most:** cross-asset backtesting (different asset classes have different conventions — borrow cost for shorts, funding for perps, fixings for FX, dividends for equities; the engine handles all of them in one backtest). **Multi-fleet backtesting** — backtest a meta-strategy that allocates across simulated fleets, where each underlying fleet's behavior is itself the output of a fleet-level simulation.

Otherwise: same workspace, same kernel, same compute model. Quinn's daily use is heavier on cross-asset queries, lighter on single-instrument microstructure (she leaves that to Marcus / Mira).

## 6. The Model Registry

Same registry, same versioning, same reproducibility guarantees as every archetype — see Quinn's existing manual section and [Marcus's section 6](trader-archetype-marcus-cefi.md#6-the-model-registry) for shared mechanics.

What's distinct: Quinn cares about the **firm-aggregate model registry view** — every model deployed across every archetype fleet, with cross-fleet dependency tracking. When a foundational feature is being deprecated, the lineage navigator (across the whole firm, not one archetype) shows every model affected. When a model in Marcus's fleet starts drifting, Quinn sees whether Henry's or Sasha's fleets share any feature inputs that might be the upstream cause.

**Distinct surface: cross-archetype model audit.** Quinn periodically audits models across archetypes for shared latent risk — multiple archetypes consuming similar features can produce hidden correlation when the shared feature drifts. Audit cadence: quarterly; ad hoc during cross-fleet correlation alerts.

## 7. The Experiment Tracker

Same tracker, same anti-pattern enforcement as every archetype — see [Marcus's section 7](trader-archetype-marcus-cefi.md#7-the-experiment-tracker).

What's distinct: Quinn's experiment tracker view aggregates **cross-archetype experiment runs** — joint experiments she runs with archetype researchers, plus the visibility she has into archetype-specific experiments where a cross-archetype implication is flagged (e.g. an experiment in Henry's tracker that uses a feature Quinn also uses; the platform cross-links).

**Joint-research workflow.** When Quinn collaborates with an archetype researcher (Marcus on a CeFi-side cross-asset strategy, Sasha on a vol-structure overlay for a Quinn equity sleeve), the tracker supports multi-author experiment runs with attribution split rules. Co-authored experiments are first-class.

## 8. Strategy Composition

Same composition surface, same validation gates as every archetype — see [Marcus's section 8](trader-archetype-marcus-cefi.md#8-strategy-composition).

What's distinct for Quinn:

**Cross-archetype composition.** Quinn's strategies often have legs in multiple archetypes' instrument spaces. A market-neutral factor sleeve has equity legs (Henry's space), futures legs (Ingrid's / Theo's space), and FX hedges (Yuki's space). The composition surface supports this natively — instrument selectors span asset classes, venue routing respects each archetype's venue infrastructure, attribution decomposes by archetype-leg.

**Meta-strategy composition.** A meta-strategy that allocates across fleets has a different shape — its underlying unit is a fleet, not an instrument. The composition surface supports fleet-level units (with fleet-state inputs: rolling Sharpe, drawdown, regime fit, capacity utilization). Distinct sub-template; pre-built scaffolds in Quinn's template library.

**Pre-deployment validation extensions.** Standard validation (lookahead, sizing, kill-switch wiring) runs as for any archetype. Additionally, Quinn's cross-archetype strategies are validated for **cross-fleet correlation** (does this new strategy substantially correlate with existing archetype fleets, beyond declared overlap?) and **firm-level concentration** (does this strategy push firm exposure past concentration limits in any factor / asset / venue dimension?). Findings gate promotion to live.

## 9. Promotion Gates & Lifecycle

Same lifecycle stages, same gate UI, same decision log as every archetype — see [Marcus's section 9](trader-archetype-marcus-cefi.md#9-promotion-gates--lifecycle).

What's distinct: **Quinn is the strategy-class sanctioning authority for the firm**. New strategy classes (not new instances of existing classes) require Quinn's sanctioning sign-off in addition to the per-archetype trader's promotion approval and David's risk sign-off.

**Strategy-class sanctioning workflow:**

- An archetype researcher proposes a new strategy class (a template, parameterized for instances). Example: Diego proposing an in-running over-2.5-goals-fade template; Naomi proposing a regulatory-pattern-NLP screen.
- Quinn evaluates: does this class fit the firm's risk profile? Does it overlap with existing sanctioned classes (in which case, is the overlap acceptable or should the existing class be retired in favor of the new one)? What's the firm-wide capacity ceiling? What promotion thresholds (Sharpe, drawdown, in-distribution-days) apply to instances of this class?
- Quinn sanctions or rejects with reason. Sanctioned classes are added to the firm's sanctioned-class registry; instances of sanctioned classes can flow through the standard promotion gates.
- Sanctioned classes are periodically re-reviewed (annual or on-trigger when class-level performance degrades). Re-review may revoke sanction (no new instances permitted; existing instances flow into demotion / retire).

**Class-retire decision.** When a strategy class as a whole is retired (across all archetypes), the decision is Quinn + David. Existing instances flow to monitor / retire per archetype-trader judgment, but no new instances of the class can be deployed by any archetype's cousin.

This sanctioning surface is **distinct from per-strategy promotion**, which stays with the archetype trader. Quinn doesn't approve every Marcus strategy instance; she approves the class.

**Quinn's own strategies** flow through standard lifecycle gates, with David as her sign-off counterparty for material capital allocations (see her existing manual sections).

## 10. Capital Allocation

Quinn's existing manual sections cover the capital allocation engine for her own strategies. What's distinct in the new world: **firm-aggregate capacity-and-allocation oversight** across every archetype fleet plus her own.

**10.1 The Cross-Fleet Allocation View.** A meta-allocation surface above the per-archetype allocation engines.

**Layout:**

- **Top panel** — total firm capital, allocated by archetype fleet + Quinn's firm-systematic sleeves. Per-fleet budgets set by David (firm-level constraint).
- **Main table** — every archetype fleet (and Quinn's sleeves) as rows. Columns: capital deployed, capital cap, rolling Sharpe, drawdown, regime fit, capacity utilization (% of class-aggregate capacity), recent attribution.
- **Right panel** — risk decomposition firm-level: gross / net / VaR / per-asset-class / per-factor / per-venue / per-counterparty. Stress-scenario PnL across the firm under standard scenarios (rate shock, vol shock, crypto depeg, equity flash crash).
- **Bottom panel** — proposed reallocation across fleets (when Quinn runs the optimizer at fleet level, not strategy level). Material proposed shifts (>10% across fleets) escalate to David.

**10.2 Firm-Aggregate Capacity Tracking.** Per strategy class (across all archetype instances), per archetype fleet (aggregated across all classes), per asset class, per venue. Where the firm has headroom; where the firm is at cap. Quinn's strategic capacity-allocation moves originate here — when one fleet is at cap and another has headroom, can capital migrate without violating risk constraints?

**10.3 Cross-Archetype Risk Concentration.** A specific surface for catching firm-level concentration that no single archetype's allocation engine can see:

- **Firm net delta** to each major underlying. (BTC net delta across Marcus + Julius + Quinn's crypto sleeve + any equity-side BTC-correlated names + any options-side BTC vol — the firm's unhedged exposure.)
- **Firm net beta** to each factor (equity-vol, rate-level, FX-carry, crypto-realized-vol).
- **Per-counterparty firm-aggregate exposure** (every venue, every prime broker, every custodian, every protocol — covered in each archetype's procurement view at archetype level; aggregated at firm level for Quinn).
- **Concentration warnings** when firm-aggregate exposure exceeds threshold in any dimension.

**10.4 Strategic Reallocation Workflow.** When Quinn proposes a strategic shift ("move 10% of firm capital from rates-and-FX to crypto over the next quarter"), the workflow:

- Quinn formulates the proposal with rationale.
- Optimizer runs scenario analyses — what's the expected Sharpe uplift, downside scenarios, capacity feasibility, transition cost.
- David's sign-off as firm-budget authority.
- Per-archetype implementation: the receiving archetype absorbs the new capital into their fleet through their normal allocation engine; the giving archetype unwinds. Quinn coordinates the transition timing.
- Decision logged in the strategic-allocation decision log (separate from per-strategy decisions).

**10.5 Why this matters.** Without firm-aggregate capacity tracking, the firm has stranded capital (one fleet at cap while another is underdeployed) and hidden concentration (firm-net-delta accumulating across desks no one is summing). The cross-fleet allocation lens is the firm's defense against both.

## 11. Live Fleet Supervision Console

Quinn's existing Phase 3 sections cover the supervision console for her own strategies in detail (the strategy fleet dashboard, anomaly console, drift indicators, capacity tracker, cross-strategy correlation matrix, kill switches). All of that applies to her own ~20–80 systematic strategies.

What's distinct in the new world is the **cross-archetype-fleet supervision lens** — the level above any single archetype's console.

**11.1 The Cross-Fleet Dashboard.** A meta-dashboard where each row is **an archetype fleet plus each of Quinn's firm-systematic sleeves**, not an individual strategy.

**Layout:**

- **Top filter bar** — health filter, archetype filter, asset-class filter.
- **Main grid** — one row per fleet. Columns: fleet name (Marcus / Henry / Sasha / etc., plus Quinn's sleeves), strategy count (live / paper / pilot / monitor), capital deployed / cap, fleet PnL today / WTD / MTD / YTD, fleet rolling 30d Sharpe, fleet drawdown, capacity utilization, regime fit, **fleet health badge** (rolled up from per-strategy badges), **anomaly count today** (count of amber / red alerts in this fleet today), last-intervention timestamp + actor.
- **Sortable, expandable.** Click a fleet → opens that archetype's per-strategy fleet dashboard (Quinn's view-into-Marcus's-console).

The cross-fleet dashboard is **green-by-default at fleet level** even if individual strategies are amber. Quinn doesn't drill into a Marcus strategy unless the Marcus fleet's badge has flagged or Marcus has flagged the cross-correlation impact.

**11.2 The Fleet Detail Page.** Click a fleet → fleet-aggregate detail.

**Layout:**

- **Header** — fleet name, owner archetype, strategy counts per stage.
- **Top section** — fleet equity curve (cumulative across all live strategies), fleet drawdown, fleet attribution (by strategy class, by regime, by venue).
- **Middle section** — top contributors / detractors today; outliers in performance; strategies with active alerts.
- **Bottom section** — fleet-level capacity utilization curve, fleet-level correlation matrix internal-to-this-fleet, recent fleet-level interventions by the archetype trader.

This page is Quinn's view of an archetype's performance without needing to context-switch into the archetype's full console. For deep diagnostics, she drills into the archetype's per-strategy view.

**11.3 Cross-Fleet Anomaly Surface.** Anomalies at fleet level (distinct from per-strategy anomalies, which the archetype trader owns). Categories:

- **Fleet-aggregate performance anomaly** — fleet underperforming its rolling distribution at 2σ / 3σ.
- **Cross-fleet correlation drift** — two fleets that should be uncorrelated are drifting together.
- **Firm-aggregate factor exposure anomaly** — net firm exposure to a factor / underlying / counterparty exceeds threshold.
- **Capacity migration signal** — a fleet hitting cap while a sister fleet has headroom (capital-allocation opportunity).
- **Class-level decay signal** — a strategy class showing degraded Sharpe across multiple archetypes' instances simultaneously (suggests class-level decay, not instance-specific).
- **Cross-archetype regime-mismatch** — a regime shift impairing multiple archetype fleets at once (Quinn-level intervention candidate).

Severity tiers: info / warn / critical. Routing rules per Quinn's preferences.

**11.4 Cross-Fleet Correlation Matrix.** Quinn's manual sections cover correlation within her own fleet. The cross-fleet matrix is its meta-version — pairwise correlations between **archetype fleets** in PnL space, plus **cross-fleet factor decomposition** (firm net exposure to BTC, USD-DXY, S&P, vol, etc., with each fleet's contribution called out).

**Drift detector at fleet level** — alerts when a previously-uncorrelated fleet pair starts correlating beyond threshold. Often the leading indicator of a shared latent factor newly active across the firm.

**11.5 Firm-Aggregate Risk Live State.** The Quinn equivalent of Marcus's "Multi-Venue Capital + Balance Live State." Distinct content:

- **Firm-aggregate factor exposures** live: net delta to BTC / SPX / DXY / 10Y yield / oil / gold / VIX / MOVE.
- **Per-counterparty firm-aggregate exposure** live: every venue, every prime broker, every custodian, every protocol with material firm exposure. Color-coded health (counterparty in stress = red).
- **Concentration warnings** live.
- **Regime classifier output** firm-level: which regimes are currently active and which strategy classes are favored / disfavored under those regimes.

Foveal during cross-fleet incidents (a counterparty in stress, a regime shift, a major macro event).

**11.6 Strategy State Inspection.** Quinn retains the same per-strategy state-inspection capability described in her existing Phase 3 sections (and structurally identical to [Marcus's section 11.6](trader-archetype-marcus-cefi.md#116-strategy-state-inspection)) — for **her own systematic strategies**. Internal-state view per strategy, on-demand or event-pushed; backtest-vs-live comparison computed daily by default.

**Distinct: cross-fleet inspection authority.** Quinn has read access to **any strategy in any archetype's fleet** for cross-fleet diagnostic work. When investigating a cross-fleet correlation drift, she may need to inspect a specific Marcus strategy's regime classifier output or a specific Henry strategy's factor exposure intermediates. The platform supports this with an audit-logged inspection action — the archetype trader sees that Quinn inspected one of their strategies, with reason logged. Read-only; Quinn cannot modify another archetype's strategy state from inspection (interventions on cross-fleet strategies route to the archetype trader through coordination, not direct action).

**Engineering pragmatism:** state inspection is on-demand or event-pushed, not constantly streamed. This applies at fleet level too — Quinn does not stream every variable of every strategy of every fleet; she inspects when investigating.

**Backtest-vs-live comparison at fleet level.** A meta-version: each fleet's live performance overlaid on the fleet's combined backtest expectation (the sum of constituent strategies' backtests). Divergence flagged. Daily cadence; on-demand refresh available.

**11.7 Why this matters.**

- **Efficiency:** cross-fleet supervision is anomaly-driven at the fleet level. Quinn does not stare at thousands of strategies; she trusts the per-archetype consoles to handle per-strategy supervision and intervenes only when fleet-level or cross-fleet patterns surface.
- **Risk:** cross-fleet correlation drift, firm-aggregate factor concentration, and class-level decay are caught by the meta-console — patterns invisible to any single archetype's view.
- **PnL:** firm-aggregate capacity-and-allocation moves (which only Quinn's lens can support) compound returns at the firm level beyond what archetype-level optimization can achieve.

## 12. Intervention Console

Quinn's existing Phase 3 sections cover per-strategy intervention controls (start / pause / stop, capital cap, risk limits, schedule, mode, force-flatten) and her kill switches at strategy / group / fleet level. All of that applies to her own systematic strategies and her direct interventions.

What's distinct: **cross-fleet interventions are coordination-mediated, not direct.**

**12.1 Per-Strategy Controls (her own strategies).** Same as her existing manual sections — see [Phase 2 strategy control panel](#strategy-control-panel-unique--primary-phase-2-surface) and her existing intervention surfaces.

**12.2 Group Controls.** Same as existing — pause-by-class, pause-by-venue, pause-by-tag for her own fleet. Plus **cross-fleet group controls** that operate by signaling, not direct execution: "request all archetype fleets to pause USDT-margined strategies because of a stablecoin depeg" — fans out as alerts to each archetype trader, who execute their own pauses. The platform tracks the request and responses; Quinn sees who has confirmed, who hasn't, with timestamps.

**12.3 Manual Trading & Reconciliation.** **Even Quinn — the most systematic archetype — retains manual trading capability. This is non-negotiable across the floor.**

Three primary scenarios for Quinn:

**1. Reconciliation between firm-aggregate state and venue / archetype state.**
The firm-aggregate position view should always match the sum of per-archetype views, which should always match per-venue reality. In practice these can diverge during venue outages, archetype-fleet position-state lag, or platform reconciliation glitches. Quinn occasionally needs to manually adjust to bring views into alignment — typically by initiating a reconciliation workflow that the archetype trader executes, but in firm-systematic-sleeve cases (her own strategies' positions) she may execute directly.

**2. Emergency intervention on a cross-fleet position.**
Rare but real. If a cross-archetype event requires immediate firm-aggregate flattening (a kill-switch failure, a counterparty default mid-trade requiring rapid unwind, a stablecoin depeg requiring firm-wide USDC flatten), Quinn may need to act directly on her own sleeves while the archetype traders act on theirs. Coordinated; multi-actor; Quinn's manual ticket is one of several being used in parallel.

**3. Discretionary directional override on top of a firm-systematic sleeve.**
Quinn rarely goes discretionary, but a strong cross-asset macro view (a major regime-shift she has confidence in but the systematic models haven't yet captured) may warrant a layered override on a firm-systematic sleeve. Tagged as override; same friction and audit as Marcus's override case.

**The full manual order ticket** (multi-leg, hotkeys, smart router, multi-venue ladder, pre-trade preview, compliance gates) is preserved for Quinn — same surfaces as Marcus's [section 12.3.1](trader-archetype-marcus-cefi.md#1231-the-full-manual-order-ticket). Cross-asset capability is essential — Quinn's manual ticket can express equity legs, futures legs, FX hedges, crypto legs in one composition, routed across the appropriate venues.

**Trade tagging.** Reconciliation / emergency / override / firm-systematic — every manual trade tagged. Attribution flows through P/L, performance metrics, reports. David's behavioral monitoring tracks Quinn's intervention frequency.

**Reconciliation workflow.** Same shape as [Marcus's reconciliation workflow](trader-archetype-marcus-cefi.md#1233-reconciliation-workflow), with **firm-aggregate dimension added** — the discrepancy view shows platform-firm-aggregate vs sum-of-archetype-views vs sum-of-venue-views; three columns instead of two. Per-row actions to reconcile any pair.

**Emergency mode.** Same designed UI mode as every trader — manual ticket pinned, multi-venue aggregated ladder, working orders, latency / connectivity panel foveal. Switchable in one keystroke. Quinn's hotkeys and muscle memory preserved (her muscle memory is lighter than Marcus's because she manually trades less often, but the surfaces are identical).

**Global manual-trading hotkeys.** Always bound: open manual ticket, flatten focused instrument across firm, cancel-all-firm-systematic, switch to emergency mode.

**Audit & friction.** Same as Marcus — reconciliation light friction, override full friction, every trade audit-logged.

**Why this matters.** Even fully systematic, Quinn's ability to act manually during reconciliation, emergency, or override is platform validation as much as workflow. If she can't, the platform's execution layer hasn't been verified end-to-end for her.

**12.4 Kill Switches.** Distinct levels for Quinn:

- **Per-strategy kill** (her own strategies).
- **Per-class kill** (her own strategies in a class).
- **Quinn's own fleet kill** — all her firm-systematic sleeves; multi-confirmation.
- **Cross-archetype-fleet kill request** — Quinn cannot directly kill another archetype's fleet; she requests, the archetype trader executes. Platform tracks the request.
- **Firm-wide kill** — Quinn + David + CIO + risk officer; multi-key authentication for catastrophic events. Quinn is one of the firm-wide kill authorizers.

**12.5 Intervention Audit Log.** Same shape as her existing sections. Distinct: **cross-fleet inspection actions** (read-only inspections of other archetypes' strategies for diagnostic purposes) are logged as a separate event class. Quinn's pattern of cross-fleet inspections is itself a behavioral signal David monitors.

**12.6 Why this matters.**

- **Efficiency:** cross-fleet interventions are coordination-mediated by default — Quinn doesn't directly touch other archetypes' strategies, preserving archetype trader ownership. Platform makes the coordination cheap (request fans out, responses tracked).
- **Risk:** firm-wide kill switches are designed multi-actor authorizations; no single individual can nuke the firm.
- **PnL:** the cost of over-intervention by Quinn is missed PnL across multiple fleets; the cost of under-intervention is firm-aggregate damage. The granular controls plus disciplined audit balance both.

## 13. Post-Trade & Decay Tracking

Quinn's existing Phase 4 sections cover per-strategy retrospectives, fleet attribution, decay metrics, backtest-vs-live divergence tracker, retire/promote decision log, and research velocity metrics — for her own fleet.

What's distinct: **firm-level post-trade and decay tracking** across every archetype fleet plus her own.

**13.1 Cross-Fleet Retrospectives.** Auto-generated weekly and monthly per archetype fleet.

**Layout (per fleet retrospective):**

- Performance vs expectation: fleet-aggregate Sharpe vs research-time fleet-aggregate distribution; equity curve; backtest counterfactual.
- Drawdown decomposition at fleet level.
- Per-strategy-class contribution (which classes generated, which detracted).
- Capacity realized vs assumed at fleet level.
- Recent fleet interventions + observed effect.
- Cross-fleet correlation evolution: did this fleet drift toward correlation with sister fleets this period?
- Recommended fleet-level action: continue / class-retire / capacity-rebalance / class-sanctioning-revisit.

Distributed via standard reports; Quinn reads end-of-week.

**13.2 Firm-Aggregate Attribution.** Across all fleets plus her own:

- By archetype fleet.
- By strategy class (aggregated across archetypes).
- By asset class.
- By regime.
- By factor exposure.
- By venue / counterparty.
- **Risk-adjusted contribution per fleet** — Sharpe contribution to firm; marginal Sharpe (if a fleet were retired entirely, what would firm Sharpe become).

Quinn reads weekly (Sunday); informs Monday cross-fleet capital-allocation decisions.

**13.3 Firm-Level Decay Surface.** Distinct from per-strategy decay (covered in each archetype's appendix and Quinn's existing sections).

- **Fleet-level Sharpe-over-time** with confidence bands; statistical-significance flag on declining trend per fleet.
- **Strategy-class half-life estimates aggregated across the firm** — when a class is decaying everywhere it runs, that's a firm-level signal that the class itself is losing edge (vs an instance-specific issue).
- **Cross-fleet feature-importance shifting** — if a foundational feature is losing importance across multiple archetypes' models, it's a firm-level decay signal warranting joint investigation.
- **Backtest vs live divergence at fleet level** — fleet-aggregate live performance vs sum-of-strategy-backtests; statistical-significance flag.

**13.4 Strategy-Class Retire Decisions.** When firm-level decay confirms a strategy class is no longer alpha-generating, Quinn proposes class-retire. Process:

- Evidence linked: cross-archetype Sharpe trend, decay statistics, per-archetype-instance failures, regime-conditional analysis.
- David's sign-off as firm-budget authority.
- Per-archetype implementation: archetype traders demote / retire instances of the class through their normal lifecycle.
- Class moves to "retired" in the firm's sanctioned-class registry; no new instances permitted.
- Re-promotable later if regime shifts (rare).

**13.5 Quinn's Own Decay & Retrospectives.** Per her existing manual sections. Same retrospectives, decay surface, decision log applied to her firm-systematic sleeves at strategy level. Weekly + monthly cadence.

**13.6 Why this matters.**

- **Efficiency:** firm-level retrospectives auto-generated; Quinn reads, doesn't compose. Decay decisions are evidence-driven at firm scale.
- **Risk:** decaying strategy classes caught by metrics, not by gut. Capital trapped in dying classes is recycled into research priorities at firm level.
- **PnL:** firm-aggregate decay tracking compounds the effect of per-archetype decay tracking — decisions about class-level survival happen at the right scope.

## 14. The Supervisor Console — Quinn's Daily UI

Quinn's existing physical-setup section covers her 4-monitor layout. The automated-mode supervisor console is the same physical setup with **content updated for the cross-archetype meta-overseer role**.

**14.1 Quinn's Monitor Layout (Illustrative, Updated).**

| Position     | Surface (manual)                     | Surface (automated)                                                                                     |
| ------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Top-left     | Strategy fleet dashboard (her fleet) | **Cross-fleet dashboard** (every archetype fleet + her sleeves); her own fleet drilldown one click away |
| Top-right    | Research workspace                   | Research workspace (cross-archetype factor / stat-arb / meta-strategy work)                             |
| Bottom-left  | Anomaly / alert console (her fleet)  | **Cross-fleet anomaly console** + her own fleet anomalies                                               |
| Bottom-right | Capital allocation + correlation     | **Cross-fleet allocation engine** + cross-fleet correlation matrix + firm-aggregate risk                |
| Tablet       | Chat / news / desk coordination      | Same — plus archetype-trader coordination feed                                                          |

The center of gravity shifts: in the manual world, foveal-on-her-own-fleet. In the automated world, **foveal-on-cross-fleet plus her-own-fleet at single-click depth**. Her own ~20–80 strategies are still hers; the meta-fleet view is her new primary lens.

**14.2 Mode-Switching.** Modes Quinn's console supports:

- **Cross-fleet supervision mode (default during market hours).** Cross-fleet dashboard + cross-fleet anomaly console + firm-aggregate risk foveal.
- **Research mode.** Research workspace foveal; cross-fleet supervision peripheral.
- **Strategic-allocation mode.** Cross-fleet allocation engine foveal; capacity tracking and risk decomposition prominent. Used during quarterly reallocation cycles.
- **Crisis / cross-fleet event mode.** Cross-fleet anomaly console + firm-aggregate factor exposures + per-counterparty firm-aggregate state + intervention coordination tools foveal. Used during major cross-archetype events.
- **Class-sanctioning mode.** Strategy-class registry + new-class proposals + cross-archetype overlap analysis foveal. Used when evaluating new strategy-class proposals from archetype researchers.
- **Pre-market mode.** Cross-fleet overnight attribution + alerts queue + macro / regime context dominant.
- **Post-market mode.** Cross-fleet retrospectives + firm-level decay surface + research-priority queue dominant.

Switching is one keystroke. Work-in-flight preserved.

**14.3 Anomaly-Driven Default State.** Cross-fleet console is **green-by-default at fleet level**. Most of the day, all fleets are healthy; Quinn is heads-down in research or strategic work. Alerts route through the same channels as every archetype (banner / audio / mobile / phone-page for catastrophe-tier).

Quinn's silence-trust is broader than any single archetype's — she trusts the per-archetype consoles to handle per-strategy supervision and surfaces only fleet-level / cross-fleet patterns.

**14.4 Why this matters.**

- **Efficiency:** time-on-cross-fleet-strategy + research is Quinn's primary leverage. Console design ensures cross-fleet view is foveal-by-default; per-strategy noise stays at archetype-trader level.
- **Risk:** mode-switching to crisis / cross-fleet event mode in seconds is the difference between contained firm damage and runaway loss across multiple fleets.
- **PnL:** the cognitive shift from foveal-on-her-fleet to foveal-on-cross-fleet is what makes meta-overseer + firm-systematic-PM tractable. Without it, the role is impossible.

## 15. Quinn's Automated-Mode Daily Rhythm

Quinn was already systematic; her daily rhythm is closer to an upgrade than a transformation. The structural shift is **cross-fleet visibility** dominating where her-fleet visibility used to dominate.

**15.1 Pre-Market (60–90 min).**

- **Cross-fleet overnight review (15–25 min):** glance at cross-fleet dashboard. Default: all fleets green or amber-acceptable; investigate red. Read overnight cross-fleet anomalies (Asia / EU sessions). Read fleet-level attribution from overnight where applicable (crypto runs continuously; equity / rates / FX have specific pre-open positions).
- **Her-fleet review (10–15 min):** standard supervision of her own ~20–80 firm-systematic strategies. Same cadence as her existing manual sections.
- **Class-sanctioning queue (5–10 min):** any new strategy-class proposals from archetype researchers awaiting her sanctioning sign-off.
- **Research catch-up (10–20 min):** overnight backtests / training runs on her cross-archetype strategies; promote winners, archive losers.
- **Macro / regime read (10–15 min):** standard macro digest. Identify regime-shift signals affecting multiple archetype fleets.
- **Cross-archetype coordination (5–10 min):** quick desk-chat exchanges with archetype traders flagged for the day (a pending promotion, a cross-fleet correlation drift, a procurement decision).

**15.2 In-Market (continuous, anomaly-driven at fleet level).**

Default state: research workspace open in primary monitor; cross-fleet supervision green in periphery. Working on:

- Cross-archetype factor / stat-arb research.
- Meta-strategy fleet-allocation prototyping.
- Strategy-class sanctioning evaluations.
- Joint research with archetype researchers.
- Diagnosing cross-fleet correlation drift.

**Cross-fleet alert response:** when a fleet-level or cross-fleet alert fires:

- Drill into the cross-fleet anomaly console; identify which fleet(s) and which pattern.
- Diagnose: is this a true cross-fleet pattern (intervene at firm level), a single-fleet issue (route to archetype trader for handling), or known transient (acknowledge)?
- If cross-fleet: coordinate response — pause cross-fleet meta-strategies if applicable; signal archetype traders for fan-out actions; firm-aggregate hedge if needed.
- If single-fleet: route to archetype trader; verify acknowledgment.

**Cross-archetype event response (rare):** major event impairing multiple fleets at once (stablecoin depeg, flash crash, exchange exploit, oracle deviation, central-bank surprise). Quinn switches to crisis mode:

- Coordinate cross-fleet response: which fleets to pause, which to keep running, what firm-aggregate hedges to put on.
- Manual ticket if Quinn is layering a directional override or executing reconciliation.
- Communication channel open to all archetype traders for coordination.
- Return to default mode when the event normalizes.

**Mid-day:** quick cross-fleet capital-allocation drift check. Material drift triggers a rebalance proposal Quinn approves or defers.

**15.3 Post-Market (60–90 min).**

- **Cross-fleet attribution (15–20 min):** today's PnL by fleet, by strategy class, by regime. Outliers across fleets identified.
- **Her-fleet attribution (5–10 min):** standard end-of-day for her own firm-systematic strategies.
- **Cross-fleet decay check (10–15 min):** any strategy classes showing cross-archetype decay this week? Any fleets whose Sharpe trend is concerning at fleet level?
- **Cross-fleet capital allocation (10–15 min):** review cross-fleet allocation engine proposal. Material shifts (>10% across fleets) escalated to David.
- **Her-fleet capital allocation (5–10 min):** standard.
- **Research priorities (10–15 min):** queue overnight backtests on cross-archetype strategies.
- **Class-sanctioning workflow (5–10 min):** any new-class proposals to evaluate tomorrow.
- **Sign-off:** confirm cross-fleet alerts acknowledged, fleets in expected state, hand-off to next-shift coverage where applicable.

**15.4 Cadence Variations.**

- **Cross-fleet event weeks** (major macro releases hitting multiple asset classes; cross-asset volatility spikes; counterparty stress events) — supervision-heavy at cross-fleet level.
- **Quiet weeks** — research-dominated; cross-archetype factor / stat-arb work; meta-strategy iteration.
- **Quarterly strategic-reallocation cycles** — Quinn's strategic-allocation mode dominates the week; David coordination intensive.
- **Annual class-review cycle** — every sanctioned strategy class reviewed for continued sanction; Quinn-led, archetype-trader inputs, David sign-off.
- **Quarter-end** — firm-aggregate retrospective, risk-committee report contribution, cross-fleet capital reallocation.

## 16. Differences from Manual Mode

For Quinn, the "manual" baseline is her **already-systematic existing role**. The shift is from "systematic person on a discretionary floor" to "cross-archetype meta-overseer + firm-systematic PM."

| Dimension                 | Manual-floor Quinn                                                     | Automated-floor Quinn                                                                         |
| ------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Coverage                  | 20–80 own strategies                                                   | 20–80 own strategies + oversight of every archetype fleet (thousands of strategies)           |
| Trades per day            | Thousands across her fleet                                             | Same scale own; visibility into firm aggregate (orders of magnitude more)                     |
| Phase 1 (Decide)          | Cross-asset alpha research                                             | Cross-archetype alpha research + class-sanctioning + firm-allocation strategy                 |
| Phase 2 (Enter)           | Promote her strategies through gates                                   | Same + sanction strategy classes for the firm                                                 |
| Phase 3 (Hold)            | Anomaly-driven her-fleet supervision                                   | Anomaly-driven cross-fleet supervision + her-fleet supervision                                |
| Phase 4 (Learn)           | Decay tracking her fleet                                               | Cross-fleet decay tracking + class-level retire decisions + her fleet                         |
| Time on cross-fleet view  | Minimal                                                                | 25–35%                                                                                        |
| Time on own-fleet view    | 30–40%                                                                 | 15–20%                                                                                        |
| Time on research          | 40–50%                                                                 | 35–45% (now cross-archetype focused)                                                          |
| Time on class-sanctioning | None                                                                   | 5–10%                                                                                         |
| Time on coordination      | Low (her fleet was siloed)                                             | 10–15% (cross-archetype coordination is a real surface)                                       |
| Time on intervention      | Low                                                                    | Same (low) — interventions are coordination-mediated                                          |
| Risk units                | Strategy-level + own-fleet aggregate                                   | Same + firm-aggregate factor exposures + cross-fleet correlation                              |
| Edge metric               | Her-fleet Sharpe + decay + capacity                                    | Same + firm-aggregate Sharpe + cross-fleet correlation + class-level survival                 |
| Cognitive load            | Peripheral-on-her-fleet; foveal-on-research                            | Peripheral-on-cross-fleet; foveal-on-cross-archetype-research-or-meta-strategy                |
| Failure modes             | Decay-blindness, p-hacking, runaway algo                               | Same + cross-fleet correlation blindness + class-decay blindness + over-coordination friction |
| Tools mastered            | Research workspace, model registry, lifecycle gates, allocation engine | Same + cross-fleet console + class-sanctioning surface + firm-aggregate risk                  |
| Compensation driver       | Her-fleet Sharpe + research velocity                                   | Same + firm-systematic Sharpe + cross-fleet capacity utilization + class-decision quality     |

The fundamental change: **Quinn becomes the firm's cross-archetype quantitative center of gravity**, not just a senior systematic PM with her own fleet.

## 17. Coordination with Other Roles

Quinn's coordination surface expands dramatically — she now coordinates with **every trader archetype's automated cousin**, plus David, plus any external partner involved in cross-archetype work (typically internal: legal, compliance, IR for certain reports).

### 17.1 Coordination with Each Archetype Trader

For each archetype, Quinn's coordination surface is similar in shape, different in content. Common across all:

- **Cross-fleet correlation visibility** — pairwise correlation between Quinn's fleet (and Quinn's cross-archetype strategies) and the archetype's fleet. Drift alerts route to both Quinn and the archetype trader.
- **Promotion-gate awareness** — when the archetype proposes a new strategy that would substantially correlate with Quinn's existing work, both are alerted before promotion.
- **Class-sanctioning workflow** — when the archetype proposes a new strategy class, Quinn evaluates and sanctions or rejects with rationale. Coordinated through the platform's sanctioning surface.
- **Feature sharing** — cross-archetype features built collaboratively; library is the connector.
- **Joint research collaboration** — joint experiments, joint backtests, co-authored strategies.

**Per-archetype distinct content (illustrative):**

- **Marcus (CeFi crypto).** Cross-asset crypto-vs-equity factor strategies; firm-aggregate BTC / ETH delta tracking; counterparty-aggregate exposure to major crypto venues.
- **Julius (CeFi+DeFi).** All Marcus-side coordination plus on-chain protocol exposure aggregation; cross-domain strategies that span CeFi and DeFi (Quinn-side firm-systematic versions of Julius-style ideas).
- **Sasha (options/vol).** Vol-risk-premium harvesting across asset classes; firm-aggregate vega; cross-asset dispersion strategies.
- **Henry (equity L/S).** Multi-factor equity sleeves; factor exposure aggregation; cross-asset overlay (equity factor vs crypto factor; equity-vs-rate factor).
- **Ingrid (rates).** Cross-asset carry; rate-FX-vol composite carry; firm-aggregate DV01; auction-day cross-fleet positioning awareness.
- **Yuki (FX).** Cross-currency carry; FX-vol composite; firm-aggregate FX exposure; intervention-event coordination.
- **Theo (energy).** Cross-asset commodity factor; energy-vs-rates correlation; OPEC-event cross-fleet positioning.
- **Rafael (macro).** Theme-expression coordination — Rafael formulates themes, Quinn helps express them through systematic sleeves where appropriate; firm-aggregate macro factor exposure.
- **Naomi (event-driven).** Cross-asset event sleeves; deal-window-driven vol structures; event-resolution-window strategies.
- **Diego (sports).** Limited overlap (sports markets are narrow); cross-event statistical-arb where venues overlap with prediction markets.
- **Aria (prediction markets).** Cross-venue arb (Polymarket / Kalshi vs derivative markets); polling-vs-market-price strategies; resolution-window coordination.
- **Mira (market making).** Liquidity-providing peer; firm-aggregate liquidity-providing risk; coordination on inventory limits across venues.

### 17.2 Coordination with David

David is the firm-level supervisor. Quinn is one of the cross-fleet authorities reporting to him.

- **Cross-fleet reporting** — David sees the cross-fleet view Quinn produces; deeper-aggregated than Quinn's view (more committee / regulator / board oriented).
- **Strategic capital-allocation gates** — Quinn's cross-fleet reallocation proposals route to David for firm-budget sign-off.
- **Strategy-class sanctioning sign-off** — material new class sanctioning routes to David in addition to Quinn's evaluation.
- **Behavioral monitoring** — David watches Quinn's intervention frequency, override frequency, cross-fleet inspection frequency, class-sanctioning velocity. Drift in these is a leading indicator David investigates.
- **Catastrophe response** — Quinn is one of the firm-wide kill authorizers (alongside David, CIO, risk officer). Multi-key authentication for catastrophic events.
- **Risk-committee deliverables** — Quinn's monthly cross-fleet attribution + decay analysis + class-level decisions are core inputs to David's committee deck.
- **Joint annual class-review** — Quinn-led, David-signed-off annual review of every sanctioned strategy class.

### 17.3 Cross-Archetype Forum

The platform supports a coordination surface at the firm-systematic-meta level: a regular forum (typically weekly) where Quinn convenes with archetype traders and David to discuss:

- Cross-fleet correlation evolution.
- Class-sanctioning queue.
- Firm-aggregate factor exposure.
- Strategic capital reallocation proposals.
- Joint research priorities.
- Cross-fleet event post-mortems.

The platform doesn't run the meeting; it provides the data — every relevant surface (cross-fleet console, allocation engine, decay surface, class-sanctioning queue) is the meeting's substrate. Decisions made are logged in the appropriate decision logs (sanctioning, allocation, retire) and propagated through the platform's gate workflows.

### 17.4 Why this matters

- **Efficiency:** without coordination surfaces, the firm builds the same strategy twice across desks, doubles up on capacity, dilutes attribution. Quinn's coordination role makes the firm's combined output strictly more than the sum of per-desk outputs. Visibility tools (cross-fleet correlation, class registry, feature library) make the coordination cheap.
- **Risk:** correlated bets across desks compound risk; Quinn's cross-fleet view prevents accidental over-exposure. Class-sanctioning prevents the firm from running unevaluated alpha classes at scale.
- **PnL:** cross-archetype research collaboration and meta-strategies produce alpha that no single desk could find alone. Strategic capital reallocation captures regime-driven opportunity at firm scale.

## 18. How to Use This Appendix

When evaluating Quinn's automated terminal (in particular her cross-archetype meta-overseer role), walk through the surfaces and ask:

**Cross-fleet supervision:**

- Can Quinn supervise every archetype fleet at fleet level, anomaly-driven, default green?
- Are fleet-level health badges, fleet-level anomaly categories (cross-fleet correlation drift, firm-aggregate concentration, class-level decay), and fleet-level intervention pathways all first-class?
- Is the cross-fleet correlation matrix continuously computed with drift detection at fleet level?
- Is firm-aggregate risk live state (factor exposures, counterparty exposure, regime classifier) consolidated in one surface?
- Is cross-fleet strategy state inspection available read-only with audit logging?

**Cross-fleet capital allocation:**

- Does the cross-fleet allocation engine treat archetype fleets (plus Quinn's sleeves) as the unit of allocation?
- Is firm-aggregate capacity tracking per strategy class, per archetype, per asset class, per venue first-class?
- Does cross-archetype concentration tracking surface firm net delta / beta / counterparty exposure?
- Is the strategic-reallocation workflow designed (Quinn proposes, optimizer scenarios, David sign-off, archetype-coordinated implementation)?

**Class-sanctioning lifecycle:**

- Is strategy-class sanctioning a first-class workflow distinct from per-strategy promotion?
- Does the firm maintain a sanctioned-class registry with rationale, capacity ceilings, applicable promotion thresholds?
- Are class-retire decisions evidence-driven (cross-archetype Sharpe trend, decay statistics) and David-signed-off?
- Is annual class-review a designed cycle?

**Cross-archetype research:**

- Can Quinn collaborate with archetype researchers via co-authored experiments and shared notebooks?
- Are cross-archetype features discoverable, with cross-pollination tracked?
- Are cross-archetype strategy templates (cross-asset factor, cross-asset stat-arb, meta-strategy fleet-allocator) populated?
- Is cross-asset backtesting (multiple asset-class conventions in one backtest) supported?

**Cross-fleet post-trade & decay:**

- Are fleet-level retrospectives auto-generated weekly + monthly?
- Is firm-aggregate attribution multi-axis (fleet / class / asset / regime / factor / venue / counterparty)?
- Is cross-archetype feature-importance shifting tracked at firm scale?
- Are class-level decay decisions driven by cross-archetype Sharpe trends, not anecdotes?

**Intervention console & manual trading:**

- Are kill switches granular at strategy / class / Quinn-fleet / cross-fleet-request / firm-wide levels?
- Is **the full manual order ticket** preserved for Quinn, with cross-asset capability (equity legs, futures legs, FX hedges, crypto legs in one composition)?
- Is **emergency mode** designed and one-keystroke-reachable?
- Is **firm-aggregate reconciliation** (platform vs sum-of-archetypes vs sum-of-venues) a designed workflow?
- Is every cross-fleet inspection action audit-logged with reason?
- Are cross-fleet group controls coordination-mediated (request fans out, responses tracked) rather than direct?

**Coordination:**

- Is cross-fleet correlation visible to both Quinn and archetype traders simultaneously?
- Is the class-sanctioning workflow a designed surface, not a chat conversation?
- Does the cross-archetype forum have data-substrate from the platform (cross-fleet console, allocation engine, decay surface, class-sanctioning queue)?
- Are firm-wide kill switches multi-key authenticated with Quinn as one authorizer?

**Daily rhythm:**

- Can Quinn actually spend 35–45% on cross-archetype research while cross-fleet supervision runs in periphery?
- Are cross-fleet supervision mode, research mode, strategic-allocation mode, crisis mode, class-sanctioning mode designed and one-keystroke-reachable?
- Is the cross-fleet console green-by-default and trustworthy in its silence?

**Cross-cutting:**

- Is lineage end-to-end at firm scope (cross-archetype feature → multiple models → multiple strategies across fleets → P/L)?
- Is reproducibility guaranteed for cross-archetype experiments?
- Are audit trails cross-fleet aware (cross-fleet inspections logged separately; class-sanctioning decisions logged immutably)?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones. Quinn's role in the new world is the firm's cross-archetype quantitative center of gravity; gaps in her surfaces compound across every fleet she oversees.
