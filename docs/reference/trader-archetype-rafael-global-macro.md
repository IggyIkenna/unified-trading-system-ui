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

---

# Automated Mode

The sections above describe Rafael's manual terminal — themes board, expression comparison, multi-axis risk, theme journals. This appendix describes the **automated cousin**: what gets built around him to extend his theme reach, surface mismatches faster, and pre-compute scenario PnL across his book — without pretending to automate the things that make him Rafael.

For shared concepts (data layer, feature library, research workspace, model registry, experiment tracker, fleet supervision, intervention console, decay tracking) see [automation-foundation.md](automation-foundation.md). For the structural template this appendix follows, see [automation-archetype-template.md](automation-archetype-template.md). For the worked example with depth and voice, see Marcus's appendix in [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md) — but note that Marcus is heavily-automatable crypto-CeFi; Rafael is **mostly-judgment global macro** and most of his core work stays human. This appendix is shorter than Marcus's by design.

**One framing point up front.** For Rafael, "automated mode" does not mean a fleet of macro alpha bots. Macro alpha is theme formation, thesis judgment, conviction sizing, and cross-asset chain interpretation — none of which automates today. What the platform builds for him are **support tools**: theme-monitoring scaffolds, cross-asset relationship monitors, mismatch detectors, expression-comparison engines, scenario PnL grids, conviction-calibration trackers. These extend him; they do not replace him.

The examples below are **illustrative** of shape and depth — actual platform catalogs (datasets, features, monitor classes, scenarios) will differ in name and number.

---

## 1. What Rafael's Edge Becomes

Rafael's manual edge is **forming theses, picking expressions, sizing by conviction, reading cross-asset chains**. The automated cousin does not generate themes. It builds **theme-monitoring scaffolds** that:

- Track a theme's evidence stream continuously (data, news, flow, cross-asset relationships) at a cadence Rafael cannot match manually.
- Surface mismatches between expected and realized cross-asset behavior the moment they widen.
- Pre-compute scenario PnL across his book against named cross-asset shocks.
- Compare candidate expressions of a thesis on consistent axes (carry, IV-rank, asymmetry, liquidity, historical fit).
- Track conviction calibration over time as a self-correcting feedback loop.

These are **support tools**, not alpha generators on their own. The "fleet" framing that fits Marcus (50 strategies × 100 instances) does not fit Rafael. His "fleet" is **N active themes × the monitoring scaffolds attached to each**.

**Illustrative monitor / scaffold classes** (~10; actual platform catalog will differ):

1. **Theme-evidence monitors** — per active theme, a continuously-updated evidence ledger: confirming / contradicting / neutral data points, news items, central-bank signals, flow reports. Auto-tagged from feeds; Rafael curates. One scaffold per active theme; a typical book has 3–7.
2. **Cross-asset relationship monitors** — rolling correlations, regression residuals, cointegration diagnostics for the relationships Rafael's themes depend on (rates↔FX, oil↔CAD, gold↔real-yields, copper↔CNY, EM-equity↔USD, breakevens↔oil). One monitor per named relationship; a book has 20–50 named relationships.
3. **Mismatch detectors** — z-score-based flags when an asset has decorrelated from its usual relationship by N standard deviations, with theme-attribution ("this mismatch supports/contradicts theme X"). Continuous.
4. **Expression-comparison engine** — given a thesis description and a list of candidate expressions, rank them on carry / IV-rank / asymmetry / liquidity / historical fit / margin. Run on demand and on theme inflections.
5. **Scenario PnL grid** — pre-computed P/L for the live book under the named cross-asset stress library (risk-off, inflation surprise, geopolitical shock, central-bank surprise, growth scare, crowded-trade unwind). Updated on every position change.
6. **Conviction-calibration tracker** — running calibration curve (stated conviction vs realized hit-rate / risk-adjusted P/L), conviction-history sparklines, time-to-acknowledge-error metric. One per Rafael; archived per closed theme.
7. **Theme-relationship-reliability monitors** — for each active theme, the cross-asset relationships that should hold are tested live; degradation surfaces as a theme-level health flag.
8. **Macro-surprise / nowcast pipelines** — Citi surprise indices, growth and inflation nowcasts (Atlanta Fed GDPNow, Cleveland Fed inflation), composite leading indicators, high-frequency real-economy series, all kept current and theme-tagged.
9. **Catalyst-positioning aggregator** — for any upcoming Tier-1 macro event (FOMC, ECB, NFP, CPI), aggregates Rafael's positioning across all themes that converge on that event ("going into FOMC: long duration, long vol, short USD across themes A and C") and surfaces concentration warnings.
10. **Theme-journal NLP assistant** — extracts evidence sentiment from Rafael's own journal entries, flags conviction-history drift, surfaces "you mentioned X catalyst three weeks ago — has it landed?" reminders. Augments Rafael's writing, doesn't replace it.

**Illustrative — actual platform will differ.**

The scaling shift is not "more trades." Rafael does not trade more trades because he is automated. The shift is **more themes monitored at depth, more expressions evaluated per thesis, more cross-asset relationships watched continuously, fewer surprises**. Manual Rafael could deeply track 3–5 themes; automated Rafael can deeply track 7–10 with the same hours of focused thinking, because the scaffolding picks up the continuous monitoring work he previously did by glance.

The cognitive shift is **fewer minute-by-minute surveillance tasks; more time for theme formation and the long-form reading that produces theses**. Rafael's day shifts from "scanning eight monitors for whether the relationships are confirming" to "reading deeply, talking to strategists, then checking the scaffolds for what changed."

---

## 2. What Stays Rafael

Most of Rafael's core work stays human. This list is long because his role is the most judgment-heavy on the floor.

- **Theme formation.** Inventing a thesis is reading, conversation, intuition, pattern recognition across decades. The platform does not propose new themes. Rafael writes them; the scaffolding tracks them.
- **Thesis judgment under contradicting evidence.** When Powell says one thing, the curve says another, and EM FX says a third, the platform shows the divergence. Rafael decides which signal to weight and whether the thesis still holds.
- **Conviction sizing.** Rafael's 8/10 vs 6/10 is a learned, idiosyncratic judgment. The platform tracks his calibration over time but does not set conviction.
- **Cross-asset chain interpretation.** When the platform flags a mismatch, the question "is this the trade or the noise?" is human. Rafael reads the chain; the platform surfaces the data.
- **Expression selection in ambiguity.** The expression-comparison tool ranks candidates on consistent axes. The actual choice — "the option is rich but the asymmetry is right; the spread is cleaner but the carry is wrong" — is Rafael's.
- **Time-horizon judgment.** "This theme is a 6-month trade, not a 6-week trade" is a forecast about regime-duration the platform cannot make.
- **When to scale, when to cut.** Adding to a working theme vs trimming on confirmation, cutting on first invalidation vs giving the thesis room — these are Rafael's calls. The platform shows him the conditions; he decides.
- **Reading central-bank language.** "Has the FOMC dropped 'patient'?" is a parsing question the platform can flag. "Does dropping 'patient' matter this cycle vs the last?" is judgment.
- **Geopolitical risk premium.** OPEC, conflict, sanctions, elections — the platform delivers feeds and probability inputs. Rafael's interpretation of how those translate to trade structures stays human.
- **Long-form thinking.** Rafael's edge is deep reading, walking, conversations with strategists. The platform does not automate the slow rhythm; it accommodates it.
- **Investor-letter authorship.** The quarterly investor / committee letter is Rafael's voice, structured around theme narratives. Drafts may be auto-prepped from the theme journal; the writing is his.
- **Rejecting the platform's signals.** A mismatch detector firing is a hypothesis, not a trade. Rafael's right and obligation to ignore a flag — and to log why — is preserved.

**Platform stance:** opinionated about what to automate (continuous monitoring, scenario PnL, calibration tracking, evidence-ledger maintenance); humble about what cannot be (theme formation, thesis judgment, conviction sizing, cross-asset interpretation). For Rafael more than any other trader on the floor, the appendix is a frame around the human, not a replacement of him.

---

## 3. The Data Layer for Rafael

For shared data layer concepts (catalog browser, quality monitoring, lineage, procurement, gap analysis), see [automation-foundation.md](automation-foundation.md). This section covers Rafael-specific characteristics.

### 3.1 The Data Catalog Browser

Same shape as the foundation doc: left-sidebar filters, main panel with dataset rows, right pane with detail. Rafael's filter taxonomy emphasizes **asset class × region × release cadence × theme tag**:

- Asset class: rates / FX / equities / commodities / credit / vol / crypto.
- Region: US / EU / UK / Japan / China / EM-block (LatAm / Asia / EMEA).
- Release cadence: tick / daily / weekly / monthly / quarterly / event-driven.
- Theme tag: any of his active themes; supports multi-tag.
- Source type: official statistical agency / central bank / market data vendor / sell-side research / NLP-extracted / nowcast-derived.

### 3.2 Rafael's Core Datasets (Illustrative)

A representative slice of what his theme-monitoring scaffolds depend on. Actual platform catalog will differ.

- **Sovereign yield curves (G10 + EM)** — full curve daily, intraday for liquid points. Vendor-sourced, internally cleaned.
- **OIS / SOFR / ESTR / SONIA / TONA curves** — implied policy paths per central bank.
- **FX spot, forward, NDF, vol surfaces** — G10 + 20+ EM crosses.
- **Equity index levels and futures (cash + roll)** — SPX, NDX, MXEF, TPX, DAX, CSI300, EM regional.
- **Commodity futures curves** — Brent, WTI, gold, silver, copper, iron ore, soybean, wheat, natgas (HH and TTF).
- **Credit indices** — IG / HY (CDX, iTraxx), EMBI, CEMBI, sovereign CDS.
- **Macro releases (full historical + real-time)** — CPI, GDP, PMI, employment, retail sales, trade balance — every G10 country and major EM, vintage-tracked.
- **Central bank decisions, statements, minutes, speeches** — full text corpus, NLP-tagged for hawk/dove leaning per speaker.
- **Citi Economic Surprise Indices** — per region, daily.
- **Atlanta Fed GDPNow + NY Fed Nowcast + Cleveland Fed inflation nowcast** — daily real-time growth / inflation nowcasts.
- **OECD CLI, ECRI WLI, Conference Board LEI** — composite leading indicators.
- **High-frequency real-economy series** — credit-card spend aggregators, mobility (Apple / Google), shipping (Baltic Dry, container rates), electricity load, retail traffic.
- **Sentiment surveys** — ISM, regional Fed surveys, PMI breadth, consumer/business confidence, NFIB.
- **Reserve-management commentary archive** — IMF COFER, central-bank reserve disclosures, sovereign-wealth flows.
- **Geopolitical event corpus** — sanctions, conflict events, election results, polling aggregators (where applicable).
- **Sell-side macro research feed** — IB strategist morning notes, independent research, full text + structured trade-idea extraction.
- **Podcast / long-form interview transcripts** — auto-transcribed, searchable.
- **Cross-asset correlation panel (precomputed)** — rolling 1m / 3m / 1y correlations across the relationships in his theme dependency graph.
- **Historical regime corpus** — past episodes labeled by regime (1998 Asia, 2008 GFC, 2011 EU sovereign, 2013 taper tantrum, 2014 oil collapse, 2018 Q4, 2020 COVID, 2022 inflation shock) for historical-fit lookups.

**Illustrative — actual platform will differ.**

### 3.3 Data Quality Monitoring

Standard SLA: freshness, completeness, schema-stability, distribution-drift, source-availability. Rafael's freshness sensitivity is unusual — most of his data is daily or release-cadence, not tick. **Stale daily data is far more dangerous to him than millisecond latency**, because his book is positioned around the data, and a stale CPI nowcast can mis-signal a theme for hours. Quality dashboards prioritize "release received vs scheduled" over "tick-rate."

### 3.4 Lineage Navigator

Standard. Rafael's particular concern is **vintage tracking** — when a release gets revised (GDP first-print → second-print → final), every downstream nowcast and theme-monitor must re-base. Lineage shows revision history per series.

### 3.5 Procurement Dashboard

Standard shape. Rafael-renewal-sensitive feeds: macro research subscriptions (multiple IBs), the Citi surprise index license, geopolitical analyst services (Eurasia Group, etc.), polling aggregator subscriptions for relevant election cycles, podcast / transcript services. These are budgeted line-items reviewed quarterly.

### 3.6 Gap Analysis Surface

Standard. Rafael-specific gaps that recurringly surface: EM real-time nowcasts (most EM lacks weekly nowcasts; gap shows up when EM-themed monitors fall back to monthly), official China data quality (well-known limitations; alt-data substitutes flagged), high-frequency real-economy indicators outside the US.

### 3.7 Interactions Rafael has with the data layer

- **Daily:** glances at data-quality dashboard for failed releases on theme-relevant series; re-checks any flagged stale series before relying on a theme monitor.
- **Weekly:** reviews release calendar for the coming week; ensures any theme-critical release has fresh quality status.
- **Monthly:** review with Quinn / data-eng on alt-data additions and procurement renewals.
- **Ad-hoc:** when a new theme emerges, requests new datasets via the procurement dashboard or queues alt-data additions.

### 3.8 Why this matters

Stale or wrong data is silently catastrophic for a theme-driven book. Rafael can hold a 3-month thesis on a CPI series; if the platform's CPI feed is one revision behind, every downstream monitor and conviction signal is mis-calibrated. The data layer is the foundation of every other surface in his appendix; quality discipline here is the difference between scaffolds that help him and scaffolds that lie to him.

---

## 4. The Feature Library for Rafael

For shared concepts (browser, engineering surface, drift dashboard, cross-pollination), see [automation-foundation.md](automation-foundation.md).

### 4.1 The Feature Library Browser

Standard shape. Rafael's filter axes: asset class, region, theme tag, time horizon, owner-desk (Rafael's, Henry's, Ingrid's, Yuki's, Theo's, Quinn's).

### 4.2 Rafael's Core Features (Illustrative)

Grouped by domain. ~30 features across families. Actual platform catalog will differ.

**Macro nowcast features:**

- `growth_nowcast_us`, `growth_nowcast_eu`, `growth_nowcast_cn` — composite of GDPNow + private nowcasts + leading indicators, z-scored.
- `inflation_nowcast_us`, `inflation_nowcast_eu` — Cleveland-Fed-style nowcasts plus high-frequency components.
- `surprise_index_growth_<region>`, `surprise_index_inflation_<region>` — Citi-style indices, decoupled.
- `composite_leading_indicator_<region>` — CLI / WLI z-score.
- `financial_conditions_index_<region>` — Goldman / Bloomberg-style FCI.

**Central-bank-stance features:**

- `cb_hawkdove_score_<bank>` — NLP score on speeches and statements; -1 dove / +1 hawk.
- `cb_forward_guidance_change_flag_<bank>` — boolean: did the latest statement add / drop a tracked phrase ("patient", "data-dependent", "extended period")?
- `ois_implied_path_<bank>` — implied policy rate at next 1 / 2 / 3 / 6 meetings.
- `path_repricing_<bank>` — change in OIS path over 1d / 1w.

**Cross-asset relationship features:**

- `corr_rates_fx_<pair>_<window>` — rolling correlation with selectable window.
- `corr_oil_cad`, `corr_copper_cny`, `corr_gold_real_yields` — named relationship correlations.
- `regression_residual_<relationship>` — z-score of residual from rolling regression.
- `cointegration_score_<pair>` — engle-granger or johansen-derived persistence score.
- `mismatch_zscore_<relationship>` — primary input to mismatch detectors.

**Cross-asset stress features:**

- `riskoff_composite` — VIX + credit-spread + DXY + EM-equity composite, z-scored.
- `regime_classifier_label` — multinomial regime label (risk-on / risk-off / inflation-shock / growth-scare / quiet).
- `crowding_index_<asset>` — proxy for positioning extremity (CFTC where applicable + survey data + dispersion-derived).

**Theme-evidence features:**

- `evidence_ledger_balance_<theme>` — confirming-minus-contradicting count over rolling window for each active theme.
- `theme_health_score_<theme>` — composite of evidence balance + supporting-relationship reliability + mismatch-with-thesis flag.
- `theme_catalyst_density_<theme>` — count of upcoming Tier-1 catalysts within horizon, theme-tagged.

**Conviction & calibration features:**

- `conviction_history_<theme>` — sparkline-ready time series of Rafael's stated conviction.
- `conviction_velocity_<theme>` — rate-of-change of conviction; high values flag possible inflation.
- `calibration_brier_<rafael>_<window>` — running Brier score on Rafael's stated conviction vs realized outcomes.

**Macro-flow features (where data permits):**

- `eppi_geopolitical_risk_index` — published GPR-style index.
- `polling_aggregator_<election>` — relevant election cycles only.

**Illustrative — actual platform catalog will differ.** Other archetypes contribute features Rafael consumes: Henry's factor exposures (cross-asset equity risk), Ingrid's curve features (rates DV01, curve shape), Yuki's carry-trade unwind risk score, Theo's energy-inventory features. Cross-pollination is high — Rafael imports more than he exports.

### 4.3 Feature Engineering Surface

Standard. Rafael's feature work is mostly **composition** — combining cross-asset features into theme-health composites — rather than novel feature invention. New features come in slowly, often around a new theme that needs tracking.

### 4.4 The Drift Dashboard

Standard. The features Rafael cares about most for drift are the **regime classifiers** and **cross-asset correlation features**, because those are the substrate of his mismatch detectors. A drifting correlation feature silently degrades every mismatch flag downstream.

### 4.5 Cross-Pollination View

Rafael's domain pulls from every other desk's feature library. The view shows per-theme which other-desk features are loaded into the relevant scaffolds, with versioning and dependency tracking.

### 4.6 Interactions Rafael has with the feature library

- **Weekly:** glances at drift status on his core regime / correlation features.
- **Monthly:** reviews with Quinn the cross-pollination — which features from other desks have changed semantics or owner.
- **Theme-launch:** when a new theme is opened, registers any theme-specific features (often combining existing primitives) and wires them into the scaffolding.

### 4.7 Why this matters

A theme-monitoring scaffold is only as good as the features it stands on. Drift in a correlation feature can convert a sound mismatch detector into a noise generator; drift in a regime classifier can silently shift theme-health scores. Feature-library discipline is the difference between scaffolds Rafael trusts and scaffolds he silently routes around.

---

## 5. The Research Workspace

For shared concepts (notebook, backtest engine, walk-forward, templates, compute, anti-patterns), see [automation-foundation.md](automation-foundation.md).

### 5.1 Notebook Environment

Standard Jupyter-style environment with platform-integrated data access. Rafael's typical queries are **historical-regime lookups** ("when has US 10y risen 100bps in 6 months while DXY fell? what did EM equities do?"), **expression-comparison backfills** ("when this thesis last held, did the option or the spread perform better?"), and **relationship-stability analyses** ("over the last 20 years, when has oil-CAD correlation broken down?"). Less ML-model training, more empirical pattern queries against the historical regime corpus.

### 5.2 Backtest Engine UI

Backtest applicability for Rafael is **limited**. His themes are slow, idiosyncratic, and don't lend themselves to systematic backtesting. The backtest engine is used for:

- **Historical-fit lookups** for the expression-comparison tool: "given this thesis structure, here are the past episodes; here's what each candidate expression returned."
- **Relationship-stability backtests**: "if I assumed this cross-asset relationship held with N stdev tolerance, how often would my mismatch detector have produced a profitable trade?"
- **Conviction-calibration replay**: replaying Rafael's stated conviction history against realized outcomes (this drives section 13).

It is **not** used for "find me a strategy that backtests well." Rafael's themes don't backtest in the Marcus / Sasha sense.

Execution-realism notes for any backtest he does run: macro positions are large and slow, slippage modeling matters less, but **pair / structure decomposition** matters (a "long DXY short EUR" thesis backtest must decompose into the actual instruments, with carry, financing, and rebalancing costs).

### 5.3 Walk-Forward Visualization

Limited applicability — see 5.2. Used mainly for relationship-stability and calibration replays.

### 5.4 Strategy Template Library

Rafael's "templates" are **theme-scaffold templates**, not alpha-strategy templates. Illustrative:

- **Theme-evidence-monitor template** — boilerplate for opening a new theme with auto-wired catalyst calendar, evidence ledger, supporting-relationship registry.
- **Cross-asset-relationship-monitor template** — boilerplate for tracking a named relationship with rolling correlation, regression residual, mismatch z-score.
- **Mismatch-detector template** — wraps a relationship monitor with z-score thresholds and theme-attribution rules.
- **Expression-comparison spec template** — describes a thesis structure and the candidate expression set to evaluate.
- **Scenario-stress-shock template** — boilerplate for a named cross-asset shock (custom inflation / growth / geopolitical scenarios).
- **Theme-relationship-reliability template** — registers the supporting relationships for a theme and tracks whether they hold live.
- **Conviction-calibration backfill template** — replays Rafael's stated conviction against realized outcomes for any chosen window.

**Illustrative — actual templates will differ.**

### 5.5 Compute Management

Lightweight by Marcus standards. Most of Rafael's compute is daily-batch (recompute correlations, refresh nowcasts, run scenario PnL across the book). Bursty compute around new-theme onboarding or large historical-regime queries. CPU-heavy, GPU-rare.

### 5.6 Anti-Patterns the Workspace Prevents

Standard look-ahead, train-test-leakage, single-window-fitting protections. **One Rafael-specific anti-pattern:** **regime-cherry-picking** — querying historical regimes for confirming evidence of a current thesis without sampling contradicting episodes. The workspace flags when a query has a regime filter that excludes >70% of comparable historical periods.

### 5.7 Interactions Rafael has with the workspace

- **Pre-market:** glance at overnight scenario PnL refresh; check theme-health composites; review any flagged mismatches.
- **In-market (slow rhythm):** opens the workspace ad-hoc when a thesis question demands historical evidence; runs an expression-comparison backfill before sizing into a new expression.
- **Post-market / weekly:** refreshes calibration replay; reviews any theme-relationship-reliability degradation.

### 5.8 Why this matters

The workspace is where Rafael's slow rhythm meets the platform's compute. He does not live in it; he visits it for evidence runs. The value is **speed of well-formed historical queries** (minutes, not days), so the answer comes back inside the cycle of the thinking he is doing.

---

## 6. The Model Registry

For shared concepts (browser, model record, versioning, drift, lineage), see [automation-foundation.md](automation-foundation.md). The model registry is **less central for Rafael** than for Marcus or Sasha, because his automated work is mostly scaffolding rather than predictive ML. This section is short by design.

### 6.1 The Model Registry Browser

Standard layout. Rafael's models, when they exist, are typically:

- Regime classifiers (multinomial label).
- Cross-asset relationship models (rolling regressions, cointegration models).
- Theme-evidence sentiment NLP (classifier on news and central-bank speeches).
- Nowcast composites (combining sub-nowcasts into a unified growth or inflation nowcast).
- Calibration models (Rafael's conviction vs realized outcome curve).

These are smaller, simpler, and longer-lived than Marcus's strategy-scoped models. Versioning is still mandatory; cycle is monthly-to-quarterly, not weekly.

### 6.2 The Model Record Page

Standard. Owner = Rafael (or shared with Quinn for cross-archetype regime / correlation models). Approval gate is lighter than for an alpha model — these are diagnostic, not directional.

### 6.3 Versioning & Immutability

Standard.

### 6.4 Drift Surface for Models

For Rafael the most-watched drift is on the **regime classifier** and the **cross-asset relationship models**. A regime classifier that has silently re-labeled the past 6 months will mis-feed every theme-health composite downstream.

### 6.5 Lineage Graph

Standard. Lineage matters here because a model like the regime classifier feeds many monitors, and a model bump must be reflected everywhere consistently.

### 6.6 Why this matters

Rafael's models are small in number but high in leverage — one regime classifier feeds dozens of scaffolds. Registry discipline keeps the cascade controlled.

---

## 7. The Experiment Tracker

For shared concepts (browser, per-experiment record, run comparison, anti-patterns), see [automation-foundation.md](automation-foundation.md).

### 7.1 The Experiment Browser

Standard. Rafael's experiments cluster differently from Marcus's. His are:

- **Theme-evolution experiments** — "if this theme had been opened with conviction Y at time T, sized per the conviction-and-asymmetry calculus, with these N candidate expressions, what would the trajectory have been under various exit rules?"
- **Relationship-pattern experiments** — "what windows / regimes have this cross-asset relationship been most reliable in?"
- **Mismatch-detector tuning** — "what z-score threshold for this relationship maximizes precision-vs-recall on Rafael's historical fired flags?"
- **Calibration experiments** — replays of Rafael's conviction history under different smoothing / decay assumptions.
- **Nowcast composition experiments** — testing different weights of sub-nowcasts.

These are run sparingly compared to a Marcus alpha grid-search; cadence is ad-hoc, often theme-launch-driven.

### 7.2 Per-Experiment Record

Standard fields: ID, owner, hypothesis, dataset versions, code commit, parameters, metrics, runtime, status, notes. Rafael's "hypothesis" field is often a **prose paragraph** — closer to a research note than a numerical spec — because his experiments are exploratory.

### 7.3 Run Comparison Views

Standard. Rafael's most-used view is the **regime-stratified comparison**: did this relationship / nowcast / mismatch detector behave the same across past regimes? Stratification by 1998 / 2008 / 2013 / 2020 / 2022-style episodes.

### 7.4 Anti-Patterns Prevented

Standard p-hacking, parameter-sweeping-without-correction, look-ahead. **Rafael-specific:** the workspace flags **single-regime fitting** — when an experiment's metrics are dominated by one historical episode, it warns and offers a regime-stratified rerun.

### 7.5 Interactions Rafael has with the experiment tracker

Light. Mostly opened around a new theme or when re-tuning a mismatch detector. Logged by the platform automatically when notebooks run; Rafael annotates with prose.

### 7.6 Why this matters

Rafael's experiments are small in number but each one informs how he reads the world for months. The tracker keeps the prose, the parameters, and the regime stratifications together so a year later he can answer "what assumption went into this scaffold and is it still valid?"

---

## 8. Strategy Composition

For shared concepts (composition surface, pre-deployment validation, versioning), see [automation-foundation.md](automation-foundation.md).

**Strategy composition is mostly absent for Rafael.** He does not compose alpha strategies. His "compositions" are **theme-dashboards and monitoring-scaffold bundles**: a configuration that says "this theme is open, these monitors are wired to it, these mismatch detectors are firing into its evidence ledger, these scenario shocks are precomputed against its expressions, this conviction-calibration trace is logging." The composition surface for Rafael is a **theme-launch wizard**, not a strategy DSL.

### 8.1 The Theme-Scaffold Composition Surface

Layout sketch:

```
[ Theme metadata ]              [ Live preview ]
  Name: Fed over-tightening      • Theme health composite
  Thesis: <linked doc>           • Active mismatches: 2
  Horizon: 3-6m                  • Scenario PnL grid (placeholder)
  Conviction: 7/10               • Catalyst countdown (placeholder)
  Status: live

[ Monitors wired ]              [ Catalysts ]
  • Evidence ledger               • FOMC +14d
  • Cross-asset relationships:    • NFP Fri
    rates↔FX, gold↔real-yields    • US CPI +21d
    breakevens↔oil
  • Mismatch detectors:           [ Expressions registered ]
    rates-FX (z>2)                • Long 5y UST
    gold-real-yields (z>2.5)      • Long 1y SOFR
                                  • Long 3m EURUSD 25Δ call
[ Scenario shocks subscribed ]    • Long gold (GLD)
  • Risk-off
  • Growth scare                  [ Invalidation rules ]
  • Inflation surprise            • US core CPI > 4% YoY 2 prints
                                  • Fed signals cut
                                  • USDJPY > 165
```

The wizard is **not** a code DSL — it's a structured form. Rafael fills it; the platform wires the scaffolds.

### 8.2 Pre-Deployment Validation

Light by Marcus standards. The platform validates:

- All wired monitors have fresh data (no stale dependencies).
- Invalidation rules are well-formed and wired into the alerts engine.
- Registered expressions exist in the order-management system or are flagged as paper.
- Scenario shocks have current coefficients.

### 8.3 Theme-Scaffold Versioning

When Rafael edits a theme — adds an expression, changes a conviction, edits an invalidation rule — the change is versioned. Theme-journal entries are version-linked. A closed theme freezes its scaffold version and journal for retrospective use.

### 8.4 Rafael's Theme-Scaffold Templates

See section 5.4 — the templates listed there are the building blocks. The composition step assembles a theme from those templates plus Rafael's specifics.

### 8.5 Why this matters

Composition for Rafael is **assembling a structured object that the rest of the platform can hang off**. It is not "build me a strategy." But the discipline matters: a theme with a malformed invalidation rule does not fire when it should; a theme with a stale relationship dependency feeds Rafael bad signals for weeks. The wizard is the gate that prevents both.

---

## 9. Promotion Gates & Lifecycle

For shared concepts (lifecycle stages, gates, canary), see [automation-foundation.md](automation-foundation.md).

For Rafael, lifecycle applies **per theme-monitoring scaffold**, not per alpha strategy. Cadence is slow.

### 9.1 The Lifecycle Pipeline View

Stages:

- **Drafting** — Rafael is writing the thesis; evidence is being gathered; no scaffolds wired live.
- **Paper-expressed** — scaffold is wired; expressions are paper-only; theme-health composite is computed; no capital deployed.
- **Live** — capital deployed; full scaffolding active; evidence ledger live; alerts firing.
- **Scaling** — conviction up; capital adding; secondary expressions onboarded.
- **Scaling-back** — conviction down or asymmetry diminished; capital trimming.
- **Closing** — exiting all expressions; scaffold remains for retrospective only.
- **Closed** — frozen for retrospective.
- **Invalidated** — closed because invalidation rule fired; theme-journal flagged for postmortem.

### 9.2 Gates Between Stages

Lighter than Marcus's gates because Rafael himself is the primary gatekeeper. Platform-enforced minimums:

- Drafting → Paper: thesis document exists; at least one mismatch detector or evidence monitor wired.
- Paper → Live: invalidation rules well-formed; at least one expression registered; pre-trade risk preview run.
- Any → Closing: confirmation prompt and journal entry mandatory.
- Live → Invalidated: automatic if invalidation rule fires; manual override possible with journal entry.

### 9.3 Canary / Pilot

Concept adapts. "Pilot" for Rafael = paper-expressed stage with full scaffold but no capital. Some themes live there for months while evidence builds.

### 9.4 Retired / Closed Themes

Frozen scaffold preserved. Retrospective auto-prepped from journal entries. Conviction-calibration tracker updates.

### 9.5 Why this matters

Slow cadence and human judgment do not mean no discipline. The lifecycle structure ensures every theme has a wired scaffold before going live, an invalidation rule before capital deploys, and a retrospective when it closes.

---

## 10. Capital Allocation

For shared concepts, see [automation-foundation.md](automation-foundation.md). Capital allocation for Rafael is **per-theme + per-expression, conviction-weighted**.

### 10.1 Theme-Level Allocation

Each active theme has a conviction-weighted risk budget. Across N active themes, Rafael's total book risk (VaR, or aggregate axis exposure) is allocated by:

- **Conviction weight** — the 8/10 theme gets more than the 6/10 theme.
- **Asymmetry weight** — themes with bounded loss / large upside get a multiplier.
- **Diversification penalty** — if two themes have overlapping cross-asset risk, the second is discounted.
- **Liquidity / capacity floor** — even a high-conviction theme is capped if its expressions are size-constrained.

The allocation is **not auto-rebalanced**. It is a **suggestion surface**: the platform shows current vs target per theme, and Rafael adjusts manually. Rafael's cardinal rule is "never let an algorithm size my conviction."

### 10.2 Expression-Level Allocation

Within a theme, capital is split across expressions (outright, spread, options structure, capital structure, basket) by:

- **Asymmetry of the specific expression** — option expressions get sized in premium-at-risk; outrights in DV01 or beta-adjusted dollars.
- **Liquidity** — patient builds for less-liquid expressions; immediate fills for liquid ones.
- **Carry** — negative-carry expressions sized smaller and shorter-horizon.

### 10.3 Risk-Limit Hierarchy

Standard book-level VaR limit; per-axis caps (rates DV01, FX delta, equity beta, vega, commodity delta); per-theme caps (no single theme > X% of book risk); per-expression caps (no single expression > Y%).

### 10.4 Suggestion vs Auto

For Rafael more than any other archetype, the allocation surface is suggestion-only. The platform never moves capital without Rafael's click. The exceptions are **risk-limit-breach automatic reduces** (book VaR limit hit → algo-reduce per pre-set rules; this is more akin to a kill switch than allocation) — covered in section 12.

### 10.5 What the Platform Surfaces

- Current theme-level risk distribution vs Rafael's stated conviction distribution. Mismatches flagged ("you say theme X is your highest conviction but theme Y is consuming more risk").
- Aggregate axis exposure heatmap: where is the book concentrated? Where is it short?
- Correlation cluster diagnostic: are themes that should be uncorrelated drifting toward correlation? (Often a sign Rafael has unconsciously bet the same idea twice across two named themes.)
- Capacity utilization per expression — how much of the theoretical max-size has been filled.

### 10.6 Why this matters

Conviction sizing is Rafael's most idiosyncratic skill. The platform's role is not to do it for him but to **make the gap between stated conviction and deployed capital legible**. The number of times a manual macro PM is "really 9/10 on theme A" but has more risk in theme B is the number of times the platform has saved them from themselves.

---

## 11. Live Fleet Supervision Console

For shared concepts (fleet dashboard, anomaly detection, correlation view), see [automation-foundation.md](automation-foundation.md). Rafael's "fleet" is **active themes + their monitoring scaffolds**, not strategies.

### 11.1 The Fleet Dashboard — Themes as Rows

Layout: one row per active theme. Columns: theme name, status, conviction (with sparkline), theme-health composite, # active mismatches, P/L today / WTD / MTD / inception, risk-consumed (theme-axis), next catalyst (countdown), evidence-ledger balance (confirming-minus-contradicting), invalidation-rule status (any tripped?).

Default state: **green / quiet**. Anomalies (theme-health degradation, fired mismatches, invalidation-rule trips) push the row to amber or red.

### 11.2 The Theme Detail Page — Drill-In

Click any row to drop into the theme's detail. Sections:

- **Thesis document** — current and revision history.
- **Evidence ledger** — all confirming / contradicting / neutral data points, news items, central-bank signals; filterable.
- **Wired monitors** — every mismatch detector, relationship monitor, scenario shock, with current values and recent firings.
- **Expressions** — every position serving this theme; size, P/L, risk contribution, carry, asymmetry.
- **Catalyst countdown** — every upcoming Tier-1 catalyst tagged to this theme.
- **Conviction history** — sparkline + prose-annotated revisions from the journal.
- **Theme journal** — full long-form entries.
- **Retrospective stub** — auto-prepped if theme is closed or scaling-back.

### 11.3 Anomaly Detection Surface

Standard. For Rafael: theme-health degradation (composite below threshold), fired mismatches (relationship z-score > N), invalidation-rule trips, evidence-ledger swings (confirming-minus-contradicting flips sign), conviction-velocity warnings (Rafael's conviction rising too fast on confirming-only evidence).

### 11.4 Cross-Theme Correlation View

The cross-theme correlation matrix described in Phase 3 of his manual sections is automated and continuous: when themes that should be uncorrelated drift toward correlation, the view flags it. Decomposes the correlation by underlying axis (rates / FX / equity / commodity / vega) so Rafael can see whether two themes are coupled because of, e.g., shared duration exposure.

### 11.5 Theme Pipeline Live State (Rafael's substitute for "Multi-Venue Capital")

A continuously-updated state object showing:

- Every active theme with current status, conviction, P/L, risk consumed.
- Pre-event positioning summaries for any Tier-1 catalyst within 7 days, aggregated across themes converging on the same event.
- Current cross-asset regime label (from regime classifier) and how each active theme aligns with that regime.
- Active-mismatch panel: every relationship currently flagging, with theme-attribution.
- Scenario PnL grid against the named cross-asset shock library — refreshed on every position change and every 30 minutes regardless.

### 11.6 Strategy State Inspection (mandatory)

For Rafael, "strategy state inspection" reads as **theme-scaffold state inspection** — but the platform-mandated discipline is the same as for any other archetype.

For any active theme-scaffold, Rafael can request a **point-in-time internal-state view**: every monitor's current value, every mismatch detector's current z-score and rolling history, every invalidation rule's evaluation result, every wired feature's freshness, every model's version and last-fitted date. The view is refresh-on-demand by default; event-pushed for the highest-leverage state (regime label changes, invalidation trips, theme-health threshold crossings) where the latency of waiting for a refresh would matter.

A **scaffold-vs-live comparison** runs daily by default: did the theme-health composite computed last night match the theme-health composite computed today against the same ledger snapshot? Did the mismatch detector fire on the same set of relationships? Did the conviction-calibration replay produce the same Brier score? Drift between batch and live is flagged as a platform bug, not a Rafael judgment.

**Engineering pragmatism:** the platform does **not** stream every variable of every monitor in real time. The default state is on-demand snapshot for most fields, event-pushed for the small set that matters. Streaming everything would saturate the wire and produce no judgment value for a slow-rhythm trader. The opinion here is exactly Marcus's: stream the load-bearing state; snapshot the rest.

### 11.7 Why this matters

Rafael's manual themes board is the spine of his terminal. The automated cousin makes that spine **continuously self-updating**: evidence ledgers fill from feeds, mismatches surface in real time, scenario PnL grids refresh on every position change, conviction-velocity warnings catch Rafael's own biases earlier than he would catch them himself. The console is not what Rafael watches all day — he steps away from the desk for hours. It is the **state-snapshot** he checks against, exactly as the manual sections describe, but kept richer and fresher than he could ever keep it himself.

---

## 12. Intervention Console

For shared concepts (per-strategy controls, kill switches at scope, audit log), see [automation-foundation.md](automation-foundation.md).

### 12.1 Per-Theme Controls

For any active theme:

- **Pause monitors** — temporarily quiet alerts (e.g. during a known data-revision window) without disabling the scaffold.
- **Pause specific mismatch detector** — turn off a single relationship flag (with mandatory reason in journal).
- **Reduce theme exposure** — algo-execute over the day to a target risk level. Sized per axis, executed via the appropriate per-asset-class algo from [#4-algos](common-tools.md#4-execution-algos-library).
- **Close theme** — unwind all expressions; scaffold transitions to closed; retrospective auto-prepped.
- **Edit invalidation rules** — adjust thresholds; versioned; journal-required.
- **Change conviction** — versioned; sparkline updates.

### 12.2 Group Controls — Per-Theme, Per-Theme-Type, Per-Catalyst

Rafael's group axis is **theme**, not strategy-class. Group controls:

- **Per-theme** — see 12.1.
- **Per-theme-type** — apply across all rates-driven themes, all growth-driven themes, all geopolitical themes. Useful when a single underlying changes (e.g. a Fed surprise affects every rates-driven theme).
- **Per-catalyst** — apply across all themes converging on a specific upcoming event. Pre-event de-risk pattern: "trim 30% across all themes long duration into FOMC."

### 12.3 Manual Trading & Reconciliation (mandatory)

The full manual order ticket described in the Phase 2 section above is preserved in automated mode. Rafael has not lost the ability to trade by hand; he has gained the scaffolding around it.

The manual ticket retains all its multi-asset, multi-leg, risk-unit-sized, theme-attached characteristics. Specifically:

- **Multi-asset, multi-leg ticket** — equities + rates + FX + commodities + credit + options in one structure, sized in DV01 / vega / beta-adjusted dollars / FX delta. The theme tag is mandatory at entry; "untagged" is not a path.
- **Pre-trade risk preview** runs on the structure; multi-axis risk delta + theme-level scenario P/L impact + liquidity profile + margin / counterparty consumption.
- **Vol-quoted entry** for any options leg; greeks at structure level; scenario PnL grid (spot × vol matrix).
- **Block / RFQ workflow** for size in less liquid markets, with dealer-panel routing and IOI / axe aggregation.
- **Roll-position-forward** one-click for any expression.
- **Cancel-all-working** present at all times.

**Reconciliation workflow.** When Rafael takes a manual override on a position the automated cousin is also touching (rare — Rafael's positions are typically not contested by an algo, but it can happen if a risk-limit auto-reduce is in flight when he sends a manual order), the system:

- Holds the auto action.
- Surfaces the conflict.
- Prompts for confirm / cancel-auto / cancel-manual.
- Logs the resolution to the audit trail and the relevant theme journal.

**Emergency mode.** A global hotkey puts the desk into manual-only — every auto action paused, every algo stopped, manual ticket and cancel-all the only available controls. Use cases: market-structure event, platform-incident, geopolitical headline shock. Re-enabling auto requires a deliberate confirm and a journal entry.

**Global hotkeys** (reduced relative to a market-maker but present): cancel-all-working; emergency-mode-toggle; close-active-theme (with confirm); reduce-book-VaR-to-target (with confirm).

**Tagging and audit.** Every manual action carries the theme tag, a free-text reason, and is appended to both the audit log and the relevant theme journal. The journal entry is a first-class artifact; the platform does not let Rafael skip it.

### 12.4 Kill Switches at Multiple Scopes

Hierarchy:

- **Per-mismatch-detector** — silence one flag.
- **Per-monitor** — pause one relationship monitor.
- **Per-theme** — close one theme (full unwind).
- **Per-theme-type** — close all rates-driven themes (rare; use case is a structural regime break).
- **Book-wide reduce-VaR-to-target** — algo-execute reduction to a stated VaR.
- **Book-wide flatten** — close every position; scaffolds transition to closed; retrospective prep triggered.
- **Platform-wide emergency** — coordinated with David's office.

Kill-switch invocation is logged with multi-key authorization required at theme-type and above.

### 12.5 Intervention Audit Log

Standard. Append-only, immutable, with theme-tag and journal-link mandatory on every entry.

### 12.6 Why this matters

Macro books are slow but the consequences of a wrong intervention are large and durable. The intervention console is intentionally heavy on confirmations and journal-entries because Rafael's theme judgment is exactly the kind of thing he should be forced to articulate when he overrides the platform — not because the platform is right and he is wrong, but because the articulation itself is the calibration loop.

---

## 13. Post-Trade & Decay Tracking

For shared concepts (retrospectives, decay metrics, retrain queue), see [automation-foundation.md](automation-foundation.md).

For Rafael, **decay applies to theme-relationship reliability** and to **monitoring-scaffold performance**, not to alpha-strategy edge. The framing is different from Marcus's.

### 13.1 Per-Theme Retrospective

On theme close, the scaffold's frozen state plus the journal feed an auto-prepped retrospective:

- Thesis statement at outset.
- Evidence trajectory — every confirming / contradicting / neutral entry with timestamps.
- Catalysts that landed and how each affected the thesis.
- Expressions chosen, sized, exited; P/L per expression; total theme P/L.
- Conviction history with annotations.
- Mismatch detectors that fired; which were true signals vs noise.
- Cross-asset relationships that held vs broke.
- What Rafael would do differently (his prose).

These retrospectives compound into Rafael's personal corpus referenced when evaluating new themes.

### 13.2 Theme-Relationship Decay

For every named cross-asset relationship in his dependency graph, the platform tracks **reliability decay**:

- Rolling correlation stability over expanding windows.
- Regression-coefficient stability.
- Mismatch-detector signal-to-noise over recent firings.
- Regime-stratified reliability — does this relationship hold in growth-driven regimes but break in inflation-shock regimes?

Decay metrics surface in the theme-relationship-reliability monitors. A theme whose supporting relationships are decaying is flagged at the theme level — Rafael may not have noticed, but the scaffold is becoming less trustworthy.

### 13.3 Mismatch-Detector Calibration Tracking

For every mismatch detector that has fired in the past N firings:

- Was the firing followed by reversion (confirming the mismatch was a real anomaly)?
- Was it followed by continuation (mismatch was a regime change, not an anomaly)?
- What's the precision / recall of the detector over its lifetime?

Detectors with degrading precision are auto-flagged for re-tuning.

### 13.4 Conviction Calibration

This is **Rafael's primary behavioral metric**, mandatory in section 13. The tracker surfaces:

- **Calibration curve** — stated conviction (1–10) on x-axis, realized hit-rate / risk-adjusted P/L on y-axis. Diagonal = well-calibrated; below = overconfident; above = underconfident.
- **Conviction inflation check** — does Rafael's conviction rise too quickly on confirming-only evidence? Sparkline review per theme.
- **Time-to-acknowledge-error** — how long after invalidation conditions trip does he actually close?
- **Theme batting average** — fraction of themes that closed profitable, by theme type (rates-driven, growth-driven, geopolitical, commodity).
- **Average winning theme size vs average losing theme size** — sizing-discipline check.
- **Brier score** — running, on the conviction-as-probability mapping.

This is the highest-leverage post-trade artifact for Rafael. A 2-point improvement in calibration over a year compounds into substantially larger theme-batting-average and risk-adjusted return.

### 13.5 Macro-Forecast Calibration

Rafael's own forecasts (rates, growth, inflation, FX) vs realized outcomes. Forecast-error distribution by variable and horizon. Sources of error pattern-matched. This calibration loop feeds his self-assessment more than it feeds an algorithm.

### 13.6 Retrain Queue / Re-Tune Queue

For Rafael's models (regime classifiers, relationship models, sentiment NLP) the queue surfaces those whose drift exceeds threshold. Cadence is monthly-to-quarterly. For mismatch detectors with degrading precision, re-tuning candidates are queued.

### 13.7 Why this matters

For Rafael, post-trade is not "did the strategy edge hold?" — it is "did my conviction track reality, did the relationships hold, did the scaffolds tell me what I needed?" These are the calibration loops that turn 20 years of theme-trading experience into 20 years of compounding theme-trading skill. Without them, every theme starts from zero.

---

## 14. The Supervisor Console — Rafael's Daily UI

For shared concepts (mode switching, anomaly-driven default state), see [automation-foundation.md](automation-foundation.md).

### 14.1 Layout Sketch

Rafael's manual physical setup is six monitors theme-centric. The automated console preserves that shape and adds automation surfaces in the periphery.

```
| TL: Themes board (foveal, automated)        | TC: Cross-asset dashboard (live, w/ regime label) | TR: Macro calendar + theme-tagged news |
| ML: Theme detail (selected theme,            | MC: Multi-axis risk panel + theme-level P/L       | MR: Order ticket (theme-aware,         |
|     scaffold state, evidence ledger)         |     + scenario PnL grid                           |     multi-asset, multi-leg)            |
| BL: Cross-asset relationship monitor +       | BR: Sell-side research, CB speakers, geopolitical                                          |
|     active mismatches                        |     news, podcast queue                                                                    |
```

Tablet: chat with strategists, IB morning notes, podcast / interview audio (unchanged from manual).

The themes board on top-left is the foveal surface, just as in manual mode — but now automated: the rows update themselves as the day progresses, the conviction sparklines re-draw, the mismatch counts tick.

### 14.2 Mode-Switching

Rafael's modes:

- **Research mode** — themes board + theme-detail (deep on one theme) + research workspace + journal. Ticker quiet. For long-form thinking sessions.
- **Supervision mode** — full layout above; default state.
- **Pre-event mode** — for Tier-1 catalysts (FOMC, ECB, NFP, CPI). Catalyst-positioning aggregator foreground; scenario PnL grid foreground; theme-level pre-event summary visible per theme converging on the event.
- **Event mode** — catalyst is unfolding. Cross-asset dashboard goes live-tick; theme-health composites refresh on every print; manual ticket pre-loaded with most-likely contingent expressions; mismatch detectors flagging in real time.
- **Post-event mode** — what fired, what didn't; relationship-confirmation summary; conviction-update prompts per active theme.
- **Quiet mode** — for off-days and weekends; alerts queued, theme-health composites refresh slowly, no real-time cross-asset tick.

Mode is selectable manually; the platform auto-suggests pre-event / event / post-event around scheduled Tier-1 catalysts.

### 14.3 Anomaly-Driven Default State

Default visual state of the console: **green / quiet**. Active mismatches, theme-health degradations, invalidation-rule trips, conviction-velocity warnings push surfaces to amber or red. Rafael's slow rhythm is preserved — he can step away from the desk for hours; when he returns, the default surfaces tell him what changed.

### 14.4 Why this matters

The console respects Rafael's manual rhythm — theme-centric, slow, walks-and-conversations-friendly — and extends it with continuous monitoring he could not do himself. The discipline is to **not make him watch the screen**. The surfaces hold state; he visits them.

---

## 15. Rafael's Automated-Mode Daily Rhythm

### 15.1 Pre-Market

- Glance at overnight scenario PnL refresh.
- Read overnight news / research filtered to active themes.
- Review any flagged mismatches that fired overnight.
- Check theme-health composites; any theme that degraded overnight gets a journal-entry prompt.
- Read morning notes from sell-side strategists; tag any items into the relevant theme's evidence ledger.
- Decide focus theme(s) for the day.

### 15.2 In-Market

Slow. Rafael's rhythm is **not** continuous attention. Pattern:

- Long-form reading or strategist conversations off-screen.
- Returns to the desk on alerts (mismatch fired, invalidation rule tripped, catalyst landing) or on his own cadence.
- Around scheduled Tier-1 catalysts (FOMC, ECB, NFP, CPI), pre-event mode is active 60+ minutes before; event mode during; post-event mode after, with a forced conviction-review prompt per affected theme.
- New mismatches that align with an existing theme are evaluated via the expression-comparison engine, then sized via the manual ticket.

### 15.3 Post-Market

- End-of-day conviction-review prompt per active theme: any change today?
- Journal entries for the day's evidence (auto-prepped from tagged news / data; Rafael edits the prose).
- Check calibration tracker if any theme closed today.
- Review tomorrow's calendar; pre-stage any scenario PnL grids for upcoming catalysts.

### 15.4 Weekly / Monthly / Quarterly

- **Weekly:** team review of all active themes; export theme-deck from the journal.
- **Monthly:** attribution by theme & asset class; conviction-calibration update; cross-pollination review with Quinn.
- **Quarterly:** investor / committee letter authored from theme-journal narratives; full retrospective on closed themes; deep calibration review.

Rafael's rhythm is **central-bank cycle and major-data-release-driven**, not market-hours-driven. Off-cycle days are research days.

---

## 16. Differences from Manual Mode

| Dimension            | Manual Rafael                                         | Automated Rafael                                                                                    |
| -------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Coverage             | 3–5 themes deeply                                     | 7–10 themes deeply (scaffolding picks up the continuous monitoring load)                            |
| Trades per day       | Few; theme-driven                                     | Same. Automation does not generate trades for him.                                                  |
| Phase 1 (Decide)     | Reading, conversations, intuition, paper-tracking     | Same — but evidence ledgers, mismatch detectors, and historical-regime queries support the thinking |
| Phase 2 (Enter)      | Manual ticket; private spreadsheet for expression cmp | Manual ticket preserved; expression-comparison engine replaces the spreadsheet                      |
| Phase 3 (Hold)       | Themes-by-theme blotter; manual relationship watching | Same blotter; automated relationship monitoring + scenario PnL grid + mismatch detectors            |
| Phase 4 (Learn)      | Journal-driven; calibration mostly mental             | Journal preserved; calibration tracker quantified; auto-prepped retrospectives                      |
| Time on charts       | Moderate                                              | Lower (scaffolds replace some chart-glancing)                                                       |
| Time on research     | High                                                  | Same or higher (more time freed by automation goes back into reading)                               |
| Time on supervision  | High (manual relationship watching)                   | Lower (mismatches surface to him)                                                                   |
| Time on intervention | Moderate                                              | Lower; clearer kill-switch hierarchy                                                                |
| Latency criticality  | Low                                                   | Low                                                                                                 |
| Risk units           | DV01, vega, beta, FX delta, commodity delta           | Same                                                                                                |
| Edge metric          | Theme-batting-average, risk-adjusted return           | Same + conviction-calibration Brier score                                                           |
| Cognitive load       | High; many monitors to glance                         | Lower; default green; surfaces push to him                                                          |
| Failure modes        | Missed mismatch, conviction inflation, stale data lag | Stale data still possible (data-layer discipline); platform-bug-driven scaffold drift               |
| Tools mastered       | Themes board, expression spreadsheet, journal         | Same + scaffold composition wizard, mismatch detector tuning, calibration tracker                   |
| Compensation driver  | Theme P/L                                             | Same                                                                                                |

The fundamental change for Rafael is **continuous monitoring at depth he could never sustain manually, layered around a manual rhythm that is otherwise unchanged**. He still forms themes, picks expressions, sizes by conviction, reads cross-asset chains. The platform does not replace that work. It replaces the **continuous attention required to keep the scaffolding live**.

---

## 17. Coordination with Other Roles

### 17.1 Coordination with Every Trader (Adjacent Peer = All)

Rafael's coordination peer is **every trader** because he expresses themes through their domains.

- **Henry** — equity index / country-ETF / single-name expressions of macro themes (e.g. "long Japan reflation" expressed via Nikkei calls or specific Japanese banks). Rafael flags theme-driven flow; Henry incorporates into his factor and discretionary book; both sides avoid stepping on each other.
- **Ingrid** — rates expressions (curve trades, outright duration). Rafael's rates expressions are coordinated with Ingrid's curve view to avoid double-up; Ingrid's auction-day judgment feeds Rafael's pre-event positioning.
- **Yuki** — FX expressions across G10 and EM. Rafael's currency views are coordinated; Yuki's session-aware execution serves Rafael's FX legs; Yuki's EM political-risk overlay informs Rafael's geopolitical theme-tagging.
- **Theo** — energy and commodity expressions of macro themes. Theo's OPEC headline reading and seasonal cycle awareness feed Rafael's commodity-theme structure.
- **Sasha** — vol and options structures. Many of Rafael's most-asymmetric expressions are options; Sasha's vol-quoted ticket and surface analytics support the structure; Sasha's vol regime reads inform Rafael's options-vs-outright choices.
- **Marcus / Julius** — selectively, when crypto is a theme expression (e.g. "long debasement" expressed partially via crypto). Light coordination.

The coordination shape: Rafael owns the theme; the relevant trader owns the expression in their domain. Position-overlap and risk-overlap are surfaced by the platform; coordination is mostly journal-and-chat in normal cycles, more formal around Tier-1 catalysts.

### 17.2 Coordination with Quinn

Universal — Quinn is the cross-archetype overseer. For Rafael:

- Cross-archetype factor / stat-arb overlap awareness — Quinn's firm-systematic strategies may have macro-theme-correlated exposure; Rafael's themes may incidentally accumulate factor exposure. The shared correlation matrix surfaces both.
- Shared feature library — Quinn's regime classifiers and cross-asset features feed Rafael's scaffolds; Rafael's theme-evidence features may feed Quinn's diagnostic suite.
- Promotion-gate awareness — when Quinn promotes a new firm-systematic strategy with macro exposure, Rafael is notified; same in reverse for new theme-launches with material risk.

### 17.3 Coordination with David

Universal — firm-level supervision. For Rafael:

- Firm-level supervision of theme-level risk concentration; David enforces book VaR limits and per-theme caps.
- Behavioral monitoring — David's office sees the conviction-calibration tracker output and behavioral-analytics surface; conversations triggered by patterns (e.g. conviction inflation, sizing inconsistency).
- Capital allocation — David sets Rafael's book size and any per-asset-class caps within it.
- Promotion sign-off — new theme-launches above material size require David's awareness; new scaffold types or new mismatch detectors of material weight require sign-off.
- Catastrophe response — coordinated kill-switch invocation across the firm; Rafael's emergency-mode hotkey ties into David's firm-wide controls.

### 17.4 Archetype-Specific Coordinations

- **Sell-side strategists and economists** — IB and independent research. Routed by theme into the relevant evidence ledger; relationships preserved with strategists Rafael trusts.
- **Internal economists and macro researchers** — own contributions tagged to themes; Rafael's theme docs are forkable / sharable to the team.
- **Geopolitical analysts (external)** — Eurasia Group-style services route into the geopolitical theme tags.
- **Investor-letter / IR / reporting team** — quarterly investor letter is structured around theme narratives; IR uses theme-attributed performance summaries.

### 17.5 Why this matters

Rafael is the most-connected trader on the floor by design — every theme expresses through someone else's domain. The coordination surfaces are what prevent his book and the rest of the floor from accumulating silent overlapping risk, and what let his theme P/L attribute correctly across the firm.

---

## 18. How to Use This Appendix

When evaluating any global-macro / theme-driven automated terminal (including our own) against Rafael's needs, walk through each surface and ask:

**Data layer:**

- Are macro release vintages tracked, with downstream re-base on revisions?
- Is data freshness monitored at release-cadence granularity, not just tick-rate?
- Are macro-surprise indices and nowcasts (growth + inflation, decoupled) first-class datasets?
- Is the historical regime corpus labeled and queryable for historical-fit lookups?

**Feature library:**

- Are cross-asset relationship features (correlations, regression residuals, mismatch z-scores) registered, versioned, and drift-monitored?
- Are regime classifiers tracked as load-bearing models with explicit lineage to downstream scaffolds?
- Is theme-evidence feature engineering supported (NLP-tagged sentiment, evidence-ledger composition)?

**Research workspace:**

- Does the workspace prevent regime-cherry-picking on historical-regime queries?
- Are expression-comparison backfills first-class, with carry / IV-rank / asymmetry / liquidity / historical-fit returned?
- Is conviction-calibration replay supported as a first-class workflow?

**Model registry & experiment tracker:**

- Are regime classifiers and cross-asset relationship models versioned with full lineage?
- Are theme-evolution experiments distinguishable from numerical-strategy backtests?
- Are experiment hypotheses prose-friendly, not numerical-spec-only?

**Theme-scaffold composition (Rafael's substitute for strategy composition):**

- Is theme-launch a structured form, not a code DSL?
- Are wired monitors, mismatch detectors, scenario shocks, and invalidation rules first-class fields on a theme?
- Are theme edits versioned and journal-linked?

**Lifecycle:**

- Are paper-expressed themes a real stage, with full scaffolding but no capital?
- Does live → invalidated transition automatically when an invalidation rule fires?
- Does close-of-theme auto-prep a retrospective from the journal?

**Capital allocation:**

- Is allocation per-theme + per-expression, conviction-weighted?
- Does the platform surface mismatches between stated conviction and deployed capital?
- Is the correlation-cluster diagnostic visible (themes drifting toward shared exposure)?
- Is allocation suggestion-only, never auto-moved without Rafael's click?

**Live fleet supervision:**

- Are themes the rows of the fleet dashboard, not strategies or instruments?
- Do theme detail pages show evidence ledger, wired monitors, expressions, catalyst countdown, conviction history, theme journal?
- Is theme-pipeline live state aggregated with pre-event positioning summaries?
- Is strategy / theme state inspection on-demand, with scaffold-vs-live comparison daily?

**Intervention console & manual trading:**

- Is the manual multi-asset, multi-leg, risk-unit-sized, theme-tagged ticket preserved in full?
- Are reduce-theme-exposure, close-theme, edit-invalidation-rules, change-conviction first-class controls?
- Is the kill-switch hierarchy (per-detector → per-monitor → per-theme → per-theme-type → book-wide) clearly scoped?
- Is journal-entry mandatory on every override, with theme-tag enforcement?
- Is emergency manual-only mode a single-hotkey, single-confirm action?

**Post-trade & decay:**

- Is theme-relationship reliability tracked with regime-stratified decay metrics?
- Is mismatch-detector calibration tracked (precision / recall over recent firings)?
- Is the conviction-calibration tracker (curve, Brier score, conviction-velocity, time-to-acknowledge-error) front-and-center?
- Are auto-prepped per-theme retrospectives the default on theme close?

**Supervisor console:**

- Does the layout preserve Rafael's theme-centric six-monitor manual setup?
- Are research / supervision / pre-event / event / post-event / quiet modes selectable, with auto-suggestion around catalysts?
- Is the default visual state green / quiet?

**Daily rhythm:**

- Does the platform respect Rafael's slow rhythm — does it state-snapshot rather than demand continuous attention?
- Are end-of-day conviction-review prompts and journal-prep workflows automatic?
- Is the quarterly investor-letter draft prepped from theme-journal narratives?

**Coordination:**

- Is theme-driven flow shareable in real time with Henry / Ingrid / Yuki / Theo / Sasha?
- Is the cross-archetype correlation matrix (with Quinn) live?
- Is firm-level theme risk visible to David's office, with behavioral patterns flagged?

**Cross-cutting:**

- Is "theme" the primary axis everywhere — positions, P/L, risk, alerts, journal, attribution, retrospectives?
- Are scaffolds clearly support tools, not alpha generators? Is Rafael protected from automation that would size his conviction for him?
- Is long-form thinking accommodated as part of the rhythm, not ignored?

Gaps may be deliberate scope decisions but should be **known** gaps, not **accidental** ones. For Rafael more than any other trader on the floor, the platform's job is to **extend the human, not replace him** — and the questions above test whether the implementation has internalized that frame.
