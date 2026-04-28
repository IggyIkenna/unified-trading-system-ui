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
