# Automation Common Tools — Shared Surfaces of the Trader-Turned-Quant Terminal

A detailed reference for the surfaces every (or nearly every) archetype's automated-mode terminal carries. Sister doc to [common-tools.md](common-tools.md), which covers shared surfaces of the **manual** terminal.

The detail of how each surface looks in any specific archetype's terminal lives in that archetype's `trader-archetype-*.md` (in the `# Automated Mode` appendix). This doc is the SSOT for **the shape, design principles, and design intent** of the surface; the archetype docs are the SSOT for **archetype-specific examples, datasets, features, edge translations, and judgment surfaces**.

For per-archetype unique surfaces that don't generalize, see [automation-unique-tools.md](automation-unique-tools.md). For the universal automation-platform concepts the surfaces sit on, see [automation-foundation.md](automation-foundation.md). For the underlying four-phase workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).

---

## What "Common" Means Here

A surface is **common** if its **shape** is genuinely shared across archetypes, even when its **content** is radically different per archetype. Marcus's data catalog and Theo's data catalog are the same kind of object — left-sidebar filter / main-panel dataset table / right-pane detail — though Marcus's filters mention venue-and-funding while Theo's mention refinery-and-weather. The platform builds **one** catalog browser; each archetype gets a personalized filter taxonomy and dataset population.

This is the architectural insight, identical to the manual side: **the platform is one platform with N personalities, not N platforms.**

---

## The 18 Common Surfaces

The shape of every archetype's automated-mode appendix follows the same 18-section template (see [automation-archetype-template.md](automation-archetype-template.md) for the structural template). Each section maps to a common surface (or group of surfaces) below.

The numbering matches the appendix structure so traversal is direct: section 3 in any archetype doc → surface 3 here.

1. **Edge translation** (the framing — not a UI surface)
2. **What stays human** (judgment surfaces — not a UI surface, but a recurring framing)
3. **The data layer** — catalog browser, quality monitoring, lineage navigator, procurement dashboard, gap analysis
4. **The feature library** — browser, engineering surface, drift dashboard, cross-pollination, lineage
5. **The research workspace** — notebook + IDE, backtest engine, walk-forward visualization, strategy templates, compute management, anti-pattern prevention
6. **The model registry** — browser, model record, versioning, drift, lineage graph
7. **The experiment tracker** — browser, records, comparison views, anti-pattern prevention
8. **The strategy composition surface** — composition canvas, validation, versioning, templates
9. **Promotion gates & lifecycle** — pipeline view, gate UIs, lifecycle decision log
10. **The capital allocation engine** — engine UI, allocation methodology selector, drift visualization, capacity headroom
11. **The live fleet supervision console** — fleet dashboard, strategy detail page, anomaly detection, cross-strategy correlation, archetype-specific live state, **strategy state inspection (mandatory)**
12. **The intervention console** — per-strategy / group / kill controls, **manual trading & reconciliation (mandatory)**, intervention audit log
13. **Post-trade & decay tracking** — per-strategy retrospectives, fleet-level review, decay metrics, retrain queue, retire decisions
14. **The supervisor console** — multi-monitor layout, mode-switching, anomaly-driven default state
15. **Daily rhythm** — pre-market / in-market / post-market workflow framework
16. **Differences-from-manual table** — comparison framework
17. **Coordination with other roles** — peer / Quinn / David / archetype-specific connections
18. **How-to-use evaluation framework** — questions for evaluating any platform implementation

---

## 3. The Data Layer

### What it is

The substrate of everything else in automated mode. Before features, before models, before strategies — the trader needs a **clear, queryable, governed picture of every dataset the firm has**. What it covers, how fresh it is, what it costs, who owns it, what's licensed, what's missing. The data layer surfaces are how the trader interacts with this picture.

Senior firms spend tens of millions per year on data licenses (Bloomberg, Refinitiv, Tardis, Kaiko, Compustat, FRED archives, expert-network call notes, satellite imagery, weather-model outputs, polling aggregators, on-chain analytics, court-docket archives, …). Without a serious data layer the trader doesn't know what they have, the firm pays twice for the same dataset bought by different desks, and quality incidents go undetected until P/L moves.

### Why it matters

- **Efficiency:** the trader does not waste hours figuring out what data exists or where to query it. The catalog is one click; every feature is reusable.
- **Risk:** quality monitoring catches feed degradation before P/L does. Lineage navigation makes incident triage minutes-fast instead of hours-slow. Compliance enforcement (license terms, restricted-dataset access) is automatic.
- **PnL:** procurement decisions are evidence-driven. The firm doesn't pay for unused feeds, and aggressively licenses feeds that open new alpha classes.

### Standard shape — six sub-surfaces

Every archetype carries the same six data-layer sub-surfaces; the content per surface varies enormously.

#### 3.1 The Data Catalog Browser

The home page when the trader opens the data layer.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters. Universal filters: data type, cadence (real-time / sub-hourly / EOD / weekly / static), license tier (premium / standard / public), cost band, coverage, freshness state, owner. **Archetype-specific filter facets layer on top of these** (see "Archetype variations" below).
- **Main panel** — table of datasets matching filters. Universal columns: name, source / vendor, coverage summary, cadence, freshness indicator (green / amber / red), license terms, annual cost, owner, last-updated. Archetype-specific columns layer on top.
- **Right pane** — when a dataset is selected: full description, schema, sample rows, lineage graph (upstream sources + downstream consumers), quality history, license document link, procurement notes, "click to add to a notebook" button.

**Search** — free-text across names + descriptions + schema fields. Search results jump to matched datasets with the matching columns highlighted.

**Quick actions** — bookmark a dataset, request access to a restricted dataset, propose a procurement evaluation, flag a quality issue.

#### 3.2 Core Datasets (Per-Archetype, Illustrative)

Every archetype's catalog is dominated by 8–25 example datasets specific to their domain. The platform builds **one** catalog system; each archetype's catalog tier is populated with the feeds their automated cousin depends on. See per-archetype docs for examples; see [automation-unique-tools.md](automation-unique-tools.md) for an index of which datasets are unique to which archetype.

#### 3.3 Data Quality Monitoring

A continuous-quality view across every live dataset. Universal across archetypes; the dimensions monitored are the same.

**Per-dataset quality dimensions:**

- **Freshness** — time since last update vs SLA, color-coded.
- **Completeness** — null rate per field, gap detection across time series.
- **Schema stability** — has the source's schema changed? Field added / removed / typed differently?
- **Distribution drift** — has the statistical distribution of values shifted recently? (Catches a broken feed early — e.g. a venue accidentally publishing 10× stale prices.)
- **Cross-source consistency** — when multiple sources report on the same underlying (e.g. two archives of the same venue), do they agree?
- **Cost / volume** — query volume against quota, $ spent month-to-date, projected cost for queued workloads.

When something degrades, the dataset's owner is paged (not the trader directly — owners are the data-engineering team or vendor-management). The trader sees the impact: which of their strategies depend on this dataset, what's their state, should the trader intervene.

#### 3.4 Lineage Navigator

A graph view used during diagnostic work. Navigates from a dataset to upstream sources and downstream features / models / strategies, and vice versa.

**The graph:**

- Nodes are datasets, features, models, strategies.
- Edges are dependencies (a feature consumes a dataset, a model consumes features, a strategy consumes a model).
- Color-coded by health (live / degraded / failed).
- Click any node to open its detail page; right-click for "show all downstream" or "show all upstream."

Used when:

- A strategy is misbehaving and the trader wants to trace back to the source data.
- A vendor announces a feed change and the trader wants to see impact scope.
- A feature is being deprecated and the trader wants to confirm no strategy depends on it transitively.

This is a power-user tool used during diagnostic work, not constantly.

#### 3.5 Procurement Dashboard

Data licenses are a major P&L line item; senior traders are expected to be sharp on cost-vs-attribution.

- **Active licenses** — every paid feed with annual cost, renewal date, contract terms, owner of the renewal decision.
- **Trial / evaluation feeds** — currently being POC'd, with deadlines and evaluation criteria.
- **Wishlist** — feeds the trader has flagged as "want," with rationale and expected uplift.
- **Cost attribution** — for each licensed feed, a rough P/L attribution: which strategies depend on it, and how much P/L those strategies have generated.
- **Renewal calendar** — what's coming up for renegotiation, with auto-prompt to review usage + attribution before signing.
- **Decision log** — past procurement decisions with rationale, useful for institutional memory.

Major procurements (typically >$500k/year) escalate to the firm-level (David's surfaces).

#### 3.6 Gap Analysis Surface

The most underrated data-layer surface. The platform identifies gaps:

- **Universe coverage** — instruments / contracts / events the trader's strategies trade that are _not_ fully covered.
- **Feature gaps** — features in the library that depend on missing or stale data, blocked from production.
- **Competitor / industry gaps** — based on industry intel and feature-attribution gaps in backtests, the platform suggests "feeds your competitors likely have that we don't."
- **Backfill gaps** — historical data missing for certain periods, blocking walk-forward backtesting on those periods.

Gap analysis is not aspirational — it's tied to concrete strategies that can't be deployed or features that can't be computed. Closing a gap is a procurement decision with a defined ROI estimate.

#### 3.7 Trader Interactions with the Data Layer

A consistent rhythm across archetypes:

- **Daily (background):** quality monitor in peripheral; auto-alerts for degradation; glances at the catalog occasionally during research.
- **Weekly:** procurement / wishlist review; reading data-team release notes (new datasets onboarded, schema changes).
- **Monthly:** cost / attribution review; renewal-decision triage; gap-analysis review with the data team.
- **Ad hoc (during research):** querying the catalog when starting a new strategy idea — what data do I have to test this?
- **Ad hoc (during a strategy issue):** lineage navigator from the misbehaving strategy back to source data.
- **Ad hoc (during an incident):** when a vendor degrades, the impact-scope view tells the trader exactly which strategies are at risk and what to pause.

#### 3.8 Why this matters (recurring pattern)

Every archetype's section 3.8 closes on the same three frames — efficiency / risk / PnL. The substance of _what_ is illustrated varies per archetype.

### Design principles

- **Data is a first-class object.** Not a folder of CSVs and an undocumented S3 bucket. Every dataset has a permanent ID, owner, schema, metadata.
- **Lineage is not optional.** A trader who doesn't know what feeds what cannot diagnose a model breakdown.
- **Quality is monitored continuously.** Drift, schema-drift, gap detection run on every feed. Incidents alert the owner, not the consumer.
- **Cost is visible at the trader level.** A trader proposing a new strategy that needs a $500k/year feed must see that cost; no hidden subsidies.
- **Licenses are honored automatically.** A dataset with redistribution restrictions cannot be exposed in a client-facing report; the platform enforces.
- **Permissions follow compliance.** Restricted datasets (MNPI, restricted lists, jurisdictional, MAR-relevant) are gated by user / desk role.

### Archetype variations (illustrative)

The catalog framework is universal; archetype-specific filter taxonomies and dataset populations differ.

- **Marcus** (CeFi crypto): venue / instrument / cadence; orderbook tick / funding / OI / liquidations / on-chain / ETF-flows / news. See [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md).
- **Julius** (CeFi+DeFi hybrid): adds _domain_ (CeFi / on-chain / cross-domain), _chain_, _protocol family_, _indexing source_ (RPC / subgraph / Dune / Allium / mempool / MEV relay), _decode requirement_. See [trader-archetype-julius-hybrid.md](trader-archetype-julius-hybrid.md).
- **Mira** (market maker): adds _resolution_ (tick / 100ms / 1s), _book depth captured_ (TOB / L2 / L3), _counterparty-ID exposure_, _hardware-timestamp availability_, _replay-grade flag_. See [trader-archetype-mira-market-maker.md](trader-archetype-mira-market-maker.md).
- **Sasha** (options/vol): options-tick / surface-fits / dealer-positioning / block-trades / underlying-context / realized-vol / event-calendar / on-chain-options. See [trader-archetype-sasha-options-vol.md](trader-archetype-sasha-options-vol.md).
- **Henry** (equity L/S): cash equities / ETFs / single-name options / fixed-income (for valuation comps); families: prices / fundamentals / estimates / ownership / transcripts / filings / expert-network notes / sentiment / alt-data / corporate actions; **point-in-time guarantee** required for fundamentals. See [trader-archetype-henry-equity-long-short.md](trader-archetype-henry-equity-long-short.md).
- **Ingrid** (rates): sovereign yields / swap curves / OIS / repo / auction history / primary-dealer survey / dealer positioning / inflation linkers / economic releases / CB statements / cross-currency basis. See [trader-archetype-ingrid-rates.md](trader-archetype-ingrid-rates.md).
- **Rafael** (macro): asset class × region × release cadence × theme tag (Rafael's themes parameterize his catalog filter). See [trader-archetype-rafael-global-macro.md](trader-archetype-rafael-global-macro.md).
- **Yuki** (FX): spot tick / forward / NDF / FX vol surface / fixing history / intervention archive / OIS-and-rate-differential / capital-control event / CFTC IMM / cross-currency basis / sell-side fixing color. See [trader-archetype-yuki-fx.md](trader-archetype-yuki-fx.md).
- **Theo** (energy): curves / spreads / inventory / production / weather / shipping / refinery / OPEC / news / fundamentals; cost bands skew higher (per-feed costs in energy run $50k–$1M+). See [trader-archetype-theo-energy.md](trader-archetype-theo-energy.md).
- **Naomi** (event-driven): filings / court-dockets / regulatory-decisions / merger-agreement-corpus / precedent-database / sell-side / expert-network notes / news; jurisdictional filter (US / EU / UK / China / India / Brazil / Canada). See [trader-archetype-naomi-event-driven.md](trader-archetype-naomi-event-driven.md).
- **Diego** (sports): sport / league-tournament / data-type / vendor / venue / quality-tier; **stadium-feed vs scout-relay vs broadcast** distinction; **on-track vs off-track** for racing. See [trader-archetype-diego-live-event.md](trader-archetype-diego-live-event.md).
- **Aria** (prediction markets): polling / election-results / macro-data / forecasting-models / OSINT / conflict / weather / patent-and-lawsuit / token-and-protocol / venue-pricing / oracle-state; **resolution-source-flag** as an archetype-unique facet (does any active contract resolve from this feed). See [trader-archetype-aria-prediction-markets.md](trader-archetype-aria-prediction-markets.md).
- **Quinn** (quant overseer): firm-aggregate view of _every_ archetype's catalog plus cross-archetype performance archives, firm-aggregate position state archives, risk-factor archives, cross-venue execution-quality archives, sanctioned-strategy-class archive. See [trader-archetype-quinn-quant-overseer.md](trader-archetype-quinn-quant-overseer.md).
- **David** (PM/Head of Risk): firm-aggregate / counterparty-health / venue-health / protocol-health / macro / compliance / external-client. He consumes outputs of every trader's data layer plus a firm-aggregate layer that exists only at his level. See [trader-archetype-david-pm-risk.md](trader-archetype-david-pm-risk.md).
- **Elena** (external client): does **not** interact with the data layer. Section 3 does not apply to her appendix (which is a short note). See [trader-archetype-elena-external-client.md](trader-archetype-elena-external-client.md).

### Used by

13 trader archetypes + Quinn + David. **14 of 15.** Elena is the exception.

---

## 4. The Feature Library

### What it is

A searchable, versioned catalog of every engineered feature the firm has built. Each feature is a **first-class object** with an identity, computation logic, lineage, distribution monitoring, and "used-by" tracking. The feature library is where the trader actually lives during the research phase: it is the building-block of every model.

A senior firm has thousands of features accumulated over years, used and re-used across strategies. Without a serious library, every researcher rebuilds the same features from scratch — a multi-million-dollar inefficiency at scale.

### Why it matters

- **Efficiency:** the trader does not rebuild the same feature 14 times in 14 different notebooks. They pick from the library and parameterize. Time-to-strategy-prototype drops from days to hours.
- **Risk:** drift is monitored continuously. A model trained on one regime breaks silently when its features shift; the dashboard catches this before P/L does.
- **PnL:** features are reused across strategies. A high-quality feature compounds returns across the firm. Cross-pollination across desks accelerates discovery.

### Standard shape — six sub-surfaces

#### 4.1 The Feature Library Browser

The home page when the trader opens the feature layer.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters. Universal filters: **domain** (varies per archetype), **cadence** (tick / 1s / 1m / 1h / EOD / per-event), **compute cost** (cheap / moderate / expensive — flagged for budget-aware research), **used-by-strategy** (which features feed strategies the trader cares about), **owner / desk**, **quality tier** (production-grade / beta / experimental), **freshness** (live / stale / failed). Archetype-specific facets layer on top.
- **Main panel** — table of features. Columns: name, version, owner, description (one line), inputs (upstream features and datasets, summarized), distribution-state indicator (in-distribution / drifting / failed), used-by count, last-modified, **performance proxy** (rough but useful: rolling Sharpe-improvement / Brier-improvement / capture-bps for strategies using it).
- **Right pane** — when a feature is selected: full description, code link, lineage graph, distribution monitor (rolling histogram + comparison to training distribution + drift score), incident history, "show me strategies using this feature" link, "test this feature in a notebook" button.

**Search** — free-text across names, descriptions, code. Search returns matches with the matching context highlighted.

**Quick actions** — bookmark a feature, fork a feature into a personal experimental version, propose a new feature, flag drift.

#### 4.2 Core Features (Per-Archetype, Illustrative)

Every archetype's library is dominated by 15–60 named example features specific to their domain. Detail in per-archetype docs; cross-archetype pattern index in [automation-unique-tools.md](automation-unique-tools.md).

#### 4.3 The Feature Engineering Surface

Building a new feature is itself a workflow.

**The workflow:**

1. **Idea phase (notebook):** trader writes the feature definition in Python (or other supported language), tests it on real historical data, inspects shape / distribution / sample values.
2. **Quality gates:** before publishing, the platform runs automated checks — null rate within threshold, outlier rate within threshold, schema validation, computability across the universe of instruments / contracts the feature claims to cover.
3. **Metadata extraction:** the platform auto-generates metadata — lineage extracted from the code, distribution baseline computed on full backfill, compute cost benchmarked on a sample, update cadence declared by the trader and validated against the upstream.
4. **Code review:** required for live-trading features (production-grade tier). A peer or Quinn's team reviews the code; suggestions inline.
5. **Publication:** the feature gets a canonical name, a version (semantic + content hash), and is registered. Now usable by any strategy.
6. **Backfill:** the feature is computed across history (parallelized on the firm's compute), so old strategies can be retrained with it.
7. **Live deployment:** the feature is now computable on demand at its declared cadence; live strategies can subscribe.

**The form (schema-style UI):**

- Name (canonical, with strict naming convention).
- Description (one paragraph; what the feature captures and when it's useful).
- Owner.
- Inputs (selected from existing features / datasets, or declared as new dependencies).
- Code (link to repository commit; review status).
- Cadence and freshness SLA.
- Universe (which instruments / contracts / events it applies to; can be parametric).
- Tags (taxonomy).
- Documentation notes (regimes where it's known to break, expected lifecycle).

#### 4.4 The Drift Dashboard

Live features drift; some quietly, some violently. The drift dashboard surfaces the worst offenders.

**Layout:**

- **Top panel** — feature drift heatmap: features (rows) × time (columns), cells colored by drift score. Sortable by current drift, by trend, by impact (downstream P/L at risk).
- **Triage queue** — top features needing action: drifted significantly, with their downstream strategies listed.
- **Detail pane** — for a selected feature, the time series of its distribution drift, the downstream models / strategies affected, and suggested actions (retrain affected models, recalibrate the feature, deprecate it).
- **Acknowledgments log** — drifts the trader has reviewed and explicitly accepted (because they understand the regime cause), with reason logged.

This is one of the most-checked surfaces during diagnostic work.

#### 4.5 The Cross-Pollination View

Features built by other desks that might apply to the trader's domain.

- **Suggested-similar widget** — when the trader opens a feature, a sidebar shows features built by other desks with similar inputs or similar tags.
- **Trending features across desks** — what's being built / used most across the firm right now. Often a leading indicator of where alpha is being found.
- **Feature-of-the-week** — a curated highlight from another desk; a cheap way to keep current with cross-desk research.

This surface is light-touch; not foveal but useful background.

#### 4.6 Trader Interactions with the Feature Library

- **Daily (background):** drift dashboard glance during morning fleet review; alerts route for features feeding amber/red strategies.
- **Weekly:** browse cross-pollination view; identify candidate cross-desk features to evaluate.
- **Ad hoc (during research):** browse + search for features matching a thesis; often the first move on a new strategy idea.
- **Ad hoc (during feature engineering):** the engineering surface, primarily inline in notebooks with the publication form for the formal step.
- **Ad hoc (during retire):** when a feature is being deprecated, the trader reviews downstream impact.

#### 4.7 Why this matters (recurring frame)

Same efficiency / risk / PnL closing as section 3.

### Design principles

- **Features are reused, not rebuilt.** The trader's first move on a new strategy is to browse the library.
- **Versioning is rigorous.** Features evolve; old strategies depending on the old version must continue working.
- **Compute cost is exposed.** Some features are cheap to compute everywhere; some require a dedicated GPU pipeline.
- **Distribution monitoring is on by default.** A model trained on one regime breaks silently when feature distributions shift.
- **Lineage is reverse-traversable.** From any feature, navigate to upstream data and downstream models.
- **Cross-desk visibility, with respect for boundaries.** Permissions enforce where IP / compliance scopes apply.

### Archetype variations (illustrative)

The shape is universal; archetype-specific filter taxonomies and feature populations differ. Filter taxonomies sampled below; full lists in per-archetype docs.

- **Marcus** (CeFi crypto): funding / basis / OI / liquidation / microstructure / on-chain / macro / cross-asset / sentiment.
- **Julius** (CeFi+DeFi): adds on-chain pool-state / mempool / governance / oracle-deviation / bridge-flow / MEV.
- **Mira** (market maker): adds _feature horizon_ (sub-second / second / minute), _feature input class_ (book / trade / own-fill / cross-venue), _retrain cadence_, _regime-conditional flag_.
- **Sasha** (options/vol): IV-rank / skew / term-structure / vol-risk-premium / surface-fit-residuals / smile-regime / GEX / vanna / charm.
- **Henry** (equity L/S): family-based naming convention (`valuation_*`, `estimate_*`, `quality_*`, `momentum_*`, `transcript_*`, `insider_*`, `short_*`, `factor_*`, `event_*`, `microstructure_*`).
- **Ingrid** (rates): yield-curve / spread / butterfly / OIS-divergence / repo-specialness / auction-concession.
- **Rafael** (macro): asset class × region × theme tag × time horizon × owner-desk; cross-asset relationship features.
- **Yuki** (FX): carry-to-vol / basis-blowout / NDF onshore-offshore / RR-BF z-score / OIS-policy-divergence / fixing-imbalance / intervention-zone-proximity / capital-control-flag.
- **Theo** (energy): degree-day-deltas / inventory-vs-5y-z / refinery-margin-compression / OPEC-promised-vs-realized / hurricane-track-probability.
- **Naomi** (event-driven): deal-terms / regulatory-classification / spread-evolution / capital-structure / borrow-financing / litigation / political-regime / sponsor-history / target-fundamental / cross-deal-pattern; **per-deal / per-target / per-acquirer / per-sponsor / per-jurisdiction / per-commissioner / per-court / per-judge** entity dimensions.
- **Diego** (sports): pre-event-edge / in-running-stat-vs-market-gap / lineup-impact / weather-adjusted-scoring / racing-form / cross-book-spread.
- **Aria** (prediction markets): polling / forecasting-model / OSINT / weather / patent-and-lawsuit / oracle-state / venue-pricing / cross-asset / calibration; **resolution-source-derived flag**.
- **Quinn** (overseer): firm-aggregate cross-archetype factor exposures, correlation-cluster features, capacity-utilization features.
- **David** (PM/Risk): firm-aggregate risk features (`firm.aggregate_var_*`, `firm.gross_exposure`, `firm.concentration_top_n`, `firm.counterparty_concentration`, etc.), cross-archetype factor exposures, latent-exposure flags (e.g. firm-wide short-vol exposure aggregated across multiple archetypes).
- **Elena**: does not interact with the feature library.

### Used by

13 trader archetypes + Quinn + David. **14 of 15.** Elena is the exception.

---

## 5. The Research Workspace

### What it is

The trader-turned-quant's primary working environment. A serious notebook + IDE environment integrated with the firm's data layer, feature library, model registry, backtest engine, and experiment tracker.

This is where the trader spends the majority of their day in the new world. The supervisor console is open in another monitor; the research workspace is the active surface.

### Why it matters

The friction between idea and tested-result is the single biggest driver of researcher productivity. A senior trader with a domain insight should be able to:

1. Pull the relevant data (already cataloged).
2. Build the relevant features (mostly already in the library).
3. Train a candidate model (or rule-set).
4. Run a walk-forward backtest with realistic execution.
5. Compare to a baseline.

…in **hours, not weeks**. The platform must compress this loop.

- **Efficiency:** time-to-validated-strategy compresses from weeks to hours.
- **Risk:** anti-patterns (lookahead, survivorship, p-hacking) are caught by the platform, not by trader discipline.
- **PnL:** more validated alpha per quarter. Compounded over years, the difference between a good research workspace and a mediocre one is dozens of percent of fund return.

### Standard shape — eight sub-surfaces

#### 5.1 The Notebook Environment

- **Jupyter-style notebooks** are the dominant interface; full IDE option (VS Code-style) for traders who prefer it.
- **Kernel runs on research compute, not the trader's laptop** — dataset size doesn't matter; GPU is available on demand; the trader's machine doesn't melt under a backtest.
- **Pre-loaded with platform SDK:** one-line access to data layer, features, models, backtest engine, plotting, experiment tracking.
- **Auto-attached environment:** the kernel comes with the firm's standard Python stack, version-pinned. No `pip install` battles.
- **Persistent storage** per user, plus shared workspaces for desk collaboration.
- **Real-time collaboration** — multiple researchers editing the same notebook live (Google-Docs style) for paired research.
- **Notebook → script → production pipeline** — once a notebook proves an idea, the pipeline lifts the relevant code into a production-grade module (with linting, types, tests, version control).

**Critical platform integrations:**

- **One-line data access.** `df = data.load("<dataset_id>", since=...)`. No SQL fumbling.
- **One-line feature retrieval.** `feature_value = features.get("<feature_id>", instruments=..., since=...)`.
- **One-line model loading.** `model = models.get("<model_id>", version=...)`.
- **One-line backtest.** `result = backtest(strategy=..., data=hist, period=...)`.
- **One-line plotting.** Platform helpers for equity curves, drawdown shading, attribution, surface plots, calibration curves.
- **One-line experiment registration.** Backtests and training runs auto-register in the experiment tracker.

#### 5.2 The Backtest Engine UI

The single most-used surface in the research workspace.

**Layout when running a backtest:**

- **Form panel** — strategy selector, data window, instruments / contracts / universe, parameter overrides, execution model parameters (slippage curves, fee schedules, latency model, partial fills, MEV / gas / borrow / bridging cost where applicable).
- **Live progress** — "1.2 of 5.0 years simulated, 32% complete, ETA 3 min." Cancel button.
- **Streaming results** — equity curve building bar by bar, slippage attribution, recent fills tape.
- **Final results page (when complete):**
  - Summary metrics — Sharpe, Sortino, Calmar, max drawdown, hit rate, expected shortfall, capacity estimate, **plus archetype-relevant primary metrics** (Brier for prediction markets, captured-edge-bps for market making, calibration RMSE, risk-adjusted attribution).
  - Equity curve with drawdown shading; benchmark overlay.
  - Per-trade attribution histogram.
  - Slippage breakdown — assumed vs realized, by venue, by size bucket.
  - Regime-conditional performance.
  - Sensitivity analysis — parameter perturbation effect.
  - Robustness checks — out-of-sample, walk-forward, bootstrap CI.
  - Auto-flagged warnings — lookahead detected; survivorship bias risk; in-sample tuning detected.

**Realistic execution simulation is mandatory.** Slippage curves derived from historical depth, fee schedules with VIP-tier applied, latency model per venue, partial fills based on queue position estimation, MEV cost (DeFi), gas (DeFi), bridge costs (cross-chain), borrow cost (shorts), bet-delay (sports), capital-lockup (prediction markets), KYC / position-limit constraints (regulated venues). **The same execution code runs in live as in backtest** — divergence between paper and live is rare and investigated.

#### 5.3 Walk-Forward Visualization

Walk-forward backtest is the default; the visualization is critical for honest evaluation.

**Layout:**

- **Top:** equity curve broken into training-window and test-window segments, color-coded.
- **Middle:** per-test-window primary metric (Sharpe / Brier / etc.) with confidence-interval bars.
- **Bottom:** parameter-stability check — were the parameters consistent across rolling windows, or did they jitter (overfitting to training).
- **Side:** out-of-sample summary, in-sample summary, generalization gap.
- **Cycle-aware view (Aria-specific extension):** for political models, segments aligned to election cycles; for sports models, segments aligned to seasons; for energy, aligned to seasonal cycles.

If the in-sample metric is much better than the out-of-sample, the model is overfit; the visualization makes this stark.

#### 5.4 The Strategy / Monitor Template Library

Pre-built strategy compositions or monitor scaffolds the trader starts from. Reduces time-to-first-strategy from days to hours.

The template library is **per-archetype** (Marcus's basis-arb template differs from Henry's pair-trade template differs from Naomi's deal-pair template differs from Diego's pre-event-mean-reversion template differs from Aria's cross-venue-arb template differs from Rafael's theme-monitor scaffold). The platform provides one template engine; archetypes fill it with their domain templates.

The trader's day starts at a template and customizes from there. Many of the firm's live strategies are instances of a smaller number of templates with parameter profiles tuned per asset class / instrument / regime.

See per-archetype docs for template lists; see [automation-unique-tools.md](automation-unique-tools.md) for the cross-archetype index.

#### 5.5 Compute Management

- **Active jobs panel** — running jobs with progress, ETA, cost-so-far, cancel buttons.
- **Queued jobs panel** — submitted but waiting (e.g. overnight runs).
- **Cost dashboard** — month-to-date compute spend, by job type, with budget guardrails.
- **GPU / cluster availability** — when can a big training job run, vs. when the cluster is busy.
- **Result archive** — completed jobs with their experiment-tracker entries.

Long-running jobs require explicit confirmation (a 4-hour A100 sweep prompts before launching). Cost is always visible. The trader does not manage VMs or queues — they request work; the platform delivers.

#### 5.6 Anti-Patterns the Workspace Prevents

Universal across archetypes:

- **Untracked data pulls.** Every query logs lineage; nobody can secretly bake test-set data into a "training" notebook.
- **Untracked feature definitions.** A feature defined in a notebook and never published is suspect; the platform prompts.
- **Lookahead bias.** The backtest engine refuses to use future data; warnings if the trader tries.
- **Survivorship bias.** Backtests run on the as-of universe, not today's roster.
- **In-sample tuning masquerading as out-of-sample.** Walk-forward forces honest splits; manual "let me just check this period" is logged and counted toward multiple-testing penalty.
- **Reproducibility gaps.** A notebook that can't be re-run from scratch (mutable state, local files, undocumented config) is flagged.
- **Resolution-source data leak** (Aria-specific extension): a feature using resolution-source data after the contract was supposedly trading.
- **Point-in-time violation** (Henry-specific extension): a fundamental feature using restated values rather than as-reported at the time.

#### 5.7 Trader Interactions with the Workspace

- **Pre-market:** review overnight backtest / training results; pick winners for further work.
- **In-market (research-heavy hours):** active in the workspace; new strategy ideas, feature engineering, retraining, diagnostic.
- **Diagnostic (when alerted):** pull a misbehaving strategy into the workspace, replicate the issue, diagnose, fix, redeploy.
- **Post-market:** queue overnight jobs.

#### 5.8 Why this matters (recurring frame)

Efficiency / risk / PnL closing.

### Design principles

- **One-line everything.** Data, features, models, backtests, plots, experiment registration — all single-line API calls. Friction kills research velocity.
- **Compute is a substrate.** The trader does not manage VMs / queues / GPUs. They request work; the platform delivers; cost is visible.
- **Anti-patterns caught by the platform, not by trader discipline.** Lookahead, survivorship, p-hacking, leak — all detected and flagged.
- **Backtest = paper = live execution path.** The same execution code runs in all three; divergence is rare and investigated.
- **Reproducibility everywhere.** Any backtest, any model, any plot can be re-generated from registered inputs.
- **Walk-forward by default.** Out-of-sample is not optional.

### Archetype variations (illustrative)

- **Marcus, Julius** — backtest engine emphasizes microstructure realism (slippage from historical depth, MEV cost on on-chain legs); template library covers basis-arb / funding-harvest / cross-venue-leadlag / liquidation-cluster / OI-divergence / cross-asset-correlation.
- **Mira** — backtest engine _is_ a microstructure simulator (queue-position simulation, matching-rule emulation, latency injection, rate-limit emulation, counterparty-fill emulation); reconcilability with live is a quality criterion.
- **Sasha** — backtest engine emphasizes surface evolution + auto-delta-hedge simulation; templates include short-strangle-with-delta-hedge, calendar spread, gamma scalping, dispersion.
- **Henry** — point-in-time fundamentals enforced; backtest universe respects as-of listings (no survivorship); templates include pair trades, factor tilts, earnings-window setups, sector rotation.
- **Ingrid** — backtest engine is curve-aware (yield-space, not price-space); templates include curve / butterfly / basis / swap-spread / RV models.
- **Rafael** — research workspace skews toward theme-research; backtests apply to theme-relationship reliability rather than single-strategy alpha.
- **Yuki** — backtest engine has multi-LP fill model with last-look + RFQ + fixing mechanics; templates include carry-basket, fixing-flow, NDF arb, intervention-zone.
- **Theo** — backtest engine enforces EIA-blackout periods; cycle-aware walk-forward (seasonal); templates include calendar-spread, weather-driven natgas, crack-spread mean-reversion.
- **Naomi** — backtest engine resolves deals to actual close / break outcomes; deal-history-grounded; templates include cash-deal-arb, capital-structure pair, distressed.
- **Diego** — backtest engine emulates bet-delay, market suspension, stake-factor, leg-out latency; sports-realism critical; templates include lay-the-draw, tennis-serve-scalp, racing-pre-final-furlong, in-play tick-scalp.
- **Aria** — backtest engine resolves contracts to historical resolution outcomes (with disputed-market sensitivity); capital-lockup aware; cross-venue execution-realistic; per-domain templates (politics / econ / geopolitics / tech / weather).
- **Quinn** — workspace emphasizes cross-archetype meta-strategies; backtests apply to fleet-of-fleets compositions.
- **David** — workspace is firm-aggregate analytics (stress-scenario design, ensemble-correlation analysis); not new alpha.
- **Elena** — does not interact with the workspace.

### Used by

13 trader archetypes + Quinn + David. **14 of 15.** Elena is the exception.

---

## 6. The Model Registry

### What it is

A versioned, searchable catalog of every model the firm has trained, with full reproducibility guarantees. Every model — whether a gradient-boosted tree predicting funding-rate mean-reversion, a sequence model predicting in-play soccer goals, a fitted IV surface, an NLP classifier reading merger agreements, an ensemble polling-aggregator — is a first-class object with identity, training data hash, hyperparameters, performance, lineage, and deployment status.

### Why it matters

Models are the executable form of the trader's edge. They get retrained, replaced, deprecated. Without a registry the firm cannot answer basic questions: "what model is currently running on strategy X?" "What was its training data?" "Can I reproduce the model that was running last March when we had that drawdown?" "If I retrain this with new data, what's the version delta?"

For regulators, auditors, and post-incident review, **model lineage is non-negotiable**. For research velocity, the registry is what lets one trader's model be reused (or replaced) by another without losing context.

- **Efficiency:** the trader does not waste hours reconstructing what a strategy is running on. The registry says: this strategy uses model X v2.4.1, trained on data hash Y, with hyperparameters Z. Diagnostic loop closes fast.
- **Risk:** without the registry, the firm cannot answer regulator / auditor / risk-committee questions about what's deployed. Reproducibility is non-negotiable.
- **PnL:** retraining cadence is data-driven, not gut-driven. Decay is measured per model; retire decisions are evidence-based.

### Standard shape — six sub-surfaces

#### 6.1 The Model Registry Browser

- **Left sidebar** — taxonomy filters: model class (gradient-boosted / linear / neural / custom rule-set / surface-fit / ensemble); domain (per archetype); owner; deployment status (research / paper / pilot / live / monitor / retired); performance band; drift state.
- **Main panel** — table of models. Columns: name, version, owner, model class, training date, OOS performance (with CI), deployment count, drift status, last-modified.
- **Right pane** — when a model is selected: the model record (next subsection).

#### 6.2 The Model Record Page

Per model:

- **Identity:** model ID, version (semantic + content hash), name, description, owner, code commit of training pipeline.
- **Lineage:** training data hash, feature set with versions, hyperparameters, label definition, training command. **Reproducibility guaranteed** — rerun-from-registry produces a bit-identical model, or the platform flags drift if data lake changed.
- **Training metadata:** training date, duration, compute used (CPU-h, GPU-h), $ cost, hardware.
- **Performance — multiple regimes:**
  - In-sample primary metric (Sharpe / Brier / hit rate / RMSE / captured-edge-bps — whichever fits the archetype).
  - Out-of-sample on hold-out.
  - Walk-forward with confidence interval.
  - Per-regime conditional performance (vol-high / vol-low, pre-FOMC / post-FOMC, primary cycle / general cycle, etc.).
  - Capacity estimate where applicable.
- **Lineage graph:** parent (if fine-tuned / retrained), children (descendants), siblings (sister models from the same experiment).
- **Deployment state:** which strategies use which version, in which environments. Map: model version → strategy version → live capital.
- **Drift state:** input-distribution drift, prediction-distribution drift, performance vs expectation.
- **Documentation:** explainability cards (feature importance, partial-dependence plots, SHAP-style attribution), known failure modes, regime fit notes.
- **Action panel:** "retrain with new data," "deploy to paper," "deprecate," "fork into a new variant."

#### 6.3 Versioning & Immutability

- **Semantic versioning** for trader-meaningful changes.
- **Content hash** for guaranteed reproducibility — any change in code / data / hyperparameters yields a new hash.
- **Old versions never deleted.** A retired model is still in the registry, retrievable, redeployable.
- **Promotion path:** model is registered (research) → validated (paper) → deployed (live with strategy attached). Each transition auditable.
- **Rollback:** any prior version can be re-deployed in one click; promote / rollback is a controlled operation.

#### 6.4 Drift Surface for Models

Distinct from feature drift (covered in section 4), model drift focuses on the model's _outputs_.

- **Prediction-distribution drift** — has the model's prediction distribution shifted vs. its training-time distribution? KS-test, PSI, custom metrics.
- **Performance drift** — is the model's realized accuracy / Sharpe / Brier diverging from backtest expectation?
- **Calibration drift** — for probabilistic models, are the predicted probabilities still well-calibrated against realized outcomes?

Drift triage queue: top models by drift score, with their downstream strategies. Click a row → suggested actions (retrain, recalibrate, replace, retire).

#### 6.5 Lineage Graph

Per model, a visual graph:

- Upstream: training data → features → model.
- Downstream: model → strategies → P/L.
- Sister versions: prior versions of this model, with deltas highlighted.

Used during diagnostic work and during model deprecation (impact-of-change).

#### 6.6 Why this matters (recurring frame)

Same efficiency / risk / PnL closing.

### Design principles

- **Reproducibility everywhere.** Any model can be re-trained from registered inputs and produce a bit-identical result.
- **Old versions never deleted.** Retired ≠ inaccessible.
- **Lineage end-to-end.** Data → feature → model → strategy → trade → P/L; every step traceable both directions.
- **Drift is monitored continuously, not on-demand.**
- **Promotion is controlled.** New model versions go through paper-pilot-live just like new strategies.

### Archetype variations

The model registry is the most-uniform surface across archetypes; the model **types** differ but the registry frame is identical. Variations to call out:

- **Mira** — "models" include quote-engine inner models (adverse-selection classifiers, queue-position estimators, lead-lag predictors). Versioning is critical because parameter changes cycle fast.
- **Sasha** — surface-fit models, smile-regime classifiers, fair-vol models, dealer-positioning estimators. Multiple model types per strategy.
- **Rafael, Naomi** — model registry less central; their automated work is more about scaffolding / monitoring than predictive ML.
- **David, Quinn** — registry is firm-aggregate: governance over which models are deployed, with what risk policy, where.
- **Aria** — polling-aggregator ensembles, calibration-adjusted fair-price models, oracle-dispute classifiers, cross-venue arb detectors. **Cycle-aware retraining** is a registered concept.
- **Elena** — does not interact with the registry directly; receives model-risk transparency disclosures (see her short-note appendix).

### Used by

13 trader archetypes + Quinn + David. **14 of 15.** Elena receives transparency disclosures only.

---

## 7. The Experiment Tracker

### What it is

A log of every backtest, every model training run, every hyperparameter sweep — successful or failed. Failures are data; the experiment tracker preserves them. Searchable, comparable, reproducible.

### Why it matters

Most research is failed experiments. A senior trader running 200 backtests in a quarter cannot remember what was tried in week 3 vs week 7. Without an experiment tracker, the same dead-end gets explored twice. Worse: a successful experiment that produced a great Sharpe gets lost because the notebook was overwritten.

The experiment tracker is the **firm's institutional memory of what's been tried**.

- **Efficiency:** failed experiments are data, not waste. Avoiding the same dead-end twice is real productivity.
- **Risk:** p-hacking is the silent killer of quant research. The tracker makes the trader's process honest and defensible.
- **PnL:** the firm's accumulated experiment knowledge compounds over years. New researchers stand on the shoulders of every prior run.

### Standard shape — five sub-surfaces

#### 7.1 The Experiment Browser

- **Left sidebar** — filters: researcher, time period, model class, feature set, strategy class, status (running / complete / failed).
- **Main panel** — table of runs. Columns: run ID, name, researcher, started, duration, status, primary metric (Sharpe / Brier / etc.), feature set, parameter summary, annotations.
- **Sortable, multi-select for comparison.**

#### 7.2 The Per-Experiment Record

- **Trigger** — notebook + cell, scheduled run, hyperparameter sweep, scripted pipeline.
- **Config** — full hyperparameters, feature set, period, splits, seed, hardware. Anything that can affect outcome.
- **Inputs** — feature versions, data snapshot, code commit. Identical to model registry training metadata for ML runs; broader for non-ML runs (rules-based backtests, cross-asset relationship tests).
- **Output** — performance metrics, equity curve, attribution, plots, log files.
- **Diagnostics** — runtime, peak memory, errors, warnings.
- **Annotations** — researcher's notes ("tried this because hypothesis X; didn't work because reason Y").
- **Tags** — category, hypothesis, strategy class.

#### 7.3 Run Comparison Views

The most-used surface for research velocity.

- **Side-by-side comparison (2-way):** two experiments selected → diff view: feature-set delta, hyperparameter delta, performance delta, equity-curve overlay, attribution comparison, "what changed" summary.
- **N-way comparison (table form):** multiple experiments in a table; sort / filter on metrics; identify dominant configurations.
- **Pareto-frontier views:** across many experiments, which configurations dominate (Sharpe vs drawdown / vs capacity / vs complexity). 2D scatter, interactive.
- **Hyperparameter sensitivity:** vary one parameter, hold others; plot the response curve. Useful for understanding which parameters matter and which are noise.
- **Ablation views:** "which features matter most?" — computed by permutation importance or SHAP. Per-experiment context, plus aggregate across many experiments.

#### 7.4 Anti-Patterns Prevented

- **P-hacking by re-running.** Every run is logged; trying 50 hyperparameter combos and reporting the best as if it was the only is detectable. Multiple-testing penalty surfaced.
- **Cherry-picking periods.** Each experiment's period is recorded; "I just happened to test 2021" is visible.
- **Hidden in-sample tuning.** Walk-forward + log of every adjustment makes the trader's process honest.

#### 7.5 Why this matters (recurring frame)

Efficiency / risk / PnL.

### Design principles

- **Every run logged.** Failures are first-class.
- **Reproducibility carries through from the model registry.** An experiment can be re-run from registered inputs.
- **Comparison is the primary interaction.** Researchers spend more time comparing runs than viewing single runs.
- **Annotations are durable.** Tags + free-text + linked-deal / linked-theme / linked-strategy.

### Archetype variations

The experiment tracker is largely universal. Per-archetype the _experiment classes_ differ:

- **Marcus, Julius, Sasha, Mira** — ML experiments (model trainings + sweeps + ablations) dominate.
- **Henry** — experiments mix factor-model training with event-study experiments.
- **Ingrid** — experiments emphasize curve-shape backtests, regime-conditional fits.
- **Rafael, Naomi** — experiments include theme-evolution tests and pattern-match tests rather than ML model trainings.
- **Aria** — cycle-aware experiments (each election cycle is a regime); experiments stratified by cycle.
- **Diego** — seasonal / tournament-bound experiments; off-season is when experiments accumulate.
- **Quinn** — meta-experiments (cross-fleet allocation backtests, factor sleeve tests).
- **David** — firm-policy experiments (stress-scenario design, risk-limit-change counterfactuals).

### Used by

13 trader archetypes + Quinn + David. **14 of 15.** Elena does not.

---

## 8. The Strategy Composition Surface

### What it is

A model alone is not a tradable strategy. A strategy is what wraps a model (or rule set) with **sizing logic, entry/exit logic, hedging, risk gating, regime conditioning, capacity management, and execution policy**. The composition surface is where the trader takes a model and turns it into a deployable unit of capital — or, for some archetypes, where they wrap a monitor with sizing rules.

### Why it matters

The same model can be expressed as many strategies. A vol-rich/cheap model can drive a passive-only short-vol strategy, an active gamma-scalping strategy, a calendar-spread strategy, a cross-underlying dispersion strategy. Each is a different risk/return profile, capacity, and operational footprint. The platform must let the trader express these variants without re-implementing model logic each time.

- **Efficiency:** the same model expressed as many strategies without re-implementing model logic.
- **Risk:** validation catches the high-cost errors before they reach production.
- **PnL:** different strategy variants per model capture distinct alpha; composition lets the trader own each variant explicitly.

### Standard shape — five sub-surfaces

#### 8.1 The Composition Surface

A structured form-plus-code UI. The trader configures the structured parts (visual graph + form fields) and drops into Python for any custom logic.

**Layout (sketch):**

- **Top bar** — strategy ID, name, version, owner, current stage (Research / Paper / Pilot / Live / Monitor / Retired), action buttons (validate / backtest / deploy / clone / archive).
- **Left graph view** — the strategy as a directed graph: data sources → features → model(s) → signal → entry/exit logic → sizing → execution. Click any node to configure.
- **Right panel** — properties of the selected node (data source, feature, model, signal, entry/exit, sizing, hedging policy, risk gates, execution policy, schedule, mode, tags).
- **Bottom panel** — validation feedback, backtest results, deployment state.

**Code drop-in:** for any node, "convert to custom code" opens a Python editor with the platform SDK pre-loaded. Useful for novel signal-combiners, exotic exit logic, or anything the structured form can't express.

#### 8.2 Pre-Deployment Validation

Before a strategy can be promoted past research, the platform checks for common errors:

- **Lookahead leak detection** — static analysis of signal logic for future-data references.
- **Infinite-loop entry** — strategies that would re-enter immediately after a stop.
- **Unbounded position size** — sizing logic that doesn't cap exposure.
- **Missing kill-switch wiring** — every strategy must have automated risk gates with kill-on-breach.
- **Schedule conflicts** — strategies marked active during venue maintenance windows or known-bad windows (e.g. funding settlement, fixing windows for FX).
- **Compliance flags** — restricted-list exposure, sanctioned-counterparty exposure, jurisdictional access.
- **Capacity sanity** — claimed capacity matches the platform's slippage-curve estimate.
- **Universe consistency** — instrument list aligns with data and feature coverage.
- **Archetype-specific checks** — e.g. capital-control-gate check on EM strategies (Yuki); EIA-blackout-window check (Theo); resolution-source-data-leak check (Aria); point-in-time-fundamentals check (Henry).

Each warning gates progression. Errors must be fixed; warnings can be acknowledged with reason.

#### 8.3 Strategy Versioning

- Every change to the composition produces a new strategy version.
- Old versions stay in the registry.
- Live deployments pin to a specific version; promoting a new version is a controlled operation.
- Diff views: show what changed between version 2.4 and 2.5.

#### 8.4 Strategy Templates (Per-Archetype, Illustrative)

Pre-built strategy compositions the trader's day starts at. Many of the firm's live strategies are instances of one template parameterized for a specific (instrument, venue, horizon, regime).

Templates are **per-archetype**; the platform provides one composition surface, archetypes fill it with their templates. See [automation-unique-tools.md](automation-unique-tools.md) for the cross-archetype template index; full template lists in per-archetype docs.

#### 8.5 Why this matters (recurring frame)

Efficiency / risk / PnL.

### Design principles

- **Visual + code-droppable.** Structure for the platform to validate; code for the trader to express anything.
- **Validation is mandatory pre-promotion.** Lookahead, unbounded sizing, missing kill-switches caught at validation.
- **Versioning is rigorous.** Old versions preserved.
- **Templates accelerate.** Time-to-deployable-strategy compresses from days to hours.

### Archetype variations

This is one of the surfaces with the **largest archetype-shape divergence**, because the unit-of-composition differs per archetype:

- **Marcus, Julius, Sasha, Henry, Ingrid, Yuki, Theo** — composition is a **strategy** in the canonical sense (model + entry/exit/sizing/hedging/execution).
- **Mira** — composition collapses to **Parameter Profile Composition**. Her unit-of-work is a parameter profile attached to a quote-engine class, not an independent strategy. Section 8 in her appendix is renamed accordingly.
- **Naomi, Rafael** — composition is light. Naomi's "strategies" are deal-screening models + per-deal sizing rules; Rafael's are theme-tracking dashboards + scenario engines. Less composition complexity.
- **Diego** — composition emphasizes bet-delay / suspension / account-health / stake-factor gating; templates include lay-the-draw, tennis-serve-scalp, racing-pre-final-furlong.
- **Aria** — composition includes resolution-source-data-leak validation as a mandatory pre-deployment check; per-domain templates (politics / econ / geopolitics / tech / weather).
- **Quinn** — composition is **cross-archetype meta-strategy composition** — legs in multiple archetype instrument spaces, with cross-fleet correlation validation.
- **David** — composition surface is replaced by **Risk-Limit Hierarchy Composition** — David doesn't compose strategies; he composes the firm-level hierarchy of caps and rules.
- **Elena** — does not interact with composition.

### Used by

13 trader archetypes + Quinn (meta-strategy) + David (limit-hierarchy form). **14 of 15.** Elena does not.

---

## 9. Promotion Gates & Lifecycle

### What it is

The lifecycle (Research → Paper → Pilot → Live → Monitor → Retired) is enforced by promotion gates. The lifecycle UI is the surface the trader uses every day to advance, demote, and retire their strategies. Quinn lives in this surface natively; in the new world, _every_ archetype's automated cousin lives in it.

### Why it matters

In manual trading, the trader's primary action is "place trade." In automated trading, the trader's primary action is **promote / demote / retire**. The lifecycle UI is what the trader uses every day.

- **Efficiency:** lifecycle gates standardize quality control. The trader does not design a custom evaluation framework for each strategy.
- **Risk:** every strategy reaching live capital has passed code review, risk review, validation. The platform's risk surface is correlated with lifecycle stage.
- **PnL:** poorly performing strategies are retired by the lifecycle, not by the trader's gut. Discipline compounds.

### Standard shape — three sub-surfaces

#### 9.1 The Lifecycle Pipeline View

A pipeline visualization, like a Kanban board:

- **Columns:** Research, Paper, Pilot, Live, Monitor, Retired.
- **Cards:** strategies (or parameter profiles, or scaffolds — depending on archetype), with name, owner, days-in-stage, current performance vs expectation, gate status.
- **Drag (controlled):** dragging a card across columns proposes a transition; opens the gate UI.

This is the home page for lifecycle work. The trader sees, at a glance, the pipeline: how many in research, waiting on promotion review, in pilot, at full live, on monitor probation.

#### 9.2 The Gate UI per Transition

Each promotion is a checklist with evidence, not a chat conversation.

**Research → Paper:**

- Code review passed (link to PR / commit).
- Backtest framework approved (no anti-pattern warnings).
- Walk-forward primary metric above threshold (with confidence interval).
- Risk parameters set within firm limits.
- Kill-switch wired and tested.
- Owner sign-off.

**Paper → Pilot:**

- N days of in-distribution behavior on paper (default 14 days, configurable).
- Slippage estimates validating against backtest assumptions.
- Strategy fits within firm risk limits at pilot capital level.
- Owner + risk team sign-off.

**Pilot → Live:**

- N days of pilot behavior matching expectation (default 30 days).
- Capacity estimate refined with real data.
- No anomalies in alert log.
- David (or his delegate) sign-off for material capital allocations.

**Live → Monitor:**

- Trader-initiated (degradation observed) or system-initiated (drift / decay alerts).
- Reason logged.
- Capital cap reduced per policy.

**Monitor → Retired:**

- Decay confirmed (statistical evidence).
- No path to retraining or recalibration.
- Retire decision logged with rationale.

**Retired → Research / Paper (rare):**

- Explicit re-promotion case.
- New evidence (regime change, new feature, new data) justifies revisit.

#### 9.3 The Lifecycle Decision Log

Append-only log of every transition: timestamp, strategy ID, version, from-stage, to-stage, decided by, reason, evidence links. Searchable, auditable, exportable for risk-committee review.

### Design principles

- **Gates are checklists with evidence, not chat conversations.** Quantitative gates pass automatically; human gates require explicit sign-off.
- **Auditability is non-negotiable.** Every transition logged with timestamp, actor, reason, evidence.
- **Reversibility where prudent.** Rollback to a previous version is one click; demote to monitor is one click.
- **Cross-trader visibility at firm level.** David sees every transition across the floor.
- **Cadence matches archetype.** Crypto cycles fast; equity factors cycle slowly; sports cycle seasonally.

### Archetype variations

The lifecycle frame is universal; the **unit** that flows through it differs:

- **Marcus, Julius, Sasha, Henry, Ingrid, Yuki, Theo, Naomi, Aria** — strategies flow through lifecycle.
- **Mira** — **parameter profiles** flow through lifecycle, not strategies. Faster cadence (typical 15–30 cycles / week vs single-digit). Stages may include `shadow → canary-live → live` instead of just `paper → pilot → live`.
- **Diego** — strategies cycle, but with a **seasonal-hibernation** sub-state for tournament-bound or weather-bound strategies (winter-natgas-style strategies in football: Premier League strategies sleep during World Cup, wake on EPL restart).
- **Theo** — same seasonal-hibernation concept for winter-natgas / summer-gasoline strategies.
- **Quinn** — meta-strategies + her own portfolio of cross-archetype strategies cycle.
- **David** — replaces lifecycle with **Strategy Class Sanctioning Lifecycle**: which strategy _classes_ are firm-approved (not which specific strategy instances). Different shape.
- **Elena** — does not interact with lifecycle.

### Cadence (illustrative)

- Crypto (Marcus, Julius): 5–20 promotion decisions per day across the fleet.
- Market making (Mira): 15–30 parameter-profile cycles per week; faster than strategy lifecycle anywhere else.
- Equity (Henry): mostly _adding_ strategies; factor decay is the main retire trigger; lifecycle slower.
- Macro / event-driven (Rafael / Naomi): lifecycle slower; per-theme / per-deal-class.
- Sports (Diego): seasonal cadence with hibernation between competitive windows.

### Used by

13 trader archetypes + Quinn + David (in modified form). **14 of 15.** Elena does not.

---

## 10. The Capital Allocation Engine

### What it is

The system that decides how much capital each strategy in the trader's fleet receives. **In manual trading, the trader sized each position by gut + spreadsheet. In automated trading, the platform proposes allocations across a fleet of strategies and the trader approves.**

Capital allocation across hundreds of strategies is a portfolio-construction problem with significant academic and operational depth. The platform brings that depth to the trader's fingertips.

### Why it matters

- **Efficiency:** allocation across hundreds of strategies is not solvable by spreadsheet. The engine compresses what would otherwise be hours of nightly work into a 10-minute review.
- **Risk:** systematic risk-parity / Kelly / Markowitz constraints prevent over-allocation to a single strategy or correlation cluster. Better diversification than gut sizing.
- **PnL:** marginal Sharpe analysis ensures incremental capital goes to where it has highest return. Capacity-aware sizing prevents over-trading thin strategies.

### Standard shape — six sub-surfaces

#### 10.1 The Allocation Engine UI

**Layout:**

- **Top panel** — total capital available, currently allocated, free, in-flight (between venues / settling). Per-archetype budget (the trader's slice of firm allocation, set by David).
- **Main table** — every strategy with current allocation, proposed allocation, delta, expected Sharpe contribution, marginal Sharpe contribution, capacity headroom, drift state, lifecycle stage.
- **Right panel** — risk decomposition of the proposed portfolio: gross / net / VaR / per-instrument-cluster / per-venue / stress-scenario PnL. Concentration warnings.
- **Bottom panel** — methodology selector + parameters (the trader picks or combines methodologies — see 10.2).

**The proposal:**

- Generated nightly by default; on-demand when the trader wants.
- Auto-respects firm-level constraints (David's caps).
- Material changes from current allocation flag for sign-off — trader's sign-off for trader-level changes; David's for archetype-level.
- "Approve and apply" button — strategies update their capital caps; the platform respects.

#### 10.2 Allocation Methodologies

The trader selects (or combines):

- **Equal-weight** — naive baseline.
- **Sharpe-proportional** — more capital to higher-Sharpe strategies.
- **Risk-parity** — equal risk contribution per strategy.
- **Markowitz / mean-variance** — optimal under correlation constraints.
- **Kelly / fractional Kelly** — bankroll-optimal under independence assumption (often fractional 1/4 or 1/2 Kelly for risk management).
- **Regime-conditional** — allocations vary by detected regime.
- **Hierarchical risk parity** — clusters strategies, allocates within and across clusters.
- **Custom** — trader supplies their own logic in code.

Most senior traders blend several with overrides.

#### 10.3 Per-Venue / Per-Wallet / Per-Sub-Account Balance Management

Where capital must be **physically located** matters as much as how much is allocated.

This is most visible for crypto traders (Marcus, Julius, Mira) — capital must be on the right venue's sub-account at the right margin tier — but every archetype has analogues:

- Equity traders (Henry) — prime-broker balances, margin segregation, locate-pool funding.
- FX traders (Yuki) — settlement-currency funding, NDF margin, fixing-window pre-funding.
- Rates traders (Ingrid) — CCP margin (LCH / CME / Eurex), repo funding, dealer margin lines.
- Energy (Theo) — exchange margin, OTC counterparty margin, physical storage requirements (rare for financial desks).
- Event-driven (Naomi) — borrow-pool funding, margin for paired shorts, claim-trading capital pools.
- Sports / prediction (Diego, Aria) — per-book / per-venue balances, account-health tracking, stake-factor management.

Auto-rebalance proposals when concentration occurs; trader-set thresholds for auto-vs-manual rebalance.

#### 10.4 Allocation Drift

Allocations drift during the day as strategies make / lose money. The engine continuously shows:

- Drift from optimal vs realized.
- Whether to rebalance now (intraday) or wait for nightly.
- Cost of rebalancing (slippage, fees, bridge costs) vs expected return improvement.
- Auto-rebalance thresholds (configurable per strategy class).

#### 10.5 Capacity & Headroom

- **Per-strategy capacity utilization** — % of estimated capacity in use, color-coded.
- **Free capacity** — strategies with headroom; where to add.
- **Capacity exhausted** — strategies at cap; signals being skipped. Decision: accept (this is the strategy's natural ceiling) or invest in raising capacity (better execution, broader universe, additional venues).

Capacity is a primary constraint on PnL; this surface is consulted continuously.

#### 10.6 Why this matters (recurring frame)

Efficiency / risk / PnL.

### Design principles

- **Engine proposes, trader approves.** The engine does not auto-move capital without human sign-off (configurable per archetype — Mira's parameter profiles may auto-promote within bounds).
- **Cross-archetype risk respected.** David's firm-level caps gate every proposal.
- **Per-venue mechanics first-class.** Where capital must physically live matters as much as how much.
- **Capacity-aware.** Sizing that ignores capacity is fiction.
- **Marginal analysis.** The engine answers "if I add $X to A vs B, expected incremental Sharpe is Y vs Z."

### Archetype variations

- **Marcus, Julius** — per-venue + per-wallet balance management foveal; auto-rebalance across venues with bridge-policy gates.
- **Mira** — capital allocation is per-instrument-per-venue inventory limits + parameter-profile budget caps. Less about $-distribution; more about exposure-distribution.
- **Sasha** — vega-budget allocation across (tenor × underlying × strategy class) is a vol-trader-specific dimension on top of $-allocation.
- **Henry** — per-share-class margin, locate-pool funding, combined-book beta-net targeting via hedge overlay (the systematic fleet + discretionary book are sized together).
- **Ingrid** — DV01-budget allocation across tenor buckets is a rates-specific dimension; CCP margin distribution.
- **Rafael** — per-theme + per-expression conviction-weighted allocation; never auto-moved without his click.
- **Yuki** — per-currency, per-funding-currency concentration, per-session (Tokyo/London/NY) caps.
- **Theo** — DV01-equivalent allocation, seasonal pre-positioning (winter-natgas builds capital allocation in October).
- **Naomi** — per-deal sizing × deal-type-bucket caps × concentration limits per sponsor / commissioner.
- **Diego** — per-event-cluster capital allocation (Saturday-3pm-EPL window vs Wednesday-Champions-League). Time-bound sizing.
- **Aria** — capital-lockup-aware allocation; long-resolution markets impose opportunity-cost shadow rates.
- **Quinn** — cross-fleet allocation; strategic reallocation workflow.
- **David** — **firm-level cross-archetype capital allocation is his primary surface**, expanded dramatically vs trader-level.
- **Elena** — does not allocate; she subscribes / redeems at fund level.

### Used by

13 trader archetypes + Quinn + David. **14 of 15.** Elena does not.

---

## 11. The Live Fleet Supervision Console

### What it is

The console where the trader supervises **every live strategy in their fleet**. Anomaly-driven by design: green by default; the trader is summoned only when something is off. This replaces the manual trader's "watch the chart" surface — the cognitive shift is from foveal-on-position to peripheral-on-fleet.

### Why it matters

- **Efficiency:** anomaly-driven attention compresses hundreds of strategies into a handful to investigate. The trader does not stare at hundreds of charts.
- **Risk:** anomalies are caught before P/L damage compounds. Auto-pause on critical alerts limits blast radius.
- **PnL:** time saved on supervision is reinvested in research. The leverage of the trader-quant role depends on this.

### Standard shape — seven sub-surfaces

#### 11.1 The Fleet Dashboard

The center of the supervisor console.

**Layout:**

- **Top filter bar** — health badge filter (default: amber + red only; toggle to show green); strategy class filter; venue filter; instrument / contract / event filter; lifecycle-stage filter.
- **Main grid / table** — one row per strategy. Universal columns:
  - Strategy ID, name.
  - Strategy class (per archetype).
  - Lifecycle stage.
  - **Health badge** — green / amber / red, computed composite of PnL deviation, drift, slippage, alert volume.
  - Capital deployed / cap.
  - PnL today / WTD / MTD / YTD ($ and % of cap).
  - Sharpe rolling 30d (or primary metric per archetype).
  - Drawdown — current / max-since-go-live.
  - Trade count today vs typical (silence is a signal).
  - Hit rate, avg trade $.
  - Recent regime fit (model-vs-regime indicator).
  - Last intervention timestamp + actor.
  - Capacity utilization %.
  - **Archetype-specific columns** layer on top (see "Archetype variations").
- **Sortable, filterable, expandable.** Group by strategy class / venue / instrument / cluster / theme / deal toggleable.
- **Default view** filtered to amber + red. With hundreds of strategies, only a small percentage typically demand attention; everything else is healthy and trusted.

#### 11.2 The Strategy Detail Page

Click a strategy → drill into its full state.

- **Header** — strategy ID, name, class, lifecycle stage, current state, action buttons.
- **Top section: live state** — equity curve (with backtest expectation overlay; divergence flagged), position breakdown, drift indicators, recent intervention log.
- **Middle section: signal feed** — recent signals generated, executed vs skipped with reasons, last N decisions with full context.
- **Bottom section: diagnostic depth** — feature health (linked to feature drift dashboard), slippage realized vs assumed, capacity utilization curve, recent retraining history, linked alerts, linked experiments.

#### 11.3 The Anomaly Detection Surface

Anomaly detection is the heart of supervision. Categories:

- **Performance anomalies** — strategy underperforming its rolling distribution at 2σ / 3σ.
- **Behavior anomalies** — trade frequency, position size, hit rate outside historical bounds.
- **Feature drift** — input distribution shifted vs training.
- **Prediction drift** — output distribution shifted.
- **Execution anomalies** — slippage spike, rejection rate spike, fill rate drop.
- **Capacity warnings** — strategy hitting cap; signals being skipped.
- **Correlation anomaly** — strategy correlating with another it should not.
- **Regime mismatch** — running the wrong-regime model.
- **Infrastructure** — node down, data lag, RPC degraded, venue API rejecting.

Each anomaly has severity (info / warn / critical), routing rules, auto-actions on critical (auto-pause by default, configurable per strategy).

**The anomaly console:** active anomalies sorted by severity then recency; per-anomaly drill-in; acknowledged-anomalies log.

#### 11.4 Cross-Strategy Correlation View

The fleet is supposed to be diversified; correlation drift erodes diversification.

- **Heatmap** — strategy × strategy correlation matrix.
- **Drift indicators** — pairs that should be uncorrelated but drifting toward correlation.
- **Cluster visualization** — automatic clustering by behavior; outliers flagged.
- **Aggregate exposure decomposition** — fleet-level net delta / net beta / net vega / net DV01 / FX delta. Ensures supposedly-diversified strategies aren't quietly stacking exposure.

#### 11.5 Archetype-Specific Live State

This sub-surface is **the** archetype-specific section of the fleet supervision console. The shape is "a foveal panel showing the live state of the trader's primary risk dimension." Every archetype has one; every archetype's content differs.

- **Marcus** — Multi-Venue Capital + Balance Live State (per-venue capital deployed / free / in-flight, color-coded health).
- **Julius** — Multi-Domain Capital State (per CeFi venue + per chain wallet + per protocol exposure + in-flight bridges + stablecoin-peg + oracle-health strips).
- **Mira** — Inventory + Hedge + Adverse Selection Live State.
- **Sasha** — Aggregate Greek Panel (vega-by-tenor sparklines + vega heatmap + gamma + theta + delta-net target tracker).
- **Henry** — Factor Exposures + Catalyst Calendar Live State.
- **Ingrid** — DV01-Bucketed Fleet View.
- **Rafael** — Theme Pipeline Live State.
- **Yuki** — Currency Exposure + Carry-Unwind-Risk + Fixing-Approach Live State.
- **Theo** — Inventory-Release-Window Live State (with EIA / OPEC countdown + weather forecast + open spread positions).
- **Naomi** — Deal Pipeline Live State (every active deal with status / spread / days-to-close / regulatory phase / calibration).
- **Diego** — Active-Event Live State (every active event with score / time / liquidity / suspension state / video-feed health).
- **Aria** — Active-Resolution-Window Live State (every contract approaching resolution with capital-at-risk / oracle-state / dispute-state).
- **Quinn** — Firm-Aggregate Risk Live State (cross-fleet rollup).
- **David** — **Firm-Wide Live State** (multi-fleet aggregation; this is _the_ primary surface for him).

This sub-surface is the closest the automated terminal comes to the manual terminal's "primary chart workspace" — it's where the trader's attention rests when they want a feel for the fleet's state.

#### 11.6 Strategy State Inspection (mandatory)

A diagnostic surface that lets the trader inspect the **internal state of a running strategy** — its current variables, signal evaluation, model output, regime classifier, position-sizing intermediates — and compare live behavior against backtest expectation. Critical for verifying that a strategy is configured correctly, that live and backtest aren't drifting, and that the trader's mental model of the strategy matches what the code is actually doing.

**This is mandatory across all 13 trader archetypes** plus Quinn (cross-fleet inspection) and David (cross-fleet inspection). The platform will not ship without it. It is a verification surface, not a continuously-streamed real-time view. Implemented per strategy; the strategy declares which variables it exposes; the platform renders them on demand.

**Two layers:**

##### 11.6.1 Internal-state view (per strategy)

Opened from the strategy detail page on demand. Per strategy, it shows:

- **Current state variables** — the strategy's internal counters / flags / regime classifications / running averages / accumulators. Structured table: field name, current value, last-updated timestamp.
- **Current feature snapshot** — the input feature values the strategy is currently seeing (the feature-vector that would be fed to the next signal evaluation).
- **Last N signal evaluations** — for the last decisions: input features, model output (signal value, probability, classifier label), entry / exit / no-action decision, reason. Scrollable / searchable history.
- **Current position state** — what the strategy is holding; what it intends to do next; pending orders.
- **Risk-gate state** — daily-loss accumulator, drawdown-since-go-live, capacity utilization, distance-to-each-risk-limit.
- **Regime classifier output** — the strategy's view of the current regime; which gates are open / closed.
- **Strategy-specific custom state** — varies per strategy class. Examples: basis-arb's basis-z + auto-flatten-timer; funding-harvest's funding-z + hold-time-elapsed; vol strategy's smile-regime; deal scaffold's spread-state + days-to-close; race-strategy's pre-final-furlong-state.

**Refresh model — engineering-pragmatic:**

- **Refresh button** for on-demand snapshot. The most common interaction.
- **Auto-refresh toggle** for selected strategies (1s / 5s / 30s / 1min / off). Used during active diagnosis.
- **Schedule push** for selected strategies — the platform pushes updates only when the strategy actually changes state (entered a position, evaluated a signal, hit a gate). Lightweight, event-driven.
- **The platform does NOT stream all variables of all strategies in real time** — that would be heavy on backend and wasteful. Streaming is opt-in per strategy when the trader is actively inspecting; default is on-demand refresh.

**Per-strategy implementation:**

- The strategy declares its exposed state via a contract (a list of variables, types, descriptions). The platform renders whatever the strategy declares.
- Some strategies expose comprehensive state; some expose minimal state. **Pragmatic — engineering cost should match diagnostic value.**
- The trader is not blocked if a strategy is light on exposed state; the supervision dashboard, model registry, and execution log give independent diagnostic angles.

##### 11.6.2 Backtest-vs-live comparison

Side-by-side view comparing live behavior against backtest expectation. Critical for catching configuration drift early.

- **Top:** equity curve, live (last N days) overlaid on backtest counterfactual. Divergence flagged.
- **Per-trade comparison:** recent live trades, what backtest would have done at the same moment. Mismatches highlighted.
- **Per-feature drift:** input features the strategy saw live vs same features in backtest's training distribution.
- **Per-signal calibration:** for probabilistic-output models, was the live signal calibrated as the backtest predicted.
- **Diagnosis hints:** the platform suggests likely root causes if divergence is meaningful — feature drift, execution-quality degradation, model drift, configuration mismatch, data-pipeline issue.

**Use cases:**

- After deploying a new strategy: confirm first-weeks behavior matches the backtest.
- When a strategy enters monitor stage: was the divergence caused by the live deployment or by the regime?
- When validating a candidate retrain: how does the new model's first weeks compare to its backtest?

**Refresh model:** computed daily by default (not real-time); on-demand refresh available.

##### 11.6.3 Why this matters

- **Efficiency:** when a strategy is misbehaving, the trader can see exactly what it's "thinking" without needing to run a fresh backtest or open the code repo. Diagnostic loop closes in minutes rather than hours.
- **Risk:** silent configuration drift between backtest and live is a major failure mode. The comparison surface catches it before scaled capital makes the mistake expensive.
- **PnL:** strategies that match backtest expectation can be scaled with confidence. Strategies whose live diverges from backtest are caught early and either fixed or capped.
- **Engineering verification (side benefit):** if the trader can see the right state for a strategy, the data plumbing, model registration, strategy composition, execution layer, and reporting layer are all working end-to-end. The diagnostic surface doubles as platform validation.

#### 11.7 Why this matters (recurring frame)

Efficiency / risk / PnL.

### Design principles

- **Anomaly-driven attention.** Default green; the trader is summoned when something is off.
- **Drill from rollup to evidence.** Every aggregated number drills to the underlying strategies / fills / decisions.
- **Strategy state is inspectable on demand, not streamed.** Engineering pragmatism is mandatory.
- **Backtest-vs-live divergence is foveal during diagnosis.** Catches configuration drift early.
- **Cross-strategy correlation is monitored continuously.** Drift erodes diversification silently.

### Archetype variations

The fleet dashboard is universal; the **archetype-specific live state (11.5)** is the largest variation surface — see the bullet list above.

Other variations:

- **Mira** — fleet supervision is engine-state-supervision; queue position, latency, adverse-selection scores per quote engine.
- **Sasha** — aggregate greek panel as automated-mode equivalent of the IV surface.
- **Naomi** — deal pipeline is the foveal surface; per-deal status drives most attention.
- **Diego** — video as a foveal element; multi-event grid with video health badges.
- **Aria** — resolution-source live monitor (BLS / Fed / oracle / committee feeds) is foveal during resolution windows.
- **Quinn, David** — cross-fleet aggregation; firm-wide rollup.
- **Elena** — does not interact with fleet supervision.

### Used by

13 trader archetypes + Quinn + David. **14 of 15.** Elena does not.

---

## 12. The Intervention Console

### What it is

When the trader decides to act, the intervention console is the surface. Distinct from automatic actions (kill-on-breach, auto-hedge, auto-rebalance) — this is the **trader's** interventions. **Crucially, it includes the full manual trading capability preserved from manual mode** — the trader must retain the ability to place, adjust, and close trades manually for emergency / reconciliation / override scenarios.

### Why it matters

- **Efficiency:** intervention scoping (per-strategy / class / venue / fleet) lets the trader respond proportionately to incidents.
- **Risk:** every intervention is auditable. Catastrophe response is designed; the platform has practiced it.
- **PnL:** the cost of over-intervention is missed PnL. The cost of under-intervention is realized loss. Granular controls plus disciplined auditing balance both. **Manual trading capability prevents the platform from being a cage during emergencies.**

### Standard shape — six sub-surfaces

#### 12.1 Per-Strategy Controls

For any strategy, controls the trader can apply:

- **Start / pause / stop** — with confirmation + audit trail.
- **Cap change** — increase / decrease capital cap.
- **Risk-limit change** — daily loss limit, drawdown limit, position-size limit. Audited.
- **Symbol / instrument / contract whitelist / blacklist** — temporarily exclude.
- **Schedule modification** — pause active hours, add a blackout window.
- **Mode change** — live / paper / shadow. Shadow mode runs the code without sending orders.
- **Force-flatten** — close all positions on this strategy now. Reason field mandatory.
- **Demote to monitor** — move to monitor stage with reason.

Every intervention logged: timestamp, actor, action, reason, pre-state, post-state.

#### 12.2 Group Controls

- **Pause all in strategy class.**
- **Pause all on venue.**
- **Pause all in lifecycle stage.**
- **Cap all by tag.**

Each group action audited; group flatten requires explicit confirmation.

#### 12.3 Manual Trading & Reconciliation (mandatory)

**Even in fully automated mode, the trader must retain the ability to place, adjust, and close trades manually from the UI.** This is non-negotiable. Three primary scenarios:

**1. Emergency intervention.** A strategy is misbehaving; the auto-flatten failed; an exchange is degraded and the algo cannot reach it via API; an oracle deviation requires immediate position closure not pre-coded; a venue announces a sudden delisting that the algos haven't been retrained for. The trader needs to flatten or adjust positions by hand right now. Hesitation costs PnL.

**2. Reconciliation between algo state and venue state.** The platform's view of what's open and the venue's view should always match — but in practice they occasionally diverge (a fill the strategy didn't register; a cancel the strategy thinks succeeded but didn't; a venue that briefly reported a wrong balance and corrected). The trader needs to manually align the two.

**3. Discretionary override on top of the automated book.** A high-conviction macro view (FOMC outcome surprise, ETF announcement, earnings surprise, deal close, late-cycle election shock) where the trader wants to layer a directional position on top of what the strategies are doing — explicitly tagged as such.

The platform supports all three with **full manual-trading capability identical to the manual mode**. The trader retains every surface from their manual workflow: multi-leg ticket, ladder click-to-trade, hotkeys, smart router, pre-trade preview, working orders blotter, multi-venue depth view. The manual surfaces don't disappear in automated mode; they are present and reachable but not the primary surface most of the day.

##### 12.3.1 The Full Manual Order Ticket

The complete order entry ticket from manual mode (see [#2 Order Entry Ticket Framework](common-tools.md#2-order-entry-ticket-framework) and per-archetype manual sections).

- **All order types available:** market, limit, stop, stop-limit, OCO, bracket, trailing, peg-to-mid, post-only, reduce-only, IOC, FOK, GTC, GTD, fill-at-fixing (FX).
- **Multi-leg native** — atomic spot+perp basis pairs (Marcus), calendar spreads (Theo), hedged structures (Sasha), back/lay pairs (Diego), pair trades (Henry, Naomi), curve trades (Ingrid), cross/synthetic FX (Yuki), basket (Aria, Henry).
- **Hotkeys preserved** — every manual-mode hotkey remains bound. Speed matters during emergencies.
- **Pre-trade preview** — margin, position impact (in trader-native units **and as delta on the entire book including the automated fleet**), liquidation price, fee estimate, slippage estimate.
- **Smart order router** — aggregated venue depth, best-price routing.
- **Multi-venue ladder** — same Betfair-style aggregated ladder used in manual.
- **Compliance / pre-trade gates** — restricted-list checks, position-limit checks, sanctions, jurisdictional access.

Practically: the manual terminal is a tab in the supervisor console, not a separate application. The trader presses a hotkey or clicks an icon → manual ticket comes up over the current view → places the trade → ticket closes back to the supervisor view.

##### 12.3.2 Trade Tagging & Attribution

Every manually-placed trade gets a mandatory tag:

- **Emergency intervention** — flagged for post-incident review; auto-included in the day's incident log.
- **Reconciliation** — paired with the algo state being reconciled.
- **Manual override** — explicit directional override; tagged with the macro thesis or reason.

Attribution carries the tag through P/L, performance metrics, reports. David's behavioral monitoring tracks the frequency of each tag class — sustained increase in emergency interventions or overrides is a leading indicator David investigates.

##### 12.3.3 Reconciliation Workflow

A specific surface for the reconciliation case, the most error-prone of the three.

- **Left panel:** the platform's view — every position the strategies _think_ they have, per venue, per instrument / contract / event.
- **Right panel:** the venue's view — every position the venue _actually_ shows.
- **Diff highlighted** — rows where the two disagree. Discrepancy size in $ and as % of position.
- **Per-row actions:**
  - **"Trust venue"** — platform updates internal state; strategy state corrected; audit logged.
  - **"Trust platform"** — manual reconciliation order placed at the venue; audit logged.
  - **"Investigate"** — opens a diagnostic with relevant fills, cancels, modifies that should explain the divergence.
- **Bulk actions** for known-source-of-divergence resolutions.
- **Auto-trigger:** the platform runs continuous reconciliation in the background; minor discrepancies that resolve within seconds (e.g. fill-acknowledgment latency) do not surface; threshold breaches escalate to alerts.

##### 12.3.4 Emergency Mode

A specific UI mode the trader can switch into during a crisis (see [#14 Supervisor Console layout]).

- **Manual ticket pinned** — large, foveal.
- **Multi-venue aggregated ladder** for the focus instrument — foveal.
- **Live position state across all venues** — second-largest panel.
- **Working orders across all venues.**
- **Strategy intervention console** — pause / kill controls visible.
- **Alert console** — relevant alerts streaming.
- **Latency / connectivity panel** — venue-by-venue connection state, foveal because in an emergency, one venue being slow or unreachable changes the play.

Hotkeys preserved. Switching into emergency mode is a single keystroke; switching back is one keystroke; work-in-flight preserved.

##### 12.3.5 Manual Trading Hotkeys (Always Available)

Even in default research mode, certain manual-trading hotkeys are global:

- **Open manual ticket** for currently-focused instrument.
- **Flatten focused instrument** across all venues (combined position).
- **Cancel-all-on-focused-instrument.**
- **Hedge-to-flat focused instrument** (auto-pair against optimal hedge venue).
- **Switch to emergency mode** (keystroke chord; less easily triggered to avoid accidents).

These remain bound regardless of which mode the supervisor console is in.

##### 12.3.6 Audit & Friction

Manual trading is auditable but not friction-free for non-emergency cases:

- **Emergency interventions** — minimal friction. One confirmation, audit logged.
- **Reconciliation** — friction matched to size; small reconciliations one-click; large ones require reason field.
- **Manual override (directional)** — full friction: reason field, confirmation gate, override tag mandatory.

Every manual trade enters the same audit trail as algo trades, with the manual flag and tag class. Searchable, reviewable, exportable for risk-committee or regulator review.

##### 12.3.7 Why this matters

- **Efficiency:** in an emergency, seconds to a working manual ticket = real PnL preservation.
- **Risk:** reconciliation is a real operational risk. Without a designed reconciliation workflow, positions get lost or mis-tracked.
- **PnL:** the ability to layer a high-conviction discretionary trade on top of the automated book lets the trader capture macro-event alpha that pure systematic strategies miss.
- **Platform validation:** if the trader can place every trade their strategies make from the manual UI, the platform's execution layer is verified end-to-end. Cleanest integration test of the entire trading stack.

#### 12.4 Kill Switches at Multiple Scopes

Layered kill switches:

- **Per-strategy kill** — cancel all working orders + flatten positions on this strategy.
- **Per-strategy-class kill** — flatten an entire class.
- **Per-venue kill** — pull all firm activity from this venue.
- **Per-domain kill** (Julius — CeFi side or DeFi side separately, with stage-aware on-chain unwinding).
- **Fleet-wide kill** — the trader's entire automated cousin.
- **Firm-wide kill** — David + CIO + risk-officer multi-key authentication for catastrophic events.

Each scope's kill is a designed action: cancel-or-flatten configurable, audit-trail mandatory, reversal procedure documented.

#### 12.5 The Intervention Audit Log

Append-only log of every intervention. Searchable, filterable, exportable.

Per-row: timestamp, scope, actor, action, reason, pre-state, post-state, downstream effect (positions closed, P/L impact, working orders canceled).

Used in post-incident review (David's firm-wide replay), regulator request, behavioral self-review.

#### 12.6 Why this matters (recurring frame)

Efficiency / risk / PnL.

### Design principles

- **Manual trading capability preserved end-to-end.** The trader never loses access to the surfaces they had manually.
- **Every intervention logged.** Timestamp, actor, action, reason, pre-state, post-state.
- **Friction matched to consequence.** Emergency = minimal; override = full.
- **Kill switches granular.** Strategy / class / venue / domain / fleet / firm — each scope is its own action.
- **Reconciliation is a designed workflow.** Not "open the algo logs and figure it out."
- **Tagging is mandatory.** Manual trades carry an emergency / reconciliation / override tag; attribution flows through.

### Archetype variations

- **Marcus, Julius** — emergency mode is foveal during crypto incidents (exchange security incidents, depegs, oracle failures). Multi-stage kill (Julius adds Stage 1 CeFi flatten → Stage 2 on-chain unwind → Stage 3 bridge to safety).
- **Mira** — manual trading is **emergency-only**; her engine is the default. Foot pedal preserved. Multi-key auth on catastrophe-flatten.
- **Sasha** — manual ticket is the full vol-quoted multi-leg ticket; emergency hedger override.
- **Henry** — manual ticket includes single-name / pair / basket / event tickets; reconciliation across systematic and discretionary books.
- **Ingrid** — manual ticket includes curve / butterfly / basis / swap; per-auction manual-override toggle.
- **Yuki** — manual ticket includes spot / forward / FX swap / NDF / cross-synthetic / FX options / fixing / RFQ-block; FX-specific reconciliation cases (forward / NDF settlement, fixing fills, onshore-offshore, synthetic legs).
- **Theo** — manual ticket preserves calendar / location / crack tickets.
- **Naomi** — **manual override is more frequent for Naomi by design** — her edge is judgment-heavy, so the override path is well-traveled. Manual ticket preserves single-name / pair / capital-structure / hedge / tender / distressed-claim tickets.
- **Diego** — manual ticket preserves ladder + green-up + cross-book + multi-bet builder; emergency mode includes video.
- **Aria** — manual ticket for ambiguous-resolution events; cross-venue arb manual-override.
- **Quinn** — manual override capability for emergency directional bets in cross-archetype meta-strategies.
- **David** — manual override capability for firm-systematic emergency directional bets; his interventions include pulling traders / archetype-fleet kills / firm-wide kill.
- **Elena** — does not have manual trading; her analog is **redemption / capital withdrawal** — slower, gated, but the equivalent "exit" mechanism.

### Used by

13 trader archetypes + Quinn + David. **14 of 15.** Elena's analog is redemption.

---

## 13. Post-Trade & Decay Tracking

### What it is

The feedback loop from yesterday's results into tomorrow's research. Every strategy is evaluated daily / weekly / monthly: did it perform as expected, is it decaying, does it need retraining, is it ready to retire? Decay tracking is what separates a firm that maintains alpha from one that discovers it once and watches it fade.

### Why it matters

- **Efficiency:** retrospectives are auto-generated. The trader reads, doesn't compose.
- **Risk:** decaying strategies are caught by the metric, not by the trader's anecdotal sense. Faster intervention = less decay-damage.
- **PnL:** retraining cadence is data-driven. Capital trapped in dying strategies is recycled into research priorities. The Learn → Decide loop closes.

### Standard shape — five sub-surfaces

#### 13.1 Per-Strategy Retrospectives

Auto-generated per strategy on a configurable cadence (typically weekly + monthly).

- **Header** — strategy name, period covered, current stage.
- **Performance vs expectation** — realized primary metric in the period vs research-time expected distribution. Where today's value falls in the distribution.
- **Equity curve overlay** — realized vs backtest counterfactual.
- **Drawdown decomposition** — per-drawdown: which trades contributed, what features / regime / executions drove it.
- **Regime fit** — % of period in each regime; per-regime performance.
- **Capacity realized vs assumed** — slippage, fill rate, partial fills.
- **Recent interventions and effect** — what was paused, capped, retrained; observed PnL impact.
- **Drift state** — feature, prediction, performance drift snapshot.
- **Recommended action** — continue / retrain / cap / monitor / retire — with rationale.

#### 13.2 Fleet-Level Review

Auto-generated weekly + monthly.

- **Total PnL decomposition** — by strategy class, by venue, by underlying / contract / event, by regime, by time-of-day / session.
- **Risk-adjusted contribution** — per strategy: Sharpe contribution to fleet, marginal Sharpe (if removed, what would fleet Sharpe be).
- **Marginal contribution analysis** — diminishing-returns curves per strategy.
- **Correlation evolution** — strategies drifting toward correlation flagged.
- **Capacity utilization across the fleet** — where there's headroom, where strategies are at cap.

#### 13.3 The Decay Metrics Surface

A dedicated dashboard for catching decay early.

- **Sharpe-over-time per strategy** (or primary metric per archetype) — rolling with confidence bands. Statistical-significance flag on declining trend.
- **Half-life estimates** — how long does this alpha persist before halving. Strategies in the bottom quartile (fastest decay) flagged.
- **Feature-importance drift** — features whose importance is shifting per model.
- **Backtest vs live divergence** — point estimate + distribution. Strategies tracking expectation: green. Underperforming: investigated. Overperforming: also investigated (look-ahead leak suspected).

Decisions: queue retrain, cap, demote to monitor, retire.

#### 13.4 The Retrain Queue UI

When the platform proposes retraining (drift triggered, schedule triggered, performance triggered), the proposal queues here.

- **Queue table** — strategy, model version, retrain reason, proposed training data window, estimated compute cost, estimated improvement.
- **Per-row actions** — approve, defer, customize, reject.
- **Auto-approval thresholds** — strategies in monitor / pilot can have auto-approve enabled for routine retrains; live strategies require explicit approval.
- **Retrain history** — past retrains and their outcomes.

#### 13.5 Retire Decisions & Why this matters

Retirement is a decision — the platform proposes, the trader approves.

The proposal lists: decay confirmed (statistical evidence linked); better strategy in the same niche (replacement candidate); recalibration / retraining exhausted; capital freed by retirement.

Approval workflow: trader reviews → approves / rejects / modifies (e.g. "retire BTC instance but keep ETH instance").

Closing efficiency / risk / PnL frame.

### Design principles

- **Retrospectives auto-generated, not composed.** Friction kills the loop.
- **Decay caught by metrics, not gut.**
- **Retrain triggers are data-driven** — feature drift, prediction drift, performance underperforming N σ vs expectation, scheduled cadence, new feature added.
- **Retire is a decision.** Platform proposes; trader approves.

### Archetype variations

- **Mira** — decay applies to parameter profiles, adverse-selection model accuracy, venue-relationship validity.
- **Naomi, Rafael** — decay applies to monitoring-system performance (was the deal-screening model still calibrated? was the theme-relationship still valid?).
- **Diego** — decay applies seasonally; pre-event models decay between match-day cycles; retrain windows align with off-season.
- **Theo** — decay seasonal; winter-natgas strategies retrain in fall.
- **Aria** — cycle-aware decay (election-cycle generalization).
- **David** — section transforms to firm-level: cross-trader attribution, cross-archetype decay, capital-efficiency review. Auto-prepared committee deck.
- **Elena** — does not interact with decay tracking; receives quarterly performance / risk / fee report.

### Used by

13 trader archetypes + Quinn + David. **14 of 15.** Elena receives quarterly summary.

---

## 14. The Supervisor Console

### What it is

The supervisor console is the **integration of all surfaces above into one workspace**. It is not a single new surface; it is the layout / mode-switching / spatial organization of everything described in sections 3–13.

### Why it matters

The supervisor console answers: when the trader sits down at their desk in the morning, what do they see?

- **Efficiency:** time-on-research is the trader-quant's primary leverage. The console design ensures research is foveal-by-default, supervision is peripheral-by-default. The inverse of the manual terminal.
- **Risk:** mode-switching to event mode in seconds during a crisis is the difference between contained damage and runaway loss.
- **PnL:** the cognitive shift from foveal-position to peripheral-fleet is what makes hundreds of strategies tractable.

### Standard shape — three sub-surfaces

#### 14.1 Multi-Monitor Layout

A typical layout (the trader customizes — see [#30 Customizable Layout](common-tools.md#30-customizable-layout--workspace)):

| Zone           | Default surface                                           |
| -------------- | --------------------------------------------------------- |
| Top-left       | Fleet supervision dashboard (default amber + red filter)  |
| Top-center     | Research workspace (notebook environment)                 |
| Top-right      | Anomaly / alerts console + decay surface                  |
| Middle-left    | Strategy detail page (drill-down when investigating)      |
| Middle-center  | Capital allocation engine + archetype-specific live state |
| Middle-right   | Promotion gate queue + experiment tracker                 |
| Bottom-left    | Macro / regime context (archetype-specific)               |
| Bottom-right   | News / research feed + comms (chat, desk, sell-side)      |
| Tablet / phone | Mobile alerts + chat                                      |

The supervisor console's center of gravity is **research workspace + fleet supervision**. The manual terminal's center of gravity (chart + ticket + position blotter) is now in the bottom corners as background — not foveal — except in **emergency mode** (see 14.2).

#### 14.2 Mode-Switching

The console supports modes; switching reconfigures the layout:

- **Research mode (default during quiet hours):** notebook environment in foveal positions; supervisor + alerts in periphery.
- **Supervision mode (alert-driven):** fleet dashboard + strategy detail in foveal positions; research workspace minimized.
- **Event mode** (FOMC, ETF announcement, exchange exploit, deal close, election night, expiry day): anomaly console + intervention console + archetype-specific live state foveal; research minimized; charts of high-vol instruments visible.
- **Pre-market mode:** fleet review + alerts + macro context dominant.
- **Post-market mode:** decay + retrospectives + capital allocation + experiment-priority-queue dominant.
- **Emergency mode:** manual ticket + multi-venue ladder + working orders + intervention console foveal. Switching is one keystroke.
- **Archetype-specific modes** layer on top:
  - Mira — session-rotation mode.
  - Sasha — expiry mode, pre-event mode.
  - Henry — earnings-season mode.
  - Theo — inventory-day mode (Wednesday EIA / Thursday DOE).
  - Naomi — vote-day, hearing-day, regulatory-decision-day modes.
  - Yuki — fixing-mode, EM-mode.
  - Ingrid — auction-mode, quarter-end-mode.
  - Diego — pre-event / in-play / festival-mode.
  - Aria — resolution-window-mode, election-night-mode, data-release-mode.
  - David — committee-prep mode, allocation-review mode, incident mode.

Switching is one keystroke. Work-in-flight (open notebooks, pending interventions) preserved.

#### 14.3 Anomaly-Driven Default State

Critical: the console is **green-by-default**. Most of the day, the trader is heads-down in research; the supervisor surface is quiet. When something goes off, alerts route via:

- Banner on screen (auditable).
- Audio (configurable per severity).
- Mobile push (when away from desk).
- Phone page (for catastrophe-tier alerts only).

The trader trusts the platform's silence. False-positive alerts erode this trust quickly; the platform's tuning of severity / thresholds / suppression is critical to productivity.

### Design principles

- **Research foveal by default.** Supervision peripheral by default. Inverse of the manual terminal.
- **Mode-switching one keystroke.** Work-in-flight preserved across mode swaps.
- **Green-by-default.** The trader trusts the platform's silence.
- **Spatial memory respected.** The trader knows where everything is; the platform doesn't auto-rearrange.

### Archetype variations

The console pattern is universal; per-archetype layouts and modes differ:

- **Mira** — supervisor console is engine-state-supervision-heavy; queue position, latency, adverse-selection scores in foveal positions. Foot pedal preserved at desk.
- **Diego** — video as a foveal element in the supervisor console; multi-event grid with video health badges.
- **Naomi** — deal pipeline as the most-glanced foveal surface; document library accessible by single click.
- **Aria** — per-domain research workspaces (politics / econ / geopolitics / tech / weather); resolution-source live monitor foveal during resolution windows.
- **David** — 4-monitor desk + private office display for client / risk-committee meetings. Different cognitive shape.
- **Elena** — multi-modal device adaptation (desktop / tablet / mobile). 90-second-glance landing page is the foveal surface.

### Used by

13 trader archetypes + Quinn + David + Elena (in modified form). **15 of 15.**

---

## 15. Daily Rhythm — The Workflow Framework

### What it is

The shape of pre-market / in-market / post-market workflow in automated mode. Not a UI surface in the strict sense, but a **workflow framework** that shapes what the trader does at each point in their day, and which UI surfaces are foveal at each point.

### Why it matters

The cognitive shift from manual to automated is most visible in the daily rhythm. Manual rhythm was foveal-on-position throughout the trading hours; automated rhythm is foveal-on-research with anomaly-driven supervision. The platform must support this shift explicitly via mode-switching, not just by document.

### Standard shape — the universal framework

#### 15.1 Pre-Market (60–90 minutes)

The day starts with **fleet triage and research-priority setting**, not with watching a chart.

- **Fleet review (15–25 min)** — glance at supervisor console; drill into amber / red strategies; read overnight session attribution; read alerts queue from overnight.
- **Research catch-up (15–25 min)** — skim experiment-tracker results from overnight runs; promote winners; archive losers with notes.
- **Macro / regime read (15–20 min)** — read morning notes; identify regime-shift signals; assess fragility of strategies to today's regime.
- **Promotion-gate decisions (10–15 min)** — strategies waiting for promotion sign-off; coordinate with David on material promotions.
- **Coffee / clear head** — preserve focus for research-heavy hours.

#### 15.2 In-Market (continuous, anomaly-driven)

- **Default state:** trader is in the research workspace. Notebooks open. Working on new strategy idea, feature engineering, model retraining for drifting strategy, hyperparameter sweep, diagnosing yesterday's underperformer.
- **Background:** supervisor console open in another monitor; default green.
- **Alert response (5–10% of the day):** when an alert fires, drill into strategy detail page, diagnose, intervene if needed.
- **Liquid-event override (rare):** large macro release, surprise headline, exchange exploit, deal close, election night. Switch to event mode.
- **Mid-day capital allocation review:** glance at allocation engine; approve or defer rebalance.
- **Cross-trader coordination:** brief desk-chat exchanges with adjacent archetypes.

**Time mix (typical, varies per archetype):** 60–70% research, 10–15% supervision, 5–10% intervention, 5–10% data / procurement / capital allocation, the rest cross-trader / admin.

#### 15.3 Post-Market (60–90 minutes)

- **End-of-day attribution (15–20 min)** — today's PnL decomposition; identify outliers; verify all positions are flat or as-intended.
- **Decay check (10–15 min)** — strategies whose Sharpe trend is concerning; queue retrain jobs.
- **Capital allocation (10–15 min)** — review nightly allocation proposal; approve / modify / escalate.
- **Research-priority setting (15–25 min)** — based on the day's findings; queue overnight backtests / training runs; update experiment-tracker priorities.
- **Promotion-gate triage** — strategies ready for promotion review tomorrow.
- **Sign-off** — confirm all alerts acknowledged; confirm fleet in expected state; hand-off to next-shift supervisor (or rely on automated supervision).

#### 15.4 Cadence Variations (Per-Archetype)

The framework is universal; the cadence and event-driver vary:

- **Crypto traders (Marcus, Julius)** — 24/7 nuance; shift handoffs across regions.
- **Sports (Diego)** — match-day-driven; off-day cadence is research-heavy; festival mode (Cheltenham, World Cup) drives concentrated supervision windows.
- **Event-driven (Naomi)** — vote / hearing / regulatory-deadline-driven.
- **Macro (Rafael)** — central-bank / data-release-driven.
- **Equity (Henry)** — earnings-season + market-hours-bounded.
- **Mira** — session-driven (Asia / EU / US handoffs).
- **Theo** — Wednesday EIA / Thursday DOE / monthly OPEC structures the week.
- **Ingrid, Yuki** — central-bank-day, auction-day, fixing-day driven.
- **Aria** — resolution-window-driven; election cycles dominate.
- **David** — committee-cycle driven (daily / weekly / monthly / quarterly cadence).
- **Elena** — light cadence; once-a-day glance, weekly performance, monthly / quarterly review. Unchanged from manual.

### Design principles

- **Research foveal during quiet hours.** Anomaly-driven supervision in periphery.
- **Pre-market is triage + research-priority-setting.**
- **Post-market closes the Learn → Decide loop.** Today's decay becomes tomorrow's research.
- **Mode-switching aligns to rhythm.** Pre-market mode → research mode → event mode → supervision mode → post-market mode.

### Used by

All 15 archetypes (Elena's rhythm is unchanged from manual — once-a-day glance + weekly + monthly + quarterly).

---

## 16. Differences from Manual Mode (Comparison Framework)

### What it is

A summary table comparing manual vs automated for each archetype across consistent dimensions. Not a UI surface, but a **comparison framework** that every archetype's appendix uses to make the change concrete.

### Standard dimensions

| Dimension                  | Manual                                                     | Automated                                                                     |
| -------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Coverage                   | Hand-watched — handful of instruments / contracts / events | Hundreds-to-thousands across the trader's domain                              |
| Trades per day             | High-conviction, single-digit to dozens                    | Thousands across the fleet                                                    |
| Phase 1 (Decide)           | Reading charts / news / forecasts                          | Choosing alpha to research; managing portfolio of strategies                  |
| Phase 2 (Enter)            | Click ticket                                               | Promote strategy through lifecycle gates                                      |
| Phase 3 (Hold)             | Watching positions                                         | Anomaly-driven supervision of fleet                                           |
| Phase 4 (Learn)            | Journaling lessons                                         | Decay tracking, retraining, attribution-driven research priorities            |
| Time on charts             | 80%                                                        | 5–10% (mostly diagnostic)                                                     |
| Time on research           | 5–10%                                                      | 60–70%                                                                        |
| Time on supervision        | 10–15%                                                     | 10–15%                                                                        |
| Time on intervention       | (continuous)                                               | 5–10%                                                                         |
| Time on data / procurement | minimal                                                    | 5–10%                                                                         |
| Time on capital allocation | minimal                                                    | 5–10%                                                                         |
| Latency criticality        | Visible per venue                                          | Per-strategy-class latency tiers, with budget enforcement                     |
| Risk units                 | $-notional + greeks                                        | Same + per-strategy DV01-equivalent + correlation cluster                     |
| Edge metric                | P/L, Sharpe                                                | P/L, Sharpe, decay rate, capacity utilization, marginal Sharpe                |
| Cognitive load             | Foveal-on-position                                         | Peripheral-on-fleet; foveal-on-research-or-anomaly                            |
| Failure modes              | Tilt, fatigue, missed opportunity                          | Silent overfit, decay-blindness, alert fatigue, runaway algo                  |
| Tools mastered             | Chart, ladder, ticket                                      | Notebook, feature library, model registry, lifecycle gates, allocation engine |
| Compensation driver        | Sharpe + AUM                                               | Same + research velocity + fleet capacity utilization                         |

The fundamental change line per archetype:

- **Marcus, Julius** — "becomes the principal investor in their own quant fund."
- **Mira** — "the engine and the maker did not change — the population of engines, the discipline around their parameters, and the learning loops scaled by 10×."
- **Sasha** — "moves from running structures by hand to curating a vol research program."
- **Henry** — "manages a systematic fleet across 1000+ names alongside a discretionary book on the top 10–20."
- **Ingrid, Yuki** — "supervises a curve / currency-grid fleet rather than executing trade-by-trade."
- **Theo** — "becomes the operator of a year-round seasonal portfolio rather than the watcher of a winter-natgas position."
- **Naomi, Rafael** — "automation makes them 5–10× more thorough on each deal / theme; the judgment work itself is unchanged."
- **Aria** — "covers thousands of contracts across domains rather than dozens; calibration becomes the dominant edge metric."
- **Diego** — "supervises a multi-event fleet during peak windows; pre-event modeling becomes a year-round research practice."
- **Quinn** — "becomes the firm's cross-archetype quantitative center of gravity."
- **David** — "supervises automated desks at firm scale; behavioral monitoring expands across N traders × hundreds of strategies + each trader's discretionary overlay."
- **Elena** — minimal change; receives expanded transparency disclosures into systematic governance.

### Used by

All 15.

---

## 17. Coordination with Other Roles (Shared Framework)

### What it is

How the trader's automated cousin coordinates with adjacent peers, with Quinn (cross-archetype), with David (firm-level), and with archetype-specific peers (lawyers, IR, sister desks). Not a UI surface, but a **shared framework** every appendix uses for section 17.

### Standard structure

Each appendix's section 17 includes:

- **17.1 Coordination with the adjacent peer** (per archetype: Marcus ↔ Julius; Sasha ↔ Marcus / Henry; Henry ↔ Sasha; Ingrid ↔ Yuki; Yuki ↔ Ingrid; Theo ↔ Rafael; Naomi ↔ legal / compliance; Diego ↔ Aria; Aria ↔ Diego; Rafael ↔ every macro-relevant trader).
- **17.2 Coordination with Quinn** (universal across all trader archetypes).
- **17.3 Coordination with David** (universal across all trader archetypes).
- **17.4 Archetype-specific coordinations** — e.g. internal lawyers + compliance (Naomi); sell-side strategists (Rafael); domain-expert chat (Aria); video-feed and audio-commentary providers (Diego); CCP / clearing relationships (Ingrid); LP relationships (Yuki, Mira); industry regulators (David); board / CIO / risk committee (David).
- **17.5 Why this matters** — efficiency / risk / PnL of coordination.

### Why it matters

- **Efficiency:** without coordination, the firm builds the same strategy twice across desks, doubles up on capacity, dilutes attribution. Coordination layered on visibility tools (shared correlation matrix, promotion alerts, feature library) is cheap.
- **Risk:** correlated bets across desks compound risk. Visibility prevents the firm from accidentally over-exposing.
- **PnL:** cross-desk research collaboration produces alpha that no single desk could find alone.

### Used by

All 15 (Elena's coordination is with David's office + IR; Quinn coordinates with every trader archetype; David coordinates with everyone).

---

## 18. How-to-Use Evaluation Framework

### What it is

The closing section of every archetype's appendix is a list of evaluation questions for assessing any platform implementation against the archetype's automated terminal. Not a UI surface, but a **shared framework** for review.

### Standard structure

Each appendix's section 18 groups questions by surface (data layer / feature library / research workspace / model registry & experiment tracker / strategy composition / lifecycle / capital allocation / live fleet supervision / intervention console & manual trading / post-trade & decay / supervisor console / daily rhythm / coordination / cross-cutting), each group with 5–12 evaluation questions specific to the archetype.

A closing line:

> Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.

### Why it matters

The framework is what makes the appendix actionable. Without it, the appendix is a description of what should exist; with it, it's a yardstick for evaluating any platform implementation.

### Used by

All 15.

---

## How the Common-Tools Doc Connects to the Rest

This doc — `automation-common-tools.md` — is the SSOT for the **shape** of every shared automation surface. It connects to:

- **[automation-foundation.md](automation-foundation.md)** — concepts, principles, design intent. Foundation explains _why_ the surfaces exist; this doc describes _how they work_.
- **[automation-archetype-template.md](automation-archetype-template.md)** — structural template for the per-archetype appendices. The template defines section 1–18; this doc defines what a section _is_.
- **[automation-unique-tools.md](automation-unique-tools.md)** — per-archetype surfaces that **don't generalize** to the floor. The complement to this doc.
- **Each `trader-archetype-*.md` "Automated Mode" appendix** — the per-archetype instantiation of every shared surface, plus unique surfaces, plus archetype-specific judgment / rhythm / coordination.
- **[common-tools.md](common-tools.md)** — the manual-mode equivalent. Many shared automation surfaces extend or refine manual surfaces (the manual ticket persists in 12.3; the manual chart persists in 14.1 layout; etc.).

When evaluating any platform implementation, walk this doc surface by surface and ask: do all 15 archetypes' appendices have a credible instantiation of each surface, with archetype-specific content where appropriate?

If yes — the platform has the universal scaffolding right.
If no — the gaps are where the platform's automated-mode story is incomplete.
