# Template — Per-Archetype "Automated Mode" Appendix

This file is a **structural template** for writing the "Automated Mode" appendix that gets appended to each `trader-archetype-*.md` file. It defines section structure, what each section must cover, what's archetype-agnostic vs archetype-specific, and where individual archetypes adapt or skip.

For the worked example demonstrating depth and voice, see Marcus's appendix in [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md). Marcus is **the reference for length, depth, structure, and tone** — but his content is crypto-CeFi-specific and must NOT be copy-pasted into other archetypes.

For the universal automated-trading platform concepts the appendix builds on, see [automation-foundation.md](automation-foundation.md). For the manual-trader workflow this extends, see [manual-trader-workflow.md](manual-trader-workflow.md). For the shared platform surfaces all archetypes carry, see [common-tools.md](common-tools.md).

---

## Hard Rules for Every Appendix

Read these before writing anything.

1. **No crypto-CeFi contamination.** Marcus mentions Tardis / Kaiko, funding rates, basis arb, BTC / ETH, perpetuals, Binance / Bybit / OKX. None of those belong in an equity, rates, FX, energy, sports, prediction, supervisor, or client appendix. Each archetype has its **own** data sources, features, strategy classes, venues, instruments. Use Marcus for **structure and depth**; use the archetype's manual sections for **content**.

2. **Voice and tone match Marcus.** Worked-example callouts flagged as "illustrative — actual platform will differ"; "Why this matters" closings framed as efficiency / risk / PnL; structured layout sketches; specific examples not generic platitudes.

3. **Length proportional to automation tier.** See "Per-Archetype Notes" below — Marcus is heavily automatable and gets the full ~1300-line treatment. A judgment-heavy archetype (Rafael, Naomi, Diego) gets ~700–900 lines because some sections collapse. A supervisor (David) gets a different shape entirely. A non-trader (Elena) gets a short note, not an appendix. **Don't pad to match Marcus's length if the archetype's content doesn't justify it.**

4. **Don't invent facts.** The trader's edge, mental model, instruments, venues, and judgment surfaces are described in their manual sections. Translate those into automated form; don't invent new ones.

5. **Manual trading and state-inspection sections are mandatory** (sections 11.6 and 12.3). Every trader retains manual trade execution capability for emergency / reconciliation / override; every trader gets a strategy-state-inspection surface. These are non-negotiable across the floor.

6. **Examples are illustrative.** Every list of strategy classes, features, datasets, etc. carries a flag that says these are example shapes; the actual platform's catalog will differ. Do not present example lists as definitive specifications.

7. **Cross-link, don't duplicate.** Where the foundation doc, common-tools doc, manual sections, or Marcus's appendix already cover something, link to it; don't restate. The appendix expands what's archetype-specific.

8. **"What stays human" is mandatory.** Every appendix has section 2 explicitly listing the judgment surfaces that don't (or shouldn't, today) automate. The most automatable archetypes still have meaningful human-judgment surfaces; the most judgment-heavy archetypes' "stays human" section is the longest.

---

## The 18-Section Structure

For each section: purpose, required subsections, what's archetype-specific vs archetype-agnostic, and adaptation notes per archetype tier.

### 1. What [Trader]'s Edge Becomes

**Purpose:** Translate the trader's manual edge into automated **strategy classes** (or the equivalent unit for non-strategy archetypes — see adaptation notes). List the distinct types of automated work the platform does on their behalf and how that scales (X manual instruments → Y automated coverage).

**Required content:**

- 5–15 named strategy classes (or analogues) with one-paragraph each: what the strategy does, mechanism, scale (how many instances).
- A closing paragraph on total fleet size and the cognitive shift (fewer trades-per-decision; more decisions-per-class).

**Archetype-specific:** every strategy class is unique to the archetype.
**Archetype-agnostic:** the framing "X classes × Y instances = Z fleet, scaled vs manual coverage" is universal.

**Adaptation per archetype:**

- **Heavily-automatable (Marcus, Julius, Sasha, Mira)** — full strategy-class list. Mira's "classes" are quote-engine parameter profiles, not entry/exit strategies.
- **Partially-automatable (Henry, Ingrid, Yuki, Theo, Diego)** — strategy classes for what's automatable; explicitly note what stays discretionary (top-10 high-conviction names for Henry; auction-day discretion for Ingrid; etc.).
- **Mostly-judgment (Rafael, Naomi, Aria)** — strategy classes are _support tools_ (theme-monitoring scaffolds for Rafael; deal-screening / regulatory-pattern models for Naomi; cross-venue arb / calibration models for Aria), NOT alpha generators on their own. Frame appropriately.
- **Quinn** — section adapts: she was always systematic. The "edge becomes" framing is "what scaled when" — coverage growing from N strategies to 5N+ strategies; cross-archetype factor / stat-arb / firm-systematic strategies as her unique remit.
- **David** — section adapts: he doesn't have an edge that becomes a fleet. Reframe to "What David's supervisory work becomes" — multi-fleet aggregation, cross-archetype risk decomposition, model-risk governance, kill-switch policy.
- **Elena** — see Per-Archetype Notes; appendix is a short note, this section becomes "What Elena's experience becomes" — transparency into systematic governance.

### 2. What Stays [Trader]

**Purpose:** Explicit list of judgment surfaces that don't (or shouldn't, today) automate. This is **mandatory** across all archetypes — even the most automatable retain meaningful human surfaces.

**Required content:**

- 5–10 specific judgment surfaces with one-paragraph each. Concrete and archetype-specific. Reference the trader's manual judgment from their existing sections.
- A closing on platform stance: opinionated about what to automate; humble about what cannot be.

**Length:** scales inversely with automation tier. Marcus's is moderate (~10 bullets). Naomi's / Rafael's are long because most of their core work is judgment.

### 3. The Data Layer for [Trader]

**Purpose:** What datasets the trader's automated cousin depends on, what surfaces they interact with on the data layer, what decisions they make about procurement / quality / gaps.

**Required subsections:**

- **3.1 The Data Catalog Browser** — layout sketch (left sidebar filters, main panel, right pane). Mostly archetype-agnostic; reference the foundation doc, then add archetype-specific filter taxonomy if relevant.
- **3.2 [Trader]'s Core Datasets (Illustrative)** — 8–20 named example datasets with one-line each. **Heavily archetype-specific.** Marcus's = Tardis / Kaiko / on-chain ETF flows. Henry's = Refinitiv / Compustat / earnings transcripts / expert-network notes. Naomi's = SEC EDGAR / court dockets / merger-agreement corpus. Diego's = match event tape / racing form / weather. Aria's = polling aggregators / government APIs / forecasting models. Etc.
- **3.3 Data Quality Monitoring** — mostly archetype-agnostic.
- **3.4 Lineage Navigator** — archetype-agnostic.
- **3.5 Procurement Dashboard** — archetype-agnostic; archetype-specific in _which_ feeds are renewal-sensitive for the trader.
- **3.6 Gap Analysis Surface** — archetype-agnostic shape; archetype-specific gaps.
- **3.7 Interactions [Trader] has with the data layer** — daily / weekly / monthly cadence; archetype-specific in _what_ they review.
- **3.8 Why this matters** — efficiency / risk / PnL, archetype-specific examples.

**Adaptation per archetype:**

- **Mira** — data layer is microstructure-heavy: tick-level feeds, queue-position estimators, adversarial-flow archives. Less about news / fundamentals.
- **Rafael, Naomi** — data layer is text-and-event-heavy: news, filings, court dockets, expert-network calls, satellite imagery, NLP-ready corpora.
- **Diego, Aria** — data layer is event-domain-specific: match feeds + racing form for Diego; polling aggregators + government APIs + forecasting models for Aria.
- **David** — data layer is firm-aggregate: cross-trader fleet state, cross-venue counterparty health, cross-archetype performance attribution.
- **Elena** — skip — she does not interact with the data layer.

### 4. The Feature Library for [Trader]

**Purpose:** What features the trader's domain has accumulated, how they interact with the library, and how cross-pollination works.

**Required subsections:**

- **4.1 The Feature Library Browser** — layout sketch; mostly archetype-agnostic.
- **4.2 [Trader]'s Core Features (Illustrative)** — 15–40 named example features grouped by domain. **Heavily archetype-specific.** Marcus's = funding-z, basis curvature, OI quadrant, liquidation proximity, CVD divergence. Sasha's = IV-rank, skew z-scores, vol-risk-premium, gamma walls. Henry's = earnings-surprise velocity, estimate-revision, factor exposures, insider-activity flags. Theo's = HDD/CDD deltas, inventory-vs-5y range, refinery-margin compression. Diego's = pre-event xG-derived market edges, in-running stat-vs-market gaps, lineup-impact estimates. Etc.
- **4.3 Feature Engineering Surface** — workflow + form UI; mostly archetype-agnostic.
- **4.4 The Drift Dashboard** — archetype-agnostic.
- **4.5 Cross-Pollination View** — archetype-agnostic; archetype-specific in _which other desks' features are relevant_.
- **4.6 Interactions [Trader] has with the feature library** — daily / weekly / ad-hoc; archetype-specific.
- **4.7 Why this matters.**

**Adaptation per archetype:** same data-layer logic — feature library is most central for heavily-automatable archetypes; lighter for supervisor/client.

### 5. The Research Workspace

**Purpose:** Notebook + IDE environment integrated with platform; backtest engine UI; walk-forward visualization; strategy templates; compute management; anti-pattern prevention.

**Required subsections:**

- **5.1 Notebook Environment** — mostly archetype-agnostic; light archetype-specific examples of the kinds of queries / models / experiments.
- **5.2 Backtest Engine UI** — mostly archetype-agnostic; archetype-specific in execution-model-realism (slippage curves, fees, latency, partial fills, MEV cost for DeFi, borrow cost for shorts, bet-delay for sports, etc.).
- **5.3 Walk-Forward Visualization** — archetype-agnostic.
- **5.4 Strategy Template Library** — **heavily archetype-specific.** 5–10 named templates per archetype. Marcus = basis arb, funding harvest, cross-venue lead-lag. Sasha = short-strangle-with-delta-hedge, calendar spread, gamma-scalping. Henry = pair-trade, factor-tilt, earnings-window. Theo = calendar-spread, weather-driven natgas, crack-spread mean-reversion. Diego = pre-event mean-reversion, in-play stat-driven scalp, lay-the-draw. Etc.
- **5.5 Compute Management** — archetype-agnostic.
- **5.6 Anti-Patterns the Workspace Prevents** — archetype-agnostic.
- **5.7 Interactions [Trader] has with the workspace** — pre-market / in-market / post-market; archetype-specific cadence.
- **5.8 Why this matters.**

**Adaptation per archetype:**

- **Mira** — workspace is parameter-tuning + adversarial-flow analysis, not strategy-class research. Templates are quote-engine parameter profiles.
- **Rafael, Naomi** — workspace is theme-research-heavy / deal-research-heavy; backtest engine has limited applicability for Rafael (theme outcomes don't backtest well); for Naomi, deal-history backtesting is feasible.
- **David** — workspace is firm-aggregate analytics, cross-archetype correlation analysis, stress-scenario design. Less about new alpha; more about ensemble diagnostic.
- **Elena** — skip.

### 6. The Model Registry

**Purpose:** Versioned catalog of trained models with reproducibility guarantees.

**Required subsections:** as Marcus 6.1–6.6.

**Adaptation per archetype:**

- **Mira** — "models" include quote-engine inner models (adverse-selection classifiers, queue-position estimators, lead-lag predictors). Versioning is critical because parameter changes cycle fast.
- **Rafael, Naomi** — model registry less central; their automated work is more about scaffolding / monitoring than predictive models. Section can be shorter.
- **David** — model registry is firm-aggregate: governance over which models are deployed, with what risk policy, where. Different framing.
- **Elena** — skip; if mentioned at all, in the context of model-risk transparency disclosures she may receive.

### 7. The Experiment Tracker

**Purpose:** Log of every backtest / training run, searchable, comparable, reproducible.

**Required subsections:** as Marcus 7.1–7.6.

**Adaptation per archetype:** mostly universal. Naomi / Rafael experiment tracker may include theme-evolution experiments and deal-pattern-match experiments rather than just ML-model trainings.

### 8. Strategy Composition

**Purpose:** Wrap models / rules with sizing, entry/exit, hedging, risk gating, regime conditioning, capacity, execution policy.

**Required subsections:** as Marcus 8.1–8.5.

**Adaptation per archetype:**

- **Mira** — section dramatically simplifies. Her "composition" is a parameter profile attached to a quote engine. Entry/exit/hedging logic is built into the engine; she doesn't compose new strategies often. Frame as "Parameter Profile Composition" instead of strategy composition.
- **Quinn** — section already covered in her existing sections; for the appendix, summarize how composition is the same shape across her cross-archetype factor strategies, then link to her sections.
- **Naomi, Rafael** — composition is light. Naomi's "strategies" are deal-screening models + per-deal sizing rules; Rafael's are theme-tracking dashboards + scenario engines. Less composition complexity.
- **David** — skip composition section; he doesn't compose strategies. Replace with "Risk-Limit Hierarchy Composition" — the firm-level hierarchy of caps and rules he composes.
- **Elena** — skip.

### 9. Promotion Gates & Lifecycle

**Purpose:** Research → Paper → Pilot → Live → Monitor → Retired.

**Required subsections:** as Marcus 9.1–9.5.

**Adaptation per archetype:**

- **Mira** — lifecycle applies to parameter profiles, not strategies. Faster cycles. Canary-deploy a parameter set vs the incumbent for N hours, promote / rollback.
- **Naomi, Rafael, Aria** — lifecycle is per-monitoring-system, not per-alpha-strategy. Slower cadence; less sections.
- **David** — lifecycle is firm-policy: which strategy classes are firm-approved, how new strategy classes get sanctioned, how retired classes get archived. Frame as "Strategy Class Sanctioning Lifecycle."
- **Elena** — skip.

### 10. Capital Allocation

**Purpose:** Sizing across the fleet (or equivalent unit).

**Required subsections:** as Marcus 10.1–10.6.

**Adaptation per archetype:**

- **Mira** — capital allocation is per-instrument-per-venue inventory limits + parameter-profile budget caps. Less about $-distribution; more about exposure-distribution. Sub-account routing matters.
- **Rafael** — capital allocation is per-theme + per-expression. Theme-level conviction-weighted; expression-level sizing per the conviction-and-asymmetry calculus.
- **Naomi** — capital allocation is per-deal + per-deal-type (M&A bucket vs spinoff vs SPAC). Per-deal sizing is conviction × probability-of-close × asymmetry.
- **David** — section dramatically expands: firm-level capital allocation across all archetypes is his work. Per-trader budgets, per-asset-class budgets, per-strategy-class budgets, regime-conditional caps. Different shape from Marcus.
- **Diego** — capital allocation is per-event-cluster (Saturday-3pm-EPL-window vs Wednesday-Champions-League). Time-bound sizing.
- **Elena** — skip.

### 11. Live Fleet Supervision Console

**Purpose:** The supervisor console where the trader watches their fleet, anomaly-driven, default green.

**Required subsections:**

- **11.1 The Fleet Dashboard** — layout sketch; archetype-specific columns (Marcus has funding/basis/spread per strategy; Henry has factor-exposure / catalyst-state per strategy; Theo has season-state / inventory-state; Naomi has deal-state / regulatory-state; Diego has event-state / liquidity-state).
- **11.2 The Strategy Detail Page** — drill-in view; archetype-specific content.
- **11.3 Anomaly Detection Surface** — mostly archetype-agnostic.
- **11.4 Cross-Strategy Correlation View** — archetype-agnostic shape; archetype-specific in factor-decomposition.
- **11.5 [Archetype-specific live state]** — Marcus's was Multi-Venue Capital + Balance Live State. Other archetypes substitute the equivalent: Mira's is Inventory + Hedge + Adverse Selection Live State; Henry's is Factor Exposures + Catalyst Calendar Live State; Theo's is Inventory-Release-Window Live State; Naomi's is Deal Pipeline Live State; Diego's is Active-Event Live State (with video where relevant); Aria's is Active-Resolution-Window Live State.
- **11.6 Strategy State Inspection** — **MANDATORY across all archetypes.** Internal-state view (per strategy, refresh-on-demand or event-pushed) + backtest-vs-live comparison (daily by default). Use Marcus's framing as the structural reference. Engineering-pragmatism note (don't stream all variables of all strategies in real time) is mandatory.
- **11.7 Why this matters.**

**Adaptation per archetype:**

- **David** — section transforms to "Firm-Wide Fleet Supervision" — aggregating across all traders' fleets. Different shape entirely.
- **Elena** — skip.
- **All trader archetypes (12 of 14)** — get full section 11 including 11.6.

### 12. Intervention Console

**Purpose:** Marcus's interventions, granular controls, kill switches, manual trading, audit.

**Required subsections:**

- **12.1 Per-Strategy Controls** — archetype-agnostic shape; archetype-specific actions.
- **12.2 Group Controls** — archetype-specific (per-strategy-class for Marcus; per-deal-type for Naomi; per-theme for Rafael; per-event for Diego; per-cluster for Aria).
- **12.3 Manual Trading & Reconciliation** — **MANDATORY across all trader archetypes.** Full manual ticket preserved + reconciliation workflow + emergency mode + global hotkeys + tagging-and-audit. Use Marcus's framing as the structural reference. Adapt manual-ticket capability to the archetype's instrument types (Sasha needs vol-quoted multi-leg manual ticket; Henry needs pair / basket manual ticket; Naomi needs deal-pair manual ticket; Diego needs ladder + cross-book manual ticket; etc.).
- **12.4 Kill Switches at Multiple Scopes** — archetype-agnostic shape; scope hierarchy adapts per archetype.
- **12.5 Intervention Audit Log** — archetype-agnostic.
- **12.6 Why this matters.**

**Adaptation per archetype:**

- **David** — section adapts to firm-level interventions: pull a trader's risk; firm-wide kill switches; multi-key authorization; behavioral-intervention escalation. Manual trading section may not apply directly (he rarely trades) — but the override capability for emergency directional bets remains.
- **Elena** — skip; her "interventions" are subscription / redemption / escalation requests, covered in her existing manual sections.
- **Quinn** — Quinn's existing sections cover most of this; the appendix can summarize and reference.

### 13. Post-Trade & Decay Tracking

**Purpose:** Per-strategy retrospectives, fleet-level review, decay metrics, retrain queue, retire decisions.

**Required subsections:** as Marcus 13.1–13.6.

**Adaptation per archetype:**

- **Naomi, Rafael** — "decay" applies to monitoring-system performance (was the deal-screening model still calibrated? was the theme-relationship still valid?). Different framing.
- **Mira** — "decay" applies to parameter-profile performance, adverse-selection-model accuracy, venue-relationship validity.
- **Diego** — "decay" applies seasonally; pre-event models decay between match-day cycles; retrain windows align with off-season.
- **David** — section transforms to "Firm-Level Post-Trade & Decay" — cross-trader attribution, cross-archetype decay, capital-efficiency review.
- **Elena** — skip.

### 14. The Supervisor Console — [Trader]'s Daily UI

**Purpose:** Monitor layout sketch, mode-switching, anomaly-driven default state.

**Required subsections:** as Marcus 14.1–14.4.

**Adaptation per archetype:**

- **Layout sketches** are archetype-specific. Match the archetype's manual physical-setup table (their existing sections). The automated console will have _some_ of those manual surfaces still present (now in periphery) plus new automation surfaces (research workspace, fleet dashboard, allocation engine, etc.).
- **Mode-switching** modes are archetype-specific. Marcus has research / supervision / event / pre-market / post-market. Sasha may have research / supervision / expiry / pre-event. Naomi may have research / supervision / vote-day / hearing-day / quiet. Diego may have pre-event / in-play / post-event / off-day. Etc.
- **Elena** — skip.

### 15. [Trader]'s Automated-Mode Daily Rhythm

**Purpose:** Pre-market / in-market / post-market workflow, with archetype-specific cadence.

**Required subsections:** as Marcus 15.1–15.4.

**Adaptation per archetype:**

- **Crypto traders (Marcus, Julius)** — 24/7 nuance.
- **Sports (Diego)** — match-day-driven; off-day cadence is research-heavy.
- **Event-driven (Naomi)** — vote / hearing / regulatory-deadline-driven.
- **Macro (Rafael)** — central-bank / data-release-driven.
- **Equity (Henry)** — earnings-season-driven + market-hours-bounded.
- **Mira** — session-driven; Asia / EU / US session handoffs.
- **David** — committee-cycle driven (daily review, weekly committee-prep, monthly committee, quarterly board).
- **Elena** — light section (occasional log-in cadence, monthly review, quarterly meeting).

### 16. Differences from Manual Mode

**Purpose:** A summary table comparing manual vs automated for this archetype across consistent dimensions.

**Required content:** A table with the same dimensions Marcus uses (Coverage, Trades per day, Phase 1, Phase 2, Phase 3, Phase 4, Time on charts, Time on research, Time on supervision, Time on intervention, Latency criticality, Risk units, Edge metric, Cognitive load, Failure modes, Tools mastered, Compensation driver). Adapt rows that don't apply (e.g. Mira doesn't trade discretionarily; her "trades per day" was already millions). Add archetype-specific rows where relevant.

A closing one-line statement on the fundamental change.

### 17. Coordination with Other Roles

**Purpose:** How this trader's automated cousin coordinates with adjacent peers, with Quinn (cross-archetype), with David (firm-level), and any archetype-specific peer.

**Required subsections (parameterized per archetype):**

- **17.1 Coordination with [Adjacent Peer]** — archetype-specific. Marcus = Julius. Sasha = Marcus + Henry. Henry = Sasha. Ingrid = Yuki. Yuki = Ingrid. Theo = (no immediate trader peer; coordinates with macro). Naomi = (legal team, compliance). Diego = Aria (sister archetype on event-markets desk). Aria = Diego. Rafael = Henry / Ingrid / Yuki / Theo (he expresses themes through their domains).
- **17.2 Coordination with Quinn** — universal across all trader archetypes (cross-archetype factor / stat-arb overlap; correlation matrix; shared feature library; promotion-gate awareness).
- **17.3 Coordination with David** — universal across all trader archetypes (firm-level supervision; behavioral monitoring; capital allocation; promotion sign-off; catastrophe response).
- **17.4 [Archetype-specific coordinations]** — e.g. Julius coordinates with Marcus (cross-domain); Naomi coordinates with internal / external lawyers + compliance; Rafael coordinates with sell-side strategists; Diego coordinates with Aria's prediction-market sister-desk on overlapping markets. Each archetype's coordination diagram is their own.
- **17.5 Why this matters** — efficiency / risk / PnL of coordination.

**Adaptation per archetype:**

- **Quinn** — coordinates with _every_ trader archetype; she's the cross-archetype overseer. Section 17 expands.
- **David** — coordinates with every trader archetype + external (compliance, regulators, board, clients). Section is firm-level shape.
- **Elena** — coordinates with David + IR + her own CIO / board. Different shape.

### 18. How to Use This Appendix

**Purpose:** Evaluation questions for assessing any platform implementation against this archetype's automated terminal.

**Required content:** Question lists grouped by surface (Data layer, Feature library, Research workspace, Model registry & experiment tracker, Strategy composition, Lifecycle, Capital allocation, Live fleet supervision, Intervention console & manual trading, Post-trade & decay, Supervisor console, Daily rhythm, Coordination, Cross-cutting). 5–12 questions per surface. Use Marcus's section 18 as the structural reference; **adapt the questions to the archetype's specific requirements**.

A closing line on "gaps may be deliberate scope decisions but should be known."

---

## Per-Archetype Notes

Specific guidance per archetype to supplement the structural template above.

### Marcus Vance (Senior CeFi Crypto Portfolio Trader)

**Already written.** [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md). Use as the worked example.

### Julius Joseph (Senior CeFi + DeFi Hybrid Strategies Trader)

- **Tier:** heavily-automatable. Full ~1300-line treatment.
- **Edge becomes:** cross-domain basis arb (CeFi-DeFi spread), MEV-aware execution, on-chain LP-with-hedge, points-farming-with-hedge, perp-vs-borrow-rate spread, cross-chain arb. Most of Marcus's strategy classes apply with on-chain extensions.
- **Stays Julius:** protocol-risk judgment, governance reading, exploit response, on-chain-event interpretation, smart-contract-trust calls.
- **Data layer additions:** on-chain pool history (Dune / Allium), bridge-flow archives, MEV-Share archive, governance-event archive, oracle-deviation history.
- **Distinct surfaces to call out:** on-chain wallet management (multiple wallets, gas strategy, slippage tolerance, approval management, simulation pre-send, bridge state); cross-domain strategy composition (CeFi leg + on-chain leg, atomicity policy); multi-stage kill switch (CeFi instant → on-chain unwind → bridge to safety); synchronized CeFi+DeFi replay.
- **Coordination peer:** Marcus (cross-domain CeFi).

### Quinn Park (Quant Overseer)

- **Tier:** already systematic; the appendix is more of a refinement than a rewrite.
- **Approach:** ~600 lines. Don't duplicate her existing sections (which already cover lifecycle, fleet supervision, etc.). The appendix focuses on _what's different in the new world_ — the cross-archetype meta-overseer role; supervising the automated cousins of Marcus / Henry / etc.; running cross-archetype factor / stat-arb / market-neutral firm-systematic strategies; coordinating with each archetype's own automated cousin to avoid double-up.
- **Edge becomes:** cross-archetype factor strategies, stat-arb across asset classes, market-neutral firm-systematic strategies, meta-strategies that allocate across archetypes' fleets.
- **Stays Quinn:** judgment on cross-archetype correlation drift, strategy-class sanctioning, capacity-allocation strategic moves at firm level.
- **Coordination peers:** every trader archetype.

### Mira Tanaka (Senior Market Maker)

- **Tier:** already mostly automated; appendix focuses on **scale-up** and **continuous improvement**.
- **Approach:** ~900 lines.
- **Edge becomes:** 50 quote engines × 20 instruments × 4 venues vs 5 today; systematic improvement loops (parameter optimization, adverse-selection model retraining, venue-toxicity learning).
- **Sections that adapt:**
  - Section 1 — "edge becomes" framing is "what scaled when"; coverage growing.
  - Section 8 (Strategy Composition) — collapses to "Parameter Profile Composition."
  - Section 9 (Lifecycle) — applies to parameter profiles, not strategies. Faster cycles; canary deploy at parameter level.
  - Section 11.5 — substitute "Inventory + Hedge + Adverse Selection Live State."
- **Stays Mira:** parameter-tweak judgment, regime-shift recognition (faster than her drift detector), counterparty-toxicity reading, market-microstructure regime calls.
- **Coordination peers:** liquidity-providing peers; Marcus (some crypto-spot overlap); David.

### Sasha Volkov (Senior Options & Volatility Trader)

- **Tier:** heavily-automatable. ~1100-line treatment.
- **Edge becomes:** vol-rich/cheap detection (per strike, per tenor, per underlying), calendar-spread arb, gamma-scalping with auto-hedging, dispersion strategies, term-structure arb, RV / IV cone-based mean-reversion, skew-rotation strategies.
- **Stays Sasha:** vol regime shift recognition, surface-anomaly interpretation, expiry-day judgment (pin risk), event-induced vol-jump positioning.
- **Distinct surfaces:** scenario PnL grid as research input; greek decomposition as primary risk axis; volatility surface integrated with strategy composition; auto-delta-hedge as a built-in component of strategy composition.
- **Coordination peers:** Marcus (cross-asset crypto vol); Henry (equity vol overlap if firm trades both).

### Henry Whitfield (Senior Equity Long/Short PM)

- **Tier:** partially-automatable. ~1000-line treatment.
- **Edge becomes:** systematic factor-tilt strategies, pair-discovery strategies, earnings-window event strategies, statistical-arb across the 1000+ name universe (vs 100 manual). **Discretionary overlay** for top-conviction names stays manual.
- **Stays Henry:** thesis on individual high-conviction names, earnings-call interpretation, fundamental research (channel checks, expert calls, supplier-chain analysis).
- **Distinct surfaces:** factor-exposure live monitoring per strategy; earnings calendar as a deployment-cadence driver; expert-network call notes as a research-input feature; the overlay between systematic fleet and discretionary book (Henry's positions are sum of both).
- **Section 1 must explicitly distinguish:** automated fleet (1000-name universe) vs discretionary book (top 10–20 names). Both run; trader manages both differently.
- **Coordination peer:** Sasha (equity-vol structures).

### Ingrid Lindqvist (Senior Rates Trader)

- **Tier:** partially-automatable. ~1000-line treatment.
- **Edge becomes:** curve-trade strategies (steepeners, flatteners), butterfly strategies, basis-trade strategies, RV models, swap-spread mean-reversion, auction-concession models, repo-special detection. **Auction-day judgment** stays human.
- **Stays Ingrid:** auction-day reads (primary-dealer concession, auction-tail interpretation), CB-meeting interpretation, geopolitical-event reaction.
- **Distinct surfaces:** curve visualization integrated with strategy composition; DV01-bucketed fleet view; auction calendar as deployment-cadence driver; cross-curve correlation monitoring.
- **Coordination peer:** Yuki (rate-FX linkages).

### Rafael Aguilar (Senior Global Macro PM)

- **Tier:** mostly-judgment. ~700-line treatment.
- **Edge becomes:** theme-monitoring scaffolds, cross-asset relationship monitoring, mismatch detectors, expression-comparison engines, scenario PnL grids, conviction-calibration trackers. These are _support tools_ for his judgment, not alpha generators on their own.
- **Stays Rafael:** theme formation, thesis judgment, conviction sizing, cross-asset chain interpretation.
- **Sections that adapt heavily:**
  - Section 1 — "strategies" are theme-tracking dashboards, not alpha generators.
  - Sections 6, 7 — model registry / experiment tracker apply to his theme-research models (e.g. "what cross-asset relationships have predicted X regime in the past?"). Less central than for Marcus.
  - Section 8 — composition is mostly absent; his "compositions" are theme-dashboards.
  - Section 10 — capital allocation is per-theme + per-expression conviction-weighted.
  - Section 13 — decay applies to theme-relationship reliability.
- **Coordination peers:** every trader (he expresses themes through their domains).

### Yuki Nakamura (Senior FX Trader)

- **Tier:** partially-automatable. ~1000-line treatment.
- **Edge becomes:** carry-strategy fleet, cross-vol strategies, fixing-flow strategies, mean-reversion on majors, NDF arb on EM (where data permits). **EM political-risk overlay** stays human.
- **Stays Yuki:** EM political-risk integration, capital-control event interpretation, intervention reads (BoJ / SNB / EM CBs).
- **Distinct surfaces:** session-aware fleet (Tokyo / EU / NY); fixing windows as deployment-cadence drivers; carry-trade unwind risk monitor; cross-currency basis as a strategy input.
- **Coordination peer:** Ingrid (rate-FX linkages).

### Theo Rasmussen (Senior Energy Trader)

- **Tier:** partially-automatable. ~1000-line treatment.
- **Edge becomes:** calendar-spread strategies, weather-driven natgas strategies, inventory-setup strategies (pre / post EIA), crack-spread mean-reversion, OPEC-event scaffolding (pre-positioned for sentiment, scoped for human override on actual headline). **OPEC headline-trading** and major geopolitical events stay human.
- **Stays Theo:** OPEC headline interpretation, hurricane-track judgment, refinery-outage interpretation, geopolitical premium reads.
- **Distinct surfaces:** weather forecast integration as a feature pipeline; inventory release calendar as deployment-cadence driver; seasonal cycle awareness in lifecycle (winter natgas strategies wake up in fall, sleep in spring).
- **Coordination peers:** macro (Rafael) for cross-asset oil moves; firm-level for OPEC-headline coordination.

### Naomi Eberhardt (Senior Event-Driven / Merger-Arb Trader)

- **Tier:** mostly-judgment. ~800-line treatment.
- **Edge becomes:** deal-screening models (which deals are worth tracking), regulatory-pattern matching, document NLP (ingest 200+ deal documents per quarter, extract risk signals), spread-evolution monitors, calibration trackers. Automation surfaces opportunities and tracks 200+ deals simultaneously. **Reading merger agreements and judging deal-break risk** stays her.
- **Stays Naomi:** merger agreement reading, deal-break risk judgment, regulatory-commissioner-stance interpretation, antitrust-precedent application.
- **Sections that adapt:**
  - Section 1 — strategies are deal-monitoring scaffolds, not standalone alpha generators.
  - Section 8 — composition is per-deal sizing rules + monitoring rules, light.
  - Section 11.5 — "Deal Pipeline Live State" — every active deal with status, spread, days to close, regulatory phase, calibration.
- **Coordination peers:** internal / external lawyers + compliance; David.

### Diego Moreno (Senior Live Event Trader)

- **Tier:** partially-automatable. ~1000-line treatment.
- **Edge becomes:** pre-event modeling (xG-derived market edges), in-play stat-driven scalps, lay-the-draw detection, racing form models, cross-book arb scanners. **In-play "match feel"** and late team-news interpretation stay human.
- **Stays Diego:** late team-news interpretation, in-play match-feel, race-day going calls, video-feed reading.
- **Distinct surfaces:** match-day cadence as deployment-cadence driver; per-event-cluster capital allocation (Saturday-3pm-EPL); video-feed as a manual-override input; CLV (closing line value) as the truest edge metric in retrospectives.
- **Section 11.5** — "Active-Event Live State" — every active event with score / time / liquidity / suspension state / video-feed health.
- **Section 14 layout** — must include video as a foveal element; manual ladder + green-up calculator preserved.
- **Coordination peer:** Aria (sister archetype, prediction-market overlap).

### Aria Kapoor (Senior Prediction-Markets / Event-Research Trader)

- **Tier:** mostly-judgment-but-heavily-modeled. ~1000-line treatment.
- **Edge becomes:** cross-venue arb (Polymarket / Kalshi / Smarkets / Betfair), polling-vs-market-price models, calibration-driven sizing, basket-by-confidence strategies, resolution-window momentum strategies. **Resolution-criteria interpretation** stays her.
- **Stays Aria:** resolution-criteria interpretation, ambiguity calls, edge-source weighting (polling vs expert vs structural-bias).
- **Distinct surfaces:** per-domain research workspaces (politics / economics / geopolitical / tech / weather); resolution-source live monitor (BLS / Fed / oracle / committee); cross-venue arb scanner; calibration tracker as primary post-trade metric.
- **Coordination peer:** Diego (sister archetype, sports overlap).

### David Reyes (Portfolio Manager / Head of Risk)

- **Tier:** supervisor. ~800-line treatment with **different shape** from trader archetypes.
- **Approach:** the appendix is mostly section-rewrites rather than direct adaptations. David doesn't have a fleet; he supervises all the fleets.
- **Sections that transform:**
  - Section 1 — "What David's supervisory work becomes" — multi-fleet aggregation, cross-archetype risk decomposition, model-risk governance, kill-switch policy, behavioral-monitoring expansion.
  - Section 3 — data layer is firm-aggregate (cross-trader fleet state, cross-venue counterparty health, cross-archetype performance).
  - Section 5 — research workspace is firm-aggregate analytics (stress-scenario design, ensemble-correlation analysis), not new alpha.
  - Section 8 — replace with "Risk-Limit Hierarchy Composition."
  - Section 9 — replace with "Strategy Class Sanctioning Lifecycle."
  - Section 10 — capital allocation expands dramatically: firm-level cross-archetype.
  - Section 11 — "Firm-Wide Fleet Supervision" — cross-trader aggregation.
  - Section 12 — firm-level interventions (pull a trader, firm-wide kill, multi-key authorization).
  - Section 13 — firm-level post-trade.
- **Manual trading section** — David rarely trades manually but retains override capability for emergency directional bets in the firm-systematic book.
- **Strategy state inspection** — across-fleets variant: David inspects any strategy in any trader's fleet.
- **Coordination peers:** every trader archetype + Elena + CIO / risk committee / board.

### Elena Costa (External Client / Allocator)

- **Tier:** non-trader. **Short note, not a full appendix. ~150 lines.**
- **Approach:** Elena's appendix is a brief section that says: most of the automation appendix doesn't apply to her (she's not running strategies, no research workspace, no model registry, etc.). What she gets in the new automated world:
  - Transparency disclosures into model-risk governance, kill-switch policy, model-version registry.
  - Reports that describe how her capital is risk-managed within the systematic side.
  - Expanded counterparty / venue / protocol risk reporting.
  - Periodic model-risk committee deliverables (typically quarterly).
  - Same multi-modal report delivery; same tiered access controls; same audit trail of her own actions.
- **Daily rhythm:** unchanged from her existing manual sections.
- **Manual trading section:** does not apply.
- **Strategy state inspection:** does not apply.
- **Coordination:** with David's office (transparency disclosures); with IR.
- **What stays human for Elena:** every redemption / subscription / manager-evaluation call; her own portfolio construction across 20+ external managers.

---

## How to Use This Template

For agent-based per-archetype writing:

1. Read this template fully.
2. Read the foundation doc ([automation-foundation.md](automation-foundation.md)) for shared concepts.
3. Read Marcus's appendix ([trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md)) for depth and voice.
4. Read the assigned archetype's existing manual sections to ground domain content.
5. Read this template's Per-Archetype Notes for the assigned archetype.
6. Write the appendix following the 18-section structure, adapting per the rules and adaptation notes.
7. Append the new appendix to the assigned archetype doc, after its existing "How to Use This Document" section.

For human review:

- This template is the structural authority. If Marcus's content drifts from the template, fix Marcus.
- If the template needs to evolve (new archetype, new workflow, new surface), update this file first, then propagate to existing appendices.

---

## Status

Template version 1. Marcus's appendix is the worked example; remaining 14 to be written using this template + Marcus + foundation + their existing manual sections.
