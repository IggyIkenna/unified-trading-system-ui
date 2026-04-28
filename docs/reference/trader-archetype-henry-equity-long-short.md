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
