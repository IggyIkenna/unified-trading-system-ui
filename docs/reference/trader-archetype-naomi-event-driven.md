# Trader Archetype — Naomi Eberhardt (Senior Event-Driven / Merger-Arb Trader)

A reference profile of a top-performing event-driven / merger-arbitrage trader at a top-5 firm. Used as a yardstick for what an ideal **event-driven** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For sister archetypes on the same desk, see the other `trader-archetype-*.md` files in this folder.

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

### Deal pipeline (the spine of her terminal)

A list (or kanban) of every deal she's tracking:

**Status categories:**

- **Rumored** — press leaks, no official announcement.
- **Announced** — official announcement, terms public.
- **Definitive agreement** — merger agreement signed.
- **Shareholder vote** — pending vote of target / acquirer holders.
- **Regulatory review** — antitrust / sectoral approvals pending.
- **Final approvals** — all material conditions met.
- **Closed** — completed.
- **Broken** — terminated, withdrawn, blocked.

**Per deal, the row shows:**

- Target name, ticker.
- Acquirer name, ticker.
- Deal type (cash, stock, mixed, tender, scheme).
- Headline value.
- Current spread (gross + annualized) — the trade's edge.
- Days to expected close.
- Probability of close (her subjective + market-implied).
- Active position size.
- P/L on this deal.
- Next catalyst date and type.

### Active deal deep-dive

When she focuses on one deal, the dashboard shows:

- **Deal terms** — price, ratio (for stock deals), collar (if any), CVRs, breakup fees.
- **Spread analytics** — gross spread, days to close, annualized return, break price (where target trades if deal breaks).
- **Probability decomposition** — conditional on regulatory approval, conditional on shareholder vote, etc.
- **Implied probability of close** from current spread vs her estimate.
- **Risk/reward** — payoff if closes, payoff if breaks, expected value.
- **Hedge structure** — what's the hedge? Index put? Acquirer short? Capital-structure?

### Regulatory & antitrust dashboard

Deal-specific:

- **Filings tracker** — HSR (US), Form CO (EU), CMA notification (UK), MOFCOM/SAMR (China), SEC S-4, proxy DEFM14A.
- **Review periods** — initial 30-day, second-request, statutory deadlines.
- **Antitrust analysis** — concentration metrics, HHI changes, geographic / product overlaps.
- **Recent precedents** — similar deals approved/blocked in recent past.
- **Regulatory commissioner profiles** — current FTC chair stance, EU competition commissioner pattern.

### Catalyst calendar

The most deterministic calendar in trading:

- **HSR clearance** dates (or deadlines).
- **Second request** deadlines.
- **EU phase-1 / phase-2** review end dates.
- **Other jurisdictional** review endings (UK CMA, Canada, China, Brazil, India).
- **Shareholder votes** — dates, expected outcomes.
- **Court hearings** — Delaware Chancery, federal court, appellate.
- **Tender offer expiration.**
- **Drop-dead date** — outside date in merger agreement.
- **Walk rights** — trigger events for acquirer / target to walk.

### Document library

Per deal:

- **Merger agreement** (full text + key clause excerpts).
- **Proxy / scheme document.**
- **S-4 / F-4** for stock deals.
- **Antitrust filings.**
- **Press releases** — chronological.
- **Court filings** if litigation involved.
- **Sell-side research** — event-driven analyst notes.
- **Internal memos** — Naomi's own notes, lawyers' opinions.

All searchable across deals.

### Pipeline & rumor tracker

- **Rumored deals** — press leaks, market chatter.
- **Companies under review** — strategic alternatives announced, exploring sale.
- **Activist situations** — companies under pressure to sell.
- **Sponsor / PE interest** — known acquirers exploring targets.

### Spinoff & corporate-action tracker

- **Announced spinoffs** — parent vs spin-co valuation analysis.
- **Tracking stocks, splits, mergers-of-equals** — each with its own payoff structure.
- **SPAC pipeline** — proposed mergers, target announcements, vote dates.

### Distressed / restructuring tracker

- **Companies in or near bankruptcy** — claim trading, post-bankruptcy equity.
- **Capital structure** for distressed names — bonds, loans, equities, ranked by seniority.
- **Recovery analyses** — projected creditor recoveries.

### Macro context

- **Equity indices, sector heatmaps.**
- **Credit spreads** — IG / HY / CDX — financing market health.
- **Vol indices** — VIX, MOVE — risk environment for deal closes.
- **Rates environment** — affects LBO financing, cash deal premiums.

### Sell-side and external research

- **Event-driven research** — strategist notes, deal-specific analyses.
- **Antitrust legal analyses** — law firm publications.
- **Expert network calls** — specialists on industries, regulators.

**Layout principle for Decide:** the deal pipeline is foveal. Each deal has a deep-dive view. Document library is one click away. Catalyst calendar drives daily attention.

---

## Phase 2: Enter

Event-driven entry is **deal-attached**, **multi-leg native**, and **borrow-aware**.

### Single-name ticket (for cash deals)

- **Buy target stock** at spread to deal price.
- **Pre-trade:** spread captured, days to close, annualized return, hedge requirement.
- **Locate / borrow check** if required.

### Cash-and-stock pair ticket (first-class)

For stock-for-stock or cash-and-stock deals:

- **Buy target / sell short acquirer** at deal ratio.
- **Ratio enforced** — automatic sizing.
- **Live spread** in $ and bps.
- **Atomic execution.**
- **Borrow availability** for acquirer short — flagged.
- **Recall risk** — likelihood of forced buy-in during deal.

### Capital structure ticket

- **Long the bond / short the equity** of the same company.
- **Long pref / short common.**
- **Long convertible / short common.**
- **Cross-asset coordination** with single-leg entries on each side.

### Hedge ticket

- **Index put hedge** — buy SPX puts to cover deal break risk.
- **Sector hedge** — sector ETF short.
- **Vol hedge** — buy VIX calls.
- **Custom hedge structures** Naomi designs for specific deals.

### Tender offer participation

- **Tender** her shares into a tender offer.
- **Don't tender** (when she expects price to rise).
- **Workflow** — submit through prime broker, track tender status.

### Distressed / claims ticket

- **Buy bonds, loans, claims** at distressed levels.
- **Claim trading** through specialist intermediaries.
- **Bankruptcy claim acquisition workflow.**

### Pre-trade preview

- **Deal-specific** — spread captured, days to close, annualized return, IRR.
- **Risk** — break price, max loss, probability-weighted expected value.
- **Hedge effectiveness** — beta / sector exposure.
- **Capital usage** — long + short capital required.
- **Borrow cost** — annualized financing for short legs.
- **Compliance:** position limits, restricted lists, conflicts (if firm advises one side).

### RFQ / block workflow

For size or illiquid names:

- **Block trading** through broker dealers.
- **IOIs aggregation.**
- **Anonymized RFQ** for size-sensitive trades.

### Algos

- **VWAP / TWAP** for large positions.
- **Spread-targeting** — execute when pair spread reaches X.
- **Close-tightening algos** — accumulate as deal close approaches.

### Compliance specifics

Event-driven trades are compliance-heavy:

- **Restricted lists** — when firm has MNPI on a deal, name is blocked.
- **Information barriers** — Naomi's access scoped per side of the wall.
- **Tender offer rules** — Reg 14E timing.
- **13D/13G** filing thresholds — 5%, 10%.
- **Insider trading prevention** — automated checks against firm's research / advisory side.

### Hotkeys

- Buy target / sell acquirer at NBBO with deal-ratio sizing.
- Cancel all on deal.
- Hedge deal break risk (preconfigured per deal).
- Flatten deal.

**Layout principle for Enter:** the deal-pair ticket is first-class. Compliance is inline. Borrow / financing are pre-trade-visible. Hedge structure is configured per deal in advance.

---

## Phase 3: Hold / Manage

Event-driven positions are **slow-moving day-to-day** but **catalyst-cliffs** matter enormously. Naomi's Hold surface is calendar-shaped.

### Positions blotter — by deal

Primary view groups positions by deal:

- **Deal: Target Inc / Acquirer Co**
  - Long Target: 500k shares, +$X, P/L +$Y.
  - Short Acquirer: 200k shares, +$X, P/L +$Y.
  - Index put hedge: 100 contracts, P/L –$Z.
  - Net deal P/L: +$W.
  - Spread captured: 60% of headline spread realized.
  - Days remaining: 87.

A secondary view groups by category (M&A / spinoff / SPAC / distressed) and another by underlying instrument type for trading.

### Live spread monitor

- For every active deal: current spread, change today, change since entry.
- Distance to break price.
- Distance to deal close payoff.
- z-score of spread vs entry.

### Catalyst countdown

The most important live surface:

- Next 7 / 30 / 90 days of catalyst events across all deals.
- Color-coded by significance (regulatory deadline, vote, court date).
- Pre-event positioning summary.

### Live PnL — event-decomposed

- **Per deal, per leg.**
- **Spread tightening P/L** — passive accrual as deals approach close.
- **Spread widening P/L** — adverse moves.
- **Hedge P/L** — separate.
- **Borrow / financing cost** — daily accrual.
- **By deal type** — M&A vs spinoff vs SPAC vs distressed.

### Risk panel — event-driven specific

- **Deal break risk per deal** — max loss if deal terminates.
- **Aggregate break risk** — what if 3 deals broke simultaneously? (Stress-test)
- **Concentration risk** — % of book in a single deal.
- **Sector concentration** — too many tech deals?
- **Acquirer concentration** — multiple deals by same PE sponsor?
- **Regulatory regime risk** — % of book exposed to current FTC stance.
- **Vol exposure** — for deals with stock components.
- **Borrow risk** — high-borrow positions, recall probability.
- **Liquidity** — % of book in illiquid names.
- **Stress scenarios:**
  - "All FTC reviews block" — 30% of M&A pipeline.
  - "Risk-off shock" — deal break premium widens.
  - "Credit shock" — LBO deals re-underwritten.
  - "Specific deal break" — top-3 deals individually.
- **VaR.**

### Regulatory news watch

- Per-deal news alerts on regulatory filings, statements, hearings.
- Pattern monitoring — second requests issued, EU phase-2 launched, complaints filed.

### Document watch

- New SEC filings on tracked names — auto-flagged.
- Court docket monitoring — new filings on deals in litigation.
- Press releases auto-categorized.

### Alerts

- **Catalyst countdown** — T-7, T-1, T-0 of major events.
- **Spread alerts** — beyond entry parameters.
- **Regulatory alerts** — filing, statement, ruling.
- **News alerts** — deal-specific keywords.
- **Recall alerts** — short borrow status changing.
- **Compliance alerts** — restricted-list changes, position thresholds.
- **Risk limit alerts** — concentration, deal-break aggregate, sector.

### Trade journal — deal journal

Per deal:

- Thesis at entry.
- Probability of close estimate.
- Key risks tracked.
- Updates on regulatory / catalyst progress.
- Decision points (add / trim / hedge / exit).
- Reviewed weekly.

### Communications

- **Sell-side event-driven desk chat** — flow color, deal-specific intel.
- **Internal lawyers** — opinions on regulatory questions.
- **Expert network call notes** attached to deals.
- **Industry sources** — analysts, trade press.

### Heatmap

- Deals sized by capital deployed × today's P/L move.

### Kill switches

- **Reduce a deal's exposure** — pre-defined unwind algo.
- **Close all M&A positions** — emergency, multi-day algo.
- **Hedge to neutral** — fast index hedge.
- **Cancel all working orders.**

**Layout principle for Hold:** deal pipeline + catalyst calendar are foveal. Regulatory news is constant peripheral. Document watch surfaces filings the moment they post.

---

## Phase 4: Learn

Event-driven post-trade emphasizes **deal-by-deal outcomes**, **probability calibration**, **sub-strategy performance**.

### Deal closeouts

Per deal closed (or broken), a retrospective:

- **Entry thesis** vs realized outcome.
- **Probability estimate** vs realized — was she calibrated?
- **Spread captured** vs available spread.
- **Hedge effectiveness** — did it pay off when needed?
- **Regulatory path** vs predicted.
- **Time-to-close** vs predicted.
- **Lessons** — what would she do differently.

### PnL attribution

- **By deal.**
- **By deal type** (M&A / spin / SPAC / distressed / capital structure).
- **By regulatory jurisdiction** — US deals vs EU vs cross-border.
- **By outcome** — closes vs breaks vs renegotiations.
- **By sector.**
- **By regime** — favorable vs hostile regulatory environment.

### Performance metrics

- Sharpe, Sortino, Calmar.
- **Hit rate by deal type.**
- **Avg deal won vs avg deal lost.**
- **Spread realization rate** — % of available spread captured.
- **Calendar discipline** — % of deals exited at or near close.

### Probability calibration

Critical for Naomi:

- When she said "85% chance of close," did 85% of those deals close?
- When she said "60%," did 60%?
- Calibration curve over time.
- Drives improvement of subjective-probability formation.

### Regulatory pattern analysis

- **By commissioner / regime** — performance across FTC chairs, EU commissioners, etc.
- **By industry** — antitrust performance in tech vs healthcare vs financial services.
- **Precedent fit** — when she relied on a precedent, did it hold?

### Hedge analysis

- **Hedge cost vs hedge protection** ratio.
- **Hedges that paid off** — list of deals where the hedge saved her.
- **Wasted hedges** — list of unnecessary hedges.

### Capital structure analytics

- **Long-bond / short-equity** trades — mean-reversion of spreads.
- **Convertible-equity** spreads.
- **Recovery analysis** for distressed.

### Borrow / financing analytics

- **Borrow cost paid YTD** per deal.
- **Recall events.**
- **Hard-to-borrow** trade selection.

### Behavioral analytics

- **Entry timing** — does she enter too early, too late?
- **Exit timing** — does she hold to close or cash out early?
- **Probability anchoring** — does her estimate move with market spread (a circularity warning)?

### Reports

- Daily P/L commentary (deal-tagged).
- Weekly portfolio review.
- Monthly attribution by deal type / sector / outcome.
- Quarterly investor / committee letter contribution — event-driven storytelling.
- Compliance / regulatory filings (13F, 13D/G, Schedule TO).

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
