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
