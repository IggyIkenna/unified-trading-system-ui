# Trader Archetype — Ingrid Lindqvist (Senior Rates Trader, G10 Sovereigns + Swaps)

A reference profile of a top-performing rates trader at a top-5 firm. Used as a yardstick for what an ideal **fixed-income / rates** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For sister archetypes on the same desk, see the other `trader-archetype-*.md` files in this folder.

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

Rates is a **dense, jargon-heavy** market with fewer instruments but more relationships. A rates trader holds in mind:

- The current yield curve and its recent path.
- The forward curve (what the market expects yields to be at future dates).
- The OIS curve (risk-free policy rate expectations).
- The swap curve and swap spreads.
- Cross-currency basis (e.g. USD vs EUR).
- Inflation breakevens and real yields.
- Auction supply schedule and primary dealer positioning.
- Central bank speakers and their forward guidance.

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

### Yield curves (the primary thinking surface)

For each currency/sovereign:

- **Spot yield curve** — current yields by tenor (3m, 6m, 1y, 2y, 3y, 5y, 7y, 10y, 20y, 30y).
- **Curve overlay** — current vs 1d / 1w / 1m / 1y ago, vs YTD-high/low.
- **Forward curve** — implied yields N years forward.
- **OIS curve** — overnight index swap, proxy for risk-free policy rate path.
- **Real yield curve** — TIPS-style, separating inflation expectations.
- **Inflation breakeven curve** — nominal minus real, market-implied inflation.
- **Curve shape metrics** — slope (2s10s, 5s30s), curvature (2s5s10s butterfly), level (10y).

She toggles between **"yield space"** (where she usually lives) and **"price space"** (when discussing futures or cash bonds with PnL implications).

### Curve trade dashboard

Spreads as first-class instruments:

- **Steepeners / flatteners** — every relevant pair (2s10s UST, 2s10s bund, 5s30s, etc.) with current value, recent path, z-score vs 1m/3m/1y history.
- **Butterflies** — 2s5s10s, 5s10s30s — with z-scores and historical fit.
- **Cross-curve spreads** — UST 10y vs bund 10y, UST 10y vs gilt 10y, etc.
- **Swap spreads** — UST yield minus same-tenor swap, by tenor. Reflects credit/funding/balance-sheet risk.
- **Asset swap spreads** — bond yield to maturity vs swap, key for relative value.
- **Cross-currency basis** — XCCY swap basis (e.g. EURUSD basis) — funding cost differentials.

For each spread/fly: **z-score history**, **rolling vol of spread**, **regression against macro factors**.

### Auction calendar (huge for a rates trader)

The Treasury / DMO supply schedule shapes trades:

- **Upcoming auctions** with size, tenor, expected demand metrics (bid-to-cover, indirect/direct/dealer share).
- **Auction date countdown.**
- **Pre-auction concession** — has the curve cheapened pre-auction (typical) or richened (unusual)?
- **Post-auction performance tracker** — recent auctions' subsequent performance.
- **Primary dealer positioning** (CFTC / NY Fed data) — are dealers long or short going into auction?

### Central bank calendar

- **FOMC, ECB, BoE, BoJ, BoC, RBA, RBNZ, SNB, Riksbank, Norges** — meeting dates, expected policy rate, statement-release time, press conference time.
- **Speaker calendar** — every scheduled speech, with hawk/dove tag from prior speeches.
- **Forward guidance tracker** — recent shift in language ("data-dependent," "patient," "soon," etc.).
- **Implied rate path** from OIS — what the market expects from each central bank by each meeting.
- **Rate-cut/hike pricing** — probability of 25bps move at each meeting.

### Economic data calendar

- **Tier-1 releases** — CPI, NFP, GDP, PCE, retail sales — with consensus, prior, expected reaction.
- **Tier-2 releases** — manufacturing PMIs, regional Fed surveys, housing data.
- **Pre-release positioning** — is the market positioned hawkish or dovish heading in?
- **Surprise indices** — Citi Economic Surprise Index for context.
- **Data heatmap** — green/red grid of recent data vs expectations.

### Cross-market context

- **Equities** (SPX futures, Nasdaq) — risk-on / risk-off proxy.
- **Vol indices** — VIX (equity vol), MOVE (rates vol), G7 FX vol — vol regime is critical for rates.
- **Commodities** — oil, gold (real-yield proxy).
- **DXY** — dollar strength, FX-rates linkages.
- **Credit spreads** — IG / HY / emerging-market — risk appetite proxy.
- **Inflation expectations** — breakevens, inflation swap fixings, oil-as-proxy.

### Positioning data

- **CFTC Commitment of Traders** — dealer / asset-manager / leveraged-fund positioning by contract.
- **Primary dealer surveys** — NY Fed survey of dealers' rate forecasts.
- **Asset manager flows** — bond fund inflows/outflows.
- **Pension / insurance positioning** — long-end demand context.

### Sell-side research

- **Morning notes** from IB rates strategists.
- **Trade ideas** with recent track records.
- **Curve forecasts** consensus.
- **Themes** flagged by multiple desks.

**Layout principle for Decide:** curves and the calendar are foveal. Spreads/butterfly z-scores are scanned for opportunities. Macro context is constant peripheral.

---

## Phase 2: Enter

Rates execution is fundamentally **multi-leg**, **DV01-balanced**, and **venue-fragmented** (cash bonds vs futures vs swaps trade differently).

### Outright ticket

- **Instrument selector** — UST 10y cash, TY future, USD 10y swap (all "10y rates" but different products).
- **Quote in yield** primarily, **price** secondary.
- **DV01 of the trade** displayed prominently.
- **Repo / financing rate** for cash bonds (overnight cost to carry).
- **Carry & roll-down** — expected return from passive holding.
- **Pre-trade preview:** DV01 added to book, curve exposure (which tenor bucket), sector exposure.

### Curve ticket (steepener / flattener)

- **Two legs**: e.g. long 2y, short 10y (steepener).
- **DV01-balanced sizing** — automatic; user specifies total DV01 or notional of one leg.
- **Spread quoted in bps** — entry, exit, target.
- **Live spread vs entry**, vs z-score history.
- **Carry analysis** — does the trade pay or cost to hold? Forward path of the spread.
- **Atomic execution** — both legs go in coordinated.

### Butterfly ticket

- **Three legs** — e.g. long 2y, short 5y (×2), long 10y.
- **DV01-balanced**; ratio computable from spec.
- **Quoted in bps** of butterfly spread.

### Basis ticket

- **Cash–futures basis** — long bond, short future (or vice versa).
- **Conversion factor** awareness — futures have CTD (cheapest-to-deliver) mechanics.
- **Net basis, gross basis, implied repo** displayed.
- **Roll calendar** — when to roll a futures position.

### Swap ticket

- **Pay fixed / receive fixed** as primary action.
- **Tenor selection.**
- **Notional and DV01.**
- **Counterparty selection** — bilateral or cleared (LCH / CME).
- **Execution venue** — RFQ vs central limit order book vs voice.

### RFQ workflow (huge for rates)

Many rates trades are RFQ:

- **Send RFQ** to dealer panel via Bloomberg / Tradeweb / MarketAxess.
- **Quote aggregation** — best bid / offer, dealer attribution (or anonymized).
- **Time-to-respond** with each dealer.
- **Hit / lift** with one click.
- **Post-trade allocation** if multi-account.

### Pre-trade preview (multi-leg)

For curve trades, the ticket shows:

- DV01 by tenor bucket added to book.
- Total DV01 added (should be ~zero for curve trades).
- Convexity / gamma added.
- Carry & roll for the structure.
- Funding cost for the structure.
- Compliance / counterparty / margin checks.

### Algos for rates

- **TWAP / VWAP** for futures.
- **Iceberg** for cash treasuries.
- **Auction-aware** — defer execution before/during auction window.
- **Roll algos** for futures (calendar-spread-aware).

### Hotkeys

- Hit bid / lift offer on quoted instrument.
- Cancel all on instrument.
- Flatten DV01 on a tenor.
- Roll futures position.

**Layout principle for Enter:** the curve / butterfly / basis tickets are first-class, not buried in the outright ticket. Multi-leg execution is atomic. RFQ workflow integrated.

---

## Phase 3: Hold / Manage

Rates positions evolve through carry, roll-down, and event-driven repricing. Ingrid manages **DV01 buckets**, not individual positions.

### Positions blotter — DV01 bucketed

- **By tenor bucket** — 0–2y, 2–5y, 5–10y, 10–20y, 20–30y.
- **By currency** — USD, EUR, GBP, JPY.
- **By instrument type** — cash, future, swap.
- **DV01 per bucket**, total DV01.
- **Convexity per bucket.**
- **Drill-down to individual positions.**

### Position list — granular

- Instrument, side, notional, mark, yield, DV01, convexity, P/L.
- Carry P/L (passing of time).
- Roll-down P/L (moving along curve).
- Spread P/L (vs reference instrument).

### Live PnL — rates-style decomposition

- **Carry** — passive return from holding.
- **Roll-down** — gain from rolling along a positive-sloped curve.
- **Yield change PnL** — from market moves.
- **Curve change PnL** — from shape changes.
- **Spread PnL** — for relative-value trades.
- **Convexity PnL** — second-order from large yield moves.
- **Funding cost** — repo / xccy.

### Risk panel — multi-dimensional

- **Total DV01** vs limit.
- **DV01 by tenor bucket** — duration distribution across the curve.
- **DV01 by currency.**
- **Cross-currency basis exposure.**
- **Convexity** — book-level, by bucket.
- **Stress scenarios** — parallel shift +/-100bps; bull steepener; bear flattener; twist; central bank surprise (50bps cut/hike).
- **Spread risk** — exposure to swap spreads, asset swaps, cross-currency basis.
- **Liquidity profile** — how fast the book unwinds at typical bid-ask.
- **Counterparty exposure** for OTC swaps.
- **Margin / collateral** consumption across CCPs.

### Auction / event positioning

- **Pre-auction position** for upcoming Treasury supply.
- **Pre-FOMC position** — net long/short the rate-cut probability.
- **Pre-CPI position** — direction of inflation-sensitivity.
- **Position-vs-consensus** — is she with the herd or against?

### Hedging surface

- **Hedge ratios** — for cash positions, futures hedge against yield moves.
- **Cross-hedges** — hedging duration with futures vs swaps.
- **Hedge slippage tracker** — cost of imperfect hedges.

### Alerts

- **Yield level alerts** — 10y crosses 4.5%, 2y crosses 5%.
- **Spread alerts** — 2s10s steepener z-score > 2.
- **Auction result alerts** — bid-to-cover surprise, tail.
- **Central bank speaker headlines** — flagged hawkish / dovish.
- **Economic data surprise alerts.**
- **Repo / funding alerts** — special bonds, balance-sheet stress.
- **Cross-market alerts** — VIX spike, equity rout (rates-equity correlation regime).
- **Risk limit alerts** — DV01 by bucket, convexity, stress scenarios.

### Trade journal

- Per trade / theme: thesis, expected catalyst, invalidation, target spread.
- Updated around major events.

### Communications

- **Bloomberg chat / Symphony** integrated.
- **Sell-side desk chat** — flow color, axes, indications.
- **Internal economist** notes attached to upcoming events.

### Heatmap of own book

- DV01 distribution by tenor / currency.
- P/L attribution by trade theme today.

### Kill switches

- **Reduce DV01 to target** — algo-execute over hours.
- **Hedge to neutral** — fastest available hedge applied.
- **Cancel all working** — RFQs and limit orders.

**Layout principle for Hold:** DV01-bucketed risk panel + curve / spread positions are foveal. Calendar & alerts peripheral.

---

## Phase 4: Learn

Rates post-trade analytics emphasize **regime fit**, **carry-vs-vol decisions**, and **execution quality** (especially for size).

### Trade history

- Every trade with curve / spread context at entry and exit.
- Tagged by trade type (outright, curve, butterfly, basis, swap-spread).
- Linked to the calendar event that motivated it (if any).

### PnL attribution

- **Carry vs roll-down vs yield change** — passive vs active P/L.
- **By trade type** — outright vs curve vs butterfly vs basis.
- **By tenor** — short-end vs belly vs long-end skill.
- **By currency.**
- **By regime** — risk-on / risk-off, hiking / cutting cycle.
- **By event** — FOMC trades, CPI trades, auction trades, payrolls trades.

### Performance metrics

- Sharpe, Sortino, Calmar.
- Hit rate by trade type.
- **DV01-adjusted return** — return per unit of DV01 risk taken.
- **Information ratio** vs benchmark (e.g. Bloomberg Treasury Index).
- **Carry capture** — what fraction of available carry was earned.

### Curve trade analytics

- **Spread mean-reversion analysis** — when did the spread return to fair?
- **Half-life of curve dislocations.**
- **Stop-out frequency** vs target hit frequency.

### Auction trade analytics

- Pre-auction vs post-auction P/L by trade.
- Tail size vs subsequent direction.
- Concession sized correctly?

### Event trade analytics

- **FOMC trade outcomes** — was she right on direction? On magnitude?
- **CPI / NFP trade outcomes** — by surprise direction and surprise magnitude.

### Execution quality

- **TCA per trade** — fill vs mid at decision time.
- **Dealer scorecard** — RFQ best-quote frequency by dealer.
- **Auction primary participation** — competitive vs non-competitive bid outcomes.
- **Roll efficiency** — cost of futures rolls vs theoretical.

### Carry vs vol decisions

- **Trades with positive carry that lost money** — was the vol underpriced?
- **Trades with negative carry that worked** — was the conviction worth the bleed?

### Reports

- Daily P/L commentary.
- Weekly portfolio / curve-positioning review.
- Monthly performance attribution (carry, roll, yield, curve, basis).
- Quarterly investor / committee letter contribution.
- Compliance / regulatory filings.

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
