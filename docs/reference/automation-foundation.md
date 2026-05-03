# Automation Foundation — The Trader-Turned-Quant Terminal

A reference for the **automated** side of the floor. Where the manual archetype docs describe a senior trader at a desk with charts and ladders, this doc describes the same trader after their daily edge has been encoded into models and rules running at scale — hundreds or thousands of strategy instances across the entire market the trader was previously sampling by hand.

The strategies themselves — the models, the rules, the signal logic — are explicitly **out of scope here**. This doc is about **what the trader sees, does, and produces** once that automation exists. It is the redesigned terminal for a trader-turned-quant.

For the manual workflow this builds on, see [manual-trader-workflow.md](manual-trader-workflow.md). For the shared platform surfaces every trader uses, see [common-tools.md](common-tools.md). For the per-archetype profiles, see the `trader-archetype-*.md` files; each has an "Automated mode" appendix that extends what's in this foundation. For the canonical fully-systematic archetype, see [trader-archetype-quinn-quant-overseer.md](trader-archetype-quinn-quant-overseer.md) — Quinn was always this; everyone else is converging on it.

---

## Why This Pivot

Two structural shifts force every senior desk in this direction:

**1. Coverage cannot scale by hand.**
A senior crypto trader watching one BTC perp manually was exploiting microstructure on one instrument. The same trader's edge is genuinely present across **50+ venues × hundreds of instruments × multiple horizons** — but only a tiny fraction is reachable by hand. Automation isn't about replacing the trader; it's about **letting their edge cover the surface area where it actually exists**. A funding-rate dislocation on a small-cap on Bybit at 03:00 UTC is real money to a sharp crypto trader; it is unreachable in a manual workflow.

**2. Capacity is allocated, and the platform must keep up.**
A top-5 firm allocates capital that needs to be deployed at-scale or it sits in stables earning T-bills. A senior trader's job is no longer "find a great trade"; it's "make sure the firm's capital is deployed where my edge applies, with sizing matched to capacity, supervised against decay." That is operationally a quant-PM job. The terminal must support it.

The **edge** stays where it always was: in the senior trader's domain expertise. What changes is **how the edge is expressed** — through models, rules, deployed strategies, parameter profiles — and **what the trader does day-to-day** to maintain it.

---

## What Each Archetype Becomes

The transition is not "the trader is replaced by a quant." It is "the trader becomes a hybrid: domain expert + ML practitioner + portfolio manager of their own edge." Different archetypes land at different points on the automation spectrum, and the terminal must support each appropriately.

### Heavily automatable

The work runs largely without a human in the loop. Trader supervises the fleet and pushes new alpha.

- **Marcus** — basis arb, funding harvest, momentum / mean-reversion on liquid pairs, cross-venue lead-lag. Hundreds of instances across venues × instruments × horizons. He becomes a portfolio manager of his own automated cousin.
- **Mira** — already mostly automated. The pivot is scale: 50 quote engines across 20 instruments × 4 venues vs. 5 instruments today. Plus systematic improvement loops (parameter optimization, adverse-selection model retraining, venue toxicity learning).
- **Sasha** — vol-rich/cheap detection, calendar arb, gamma scalping with auto-hedging, dispersion. Trader supervises and intervenes on regime-shift judgments.
- **Quinn** — was always this. Her doc remains the canonical reference. In the new world, she is the **cross-archetype meta-overseer** or the **firm-level systematic / factor PM** — distinct from each archetype's own automated cousin.

### Partially automatable

Machine does the screening + monitoring + execution; human does the high-conviction judgment.

- **Henry** — fundamental screening, factor models, earnings-window setups, pair-trade signal generation. Automation extends his coverage from ~100 names to 1,000+. **Discretionary overlay** stays for high-conviction names.
- **Ingrid** — curve trades, butterflies, basis trades, RV models, auction-concession models. **Auction-day judgment** (auction-specific factors, primary-dealer reads) stays human.
- **Yuki** — carry, cross-vol, fixing-flow, mean-reversion on majors. **EM political-risk overlay** stays human.
- **Theo** — calendar spreads, weather models, inventory setups, crack-spread mean-reversion. **OPEC headline-trading** and major geopolitical events stay human.
- **Julius** — basis arb, MEV-aware execution, funding-vs-borrow, LP-with-hedge, points farming. **Protocol-risk judgment**, governance reading, exploit response stay human.
- **Diego** — pre-event modeling, in-play stat-driven scalps, lay-the-draw detection, racing form models. **In-play "match feel"**, late team-news interpretation stay human.

### Mostly judgment, automation supports rather than replaces

The edge is fundamentally human; automation makes the human 5–10× more thorough.

- **Rafael** — themes don't get automated; they get _supported_. Cross-asset relationship monitoring, mismatch detection, expression-comparison engines, scenario PnL grids, conviction-calibration trackers — all run autonomously and feed the trader. **Theme formation, thesis judgment, and conviction sizing stay him.**
- **Naomi** — deal screening, regulatory pattern matching, document NLP, calibration tracking, spread-evolution monitors. Automation surfaces opportunities and tracks 200+ deals simultaneously. **Reading merger agreements and judging deal-break risk** stays her.
- **Aria** — already heavily model-driven (calibrating against polling models, polling-vs-market price). Automation extends her to thousands of markets simultaneously vs. dozens. **Resolution-criteria interpretation** and ambiguity calls stay her.

### Not the same job

These two roles change shape rather than gain automation cousins.

- **David** — Head of Risk / PM. He now supervises **automated desks**, not just traders. His terminal needs cross-trader-fleet aggregation, cross-fleet correlation monitoring, firm-systematic risk decomposition, model-risk oversight. The blast radius of a runaway algo is different from a trader on tilt; David's risk surfaces must reflect that.
- **Elena** — external client. Her view changes minimally. Her concerns remain performance / risk / fees — but she may want **transparency into how the systematic side is risk-managed** (counterparty risk of automated execution, model-risk disclosure, kill-switch governance, fail-over policies).

---

## The Four Phases, Reimagined

The manual four-phase workflow (Decide → Enter → Hold → Learn — see [manual-trader-workflow.md](manual-trader-workflow.md)) still applies, but every phase is **operating at a different scale and on a different unit of work**.

### Phase 1: Decide — at platform level, not trade level

**Manual:** "Should I be long BTC?"

**Automated:**

- "What new alpha class should I research this quarter?"
- "Which existing strategies are decaying — and at what rate?"
- "What data should I license? What features should I add to the library?"
- "What regime is the market in — and which of my strategy classes thrive there?"
- "Where should I add capacity / pull capacity?"

The Decide surface is **the research workspace + the strategy-fleet-state dashboard**, used together.

### Phase 2: Enter — as deployment, not order entry

**Manual:** "Click buy."

**Automated:**

- "Promote this strategy from paper to pilot at 1% size."
- "Promote pilot to live at full size after 30 days of in-distribution behavior."
- "Deploy this canary alongside the incumbent at 1% of size; promote at day 14 if Sharpe-tracking band is met."
- "Roll back this version; the incumbent regime fit broke after the FOMC surprise."

Entry is **strategy lifecycle gates**, not order tickets. Order entry still exists as a fallback (manual override of the automated cousin) but it's deliberately friction-y.

### Phase 3: Hold — as anomaly-driven supervision

**Manual:** "Watch the chart. Manage the position."

**Automated:**

- "Watch the fleet of 300 instances. Investigate the 3 amber-flagged. Decide whether to pause."
- "Has the regime shifted? Which strategies should be pulled back?"
- "Is correlation drift creeping into supposedly-uncorrelated strategies?"

The Hold surface is **anomaly-driven**, not foveal-on-positions. Default state of the dashboard is green; the trader is summoned only when something is off. This is a fundamental cognitive shift from manual trading.

### Phase 4: Learn — as model-improvement loop, not just retrospective

**Manual:** "Review yesterday's trades. Journal lessons."

**Automated:**

- "Review yesterday's strategy attribution. Which strategies generated alpha; which detracted; which tracked their backtest expectation?"
- "Identify decaying strategies. Queue retraining. Adjust feature library based on drift."
- "Compare backtest-vs-live divergence per strategy."
- "Update the experiment-tracker priorities for tomorrow."

The Learn surface is **a feedback loop into the research workspace**, not just a retrospective. Insights from yesterday become research tasks for tomorrow.

---

## What Follows

The rest of this doc is structured as the major surfaces of the automated terminal:

1. **The data layer** — catalog, quality, lineage, licenses, gaps.
2. **The feature library** — engineered features as first-class objects with metadata.
3. **The research workspace** — notebook + IDE + experiment tracker, with platform integrations.
4. **The model registry** — versioned models with full reproducibility.
5. **The strategy composition layer** — turning a model into a deployable strategy.
6. **Promotion gates & lifecycle** — research → paper → pilot → live → monitor → retired.
7. **The capital allocation engine** — sizing across the fleet, risk-parity / Kelly / regime-conditional.
8. **The live fleet supervision console** — anomaly-driven, intervention-ready.
9. **Post-trade & decay tracking** — model retraining triggers, feature drift, backtest-vs-live.
10. **The supervisor console** — the trader's actual daily UI in this world.

Plus three cross-cutting sections:

- **The ML-researcher daily rhythm** — pre-market / in-market / post-market for a trader-turned-quant.
- **What stays human** — recurring framing of where the edge is irreducibly judgment.
- **How the platform binds these together** — design principles spanning all surfaces.

For the per-archetype variations on this foundation — what Marcus's automated-mode terminal looks like vs. Henry's vs. Diego's — see the **"Automated mode"** appendix in each `trader-archetype-*.md` file.

---

## 1. The Data Layer

### What it is

The foundation of everything. Before features, before models, before strategies, the trader needs **a clear picture of every dataset the firm has** — what it covers, how fresh it is, what it costs, who owns it, what's licensed, what's missing. The data layer is the trader's window into this state.

Senior firms spend tens of millions per year on data licenses (Bloomberg, Refinitiv, ICE, Tardis, Kaiko, Nansen, Polymarket-grade feeds, satellite imagery, weather, expert-network transcripts). Without a serious data layer, the trader doesn't know what they have, and the firm pays twice for the same dataset bought by different desks.

### What the trader needs to see

**Data catalog (the home page of the data layer):**

- **Dataset name, owner, source, license terms, cost.**
- **Coverage:** instruments, venues, geographies, history depth.
- **Freshness:** real-time / 5-min lag / EOD / weekly / static. SLA per source.
- **Update cadence and last-update timestamp.**
- **Schema:** fields, types, nullability, units. Sample rows always available.
- **Quality metrics:** null rate, outlier rate, recent gap incidents, schema-change history.
- **Lineage:** upstream raw sources → cleaned versions → derived features. Click a dataset to see what it feeds and what feeds it.
- **Used-by:** which features depend on this dataset, which models consume those features, which strategies run those models. **Impact-of-change visible before the trader proposes deprecation or renegotiates a license.**
- **Cost-per-query / cost-per-row** (especially for paid APIs with throttles).
- **Permissions:** who can read; some datasets are scoped per-desk for compliance.

**Search and filter:**

- By instrument class (equities / rates / FX / commodities / crypto / on-chain / sports / prediction).
- By data type (price / volume / OB / news / fundamentals / on-chain / weather / social / regulatory).
- By cadence, by license, by quality tier, by owner.
- Free-text search across descriptions + schema fields.

**Gap analysis:**

- "What instruments are uncovered by my current data?" — surfaced relative to the universe the trader's strategies trade.
- "What features in the library can't be computed because the underlying data is missing or stale?"
- "What competitors are buying that we don't have yet?" — informed by industry intel and feature-attribution gaps.

**Procurement view:**

- Datasets the trader has flagged as "want."
- Trial / evaluation datasets (paid POCs in flight).
- Renewal calendar — when do current licenses expire, what's the spend, what's the alternative.
- Cost vs. attribution — for any licensed dataset, how much P/L the strategies depending on it have generated. The crude ROI on a $2M/year feed.

### Design principles

- **Data is a first-class object.** Not a folder of CSVs and an undocumented S3 bucket. Every dataset has a permanent ID, owner, schema, metadata.
- **Lineage is not optional.** A trader who doesn't know what feeds what cannot diagnose a model breakdown. Every transformation is tracked.
- **Quality is monitored continuously.** Data drift, schema drift, gap detection run on every feed. Incidents alert the owner, not the consumer.
- **Cost is visible at the trader level.** A trader proposing a new strategy that needs a $500k/year feed must see that cost; no hidden subsidies.
- **Licenses are honored automatically.** A dataset with redistribution restrictions cannot be exposed in a client-facing report; the platform enforces.
- **Permissions follow compliance.** Restricted datasets (MNPI, restricted lists, jurisdictional) are gated by user / desk role.

### What the trader does with this surface

- **Pre-research:** before starting a new strategy idea, the trader scans the catalog to see what's available. "Do we have funding-rate history for HyperLiquid? At what cadence? Since when?"
- **Mid-research:** the feature library (next section) tells them which features are computable from current data. The catalog tells them what's blocked by missing data.
- **Procurement decisions:** "If we license this satellite-imagery feed, which of my macro themes get a new feature? What's the expected uplift?" — the catalog + attribution data inform the answer.
- **License renewals:** before a $5M renewal, the trader pulls usage + attribution and decides whether to renew, downgrade, or kill.

### Per-archetype implication (preview)

The trader-specific section in each archetype's automation appendix lists the key data sources their automated cousin depends on. Examples:

- **Marcus** — venue order-book histories (Tardis/Kaiko), funding-rate history, venue-native trade tape, on-chain ETF flows, social sentiment.
- **Julius** — all of Marcus's, plus on-chain pool histories (Dune/Allium), bridge-flow data, MEV-Share archive, governance event archive, oracle deviation history.
- **Henry** — fundamental data (Refinitiv / Compustat / FactSet), earnings transcripts (text + audio), expert-network call notes, sell-side estimates with revisions, insider filings, short-interest archive.
- **Theo** — EIA / DOE / IEA archives, weather model outputs (multiple providers), shipping data (Vortexa-style), refinery-utilization history, OPEC production data, sanctioned-flow tracking.
- **Naomi** — SEC EDGAR archive, court-docket archive, DOJ / FTC / EU CMA decision database, merger-agreement corpus (NLP-ready), antitrust-precedent database.
- **Diego** — every match's full event tape (passes, shots, fouls), in-running stats feeds, weather, lineup-confirmation timestamps, racing form data, sectional times, video archive.
- **Aria** — polling aggregator histories, election-result archives, government data APIs (BLS / Fed / Treasury / etc.), forecasting-model outputs, geopolitical-event databases.

These are the _unique_ data dependencies; the shared layer (price / volume / OHLC across asset classes) is universal.

---

## 2. The Feature Library

### What it is

A searchable catalog of every engineered feature the firm has built — turned from raw data into something a model can consume. Each feature is a **first-class object** with an identity, computation logic, lineage, distribution monitoring, and "used-by" tracking. The feature library is where the trader actually lives during the research phase: it is the building-block of every model.

Think of the feature library as the firm's accumulated **alpha-vocabulary**. A senior firm has thousands of features, accumulated over years, used and re-used across strategies. Without a serious library, every researcher rebuilds the same features from scratch — a multi-million-dollar inefficiency at scale.

### What the trader needs to see

**Per-feature record:**

- **Identity:** name (canonical), version, owner, description, code link, last-modified.
- **Definition:** the canonical computation logic. Code, not English.
- **Inputs:** the upstream datasets and features (lineage).
- **Compute cost:** CPU-ms, GPU-ms, $ per million points. Important for tick-frequency features.
- **Update cadence:** tick / 1s / 1m / 1h / EOD. Latency budget guarantee.
- **Freshness SLA:** how stale before the feature is considered failed.
- **Distribution monitor:** rolling histogram of recent values; comparison to the training-time distribution; drift score. Color-coded.
- **Quality:** null rate, outlier rate, recent incidents.
- **Usage:** every model and every live strategy currently consuming this feature. Impact-of-change scope visible.
- **Performance proxy:** when this feature is included vs excluded in similar models, the typical Sharpe / IR delta (a rough but useful indicator of feature value).
- **Tags:** asset class, data source, transformation type (price-based, volume-based, microstructure, sentiment, fundamental, macro, on-chain, regulatory, weather, etc.).
- **Documentation:** notes on what this feature captures, when it works, when it doesn't, known regimes where it breaks.

**Search and discovery:**

- By tag, by owner, by data source, by used-by-strategy.
- "Show me all features computed from funding-rate data" — discoverability.
- "Show me all features used by strategies with Sharpe > 1.5 over the last 6 months" — quality-driven discovery.
- "Show me features I haven't seen before" — for cross-pollination across desks.
- Suggested-similar-features when the trader views one (graph traversal of lineage and usage).

**Drift dashboard:**

- All features sorted by drift score (current distribution vs training distribution).
- Drilling in shows the time-series of drift, plus which downstream models / strategies are affected.
- Triage: which drifts are flagged for action, which are noise.

**Incident log:**

- Every feature failure: when, how long, root cause, downstream impact (which strategies were affected and how the platform responded — degraded gracefully, paused, fallback feature substituted).

### Design principles

- **Features are reused, not rebuilt.** The trader's first move on a new strategy is to browse the library. Building from scratch is the exception.
- **Versioning is rigorous.** Features evolve; old strategies depending on the old version must continue working. Versions are immutable.
- **Compute cost is exposed.** Some features are cheap to compute everywhere; some require a dedicated GPU pipeline. The trader sees this before relying on it.
- **Distribution monitoring is on by default.** A model trained on one regime breaks silently when feature distributions shift. Drift alerts catch this before P/L does.
- **Lineage is reverse-traversable.** From any feature, the trader can navigate to its upstream data and downstream models. From any model, they can see every feature it consumes.
- **Cross-desk visibility, with respect for boundaries.** Features built by Henry's desk are discoverable by Marcus's, and vice versa. But where IP / compliance scopes apply (e.g., Naomi's MNPI-derived features), permissions enforce.

### Feature-engineering surface (the build experience)

Building a new feature is itself a workflow. The platform supports:

- **Code-first feature definition** — Python (most common), with platform-provided utilities for common transformations (rolling stats, lagged values, cross-sectional rank, regime-conditional).
- **Tested in the notebook** with real historical data, instant feedback on shape / distribution / sample values.
- **Quality gates before publishing** — null-rate threshold, outlier-rate threshold, schema-validation passing.
- **Auto-generated metadata:** lineage extracted from the code, distribution baseline computed, cost benchmarked.
- **Publish workflow** — owner sign-off, code review (required for live-trading features), compute deployment (the feature is now live and computable on demand, with the right SLA).
- **Backfill workflow** — when a new feature is published, it can be backfilled across history so old strategies can be retrained against it.

### What the trader does with this surface

- **Strategy research:** browse the library; pick features that match the thesis; combine them in a model.
- **Feature engineering:** add new features when existing ones don't capture an idea. The platform makes adding a feature lightweight.
- **Drift triage:** during the day, check which features are drifting; assess downstream impact; trigger model retraining if warranted.
- **Cross-pollination:** discover features built by other desks that might apply to the trader's domain. (Marcus's funding-velocity feature might be useful in Julius's basis-arb; Henry's earnings-surprise feature might inform Sasha's vol structures around earnings.)
- **Pruning:** retire features no longer used; reduce compute footprint; renegotiate dependent data licenses.

### Per-archetype implication (preview)

Each archetype builds and consumes a portfolio of features specific to their domain. Examples:

- **Marcus** — funding extremity z-scores, basis term-structure curvature, OI-delta-vs-price quadrant flags, liquidation-cluster proximity, CVD divergence.
- **Julius** — pool TVL change rates, lending-utilization curvature, bridge-flow imbalance, mempool-sandwich-risk score, restaking-points yield, smart-contract age-since-deployment.
- **Sasha** — IV-rank percentiles, skew z-scores, vol-risk-premium time series, RV/IV gap, gamma-walls proximity, vanna/charm exposure pre-event.
- **Henry** — earnings-surprise track record, estimate-revision velocity, factor exposures (value/growth/momentum/quality/low-vol), short-interest velocity, insider-activity flags.
- **Ingrid** — spread z-scores (every relevant pair), forward-implied path divergence from OIS, CFTC positioning extremity, primary-dealer concession history, repo specialness.
- **Theo** — degree-day forecast deltas vs normal, inventory-vs-5y range z-scores, refinery-margin compression, OPEC-promised-vs-realized gaps, hurricane-track-probability layers.
- **Naomi** — antitrust-precedent similarity scores, regulatory-commissioner-stance-derived probabilities, document-NLP risk flags, deal-spread velocity.
- **Diego** — pre-event xG / Elo-derived market edges, in-running stat-vs-market-implied gaps, lineup-late-change impact estimates, weather-adjusted scoring expectation.
- **Aria** — polling-aggregator-vs-market gap, expert-network-derived probability, calibration-adjusted fair price, cross-venue arb opportunities.

These domain-specific features sit alongside a universal layer (returns, vol, volume, time-of-day, regime indicators) that all archetypes consume.

---

## 3. The Research Workspace

### What it is

The trader-turned-quant's primary working environment. A serious notebook + IDE environment integrated with the firm's data layer, feature library, model registry, backtest engine, and experiment tracker. **Not** a Jupyter tab on someone's laptop with `pip freeze` chaos. A proper research platform with reproducibility, compute-on-demand, and seamless promotion of code from notebook to production.

This is where the trader spends the majority of their day in the new world. The terminal is open in another monitor; the research workspace is the active surface.

### Why it matters

The friction between idea and tested-result is the single biggest driver of researcher productivity. A senior trader with a domain insight ("I think funding rates over weekend close predict Monday open vol") should be able to:

1. Pull the relevant data (already cataloged).
2. Build the relevant features (mostly already in the library).
3. Train a candidate model.
4. Run a walk-forward backtest with realistic execution.
5. Compare to a baseline.

…in **hours, not weeks**. Most quant shops fail at this; the great ones excel. The platform must compress this loop.

### What the trader needs

**Notebook environment:**

- **Jupyter-style notebooks** are the dominant interface (most quants live here). Plus a full IDE option (VS Code-style) for traders who prefer that mode.
- **Kernel runs on research compute, not the trader's laptop** — meaning dataset-size doesn't matter, GPU is available on demand, and the trader's machine doesn't melt under a backtest.
- **Pre-loaded with platform SDK:** one-line access to data layer, features, models, backtest engine, plotting, experiment tracking.
- **Auto-attached environment:** the kernel comes with the firm's standard Python stack, version-pinned. No `pip install` battles.
- **Persistent storage** per user, plus shared workspaces for desk collaboration.
- **Real-time collaboration** — multiple researchers editing the same notebook live (Google-Docs style), with cell-level conflict resolution.
- **Notebook → script → production pipeline** — once a notebook proves an idea, the pipeline lifts the relevant code into a production-grade module (with linting, types, tests, version control).

**Data access:**

- One-line access: `df = data.load("binance.btcusdt.perp.funding", since="2020-01-01")`. No SQL, no API key fumbling.
- Automatic caching of frequent queries.
- Lineage logged: every notebook query records what data was pulled, with timestamp and version.
- Rich tooling: pandas / polars / dataframe-style for tabular, with platform extensions for time-series-aware ops.

**Feature access:**

- One-line feature retrieval: `funding_z = features.get("marcus.funding_zscore_30d", instruments=["BTCUSDT", "ETHUSDT"])`.
- Build a new feature inline; test it; publish it to the library when ready.
- Browse the feature library directly from the notebook (sidebar with search).

**Backtest engine:**

- One-line backtest: `result = backtest(strategy=my_strategy, data=hist, period="2022-2024")`.
- **Realistic execution simulation** — slippage curves, fee schedules, latency model, partial fills, queue position, MEV cost (DeFi), borrow cost (shorts). Not a toy backtester. **The same execution code runs in live as in backtest.**
- Walk-forward by default. Configurable splits (rolling / expanding / purged k-fold for time-series).
- Monte Carlo and bootstrap analytics built in.
- Multi-strategy backtest — test a basket of related strategies for portfolio dynamics.
- Output: not just Sharpe, but a full diagnostic — equity curve, drawdown shading, per-trade attribution, slippage breakdown, regime-conditional performance, sensitivity to parameter perturbation.

**Plotting:**

- Standard suite (matplotlib / plotly), plus platform-specific plotters (equity curve with drawdown shading, attribution decomposition, surface visualization for vol traders).
- Shareable plots that link back to the notebook + data + version.

**Compute:**

- CPU-on-demand for normal work.
- GPU-on-demand for ML training (with appropriate cost visibility — running an A100 hour costs $X).
- Cluster-on-demand for distributed backtests / hyperparameter sweeps.
- Cost is shown live; long-running jobs require explicit confirmation.

### Anti-patterns the platform must prevent

- **Untracked data pulls.** Every query logs lineage; nobody can secretly bake test-set data into a "training" notebook.
- **Untracked feature definitions.** A feature defined in a notebook and never published is suspect — the platform surfaces these and prompts.
- **Lookahead bias.** The backtest engine refuses to use future data; explicit warnings if the trader tries.
- **Survivorship bias in universes.** Backtests run on the _as-of_ universe (delisted instruments preserved), not today's roster.
- **In-sample tuning masquerading as out-of-sample.** The walk-forward framework forces honest splits; manual "let me just check this period" is logged and counted toward the multiple-testing penalty.
- **Reproducibility gaps.** A notebook that can't be re-run from scratch (because it depends on local files / mutable state / undocumented config) is flagged.

### What the trader does here

- **Idea exploration** — "is this signal real?"
- **Feature engineering** — building and testing new transformations of raw data.
- **Model training** — picking algorithms (linear, tree-based, neural, custom), hyperparameters, regularization.
- **Validation** — walk-forward, out-of-sample, robustness checks (different periods, different instruments, parameter perturbation).
- **Comparison** — against a baseline, against a peer model, against a passive benchmark.
- **Documentation** — the trader writes the _why_ alongside the code; future-self and collaborators read both.
- **Decision** — "promote to paper / archive / iterate."

### Per-archetype implication (preview)

The notebook environment is universal. What differs per archetype is the **library of templates / starter notebooks** they're given:

- **Marcus** — basis-arb backtest template, funding-harvest model template, microstructure-feature exploration template.
- **Sasha** — vol-surface fitting template, vol-rich/cheap detection template, gamma-scalping simulation template.
- **Henry** — factor-model template, earnings-window event-study template, pair-trade discovery template.
- **Theo** — weather-driven-natgas template, calendar-spread-mean-reversion template, OPEC-event-study template.
- **Naomi** — deal-spread-evolution template, regulatory-precedent-similarity template, calibration-tracking template.

Templates accelerate first-time exploration. The trader customizes from there.

---

## 4. The Model Registry

### What it is

A versioned, searchable catalog of every model the firm has trained, with full reproducibility guarantees. Every model — whether a gradient-boosted tree predicting funding-rate mean-reversion, a sequence model predicting in-play soccer goals, or a fitted vol surface — is a first-class object with identity, training data hash, hyperparameters, performance, lineage, and deployment status.

### Why it matters

Models are the executable form of the trader's edge. They get retrained, replaced, deprecated. Without a registry, the firm cannot answer basic questions: "what model is currently running on strategy X?" "What was its training data?" "Can I reproduce the model that was running last March when we had that drawdown?" "If I retrain this with new data, what's the version delta?"

For regulators, auditors, and post-incident review, **model lineage is non-negotiable**. For research velocity, the registry is what lets one trader's model be reused (or replaced) by another without losing context.

### What's in a model record

- **Identity:** model ID, version (semantic + content hash), name, owner, description, code commit of training pipeline.
- **Lineage:** training data hash (which exact data snapshot), feature set used (with feature versions), hyperparameters, label definition.
- **Training metadata:** training date, duration, compute used, cost.
- **Performance — in-sample, out-of-sample, walk-forward:** Sharpe, hit rate, Brier, RMSE, custom metrics — whatever is appropriate for the model class.
- **Performance by regime:** per regime conditioning (vol high/low, trending/chop, pre-FOMC, post-FOMC, etc.).
- **Reproducibility guarantee:** **rerun-from-registry produces a bit-identical model**, or the system flags drift if the data lake changed underneath. This is foundational.
- **Lineage graph:** parent (if fine-tuned / retrained / forked), children (descendants), siblings (sister models from the same experiment).
- **Deployment status:** which strategies use which versions, in which environments (paper / pilot / live).
- **Drift state:** prediction-distribution drift, feature-distribution drift (links to the feature library).
- **Documentation:** what the model captures, when it works, when it doesn't, known failure modes, cards for explainability.

### Search and discovery

- By tag (asset class, model type, owner, strategy).
- By performance (top Sharpe in its class).
- By dependency (find all models using feature X — useful when feature X is being deprecated).
- By regime fit (find models that thrived in the 2022 high-vol regime).
- Free-text across descriptions and documentation.

### Versioning and immutability

- **Semantic versioning** for trader-meaningful changes (1.2.3 = major.minor.patch).
- **Content hash** for guaranteed reproducibility (any change in code / data / hyperparameters yields a new hash).
- **Old versions never deleted** — they may be deprecated but always retrievable.
- **Promotion path:** model is registered (research) → validated (paper) → deployed (live, with strategy attached). Each transition is auditable.
- **Rollback:** any prior version can be re-deployed in one click, with full history.

### Drift surface

- For every live model, current input-distribution and prediction-distribution drift vs training.
- Severity scoring; auto-alerts to the owner.
- Suggested actions: retrain (with options for data window), recalibrate, replace, retire.
- Drift triage queue — what needs attention this week.

### Why this is the trader's tool, not just an MLOps tool

A senior trader looking at a strategy's degraded performance has three diagnostic surfaces:

1. **Has the data shifted?** (data layer)
2. **Has the feature distribution shifted?** (feature library)
3. **Has the model itself broken?** (model registry — has the new version regressed; is the model running on stale data; did a recent retraining introduce overfit)

Without the registry, the trader is guessing. With it, the diagnostic is fast and rigorous.

---

## 5. The Experiment Tracker

### What it is

A log of every backtest, every model training run, every hyperparameter sweep — successful or failed. Failures are data; the experiment tracker preserves them. Searchable, comparable, reproducible.

### Why it matters

Most research is failed experiments. A senior trader running 200 backtests in a quarter cannot remember what was tried in week 3 vs week 7. Without an experiment tracker, the same dead-end gets explored twice. Worse: a successful experiment that produced a great Sharpe gets lost because the notebook was overwritten.

The experiment tracker is the **firm's institutional memory of what's been tried**.

### What's in an experiment record

- **Trigger** — notebook + cell, scheduled run, hyperparameter sweep, scripted pipeline.
- **Config** — full hyperparameters, feature set, period, splits, seed, hardware. Anything that can affect outcome.
- **Inputs** — feature versions, data snapshot, code commit. (Identical to model registry training metadata for ML runs; broader for non-ML experiments like rules-based backtests.)
- **Output** — performance metrics, equity curve, attribution, plots.
- **Diagnostics** — runtime, peak memory, errors, warnings.
- **Annotations** — researcher's notes ("tried this because hypothesis X; result: didn't work because reason Y").
- **Comparable** — to other experiments in the same scope. Side-by-side metric tables, equity-curve overlays, parameter-vs-Sharpe scatter plots.

### Search and comparison

- By feature, by model class, by period, by researcher, by strategy class.
- Pareto-frontier views — across many experiments, which configurations dominate (Sharpe vs. drawdown / vs. capacity / vs. complexity).
- Hyperparameter sensitivity — vary one parameter, hold others; the platform plots the response curve.

### Auto-comparison features

- Two experiments side-by-side: feature-set diff, hyperparameter diff, performance delta, equity-curve overlay, attribution comparison.
- Three-way and N-way comparisons in a table form.
- Ablation views — "which features matter most?" computed by permutation or SHAP-style importance, with per-experiment context.

### Anti-patterns prevented

- **P-hacking by re-running.** Every run is logged; trying 50 hyperparameter combos and reporting the best as if it was the only is detectable (multiple-testing penalty surfaced).
- **Cherry-picking periods.** Each experiment's period is recorded; "I just happened to test 2021" is visible.
- **Hidden in-sample tuning.** Walk-forward + log of every adjustment makes the trader's process honest.

### What the trader does here

- **During research:** runs experiments, watches them stream in, picks winners.
- **Between research bursts:** browses past experiments to see what was tried; avoids reinventing.
- **In retrospect:** "we shipped this model; what alternatives did we evaluate; could we have shipped a better one?"
- **For team handoff:** a researcher leaving the desk hands their successor a tagged set of experiment runs; the new person reads the corpus and ramps fast.

---

## 6. The Strategy Composition Layer

### What it is

A model alone is not a tradable strategy. A strategy is what wraps a model (or a set of rules) with **sizing logic, entry/exit logic, hedging, risk gating, regime conditioning, capacity management, and execution policy**. The strategy composition layer is where the trader takes a model and turns it into a deployable unit of capital.

### Why it matters

The same model can be expressed as many strategies. A vol-rich/cheap model can drive: a passive-only short-vol strategy, an active gamma-scalping strategy, a calendar-spread strategy, a cross-underlying dispersion strategy. Each is a different risk/return profile, capacity, and operational footprint. The platform must let the trader express these variants without re-implementing the model logic each time.

### What a strategy is

A strategy is a deployable bundle with:

- **Identity:** strategy ID, name, owner, description, version.
- **Underlying model(s) or rule set:** with version pinning. Strategies depend on specific model versions; a model retraining produces a new strategy version.
- **Universe:** which instruments, venues, horizons.
- **Entry logic:** signal threshold, confirmation conditions, blackout windows (e.g., don't enter 30min before FOMC).
- **Exit logic:** target, stop, time-based, signal-flip, regime-flip.
- **Sizing logic:** Kelly fraction, vol-targeting, capital-cap, per-trade max, regime-conditional.
- **Hedging policy:** auto-hedge, hedge ratio, hedge venue, hedge cadence.
- **Risk gates:** daily loss limit, drawdown limit, position-size limit, instrument concentration. Kill-on-breach.
- **Execution policy:** which algos to use (VWAP / TWAP / iceberg), which venues, fee preferences, latency budget.
- **Schedule:** active hours / days, blackout windows around macro events.
- **Mode:** live / paper / shadow.
- **Tag taxonomy:** strategy class, underlying market, archetype owner.

### The composition surface

This is a UI where the trader assembles a strategy. It is not pure code; it has a structured form so the platform can validate, monitor, and intervene effectively. But it is not low-code — the trader can drop into Python for any custom logic.

- **Visual structure** — the strategy as a graph: data → features → model → signal → entry/exit → sizing → execution. Each node is configurable.
- **Pre-deployment validation** — the platform checks for common errors (lookahead, infinite-loop entry, unbounded position size, missing kill-switch).
- **Backtest from the composition surface** — hit run, the strategy backtests on historical data with the configured execution policy.
- **Forward-test (paper)** — once backtested, the same strategy runs on live data with simulated fills.
- **Capacity estimation** — the platform estimates the strategy's max-deployable capital based on the universe, expected slippage curves, and available liquidity. This drives the lifecycle gates.
- **Versioning** — every change to the composition produces a new strategy version. Old versions stay in the registry.

### Strategy templates

Same as research-workspace templates — pre-built strategy compositions per archetype that the trader customizes. Examples:

- **Marcus** — basis-arb template (long spot + short perp atomic), funding-harvest template (short perp during funding-extreme + auto-flatten before funding flip), momentum template, mean-reversion template.
- **Sasha** — short-strangle-with-delta-hedge template, calendar-spread template, gamma-scalping template, dispersion template.
- **Henry** — pair-trade template, factor-tilt template, earnings-window template (long volatility into earnings, flatten post-print).
- **Theo** — calendar-spread template, weather-driven-natgas template, crack-spread mean-reversion template.
- **Naomi** — cash-deal-arb template (long target post-announcement until close), capital-structure pair template.
- **Diego** — pre-event mean-reversion template, in-play stat-driven scalp template, lay-the-draw template.
- **Aria** — cross-venue arb template, polling-vs-market template, basket-by-confidence template.

Templates compress time-to-first-strategy from days to hours.

---

## 7. Promotion Gates & Lifecycle

### What it is

The same lifecycle Quinn lives in (research → paper → pilot → live → monitor → retired), now applied to _every_ archetype's automation. **The trader is the operator of their own fleet's lifecycle.** They promote, demote, and retire their own strategies.

The platform enforces the lifecycle. Promotion is gated; retirement is auditable.

### The stages

- **Research** — offline only. Backtests, walk-forward, ablations. No real-data execution.
- **Paper** — runs live on real data, simulated fills only. Behavior compared to the backtest expectation; a sanity check that the strategy is in-distribution.
- **Pilot** — real money, capped at 1–5% of target size. The strategy is now exposed to slippage / fees / partial fills / venue quirks for real. Performance compared to expectation.
- **Live** — at full target capital. The strategy is contributing meaningful P/L (or losses).
- **Monitor** — running but capped, decay being measured. The trader has noticed degradation; the strategy is on probation. Some strategies live in monitor for years; some retire from there.
- **Retired** — code archived, no longer deployable. Can be re-promoted (rare) but the assumption is that the strategy is dead.

### Promotion gates

Each transition is a checklist with evidence, not a chat conversation:

- **Research → Paper:** code review passed, backtest framework approved, walk-forward Sharpe above threshold (with confidence interval), risk parameters set, kill-switch wired.
- **Paper → Pilot:** N days of in-distribution behavior on paper, slippage estimates validating, strategy fits within firm risk limits, sign-off from owner + risk team.
- **Pilot → Live:** N days of pilot behavior matching expectation, capacity estimate refined with real data, no anomalies in the alert log, sign-off from David (or his delegate).
- **Live → Monitor:** trader-initiated (degradation observed) or system-initiated (drift / decay alerts).
- **Monitor → Retired:** decay confirmed, no path to retraining or recalibration, retire decision logged with rationale.
- **Retired → Research / Paper:** rare, requires explicit re-promotion case.

### Why the lifecycle is foveal

In manual trading, the trader's primary action is "place trade." In automated trading, the trader's primary action is **promote / demote / retire**. The lifecycle UI is what the trader uses every day. It must be:

- **Visual** — every strategy's stage visible at a glance (color-coded), pipeline-style dashboard from research to retired.
- **Auditable** — every transition timestamped, signed, with evidence.
- **Reversible where prudent** — rollback to a previous version is one click; demote to monitor is one click.
- **Cross-trader visible at firm level** — David sees every transition across the floor, with awareness of pending promotions.

### Per-archetype lifecycle nuance

- **Marcus** — fast lifecycle. Strategies cycle in and out as venues add/remove instruments, funding regimes shift, and microstructure evolves. Many strategies in Pilot at any time.
- **Mira** — quote-engine parameter changes follow a similar gate (canary deployment), even when the engine architecture doesn't change. Parameter changes get the same treatment as model changes.
- **Sasha** — slower lifecycle. Vol strategies are sensitive to regime; promoted carefully through full vol-cycle observation.
- **Henry** — strategies often run for years. Lifecycle is more about _adding_ strategies than retiring them; factor decay is the main retire trigger.
- **Theo** — seasonal strategies have a natural cycle. A winter-natgas strategy may go to Monitor every spring and wake up in the fall.
- **Naomi** — every deal is an instance, not a strategy. The "strategy" is the deal-screening + risk-attribution model that runs across all deals.
- **Diego** — many strategies tied to specific competitions / venues. World Cup strategies activate every four years.
- **Aria** — strategies often tied to specific resolution events; lifecycle ends with the event.

The lifecycle UI is universal; what varies is cadence and the typical end-state.

---

## 8. The Capital Allocation Engine

### What it is

The system that decides how much capital each strategy in the trader's fleet receives. **In manual trading, the trader sized each position by gut + spreadsheet. In automated trading, the platform proposes allocations across a fleet of strategies and the trader approves.**

Capital allocation across hundreds of strategies is a portfolio-construction problem with significant academic and operational depth. The platform brings that depth to the trader's fingertips.

### Inputs to the engine

- **Per-strategy expected Sharpe** (from backtests, validated against live).
- **Per-strategy capacity** estimates (how much can be deployed before slippage erodes edge).
- **Per-strategy correlation matrix** (rolling, conditioned by regime).
- **Per-strategy decay rate** (Sharpe trend over time; faster-decaying strategies sized down).
- **Risk budget** per archetype, per asset class (set by David / firm-level).
- **Drawdown state** of each strategy (recent drawdown reduces allocation).
- **Regime** (current regime affects which strategies should be over/under-weighted).

### Output

- **Proposed allocation** per strategy in $ and % of available capital.
- **Risk decomposition** of the proposed portfolio (gross / net / VaR / stress).
- **Marginal contribution analysis** — "if I add $X to strategy A, expected incremental Sharpe is Y."
- **Diminishing-returns curves** per strategy.
- **Capacity headroom** by strategy.
- **Diversification analysis** — concentration warnings, correlation cluster flags.

### Allocation methodologies

The trader selects (or combines) methodologies:

- **Equal-weight** — naive baseline.
- **Sharpe-proportional** — more capital to higher-Sharpe strategies.
- **Risk-parity** — equal risk contribution per strategy.
- **Markowitz** — mean-variance optimal under correlation constraints.
- **Kelly / fractional Kelly** — bankroll-optimal under independence assumption (often fractional 1/4 or 1/2 Kelly for risk management).
- **Regime-conditional** — allocations vary by detected regime (different mix for high-vol vs low-vol regimes, for instance).
- **Hierarchical risk parity** — clusters strategies, allocates within and across clusters.
- **Custom** — trader supplies their own logic in code.

Most senior firms blend several with overrides.

### Trader interaction

- The engine produces a **proposed allocation** nightly (or on-demand).
- The trader reviews, accepts, or modifies.
- Modifications are constrained by firm-level risk limits (David's caps).
- Material changes to allocation route to David for sign-off.
- Allocation is then deployed: strategies update their capital caps; the trading platform respects.

### Live allocation drift

Allocations drift during the day as strategies make / lose money. The engine continuously shows:

- Drift from optimal vs. realized.
- Whether to rebalance now (intraday) or wait for nightly.
- Cost of rebalancing (slippage, fees) vs. expected return improvement.

### Capacity & headroom

- **Per-strategy capacity utilization** — % of estimated capacity in use.
- **Free capacity** — can absorb more capital. Where to add.
- **Capacity exhausted** — strategy is at cap; signals being skipped. Either accept (this is the strategy's natural ceiling) or invest in raising capacity (via better execution, broader universe, lower-friction venues).

### Per-archetype implication

Different archetypes manage allocation at different cadences:

- **Marcus, Julius, Mira** — daily or intraday rebalancing common.
- **Sasha** — weekly to monthly; vol regime persistence makes high-frequency rebalancing noisy.
- **Henry** — monthly; equity factor exposures are slow-moving.
- **Ingrid** — daily-to-weekly; rates strategies often event-driven (auctions, FOMC).
- **Theo** — seasonal; large allocation shifts as winter / hurricane season approaches.
- **Naomi** — per-deal; new deals add to allocation, closed deals release.
- **Diego** — per-event-cluster; Saturday-3pm-EPL needs different allocation than Tuesday Champions League.
- **Aria** — per-event-resolution; capital cycles as markets resolve.

The engine handles cadence as a configuration; the trader rarely needs to think about it.

---

## 9. The Live Fleet Supervision Console

### What it is

The console where the trader supervises **every live strategy in their fleet**. Anomaly-driven by design: green by default; the trader is summoned when something is off. This replaces the manual trader's "watch the chart" surface — the cognitive shift is from foveal-on-position to peripheral-on-fleet.

### The fleet dashboard

A grid or table view, one row per strategy:

- **Strategy ID, name, stage, owner.**
- **Health badge** — green / amber / red, computed from a composite of metrics (PnL deviation, drift, slippage, alert volume).
- **Capital deployed / cap.**
- **PnL today / WTD / MTD / YTD** in $ and as % of cap.
- **Sharpe rolling 30d.**
- **Drawdown** — current, max-since-go-live.
- **Trade count today / yesterday** (unusual silence is a signal).
- **Hit rate, avg trade $.**
- **Recent regime fit** — model-vs-regime indicator.
- **Last intervention** — when was this strategy last touched, by whom.
- **Capacity utilization** — % of estimated capacity in use.

Sortable, filterable, expandable. Default view shows only amber and red strategies (everything else is healthy and trusted).

### Strategy detail page

Click a strategy → drill into:

- **Live equity curve** with drawdown shading; backtest expectation overlay.
- **Position breakdown** — what is this strategy currently holding?
- **Live signal feed** — recent signals generated, executed vs skipped, with reasons.
- **Feature health** — are the features feeding this model fresh and in-distribution?
- **Drift indicators** — KS-test or PSI on features and predictions vs training.
- **Capacity utilization** — % in use, degradation curve.
- **Slippage realized vs assumed** — execution-quality monitor by venue.
- **Recent decisions log** — every model output, executed or not, why.
- **Linked alerts** — alerts that have fired on this strategy.
- **Linked interventions** — manual overrides applied.
- **Linked experiments** — recent backtests / retraining runs related to this strategy.

This is where the trader does diagnostics. From here, the trader decides: pause, cap, retrain, leave alone, retire.

### Anomaly detection

Anomaly detection is the heart of the supervision day. Categories of anomaly:

- **Performance anomalies** — strategy underperforming its rolling distribution at 2σ / 3σ.
- **Behavior anomalies** — trade frequency, position size, hit rate outside historical bounds.
- **Feature drift** — input distribution shifted vs training.
- **Prediction drift** — output distribution shifted.
- **Execution anomalies** — slippage spike, rejection rate spike, fill rate drop.
- **Capacity warnings** — strategy hitting size cap; signals being skipped.
- **Correlation anomaly** — strategy correlating with another it should not.
- **Regime mismatch** — running an "uptrend" model in a "chop" regime.
- **Infrastructure** — node down, data lag, RPC degraded.

Each anomaly has severity (info / warn / critical), routing rules, and (for critical) auto-actions (auto-pause the strategy by default, configurable per strategy).

### Cross-strategy view

The dashboard is per-strategy, but cross-strategy context matters:

- **Correlation matrix** — rolling 30-day correlation between every pair of strategies.
- **Aggregate Greeks / DV01 / FX delta / etc.** — fleet-level exposures, by trader-native unit.
- **Net exposure to common factors** — BTC beta, vol factor, momentum factor, value factor (per archetype).
- **Concentration check** — top-N strategies by risk contribution.

### Intervention console

When the trader decides to act, the intervention console is the surface:

- **Per-strategy controls:** start / pause / stop / cap-change / risk-limit-change. With confirmation + audit trail.
- **Group controls:** pause all strategies in a tier, on a venue, or with a tag.
- **Manual override ticket:** when the trader wants to manually trade outside the strategies (rare but real). Mandatory reason field; tagged as override.
- **Kill switches** (see [Kill Switches in common-tools](common-tools.md#19-kill-switches-granular)) — granular per scope, multi-key for fleet-wide.

Every intervention is logged: timestamp, actor, action, reason, pre-state, post-state. Reviewable, reportable, auditable.

### What the trader does on this console

- **Morning glance** — fleet-state at a glance; investigate amber/red.
- **Continuous peripheral awareness** — alerts route to mobile when away from desk; on-screen banner when present.
- **Diagnose & decide** — when something's amber, drill in, decide pause / cap / leave / retrain.
- **End-of-day review** — confirm fleet is healthy, queue overnight work, sign off.

Most of the day, the supervisor console is _not_ the active surface. The research workspace is. The supervisor console is what the trader checks every 30–60 minutes, plus when an alert fires.

---

## 10. Post-Trade & Decay Tracking

### What it is

The feedback loop from yesterday's results into tomorrow's research. Every strategy is evaluated daily / weekly / monthly: did it perform as expected, is it decaying, does it need retraining, is it ready to retire? Decay tracking is what separates a firm that maintains alpha from one that discovers it once and watches it fade.

### Per-strategy review (auto-generated, weekly + monthly)

- **Performance vs expectation** — distribution from research / backtest, where today / week / month falls.
- **Drawdown decomposition** — what went wrong, when.
- **Regime fit** — % of period in favorable regime, performance per regime.
- **Capacity realized vs assumed** — slippage, fill rate.
- **Slippage realized vs assumed** by venue.
- **Recent interventions and their effect.**
- **Drift state** — feature, prediction, performance.

### Fleet-level review

- **Total PnL decomposition** by strategy, by regime, by venue, by underlying.
- **Risk-adjusted contribution** — which strategies actually contribute Sharpe vs which dilute.
- **Marginal contribution** — what would the fleet Sharpe be without strategy X.
- **Correlation evolution** — strategies that should be uncorrelated drifting together.

### Decay metrics

- **Sharpe over time** per strategy with confidence intervals — is decay statistically significant?
- **Half-life estimates** — how long does this alpha persist before halving.
- **Feature importance over time** — features whose importance is shifting.
- **Backtest vs live divergence** — point estimate + distribution. Strategies tracking expectation: green. Underperforming: investigated. Overperforming: also investigated (look-ahead leak suspected).

### Retrain triggers

The platform proposes retraining when:

- Feature drift exceeds threshold.
- Prediction drift exceeds threshold.
- Performance underperforms backtest expectation by N σ.
- A new feature has been added to the library that should be incorporated.
- A scheduled cadence (some strategies retrain monthly, some quarterly, some never).

Retraining is itself an experiment (logged in the tracker) and produces a new model version (logged in the registry). The trader reviews and approves before deployment.

### Retire triggers

- Sustained underperformance vs expectation.
- Decay confirmed via statistically-significant Sharpe drop.
- Fundamental regime change (the structure that produced the alpha is gone).
- Better strategy in the same niche (replacement, not retirement).

Retirement is a decision; the platform proposes, the trader approves.

### What the trader does

- **End-of-day:** glances at attribution + decay surfaces.
- **End-of-week:** reviews strategy retrospectives, queues retrain jobs, plans retire decisions.
- **End-of-month:** the formal review with David's risk committee; portfolio health, capital allocation changes, strategy lifecycle decisions.

This loop closes the four phases: today's Learn becomes tomorrow's Decide, with concrete research priorities surfaced from yesterday's data.

---

## The ML-Researcher Daily Rhythm

The trader-turned-quant's day is structured very differently from the manual trader's day. Below is a generic rhythm; per-archetype variations live in each archetype's "Automated mode" appendix.

### Pre-market (60–90 minutes)

The day starts with **fleet triage and research-priority setting**, not with watching a chart.

**Fleet review (15–25 min):**

- Glance at supervisor console. Default state: most strategies green; investigate amber and red.
- Read overnight session attribution (especially for crypto / FX / Asian session traders): which strategies generated PnL, which detracted, which behaved out-of-distribution.
- Read the alerts queue from overnight — capacity warnings, feature drift, regime mismatches, infrastructure incidents.
- Make morning decisions: pause this strategy whose drift exceeded threshold; promote that pilot to live; cap this one whose capacity is exhausted.

**Research catch-up (15–25 min):**

- Skim experiment-tracker results from overnight runs. A serious quant has 5–20 backtests / training runs queued each night; results stream in.
- Promote winners (a successful experiment becomes a notebook for further investigation, or a candidate strategy for paper-trading).
- Archive losers with notes on why they failed (institutional memory).

**Macro / regime read (15–20 min):**

- Read morning notes — sell-side, internal, geopolitical — through the news/research feed.
- Identify any regime-shift signals (rates moves, FOMC week, geopolitical event imminent).
- Consider: are any of my strategies fragile to today's regime? Cap them, hedge them, or leave alone.

**Promotion-gate decisions (10–15 min):**

- Strategies waiting for promotion sign-off: review the gate evidence, sign off or send back with notes.
- Coordinate with David on any promotions material to firm risk.

**Coffee / clear head:**

- Step away. The cognitive load of the rest of the day is research-heavy; preserve focus.

### In-market (continuous, anomaly-driven)

This is the radical shift from manual trading. Most of the day is **research, not supervision**.

**Default state:** trader is in the research workspace. Notebooks open. Working on:

- A new strategy idea (from yesterday's review).
- Feature engineering (a hypothesis to test).
- Model retraining for a strategy showing drift.
- Hyperparameter sweep on a candidate model.
- Diagnosing a strategy that underperformed yesterday.

**Background:** supervisor console is open in another monitor. Default green. Alerts route to mobile when the trader is heads-down.

**Alert response (5–10% of the day):** when an alert fires:

- Drill into the strategy detail page.
- Diagnose: is this a true anomaly (intervene) or a known transient (acknowledge)?
- If intervene: pause / cap / replace. Document the decision.
- If known transient: acknowledge with reason; system learns the pattern over time (more on suppression).

**Liquid-event override (rare but real):** large macro release, surprise headline, exploit, oracle deviation. Trader switches to manual override mode:

- Pause the affected strategies (or let them ride if confident in the model's ability to handle the regime).
- Use manual order entry for any high-conviction directional bet.
- Return to default mode when the event normalizes.

**Mid-day capital-allocation review:** a quick glance at the allocation engine's drift indicators. Material drift triggers a rebalance proposal; trader approves or defers.

**Cross-trader coordination:** brief desk-chat exchanges with adjacent archetypes (Marcus chatting with Julius about cross-domain basis; Henry chatting with Sasha about earnings vol structures). Less frequent than in manual trading; the strategies do most of the coordination automatically.

### Post-market (60–90 minutes)

End-of-day review and tomorrow's research priorities.

**End-of-day attribution (15–20 min):**

- Today's PnL decomposition — by strategy, by regime, by venue.
- Identify outliers — strategies that significantly outperformed or underperformed expectation. Note for retrospective.
- Verify all positions are flat or as-intended (some strategies hold overnight; verify they're at intended size).

**Decay check (10–15 min):**

- Run the decay surface: any strategies whose Sharpe trend is concerning?
- Any strategies needing retraining? Queue the retrain job for overnight.
- Any features whose drift is growing? Consider downstream impact.

**Capital allocation (10–15 min):**

- Review nightly allocation proposal.
- Approve, modify, or escalate to David.
- Verify capital deployed reflects the approved allocation.

**Research-priority setting (15–25 min):**

- Based on the day's findings: what's tomorrow's research priority?
- Queue overnight backtests / training runs.
- Update experiment-tracker priorities.
- Note any features to add to the library based on a feature-engineering hypothesis from the day.

**Promotion-gate triage (5–10 min):**

- Strategies ready for promotion review tomorrow morning.
- Gate evidence in place; trader sets reminder.

**Sign-off:**

- Confirm all alerts are acknowledged or resolved.
- Confirm fleet is in expected state for overnight running.
- Hand-off to the next-shift supervisor (for 24-hour markets — crypto, FX) or to the overnight automated supervision.

### Differences in rhythm by archetype

- **Marcus, Julius, Mira** — true 24-hour rhythm. The "post-market" merges into "pre-market" of Asia session. Many shifts the trader is supervising while sleeping (overnight team or automated supervision); they pick up where they left off in the morning.
- **Sasha** — vol-trader rhythm. Pre-FOMC weeks have very different rhythm than post-FOMC weeks; expiry weeks are stress.
- **Henry** — earnings season rhythm. The 6 weeks per quarter when earnings are coming in dominates. Off-cycle weeks are research-heavy.
- **Ingrid, Yuki** — central-bank-day and auction-day rhythm. Quiet weeks are research; FOMC / NFP / auctions are supervision-heavy.
- **Theo** — Wednesday (EIA petroleum) and Thursday (DOE natgas) are the spine; OPEC weeks dominate.
- **Naomi** — deal-event-driven. Quiet weeks are deal-screening + retrospective; vote / hearing / regulatory-decision days are supervision-heavy.
- **Diego** — match-day rhythm. Saturday afternoons (EPL) and tournament windows (World Cup, Cheltenham Festival) are the supervision peaks; off-days are pre-event modeling.
- **Aria** — resolution-window-driven. Election weeks, FOMC weeks, CPI release days are peaks; otherwise research and screening.
- **Quinn** — daily research + supervision; less event-driven, more rhythm of strategy lifecycle.
- **David** — firm-wide morning review, mid-day risk check, end-of-day allocation review. Plus committee deliverables on his own cadence.
- **Elena** — log in once a day to glance at NAV; deeper review weekly / monthly. Her rhythm is unchanged from the manual world.

---

## What Stays Human

Across every archetype, certain decisions cannot (or should not, today) be automated. These are not failures of the platform; they are **the irreducibly human edge that justifies the trader's existence**. The platform's job is to **make these decisions higher-leverage** by clearing the surrounding workload.

### Universal "stays human"

- **Strategy invention.** The first idea — "I think this signal predicts that outcome" — is human creativity. The platform supports rapid testing of the idea, but the idea originates with the trader.
- **Regime shift recognition.** When the structural assumption underlying a model breaks (the way 2008 broke many quant strategies, the way 2020 broke others), the human notices first and intervenes. The platform's drift detectors lag the trader's intuition by days or weeks.
- **Counterparty / venue / protocol risk re-evaluation.** When an exchange has a security incident, when a stablecoin starts to wobble, when a regulator changes posture — the human integrates context the model cannot.
- **Strategic capital allocation.** Allocating between archetypes (more to crypto vs. FX, more to event-driven vs. macro) is a firm-strategic decision driven by humans (David, the CIO), informed by data.
- **Catastrophe response.** When something has gone badly wrong (a bug, an exploit, a venue outage with positions trapped), the human's judgment is irreplaceable. Kill switches and protocols help, but the call is human.

### Archetype-specific "stays human"

Cross-referenced from the per-archetype "Automated mode" appendices, but worth noting here:

- **Marcus** — interpretation of major venue-policy changes (Binance changes its perp leverage rules; the trader decides what that means for the funding-harvest fleet).
- **Julius** — protocol risk re-evaluation, exploit response, governance reading. Major DeFi events demand human triage.
- **Sasha** — vol regime shift recognition. The model can detect drift; the trader interprets whether this is "normalize quickly" or "structural — pull back."
- **Henry** — high-conviction discretionary positions. The systematic side covers 1,000+ names; the trader still makes judgment calls on the top 10.
- **Ingrid** — auction-day judgment. The model has the concession history; the trader reads the room.
- **Rafael** — theme formation. The platform supports themes; it doesn't generate them.
- **Yuki** — EM political-risk integration. Capital controls, election outcomes, IMF interventions are human reads.
- **Theo** — OPEC headline reaction. The model has all the surrounding context; the trader interprets political signal in real time.
- **Naomi** — merger agreement reading, deal-break-risk judgment, regulatory-commissioner-stance interpretation. The platform surfaces; she decides.
- **Diego** — late team-news, in-play match-feel, race-day going calls. Where the model is incomplete, she completes.
- **Aria** — resolution-criteria interpretation. The model generates fair price; she judges whether a contract's wording is ambiguous and how the resolver will interpret.
- **Quinn** — strategy promotion / retire decisions, cross-strategy correlation drift response, capacity-allocation strategic moves.
- **David** — every firm-level call. Capital allocation between desks. Risk-limit changes. Trader behavior intervention. The platform proposes; he decides.
- **Elena** — every redemption / subscription / manager-evaluation call.

### The platform's stance

The platform is **opinionated about what to automate and humble about what cannot be**. It does not pretend to replace judgment; it makes judgment higher-leverage by automating the surrounding workload. Where the model is right, it runs autonomously. Where the model is uncertain, it surfaces the situation to the human with sufficient context to decide.

This is why the platform must be **interpretable, auditable, and intervenable** end-to-end. Not "AI in a black box" but "every signal traceable to its features; every feature traceable to its data; every model traceable to its training run; every decision traceable to its actor."

---

## The Supervisor Console — The Trader's Daily UI

### What it is

The single, unified interface where the trader spends most of their non-research time. It is not one of the surfaces above — it is the **integration of all of them** into one workspace.

The supervisor console answers: when the trader sits down at their desk in the morning, what do they see?

### Layout

A sketch of a typical layout (the trader customizes — see [#30 Customizable Layout](common-tools.md#30-customizable-layout--workspace)):

| Zone              | Surface                                                        |
| ----------------- | -------------------------------------------------------------- |
| Top-left (foveal) | **Fleet supervision dashboard** — every strategy, health-coded |
| Top-center        | **Research workspace** (notebook environment)                  |
| Top-right         | **Anomaly / alerts console** + **decay surface**               |
| Middle-left       | **Strategy detail** (drill-down when investigating)            |
| Middle-center     | **Capital allocation engine** + **regime indicators**          |
| Middle-right      | **Promotion gate queue** + **experiment tracker**              |
| Bottom            | News/research feed + comms (chat, desk, sell-side)             |

The trader's primary surface is the **research workspace** during research-heavy hours; **fleet supervision** during alert-driven hours; **decay & retrospective** during end-of-day review.

### Mode-switching

The console supports modes (per [#30 Customizable Layout](common-tools.md#30-customizable-layout--workspace)):

- **Pre-market mode** — fleet review + alerts + macro context dominant.
- **Research mode** — notebook environment dominant; supervisor in peripheral.
- **Event mode** — when a major event is unfolding (FOMC, NFP, deal close, exploit), supervisor + intervention console foveal; research workspace minimized.
- **Post-market mode** — attribution + decay + allocation review dominant.

### What's different from the manual terminal

The supervisor console is **not** the manual trader's terminal with extra panels. It is fundamentally different in its center of gravity:

- **Manual terminal:** chart + ticket + position-blotter foveal. The trader watches and acts.
- **Supervisor console:** fleet dashboard + research notebook foveal. The trader supervises and creates.

A trader transitioning from manual to automated must rebuild their visual workflow. The platform helps by providing archetype-specific templates (see per-archetype appendices), and by making the transition gradual (the manual terminal remains available; the trader doesn't lose old habits overnight).

---

## How the Platform Binds These Surfaces Together

A few cross-cutting design principles span every surface:

1. **End-to-end lineage.** Data → feature → model → strategy → trade → P/L. Every step traceable both directions. The trader can navigate from a P/L deviation back to the model that produced it, the features that drove the model, the data that produced the features.
2. **Reproducibility everywhere.** Any model can be re-trained from registered inputs and produce a bit-identical result. Any backtest can be re-run. Any production state can be reconstructed. This is what makes the platform a _system of record_ rather than a collection of tools.
3. **One source of truth per concept.** Strategies are first-class. Models are first-class. Features are first-class. Each has one canonical record; every surface reads from the same source.
4. **Audit trails are non-negotiable.** Every promotion, every intervention, every allocation change, every override is logged with timestamp, actor, reason, evidence.
5. **Anomaly-driven attention.** The platform earns the trader's trust by being quiet when things are fine and decisive when things are not. Spam erodes trust; silence breeds complacency. The platform's job is to find the middle.
6. **Compute is a substrate.** The trader does not manage VMs, queues, GPUs. They request work; the platform delivers; cost is visible. This is what makes the platform usable by domain experts who are not infrastructure engineers.
7. **The notebook is part of the platform.** Research is not a side activity in a different tool; it is an integrated mode of the same platform. Code in the notebook can call platform APIs; outputs from the notebook can be promoted into production with the same tooling.
8. **Compliance and risk are inline.** Restricted lists, position limits, sanctions, model-risk policy are enforced in the platform — not as separate workflows the trader can sidestep.
9. **Cross-trader and firm-level visibility.** David sees every trader's fleet aggregated; cross-trader correlation is visible; firm-level risk is computed live. Without sacrificing per-trader operational autonomy.
10. **Latency-tier-appropriate.** Mira's quote engine runs at microsecond latency; Henry's earnings-window strategy runs at second latency; Naomi's deal monitor runs at minute latency. The platform supports each tier without forcing the trader to choose between speed and richness.

---

## How to Use This Document

This foundation describes the universal automated-trading platform. Each archetype's "Automated mode" appendix in their respective `trader-archetype-*.md` file extends this with archetype-specific surfaces, workflows, and "what stays human" boundaries.

When evaluating any automated-trading platform (including our own), walk through:

- **Phase 1 (Decide):** does the platform have a credible research workspace? Is the data layer rich enough that the trader can answer "what do we have"?
- **Phase 2 (Enter):** is strategy promotion a real lifecycle with gates, or just a "deploy" button? Is rollback one-click?
- **Phase 3 (Hold):** is fleet supervision anomaly-driven, or does it require staring? Are interventions audited?
- **Phase 4 (Learn):** is decay tracked, are retrains triggered automatically, are insights from yesterday research priorities for tomorrow?
- **Cross-cutting:** is lineage end-to-end? Reproducibility guaranteed? Audit trails non-negotiable?

For per-archetype evaluation, read their specific appendix.
