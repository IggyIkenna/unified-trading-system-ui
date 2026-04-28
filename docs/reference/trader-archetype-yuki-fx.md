# Trader Archetype — Yuki Nakamura (Senior FX Trader, G10 + EM)

A reference profile of a top-performing FX trader at a top-5 firm. Used as a yardstick for what an ideal **foreign exchange** terminal must support. This document deliberately avoids any reference to our current platform — it describes the **ideal world**.

For the underlying four-phase trader workflow, see [manual-trader-workflow.md](manual-trader-workflow.md).
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

For each cell:

- **Current spot.**
- **Color-coded % move today / week / month.**
- **Click to drill into chart of that pair.**
- **z-score of move** vs realized vol — is this an unusual move?
- **Click to enter trade** with the cross pre-populated.

### Multi-pair charts

- Multi-TF (M5 / H1 / H4 / D1 / W1) of focus pairs.
- Volume profile (futures-derived for OTC).
- Anchored VWAP from key dates (post-FOMC, post-intervention).
- Indicators: moving averages, RSI, Bollinger, Ichimoku (popular in FX).

### Carry & forward dashboard

- **Overnight forward points** per pair — the daily carry cost.
- **Annualized carry** by pair — implied yield from forward curves.
- **Carry-to-vol ratio** — Sharpe-like measure for carry trades.
- **Forward curves** — points by tenor (1w, 1m, 3m, 6m, 1y).
- **NDF curves** for non-deliverable currencies (CNY, INR, BRL, KRW, TWD).
- **Cross-currency basis** — EURUSD basis swap, indicates dollar funding stress.
- **Fixing levels** — WMR 4pm London, ECB 1:15pm, NY 10am, Tokyo 9:55am.

### Vol surface

Crossover with Sasha but FX-specific:

- **Implied vol per pair** by tenor (overnight, 1w, 2w, 1m, 2m, 3m, 6m, 1y).
- **ATM vol vs realized vol cones.**
- **Risk-reversals** — 25Δ RR, key sentiment indicator (fear of one-side moves).
- **Butterflies** — 25Δ BF, kurtosis pricing.
- **Strangles, straddles** at various deltas.
- **Vol surface deltas** — how surface has moved vs yesterday.

### Macro inputs

FX is highly macro-sensitive:

- **Rate differentials** — 2y / 5y / 10y yield differentials per pair (e.g. US 10y vs JP 10y for USDJPY).
- **Central bank policy paths** from OIS curves.
- **Real yield differentials** — often more predictive than nominal.
- **Equity correlation** — risk-on / risk-off proxy.
- **Commodities** — oil for CAD, NOK; gold for AUD, ZAR; iron ore for AUD; ag prices for BRL.
- **Cross-asset vol** — VIX, MOVE, oil vol — regime indicator.

### Central bank tracker

- **Meeting calendar** with countdown.
- **Implied policy path** per central bank.
- **Hawk/dove tag** of recent speeches.
- **Intervention history** — BoJ, SNB, PBoC, EM central banks. With levels.
- **FX reserves trends** — increasing reserves → potential intervention to weaken own currency.

### Economic data calendar

- **Per country, per release** — CPI, GDP, retail sales, employment, trade balance, PMIs.
- **Surprise indices** — Citi Economic Surprise per region.
- **Pre-release positioning** — futures positioning, options skew.

### Positioning data

- **CFTC IMM positioning** — leveraged-fund and asset-manager positioning by currency future.
- **Real-money flows** — sell-side intel on corporate / asset-manager flow.
- **Retail FX positioning** (e.g. OANDA, FXCM data) — often a contrarian indicator.
- **Risk reversals & put/call skew** — options-implied positioning.

### EM-specific surfaces

- **Capital control news** by country.
- **NDF onshore/offshore deviation** — onshore CNY vs CNH; gap signals stress.
- **Sovereign CDS spreads** — EM credit risk.
- **Sovereign debt auctions** — local-currency debt issuance.
- **EM political news** — election cycles, IMF programs, IMF meetings.

### Sell-side research

- **Morning notes** from FX strategists (G10 + EM).
- **Trade ideas** with track records.
- **Fixing flow color** — flow expectations into key fixings.

**Layout principle for Decide:** the FX matrix is constantly scanned. Carry dashboard sits next to it. Vol surface and macro context are peripheral but frequently consulted. EM specifically gets its own dashboard layer for capital controls, NDFs, political news.

---

## Phase 2: Enter

FX execution is venue-fragmented and product-fragmented. The terminal must unify.

### Spot ticket

- **Pair selector** with autocomplete.
- **Side, size, price-or-market.**
- **Expressed in either base notional or quote notional** (toggle).
- **Live streaming prices from multiple LPs** — show top 5 bid / top 5 offer, with LP attribution.
- **Best price aggregation** — "smart order router" that hits the best LP.
- **Last look awareness** — venues with last-look risk flagged.
- **Pre-trade preview:** position impact per currency, P/L impact at typical bid-ask, margin impact.
- **Algos:** TWAP, VWAP, IS, **fixing algos** (target a specific fixing level), peg-to-mid.

### Forward / outright ticket

- **Pair, side, size, settlement date** (or tenor).
- **Forward points** displayed and editable.
- **Implied carry** shown.
- **All-in rate** = spot + forward points.
- Multiple LP quotes for forward, RFQ-style.

### FX swap ticket

A swap = simultaneously buy spot and sell forward (or vice versa). Used for funding / hedging:

- **Near leg, far leg** specifications.
- **Swap points** as the price.
- **Funding implications** — am I borrowing this currency or lending it?

### NDF ticket

For non-deliverable EM currencies (CNY, KRW, BRL, INR, TWD):

- **Pair, side, size, fixing date, settlement date.**
- **NDF curve points** displayed.
- **Onshore vs offshore deviation** flagged.
- **RFQ workflow** — multiple bank quotes.

### FX options ticket

Crossover with Sasha but optimized for FX:

- **Multi-leg structures** — straddle, strangle, risk reversal, butterfly, calendar.
- **Quoted in vol** primarily.
- **Greeks displayed** in pair-specific terms.
- **Delta-hedging in spot** integrated.

### Cross / synthetic ticket

For currencies not directly quoted:

- **Cross-trade** built from two USD pairs (e.g. EURJPY = EURUSD \* USDJPY).
- **Direct-vs-synthetic** comparison — sometimes the synthetic is cheaper.

### Fixing trade workflow

- **Fixing-targeted orders** — execute at WMR 4pm or other.
- **Fixing window approach UI** — countdown, depth around fixing, expected impact.
- **Fixing flow indicators** — net buy/sell flow expected at fixing.

### Block trade / RFQ

- **RFQ to dealer panel** for size.
- **Quote aggregation** with response-time latency per LP.
- **One-click execute.**
- **Anonymized vs disclosed** RFQ depending on relationship.

### Intervention awareness

- **Intervention zones** flagged on chart for pairs with active intervention history (USDJPY especially).
- **Pre-trade warning** — "BoJ has intervened above 158 in past 3 months."

### Pre-trade compliance

- **Position limits per currency.**
- **Country / sanctions lists.**
- **Reporting thresholds.**
- **Counterparty limits** for OTC products.

### Hotkeys

- Buy / sell at top of book.
- Cancel all on pair.
- Flatten pair.
- Roll forward (close near, open far on same notional).

**Layout principle for Enter:** the spot and forward tickets are central. NDF and options are first-class for EM and cross-asset users. Fixing workflow integrated. Multiple-LP aggregation visible.

---

## Phase 3: Hold / Manage

FX positions evolve through carry, spot moves, and event-driven repricing. Yuki manages **currency exposures**, not pair positions.

### Positions blotter — currency-decomposed

Critical for FX. A list of pair positions doesn't show the real exposure. Decompose:

- **Net delta per currency** — long EUR, short USD, short JPY, long AUD, etc.
- Aggregated from all pair positions.
- Plus options delta.
- Plus forward / NDF settlement obligations.

A secondary view shows positions by pair for execution-oriented work.

### Forward / settlement ladder

- **Settlement obligations by date** — what currencies must I pay / receive on T+1 / T+2 / T+3 / further?
- **Net settlement per date per currency.**
- **Funding cost** for any currency where I'll be short on settlement.

### NDF positions

- **Open NDFs by fixing date.**
- **Onshore vs offshore tracker** for each.
- **Pre-fixing risk** as fixing approaches.

### Live PnL — FX-style decomposition

- **Spot move PnL** — directional.
- **Carry PnL** — overnight roll, pip-by-pip.
- **Vol PnL** — for options exposures.
- **Fixing PnL** — slippage vs target fixing rate.
- **Funding cost** — if positions are funded with currency borrows.
- **Per-currency P/L** — alongside per-pair P/L.

### Risk panel

- **Currency exposures** with limits.
- **Pair-level VaR.**
- **Vol exposure** (vega) by pair if options-heavy.
- **Carry exposure** — total daily carry P/L (positive or negative).
- **Stress scenarios:**
  - DXY +3%.
  - Risk-off shock — JPY +5%, CHF +3%, EM -5%.
  - EM-specific shocks — BRL -10%, MXN -5%, ZAR -8%.
  - Intervention scenarios — BoJ intervenes at USDJPY 162.
  - Central bank surprise — 50bps unexpected hike/cut.
- **Concentration limits** — single-currency, single-pair.
- **Counterparty exposure** for OTC forwards / options / NDFs.
- **Margin / collateral** consumption.

### Carry monitor

- **Total daily carry P/L** running.
- **Carry concentration** — is most P/L coming from one funding currency (e.g. JPY-funded carry trade)?
- **Carry-to-vol ratio** of book.
- **Typical carry trade unwind risk** — when JPY rallies in risk-off, this is the pain trade.

### Fixing approach surface

- For trades targeting a fixing:
  - Time-to-fix countdown.
  - Current depth around expected fix.
  - Best execution path.
  - Recent fixings' realization vs WMR-published rate.

### Alerts

- **Spot-level alerts** — multi-condition.
- **Carry decay alerts** — funding cost increasing on a position.
- **Intervention alerts** — currency approaching historical intervention zone.
- **Fixing alerts** — countdown.
- **Central bank alerts** — speakers, decisions.
- **EM political alerts** — capital control changes, election results.
- **Vol regime alerts** — IV spikes / collapses.
- **Cross-asset alerts** — equity routs, oil moves affecting linked currencies.
- **Risk limit alerts.**
- **Counterparty alerts.**

### Trade journal

- Per trade / theme: thesis, expected catalyst, stop, time horizon.
- Carry-trade-specific journals — when does the funding currency rally become my problem.

### Communications

- **Bloomberg / Symphony chat** integrated.
- **Sell-side FX desk chat** — flow color, axes, fixing flow.
- **EM specialist chat** for political risk, capital controls.
- **Internal economist** notes for relevant central banks.

### Heatmap

- Currency grid colored by exposure × today's move.
- Quick read on what's working.

### Kill switches

- **Reduce FX exposure to target.**
- **Flatten by currency** — close all positions long/short a specific currency.
- **Hedge to neutral** — buy-back of dollar exposure, etc.
- **Cancel all working orders.**

**Layout principle for Hold:** currency-decomposed exposure is foveal (not pair-list). Carry monitor and fixing approach are critical FX-specific surfaces.

---

## Phase 4: Learn

FX post-trade emphasizes **carry vs spot decomposition**, **session attribution**, and **execution quality** in a fragmented market.

### Trade history

- Every fill: pair, side, size, price, venue, LP, all-in cost (vs mid at decision).
- Fixings settled at, with deviation from realized fix.
- Tagged by strategy (directional, carry, fixing flow, event, vol).

### PnL attribution

- **Spot vs carry vs vol decomposition** per trade.
- **By currency** — which currencies generate alpha.
- **By pair** — where execution is best.
- **By session** — Tokyo vs London vs NY skill.
- **By regime** — risk-on / risk-off.
- **By event** — FOMC / ECB / BoJ trades, NFP trades, intervention trades.

### Performance metrics

- Sharpe, Sortino, Calmar.
- **Currency hit rate** — per-currency win rate.
- **Carry capture** — what fraction of available carry was earned.
- **Vol-adjusted return** per currency.

### Carry trade analytics

- **Carry P/L vs spot loss** — was carry sufficient compensation?
- **Drawdown days** — when carry trades unwound, how bad?
- **Time-to-recovery** after carry unwinds.

### Fixing analytics

- **Fixing slippage** — average vs WMR realized.
- **By fixing window** (London 4pm vs ECB vs NY).
- **Fixing-flow direction** prediction accuracy.

### Execution quality / TCA

- **Spot TCA** — fill vs mid, by venue and LP.
- **LP scorecard** — fill rate, response latency, last-look rejection rate.
- **Forward / NDF TCA** — fill vs theoretical (forward = spot + points).
- **Block / RFQ TCA** — best-quote frequency by dealer.

### Venue analytics

- **Venue performance** — spread captured / paid by venue.
- **Fragmentation cost** — would single-venue execution have been worse?

### EM-specific analytics

- **NDF execution quality.**
- **Capital control event response** — did I exit in time?
- **Onshore vs offshore P/L** — for currencies traded both ways.

### Behavioral analytics

- **Session bias** — do I make money in some sessions and lose in others?
- **Carry-trade discipline** — did I cut on time when funding cost rose?
- **Fixing discipline** — did I trade _the_ fixing or _around_ it?

### Reports

- Daily P/L commentary.
- Weekly portfolio review.
- Monthly attribution by currency / pair / session / event.
- Quarterly investor / committee letter contribution.
- Compliance / regulatory filings.

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
- Is fixing workflow (WMR, ECB, NY) integrated?
- Does the terminal model sessions (Tokyo / London / NY) explicitly?
- Is EM treated with appropriate respect — NDFs, capital controls, political news, intervention?

Gaps are not necessarily defects — they may be deliberate scope decisions — but they should be **known** gaps, not **accidental** ones.
