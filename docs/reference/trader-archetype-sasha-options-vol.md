# Trader Archetype — Sasha Volkov (Senior Options & Volatility Trader)

A reference profile of a top-performing options/volatility trader at a top-5 firm, used as a yardstick for what an ideal options & vol trading terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For shared platform surfaces referenced throughout, see [common-tools.md](common-tools.md).
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

The IV surface gets prime real estate. That's her chart. Charting (see [common-tools.md#1-multi-timeframe-charting](common-tools.md#1-multi-timeframe-charting)) is contextual on the bottom-left for underlying spot/perp/futures awareness — but it never dominates the wall.

---

## Phase 1: Decide

The vol trader's "decide" surface is fundamentally a **shape-of-the-surface** workspace, not a price-time chart workspace. Sasha's job in Phase 1 is to identify where the IV surface is mispriced relative to fair value and relative to subsequent realized vol.

### 3D IV surface (the primary thinking tool)

For each underlying she follows (BTC, ETH, and a watchlist of alts and CME equity vol):

- **Strike × tenor × IV** rendered as a true 3D mesh, pannable, rotatable, with strike on one axis, tenor on the other, and IV on the vertical. Heatmap fallback for monitors without GPU headroom.
- **Slice along any axis.** Drag a tenor cursor to extract a skew slice; drag a strike/delta cursor to extract a term-structure slice. Slices appear in the adjacent panel without disturbing the 3D view.
- **Diff modes.** Surface delta vs yesterday, vs 1w ago, vs 1m ago, rendered as a colored overlay on the same mesh — green where IV richened, red where it cheapened. Critical for spotting overnight surface moves.
- **Historical-distribution overlay.** For each (strike, tenor) cell, percentile rank of current IV vs trailing 5-year distribution. Tail-cells light up when vol is in extreme percentiles.
- **Multiple underlyings tabbed,** with optional dual-pane mode that puts BTC and ETH surfaces side-by-side for cross-asset relative-value reads.
- **Surface fit residuals.** Each quote vs Sasha's fitted surface; large residuals are trade candidates flagged in a side panel.

### Skew & term-structure curves

These are the most-glanced 2D surfaces; the 3D mesh is the wide read, the curves are the precise read.

- **Skew slices** — IV vs strike (or vs delta) at fixed tenors: today, 1w, 1m, 3m, 6m. Multiple tenors overlaid on one chart with a tenor selector. Strike axis toggleable between $-strike, log-moneyness, and delta.
- **Term-structure slices** — IV vs tenor at fixed deltas: 10Δ put, 25Δ put, ATM, 25Δ call, 10Δ call. Five lines on one chart shows the **whole skew/term shape** in one glance.
- **Forward-variance curve** — implied forward-forward vol between adjacent tenors, with regime label (contango / flat / backwardation).
- **Calendar-spread board** — front-month vs back-month vol differentials, vs trailing distribution. Click a row to load that calendar pair into the structure builder.

### Realized-vs-implied vol cones

This is the structural-edge surface — Sasha makes money primarily by selling rich vol and buying cheap vol relative to subsequent realized.

- **Realized-vol cones** — 1d, 7d, 30d, 90d realized vol at multiple horizons, with 10/25/50/75/90 percentile bands derived from trailing 5y. Current realized plotted as a line through the cone.
- **IV cones** — same shape, for ATM implied vol per tenor. Side-by-side with the RV cone makes the **vol risk premium** visually immediate.
- **VRP time series** — IV minus subsequent realized, by tenor, by underlying. Multi-year history with regime shading (high-VRP, low-VRP, inverted).
- **Realized correlation** — between BTC and ETH realized vols, signals dispersion-trade opportunities.

### Smile dynamics overlay

Among the most undervalued surfaces in the industry. When spot moves, does the smile move with it (sticky-strike), stay anchored to delta (sticky-delta), or anchor to log-moneyness (sticky-moneyness)? The answer is regime-dependent and dictates how she hedges and how she models second-order risk (vanna, volga).

- **Regime indicator** — a live classifier that, on each spot tick, computes which sticky model best explains the observed smile motion over the trailing N minutes/hours. Rendered as three stacked confidence bars (sticky-strike / sticky-delta / sticky-moneyness) with a dominant-regime label.
- **Implied-vs-observed delta correction.** Vanna and volga book values change materially under different sticky regimes. The overlay shows the delta-correction term Sasha should add to her Black-Scholes delta given the current regime — directly drives the auto-hedger setpoint.
- **Smile-shift attribution.** When the smile moves, decomposes the move into: pure level shift (parallel ATM move), skew rotation (25Δ RR change), kurtosis change (butterfly change), residual. Crucial for distinguishing "vol moved" from "skew moved" in PnL attribution.
- **Historical regime overlay** — last 30 days of spot moves, each labeled by which sticky regime fit best at the time. Lets her see whether the current regime is stable or oscillating.
- **Cross-tenor comparison.** Sticky regime is often tenor-dependent — front-end can be sticky-strike while back-end is sticky-delta. A tenor-vs-regime heatmap surfaces this.
- **Trade implication panel.** Given the current regime, shows: "Your +$50k vega in 1m calls is currently behaving as +$X vanna under sticky-delta — auto-hedger has been adjusted." This collapses the gap between theoretical greeks and observed greeks.

A vol trader without a smile-dynamics overlay is hedging the wrong delta and missing the second-order PnL it produces. This is the hardest unique to build correctly and the most differentiating once it works.

### 25Δ risk reversal & butterfly z-scores

The two cleanest summary statistics for the surface — one for skew, one for kurtosis.

- **25Δ risk reversal (call IV − put IV)** by tenor and underlying — the fear/euphoria gauge.
- **25Δ butterfly (strangle − straddle)** by tenor and underlying — the kurtosis / tail-pricing gauge.
- **Z-scores** of both vs trailing 5y, color-coded (>+2σ red, <−2σ green for selling-rich / buying-cheap framing).
- **Rank tables** — "BTC 1m RR is at the 96th percentile of trailing 5y" with one-click into the corresponding skew slice.
- **RR-vs-RR cross-tenor** — front-month vs back-month RR z-score, often the cleanest skew calendar trade.
- **Skew vs realized skew** — does the market price tail correctly? Realized large-move asymmetry vs implied 25Δ RR.

### Options flow & positioning

See [common-tools.md#13-news--research-feed](common-tools.md#13-news--research-feed) for the generic news/feed framework that hosts this. **Sasha-specific overlays** live on the dedicated options-flow tape — described in detail under Phase 3 because the tape is glanced primarily during Hold; here it's a Decide input for confirming/contradicting her thesis. Specifically she pulls:

- **Open interest by strike / tenor** with daily change.
- **Put/call OI ratio** time series.
- **Block trade feed** — large directional flows that tip dealer hedging.

### Macro / event context

Standard catalyst calendar: see [common-tools.md#12-catalyst--event-calendar](common-tools.md#12-catalyst--event-calendar). **Sasha-specific characteristics:**

- **Expected move** computed live from straddle prices for every listed event: "FOMC move pricing 1.4%, historical avg post-FOMC realized 1.1%."
- **IV vs event premium** — how much of front-tenor IV is the event pricing, vs structural baseline. The "post-event IV crush" estimate.
- **DVOL / VVIX / MOVE** as vol-of-vol macro context, pinned on the catalyst panel.
- **Earnings / token-unlock / fork dates** with implied IV pricing and historical post-event realized.
- **ETF options flow** for institutional positioning context around catalysts.

### Strategy library

See [common-tools.md#2-order-entry-ticket-framework](common-tools.md#2-order-entry-ticket-framework) for the ticket framework. **Sasha-specific:** her saved structures are options-native templates — long straddle/strangle, covered call, cash-secured put, iron condor/butterfly, vertical spreads, calendar/diagonal spreads, risk reversals, ratios, back-spreads, plus arbitrary custom multi-leg. Each template is parametrized (underlying, expiry, strikes, ratios) and one-click loadable into the structure builder described in Phase 2.

**Layout principle for Decide:** the IV surface and skew/term curves dominate her attention. Realized-vs-implied is the source of her edge thesis. Flow tape provides confirmation or contradicting evidence.

---

## Phase 2: Enter

Options entry is fundamentally different from spot/perp entry — every order is **multi-leg by default**, and pricing is **vol-quoted**, not price-quoted.

### Multi-leg structure builder

The unique heart of Sasha's enter surface — the generic ticket framework ([common-tools.md#2-order-entry-ticket-framework](common-tools.md#2-order-entry-ticket-framework)) is reskinned around a structure-first paradigm.

- **Pick a template** (straddle, strangle, condor, calendar, custom) from her saved library, or build a structure leg-by-leg with a "+ leg" affordance.
- **Parametrized fill-in** — underlying, expiry, strikes (in $ or in delta), ratios. Editing one parameter recomputes the whole structure live.
- **Vol-quoted entry** — the trader specifies "buy at 62 vol" not "buy at $1430." The ticket converts to $-price using the live underlying and the structure's net Black-Scholes price. Vol-pegged orders track the underlying tick-by-tick.
- **Live structure preview:** net debit/credit, max profit, max loss, breakeven(s), ROI on margin, days to expiry, payoff diagram.
- **Greeks of the structure at entry:** net delta, gamma, vega (total + by tenor + by strike), theta, vanna, volga, charm.
- **Implied vol of each leg** displayed alongside $-price; mid mark vs traded prints; bid-ask in vol terms (more meaningful than $-spread for low-delta options); recent prints at this strike.
- **Comparable strikes / tenors** as a sanity check — "this 30Δ call is 2v rich vs the 25Δ and 40Δ calls."

### Pre-trade greeks impact

Standard pre-trade preview: see [common-tools.md#3-pre-trade-risk-preview](common-tools.md#3-pre-trade-risk-preview). **Sasha-specific surfaces** added to the preview:

- Net **delta / gamma / vega-by-tenor / vega-by-strike / theta / vanna / volga** added to book, each with current → post-fill values.
- **Pin risk** if held to expiry (positions clustered near a strike that could pin).
- **Vega-limit utilization** by tenor bucket, with red flag if any bucket would exceed limit post-fill.
- **Max loss in stress scenarios** — quick BTC ±20% × IV ±10v scenario delta vs current book.
- **Margin impact** in portfolio-margin terms (Deribit / CME PM), not isolated.

### Block / RFQ workflow

For trades larger than the screen can absorb without moving markets, Sasha goes off-screen. This is its own dedicated surface, not a ticket extension.

- **RFQ to dealer panel** — request quotes from a configurable panel of market makers and OTC desks. Crypto: Paradigm-style multi-dealer RFQ as the dominant venue, plus on-chain RFQ (Aevo block, Lyra block, Premia OTC). TradFi options: equivalent dealer panels.
- **Quote aggregation view** — incoming quotes stream in, ranked by price, with response-latency badge per dealer. Live countdown to RFQ expiry. Side-by-side mid mark and on-screen best bid/offer for sanity.
- **One-click execute** with the chosen counterparty, with post-trade allocation to sub-accounts pre-configured.
- **Anonymity / disclosure mode** — disclose vs anonymous RFQ, with reputation tracking. Some dealers price tighter for known counterparties.
- **Counterparty-quality scorecard** — per-dealer historical fill quality, response speed, hit rate, no-show rate. Drives panel composition over time.
- **Dealer-flow inference signal** — when she's quoted suspiciously tight, that's information about dealer positioning, captured as a tag on the eventual fill.
- **Block-leg structure** — same multi-leg structures available in screen entry are quotable as a single block. Critical for legging-risk-free entry on calendar spreads, iron condors, and ratio structures.
- **Dealer pre-mute** — temporary exclusion of dealers whose recent quotes were toxic (filled, then surface moved against her unusually fast).

### Delta hedging at entry

- **Auto-hedge on fill.** System buys/sells underlying spot/perp/future to neutralize delta the moment the option fills.
- **Hedge venue selection** — cheapest spread, lowest fees, deepest book at her hedge size right now. See [common-tools.md#5-smart-order-router--multi-venue-aggregation](common-tools.md#5-smart-order-router--multi-venue-aggregation) for the underlying SOR; the options-aware extension routes hedges to the venue with the best blended (fee + spread + impact) cost for the hedge size.
- **Sticky-regime-aware delta.** The delta sent to the hedger is the **smile-corrected** delta from the smile-dynamics overlay, not the raw Black-Scholes delta.
- **Hedge-ratio override** — sometimes she wants residual delta intentionally (e.g. mildly bullish vol position).

### Algos for options

See [common-tools.md#4-execution-algos-library](common-tools.md#4-execution-algos-library). **Sasha-specific extensions:**

- **Vol-pegged orders** — leave a quote at "buy 62 vol or better"; the algo adjusts $-price as underlying moves, monitoring drift vs her vol target.
- **VWAP / TWAP for legging into multi-leg structures** with leg-balance enforcement (don't leg out more than X% imbalance during the parent algo).
- **Iceberg with dealer-aware size** — don't show the full hand to the dealer panel; refresh logic tuned for thin options books.
- **Auto-RFQ-when-screen-thin** — if screen depth drops below a threshold while a working order is live, auto-flip to dealer RFQ for the residual.

### Hotkeys

See [common-tools.md#6-hotkey-system](common-tools.md#6-hotkey-system). **Sasha-specific bindings:**

- Quick-close current structure (close all legs at market or aggressive limit).
- **Roll structure forward** — close current, open the same structure in the next tenor, in one stroke.
- **Delta-hedge now** — flatten residual delta instantly via spot/perp.
- **Vega-flatten** — close the highest-vega leg of the active structure.
- **Smile-regime cycle** — manually pin sticky-strike / sticky-delta / sticky-moneyness for the auto-hedger if she disagrees with the live classifier.

### Kill switches

See [common-tools.md#19-kill-switches-granular](common-tools.md#19-kill-switches-granular). **Sasha-specific characteristics:**

- **"Close all options"** is not realistic instantly — options books are illiquid relative to size. Triggers an unwind algo with progress display, prioritized by leg liquidity (most-liquid first). Includes simultaneous block RFQ for the residual large legs.
- **Stop new options orders** without flattening existing.
- **Flatten delta** — instant via spot/perp; this one **is** realistic instantly and is the most-used kill in her actual workflow.

**Layout principle for Enter:** the structure builder is central. Vol-quoted prices, not $-quoted. Delta-hedge integration is mandatory. RFQ surface adjacent for size that doesn't fit the screen.

---

## Phase 3: Hold / Manage — managing the greek surface

Sasha's positions don't sit still. Even if the underlying doesn't move, **theta bleeds** every second, and **vega**, **vanna**, **charm** evolve. She's continuously rebalancing.

### Multi-dimensional greek book — the master view

This is the most-glanced surface during Hold, and the most archetype-distinctive. The generic positions blotter ([common-tools.md#7-positions-blotter](common-tools.md#7-positions-blotter)) is the structural foundation; on top sits a fully greek-aware aggregation grid.

- **Total greeks** (delta, gamma, vega, theta, vanna, volga, charm, color) of the entire book.
- **Greeks by underlying** — pivot one row per underlying, all greeks as columns.
- **Vega-by-tenor** — first-class. Bucket vega into tenor buckets (1w, 2w, 1m, 3m, 6m, 1y+) and render as a bar chart with limit lines per bucket. Critical for understanding term-structure exposure: "I'm short $200k vega in 1m but long $150k in 3m — this is a calendar position, not a directional vol position."
- **Vega-by-strike** — bucket vega by moneyness (deep ITM, ATM, near OTM, deep OTM). Distinguishes "ATM vol exposure" from "tail exposure."
- **Vega-by-tenor × by-strike heatmap** — the full 2D vega map, the closest Sasha gets to "where my position lives on the surface." A red-blue heatmap aligned to the same axes as the IV surface.
- **Gamma-by-underlying** — magnitude and convexity sign. Long gamma means realized-vol harvesting; short gamma means selling premium; mixed by underlying is common.
- **Second-order greeks** — vanna (delta sensitivity to vol), charm (delta sensitivity to time), color (gamma decay over time), volga (vega convexity). These are the "what changes my hedges as time and vol move" greeks; surface as a separate compact panel because they're consulted daily, not minutely.
- **Structure-level rollup** — "BTC 1m 60-70k call spread, +$50k vega, +$8k gamma, −$1.2k theta, +$3k vanna." Same numbers as leg-level but rolled up to the trader's mental unit.
- **Leg-level drill-down** — each option contract: expiry, strike, side, size, mark, IV, all greeks. Filterable, sortable, exportable.
- **Realized vs entry P/L per structure** — realized-so-far + unrealized + greek-decomposed contribution.

A vol trader who can't see vega-by-tenor and vega-by-strike at a glance is flying blind on their largest risk dimension.

### Live PnL — greek-attributed

The unique-to-vol-traders panel. The generic Live PnL ([common-tools.md#9-live-pnl-panel](common-tools.md#9-live-pnl-panel)) is reskinned around a daily greek decomposition.

- **Delta PnL** — directional, ideally near zero if she's hedged. Non-zero delta PnL means hedge slippage or intentional delta exposure.
- **Gamma PnL** — captured from delta-hedging realized moves. Positive gamma + realized vol = scalping profit.
- **Vega PnL** — vol moves vs her vega exposure. Bucketed by tenor for clarity.
- **Theta PnL** — predictable decay. Should approximate the theoretical theta line on a quiet day.
- **Higher-order PnL** — vanna, volga, charm contributions plus residual.
- **Hedging cost** — spread / fees / impact paid on delta hedges, separately tracked. Subtract from gamma PnL to get net gamma scalping.
- **Per-structure attribution** — same decomposition, but per active structure, so she can see which positions are "earning their theta" and which aren't.

A vol trader who can't decompose daily PnL into these buckets cannot improve.

### Scenario PnL grid

A 2D matrix that's the second-most-glanced surface during Hold.

- **Spot × vol grid** — rows = underlying spot moves (−20% to +20% in configurable steps), columns = parallel vol shifts (−10v to +10v). Each cell shows portfolio PnL.
- **Surface-shape stress** — beyond parallel shifts: skew rotation (RR ±2v), term-structure twist (front +3v, back −1v), smile widening (butterfly +1v), kurtosis pop (tail-only IV spike). Each stress is a separate scenario, output as a single PnL number plus greek-attribution breakdown.
- **Event scenarios** — combined spot+vol scenarios labeled by event: "FOMC: spot ±2%, ATM vol ±5v, RR ±1v simultaneously," "Crypto deleveraging: spot −15%, ATM +10v, RR +3v."
- **Greek evolution over time** — a "time-warp" view: what will my vega-by-tenor look like in 1 day, 1 week, 1 month, holding everything else constant, as today's options decay?
- **Custom scenario builder** — Sasha defines a (spot, vol-surface-shift, time-elapsed) tuple and saves it as a named stress.
- **Drill-down per scenario** — which leg / structure contributed which $ to the scenario PnL.

This is the sister to [common-tools.md#11-stress--scenario-panel](common-tools.md#11-stress--scenario-panel), but vol-trader-specific because the axis space is options-native (surface shape) rather than asset-class-generic.

### Auto-delta-hedging surface

A live operations panel for the delta hedger, because the hedger runs continuously and is responsible for a meaningful portion of daily PnL.

- **Current book delta** vs target (usually zero, sometimes intentional).
- **Smile-corrected delta** vs raw Black-Scholes delta — the gap is what the smile-dynamics overlay contributes to hedge accuracy.
- **Dynamic hedge bands** — auto-hedge fires when delta exceeds ±X. Bands tighten/widen based on (a) realized vol regime, (b) hedge-cost estimate, (c) gamma magnitude. High gamma → tighter bands; high hedge cost / low gamma → wider bands.
- **Hedge orders working** — orders the hedger has live, with venue, side, size, mark.
- **Hedge-cost realized today** vs theoretical — actual spread + impact + fees paid, vs cost-model estimate. Persistent gap → hedger needs retuning.
- **Gamma-scalping PnL — realized vs implied.** Captured realized vol via hedging vs implied vol paid (theta). The single most important metric for any long-gamma position. Rendered as a running tally per structure with a positive/negative needle.
- **Hedge-frequency analytics** — over- or under-hedging? Distribution of inter-hedge intervals; gamma-PnL vs hedge-cost trade-off curve; current operating point on that curve.
- **Hedge venue routing decisions** — which venue each hedge went to and why (cheapest at the moment), with a venue-mix daily summary.
- **Manual override** — pause hedger, force-hedge-now, change band width, change target delta. All hotkey-bound for speed.
- **Hedge-event log** — every hedge order with reason ("delta breached upper band"), pre/post delta, fill quality.

### Risk panel

See [common-tools.md#10-risk-panel-multi-axis](common-tools.md#10-risk-panel-multi-axis). **Sasha-specific characteristics:**

- **Vega limits** by underlying, by tenor bucket, by strike bucket — three-way pivot, each cell red/amber/green vs limit.
- **Gamma limits** — max book gamma per underlying, with current utilization.
- **Pin risk** — close to expiry, large positions near a strike. Surfaced as a countdown ("BTC 65k strike, $X open notional, expires in 3h, current spot $64,950").
- **Liquidity risk** — what % of book could be unwound in a day at current depth, per leg, with a "tail legs" callout for the structures that can't be exited cleanly.
- **Tail scenarios** applied — Black Monday, Covid crash, FTX collapse, Luna depeg — book PnL in each, with greek-decomposition.

### Stress panel

See [common-tools.md#11-stress--scenario-panel](common-tools.md#11-stress--scenario-panel). **Sasha-specific characteristics:** the Scenario PnL Grid (above) is her primary stress surface; this generic panel hosts fixed-shock stresses (e.g. firm-wide regulatory stress packs) for compliance reporting and cross-archetype comparability.

### Alerts

See [common-tools.md#14-alerts-engine](common-tools.md#14-alerts-engine). **Sasha-specific alerts:**

- **Greek-threshold breaches** — vega above limit (per tenor bucket), delta drift past hedge band, gamma above limit.
- **IV spikes** — sudden IV move on a position (>X v in <Y min).
- **Pin-risk approach** — getting close to a strike at expiry, with notional and time-to-expiry context.
- **Realized > implied** — realized vol over a horizon exceeding implied vol for that horizon, on a structure where that's wrong-way.
- **Smile-regime change** — sticky-strike → sticky-delta switch detected, auto-hedger has been retuned.
- **Liquidity drop** on positions she'd need to exit (depth at her size halves vs trailing average).
- **Block-trade tape large print** that touches her exposure profile (e.g. $20M ETH 3m put block = dealer hedging incoming).

### Trade journal

See [common-tools.md#15-trade-journal](common-tools.md#15-trade-journal). **Sasha-specific entries:** per structure — thesis, entry vol, entry skew context (RR z-score, fly z-score, term-structure regime), expected hold period, sticky-regime context at entry. Reviewed weekly.

### Options flow tape

The dedicated bottom-right monitor surface — distinct from the generic news feed because flow data drives both her thesis (Phase 1) and her dealer-positioning awareness (Phase 3).

- **Large-prints tape** — every options trade above a configurable notional (default $500k), streaming with strike, tenor, side inferred (above/below mid), aggressor venue, and notional in $ and in vega.
- **Block-trade feed** — Deribit / Paradigm / CME blocks, separately surfaced because blocks signal informed institutional flow.
- **Dealer gamma exposure (GEX) estimate** — running model of where dealer gamma is concentrated. Positive GEX = dealers long gamma → suppressing realized vol around those strikes; negative GEX = dealers short gamma → amplifying moves. Rendered as a strike-axis heatmap, current spot marked.
- **Vanna walls** — strikes where dealer vanna concentration will produce meaningful delta-hedging flow as IV moves. Annotated with expected hedge-flow direction.
- **Charm walls** — strikes where dealer charm concentration will produce meaningful delta-hedging flow as time passes. Strongest near expiry; rendered with a time-decay schedule.
- **Max-pain levels** — for each upcoming expiry, the strike at which most option premium would expire worthless. Magnetism indicator on the price axis.
- **Open interest by strike / tenor** with daily change overlay.
- **Put/call OI ratio** time series.
- **Suspicious-flow flags** — repeated same-direction prints from inferred-same-counterparty (e.g. Paradigm broker hash), pre-event opening flow, after-hours block clusters.
- **Flow → position-impact preview** — when a print materially changes her exposure (e.g. someone buys a strike where she's heavily short), the row highlights and links to the affected leg.

### Kill switches

See [common-tools.md#19-kill-switches-granular](common-tools.md#19-kill-switches-granular). **Sasha-specific:**

- **Flatten delta** — fast, via spot/perp. Always realistic instantly.
- **Stop opening new structures.**
- **Run unwind algo on whole book** — prioritized by liquidity, with simultaneous dealer RFQ for the largest residual legs.

**Layout principle for Hold:** the multi-dimensional greek book is foveal. Scenario PnL grid is the second-most-glanced surface. Auto-hedger state visible without having to ask. Options-flow tape peripheral but constant.

---

## Phase 4: Learn

The most analytics-heavy phase for a vol trader, because edge is structural and only visible in distribution.

### Trade history — structure-level

See [common-tools.md#21-trade-history--blotter-historical](common-tools.md#21-trade-history--blotter-historical). **Sasha-specific fields per closed structure:** entry IV, exit IV, IV-realized-during-hold, entry skew (RR + fly z-scores), exit skew, PnL decomposed by greek, hedging quality (realized vs theoretical hedge cost), days to expiry at entry / exit, sticky-regime label during hold, strategy tag.

### PnL attribution — vol-trader-specific

See [common-tools.md#22-pnl-attribution-multi-axis](common-tools.md#22-pnl-attribution-multi-axis). **Sasha-specific axes:**

- **By greek** — delta / gamma / vega / theta / vanna / volga / hedging-cost. The structural decomposition.
- **By strategy** — short premium / long gamma / calendar / skew / dispersion / tail.
- **By tenor bucket.**
- **By underlying.**
- **By regime** — high-vol vs low-vol, contango vs backwardation, sticky-strike vs sticky-delta.

### Vol forecasting backtests

A unique analytic surface for a vol trader's research workflow.

- **My fair-vol model vs subsequent realized vol** — error distribution per (underlying, tenor, regime), with bias and dispersion metrics.
- **My fair-skew model vs subsequent realized skew** — same shape, applied to RR and butterfly.
- **Surface-fit residual stability** — for each (strike, tenor) cell, how persistent are residuals? Persistent residuals are model bugs; transient residuals are tradable.
- **Drives model recalibration** with versioned model snapshots and reproducible diffs.

### Gamma-scalping analytics

Sister to the live auto-hedger surface, but historical and distributional.

- **Captured RV vs implied IV** per structure with positive gamma — the structural truth-table for the long-gamma trade.
- **Hedging frequency optimization** — distribution of inter-hedge intervals overlaid with PnL; identifies whether she over- or under-hedges by regime.
- **Hedging-cost vs gamma-profit ratio** — cost per $ of captured gamma. Trends down with infra improvements; trends up with venue spread widening.
- **Sticky-regime impact** — gamma-scalping PnL split by which sticky regime dominated during the hold; smile-corrected delta should beat raw delta consistently.

### Skew / term-structure trade analytics

For relative-value vol trades — calendar spreads, skew trades, butterfly trades, dispersion.

- **Spread convergence** — for each RV trade, did the spread converge as expected? Time series of the spread from entry to exit overlaid with the entry-time fair model.
- **Mean-reversion time** — distribution of time-to-convergence by trade type and regime.
- **Half-life of dislocations** — how long do z-score-extreme RR / fly readings persist? Drives entry sizing.
- **Dispersion-trade analytics** — index-vol-vs-component-vol trade outcomes; correlation realized vs implied at trade time.

### Performance metrics

See [common-tools.md#23-performance-metrics](common-tools.md#23-performance-metrics). **Sasha-specific characteristics:**

- Sharpe / Sortino on **vol PnL**, separately from delta PnL.
- Max drawdown decomposed into **vol move vs gamma vs hedging-cost**.
- Win rate **by structure type** — short-premium vs long-gamma vs calendar vs skew.
- Per-regime metrics — same structure, different regime, different stats.

### Equity curve

See [common-tools.md#24-equity-curve](common-tools.md#24-equity-curve). **Sasha-specific overlays:** VRP regime shading, IV-regime shading, structural-trade markers (every block RFQ as a vertical line) so she can read the curve as "what was I doing when this happened."

### TCA — options-aware

See [common-tools.md#25-execution-quality--tca-transaction-cost-analysis](common-tools.md#25-execution-quality--tca-transaction-cost-analysis). **Sasha-specific characteristics:**

- TCA in **vol terms** as well as $ terms — slippage measured in IV-points, not just bps.
- **Block / RFQ TCA** — quote-aggregation analysis: how many dealers responded, how tight was the winning quote vs the panel, did the surface move during the RFQ window.
- **Multi-leg-slippage analysis** — for legged structures, leg-balance error and the cost of legging.
- **Hedge-execution TCA** — separate slice for the auto-hedger's order flow.

### Behavioral analytics

See [common-tools.md#26-behavioral-analytics](common-tools.md#26-behavioral-analytics). **Sasha-specific signals:** time-spent on flow tape vs surface vs greeks (workflow drift), discipline on stop-vol levels, frequency of manual hedger overrides (and their PnL outcome), revenge sizing after a vol move against her.

### Surface replay

The single highest-value Phase-4 surface unique to this archetype. Without it, post-trade review is impossible.

- **Historical IV surface evolution** — full 3D mesh, replayable second-by-second around any trade entry, hold, and exit.
- **Greek replay** — overlaid on the surface replay: how her book greeks evolved, alongside underlying spot, during the trade lifetime.
- **Smile-regime replay** — the live regime classifier replayed over historical data, so she can see whether her hedger was using the right sticky model at each moment.
- **Counterfactuals** — "what if I'd hedged tighter / wider / smile-corrected" — re-runs the auto-hedger over the historical surface and shows the alternative PnL.
- **Sister to** [common-tools.md#20-replay-tool](common-tools.md#20-replay-tool) — the generic replay framework provides the time-scrubbing and data-reconstruction infrastructure; surface replay is the options-specific extension that adds the IV-surface and greek dimensions.
- **Tied to trade journal** — every journal entry has a one-click "open surface replay at this trade" button.

### Reports

See [common-tools.md#27-reports](common-tools.md#27-reports). **Sasha-specific reports:**

- Daily greek + PnL decomposition (per-structure and book-level).
- Weekly structure-performance review.
- Monthly vol-model calibration review.
- Compliance reports (see [common-tools.md#28-compliance--audit-trail](common-tools.md#28-compliance--audit-trail) for the framework).

### Strategy tagging

See [common-tools.md#29-strategy-tagging-framework](common-tools.md#29-strategy-tagging-framework). **Sasha-specific tag taxonomy:** short-premium / long-gamma / calendar / skew / butterfly / dispersion / tail / event-vol / structural. Every structure tagged at entry; tags drive Phase-4 attribution.

**Layout principle for Learn:** distributions and decompositions, not point estimates. Surface replay is the highest-value tool unique to this archetype.

---

## What Ties Sasha's Terminal Together

1. **Vol is the price.** Quotes, charts, and analytics are vol-first; $-prices are derived.
2. **Greeks are the position.** Position views show greek exposure as primary, contracts as secondary.
3. **Surface visualization is mandatory.** A vol trader without a 3D / heatmap surface is blind.
4. **Multi-dimensional vega.** Vega-by-tenor and vega-by-strike are first-class, not buried.
5. **Decomposed PnL daily.** Delta / gamma / vega / theta / hedging cost — every day, every structure.
6. **Scenario PnL is foveal.** A grid of "what if spot moves and vol moves" is constantly consulted.
7. **Delta hedging is integrated.** Auto-hedge on fill, dynamic hedge bands, smile-corrected delta, hedging-cost tracked.
8. **Smile dynamics are explicit.** Sticky-strike vs sticky-delta vs sticky-moneyness regime is a live, surfaced model output, not buried in code.
9. **Multi-leg native order entry.** Templates, vol-quoted, with greek impact preview.
10. **RFQ is a peer surface to screen entry.** Block flow is normal, not exotic.
11. **Realized vs implied is the structural edge.** Cones, VRP time series, by underlying and tenor.
12. **Replay surfaces, not just prices.** Trade review requires seeing the surface as it was.

---

## How to Use This Document

When evaluating any options/vol trading terminal (including our own), walk through Sasha's four phases and ask:

- Are IV surfaces and skew/term curves first-class visualizations?
- Is the smile-dynamics regime surfaced and feeding the auto-hedger?
- Can she enter quotes in vol terms, not just $ terms?
- Are greeks aggregated by underlying / tenor / strike, with drilldown to legs?
- Is daily PnL decomposed by greek every day automatically?
- Is delta hedging integrated into entry and managed dynamically, with smile-corrected delta?
- Are scenario / stress PnL grids precomputed and updated live, with surface-shape stresses (not just parallel shifts)?
- Is RFQ a first-class entry path with dealer aggregation, not a side workflow?
- Is replay possible at the **surface** level, not just the price level?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
