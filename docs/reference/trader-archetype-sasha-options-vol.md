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

---

# Automated Mode

This appendix describes Sasha's terminal and daily workflow once her vol edge is encoded into models and rules running at scale — what she does, what she sees, and what stays human. The manual sections above describe Sasha at her desk hand-managing a 50-leg vol book on a few underlyings. This appendix describes the same Sasha running a fleet of vol strategies across BTC / ETH / liquid alts / CME equity vol, simultaneously, with auto-delta-hedging integrated as a first-class component of every strategy.

The strategy logic itself (the actual fair-vol model, the actual smile-dynamics classifier, the actual dispersion ranking) is out of scope. This appendix is about **the terminal she works in**: every surface she sees, every panel, every decision she makes, every workflow that supports her.

For the universal automated-trading platform concepts this builds on, see [automation-foundation.md](automation-foundation.md). For the manual-trader workflow this extends, see [manual-trader-workflow.md](manual-trader-workflow.md). For the shared platform surfaces all archetypes carry, see [common-tools.md](common-tools.md).

Sasha sits in the heavily-automatable tier alongside Marcus. Her edge — vol-rich/cheap detection, calendar-spread arb, gamma scalping, dispersion, term-structure arb, RV/IV-cone mean reversion, skew rotation — translates directly into rules and models. With automation, her coverage scales from a handful of underlyings hand-managed to dozens of underlyings × multiple tenors × multiple expressions running continuously, with auto-delta-hedging built into every strategy and the IV surface as the primary thinking surface across the entire fleet.

The vol-trader-specific shape of this appendix differs from Marcus's in important ways: the IV surface is the core decision surface (not a chart); greek decomposition is the primary risk axis (not $-notional); strategy entry is multi-leg vol-quoted by default (not a single-instrument ticket); and auto-delta-hedge is a built-in component of strategy composition (not a separate workflow).

> _Throughout this appendix, examples are illustrative — actual venue lists, strategy IDs, dataset names, feature names, and metrics shown are sample shapes to make the surfaces concrete. The platform's real catalog will differ._

## 1. What Sasha's Edge Becomes

Her manual edge encoded as automated **vol strategy classes**, each spawning many **strategy instances** across underlyings, tenors, structures, and parameter profiles. Every strategy class carries auto-delta-hedge as a built-in composition component (see section 8); a vol strategy without an integrated hedger is incomplete by construction.

- **Vol-rich/cheap detection per (strike, tenor, underlying).** Continuous scan of the IV surface vs Sasha's fair-vol model; flagged surface cells become trade candidates. The strategy class wraps each candidate with a structure (short strangle on rich ATM, long wing on cheap tail, etc.), entry sizing per residual size and confidence, exit on convergence or stop-vol breach. Hundreds of cells scanned continuously across the universe; dozens of instances active at any time.
- **Calendar-spread arb.** Front-vs-back IV differentials z-scored against trailing distribution; entries when the differential is extreme and the term-structure regime supports mean-reversion. Per underlying, multiple calendar pairs (1w-1m, 1m-3m, 3m-6m, etc.). Auto-roll into the next calendar when the front-month rolls forward.
- **Gamma-scalping with auto-hedging.** Long-gamma positions (long straddles, long strangles, long wings) where the strategy explicitly bets that captured realized vol exceeds paid implied vol. The auto-hedger fires per dynamic bands tuned to gamma magnitude and hedge cost; gamma-scalping PnL is the strategy's primary KPI. Multiple instances per underlying tuned for different vol regimes (compressed-vol gamma scalp, expanded-vol gamma scalp).
- **Dispersion strategies.** Short index vol vs long single-name vol (where applicable; for crypto, BTC vol vs basket of ETH+SOL+major-alt vols). Continuous correlation-realized-vs-implied scoring; entries when implied correlation is rich. Auto-balanced vega-by-leg.
- **Term-structure arb.** Curve trades on the ATM term structure: contango squeeze, backwardation overshoot, kink trades. Per underlying. Often expressed as calendar spreads but with a regime-sensitive overlay distinct from pure calendar arb.
- **RV / IV cone-based mean-reversion.** When IV at a given tenor sits at the >90th percentile of its trailing 5y cone and trailing realized at the matching horizon is mid-cone, sell vol; when IV is sub-10th percentile and realized is hot, buy vol. Per underlying, per tenor.
- **Skew-rotation strategies.** 25Δ risk-reversal at extreme z-scores → enter rotation trades (short the rich wing, long the cheap wing) with butterfly-neutral construction. Per tenor, per underlying. Often paired with a residual delta hedge to isolate the skew bet.
- **Butterfly / kurtosis trades.** 25Δ butterfly z-score extremes → buy or sell kurtosis. Per tenor, per underlying.
- **Event-vol positioning.** Pre-event IV vs post-event realized backtest history → systematic pre-event entries (typically long premium) and post-event exits (typically vol crush capture). FOMC, CPI, NFP, ETF announcements, token-unlock dates, exchange-launch events.
- **Pin-risk / max-pain strategies.** Near-expiry positioning around max-pain strikes with magnetism scoring. Tight risk gates because the structural windows are short.
- **Structural-flow follow / fade.** Block prints and dealer-positioning (GEX, vanna walls, charm walls) drive entries that lean into anticipated dealer-hedging flow or fade exhaustion. Microstructure-fast variants.
- **Dealer-positioning vol strategies.** When the GEX / vanna model implies dealers are forced into directional hedging that suppresses or amplifies realized, position long-gamma or short-gamma accordingly.

Each strategy class has 5–30 live instances at any time (different underlyings, tenors, structures, parameter profiles). Total fleet: ~150–250 vol strategies, scaling as the universe expands (more listed underlyings, more tenors, more on-chain options venues with usable liquidity).

Sasha's day is no longer "find a great vol trade." It is "make sure the firm's vol exposure is correctly distributed across the surface, across underlyings, across regimes; supervise the auto-hedger; supervise the fleet for decay; retire what's broken; push new alpha." The terminal must support this scale-up without forcing her to manually manage each leg.

## 2. What Stays Sasha

The platform automates surface scanning, vol-quoted execution, delta hedging, and signal generation. What stays her:

- **Vol regime shift recognition.** When the structural assumption underlying a strategy class breaks — a sustained move from low-vol-mean-reverting to high-vol-trending, a stickiness regime that flips abruptly, a venue's market-maker withdrawal that thins the surface — Sasha's intuition leads the platform's regime classifier by hours to days. She pulls back vega exposure before the metrics confirm.
- **Surface-anomaly interpretation.** A specific (strike, tenor) cell prints residual vs the fitted surface — is it noise, a single trader's flow, the leading edge of a regime shift, or a venue mispricing? The model flags; Sasha interprets. The interpretation drives whether to trade the residual or wait it out.
- **Expiry-day judgment (pin risk).** As a major expiry approaches, large positions near at-the-money strikes carry pin risk that's qualitatively different from any other trading day. The auto-hedger can be wrong-footed by pin magnetism; gamma explodes; dealer-positioning flows distort microstructure. Sasha's call on whether to widen hedge bands, force-flatten, or sit through the pin is judgment, not algorithm.
- **Event-induced vol-jump positioning.** Around scheduled events (FOMC, ETF announcements) where the platform's event-vol strategies have backtested behavior, Sasha overrides when she has a view that the event is qualitatively different (a dovish-FOMC-against-consensus, a regulatory action without precedent). Override is explicit, tagged, audited.
- **Skew-regime interpretation.** A 25Δ RR z-score at the 99th percentile is a number; whether that's "fear is overpriced, fade it" or "the market knows something, ride it" requires reading desk-chatter, dealer-positioning context, and the macro tape.
- **New strategy invention.** "I noticed butterfly mean-reversion is faster around CPI weeks; let me model that." Idea origination is human; the platform makes it cheap to test.
- **Dealer-relationship judgment.** Block / RFQ counterparty selection, dealer-quality scoring, anonymity decisions, dealer pre-mute calls — automated panel composition proposes, Sasha approves the strategic moves.
- **Counterparty-risk decisions on options venues.** Adding Aevo / Lyra / Premia exposure, sizing exposure to a venue under stress (Deribit insolvency rumor, Binance options custody concern), evaluating new on-chain options markets.
- **Cross-domain coordination on vol.** When Marcus's CeFi-spot strategies imply a regime that contradicts what the vol surface is pricing, Sasha decides whether her strategies should fade Marcus's view or align. When Henry trades equity vol structures that Sasha's BTC vol fleet correlates to, capacity decisions and attribution splits are negotiated.
- **Catastrophe response.** Exchange security incident, oracle deviation in real time, mass liquidation cascade that breaks the surface, an exchange auto-deleveraging her vol position: the first 60 seconds of judgment beat any pre-coded response. Sasha's role is rapid triage; the platform's role is to make triage actionable (one-click flatten-delta, one-click pause-vol-fleet-on-venue, one-click block-RFQ-for-largest-residual-legs).

The platform is opinionated about what to automate and humble about what cannot be. Sasha's judgment surfaces are made higher-leverage by automation — not bypassed.

## 3. The Data Layer for Sasha

The data layer is the substrate of every Sasha strategy. Without serious vol-surface data and trustworthy reference vols, no model is reliable, no feature is reproducible, no strategy is auditable. Sasha interacts with the data layer constantly — when researching surface anomalies, when diagnosing a misbehaving strategy, when evaluating a new options-flow vendor, when proposing a procurement.

### 3.1 The Data Catalog Browser

Sasha's home page when she opens the data layer is the catalog browser. A searchable, filterable list of every dataset the firm has, scoped to what's relevant for options / vol work.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters: data type (options-tick / options-snapshot / surface-fits / dealer-positioning / block-trades / underlying-spot-perp / realized-vol / event-calendar / on-chain-options); cadence (real-time / 5-min / 1h / EOD); license tier; cost band; coverage (per underlying / per venue).
- **Main panel** — table of datasets matching filters. Columns: name, vendor, coverage summary (e.g. "Deribit BTC + ETH options, full chain, 2019–present, tick-level"), cadence, freshness indicator, license terms, annual cost, owner, last-updated.
- **Right pane** — when a dataset is selected: full description, schema, sample rows, lineage graph, quality history, license document link, procurement notes, "click to add to a notebook" button.

**Search** — free-text across names + descriptions + schema fields. "deribit options tick" jumps to the right archives; "block trades paradigm" finds the multi-dealer block tape.

**Quick actions** — bookmark a dataset, request access to a restricted dataset, propose a procurement evaluation, flag an issue.

### 3.2 Sasha's Core Datasets (Illustrative)

A senior vol trader's data footprint at a top-5 firm spans dozens of feeds. Examples of what Sasha's catalog tier likely contains:

- **Tick-level options chains.** Deribit (full BTC + ETH chain, plus listed alts, full historical from venue launch), CME (equity vol + bitcoin futures vol), Binance options, Bybit options, on-chain options venues (Lyra, Aevo, Premia) where archived. Petabyte-scale; query against a distributed compute cluster.
- **Surface-fit archives.** Per (underlying, timestamp), the fitted surface (SVI / SABR / SSVI / vendor-proprietary), with residuals. Either firm-proprietary fits (recomputed nightly) or a third-party surface vendor.
- **Block-trade and RFQ archives.** Paradigm block tape, Deribit block tape, on-chain block (Aevo block, Lyra OTC), CME options blocks. Critical for dealer-positioning inference.
- **Dealer-positioning estimates.** GEX / vanna / charm models per venue per underlying, either firm-built or vendor-provided (SpotGamma-style for crypto and equity).
- **Open interest and volume histories.** Per (underlying, expiry, strike), with venue attribution.
- **Realized-vol archives per underlying.** Multiple horizons (1d / 7d / 30d / 90d), multiple estimators (close-to-close, Parkinson, Garman-Klass, Yang-Zhang), multiple venues for cross-source consistency.
- **Underlying spot / perp / futures tick archives.** Tardis / Kaiko or native venue archives; for delta-hedging-cost backtesting and for spot-driven feature engineering.
- **Funding-rate archives.** Per perp venue (for hedge-cost modeling — the cost of a perp delta hedge depends on funding direction).
- **ETF flow data.** Daily ETF creates / redeems for spot BTC and ETH ETFs; relevant for vol because dealer hedging from ETF options market-making bleeds into the underlying.
- **Macro vol references.** VIX, VVIX, MOVE, DVOL (Deribit BTC vol index), ETHV (Deribit ETH vol index), SKEW index. For cross-asset vol regime context.
- **Event calendars.** Macro (FOMC, CPI, NFP), token-unlock schedules, ETF flow events, exchange listings, fork dates, halving dates.
- **News and dealer commentary.** Sell-side options-strategist notes, OTC dealer color (where compliance permits), curated Twitter / X options-trader lists.
- **Historical implied-correlation archives.** For dispersion strategies — cross-section of implied correlations vs realized.
- **Pin / max-pain archives.** Per expiry historical max-pain calculations and resulting price magnetism.

Each dataset's record in the catalog shows: license terms, cost, coverage, freshness, lineage, used-by (which features and strategies depend on it), incident history.

### 3.3 Data Quality Monitoring

Every live dataset has continuous quality monitoring. Sasha sees this as a heatmap on her catalog, with a dedicated **Quality Console** for deeper investigation. Universal quality dimensions (freshness, completeness, schema stability, distribution drift, cross-source consistency, cost / volume) apply per [common-tools.md](common-tools.md) and [automation-foundation.md](automation-foundation.md).

**Sasha-specific quality concerns:**

- **Surface integrity** — does the option chain reconstruct without arbitrage (no calendar arbs, no butterfly arbs in the cleaned data)? Cleaned-vs-raw comparison view per underlying.
- **Stale-quote detection** — venues quote thousands of strikes; many are stale most of the time. The platform tracks per-(strike, tenor) quote freshness and flags surface cells where the freshness has degraded vs trailing baseline.
- **Mark-vs-trade consistency** — venue mid mark vs traded prints; persistent divergence is either a venue issue or a market regime worth investigating.
- **Cross-venue consistency on the same underlying** — Deribit BTC ATM vs CME bitcoin-future ATM vol after futures basis adjustment; persistent gap = data issue or arb opportunity.

When something degrades, the dataset's owner is paged. Sasha sees the impact: which of her strategies depend on this dataset, what's their state, should she intervene.

### 3.4 Lineage Navigator

Every dataset has an upstream lineage (where the data comes from) and a downstream lineage (which features and strategies consume it). The lineage navigator is a graph view Sasha opens when:

- A vol strategy is misbehaving and she wants to trace back to the source data.
- A vendor announces a feed change and she wants to see impact scope.
- A surface-fit method is being deprecated and she wants to confirm no strategy depends on it transitively.

**The graph:** nodes are datasets, surface fits, features, models, strategies. Edges are dependencies. Color-coded by health. Click any node to open its detail page; right-click for "show all downstream" or "show all upstream."

Used heavily during diagnostic work. A strategy showing residual divergence → lineage navigator → realize the upstream surface-fit changed methodology.

### 3.5 Procurement Dashboard

Options-data licenses are a meaningful P&L line item; a senior vol trader is expected to be sharp on cost-vs-attribution. The procurement dashboard:

- **Active licenses** — every paid feed with annual cost, renewal date, contract terms, owner of the renewal decision. Especially watched for Sasha: tick-level options archives, block-trade tapes, dealer-positioning models.
- **Trial / evaluation feeds** — POC'd options-flow vendors, alternative surface providers, on-chain-options archives.
- **Wishlist** — feeds Sasha has flagged: "want a sub-second crypto options chain archive vendor"; "want institutional dealer-flow attribution feed."
- **Cost attribution** — per licensed feed, rough P/L attribution: which vol strategies depend on it, and how much P/L they have generated.
- **Renewal calendar** — what's coming up, with auto-prompt to review usage + attribution before signing.
- **Decision log** — past procurement decisions with rationale.

Sasha contributes to procurement decisions especially around options-flow feeds, surface-fit vendors, on-chain-options archives. Major procurements escalate to David / firm-level.

### 3.6 Gap Analysis Surface

The platform identifies gaps tied to concrete strategies:

- **Universe coverage** — Sasha's strategies cover BTC, ETH, several alts, plus CME equity vol; the catalog tells her which ones are not fully covered (e.g. a newly-listed alt option chain on a venue without archived ticks).
- **Tenor / strike coverage gaps** — for an underlying, the 0DTE or LEAPS tenors may be undercovered by her current sources.
- **Feature gaps** — features in the library that depend on missing or stale data, blocked from production deployment.
- **Competitor signals** — feeds her competitors likely have that she doesn't (e.g. a specific dealer-flow attribution feed, an on-chain options aggregator).
- **Backfill gaps** — historical surface periods missing, blocking walk-forward backtests of new vol-surface-history-dependent strategies.

### 3.7 Interactions Sasha has with the data layer

Concrete daily / weekly / monthly:

- **Daily (background):** quality monitor in peripheral; auto-alerts for surface-feed degradation. Sasha glances at the catalog occasionally during research.
- **Weekly:** procurement / wishlist review; reading data-team release notes (new options-data feeds onboarded, schema changes, surface-fit methodology updates).
- **Monthly:** cost / attribution review; renewal-decision triage; gap-analysis review with the data team.
- **Ad hoc (during research):** querying the catalog when starting a new vol-strategy idea — what data do I have to test this skew-rotation thesis?
- **Ad hoc (during a strategy issue):** lineage navigator from the misbehaving vol strategy back to source surface fits.
- **Ad hoc (during an incident):** when a vol-data vendor degrades, the impact-scope view tells Sasha which strategies are at risk and what to pause.

### 3.8 Why this matters for efficiency, risk, and PnL

- **Efficiency:** Sasha does not waste hours figuring out what options data exists or where to query it. The catalog is one click. Every feature she builds is reusable.
- **Risk:** quality monitoring catches feed degradation before P/L does. Surface-integrity checks prevent a miscleaned feed from poisoning a fleet of strategies. Lineage navigation makes incident triage minutes-fast.
- **PnL:** procurement decisions are evidence-driven. Sasha doesn't pay for a redundant surface-fit vendor; she does aggressively license a dealer-flow feed that opens an alpha class worth multiples of the cost.

## 4. The Feature Library for Sasha

A feature is the unit of vol-vocabulary. Features are engineered transformations of options data, surface fits, and underlying spot — IV-rank, skew z-scores, vol-risk-premium, gamma walls, vanna walls, smile-regime classifiers — that vol models and rules consume. The feature library is where Sasha spends much of her research time.

The library is shared across the firm; features Sasha builds are visible to Marcus, Henry, Quinn (with appropriate permissions). Cross-pollination is real — Marcus's funding-rate features inform her event-vol strategies; Henry's earnings-window features inform her equity-vol strategies; her smile-regime classifier informs Marcus's directional strategies (because smile regime correlates with broad market regime).

### 4.1 The Feature Library Browser

Sasha's home page when she opens the feature layer.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters: domain (surface / skew / term-structure / RV-IV / dealer-positioning / event-vol / smile-dynamics / cross-asset / dispersion); cadence (tick / 1s / 1m / 1h / EOD); compute cost; used-by-strategy; owner / desk; quality tier; freshness.
- **Main panel** — table of features matching filters. Columns: name, version, owner, description, inputs, distribution-state indicator, used-by count, last-modified, performance proxy.
- **Right pane** — when a feature is selected: full description, code link, lineage graph, distribution monitor, incident history, "show me strategies using this feature" link, "test this feature in a notebook" button.

**Search** — free-text. "iv rank" finds variants across windows; "smile regime" finds the sticky-strike / sticky-delta / sticky-moneyness classifiers.

**Quick actions** — bookmark a feature, fork into a personal experimental version, propose a new feature, flag drift.

### 4.2 Sasha's Core Features (Illustrative)

Examples of features Sasha has built or consumes — actual library will differ.

**Surface-driven:**

- `iv_rank_atm_per_tenor` — ATM IV percentile rank vs trailing 5y, per (underlying, tenor).
- `iv_percentile_per_strike_per_tenor` — full surface percentile tensor.
- `surface_fit_residual_zscore` — per-(strike, tenor) residual vs fitted surface, z-scored.
- `surface_curvature_2d` — second-derivative measures of the IV surface in strike and tenor dimensions.
- `surface_arbitrage_score` — calendar-arb and butterfly-arb violation magnitude on the cleaned surface.

**Skew-driven:**

- `rr_25d_zscore_per_tenor` — 25Δ risk reversal z-score vs trailing 5y, per (underlying, tenor).
- `bf_25d_zscore_per_tenor` — 25Δ butterfly z-score, same shape.
- `rr_term_structure` — front-vs-back-month RR z-score (skew calendar).
- `realized_skew_3m` — realized large-move asymmetry over 3-month horizon for skew-vs-realized comparison.
- `skew_velocity` — first derivative of RR z-score (how fast skew is rotating).

**Term-structure-driven:**

- `atm_term_structure_curvature` — convexity of the ATM term structure.
- `forward_variance_zscore` — front-month vs back-month implied forward variance, z-scored.
- `term_structure_regime` — categorical (steep contango / mild contango / flat / mild backwardation / deep backwardation).
- `vol_of_vol_per_tenor` — realized vol of IV per tenor.

**RV-IV-driven:**

- `vol_risk_premium_per_tenor` — IV minus subsequent realized vol, per tenor, per underlying.
- `iv_minus_rv_zscore_per_tenor` — current IV-minus-trailing-RV z-scored.
- `rv_cone_percentile` — current realized vol percentile vs trailing 5y cone.
- `vrp_regime` — categorical regime indicator (high-VRP / normal / low-VRP / inverted).

**Dealer-positioning-driven:**

- `gex_per_underlying` — gamma exposure estimate per (underlying, strike).
- `vanna_walls` — strike concentrations of dealer vanna.
- `charm_walls` — strike concentrations of dealer charm.
- `max_pain_strike_proximity` — distance from spot to current expiry's max-pain strike.
- `dealer_flow_intensity` — block-print intensity classified by inferred dealer side.

**Smile-dynamics-driven:**

- `sticky_regime_classifier` — categorical (sticky-strike / sticky-delta / sticky-moneyness) confidence per underlying.
- `smile_corrected_delta` — Black-Scholes delta adjusted for the live sticky regime.
- `vanna_pnl_attribution` — implied vanna PnL contribution given regime.
- `smile_shift_decomposition` — level / skew / kurtosis attribution per smile move.

**Event-vol-driven:**

- `event_premium_per_tenor` — front-tenor IV minus structural baseline, the "event premium" embedded in price.
- `expected_move_from_straddle` — implied event move from listed straddle.
- `pre_event_iv_zscore` — IV z-score in the N hours before scheduled event.
- `post_event_iv_crush_estimate` — historical-average post-event IV-crush per event class.

**Dispersion-driven:**

- `implied_correlation_basket` — implied correlation between an underlying and a basket, derived from index-vs-component vols.
- `realized_correlation_basket` — realized correlation, same horizon.
- `dispersion_premium_zscore` — (implied − realized) correlation z-score.

**Microstructure-driven:**

- `options_block_print_intensity` — large-print frequency / size by underlying / tenor.
- `options_orderbook_depth` — top-of-book depth on options legs by (strike, tenor).
- `quote_freshness_per_strike` — staleness of options quotes by surface cell.

**Cross-asset / macro:**

- `dvol_regime` — DVOL (or VVIX, MOVE) regime indicator for cross-asset vol context.
- `vix_dvol_correlation_30d` — rolling correlation regime.
- `etf_flow_vol_proxy` — ETF flow as a leading indicator for vol regime shifts.

These features form Sasha's reusable vol-vocabulary. A new vol strategy she builds picks from this library and combines them. She builds new features when the existing vocabulary doesn't capture an idea.

### 4.3 Feature Engineering Surface

Building a new vol feature is itself a workflow. The platform supports it inline in the research workspace (next section) and exposes a structured form for the publication step. The workflow is the universal one (idea → quality gates → metadata extraction → code review → publication → backfill → live deployment) per [automation-foundation.md](automation-foundation.md).

**Sasha-specific feature-engineering concerns:**

- **Multi-dimensional output validation.** Many of Sasha's features output tensors (per (strike, tenor) cells), not scalars. Quality gates check tensor dimensionality, missing-cell rate, edge-cell stability.
- **Surface-arb-clean inputs.** Features computed on uncleaned surfaces are silently broken (a calendar-arb violation in raw data produces a meaningless skew-z-score). The publication form requires the trader to confirm the input surface has passed arb-clean.
- **Tenor-axis convention.** Tenors are in calendar days, business days, or option-DTE — the convention must be explicit. The form enforces a single convention per feature.

### 4.4 The Drift Dashboard

Live features drift; vol features drift in distinctive ways (regime shifts produce sudden distributional jumps in IV-rank features; dealer-positioning features drift around major expiry rolls). Sasha's drift dashboard surfaces the worst offenders.

**Layout:** universal per Marcus 4.4 (heatmap, triage queue, detail pane, acknowledgments log).

**Sasha-specific drift concerns:**

- **Surface-fit-method drift.** When the firm's SVI parameterization is updated, a cascade of downstream features shifts distribution. The drift dashboard flags this with a "method change" annotation rather than an unexplained drift.
- **Smile-regime classifier accuracy decay.** When the classifier's confidence saturates at one regime for an unusually long period, that's drift in the input (sometimes regime really is stable; sometimes the classifier is broken).
- **VRP regime persistence.** VRP regimes are usually multi-week; sudden flips in the regime feature merit investigation.

### 4.5 Cross-Pollination View

Features built by other desks that might apply to Sasha's domain.

**Suggested-similar widget** — when Sasha opens a feature, a sidebar shows features built by other desks with similar inputs or tags. "Marcus's funding-z feature has high overlap with your event-premium feature for crypto-event-vol strategies."

**Trending features across desks** — what's being built / used most across the firm right now. Often a leading indicator of where alpha is being found.

**Feature-of-the-week** — curated highlight from another desk; cheap way to keep current with cross-desk research.

This surface is light-touch.

### 4.6 Interactions Sasha has with the feature library

- **Daily (background):** drift dashboard glance during morning fleet review; alerts route to her for features feeding her amber/red strategies (especially smile-regime classifier and VRP regime features, because they feed multiple strategy classes).
- **Weekly:** browse cross-pollination view; identify candidate cross-desk features (Marcus's microstructure features for event-vol strategies; Henry's earnings-window features for equity-vol).
- **Ad hoc (during research):** browse + search for features matching a thesis; first move on a new vol strategy is "what features are already in the library that test this?"
- **Ad hoc (during feature engineering):** notebook + publication form.
- **Ad hoc (during retire):** when a feature is being deprecated (perhaps because its upstream surface-fit vendor is changing), Sasha reviews downstream impact and decides on replacement.

### 4.7 Why this matters

- **Efficiency:** Sasha does not rebuild "25Δ RR z-score" 14 times in 14 different notebooks. She picks it from the library, parameterizes if needed, and builds on it. Time-to-strategy-prototype drops from days to hours.
- **Risk:** drift is monitored continuously. A model trained on one vol regime breaks silently when its features shift; the dashboard catches this before P/L does. Per-feature versioning means retraining doesn't accidentally use a different feature definition than the original training run.
- **PnL:** features are reused across vol strategies. A high-quality feature (Sharpe-uplift positive across many strategies — `smile_corrected_delta` is the canonical example) generates compounding return. Cross-pollination accelerates discovery.

## 5. The Research Workspace

The research workspace is where Sasha turns options data, surface fits, and features into validated vol strategies. It is her primary working surface during research-heavy hours — which, in automated mode, is most of the day.

### 5.1 Notebook Environment

The workspace is notebook-first (Jupyter-style) with a full IDE option. Layout and platform integrations follow the universal pattern from [automation-foundation.md](automation-foundation.md).

**Sasha-specific notebook patterns:**

- **Surface-aware data access.** `surface = data.load_surface("deribit.btc", at="2024-06-15T12:00:00Z")` returns a (strike × tenor × IV) tensor with metadata; `surface.slice(tenor="30d")` extracts a skew slice; `surface.diff(other_surface)` produces a comparable diff. The library embeds the surface-as-first-class concept.
- **Greek-aware position objects.** A simulated multi-leg structure is a first-class object: `s = structure.straddle(underlying="BTC", expiry="2024-09-27", strike=65000); s.greeks()` returns delta / gamma / vega-by-tenor / vega-by-strike / theta / vanna / volga / charm with the right vol-trader semantics (vega-by-tenor in the right bucket convention, vega-by-strike in the right moneyness bucket).
- **Auto-hedge simulation.** For long-gamma backtest experiments, the notebook can wrap a structure with the platform's auto-hedger as a parameterized component: `result = backtest(structure=s, hedger=auto_hedger(bands="dynamic", regime="sticky_delta"), data=hist)`. Different hedger configurations are first-class experiment dimensions.
- **Surface-replay scrubbing.** A notebook helper opens an interactive surface-replay timeline at a specific date for ad-hoc surface inspection during research.

**Compute attached to the kernel:** runs on research compute, not Sasha's laptop. GPU available for surface-fit experiments and large historical sweeps. Cost visible.

**Persistence and collaboration:** notebooks persist per user; shared workspaces for desk collaboration (Sasha + Marcus working on a cross-asset event-vol prototype); version control native.

### 5.2 Backtest Engine UI

The single most-used surface in the research workspace.

**Layout when running a backtest:** universal per Marcus 5.2 (form panel, live progress, streaming results, final results page with summary metrics, equity curve, per-trade attribution histogram, slippage breakdown, regime-conditional performance, sensitivity, robustness checks, auto-flagged warnings).

**Sasha-specific execution-model realism is mandatory:**

- **Options-leg slippage curves** derived from per-(strike, tenor) historical depth. ATM legs are tight; deep-OTM tail legs may have 10v slippage on a small clip.
- **Block-vs-screen execution.** The backtest models when a trade would have executed on screen vs gone to RFQ; per-venue dealer panels and historical RFQ-quote-aggregation behavior are simulated.
- **Vol-quoted entry mechanics.** Backtest entries specify a target vol; the engine simulates whether the surface offered that vol at the moment, and what the eventual fill vol was given microstructure noise.
- **Auto-hedger simulated as part of the strategy.** Hedge cost (spread + fees + impact + funding cost on perp hedges) is fully modeled. Gamma scalping PnL is realized PnL from realized hedges minus theta paid; the engine produces this number, not just nominal greek PnL.
- **Margin / portfolio-margin modeling.** Deribit / CME PM rules applied; isolated-margin sub-accounts modeled separately. Funding cost on margin financing for long-premium strategies tracked.
- **Pin-risk simulation at expiry.** For positions held through expiry, pin magnetism is modeled with historical-distribution realism.
- **Calendar-roll mechanics.** When a strategy auto-rolls a calendar pair, the cost of the roll (slippage on closing front, slippage on opening new front, time spent uncovered) is simulated.

The same execution code runs in live trading as in backtest — divergence between paper and live is rare and investigated.

### 5.3 Walk-Forward Visualization

Walk-forward backtest is the default; the visualization is critical for honest evaluation. Universal layout per Marcus 5.3 (training-window vs test-window equity curve segmentation, Sharpe per test window with CI bars, parameter-stability check, OOS / IS Sharpe summary, generalization gap).

**Sasha-specific:** walk-forward windows for vol strategies must respect vol-regime-cycle length. A walk-forward window shorter than a typical VRP regime cycle (a quarter or so) can produce misleading results. The platform suggests regime-cycle-appropriate window sizes per strategy class.

### 5.4 Strategy Template Library

A library of pre-built vol-strategy compositions Sasha starts from. Reduces time-to-first-strategy from days to hours.

**Sasha's templates (illustrative):**

- **Short-strangle-with-delta-hedge.** Sell ATM-OTM strangle with auto-delta-hedge configured. Parameterized by: underlying, expiry, strike-distance (in delta or in $), entry IV-rank threshold, exit conditions (IV-crush target / time-out / stop-vol), hedge-band parameters, max-vega cap.
- **Calendar spread.** Buy back-month vol, sell front-month vol (or reverse). Parameterized by: underlying, front / back tenors, strike (typically ATM), entry forward-variance z-score, exit on convergence.
- **Gamma-scalping (long straddle / strangle).** Buy long-gamma structure with auto-delta-hedge tuned for gamma capture. Parameterized by: underlying, expiry, strike, entry IV-cone percentile, hedge-band parameters (regime-conditional), exit conditions.
- **Short premium (covered call / cash-secured put / iron condor / iron butterfly).** Premium-collection structures with risk-defined wings. Parameterized by structure type, strikes, expiry, entry IV-rank threshold, defense / roll rules.
- **Skew-rotation.** When 25Δ RR is at extreme z-score, enter a butterfly-neutral rotation trade (short rich wing, long cheap wing). Parameterized by: underlying, tenor, RR z-score threshold, butterfly-neutralization rule, exit on z-score normalization.
- **Butterfly / kurtosis trade.** Buy or sell 25Δ butterfly when butterfly z-score is extreme. Parameterized by: underlying, tenor, BF z-score threshold, exit on convergence.
- **Dispersion (index vol vs basket vol).** Short index vol, long single-name basket vol (or reverse). Parameterized by: index, basket composition, tenor, entry implied-correlation z-score, vega-balance constraints.
- **Event-vol (pre-event premium harvesting).** Pre-event entry into event-premium structures, post-event exit on IV crush. Parameterized by: event class, event date, structure type, entry hours-before, exit hours-after, position size scaled to historical event-vol PnL.
- **Pin / max-pain positioning.** Near-expiry short-premium structures around max-pain strikes. Parameterized by: underlying, expiry, max-pain proximity threshold, structure type.
- **Vanna-wall / charm-wall fade.** Position to benefit from anticipated dealer hedging flow at vanna or charm walls. Parameterized by: underlying, wall threshold, time-to-expiry, structure type.

Sasha's day starts at a template and customizes from there. Many of her ~150–250 live vol strategies are instances of one of ~12 templates with parameter profiles tuned per (underlying, tenor, regime).

### 5.5 Compute Management

Senior researchers run compute-heavy work — surface-history backtests, smile-regime classifier training, large hyperparameter sweeps. Compute management is a real surface. Universal panel structure per Marcus 5.5 (active jobs, queued jobs, cost dashboard, GPU/cluster availability, result archive).

**Sasha-specific:** surface-history backtests (running every strategy variant against five years of full-chain surface data) are the most expensive class of jobs Sasha runs. The platform recognizes this class and suggests appropriate compute tiers.

### 5.6 Anti-Patterns the Workspace Prevents

Universal anti-patterns per Marcus 5.6 (untracked data pulls, untracked feature definitions, lookahead bias, survivorship bias, in-sample tuning, reproducibility gaps).

**Sasha-specific anti-patterns:**

- **Greek-imbalance backtest fraud.** A backtest that claims gamma-scalping PnL but is using a spot-tape that doesn't match the option's underlying mark methodology. The engine enforces same-underlying-as-options.
- **Pin-blow-up survivor bias.** Backtests that drop expiry-day data ("too noisy") effectively delete the worst hits. The engine forces inclusion of expiry-day mechanics; warnings if dropped.
- **Surface-cleaning hindsight.** Using today's cleaning methodology on historical data from before the methodology was developed; the engine warns when the surface-clean version doesn't match the historical version.
- **Vol-quoted-entry hindsight.** Entering at a vol level that wasn't actually executable on screen at that moment; the engine simulates whether the entry would have actually filled.

### 5.7 Interactions Sasha has with the workspace

- **Pre-market:** review overnight backtest / training results; pick winners for further work.
- **In-market (research-heavy hours):** active in the workspace; new vol-strategy ideas, feature engineering, retraining.
- **Diagnostic (when alerted):** pull a misbehaving vol strategy into the workspace, replicate the issue, diagnose, fix, redeploy.
- **Post-market:** queue overnight jobs (typical: hyperparameter sweeps on smile-regime classifier, surface-history backtests for new templates).

### 5.8 Why this matters

- **Efficiency:** time-to-validated-vol-strategy compresses from weeks to hours.
- **Risk:** anti-patterns specific to vol (greek-imbalance fraud, pin-blow-up survivor bias, surface-cleaning hindsight) are caught by the platform, not by Sasha's discipline. Silent overfit shipping to production is the most expensive failure mode.
- **PnL:** more validated alpha per quarter. Compounded over years, the difference between a good research workspace and a mediocre one is dozens of percent of fund return.

## 6. The Model Registry

Models are the executable form of Sasha's vol edge. The registry catalogs every model the firm has trained, with full reproducibility guarantees. Whether a fitted SVI surface, a smile-regime classifier, a fair-vol regression, or a dealer-GEX estimator, every model is a first-class object with identity, training data hash, hyperparameters, performance, and deployment status.

### 6.1 The Model Registry Browser

Sasha's view when she opens the model registry. Layout follows the universal pattern (left sidebar taxonomy filters, main panel of model cards, right pane with model record).

**Sasha-specific taxonomy:**

- **Model class** — surface-fit (SVI / SABR / SSVI / proprietary), smile-regime classifier, fair-vol regression, fair-skew regression, dealer-positioning estimator (GEX / vanna / charm), event-vol predictor, dispersion-correlation model.
- **Domain** — surface / skew / term-structure / smile-dynamics / dealer-positioning / event-vol / dispersion.

### 6.2 The Model Record Page

Per model, the canonical record. Universal structure per Marcus 6.2 (identity, lineage, training metadata, performance, lineage graph, deployment state, drift state, documentation, action panel).

**Sasha-specific performance metrics:**

- For surface fits: fit RMSE per (tenor bucket × strike bucket), arb-violation rate, residual stability over time.
- For smile-regime classifiers: classification accuracy on labeled regimes, confusion matrix, regime-flip-detection latency.
- For fair-vol regressions: RMSE between predicted and realized vol, bias per regime, calibration plot.
- For dealer-positioning estimators: backtested correlation between predicted dealer-flow and observed underlying microstructure response.

### 6.3 Versioning & Immutability

Universal: semantic versioning + content hash; old versions never deleted; promotion path through registered → validated → deployed; rollback one-click.

**Sasha-specific:** the surface-fit model versions are particularly sensitive — every downstream feature depends on a specific surface-fit version. Major surface-fit changes are coordinated firm-wide because they cascade across many traders' features.

### 6.4 Drift Surface for Models

Distinct from feature drift, model drift focuses on the model's outputs. Universal drift dimensions (prediction-distribution drift, performance drift, calibration drift) per Marcus 6.4.

**Sasha-specific:**

- **Surface-fit residual drift** — has the average fit residual increased over time? (May indicate the parameterization is no longer expressive enough for the current regime.)
- **Smile-regime classifier confidence drift** — has classifier confidence saturated at one regime label for unusually long? May indicate regime change or classifier degradation.
- **Fair-vol bias drift** — has the predicted-minus-realized bias trended in one direction? (Drift in the underlying vol distribution can break a fair-vol regression silently.)

### 6.5 Lineage Graph

Universal per Marcus 6.5. Used during diagnostic work and during model deprecation (impact-of-change). For Sasha, lineage graphs around surface-fit models often span dozens of downstream features and dozens of strategies; a surface-fit deprecation is a multi-day coordinated change.

### 6.6 Why this matters

- **Efficiency:** Sasha does not waste hours trying to reconstruct what a strategy is running on. The registry says: this strategy uses smile-regime classifier v3.2.1, trained on data hash Y, with hyperparameters Z. Diagnostic loop closes fast.
- **Risk:** without the registry, the firm cannot answer regulator / auditor / risk-committee questions about what's deployed. Reproducibility is non-negotiable; the registry is the system of record. For vol, where surface-fit choices cascade across the entire desk's features and strategies, the registry is the single source of truth.
- **PnL:** retraining cadence is data-driven, not gut-driven. Decay is measured per model; retire decisions are evidence-based.

## 7. The Experiment Tracker

Most research is failed experiments. The experiment tracker is the firm's institutional memory of what's been tried — successes, failures, dead-ends — searchable, comparable, reproducible. Universal structure per Marcus 7.

### 7.1 The Experiment Browser

Layout per Marcus 7.1 (left sidebar filters, main panel of runs, sortable, multi-select for comparison).

**Sasha-specific filters:** strategy class (short-premium / long-gamma / calendar / skew / butterfly / dispersion / event-vol), underlying, tenor bucket, regime label.

### 7.2 Per-Experiment Record

Per Marcus 7.2 (trigger, config, inputs, output, diagnostics, annotations, tags).

**Sasha-specific config dimensions captured:**

- Surface-fit version used.
- Smile-regime classifier version used.
- Hedger configuration (band model, regime-corrected delta on/off, hedge-venue routing).
- Tenor / strike conventions.
- Pin-day inclusion/exclusion (with warning when excluded).

### 7.3 Run Comparison Views

Universal per Marcus 7.3 (side-by-side, N-way, Pareto-frontier, hyperparameter sensitivity, ablation).

**Sasha-specific comparison views:**

- **Hedger-config comparison.** Same underlying strategy, different hedger configurations — which captures the most gamma PnL net of cost? Side-by-side equity curves with hedger-mode shaded.
- **Surface-fit-method comparison.** Same strategy, different surface-fit model versions — robustness to surface-fit choice. Strategies whose Sharpe depends materially on surface-fit choice are fragile and should be flagged.
- **Regime-conditional comparison.** Same strategy, performance segmented by regime (high-VRP / low-VRP / sticky-strike / sticky-delta). Surfaces regime-specific blow-ups.

### 7.4 Anti-Patterns Prevented

Universal per Marcus 7.4 (p-hacking by re-running, cherry-picking periods, hidden in-sample tuning).

**Sasha-specific:** surface-fit-method shopping. Trying every surface-fit model version until one produces a positive Sharpe is a real anti-pattern; the tracker logs surface-fit choices and surfaces the multiple-testing penalty.

### 7.5 Interactions Sasha has with the experiment tracker

Per Marcus 7.5 (during research bursts, between bursts, in retrospect, for team handoff, when David asks).

### 7.6 Why this matters

- **Efficiency:** failed experiments are data, not waste.
- **Risk:** p-hacking and surface-fit-shopping are the silent killers of vol research. The tracker makes Sasha's process honest and defensible.
- **PnL:** the firm's accumulated experiment knowledge compounds over years.

## 8. Strategy Composition

A model alone is not a tradable vol strategy. A vol strategy is what wraps a model (or a rule set) with **structure construction**, sizing logic, entry/exit logic, **integrated auto-delta-hedging**, risk gating, regime conditioning, capacity management, and execution policy. Strategy composition is where Sasha turns a validated model into a deployable vol-strategy unit.

The vol-trader-specific shape: **the volatility surface is integrated with the composition surface, and auto-delta-hedge is a built-in component, not a separate workflow.**

### 8.1 The Strategy Composition Surface

A structured form-plus-code UI. The trader configures the structured parts (visual graph + form fields + structure builder) and drops into Python for any custom logic.

**Layout (sketch):**

- **Top bar** — strategy ID, name, version, owner, current stage (Research / Paper / Pilot / Live / Monitor / Retired), action buttons (validate / backtest / deploy / clone / archive).
- **Left graph view** — the strategy as a directed graph: data sources → surface fit → features → model(s) → signal → **structure construction** → entry / exit logic → **auto-delta-hedger** → sizing → execution. Click any node to configure.
- **Center panel — the volatility surface integrated.** A live IV surface viewer showing the current surface for the strategy's underlying(s), with the strategy's target structure overlaid (the strikes and tenors the strategy would hit at the next signal). Diff overlay vs the fair-vol model. As the trader adjusts entry conditions, the structure overlay updates live. The surface is not a separate research tool here — it is the canvas on which the strategy is composed.
- **Right panel — properties of the selected node:**
  - **Surface fit** — model registry reference, version pin.
  - **Feature** — feature library reference, parameters.
  - **Model** — model registry reference, version pin.
  - **Signal** — vol z-score threshold, RR z-score threshold, IV-rank threshold, confirmation conditions.
  - **Structure construction** — template (straddle / strangle / iron-condor / butterfly / calendar / risk-reversal / custom), parameterized strikes (in $ or in delta or in moneyness), ratio rules, expiry selection rule.
  - **Entry logic** — when to take the structure (signal threshold + blackout windows around scheduled events + venue depth threshold + spread-in-vol-points threshold).
  - **Exit logic** — vol-target / time-in / signal-flip / stop-vol breach / IV-crush target / regime-flip / pin-day-force-exit.
  - **Auto-delta-hedger configuration (built-in component).** Hedge-band model (fixed bands / dynamic bands tied to gamma magnitude / regime-conditional bands), target delta (usually zero, optionally non-zero), smile-regime delta correction on/off, hedge-venue routing rules, hedge-frequency caps, hedge-cost budget caps. **This is not a separate workflow — every vol strategy declares its hedger configuration at composition time.**
  - **Sizing** — Kelly fraction on vol-PnL distribution, vega-targeting, vega-cap per tenor, max-loss cap per stress scenario, regime-conditional multipliers.
  - **Risk gates** — daily vol-PnL loss limit, drawdown limit, vega-by-tenor cap, vega-by-strike cap, gamma cap, theta-budget floor, pin-day proximity gate. Kill-on-breach.
  - **Execution policy** — vol-pegged / VWAP-on-vol / iceberg / RFQ-when-screen-thin / direct-block-RFQ. Venue routing rules. Anonymity / disclosure preference for RFQ.
  - **Schedule** — active hours / days, blackout windows around macro events (e.g. "no entries 30 min before FOMC"), expiry-day handling rules.
  - **Mode** — live / paper / shadow.
  - **Tags** — strategy class, asset class, archetype owner, event-class (if event-driven).
- **Bottom panel** — validation feedback, **scenario PnL grid for the proposed structure** (a precomputed spot × vol grid showing how the strategy's first trade would behave under stress), backtest results, deployment state.

**Code drop-in:** for any node, "convert to custom code" opens a Python editor with the platform SDK pre-loaded. Useful for novel signal-combiners, exotic exit logic, custom hedger band models, custom structure construction.

**Auto-delta-hedge as a strategy component (not an afterthought):**

The vol-trader-specific design principle: **a vol strategy without an integrated hedger is incomplete.** The composition surface enforces this. When the trader composes a long-gamma strategy, the hedger configuration node is not optional — it must be filled. The hedger config drives backtest realism, capital allocation (because hedger PnL contributes to capacity), risk gating (because gamma exposure must be paired with hedger configuration to bound), and live operations (because the hedger is part of the deployed strategy, not a separate process).

### 8.2 Pre-Deployment Validation

Before the strategy can be promoted past research, the platform checks for common errors. Universal validations per Marcus 8.2 (lookahead, infinite-loop, unbounded position size, missing kill-switch, schedule conflicts, compliance flags, capacity sanity, universe consistency).

**Sasha-specific validations:**

- **Hedger-strategy consistency.** Strategy declares "long gamma" but hedger is configured to widen bands when realized vol rises (which would defeat gamma scalping). Flagged.
- **Pin-risk handling.** Strategy can hold positions through expiry but no pin-day-force-exit rule. Flagged unless explicitly acknowledged.
- **Vega-by-tenor concentration.** Strategy is one of many active strategies; aggregate vega-by-tenor would breach firm vega-bucket cap. Flagged.
- **Surface-fit version pin.** Strategy doesn't pin a specific surface-fit version (would silently drift if the firm updates the surface fit). Flagged.
- **Smile-regime classifier dependency.** Strategy depends on the smile-regime classifier but doesn't handle classifier-uncertainty cases (when classifier confidence is low for all three regimes simultaneously). Flagged unless handled.
- **Delta-hedge venue availability.** Strategy hedges via perp on a venue where the strategy doesn't have margin allocated. Flagged.
- **Roll-day handling.** Calendar / dispersion strategies don't declare roll-day handling rules. Flagged.

Each warning gates progression. Errors must be fixed; warnings can be acknowledged with reason.

### 8.3 Strategy Versioning

Universal per Marcus 8.3. Every change to the composition produces a new strategy version; old versions stay in the registry; live deployments pin to a specific version; diff views show what changed.

**Sasha-specific:** hedger configuration changes are tracked as first-class strategy version changes (a hedger band-model change is a substantive strategy change, not a tuning tweak). The diff view explicitly highlights hedger changes.

### 8.4 Sasha's Strategy Templates (Illustrative)

Pre-built vol-strategy compositions that Sasha's day starts at. She customizes parameters, picks underlyings / tenors / structures, validates, backtests, then promotes through the lifecycle. Many of her ~150–250 live vol strategies are instances of one template parameterized for a specific (underlying, tenor, regime, structure).

- **Short-strangle-with-delta-hedge.** Inputs: underlying, expiry, strike-delta-distance (e.g. 25Δ), entry IV-rank threshold (e.g. > 80th percentile), exit conditions (IV-crush target / time-out / stop-vol), hedger config (dynamic bands, smile-corrected delta), max-vega cap per tenor. Hedging: built-in. Risk gates: daily vol-PnL loss, drawdown, vega-cap, theta-floor. Schedule: continuous; pin-day force-exit.
- **Calendar spread.** Inputs: underlying, front / back tenors, strike (typically ATM), entry forward-variance z-score, exit on convergence. Hedging: built-in (calendar is delta-near-flat by construction; small residual hedger for drift). Risk gates: vega-by-tenor net (the calendar's design), max-loss-on-curve-twist.
- **Gamma-scalping (long straddle / strangle).** Inputs: underlying, expiry, strike, entry IV-cone percentile (e.g. < 20th percentile), hedger config (tight bands, regime-conditional), exit on IV-rank reversion or time-out. Hedging: aggressive built-in. Risk gates: theta-budget floor, max-realized-cost per day.
- **Iron condor (short premium with defined wings).** Inputs: underlying, expiry, body-strike-deltas, wing-distances, entry IV-rank threshold, defense / roll rules. Hedging: light built-in (iron condor is delta-near-flat).
- **Skew-rotation (butterfly-neutral).** Inputs: underlying, tenor, RR z-score threshold, butterfly-neutralization rule, exit on z-score normalization. Hedging: built-in (positions are designed delta-flat; small residual hedger).
- **Butterfly / kurtosis trade.** Inputs: underlying, tenor, BF z-score threshold, exit on convergence. Hedging: built-in.
- **Dispersion (index vs basket).** Inputs: index, basket composition, tenor, entry implied-correlation z-score, vega-balance per leg, exit on correlation convergence. Hedging: built-in delta-flatten across the legs.
- **Event-vol (pre-event premium harvesting).** Inputs: event class, event date, structure type (straddle / strangle / risk-reversal), entry hours-before, exit hours-after, position size scaled to historical event-vol PnL distribution. Hedging: built-in.
- **Pin / max-pain positioning.** Inputs: underlying, expiry, max-pain-proximity threshold, structure type, position size scaled to time-to-expiry. Hedging: aggressive built-in (high-gamma near expiry); pin-day force-exit rule mandatory.
- **Vanna-wall / charm-wall fade.** Inputs: underlying, wall threshold, time-to-expiry, structure type. Hedging: built-in; hedge-band model adjusted because wall-driven flow can break naive hedging.

### 8.5 Why this matters

- **Efficiency:** the same model can be expressed as many vol strategies (different structures, different hedger configs, different regimes) without re-implementing the model logic. Composition compresses time-to-deployable-strategy.
- **Risk:** vol-specific validations (hedger-strategy consistency, pin-risk handling, vega-bucket concentration, surface-fit version pin) catch the high-cost errors before they reach production. Versioning makes rollback safe.
- **PnL:** auto-delta-hedge as a built-in component, not an afterthought, means every long-gamma strategy actually captures the gamma it's supposed to. Sasha runs many strategy variants per model; capacity and risk profiles differ by structure. Composition lets her capture each variant's distinct PnL contribution.

## 9. Promotion Gates & Lifecycle

The lifecycle (Research → Paper → Pilot → Live → Monitor → Retired) is enforced by promotion gates. The lifecycle UI is the surface Sasha uses every day to advance, demote, and retire her vol-strategy fleet.

### 9.1 The Lifecycle Pipeline View

A pipeline visualization, like a Kanban board. Universal layout per Marcus 9.1 (columns Research / Paper / Pilot / Live / Monitor / Retired; cards = strategies; controlled drag to propose transitions).

**Sasha-specific groupings on the board:**

- Group by strategy class — short-premium / long-gamma / calendar / skew / dispersion / event-vol — to see fleet balance at a glance.
- Group by underlying — BTC / ETH / alts / equity — to see per-underlying coverage.
- Group by tenor bucket — front / mid / back — to see term-structure exposure across the fleet.

### 9.2 The Gate UI per Transition

Each promotion is a checklist with evidence, not a chat conversation. Universal stage-transition criteria per Marcus 9.2 (Research → Paper, Paper → Pilot, Pilot → Live, Live → Monitor, Monitor → Retired, Retired → Research / Paper rare).

**Sasha-specific gate evidence:**

- **Research → Paper:** in addition to universal criteria, vol strategies must pass: hedger-strategy consistency check, pin-risk handling declared, vega-bucket budget within firm cap, surface-fit version pinned, smile-regime-classifier-uncertainty handling declared.
- **Paper → Pilot:** in addition to universal: N days of paper showing greek-attributed PnL roughly matching the backtest's greek-attribution distribution. Slippage in vol-points within backtest assumptions. Hedger realized cost within the cost-budget assumption. Pin-day behavior tested (if strategy held positions through any expiry during paper).
- **Pilot → Live:** in addition to universal: hedger gamma-scalping PnL realized vs implied within expected band; surface-fit residuals on the strategy's traded cells stable; correlation with existing live strategies within firm-fleet-correlation cap.
- **Live → Monitor:** auto-triggered on vol-PnL drawdown breach, on vega-bucket cap utilization spike, on hedger-cost vs gamma-PnL ratio divergence, on surface-fit residual instability.
- **Monitor → Retired:** decay confirmed (statistical evidence over multiple regime cycles).

### 9.3 Lifecycle Decision Log

Universal per Marcus 9.3. Append-only log of every transition: timestamp, strategy ID, version, from-stage, to-stage, decided by, reason, evidence links.

### 9.4 Lifecycle Cadence for Sasha

Vol strategies cycle at regime-cycle pace (faster than equity factor strategies, slower than crypto-perp microstructure strategies). Sasha's typical fleet state:

- **Research:** 15–25 vol strategies in active research.
- **Paper:** 8–15 strategies running on simulated fills (with hedger-realism), awaiting pilot promotion.
- **Pilot:** 10–20 strategies at 1–5% of target vega.
- **Live:** 100–180 strategies at full size.
- **Monitor:** 15–30 strategies on decay / regime-mismatch probation.
- **Retired:** dozens accumulated over time.

Daily / weekly Sasha is making 3–10 promotion decisions and 1–3 retire decisions across the fleet.

### 9.5 Why this matters

- **Efficiency:** lifecycle gates standardize quality control. Sasha does not need to design a custom evaluation framework per vol strategy.
- **Risk:** every strategy reaching live capital has passed vol-specific validation (hedger consistency, pin-risk, surface-fit pin, vega-budget). Pilots are watched aggressively because their hedger behavior is the highest-risk component.
- **PnL:** poorly performing vol strategies are retired by the lifecycle, not by Sasha's gut. Vol research is regime-dependent; the lifecycle's discipline matters more than in any asset class because vol regimes flip and an "alpha" strategy can become a "decayed" strategy in days.

## 10. Capital Allocation

The capital allocation engine decides how much capital — and crucially, how much **vega budget** — each strategy in Sasha's fleet receives. In vol trading, the allocation surface differs from a directional book: $-notional matters less than greek exposure distribution.

### 10.1 The Allocation Engine UI

**Layout:**

- **Top panel** — total capital available, currently allocated, free, in-flight. **Per-archetype vega budget** (Sasha's slice of firm vega-bucket caps, set by David), with utilization per tenor bucket. Per-underlying vega-cap utilization.
- **Main table** — every strategy with current capital allocation, current vega-by-tenor allocation, proposed allocation, delta, expected vol-Sharpe contribution, marginal vol-Sharpe contribution, capacity headroom, drift state, lifecycle stage.
- **Right panel** — risk decomposition of the proposed portfolio: gross / net / VaR / per-underlying-cluster / per-tenor / per-stress-scenario PnL. Vega-bucket concentration warnings. Greek-decomposition of the aggregate fleet.
- **Bottom panel** — methodology selector. Sasha picks (or combines) vol-Sharpe-proportional / vega-budget-parity / risk-adjusted-Kelly / regime-conditional / custom.

**The proposal:**

- Generated nightly; on-demand when Sasha wants.
- Auto-respects firm-level constraints (David's vega-bucket caps, gamma caps, theta budgets).
- Material changes flag for sign-off.
- "Approve and apply" updates strategy capital and vega caps; the platform respects.

### 10.2 Vega-Budget Allocation (Vol-Specific)

The vol-trader equivalent of capital allocation. Vega budget is allocated per (tenor bucket, underlying, strategy class), with firm-level caps cascading to trader-level to strategy-level.

**The surface:**

- **Per-tenor vega budget** — front / 1m / 3m / 6m / 1y+ buckets, with firm cap, Sasha's allocation, currently deployed, free.
- **Per-underlying vega budget** — BTC / ETH / alts / equity, same shape.
- **Per-strategy-class vega budget** — short-premium / long-gamma / calendar / skew / dispersion / event-vol, same shape.
- **Cross-cut utilization heatmap** — strategy-class × tenor bucket × underlying, color-coded utilization. Hot cells flag concentration risk.

When Sasha proposes increasing vega allocation to a strategy, the engine checks whether all relevant caps still hold. If not, the engine proposes which other strategy's vega should be reduced (typically the lowest-marginal-Sharpe strategy in the same bucket).

### 10.3 Per-Venue Margin & Sub-Account Routing

Vol strategies span multiple venues (Deribit, CME, Binance options, on-chain). Margin must be where it's needed, and portfolio-margin sub-accounts must be configured correctly.

**The surface:**

- **Per-venue margin balance** — USDT / USDC / BTC / ETH / cash, per venue, per sub-account. Total $-equivalent. Portfolio-margin (PM) sub-accounts vs isolated-margin sub-accounts distinguished.
- **Strategy-by-venue mapping** — which strategies need margin on which venue, with current consumption.
- **PM efficiency view** — for each PM sub-account, the offset benefit (how much margin is saved by netting the strategies' greeks). Encourages strategy combinations that benefit from netting.
- **Auto-rebalance proposals** — when margin concentrates on one venue (a successful short-premium fleet pulled premium-USDT into Deribit; a CME strategy needs margin), the platform proposes a transfer-with-policy.
- **In-flight tracker** — capital currently traversing transfers; $ value, expected arrival, source / destination.

### 10.4 Allocation Drift

Allocations drift during the day as strategies make / lose money and as greek exposures evolve. The engine continuously shows:

- Drift from optimal (proposed) allocation in $-notional terms.
- **Drift in greek-exposure terms** — vega-by-tenor drift, gamma drift, theta drift. The vol-trader-relevant drift dimensions.
- Whether to rebalance now (intraday) or wait for nightly.
- Cost of rebalancing (slippage, fees, hedge-cost on rebalanced positions) vs expected return improvement.
- Auto-rebalance thresholds (configurable per strategy class).

### 10.5 Capacity & Headroom

- **Per-strategy capacity utilization** — % of estimated vega capacity in use, color-coded.
- **Free capacity by tenor bucket** — strategies with vega headroom in their tenor bucket.
- **Capacity exhausted** — strategies at vega-bucket cap; signals being skipped.
- **Tenor-bucket-cap alerts** — when a tenor bucket reaches firm cap, all new entries in that bucket route to alternative tenor or queue.

Capacity is a primary constraint on Sasha's PnL; this surface is consulted continuously.

### 10.6 Why this matters

- **Efficiency:** allocation across 150–250 vol strategies with cross-cutting vega-bucket constraints is not solvable by spreadsheet. The engine compresses what would otherwise be hours of nightly work into a 10-minute review.
- **Risk:** systematic vega-bucket-parity / vega-aware Kelly / vega-aware Markowitz constraints prevent over-allocation to a single tenor bucket or underlying. Better diversification than gut sizing. Concentration in any one (tenor, underlying, structure) cell is the single worst risk profile for a vol book; the engine prevents it structurally.
- **PnL:** marginal vol-Sharpe analysis ensures incremental vega goes to where it has highest return. Capacity-aware sizing prevents over-trading thin tenor / underlying combinations.

## 11. Live Fleet Supervision Console

The console where Sasha supervises every live vol strategy in her fleet. Anomaly-driven by design: green by default; the trader is summoned only when something is off.

### 11.1 The Fleet Dashboard

The center of Sasha's automated-mode supervisor console.

**Layout:**

- **Top filter bar** — health badge filter (default amber + red); strategy class filter; underlying filter; tenor bucket filter; venue filter; lifecycle-stage filter.
- **Main grid / table** — one row per strategy. Columns:
  - Strategy ID, name.
  - Strategy class (short-premium / long-gamma / calendar / skew / dispersion / event-vol).
  - Lifecycle stage.
  - **Health badge** — green / amber / red, computed composite of vol-PnL deviation, drift, hedger-cost-vs-gamma-PnL ratio, slippage in vol-points, alert volume.
  - Capital deployed / cap.
  - **Vega-by-tenor exposure** — sparkline per row showing current vega-by-tenor profile. The vol-trader-distinctive column.
  - Gamma exposure.
  - Theta budget consumed today.
  - PnL today / WTD / MTD / YTD ($ and decomposed: delta / gamma / vega / theta).
  - Sharpe rolling 30d on vol PnL.
  - Drawdown — current / max-since-go-live.
  - Trade count today vs typical.
  - **Hedger state** — bands tight / wide, target delta, recent hedge frequency. Critical column.
  - **Smile-regime-fit** — strategy's expected regime vs live classifier output, alignment indicator.
  - Capacity utilization % (vega).
  - **Pin-day-proximity flag** — for strategies with positions near expiry.
  - **Sasha-specific columns:** entry IV-rank context for short-premium; entry IV-cone percentile for long-gamma; entry RR z-score for skew strategies; entry implied-correlation z-score for dispersion.
- **Sortable, filterable, expandable.** Group by strategy class / underlying / tenor bucket / venue toggleable.
- **Default view:** filtered to amber + red. With ~150–250 strategies, only 5–15 typically demand attention.

**Group-by views:**

- **By strategy class** — total class-level vol-PnL, class-level health, drill into instances.
- **By underlying** — per-underlying greek aggregation; cross-strategy net greeks per underlying.
- **By tenor bucket** — fleet vega-by-tenor concentration, term-structure exposure summary.
- **By venue** — venue-level capital and vega.

**Aggregate fleet greek panel (always visible):**

A persistent strip at the top of the dashboard showing the **aggregate fleet greeks**: total delta, total gamma, total vega-by-tenor (as a bar chart), total theta, total vanna, total volga. Click any bar to see which strategies contribute most. This is the foveal "where is my vol book" view across the entire automated fleet.

### 11.2 The Strategy Detail Page

Click a strategy → drill into its full state. Universal layout per Marcus 11.2 (header, live state section, signal feed section, diagnostic depth section).

**Sasha-specific content:**

- **Live IV surface for this strategy's underlying** — pinned to the detail page, with the strategy's current legs highlighted as dots on the surface (showing exactly where on the surface the strategy lives).
- **Greek state per leg, rolled up to structure** — full multi-dimensional greek table.
- **Hedger state for this strategy** — current bands, target delta, smile-corrected delta, recent hedge orders, gamma-scalping PnL realized vs implied (running tally with positive/negative needle).
- **Regime context** — current smile-regime classifier output vs strategy's expected regime; VRP regime; surface-fit residual on the strategy's traded cells.
- **Live equity curve (with backtest expectation overlay)** — divergence flagged.
- **Per-trade structure breakdown** — recent structures opened / closed by this strategy, with entry vol, exit vol, realized vol during hold, greek-decomposed PnL.
- **Drift indicators** — feature drift (especially smile-regime classifier and surface-fit residuals), prediction drift, performance drift.

This page is where Sasha does diagnostics. From here, she decides: pause, cap, retrain, leave alone, retire.

### 11.3 Anomaly Detection Surface

Universal anomaly categories per Marcus 11.3 (performance, behavior, feature drift, prediction drift, execution, capacity, correlation, regime mismatch, infrastructure).

**Sasha-specific anomalies:**

- **Hedger anomaly.** Hedger cost vs gamma-PnL ratio diverging from cost-model estimate; persistent hedger-cost overruns; hedger-frequency outside typical distribution.
- **Surface-residual spike.** Strategy's traded cells showing large fitted-surface residuals — either tradeable opportunity (if other strategies aren't already in) or surface-fit instability.
- **Smile-regime mismatch.** Strategy expected sticky-delta but classifier is calling sticky-strike; expected hedge correction is wrong-signed.
- **Pin-risk approach without exit rule firing.** Position holding into expiry with notional > threshold and no force-exit.
- **Vega-bucket cap breach.** Aggregate vega in a tenor bucket approaches or exceeds firm cap.
- **Realized > implied during long-gamma hold.** A long-gamma strategy is realizing less vol than it paid; gamma scalping is losing money.
- **Realized < implied during short-premium hold.** A short-premium strategy is realizing more vol than implied; short premium is underwater.

Each anomaly has severity, routing rules, and (for critical) auto-actions (auto-pause, auto-flatten-delta, etc.).

### 11.4 Cross-Strategy Correlation View

Universal layout per Marcus 11.4 (heatmap, drift indicators, cluster visualization, aggregate exposure decomposition).

**Sasha-specific:**

- **Vega correlation matrix** — strategies that overlap in vega-by-tenor exposure. Two strategies that look different at the structure level but have correlated vega profiles are effectively the same trade.
- **Surface-cell overlap heatmap** — for each (strike, tenor) cell, how many strategies are positioned in it. Concentration cells are the firm's biggest exposure points.
- **Cross-underlying vol correlation** — BTC-vol-strategy fleet vs ETH-vol-strategy fleet realized correlation.

### 11.5 Aggregate Greek + Vega-by-Tenor Live State

Distinct from the allocation engine's nightly proposal — this is the live, intra-day greek state.

**Layout:**

- **Top:** total fleet greeks (delta, gamma, vega, theta, vanna, volga, charm) updating live.
- **Center:** **vega-by-tenor and vega-by-strike heatmap of the entire automated fleet** — the closest the supervisor gets to "where is my vol exposure on the surface." A red-blue heatmap aligned to the same axes as the IV surface.
- **Per-underlying greek decomposition** — for each underlying, full greek breakdown across all strategies trading it.
- **Concentration alerts** — vega-bucket nearing firm cap; gamma exceeding desk limit; theta budget breach.
- **Quick actions** — flatten-delta-fleet-wide (instant via spot/perp; the only one realistic instantly), pause-all-on-underlying, pause-all-in-tenor-bucket, reduce-vega-bucket (proportional reduce across strategies in the bucket).

Foveal during a vol-regime-shift event or a venue incident.

### 11.6 Strategy State Inspection

A diagnostic surface that lets Sasha inspect the **internal state of a running vol strategy** — its current variables, signal evaluation, model output, regime classifier, hedger state, structure-level state — and compare live behavior against backtest expectation. Critical for verifying that a strategy is configured correctly, that live and backtest aren't drifting, and that the trader's mental model of the strategy matches what the code is actually doing.

This is a verification surface, not a continuously-streamed real-time view. It is implemented per strategy; the strategy declares which variables it exposes, and the platform renders them on demand. Some strategies expose 5 variables; some expose 50; engineering cost dictates depth.

**Two layers of inspection:**

#### 11.6.1 Internal-state view (per strategy)

A panel inside the strategy detail page that the trader opens on demand.

**What it shows (illustrative, varies per strategy):**

- **Current state variables** — strategy's internal counters / flags / regime classifications / running averages / hedger state. Displayed in a structured table with field name, current value, last-updated timestamp.
- **Current feature snapshot** — the input feature values the strategy is currently seeing. Useful for "is the smile-regime classifier returning what I'd expect right now?"
- **Last N signal evaluations** — for the last decisions: input features, model output, entry / exit / no-action decision, reason. Scrollable history.
- **Current structure state** — what legs the strategy is holding; greeks per leg + rolled up to structure; pending orders; pending hedge orders.
- **Hedger sub-state** — current band model, current target delta, smile-corrected delta correction value, last hedge order, hedge-cost realized today, gamma-scalping PnL realized vs implied today. **The hedger is part of the strategy and exposes its state alongside the strategy's main state.**
- **Risk-gate state** — daily vol-PnL accumulator, drawdown-since-go-live, vega-bucket utilization, gamma-cap distance, theta-budget consumption, pin-day proximity countdown.
- **Regime classifier output** — strategy's view of current smile regime, VRP regime, term-structure regime; strategies with regime gating expose which gates are open / closed.
- **Strategy-specific custom state** — for example, a calendar spread might expose: front-vs-back forward-variance estimate, convergence target, time-to-roll. A short-strangle might expose: entry IV-rank, current IV-rank, IV-crush realized, distance to stop-vol, distance to time-out. A skew-rotation might expose: entry RR z-score, current RR z-score, butterfly-neutralization residual.

**Refresh model:**

- **Refresh button** for on-demand snapshot. The most common interaction.
- **Auto-refresh toggle** for selected strategies (e.g. when actively diagnosing). Configurable cadence: 1s / 5s / 30s / 1min / off.
- **Schedule push** for selected strategies — the platform pushes state updates only when the strategy actually changes state. Lightweight, event-driven.
- **Engineering pragmatic:** the platform does not stream all variables of all 150–250 strategies in real time — that's heavy on backend and wasteful. Streaming is opt-in per strategy when the trader is actively inspecting; default is on-demand refresh.

**Per-strategy implementation:**

- The strategy declares its exposed state via a contract. The platform renders whatever the strategy declares.
- Some strategies expose comprehensive state (many internal variables, full hedger sub-state, regime classifier outputs).
- Some expose minimal state (just structure legs and current signal).
- The trader is not blocked if a strategy is light on exposed state; the supervision dashboard, model registry, and execution log give independent diagnostic angles.

#### 11.6.2 Backtest-vs-live comparison

For any live vol strategy, a side-by-side view comparing live behavior against backtest expectation. Critical for catching configuration drift early.

**Layout:**

- **Top:** equity curve, live (last N days) overlaid on backtest counterfactual (had the strategy run with the same parameters and same regime over the same period). Divergence flagged.
- **Per-trade comparison:** recent live structures opened / closed, what the backtest would have done at the same moment. Mismatches: live entered when backtest didn't; live structure differed (slightly different strikes due to surface availability); live hedger fired more / less than backtest.
- **Per-feature drift:** input features the strategy saw live vs the same features in the backtest's training distribution.
- **Hedger comparison:** live hedger frequency / cost vs backtest hedger simulation. The single most common source of live-vs-backtest divergence in vol strategies.
- **Greek-attribution comparison:** live PnL decomposition (delta / gamma / vega / theta / hedger-cost) vs backtest expected decomposition.
- **Diagnosis hints:** the platform suggests likely root causes if divergence is meaningful — feature drift, hedger-cost overrun, surface-fit drift, model drift, configuration mismatch.

**Use cases:**

- After Sasha deploys a new vol strategy to live: confirm the first weeks' behavior matches the backtest, especially the hedger behavior.
- When a strategy enters monitor stage: was the divergence caused by the live deployment or by the regime shift?
- When validating a candidate retrain: how does the new model's first weeks compare to its backtest?

**Refresh model:**

- Computed daily by default.
- On-demand refresh available.

#### 11.6.3 Why this matters

- **Efficiency:** when a vol strategy is misbehaving, Sasha can see exactly what it's "thinking" — including the hedger sub-state — without needing to run a fresh backtest or open the code repo. The diagnostic loop closes in minutes rather than hours.
- **Risk:** silent configuration drift between backtest and live is a major failure mode for vol strategies, where the hedger configuration is the most-common drift source. The comparison surface catches it before scaled vega makes the mistake expensive.
- **PnL:** strategies that match their backtest expectation can be scaled with confidence. Strategies whose live diverges from backtest are caught early and either fixed or capped.
- **Engineering verification:** the hedger sub-state being inspectable is the cleanest end-to-end test of the auto-hedger pipeline — if Sasha can see the right hedger state for a strategy, the surface feed, smile-regime classifier, hedger logic, hedge-venue routing, fill reconciliation, and PnL attribution are all working end-to-end.

### 11.7 Why this matters

- **Efficiency:** anomaly-driven attention compresses 150–250 vol strategies into ~5–15 to investigate. Sasha does not stare at 150 surfaces.
- **Risk:** anomalies — especially hedger anomalies and pin-risk approaches — are caught before P/L damage compounds. Auto-pause on critical alerts limits blast radius.
- **PnL:** time saved on supervision is reinvested in research. The leverage of the trader-quant role depends on this.

## 12. Intervention Console

When Sasha decides to act, the intervention console is the surface. Distinct from automatic actions (kill-on-breach, auto-hedge, auto-rebalance) — this is _Sasha's_ interventions.

### 12.1 Per-Strategy Controls

For any vol strategy, controls Sasha can apply:

- **Start / pause / stop** — with confirmation + audit trail.
- **Cap change** — increase / decrease vega-cap or capital cap. Modest changes auto-apply; large changes route to allocation-engine sign-off.
- **Risk-limit change** — daily vol-PnL loss limit, drawdown limit, vega-bucket cap, gamma cap. Audited.
- **Underlying / tenor whitelist / blacklist** — temporarily exclude an underlying or tenor (e.g. "exclude BTC weekly options for the next 7 days because of expected ETF announcement").
- **Hedger override** — pause hedger, force-hedge-now, change band width, change target delta, force smile-regime selection. All hotkey-bound.
- **Schedule modification** — pause active hours, add a blackout window.
- **Mode change** — live / paper / shadow.
- **Force-flatten** — close all structures on this strategy now. Reason field mandatory.
- **Demote to monitor** — move to monitor stage with reason.

Every intervention is logged: timestamp, actor, action, reason, pre-state, post-state.

### 12.2 Group Controls

- **Pause all in strategy class** — pause all short-premium / all long-gamma / all calendars / etc. Useful when a regime shift invalidates a class.
- **Pause all on underlying** — pause all strategies trading BTC vol because of a venue incident or an exploit affecting BTC.
- **Pause all in tenor bucket** — pause all front-month strategies before a major event.
- **Pause all on venue** — venue degradation; security incident.
- **Pause all in lifecycle stage** — pause all pilots during a major macro event.
- **Cap all by tag** — multiplicative cap reduction across a tagged set.
- **Reduce vega-bucket** — proportional vega reduction across all strategies in a tenor bucket. Useful for quickly de-risking before an event.

### 12.3 Manual Trading & Reconciliation

**Even in fully automated mode, Sasha must retain the ability to place, adjust, and close vol trades manually from the UI.** This is non-negotiable. Three primary scenarios:

**1. Emergency intervention.**
A vol strategy is misbehaving; the auto-flatten failed; an exchange is in a degraded state and the algo cannot reach it via API for closing options legs; an oracle deviation requires immediate position closure that the strategy isn't pre-coded to handle; a vol-regime shift mid-event produces greeks the auto-hedger can't keep up with. Sasha needs to flatten or adjust positions by hand right now. Hesitation costs PnL.

**2. Reconciliation between algo state and venue state.**
The platform's view of options-leg positions and the exchange's view should always match — but in practice they occasionally diverge (a partial fill on a multi-leg structure where the algo recorded full fill; a cancelled-but-still-open order due to venue-API glitch; a venue that briefly reported a wrong margin or position state). Sasha needs to manually align the two.

**3. Discretionary override on top of the automated book.**
A high-conviction macro / vol-regime view (FOMC outcome surprise, ETF announcement, exchange exploit, surprise vol-jump) where Sasha wants to layer a directional vol bet on top of what the strategies are doing — explicitly tagged as such. Often a multi-leg structure that doesn't fit any of the systematic templates.

The platform must support all three with **full manual-trading capability identical to the manual mode** described earlier in this doc. Sasha retains every surface from her manual workflow: 3D IV surface, skew / term curves, multi-leg structure builder (vol-quoted), options flow tape, scenario PnL grid, full multi-dimensional greek book. The manual surfaces don't disappear in automated mode; they are present and reachable but not the primary surface most of the day.

#### 12.3.1 The Full Manual Multi-Leg Vol-Quoted Order Ticket

The complete options order entry ticket from manual mode (see Phase 2 above and [common-tools.md#2-order-entry-ticket-framework](common-tools.md#2-order-entry-ticket-framework)).

- **All structures available:** straddle, strangle, covered call, cash-secured put, iron condor, iron butterfly, vertical spreads, calendar / diagonal spreads, risk reversals, ratios, back-spreads, plus arbitrary custom multi-leg.
- **Vol-quoted entry preserved.** Sasha enters "buy at 62 vol" not "buy at $1430." The ticket converts to $-price using the live underlying and the structure's net Black-Scholes price. Vol-pegged orders track the underlying tick-by-tick.
- **Live structure preview:** net debit/credit, max profit, max loss, breakeven(s), payoff diagram.
- **Greeks at entry preview:** net delta / gamma / vega-by-tenor / vega-by-strike / theta / vanna / volga / charm.
- **Pre-trade greeks impact** on the entire book including the automated fleet — full-book vega-by-tenor / vega-by-strike post-fill, full-book delta post-fill, vega-bucket cap utilization post-fill.
- **Hotkeys preserved:** all manual-mode hotkeys remain bound (quick-close-structure, roll-forward, delta-hedge-now, vega-flatten, smile-regime-cycle).
- **Block / RFQ workflow:** dealer panel, quote aggregation, anonymity / disclosure mode, counterparty-quality scorecard, block-leg structure for atomic multi-leg block entry. Same as manual.
- **Auto-hedge on fill** — even for manual trades, the auto-hedger fires by default. Optionally disabled via ticket toggle for cases where Sasha explicitly wants residual delta.
- **Compliance / pre-trade gates** — restricted-list, position-limit, sanctions, jurisdictional access.

Practically: the manual terminal is a tab in the supervisor console. Sasha presses a hotkey or clicks an icon → manual ticket comes up over the current view → she places the trade → the ticket closes back to the supervisor view.

#### 12.3.2 Trade Tagging & Attribution

Every manually-placed trade gets a mandatory tag:

- **Emergency intervention** — flagged for post-incident review; auto-included in the day's incident log.
- **Reconciliation** — paired with the algo state being reconciled (which strategy thought it had this position; what the venue showed). Reconciliation tickets generate an audit pair.
- **Manual override** — explicit directional / vol bet override; tagged with the macro-vol thesis or reason.

Attribution carries the tag through PnL, performance metrics, reports. David's behavioral monitoring tracks the frequency of each tag class — sustained increase in emergency interventions or overrides is a leading indicator David investigates.

#### 12.3.3 Reconciliation Workflow

A specific surface for the reconciliation case, because it's the most error-prone of the three for vol — multi-leg structures multiply the surface area for divergence.

**The reconciliation page:**

- **Left panel:** the platform's view — every option leg the strategies _think_ they have, per venue, per (underlying, expiry, strike, side).
- **Right panel:** the venue's view — every option leg the venue _actually_ shows, per venue.
- **Diff highlighted:** rows where the two disagree. Discrepancy size in contracts, $-notional, and $-premium.
- **Structure-aware reconciliation:** for multi-leg structures, the reconciliation page groups legs by structure so Sasha can see "this iron condor's lower-put leg is missing on the venue side" rather than four orphan rows.
- **Per-row actions:**
  - "Trust venue" — platform updates its internal state; strategy state corrected; audit logged.
  - "Trust platform" — venue is incorrect (rare); manual reconciliation order placed at the venue. Audit logged.
  - "Investigate" — opens a diagnostic with relevant fills, cancels, modifies.
- **Bulk actions** — "trust venue for all Deribit margin discrepancies" when source of divergence is known.

**Auto-trigger:**

- Continuous reconciliation in the background; minor discrepancies that resolve within seconds do not surface.
- Discrepancies above a threshold escalate to alerts.
- Sasha can run a manual full reconciliation on demand — typically end-of-day or after an incident. End-of-day reconciliation is mandatory; the close-of-day report is gated on it passing.

#### 12.3.4 Emergency Modes

A specific UI mode that Sasha can switch into during a crisis (see supervisor console mode-switching, section 14.2).

**Emergency mode reorganizes the screen:**

- **Manual multi-leg ticket pinned** — large, foveal.
- **Live IV surface for the focus underlying** — foveal, with current positions overlaid.
- **Aggregate greek panel** — what the entire automated fleet is exposed to, foveal.
- **Live position state across all venues** — second-largest panel, showing what's open and where.
- **Working orders across all venues** — what's resting that Sasha might need to cancel.
- **Strategy intervention console** — pause / kill / hedger-override controls visible.
- **Hedger override panel** — pause hedger, force-hedge-now, change band width — foveal because in many vol crises the hedger is the immediate problem.
- **Alert console** — relevant alerts streaming.
- **Latency / connectivity panel** — venue-by-venue connection state.

Hotkeys preserved; muscle memory from manual mode is the trader's most valuable asset during a real emergency.

**Switching into emergency mode** is a single keystroke. Switching back is one keystroke. Work-in-flight preserved; nothing lost.

#### 12.3.5 Manual Trading Hotkeys (Always Available)

Even in default research mode, certain manual-trading hotkeys are global:

- **Open manual multi-leg ticket** for currently-focused underlying.
- **Flatten delta** across the entire book (instant via spot/perp).
- **Cancel-all-on-focused-underlying.**
- **Pause hedger** for currently-focused strategy.
- **Force-hedge-now** for currently-focused strategy.
- **Vega-flatten focused structure** (close highest-vega leg).
- **Switch to emergency mode** (keystroke chord; less easily triggered).

These remain bound regardless of which mode the supervisor console is in. The trader's reflex to react manually is preserved.

#### 12.3.6 Audit & Friction

Manual trading is auditable but not friction-free for non-emergency cases:

- **Emergency interventions** — minimal friction. One confirmation, audit logged.
- **Reconciliation** — friction matched to size; small reconciliations are one-click; large ones require reason field.
- **Manual override (directional / vol bet)** — full friction: reason field, vol-thesis text field, confirmation gate, override tag mandatory. Friction reflects consequence — directional or vol-regime override outside the systematic framework should be a deliberate decision.

Every manual trade enters the same audit trail as algo trades, with manual flag and tag class. Searchable, reviewable, exportable.

#### 12.3.7 Why this matters

- **Efficiency:** in an emergency, seconds to a working manual multi-leg vol-quoted ticket = real PnL preservation. The platform's manual surfaces are first-class even when not the primary surface.
- **Risk:** reconciliation is a real operational risk for vol — multi-leg structures multiply the divergence surface area. Without a designed reconciliation workflow, leg states drift; positions get lost or mis-tracked; eventually a reconciliation incident produces a real loss.
- **PnL:** the ability to layer a high-conviction discretionary vol trade on top of the automated book lets Sasha capture event-vol alpha that pure systematic strategies miss. Tagged and audited so it's accountable.
- **Platform validation:** if Sasha can place every multi-leg vol-quoted trade her strategies make from the manual UI, the platform's options-execution layer is verified end-to-end.

### 12.4 Kill Switches at Multiple Scopes

Layered kill switches per [common-tools.md#19-kill-switches-granular](common-tools.md#19-kill-switches-granular):

- **Per-strategy kill** — cancel all working orders + close legs (via options unwind algo + RFQ for residual large legs) + flatten residual delta.
- **Per-strategy-class kill** — flatten the short-premium fleet; flatten the long-gamma fleet.
- **Per-underlying kill** — pull all firm activity on BTC vol; pull all activity on ETH vol.
- **Per-tenor-bucket kill** — flatten all front-month positions.
- **Per-venue kill** — pull all firm vol activity from this venue.
- **Fleet-wide kill — Sasha's entire automated cousin** — multi-confirmation; runs unwind algo prioritized by leg liquidity, with simultaneous block RFQ for the largest residual legs. **Note: "close all options" is not realistic instantly because options books are illiquid; the kill triggers a structured unwind, not an instant flatten.**
- **Flatten-delta-fleet-wide** — instant via spot/perp; this one **is** realistic instantly and is the most-used kill.
- **Firm-wide kill** — David + CIO + risk-officer; multi-key authentication for catastrophic events.

Each scope's kill is a designed action: cancel-or-flatten configurable, audit-trail mandatory, reversal procedure documented.

### 12.5 Intervention Audit Log

Append-only log of every intervention. Universal per Marcus 12.5. Sasha-specific: hedger overrides are first-class entries (any time the trader paused / force-hedged / changed band model on a strategy's hedger is a hedger-intervention entry).

### 12.6 Why this matters

- **Efficiency:** intervention scoping (per-strategy / class / underlying / tenor / venue / fleet) lets Sasha respond proportionately. She doesn't nuke the whole fleet for one venue's hiccup or one tenor's regime shift.
- **Risk:** every intervention is auditable. Catastrophe response is designed; the platform has practiced it. Hedger override capability is critical — when the hedger is the problem, the trader must be able to override without flattening the underlying vol position.
- **PnL:** the cost of over-intervention is missed gamma scalping, missed event vol, missed regime-mean-reversion. Granular controls plus disciplined auditing balance both.

## 13. Post-Trade & Decay Tracking

The feedback loop from yesterday's vol results into tomorrow's research. Every vol strategy is evaluated daily / weekly / monthly: did it perform as expected, is it decaying, does it need retraining, is it ready to retire?

### 13.1 Per-Strategy Retrospectives

Auto-generated per vol strategy on a configurable cadence (typically weekly + monthly).

**Layout:** universal per Marcus 13.1.

**Sasha-specific content:**

- **Greek-attributed PnL distribution** — realized vs research-time-expected delta / gamma / vega / theta / hedger-cost distributions. Where today's realized falls in each.
- **Hedger performance review** — gamma-scalping PnL realized vs implied; hedger-cost realized vs theoretical; smile-corrected vs raw delta accuracy backtest.
- **Surface-fit residual stability** — for the strategy's traded cells, residual time series during the period.
- **Smile-regime adherence** — % of period in each regime, per-regime PnL contribution, regime-fit health score.
- **Pin-day handling review** — for any expiries crossed, was pin-handling rule applied as expected?
- **Recommended action** — continue / retrain (which model: surface fit / smile classifier / fair-vol / dealer-positioning) / cap / monitor / retire.

### 13.2 Fleet-Level Review

Auto-generated weekly + monthly.

**Layout:** universal per Marcus 13.2.

**Sasha-specific content:**

- **Total vol-PnL decomposition** — by strategy class, by underlying, by tenor bucket, by regime, by greek (delta / gamma / vega / theta / hedger-cost).
- **Vega-bucket utilization over period** — peak utilization, average, breaches.
- **Hedger aggregate** — total fleet hedger cost vs total gamma PnL; net gamma scalping for the period.
- **Surface coverage map** — heatmap of (underlying × tenor × strike-bucket) cells the fleet was active in during the period.
- **Risk-adjusted contribution per strategy** — per-strategy vol-Sharpe contribution to fleet, marginal vol-Sharpe (if removed, fleet vol-Sharpe).
- **Correlation evolution** — vega correlation drift across the fleet.

Sasha reads this Sunday evening; informs Monday capital / vega-budget allocation decisions.

### 13.3 Decay Metrics Surface

A dedicated dashboard for catching decay early.

**Layout:** universal per Marcus 13.3.

**Sasha-specific content:**

- **Vol-Sharpe-over-time per strategy** — rolling vol-Sharpe with confidence bands. Statistical-significance flag on declining trend.
- **Half-life estimates per strategy class** — how long does this vol-edge persist before halving. Skew strategies vs short-premium vs gamma-scalping have very different decay profiles.
- **Surface-fit residual reliability** — for each strategy class, are the "residuals" the strategy used to enter still tradable? (When the surface fits more accurately, residuals shrink and the alpha shrinks; this is structural decay.)
- **Smile-regime classifier accuracy decay** — is the classifier still correctly identifying regimes? Misclassification rate trending up = retraining needed.
- **Hedger-cost vs gamma-PnL ratio drift** — is the hedger getting more expensive relative to the gamma it captures? Often a microstructure-regime signal.
- **Backtest vs live divergence** — point estimate + distribution.

This surface is consulted weekly. Decisions: queue retrain (which model), cap, demote to monitor, retire.

### 13.4 Retrain Queue UI

Universal layout per Marcus 13.4 (queue table, per-row actions, auto-approval thresholds, retrain history).

**Sasha-specific:** the retrain queue distinguishes what's being retrained — surface fit, smile regime classifier, fair-vol regression, fair-skew regression, dealer-positioning estimator. Different retrains have different cost profiles and different downstream cascade effects (a surface-fit retrain affects the entire desk; a strategy-specific fair-vol retrain affects only that strategy).

### 13.5 Retire Decisions

Universal per Marcus 13.5. The proposal includes decay evidence, replacement candidate (if any), recalibration paths exhausted, vega-budget freed.

**Sasha-specific:** retire decisions are sometimes regime-specific — "this skew-rotation strategy worked in the high-VRP regime that ended in Q1; retire for now, revisit in a new high-VRP regime." Retirement-with-revisit-flag is a first-class concept.

### 13.6 Why this matters

- **Efficiency:** retrospectives are auto-generated. Sasha reads, she doesn't compose.
- **Risk:** decaying vol strategies are caught by the metric, not by Sasha's anecdotal sense. Vol strategies decay regime-by-regime; the platform's regime-aware decay tracking is essential.
- **PnL:** retraining cadence is data-driven. Vega budget trapped in dying strategies is recycled into research priorities. The Learn → Decide loop closes.

## 14. The Supervisor Console — Sasha's Daily UI

The supervisor console is the integration of all the surfaces above into one workspace. It is not a single new surface; it's the layout / mode-switching / spatial organization of everything described.

### 14.1 Sasha's Monitor Layout (Illustrative)

A senior vol trader runs 5–6 monitors. Sasha's typical automated-mode layout:

| Position      | Surface                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Top-left      | **Fleet supervision dashboard** (default amber + red filter) with **aggregate greek panel** strip      |
| Top-center    | **Research workspace** (notebook environment with surface-aware helpers)                               |
| Top-right     | **Anomaly / alerts console + decay surface**                                                           |
| Middle-left   | **Live IV surface** for focus underlying (rotates through BTC / ETH / others as attention shifts)      |
| Middle-center | **Strategy detail page** (drill-down when investigating) + **scenario PnL grid** for the focus context |
| Middle-right  | **Capital + vega-budget allocation engine + per-venue margin state**                                   |
| Bottom-left   | **Aggregate fleet vega-by-tenor × by-strike heatmap** + **smile-regime classifier confidence**         |
| Bottom-right  | **Options flow tape + dealer-positioning (GEX / vanna / charm walls) + news / research feed**          |
| Tablet        | Telegram / Slack / Discord for desk chatter                                                            |

The supervisor console's center of gravity is **research workspace + fleet supervision + live IV surface**. The manual terminal's center of gravity (3D surface + structure builder + multi-dimensional greek book) is now distributed: surface and aggregate greek panel are still foveal because vol traders cannot work without them, but structure builder is one keystroke away rather than constantly visible.

The IV surface remains the most-glanced 2D surface even in automated mode. The vol trader thinks in surface terms; the surface stays foveal whether trading manually or supervising a fleet.

### 14.2 Mode-Switching

The console has modes; switching reconfigures the layout (per [common-tools.md#30-customizable-layout--workspace](common-tools.md#30-customizable-layout--workspace)):

- **Research mode (default during quiet hours):** notebook environment in foveal positions; supervisor + alerts in periphery; allocation engine collapsed; surface viewer pinned to a small panel for context.
- **Supervision mode (alert-driven):** fleet dashboard + strategy detail + aggregate greek panel + live IV surface for the relevant underlying foveal; research workspace minimized.
- **Expiry mode (expiry day):** active expiry's pin-risk dashboard + max-pain-strike monitor + per-underlying gamma strip + manual ticket-ready foveal. Aggregate fleet greeks visible. Strategies with positions through expiry highlighted.
- **Pre-event mode (FOMC, ETF announcement, NFP, CPI):** event-vol strategies' detail pages + pre-event IV-rank monitor + scenario PnL grid (with event-shape stresses) + manual ticket-ready foveal. Auto-hedger configurations reviewed before the event.
- **Post-market mode:** decay + retrospectives + capital / vega-budget allocation + experiment-priority-queue dominant.
- **Emergency mode (see 12.3.4):** manual multi-leg ticket + live IV surface + aggregate greek panel + venue connectivity + hedger override panel foveal.

Switching is one keystroke. Work-in-flight (open notebooks, pending interventions) preserved.

### 14.3 Anomaly-Driven Default State

The console is **green-by-default**. Most of the day, Sasha is heads-down in research; the supervisor surface is quiet. When something goes off, alerts route to her via:

- Banner on screen (auditable).
- Audio (configurable per severity).
- Mobile push (when away from desk).
- Phone page (catastrophe-tier only — exploit detected, oracle deviation, fleet-wide kill recommended, hedger runaway).

Sasha trusts the platform's silence. False-positive alerts erode trust quickly; the platform's tuning of severity / thresholds / suppression is critical to the trader's productivity. Vol-specific tuning matters: a transient surface-fit residual spike on a deep-OTM cell is not actionable; a persistent residual on a strategy's traded cells is.

### 14.4 Why this matters

- **Efficiency:** time-on-research is the trader-quant's primary leverage. The console design ensures research is foveal-by-default, supervision is peripheral-by-default. This is the inverse of the manual terminal.
- **Risk:** mode-switching to expiry mode or pre-event mode in seconds is the difference between contained damage and runaway loss when the regime shifts.
- **PnL:** the cognitive shift from foveal-position to peripheral-fleet is what makes 150–250 vol strategies tractable. Without it, scale is impossible.

## 15. Sasha's Automated-Mode Daily Rhythm

Crypto vol is a 24/7 market; CME equity vol is session-bound. Sasha's "day" is bounded by her shift; the strategies run continuously. Overnight supervision is split across regions (Asia / EU / NY shifts) or handled by the automated supervisor (with escalation rules to wake the on-call human for critical alerts, especially around overnight expiry windows for crypto and around CME-session opens / closes for equity vol).

### 15.1 Pre-Market (60–90 min)

The day starts with **fleet triage and research-priority setting**, not with watching a surface.

**Fleet review (15–25 min):**

- Glance at supervisor console. Default: most strategies green; investigate amber + red.
- Read overnight session attribution (Asia + EU sessions): which vol strategies generated PnL, which detracted, which behaved out-of-distribution.
- Scan aggregate fleet greek panel — net delta (should be near zero), vega-by-tenor distribution, gamma exposure, theta budget burn-down.
- Read alerts queue from overnight — hedger anomalies, surface-fit residual spikes, smile-regime classifier flips, vega-bucket cap utilization, pin-risk approaches.
- Make morning decisions: pause this strategy whose hedger cost exceeded threshold; promote that pilot; cap this skew strategy whose vega-bucket is exhausted.
- Verify expiry-day positions are at intended state — no overnight pin surprises.

**Surface read (10–15 min):**

- Quick scan of BTC / ETH / focus alts surfaces. Diff vs yesterday: where did the surface richen / cheapen overnight?
- Skew / term curves quick-glance — any extreme z-scores that should drive new strategy ideas or that suggest existing strategies should reduce / increase.
- VRP / IV cone check — vol-risk-premium regime context for the day.
- Smile-regime classifier confidence — has the regime flipped overnight? Any strategies with regime gating affected.

**Research catch-up (15–25 min):**

- Skim experiment-tracker results from overnight runs. Surface-history backtests, smile-regime-classifier retrains, hedger-config sweeps.
- Promote winners; archive losers with notes; review canary-deployment results from yesterday's promotions.

**Macro / event read (10–15 min):**

- Read morning notes — sell-side options strategist notes, ETF-flow research, dealer-color via desk chat.
- Identify regime-shift signals (FOMC week, CPI day, ETF announcement, geopolitical event imminent, large expiry imminent).
- Consider: are any of my vol strategies fragile to today's regime? Cap them, hedge them, or leave alone.
- Quick check on venue health (Deribit system status, Paradigm dealer panel availability, CME options session).

**Promotion-gate decisions (10–15 min):**

- Strategies waiting for promotion sign-off: review the gate evidence, sign off or send back with notes.
- Coordinate with David on any promotions material to firm risk (especially anything raising the firm's aggregate vega-by-tenor).
- Coordinate with Marcus on cross-asset crypto vol opportunities (when his microstructure read implies a vol regime not yet priced in the surface).
- Coordinate with Henry on equity vol overlap if firm trades both (cross-asset dispersion, factor-vol structures).

**Coffee / clear head:**

- Step away. The cognitive load of the rest of the day is research-heavy; preserve focus.

### 15.2 In-Market (continuous, anomaly-driven)

This is the radical shift from manual vol trading. Most of the day is **research, not surface-watching**.

**Default state:** trader is in the research workspace. Notebooks open. Working on:

- A new vol-strategy idea (from yesterday's review or this morning's surface read).
- Feature engineering — a hypothesis (e.g. "does the hedger band model perform better with regime-conditional bands when the smile-regime classifier has high confidence?").
- Model retraining for a strategy showing drift (typical: smile-regime classifier monthly retrain, surface-fit quarterly recalibration, fair-vol per-strategy as needed).
- Hyperparameter sweep on a candidate hedger configuration.
- Diagnosing a vol strategy that underperformed yesterday.
- Reading new sell-side or peer-firm vol research and prototyping ideas.
- Designing scenario PnL stresses for an upcoming event.

**Background:** supervisor console is open in another monitor; default green. Live IV surface for the focus underlying glanceable but not foveal. Alerts route to mobile when the trader is heads-down.

**Alert response (5–10% of the day):** when an alert fires (hedger anomaly, surface residual spike, smile regime flip, vega-bucket breach approaching, pin-risk approach):

- Drill into the strategy detail page.
- Diagnose: is this a true anomaly (intervene) or a known transient (acknowledge)?
- If intervene: pause, cap, hedger-override, force-flatten. Document the decision.
- If known transient: acknowledge with reason; system learns.

**Pre-event override (rare but real):** large macro release, surprise headline, exploit, vol-jump, mass liquidation, exchange auto-deleveraging vol position. Trader switches to event mode or emergency mode:

- Pause sensitive strategies (or let them ride if confident in the model's regime-handling).
- Use manual multi-leg vol-quoted ticket for any high-conviction directional vol bet (with override tagging).
- Manual hedger override on individual strategies whose configuration doesn't fit the event regime.
- Return to default mode when the event normalizes.

**Mid-day allocation review:** glance at the allocation engine's drift indicators. Material vega-bucket drift triggers a rebalance proposal; trader approves or defers.

**Cross-trader coordination:** brief desk-chat exchanges with adjacent archetypes (Marcus on cross-asset crypto vol read; Henry on equity vol structures around the next event; Quinn on cross-archetype factor-vol overlap; David on firm-level vega-bucket caps if Sasha is approaching).

**Expiry-day tempo (when applicable):** crypto monthly expiries, weekly expiries, quarterly expiries; CME equity vol expiries. Mode-switch to expiry mode 60+ min before expiry. Pin-risk monitor foveal. Aggregate gamma spike acknowledged. Manual override capability ready.

### 15.3 Post-Market (60–90 min)

End-of-day review and tomorrow's research priorities.

**End-of-day attribution (15–25 min):**

- Today's vol-PnL decomposition — by strategy class, by underlying, by tenor bucket, by regime, by greek.
- Hedger aggregate today — total fleet hedger cost vs total gamma PnL; which strategies' hedgers performed.
- Identify outliers — strategies that significantly outperformed or underperformed expectation. Note for retrospective.
- Verify all positions match intended state — full reconciliation pass mandatory at close. End-of-day report is gated on reconciliation success.

**Decay check (10–15 min):**

- Run the decay surface: any strategies whose vol-Sharpe trend is concerning?
- Any models needing retraining (surface fit quarterly, smile-regime monthly, fair-vol per-strategy, dealer-positioning monthly)? Approve the retrain queue or queue for overnight.
- Any features whose drift is growing? Consider downstream impact.

**Capital / vega-budget allocation (10–15 min):**

- Review nightly allocation proposal.
- Approve, modify, or escalate to David.
- Verify capital and vega-bucket utilization reflect the approved allocation.

**Research-priority setting (15–25 min):**

- Based on the day's findings: what's tomorrow's research priority?
- Queue overnight backtests / training runs (5–10 typically: surface-history backtests, smile-regime-classifier sweeps, hedger-config explorations).
- Update experiment-tracker priorities.
- Note any features to add to the library based on today's hypotheses.

**Promotion-gate triage (5–10 min):**

- Strategies ready for promotion review tomorrow morning.
- Gate evidence in place; trader sets reminder.

**Sign-off:**

- Confirm all alerts are acknowledged or resolved.
- Confirm fleet is in expected state for overnight running, especially overnight crypto expiry windows.
- Hand-off to next-shift supervisor (Asia coverage), or rely on automated supervision overnight (with escalation rules to wake the on-call for critical alerts).

### 15.4 Cadence Variations

- **Crypto-event-heavy weeks** (FOMC, CPI, ETF flow announcements, exchange security incidents) — supervision-heavy; less research; pre-event mode used repeatedly.
- **Major-expiry weeks** (monthly expiries on Deribit / CME) — expiry mode dominant on expiry day; pre-expiry preparation in the days before.
- **Quiet weeks** — research-dominated; the strategies run themselves; Sasha invests in alpha-generation.
- **Surface-fit retraining weeks** — quarterly, when the desk's surface-fit methodology is updated, Sasha spends meaningful time on cascade impact (which features change, which strategies need re-validation, which retrains queue).
- **Quarter-end** — cross-fleet review, retire decisions, capital + vega-budget reallocation, committee report contribution.

## 16. Differences from Manual Mode

| Dimension                  | Manual Sasha                                        | Automated Sasha                                                                                       |
| -------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Coverage                   | 2–4 underlyings × few tenors hand-managed           | 8–15 underlyings × multiple tenors × multiple structures running continuously                         |
| Strategies live            | 1 multi-leg book, ~50 active legs                   | 150–250 vol strategies, thousands of legs aggregated                                                  |
| Trades per day             | 5–30 high-conviction structures                     | Hundreds of structure entries / exits across the fleet, plus continuous hedger activity               |
| Phase 1 (Decide)           | Reading the IV surface                              | Choosing vol alpha to research; managing portfolio of vol strategies                                  |
| Phase 2 (Enter)            | Vol-quoted multi-leg ticket                         | Promote strategy through lifecycle gates; the same vol-quoted ticket present for emergency / override |
| Phase 3 (Hold)             | Watching greek book + scenario grid + hedger        | Anomaly-driven supervision of fleet; aggregate greek panel; hedger sub-state inspectable              |
| Phase 4 (Learn)            | Journaling lessons; surface replay manually         | Decay tracking, retraining, attribution-driven research priorities; surface replay scripted           |
| IV surface                 | Foveal, primary thinking surface                    | Foveal during diagnostics + entry; live aggregate-fleet vega-by-tenor heatmap is the new surface      |
| Time on surface            | 60–70%                                              | 5–15% (mostly diagnostic + research, not generative)                                                  |
| Time on research           | 5–10%                                               | 60–70%                                                                                                |
| Time on supervision        | 10–15% (continuous greek monitoring)                | 10–15%                                                                                                |
| Time on intervention       | (continuous hedging)                                | 5–10% (the hedger handles routine; trader handles overrides)                                          |
| Time on data / procurement | minimal                                             | 5–10%                                                                                                 |
| Time on capital allocation | minimal (per-trade vega sizing only)                | 5–10% (fleet vega-budget and capital)                                                                 |
| Hedging                    | Trader-managed with platform support                | Auto-delta-hedge integrated as a strategy component; trader supervises, overrides selectively         |
| Latency criticality        | High for hedging                                    | Per-strategy-class latency tiers; hedger latency tier especially tight                                |
| Risk units                 | $-notional + greeks                                 | Same + per-tenor-bucket vega + per-strategy-class concentration + correlation cluster                 |
| Edge metric                | Vol-PnL, gamma-scalp PnL                            | Vol-Sharpe, hedger-cost-vs-gamma-PnL ratio, decay rate, capacity utilization, marginal vol-Sharpe     |
| Cognitive load             | Foveal-on-surface-and-greeks                        | Peripheral-on-fleet-greeks; foveal-on-research-or-anomaly                                             |
| Failure modes              | Mis-hedge, missed regime shift, pin blow-up         | Silent overfit, decay-blindness, hedger runaway, regime-mismatch, alert fatigue, surface-fit cascade  |
| Tools mastered             | 3D surface, multi-leg structure builder, greek book | Surface-aware notebook, feature library, model registry, lifecycle gates, vega-budget allocator       |
| Pin-day handling           | Manual judgment + force-flatten                     | Strategy-level pin-day-force-exit rules + supervisor expiry mode                                      |
| Hedger configuration       | Trader sets bands and overrides intuitively         | Strategy-component-declared with regime-conditional rules; backtested; retrained                      |
| Compensation driver        | Vol-Sharpe + AUM                                    | Same + research velocity + fleet vol-Sharpe + hedger-quality                                          |

The fundamental change: **Sasha stops being the worker hand-managing one vol book and becomes the principal investor in her own vol-strategy fund, where every strategy carries an integrated hedger and the IV surface is the canvas on which the fund is composed.**

## 17. Coordination with Other Roles

### 17.1 Coordination with Marcus (Cross-Asset Crypto Vol)

Marcus runs CeFi crypto directional / microstructure / basis / funding strategies. His read on crypto regime, microstructure, dealer-positioning bleeds into Sasha's vol thesis; her vol-regime read bleeds into his directional risk management.

- **Cross-fleet correlation matrix shared** — Marcus's BTC / ETH directional fleet vs Sasha's BTC / ETH vol fleet pairwise correlation visible to both. When Marcus increases short-BTC exposure and Sasha is short BTC vol, the firm's combined exposure to a BTC-rally regime is non-trivial; the matrix surfaces this.
- **Funding-vol regime sharing** — Marcus's funding-rate features feed into Sasha's event-vol strategies (sudden funding-vol spikes correlate with realized vol jumps).
- **Microstructure regime sharing** — Marcus's microstructure features (CVD divergence, large-print intensity) inform Sasha's smile-regime classifier inputs.
- **Promotion-gate awareness** — when Marcus promotes a new directional strategy that materially increases firm crypto-spot exposure, Sasha reviews whether her vol fleet should reduce / increase to compensate. Vice versa: when Sasha promotes a new short-premium fleet that adds firm short-vol exposure, Marcus reviews implications for his directional strategies.
- **Joint research** — cross-domain alpha around crypto events (token unlocks, halvings, ETF flows) where direction and vol interact.
- **Operational handoff during catastrophe** — when an exchange exploit or oracle deviation hits, Marcus's flatten-spot and Sasha's flatten-delta both fire on the underlying; the platform coordinates so they don't double-up or cancel each other.

### 17.2 Coordination with Henry (Equity Vol Overlap, if firm trades both)

Henry runs equity long/short with discretionary overlay; his book has natural vol exposure (long calls, structured payoffs, overlay strategies). Where the firm trades both, Sasha's equity-vol fleet (CME equity vol, single-name vol) overlaps with Henry's structured equity exposure.

- **Cross-desk vol-exposure matrix** — Henry's vega exposure from his structures vs Sasha's CME equity vol fleet. Aggregate firm equity vega visible to both.
- **Earnings-window coordination** — Henry's earnings-window event strategies + Sasha's event-vol strategies on single-name equity. Where they overlap, attribution split rules.
- **Dispersion strategy coordination** — Sasha's index-vs-basket dispersion strategy needs visibility into Henry's basket-level exposures (some baskets Henry trades correlate with the dispersion baskets).
- **Joint research** — cross-asset dispersion (crypto-vs-equity vol regime), factor-vol structures (low-vol factor, momentum factor expressed via vol).
- **Promotion-gate awareness** — strategies that materially affect firm equity vol require both trader review.

### 17.3 Coordination with Quinn

Quinn runs cross-archetype factor / stat-arb / market-neutral systematic strategies. Some of her strategies have vol-related inputs (vol-of-vol features, regime-conditional sizing); some of her cross-archetype factor strategies may have vol-equivalent components.

- **Correlation matrix shared** — Quinn's fleet vs Sasha's fleet pairwise correlations visible to both.
- **Promotion-gate awareness** — Quinn promoting a factor strategy with vol-conditional components alerts Sasha; if Sasha's existing strategies would correlate, they negotiate (split capacity, kill one, etc.).
- **Feature sharing** — Sasha's smile-regime classifier and VRP-regime feature are useful to Quinn's risk-aware sizing; Quinn's cross-archetype regime classifiers are useful to Sasha's vol-strategy regime gating. The library is the connector.
- **Research collaboration** — joint research on vol-factor strategies, regime-conditional cross-archetype strategies.

### 17.4 Coordination with David

David is the firm-level supervisor. Sasha's automated cousin is a $X-allocated, vega-bucketed fleet within David's purview.

- **Fleet-level reporting** — David sees Sasha's ~150–250 strategies aggregated, with health / vol-PnL / vega-by-tenor / vega-bucket utilization / risk-consumed visible.
- **Vega-bucket cap allocation** — David sets firm-level vega-by-tenor caps; Sasha's slice is allocated within those. Material changes route to David.
- **Behavioral monitoring** — David watches Sasha's intervention frequency, override frequency, hedger-override frequency, retire-decision pace. Drift in these is a leading indicator (e.g. hedger-override spike often precedes a regime shift Sasha hasn't yet articulated).
- **Promotion-gate sign-off for material strategies** — strategies above a vega-cap threshold require David's sign-off in addition to Sasha's.
- **Catastrophe response** — firm-wide kill switches require David + CIO + risk officer; Sasha has fleet-level kill autonomy. **Note:** firm-wide kill on options books is a structured unwind, not an instant flatten, because options are illiquid; David's sign-off acknowledges this.
- **Risk-committee deliverables** — Sasha's monthly vol-PnL attribution, fleet-greek decomposition, lifecycle decisions feed into David's committee deck.

### 17.5 Why this matters

- **Efficiency:** without coordination, the firm builds the same vol exposure twice across desks, doubles up on capacity, dilutes attribution. Coordination layered on visibility tools (shared correlation matrix, vega-exposure matrix, promotion alerts, feature library) is cheap.
- **Risk:** correlated bets across desks compound risk. Visibility prevents the firm from accidentally over-exposing to a regime — a regime where Marcus is short crypto, Sasha is short vol, and Henry has long-call overlay positions is a triple-bet on "boring market" that compounds badly when vol-jumps.
- **PnL:** cross-desk research collaboration produces alpha that no single desk could find alone — cross-asset vol regime models, cross-domain event-vol strategies, factor-vol structures.

## 18. How to Use This Appendix

When evaluating Sasha's automated vol terminal (against any platform — including our own):

**Data layer:**

- Are all the options-data sources cataloged with quality / lineage / cost / freshness / used-by tracking?
- Are surface-fit archives (per-(underlying, timestamp) fitted surfaces with residuals) first-class catalog entries?
- Are block-trade archives, dealer-positioning estimates, and OI archives present?
- Is the procurement dashboard a serious tool, with attribution-vs-cost evidence?
- Is gap analysis tied to concrete vol strategies that can't be deployed?
- Are surface-integrity checks (calendar arb, butterfly arb) part of quality monitoring?

**Feature library:**

- Are Sasha's vol features (IV-rank, skew z-scores, RR / butterfly z-scores, surface-fit residuals, smile-regime classifier outputs, VRP regime, dealer-positioning estimates) first-class with drift monitoring?
- Are tensor-shaped features (per-(strike, tenor) outputs) supported as first-class, not flattened into scalars?
- Is the feature engineering surface frictionless inline-in-notebook, with surface-arb-clean input enforcement?
- Is cross-pollination across desks supported (Marcus's microstructure features, Henry's earnings features)?

**Research workspace:**

- Can Sasha go from idea to validated vol strategy in hours, not weeks?
- Is the backtest engine realistic — options-leg slippage curves, block-vs-screen execution simulation, vol-quoted entry mechanics, **auto-hedger simulated as part of the strategy**, margin / portfolio-margin modeling, pin-risk simulation, calendar-roll mechanics?
- Are vol-specific anti-patterns (greek-imbalance fraud, pin-blow-up survivor bias, surface-cleaning hindsight, vol-quoted-entry hindsight) caught by the platform?
- Is the strategy-template library populated with vol-specific templates (short-strangle-with-delta-hedge, calendar, gamma-scalping, dispersion, skew-rotation, event-vol, pin / max-pain)?

**Model registry & experiment tracker:**

- Can any vol model (surface fit, smile-regime classifier, fair-vol regression, dealer-positioning estimator) be re-trained from registered inputs and produce a bit-identical result?
- Are surface-fit version pins enforced through downstream features and strategies?
- Does the experiment tracker capture hedger-config dimensions, surface-fit-method choice, regime-conditional comparisons?
- Are vol-specific anti-patterns (surface-fit-method shopping) flagged?

**Strategy composition:**

- Is the composition surface visual + code-droppable, with the **volatility surface integrated as the canvas** — current surface displayed, target structure overlaid live as parameters change?
- Is **auto-delta-hedge a built-in component** — not an afterthought? Every vol strategy declares its hedger configuration at composition time, with band model, smile-corrected delta, hedge-venue routing, hedge-frequency caps, hedge-cost budget caps?
- Is **scenario PnL grid precomputed at composition time** for the proposed structure (spot × vol grid, surface-shape stresses)?
- Does pre-deployment validation catch hedger-strategy inconsistency, missing pin-risk handling, vega-bucket concentration, missing surface-fit version pin, smile-regime-classifier-uncertainty handling, hedge-venue availability, roll-day handling?
- Are vol-specific templates (short-strangle-with-delta-hedge, calendar, gamma-scalping, iron condor, skew-rotation, dispersion, event-vol, pin, vanna-wall fade) provided?

**Lifecycle:**

- Is the pipeline visualization usable as a daily kanban board, with strategy-class / underlying / tenor-bucket grouping?
- Are gates checklists with vol-specific evidence (greek-attributed PnL match, hedger consistency, surface-fit residual stability)?
- Is rollback one-click? Are hedger-config changes tracked as first-class strategy version changes?

**Capital allocation:**

- Does the allocation engine propose a nightly portfolio with **vega-budget allocation across (tenor bucket × underlying × strategy class)**, vol-Sharpe + marginal-Sharpe analysis, greek decomposition?
- Is per-venue margin and portfolio-margin sub-account routing first-class?
- Is the per-tenor / per-underlying / per-strategy-class vega-budget cap structure modeled with cap utilization heatmaps?
- Are PM efficiency views surfaced (margin saved by netting strategies' greeks)?

**Live fleet supervision:**

- Can Sasha supervise 150–250+ vol strategies anomaly-driven, default green, with **vega-by-tenor sparklines per row**, hedger-state column, smile-regime-fit indicator, pin-day-proximity flag?
- Is the **aggregate fleet greek panel** (delta / gamma / vega-by-tenor bar chart / theta / vanna / volga) persistently visible?
- Is the **aggregate fleet vega-by-tenor × by-strike heatmap** (the closest the supervisor gets to "where is my vol exposure on the surface") rendered with the same axes as the IV surface?
- Is the strategy detail page a complete diagnostic surface — including live IV surface for the underlying with strategy legs overlaid, hedger sub-state, regime context, greek state per leg rolled up to structure?
- Are vol-specific anomalies (hedger anomaly, surface-residual spike, smile-regime mismatch, pin-risk approach, vega-bucket cap breach, realized-vs-implied during long-gamma / short-premium hold) detected and severity-routed?
- Is **strategy state inspection** (internal variables, current feature snapshot, recent signal evaluations, regime classifier output, **hedger sub-state**) available on demand per strategy?
- Is **backtest-vs-live comparison** computed (daily by default, on-demand available) with hedger comparison and greek-attribution comparison?
- Is the platform pragmatic about state-streaming load (refresh-on-demand and event-pushed, not constant streaming for all 150–250 strategies)?

**Intervention console & manual trading:**

- Are kill switches granular (strategy / class / underlying / tenor / venue / fleet / firm) with multi-key authentication for the largest scopes?
- Is **the full manual multi-leg vol-quoted order ticket** preserved — all structures, vol-quoted entry, live structure preview with greeks, pre-trade greeks impact on the entire book, hotkeys, block / RFQ workflow, auto-hedge on fill — and one-keystroke-reachable from the supervisor console?
- Is **hedger override** (pause hedger, force-hedge-now, change band width, change target delta, force smile-regime selection) exposed both per-strategy and via global hotkeys?
- Is **emergency mode** a designed UI mode with manual multi-leg ticket + live IV surface + aggregate greek panel + hedger override panel + venue connectivity foveal?
- Is **structure-aware reconciliation** a designed workflow (algo state vs venue state for multi-leg structures, with diff highlighted at the structure level not the orphan-leg level)?
- Is end-of-day reconciliation mandatory (close-of-day report gated on it passing)?
- Is every manual trade tagged (emergency / reconciliation / override) and auditable?
- Are global manual-trading hotkeys (open multi-leg ticket, flatten delta, cancel-all-on-underlying, pause hedger, force-hedge-now, vega-flatten) bound regardless of supervisor console mode?
- Is every intervention logged with timestamp / actor / action / reason / pre-state / post-state, including hedger overrides as first-class entries?

**Post-trade & decay:**

- Are retrospectives auto-generated with greek-attributed PnL distribution, hedger performance review, surface-fit residual stability, smile-regime adherence, pin-day handling review?
- Is decay caught by metrics (vol-Sharpe trend, surface-fit residual reliability, smile-regime classifier accuracy, hedger-cost-vs-gamma ratio drift), not gut?
- Is the retrain queue actionable, distinguishing what's retrained (surface fit / smile classifier / fair-vol / dealer-positioning) and acknowledging cascade scope?
- Are retire decisions regime-aware (retirement-with-revisit-flag for regime-specific strategies)?

**Supervisor console:**

- Is research foveal-by-default and supervision peripheral-by-default?
- Is the live IV surface present and glanceable (vol traders cannot work without it), with the aggregate fleet vega-by-tenor heatmap as its automated-mode counterpart?
- Is mode-switching (research / supervision / expiry / pre-event / post-market / emergency) one keystroke?
- Is the platform green-by-default and trustworthy in its silence?

**Daily rhythm:**

- Can Sasha actually spend 60–70% of her time on vol research while the fleet runs supervised in the periphery?
- Are pre-market (fleet review + surface read + research catch-up + macro / event read + promotion gates), in-market (research-default + alert-driven supervision + expiry-day mode), and post-market (attribution + decay + allocation + research priorities + reconciliation) workflows supported by the right surfaces in the right modes?

**Coordination:**

- Is Sasha's fleet visible to Marcus, Henry, Quinn, David at the right level of detail (cross-fleet correlation matrix, cross-asset vega exposure matrix, vega-bucket utilization, promotion alerts)?
- Are cross-desk correlation, promotion alerts, feature sharing first-class?
- Is the firm-wide vega-bucket cap structure modeled with David's caps cascading to Sasha's allocation?

**Cross-cutting:**

- Is lineage end-to-end (data → surface fit → feature → model → strategy → trade → hedger → P/L)?
- Is reproducibility guaranteed across surface-fit versions, smile-regime classifier versions, hedger configurations?
- Are audit trails non-negotiable, including hedger-override audit?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
