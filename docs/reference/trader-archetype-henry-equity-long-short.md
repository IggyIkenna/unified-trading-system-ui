# Trader Archetype — Henry Whitfield (Senior Equity Long/Short PM, Tech Sector)

A reference profile of a top-performing fundamental equity long/short PM — sector specialist (technology) — at a top-5 firm. Used as a yardstick for what an ideal **single-name equities** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For sister archetypes on the same desk, see the other `trader-archetype-*.md` files in this folder.

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
- He sizes positions by **conviction** plus **risk-adjusted upside/downside**, not by signal strength.
- He thinks in **catalysts**: earnings, product launches, regulatory rulings, M&A, conferences. Catalysts crystallize thesis into PnL — or break it.
- He pairs positions: long the high-conviction name, short the lower-quality competitor (or sector ETF) to neutralize beta.

His longest hold can be 18 months. His shortest, days around an earnings event. He's not a day-trader, but he's not a buy-and-hold investor either.

### His cognitive load

Henry covers ~100 names. He's not staring at 100 charts. He's:

- Tracking ~10–20 active positions deeply.
- Tracking ~30–40 names on a watchlist with active thesis.
- Tracking the rest at sector-level health.

The terminal must support this **tiered attention** — different depth for different names.

He must also **synthesize**: a Reuters headline + a sell-side note + a Twitter thread from a credible analyst + an earnings transcript snippet → does that change his model? The terminal feeds the synthesis; it does not replace it.

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

Note: Henry typically has a **separate research environment** (often an on-prem analyst workstation or a notebook environment) for deep model-building. The terminal supports trading + monitoring; the research lives elsewhere but is linked.

---

## Phase 1: Decide

For Henry, "decide" is mostly **building and updating thesis**, sized over weeks. The data sources are radically different from a crypto trader.

### Charts and price action

- **Multi-TF charts**: daily, weekly, monthly are the norm. Intraday matters around earnings or catalysts.
- **Volume profile** — institutional accumulation / distribution patterns.
- **Relative strength** — name vs sector vs index, normalized line overlays.
- **Earnings markers on chart** — every prior earnings date as a vertical line, with surprise direction.
- **Insider trading markers** — Form 4 buys and sells annotated on chart.
- **Short interest overlay** — 13F-driven, days-to-cover, % of float.
- **Indicators of interest:** moving averages, anchored VWAP from key dates (earnings, product launch), Bollinger bands.

### Fundamental data

- **Financial statements** — income, balance sheet, cash flow, last 5–10 years quarterly.
- **Common-size statements** — revenue mix, margin trends.
- **Segment reporting** — for multi-segment companies, revenue / profit by segment.
- **Estimate revision dashboard** — sell-side EPS / revenue estimates, consensus, dispersion, revision direction over 1m / 3m / 6m.
- **Estimate vs actual track record** — beat / miss history with magnitudes.
- **Guidance tracking** — management's guidance, prior guidance, raise/cut history.
- **Capital structure** — debt maturities, share count, buyback history, dividend.

### Valuation panel

- **Current multiples** — P/E, EV/EBITDA, EV/Sales, P/FCF, P/B as relevant.
- **Multiples history** — 5-year range, current vs median.
- **Peer comparables table** — same-sector peers, ranked by relevant multiple.
- **DCF link** — Henry's analyst's model, parametric, with key sensitivities.
- **Reverse DCF** — what does today's price imply about growth / margin assumptions?
- **Implied probability** of upside scenario vs base vs downside.

### News & research

- **Filtered news feed** — Reuters, Bloomberg, FT, WSJ, sector-specific (TheRegister, The Information, etc.), trade press.
- **Sell-side research aggregation** — every initiation, upgrade, downgrade, target change with link to full report.
- **Analyst day calendar** with materials.
- **Conference calendar** — Henry attending, watching, or having sales-side relay.
- **Earnings transcript search** — full-text searchable across coverage universe.
- **Expert network calls** — scheduled and historical, with notes.
- **Competitor / supplier / customer mentions** — natural-language extracted.

### Catalyst calendar

The most important calendar for Henry:

- **Earnings dates** with expected release time, consensus expectations, expected move from straddle.
- **Product launches** (e.g. iPhone event, Nvidia GTC, AWS re:Invent).
- **Regulatory dates** (FDA for biotech, FTC/DOJ for M&A, SEC for filings).
- **Index rebalances** — when does this name enter / exit which index.
- **Lock-up expirations** for recent IPOs.
- **Investor days, analyst days.**
- **Board meetings, dividend ex-dates.**

### Sentiment & positioning

- **Short interest** trend, days-to-cover, fail-to-deliver.
- **Options skew** — put skew vs call skew on the name.
- **Options open interest** by strike — gamma walls, max pain.
- **Hedge fund crowding** (per 13F data) — names where many funds are long, contrarian risk.
- **ETF flows** affecting the name (in/out of XLK, SOXX, etc.).
- **Twitter / X / Stocktwits sentiment** — useful for retail-name risk.

### Macro & sector

- **Macro tickers always visible** — DXY, US 10Y, SPX futures, VIX, MOVE.
- **Sector heatmap** — XLK constituents performance.
- **Factor exposure dashboard** — value vs growth, momentum, quality, low-vol; Henry's book exposures vs those factors.
- **Style box drift** — has his net exposure drifted from his stated mandate?

**Layout principle for Decide:** charts and fundamentals share the foveal space. News feed is constantly scrolling peripheral. Catalyst calendar is the planning surface he opens daily.

---

## Phase 2: Enter

Equities entry differs from crypto entry in important ways:

- Far more **liquidity considerations** at the single-name level (market cap, ADV, % of daily volume).
- **Compliance & restrictions** — restricted lists, blackout periods, insider information procedures.
- **Locate / borrow** for shorts — must arrange before selling.
- **Smart order routing** across many venues (NYSE, NASDAQ, dark pools, ATSs).

### Single-name order ticket

- **Symbol, side, size, type, TIF, venue strategy.**
- **% of ADV preview** — "your order is 4% of 30-day ADV; estimated impact 12bps."
- **VWAP / TWAP / IS algos** with custom parameters.
- **Dark / lit routing options** — % to dark pools, midpoint pegging.
- **Hidden / iceberg sizing.**
- **Pre-trade compliance check** — "this name is on watch list, requires approval" / "you're at 4.9% of float, 5% triggers 13D filing."
- **Locate availability** for shorts — borrow rate, hard-to-borrow flag.
- **Settlement preview** — T+1 / T+2 implications for cash.

### Pairs ticket

A first-class entry mode:

- Long leg + short leg, sized by ratio (dollar-neutral, beta-neutral, or custom).
- **Live spread** displayed in z-score terms.
- **Ratio limit orders** — execute when spread reaches X.
- **Leg-by-leg order placement** with synchronization rules.

### Basket ticket

- Upload or build a basket of names, with weights.
- Execute as a basket via specialized algo (sensitive to relative liquidity).
- Track basket-level fills and PnL.

### Risk arbitrage / event ticket

For M&A spreads:

- Buy target, short acquirer (cash-and-stock deals).
- Deal-break risk preview.
- Spread-to-deal-close in $ and bps.
- Time-to-close estimate.

### Pre-trade greeks / risk preview

- Delta added to book ($).
- Beta-adjusted exposure added.
- Sector concentration impact.
- Factor exposure impact.
- Margin / leverage impact.
- Estimated all-in cost (commission + impact + spread + financing).
- **Compliance attestation** — large positions require sign-off.

### Block trading

- Indications of interest from broker dealers.
- Block desk chat aggregated.
- Cross-network access (Liquidnet, Cboe, etc.).
- Direct broker call for size.

### Execution algos (richer than crypto)

- **Implementation shortfall** — minimize total cost vs decision price.
- **VWAP / TWAP** with curve shaping.
- **POV** — % of volume.
- **Liquidity-seeking** — dark first, lit if needed.
- **Close auction algos** — participate in MOC / LOC.
- **Open auction algos** — participate in opening auction.
- **Earnings-window algos** — defer or accelerate around earnings.

### Hotkeys

- Standard buy/sell at NBBO.
- Cancel all on this name.
- Move stops.
- Flatten name.

**Layout principle for Enter:** the single-name ticket is dominant. Pairs and basket modes selectable. Compliance and locate are inline, not separate workflows.

---

## Phase 3: Hold / Manage

Henry's positions don't move minute by minute (mostly). His Hold surface is **lower-frequency than a crypto trader's** but **richer in fundamental context**.

### Positions blotter

- **By position** — symbol, side, size, avg cost, mark, unrealized PnL (% and $), realized PnL, days held.
- **Greeks not relevant** for cash equities; **beta-adjusted exposure** is.
- **Sector / industry / sub-industry tags.**
- **Strategy tag** — directional, pair, hedge, special-situation.
- **Catalyst association** — "this position is sized for earnings on 2026-05-12."
- **Position thesis** stored inline — author, date, summary, invalidation.

### Pairs view

- For pair trades: show both legs side by side.
- Live spread vs entry spread.
- z-score of spread vs historical.
- PnL of each leg + combined.

### Live PnL

- **Total today** — realized + unrealized.
- **By name, by sector, by pair, by strategy tag.**
- **Long PnL vs short PnL** — alpha-generation diagnostic.
- **Beta-explained vs alpha-explained** — how much of today's PnL is just market beta?

### Risk panel — equity-specific

- **Net market exposure** (% gross, % NAV).
- **Beta-adjusted net exposure.**
- **Gross exposure** vs leverage limit.
- **Sector exposures** (% NAV per sector, with limits).
- **Single-name concentration** (% NAV, with limit).
- **Factor exposures** — value, growth, momentum, size, quality, low-vol — with target ranges.
- **Liquidity profile** — % of book that could be exited in 1 day, 5 days at 20% ADV.
- **Borrow risk** — short positions with high borrow cost or HTB flag.
- **Stress scenarios** — SPX -10%, sector -20%, factor reversal, rates +50bps.
- **Earnings concentration** — % of book reporting in next 7 days.

### Catalyst tracker for active positions

For each active position:

- Next catalyst date and type.
- Position sizing pre-catalyst (was it sized for the catalyst, or by accident in the window?).
- Recent newsflow related to this name.
- Open analyst questions.

### Alerts

- **Price alerts** — multi-condition, per name.
- **News alerts** — name-specific keyword hits.
- **Estimate revision alerts** — consensus moved >X%.
- **Rating change alerts** — sell-side upgrade / downgrade.
- **Insider trading alerts** — new Form 4 filing.
- **Short interest alerts** — significant change.
- **Volatility / volume alerts** — name doing something unusual.
- **Catalyst countdown alerts** — earnings T-7, T-1.
- **Compliance alerts** — restricted list change, position threshold approach.
- **Risk limit alerts** — sector cap, beta-adjusted exposure.

### Trade journal — thesis-tracking

- Inline notes per position: thesis, key drivers, invalidation, expected catalyst path.
- Updated weekly or post-catalyst.
- Searchable across history.

### Communications

- **Sell-side chat / messaging** integrated.
- **Analyst notes** from internal analyst attached to positions.
- **IR contact log** — calls with company IR teams.
- **Expert network call notes.**

### Heatmap of own book

- Names sized by gross exposure, colored by today's % move.
- Sector grouping.

### Kill switch

Less hair-trigger than a crypto trader's but still present:

- **Reduce all to gross/net target** — algo-execute over the day.
- **Stop new entries** — pause additions.
- **Flatten by mandate** — emergency wind-down.

**Layout principle for Hold:** positions and risk visible; catalyst tracker for active names always close to hand. News feed peripheral, with name-filtered alerts.

---

## Phase 4: Learn

Equities post-trade analytics emphasize **catalyst outcome**, **alpha attribution**, and **execution quality** at single-name level.

### Trade history & blotter

- Every fill, every name, with strategy tag, parent order, catalyst association.
- Filterable by date, name, sector, strategy, catalyst type.

### PnL attribution

- **Alpha vs beta decomposition** — how much from name selection, how much from market.
- **Long alpha vs short alpha** — separately, because they're different skills.
- **By sector / sub-industry.**
- **By strategy tag** — directional, pair, event-driven.
- **By catalyst type** — earnings, product launch, M&A, regulatory.
- **By market regime** — bull / bear / chop.

### Catalyst outcome tracking

Every catalyst-sized position closed: was the thesis right? Was the sizing right? Was the timing right?

- **Pre-catalyst expected move vs realized.**
- **Position PnL through the catalyst.**
- **Pattern recognition over time** — which catalyst types is Henry good at? Bad at?

### Performance metrics

- Sharpe, Sortino, Calmar.
- **Hit rate by strategy** — directional vs pair vs event.
- **Avg win vs avg loss** by strategy.
- **Holding period analysis** — did long-hold positions outperform short-hold ones?
- **Sector skill** — Sharpe by sector.

### Factor attribution

- Run portfolio against factor model (Fama-French 5-factor, Barra-style, custom).
- Identify how much return is explained by factor exposure vs idiosyncratic alpha.
- Track factor drift over time.

### Execution quality / TCA

- **Implementation shortfall** per parent order: arrival vs final fill.
- **VWAP slippage** by algo.
- **Dark vs lit fill quality.**
- **Broker scorecard** — commission paid, execution quality by broker.
- **Crossing opportunities missed** — could a block have been done internally?

### Borrow / short analytics

- **Borrow cost paid YTD** by name.
- **Recall events** experienced (forced buy-ins).
- **HTB usage patterns** — flagged for review.

### Behavioral analytics

- **Position-sizing consistency** — does Henry size by conviction or by recent PnL?
- **Drawdown response** — does he revenge-add to losers?
- **Catalyst hold-through rate** — does he sit through earnings or trim before?

### Reports

- Daily P/L commentary.
- Weekly portfolio review.
- Monthly performance attribution package.
- Quarterly investor / committee letter contribution.
- Compliance / regulatory filings (13F, 13G/D, Form PF inputs).

**Layout principle for Learn:** big tables, drilldowns, factor / catalyst / sector slices. Henry spends weekends here.

---

## What Ties Henry's Terminal Together

1. **Fundamentals are first-class.** Financials, estimates, valuation are presented next to price, not in a separate tool.
2. **Catalyst calendar is the planning spine.** Every active position is associated with one or more upcoming catalysts.
3. **News & research are continuous, filtered, prioritized** — to portfolio and watchlist names.
4. **Sell-side and IR ecosystem is integrated.** Chats, ratings, calls, conferences live alongside the book.
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

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
