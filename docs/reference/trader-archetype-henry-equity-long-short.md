# Trader Archetype — Henry Whitfield (Senior Equity Long/Short PM, Tech Sector)

A reference profile of a top-performing fundamental equity long/short PM — sector specialist (technology) — at a top-5 firm. Used as a yardstick for what an ideal **single-name equities** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For shared platform surfaces referenced below, see [common-tools.md](common-tools.md). For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md). For Henry-unique surfaces in the index, see [unique-tools.md](unique-tools.md).

---

## Who Henry Is

**Name:** Henry Whitfield
**Role:** Senior Portfolio Manager, Technology Long/Short
**Firm:** Top-5 global trading firm (multi-strat platform, equities sleeve)
**Book size:** $500M – $2B gross, typically 130/30 or 150/50 long/short
**Style:** Fundamental-driven, multi-week to multi-quarter horizons, with **catalyst-aware** entries and exits
**Coverage:** ~80–120 names in technology — large-cap (Apple, Microsoft, Nvidia, Google, Meta), mid-cap, select small-cap, plus relevant ETFs (XLK, SOXX, SMH, QQQ) and futures (NQ)
**Geographies:** US primary, with selective EU and APAC tech names
**Trading window:** Cash session primary (NY 9:30–16:00 ET) plus pre/after-market for earnings reactions

### How he thinks differently

Henry is a **fundamentals-first** trader. His mental model:

- A stock's price is a claim on future cash flows; his job is to find names where the market's claim is wrong.
- His edge is **research depth** — channel checks, expert calls, supplier/customer ecosystem mapping, deep model-building.
- He sizes by **conviction × risk-adjusted upside/downside**, not by signal strength.
- He thinks in **catalysts**: earnings, product launches, regulatory rulings, M&A, conferences. Catalysts crystallize thesis into PnL — or break it.
- He pairs positions: long the high-conviction name, short the lower-quality competitor (or sector ETF) to neutralize beta.

His longest hold can be 18 months. His shortest, days around an earnings event. He's not a day-trader, but he's not a buy-and-hold investor either.

### His cognitive load

Henry covers ~100 names with **tiered attention**:

- ~10–20 active positions tracked deeply.
- ~30–40 watchlist names with active thesis.
- The rest at sector-level health.

The terminal must support this — different depth for different names. He must also **synthesize**: a Reuters headline + a sell-side note + a credible analyst's tweet + an earnings transcript snippet → does that change his model? The terminal feeds the synthesis; it does not replace it.

---

## Physical Setup

**6 monitors**, with a research-heavy emphasis.

| Position      | Surface                                                                               |
| ------------- | ------------------------------------------------------------------------------------- |
| Top-left      | **Primary chart workspace** — multi-TF, single name, fundamentals overlay             |
| Top-center    | **News & research feed** — filtered to current focus name + portfolio + watchlist     |
| Top-right     | **Earnings season dashboard** — calendar, pre-event positioning, post-event surprises |
| Middle-left   | **Fundamental data + valuation panel** — financials, estimates, valuation comparables |
| Middle-center | **Positions, working orders, live PnL, risk panel**                                   |
| Middle-right  | **Order entry — single-name, basket, pairs**                                          |
| Bottom-left   | **Sector & macro context** — sector heatmap, factor exposures, indices                |
| Bottom-right  | **Analyst / IR communication** — broker chat, sell-side ratings, conference calendar  |
| Tablet        | Sell-side conference calls, earnings call audio, news terminal                        |

Note: Henry typically has a **separate research environment** (on-prem analyst workstation or notebook) for deep model-building. The terminal supports trading + monitoring; the research lives elsewhere but is linked.

---

## Phase 1: Decide

For Henry, "decide" is mostly **building and updating thesis** over weeks. The data sources are radically different from a crypto trader.

### Charts and price action

See [#1 Multi-Timeframe Charting](common-tools.md#1-multi-timeframe-charting). **Henry-specific overlays:** daily / weekly / monthly are default frames (intraday only around catalysts); **earnings markers** as vertical lines color-coded by surprise direction; **insider Form 4 markers** (buys / sells); **short-interest overlay** (% of float, days-to-cover in subpane); **anchored VWAP** from key dates (last earnings, product launch, IPO); volume profile for accumulation / distribution; **relative-strength overlay** vs sector vs index.

### Fundamental data + valuation panel — Henry-unique

Co-pinned next to the chart, not in a separate tool:

- **Financial statements** — income / balance sheet / cash flow, last 5–10 years quarterly, with **common-size statements** (revenue mix, margin trends).
- **Segment reporting** — revenue / profit per segment for multi-segment companies.
- **Guidance tracking** — current guidance, prior, raise/cut history.
- **Capital structure** — debt maturities, share count, buyback history, dividend.
- **Current multiples** (P/E, EV/EBITDA, EV/Sales, P/FCF, P/B as relevant) with **5-year multiples-history range** and current vs median.
- **Peer comparables table** — same-sector peers ranked by relevant multiple.
- **DCF link** to Henry's analyst's parametric model with key sensitivities.
- **Reverse DCF** — what does today's price imply about growth / margin assumptions?
- **Implied probability** of upside vs base vs downside scenarios.

Common-size statements, segment, multiples history, peer comps, DCF, and reverse DCF together form the valuation case in one pane.

### Estimate-revision dashboard — Henry-unique

- **Sell-side EPS / revenue estimates** — consensus, mean, median, dispersion (high-low range, std-dev), N analysts.
- **Revision direction** over 1m / 3m / 6m — net up-revisions vs down-revisions, with magnitude.
- **Above-consensus / below-consensus posture** flagged when his analyst's model diverges from the street.
- **Revision velocity** — accelerating ups before earnings is a known signal.

### Beat/miss track record — Henry-unique

Per name:

- Every prior quarter — actual vs consensus EPS and revenue, surprise magnitude in % and σ.
- Stock reaction in 1d / 5d / 30d post-print, separately for beats and misses.
- Guidance reaction — did guidance raise/cut drive the move more than the print itself?
- Pattern view: "this name beats and sells off" vs "this name misses and rallies on guidance" — known regime per ticker.

### News & research feed

See [#13 News & Research Feed](common-tools.md#13-news--research-feed). **Henry-specific sources & filters:** Reuters / Bloomberg / FT / WSJ + sector-specific (TheRegister, The Information, Stratechery, trade press); **sell-side research aggregation** (every initiation / upgrade / downgrade / target change with link to full PDF); **competitor / supplier / customer mentions** NLP-extracted from broader news for indirect reads; filter to focus name + portfolio + watchlist by default.

### Earnings transcript search — Henry-unique

A first-class research surface, not a buried feature:

- **Full-text searchable** across his coverage universe and beyond — 10+ years of transcripts.
- **Per-call view** — prepared remarks, Q&A, with speaker turns; analyst names linked to firm + history.
- **Cross-call search** — "every time MSFT mentioned 'AI capex' in last 8 quarters," with snippet + page anchor.
- **Diff view** between consecutive calls — language changes ("strong demand" → "mixed demand") flagged automatically.
- **Mention frequency tracker** — keyword count per call across coverage (e.g. "supply constraint" usage across the semis universe by quarter).
- **Sentiment / hedge-word scoring** per paragraph — "we expect" vs "we hope" vs "we believe."
- **Bookmark + tag** snippets into Henry's thesis notes per name; snippets stay linked to source location.
- **Audio sync** — click a transcript line, jump to that timestamp in the call recording.
- **Competitor cross-reference** — when AAPL mentions "Vision Pro," surface every other transcript mentioning it in the same quarter.

### Analyst-day & conference calendar — Henry-unique

- Per coverage name: investor days, analyst days, sell-side conference appearances, capital markets days.
- **Materials archive** — slide decks, prepared remarks, fireside-chat notes, audio recordings, all linked to the calendar entry.
- **Henry's posture per event** — attending in person, watching webcast, or sales-side relay.
- **Pre-event note prompt** — "AAPL analyst day in 3 days; thesis-update note pending."
- **Post-event quick-tag** — what changed, what didn't, how the stock reacted.
- **Cross-reference** to estimate-revision dashboard — did consensus move post-event?

### Expert network call database — Henry-unique

- **Scheduled + historical** calls (GLG, Third Bridge, Tegus, Mosaic, etc.) with subject expert, employer, role, date, names discussed.
- **Notes per call** — full transcript or analyst notes — searchable across the database.
- **Tagged to names** — every call linked to one or more tickers; opening a name shows recent expert calls.
- **Topic tags** — supply chain, channel checks, competitive dynamics, hiring trends.
- **Compliance view** — expert disclosure status, conflicts, internal review sign-off, MNPI flags.
- **Re-use cap** — same expert across firms / sessions tracked to prevent over-reliance on a single source.
- **Cross-name search** — "every call in last 90 days mentioning data-center GPU pricing."
- Linked to thesis notes — a call's takeaway can be pinned to the position thesis as evidence.

### Catalyst calendar specific to single names — Henry-unique

The most important calendar for Henry. Builds on [#12 Catalyst / Event Calendar](common-tools.md#12-catalyst--event-calendar) with single-name catalyst types:

- **Earnings dates** with expected release time, consensus EPS / revenue, **expected move from straddle**, prior-quarter reaction.
- **Product launches** (iPhone event, Nvidia GTC, AWS re:Invent, OpenAI dev day).
- **Regulatory dates** — FDA panels, FTC/DOJ M&A reviews, SEC filings, EU DMA milestones.
- **Index rebalances** — entry/exit dates for SPX, NDX, Russell, MSCI; expected passive flow.
- **Lock-up expirations** for recent IPOs and secondaries.
- **Investor / analyst days, board meetings, dividend ex-dates.**
- Per active position: next-catalyst countdown surfaced in the positions blotter.

### Sentiment & positioning

- **Short interest & borrow analytics — Henry-unique:** trend, days-to-cover, fail-to-deliver, % of float, HTB flag, recall risk, borrow cost YTD by name.
- **Insider trading & 13F crowding dashboard — Henry-unique:** Form 4 buys/sells with cluster detection (multiple insiders same week); 13F crowding score per name (how many top-50 funds long), contrarian-risk flag for over-owned names.
- **Options skew and open interest** — put vs call skew, gamma walls, max pain.
- **ETF flow read-through** — XLK, SOXX, SMH, QQQ flows affecting his constituents.
- **Twitter / X / Stocktwits sentiment** — relevant for retail-name risk, not primary.

### Macro & sector — beta-adjusted exposure & factor exposure dashboard (Henry-unique)

- Macro tickers always visible: DXY, US 10Y, SPX futures, VIX, MOVE.
- **Sector heatmap** — XLK constituents performance.
- **Factor exposure dashboard:** book exposure to **Fama-French 5-factor** (market, size, value, profitability, investment), **Barra-style** factors (momentum, quality, low-vol, leverage, liquidity), and **custom factors** (AI capex beneficiaries, semi-cyclical exposure). Targets and tolerance bands per factor.
- **Beta-adjusted net exposure** — book net delta scaled by per-name beta to SPX / XLK; the right unit, not raw $ net.
- **Style box drift** — has net exposure drifted from stated mandate (growth-tilted, beta-neutral, etc.)?

**Layout principle for Decide:** charts and fundamentals share foveal space. News feed scrolls peripheral. Catalyst calendar is the planning surface he opens daily.

---

## Phase 2: Enter

Equities entry differs from crypto in important ways: heavy **liquidity** considerations, **compliance & restrictions** (restricted lists, blackout, MNPI), **locate / borrow** for shorts, and **smart routing** across many venues (NYSE, NASDAQ, dark pools, ATSs).

### Single-name order ticket

See [#2 Order Entry Ticket Framework](common-tools.md#2-order-entry-ticket-framework) and [#3 Pre-Trade Risk Preview](common-tools.md#3-pre-trade-risk-preview). **Henry-specific extensions:** **% of ADV preview** ("4% of 30-day ADV; ~12bps impact"); dark / lit routing controls (% to dark pools, midpoint pegging); hidden / iceberg sizing with venue-aware refresh; T+1 / T+2 settlement preview; **pre-trade compliance check** (restricted list, watch list, MNPI gate, **5%-of-float / 13D threshold** warning, blackout window).

**Locate / borrow check inline — Henry-unique.** For short tickets, the ticket queries the borrow desk in-line: availability, rate (bps annualized), HTB flag, recall probability over 1d / 7d. Locate ID is returned and stamped on the ticket. No separate "request locate" workflow — the ticket fails closed if borrow isn't secured.

### Pairs ticket — Henry-unique

A first-class entry mode (not a derived workflow on top of two single-name tickets):

- Long leg + short leg in one ticket, sized by **ratio** (dollar-neutral, beta-neutral, or custom — vol-weighted, factor-neutral).
- **Live spread** displayed in z-score terms vs a configurable lookback.
- **Ratio limit orders** — execute when spread reaches a level (entered as z-score or absolute spread).
- **Leg-by-leg order placement** with synchronization rules — "fill long first," "execute legs simultaneously within X seconds," or "fill leg 1 then sweep leg 2 with IS algo."
- **Partial-fill rules** — what to do if one leg fills but the other doesn't (cancel filled leg? hold? alert).
- Pair tracked as one logical position downstream (positions blotter, PnL, risk).

### Basket ticket — Henry-unique

- Upload a list of names with weights (or build inline) — long basket, short basket, or paired baskets.
- **Basket-level execution algo** — sensitive to relative liquidity, holds back fast-fillers to wait on slow ones, keeps tracking error to target weights.
- **Track basket-level fills and PnL** as one logical entity, with leg drill-down.
- **Pre-trade impact estimate** at basket level (not just per-leg sum).

### Risk-arbitrage / event ticket — Henry-unique

For announced M&A:

- **Cash-and-stock structure** — buy target, short acquirer at the deal-implied ratio (e.g. 0.18 shares of acquirer per target share + $X cash).
- **Spread-to-deal-close** in $ and bps; **deal-break risk preview** with implied probability.
- **Time-to-close** estimate from antitrust review history; key regulatory dates linked from catalyst calendar.
- **Locate check on the acquirer leg** inline.

### Pre-trade preview — Henry-specific add-ons

Builds on [#3 Pre-Trade Risk Preview](common-tools.md#3-pre-trade-risk-preview). Henry-specific lines: $ delta and **beta-adjusted exposure** added; sector-concentration impact vs cap; **factor-exposure deltas** vs factor targets; margin / leverage / financing impact; **all-in cost** = commission + impact + spread + financing + (for shorts) borrow; compliance attestation for large positions.

### Execution algos

See [#4 Execution Algos Library](common-tools.md#4-execution-algos-library) and [#5 Smart Order Router](common-tools.md#5-smart-order-router--multi-venue-aggregation). **Henry-specific selections:** **Implementation shortfall** as the default for sized parents; VWAP / TWAP with curve shaping for less urgent size; POV for opportunistic fills; liquidity-seeking (dark first, lit if needed); **close auction (MOC / LOC) and open auction** algos for index-tracked names; **earnings-window algos** — defer or accelerate around scheduled earnings; never leave a child working through the print.

### Block trading

Aggregated broker-dealer IOIs; block-desk chat in [#17 Communications Panel](common-tools.md#17-communications-panel); cross-network access (Liquidnet, Cboe Block, etc.); direct broker call escalation for size that won't work in algos.

### Hotkeys

See [#6 Hotkey System](common-tools.md#6-hotkey-system). **Henry-specific bindings:** buy/sell at NBBO, cancel-all on focus name, move stops, flatten name. Lower hotkey reliance than crypto / vol traders — most orders go through the ticket with full preview.

**Layout principle for Enter:** the single-name ticket is dominant. Pairs and basket modes selectable. Compliance and locate are inline, not separate workflows.

---

## Phase 3: Hold / Manage

Henry's positions don't move minute by minute (mostly). His Hold surface is **lower-frequency than a crypto trader's** but **richer in fundamental context**.

### Positions blotter

See [#7 Positions Blotter](common-tools.md#7-positions-blotter). **Henry-specific characteristics:** beta-adjusted exposure as trader-native unit (greeks N/A for cash equities); sector / industry / sub-industry tags; strategy tag — directional / pair / hedge / special-situation (see [#29 Strategy Tagging Framework](common-tools.md#29-strategy-tagging-framework)); catalyst association with next-catalyst countdown column; position thesis stored inline (author, date, summary, invalidation); **pairs view** for pair positions — both legs side by side with live spread vs entry, z-score, per-leg + combined PnL.

### Working orders

See [#8 Working Orders Blotter](common-tools.md#8-working-orders-blotter). **Henry-specific:** child-order rollups under parent IS / VWAP algos; cancel-all per name and per parent; algo pause / resume controls.

### Live PnL

See [#9 Live PnL Panel](common-tools.md#9-live-pnl-panel). **Henry-specific decomposition:** long PnL vs short PnL separately (different skills), beta-explained vs alpha-explained, by name / sector / pair / strategy tag.

### Risk panel

See [#10 Risk Panel (Multi-Axis)](common-tools.md#10-risk-panel-multi-axis). **Henry-specific axes:** net market exposure (% gross, % NAV) and **beta-adjusted net exposure** as headline numbers; gross vs leverage limit; sector exposures vs caps; single-name concentration vs cap; **factor exposures** vs target ranges (see Phase-1 dashboard); **liquidity profile** (% of book exitable in 1d / 5d at 20% ADV); **borrow risk** (HTB / high-cost shorts); **earnings concentration** (% of book reporting in next 7 / 14 days).

### Stress

See [#11 Stress / Scenario Panel](common-tools.md#11-stress--scenario-panel). **Henry-specific scenarios:** SPX -10%, sector -20%, factor reversal (growth → value), rates +50bps, AI-narrative unwind.

### Catalyst tracker for active positions

Builds on [#12 Catalyst / Event Calendar](common-tools.md#12-catalyst--event-calendar) with **per-position framing:** next catalyst date and type per active name; **sized-for-catalyst vs in-the-window-by-accident** flag (terminal warns when exposure crosses a catalyst the thesis didn't intend); recent newsflow per name surfaced inline; open analyst questions / outstanding research items.

### Alerts

See [#14 Alerts Engine](common-tools.md#14-alerts-engine). **Henry-specific categories:** estimate-revision (consensus moved >X%), rating-change (upgrade / downgrade / target), insider Form 4 (new filing on coverage name), short-interest (% of float / days-to-cover change), catalyst countdown (earnings T-7 / T-1 / intraday), compliance (restricted-list change, 5% / 10% position-threshold approach), factor / sector / beta-adjusted exposure breach.

### Trade journal

See [#15 Trade Journal](common-tools.md#15-trade-journal). **Henry-specific template:** thesis, key drivers, invalidation, expected catalyst path; updated weekly or post-catalyst; searchable across history.

### Communications

See [#17 Communications Panel](common-tools.md#17-communications-panel). **Henry-specific sources:** sell-side chat / messaging, internal-analyst notes attached to positions, IR contact log (calls with company IR), expert-network call notes (from the expert network call database above).

### Heatmap

See [#16 Heatmap of Own Book](common-tools.md#16-heatmap-of-own-book). **Henry-specific:** treemap sized by gross exposure, colored by today's % move, grouped by sector / sub-industry.

### Kill switch

See [#19 Kill Switches (Granular)](common-tools.md#19-kill-switches-granular). **Henry-specific stages** (less hair-trigger than crypto): **reduce all to gross/net target** (algo-execute over the day toward a target exposure profile), **stop new entries** (pause additions, leave open positions running), **flatten by mandate** (emergency wind-down — rare).

**Layout principle for Hold:** positions and risk visible; catalyst tracker for active names always close to hand. News feed peripheral, with name-filtered alerts.

---

## Phase 4: Learn

Equities post-trade analytics emphasize **catalyst outcome**, **alpha attribution**, and **execution quality** at single-name level.

### Trade history

See [#21 Trade History / Blotter (Historical)](common-tools.md#21-trade-history--blotter-historical). **Henry-specific filters:** by name, sector, strategy tag, catalyst type, parent algo.

### PnL attribution

See [#22 PnL Attribution (Multi-Axis)](common-tools.md#22-pnl-attribution-multi-axis). **Henry-specific axes:** alpha vs beta decomposition (name selection vs market move); long alpha vs short alpha separately (different skills); by sector / sub-industry / strategy tag / catalyst type / market regime (bull / bear / chop).

### Catalyst outcome tracker — Henry-unique

Every catalyst-sized position closed: thesis right? sizing right? timing right?

- **Pre-catalyst expected move** (from straddle) **vs realized move.**
- **Position PnL through the catalyst** — entry-to-pre-event, event-day, event-to-exit.
- **Decision quality** — did Henry trim into the catalyst or hold through? Was that the right call ex-post?
- **Pattern recognition by catalyst type** — earnings / product launch / regulatory / M&A: hit rate, avg win, avg loss, Sharpe **per catalyst type**.
- **Per-name catalyst history** — "AAPL into earnings: 8 prior, hit rate 62%, avg PnL +$2.1M."
- **Skill-vs-luck filter** — sample size + dispersion to flag where catalyst track record is real edge vs noise.
- Feedback loop into Phase 1: sizing recommendations for next catalyst lean on this dashboard.

### Performance metrics

See [#23 Performance Metrics](common-tools.md#23-performance-metrics). **Henry-specific cuts:** Sharpe / Sortino / Calmar at book and strategy-tag level; hit rate, avg win vs avg loss by strategy (directional / pair / event); holding-period analysis (long-holds vs short-holds); sector skill (Sharpe per sector / sub-industry).

### Equity curve

See [#24 Equity Curve](common-tools.md#24-equity-curve). **Henry-specific benchmark:** vs SPX, vs XLK, vs HFRX equity-hedge index, with rolling-Sharpe and drawdown-shading.

### Factor attribution

Run portfolio against factor model (Fama-French 5, Barra-style, custom). Returns explained by factor exposure vs idiosyncratic alpha. Factor drift over time. Tightly coupled to the beta-adjusted exposure & factor exposure dashboard from Phase 1 — same model, used ex-ante for sizing and ex-post for attribution.

### TCA

See [#25 Execution Quality / TCA](common-tools.md#25-execution-quality--tca-transaction-cost-analysis). **Henry-specific dimensions:** IS slippage per parent (arrival vs final fill); VWAP slippage by algo; dark vs lit fill quality; **broker scorecard** (commission, execution quality by broker); **missed crossing opportunities** (could a block have been done internally?).

### Borrow / short analytics

Borrow cost paid YTD by name; recall events experienced (forced buy-ins); HTB usage patterns flagged for review.

### Behavioral analytics

See [#26 Behavioral Analytics](common-tools.md#26-behavioral-analytics). **Henry-specific indicators:** position-sizing consistency (conviction-driven vs PnL-driven), drawdown response (revenge-add to losers?), catalyst hold-through rate (sit through earnings or trim before?).

### Reports

See [#27 Reports](common-tools.md#27-reports). **Henry-specific reports:** daily P/L commentary, weekly portfolio review, monthly performance attribution package, quarterly investor / committee letter contribution, regulatory filings (13F, 13G/D, Form PF inputs — see [#28 Compliance & Audit Trail](common-tools.md#28-compliance--audit-trail)).

**Layout principle for Learn:** big tables, drilldowns, factor / catalyst / sector slices. Henry spends weekends here. Workspace state persisted via [#30 Customizable Layout & Workspace](common-tools.md#30-customizable-layout--workspace).

---

## What Ties Henry's Terminal Together

1. **Fundamentals are first-class.** Financials, estimates, valuation are presented next to price, not in a separate tool.
2. **Catalyst calendar is the planning spine.** Every active position is associated with one or more upcoming catalysts.
3. **News & research are continuous, filtered, prioritized** to portfolio and watchlist names.
4. **Sell-side and IR ecosystem is integrated.** Chats, ratings, calls, conferences, expert-network calls live alongside the book.
5. **Pairs and baskets are first-class entry modes**, not bolted-on.
6. **Compliance is inline, not a separate workflow.** Restricted lists, position thresholds, locate availability shown in the ticket.
7. **Beta-adjusted exposure is the right unit of risk.** Gross and net delta in $ are insufficient.
8. **Alpha vs beta decomposition is daily.** Henry's skill must be visible against the market's noise.
9. **Catalyst outcomes are tracked.** Did the thesis play out? Pattern-recognize what he's good at.
10. **Tiered attention is supported.** Active book deeply, watchlist actively, sector universe peripherally.

---

## How to Use This Document

When evaluating any single-name equities terminal (including our own), walk through Henry's four phases and ask:

- Are fundamentals (statements, estimates, valuation) integrated alongside price?
- Is the catalyst calendar a first-class planning surface?
- Are pairs and baskets first-class order types?
- Is compliance inline (locate, position thresholds, restricted lists)?
- Is risk shown in beta-adjusted and factor terms, not just $ and net delta?
- Is post-trade attribution multi-axis (sector / strategy / catalyst / regime)?
- Are catalyst outcomes tracked to pattern-match the trader's skill?
- Are earnings transcript search and the expert network call database first-class research surfaces, not bolt-ons?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.

---

# Automated Mode

This appendix describes Henry Whitfield's terminal in the **automated-cousin world** — where the platform runs a fleet of systematic strategies across his ~1000-name single-name equities universe while Henry retains a **discretionary book** of 10–20 high-conviction tech names. It builds on [automation-foundation.md](automation-foundation.md) (universal automated-trading concepts) and follows the structural template in [automation-archetype-template.md](automation-archetype-template.md). For depth and voice reference, see [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md) — Marcus's content is crypto-CeFi and does not transfer; only his **shape** does.

**Examples in this appendix are illustrative.** Strategy classes, named features, named datasets, factor lists, and execution-policy parameters are example shapes. The actual platform's catalog will differ.

---

## 1. What Henry's Edge Becomes

Henry today covers ~80–120 tech names with tiered attention: 10–20 actively traded, 30–40 watchlist, the rest at sector-level health. His edge is **research depth** on a small number of names, expressed as catalyst-aware long/short positions sized by conviction × asymmetry.

In the automated-cousin world, Henry's terminal runs **two books simultaneously**:

- **The Systematic Fleet** — automated strategies covering a ~1000-name expanded universe (S&P 1500 tech + relevant non-tech adjacencies, ETFs, futures, ADRs of EU/APAC tech). The fleet harvests structural and statistical edges that don't require the depth Henry brings to single names.
- **The Discretionary Book** — Henry's 10–20 top-conviction tech names, traded the way he trades today, with the platform supporting research and execution but not making decisions. Position sizing remains his judgment; thesis remains his.

The terminal must support both at once. Henry's positions on a given day are the **sum of systematic + discretionary**, with the platform tracking which dollar of exposure came from which book and netting them at the firm level (so the systematic fleet is short MSFT for a pair-trade signal while Henry is long MSFT in his discretionary book — the platform shows the gross of each, the net of both, and prevents internal wash where appropriate).

### 1.1 Strategy classes the systematic fleet runs (illustrative)

These are example shapes of the kind of strategy classes Henry's automated cousin would deploy. Actual fleet composition is decided by Henry, the model registry, and David's strategy-class sanctioning lifecycle.

- **Factor-tilt long/short fleet (`factor_tilt_*`)** — multi-factor portfolios (quality, momentum, low-vol, growth-at-reasonable-price, profitability) constructed across the 1000-name universe with tech-sector overweight and beta-neutral construction. Rebalanced monthly with intra-month drift bands. Typically 8–15 instances differing by factor weight, rebalance cadence, and sector tilt.
- **Pair-discovery fleet (`pair_*`)** — automated cointegration / fundamental-similarity / co-movement screening across the universe, dynamically nominating pairs (e.g. AMD / NVDA, MSFT / GOOG, ASML / AMAT) with z-score-driven entry/exit. Universe scans ~500K candidate pairs nightly; fleet runs the surviving ~50–100. Continuously re-tests and retires broken pairs.
- **Earnings-window event strategies (`earnings_*`)** — pre-print positioning (e.g. small straddle proxy via stock + ETF when straddle pricing implies cheap vol), post-print drift exploitation (PEAD — post-earnings-announcement drift), guidance-reaction strategies, transcript-language-shift strategies (NLP on earnings transcripts flagging tone-changes that historically precede price moves). Deploys per name on Henry's coverage list per quarter; ~120 name-quarters / quarter active.
- **Statistical-arbitrage fleet (`stat_arb_*`)** — short-horizon mean-reversion at residual level after factor-neutralization. Universe-wide, gross/net constrained, target Sharpe ~1.5–2.0, capacity-aware. Typically 5–10 instances differing by half-life, holding period, and risk-model.
- **Sector-rotation strategies (`sector_rot_*`)** — XLK / SOXX / SMH / QQQ overlay, plus sub-sector rotation within tech (semis vs software vs internet vs hardware), driven by macro-factor signals (rates regime, dollar trend, AI-capex flow).
- **Insider-cluster strategies (`insider_*`)** — Form 4 cluster-buy / cluster-sell signals across the universe, conditioned on prior signal-decay calibration per name and per sub-sector.
- **Estimate-revision strategies (`estrev_*`)** — long names with accelerating up-revisions, short names with accelerating down-revisions, sized by analyst-dispersion and revision-velocity. Universe-wide.
- **Index-rebalance strategies (`idx_rebal_*`)** — pre-positioning around scheduled SPX / NDX / Russell / MSCI rebalance dates, with passive-flow magnitude estimation; quiet most of the time, capital-on around announcement and effective dates.
- **Lock-up / secondary strategies (`lockup_*`)** — short bias around expirations and secondaries, calibrated per insider-density and option-skew.
- **M&A pre-event positioning (`ma_pre_*`)** — pre-announced-deal positioning on rumor / unusual-options-activity / takeover-screen signals. Strict capacity caps; high error tolerance built in. Distinct from announced-deal merger arb (which is Naomi's, not Henry's).
- **Short-interest mean-reversion (`si_mr_*`)** — extreme short-interest (% float, days-to-cover) reversion plays, conditioned on borrow-cost regime and squeeze-history.
- **Beta-hedge overlay (`hedge_*`)** — automated SPX / XLK / SOXX hedging that watches the **combined** book (systematic + discretionary) and runs the hedge needed to keep beta-adjusted net within Henry's mandate band. Continuously sized.

**Fleet shape:** typically 60–80 strategy instances live, covering ~500–800 names actively, ~1000+ in the watchable universe. Compared to Henry's manual coverage of 80–120 names and ~10–20 active positions — the fleet expands coverage by ~10× and active position count by ~30×. The cognitive shift: Henry's manual mode is "fewer trades, deeper thesis"; his automated mode is "more decisions per strategy class, less time on individual names that don't merit his depth."

### 1.2 Discretionary book (the 10–20 names)

The platform supports — does not replace — Henry's discretionary book. He still:

- Builds DCFs and reverse-DCFs himself with his analysts.
- Reads earnings transcripts, attends analyst days, takes expert-network calls.
- Sizes positions by conviction × asymmetry.
- Pairs his longs and shorts manually for thesis-driven structures (e.g. long MSFT vs short ORCL on AI-cloud thesis).
- Trims and adds based on news-flow and catalyst proximity.

What changes: the discretionary book lives **inside the same terminal** as the systematic fleet, sharing the same risk panel, factor-exposure dashboard, and execution stack. The discretionary book carries a `book=discretionary` tag end-to-end — distinct from `book=systematic` — so post-trade attribution can separate the two skill sets cleanly.

### 1.3 Why this matters

Henry's edge today is rationed by his attention. By offloading the structural / statistical / systematic edges to the fleet, his attention concentrates on the ~10–20 names where his depth actually pays. The fleet harvests breadth; Henry harvests depth. The book combines both. PnL contribution attribution, performed monthly, tells him which book is earning what, and where the firm should lean.

---

## 2. What Stays Henry

The platform is opinionated about what to automate. It is **humble** about what it cannot. The following stay Henry — they are not surfaces the fleet operates without him.

- **Thesis on individual high-conviction names.** Henry's read on MSFT's AI-cloud margin trajectory, NVDA's data-center pricing power, AAPL's services-mix transition, ASML's litho monopoly economics — none of these is a feature in the feature library. They are mosaics built from years of channel checks, expert calls, and judgment. The fleet does not have them. Henry does.
- **Earnings-call interpretation.** Tone shifts in prepared remarks, hedge-words in Q&A, what an analyst's question implies about buy-side positioning, whether a CFO is signalling a guide-down — these get NLP'd into features, but the **interpretation** of the NLP signal in the context of the broader thesis stays human. The fleet may flag a tone-change; Henry decides whether it changes the thesis.
- **Channel checks and supplier / customer ecosystem reads.** Calls with semiconductor distributors, hyperscale-procurement contacts, software-VAR partners, EMS suppliers — this raw qualitative input feeds Henry's mosaic. It is captured (expert-network call notes; see §3.2 and §4.2) but the **synthesis** is his work.
- **Discretionary-book sizing.** When Henry is long $40M of MSFT, that number came from his read of the upside, the downside, the catalyst path, and his confidence. The platform makes this explicit (sizing slider with conviction-and-asymmetry inputs from §10.2) but the inputs are his.
- **Catalyst hold-through decisions on discretionary positions.** Trim before Apple's analyst day or hold through? Sit through the print? These are Phase-3 judgment calls Henry has always owned, and he keeps owning them. The platform shows him historical pattern (his own, his peers', the fleet's) but does not pre-commit him.
- **Strategy-class sanctioning input.** Whether a new fleet strategy class (say, `transcript_tone_lstm_v3`) is worth deploying with real capital is a multi-stakeholder call (Henry, Quinn, David). Henry's input is on whether the class makes domain sense — does the alpha story track economic reality? — not just whether the backtest passes the gate.
- **Black-swan response on the discretionary book.** Big news on a name (sudden CEO departure, restated financials, major customer loss) — Henry's fast-reaction discretionary trim or add may be hours ahead of any model retrain. He keeps the manual ticket and the keyboard shortcuts (§12.3).
- **Conviction calibration.** When Henry decides he's _more_ confident in a thesis after a quarterly print than he was before, that update is judgment, not a Bayesian computation. The platform records his stated conviction and tracks calibration over time (§13) but does not assign conviction.
- **Sector-narrative reads.** "AI-capex is rolling over" or "memory pricing is bottoming" or "advertising is decoupling from internet equities" — these multi-quarter narrative judgments from Henry feed his book construction. The fleet's models pick up tape-level signals consistent with such narratives, but the narrative formation stays human.

The platform's stance: opinionated about automating breadth and structural edges. **Humble** about the residual ~20% of the work that is Henry's actual job and probably will remain so for a long time.

---

## 3. The Data Layer for Henry

Henry's automated cousin depends on a wide, fundamentals-heavy, text-rich data layer. The data layer is shared across the firm but **Henry's view of it** filters by relevance to his coverage universe.

### 3.1 The Data Catalog Browser

Same shape as the foundation doc's data-catalog browser ([automation-foundation.md](automation-foundation.md)): left-sidebar filters (asset class, dataset family, vendor, license tier, freshness, schema version), main panel (dataset cards: name, vendor, license, last-update timestamp, schema link, sample preview, owner contact, cost / quota, dependent strategies count), right pane (schema, lineage upstream / downstream, examples, change log, alerts subscribed).

**Henry-specific filter taxonomy:**

- Asset class: cash equities (US / EU / APAC), ETFs, single-name options, sector indices, futures (NQ, ES, RTY), fixed income (linked for valuation comps).
- Dataset family: prices & volumes, fundamentals, estimates, ownership, transcripts, filings, expert-network notes, sentiment / NLP, alt data (web traffic, app installs, satellite), corporate actions.
- Coverage filter: Henry's universe (~1000 tickers) vs firm-universe vs full vendor (the catalog can show what's available beyond Henry's covered list).

### 3.2 Henry's Core Datasets (Illustrative)

These are example shapes of the datasets Henry's automated cousin depends on. Actual procurement is a firm decision and the catalog will differ.

- **Refinitiv (Eikon / Workspace) — fundamentals + estimates + news + transcripts.** Single-vendor backbone for many funds.
- **S&P Compustat — point-in-time fundamentals.** As-reported, restated, with the **point-in-time guarantee** essential for backtest fidelity (no look-ahead from later restatements).
- **FactSet — estimates + ownership + supply-chain relationships + revere data.** Particularly the supply-chain map (who ships to whom, customer concentration).
- **Bloomberg fundamentals + ownership (BFLO).** Cross-checked against Compustat / FactSet for consistency.
- **IBES (via Refinitiv or FactSet) — sell-side estimates.** EPS, revenue, EBITDA, segment metrics; consensus and per-analyst.
- **Earnings-call transcripts (Refinitiv StreetEvents, AlphaSense, Sentieo / AlphaSense, FactSet CallStreet).** 10+ year archive, full text, speaker turns, audio sync.
- **Earnings-call audio archive.** Used for tone analysis (paralinguistic features), aligned to transcript timestamps.
- **Sell-side research aggregator (RSRCHXchange / AlphaSense / Bloomberg Research / Substantive Research).** Every initiation, upgrade, downgrade, target change, with full-PDF link and structured fields.
- **Expert-network call notes (GLG / Third Bridge / Tegus / Mosaic).** Subject expert, employer, role, transcript. Henry's analysts consume; NLP-extractors run nightly to surface signals to the fleet.
- **SEC EDGAR — 10-K / 10-Q / 8-K / Form 4 / 13F / 13G / 13D.** Filings ingested with structured XBRL extraction; Form 4 insider activity feeds insider-cluster strategies.
- **Short-interest archives (S3 Partners / IHS Markit / NYSE / NASDAQ).** % of float, days-to-cover, fail-to-deliver, borrow rate, HTB flag, recall risk by name and date.
- **Borrow availability / rate feed (prime broker-supplied).** Live and historical; informs short-side strategy capacity and entry-cost.
- **Corporate-actions feed.** Splits, dividends, M&A, spinoffs, ticker changes — essential for accurate point-in-time backtests.
- **Index constituent histories.** SPX / NDX / Russell / MSCI / XLK / SOXX / SMH / QQQ — by date, with rebalance-event metadata.
- **Conference / investor-day calendar.** Sell-side conferences, analyst days, capital-markets days, with materials archive.
- **Options chain history (OPRA tape, OptionMetrics IvyDB).** Full chain history for skew, IV, gamma-wall computation.
- **Equity tick data (TAQ, internal market-data archive).** For execution-model calibration and microstructure features.
- **Alternative datasets (Similarweb / Sensor Tower / Apptopia / Second Measure / Yipit / RS Metrics).** Web traffic, app installs, credit-card-aggregate spend, satellite imagery — feed alpha at name level.
- **Twitter / X / Stocktwits sentiment (vendor: Bloomberg / RavenPack / Brain / Accern).** Retail-flow / meme-name early warning.
- **News NLP (RavenPack / Bloomberg event-driven).** Structured event tags, sentiment scores, novelty flags.
- **Macro feeds for context features.** DXY, US 2Y / 10Y yields, VIX / MOVE, sector ETF flows — same firm macro feed used by Rafael.

### 3.3 Data Quality Monitoring

Mostly archetype-agnostic — see [automation-foundation.md](automation-foundation.md). Henry-specific watch-items:

- **Point-in-time correctness alarms** on fundamentals (no look-ahead from restatements; estimates as known on-the-day, not as-of-current-snapshot).
- **Transcript ingestion latency** flagged when AlphaSense / StreetEvents post-call delivery exceeds expected SLA — earnings-window strategies depend on minutes-not-hours latency.
- **Insider-filing freshness** — Form 4 ingest lag flagged when SEC delivery lags > 30 minutes.
- **Estimate-revision freshness** — IBES batch timing tracked; intra-day revision feed monitored.
- **Borrow-feed staleness** — prime broker borrow-rate feed health watched; locate-failure rate alarm.
- **Corporate-action coverage gaps** — cross-checks across Compustat / Bloomberg / vendor feed; mismatches flagged for analyst review.

### 3.4 Lineage Navigator

Archetype-agnostic shape. Henry-relevant: clicking a feature like `estimate_revision_velocity_3m` traces upstream to IBES estimate snapshot table → consensus aggregator → revision-detection job → daily / hourly cadence. Downstream: which strategies in the fleet consume it, last refresh, breakage history.

### 3.5 Procurement Dashboard

Archetype-agnostic shape. Henry-relevant renewal-sensitive feeds:

- Refinitiv / FactSet / Bloomberg — multi-million annual contracts, renewal rhythm tracked.
- Expert-network providers (GLG / Third Bridge / Tegus) — credit pools, expert-quotas, renewal cadences.
- Alt-data vendors — typically annual; retention decisions taken pre-renewal based on alpha contribution (linked from §13 decay tracking).
- Borrow-rate feed and locate workflow — prime broker SLAs.

### 3.6 Gap Analysis Surface

Surfaces datasets the fleet would benefit from but doesn't yet have. Examples:

- China A-share supply-chain depth — referenced by hardware names but procurement is high friction.
- Private-market comparables for IPO-pipeline naming.
- Better consumer-sentiment for retail-tech names.
- Patent-flow analytics with timely refresh.
- Deeper hyperscale capex-spend telemetry beyond what's captured in formal disclosures.

### 3.7 Interactions Henry has with the data layer

- **Daily.** Data-quality dashboard scan (typically 30 seconds — green or red); look at any flagged Form 4 / transcript / estimate-revision freshness alarms; review intraday news-NLP flagged events on coverage names.
- **Weekly.** Walk the procurement dashboard with the data-management team: retention call on alt-data vendors based on the prior week's alpha contribution; check transcript-archive coverage health.
- **Quarterly.** Big procurement review: which feeds renew, which retire, which new feeds the fleet's research backlog wants. Henry's input matters because he knows which data shapes are likely to mosaic with his discretionary thesis work.
- **Ad-hoc.** When his analysts want a new data source for a discretionary thesis, he files a request through the data-catalog with target onboarding date.

### 3.8 Why this matters

The data layer is the substrate. Bad data → bad features → bad strategies → bad PnL — silently. Point-in-time correctness is non-negotiable for backtest fidelity. Vendor renewal rhythms matter because losing a backbone feed mid-year is a fleet-wide event. Henry's fluency with the data layer (rather than treating it as an analyst-team problem) means he can spot a feed-degraded fleet anomaly faster than the data team can.

---

## 4. The Feature Library for Henry

Where the data layer is raw substrate, the **feature library** is the curated, versioned, cross-pollinatable inventory of derived signals Henry's strategies (and his analysts' research) consume. Henry's domain has accumulated a lot of features over the years. The library makes them discoverable, governable, and reusable.

### 4.1 The Feature Library Browser

Same shape as the foundation doc: left-sidebar filters (domain, asset, frequency, status, owner), main panel (feature cards: name, owner, version, lineage upstream, dependent strategies, drift status, last updated), right pane (definition, formula sketch, unit tests, sample distribution, drift dashboard link).

**Henry-specific filters:** by feature family — `valuation_*`, `estimate_*`, `quality_*`, `momentum_*`, `transcript_*`, `insider_*`, `short_*`, `factor_*`, `event_*`, `microstructure_*`.

### 4.2 Henry's Core Features (Illustrative)

These are example features grouped by domain. Actual library composition is owned by Henry's quant team in coordination with Quinn.

**Estimate / sell-side family**

- `estimate_revision_velocity_eps_3m` — magnitude × direction of trailing 3-month consensus EPS revisions.
- `estimate_revision_velocity_rev_3m` — revenue revision velocity.
- `estimate_dispersion_eps` — std-dev of analyst EPS estimates / mean (high dispersion → uncertainty).
- `analyst_count_eps` — how many analysts cover (less coverage → less efficient).
- `target_price_revision_30d` — net target-price revision direction over 30 days.
- `consensus_vs_buyside` — proxy for whether sell-side estimate is above or below probable buy-side bar.
- `nps_score` — net-positive-surprise score (pattern of beat/miss across last 8 quarters).

**Valuation family**

- `pe_ntm_zscore_5y` — forward P/E z-score vs 5-year history, per name.
- `ev_ebitda_ntm_zscore_peers` — vs peer cohort.
- `reverse_dcf_implied_growth` — what growth the current price implies.
- `fcf_yield` — TTM free-cash-flow yield.
- `pb_zscore` — price-to-book vs sector history.
- `multi_metric_valuation_composite` — weighted composite of normalized valuation metrics.

**Quality / fundamentals family**

- `gross_margin_trend_8q` — slope of gross margin over 8 quarters.
- `operating_leverage_8q` — sensitivity of EBIT to revenue.
- `roic_excess_wacc` — ROIC vs estimated cost of capital.
- `accruals_ratio` — Sloan-style accruals quality.
- `revenue_growth_organic_vs_inorganic` — split where M&A history allows.
- `capex_intensity_change` — capex / revenue change.
- `share_count_change_ttm` — buyback-or-issuance signal.

**Momentum family**

- `price_momentum_12_1` — 12-month return excluding most-recent month (classic Carhart factor input).
- `earnings_momentum` — composite of recent EPS surprise and revision.
- `relative_strength_to_xlk` — name vs XLK over multiple windows.
- `momentum_residual_after_factor_neutralize` — alpha-momentum.

**Transcript / NLP family** (Henry-distinct)

- `transcript_tone_delta` — tone shift call-over-call (positive vs negative language balance).
- `transcript_hedge_word_freq` — frequency of "expect / hope / believe / could / may."
- `transcript_topic_distribution` — LDA / topic-model scores per call.
- `transcript_keyword_count_<term>` — e.g. `_demand_constraint`, `_data_center_capex`, `_AI_workload`.
- `transcript_question_pressure` — Q&A length and sharpness (proxy for analyst skepticism).
- `transcript_paralinguistic_score` — audio-derived (CFO hesitation, tonal stress).
- `transcript_competitor_mentions_count` — unsolicited competitor name count.

**Insider / ownership family**

- `insider_cluster_buy_30d` — multiple insiders buying in 30-day window.
- `insider_cluster_sell_30d` — same on sell side.
- `insider_net_flow_zscore` — vs name's own historical insider activity.
- `crowding_13F_top50` — what % of top-50 funds are long this name.
- `crowding_change_qoq` — crowding direction quarter-over-quarter.
- `passive_ownership_pct` — index-fund ownership share (informs squeeze risk).

**Short-interest family**

- `si_pct_float` — short interest as % of float.
- `days_to_cover` — short interest / 30-day ADV.
- `borrow_rate_bps` — current annualized borrow cost.
- `htb_flag` — hard-to-borrow boolean.
- `borrow_rate_change_30d` — squeeze early-warning.
- `recall_risk_score` — proprietary score on probability of recall over the next N days.

**Event / catalyst family**

- `days_to_next_earnings` — countdown.
- `expected_move_implied_straddle` — option-implied earnings move.
- `expected_move_realized_history` — average realized move by name on past prints.
- `catalyst_density_30d` — count of upcoming catalysts (earnings + products + regulatory + investor day) within 30 days.
- `index_rebalance_distance` — days to next SPX / Russell rebalance plus expected flow magnitude.

**Microstructure family** (used for execution policy, not alpha)

- `adv_30d` — average daily volume.
- `participation_ceiling_pct` — strategy's max % of ADV before impact compounds.
- `bid_ask_spread_avg_bps` — average bid-ask in bps.
- `dark_lit_split_estimate` — share that flows through dark pools.

**Factor-exposure family** (Quinn-shared; see §17.2)

- `beta_to_spx_252d` — rolling beta to SPX.
- `beta_to_xlk_252d` — rolling beta to sector ETF.
- `factor_loading_quality_barra` — Barra-style quality loading.
- `factor_loading_growth_barra` — growth loading.
- `factor_loading_low_vol_barra` — low-vol loading.
- `idiosyncratic_residual_vol` — residual after factor neutralization (informs sizing).

**Custom / thematic features (Henry-distinct)**

- `ai_capex_beneficiary_score` — composite from supply-chain mapping + revenue mix.
- `semi_cyclical_exposure_score` — semis cycle stage indicator.
- `cloud_revenue_share` — share of revenue from cloud lines (where disclosure permits).

### 4.3 Feature Engineering Surface

Standard form-driven engineering UI: feature name, owner, definition (Python / SQL / DSL), unit-test cases, drift-detector config, dependent strategies discoverability. Promotion requires owner sign-off + Quinn sign-off for cross-archetype features.

### 4.4 The Drift Dashboard

Archetype-agnostic. Henry-relevant red-flag examples:

- `transcript_tone_delta` distribution shifting (e.g. NLP model retrained, tone-baseline changed) — strategies depending on it must recalibrate.
- `estimate_revision_velocity` numerator surge in a quiet macro week — possible upstream-data issue.
- `crowding_13F_top50` quarterly snap when fresh 13Fs land — by design, not drift.

### 4.5 Cross-Pollination View

Shows which features Henry's strategies share with other archetypes. Examples: `factor_loading_quality_barra` and `momentum_residual_after_factor_neutralize` are shared with Quinn's cross-archetype factor strategies. `transcript_tone_delta` may be picked up by Sasha for vol-event strategies. `index_rebalance_distance` is shared firm-wide. Cross-pollination is governed: a feature shared firm-wide cannot be retired without coordinated deprecation.

### 4.6 Interactions Henry has with the feature library

- **Daily.** Feature drift dashboard scan; flagged-feature triage (any green-to-yellow transitions over the last 24 hours).
- **Weekly.** Catch-up with quant lead on new feature requests, deprecation candidates, retraining queue.
- **Per-quarter / earnings season.** Heavy use of `transcript_*` features; Henry's analyst team contributes new keyword-tracker features ad-hoc per coverage.
- **Per-research-cycle.** When designing a new strategy class, Henry and the quant lead walk the library before writing new features (if it exists, use it; if it's wrong, fix it; if it's missing, add it).

### 4.7 Why this matters

A feature library that is browseable, governed, and cross-pollinatable beats a graveyard of one-off CSVs. Henry's analyst team is small; the leverage from reusing a high-quality feature across many strategies is large. Drift detection catches silent feature-decay before strategies that depend on it bleed. The library is the substrate of the fleet's edge.

---

## 5. The Research Workspace

The research workspace is where Henry's quant team (and Henry directly, when the work is at his level) prototypes, backtests, and matures new strategies and features. It is integrated with the data layer, the feature library, the model registry, the experiment tracker, and the strategy composition surfaces — not a separate Jupyter island.

### 5.1 Notebook Environment

JupyterLab-style notebooks pre-configured with read access to the data catalog (`from data_catalog import get_dataset`), the feature library (`from features import get_feature`), the backtest engine, and the experiment tracker. Compute is dynamically allocated (see §5.5). Notebooks auto-save; commits are tied to a research-namespace branch.

Examples of the kinds of queries / experiments Henry's team runs:

- "Across the semis universe over the last 8 quarters, what's the average post-print drift conditioned on guidance direction × consensus surprise direction?"
- "Cluster the top-200 names by transcript-tone trajectory; identify cohorts that lead vs lag price."
- "Walk-forward test: does an earnings-surprise reversal strategy survive cost-realistic execution constraints with 3% ADV cap?"
- "Pair-discovery scan over the universe with cointegration + fundamental-similarity + sector-bound filters; rank by half-life and out-of-sample stability."
- "Sensitivity of factor-tilt PnL to monthly vs weekly vs daily rebalance cadence under realistic borrow costs."

### 5.2 Backtest Engine UI

Form-driven backtest configuration: universe filter, date range, frequency, strategy code, capital allocation, execution model, costs.

**Execution-model realism** for cash equities (this is the part most easily faked, so it's first-class):

- **Slippage curves** by name and ADV-share (linear-impact fits with bounded extrapolation).
- **Bid-ask spread** by name, time-of-day-aware (open / mid-day / close auction).
- **Commission schedule** matching the firm's actual rate card.
- **Borrow cost** by date for shorts (vs current-borrow-rate look-ahead trap).
- **HTB / locate-availability** check — if a name was HTB on a date, the backtest rejects the short or models a skip.
- **Partial fills** for size > X% of ADV with realistic completion-curve.
- **Auction fills** at MOC / LOC modeled with auction-imbalance proxies.
- **Halt and IPO availability** modeled as date-aware filters.
- **Dividend / corporate-action handling** for accuracy of total-return.
- **Settlement cycle** — T+1 (post-2024 changeover) vs historical T+2 / T+3.

The default is to fail closed on unrealistic execution assumptions: a backtest that ignores borrow cost on shorts gets flagged in the gate.

### 5.3 Walk-Forward Visualization

Standard walk-forward visualization: train window, validation window, OOS window, rolling, with metric-stability charts. PSR (Probabilistic Sharpe Ratio) and DSR (Deflated Sharpe Ratio) reported. Out-of-sample dispersion visualized as a fan, not a single line. Multiple-testing penalty applied where the experiment tracker shows N concurrent variations.

### 5.4 Strategy Template Library

Pre-built templates Henry's team starts from rather than greenfield. Examples:

- **`pair_trade_template`** — long-leg + short-leg, ratio-sized (dollar / beta / vol-weighted), entry/exit on z-score, with stop on co-integration breakdown, capacity-aware.
- **`factor_tilt_template`** — multi-factor portfolio construction with sector / beta / size constraints, monthly rebalance with intra-month drift bands.
- **`earnings_window_template`** — pre-print position from T-N to T-1, post-print PEAD harvest from T+0 to T+M, configurable per name and per surprise-direction.
- **`estimate_revision_template`** — long top-decile by revision velocity, short bottom decile, sector / beta neutral.
- **`stat_arb_template`** — daily mean-reversion on residuals after factor model, gross / net / sector constraints.
- **`index_rebal_template`** — pre-effective-date positioning with passive-flow magnitude estimation.
- **`insider_cluster_template`** — long after Form 4 cluster buy, with pre-conditions on borrow regime, options skew, recent run.
- **`sector_pair_template`** — sector ETF pair (e.g. SOXX / SMH) with beta-neutral sizing.
- **`m_a_pre_event_template`** — rumor / unusual-options screen entry with strict capacity caps and stop-on-denial.
- **`hedge_overlay_template`** — beta-hedge sizing using SPX / XLK / SOXX, continuously sized to the combined book's current beta-adjusted net.

### 5.5 Compute Management

Standard compute-management: queue depth, GPU vs CPU pools, cost-tracking by user / experiment / project. Henry's team's heaviest jobs are typically: (a) universe-wide pair scans, (b) NLP fine-tuning over the 10-year transcript archive, (c) walk-forward sweeps with 50+ parameter combinations.

### 5.6 Anti-Patterns the Workspace Prevents

- **Look-ahead from later restatements.** Compustat point-in-time enforced; restated-only data forbidden in backtests.
- **Survivorship bias.** Universe construction includes delisted names; failed IPOs and bankrupt names included up to delist date.
- **Borrow-availability look-ahead.** Shorts that were HTB on a date are not silently allowed.
- **Silent multiple-testing.** N concurrent variants get a multiple-testing penalty applied to reported metrics.
- **Tracking-error blow-up against benchmarks** when a "factor-neutral" strategy is in fact factor-loaded — the gate flags it.

### 5.7 Interactions Henry has with the workspace

- **Pre-market.** Light. He may glance at any flagged research-jobs that ran overnight (e.g. earnings-window calibration jobs that need attention).
- **In-market.** Rare. He's on the supervisor console; his quant team is in the workspace.
- **Post-market.** Reviews the day's research output with the quant lead — typically 30 minutes after close.
- **Earnings-season cadence.** Heavier — his analyst team is feeding new transcript-features and per-name calibration into the workspace daily.
- **Quarterly research cycle.** Half-day to full-day with quant lead reviewing strategy backlog, retiring underperformers, sanctioning new candidates.

### 5.8 Why this matters

A research workspace that is integrated with the data layer, feature library, and execution-realism backtest engine compresses cycle time from "build → test → debug-execution-assumption → re-test → debug-data-vintage" down to "build → test → graduate." Anti-pattern guards prevent silent failures that cost real money in live deployment.

---

## 6. The Model Registry

The model registry is the versioned, auditable catalog of every trained model that powers a feature, a strategy signal, or a derived dataset. Reproducibility is non-negotiable: any model in production can be reconstructed bit-for-bit from the registry plus the data layer.

### 6.1 The Registry Browser

Standard browser shape: filter by family (transcript-NLP / pair-cointegration / factor-model / signal-model), status (research / paper / pilot / live / retired), owner, last-trained, dependent strategies. Click any model for the detail page.

### 6.2 Per-Model Detail Page

Each model card shows: name, version, owner, lineage (training data ref + feature set + hyperparameters + code commit), training metrics, validation metrics, OOS metrics, drift status (since last retrain), dependent strategies, deployment history, retirement status if any.

Henry-relevant model families (illustrative):

- **Transcript-tone model** (`transcript_tone_v2`) — per-call tone scoring; retrains quarterly on rolling-window transcript corpus.
- **Earnings-surprise reversal model** (`earnings_surprise_rev_v3`) — predicts post-print mean reversion conditioned on multi-factor inputs.
- **Pair-discovery model** (`pair_disco_v1`) — scores candidate pairs for stat-arb fitness.
- **Insider-cluster signal model** (`insider_cluster_v2`) — predicts forward return conditioned on cluster characteristics.
- **Estimate-revision signal model** (`estrev_v4`) — combines velocity, magnitude, and dispersion into a forward-return signal.
- **Factor-risk model** (`barra_local_v1`) — firm-internal factor model used for risk decomposition (often shared with Quinn).
- **NLP topic model** (`transcript_topics_lda_v3`) — drives `transcript_topic_distribution` features.

### 6.3 Reproducibility Guarantee

A model cannot be promoted to live without: (a) deterministic training script under version control, (b) frozen-snapshot of training data with vintage stamp, (c) frozen feature-library snapshot, (d) committed hyperparameters, (e) reproducer-job that re-trains and matches metrics within tolerance. Any model that fails reproduction during quarterly audit is flagged for immediate review.

### 6.4 Drift Dashboard (Model-Level)

Population stability index, distribution shift on inputs, calibration check on outputs (predicted vs realized over the last N days), residual structure check (autocorrelation of errors). Yellow on threshold breach, red on policy breach.

### 6.5 Deployment History

For each model, every deploy: when, by whom, alongside which strategy versions, with what config. Rollback is a button; it preserves audit history.

### 6.6 Retirement

A model is retired when: dependent strategies are all retired, or replaced by a new version that subsumes its function, or fails persistent drift. Retirement preserves the model artifact for audit but disables its consumption.

---

## 7. The Experiment Tracker

Every backtest run, every model training, every parameter sweep is logged. Searchable, comparable, reproducible.

### 7.1 The Experiment Browser

Filter by author, project (e.g. "Q1 earnings-window improvement"), status, date, parent / child relationships, tags. Each experiment card: title, author, date, status, key metrics (Sharpe, drawdown, hit rate), notes.

### 7.2 Experiment Detail Page

Inputs (data refs, feature versions, hyperparameters, code commit), full output (metrics, equity curve, attribution charts, walk-forward visualization), reproducer-link, comments, and tags. Henry's team uses tags like `earnings_window`, `pair_disco`, `factor_tilt_q2_redesign`.

### 7.3 Comparison View

Side-by-side comparison of N experiments — typical pattern: comparing 5 hyperparameter variants on the same strategy class.

### 7.4 Reproducibility

Click "Reproduce" — a queued job re-runs the experiment in a clean container. Metrics match within tolerance or the experiment is flagged as non-reproducible.

### 7.5 Multi-Testing Awareness

The tracker computes how many variations have been tried for a given strategy class and applies a multiple-testing penalty to reported Sharpe (deflated Sharpe) — preventing the team from cherry-picking a lucky run from a sweep.

### 7.6 Promotion Linkage

Promoting a strategy to paper / pilot / live requires linking the source experiment in the experiment tracker. The audit trail follows the strategy from idea to retirement.

---

## 8. Strategy Composition

A "strategy" wraps one or more models / signals / rules with sizing, entry/exit, hedging, risk gating, regime conditioning, capacity, and execution policy. The composition surface is a form-driven UI on top of a strongly typed strategy-config schema.

### 8.1 Composition Form

Sections of the form for a Henry-domain strategy:

- **Identity.** Name, family (e.g. `earnings_window`), version, owner, description, book (`systematic` vs `discretionary-assist`).
- **Universe.** Filter expression (sector, market-cap, ADV, listing exchange, restricted / watch list exclusion).
- **Signals.** One or more model / feature references with weights or rules.
- **Sizing.** Dollar-target / beta-adjusted-target / vol-targeting / Kelly-fractional / conviction-weighted; cap / floor.
- **Entry / Exit rules.** Threshold-based (z-score crossings), event-based (catalyst date), schedule-based (rebalance cadence).
- **Hedging.** None / SPX / XLK / SOXX / sector-pair / dynamic-by-factor-loading.
- **Risk gates.** Per-name max %, sector max %, factor max loading, gross / net / leverage caps.
- **Regime conditioning.** Macro filter (e.g. dampen size when VIX > X or when MOVE > Y), sector regime filter, name-specific blackouts.
- **Capacity.** Max strategy AUM, max participation %, max names held simultaneously.
- **Execution policy.** Algo selection per leg type (IS / VWAP / TWAP / POV / dark / open-auction / close-auction); cost ceilings; never-trade-through-print rule; pre-trade-compliance hooks.
- **Compliance hooks.** Restricted list, watch list, MNPI gate, 5%-of-float threshold, blackout windows.
- **Audit metadata.** Tags, link to source experiment, sign-off chain.

### 8.2 Default Stack: Risk Gates Layered

Every strategy passes through layered gates before any order leaves the system:

1. **Pre-trade compliance** — restricted / watch / MNPI / threshold.
2. **Pre-trade locate** — for shorts, locate availability and rate within strategy's policy.
3. **Pre-trade risk** — name / sector / factor / gross / net / leverage caps.
4. **Pre-trade execution sanity** — % ADV cap, spread sanity, market-state sanity (no halts).
5. **Pre-trade circuit-breakers** — fleet-level kill-switch state, name-level kill-switch state.

Any failure short-circuits; the strategy emits a structured rejection with reason codes. Rejection rates per strategy are tracked (high rates flag a config or universe issue).

### 8.3 Hedging Composition

For a long-biased factor-tilt strategy with target beta 0.0, the composition's hedging block specifies dynamic SPX / XLK hedge sized to the strategy's measured beta over a rolling 60-day window. The hedge runs as an embedded child-strategy with its own audit. For pair strategies, hedging is implicit in the pair structure.

### 8.4 Execution Policy

Per strategy, per leg type: which algo, with what parameters. Examples:

- Factor-tilt rebalance buy legs → IS algo, 10% participation cap, 20% dark-routing target.
- Earnings-window position-build → IS algo, complete by T-1 close, never trade in last 15 minutes pre-print.
- Pair entry → simultaneous-leg policy with 30s synchronization tolerance; partial-fill rule = "cancel filled leg if other leg < 50% in 5 minutes."
- M&A pre-event entry → low-participation IS, dark-first, never aggressive-take.

### 8.5 Discretionary-Assist Composition

For Henry's discretionary book, the composition surface is a stripped-down form: name, target dollar size, target average price (or "best-fill over horizon"), execution algo, compliance hooks. The composition wraps Henry's manual entry into the same audit / risk-gate stack as the systematic fleet, so discretionary trades carry the same downstream visibility.

---

## 9. Promotion Gates & Lifecycle

Strategies move through a strict lifecycle: **Research → Paper → Pilot → Live → Monitor → Retired**. Each transition requires gate-passes; nothing is informal.

### 9.1 Research

Free-form work in the workspace. No real capital. No firm-level governance beyond compute-cost accounting. Output: a candidate strategy with experiment-tracker linkage, walk-forward results, execution-realistic backtest.

### 9.2 Paper

Deployed to a paper-trading environment that consumes the same live data feeds and routes orders to a simulated venue with realistic slippage / latency / fill modeling. Runs typically 4–12 weeks. Pass criteria: paper PnL tracks backtest within tolerance; no execution-model surprises; risk-gate rejection rate within bounds; drift on inputs / outputs absent.

### 9.3 Pilot

Small live capital allocation (e.g. 5–10% of target). Real venue routing. Real fills. Runs typically 6–12 weeks. Pass criteria: live tracks paper within tolerance; live cost realized matches modeled cost; behavior under real-world stress (mini-events) acceptable. Pilot strategies are surfaced on the supervisor console in a distinct color.

### 9.4 Live

Full capital allocation per the capital-allocation engine (§10). Subject to ongoing drift monitoring, attribution review, and decay tracking (§13).

### 9.5 Monitor → Retired

A strategy moves to monitor-state when drift / decay / capacity-saturation flags cross thresholds (§13.2). Monitor strategies have reduced capital, tighter risk gates, and a re-evaluation deadline. Outcomes: retrain (back to paper), redesign (back to research), or retire. Retired strategies preserve full audit history; their slot is freed for new candidates.

### 9.6 Sanctioning

A strategy class new to the firm (not just a new instance of an existing class) requires an extra gate: **strategy-class sanctioning**, owned by David's office in coordination with Quinn. This prevents the firm from accumulating strategy classes whose risks aren't fully understood.

---

## 10. Capital Allocation

Capital allocation across Henry's fleet is a continuous, governed process. The allocation engine takes strategy-level forecasts, capacity, drawdown state, and firm-level constraints and produces per-strategy capital weights.

### 10.1 The Allocation Engine

Inputs: per-strategy expected return (model-driven, calibrated to live data), variance, covariance matrix (full fleet), capacity ceiling, drawdown state, regime conditioning, and Henry-overlay (his discretionary-book exposure).

Output: capital weight per strategy, recomputed on a configurable cadence (typically daily for systematic, intraday for risk-event-driven re-allocations).

Optimizer is mean-variance with capacity / concentration / factor / regime constraints. A robust-optimization variant with shrinkage covariance is the default to avoid corner solutions.

### 10.2 Conviction-Weighted Discretionary Sizing

For Henry's discretionary book, the platform exposes a sizing tool with explicit inputs:

- Conviction (1–5 stated by Henry).
- Asymmetry (upside / downside ratio, with downside scenario).
- Liquidity (% of ADV ceiling).
- Catalyst horizon.
- Pair vs directional flag.

The tool outputs a recommended dollar size; Henry overrides freely (with the override logged for calibration in §13).

### 10.3 Combined-Book Beta-Adjusted Net Targeting

The headline number Henry watches is the **combined-book beta-adjusted net** — systematic + discretionary, per-name beta-scaled, against his mandate band (e.g. 0.0 ± 0.2 in beta-adjusted terms). The hedge-overlay strategy (`hedge_overlay`) closes the gap continuously between the combined position and the target band. The allocation engine treats the hedge-overlay as a margin sink, not an alpha generator.

### 10.4 Regime-Conditional Caps

When firm-level regime indicators (VIX / MOVE / liquidity / cross-asset stress) cross thresholds, the allocation engine reduces gross exposure to a regime-conditional cap. This is firm-policy, not strategy-by-strategy choice, and David's office sets the thresholds.

### 10.5 Drawdown-Conditional Sizing

Per-strategy drawdown triggers dampening: at -5% peak-to-trough, halve allocation; at -10%, move to monitor (capital floor); at -15%, freeze (zero allocation pending review). Recovery returns to baseline only after sustained recovery period and review sign-off.

### 10.6 Capacity Reconciliation

Across the fleet, names that appear in multiple strategies (e.g. NVDA in factor-tilt, in earnings-window, in pair-trade) are aggregated and the combined exposure is checked against per-name capacity (% of ADV, % of float). If aggregate exceeds capacity, the engine pro-rates allocations across competing strategies based on their utility-per-capital ratio.

---

## 11. Live Fleet Supervision Console

The console where Henry watches the systematic fleet (and his discretionary book) live. Default state: green. Anomaly-driven; the screen quiets unless attention is needed.

### 11.1 The Fleet Dashboard

Layout sketch:

```
+----------------------------------------------------------------------------------+
| Status pill: ALL GREEN | Fleet PnL day: +$X | MTD: +$Y | YTD: +$Z | 14:32:11 ET |
+----------------------------------------------------------------------------------+
| Strategy           | Status | Day PnL | MTD  | Pos | Beta | Factor | Catalyst    |
| factor_tilt_qmlv   | green  | +12bps  | +1.2 |  72 | 0.04 | quality+| ----      |
| earnings_window_q2 | green  | +8bps   | +0.8 |  18 | 0.02 | -      | NVDA T+0   |
| pair_disco_active  | yellow | -3bps   | +0.4 |  42 | 0.01 | -      | -          |
| stat_arb_short     | green  | +4bps   | +0.3 | 184 | 0.00 | -      | -          |
| insider_cluster    | green  | +1bps   | +0.2 |  12 | 0.05 | momentum| -         |
| idx_rebal_q3       | sleep  | -       | -    |   0 | -    | -      | T-3        |
| hedge_overlay      | green  | -2bps   | -1.1 |   8 | -0.34| -      | -          |
| ...                                                                              |
+----------------------------------------------------------------------------------+
| Combined book: gross $1.2B | net $80M | beta-net 0.12 | VaR $14M | factors: ...   |
+----------------------------------------------------------------------------------+
```

Henry-specific columns: factor-exposure tag (which factor the strategy is currently most loaded on), per-strategy catalyst-state (next earnings date for active names), beta-net, sector-concentration. Sleeping strategies (e.g. index-rebalance strategies in quiet weeks) are visible but greyed.

### 11.2 The Strategy Detail Page

Click any strategy → drill-in:

- Live PnL chart (today, MTD, YTD).
- Position list with per-name PnL, factor-exposure, days-to-next-catalyst, exit-target.
- Recent fills and working orders.
- Live model outputs (signal scores per name in universe).
- Drift status of inputs and outputs.
- Risk-gate rejection log (last 24h).
- Linked experiment tracker entries.
- Sign-off chain and last-promotion date.

For Henry's domain, the detail page is heavy on **fundamental context per position**: clicking NVDA inside `earnings_window_q2` shows last-print surprise, current consensus, days to next earnings, current valuation z-score, recent transcript-tone-delta, all alongside the strategy's signal-score and live PnL.

### 11.3 Anomaly Detection Surface

Pattern-detect over fleet metrics: PnL outlier (vs strategy-baseline), input-drift (vs feature-distribution baseline), execution-quality outlier (vs expected-cost), gate-rejection spike, catalyst-timing miss (a strategy entered too late), correlation surprise (two strategies that should be uncorrelated are running tandem).

Anomalies surface as cards on the dashboard with severity tag (info / warn / urgent / critical) and one-click drill-in.

### 11.4 Cross-Strategy Correlation View

Live correlation matrix across the fleet (rolling 21-day, 63-day, and inception). Used to detect unintended overlap (e.g. `earnings_window_q2` and `estrev_v4` both effectively long the same earnings-revision factor at the moment). Correlation breaches the policy threshold → orange card; severe breach → red.

### 11.5 Factor Exposures + Catalyst Calendar Live State

The Henry-specific live-state pane:

- **Factor-exposure dashboard live.** Per Fama-French-5, Barra, custom factors: current loading, target band, 30-day trajectory. Green inside band, yellow approaching, red outside.
- **Catalyst calendar live.** Upcoming earnings dates across active positions, color-coded by exposure size and strategy-attribution; product launches, regulatory dates, index rebalances, lock-up expirations, investor days. Henry's typical view: next 2 weeks in detail, next quarter in summary.
- **Combined-book exposures.** Sector / sub-industry exposure of (systematic + discretionary), with mandate-band overlays.
- **Borrow / locate live state.** HTB names in the book, current borrow rates vs entry, recall risk flags.
- **Earnings-window concentration.** % of book by gross and by exposure with earnings in the next 7 / 14 days.

This pane replaces Marcus's "Multi-Venue Capital + Balance Live State" — the equivalent for Henry is factor exposures and catalyst windows, the things he most wants to feel for the combined book at a glance.

### 11.6 Strategy State Inspection

**Mandatory across all archetypes.**

For any strategy in the fleet, Henry can open a state-inspection view that shows:

- **Internal-state snapshot.** All material model outputs, signal scores, position decisions, pending-orders, last-rebalance-decision, current parameters. This is per-strategy, on-demand or event-pushed (not streamed live for every strategy of every variable — engineering pragmatism dictates that a fleet of 60–80 strategies producing per-name signals on a 1000-name universe would saturate the wire if streamed).
- **Backtest-vs-live comparison.** A daily-default refresh that compares yesterday's live decisions to what the same strategy would have decided in backtest given the same inputs. Mismatches above tolerance are flagged. Common causes: live-data freshness lag, execution slippage diverging from model, drift in input features, restricted-list interaction.

**Engineering pragmatism.** Internal state is captured at strategy-decision boundaries (each rebalance, each entry / exit, each parameter-update). On-demand inspection re-hydrates state from the captured records. Real-time streaming is offered only for diagnostic mode on a single strategy at a time.

**Inspection workflow.** Henry opens `earnings_window_q2` → state inspection → today's signal-scores per name → click NVDA → see input feature values, model outputs, the sizing decision, the gate evaluation (passed / failed), the order-routing decision, the fills. For backtest-vs-live, the system regenerates the same state from a backtest run on the same data and shows side-by-side. This is the surface that catches silent bugs faster than PnL alone.

### 11.7 Why this matters

The console encodes Henry's attention budget. Default-green keeps him from drowning. Anomaly-driven escalation means his eyes go where they're needed. Per-strategy drill-in with fundamental context preserves the context-switch cost; he doesn't leave the console to reach Bloomberg. Strategy state inspection turns the fleet from a black box into a glass box without saturating the network.

---

## 12. Intervention Console

Henry's controls over the fleet — surgical at one end, firm-wide at the other.

### 12.1 Per-Strategy Controls

For any strategy on the dashboard:

- **Pause.** Stop new entries; existing positions managed normally. Pending orders cancel.
- **Reduce.** Halve, quarter, or set explicit allocation; existing positions wound down to the new ceiling using the strategy's exit policy.
- **Flatten.** Wind down the entire strategy to zero exposure, using its exit policy (which itself can be overridden if needed — e.g. "exit all in 30 minutes" vs "exit gracefully by close").
- **Modify parameters.** A subset of strategy parameters are runtime-adjustable (sizing scalar, risk-cap multipliers); structural parameters require a re-promote.
- **Quarantine.** Stop the strategy entirely with all positions held; flag for manual inspection. Used when the strategy looks broken but Henry doesn't want to flatten on bad fills.

Every action prompts confirmation; every action is signed by the operator and audited.

### 12.2 Group Controls

- **Per-strategy-class.** Pause / reduce all strategies in a class (e.g. all earnings-window strategies during an unusual market regime).
- **Per-sector.** Pause / reduce all strategies' exposure to a sector (e.g. exit all semis on a major industry shock).
- **Per-factor-loading.** Reduce gross loading on a factor (e.g. cut momentum loading by half across the fleet).
- **Per-catalyst-window.** Skip the upcoming catalyst window for the named family (e.g. skip the next semis-earnings window across the earnings-window strategies — a Henry-judgment call).
- **Per-name.** Quarantine a name across all strategies (e.g. NVDA halted after a CEO-departure headline; no strategy may add or trim until Henry releases).

### 12.3 Manual Trading & Reconciliation

**Mandatory across all trader archetypes.**

The full manual ticket from Phase 2 is preserved. Henry can:

- **Single-name manual ticket.** Buy / sell with all the controls in [§Phase 2 / common-tools.md#2 Order Entry Ticket Framework](common-tools.md#2-order-entry-ticket-framework) — limit / market / IS / VWAP / TWAP / dark-pool-routing / open-auction / close-auction. With pre-trade compliance, locate, and risk-gate hooks identical to systematic-fleet routing.
- **Pairs ticket.** Long-leg + short-leg manual entry with synchronization rules (see manual-mode pairs description above). The systematic fleet does not crowd this surface; it's preserved for the discretionary book and for emergency overlay trades.
- **Basket ticket.** Upload-or-build basket, basket-level execution algo, leg drilldown — preserved from manual mode.
- **Risk-arbitrage / event ticket.** For announced M&A (preserved; though typically Henry's M&A work happens at the firm-systematic level via Naomi's automated cousin, not Henry's, the manual ticket remains for special situations).
- **Tagging.** Every manual trade is tagged `book=discretionary` (default) or `book=manual-override` for emergency interventions on behalf of a misbehaving systematic strategy (with reason code and sign-off).

**Reconciliation workflow.** End-of-day reconciliation across (a) systematic fleet fills, (b) discretionary fills, (c) manual-override fills, (d) hedge-overlay rebalances. Mismatches between intent (strategy decision) and outcome (executed fills) are flagged. Reconciliation is a 2-eye check; Henry signs off the day's positions before the post-trade run.

**Emergency mode.** A "panic" hotkey opens a stripped-down emergency-mode ticket: cash-out a name, cash-out a sector, cash-out the discretionary book, or invoke a fleet-wide kill (with multi-key authorization where required by §12.4). Designed to be fast under stress.

**Global hotkeys (preserved).** Buy / sell at NBBO; cancel-all-on-name; flatten-name; move-stops. Same bindings as manual mode so muscle memory transfers.

**Tagging-and-audit.** Every manual action is captured with operator ID, timestamp, reason code (free-text for emergency overrides), and pre-trade-state snapshot. The audit log is immutable and cross-references the strategy state at the time of the action.

### 12.4 Kill Switches at Multiple Scopes

Hierarchy:

1. **Single-strategy kill.** Henry's button.
2. **Strategy-class kill.** Henry's button.
3. **Henry-fleet kill.** Henry's button — stops everything Henry owns; doesn't touch other archetypes' fleets.
4. **Henry-fleet-and-discretionary kill.** Henry's button — flattens everything in his book.
5. **Firm-wide equity-long/short kill.** Multi-key (Henry + Quinn / David). Stops all equity-LS-style strategies firm-wide.
6. **Firm catastrophe kill.** Multi-key (David's office). Hard-stop on all firm activity.

Each kill has a documented unwind policy (immediate flatten vs graceful unwind vs hold-and-monitor).

### 12.5 Intervention Audit Log

Every intervention — pause, flatten, override, kill — is logged with operator, timestamp, reason, before-state, after-state, and downstream effects. The log is search-and-filterable; David's office samples it as part of behavioral monitoring.

### 12.6 Why this matters

Henry's instinct to override the fleet — when the headline doesn't fit any model, when his thesis is louder than the signal, when something looks broken — is preserved without ambiguity. The intervention console makes the override structured (auditable, multi-scoped, gated on multi-key for the heaviest moves) rather than freelancing through the manual ticket. The platform is opinionated about visibility; Henry remains opinionated about intervention.

---

## 13. Post-Trade & Decay Tracking

Per-strategy retrospectives, fleet-level review, decay metrics, retrain queue, retire decisions.

### 13.1 Per-Strategy Retrospective

Daily, weekly, monthly, quarterly. Standard cuts: PnL, attribution, hit rate, average win / loss, slippage vs model, capacity-utilization, drift-state. Anomaly weeks get a written commentary by the strategy owner.

### 13.2 Decay Metrics

- **Sharpe decay.** Rolling Sharpe trajectory per strategy; trend and step-changes flagged.
- **Hit-rate decay.** Rolling hit rate on entry signals.
- **Cost decay.** Rolling cost-realized vs cost-modeled; widening means execution is worse than backtest assumed.
- **Calibration decay.** For probability-output strategies, calibration drift (predicted vs realized).
- **Capacity saturation.** Rolling % of ADV / float-utilization; rising trend means strategy is hitting capacity.

A strategy crossing yellow on any metric goes on the watch-queue; crossing red triggers monitor-state.

### 13.3 Catalyst-Outcome Tracker

Henry-distinct, preserved from manual mode (Phase 4): every earnings-window position closed gets the standard analysis (expected vs realized move, position-PnL through the catalyst, decision-quality post-hoc), and the systematic earnings-window strategies feed the same tracker. This creates a single source of truth for Henry's catalyst skill — across discretionary book and systematic fleet.

### 13.4 Calibration Tracking on Discretionary Book

Henry's stated convictions and recommended sizes (from §10.2) are tracked alongside realized outcomes. Monthly: was conviction-rank correlated with PnL-rank? Quarterly: is Henry calibrated, over-confident, under-confident? Output is a single chart — not a verdict — Henry acts on it.

### 13.5 Retrain Queue

Strategies whose drift / decay flags trigger retrain go into a queue. Quant team works the queue. Retrained strategies repeat the paper-pilot-live gate.

### 13.6 Retirement

Retire decisions: strategy underperforms baseline persistently, capacity is saturated to where edge is below target, regime has shifted such that the strategy's premise no longer holds. Retirement preserves audit history; capital frees for new candidates. Retirement is a Henry decision with David sign-off for material allocations.

---

## 14. The Supervisor Console — Henry's Daily UI

Henry's monitor layout in the automated world. Some manual surfaces remain (now in periphery); new automation surfaces (research workspace launcher, fleet dashboard, allocation console, intervention console) take foveal real estate.

### 14.1 Layout Sketch (6-monitor configuration retained)

| Position      | Surface                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| Top-left      | **Fleet dashboard (foveal)** — strategy list, status, PnL, factor / catalyst tags                                    |
| Top-center    | **News & research feed** — filtered to coverage names + portfolio + active-catalysts; NLP-flagged events highlighted |
| Top-right     | **Catalyst calendar live** — next 14 days, color-coded by exposure size                                              |
| Middle-left   | **Strategy detail / state inspection** — drill-in pane (changes as Henry clicks a strategy)                          |
| Middle-center | **Combined-book risk panel + factor-exposure dashboard live**                                                        |
| Middle-right  | **Manual order entry (pairs / basket / single-name) + intervention console**                                         |
| Bottom-left   | **Sector + macro + factor context** — XLK heatmap, factor returns today, indices                                     |
| Bottom-right  | **Comms panel** (sell-side, IR, expert-network, internal analyst chat) + alerts queue                                |
| Tablet        | Earnings-call audio, sell-side conference webcasts, news-terminal                                                    |

The chart workspace and the fundamental data panel from manual mode are still accessible (two clicks away on the strategy-detail-pane), but they're not foveal during normal supervisor operation. They re-emerge when Henry is doing discretionary research or manual-override work.

### 14.2 Mode Switching

Henry's day has distinct modes; the console swaps emphasis on hotkey:

- **Pre-market mode.** Catalyst calendar foveal; overnight-news flags; pre-market positioning; pending fleet-rebalance preview.
- **In-market supervision mode.** Fleet dashboard foveal; alerts queue active; news feed peripheral.
- **Earnings-event mode.** Triggered automatically when an earnings print is imminent for an active position. Real-time straddle-derived expected move; pre-print position summary; hotkey-armed manual overrides.
- **Research mode.** Fleet dashboard collapses to a banner; workspace + experiment tracker take foveal.
- **Post-market mode.** Reconciliation queue, daily PnL commentary draft, attribution panels, decay-tracker.
- **Earnings-season mode.** Toggled by season (Jan / Apr / Jul / Oct intensity); higher density of catalyst events; transcript-search panel surfaces; analyst-team chat foveal.

Mode switching preserves layout state per mode.

### 14.3 Anomaly-Driven Default

Default state when nothing is wrong: a quiet, mostly-green dashboard with a small notification area. Henry can be reading research or talking to an analyst without his attention being constantly pulled. Anomalies (yellow / red cards on the dashboard or alerts queue) pull his attention with deliberate visual hierarchy.

### 14.4 Workspace Persistence

Layout state per mode persists across sessions. Henry's color preferences, alert thresholds, watchlist filters, and workspace splits survive reboots. See [common-tools.md#30 Customizable Layout & Workspace](common-tools.md#30-customizable-layout--workspace).

---

## 15. Henry's Automated-Mode Daily Rhythm

Equity markets are bounded (NY 9:30–16:00 ET cash session, plus pre / after-market for earnings reactions). Henry's rhythm is **earnings-season-driven** and **market-hours-bounded** — different from Marcus's 24/7 crypto world.

### 15.1 Pre-Market (typically 6:30–9:30 ET)

- **6:30–7:00.** Quick read of overnight: futures (NQ / ES), Asia / EU close, key macro datapoints, overnight news on coverage names. Most of this is pre-digested in the news-NLP feed; Henry scans the flagged items.
- **7:00–7:30.** Catalyst-calendar review for the day. Active positions with prints today, upgrades / downgrades since last close, Form 4 filings overnight.
- **7:30–8:30.** Sell-side morning calls on tablet (often passive listening). Read morning research notes flagged on his coverage.
- **8:30–9:00.** Pre-market positioning review. Fleet-dashboard scan: any strategies that ran overnight (in particular `idx_rebal_*` strategies that deploy near auctions, `earnings_window_*` strategies pre-positioning for today's prints), confirmation that pending-rebalance orders for the open are reasonable.
- **9:00–9:30.** Last-minute review with quant team and analyst team; any overnight overrides? Pre-open auction placements monitored.

During earnings season this period extends and is more intense (more flagged events, more prep on transcript-tone deltas from prints).

### 15.2 In-Market (9:30–16:00 ET)

- **9:30–10:00.** Open auction outcomes, opening-range volatility absorbed; fleet's first-30-min moves checked; any anomalies investigated.
- **10:00–11:30.** Quiet supervision. Henry reads research, takes calls (expert network, IR, sell-side), reviews quant-team progress on backlog. Default-green console.
- **11:30–13:00.** Often a research / analyst meeting block. Henry pivots to research mode.
- **13:00–15:00.** Second half supervision. Fleet decay-tracker scan (mid-day check). Discretionary-book monitoring.
- **15:00–15:45.** Pre-close prep. Auction-imbalance reads. Last-minute discretionary trims / adds. Earnings-window strategies arming for after-market prints.
- **15:45–16:00.** Closing auction. Fleet-MOC / LOC fills land. Henry watches.
- **16:00–16:30.** After-hours earnings prints (companies that report after-close). Earnings-window strategies execute their post-print decisions; Henry watches the tape and the strategy state-inspection feed for any surprises. Manual override prepped if a print is anomalous on a discretionary name.

### 15.3 Post-Market (16:30–18:00 ET, sometimes later)

- **16:30–17:00.** Reconciliation across all books. Sign-off of the day's positions.
- **17:00–17:30.** Daily PnL commentary draft (auto-generated; Henry edits). Attribution panel scan. Decay-tracker scan.
- **17:30–18:00.** Quant-team / analyst-team end-of-day debrief. Plan for tomorrow's catalysts.

### 15.4 Weekly / Quarterly

- **Weekly.** Procurement check (data layer); strategy-portfolio review; correlation-monitoring; intervention-audit-log sample.
- **Quarterly.** Strategy-class review with David / Quinn; capital-allocation reset; new-strategy-class sanctioning candidates.
- **Earnings-season cadence (4× per year).** Heavier transcript-search work; per-name calibration on transcript-tone-delta features; earnings-window strategy parameters re-tuned post-season.

### 15.5 Off-cycle

When Henry is travelling or out (e.g. attending a sell-side conference), the fleet runs supervised by his quant lead and the firm-supervisor desk; emergency intervention authority transfers temporarily with audit. Henry retains read-only mobile access; the only action authorized remotely is panic-flatten.

---

## 16. Differences from Manual Mode

A summary table comparing manual vs automated for Henry across consistent dimensions.

| Dimension            | Manual Mode (today)                                                   | Automated Mode                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coverage             | ~80–120 names actively followed; ~10–20 active positions              | ~1000-name systematic universe + 10–20 discretionary positions; fleet of 60–80 strategies                                                             |
| Trades per day       | ~5–25 (mostly few large discretionary) plus rebalances                | Hundreds–thousands across the systematic fleet plus Henry's discretionary trades                                                                      |
| Phase 1 (Decide)     | Charts + fundamentals + transcripts + expert calls + catalyst         | Same for discretionary; for systematic, the workspace + experiment tracker + feature library replace ad-hoc decision-making                           |
| Phase 2 (Enter)      | Single-name / pair / basket ticket; broker phone for blocks           | Composition surface produces orders; manual ticket preserved for discretionary + emergency                                                            |
| Phase 3 (Hold)       | Positions blotter + risk + catalyst tracker + alerts                  | Fleet supervision console with anomaly-driven default; same Phase-3 surfaces for discretionary book                                                   |
| Phase 4 (Learn)      | Trade journal + PnL attribution + catalyst-outcome tracker            | Decay tracking + automated retrospectives + calibration tracking + cross-strategy attribution                                                         |
| Time on charts       | 30–40% of in-market                                                   | 5–10% of in-market (state-inspection drill-ins); chart workspace 2-clicks-away                                                                        |
| Time on research     | 30–40% (incl. expert calls, transcript reads)                         | 30–40% (no change — research depth on discretionary book is preserved; fleet research delegated to quant team)                                        |
| Time on supervision  | Implicit (positions blotter + ticker scan)                            | Explicit primary surface (fleet dashboard + alerts queue)                                                                                             |
| Time on intervention | Frequent (every entry / exit decision)                                | Rare (Henry overrides the fleet only when his judgment is louder than the signal); structured and audited                                             |
| Latency criticality  | Moderate (most trades aren't latency-sensitive; earnings windows are) | Low for systematic (algos absorb latency); moderate for earnings-window (sub-minute matters around prints); preserved for discretionary               |
| Risk units           | $ gross / net + beta-adjusted net + factor exposures                  | Same, computed on combined book; per-strategy + fleet + combined views                                                                                |
| Edge metric          | Sharpe + alpha attribution + catalyst-outcome win rate                | Per-strategy Sharpe / DSR + fleet Sharpe + combined-book Sharpe; calibration on discretionary book separately                                         |
| Cognitive load       | High on a few names; lower on the rest                                | Lower on systematic-fleet decisions (delegated); preserved on the 10–20 discretionary names; new load on supervisor / governance work                 |
| Failure modes        | Bad thesis; bad sizing; bad entry / exit timing; emotional response   | Bad strategy design; data-feed failure; silent feature drift; capacity saturation; correlation-drift across fleet; bad governance                     |
| Tools mastered       | Bloomberg / Refinitiv / TradeStation / OMS / Excel / DCF models       | Workspace + feature library + composition surface + supervisor console + intervention console; Bloomberg / Refinitiv / DCF retained for discretionary |
| Compensation driver  | Combined book PnL with attribution to skill                           | Combined book PnL + attribution split to systematic vs discretionary; firm allocates capital per-book performance                                     |

The fundamental change: Henry's edge moves from "depth on every name in his book" to "depth on a small high-conviction discretionary book + governance over a systematic fleet that harvests structural and statistical edges he could never cover manually." His personal AUM and PnL contribution grow because the fleet is doing work he previously couldn't.

---

## 17. Coordination with Other Roles

Henry's automated cousin coordinates with peers, the firm-systematic overseer, and the firm-supervisor.

### 17.1 Coordination with Sasha (Equity Vol)

Sasha is Henry's adjacent peer — equity-vol structures often overlap with Henry's directional names.

- **Vol surfaces on Henry's coverage.** Sasha's pricing of vol on AAPL / MSFT / NVDA / etc. is visible to Henry's automated cousin; Henry's directional thesis on those names feeds into Sasha's vol context. Shared dashboard panel: "vol surface vs directional thesis" per name.
- **Earnings-window coordination.** Sasha's gamma / vega exposure on prints overlaps with Henry's earnings-window strategies. Coordination: pre-print, the two desks synchronize to ensure they're not unintentionally doubling exposure on the same name. Ad-hoc convo, often via inter-desk chat with shared dashboard for the upcoming print.
- **Skew-driven entry signals.** Henry's earnings-window strategies can use IV skew as a feature; Sasha's strategies can use Henry's directional signal as input. Cross-pollination via the feature library.
- **Hedging coordination.** When Henry's book is short-vol-implicitly (e.g. concentrated long-positions running through earnings without vol-hedge), Sasha's desk can offer a structure; the firm-systematic strategies don't replace this human-to-human conversation.

### 17.2 Coordination with Quinn (Cross-Archetype Overseer)

Quinn runs cross-archetype factor / stat-arb / market-neutral firm-systematic strategies. Coordination is essential to avoid double-up:

- **Shared feature library.** Many features Henry's fleet uses are owned by Quinn's team or shared — `factor_loading_*`, `momentum_residual_*`. Versioning is governed.
- **Correlation-drift watch.** Quinn's correlation matrix includes Henry's fleet; if Henry's fleet's loadings drift such that they overlap with Quinn's firm-systematic factor strategies, an orange card surfaces on both consoles.
- **Promotion-gate awareness.** When Henry promotes a new strategy that loads on a factor Quinn already harvests, the gate requires acknowledgment from Quinn's team about capacity-overlap.
- **Capacity reconciliation.** Per-name capacity is shared firm-wide (not just within Henry's fleet). When Henry's `earnings_window_*` and Quinn's firm-stat-arb both want NVDA in the same direction, the cap is shared and pro-rated.
- **Strategy-class sanctioning.** New strategy classes in Henry's fleet that resemble Quinn's existing classes go through joint review.

### 17.3 Coordination with David (Firm Supervisor / Head of Risk)

- **Fleet aggregation.** David sees Henry's fleet as one node in the firm-wide-fleet view; his console aggregates beta / factor / sector / VaR across all archetypes.
- **Behavioral monitoring.** Henry's intervention-audit-log is sampled by David's office; patterns of override (frequency, sign, post-hoc PnL) inform calibration conversations.
- **Capital allocation.** David's office decides how much firm capital sits in Henry's book overall; Henry decides how that capital splits across strategies subject to caps and policies.
- **Promotion sign-off.** Material strategy promotions (large capital allocation, new strategy classes) carry David sign-off.
- **Catastrophe response.** Multi-key kill-switches require David's authority for the heaviest scopes (firm-wide kill, equity-LS kill).
- **Model-risk governance.** Drift / decay events that breach policy require disclosure to David's office; the model-risk committee meets quarterly with Henry's strategy class roster as input.

### 17.4 Coordination with Henry's Quant Team and Analyst Team

- **Quant team** owns the feature library, model registry, and strategy implementations day-to-day. Henry sets direction and governance; they execute.
- **Analyst team** continues to do fundamental research on the discretionary names and contributes domain features (transcript keyword trackers, expert-network signals) to the feature library.
- The two teams meet daily (pre-market and post-market) with Henry as the common point.

### 17.5 Why this matters

The fleet is not Henry-alone; it is the product of Henry + quant-team + analyst-team + Quinn + Sasha + David + the platform. Coordination surfaces and shared dashboards encode the structure rather than relying on calendar invites. Capacity and risk are firm-wide concerns, not silo concerns; the platform makes that visible without requiring Henry to ask.

---

## 18. How to Use This Appendix

Evaluation questions for assessing any platform implementation against Henry's automated terminal. Gaps may be deliberate scope decisions but should be **known** gaps, not accidental ones.

### 18.1 Data layer

- Are point-in-time-correct fundamentals (Compustat / FactSet) integrated with strict no-look-ahead enforcement?
- Are earnings-call transcripts (full text, 10+ year archive) and audio (time-aligned) ingested and searchable?
- Are sell-side research notes aggregated and structured (initiation / upgrade / target / etc.) with full-PDF link?
- Are expert-network call notes captured and tagged to names with NLP feature extraction?
- Are corporate-actions (splits / dividends / M&A / spinoffs / ticker changes) handled correctly for backtest accuracy?
- Are short-interest / borrow-rate / locate-availability feeds ingested with the freshness backtests require?
- Are alt-data feeds (web traffic, app installs, satellite, supply-chain) accessible and governed?
- Are point-in-time vintage and as-of-date traceable for every dataset and every backtest?

### 18.2 Feature library

- Are Henry-domain features (transcript-tone, estimate-revision, insider-cluster, factor-loadings, valuation-z-scores, etc.) cataloged, versioned, governed?
- Is cross-pollination with Quinn's features (factor / momentum / quality) explicit and tracked?
- Is feature drift monitored with thresholds and alerts?
- Are unit-tests + sample-distributions + lineage upstream all visible per feature?
- Is feature ownership (per-feature owner, retraining cadence, deprecation policy) clear?

### 18.3 Research workspace

- Is the workspace integrated with data catalog + feature library + experiment tracker (not a separate Jupyter island)?
- Does the backtest engine model cash-equity-execution realism (slippage curves, spreads, commissions, borrow cost, locate availability, partial fills, auction fills, settlement cycle, halt / IPO awareness)?
- Are walk-forward, PSR / DSR, and multiple-testing-penalty applied automatically?
- Are anti-patterns (look-ahead, survivorship bias, borrow-look-ahead, silent multiple-testing) prevented at gate?
- Are strategy templates available for the canonical Henry-domain strategy classes (pair-trade, factor-tilt, earnings-window, stat-arb, sector-rotation, insider-cluster, estimate-revision, index-rebal, M&A pre-event)?

### 18.4 Model registry & experiment tracker

- Are all models versioned with full reproducibility (deterministic training, frozen data, frozen features, committed hyperparameters)?
- Is drift monitoring per-model with population-stability-index, distribution-shift, calibration-check?
- Is every backtest / training run logged in the experiment tracker with reproducer-link and tags?
- Is multiple-testing awareness applied with a deflated-Sharpe penalty?
- Is promotion to live tied to a specific source-experiment in the tracker?

### 18.5 Strategy composition

- Does the composition surface support Henry-domain strategy types (pair, factor-tilt, earnings-window, stat-arb, basket, M&A pre-event, hedge-overlay)?
- Are pre-trade gates layered (compliance / locate / risk / execution-sanity / circuit-breakers) and all enforced before any order leaves?
- Is execution policy specifiable per leg type (algo, participation cap, dark / lit split, auction routing, never-trade-through-print)?
- Does the discretionary-assist composition wrap manual entry into the same audit / risk-gate stack?

### 18.6 Lifecycle

- Is the Research → Paper → Pilot → Live → Monitor → Retired path enforced with documented gates?
- Are paper strategies running on real-time live data with realistic execution?
- Are pilot strategies surfaced distinctly on the supervisor console?
- Does strategy-class sanctioning involve David's office for new classes?

### 18.7 Capital allocation

- Does the allocation engine handle expected-return / variance / covariance / capacity / drawdown / regime / Henry-overlay?
- Is the combined-book beta-adjusted net continuously targeted with a hedge-overlay?
- Are regime-conditional caps configurable (firm-policy)?
- Are drawdown-conditional sizing rules clear (yellow / monitor / freeze thresholds)?
- Is per-name capacity reconciled across competing strategies firm-wide?

### 18.8 Live fleet supervision

- Is the fleet dashboard anomaly-driven and default-green?
- Are factor-exposure live + catalyst-calendar live foveal?
- Is per-strategy state-inspection on-demand or event-pushed (not real-time-stream)?
- Is backtest-vs-live comparison available daily-default per strategy?
- Does the cross-strategy correlation view surface unintended overlap?

### 18.9 Intervention console & manual trading

- Are per-strategy controls (pause / reduce / flatten / modify / quarantine) audited and operator-signed?
- Are group controls available at strategy-class / sector / factor / catalyst-window / per-name scopes?
- Is the manual ticket preserved (single-name / pair / basket / risk-arb / event) with same gate stack?
- Does reconciliation cover all books (systematic / discretionary / manual-override / hedge-overlay)?
- Is emergency mode fast (single hotkey, pre-approved unwind paths) and audited?
- Are kill-switches scoped (single / class / Henry-fleet / equity-LS firm-wide / firm-catastrophe) with multi-key for the heavy ones?
- Is every intervention captured in an immutable, searchable log?

### 18.10 Post-trade & decay

- Are per-strategy retrospectives auto-generated daily / weekly / monthly / quarterly?
- Are decay metrics (Sharpe / hit-rate / cost / calibration / capacity) tracked with thresholds?
- Is the catalyst-outcome tracker fed by both systematic earnings-window strategies and discretionary positions?
- Is calibration on Henry's stated convictions tracked monthly / quarterly?
- Is the retrain queue + retire decision-process governed and auditable?

### 18.11 Supervisor console

- Does the layout preserve Henry's 6-monitor structure with workspace persistence per mode?
- Are mode-switches (pre-market / in-market / earnings-event / research / post-market / earnings-season) hotkey-driven?
- Does default-state quiet the screen so Henry's attention stays on research / analyst conversation?
- Are anomaly-cards visually prominent without being noisy?

### 18.12 Daily rhythm

- Does the rhythm support pre-market / open / supervision / pre-close / after-hours-prints / post-market / weekly / quarterly cadences?
- Does earnings-season mode adjust density and surfaces appropriately?
- Is off-cycle handling (Henry travelling) supported with read-only mobile + emergency-flatten authority transfer?

### 18.13 Coordination

- Is shared dashboarding with Sasha (vol surface vs directional thesis) and earnings-window synchronization in place?
- Is the cross-archetype factor / capacity / correlation coordination with Quinn enforced (not just visible)?
- Does David's office receive the fleet-aggregation / behavioral-audit / model-risk inputs in usable form?
- Are quant team and analyst team coordination surfaces (feature library contributions, daily debriefs, research-backlog) integrated with the platform?

### 18.14 Cross-cutting

- Is the discretionary-vs-systematic split traceable end-to-end (book tag, attribution, capital-allocation, audit)?
- Are point-in-time-correct backtests and reproducible models the default, with anti-pattern prevention at gate?
- Is opinionated-about-automation / humble-about-judgment encoded — not as documentation but as the actual surface design (the platform doesn't pretend the discretionary book is automatable)?

Gaps may be deliberate scope decisions but should be **known** gaps, not **accidental** ones.
