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
