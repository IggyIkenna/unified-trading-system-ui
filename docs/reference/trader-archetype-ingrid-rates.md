# Trader Archetype — Ingrid Lindqvist (Senior Rates Trader, G10 Sovereigns + Swaps)

A reference profile of a top-performing rates trader at a top-5 firm. Used as a yardstick for what an ideal **fixed-income / rates** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For shared surfaces every archetype uses, see [common-tools.md](common-tools.md). For surfaces unique to other archetypes, see [unique-tools.md](unique-tools.md). For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).

---

## Who Ingrid Is

**Name:** Ingrid Lindqvist
**Role:** Senior Rates Trader, G10 Sovereigns + Swaps
**Firm:** Top-5 global trading firm (rates desk within a multi-strat platform)
**Book size:** Multi-billion-dollar DV01-positive book, with daily turnover often in tens of billions notional
**Style:** Discretionary, with systematic overlays. Multi-day to multi-month horizons.
**Coverage:** US Treasuries (cash + futures), German bunds, JGBs, Gilts; interest-rate swaps (USD, EUR, GBP); SOFR/€STR/SONIA futures; some inflation linkers
**Trade types:** Outright duration, curve trades (2s10s, 5s30s steepeners/flatteners), butterflies, basis trades (cash–futures, swap–bond, asset swap), invoice spreads, switches/rolls

### How she thinks differently

Rates traders **don't think in prices**. They think in:

- **Yields** — the price of money over time.
- **Spreads** — the _relative_ price between two rates.
- **Curves** — the shape of yields across maturities.
- **DV01** ("dollar value of an 01") — the $ change in position value for a 1bp move in yield. This is her unit of risk.

Her mental model:

- The yield curve reflects expectations about growth, inflation, and central bank policy. Her edge is reading where the curve is mispricing those expectations.
- Almost every trade is a **relative-value** trade: long one tenor, short another, betting on shape change rather than direction.
- **Duration** (price sensitivity to yield changes) and **convexity** (curvature of that relationship) are first-class concepts.
- She trades around **scheduled events** more than any other trader: Treasury auctions, Fed meetings (FOMC), ECB meetings, payrolls, CPI, GDP. Calendar dominates.

### Her cognitive load

Rates is a **dense, jargon-heavy** market with fewer instruments but more relationships. A rates trader holds in mind: the spot curve and its recent path, the forward curve, the OIS curve, the swap curve and swap spreads, cross-currency basis, inflation breakevens and real yields, auction supply, primary dealer positioning, and central bank speakers.

The terminal must visualize **curves and surfaces**, not just price-time charts.

---

## Physical Setup

**6 monitors**, dominated by curve and surface visualizations, with macro context omnipresent.

| Position      | Surface                                                                                 |
| ------------- | --------------------------------------------------------------------------------------- |
| Top-left      | **Yield curves** — UST, bund, gilt, JGB, swap curves overlaid; spot, forward, OIS, real |
| Top-center    | **Curve trade dashboard** — spreads (2s10s, 5s30s), butterflies, with z-scores          |
| Top-right     | **Calendar** — auctions, central bank meetings, data releases with countdown            |
| Middle-left   | **Cross-market spreads** — UST vs bund, swap spreads, cross-currency basis, asset swap  |
| Middle-center | **Positions, DV01 / risk panel, P/L**                                                   |
| Middle-right  | **Order entry — outright, curve, butterfly, basis tickets**                             |
| Bottom-left   | **Macro tickers** — equities, FX, commodities, vol indices (relevant for risk-on/off)   |
| Bottom-right  | **News, economic calendar, central bank speakers, primary dealer flows**                |
| Tablet        | Bloomberg / Reuters chat, sell-side morning notes, IB economist commentary              |

She operates 24/5 but London / NY hours are her core. JGB / Tokyo activity matters during Asia overnight when she's monitoring rather than trading.

---

## Phase 1: Decide

### Yield curve visualization (foveal, unique)

The **primary thinking surface** — not a chart, a curve atlas. For each currency/sovereign:

- **Spot yield curve** — current yields by tenor (3m, 6m, 1y, 2y, 3y, 5y, 7y, 10y, 20y, 30y).
- **Curve overlay** — current vs 1d / 1w / 1m / 1y ago, vs YTD-high/low, with diff strip beneath.
- **Forward curve** — implied yields N years forward (1y1y, 2y1y, 5y5y, 10y10y).
- **OIS curve** — overnight index swap, proxy for risk-free policy rate path.
- **Real yield curve** — TIPS-style, separating inflation expectations.
- **Inflation breakeven curve** — nominal minus real, market-implied inflation.
- **Curve shape metrics** — slope (2s10s, 5s30s), curvature (2s5s10s butterfly), level (10y).
- **Yield/price toggle** — primary axis is yield; price is the secondary expression for futures and cash-bond P&L.

See [Charting](common-tools.md#1-multi-timeframe-charting). **Ingrid-specific characteristics:**

- Y-axis is yield (bps), not price; tenor (not time) is a first-class dimension.
- Charts overlay multiple curves on the same axis, not stacked panels.
- Time-series view is secondary; curve-shape view is primary.

### Curve trade dashboard (unique)

Spreads and flies as **first-class instruments**, not derived analytics:

- **Steepeners / flatteners** — every relevant pair (2s5s, 2s10s, 5s10s, 5s30s, 10s30s; per currency) with current value (bps), 1d/1w/1m change, and z-score vs 1m / 3m / 1y / 5y history.
- **Butterflies** — 2s5s10s, 5s10s30s, 2s10s30s — with z-scores and historical fit residuals.
- **Cross-curve spreads** — UST 10y vs bund 10y, UST 10y vs gilt 10y, UST 10y vs JGB 10y.
- **Rich/cheap heatmap** — every spread / fly z-score colour-graded on one screen for opportunity scanning.
- **Regression dashboards** — spread vs macro factors (curve slope vs ISM, breakevens vs oil, etc.) with current residual.
- **Rolling vol of spread** — to size curve trades in DV01 terms.

### Cross-curve & cross-currency spread board (unique)

- **Swap spreads** — UST yield minus same-tenor swap, by tenor; reflects credit / funding / balance-sheet stress.
- **Asset swap spreads** — bond YTM vs swap, key for relative value.
- **Cross-currency basis (XCCY)** — EURUSD, USDJPY, GBPUSD basis curves; funding-cost differentials.
- **Invoice spreads** — futures-implied yield vs swap.
- All quoted in bps with historical distribution and z-score.

### Auction calendar with concession tracker (unique)

The Treasury / DMO supply schedule shapes trade timing:

- **Upcoming auctions** with size, tenor, settlement, expected demand metrics (bid-to-cover, indirect/direct/dealer share).
- **Auction date countdown** — minutes-to-results once inside the day.
- **Pre-auction concession** — has the curve cheapened pre-auction (typical) or richened (unusual)? Historical concession size for that tenor / dealer day overlaid.
- **Post-auction performance tracker** — recent auctions' subsequent 1d/1w performance — does the recent supply digest cleanly?
- **Tail tracker** — stop-out yield vs WI yield at deadline, by auction.
- **Primary dealer positioning** (CFTC / NY Fed primary-dealer data) — are dealers long or short going into auction?
- **WI (when-issued) yield monitor** — pre-auction grey market.

### Central bank meeting calendar with implied rate path (unique)

- **FOMC, ECB, BoE, BoJ, BoC, RBA, RBNZ, SNB, Riksbank, Norges** — meeting dates, expected policy rate, statement / press-conference times.
- **Implied rate path** from OIS — what the market expects from each CB at each future meeting, both as terminal rate and per-meeting move probability.
- **Rate-cut/hike pricing** — probability of 25bp / 50bp move at each meeting, derived from OIS / SOFR futures / €STR futures.
- **Speaker calendar** — every scheduled speech, with hawk/dove tag derived from prior speeches.
- **Forward-guidance language tracker** — recent shift in statement language ("data-dependent," "patient," "soon," "for some time"), with diff vs previous meeting.
- **Dot plot tracker** (FOMC) — current dots vs market-implied path.

### Economic data calendar

See [Calendar](common-tools.md#12-catalyst--event-calendar). **Ingrid-specific characteristics:**

- Tier-1 releases (CPI, NFP, GDP, PCE, retail sales) carry consensus, prior, whisper, and **expected reaction in bps** for 2y/10y/curve.
- **Citi / Bloomberg surprise indices** for context on whether data has been beating or missing.
- **Pre-release positioning** indicator — is the market positioned hawkish or dovish heading in?
- Calendar is hierarchical: CB meetings > tier-1 data > auctions > tier-2 data > speakers.

### News & research

See [News](common-tools.md#13-news--research-feed). **Ingrid-specific characteristics:**

- Filtered to rates-relevant: CB statements, dealer rates strategy notes, primary-dealer surveys, NY Fed rate-expectations survey.
- Headlines auto-tagged hawkish / dovish / neutral with confidence.
- Sell-side morning notes (rates strategists) presented as a digestible feed, with **trade-idea tracker** linking ideas to outcomes.

### Cross-market & positioning context

- **Equities** (SPX futures, Nasdaq), **vol indices** (VIX, MOVE, G7 FX vol), **commodities** (oil, gold), **DXY**, **credit spreads** (IG / HY / EM) — risk-on / risk-off signal.
- **CFTC Commitment of Traders** — dealer / asset-manager / leveraged-fund positioning by contract.
- **Asset manager flows** — bond fund inflows / outflows.
- **Pension / insurance positioning** — long-end demand context.

**Layout principle for Decide:** curves and the calendar are foveal. Spreads/butterfly z-scores are scanned for opportunities. Macro context is constant peripheral.

---

## Phase 2: Enter

Rates execution is fundamentally **multi-leg**, **DV01-balanced**, and **venue-fragmented** (cash bonds vs futures vs swaps trade differently). The order ticket family is structurally different from the equity / crypto template.

### Outright ticket

See [Order Ticket](common-tools.md#2-order-entry-ticket-framework). **Ingrid-specific characteristics:**

- **Instrument selector** distinguishes UST 10y cash, TY future, and USD 10y swap — all "10y rates" but different products.
- **Quote unit is yield** (bps); price is secondary, displayed for futures / cash P&L only.
- **DV01 of trade** is displayed prominently next to notional.
- **Repo / financing rate** displayed for cash bonds (overnight cost of carry).
- **Carry & roll-down** estimated for the holding horizon.

### Curve / butterfly / basis ticket (unique)

Multi-leg DV01-balanced atomic execution, quoted in **bps of spread**:

**Curve (steepener / flattener):**

- Two legs (e.g. long 2y, short 10y for steepener).
- **DV01-balanced sizing** — auto-computed; user specifies total DV01 or notional of one leg, the other leg sizes itself.
- **Spread quoted in bps** — entry, exit, target, stop.
- **Live spread vs entry**, vs z-score, vs target.
- **Carry analysis** — does the trade pay or cost to hold? Forward path of the spread on the OIS curve.
- **Atomic execution** — both legs go in coordinated; partial fills handled by the engine.

**Butterfly:**

- Three legs (e.g. long 2y, short 5y ×2, long 10y).
- **DV01-balanced** with ratio computable from spec; 50/50 wing weighting available as alternative.
- **Quoted in bps** of butterfly spread (e.g. "−5bps to richer").
- Z-score and historical fit residual visible alongside the live quote.

**Basis (cash–futures):**

- Long bond / short future (or vice versa) atomic.
- **Conversion factor** awareness — futures have CTD (cheapest-to-deliver) mechanics.
- **Net basis, gross basis, implied repo** displayed live.
- **CTD switch risk** flagged when CTD changes likely under modest rate moves.
- **Roll calendar** — when to roll the futures leg.

### Swap ticket with cleared/bilateral selection (unique)

- **Pay fixed / receive fixed** as primary action.
- **Tenor selection** (1y to 30y), float-leg index (SOFR / €STR / SONIA / TONA).
- **Notional and DV01** visible together.
- **Counterparty selection** — bilateral or cleared (LCH / CME / Eurex), with margin / IM differential displayed.
- **Execution venue** — RFQ vs central limit order book vs voice — each with quote latency and depth.
- **Initial-margin estimate** for cleared, **CSA-aware MTM** for bilateral.

### RFQ workflow with dealer aggregation (unique)

Many rates trades are RFQ:

- **Send RFQ** to dealer panel via integrated **Bloomberg / Tradeweb / MarketAxess** connectors.
- **Quote aggregation** — best bid / offer across panel, dealer attribution (or anonymized per protocol rules).
- **Time-to-respond** indicator per dealer; auto-fade dealers who repeatedly miss.
- **Hit / lift** with one click; partial-fill reallocation if size exceeds top-of-book.
- **Last-look awareness** for dealers that operate it.
- **Post-trade allocation** if multi-account; dealer scorecard updates automatically.

### Pre-trade preview (multi-leg, unique)

See [Pre-Trade Preview](common-tools.md#3-pre-trade-risk-preview). **Ingrid-specific characteristics:**

- **DV01 by tenor bucket** added to book, not just total DV01.
- **Total DV01** added (should be ~0 for curve trades; non-zero is an error condition).
- **Convexity / gamma** added for the structure.
- **Carry & roll** for the structure, decomposed by leg.
- **Funding cost** for any cash legs.
- **Counterparty / CCP / margin** check for the swap leg.

### Algos

See [Algos](common-tools.md#4-execution-algos-library). **Ingrid-specific characteristics:**

- **TWAP / VWAP** for futures.
- **Iceberg** for cash treasuries.
- **Auction-aware** — defer execution before / during auction window for the relevant tenor.
- **Roll algos** — calendar-spread-aware execution of futures rolls.
- **Multi-leg algos** preserve DV01 balance across legs throughout execution.

### SOR

See [SOR](common-tools.md#5-smart-order-router--multi-venue-aggregation). **Ingrid-specific characteristics:**

- Routes across CME, Eurex, ICE, LCH, dealer-to-client venues for the same logical instrument.
- Aware that cash bonds and the matching future are not interchangeable for execution.

### Hotkeys

See [Hotkeys](common-tools.md#6-hotkey-system). **Ingrid-specific characteristics:**

- Hit bid / lift offer on quoted instrument.
- Cancel all on instrument or tenor.
- **Flatten DV01 on a tenor bucket** (rates-specific).
- Roll futures position.

**Layout principle for Enter:** the curve / butterfly / basis tickets are first-class, not buried in the outright ticket. Multi-leg execution is atomic. RFQ workflow integrated.

---

## Phase 3: Hold / Manage

Rates positions evolve through carry, roll-down, and event-driven repricing. Ingrid manages **DV01 buckets**, not individual positions.

### DV01-bucketed positions blotter (unique)

See [Positions](common-tools.md#7-positions-blotter). **Ingrid-specific characteristics:**

- **By tenor bucket** — 0–2y, 2–5y, 5–10y, 10–20y, 20–30y — with DV01 per bucket.
- **By currency** — USD, EUR, GBP, JPY.
- **By instrument type** — cash, future, swap.
- **Convexity per bucket**, total convexity.
- **Drill-down** to individual positions: instrument, side, notional, mark, yield, DV01, convexity, carry, roll, P/L.
- Notional is displayed but **DV01 is the primary sort and aggregation key.**

### Working orders

See [Working Orders](common-tools.md#8-working-orders-blotter). **Ingrid-specific characteristics:**

- Multi-leg working orders display as a single row that expands to legs.
- **Open RFQs** are working state, with dealer-response progress indicator.

### Live PnL — rates-style decomposition (unique)

See [Live PnL](common-tools.md#9-live-pnl-panel). **Ingrid-specific characteristics:**

Decomposed into:

- **Carry** — passive return from holding.
- **Roll-down** — gain from rolling along a positive-sloped curve.
- **Yield change PnL** — from market moves in level.
- **Curve change PnL** — from shape changes (slope, curvature).
- **Spread PnL** — for relative-value trades (swap spread, asset swap, basis).
- **Convexity PnL** — second-order from large yield moves.
- **Funding cost** — repo / XCCY.

Carry and roll-down are first-class, not derived — they're half the game.

### Risk panel — multi-dimensional (unique to rates)

See [Risk](common-tools.md#10-risk-panel-multi-axis). **Ingrid-specific characteristics:**

- **Total DV01** vs limit.
- **DV01 by tenor bucket** — duration distribution across the curve, with limit per bucket.
- **DV01 by currency** with currency-level limit.
- **Cross-currency basis exposure.**
- **Convexity** — book-level, by bucket.
- **Spread risk** — exposure to swap spreads, asset swaps, XCCY basis, treated as separate axes.
- **Liquidity profile** — how fast the book unwinds at typical bid-ask, by tenor.
- **Counterparty exposure** for OTC swaps, by CCP and bilateral counterparty.
- **Margin / collateral** consumption across CCPs.

### Curve-shape stress scenarios (unique)

See [Stress](common-tools.md#11-stress--scenario-panel). **Ingrid-specific characteristics:**

Pre-computed and named:

- **Parallel shifts** — ±25 / ±50 / ±100 bps.
- **Bull steepener** — front-end rallies, long-end lags.
- **Bear steepener** — long-end sells off, front-end stable.
- **Bull flattener** — long-end rallies, front-end lags.
- **Bear flattener** — front-end sells off, long-end stable.
- **Twist** — front-end up, long-end down (or vice versa).
- **Central bank surprise** — 50bps cut or hike at the next meeting, with curve response model.
- **Auction tail** — curve cheapens 5–10bps at the relevant tenor.
- **Risk-off** — flight-to-quality bid for govt bonds, swap spreads widen.

Each scenario quoted as DV01-shock × scenario-shape, P&L by bucket, carry-adjusted.

### Carry & roll-down PnL tracker (unique)

A standing dashboard, separate from live PnL:

- **Carry per position per day** — coupon accrual minus financing.
- **Roll-down per position per day** — gain from time decay of a positive-sloped curve.
- **Total carry-and-roll P&L MTD / QTD / YTD** — distinct from mark-to-market gains.
- **Carry-adjusted Sharpe** — return per unit DV01 with carry separated.
- **Carry projection** — expected next-30d carry at current curve and positioning.

### Cash-vs-futures basis tracker (unique)

For every active cash–futures pair:

- **Net basis** (BPV-adjusted), **gross basis** (unadjusted), **implied repo**.
- **CTD instrument** and CTD-switch sensitivity (probability of CTD change for ±10bp / ±25bp moves).
- **Conversion factor** for the active CTD.
- **Repo cost** — actual GC and special rates for the cash leg.
- Historical basis distribution with current z-score.

### Roll calendar & roll-cost tracker (unique)

- **Futures expiring** within next 30 / 60 / 90 days, with current open interest split front/back.
- **Roll spreads** — front-back calendar spread quoted in bps, with historical pattern (typical front-month decay vs back-month richening).
- **Accumulated roll cost** per contract YTD (theoretical vs actual realized).
- **Roll algo recommendations** — when to roll given current spread and historical median.

### Repo / funding monitor (unique)

- **GC (general collateral) repo rates** per currency, current vs OIS, with stress flag.
- **Special repo rates** — bonds trading special, with spread to GC and recent direction.
- **Balance-sheet stress indicators** — quarter-end / year-end funding pressure, IOER / RRP usage, SOFR vs OIS spread.
- **FX swap implied funding** — cross-currency basis-implied USD cost.
- Funding inputs feed directly into carry, basis, and ticket pricing — they're not separate systems.

### Auction / event positioning

- **Pre-auction position** for upcoming Treasury supply, by tenor.
- **Pre-FOMC position** — net long/short the rate-cut probability.
- **Pre-CPI position** — direction of inflation-sensitivity.
- **Position-vs-consensus** — is she with the herd or against?

### Hedging surface

- **Hedge ratios** — for cash positions, futures hedge against yield moves.
- **Cross-hedges** — hedging duration with futures vs swaps.
- **Hedge slippage tracker** — cost of imperfect hedges.

### Alerts

See [Alerts](common-tools.md#14-alerts-engine). **Ingrid-specific characteristics:**

- Yield-level, spread-z-score, butterfly-z-score, swap-spread, XCCY-basis, repo-special, auction-tail, CB-speaker headline, surprise-index, and DV01-bucket-limit alerts.

### Trade journal

See [Journal](common-tools.md#15-trade-journal). **Ingrid-specific characteristics:**

- Per trade / theme: thesis, expected catalyst, invalidation, target spread (bps), stop (bps).
- Updated around major events.

### Heatmap

See [Heatmap](common-tools.md#16-heatmap-of-own-book). **Ingrid-specific characteristics:**

- DV01 distribution by tenor / currency.
- P/L attribution by trade theme today.

### Communications

See [Comms](common-tools.md#17-communications-panel). **Ingrid-specific characteristics:**

- Bloomberg chat / Symphony for dealer flow color, axes, indications.
- Internal economist notes attached to upcoming events.

### Latency

See [Latency](common-tools.md#18-latency--connectivity--infra-panel). **Ingrid-specific characteristics:**

- Per-venue latency (CME, Eurex, dealer RFQ platforms) and feed health for OIS / repo / swap data.

### Kill switches

See [Kill](common-tools.md#19-kill-switches-granular). **Ingrid-specific characteristics:**

- **Reduce DV01 to target** — algo-execute over hours.
- **Hedge to neutral** — fastest available hedge applied (futures preferred).
- **Cancel all RFQs and limit orders.**

**Layout principle for Hold:** DV01-bucketed risk panel + curve / spread positions are foveal. Calendar & alerts peripheral.

---

## Phase 4: Learn

Rates post-trade analytics emphasize **regime fit**, **carry-vs-vol decisions**, and **execution quality** (especially for size).

### Replay

See [Replay](common-tools.md#20-replay-tool). **Ingrid-specific characteristics:**

- Curve-state replay alongside tape — scrub the spot/forward/OIS curve at any historical instant.
- Auction- and CB-meeting moments bookmark-able.

### Trade history

See [Trade History](common-tools.md#21-trade-history--blotter-historical). **Ingrid-specific characteristics:**

- Every trade with curve / spread context at entry and exit.
- Tagged by trade type (outright, curve, butterfly, basis, swap-spread).
- Linked to the calendar event that motivated it (if any).

### PnL attribution

See [Attribution](common-tools.md#22-pnl-attribution-multi-axis). **Ingrid-specific characteristics:**

- **Carry vs roll-down vs yield change vs curve change** — passive vs active P/L decomposition.
- **By trade type** — outright vs curve vs butterfly vs basis vs swap-spread.
- **By tenor bucket** — short-end vs belly vs long-end skill.
- **By currency.**
- **By regime** — risk-on / risk-off, hiking / cutting cycle.
- **By event** — FOMC trades, CPI trades, auction trades, payrolls trades.

### Performance

See [Performance](common-tools.md#23-performance-metrics). **Ingrid-specific characteristics:**

- Sharpe, Sortino, Calmar.
- Hit rate by trade type.
- **DV01-adjusted return** — return per unit of DV01 risk taken (rates-specific).
- **Information ratio** vs benchmark (e.g. Bloomberg Treasury Index).
- **Carry capture** — what fraction of available carry was earned.

### Equity curve

See [Equity Curve](common-tools.md#24-equity-curve). **Ingrid-specific characteristics:**

- Carry-and-roll line plotted alongside total P&L line — passive vs active visible together.

### Curve-trade & event-trade analytics (rates-specific)

- **Spread mean-reversion** — when did the spread return to fair after entry?
- **Half-life of curve dislocations** — empirical, by spread.
- **Stop-out frequency vs target hit frequency** — for curve and butterfly trades.
- **Auction trade analytics** — pre-auction vs post-auction P/L by trade; tail size vs subsequent direction; concession sized correctly?
- **FOMC / CPI / NFP trade outcomes** — by surprise direction and surprise magnitude. Was she right on direction? On magnitude?
- **Carry-vs-vol decisions** — trades with positive carry that lost money (vol underpriced?); trades with negative carry that worked (conviction worth the bleed?).

### TCA

See [TCA](common-tools.md#25-execution-quality--tca-transaction-cost-analysis). **Ingrid-specific characteristics:**

- Fill yield vs mid yield at decision time (bps), not price.
- **Dealer scorecard** — RFQ best-quote frequency by dealer, response latency, win rate.
- **Auction primary participation** — competitive vs non-competitive bid outcomes.
- **Roll efficiency** — cost of futures rolls vs theoretical.

### Behavioral

See [Behavioral](common-tools.md#26-behavioral-analytics). **Ingrid-specific characteristics:**

- Pattern detection around CB / auction events: does she hold winners through CPI? Does she add to losers around FOMC?

### Reports

See [Reports](common-tools.md#27-reports). **Ingrid-specific characteristics:**

- Daily P/L commentary with curve / event narrative.
- Weekly portfolio / curve-positioning review.
- Monthly attribution (carry, roll, yield, curve, basis).

### Compliance

See [Compliance](common-tools.md#28-compliance--audit-trail). Standard for rates.

### Tagging

See [Tagging](common-tools.md#29-strategy-tagging-framework). **Ingrid-specific characteristics:**

- Tag dimensions: trade type (outright/curve/fly/basis/swap-spread), tenor bucket, currency, event linkage (FOMC/auction/CPI/etc.), thesis ID.

### Layout

See [Layout](common-tools.md#30-customizable-layout--workspace). **Ingrid-specific characteristics:**

- Saved workspaces per macro regime (e.g. "FOMC week", "CPI day", "auction calendar heavy", "quarter-end funding").

**Layout principle for Learn:** DV01-attributed P/L by trade type / tenor / regime. Event outcomes pattern-matched to skill.

---

## What Ties Ingrid's Terminal Together

1. **Yields, not prices.** The default quote unit is yield (or spread); price is derived. Charts toggle but yield is primary.
2. **Curves are first-class objects.** A yield curve is the chart; spreads and butterflies are the trades.
3. **DV01 is the unit of risk.** $-notional is misleading across tenors; DV01 normalizes.
4. **Calendar dominates.** Auctions, central-bank meetings, data releases drive trade timing more than chart patterns.
5. **Multi-leg native execution.** Curve / butterfly / basis tickets are first-class, atomically executed.
6. **RFQ workflow integrated.** Many rates products trade RFQ; the terminal lives in that flow.
7. **Carry & roll are tracked continuously.** Passive return is half the game.
8. **Cross-market awareness.** Equities, vol, commodities, FX inform rates direction; the terminal carries that context.
9. **Stress scenarios are curve-aware.** Parallel shifts, twists, steepeners, flatteners — pre-computed.
10. **Tenor-bucketed risk and PnL.** Skill is identified by where on the curve she generates alpha.

---

## How to Use This Document

When evaluating any rates / fixed-income terminal (including our own), walk through Ingrid's four phases and ask:

- Are yield curves and spread/butterfly z-scores foveal visualizations?
- Is DV01 the primary unit of risk, with tenor bucketing?
- Is the auction / central-bank / data calendar a first-class planning surface?
- Are curve / butterfly / basis tickets first-class order types with atomic execution?
- Is RFQ workflow integrated, with dealer aggregation and scorecard?
- Are carry & roll tracked alongside mark-to-market PnL?
- Are stress scenarios curve-shaped (parallel, twist, steepener, flattener), not just $-shock?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.

# Automated Mode

This appendix describes Ingrid's terminal and daily workflow once her edge is encoded into models and rules running at scale — what she does, what she sees, and what stays human. The manual sections above describe Ingrid at her desk hand-watching a handful of curve trades and waiting for the next auction. This appendix describes the same Ingrid running 80–150 strategy instances across G10 sovereigns, swaps, and rates futures — with auction days and central-bank meetings still gated by her judgment.

The strategy logic itself (what models, what features, what rules — the actual alpha) is out of scope. This appendix is about **the terminal she works in**: every surface she sees, every panel, every decision she makes, every workflow that supports her.

For the universal automated-trading platform concepts this builds on, see [automation-foundation.md](automation-foundation.md). For the structural template, see [automation-archetype-template.md](automation-archetype-template.md). For the heavily-automatable worked example, see [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md).

Ingrid is in the **partially-automatable** tier. Her edge — relative-value curve / butterfly / basis trades, swap-spread mean-reversion, repo-special detection, auction-concession capture, RV-model-driven sizing — translates well into rules and models when the regime is calm. Auction-day judgment, FOMC / ECB / BoE / BoJ interpretation, and geopolitical-event reaction stay human and override the systematic book. With automation, her coverage scales from a handful of hand-managed positions to a DV01-bucketed fleet across USD / EUR / GBP / JPY rates products, running continuously, with her acting as the curve-strategy portfolio manager and the human override on the calendar's biggest moments.

> _Throughout this appendix, examples are illustrative — actual venue lists, strategy IDs, dataset names, feature names, and metrics shown are sample shapes to make the surfaces concrete. The platform's real catalog will differ._

## 1. What Ingrid's Edge Becomes

Her manual edge encoded as automated **strategy classes**, each spawning many **strategy instances** across currencies, tenor pairs, and parameter profiles. Discretion stays on top of the systematic book; auction days and CB meeting days are gated.

- **Curve steepener / flattener strategies.** Per currency × per tenor pair (2s5s, 2s10s, 5s10s, 5s30s, 10s30s) — DV01-balanced, atomic execution, entry on z-score extremes vs configurable lookback windows (1m / 3m / 1y / 5y), exit on mean-reversion or stop. Regime-gated on the front-end (Fed expectation regime) and the back-end (term-premium regime). Dozens of instances across the G10 curve.
- **Butterfly strategies.** 2s5s10s, 5s10s30s, 2s10s30s — DV01-balanced or 50/50-wing, z-score-driven entries, fit-residual gates. Per currency. Faster mean-reversion than outright steepeners; many instances at small DV01 each.
- **Basis-trade strategies.** Cash–futures basis (with CTD-switch awareness), swap–bond asset-swap basis, invoice spreads (futures-implied yield vs swap). Atomic two-leg execution; live tracking of net basis, gross basis, implied repo. Per benchmark tenor per currency.
- **Swap-spread mean-reversion strategies.** Treasury yield minus same-tenor swap, across the curve. Z-score-driven entries; balance-sheet-stress regime gating (quarter-end, year-end, IOER / RRP stress). Per tenor per currency.
- **RV-model-driven outright strategies.** Model-implied fair value of a tenor (PCA, Nelson-Siegel, regression on macro factors) vs market; trade the residual when statistically significant. Per benchmark tenor.
- **Auction-concession strategies.** Pre-auction cheapening models — what the curve typically does in the 24/48h ahead of a Treasury / DMO auction at this tenor, conditioned on dealer positioning, supply size, and regime. Position takes the concession; flattens before auction-results minute. **Auction-day judgment overrides** if Ingrid disagrees with the model's read of the day.
- **Repo-special detection strategies.** Detect bonds trading rich in repo (special) and either fade the cash richness (long the swap, short the cash) or harvest the repo specialness (long the cash, finance specially). Per currency, with daily repo screen.
- **Cross-curve relative-value strategies.** UST vs Bund 10y, UST vs Gilt 10y, UST vs JGB 10y — z-scored vs macro factors (DXY, equity vol, growth differential). Slow-moving, DV01-balanced cross-currency carry-aware entries.
- **Cross-currency basis strategies.** XCCY basis (EURUSD, USDJPY, GBPUSD) — when the basis dislocates from the funding-cost-implied level, fade. Quarter-end / year-end aware.
- **Roll strategies.** Calendar-spread roll execution as a strategy class — when to roll a CME UST future from front to back, given the historical front-back decay pattern and the current calendar spread vs that pattern. Mechanical; saves Ingrid the calendar-watching.
- **OIS-curve regime-aware overlay strategies.** When the OIS-implied policy path diverges from explicit central-bank guidance, take the side of the guidance with calibrated sizing. Pauses around CB meeting blackouts.
- **Inflation-breakeven strategies.** Long / short the breakeven (TIPS vs nominal) on regime-conditional signals (oil pass-through, surveys, recent CPI surprise distribution). Per benchmark tenor.

Each strategy class has 5–25 live instances at any time (different tenor pairs, currencies, horizons, parameter profiles). Total fleet: ~100–150 strategies, scaling to ~200 as new RV niches are discovered and old alpha decayed.

Ingrid's day is no longer "click into the next 5s30s flattener and watch the spread." It is "make sure the firm's DV01 is correctly distributed across the curve and across G10, supervise for decay, retire what's broken, and **be ready to override the systematic book on auction days and CB meeting days**." The terminal must support this scale-up while preserving her ability to intervene with full curve-trade-native manual capability when the calendar demands.

## 2. What Stays Ingrid

The platform automates execution and signal-generation across the curve. What stays her:

- **Auction-day judgment.** The model reads the historical concession pattern; Ingrid reads the room. Primary-dealer positioning shifts in the last hour, an unexpected Treasury refunding-statement nuance, a surprise WI move, a geopolitical headline two hours before deadline — these are the moments where her interpretation overrides the systematic auction-concession book. She decides to enter the auction long-the-tail, short-the-tail, or flat. The platform's job is to surface positioning, calendar context, and dealer intel; her job is to decide.
- **Central-bank meeting interpretation.** FOMC / ECB / BoE / BoJ statements and press conferences are language-rich and tone-rich. Implied rate paths reprice in the first 90 seconds. Ingrid's read of "patient" vs "data-dependent" vs "soon" — and Powell / Lagarde / Bailey / Ueda body-language tells — moves the curve before any model has a chance. The systematic book pauses across CB blackout windows (configured per CB); Ingrid trades the meeting manually with full curve-trade-native tickets.
- **Geopolitical-event reaction.** A surprise China stimulus headline, a Middle East escalation, a US-China tariff escalation, a sovereign credit downgrade, a peripheral-spread blowout — Ingrid's first-90-seconds read of "risk-off bid for govt bonds" vs "stagflationary supply shock" beats any pre-coded response. Her role is rapid triage; the platform's role is to make triage actionable (one-click pause-by-tenor-bucket, one-click hedge-to-DV01-neutral, etc.).
- **Forward-guidance language interpretation.** When a CB shifts the language of its statement ("for some time" → "for a period"; "data-dependent" → "patient"), the second-order curve implications are non-mechanical. The model registry's CB-language NLP classifier is a **support tool**, not the decision; Ingrid reads the diff against prior statements and decides on portfolio impact.
- **Cross-asset chain interpretation.** A risk-off equity move with credit spreads widening and dollar bid is a different trade from a risk-off equity move with credit spreads tight and gold bid. Rates trade differently across these chains; Ingrid reads which chain is operative and confirms / overrides the systematic regime classifier.
- **Counterparty / CCP risk decisions.** Adding a new bilateral counterparty for swaps, sizing exposure under stress at a CCP showing strain, evaluating a new dealer's RFQ panel access, pulling capital from a venue under regulatory pressure — all human.
- **Catastrophe response.** A flash-crash in Treasuries (Oct 2014 style), a dealer balance-sheet pull, a CCP margin call cascade, a peripheral-debt redenomination scare, a sovereign downgrade out-of-cycle. The first 60 seconds of judgment beat any pre-coded response. Ingrid's role is rapid triage; the platform's job is to surface state (cross-CCP exposure, per-tenor DV01, per-currency exposure) and make her interventions one-click.
- **Strategic capital allocation across the curve.** The allocation engine proposes; Ingrid approves or modifies. Material reallocations (more DV01 to the back-end at expense of the front-end; more to swap-spread vs more to outright steepeners) are decisions, not optimizations.
- **Cross-domain coordination with Yuki.** When Ingrid's curve trades carry FX exposure (a USD-funded long bund position) or when Yuki's carry-trade unwinds will move the front-end, capacity and timing are negotiated across desks.
- **New strategy invention.** "I noticed the swap-spread regime broke after the SLR exemption rolled off; let me model that." Idea origination is human; the platform makes it cheap to test.

The platform is opinionated about what to automate and humble about what cannot be. Ingrid's judgment surfaces — auction days, CB days, geopolitical events — are made higher-leverage by automation, not bypassed. The systematic book runs underneath; her judgment runs on top.

## 3. The Data Layer for Ingrid

The data layer is the substrate of everything Ingrid does in automated mode. Rates research depends on long, clean histories — sovereign yield archives back to the 1980s, swap-curve archives going back as far as licensable data permits, auction histories from issuing-DMO publications, primary-dealer surveys, and a continuously-fed live-tick layer for repo / SOFR / €STR / SONIA / TONA / OIS / cash bonds / futures. Without a serious data layer, no model is reliable, no curve is reproducible, no auction-concession backtest is honest.

### 3.1 The Data Catalog Browser

Ingrid's home page when she opens the data layer is the catalog browser. A searchable, filterable list of every dataset the firm has, scoped to what's relevant for rates work.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters: data type (sovereign yields / swap curves / OIS / repo / auction history / primary-dealer survey / dealer positioning / inflation linkers / economic releases / CB statements / cross-currency basis); cadence (real-time tick / 1-min / 1-hour / EOD / static); license tier (premium / standard / public); cost band (free / sub-$10k / $10k–$100k / $100k–$1M / $1M+); coverage (per currency, per tenor range, per instrument family).
- **Main panel** — table of datasets matching filters. Columns: name, source / vendor, coverage summary (e.g. "UST cash + futures, 1985–present, all benchmark tenors"), cadence, freshness indicator (green / amber / red — staleness vs SLA), license terms (e.g. "redistributable: no; client-report-safe: yes; firm-internal-only"), annual cost, owner, last-updated.
- **Right pane** — when a dataset is selected: full description, schema, sample rows, lineage graph (where it comes from upstream, what consumes it downstream), quality history, license document link, procurement notes, "click to add to a notebook" button.

**Search** — free-text across names + descriptions + schema fields. "fred 10y" jumps to the FRED constant-maturity Treasury series; "bundesbank zero-coupon" finds the Bundesbank-published German government bond zero-coupon archive.

**Quick actions** — bookmark a dataset, request access to a restricted dataset, propose a procurement evaluation, flag an issue.

### 3.2 Ingrid's Core Datasets (Illustrative)

A senior rates trader's data footprint at a top-5 firm spans dozens of feeds. Examples of what Ingrid's catalog tier likely contains — the actual platform's catalog will differ.

- **Sovereign yield archives.** FRED constant-maturity Treasury series; Bundesbank zero-coupon and par-yield curves (German government); BoE gilt yield archive; BoJ JGB yield archive; Banque de France OATs; Banca d'Italia BTPs; standardized par / zero-coupon curves harmonized across issuers.
- **Swap-curve archives.** Bloomberg ICVS swap curves; Tradeweb swap-curve archive; LCH / CME / Eurex cleared-swap reference curves; OIS curves per currency (SOFR-OIS, €STR-OIS, SONIA-OIS, TONA-OIS); historical swap-spread archives.
- **Auction histories.** US Treasury auction-results history (size, bid-to-cover, indirect / direct / dealer share, stop-out yield, WI yield, tail, allotment); UK DMO Gilt auction history; German Bundesbank Bund auction history; French AFT OAT auction history; JGB auction-results archive.
- **Primary-dealer position surveys.** CFTC Treasury futures positioning (Commitment of Traders, all reports); NY Fed primary-dealer survey (weekly positioning by tenor bucket); FR 2046 / FR 2050 dealer transaction reports; ECB SPF positioning; BoE Gilt-Edged Market Maker (GEMM) positioning where published.
- **Repo / funding-rate archives.** SOFR tick / EOD; €STR tick / EOD; SONIA tick / EOD; TONA EOD; GC repo rates per currency; bilateral repo rates; FICC GCF Repo Index; BNY Tri-party repo index; bond-special repo rates.
- **Inflation-linker archives.** TIPS yield archive; EUR HICP linker (BTP-€i, OAT-€i, Bund-€i) yields; Gilt linker yields; JGB inflation-linked yields; breakeven archives derived; inflation-swap quotes (USD CPI, EUR HICP).
- **Cross-currency basis archives.** EURUSD, USDJPY, GBPUSD, AUDUSD basis tenors (3m, 6m, 1y, 5y, 10y); FX-swap-implied USD funding cost; year-end / quarter-end basis dislocation history.
- **Economic release calendars + outcomes.** CPI, PCE, NFP, GDP, retail sales, ISM, PMI, claims — per country, with consensus, prior, whisper, surprise indices (Citi / Bloomberg).
- **Central bank statements / minutes / press conferences.** Full text archive (FOMC, ECB, BoE, BoJ, BoC, RBA, RBNZ, SNB, Riksbank, Norges Bank), with diff-tracking against prior versions; speaker calendars and speech transcripts; FOMC dot-plot history.
- **Sell-side rates research.** Morning notes from each covering dealer; trade-idea archive with outcomes attached; rates-strategist commentary corpus.
- **Dealer-flow color (where compliance permits).** Inferred dealer flow from RFQ-decline patterns; aggregated client-flow color from the firm's own RFQ activity (without identifying counterparties beyond compliance limits).
- **Issuance calendar / refunding statements.** Treasury Quarterly Refunding Statement archives; DMO funding remits; ECB issuance calendars; per-issuer auction announcement histories.
- **Corporate / SSA issuance windows.** Investment-grade corporate issuance tape (relevant for swap-spread flow), SSA new-issue calendar, associated swap-payer / receiver demand patterns.

Each dataset's record in the catalog shows: license terms, cost, coverage, freshness, lineage, used-by (which features and strategies depend on it), incident history.

### 3.3 Data Quality Monitoring

Every live dataset has continuous quality monitoring. Ingrid sees this as a heatmap on her catalog, with a dedicated **Quality Console** for deeper investigation.

**Per-dataset quality dimensions:**

- **Freshness** — time since last update vs SLA. Color-coded.
- **Completeness** — null rate per field, gap detection across time series.
- **Schema stability** — has the source's schema changed? Field added / removed / typed differently? Critical for Bloomberg ICVS-style curves where ticker conventions can shift.
- **Distribution drift** — has the statistical distribution of values shifted recently? Catches a broken feed early — a vendor accidentally publishing stale curve points, a curve construction with a missing tenor, a yield series suddenly clamped at zero.
- **Cross-source consistency** — when multiple sources report on the same underlying (e.g. Bloomberg vs Tradeweb vs LCH on the same swap tenor), do they agree within a basis-point tolerance? Disagreement flags.
- **Rates-specific checks** — yield curve monotonicity within a curve construction (par-curve sanity); breakeven non-negativity (TIPS vs nominal sanity); swap spreads within historical bounds (an implausibly large jump triggers a check).
- **Cost / volume** — query volume against quota, $ spent month-to-date, projected cost for queued workloads.

When something degrades, the dataset's owner is paged (data-engineering team or vendor-management), not Ingrid directly. Ingrid sees the impact: which of her strategies depend on this dataset, what's their state, should she intervene.

### 3.4 Lineage Navigator

Every dataset has an upstream lineage (where the data comes from) and a downstream lineage (which features and strategies consume it). The lineage navigator is a graph view Ingrid opens when:

- A strategy is misbehaving and she wants to trace back to the source data — was the swap-curve point used in last night's signal a clean Tradeweb print or a Bloomberg fallback?
- A vendor announces a feed change and she wants to see impact scope — Bloomberg renaming a curve identifier; an auction-results feed format change.
- A feature is being deprecated and she wants to confirm no strategy depends on it transitively.

**The graph:**

- Nodes are datasets, features, models, strategies.
- Edges are dependencies (a feature consumes a dataset, a model consumes features, a strategy consumes a model).
- Color-coded by health (live / degraded / failed).
- Click any node to open its detail page; right-click for "show all downstream" or "show all upstream."

This is a power-user tool used during diagnostic work, not constantly.

### 3.5 Procurement Dashboard

Data licenses are a major P&L line item; a senior trader is expected to be sharp on cost-vs-attribution. The procurement dashboard:

- **Active licenses** — every paid feed with annual cost, renewal date, contract terms, owner of the renewal decision. Bloomberg terminals, Tradeweb data licenses, ICAP / Tullett broker feeds, BrokerTec / eSpeed cash-Treasury feeds, MTS / Eurex futures feeds.
- **Trial / evaluation feeds** — ones currently being POC'd with deadlines and evaluation criteria (e.g. a new repo-data vendor, a new dealer-positioning aggregator).
- **Wishlist** — feeds Ingrid or her peers have flagged as "want," with rationale and expected uplift.
- **Cost attribution** — for each licensed feed, a rough P/L attribution: which strategies depend on it, and how much P/L those strategies have generated. Crude but useful.
- **Renewal calendar** — what's coming up for renegotiation, with auto-prompt to review usage + attribution before signing.
- **Decision log** — past procurement decisions with rationale, useful for institutional memory.

Ingrid contributes to procurement decisions especially around rates-native feeds (a new repo-data provider, a new dealer-flow color aggregator, a new inflation-swap quote provider). Major procurements (>$500k/year) escalate to David / firm-level.

### 3.6 Gap Analysis Surface

The most underrated data-layer surface. The platform identifies gaps:

- **Universe coverage** — Ingrid's strategies trade ~30 benchmark tenors × 4 currencies; the catalog tells her which ones are not fully covered (e.g. JGB 40y intra-day prints from a non-ICAP vendor).
- **Feature gaps** — features in the library that depend on missing or stale data, blocked from production deployment (e.g. a real-time primary-dealer-position feature blocked because the highest-frequency dealer survey is weekly).
- **Competitor signals** — based on industry intel and feature-attribution gaps in her own backtests, the platform suggests "feeds your competitors likely have that we don't" (e.g. a real-time central-counterparty utilization feed; a higher-frequency repo-special tracker).
- **Backfill gaps** — historical data missing for certain periods, which would block walk-forward backtesting on those periods (e.g. SOFR pre-2018 — pre-publication; €STR pre-2019; bundesbank zero-coupon construction methodology change in the early 2000s).

Gap analysis is not aspirational — it's tied to concrete strategies that can't be deployed or features that can't be computed. Closing a gap is a procurement decision with a defined ROI estimate.

### 3.7 Interactions Ingrid has with the data layer

Concrete daily / weekly / monthly:

- **Daily (background):** quality monitor in peripheral; auto-alerts for degradation. Ingrid glances at the catalog occasionally during research. On auction days, she explicitly checks the auction-results feed health pre-deadline.
- **Weekly:** procurement / wishlist review; reading data-team release notes (new datasets onboarded, schema changes); reviewing the latest CFTC Commitment of Traders + NY Fed primary-dealer survey when published.
- **Monthly:** cost / attribution review; renewal-decision triage; gap-analysis review with the data team.
- **Ad hoc (during research):** querying the catalog when starting a new strategy idea — what data do I have to test this?
- **Ad hoc (during a strategy issue):** lineage navigator from the misbehaving strategy back to source data.
- **Ad hoc (during an incident):** when a curve-construction vendor degrades, the impact-scope view tells Ingrid exactly which strategies are at risk and what to pause.

### 3.8 Why this matters for efficiency, risk, and PnL

- **Efficiency:** Ingrid does not waste hours reconstructing a swap-spread time series from disparate sources. The catalog holds the canonical version, lineage-tracked. Every feature she builds is reusable; the next strategy starts ahead of where the last one ended.
- **Risk:** quality monitoring catches feed degradation before P/L does. A stale Bundesbank curve point that drifts a 5s30s flattener's signal toward false-entry is caught by the cross-source-consistency check, not by Ingrid's daily P/L surprise. Lineage navigation makes incident triage minutes-fast instead of hours-slow.
- **PnL:** procurement decisions are evidence-driven. Ingrid does not pay $300k/year for a feed her strategies don't use; she does aggressively license a $150k/year repo-special feed that opens an alpha class worth $3M/year. Gap analysis surfaces uncaptured alpha in licensable form.

## 4. The Feature Library for Ingrid

A feature is the unit of alpha-vocabulary. Features are engineered transformations of raw data — yield-spread z-scores, butterfly fit-residuals, swap-spread regimes, breakeven-realized-vs-survey gaps — that models and rules consume. The feature library is where Ingrid spends much of her research time, because feature engineering is where domain expertise meets ML.

The library is shared across the firm; features Ingrid builds are visible to Yuki, Theo, Quinn, and others (with appropriate permissions). Likewise, Ingrid consumes features built by other desks where they apply to rates. Cross-pollination is a real value — Yuki's carry-trade-unwind-pressure feature might inform an Ingrid strategy around quarter-end basis dislocation, for instance.

### 4.1 The Feature Library Browser

Ingrid's home page when she opens the feature layer.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters: domain (curve-shape / butterfly / basis / swap-spread / repo / auction / CB-policy / cross-currency / inflation / regime); cadence (tick / 1-min / 1-hour / EOD); compute cost (cheap / moderate / expensive — flagged for budget-aware research); used-by-strategy (which features feed a live strategy I care about); owner / desk; quality tier (production-grade / beta / experimental); freshness (live / stale / failed).
- **Main panel** — table of features matching filters. Columns: name, version, owner, description (one line), inputs (upstream features and datasets, summarized), distribution-state indicator (in-distribution / drifting / failed), used-by count, last-modified, performance proxy (median Sharpe of strategies using it — rough but useful for prioritizing research).
- **Right pane** — when a feature is selected: full description, code link, lineage graph, distribution monitor (rolling histogram + comparison to training distribution + drift score), incident history, "show me strategies using this feature" link, "test this feature in a notebook" button.

**Search** — free-text across names, descriptions, code. "swap spread z" finds variants across tenors and currencies; "butterfly residual" finds Ingrid's PCA-decomposed butterfly features.

**Quick actions** — bookmark a feature, fork a feature into a personal experimental version, propose a new feature, flag drift.

### 4.2 Ingrid's Core Features (Illustrative)

Examples of features Ingrid has built or consumes — actual library will differ.

**Curve-shape:**

- `curve_slope_2s10s_zscore_usd_1y` — 2s10s slope, z-scored against rolling 1y distribution. Variants per currency (eur, gbp, jpy) and per lookback (1m / 3m / 1y / 5y).
- `curve_slope_5s30s_zscore_per_currency` — long-end slope variants.
- `curve_curvature_2s5s10s_zscore` — 50/50-wing butterfly z-score.
- `curve_pca_factor_loadings` — level / slope / curvature factor loadings from rolling PCA (per currency); the residual is the orthogonal alpha.
- `nelson_siegel_fit_residual` — point-by-point residual from a rolling Nelson-Siegel fit, identifying rich / cheap tenors.

**Butterfly:**

- `butterfly_2s5s10s_fit_residual_zscore` — fit-residual against a long-window regression model, z-scored.
- `butterfly_50_50_wing_zscore_per_tenor` — alternative weighting; per-currency.
- `butterfly_term_structure` — rolling distribution of butterfly z-scores across the curve simultaneously.

**Basis:**

- `cash_futures_basis_bps_per_tenor` — net basis, with CTD-adjusted conversion factor.
- `gross_basis_zscore_per_tenor` — gross basis vs rolling distribution.
- `implied_repo_per_tenor` — futures-implied repo rate vs realized GC.
- `ctd_switch_probability` — model-output probability that CTD changes for ±10bp / ±25bp moves.
- `swap_spread_zscore_per_tenor_per_currency` — swap-yield minus same-tenor sovereign, z-scored.
- `asset_swap_spread_zscore` — bond YTM vs swap, per benchmark.
- `invoice_spread_zscore` — futures-implied yield vs swap.

**Repo / funding:**

- `repo_special_zscore_per_bond` — bond-specific repo rate vs GC, z-scored.
- `gc_repo_vs_ois_spread` — funding-stress regime indicator.
- `quarter_end_proximity_indicator` — days-to-quarter-end, with regime tag for balance-sheet stress.
- `xccy_basis_zscore_per_pair_per_tenor` — cross-currency basis vs distribution.

**Auction-driven:**

- `auction_concession_size_realized` — pre-auction yield change at the issuing tenor in the 24h / 48h ahead, vs historical median.
- `auction_tail_size_realized` — stop-out vs WI at deadline, by auction.
- `auction_concession_residual_vs_model` — concession vs the model's expected concession given supply / dealer positioning / regime.
- `dealer_position_zscore_per_tenor_bucket` — primary-dealer net position (NY Fed / CFTC) vs rolling distribution.
- `wi_grey_market_drift` — WI yield change in the pre-deadline window.

**Central-bank-driven:**

- `fomc_dot_plot_drift` — implied dot-plot path vs market-implied OIS path, in bps per meeting.
- `cb_statement_language_diff_score` — NLP-derived diff between current and prior CB statement, with hawk / dove magnitude.
- `cb_meeting_proximity_indicator` — days-to-meeting per CB, with blackout flags for systematic strategies.
- `oi_in_sofr_futures_zscore` — open-interest in SOFR futures by contract month, z-scored — proxy for positioning into next FOMC.
- `terminal_rate_implied_path_drift` — change in implied terminal rate across meetings.

**Inflation:**

- `breakeven_zscore_per_tenor` — TIPS-implied breakeven vs rolling distribution, regime-tagged.
- `breakeven_vs_oil_residual` — breakeven minus oil-pass-through-implied breakeven.
- `breakeven_vs_survey_gap` — market breakeven minus University of Michigan / NY Fed inflation expectation.
- `realized_vs_implied_inflation_gap` — recent realized CPI annualized vs market breakeven.

**Regime indicators:**

- `rates_vol_regime_per_currency` — composite (MOVE-equivalent + swaption-IV + realized-vol), categorical.
- `liquidity_regime_per_tenor_bucket` — depth + spread proxy, categorical.
- `risk_on_off_regime` — composite of equity vol + credit spreads + DXY direction; gating signal.
- `policy_regime_per_cb` — hiking / cutting / hold cycle classifier, with confidence.
- `funding_stress_regime` — quarter-end / year-end / SOFR-OIS / repo-special composite.

**Cross-asset / macro:**

- `dxy_rates_correlation_30d` — rolling correlation between DXY and US 10y, regime indicator.
- `equity_rates_correlation_30d` — SPX vs UST 10y correlation, regime indicator.
- `credit_spread_regime` — IG / HY / EM credit spread composite for risk-on / risk-off context.
- `growth_differential_g10` — composite growth-surprise differential between currency regions.

These features form Ingrid's reusable vocabulary. A new strategy she builds picks from this library and combines them. She builds new features when the existing vocabulary doesn't capture an idea (e.g. a new CB-statement-similarity-to-pre-pivot-meetings feature when a new FOMC pivot looks possible).

### 4.3 Feature Engineering Surface

Building a new feature is itself a workflow. The platform supports it inline in the research workspace (next section) but also exposes a structured form for the publication step.

**The workflow:**

1. **Idea phase (notebook):** Ingrid writes the feature definition in Python in her notebook, tests it on real historical data, inspects shape / distribution / sample values.
2. **Quality gates:** before publishing, the platform runs automated checks — null rate within threshold, outlier rate within threshold, schema validation, computability across the universe of instruments / tenors the feature claims to cover.
3. **Metadata extraction:** the platform auto-generates metadata — lineage (extracted from the code, traced to upstream features and datasets), distribution baseline (computed on full backfill), compute cost (benchmarked across a sample), update cadence (declared by Ingrid, validated against the upstream).
4. **Code review:** required for live-trading features (production-grade tier). A peer or Quinn's team reviews the code; suggestions inline.
5. **Publication:** the feature gets a canonical name, a version (semantic + content hash), and is registered. Now usable by any strategy.
6. **Backfill:** the feature is computed across history (parallelized on the firm's compute), so old strategies can be retrained with it. Rates feature backfills are often long — 20+ years of curve history is common.
7. **Live deployment:** the feature is now computable on demand at its declared cadence; live strategies can subscribe.

**The form (schema-style UI):**

- Name (canonical, with strict naming convention).
- Description (one paragraph; what the feature captures and when it's useful).
- Owner.
- Inputs (selected from existing features / datasets, or declared as new dependencies).
- Code (link to repository commit; review status).
- Cadence and freshness SLA.
- Universe (which tenors / currencies it applies to; can be parametric).
- Tags (taxonomy).
- Documentation notes (regimes where it's known to break — e.g. "swap-spread features unreliable during balance-sheet stress windows; gate appropriately").

### 4.4 The Drift Dashboard

Live features drift; some quietly, some violently. Ingrid's drift dashboard surfaces the worst offenders.

**Layout:**

- **Top panel** — feature drift heatmap: features (rows) × time (columns), cells colored by drift score. Sortable by current drift, by trend, by impact (downstream P/L at risk).
- **Triage queue** — top features needing action: drifted significantly, with their downstream strategies listed. Rates-specific examples: a swap-spread feature drifting because the SLR exemption rolled off and the dealer-balance-sheet regime structurally shifted; a basis feature drifting because a futures contract's CTD pool changed.
- **Detail pane** — for a selected feature, the time series of its distribution drift, the downstream models / strategies affected, and suggested actions (retrain affected models, recalibrate the feature, deprecate it).
- **Acknowledgments log** — drifts Ingrid has reviewed and explicitly accepted (because she understands the regime cause), with reason logged.

This is one of the most-checked surfaces during diagnostic work. A misbehaving strategy → drift dashboard for its features → identify the broken upstream → decide on retrain / recalibrate / pause.

### 4.5 Cross-Pollination View

Features built by other desks that might apply to Ingrid's domain.

**Suggested-similar widget** — when Ingrid opens a feature, a sidebar shows features built by other desks with similar inputs or similar tags. "Yuki's carry-trade-unwind-pressure feature uses cross-currency-basis inputs you might apply to your swap-spread strategies during quarter-end."

**Trending features across desks** — what's being built / used most across the firm right now. Often a leading indicator of where alpha is being found.

**Feature-of-the-week** — a curated highlight from another desk; a cheap way to keep current with cross-desk research.

This surface is light-touch; not foveal but useful background.

### 4.6 Interactions Ingrid has with the feature library

- **Daily (background):** drift dashboard glance during morning fleet review; alerts route to her for features feeding her amber / red strategies.
- **Weekly:** browse cross-pollination view; identify candidate cross-desk features to evaluate.
- **Ad hoc (during research):** browse + search for features matching a thesis; often the first move on a new strategy idea is "what features are already in the library that test this?"
- **Ad hoc (during feature engineering):** the engineering surface, primarily in the notebook with the publication form for the formal step.
- **Ad hoc (during retire):** when a feature is being deprecated (perhaps because its upstream data is being delicensed, or because its underlying regime no longer applies), Ingrid reviews downstream impact and decides on replacement.

### 4.7 Why this matters

- **Efficiency:** Ingrid does not rebuild "swap-spread z-score on USD 10y" 14 times in 14 different notebooks. She picks it from the library, parameterizes if needed, and builds on it. Time-to-strategy-prototype drops from days to hours.
- **Risk:** drift is monitored continuously. A model trained on one regime breaks silently when its features shift; the dashboard catches this before P/L does. Per-feature versioning means retraining doesn't accidentally use a different feature definition than the original training run.
- **PnL:** features are reused across strategies. A high-quality feature (Sharpe-uplift positive across many strategies) generates compounding return. Cross-pollination across desks accelerates discovery — Yuki's FX-funding features inform Ingrid's swap-spread research; Theo's macro-growth features inform Ingrid's regime classifiers.

## 5. The Research Workspace

The research workspace is where Ingrid turns raw data and features into validated curve / butterfly / basis / swap-spread strategies. It is her primary working surface during research-heavy hours — which, in automated mode, is most non-event days.

### 5.1 Notebook Environment

The workspace is notebook-first (Jupyter-style) with a full IDE option for traders who prefer that mode.

**Layout (sketch):**

- **Left sidebar** — file tree (Ingrid's notebooks, shared workspaces, scratch); platform integrations (data layer search, feature library search, model registry browse, experiment tracker, strategy templates); kernel state.
- **Main panel** — the active notebook (cells: code, markdown, output). Standard Jupyter UX with platform extensions.
- **Right sidebar** — context panel (depends on what the cell is doing): for a curve-data query, shows the curve metadata + sample points + visual curve sketch; for a feature reference, shows feature metadata + drift state; for a backtest run, shows results streaming in.
- **Bottom panel** — terminal / cell output / experiment-tracker auto-log of this notebook's runs.

**Critical platform integrations:**

- **One-line curve / yield data access.** `yields = data.load("ust.par_curve.eod", since="2010-01-01")` returns a curve panel with tenors as columns; `swaps = data.load("usd.sofr_swap.eod", since="2018-01-01")` returns the OIS swap-curve panel.
- **One-line feature retrieval.** `swap_spread_z = features.get("swap_spread_zscore_per_tenor_per_currency", currency="USD", tenor="10Y", since="2015-01-01")`.
- **One-line model loading.** `model = models.get("ingrid.curve_steepener_lgbm_usd_2s10s", version="3.2.0")`.
- **One-line backtest.** `result = backtest(strategy=my_strategy, data=hist, period="2015-01-01:2024-06-30")`.
- **One-line plotting.** Platform helpers for equity curves, drawdown shading, attribution decomposition, **3D curve-evolution surface plots**, butterfly fit-residual plots, swap-spread time series with regime shading.
- **Curve-aware plotting helpers.** A `plot_curve_atlas(yields, dates=[d1, d2, d3])` helper renders multiple curves overlaid as in Ingrid's manual workspace; `plot_butterfly(curve, wings=("2y","10y"), belly="5y")` renders the live + historical butterfly.
- **One-line experiment registration.** Backtests and training runs auto-register in the experiment tracker; Ingrid can annotate inline.

**Compute attached to the kernel:**

- The kernel runs on research compute, not Ingrid's laptop. Curve archives back to 1985 don't matter; GPU is available when needed; her machine doesn't melt under a hyperparameter sweep.
- CPU / RAM / GPU allocation visible inline; switch tier with a one-click upgrade (with cost preview).

**Persistence and collaboration:**

- Notebooks persist per user.
- Shared workspaces for desk collaboration (Ingrid + Yuki working together on a quarter-end XCCY-basis-vs-swap-spread joint trade prototype).
- Real-time collaboration (Google-Docs-style) for paired research.
- Version control native: every save is committed.

### 5.2 Backtest Engine UI

The single most-used surface in the research workspace.

**Layout when running a backtest:**

- **Form panel** — strategy selector (a saved composition or notebook-defined), data window, instruments / tenors / currencies, venues, parameter overrides, **execution model parameters** (RFQ-response-rate model, dealer-fade model, per-venue slippage curve, fee schedule, latency model, multi-leg-atomicity assumptions).
- **Live progress** — "12.4 of 20.0 years simulated, 62% complete, ETA 3 min." Cancel button.
- **Streaming results** — equity curve building bar by bar, slippage attribution, recent fills tape. Ingrid can watch backtest behavior unfold or close the tab and check back.
- **Final results page (when complete):**
  - Summary metrics — Sharpe, Sortino, Calmar, max drawdown, hit rate, expected shortfall, **DV01-adjusted return**, capacity estimate.
  - Equity curve with drawdown shading; benchmark overlay (Bloomberg Treasury Index for outright-leaning strategies).
  - Per-trade attribution histogram.
  - **Carry / roll / yield / curve / spread P&L decomposition** as the default attribution view (matches Ingrid's live PnL decomposition).
  - Slippage breakdown — assumed vs realized, by venue / RFQ-platform, by size bucket.
  - **Regime-conditional performance** — Sharpe in vol-high vs vol-low; in hiking vs cutting vs hold cycles; in pre-FOMC vs post-FOMC; in pre-auction vs post-auction; in quarter-end vs non-quarter-end.
  - **Auction-adjacent performance** — performance in the 48h before and after auction days, with auction-tail-conditional buckets.
  - Sensitivity analysis — parameter perturbation effect on Sharpe (small perturbations should not catastrophically change result).
  - Robustness checks — out-of-sample, walk-forward, bootstrap CI on Sharpe.
  - Auto-flagged warnings — lookahead detected; survivorship bias risk (e.g. only-CTD-bonds-included); in-sample tuning detected; regime over-fit (e.g. trained only on post-2018 SOFR regime, will break in pre-2018 LIBOR regime — flagged).

**Realistic execution simulation is mandatory.** RFQ workflow modeled with dealer-response distributions; CME / Eurex / ICE futures fills modeled with depth-conditional slippage; cleared-swap execution modeled with CCP-margin-aware sizing; **multi-leg atomicity preserved** (curve / butterfly / basis trades simulated as atomic; partial-fill reconciliation modeled). The same execution code runs in live trading as in backtest — divergence between paper and live is rare and investigated.

### 5.3 Walk-Forward Visualization

Walk-forward backtest is the default; the visualization is critical for honest evaluation. Rates regimes shift over years (pre-GFC → post-GFC → post-Covid → post-pivot); walk-forward catches strategies overfit to one regime.

**Layout:**

- **Top:** equity curve broken into training-window and test-window segments, color-coded.
- **Middle:** Sharpe per test window with confidence interval bars. Test windows aligned with regime boundaries where possible (pre-GFC / GFC / post-GFC / Covid / post-Covid).
- **Bottom:** parameter-stability check — were the parameters consistent across rolling windows, or did they jitter (sign of overfitting to training).
- **Side:** out-of-sample Sharpe summary, in-sample Sharpe summary, generalization gap.

If the in-sample Sharpe is 2.5 and the out-of-sample is 0.5, the model is overfit; the visualization makes this stark.

### 5.4 Strategy Template Library

A library of pre-built strategy compositions Ingrid starts from. Reduces time-to-first-strategy from days to hours.

**Examples (illustrative, rates-specific):**

- **Curve steepener / flattener template.** DV01-balanced two-leg trade, parameterized by tenor pair, currency, z-score entry / exit thresholds, lookback window, regime gates (CB cycle, vol regime, quarter-end blackout), max DV01, atomic-execution policy.
- **Butterfly template.** Three-leg DV01- or 50/50-balanced, parameterized by wings + belly, currency, z-score thresholds, fit-residual gate, max DV01.
- **Basis template (cash–futures).** Two-leg long-bond / short-future (or reverse), parameterized by tenor, conversion-factor mode (CTD-aware), implied-repo entry threshold, CTD-switch-probability cap, roll calendar.
- **Swap-spread mean-reversion template.** Two-leg (sovereign + same-tenor swap), DV01-balanced, parameterized by tenor, currency, z-score entry / exit, balance-sheet-stress regime gate.
- **Asset-swap template.** Two-leg, parameterized by bond + matched swap, entry / exit z-score, repo-cost-adjusted carry threshold.
- **Auction-concession template.** Single-leg directional position into auction window, parameterized by issuer, tenor, supply-size threshold, dealer-positioning gate, **manual-override-window** (Ingrid can disable automatic post-deadline entry on a given auction day from the calendar UI).
- **Repo-special harvest template.** Long-cash / finance-special, parameterized by special-rate threshold, max position, tenor, holding period.
- **Cross-curve RV template.** Two-leg (e.g. UST 10y vs Bund 10y), parameterized by currency pair, tenor, z-score, macro-residual regime gate, FX-hedge policy.
- **XCCY basis fade template.** Cross-currency-basis dislocation fade, parameterized by pair, tenor, dislocation threshold, quarter-end aware.
- **OIS-vs-CB-guidance template.** When OIS-implied path diverges from explicit guidance, take the side of guidance, parameterized by CB, tenor, divergence threshold, **CB-meeting blackout window**.
- **Inflation-breakeven mean-reversion template.** Long / short breakeven, parameterized by tenor, currency, oil-residual gate, survey-gap gate.

Ingrid's day starts at a template and customizes from there. Many of her ~100–150 live strategies are instances of one of ~15 templates with parameter profiles tuned per currency / tenor pair / regime.

### 5.5 Compute Management

Senior researchers constantly run compute-heavy work — hyperparameter sweeps, walk-forward backtests across 20+ years of curve data, model training. Compute management is a real surface.

- **Active jobs panel** — Ingrid's running jobs with progress, ETA, cost-so-far, cancel buttons.
- **Queued jobs panel** — submitted but waiting (e.g. overnight runs).
- **Cost dashboard** — month-to-date compute spend, by job type, with budget guardrails.
- **GPU/cluster availability** — when can a big training job run, vs. when the cluster is busy.
- **Result archive** — completed jobs with their experiment-tracker entries.

Long-running jobs require explicit confirmation (a 4-hour A100 sweep prompts before launching). Cost is always visible. The trader does not manage VMs or queues — they request work; the platform delivers.

### 5.6 Anti-Patterns the Workspace Prevents

- **Untracked data pulls.** Every query logs lineage; nobody can secretly bake test-set data into a "training" notebook.
- **Untracked feature definitions.** A feature defined in a notebook and never published is suspect; the platform prompts to publish or formally archive.
- **Lookahead bias.** The backtest engine refuses to use future data; warnings if the trader tries. Common rates-specific lookaheads — using EOD curve points before they were stamped, using auction-results data before the deadline, using CB-statement language before the meeting — are checked explicitly.
- **Survivorship bias.** Backtests run on the as-of universe (delisted bonds, retired CTDs, expired futures preserved) — not today's roster.
- **Regime over-fit.** A model trained only on the post-Covid regime gets a warning: "training period excludes hiking-cycle samples; live regime may be hiking — out-of-distribution risk." Walk-forward is the structural defense; warnings reinforce.
- **In-sample tuning masquerading as out-of-sample.** Walk-forward forces honest splits; manual "let me just check this period" is logged and counted toward multiple-testing penalty.
- **Reproducibility gaps.** A notebook that can't be re-run from scratch (mutable state, local files, undocumented config) is flagged.

### 5.7 Interactions Ingrid has with the workspace

- **Pre-market:** review overnight backtest / training results; pick winners for further work.
- **In-market (research-heavy hours, non-event days):** active in the workspace; new strategy ideas, feature engineering, retraining.
- **Pre-event days (auction days, FOMC days, CPI days):** workspace minimized; supervisor + intervention console foveal.
- **Diagnostic (when alerted):** pull a misbehaving strategy into the workspace, replicate the issue, diagnose, fix, redeploy.
- **Post-market:** queue overnight jobs.

### 5.8 Why this matters

- **Efficiency:** time-to-validated-strategy compresses from weeks to hours. Senior researchers cite this loop's friction as the dominant productivity driver.
- **Risk:** anti-patterns (lookahead, survivorship, regime over-fit, p-hacking) are caught by the platform, not by Ingrid's discipline. Silent overfit shipping to production is the platform's most expensive failure mode; the workspace is the first defense.
- **PnL:** more validated alpha per quarter. Compounded over years, the difference between a good research workspace and a mediocre one is dozens of percent of fund return.

## 6. The Model Registry

Models are the executable form of Ingrid's edge. The registry catalogs every model the firm has trained, with full reproducibility guarantees. Whether a gradient-boosted tree predicting curve mean-reversion or a transformer predicting CB-statement-language hawkishness, every model is a first-class object with identity, training data hash, hyperparameters, performance, and deployment status.

### 6.1 The Model Registry Browser

Ingrid's view when she opens the model registry.

**Layout:**

- **Left sidebar** — taxonomy filters: model class (gradient-boosted / linear / neural / NLP / custom rule-set); domain (curve / butterfly / basis / swap-spread / repo / auction / CB / inflation); owner; deployment status (research / paper / pilot / live / monitor / retired); performance band; drift state.
- **Main panel** — table of models. Columns: name, version, owner, model class, training date, OOS Sharpe / hit-rate / RMSE (with CI), deployment count, drift status, last-modified.
- **Right pane** — when a model is selected: the model record (next subsection).

### 6.2 The Model Record Page

Per model, the canonical record:

- **Identity:** model ID, version (semantic + content hash), name, description, owner, code commit of training pipeline.
- **Lineage:** training data hash, feature set with versions, hyperparameters, label definition, training command. Reproducibility guaranteed: rerun-from-registry produces a bit-identical model, or the platform flags drift if data lake changed.
- **Training metadata:** training date, duration, compute used (CPU-h, GPU-h), $ cost, hardware.
- **Performance — multiple regimes:**
  - In-sample Sharpe / hit rate / Brier / RMSE (whatever's appropriate).
  - Out-of-sample on hold-out.
  - Walk-forward Sharpe with confidence interval.
  - Per-regime conditional performance — pre-GFC, post-GFC, Covid, post-Covid; hiking / cutting / hold cycles; vol-high / vol-low; quarter-end / non-quarter-end.
  - **Per-currency conditional performance** — does the model work on USD / EUR / GBP / JPY equally, or is it predominantly USD?
  - Capacity estimate (in DV01).
- **Lineage graph:** parent (if fine-tuned / retrained), children, siblings (sister models from the same experiment).
- **Deployment state:** which strategies use which version, in which environments. Map: model version → strategy version → live DV01.
- **Drift state:** input-distribution drift, prediction-distribution drift, performance vs expectation.
- **Documentation:** explainability cards (feature importance, partial-dependence plots, SHAP-style attribution), known failure modes, regime fit notes (e.g. "trained on data through 2024-06-30; performance unverified in hiking-cycle regimes that don't match post-Covid path").
- **Action panel:** "retrain with new data," "deploy to paper," "deprecate," "fork into a new variant."

### 6.3 Versioning & Immutability

- **Semantic versioning** for trader-meaningful changes (e.g. 3.2.0 = major.minor.patch).
- **Content hash** for guaranteed reproducibility — any change in code / data / hyperparameters yields a new hash.
- **Old versions never deleted.** A retired model is still in the registry, retrievable, redeployable.
- **Promotion path:** model is registered (research) → validated (paper) → deployed (live with strategy attached). Each transition auditable.
- **Rollback:** any prior version can be re-deployed in one click; promote / rollback is a controlled operation.

### 6.4 Drift Surface for Models

Distinct from feature drift (covered in section 4), model drift focuses on the model's _outputs_.

- **Prediction-distribution drift** — has the model's prediction distribution shifted vs. its training-time distribution? KS-test, PSI, custom metrics. Rates-specific: is a curve-steepener model's predicted-z-score distribution still centered at zero, or has it drifted (suggesting an underlying-feature regime shift)?
- **Performance drift** — is the model's realized accuracy / Sharpe contribution diverging from backtest expectation?
- **Calibration drift** — for probabilistic models (e.g. CTD-switch-probability classifier), are the predicted probabilities still well-calibrated against realized outcomes?

Drift triage queue: top models by drift score, with their downstream strategies. Click a row → suggested actions (retrain, recalibrate, replace, retire).

### 6.5 Lineage Graph

Per model, a visual graph:

- Upstream: training data → features → model.
- Downstream: model → strategies → DV01 deployed → P/L.
- Sister versions: prior versions of this model, with deltas highlighted.

Used during diagnostic work and during model deprecation (impact-of-change).

### 6.6 Why this matters

- **Efficiency:** Ingrid does not waste hours trying to reconstruct what a strategy is running on. The registry says: this strategy uses model X v3.2.0, trained on data hash Y, with hyperparameters Z. Diagnostic loop closes fast.
- **Risk:** without the registry, the firm cannot answer regulator / auditor / risk-committee questions about what's deployed. Reproducibility is non-negotiable; the registry is the system of record. For rates strategies that may persist through multiple regime cycles, version history is institutional memory.
- **PnL:** retraining cadence is data-driven, not gut-driven. Decay is measured per model; retire decisions are evidence-based.

## 7. The Experiment Tracker

Most research is failed experiments. The experiment tracker is the firm's institutional memory of what's been tried — successes, failures, dead-ends — searchable, comparable, reproducible.

### 7.1 The Experiment Browser

Layout:

- **Left sidebar** — filters: researcher, time period, model class, feature set, strategy class, status (running / complete / failed).
- **Main panel** — table of runs. Columns: run ID, name, researcher, started, duration, status, OOS Sharpe (or relevant metric), feature set, parameter summary, annotations.
- **Sortable, multi-select for comparison.**

### 7.2 Per-Experiment Record

Each experiment captures:

- **Trigger:** notebook + cell, scheduled run, hyperparameter sweep, scripted pipeline.
- **Config:** full hyperparameters, feature set, period, splits, seed, hardware. Anything that can affect outcome.
- **Inputs:** feature versions, data snapshot, code commit. Identical to model registry training metadata for ML runs; broader for non-ML runs (rules-based RV-model backtests).
- **Output:** performance metrics, equity curve, attribution, plots, log files.
- **Diagnostics:** runtime, peak memory, errors, warnings.
- **Annotations:** Ingrid's notes ("tried this because the post-Covid regime broke the swap-spread feature; restoring with balance-sheet-stress regime gating fixed").
- **Tags:** category, hypothesis, strategy class.

### 7.3 Run Comparison Views

The most-used surface for research velocity.

**Side-by-side comparison (2-way):**

- Two experiments selected from the table → side-by-side view.
- Diffs: feature-set delta, hyperparameter delta, performance delta, equity-curve overlay, attribution comparison.
- "What changed" summary at the top.

**N-way comparison (table form):**

- Multiple experiments in a table; sort / filter on metrics; identify dominant configurations.

**Pareto-frontier views:**

- Across many experiments, which configurations dominate (Sharpe vs drawdown / capacity / DV01-adjusted return).
- 2D scatter plots; interactive (click a point → open the experiment).

**Hyperparameter sensitivity:**

- Vary one parameter, hold others; the platform plots the response curve.
- Useful for understanding which parameters matter and which are noise — particularly important for curve / butterfly entry-threshold tuning where over-fit risk is high.

**Ablation views:**

- "Which features matter most?" — computed by permutation importance or SHAP attribution.
- Per-experiment context, plus aggregate across many experiments.

### 7.4 Anti-Patterns Prevented

- **P-hacking by re-running.** Every run is logged; trying 50 hyperparameter combos and reporting the best as if it was the only is detectable. Multiple-testing penalty surfaced.
- **Cherry-picking periods.** Each experiment's period is recorded; "I just happened to test 2018–2020" is visible. Particularly important for rates research where excluding the GFC / Covid windows hides regime-fragility.
- **Hidden in-sample tuning.** Walk-forward + log of every adjustment makes the trader's process honest.

### 7.5 Interactions Ingrid has with the experiment tracker

- **During research bursts:** runs experiments, watches them stream in, picks winners for promotion.
- **Between bursts:** browses past experiments to see what was tried; avoids reinventing.
- **In retrospect:** "we shipped this model; what alternatives did we evaluate; could we have shipped a better one?"
- **For team handoff:** a researcher leaving the desk hands their successor a tagged set of experiment runs; the new person reads the corpus and ramps fast.
- **When David asks:** "show me the evidence behind this strategy promotion" — the experiment tracker has the audit trail.

### 7.6 Why this matters

- **Efficiency:** failed experiments are data, not waste. Avoiding the same dead-end twice is real productivity.
- **Risk:** p-hacking is the silent killer of quant research. The tracker makes Ingrid's process honest and defensible.
- **PnL:** the firm's accumulated experiment knowledge compounds over years. New researchers stand on the shoulders of every prior run.

## 8. Strategy Composition

A model alone is not a tradable strategy. A strategy is what wraps a model (or a rule set) with sizing logic, entry/exit logic, hedging, risk gating, regime conditioning, capacity management, and execution policy. Strategy composition is where Ingrid turns a validated model into a deployable unit of DV01.

### 8.1 The Strategy Composition Surface

A structured form-plus-code UI. The trader configures the structured parts (visual graph + form fields) and drops into Python for any custom logic.

**Layout (sketch):**

- **Top bar** — strategy ID, name, version, owner, current stage (Research / Paper / Pilot / Live / Monitor / Retired), action buttons (validate / backtest / deploy / clone / archive).
- **Left graph view** — the strategy as a directed graph: data sources → features → model(s) → signal → entry/exit logic → sizing → execution. Click any node to configure. **Curve-trade strategies show the leg structure explicitly** (two-leg DV01-balanced for curves, three-leg for flies, two-leg for basis / swap-spread / asset-swap).
- **Right panel** — properties of the selected node:
  - **Data source** — catalog reference, currencies, tenors, period.
  - **Feature** — feature library reference, parameters.
  - **Model** — model registry reference, version pin.
  - **Signal** — threshold (in z-score space), confirmation conditions, regime gates.
  - **Entry logic** — when to take a position (signal threshold + blackout windows: e.g. don't enter within CB-meeting blackout window per CB; don't enter within auction-window for the issuing tenor; don't enter within quarter-end blackout for swap-spread strategies).
  - **Exit logic** — target spread / stop spread / time-based / signal-flip / regime-flip.
  - **Sizing** — DV01-target sizing (Kelly or fixed-fractional in DV01 terms), max-DV01 cap, per-tenor-bucket DV01 cap, regime-conditional multipliers, **carry-cost gate** (don't size up if expected carry-cost exceeds expected return).
  - **Hedging policy** — auto-DV01-hedge yes/no, hedge instrument (futures preferred for cost), hedge venue, hedge cadence, **convexity-hedge policy** for large positions where convexity matters.
  - **Risk gates** — daily loss limit, drawdown limit, DV01-position-size limit, per-bucket DV01 cap. Kill-on-breach.
  - **Execution policy** — algo class (TWAP / VWAP for futures; RFQ for swaps / cash bonds; iceberg for cash treasuries), venue routing rules (CME / Eurex / ICE / dealer-RFQ panels), fee preferences, latency budget, **multi-leg-atomicity policy** (must-fill-all-or-nothing vs allow-partial-with-rebalance).
  - **Schedule** — active hours / days, blackout windows around macro events (Ingrid's curve-steepener fleet pauses 30 min around scheduled FOMC / ECB / BoE / BoJ statements; auction-concession strategies for the issuing tenor pause across the auction window).
  - **Mode** — live / paper / shadow.
  - **Tags** — strategy class, currency, tenor pair, archetype owner.
- **Bottom panel** — validation feedback, backtest results, deployment state. When Ingrid hits "validate," automated checks run; when she hits "backtest," the form spawns a backtest job in the workspace.

**Code drop-in:** for any node, "convert to custom code" opens a Python editor with the platform SDK pre-loaded. Useful for novel signal-combiners, exotic exit logic (e.g. CB-language-NLP-conditional exits), or anything the structured form can't express.

**Curve visualization integrated.** A panel within the composition surface renders the live curve(s) the strategy is positioned in, with markers showing entry / target / stop levels in spread space. Ingrid sees her strategy "live on the curve" while composing — the strategy's signal isn't an abstract z-score, it's a position on the visual curve atlas.

### 8.2 Pre-Deployment Validation

Before the strategy can be promoted past research, the platform checks for common errors:

- **Lookahead leak detection.** Static analysis of the signal logic to ensure no future data is referenced. Rates-specific: auction-results data must not be referenced before the deadline; CB-statement language must not be referenced before the statement release.
- **Infinite-loop entry.** Strategies that would re-enter immediately after a stop (a common bug).
- **Unbounded position size.** Sizing logic that doesn't cap exposure. Per-bucket DV01 caps must be set.
- **Missing kill-switch wiring.** Every strategy must have automated risk gates with kill-on-breach.
- **DV01-balance assertion.** Curve / butterfly / basis trades must balance to within tolerance; the platform refuses to promote a "curve" strategy whose DV01-balance is broken.
- **Schedule conflicts.** Strategies marked active during CB-meeting blackouts or auction windows where they shouldn't be.
- **CCP / clearing config.** Swap strategies must declare CCP routing (LCH / CME / Eurex) and have IM-budget verified.
- **Compliance flags.** Restricted-list exposure, sanctioned-counterparty exposure (relevant for some EM swap counterparties), jurisdictional access.
- **Capacity sanity.** The strategy's claimed DV01 capacity matches the platform's slippage-curve estimate.
- **Universe consistency.** The strategy's tenor / currency list aligns with available data and feature coverage.

Each warning gates progression. Errors must be fixed; warnings can be acknowledged with reason.

### 8.3 Strategy Versioning

- Every change to the composition produces a new strategy version.
- Old versions stay in the registry (similar to the model registry).
- Live deployments pin to a specific version; promoting a new version is a controlled operation.
- Diff views: show what changed between version 3.2 and 3.3.

### 8.4 Ingrid's Strategy Templates (Illustrative)

Pre-built strategy compositions that Ingrid's day starts at. She customizes parameters, picks currency / tenor pair / regime, validates, backtests, then promotes through the lifecycle. Many of her ~100–150 live strategies are instances of one template parameterized for a specific (currency, tenor pair, horizon, regime).

- **Curve steepener / flattener.** Two-leg DV01-balanced. Inputs: currency, tenor pair, z-score entry / exit, lookback, regime gates (CB cycle + vol regime + quarter-end), max DV01. Hedging: built-in (DV01-balance is the hedge by construction). Risk gates: daily loss, max DV01.
- **Butterfly.** Three-leg DV01-balanced or 50/50-balanced. Inputs: wings, belly, currency, z-score thresholds, fit-residual gate, max DV01.
- **Cash–futures basis.** Two-leg with CTD-aware conversion factor. Inputs: tenor, implied-repo entry threshold, CTD-switch-probability cap, roll calendar.
- **Swap-spread mean-reversion.** Two-leg sovereign + same-tenor swap. Inputs: tenor, currency, z-score, balance-sheet-stress regime gate.
- **Asset-swap.** Two-leg bond + matched-tenor swap. Inputs: bond, repo-cost-adjusted carry threshold.
- **Auction-concession.** Single-leg directional, parameterized by issuer / tenor / supply-size threshold / dealer-positioning gate. **Manual-override window** is a first-class config: Ingrid can disable automatic post-deadline entry on a per-auction basis from the calendar UI.
- **Repo-special harvest.** Long-cash + finance-special. Inputs: special-rate threshold, max position, tenor, holding period.
- **Cross-curve RV.** Two-leg cross-currency (e.g. UST 10y vs Bund 10y). Inputs: pair, tenor, z-score, macro-residual gate, FX-hedge policy.
- **XCCY basis fade.** Cross-currency basis dislocation fade. Inputs: pair, tenor, dislocation threshold, quarter-end aware.
- **OIS-vs-CB-guidance.** Inputs: CB, tenor, divergence threshold, CB-meeting blackout window.
- **Inflation-breakeven.** Long / short breakeven. Inputs: tenor, currency, oil-residual gate, survey-gap gate.

### 8.5 Why this matters

- **Efficiency:** the same model can be expressed as many strategies (atomic vs partial-allowed; cleared vs bilateral; per-currency variants) without re-implementing the model logic. Composition compresses time-to-deployable-strategy.
- **Risk:** validation catches the high-cost errors before they reach production. DV01-balance assertion in particular catches a class of bugs that would otherwise show up as silent directional bets in a "RV" strategy. Versioning makes rollback safe.
- **PnL:** Ingrid runs many strategy variants per model; capacity and risk profiles differ across currencies and tenor buckets. Composition lets her capture each variant's distinct PnL contribution.

## 9. Promotion Gates & Lifecycle

The lifecycle (Research → Paper → Pilot → Live → Monitor → Retired) is enforced by promotion gates. The lifecycle UI is the surface Ingrid uses every day to advance, demote, and retire her ~100–150 strategies.

### 9.1 The Lifecycle Pipeline View

A pipeline visualization, like a Kanban board:

- **Columns:** Research, Paper, Pilot, Live, Monitor, Retired.
- **Cards:** strategies, with name, owner, days-in-stage, current performance vs expectation, gate status.
- **Drag (controlled):** dragging a card across columns proposes a transition; opens the gate UI.

This is the home page for Ingrid's lifecycle work. She sees, at a glance, her pipeline: how many in research, how many waiting on promotion review, how many in pilot, how many at full live, how many on monitor probation.

### 9.2 The Gate UI per Transition

Each promotion is a checklist with evidence, not a chat conversation.

**Research → Paper:**

- Code review passed (link to PR / commit).
- Backtest framework approved (no anti-pattern warnings).
- Walk-forward Sharpe above firm-wide threshold (with confidence interval).
- DV01-adjusted return above the strategy-class-specific threshold.
- Multi-regime evaluation: at least one hiking-cycle window + one cutting-cycle window in the test set.
- Risk parameters set within firm limits.
- DV01-balance verified (for multi-leg strategies).
- Kill-switch wired and tested.
- Owner sign-off.

**Paper → Pilot:**

- N days of in-distribution behavior on paper (default 21 days for rates strategies — longer than Marcus's 14 because rates strategies tend to be slower-moving).
- Slippage estimates validating against backtest assumptions.
- RFQ-response-rate matching backtest assumptions for swap-leg strategies.
- Strategy fits within firm risk limits at pilot DV01 level.
- Owner + risk team sign-off.

**Pilot → Live:**

- N days of pilot behavior matching expectation (default 60 days for rates — even slower because regime-cycle exposure matters).
- Capacity estimate refined with real data.
- No anomalies in alert log.
- DV01-bucket fit verified (the new strategy's DV01 distribution matches what the allocation engine assumed).
- David (or his delegate) sign-off for material DV01 allocations.

**Live → Monitor:**

- Trader-initiated (degradation observed) or system-initiated (drift / decay alerts).
- Reason logged.
- DV01 cap reduced per policy.

**Monitor → Retired:**

- Decay confirmed (statistical evidence).
- No path to retraining or recalibration.
- Retire decision logged with rationale.

**Retired → Research / Paper (rare):**

- Explicit re-promotion case.
- New evidence (regime change, new feature, new data) justifies revisit. Common for rates: a strategy retired in a Covid-anomaly regime gets re-promoted when regime normalizes.

### 9.3 Lifecycle Decision Log

Append-only log of every transition: timestamp, strategy ID, version, from-stage, to-stage, decided by, reason, evidence links. Searchable, auditable, exportable for risk-committee review.

### 9.4 Lifecycle Cadence for Ingrid

Rates strategies cycle slower than crypto. Regime windows last quarters or years; many strategies live for 12–36 months before retirement. Ingrid's typical fleet state:

- **Research:** 10–20 strategies in active research (early-stage prototypes).
- **Paper:** 5–10 strategies running on simulated fills, awaiting pilot promotion.
- **Pilot:** 8–15 strategies at 5–20% of target DV01.
- **Live:** 80–120 strategies at full DV01.
- **Monitor:** 10–20 strategies on decay probation.
- **Retired:** dozens accumulated over time.

Daily / weekly Ingrid is making 1–5 promotion decisions and 0–2 retire decisions across the fleet — slower cadence than Marcus, reflective of slower-moving rates regimes.

### 9.5 Why this matters

- **Efficiency:** lifecycle gates standardize quality control. Ingrid does not need to design a custom evaluation framework for each strategy.
- **Risk:** every strategy reaching live DV01 has passed code review, risk review, validation. The platform's risk surface is correlated with lifecycle stage; pilots are watched more aggressively than long-running lives.
- **PnL:** poorly performing strategies are retired by the lifecycle, not by Ingrid's gut. Discipline compounds.

## 10. Capital Allocation

The capital allocation engine is the system that decides how much DV01 each strategy in Ingrid's fleet receives. In manual trading, Ingrid sized each position by gut + spreadsheet, in DV01 terms. In automated trading, the platform proposes allocations across the fleet and Ingrid approves.

### 10.1 The Allocation Engine UI

**Layout:**

- **Top panel** — total DV01 budget available, currently allocated, free, in-flight (between trades being established or unwound). Per-archetype DV01 budget (Ingrid's slice of the firm allocation, set by David).
- **Main table** — every strategy with current DV01 allocation, proposed DV01 allocation, delta, expected Sharpe contribution, marginal Sharpe contribution, capacity headroom (in DV01), drift state, lifecycle stage.
- **Right panel** — risk decomposition of the proposed portfolio: total DV01 / per-bucket DV01 / per-currency DV01 / VaR / convexity / per-instrument-cluster / per-CCP / per-bilateral-counterparty / stress-scenario PnL. Concentration warnings.
- **Bottom panel** — methodology selector + parameters. Ingrid picks (or combines) Sharpe-proportional / risk-parity / Markowitz / Kelly / regime-conditional / hierarchical-risk-parity / custom. **DV01-parity** is a rates-specific default: equal DV01 per strategy in the absence of stronger Sharpe signal.

**The proposal:**

- Generated nightly by default; on-demand when Ingrid wants.
- Auto-respects firm-level constraints (David's caps).
- Auto-respects per-bucket DV01 caps (e.g. front-end vs belly vs back-end ratios).
- Material changes from current allocation (e.g. >10% shift) flag for sign-off — Ingrid's sign-off for trader-level changes; David's for archetype-level.
- "Approve and apply" button — strategies update their DV01 caps; the platform respects.

### 10.2 DV01-Bucketed Allocation (Rates-Specific)

Rates allocation is fundamentally about distributing DV01 across the curve, across currencies, and across strategy classes. Three nested allocation surfaces:

**Per-bucket DV01 budget:**

- 0–2y, 2–5y, 5–10y, 10–20y, 20–30y per currency. Each bucket has a soft target and a hard cap.
- The proposal-engine respects buckets; a curve-steepener strategy uses two buckets simultaneously and is accounted across both.
- Visual: a "DV01 by bucket × currency" matrix with current vs proposed vs target shading.

**Per-currency DV01 budget:**

- USD / EUR / GBP / JPY (and AUD / CAD / NZD / SEK / NOK / CHF as the firm permits).
- Reflects the firm's per-currency-region risk appetite and client-mandate constraints.

**Per-strategy-class DV01 budget:**

- Curve / butterfly / basis / swap-spread / asset-swap / auction / repo / cross-curve / XCCY / OIS-vs-guidance / inflation.
- Used to ensure the fleet isn't 80% curve trades and 20% everything else; diversification across strategy classes is part of the risk philosophy.

### 10.3 Margin / IM Budget Management

Cleared swap strategies consume Initial Margin at CCPs (LCH / CME / Eurex). The allocation engine respects IM budgets per CCP:

- **Per-CCP IM consumed** vs firm IM budget at that CCP.
- **Bilateral CSA-MTM exposure** per counterparty.
- **Cross-margin benefit** — swaps cleared at the same CCP that net against existing positions reduce IM consumption; the engine considers this when proposing new strategies.
- **Margin-stress scenario** — the engine surfaces scenarios where IM would spike (CCP-margin-multiplier increase, vol-regime shift) and the strategies most affected.

When a new strategy is composed, CCP / IM routing is part of the configuration. The allocation engine respects these constraints.

### 10.4 Allocation Drift

Allocations drift during the day as strategies make / lose money or as positions move. The engine continuously shows:

- DV01 drift from optimal (proposed) allocation.
- Whether to rebalance now (intraday) or wait for nightly.
- Cost of rebalancing (slippage, fees, RFQ-spread costs) vs expected return improvement.
- Auto-rebalance thresholds (configurable per strategy class).

### 10.5 Capacity & Headroom

- **Per-strategy DV01 capacity utilization** — % of estimated DV01 capacity in use, color-coded.
- **Free DV01 capacity** — strategies with headroom; where to add.
- **Capacity exhausted** — strategies at cap; signals being skipped. Decision: accept (this is the strategy's natural ceiling) or invest in raising capacity (better RFQ panel, broader tenor universe, additional currency).

Capacity is a primary constraint on Ingrid's PnL; rates-strategy capacity is often constrained by the depth of the relevant tenor's order book (e.g. JGB 30y butterfly capacity is much smaller than UST 10y curve capacity).

### 10.6 Why this matters

- **Efficiency:** allocation across 100+ strategies, 4+ currencies, 5+ tenor buckets, multiple strategy classes is not solvable by spreadsheet. The engine compresses what would otherwise be hours of nightly work into a 15-minute review.
- **Risk:** systematic risk-parity / DV01-parity / Kelly / Markowitz constraints prevent over-allocation to a single strategy or correlation cluster. Better diversification than gut sizing — particularly across curve buckets, where concentration in a single bucket is a hidden directional bet.
- **PnL:** marginal Sharpe analysis ensures incremental DV01 goes to where it has highest return. Capacity-aware sizing prevents over-trading thin strategies (e.g. JGB butterflies).

## 11. Live Fleet Supervision Console

The console where Ingrid supervises every live strategy in her fleet. Anomaly-driven by design: green by default; the trader is summoned only when something is off. This replaces the manual trader's "watch the curve atlas" surface for strategies running systematically — but Ingrid retains the curve atlas in periphery for her own intuition and for auction / CB / event days.

### 11.1 The Fleet Dashboard

The center of Ingrid's automated-mode supervisor console.

**Layout:**

- **Top filter bar** — health badge filter (default: amber + red only; toggle to show green); strategy class filter; currency filter; tenor-bucket filter; lifecycle-stage filter.
- **Main grid / table** — one row per strategy. Columns:
  - Strategy ID, name.
  - Strategy class (curve / butterfly / basis / swap-spread / asset-swap / auction / repo / cross-curve / XCCY / OIS-guidance / inflation).
  - Currency, tenor pair / leg structure.
  - Lifecycle stage.
  - **Health badge** — green / amber / red, computed composite of PnL deviation, drift, slippage, alert volume.
  - **DV01 deployed / cap.**
  - PnL today / WTD / MTD / YTD ($ and % of DV01 cap).
  - **Carry P&L MTD** (rates-specific column — passive return is half the game).
  - Sharpe rolling 60d.
  - Drawdown — current / max-since-go-live.
  - Trade count today vs typical (silence is a signal).
  - Hit rate, avg trade $.
  - **Recent regime fit** — model-vs-regime indicator (CB cycle, vol regime, quarter-end proximity).
  - Last intervention timestamp + actor.
  - Capacity utilization (DV01) %.
  - **Ingrid-specific columns:** spread at last action (in bps); z-score at last action; for auction strategies, distance to next auction window; for CB-sensitive strategies, distance to next CB blackout.
- **Sortable, filterable, expandable.** Group by currency / tenor bucket / strategy class / CCP toggleable.
- **Default view:** filtered to amber + red. With ~120 strategies, only 5–15 typically demand attention; everything else is healthy and trusted.

**Group-by views:**

- **By strategy class** — total class-level PnL, class-level health, drill into instances.
- **By currency** — currency-level DV01, currency-level health (a regime shift in one currency affects all its strategies).
- **By tenor bucket** — per-bucket DV01 distribution across the fleet; per-bucket P&L attribution.
- **By CCP** — per-CCP IM consumed, per-CCP P&L for cleared swap strategies.

Ingrid toggles between views during diagnostic work.

### 11.2 The Strategy Detail Page

Click a strategy → drill into its full state.

**Layout:**

- **Header** — strategy ID, name, class, lifecycle stage, current state, action buttons (pause / cap / retrain-trigger / retire).
- **Top section: live state**
  - **Curve visualization with positioning** — the live curve(s) the strategy is positioned in, with markers showing entry / current / target / stop levels in spread space. The strategy's current "live position on the curve" rendered visually.
  - Live equity curve (with backtest expectation overlay — divergence flagged).
  - **DV01 breakdown by leg** — what is this strategy currently holding, per leg, per tenor bucket.
  - Carry / roll / mark-to-market decomposition of position P&L since entry.
  - Drift indicators (feature drift, prediction drift, performance drift).
  - Recent intervention log.
- **Middle section: signal feed**
  - Recent signals generated, executed vs skipped, with reasons.
  - Last N decisions with full context (input feature values — z-scores, regime classifications; model output; signal threshold).
  - "Why this strategy entered / didn't enter" diagnostic.
- **Bottom section: diagnostic depth**
  - Feature health — which features are drifting, with click-through to feature drift dashboard.
  - Slippage realized vs assumed by venue / RFQ-platform.
  - DV01 capacity utilization curve.
  - Recent retraining history.
  - Linked alerts that have fired on this strategy.
  - Linked experiments (recent backtests / retraining runs).

This page is where Ingrid does diagnostics. From here, she decides: pause, cap, retrain, leave alone, retire.

### 11.3 Anomaly Detection Surface

Anomaly detection is the heart of supervision. Categories:

- **Performance anomalies** — strategy underperforming its rolling distribution at 2σ / 3σ.
- **Behavior anomalies** — trade frequency, position size, hit rate outside historical bounds.
- **Feature drift** — input distribution shifted vs training.
- **Prediction drift** — output distribution shifted.
- **Execution anomalies** — slippage spike, RFQ rejection rate spike, fill rate drop, dealer-fade rate spike.
- **Capacity warnings** — strategy hitting DV01 cap; signals being skipped.
- **Correlation anomaly** — strategy correlating with another it should not (e.g. a 2s10s steepener correlating unexpectedly with an asset-swap strategy — likely both are loading on the same balance-sheet-stress factor).
- **Regime mismatch** — running a "hiking-cycle" model in a "cutting-cycle" regime.
- **Curve-shape regime mismatch** — running a "normal-curve" model in a deep-inversion regime.
- **Infrastructure** — node down, data lag, RPC degraded, RFQ-platform connectivity degraded.

Each anomaly has severity (info / warn / critical), routing rules, and (for critical) auto-actions (auto-pause the strategy by default, configurable per strategy).

**The anomaly console:**

- Active anomalies, sorted by severity then recency.
- Per-anomaly: which strategy, what triggered, suggested action, "investigate" button → strategy detail page, "acknowledge with reason" button.
- Acknowledged-anomalies log for review.

### 11.4 Cross-Strategy Correlation View

The fleet is supposed to be diversified; correlation drift erodes diversification. For rates this is particularly important — many "different" strategies all load on the same balance-sheet-stress / vol-regime / curve-level factor.

**Layout:**

- **Heatmap** — strategy × strategy correlation matrix, color-coded.
- **Drift indicators** — pairs that should be uncorrelated but are drifting toward correlation.
- **Cluster visualization** — automatic clustering of strategies by behavior; outliers (a strategy that joined a cluster it didn't belong to) flagged.
- **Aggregate exposure decomposition** — fleet-level net DV01, net DV01 by tenor bucket, net convexity, net cross-currency-basis exposure, net swap-spread exposure across the fleet. Ensures supposedly-diversified strategies aren't quietly stacking exposure to a single rates factor.
- **Cross-curve correlation monitoring** — rates-specific. Tracks how the fleet's exposure correlates across UST / Bund / Gilt / JGB curves; when cross-curve correlations break (a regime where USTs sell off but Bunds rally, for instance), strategies with implicit cross-curve hedge assumptions are flagged.

### 11.5 DV01-Bucketed Fleet + Calendar Live State

The rates-specific equivalent of Marcus's "Multi-Venue Capital + Balance Live State." Distinct from the allocation engine's nightly proposal — this is the live, intra-day state.

**Layout:**

- **Per-currency × per-tenor-bucket DV01 matrix.** Live DV01 per (currency, bucket). Color-coded against bucket caps (green / amber / red).
- **Per-strategy-class DV01 distribution.** How is the fleet's DV01 distributed across curve / butterfly / basis / swap-spread / etc. classes? Drift from target distribution flagged.
- **Per-CCP IM utilization.** Live IM consumed at LCH / CME / Eurex vs budgets.
- **Calendar sidebar.** Upcoming events that affect the fleet:
  - Auctions in the next 5 days, with affected strategies highlighted (which auction-concession strategies are positioned, which bucket-DV01-strategies will hit blackout).
  - CB meetings in the next 14 days, with affected strategies and their pause windows.
  - Tier-1 economic releases in the next 7 days.
  - Quarter-end / year-end proximity indicator.
- **Quick actions:** pause-all-in-tenor-bucket, pause-all-in-currency, pause-all-in-strategy-class, hedge-to-DV01-neutral-on-bucket.

Foveal during a regime shift or before a major event (FOMC week, large refunding announcement, peripheral-spread blowout). The calendar isn't a peripheral surface in rates — it's central to how the fleet is being managed.

### 11.6 Strategy State Inspection

A diagnostic surface that lets Ingrid inspect the **internal state of a running strategy** — its current variables, signal evaluation, model output, regime classifier, position-sizing intermediates — and compare live behavior against backtest expectation. Critical for verifying that a strategy is configured correctly, that live and backtest aren't drifting, and that the trader's mental model of the strategy matches what the code is actually doing.

This is a verification surface, not a continuously-streamed real-time view. It is implemented per strategy; the strategy declares which variables it exposes, and the platform renders them on demand. Some strategies expose 5 variables; some expose 50; engineering cost dictates depth.

**Two layers of inspection:**

#### 11.6.1 Internal-state view (per strategy)

A panel inside the strategy detail page (section 11.2) that the trader opens on demand.

**What it shows (illustrative, varies per strategy):**

- **Current state variables** — the strategy's internal counters / flags / regime classifications / running averages / accumulators. Displayed in a structured table with field name, current value, last-updated timestamp.
- **Current feature snapshot** — the input feature values the strategy is currently seeing (the feature-vector that would be fed to the next signal evaluation). Useful for "is the swap-spread-z feature returning what I'd expect right now?"
- **Last N signal evaluations** — for the last decisions the strategy made: input features, model output (signal value, probability, classifier label), entry / exit / no-action decision, reason. Scrollable / searchable history.
- **Current position state** — what the strategy is holding per leg; what it intends to do next; pending RFQs; pending limit orders.
- **Risk-gate state** — daily-loss accumulator, drawdown-since-go-live, DV01 utilization, distance-to-each-risk-limit (per-bucket, per-currency).
- **Regime classifier output** — the strategy's view of the current regime (e.g. "vol-low, hiking-cycle, non-quarter-end, normal-curve"); strategies with regime gating expose which gates are open / closed.
- **Strategy-specific custom state** — examples:
  - A curve-steepener strategy might expose: current 2s10s level, z-score, lookback baseline, target spread, stop spread, time-since-entry, regime-classifier-state-at-entry, exit-condition-evaluation.
  - A basis strategy might expose: current net basis, gross basis, implied repo, CTD identifier, CTD-switch probability, conversion factor, repo cost accumulator.
  - An auction-concession strategy might expose: current concession-vs-model residual, dealer-positioning-z-score, hours-to-deadline, manual-override-status (Ingrid disabled this for today's auction yes/no), pre-deadline-flatten timer.
  - A swap-spread strategy might expose: current spread, z-score, balance-sheet-stress regime flag, quarter-end-proximity indicator, CCP-routing decision, IM-consumed-by-this-position.

**Refresh model:**

- **Refresh button** for on-demand snapshot. The most common interaction.
- **Auto-refresh toggle** for selected strategies (e.g. when actively diagnosing). Configurable cadence: 1s / 5s / 30s / 1min / off.
- **Schedule push** for selected strategies — the platform pushes state updates only when the strategy actually changes state (entered a position, evaluated a signal, hit a gate). Lightweight, event-driven.
- **Engineering pragmatic:** the platform does not stream all variables of all 120 strategies in real time — that's heavy on backend and wasteful. Streaming is opt-in per strategy when the trader is actively inspecting; default is on-demand refresh.

**Per-strategy implementation:**

- The strategy declares its exposed state via a contract (a list of variables, types, descriptions). The platform renders whatever the strategy declares.
- Some strategies expose comprehensive state (many internal variables, full signal-history, regime classifier outputs).
- Some expose minimal state (just the position and current signal). Pragmatic — engineering cost should match diagnostic value.
- The trader is not blocked if a strategy is light on exposed state; the supervision dashboard, model registry, and execution log give independent diagnostic angles.

#### 11.6.2 Backtest-vs-live comparison

For any live strategy, a side-by-side view comparing live behavior against backtest expectation. Critical for catching configuration drift early.

**Layout:**

- **Top:** equity curve, live (last N days) overlaid on backtest counterfactual (had the strategy run with the same parameters and same regime over the same period). Divergence flagged.
- **Per-trade comparison:** recent live trades, what the backtest would have done at the same moment. Mismatches: live entered when backtest didn't (or vice versa); live size differed from backtest size; live execution-quality differed.
- **Per-feature drift:** the input features the strategy saw live vs the same features in the backtest's training distribution. Distribution-shift score per feature.
- **Per-signal calibration:** for probabilistic-output models, was the live signal calibrated as the backtest predicted (a 0.7 probability resolved to ~70% of outcomes)? Particularly relevant for CTD-switch-probability classifiers and CB-language hawkishness classifiers.
- **Carry/roll-vs-mark-to-market split** — the comparison decomposes both live and backtest P&L into carry / roll / yield-change / curve-change / spread / convexity buckets, so the trader can see whether divergence is in the active or passive component.
- **Diagnosis hints:** the platform suggests likely root causes if divergence is meaningful — feature drift, execution-quality degradation (e.g. RFQ-fade rate higher than backtest assumed), model drift, configuration mismatch (e.g. different DV01-cap parameter than the backtest), data-pipeline issue.

**Use cases:**

- After Ingrid deploys a new strategy to live: confirm the first weeks' behavior matches the backtest. If it doesn't, diagnose before scaling DV01.
- When a strategy enters monitor stage: was the divergence caused by the live deployment or by the regime?
- When validating a candidate retrain: how does the new model's first weeks compare to its backtest?

**Refresh model:**

- Computed daily by default (not real-time). The comparison is a slow-moving diagnostic; daily granularity is sufficient.
- On-demand refresh available.

#### 11.6.3 Why this matters

- **Efficiency:** when a strategy is misbehaving, Ingrid can see exactly what it's "thinking" without needing to run a fresh backtest or open the code repo. The diagnostic loop closes in minutes rather than hours.
- **Risk:** silent configuration drift between backtest and live is a major failure mode. The comparison surface catches it before scaled DV01 makes the mistake expensive.
- **PnL:** strategies that match their backtest expectation can be scaled with confidence. Strategies whose live diverges from backtest are caught early and either fixed or capped.
- **Engineering verification:** as a side effect, this surface is one of the cleanest end-to-end tests of the platform — if Ingrid can see the right state for a strategy, the data plumbing, model registration, strategy composition, execution layer (including RFQ + multi-leg-atomic execution), and reporting layer are all working end-to-end. The diagnostic surface doubles as platform validation.

### 11.7 Why this matters

- **Efficiency:** anomaly-driven attention compresses 120 strategies into ~5–15 to investigate. Ingrid does not stare at 120 curve charts.
- **Risk:** anomalies are caught before P/L damage compounds. Auto-pause on critical alerts limits blast radius. Cross-curve correlation drift detection is a meaningful risk-management upgrade over manual sense-making.
- **PnL:** time saved on supervision is reinvested in research and in the few-hours-per-week of high-leverage event-day judgment. The leverage of the trader-quant role depends on this.

## 12. Intervention Console

When Ingrid decides to act, the intervention console is the surface. Distinct from automatic actions (kill-on-breach, auto-rebalance, scheduled CB-blackout pauses) — this is _Ingrid's_ interventions.

### 12.1 Per-Strategy Controls

For any strategy, controls Ingrid can apply:

- **Start / pause / stop** — with confirmation + audit trail.
- **DV01-cap change** — increase / decrease DV01 cap. Modest changes auto-apply; large changes route to allocation-engine sign-off.
- **Risk-limit change** — daily loss limit, drawdown limit, per-bucket-DV01 limit. Audited.
- **Tenor / instrument whitelist / blacklist** — temporarily exclude a tenor (e.g. exclude JGB 40y because BoJ is operating in that tenor today).
- **Schedule modification** — pause active hours, add a blackout window (e.g. "no entries between 13:00 and 14:30 UTC for the next 7 days because of expected ECB Sintra commentary").
- **Manual auction-override toggle** — for auction-concession strategies, disable automatic post-deadline entry on a specific auction date. Ingrid sets this from the calendar UI when she wants to handle the auction manually.
- **CB-meeting blackout extension** — extend the default CB blackout window for a specific meeting (e.g. "extend FOMC blackout to T+2h instead of T+30m because of expected SEP volatility").
- **Mode change** — live / paper / shadow. Shadow mode runs the code without sending orders; useful for diagnosing without further P/L exposure.
- **Force-flatten** — close all positions on this strategy now. Reason field mandatory.
- **Demote to monitor** — move to monitor stage with reason.

Every intervention is logged: timestamp, actor, action, reason, pre-state, post-state.

### 12.2 Group Controls

Rates-specific group controls:

- **Pause all in strategy class** (e.g. pause all curve-steepener strategies because of an unexpected refunding-statement headline).
- **Pause all in currency** (e.g. pause all GBP strategies because of a UK political crisis).
- **Pause all in tenor bucket** (e.g. pause all front-end strategies because of an emergency FOMC).
- **Pause all on CCP** (CCP-specific issue; shifts new flow to bilateral or alternative CCPs).
- **Pause all with auction sensitivity in the next N hours** (a quick toggle as auction window approaches).
- **Pause all CB-sensitive in the next N hours** (a quick toggle as a CB meeting approaches).
- **Pause all in lifecycle stage** (e.g. pause all pilots during a major macro event).
- **Cap all by tag** — multiplicative DV01-cap reduction across a tagged set.

### 12.3 Manual Trading & Reconciliation

**Even in fully automated mode, the trader must retain the ability to place, adjust, and close trades manually from the UI.** This is non-negotiable for Ingrid — auction days, FOMC days, and geopolitical events all require curve-trade-native manual capability identical to her manual-mode workflow. Three primary scenarios:

**1. Emergency intervention.**
A strategy is misbehaving; the auto-flatten failed; a CCP is in a degraded state and the algo cannot route through it; an unexpected refunding statement requires immediate position closure that the strategy isn't pre-coded to handle. Ingrid needs to flatten or adjust positions by hand right now. Hesitation costs PnL; in rates, where DV01 is concentrated, a 5-minute delay can cost millions.

**2. Reconciliation between algo state and venue / dealer state.**
The platform's view of what's open and the dealer / CCP's view should always match — but in practice they occasionally diverge (an RFQ fill the strategy didn't register; a cancel the strategy thinks succeeded but didn't; a CCP that briefly reported a wrong IM and corrected; a dealer who confirmed a swap allocation later than expected). Ingrid needs to manually align the two.

**3. Discretionary override on top of the automated book — particularly on event days.**
**This is the most-used mode for Ingrid.** Auction days, FOMC days, ECB days, BoE days, BoJ days, CPI days, NFP days — Ingrid trades these manually with full curve-trade-native tickets, layering directional / curve / butterfly / basis trades on top of what the systematic book is doing (or, more often, on top of the systematic book having paused itself across the event window). Explicitly tagged as override.

The platform must support all three with **full manual-trading capability identical to the manual mode** described earlier in this doc. Ingrid retains every surface from her manual workflow: outright ticket, curve / butterfly / basis ticket, swap ticket with cleared / bilateral selection, RFQ workflow with dealer aggregation, pre-trade preview (multi-leg DV01 budget, convexity, carry, IM), execution algos (TWAP / VWAP / iceberg / auction-aware / roll algos / multi-leg-atomic), smart router across CME / Eurex / ICE / dealer-RFQ panels, hotkeys (hit bid / lift offer / cancel-all-on-tenor / flatten-DV01-on-bucket / roll-futures), positions blotter (DV01-bucketed), working orders blotter, multi-curve atlas with live spreads / butterflies. The manual surfaces don't disappear in automated mode; they are present and reachable but not the primary surface most of the day.

#### 12.3.1 The Full Manual Order Ticket Family

The complete order entry ticket family from manual mode (see [#2 Order Entry Ticket Framework](common-tools.md#2-order-entry-ticket-framework) and the manual sections of this doc above):

- **Outright ticket** — yield-quoted, with DV01 / carry / roll / repo displayed.
- **Curve ticket** — two-leg DV01-balanced atomic, quoted in bps of spread, with z-score / target / stop / carry visible.
- **Butterfly ticket** — three-leg DV01-balanced or 50/50, quoted in bps, with z-score / fit-residual visible.
- **Basis ticket (cash–futures)** — atomic with conversion-factor awareness; net basis / gross basis / implied repo / CTD-switch risk displayed.
- **Swap ticket** — pay-fixed / receive-fixed, with cleared (LCH / CME / Eurex) vs bilateral selection, IM-estimate, CSA-aware MTM.
- **RFQ workflow** — send to dealer panel via Bloomberg / Tradeweb / MarketAxess; dealer aggregation; time-to-respond per dealer; hit / lift one click; partial-fill reallocation; last-look awareness; post-trade allocation.
- **All order types available:** market, limit, stop, stop-limit, OCO, bracket, GTC, GTD.
- **Hotkeys preserved:** all her manual-mode hotkeys remain bound (hit bid / lift offer; cancel-all-on-tenor; flatten DV01 on a bucket; roll-futures; switch-cleared-vs-bilateral). Speed matters during emergencies.
- **Pre-trade preview:** DV01 by tenor bucket added to book + total DV01 (should be ~0 for curve trades; non-zero is an error condition); convexity / gamma; carry & roll for the structure decomposed by leg; funding cost for cash legs; counterparty / CCP / margin check for swap leg.
- **Smart order router:** routes across CME / Eurex / ICE / LCH / dealer-RFQ for the same logical instrument, aware that cash bonds and matching futures aren't interchangeable.
- **Compliance / pre-trade gates:** restricted-list checks, position-limit checks, sanctions, jurisdictional access (relevant for some EM swap counterparties).

Practically: the manual terminal is a tab in the supervisor console, not a separate application. Ingrid presses a hotkey or clicks an icon → manual ticket family comes up over the current view → she places the trade → the ticket closes back to the supervisor view. **Curve / butterfly / basis tickets are first-class, not buried in the outright ticket.**

#### 12.3.2 Trade Tagging & Attribution

Every manually-placed trade gets a mandatory tag:

- **Emergency intervention** — flagged for post-incident review; auto-included in the day's incident log.
- **Reconciliation** — paired with the algo state being reconciled (which strategy thought it had this position; what the dealer / CCP showed). Reconciliation tickets generate an audit pair.
- **Manual override (event-day)** — the dominant tag for Ingrid. Sub-tags: auction-day / FOMC / ECB / BoE / BoJ / CPI / NFP / GDP / refunding / geopolitical / quarter-end / other. Attached to the calendar event that motivated it.
- **Manual override (directional)** — generic discretionary; tagged with thesis or reason.

Attribution carries the tag through P/L, performance metrics, reports. David's behavioral monitoring tracks the frequency of each tag class — sustained increase in emergency interventions is a leading indicator David investigates. Event-day overrides are expected and budgeted; their frequency is not anomalous for Ingrid the way it would be for Marcus.

#### 12.3.3 Reconciliation Workflow

A specific surface for the reconciliation case, because it's the most error-prone of the three.

**The reconciliation page:**

- **Left panel:** the platform's view — every position the strategies _think_ they have, per CCP, per bilateral counterparty, per futures venue, per cash bond.
- **Right panel:** the venue / dealer / CCP's view — every position the venue _actually_ shows.
- **Diff highlighted:** rows where the two disagree. Discrepancy size in $-notional and DV01.
- **Per-row actions:**
  - "Trust venue" — the platform updates its internal state to match the venue. Strategy state corrected; audit logged.
  - "Trust platform" — the venue is incorrect (rare, but happens during CCP reporting glitches or dealer-confirmation latency); manual reconciliation order placed at the venue to bring it into line. Audit logged.
  - "Investigate" — opens a diagnostic with the relevant fills, cancels, modifies that should explain the divergence. Sometimes the divergence is a legitimate timing-of-acknowledgment issue and resolves on its own; sometimes it's a real bug.
- **Bulk actions** — "trust venue for all CCP X bilateral discrepancies" when the source of divergence is known (e.g. a CCP's reconciliation API returning stale data for a window).

**Auto-trigger:**

- The platform runs continuous reconciliation in the background; minor discrepancies that resolve within seconds (e.g. fill-acknowledgment latency for swap allocation) do not surface.
- Discrepancies above a threshold ($-notional, DV01, or duration) escalate to alerts.
- Ingrid can run a manual full reconciliation (against all CCPs / dealers / venues) on demand — typically end-of-day, after an incident, or before a quarter-end IM-reset.

#### 12.3.4 Emergency Modes

A specific UI mode that Ingrid can switch into during a crisis (see the supervisor console mode-switching, section 14.2).

**Emergency mode reorganizes the screen:**

- **Manual ticket family pinned** — outright + curve + butterfly + basis + swap tickets foveal.
- **Live curve atlas for the focus currency** — foveal, with z-scores / spreads / butterflies updating real-time.
- **Live DV01-bucket position state across all currencies** — second-largest panel, showing what's open and where on the curve.
- **Working orders + open RFQs across all venues / dealers** — what's resting that Ingrid might need to cancel.
- **Strategy intervention console** — pause / kill controls visible.
- **Alert console** — relevant alerts streaming.
- **Latency / connectivity panel** — venue-by-venue and dealer-by-dealer connection state, foveal because in an emergency, one dealer being unreachable changes the play.
- **Per-CCP IM utilization** — visible because in a CCP-margin-spike scenario, IM consumption matters minute-by-minute.

Hotkeys preserved; muscle memory from manual mode is the trader's most valuable asset during a real emergency.

**Switching into emergency mode** is a single keystroke (or audible "go to emergency"). Switching back is one keystroke. Work-in-flight (research notebooks, etc.) preserved; nothing lost.

#### 12.3.5 Manual Trading Hotkeys (Always Available)

Even in default research mode, certain manual-trading hotkeys are global:

- **Open manual ticket family** for currently-focused tenor / curve.
- **Hit bid / lift offer** on quoted instrument.
- **Flatten DV01 on focused tenor bucket** (rates-specific, across all venues / strategies).
- **Cancel-all-on-tenor** / cancel-all-RFQs.
- **Hedge-to-DV01-neutral** focused position (auto-pair against optimal hedge — typically futures).
- **Roll futures position** (calendar-spread-aware).
- **Switch to emergency mode** (keystroke chord; less easily triggered to avoid accidents).

These remain bound regardless of which mode the supervisor console is in. The trader's reflex to react manually is preserved — particularly important on event days where Ingrid will use these hotkeys dozens of times per hour.

#### 12.3.6 Audit & Friction

Manual trading is auditable but not friction-free for non-emergency cases:

- **Emergency interventions** — minimal friction. One confirmation, audit logged.
- **Reconciliation** — friction matched to size; small reconciliations are one-click; large ones require reason field.
- **Event-day overrides** — modest friction: event-tag selection, confirmation gate. Calendar-linked: the event tag is suggested from the calendar event closest in time, reducing typing.
- **Manual override (directional)** — full friction: reason field, confirmation gate, override tag mandatory. The friction reflects the consequence — directional override outside the systematic framework should be a deliberate decision, not muscle memory.

Every manual trade enters the same audit trail as algo trades, with the manual flag and tag class. Searchable, reviewable, exportable for risk-committee or regulator review.

#### 12.3.7 Why this matters

- **Efficiency:** in an emergency or on an event day, seconds to a working curve / butterfly / basis ticket = real PnL preservation. The platform's manual surfaces are first-class even when not the primary surface most of the day.
- **Risk:** reconciliation is a real operational risk in rates — RFQ-fills, dealer-confirmation latency, CCP-allocation timing, and partial-fill reconciliation across multi-leg trades are all places where state can drift. Without a designed reconciliation workflow, positions get lost or mis-tracked; eventually a reconciliation incident produces a real loss. The platform's design prevents this from being a chronic problem.
- **PnL:** the ability to layer high-conviction event-day trades on top of the automated book is **the central value proposition** for Ingrid in automated mode. The systematic book runs the calm; she runs the storms. The platform must support both modes equally well.
- **Platform validation:** if Ingrid can place every trade her strategies make from the manual UI — including curve / butterfly / basis / swap with cleared-vs-bilateral selection and RFQ workflow — the platform's execution layer is verified end-to-end. This is the cleanest integration test of the entire trading stack — manual UI + smart router + venue connectivity + RFQ + execution algos + post-trade attribution + compliance.

### 12.4 Kill Switches at Multiple Scopes

Layered kill switches per [#19 Kill Switches](common-tools.md#19-kill-switches-granular):

- **Per-strategy kill** — cancel all working orders + RFQs + flatten positions on this strategy.
- **Per-strategy-class kill** — flatten the curve-steepener fleet; flatten the swap-spread fleet; flatten the auction-concession fleet.
- **Per-currency kill** — pull all firm activity from this currency (e.g. pull all GBP exposure during a UK political crisis).
- **Per-tenor-bucket kill** — flatten all front-end exposure (e.g. emergency FOMC scenario).
- **Per-CCP kill** — pull all activity from one CCP (CCP-specific incident).
- **Reduce-DV01-to-target** — algo-execute over hours, hedge-preferred to keep cost bounded.
- **Hedge-to-DV01-neutral** — fastest available hedge applied (futures preferred).
- **Cancel-all-RFQs** — across all dealer panels.
- **Fleet-wide kill** — Ingrid's entire automated cousin (all her ~120 strategies). Multi-confirmation.
- **Firm-wide kill** — David + CIO + risk-officer; multi-key authentication for catastrophic events.

Each scope's kill is a designed action: cancel-or-flatten configurable, audit-trail mandatory, reversal procedure documented.

### 12.5 Intervention Audit Log

Append-only log of every intervention. Searchable / filterable / exportable.

- Per-row: timestamp, scope, actor, action, reason, pre-state, post-state, downstream effect (positions closed, P/L impact, working orders / RFQs canceled).
- Used in post-incident review (David's firm-wide replay), regulator request, behavioral self-review (was I over-intervening this quarter?).

### 12.6 Why this matters

- **Efficiency:** intervention scoping (per-strategy / class / currency / bucket / CCP / fleet) lets Ingrid respond proportionately to incidents. She doesn't nuke the whole fleet for one CCP's hiccup or one currency's political event.
- **Risk:** every intervention is auditable. Catastrophe response (UST flash crash, CCP margin cascade, peripheral-debt scare) is designed; the platform has practiced it.
- **PnL:** the cost of over-intervention is missed PnL. The cost of under-intervention is realized loss. Granular controls plus disciplined auditing balance both.

## 13. Post-Trade & Decay Tracking

The feedback loop from yesterday's results into tomorrow's research. Every strategy is evaluated daily / weekly / monthly: did it perform as expected, is it decaying, does it need retraining, is it ready to retire? Decay tracking is what separates a firm that maintains alpha from one that discovers it once and watches it fade. For rates strategies, decay is regime-driven — a strategy that worked in the post-Covid-zero-rates regime may decay smoothly into irrelevance during a hiking cycle.

### 13.1 Per-Strategy Retrospectives

Auto-generated per strategy on a configurable cadence (typically weekly + monthly).

**Layout:**

- **Header** — strategy name, period covered, current stage.
- **Performance vs expectation panel:**
  - Realized Sharpe in the period vs research-time expected distribution. Where today's value falls in the distribution.
  - DV01-adjusted return for the period.
  - Equity curve overlay: realized vs backtest counterfactual (had the historical regime persisted).
- **Carry / roll / yield / curve / spread / convexity P&L decomposition:**
  - Per period: how much P&L came from passive return (carry + roll) vs active return (yield change + curve change + spread + convexity)?
  - Strategies whose realized return is mostly carry-and-roll (with active return near zero) are flagged for thesis review — is the alpha actually there, or is the strategy just collecting carry?
- **Drawdown decomposition:**
  - Recent drawdown periods.
  - Per-drawdown: which trades contributed, what features / regime / executions drove it.
- **Regime fit:**
  - % of period in each regime (CB cycle, vol regime, quarter-end / non-quarter-end); per-regime performance.
  - Regime-fit health score.
- **Capacity realized vs assumed:**
  - Slippage, RFQ-fade rate, fill rate, partial fills.
- **Recent interventions and effect:**
  - What was paused, capped, retrained; observed PnL impact.
- **Drift state:**
  - Feature, prediction, performance drift snapshot.
- **Recommended action:**
  - Continue / retrain / cap / monitor / retire — with rationale.

Ingrid reads these end-of-week, on the strategies needing attention; she skims the others.

### 13.2 Fleet-Level Review

Auto-generated weekly + monthly.

**Layout:**

- **Total PnL decomposition:**
  - By strategy class (curve / butterfly / basis / swap-spread / etc.).
  - By currency.
  - By tenor bucket.
  - By regime.
  - By time-of-day / session (Asia / EU / US).
  - By event-linkage (FOMC trades / CPI trades / auction trades / NFP trades / quarter-end trades).
- **Risk-adjusted contribution:**
  - Per strategy: Sharpe contribution to fleet, marginal Sharpe (if removed, what would fleet Sharpe be).
  - Strategies that contribute Sharpe vs strategies that dilute.
- **Marginal contribution analysis:**
  - "If I added $X DV01 to strategy A, expected incremental Sharpe is Y."
  - Diminishing-returns curves per strategy.
- **Correlation evolution:**
  - Strategies that should be uncorrelated drifting together — particularly important for rates given common balance-sheet-stress / vol-regime factors.
  - Cluster shifts.
- **DV01 utilization across the fleet:**
  - Per-bucket, per-currency, per-strategy-class headroom and utilization.
- **Cross-curve relative performance:**
  - Has the fleet earned alpha cross-currency or just absolute?

Ingrid reads this Sunday evening; informs Monday capital-allocation decisions.

### 13.3 Decay Metrics Surface

A dedicated dashboard for catching decay early.

**Layout:**

- **Sharpe-over-time per strategy** — rolling Sharpe with confidence bands. Statistical-significance flag on declining trend.
- **Half-life estimates** — how long does this alpha persist before halving. Strategies in the bottom quartile (fastest decay) flagged.
- **Feature-importance drift** — features whose importance is shifting per model. Foundational features quietly losing relevance is a leading indicator.
- **Backtest vs live divergence** — point estimate + distribution. Strategies tracking expectation: green. Underperforming: investigated. Overperforming: also investigated (look-ahead leak suspected).
- **Regime-shift decay attribution** — when a strategy starts decaying, which regime variable changed? (Hiking cycle ending; balance-sheet-stress regime ending; CB-language regime change; quarter-end pattern change.) Useful for diagnosing which decays are recoverable (regime will revert) vs structural (regime change is permanent).

This surface is consulted weekly. Decisions: queue retrain, cap, demote to monitor, retire.

### 13.4 Retrain Queue UI

When the platform proposes retraining (drift triggered, schedule triggered, performance triggered), the proposal queues here.

**Layout:**

- **Queue table** — strategy, model version, retrain reason, proposed training data window, estimated compute cost, estimated improvement.
- **Per-row actions:** approve (queues the job in research compute), defer (snooze N days), customize (Ingrid modifies the training data window or hyperparameters before approving), reject (with reason).
- **Auto-approval thresholds** — strategies in monitor / pilot can have auto-approve enabled for routine retrains; live strategies require explicit approval. For rates strategies, auto-approve is conservative — regime-shift retrains warrant human review.
- **Retrain history** — past retrains and their outcomes (did the new version actually outperform the old?).

### 13.5 Retire Decisions

Retirement is a decision — the platform proposes, Ingrid approves.

**The proposal:**

- Decay confirmed (statistical evidence linked).
- Better strategy in the same niche (replacement candidate, if one exists).
- Path to recalibration / retraining exhausted.
- DV01 freed by retirement.
- Regime-shift attribution: is the cause structural (retire) or transient (defer)?

**The approval workflow:**

- Ingrid reviews the retire proposal.
- Approves: strategy moves to retired, DV01 freed, audit logged.
- Rejects: strategy stays, with reason ("regime change might reverse in 3–6 months; give 30 more days").
- Modifies: e.g. "retire the USD instance but keep the EUR instance, the divergence is meaningful — different CB regime."

### 13.6 Why this matters

- **Efficiency:** retrospectives are auto-generated. Ingrid reads, she doesn't compose. The friction of post-trade analysis is what kills the loop in many firms; the platform compresses it.
- **Risk:** decaying strategies are caught by the metric, not by Ingrid's anecdotal sense. Faster intervention = less decay-damage.
- **PnL:** retraining cadence is data-driven. DV01 trapped in dying strategies is recycled into research priorities. The Learn → Decide loop closes. For rates, where regime cycles can run for years, structured retire-vs-defer reasoning is particularly valuable.

## 14. The Supervisor Console — Ingrid's Daily UI

The supervisor console is the integration of all the surfaces above into one workspace. It's not a single new surface; it's the layout / mode-switching / spatial organization of everything described.

### 14.1 Ingrid's Monitor Layout (Illustrative)

A senior rates quant-trader runs 6 monitors. Ingrid's typical automated-mode layout retains the curve atlas as foveal context (her thinking surface from manual mode) but reorganizes around fleet supervision and research.

| Position      | Surface                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Top-left      | **Yield-curve atlas + cross-curve / butterfly z-score heatmap** (the thinking surface, retained)                       |
| Top-center    | **Fleet supervision dashboard** (default amber + red filter) + DV01-bucket × currency matrix                           |
| Top-right     | **Calendar + auction-concession tracker + CB-meeting / event countdown**                                               |
| Middle-left   | **Strategy detail page** (drill-down when investigating) or **research workspace** (notebook environment)              |
| Middle-center | **Capital allocation engine + DV01 budget management + per-CCP IM utilization**                                        |
| Middle-right  | **Anomaly / alerts console + decay surface + promotion-gate queue**                                                    |
| Bottom-left   | **Macro / regime context** — DXY, equities, vol indices (VIX, MOVE, G7 FX vol), commodities, credit spreads, ETF flows |
| Bottom-right  | **News / research feed + comms** (Bloomberg chat / Symphony, sell-side morning notes, internal economist commentary)   |
| Tablet        | Bloomberg / Reuters chat for dealer flow color and indications                                                         |

The supervisor console's center of gravity is **fleet supervision + research workspace + calendar**. The manual terminal's center of gravity (curve atlas + curve-trade dashboard + order entry) is now distributed: the curve atlas remains foveal because Ingrid still uses it as her cognitive anchor; the curve-trade dashboard is folded into the strategy detail page; order entry is reachable via hotkey but not foveal-by-default.

### 14.2 Mode-Switching

The console has modes; switching reconfigures the layout (per [#30 Customizable Layout](common-tools.md#30-customizable-layout--workspace)):

- **Research mode (default during quiet hours):** notebook environment in foveal positions; curve atlas + supervisor + alerts in periphery; capital allocation collapsed.
- **Supervision mode (alert-driven):** fleet dashboard + strategy detail in foveal positions; research workspace minimized.
- **Auction mode (auction-day):** auction calendar + concession tracker + curve atlas (issuing tenor) + dealer-positioning panel + manual ticket family (curve / butterfly / basis / outright + RFQ workflow) foveal; systematic auction-concession strategies for the issuing tenor visibly paused; intervention console accessible.
- **Event mode (FOMC, ECB, BoE, BoJ, CPI, NFP, refunding, geopolitical):** anomaly console + intervention console + curve atlas + manual ticket family foveal; research minimized; CB-statement-language NLP diff rendered live during press-conference windows; OIS-implied-path drift visible alongside CB-meeting outcomes.
- **Pre-market mode:** fleet review + alerts + calendar + macro context dominant.
- **Post-market mode:** decay + retrospectives + capital allocation + experiment-priority-queue dominant.
- **Quarter-end mode:** XCCY-basis dislocation tracker + repo-special tracker + balance-sheet-stress regime classifier + IM-budget-stress scenario foveal; affected strategies flagged.

Switching is one keystroke. Work-in-flight (open notebooks, pending interventions, pending RFQs) preserved.

### 14.3 Anomaly-Driven Default State

Critical: the console is **green-by-default**. Most of the day on non-event days, Ingrid is heads-down in research; the supervisor surface is quiet. When something goes off, alerts route to her via:

- Banner on screen (auditable).
- Audio (configurable per severity).
- Mobile push (when away from desk).
- Phone page (for catastrophe-tier alerts only — UST flash crash, CCP margin cascade, peripheral-debt scare, fleet-wide kill recommended).

Ingrid trusts the platform's silence. False-positive alerts erode this trust quickly; the platform's tuning of severity / thresholds / suppression is critical to the trader's productivity.

### 14.4 Why this matters

- **Efficiency:** time-on-research is the trader-quant's primary leverage on non-event days. The console design ensures research is foveal-by-default, supervision is peripheral-by-default. This is the inverse of the manual terminal.
- **Risk:** mode-switching to event mode in seconds during an auction or FOMC is the difference between contained event-day exposure and runaway event-day loss.
- **PnL:** the cognitive shift from foveal-curve to peripheral-curve (most days) and back to foveal-curve (event days) is what makes 120 strategies tractable. Without it, scale is impossible. The retained curve atlas honors Ingrid's cognitive style; the supervisor console layered on top preserves her edge while scaling her coverage.

## 15. Ingrid's Automated-Mode Daily Rhythm

Rates is a 24/5 market with a strong session structure: Asia (Tokyo) → London → New York. Ingrid's "day" is bounded by London / NY hours; the strategies run continuously across the session handoffs. **Calendar dominates rhythm** — auction days, CB days, tier-1 release days run differently from quiet days.

### 15.1 Pre-Market (60–90 min, London open or NY open depending on day's calendar)

The day starts with **fleet triage, calendar review, and event-day positioning**, not with watching a curve.

**Fleet review (15–25 min):**

- Glance at supervisor console. Default: most strategies green; investigate amber + red.
- Read overnight session attribution (Asia session for Ingrid): which strategies generated PnL, which detracted, which behaved out-of-distribution. JGB strategies and Asia-session swap-spread strategies are particularly relevant here.
- Read alerts queue from overnight — capacity warnings, feature drift, regime mismatches, infrastructure incidents, CCP-related notifications.
- Make morning decisions: pause this strategy whose drift exceeded threshold; promote that pilot to live; cap this one whose capacity is exhausted.
- Verify all positions are at intended state — no overnight surprises. Particularly critical after BoJ-meeting nights or US-late-day-policy-headlines that may have affected the Asia session.

**Calendar review (10–15 min):**

- Today's calendar: auctions, CB speakers, data releases, refunding announcements.
- Identify event-day overrides needed: which auctions / CB events warrant manual override?
- Set manual-override toggles on the relevant systematic strategies.
- Extend CB-blackout windows if today's expected announcement warrants longer pause.
- Note quarter-end / month-end proximity if relevant.

**Research catch-up (15–25 min):**

- Skim experiment-tracker results from overnight runs. 3–10 backtests / training runs queued each night; results stream in.
- Promote winners (a successful experiment becomes a notebook for further investigation, or a candidate strategy for paper-trading).
- Archive losers with notes on why they failed (institutional memory).
- Review canary-deployment results from yesterday's promotions.

**Macro / regime read (15–20 min):**

- Read morning notes — sell-side rates strategists, internal economist, primary-dealer surveys (when fresh) — through the news feed.
- Identify regime-shift signals (FOMC week, refunding week, peripheral-debt headline, geopolitical event imminent).
- Consider: are any of my strategies fragile to today's regime? Cap them, hedge them, or leave alone.
- Quick check on funding-stress indicators (SOFR-OIS, GC-OIS, repo-special heatmap).

**Promotion-gate decisions (10–15 min):**

- Strategies waiting for promotion sign-off: review the gate evidence, sign off or send back with notes.
- Coordinate with David on any promotions material to firm risk.
- Coordinate with Yuki on cross-domain strategies (rate-FX linkage trades).

**Coffee / clear head:**

- Step away. The cognitive load of the rest of the day is research-heavy or event-heavy; preserve focus.

### 15.2 In-Market (continuous, calendar-and-anomaly-driven)

Two distinct flavors of in-market day: **non-event days** (research-heavy) and **event days** (manual-override-heavy).

#### 15.2.1 Non-event days (most days)

This is the radical shift from manual trading. Most of the day is **research, not supervision**.

**Default state:** trader is in the research workspace. Notebooks open. Working on:

- A new strategy idea (from yesterday's review).
- Feature engineering — a hypothesis to test (e.g. "does the SOFR-OIS spread regime predict next-week swap-spread mean-reversion magnitude?").
- Model retraining for a strategy showing drift.
- Hyperparameter sweep on a candidate model.
- Diagnosing a strategy that underperformed yesterday.
- Reading new sell-side or peer-firm rates research and prototyping ideas.

**Background:** supervisor console is open in another monitor; default green. Curve atlas is in periphery for cognitive-anchor purposes but not actively driving decisions. Alerts route to mobile when the trader is heads-down.

**Alert response (5–10% of the day):** when an alert fires:

- Drill into the strategy detail page.
- Diagnose: is this a true anomaly (intervene) or a known transient (acknowledge)?
- If intervene: pause / cap / replace. Document the decision.
- If known transient: acknowledge with reason; system learns the pattern over time.

**Mid-day capital-allocation review:** glance at the allocation engine's drift indicators. Material drift triggers a rebalance proposal; trader approves or defers.

**Cross-trader coordination:** brief desk-chat exchanges with adjacent archetypes (Yuki on rate-FX linkages; Theo on rates implications of growth-differential calls; Quinn on cross-archetype factor overlap).

#### 15.2.2 Event days (auction days, FOMC, ECB, BoE, BoJ, CPI, NFP, refunding, geopolitical)

The console flips to event mode. Ingrid's day reverts toward the manual rhythm — but with the systematic book providing a **clean baseline** rather than competing for attention.

**Pre-event window (1–4h before):**

- Final calendar / dealer-positioning review.
- Confirm systematic strategies have paused per CB-blackout / auction-window config.
- Set up the manual ticket family for the expected trades — outright outright + curve / butterfly / basis tickets pre-staged in the order entry panel.
- Review the curve atlas. Pre-position any high-conviction trades using manual override (tagged accordingly).
- Coordinate with Yuki if rate-FX linkage matters for today's event.

**Event window (event time + 30–120 min):**

- Manual mode dominant. Ingrid is reading CB statements, watching dealer prints, executing curve / butterfly / basis trades by hand using the manual ticket family.
- Hotkeys + curve atlas + manual ticket + RFQ workflow + multi-curve view + DV01-bucket position panel are foveal.
- Systematic strategies are paused per blackout config; she can see them ready to resume but they don't move.
- Override trades are tagged with event sub-tag (FOMC / ECB / BoE / BoJ / CPI / NFP / refunding / geopolitical).

**Post-event window (event time + 30 min to end-of-session):**

- Wind down event-mode positioning; resume systematic strategies as their blackout windows end.
- Reconciliation pass — verify event-window manual trades are correctly recorded and attributed.
- Quick debrief: what worked, what didn't. Note for the trade journal.

**Liquid-event override (rare but real):** flash crash, peripheral-debt scare, oracle-equivalent data error, mass-CCP margin call. Trader switches to emergency mode:

- Pause sensitive strategies (or let them ride if confident in the model's regime-handling).
- Use manual order entry for any high-conviction directional bet (with override tagging).
- Return to default mode when the event normalizes.

### 15.3 Post-Market (60–90 min, after NY close or before Asia open)

End-of-day review and tomorrow's research priorities.

**End-of-day attribution (15–20 min):**

- Today's PnL decomposition — by strategy class, by currency, by tenor bucket, by regime, by event-linkage.
- Identify outliers — strategies that significantly outperformed or underperformed expectation. Note for retrospective.
- Verify all positions are at intended state.

**Decay check (10–15 min):**

- Run the decay surface: any strategies whose Sharpe trend is concerning?
- Any strategies needing retraining? Approve the retrain queue or queue for overnight.
- Any features whose drift is growing? Consider downstream impact.

**Capital allocation (10–15 min):**

- Review nightly DV01 allocation proposal.
- Approve, modify, or escalate to David.
- Verify DV01 deployed reflects the approved allocation.

**Calendar-driven planning (10–15 min):**

- Review tomorrow's and the next 5 days' calendar.
- Identify tomorrow's event-day overrides.
- Adjust manual-override toggles, CB-blackout extensions, or auction-window configs for tomorrow.
- Note any quarter-end / month-end / refunding-window planning.

**Research-priority setting (15–25 min):**

- Based on the day's findings: what's tomorrow's research priority?
- Queue overnight backtests / training runs (3–8 typically).
- Update experiment-tracker priorities.
- Note any features to add to the library based on today's hypotheses.

**Promotion-gate triage (5–10 min):**

- Strategies ready for promotion review tomorrow morning.
- Gate evidence in place; trader sets reminder.

**Sign-off:**

- Confirm all alerts are acknowledged or resolved.
- Confirm fleet is in expected state for overnight running.
- Hand-off to the next-shift supervisor (Asia coverage) if the firm runs a follow-the-sun model, or rely on automated supervision overnight (with escalation rules to wake the on-call for critical alerts).

### 15.4 Cadence Variations

- **FOMC weeks** — Tuesday research + Wednesday FOMC event-day + Thursday post-FOMC reposition + Friday cleanup. Research-light; supervision + manual heavy.
- **Auction weeks** — typically 3–5 auctions per week across UST tenors; daily event windows during auction times.
- **Refunding weeks** — Quarterly Refunding Statement is a market-moving event; pre-positioning and post-positioning take a meaningful share of the week.
- **CPI / NFP days** — single-event-day rhythm; otherwise normal.
- **Quarter-end / year-end** — balance-sheet-stress regime; XCCY-basis and swap-spread strategies need close supervision; manual interventions more frequent. Quarter-end mode in the supervisor console.
- **Quiet weeks** — research-dominated; the strategies run themselves; Ingrid invests in alpha-generation.
- **Major procurement / data-vendor weeks** — Ingrid spends meaningful time on data-layer evaluation.
- **Cross-CB-divergence weeks** (e.g. Fed hiking while ECB / BoJ are not) — cross-curve RV strategies need close watching; coordination with Yuki on FX implications.

## 16. Differences from Manual Mode

| Dimension                   | Manual Ingrid                                               | Automated Ingrid                                                                                |
| --------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Coverage                    | 5–15 active curve / butterfly / basis trades                | 100+ strategies × 4 currencies × multiple tenor buckets                                         |
| Trades per day              | 5–25 high-conviction                                        | Hundreds across the fleet (most slow-cadence; faster on event days)                             |
| Phase 1 (Decide)            | Reading the curve atlas                                     | Choosing alpha to research; managing portfolio of strategies                                    |
| Phase 2 (Enter)             | Click curve / butterfly / basis ticket                      | Promote strategy through lifecycle gates                                                        |
| Phase 3 (Hold)              | Watching DV01 bucket exposures                              | Anomaly-driven supervision of fleet; carry / roll passive return tracked continuously           |
| Phase 4 (Learn)             | Journaling lessons                                          | Decay tracking, retraining, attribution-driven research priorities                              |
| Time on curve atlas         | 60–80%                                                      | 10–15% (cognitive anchor; primary on event days)                                                |
| Time on research            | 5–10%                                                       | 50–60%                                                                                          |
| Time on supervision         | 10–15%                                                      | 10–15%                                                                                          |
| Time on manual intervention | (continuous on event days)                                  | 10–20% (concentrated on event days; near-zero on calm days)                                     |
| Time on data / procurement  | minimal                                                     | 5–10%                                                                                           |
| Time on capital allocation  | minimal (per-trade DV01 sizing only)                        | 5–10% (fleet-level DV01 allocation across buckets / currencies / classes)                       |
| Latency criticality         | Visible per venue                                           | Per-strategy-class latency tiers, with budget enforcement; tighter on lead-lag-style strategies |
| Risk units                  | DV01 (always was)                                           | Same + per-bucket DV01 + per-currency DV01 + per-CCP IM + correlation cluster                   |
| Edge metric                 | P/L, Sharpe, DV01-adjusted return                           | Same + decay rate, capacity utilization, marginal Sharpe, carry-capture rate                    |
| Cognitive load              | Foveal-on-curve                                             | Peripheral-on-fleet; foveal-on-research-or-anomaly; foveal-on-curve on event days               |
| Failure modes               | Tilt, fatigue, missed event opportunity                     | Silent overfit, decay-blindness, alert fatigue, runaway algo, missed regime shift               |
| Tools mastered              | Curve atlas, curve / butterfly / basis ticket, RFQ workflow | Same + notebook, feature library, model registry, lifecycle gates, allocation engine            |
| Calendar role               | Drives daily decisions                                      | Drives both daily decisions AND systematic strategy schedule (blackouts, auction-window pauses) |
| Compensation driver         | Sharpe + AUM                                                | Same + research velocity + fleet capacity utilization + event-day override quality              |

The fundamental change: **Ingrid stops being the worker on every trade and becomes the principal investor in her own rates fund — while remaining the discretionary trader on event days.** The systematic book runs the calm; she runs the storms.

## 17. Coordination with Other Roles

### 17.1 Coordination with Yuki (Rate-FX Linkages)

Yuki runs the FX desk. Many of Ingrid's strategies carry FX exposure (a USD-funded long Bund position; a JPY-receive swap funded in USD), and many of Yuki's strategies carry rate-sensitivity (carry trades depend on rate differentials; cross-currency basis dislocations affect both desks). They coordinate continuously.

- **Cross-domain correlation matrix shared** — Yuki's fleet vs Ingrid's fleet pairwise correlations visible to both. A rate-differential-driven carry trade and a cross-curve UST-vs-Bund RV strategy may load on the same underlying factor.
- **Quarter-end basis dislocation joint trades** — XCCY basis blowouts at quarter-end create joint opportunities; Ingrid's swap-spread / basis strategies and Yuki's basis-trade strategies need capacity-sharing rules so the firm doesn't double up.
- **Carry-trade unwind risk monitor** — when Yuki's carry-trade fleet is positioned heavily in one direction, Ingrid's front-end strategies should know — a sudden carry-unwind moves rates as well as FX. The platform surfaces this as a shared cross-desk risk indicator.
- **CB-meeting joint coordination** — FOMC / ECB / BoJ events affect both rates and FX; the desks coordinate on event-day positioning to avoid offsetting trades that consume capacity.
- **Cross-currency basis features shared** — Yuki's XCCY-basis features feed Ingrid's swap-spread strategies; Ingrid's repo-special features feed Yuki's funding-cost models.
- **Joint research collaboration** — joint research on cross-domain topics (e.g. SOFR-OIS regime predicting EURUSD basis tomorrow; ECB-language hawkishness predicting bund-OAT spread).

### 17.2 Coordination with Quinn

Quinn runs cross-archetype factor / stat-arb / market-neutral systematic strategies. Some of her strategies overlap with Ingrid's domain (a rates-volatility factor strategy may share inputs with Ingrid's swap-spread models; a global carry-and-curve factor strategy may double up with Ingrid's curve fleet). They coordinate to avoid double-up.

- **Correlation matrix shared** — Quinn's fleet vs Ingrid's fleet pairwise correlations visible to both.
- **Promotion-gate awareness** — Quinn promoting a new global-curve factor strategy alerts Ingrid; if Ingrid's existing strategies would correlate, they negotiate (split capacity, kill one, etc.).
- **Feature sharing** — features Ingrid builds are useful to Quinn (and vice versa); the library is the connector. Quinn's cross-archetype regime classifiers feed Ingrid's regime gates.
- **Research collaboration** — joint research on cross-archetype topics (e.g. global-rates-factor exposure across the firm; cross-archetype carry harvesting; cross-archetype regime classifiers).

### 17.3 Coordination with David

David is the firm-level supervisor. Ingrid's automated cousin is a DV01-allocated fleet within David's purview.

- **Fleet-level reporting** — David sees Ingrid's ~120 strategies aggregated, with health / PnL / DV01-consumed / per-CCP-IM / per-currency-exposure visible.
- **DV01 allocation gates** — material allocation changes (Ingrid's slice of firm DV01 expanding or contracting; per-bucket caps changing) route to David.
- **Behavioral monitoring** — David watches Ingrid's intervention frequency, override frequency, retire-decision pace. Drift in these is a leading indicator. **Event-day overrides are expected and budgeted** for Ingrid; their volume is not anomalous the way it would be for Marcus. David's profile of "normal Ingrid behavior" includes the calendar-driven override pattern.
- **Promotion-gate sign-off for material strategies** — strategies above a DV01-cap threshold require David's sign-off in addition to Ingrid's.
- **Catastrophe response** — firm-wide kill switches require David + CIO + risk officer; Ingrid has fleet-level kill autonomy.
- **Risk-committee deliverables** — Ingrid's monthly attribution + DV01 risk decomposition + lifecycle decisions are inputs to David's committee deck. Per-bucket DV01 distribution and per-CCP IM utilization are recurring committee discussion items.
- **CCP / counterparty risk decisions** — adding a new bilateral counterparty for swaps or sizing exposure to a CCP under stress is a David-level decision; Ingrid contributes the rates-desk view.

### 17.4 Coordination with Theo (cross-asset macro overlap)

Less day-to-day than Yuki, but meaningful: Theo's energy macro view (oil, natgas, refined products) intersects Ingrid's inflation-breakeven strategies and her cross-asset-correlation regime classifiers.

- **Inflation-pass-through features shared** — Theo's view on oil pass-through to CPI feeds Ingrid's breakeven mean-reversion strategies.
- **Cross-asset correlation regime monitoring** — when oil-vol regimes shift, the rates-equity-DXY correlation matrix shifts; both desks see this.

### 17.5 Why this matters

- **Efficiency:** without coordination, the firm builds the same strategy twice across desks, doubles up on capacity, dilutes attribution. Coordination layered on visibility tools (shared correlation matrix, promotion alerts, feature library) is cheap.
- **Risk:** correlated bets across desks compound risk. Visibility prevents the firm from accidentally over-exposing. Cross-currency-basis exposure that "belongs" to neither desk solely is the kind of risk that gets missed without explicit coordination.
- **PnL:** cross-desk research collaboration produces alpha that no single desk could find alone — particularly across rate-FX linkages and inflation-energy linkages.

## 18. How to Use This Appendix

When evaluating Ingrid's automated terminal (against any platform — including our own):

**Data layer:**

- Are sovereign yield archives (FRED, Bundesbank, BoJ, BoE, AFT, Banca d'Italia) cataloged with quality / lineage / cost / freshness / used-by tracking?
- Are swap-curve archives (Bloomberg, Tradeweb, LCH / CME / Eurex), OIS curves, repo / SOFR / €STR / SONIA / TONA tick data, and inflation-linker archives present and quality-monitored?
- Are auction histories (Treasury, DMO, Bundesbank, AFT, JGB) fully archived with bid-to-cover / dealer-share / tail data?
- Are CFTC primary-dealer surveys and NY Fed primary-dealer data integrated?
- Is the procurement dashboard a serious tool, with attribution-vs-cost evidence?
- Is gap analysis tied to concrete strategies that can't be deployed?

**Feature library:**

- Are Ingrid's features (swap-spread z-scores, curve-slope z-scores, butterfly fit-residuals, basis-z, repo-special-z, dealer-position-z, CB-language-hawkishness, breakeven-residuals) first-class with drift monitoring?
- Is the feature engineering surface frictionless inline-in-notebook?
- Is cross-pollination across desks supported (Yuki's XCCY features, Theo's energy-pass-through features, Quinn's cross-archetype regime features)?

**Research workspace:**

- Can Ingrid go from idea to validated rates strategy in hours, not weeks?
- Is the backtest engine realistic (multi-leg atomicity, RFQ-fade modeling, CCP-clearing simulation, repo-cost modeling, conversion-factor / CTD-aware basis simulation)?
- Are anti-patterns (lookahead, survivorship — including delisted CTDs and retired benchmarks, regime over-fit, p-hacking) caught by the platform?
- Is the strategy-template library populated with rates-specific templates (curve, butterfly, basis, swap-spread, asset-swap, auction, repo, cross-curve, XCCY, OIS-vs-guidance, inflation)?

**Model registry & experiment tracker:**

- Can any model be re-trained from registered inputs and produce a bit-identical result, including across regime windows back to pre-GFC?
- Are old versions never deleted (rates strategies often outlive multiple regime cycles)?
- Does the experiment tracker make Ingrid's research process honest and defensible, including over multi-year regime windows?

**Strategy composition:**

- Is the composition surface visual + code-droppable, with **leg structure made explicit** for curve / butterfly / basis / swap-spread strategies?
- Does pre-deployment validation catch lookahead, unbounded sizing, missing kill-switches, and **DV01-balance violations** for multi-leg trades?
- Are CB-meeting blackouts, auction-window pauses, and quarter-end blackouts first-class schedule primitives?
- Is **curve visualization integrated** with the composition surface so Ingrid sees the strategy's positioning on the live curve while composing?
- Are crypto-style ad-hoc strategies firewalled out of the rates fleet (no accidental crypto contamination)?

**Lifecycle:**

- Is the pipeline visualization (research → paper → pilot → live → monitor → retired) usable as a daily kanban board?
- Are gates checklists with evidence — including multi-regime walk-forward evaluation — not chat conversations?
- Is rollback one-click?

**Capital allocation:**

- Does the allocation engine propose a nightly **DV01-distributed** portfolio with risk-decomposition + marginal-Sharpe analysis?
- Is **per-tenor-bucket × per-currency × per-strategy-class DV01 budgeting** a first-class operational tool?
- Are CCP / IM-budget management and bilateral CSA-MTM exposure tracked per counterparty?
- Is per-CCP cross-margin benefit considered when proposing new strategies?

**Live fleet supervision:**

- Can Ingrid supervise 120+ strategies anomaly-driven, default green, with rates-specific columns (DV01 deployed, carry P&L MTD, spread / z-score at last action, distance to next auction / CB blackout)?
- Is the strategy detail page a complete diagnostic surface, including **live curve visualization with positioning**?
- Are anomalies severity-routed with auto-actions on critical?
- Is **DV01-bucketed fleet view + calendar live state** foveal in supervision mode?
- Is **cross-curve correlation monitoring** part of the cross-strategy correlation surface?
- Is **strategy state inspection** (internal variables, current feature snapshot, recent signal evaluations, regime classifier output, manual-override-status for auction strategies) available on demand per strategy?
- Is **backtest-vs-live comparison** computed (daily by default, on-demand available) for divergence catching, with **carry / roll / mark-to-market split** built into the comparison?
- Is the platform pragmatic about state-streaming load (refresh-on-demand and event-pushed, not constant streaming for all 120 strategies)?

**Intervention console & manual trading:**

- Are kill switches granular (strategy / class / currency / tenor-bucket / CCP / fleet / firm) with multi-key authentication for the largest scopes?
- Are rates-specific interventions present — **reduce-DV01-to-target**, **hedge-to-DV01-neutral-on-bucket**, **flatten-DV01-on-tenor-bucket** — as first-class actions?
- Is **the full manual order ticket family** (outright + curve + butterfly + basis + swap with cleared-vs-bilateral + RFQ workflow with dealer aggregation + multi-leg pre-trade preview with DV01 / convexity / carry / IM) preserved and one-keystroke-reachable from the supervisor console?
- Is **emergency mode** a designed UI mode with manual ticket family + curve atlas + DV01-bucket position panel + open-RFQ panel + per-CCP IM utilization foveal?
- Is **auction mode** a designed UI mode with auction calendar + concession tracker + curve atlas + dealer-positioning + manual ticket family foveal, with systematic auction-concession strategies for the issuing tenor visibly paused?
- Is **event mode** a designed UI mode with CB-statement-language NLP diff rendered live during press-conference windows, OIS-implied-path drift visible, and intervention console accessible?
- Is **reconciliation** a designed workflow (algo state vs CCP / dealer / venue state, with diff highlighting in DV01 terms and per-row actions)?
- Is every manual trade tagged (emergency / reconciliation / event-day with sub-event-tag / directional override) and auditable, with attribution flowing through to performance reports and David's behavioral monitoring?
- Are global manual-trading hotkeys (flatten-DV01-on-bucket, cancel-all-on-tenor, hedge-to-DV01-neutral, roll-futures, open-manual-ticket) bound regardless of the supervisor console's current mode?
- Is every intervention logged with timestamp / actor / action / reason / pre-state / post-state?
- Is the **manual-override toggle for auction-concession strategies** (per-auction, set from the calendar UI) a first-class workflow?

**Post-trade & decay:**

- Are retrospectives auto-generated, not composed?
- Is **carry / roll / yield / curve / spread / convexity P&L decomposition** the default attribution view in retrospectives?
- Is decay caught by metrics, not gut, with **regime-shift decay attribution** built in (so Ingrid can distinguish recoverable from structural decay)?
- Is the retrain queue actionable, with auto-approval for routine retrains and explicit approval for live strategies — and conservative defaults for regime-shift retrains?

**Supervisor console:**

- Is research foveal-by-default and supervision peripheral-by-default on non-event days?
- Is the **curve atlas retained in periphery** as Ingrid's cognitive anchor?
- Is mode-switching one keystroke (research / supervision / auction / event / pre-market / post-market / quarter-end)?
- Is the platform green-by-default and trustworthy in its silence?

**Daily rhythm:**

- Can Ingrid actually spend 50–60% of her time on research while the fleet runs supervised in the periphery — on non-event days?
- Are pre-market / in-market / post-market workflows supported by the right surfaces in the right modes?
- Are event-day workflows (auction / FOMC / ECB / BoE / BoJ / CPI / NFP / refunding / quarter-end / geopolitical) explicitly supported by event-mode layouts and pre-staged manual-ticket configurations?
- Is calendar-driven planning (tomorrow's overrides, blackout extensions, manual-override toggles) a first-class daily workflow?

**Coordination:**

- Is Ingrid's fleet visible to Yuki, Quinn, David, Theo at the right level of detail?
- Are cross-desk correlation, promotion alerts, feature sharing first-class?
- Is **rate-FX linkage coordination with Yuki** supported by shared correlation-matrix + carry-trade-unwind risk monitor + joint quarter-end basis dislocation tooling?

**Cross-cutting:**

- Is lineage end-to-end (data → feature → model → strategy → trade → P/L)?
- Is reproducibility guaranteed across multi-year regime windows?
- Are audit trails non-negotiable, including event-day override tagging?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
