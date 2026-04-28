# Trader Archetype — Rafael Aguilar (Senior Global Macro PM)

A reference profile of a top-performing global macro PM at a top-5 firm. Used as a yardstick for what an ideal **multi-asset, theme-driven** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For shared surfaces every archetype uses, see [common-tools.md](common-tools.md). For unique surfaces per archetype, see [unique-tools.md](unique-tools.md). For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md). For sister archetypes on the same desk, see the other `trader-archetype-*.md` files in this folder.

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

### Themes board (the spine of his terminal) [unique]

Each theme is a **first-class object**, not a tag bolted onto positions. The board is the foveal surface of his entire setup.

Per theme, persisted and editable:

- **Theme name + one-line description** — "Fed over-tightens, growth scare, dollar peaks, gold rallies."
- **Thesis document** — link to long-form write-up, kept updated. Rafael's own voice, not a sell-side note.
- **Status** — researching / paper-expressed / live / scaling / scaling-back / closing / closed / invalidated.
- **Conviction score** — 1–10, his subjective rating, with date last updated and a small history sparkline so he can see whether his conviction has been creeping up on confirming-only evidence.
- **Time horizon** — 1m / 3m / 6m / 12m / longer.
- **Catalysts** — explicit list of events/data that confirm or invalidate, each with date and side (confirming / invalidating).
- **Invalidation conditions** — what makes him exit. Price-based ("USDJPY > 165"), data-based ("US core CPI > 4% YoY for 2 prints"), or thesis-based ("Fed signals cut"). Wired to alerts ([#14-alerts](common-tools.md#14-alerts-engine)).
- **Current expressions** — list of trades currently in the book serving this theme, each with size, P/L, risk contribution.
- **P/L attributed to theme** — across all expressions, summed; today / WTD / MTD / inception-of-theme.
- **Risk attributed to theme** — equity beta + DV01 + FX delta + commodity delta + vega, depending on what the expressions consume.

Sortable / filterable by status, conviction, horizon, P/L, risk consumed. The themes board is the index page from which every other Phase 1–4 surface is reachable.

### Theme-specific custom dashboards [unique]

Each active theme has its own **saveable, sharable dashboard** — a layout of charts, indicators, calendars, and feeds curated specifically for that thesis. Examples:

- **"Japan reflation":** USDJPY chart, JGB 10y, Nikkei, Japan core CPI, real wages, BoJ speakers feed, MoF intervention chatter, Tankan, JGB auction calendar.
- **"China deflation export":** CSI300, USDCNY (onshore + offshore + gap), CN PPI, CN export prices, copper, iron ore, USTs (deflation transmission), DRAM prices, EM trade-balance prints.
- **"Fed over-tightens":** OIS-implied rate path, 2s10s, USTs by tenor, DXY, gold, real yields, breakevens, financial-conditions index, credit spreads, Fed speakers feed, FOMC countdown.

Per-theme dashboard supports:

- Saved layout (chart panes, calendars, news filters, alert sets).
- Custom data feeds attached at theme-level (e.g. shipping rates for a China theme, real-wage tracker for a Japan theme).
- Theme-scoped news/research filter — only items tagged to this theme surface.
- Forkable / sharable to team members for review.
- Pinned to a monitor when the theme is hot.

These dashboards are the daily artifact when a theme is active; the themes board is the index, the per-theme dashboard is the workspace.

### Macro surprise indices & nowcasting [unique]

- **Citi Economic Surprise Index** per region (G10, EM aggregate, country-level), with current vs trailing distribution.
- **Inflation Surprise Index** separately tracked (decoupled from growth).
- **Atlanta Fed GDPNow + NY Fed Nowcast** for US growth real-time.
- **Inflation nowcasts** — Cleveland Fed, regional CPI nowcasts.
- **Heatmap of recent surprises** — green/red grid, growth vs expectations vs prior, per country, last 4 weeks.
- **Composite leading indicators** — OECD CLI, ECRI WLI, conference board.
- **High-frequency real-economy data** — credit-card spending, mobility, shipping (Baltic Dry, container rates), electricity load, retail traffic.
- **Sentiment surveys** — ISM, regional Fed surveys, PMI breadth, consumer/business confidence.

### Calendar, central banks, news, research

- See [#12-calendar](common-tools.md#12-catalyst--event-calendar). **Rafael-specific characteristics:** global macro calendar — every release, every country (FOMC / ECB / BoJ / BoE / PBOC / RBA / EM CBs); Tier-1 events with countdown (FOMC, ECB, BoJ, NFP, CPI, GDP, PMI); central-bank speaker calendar with **hawk/dove leaning per speaker** and forward-guidance language tracker ("has the FOMC dropped 'patient'? Has the ECB added 'data-dependent'?"); election calendar with implied probabilities; OPEC+, G20, G7; trade/tariff news; conflict/sanctions events. Every entry can be tagged to a theme.
- Implied rate path per central bank (OIS / futures-derived) plotted alongside the calendar so meeting-by-meeting market expectations are visible.
- See [#13-news](common-tools.md#13-news--research-feed). **Rafael-specific characteristics:** sell-side macro strategist morning notes (IB + independent research), trade-idea aggregation with strategist track records, geopolitical analyst feeds (Eurasia Group, etc.), a **podcast / long-form interview library** Rafael returns to often, reserve-management commentary from large reserve holders. News filterable per theme.

### Cross-asset dashboard [unique]

The world on one screen — equities / rates / FX / commodities / credit / vol all live simultaneously, comparable, sortable.

- **Equity indices** — SPX, NDX, ES futures, MXEF (EM), TPX (Japan), DAX, CSI300, FTSE.
- **Sovereign yields** — UST 2y / 10y / 30y, bund 10y, gilt 10y, JGB 10y, CGB 10y, BTPS.
- **FX** — DXY, EURUSD, USDJPY, GBPUSD, USDCNY, USDBRL, USDMXN, USDINR, AUDUSD.
- **Commodities** — Brent, WTI, gold, silver, copper, iron ore, soybean, wheat.
- **Credit** — IG / HY spreads, EM USD-debt spreads (EMBI), CDX indices.
- **Vol** — VIX, MOVE, FX vols, oil vol.

Each row shows **% change today / 1w / 1m / YTD**, color-coded, sortable by move magnitude. Click any cell to drop into [#1-charting](common-tools.md#1-multi-timeframe-charting) for that instrument.

### Cross-asset relationship matrix & mismatch detector [unique]

- **Rolling correlations** — equities-rates, equities-dollar, rates-FX, oil-CAD, gold-real-yields, copper-CNY, etc. Window selectable (1m / 3m / 1y).
- **Regression dashboards** — "if 10y yields rise 25bps, USDJPY historically rises 1.4%." Coefficients, R², residuals.
- **Mismatch detector** — flags when an asset has decorrelated from its usual relationship by N standard deviations. Rafael's bread-and-butter: mismatches are often the trade.
- **Theme-relationship view** — for "Fed over-tightening" theme, the relationships that should hold (rates down, dollar down, gold up); is the market confirming?
- **Risk-on / risk-off composite** — proxy for market regime (VIX + credit + DXY + EM equities composite).

**Layout principle for Decide:** themes board is foveal. Cross-asset dashboard always visible. Macro calendar always glanceable. Per-theme dashboards opened as the day's focus demands. Research consumed in long form, off the screens.

---

## Phase 2: Enter — expressing themes

For Rafael, an order is the last step in a theme. The terminal must help him **pick the best expression** for the thesis, then execute cleanly.

### Theme-attached order entry [unique]

Every order is tagged at entry to a theme ID — there is no "untagged" path. The ticket header carries the theme name, current conviction, and current theme P/L; sizing defaults pull from theme-level risk budget. See also [#29-tagging](common-tools.md#29-strategy-tagging-framework).

### Expression comparison tool [unique]

Rafael's edge is picking the _best_ expression of a thesis. The terminal turns this from a private spreadsheet into a first-class workflow.

Given a thesis ("Fed over-tightens, growth scare, dollar peaks"), the tool surfaces a **side-by-side grid** of candidate expressions:

| Expression                              | Type            | Carry   | IV / IV rank | Asymmetry (max-loss / max-gain) | Liquidity    | Historical fit | Capital / margin |
| --------------------------------------- | --------------- | ------- | ------------ | ------------------------------- | ------------ | -------------- | ---------------- |
| Long 5y UST outright                    | Outright bond   | + carry | n/a          | symmetric                       | very deep    | +X% past cases | DV01-driven      |
| 2s10s steepener                         | Curve spread    | varies  | n/a          | symmetric                       | deep         | +Y%            | DV01-balanced    |
| Long 6m EURUSD 25Δ call                 | Option outright | – theta | 7.2 (rich)   | bounded loss / 4× gain          | OK           | +Z%            | premium-at-risk  |
| Short DXY basket (long EUR/JPY/AUD)     | FX basket       | mixed   | n/a          | symmetric                       | deep         | +W%            | beta-weighted    |
| Long gold + long 10y UST                | Multi-asset     | mixed   | n/a          | symmetric                       | deep         | +V%            | mixed            |
| Long convert / short equity (capstruct) | Cap structure   | + carry | implied vol  | bond-floor protected            | name-by-name | +U%            | financing        |

Per row:

- **IV / IV rank** — for any option leg, current implied vol vs trailing 1y distribution (rich/cheap).
- **Carry** — does the structure pay or cost to hold (per month, annualized).
- **Liquidity** — typical bid/ask, max clip Rafael can size into without significant impact.
- **Asymmetry** — explicit max loss vs max gain, plus expected payoff under thesis-true scenario.
- **Historical fit** — when this thesis materialized in the past (reference periods), what did this expression return? Distribution, not point estimate.
- **Cross-comparable option pricing** — "buy 3m 25Δ EUR call vs buy 3m 25Δ JPY call vs buy 3m 25Δ Nikkei put — which is cheapest expression of weak USD theme?"
- **Capital / margin / counterparty consumption.**

Filter / sort by any column. Click any row to pre-load the multi-leg ticket.

### Multi-asset, multi-leg ticket [unique]

One ticket, multiple legs across asset classes (equities + rates + FX + commodities + credit + options). Sized by **risk contribution** (DV01, vega, beta-adjusted dollar) rather than notional — so a 5y UST leg and a Nikkei put leg can be sized on a common axis.

Pre-trade preview ([#3-pre-trade](common-tools.md#3-pre-trade-risk-preview)) for the structure shows:

- Risk added to book in each axis (rates DV01 by tenor/currency, equity beta, FX delta, commodity delta, credit DV01, vega by underlying/tenor).
- Theme-level P/L impact under each scenario in the cross-asset stress library.
- Margin / leverage / counterparty consumption.
- Liquidity profile of the structure (worst-leg-driven).

Options-heavy expressions are first-class:

- **Vol-quoted entry** (like Sasha's ticket).
- **Greeks displayed at structure level** — net delta / gamma / vega / theta of the whole multi-leg, not per leg.
- **Scenario PnL grid** — spot moves × vol moves matrix, plus surface stress (parallel shift, twist, smile widening).

### Shared execution surfaces

- See [#2-order-ticket](common-tools.md#2-order-entry-ticket-framework). **Rafael-specific characteristics:** ticket is theme-aware (theme tag mandatory), spans asset classes, supports outright / curve-spread / cross-asset spread / options structure / capital-structure / basket as first-class expression types, sized in risk units not notional.
- See [#3-pre-trade](common-tools.md#3-pre-trade-risk-preview). **Rafael-specific characteristics:** mandatory before send for any multi-leg or options structure; multi-axis risk delta + theme-level scenario P/L + liquidity profile + margin impact.
- See [#4-algos](common-tools.md#4-execution-algos-library). **Rafael-specific characteristics:** appropriate-per-market — equity index futures (TWAP/VWAP), cash treasuries (auction-aware), FX (TWAP, fixing-aware), commodities (calendar-spread algos). Block / RFQ workflow for size in less liquid markets — RFQ to dealer panel, IOI / axe aggregation across brokers, block-trade venues integrated.
- See [#5-sor](common-tools.md#5-smart-order-router--multi-venue-aggregation). **Rafael-specific characteristics:** SOR per asset class (equity venues, futures exchanges, FX LP aggregation, treasury platforms); cross-venue routing matters less than getting size done at all.
- See [#6-hotkeys](common-tools.md#6-hotkey-system). **Rafael-specific characteristics:** less hotkey-driven than a market-maker — he trades infrequently. But: **roll-position-forward** (move into next-tenor option / future) is one-click, and **cancel-all-working** is always present.
- See [#28-compliance](common-tools.md#28-compliance--audit-trail). **Rafael-specific characteristics:** position limits per market, country / sanctions limits, reporting threshold flags, margin / financing impact pre-checked in ticket.

**Layout principle for Enter:** the order ticket is theme-aware. Expression comparison happens before the ticket. Pre-trade scenario PnL is mandatory.

---

## Phase 3: Hold / Manage — running themes

Rafael's positions don't move minute-by-minute; his themes evolve over weeks. But the cross-asset book is large, and the relationships between positions matter as much as the positions themselves.

### Themes & positions blotter — by theme [unique grouping]

The primary view groups positions **by theme**, not by instrument. Underlying surface is [#7-positions](common-tools.md#7-positions-blotter) but the foveal grouping is theme-first:

```
Theme: Fed over-tightening    conv 8/10    P/L MTD +$12.3M    catalysts: NFP Fri, FOMC +14d
  • Long 5y UST                          +$3.2M    +12,400 DV01
  • Long 1y SOFR                         +$1.8M    +6,200 DV01
  • Long 3m EURUSD 25Δ call              +$4.1M    +180 vega
  • Long gold (GLD)                      +$3.2M    +$8M delta

Theme: Japan reflation        conv 7/10    P/L MTD  +$5.8M    catalysts: BoJ +21d, JPN CPI +6d
  • ...
```

A secondary view groups by asset class for risk management. Rafael toggles between the two; the by-theme view is default.

See [#7-positions](common-tools.md#7-positions-blotter). **Rafael-specific characteristics:** primary axis is theme; secondary is asset class; positions display in trader-native risk units (DV01, vega, beta-adjusted $, FX delta) not just notional; aggregate-per-theme line shows theme P/L, theme risk, theme conviction, next theme catalyst.

### Multi-axis risk panel [unique]

Macro books have many axes simultaneously, and Rafael needs **all of them visible at once** — not toggled, not in tabs. The panel is laid out as a single dense grid:

- **Equity beta** — net market exposure, per region (US / EU / Japan / EM).
- **Rates DV01** — by tenor (0–2y / 2–5y / 5–10y / 10–20y / 20–30y) × by currency (USD / EUR / GBP / JPY / EM).
- **FX delta** — per currency, aggregated from every pair position in the book.
- **Commodity delta** — by commodity (oil / gold / copper / ags).
- **Credit DV01** — IG / HY / EM by region.
- **Vega** — by underlying × by tenor bucket.
- **Theta, gamma** — for the options-heavy structures.
- **Cross-asset stress P/L** — per-scenario, computed live, surfaced inline.

See [#10-risk](common-tools.md#10-risk-panel-multi-axis). **Rafael-specific characteristics:** every axis above visible simultaneously on one panel; aggregated at theme level and book level; concentration warnings on theme size, single-asset size, correlation cluster.

### Cross-asset stress library [unique]

Pre-computed, named scenarios run continuously against the live book:

- **Risk-off shock** — equities –10%, rates –50bps (rally), dollar +3%, oil –10%, vol +30%.
- **Inflation surprise** — equities –5%, rates +30bps (sell-off), oil +15%, gold +5%, breakevens +20bps.
- **Geopolitical shock** — oil +20%, equities –5%, vol +50%, gold +5%, EM FX –3%.
- **Central-bank surprise** — country-specific 50bps tightening or cut, with cross-asset propagation modeled.
- **Growth scare** — equities –7%, rates –30bps, dollar +2%, credit +50bps, vol +20%.
- **Crowded-trade unwind** — momentum reversal, short-vol unwind, EM FX rally.
- **VaR** — historical, parametric, Monte Carlo, surfaced alongside named scenarios.

See [#11-stress](common-tools.md#11-stress--scenario-panel). **Rafael-specific characteristics:** scenarios above are pre-computed and live; results surfaced per-theme (which themes win, which lose under each scenario) and per-position; configurable for ad-hoc shocks.

### Live PnL — theme-attributed

- Per-theme P/L today / WTD / MTD / inception-of-theme.
- **Conviction-weighted P/L** — bigger themes contribute more.
- **Theme correlation matrix** — themes that _should_ be uncorrelated, are they drifting toward correlation? Often a sign Rafael has unconsciously bet the same idea twice across two named themes.

See [#9-pnl](common-tools.md#9-live-pnl-panel). **Rafael-specific characteristics:** primary attribution axis is theme; secondary is asset class; greek-decomposed for option-heavy themes; theme correlation matrix surfaced as a diagnostic.

### Catalyst calendar — theme-attached

- Every theme has its catalysts listed; calendar shows next catalyst per theme with countdown.
- Pre-event positioning summary — "going into FOMC: long duration, long vol, short USD across themes A and C."
- See [#12-calendar](common-tools.md#12-catalyst--event-calendar). **Rafael-specific characteristics:** every entry tagged to one or more themes; theme view filters the calendar; pre-event summary auto-aggregates positioning across themes converging on the same event.

### Cross-asset relationship monitor (live)

Same surface as the Phase 1 mismatch detector, but consumed continuously:

- Mismatches flagged in real-time with severity (z-score).
- Theme-relationship view — for each active theme, are the supporting cross-asset relationships confirming?
- Click a mismatch to drop into expression comparison for the candidate trade.

### Theme journal [unique — primary artifact]

Rafael's journal is **organized by theme**, not by trade — and the journal is the primary written artifact of his job. Per theme, a running narrative:

- Thesis statements at outset and at every revision (timestamped, diffable).
- Evidence in / evidence out — every catalyst, every data point, each tagged supporting / contradicting / neutral.
- Expressions added / removed / resized with rationale.
- Conviction shifts with reasoning ("conviction up to 9 from 7 — core CPI re-accelerated, Powell turned hawkish").
- Weekly review with team — exportable as a deck.
- Quarterly retrospective auto-prepped from journal entries.

See [#15-journal](common-tools.md#15-trade-journal). **Rafael-specific characteristics:** journal is theme-scoped not trade-scoped; long-form prose with structured fields (evidence-tagging, conviction history); reviewed weekly with team; primary artifact for quarterly investor letter.

### Alerts

- **Theme-invalidation alerts** — pre-defined invalidation conditions met (price, data, thesis).
- **Catalyst-pending alerts** — major event T-7 / T-1 per theme.
- **Cross-asset mismatch alerts** — relationships breaking by N stdev.
- **Risk-limit alerts** — VaR, concentration, individual axis exposures.
- **Geopolitical alerts** — major news from defined regions.
- See [#14-alerts](common-tools.md#14-alerts-engine). **Rafael-specific characteristics:** alerts theme-scoped; theme invalidation conditions auto-wired from themes board; mismatch alerts feed candidate-trade workflow.

### Other shared surfaces

- See [#8-working-orders](common-tools.md#8-working-orders-blotter). **Rafael-specific characteristics:** typically thin — Rafael doesn't have many resting orders; mostly stops on outright legs and limit-entries on patient builds.
- See [#16-heatmap](common-tools.md#16-heatmap-of-own-book). **Rafael-specific characteristics:** by theme, sized by conviction × notional, colored by P/L — not by ticker.
- See [#17-comms](common-tools.md#17-communications-panel). **Rafael-specific characteristics:** sell-side strategist chat integrated, internal economist notes attached to relevant themes, geopolitical consultant feed routed to theme tags.
- See [#19-kill](common-tools.md#19-kill-switches-granular). **Rafael-specific characteristics:** **reduce-theme-exposure** (algo-execute over the day), **close-theme** (unwind all expressions for one theme), **reduce-risk-to-target** (book-level VaR target), cancel-all-working. Per-theme, not just book-wide.

**Layout principle for Hold:** themes are foveal. Asset-class risk is a secondary check. Cross-asset relationships are the diagnostic.

---

## Phase 4: Learn — theme retrospective

Macro post-trade is **theme-level**, not trade-level. Did the thesis play out? Was the expression optimal?

### Theme retrospectives

Per theme, on closure (or quarterly while live):

- Thesis statement at outset.
- Key data / events that confirmed or contradicted, pulled from the theme journal.
- Expressions chosen, sized, exited.
- P/L per expression and total.
- What worked, what didn't.
- What Rafael would do differently — choice of expression, sizing, timing, scaling.

These become a personal corpus he refers back to when evaluating new themes.

### Conviction calibration tracker [unique]

- When Rafael said 9/10 conviction, did the theme work?
- Calibration curve: stated conviction (1–10) on x-axis, realized hit-rate / risk-adjusted P/L on y-axis. Diagonal = well-calibrated; below = overconfident; above = underconfident.
- **Conviction inflation** check — does conviction rise too quickly with confirming-only evidence? Sparkline of conviction history per theme reviewed.
- **Time-to-acknowledge-error** — how long after invalidation conditions trip does he actually close?
- **Theme batting average** — fraction of themes that closed profitable, by theme type (rates-driven, growth-driven, geopolitical, commodity).
- **Average winning theme size vs average losing theme size** — sizing-discipline check.
- See [#26-behavioral](common-tools.md#26-behavioral-analytics). **Rafael-specific characteristics:** conviction calibration is the primary behavioral metric, alongside theme abandonment patterns and position-sizing consistency (size-by-conviction vs size-by-recent-P/L).

### Expression-quality analysis

For each closed theme: was the chosen expression optimal vs alternatives that existed at trade-time?

- "Theme was right, but options were too expensive" — pattern recognized.
- "Theme was right, but we sized too small" — pattern recognized.
- "Theme was right, but the spread was the better expression than the outright."
- Drives expression-selection improvement; feeds the expression comparison tool's historical-fit data.

### Cross-asset relationship calibration

- When Rafael's mental model said "X should follow Y," did it?
- Empirical relationship vs assumed; coefficient stability over the relevant period.
- Drives model refinement and feeds the live mismatch detector's thresholds.

### Macro forecasting calibration

- Rafael's own forecasts (rates, growth, inflation, FX) vs realized.
- Forecast-error distribution by variable and horizon.
- Sources of error pattern-matched.

### Shared post-trade surfaces

- See [#22-attribution](common-tools.md#22-pnl-attribution-multi-axis). **Rafael-specific characteristics:** primary axis is **theme**; secondary by asset class; tertiary by instrument type (outright, options, spread, basket); also by regime and by catalyst (trades around specific events) and by time horizon.
- See [#23-performance](common-tools.md#23-performance-metrics). **Rafael-specific characteristics:** Sharpe / Sortino / Calmar standard, plus theme batting average and conviction calibration as headline metrics.
- See [#24-equity-curve](common-tools.md#24-equity-curve). **Rafael-specific characteristics:** since-inception, with theme-overlay annotations (which themes drove which legs of the curve).
- See [#21-trade-history](common-tools.md#21-trade-history--blotter-historical). **Rafael-specific characteristics:** theme-grouped, with journal entries co-located.
- See [#25-tca](common-tools.md#25-execution-quality--tca-transaction-cost-analysis). **Rafael-specific characteristics:** secondary concern — Rafael's edge is theme selection, not execution micro-optimization; TCA matters mainly for large block / RFQ fills.
- See [#20-replay](common-tools.md#20-replay-tool). **Rafael-specific characteristics:** replay around theme inflection points, not individual trades.
- See [#27-reports](common-tools.md#27-reports). **Rafael-specific characteristics:** daily commentary (light, theme-level); weekly portfolio review; monthly attribution by theme & asset class; **quarterly investor / committee letter in Rafael's voice, structured around theme narratives** — this is the primary external artifact.
- See [#28-compliance](common-tools.md#28-compliance--audit-trail). **Rafael-specific characteristics:** Form PF, AIFMD as applicable; position-limit and country/sanctions audit trail.
- See [#29-tagging](common-tools.md#29-strategy-tagging-framework). **Rafael-specific characteristics:** theme is the primary tag, mandatory at entry; secondary tags for expression type and catalyst.
- See [#30-layout](common-tools.md#30-customizable-layout--workspace). **Rafael-specific characteristics:** layouts are theme-aware — opening a theme's per-theme dashboard is a single workspace action; layouts savable per-theme and per-phase.

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
- Are theme-specific custom dashboards saveable, sharable, and per-theme?
- Does the order ticket span asset classes with atomic multi-leg execution sized in risk units?
- Is post-trade attribution theme-first, with conviction calibration?
- Is the calendar (macro data + central banks + geopolitics) a planning spine, theme-tagged?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
