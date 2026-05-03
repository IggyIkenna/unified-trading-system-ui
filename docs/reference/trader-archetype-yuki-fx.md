# Trader Archetype — Yuki Nakamura (Senior FX Trader, G10 + EM)

A reference profile of a top-performing FX trader at a top-5 firm. Used as a yardstick for what an ideal **foreign exchange** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
For the 30 surfaces shared across all archetypes, see [common-tools.md](common-tools.md).
For the index of FX-unique surfaces, see [unique-tools.md](unique-tools.md#yuki-nakamura--senior-fx-trader-g10--em).
For sister archetypes on the same desk, see the other `trader-archetype-*.md` files in this folder.

---

## Who Yuki Is

**Name:** Yuki Nakamura
**Role:** Senior FX Trader, G10 + EM
**Firm:** Top-5 global trading firm (FX desk within a multi-strat platform)
**Book size:** $2B – $10B daily turnover, with $50M – $200M VaR
**Style:** Discretionary, with semi-systematic short-term overlays. Multi-day to multi-month horizons.
**Coverage:** G10 majors (EURUSD, USDJPY, GBPUSD, USDCHF, AUDUSD, NZDUSD, USDCAD, EURGBP, EURJPY) + EM (USDCNY, USDINR, USDBRL, USDMXN, USDZAR, USDTRY)
**Instrument types:** Spot, forwards (outrights), FX swaps, NDFs (non-deliverable forwards for restricted EM), FX options (crossover with Sasha's surface), futures (CME)
**Trading window:** Continuous — 24/5 market, but Tokyo / London / NY sessions are her structured day

### How she thinks differently

FX is structurally distinct from equities, rates, or commodities:

- **Always a relative trade.** Every FX position is long one currency and short another. There is no "long EURUSD" without being short USD.
- **Most liquid market in the world** ($7T+ daily) — but extremely **fragmented** across ECN / multi-bank / single-dealer / voice / RFQ venues.
- **Central banks are first-order participants** — not just policy-rate setters but active interveners (BoJ, SNB, EM central banks).
- **Sessions matter.** Tokyo / London / NY / Sydney each have their own liquidity dynamics, fixing windows, and dominant flows.
- **Carry is a real factor.** Owning JPY pays nothing; owning MXN pays 10%+ overnight. Half of FX P/L often comes from carry, not direction.
- **Forwards and NDFs are the EM bread and butter** — many EM currencies don't trade onshore for foreigners; NDFs settle in USD without local-currency delivery.

### Her cognitive load

Yuki tracks:

- A **matrix of currencies**, not a list of instruments. EURUSD and USDJPY are not independent — both have USD on one side. A move in EURUSD is partly a EUR story and partly a USD story; she must decompose continuously.
- **Cross-currency relationships** — EURJPY is just EURUSD ÷ USDJPY (mathematically), but it trades with its own flow, vol, and carry.
- **Carry vs spot** — her P/L depends on both, with different signs in different regimes.
- **Event flow** — central bank meetings, intervention threats, capital-control changes, geopolitics affecting EM currencies.
- **Fixing windows** — daily WMR 4pm London fix is the largest concentrated FX event of the day; she trades around it.

The terminal must support a **currency-grid mental model**, not an instrument-list one.

---

## Physical Setup

**6 monitors**, with the FX grid at the center.

| Position      | Surface                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------- |
| Top-left      | **FX cross matrix** — every currency pair, % change today / 1w / 1m                      |
| Top-center    | **Multi-pair charts** — 4–8 of the most active pairs, multi-TF                           |
| Top-right     | **Carry & forward dashboard** — overnight points, forward curves, NDF curves             |
| Middle-left   | **FX vol surface** (crossover with Sasha) — IV by tenor and delta, smile, term structure |
| Middle-center | **Positions, exposures, P/L by currency**                                                |
| Middle-right  | **Order entry — spot, forward, NDF, swap, options tickets**                              |
| Bottom-left   | **Macro tickers** — DXY, US 10Y, equities, oil (USDCAD link), gold                       |
| Bottom-right  | **News, central bank speakers, intervention watch, EM political news**                   |
| Tablet        | Bloomberg / Reuters chat, IB FX strategist notes, podcast / interview                    |

She often runs the desk during **multiple sessions** — spending Tokyo hours covering JPY/CNY/AUD, then handing off or staying through London open for EUR/GBP, then NY open for activity.

---

## Phase 1: Decide

### FX cross matrix (her primary thinking surface)

A grid of every relevant currency vs every other:

|     | USD    | EUR    | JPY    | GBP    | CHF    | AUD    | CAD    | …   |
| --- | ------ | ------ | ------ | ------ | ------ | ------ | ------ | --- |
| USD | —      | 1.0850 | 152.30 | 1.2620 | 0.8810 | 0.6580 | 1.3650 | …   |
| EUR | 0.9217 | —      | 165.25 | 0.8597 | 0.9559 | …      | …      | …   |

Each cell carries current spot, color-coded % move today / week / month, **z-score of move** vs realized vol (is this unusual?), click-to-chart, and click-to-trade with the cross pre-populated. This is the FX-native foveal surface — no list-of-instruments view substitutes for it.

### Multi-pair charts

See [Multi-Timeframe Charting](common-tools.md#1-multi-timeframe-charting). **Yuki-specific characteristics:** 4–8 focus pairs pinned multi-TF (M5 / H1 / H4 / D1 / W1); volume profile sourced from CME FX futures (proxy for OTC); anchored VWAP from key dates (post-FOMC, post-intervention, post-fixing); **Ichimoku** as first-class (popular in FX, especially JPY pairs); **intervention zones** overlaid as price bands on pairs with active CB intervention history (USDJPY especially).

### Carry & forward dashboard

A foundational FX-native surface — carry is half the P/L story:

- **Overnight forward points** per pair — the daily carry cost.
- **Annualized carry** by pair — implied yield from forward curves.
- **Carry-to-vol ratio** — Sharpe-like measure for carry trades, ranked across pairs.
- **Forward curves** — points by tenor (1w, 1m, 3m, 6m, 1y) per pair.
- **NDF curves** for non-deliverable currencies (CNY, INR, BRL, KRW, TWD).
- **Cross-currency basis** — EURUSD basis swap, JPY basis — indicates dollar funding stress.
- **Fixing levels** — WMR 4pm London, ECB 1:15pm, NY 10am, Tokyo 9:55am, with deviation from realized.

### FX vol surface (crossover with Sasha)

FX-specific framing: implied vol per pair by tenor (overnight, 1w, 2w, 1m, 2m, 3m, 6m, 1y); ATM vs realized vol cones; **25Δ risk reversals** as one-sided-fear sentiment; **25Δ butterflies** as kurtosis pricing; strangles, straddles at various deltas; surface delta vs yesterday.

### Macro inputs

FX is highly macro-sensitive. Yuki overlays rate differentials (2y / 5y / 10y per pair), OIS-implied policy paths, real yield differentials (often more predictive than nominal), equity correlation as risk-on/off proxy, commodities (oil for CAD/NOK, gold for AUD/ZAR, iron ore for AUD, ag for BRL), and cross-asset vol (VIX, MOVE, oil vol).

### Central bank tracker

See [Catalyst / Event Calendar](common-tools.md#12-catalyst--event-calendar). **Yuki-specific characteristics:** per-bank countdown for FOMC, ECB, BoJ, BoE, BoC, RBA, RBNZ, SNB, PBoC, Banxico, BCB; OIS-implied policy path per bank; **intervention history** with levels marked on charts (BoJ, SNB, PBoC, EM); **FX reserves trends** — rising reserves often precede intervention to weaken own currency.

### Positioning & sentiment

CFTC IMM positioning by currency future; real-money flows (sell-side intel); retail FX positioning (OANDA, FXCM) as contrarian indicator; risk reversals & put/call skew as options-implied positioning.

### EM-specific surfaces

A first-class layer, not a sub-tab:

- **Capital control news** by country.
- **NDF onshore/offshore deviation** — onshore CNY vs CNH; gap signals stress.
- **Sovereign CDS spreads** — EM credit risk.
- **Sovereign debt auctions** — local-currency issuance.
- **EM political news** — election cycles, IMF programs, intervention threats.

### Sell-side research

See [News & Research Feed](common-tools.md#13-news--research-feed). **Yuki-specific characteristics:** morning notes from FX strategists (G10 + EM); trade ideas with track records; **fixing flow color** — flow expectations into key fixings, distributed pre-WMR.

**Layout principle for Decide:** the FX matrix is constantly scanned. Carry dashboard sits next to it. Vol surface and macro context are peripheral but frequently consulted. EM gets its own dashboard layer for capital controls, NDFs, political news.

---

## Phase 2: Enter

FX execution is venue-fragmented and product-fragmented. The terminal must unify spot, forward, NDF, swap, and options into one ticket framework.

### Spot ticket

See [Order Entry Ticket Framework](common-tools.md#2-order-entry-ticket-framework). **Yuki-specific characteristics:** pair selector with autocomplete and **base-or-quote notional toggle**; **multi-LP streaming** (top 5 bid / top 5 offer with LP attribution); **best-price aggregation** across ECNs and single-dealer streams; **last-look awareness** — venues with last-look risk flagged before send; algos include **fixing algos** targeting a specific fixing level alongside generic TWAP/VWAP/IS/peg.

### Forward / outright ticket

A first-class ticket, not a variant of spot. Pair, side, size, settlement date (or tenor); **forward points** displayed and editable; **implied carry** shown; **all-in rate** = spot + forward points; multiple LP quotes via RFQ.

### FX swap ticket

A swap is a single product (near leg + far leg), not two trades. Near-leg and far-leg specifications on one ticket; **swap points are the price** quoted, not two outright rates; **funding implications** displayed (am I borrowing this currency or lending it for the period?); used for funding / hedging rolls, especially month-end and quarter-end.

### NDF ticket & NDF curve board

For non-deliverable EM currencies (CNY, KRW, BRL, INR, TWD). Pair, side, size, **fixing date and settlement date as distinct fields**; NDF curve points displayed by tenor; **onshore vs offshore deviation** flagged in real time (CNH vs CNY, INR offshore vs onshore NDF); RFQ workflow — multiple bank quotes; settlement is USD-cash, no local delivery.

### Cross / synthetic ticket

For currencies not directly quoted, or where the synthetic is cheaper than direct. Cross built from two USD pairs (EURJPY = EURUSD × USDJPY); **direct-vs-synthetic comparison** with live cost of each path (synthetic occasionally wins by 0.1–0.3 pip); atomic execution of both legs when synthetic is chosen.

### FX options ticket

Crossover with Sasha but FX-optimized — see [Order Entry Ticket Framework](common-tools.md#2-order-entry-ticket-framework). **FX-specific characteristics:** multi-leg structures (straddle, strangle, risk reversal, butterfly, calendar); quoted in **vol** primarily, not premium; greeks displayed in pair-specific terms; delta-hedging in spot integrated.

### Fixing trade workflow

Distinct surface, not a flag on spot. Fixing-targeted orders execute at WMR 4pm London / ECB 1:15pm / NY 10am / Tokyo 9:55am; **countdown UI** as fix approaches; **depth around fix** for liquidity profile in the window; **expected impact** based on flow indicators and historical fixing realization; **net buy/sell flow expected** at fix from sell-side color.

### Block trade / RFQ

See [Smart Order Router / Multi-Venue Aggregation](common-tools.md#5-smart-order-router--multi-venue-aggregation). **Yuki-specific characteristics:** RFQ to dealer panel for size; quote aggregation with response-time latency per LP; one-click execute; anonymized vs disclosed RFQ depending on relationship.

### Intervention awareness

**Intervention zones overlaid on chart** for pairs with active CB intervention (USDJPY especially); pre-trade warning fires when entering inside a zone — "BoJ has intervened above 158 in past 3 months."

### Pre-trade compliance

See [Pre-Trade Risk Preview](common-tools.md#3-pre-trade-risk-preview). **Yuki-specific characteristics:** position limits per **currency**, not per pair; country / sanctions lists for EM; counterparty limits for OTC products (forwards, NDFs, swaps, options).

### Hotkeys

See [Hotkey System](common-tools.md#6-hotkey-system). **Yuki-specific characteristics:** flatten by **pair**; **roll forward** in one keypress (close near, open far on same notional).

**Layout principle for Enter:** spot and forward tickets are central. NDF and options are first-class for EM and cross-asset users. Fixing workflow integrated. Multi-LP aggregation visible.

---

## Phase 3: Hold / Manage

FX positions evolve through carry, spot moves, and event-driven repricing. Yuki manages **currency exposures**, not pair positions.

### Positions blotter — currency-decomposed

See [Positions Blotter](common-tools.md#7-positions-blotter). **Yuki-specific characteristics:** a list of pair positions doesn't show real exposure — **net delta per currency** (long EUR, short USD, short JPY, long AUD, etc.) is the primary view, aggregated across all pair positions plus options delta plus forward / NDF settlement obligations. Pair view is secondary, used for execution-oriented work.

### Forward / settlement ladder

**Settlement obligations by date** — what currencies must I pay / receive on T+1 / T+2 / T+3 / further out; **net settlement per date per currency**; **funding cost** for any currency where I'll be short on settlement; visual ladder lets her spot crowded settlement dates and pre-fund.

### NDF positions

**Open NDFs by fixing date**; onshore vs offshore tracker for each; **pre-fixing risk** as fixing approaches (gap convergence behavior).

### Live PnL — FX-style decomposition

See [Live PnL Panel](common-tools.md#9-live-pnl-panel). **Yuki-specific characteristics:** P/L decomposed into **spot move**, **carry** (overnight roll, pip-by-pip), **vol** (options), **fixing** (slippage vs target fixing rate), and **funding cost** (currency borrows). **Per-currency P/L** is shown alongside per-pair P/L.

### Risk panel

See [Risk Panel (Multi-Axis)](common-tools.md#10-risk-panel-multi-axis). **Yuki-specific characteristics:** currency exposures with limits (not just pair exposures); pair-level **and** currency-level VaR; **vega by pair** if options-heavy; **carry exposure** = total daily carry P/L; counterparty exposure for OTC forwards / options / NDFs.

### Stress scenarios

See [Stress / Scenario Panel](common-tools.md#11-stress--scenario-panel). **Yuki-specific characteristics:** DXY ±3%; **risk-off shock** (JPY +5%, CHF +3%, EM −5%); EM-specific shocks (BRL −10%, MXN −5%, ZAR −8%); **intervention scenarios** (BoJ intervenes at USDJPY 162); **central bank surprise** (50bps unexpected hike/cut with cross-pair propagation).

### Carry-trade unwind risk monitor

A dedicated surface — the JPY/CHF carry-unwind is the canonical FX pain trade. Tracks **total daily carry P/L** running; **carry concentration** (is most P/L coming from one funding currency, e.g. JPY-funded carry trade?); **carry-to-vol ratio** of book; **unwind signal** that flags red when funding currency rallies in risk-off and projects book impact.

### Fixing approach surface

For trades targeting a fixing: time-to-fix countdown per active fixing-targeted order; current depth around expected fix; best execution path (single LP vs sweep); recent fixings' realization vs WMR-published rate.

### Alerts

See [Alerts Engine](common-tools.md#14-alerts-engine). **Yuki-specific characteristics:** **carry decay alerts** (funding cost rising on a position); **intervention alerts** (pair approaching historical intervention zone); **fixing countdown alerts**; **EM political alerts** (capital control changes, election results); cross-asset alerts when oil/equities move pairs (CAD, NOK, AUD).

### Trade journal

See [Trade Journal](common-tools.md#15-trade-journal). **Yuki-specific characteristics:** **carry-trade-specific journal** with pre-defined exit triggers — when does the funding currency rally become my problem.

### Communications

See [Communications Panel](common-tools.md#17-communications-panel). **Yuki-specific characteristics:** **sell-side FX desk chat** for flow color, axes, fixing flow; **EM specialist chat** for political risk and capital controls; internal economist notes for relevant central banks.

### Heatmap

See [Heatmap of Own Book](common-tools.md#16-heatmap-of-own-book). **Yuki-specific characteristics:** currency grid colored by exposure × today's move — read by currency, not by pair.

### Kill switches

See [Kill Switches (Granular)](common-tools.md#19-kill-switches-granular). **Yuki-specific characteristics:** **flatten by currency** (close all positions long/short a specific currency, not by pair); **hedge to neutral** (buy-back of dollar exposure).

**Layout principle for Hold:** currency-decomposed exposure is foveal (not pair-list). Carry monitor and fixing approach are critical FX-specific surfaces.

---

## Phase 4: Learn

FX post-trade emphasizes **carry vs spot decomposition**, **session attribution**, and **execution quality** in a fragmented market.

### Trade history

See [Trade History / Blotter (Historical)](common-tools.md#21-trade-history--blotter-historical). **Yuki-specific characteristics:** every fill carries pair, side, size, price, venue, **LP**, all-in cost vs mid at decision; fixings settled at, with **deviation from realized fix**; tagged by strategy (directional, carry, fixing flow, event, vol).

### PnL attribution

See [PnL Attribution (Multi-Axis)](common-tools.md#22-pnl-attribution-multi-axis). **Yuki-specific characteristics:** **spot vs carry vs vol decomposition** per trade; by currency (which currencies generate alpha); **by session** (Tokyo vs London vs NY skill); by regime (risk-on / risk-off); by event (FOMC / ECB / BoJ trades, NFP trades, intervention trades).

### Performance metrics

See [Performance Metrics](common-tools.md#23-performance-metrics). **Yuki-specific characteristics:** **currency hit rate** (per-currency win rate); **carry capture** (what fraction of available carry was earned); vol-adjusted return per currency.

### Carry trade analytics

**Carry P/L vs spot loss** (was carry sufficient compensation?); **drawdown days** when carry trades unwound (how bad?); **time-to-recovery** after carry unwinds.

### Fixing analytics

**Fixing slippage** — average vs WMR realized, sliced by fixing window (London 4pm vs ECB vs NY vs Tokyo); **fixing-flow direction** prediction accuracy.

### LP scorecard & TCA

See [Execution Quality / TCA](common-tools.md#25-execution-quality--tca-transaction-cost-analysis). **Yuki-specific characteristics:** spot TCA fill vs mid by venue and LP; **LP scorecard** with fill rate, response latency, **last-look rejection rate**; forward / NDF TCA (fill vs theoretical = spot + points); block / RFQ TCA (best-quote frequency by dealer); **fragmentation cost** — would single-venue execution have been worse?

### EM-specific analytics

NDF execution quality; **capital control event response** (did I exit in time?); **onshore vs offshore P/L** for currencies traded both ways (CNY vs CNH).

### Behavioral analytics

See [Behavioral Analytics](common-tools.md#26-behavioral-analytics). **Yuki-specific characteristics:** **session bias** (do I make money in some sessions and lose in others?); **carry-trade discipline** (did I cut on time when funding cost rose?); **fixing discipline** (did I trade _the_ fixing or _around_ it?).

### Reports

See [Reports](common-tools.md#27-reports). **Yuki-specific characteristics:** daily P/L commentary with **carry vs spot split**; monthly attribution by currency / pair / session / event; OTC compliance filings (ISDA, EMIR, Dodd-Frank).

**Layout principle for Learn:** currency / pair / session / regime slicing. Carry vs spot is the fundamental decomposition.

---

## What Ties Yuki's Terminal Together

1. **The FX matrix is the chart.** A grid of currencies × currencies, not a list of instruments.
2. **Currency exposures, not pair exposures, are the unit of risk.** Decomposed across all positions.
3. **Carry is first-class.** Carry P/L is tracked alongside spot P/L; carry trade unwind risk is monitored.
4. **Spot, forward, NDF, swap, options are unified.** One ticket framework, mode-aware.
5. **Multi-LP aggregation is mandatory.** No single venue has the best price; the terminal aggregates.
6. **Fixing workflow is integrated.** Fixing-targeted orders, countdown, slippage tracking.
7. **Sessions matter.** Tokyo / London / NY structure is reflected in dashboards, alerts, and attribution.
8. **EM is a first-class layer.** NDFs, capital controls, political news, onshore/offshore deviation.
9. **Central banks are live participants.** Intervention zones, policy paths, speaker tracking.
10. **Counterparty / venue fragmentation is managed.** Last-look awareness, LP scorecards, RFQ aggregation.

---

## How to Use This Document

When evaluating any FX terminal (including our own), walk through Yuki's four phases and ask:

- Is the FX matrix (currency × currency grid) a foveal visualization?
- Are currency exposures decomposed from pair positions?
- Are carry and forward curves first-class data?
- Are spot, forward, NDF, swap, and options unified in the order ticket framework?
- Is multi-LP aggregation visible and used in execution?
- Is fixing workflow (WMR, ECB, NY, Tokyo) integrated?
- Does the terminal model sessions (Tokyo / London / NY) explicitly?
- Is EM treated with appropriate respect — NDFs, capital controls, political news, intervention?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.

---

# Automated Mode

This appendix extends Yuki's manual workflow with the automated-trading platform layer. For the universal automated-trading concepts this builds on, see [automation-foundation.md](automation-foundation.md). For the worked-example shape, see [trader-archetype-marcus-cefi.md](trader-archetype-marcus-cefi.md). For the structural template, see [automation-archetype-template.md](automation-archetype-template.md).

Yuki sits in the **partially-automatable** tier. The mechanically-encodable parts of her edge — carry harvesting, cross-vol relative value, fixing-flow strategies, mean-reversion on majors, NDF arb on EM where data permits — translate cleanly into a fleet of automated strategies. What does **not** translate cleanly is her EM political-risk overlay, capital-control event interpretation, and intervention reads on BoJ / SNB / EM CBs. The platform pushes those judgment surfaces up the leverage curve; it does not bypass them.

> _Throughout this appendix, examples are illustrative — actual venue lists, strategy IDs, dataset names, feature names, fixing windows, and metrics shown are sample shapes to make surfaces concrete. The platform's real catalog will differ._

## 1. What Yuki's Edge Becomes

Her manual edge encoded as automated **strategy classes**, each spawning many **strategy instances** across pairs, sessions, fixings, and parameter profiles.

- **Carry-strategy fleet** — long high-yielders / short low-yielders, sized by carry-to-vol ratio, with regime gating (risk-on / risk-off) and unwind triggers wired to the funding-currency rally signal. Instances span G10 carry baskets (long AUD/NZD/CAD funded by JPY/CHF), EM carry baskets (long MXN/INR/BRL funded by JPY or USD), single-pair expressions (USDJPY directional carry, AUDJPY classic carry), and forward-implied carry (rolling 1m / 3m forwards rather than spot+rollover). Dozens of instances; survivorship gated by carry-to-vol falling below a threshold per instance.
- **Cross-vol strategies** — relative value across the FX vol surface: vol-of-vol mean-reversion per pair, term-structure trades (1m vs 3m straddles), risk-reversal mean-reversion (25Δ RR drift back to the smile's neutral state), butterfly trades on kurtosis dislocation. Strategies output multi-leg vol-quoted structures consumed by the FX options ticket. Crossover with Sasha's surface; coordination at composition time so positions don't double-up.
- **Fixing-flow strategies** — pre-positioning into the WMR 4pm London / ECB 1:15pm / NY 10am / Tokyo 9:55am fixing windows based on flow-color signals, fixing-history seasonality, and pre-fix order-imbalance estimates. Each fixing window is a distinct deployment-cadence driver. Instances per fixing × per pair × per direction (buy-the-fix vs sell-the-fix) × per signal regime. Auto-flatten policy aligned to the post-fix mean-reversion window.
- **Mean-reversion on majors** — short-horizon mean-reversion on EURUSD / USDJPY / GBPUSD / EURGBP after dislocations (z-scored deviations from anchored VWAP, post-event overshoots, intraday range extremes). Microstructure-fast where venue latency permits; multi-LP execution to capture best-fill. Distinct parameter profiles per session (Tokyo / London / NY).
- **Trend-and-momentum overlays on majors** — daily / weekly trend continuation strategies on cleaner pairs (EURUSD, AUDUSD, USDCAD), sized by realized-vol regime and gated by the central-bank-event proximity (no fresh entries 24h before FOMC / ECB / BoJ).
- **NDF arb (where data permits)** — onshore-vs-offshore deviation strategies on CNY/CNH (deliverable spot vs CNH offshore vs CNY NDF), KRW NDF vs onshore proxy, INR NDF curve dislocations vs implied-yield, BRL onshore-vs-NDF gap. **Heavy human gating on EM political risk:** strategy auto-pauses on any capital-control news flag in the EM political tracker.
- **Cross-currency basis strategies** — EURUSD basis swap, JPY basis, AUD basis. Basis dislocations are signals for funding-stress and inputs to forward-pricing strategies. Strategy class often used as an overlay risk-gate on carry strategies (basis blow-out → cap carry exposure) rather than a standalone alpha generator.
- **Rate-differential / OIS strategies** — 2y rate differentials translated into FX directional bets when the differential breaks from its rolling distribution. Coordinates with Ingrid's curve fleet on the rate side; FX execution is Yuki's leg.
- **Intervention-aware mean-reversion** — passive bidder / offerer at known historical intervention zones (USDJPY into the 158–162 band; USDCNH into PBoC daily fix corridor). Auto-pauses on confirmed intervention headline; resumes after cool-down. **Intervention interpretation stays human; the strategy's trigger thresholds are human-set.**
- **Cross-asset FX strategies** — oil → CAD/NOK linkages, gold → AUD/ZAR, iron ore → AUD, ag → BRL, equities → JPY/CHF as risk-on/off proxies. Cross-asset signal generation; FX leg execution.

Each strategy class has 5–30 live instances at any time (different pairs, sessions, fixings, parameter profiles). Total fleet: ~150–250 strategies, scaling as new pairs come online or new fixing windows are added. Coverage shifts from "the 8–10 pairs Yuki actively trades manually" to "every pair in her universe × every relevant session × every fixing window," with her acting as the principal investor in her own FX quant book.

Yuki's day is no longer "find a great trade." It is "make sure the firm's FX capital is deployed across all of these strategies at correctly-sized scale, supervise for decay, retire what's broken, push new alpha — and **stay manually engaged on EM political risk, capital-control events, and intervention reads, where automation has no edge.**"

## 2. What Stays Yuki

The platform automates execution, signal-generation, carry-tracking, and fixing-workflow. What stays her:

- **EM political-risk integration.** A presidential election in Brazil, an IMF program negotiation in Argentina, a cabinet shuffle in Turkey, a coup attempt anywhere in EM Africa. The platform notices the headline (EM political news feed) and flags affected strategies. Yuki interprets second-order implications — does this kill the BRL carry bucket for the next week? Does this open NDF arb opportunities on the offshore-onshore gap? Does it require a hard pause on the EM book until the political picture clarifies? Models do not read political tea-leaves.
- **Capital-control event interpretation.** When a central bank tightens or loosens FX-conversion rules (China, India, Korea, Turkey, Argentina have all done this in living memory), the mechanical impact on NDF strategies, onshore-offshore gaps, and forward-pricing is non-trivial and idiosyncratic per regime. Yuki reads the regulatory text, talks to EM specialist desks, and decides whether to pause / cap / re-parameterize the affected strategies. The platform's role is to surface the event and the dependency map; the judgment is hers.
- **Central-bank intervention reads.** BoJ at USDJPY 158 / 160 / 162 levels. SNB during EURCHF episodes. PBoC at the daily fix corridor edges. EM CBs in defense of their own currencies (Banxico, BCB, RBI). The platform tracks intervention history and flags zones; Yuki decides whether the next move into the zone is a fade-the-test entry or a step-out-and-watch moment. Intervention is theatrical — the timing, the size, the verbal coordination — and has features that are not in any feed.
- **Fixing-flow color interpretation.** Sell-side fixing-flow color is qualitative ("real-money $5bn EUR buyer expected at the London fix"). The platform ingests the chat, structures it where possible, and surfaces it on the fixing-approach surface. But the trader's read on which color to trust, which to fade, and which is positioning-talk vs real flow is human.
- **High-conviction directional override.** When Yuki has a strong macro view (a CB decision she expects the market to misprice, an EM event she believes has been over-discounted, a fixing she believes will flow against consensus), she layers a directional trade on top of the systematic book — explicitly tagged as override, audited as such.
- **Counterparty / venue policy.** Sizing exposure to a single-dealer stream during stress, evaluating a new ECN, deciding whether to keep last-look venues in the routing pool, pulling capital from a venue with stressed credit — all human.
- **Catastrophe response.** SNB-style intervention shock, sudden capital-control imposition, an EM sovereign default, a stablecoin-style depeg of a dollar-pegged EM currency, a major bank's FX-clearing incident. The first 60 seconds of judgment beat any pre-coded response. The platform's role is to make triage actionable — one-click flatten-by-currency, one-click pause-EM-book, one-click hedge-to-USD-flat.
- **Strategic capital allocation across pairs and sessions.** The allocation engine proposes; Yuki approves or modifies. Material reallocations (more to G10 carry at the expense of EM NDF arb; more to fixing-flow at the expense of trend) are decisions, not optimizations.
- **Cross-desk coordination on rate-FX linkages.** When Ingrid's curve view implies an FX move, the negotiation of who owns which leg, the timing, the attribution split, the capacity allocation — all human.
- **New strategy invention.** "I noticed the WMR fixing realization has been increasingly skewed in the last six weeks since the LSEG methodology change; let me model that." Idea origination is human; the platform makes it cheap to test.

The platform is opinionated about what to automate and humble about what cannot be. Yuki's judgment surfaces — political-risk, capital-control, intervention, fixing-flow color — are made higher-leverage by automation, not bypassed.

## 3. The Data Layer for Yuki

The data layer is the substrate of everything Yuki does in automated mode. FX is one of the most data-fragmented asset classes — there is no single consolidated tape, every venue's depth is its own, fixing histories live with the fix providers, central-bank intervention is reported across heterogeneous channels. A serious data layer is the precondition for a serious FX automation effort.

### 3.1 The Data Catalog Browser

Yuki's home page when she opens the data layer.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters: data type (spot tick / forward / NDF / FX vol surface / fixing history / intervention archive / OIS-and-rate-differential / capital-control event / CFTC IMM positioning / cross-currency basis / sell-side fixing color); cadence (real-time / minute / EOD / event-driven); coverage (G10 / EM-tier-1 / EM-tier-2 / NDF-only); license tier (premium / standard / public); cost band; freshness (live / stale / failed).
- **Main panel** — table of datasets matching filters. Columns: name, source / vendor, coverage summary (e.g. "Bloomberg FX vol surface; G10 + EM tier-1; ATM + 25Δ + 10Δ; tenors O/N to 2y; 2010–present"), cadence, freshness indicator, license terms (redistributable / client-report-safe / firm-internal-only), annual cost, owner, last-updated.
- **Right pane** — when a dataset is selected: full description, schema, sample rows, lineage graph, quality history, license document, procurement notes, "click to add to a notebook" button.

**Search** — free-text. "wmr fixing" jumps to WMR fixing-history archives; "ndf cny" finds CNH onshore + CNH offshore + CNY NDF curve archives; "boj intervention" finds the BoJ intervention archive plus any sell-side intervention-tracking products.

**Quick actions** — bookmark, request access to restricted (e.g. CFTC IMM is public; some sell-side fixing-flow color is restricted-redistribution), propose a procurement evaluation, flag an issue.

### 3.2 Yuki's Core Datasets (Illustrative)

A senior FX trader's data footprint at a top-5 firm. Examples of what Yuki's catalog tier likely contains:

- **Spot tick archives.** Multi-venue tick-level archives covering ECN (EBS, Refinitiv Matching, FXall, Hotspot, FastMatch, LMAX, Currenex), single-dealer streams from major banks, and venue-native depth where available. Petabyte-scale; query against a distributed compute cluster, not the trader's machine.
- **Forward / outright tick archives.** Forward-points history per pair per tenor, spot-plus-points construction archives, with venue-native delivery times preserved.
- **NDF tick archives.** Non-deliverable-forward curves per restricted EM pair (CNY, KRW, BRL, INR, TWD, RUB, EGP), with fixing-date and settlement-date preserved as separate fields. NDF onshore-vs-offshore deviation history (CNY vs CNH; INR onshore vs offshore NDF).
- **FX vol surface archives.** Implied-vol surfaces from Bloomberg / Tradeweb / sell-side aggregators per pair per tenor (O/N, 1w, 2w, 1m, 2m, 3m, 6m, 1y, 2y) per delta (ATM, 25Δ call/put, 10Δ call/put), with historical surface-shape preserved (skew evolution, term-structure shifts, smile curvature). Crossover with Sasha's surface; lineage from the same upstream.
- **Central-bank intervention archives.** Confirmed intervention events with date, central bank, pair, direction, estimated size (where reported), reference levels, BoJ / SNB / PBoC / Banxico / BCB / RBI. Sell-side intervention-tracker products (e.g. "Citi FX Intervention Monitor"-style) layered on top with their proprietary attribution.
- **OIS / rate-differential archives.** OIS-implied policy paths per central bank; 2y / 5y / 10y rate differentials per pair; real-yield differentials (nominal minus inflation expectations); imported from the rates-data feed shared with Ingrid's desk.
- **Cross-currency basis archives.** EURUSD basis swap history, JPY basis, AUD basis; CCY basis as a measure of dollar-funding stress.
- **CFTC IMM positioning.** Weekly Commitments-of-Traders positioning by currency future, by participant category (commercials, non-commercials, non-reportable), with multi-decade history.
- **Capital-control event tracker.** Time-series log of capital-control regulatory changes per EM country, with effective date, scope, pair impact, source document, sell-side analyst commentary. Event-driven feed; not high-frequency.
- **Fixing-history archives.** WMR 4pm London fixing realizations per pair, ECB 1:15pm fixing, NY 10am fixing, Tokyo 9:55am fixing, with realized-vs-published deviations, intra-window depth, and post-fix mean-reversion behavior. Archive depth typically 10+ years; methodology changes (e.g. LSEG/WMR window-widening) preserved as version metadata.
- **Macro tickers.** DXY, US 10Y / 2Y yield, SPX futures, gold, oil (CAD/NOK linkage), iron ore (AUD), agricultural composites (BRL), VIX, MOVE — minute-level via standard market-data vendors.
- **News and research.** Reuters / Bloomberg FX feeds; sell-side FX strategist morning notes; sell-side fixing-flow color (chat-derived, structured where possible); EM political news feed (election cycles, IMF programs, intervention threats, capital-control rumors).
- **Sovereign CDS spreads.** EM credit risk per country; signal for EM currency stress.
- **Sovereign debt auction calendars.** Local-currency issuance calendars for major EMs; demand-pressure signal.
- **Retail FX positioning.** OANDA / FXCM-style retail positioning aggregates as a contrarian indicator for short-horizon mean-reversion strategies.
- **Real-money flow indications.** Sell-side intel on real-money flows (pension funds, sovereign wealth, corporate hedgers); structured where format permits.

Each dataset's record in the catalog shows: license terms, cost, coverage, freshness, lineage, used-by (which features and strategies depend on it), incident history.

### 3.3 Data Quality Monitoring

Every live FX dataset has continuous quality monitoring. Yuki sees this as a heatmap on her catalog, with a dedicated **Quality Console** for deeper investigation.

**Per-dataset quality dimensions:**

- **Freshness** — time since last update vs SLA. Fixing histories update at fixing time + a few minutes; tick feeds are continuous; intervention archives update on event. Color-coded.
- **Completeness** — null rate per field, gap detection across time series. Especially critical for NDF feeds (less liquid; gaps easier to miss) and for fixing histories (one missed fixing breaks an entire downstream strategy class).
- **Schema stability** — has the source's schema changed? FX vol surface providers occasionally re-frame their delta conventions; the catalog flags this.
- **Distribution drift** — has the statistical distribution of values shifted recently? Useful for catching a broken feed (a dealer accidentally publishing 10x stale prices, an ECN's depth-API drifting).
- **Cross-source consistency** — when multiple sources report on the same underlying (e.g. Bloomberg vs Tradeweb both archive EURUSD vol surfaces), do they agree within tolerance? Persistent disagreement flags a methodology divergence.
- **Methodology-change tracking** — fixing methodology changes (WMR window widening; ECB fixing methodology adjustments), CB intervention-reporting policy changes, NDF settlement-rule changes. The catalog tracks these with versioned schemas.
- **Cost / volume** — query volume against quota, $ spent month-to-date, projected cost for queued workloads. FX vol-surface vendors are particularly expensive.

When something degrades, the dataset's owner is paged (data-engineering team or vendor-management). Yuki sees the impact: which of her strategies depend on this dataset, what's their state, should she intervene.

### 3.4 Lineage Navigator

Every dataset has an upstream lineage and a downstream lineage. The lineage navigator is a graph view Yuki opens when:

- A strategy is misbehaving and she wants to trace back to source data — a fixing-flow strategy is mis-pricing the WMR fix; is it the sell-side color feed, the WMR fixing history, or her own feature pipeline?
- A vendor announces a feed change (Bloomberg vol-surface methodology update; LSEG fixing-window adjustment) and she wants impact scope.
- A feature is being deprecated and she wants to confirm no strategy depends on it transitively.

**The graph:**

- Nodes are datasets, features, models, strategies.
- Edges are dependencies.
- Color-coded by health.
- Click for detail; right-click for "show all downstream" or "show all upstream."

A power-user tool used during diagnostic work, not constantly.

### 3.5 Procurement Dashboard

FX data licenses are a major P&L line item — vol-surface feeds, NDF curves, sell-side fixing color, EM political-risk products are all expensive. The procurement dashboard:

- **Active licenses** — every paid feed with annual cost, renewal date, contract terms, owner.
- **Trial / evaluation feeds** — currently being POC'd, with deadlines and evaluation criteria.
- **Wishlist** — feeds Yuki or her peers have flagged ("more granular EM political-risk feed for Latam coverage; better real-money flow signal for Asian session").
- **Cost attribution** — for each licensed feed, P/L attribution: which strategies depend on it, and how much P/L those strategies have generated.
- **Renewal calendar** — what's coming up for renegotiation.
- **Decision log** — past procurement decisions with rationale.

Yuki contributes to procurement decisions especially around FX-native feeds (vol-surface vendors, NDF data providers, EM political-risk products, sell-side fixing-flow products). Major procurements (>$500k/year) escalate to David / firm-level.

### 3.6 Gap Analysis Surface

The platform identifies gaps:

- **Universe coverage** — Yuki's strategies trade ~25 pairs (G10 majors + crosses + EM tier-1 + EM tier-2); the catalog flags pairs where vol-surface coverage is partial, NDF curves are sparse, or fixing histories have gaps.
- **Feature gaps** — features in the library that depend on missing or stale data, blocked from production deployment.
- **Competitor signals** — the platform suggests "feeds your competitors likely have that we don't" (specific real-money flow products, granular fixing-flow color, EM political-risk subscriptions).
- **Backfill gaps** — historical data missing for certain periods (e.g. NDF curve gaps during specific EM crisis episodes), which would block walk-forward backtesting on those periods.

Gap analysis is tied to concrete strategies that can't be deployed or features that can't be computed. Closing a gap is a procurement decision with a defined ROI estimate.

### 3.7 Interactions Yuki has with the data layer

Concrete daily / weekly / monthly:

- **Daily (background):** quality monitor in peripheral; auto-alerts for degradation. Yuki glances at the catalog occasionally during research.
- **Weekly:** procurement / wishlist review; reading data-team release notes (new datasets onboarded, schema changes, vol-surface vendor updates).
- **Monthly:** cost / attribution review; renewal-decision triage; gap-analysis review with the data team — especially around EM coverage expansions.
- **Ad hoc (during research):** querying the catalog when starting a new strategy idea — what data do I have to test this fixing-realization hypothesis?
- **Ad hoc (during a strategy issue):** lineage navigator from the misbehaving strategy back to source data.
- **Ad hoc (during an EM political event):** capital-control event tracker is the first place Yuki looks; lineage from there to which strategies are downstream-affected.

### 3.8 Why this matters

- **Efficiency:** Yuki does not waste hours figuring out what FX data exists or where to query it. The catalog is one click.
- **Risk:** quality monitoring catches feed degradation before P/L does. Fixing methodology changes and capital-control events are surfaced with scope-of-impact, not buried in a vendor email.
- **PnL:** procurement decisions are evidence-driven. Yuki does not pay $500k/year for a vol-surface vendor she's not using; she does aggressively license a $200k/year EM political-risk product that opens an alpha class worth $4M/year.

## 4. The Feature Library for Yuki

Features are the alpha-vocabulary. For Yuki, features encode FX-domain primitives — carry-to-vol ratios, basis-curvature, fixing-flow imbalance estimates, intervention-zone proximities, OIS-implied rate differentials, real-yield differentials, vol-surface skew states. The library is shared across the firm; features Yuki builds are visible to Ingrid (rate-FX overlap), Sasha (FX-vol overlap), and Quinn (cross-archetype factor work), with appropriate permissions.

### 4.1 The Feature Library Browser

Yuki's home page when she opens the feature layer.

**Layout (sketch):**

- **Left sidebar** — taxonomy filters: domain (carry / forward-curve / NDF / vol-surface / rate-differential / real-yield / fixing / intervention / cross-asset / positioning / EM-political / capital-control); cadence (tick / 1m / 1h / EOD / event-driven); compute cost (cheap / moderate / expensive); used-by-strategy; owner / desk; quality tier (production / beta / experimental); freshness (live / stale / failed).
- **Main panel** — table of features. Columns: name, version, owner, description (one line), inputs, distribution-state indicator, used-by count, last-modified, performance proxy (median Sharpe of strategies using it).
- **Right pane** — feature detail: full description, code link, lineage graph, distribution monitor (rolling histogram + comparison to training distribution + drift score), incident history, "show me strategies using this feature" link, "test this feature in a notebook" button.

**Search** — free-text. "carry to vol" finds variants across windows; "wmr fix imbalance" finds fixing-flow features; "boj intervention proximity" finds intervention-zone features.

**Quick actions** — bookmark, fork into a personal experimental version, propose a new feature, flag drift.

### 4.2 Yuki's Core Features (Illustrative)

Examples of features Yuki has built or consumes — actual library will differ.

**Carry-driven:**

- `carry_annualized_per_pair` — implied annualized yield from forward curves per pair.
- `carry_to_vol_ratio_per_pair` — Sharpe-like measure for carry; rolling 30d/90d windows.
- `carry_to_vol_ratio_zscore` — z-score of carry-to-vol vs rolling 1y distribution, per pair.
- `carry_basket_concentration` — fraction of total carry P/L coming from one funding currency (JPY-funded vs CHF-funded vs USD-funded baskets).
- `funding_currency_rally_signal` — risk-off signal: funding currency (JPY, CHF) rallying in a regime where carry baskets are crowded. Boolean + intensity.

**Forward-curve / basis driven:**

- `forward_points_per_tenor_per_pair` — current forward points by tenor.
- `forward_curve_steepness` — far-tenor minus near-tenor forward points.
- `cross_currency_basis_zscore` — basis swap dislocation, z-scored.
- `basis_blowout_flag` — categorical: normal / stressed / extreme — used as a risk-gate on carry strategies.

**NDF / onshore-offshore:**

- `ndf_curve_steepness_per_pair` — NDF curve dynamics.
- `onshore_offshore_deviation_zscore` — CNY onshore vs CNH offshore vs CNY NDF gap, z-scored.
- `ndf_implied_yield_vs_local_rate_diff` — NDF-implied yield minus local sovereign rate.

**Vol-surface (FX-specific):**

- `iv_atm_zscore_per_pair_per_tenor` — ATM IV z-score vs rolling 1y.
- `iv_realized_cone_position` — current IV vs realized-vol cone bands (1m, 3m).
- `risk_reversal_25d_zscore` — 25Δ risk reversal z-scored — one-sided-fear sentiment.
- `butterfly_25d_zscore` — kurtosis pricing dislocation.
- `vol_term_structure_curvature` — 1m vs 3m vs 6m IV curvature.
- `vol_surface_drift_score` — full-surface drift since yesterday.

**Rate-differential / real-yield:**

- `rate_differential_2y_per_pair` — 2y OIS-implied differential per pair.
- `real_yield_differential_per_pair` — nominal minus inflation expectations.
- `rate_diff_zscore_per_pair` — rate differential vs rolling distribution.
- `ois_implied_policy_path_divergence` — central-bank policy-path implied move per pair.

**Fixing-driven:**

- `wmr_fix_imbalance_estimate` — pre-fix order-imbalance estimate from sell-side color and historical seasonality.
- `fixing_realization_zscore` — realized-fix vs published-fix deviation z-scored, per fixing window per pair.
- `fixing_post_fix_meanrev_score` — post-fix mean-reversion strength estimate.
- `fixing_seasonality_per_window_per_pair` — month-end / quarter-end / year-end fixing flow seasonality.

**Intervention-driven:**

- `intervention_zone_proximity_per_pair` — distance to nearest historical intervention level, weighted by recency.
- `intervention_pressure_score` — composite signal (CB rhetoric intensity + zone proximity + reserves trend).
- `cb_reserves_change_zscore` — central bank reserves change z-scored — rising reserves often precede intervention to weaken own currency.

**Cross-asset / macro:**

- `oil_cad_correlation_30d` — rolling correlation, regime indicator.
- `gold_aud_correlation_30d` — rolling correlation, regime indicator.
- `equity_jpy_correlation_30d` — risk-on/off proxy.
- `vix_regime` — equity vol regime for risk-on/off context.
- `dxy_regime` — DXY regime classification.

**Positioning / sentiment:**

- `cftc_imm_positioning_zscore_per_currency` — CFTC IMM positioning z-scored vs 5y distribution.
- `retail_fx_positioning_per_pair` — OANDA / FXCM aggregate positioning (contrarian).
- `real_money_flow_indication` — sell-side real-money flow signal, structured where format permits.

**Regime indicators:**

- `fx_carry_regime` — composite (carry-to-vol regime + funding-currency rally signal + risk-on/off).
- `fx_vol_regime` — IV + realized-vol regime classification.
- `correlation_regime` — intra-FX correlation cluster state (e.g. "USD-bloc dominating" vs "commodity-bloc decoupled").
- `em_stress_regime` — composite (sovereign CDS levels + capital-control event flags + EM equity drawdown + EM CB intervention activity).

**EM-political / capital-control (qualitative, structured):**

- `em_political_risk_flag_per_country` — categorical risk score per EM country, updated on event.
- `capital_control_event_flag` — boolean per pair, set on regulatory event, cleared on cool-down.
- `em_election_proximity` — days-to-next-major-election per EM country.

These features form Yuki's reusable vocabulary. A new strategy picks from this library and combines them. Yuki builds new features when the existing vocabulary doesn't capture an idea.

### 4.3 Feature Engineering Surface

Building a new feature is itself a workflow. The platform supports it inline in the research workspace but also exposes a structured form for the publication step.

**The workflow:**

1. **Idea phase (notebook):** Yuki writes the feature definition in Python in her notebook, tests it on real historical FX data, inspects shape / distribution / sample values across G10 + EM.
2. **Quality gates:** before publishing, the platform runs automated checks — null rate within threshold, outlier rate within threshold, schema validation, computability across the universe of pairs the feature claims to cover (G10 + EM tier-1, with explicit declaration of tier-2 EM coverage where applicable).
3. **Metadata extraction:** the platform auto-generates metadata — lineage (extracted from the code, traced to upstream features and datasets), distribution baseline (computed on full backfill), compute cost (benchmarked across a sample), update cadence (declared and validated).
4. **Code review:** required for production-grade features. A peer or Quinn's team reviews; suggestions inline.
5. **Publication:** the feature gets a canonical name, a version, and is registered.

Inline-in-notebook means Yuki goes from idea → published feature in minutes, not days. The friction of the publication step is friction _proportional to the feature's intended use_ (experimental features can be lightly registered; production features go through the full review).

### 4.4 The Drift Dashboard

Per-feature drift surveillance. The dashboard shows:

- **Distribution drift** — KS-distance, PSI, Wasserstein per feature vs training-distribution baseline.
- **Drift trajectory** — has drift been monotonic (regime shift) or oscillating (noise)?
- **Drift cause hints** — when drift is detected, the platform suggests likely causes (upstream data change, regime shift, schema change in source).
- **Downstream impact** — which strategies are downstream of the drifting feature; what's their state.

For FX, structural drift events include central-bank regime changes (BoJ ending YCC; SNB unpegging EURCHF), capital-control regime changes, fixing-methodology updates. The drift dashboard catches feature-distribution shifts that mirror these structural events and flags downstream strategies for review.

### 4.5 Cross-Pollination View

Features Yuki uses from other desks; features Yuki publishes that other desks consume.

- **Ingrid's rate-curve features** are core inputs to Yuki's rate-differential and OIS-policy-path features. Shared lineage.
- **Sasha's FX-vol features** are core inputs to Yuki's vol-surface strategies. Shared lineage.
- **Theo's oil-curve features** are inputs to Yuki's CAD/NOK cross-asset strategies. Cross-domain.
- **Rafael's macro-regime features** can be downstream consumers of Yuki's currency-regime features (Rafael expresses themes through FX).
- **Quinn's cross-archetype factor library** consumes Yuki's carry-bucket and rate-differential features as inputs to firm-systematic FX factor strategies.

The cross-pollination view shows the dependency graph at the feature level and helps avoid duplicate features (Sasha's "FX RR z-score" and Yuki's "FX RR z-score" should be the same canonical feature; cross-pollination flags duplication).

### 4.6 Interactions Yuki has with the feature library

- **Daily (background):** drift dashboard glanced at; auto-alerts on feature drift relevant to live strategies.
- **Weekly:** review of new features published by other desks; consider relevance.
- **Ad hoc (during research):** browsing existing features when starting a new strategy idea; forking into experimental variants.
- **Ad hoc (during a drift event):** drift drill-in to identify cause and downstream impact.

### 4.7 Why this matters

- **Efficiency:** Yuki's feature work compounds. A feature she builds for one strategy is reusable across the entire fleet and across desks.
- **Risk:** drift is caught at the feature level before strategy P/L is impacted. The library's quality gates prevent broken features from reaching production.
- **PnL:** cross-pollination across rate (Ingrid), vol (Sasha), and macro (Rafael) desks produces alpha that no single domain library can find alone.

## 5. The Research Workspace

The research workspace is where Yuki spends most of her automated-mode day. Notebook + IDE, integrated with the data layer + feature library + backtest engine + experiment tracker + model registry.

### 5.1 Notebook Environment

A web-based notebook (Jupyter-style) preconfigured for FX research:

- **Data access** — direct query against the catalog with auto-completion on dataset names; "click-to-add" from the catalog browser opens a query stub in the active notebook.
- **Feature access** — direct import from the feature library; auto-completion on feature names; lineage viewable inline.
- **Compute** — CPU and GPU pools allocated per workspace tier; cost displayed inline before a heavy query runs; auto-suggest cheaper alternatives where the workload permits.
- **FX-specific helpers** — currency-grid plotting, multi-pair correlation visualization, vol-surface 3D plots, fixing-window event-time alignment, intervention-zone overlay, session-aware time-of-day plots.
- **Reproducibility** — every notebook is versioned; every cell's outputs are tied to data-version, feature-version, environment-version. A notebook from six months ago re-runs with identical results.

Yuki's notebook work spans:

- **Hypothesis testing** — "does WMR fixing realization correlate with sell-side flow color over a rolling 6m window?"
- **Feature development** — building and testing a new feature before publishing.
- **Strategy prototyping** — assembling features into a candidate signal, testing on historical data.
- **Diagnostic** — investigating a misbehaving live strategy.
- **Cross-desk collaboration** — joint notebooks with Ingrid (rate-FX) or Sasha (FX-vol).

### 5.2 Backtest Engine UI

A first-class surface for FX backtesting. The backtest engine must model FX-specific execution realism:

- **Spread / slippage** — venue-specific bid-ask spreads; tier-of-day variation (Asian session typically wider than London open); LP last-look rejection modeled as a fraction of routed volume.
- **Multi-LP fill model** — given a notional, simulate routing across the LP panel with each LP's historical fill rate, response latency, and last-look behavior.
- **Forward / NDF execution** — RFQ workflow simulated; multiple-bank quote distributions modeled; settlement-date handling.
- **Fixing execution** — fixing-targeted orders modeled with WMR/ECB/NY/Tokyo window mechanics; fixing realization variance modeled.
- **FX vol execution** — multi-leg structures (straddle, strangle, RR, fly) priced with realistic LP quote distributions; delta-hedge slippage modeled separately.
- **Carry / forward roll** — overnight carry P/L computed pip-by-pip; weekend triple-roll handled correctly; month-end / quarter-end basis-blowout regimes modeled.
- **Intervention scenarios** — backtest can include synthetic intervention shocks (BoJ at 162 with $50bn size, etc.) to stress strategies against historical analogues.
- **Capital-control events** — historical capital-control episodes (China 2015, Argentina 2019, Turkey 2023) preserved in the backtest with strategy auto-pause logic verified.

The UI:

- **Configuration panel** — strategy code, parameter ranges, universe (pairs / sessions / fixings), date range, execution-realism profile (high / medium / low — premium realism is slower).
- **Run controls** — single backtest, parameter sweep, walk-forward.
- **Progress / cost** — % complete, ETA, $ spent on compute.
- **Results panel** — equity curve, per-trade table, performance metrics, regime-conditional results.

### 5.3 Walk-Forward Visualization

For any backtest, walk-forward results visualized as:

- **Per-window equity curve** — each train/test window's out-of-sample performance.
- **Stability indicator** — does performance hold across windows or only on lucky windows?
- **Parameter-stability map** — for parameter sweeps, are optimal parameters stable across windows or wandering (sign of overfit)?
- **Regime-conditional decomposition** — performance per regime (carry-on / carry-off; vol-high / vol-low; risk-on / risk-off) per window.

For Yuki specifically: walk-forward across **session boundaries** is critical (Tokyo / London / NY each have distinct microstructure; a strategy that backtests well in pooled data may be a London-only edge dressed up). Walk-forward across **fixing windows** likewise (post-WMR-methodology-change behavior differs from pre-).

### 5.4 Strategy Template Library

5–10 named templates covering Yuki's strategy classes. Each template is a starting point — code skeleton, default parameters, baseline features, default execution profile.

- **Carry-basket template** — long high-yielders / short low-yielders, sized by carry-to-vol; default risk-gate on funding-currency-rally.
- **Single-pair carry template** — one pair (USDJPY, AUDJPY), forward-implied-carry rolling vs spot+rollover variants.
- **Cross-vol RV template** — vol-of-vol mean-reversion per pair; default vol-surface skew inputs.
- **Vol term-structure template** — 1m vs 3m IV trades; default tenor pair selector.
- **Risk-reversal mean-reversion template** — 25Δ RR drift back to neutral; default sizing on RR z-score.
- **Fixing-flow template** — pre-position into WMR/ECB/NY/Tokyo; fixing-imbalance-estimate input; auto-flatten policy.
- **Major mean-reversion template** — short-horizon EURUSD/USDJPY/GBPUSD mean-reversion; session-conditioned parameter profiles.
- **Trend-and-momentum template** — daily/weekly trend continuation with vol-regime sizing and CB-event proximity gating.
- **NDF arb template** — onshore-offshore deviation; capital-control event auto-pause; NDF curve dislocation triggers.
- **Cross-asset FX template** — oil/CAD, gold/AUD, equity/JPY linkage; cross-asset signal feeds into FX leg execution.
- **Intervention-zone template** — passive bidder/offerer at historical zones; auto-pause on confirmed intervention.

Templates encode hard-won lessons: default risk-gates, default execution-realism settings, default regime-conditioning. New strategies start from a template, not blank.

### 5.5 Compute Management

Compute is metered. The workspace shows:

- **Active jobs** — running backtests / sweeps / training, with progress and ETA.
- **Queue** — queued workloads, with priority and expected start time.
- **Cost month-to-date** — Yuki's tier budget consumption.
- **Cost projection** — for a queued workload, projected $ before launch.
- **Cheaper-alternative suggestions** — when a workload could run faster/cheaper on a different compute pool, the platform suggests it.

### 5.6 Anti-Patterns the Workspace Prevents

The platform actively prevents:

- **Lookahead** — features that reference future timestamps are flagged at backtest time.
- **Survivorship** — universe construction that excludes delisted or restructured pairs is flagged (less common in FX than in equities, but still relevant for EM where pairs change conventions).
- **P-hacking** — parameter sweeps without walk-forward defense are flagged.
- **In-sample-only validation** — backtests without out-of-sample windows are flagged.
- **Unrealistic execution** — backtests using mid-prices without spread / slippage / last-look modeling are flagged.
- **Data leakage** — features computed using EOD data but consumed at intraday cadence are flagged.
- **Fixing-realization leakage** — fixing-flow strategies that accidentally use post-fix realization in pre-fix decision are flagged.

### 5.7 Interactions Yuki has with the workspace

- **Pre-market:** notebook open with overnight experiment results; review winners / losers.
- **In-market (default):** notebook is the foveal surface. Hypothesis testing, feature development, strategy prototyping.
- **Post-market:** queue overnight backtests / sweeps / retrains based on the day's findings.
- **Weekly:** strategy template library review; consider new templates based on emerging patterns.

### 5.8 Why this matters

- **Efficiency:** Yuki goes from idea to validated strategy in hours, not weeks. The workspace is the multiplier on her research velocity.
- **Risk:** anti-pattern prevention catches the silent failure modes (lookahead, p-hacking) that destroy live performance.
- **PnL:** templates compound institutional learning. A new fixing-flow strategy starts from the institutionalized fixing-flow template, not from scratch.

## 6. The Model Registry

Versioned catalog of trained models with reproducibility guarantees. For Yuki, "models" include both predictive models (e.g. a fixing-imbalance prediction model, a carry-unwind classifier, a vol-surface drift forecaster) and rule-based decision components used inside strategy composition.

### 6.1 The Model Registry Browser

Searchable catalog of every registered model.

**Layout:**

- **Left sidebar** — filters: domain (carry / fixing / vol / NDF / cross-asset), type (regression / classification / rules / composite), training-status (trained / production / archived), owner, last-trained.
- **Main panel** — table of models with name, version, domain, owner, last-trained, distribution-state, used-by-strategy count, performance proxy.
- **Right pane** — full model record.

### 6.2 The Model Record Page

For any model, the full record:

- **Identity** — name, version, semantic + content hash, owner, last-trained.
- **Description** — what the model predicts / decides; intended use; out-of-scope.
- **Inputs** — exact feature versions consumed.
- **Training data** — date range, universe, regime composition, sample size.
- **Training run reference** — link to the experiment-tracker run that produced this version.
- **Validation results** — out-of-sample metrics, walk-forward stability, regime-conditional performance.
- **Distribution baseline** — input-feature distribution at training time; output distribution; calibration curve for probabilistic outputs.
- **Drift state** — current input-feature drift; current output drift; current calibration drift.
- **Deployment state** — strategies currently consuming this model version; lifecycle stage.
- **Lineage** — full upstream (data → features → this model) and downstream (this model → strategies).
- **Re-training history** — every prior version with results and retire reason.

### 6.3 Versioning & Immutability

- **Every model version is immutable.** A change retrains a new version.
- **Old versions are never deleted** — they're archived. Reproducibility from any point in time.
- **Semantic versioning + content hash** — semantic for human-readable; content hash for true uniqueness.
- **Bit-identical reproduction** — given a registered model and its registered training inputs, retraining produces a bit-identical result. Critical for audit and regulatory review.

### 6.4 Drift Surface for Models

Per-model drift surveillance:

- **Input drift** — the features the model is currently seeing vs the training distribution.
- **Output drift** — the model's current predictions vs its training prediction-distribution.
- **Calibration drift** — for probabilistic models, is a 0.7-predicted probability still resolving at ~70%?
- **Performance drift** — live realized performance vs validation expectation.

When drift exceeds threshold, the platform queues a candidate retrain; Yuki reviews and approves.

### 6.5 Lineage Graph

Same as the data-layer lineage graph but rooted at models. A model's full upstream (data sources → features → this model) and downstream (this model → strategies → live trades) are graphable.

### 6.6 Why this matters

- **Efficiency:** model retraining is structured; a new version inherits the prior version's evaluation context, so Yuki only reviews the diff.
- **Risk:** silent model decay is the canonical FX-strategy failure mode. The registry's drift + calibration surfaces catch it.
- **PnL:** reproducibility makes model-risk reviews defensible to David, the risk committee, and external regulators.

## 7. The Experiment Tracker

Log of every backtest / training run, searchable / comparable / reproducible.

### 7.1 The Experiment Browser

Filterable list of every run Yuki (or her desk) has launched.

**Filters:** date range, strategy class, status (running / complete / failed), researcher, tags, performance threshold (e.g. "Sharpe > 1.5").

### 7.2 Per-Experiment Record

For any run:

- **Identity** — run ID, timestamp, researcher, hypothesis (free text), tags.
- **Configuration** — code version, data version, feature versions, parameter values, universe, date range, execution-realism profile.
- **Results** — equity curve, performance metrics, walk-forward stability, regime decomposition, per-pair / per-session decomposition.
- **Diagnostic outputs** — feature-importance, prediction-quality plots, residual analysis.
- **Status** — failed / complete / promoted-to-paper / archived.

### 7.3 Run Comparison Views

Side-by-side comparison of N runs:

- **Equity curve overlay** — multiple runs on the same axes.
- **Metric table** — Sharpe, Sortino, max drawdown, hit rate, capacity-realized, slippage, per regime.
- **Parameter diff** — what changed between runs.
- **Performance attribution diff** — which feature / regime drove the difference.

For Yuki: comparing carry-strategy parameter variants across G10 vs EM universes; comparing fixing-flow strategies across WMR vs ECB vs NY fixing windows; comparing vol-surface mean-reversion across pairs.

### 7.4 Anti-Patterns Prevented

- **Cherry-picking** — the platform preserves all runs (including failures); promoting a strategy requires referencing the full experiment trail.
- **Hidden parameter sweeps** — sweeps are recorded as a single sweep entity, not as N independent runs.
- **Re-running until lucky** — repeated re-runs of the same configuration trigger flagging.

### 7.5 Interactions Yuki has with the experiment tracker

- **Pre-market:** review overnight runs.
- **In-market:** queue ad-hoc experiments as ideas arrive.
- **Post-market:** queue overnight runs based on day's hypotheses; promote winners to paper-trading.
- **Weekly:** archive old experiments; tag patterns; review aggregate research velocity.

### 7.6 Why this matters

- **Efficiency:** institutional memory is searchable. "What did we try last quarter on USDCNH NDF arb?" gets a list, not an email thread.
- **Risk:** research process is honest and defensible to David / risk committee.
- **PnL:** patterns across many experiments reveal robust alpha; one-off lucky runs are exposed as such.

## 8. Strategy Composition

Wrapping models / rules with sizing, entry/exit, hedging, risk gating, regime conditioning, capacity, execution policy.

### 8.1 The Strategy Composition Surface

Visual + code-droppable. A strategy is composed of:

- **Signal** — a model output, a rule-based signal, or a composite.
- **Universe** — pairs / sessions / fixings the strategy is active on.
- **Entry / exit logic** — how signal turns into orders.
- **Sizing** — notional, leverage, vol-targeted, carry-to-vol-weighted.
- **Hedging** — concurrent hedge construction (delta-hedge for vol strategies, cross-pair hedge for basket strategies).
- **Risk gates** — daily-loss limit, drawdown limit, position-size limit, regime gates (e.g. "no entries when capital-control event flag is set"; "no entries 24h before FOMC / ECB / BoJ").
- **Regime conditioning** — strategy active only in specified regimes.
- **Capacity model** — expected slippage at size; cap-by-realized-slippage rule.
- **Execution policy** — fixing-targeted / TWAP / VWAP / IS / RFQ / multi-LP smart-route; venue routing rules.
- **Manual-override hook** — explicit pause / cap / shadow toggles wired into the intervention console.

### 8.2 Pre-Deployment Validation

Before a strategy can be deployed (even to paper), the platform runs validation:

- **Lookahead check** — features referenced are computable at decision time.
- **Unbounded sizing check** — sizing rules have maximum-notional caps.
- **Missing-kill-switch check** — every strategy must have at least one risk gate.
- **Regime-coverage check** — if the strategy is regime-conditioned, the regime classifier must be a registered feature.
- **Universe-coverage check** — features used must support every pair the strategy claims to cover.
- **Execution-policy validity** — fixing strategies must specify a fixing window; NDF strategies must specify a settlement convention.
- **Capital-control gate check** — EM strategies must declare a `capital_control_event_flag` gate (or explicitly opt out with a documented reason — Yuki signs off).
- **Intervention-aware check** — strategies on intervention-prone pairs (USDJPY, EURCHF, USDCNH) must declare an intervention-zone gate or explicitly opt out.

### 8.3 Strategy Versioning

Like models, strategies are versioned. A change creates a new version; old versions are preserved for reproducibility and rollback.

### 8.4 Yuki's Strategy Templates (Illustrative)

Same as section 5.4 — the template library is the starting point for composition.

### 8.5 Why this matters

- **Efficiency:** composition is visual + code-droppable; Yuki goes from validated signal to deployable strategy in minutes.
- **Risk:** pre-deployment validation catches the failure modes that bite later (missing kill-switch, lookahead, missing capital-control gate).
- **PnL:** the composition surface lets Yuki express FX-specific risk-management discipline (capital-control gates, intervention-zone gates, fixing-window gates) declaratively rather than buried in code.

## 9. Promotion Gates & Lifecycle

Strategies move through stages: **Research → Paper → Pilot → Live → Monitor → Retired**. Each transition is a gate with declared evidence requirements.

### 9.1 The Lifecycle Pipeline View

A kanban-style view of every strategy by stage. Yuki sees:

- **Research** — strategies under development.
- **Paper** — running paper-trades, accumulating out-of-sample evidence.
- **Pilot** — small live capital, supervised closely.
- **Live** — full capital allocation per the allocation engine.
- **Monitor** — flagged for elevated supervision (drift, drawdown, regime mismatch).
- **Retired** — archived; capital recycled.

### 9.2 The Gate UI per Transition

Each transition is a checklist with evidence:

- **Research → Paper:** walk-forward validation passed; no anti-pattern flags; pre-deployment validation passed; researcher sign-off.
- **Paper → Pilot:** N weeks of paper-trading with realized performance within expected distribution; calibration check passed; Yuki sign-off.
- **Pilot → Live:** pilot-stage performance within expected distribution; capacity-realized within expected; no operational incidents; Yuki sign-off; **David sign-off for material strategies** (capital cap above firm threshold).
- **Live → Monitor:** auto-triggered on drift / drawdown / regime mismatch; or Yuki-triggered.
- **Monitor → Live or Retired:** evidence of recovery (back to live) or evidence of confirmed decay (retire).
- **Any → Retired:** evidence of decay or strategic decision; capital reclaimed; archive complete.

For FX-specific transitions:

- **EM-strategy Pilot → Live** requires capital-control gate verification + intervention gate verification + EM political-risk attestation.
- **Fixing-strategy Pilot → Live** requires fixing-realization calibration check across multiple fixing windows.
- **Carry-strategy Pilot → Live** requires unwind-trigger verification and stress-test results against historical carry-unwind episodes (2008, 2011, 2015, 2020).

### 9.3 Lifecycle Decision Log

Append-only log of every transition with timestamp, actor, evidence reference, rationale.

### 9.4 Lifecycle Cadence for Yuki

- **Daily:** review monitor-stage strategies; consider monitor → live or monitor → retired.
- **Weekly:** review pilot-stage strategies; consider pilot → live promotions.
- **Monthly:** review research-stage strategies; promote ready candidates to paper.
- **Ad-hoc (event-driven):** capital-control event triggers immediate Live → Monitor on affected EM strategies; intervention event triggers same on affected pairs.

### 9.5 Why this matters

- **Efficiency:** lifecycle is structured; Yuki doesn't reinvent the gate criteria each time.
- **Risk:** strategies don't get scaled before earning the right to scale.
- **PnL:** retire decisions are evidence-driven; capital trapped in dying strategies is recycled into research priorities.

## 10. Capital Allocation

Sizing across the fleet.

### 10.1 The Allocation Engine UI

Nightly allocation proposal:

- **Per-strategy** capital cap, vol-target contribution, expected Sharpe contribution, expected capacity utilization.
- **Per-strategy-class** aggregate (carry / vol / fixing / mean-reversion / NDF / cross-asset).
- **Per-pair** aggregate exposure cap.
- **Per-currency** aggregate exposure cap (Yuki manages currencies, not pairs — see section 10.2).
- **Per-session** aggregate active-capital cap (Tokyo / London / NY).
- **Marginal-Sharpe analysis** — the marginal Sharpe contribution of each additional dollar to each strategy, for prioritization.

Yuki reviews the proposal each morning; approves, modifies, or escalates material changes to David.

### 10.2 Per-Currency Exposure Caps (FX-Specific)

Yuki's risk unit is the currency, not the pair. The allocation engine enforces caps at currency level:

- **Per-currency net delta cap** — long EUR / short USD / long JPY / etc. across all positions.
- **Per-currency-bucket cap** — G10 vs EM tier-1 vs EM tier-2 aggregate exposure.
- **Funding-currency concentration cap** — total carry P/L from a single funding currency (JPY-funded carry concentration, CHF-funded concentration) capped to prevent crowded-trade unwind risk.
- **Intervention-prone currency cap** — exposure to USDJPY / EURCHF / USDCNH proximity-zones capped given intervention risk.

### 10.3 Per-Session Allocation

Different sessions have different microstructure; capital allocated by session:

- **Tokyo session cap** — JPY pairs, AUD, NZD, CNY/CNH-focused strategies.
- **London session cap** — EUR, GBP, CHF, EM-EMEA pairs.
- **NY session cap** — USD-focused, LatAm pairs.

A strategy active across sessions has its capital allocation distributed accordingly.

### 10.4 Allocation Drift

When realized capital deployment drifts from approved allocation (because of fills, P/L, intra-day capacity issues), the engine flags drift; Yuki reviews and either rebalances or accepts.

### 10.5 Capacity & Headroom

Per strategy and per strategy-class: realized vs assumed capacity; headroom for additional capital; capacity-utilization-driven cap recommendations.

### 10.6 Why this matters

- **Efficiency:** Yuki doesn't manually distribute capital across 200+ strategies; the engine proposes, she reviews.
- **Risk:** per-currency and per-funding-currency caps prevent crowded-trade blowups (the canonical FX failure mode).
- **PnL:** capital flows to highest-marginal-Sharpe strategies; dying strategies' capital is recycled.

## 11. Live Fleet Supervision Console

The supervisor console is anomaly-driven, default green. Most of the day, Yuki is heads-down in research; the supervisor surface is quiet.

### 11.1 The Fleet Dashboard

Layout sketch (FX-specific columns):

| Column             | Meaning                                               |
| ------------------ | ----------------------------------------------------- |
| Strategy           | Name + class + lifecycle stage                        |
| Pair / Universe    | Pairs covered                                         |
| Session            | Tokyo / London / NY / overlap                         |
| Carry-state        | Current carry-to-vol position                         |
| Vol-state          | IV regime / vol-surface state                         |
| Fixing-state       | Active fixing-window position (if applicable)         |
| EM-state           | Capital-control / political-risk flag (if applicable) |
| Intervention-state | Intervention-zone proximity (if applicable)           |
| Live PnL today     | Spot vs carry vs vol decomposition                    |
| Drawdown           | Vs configured limit                                   |
| Drift              | Feature / prediction / performance drift score        |
| Capacity           | Realized vs assumed                                   |
| Status             | Green / amber / red                                   |

Default filter: amber + red. Yuki investigates strategies needing attention; ignores green ones unless something specific draws her in.

### 11.2 The Strategy Detail Page

Drill-in for any strategy:

- **Header** — name, class, stage, owner, current capital cap.
- **Configuration summary** — universe, signal, sizing, hedging, risk gates.
- **Live performance** — equity curve last 30/90 days, today's P/L decomposed (spot / carry / vol / fixing / funding).
- **Position state** — current positions per pair; per-currency decomposition.
- **Recent trades** — last N fills with execution-quality metrics.
- **Alerts history** — alerts fired on this strategy in the last week.
- **Drift state** — feature / prediction / performance drift.
- **Backtest-vs-live comparison** — see 11.6.
- **Strategy state** — see 11.6.
- **Intervention controls** — pause / cap / kill / shadow / demote.

### 11.3 Anomaly Detection Surface

The platform monitors every strategy for anomalies and surfaces them ranked by severity:

- **PnL anomalies** — out-of-distribution P/L moves.
- **Position anomalies** — unexpected position state.
- **Execution anomalies** — fills outside expected range; fill-rate degradation; LP last-look rejection spike.
- **Feature anomalies** — input-feature drift.
- **Regime anomalies** — current regime differs from strategy's training regime.
- **FX-specific anomalies** — fixing-realization deviation from prediction; intervention-zone breach; capital-control flag firing on an EM strategy.

Severity tiers: info / warning / critical. Critical alerts can trigger auto-pause + page-the-on-call.

### 11.4 Cross-Strategy Correlation View

Pairwise correlation across the fleet:

- **Currency-level correlation** — strategies sharing currency exposure (every USD-pair strategy is partly a USD bet).
- **Funding-currency correlation** — JPY-funded carry strategies clustered; CHF-funded clustered.
- **Session correlation** — strategies active in the same session compounding.
- **Regime correlation** — strategies whose performance moves together in specific regimes.

Cross-correlation matrix used to flag crowded-trade risk and to inform capital-allocation decisions.

### 11.5 Currency Exposure + Carry-Unwind + Fixing-Approach Live State

The FX equivalent of Marcus's Multi-Venue Capital + Balance Live State. Three sub-surfaces:

**11.5.1 Currency exposure dashboard.** Net delta per currency across the entire automated fleet plus any manual / discretionary positions:

- Long / short per currency, in $-notional and as % of capital.
- Per-bucket aggregate (G10 / EM tier-1 / EM tier-2).
- Per-session attribution (Tokyo / London / NY contributions).
- Per-strategy-class contribution to each currency exposure.
- Settlement obligations by date per currency (forward / NDF settlements).

**11.5.2 Carry-unwind risk monitor.** The canonical FX pain trade:

- Total daily carry P/L running across all carry strategies.
- Carry concentration per funding currency (JPY-funded vs CHF-funded vs USD-funded). Concentration above threshold flagged.
- Carry-to-vol ratio of book.
- Funding-currency rally signal — when JPY or CHF rallies in risk-off and book is JPY/CHF-funded, the unwind monitor projects book impact and flags red.
- Historical carry-unwind episode replays — current book P/L projected against the 2008, 2011, 2015, 2020 episodes.

**11.5.3 Fixing-approach surface.** For active fixing-targeted positions:

- Time-to-fix countdown per active fixing window (WMR / ECB / NY / Tokyo).
- Aggregate fixing-targeted size per pair per direction.
- Current depth around expected fix per pair.
- Best execution path (single LP vs multi-LP sweep).
- Recent fixings' realization-vs-prediction calibration.
- Sell-side fixing-flow color summary.

### 11.6 Strategy State Inspection

A diagnostic surface that lets Yuki inspect the **internal state of a running strategy** — its current variables, signal evaluation, model output, regime classifier, position-sizing intermediates — and compare live behavior against backtest expectation. Critical for verifying that a strategy is configured correctly, that live and backtest aren't drifting, and that the trader's mental model of the strategy matches what the code is actually doing.

This is a verification surface, not a continuously-streamed real-time view. It is implemented per strategy; the strategy declares which variables it exposes, and the platform renders them on demand. Some strategies expose 5 variables; some expose 50; engineering cost dictates depth.

**Two layers of inspection:**

#### 11.6.1 Internal-state view (per strategy)

A panel inside the strategy detail page (section 11.2) that the trader opens on demand.

**What it shows (illustrative, varies per strategy):**

- **Current state variables** — the strategy's internal counters, flags, regime classifications, running averages, accumulators. Displayed in a structured table with field name, current value, last-updated timestamp.
- **Current feature snapshot** — the input feature values the strategy is currently seeing. Useful for "is the carry-to-vol-z feature returning what I'd expect right now given the current regime?"
- **Last N signal evaluations** — for the last decisions: input features, model output, entry / exit / no-action decision, reason. Scrollable / searchable.
- **Current position state** — what the strategy is holding; what it intends to do next; pending orders.
- **Risk-gate state** — daily-loss accumulator, drawdown-since-go-live, capacity utilization, distance-to-each-risk-limit.
- **Regime classifier output** — the strategy's view of the current regime ("carry-on, vol-low, risk-on" or "EM-stress, capital-control-flagged, paused").
- **Strategy-specific custom state** — for example:
  - A **carry strategy** might expose: current carry-to-vol per pair in basket, funding-currency-rally signal state, basket concentration metric, unwind-trigger evaluation, time-since-last-rebalance.
  - A **fixing-flow strategy** might expose: minutes-to-next-fix, fixing-imbalance-estimate, sell-side-color summary, pre-position state, post-fix-meanrev-evaluation timer.
  - An **NDF arb strategy** might expose: onshore-offshore deviation, NDF curve dislocation z-score, capital-control-event-flag state, paused-since timestamp (if paused).
  - An **intervention-zone strategy** might expose: distance to nearest historical zone, last-intervention-event timestamp, cool-down-timer state.

**Refresh model:**

- **Refresh button** for on-demand snapshot. Most common interaction.
- **Auto-refresh toggle** for selected strategies (e.g. when actively diagnosing). Configurable cadence: 1s / 5s / 30s / 1min / off.
- **Schedule push** for selected strategies — the platform pushes state updates only when the strategy actually changes state (entered a position, evaluated a signal, hit a gate). Lightweight, event-driven.
- **Engineering pragmatic:** the platform does not stream all variables of all 200+ strategies in real time — that's heavy on backend and wasteful. Streaming is opt-in per strategy when the trader is actively inspecting; default is on-demand refresh.

**Per-strategy implementation:**

- The strategy declares its exposed state via a contract (variables, types, descriptions). The platform renders whatever the strategy declares.
- Some strategies expose comprehensive state; some expose minimal. Pragmatic — engineering cost should match diagnostic value.
- The trader is not blocked if a strategy is light on exposed state; the supervision dashboard, model registry, and execution log give independent diagnostic angles.

#### 11.6.2 Backtest-vs-live comparison

For any live strategy, a side-by-side view comparing live behavior against backtest expectation. Critical for catching configuration drift early.

**Layout:**

- **Top:** equity curve, live (last N days) overlaid on backtest counterfactual (had the strategy run with the same parameters and same regime over the same period). Divergence flagged.
- **Per-trade comparison:** recent live trades, what the backtest would have done at the same moment. Mismatches: live entered when backtest didn't (or vice versa); live size differed from backtest size; live execution-quality differed.
- **Per-feature drift:** the input features the strategy saw live vs the same features in the backtest's training distribution.
- **Per-signal calibration:** for probabilistic-output models, was the live signal calibrated as the backtest predicted?
- **FX-specific decomposition:** divergence decomposed into spot / carry / vol / fixing / funding components. Critical because in FX, a strategy might appear to track its backtest on spot P/L while diverging materially on carry P/L (or vice versa).
- **Diagnosis hints:** the platform suggests likely root causes if divergence is meaningful — feature drift, execution-quality degradation, model drift, configuration mismatch, data-pipeline issue, fixing-methodology change, capital-control regime change.

**Use cases:**

- After Yuki deploys a new strategy to live: confirm the first weeks' behavior matches the backtest.
- When a strategy enters monitor stage: was the divergence caused by the live deployment or by the regime?
- When validating a candidate retrain: how does the new model's first weeks compare to its backtest?
- After a fixing-methodology change (e.g. WMR widening): are the fixing-flow strategies still tracking?

**Refresh model:**

- Computed daily by default (not real-time). The comparison is a slow-moving diagnostic; daily granularity is sufficient.
- On-demand refresh available.

#### 11.6.3 Why this matters

- **Efficiency:** when a strategy is misbehaving, Yuki sees exactly what it's "thinking" without re-running a fresh backtest or opening the code repo. Diagnostic loop closes in minutes rather than hours.
- **Risk:** silent configuration drift between backtest and live is a major failure mode — especially in FX where venue-specific spread / last-look behavior can diverge from backtest assumptions over time. The comparison surface catches it before scaled capital makes the mistake expensive.
- **PnL:** strategies that match their backtest expectation can be scaled with confidence. Strategies whose live diverges from backtest are caught early and either fixed or capped.
- **Engineering verification:** as a side effect, this surface is one of the cleanest end-to-end tests of the platform — if Yuki can see the right state for a strategy, the data plumbing, model registration, strategy composition, execution layer, and reporting layer are all working end-to-end.

### 11.7 Why this matters

- **Efficiency:** anomaly-driven attention compresses 200+ strategies into ~5–15 to investigate. Yuki does not stare at 200 charts.
- **Risk:** anomalies are caught before P/L damage compounds. Auto-pause on critical alerts limits blast radius.
- **PnL:** time saved on supervision is reinvested in research.

## 12. Intervention Console

When Yuki decides to act, the intervention console is the surface. Distinct from automatic actions (auto-pause-on-capital-control-event, auto-flatten-on-funding-rally) — this is _Yuki's_ interventions.

### 12.1 Per-Strategy Controls

For any strategy, controls Yuki can apply:

- **Start / pause / stop** — with confirmation + audit trail.
- **Cap change** — increase / decrease capital cap. Modest changes auto-apply; large changes route to allocation-engine sign-off.
- **Risk-limit change** — daily loss limit, drawdown limit, position-size limit. Audited.
- **Pair / currency whitelist / blacklist** — temporarily exclude.
- **Schedule modification** — pause active hours, add a blackout window (e.g. "no entries between 13:00 and 14:30 UTC for the next 7 days because of expected ECB announcement").
- **Mode change** — live / paper / shadow. Shadow runs the code without sending orders; useful for diagnosing without further P/L exposure.
- **Force-flatten** — close all positions on this strategy now. Reason field mandatory.
- **Demote to monitor** — move to monitor stage with reason.

Every intervention is logged: timestamp, actor, action, reason, pre-state, post-state.

### 12.2 Group Controls

- **Pause all in strategy class** (e.g. pause all carry strategies because of a funding-currency rally; pause all fixing-flow strategies because of a WMR methodology change).
- **Pause all on pair** (e.g. pause all USDJPY strategies because BoJ has just intervened).
- **Pause all in lifecycle stage** (e.g. pause all pilots during a major macro event).
- **Pause all EM** (capital-control event triggers; political shock; sovereign default risk spike).
- **Pause all in session** (e.g. pause Tokyo-session strategies during a Japanese banking holiday with thin liquidity).
- **Cap all by tag** — multiplicative cap reduction across a tagged set.

### 12.3 Manual Trading & Reconciliation

**Even in fully automated mode, Yuki must retain the ability to place, adjust, and close trades manually from the UI.** This is non-negotiable. Three primary scenarios:

**1. Emergency intervention.**
A strategy is misbehaving; the auto-flatten failed; an LP is in a degraded state and the algo cannot reach it via API; an intervention shock requires immediate position closure that the strategy isn't pre-coded to handle. Yuki needs to flatten or adjust positions by hand right now. Hesitation costs PnL.

**2. Reconciliation between algo state and venue state.**
The platform's view of what's open and the venues' / prime brokers' view should always match — but in practice they occasionally diverge (a fill the strategy didn't register; a cancel the strategy thinks succeeded but didn't; a forward / NDF settlement that the venue confirmed but the platform missed; a fixing fill rate that came back in a different format than expected). Yuki needs to manually align the two, sometimes by closing a phantom position or opening one the strategy thought it had.

**3. Discretionary override on top of the automated book.**
A high-conviction macro view (FOMC outcome surprise, ECB hawkish surprise, BoJ intervention triggered, EM political shock, capital-control announcement) where Yuki wants to layer a directional position on top of what the strategies are doing — explicitly tagged as such.

The platform must support all three with **full manual-trading capability identical to the manual mode** described earlier in this doc. Yuki retains every surface from her manual workflow: the FX cross matrix, the spot ticket, the forward / outright ticket, the FX swap ticket, the NDF ticket, the cross / synthetic ticket, the FX options ticket, the fixing trade workflow, the block / RFQ surface, multi-LP aggregation, the carry & forward dashboard, hotkeys (flatten by pair, flatten by currency, roll forward), pre-trade compliance (position limits per currency, sanctions, counterparty limits for OTC). The manual surfaces don't disappear in automated mode; they are present and reachable but not the primary surface most of the day.

#### 12.3.1 The Full Manual Order Ticket Framework (FX-Specific)

The complete order entry ticket framework from manual mode (see [#2 Order Entry Ticket Framework](common-tools.md#2-order-entry-ticket-framework) and the manual sections of this doc above):

- **Spot ticket:** pair selector with autocomplete, base-or-quote notional toggle, multi-LP streaming top-5 bid / top-5 offer with LP attribution, best-price aggregation, last-look awareness flagged before send, fixing-targeted-algo option, generic TWAP / VWAP / IS / peg.
- **Forward / outright ticket:** pair, side, size, settlement date or tenor, forward points displayed and editable, implied carry shown, all-in rate = spot + forward points, multi-LP RFQ.
- **FX swap ticket:** near-leg + far-leg as a single product, swap points as the price, funding implications displayed.
- **NDF ticket:** pair, side, size, fixing date and settlement date as distinct fields, NDF curve points by tenor, onshore-vs-offshore deviation flagged in real time, RFQ workflow.
- **Cross / synthetic ticket:** synthetic crosses built from two USD pairs, direct-vs-synthetic comparison with live cost of each path, atomic execution of both legs when synthetic is chosen.
- **FX options ticket:** multi-leg structures (straddle, strangle, RR, butterfly, calendar), quoted in vol primarily, greeks in pair-specific terms, delta-hedging in spot integrated.
- **Fixing trade workflow:** WMR 4pm London / ECB 1:15pm / NY 10am / Tokyo 9:55am, countdown UI, depth around fix, expected impact, net buy/sell flow expected at fix from sell-side color.
- **Block / RFQ:** dealer panel, quote aggregation with response-time latency per LP, one-click execute, anonymized vs disclosed by relationship.
- **Pre-trade preview:** position impact (per-currency and per-pair, on entire book including the automated fleet), counterparty exposure impact, compliance-gate check, intervention-zone warning if applicable.
- **Hotkeys preserved:** flatten by pair, flatten by currency, roll forward, hedge-to-USD-flat, cancel-all-on-focused-pair.

Practically: the manual terminal is a tab / mode in the supervisor console, not a separate application. Yuki presses a hotkey or clicks an icon → manual ticket comes up over the current view → she places the trade → the ticket closes back to the supervisor view.

#### 12.3.2 Trade Tagging & Attribution

Every manually-placed trade gets a mandatory tag:

- **Emergency intervention** — flagged for post-incident review; auto-included in the day's incident log.
- **Reconciliation** — paired with the algo state being reconciled (which strategy thought it had this position; what the venue showed). Reconciliation tickets generate an audit pair.
- **Manual override** — explicit directional override; tagged with the macro thesis or reason (e.g. "BoJ intervention shock; tactical USDJPY short on top of automated book").
- **Discretionary EM override** — explicit EM-political-risk override (e.g. "Brazil presidential election surprise; pause-and-step-aside on BRL book is automated, but I want to layer a tactical short on top until clarity").

Attribution carries the tag through P/L, performance metrics, reports. David's behavioral monitoring tracks the frequency of each tag class — sustained increase in emergency interventions or overrides is a leading indicator David investigates.

#### 12.3.3 Reconciliation Workflow

A specific surface for the reconciliation case, because it's the most error-prone of the three.

**The reconciliation page:**

- **Left panel:** the platform's view — every position the strategies _think_ they have, per venue / per LP / per prime broker, per pair, per settlement date.
- **Right panel:** the venue's / PB's view — every position actually shown.
- **Diff highlighted:** rows where the two disagree. Discrepancy size in $ and as % of position.
- **Per-row actions:**
  - "Trust venue" — the platform updates its internal state to match. Strategy state corrected; audit logged.
  - "Trust platform" — the venue is incorrect (rare); manual reconciliation order placed at the venue. Audit logged.
  - "Investigate" — opens a diagnostic with the relevant fills, cancels, modifies that should explain the divergence.
- **FX-specific reconciliation cases:**
  - **Forward / NDF settlement reconciliation** — particularly error-prone because settlement dates are days / weeks / months in the future and reconciliation crosses multiple platform components.
  - **Fixing fill reconciliation** — fixing fills come back from venues with their own format and timing; one missed fixing can leave a strategy in a phantom-position state.
  - **NDF onshore-offshore reconciliation** — when a position is opened on offshore CNH and closed on onshore CNY (or vice versa via a synthetic path), reconciliation must net the legs correctly.
  - **Cross / synthetic execution reconciliation** — when a synthetic EURJPY is executed as EURUSD + USDJPY, reconciliation must confirm both legs filled atomically.
- **Bulk actions** — "trust venue for all settlements where the discrepancy is < $10k and resolves within 1 day" when the source of divergence is known transient.

**Auto-trigger:**

- Continuous reconciliation in the background; minor discrepancies that resolve within seconds do not surface.
- Discrepancies above a threshold ($ size or duration) escalate to alerts.
- Yuki can run a manual full reconciliation on demand — typically end-of-session or after an incident.
- **Daily settlement reconciliation** — automatic at end-of-NY-session for all forward / NDF settlements due in the next 5 days; surface any discrepancies for Yuki review before the settlement window.

#### 12.3.4 Emergency Modes

A specific UI mode that Yuki can switch into during a crisis.

**Emergency mode reorganizes the screen:**

- **Manual ticket pinned** — large, foveal, with the affected pair pre-loaded.
- **FX cross matrix** — for the affected currency / pair, showing all cross-impacts.
- **Carry-unwind risk monitor** — foveal because in a risk-off shock, the carry book is the first concern.
- **Currency exposure dashboard** — second-largest panel, showing what's open and where.
- **Working orders across all venues / LPs** — what's resting that Yuki might need to cancel.
- **Strategy intervention console** — pause / kill controls visible.
- **Alert console** — relevant alerts streaming.
- **Latency / connectivity panel** — venue-by-venue, LP-by-LP connection state, foveal because in an emergency, one LP being slow or unreachable changes the play.
- **News / intervention feed** — for context on what's happening (BoJ headline, capital-control announcement, etc.).

Hotkeys preserved; muscle memory from manual mode is the trader's most valuable asset during a real emergency.

**Switching into emergency mode** is a single keystroke. Switching back is one keystroke. Work-in-flight (research notebooks, etc.) preserved; nothing lost.

#### 12.3.5 Manual Trading Hotkeys (Always Available)

Even in default research mode, certain manual-trading hotkeys are global:

- **Open manual ticket** for currently-focused pair.
- **Flatten focused pair** across all venues / LPs (combined position).
- **Flatten focused currency** — close all positions long/short a specific currency, across all pairs.
- **Cancel-all-on-focused-pair.**
- **Roll forward** focused position (close near, open far on same notional).
- **Hedge-to-USD-flat** the focused currency / pair.
- **Pause all carry strategies** (chord; less easily triggered to avoid accidents).
- **Pause all EM strategies** (chord).
- **Switch to emergency mode** (chord).

These remain bound regardless of which mode the supervisor console is in. Yuki's reflex to react manually is preserved.

#### 12.3.6 Audit & Friction

Manual trading is auditable but not friction-free for non-emergency cases:

- **Emergency interventions** — minimal friction. One confirmation, audit logged.
- **Reconciliation** — friction matched to size; small reconciliations are one-click; large ones require reason field.
- **Manual override (directional)** — full friction: reason field, confirmation gate, override tag mandatory.
- **Discretionary EM override** — additional friction: explicit attestation that the override is not bypassing a capital-control gate or sanctions check.

Every manual trade enters the same audit trail as algo trades, with the manual flag and tag class. Searchable, reviewable, exportable for risk-committee or regulator review.

#### 12.3.7 Why this matters

- **Efficiency:** in an intervention shock or capital-control event, seconds to a working manual ticket = real PnL preservation. The platform's manual surfaces are first-class even when not the primary surface.
- **Risk:** reconciliation is a real operational risk — particularly in FX where forward / NDF settlement chains span days or weeks. Without a designed reconciliation workflow, the platform's view and the venues' views drift; positions get lost or mis-tracked.
- **PnL:** the ability to layer a high-conviction discretionary trade on top of the automated book lets Yuki capture macro-event alpha that pure systematic strategies miss — an EM-political shock, a CB intervention surprise, a capital-control announcement. Tagged and audited so it's accountable.
- **Platform validation:** if Yuki can place every trade her strategies make from the manual UI — spot, forward, NDF, swap, options, fixing-targeted, RFQ-block — the platform's execution layer is verified end-to-end. Cleanest integration test of the entire trading stack.

### 12.4 Kill Switches at Multiple Scopes

Layered kill switches per [#19 Kill Switches](common-tools.md#19-kill-switches-granular):

- **Per-strategy kill** — cancel all working orders + flatten positions on this strategy.
- **Per-strategy-class kill** — flatten the carry fleet; flatten the fixing-flow fleet; flatten the NDF fleet.
- **Per-pair kill** — flatten USDJPY across all strategies (e.g. on BoJ intervention).
- **Per-currency kill** — flatten all positions long/short a specific currency.
- **Per-EM-bucket kill** — flatten all EM-tier-1 or EM-tier-2 strategies (e.g. on broad EM political shock).
- **Per-session kill** — pause all Tokyo-session strategies.
- **Fleet-wide kill** — Yuki's entire automated cousin (all ~200 strategies). Multi-confirmation.
- **Firm-wide kill** — David + CIO + risk-officer; multi-key authentication for catastrophic events.

Each scope's kill is a designed action: cancel-or-flatten configurable, audit-trail mandatory, reversal procedure documented.

### 12.5 Intervention Audit Log

Append-only log of every intervention. Searchable / filterable / exportable.

- Per-row: timestamp, scope, actor, action, reason, pre-state, post-state, downstream effect.
- Used in post-incident review, regulator request, behavioral self-review.

### 12.6 Why this matters

- **Efficiency:** intervention scoping (per-strategy / class / pair / currency / EM-bucket / session / fleet) lets Yuki respond proportionately.
- **Risk:** every intervention is auditable. Catastrophe response (BoJ shock, capital-control event, EM sovereign event) is designed; the platform has practiced it.
- **PnL:** the cost of over-intervention is missed PnL. The cost of under-intervention is realized loss. Granular controls plus disciplined auditing balance both.

## 13. Post-Trade & Decay Tracking

The feedback loop from yesterday's results into tomorrow's research.

### 13.1 Per-Strategy Retrospectives

Auto-generated per strategy on a configurable cadence (typically weekly + monthly).

**Layout:**

- **Header** — strategy name, period, current stage.
- **Performance vs expectation:** realized Sharpe vs research-time expected distribution.
- **Equity curve overlay** — realized vs backtest counterfactual.
- **Drawdown decomposition** — recent drawdowns, contributing trades, features / regime / executions.
- **Regime fit** — % of period in each regime; per-regime performance; regime-fit health score.
- **Capacity realized vs assumed** — slippage, fill rate, partial fills.
- **FX-specific decomposition:** spot vs carry vs vol vs fixing vs funding contribution. A carry strategy might appear flat on spot but have positive carry; a fixing strategy's decay shows up first on fixing-realization deviation.
- **Recent interventions and effect** — what was paused, capped, retrained; observed PnL impact.
- **Drift state** — feature, prediction, performance drift snapshot.
- **Recommended action** — continue / retrain / cap / monitor / retire — with rationale.

Yuki reads these end-of-week, on the strategies needing attention; she skims the others.

### 13.2 Fleet-Level Review

Auto-generated weekly + monthly.

**Layout:**

- **Total PnL decomposition** — by strategy class, by pair, by session, by regime.
- **Per-currency attribution** — which currencies generated alpha; which detracted.
- **Per-session attribution** — Tokyo / London / NY contributions; session-skill is a real and durable axis.
- **Per-fixing-window attribution** — WMR vs ECB vs NY vs Tokyo fixing-flow attribution.
- **Carry vs spot attribution** — fleet-level carry P/L vs spot P/L; the canonical FX decomposition.
- **Cross-strategy correlation matrix** — has correlation drifted within or across classes?
- **Capacity utilization** — fleet-wide; per-class.

### 13.3 Decay Metrics Surface

Per-strategy decay tracking:

- **Sharpe trajectory** — rolling Sharpe over multiple windows; trajectory direction.
- **Calibration drift** — for probabilistic models, calibration-curve evolution.
- **Capacity-realized trajectory** — is the strategy filling smaller fractions of its target size over time?
- **Feature-drift cumulative** — cumulative feature drift since training.
- **FX-specific decay drivers:** fixing-methodology changes (post-WMR-widening behavior is different); intervention-regime changes (BoJ became more active in 2022–2023); capital-control regime changes (Argentina 2019, Turkey 2023, Egypt 2024); funding-currency regime changes (JPY YCC end).

### 13.4 Retrain Queue UI

Strategies queued for retrain:

- **Auto-queued** — drift exceeded threshold; calibration off; performance trajectory negative.
- **Yuki-queued** — manual retrain decision (e.g. "retrain after the BoJ regime change to incorporate post-YCC data").
- **Per-row:** strategy, retrain reason, queue priority, ETA, $ compute cost projected.
- **Approval workflow:** routine retrains auto-approved within budget; novel retrains require Yuki sign-off.

### 13.5 Retire Decisions

When a strategy is confirmed dead:

- **Decision documentation** — evidence, period of decay, rationale, capital recycled.
- **Archive** — strategy moves to retired stage; capital reclaimed; positions flattened.
- **Lessons captured** — what failed, what to learn for the strategy class going forward.

### 13.6 Why this matters

- **Efficiency:** retrospectives are auto-generated, not composed; Yuki reads, doesn't write.
- **Risk:** decay is caught by metrics, not gut. FX has many slow-burn decay drivers (fixing methodology, intervention regime, capital-control regime); systematic catching is the only way.
- **PnL:** retraining cadence is data-driven. Capital trapped in dying strategies is recycled.

## 14. The Supervisor Console — Yuki's Daily UI

The supervisor console integrates all the surfaces above into one workspace. It's not a single new surface; it's the layout / mode-switching / spatial organization of everything described.

### 14.1 Yuki's Monitor Layout (Illustrative)

Yuki runs 6 monitors. Her typical layout in automated mode:

| Position      | Surface                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Top-left      | **Fleet supervision dashboard** (default amber + red filter, FX-specific columns)                 |
| Top-center    | **Research workspace** (notebook environment)                                                     |
| Top-right     | **Anomaly / alerts console + decay surface + EM political news + capital-control event tracker**  |
| Middle-left   | **Strategy detail page** (drill-down when investigating)                                          |
| Middle-center | **Currency exposure dashboard + carry-unwind risk monitor + fixing-approach surface**             |
| Middle-right  | **Capital allocation engine + per-currency / per-session caps + promotion-gate queue**            |
| Bottom-left   | **FX cross matrix + multi-pair charts** (manual surfaces in periphery — kept for emergencies)     |
| Bottom-right  | **News / research feed + comms** (sell-side FX desk chat, EM specialist chat, internal economist) |
| Tablet        | Bloomberg / Reuters chat, IB FX strategist notes                                                  |

The supervisor console's center of gravity is **research workspace + fleet supervision + currency exposure / carry-unwind**. The manual terminal's center of gravity (FX matrix + ticket + position blotter) is now in the bottom corners as background — not foveal but reachable in one keystroke.

### 14.2 Mode-Switching

The console has modes; switching reconfigures the layout.

- **Research mode (default during quiet hours):** notebook foveal; supervisor + alerts in periphery; capital allocation collapsed.
- **Supervision mode (alert-driven):** fleet dashboard + strategy detail foveal; research minimized.
- **Fixing mode (approaching WMR / ECB / NY / Tokyo fixing windows):** fixing-approach surface foveal; sell-side fixing-flow color visible; manual ticket pre-loaded with fixing-targeted-algo defaults; countdown timer.
- **Event mode (FOMC / ECB / BoJ / EM CB / capital-control event):** anomaly console + intervention console + currency exposure dashboard foveal; charts of high-vol pairs visible; manual ticket reachable.
- **EM mode (EM political event / sovereign event):** EM political news + capital-control event tracker + EM-specific intervention controls foveal; EM strategy fleet drilled in; manual NDF ticket pre-loaded.
- **Pre-market mode:** fleet review + alerts + macro context + overnight session attribution dominant.
- **Post-market mode:** decay + retrospectives + capital allocation + experiment-priority-queue dominant.

Switching is one keystroke. Work-in-flight (open notebooks, pending interventions) preserved.

### 14.3 Anomaly-Driven Default State

The console is **green-by-default**. Most of the day, Yuki is heads-down in research; the supervisor surface is quiet. When something goes off, alerts route via:

- Banner on screen (auditable).
- Audio (configurable per severity).
- Mobile push when away from desk.
- Phone page for catastrophe-tier alerts (BoJ intervention confirmed, capital-control announcement, EM sovereign event, fleet-wide kill recommended).

Yuki trusts the platform's silence. False-positive alerts erode this trust quickly; tuning of severity / thresholds / suppression is critical.

### 14.4 Why this matters

- **Efficiency:** time-on-research is the trader-quant's primary leverage. The console design ensures research is foveal-by-default, supervision is peripheral-by-default. Inverse of the manual terminal.
- **Risk:** mode-switching to event / EM / fixing mode in seconds during a crisis is the difference between contained damage and runaway loss.
- **PnL:** the cognitive shift from foveal-pair-watching to peripheral-fleet-supervision is what makes 200+ strategies tractable.

## 15. Yuki's Automated-Mode Daily Rhythm

FX is a 24/5 market with sharp session boundaries (Tokyo / London / NY / Sydney). Yuki's "day" is bounded by her shift; the strategies run continuously across sessions. Overnight supervision is split across regions or handled by the automated supervisor (with escalation rules to wake the on-call human for critical alerts). Yuki herself typically anchors a **Tokyo + London** or **London + NY** schedule depending on firm convention.

### 15.1 Pre-Market (60–90 min)

The day starts with **fleet triage and research-priority setting**, plus a structured read of overnight session activity.

**Fleet review (15–25 min):**

- Glance at supervisor console. Default: most strategies green; investigate amber + red.
- Read overnight session attribution: which strategies generated PnL, which detracted, which behaved out-of-distribution. Tokyo session is pre-market context for London-anchored Yuki; Asia + London if NY-anchored.
- Read alerts queue from overnight — capacity warnings, feature drift, regime mismatches, infrastructure incidents, EM political flags.
- Verify all positions and settlement obligations are at intended state — no overnight surprises in forward / NDF ladder.
- Carry-unwind monitor check — has the funding-currency-rally signal fired overnight?

**Research catch-up (15–25 min):**

- Skim experiment-tracker results from overnight runs.
- Promote winners (a successful experiment becomes a notebook for further investigation, or a candidate strategy for paper-trading).
- Archive losers with notes.
- Review canary-deployment results from yesterday's promotions.

**Macro / regime read (15–20 min):**

- Read morning notes — sell-side FX strategists (G10 + EM), internal economist notes, central bank speaker schedules.
- Identify regime-shift signals (FOMC week, NFP day, ECB / BoJ / BoE meeting day, China policy headline, EM political event imminent, capital-control rumor).
- Consider: are any of my strategies fragile to today's regime? Cap them, hedge them, or leave alone.
- Read the EM political-risk feed end-to-end. Capital-control changes overnight? Election results imminent? Sovereign-debt auction this week?

**Fixing window planning (10–15 min):**

- For today's WMR / ECB / NY / Tokyo fixings: which strategies will be active, which sell-side flow color is signaling, which fixings have idiosyncratic seasonality (month-end, quarter-end, year-end).
- Review fixing-approach surface for any pre-positioning that has accumulated.

**Promotion-gate decisions (10–15 min):**

- Strategies waiting for promotion sign-off: review the gate evidence, sign off or send back with notes.
- Coordinate with David on any promotions material to firm risk.
- Coordinate with Ingrid on rate-FX strategies whose rate leg is in her domain.

**Coffee / clear head:**

- Step away. The cognitive load of the rest of the day is research-heavy; preserve focus.

### 15.2 In-Market (continuous, anomaly-driven, session-aware)

The radical shift from manual trading. Most of the day is **research, not supervision**.

**Default state:** trader is in the research workspace. Notebooks open. Working on:

- A new strategy idea (from yesterday's review).
- Feature engineering — a hypothesis to test (e.g. "does WMR fixing realization correlate with sell-side flow color over a rolling 6m window? Is the relationship stronger on month-end fixings?").
- Model retraining for a strategy showing drift.
- Hyperparameter sweep on a candidate model.
- Diagnosing a strategy that underperformed yesterday.
- Reading new sell-side or peer-firm research and prototyping ideas.

**Background:** supervisor console open in another monitor; default green. Alerts route to mobile when heads-down.

**Session-handoff windows:** at Tokyo close / London open / NY open, a brief mode-switch to fleet review:

- Has session-handoff microstructure produced any anomalies?
- Any strategies that should pause for the session change (e.g. an Asian-session-only strategy enters quiet mode)?
- Any new fixing windows entering the active queue?

**Fixing windows (event-driven):** as a fixing approaches (WMR 4pm London is the largest), Yuki switches to fixing mode for ~30 minutes:

- Fixing-approach surface foveal.
- Sell-side fixing-flow color visible.
- Active fixing-targeted positions and orders monitored.
- Manual override available for any tactical deviation.
- Post-fix: brief review of realization vs prediction.

**Alert response (5–10% of the day):** when an alert fires:

- Drill into the strategy detail page.
- Diagnose: is this a true anomaly (intervene) or a known transient (acknowledge)?
- If intervene: pause / cap / replace. Document the decision.

**Liquid-event override (rare but real):**

- **CB intervention shock** (BoJ buys $50bn USDJPY at 162; SNB intervenes on EURCHF). Switch to event mode. Pause sensitive strategies (or let them ride if the strategy's regime-handling is robust). Use manual order entry for any high-conviction directional bet (with override tagging).
- **Capital-control announcement** (China imposes new outbound restriction; Turkey adjusts FX-conversion rules). Switch to EM mode. Pause affected EM strategies via group control. Read the regulatory text. Decide whether to step out and watch or to exploit dislocation.
- **EM political shock** (Brazil election surprise; Argentina IMF program collapse). Switch to EM mode. Pause affected book.
- **Major macro release** (FOMC dot-plot surprise; ECB hawkish surprise). Switch to event mode briefly; let strategies handle if the regime-conditioning is sound.

**Mid-day capital-allocation review:** glance at allocation drift. Material drift triggers a rebalance proposal; Yuki approves or defers.

**Cross-trader coordination:** brief desk-chat exchanges with adjacent archetypes.

### 15.3 Post-Market (60–90 min)

End-of-day review and tomorrow's research priorities.

**End-of-day attribution (15–20 min):**

- Today's PnL decomposition — by strategy class, by pair, by currency, by session, by regime, by fixing window.
- Carry vs spot vs vol vs fixing vs funding decomposition fleet-wide.
- Identify outliers — strategies that significantly outperformed or underperformed expectation.
- Verify all positions and settlement obligations are at expected state.

**Decay check (10–15 min):**

- Run the decay surface: any strategies whose Sharpe trend is concerning?
- Any strategies needing retraining? Approve the retrain queue or queue for overnight.
- Any features whose drift is growing? Consider downstream impact.

**Capital allocation (10–15 min):**

- Review nightly allocation proposal.
- Approve, modify, or escalate to David.
- Verify capital deployed reflects the approved allocation.
- Per-currency caps reviewed; per-funding-currency concentration checked.

**Research-priority setting (15–25 min):**

- Based on the day's findings: what's tomorrow's research priority?
- Queue overnight backtests / training runs (5–10 typically).
- Update experiment-tracker priorities.
- Note any features to add to the library.

**Promotion-gate triage (5–10 min):**

- Strategies ready for promotion review tomorrow morning.
- Gate evidence in place; trader sets reminder.

**Settlement preview (5–10 min):**

- Forward / NDF settlements due in the next 5 days reviewed.
- Reconciliation surface checked for any pending discrepancies.
- Funding for short-currency settlements pre-arranged where needed.

**Sign-off:**

- Confirm all alerts are acknowledged or resolved.
- Confirm fleet is in expected state for overnight running.
- Hand-off to the next-shift supervisor (Tokyo coverage if Yuki anchors London/NY), or rely on automated supervision overnight (with escalation rules to wake the on-call for critical alerts).

### 15.4 Cadence Variations

- **CB-meeting weeks** (FOMC, ECB, BoJ, BoE) — supervision-heavy; less research; fixing-mode toggling around the meeting.
- **NFP / CPI / China-data weeks** — event-mode toggling; carry strategies on tighter watch.
- **Quarter-end / month-end / year-end** — fixing-flow strategies have idiosyncratic seasonality; allocation reviewed for fixing concentration.
- **EM political-event windows** (election cycles, IMF program negotiations, sovereign-debt auctions) — EM-mode toggling; capital-control event tracker on tight watch; manual override often layered on the EM book.
- **Quiet weeks** — research-dominated; the strategies run themselves; Yuki invests in alpha-generation.
- **Major procurement / data-vendor weeks** — Yuki spends meaningful time on data-layer evaluation.
- **Quarter-end firm review** — cross-fleet review, retire decisions, capital reallocation, committee report contribution.

## 16. Differences from Manual Mode

| Dimension                  | Manual Yuki                                         | Automated Yuki                                                                                            |
| -------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Coverage                   | 8–10 pairs hand-watched                             | 25+ pairs × 4 sessions × 4 fixing windows × multiple horizons                                             |
| Trades per day             | 10–50 high-conviction                               | Hundreds across the fleet (carry rolls, fixing trades, NDF arb, mean-reversion ticks)                     |
| Phase 1 (Decide)           | Reading the FX matrix                               | Choosing alpha to research; managing portfolio of strategies                                              |
| Phase 2 (Enter)            | Click ticket; multi-LP best-fill                    | Promote strategy through lifecycle gates                                                                  |
| Phase 3 (Hold)             | Watching currency exposures                         | Anomaly-driven supervision of fleet; carry-unwind monitor; fixing-approach surface                        |
| Phase 4 (Learn)            | Journaling lessons                                  | Decay tracking, retraining, attribution-driven research priorities                                        |
| Time on FX matrix          | 60–70%                                              | 5–10% (mostly diagnostic, not generative)                                                                 |
| Time on research           | 5–10%                                               | 55–65%                                                                                                    |
| Time on supervision        | 10–15%                                              | 10–15%                                                                                                    |
| Time on intervention       | (continuous)                                        | 5–10%                                                                                                     |
| Time on data / procurement | minimal                                             | 5–10%                                                                                                     |
| Time on capital allocation | minimal (per-trade sizing only)                     | 5–10% (fleet-level, per-currency, per-session)                                                            |
| Time on EM political read  | 10–15%                                              | 10–15% (unchanged — stays human, made higher-leverage)                                                    |
| Latency criticality        | Visible per LP                                      | Per-strategy-class latency tiers, with budget enforcement                                                 |
| Risk units                 | $-notional + per-currency net delta                 | Same + per-strategy + per-currency + per-funding-currency + per-session caps                              |
| Edge metric                | P/L, Sharpe, carry capture                          | P/L, Sharpe, decay rate, capacity utilization, marginal Sharpe, fixing-realization calibration            |
| Cognitive load             | Foveal-on-FX-matrix-and-currency-exposures          | Peripheral-on-fleet; foveal-on-research-or-anomaly; foveal-on-EM-political-when-event-triggers            |
| Failure modes              | Tilt, fatigue, missed fixing, intervention shock    | Silent overfit, decay-blindness, alert fatigue, runaway algo, capital-control gate misses                 |
| Tools mastered             | FX matrix, multi-LP ticket, NDF ticket, vol surface | Notebook, feature library, model registry, lifecycle gates, allocation engine + manual surfaces preserved |
| Compensation driver        | Sharpe + carry capture + AUM                        | Same + research velocity + fleet capacity utilization + EM-event capture                                  |

The fundamental change: **Yuki stops being the worker and becomes the principal investor in her own FX quant book — while remaining the firm's expert on EM political risk, capital-control events, and central-bank intervention.**

## 17. Coordination with Other Roles

### 17.1 Coordination with Ingrid (Rate-FX Linkages)

Ingrid runs the rates desk. Yuki runs FX. The rate-FX overlap is structural — a 2y rate differential move is partly an Ingrid story (front-end curve) and partly a Yuki story (FX directional). They coordinate constantly:

- **Shared feature library** — Ingrid's OIS-implied policy paths, 2y / 5y / 10y rate-curve features, real-yield differentials are core inputs to Yuki's rate-differential and OIS-policy-path features. Lineage is shared; both desks see when an upstream Ingrid feature drifts.
- **Cross-desk strategy ownership** — when a strategy idea has both a rate leg and an FX leg, ownership convention determines who composes the strategy. Typically: rate-curve-driven strategies live with Ingrid (FX is a follower); FX-microstructure-driven strategies with rate-differential overlay live with Yuki. Hybrid strategies have explicit attribution split rules.
- **Operational coordination** — when Yuki's FX strategy implies a rate-curve view that Ingrid's models contradict, they reconcile. The platform's correlation matrix surfaces the conflict.
- **CB-meeting coordination** — pre-FOMC / ECB / BoJ / BoE: Ingrid's rate-priced view, Yuki's FX-priced view. Both desks pre-discuss positioning; the platform's joint dashboard shows aggregated firm exposure.
- **Cross-currency basis ownership** — basis-swap strategies typically live with Ingrid (rates desk) because the funding-stress signal is rate-domain; Yuki consumes the basis features as inputs to her FX risk-gates.
- **Joint experiments** — joint notebooks on rate-FX hypothesis testing (e.g. "does the 2y rate differential's z-score lead the EURUSD spot move by 1–3 days?").

### 17.2 Coordination with Quinn (Cross-Archetype Factor / Stat-Arb)

Quinn runs cross-archetype factor / stat-arb / market-neutral systematic strategies. Some of her strategies overlap with Yuki's FX domain (a G10 carry factor; a cross-asset risk-on/off systematic strategy with FX expression; a rate-FX joint factor). They coordinate to avoid double-up:

- **Correlation matrix shared** — Quinn's fleet vs Yuki's fleet pairwise correlations visible to both.
- **Promotion-gate awareness** — Quinn promoting a new G10 carry factor alerts Yuki; if Yuki's carry-strategy fleet would correlate, they negotiate (split capacity, kill one, etc.).
- **Feature sharing** — Yuki's carry-bucket and rate-differential features are useful to Quinn (and vice versa); the library is the connector.
- **Research collaboration** — joint research on cross-archetype topics (e.g. carry factor across asset classes, FX value/momentum factors).

### 17.3 Coordination with David (Firm-Level Supervisor)

David is the firm-level supervisor. Yuki's automated cousin is a $X-allocated fleet within David's purview.

- **Fleet-level reporting** — David sees Yuki's ~200 strategies aggregated, with health / PnL / risk-consumed visible.
- **Per-currency exposure aggregation** — David's view aggregates currency exposures across Yuki + Ingrid (rate-FX linkages) + Quinn (cross-archetype FX factors) + any FX expression from Rafael's macro themes. Currency exposure is a firm-level risk axis.
- **Capital allocation gates** — material allocation changes route to David.
- **Behavioral monitoring** — David watches Yuki's intervention frequency, override frequency, retire-decision pace. Drift in these is a leading indicator.
- **Promotion-gate sign-off for material strategies** — strategies above a capital-cap threshold require David's sign-off in addition to Yuki's. **EM strategies above any meaningful cap require explicit EM political-risk attestation.**
- **Catastrophe response** — firm-wide kill switches require David + CIO + risk officer; Yuki has fleet-level kill autonomy.
- **Risk-committee deliverables** — Yuki's monthly attribution + risk decomposition + lifecycle decisions are inputs to David's committee deck.
- **EM political-risk briefings** — Yuki briefs David's office before major EM events (election cycles, IMF program decisions, intervention threats). The platform structures the briefing as a deliverable.

### 17.4 Coordination with Sasha (FX-Vol Crossover)

Sasha runs the options & vol desk. The FX-vol surface is a shared surface between Sasha and Yuki:

- **Shared vol-surface feature library** — Sasha's IV / RR / butterfly / term-structure features are core inputs to Yuki's vol-surface mean-reversion strategies.
- **Strategy ownership conventions** — pure vol-surface strategies (calendar spreads, dispersion) live with Sasha; FX-directional strategies with vol overlay live with Yuki. Multi-leg vol-quoted structures are the boundary; coordination at composition time.
- **Joint experiments** — FX RR mean-reversion, intervention-vol pricing, fixing-day vol patterns.

### 17.5 Coordination with Rafael (Macro Themes Through FX)

Rafael's macro themes often express through FX (a USD theme expressed via DXY / EM bloc; a global-recession theme expressed via JPY / CHF safe-haven; a commodity-cycle theme expressed via AUD / NOK / CAD).

- **Theme-expression coordination** — when Rafael wants an FX expression of a theme, Yuki's desk owns the execution; Rafael's conviction sizes the position; the platform's joint dashboard shows the layered exposure.
- **Macro-feature consumption** — Rafael's theme-tracking features can be inputs to Yuki's regime classifiers; Yuki's currency-regime features can be inputs to Rafael's theme-evolution monitoring.
- **Override coordination** — when Rafael has a high-conviction macro view that contradicts the systematic carry book, the negotiation of pause-vs-override-vs-cap is human and audited.

### 17.6 Coordination with EM-Specialist Desks and Compliance

EM trading is heavily compliance-touched (sanctions, restricted-list, jurisdictional access). Yuki's automated cousin coordinates with:

- **EM-specialist desks** (where the firm has them) — political-risk reads, capital-control event interpretation, local-market color.
- **Compliance** — sanctions checks per pair / per counterparty / per LP; restricted-list awareness; jurisdictional access (some EM pairs have restricted access for non-local entities).
- **Operations** — NDF settlement, forward settlement, prime-broker reconciliation. FX has a heavy ops surface that the platform must integrate cleanly.

### 17.7 Why this matters

- **Efficiency:** without coordination, the firm builds the same FX strategy twice across desks (Yuki's carry vs Quinn's carry factor), doubles up on capacity, dilutes attribution. Coordination layered on visibility tools is cheap.
- **Risk:** correlated bets across desks compound risk. Currency exposure is a firm-level axis; visibility prevents accidental over-exposure. EM strategies have idiosyncratic compliance risk that must flow through automated gates.
- **PnL:** cross-desk research collaboration produces alpha. Rate-FX joint research with Ingrid is a fertile area; FX-vol joint research with Sasha likewise; cross-asset FX expressions with Rafael let the firm capture macro-event alpha that no single desk could find alone.

## 18. How to Use This Appendix

When evaluating Yuki's automated terminal (against any platform — including our own):

**Data layer:**

- Are all FX-specific data sources cataloged with quality / lineage / cost / freshness / used-by tracking — spot tick archives, forward / NDF tick archives, FX vol surfaces, central-bank intervention archives, OIS / rate-differential archives, fixing-history archives (WMR / ECB / NY / Tokyo), CFTC IMM positioning, capital-control event tracker, sovereign CDS, sell-side fixing-flow color?
- Is the procurement dashboard a serious tool, with attribution-vs-cost evidence (especially for expensive vol-surface and sell-side fixing-flow products)?
- Is gap analysis tied to concrete strategies that can't be deployed (e.g. "we lack tier-2 EM political-risk feed; this blocks the LatAm NDF arb fleet")?
- Are fixing-methodology changes (WMR window widening; ECB methodology updates) tracked as versioned schema events?
- Is the EM political-risk feed structured enough to drive automated capital-control gates?

**Feature library:**

- Are FX-domain features (carry-to-vol-z, basis-blowout-flag, cross-currency-basis-z, fixing-imbalance-estimate, fixing-realization-z, intervention-zone-proximity, CB-reserves-change-z, RR-25d-z, butterfly-25d-z, real-yield-differential, OIS-policy-path-divergence, capital-control-event-flag, em-political-risk-flag) first-class with drift monitoring?
- Is the feature engineering surface frictionless inline-in-notebook?
- Is cross-pollination across desks supported (rate features from Ingrid; vol features from Sasha; macro features from Rafael)?
- Are EM-political and capital-control features structured (not just text-blob) where the regulatory shape permits?

**Research workspace:**

- Can Yuki go from idea to validated strategy in hours, not weeks?
- Is the backtest engine realistic for FX (multi-LP fill model, last-look modeling, RFQ for forward / NDF, fixing execution mechanics, vol multi-leg pricing, carry / forward roll, weekend triple-roll, intervention scenarios, capital-control event handling)?
- Are anti-patterns caught (lookahead, survivorship, p-hacking, fixing-realization leakage)?
- Is the strategy-template library populated with FX-specific templates (carry-basket, single-pair carry, cross-vol RV, vol term-structure, RR mean-reversion, fixing-flow, major mean-reversion, trend-and-momentum, NDF arb, cross-asset FX, intervention-zone)?
- Is walk-forward across session boundaries and across fixing-methodology epochs supported as a first-class validation mode?

**Model registry & experiment tracker:**

- Can any model be re-trained from registered inputs and produce a bit-identical result?
- Are old versions never deleted?
- Does the experiment tracker make Yuki's research process honest and defensible?
- Is FX-specific decay tracking (fixing methodology, intervention regime, capital-control regime, funding-currency regime) surfaced cleanly?

**Strategy composition:**

- Is the composition surface visual + code-droppable?
- Does pre-deployment validation catch lookahead, unbounded sizing, missing kill-switches, missing capital-control gates on EM strategies, missing intervention-zone gates on intervention-prone pairs, missing fixing-window declaration on fixing strategies?
- Are FX-specific templates (carry, fixing, NDF, intervention-zone, cross-vol, mean-reversion) provided?

**Lifecycle:**

- Is the pipeline visualization (research → paper → pilot → live → monitor → retired) usable as a daily kanban?
- Are gates checklists with evidence, not chat conversations?
- Are EM-strategy promotions explicitly gated on capital-control + intervention + EM political-risk attestation?
- Are fixing-strategy promotions gated on fixing-realization calibration across multiple windows?
- Are carry-strategy promotions gated on stress-test results against historical carry-unwind episodes?
- Is rollback one-click?

**Capital allocation:**

- Does the allocation engine propose a nightly portfolio with per-currency, per-funding-currency, per-session, per-EM-bucket, and marginal-Sharpe analysis?
- Are per-currency exposure caps enforced (not just per-pair)?
- Are funding-currency-concentration caps enforced (preventing crowded-trade unwind risk)?
- Is per-session capital allocation supported (Tokyo / London / NY)?

**Live fleet supervision:**

- Can Yuki supervise 200+ strategies anomaly-driven, default green, with FX-specific columns (carry-state, vol-state, fixing-state, EM-state, intervention-state)?
- Is the strategy detail page a complete diagnostic surface with FX P/L decomposition (spot / carry / vol / fixing / funding)?
- Are anomalies severity-routed with auto-actions on critical (auto-pause on capital-control event, auto-pause on confirmed intervention)?
- Is **strategy state inspection** (internal variables, current feature snapshot, recent signal evaluations, regime classifier output, FX-specific custom state per strategy class) available on demand per strategy?
- Is **backtest-vs-live comparison** computed (daily by default, on-demand available) with FX-specific decomposition (spot / carry / vol / fixing / funding divergence)?
- Is the platform pragmatic about state-streaming load (refresh-on-demand and event-pushed, not constant streaming for all 200 strategies)?
- Is the **carry-unwind risk monitor** a first-class live surface with funding-currency rally signal, basket concentration, historical-episode replay?
- Is the **fixing-approach surface** integrated with active fixing-targeted positions, time-to-fix countdown, sell-side flow color, and post-fix calibration?
- Is the **currency exposure dashboard** the primary risk view (not pair exposure)?

**Intervention console & manual trading:**

- Are kill switches granular (strategy / class / pair / currency / EM-bucket / session / fleet / firm) with multi-key authentication for the largest scopes?
- Is **the full manual order ticket framework** (spot / forward / FX swap / NDF / cross-synthetic / FX options / fixing / RFQ-block) preserved and one-keystroke-reachable from the supervisor console?
- Are FX hotkeys (flatten by pair, flatten by currency, roll forward, hedge-to-USD-flat, pause-all-carry, pause-all-EM) bound regardless of supervisor mode?
- Is **emergency mode** a designed UI mode with manual ticket + FX matrix + carry-unwind monitor + currency exposure dashboard foveal?
- Is **EM mode** a distinct mode with EM political news + capital-control event tracker + EM strategy fleet + manual NDF ticket foveal?
- Is **fixing mode** a distinct mode with fixing-approach surface + sell-side fixing-flow color + manual fixing-targeted-algo ticket foveal?
- Is **reconciliation** a designed workflow including FX-specific cases (forward / NDF settlement reconciliation, fixing fill reconciliation, NDF onshore-offshore reconciliation, cross / synthetic execution reconciliation)?
- Is daily settlement reconciliation auto-run end-of-NY-session for all forward / NDF settlements due in the next 5 days?
- Is every manual trade tagged (emergency / reconciliation / override / discretionary EM override) and auditable?
- Is every intervention logged with timestamp / actor / action / reason / pre-state / post-state?

**Post-trade & decay:**

- Are retrospectives auto-generated, not composed?
- Is decay caught by metrics, not gut, with FX-specific drivers (fixing methodology, intervention regime, capital-control regime, funding-currency regime) explicitly tracked?
- Is the retrain queue actionable, with auto-approval for routine retrains and explicit approval for live strategies?
- Is fleet-level review by per-pair, per-currency, per-session, per-fixing-window, per-regime, with carry-vs-spot-vs-vol-vs-fixing-vs-funding decomposition?

**Supervisor console:**

- Is research foveal-by-default and supervision peripheral-by-default?
- Is mode-switching (research / supervision / fixing / event / EM / pre-market / post-market) one keystroke?
- Is the platform green-by-default and trustworthy in its silence?
- Are FX-specific peripheral surfaces (FX cross matrix, multi-pair charts) preserved for emergencies?

**Daily rhythm:**

- Can Yuki actually spend 55–65% of her time on research while the fleet runs supervised in the periphery?
- Are pre-market / in-market / post-market / fixing-window / event / EM workflows supported by the right surfaces in the right modes?
- Is the EM political-risk read built into the daily rhythm (not a side-task)?
- Is settlement preview built into post-market sign-off?

**Coordination:**

- Is Yuki's fleet visible to Ingrid (rate-FX linkages), Quinn (cross-archetype FX factors), David (firm-level), Sasha (FX-vol crossover), Rafael (macro-theme FX expression) at the right level of detail?
- Are cross-desk correlation, promotion alerts, feature sharing first-class?
- Is the rate-FX shared feature library kept in sync with Ingrid's desk?
- Does the platform structure the EM political-risk briefing to David's office as a deliverable?

**Cross-cutting:**

- Is lineage end-to-end (data → feature → model → strategy → trade → P/L)?
- Is reproducibility guaranteed?
- Are audit trails non-negotiable?
- Are EM-political, capital-control, intervention, and fixing surfaces all first-class — not buried in sub-tabs?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
