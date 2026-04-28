# Trader Archetype — Rafael Aguilar (Senior Global Macro PM)

A reference profile of a top-performing global macro PM at a top-5 firm. Used as a yardstick for what an ideal **multi-asset, theme-driven** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For sister archetypes on the same desk, see the other `trader-archetype-*.md` files in this folder.

---

## Who Rafael Is

**Name:** Rafael Aguilar
**Role:** Senior Global Macro PM
**Firm:** Top-5 global trading firm (macro sleeve within multi-strat platform, or dedicated macro fund)
**Book size:** $1B – $5B notional, with $50M – $300M daily VaR
**Style:** Discretionary, theme-driven, multi-week to multi-quarter horizons
**Coverage:** Everything — equities (indices, country ETFs), rates (G10, EM), FX (G10, EM), commodities (energy, metals, ags), credit indices, vol products. Selectively crypto.
**Tradition:** Soros, Druckenmiller, PTJ, Dalio archetype — fewer trades, larger size, stronger views.

### How he thinks differently

Rafael is **theme-first**, **asset-class-agnostic**. He does not specialize in any one market; he specializes in **forming a thesis** and **expressing it across whichever assets price it best**.

His mental model:

- The world is connected — Fed policy moves rates, rates move FX, FX moves EM equities, EM equities move commodities, commodities move inflation expectations, inflation moves Fed policy. He trades the chain.
- A macro theme is a **scenario** — "the Fed is going to over-tighten and break something" — and an expression of that theme is a **trade structure** chosen for risk-reward.
- **Asymmetry** is everything. He looks for trades where downside is bounded and upside is multiples. Options, capital-structure trades, and out-of-the-money expressions are favored.
- **Position sizing is concentrated**. A handful of high-conviction themes drive most P/L, not a diversified book of small bets.

His longest hold can be 18–24 months. He'll cut a thesis in days if data invalidates it.

### His cognitive load

Rafael holds in his head:

- **3–7 active themes** (e.g. "secular dollar decline," "Japanese reflation," "China deflation export," "AI capex cycle").
- For each theme: the **chain of causation**, the **catalysts** that confirm or invalidate, the **expressions** he's chosen, and the **stops** (price, time, or thesis-based).
- **Cross-asset relationships** continuously — when oil moves 5%, what should the dollar do? What should US 10y do? What's the mismatch?
- **Macro data flow** — every release, every speech, every flow report.

The terminal must support **theme-tracking** as a first-class object — not just positions and instruments.

---

## Physical Setup

**6 monitors**, but the layout is **theme-centric**, not instrument-centric.

| Position      | Surface                                                                               |
| ------------- | ------------------------------------------------------------------------------------- |
| Top-left      | **Themes board** — active themes with status, expressions, P/L per theme              |
| Top-center    | **Cross-asset dashboard** — equities / rates / FX / commodities / credit, all at once |
| Top-right     | **Macro data calendar + news ticker** — global, with hawk/dove tags                   |
| Middle-left   | **Charts of focus assets** — multi-instrument, theme-driven layouts                   |
| Middle-center | **Positions, exposures, P/L by theme + by asset class**                               |
| Middle-right  | **Order entry — multi-asset, multi-leg, with structure templates**                    |
| Bottom-left   | **Cross-asset correlation & relationships matrix**                                    |
| Bottom-right  | **Sell-side macro research, central bank speakers, geopolitical news**                |
| Tablet        | Bloomberg / Reuters chat, IB morning notes, podcast / interview audio                 |

Rafael often steps away from the desk for hours. He thinks in walks, in conversations with strategists, in long-form reading. The terminal is a **state-snapshot** he checks against, not a continuous focus.

---

## Phase 1: Decide — building and refining themes

For Rafael, "decide" is **theme work**. New themes are not invented daily; they evolve over weeks of reading, modeling, debating, paper-trading.

### Themes board (the spine of his terminal)

Each theme is a first-class object:

- **Theme name + one-line description** — "Fed over-tightens, growth scare, dollar peaks, gold rallies."
- **Thesis document** — link to long-form write-up, kept updated.
- **Status** — researching / paper-expressed / live / scaling / scaling-back / closing / closed / invalidated.
- **Conviction score** — 1–10, his subjective rating, with date last updated.
- **Time horizon** — 1m / 3m / 6m / 12m / longer.
- **Catalysts** — list of events/data that confirm or invalidate.
- **Invalidation conditions** — what makes him exit.
- **Current expressions** — list of trades currently in the book serving this theme.
- **P/L attributed to theme** — across all expressions, summed.
- **Risk attributed to theme** — DV01, beta-adjusted, vega, depending on expressions.

### Macro data flow

- **Global economic calendar** — every release, every country, with consensus, prior, expected reaction.
- **Tier-1 events** with countdown — FOMC, ECB, BoJ, NFP, CPI, GDP, PMI.
- **Surprise indices** — Citi Economic Surprise per region.
- **Heatmap of recent surprises** — green/red grid, growth vs expectations vs prior.
- **Inflation surprise indices** separately tracked.
- **Composite leading indicators** — OECD, ECRI.
- **High-frequency data** — credit-card spending, mobility, shipping, electricity.
- **Sentiment surveys** — ISM, PMI breadth, consumer confidence, business confidence.

### Central bank tracker

- **All major central banks** with current policy rate, balance sheet size, recent statements.
- **Meeting calendar with countdown.**
- **Implied rate path** per central bank from OIS / futures curves.
- **Hawk/dove leaning** of each speaker, with text from recent speeches highlighted.
- **Forward guidance language tracker** — has the FOMC dropped "patient"? Has the ECB added "data-dependent"?

### Cross-asset dashboard

The world on one screen:

- **Equity indices** — SPX, NDX, ES futures, MXEF (EM), TPX (Japan), DAX, CSI300, FTSE.
- **Sovereign yields** — UST 2y / 10y / 30y, bund 10y, gilt 10y, JGB 10y, CGB 10y, BTPS.
- **FX** — DXY, EURUSD, USDJPY, GBPUSD, USDCNY, USDBRL, USDMXN, USDINR, AUDUSD.
- **Commodities** — Brent, WTI, gold, silver, copper, iron ore, soybean, wheat.
- **Credit** — IG / HY spreads, EM USD-debt spreads (EMBI), CDX indices.
- **Vol** — VIX, MOVE, FX vols, oil vol.

Each shown as **% change today / 1w / 1m / YTD**, color-coded, sortable by move magnitude.

### Cross-asset relationships

- **Rolling correlations** — equities-rates, equities-dollar, rates-FX, oil-CAD, gold-real-yields, etc.
- **Regression dashboards** — "if 10y yields rise 25bps, USDJPY historically rises 1.4%."
- **Mismatch detector** — flag when an asset has decorrelated from its usual relationship by N standard deviations. Often a trade.
- **Risk-on/off composite** — proxy for market regime.

### Theme-specific surfaces

Each theme can have its own custom dashboard:

- Layout of charts and indicators relevant to _that_ theme.
- E.g. "Japan reflation" theme dashboard: USDJPY, JGB 10y, Nikkei, Japan CPI, BoJ commentary, real wages.
- Custom data feeds attached.
- Saveable, sharable with team.

### Sell-side and external research

- **Macro strategist morning notes** — IB, sell-side, independent research.
- **Trade idea aggregation** — strategist trade ideas with track records.
- **Geopolitical analyst feeds** — political risk consultancies (Eurasia Group, Stratfor-style).
- **Podcast / interview library** — long-form thinking, Rafael returns to this often.

### Geopolitical & narrative

- **Conflict / sanctions tracker.**
- **Election calendar** with implied probabilities, market-relevant.
- **Trade/tariff news.**
- **OPEC+ meetings, G20, G7.**
- **Reserve-management commentary** from large reserve holders.

**Layout principle for Decide:** themes board is foveal. Cross-asset dashboard always visible. Macro calendar always glanceable. Research consumed in long form, off the screens.

---

## Phase 2: Enter — expressing themes

For Rafael, an order is the last step in a theme. The terminal must help him **pick the best expression** for the thesis, then execute cleanly.

### Theme-attached order entry

- **Pick a theme** — every order tagged at entry to a theme ID.
- **Choose expression type:**
  - Outright direction (long/short an instrument).
  - Curve / spread (pair within an asset class).
  - Cross-asset spread (long EM equities, short USD).
  - Options structure (asymmetric expression).
  - Capital structure trade (long convert, short equity).
  - Basket (long EM equity ETFs, short DXY).

### Expression comparison tool

Rafael's edge is picking the _best_ expression. The terminal helps:

- Given a thesis ("Fed over-tightens"), show candidate expressions with:
  - Implied volatility / IV rank — is the option expensive or cheap?
  - Carry — does the structure pay or cost to hold?
  - Liquidity — can he size?
  - Asymmetry — max loss vs max gain.
  - Historical fit — when this thesis materialized in the past, this expression made X.

### Multi-asset, multi-leg ticket

- One ticket, multiple legs across asset classes.
- Sized by **risk contribution** (DV01, vega, beta-adjusted dollar) rather than notional.
- Pre-trade preview shows:
  - Risk added to book in each axis (rates DV01, equity beta, FX delta, vega).
  - Theme-level P/L impact per scenario.
  - Margin / leverage / counterparty consumption.
  - Liquidity profile of the structure.

### Options-heavy expressions

Rafael loves options for asymmetry:

- **Vol-quoted** entry, like Sasha.
- **Pricing** comparable across asset classes — "buy 3m 25Δ EUR call vs buy 3m 25Δ JPY call vs buy 3m 25Δ Nikkei put — which is cheapest expression of weak USD theme?"
- **Greeks displayed** at structure level.
- **Scenario PnL grid** for the structure.

### Block / RFQ workflow

For large size, especially in less liquid markets:

- RFQ to dealer panel.
- IOI / axe aggregation across brokers.
- Block-trade venues integrated.

### Algos appropriate per market

- Equity index futures (TWAP, VWAP).
- Cash treasuries (auction-aware algos).
- FX (TWAP, fixing-aware).
- Commodities (calendar-spread algos).

### Pre-trade compliance & risk

- Position limits per market.
- Country / sanctions limits.
- Reporting threshold flags.
- Margin / financing impact.

### Hotkeys

- Less hotkey-driven than a market-maker; Rafael trades infrequently.
- But: roll position forward (move into next-tenor option / future) is one-click.
- Cancel all working: present.

**Layout principle for Enter:** the order ticket is theme-aware. Expression comparison happens before the ticket. Pre-trade scenario PnL is mandatory.

---

## Phase 3: Hold / Manage — running themes

Rafael's positions don't move minute-by-minute; his themes evolve over weeks. But the cross-asset book is large, and the relationships between positions matter as much as the positions themselves.

### Themes & positions blotter — by theme

The primary view groups positions **by theme**, not by instrument:

- **Theme: Fed over-tightening**
  - Long 5y UST: +$X, +Y DV01.
  - Long 1y SOFR: +$X, +Y DV01.
  - Long 3m EURUSD call: +$X, +Y vega.
  - Long gold: +$X, +Y delta.
  - Aggregate P/L for theme: +$Z.
  - Theme conviction: 8/10 (last updated 3d ago).
  - Theme catalysts pending: NFP next Friday, FOMC in 2 weeks.

A secondary view groups by asset class for risk management.

### Live PnL — theme-attributed

- Per-theme P/L today / WTD / MTD / inception-of-theme.
- **Conviction-weighted P/L** — bigger themes contribute more.
- **Theme correlation matrix** — themes that _should_ be uncorrelated, are they drifting toward correlation? (Often a sign Rafael has unconsciously bet the same idea twice.)

### Risk panel — multi-axis

Macro books have many axes simultaneously:

- **Equity beta** — net market exposure.
- **Rates DV01** — by tenor, by currency.
- **FX delta** — by currency pair.
- **Commodity delta** — by commodity.
- **Credit DV01.**
- **Vega** — by underlying, by tenor.
- **Theta, gamma** if options-heavy.
- **Cross-asset stress scenarios:**
  - "Risk-off shock" — equities -10%, rates -50bps, dollar +3%, oil -10%, vol +30%.
  - "Inflation surprise" — equities -5%, rates +30bps, oil +15%, gold +5%.
  - "Geopolitical shock" — oil +20%, equities -5%, vol +50%.
  - "Central bank surprise" — country-specific, by 50bps.
- **VaR** — historical, parametric, Monte Carlo.
- **Concentration warnings** — position size, theme size, correlation cluster.

### Cross-asset relationship monitor

- **Mismatches** — assets that have decorrelated from usual relationships, possible trades.
- **Theme-relationship view** — for "Fed over-tightening" theme, the relationships that should hold (rates down, dollar down, gold up); is the market confirming?

### Catalyst calendar — theme-attached

- Every theme has its catalysts.
- Calendar shows next catalyst per theme, with countdown.
- Pre-event positioning summary — "going into FOMC: long duration, long vol, short USD."

### Alerts

- **Theme-invalidation alerts** — pre-defined invalidation conditions met.
- **Catalyst-pending alerts** — major event T-7 / T-1.
- **Cross-asset mismatch alerts** — relationships breaking.
- **Position-level alerts** — price, vol, level crossings.
- **News alerts** — keyword-based for active themes.
- **Risk limit alerts** — VaR, concentration, individual axis exposures.
- **Geopolitical alerts** — major news from defined regions.

### Trade journal — theme journal

Rafael's journal is **organized by theme**, not by trade:

- Per theme, a running narrative: thesis updates, evidence in/out, expressions added/removed, conviction shifts.
- Reviewed weekly with team.

### Communications

- **Sell-side strategist chat** integrated.
- **Internal economist** notes attached to relevant themes.
- **Geopolitical consultant** feed for relevant themes.

### Heatmap

- By theme, sized by conviction, colored by P/L.

### Kill switches

- **Reduce theme exposure** — algo-execute over the day.
- **Close theme** — unwind all expressions for a theme.
- **Reduce risk to target** — book-level VaR target.
- **Cancel all working orders.**

**Layout principle for Hold:** themes are foveal. Asset-class risk is a secondary check. Cross-asset relationships are the diagnostic.

---

## Phase 4: Learn — theme retrospective

Macro post-trade is **theme-level**, not trade-level. Did the thesis play out? Was the expression optimal?

### Theme retrospectives

Per theme, on closure (or quarterly while live):

- **Thesis statement at outset.**
- **Key data / events that confirmed or contradicted.**
- **Expressions chosen, sized, exited.**
- **P/L per expression and total.**
- **What worked, what didn't.**
- **What Rafael would do differently.**

These become a personal corpus he refers back to.

### PnL attribution

- **By theme** — primary axis.
- **By asset class** — secondary.
- **By instrument type** — outright, options, spread, basket.
- **By regime** — was the regime fit right?
- **By catalyst** — trades around specific events.
- **By time horizon** — short-themes vs long-themes.

### Performance metrics

- Sharpe, Sortino, Calmar.
- Hit rate by theme type (rates-driven, growth-driven, geopolitical, commodity).
- **Theme batting average** — fraction of themes that closed profitable.
- **Conviction calibration** — when Rafael said 9/10 conviction, did the theme work?
- **Average winning theme size vs average losing theme size.**

### Expression-quality analysis

- For each theme: was the chosen expression optimal vs alternatives that existed?
- "Theme was right, but options were too expensive" — pattern recognized.
- "Theme was right, but we sized too small" — pattern recognized.
- Drives expression-selection improvement.

### Cross-asset relationship calibration

- When Rafael's mental model said "X should follow Y," did it?
- Empirical relationship vs assumed.
- Drives model refinement.

### Behavioral analytics

- **Conviction inflation** — does Rafael's conviction rise too quickly with confirming evidence?
- **Theme abandonment patterns** — does he cut losing themes too fast or too slow?
- **Position-sizing consistency** — does he size by conviction or by recent P/L?
- **Time-to-acknowledge-error** — how long after invalidation does he close?

### Macro forecasting calibration

- His own forecasts (rates, growth, inflation, FX) vs realized.
- Forecast error distribution.
- Sources of error pattern-matched.

### Reports

- Daily commentary (light, theme-level).
- Weekly portfolio review.
- Monthly attribution by theme & asset class.
- Quarterly investor / committee letter — Rafael's voice, theme narratives.
- Compliance / regulatory (Form PF, AIFMD as applicable).

**Layout principle for Learn:** theme retrospectives are the highest-value artifact. Attribution is theme-first. Calibration of conviction and relationships is the long-running improvement loop.

---

## What Ties Rafael's Terminal Together

1. **Themes are first-class objects.** Positions, P/L, risk, alerts, journals are organized by theme as primary axis.
2. **Asset-class agnostic.** Equities, rates, FX, commodities, credit, vol, crypto — all in one terminal, all comparable, all expressible in one ticket.
3. **Cross-asset relationships are surfaced continuously.** Mismatches between markets are diagnostic and often actionable.
4. **Calendar dominates.** Macro events drive trade timing more than chart patterns.
5. **Expression selection is a UI surface**, not a private spreadsheet — comparing how to express a thesis is a first-class workflow.
6. **Multi-axis risk.** Equity beta, DV01, vega, FX delta, commodity delta, credit DV01 — visible simultaneously, not toggled.
7. **Asymmetric structures favored.** Options-heavy, capital-structure, OTM expressions are accommodated as default tools.
8. **Conviction is tracked alongside performance.** Calibration of conviction-to-outcome is core post-trade.
9. **Long-form thinking is supported.** Theme docs, journals, research libraries are part of the terminal, not bolted on.
10. **Slow rhythm.** The terminal does not require continuous attention; Rafael's edge is in deep thinking over hours and days, not reaction.

---

## How to Use This Document

When evaluating any global macro / multi-asset terminal (including our own), walk through Rafael's four phases and ask:

- Are themes first-class objects (with status, conviction, expressions, P/L, journal)?
- Is the cross-asset dashboard genuinely cross-asset, comparable, and live?
- Is multi-axis risk (equity beta / DV01 / vega / FX delta / commodity delta) visible simultaneously?
- Are cross-asset relationships and mismatch detectors surfaced?
- Is expression comparison a workflow, not an external spreadsheet?
- Does the order ticket span asset classes with atomic multi-leg execution?
- Is post-trade attribution theme-first, with conviction calibration?
- Is the calendar (macro data + central banks + geopolitics) a planning spine?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
