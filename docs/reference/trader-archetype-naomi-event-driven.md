# Trader Archetype — Naomi Eberhardt (Senior Event-Driven / Merger-Arb Trader)

A reference profile of a top-performing event-driven / merger-arbitrage trader at a top-5 firm. Used as a yardstick for what an ideal **event-driven** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md). For the shared surfaces every archetype uses, see [common-tools.md](common-tools.md). For the index of unique surfaces per archetype, see [unique-tools.md](unique-tools.md). For sister archetypes on the same desk, see the other `trader-archetype-*.md` files in this folder.

---

## Who Naomi Is

**Name:** Naomi Eberhardt
**Role:** Senior Event-Driven / Merger Arbitrage Trader
**Firm:** Top-5 global trading firm (event-driven sleeve within multi-strat platform, or specialist event-driven fund)
**Book size:** $500M – $2B gross, with 30–80 active situations
**Style:** Discretionary + research-intensive. Multi-day to multi-quarter horizons. Discrete-payoff trades.
**Coverage:** All event types — M&A (cash, stock, mixed), spinoffs, splits, tender offers, going-private, LBO, holding-company discounts, regulatory events (FDA, FTC, DOJ), liquidations, distressed restructurings, post-bankruptcy equities, SPAC arbitrage, capital-structure trades, dual-listed pair convergence
**Trade types:** Long target / short acquirer (cash-and-stock M&A), long deal target (cash deals), short overvalued spin-co, long under-followed parent, hedge with index puts, capital-structure (long bond / short equity)

### How she thinks differently

Event-driven is a fundamentally different mental model from any other trader:

- **Discrete payoffs.** Most positions resolve to one of two states: deal closes (+spread captured) or deal breaks (–spread + decline). The probability and magnitude of each outcome is the trade.
- **Asymmetric distribution.** A deal that closes pays 4–8% over 6 months; a deal that breaks loses 20–30%. She must be right ~85%+ of the time.
- **Legal & regulatory expertise required.** She reads merger agreements, proxy statements, S-4s, regulatory filings, antitrust analyses. She has lawyers on retainer or in-house.
- **Time decay matters.** Spreads tighten as deals approach close; missing the close window kills returns.
- **Catalyst calendar is deterministic** — shareholder votes, regulatory rulings, court hearings, antitrust review periods are scheduled.
- **Borrow & financing** are first-order. Many trades require shorting acquirers; expensive borrow eats returns.

### Her cognitive load

Naomi tracks:

- **30–80 active deals/situations**, each with its own catalyst path, regulatory profile, financing structure, expected close date.
- **Pipeline of upcoming announcements** — she tracks rumored and announced deals before sizing.
- **Regulatory environment** — current FTC / DOJ / EU CMA / China SAMR / UK CMA stance affects deal probability.
- **Antitrust precedents** — recent rulings shape expectations.
- **Capital structure complexity** — bonds, prefs, warrants, options, all may have separate event payoffs.

The terminal must support **deal-as-object** as a first-class concept — every position is associated with one or more deals.

---

## Physical Setup

**6 monitors**, with the **deal pipeline** at the center.

| Position      | Surface                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------- |
| Top-left      | **Deal pipeline & calendar** — every deal she's tracking, with status and catalysts       |
| Top-center    | **Active deal dashboard** — the deal in foveal focus right now                            |
| Top-right     | **Regulatory & legal news** — FTC / DOJ / SEC filings, court hearings, antitrust analyses |
| Middle-left   | **Capital structure visualization** — for the focus deal: equity, debt, hybrids           |
| Middle-center | **Positions, exposures, P/L by deal & by category**                                       |
| Middle-right  | **Order entry — single-name, pairs, capital structure tickets**                           |
| Bottom-left   | **Macro / market context** — equities, vol, credit, sector heatmaps                       |
| Bottom-right  | **Trader chat, sell-side event-driven research, expert network calls**                    |
| Tablet        | News terminals, conference call audio (proxy fights, shareholder meetings)                |

Naomi spends substantial time **reading documents** — merger agreements run hundreds of pages; proxy statements, antitrust filings, court rulings. The terminal supports research workflow alongside trading.

---

## Phase 1: Decide

### Deal pipeline (UNIQUE — the spine of her terminal)

A list / kanban of every deal she's tracking. **Every deal is a first-class object** carrying its own status, terms, catalysts, documents, position, P/L, and journal.

**Status (lifecycle):** Rumored → Announced → Definitive agreement → Shareholder vote → Regulatory review → Final approvals → Closed | Broken.

**Per-row fields:** target (name/ticker), acquirer (name/ticker), deal type (cash/stock/mixed/tender/scheme), headline value, current spread (gross + annualized), days to expected close, probability of close (subjective + market-implied), active position size, deal P/L, next catalyst date + type.

### Active deal deep-dive (UNIQUE)

For the focused deal:

- **Deal terms** — price, ratio (stock deals), collar, CVRs, breakup fees.
- **Spread analytics** — gross spread, days to close, annualized return, break price.
- **Probability decomposition** — conditional on regulatory approval, on shareholder vote, on financing.
- **Implied vs subjective probability** — current spread implies X; her estimate is Y.
- **Risk/reward** — payoff if closes, payoff if breaks, expected value.
- **Hedge structure** — index put / acquirer short / capital-structure / sector ETF.

### Regulatory & antitrust dashboard per deal (UNIQUE)

- **Filings tracker** — HSR (US), Form CO (EU), CMA notification (UK), MOFCOM/SAMR (China), SEC S-4, proxy DEFM14A.
- **Review-period deadlines** — initial 30-day, second-request, statutory deadlines per jurisdiction.
- **Antitrust analysis** — concentration metrics, HHI changes, geographic / product overlaps.
- **Recent precedents** — similar deals approved/blocked in recent past.
- **Commissioner profiles** — current FTC chair stance, EU competition commissioner pattern, voting records.

### Catalyst calendar — deal-attached (UNIQUE)

The most deterministic calendar in trading; the [#12 Calendar](common-tools.md#12-catalyst--event-calendar) framework with **Naomi-specific event types**: HSR clearance dates/deadlines, second-request deadlines, EU phase-1/phase-2 ends, other jurisdictional reviews (UK CMA, Canada, China, Brazil, India), shareholder votes (target + acquirer), court hearings (Delaware Chancery, federal, appellate), tender-offer expirations, drop-dead dates (outside date in the merger agreement), walk rights triggers. Every catalyst is linked back to its deal object; click-through opens the deep-dive.

### Document library (UNIQUE)

Per deal, all searchable across deals:

- **Merger agreement** (full text + key clause excerpts: MAC, breakup fee, ticking fee, financing, regulatory efforts).
- **Proxy / scheme document.**
- **S-4 / F-4** for stock deals.
- **Antitrust filings** (HSR/Form CO/CMA filings as redacted/published).
- **Press releases** — chronological.
- **Court filings** if litigation involved.
- **Sell-side event-driven analyst notes.**
- **Internal memos** — Naomi's own notes, in-house lawyers' opinions, expert call summaries.

### Pipeline & rumor tracker (UNIQUE)

Pre-deal lifecycle: rumored deals (press leaks, chatter), companies under review (strategic alternatives announced), activist situations (under pressure to sell), sponsor / PE interest (known acquirers exploring targets), spinoffs & corporate actions (parent vs spin-co valuation, tracking stocks, splits, mergers-of-equals, SPAC pipeline), distressed / restructuring (near-bankruptcy claims, post-bankruptcy equity, recovery analyses, capital structure for distressed names).

### Shared surfaces in Decide

- [#1 Charting](common-tools.md#1-multi-timeframe-charting) — daily/weekly horizons dominate; the spread overlay (target vs deal price, or pair spread for stock deals) matters more than the price line itself; announcements, definitive-agreement signing, regulatory milestones and vote dates annotated.
- [#13 News](common-tools.md#13-news--research-feed) — event-driven sell-side desk notes and law-firm antitrust analyses are first-class; expert-network transcripts attach to deals; government/regulator sources (FTC press, EU Commission, DOJ filings, court dockets) are primary.

### Macro context

- Equity indices, sector heatmaps.
- Credit spreads (IG / HY / CDX) — financing-market health drives LBO closability.
- Vol indices (VIX, MOVE) — risk environment for deal closes.
- Rates environment — affects LBO financing, cash deal premiums.

**Layout principle for Decide:** the deal pipeline is foveal. Each deal has a deep-dive view. Document library is one click away. Catalyst calendar drives daily attention.

---

## Phase 2: Enter

Event-driven entry is **deal-attached**, **multi-leg native**, and **borrow-aware**.

### Order entry — ticket framework

See [#2 Order Ticket](common-tools.md#2-order-entry-ticket-framework). **Naomi-specific tickets** (all UNIQUE first-class shapes):

- **Single-name ticket (cash deals)** — buy target stock at spread to deal price; pre-trade shows spread captured, days to close, annualized return, hedge requirement.
- **Cash-and-stock pair ticket** — buy target / sell short acquirer at deal ratio, ratio enforced for automatic sizing, live spread in $ and bps, atomic execution, **borrow availability + recall-risk flag** for the acquirer short leg.
- **Capital-structure ticket** — long the bond / short the equity of the same company; long pref / short common; long convert / short common. Cross-asset coordination with single-leg entries on each side.
- **Hedge ticket** — index puts (SPX) for deal-break protection, sector ETF shorts, VIX calls, custom structures designed per deal.
- **Tender offer participation workflow** — tender / don't-tender decisions through prime broker, with status tracking and timeline visualization.
- **Distressed / claims ticket** — buy bonds, loans, and bankruptcy claims at distressed levels through specialist intermediaries; bankruptcy claim acquisition workflow.

### Pre-trade preview

See [#3 Pre-Trade Preview](common-tools.md#3-pre-trade-risk-preview). **Naomi-specific lines:** deal economics (spread captured, days to close, annualized return, IRR); risk (break price, max loss if deal terminates, probability-weighted EV); hedge effectiveness (beta / sector exposure of the proposed structure); capital usage (long + short capital required, financing for the short leg); borrow cost (annualized financing as a line item); compliance (position limits, restricted lists, conflicts when firm advises one side).

### Algos & SOR

- [#4 Algos](common-tools.md#4-execution-algos-library) — VWAP/TWAP at slow tempos, spread-targeting (execute when pair spread reaches X bps), close-tightening accumulation that increases rate as the deal-close window approaches.
- [#5 SOR](common-tools.md#5-smart-order-router--multi-venue-aggregation) — block / RFQ workflow for size or illiquid names (broker dealers, IOI aggregation, anonymized RFQ); information-leakage suppression is paramount and predictable multi-day accumulation patterns are flagged.

### Compliance — inline & serious (information-barrier & restricted-list automation, UNIQUE)

See [#28 Compliance](common-tools.md#28-compliance--audit-trail). **Naomi-specific characteristics:**

- **Restricted lists** — when firm has MNPI on a deal, the name is auto-blocked at the ticket; override requires desk-head + compliance dual sign-off.
- **Information barriers** — Naomi's market data + research access scoped per side of the wall; cross-wall views simply do not render.
- **Tender-offer rules** — Reg 14E timing checks at the ticket.
- **13D/13G** filing thresholds (5%, 10%) tracked with pre-breach alerts.
- **Insider-trading prevention** — automated checks against firm's research / advisory side activity on the same name.

### Hotkeys

See [#6 Hotkeys](common-tools.md#6-hotkey-system). **Naomi-specific bindings:**

- Buy target / sell acquirer at NBBO with deal-ratio sizing.
- Cancel all on deal.
- Hedge deal-break risk (preconfigured per deal).
- Flatten deal.

**Layout principle for Enter:** the deal-pair ticket is first-class. Compliance is inline. Borrow / financing are pre-trade-visible. Hedge structure is configured per deal in advance.

---

## Phase 3: Hold / Manage

Event-driven positions are **slow-moving day-to-day** but **catalyst-cliffs** matter enormously. Naomi's Hold surface is calendar-shaped.

### Positions blotter — by deal

See [#7 Positions](common-tools.md#7-positions-blotter). **Naomi-specific characteristics:**

- Primary grouping is **by deal**, not by instrument:
  - Deal: Target Inc / Acquirer Co
    - Long Target: 500k shares, P/L +$Y
    - Short Acquirer: 200k shares, P/L +$Y
    - Index put hedge: 100 contracts, P/L –$Z
    - Net deal P/L: +$W
    - Spread captured: 60% of headline spread realized
    - Days remaining: 87
- Secondary views: by category (M&A / spinoff / SPAC / distressed) and by underlying instrument (for trading).
- Live spread monitor inline: current spread, change today, change since entry, distance to break price, distance to deal close payoff, z-score of spread vs entry.

### Working orders

See [#8 Working Orders](common-tools.md#8-working-orders-blotter). Orders inherit a **deal tag** (closing a deal flattens all related working legs); spread-targeting working orders dominate and may sit for days.

### Live PnL — event-decomposed (deal P/L decomposition, UNIQUE)

See [#9 Live PnL](common-tools.md#9-live-pnl-panel). **Naomi-specific characteristics:**

- Per deal, per leg.
- **Spread tightening P/L** — passive accrual as deals approach close, separated from active.
- **Spread widening P/L** — adverse moves.
- **Hedge P/L** — separate.
- **Borrow / financing cost** — daily accrual.
- By deal type — M&A vs spinoff vs SPAC vs distressed.

### Risk panel — event-driven specific

See [#10 Risk](common-tools.md#10-risk-panel-multi-axis). **Naomi-specific axes:**

- **Deal-break risk per deal** — max loss if deal terminates.
- **Aggregate break risk** — what if 3 deals broke simultaneously?
- **Concentration risk** — % of book in a single deal.
- **Sector concentration** — too many tech deals, too many healthcare deals.
- **Acquirer concentration** — multiple deals by the same PE sponsor.
- **Regulatory regime risk** — % of book exposed to current FTC stance.
- **Vol exposure** — for deals with stock components.
- **Borrow risk** — high-borrow positions, recall probability.
- **Liquidity** — % of book in illiquid names.

### Stress

See [#11 Stress](common-tools.md#11-stress--scenario-panel). **Naomi-specific scenarios:**

- "All FTC reviews block" — 30% of M&A pipeline.
- "Risk-off shock" — deal-break premium widens broadly.
- "Credit shock" — LBO deals re-underwritten.
- "Specific deal break" — top-3 deals individually.

### Catalyst countdown

The most important live surface; renders on top of [#12 Calendar](common-tools.md#12-catalyst--event-calendar). Next 7 / 30 / 90 days of catalyst events across all deals, color-coded by significance (regulatory deadline, vote, court date), with a pre-event positioning summary at T-7, T-1, T-0.

### News & document watch (deal-tagged news watch, UNIQUE)

See [#13 News](common-tools.md#13-news--research-feed). Per-deal news on regulatory filings, statements, hearings; new SEC filings on tracked names auto-flagged to the deal; court docket monitoring (new filings on deals in litigation); press releases auto-categorized; pattern monitoring across the book — second requests issued, EU phase-2 launched, complaints filed.

### Alerts

See [#14 Alerts](common-tools.md#14-alerts-engine). **Naomi-specific types:** catalyst countdown (T-7, T-1, T-0), spread alerts (beyond entry parameters), regulatory alerts (filing/statement/ruling), deal-keyword news alerts, recall alerts (short-borrow status changes), compliance alerts (restricted-list changes, 13D/G thresholds), risk-limit alerts (concentration, deal-break aggregate, sector).

### Trade journal — deal journal

See [#15 Journal](common-tools.md#15-trade-journal). Journal is **per deal**, not per trade: thesis at entry, probability-of-close estimate, key risks, regulatory/catalyst progress, decision points (add / trim / hedge / exit), reviewed weekly.

### Heatmap & comms

- [#16 Heatmap](common-tools.md#16-heatmap-of-own-book) — tiles are **deals** (not instruments), sized by capital deployed × today's P/L move.
- [#17 Comms](common-tools.md#17-communications-panel) — sell-side event-driven desk chat, internal-lawyer threads (regulatory opinions), expert-network call notes, and industry analysts/trade press; threads attach to deals.

### Kill switches

See [#19 Kill](common-tools.md#19-kill-switches-granular). **Naomi-specific levels:** reduce a deal's exposure (pre-defined unwind algo); close all M&A positions (multi-day algo, emergency); hedge to neutral (fast index hedge); cancel all working orders.

**Layout principle for Hold:** deal pipeline + catalyst calendar are foveal. Regulatory news is constant peripheral. Document watch surfaces filings the moment they post.

---

## Phase 4: Learn

Event-driven post-trade emphasizes **deal-by-deal outcomes**, **probability calibration**, **sub-strategy performance**.

### Trade history, attribution, performance

- [#21 Trade History](common-tools.md#21-trade-history--blotter-historical) — history is organized as **closed deals**, each with a retrospective: entry thesis vs realized outcome, probability estimate vs realized, spread captured vs available, hedge effectiveness, regulatory path vs predicted, time-to-close vs predicted, lessons.
- [#22 Attribution](common-tools.md#22-pnl-attribution-multi-axis) — by deal, by deal type (M&A / spin / SPAC / distressed / capital structure), by regulatory jurisdiction (US / EU / cross-border), by outcome (closes vs breaks vs renegotiations), by sector, by regulatory regime (favorable vs hostile).
- [#23 Performance](common-tools.md#23-performance-metrics) — hit rate by deal type, avg deal won vs avg deal lost, **spread-realization rate** (% of available spread captured), **calendar discipline** (% of deals exited at or near close).
- [#24 Equity Curve](common-tools.md#24-equity-curve) — stepwise: long flat stretches punctuated by catalyst-day jumps; the visualization should preserve, not smooth, these steps.
- [#25 TCA](common-tools.md#25-execution-quality--tca-transaction-cost-analysis) — spread-leg execution vs arrival mid, pair-leg synchronization slippage, block / RFQ price improvement vs lit benchmark.

### Probability calibration tracker (UNIQUE)

Critical for Naomi — her edge is forecast accuracy, so the system measures it. When she said "85% chance of close," did 85% of those deals close? When 60%, did 60%? Calibration curve over time, updated per closed deal; **Brier score** as headline metric, decomposed by deal type, jurisdiction, and regulatory regime. Drives improvement of subjective-probability formation.

### Hedge-effectiveness tracker (UNIQUE)

Hedge cost vs hedge protection ratio per deal; **hedges that paid off** (list of deals where the hedge saved her, with magnitude); **wasted hedges** (unnecessary hedges with cost). Aggregated by deal type, regulatory regime, and hedge structure.

### Adjacent analytics

- **Regulatory pattern analysis** — performance by commissioner / regime, by industry, precedent fit.
- **Capital-structure analytics** — long-bond / short-equity mean reversion, convertible-equity spreads, distressed recovery analysis.
- **Borrow / financing analytics** — borrow cost paid YTD per deal, recall events, hard-to-borrow trade selection.

### Behavioral, reports, replay, tagging, layout

- [#26 Behavioral](common-tools.md#26-behavioral-analytics) — entry timing vs deal lifecycle, exit timing (hold to close vs cash out early), and **probability anchoring** (does her estimate move with market spread? a circularity warning).
- [#27 Reports](common-tools.md#27-reports) — daily P/L commentary (deal-tagged), weekly portfolio review, monthly attribution by deal type/sector/outcome, quarterly investor/committee letter (event-driven storytelling), regulatory filings (13F, 13D/G, Schedule TO).
- [#20 Replay](common-tools.md#20-replay-tool) — scrub the lifecycle of any closed deal: terms, spread evolution, regulatory milestones, position changes, journal entries — synchronized.
- [#29 Tagging](common-tools.md#29-strategy-tagging-framework) — every order/position carries a **deal_id** tag (primary) plus deal-type, jurisdiction, and hedge-role tags.
- [#30 Layout](common-tools.md#30-customizable-layout--workspace) — saved workspaces are typically per-deal (a deep-dive workspace per active situation) plus the master pipeline view.

**Layout principle for Learn:** deal-by-deal retrospectives. Probability calibration over time. Pattern recognition across regulatory regimes and deal types.

---

## What Ties Naomi's Terminal Together

1. **Deals are first-class objects.** Every position is associated with one or more deals; P/L, risk, alerts, journals are deal-organized.
2. **Catalyst calendar is the planning spine.** Regulatory deadlines, votes, hearings dominate scheduling.
3. **Document library integrated.** Merger agreements, filings, court papers — all searchable, all attached to deals.
4. **Multi-leg native execution.** Cash-stock pairs, capital-structure trades, hedged structures.
5. **Compliance is inline and serious.** Restricted lists, info barriers, tender rules, 13D filings — automated, audited.
6. **Borrow & financing are pre-trade visible.** Many trades depend on shorting; recall risk and cost are first-class.
7. **Probability calibration is post-trade core.** Her edge is forecast accuracy; the system measures it.
8. **Regulatory news is continuously surfaced.** Filings, hearings, rulings — all auto-flagged to relevant deals.
9. **Pipeline awareness.** Rumored, announced, in-review — full lifecycle visibility.
10. **Slow rhythm, sharp catalysts.** Days of nothing, then a regulatory ruling moves the deal 5%; the terminal supports both modes.

---

## How to Use This Document

When evaluating any event-driven terminal (including our own), walk through Naomi's four phases and ask:

- Are deals first-class objects (with status, terms, catalysts, documents, P/L, journal)?
- Is the catalyst calendar a foveal planning surface, with all jurisdictions covered?
- Is the document library integrated and searchable across deals?
- Are pair tickets (target/acquirer) and capital-structure tickets first-class?
- Is compliance (restricted lists, info barriers, tender rules) inline and automated?
- Is borrow / financing pre-trade visible with recall-risk awareness?
- Is regulatory news continuously surfaced and deal-tagged?
- Is post-trade probability calibration tracked over time?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.

---

# Automated Mode

This appendix describes Naomi's terminal and daily workflow once the parts of her edge that can be encoded — deal screening, regulatory pattern matching, document NLP, spread-evolution monitoring, calibration tracking — are running at scale across the entire universe of public deal activity. The manual sections above describe Naomi at her desk, hand-tracking 30–80 active situations and deeply reading the merger agreements that matter. This appendix describes the same Naomi when the platform passively tracks **every** announced deal, every rumored situation, every regulatory filing, and every court docket relevant to her universe — so her judgment can sit on top of a far wider scaffold than she could maintain by hand.

The strategy logic itself (which deals to size into, what spread is fair, how to read a particular antitrust commissioner's stance) is out of scope. This appendix is about **the terminal she works in**: every surface, every panel, every workflow that supports judgment-on-scaffolds rather than judgment-alone.

For the universal automated-trading platform concepts this builds on, see [automation-foundation.md](automation-foundation.md). For the structural template this appendix follows, see [automation-archetype-template.md](automation-archetype-template.md). For the worked example demonstrating depth and voice, see [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md) — recognising that Marcus's content is crypto-CeFi-specific and Naomi's domain is fundamentally different.

Naomi sits in the **mostly-judgment** tier. Reading a 600-page merger agreement and forming a deal-break probability is human work and stays human. What automation does is widen her aperture: from the 30–80 active deals she can hold in her head to the 200+ active deals plus 100+ rumored / strategic-alternative situations the platform tracks continuously, with her judgment focused on the subset that matters and the platform handling the screening, filing-extraction, spread-monitoring, calibration-bookkeeping, and pattern-matching against precedent.

> _Throughout this appendix, examples are illustrative — actual data sources, model names, deal IDs, dataset names, feature names, and metrics shown are sample shapes to make the surfaces concrete. The platform's real catalog will differ._

## 1. What Naomi's Edge Becomes

Her manual edge — reading deals, judging deal-break risk, applying antitrust precedent, calibrating probabilities — does not become a fleet of alpha-generating strategies. It becomes a **scaffold** of monitoring systems and screening models that surface opportunities, track 200+ deals simultaneously, and make her per-deal judgment sharper. The "strategy classes" below are deal-monitoring scaffolds, not standalone alpha generators.

- **Deal-screening models.** Across the live universe of announced and rumored deals, classify each by tractability for the desk: deal type (cash / stock / mixed / scheme / tender / SPAC / spinoff), expected jurisdictional review surface, expected close horizon, expected spread regime, expected hedgeability. Rank by "worth Naomi's time vs not" — surfacing the dozen new situations a week that justify her reading the agreement, while filing the rest away for periodic review.
- **Regulatory-pattern matching.** Per deal, retrieve the closest historical precedents on antitrust review (FTC / DOJ / EU CMA / UK CMA / MOFCOM / SAMR / CCB / CADE) by industry overlap, HHI delta, geographic concentration, vertical integration profile, and political regime. Surface base-rate close-probability and modal review-path for each.
- **Document NLP.** Continuous ingestion of every merger agreement, S-4, F-4, proxy, DEFM14A, scheme document, antitrust filing, court docket entry, and HSR notification across 200+ active deals — extracting MAC clauses, financing conditions, breakup-fee structures, ticking-fee triggers, regulatory-efforts language, walk-right triggers, drop-dead dates, and litigation status into structured fields with provenance back to the source paragraph. The platform reads ~200 deal documents per quarter at a depth Naomi cannot scale to alone.
- **Spread-evolution monitors.** Per deal, track gross spread, annualised return, days-to-expected-close, and z-score-vs-entry continuously. Detect spread regime breaks (a quiet spread that just widened 80bps on no public news is a signal) and tag deals where the market is repricing close-probability faster than her stated estimate.
- **Calibration trackers.** Per closed deal, record her stated probability-of-close at each decision point against the realised outcome. Roll the resulting calibration curve and Brier-score time series forward as a primary post-trade metric. The system measures whether her 85% means 85%.
- **Cross-deal pattern monitors.** Across the live book, detect macro-level patterns: simultaneous second-requests across the M&A pipeline (a regime signal); a cluster of deals in one sector all repricing on one regulatory ruling; sponsor concentration risk emerging across multiple LBO deals.
- **Capital-structure scaffolds.** For deals with bond / pref / convert / equity legs, track relative pricing across the structure, surface dislocations, and pre-compute hedge-ratio candidates Naomi can validate or override.
- **Pipeline-and-rumor tracker.** Continuous monitoring of 13D filings, "exploring strategic alternatives" announcements, activist letters, sponsor exploratory news, leaked-rumour signals from sell-side desks, and SPAC-pipeline metadata — all surfaced as candidate situations long before they hit her active book.
- **Litigation watcher.** Federal-court, Delaware-Chancery, and appellate-court docket monitors across every deal in litigation; new filings auto-tagged and ranked for likely material impact.
- **Hedge-recipe library.** Per deal type and regulatory regime, pre-computed hedge-structure candidates (index-put strikes, sector-ETF shorts, capital-structure pairs, custom basket shorts) with assumed costs and beta — ready for Naomi to approve / modify / reject.

Each scaffold has dozens-to-hundreds of live "instances" — one per active deal, per rumour, per litigation thread. Total active scaffolding: ~200 active deals, ~100 rumoured / pre-announcement situations, ~50–80 closed-but-still-resolving cases. **Naomi still reads the merger agreements that matter and forms the close-probability that matters.** The shift is that she does this on top of a continuous information substrate she could not maintain by hand.

Her day is no longer "find the next deal-pair to size into." It is "trust the screen to surface what matters; spend the cognitive budget on the deals that the model rates as live-and-tractable; let the calibration tracker tell her honestly whether her judgment is improving."

## 2. What Stays Naomi

Most of the core work stays human. The platform's automation widens aperture; it does not replace judgment. What stays Naomi:

- **Reading the merger agreement.** Every deal she sizes into, she reads the agreement. The MAC carve-outs, the regulatory-efforts language ("hell or high water" vs "reasonable best efforts" vs "commercially reasonable"), the breakup-fee structure and triggers, the financing conditions, the ticking fee, the walk-right grid, the closing conditions — these are read by Naomi, not by an NLP pipeline. The platform's NLP _extracts and surfaces_; Naomi _interprets_.
- **Deal-break risk judgment.** The platform shows base rates from precedent, current-market-implied probability, and her own prior estimate. Forming her own probability — integrating the agreement's language, the buyer's history, the seller's options, the regulatory political climate, the financing market state, and the parties' strategic alternatives — is her work. Models inform; they do not decide.
- **Antitrust-precedent application.** Two superficially similar deals can have opposite antitrust outcomes because of one factor a generic precedent-matcher misses (a single supplier overlap, a politically sensitive geography, a commissioner with a particular doctrine). Naomi reads the precedents the platform retrieves and judges fit; she does not accept the platform's similarity score as the answer.
- **Regulatory-commissioner-stance interpretation.** Recent speeches by the FTC chair, the EU competition commissioner, the UK CMA panel chair, the US assistant attorney general for antitrust, the Indian CCI member — these signal stance shifts the platform may aggregate but cannot interpret. Naomi reads the signals firsthand.
- **Reading the political regime.** Election cycles, administration changes, geopolitical-event regimes (US-China, US-EU friction, UK post-Brexit posture) shift deal-close base rates by tens of percentage points within months. Naomi tracks this regime; the platform is a slower follower.
- **Counterparty / sponsor reads.** "Will this PE sponsor walk if financing tightens? Will this strategic acquirer renegotiate? Will this target's board accept a busted-deal scenario rather than a price cut?" These are read from history, deposition transcripts, sell-side relationships, and informed gut. Human work.
- **MNPI / wall management.** When the firm's advisory side has MNPI on a deal, Naomi must respect the wall. The platform automates the restricted-list enforcement, but she carries the judgment about what she can discuss, what she should not look at, and when to recuse herself from a position. The MNPI-and-wall-judgment surface stays her, with compliance.
- **Distressed and post-bankruptcy interpretation.** Recovery analysis, plan-of-reorganisation reading, fulcrum-security identification, fraudulent-conveyance risk, equity-committee dynamics — domain expertise the platform supports with data but does not replace.
- **Cross-asset / cross-deal portfolio judgment.** Holistic decisions like "we are over-concentrated in PE-sponsor LBO deals; let's not add more even if individually attractive" are human; the platform surfaces the concentration but not the conclusion.
- **Counsel and compliance dialogue.** The platform makes the conversation more efficient (shared deal record, attached filings, pre-extracted clauses) but the conversation itself — with internal lawyers, external antitrust counsel, the firm's compliance officer — is human, by design and by regulation.

The platform is opinionated about scaffolding and humble about judgment. Naomi's reading-and-deciding surfaces are made higher-leverage by automation — they are not bypassed.

## 3. The Data Layer for Naomi

The data layer Naomi consumes in automated mode is **text-and-event-heavy** rather than tick-heavy. Filings, dockets, precedent decisions, regulatory press, sell-side notes, expert-network calls, agreement corpora. The catalog reflects this.

### 3.1 The Data Catalog Browser

Naomi's home page when she opens the data layer. Same shape as the foundation doc and Marcus's catalog, with an event-driven taxonomy.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters: source class (filings / court dockets / regulatory decisions / merger-agreement corpus / precedent database / sell-side research / expert-network notes / news); jurisdiction (US / EU / UK / China / India / Brazil / Canada / other); cadence (real-time / EOD / weekly / static-archive); license tier (premium / standard / public); cost band; coverage period.
- **Main panel** — table of datasets with name, source, coverage summary (e.g. "SEC EDGAR full filing archive, 1994–present, all forms"), cadence, freshness, license terms, annual cost, owner, last-updated.
- **Right pane** — when a dataset is selected: description, schema, sample rows, lineage, quality history, license link, "send to a notebook" button.

**Search** — free-text across names, descriptions, schema. "EU CMA decisions" jumps to the EU Commission decision archive; "Delaware Chancery dockets" finds the court-docket feed.

### 3.2 Naomi's Core Datasets (Illustrative)

A senior event-driven trader's data footprint at a top-5 firm spans dozens of feeds. Examples of what Naomi's catalog tier likely contains — actual library will differ:

- **SEC EDGAR archive** — all forms (S-4, F-4, DEFM14A, DEF 14A, 13D, 13G, 13E-3, SC 14D9, SC TO-T, 8-K, 10-K, 10-Q, ARS, NT, etc.); full-text + structured fields; updated within minutes of filing.
- **Court-docket archives.** PACER (federal), Delaware Chancery, Delaware Superior, NY State Supreme Commercial Division, Texas business courts, English High Court of Justice, EU General Court — case lists, filings, hearing schedules, opinions.
- **DOJ / FTC decision database** — consent decrees, complaints, second-request letters (where public), closing-letter archive, speeches by commissioners and AAGs.
- **EU CMA decision database** — Phase-1 clearances, Phase-2 decisions, prohibitions, remedies, withdrawals; with the underlying market-definition reasoning.
- **Other-jurisdictional regulator archives** — UK CMA, China SAMR, India CCI, Brazil CADE, Canada Competition Bureau, Korea KFTC, Japan JFTC, Mexico Cofece.
- **Merger-agreement corpus (NLP-ready).** Every public merger agreement, proxy, scheme document, S-4 filed since (typically) 2000, parsed into structured clauses (MAC carve-outs, breakup-fee schedule, ticking-fee triggers, regulatory-efforts language, walk-right grid, financing conditions, drop-dead dates), with version history when amended.
- **Antitrust-precedent database** — every US, EU, UK, China material antitrust decision tagged by industry, HHI delta, geographic overlap, vertical-integration profile, remedy type, outcome (cleared / blocked / cleared-with-remedies / abandoned).
- **Sell-side event-driven research.** Premium feeds from major prime brokers' event-driven desks; law-firm antitrust analyses; specialist event-driven research boutiques.
- **Expert-network call notes.** GLG / Third Bridge / AlphaSights summaries (compliance-curated and tagged by deal where applicable); internal expert-call notes captured by the desk.
- **Press-release & news archive.** PR Newswire, Business Wire, Reuters, Bloomberg, regulator-press archives, key trade-press (e.g. MLex, Global Competition Review, Capitol Forum, Politico Pro Antitrust).
- **Borrow / financing data.** Stock-loan availability, indicative borrow rates, recall history per ticker; bond CDS levels for capital-structure trades.
- **Polling and political-regime data.** Election polling aggregators, congressional-vote scorecards, executive-branch personnel changes — relevant to political-regime-conditioned deal probability.
- **Insider-transaction archive.** Form 4, 13F changes, stake-build patterns — surfacing target-side and acquirer-side insider behaviour.
- **Activist database.** 13D campaigns, exit-letters, settlement agreements, board-composition history.
- **SPAC universe.** Active SPACs with trust value, deadline, target rumours, redemption history.

Each dataset's record shows license terms, cost, coverage, freshness, lineage, used-by (which features and scaffolds depend on it), incident history.

### 3.3 Data Quality Monitoring

Same shape as the foundation doc. Naomi's quality dimensions emphasise:

- **Filing-feed freshness** — EDGAR has SLA but court-docket scrapers and non-US regulator feeds are flakier; freshness is monitored continuously.
- **Schema stability** — when a regulator changes a form layout (a new EU notification format, a CMA template update), the parser must adapt; schema drift is alerted before it silently breaks downstream extraction.
- **Document-NLP completeness** — per merger agreement, what proportion of expected clauses were extracted? Below threshold → re-process or human-tag.
- **Cross-source consistency** — when two sources cover the same event (e.g. EDGAR + a redistributor), do they agree? Disagreement flagged.

### 3.4 Lineage Navigator

Standard lineage graph (datasets → features → models / scaffolds → live deal monitors → P/L). Naomi opens it when:

- A scaffold is misbehaving (too many false-positive screen hits) and she wants to trace the input data quality.
- A vendor announces a feed change (e.g. court-docket scraper deprecated) and she wants to see scope of impact.
- A regulator changes a filing format and she wants to confirm which deals' extracted clauses might be affected.

### 3.5 Procurement Dashboard

Standard shape per the foundation. Renewal-sensitive feeds for Naomi:

- Court-docket archives (PACER costs scale with usage; specialist court-data redistributors have annual contracts).
- Antitrust-precedent databases (specialist providers; high-cost, high-attribution).
- Premium event-driven sell-side research.
- Expert-network platforms.
- Specialist NLP-ready merger-agreement corpora.

Her major procurements (>$500k/year) escalate to David / firm-level.

### 3.6 Gap Analysis Surface

The most underrated surface for an event-driven trader. Examples of gaps the platform might surface:

- "We track US, EU, UK, China antitrust decisions; we do not yet have structured CADE (Brazil) coverage. Three of the last twenty cross-border deals depended on CADE timing; consider procurement."
- "Court-docket coverage is good for federal and Delaware; weak for English High Court. Consider procurement of a UK litigation feed."
- "Document-NLP coverage is comprehensive for US deals; non-US schemes-of-arrangement have lower extraction completeness."

Gap analysis is tied to concrete deals where information could not be tracked at desired depth.

### 3.7 Interactions Naomi has with the data layer

- **Daily (background):** quality monitor in peripheral; auto-alerts for filing-feed degradation or document-NLP completeness drops.
- **Weekly:** procurement / wishlist review; reading data-team release notes (new sources onboarded, schema updates).
- **Monthly:** cost / attribution review (which feeds correspond to which closed-deal P/L); renewal-decision triage.
- **Ad hoc (during research):** querying the precedent database when starting a new deal — what's the closest historical match, what was the outcome, what did the path look like?
- **Ad hoc (during a deal incident):** lineage navigator from a misbehaving scaffold back to source data.
- **Ad hoc (during incidents):** when a court-docket scraper degrades on the day a major hearing is scheduled, the impact-scope view tells Naomi exactly which deals are at risk of going dark and what to monitor manually.

### 3.8 Why this matters

- **Efficiency:** Naomi does not waste hours figuring out where to find a specific precedent or whether the firm has a particular jurisdiction's decisions. The catalog is one click; the precedent is one query.
- **Risk:** quality monitoring catches feed degradation before a missed filing produces a missed catalyst. Without it, a single court-docket scraper failure on a critical hearing day could materially damage P/L on a large position.
- **PnL:** procurement decisions are evidence-driven. Naomi does not pay for a redundant filings feed; she does aggressively license a specialist antitrust-precedent provider that pays for itself on one correctly-priced deal.

## 4. The Feature Library for Naomi

Features in Naomi's domain are mostly **deal-level descriptors and event-derived signals** rather than tick-level microstructure. The library is shared across the firm — features Naomi or her counsel team build are visible to David, Quinn, and (with permission) sister-archetype traders such as Henry where event-window analytics overlap.

### 4.1 The Feature Library Browser

Same shape as the foundation doc. Filter taxonomy adapted for Naomi:

- **Domain:** deal-terms / regulatory-classification / spread-evolution / capital-structure / borrow-financing / litigation / political-regime / sponsor-history / target-fundamental / cross-deal-pattern.
- **Entity dimension:** per-deal / per-target / per-acquirer / per-sponsor / per-jurisdiction / per-commissioner / per-court / per-judge.
- **Cadence:** static (deal-time-of-announcement snapshot) / event-driven (recomputes on filing or ruling) / daily / weekly.

### 4.2 Naomi's Core Features (Illustrative)

Examples of features Naomi builds or consumes — actual library will differ.

**Deal-terms-derived:**

- `deal_type_canonical` — categorical: cash / stock / mixed-cash-stock / scheme / two-step-tender / SPAC / spinoff / split-off / dual-listed-pair.
- `mac_clause_strength` — ordinal score on the MAC carve-out language strength, derived from clause-NLP of the agreement vs the corpus benchmark.
- `regulatory_efforts_strength` — categorical: hell-or-high-water / hell-or-high-water-with-divestiture-cap / commercially-reasonable / reasonable-best-efforts / undefined.
- `breakup_fee_pct_of_deal` — buyer's reverse termination fee as % of deal value.
- `ticking_fee_trigger_days` — days from signing until ticking fee starts.
- `walk_right_count` — count of named buyer walk rights.
- `drop_dead_date_days_from_signing` — outside date from agreement.
- `financing_conditional_flag` — boolean: is the deal subject to financing.
- `collar_flag_and_band` — for stock deals: is there a collar; if so, the band.
- `cvr_present` — boolean: contingent value right attached.

**Regulatory-classification-derived:**

- `hsr_filed_flag` and `hsr_clearance_status` — categorical: filed / cleared / second-request / cleared-after-second-request / blocked / withdrawn.
- `eu_phase_status` — categorical: not-notified / phase-1 / phase-2 / cleared / blocked / withdrawn / remedied.
- `jurisdictional_review_count` — number of distinct jurisdictions reviewing the deal.
- `hhi_delta_estimate` — concentration-change estimate per relevant market.
- `geographic_overlap_score` — geographic concentration of the merger overlap.
- `vertical_integration_flag` — boolean: is this a vertical (or hybrid) merger.
- `closest_precedent_outcomes` — top-5 historical precedents by similarity score and their outcomes.
- `commissioner_stance_score` — current FTC chair / EU commissioner / CMA panel-chair stance, calibrated against their voting / writing record.
- `political_regime_id` — current US administration / EU commission / UK government regime tag for regime-conditioned base rates.

**Spread-evolution-derived:**

- `gross_spread_bps` — current gross spread in basis points.
- `annualised_spread_pct` — gross spread annualised by days-to-expected-close.
- `spread_zscore_vs_30d` — z-score of current spread vs trailing 30 days for the same deal.
- `spread_zscore_vs_entry` — z-score of current spread vs Naomi's entry distribution.
- `spread_regime_break_flag` — boolean: did the spread move > 3σ today on no public news.
- `market_implied_probability` — derived from spread + assumed downside; the market's pricing of close-probability.
- `subjective_minus_implied` — Naomi's stated probability minus market-implied; positive = she's more bullish than market.

**Capital-structure-derived:**

- `bond_equity_basis_bps` — long-bond / short-equity basis on issuers in distressed-or-event situations.
- `pref_common_basis_bps` — preferred-vs-common dislocation.
- `convert_equity_basis` — convertible-vs-common dislocation, vol-adjusted.

**Borrow / financing:**

- `borrow_availability_score` — categorical depth of stock-loan availability for the acquirer (or any short leg).
- `borrow_rate_bps` — current indicative borrow rate.
- `recall_probability` — historical recall frequency for this name in a deal context.
- `cds_level_acquirer` — acquirer CDS level (matters for LBO closability).

**Litigation-derived:**

- `litigation_active_flag` — is there pending merger-related litigation.
- `next_hearing_days` — days to the next scheduled hearing.
- `ruling_velocity_score` — court-specific historical pace of rulings on similar matters.

**Cross-deal-pattern:**

- `simultaneous_second_request_count` — count of FTC second requests issued in trailing 90 days.
- `sponsor_concentration_book` — Naomi's exposure to a single PE sponsor across multiple deals.
- `sector_concentration_book` — concentration in a single sector.

### 4.3 Feature Engineering Surface

Same workflow as the foundation. Naomi's feature engineering is unusual in two ways:

- **Heavy reliance on legal-NLP.** Many features are extracted from contract text. The platform's NLP layer (clause classifiers, named-entity-recognition for deal parties, regulatory-language-strength classifiers) is a shared library that Naomi consumes; she rarely trains the underlying NLP models, but she does configure how the extracted fields combine into features.
- **Slow cadence by construction.** Most features recompute on event (a new filing, a ruling, an amendment) rather than on a tick. The compute cost per feature is small; the freshness contract is "within minutes of the source event."

### 4.4 The Drift Dashboard

Drift in Naomi's domain looks different from microstructure drift. Examples:

- An NLP clause-extractor's confidence distribution shifting (regulators changing template language).
- A precedent-similarity metric drifting because the underlying corpus has been re-tagged.
- A commissioner-stance score shifting after a new commissioner is appointed (intentional, not a bug — but worth flagging).
- Deal-spread distributions shifting in a way that breaks z-score thresholds.

### 4.5 Cross-Pollination View

Cross-desk relevance Naomi cares about:

- **Henry's** earnings-window event features and insider-transaction features (target-side activity in the run-up to a deal can be a leak signal).
- **Sasha's** vol-around-event features (deal-attached vol patterns).
- **David's** firm-level concentration and counterparty features.
- **Quinn's** factor-attribution features (event-driven returns can correlate with specific factors that Quinn isolates firmwide).

### 4.6 Interactions Naomi has with the feature library

- **Daily (background):** drift dashboard glance; alerts route for features feeding active deals.
- **Weekly:** cross-pollination browse; identify candidate features from Henry / Sasha / Quinn that might inform her scaffolds.
- **Ad hoc (during deal evaluation):** browse / search for features matching a thesis (e.g. "find every feature that captured target-side insider activity in the trailing 60 days").
- **Ad hoc (during retire / replace):** when a feature's underlying source is being delicensed, review downstream impact.

### 4.7 Why this matters

- **Efficiency:** Naomi does not re-extract MAC-clause strength fourteen different ways. The feature is canonical, versioned, and reusable.
- **Risk:** drift in legal-NLP confidence is silent and dangerous; the dashboard surfaces it before a misclassified MAC clause damages a sizing decision.
- **PnL:** features compound across deals. A high-quality `regulatory_efforts_strength` feature improves every deal-screening run.

## 5. The Research Workspace

The workspace is where Naomi turns raw filings, dockets, and precedent data into validated scaffolds and improves the screening / pattern-matching / calibration models that surface opportunities. Backtesting deal-history is feasible (unlike Rafael's themes), so the workspace is meaningfully used — but with the caveat that historical sample sizes per deal type per jurisdiction per regulatory regime are small.

### 5.1 Notebook Environment

Standard notebook-first environment, with the platform integrations already described in the foundation doc and Marcus's appendix. Naomi's typical experiments:

- "Across the last 200 second-request-issued M&A deals, what is the empirical close rate conditional on industry, HHI delta, and political regime?"
- "Of all deals with this specific MAC carve-out language, how many were used by the buyer to walk?"
- "How does my calibration curve look across deal types, and which subsegment is most miscalibrated?"
- "Is the spread-regime-break signal predictive of subsequent deal-break, or is it noise?"
- "Of the 120 deals my screen surfaced last quarter, which subset did I take, and how did the unsized subset perform?"

### 5.2 Backtest Engine UI

Backtesting in Naomi's domain is **deal-history simulation**, not tick-level execution simulation. The engine runs hypothetical deal-sizing rules over the historical deal universe with realistic per-deal constraints.

**Form:** scaffold or sizing-rule selector, deal-universe filter (jurisdiction / type / period / size band), entry trigger definition, exit rule, hedge structure, capital cap, borrow assumption. Execution-realism parameters: assumed entry slippage, assumed exit slippage at close vs at break, assumed borrow cost, assumed hedge cost.

**Final results:** hit rate by deal type, average won / lost, spread-realisation rate, calibration vs realised, time-to-close vs predicted, drawdown periods, regime-conditional performance. Sample-size warnings prominent — "n=14 deals in this jurisdiction-and-regime cell; high uncertainty."

**Honest limitations:** the backtest engine surfaces the small-n caveat continuously. Event-driven backtests are not microstructure backtests; conclusions are weaker; the platform reflects this in confidence bands and warning labels.

### 5.3 Walk-Forward Visualization

Walk-forward over rolling regulatory regimes (e.g. expanding-window splits aligned to administration changes). Visualisation emphasises regime-conditioned performance: in-sample-regime Sharpe vs out-of-regime Sharpe, with explicit regime-membership labels per period.

### 5.4 Strategy Template Library

Templates for Naomi are **scaffolds and sizing rules**, not alpha generators.

- **Deal-screening template.** Rules to surface new deals into Naomi's review queue: deal type filter, expected-spread-regime filter, jurisdictional-review-surface filter, expected-close-horizon filter. Output: a ranked queue of "deals worth reading the agreement for this week."
- **Per-deal sizing-rule template.** Inputs: subjective probability, market-implied probability, max position size, deal-break downside estimate, hedge structure. Output: recommended position size with EV, worst-case loss, and concentration check. Naomi reviews and approves / modifies.
- **Spread-monitor template.** Per deal, watch for spread-regime breaks, alert on triggers, suggest action (review thesis, add, trim, hedge).
- **Calibration-tracking template.** Roll Brier-score and calibration curve across closed deals, decompose by deal type / jurisdiction / regulatory regime.
- **Precedent-retrieval template.** For a focal deal, retrieve top-N precedents with similarity scores, outcomes, and review-path histograms.
- **Litigation-watcher template.** Per deal in litigation, monitor relevant courts, surface new filings ranked by likely material impact.
- **Pipeline-rumor scoring template.** Rules to surface rumoured-and-strategic-alternative situations into a watchlist with conviction scores.

Many of Naomi's "live scaffolds" are instances of these templates parameterised per deal type or per jurisdiction.

### 5.5 Compute Management

Compute footprint is small relative to Marcus's. NLP batch-reprocessing on the merger-agreement corpus is the largest job class and runs on schedule, not on demand. Per-deal precedent retrieval is sub-second.

### 5.6 Anti-Patterns the Workspace Prevents

- **Hindsight contamination.** When backtesting precedent-based screening, the engine refuses to use precedents that postdate the focal deal's announcement. Static analysis catches accidental forward-leak via the precedent database.
- **Cherry-picking regimes.** Walk-forward enforces honest regulatory-regime splits.
- **Survivorship in the deal universe.** Withdrawn / abandoned deals are preserved in the historical universe; the platform refuses to backtest on a "completed deals only" universe.
- **Multiple-testing across regulatory regimes.** Each per-regime backtest is logged; multiple-testing penalty surfaces.
- **Uncalibrated confidence claims.** Calibration is a post-trade metric the platform forces you to track; you cannot publish a screen as "live-eligible" without a stated calibration target.

### 5.7 Interactions Naomi has with the workspace

- **Pre-market:** review overnight precedent-retrieval results for newly-announced deals.
- **In-market (selectively):** run targeted research into a focal deal's precedents; refine a screening rule; investigate a calibration anomaly.
- **Post-market:** queue overnight reprocessing; update the calibration tracker.

### 5.8 Why this matters

- **Efficiency:** time-to-validated-scaffold compresses; the precedent database is queryable in minutes rather than the days it takes to manually pull rulings from PACER.
- **Risk:** anti-patterns (hindsight, survivorship, multiple-testing across regimes) are caught by the platform.
- **PnL:** more validated scaffolds means a wider live aperture; her judgment is applied to a larger set of pre-screened deals.

## 6. The Model Registry

The registry catalogs every model the firm has trained that Naomi's scaffolds depend on. Less central than for Marcus — most of Naomi's "models" are screening / classification / similarity / calibration models, not predictive alpha models — but still required for reproducibility.

### 6.1 Browser

Same shape as Marcus's. Naomi's filters: model class (clause-classifier / commissioner-stance / similarity / calibration / screening); domain; deployment stage; drift state.

### 6.2 The Model Record Page

Standard fields. Per Naomi-relevant model the record additionally surfaces:

- **Training data slice** — which subset of the merger-agreement corpus or precedent database was used; with version of the corpus.
- **Class-balance** — for classifiers (e.g. close-vs-break), the training-time class balance and the calibration approach.
- **Held-out regime evaluation** — performance on a held-out regulatory regime to test generalisation.

### 6.3 Versioning & Immutability

Standard. Particularly important for clause-classifier and commissioner-stance models, which can subtly change retrieved-precedent results across deals.

### 6.4 Drift Surface

Drift is more about input-distribution drift (regulators changing template language, court-docket-feed schema shifts) than rapid prediction-distribution drift. Detection is slower-moving but no less important.

### 6.5 Lineage Graph

Per model, upstream (training data, features) and downstream (which scaffolds, which deals' P/L are affected if the model is replaced).

### 6.6 Why this matters

- **Efficiency:** the registry is the system of record for "what model is currently scoring this commissioner's stance," and version pinning means a deal's analysis is reproducible after the fact.
- **Risk:** without the registry, the firm cannot answer regulator / risk-committee questions about how a sizing decision was supported.
- **PnL:** model retraining cadence is data-driven. Drift triggers retraining; old versions stay retrievable.

## 7. The Experiment Tracker

Standard shape per the foundation. Naomi's experiments tend to be:

- Theme-evolution experiments — "in what regulatory regime does this precedent-similarity metric stop generalising?"
- Deal-pattern-match experiments — "does this MAC-clause-strength feature improve close-probability prediction beyond baseline?"
- Calibration experiments — "what re-weighting of training data improves Brier score on the most miscalibrated subsegment?"
- Sensitivity experiments — "if I shift the second-request close-rate base rate by 10pp, how does my recommended sizing change across the live book?"

Run-comparison views are heavily used during model-replacement decisions: side-by-side performance of an old commissioner-stance scorer vs a new one, with downstream impact on scaffold recommendations and historical sizing decisions.

Anti-patterns prevented (p-hacking, period-cherry-picking, hidden in-sample tuning) are critical given small-n evaluation.

## 8. Strategy Composition

Composition for Naomi is **light**. Her "strategies" are not multi-leg algos with sizing logic and execution policy; they are deal-monitoring scaffolds + per-deal sizing rules + monitoring-rule sets. The composition surface reflects this.

### 8.1 The Scaffold + Sizing-Rule Composition Surface

A structured form-plus-code UI, simpler than Marcus's strategy graph.

**Layout (sketch):**

- **Top bar** — scaffold ID, name, version, owner, current stage, action buttons.
- **Left pane** — scaffold definition: which deal universe it covers, what triggers (filings, ruling, spread regime break) it acts on, what queue / alert / dashboard it feeds.
- **Right pane** — properties:
  - **Deal-universe filter** — jurisdictions, types, size bands, regimes.
  - **Trigger** — what event drives a scaffold action (new filing, new ruling, spread regime break, calibration anomaly).
  - **Action** — what the scaffold does (push to review queue, alert Naomi, post to deal-detail page, update the spread monitor).
  - **Risk gates** — applies only when the scaffold proposes a sizing recommendation; daily-loss accumulator and book-level concentration checks.
  - **Compliance gates** — restricted-list check on the underlying name; MNPI-wall check; Reg 14E timing check; 13D/G threshold check.
  - **Cadence** — event-driven by default; some scaffolds also run nightly.
  - **Mode** — live / paper / shadow.
- **Bottom panel** — validation feedback, backtest results (where applicable), deployment state.

### 8.2 Per-Deal Sizing-Rule Composition

A separate, simpler surface specific to per-deal sizing. The platform proposes; Naomi approves. Inputs:

- Subjective close-probability (Naomi's number).
- Market-implied close-probability (from spread).
- Deal-break downside estimate.
- Spread-capture upside estimate.
- Concentration constraints (deal-type, sector, sponsor, jurisdiction).
- Borrow availability and cost.
- Hedge structure recommendation.

Output: recommended position size, expected EV, worst-case loss, and an audit-logged sign-off button. Material sizing changes (above a threshold) route to David. The composition surface is intentionally **lighter** than Marcus's: per-deal sizing is a judgment exercise scaffolded by the platform, not a templated strategy class.

### 8.3 Pre-Deployment Validation

For scaffolds that propose actionable sizing recommendations:

- **Lookahead leak detection.** Static analysis to ensure no precedent or filing dated after the deal-announcement is consumed when training a screening model.
- **Compliance flags.** Restricted-list exposure, MNPI-wall conflicts, jurisdictional access.
- **Capacity sanity.** Does the scaffold's universe respect the desk's borrow / financing constraints?
- **Calibration target.** Every screening / probability scaffold must declare a calibration target; missing target = blocked.

### 8.4 Naomi's Scaffold Templates (Illustrative)

Pre-built scaffolds that cover the common monitoring patterns described in section 1. Many of her live monitoring instances are these templates parameterised per deal type or jurisdiction.

### 8.5 Why this matters

- **Efficiency:** the same scaffold can be parameterised across jurisdictions without re-implementing the underlying logic.
- **Risk:** validation catches the high-cost errors (lookahead, MNPI exposure, missing kill-switch wiring on actionable scaffolds) before they reach production.
- **PnL:** scaffolds compress the monitoring labour, freeing Naomi's cognitive budget for the high-conviction deals.

## 9. Promotion Gates & Lifecycle

Lifecycle is per-monitoring-system, not per-alpha-strategy. Cadence is slower than Marcus's; sample sizes are smaller.

### 9.1 Pipeline View

Standard kanban: Research / Paper / Pilot / Live / Monitor / Retired. Cards are scaffolds. Days-in-stage shown.

### 9.2 Gate Checklists

- **Research → Paper:** code review, backtest framework approved, walk-forward over multiple regulatory regimes, calibration target stated, kill-switch wired.
- **Paper → Pilot:** N weeks (typically 4–8) of paper behaviour against the live deal universe, calibration tracking starting.
- **Pilot → Live:** pilot sized to small actionable allocation; calibration tracker shows promising trend; David sign-off for material allocations.
- **Live → Monitor:** trader-initiated (calibration drift) or system-initiated (drift / decay alerts).
- **Monitor → Retired:** calibration-loss confirmed; no path to recalibration.

### 9.3 Decision Log

Append-only; same shape as Marcus's.

### 9.4 Cadence for Naomi

Lifecycle cycles slower because event-driven evaluation periods are longer. Typical fleet state at any time:

- ~10 scaffolds in research.
- ~5 in paper.
- ~5 in pilot.
- ~30–40 live scaffolds covering screening / regulatory-pattern / spread-monitor / calibration / litigation / pipeline / hedge-recipe and other categories.
- ~10 on monitor.
- Dozens in retired archive.

Naomi makes 1–3 promotion decisions per week and 1–2 retire decisions per quarter on the scaffolding side.

### 9.5 Why this matters

- **Efficiency:** lifecycle gates standardise quality control for a domain where ad-hoc screen-tweaks otherwise proliferate.
- **Risk:** every live scaffold has been validated, has a calibration target, and a kill-switch.
- **PnL:** discipline compounds; scaffolds that quietly stop calibrating get caught by the lifecycle, not by a missed deal.

## 10. Capital Allocation

Capital allocation for Naomi is **per-deal + per-deal-type + per-jurisdiction**, not per-strategy as for Marcus.

### 10.1 The Allocation Engine UI

**Layout:**

- **Top panel** — total capital available, allocated across active deals, free, in-flight (settling). Per-archetype budget set by David.
- **Main table** — every active deal with current allocation, recommended allocation, delta, expected EV, expected close horizon, jurisdictional review surface, concentration check, hedge structure.
- **Right panel** — risk decomposition: deal-break aggregate exposure, sector concentration, sponsor concentration, jurisdictional concentration, regulatory-regime exposure.
- **Bottom panel** — sizing methodology: conviction × probability-of-close × asymmetry, with concentration penalties.

### 10.2 Per-Deal Sizing Logic

- **Conviction:** Naomi's stated conviction (1–5 scale) on her close-probability.
- **Probability-of-close:** her subjective probability (informed by precedent and document reading).
- **Asymmetry:** spread-captured if closes vs downside if breaks; expected value at probability point.
- **Concentration cap:** max % of book in any single deal.
- **Sector / sponsor / jurisdiction caps:** secondary diversification constraints.
- **Regulatory-regime cap:** maximum exposure to a single regime stance.
- **Borrow-cost discount:** hard-to-borrow names sized smaller.

The engine proposes sizes; Naomi approves (or modifies). Material changes route to David.

### 10.3 Hedge-Structure Allocation

Per deal, the engine pre-computes hedge candidates from the hedge-recipe library: index puts at specified strikes, sector-ETF shorts at specified beta, capital-structure pairs, custom basket shorts. Cost / protection ratio is shown; Naomi picks (or modifies / rejects).

### 10.4 Allocation Drift

Allocations drift as spreads move. The engine continuously shows:

- Drift from optimal vs cost of rebalancing.
- Whether catalysts in the next 7 days argue for rebalancing now or after.

### 10.5 Capacity & Headroom

- **Per-deal capacity** — how much of this deal's capital structure can the desk own without market-impact concerns?
- **Per-deal-type capacity** — book-level cap on M&A vs spinoff vs SPAC vs distressed vs capital-structure.
- **Free capacity** — deals where Naomi has conviction but is under-sized.

### 10.6 Why this matters

- **Efficiency:** allocation across 200+ deals is not solvable by spreadsheet; the engine compresses what would otherwise be hours of weekly work.
- **Risk:** deal-break aggregate, sponsor concentration, and regulatory-regime concentration are continuously checked, not weekly-spreadsheet-checked.
- **PnL:** marginal sizing analysis ensures incremental capital goes where conviction × asymmetry × close-probability is highest.

## 11. Live Fleet Supervision Console

The console where Naomi supervises every live deal scaffold and every active deal in the book. Anomaly-driven, default-green.

### 11.1 The Fleet Dashboard

**Layout:**

- **Top filter bar** — health badge filter (default amber + red); deal type; jurisdiction; lifecycle stage; sponsor; regulatory regime.
- **Main grid / table** — one row per active deal. Columns:
  - Deal ID, target / acquirer.
  - Deal type (cash / stock / mixed / scheme / tender / SPAC / spinoff / distressed).
  - Status (announced / definitive / vote / regulatory / final / litigation / etc.).
  - Days-to-expected-close.
  - Gross spread bps; annualised spread %.
  - Spread regime (in-distribution / drifting / regime-break).
  - Subjective close-probability; market-implied close-probability; delta.
  - Position size; deal P/L today / inception.
  - Next catalyst date + type.
  - Regulatory phase (HSR-cleared / second-request / EU-phase-1 / EU-phase-2 / blocked / etc.).
  - Calibration-flag (this deal's subsegment is well-calibrated / drifting).
  - **Health badge** — green / amber / red, computed from spread-regime-break, calibration anomalies, regulatory-news flow, document-NLP completeness, hedge-effectiveness.
  - Last intervention timestamp + actor.
- **Group-by views:** by deal type, by jurisdiction, by sponsor, by sector, by regulatory regime.

### 11.2 The Strategy Detail Page (Deal Detail Page)

Click a deal → drill into its full state.

**Header** — deal identity, status, action buttons (add / trim / hedge / flatten / pause-monitoring / refresh-precedents).

**Top section: live state**

- Spread evolution chart (with backtest expectation overlay where applicable).
- Position breakdown — long target / short acquirer / hedge legs / capital-structure legs.
- Regulatory phase tracker.
- Recent intervention log.

**Middle section: information feed**

- Latest filings (deal-tagged, NLP-extracted summaries).
- Latest court-docket entries.
- Latest regulatory press relevant to the jurisdiction.
- Latest sell-side notes / expert-network calls (compliance-curated).
- "Why the spread moved today" diagnostic — surfacing the top contributing news / filing items.

**Bottom section: diagnostic depth**

- Precedent retrieval (top-N closest precedents and outcomes).
- Calibration sub-segment for this deal type / jurisdiction / regulatory regime.
- Hedge-effectiveness for the structure deployed.
- Document library — every filing / agreement / court paper attached, full-text searchable, NLP-extracted-clauses pinned.

### 11.3 Anomaly Detection Surface

Categories:

- **Spread anomalies** — regime breaks, drift outside z-score band.
- **Filing anomalies** — unexpected filing on a tracked deal (e.g. an 8-K on a deal that has nothing scheduled).
- **Court-docket anomalies** — new filings on litigation deals.
- **Regulatory-news anomalies** — commissioner statements, press, leaks.
- **Calibration anomalies** — sub-segment calibration drifting.
- **Borrow anomalies** — recall events, borrow rate spike.
- **Compliance anomalies** — restricted-list status changes, 13D/G threshold approaches.
- **Document-NLP anomalies** — a tracked agreement's clauses aren't extracting cleanly.
- **Precedent-set anomalies** — the precedent set for a deal has shifted (new ruling materially changes the fit).

Per-anomaly severity / routing / auto-action (e.g. critical compliance anomaly auto-pauses the per-deal sizing-rule).

### 11.4 Cross-Deal Correlation View

The book is supposed to be diversified across deal type / sponsor / jurisdiction; correlation drift erodes diversification. The view surfaces:

- Heatmap of deal × deal correlation (where multiple deals are exposed to the same regulatory regime, the same sponsor, the same sector).
- Drift indicators when supposedly-uncorrelated deals start co-moving (often because of a shared regulatory-regime signal).
- Aggregate exposure decomposition: total deal-break exposure, sector exposure, sponsor exposure, jurisdiction exposure, regulatory-regime exposure.

### 11.5 Deal Pipeline Live State

The Naomi-specific live state, replacing Marcus's "Multi-Venue Capital + Balance Live State."

**Layout:**

- **Pipeline kanban** — every active deal as a card in a column for its current status (Rumored / Announced / Definitive / Vote / Regulatory / Final / Litigation / Closed / Broken). Cards show ticker pair, spread, days-to-close, regulatory phase, subjective probability, position size, calibration tag, next catalyst.
- **Calendar overlay** — in another pane, the catalyst calendar across all deals: HSR clearance dates, second-request deadlines, EU phase-1/phase-2 ends, votes, court hearings, drop-dead dates, walk-right triggers. Each catalyst linked back to its deal card.
- **Pipeline metrics strip** — total active deals, total $ deployed, total deal-break exposure, average days-to-close, per-jurisdiction count.
- **Anomaly badges** — deals with active anomalies pulse / colour their card.

**Why it's foveal:** the deal pipeline is the spine of Naomi's terminal. Catalysts are deterministic; the calendar drives daily attention; spread evolution and regulatory-phase progression are the dominant signals. With ~200 active deals + ~100 rumour-tracked, the pipeline is unmanageable without this surface.

**Quick actions per card:** open deal detail, add / trim / hedge, pause monitoring, push to David for sign-off, push to counsel for opinion.

### 11.6 Strategy State Inspection

A diagnostic surface that lets Naomi inspect the **internal state of a running scaffold or per-deal sizing-rule** — its current variables, recent trigger evaluations, calibration sub-segment state, recent action history — and compare live behaviour against backtest expectation. Critical for verifying that a scaffold is configured correctly, that live and backtest aren't drifting, and that her mental model matches what the code is doing.

This is a verification surface, not a continuously-streamed real-time view. It is implemented per scaffold; the scaffold declares which variables it exposes; the platform renders them on demand.

#### 11.6.1 Internal-state view (per scaffold or per-deal)

A panel inside the deal detail page or the scaffold detail page that the trader opens on demand.

**What it shows (illustrative, varies):**

- **Current state variables** — for a screening scaffold: current universe filter, current trigger thresholds, trailing-30-day surfacing rate. For a per-deal sizing-rule: current subjective probability, market-implied probability, EV calculation, sized vs cap, hedge structure recommendation. For a litigation watcher: docket-feed state, last-checked timestamp per court, queue of unprocessed entries.
- **Current feature snapshot** — the input feature values the scaffold is currently seeing for its focal entities (e.g. for a deal: gross spread bps, annualised spread %, regulatory-efforts strength, MAC-clause strength, latest commissioner-stance score, latest precedent-similarity scores).
- **Last N trigger evaluations** — for the most recent decisions: input features, trigger conditions, action taken (or not), reason. Scrollable.
- **Current position and pending actions** — for a sizing-rule: current position, pending sizing recommendation, blocking gates (compliance, concentration).
- **Risk-gate state** — daily-loss accumulator, deal-break aggregate state, concentration gates, MNPI-wall state.
- **Calibration sub-segment state** — for screening / probability scaffolds: current Brier score on the sub-segment, count of evaluations since last recalibration.
- **Scaffold-specific custom state** — for a precedent-retrieval scaffold: current precedent universe, similarity model version, last index-rebuild timestamp.

**Refresh model:**

- **Refresh button** for on-demand snapshot — the most common interaction.
- **Auto-refresh toggle** for selected scaffolds during active diagnosis. Configurable cadence (most Naomi scaffolds are slow-moving; default 30s or 1min, with off as a valid option).
- **Schedule push** for selected scaffolds — the platform pushes state updates only when the scaffold actually changes state (a new trigger evaluation, a calibration-bucket update). Lightweight, event-driven.
- **Engineering pragmatism:** the platform does not stream all variables of all 30–40 live scaffolds in real time — that's wasteful and the cadence would be misleading (most scaffolds change state only on filings / rulings). Streaming is opt-in per scaffold during active inspection; default is on-demand refresh.

**Per-scaffold implementation:**

- Each scaffold declares its exposed state via a contract (variables, types, descriptions). The platform renders whatever the scaffold declares.
- Some scaffolds expose comprehensive state (screening scaffolds with many internal variables); some expose minimal state (a per-deal sizing-rule with just the key inputs and the recommended size). Pragmatic — engineering cost should match diagnostic value.

#### 11.6.2 Backtest-vs-live comparison

For any live scaffold or sizing-rule, a side-by-side comparison of live behaviour against backtest expectation. Critical for catching configuration drift early.

**Layout:**

- **Top:** for screening scaffolds, the live surfacing rate vs the backtest-counterfactual surfacing rate over the last 30 / 60 / 90 days; for sizing-rules, live realised EV vs backtest expected EV.
- **Per-action comparison:** recent live actions, what the backtest would have done at the same moment. Mismatches flagged.
- **Per-feature drift:** live feature values vs backtest training distribution; distribution-shift score per feature.
- **Per-calibration drift:** for probability scaffolds, live calibration vs backtest expectation.
- **Diagnosis hints:** likely root causes when divergence is meaningful — feature drift (e.g. commissioner-stance scorer shifting after appointment), document-NLP completeness drop, configuration mismatch, data-pipeline issue.

**Use cases:**

- After a new scaffold goes live: confirm first-month behaviour matches backtest. If it doesn't, diagnose.
- When a scaffold enters monitor stage: was the divergence caused by deployment or by the regime?
- When validating a candidate retrain.

**Refresh model:** computed daily by default; on-demand available.

#### 11.6.3 Why this matters

- **Efficiency:** when a scaffold misbehaves, Naomi can see exactly what it's "thinking" without re-running a backtest or opening the code. Diagnostic loop closes in minutes.
- **Risk:** silent configuration drift is a major failure mode. The comparison catches it before scaled allocation is wrong.
- **PnL:** scaffolds matching their backtest can be relied on. Those whose live diverges are caught early.
- **Engineering verification:** as a side effect, this surface is one of the cleanest end-to-end tests of the platform — if Naomi can see the right state for a scaffold, the data plumbing, model registration, scaffold composition, action layer, and reporting layer are all working end-to-end.

### 11.7 Why this matters

- **Efficiency:** anomaly-driven attention compresses 200+ deals + 100+ rumours + 30–40 scaffolds into ~5–25 to investigate at any moment. Naomi does not stare at every deal every day.
- **Risk:** anomalies are caught before damage compounds. Auto-pause on critical compliance / risk anomalies limits blast radius.
- **PnL:** time saved on supervision is reinvested in reading the agreements that matter.

## 12. Intervention Console

When Naomi decides to act, the intervention console is the surface. Distinct from automatic actions (auto-pause on compliance anomaly, auto-hedge per pre-approved structure, auto-flag on calibration drift) — this is **her** interventions.

### 12.1 Per-Deal / Per-Scaffold Controls

For any deal:

- **Add / trim / flatten** — with confirmation + audit trail.
- **Hedge change** — modify the hedge structure; cost preview shown.
- **Subjective-probability update** — Naomi enters a new subjective close-probability with reason; the sizing-rule recomputes recommended size.
- **Pause monitoring** — for deals where Naomi wants the scaffolds to stop firing alerts (e.g. a deal she is recused from).
- **Compliance escalation** — push to compliance / counsel.

For any scaffold:

- **Pause / resume.**
- **Cap change** — the scaffold's allowed action scope.
- **Threshold change** — adjust trigger thresholds.
- **Mode change** — live / paper / shadow.
- **Demote to monitor.**

Every intervention logged: timestamp, actor, action, reason, pre-state, post-state.

### 12.2 Group Controls

Per the template, group controls are **per-deal-type**:

- **Pause all M&A scaffolds** — e.g. before a major regulatory regime change.
- **Pause all SPAC scaffolds.**
- **Pause all distressed scaffolds.**
- **Pause all by jurisdiction** — e.g. on news of a major UK CMA panel change.
- **Pause all by sponsor** — e.g. on news of a sponsor under stress.
- **Cap all by tag** — multiplicative cap reduction across a tagged set (deal type / regime / sponsor).

### 12.3 Manual Trading & Reconciliation

**Even in fully automated mode, the trader must retain the ability to place, adjust, and close trades manually from the UI.** This is non-negotiable. Three primary scenarios:

**1. Emergency intervention.**
A major regulatory ruling drops mid-day; the auto-flatten on a deal-break tag fails; counsel calls with material new information that the model cannot interpret. Naomi needs to flatten or adjust positions by hand right now.

**2. Reconciliation between platform state and prime-broker / venue state.**
The platform's view of what's open and the prime broker's record should always match — but in practice they occasionally diverge (a fill the platform didn't register; a cancelled order the platform thinks succeeded; an in-flight tender notification not yet acknowledged). Naomi needs to align the two manually.

**3. Discretionary override on top of the scaffolded book.**
A post-reading judgment call where Naomi wants to add or trim outside the sizing-rule's recommendation. Because scaffolds are decision-support and not alpha generators, **manual override is more frequent for Naomi than for Marcus** — this is her domain. Tagged and audited as such.

The platform must support all three with **full manual-trading capability identical to the manual mode** described earlier in this doc. Naomi retains every Phase 2 surface: single-name ticket, cash-and-stock pair ticket, capital-structure ticket, hedge ticket, tender-offer participation, distressed / claims ticket, hotkeys, smart router, pre-trade preview, multi-venue ladder where relevant. The manual surfaces don't disappear in automated mode; they are present and reachable.

#### 12.3.1 The Full Manual Order Ticket

Adapted to Naomi's instrument types:

- **Single-name ticket (cash deals).** Pre-trade preview shows spread captured, days to close, annualised return, hedge requirement.
- **Cash-and-stock pair ticket.** Long target / short acquirer at deal ratio, ratio enforced for automatic sizing, atomic execution, **borrow availability + recall-risk flag** for the acquirer short leg, inline.
- **Capital-structure ticket.** Long bond / short equity, long pref / short common, long convert / short common.
- **Hedge ticket.** Index puts, sector-ETF shorts, custom structures from the hedge-recipe library; pre-trade preview shows cost / protection ratio.
- **Tender-offer participation workflow.** Tender / don't-tender decisions through prime broker, status tracking, Reg 14E timing checks at the ticket.
- **Distressed / claims ticket.** Bonds, loans, claims through specialist intermediaries; bankruptcy claim acquisition workflow.
- **All order types available:** market, limit, stop, OCO, bracket, peg-to-mid, post-only, IOC, FOK, GTC, GTD.
- **Pre-trade preview:** spread captured, days to close, annualised return, IRR, break price, max loss if deal terminates, probability-weighted EV, hedge effectiveness, capital usage, borrow cost, compliance gates (restricted lists, info barriers, tender rules, 13D/G thresholds, position limits).
- **Smart order router:** aggregated venue depth where relevant.
- **Hotkeys preserved** — every Naomi-specific binding (buy target / sell acquirer at NBBO, cancel-all-on-deal, hedge-deal-break-risk, flatten-deal) remains bound.

The manual terminal is a tab in the supervisor console, not a separate application. Naomi presses a hotkey or clicks an icon → manual ticket comes up over the current view → places the trade → ticket closes back to supervisor view.

#### 12.3.2 Trade Tagging & Attribution

Every manually-placed trade gets a mandatory tag:

- **Emergency intervention** — flagged for post-incident review; auto-included in the day's incident log.
- **Reconciliation** — paired with the platform / broker state being reconciled; reconciliation tickets generate an audit pair.
- **Manual override** — Naomi's discretionary sizing decision outside the rule's recommendation. Tagged with the deal, the sizing-rule version, and the rationale.

Attribution carries the tag through P/L, performance metrics, reports. David's behavioural monitoring (section 17.3) tracks the frequency of each tag class — sustained increase in overrides or emergencies is a leading indicator David investigates.

Given Naomi's mostly-judgment tier, **manual-override frequency will be higher than for heavily-automatable archetypes**, by design. Calibration against the rule is the metric of interest, not raw override count.

#### 12.3.3 Reconciliation Workflow

A specific surface for the reconciliation case. **Layout:**

- **Left panel:** the platform's view — every position the scaffolds / sizing-rules think Naomi has, per prime broker, per deal, per leg.
- **Right panel:** the prime broker's view — every position the broker actually shows, per account, per leg.
- **Diff highlighted:** rows where the two disagree.
- **Per-row actions:** trust broker / trust platform / investigate.
- **Bulk actions** — when divergence source is known.
- **Auto-trigger:** continuous reconciliation; minor short-lived discrepancies do not surface; large or persistent ones escalate.

#### 12.3.4 Emergency Modes

A specific UI mode that Naomi can switch into during a crisis (a major regulatory ruling, a sudden deal-break announcement, a court order with immediate effect, an exchange halt during a tender deadline, a counsel call requiring immediate position change).

**Emergency mode reorganises the screen:**

- **Manual ticket pinned** — large, foveal.
- **Pair-ticket and hedge-ticket adjacent.**
- **Live deal pipeline state across all deals** — second-largest panel, showing what's open and the current spread.
- **Working orders across all prime brokers** — what's resting that Naomi might need to cancel.
- **Deal intervention console** — pause / kill controls visible.
- **Alert console** — relevant alerts streaming, prioritised by deal severity.
- **Compliance / restricted-list / MNPI-wall state** — foveal because in an emergency, compliance state changes are silent killers.

Hotkeys preserved. Switching into / out of emergency mode is one keystroke; work-in-flight (research notebooks, document reading) preserved.

#### 12.3.5 Manual Trading Hotkeys (Always Available)

Even in default research mode, certain manual-trading hotkeys are global:

- **Open manual ticket** for currently-focused deal.
- **Buy target / sell acquirer at NBBO with deal-ratio sizing.**
- **Flatten focused deal** across all legs.
- **Cancel-all on focused deal.**
- **Hedge focused deal** at preconfigured per-deal hedge.
- **Switch to emergency mode** (keystroke chord; intentionally less easily triggered).

These remain bound regardless of which mode the supervisor console is in. Naomi's reflex to react manually is preserved.

#### 12.3.6 Audit & Friction

- **Emergency interventions** — minimal friction; one confirmation, audit logged.
- **Reconciliation** — friction matched to size; small reconciliations are one-click; large require reason field.
- **Manual override (sizing)** — full friction: reason field, confirmation gate, override tag mandatory. The reason field is rich (Naomi can record the post-reading judgment that led to the override).

Every manual trade enters the same audit trail as scaffold-driven trades, with the manual flag and tag class. Searchable, reviewable, exportable for risk-committee, compliance, regulator, or internal-audit review.

#### 12.3.7 Why this matters

- **Efficiency:** seconds-to-working-manual-ticket in an emergency = real PnL preservation.
- **Risk:** reconciliation between platform and prime brokers is a real operational risk; designed workflow prevents chronic divergence.
- **PnL:** Naomi's domain has irreducible discretion; manual override is the surface that captures her post-reading judgment without bypassing the audit trail.
- **Platform validation:** if every Naomi-relevant ticket type can be placed from the manual UI, the execution layer is verified end-to-end across single-name, pair, capital-structure, hedge, tender, and distressed flows.

### 12.4 Kill Switches at Multiple Scopes

Layered kill switches per [#19 Kill Switches](common-tools.md#19-kill-switches-granular):

- **Per-deal kill** — flatten this deal's positions; cancel its working orders.
- **Per-deal-type kill** — flatten the M&A book / SPAC book / distressed book.
- **Per-jurisdiction kill** — flatten all deals exposed to a single jurisdiction's review.
- **Per-sponsor kill** — flatten all deals tied to a single PE sponsor.
- **Per-archetype kill** — Naomi's entire automated cousin (all scaffolds + active deals). Multi-confirmation.
- **Firm-wide kill** — David + CIO + risk-officer; multi-key authentication for catastrophic events.

Each scope's kill is designed: cancel-or-flatten configurable (event-driven flattening can be costly given thin liquidity), audit-trail mandatory, reversal procedure documented.

### 12.5 Intervention Audit Log

Append-only log of every intervention; same shape as Marcus's. Particularly important for compliance / regulator review given the MNPI-and-wall-management surface area in Naomi's domain.

### 12.6 Why this matters

- **Efficiency:** intervention scoping (per-deal / type / jurisdiction / sponsor / archetype) lets Naomi respond proportionately. She doesn't nuke the whole book for one deal's hiccup.
- **Risk:** every intervention is auditable. Catastrophe response is designed and practised.
- **PnL:** the cost of over-intervention is missed spread; the cost of under-intervention is realised deal-break losses. Granular controls plus disciplined auditing balance both.

## 13. Post-Trade & Decay Tracking

Naomi's post-trade has a specific shape: **deal-by-deal retrospectives**, **probability calibration**, **scaffold-performance decay**, **hedge-effectiveness retrospectives**.

### 13.1 Per-Deal Retrospectives

Auto-generated for each closed deal (closed = closed-and-settled or broken-and-flattened).

**Layout:**

- **Header** — deal identity, deal type, jurisdiction, regulatory regime, period covered.
- **Outcome panel** — closed / broken / renegotiated; spread captured vs available; time-to-close vs predicted.
- **Probability decomposition** — Naomi's stated probability at each decision point; market-implied probability at the same points; realised outcome.
- **Drawdown decomposition** — periods of adverse spread movement; their cause (regulatory news / litigation / macro / sector).
- **Regulatory-path** — every filing, ruling, hearing, deadline; predicted vs realised path.
- **Hedge effectiveness** — hedge cost vs hedge protection ratio; was the hedge necessary, lifesaving, or wasted.
- **Lessons** — auto-generated discussion of where the model and Naomi agreed / disagreed; where her judgment beat the model; where the model would have helped.
- **Recommended action** — for similar future deals, what to repeat / change.

### 13.2 Per-Scaffold Retrospectives

For monitoring scaffolds, "decay" applies to monitoring-system performance:

- **Screening scaffold:** false-positive rate, true-positive rate, surfacing precision / recall.
- **Spread-monitor scaffold:** anomaly false-positive rate.
- **Calibration tracker:** is its own meta-calibration drifting?
- **Litigation watcher:** are material rulings being missed / over-flagged?

Decay metrics: rolling precision-recall curves with confidence bands; statistically-significant trend flags. Decisions: queue retrain, cap, demote to monitor, retire.

### 13.3 Calibration Tracker (Headline)

The headline post-trade metric for Naomi.

**Layout:**

- **Top:** calibration curve — predicted close-probability bins (decile or 5pp) vs realised close rate. Diagonal = perfectly calibrated. Off-diagonal = systematically over- or under-confident.
- **Brier-score time series** — rolling Brier score across closed deals, with confidence bands.
- **Decomposition by deal type** — separate calibration curves for cash M&A vs stock M&A vs scheme vs SPAC vs spinoff vs distressed.
- **Decomposition by jurisdiction** — US-only vs cross-border-EU vs cross-border-China vs multi-jurisdiction.
- **Decomposition by regulatory regime** — favourable vs hostile.
- **Sub-segment most-miscalibrated** flag — surfacing where Naomi (and the screening models that informed her) is systematically off.

Calibration directly drives improvement. The system measures her edge.

### 13.4 Retrain Queue UI

Standard. Retrain triggers in Naomi's domain:

- Calibration drift on a sub-segment.
- Commissioner-stance scorer drift after a new appointment.
- Document-NLP confidence drift on a regulator's new template.
- Precedent-similarity model drift after corpus re-tagging.

Explicit approval required for live scaffolds; auto-approval available for routine retrains in monitor / pilot.

### 13.5 Retire Decisions

Standard. Retirement candidates in Naomi's domain are typically scaffolds whose calibration cannot be recovered (a regime change deprecates the scaffold's underlying assumption — e.g. an antitrust-precedent matcher that was calibrated to one administration's enforcement posture).

### 13.6 Hedge-Effectiveness Aggregate

Per the manual sections, per-deal hedge-effectiveness is tracked. The aggregate view rolls this across the closed-deal universe:

- **Hedges that paid off** — list of deals where the hedge saved the desk, with magnitude.
- **Wasted hedges** — list of deals where the hedge was unnecessary, with cost.
- **Decomposition by deal type, regulatory regime, hedge structure.**
- **Recommendations** — hedge structures whose realised effectiveness justifies continued use; structures whose cost / protection ratio has degraded.

### 13.7 Why this matters

- **Efficiency:** retrospectives are auto-generated. Naomi reads, she doesn't compose.
- **Risk:** decaying scaffolds are caught by metric, not gut. Calibration drift → retrain or retire.
- **PnL:** calibration improvement compounds. A 5pp improvement in calibration on the most-traded sub-segment can move the desk's Sharpe materially over a year.

## 14. The Supervisor Console — Naomi's Daily UI

The supervisor console integrates all the surfaces above into one workspace. Layout adapts the manual physical setup; mode-switching reflects the catalyst-driven cadence of event-driven trading.

### 14.1 Naomi's Monitor Layout (Illustrative)

A senior event-driven trader runs 4–6 monitors. Naomi's typical layout in automated mode:

| Position      | Surface                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Top-left      | **Deal pipeline live state + catalyst calendar** (the foveal surface)                                                         |
| Top-center    | **Active deal detail / document-reading workspace** — agreement, filings, NLP-extracted clauses                               |
| Top-right     | **Anomaly / alerts console + regulatory-news watch (deal-tagged)**                                                            |
| Middle-left   | **Research workspace** — notebook, precedent retrieval, calibration tracker                                                   |
| Middle-center | **Capital allocation engine + per-deal sizing-rule queue**                                                                    |
| Middle-right  | **Promotion gate queue + experiment tracker + scaffold detail**                                                               |
| Bottom-left   | **Macro / market context** — equity indices, credit spreads, vol, rates (financing / risk environment)                        |
| Bottom-right  | **News / research feed + comms** — sell-side event-driven, internal counsel threads, expert-network notes, court-docket watch |
| Tablet        | News terminals, conference-call audio (proxy fights, shareholder meetings, court hearings), compliance / counsel chat         |

The supervisor console's centre of gravity is **deal pipeline + active deal reading + research workspace**. The manual terminal's foveal surfaces (pair ticket, ladder) are now in the periphery — present but not foveal except in active execution / emergency moments.

### 14.2 Mode-Switching

The console has modes; switching reconfigures the layout (per [#30 Customizable Layout](common-tools.md#30-customizable-layout--workspace)):

- **Research mode (default during quiet hours):** notebook + document-reading workspace foveal; supervisor + alerts in periphery.
- **Supervision mode (alert-driven):** deal pipeline + active deal detail foveal; research minimised.
- **Vote-day mode:** active deal detail foveal; pre-vote positioning summary; live news watch; intervention console adjacent. Triggered automatically when a tracked deal has a vote in N hours.
- **Hearing-day mode:** court-docket live feed foveal; active deal detail; prepared hedge tickets ready; intervention console adjacent.
- **Quiet mode:** research-dominant; calibration-tracker review; precedent-database deep-dive; pipeline-and-rumour scoring review.
- **Emergency mode:** manual ticket + deal pipeline state + working orders + compliance state foveal (per section 12.3.4).

Switching is one keystroke. Work-in-flight preserved.

### 14.3 Anomaly-Driven Default State

The console is **green-by-default**. Most of the day, Naomi is heads-down in research or document reading; the supervisor surface is quiet. When something goes off, alerts route via banner / audio / mobile push / phone page (catastrophe-tier only — major regulatory ruling, exchange halt during tender, MNPI-wall breach detected).

False-positive alerts erode trust quickly; tuning of severity / thresholds / suppression is critical. Naomi's tolerance for alerts is calibrated to event-driven cadence (an ETF-flow alert cadence would drown her).

### 14.4 Why this matters

- **Efficiency:** time on document reading is the trader's primary leverage. The console design ensures reading and research are foveal-by-default; supervision is peripheral.
- **Risk:** mode-switching to vote / hearing / emergency in seconds is the difference between contained and runaway loss.
- **PnL:** the cognitive shift from foveal-position to peripheral-pipeline is what makes 200+ deals + 100+ rumours tractable.

## 15. Naomi's Automated-Mode Daily Rhythm

Event-driven trading is **vote-/hearing-/regulatory-deadline-driven**. Naomi's day shape depends heavily on the day's catalysts.

### 15.1 Pre-Market (60–90 min)

The day starts with **pipeline triage and overnight news review**, not with watching a chart.

**Pipeline review (15–25 min):**

- Glance at the deal pipeline live state. Default: most deals green; investigate amber + red.
- Read overnight regulatory-news watch — filings, rulings, court dockets, press, expert-call notes.
- Read alerts queue from overnight — spread regime breaks, calibration anomalies, document-NLP completeness warnings.
- Make morning decisions: pause this scaffold whose calibration drifted; trim this deal whose spread regime broke; escalate this deal to compliance / counsel.

**Document-reading time (20–30 min, on focal deals):**

- For deals with new filings overnight, read the NLP-extracted summary; if material, open the source filing.
- For deals approaching catalysts, refresh precedent retrieval and read the closest precedents.
- For deals where the spread moved meaningfully, read the news watch and reconcile market move with thesis.

**Research catch-up (10–20 min):**

- Skim experiment-tracker results from overnight runs (precedent-retrieval re-indexing, NLP re-processing, calibration recompute).
- Promote winners; archive losers.

**Macro / regime read (10–15 min):**

- Sell-side morning notes, internal regulatory-tracking notes.
- Identify regime-shift signals (administration-change rhetoric, commissioner statements, geopolitical-event imminent).
- Consider: are any of my deals fragile to today's regime? Cap, hedge, leave alone.

**Promotion-gate decisions (5–10 min):**

- Scaffolds waiting for promotion sign-off: review evidence; sign off or send back.

**Coffee / clear head:**

- Step away. The day's cognitive load is reading-heavy; preserve focus.

### 15.2 In-Market (continuous, anomaly-driven and catalyst-driven)

The radical shift from manual trading.

**Default state:** Naomi is in the document-reading workspace or notebook. Working on:

- Reading a merger agreement on a newly-announced deal.
- Reviewing an NLP-extracted clause set against the source agreement.
- Reading precedent decisions retrieved by the platform for a focal deal.
- Reviewing an expert-network call note tagged to a deal.
- Refining a screening scaffold's threshold based on last quarter's calibration.
- Reviewing the calibration tracker on a sub-segment Naomi is concerned about.

**Background:** supervisor console open in another monitor; default green. Alerts route to mobile when she's heads-down.

**Catalyst response (catalyst-day mode):** when a vote, hearing, or regulatory deadline is today:

- Switch to vote-/hearing-day mode at start-of-day.
- Pre-position decisions made: hold to event / lighten before / hedge / fully out.
- Watch live news, court-docket, regulator-press feeds during the catalyst window.
- Post-catalyst: re-evaluate position; size up / down / out per the new evidence.

**Alert response (5–10% of the day):** when an alert fires:

- Drill into deal detail or scaffold detail.
- Diagnose: true anomaly (intervene) or known transient (acknowledge)?
- If intervene: pause / cap / replace / escalate. Document.
- If known transient: acknowledge with reason.

**Compliance-and-counsel coordination:** brief threaded exchanges with internal lawyers, external antitrust counsel, the compliance officer. The platform supplies the deal record, the filings, the extracted clauses, the precedent set; the conversation itself is human.

**Mid-day allocation review:** glance at allocation engine. Material drift → review proposal; approve / defer / escalate.

### 15.3 Post-Market (60–90 min)

End-of-day review and tomorrow's research priorities.

**End-of-day attribution (15–20 min):**

- Today's P/L decomposition — by deal, by deal type, by jurisdiction, by sub-strategy.
- Identify outliers; note for retrospective.
- Verify all positions and working orders are in expected state for overnight.

**Calibration check (10–15 min):**

- Run the calibration tracker; sub-segment status review.
- Any sub-segment whose Brier score is concerning?
- Any scaffolds needing retraining? Approve queue for overnight.

**Capital allocation (10–15 min):**

- Review nightly allocation proposal.
- Approve / modify / escalate to David.

**Research-priority setting (15–25 min):**

- Based on the day's catalysts and any new precedent revealed: tomorrow's research priority?
- Queue overnight reprocessing (precedent re-index, NLP re-extract on amended agreements).
- Update experiment-tracker priorities.

**Deal-journal updates (10–15 min):**

- Per active deal touched today, update the per-deal journal (thesis, probability, key risks, decision points).

**Sign-off:**

- Confirm all alerts acknowledged.
- Confirm pipeline state and working orders are as expected for overnight.
- Hand-off (if applicable) to a colleague covering Asia-hours catalysts; or rely on automated supervision overnight with phone-page escalation for catastrophe-tier alerts.

### 15.4 Cadence Variations

- **Vote-week:** vote-day mode dominates; supervision-heavy; less research.
- **Major-ruling week:** hearing-/ruling-day mode; supervision and rapid response.
- **Quiet week (no major catalysts):** research-dominated; calibration / scaffold improvement; pipeline-and-rumour scoring.
- **Quarter-end:** retrospectives; retire decisions; calibration sub-segment review; risk-committee deliverables.
- **Election / administration-change weeks:** regime-shift recognition; portfolio-wide regime exposure review; broad cap / hedge actions.

## 16. Differences from Manual Mode

| Dimension                  | Manual Naomi                            | Automated Naomi                                                                             |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Coverage                   | 30–80 active deals                      | 200+ active deals + 100+ rumours / strategic-alternative situations                         |
| Documents read             | What Naomi can personally read          | Naomi reads the deals that matter; platform NLP ingests 200+ deal documents per quarter     |
| Trades per day             | 5–30 high-conviction                    | Same order of magnitude (event-driven is multi-day to multi-quarter); volume not the metric |
| Phase 1 (Decide)           | Reading filings; tracking pipeline      | Same, on a wider scaffolded universe; screening surfaces candidates                         |
| Phase 2 (Enter)            | Deal-pair ticket                        | Same ticket, with sizing-rule recommendation pre-computed; manual override frequent         |
| Phase 3 (Hold)             | Calendar-driven supervision             | Anomaly-driven supervision over deal pipeline; calendar foveal                              |
| Phase 4 (Learn)            | Per-deal retrospective                  | Per-deal + scaffold-decay + calibration tracker + hedge-effectiveness aggregate             |
| Time on documents          | 50–60% (focal deals)                    | 30–40% (focal deals; platform handles the rest of the corpus)                               |
| Time on research           | 10–15%                                  | 25–35%                                                                                      |
| Time on supervision        | 15–20%                                  | 10–15%                                                                                      |
| Time on intervention       | (continuous)                            | 5–10%                                                                                       |
| Time on data / procurement | minimal                                 | 5–10%                                                                                       |
| Time on capital allocation | per-deal sizing                         | per-deal + per-type + per-jurisdiction; engine-supported                                    |
| Latency criticality        | Catalyst-day responsiveness             | Same; scaffolds reduce manual effort, not response latency                                  |
| Risk units                 | Deal-break $ + concentration            | Same + per-jurisdiction + per-sponsor + per-regulatory-regime aggregate                     |
| Edge metric                | Hit rate; spread-realisation            | Same + Brier score; calibration; hedge-effectiveness ratio                                  |
| Cognitive load             | Foveal-on-deal                          | Peripheral-on-pipeline; foveal-on-focal-deal-and-research                                   |
| Failure modes              | Missed filing; mis-read agreement       | Silent NLP regression; calibration drift; over-trust of screen; alert fatigue               |
| Tools mastered             | Pipeline; document library; pair ticket | Same + scaffolds + calibration tracker + precedent retrieval + screening models             |
| Compensation driver        | Sharpe + AUM                            | Same + calibration improvement + scaffold-coverage breadth                                  |

The fundamental change: **Naomi stops being the person who tracks every deal and becomes the person whose judgment sits on top of a continuous information substrate.** Reading the merger agreement is still her work. Tracking 200 deals so that she finds the one worth reading the agreement for is the platform's work.

## 17. Coordination with Other Roles

### 17.1 Coordination with Internal / External Lawyers and Compliance

Naomi's primary peers in coordination are not other traders but **lawyers and compliance officers**. The platform makes that coordination operational.

- **Shared deal record.** Internal lawyers and external antitrust counsel see the same deal record Naomi sees: filings, NLP-extracted clauses, precedent set, regulatory-phase tracker. Discussions reference the canonical record, not chat-attached snippets.
- **Counsel-opinion threads.** Legal opinions on a deal are first-class objects attached to the deal record, with version history. Naomi reads the latest opinion in the deal detail page; updates auto-flag.
- **Compliance enforcement.** Restricted lists, MNPI walls, tender-offer rules, 13D/G thresholds, sanctions, jurisdictional access — all enforced inline at the ticket. Compliance officers manage the policy; Naomi sees the enforcement; bypass requires dual sign-off.
- **MNPI-wall management.** When firm advisory side is on a deal, the name is blocked at every Naomi surface — research, screening, ticket, allocation engine. The block is auditable and lifted only by compliance.
- **Privileged-communication handling.** Counsel notes flagged as privileged are scoped — Naomi can read; David can read at firm-level review; broader access requires explicit compliance approval. The platform respects privilege boundaries.

### 17.2 Coordination with Quinn

Quinn runs cross-archetype factor / stat-arb / firm-systematic strategies. Some overlap with Naomi's domain (event-driven returns can correlate with merger-arb factors). They coordinate to avoid double-up:

- **Correlation matrix shared** — Quinn's fleet returns vs Naomi's deal P/L, rolling correlation visible to both.
- **Promotion-gate awareness** — Quinn promoting a new merger-arb-factor strategy alerts Naomi; if Naomi's deals would correlate, they negotiate.
- **Feature sharing** — features Naomi builds (commissioner-stance score, regulatory-efforts strength) are useful to Quinn; her firm-systematic features inform Naomi's regime conditioning.
- **Joint research** — cross-archetype topics (e.g. event-driven beta to broader market regimes).

### 17.3 Coordination with David

David is the firm-level supervisor. Naomi's automated cousin is a $X-allocated book within David's purview.

- **Pipeline-level reporting** — David sees Naomi's 200+ deals + 30–40 scaffolds aggregated, with health / P/L / risk-consumed visible.
- **Capital allocation gates** — material allocation changes route to David.
- **Behavioural monitoring** — David watches Naomi's intervention frequency, override frequency, deal-pause pace. Drift is a leading indicator.
- **Promotion-gate sign-off** — material live scaffolds and large-position sizing decisions require David's sign-off.
- **Catastrophe response** — firm-wide kills require David + CIO + risk officer; Naomi has archetype-level kill autonomy.
- **Risk-committee deliverables** — Naomi's monthly attribution + deal-break aggregate + calibration tracker output + sponsor / jurisdictional exposure are inputs to David's committee deck.

### 17.4 Why this matters

- **Efficiency:** without coordination, the firm runs the same deal across desks, doubles capacity, dilutes attribution. Coordination on shared records and visibility tools is cheap.
- **Risk:** correlated event-driven bets across desks compound concentrated regulatory-regime exposure; visibility prevents accidental over-exposure.
- **PnL:** privileged-communication handling and MNPI-wall enforcement prevent compliance failures whose cost dwarfs any single deal's spread. The platform's discipline is itself P/L preservation.

## 18. How to Use This Appendix

When evaluating Naomi's automated terminal (against any platform — including our own):

**Data layer:**

- Are SEC EDGAR, court-docket archives, DOJ / FTC / EU CMA / other-jurisdictional regulator decision databases, the merger-agreement corpus, the antitrust-precedent database, sell-side event-driven research, and expert-network call notes all cataloged with quality / lineage / cost / freshness / used-by tracking?
- Is the procurement dashboard a serious tool, with attribution-vs-cost evidence?
- Is gap analysis tied to concrete deals where information depth was insufficient?

**Feature library:**

- Are Naomi's features (deal-terms, regulatory-classification, spread-evolution, capital-structure, borrow / financing, litigation, political-regime, sponsor-history, cross-deal-pattern) first-class with drift monitoring?
- Is the legal-NLP layer treated as a shared, versioned, monitored library?
- Is cross-pollination across desks supported (Henry's event-window features, Quinn's factor features)?

**Research workspace:**

- Can Naomi go from a new deal announcement to a full precedent-retrieval-and-NLP-extracted-clause-set in minutes?
- Is the backtest engine honest about small-n event-driven samples (with explicit confidence bands, regime-conditioning, and warning labels)?
- Are anti-patterns (hindsight contamination, survivorship in deal universe, multiple-testing across regimes) caught by the platform?
- Are scaffold templates (deal-screening, per-deal sizing-rule, spread-monitor, calibration-tracking, precedent-retrieval, litigation-watcher, pipeline-rumor-scoring, hedge-recipe) provided?

**Model registry & experiment tracker:**

- Can any precedent-retrieval / commissioner-stance / clause-classifier / calibration model be re-trained from registered inputs and produce a bit-identical result?
- Are old versions never deleted?
- Does the experiment tracker log every regime-conditional retrain and surface multiple-testing penalties?

**Strategy composition:**

- Is the scaffold composition surface intentionally lighter than Marcus's, reflecting Naomi's mostly-judgment tier?
- Is per-deal sizing-rule composition a separate, simpler form?
- Does pre-deployment validation catch lookahead through the precedent database, MNPI exposure, and missing calibration targets?

**Lifecycle:**

- Is the pipeline visualization (research → paper → pilot → live → monitor → retired) usable at the slower event-driven cadence?
- Are gates checklists with evidence?
- Does retire surface scaffolds whose calibration cannot be recovered?

**Capital allocation:**

- Does the allocation engine size per-deal × per-deal-type × per-jurisdiction with conviction × probability-of-close × asymmetry?
- Are sponsor / sector / jurisdictional / regulatory-regime concentrations checked?
- Does the hedge-recipe library propose hedge structures that Naomi approves / modifies / rejects?

**Live fleet supervision:**

- Can Naomi supervise 200+ deals + 30–40 scaffolds anomaly-driven, default green, with deal-pipeline + catalyst-calendar foveal?
- Is the deal detail page a complete diagnostic surface (live state, information feed, precedent retrieval, calibration sub-segment, document library)?
- Are anomalies severity-routed with auto-actions on critical (e.g. compliance auto-pauses)?
- Is **deal pipeline live state** (every active deal with status, spread, days-to-close, regulatory phase, calibration tag) the primary live surface?
- Is **strategy state inspection** (internal variables, current feature snapshot, recent trigger evaluations, calibration sub-segment state) available on demand per scaffold and per per-deal sizing-rule?
- Is **backtest-vs-live comparison** computed (daily by default) for divergence catching?
- Is the platform pragmatic about state-streaming load (refresh-on-demand and event-pushed, not constant streaming for all scaffolds)?

**Intervention console & manual trading:**

- Are kill switches granular (deal / type / jurisdiction / sponsor / archetype / firm) with multi-key authentication for the largest scopes?
- Is **the full manual order ticket** (single-name, cash-and-stock pair, capital-structure, hedge, tender-offer, distressed/claims) preserved with hotkeys, smart router, pre-trade preview, multi-venue ladder where relevant — and one-keystroke-reachable?
- Is **emergency mode** a designed UI mode with manual ticket + pipeline state + working orders + compliance state foveal?
- Is **reconciliation** a designed workflow (platform state vs prime-broker state, with diff highlighting and per-row actions)?
- Is every manual trade tagged (emergency / reconciliation / override) and auditable, with attribution flowing through to performance reports?
- Are global manual-trading hotkeys (open-manual-ticket, buy-target-sell-acquirer, flatten-deal, cancel-all-on-deal, hedge-deal-at-preconfigured) bound regardless of supervisor mode?
- Is every intervention logged with timestamp / actor / action / reason / pre-state / post-state — including the rich rationale field for manual sizing overrides?

**Post-trade & decay:**

- Are per-deal retrospectives auto-generated, not composed?
- Is the **calibration tracker** a headline post-trade surface, decomposed by deal type / jurisdiction / regulatory regime?
- Is hedge-effectiveness aggregated across closed deals, with hedges-that-paid-off vs wasted-hedges?
- Is the retrain queue actionable, with auto-approval for routine retrains and explicit approval for live scaffolds?

**Supervisor console:**

- Is reading and research foveal-by-default and supervision peripheral-by-default?
- Are vote-day / hearing-day / quiet / emergency modes designed and one-keystroke-reachable?
- Is the platform green-by-default and trustworthy in its silence?

**Daily rhythm:**

- Can Naomi spend 30–40% of her time reading focal-deal documents while the platform tracks the rest of the corpus?
- Are pre-market / in-market / post-market workflows supported by the right surfaces in the right modes?
- Are catalyst-day modes (vote, hearing, regulatory deadline) automatically triggered when a tracked deal has the catalyst today?

**Coordination:**

- Are internal / external lawyers and compliance officers first-class participants on the platform, with shared deal records, counsel-opinion threads, and inline compliance enforcement?
- Are MNPI walls operationalised (auto-block at every Naomi surface, lifted only by compliance, fully audited)?
- Is Naomi's pipeline visible to David and Quinn at the right level of detail?

**Cross-cutting:**

- Is lineage end-to-end (filing → NLP-extracted clause → feature → scaffold → action / sizing recommendation → deal P/L)?
- Is reproducibility guaranteed (any precedent-retrieval / calibration / commissioner-stance model can be re-trained from registered inputs)?
- Are audit trails non-negotiable (every intervention, every override, every MNPI-wall event recorded)?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
