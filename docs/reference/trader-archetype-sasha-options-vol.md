# Trader Archetype — Sasha Volkov (Senior Options & Volatility Trader)

A reference profile of a top-performing options/volatility trader at a top-5 firm, used as a yardstick for what an ideal options & vol trading terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For sister archetypes on the same desk, see the other `trader-archetype-*.md` files in this folder.

---

## Who Sasha Is

**Name:** Sasha Volkov
**Role:** Senior Options / Volatility Trader
**Firm:** Top-5 global trading firm
**Book size:** $200M – $500M of options notional, with delta hedging in spot/perps
**Style:** Discretionary + semi-systematic. Trades vol, not direction. Multi-day to multi-week horizons.
**Primary venues:** Deribit (BTC/ETH options dominant), CME, Binance options, Bybit options, on-chain options (Lyra, Aevo, Premia)

### How she thinks differently

Sasha doesn't think in price terms; she thinks in **vol terms**. To her:

- A call option is a **bet on realized vol exceeding implied vol**, not a bet on direction.
- The IV surface (skew, term structure, kurtosis) is a topographical map of fear, leverage, and supply/demand for tail risk.
- Every position is decomposed into **greeks** — delta, gamma, vega, theta, vanna, volga, charm — each managed somewhat independently.
- She profits from **mispriced vol** (selling rich, buying cheap), **gamma scalping** (capturing realized vol via delta hedging), **structural flows** (knowing who needs to buy/sell vol and when), and **relative-value spreads** (calendar, skew, butterfly).

Her edge is **a model of fair vol** — across strikes, tenors, and underlyings — and the discipline to trade only the deviations.

### Her cognitive load

Vol traders manage a **multi-dimensional book**. A 50-leg options book has greeks to manage in delta, gamma, vega (and vega-by-tenor and vega-by-strike), theta, plus second-order greeks. The terminal must aggregate this without losing the trader's ability to see structure.

The hardest part is **vega-by-tenor / vega-by-strike**: knowing not just total vega but where on the surface that vega lives.

---

## Physical Setup

**6 monitors**, dominated by **surface visualizations** rather than price charts.

| Position      | Surface                                                                             |
| ------------- | ----------------------------------------------------------------------------------- |
| Top-left      | **IV surface** (3D or heatmap) — current vs historical, multiple underlyings tabbed |
| Top-center    | **Term structure & skew curves** — IV by tenor, IV by strike, ATM vol per tenor     |
| Top-right     | **Greeks book — by underlying, by tenor, by strike**                                |
| Middle-left   | **Realized vs implied vol** — RV cones, IV cones, vol risk premium history          |
| Middle-center | **Positions, hedges, scenario PnL** — multi-leg structures decomposed               |
| Middle-right  | **Order entry — multi-leg structure builder, options-native**                       |
| Bottom-left   | **Underlying spot/perp/futures context** — Marcus-style condensed                   |
| Bottom-right  | **Options flow tape** — large prints, dealer positioning, gamma/vanna walls         |
| Tablet        | Desk chat                                                                           |

The IV surface gets prime real estate. That's her chart.

---

## Phase 1: Decide

### Volatility surfaces (the primary thinking tool)

For each underlying:

- **3D IV surface** — strike × tenor × IV. Pannable, slice-able.
- **Skew slices** — IV vs strike at fixed tenors (today, 1w, 1m, 3m, 6m).
- **Term-structure slices** — IV vs tenor at fixed deltas (10Δ put, 25Δ put, ATM, 25Δ call, 10Δ call).
- **Surface delta vs yesterday / vs week ago** — what changed and where?
- **Surface vs historical distribution** — current skew at 1m vs 5y distribution. Is 25Δ risk-reversal at 95th percentile?
- **Smile dynamics overlay** — sticky-strike vs sticky-delta vs sticky-moneyness mode shift indicators.

### Realized vs implied vol

- **Realized vol cones** — 1d, 7d, 30d, 90d realized at multiple horizons, with percentile bands.
- **IV cones** — same but for implied.
- **Vol risk premium time series** — IV minus subsequent realized, the structural alpha source.
- **VRP by tenor and by underlying.**
- **Realized correlation** — between BTC and ETH realized vols, signals dispersion trades.

### Term structure analytics

- **Forward variance curve** — implied vol forward-forward, normal vs inverted.
- **Calendar spread board** — front-month vs back-month vol differential, vs historical.
- **Variance term structure shape** — contango / backwardation, with regime label.

### Skew analytics

- **25Δ risk reversal** by tenor and underlying — fear gauge.
- **Butterfly** (strangle minus straddle) — kurtosis premium.
- **Put skew vs call skew** decomposed.
- **Skew vs realized skew** — does the market price tail correctly?

### Options flow & positioning

- **Large prints tape** — every options trade above $500k notional, with strike, tenor, side inferred.
- **Block trade feed** — Deribit / Paradigm blocks.
- **Dealer gamma exposure** estimate — where gamma is concentrated, where pinning risk exists.
- **Vanna / charm walls** — strikes where dealer hedging will dominate flow.
- **Open interest by strike / tenor** with daily change.
- **Put/call OI ratio** time series.
- **Max-pain / gamma-exposure (GEX) levels.**

### Macro / event context

- **Event calendar** with **expected move** computed from straddle prices: "FOMC move pricing 1.4%, historical avg 1.1%."
- **Earnings / unlock / fork** dates with implied IV pricing the event.
- **DVOL / VVIX / MOVE** — vol-of-vol indicators.
- **ETF options flow** for institutional positioning context.

### Strategy library

Saved structures she trades repeatedly:

- Long straddle / strangle.
- Short premium (covered call, cash-secured put, iron condor, iron butterfly).
- Vertical spreads (call spread, put spread).
- Calendar spreads (long back, short front).
- Diagonal spreads.
- Risk reversals.
- Ratios and back-spreads.
- Custom multi-leg structures.

Each structure has a **template** in the order ticket.

**Layout principle for Decide:** the IV surface and skew/term curves dominate her attention. Realized-vs-implied is the source of her edge thesis. Flow tape provides confirmation or contradicting evidence.

---

## Phase 2: Enter

Options entry is fundamentally different from spot/perp entry — every order is **multi-leg by default**, and pricing is **vol-quoted**, not price-quoted.

### Multi-leg structure builder

- **Pick a template** (straddle, condor, custom).
- **Fill in parameters** — underlying, expiry, strikes, ratios.
- **Live structure preview**: net debit/credit, max profit, max loss, breakeven(s), ROI, days to expiry.
- **Vol-quoted entry** — the trader specifies "buy at 62 vol" not "buy at $1430." The ticket converts.
- **Greeks of the structure**: net delta, gamma, vega, theta, vanna at entry.
- **Implied vol of each leg** displayed alongside price.

### Pricing context shown inline

- **Mid mark vs traded prices** for each leg.
- **Bid-ask in vol terms** (more meaningful than bid-ask in $ for low-delta options).
- **Comparable strikes / tenors** as sanity check.
- **Recent prints** at this strike.

### Block / RFQ workflow

For larger structures:

- **RFQ to dealer panel** — request quotes from multiple dealers / market makers (Paradigm, on-chain RFQ).
- **Quote aggregation view** — best bid / best offer across dealers.
- **One-click execute** with the chosen counterparty.
- **Post-trade allocation** to sub-accounts.

### Delta hedging at entry

- **Auto-hedge on fill** option — system buys/sells underlying spot/perp to neutralize delta the moment the option fills.
- **Hedge venue selection** — cheapest spread / lowest fees right now.
- **Hedge ratio override** — sometimes she wants residual delta intentionally.

### Pre-trade greeks impact

The ticket shows: _"this structure adds:"_

- Net delta to book.
- Net gamma.
- Net vega total + by tenor + by strike.
- Net theta.
- Net vanna / volga.
- Pin risk if held to expiry.
- Max loss in stress scenarios.

### Algos for options

- **VWAP / TWAP** for legging into large structures.
- **Vol-pegged orders** — leave a quote at "buy 62 vol or better" — the engine adjusts $-price as underlying moves.
- **Iceberg with dealer-aware size** — don't show your full hand to the dealer panel.

### Hotkeys

- Quick close current structure.
- Roll structure forward (close current, open same in next tenor).
- Delta-hedge now.
- Vega-flatten (close highest-vega leg).

### Kill switches

- **Close all options** — not realistic instantly (illiquid), so this triggers an unwind algo with progress display.
- **Stop new options orders.**
- **Flatten delta** — instant via spot/perp.

**Layout principle for Enter:** the structure builder is central. Vol-quoted prices, not $-quoted. Delta-hedge integration is mandatory.

---

## Phase 3: Hold / Manage — managing the greek surface

Sasha's positions don't sit still. Even if the underlying doesn't move, **theta bleeds** every second, and **vega**, **vanna**, **charm** evolve. She's continuously rebalancing.

### Greek book — the master view

A multi-dimensional table:

- **Total greeks** (delta, gamma, vega, theta, vanna, volga) of the entire book.
- **Greeks by underlying.**
- **Vega by tenor** — how much vega in 1w, 1m, 3m, 6m. Critical for understanding term-structure exposure.
- **Vega by strike** — concentrated near ATM? Skew concentrated? Tail-heavy?
- **Gamma by underlying** — both magnitude and convexity sign.
- **Cross-greeks** — vanna (delta sensitivity to vol), charm (delta sensitivity to time), color (gamma decay).

### Position list — leg level + structure level

- **Structure-level view** — "BTC 1m 60-70k call spread, +$50k vega."
- **Leg-level drill-down** — each option contract: expiry, strike, side, size, mark, IV, greeks.
- **Realized vs entry P/L by structure** — realized so far, unrealized.
- **PnL attribution per structure** — how much from delta, gamma, vega, theta.

### Live PnL — greek-attributed

This is the unique-to-vol-traders panel. Daily PnL split into:

- **Delta PnL** — directional, ideally near zero if she's hedged.
- **Gamma PnL** — captured from delta-hedging realized moves.
- **Vega PnL** — vol moves vs her vega exposure.
- **Theta PnL** — predictable decay.
- **Higher-order PnL** — vanna, volga, residual.
- **Hedging cost** — spread / fees on delta hedges.

A vol trader who can't decompose daily PnL into these buckets cannot improve.

### Scenario / stress panel

- **PnL grid:** rows = underlying spot moves (-20% to +20%), columns = vol changes (-10v to +10v).
- **Surface stress scenarios:** parallel skew shift, term-structure flattening, smile widening.
- **Event scenarios:** "FOMC: spot ±2%, vol ±5v simultaneously" → predicted PnL.
- **Greek evolution over time** — what will my vega look like in 1 week as today's options decay?

### Delta-hedging surface

- **Current delta** vs target (usually zero, sometimes intentional).
- **Hedge orders working** — orders waiting to delta-hedge as underlying moves.
- **Dynamic hedge bands** — auto-hedge when delta exceeds X.
- **Hedging cost realized today** vs theoretical (smaller is better).
- **Gamma-scalping PnL** — realized vol captured via hedging vs implied vol paid.

### Risk panel

- **Vega limits** by underlying, by tenor, by strike bucket.
- **Gamma limits** — max book gamma.
- **Pin risk** — close to expiry, large positions near a strike.
- **Liquidity risk** — what % of book could be unwound in a day at current depth.
- **Tail scenarios** — Black Monday, Covid crash, FTX collapse — book PnL applied.

### Alerts

- **Greeks crossing thresholds** — vega above limit, delta drift.
- **IV moves** — sudden IV spike on a position.
- **Event countdown** — earnings / unlock / FOMC approaching.
- **Pin risk** — getting close to a strike at expiry.
- **Realized vol > implied** — paid vs harvested gap moving wrong way.
- **Liquidity dropping** on positions she'd need to exit.

### Trade journal

- Per structure: thesis, entry vol, entry skew context, expected hold period.
- Reviewed weekly.

### Kill switches

- **Flatten delta** — fast.
- **Stop opening new structures.**
- **Run unwind algo** on whole book — prioritized by liquidity.

**Layout principle for Hold:** the greek book is foveal. Scenario PnL grid is the second-most-glanced surface. Delta-hedge state visible without having to ask.

---

## Phase 4: Learn

The most analytics-heavy phase for a vol trader, because edge is structural and only visible in distribution.

### Trade history — structure-level

Each closed structure gets a record:

- Entry IV, exit IV, IV-realized-during-hold.
- Entry skew, exit skew.
- PnL decomposed by greek.
- Hedging quality.
- Days to expiry at entry / exit.
- Strategy tag.

### PnL attribution — vol-trader-specific

- **By greek** — where did P/L come from? Vega? Gamma scalping? Theta carry?
- **By underlying.**
- **By strategy** — short premium, long gamma, calendar, skew, dispersion.
- **By tenor** — short-dated vs back-dated.
- **By regime** — high-vol vs low-vol regime.

### Vol forecasting backtests

- **My fair-vol model vs subsequent realized vol** — error distribution.
- **My fair-skew model vs subsequent realized skew.**
- **By underlying / tenor / regime.**
- Drives model refinement.

### Gamma-scalping analytics

- **Captured RV vs implied IV** per structure with positive gamma.
- **Hedging frequency optimization** — over- or under-hedging?
- **Hedging cost vs gamma profit** ratio.

### Skew / term-structure trade analytics

- For relative-value trades, did the spread converge as expected?
- Mean reversion time.
- Half-life of dislocations.

### Performance metrics

- Sharpe / Sortino on vol P/L.
- Max drawdown decomposed into vol move vs gamma vs hedging.
- Win rate **by structure type**.

### Replay

- **Surface replay** — scrub through historical IV surface evolution around a trade.
- **Greek replay** — see how greeks evolved from entry to exit, alongside underlying.

### Reports

- Daily greek + P/L decomposition report.
- Weekly structure performance review.
- Monthly vol model calibration review.
- Compliance reports.

**Layout principle for Learn:** distributions and decompositions, not point estimates. Surface replay is the highest-value tool unique to this archetype.

---

## What Ties Sasha's Terminal Together

1. **Vol is the price.** Quotes, charts, and analytics are vol-first; $-prices are derived.
2. **Greeks are the position.** Position views show greek exposure as primary, contracts as secondary.
3. **Surface visualization is mandatory.** A vol trader without a 3D / heatmap surface is blind.
4. **Multi-dimensional vega.** Vega-by-tenor and vega-by-strike are first-class, not buried.
5. **Decomposed PnL daily.** Delta / gamma / vega / theta / hedging cost — every day, every structure.
6. **Scenario PnL is foveal.** A grid of "what if spot moves and vol moves" is constantly consulted.
7. **Delta hedging is integrated.** Auto-hedge on fill, dynamic hedge bands, hedging-cost tracked.
8. **Multi-leg native order entry.** Templates, vol-quoted, with greek impact preview.
9. **Realized vs implied is the structural edge.** Cones, VRP time series, by underlying and tenor.
10. **Replay surfaces, not just prices.** Trade review requires seeing the surface as it was.

---

## How to Use This Document

When evaluating any options/vol trading terminal (including our own), walk through Sasha's four phases and ask:

- Are IV surfaces and skew/term curves first-class visualizations?
- Can she enter quotes in vol terms, not just $ terms?
- Are greeks aggregated by underlying / tenor / strike, with drilldown to legs?
- Is daily PnL decomposed by greek every day automatically?
- Is delta hedging integrated into entry and managed dynamically?
- Are scenario / stress PnL grids precomputed and updated live?
- Is replay possible at the **surface** level, not just the price level?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
